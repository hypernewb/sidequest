// Private provider snapshots stay in .local. Replays use the identical API responses.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {build} from 'esbuild';
const dir='.local/quest-benchmark';await fs.mkdir(dir,{recursive:true});
const mode=process.argv[2]||'before', live=mode==='before';
const bundle=await build({stdin:{contents:"export {rankedCurated,curatedOpportunity,checkVenuePage} from './lib/curated-scout.ts';export {planScout,prepareScout} from './lib/scout.ts';export {questSeed} from './lib/quest-seeds.ts';export {VENUES} from './lib/curated-venues.ts';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
await fs.writeFile(dir+'/engine.mjs',bundle.outputFiles[0].text);
const {rankedCurated,curatedOpportunity,checkVenuePage,planScout,questSeed,VENUES}=await import('../'+dir+'/engine.mjs?t='+Date.now());
const nativeFetch=globalThis.fetch;
globalThis.fetch=async(url,options)=>{const name=crypto.createHash('sha256').update(String(url)).digest('hex'),path=dir+'/'+name+'.json';let record;try{record=JSON.parse(await fs.readFile(path,'utf8'));}catch{if(!live)throw Error('Missing frozen response '+url);const r=await nativeFetch(url,options);record={url:String(url),status:r.status,headers:Object.fromEntries(r.headers),body:await r.text()};await fs.writeFile(path,JSON.stringify(record));}return new Response(record.body,{status:record.status,headers:record.headers});};
const key=(await fs.readFile('.dev.vars','utf8')).match(/^QLOO_API_KEY\s*=\s*(.*)$/m)[1].trim().replace(/^["']|["']$/g,'');
const now=new Date('2026-10-25T03:00:00Z'),date='2026-10-25';
const cases=[['Nujabes','artist'],['Slayer','artist'],['Aphex Twin','artist'],['MUJI','brand'],['Spirited Away','movie'],['Akira','movie'],['Pokemon FireRed Version','video_game'],['Comme des Garcons','brand']];
const profiles=[];
for(const [name,type] of cases){try{
 const u=new URL('https://hackathon.api.qloo.com/search');u.searchParams.set('query',name);u.searchParams.set('take','10');const search=await (await fetch(u,{headers:{'X-Api-Key':key}})).json();
 const choices=(search.results||[]).map(questSeed).filter(Boolean);const seed=choices.find(e=>e.name.toLowerCase()===name.toLowerCase()&&(e.type===type||type==='video_game'&&e.type==='videogame'));
 if(!seed){profiles.push({name,error:'Exact seed unavailable',choices:choices.map(e=>({name:e.name,type:e.type}))});continue;}
 const p={intent:'mix',direction:'any',format:'places',date,days:1,budget:'any',unknownPrice:true,seeds:[{...seed,feeling:'love'}],exclude:[]};
 const items=await rankedCurated(p,key,seed,now);
 // Common pool for the baseline includes all resolved venues, not only Qloo's returned hits.
 const all=[];const ids=VENUES.filter(v=>v.qlooId&&!v.eventOnly).map(v=>v.qlooId);
 for(let i=0;i<ids.length;i+=40){const u=new URL('https://hackathon.api.qloo.com/entities');u.searchParams.set('entity_ids',ids.slice(i,i+40).join(','));const b=await (await fetch(u,{headers:{'X-Api-Key':key}})).json();for(const raw of b.results||[]){const o=curatedOpportunity({...raw,query:{affinity:0}},seed,now.toISOString());if(o)all.push(o);}}
 let checked;
 try{checked=JSON.parse(await fs.readFile(dir+'/checked.json','utf8'));}catch{checked={};for(let i=0;i<all.length;i+=5)await Promise.all(all.slice(i,i+5).map(async o=>{try{checked[o.id]=await checkVenuePage(o,fetch,now,date);}catch{checked[o.id]=null;}}));await fs.writeFile(dir+'/checked.json',JSON.stringify(checked));}
 const usable=rows=>rows.filter(o=>checked[o.id]).map(o=>({...o,hours:checked[o.id].hours}));
 const result=planScout(usable(items),p,now);
 profiles.push({name,seed,p,items,all:usable(all),plan:result});console.log(name,items.length,result.stops.map(s=>s.item.title).join(' -> ')||'NO ROUTE');
}catch(e){profiles.push({name,error:e.message});console.log(name,'ERROR',e.message);}}
await fs.writeFile(dir+'/'+mode+'.json',JSON.stringify({date,now:now.toISOString(),profiles},null,2));

