import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {qloo} from '@/lib/qloo';
import {questSeed,type QuestSeed} from '@/lib/quest-seeds';
import {composeQuest,resolveQuestSeed} from '@/lib/quests';
import {tokyoDate,validVisitDate} from '@/lib/discovery';
import {scoutCurated} from '@/lib/curated-scout';
import type {ScoutPlan} from '@/lib/scout';
import {catalogItems} from '@/lib/catalog';
import {programmeFor} from '@/lib/quest-programmes';
import {reportRun,type RunEvent,type RunMessage,type RunHooks,type QuestReply} from '@/lib/quest-run';
const schema=z.object({seed:z.string().trim().min(2).max(80),choice:z.string().uuid().optional(),date:z.string().optional(),budget:z.enum(['any','1000','3000','10000']).default('any'),unknownPrice:z.boolean().default(true),exclude:z.array(z.string().max(800)).max(150).default([])});
export async function POST(req:Request){
 const headers={'Cache-Control':'private, no-store'};
 if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Start your quest in SideQuest.'},{status:403,headers});
 let data:z.infer<typeof schema>;try{const raw=await req.text();if(raw.length>24000)throw Error();data=schema.parse(JSON.parse(raw));if(data.date&&!validVisitDate(data.date))throw Error();}catch{return Response.json({error:'Give me one artist, album or place you like.'},{status:400,headers});}
 if(!env.QLOO_API_KEY)return Response.json({error:'The taste connection is unavailable. Try again shortly.'},{status:503,headers});
 const events:RunEvent[]=[],abort=new AbortController(),signal=AbortSignal.any([req.signal,abort.signal]);
 async function execute(report?:(event:RunEvent)=>void):Promise<QuestReply>{
 const hooks:RunHooks={signal,report:event=>{events.push(event);report?.(event);}};
 reportRun(hooks,'taste','running','Qloo /search · resolving '+data.seed+'.');
 const b=await qloo('/search',{query:data.seed,take:'8'},env.QLOO_API_KEY!,signal);const candidates=(Array.isArray(b.results)?b.results:[]).map(questSeed).filter((c):c is QuestSeed=>!!c);const seed=resolveQuestSeed(data.seed,candidates,data.choice);
  if(!seed){const message=candidates.length?'Which one did you mean?':'I could not find that name. Try the full artist, album or place name.';reportRun(hooks,'taste','blocked',message);return {choices:candidates.map(({id,name,type,description})=>({id,name,type,description})),message};}
  const run=(exclude:string[])=>scoutCurated({intent:'mix',direction:'any',format:'places',date:data.date||tokyoDate(),days:1,budget:data.budget,unknownPrice:data.unknownPrice,seeds:[{id:seed.id,name:seed.name,type:seed.type,feeling:'love'}],exclude},env.QLOO_API_KEY!,seed,new Date(),!data.date,hooks);
  let plan=await run(data.exclude);
  const records=await catalogItems().catch(()=>[]);
  const overBudget=(p:ScoutPlan)=>p.stops.filter(s=>{const e=programmeFor(s.item,p.date,records);return data.budget!=='any'&&e?.price!=null&&e.price>Number(data.budget);}).map(s=>s.item.id);
  const blocked=overBudget(plan);if(blocked.length){reportRun(hooks,'operations','running','An official programme exceeds your price limit. Excluding it and replanning.');plan=await run([...new Set([...data.exclude,...blocked])].slice(-150));if(overBudget(plan).length)plan={...plan,stops:[],map:null,brief:'The official programmes I found exceed your price limit. Try another seed or change the limit.'};plan.notes.push('The scout checked matching official programmes against your price limit and retried the route without expensive stops.');}
  reportRun(hooks,'synthesis','running','Composing the mission, timetable and sourced door notes.');
  const quest=composeQuest(plan,seed);
  for(const stop of quest.stops){const programme=programmeFor(stop.item,quest.date,records);if(!programme)continue;stop.programme={title:programme.englishTitle||programme.title,url:programme.url,start:programme.start!,end:programme.end||programme.start!,priceLabel:programme.priceLabel};stop.mission=programme.kind==='exhibition'?`Visit ${stop.programme.title}. Give one work five unhurried minutes. `+(seed.type==='artist'?`Look for a rhythm, texture or mood that brings ${seed.name} to mind. Keep one image or artist’s name for later.`:'Notice what holds your attention before you read the label. Keep one image or artist’s name for later.'):`The official calendar lists ${stop.programme.title}. `+stop.mission;}
  reportRun(hooks,'synthesis',quest.stops.length?'complete':'blocked',quest.stops.length?'Dossier ready. Three stops, a return walk and venue sources.':'No complete route to write. Your seed is kept.');
  quest.run=[...events];return {quest};
 }
 const failure='I could not finish checking this quest. Your seed is still here. Try again.';
 if(req.headers.get('accept')?.includes('application/x-ndjson')){
  const encoder=new TextEncoder();let closed=false;
  const stream=new ReadableStream<Uint8Array>({start(controller){const send=(m:RunMessage)=>{if(!closed&&!signal.aborted)controller.enqueue(encoder.encode(JSON.stringify(m)+'\n'));};
   void execute(send).then(data=>send({type:'result',data})).catch(()=>{if(signal.aborted)return;const stage=events.at(-1)?.stage||'taste';send({type:'stage',stage,status:'failed',detail:failure,at:new Date().toISOString()});send({type:'error',error:failure});}).finally(()=>{if(!closed){closed=true;controller.close();}});
  },cancel(){closed=true;abort.abort();}});
  return new Response(stream,{headers:{...headers,'Cache-Control':'private, no-store, no-transform','X-Accel-Buffering':'no','Content-Type':'application/x-ndjson; charset=utf-8','X-Content-Type-Options':'nosniff'}});
 }
 try{return Response.json(await execute(),{headers});}catch{return Response.json({error:failure},{status:502,headers});}
}
