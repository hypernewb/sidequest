import {interestWeight} from './interest-strength.ts';
import type {Opportunity,Preferences} from './opportunities.ts';
import {namedMention,subjectNames} from './interest-match.ts';
import {qloo} from './qloo.ts';
import {artistFitsProgramme,artistName} from './artist-matching.ts';
import {scoreInventoryCandidates,supportedDomain,entityDomain,evidenceFromEntity,type CatalogEntity,type TasteSignal,type QlooRequest,type QlooEvidence} from './qloo-candidates.ts';
import type {MomentTasteContext} from './taste-profile.ts';
import {momentTasteFeatures,sourceFeedbackMatch} from './moments.ts';

const DOMAINS=['artist','brand','movie','videogame','person'];
const normalize=(s:string)=>s.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,' ').trim();
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function exactCatalogEntity(input:string,items:any[]):CatalogEntity|null{
 const hits=items.filter(e=>uuid.test(e.entity_id||'')&&[e.name,...(e.properties?.akas||[]).map((a:any)=>typeof a==='string'?a:a.name||a.value)].some(n=>typeof n==='string'&&normalize(n)===normalize(input)));
 const unique=[...new Map(hits.flatMap(e=>{const type=(e.types||[e.subtype]).find((t:string)=>supportedDomain(t));return type?[[String(e.entity_id).toLowerCase(),{id:e.entity_id,name:e.name,type:entityDomain(type),input,evidence:'source-name' as const}] as const]:[]})).values()];
 return unique.length===1?unique[0]:null;
}
export function entityFitsSourceRole(o:Opportunity,e:CatalogEntity){
 const musical=o.kind==='gig'||o.kind==='event'&&/listening party|live music|concert|online.*music/i.test(o.title+' '+o.category);
 if(!musical||!['artist','person'].includes(entityDomain(e.type))||e.evidence==='performer')return true;
 // A quoted show/album title is not a performer credit, even when Qloo has
 // an exact alias belonging to somebody in another cultural domain.
 return (o.details?.artists||[]).some(n=>[e.input,e.name].some(v=>artistName(n)===artistName(v)))||(o.artists||[]).some(a=>a.id.toLowerCase()===e.id.toLowerCase()||[a.input,a.name].some(n=>[e.input,e.name].some(v=>artistName(n)===artistName(v))));
}
export function catalogEntities(o:Opportunity):CatalogEntity[]{
 return [...new Map([...(o.catalogEntities||[]).filter(e=>entityFitsSourceRole(o,e)),...(o.artists||[]).filter(a=>artistFitsProgramme(o,a)).map(a=>({id:a.id,name:a.name,type:'artist',input:a.input,evidence:'performer' as const}))].map(e=>[e.id.toLowerCase(),e])).values()];
}
export function retainedCatalogEntities(o:Opportunity,history:CatalogEntity[]=[]){
 const retained=history.filter(e=>uuid.test(e.id)&&supportedDomain(e.type)&&entityFitsSourceRole(o,e)&&(namedMention(o.title,e.input)||namedMention(o.title,e.name)||namesFromSource(o).some(n=>[e.input,e.name].some(v=>normalize(n)===normalize(v)))||e.type==='artist'&&(o.details?.artists||[]).some(n=>artistName(n)===artistName(e.input)||artistName(n)===artistName(e.name))));
 return [...new Map([...retained,...catalogEntities(o)].map(e=>[e.id.toLowerCase(),e])).values()];
}
export function positiveSignals(items:Opportunity[],p:Preferences,context?:MomentTasteContext,history:Record<string,CatalogEntity[]>={}):TasteSignal[]{
 const signals:TasteSignal[]=p.seeds.filter(s=>interestWeight(s)>0).map(s=>({id:s.id,name:s.name,weight:interestWeight(s)}));
 for(const r of (context?.reactions||[]).slice(-100)){
  if(r.action!=='save'&&r.action!=='more')continue;
  const item=items.find(o=>o.id===r.id),entities=item?retainedCatalogEntities(item,history[r.id]):history[r.id]||[];
  // The browser cannot assign a fabricated entity identity to a saved event.
  for(const e of entities)signals.push({id:e.id,name:e.name,weight:r.action==='save'?.8:.6});
 }
 const explicit=new Map(p.seeds.map(s=>[s.id.toLowerCase(),s]));
 return [...new Map(signals.filter(s=>!explicit.has(s.id.toLowerCase())||interestWeight(explicit.get(s.id.toLowerCase())!)>0).map(s=>({...s,weight:explicit.has(s.id.toLowerCase())?interestWeight(explicit.get(s.id.toLowerCase())!):s.weight})).sort((a,b)=>a.weight-b.weight).map(s=>[s.id.toLowerCase(),s])).values()].sort((a,b)=>b.weight-a.weight).slice(0,16);
}
function namesFromSource(o:Opportunity){
 const quoted=[...o.title.matchAll(/[「『"]([^「」『』"]{3,70})[」』"]/g)].map(m=>m[1]);
 return [...new Set([...subjectNames(o),...quoted])].filter(n=>n.length>=3);
}
function cacheId(path:string,params:Record<string,string>){let h=2166136261;const raw=path+JSON.stringify(Object.entries(params).sort());for(let i=0;i<raw.length;i++)h=Math.imul(h^raw.charCodeAt(i),16777619);return 'catalog-taste:v2:'+((h>>>0).toString(16));}
export type TasteScouting={id:string;name:string;type:string;affinity:number;evidence?:QlooEvidence;catalogIds:string[];sources:{name:string;url:string;researchUrl:string}[]};
export async function enrichMomentTaste(items:Opportunity[],p:Preferences,key:string,read:(k:string)=>Promise<any>=async()=>null,write:(k:string,v:any)=>Promise<void>=async()=>{},context?:MomentTasteContext,request:QlooRequest=qloo,signalInventory:Opportunity[]=items){
 let calls=0,hits=0,failures=0,resolved=0,ambiguous=0,identitySearches=0;const MAX_CALLS=16,started=Date.now();
 const cached:QlooRequest=async(path,params,k)=>{const id=cacheId(path,params);let old:any;try{old=await read(id);}catch{}if(old&&Date.now()-old.at<6*3600000){hits++;return old.data;}if(calls>=MAX_CALLS||Date.now()-started>10000){failures++;throw Error('Taste request budget reached');}calls++;try{const data=await (request===qloo?qloo(path,params,k,AbortSignal.timeout(4500)):request(path,params,k));try{await write(id,{at:Date.now(),data});}catch{}return data;}catch(e){failures++;throw e;}};
 let history:Record<string,CatalogEntity[]>={},featureHistory:Record<string,ReturnType<typeof momentTasteFeatures>>={};try{const old=await read('catalog-taste:subject-history:v1');history=old?.items||{};featureHistory=old?.features||{};}catch{}
 let enriched:(Opportunity&{catalogEntities:CatalogEntity[]})[]=items.map(o=>({...o,catalogEntities:retainedCatalogEntities(o,history[o.id]),qlooEvidence:[]}));
 // Resolve source names, not guessed product affiliations. Ambiguous exact-name
 // records remain unresolved. Successful/empty searches share a six-hour cache.
 const names=[...new Map([...enriched.flatMap(o=>subjectNames(o)),...enriched.flatMap(namesFromSource)].map(n=>[normalize(n),n] as const)).values()].sort((a,b)=>Number(p.seeds.some(s=>normalize(s.name)===normalize(b)))-Number(p.seeds.some(s=>normalize(s.name)===normalize(a))));
 const hasTaste=p.seeds.some(s=>interestWeight(s)>0)||!!context?.tags.some(t=>/^urn:tag:/.test(t.id))||!!context?.reactions.some(r=>r.action==='save'||r.action==='more');
 let cursor=0;try{cursor=Number((await read('catalog-taste:identity-cursor'))?.index)||0;}catch{}
 const ordered=[...new Set([...names.filter(n=>p.seeds.some(s=>normalize(s.name)===normalize(n))),...names.slice(cursor%Math.max(1,names.length)),...names.slice(0,cursor%Math.max(1,names.length))])];
 const identityStart=calls;
 for(const name of (hasTaste?ordered.slice(0,40):[]))try{
  if(calls-identityStart>=4)break;identitySearches++;
  const b=await cached('/search',{query:name,types:DOMAINS.map(d=>'urn:entity:'+d).join(','),take:'20'},key),entity=exactCatalogEntity(name,Array.isArray(b.results)?b.results:[]);
  if(entity){resolved++;enriched=enriched.map(o=>entityFitsSourceRole(o,entity)&&namesFromSource(o).some(n=>normalize(n)===normalize(name))?{...o,catalogEntities:[...o.catalogEntities,entity]}:o);}else ambiguous++;
  cursor=(names.indexOf(name)+1)%Math.max(1,names.length);
 }catch{}
 if(hasTaste)try{await write('catalog-taste:identity-cursor',{index:cursor});}catch{}
 let sourceInventory=[...new Map([...signalInventory.map(o=>({...o,catalogEntities:retainedCatalogEntities(o,history[o.id])})),...enriched].map(o=>[o.id,o])).values()];
 for(const o of sourceInventory)history[o.id]=catalogEntities(o);
 history=Object.fromEntries(Object.entries(history).slice(-2000));
 for(const o of sourceInventory)featureHistory[o.id]=momentTasteFeatures(o);
 featureHistory=Object.fromEntries(Object.entries(featureHistory).slice(-2000));
 const signals=positiveSignals(sourceInventory,p,context,history),tags=context?.tags.filter(t=>/^urn:tag:/.test(t.id))||[];
 const scouting:TasteScouting[]=[];
 // Related names produce bounded official-source research links and can be
 // attached to inventory only where the actual source names that entity.
 const availableDomains=[...new Set(enriched.flatMap(o=>o.catalogEntities.map(e=>entityDomain(e.type))))];
 const seedDomains=p.seeds.filter(s=>interestWeight(s)>0).sort((a,b)=>interestWeight(b)-interestWeight(a)).map(s=>entityDomain(s.type)).filter(supportedDomain);
 const domains=[...new Set([...seedDomains,...availableDomains,...DOMAINS])].slice(0,2);
 if(signals.length||tags.length)for(const domain of domains)try{
  const params:Record<string,string>={'filter.type':'urn:entity:'+domain,take:'6','feature.explainability':'true'};
  if(signals.length)params['signal.interests.entities']=signals.map(s=>s.id).join(',');if(tags.length)params['signal.interests.tags']=tags.slice(0,8).map(t=>t.id).join(',');
  const b=await cached('/v2/insights',params,key);
  for(const e of b.results?.entities||[]){const evidence=evidenceFromEntity(e,domain,signals);if(!evidence||!uuid.test(e.entity_id)||typeof e.name!=='string'||e.name.length<4)continue;
   const entity:CatalogEntity={id:e.entity_id,name:e.name,type:domain,input:e.name,evidence:'source-name'};
   const matches=enriched.filter(o=>entityFitsSourceRole(o,entity)&&(namedMention(o.title,e.name)||(domain==='artist'&&(o.details?.artists||[]).some(n=>artistName(n)===artistName(e.name)))));
   enriched=enriched.map(o=>matches.some(m=>m.id===o.id)?{...o,catalogEntities:[...o.catalogEntities,entity]}:o);
   const sourcePool=enriched.filter(o=>domain==='artist'?o.kind==='gig':domain==='movie'?['event','exhibition'].includes(o.kind):['release','popup','exhibition','event'].includes(o.kind));
   const sources=[...new Map(sourcePool.flatMap(o=>{try{const u=new URL(o.url);return [[u.hostname,{name:o.source,url:u.origin,researchUrl:'https://www.google.com/search?q='+encodeURIComponent('site:'+u.hostname+' "'+e.name+'"')}]] as const;}catch{return [];}})).values()].slice(0,3);
   if(sources.length)scouting.push({id:e.entity_id,name:e.name,type:domain,affinity:evidence.affinity,evidence,catalogIds:matches.map(o=>o.id),sources});
  }
 }catch{}
 // Stable identity ordering keeps rotating searches from reshuffling batch
 // membership. Newly discovered mappings are retained after this graph pass.
 const scored=await scoreInventoryCandidates(enriched.flatMap(o=>o.catalogEntities).sort((a,b)=>entityDomain(a.type).localeCompare(entityDomain(b.type))||a.id.toLowerCase().localeCompare(b.id.toLowerCase())),signals,key,{request:cached,tags,maxBatches:10});
 sourceInventory=[...new Map([...sourceInventory,...enriched].map(o=>[o.id,o])).values()];
 for(const o of sourceInventory)history[o.id]=catalogEntities(o);
 history=Object.fromEntries(Object.entries(history).slice(-2000));
 try{await write('catalog-taste:subject-history:v1',{at:Date.now(),items:history,features:featureHistory});}catch{}
 const feedback=positiveSignals(sourceInventory,p,context,history).filter(s=>!p.seeds.some(seed=>seed.id.toLowerCase()===s.id.toLowerCase()));
 const sourceTargets=(context?.reactions||[]).filter(r=>['save','more'].includes(r.action)&&!history[r.id]?.length&&featureHistory[r.id]).map(r=>({...featureHistory[r.id],weight:r.action==='save'?1:.8}));
 enriched=enriched.map(o=>({...o,catalogEntities:catalogEntities(o),sourceFeedback:sourceFeedbackMatch(o,sourceTargets),feedbackEntities:feedback.filter(s=>o.catalogEntities.some(e=>e.id.toLowerCase()===s.id.toLowerCase())),qlooEvidence:scored.evidence.filter(e=>o.catalogEntities.some(c=>c.id.toLowerCase()===e.entityId.toLowerCase()))}));
 return {items:enriched,scouting,diagnostics:{status:!signals.length&&!tags.length?'no-taste':failures?'partial':scored.evidence.length?'ready':'no-mapped-results',calls,cacheHits:hits,failures,catalogItems:items.length,mappedItems:enriched.filter(o=>o.catalogEntities.length).length,candidateEntities:new Set(enriched.flatMap(o=>o.catalogEntities.map(e=>e.id.toLowerCase()))).size,scoredEntities:scored.evidence.length,unscoredEntities:new Set(enriched.flatMap(o=>o.catalogEntities.map(e=>e.id.toLowerCase()))).size-scored.evidence.length,unrequestedEntities:scored.remaining,identityNamesAvailable:names.length,identitySearches,resolvedNames:resolved,unresolvedNames:ambiguous,positiveSignals:signals.map(s=>({id:s.id,name:s.name,weight:s.weight})),tagSignals:tags.length,graphAffinityFloor:.55,scoutingMode:'research-links',notes:'Qloo ranks mapped cultural entities within eligible announcements. Identity gaps and provider failures leave unpersonalised options. The 0.55 affinity floor is a conservative app ranking rule, not a provider quality threshold. Scouting prepares searches of sampled official sources; it does not automatically read or verify new announcements.'}};
}
