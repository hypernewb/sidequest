import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import type {RunEvent} from '../lib/quest-run.ts';
import type {Preferences} from '../lib/opportunities.ts';
import {fixtureHtml,seedId} from './curated-fixtures.ts';

// Three walkable stops by Shimokitazawa station and one by the Inokashira Line platform in Shibuya.
const venues:Record<string,[number,number,string]>={
 'AB1EA378-F4C8-4BDA-8F49-446740AB85F5':[35.6612,139.6688,'hagiso.com'],
 'DF176A71-AD79-480C-B79D-3F7A50017D91':[35.6620,139.6676,'reload-shimokita.com'],
 '175F1BBD-E883-4291-AB31-3806E330686E':[35.6625,139.6690,'www.scaithebathhouse.com'],
 'B15FE794-D40A-4FA9-966D-BC4F341D450A':[35.6596,139.6978,'shibuyabooks.co.jp']
};
const hours=Object.fromEntries(['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(d=>[d,[{opens:'10:00',closes:'22:00'}]]));
const entity=(id:string)=>({entity_id:id,name:id,location:{lat:venues[id][0],lon:venues[id][1]},properties:{address:'Fixture address, Tokyo',geocode:{country_code:'JP',admin1_region:'Tokyo'},hours},query:{affinity:.9}});

test('a venue-page failure that breaks the walking loop retries the train corridor',async t=>{
 // lib/qloo.ts uses an extensionless import, so bundle the scout the way the route tests do.
 const out=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'sq-')),'scout.mjs');
 await build({stdin:{contents:"export {scoutCurated} from './lib/curated-scout.ts';",resolveDir:process.cwd(),loader:'ts'},bundle:true,outfile:out,format:'esm',platform:'node'});
 const {scoutCurated}=await import(pathToFileURL(out).href) as typeof import('../lib/curated-scout.ts');
 t.mock.method(globalThis,'fetch',async(input:string|URL)=>{
  const u=new URL(String(input));
  if(u.hostname!=='hackathon.api.qloo.com')return u.hostname==='www.scaithebathhouse.com'?new Response('Unavailable',{status:503}):new Response(fixtureHtml,{headers:{'Content-Type':'text/html'}});
  const ids=(u.searchParams.get('entity_ids')||u.searchParams.get('filter.results.entities')||'').split(',');
  if(u.pathname==='/entities')return Response.json({results:[...(ids.includes(seedId)?[{entity_id:seedId,name:'Seed',tags:[{name:'Architecture',type:'urn:tag:style'},{name:'Design',type:'urn:tag:style'}]}]:[]),...ids.filter(id=>venues[id]).map(entity)]});
  if(u.searchParams.get('filter.type')==='urn:entity:place')return Response.json({results:{entities:ids.filter(id=>venues[id]).map(entity)}});
  return Response.json({results:{tags:[],entities:[]}});
 });
 const p:Preferences={intent:'mix',direction:'any',format:'places',date:'2026-10-27',days:1,budget:'any',unknownPrice:true,seeds:[],exclude:[]};
 const events:RunEvent[]=[];
 const plan=await scoutCurated(p,'fixture',{id:seedId,name:'Seed',type:'artist',description:'',tags:[]},new Date('2026-10-26T02:00:00Z'),false,{report:e=>events.push(e)});
 const details=events.map(e=>e.detail);
 assert.ok(details.some(d=>/Could not read SCAI THE BATHHOUSE/.test(d)),details.join('\n'));
 assert.ok(details.some(d=>/Train corridor found/.test(d)),details.join('\n'));
 assert.equal(plan.stops.length,3);
 assert.ok(plan.stops.some(s=>s.item.id==='B15FE794-D40A-4FA9-966D-BC4F341D450A'));
 assert.match([...plan.stops.map(s=>s.transit),plan.returnTransit].filter(Boolean).join(' '),/Keio Inokashira Line/);
});
