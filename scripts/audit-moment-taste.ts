// Isolated service diagnostic, without the API route's seed metadata hydration.
// Use check-taste-game.mjs for product-level contrasts. Credentials are never logged.
import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {enrichMomentTaste,exactCatalogEntity} from '../lib/catalog-taste.ts';
import {selectMoments} from '../lib/moments.ts';
import {qloo} from '../lib/qloo.ts';
import type {Opportunity,Preferences} from '../lib/opportunities.ts';
const key=fs.readFileSync('.dev.vars','utf8').match(/^QLOO_API_KEY\s*=\s*["']?([^\r\n"']+)/m)?.[1];
if(!key)throw Error('The server key is missing.');
const dir='.wrangler/state/v3/d1/miniflare-D1DatabaseObject';
const file=fs.readdirSync(dir).find(n=>n.endsWith('.sqlite')&&n!=='metadata.sqlite');if(!file)throw Error('Local catalog is missing.');
const db=new DatabaseSync(path.join(dir,file),{readOnly:true});
const items=(db.prepare('SELECT payload FROM event_catalog').all() as {payload:string}[]).map(r=>JSON.parse(r.payload)) as Opportunity[];db.close();
const now=new Date(),date=now.toLocaleDateString('en-CA',{timeZone:'Asia/Tokyo'}),cache=new Map();
const read=async(k:string)=>cache.get(k),write=async(k:string,v:any)=>{cache.set(k,v);};
const output:any={at:now.toISOString(),inventory:items.length,profiles:[],scope:'Isolated graph service over the local catalog, without API seed hydration. Live Qloo calls; not a product-ranking benchmark or recommendation-quality rating.'};
for(const [name,type] of [['Nujabes','artist'],['Iron Maiden','artist'],['Nintendo','brand']]){
 const b=await qloo('/search',{query:name,types:'urn:entity:'+type,take:'12'},key),seed=exactCatalogEntity(name,Array.isArray(b.results)?b.results:[]);
 if(!seed){output.profiles.push({name,error:'Exact identity is ambiguous or missing'});continue;}
 const p:Preferences={intent:'mix',direction:'any',format:'dated',date,days:30,budget:'any',unknownPrice:true,seeds:[{id:seed.id,name:seed.name,type,feeling:'love'}],exclude:[]};
 const eligible=selectMoments(items,p,'all','all','for-you',now),result=await enrichMomentTaste(eligible,p,key,read,write),ranked=selectMoments(result.items,p,'all','all','for-you',now);
 const summary=(o:Opportunity)=>({id:o.id,title:o.englishTitle||o.title,source:o.source,discovery:o.discovery,score:o.score,entities:o.catalogEntities,evidence:o.qlooEvidence,reasons:o.reasons});
 const target=ranked.find(o=>o.qlooEvidence?.length&&o.catalogEntities?.some(e=>e.id!==seed.id));
 let reaction:any=null;
 if(target){const context={tags:[],reactions:[{id:target.id,action:'more' as const}]};const next=await enrichMomentTaste(eligible,p,key,read,write,context),after=selectMoments(next.items,p,'all','all','for-you',now);reaction={itemId:target.id,beforePosition:ranked.findIndex(o=>o.id===target.id)+1,afterPosition:after.findIndex(o=>o.id===target.id)+1,beforeTop:ranked.slice(0,6).map(o=>o.id),afterTop:after.slice(0,6).map(o=>o.id),positiveSignals:next.diagnostics.positiveSignals};}
 output.profiles.push({name,seedId:seed.id,eligible:eligible.length,diagnostics:result.diagnostics,top:ranked.slice(0,8).map(summary),graphItems:ranked.filter(o=>o.qlooEvidence?.length).length,affinityRange:result.items.flatMap(o=>o.qlooEvidence?.map(e=>e.affinity)||[]).reduce((r,v)=>({min:Math.min(r.min,v),max:Math.max(r.max,v)}),{min:1,max:0}),scouting:result.scouting,reaction});
 console.log(JSON.stringify({name,eligible:eligible.length,diagnostics:result.diagnostics,graphItems:ranked.filter(o=>o.qlooEvidence?.length).length,top:ranked.slice(0,4).map(o=>({title:o.englishTitle||o.title,discovery:o.discovery})),reaction}));
}
output.topOverlap=output.profiles.flatMap((a:any,i:number)=>output.profiles.slice(i+1).map((b:any)=>({profiles:[a.name,b.name],shared:(a.top||[]).filter((o:any)=>(b.top||[]).some((x:any)=>x.id===o.id)).length,outOf:8})));
fs.mkdirSync('.local',{recursive:true});fs.writeFileSync('.local/qloo-moments-audit.json',JSON.stringify(output,null,2));
console.log(JSON.stringify({report:'.local/qloo-moments-audit.json',topOverlap:output.topOverlap}));
