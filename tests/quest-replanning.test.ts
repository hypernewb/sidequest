import test from 'node:test';
import assert from 'node:assert/strict';
import {toolSpatialCluster,verifiedHours} from '../lib/agent-tools.ts';
import {planScout,openingWindows} from '../lib/scout.ts';
import {replanItems,replanNow,replanSeed,replanPreferences,replanFetcher} from './replanning-fixture.ts';
import type {RunEvent} from '../lib/quest-run.ts';

test('Pianola official weekly schedule excludes Thursdays and keeps Wednesday hours',()=>{
 assert.deepEqual(openingWindows(verifiedHours['Pianola Records']||{},'2026-10-29'),[]);
 assert.deepEqual(openingWindows(verifiedHours['Pianola Records']||{},'2026-10-28'),[{open:840,close:1260}]);
});

test('an official dated closure triggers a replacement route and a visible, sourced decision',async t=>{
 const items=replanItems(),events:RunEvent[]=[];
 const before=planScout(items,replanPreferences,replanNow);
 assert.ok(before.stops.some(s=>s.item.title==='Mograg Gallery'));
 t.mock.method(globalThis,'fetch',replanFetcher);
 const {plan}=await toolSpatialCluster({items,preferences:replanPreferences,seed:replanSeed,now:replanNow,hooks:{report:e=>events.push(e)}});
 assert.ok(plan.stops.length>=2);
 assert.ok(!plan.stops.some(s=>s.item.title==='Mograg Gallery'));
 assert.ok(plan.stops.some(s=>s.item.title==='KOTARO NUKAGA'));
 const change=plan.changes!.find(c=>c.venue==='Mograg Gallery')!;
 assert.equal(change.basis,'published_schedule');
 assert.ok(change.before.includes('Mograg Gallery'));
 assert.ok(!change.after.includes('Mograg Gallery'));
 assert.ok(events.some(e=>/Mograg Gallery has no public opening.*Replanning/.test(e.detail)));
});

test('an unreadable official page is not described as a confirmed closure',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response('Unavailable',{status:503}));
 const {plan}=await toolSpatialCluster({items:replanItems(),preferences:replanPreferences,seed:replanSeed,now:replanNow});
 assert.ok(plan.changes!.length>0);
 assert.ok(plan.changes!.every(c=>c.basis==='source_unavailable'&&/does not establish a closure/.test(c.reason)));
});
