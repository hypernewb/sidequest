'use client';
import {useEffect,useRef,useState} from 'react';
import type {Preferences} from '@/lib/opportunities';
import type {ScoutPlan} from '@/lib/scout';

export function ScoutPanel({preferences}:{preferences:Preferences}){
 const [plan,setPlan]=useState<ScoutPlan|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const request=useRef<AbortController|null>(null),key=JSON.stringify(preferences);
 useEffect(()=>{setPlan(null);setError('');setBusy(false);request.current?.abort();return()=>request.current?.abort();},[key]);
 async function dispatch(){request.current?.abort();const c=new AbortController();request.current=c;setBusy(true);setError('');setPlan(null);
  try{const r=await fetch('/api/scout',{method:'POST',headers:{'Content-Type':'application/json'},body:key,signal:c.signal});const b=await r.json() as ScoutPlan & {error?:string};if(!r.ok)throw Error(b.error||'The scout could not finish.');if(!c.signal.aborted)setPlan(b);}catch(e){if(!c.signal.aborted)setError(e instanceof Error?e.message:'The scout could not finish.');}finally{if(!c.signal.aborted)setBusy(false);}
 }
 return <section className="scout-panel" aria-label="SideQuest Agent"><h2>Make an afternoon of it</h2><p>Your activity, taste and price choices become a route of two or three nearby places. The scout checks Tokyo time and published weekly hours for the selected starting date.</p><button className="primary" disabled={busy} onClick={()=>void dispatch()}>{busy?'Checking taste, hours & nearby stops…':'Dispatch SideQuest Agent'}</button>{busy&&<button onClick={()=>{request.current?.abort();setBusy(false);}}>Cancel scout</button>}{error&&<p role="alert">{error}</p>}
 {plan&&<div aria-live="polite"><p>Tokyo now: {plan.tokyoNow} JST. Route date: {plan.date}.</p><p>{plan.brief}</p><ol>{plan.stops.map(s=><li key={s.item.id}><h3>{s.arrival}–{s.departure} · {s.item.title}</h3><p>{s.item.category} · {s.item.location}</p><p>{s.reason}</p><p>Published hours: {s.hours} JST. {s.travelMinutes?`Allow ${s.travelMinutes} minutes from the previous stop (${s.distanceMetres} m straight-line).`:'Start here. Travel to the first stop is not included.'}</p><a href={s.item.url} target="_blank" rel="noreferrer">Check venue & reservations ↗</a></li>)}</ol>{plan.map&&<a href={plan.map} target="_blank" rel="noreferrer">Open the walking route in Maps ↗</a>}<details><summary>What the scout checked</summary><p>{plan.examined} places inspected. {plan.eligible} passed taste, geography, hours and price checks.</p>{plan.notes.map(n=><p key={n}>{n}</p>)}<p>Checked at {plan.checkedAt}. These are venue visits, with no confirmed event or stock claim.</p></details></div>}
 </section>;
}

