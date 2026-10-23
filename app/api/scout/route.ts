import {env} from 'cloudflare:workers';
import {preferenceSchema,type Opportunity} from '@/lib/opportunities';
import {qloo,normalize} from '@/lib/qloo';
import {PLACE_TAGS,activityFits,type Activity} from '@/lib/taste-context';
import {planScout} from '@/lib/scout';
import {validVisitDate} from '@/lib/discovery';

export async function POST(req:Request){
 const headers={'Cache-Control':'private, no-store'};
 if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Dispatch from SideQuest.'},{status:403,headers});
 try{const raw=await req.text();if(raw.length>24000)return Response.json({error:'Too many choices.'},{status:413,headers});
  const parsed=preferenceSchema.safeParse(JSON.parse(raw));if(!parsed.success||!validVisitDate(parsed.data.date))return Response.json({error:'Choose a valid visit date and activity.'},{status:400,headers});
  if(!env.QLOO_API_KEY)return Response.json({error:'The Qloo connection is unavailable. Try again later.'},{status:503,headers});
  const p=parsed.data,now=new Date(),group:Activity=p.intent==='play'?'collect':p.intent==='mix'?'any':p.intent;
  const groups=group==='any'?Object.keys(PLACE_TAGS):[group];
  const jobs=await Promise.allSettled(groups.map(async g=>{const b=await qloo('/v2/insights',{'filter.type':'urn:entity:place','filter.tags':PLACE_TAGS[g as Exclude<Activity,'any'>].join(','),'operator.filter.tags':'union','filter.location':'POINT(139.7006 35.6762)','filter.location.radius':'25000',...(p.seeds.length?{'signal.interests.entities':p.seeds.map(s=>s.id).join(',')}:{}),take:'50','feature.explainability':'true'},env.QLOO_API_KEY!);
   return ((b.results as {entities?:Record<string,any>[]})?.entities||[]).filter(e=>activityFits(String(e.properties?.primary_genre?.name||''),g as Activity)).map(e=>normalize({...e,query:{...e.query,affinity:e.query?.affinity??0}},p.seeds,now.toISOString())).filter(v=>v!==null).map(v=>({id:v.id,title:v.name,kind:'place',source:'Qloo',url:v.website||v.map,description:v.description,location:v.address,checkedAt:v.retrievedAt,price:null,priceLabel:'Price not supplied',availability:'Check special closures and reservations.',category:v.category,affinity:v.affinity,signals:v.signals.map(s=>s.name),lat:v.lat,lon:v.lon,hours:v.hours,map:v.map} satisfies Opportunity));}));
  if(jobs.every(j=>j.status==='rejected'))throw Error('Qloo did not respond.');
  const items=[...new Map(jobs.flatMap(j=>j.status==='fulfilled'?j.value:[]).map(o=>[o.id,o])).values()];const plan=planScout(items,p,now);
  if(jobs.some(j=>j.status==='rejected'))plan.notes.push('Some Qloo searches failed. This plan uses the searches that succeeded.');
  return Response.json(plan,{headers});
 }catch{return Response.json({error:'The scout could not finish checking places. Your answers are kept. Please retry.'},{status:502,headers});}
}
