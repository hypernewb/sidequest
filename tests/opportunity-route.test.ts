import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {Miniflare} from 'miniflare';
test('Shared discovery runs without cultural seeds, isolates official-source outages and rejects invalid requests before fetching',async()=>{
 const bundle=await build({stdin:{contents:"import {POST} from './app/api/opportunities/route.ts';export default {fetch:POST};",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'browser',external:['cloudflare:workers']});let calls=0;
 const mf=new Miniflare({modules:true,compatibilityDate:'2026-05-22',script:bundle.outputFiles[0].text,bindings:{QLOO_API_KEY:'fixture'},outboundService:async req=>{calls++;const u=new URL(req.url);assert.equal(req.headers.get('cookie'),null);if(u.hostname!=='hackathon.api.qloo.com')return new Response('down',{status:503});assert.equal(u.searchParams.has('signal.interests.entities'),false);return Response.json({results:{entities:[{entity_id:'FFD31D42-DF50-4B60-932C-7497C8E73A80',name:'Retro arcade',location:{lat:35.6762,lon:139.7006},properties:{primary_genre:{name:'Video arcade'},description:'Retro games to play',website:'https://example.org/arcade',geocode:{country_code:'JP',admin1_region:'Tokyo'}},query:{affinity:.9}}]}});}});
 const body={intent:'play',direction:'retro',format:'places',date:new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Tokyo'}),days:7,budget:'any',unknownPrice:true,seeds:[],exclude:[]};
 const send=(b:unknown,origin='http://localhost')=>mf.dispatchFetch('http://localhost/api/opportunities',{method:'POST',headers:{Origin:origin,Cookie:'personal=not-for-sources'},body:JSON.stringify(b)});
 try{assert.equal((await send(body,'https://other.test')).status,403);assert.equal((await send({...body,date:'2026-02-31'})).status,400);assert.equal(calls,0);const r=await send(body),b=await r.json() as any;assert.equal(r.status,200);assert.equal(b.items.length,1);assert.equal(b.items[0].title,'Retro arcade');assert.ok(b.health.some((h:any)=>h.status.includes('unavailable')));assert.equal(b.items[0].price,null);}finally{await mf.dispose();}
});
