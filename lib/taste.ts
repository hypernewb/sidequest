import {z} from 'zod';
import {tasteContextSchema} from './taste-context.ts';
import {explorationSchema} from './taste-exploration.ts';
export const TOPICS=[
 {id:'digimon',name:'Digimon',prompt:'A digital companion, a tiny screen, a whole adventure.',query:'Digimon',aliases:['Digimon','Digimon Adventure']},
 {id:'pokemon',name:'Pokémon',prompt:'Starter choices, trading cards and a world to explore.',query:'Pokémon',aliases:['Pokémon','Pokemon']},
 {id:'tamagotchi',name:'Tamagotchi',prompt:'A pocket-sized creature that needs a little care.',query:'Tamagotchi',aliases:['Tamagotchi']},
 {id:'nintendo',name:'Nintendo',prompt:'Cartridges, familiar soundtracks and one more level.',query:'Nintendo',aliases:['Nintendo']},
 {id:'gundam',name:'Gundam',prompt:'Mecha worlds, model kits and the pleasure of building.',query:'Gundam',aliases:['Gundam','Mobile Suit Gundam']},
 {id:'sanrio',name:'Sanrio',prompt:'Familiar characters, little gifts and everyday joy.',query:'Sanrio',aliases:['Sanrio']},
 {id:'attack-on-titan',name:'Attack on Titan',prompt:'An expansive anime world, its characters and its music.',query:'Attack on Titan',aliases:['Attack on Titan']},
 {id:'ghibli',name:'Studio Ghibli',prompt:'Hand-drawn worlds and the wonder in everyday things.',query:'Spirited Away',aliases:['Spirited Away']},
] as const;
export type TopicId=typeof TOPICS[number]['id'];
export const ANSWERS=['love','curious','pass','unknown'] as const;
export const ENJOYMENTS=['collect','play','watch','visit'] as const;
export type Answer=typeof ANSWERS[number];
export type Enjoyment=typeof ENJOYMENTS[number];
const topicIds=TOPICS.map(t=>t.id) as [TopicId,...TopicId[]];
export const tasteSchema=z.object({version:z.literal(1),answers:z.record(z.enum(topicIds),z.enum(ANSWERS)),enjoyments:z.array(z.enum(ENJOYMENTS)).max(4),exploration:explorationSchema.optional(),discovery:tasteContextSchema.optional()});
export type TasteProfile=z.infer<typeof tasteSchema>;
export const EMPTY_TASTE:TasteProfile={version:1,answers:{},enjoyments:[]};
export function selectedTopics(profile:TasteProfile){return TOPICS.filter(t=>profile.answers[t.id]==='love'||profile.answers[t.id]==='curious');}
export function topicName(id:string){return TOPICS.find(t=>t.id===id)?.name||id;}
export function normalizeName(name:string){return name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');}
export function qlooAnchors(topic:typeof TOPICS[number],data:unknown){
 const exact=new Set(topic.aliases.map(normalizeName));
 const response=z.object({results:z.array(z.unknown())}).safeParse(data);if(!response.success)return [];
 const schema=z.object({entity_id:z.string().uuid(),name:z.string().min(1),types:z.array(z.string())});
 return response.data.results.map(e=>schema.safeParse(e)).filter(e=>e.success).map(e=>e.data!).filter(e=>exact.has(normalizeName(e.name))&&e.types.some(type=>/^urn:entity:(brand|movie|tv_show|video_game)$/.test(type))).slice(0,3).map(e=>({id:e.entity_id,name:e.name,type:e.types.find(type=>/^urn:entity:(brand|movie|tv_show|video_game)$/.test(type))!.split(':').pop()!}));
}

