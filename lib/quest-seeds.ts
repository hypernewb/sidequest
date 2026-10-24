import {z} from 'zod';
export type QuestSeed={id:string;name:string;type:string;description:string;tags:string[];taste?:{name:string;weight:number}[]};
const uuid=z.string().uuid();
export function questSeed(e:Record<string,any>):QuestSeed|null{
 const type=[e.subtype,...(Array.isArray(e.types)?e.types:[])].find(t=>/^urn:entity:(artist|album|place|movie|tv_show|book|brand|podcast|videogame|video_game)$/.test(t||''))?.split(':').pop();
 if(!type||!uuid.safeParse(e.entity_id).success||typeof e.name!=='string')return null;
 if(type==='album'&&!(e.tags||[]).some((t:any)=>/^urn:tag:genre:/.test(t.value||t.id||'')))return null;
 const p=e.properties||{},description=type==='place'?p.address:type==='album'?[p.release_date,(e.tags||[]).filter((t:any)=>t.type==='urn:tag:genre').slice(0,3).map((t:any)=>t.name).join(', ')].filter(Boolean).join(' · '):p.short_description||p.description||'';
 return {taste:(e.tags||[]).filter((t:any)=>/^urn:tag:(genre|music|style|art_style|keyword|theme|design|gameplay)/.test(t.type||t.id||'')).sort((a:any,b:any)=>Number(/^urn:tag:(genre|music|style|art_style|design|gameplay)/.test(b.type||b.id||''))-Number(/^urn:tag:(genre|music|style|art_style|design|gameplay)/.test(a.type||a.id||''))).slice(0,32).map((t:any)=>({name:t.name,weight:1})),id:e.entity_id.toUpperCase(),name:e.name,type,description:String(description||'').replace(/<[^>]*>/g,'').slice(0,240),tags:(e.tags||[]).map((t:any)=>t.value||t.id).filter((id:unknown)=>typeof id==='string'&&/^urn:tag:genre:/.test(id)).slice(0,5)};
}
