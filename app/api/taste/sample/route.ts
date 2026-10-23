import {env} from 'cloudflare:workers';
import {qloo} from '@/lib/qloo';
import {culturalEntity} from '@/lib/taste-exploration';
import {SAMPLE_TASTES,exactSeed,tasteMetrics} from '@/lib/taste-bench';
import {tokyoDate,type Interest} from '@/lib/discovery';
import {POST as discover} from '@/app/api/discover/route';
import {z} from 'zod';
const input=z.object({profile:z.string().max(50),mode:z.enum(['familiar','explore','surprise']).default('explore')});
const cache=new Map<string,{value:Interest;at:number}>();
const headers={'Cache-Control':'private, no-store'};
export async function POST(req:Request){
 if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Open SideQuest to compare samples.'},{status:403,headers});
 let data;try{const raw=await req.text();if(raw.length>1000)throw Error();data=input.parse(JSON.parse(raw));}catch{return Response.json({error:'Choose a sample taste and discovery mode.'},{status:400,headers});}
 const profile=SAMPLE_TASTES.find(p=>p.id===data.profile);if(!profile)return Response.json({error:'Choose one of the listed sample tastes.'},{status:400,headers});
 if(!env.QLOO_API_KEY)return Response.json({error:'Qloo is unavailable. Your own taste has not changed.'},{status:503,headers});
 try{const resolved=await Promise.all(profile.seeds.map(async seed=>{const key=seed.type+':'+seed.name,hit=cache.get(key);if(hit&&Date.now()-hit.at<86400000)return hit.value;const b=await qloo('/search',{query:seed.name,take:'8'},env.QLOO_API_KEY!);const values=(Array.isArray(b.results)?b.results:[]).map(culturalEntity).filter((i):i is NonNullable<typeof i>=>!!i);const found=exactSeed(seed,values);if(found)cache.set(key,{value:found,at:Date.now()});return found;}));
 const interests=resolved.filter((i):i is Interest=>!!i),unresolved=profile.seeds.filter((_,i)=>!resolved[i]).map(i=>i.name);
 if(unresolved.length)return Response.json({error:'Qloo could not resolve the exact sample interests: '+unresolved.join(', ')+'. No substitute was used.',unresolved},{status:422,headers});
 const response=await discover(new Request(new URL('/api/discover',req.url),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({interests,context:{ids:interests.map(i=>i.id),tags:[],activity:profile.activity},area:'tokyo',dates:[tokyoDate()],budget:'flexible',kind:'places',mode:data.mode,rejected:[],savedFamilies:[]})}));
 const result=await response.json() as Record<string,any>;if(!response.ok)return Response.json({error:result.error||'The sample search failed. Retry this comparison.'},{status:response.status,headers});
 return Response.json({...result,profile,interests,metrics:tasteMetrics(result.places),unresolved},{headers});
 }catch{return Response.json({error:'The sample search could not finish. Retry; your own taste is unchanged.'},{status:502,headers});}
}
