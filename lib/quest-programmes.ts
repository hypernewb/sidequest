import type {Opportunity} from './opportunities.ts';
const key=(s:string)=>s.normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
export function activeProgramme(o:Opportunity,date:string,now=new Date(),allowOnline=false){
 const age=now.getTime()-Date.parse(o.checkedAt);
 return ['gig','exhibition','popup','release','event'].includes(o.kind)&&(!o.online||allowOnline&&o.kind==='release')&&!!o.start&&date>=o.start&&date<=(o.end||o.start)&&!o.closedDays?.includes(new Date(date+'T12:00:00Z').getUTCDay())&&!['cancelled','sold_out'].includes(o.details?.status||'')&&!/SOLD\s*OUT|完売|売り切れ/i.test(o.priceLabel)&&Number.isFinite(age)&&age>=-300000&&age<=86400000&&/^https:\/\//.test(o.url);
}
export function programmeFor(place:Opportunity,date:string,records:Opportunity[],now=new Date(),score:(o:Opportunity)=>number=()=>0){
 const name=key(place.title);if(name.length<7)return null;
 return records.filter(o=>['exhibition','popup'].includes(o.kind)&&activeProgramme(o,date,now)&&key(o.location).includes(name)).sort((a,b)=>score(b)-score(a)||(a.start||'').localeCompare(b.start||''))[0]||null;
}
