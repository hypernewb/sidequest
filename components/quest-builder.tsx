'use client';
import {useEffect,useRef,useState} from 'react';
import type {Quest} from '@/lib/quests';
import {writeBrowserTaste} from '@/lib/browser-taste';
import {focusLabels,focusQuestion,type QuestFocus} from '@/lib/quest-focus';
import type {EventLead} from '@/lib/quest-event-matching';
import QuestRun from './quest-run';
import {readQuestRun,type RunEvent,type QuestReply} from '@/lib/quest-run';
import {questShareText} from '@/lib/quest-share';
const roleLabels={coffee:'Coffee break',books:'Off the shelf',dig:'In the racks',art:'Look closer',listen:'Stay for the selection',play:'Take a turn'};
import {englishPrice} from '@/lib/event-english';
import {safeUrl,tokyoDate} from '@/lib/discovery';
import '@/app/opportunities.css';

type Choice={id:string;name:string;type:string;description?:string};
type DispersionMode = 'direct' | 'detour' | 'wild';

const GOLDEN_SEEDS = ['Haruki Murakami', 'Yellow Magic Orchestra', 'Wong Kar-wai', 'Isamu Noguchi'];

export default function QuestBuilder(){
 const [seed,setSeed]=useState(''),[quest,setQuest]=useState<Quest|null>(null),[choices,setChoices]=useState<Choice[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[date,setDate]=useState(''),[budget,setBudget]=useState('any'),[unknown,setUnknown]=useState(true),[status,setStatus]=useState(''),[saved,setSaved]=useState<Quest[]>([]),[showSaved,setShowSaved]=useState(false);
 const [dispersion,setDispersion]=useState<DispersionMode>('detour');
 const [events,setEvents]=useState<RunEvent[]>([]),[shareText,setShareText]=useState(''),[sharing,setSharing]=useState(false),[shareTitle,setShareTitle]=useState(''),[shareStatus,setShareStatus]=useState(''),[canShare,setCanShare]=useState(false);
 const [question,setQuestion]=useState<QuestReply['question']>(),[resolved,setResolved]=useState<QuestReply['resolved']>(),[focus,setFocus]=useState<QuestFocus>(),[leads,setLeads]=useState<EventLead[]>([]);
 const request=useRef<AbortController|null>(null),result=useRef<HTMLElement|null>(null),runPanel=useRef<HTMLElement|null>(null),sharePanel=useRef<HTMLElement|null>(null),shareCopy=useRef<HTMLTextAreaElement|null>(null);
 
 useEffect(()=>{setCanShare(typeof navigator.share==='function');},[]);
 useEffect(()=>{if(shareText)sharePanel.current?.scrollIntoView({block:'start'});},[shareText]);
 useEffect(()=>{if(busy)runPanel.current?.scrollIntoView({block:"start"});},[busy]);
 useEffect(()=>{if(quest)result.current?.scrollIntoView({block:"start"});},[quest]);
 useEffect(()=>{
   try{
     const s=JSON.parse(localStorage.getItem('sidequest-quests-v1')||'[]');
     if(Array.isArray(s))setSaved(s.filter(v=>v&&typeof v.title==='string'&&typeof v.seed?.id==='string'&&Array.isArray(v.notes)&&v.notes.every((n:unknown)=>typeof n==='string')&&Array.isArray(v.stops)&&v.stops.length<=3&&v.stops.every((s:Quest['stops'][number])=>s&&typeof s.mission==='string'&&typeof s.item?.id==='string'&&/^https:\/\//.test(s.item.url))).slice(0,20));
   }catch{
     setStatus('Browser saves are unavailable. You can still plan a quest.');
   }
   return()=>request.current?.abort();
 },[]);

 function reset(){request.current?.abort();setBusy(false);setQuest(null);setChoices([]);setError('');setEvents([]);setShareText('');setQuestion(undefined);setLeads([]);}
 function cancel(){request.current?.abort();setBusy(false);setEvents(v=>v.length?[...v,{...v.at(-1)!,status:'cancelled',detail:'Stopped. Your seed is kept.',at:new Date().toISOString()}]:v);}
 
 async function dispatch(choice?:string,another=false,answer?:QuestFocus){
   const selectedFocus=answer??focus;
   if(answer)setFocus(answer);
   setQuestion(undefined);
   setLeads([]);
   request.current?.abort();
   const c=new AbortController();
   request.current=c;
   setStatus('');
   setEvents([]);
   setShareText('');
   setBusy(true);
   setError('');
   setChoices([]);
   setShowSaved(false);
   const old=quest;
   setQuest(null);
   try{
     const r=await fetch('/api/quests',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/x-ndjson'},body:JSON.stringify({seed,choice,askFollowup:selectedFocus===undefined,focus:selectedFocus,date:date||undefined,budget,unknownPrice:unknown,exclude:another?old?.stops.map(s=>s.item.id):[]}),signal:c.signal});
     const b=await readQuestRun(r,event=>{if(!c.signal.aborted)setEvents(v=>[...v,event].slice(-160));});
     if(!c.signal.aborted){
       if(b.quest?.seed){try{writeBrowserTaste(localStorage,[{id:b.quest.seed.id,name:b.quest.seed.name,type:b.quest.seed.type,feeling:'love'}]);}catch{}}
       setQuest(b.quest||null);
       setChoices(b.choices||[]);
       setQuestion(b.question);
       setResolved(b.resolved);
       setLeads(b.leads||[]);
       if(!b.quest&&!b.question)setError(b.message||'Try another name.');
     }
   }catch(e){
     if(!c.signal.aborted)setError(e instanceof Error?e.message:'Try again.');
   }finally{
     if(!c.signal.aborted)setBusy(false);
   }
 }

 function save(q:Quest){
   const next=[q,...saved.filter(s=>s.seed.id!==q.seed.id||s.date!==q.date)].slice(0,20);
   setSaved(next);
   try{localStorage.setItem('sidequest-quests-v1',JSON.stringify(next));setStatus('Quest saved in this browser. Check the hours again before you go.');}catch{setStatus('Kept for this session. Browser storage is unavailable.');}
 }
 function share(q:Quest){setShareTitle(q.title);setShareText(questShareText(q));setShareStatus('');}
 async function copyShare(){
   shareCopy.current?.focus();shareCopy.current?.select();
   setShareStatus('Itinerary selected. You can copy it manually if your browser does not copy automatically.');
   try{if(!navigator.clipboard?.writeText)return;await navigator.clipboard.writeText(shareText);setShareStatus('Itinerary and map copied. Paste them into a message.');}catch{setShareStatus('Use Copy or Ctrl+C to copy the selected itinerary.');}
 }
 async function deviceShare(){
   if(!navigator.share)return;
   setSharing(true);
   setShareStatus('Use your device’s share options, or copy the itinerary below.');
   try{await navigator.share({title:shareTitle,text:shareText});setShareStatus('Quest shared.');}catch(e){setShareStatus(e instanceof Error&&e.name==='AbortError'?'Device sharing cancelled. You can still copy the itinerary.':'Device sharing is unavailable. Copy the itinerary below.');}finally{setSharing(false);}
 }

 const display=showSaved?saved:quest?[quest]:[];

 return <div className="outing quest-page">
   <header>
     <a href="/" className="outing-logo">SideQuest<span style={{color:'#b83b2b'}}>.</span> <small style={{fontFamily:'sans-serif',fontSize:'12px',color:'#62665c',border:'1px solid #d8d8ca',padding:'2px 8px',borderRadius:'12px'}}>Tokyo 2026</small></a>
     <nav>
       <button onClick={()=>setShowSaved(false)}>Find a quest</button>
       <button onClick={()=>setShowSaved(v=>!v)}>Saved quests ({saved.length})</button>
       <a href="/explore">Events & drops</a>
       <a href="/explore?format=drops">Browse drops</a>
     </nav>
   </header>

   <main>
     <p className="outing-kicker">VOL. 07 · POCKET ALLEYS SERIES</p>
     <h1>Tuned to your obsessions, <em style={{fontStyle:'italic',color:'#b83b2b'}}>mapped to Tokyo alleys.</em></h1>
     <p className="outing-intro">An algorithmic field companion linking authors, sounds, and architecture to hyper-local Tokyo coordinates.</p>

     <form className="quest-start" onSubmit={e=>{e.preventDefault();void dispatch();}}>
       <label htmlFor="quest-seed" style={{fontWeight:600,letterSpacing:'0.04em'}}>TASTE SPARK & SEEDS</label>
       <div className="quest-seed-row">
         <input id="quest-seed" value={seed} onChange={e=>{reset();setFocus(undefined);setSeed(e.target.value);}} placeholder="Enter an artist, author, or director (e.g. Haruki Murakami, Ryuichi Sakamoto)" maxLength={80} autoComplete="off" required minLength={2}/>
         <button className="primary" disabled={busy||seed.trim().length<2}>
           {busy?'Checking the route…':'Dispatch SideQuest Agent →'}
         </button>
       </div>
     </form>

     <div className="quest-seeds-pills">
       <span className="quest-seeds-label">TASTE SEEDS:</span>
       {GOLDEN_SEEDS.map(v=>(
         <button key={v} type="button" className="quest-seed-chip" onClick={()=>{reset();setFocus(undefined);setSeed(v);}}>
           + {v}
         </button>
       ))}
     </div>

     <div className="quest-dial" role="group" aria-label="Cultural Dispersion Dial">
       <div className="quest-dial-header">
         <div className="quest-dial-title">
           <span>🧭</span>
           <span>Cultural Dispersion Dial</span>
         </div>
         <span className="quest-dial-entropy">Entropy: {dispersion==='direct'?'Tight Orbit':dispersion==='detour'?'Balanced Detour':'Lateral Drift'}</span>
       </div>
       <div className="quest-dial-options">
         <button type="button" className={`quest-dial-btn ${dispersion==='direct'?'selected':''}`} onClick={()=>setDispersion('direct')}>
           <strong>Tight Orbit</strong>
           <small>Direct matches & immediate haunts</small>
         </button>
         <button type="button" className={`quest-dial-btn ${dispersion==='detour'?'selected':''}`} onClick={()=>setDispersion('detour')}>
           <strong>Curious Detour</strong>
           <small>Cross-domain taste affinity</small>
         </button>
         <button type="button" className={`quest-dial-btn ${dispersion==='wild'?'selected':''}`} onClick={()=>setDispersion('wild')}>
           <strong>Wild Drift</strong>
           <small>High surprise & lateral drift</small>
         </button>
       </div>
     </div>

     <details className="quest-options">
       <summary>Filter by date or price limit?</summary>
       <label>Visit date
         <input type="date" min={tokyoDate()} value={date} onChange={e=>{reset();setDate(e.target.value);}}/>
       </label>
       <p>Leave blank. Tokyo time decides when to go.</p>
       <label>Price limit per stop
         <select value={budget} onChange={e=>{reset();setBudget(e.target.value);}}>
           <option value="any">No limit set</option>
           <option value="1000">¥1,000</option>
           <option value="3000">¥3,000</option>
           <option value="10000">¥10,000</option>
         </select>
       </label>
       {budget!=='any'&&<label><input type="checkbox" checked={unknown} onChange={e=>{reset();setUnknown(e.target.checked);}}/> Include places where the price needs checking</label>}
     </details>

     {question&&<section className="quest-question" aria-label="Choose a direction">
       <p>You picked {question.seed}.</p>
       <h2>{question.prompt}</h2>
       <div className="outing-actions">
         {question.options.map(o=><button key={o.id} onClick={()=>void dispatch(resolved?.id,false,o.id)}>{o.label}</button>)}
       </div>
       <button className="quest-skip" onClick={()=>void dispatch(resolved?.id,false,'any')}>Surprise me. Follow the seed.</button>
     </section>}

     {focus&&quest&&<p className="quest-direction">{focus==='any'?'Following your seed':`Looking for ${focusLabels[focus].toLowerCase()}`} <button onClick={()=>{reset();setFocus(undefined);setQuestion(focusQuestion(quest.seed));setResolved(quest.seed);}}>Change direction</button></p>}

     {(busy||events.length>0&&!quest&&!question&&!choices.length)&&<QuestRun panelRef={runPanel} events={events} busy={busy} seed={seed} onCancel={cancel}/>}
     {error&&<p role="alert">{error}</p>}
     {choices.length>0&&<div className="outing-actions">{choices.map(c=><button key={c.id} onClick={()=>void dispatch(c.id)}>{c.name} · {c.type}{c.description&&<small className="quest-choice-note">{c.description}</small>}</button>)}</div>}
     {status&&<p role="status">{status}</p>}

     {showSaved&&!saved.length&&<p>Save a quest after scouting an afternoon.</p>}

     {display.map((q,i)=><article ref={i===0?result:undefined} aria-label={q.title} className="quest-brief" key={q.seed.id+q.date+i}>
       <div className="quest-dossier-label">
         <span>AUTONOMOUS FIELD MISSION · {q.neighborhood?.name||'Tokyo'}</span>
         <span>{q.stops.length===1?'One place to try':q.stops.length?'Ready to walk':'No route verified'}</span>
       </div>
       <p className="outing-kicker">{q.seed.name} · {q.date} · {q.stops.length?`${q.stops.length} ${q.stops.length===1?'stop':'stops'}`:'No route verified'}</p>
       <h2>{q.stops.length?q.title:'That afternoon needs another lead'}</h2>
       <p className="quest-vibe">{q.vibe}</p>
       <p className="quest-invitation">{q.invitation}</p>

       {q.stops.length > 0 && (
         <div className="quest-vital-metrics">
           <div className="quest-metric-card">
             <strong>{(q.stops.length * 0.6).toFixed(1)} km</strong>
             <small>Total Walk</small>
           </div>
           <div className="quest-metric-card">
             <strong>{q.stops.length} Coordinates</strong>
             <small>Sequential Stops</small>
           </div>
           <div className="quest-metric-card">
             <strong>{q.stops[0]?.arrival || '18:30'}–{q.stops[q.stops.length-1]?.departure || '22:00'} JST</strong>
             <small>Time Window</small>
           </div>
           <div className="quest-metric-card">
             <strong>{q.neighborhood?.name || 'Tokyo'} Stn</strong>
             <small>Transit Anchor</small>
           </div>
         </div>
       )}

       {q.catalogNote&&<p>{q.catalogNote}</p>}

       {q.stops.length>0&&<ol className="quest-stops">
         {q.stops.map((s,n)=><li key={s.item.id}>
           <p className="outing-meta">{s.arrival}–{s.departure} JST {s.travelMinutes?`· Allow ${s.travelMinutes} minutes from the last stop${s.transit?' · Train: '+s.transit:''}`:'· Meet the afternoon here'}</p>
           <p className="quest-chapter">{s.item.curation?roleLabels[s.item.curation.role]:`Stop ${n+1}`}</p>
           <h3>{s.item.title}</h3>
           <p className="quest-mission">{s.mission}</p>
           
           {!!s.item.curation?.doorNotes.length&&(
             <div className="quest-tactical-notes">
               <div className="quest-tactical-label">🔑 TACTICAL DOOR NOTES</div>
               <ul>
                 {s.item.curation.doorNotes.map(note=><li key={note}>{note}</li>)}
               </ul>
             </div>
           )}

           {s.programme&&<p><a href={safeUrl(s.programme.url)||undefined} target="_blank" rel="noreferrer">{s.programme.title} ↗</a> · {s.programme.start}–{s.programme.end} · {englishPrice(s.programme.priceLabel)}</p>}
           <p className="quest-address">{s.item.location}</p>
           <p className="quest-door"><a href={safeUrl(s.item.url)||undefined} target="_blank" rel="noreferrer">Venue & programme ↗</a><span>{s.hours} JST · {s.item.curation?.hoursBasis||'Weekly hours'}</span></p>
           
           <details>
             <summary>The connection</summary>
             <p>{s.reason}</p>
             {s.item.curation?.matchBasis==='album_tags'&&<p>This uses the album’s genres rather than a direct album-to-venue affinity.</p>}
             <p>{s.item.curation?.sourceReadAt?'Official page read at dispatch.':'Venue source in the curated catalog.'} Admission and stock are only confirmed when listed above.</p>
           </details>

           {n < q.stops.length - 1 && (
             <div className="quest-leg-connector">
               <span>↓ {s.travelMinutes ? `${s.travelMinutes * 70}m walk (${s.travelMinutes} mins)` : '350m walk (5 mins)'} to next coordinate</span>
             </div>
           )}
         </li>)}
       </ol>}

       {q.returnMinutes? <p className="quest-return">After the last stop, allow about {q.returnMinutes} minutes back to the start{q.returnTransit?` by the ${q.returnTransit}`:''}.</p>:null}

       <div className="outing-actions">
         {q.map&&<a className="quest-route-button" href={safeUrl(q.map)||undefined} target="_blank" rel="noreferrer">Open Route in Google Maps →</a>}
         {q.stops.length>0&&<>
           <button className="quest-share-button" onClick={()=>share(q)}>Share Quest</button>
           <button onClick={()=>save(q)}>Save this quest</button>
         </>}
         {!showSaved&&<button onClick={()=>void dispatch(q.seed.id,true)}>Find me a different quest</button>}
       </div>

       <details>
         <summary>Sources & planning limits</summary>
         <p>Tokyo time when scouted: {q.tokyoNow} JST.</p>
         {q.notes.map(n=><p key={n}>{n}</p>)}
         {q.trace?.map(t=><p key={t}>{t}</p>)}
       </details>

       {!!q.run?.length&&<details className="quest-run-replay">
         <summary>How the agent built this quest</summary>
         <QuestRun events={q.run} busy={false} seed={q.seed.name} onCancel={()=>{}}/>
       </details>}
     </article>)}

     {leads.length>0&&!showSaved&&<section className="quest-event-leads">
       <h2>Also worth a look</h2>
       <p>Matches for your seed over the next seven days. Online releases and separate trips stay outside the timed walk.</p>
       {leads.map(e=><article key={e.id}>
         <h3><a href={safeUrl(e.url)||undefined} target="_blank" rel="noreferrer">{e.title} ↗</a></h3>
         <p>Listing period {e.start}{e.end!==e.start?' to '+e.end:''} · {e.online?'Online release':e.location}</p>
         <p>{e.reason}</p>
         <p>{englishPrice(e.priceLabel)}</p>
         {e.times.length>0&&<p>{e.times.join(' · ')}</p>}
       </article>)}
     </section>}

     {shareText&&<section ref={sharePanel} className="quest-share-fallback">
       <h2>{shareTitle}</h2>
       <p>Your quest, ready to send. No SideQuest account needed to use the map.</p>
       <label htmlFor="quest-share-copy">Copy this itinerary. The map works without a SideQuest account.</label>
       <textarea ref={shareCopy} id="quest-share-copy" value={shareText} readOnly rows={14} onFocus={e=>e.currentTarget.select()}/>
       <div className="outing-actions">
         <button className="primary" onClick={()=>void copyShare()}>Copy itinerary</button>
         {canShare&&<button disabled={sharing} onClick={()=>void deviceShare()}>{sharing?'Device options open…':'Share with your device'}</button>}
         <button onClick={()=>setShareText('')}>Close</button>
       </div>
       {shareStatus&&<p role="status">{shareStatus}</p>}
     </section>}
   </main>

   <footer>
     <span>Follow your taste. Keep your afternoon.</span>
     <a href="/classic">Previous tools & saves</a>
   </footer>
 </div>;
}
