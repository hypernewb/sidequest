import test from 'node:test';
import assert from 'node:assert/strict';
import {createFeverClient,rpcResult} from '../lib/fever-client.ts';
import {eventWindow,parseFeverEvents,type EventQuery} from '../lib/fever-data.ts';
const q:EventQuery={area:'tokyo',dates:['2099-10-24','2099-10-25'],budget:'flexible',rejected:[]};
const at='2099-10-23T15:00:00.000Z';
const event={id:100,name:'Contract test event',url:'https://feverup.com/m/100',location:'Test venue, Tokyo',timezone:'Asia/Tokyo',session_start_times:['2099-10-24T09:00:00'],min_price:600,max_price:1500,currency:'JPY'};
const config={FEVER_CLIENT_ID:'fixture-client',FEVER_CLIENT_SECRET:'fixture-secret',FEVER_AUDIENCE:'fixture-audience'};
test('Tokyo dates become the correct UTC interval',()=>{assert.deepEqual(eventWindow(q.dates),{start_datetime:'2099-10-23T15:00:00.000Z',end_datetime:'2099-10-25T14:59:59.000Z'});});
test('missing sessions, wrong timezone, unsafe links and duplicates cannot become event listings',()=>{
 const events=parseFeverEvents({results:[event,event,{...event,id:101,session_start_times:undefined},{...event,id:102,timezone:'UTC'},{...event,id:103,url:'javascript:alert(1)'},{...event,id:104,url:'https://feverup.com.attacker.test/m/104'},{...event,id:105,session_start_times:['2099-10-26T09:00:00']}]},q,at);
 assert.equal(events.length,1);assert.equal(events[0].id,'fever:100');assert.equal(events[0].priceLabel,'From ¥600');
 assert.equal(parseFeverEvents({results:[event]},{...q,rejected:['fever:100']},at).length,0);
});
test('a starting fare alone cannot pass a hard cap and neighborhoods require venue coordinates',()=>{
 const input={results:[event]};assert.equal(parseFeverEvents(input,{...q,budget:'1000'},at).length,0);assert.equal(parseFeverEvents(input,{...q,budget:'3000'},at).length,1);
 assert.equal(parseFeverEvents({results:[{...event,max_price:undefined}]},{...q,budget:'3000'},at).length,0);
 assert.equal(parseFeverEvents(input,{...q,area:'shibuya'},at).length,0);
 assert.equal(parseFeverEvents({results:[{...event,venue:{latitude:35.658,longitude:139.7016}}]},{...q,area:'shibuya'},at).length,1);
 assert.equal(parseFeverEvents(input,{...q,budget:'free'},at).length,0);
});
test('past sessions are excluded, even if the provider returns them',()=>{assert.equal(parseFeverEvents({results:[event]},q,'2099-10-24T01:00:00.000Z').length,0);});
test('JSON-RPC SSE parser waits for the matching response and cancels an open stream',async()=>{
 let cancelled=false;const stream=new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('event: message\r\ndata: {"jsonrpc":"2.0","method":"notice"}\r\n\r\nevent: message\r\ndata: {"jsonrpc":"2.0","id":2,"result":{"content":[]}}\r\n\r\n'));},cancel(){cancelled=true;}});
 const result=await rpcResult(new Response(stream,{headers:{'Content-Type':'text/event-stream'}}),2);assert.equal(result.id,2);assert.equal(cancelled,true);
 await assert.rejects(()=>rpcResult(Response.json({jsonrpc:'2.0',id:1,result:{}}),2));
});
test('server client exchanges M2M credentials, carries MCP session and caches the expiring token',async()=>{
 let tokenCalls=0;const calls:{url:string;body:Record<string,any>;headers:Headers}[]=[];
 const mock:typeof fetch=async(input,init)=>{const url=String(input),body=JSON.parse(String(init?.body||'{}')),headers=new Headers(init?.headers);calls.push({url,body,headers});
  if(url.endsWith('/oauth/token')){tokenCalls++;assert.equal(body.scope,'mcp:service');assert.equal(body.grant_type,'client_credentials');assert.equal(body.audience,config.FEVER_AUDIENCE);return Response.json({access_token:'fixture-token',expires_in:3600,token_type:'Bearer'});}
  assert.equal(headers.get('authorization'),'Bearer fixture-token');
  if(init?.method==='DELETE')return new Response(null,{status:204});
  if(body.method==='initialize')return Response.json({jsonrpc:'2.0',id:1,result:{protocolVersion:'2025-06-18',capabilities:{},serverInfo:{name:'fixture',version:'1'}}},{headers:{'Mcp-Session-Id':'fixture-session'}});
  assert.equal(headers.get('mcp-session-id'),'fixture-session');assert.equal(headers.get('mcp-protocol-version'),'2025-06-18');
  if(body.method==='notifications/initialized')return new Response(null,{status:202});
  assert.equal(body.params.name,'search_events');assert.equal(body.params.arguments.city_code,'HND');assert.equal(body.params.arguments.page_size,36);
  return Response.json({jsonrpc:'2.0',id:2,result:{content:[{type:'text',text:JSON.stringify({results:[event]})}]}});
 };
 const client=createFeverClient(mock);const first=await client.search(config,q),second=await client.search(config,q);assert.equal(first.status,'success');assert.equal(first.events.length,1);assert.equal(second.status,'success');assert.equal(tokenCalls,1);assert.ok(calls.filter(c=>c.body.method==='tools/call').every(c=>c.headers.get('accept')?.includes('text/event-stream')));
});
test('missing access never calls Fever and authorization failures never expose provider bodies or secrets',async()=>{
 let calls=0;const client=createFeverClient(async()=>{calls++;return new Response('private fixture-secret provider diagnostics',{status:403});});
 assert.equal((await client.search({},q)).status,'not_configured');assert.equal(calls,0);const denied=await client.search(config,q);assert.equal(denied.status,'error');assert.ok(!JSON.stringify(denied).includes('fixture-secret'));assert.equal(denied.events.length,0);
});
test('unconfirmed MCP tool errors are failures, not empty successful searches',async()=>{
 const mock:typeof fetch=async(input,init)=>{const b=JSON.parse(String(init?.body||'{}'));if(String(input).endsWith('/oauth/token'))return Response.json({access_token:'fixture-token',expires_in:3600,token_type:'Bearer'});if(b.method==='initialize')return Response.json({id:1,result:{protocolVersion:'2025-06-18'}});if(b.method==='notifications/initialized')return new Response(null,{status:202});return Response.json({id:2,result:{isError:true,content:[{type:'text',text:'do not expose raw diagnostics'}]}});};
 const result=await createFeverClient(mock).search(config,q);assert.equal(result.status,'error');assert.equal(result.events.length,0);
});
