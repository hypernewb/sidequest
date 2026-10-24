import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {qloo} from '@/lib/qloo';
import {questSeed,type QuestSeed} from '@/lib/quest-seeds';
import {composeQuest,resolveQuestSeed,questChoices} from '@/lib/quests';
import {tokyoDate,validVisitDate} from '@/lib/discovery';
import {scoutCurated} from '@/lib/curated-scout';
import {catalogForQuest} from '@/lib/catalog';
import {programmeFor} from '@/lib/quest-programmes';
import {QUEST_FOCUS,focusQuestion} from '@/lib/quest-focus';
import {eventLeads,eventFit} from '@/lib/quest-event-matching';
import {artistAffinities} from '@/lib/artist-matching';
import {reportRun,type RunEvent,type RunMessage,type RunHooks,type QuestReply} from '@/lib/quest-run';
const schema=z.object({seed:z.string().trim().min(2).max(80),choice:z.string().uuid().optional(),askFollowup:z.boolean().default(false),focus:z.enum(QUEST_FOCUS).default('any'),date:z.string().optional(),budget:z.enum(['any','1000','3000','10000']).default('any'),unknownPrice:z.boolean().default(true),exclude:z.array(z.string().max(800)).max(150).default([])});
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
  if(!seed){const message=candidates.length?'Which one did you mean?':'I could not find that name. Try the full artist, album or place name.';reportRun(hooks,'taste','blocked',message);return {choices:questChoices(data.seed,candidates).map(({id,name,type,description})=>({id,name,type,description:description.slice(0,110)})),message};}
  if(data.askFollowup)return {question:focusQuestion(seed),resolved:{id:seed.id,name:seed.name,type:seed.type}};
  const catalog=await catalogForQuest(message=>reportRun(hooks,'taste','running',message)).catch(()=>({items:[],refreshed:false,unavailable:true}));
  let records=catalog.items;
  const preferences={intent:'mix' as const,direction:'any',format:'places' as const,date:data.date||tokyoDate(),days:1 as const,budget:data.budget,unknownPrice:data.unknownPrice,seeds:[{id:seed.id,name:seed.name,type:seed.type,feeling:'love' as const}],exclude:data.exclude};
  if(records.some(o=>o.artists?.length)){reportRun(hooks,'taste','running','Qloo /v2/insights · checking resolved artists from the event catalog.');records=await artistAffinities(records,preferences,env.QLOO_API_KEY!);}
  const run=(exclude:string[])=>scoutCurated({...preferences,exclude},env.QLOO_API_KEY!,seed,new Date(),!data.date,hooks,{focus:data.focus,records});
  let plan=await run(data.exclude);
  if(data.budget!=='any')plan.notes.push('Matching official programmes were checked against your price limit before route selection.');
  reportRun(hooks,'synthesis','running','Composing the mission, timetable and sourced door notes.');
  const quest=composeQuest(plan,seed);
  if(catalog.unavailable){quest.catalogNote='Fresh event listings were unavailable. This is a venue visit plan, with no current event or release claimed.';}
  if(catalog.unavailable)quest.notes.push('No fresh event catalog was available for this dispatch. This route uses checked venues; it does not claim a current event or release.');
  for(const stop of quest.stops){const programme=programmeFor(stop.item,quest.date,records,new Date(),e=>eventFit(e,seed)?.score||0);if(!programme)continue;stop.programme={title:programme.englishTitle||programme.title,url:programme.url,start:programme.start!,end:programme.end||programme.start!,priceLabel:programme.priceLabel};stop.mission=programme.kind==='exhibition'?`Visit ${stop.programme.title}. Give one work five unhurried minutes. Notice what holds your attention before you read the label. Keep one image or artist's name for later.`:`The official calendar lists ${stop.programme.title}. `+stop.mission;}
  reportRun(hooks,'synthesis',quest.stops.length?'complete':'blocked',quest.stops.length?quest.stops.length===1?'One supported find. No complete walking route fit.':'Dossier ready. '+quest.stops.length+' stops, a return walk and venue sources.':'No complete route to write. Your seed is kept.');
  const leads=eventLeads(records,seed,{...preferences,date:quest.date},new Date()).filter(e=>!quest.stops.some(s=>s.programme?.url===e.url));
  if(!quest.stops.length){quest.notes.push(data.focus==='any'?'The current catalog could not support a complete walk for this seed.':'No checked walking route included the activity you chose. Try another direction or keep the seed without a direction.');}
  quest.run=[...events];return {quest,leads};
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
