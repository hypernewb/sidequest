import {distance} from './discovery.ts';
// Discovery districts are broad buckets, not proof that every pair is walkable.
// Anchor locations correspond to Little Soul, Gallery Conceal, ICC and SCAI.
export const NEIGHBORHOODS=[
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
