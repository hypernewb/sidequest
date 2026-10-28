import {plainText,decodeText} from './announcements.ts';
import {publicSource,rememberDetail} from './event-enrichment.ts';
import type {Opportunity} from './opportunities.ts';

const day=(instant:string)=>new Date(instant).toLocaleDateString('en-CA',{timeZone:'Asia/Tokyo'});
const safe=(raw:string,host:string)=>{try{const u=new URL(raw);return u.protocol==='https:'&&!u.username&&!u.password&&(u.hostname===host||u.hostname.endsWith('.'+host))?u.href:null;}catch{return null;}};
const base=(source:string,url:string,title:string,text:string,at:string):Opportunity=>({id:'global:'+url,title,source,url,description:text.slice(0,900),kind:'event',online:true,location:'Online · worldwide',checkedAt:at,price:null,priceLabel:'Check official access',availability:'Official schedule. Check access conditions with the organiser.',category:'online event'});

export function parseBandcamp(html:string,at=new Date().toISOString()):Opportunity[]{
 const json=html.trimStart().startsWith('{'),raw=json?html:html.match(/\bdata-blob=(["'])([\s\S]*?)\1/)?.[2];
 const rows:any[]=[];
 const visit=(value:any)=>{if(!value||typeof value!=='object')return;if(value.liveEventUrl&&value.scheduledStartDate)rows.push(value);if(Array.isArray(value))value.forEach(visit);else Object.values(value).forEach(visit);};
 if(raw)try{let data=JSON.parse(json?raw:decodeText(raw));if(typeof data==='string')data=JSON.parse(data);visit(data);}catch{}
 return [...new Map(rows.flatMap((e:any)=>{
  const url=safe(e.liveEventUrl||'','bandcamp.com'),stamp=Date.parse(e.scheduledStartDate);
  if(!url||!e.title||!Number.isFinite(stamp))return [];
  const startsAt=new Date(stamp).toISOString(),o=base('Bandcamp listening parties',url,String(e.title),plainText(String(e.description||'')),at);
  const image=html.match(new RegExp('https://f[0-9]\\.bcbits\\.com/img/[a-z]?0*'+String(e.imageId).replace(/\D/g,'')+'_[0-9]+\\.jpg'))?.[0]||(e.isArt&&Number.isInteger(e.imageId)?'https://f4.bcbits.com/img/a'+String(e.imageId).padStart(10,'0')+'_2.jpg':undefined);
  o.start=day(startsAt);o.end=o.start;o.startsAt=startsAt;o.sourceTimezone=e.dateTimeZone||undefined;o.actionLabel=e.eventType==='l'?'Online listening party':'Online live stream';o.category='online music listening party '+(e.genre||'');o.image=image;o.priceLabel=e.isSubOnly?'Subscriber access · see organiser':'See organiser access';o.availability='Scheduled online event. End time is not published in the listing.'+(e.isSubOnly?' Subscriber-only access.':'');
  o.details=rememberDetail(url,o.title+'\n'+o.description);o.details.artists=typeof e.artist==='string'?[e.artist]:[];
  return [o];
 }).map((o:Opportunity)=>[o.id,o])).values()] as Opportunity[];
}

export function hololiveLinks(html:string){return [...new Set([...html.matchAll(/href="((?:\/en)?\/products\/[^"?#]+)"/g)].map(m=>new URL(m[1],'https://shop.hololivepro.com').href))].slice(0,24);}

export async function publicBandcampSchedule(fetcher:typeof fetch=fetch,at=new Date().toISOString()){
 const items:Opportunity[]=[];let cursor:unknown=null;
 // This is the same unauthenticated request made by Bandcamp's public Live
 // page (LiveEventsPublicAPI_4). Two pages bound work and source coverage.
 for(let page=0;page<2;page++){
  try{
  let text='',data:any,crumb:string|undefined;
  for(let attempt=0;attempt<2;attempt++){
   const r=await fetcher('https://bandcamp.com/api/live_events_public_api/4/get_upcoming_live_events',{method:'POST',redirect:'manual',headers:{'Content-Type':'application/json; charset=UTF-8',Accept:'application/json',...(crumb?{'X-BC-Crumb':crumb}:{})},body:JSON.stringify({page_size:50,next_cursor:cursor,is_featured:false}),signal:AbortSignal.timeout(12000)});
   if(!r.ok)throw Error('Public schedule unavailable ('+r.status+')');
   text=await r.text();if(text.length>1000000)throw Error('Schedule too large');
   data=JSON.parse(text);
   const replacement=r.headers.get('X-BC-Crumb');
   if(attempt===0&&data.__api_special__&&/InvalidCrumbError/.test(data.error_type||'')&&replacement&&replacement.length<1000){crumb=replacement;continue;}
   break;
  }
  if(!Array.isArray(data?.items))throw Error('No public schedule items'+(typeof data?.error_type==='string'?': '+data.error_type.slice(0,120):''));
  items.push(...parseBandcamp(text,at));cursor=data.nextCursor;if(!cursor)break;
  }catch(error){if(items.length)break;throw error;}
 }
 return [...new Map(items.map(o=>[o.id,o])).values()];
}
export function parseHololive(html:string,url:string,at=new Date().toISOString()):Opportunity[]{
 if(!safe(url,'shop.hololivepro.com'))return [];
 // Read the dedicated order-period block, never the shipping or publication date.
 const block=html.match(/<section\b[^>]*class="[^"]*Pdt_shipping[^"]*"[^>]*>([\s\S]*?)<\/section>/)?.[1]||html.match(/<p>\s*<span[^>]*>Order Period<\/span>([\s\S]*?)<\/p>/)?.[0]||'';
 const text=plainText(block),range=text.match(/Order Period\s*:?\s*(20\d{2}\/\d{1,2}\/\d{1,2})\s+(\d{1,2}:\d{2})\s*[~～–-]\s*(20\d{2}\/\d{1,2}\/\d{1,2})\s+(\d{1,2}:\d{2})\s*\(JST\)/i);
 if(!range)return [];
 const instant=(d:string,t:string)=>{const [y,m,day]=d.split('/');return `${y}-${m.padStart(2,'0')}-${day.padStart(2,'0')}T${t.padStart(5,'0')}:00+09:00`;};
 const a=instant(range[1],range[2]),b=instant(range[3],range[4]);if(!Number.isFinite(Date.parse(a))||!Number.isFinite(Date.parse(b))||Date.parse(b)<=Date.parse(a)||new Date(Date.parse(a)+9*3600000).toISOString().slice(0,16)!==a.slice(0,16)||new Date(Date.parse(b)+9*3600000).toISOString().slice(0,16)!==b.slice(0,16))return [];
 const title=decodeText(html.match(/property="og:title"\s+content="([^"]+)"/)?.[1]||'');if(!title)return [];
 const o=base('hololive official preorder windows',url,title,'Official timed merchandise order window. '+text,at);
 o.kind='release';o.startsAt=new Date(a).toISOString();o.endsAt=new Date(b).toISOString();o.start=day(a);o.end=day(b);o.sourceTimezone='Asia/Tokyo';o.actionLabel='Preorder window';o.category='anime vtuber character goods collectibles limited order window';o.location='Online shop · shipping regions vary';o.priceLabel='See official variant prices';o.availability='Time-limited order window, not proof of a numbered edition. Check variant availability and shipping eligibility. Delivery is separate from the order deadline.';
 const image=decodeText(html.match(/property="og:image"\s+content="([^"]+)"/)?.[1]||'').replace(/^http:/,'https:');if(safe(image,'shop.hololivepro.com'))o.image=image;
 return [o];
}

const months=['january','february','march','april','may','june','july','august','september','october','november','december'];
export function parseSteam(json:string,at=new Date().toISOString()):Opportunity[]{
 let rows:any[];try{rows=JSON.parse(json).events||[];}catch{return [];}
 return rows.flatMap(e=>{
  if(e.hidden||!e.published||!/fest|sale|steam scream/i.test(e.event_name||''))return [];
  let meta:any={};try{meta=JSON.parse(e.jsondata||'{}');}catch{}
  const subtitle=meta.localized_subtitle?.[0]||'',body=e.announcement_body?.body||'',text=plainText(body.replace(/\[[^\]]*\]/g,' '));
  const pattern='('+months.join('|')+')\\s+(\\d{1,2})(?:st|nd|rd|th)?';
  const range=subtitle.match(new RegExp(pattern+'\\s+(?:through|to|[-–])\\s+'+pattern,'i'));
  if(!range||!/\b20\d{2}\b/.test(at))return [];
  const year=new Date(Number(e.rtime32_start_time)*1000).getUTCFullYear();if(!Number.isFinite(year)||year<2025)return [];
  const date=(m:string,d:string)=>`${year}-${String(months.indexOf(m.toLowerCase())+1).padStart(2,'0')}-${d.padStart(2,'0')}`;
  const start=date(range[1],range[2]),end=date(range[3],range[4]);if(end<start||!Number.isFinite(Date.parse(end)))return [];
  const url='https://store.steampowered.com/news/group/27766192/view/'+String(e.gid);if(!/^\d+$/.test(String(e.gid)))return [];
  const o=base('Steam official festivals',url,e.event_name,text.slice(0,700),at);o.start=start;o.end=end;o.category='online videogame games demos festival sale';o.actionLabel='Online festival';o.priceLabel='See festival offers';o.availability='Official festival dates. Game availability and offers vary by region. The news publication timestamp is not used as a festival deadline.';
  if(/through\s+\w+\s+\d+(?:st|nd|rd|th)?\s+at\s+10\s*a\.?m\.?\s*(?:PT|Pacific)/i.test(text)){
   const zone=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',timeZoneName:'shortOffset'}).formatToParts(new Date(end+'T18:00:00Z')).find(p=>p.type==='timeZoneName')?.value;
   const offset=Number(zone?.match(/GMT([+-]\d+)/)?.[1]);
   if(Number.isFinite(offset)){o.endsAt=new Date(Date.parse(end+'T10:00:00Z')-offset*3600000).toISOString();o.end=day(o.endsAt);o.sourceTimezone='America/Los_Angeles';}
  }
  o.description=subtitle+'. '+o.description;return [o];
 });
}

export async function collectGlobal(now=new Date(),read:typeof publicSource=publicSource){
 const at=now.toISOString(),items:Opportunity[]=[],health:{name:string;count:number;status:string}[]=[];
 await Promise.all([
  (async()=>{try{let rows:Opportunity[]=[],api=false,issue='';try{rows=await publicBandcampSchedule(fetch,at);api=rows.length>0;}catch(error){issue=error instanceof Error?error.message:'Request failed';console.warn('Public Bandcamp schedule API unavailable',issue);}if(!rows.length){const html=await read('https://bandcamp.com/live');rows=parseBandcamp(html,at);if(!rows.length)console.warn('Bandcamp schedule not recognized',{bytes:html.length,title:plainText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||''),blob:html.includes('data-blob'),schedule:html.includes('scheduledStartDate')});}items.push(...rows);health.push({name:'Bandcamp listening parties',count:rows.length,status:rows.length?(api?'Public schedule API checked; up to two pages':'Official event page checked'+(issue?' · '+issue:'')):'No readable schedule recognized; source unavailable from this host'+(issue?' · '+issue:'')});}catch{health.push({name:'Bandcamp listening parties',count:0,status:'Unavailable'});}})(),
  (async()=>{try{const links=hololiveLinks(await read('https://shop.hololivepro.com/en'));const rows:Opportunity[]=[];let failed=0;for(let i=0;i<links.length;i+=4)await Promise.all(links.slice(i,i+4).map(async url=>{try{rows.push(...parseHololive(await read(url),url,at));}catch{failed++;}}));items.push(...rows);health.push({name:'hololive official preorder windows',count:rows.length,status:`${links.length} official product pages checked; ${failed} unavailable; only explicit order periods included`});}catch{health.push({name:'hololive official preorder windows',count:0,status:'Unavailable'});}})(),
  (async()=>{try{const rows=parseSteam(await read('https://store.steampowered.com/events/ajaxgetpartnereventspageable/?clan_accountid=27766192&offset=0&count=15'),at);items.push(...rows);health.push({name:'Steam official festivals',count:rows.length,status:'Explicit festival date ranges checked; client updates excluded'});}catch{health.push({name:'Steam official festivals',count:0,status:'Unavailable'});}})()
 ]);
 return {items,health};
}
