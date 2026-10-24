import fs from 'node:fs/promises';
const dir='.local/quest-benchmark';
const before=JSON.parse(await fs.readFile(dir+'/before.json','utf8')),after=JSON.parse(await fs.readFile(dir+'/after.json','utf8')),baseline=JSON.parse(await fs.readFile(dir+'/baseline.json','utf8')),rubric=JSON.parse(await fs.readFile('evaluation/quest-review-rubric.json','utf8'));
const {planScout}=await import('../'+dir+'/engine.mjs');
const profiles=after.profiles.map(p=>{
 const b=baseline.profiles.find(x=>x.name===p.name),old=before.profiles.find(x=>x.name===p.name);
 // The baseline uses the current planner, including the same anchor and two-stop rules.
 const items=b.baselineItems.map(o=>({...o,curation:{...o.curation,matchStrength:o.curation.tasteScore>=75?'anchor':o.curation.tasteScore>=50?'adjacent':'stopover'}}));
 const baselinePlan=planScout(items,p.p,new Date(after.now));
 const review=plan=>({stops:plan.stops.map(s=>{const rating=rubric[p.name][s.item.title];if(!rating)throw Error('Unrated '+p.name+' / '+s.item.title);return {name:s.item.title,grade:rating[0],evidence:rating[1],arrival:s.arrival,departure:s.departure,role:s.item.curation.role};}),walkingMetres:plan.walkingMetres||0,relevance:plan.stops.length?plan.stops.reduce((n,s)=>n+rubric[p.name][s.item.title][0],0)/plan.stops.length:null});
 return {seed:p.name,before:review(old.plan),qloo:review(p.plan),baseline:review(baselinePlan)};
});
const summary={};
for(const condition of ['before','qloo','baseline']){const results=profiles.map(p=>p[condition]),completed=results.filter(r=>r.stops.length),sets=completed.map(r=>new Set(r.stops.map(s=>s.name))),pairs=[];for(let i=0;i<sets.length;i++)for(let j=i+1;j<sets.length;j++)pairs.push([...sets[i]].filter(x=>sets[j].has(x)).length/new Set([...sets[i],...sets[j]]).size);
 summary[condition]={quests:completed.length,threeStopQuests:completed.filter(r=>r.stops.length===3).length,twoStopQuests:completed.filter(r=>r.stops.length===2).length,profiles:results.length,relevanceReturned:completed.reduce((n,r)=>n+r.relevance,0)/completed.length,relevanceIncludingMissing:results.reduce((n,r)=>n+(r.relevance||0),0)/results.length,meanPairwiseJaccard:pairs.reduce((n,x)=>n+x,0)/pairs.length};}
await fs.writeFile('evaluation/quest-benchmark-2026-10-25.json',JSON.stringify({date:after.date,planningTime:after.now,method:rubric.method,summary,profiles},null,2));console.log(JSON.stringify(summary,null,2));
