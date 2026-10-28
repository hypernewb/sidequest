import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {catalogForQuest,refreshGlobalCatalog,state} from '@/lib/catalog';
import {hydrateInterests} from '@/lib/profile-matching';
import {artistAffinities} from '@/lib/artist-matching';
import {preferenceSchema} from '@/lib/opportunities';
import {selectMoments} from '@/lib/moments';
import {tokyoDate} from '@/lib/discovery';
const schema=z.object({seeds:z.array(z.object({id:z.string().uuid(),name:z.string().min(1).max(100),type:z.string().max(40),feeling:z.enum(['love','curious']).default('love')})).max(8).default([]),access:z.enum(['all','online','tokyo']).default('all'),category:z.enum(['all','events','drops']).default('all'),sort:z.enum(['for-you','ending']).default('for-you')});
export async function POST(req:Request){
 const headers={'Cache-Control':'private, no-store'};
 if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Open SideQuest to discover events.'},{status:403,headers});
 let input:z.infer<typeof schema>;try{const raw=await req.text();if(raw.length>6000)throw Error();input=schema.parse(JSON.parse(raw));}catch{return Response.json({error:'Check your discovery choices.'},{status:400,headers});}
 try{
  const [catalog,global]=await Promise.allSettled([catalogForQuest(),refreshGlobalCatalog()]);
  const local=catalog.status==='fulfilled'?catalog.value.items:[],world=global.status==='fulfilled'?global.value.items:[];
  const all=[...new Map([...local,...world].map(o=>[o.id,o])).values()];
  let p=preferenceSchema.parse({intent:'mix',direction:'any',format:'dated',date:tokyoDate(),days:30,budget:'any',unknownPrice:true,seeds:input.seeds,exclude:[]});
  let tasteAvailable=!!env.QLOO_API_KEY;
  if(env.QLOO_API_KEY)try{p.seeds=await hydrateInterests(p.seeds,env.QLOO_API_KEY,k=>state(k),async(k,v)=>{await state(k,v);});}catch{tasteAvailable=false;}
  const associated=env.QLOO_API_KEY&&tasteAvailable?await artistAffinities(all,p,env.QLOO_API_KEY):all;
  const items=selectMoments(associated,p,input.access,input.category,input.sort);
  return Response.json({items:items.slice(0,1000),total:items.length,seeds:p.seeds,checkedAt:new Date().toISOString(),tasteAvailable,health:global.status==='fulfilled'?global.value.health:[],scope:'Official in-person events plus online events and timed shop windows. Tokyo-only and online-only filters are available. Online access and shipping eligibility depend on the organiser or shop. No popularity or hype score is inferred.'},{headers});
 }catch{return Response.json({error:'Discovery could not finish. Try again.'},{status:502,headers});}
}
