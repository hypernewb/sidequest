import {z} from 'zod';

export const interestSeedSchema=z.object({
 id:z.string().uuid(),name:z.string().min(1).max(100),type:z.string().max(40),
 feeling:z.enum(['love','curious']).default('love'),
 weight:z.number().min(-1).max(1).optional(),
 taste:z.array(z.object({name:z.string().max(100),weight:z.number().min(0).max(1).default(1)})).max(32).optional()
});
export type WeightedInterest=z.infer<typeof interestSeedSchema>;
export const STRENGTHS=[
 {weight:-1,label:'Avoid',note:'Hide listings naming this artist, work or franchise.'},
 {weight:0,label:'Not using',note:'Keep the name here without using it for recommendations.'},
 {weight:.4,label:'Curious',note:'A light nudge toward something you want to explore.'},
 {weight:.65,label:'Like',note:'A regular interest, with more influence than Curious.'},
 {weight:1,label:'Love',note:'A favourite. Give its connections the most influence.'}
] as const;
export function interestWeight(seed:{weight?:number;feeling?:string}){return typeof seed.weight==='number'&&Number.isFinite(seed.weight)?Math.max(-1,Math.min(1,seed.weight)):seed.feeling==='curious'?.4:1;}
export function strengthLabel(seed:{weight?:number;feeling?:string}){const w=interestWeight(seed);return w<0?'Avoid':w===0?'Not using':w<.55?'Curious':w<.85?'Like':'Love';}
export function interestSummary(seeds:{name:string;weight?:number;feeling?:string}[]){return seeds.map(s=>s.name+' ('+strengthLabel(s).toLowerCase()+')').join(', ');}
