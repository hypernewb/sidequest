import {env} from 'cloudflare:workers';
import {qloo} from '@/lib/qloo';
import {tasteSchema,selectedTopics,qlooAnchors} from '@/lib/taste';
export async function POST(req:Request){
 if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Please explore from SideQuest.'},{status:403});
 try{
  const text=await req.text();if(text.length>6000)return Response.json({error:'Your taste profile is too large.'},{status:413});
  const profile=tasteSchema.parse(JSON.parse(text));
  if(!env.QLOO_API_KEY)return Response.json({error:'Qloo matching is unavailable. Your explicit follows still work for drops.'},{status:503});
  const apiKey=env.QLOO_API_KEY;
  const results=await Promise.all(selectedTopics(profile).map(async t=>{try{
   const response=await qloo('/search',{query:t.query,take:'8'},apiKey);
   const candidates=qlooAnchors(t,response);
   return {topicId:t.id,candidates};
  }catch{return {topicId:t.id,candidates:[],unavailable:true};}}));
  return Response.json({matches:results},{headers:{'Cache-Control':'private, no-store'}});
 }catch{return Response.json({error:'Please check your taste choices.'},{status:400});}
}
