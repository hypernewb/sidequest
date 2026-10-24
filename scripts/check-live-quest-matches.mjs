import fs from 'node:fs/promises';
const origin=process.env.SIDEQUEST_TEST_ORIGIN||'http://127.0.0.1:5173';
const old=JSON.parse(await fs.readFile('.local/quest-benchmark/before.json','utf8'));
const cases=[['Nujabes','sound'],['Nujabes','visual'],['Slayer','sound'],['Akira','print'],['MUJI','design'],['Pokemon FireRed Version','games']],results=[];
for(let i=0;i<cases.length;i+=2){
 const pairs=await Promise.all(cases.slice(i,i+2).map(async([seed,focus])=>{
  const choice=old.profiles.find(p=>p.name===seed).seed.id;
  const response=await fetch(origin+'/api/quests',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({seed,focus,choice,date:'2026-10-25'})});
  const b=await response.json();await fs.writeFile('.local/live-quest-'+seed.replaceAll(' ','')+'-'+focus+'.json',JSON.stringify(b));
  if(response.status!==200||!b.quest)throw Error('Quest failed for '+seed);
  if(seed!=='Slayer'&&b.leads?.some(e=>e.title==='DEXCORE'))throw Error('Metal genre conflict returned for '+seed);
  return {seed,focus,status:response.status,stops:b.quest.stops.map(s=>({name:s.item.title,reason:s.reason})),leads:b.leads?.map(e=>({title:e.title,start:e.start,reason:e.reason}))};
 }));results.push(...pairs);for(const p of pairs)console.log(JSON.stringify(p));
}
await fs.writeFile('evaluation/quest-live-check-2026-10-25.json',JSON.stringify({method:'Live local app requests with current official catalog. Functional check, not a relevance score or baseline comparison.',results},null,2));
