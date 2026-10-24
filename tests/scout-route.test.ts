import {fixtureIds,fixtureEntities,fixtureHtml} from './curated-fixtures.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {Miniflare} from 'miniflare';
test('scout carries taste to Qloo, retains hours, rejects invalid input before fetching and returns honest failures',async()=>{
 const bundle=await build({stdin:{contents:"import {POST} from './app/api/scout/route.ts';export default {fetch:POST};",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'browser',external:['cloudflare:workers']});let calls=0,fail=false;
 const id='E11125AF-936B-4935-B607-F2DA2E6A6B92';
 const mf=new Miniflare({modules:true,compatibilityDate:'2026-05-22',script:bundle.outputFiles[0].text,bindings:{QLOO_API_KEY:'fixture'},outboundService:async req=>{calls++;assert.equal(req.headers.get('cookie'),null);const u=new URL(req.url);if(u.hostname!=='hackathon.api.qloo.com')return new Response(fixtureHtml,{headers:{'Content-Type':'text/html'}});if(u.pathname==='/entities')return Response.json({results:fixtureEntities()});if(u.searchParams.get('filter.type')==='urn:tag')return Response.json({results:{tags:[]}});assert.equal(u.hostname,'hackathon.api.qloo.com');assert.equal(u.searchParams.get('signal.interests.entities'),id);if(fail)return new Response('private failure',{status:429});return Response.json({results:{entities:fixtureEntities()}});}});
 const body={intent:'cafe',direction:'coffee',format:'any',date:new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Tokyo'}),days:7,budget:'any',unknownPrice:true,seeds:[{id,name:'Nujabes',type:'artist',feeling:'love'}],exclude:[]};
 const send=(b:unknown,origin='http://localhost')=>mf.dispatchFetch('http://localhost/api/scout',{method:'POST',headers:{Origin:origin,Cookie:'visitor=not-forwarded'},body:JSON.stringify(b)});
 try{assert.equal((await send(body,'https://other.test')).status,403);assert.equal((await send({...body,date:'2026-02-31'})).status,400);assert.equal(calls,0);const r=await send(body),v=await r.json() as any;assert.equal(r.status,200);assert.equal(v.stops.length,3);assert.match(v.stops[0].reason,/Nujabes/);assert.ok(v.stops.every((s:any)=>s.item.hours&&s.item.lat));fail=true;const error=await send(body);assert.equal(error.status,502);assert.ok(!JSON.stringify(await error.json()).includes('private failure'));}finally{await mf.dispose();}
});
