import {qloo} from './qloo.ts';

export type CatalogEntity={id:string;name:string;type:string;input:string;evidence:'performer'|'source-name'|'confirmed-seed'};
export type TasteSignal={id:string;name:string;weight:number};
export type QlooEvidence={entityId:string;entityName:string;domain:string;affinity:number;contributors:{id:string;name:string;score:number;weight:number}[];percentile:number;inputWeight?:number};
export type QlooRequest=(path:string,params:Record<string,string>,key:string)=>Promise<any>;
export const entityDomain=(type:string)=>type.replace(/^urn:entity:/,'').replace(/^video_game$/,'videogame');
export const supportedDomain=(type:string)=>['artist','brand','movie','tv_show','book','videogame','person'].includes(entityDomain(type));
export function evidenceFromEntity(e:any,domain:string,signals:TasteSignal[]):QlooEvidence|null{
 const affinity=e.query?.affinity;
 if(typeof e.entity_id!=='string'||!Number.isFinite(affinity)||affinity<0||affinity>1)return null;
 const contributors=(e.query?.explainability?.['signal.interests.entities']||[]).flatMap((c:any)=>{
  const s=signals.find(s=>s.id.toLowerCase()===String(c.entity_id).toLowerCase());
  return s&&Number.isFinite(c.score)&&c.score>0?[{id:s.id,name:s.name,score:c.score,weight:s.weight}]:[];
 });
 return {entityId:e.entity_id,entityName:String(e.name||''),domain,affinity,contributors,percentile:0,inputWeight:signals.length?Math.max(...signals.map(s=>s.weight)):1};
}
// Compare percentiles only within one domain and one request context. Raw Qloo
// affinity is retained as evidence, never represented as a satisfaction percentage.
export function candidatePercentiles(evidence:QlooEvidence[]){
 return evidence.map(e=>{const peers=evidence.filter(p=>p.domain===e.domain);return {...e,percentile:peers.length<=1?.5:peers.filter(p=>p.affinity<e.affinity).length/(peers.length-1)};});
}
export function graphStrength(e:QlooEvidence){
 if(e.affinity<.55)return 0;
 const influence=e.contributors.length?Math.max(...e.contributors.map(c=>Math.min(1,c.score)*c.weight)):.25*(e.inputWeight??1);
 return (1+e.percentile*2)*influence;
}
export async function scoreInventoryCandidates(entities:CatalogEntity[],signals:TasteSignal[],key:string,options:{request?:QlooRequest;tags?:{id:string;weight:number}[];maxBatches?:number}={}){
 const request=options.request||qloo,evidence:QlooEvidence[]=[],requested=new Set<string>();let batches=0,failed=0;
 const unique=[...new Map(entities.filter(e=>supportedDomain(e.type)).map(e=>[e.id.toLowerCase(),e])).values()];
 const tags=(options.tags||[]).filter(t=>/^urn:tag:/.test(t.id)).sort((a,b)=>b.weight-a.weight).slice(0,8);
 if(!signals.length&&!tags.length)return {evidence,requested:0,remaining:unique.length,batches,failed};
 for(const domain of [...new Set(unique.map(e=>entityDomain(e.type)))]){
  const candidates=unique.filter(e=>entityDomain(e.type)===domain);
  for(let i=0;i<candidates.length;i+=50){
   if(batches>=(options.maxBatches??12))break;
   const batch=candidates.slice(i,i+50),ids=new Set(batch.map(e=>e.id.toLowerCase()));batches++;batch.forEach(e=>requested.add(e.id.toLowerCase()));
   const params:Record<string,string>={'filter.type':'urn:entity:'+domain,'filter.results.entities':batch.map(e=>e.id).join(','),take:String(batch.length),'feature.explainability':'true'};
   if(signals.length)params['signal.interests.entities']=signals.map(s=>s.id).join(',');
   if(tags.length)params['signal.interests.tags']=tags.map(t=>t.id).join(',');
   try{const b=await request('/v2/insights',params,key);for(const e of b.results?.entities||[]){if(!ids.has(String(e.entity_id).toLowerCase()))continue;const v=evidenceFromEntity(e,domain,signals);if(v)evidence.push(v);}}catch{failed++;}
  }
 }
 return {evidence:candidatePercentiles(evidence),requested:requested.size,remaining:unique.length-requested.size,batches,failed};
}
