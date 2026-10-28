'use client';
import type {Ref} from 'react';
import {runSummary} from '@/lib/quest-presentation';
import {RUN_STAGES,type RunEvent} from '@/lib/quest-run';

const TOOL_NAMES: Record<string, string> = {
  resolve: 'tool_resolve_entity',
  taste: 'tool_expand_taste_graph',
  operations: 'tool_schedule_verify',
  cluster: 'tool_spatial_cluster',
  synthesis: 'tool_synthesize_quest'
};

export default function QuestRun({events,busy,seed,onCancel,panelRef}:{events:RunEvent[];busy:boolean;seed:string;onCancel:()=>void;panelRef?:Ref<HTMLElement>}){
 const summary=runSummary(events,busy);
 const latest=new Map(events.map(e=>[e.stage,e])),associations=[...events].reverse().find(e=>e.associations)?.associations||[];
 
 return <section ref={panelRef} className="agent-run" aria-label="SideQuest Agent run">
  <div className="agent-run-heading">
    <div>
      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'6px'}}>
        <p className="outing-kicker" style={{margin:0}}>PLANNING YOUR QUEST</p>
        {busy && <span className="agent-live-badge"><span className="agent-live-dot" />IN PROGRESS</span>}
      </div>
      <h2>{busy ? <span>Finding a route for <em>{seed}</em></span> : 'Your planning run'}</h2>
    </div>
    {busy&&<button onClick={onCancel}>Cancel run</button>}
  </div>

  <ol className="agent-nodes">
    {RUN_STAGES.map((s,i)=>{
      const e=latest.get(s.id),state=e?.status==='running'&&!busy?'cancelled':e?.status||'pending';
      return <li key={s.id} className={'agent-node '+state} aria-current={state==='running'?'step':undefined}>
        <span className="agent-node-number">{state==='complete'?'✓':i+1}</span>
        <div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'6px',flexWrap:'wrap'}}>
            <span className="agent-node-state">{state==='pending'?(busy?'Next':'Not run'):state==='running'?'Working':state==='complete'?'Done':state==='blocked'?'Needs your choice':state==='cancelled'?'Stopped':'Could not finish'}</span>
          </div>
          <h3 style={{marginTop:'4px'}}>{s.name}</h3>
          <p>{e?.detail||s.description}</p>
        </div>
      </li>;
    })}
  </ol>

  <p role="status">{summary}</p>

  {associations.length>0&&<div className="agent-associations">
    <p className="outing-kicker">Returned by Qloo</p>
    <div className="agent-graph">
      <span className="agent-seed">{seed}</span>
      <span aria-hidden="true">→</span>
      <ul>
        {[...associations].sort((a,b)=>({related_entity:0,related_tag:1,seed_tag:2}[a.relation]-{related_entity:0,related_tag:1,seed_tag:2}[b.relation])).slice(0,8).map((a,i)=><li key={a.name+i}>
          <strong>{a.name}</strong>
          <small>{a.relation==='related_entity'?`Related ${a.type.replaceAll('_',' ')}`:a.relation==='related_tag'?'Related genre':'Seed metadata'} · via {a.via}</small>
        </li>)}
      </ul>
    </div>
  </div>}

  <details className="agent-log">
    <summary>Tool calls & decisions ({events.length})</summary>
    <ol>
      {events.map((e,i)=><li key={i}>
        <time>{new Date(e.at).toLocaleTimeString('en-GB',{timeZone:'Asia/Tokyo',hour12:false})} JST</time>
        <span><small>{TOOL_NAMES[e.stage]}</small> · {e.detail}</span>
      </li>)}
    </ol>
    <p>These are tool results and planning decisions. The scout uses a bounded planner and authored venue notes.</p>
  </details>
 </section>;
}
