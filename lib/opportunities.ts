import type {EventDetails} from './event-detail-parser.ts';
import {z} from 'zod';

export const INTENTS={collect:'Find objects worth collecting',play:'Play games',music:'Hear live music',art:'See art & unusual exhibitions',cafe:'Find somewhere to unwind',mix:'Show me a mix'} as const;
export const FOLLOWUPS={
 collect:[['retro','Old games & childhood favourites'],['design','Artist toys & unusual design'],['characters','Anime & character goods']],
 play:[['retro','Retro arcades & old games'],['social','Tabletop & games with other people'],['any','Anything I can actually play']],
 music:[['jazz','Jazz & listening sessions'],['heavy','Punk, metal & loud guitars'],['electronic','Electronic & experimental nights'],['any','Help me find something new']],
 art:[['independent','Small galleries & independent artists'],['characters','Anime, illustration & character art'],['any','A mix of exhibitions']],
 cafe:[['listening','Records & listening bars'],['coffee','Coffee & kissaten'],['any','Somewhere to take a break']],
 mix:[['any','Let me react to real suggestions']]
} as const;
export type Intent=keyof typeof INTENTS;
export const preferenceSchema=z.object({intent:z.enum(['collect','play','music','art','cafe','mix']),direction:z.string().max(30),format:z.enum(['any','dated','places','drops']),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),days:z.union([z.literal(1),z.literal(7),z.literal(30)]),budget:z.enum(['any','1000','3000','10000']),unknownPrice:z.boolean(),seeds:z.array(z.object({id:z.string().uuid(),name:z.string().min(1).max(100),type:z.string().max(40),feeling:z.enum(['love','curious'])})).max(8),exclude:z.array(z.string().max(800)).max(150)}).refine(p=>(FOLLOWUPS[p.intent] as readonly (readonly string[])[]).some(x=>x[0]===p.direction),'Choose a direction for this activity.');
export type Preferences=z.infer<typeof preferenceSchema>;
export type Opportunity={artists?:import("./artist-matching").ArtistMatch[];details?:EventDetails;detailStatus?:'read'|'unavailable';id:string;title:string;kind:'place'|'gig'|'exhibition'|'popup'|'release'|'event';source:string;url:string;description:string;actionLabel?:string;location:string;start?:string;end?:string;closedDays?:number[];checkedAt:string;price:number|null;priceLabel:string;availability:string;category:string;affinity?:number;signals?:string[];map?:string;online?:boolean;reasons?:string[];score?:number};
const rules:Record<string,RegExp>={retro:/retro|vintage|中古|レトロ|tamagotchi|digimon|たまごっち|デジモン|handheld|old game/i,design:/designer toys?|artist toys?|bearbrick|be@rbrick|art toys?|デザイナーズ|アートトイ/i,characters:/anime|character|manga|pokemon|pokémon|gundam|sanrio|digimon|tamagotchi|アニメ|キャラ|ポケモン|ガンダム|サンリオ|たまごっち/i,social:/tabletop|board game|trading card|カード|ボードゲーム|magic.*gathering/i,jazz:/jazz|ジャズ|blues|ブルース/i,heavy:/metal|punk|hardcore|grindcore|メタル|パンク/i,electronic:/electronic|techno|ambient|experimental|テクノ|電子|実験/i,independent:/gallery|independent|ギャラリー|mograg/i,listening:/listening|record|vinyl|レコード|リスニング/i,coffee:/coffee|kissaten|コーヒー|喫茶/i};
const activities:Record<Intent,RegExp>={collect:/\b(toys?|collectibles?|collecting|hobby|comics?|model kits?|figures?|merchandise|goods|medicom|bandai|tamagotchi|digimon|sanrio|pokemon|gundam)\b|玩具|グッズ|フィギュア/i,play:/arcade|game store|video game|tabletop|board game|ゲーム|amusement/i,music:/music|jazz|concert|record|live|punk|metal|音楽|ライブ|公演/i,art:/\b(art|gallery|museum|exhibition|illustration)\b|展|美術|アート/i,cafe:/cafe|coffee|tea room|kissaten|listening|喫茶|カフェ/i,mix:/.*/};
export function dateWindow(p:Pick<Preferences,'date'|'days'>){return Array.from({length:p.days},(_,i)=>new Date(Date.parse(p.date+'T12:00:00Z')+i*86400000).toISOString().slice(0,10));}
export function canonical(url:string){try{const u=new URL(url);u.hash='';for(const k of [...u.searchParams.keys()])if(/^utm_|^fbclid$/.test(k))u.searchParams.delete(k);return u.href.replace(/\/$/,'');}catch{return url;}}
export function rankOpportunities(items:Opportunity[],p:Preferences,now=new Date()){
 const dates=dateWindow(p),excluded=new Set(p.exclude),dedup=new Map<string,Opportunity>();
 for(const o of items){
  if(o.details?.status==='cancelled'||o.details?.status==='sold_out')continue;
  if(excluded.has(o.id)||!/^https:\/\//.test(o.url)||!Number.isFinite(Date.parse(o.checkedAt))||now.getTime()-Date.parse(o.checkedAt)>(o.source==='Qloo'?86400000: o.source==='Official catalog'?14*86400000:86400000))continue;
  if(o.start&&!dates.some(d=>d>=o.start!&&d<=(o.end||o.start!)&&!o.closedDays?.includes(new Date(d+'T12:00:00Z').getUTCDay())))continue;
  if(p.format==='places'&&o.kind!=='place'||p.format==='dated'&&o.kind==='place'||p.format==='drops'&&!['popup','release'].includes(o.kind))continue;
  if(p.budget!=='any'&&(o.price===null?!p.unknownPrice:o.price>Number(p.budget)))continue;
  const content=[o.title,o.description,o.category,o.details?.original||'',...(o.artists||[]).flatMap(a=>a.genres)].join(' '),reasons:string[]=[];
  let score=0;
  const activity=activities[p.intent].test(content)||(p.intent==='music'&&o.kind==='gig')||(p.intent==='art'&&o.kind==='exhibition')||(p.intent==='collect'&&o.kind==='release');
  if(p.intent!=='mix'&&!activity)continue;
  if((p.intent==='collect'||p.intent==='play')&&o.kind==='gig')continue;
  if(p.intent==='music'&&['popup','release'].includes(o.kind))continue;
  if(p.intent==='play'&&o.kind==='place'&&!/arcade|amusement|play area|game tables|ゲームセンター|ボードゲームカフェ/i.test(content))continue;
  if(p.intent!=='mix'){score+=4;reasons.push('Fits: '+INTENTS[p.intent].toLowerCase());}
  if(p.direction!=='any'&&rules[p.direction]?.test(content)){score+=5;reasons.push('Source mentions your preference: '+(FOLLOWUPS[p.intent] as readonly (readonly string[])[]).find(x=>x[0]===p.direction)?.[1]);}
  for(const seed of p.seeds){const direct=content.toLocaleLowerCase().includes(seed.name.toLocaleLowerCase());const associated=o.signals?.includes(seed.name);if(direct||associated){score+=seed.feeling==='love'?6:2;reasons.push((direct?'Mentions ':'Qloo association with ')+seed.name+(seed.feeling==='curious'?' · something you want to try':' · already a favourite'));}}
  if(p.direction!=='any'&&!rules[p.direction]?.test(content))reasons.push('Activity match only; the source does not establish your preferred style.');
  if(!reasons.length)reasons.push('An option to react to; no personal match established yet.');
  if(o.kind!=='place'){score+=1;reasons.push('Published dates overlap your selected window.');}
  // Provider affinity is only a tie-breaker within place results, never a cross-provider confidence score.
  score+=Math.max(0,Math.min(1,o.affinity||0))*.2;
  const k=canonical(o.url)+'#'+(o.start||'place');const previous=dedup.get(k);if(!previous||(previous.score||0)<score)dedup.set(k,{...o,score,reasons});
 }
 const pool=[...dedup.values()].sort((a,b)=>(b.score||0)-(a.score||0)||(a.start||'9999').localeCompare(b.start||'9999')||a.id.localeCompare(b.id)),out:Opportunity[]=[];const counts=new Map<string,number>();
 while(pool.length){let index=0,best=-Infinity;pool.forEach((o,i)=>{const v=(o.score||0)-(counts.get(o.source)||0)*1.5;if(v>best){best=v;index=i;}});const o=pool.splice(index,1)[0];out.push(o);counts.set(o.source,(counts.get(o.source)||0)+1);}
 return out;
}




