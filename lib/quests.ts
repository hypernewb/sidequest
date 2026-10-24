import type {ScoutPlan,ScoutStop} from './scout.ts';
import type {QuestSeed} from './quest-seeds.ts';
export type Quest=Omit<ScoutPlan,'stops'> & {title:string;vibe:string;invitation:string;stops:(ScoutStop & {mission:string;programme?:{title:string;url:string;start:string;end:string;priceLabel:string}})[];catalogNote?:string;run?:import('./quest-run.ts').RunEvent[];seed:{id:string;name:string;type:string}};
const normalized=(v:string)=>v.normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
export function questChoices<T extends Pick<QuestSeed,'name'>>(query:string,candidates:T[]){const exact=candidates.filter(c=>normalized(c.name)===normalized(query));return (exact.length?exact:candidates).slice(0,4);}
export function resolveQuestSeed<T extends Pick<QuestSeed,'id'|'name'|'type'>>(query:string,candidates:T[],choice?:string){
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
export function composeQuest(plan:ScoutPlan,seed:Pick<QuestSeed,'id'|'name'|'type'>):Quest{
 const stops=plan.stops.map((s,i)=>({...s,mission:s.item.curation?.mission||missionFor(s.item.category,i)}));
 const area=stops[0]?.item.curation?.area||'Tokyo',roles=stops.map(s=>s.item.curation?.role),has=(r:string)=>roles.includes(r as any);
 let title=area+', one shelf over';
 if(has('dig')&&has('listen'))title=area+', from sleeve to sound';
 else if(has('books')&&has('art'))title=area+', between the page and the wall';
 else if(has('play'))title=area+', one more credit';
 else if(has('listen'))title=area+', leave with a new name';
 else if(has('art'))title=area+', look twice';
 if(stops.length===1)title=stops[0].item.title;
 const acts:Record<string,string>={coffee:'a coffee to start',books:'a book outside your usual shelf',dig:'an unfamiliar sleeve',art:'a closer look at a small gallery',listen:'a room where the selection sets the pace',play:'a turn outside your usual games'};
 const arc=roles.map(r=>acts[r||'']||'one small discovery').join(', then ');
 return {...plan,title,vibe:plan.stops.length===1?'One place worth a closer look. Take your time here.':plan.stops.length?plan.walkingMinutes+' minutes on foot. '+stops.length+' stops. One loop.':'',invitation:stops.length?'You brought '+seed.name+'. The route gives you '+arc+'. Keep one name from each stop and see which one follows you home.':plan.brief,stops,seed:{id:seed.id,name:seed.name,type:seed.type}};
}
