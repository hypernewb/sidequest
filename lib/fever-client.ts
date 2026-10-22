import {eventWindow,parseFeverEvents,parseFeverVenues,type EventQuery,type FeverReply,type FeverEvent} from './fever-data.ts';
import {AREAS} from './discovery.ts';

type Config={FEVER_CLIENT_ID?:string;FEVER_CLIENT_SECRET?:string;FEVER_AUDIENCE?:string};
type Rpc={jsonrpc?:string;id?:number;result?:Record<string,unknown>;error?:unknown};
const TOKEN_URL='https://feverup.us.auth0.com/oauth/token';
const MCP_URL='https://data-search.apigw.feverup.com/mcp/';
type ToolCall=(name:'search_events'|'search_venues',args:Record<string,unknown>)=>Promise<unknown>;
export async function attachFeverCoordinates(events:FeverEvent[],query:EventQuery,args:Record<string,unknown>,call:ToolCall){
 // Search names only to find candidates. Confirm the event ID in a venue-scoped
 // response before assigning a point; a fuzzy venue match alone proves nothing.
 const groups=[...new Set(events.filter(e=>!e.coordinates).map(e=>e.location))].slice(0,6);
 const found=new Map<string,{lat:number;lon:number}>();
 await Promise.all(groups.map(async location=>{try{
  const venues=parseFeverVenues(await call('search_venues',{query:location.replace(/,\s*Tokyo\s*$/i,''),country_code:'JP',limit:1,locale:'en'}),'tokyo');
  const venue=venues[0];if(!venue)return;
  const page=await call('search_events',{...args,page_size:36,venue_id:venue.venue_id});
  if(!page||typeof page!=='object'||!('results' in page)||!Array.isArray(page.results))return;
  const ids=new Set(page.results.filter(e=>e&&typeof e==='object'&&'id' in e).map(e=>'fever:'+e.id));
  for(const e of events)if(e.location===location&&ids.has(e.id))found.set(e.id,{lat:venue.latitude,lon:venue.longitude});
 }catch{/* Optional map enrichment must never discard valid event listings. */}}));
 return events.map(e=>found.has(e.id)?{...e,coordinates:found.get(e.id)!}:e);
}
export class FeverAccessError extends Error {
 status:number;
 constructor(status:number){super(status===429?'Fever is busy. Please try again shortly.':status===401||status===403?'Fever access could not be authorized. The app owner needs to check the server credentials.':'Fever could not complete this search. Please try again.');this.status=status;}
}
async function boundedBody(response:Response,limit=1500000){
 if(!response.body)return '';const reader=response.body.getReader(),decoder=new TextDecoder();let text='',size=0;
 try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit)throw Error('Fever returned too much data. Please narrow the search.');text+=decoder.decode(value,{stream:true});}return text+decoder.decode();}finally{await reader.cancel().catch(()=>{});}
}
export async function rpcResult(response:Response,id:number):Promise<Rpc>{
 if(!response.ok)throw new FeverAccessError(response.status);
 const stream=response.headers.get('content-type')?.includes('text/event-stream');
 if(!stream){const b=JSON.parse(await boundedBody(response)) as Rpc;if(b.id!==id||b.error||!b.result)throw Error('Fever did not confirm the event search.');return b;}
 // Read until our response arrives; an SSE server may leave the HTTP connection open afterwards.
 const reader=response.body?.getReader();if(!reader)throw Error('Fever returned an empty response.');
 const decoder=new TextDecoder();let buffer='',bytes=0;
 try{while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>1500000)throw Error('Fever returned too much data.');buffer+=decoder.decode(value,{stream:true});buffer=buffer.replace(/\r\n/g,'\n');let end;
  while((end=buffer.indexOf('\n\n'))>=0){const frame=buffer.slice(0,end);buffer=buffer.slice(end+2);const lines=frame.split('\n').filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trimStart()).join('\n');if(!lines)continue;const b=JSON.parse(lines) as Rpc;if(b.id===id){if(b.error||!b.result)throw Error('Fever did not confirm the event search.');return b;}}
 }}finally{await reader.cancel().catch(()=>{});}
 throw Error('Fever did not finish the event search.');
}
export function createFeverClient(fetcher:typeof fetch=fetch){
 // This cache contains only the app's own M2M access token, never a visitor's chat/OAuth credentials.
 let token:{value:string;expires:number;config:string}|undefined;
 let inFlight:{config:string;promise:Promise<string>}|undefined;
 async function access(config:Required<Config>,signal:AbortSignal){
  const identity=JSON.stringify(config);
  if(token?.config===identity&&token.expires>Date.now()+60000)return token.value;
  if(inFlight?.config===identity)return inFlight.promise;
  const promise=(async()=>{
   const r=await fetcher(TOKEN_URL,{method:'POST',redirect:'manual',headers:{'Content-Type':'application/json'},body:JSON.stringify({grant_type:'client_credentials',client_id:config.FEVER_CLIENT_ID,client_secret:config.FEVER_CLIENT_SECRET,audience:config.FEVER_AUDIENCE,scope:'mcp:service'}),signal});
   if(!r.ok)throw new FeverAccessError(r.status);
   const b=JSON.parse(await boundedBody(r,20000)) as Record<string,unknown>;
   if(typeof b.access_token!=='string'||typeof b.expires_in!=='number'||b.expires_in<=0||String(b.token_type).toLowerCase()!=='bearer')throw Error('Fever did not issue a usable access token.');
   token={value:b.access_token,expires:Date.now()+Math.min(b.expires_in,86400)*1000,config:identity};return token.value;
  })();inFlight={config:identity,promise};try{return await promise;}finally{if(inFlight?.promise===promise)inFlight=undefined;}
 }
 return {async search(config:Config,query:EventQuery,personalToken?:string):Promise<FeverReply>{
  if(!personalToken&&(!config.FEVER_CLIENT_ID||!config.FEVER_CLIENT_SECRET||!config.FEVER_AUDIENCE))return {status:'not_configured',events:[],message:'Live events need Fever access for this app. Places are still available.'};
  const signal=AbortSignal.timeout(25000);let session:string|null=null,authorization='',negotiated='2025-06-18';
  try{
   authorization='Bearer '+(personalToken||await access(config as Required<Config>,signal));
   const initial=await fetcher(MCP_URL,{method:'POST',redirect:'manual',headers:{Authorization:authorization,Accept:'application/json, text/event-stream','Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'sidequest',version:'0.2.0'}}}),signal});
   session=initial.headers.get('mcp-session-id');const init=await rpcResult(initial,1),version=init.result?.protocolVersion;
   if(!['2025-03-26','2025-06-18','2025-11-25'].includes(String(version)))throw Error('Fever selected an unsupported protocol version.');
   negotiated=String(version);
   const headers:Record<string,string>={Authorization:authorization,Accept:'application/json, text/event-stream','Content-Type':'application/json','MCP-Protocol-Version':String(version),...(session?{'Mcp-Session-Id':session}:{})};
   const ready=await fetcher(MCP_URL,{method:'POST',redirect:'manual',headers,body:JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'}),signal});
   if(!ready.ok)throw new FeverAccessError(ready.status);await ready.body?.cancel();
   let nextId=2;
   async function call(name:'search_events'|'search_venues',args:Record<string,unknown>){
    const id=nextId++,r=await fetcher(MCP_URL,{method:'POST',redirect:'manual',headers,body:JSON.stringify({jsonrpc:'2.0',id,method:'tools/call',params:{name,arguments:args}}),signal});
    const rpc=await rpcResult(r,id),result=rpc.result!;
    if(result.isError===true)throw Error('Fever could not complete the event search.');
    if(result.structuredContent!==undefined)return result.structuredContent;
    const contents=Array.isArray(result.content)?result.content:[];for(const item of contents){if(item&&typeof item==='object'&&'type' in item&&item.type==='text'&&'text' in item&&typeof item.text==='string'){try{const parsed=JSON.parse(item.text);if(parsed&&Array.isArray(parsed.results))return parsed;}catch{}}}
    throw Error('Fever returned an unexpected event format.');
   }
   const arguments_={city_code:'HND',locale:'en',page:0,page_size:36,sort_by:'closest_session',include_description:true,...eventWindow(query.dates)};
   let data:unknown;
   if(query.area==='tokyo')data=await call('search_events',arguments_);
   else{
    const a=AREAS[query.area];
    const venues=parseFeverVenues(await call('search_venues',{latitude:a.lat,longitude:a.lon,radius:a.radius,country_code:'JP',limit:6,locale:'en'}),query.area);
    const pages=await Promise.all(venues.map(async venue=>{
     const response=await call('search_events',{...arguments_,page_size:12,venue_id:venue.venue_id});
     if(!response||typeof response!=='object'||!('results' in response)||!Array.isArray(response.results))throw Error('Fever returned an unexpected event format.');
     // This relationship comes from an explicit venue_id search, never a fuzzy name match.
     return response.results.map((e:unknown)=>e&&typeof e==='object'?{...e,venue}:e);
    }));data={results:pages.flat()};
   }
   const retrievedAt=new Date().toISOString();let events=parseFeverEvents(data,query,retrievedAt);
   if(query.area==='tokyo'&&personalToken)events=await attachFeverCoordinates(events,query,arguments_,call);
   return {status:'success',events,retrievedAt,message:'Fever listings match your dates and area. They are not ranked by Qloo taste affinity. Starting prices may refer to a ticket category; check the adult ticket and booking fees on Fever.'};
  }catch(e){const denied=e instanceof FeverAccessError&&(e.status===401||e.status===403);if(denied&&!personalToken)token=undefined;return {status:'error',events:[],...(denied&&personalToken?{reauthenticationRequired:true}:{}),message:denied&&personalToken?'Your Fever connection needs a fresh sign-in.':e instanceof FeverAccessError?e.message:e instanceof Error&&/too much|unexpected event format|protocol version/.test(e.message)?e.message:'Fever could not complete this search. Please try again.'};}
  finally{if(session&&authorization){try{const closed=await fetcher(MCP_URL,{method:'DELETE',redirect:'manual',headers:{Authorization:authorization,'Mcp-Session-Id':session,'MCP-Protocol-Version':negotiated},signal:AbortSignal.timeout(1500)});await closed.body?.cancel();}catch{}}}
 }};
}
export const feverClient=createFeverClient();
