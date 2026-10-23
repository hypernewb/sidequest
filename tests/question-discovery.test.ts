import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {Miniflare} from 'miniflare';
import {activityFits,tasteContextSchema} from '../lib/taste-context.ts';
import {rankPlaces,type Place} from '../lib/discovery.ts';
import {parseFeverEvents,variedFeverEvents,type FeverEvent} from '../lib/fever-data.ts';
import {createFeverClient} from '../lib/fever-client.ts';
test('later distinct-format Fever listings survive the pre-ranking pool and a failed second page preserves first-page results',async()=>{
 const query={area:'tokyo' as const,dates:['2027-02-28'],budget:'flexible',rejected:[]};
 const raw=(id:number,name:string,location:string)=>({id,name,location,url:'https://feverup.com/m/'+id,timezone:'Asia/Tokyo',session_start_times:['2027-02-28T12:00:00'],venue:{latitude:35.6762,longitude:139.7006}});
 const records=[...Array.from({length:24},(_,i)=>raw(i+1,'Candlelight concert '+i,'Same venue, Tokyo')),raw(99,'Independent art exhibition','Different venue, Tokyo')];
 const parsed=parseFeverEvents({results:[...records,records[0]]},query,'2026-10-23T00:00:00Z');assert.equal(parsed.length,25);assert.ok(variedFeverEvents(parsed,[]).some(e=>e.id==='fever:99'));
 const pages:number[]=[];
 const mock:typeof fetch=async(_url,options)=>{if(options?.method==='DELETE')return new Response(null,{status:200});const b=JSON.parse(String(options?.body));if(b.method==='initialize')return Response.json({jsonrpc:'2.0',id:b.id,result:{protocolVersion:'2025-06-18'}});if(b.method==='notifications/initialized')return new Response(null,{status:202});if(b.method==='tools/call'){const page=b.params.arguments.page;pages.push(page);if(page===1)return new Response('upstream secret',{status:429});return Response.json({jsonrpc:'2.0',id:b.id,result:{structuredContent:{results:[records[0]]}}});}throw Error('Unexpected call');};
 const result=await createFeverClient(mock).search({},query,'fixture-personal-token');assert.equal(result.status,'success');assert.equal(result.events.length,1);assert.deepEqual(pages.sort(),[0,1]);
});
test('Fever shortlist prioritizes literal interests and avoids filling all six positions with one concert series',()=>{
 const e=(id:string,name:string,location:string):FeverEvent=>({id,name,location,description:'',url:'https://feverup.com/m/1',sessions:['2027-02-28T12:00:00'],timezone:'Asia/Tokyo',minPrice:null,maxPrice:null,currency:null,retrievedAt:'2026-10-23T00:00:00Z',priceLabel:'Unknown'});
 const events=[...Array.from({length:7},(_,i)=>e('c'+i,'Candlelight concert '+i,'Venue A')),e('art','Immersive art exhibition','Venue B'),e('tour','Tokyo walking tour','Venue C'),e('fan','Nintendo game event','Venue D')];
 const result=variedFeverEvents(events,[{name:'Nintendo'}]);assert.equal(result[0].id,'fan');assert.ok(result.some(e=>e.id==='art'));assert.ok(result.some(e=>e.id==='tour'));assert.equal(result.length,6);
});
test('activity intent admits game shops and rejects generic cafés; unsafe taste dimensions cannot enter questions',()=>{
 assert.equal(activityFits('Hobby store','collect'),true);assert.equal(activityFits('Video arcade','collect'),true);assert.equal(activityFits('Cafe','collect'),false);assert.equal(activityFits('Hotel','any'),false);
 assert.equal(tasteContextSchema.safeParse({ids:['FFD31D42-DF50-4B60-932C-7497C8E73A80'],tags:[{id:'urn:tag:religion:qloo:example',name:'Example'}],activity:'any'}).success,false);
});
test('a balanced shortlist reserves lower-popularity places without admitting weak-affinity filler',()=>{
 const p=(id:string,affinity:number,popularity:number)=>({id,affinity,popularity,family:'Games & collectibles'}) as Place;
 const result=rankPlaces([...Array.from({length:8},(_,i)=>p('main'+i,1-i*.01,.99)),p('less1',.9,.4),p('less2',.85,.7),p('bad',.1,.1)],'explore');
 assert.equal(result.length,8);assert.ok(result.some(p=>p.id==='less1'));assert.ok(result.some(p=>p.id==='less2'));assert.ok(!result.some(p=>p.id==='bad'));assert.equal(new Set(result.map(p=>p.id)).size,8);
});
test('question route uses chosen context for adaptive Qloo tags, strips unsupported dimensions, excludes seen choices and recovers errors',async()=>{
 const bundle=await build({stdin:{contents:`import {POST} from './app/api/taste/questions/route.ts';export default {fetch:POST};`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'browser',external:['cloudflare:workers']});
 const id='FFD31D42-DF50-4B60-932C-7497C8E73A80',tag={id:'urn:tag:genre:music:soundtrack',name:'Soundtrack'};const calls:URL[]=[];let fail=false;
 const mf=new Miniflare({modules:true,compatibilityDate:'2026-05-22',script:bundle.outputFiles[0].text,bindings:{QLOO_API_KEY:'fixture'},outboundService:async req=>{calls.push(new URL(req.url));if(fail)return new Response('private error',{status:429});return Response.json({success:true,results:{tags:[{tag_id:tag.id,name:tag.name},{tag_id:'urn:tag:genre:media:fantasy',name:'Fantasy'},{tag_id:'urn:tag:gender:qloo:example',name:'Unwanted dimension'}]}});}});
 const send=(b:unknown,origin='http://localhost')=>mf.dispatchFetch('http://localhost/api/taste/questions',{method:'POST',headers:{Origin:origin},body:JSON.stringify(b)});
 try{const r=await send({ids:[id],tags:[tag],exclude:[tag.id]});assert.equal(r.status,200);const b=await r.json() as any;assert.deepEqual(b.choices,[{id:'urn:tag:genre:media:fantasy',name:'Fantasy'}]);assert.equal(calls[0].searchParams.get('signal.interests.tags'),tag.id);assert.equal((await send({ids:[]},'https://elsewhere.test')).status,403);fail=true;const bad=await send({ids:[id]});assert.equal(bad.status,502);assert.ok(!(await bad.text()).includes('private error'));}finally{await mf.dispose();}
});
test('place route searches activity and popularity bands beyond fixed IDs, carries chosen signals, rejects stale direction and retains provider success',async()=>{
 const bundle=await build({stdin:{contents:`import {POST} from './app/api/discover/route.ts';export default {fetch:POST};`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'browser',external:['cloudflare:workers']});
 const id='FFD31D42-DF50-4B60-932C-7497C8E73A80',calls:URL[]=[];const mf=new Miniflare({modules:true,compatibilityDate:'2026-05-22',script:bundle.outputFiles[0].text,bindings:{QLOO_API_KEY:'fixture'},outboundService:async req=>{const u=new URL(req.url);calls.push(u);if(u.searchParams.has('filter.popularity.max'))return new Response('busy',{status:429});return Response.json({success:true,results:{entities:[{entity_id:'9ED59F51-F7D3-4016-BED9-5887A26D7F62',name:'Fixture game shop',popularity:.4,location:{lat:35.6762,lon:139.7006},properties:{primary_genre:{name:'Video game store'},geocode:{country_code:'JP',admin1_region:'Tokyo'}},query:{affinity:.9}}]}});}});
 const body={interests:[{id,name:'Nintendo',type:'brand'}],context:{ids:[id],tags:[{id:'urn:tag:genre:media:comics',name:'Comics'}],activity:'collect'},area:'tokyo',mode:'explore',budget:'flexible',kind:'places',dates:['2027-02-28']};
 const send=(b:unknown)=>mf.dispatchFetch('http://localhost/api/discover',{method:'POST',headers:{Origin:'http://localhost'},body:JSON.stringify(b)});
 try{const r=await send(body),b=await r.json() as any;assert.equal(r.status,200);assert.equal(b.places[0].name,'Fixture game shop');assert.equal(calls.length,2);assert.ok(calls.every(u=>!u.searchParams.has('filter.results.entities')&&u.searchParams.get('filter.tags')?.includes('toy_store')&&u.searchParams.get('signal.interests.tags')?.includes('comics')));assert.equal(b.partial,true);const bad=await send({...body,context:{...body.context,ids:['01381184-B533-4E3C-B9DB-43A2FE326744']}});assert.equal(bad.status,400);}finally{await mf.dispose();}
});
