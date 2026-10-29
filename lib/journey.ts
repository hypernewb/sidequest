import {z} from 'zod';
import type {Opportunity} from './opportunities.ts';
export const JOURNEY_KEY='sidequest-journey-v1',VISITS_KEY='sidequest-visits-v1',JOURNEY_LIMIT=5;
export const journeyItemSchema=z.object({
 id:z.string().min(1).max(800),title:z.string().min(1).max(500),kind:z.enum(['place','gig','exhibition','popup','release','event']),
 url:z.string().url().max(2000).refine(s=>s.startsWith('https://')),location:z.string().max(1000),source:z.string().max(200),category:z.string().max(500),
 online:z.boolean().optional(),lat:z.number().finite().min(-90).max(90).optional(),lon:z.number().finite().min(-180).max(180).optional(),
 start:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),end:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),startsAt:z.string().datetime({offset:true}).optional(),endsAt:z.string().datetime({offset:true}).optional(),
});
export type JourneyItem=z.infer<typeof journeyItemSchema>;
export const journeyEntrySchema=z.object({item:journeyItemSchema,time:z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).or(z.literal('')).default('')});
export type JourneyEntry=z.infer<typeof journeyEntrySchema>;
export const journeySchema=z.object({date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),entries:z.array(journeyEntrySchema).max(JOURNEY_LIMIT)});
export type Journey=z.infer<typeof journeySchema>;
export const visitSchema=z.object({item:journeyItemSchema,rating:z.number().int().min(1).max(5),at:z.string().datetime()});
export type Visit=z.infer<typeof visitSchema>;
export function journeyItem(o:Opportunity|JourneyItem):JourneyItem{return journeyItemSchema.parse({...o,title:'englishTitle' in o?o.englishTitle||o.title:o.title});}
export function readJourney(storage:Pick<Storage,'getItem'>,today:string):Journey{try{const raw=storage.getItem(JOURNEY_KEY)||'';if(raw.length>120000)return {date:today,entries:[]};return journeySchema.parse(JSON.parse(raw));}catch{return {date:today,entries:[]};}}
export function readVisits(storage:Pick<Storage,'getItem'>):Visit[]{try{const raw=storage.getItem(VISITS_KEY)||'[]';if(raw.length>500000)return [];const rows=JSON.parse(raw);return Array.isArray(rows)?rows.flatMap(v=>{const r=visitSchema.safeParse(v);return r.success?[r.data]:[];}).slice(0,100):[];}catch{return [];}}
export function located(o:Pick<JourneyItem,'lat'|'lon'|'online'>):o is typeof o & {lat:number;lon:number}{return !o.online&&typeof o.lat==='number'&&typeof o.lon==='number'&&Number.isFinite(o.lat)&&Number.isFinite(o.lon)&&Math.abs(o.lat)<=90&&Math.abs(o.lon)<=180;}
export function locationQuery(o:JourneyItem){
 if(o.online)return '';if(located(o))return `${o.lat},${o.lon}`;
 if(['U.F.O.CLUB','Shindaita FEVER','Cotton Club','LIQUIDROOM','WWW / WWW X','UNIT / SALOON'].includes(o.source))return o.source+' '+o.location;
 if(/see issuer|not confirmed|unconfirmed|participating|retailers|selected stores|nationwide|全国|各店/i.test(o.location)||/^(?:Tokyo|東京|Japan|日本|Shibuya|Shinjuku|Higashi-Koenji|Shimokitazawa|Ebisu|Roppongi)(?:[\s,·/]*(?:Tokyo|東京|Japan|日本))*$/i.test(o.location.trim()))return '';
 return o.location.trim();
}
export function googlePlace(o:JourneyItem){const query=locationQuery(o);return !o.online&&query?'https://www.google.com/maps/search/?'+new URLSearchParams({api:'1',query}):undefined;}
export function googleJourney(entries:JourneyEntry[]){const rows=entries.filter(e=>!e.item.online&&locationQuery(e.item));if(!rows.length)return undefined;if(rows.length===1)return googlePlace(rows[0].item);return 'https://www.google.com/maps/dir/?'+new URLSearchParams({api:'1',origin:locationQuery(rows[0].item),destination:locationQuery(rows.at(-1)!.item),...(rows.length>2?{waypoints:rows.slice(1,-1).map(e=>locationQuery(e.item)).join('|')}:{ }),travelmode:'walking'});}
export function journeyWarnings(journey:Journey,now=new Date()){
 const warnings:string[]=[];let previousTime='';
 for(const {item,time} of journey.entries){
  if(item.start&&journey.date<item.start||item.end&&journey.date>item.end)warnings.push(`${item.title} is outside its published date range.`);
  if(item.endsAt&&Date.parse(item.endsAt)<now.getTime())warnings.push(`${item.title} has already ended.`);
  const start=item.startsAt?new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo',dateStyle:'short',timeStyle:'short'}).format(new Date(item.startsAt)):'';
  if(time&&start&&`${journey.date} ${time}`<start)warnings.push(`${item.title} starts after your planned arrival. Check doors and admission.`);
  if(time&&previousTime&&time<previousTime)warnings.push('Your arrival times run backwards. Change the times or reorder the stops.');
  if(time)previousTime=time;
 }
 return [...new Set(warnings)];
}
export function canRateVisit(o:JourneyItem,now=new Date()){const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo'}).format(now);return !(o.start&&o.start>today)&&!(o.startsAt&&Date.parse(o.startsAt)>now.getTime());}
