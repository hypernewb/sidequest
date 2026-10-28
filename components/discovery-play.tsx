'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {readBrowserTaste,writeBrowserTasteProfile,appendBrowserReaction,type BrowserTaste} from '@/lib/browser-taste';
import {readDiscoverySession,writeDiscoverySession,DISCOVERY_SESSION_KEY} from '@/lib/discovery-session';
import {choosePair,applyChoice,recordComparison,discoveryFacets,type ChoiceHistory} from '@/lib/discovery-learning';
import {momentEligible} from '@/lib/moments';
import {catalogTitle} from '@/lib/catalog-labels';
import {catalogPreview} from '@/lib/catalog-preview';
import {momentTiming,MOMENT_SAVES_KEY} from '@/lib/stumble';
import type {MomentTasteContext} from '@/lib/taste-profile';
import type {Opportunity} from '@/lib/opportunities';
import './discovery-play.css';

export default function DiscoveryPlay({onApply,onClose}:{onApply?:(profile:BrowserTaste)=>void;onClose?:()=>void}){
 const [profile,setProfile]=useState<BrowserTaste>({seeds:[]}),[context,setContext]=useState<MomentTasteContext>({tags:[],reactions:[]}),[history,setHistory]=useState<ChoiceHistory>([]),[pool,setPool]=useState<Opportunity[]>([]),[pair,setPair]=useState<ReturnType<typeof choosePair>>(),[ready,setReady]=useState(false),[busy,setBusy]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState(''),[saved,setSaved]=useState<string[]>([]),[art,setArt]=useState<Record<string,string>>({}),[review,setReview]=useState(false),[qloo,setQloo]=useState(false),[retry,setRetry]=useState(0);
 const [undoFrames,setUndoFrames]=useState<{context:MomentTasteContext;history:ChoiceHistory}[]>([]);
 const heading=useRef<HTMLHeadingElement>(null),initial=useRef(true),live=useRef<AbortController|null>(null),latest=useRef({profile,context,history});
 latest.current={profile,context,history};
 useEffect(()=>{try{const p=readBrowserTaste(localStorage)||{seeds:[]};setProfile(p);const s=readDiscoverySession(sessionStorage);setContext(s?.context||p.context||{tags:[],reactions:[]});setHistory(s?.comparisons||[]);const rows=JSON.parse(localStorage.getItem(MOMENT_SAVES_KEY)||'[]');if(Array.isArray(rows))setSaved(rows.map(o=>o.id));}catch{}setReady(true);return()=>live.current?.abort();},[]);
 useEffect(()=>{if(!ready)return;const c=new AbortController();setBusy(true);setError('');
 const v=latest.current;fetch('/api/moments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({seeds:v.profile.seeds,avoid:v.profile.avoid,context:v.context,cachedOnly:true}),signal:AbortSignal.any([c.signal,AbortSignal.timeout(10000)])}).then(async r=>{const b=await r.json() as {items:Opportunity[];error?:string;qloo?:{status:string}};if(!r.ok)throw Error(b.error||'Could not load current finds.');if(c.signal.aborted)return;setPool(b.items);setPair(choosePair(b.items,[],latest.current.context,latest.current.history));setBusy(false);upgrade();}).catch(e=>{if(!c.signal.aborted){setError(e.message);setBusy(false);}});return()=>c.abort();},[ready,retry]);
 function upgrade(){live.current?.abort();const c=new AbortController();live.current=c;const v=latest.current;
 fetch('/api/moments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({seeds:v.profile.seeds,avoid:v.profile.avoid,context:v.context}),signal:AbortSignal.any([c.signal,AbortSignal.timeout(22000)])}).then(async r=>{if(!r.ok)return;const b=await r.json() as {items:Opportunity[];error?:string;qloo?:{status:string}};if(!c.signal.aborted){setPool(b.items);setQloo(b.qloo?.status==='ready');}}).catch(()=>{});}
 const ids=[pair?.left,pair?.right].filter((o):o is Opportunity=>!!o&&!o.image&&!art[o.id]).map(o=>o.id).join('\n');
 useEffect(()=>{if(!ids)return;const c=new AbortController();fetch('/api/moments/art',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids:ids.split('\n')}),signal:c.signal}).then(r=>r.ok?r.json() as Promise<{images:Record<string,string>}>:null).then(b=>{if(!c.signal.aborted&&b?.images)setArt(v=>({...v,...b.images}));}).catch(()=>{});return()=>c.abort();},[ids]);
 useEffect(()=>{if(initial.current){initial.current=false;return;}heading.current?.focus();},[pair,review]);
 function persist(next:MomentTasteContext,h:ChoiceHistory){try{writeDiscoverySession(sessionStorage,next,h);}catch{setNotice('These choices stay in this page while storage is unavailable.');}}
 function pick(outcome:'left'|'right'|'neither'|'unknown'){
 if(!pair?.left)return;live.current?.abort();setUndoFrames(v=>[...v,{context,history}].slice(-40));const right=pair.right||pair.left;
 const h=recordComparison(history,pair.left,right,outcome),chosen=outcome==='left'?pair.left:outcome==='right'?pair.right:undefined;
 const next=chosen?applyChoice(context,chosen,chosen.id===pair.left.id?pair.right:pair.left):context;
 setContext(next);setHistory(h);persist(next,h);latest.current={profile,context:next,history:h};
 setNotice(chosen?'Choice kept for today. Try another angle.':outcome==='unknown'?'Left undecided. Unfamiliar is still open.':'Passed this pair. Your broader interests are still open.');
 setPair(choosePair(pool.filter(o=>momentEligible(o)),[],next,h));if(h.length%2===0)upgrade();if(h.length===5)setReview(true);
 }
 function keep(){let base=profile;try{base=readBrowserTaste(localStorage)||profile;}catch{}const stable=base.context||{tags:[],reactions:[]};const tags=[...new Map([...stable.tags,...context.tags].map(t=>[t.id,t])).values()].slice(-16);const reactions=[...new Map([...stable.reactions,...context.reactions].map(r=>[r.id,r])).values()].slice(-100);const next={...base,context:{...stable,tags,reactions}};
 try{writeBrowserTasteProfile(localStorage,next);setProfile(next);onApply?.(next);setNotice('Kept these interests. Your practical preferences are unchanged.');}catch{setNotice('Could not keep these interests. They still work for this session.');}}
 function save(o:Opportunity){try{const rows=JSON.parse(localStorage.getItem(MOMENT_SAVES_KEY)||'[]') as Opportunity[];const exists=rows.some(v=>v.id===o.id);localStorage.setItem(MOMENT_SAVES_KEY,JSON.stringify(exists?rows.filter(v=>v.id!==o.id):[o,...rows].slice(0,100)));setSaved(v=>exists?v.filter(id=>id!==o.id):[...v,o.id]);if(!exists){appendBrowserReaction(localStorage,{id:o.id,action:'save',at:new Date().toISOString()});const next=applyChoice(context,o);setContext(next);persist(next,history);latest.current={profile,context:next,history};}setNotice(exists?'Removed from Saved.':'Saved. You can find it in the main feed.');}catch{setNotice('Browser storage could not save this find.');}}
 function undo(){const frame=undoFrames.at(-1);if(!frame)return;live.current?.abort();setUndoFrames(v=>v.slice(0,-1));setContext(frame.context);setHistory(frame.history);persist(frame.context,frame.history);setReview(false);setPair(choosePair(pool.filter(o=>momentEligible(o)),[],frame.context,frame.history));setNotice('Last comparison undone.');}
 function restart(){live.current?.abort();setUndoFrames([]);const next=profile.context||{tags:[],reactions:[]};setContext(next);setHistory([]);setReview(false);persist(next,[]);setPair(choosePair(pool.filter(o=>momentEligible(o)),[],next,[]));setNotice('New round. Kept interests remain.');}
 const choices=[pair?.left,pair?.right].filter((o):o is Opportunity=>!!o),count=history.filter(r=>['left','right'].includes(r.outcome)).length,facets=context.tags.filter(t=>/^editorial:discovery-(subject|genre)-/.test(t.id)).map(t=>t.name);
 return <section className="discovery-play" aria-label="Discover through choices"><div className="play-top"><p>{history.length?'Your trail · '+history.length+' comparisons':'No setup. Start with a real find.'}</p>{onClose?<button onClick={onClose}>Just surprise me</button>:<Link href="/stumble">Just surprise me</Link>}</div>
 <h1 ref={heading} tabIndex={-1}>{review?'Your curiosity is taking shape.':<>Which would you <em>open?</em></>}</h1>
 <p className="play-intro">{review?'Keep any interests that fit, or carry on for today.':'Pick what catches you. The next pair follows your choices.'}</p>
 {review&&<div className="play-reflection"><p>{count?count+(count===1?' positive choice so far.':' positive choices so far.'):'You left these choices open.'}</p><p>{facets.length?'You have been following '+facets.slice(0,5).join(', ')+'.':'Your choices will guide the next cultural connections to explore.'}</p><div><button className="primary" disabled={!count} onClick={keep}>Keep these interests</button><button onClick={()=>setReview(false)}>Keep exploring for today</button>{onClose?<button onClick={onClose}>See one find at a time</button>:<Link href="/stumble?view=single">See one find at a time</Link>}</div><p className="play-note">A trail from your choices. You can change direction at any time.</p></div>}
 {error&&<div role="alert"><p>{error}</p><button onClick={()=>setRetry(v=>v+1)}>Try again</button></div>}
 {busy&&<p role="status">Opening current events and drops…</p>}
 {!review&&!busy&&<><div className="play-pair">{choices.map((o,index)=><article key={o.id}>
 <button className="play-pick" onClick={()=>pick(index===0?'left':'right')} aria-label={'Pick '+catalogTitle(o)}>
 {o.image||art[o.id]?<img src={o.image||art[o.id]} alt="" width={640} height={420}/>:<div className={'play-type play-type-'+o.kind}><span>{o.kind==='release'?'Limited drop':o.kind==='gig'?'Live music':o.kind==='popup'?'Pop-up':o.kind==='exhibition'?'Exhibition':'Online & live'}</span><strong>{catalogTitle(o)}</strong></div>}
 <div className="play-card-copy"><p>{o.online?'Online':'In person'} · {o.kind==='release'?'Timed drop':o.kind}</p><h2>{catalogTitle(o)}</h2><p>{momentTiming(o)}</p><p className="play-description">{catalogPreview(o).text.slice(0,180)}</p><span className="play-pick-label">This catches me →</span></div></button>
 <div className="play-card-actions"><button onClick={()=>save(o)} aria-pressed={saved.includes(o.id)}>{saved.includes(o.id)?'Saved · remove':'Save'}</button><a href={o.url} target="_blank" rel="noreferrer">Official details ↗</a></div></article>)}</div>
 {choices.length>0?<div className="play-pass"><button onClick={()=>pick('neither')}>Neither catches me</button><button onClick={()=>pick('unknown')}>I don't know these yet</button></div>:<div><p>You've reached the end of these comparisons. Revisit this round or browse all current finds.</p><button onClick={restart}>Start a new round</button><Link href="/">Browse all finds</Link></div>}</>}
 <p className="play-notice" role="status">{notice}</p><div className="play-tools">{undoFrames.length>0&&<button onClick={undo}>Undo last choice</button>}{history.length>0&&!review&&<button onClick={()=>setReview(true)}>What am I following?</button>}<details><summary>How choices work</summary><p>Choices shape this session immediately. Keep these interests adds them to your saved taste. Neither and Don't know do not mark an artist as disliked. Save keeps the actual listing.</p><p>{qloo?'Live Qloo connections are included in the pool.':'Starting with checked catalog evidence. Available Qloo connections update in the background.'}</p><p>{pair?.reason}</p><button onClick={restart}>Start a new round</button></details></div>
 </section>;
}
