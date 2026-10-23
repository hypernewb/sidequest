import {catalogItems,state} from '@/lib/catalog';
import {artistAffinities} from '@/lib/artist-matching';
import {getAdditional} from '@/lib/additional-sources';
import {enrichCandidates,translateShortlist} from '@/lib/event-enrichment';
import {env} from 'cloudflare:workers';
import {preferenceSchema,dateWindow,rankOpportunities,type Opportunity} from '@/lib/opportunities';
import {getOfficial} from '@/lib/official-scan';
import {SOURCE_SITES} from '@/lib/official-events';
import {DROPS,dropState} from '@/lib/drops';
import {qloo,normalize} from '@/lib/qloo';
import {PLACE_TAGS,activityFits,type Activity} from '@/lib/taste-context';
import {validVisitDate,publishedHours,distance} from '@/lib/discovery';
import {personalFeverSearch} from '@/lib/fever-oauth';

export async function POST(req:Request){
 const headers={'Cache-Control':'private, no-store'};
 if(req.headers.get('origin')&&req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Open SideQuest to search.'},{status:403,headers});
 try{
  const text=await req.text();if(text.length>24000)return Response.json({error:'Search is too large.'},{status:413,headers});
  const parsed=preferenceSchema.safeParse(JSON.parse(text));if(!parsed.success||!validVisitDate(parsed.data.date))return Response.json({error:'Check your choices and choose a real date today or later.'},{status:400,headers});
  const p=parsed.data,dates=dateWindow(p),at=new Date().toISOString(),notices:string[]=[],cookies:string[]=[],health:{name:string;count:number;status:string}[]=[];
  const jobs=await Promise.allSettled([
   (async()=>{const r=await getOfficial();for(const s of r.sources)health.push({name:SOURCE_SITES.find(v=>v.id===s.id)!.name,count:s.count,status:s.message|| (s.ok?'Checked':'Unavailable')});return r.items.map(o=>({id:o.id,title:o.title,kind:o.kind,source:SOURCE_SITES.find(s=>s.id===o.source)!.name,url:o.url,description:o.evidence,location:o.location,start:o.start,end:o.end,closedDays:o.closedDays,checkedAt:o.checkedAt,price:null,priceLabel:'Price not verified',availability:o.note+' '+o.timing,category:o.kind,online:o.source==='medicom'} satisfies Opportunity));})(),
   (async()=>{if(p.format==='drops'||p.format==='dated')return [];if(!env.QLOO_API_KEY)throw Error('Place search is unavailable.');
    const group:Activity=p.intent==='play'?'collect':p.intent==='mix'?'any':p.intent;
    const groups=group==='any'?Object.entries(PLACE_TAGS):[[group,PLACE_TAGS[group]]];
    const seeds=p.seeds;
    const queries=await Promise.allSettled(groups.flatMap(([g,tags])=>[false,true].map(async lower=>{const b=await qloo('/v2/insights',{'filter.type':'urn:entity:place','filter.tags':(tags as string[]).join(','),'operator.filter.tags':'union','filter.location':'POINT(139.7006 35.6762)','filter.location.radius':'25000',...(seeds.length?{'signal.interests.entities':seeds.map(s=>s.id).join(',')}:{}),...(lower?{'filter.popularity.max':'.8'}:{}),take:'30','feature.explainability':'true'},env.QLOO_API_KEY!);const entities=(b.results as {entities?:Record<string,any>[]})?.entities;if(!Array.isArray(entities))throw Error('Place response unavailable');return entities.filter(e=>activityFits(String(e.properties?.primary_genre?.name||''),g as Activity)).map(e=>normalize({...e,query:{...e.query,affinity:e.query?.affinity??0}},p.seeds,at)).filter(v=>v!==null).filter(v=>distance(v.lat,v.lon,35.6762,139.7006)<=25000&&dates.some(d=>publishedHours(v,d)!=='Listed as closed')).map(v=>({id:v.id,title:v.name,kind:'place' as const,source:'Qloo',url:v.website||v.map,description:v.description,location:v.address,checkedAt:at,price:null,priceLabel:'Price not supplied',availability:'Weekly opening hours checked. Special closures, admission and current programme need a venue check.',category:v.category,affinity:v.affinity,signals:v.signals.map(s=>s.name),map:v.map}));})));
    if(queries.some(r=>r.status==='rejected'))notices.push('Some place searches failed; the successful searches are included.');if(queries.every(r=>r.status==='rejected'))throw Error('Place search failed.');return queries.flatMap(r=>r.status==='fulfilled'?r.value:[]);
   })(),
   (async()=>{if(p.format==='places'||p.format==='drops')return [];const r=await personalFeverSearch(req,env,{area:'tokyo',dates,budget:p.budget==='any'||p.unknownPrice?'flexible':p.budget,rejected:p.exclude});cookies.push(...r.cookies);health.push({name:'Fever connection',count:r.reply.events.length,status:r.reply.status});if(r.reply.status!=='success')notices.push(r.reply.message);return r.reply.events.map(e=>({id:e.id,title:e.name,kind:'event' as const,source:'Fever',url:e.url,description:e.description,location:e.location,start:e.sessions[0].slice(0,10),end:e.sessions[0].slice(0,10),checkedAt:e.retrievedAt,price:e.currency==='JPY'?e.maxPrice:null,priceLabel:e.priceLabel,availability:'Published sessions: '+e.sessions.slice(0,3).join(', ')+' JST. Confirm tickets with Fever.',category:e.description}));})()
  ]);
  const names=['Official calendars','Qloo places','Fever events'];jobs.forEach((r,i)=>{health.push({name:names[i],count:r.status==='fulfilled'?r.value.length:0,status:r.status==='fulfilled'?'Checked':'Unavailable'});if(r.status==='rejected')notices.push(names[i]+' could not be checked. Other sources remain available.');});
  const catalog:Opportunity[]=DROPS.filter(d=>!['ended','needs-review'].includes(dropState(d))).map(d=>({id:'catalog:'+d.id,title:d.title,kind:d.category,source:'Official catalog',url:d.sourceUrl,description:d.summary,location:d.location,start:d.startsAt.slice(0,10),end:d.endsAt?.slice(0,10)||d.startsAt.slice(0,10),checkedAt:d.checkedAt,price:d.price,priceLabel:d.price===null?d.priceNote:'¥'+d.price+' · '+d.priceNote,availability:d.restrictions+(d.evidenceNote?' '+d.evidenceNote:''),category:d.category+' '+d.topics.join(' '),actionLabel:d.method==='preorder'?'Preorder window':d.method==='lottery'?'Lottery window':d.method==='visit'?'Pop-up dates':'Release date',online:d.channel!=='tokyo'}));
  health.push({name:'Official release catalog',count:catalog.length,status:'Manually checked; stale entries excluded'});
  const extra=await getAdditional();health.push(...extra.health);
  const stored=await catalogItems();const lastRefresh=await state("lastRefresh");const extended=await state("lastExpanded");if(extended?.health)health.push(...extended.health);health.push({name:"Persistent catalog",count:stored.length,status:lastRefresh?"Last refreshed "+lastRefresh.at:"Awaiting first refresh"});
  const rawItems=[...jobs.flatMap<Opportunity>(r=>r.status==='fulfilled'?r.value:[]),...extra.items,...catalog,...stored];
  const byId=new Map<string,Opportunity>();for(const o of rawItems){const prev=byId.get(o.id);byId.set(o.id,prev?{...prev,...o,details:o.details||prev.details,artists:o.artists||prev.artists}:o);}const all=[...byId.values()];const enriched=await enrichCandidates(all,p,fetch,true);health.push({name:'Full official pages',count:enriched.read,status:enriched.failed+' unavailable; '+enriched.remaining+' further pages can be read on demand'});
  const saved=new Map(stored.map(o=>[o.id,o]));const merged=enriched.items.map(o=>{const d=saved.get(o.id);return d?{...o,englishTitle:d.title===o.title?d.englishTitle:undefined,englishDescription:d.description===o.description?d.englishDescription:undefined,artists:d.artists,details:d.details?.english&&d.details.original===o.details?.original?d.details:o.details||d.details}:o;});const associated=env.QLOO_API_KEY?await artistAffinities(merged,p,env.QLOO_API_KEY):merged;const ranked=rankOpportunities(associated,p);await translateShortlist(ranked);
  const response=Response.json({items:ranked.slice(0,60),total:ranked.length,examined:all.length,health,notices,checkedAt:at,scope:'Tokyo places and events, plus Japan/online releases explicitly labelled. Official calendars plus a persistent catalog; full-page reading is bounded to 12 candidates per search, with more available on demand. This is not complete city coverage.'},{headers});
  for(const c of cookies)response.headers.append('Set-Cookie',c);return response;
 }catch{return Response.json({error:'The search could not complete. Your choices are kept; try again.'},{status:502,headers});}
}




