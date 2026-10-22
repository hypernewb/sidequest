import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {Miniflare} from 'miniflare';

test('Fever OAuth and MCP requests work in the deployed Workers fetch runtime',async()=>{
 const bundled=await build({stdin:{contents:`
 import {startPersonalFever,completePersonalFever} from './lib/fever-oauth.ts';
 import {createFeverClient} from './lib/fever-client.ts';
 export default {async fetch(){
  const origin='https://sidequest.test',config={FEVER_OAUTH_CLIENT_ID:'fixture',FEVER_OAUTH_CLIENT_SECRET:'fixture',FEVER_OAUTH_REDIRECT_URI:origin+'/api/fever/callback',FEVER_SESSION_KEY:'BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc'};
  const start=await startPersonalFever(new Request(origin+'/api/fever/start',{headers:{'oai-authenticated-user-id':'fixture-owner'}}),config);
  const state=new URL(start.headers.get('location')).searchParams.get('state');
  const cookie=start.headers.get('set-cookie').split(';')[0];
  const callback=await completePersonalFever(new Request(origin+'/api/fever/callback?code=fixture&state='+state,{headers:{'oai-authenticated-user-id':'fixture-owner',Cookie:cookie}}),config);
  const events=await createFeverClient().search({},{area:'tokyo',dates:['2099-10-24'],budget:'flexible',rejected:[]},'fixture-access');
  return Response.json({callback:callback.headers.get('location'),events:events.status});
 }};`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'browser'});
 const mf=new Miniflare({modules:true,compatibilityDate:'2026-05-22',script:bundled.outputFiles[0].text,outboundService:async req=>{
  if(new URL(req.url).pathname==='/token')return Response.json({access_token:'fixture-access',refresh_token:'fixture-refresh',expires_in:3600,token_type:'Bearer'});
  const body=await req.json() as {method:string;id?:number};
  if(body.method==='initialize')return Response.json({id:body.id,result:{protocolVersion:'2025-06-18'}});
  if(body.method==='notifications/initialized')return new Response(null,{status:202});
  return Response.json({id:body.id,result:{structuredContent:{results:[]}}});
 }});
 try{const reply=await (await mf.dispatchFetch('http://localhost/')).json();assert.deepEqual(reply,{callback:'https://sidequest.test/?fever=connected',events:'success'});}finally{await mf.dispose();}
});
