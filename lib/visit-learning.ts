import type {Opportunity} from './opportunities.ts';
import {learningReactions,reactionTasteWeight,type MomentTasteContext} from './taste-profile.ts';
import type {CatalogEntity} from './qloo-candidates.ts';

export type ItemFeatures={kind:string;title:string;tags:string[]};
type Evidence={entities:CatalogEntity[];features?:ItemFeatures};
export function applyQuestLearning(items:Opportunity[],context?:MomentTasteContext){
 const reactions=new Map(learningReactions(context).map(r=>[r.id.toUpperCase(),r]));
 return items.map(o=>{const reaction=reactions.get(o.id.toUpperCase()),weight=reaction?reactionTasteWeight(reaction):0;if(!o.curation||!reaction||!weight)return o;
  return {...o,curation:{...o.curation,tasteScore:(o.curation.tasteScore||0)+weight*(reaction.action==='visit'?20:2)}};
 });
}
export function learnedVisitMatch(o:Opportunity,context:MomentTasteContext|undefined,lookup:(id:string)=>Evidence){
 const identities=new Set([...(o.catalogEntities||[]).map(e=>e.id.toLowerCase()),...(o.artists||[]).map(a=>a.id.toLowerCase())]);
 const adjustments:{score:number;reason:string}[]=[];
 for(const r of learningReactions(context)){
  if(!['visit','planned'].includes(r.action))continue;
  const weight=reactionTasteWeight(r);if(!weight)continue;
  const source=lookup(r.id),named=source.entities.filter(e=>identities.has(e.id.toLowerCase()));
  // A low enjoyment score never becomes a genre-wide ban. It only nudges
  // listings with the same verified artist, brand or cultural identity.
  if(named.length||r.id===o.id){
   const label=source.features?.title||'a previous find';
   adjustments.push({score:weight*(r.action==='visit'?12:2),reason:r.action==='visit'?`Your ${r.rating}/5 enjoyment rating for ${label.slice(0,90)} ${weight>0?'favours':'lowers'} this ${named.length?'shared '+named.slice(0,2).map(e=>e.name).join(', ')+' connection':'listing'}.`:`You chose ${label.slice(0,90)} for a day out. A light nudge toward this shared connection.`});
  }
 }
 if(!adjustments.length)return {score:0,reasons:[] as string[]};
 const score=Math.max(-12,Math.min(12,adjustments.reduce((n,a)=>n+a.score,0)));
 return {score,reasons:adjustments.sort((a,b)=>Math.abs(b.score)-Math.abs(a.score)).slice(0,2).map(a=>a.reason)};
}
