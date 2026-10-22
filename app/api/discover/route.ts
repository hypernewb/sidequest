import {env} from 'cloudflare:workers';
import {qloo,normalize} from '@/lib/qloo';
import {AREAS,eligible,rankPlaces,publishedHours,validVisitDate,type Interest,type Mode,type Place} from '@/lib/discovery';
import {z} from 'zod';
import candidateIds from '@/lib/candidate-ids.json';
const schema=z.object({interests:z.array(z.object({id:z.string().uuid(),name:z.string().min(1).max(100),type:z.string().max(40)})).min(3).max(8),area:z.enum(['tokyo','shibuya','shinjuku','roppongi','ueno']),mode:z.enum(['familiar','explore','surprise']),budget:z.enum(['flexible','free','1000','3000']),kind:z.enum(['places','events','both']),dates:z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1).max(2),rejected:z.array(z.string().max(100)).max(500).optional(),savedFamilies:z.array(z.string().max(80)).max(100).optional()});
export async function POST(req:Request) {
 const origin=req.headers.get('origin');
 if(origin&&origin!==new URL(req.url).origin)return Response.json({error:'Please search from SideQuest.'},{status:403});
 try {
  if(Number(req.headers.get('content-length'))>16000)return Response.json({error:'Search is too large.'},{status:413});
  const parsed=schema.safeParse(await req.json());
  if(!parsed.success)return Response.json({error:'Please check your interests and search settings.'},{status:400});
  const b=parsed.data;
  const interests:Interest[]=b.interests;
  if(!Array.isArray(interests)||interests.length<3||interests.length>8||new Set(interests.map(i=>i.id)).size!==interests.length||!interests.every(i=>/^[A-Fa-f0-9-]{36}$/.test(i.id)&&typeof i.name==='string'&&i.name.length<=100))return Response.json({error:'Choose 3–8 different interests to discover places.'},{status:400});
  if(!Object.keys(AREAS).includes(b.area)||!['familiar','explore','surprise'].includes(b.mode)||!['flexible','free','1000','3000'].includes(b.budget)||!['places','events','both'].includes(b.kind))return Response.json({error:'Please check your search settings.'},{status:400});
  if(!b.dates.every(validVisitDate))return Response.json({error:'Choose a real date today or in the future.'},{status:400});
  const notice=b.kind==='places'?null:'Event listings aren’t available here yet. This search shows places only.';
  if(b.kind==='events')return Response.json({places:[],notice,retrievedAt:null,examined:0,provider:'unavailable'});
  if(!env.QLOO_API_KEY)return Response.json({error:'The Qloo connection needs a server API key. Please contact the app owner.'},{status:503});
  const a=AREAS[b.area as keyof typeof AREAS];
  const raw=await qloo('/v2/insights',{'filter.type':'urn:entity:place','filter.results.entities':candidateIds.join(','),'signal.interests.entities':interests.map(i=>i.id).join(','),'filter.location':`POINT(${a.lon} ${a.lat})`,'filter.location.radius':String(a.radius),take:'50','feature.explainability':'true'},env.QLOO_API_KEY);
  const entities=(raw.results as {entities?:Record<string,any>[]} )?.entities;
  if(!Array.isArray(entities))throw new Error('Qloo returned an unexpected response. Please retry.');
  const retrievedAt=new Date().toISOString();
  const normalized=entities.map(e=>normalize(e,interests,retrievedAt)).filter((x):x is Place=>!!x);
  const rejected=Array.isArray(b.rejected)?b.rejected.slice(0,200).filter((x:unknown)=>typeof x==='string'):[];
  const savedFamilies=Array.isArray(b.savedFamilies)?b.savedFamilies.filter((x:unknown)=>typeof x==='string').slice(0,50):[];
  const filtered=normalized.filter(p=>eligible(p,b.area,b.budget,rejected)&&b.dates.some((date:string)=>publishedHours(p,date)!=='Listed as closed'));
  return Response.json({places:rankPlaces(filtered,b.mode as Mode,savedFamilies),notice,retrievedAt,examined:entities.length,provider:'qloo',budgetLimited:b.budget!=='flexible',hoursNotice:'Dates filter published weekly closures only. Special closures, admission prices and availability need confirmation with the venue.'},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return Response.json({error:e instanceof SyntaxError?'The search could not be read. Try again.':e instanceof Error?e.message:'Discovery failed. Please retry.'},{status:502});}
}
