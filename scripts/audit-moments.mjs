import fs from 'node:fs/promises';
const base=process.env.SIDEQUEST_AUDIT_URL||'http://127.0.0.1:5173';
const results=[];
for(const [name,input] of [['all',{}],['online',{access:'online'}],['online-drops',{access:'online',category:'drops'}],['tokyo',{access:'tokyo'}],['Nujabes',{seeds:[{id:'E11125AF-936B-4935-B607-F2DA2E6A6B92',name:'Nujabes',type:'artist',feeling:'love'}]}]]){
 const started=Date.now(),r=await fetch(base+'/api/moments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal:AbortSignal.timeout(240000)}),b=await r.json();
 if(!r.ok||!Array.isArray(b.items))throw Error(name+' '+r.status);
 if(b.items.some(o=>o.kind==='place'||/listing published/i.test(o.actionLabel||'')))throw Error('Permanent place or shop listing entered '+name);
 if(input.access==='online'&&b.items.some(o=>!o.online))throw Error('Physical listing entered online-only view');
 if(input.category==='drops'&&b.items.some(o=>o.kind!=='release'))throw Error('Event entered drop filter');
 const row={name,seconds:(Date.now()-started)/1000,total:b.total,online:b.items.filter(o=>o.online).length,byKind:b.items.reduce((a,o)=>(a[o.kind]=(a[o.kind]||0)+1,a),{}),sources:[...new Set(b.items.map(o=>o.source))],examples:b.items.slice(0,5).map(o=>({title:o.englishTitle||o.title,kind:o.kind,source:o.source,url:o.url,online:o.online,start:o.start,end:o.end,startsAt:o.startsAt,endsAt:o.endsAt,match:o.matchLevel,reasons:o.reasons})),health:b.health};
 results.push(row);console.log(name,JSON.stringify({total:row.total,online:row.online,seconds:row.seconds}));
}
await fs.writeFile('evaluation/event-first-live.json',JSON.stringify({at:new Date().toISOString(),base,method:'Live functional checks using official catalog records and Qloo. Counts are a snapshot, not a human recommendation score, stock guarantee or measure of hype.',results},null,2)+'\n');
