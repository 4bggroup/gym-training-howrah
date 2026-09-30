import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {createAdmin} from './admin.mjs';

const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const web=path.join(project,'website');
const storage=process.env.LOHAA_DATA_DIR?path.resolve(process.env.LOHAA_DATA_DIR):path.join(project,'storage');
fs.mkdirSync(storage,{recursive:true,mode:0o700});
const leadsPath=path.join(storage,'leads.jsonl');
const host=process.env.HOST||'127.0.0.1';const port=Number(process.env.PORT||3000);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp','.png':'image/png','.otf':'font/otf','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8'};
const buckets=new Map();
const goals=new Set(['Build strength','Improve stamina','Start training for the first time','Return after a break','Personal coaching']);
const times=new Set(['Morning','Afternoon','Evening','Flexible']);
const headers={'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'self'; img-src 'self' data:; font-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"};
function json(res,code,data){res.writeHead(code,{...headers,'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
function text(v,max){return typeof v==='string'?v.trim().slice(0,max):'';}
function limited(ip){const now=Date.now();for(const [k,v] of buckets)if(v.until<now)buckets.delete(k);if(buckets.size>5000)return true;const entry=buckets.get(ip)||{count:0,until:now+15*60*1000};entry.count++;buckets.set(ip,entry);return entry.count>10;}
const handleAdmin=createAdmin({storage,headers});
const server=http.createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(await handleAdmin(req,res,pathname))return;
  if(pathname==='/api/health'&&req.method==='GET')return json(res,200,{service:'lohaa-leads',ready:true});
  if(pathname==='/api/leads'){
   if(req.method!=='POST')return json(res,405,{error:'Use POST.'});
   if((req.headers['content-type']||'').split(';')[0].trim()!=='application/json')return json(res,415,{error:'JSON is required.'});
   // A JSON-only endpoint plus strict Origin checks prevents cross-site form submissions.
   if(req.headers.origin){let origin;try{origin=new URL(req.headers.origin);}catch{return json(res,403,{error:'Invalid origin.'});}const configured=process.env.PUBLIC_ORIGIN;if(configured?origin.origin!==configured:origin.host!==req.headers.host)return json(res,403,{error:'Origin not allowed.'});}
   if(limited(req.socket.remoteAddress||'unknown'))return json(res,429,{error:'Too many requests. Please try again in 15 minutes.'});
   let raw='',size=0;for await(const chunk of req){size+=chunk.length;if(size>12000){json(res,413,{error:'Request too large.'});req.resume();return;}raw+=chunk;}
   let body;try{body=JSON.parse(raw);}catch{return json(res,400,{error:'Invalid request.'});}
   if(!body||typeof body!=='object'||Array.isArray(body))return json(res,400,{error:'Invalid request.'});
   if(text(body.website,200))return json(res,400,{error:'Unable to accept this request.'});
   const lead={name:text(body.name,80),phone:text(body.phone,20).replace(/[\s-]/g,''),email:text(body.email,120),area:text(body.area,100),goal:text(body.goal,80),time:text(body.time,30),message:text(body.message,800),programme:text(body.programme,80),consent:body.consent===true};
   if(lead.name.length<2||! /^(?:\+91)?[6-9]\d{9}$/.test(lead.phone)||lead.area.length<2||!goals.has(lead.goal)||!times.has(lead.time)||!lead.consent)return json(res,422,{error:'Please check your name, mobile number, area, goal, time preference and consent.'});
   if(lead.programme&&!['Strength training','Personal coaching','Cardio & conditioning','Functional training'].includes(lead.programme))return json(res,422,{error:'Please choose an available programme.'});
   if(lead.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email))return json(res,422,{error:'Please enter a valid email address.'});
   lead.reference='LH-'+randomUUID();lead.createdAt=new Date().toISOString();lead.source='LOHAA website';
   // Stored outside the public document root. Success is returned only after the write completes.
   const fd=fs.openSync(leadsPath,'a',0o600);try{fs.writeSync(fd,JSON.stringify(lead)+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
   return json(res,201,{ok:true,reference:lead.reference});
  }
  if(!['GET','HEAD'].includes(req.method))return json(res,405,{error:'Method not allowed.'});
  let decoded;try{decoded=decodeURIComponent(pathname);}catch{return json(res,400,{error:'Invalid path.'});}
  const file=path.resolve(web,'.'+(decoded==='/'?'/index.html':decoded));
  if(!file.startsWith(web+path.sep)||decoded.includes('\0')||decoded.split('/').some(part=>part.startsWith('.')))return json(res,404,{error:'Not found.'});
  if(!fs.existsSync(file)||!fs.statSync(file).isFile())return json(res,404,{error:'Not found.'});
  res.writeHead(200,{...headers,'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','Content-Length':fs.statSync(file).size});
  if(req.method==='HEAD')res.end();else fs.createReadStream(file).on('error',()=>res.destroy()).pipe(res);
 }catch{if(!res.headersSent)json(res,500,{error:'The enquiry could not be saved. Please try again.'});else res.destroy();}
});
server.requestTimeout=20000;server.headersTimeout=10000;
server.listen(port,host,()=>console.log(`LOHAA ready: http://${host}:${port}\nLead records stay in the private storage folder. Press Ctrl+C to stop.`));
