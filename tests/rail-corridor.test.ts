import test from 'node:test';
import assert from 'node:assert/strict';
import {planScout,railLeg} from '../lib/scout.ts';
import type {Opportunity,Preferences} from '../lib/opportunities.ts';

const now=new Date('2026-10-25T02:00:00Z');
const p:Preferences={intent:'mix',direction:'any',format:'places',date:'2026-10-25',days:1,budget:'any',unknownPrice:true,seeds:[],exclude:[]};
const venue=(id:string,role:'coffee'|'dig'|'art',lat:number,lon:number)=>({id,title:id,kind:'place',source:'Qloo',url:'https://example.com/'+id,description:'',location:'Tokyo',checkedAt:now.toISOString(),price:null,priceLabel:'Unknown',availability:'',category:role,lat,lon,hours:{sunday:[{opens:'11:00',closes:'20:00'}]},curation:{role,area:'Tokyo',tags:[role],mission:'Try it',doorNotes:[],source:'https://example.com',reviewedAt:now.toISOString(),matchBasis:'genre_bridge',matchStrength:'anchor',tasteScore:80,matchedTags:[role]}} as Opportunity);
// Two stops by Shimokitazawa station, one by the Inokashira Line platform in Shibuya: about 2.8 km apart.
const rows=[venue('coffee','coffee',35.6620,139.6676),venue('records','dig',35.6610,139.6690),venue('gallery','art',35.6596,139.6978)];

test('walking alone cannot reach Shibuya, so the plan stays short',()=>{
 const plan=planScout(rows,p,now);
 assert.ok(plan.stops.length<3);assert.ok(plan.stops.every(s=>!s.transit));
});

test('rail mode links the districts by the Inokashira Line and keeps station walks short',()=>{
 const plan=planScout(rows,p,now,true);
 assert.equal(plan.stops.length,3);
 const legs=[...plan.stops.flatMap(s=>s.transit?[s.transit]:[]),plan.returnTransit].filter(Boolean);
 // Out to Shibuya by train, back to the start by train.
 assert.equal(legs.length,2);assert.ok(legs.every(l=>/Keio Inokashira Line/.test(l!)));
 assert.ok(plan.stops.every(s=>s.distanceMetres<=1500));
 assert.equal(new URL(plan.map!).searchParams.get('travelmode'),'transit');
 assert.match(plan.brief,/walking and train/);
 assert.ok(plan.notes.some(n=>/live timetable/.test(n)));
});

test('no rail leg is invented away from the linked stations',()=>{
 assert.equal(railLeg({lat:35.6276,lon:139.7364},{lat:35.6081,lon:139.6670}),undefined);
 assert.match(railLeg({lat:35.6620,lon:139.6676},{lat:35.6596,lon:139.6978})!.transit!,/Shimokitazawa → Shibuya/);
});
