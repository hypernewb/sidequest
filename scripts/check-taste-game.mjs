// Exercises the real local API without changing any visitor's browser profile.
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.argv[2]||'http://127.0.0.1:5173';
if(!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base))throw Error('Use a local preview origin.');
const report={scope:'Functional API contrast and reaction check. Same current catalog and practical filters. No human quality ratings or causal lift claim.',profiles:[],editorial:[]};
const request=async(body)=>{const at=Date.now();const r=await fetch(base+'/api/moments',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify(body),signal:AbortSignal.timeout(35000)});const b=await r.json();if(!r.ok)throw Error(b.error||String(r.status));return {...b,milliseconds:Date.now()-at};};
const summarize=(b)=>({total:b.total,milliseconds:b.milliseconds,qloo:b.qloo?{status:b.qloo.status,mappedItems:b.qloo.mappedItems,candidateEntities:b.qloo.candidateEntities,scoredEntities:b.qloo.scoredEntities,failures:b.qloo.failures,cacheHits:b.qloo.cacheHits}:null,scout:b.scout,top:b.items.slice(0,8).map(o=>({id:o.id,title:o.title,kind:o.kind,source:o.source,discovery:o.discovery,reason:o.reasons?.find(r=>/Qloo|choices|earlier|previous/i.test(r))}))});
for(const [name,type]of [['Nujabes','artist'],['Iron Maiden','artist'],['Nintendo','brand']]){
 const search=await fetch(base+'/api/search?q='+encodeURIComponent(name)),found=await search.json();
 const seed=found.interests?.find(i=>i.name.toLowerCase()===name.toLowerCase()&&i.type===type);
 if(!seed){report.profiles.push({name,error:'Exact identity unavailable'});continue;}
 const seeds=[{id:seed.id,name:seed.name,type:seed.type,feeling:'love'}],b=await request({seeds});
 const result={name,...summarize(b)};
 const target=b.items.find(o=>o.catalogEntities?.length&&o.discovery!=='direct');
 if(target){const next=await request({seeds,context:{tags:[],reactions:[{id:target.id,action:'more'}]}});result.reaction={title:target.title,beforePosition:b.items.findIndex(o=>o.id===target.id)+1,afterPosition:next.items.findIndex(o=>o.id===target.id)+1,topChanged:b.items[0]?.id!==next.items[0]?.id,milliseconds:next.milliseconds};}
 report.profiles.push(result);console.log(name,b.total,b.qloo?.status,b.milliseconds+'ms');
}
for(const [direction,tags]of [['music',['jazz','soul']],['art',['photography','craft']],['objects',['illustration','books']]]){
 const b=await request({cachedOnly:true,context:{direction,tags:tags.map(name=>({id:'editorial:'+name,name,weight:1})),reactions:[]}});
 report.editorial.push({direction,...summarize(b)});console.log(direction,b.items[0]?.title,b.milliseconds+'ms');
}
report.overlap=report.profiles.flatMap((a,i)=>report.profiles.slice(i+1).filter(b=>a.top&&b.top).map(b=>({profiles:[a.name,b.name],sharedTopEight:a.top.filter(o=>b.top.some(v=>v.id===o.id)).length})));
report.checkedAt=new Date().toISOString();await mkdir('evaluation',{recursive:true});await writeFile('evaluation/TASTE-ENGINE-CHECK.json',JSON.stringify(report,null,2));console.log('Saved evaluation/TASTE-ENGINE-CHECK.json');
