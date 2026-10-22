'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {Map as MapIcon,RotateCcw,ArrowUpRight,ChevronDown} from 'lucide-react';
import type {Map as LeafletMap,Marker} from 'leaflet';
import type {Place} from '@/lib/discovery';
import type {FeverEvent} from '@/lib/fever-data';
import {discoveryPoints,type MapPoint} from '@/lib/map-data';

function MapCanvas({points}:{points:MapPoint[]}){
 const container=useRef<HTMLDivElement>(null),map=useRef<LeafletMap|null>(null),markers=useRef(new Map<string,Marker>());
 const [error,setError]=useState(''),[ready,setReady]=useState(false),[selected,setSelected]=useState<string|null>(null);
 useEffect(()=>{
  let stopped=false,observer:ResizeObserver|undefined;
  void import('leaflet').then(L=>{
   if(stopped||!container.current)return;
   const instance=L.map(container.current,{scrollWheelZoom:false,keyboard:true}).setView([35.6762,139.7006],12);map.current=instance;
   const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>'}).addTo(instance);
   tiles.on('tileerror',()=>{if(!stopped)setError('Some map tiles could not load. Pins and the location links below are still available.');});
   const bounds=L.latLngBounds(points.map(p=>[p.lat,p.lon] as [number,number]));
   points.forEach(p=>{
    const icon=L.divIcon({className:'quest-pin '+p.kind,html:`<span>${p.label}</span>`,iconSize:[40,40],iconAnchor:[20,20]});
    const marker=L.marker([p.lat,p.lon],{icon,title:p.label+' · '+p.name,alt:p.name,keyboard:true}).addTo(instance);
    const content=document.createElement('div');content.className='map-popup';
    const heading=document.createElement('strong');heading.textContent=p.name;
    const detail=document.createElement('p');detail.textContent=p.detail;
    const source=document.createElement('p');source.textContent=p.kind==='place'?'Place · Qloo record':'Event · Fever venue';
    const link=document.createElement('a');link.textContent=p.kind==='place'?'Open in OpenStreetMap':'See event on Fever';link.href=p.url;link.target='_blank';link.rel='noreferrer';
    for(const child of [heading,detail,source,link])content.appendChild(child);marker.bindPopup(content,{maxWidth:260});marker.on('click',()=>setSelected(p.id));markers.current.set(p.id,marker);
   });
   instance.fitBounds(bounds,{padding:[36,36],maxZoom:15,animate:false});
   observer=new ResizeObserver(()=>{instance.invalidateSize({animate:false});instance.fitBounds(bounds,{padding:[36,36],maxZoom:15,animate:false});});observer.observe(container.current);
   setReady(true);
  }).catch(()=>{if(!stopped)setError('The map could not open. Use the location links below.');});
  return()=>{stopped=true;observer?.disconnect();map.current?.remove();map.current=null;markers.current.clear();};
 },[points]);
 function focus(p:MapPoint){setSelected(p.id);map.current?.setView([p.lat,p.lon],15,{animate:false});markers.current.get(p.id)?.openPopup();}
 function reset(){if(!map.current)return;map.current.closePopup();map.current.fitBounds(points.map(p=>[p.lat,p.lon] as [number,number]),{padding:[36,36],maxZoom:15,animate:false});setSelected(null);}
 return <><div className="map-toolbar"><p><span className="map-key place"/>Places · Qloo <span className="map-key event"/>Events · Fever</p><button className="text-button" disabled={!ready} onClick={reset}><RotateCcw size={14}/>Fit all pins</button></div><div className="quest-map" ref={container} role="region" aria-label="Interactive Tokyo discovery map" tabIndex={0}/>{!ready&&!error&&<p className="map-note" role="status">Opening your Tokyo map…</p>}{error&&<p className="map-note" role="status">{error}</p>}<div className="map-locations" aria-label="Map locations">{points.map(p=><div key={p.id}><button className={selected===p.id?'is-selected':''} onClick={()=>focus(p)} aria-pressed={selected===p.id}><span className={'map-list-label '+p.kind}>{p.label}</span><span>{p.name}</span></button><a href={p.url} target="_blank" rel="noreferrer" aria-label={(p.kind==='place'?'Open map for ':'See Fever listing for ')+p.name}><ArrowUpRight size={17}/></a></div>)}</div></>;
}
export function DiscoveryMap({places,events}:{places:Place[];events:FeverEvent[]}){
 const [open,setOpen]=useState(false);
 const points=useMemo(()=>discoveryPoints(places,events),[places,events]);
 const signature=points.map(p=>p.id+':'+p.lat+':'+p.lon).join('|');
 const missing=places.length+events.length-points.length;
 if(!places.length&&!events.length)return null;
 return <section className="discovery-map" aria-label="Discovery map"><button className="map-toggle" aria-expanded={open} aria-controls="discovery-map-content" onClick={()=>setOpen(!open)}><MapIcon size={19}/><span>{open?'Hide map':'See your discoveries on a map'}</span><span className="map-count">{points.length} {points.length===1?'pin':'pins'}</span><ChevronDown size={17} className={open?'rotate':''}/></button>{open&&<div id="discovery-map-content"><p className="map-note">Pins use coordinates supplied by Qloo or a confirmed Fever venue. {missing>0?`${missing} ${missing===1?'listing has':'listings have'} no confirmed coordinates and ${missing===1?'stays':'stay'} in the list below.`:'Select a pin or a name to take a closer look.'}</p>{points.length?<MapCanvas key={signature} points={points}/>:<p className="map-note">No confirmed coordinates in this selection. Venue details are available in the listings below.</p>}</div>}</section>;
}
