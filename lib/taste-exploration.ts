import {z} from 'zod';
export const BRANCHES={mix:'Across worlds',movie:'Films',artist:'Music',videogame:'Games',book:'Books'} as const;
export type Branch=keyof typeof BRANCHES;
export const themeSchema=z.object({id:z.string().regex(/^urn:tag:[a-z0-9_:.-]+$/i).max(180),name:z.string().min(1).max(100)});
export const culturalSchema=z.object({id:z.string().uuid(),name:z.string().min(1).max(200),type:z.enum(['artist','movie','tv_show','book','brand','podcast','videogame','video_game']),description:z.string().max(600).default(''),themes:z.array(themeSchema).max(6).default([]),connections:z.array(z.string().uuid()).max(8).default([])});
export type CulturalPick=z.infer<typeof culturalSchema>;
export const explorationSchema=z.object({picks:z.array(culturalSchema.extend({feeling:z.enum(['love','curious'])})).max(8),skipped:z.array(z.string().uuid()).max(80)});
export type Exploration=z.infer<typeof explorationSchema>;
export const EMPTY_EXPLORATION:Exploration={picks:[],skipped:[]};
export const exploreRequest=z.object({ids:z.array(z.string().uuid()).min(1).max(8),exclude:z.array(z.string().uuid()).max(88).default([]),branch:z.enum(['mix','movie','artist','videogame','book']).default('mix'),theme:themeSchema.optional()});
const category=/^urn:entity:(artist|movie|tv_show|book|brand|podcast|videogame|video_game)$/;
const allowedTheme=/^urn:tag:(genre|subgenre|style|art_style|emotional_tone|gameplay_type|music)(:|_)/;
const themeRank=(id:string)=>id.includes(':emotional_tone:')?0:id.includes(':genre:')?1:id.includes(':gameplay_type:')?2:3;
export function culturalEntity(value:unknown):CulturalPick|null {
 if(!value||typeof value!=='object')return null;
 const e=value as Record<string,any>,p=e.properties||{};
 const type=[e.subtype,...(Array.isArray(e.types)?e.types:[])].find(t=>typeof t==='string'&&category.test(t))?.split(':').pop();
 const short=Array.isArray(p.short_descriptions)?p.short_descriptions.find((s:any)=>Array.isArray(s.languages)&&s.languages.includes('en')&&typeof s.value==='string')?.value:null;
 const description=short||p.short_description||p.description||'';
 const themes=(Array.isArray(e.tags)?e.tags:[]).filter((t:any)=>typeof t.id==='string'&&allowedTheme.test(t.id)&&typeof t.name==='string').map((t:any)=>({id:t.id,name:t.name})).sort((a:any,b:any)=>themeRank(a.id)-themeRank(b.id)).filter((t:any,i:number,a:any[])=>a.findIndex(x=>x.name.toLowerCase()===t.name.toLowerCase())===i).slice(0,6);
 const connections=(e.query?.explainability?.['signal.interests.entities']||[]).filter((c:any)=>Number.isFinite(c.score)&&c.score>0).map((c:any)=>c.entity_id).slice(0,8);
 const parsed=culturalSchema.safeParse({id:e.entity_id,name:e.name,type,description:typeof description==='string'?description.replace(/<[^>]*>/g,'').slice(0,600):'',themes,connections});
 return parsed.success?parsed.data:null;
}
export function unseen(items:CulturalPick[],exclude:string[]){const seen=new Set(exclude.map(x=>x.toUpperCase()));return items.filter(e=>{const id=e.id.toUpperCase();if(seen.has(id))return false;seen.add(id);return true;});}
export function commonThreads(picks:CulturalPick[]){const counts=new Map<string,{name:string;ids:string[]}>();for(const p of picks)for(const t of p.themes){const k=t.name.toLowerCase();const v=counts.get(k)||{name:t.name,ids:[]};if(!v.ids.includes(p.id))v.ids.push(p.id);counts.set(k,v);}return [...counts.values()].filter(v=>v.ids.length>1).sort((a,b)=>b.ids.length-a.ids.length).slice(0,3);}
