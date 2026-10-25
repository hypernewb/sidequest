import {plainText,decodeText} from './announcements.ts';
import {publicSource,rememberDetail,withDetails} from './event-enrichment.ts';
import {catalogCurrent} from './catalog-policy.ts';
import type {Opportunity} from './opportunities.ts';

const clean=(s:string)=>plainText(s.replace(/<!--[\s\S]*?-->/g,''));
export function exactDay(y:string,m:string,d:string){const s=`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;return /^20\d{2}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s?s:null;}
export function explicitRange(text:string){
 const m=text.match(/(20\d{2})\s*[年./]\s*(\d{1,2})\s*[月./]\s*(\d{1,2})日?(?:[^\d\n]{0,18}[〜～–—~-]\s*(?:(20\d{2})[年./]\s*)?(\d{1,2})[月./]\s*(\d{1,2})日?)?/);
 if(!m)return null;const start=exactDay(m[1],m[2],m[3]),end=m[6]?exactDay(m[4]||m[1],m[5],m[6]):start;return start&&end&&end>=start?{start,end}:null;
}
function entry(source:string,url:string,title:string,text:string,range:{start:string;end:string},kind:Opportunity['kind'],location:string,category:string,actionLabel:string,at:string){
 const o:Opportunity={id:'independent:'+source+':'+url+':'+range.start,title,source,url,description:text.slice(0,1200),...range,kind,location,category,actionLabel,checkedAt:at,price:null,priceLabel:'See official prices',availability:'Official announcement. Check admission, purchase conditions and current availability.',online:kind==='release'};
 return withDetails(o,rememberDetail(url,text));
}
export function parseVinylFeed(xml:string,source:'BIG LOVE RECORDS'|'pianola records',at=new Date().toISOString()){
 const host=source==='BIG LOVE RECORDS'?'bigloverecords.jp':'pianola-records.com';
 return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].flatMap(m=>{
  const h=m[1],title=clean(h.match(/<title>([\s\S]*?)<\/title>/)?.[1]||''),published=h.match(/<published>([^<]+)<\/published>/)?.[1];
  const url=decodeText(h.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/)?.[1]||'');
  const body=h.match(/<!\[CDATA\[([\s\S]*?)\]\]>/)?.[1]||'',text=clean(body.split(/<div[^>]*style=/)[0]);
  if(!title||!published||!url.startsWith('https://'+host+'/products/')||!Number.isFinite(Date.parse(published))||!/レコード|vinyl|\bLP\b|\b7\"|\b12\"|\b10\"/i.test(title+' '+text))return [];
  const date=new Date(published).toLocaleDateString('en-CA',{timeZone:'Asia/Tokyo'});
  const o=entry(source,url,title,text,{start:date,end:date},'release',source==='BIG LOVE RECORDS'?'BIG LOVE, Harajuku · online shop':'pianola records, Shimokitazawa · online shop','music vinyl record independent label','Shop listing published',at);
  o.availability='The shop published this listing on '+date+'. This is not a verified release or restock date. Check stock, format and edition before ordering.';
  const price=text.match(/価格:\s*([\d,]+)/)?.[1];if(price)o.priceLabel='¥'+price+' · shop listing price; shipping extra';
  const artist=title.split(/\s+['‘’“"]|\s+[-–]\s+/)[0].trim();if(artist&&artist!==title)o.details!.artists=[artist];
  return [o];
 });
}
export function parseWishless(html:string,at=new Date().toISOString()){
 return [...html.matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/g)].flatMap(m=>{
  const h=m[1],heading=h.match(/<h[1-6] class="entry-title">([\s\S]*?)<\/h[1-6]>/)?.[1]||'',title=clean(heading),url=heading.match(/href="(https:\/\/wish-less.com\/archives\/\d+)"/)?.[1];
  const content=h.match(/<div class="entry-content">([\s\S]*?)<\/div>/)?.[1]||'',range=explicitRange(clean(content));
  return url&&title&&range?[entry('WISH LESS',url,title,clean(content),range,'exhibition','WISH LESS · Tabata, Tokyo','independent gallery illustration visual art','Exhibition dates',at)]:[];
 });
}
export function parsePianolaEvents(xml:string,at=new Date().toISOString()){
 return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].flatMap(m=>{
  const h=m[1],text=clean(h.match(/<!\[CDATA\[([\s\S]*?)\]\]>/)?.[1]||''),date=text.match(/日時[:：]\s*([^\n]+)/)?.[1]||'',place=text.match(/場所[:：]\s*([^\n]+)/)?.[1]||'';
  const range=explicitRange(date),endMD=date.match(/\d{1,2}:\d{2}[^\n]*?\s(\d{1,2})\/(\d{1,2})\s*\(/),url=decodeText(h.match(/<id>([^<]+)<\/id>/)?.[1]||'');
  if(!range||!url.startsWith('https://pianola-records.com/blogs/news/')||!/(世田谷|下北沢)/.test(place+' '+text.slice(0,1200)))return [];
  if(endMD){const end=exactDay(range.start.slice(0,4),endMD[1],endMD[2]);if(!end||end<range.start)return [];range.end=end;}
  const title=clean(h.match(/<title>([\s\S]*?)<\/title>/)?.[1]||'');const o=entry('pianola records events',url,title,text,range,'popup',place+' · Tokyo','music vinyl record fair independent labels art books','Record fair dates',at);
  o.englishTitle=/BONUS TRACK/.test(title)?'pianola records · Record Fair at BONUS TRACK':undefined;return [o];
 });
}
export function parseParcel(html:string,at=new Date().toISOString()){
 return [...html.matchAll(/<a\b[^>]*href="(https:\/\/parceltokyo.jp\/exhibition\/[^"#]+)"[^>]*>([\s\S]*?)<\/a>/g)].flatMap(m=>{
  const h=m[2],title=clean(h.match(/<h2>([\s\S]*?)<\/h2>/)?.[1]||''),artist=clean(h.match(/class="spec">([\s\S]*?)<\/p>/)?.[1]||'');
  const a=h.match(/date__Area--Start">([\s\S]*?)<\/div>/)?.[1]||'',b=h.match(/date__Area--End">([\s\S]*?)<\/div>/)?.[1]||'';
  const year=a.match(/class="year">(20\d{2})/)?.[1],startMD=a.match(/class="sday">(\d{1,2})\.(\d{1,2})/),endMD=b.match(/class="sday">(\d{1,2})\.(\d{1,2})/),endYear=b.match(/class="year">(20\d{2})/)?.[1]||year;
  const start=year&&startMD?exactDay(year,startMD[1],startMD[2]):null,end=endYear&&endMD?exactDay(endYear,endMD[1],endMD[2]):null;
  if(!title||!start||!end||end<start)return [];
  const o=entry('PARCEL',m[1],artist+' · '+title,clean(h),{start,end},'exhibition','PARCEL / parcel · Nihonbashi-Bakurocho, Tokyo','independent gallery contemporary visual art','Exhibition dates',at);
  if(/Closed:\s*Sun, Mon/i.test(o.description))o.closedDays=[0,1];else if(/Closed:\s*Mon, Tue/i.test(o.description))o.closedDays=[1,2];return [o];
 });
}
export function beamsLinks(html:string){return [...html.matchAll(/<li class="beams-list-image-item news">([\s\S]*?)<\/li>/g)].flatMap(m=>{const h=m[1],url=h.match(/href="(\/news\/\d+\/)"/)?.[1],title=clean(h.match(/class="post-title">([\s\S]*?)<\/div>/)?.[1]||'');return url&&title?[{url:'https://www.beams.co.jp'+url,title}]:[];});}
const tokyo=/東京|渋谷|原宿|恵比寿|新宿|銀座|六本木|丸の内|二子玉川|池袋|有楽町|吉祥寺|立川|町田|北千住|BEAMS RECORDS|bPr BEAMS/i;
export function parseBeams(html:string,url:string,at=new Date().toISOString()){
 const title=clean(html.match(/<h1 class="ttl-lg">([\s\S]*?)<\/h1>/)?.[1]||'');if(!title)return [];
 // Dates and locations must share an information block. The article publication date is never an event date.
 const out:Opportunity[]=[];
 for(const m of html.matchAll(/<div class="info-table">([\s\S]*?)<\/div>/g)){
  const fields=[...m[1].matchAll(/<dl>([\s\S]*?)<\/dl>/g)].map(x=>({label:clean(x[1].match(/<dt[^>]*>([\s\S]*?)<\/dt>/)?.[1]||''),value:clean(x[1].match(/<dd[^>]*>([\s\S]*?)<\/dd>/)?.[1]||'')}));
  const date=fields.find(f=>/開催期間|開催日時|先行発売日時|発売日|販売期間/.test(f.label)),place=fields.find(f=>/開催店舗|開催場所|販売店舗|発売店舗/.test(f.label));
  const range=date&&explicitRange(date.value);if(!range||!place||!tokyo.test(place.value))continue;
  const locations=place.value.split(/[、\n]/).filter(s=>tokyo.test(s)).join(' / ');const kind=/発売/.test(date!.label)?'release':range.start===range.end?'event':'popup';
  const body=html.split('<h1 class="ttl-lg">')[1]?.split('<div class="container tags">')[0]||m[1];
  out.push(entry('BEAMS collaborations',url,title,clean(body),range,kind,locations+' · Tokyo','fashion design independent labels '+(/RECORD|レコード/i.test(title)?'music vinyl record':'clothing'),kind==='release'?'Release date':kind==='popup'?'Pop-up dates':'Event dates',at));
 }
 return out;
}
export function ciboneLinks(html:string){return [...html.matchAll(/<a\b[^>]*href="(https:\/\/www.cibone.com\/topics_detail.html\?info_id=\d+)"[^>]*>([\s\S]*?)<\/a>/g)].flatMap(m=>{const h=m[2],title=clean(h.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)?.[1]||''),date=clean(h.match(/class="maring_top05">([\s\S]*?)<\/p>/)?.[1]||''),range=explicitRange(date);return title&&range?[{url:m[1],title,range}]:[];});}
export function parseCibone(html:string,url:string,title:string,range:{start:string;end:string},at=new Date().toISOString()){
 const text=clean(html),place=text.match(/開催\s*[:：]\s*([^\n]+)/)?.[1];if(!place||!/表参道|銀座|OMOTESANDO|GINZA/i.test(place))return [];
 const body=text.slice(Math.max(0,text.indexOf('STORE\'S NEWS')));return [entry('CIBONE',url,title,body,range,range.start===range.end?'release':'popup',place+' · Tokyo','independent design fashion craft ceramics jewelry',range.start===range.end?'Release date':'Pop-up dates',at)];
}
export const INDEPENDENT_COVERAGE=[
 {name:'BIG LOVE RECORDS',url:'https://bigloverecords.jp/collections/all.atom',method:'Official vinyl shop Atom feed; listing publication dates, not invented release dates'},
 {name:'pianola records',url:'https://pianola-records.com/collections/all.atom',method:'Official independent vinyl shop Atom feed'},
 {name:'pianola records events',url:'https://pianola-records.com/blogs/news.atom',method:'Official record-fair announcement; explicit event date and Tokyo venue'},
 {name:'BEAMS collaborations',url:'https://www.beams.co.jp/news/',method:'Two news pages, full article date/location blocks; Tokyo only'},
 {name:'CIBONE',url:'https://www.cibone.com/',method:'Dated cards plus full-page confirmation of Tokyo venue'},
 {name:'PARCEL',url:'https://parceltokyo.jp/',method:'Official upcoming exhibition cards and closure days'},
 {name:'WISH LESS',url:'https://wish-less.com/',method:'Official current/upcoming exhibition cards'}
];
export async function collectIndependent(now=new Date(),fetcher:typeof fetch=fetch){
 const at=now.toISOString(),health:{name:string;url:string;count:number;status:string}[]=[];
 const read=(u:string)=>publicSource(u,fetcher);
 const run=async(name:string,url:string,work:()=>Promise<Opportunity[]>)=>{try{const all=await work(),items=all.filter(o=>catalogCurrent(o,now));health.push({name,url,count:items.length,status:all.length?'Official dated records checked':'No dated records recognized'});return items;}catch(e){health.push({name,url,count:0,status:'Unavailable: '+(e instanceof Error?e.message:'source read failed')+'. Previous check time preserved.'});return [];}};
 const batches=await Promise.all(INDEPENDENT_COVERAGE.map(s=>run(s.name,s.url,async()=>{
  const html=await read(s.url);
  if(s.name==='BIG LOVE RECORDS'||s.name==='pianola records')return parseVinylFeed(html,s.name,at);
  if(s.name==='pianola records events')return parsePianolaEvents(html,at);
  if(s.name==='PARCEL')return parseParcel(html,at);
  if(s.name==='WISH LESS')return parseWishless(html,at);
  const rows:Opportunity[]=[];
  if(s.name==='BEAMS collaborations'){
   const second=await read(s.url+'?p=2').catch(()=>'');const candidates=beamsLinks(html+second).slice(0,24);
   for(let i=0;i<candidates.length;i+=4)await Promise.all(candidates.slice(i,i+4).map(async c=>{try{rows.push(...parseBeams(await read(c.url),c.url,at));}catch{}}));
  }else{
   const candidates=ciboneLinks(html).filter(c=>c.range.end>=new Date(now.getTime()-14*86400000).toISOString().slice(0,10)).slice(0,12);
   for(let i=0;i<candidates.length;i+=4)await Promise.all(candidates.slice(i,i+4).map(async c=>{try{rows.push(...parseCibone(await read(c.url),c.url,c.title,c.range,at));}catch{}}));
  }return rows;
 })));
 return {items:[...new Map(batches.flat().map(o=>[o.id,o])).values()],health};
}
