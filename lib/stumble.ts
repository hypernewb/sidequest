import type {Opportunity} from './opportunities.ts';
import type {MomentTasteContext} from './taste-profile.ts';

export function stumbleHasTaste(seeds:readonly unknown[],context?:Partial<MomentTasteContext>){
 return seeds.length>0||!!(context?.tags?.length||context?.reactions?.length||context?.direction?.trim());
}

export const STUMBLE_SESSION_KEY='sidequest-stumble-session-v1';
export const STUMBLE_SESSION_LIMIT=200;
export const MOMENT_SAVES_KEY='sidequest-moments-v1';
export function readStumbleSession(storage:Pick<Storage,'getItem'>):string[]{
 try{const value=JSON.parse(storage.getItem(STUMBLE_SESSION_KEY)||'[]');return Array.isArray(value)?[...new Set<string>(value.filter((v):v is string=>typeof v==='string'&&v.length>0&&v.length<=800))].slice(0,STUMBLE_SESSION_LIMIT):[];}catch{return [];}
}
export function rememberStumble(seen:readonly string[],id:string){return [...new Set([...seen,id])].slice(0,STUMBLE_SESSION_LIMIT);}
// Keep the server's evidence-based order. This layer only prevents repeats.
export function nextStumble(items:readonly Opportunity[],seen:readonly string[]){
 if(seen.length>=STUMBLE_SESSION_LIMIT)return undefined;
 const ids=new Set(seen);return items.find(o=>!ids.has(o.id));
}
export function stumbleEntityIds(o:Opportunity){return [...new Set([...(o.catalogEntities||[]).map(e=>e.id),...(o.artists||[]).map(a=>a.id)])].slice(0,12);}
export function stumbleConnection(o:Opportunity,hasTaste:boolean){
 if(o.discovery==='direct')return {label:'Personal connection',text:o.reasons?.find(r=>/favourite|want to try|exact|source names|linked to an announcement/i.test(r))||'The source names an interest you chose.'};
 if(o.discovery==='adjacent')return {label:'Adjacent discovery',text:o.reasons?.find(r=>/^Qloo taste association/i.test(r))||o.sourceFeedback?.reasons[0]||o.reasons?.find(r=>/choices|earlier|format|genre|same franchise|direction you chose/i.test(r))||'Listing evidence connects this find to your choices. No exact personal match is established.'};
 return {label:'Wildcard',text:hasTaste?'No personal connection is established. This is another current listing to react to.':'A current listing to explore. Add taste if you want personal connections.'};
}
export function momentTiming(o:Opportunity){
 const instant=(v:string)=>new Date(v).toLocaleString(undefined,{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZoneName:'short'});
 const date=(v:string)=>new Date(v+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
 if(o.endsAt)return 'Closes '+instant(o.endsAt);
 if(o.startsAt)return instant(o.startsAt);
 if(!o.start)return 'Check the official announcement for dates';
 return o.start===o.end||!o.end?date(o.start):date(o.start)+' to '+date(o.end);
}

