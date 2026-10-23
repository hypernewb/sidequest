import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {qloo} from '@/lib/qloo';
import {culturalEntity,type CulturalPick} from '@/lib/taste-exploration';
import {composeQuest,resolveQuestSeed} from '@/lib/quests';
import {tokyoDate,validVisitDate} from '@/lib/discovery';
import {POST as scout} from '@/app/api/scout/route';
import type {ScoutPlan} from '@/lib/scout';
import {catalogItems} from '@/lib/catalog';
import {programmeFor} from '@/lib/quest-programmes';
const schema=z.object({seed:z.string().trim().min(2).max(80),choice:z.string().uuid().optional(),date:z.string().optional(),budget:z.enum(['any','1000','3000','10000']).default('any'),unknownPrice:z.boolean().default(true),exclude:z.array(z.string().max(800)).max(150).default([])});
export async function POST(req:Request){
 const headers={'Cache-Control':'private, no-store'};
 if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Start your quest in SideQuest.'},{status:403,headers});
 let data;try{const raw=await req.text();if(raw.length>24000)throw Error();data=schema.parse(JSON.parse(raw));if(data.date&&!validVisitDate(data.date))throw Error();}catch{return Response.json({error:'Give me one artist, film, game or brand you like.'},{status:400,headers});}
 if(!env.QLOO_API_KEY)return Response.json({error:'The taste connection is unavailable. Try again shortly.'},{status:503,headers});
 try{const b=await qloo('/search',{query:data.seed,take:'8'},env.QLOO_API_KEY);const candidates=(Array.isArray(b.results)?b.results:[]).map(culturalEntity).filter((c):c is CulturalPick=>!!c);const seed=resolveQuestSeed(data.seed,candidates,data.choice);
  if(!seed)return Response.json({choices:candidates.map(({id,name,type})=>({id,name,type})),message:candidates.length?'Which one did you mean?':'I could not find that name. Try the full artist, film, game or brand name.'},{headers});
  const run=(exclude:string[])=>scout(new Request(new URL('/api/scout',req.url),{method:'POST',headers:{'Content-Type':'application/json',Origin:new URL(req.url).origin},body:JSON.stringify({intent:'mix',direction:'any',format:'places',date:data.date||tokyoDate(),days:1,budget:data.budget,unknownPrice:data.unknownPrice,seeds:[{id:seed.id,name:seed.name,type:seed.type,feeling:'love'}],exclude})}));
  const response=await run(data.exclude);let plan=await response.json() as ScoutPlan & {error?:string};if(!response.ok)return Response.json({error:plan.error},{status:response.status,headers});
  const records=await catalogItems().catch(()=>[]);
  const overBudget=(p:ScoutPlan)=>p.stops.filter(s=>{const e=programmeFor(s.item,p.date,records);return data.budget!=='any'&&e?.price!=null&&e.price>Number(data.budget);}).map(s=>s.item.id);
  const blocked=overBudget(plan);if(blocked.length){const retry=await run([...new Set([...data.exclude,...blocked])].slice(-150));if(retry.ok)plan=await retry.json() as ScoutPlan;if(!retry.ok||overBudget(plan).length)plan={...plan,stops:[],map:null,brief:'The official programmes I found exceed your price limit. Try another seed or change the limit.'};plan.notes.push('The scout checked matching official programmes against your price limit and retried the route without expensive stops.');}
  const quest=composeQuest(plan,seed);
  for(const stop of quest.stops){const programme=programmeFor(stop.item,quest.date,records);if(!programme)continue;stop.programme={title:programme.englishTitle||programme.title,url:programme.url,start:programme.start!,end:programme.end||programme.start!,priceLabel:programme.priceLabel};stop.mission=programme.kind==='exhibition'?`Visit ${stop.programme.title}. Give one work five unhurried minutes. `+(seed.type==='artist'?`Look for a rhythm, texture or mood that brings ${seed.name} to mind. Keep one image or artist’s name for later.`:'Notice what holds your attention before you read the label. Keep one image or artist’s name for later.'):`The official calendar lists ${stop.programme.title}. `+stop.mission;}
  return Response.json({quest},{headers});
 }catch{return Response.json({error:'I could not finish checking this quest. Your seed is still here. Try again.'},{status:502,headers});}
}
