import type {Opportunity} from './opportunities.ts';
const key=(s:string)=>s.normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
export function programmeFor(place:Opportunity,date:string,records:Opportunity[],now=new Date()){
 const name=key(place.title);if(name.length<7)return null;
 return records.filter(o=>['exhibition','popup'].includes(o.kind)&&!o.online&&o.start&&date>=o.start&&date<=(o.end||o.start)&&key(o.location).includes(name)&&!o.closedDays?.includes(new Date(date+'T12:00:00Z').getUTCDay())&&!['cancelled','sold_out'].includes(o.details?.status||'')&&now.getTime()-Date.parse(o.checkedAt)<=86400000&&/^https:\/\//.test(o.url)).sort((a,b)=>(a.start||'').localeCompare(b.start||''))[0]||null;
}
