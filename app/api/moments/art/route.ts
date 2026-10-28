import {catalogItems,state} from '@/lib/catalog';
import {officialHost} from '@/lib/announcement-reader';
import {announcementArt} from '@/lib/opportunity-art';
import {z} from 'zod';
const schema=z.object({ids:z.array(z.string().max(800)).min(1).max(2)});
export async function POST(req:Request){
 const headers={'Cache-Control':'private, no-store'};
 if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Open SideQuest.'},{status:403,headers});
 let input;try{const raw=await req.text();if(raw.length>2200)throw Error();input=schema.parse(JSON.parse(raw));}catch{return Response.json({error:'Choose current listings.'},{status:400,headers});}
 const items=await catalogItems(),images:Record<string,string>={};
 await Promise.all(input.ids.map(async id=>{try{
 const o=items.find(o=>o.id===id);if(!o)return;if(o.image){images[id]=o.image;return;}
 const old=await state('announcement-art:'+id);if(old&&Date.now()-old.at<86400000){if(old.image)images[id]=old.image;return;}
 const u=new URL(o.url);if(u.protocol!=='https:'||!officialHost(u.hostname))return;
 const r=await fetch(u,{redirect:'manual',headers:{Accept:'text/html'},signal:AbortSignal.timeout(5000)});if(!r.ok||!r.headers.get('content-type')?.includes('text/html'))return;
 let html='',bytes=0;const reader=r.body?.getReader(),decoder=new TextDecoder();if(!reader)return;
 try{while(true){const v=await reader.read();if(v.done)break;bytes+=v.value.byteLength;if(bytes>800000)throw Error();html+=decoder.decode(v.value,{stream:true});}html+=decoder.decode();}finally{await reader.cancel();}
 const image=announcementArt(html,o.url);await state('announcement-art:'+id,{at:Date.now(),image});if(image)images[id]=image;
 }catch{}}));return Response.json({images},{headers});
}
