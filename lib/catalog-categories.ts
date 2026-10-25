import type {Opportunity} from './opportunities.ts';
export const CATALOG_CATEGORIES=[['all','All'],['gig','Live music'],['vinyl','Vinyl & record fairs'],['fashion','Fashion & design'],['exhibition','Exhibitions'],['popup','Pop-ups'],['release','Releases'],['event','Other events']] as const;
export function inCatalogCategory(o:Opportunity,id:string){
 if(id==='all')return true;
 if(id==='vinyl')return ['release','popup'].includes(o.kind)&&/\bvinyl\b|\brecord fair\b|レコード.?フェア|アナログ盤/i.test(o.category+' '+o.title);
 if(id==='fashion')return ['release','popup'].includes(o.kind)&&/fashion|clothing|jewelry|ceramics|craft|ファッション|衣服|ジュエリー/i.test(o.category+' '+o.title)&&!o.id.startsWith('release-source:');
 return o.kind===id;
}
