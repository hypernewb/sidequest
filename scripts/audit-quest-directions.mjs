// Reuse the private, frozen Qloo and official-hours snapshot from the quest benchmark.
import fs from 'node:fs/promises';import crypto from 'node:crypto';import {build} from 'esbuild';
const dir='.local/quest-benchmark';
const result=await build({stdin:{contents:"export {rankedCurated} from './lib/curated-scout.ts';export {planScout} from './lib/scout.ts';export {focusFit} from './lib/quest-focus.ts';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
await fs.writeFile(dir+'/directions-engine.mjs',result.outputFiles[0].text);const {rankedCurated,planScout,focusFit}=await import('../'+dir+'/directions-engine.mjs');
globalThis.fetch=async url=>{const file=crypto.createHash('sha256').update(String(url)).digest('hex');const r=JSON.parse(await fs.readFile(dir+'/'+file+'.json','utf8'));return new Response(r.body,{status:r.status,headers:r.headers});};
const snapshot=JSON.parse(await fs.readFile(dir+'/before.json','utf8')),checked=JSON.parse(await fs.readFile(dir+'/checked.json','utf8'));
const runs=[];for(const name of ['Nujabes','Slayer','Aphex Twin','MUJI','Akira','Pokemon FireRed Version','Comme des Garcons']){
 const profile=snapshot.profiles.find(p=>p.name===name);for(const focus of ['any','sound','visual','print','design','games','collect']){
  const items=await rankedCurated(profile.p,'frozen-replay',profile.seed,new Date(snapshot.now),undefined,focus);
  const rows=items.filter(o=>checked[o.id]).map(o=>({...o,hours:checked[o.id].hours}));
  const plan=planScout(rows,profile.p,new Date(snapshot.now)),matched=focus==='any'||plan.stops.some(s=>focusFit(s.item,focus));
  if(plan.stops.length&&!matched)throw Error('Chosen direction omitted: '+name+' / '+focus);
  runs.push({seed:name,focus,stops:plan.stops.map(s=>({name:s.item.title,role:s.item.curation.role,reason:s.reason})),chosenActivityPresent:plan.stops.length?matched:null});
 }
}
await fs.writeFile('evaluation/quest-directions-2026-10-25.json',JSON.stringify({method:'Frozen Qloo/source snapshot from the eight-seed quest benchmark. No fresh provider responses, new event records or user-quality scores. Tests whether the selected activity appears and whether directions change the route.',date:snapshot.date,runs},null,2));
for(const seed of [...new Set(runs.map(r=>r.seed))])console.log(seed,JSON.stringify(runs.filter(r=>r.seed===seed).map(r=>({focus:r.focus,stops:r.stops.map(s=>s.name)}))));
