import {catalogTitle} from './catalog-labels.ts';
import {subjectNames} from './interest-match.ts';
import {TOPICS} from './taste.ts';
import {catalogCurrent} from './catalog-policy.ts';
import type {Opportunity} from './opportunities.ts';
import type {Drop} from './drops.ts';
export function catalogDrop(o:Opportunity,now=new Date()):Drop|null{
 if(!['release','popup'].includes(o.kind)||!catalogCurrent(o,now))return null;
 const subjects=subjectNames(o),range=o.end&&o.end!==o.start;
 return {id:o.id,title:catalogTitle(o),category:o.kind as 'release'|'popup',topics:TOPICS.filter(t=>subjects.includes(t.name)).map(t=>t.id),source:o.source,sourceUrl:o.url,checkedAt:o.checkedAt,evidence:'direct',summary:o.englishDescription||o.description,location:o.location,channel:o.online?(/online/i.test(o.location)?'online':'japan'):'tokyo',method:o.kind==='popup'?'visit':/listing published/i.test(o.actionLabel||'')?'listing':/shipping/i.test(o.actionLabel||'')?'shipping':/preorder/i.test(o.actionLabel||'')?'preorder':'release',startsAt:o.start+'T00:00:00+09:00',...(range?{endsAt:o.end+'T23:59:59+09:00'}:{}),price:o.price,priceNote:o.priceLabel,restrictions:o.availability};
}
