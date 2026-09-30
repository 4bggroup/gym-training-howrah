import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const data=process.env.LOHAA_DATA_DIR?path.resolve(process.env.LOHAA_DATA_DIR):path.join(base,'storage');const source=path.join(data,'leads.jsonl');
if(!fs.existsSync(source)){console.log('No enquiries have been received yet.');process.exit(0);}
const keys=['reference','createdAt','name','phone','email','area','goal','programme','time','message','consent','status','notes'];
function csv(value){let s=String(value??'');if(/^[=+@\-\t\r\n]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
const statesPath=path.join(data,'lead-status.json');const states=fs.existsSync(statesPath)?JSON.parse(fs.readFileSync(statesPath,'utf8')):{};
const rows=fs.readFileSync(source,'utf8').trim().split('\n').filter(Boolean).map(line=>{const row=JSON.parse(line);return {...row,status:states[row.reference]?.status||'New',notes:states[row.reference]?.notes||''};});const output=path.join(data,'leads-export.csv');fs.writeFileSync(output,'\uFEFF'+[keys.join(','),...rows.map(row=>keys.map(k=>csv(row[k])).join(','))].join('\r\n'),{mode:0o600});console.log(`Exported ${rows.length} enquiries to ${output}`);
