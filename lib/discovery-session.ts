import {momentsContextSchema,type MomentTasteContext} from './taste-profile.ts';
import type {ChoiceHistory} from './discovery-learning.ts';
export const DISCOVERY_SESSION_KEY='sidequest-curiosity-session-v1';
export type DiscoverySession={day:string;context:MomentTasteContext;comparisons:ChoiceHistory};
// Session interests can be temporary. Explicit reactions in browser storage are
// newer than a previous session snapshot, including an undone Save.
export function activeDiscoveryContext(stored:MomentTasteContext|undefined,session:DiscoverySession|null){return session?{...stored,...session.context,reactions:stored?.reactions??session.context.reactions}:stored;}
const day=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Tokyo'});
export function readDiscoverySession(storage:Pick<Storage,'getItem'>):DiscoverySession|null{
 try{const raw=storage.getItem(DISCOVERY_SESSION_KEY)||'';if(raw.length>100000)return null;const b=JSON.parse(raw),c=momentsContextSchema.safeParse(b.context);
 if(b.day!==day()||!c.success||!Array.isArray(b.comparisons)||b.comparisons.length>40)return null;
 if(!b.comparisons.every((r:any)=>typeof r.leftId==='string'&&r.leftId.length<=800&&typeof r.rightId==='string'&&r.rightId.length<=800&&['left','right','neither','unknown'].includes(r.outcome)))return null;
 return {day:b.day,context:c.data,comparisons:b.comparisons};}catch{return null;}
}
export function writeDiscoverySession(storage:Pick<Storage,'setItem'>,context:MomentTasteContext,comparisons:ChoiceHistory){
 storage.setItem(DISCOVERY_SESSION_KEY,JSON.stringify({day:day(),context:momentsContextSchema.parse(context),comparisons:comparisons.slice(-40)}));
}
