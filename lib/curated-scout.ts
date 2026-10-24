import {reportRun,type RunHooks,type Association} from './quest-run.ts';
import {questSeed} from './quest-seeds.ts';
import {datedVenueHours} from './venue-programmes.ts';
import {tasteThreads,culturalOverlap} from './curated-taste.ts';
import {qloo} from './qloo.ts';
import {VENUES,venueById,type Curation} from './curated-venues.ts';
import type {Opportunity,Preferences} from './opportunities.ts';
import {planScout,prepareScout,type ScoutPlan} from './scout.ts';
import type {QuestSeed} from './quest-seeds.ts';
import {plainText} from './announcements.ts';

// Official weekly hours explicitly checked by the curator. Unknown admission stays unknown.
const daily=(opens:string,closes:string)=>Object.fromEntries(['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(d=>[d,[{opens,closes}]]));
const verifiedHours:Record<string,Opportunity['hours']>={'Little Soul Cafe':daily('19:00','02:00'),'Bar Music':daily('18:00','24:00'),'NAT RECORDS':daily('11:00','20:00')};
export function curatedOpportunity(e:Record<string,any>,seed:QuestSeed,at:string):Opportunity|null{
 const v=venueById.get(String(e.entity_id).toUpperCase()),p=e.properties||{},l=e.location||{},a=e.query?.affinity;
 if(!v||v.eventOnly||p.is_closed||p.geocode?.country_code!=='JP'||p.geocode?.admin1_region!=='Tokyo'||!Number.isFinite(l.lat)||!Number.isFinite(l.lon)||!Number.isFinite(a))return null;
 const contributors=e.query?.explainability?.['signal.interests.entities']||[];
 // A result without a contribution is a ranked candidate, not an explained personal match.
 const explained=seed.type==='album'?Array.isArray(e.query?.explainability?.['signal.interests.tags'])&&e.query.explainability['signal.interests.tags'].some((s:any)=>s.score>0):contributors.some((s:any)=>String(s.entity_id).toUpperCase()===seed.id.toUpperCase()&&s.score>0);
 const curation:Curation={role:v.role,area:v.area,mission:v.mission,tags:v.tags,doorNotes:v.doorNotes,source:v.source,reviewedAt:v.reviewedAt,matchBasis:seed.type==='album'?'album_tags':'entity',hoursBasis:verifiedHours[v.name]?'Official weekly hours':'Qloo weekly hours'};
 return {id:v.qlooId!,title:v.name,kind:'place',source:'Qloo',url:v.source.replace(/^http:/,'https:'),description:v.tags.join(', '),location:String(p.address||v.area),checkedAt:at,price:null,priceLabel:'Not published',availability:'',category:v.role,affinity:a,signals:explained?[seed.name]:[],lat:l.lat,lon:l.lon,hours:verifiedHours[v.name]||p.hours||{},curation};
}
export async function rankedCurated(p:Preferences,key:string,seed:QuestSeed,now=new Date(),hooks?:RunHooks){
 const ids=VENUES.filter(v=>v.qlooId&&!v.eventOnly&&!p.exclude.includes(v.qlooId)).map(v=>v.qlooId!);const items:Opportunity[]=[],associations:Association[]=[];
 let taste=seed.taste||[];
 if(seed.type!=='album')try{reportRun(hooks,'taste','running','Qloo /entities · reading the seed’s cultural metadata.');const b=await qloo('/entities',{entity_ids:seed.id},key,hooks?.signal);const e=(Array.isArray(b.results)?b.results:[])[0] as Record<string,any>;taste=[...taste,...(e?.tags||[]).filter((t:any)=>/^urn:tag:(genre|music|style|art_style|keyword|theme|design|gameplay)/.test(t.type||t.id||'')).map((t:any)=>({name:t.name,weight:1}))];}catch{hooks?.signal?.throwIfAborted();}
 associations.push(...taste.slice(0,3).map(t=>({name:t.name,type:'tag',relation:'seed_tag' as const,via:seed.name})));
 if(seed.type==='artist')try{reportRun(hooks,'taste','running','Qloo /v2/insights · expanding related music genres.',associations);const b=await qloo('/v2/insights',{'filter.type':'urn:tag','filter.tag.types':'urn:tag:genre:music','signal.interests.entities':seed.id,take:'12'},key,hooks?.signal);const tags=((b.results as {tags?:any[]})?.tags||[]).filter(t=>typeof t.name==='string'&&Number.isFinite(t.query?.affinity));taste=[...taste,...tags.map(t=>({name:t.name,weight:.35}))];associations.push(...tags.slice(0,2).map(t=>({name:t.name,type:'genre',relation:'related_tag' as const,via:seed.name})));}catch{hooks?.signal?.throwIfAborted();}
 // A second cultural world is optional. Only actual Qloo results are shown or used.
 try{const type=seed.type==='artist'?'tv_show':seed.type==='movie'||seed.type==='tv_show'?'artist':seed.type==='brand'?'book':'movie';reportRun(hooks,'taste','running','Qloo /v2/insights · following links into '+type.replaceAll('_',' ')+'.',associations);
 const b=await qloo('/v2/insights',{'filter.type':'urn:entity:'+type,...(seed.type==='album'?{'signal.interests.tags':seed.tags.join(',')}:{'signal.interests.entities':seed.id}),'filter.exclude.entities':seed.id,take:'3','feature.explainability':'true'},key,hooks?.signal);
 for(const e of (b.results as {entities?:Record<string,any>[]})?.entities||[]){const related=questSeed(e);if(!related||related.type!==type||related.id===seed.id||!Number.isFinite(e.query?.affinity))continue;associations.push({name:related.name,type:related.type,relation:'related_entity',via:seed.name});taste.push(...(related.taste||[]).map(t=>({...t,weight:.25})));}
 }catch{hooks?.signal?.throwIfAborted();reportRun(hooks,'taste','running','The related-world lookup was unavailable. Keeping the seed evidence and continuing.',associations);}
 if(seed.type==='album'&&!taste.length)taste=seed.tags.map(name=>({name,weight:1}));
 const threads=tasteThreads(taste),musicSeed=['artist','album'].includes(seed.type)||['hiphop','jazz','soul','funk','electronic','ambient','experimental','punk','metal','rock'].some(t=>(threads.get(t)||0)>=1),direct=new Map<string,Record<string,any>>();
 for(let i=0;i<ids.length;i+=20){reportRun(hooks,'taste','running','Qloo /v2/insights · ranking curated venues '+(i+1)+'–'+Math.min(i+20,ids.length)+' of '+ids.length+'.',associations);const b=await qloo('/v2/insights',{'filter.type':'urn:entity:place','filter.results.entities':ids.slice(i,i+20).join(','),...(seed.type==='album'?{'signal.interests.tags':seed.tags.join(',')}:{'signal.interests.entities':seed.id}),take:'50','feature.explainability':'true'},key,hooks?.signal);for(const e of (b.results as {entities?:Record<string,any>[]})?.entities||[])direct.set(String(e.entity_id).toUpperCase(),e);}
 for(let i=0;i<ids.length;i+=40){reportRun(hooks,'taste','running','Qloo /entities · loading venue coordinates and published schedules.',associations);const b=await qloo('/entities',{entity_ids:ids.slice(i,i+40).join(',')},key,hooks?.signal);for(const raw of Array.isArray(b.results)?b.results:[]){const e=raw as Record<string,any>,id=String(e.entity_id).toUpperCase(),v=venueById.get(id);if(!v||!musicSeed&&['dig','listen'].includes(v.role))continue;const overlap=culturalOverlap(v.tags,threads),ranked=direct.get(id),o=curatedOpportunity({...e,query:ranked?.query||{affinity:0}},seed,now.toISOString());if(!o||!ranked&&!overlap.length)continue;
 const genreScore=overlap.reduce((n,t)=>n+t.weight,0);o.curation!.matchedTags=overlap.map(t=>t.name);o.curation!.tasteScore=(ranked?.query?.affinity||0)*35+genreScore*30;
 if(!ranked){o.affinity=undefined;o.curation!.matchBasis='genre_bridge';}items.push(o);}}
 const unique=[...new Map(items.map(o=>[o.id,o])).values()],links=[...new Map(associations.map(a=>[a.relation+':'+a.name,a])).values()];
 reportRun(hooks,'taste','complete','Found '+unique.length+' candidates in the curated catalog. '+links.filter(a=>a.relation==='related_entity').length+' lateral cultural links returned by Qloo.',links);
 return unique;
}
export async function checkVenuePage(item:Opportunity,fetcher:typeof fetch=fetch,now=new Date(),date=now.toLocaleDateString('en-CA',{timeZone:'Asia/Tokyo'}),signal?:AbortSignal){
 const v=venueById.get(item.id);if(!v)throw Error('Outside the curated pool');
 // Static curator-owned URLs only. Redirects cannot turn this into arbitrary URL fetching.
 const r=await fetcher(v.source,{redirect:'manual',headers:{Accept:'text/html','User-Agent':'SideQuest venue checker'},signal:signal?AbortSignal.any([signal,AbortSignal.timeout(7000)]):AbortSignal.timeout(7000)});
 if(!r.ok||!/text\/html/.test(r.headers.get('content-type')||''))throw Error('Venue page unavailable');
 const reader=r.body?.getReader();if(!reader)throw Error('Empty venue page');let size=0;const chunks:Uint8Array[]=[];try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2500000)throw Error('Page too large');chunks.push(value);}}finally{await reader.cancel();}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}const head=new TextDecoder('latin1').decode(bytes.slice(0,5000)),charset=head.match(/charset=["']?([a-zA-Z0-9_-]+)/i)?.[1]||'utf-8';let html;try{html=new TextDecoder(charset).decode(bytes);}catch{html=new TextDecoder().decode(bytes);}
 const text=plainText(html);if(text.length<80||/^(?:.*\n)?(?:Checking your browser|メンテナンス中)/i.test(text.slice(0,200)))throw Error('No usable venue information');
 return datedVenueHours({...item,curation:{...item.curation!,sourceReadAt:now.toISOString()}},html,date);
}
export async function scoutCurated(p:Preferences,key:string,seed:QuestSeed,now=new Date(),flexibleDate=false,hooks?:RunHooks):Promise<ScoutPlan>{
 const items=await rankedCurated(p,key,seed,now,hooks),checked=new Set<string>(),failed=new Set<string>();
 reportRun(hooks,'operations','running','Checking Tokyo time and the published opening windows.');
 const initial=prepareScout(items,p,now);reportRun(hooks,'operations','complete',initial.tokyoNow+' JST · '+initial.pool.length+' of '+items.length+' candidates pass hours, location and price checks for '+initial.date+'.');
 reportRun(hooks,'cluster','running','Comparing three-stop loops. Every estimated walking leg must fit within 1.5 km.');
 let plan=planScout(items,p,now);
 if(flexibleDate&&!plan.stops.length){for(let i=1;i<=6&&!plan.stops.length;i++){const date=new Date(Date.parse(p.date+'T12:00:00+09:00')+i*86400000).toLocaleDateString('en-CA',{timeZone:'Asia/Tokyo'});reportRun(hooks,'cluster','running','No complete loop yet. Trying '+date+' against the published schedules.');plan=planScout(items,{...p,date},now);}if(plan.stops.length)plan.notes.push('No complete loop fit the first day. This is the next day with a route.');}
 const active={...p,date:plan.date};
 for(let attempt=0;attempt<9&&checked.size+failed.size<12&&plan.stops.length;attempt++){
  const pending=plan.stops.filter(s=>!checked.has(s.item.id)).slice(0,12-checked.size-failed.size);if(!pending.length)break;
  reportRun(hooks,'cluster','running','Reading venue pages for '+pending.map(s=>s.item.title).join(', ')+'.');
  await Promise.all(pending.map(async s=>{try{const value=await checkVenuePage(s.item,fetch,now,plan.date,hooks?.signal);Object.assign(items.find(o=>o.id===s.item.id)!,value);checked.add(s.item.id);reportRun(hooks,'cluster','running','Read '+s.item.title+' and applied any supported dated hours.');}catch{hooks?.signal?.throwIfAborted();failed.add(s.item.id);reportRun(hooks,'cluster','running','Could not read '+s.item.title+'. Removing it and trying another loop.');}}));
  plan=planScout(items.filter(o=>!failed.has(o.id)),active,now);
 }
 if(plan.stops.some(s=>!checked.has(s.item.id)))plan=planScout(items.filter(o=>checked.has(o.id)),active,now);
 reportRun(hooks,'cluster',plan.stops.length?'complete':'blocked',plan.stops.length?'Selected '+plan.stops.map(s=>s.item.title).join(' → ')+'. About '+plan.walkingMinutes+' minutes walking including the return.':'No complete three-stop loop passed the checks.');
 return {...plan,trace:['Started with '+seed.name+(seed.type==='album'?' using its Qloo genre tags':'')+'.','Ranked '+items.length+' candidates within '+VENUES.length+' curated venues; '+VENUES.filter(v=>v.qlooId).length+' have resolved Qloo IDs.','Read '+checked.size+' venue pages'+(failed.size?'; replaced '+failed.size+' unreadable sources':'')+'.',plan.stops.length?'Fitted three stops with varied activities around their weekly hours and a return walk.':'No complete three-stop loop passed the checks.']};
}
