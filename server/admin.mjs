import fs from 'node:fs';
import path from 'node:path';
import {randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';

export const statuses=['New','Contacted','Visit scheduled','Joined','Closed'];
export function createAdmin({storage,headers}){
 const configPath=path.join(storage,'admin-config.json'),statePath=path.join(storage,'lead-status.json');
 let config=null;
 if(process.env.LOHAA_ADMIN_PASSWORD){
  if(process.env.LOHAA_ADMIN_PASSWORD.length<12)throw new Error('LOHAA_ADMIN_PASSWORD must contain at least 12 characters.');
  const salt=randomBytes(16).toString('hex');config={salt,hash:scryptSync(process.env.LOHAA_ADMIN_PASSWORD,salt,64).toString('hex')};
 }else if(fs.existsSync(configPath)){config=JSON.parse(fs.readFileSync(configPath,'utf8'));if(!/^[a-f0-9]{32}$/.test(config.salt)||!/^[a-f0-9]{128}$/.test(config.hash))throw new Error('Invalid private administrator configuration. Run setup-admin again.');}
 const sessions=new Map(),attempts=new Map();
 const secure=process.env.PUBLIC_ORIGIN?.startsWith('https://')===true;
 function cookie(token,age=28800){return `lohaa_admin=${token}; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=${age}${secure?'; Secure':''}`;}
 function respond(res,code,data,extra={}){res.writeHead(code,{...headers,'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...extra});res.end(JSON.stringify(data));}
 function getSession(req){const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('lohaa_admin='))?.slice(12);const session=sessions.get(token);if(!session||session.expires<Date.now()){if(token)sessions.delete(token);return null;}return{...session,token};}
 function originOK(req){if(!req.headers.origin)return true;try{const incoming=new URL(req.headers.origin);return process.env.PUBLIC_ORIGIN?incoming.origin===process.env.PUBLIC_ORIGIN:incoming.host===req.headers.host;}catch{return false;}}
 async function body(req){if((req.headers['content-type']||'').split(';')[0].trim()!=='application/json')throw Object.assign(new Error('JSON is required.'),{status:415});let raw='',count=0;for await(const chunk of req){count+=chunk.length;if(count>16000)throw Object.assign(new Error('Request too large.'),{status:413});raw+=chunk;}try{const data=JSON.parse(raw);if(!data||typeof data!=='object'||Array.isArray(data))throw Error();return data;}catch{throw Object.assign(new Error('Invalid request.'),{status:400});}}
 function rows(){const f=path.join(storage,'leads.jsonl');return fs.existsSync(f)?fs.readFileSync(f,'utf8').split('\n').filter(Boolean).map(line=>JSON.parse(line)):[];}
 function states(){return fs.existsSync(statePath)?JSON.parse(fs.readFileSync(statePath,'utf8')):{};}
 function joined(){const state=states();return rows().map(row=>({...row,status:state[row.reference]?.status||'New',notes:state[row.reference]?.notes||'',version:state[row.reference]?.version||0,updatedAt:state[row.reference]?.updatedAt||null}));}
 function limited(ip){const now=Date.now();for(const [key,v]of attempts)if(v.until<now)attempts.delete(key);if(attempts.size>=2000&&!attempts.has(ip))return true;const v=attempts.get(ip)||{count:0,until:now+900000};v.count++;attempts.set(ip,v);return v.count>5;}
 function persistState(data){const temporary=statePath+'.tmp';const fd=fs.openSync(temporary,'w',0o600);try{fs.writeSync(fd,JSON.stringify(data));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}fs.renameSync(temporary,statePath);}
 return async function handleAdmin(req,res,pathname){
  if(!pathname.startsWith('/api/admin/'))return false;
  try{
   if(!['GET','POST','PATCH'].includes(req.method)){respond(res,405,{error:'Method not allowed.'});return true;}
   if(req.method!=='GET'&&!originOK(req)){respond(res,403,{error:'Origin not allowed.'});return true;}
   if(pathname==='/api/admin/login'&&req.method==='POST'){
    if(!config){respond(res,503,{error:'Administrator access is not configured. Run SETUP-ADMIN-WINDOWS.bat, then restart the server.'});return true;}
    const ip=req.socket.remoteAddress||'unknown';if(limited(ip)){respond(res,429,{error:'Too many sign-in attempts. Wait 15 minutes and try again.'});return true;}
    const data=await body(req);const password=typeof data.password==='string'?data.password:'';
    if(password.length>200||!timingSafeEqual(scryptSync(password,config.salt,64),Buffer.from(config.hash,'hex'))){respond(res,401,{error:'Incorrect password.'});return true;}
    attempts.delete(ip);for(const [key,value]of sessions)if(value.expires<Date.now())sessions.delete(key);if(sessions.size>=100)sessions.delete(sessions.keys().next().value);
    const token=randomBytes(32).toString('base64url'),csrf=randomBytes(32).toString('base64url');sessions.set(token,{csrf,expires:Date.now()+28800000});respond(res,200,{ok:true,csrf},{'Set-Cookie':cookie(token)});return true;
   }
   const session=getSession(req);if(!session){respond(res,401,{error:'Sign in to access leads.',configured:!!config});return true;}
   if(pathname==='/api/admin/session'&&req.method==='GET'){respond(res,200,{ok:true,csrf:session.csrf});return true;}
   if(req.method!=='GET'&&req.headers['x-csrf-token']!==session.csrf){respond(res,403,{error:'Please refresh and try again.'});return true;}
   if(pathname==='/api/admin/logout'&&req.method==='POST'){sessions.delete(session.token);respond(res,200,{ok:true},{'Set-Cookie':cookie('',0)});return true;}
   if(pathname==='/api/admin/leads'&&req.method==='GET'){
    const url=new URL(req.url,'http://localhost');const q=(url.searchParams.get('q')||'').trim().toLowerCase().slice(0,150),status=url.searchParams.get('status')||'';const all=joined();const counts=Object.fromEntries(statuses.map(s=>[s,all.filter(r=>r.status===s).length]));
    const filtered=all.filter(r=>(!status||r.status===status)&&(!q||[r.name,r.phone,r.email,r.area,r.reference,r.programme].some(v=>String(v||'').toLowerCase().includes(q)))).reverse();
    const totalPages=Math.max(1,Math.ceil(filtered.length/25));const page=Math.min(totalPages,Math.max(1,Number.parseInt(url.searchParams.get('page')||'1',10)||1));respond(res,200,{leads:filtered.slice((page-1)*25,page*25),page,totalPages,total:filtered.length,allTotal:all.length,counts});return true;
   }
   if(pathname==='/api/admin/export'&&req.method==='GET'){
    const fields=['reference','createdAt','name','phone','email','area','goal','programme','time','message','status','notes'];const safe=value=>{let s=String(value??'');if(/^\s*[=+@-]|^[\t\r\n]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};const csv='\uFEFF'+[fields.join(','),...joined().map(r=>fields.map(k=>safe(r[k])).join(','))].join('\r\n');
    res.writeHead(200,{...headers,'Cache-Control':'no-store','Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="LOHAA-leads.csv"'});res.end(csv);return true;
   }
   if(pathname.startsWith('/api/admin/leads/')&&req.method==='PATCH'){
    const reference=decodeURIComponent(pathname.slice('/api/admin/leads/'.length));if(!rows().some(r=>r.reference===reference)){respond(res,404,{error:'Enquiry not found.'});return true;}
    const data=await body(req);if(!statuses.includes(data.status)||typeof data.notes!=='string'||data.notes.length>2000||!Number.isInteger(data.version)){respond(res,422,{error:'Choose a valid status and keep notes within 2,000 characters.'});return true;}
    const state=states(),current=state[reference]||{version:0};if(data.version!==current.version){respond(res,409,{error:'This lead changed in another session. Close this panel and refresh before editing.'});return true;}
    state[reference]={status:data.status,notes:data.notes.trim(),version:current.version+1,updatedAt:new Date().toISOString()};persistState(state);respond(res,200,{ok:true,...state[reference]});return true;
   }
   respond(res,404,{error:'Not found.'});return true;
  }catch(error){respond(res,error.status||500,{error:error.status?error.message:'Unable to complete this request. Please try again.'});return true;}
 };
}
