import {pullmdRead,type ReaderConfig} from './pullmd-reader.ts';
import {officialPageContent} from './event-detail-parser.ts';
import {publicLink,htmlAnnouncement,plainText,decodeText} from './announcements.ts';
export const OFFICIAL_HOSTS=['bandcamp.com','shop.hololivepro.com','store.steampowered.com','bigloverecords.jp','pianola-records.com','beams.co.jp','cibone.com','parceltokyo.jp','wish-less.com','bandaispirits.co.jp','prtimes.jp','peatix.com','connpass.com','laforet.ne.jp','tsite.jp','miyashita-park.tokyo','2121designsight.jp','tokyo-midtown.com','liquidroom.net','unit-tokyo.com','loft-prj.co.jp','toos.co.jp','tokyoartbeat.com','ufoclub.jp','takaishiigallery.com','forestlimit.com','bandai-hobby.net','bandai.co.jp','p-bandai.jp','pokemon-card.com','pokemon.co.jp','nintendo.com','nintendo.co.jp','sanrio.co.jp','gundam.info','towershibuya.jp','movic.jp','parco.jp','0101.co.jp','animate.co.jp','goodsmile.com','yamada-denkiweb.com','fever-popo.com','www-shibuya.jp','mograg.com','medicomtoy.co.jp','cottonclubjapan.co.jp'];
export const officialHost=(hostname:string)=>OFFICIAL_HOSTS.some(h=>hostname===h||hostname.endsWith('.'+h));
export function canonicalAnnouncementUrl(raw:string){const u=new URL(publicLink.parse(raw));u.hash='';if(['x.com','www.x.com','twitter.com','www.twitter.com','mobile.twitter.com'].includes(u.hostname)){const m=u.pathname.match(/^\/([\w]{1,30})\/status\/(\d+)\/?$/);if(!m)throw Error('Use a link to a specific public X post.');return 'https://x.com/'+m[1]+'/status/'+m[2];}for(const key of [...u.searchParams.keys()])if(/^utm_|^(fbclid|gclid)$/i.test(key))u.searchParams.delete(key);return u.href;}
async function limitedText(r:Response,max=500000){const reader=r.body?.getReader();if(!reader)throw Error('This source returned no readable text.');let count=0,out='';const decoder=new TextDecoder();try{while(true){const {done,value}=await reader.read();if(done)break;count+=value.byteLength;if(count>max)throw Error('This announcement page is too large. Paste the relevant announcement text instead.');out+=decoder.decode(value,{stream:true});}return out+decoder.decode();}finally{await reader.cancel();}}
async function directReadAnnouncement(raw:string,provided:string,fetcher:typeof fetch=fetch){const url=canonicalAnnouncementUrl(raw);if(provided.trim())return {url,title:provided.trim().split('\n')[0].slice(0,240),text:provided.trim().slice(0,12000),source:'pasted_text' as const};const u=new URL(url);if(u.hostname==='store.medicomtoy.co.jp'&&/^\/blogs\/blog\//.test(u.pathname)){const r=await fetcher('https://store.medicomtoy.co.jp/blogs/blog.atom',{redirect:'manual',headers:{Accept:'application/atom+xml'},signal:AbortSignal.timeout(12000)});if(r.ok){const xml=await limitedText(r,1200000);for(const match of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)){const entry=match[1],id=decodeText(entry.match(/<id>([^<]+)<\/id>/)?.[1]||'');if(id!==url)continue;const title=plainText(entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]||'').slice(0,240),text=plainText(entry.match(/<!\[CDATA\[([\s\S]*?)\]\]>/)?.[1]||'');if(text.length>20)return {url,title,text:(title+'\n'+text).slice(0,12000),source:'official_page' as const,sourceNote:'Read from MEDICOM TOY’s official publisher feed, matched to this announcement URL. The storefront page itself was not fetched.'};}}throw Error('This announcement is no longer in MEDICOM’s latest publisher feed. Paste the source text below.');} if(u.hostname==='x.com'){const endpoint=new URL('https://publish.twitter.com/oembed');endpoint.searchParams.set('url',url.replace('https://x.com/','https://twitter.com/'));endpoint.searchParams.set('omit_script','true');endpoint.searchParams.set('dnt','true');const r=await fetcher(endpoint,{redirect:'manual',headers:{Accept:'application/json'},signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('X did not provide readable post text. Paste the post’s text below, including any dates in its image.');const b=JSON.parse(await limitedText(r,80000)) as {html?:string};const paragraph=b.html?.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1];const text=paragraph?plainText(paragraph):'';if(text.length<10)throw Error('This post has no readable announcement text. Paste its caption or the text from its image.');return {url,title:text.split('\n')[0].slice(0,240),text,source:'x_embed' as const};}
 if(!officialHost(u.hostname))throw Error('Automatic reading is available for public X posts and supported official release sites. For this link, paste the announcement text below.');
 let next=url;for(let hop=0;hop<4;hop++){const r=await fetcher(next,{redirect:'manual',headers:{Accept:'text/html,text/plain','User-Agent':'SideQuest announcement reader'},signal:AbortSignal.timeout(12000)});if(r.status>=300&&r.status<400){const location=r.headers.get('location');if(!location)break;const target=new URL(canonicalAnnouncementUrl(new URL(location,next).href));if(!officialHost(target.hostname))throw Error('This page redirects outside supported official sites. Paste the announcement text below.');next=target.href;continue;}if(!r.ok)throw Error('The source could not be read. Paste the announcement text below.');if(!/text\/(html|plain)/i.test(r.headers.get('content-type')||''))throw Error('This link is not a readable web page. Paste the announcement text below.');const html=await limitedText(r);const parsed=officialPageContent(next,html);if(parsed.text.length<20||/just a moment|checking your browser|access denied/i.test(parsed.title))throw Error('The source requires browser access. Paste the announcement text below.');return {url:next,...parsed,source:'official_page' as const};}throw Error('Too many page redirects. Paste the announcement text below.');}
const cache=new Map<string,string>();
export function translationSegments(text:string){
 const parts:string[]=[];let current='';const bytes=(s:string)=>new TextEncoder().encode(s).length;
 for(const sentence of text.split(/(?<=[。！？\n])/u)){
  if(bytes(current+sentence)<=450){current+=sentence;continue;}
  if(current){parts.push(current);current='';}
  for(const char of sentence){if(bytes(current+char)>450){parts.push(current);current='';}current+=char;}
 }if(current)parts.push(current);return parts;
}
type TranslationResult={text:string;status:'not_needed'|'translated'|'partial'|'unavailable';reason?:import('./translation-failure.ts').TranslationFailure;providerStatus?:number};
export async function translateJapanese(text:string,fetcher:typeof fetch=fetch):Promise<TranslationResult>{
 if(!/[\u3040-\u30ff\u3400-\u9fff]/.test(text))return {text,status:'not_needed'};
 const clipped=text.slice(0,1500),segments=translationSegments(clipped),output:string[]=[];
 let failed=0,reason:TranslationResult['reason'],providerStatus:number|undefined;
 const fail=(why:NonNullable<TranslationResult['reason']>,status?:number)=>{failed++;if(reason!=='quota')reason=why;if(status)providerStatus=status;};
 for(let i=0;i<segments.length;i+=3){
  const batch=await Promise.all(segments.slice(i,i+3).map(async segment=>{
   if(!/[\u3040-\u30ff\u3400-\u9fff]/.test(segment))return segment;
   const hit=cache.get(segment);if(hit)return hit;
   try{
    const u=new URL('https://api.mymemory.translated.net/get');u.searchParams.set('q',segment);u.searchParams.set('langpair','ja|en');
    const r=await fetcher(u,{redirect:'manual',signal:AbortSignal.timeout(10000)});
    if(!r.ok){fail(r.status===429?'quota':'provider',r.status);return segment;}
    let b:{responseStatus?:number|string;responseDetails?:string;responseData?:{translatedText?:string}};
    try{b=await r.json();}catch{fail('invalid_response',r.status);return segment;}
    const value=b.responseData?.translatedText,status=Number(b.responseStatus);
    if(status!==200||typeof value!=='string'||!value||value.toUpperCase().includes('MYMEMORY WARNING')){
     fail(status===429||/quota|limit|too many|next available/i.test(b.responseDetails||value||'')?'quota':'invalid_response',status||r.status);return segment;
    }
    const decoded=decodeText(value);if(cache.size>=100)cache.delete(cache.keys().next().value!);cache.set(segment,decoded);return decoded;
   }catch{fail('network');return segment;}
  }));output.push(...batch);
 }
 const changed=output.some((s,i)=>s!==segments[i]);
 if(failed&&!changed)return {text:clipped,status:'unavailable',reason,providerStatus};
 return {text:output.join('\n'),status:failed||text.length>1500?'partial':'translated',...(failed?{reason,providerStatus}:{})};
}


export async function readAnnouncement(raw:string,provided:string,fetcher:typeof fetch=fetch,config:ReaderConfig={}){const url=canonicalAnnouncementUrl(raw),u=new URL(url);if(config.PULLMD_URL&&!provided.trim()&&officialHost(u.hostname)&&u.hostname!=='store.medicomtoy.co.jp'){try{return await pullmdRead(url,config,fetcher);}catch{const result=await directReadAnnouncement(raw,provided,fetcher);return {...result,sourceNote:'The optional reader was unavailable. Read directly from the official page instead.'};}}return directReadAnnouncement(raw,provided,fetcher);}

