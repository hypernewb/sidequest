import {productLabel} from './catalog-labels.ts';
import {plainText,decodeText} from './announcements.ts';
import {publicSource,rememberDetail,withDetails} from './event-enrichment.ts';
import {dotRange} from './expanded-sources.ts';
import {catalogCurrent} from './catalog-policy.ts';
import type {Opportunity} from './opportunities.ts';
const iso=(y:string,m:string,d:string)=>{const s=`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;return Number.isFinite(Date.parse(s))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s?s:null;};
function entry(source:string,url:string,title:string,text:string,start:string,end:string,kind:Opportunity['kind'],location:string,actionLabel:string,at:string):Opportunity{
 return withDetails({id:'release-source:'+url+':'+start,title,source,url,kind,description:text.slice(0,1200),location,start,end,checkedAt:at,price:null,priceLabel:'See official prices',category:kind==='release'?'character goods collectibles toys':kind,online:kind==='release',actionLabel,availability:kind==='release'?'Official announced dates. Check current stock, purchase limits and participating stores. A release is not necessarily limited edition.':'Official event dates. Check opening hours and admission.'},rememberDetail(url,text));
}
export function parseSpirits(html:string,at=new Date().toISOString()){
 const out:Opportunity[]=[];
 // Each date heading owns its following cards. Month-only estimates stay out of exact-day results.
 for(const block of html.split(/<h3 class="m_titleB__title">/).slice(1)){
  const date=block.match(/^(20\d{2})年(\d{1,2})月(\d{1,2})日/);if(!date)continue;const start=iso(date[1],date[2],date[3]);if(!start)continue;
  for(const card of block.split('<div class="m_cardA">').slice(1)){
   const path=card.match(/href="(\/products\/search\/detail\.php\?[^"]+)"/)?.[1];
   const title=plainText(card.match(/class="m_cardA__title">([\s\S]*?)<\/div>/)?.[1]||'');
   const price=plainText(card.match(/class="m_cardA__price">([\s\S]*?)<\/div>/)?.[1]||'');
   if(!path||!title)continue;
   const lottery=/一番くじ/.test(card),prize=/プライズ/.test(card);
   const o=entry('BANDAI SPIRITS',new URL(decodeText(path),'https://www.bandaispirits.co.jp').href,title,title+'\n'+price,start,start,'release','Japan · participating retailers',prize?'Prize-machine release':lottery?'In-store lottery release':'Release date',at);
   o.englishTitle=productLabel(o)||undefined;o.category+=' '+(lottery?'lottery':prize?'arcade prize':'model kit figure');o.priceLabel=price||'Prize / retailer conditions vary';out.push(o);
  }
 }
 return out;
}
export function parseMedicomProducts(xml:string,at=new Date().toISOString()){
 const out:Opportunity[]=[];
 for(const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)){
  const title=plainText(m[1].match(/<title>([\s\S]*?)<\/title>/)?.[1]||'');
  if(!/受注|新商品発売|再販売/.test(title))continue;
  const body=m[1].match(/<!\[CDATA\[([\s\S]*?)\]\]>/)?.[1]||'';
  for(const part of body.split(/<strong\b[^>]*>/).slice(1)){
   const name=plainText(part.split('</strong>')[0]);const text=plainText(part);
   const url=decodeText(part.match(/href="(https:\/\/store\.medicomtoy\.co\.jp\/products\/[^"#]+)"/)?.[1]||'');
   const range=text.match(/受注期間\s*(20\d{2})年(\d{1,2})月(\d{1,2})日[^〜～\n]*[〜～]\s*(20\d{2})年(\d{1,2})月(\d{1,2})日/);
   if(!name||!url||!range)continue;const start=iso(range[1],range[2],range[3]),end=iso(range[4],range[5],range[6]);if(!start||!end||end<start)continue;
   const o=entry('MEDICOM TOY preorders',url,name,text.split('・MEDICOM')[0],start,end,'release','MEDICOM TOY Japan · online','Preorder window',at);
   o.category+=' art toy designer toy sofubi bearbrick';o.availability='Announced preorder window. Confirm order acceptance, delivery date and shipping eligibility at MEDICOM TOY.';out.push(o);
  }
 }
 return out;
}
export function parseAnimate(html:string,at=new Date().toISOString()){
 return html.split(/<div class="gr-osCard"/).slice(1).flatMap(card=>{
  const url=card.match(/class="gr-osCardLink" href="(https:\/\/www.animate.co.jp\/onlyshop\/\d+\/)"/)?.[1],title=plainText(card.match(/class="gr-osCardTitle">\s*<span>([\s\S]*?)<\/span>/)?.[1]||'');
  const stores=plainText(card.match(/class="gr-osCardStore">([\s\S]*?)<\/div>/)?.[1]||''),range=dotRange(plainText(card.match(/class="gr-osCardPeriod">([\s\S]*?)<\/div>/)?.[1]||''));
  // The visible Tokyo store and date belong to this card; other-city-only shops are excluded.
  if(!url||!title||!range||!/池袋|秋葉原|渋谷|新宿|町田|吉祥寺|立川|八王子|東京/.test(stores))return [];
  const o=entry('Animate Tokyo pop-ups',url,title,title+'\n'+stores,range.start,range.end,'popup',stores.replace(/…他/g,'')+' · Tokyo','Pop-up dates',at);o.category+=' anime character goods collectibles';return [o];
 });
}
export function parseMidtown(html:string,at=new Date().toISOString()){
 return [...html.matchAll(/<a\b[^>]*href="(\/jp\/(?:event\/(?:\d+|designlive)|shops\/info\/popup)\/)"[^>]*>([\s\S]*?)<\/a>/g)].flatMap(m=>{
  const heading=m[2].match(/<dt>([\s\S]*?)<\/dt>/)?.[1]||'',range=dotRange(plainText(heading)),title=plainText(heading.split(/<br\s*\/?\s*>/i)[0]);
  if(!range||!title||/新店舗オープン/.test(title))return [];
  return [entry('Tokyo Midtown',new URL(m[1],'https://www.tokyo-midtown.com').href,title,plainText(m[2]),range.start,range.end,/期間限定ショップ|POP.?UP/i.test(title)?'popup':/展示|アート|DESIGN/i.test(title)?'exhibition':'event','Tokyo Midtown · Roppongi, Tokyo','Event dates',at)];
 });
}
export async function collectReleases(now=new Date()){
 const at=now.toISOString(),jst=new Date(now.toLocaleDateString('en-CA',{timeZone:'Asia/Tokyo'})+'T12:00:00Z');
 const jobs:[string,string,(html:string,at:string)=>Opportunity[]][]=[['MEDICOM TOY preorders','https://store.medicomtoy.co.jp/blogs/blog.atom',parseMedicomProducts],['Animate Tokyo pop-ups','https://www.animate.co.jp/onlyshop/',parseAnimate],['Tokyo Midtown','https://www.tokyo-midtown.com/jp/event/',parseMidtown]];
 for(const page of [2,3])jobs.push(['Animate Tokyo pop-ups','https://www.animate.co.jp/onlyshop/page/'+page+'/',parseAnimate]);
 for(const offset of [0,1]){const d=new Date(Date.UTC(jst.getUTCFullYear(),jst.getUTCMonth()+offset,1));jobs.push(['BANDAI SPIRITS','https://www.bandaispirits.co.jp/products/calendar/?year_frm='+d.getUTCFullYear()+'&month_frm='+(d.getUTCMonth()+1),parseSpirits]);}
 const results=await Promise.all(jobs.map(async([name,url,parse])=>{try{const parsed=parse(await publicSource(url),at),items=parsed.filter(o=>catalogCurrent(o,now));return {items,health:{name,url,count:items.length,parsed:parsed.length,status:parsed.length?'Official dated records checked':'No dated records recognized'}};}catch{return {items:[],health:{name,url,count:0,parsed:0,status:'Unavailable; previous records retain their original check time'}};}}));
 return {items:[...new Map(results.flatMap(r=>r.items).map(o=>[o.id,o])).values()],health:results.map(r=>r.health)};
}
