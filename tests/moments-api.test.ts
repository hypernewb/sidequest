import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
import {Miniflare} from 'miniflare';

test('public online schedule requests run in Workers with supported fetch options',async()=>{
 const bundle=await build({stdin:{contents:"import {publicBandcampSchedule} from './lib/global-sources.ts';export default {async fetch(){return Response.json(await publicBandcampSchedule());}};",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'browser'});
 let calls=0;const mf=new Miniflare({modules:true,compatibilityDate:'2026-05-22',script:bundle.outputFiles[0].text,outboundService:async req=>{calls++;assert.equal(req.method,'POST');assert.equal(new URL(req.url).pathname,'/api/live_events_public_api/4/get_upcoming_live_events');return Response.json({items:[{title:'Worker party',liveEventUrl:'https://artist.bandcamp.com/live/worker-party',scheduledStartDate:'29 Oct 2026 16:00:00 GMT'}],nextCursor:null});}});
 try{const r=await mf.dispatchFetch('http://localhost/');assert.equal(r.status,200);const rows=await r.json() as any[];assert.equal(rows[0].title,'Worker party');assert.equal(calls,1);}finally{await mf.dispose();}
});

test('event-first API reads persisted online and local events, excludes stock and expired windows, and validates requests',async()=>{
 const bundle=await build({stdin:{contents:"import {POST} from './app/api/moments/route.ts';export default {fetch:POST};",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'browser',external:['cloudflare:workers']});
 const mf=new Miniflare({modules:true,compatibilityDate:'2026-05-22',script:bundle.outputFiles[0].text,d1Databases:['DB'],outboundService:()=>{throw Error('Cached discovery should not fetch sources');}});
 try{
  const db=await mf.getD1Database('DB');for(const sql of fs.readFileSync('drizzle/0000_numerous_vulture.sql','utf8').split('--> statement-breakpoint'))await db.prepare(sql).run();
  const now=new Date(),at=now.toISOString(),today=now.toLocaleDateString('en-CA',{timeZone:'Asia/Tokyo'}),future=new Date(now.getTime()+3600000).toISOString();
  for(const name of ['lastRefresh','lastExpanded','lastGlobal'])await db.prepare('INSERT INTO catalog_state(id,payload) VALUES(?,?)').bind(name,JSON.stringify({at,schema:5,health:[]})).run();
  const common={title:'Test event',kind:'event',source:'Official fixture',url:'https://artist.bandcamp.com/live/test',description:'Official dated event',location:'Online · worldwide',online:true,start:today,end:today,checkedAt:at,price:null,priceLabel:'Check access',availability:'Source schedule',category:'online event'};
  const items=[{...common,id:'global:live',startsAt:future},{...common,id:'local',url:'https://example.com/tokyo',online:false,location:'Tokyo'},{...common,id:'stock',kind:'release',actionLabel:'Shop listing published',title:'Limited stock listing'},{...common,id:'expired',kind:'release',actionLabel:'Preorder window',endsAt:new Date(now.getTime()-3600000).toISOString()}];
  for(const o of items)await db.prepare('INSERT INTO event_catalog(id,payload,checked_at) VALUES(?,?,?)').bind(o.id,JSON.stringify(o),at).run();
  const send=(body:unknown,origin='http://localhost')=>mf.dispatchFetch('http://localhost/api/moments',{method:'POST',headers:{Origin:origin},body:JSON.stringify(body)});
  const response=await send({access:'online'}),b=await response.json() as any;assert.equal(response.status,200);assert.deepEqual(b.items.map((o:any)=>o.id),['global:live']);
  const local=await (await send({access:'tokyo'})).json() as any;assert.deepEqual(local.items.map((o:any)=>o.id),['local']);
  const capped=await (await send({context:{budget:1000,unknownPrice:false}})).json() as any;assert.deepEqual(capped.items,[]);
  const contextAccess=await (await send({context:{access:'online'}})).json() as any;assert.deepEqual(contextAccess.items.map((o:any)=>o.id),['global:live']);
  const passed=await (await send({context:{reactions:[{id:'local',action:'pass',reason:'unknown'}]}})).json() as any;assert.deepEqual(passed.items.map((o:any)=>o.id),['global:live']);
  const passiveSeen=await (await send({access:'tokyo',context:{reactions:[{id:'local',action:'seen'}]}})).json() as any;assert.deepEqual(passiveSeen.items.map((o:any)=>o.id),['local']);
  const explicitSeen=await (await send({access:'tokyo',context:{reactions:[{id:'local',action:'seen',reason:'seen'}]}})).json() as any;assert.deepEqual(explicitSeen.items,[]);
  const calibration=await (await send({cachedOnly:true,context:{direction:'art',tags:[{id:'editorial:photography',name:'Photography',weight:1}]}})).json() as any;assert.equal(calibration.qloo.status,'cached-only');assert.equal(calibration.scout.status,'skipped');assert.equal(calibration.items.length,2);
  assert.equal((await send({access:'anywhere'})).status,400);assert.equal((await send({},'https://evil.example')).status,403);
 }finally{await mf.dispose();}
});
