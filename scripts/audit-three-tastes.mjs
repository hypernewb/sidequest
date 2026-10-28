import fs from 'node:fs/promises';
const phase=process.argv[2]||'before';
const date=process.argv[3]||new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Tokyo'});
const base=process.env.SIDEQUEST_AUDIT_URL||'http://127.0.0.1:5173';
const results=[];
await fs.mkdir('.local/three-tastes',{recursive:true});
for(const [seed,focus] of [['Nujabes','sound'],['Slayer','sound'],['MUJI','design']]){
 const started=Date.now(),input={seed,focus,date,budget:'any',unknownPrice:true,askFollowup:false};
 try{
  const response=await fetch(base+'/api/quests',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/x-ndjson'},body:JSON.stringify(input),signal:AbortSignal.timeout(240000)});
  let text=await response.text();
  let first=text.trim().split('\n').map(s=>JSON.parse(s)).find(m=>m.type==='result')?.data;
  const expected=seed==='MUJI'?'brand':'artist',chosen=first?.choices?.find(c=>c.type===expected&&c.name.toLowerCase()===seed.toLowerCase());
  if(chosen){
   const retry=await fetch(base+'/api/quests',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/x-ndjson'},body:JSON.stringify({...input,choice:chosen.id}),signal:AbortSignal.timeout(240000)});
   text=await retry.text();
  }
  await fs.writeFile(`.local/three-tastes/${phase}-${seed}.ndjson`,text);
  const messages=text.trim().split('\n').map(s=>JSON.parse(s));
  const result=messages.find(m=>m.type==='result')?.data,quest=result?.quest;
  const record={seed,focus,status:response.status,seconds:Math.round((Date.now()-started)/1000),message:result?.message||messages.find(m=>m.type==='error')?.error,title:quest?.title,date:quest?.date,stops:quest?.stops.map(s=>({id:s.item.id,name:s.item.title,role:s.item.curation?.role,match:s.item.curation?.matchStrength,tags:s.item.curation?.matchedTags,reason:s.reason,mission:s.mission,arrival:s.arrival,departure:s.departure,source:s.item.url,hoursBasis:s.item.curation?.hoursBasis})),leads:result?.leads,notes:quest?.notes,changes:quest?.changes,decisions:messages.filter(m=>m.type==='stage').map(({stage,status,detail})=>({stage,status,detail}))};
  results.push(record);console.log(JSON.stringify(record));
 }catch(e){const record={seed,focus,error:e.message};results.push(record);console.log(JSON.stringify(record));}
}
const report={at:new Date().toISOString(),date,base,method:'Live functional audit of three named tastes with explicit activity choices. Before/after requests use changing upstream data and current Tokyo time. No human quality score or uplift claim.',results};
await fs.writeFile(`evaluation/three-tastes-${phase}.json`,JSON.stringify(report,null,2)+'\n');
