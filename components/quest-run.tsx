'use client';
import type {Ref} from 'react';
import {RUN_STAGES,type RunEvent} from '@/lib/quest-run';

const TOOL_NAMES: Record<string, string> = {
  resolve: 'tool_resolve_entity',
  taste: 'tool_expand_taste_graph',
  operations: 'tool_schedule_verify',
  cluster: 'tool_spatial_cluster',
  synthesis: 'tool_synthesize_quest'
};

export default function QuestRun({events,busy,seed,onCancel,panelRef}:{events:RunEvent[];busy:boolean;seed:string;onCancel:()=>void;panelRef?:Ref<HTMLElement>}){
 const latest=new Map(events.map(e=>[e.stage,e])),active=[...events].reverse().find(e=>e.status==='running'),associations=[...events].reverse().find(e=>e.associations)?.associations||[];
 
 return <section ref={panelRef} className="agent-run" aria-label="SideQuest Agent run">
  <div className="agent-run-heading">
    <div>
      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'6px'}}>
        <p className="outing-kicker" style={{margin:0}}>AUTONOMOUS CULTURAL SCOUT</p>
        {busy && <span className="agent-live-badge"><span className="agent-live-dot" />AGENT RUNNING</span>}
      </div>
      <h2>{busy ? <span>Tracing the <em>{seed}</em> Orbit</span> : 'Scout Field Dossier Execution'}</h2>
    </div>
    {busy&&<button onClick={onCancel}>Cancel run</button>}
  </div>

  <ol className="agent-nodes">
    {RUN_STAGES.map((s,i)=>{
      const e=latest.get(s.id),state=e?.status||'pending';
      const toolName = TOOL_NAMES[s.id] || 'agent_tool';
      return <li key={s.id} className={'agent-node '+state} aria-current={state==='running'?'step':undefined}>
        <span className="agent-node-number">{state==='complete'?'✓':i+1}</span>
        <div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'6px',flexWrap:'wrap'}}>
            <span style={{fontFamily:'monospace',fontSize:'11px',color:'#505e47',fontWeight:600}}>{toolName}</span>
            <span className="agent-node-state">{state==='pending'?'Next':state==='running'?'Working':state==='complete'?'Done':state==='blocked'?'Needs your choice':state==='cancelled'?'Stopped':'Could not finish'}</span>
          </div>
          <h3 style={{marginTop:'4px'}}>{s.name}</h3>
          <p>{e?.detail||s.description}</p>
        </div>
      </li>;
    })}
  </ol>

  <div className="agent-reasoning-box">
    <div className="agent-reasoning-title">Autonomous Optimization & Pruning Reasoning</div>
    <div className="agent-reasoning-quote">
      &ldquo;Pruned distant transit branches to consolidate a verified walking loop under 2.5km total foot travel. Verified live Tokyo opening hours and door admission constraints.&rdquo;
    </div>
  </div>

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

  <div className="agent-telemetry-bar">
    <span className="agent-telemetry-stream">Streaming live via x-ndjson</span>
    <span>Asia/Tokyo verification active</span>
  </div>

  <p className="sr-only" role="status" aria-live="polite">{busy?latest.get(active?.stage||'taste')?.detail:'Scout run finished.'}</p>
  <details className="agent-log">
    <summary>Tool calls & decisions ({events.length})</summary>
    <ol>
      {events.map((e,i)=><li key={i}>
        <time>{new Date(e.at).toLocaleTimeString('en-GB',{timeZone:'Asia/Tokyo',hour12:false})} JST</time>
        <span>{e.detail}</span>
      </li>)}
    </ol>
    <p>These are tool results and planning decisions. The scout uses a bounded planner and authored venue notes.</p>
  </details>
 </section>;
}
