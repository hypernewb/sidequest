import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {Miniflare} from 'miniflare';
import fs from 'node:fs';
import {readQuestRun,type RunEvent} from '../lib/quest-run.ts';
import {questShareText} from '../lib/quest-share.ts';
import type {Quest} from '../lib/quests.ts';
import {fixtureEntities,fixtureHtml,seedId} from './curated-fixtures.ts';

test('stream delivers a real running stage before Qloo finishes, then all stages and the dossier',async()=>{
 const bundle=await build({stdin:{contents:"import {POST} from './app/api/quests/route.ts';export default {fetch:POST};",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'browser',external:['cloudflare:workers']});
 let release:()=>void=()=>{},fail=false,sourceFail=false;const gate=new Promise<void>(r=>release=r);
 const relatedId='9B33A620-68CA-49B3-BFCF-F09CCF8AD595';
 const mf=new Miniflare({modules:true,compatibilityDate:'2026-05-22',script:bundle.outputFiles[0].text,bindings:{QLOO_API_KEY:'fixture'},d1Databases:['DB'],outboundService:async req=>{
  const u=new URL(req.url);if(u.hostname!=='hackathon.api.qloo.com')return sourceFail?new Response('Unavailable',{status:503}):new Response(fixtureHtml,{headers:{'Content-Type':'text/html'}});
  if(u.pathname==='/search'){await gate;if(fail)return new Response('private upstream diagnostic',{status:429});return Response.json({results:[{entity_id:seedId,name:'Nujabes',types:['urn:entity:artist'],tags:[{name:'Jazz',type:'urn:tag:genre',value:'urn:tag:genre:jazz'}]}]});}
  if(u.pathname==='/entities')return Response.json({results:fixtureEntities()});
  if(u.searchParams.get('filter.type')==='urn:tag')return Response.json({results:{tags:[{name:'Instrumental hip-hop',query:{affinity:.9}}]}});
  if(u.searchParams.get('filter.type')==='urn:entity:tv_show')return Response.json({results:{entities:[{entity_id:relatedId,name:'Fixture related show',types:['urn:entity:tv_show'],query:{affinity:.8},tags:[{name:'Jazz',type:'urn:tag:genre',value:'urn:tag:genre:jazz'}]}]}});
  return Response.json({results:{entities:fixtureEntities()}});
 }});
 const send=()=>mf.dispatchFetch('http://localhost/api/quests',{method:'POST',headers:{Origin:'http://localhost',Accept:'application/x-ndjson'},body:JSON.stringify({seed:'Nujabes'})});
 try{const db=await mf.getD1Database('DB');for(const sql of fs.readFileSync('drizzle/0000_numerous_vulture.sql','utf8').split('--> statement-breakpoint'))await db.prepare(sql).run();
  const response=await send();assert.match(response.headers.get('content-type')!,/ndjson/);const reader=response.body!.getReader(),first=await reader.read();const initial=new TextDecoder().decode(first.value);assert.match(initial,/"stage":"taste"/);assert.match(initial,/"status":"running"/);assert.ok(!initial.includes('Dossier ready'));release();
  let text=initial;for(;;){const r=await reader.read();if(r.done)break;text+=new TextDecoder().decode(r.value);}const messages=text.trim().split('\n').map(line=>JSON.parse(line));const complete=messages.filter(e=>e.type==='stage'&&e.status==='complete');assert.deepEqual(complete.map(e=>e.stage),['taste','operations','cluster','synthesis']);
  assert.ok(complete[0].associations.some((a:any)=>a.name==='Fixture related show'&&a.via==='Nujabes'));assert.ok(!text.includes('Japanese modernism'));
  const result=messages.at(-1);assert.equal(result.type,'result');assert.equal(result.data.quest.stops.length,3);assert.ok(result.data.quest.run.length>4);
  sourceFail=true;const decisions:RunEvent[]=[];const blocked=await readQuestRun((await send()) as unknown as Response,e=>decisions.push(e));assert.equal(blocked.quest?.stops.length,0);assert.ok(decisions.some(e=>e.stage==='cluster'&&/Removing it/.test(e.detail)));assert.ok(!decisions.some(e=>e.stage==='synthesis'&&e.status==='complete'));
  fail=true;await assert.rejects(async()=>readQuestRun((await send()) as unknown as Response,()=>{}),/could not finish/);
 }finally{release();await mf.dispose();}
});

test('stream reader handles split UTF-8 updates and rejects incomplete runs',async()=>{
 const stage={type:'stage',stage:'taste',status:'running',detail:'Qloo → 東京',at:new Date().toISOString()},payload=new TextEncoder().encode(JSON.stringify(stage)+'\n'+JSON.stringify({type:'result',data:{message:'Choose a seed'}})+'\n');
 const stream=new ReadableStream<Uint8Array>({start(c){for(let i=0;i<payload.length;i++)c.enqueue(payload.slice(i,i+1));c.close();}}),events:RunEvent[]=[];
 assert.equal((await readQuestRun(new Response(stream,{headers:{'Content-Type':'application/x-ndjson'}}),e=>events.push(e))).message,'Choose a seed');assert.equal(events[0].detail,'Qloo → 東京');
 await assert.rejects(()=>readQuestRun(new Response(JSON.stringify(stage)+'\n',{headers:{'Content-Type':'application/x-ndjson'}}),()=>{}),/disconnected/);
});

test('sharing contains the actual schedule, source notes and map without requiring private app access',()=>{
 const q={title:'The record loop',date:'2026-10-25',seed:{name:'Nujabes'},invitation:'Follow one new name.',walkingMinutes:35,map:'https://www.google.com/maps/dir/?api=1',stops:[{arrival:'19:00',departure:'19:45',travelMinutes:8,mission:'Listen for a full record.',item:{title:'Little Soul Cafe',location:'Second floor, Tokyo',url:'https://www.littlesoulcafe.com/',curation:{doorNotes:['Opens at 19:00.']}}}]} as Quest;
 const text=questShareText(q);assert.match(text,/19:00–19:45 JST/);assert.match(text,/Opens at 19:00/);assert.match(text,/google.com\/maps/);assert.ok(!text.includes('Cash only'));assert.ok(!text.includes('chatgpt.site'));assert.ok(!text.includes('token'));
});
