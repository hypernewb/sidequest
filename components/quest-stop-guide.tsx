import type {StopGuide} from '@/lib/door-notes';
import {safeUrl} from '@/lib/discovery';

// Saved quests can predate this feature. Do not upgrade their old free-text
// notes into source-backed rules, or assume browser storage has a valid shape.
export default function QuestStopGuide({guide,mission}:{guide?:StopGuide;mission:string}){
 const appreciation=typeof guide?.appreciation?.text==='string'?guide.appreciation.text:mission;
 const facts=Array.isArray(guide?.practical)?guide.practical.filter(f=>f&&typeof f.text==='string'&&typeof f.evidence==='string'&&typeof f.checkedAt==='string'&&Number.isFinite(Date.parse(f.checkedAt))&&typeof f.url==='string'&&safeUrl(f.url)).slice(0,6):[];
 const useful=facts.filter(f=>f.kind!=='hours');
 const visible=(useful.length?useful:facts).slice(0,3);
 return <div className="quest-stop-guide">
  <div className="quest-before"><h4>Before you go</h4>
   {visible.length?<ul>{visible.map((f,i)=><li key={i}>{f.text}</li>)}</ul>:<p>No entry details extracted. Check the official venue page below.</p>}
   {!!facts.length&&<details className="quest-guide-evidence"><summary>Source wording</summary>{facts.map((f,i)=><div key={i}>
    <p>{f.text}</p><blockquote lang={/[\u3040-\u30ff\u3400-\u9fff]/.test(f.evidence)?'ja':undefined}>{f.evidence}</blockquote>
    <p><a href={safeUrl(f.url)||undefined} target="_blank" rel="noreferrer">Official source ↗</a> · Read {new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tokyo',dateStyle:'medium',timeStyle:'short'}).format(new Date(f.checkedAt))} JST</p>
   </div>)}</details>}
  </div>
  <div className="quest-appreciate"><h4>A way into it</h4><p>{appreciation}</p><small>SideQuest suggestion</small></div>
 </div>;
}
