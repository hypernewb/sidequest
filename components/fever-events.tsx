'use client';
import {useState} from 'react';
import {ArrowUpRight,Bookmark,MapPin,X} from 'lucide-react';
import type {FeverEvent} from '@/lib/fever-data';

export function FeverEvents({events,saved,onSave,onPass,archived=false}:{events:FeverEvent[];saved:FeverEvent[];onSave:(event:FeverEvent)=>void;onPass:(event:FeverEvent)=>void;archived?:boolean}){
 const [open,setOpen]=useState<string|null>(null);
 if(!events.length)return null;
 const label=(session:string)=>new Intl.DateTimeFormat('en-GB',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Tokyo'}).format(new Date(session+'+09:00'))+' JST';
 return <section aria-label={archived?'Saved events':'Tokyo events'}>
  <div className="results-heading"><div><h2>{archived?'Dates to look forward to.':'On in Tokyo.'}</h2><p>{archived?'Saved Fever listings. Dates and prices may have changed.':'Live Fever listings for your dates and area. Not ranked by Qloo taste affinity.'}</p></div><span className="live-label">{archived?'Saved from Fever':'Fever'}</span></div>
  <div className="results-list">{events.map((e,index)=>{
   const isSaved=saved.some(x=>x.id===e.id),expanded=open===e.id;
   return <article className="place-row" key={e.id}><div className="place-index" aria-hidden="true">{String(index+1).padStart(2,'0')}</div><div className="place-content"><div className="place-meta"><span>Event · Fever</span><span><MapPin size={12}/>{e.location}</span></div><button className="place-title" aria-expanded={expanded} aria-controls={'detail-'+e.id} onClick={()=>setOpen(expanded?null:e.id)}><h3>{e.name}</h3><ArrowUpRight size={21}/></button><p className="place-reason">{e.sessions.slice(0,2).map(label).join(' / ')}</p><div className="place-foot"><span>{e.priceLabel}</span><span>Check ticket category and fees</span></div></div><div className="place-actions"><button className={'icon-button '+(isSaved?'is-saved':'')} aria-label={(isSaved?'Unsave ':'Save ')+e.name} aria-pressed={isSaved} onClick={()=>onSave(e)}><Bookmark size={19} fill={isSaved?'currentColor':'none'}/></button>{!archived&&<button className="pass-button" aria-label={'Pass on '+e.name} onClick={()=>onPass(e)}>Pass<X size={12}/></button>}</div>
    {expanded&&<section className="place-detail" id={'detail-'+e.id}><div><h4>About this event</h4><p>{e.description||'See the event page for the full description and entry requirements.'}</p><p className="address"><MapPin size={15}/>{e.location}</p><div className="detail-links"><a className="primary small" href={e.url} target="_blank" rel="noreferrer">See tickets on Fever<ArrowUpRight size={15}/></a></div></div><div className="detail-evidence"><h4>Published session starts</h4>{e.sessions.map(s=><p className="hours-row" key={s}>{label(s)}</p>)}<p className="evidence-note">Fever returns a partial session list. Availability is not guaranteed; check the full schedule and ticket conditions on Fever.</p><h4>Price & source</h4><p>{e.priceLabel}. {e.maxPrice!==null&&e.currency==='JPY'?`Listed ticket range up to ¥${e.maxPrice.toLocaleString('en-US')}. `:''}Starting prices can refer to a child or other ticket category. Booking fees may apply.</p><p className="source-stamp">Source: Fever · retrieved {new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',timeZone:'Asia/Tokyo'}).format(new Date(e.retrievedAt))}. This is a date and area match; no Qloo endorsement of this event is claimed.</p></div></section>}
   </article>;
  })}</div>
 </section>;
}
