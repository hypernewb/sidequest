import {interestMatch,subjectNames,programmeGenres} from './interest-match.ts';
import {overlapsWindow,CATALOG_RETENTION_MS} from './catalog-policy.ts';
import type {EventDetails} from './event-detail-parser.ts';
import {z} from 'zod';
import {graphStrength} from './qloo-candidates.ts';
import {interestSeedSchema,interestWeight,strengthLabel} from './interest-strength.ts';
import {avoidedInterest} from './interest-match.ts';

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
export const preferenceSchema=z.object({intent:z.enum(['collect','play','music','art','cafe','mix']),direction:z.string().max(30),format:z.enum(['any','dated','places','drops']),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),days:z.union([z.literal(1),z.literal(7),z.literal(30)]),budget:z.enum(['any','1000','3000','10000']),unknownPrice:z.boolean(),seeds:z.array(interestSeedSchema).max(8),exclude:z.array(z.string().max(800)).max(150),avoid:z.array(z.string().max(60)).max(20).optional()}).refine(p=>(FOLLOWUPS[p.intent] as readonly (readonly string[])[]).some(x=>x[0]===p.direction),'Choose a direction for this activity.');
export type Preferences=z.infer<typeof preferenceSchema>;
export type Opportunity={sourceFeedback?:{score:number;reasons:string[]};feedbackEntities?:import('./qloo-candidates').TasteSignal[];catalogEntities?:import('./qloo-candidates').CatalogEntity[];qlooEvidence?:import('./qloo-candidates').QlooEvidence[];discovery?:'direct'|'adjacent'|'wildcard';startsAt?:string;endsAt?:string;sourceTimezone?:string;image?:string;curation?:import("./curated-venues").Curation;lat?:number;lon?:number;hours?:import("./discovery").Place["hours"];englishTitle?:string;englishDescription?:string;matchLevel?:"taste"|"activity";artists?:import("./artist-matching").ArtistMatch[];details?:EventDetails;detailStatus?:'read'|'unavailable';id:string;title:string;kind:'place'|'gig'|'exhibition'|'popup'|'release'|'event';source:string;url:string;description:string;actionLabel?:string;location:string;start?:string;end?:string;closedDays?:number[];checkedAt:string;price:number|null;priceLabel:string;availability:string;category:string;affinity?:number;signals?:string[];map?:string;online?:boolean;reasons?:string[];score?:number};
const rules:Record<string,RegExp>={retro:/retro|vintage|中古|レトロ|tamagotchi|digimon|たまごっち|デジモン|handheld|old game/i,design:/designer toys?|artist toys?|bearbrick|be@rbrick|art toys?|デザイナーズ|アートトイ/i,characters:/anime|character|manga|pokemon|pokémon|gundam|sanrio|digimon|tamagotchi|アニメ|キャラ|ポケモン|ガンダム|サンリオ|たまごっち/i,social:/tabletop|board game|trading card|カード|ボードゲーム|magic.*gathering/i,jazz:/jazz|ジャズ|blues|ブルース/i,heavy:/metal|punk|hardcore|grindcore|メタル|パンク/i,electronic:/electronic|techno|ambient|experimental|テクノ|電子|実験/i,independent:/gallery|independent|ギャラリー|mograg/i,listening:/listening|record|vinyl|レコード|リスニング/i,coffee:/coffee|kissaten|コーヒー|喫茶/i};
const activities:Record<Intent,RegExp>={collect:/\b(vinyl|records?|fashion|clothing|jewelry|ceramics|toys?|collectibles?|collecting|hobby|comics?|model kits?|figures?|merchandise|goods|medicom|bandai|tamagotchi|digimon|sanrio|pokemon|gundam)\b|玩具|グッズ|フィギュア/i,play:/arcade|game store|video game|tabletop|board game|ゲーム|amusement/i,music:/music|jazz|concert|record|live|punk|metal|音楽|ライブ|公演/i,art:/\b(art|gallery|museum|exhibition|illustration)\b|展|美術|アート/i,cafe:/cafe|coffee|tea room|kissaten|listening|喫茶|カフェ/i,mix:/.*/};
export function dateWindow(p:Pick<Preferences,'date'|'days'>){return Array.from({length:p.days},(_,i)=>new Date(Date.parse(p.date+'T12:00:00Z')+i*86400000).toISOString().slice(0,10));}
export function canonical(url:string){try{const u=new URL(url);u.hash='';for(const k of [...u.searchParams.keys()])if(/^utm_|^fbclid$/.test(k))u.searchParams.delete(k);return u.href.replace(/\/$/,'');}catch{return url;}}
export function rankOpportunities(items:Opportunity[],p:Preferences,now=new Date()){
 const dates=dateWindow(p),excluded=new Set(p.exclude),dedup=new Map<string,Opportunity>();
 for(const o of items){
  if(o.details?.status==='cancelled'||o.details?.status==='sold_out'||/listed.*sold out when checked|Source says SOLD OUT|official page says sold out/i.test(o.availability))continue;
  if(excluded.has(o.id)||!/^https:\/\//.test(o.url)||!Number.isFinite(Date.parse(o.checkedAt))||now.getTime()-Date.parse(o.checkedAt)>(o.source==='Qloo'?86400000: o.source==='Official catalog'?14*86400000:CATALOG_RETENTION_MS))continue;
  if(!overlapsWindow(o,dates))continue;
  if(p.avoid?.some(n=>subjectNames(o).includes(n))||avoidedInterest(o,p.seeds))continue;
  if(p.format==='places'&&o.kind!=='place'||p.format==='dated'&&o.kind==='place'||p.format==='drops'&&!['popup','release'].includes(o.kind))continue;
  if(p.budget!=='any'&&(o.price===null?!p.unknownPrice:o.price>Number(p.budget)))continue;
  const scoped=(o.details?.original||'').split(/Information\s*基本情報|施設案内|アクセス・駐車場|前のページ|Related Events|関連記事/)[0];
  const brief=[o.title,o.description,o.kind==='place'?o.category:''].join(' ');
  const content=[brief,scoped,...programmeGenres(o).map(g=>g.name)].join(' '),reasons:string[]=[];
  const directionText=p.intent==='music'&&o.kind==='gig'?content:brief+' '+subjectNames(o).join(' ');
  const directionMatch=p.direction==='independent'?/mograg|Taka Ishii|PARCEL|WISH LESS/i.test(o.source)||/independent gallery|自主企画|個展/i.test(brief):p.direction!=='any'&&!!rules[p.direction]?.test(directionText);
  let interestMatchFound=false;
  const overview=scoped.split(/MEMBER|LINE UP|〈Artist〉|Information/)[0].slice(0,1800);
  if(p.intent==='music'&&o.kind==='gig'&&/トーク(?:ライブ|ライヴ|ショー)|お笑い芸人|talk show|stand.up comedy/i.test(overview)&&!/バンド演奏|音楽ライブ|演奏を披露/.test(overview))continue;
  let score=0;
  const activity=p.intent==='music'?o.kind==='gig'||(o.kind==='place'&&activities.music.test(brief))||(o.kind==='event'&&/concert|live music|ジャズライブ|音楽ライブ|演奏会|コンサート/i.test(brief)):
   p.intent==='art'?o.kind==='exhibition'||(o.kind==='place'&&activities.art.test(brief))||(/展覧会|美術|アート|installation|visual art/i.test(brief)&&!['gig','release'].includes(o.kind)):
   p.intent==='cafe'?o.kind==='place'&&activities.cafe.test(brief):
   p.intent==='play'?o.kind==='place'?/arcade|amusement|play area|game tables|ゲームセンター|ボードゲームカフェ/i.test(brief):o.kind==='event'&&/ゲーム体験|ゲーム大会|ボードゲーム会|対戦会|play games|game tournament|board.game session/i.test(brief):
   p.intent==='collect'?['release','popup'].includes(o.kind)&&activities.collect.test(brief+' '+(/vinyl|record|fashion|jewelry|ceramics|character|collectible|figure|model kit|toy|anime/i.test(o.category)?o.category:'')+' '+subjectNames(o).join(' ')):true;
  if(p.intent!=='mix'&&!activity)continue;
  if(p.intent==='collect'&&p.direction==='characters'&&!rules.characters.test(brief+' '+subjectNames(o).join(' ')))continue;
  if((p.intent==='collect'||p.intent==='play')&&o.kind==='gig')continue;
  if(p.intent==='music'&&['popup','release'].includes(o.kind))continue;
  if(p.intent==='play'&&o.kind==='place'&&!/arcade|amusement|play area|game tables|ゲームセンター|ボードゲームカフェ/i.test(content))continue;
  if(p.intent!=='mix'){score+=4;reasons.push('Fits: '+INTENTS[p.intent].toLowerCase());}
  if(directionMatch){score+=8;const artist=[...(o.details?.genres.length?[]:o.artists||[])].sort((a,b)=>b.genres.filter(g=>rules[p.direction]?.test(g)).length-a.genres.filter(g=>rules[p.direction]?.test(g)).length).find(a=>a.genres.some(g=>rules[p.direction]?.test(g)));reasons.push(artist?'Qloo artist name match '+artist.name+' — '+[...new Set(artist.genres.filter(g=>rules[p.direction]?.test(g)))].slice(0,3).join(', '):'Source matches: '+(FOLLOWUPS[p.intent] as readonly (readonly string[])[]).find(x=>x[0]===p.direction)?.[1]);}
  for(const seed of p.seeds){if(interestWeight(seed)<=0)continue;const match=interestMatch(o,seed);if(match){interestMatchFound=true;score+=match.strength*interestWeight(seed)*(p.direction!=='any'&&!directionMatch&&match.kind==='genre' ? .25 : 1);reasons.push(match.reason+' · '+(strengthLabel(seed)==='Love'?'a favourite':strengthLabel(seed)==='Like'?'an interest you like':'something you want to try'));}}
  const graph=(o.qlooEvidence||[]).filter(e=>graphStrength(e)>0).sort((a,b)=>graphStrength(b)-graphStrength(a))[0];
  if(graph){score+=graphStrength(graph);const contributors=[...graph.contributors].sort((a,b)=>b.score*b.weight-a.score*a.weight).slice(0,2).map(c=>c.name);reasons.push('Qloo taste association with '+graph.entityName+(contributors.length?' from '+contributors.join(' and '):' for your combined taste; Qloo supplied no individual explanation')+'. This is an association, not an event-quality or availability rating.');}
  if(o.feedbackEntities?.length){score+=Math.max(...o.feedbackEntities.map(e=>e.weight))*5;reasons.push('Names '+o.feedbackEntities.map(e=>e.name).slice(0,2).join(' and ')+', linked to an announcement you saved or asked to see more like.');}
  if(p.direction!=='any'&&!directionMatch)reasons.push('Activity match only; the source does not establish your preferred style.');
  if(!reasons.length)reasons.push('An option to react to; no personal match established yet.');
  if(o.kind!=='place'){score+=1;reasons.push('Published dates overlap your selected window.');}
  if(now.getTime()-Date.parse(o.checkedAt)>86400000)reasons.push('Source last checked '+o.checkedAt.slice(0,10)+'. Recheck the official page.');
  if(o.kind==='release'&&/listing published/i.test(o.actionLabel||''))reasons.push('Shop listing date, not a verified release or restock date.');
  if(o.kind==='release'&&!/listing published/i.test(o.actionLabel||'')&&o.start&&o.start<p.date&&(o.end||o.start)===o.start)reasons.push(/shipping/i.test(o.actionLabel||'')?'Manufacturer shipping date. Store arrival and stock are unconfirmed.':'Recently released. Current stock is unknown.');
  // Provider affinity is only a tie-breaker within place results, never a cross-provider confidence score.
  score+=Math.max(0,Math.min(1,o.affinity||0))*.2;
  const k=canonical(o.url)+'#'+(o.start||'place')+(o.kind==='release'?'#'+o.title.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,' ').trim():'');const previous=dedup.get(k);if(!previous||(previous.score||0)<score)dedup.set(k,{...o,score,reasons,matchLevel:(p.direction!=='any'?directionMatch:interestMatchFound)?'taste':'activity'});
 }
 const pool=[...dedup.values()].sort((a,b)=>(b.score||0)-(a.score||0)||(a.start||'9999').localeCompare(b.start||'9999')||a.id.localeCompare(b.id)),out:Opportunity[]=[];const counts=new Map<string,number>();
 while(pool.length){let index=0,best=-Infinity;pool.forEach((o,i)=>{const v=(o.matchLevel==='taste'?100:0)+(o.score||0)-Math.min(3,(counts.get(o.source)||0)*.7)-Math.min(3,(counts.get('kind:'+o.kind)||0)*.6);if(v>best){best=v;index=i;}});const o=pool.splice(index,1)[0];out.push(o);counts.set(o.source,(counts.get(o.source)||0)+1);counts.set('kind:'+o.kind,(counts.get('kind:'+o.kind)||0)+1);}
 return out;
}
