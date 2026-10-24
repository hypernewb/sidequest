import {env} from 'cloudflare:workers';
import {preferenceSchema} from '@/lib/opportunities';
import {scoutCurated} from '@/lib/curated-scout';
import {validVisitDate} from '@/lib/discovery';
export async function POST(req:Request){
 const headers={'Cache-Control':'private, no-store'};
 if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Dispatch from SideQuest.'},{status:403,headers});
 try{const raw=await req.text();if(raw.length>24000)return Response.json({error:'Too many choices.'},{status:413,headers});const p=preferenceSchema.safeParse(JSON.parse(raw));
 if(!p.success||!validVisitDate(p.data.date))return Response.json({error:'Choose a valid visit date.'},{status:400,headers});
 if(!env.QLOO_API_KEY)return Response.json({error:'The Qloo connection is unavailable.'},{status:503,headers});
 const seed=p.data.seeds[0];if(!seed)return Response.json({error:'Give the scout one artist, album or place.'},{status:400,headers});
 return Response.json(await scoutCurated(p.data,env.QLOO_API_KEY,{...seed,description:'',tags:[]}),{headers});
 }catch{return Response.json({error:'The scout could not finish checking places. Please retry.'},{status:502,headers});}
}
