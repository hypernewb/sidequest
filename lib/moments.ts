import {rankOpportunities,type Opportunity,type Preferences} from './opportunities.ts';
import {catalogCurrent} from './catalog-policy.ts';
import {interestMatch} from './interest-match.ts';
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
export function selectMoments(items:Opportunity[],p:Preferences,access:MomentAccess='all',category:MomentCategory='all',sort='for-you',now=new Date()){
 const candidates=items.map(o=>({...o,online:onlineMoment(o)})).filter(o=>momentEligible(o,now)&&(access==='all'||access==='online'&&o.online||access==='tokyo'&&!o.online&&/Tokyo|東京|Shibuya|渋谷|Shinjuku|新宿|Shimokitazawa|下北沢|Ebisu|恵比寿|Roppongi|六本木/i.test(o.location))&&(category==='all'||category==='drops'&&o.kind==='release'||category==='events'&&o.kind!=='release'));
 const ranked=rankOpportunities(candidates,{...p,intent:'mix',direction:'any',format:'dated'},now).map(o=>{
  const matches=p.seeds.map(s=>interestMatch(o,s)).filter(Boolean);
  const strong=matches.some(m=>m!.kind!=='genre'||m!.strength>=5);
  return {...o,matchLevel:strong?'taste' as const:'activity' as const};
 });
 const deadline=(o:Opportunity)=>Date.parse(o.endsAt||o.startsAt||(o.end||o.start)+'T23:59:59+09:00');
 if(sort==='ending')return ranked.sort((a,b)=>deadline(a)-deadline(b));
 // Taste remains primary. Urgency only orders comparable matches, while source
 // and format penalties keep one publisher from filling the whole first screen.
 const out:Opportunity[]=[],counts=new Map<string,number>(),pool=[...ranked];
 while(pool.length){let index=0,best=-Infinity;pool.forEach((o,i)=>{const hours=(deadline(o)-now.getTime())/3600000,urgency=hours>=0&&hours<=72?2:0,related=o.reasons?.some(r=>/a favourite|something you want to try/.test(r)),span=Date.parse(o.end||o.start!)-Date.parse(o.start!),value=(o.matchLevel==='taste'?100:related?20:0)+(o.score||0)+urgency-(span>60*86400000?4:0)-(counts.get(o.source)||0)*2-(counts.get(o.kind)||0)*.4;if(value>best){best=value;index=i;}});const o=pool.splice(index,1)[0];out.push(o);counts.set(o.source,(counts.get(o.source)||0)+1);counts.set(o.kind,(counts.get(o.kind)||0)+1);}
 return out;
}
