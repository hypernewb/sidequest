import test from 'node:test';
import assert from 'node:assert/strict';
import {routeDistance,nextLeg,runSummary} from '../lib/quest-presentation.ts';
import type {RunEvent} from '../lib/quest-run.ts';

test('route distance uses planner metres and does not invent missing totals',()=>{
 assert.equal(routeDistance({walkingMetres:2438}),'2.4 km');
 assert.equal(routeDistance({walkingMetres:0}),'0.0 km');
 assert.equal(routeDistance({}),'Not available');
 assert.equal(routeDistance({walkingMetres:NaN}),'Not available');
});
test('leg description preserves unequal distances and distinguishes train legs',()=>{
 assert.equal(nextLeg({distanceMetres:613,travelMinutes:15}),'613 m · about 15 min walk to the next stop');
 assert.equal(nextLeg({distanceMetres:292,travelMinutes:10}),'292 m · about 10 min walk to the next stop');
 assert.match(nextLeg({distanceMetres:420,travelMinutes:23,transit:'Chiyoda line'}),/^Chiyoda line · about 23 min including station walks$/);
});
test('progress never claims verification before completion or after cancellation',()=>{
 const event=(status:RunEvent['status'],stage:RunEvent['stage']='operations'):RunEvent=>({type:'stage',status,stage,detail:'Checking published hours',at:'2026-10-28T00:00:00Z'});
 assert.equal(runSummary([],true),'Starting your quest…');
 assert.equal(runSummary([event('running')],true),'Checking published hours');
 assert.match(runSummary([event('cancelled')],false),/^Stopped/);
 assert.match(runSummary([event('failed')],false),/could not/);
 assert.match(runSummary([event('complete')],false),/No completed route/);
 assert.match(runSummary([event('complete','synthesis')],false),/planning finished/);
});
