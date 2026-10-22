import {env} from 'cloudflare:workers';
import {qloo} from '@/lib/qloo';
import {culturalEntity,exploreRequest,unseen,type CulturalPick} from '@/lib/taste-exploration';
export async function POST(req:Request){
 const headers={'Cache-Control':'private, no-store'};
 if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Open SideQuest to explore your taste.'},{status:403,headers});
 let input;try{const body=await req.text();if(body.length>12000)throw Error();input=exploreRequest.parse(JSON.parse(body));}catch{return Response.json({error:'Choose up to eight interests and try again.'},{status:400,headers});}
 if(!env.QLOO_API_KEY)return Response.json({error:'Qloo exploration is unavailable. Your choices are still here.'},{status:503,headers});
 const key=env.QLOO_API_KEY;
 const branches=input.branch==='mix'?['movie','artist','videogame']: [input.branch];
 const results=await Promise.allSettled(branches.map(async branch=>{const b=await qloo('/v2/insights',{'filter.type':'urn:entity:'+branch,'signal.interests.entities':input.ids.join(','),...(input.theme?{'signal.interests.tags':input.theme.id}:{}),take:'16','feature.explainability':'true'},key);const entities=(b.results as {entities?:unknown[]})?.entities;if(!Array.isArray(entities))throw Error('Qloo returned an unexpected response.');return entities.map(culturalEntity).filter((e):e is CulturalPick=>!!e);}));
 const good=results.filter((r):r is PromiseFulfilledResult<CulturalPick[]>=>r.status==='fulfilled');
 if(!good.length)return Response.json({error:'Qloo could not explore this direction. Try again or choose another world.'},{status:502,headers});
 const lists=good.map(r=>r.value),interleaved=Array.from({length:16},(_,i)=>lists.flatMap(list=>list[i]?[list[i]]:[])).flat();
 return Response.json({items:unseen(interleaved,[...input.ids,...input.exclude]).slice(0,6),partial:good.length<results.length,retrievedAt:new Date().toISOString(),provider:'qloo'},{headers});
}

