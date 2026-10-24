import type {Opportunity,Preferences} from './opportunities.ts';
import type {QuestSeed} from './quest-seeds.ts';
import {tasteThreads,culturalOverlap} from './curated-taste.ts';
import {programmeFor,activeProgramme} from './quest-programmes.ts';
import {focusFit,type QuestFocus} from './quest-focus.ts';
export type EventLead={id:string;title:string;url:string;location:string;start:string;end:string;priceLabel:string;reason:string;times:string[];kind:string;online?:boolean};
export function tokyoEvent(o:Opportunity){return /Tokyo|東京|Shibuya|渋谷|Shinjuku|新宿|Shimokitazawa|下北沢|Ebisu|恵比寿|Daikanyama|代官山|Roppongi|六本木|Ueno|上野|Akihabara|秋葉原|Harajuku|原宿|Koenji|高円寺|Kuramae|蔵前|Yanaka|谷中/i.test(o.location);}
const nameKey=(s:string)=>s.normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const franchises:[string,RegExp][]=[['Pokémon',/pok[eé]mon|ポケモン/i],['Digimon',/digimon|デジモン/i],['The Legend of Zelda',/legend of zelda|ゼルダの伝説/i],['Final Fantasy',/final fantasy|ファイナルファンタジー/i],['Super Mario',/super mario|スーパーマリオ/i]];
export function eventFit(o:Opportunity,seed:QuestSeed,threads=tasteThreads(seed.taste||[])){
 const named=(o.artists||[]).some(a=>a.id.toUpperCase()===seed.id.toUpperCase());
 // Use event fields only. Full-page navigation/footer text is not subject evidence.
 const subject=seed.type==='artist'?[o.title,...(o.details?.artists||[]),...(o.artists||[]).map(a=>a.name)]:[o.title];
 const needle=seed.name.normalize('NFKC').toLocaleLowerCase().trim();
 const escaped=needle.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const mentions=new RegExp('(?<![\\p{L}\\p{N}])'+escaped+'(?![\\p{L}\\p{N}])','u');
 const explicit=named||needle.length>=4&&subject.some(s=>nameKey(s)===nameKey(seed.name)||mentions.test(s.normalize('NFKC').toLocaleLowerCase()));
 if(explicit)return {score:120,reason:'The announcement names '+seed.name+'.',direct:true};
 if(['videogame','video_game','movie','tv_show','book','brand'].includes(seed.type)){
  const franchise=franchises.find(([,re])=>re.test(seed.name)&&re.test(o.title));
  if(franchise)return {score:85,reason:'The announcement names the same '+franchise[0]+' franchise. This does not confirm this particular edition or stock.',direct:false};
 }
 const genres=[...(o.details?.genres||[]).map(g=>({name:g.name})),...(o.artists||[]).flatMap(a=>a.genres.map(name=>({name})))];
 const overlap=culturalOverlap([...tasteThreads(genres).keys()],threads);
 const strong=overlap.filter(t=>t.weight>=.75);
 if(strong.length)return {score:65+Math.min(2,strong.length-1)*5+(o.signals?.includes(seed.name)?10:0),reason:'The published programme or resolved artists match '+strong.map(t=>t.name).join(', ')+'.'+(o.signals?.includes(seed.name)?' Qloo also returned an artist association.':''),direct:false};
 // A positive graph contribution alone is too broad. In live checks it linked
 // Nujabes to a deathcore gig. Keep genre evidence as the qualifying condition.
 return null;
}
export function eventLeads(records:Opportunity[],seed:QuestSeed,p:Preferences,now=new Date(),limit=3):EventLead[]{
 const days=Array.from({length:7},(_,i)=>new Date(Date.parse(p.date+'T12:00:00+09:00')+i*86400000).toLocaleDateString('en-CA',{timeZone:'Asia/Tokyo'}));
 const seen=new Set<string>();return records.filter(o=>days.some(day=>activeProgramme(o,day,now,true))&&(tokyoEvent(o)||o.online&&o.kind==='release')&&!p.exclude.includes(o.id)&&(p.budget==='any'||(o.price===null?p.unknownPrice:o.price<=Number(p.budget)))).map(o=>({o,fit:eventFit(o,seed)})).filter((x):x is {o:Opportunity;fit:NonNullable<ReturnType<typeof eventFit>>}=>!!x.fit).sort((a,b)=>b.fit.score-a.fit.score||(a.o.end||a.o.start||'').localeCompare(b.o.end||b.o.start||'')).filter(({o})=>{if(seen.has(o.url))return false;seen.add(o.url);return true;}).slice(0,limit).map(({o,fit})=>({id:o.id,title:o.englishTitle||o.title,url:o.url,location:o.location,start:o.start!,end:o.end||o.start!,priceLabel:o.priceLabel,reason:fit.reason,times:o.details?.times||[],kind:o.kind,online:o.online}));
}
export function withProgrammes(items:Opportunity[],records:Opportunity[],seed:QuestSeed,p:Preferences,now=new Date(),focus:QuestFocus='any'){
 const threads=tasteThreads(seed.taste||[]);
 return items.flatMap(o=>{
  const programme=programmeFor(o,p.date,records,now,e=>eventFit(e,seed,threads)?.score||0);if(!programme)return [o];
  if(p.budget!=='any'&&(programme.price===null?!p.unknownPrice:programme.price>Number(p.budget)))return [];
  const fit=eventFit(programme,seed,threads);
  const selected=focus!=='any'&&focusFit(o,focus);
  // A dated programme can improve fit, but does not invent visiting times.
  if(!fit||!o.curation)return [o];
  return [{...o,price:programme.price,priceLabel:programme.priceLabel,curation:{...o.curation,programmeReason:fit.reason,programmeId:programme.id,matchStrength:fit.score>=65?'anchor' as const:o.curation.matchStrength,tasteScore:(o.curation.tasteScore||0)+fit.score+(selected?10:0)}}];
 });
}
