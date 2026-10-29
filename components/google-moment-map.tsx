'use client';
import {useEffect,useRef,useState} from 'react';
import {googlePlace,located,type JourneyItem} from '@/lib/journey';
type GoogleWindow=Window & {google?:any;gm_authFailure?:()=>void;sidequestMapsReady?:()=>void};
let loading:Promise<any>|undefined;
function loadMaps(key:string){
 const w=window as GoogleWindow;
 if(w.google?.maps?.marker?.AdvancedMarkerElement)return Promise.resolve(w.google);
 if(loading)return loading;
 loading=new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(Error('Google Maps timed out.')),12000);
  const fail=()=>{clearTimeout(timer);reject(Error('Google Maps access was not accepted.'));window.dispatchEvent(new Event('sidequest-map-auth-failed'));};
  w.gm_authFailure=fail;
  w.sidequestMapsReady=()=>{clearTimeout(timer);resolve(w.google);};
  const script=document.createElement('script');script.async=true;script.onerror=fail;
  script.src='https://maps.googleapis.com/maps/api/js?'+new URLSearchParams({key,v:'weekly',libraries:'marker',loading:'async',callback:'sidequestMapsReady',auth_referrer_policy:'origin'});
  document.head.appendChild(script);
 });
 return loading;
}
export function GoogleMomentMap({browserKey,items,selected,onSelect,onFailure}:{browserKey:string;items:JourneyItem[];selected:string[];onSelect:(item:JourneyItem)=>void;onFailure:()=>void}){
 const canvas=useRef<HTMLDivElement>(null),map=useRef<any>(null),google=useRef<any>(null),markers=useRef<any[]>([]),boundsSignature=useRef(''),select=useRef(onSelect),failure=useRef(onFailure),[ready,setReady]=useState(false);
 select.current=onSelect;failure.current=onFailure;
 const pinned=items.filter((o):o is JourneyItem&{lat:number;lon:number}=>located(o)),online=items.filter(o=>o.online).length,missing=items.length-online-pinned.length;
 useEffect(()=>{
  let cancelled=false;
  const failed=()=>{if(!cancelled)failure.current();};window.addEventListener('sidequest-map-auth-failed',failed);
  loadMaps(browserKey).then(g=>{if(cancelled||!canvas.current)return;google.current=g;map.current=new g.maps.Map(canvas.current,{center:{lat:35.6762,lng:139.7006},zoom:12,mapId:'DEMO_MAP_ID',gestureHandling:'cooperative',mapTypeControl:false,streetViewControl:false});setReady(true);}).catch(failed);
  return()=>{cancelled=true;window.removeEventListener('sidequest-map-auth-failed',failed);markers.current.forEach(m=>{m.map=null;});if(map.current&&google.current)google.current.maps.event.clearInstanceListeners(map.current);map.current=null;};
 },[browserKey]);
 useEffect(()=>{
  if(!ready||!map.current)return;const g=google.current,instance=map.current;
  markers.current.forEach(m=>{m.map=null;});markers.current=[];
  const groups=new Map<string,typeof pinned>();for(const o of pinned){const key=o.lat+','+o.lon;groups.set(key,[...(groups.get(key)||[]),o]);}
  const bounds=new g.maps.LatLngBounds(),info=new g.maps.InfoWindow();
  for(const group of groups.values()){
   const first=group[0],position={lat:first.lat,lng:first.lon};bounds.extend(position);
   const pin=document.createElement('div');pin.className='moment-google-pin'+(group.some(o=>selected.includes(o.id))?' in-plan':'');pin.textContent=String(group.length);
   const marker=new g.maps.marker.AdvancedMarkerElement({map:instance,position,title:group.length+' finds · '+first.location,content:pin,gmpClickable:true});
   marker.addListener('click',()=>{
    const content=document.createElement('div');content.className='moment-map-popup';const venue=document.createElement('strong');venue.textContent=first.location;content.appendChild(venue);
    for(const item of group){const row=document.createElement('div'),title=document.createElement('p'),button=document.createElement('button');title.textContent=item.title;button.type='button';button.textContent=selected.includes(item.id)?'Remove from my day':'Add to my day';button.addEventListener('click',()=>select.current(item));row.appendChild(title);row.appendChild(button);content.appendChild(row);}
    const url=googlePlace(first);if(url){const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noreferrer';link.textContent='Open venue in Google Maps';content.appendChild(link);}
    info.setContent(content);info.open({map:instance,anchor:marker});
   });markers.current.push(marker);
  }
  const signature=[...groups.keys()].sort().join('|');
  if(pinned.length&&signature!==boundsSignature.current){instance.fitBounds(bounds,40);boundsSignature.current=signature;}
  return()=>info.close();
 },[items,selected,ready]);
 return <section className="moment-map-section" aria-label="Finds on Google Maps"><div className="journey-heading"><div><h2>See what’s near what.</h2><p>{pinned.length} current finds and chosen stops with published coordinates. Select a pin to choose a stop.</p></div><a href="#my-day">My day ({selected.length})</a></div><div ref={canvas} className="moment-map-canvas" role="region" aria-label="Google map of current finds" tabIndex={0}/>{!ready&&<p role="status">Opening Google Maps…</p>}<p className="journey-note">Pins group finds at the same venue. {missing>0?`${missing} in-person finds still need confirmed coordinates and remain in the list. `:''}{online>0?`${online} online finds stay off the map.`:''} Choose your stops, then open the route in Google Maps.</p></section>;
}
