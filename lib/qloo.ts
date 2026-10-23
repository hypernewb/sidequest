import {safeUrl, familyFor, type Interest, type Place} from './discovery';
const BASE='https://hackathon.api.qloo.com';
export async function qloo(path:string,params:Record<string,string>,key:string) {
 const url=new URL(path,BASE);for(const [k,v] of Object.entries(params))url.searchParams.set(k,v);
 const r=await fetch(url,{headers:{'X-Api-Key':key,Accept:'application/json'},signal:AbortSignal.timeout(18000)});
 if(!r.ok)throw new Error(r.status===429 ? 'Qloo is busy. Please try again in a minute.' : 'Qloo could not complete this search. Please try again.');
 const b=await r.json() as {results?:unknown; success?:boolean};
 if(b.success===false)throw new Error('Qloo could not complete this search. Please try again.');
 return b;
}
// Qloo schema is normalized here; unknown prices never become a fabricated admission price.
export function normalize(entity:Record<string,any>,interests:Interest[],retrievedAt:string):Place|null {
 const p=entity.properties||{},l=entity.location||{},q=entity.query||{};
 if(p.is_closed===true || p.geocode?.country_code!=='JP' || p.geocode?.admin1_region!=='Tokyo')return null;
 const category=String(p.primary_genre?.name||'Cultural place');
 if(/hotel|lodging|restaurant|fast food|parking|airport|supermarket/i.test(category))return null;
 if(!/museum|gallery|art|cafe|coffee|jazz|music|bar|book|record|design|cultural|concert|tea|toy|hobby|video game|comic|collectible|arcade|amusement|model shop/i.test(category))return null;
 if(!Number.isFinite(l.lat)||!Number.isFinite(l.lon)||!Number.isFinite(q.affinity))return null;
 const contributions=q.explainability?.['signal.interests.entities']||[];
 const signals=contributions.map((c:any)=>({name:interests.find(i=>i.id.toUpperCase()===String(c.entity_id).toUpperCase())?.name,contribution:c.score})).filter((c:any)=>c.name&&Number.isFinite(c.contribution)&&c.contribution>0).sort((a:any,b:any)=>b.contribution-a.contribution);
 const names=signals.slice(0,2).map((s:{name:string})=>s.name);
 const reason=names.length ? `Qloo connects this ${category.toLowerCase()} with your taste in ${names.join(' and ')}.` : `Qloo selected this ${category.toLowerCase()} for your combined taste profile.`;
 const image=safeUrl(p.images?.[0]?.url);
 return {id:entity.entity_id,name:String(entity.name),category,family:familyFor(category),area:String(p.neighborhood||p.geocode?.city||'Tokyo'),address:String(p.address||'Address not supplied'),description:String(p.short_description||p.description||'Visit the venue website for details.'),website:safeUrl(p.website),map:'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(entity.name+' '+(p.address||'Tokyo')),image:image?.startsWith('https://images.qloo.com/')?image:null,lat:l.lat,lon:l.lon,affinity:q.affinity,popularity:Number.isFinite(entity.popularity)?entity.popularity:null,signals,hours:p.hours||{},price:null,retrievedAt,reason};
}
