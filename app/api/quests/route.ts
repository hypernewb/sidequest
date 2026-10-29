import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {tokyoDate,validVisitDate} from '@/lib/discovery';
import {scoutCurated} from '@/lib/curated-scout';
import {catalogItems} from '@/lib/catalog';
import {QUEST_FOCUS,focusQuestion} from '@/lib/quest-focus';
import {reportRun,type RunEvent,type RunMessage,type RunHooks,type QuestReply} from '@/lib/quest-run';
import {toolResolveEntity,toolSynthesizeQuest} from '@/lib/agent-tools';
import {venueById} from '@/lib/curated-venues';
import {momentsContextSchema} from '@/lib/taste-profile';

const schema=z.object({seed:z.string().trim().min(2).max(80),choice:z.string().uuid().optional(),taste:momentsContextSchema.optional(),askFollowup:z.boolean().default(false),focus:z.enum(QUEST_FOCUS).default('any'),date:z.string().optional(),budget:z.enum(['any','1000','3000','10000']).default('any'),unknownPrice:z.boolean().default(true),exclude:z.array(z.string().max(800)).max(150).default([]),reportedClosed:z.array(z.string().uuid().transform(id=>id.toUpperCase()).refine(id=>venueById.has(id))).max(12).default([])});

export async function POST(req:Request){
 const headers={'Cache-Control':'private, no-store'};
 if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Start your quest in SideQuest.'},{status:403,headers});
 let data:z.infer<typeof schema>;try{const raw=await req.text();if(raw.length>100000)throw Error();data=schema.parse(JSON.parse(raw));if(data.date&&!validVisitDate(data.date))throw Error();}catch{return Response.json({error:'Give me one artist, album or place you like.'},{status:400,headers});}
 if(!env.QLOO_API_KEY)return Response.json({error:'The taste connection is unavailable. Try again shortly.'},{status:503,headers});
 const events:RunEvent[]=[],abort=new AbortController(),signal=AbortSignal.any([req.signal,abort.signal]);
 async function execute(report?:(event:RunEvent)=>void):Promise<QuestReply>{
  const hooks:RunHooks={signal,report:event=>{events.push(event);report?.(event);}};
  const resolve=await toolResolveEntity({query:data.seed,choice:data.choice,apiKey:env.QLOO_API_KEY!,signal,hooks});
  if(!resolve.seed)return {choices:resolve.choices,message:resolve.message};
  const seed=resolve.seed;
  if(data.askFollowup)return {question:focusQuestion(seed),resolved:{id:seed.id,name:seed.name,type:seed.type}};
  // The scheduled catalog owns refresh and artist reconciliation. A walking
  // request reads its snapshot instead of waiting for a city-wide source crawl.
  const records=await catalogItems().catch(()=>[]);
  const catalog={unavailable:records.length===0};
  if(!records.length)reportRun(hooks,'taste','running','No dated catalog snapshot is available. Planning from curated places; current event leads may be missing.');
  const preferences={intent:'mix' as const,direction:'any',format:'places' as const,date:data.date||tokyoDate(),days:1 as const,budget:data.budget,unknownPrice:data.unknownPrice,seeds:[{id:seed.id,name:seed.name,type:seed.type,feeling:'love' as const}],exclude:data.exclude};
  const run=(exclude:string[])=>scoutCurated({...preferences,exclude},env.QLOO_API_KEY!,seed,new Date(),!data.date,hooks,{focus:data.focus,records,reportedClosed:data.reportedClosed,taste:data.taste});
  const plan=await run([...new Set([...data.exclude,...data.reportedClosed])]);
  return toolSynthesizeQuest({plan,seed,records,unavailableCatalog:catalog.unavailable,budget:data.budget,focus:data.focus,preferences,events,hooks});
 }
 const failure='I could not finish checking this quest. Your seed is still here. Try again.';
 if(req.headers.get('accept')?.includes('application/x-ndjson')){
  const encoder=new TextEncoder();let closed=false;
  const stream=new ReadableStream<Uint8Array>({start(controller){const send=(m:RunMessage)=>{if(!closed&&!signal.aborted)controller.enqueue(encoder.encode(JSON.stringify(m)+'\n'));};
   void execute(send).then(data=>send({type:'result',data})).catch(()=>{if(signal.aborted)return;const stage=events.at(-1)?.stage||'resolve';send({type:'stage',stage,status:'failed',detail:failure,at:new Date().toISOString()});send({type:'error',error:failure});}).finally(()=>{if(!closed){closed=true;controller.close();}});
  },cancel(){closed=true;abort.abort();}});
  return new Response(stream,{headers:{...headers,'Cache-Control':'private, no-store, no-transform','X-Accel-Buffering':'no','Content-Type':'application/x-ndjson; charset=utf-8','X-Content-Type-Options':'nosniff'}});
 }
 try{return Response.json(await execute(),{headers});}catch{return Response.json({error:failure},{status:502,headers});}
}
