import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreInventoryCandidates,graphStrength,candidatePercentiles,type CatalogEntity,type QlooEvidence} from '../lib/qloo-candidates.ts';
import {exactCatalogEntity,positiveSignals,enrichMomentTaste} from '../lib/catalog-taste.ts';
import {selectMoments} from '../lib/moments.ts';
import type {Opportunity,Preferences} from '../lib/opportunities.ts';
import {extractEventDetails} from '../lib/event-detail-parser.ts';
import {scoutOfficialTaste} from '../lib/taste-scout.ts';
const id=(n:number)=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const entity=(n:number,type='artist'):CatalogEntity=>({id:id(n),name:'Artist '+n,type,input:'Artist '+n,evidence:'performer'});
const now=new Date('2026-10-29T04:00:00Z');
const p:Preferences={intent:'mix',direction:'any',format:'dated',date:'2026-10-29',days:30,budget:'any',unknownPrice:true,seeds:[{id:id(999),name:'Favourite',type:'artist',feeling:'love'}],exclude:[]};
const item=(n:number,patch:Partial<Opportunity>={}):Opportunity=>({id:'event:'+n,title:'Programme '+n,kind:'gig',source:'Official fixture',url:'https://example.com/'+n,description:'Official programme',location:'Tokyo',start:'2026-10-30',end:'2026-10-30',checkedAt:now.toISOString(),price:null,priceLabel:'Unknown',availability:'Check official source',category:'gig',catalogEntities:[entity(n)],...patch});
const evidence=(n:number,domain='artist',affinity=.9):QlooEvidence=>({entityId:id(n),entityName:'Artist '+n,domain,affinity,contributors:[{id:id(999),name:'Favourite',score:1,weight:1}],percentile:.5});

test('candidate scoring covers inventory beyond fifty and rejects out-of-pool identities',async()=>{
 const batches:number[]=[],scored=await scoreInventoryCandidates(Array.from({length:121},(_,i)=>entity(i+1)),[{id:id(999),name:'Favourite',weight:1}],'fixture',{request:async(_path,params)=>{const ids=params['filter.results.entities'].split(',');batches.push(ids.length);return {results:{entities:[...ids.map(entity_id=>({entity_id,name:'Credited artist',query:{affinity:.8,explainability:{'signal.interests.entities':[{entity_id:id(999),score:.7}]}}})),{entity_id:id(888),query:{affinity:1}}]}};}});
 assert.deepEqual(batches,[50,50,21]);assert.equal(scored.evidence.length,121);assert.equal(scored.remaining,0);assert.equal(scored.evidence[120].contributors[0].score,.7);
});
test('domain ranks do not compare unrelated raw affinity scales, and low affinity has no boost',()=>{
 const rows=candidatePercentiles([evidence(1,'artist',.7),evidence(2,'artist',.9),evidence(3,'brand',.99)]);
 assert.equal(rows[0].percentile,0);assert.equal(rows[1].percentile,1);assert.equal(rows[2].percentile,.5);assert.equal(graphStrength(evidence(4,'artist',.1)),0);
});
test('one failed candidate batch does not erase another and request limits are disclosed',async()=>{
 let calls=0;const result=await scoreInventoryCandidates(Array.from({length:151},(_,i)=>entity(i+1)),[{id:id(999),name:'Favourite',weight:1}],'fixture',{maxBatches:2,request:async()=>{calls++;if(calls===1)throw Error('Unavailable');return {results:{entities:[{entity_id:id(51),query:{affinity:.8}}]}};}});
 assert.equal(result.failed,1);assert.equal(result.evidence.length,1);assert.equal(result.remaining,51);
});
test('exact source identity refuses ambiguous names and aliases stay exact',()=>{
 const one={entity_id:id(1),name:'Muji',types:['urn:entity:brand']};
 assert.equal(exactCatalogEntity('MUJI',[one])?.type,'brand');assert.equal(exactCatalogEntity('Muji',[one,{...one,entity_id:id(2)}]),null);assert.equal(exactCatalogEntity('MUJI store',[one]),null);
});
test('only positive reactions add verified catalog entities, never browser-supplied identities',()=>{
 const items=[item(1),item(2),item(3)],context={tags:[],reactions:[{id:'event:1',action:'save' as const,entityIds:[id(888)]},{id:'event:2',action:'pass' as const,reason:'unknown' as const},{id:'event:3',action:'too-expensive' as const}]};
 const signals=positiveSignals(items,p,context);assert.ok(signals.some(s=>s.id===id(1)&&s.weight===.8));assert.ok(!signals.some(s=>[id(2),id(3),id(888)].includes(s.id)));
});
test('exact personal evidence outranks graph association and wildcard is explicit',()=>{
 const rows=selectMoments([item(1,{qlooEvidence:[evidence(1)]}),item(2,{title:'Favourite concert'}),item(3)],p,'all','all','for-you',now);
 assert.equal(rows[0].id,'event:2');assert.equal(rows[0].discovery,'direct');assert.equal(rows.find(o=>o.id==='event:1')?.discovery,'adjacent');assert.equal(rows.find(o=>o.id==='event:3')?.discovery,'wildcard');assert.ok(rows.find(o=>o.id==='event:1')?.reasons?.some(r=>r.includes('association')));
});
test('service caches bounded graph calls and editorial tags never reach Qloo',async()=>{
 let calls=0;const cache=new Map();const read=async(k:string)=>cache.get(k),write=async(k:string,v:any)=>{cache.set(k,v);};
 const request=async(_path:string,params:Record<string,string>)=>{calls++;assert.ok(!params['signal.interests.tags']?.includes('editorial:'));return {results:{entities:params['filter.results.entities']?.split(',').map(entity_id=>({entity_id,name:'Artist',query:{affinity:.8}}))||[]}};};
 const context={tags:[{id:'editorial:collecting',name:'Collecting',weight:1}],reactions:[]};
 const a=await enrichMomentTaste([item(1)],p,'fixture',read,write,context,request),count=calls,b=await enrichMomentTaste([item(1)],p,'fixture',read,write,context,request);
 assert.equal(calls,count);assert.ok(b.diagnostics.cacheHits>0);assert.equal(a.diagnostics.scoredEntities,1);assert.equal(a.diagnostics.tagSignals,0);
});
test('saving a real catalog identity changes subsequent candidate ranking without a negative signal',async()=>{
 const items=[item(1),item(2)];
 const request=async(_path:string,params:Record<string,string>)=>({results:{entities:params['filter.results.entities']?.split(',').map(entity_id=>({entity_id,name:'Artist '+(entity_id===id(1)?1:2),query:{affinity:params['signal.interests.entities'].includes(id(2))?(entity_id===id(2)?.95:.6):(entity_id===id(1)?.95:.6),explainability:{'signal.interests.entities':[{entity_id:id(999),score:1}]}}}))||[]}});
 const before=await enrichMomentTaste(items,p,'fixture',undefined,undefined,undefined,request),after=await enrichMomentTaste(items,p,'fixture',undefined,undefined,{tags:[],reactions:[{id:'event:2',action:'more'}]},request);
 assert.equal(selectMoments(before.items,p,'all','all','for-you',now)[0].id,'event:1');assert.equal(selectMoments(after.items,p,'all','all','for-you',now)[0].id,'event:2');
});
test('no-name interview choices rank grounded music textures, art and objects differently',()=>{
 const rows=[item(1,{title:'Jazz night',description:'Jazz and soul concert'}),item(2,{kind:'exhibition',title:'Photography exhibition',category:'art gallery photography'}),item(3,{kind:'release',title:'Limited edition art toy',description:'Artist toy preorder',category:'designer toys',actionLabel:'Preorder window'})];
 const empty={...p,seeds:[]};
 const context=(direction:string,tag:string)=>({direction,tags:[{id:'editorial:'+tag,name:tag,weight:1}],reactions:[]});
 assert.equal(selectMoments(rows,empty,'all','all','for-you',now,context('music','jazz'))[0].id,'event:1');
 assert.equal(selectMoments(rows,empty,'all','all','for-you',now,context('art','photography'))[0].id,'event:2');
 assert.equal(selectMoments(rows,empty,'all','all','for-you',now,context('objects','designer-toys'))[0].id,'event:3');
 assert.ok(selectMoments(rows,empty,'all','all','for-you',now,context('music','jazz'))[0].reasons?.some(r=>r.includes('listing title')));
});
test('positive reactions survive a category filter and a later missing catalog record via server history',async()=>{
 const cache=new Map(),read=async(k:string)=>cache.get(k),write=async(k:string,v:any)=>{cache.set(k,v);};
 const request=async()=>({results:{entities:[]}}),context={tags:[],reactions:[{id:'event:1',action:'save' as const}]};
 const first=await enrichMomentTaste([item(2)],p,'fixture',read,write,context,request,[item(1),item(2)]);
 assert.ok(first.diagnostics.positiveSignals.some(s=>s.id===id(1)));
 const later=await enrichMomentTaste([item(2)],p,'fixture',read,write,context,request,[]);
 assert.ok(later.diagnostics.positiveSignals.some(s=>s.id===id(1)));
});
test('metaphorical soul and performer names do not become a published soul genre',()=>{
 const text="White Hills: Collected Consciousness\nEnergize your mind and soul.\nA journey through the soul of music.\nSoul Asylum";
 assert.ok(!extractEventDetails(text,'https://artist.bandcamp.com/live/fixture').genres.some(g=>g.name==='soul'));
 assert.ok(extractEventDetails('Genre: soul\nSoul music and jazz','https://artist.bandcamp.com/live/fixture').genres.some(g=>g.name==='soul'));
});
test('taste scout reads one fixed official source and adds only named dated matches',async()=>{
 let calls=0;const html='<article event-id="event_12"><a href="https://www-shibuya.jp/schedule/020033.php"><p class="day">30</p><h3 class="title">Favourite</h3><p class="exp">Tour</p><p class="openstart">OPEN 18:00</p></a></article>';
 const fetcher=(async(url:RequestInfo|URL)=>{calls++;assert.equal(String(url),'https://www-shibuya.jp/schedule/202610.php');return new Response(html,{headers:{'content-type':'text/html'}});}) as typeof fetch;
 const cache=new Map(),read=async(k:string)=>cache.get(k),write=async(k:string,v:any)=>{cache.set(k,v);};
 const a=await scoutOfficialTaste([],p,undefined,read,write,fetcher,now);assert.equal(a.items.length,1);assert.equal(a.items[0].price,null);assert.equal(a.health.parsed,1);
 const b=await scoutOfficialTaste([],{...p,seeds:[{...p.seeds[0],name:'Someone else'}]},undefined,read,write,fetcher,now);assert.equal(calls,1);assert.equal(b.items.length,0);assert.equal(b.health.status,'read');
});
test('taste scout does not follow calendar redirects or invent a match during failure',async()=>{
 const result=await scoutOfficialTaste([],p,undefined,async()=>null,async()=>{},(async()=>new Response('',{status:302,headers:{location:'https://example.org'}})) as typeof fetch,now);
 assert.equal(result.items.length,0);assert.equal(result.health.status,'unavailable');
});
test('liking an unmapped niche event changes later source-based format and tag recommendations',async()=>{
 const empty={...p,seeds:[]},saved=item(1,{kind:'popup',title:'Independent zines and books',category:'books illustration',catalogEntities:[]}),related=item(2,{kind:'popup',title:'Printed paper fair',category:'books illustration',catalogEntities:[]}),other=item(3,{kind:'gig',title:'Electronic club night',category:'music electronic',catalogEntities:[]});
 const context={tags:[],reactions:[{id:saved.id,action:'more' as const}]},cache=new Map(),read=async(k:string)=>cache.get(k),write=async(k:string,v:any)=>{cache.set(k,v);};
 const result=await enrichMomentTaste([other,related],empty,'fixture',read,write,context,async()=>({results:[]}),[saved,other,related]);
 const rows=selectMoments(result.items,empty,'all','all','for-you',now);assert.equal(rows[0].id,related.id);assert.ok(rows[0].reasons?.some(r=>r.startsWith('Source-based')));assert.equal(result.diagnostics.positiveSignals.length,0);assert.equal(rows[0].discovery,'adjacent');
});
test('incidental company biography books do not turn a listening party into an object recommendation',()=>{
 const party=item(1,{kind:'event',title:'Sanzu Sake Bar listening party',description:'Our company is making games, music, books and theatrical magic.',category:'online listening party live music',endsAt:'2026-10-29T05:00:00Z'}),popup=item(2,{kind:'popup',title:'CORNER BOOKS x ODD TAPE pop-up',category:'books illustration'});
 const context={direction:'objects',tags:[{id:'editorial:books',name:'books',weight:1},{id:'editorial:illustration',name:'illustration',weight:1}],reactions:[]};
 const rows=selectMoments([party,popup],{...p,seeds:[]},'all','all','for-you',now,context);
 assert.equal(rows[0].id,popup.id);assert.equal(rows.find(o=>o.id===party.id)?.discovery,'wildcard');assert.ok(!rows.find(o=>o.id===party.id)?.reasons?.some(r=>r.includes('books choices')));
});
test('a game-brand seed alone does not label artist-only graph alternatives as a personal match',()=>{
 const rows=selectMoments([item(1,{qlooEvidence:[evidence(1)]})],{...p,seeds:[{id:id(999),name:'Nintendo',type:'brand',feeling:'love'}]},'all','all','for-you',now);
 assert.equal(rows[0].discovery,'wildcard');assert.ok(rows[0].reasons?.some(r=>r.startsWith('Weak cross-domain')));assert.equal(rows[0].score,1,'An unsupported music association must not retain a ranking boost');
});
test('graph-discovered source identities survive rotating enrichment and keep positive feedback effective',async()=>{
 const cache=new Map(),read=async(k:string)=>cache.get(k),write=async(k:string,v:any)=>{cache.set(k,v);};
 const profile={...p,seeds:[{...p.seeds[0],type:'movie'}]},film=item(1,{kind:'exhibition',title:'Night Kitchen exhibition',catalogEntities:[]}),other=item(2,{kind:'exhibition',title:'Other exhibition',catalogEntities:[]});
 const request=async(path:string,params:Record<string,string>)=>{
  if(path==='/search')return {results:[]};
  if(!params['filter.results.entities'])return {results:{entities:params['filter.type']==='urn:entity:movie'&&!params['signal.interests.entities'].includes(id(1))?[{entity_id:id(1),name:'Night Kitchen',query:{affinity:.9,explainability:{'signal.interests.entities':[{entity_id:id(999),score:1}]}}}]:[]}};
  return {results:{entities:params['signal.interests.entities'].includes(id(1))?[]:[{entity_id:id(1),name:'Night Kitchen',query:{affinity:.9,explainability:{'signal.interests.entities':[{entity_id:id(999),score:1}]}}}]}};
 };
 const first=await enrichMomentTaste([film,other],profile,'fixture',read,write,undefined,request);
 assert.equal(first.items[0].catalogEntities?.[0].id,id(1));assert.equal(cache.get('catalog-taste:subject-history:v1').items[film.id][0].id,id(1));
 const next=await enrichMomentTaste([film,other],profile,'fixture',read,write,{tags:[],reactions:[{id:film.id,action:'more',entityIds:[id(888)]}]},request);
 assert.ok(next.diagnostics.positiveSignals.some(s=>s.id===id(1)));assert.ok(!next.diagnostics.positiveSignals.some(s=>s.id===id(888)));
 assert.equal(next.items[0].catalogEntities?.[0].id,id(1));assert.equal(next.items[0].feedbackEntities?.[0].id,id(1));assert.equal(next.diagnostics.candidateEntities,1);
 assert.equal(selectMoments(next.items,profile,'all','all','for-you',now)[0].id,film.id);
 const changed=await enrichMomentTaste([{...film,title:'A completely different programme'},other],profile,'fixture',read,write,{tags:[],reactions:[{id:film.id,action:'more'}]},request);
 assert.ok(!changed.diagnostics.positiveSignals.some(s=>s.id===id(1)));assert.equal(changed.items[0].catalogEntities?.length,0);
});
test('quoted TUTTI tour title cannot become an uncredited Arthur Aguiar identity, including saved history',async()=>{
 const wrong:CatalogEntity={id:'8CEBCB83-9E65-4760-AE81-DFEB83A89CA0',name:'Arthur Aguiar',type:'person',input:'TUTTI',evidence:'source-name'};
 const gig=item(1,{title:'"TUTTI"20th ANNIVERSARY TOUR — GOING UNDER GROUND',catalogEntities:[],artists:[{id:id(10),name:'GOING UNDER GROUND',input:'GOING UNDER GROUND',genres:[]}],details:extractEventDetails('LINE UP\nGOING UNDER GROUND','https://example.com/1')});
 const movie=item(2,{kind:'exhibition',title:'「かもめ食堂」展',catalogEntities:[]});
 const cache=new Map<string,any>([['catalog-taste:subject-history:v1',{items:{[gig.id]:[wrong]},features:{}}]]),read=async(k:string)=>cache.get(k),write=async(k:string,v:any)=>{cache.set(k,v);};
 const profile={...p,seeds:[{...p.seeds[0],name:'Nintendo',type:'brand'}]};
 const request=async(path:string,params:Record<string,string>)=>path==='/search'?{results:params.query==='TUTTI'?[{entity_id:wrong.id,name:wrong.name,types:['urn:entity:person'],properties:{akas:['TUTTI']}}]:params.query==='かもめ食堂'?[{entity_id:id(20),name:'かもめ食堂',types:['urn:entity:movie']}]:[]}:{results:{entities:[]}};
 const result=await enrichMomentTaste([gig,movie],profile,'fixture',read,write,undefined,request);
 assert.deepEqual(result.items[0].catalogEntities?.map(e=>e.name),['GOING UNDER GROUND']);
 assert.ok(!cache.get('catalog-taste:subject-history:v1').items[gig.id].some((e:CatalogEntity)=>e.id===wrong.id));
 assert.equal(result.items[1].catalogEntities?.[0].name,'かもめ食堂');
 const feedback=positiveSignals(result.items,profile,{tags:[],reactions:[{id:gig.id,action:'more',entityIds:[wrong.id]}]},cache.get('catalog-taste:subject-history:v1').items);
 assert.ok(!feedback.some(s=>s.id===wrong.id));assert.ok(feedback.some(s=>s.id===id(10)));
});
