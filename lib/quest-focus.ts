import type {Opportunity} from './opportunities.ts';
export const QUEST_FOCUS=['sound','visual','print','design','games','collect','any'] as const;
export type QuestFocus=typeof QUEST_FOCUS[number];
export const focusLabels:Record<QuestFocus,string>={sound:'Records & listening',visual:'Art & photography',print:'Books & illustration',design:'Design & architecture',games:'Retro games',collect:'Objects & collectibles',any:'Follow the seed'};
export function focusQuestion(seed:{name:string;type:string}){
 const ids:QuestFocus[]=seed.type==='artist'||seed.type==='album'?['sound','visual','print']:['movie','tv_show'].includes(seed.type)?['visual','print','design']:['videogame','video_game'].includes(seed.type)?['games','visual','collect']:seed.type==='brand'?['design','visual','print']:['sound','visual','design'];
 return {prompt:'What would you like to find on this walk?',seed:seed.name,options:ids.map(id=>({id,label:focusLabels[id]}))};
}
export function focusFit(o:Opportunity,focus:QuestFocus='any'){
 const role=o.curation?.role,tags=o.curation?.tags||[];
 return focus==='sound'?role==='dig'||role==='listen':focus==='visual'?role==='art'||tags.includes('photography'):focus==='print'?role==='books':focus==='design'?tags.some(t=>['design','architecture'].includes(t)):focus==='games'?role==='play'&&tags.includes('games'):focus==='collect'?role==='play':false;
}
export function applyFocus(items:Opportunity[],focus:QuestFocus='any'){
 if(focus==='any')return items;
 return items.map(o=>{if(!o.curation)return o;const matches=focusFit(o,focus);return {...o,curation:{...o.curation,focusRequested:true,focusMatch:matches,focusReason:matches?'You asked for '+focusLabels[focus].toLowerCase()+'. This matches the reviewed venue activity.':undefined,tasteScore:(o.curation.tasteScore||0)+(matches?25:0)}};});
}
