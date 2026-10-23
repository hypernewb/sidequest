import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {qloo} from '@/lib/qloo';
import {safeTasteTag} from '@/lib/taste-context';
const schema=z.object({ids:z.array(z.string().uuid()).min(1).max(8),tags:z.array(safeTasteTag).max(1).default([]),exclude:z.array(z.string().max(180)).max(12).default([])});
export async function POST(req:Request){
 const headers={'Cache-Control':'private, no-store'};
 if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Open SideQuest to answer these questions.'},{status:403,headers});
 let input;try{const body=await req.text();if(body.length>6000)throw Error();input=schema.parse(JSON.parse(body));}catch{return Response.json({error:'Choose an interest and try again.'},{status:400,headers});}
 if(!env.QLOO_API_KEY)return Response.json({error:'Qloo questions are unavailable. You can skip to your Tokyo activity.'},{status:503,headers});
 try{const b=await qloo('/v2/insights',{'filter.type':'urn:tag','signal.interests.entities':input.ids.join(','),'filter.tag.types':input.tags[0]?.id.includes(':music:')?'urn:tag:genre:media,urn:tag:gameplay_type:videogame':input.tags.length?'urn:tag:genre:music,urn:tag:gameplay_type:videogame':'urn:tag:genre:media,urn:tag:genre:music,urn:tag:gameplay_type:videogame',...(input.tags.length?{'signal.interests.tags':input.tags.map(t=>t.id).join(',')}:{}),take:'24'},env.QLOO_API_KEY);
 const raw=(b.results as {tags?:unknown[]})?.tags;if(!Array.isArray(raw))throw Error();
 const cluster=(name:string)=>/comic|graphic novel/i.test(name)?'comic-family':name.toLowerCase().replace(/[^a-z0-9]/g,'');const seen=new Set(input.exclude.map(x=>x.toLowerCase()));const clusters=new Set<string>();const choices=raw.flatMap(v=>{const t=v as {tag_id?:string;name?:string};const p=safeTasteTag.safeParse({id:t.tag_id,name:t.name});if(!p.success||seen.has(p.data.id.toLowerCase())||seen.has(p.data.name.toLowerCase())||clusters.has(cluster(p.data.name)))return [];clusters.add(cluster(p.data.name));seen.add(p.data.id.toLowerCase());seen.add(p.data.name.toLowerCase());return [p.data];}).slice(0,4);
 return Response.json({choices,provider:'qloo',retrievedAt:new Date().toISOString()},{headers});
 }catch{return Response.json({error:'Qloo could not load this question. Retry, or skip to your Tokyo activity.'},{status:502,headers});}
}
