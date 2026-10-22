import {env} from 'cloudflare:workers';
import {qloo,normalize} from '@/lib/qloo';
import {AREAS,eligible,rankPlaces,publishedHours,validVisitDate,type Interest,type Place} from '@/lib/discovery';
import {personalFeverSearch} from '@/lib/fever-oauth';
import type {FeverReply} from '@/lib/fever-data';
import {z} from 'zod';
import candidateIds from '@/lib/candidate-ids.json';
const schema=z.object({interests:z.array(z.object({id:z.string().uuid(),name:z.string().min(1).max(100),type:z.string().max(40)})).min(3).max(8),area:z.enum(['tokyo','shibuya','shinjuku','roppongi','ueno']),mode:z.enum(['familiar','explore','surprise']),budget:z.enum(['flexible','free','1000','3000']),kind:z.enum(['places','events','both']),dates:z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1).max(2),rejected:z.array(z.string().max(100)).max(500).optional(),savedFamilies:z.array(z.string().max(80)).max(100).optional()});
const headers={'Cache-Control':'private, no-store'};
export async function POST(req:Request){
 const origin=req.headers.get('origin');
 if(origin&&origin!==new URL(req.url).origin)return Response.json({error:'Please search from SideQuest.'},{status:403,headers});
 try{
  const text=await req.text();if(text.length>16000)return Response.json({error:'Search is too large.'},{status:413,headers});
  const parsed=schema.safeParse(JSON.parse(text));
  if(!parsed.success)return Response.json({error:'Please check your interests and search settings.'},{status:400,headers});
  const b=parsed.data,interests:Interest[]=b.interests;
  if(new Set(interests.map(i=>i.id.toUpperCase())).size!==interests.length)return Response.json({error:'Choose different interests.'},{status:400,headers});
  if(!b.dates.every(validVisitDate))return Response.json({error:'Choose a real date today or in the future.'},{status:400,headers});
  const rejected=b.rejected||[],savedFamilies=b.savedFamilies||[];
  async function places(){
   if(b.kind==='events')return {places:[] as Place[],examined:0};
   if(!env.QLOO_API_KEY)throw Error('The Qloo connection needs attention. Events may still be available.');
   const a=AREAS[b.area];
   const raw=await qloo('/v2/insights',{'filter.type':'urn:entity:place','filter.results.entities':candidateIds.join(','),'signal.interests.entities':interests.map(i=>i.id).join(','),'filter.location':`POINT(${a.lon} ${a.lat})`,'filter.location.radius':String(a.radius),take:'50','feature.explainability':'true'},env.QLOO_API_KEY);
   const entities=(raw.results as {entities?:Record<string,any>[]})?.entities;
   if(!Array.isArray(entities))throw Error('Qloo returned an unexpected response. Please retry.');
   const retrievedAt=new Date().toISOString();
   const normalized=entities.map(e=>normalize(e,interests,retrievedAt)).filter((x):x is Place=>!!x);
   const filtered=normalized.filter(p=>eligible(p,b.area,b.budget,rejected)&&b.dates.some(date=>publishedHours(p,date)!=='Listed as closed'));
   return {places:rankPlaces(filtered,b.mode,savedFamilies),examined:entities.length,retrievedAt};
  }
  // Separate provider failures: a failed event search must not discard useful Qloo places.
  const [placeResult,eventResult]=await Promise.allSettled([places(),b.kind==='places'?Promise.resolve(null):personalFeverSearch(req,env,{area:b.area,dates:b.dates,budget:b.budget,rejected})]);
  const fever:FeverReply|null=eventResult.status==='fulfilled'?(eventResult.value?.reply||null):{status:'error',events:[],message:'Fever could not complete this search. Please retry.'};
  if(placeResult.status==='rejected'&&b.kind==='places')throw placeResult.reason;
  const p=placeResult.status==='fulfilled'?placeResult.value:{places:[],examined:0,retrievedAt:undefined};
  const notices:string[]=[];
  if(placeResult.status==='rejected')notices.push(placeResult.reason instanceof Error?placeResult.reason.message:'Place discovery could not complete.');
  if(fever&&fever.status!=='success')notices.push(fever.message);
  const provider=b.kind==='events'?(fever?.status==='success'?'fever':'unavailable'):placeResult.status==='fulfilled'?(fever?.status==='success'?'qloo+fever':'qloo'):fever?.status==='success'?'fever':'unavailable';
  const response=Response.json({...p,fever,provider,notice:notices.join(' ')||null,budgetLimited:b.budget!=='flexible'&&b.kind!=='events',hoursNotice:'Place dates filter weekly closures only. Check special closures, admission prices and availability with the venue.'},{headers});
  if(eventResult.status==='fulfilled')for(const value of eventResult.value?.cookies||[])response.headers.append('Set-Cookie',value);
  return response;
 }catch(e){return Response.json({error:e instanceof SyntaxError?'The search could not be read. Try again.':e instanceof Error?e.message:'Discovery failed. Please retry.'},{status:502,headers});}
}
