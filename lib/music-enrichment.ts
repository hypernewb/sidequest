import {enrichOne,withDetails} from './event-enrichment.ts';
import {extractEventDetails} from './event-detail-parser.ts';
import type {Opportunity} from './opportunities.ts';
export function musicCoverage(items:Opportunity[]){const gigs=items.filter(o=>o.kind==='gig');return {gigs:gigs.length,withLineup:gigs.filter(o=>o.details?.artists.length).length,fullPages:gigs.filter(o=>o.details?.level==='full').length,withResolvedArtists:gigs.filter(o=>o.artists?.length).length,withGenres:gigs.filter(o=>o.details?.genres.length||o.artists?.some(a=>a.genres.length)).length};}
export function selectMusicReads(items:Opportunity[],limit=24,now=Date.now()){
 const groups=new Map<string,Opportunity[]>();
 const gigs=items.filter(o=>o.kind==='gig'&&o.source!=='Fever'&&(!o.details||o.details.level!=='full'||now-Date.parse(o.details.checkedAt)>86400000))
  .sort((a,b)=>(a.details?.level==='full'?1:0)-(b.details?.level==='full'?1:0)||(a.details?.checkedAt||'').localeCompare(b.details?.checkedAt||'')||(a.start||'').localeCompare(b.start||''));
 for(const o of gigs){const g=groups.get(o.source)||[];g.push(o);groups.set(o.source,g);}
 const out:Opportunity[]=[];while(out.length<limit&&[...groups.values()].some(g=>g.length))for(const g of groups.values()){const o=g.shift();if(o&&out.length<limit)out.push(o);}return out;
}
export async function enrichMusic(items:Opportunity[],fetcher:typeof fetch=fetch,limit=24){
 // Reparse stored source evidence after parser improvements without pretending to
 // have re-fetched it. Keep the original checkedAt and any translated excerpt.
 items=items.map(o=>{if(o.kind!=='gig'||!o.details)return o;const old=o.details,d=extractEventDetails(o.title+'\n'+old.original,old.url,old.checkedAt);return {...o,details:{...old,...d,original:old.original,artists:d.artists.length?d.artists:old.artists}};});
 const selected=selectMusicReads(items,limit),updates=new Map<string,Opportunity>();let read=0,failed=0;
 for(let i=0;i<selected.length;i+=4)await Promise.all(selected.slice(i,i+4).map(async o=>{try{updates.set(o.id,withDetails(o,await enrichOne(o.url,fetcher,true)));read++;}catch{failed++;}}));
 const result=items.map(o=>updates.get(o.id)||o);return {items:result,read,failed,remaining:selectMusicReads(result,3000).length,coverage:musicCoverage(result)};
}
