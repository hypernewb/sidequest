import type {Opportunity} from './opportunities.ts';
import type {QuestFocus} from './quest-focus.ts';
export function leadFitsActivity(o:Opportunity,focus:QuestFocus='any'){
 const text=[o.title,o.category,o.description].join(' ');
 if(focus==='any')return true;
 if(focus==='sound')return o.kind==='gig'||/vinyl|record fair|レコード|音楽|listening/i.test(text);
 if(focus==='visual')return o.kind==='exhibition'||/gallery|photograph|illustration|展覧会|個展|写真展/i.test(text);
 if(focus==='print')return /book|zine|publication|書籍|書店|出版|画集|本屋/i.test(text);
 if(focus==='design')return /design|architecture|fashion|ceramic|jewelry|craft|建築|デザイン|工芸/i.test(text);
 if(focus==='games'){
  const primary=o.title+' '+o.category;
  if(/arcade prize|plush|ぬいぐるみ|ラグマット|アクリル|figure|フィギュア/i.test(primary))return false;
  return /video.?game|retro.?game|console|cartridge|arcade|game software|ゲームソフト|ゲーム機|レトロゲーム/i.test(primary);
 }
 return ['release','popup'].includes(o.kind)&&/collect|toy|figure|limited|フィギュア|玩具|限定/i.test(text);
}
export function activityReason(o:Opportunity){
 const c=o.curation;if(!c?.focusReason)return undefined;
 const tags=c.matchedTags?.filter(Boolean)||[];
 const taste=c.matchStrength==='stopover'?'A nearby stopover; no personal taste connection is established.':tags.length?'Your Qloo taste tags overlap '+tags.join(', ')+' in the reviewed venue profile.':o.signals?.length?'Qloo links '+o.signals.join(', ')+' to this venue.':'The activity fits; no specific cultural connection was established.';
 return c.focusReason+' '+taste;
}
