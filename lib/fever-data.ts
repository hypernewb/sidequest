import {z} from 'zod';
import {AREAS, distance, safeUrl} from './discovery.ts';

export type FeverEvent = {
 id:string; name:string; url:string; location:string; description:string;
 sessions:string[]; timezone:'Asia/Tokyo'; minPrice:number|null; maxPrice:number|null;
 currency:string|null; retrievedAt:string; priceLabel:string;
 coordinates?:{lat:number;lon:number};
};
export type FeverReply = {status:'success'|'not_configured'|'authentication_required'|'error';events:FeverEvent[];message:string;retrievedAt?:string;reauthenticationRequired?:boolean};
export type EventQuery = {area:keyof typeof AREAS;dates:string[];budget:string;rejected:string[]};
const record=z.object({id:z.union([z.number().int().positive(),z.string().min(1).max(100)]),name:z.string().min(1).max(300),url:z.string(),location:z.string().optional(),description:z.string().optional(),timezone:z.string().optional(),session_start_times:z.array(z.string()).optional(),min_price:z.number().finite().nonnegative().optional(),max_price:z.number().finite().nonnegative().optional(),currency:z.string().optional(),venue:z.object({latitude:z.number().optional(),longitude:z.number().optional()}).passthrough().optional()}).passthrough();
const venueSchema=z.object({venue_id:z.number().int().positive(),latitude:z.number().finite(),longitude:z.number().finite(),city_code:z.literal('HND'),country_code:z.literal('JP')}).passthrough();
export function parseFeverVenues(data:unknown,area:keyof typeof AREAS){
 const b=z.object({results:z.array(z.unknown())}).parse(data),a=AREAS[area];
 return b.results.map(v=>venueSchema.safeParse(v)).filter(v=>v.success).map(v=>v.data!).filter(v=>distance(v.latitude,v.longitude,a.lat,a.lon)<=a.radius).slice(0,3);
}
export function eventWindow(dates:string[]) {
 const sorted=[...dates].sort();
 return {start_datetime:new Date(sorted[0]+'T00:00:00+09:00').toISOString(),end_datetime:new Date(sorted[sorted.length-1]+'T23:59:59+09:00').toISOString()};
}
export function parseFeverEvents(data:unknown,q:EventQuery,at=new Date().toISOString()):FeverEvent[] {
 const envelope=z.object({results:z.array(z.unknown())}).safeParse(data);
 if(!envelope.success)throw new Error('Fever returned an unexpected event format.');
 const out:FeverEvent[]=[],seen=new Set<string>();
 for(const raw of envelope.data.results){
  const parsed=record.safeParse(raw);if(!parsed.success)continue;const e=parsed.data;
  const id='fever:'+e.id, url=safeUrl(e.url);
  if(!url||new URL(url).protocol!=='https:'||!['feverup.com','www.feverup.com'].includes(new URL(url).hostname)||q.rejected.includes(id)||seen.has(id))continue;
  // Fever's offset-less session values must be read with their supplied IANA timezone.
  // A date-filtered provider result without matching published sessions is not proof of a date match.
  if(e.timezone!=='Asia/Tokyo')continue;
  const sessions=(e.session_start_times||[]).filter(s=>/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(s)&&q.dates.includes(s.slice(0,10))&&!Number.isNaN(Date.parse(s+'+09:00'))&&new Date(s+'+09:00').toISOString()>=at).sort();
  if(!sessions.length)continue;
  const a=AREAS[q.area];
  // Fever can cross-sell other cities even in an HND response. Require an
  // explicit Tokyo location or actual coordinates inside the selected area.
  const hasPoint=Number.isFinite(e.venue?.latitude)&&Number.isFinite(e.venue?.longitude);
  if(q.area==='tokyo'&&(hasPoint?distance(e.venue!.latitude!,e.venue!.longitude!,a.lat,a.lon)>a.radius:!/(?:\bTokyo\b|東京)/i.test(e.location||'')))continue;
  // The city-wide query uses Fever's confirmed Tokyo city code. A strict neighborhood needs actual venue coordinates.
  if(q.area!=='tokyo'&&(!Number.isFinite(e.venue?.latitude)||!Number.isFinite(e.venue?.longitude)||distance(e.venue!.latitude!,e.venue!.longitude!,a.lat,a.lon)>a.radius))continue;
  const min=e.min_price??null,max=e.max_price??null,currency=e.currency??null;
  if(q.budget!=='flexible'){
   const cap=q.budget==='free'?0:Number(q.budget);
   // A child/starting fare is not a guaranteed adult ticket. Unknown upper bounds cannot satisfy a hard cap.
   if(currency!=='JPY'||min===null||max===null||max<min||max>cap)continue;
  }
  const priceLabel=min===null||currency===null?'Price not supplied':currency==='JPY'?`From ¥${min.toLocaleString('en-US')}`:`From ${min.toLocaleString('en-US')} ${currency}`;
  const lat=e.venue?.latitude,lon=e.venue?.longitude;
  const coordinates=typeof lat==='number'&&typeof lon==='number'&&Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180?{lat,lon}:undefined;
  out.push({id,name:e.name,url,location:e.location||'Tokyo · venue details on Fever',description:(e.description||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,1200),sessions,timezone:'Asia/Tokyo',minPrice:min,maxPrice:max,currency,retrievedAt:at,priceLabel,...(coordinates?{coordinates}:{})});seen.add(id);
 }
 return out.sort((a,b)=>a.sessions[0].localeCompare(b.sessions[0])||a.id.localeCompare(b.id)).slice(0,72);
}

export function variedFeverEvents(events:FeverEvent[],interests:{name:string}[]){
 const format=(e:FeverEvent)=>/candlelight|concert|jazz|music/i.test(e.name)?'music':/exhibition|museum|immersive|art\b/i.test(e.name)?'art':/tour|walk|cruise/i.test(e.name)?'tour':/food|tast|dining/i.test(e.name)?'food':'other';
 const score=(e:FeverEvent)=>interests.filter(i=>i.name.length>=3&&(e.name+' '+e.description).toLowerCase().includes(i.name.toLowerCase())).length;
 const pool=[...events].sort((a,b)=>score(b)-score(a)||a.sessions[0].localeCompare(b.sessions[0])||a.id.localeCompare(b.id));
 const chosen:FeverEvent[]=[],formats=new Map<string,number>(),venues=new Map<string,number>();
 while(pool.length&&chosen.length<6){let best=0,value=-Infinity;pool.forEach((e,i)=>{const v=score(e)*4-(formats.get(format(e))||0)*1.2-(venues.get(e.location)||0)*.6;if(v>value){best=i;value=v;}});const e=pool.splice(best,1)[0];chosen.push(e);formats.set(format(e),(formats.get(format(e))||0)+1);venues.set(e.location,(venues.get(e.location)||0)+1);}
 return chosen;
}
