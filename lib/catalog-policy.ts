import type {Opportunity} from './opportunities.ts';
export const CATALOG_RETENTION_MS=7*86400000;
export function catalogCurrent(o:Opportunity,now=new Date()){
 const today=now.toLocaleDateString('en-CA',{timeZone:'Asia/Tokyo'});
 if(!o.start||!/^\d{4}-\d{2}-\d{2}$/.test(o.start)||!Number.isFinite(Date.parse(o.checkedAt)))return false;
 if(now.getTime()-Date.parse(o.checkedAt)>CATALOG_RETENTION_MS)return false;
 if(o.details?.status==='cancelled'||o.details?.status==='sold_out'||/listed.*sold out when checked|Source says SOLD OUT|official page says sold out/i.test(o.availability))return false;
 if(o.kind==='release'&&(o.end||o.start)===o.start&&!/preorder|order window|lottery window/i.test(o.actionLabel||''))return o.start>=new Date(Date.parse(today+'T12:00:00Z')-14*86400000).toISOString().slice(0,10);
 return (o.end||o.start)>=today;
}
export function overlapsWindow(o:Opportunity,dates:string[]){
 if(!o.start)return true;
 const recentRelease=o.kind==='release'&&(o.end||o.start)===o.start&&!/preorder|order window|lottery window/i.test(o.actionLabel||'');
 return dates.some(d=>d>=o.start!&&d<=(recentRelease?new Date(Date.parse(o.start!+'T12:00:00Z')+14*86400000).toISOString().slice(0,10):o.end||o.start!)&&!o.closedDays?.includes(new Date(d+'T12:00:00Z').getUTCDay()));
}
export function inventorySummary(items:Opportunity[],now=new Date()){
 const current=items.filter(o=>catalogCurrent(o,now)),byKind:Record<string,number>={},bySource:Record<string,number>={};
 for(const o of current){byKind[o.kind]=(byKind[o.kind]||0)+1;bySource[o.source]=(bySource[o.source]||0)+1;}
 return {total:current.length,byKind,bySource,withArtists:current.filter(o=>o.artists?.length).length,withGenres:current.filter(o=>o.details?.genres.length||o.artists?.some(a=>a.genres.length)).length,olderThanADay:current.filter(o=>now.getTime()-Date.parse(o.checkedAt)>86400000).length};
}
