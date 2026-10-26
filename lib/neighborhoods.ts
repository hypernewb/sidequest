import {distance} from './discovery.ts';
// Discovery districts are broad buckets, not proof that every pair is walkable.
// Anchor locations correspond to Little Soul, Gallery Conceal, ICC and SCAI.
export const NEIGHBORHOODS=[
 {id:'akihabara',name:'Akihabara',lat:35.699072,lon:139.770917},
 {id:'koenji',name:'Koenji',lat:35.703501,lon:139.648746},
 {id:'shimokitazawa',name:'Shimokitazawa',lat:35.6632,lon:139.6693},
 {id:'shibuya',name:'Shibuya / Daikanyama',lat:35.6576,lon:139.6988},
 {id:'shinjuku',name:'Shinjuku / Hatagaya',lat:35.6830,lon:139.6868},
 {id:'yanaka',name:'Yanaka / Ueno',lat:35.7218,lon:139.7705}
] as const;
export function neighborhood(lat:number,lon:number){
 if(!Number.isFinite(lat)||!Number.isFinite(lon))return null;
 const nearest=NEIGHBORHOODS.map(n=>({...n,distance:distance(lat,lon,n.lat,n.lon)})).sort((a,b)=>a.distance-b.distance)[0];
 return nearest.distance<=2500?{id:nearest.id,name:nearest.name}:null;
}
export function sameNeighborhood(points:{lat?:number;lon?:number}[]){const ids=points.map(p=>neighborhood(p.lat!,p.lon!)?.id||null);return ids.every(id=>id===ids[0]);}
// Direct, no-transfer links between scout districts. Ride minutes are typical timetable values, not live data.
const st=(name:string,lat:number,lon:number)=>({name,lat,lon});
export const RAIL_LINKS=[
 {line:'Keio Inokashira Line',a:st('Shimokitazawa',35.6616,139.6681),b:st('Shibuya',35.6590,139.6986),minutes:7},
 {line:'Odakyu Line',a:st('Shimokitazawa',35.6616,139.6681),b:st('Shinjuku',35.6896,139.7006),minutes:8},
 {line:'JR Yamanote Line',a:st('Shibuya',35.6580,139.7016),b:st('Shinjuku',35.6896,139.7006),minutes:7},
 {line:'JR Chuo-Sobu Line',a:st('Koenji',35.7054,139.6496),b:st('Shinjuku',35.6896,139.7006),minutes:10},
 {line:'Keio New Line',a:st('Hatagaya',35.6773,139.6764),b:st('Shinjuku',35.6896,139.7006),minutes:5},
 {line:'JR Yamanote Line',a:st('Nippori',35.7280,139.7709),b:st('Akihabara',35.6984,139.7731),minutes:8},
 {line:'JR Yamanote Line',a:st('Ueno',35.7141,139.7774),b:st('Akihabara',35.6984,139.7731),minutes:4}
] as const;
