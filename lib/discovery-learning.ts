import type {Opportunity} from './opportunities.ts';
import type {MomentTasteContext} from './taste-profile.ts';
import {programmeGenres,subjectNames} from './interest-match.ts';

export type ChoiceOutcome='left'|'right'|'neither'|'unknown';
export type ChoiceHistory={leftId:string;rightId:string;outcome:ChoiceOutcome}[];
export type DiscoveryPair={left?:Opportunity;right?:Opportunity;reason:string;exhausted:boolean};
const clean=(s:string)=>s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const slug=(s:string)=>clean(s).replace(/\s+/g,'-').slice(0,100);
// A small vocabulary of literal programme subjects. No promotional description
// is inspected, and ambiguous mood words such as "soul" are intentionally absent.
const titleSubjects:[string,RegExp][]=[
 ['books-zines',/\bbooks?\b|\bzines?\b|書籍|古本|本屋|出版|ブック|文学/u],
 ['photography',/\bphotograph(?:y|s|ic)?\b|\bphoto\b|写真展|写真集|写真家/u],
 ['records',/\brecords?\b|\bvinyl\b|レコード|ヴァイナル/u],
 ['artist-toys',/\b(?:artist|designer|art)\s+toys?\b|\bsofubi\b|ソフビ|アートトイ|デザイナーズトイ/u],
 ['fashion',/\bfashion\b|\bapparel\b|\bclothing\b|ファッション|アパレル|洋服/u],
 ['ceramics',/\bceramics?\b|\bpottery\b|陶芸|陶器|やきもの/u],
 ['illustration',/\billustration\b|\billustrator\b|イラスト|版画/u],
 ['film-screening',/\bfilm\s+(?:screening|festival)\b|\bcinema\b|映画祭|映画上映|上映会/u],
 ['tabletop-games',/\bboard\s+games?\b|\btabletop\b|ボードゲーム/u],
];
// Only structured programme evidence and explicit source subjects enter this space.
// Descriptions (including words such as "soulful") never become genre signals.
export function discoveryFacets(o:Opportunity):string[]{
 const title=o.title.normalize('NFKC').toLowerCase();
 return [...new Set(['format:'+o.kind,'category:'+clean(o.category),...titleSubjects.filter(([,pattern])=>pattern.test(title)).map(([name])=>'subject:'+name),...programmeGenres(o).map(g=>'genre:'+clean(g.name)),...subjectNames(o).map(n=>'subject:'+clean(n)),...(o.catalogEntities||[]).map(e=>'entity:'+e.id),...(o.artists||[]).map(a=>'entity:'+a.id)])].filter(f=>!f.endsWith(':'));
}
function overlap(a:string[],b:string[]){const right=new Set(b);return a.filter(v=>right.has(v)).length/Math.max(1,Math.min(a.length,b.length));}
function programme(o:Opportunity){return clean(o.title).replace(/\b(?:20\d{2}|vol\s*\d+|\d{1,2})\b/g,'').replace(/\s+/g,' ').trim();}
function sameProgramme(a:Opportunity,b:Opportunity){
 if(a.id===b.id)return true;
 const url=(o:Opportunity)=>{try{const u=new URL(o.url);return u.origin+u.pathname.replace(/\/$/,'');}catch{return o.url;}};
 return url(a)===url(b)||!!programme(a)&&programme(a)===programme(b);
}
function prior(o:Opportunity){
 const graph=Math.max(0,...(o.qlooEvidence||[]).map(e=>e.affinity>=.55?(1+Math.max(0,Math.min(1,e.percentile))*2)*(e.contributors.length?Math.max(...e.contributors.map(c=>Math.min(1,c.score)*c.weight)):.25):0));
 return Math.min(4,Math.max(0,o.score||0)/5)+graph+Math.min(2,Math.max(0,o.sourceFeedback?.score||0))+(o.discovery==='direct'?1:o.discovery==='adjacent'?.5:0);
}
function preferences(items:readonly Opportunity[],context:MomentTasteContext,history:ChoiceHistory){
 const weights=new Map<string,number>();
 const add=(o:Opportunity|undefined,n:number)=>{if(o)for(const f of discoveryFacets(o))weights.set(f,Math.max(-2,Math.min(4,(weights.get(f)||0)+n)));};
 for(const tag of context.tags){
  const key=tag.id.startsWith('editorial:discovery-')?tag.id.slice('editorial:discovery-'.length):'';
  for(const o of items)for(const f of discoveryFacets(o)){
   const structuredLabel=f.slice(f.indexOf(':')+1);
   if(key?slug(f)===key:(f.startsWith('genre:')||f.startsWith('category:'))&&structuredLabel===clean(tag.name))weights.set(f,Math.max(weights.get(f)||0,tag.weight));
  }
 }
 for(const r of context.reactions){if(r.action==='more'||r.action==='save')add(items.find(o=>o.id===r.id),r.action==='save'?1.4:1);}
 for(const h of history.slice(-40)){if(h.outcome==='left'||h.outcome==='right'){add(items.find(o=>o.id===(h.outcome==='left'?h.leftId:h.rightId)),1.2);add(items.find(o=>o.id===(h.outcome==='left'?h.rightId:h.leftId)),-.15);}}
 return weights;
}
function pool(items:readonly Opportunity[],seen:readonly string[],context:MomentTasteContext,history:ChoiceHistory){
 if(seen.length>=200)return [];
 const viewed=items.filter(o=>seen.includes(o.id)),weights=preferences(items,context,history);
 const ranked=items.filter(o=>!seen.includes(o.id)&&!viewed.some(v=>sameProgramme(o,v))).map(o=>{
  const facets=discoveryFacets(o),learned=facets.reduce((n,f)=>n+(weights.get(f)||0),0)/Math.sqrt(facets.length||1);
  const recent=viewed.slice(-8).reduce((n,v,i)=>n+overlap(facets,discoveryFacets(v))*(i+1)/8,0);
  const uncertainty=facets.reduce((n,f)=>n+1/(1+Math.abs(weights.get(f)||0)),0)/(facets.length||1);
  return {o,facets,relevance:prior(o)+learned,score:prior(o)+learned+.65*uncertainty-.5*recent};
 });
 const floor=Math.max(0,Math.max(0,...ranked.map(r=>r.relevance))-3);
 return ranked.filter(r=>r.relevance>=floor).sort((a,b)=>b.score-a.score||a.o.id.localeCompare(b.o.id));
}
export function chooseNext(items:readonly Opportunity[],seen:readonly string[],context:MomentTasteContext,history:ChoiceHistory=[]):Opportunity|undefined{
 return pool(items,seen,context,history)[0]?.o;
}
export function choosePair(items:readonly Opportunity[],seen:readonly string[],context:MomentTasteContext,comparisons:ChoiceHistory=[]):DiscoveryPair{
 if(comparisons.length>=40)return {reason:'This round has reached its 40-comparison limit. Start a new round to continue.',exhausted:true};
 const compared=comparisons.flatMap(c=>[c.leftId,c.rightId]),candidates=pool(items,[...new Set([...seen,...compared])],context,comparisons).slice(0,60);
 if(!candidates.length)return {reason:'No unseen eligible listings remain in this round.',exhausted:true};
 const left=candidates[0];
 const right=candidates.slice(1).filter(r=>!sameProgramme(left.o,r.o)).sort((a,b)=>{
  const cultural=(facets:string[])=>facets.filter(f=>/^(genre|subject|entity):/.test(f));
  const leftCulture=cultural(left.facets);
  const value=(r:typeof a)=>{
   const otherCulture=cultural(r.facets);
   const contrast=leftCulture.length&&otherCulture.length?1-overlap(leftCulture,otherCulture):0;
   return r.score+1.8*(1-overlap(left.facets,r.facets))+1.2*contrast;
  };
  return value(b)-value(a)||a.o.id.localeCompare(b.o.id);
 })[0];
 return {left:left.o,right:right?.o,exhausted:!right,reason:right?'Two current listings with contrasting source-supported details. Your choice adjusts this session; it does not establish an artist dislike.':'One unseen eligible listing remains. There is no distinct comparison available.'};
}
export function recordComparison(history:ChoiceHistory,left:Opportunity,right:Opportunity,outcome:ChoiceOutcome):ChoiceHistory{
 return [...history,{leftId:left.id,rightId:right.id,outcome}].slice(-40);
}
// Return a draft. The caller decides whether to keep it as the saved profile.
export function applyChoice(context:MomentTasteContext,chosen:Opportunity,_rejected?:Opportunity):MomentTasteContext{
 void _rejected; // A relative choice deliberately creates no persistent negative signal.
 const tags=context.tags.map(t=>({...t}));
 for(const facet of discoveryFacets(chosen).filter(f=>/^(subject|genre|category):/.test(f)).sort((a,b)=>Number(a.startsWith('category:'))-Number(b.startsWith('category:'))).slice(0,3)){
  const id='editorial:discovery-'+slug(facet),existing=tags.find(t=>t.id===id);
  if(existing)existing.weight=Math.min(1,existing.weight+.1);else if(tags.length<16)tags.push({id,name:facet.slice(facet.indexOf(':')+1).replaceAll('-',' ').slice(0,100),weight:.35});
 }
 return {...context,tags,reactions:[...context.reactions.filter(r=>r.id!==chosen.id),{id:chosen.id,action:'more' as const,reason:'taste' as const}].slice(-100)};
}
