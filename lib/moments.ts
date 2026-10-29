import {rankOpportunities,type Opportunity,type Preferences} from './opportunities.ts';
import {catalogCurrent} from './catalog-policy.ts';
import {interestMatch} from './interest-match.ts';
import {graphStrength} from './qloo-candidates.ts';
import type {MomentTasteContext} from './taste-profile.ts';
import {programmeGenres} from './interest-match.ts';
import {explicitSoulGenre} from './event-detail-parser.ts';
import {interestWeight} from './interest-strength.ts';
export type MomentAccess='all'|'online'|'tokyo';
export type MomentCategory='all'|'events'|'drops';
export function onlineMoment(o:Opportunity){return !!o.online&&!/participating retailers|Japan retailers|prize.machine|in.store lottery/i.test(o.location+' '+o.actionLabel);}
export function momentEligible(o:Opportunity,now=new Date()){
 if(o.kind==='place'||!catalogCurrent(o,now))return false;
 if(o.endsAt&&(!Number.isFinite(Date.parse(o.endsAt))||Date.parse(o.endsAt)<=now.getTime()))return false;
 if(o.startsAt&&!o.endsAt&&o.kind!=='release'&&Date.parse(o.startsAt)<now.getTime())return false;
 if(o.kind!=='release')return true;
 if(/listing published|manufacturer shipping/i.test(o.actionLabel||''))return false;
 return /preorder|order window|lottery window/i.test(o.actionLabel||'')||/limited.edition|limited.to\s+\d|edition.of\s+\d|数量限定|受注|抽選|限定販売|期間限定/i.test(o.title+' '+o.description);
}
const editorialRules:Record<string,RegExp>={music:/\bmusic\b|\bjazz\b|\bconcert\b|listening party|ライブ|音楽/i,games:/\bgames?\b|ゲーム/i,anime:/anime|animation|アニメ/i,art:/\bart\b|gallery|exhibition|美術|展覧/i,design:/design|デザイン/i,collectibles:/collectibl|limited edition|artist edition|フィギュア|グッズ/i,jazz:/\bjazz\b|ジャズ/i,soul:/\bsoul\b|ソウル/i,electronic:/electronic|techno|電子音楽|テクノ/i,experimental:/experimental|実験/i,punk:/\bpunk\b|hardcore|パンク/i,metal:/\bmetal\b|メタル/i,retro:/retro|vintage|レトロ/i,fantasy:/fantasy|ファンタジー/i,'indie-games':/indie games?|インディーゲーム/i,illustration:/illustration|イラスト/i,tabletop:/tabletop|board.game|ボードゲーム/i,photography:/photograph|写真/i,craft:/\bcraft\b|ceramic|工芸|陶芸/i,film:/\bfilm\b|\bcinema\b|screening|映画/i,'designer-toys':/designer toy|art toy|bearbrick|be@rbrick|アートトイ/i,characters:/character|anime|キャラクター|アニメ/i,books:/\bbooks?\b|\bzines?\b|出版|書籍/i,vinyl:/\bvinyl\b|\brecords?\b|レコード/i};
export function momentTasteFeatures(o:Opportunity){
 // Publisher biographies and free promotional prose are not programme tags.
 const text=[o.title,o.category,...programmeGenres(o).map(g=>g.name)].join(' ');
 return {kind:o.kind,title:o.englishTitle||o.title,tags:Object.entries(editorialRules).filter(([name,re])=>name==='soul'?programmeGenres(o).some(g=>g.name.toLowerCase()==='soul')||explicitSoulGenre(o.title):re.test(text)).map(([name])=>name)};
}
export function sourceFeedbackMatch(o:Opportunity,targets:{kind:string;title:string;tags:string[];weight:number}[]){
 const features=momentTasteFeatures(o),broad=new Set(['music','art','design','games','collectibles','anime','characters']);let score=0;const reasons:string[]=[];
 for(const target of targets){const overlap=target.tags.filter(t=>features.tags.includes(t)),value=Math.min(3,overlap.reduce((n,t)=>n+(broad.has(t)?.5:1.5),0)+(target.kind===o.kind?.5:0))*target.weight;
  if(value>score){score=value;reasons.splice(0,reasons.length,overlap.length?'Source-based '+overlap.slice(0,3).join(', ')+' connection with '+target.title.slice(0,90)+', an announcement you liked.':'Same '+o.kind+' format as an announcement you liked. No cultural affinity is established.');}
 }
 return {score,reasons};
}
export function editorialMomentMatch(o:Opportunity,context?:MomentTasteContext){
 if(!context)return {score:0,reasons:[] as string[]};
 const text=[o.title,o.category,...programmeGenres(o).map(g=>g.name)].join(' ');
 const direction=context.direction||context.answers?.invitation;
 const formatFits=direction==='objects'?['release','popup'].includes(o.kind)||o.kind==='event'&&/book fair|record fair|art fair|market|マーケット|蚤の市/i.test(o.title+' '+o.category):direction==='art'?['exhibition','popup'].includes(o.kind)||o.kind==='event'&&/art|screening|film|cinema|展覧|上映/i.test(o.title+' '+o.category):direction==='music'?['gig','event'].includes(o.kind):true;
 const matches=formatFits?context.tags.filter(t=>t.id.startsWith('editorial:')&&(t.id==='editorial:soul'?programmeGenres(o).some(g=>g.name.toLowerCase()==='soul')||explicitSoulGenre(o.title):editorialRules[t.id.slice(10)]?.test(text))):[];
 const directionMatch=direction==='music'?o.kind==='gig'||/music|concert|listening party|音楽/i.test(o.category):direction==='art'?o.kind==='exhibition':direction==='objects'?['release','popup'].includes(o.kind):direction==='worlds'?/game|anime|ゲーム|アニメ/i.test(text):false;
 return {score:Math.min(6,matches.reduce((n,t)=>n+2*t.weight,0)+(directionMatch?2:0)),reasons:[...(matches.length?['Your '+matches.map(t=>t.name).slice(0,3).join(', ')+' choices match the listing title, category or published genre evidence.']:[]),...(directionMatch?['Matches the '+direction+' direction you chose.']:[])]};
}
export function selectMoments(items:Opportunity[],p:Preferences,access:MomentAccess='all',category:MomentCategory='all',sort='for-you',now=new Date(),context?:MomentTasteContext){
 const candidates=items.map(o=>({...o,online:onlineMoment(o)})).filter(o=>momentEligible(o,now)&&(access==='all'||access==='online'&&o.online||access==='tokyo'&&!o.online&&/Tokyo|東京|Shibuya|渋谷|Shinjuku|新宿|Shimokitazawa|下北沢|Ebisu|恵比寿|Roppongi|六本木/i.test(o.location))&&(category==='all'||category==='drops'&&o.kind==='release'||category==='events'&&o.kind!=='release'));
 const ranked=rankOpportunities(candidates,{...p,intent:'mix',direction:'any',format:'dated'},now).map(o=>{
  const matches=p.seeds.filter(s=>interestWeight(s)>0).flatMap(s=>{const m=interestMatch(o,s);return m?[{...m,weight:interestWeight(s)}]:[];});
  const direct=matches.some(m=>m.kind==='direct')||!!o.feedbackEntities?.length,strong=matches.some(m=>m.kind!=='genre'||m.strength>=5),graph=(o.qlooEvidence||[]).some(e=>graphStrength(e)>0);
  const tastePriority=Math.max(0,...matches.map(m=>(m.kind==='direct'?100:m.kind==='subject'?40:20*m.strength/9)*m.weight),...(o.feedbackEntities||[]).map(e=>80*e.weight));
  const editorial=editorialMomentMatch(o,context);
  const musicEvidence=p.seeds.some(s=>interestWeight(s)>0&&['artist','album'].includes(s.type))||context?.direction==='music'||context?.answers?.invitation==='music'||!!editorial.score||!!o.feedbackEntities?.length;
  const weakMusicGraph=graph&&!musicEvidence&&(o.qlooEvidence||[]).every(e=>e.domain==='artist');
  const reasons=weakMusicGraph?(o.reasons||[]).map(r=>r.startsWith('Qloo taste association')?'Weak cross-domain association only. The source does not establish a connection to your chosen activity.':r):o.reasons||[];
  const unsupportedMusicBoost=weakMusicGraph?Math.max(0,...(o.qlooEvidence||[]).map(graphStrength)):0;
  return {...o,tastePriority,score:(o.score||0)-unsupportedMusicBoost+editorial.score+(o.sourceFeedback?.score||0),reasons:[...(o.sourceFeedback?.reasons||[]),...reasons,...editorial.reasons],discovery:direct?'direct' as const:matches.length||graph&&!weakMusicGraph||editorial.score||(o.sourceFeedback?.score||0)>0?'adjacent' as const:'wildcard' as const,matchLevel:strong?'taste' as const:'activity' as const};
 });
 const deadline=(o:Opportunity)=>Date.parse(o.endsAt||o.startsAt||(o.end||o.start)+'T23:59:59+09:00');
 if(sort==='ending')return ranked.sort((a,b)=>deadline(a)-deadline(b));
 // Taste remains primary. Urgency only orders comparable matches, while source
 // and format penalties keep one publisher from filling the whole first screen.
 const out:Opportunity[]=[],counts=new Map<string,number>(),pool=[...ranked];
 while(pool.length){let index=0,best=-Infinity;pool.forEach((o,i)=>{const hours=(deadline(o)-now.getTime())/3600000,urgency=hours>=0&&hours<=72?2:0,related=o.discovery==='adjacent',span=Date.parse(o.end||o.start!)-Date.parse(o.start!),value=(o.tastePriority|| (related?5:0))+(o.score||0)+urgency-(span>60*86400000?4:0)-(counts.get(o.source)||0)*2-(counts.get(o.kind)||0)*.4;if(value>best){best=value;index=i;}});const o=pool.splice(index,1)[0];out.push(o);counts.set(o.source,(counts.get(o.source)||0)+1);counts.set(o.kind,(counts.get(o.kind)||0)+1);}
 return out;
}
