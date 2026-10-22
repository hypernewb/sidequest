import type {Place} from './discovery.ts';
import type {FeverEvent} from './fever-data.ts';
export type MapPoint={id:string;name:string;lat:number;lon:number;kind:'place'|'event';label:string;detail:string;url:string};
function valid(lat:unknown,lon:unknown):lat is number{return typeof lat==='number'&&typeof lon==='number'&&Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180;}
export function discoveryPoints(places:Place[],events:FeverEvent[]):MapPoint[]{
 const points:MapPoint[]=[];
 places.forEach((p,i)=>{if(valid(p.lat,p.lon))points.push({id:p.id,name:p.name,lat:p.lat,lon:p.lon,kind:'place',label:'P'+(i+1),detail:p.address||p.area,url:`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=17/${p.lat}/${p.lon}`});});
 events.forEach((e,i)=>{if(valid(e.coordinates?.lat,e.coordinates?.lon))points.push({id:e.id,name:e.name,lat:e.coordinates!.lat,lon:e.coordinates!.lon,kind:'event',label:'E'+(i+1),detail:e.location,url:e.url});});
 return points;
}
