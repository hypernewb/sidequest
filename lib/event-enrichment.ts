import {plainText} from './announcements.ts';
import {priceContext} from './price-context.ts';
import {readAnnouncement,translateJapanese,officialHost} from './announcement-reader.ts';
import {extractEventDetails,type EventDetails} from './event-detail-parser.ts';
import type {Opportunity,Preferences} from './opportunities.ts';
import {dateWindow} from './opportunities.ts';
const cache=new Map<string,{at:number;details:EventDetails}>(),pending=new Map<string,Promise<EventDetails>>();
export function rememberDetail(url:string,text:string,level:'calendar'|'full'='calendar'){const details={...extractEventDetails(text,url),level};if(cache.size>=300)cache.delete(cache.keys().next().value!);cache.set(url,{at:Date.now(),details});return details;}
export async function publicSource(url:string,fetcher:typeof fetch=fetch){
 const u=new URL(url);if(u.protocol!=='https:'||!officialHost(u.hostname)||u.username||u.password||u.port)throw Error('Unsupported official source.');
 const r=await fetcher(url,{redirect:'manual',headers:{Accept:'text/html,application/json','User-Agent':'SideQuest official detail reader'},signal:AbortSignal.timeout(u.hostname.endsWith('beams.co.jp')?25000:10000)});
 if(!r.ok)throw Error('Official source unavailable ('+r.status+').');
 if(!/text\/html|application\/(?:json|xml|rss\+xml|atom\+xml)|text\/xml/.test(r.headers.get('content-type')||''))throw Error('Unsupported source format.');
 const reader=r.body?.getReader();if(!reader)throw Error('Empty source');let size=0,text='';const decoder=new TextDecoder();try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>1000000)throw Error('Source too large');text+=decoder.decode(value,{stream:true});}return text+decoder.decode();}finally{await reader.cancel();}
}
export async function enrichOne(url:string,fetcher:typeof fetch=fetch,full=false):Promise<EventDetails>{
 const hit=cache.get(url);if(hit&&Date.now()-hit.at<1800000&&(!full||hit.details.level==='full'))return hit.details;if(pending.has(url))return pending.get(url)!;
 const work=(async()=>{let target=url;const u=new URL(url);
  if(u.hostname==='ufoclub.jp'&&/^#\d{4}-\d{2}-\d{2}$/.test(u.hash)){
   const html=await publicSource('https://ufoclub.jp/schedule/',fetcher),month=html.match(/<div class="month">(20\d{2})年(\d{1,2})月/);
   if(!month||u.hash.slice(1,8)!==month[1]+'-'+month[2].padStart(2,'0'))throw Error('That calendar month is no longer published.');
   const row=[...html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].find(m=>Number(m[1].match(/<th[^>]*>\s*(\d{1,2})\s*<\/th>/)?.[1])===Number(u.hash.slice(-2)));
   if(!row)throw Error('That show is no longer on the calendar.');
   return rememberDetail(url,plainText(row[1]),'full');
  }
  if(u.hostname==='reserve.cottonclubjapan.co.jp'&&/^\/reserve\/schedule\/exec\/\d+$/.test(u.pathname)){
   const id=u.pathname.split('/').pop();const info=JSON.parse(await publicSource('https://reserve.cottonclubjapan.co.jp/reserve/schedule/read_event_info/'+id,fetcher));const link=info.links?.detail_page_url;
   if(typeof link!=='string'||!/^https:\/\/(?:www\.)?cottonclubjapan\.co\.jp\/jp\/sp\/artists\//.test(link))throw Error('No public performance details.');target=link;
  }
  const r=await readAnnouncement(target,'',fetcher);const d=rememberDetail(url,r.text,'full');d.url=r.url;
  // Cotton's calendar states a compulsory food/drink order; artist pages omit its cost.
  if(u.hostname.endsWith('cottonclubjapan.co.jp'))d.priceCeiling=null;
  return d;
 })();pending.set(url,work);try{return await work;}finally{pending.delete(url);}
}
export function withDetails(o:Opportunity,d:EventDetails):Opportunity{if(o.kind==='gig'&&!d.artists.length&&o.details?.artists.length)d={...d,artists:o.details.artists};return priceContext({...o,details:d,price:d.priceCeiling,priceLabel:d.prices.length?d.prices.slice(0,3).join(' · '):o.priceLabel,category:o.category+' '+d.genres.map(g=>g.name).join(' '),availability:o.availability+(d.status==='cancelled'?' · Official page says cancelled.':d.status==='sold_out'?' · Official page says sold out.':''),detailStatus:'read'});}
export async function enrichCandidates(items:Opportunity[],p:Preferences,fetcher:typeof fetch=fetch,reuseTranslations=false){
 items=items.map(o=>{const c=cache.get(o.url);return c&&Date.now()-c.at<1800000&&!o.details?withDetails(o,c.details):o;});
 const dates=dateWindow(p);const eligible=items.filter(o=>!(reuseTranslations&&o.details?.translation==='translated')&&!(o.details&&Date.now()-Date.parse(o.details.checkedAt)<1800000)&&o.kind!=='place'&&o.source!=='Fever'&&o.source!=='Official catalog'&&dates.some(d=>d>=(o.start||d)&&d<=(o.end||o.start||d))&&!p.exclude.includes(o.id)&&(p.format!=='places')&&(p.format!=='drops'||o.kind==='release'||o.kind==='popup')&&(p.intent!=='music'||o.kind==='gig')&&(!['collect','play'].includes(p.intent)||o.kind!=='gig'));
 // Round-robin publishers before enrichment so one busy music calendar cannot consume the reading budget.
 const groups=new Map<string,Opportunity[]>();for(const o of eligible){const list=groups.get(o.source)||[];list.push(o);groups.set(o.source,list);}const selected:Opportunity[]=[];while(selected.length<12&&[...groups.values()].some(g=>g.length))for(const g of groups.values()){if(selected.length>=12)break;const o=g.shift();if(o)selected.push(o);}
 const updated=new Map<string,Opportunity>();let read=0,failed=0;
 for(let i=0;i<selected.length;i+=4)await Promise.all(selected.slice(i,i+4).map(async o=>{try{updated.set(o.id,withDetails(o,await enrichOne(o.url,fetcher)));read++;}catch{updated.set(o.id,{...o,detailStatus:'unavailable'});failed++;}}));
 const out=items.map(o=>updated.get(o.id)||o);return {items:out,read,failed,remaining:Math.max(0,eligible.length-selected.length)};
}
export async function translateShortlist(items:Opportunity[],fetcher:typeof fetch=fetch){
 let translated=0;await Promise.all(items.filter(o=>o.details).slice(0,3).map(async o=>{
  const d=o.details!;if(d.translation&&d.translation!=='unavailable')return;
  // Bounded public-source excerpt. Original fields, not machine translation, drive eligibility and ranking.
  const excerpt=[o.title,...d.times,...d.prices.slice(0,2),...d.genres.map(g=>g.evidence),d.original].join('\n').slice(0,500);
  const t=await translateJapanese(excerpt,fetcher);d.english=t.text;d.translation=t.status;translated++;
 }));return translated;
}
