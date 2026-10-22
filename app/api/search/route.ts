import {env} from 'cloudflare:workers';
import {qloo} from '@/lib/qloo';
import {culturalEntity} from '@/lib/taste-exploration';
export async function GET(req:Request) {
 const query=new URL(req.url).searchParams.get('q')?.trim();
 if(!query||query.length<2||query.length>80)return Response.json({error:'Enter 2–80 characters.'},{status:400});
 if(!env.QLOO_API_KEY)return Response.json({error:'Interest search is not configured yet.'},{status:503});
 try {
  const b=await qloo('/search',{query,take:'8'},env.QLOO_API_KEY);
  const items=Array.isArray(b.results)? b.results : [];
  return Response.json({interests:items.map(culturalEntity).filter(Boolean).slice(0,6)},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Search failed.'},{status:502});}
}
