import type {ScoutPlan,ScoutStop} from './scout.ts';
import type {CulturalPick} from './taste-exploration.ts';
export type Quest=Omit<ScoutPlan,'stops'> & {title:string;vibe:string;invitation:string;stops:(ScoutStop & {mission:string;programme?:{title:string;url:string;start:string;end:string;priceLabel:string}})[];seed:{id:string;name:string;type:string}};
const normalized=(v:string)=>v.normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
export function resolveQuestSeed(query:string,candidates:CulturalPick[],choice?:string){
 if(choice)return candidates.find(c=>c.id.toUpperCase()===choice.toUpperCase())||null;
 const exact=candidates.filter(c=>normalized(c.name)===normalized(query));return exact.length===1?exact[0]:null;
}
export function missionFor(category:string,index:number){
 if(/record|cd store/i.test(category))return 'Find one sleeve you would take home for the artwork alone. Ask the staff for a recommendation, and try a listening station if one is available. You can leave with a new name, not a purchase.';
 if(/book/i.test(category))return 'Pull out a book whose cover makes you stop. Spend ten minutes with it. Photograph the title if the shop allows it, then follow one unfamiliar name inside.';
 if(/gallery|museum|art center/i.test(category))return 'If a public exhibition is running, choose one work and stay with it for five minutes. Notice the material, rhythm or colour before reading the label. Check the current programme and admission first.';
 if(/arcade|amusement/i.test(category))return 'Give one unfamiliar cabinet a try. Watch a round before you play, set a small spending limit, and find out what makes you want another turn.';
 if(/toy|hobby|comic|game store|collectible/i.test(category))return 'Find one object that brings back a specific memory, then one you have never seen before. Compare what draws you to each. Ask about stock rather than assuming a particular release is here.';
 if(/jazz|music|concert|livehouse|nightclub/i.test(category))return 'Check today’s programme before entering. If a show or listening session fits, stay for a set and write down one artist you want to hear again. Weekly opening hours alone do not confirm a performance.';
 if(/bar|lounge/i.test(category))return 'If the room is serving, take a seat and give the place your attention for a while. If music is playing, catch one track name. Ask before assuming there is a listening session or a live act.';
 if(/cafe|coffee|tea|kissaten/i.test(category))return index===0?'Start with a drink you actually want. Put your phone away for ten minutes. Notice one detail in the room you would usually walk past. The route can wait until you finish.':index===1?'Pause over a drink and compare this room with the first stop. Pick one detail worth keeping, whether it is a colour, a sound or a conversation.':'Finish with a drink and choose your one find of the afternoon. Save the name of an artist, object or place you want to follow next.';
 return 'Go in with one small question. Ask the staff what is worth spending time with today, then follow the answer if it interests you. Check entry requirements first.';
}
export function composeQuest(plan:ScoutPlan,seed:Pick<CulturalPick,'id'|'name'|'type'>):Quest{
 const cats=plan.stops.map(s=>s.item.category),has=(r:RegExp)=>cats.some(c=>r.test(c));
 let title='An afternoon off the main road';
 if(cats.length&&cats.every(c=>/cafe|coffee|tea|kissaten/i.test(c)))title='Take the long coffee break';
 else if(cats.length&&cats.every(c=>/museum|gallery|art center/i.test(c)))title='Look a little longer';
 else if(has(/record|cd store/i)&&has(/cafe|coffee|bar/i))title='A record to take into the afternoon';
 else if(has(/toy|hobby|comic|arcade|game store/i))title='Something you remember. Something you don’t.';
 else if(has(/gallery|museum|book/i)&&has(/cafe|coffee/i))title='A page, a picture, a pause';
 else if(has(/music|jazz|concert/i))title='Follow a new name';
 const invitation=plan.stops.length?`Start with ${seed.name}. Let it lead somewhere you haven’t chosen yet. This is a small afternoon: ${plan.stops.length} stops, time to stay, and a walk between them.`:plan.brief;
 if(seed.type==='artist'&&plan.stops.length&&plan.stops.every(s=>/\bShibuya\b/i.test(s.item.location)))title='Shibuya, off the usual track';
 return {...plan,title,vibe:'Slow browsing. Short walks. Leave room for a detour.',invitation,seed:{id:seed.id,name:seed.name,type:seed.type},stops:plan.stops.map((s,i)=>{let mission=missionFor(s.item.category,i);if(seed.type==='artist'&&/record|cd store/i.test(s.item.category))mission=`Ask the staff what they would play after ${seed.name}. Find one sleeve that makes you stop, and try a listening station if one is available. Leave with a new name, whether or not you buy anything.`;else if(seed.type==='artist'&&/gallery|museum|art center/i.test(s.item.category))mission=i===2?`If there is a public exhibition, find something that feels different from the previous stop. Keep one image or artist’s name for later. You started with ${seed.name}; this is your chance to leave with another name. Check the programme and admission first.`:`If a public exhibition is running, pick one work and spend five minutes with it. Look for a rhythm, texture or mood that brings ${seed.name} to mind. That connection is yours to make. Check the current programme and admission first.`;else if(['movie','tv_show'].includes(seed.type)&&/gallery|museum|art center/i.test(s.item.category))mission=`If a public exhibition is running, choose one image you could imagine as a frame in a film. Think about what drew you to ${seed.name}, then see whether that image shares anything with it. Check the current programme and admission first.`;return {...s,mission};})};
}
