import {qloo} from './qloo.ts';
import type {Opportunity,Preferences} from './opportunities';
import {tasteThreads,culturalOverlap} from './curated-taste.ts';
export type ArtistMatch={input:string;id:string;name:string;genres:string[]};
export function artistFitsProgramme(o:Opportunity,a:ArtistMatch){
 // A sole credited artist with conflicting published genres is a possible namesake.
 // Leave identity unresolved instead of presenting the wrong artist as established.
 if(o.details?.artists.length!==1||!o.details.genres.length)return true;
 const source=tasteThreads(o.details.genres),candidate=tasteThreads(a.genres.map(name=>({name})));
 return !source.size||!candidate.size||culturalOverlap([...source.keys()],candidate).some(t=>t.weight>=.75);
}
export const genreTags=(e:any)=>{
 const tags=(e.tags||[]).filter((t:any)=>/^urn:tag:(genre|subgenre)(:|$)/.test(t.tag_id||t.id||''));
 // Qloo returns distinct tag families. Do not append broad classifications that
 // contradict the artist's more specific genre list (e.g. a metal guitarist + Soul).
 const specific=tags.filter((t:any)=>!/^urn:tag:(genre|subgenre):qloo:/.test(t.tag_id||t.id||''));
 return [...new Set<string>((specific.length?specific:tags).map((t:any)=>t.name).filter((s:any)=>typeof s==='string'))].slice(0,12);
};
async function hydrate(m:ArtistMatch,key:string){try{const b=await qloo('/entities',{entity_ids:m.id},key);const e=(Array.isArray(b.results)?b.results:[]).find((e:any)=>String(e.entity_id).toLowerCase()===m.id.toLowerCase());return e?{...m,genres:genreTags(e)}:m;}catch{return m;}}
export const artistName=(s:string)=>s.normalize('NFKC').replace(/\s*\([^)]*\)\s*$/,'').replace(/^(GUEST|DJ|LIVE|出演)\s*[:：]\s*/i,'').trim().toLocaleLowerCase();
export function exactArtist(input:string,items:any[]):ArtistMatch|null{
 const hits=items.filter(e=>(e.types?.includes('urn:entity:artist')||e.subtype==='urn:entity:artist')&&[e.name,...(Array.isArray(e.properties?.akas)?e.properties.akas:[]).map((v:any)=>typeof v==='string'?v:v.value||v.name)].some(n=>typeof n==='string'&&artistName(n)===artistName(input))&&/^[0-9a-f-]{36}$/i.test(e.entity_id));
 const unique=[...new Map(hits.map(e=>[e.entity_id,e])).values()];if(unique.length!==1)return null;const e=unique[0];return {input,id:e.entity_id,name:e.name,genres:genreTags(e)};
}
export async function matchArtists(items:Opportunity[],key:string,read:(k:string)=>Promise<any>,write:(k:string,v:any)=>Promise<void>){
 const matches=new Map<string,ArtistMatch|null>(),pending:{name:string;n:string}[]=[],upgrade:{n:string;cached:any}[]=[];
 const names=[...new Map(items.flatMap(o=>(o.details?.artists||[]).map(name=>[artistName(name),name] as const))).entries()];
 for(const [n,name] of names){const cached=await read('artist:'+n);if(cached&&Date.now()-cached.at<7*86400000){matches.set(n,cached.match);if(cached.match&&cached.genreSchema!==2)upgrade.push({n,cached});}else if(pending.length<40)pending.push({name,n});}
 // Rehydrate old genre caches in bounded entity batches, not one API call per record.
 for(let i=0;i<upgrade.length;i+=10){const batch=upgrade.slice(i,i+10);try{const b=await qloo('/entities',{entity_ids:batch.map(x=>x.cached.match.id).join(',')},key);for(const x of batch){const e=(Array.isArray(b.results)?b.results:[]).find((e:any)=>String(e.entity_id).toLowerCase()===x.cached.match.id.toLowerCase());const m={...x.cached.match,genres:e?genreTags(e):[]};matches.set(x.n,m);if(e)await write('artist:'+x.n,{...x.cached,match:m,hydrated:true,genreSchema:2});}}catch{for(const x of batch)matches.set(x.n,{...x.cached.match,genres:[]});}}
 for(let i=0;i<pending.length;i+=4)await Promise.all(pending.slice(i,i+4).map(async({name,n})=>{try{const b=await qloo('/search',{query:name.replace(/\s*\([^)]*\)$/,''),types:'urn:entity:artist',take:'8'},key);const exact=exactArtist(name,Array.isArray(b.results)?b.results:[]);const m=exact?await hydrate(exact,key):null;matches.set(n,m);await write('artist:'+n,{at:Date.now(),match:m,hydrated:true,genreSchema:2});}catch{/* A temporary outage is not cached as a failed identity match. */}}));
 return items.map(o=>({...o,artists:(o.details?.artists||[]).flatMap(n=>{const k=artistName(n);if(matches.has(k))return matches.get(k)?[{...matches.get(k)!,input:n}]:[];return (o.artists||[]).filter(a=>artistName(a.input)===k);}).filter(a=>artistFitsProgramme(o,a))}));
}
export async function artistAffinities(items:Opportunity[],p:Preferences,key:string){
 if(!p.seeds.length||!items.some(o=>o.artists?.length))return items;
 const {scoreInventoryCandidates}=await import('./qloo-candidates.ts');
 const entities=items.flatMap(o=>(o.artists||[]).filter(a=>artistFitsProgramme(o,a)).map(a=>({id:a.id,name:a.name,type:'artist',input:a.input,evidence:'performer' as const})));
 const scored=await scoreInventoryCandidates(entities,p.seeds.map(s=>({id:s.id,name:s.name,weight:s.feeling==='love'?1:.4})),key,{maxBatches:12});
 return items.map(o=>{const evidence=scored.evidence.filter(e=>(o.artists||[]).some(a=>a.id.toLowerCase()===e.entityId.toLowerCase()));return {...o,qlooEvidence:evidence,signals:[...new Set([...(o.signals||[]),...evidence.flatMap(e=>e.contributors.map(c=>c.name))])]};});
}
