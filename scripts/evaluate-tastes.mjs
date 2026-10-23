// Run against a local SideQuest preview; no production visitor profile or cookies.
import {mkdir,writeFile} from 'node:fs/promises';
import {SAMPLE_TASTES,compareShortlists} from '../lib/taste-bench.ts';
const base=process.argv[2]||'http://127.0.0.1:5173';
if(!/^http:\/\/(?:localhost|127\.0\.0\.1):\d+$/.test(base))throw Error('Use a local SideQuest preview URL.');
const results=[];
for(const profile of SAMPLE_TASTES){const started=Date.now();try{const r=await fetch(base+'/api/taste/sample',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({profile:profile.id,mode:'explore'}),signal:AbortSignal.timeout(90000)});const data=await r.json();results.push({profile:profile.id,name:profile.name,activity:profile.activity,status:r.status,elapsedMs:Date.now()-started,...data});console.log(profile.id,r.status,data.metrics?.count??data.error);}catch(e){results.push({profile:profile.id,name:profile.name,activity:profile.activity,status:0,error:e.message});console.log(profile.id,'failed');}}
const pairs=SAMPLE_TASTES.filter((p,i)=>SAMPLE_TASTES.findIndex(v=>v.id===p.pair)>i).map(p=>{const a=results.find(r=>r.profile?.id===p.id||r.profile===p.id),b=results.find(r=>r.profile?.id===p.pair||r.profile===p.pair);return {a:p.id,b:p.pair,...(a?.places&&b?.places?compareShortlists(a.places,b.places):{unavailable:true})};});
await mkdir('.local/evaluation',{recursive:true});await writeFile('.local/evaluation/latest-full.json',JSON.stringify({checkedAt:new Date().toISOString(),results,pairs},null,2));
const compact={checkedAt:new Date().toISOString(),mode:'explore',scope:'Qloo places only. Fixed Across Tokyo / today / flexible budget, explicit sample activity. Fictional samples; no visitor cookies or profile. Metrics are diagnostics, not a human taste-quality pass.',results:results.map(r=>({...r,places:r.places?.map(p=>({id:p.id,name:p.name,category:p.category,popularity:p.popularity,signals:p.signals})),fever:undefined})),pairs};
await mkdir('evaluation',{recursive:true});await writeFile('evaluation/latest.json',JSON.stringify(compact,null,2));console.log('Saved evaluation/latest.json');
