import {interestWeight} from './interest-strength.ts';
import {parseWWW,parseParco,parseMograg,type OfficialItem} from './official-events.ts';
import {namedMention} from './interest-match.ts';
import type {Opportunity,Preferences} from './opportunities.ts';
import type {MomentTasteContext} from './taste-profile.ts';
import type {TasteScouting} from './catalog-taste.ts';

export async function scoutOfficialTaste(related:TasteScouting[],p:Preferences,context:MomentTasteContext|undefined,read:(k:string)=>Promise<any>,write:(k:string,v:any)=>Promise<void>,fetcher:typeof fetch=fetch,now=new Date()){
 const direction=context?.direction||context?.answers?.invitation,domain=[...p.seeds.filter(s=>interestWeight(s)>0)].filter(s=>interestWeight(s)>0).sort((a,b)=>interestWeight(b)-interestWeight(a))[0]?.type;
 const choice=direction==='music'||!direction&&domain==='artist'?'www':direction==='art'?'mograg':'parco';
 const local=new Date(now.toLocaleDateString('en-CA',{timeZone:'Asia/Tokyo'})+'T12:00:00Z'),year=local.getUTCFullYear(),month=local.getUTCMonth()+1;
 const url=choice==='www'?`https://www-shibuya.jp/schedule/${year}${String(month).padStart(2,'0')}.php`:choice==='mograg'?'https://mograg.com/index.html':'https://shibuya.parco.jp/event/';
 const source=choice==='www'?'WWW / WWW X':choice==='mograg'?'mograg gallery':'Shibuya PARCO';
 const names=[...related.map(e=>({id:e.id,name:e.name,type:e.type})),...p.seeds.filter(s=>interestWeight(s)>0)].filter(e=>e.name.length>=4);
 if(!names.length)return {items:[] as Opportunity[],health:{source,url,status:'skipped',parsed:0,matched:0,message:'No confirmed cultural names to scout yet.'}};
 const cacheKey='taste-scout:v1:'+choice+':'+year+':'+month;let records:OfficialItem[]=[],cached=false,checkedAt=now.toISOString();
 try{
  const old=await read(cacheKey);if(old&&Date.now()-old.at<3600000){records=old.items;checkedAt=old.checkedAt;cached=true;}
  else{
   const r=await fetcher(url,{redirect:'manual',headers:{Accept:'text/html','User-Agent':'SideQuest/1.0 bounded official taste scout'},signal:AbortSignal.timeout(5000)});
   if(!r.ok||!/text\/html/i.test(r.headers.get('content-type')||''))throw Error('Official calendar unavailable');
   const reader=r.body?.getReader();if(!reader)throw Error('Empty official calendar');let html='',bytes=0;const decoder=new TextDecoder();try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>1200000)throw Error('Official calendar exceeds read limit');html+=decoder.decode(value,{stream:true});}html+=decoder.decode();}finally{await reader.cancel();}
   records=choice==='www'?parseWWW(html,year,month,checkedAt):choice==='mograg'?parseMograg(html,checkedAt):parseParco(html,checkedAt);
   await write(cacheKey,{at:Date.now(),checkedAt,items:records});
  }
  const items=records.flatMap(r=>{const matches=names.filter(e=>namedMention(r.title,e.name));if(!matches.length)return [];return [{id:r.id,title:r.title,kind:r.kind,source,url:r.url,description:r.evidence,location:r.location,start:r.start,end:r.end,closedDays:r.closedDays,checkedAt:r.checkedAt,price:null,priceLabel:'Price not verified',availability:r.note+' '+r.timing,category:r.kind,catalogEntities:matches.map(e=>({id:e.id,name:e.name,type:e.type,input:e.name,evidence:'source-name' as const})),qlooEvidence:related.filter(e=>matches.some(m=>m.id===e.id)&&e.evidence).map(e=>e.evidence!)} satisfies Opportunity];});
  return {items,health:{source,url,status:'read',cached,checkedAt,parsed:records.length,matched:items.length,message:'One official calendar read. Only literal confirmed or Qloo-related names can add announcements; dates and access still require eligibility checks.'}};
 }catch{return {items:[] as Opportunity[],health:{source,url,status:'unavailable',parsed:0,matched:0,message:'The bounded official-source scout could not read this calendar. Existing catalog results remain available.'}};}
}
