import fs from 'node:fs/promises';
import {toolSpatialCluster} from '../lib/agent-tools.ts';
import {planScout} from '../lib/scout.ts';
import {replanItems,replanNow,replanSeed,replanPreferences,replanFetcher} from '../tests/replanning-fixture.ts';
const items=replanItems(),before=planScout(items,replanPreferences,replanNow),events=[];
globalThis.fetch=replanFetcher;
const {plan}=await toolSpatialCluster({items,preferences:replanPreferences,seed:replanSeed,now:replanNow,hooks:{report:event=>events.push(event)}});
const report={method:'Controlled official-page HTML fixture with synthetic venue coordinates and weekly hours. The real source-specific closure reader and route planner run unchanged. This is a reproducible failure demonstration, not a live closure claim.',date:replanPreferences.date,before:before.stops.map(s=>s.item.title),after:plan.stops.map(s=>s.item.title),changes:plan.changes,events};
if(report.before.includes('Mograg Gallery')&&!report.after.includes('Mograg Gallery')&&report.after.length>=2){await fs.writeFile('evaluation/closed-venue-replan.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}else throw Error('Closure did not produce a supported replacement');
