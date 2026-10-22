import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {Miniflare} from 'miniflare';
test('adaptive route carries the chosen entity and theme, tolerates a failed world and keeps errors private',async()=>{
 const bundle=await build({stdin:{contents:`import {POST} from './app/api/taste/explore/route.ts';export default {fetch:POST};`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'browser',external:['cloudflare:workers']});
 const calls:URL[]=[];let fail=false;
 const id='9B33A620-68CA-49B3-BFCF-F09CCF8AD595',result='01381184-B533-4E3C-B9DB-43A2FE326744';
 const mf=new Miniflare({modules:true,compatibilityDate:'2026-05-22',script:bundle.outputFiles[0].text,bindings:{QLOO_API_KEY:'test-key'},outboundService:async req=>{const url=new URL(req.url);calls.push(url);if(fail||url.searchParams.get('filter.type')==='urn:entity:movie')return new Response('private provider error',{status:429});return Response.json({success:true,results:{entities:[{entity_id:result,name:'Björk',subtype:'urn:entity:artist',query:{explainability:{'signal.interests.entities':[{entity_id:id,score:1}]}}}]}});}});
 const send=(data:unknown,origin='http://localhost')=>mf.dispatchFetch('http://localhost/api/taste/explore',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(data)});
 try{
  const r=await send({ids:[id],branch:'mix',theme:{id:'urn:tag:genre:qloo:fantasy',name:'Fantasy'}});const b=await r.json() as any;assert.equal(r.status,200);assert.equal(b.partial,true);assert.equal(b.items.length,1);assert.equal(b.items[0].id,result);assert.equal(r.headers.get('Cache-Control'),'private, no-store');assert.equal(calls.length,3);assert.ok(calls.every(u=>u.searchParams.get('signal.interests.entities')===id&&u.searchParams.get('signal.interests.tags')==='urn:tag:genre:qloo:fantasy'));
  const count=calls.length;assert.equal((await send({ids:[id]},'https://other.test')).status,403);assert.equal((await send({ids:[]})).status,400);assert.equal(calls.length,count);
  fail=true;const bad=await send({ids:[id],branch:'artist'});assert.equal(bad.status,502);assert.ok(!(await bad.text()).includes('private provider error'));
 }finally{await mf.dispose();}
});
