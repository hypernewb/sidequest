'use client';
import {useEffect,useRef,useState} from 'react';
import type {Map as LeafletMap} from 'leaflet';
import {googlePlace,located,type JourneyItem} from '@/lib/journey';
import 'leaflet/dist/leaflet.css';
import {GoogleMomentMap} from './google-moment-map';
type MapProps={items:JourneyItem[];selected:string[];onSelect:(item:JourneyItem)=>void};
function OpenMomentMap({items,selected,onSelect}:MapProps){
 const canvas=useRef<HTMLDivElement>(null),map=useRef<LeafletMap|null>(null),[error,setError]=useState(''),[ready,setReady]=useState(false);
 const pinned=items.filter((o):o is JourneyItem & {lat:number;lon:number}=>located(o)),online=items.filter(o=>o.online).length,missing=items.length-online-pinned.length;
 useEffect(()=>{
  let cancelled=false;let observer:ResizeObserver|undefined;setReady(false);setError('');
  void import('leaflet').then(L=>{
   if(cancelled||!canvas.current)return;
   const instance=L.map(canvas.current,{scrollWheelZoom:false}).setView([35.6762,139.7006],12);map.current=instance;
   L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'}).addTo(instance).on('tileerror',()=>{if(!cancelled)setError('Some map tiles could not load. Use the location links below.');});
   const groups=new Map<string,typeof pinned>();for(const item of pinned){const key=item.lat+','+item.lon;groups.set(key,[...(groups.get(key)||[]),item]);}
   for(const group of groups.values()){
    const first=group[0],inPlan=group.some(o=>selected.includes(o.id));
    const icon=L.divIcon({className:'moment-map-marker'+(inPlan?' in-plan':''),html:`<span>${group.length}</span>`,iconSize:[38,38],iconAnchor:[19,19]});
    const content=document.createElement('div');content.className='moment-map-popup';
    const venue=document.createElement('strong');venue.textContent=first.location;content.appendChild(venue);
    for(const item of group){const row=document.createElement('div'),title=document.createElement('p'),button=document.createElement('button');title.textContent=item.title;button.type='button';button.textContent=selected.includes(item.id)?'Remove from my day':'Add to my day';button.addEventListener('click',()=>onSelect(item));row.appendChild(title);row.appendChild(button);content.appendChild(row);}
    const url=googlePlace(first);if(url){const link=document.createElement('a');link.textContent='Open venue in Google Maps';link.href=url;link.target='_blank';link.rel='noreferrer';content.appendChild(link);}
    L.marker([first.lat,first.lon],{icon,title:group.length+' finds · '+first.location,keyboard:true}).addTo(instance).bindPopup(content,{maxWidth:310,maxHeight:320});
   }
   if(pinned.length)instance.fitBounds(pinned.map(p=>[p.lat,p.lon] as [number,number]),{maxZoom:15,padding:[30,30],animate:false});
   observer=new ResizeObserver(()=>instance.invalidateSize({animate:false}));observer.observe(canvas.current);setReady(true);
  }).catch(()=>{if(!cancelled)setError('The map could not open. Use the Google Maps links on each find.');});
  return()=>{cancelled=true;observer?.disconnect();map.current?.remove();map.current=null;};
 },[items,selected,onSelect]);
 return <section className="moment-map-section" aria-label="Finds on a map"><div className="journey-heading"><div><h2>See what’s near what.</h2><p>{pinned.length} current finds and chosen stops with published coordinates. Select a pin to choose a stop.</p></div><a href="#my-day">My day ({selected.length})</a></div><div ref={canvas} className="moment-map-canvas" role="region" aria-label="Interactive map of current finds" tabIndex={0}/>{!ready&&!error&&<p role="status">Opening the map…</p>}{error&&<p role="status">{error}</p>}<p className="journey-note">Pins with a number group finds at the same venue. {missing>0?`${missing} in-person finds have no confirmed coordinates and remain in the list. `:''}{online>0?`${online} online finds have no physical pin.`:''} Map by OpenStreetMap. Open individual venues or your route in Google Maps.</p></section>;
}

export function MomentMap(props:MapProps){
 const [key,setKey]=useState<string|null|undefined>(undefined),[failed,setFailed]=useState(false);
 useEffect(()=>{const c=new AbortController();fetch('/api/map-config',{signal:c.signal}).then(r=>r.ok?r.json() as Promise<{browserKey?:string|null}>:null).then(b=>{if(!c.signal.aborted)setKey(typeof b?.browserKey==='string'?b.browserKey:null);}).catch(()=>{if(!c.signal.aborted)setKey(null);});return()=>c.abort();},[]);
 if(key===undefined)return <p role="status">Opening your discovery map…</p>;
 return <>{failed&&<p role="status">Google Maps could not load. Showing the alternative map; your Google Maps route links still work.</p>}{key&&!failed?<GoogleMomentMap {...props} browserKey={key} onFailure={()=>setFailed(true)}/>:<OpenMomentMap {...props}/>}</>;
}
