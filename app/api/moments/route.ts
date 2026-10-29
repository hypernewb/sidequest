import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {catalogItems,catalogForQuest,refreshGlobalCatalog,state} from '@/lib/catalog';
import {hydrateInterests} from '@/lib/profile-matching';
import {enrichMomentTaste} from '@/lib/catalog-taste';
import {momentsContextSchema} from '@/lib/taste-profile';
import {preferenceSchema} from '@/lib/opportunities';
import {interestSeedSchema} from '@/lib/interest-strength';
import {selectMoments} from '@/lib/moments';
import {tokyoDate} from '@/lib/discovery';
import {scoutOfficialTaste} from '@/lib/taste-scout';
import {candidatePercentiles} from '@/lib/qloo-candidates';
import {withEventLocation} from '@/lib/event-locations';
const schema=z.object({seeds:z.array(interestSeedSchema.omit({taste:true})).max(8).default([]),access:z.enum(['all','online','tokyo']).optional(),category:z.enum(['all','events','drops']).default('all'),sort:z.enum(['for-you','ending']).default('for-you'),context:momentsContextSchema.optional(),avoid:z.array(z.string().max(60)).max(20).default([]),cachedOnly:z.boolean().default(false)});
async function within<T>(job:Promise<T>,ms:number,fallback:T){let timer:ReturnType<typeof setTimeout>;try{return await Promise.race([job,new Promise<T>(resolve=>{timer=setTimeout(()=>resolve(fallback),ms);})]);}catch{return fallback;}finally{clearTimeout(timer!);}}
export async function POST(req:Request){
 const headers={'Cache-Control':'private, no-store'};
 if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Open SideQuest to discover events.'},{status:403,headers});
 let input:z.infer<typeof schema>;try{const raw=await req.text();if(raw.length>40000)throw Error();input=schema.parse(JSON.parse(raw));}catch{return Response.json({error:'Check your discovery choices.'},{status:400,headers});}
 try{
  const stored=await catalogItems();
  // Browsing checked snapshots must not wait for the whole city refresh. The
  // scheduled updater owns normal repair; empty reads have a bounded fallback.
  const [catalog,global]=await Promise.allSettled([stored.length||input.cachedOnly?Promise.resolve({items:stored}):within(catalogForQuest(),8000,{items:stored,refreshed:false,unavailable:stored.length===0}),stored.some(o=>o.id.startsWith('global:'))||input.cachedOnly?Promise.resolve({items:[] as typeof stored,health:(await state('lastGlobal'))?.health||[]}):within(refreshGlobalCatalog(),8000,{items:[],health:[]})]);
  const local=catalog.status==='fulfilled'?catalog.value.items:[],world=global.status==='fulfilled'?global.value.items:[];
  const all=[...new Map([...local,...world].map(o=>[o.id,o])).values()].map(withEventLocation);
  let p=preferenceSchema.parse({intent:'mix',direction:'any',format:'dated',date:tokyoDate(),days:30,budget:'any',unknownPrice:input.context?.unknownPrice??true,seeds:input.seeds,exclude:(input.context?.reactions||[]).filter(r=>['pass','too-expensive','wrong-place'].includes(r.action)||r.action==='seen'&&r.reason==='seen').map(r=>r.id),avoid:input.avoid});
  let tasteAvailable=!!env.QLOO_API_KEY;
  if(env.QLOO_API_KEY&&!input.cachedOnly)try{p.seeds=await within(hydrateInterests(p.seeds,env.QLOO_API_KEY,k=>state(k),async(k,v)=>{await state(k,v);}),3500,p.seeds);}catch{tasteAvailable=false;}
  const access=input.access??input.context?.access??'all',budget=input.context?.budget;
  const eligible=selectMoments(all,p,access,input.category,input.sort,new Date(),input.context).filter(o=>budget===undefined||(o.price===null?p.unknownPrice:o.price<=budget));
  const taste=env.QLOO_API_KEY&&tasteAvailable&&!input.cachedOnly?await enrichMomentTaste(eligible,p,env.QLOO_API_KEY,k=>state(k),async(k,v)=>{await state(k,v);},input.context,undefined,all):null;
  const scout=input.cachedOnly?null:await scoutOfficialTaste(taste?.scouting||[],p,input.context,k=>state(k),async(k,v)=>{await state(k,v);});
  const combined=[...new Map([...(scout?.items||[]),...(taste?.items||eligible)].map(o=>[o.id,o])).values()];
  const evidence=candidatePercentiles([...new Map(combined.flatMap(o=>o.qlooEvidence||[]).map(e=>[e.entityId.toLowerCase(),e])).values()]);
  const withEvidence=combined.map(o=>({...o,qlooEvidence:(o.qlooEvidence||[]).map(e=>evidence.find(v=>v.entityId.toLowerCase()===e.entityId.toLowerCase())||e)}));
  const items=selectMoments(withEvidence,p,access,input.category,input.sort,new Date(),input.context).filter(o=>budget===undefined||(o.price===null?p.unknownPrice:o.price<=budget));
  return Response.json({items:items.slice(0,1000),total:items.length,seeds:p.seeds,checkedAt:new Date().toISOString(),tasteAvailable,qloo:taste?.diagnostics||{status:input.cachedOnly?'cached-only':'unavailable',catalogItems:eligible.length,mappedItems:0,scoredEntities:0,notes:input.cachedOnly?'Interview uses checked catalog snapshots and your explicit choices. No live Qloo ranking was requested.':undefined},catalogMode:stored.length?'stored':'bounded-refresh',scout:scout?.health||{status:'skipped'},scouting:taste?.scouting||[],health:global.status==='fulfilled'?global.value.health:[],scope:'Official in-person events plus online events and timed shop windows. Taste associations rank qualified announcements; source evidence alone establishes dates and availability. The optional taste scout reads at most one supported official calendar and adds only named, dated matches. Research links remain unverified searches. Tokyo-only and online-only filters are available. Online access and shipping eligibility depend on the organiser or shop. No popularity or hype score is inferred.'},{headers});
 }catch{return Response.json({error:'Discovery could not finish. Try again.'},{status:502,headers});}
}
