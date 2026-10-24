import test from 'node:test';
import assert from 'node:assert/strict';
import {VENUES} from '../lib/curated-venues.ts';
import {tasteThreads,culturalOverlap} from '../lib/curated-taste.ts';
import {questSeed} from '../lib/quest-seeds.ts';
import {openingWindows,planScout} from '../lib/scout.ts';
import type {Opportunity,Preferences} from '../lib/opportunities.ts';
test('the local catalog has unique identities, authored tasks and reviewable sources',()=>{
 assert.equal(VENUES.length,100);assert.equal(new Set(VENUES.map(v=>v.name)).size,100);const ids=VENUES.flatMap(v=>v.qlooId?[v.qlooId]:[]);assert.equal(new Set(ids).size,ids.length);
 assert.ok(VENUES.every(v=>/^https?:\/\//.test(v.source)&&v.mission.length>50&&Number.isFinite(Date.parse(v.reviewedAt))));
 assert.ok(!VENUES.some(v=>/Cotton Club|Billboard Live|3331|^VACANT$/.test(v.name)));
 assert.equal(VENUES.find(v=>v.name==='NAT RECORDS')?.area,'Shimokitazawa');
});
test('film tags do not turn witchcraft into coffee craft, steampunk into punk or a bathhouse into house music',()=>{
 const threads=tasteThreads([{name:'Witchcraft'},{name:'Steampunk'},{name:'Bathhouse'},{name:'Rocky mountain'}]);
 assert.equal(threads.has('craft'),false);assert.equal(threads.has('punk'),false);assert.equal(threads.has('electronic'),false);assert.equal(threads.has('rock'),false);
 assert.deepEqual(culturalOverlap(['jazz','hiphop','punk'],tasteThreads([{name:'Jazz Hop'},{name:'Hip - Hop'}])).map(t=>t.name),['jazz','hiphop']);
});
test('album and place seeds retain useful disambiguation and genre evidence',()=>{
 const id='81B5270B-19ED-462D-8378-EC2B1239C2C8';const album=questSeed({entity_id:id,name:'Modal Soul',types:['urn:entity:album'],properties:{release_date:'2005-11-11'},tags:[{name:'Jazz',type:'urn:tag:genre',value:'urn:tag:genre:jazz'}]});
 assert.equal(questSeed({entity_id:id,name:'Nujabes',types:['urn:entity:album'],properties:{}}),null);assert.equal(album?.type,'album');assert.match(album!.description,/2005/);assert.deepEqual(album?.tags,['urn:tag:genre:jazz']);assert.equal(questSeed({entity_id:'invalid',name:'Album',types:['urn:entity:album']}),null);
 assert.equal(questSeed({entity_id:id,name:'A place',types:['urn:entity:place'],properties:{address:'Tokyo'}})?.description,'Tokyo');
});
test('dated closures override weekly hours and the loop includes its return leg',()=>{
 const now=new Date('2026-10-25T02:00:00Z'),date='2026-10-25',hours={sunday:[{opens:'12:00',closes:'20:00'}],[date]:[{closed:true}]};assert.deepEqual(openingWindows(hours,date),[]);
 const p:Preferences={intent:'mix',direction:'any',format:'places',date,days:1,budget:'any',unknownPrice:true,seeds:[],exclude:[]};
 const rows=['Coffee shop','Bookshop','Art gallery'].map((category,i)=>({id:String(i),title:String(i),kind:'place',source:'Qloo',url:'https://example.com/'+i,description:'',location:'Tokyo',checkedAt:now.toISOString(),price:null,priceLabel:'Unknown',availability:'',category,lat:35.67,lon:139.70+i*.004,hours:{sunday:[{opens:'12:00',closes:'20:00'}]}} as Opportunity));
 const plan=planScout(rows,p,now);assert.equal(plan.stops.length,3);const map=new URL(plan.map!);assert.equal(map.searchParams.get('origin'),map.searchParams.get('destination'));assert.equal(map.searchParams.get('waypoints')?.split('|').length,2);assert.ok(plan.walkingMinutes!>=plan.returnMinutes!+plan.stops.reduce((n,s)=>n+s.travelMinutes,0));
 assert.equal(planScout(rows.map(r=>({...r,hours})),p,now).stops.length,0);
});
test('the corridor excludes a leg between 1.5 km and the previous 1.6 km limit',()=>{
 const now=new Date('2026-10-25T02:00:00Z'),p:Preferences={intent:'mix',direction:'any',format:'places',date:'2026-10-25',days:1,budget:'any',unknownPrice:true,seeds:[],exclude:[]};
 const rows=['Coffee shop','Bookshop','Art gallery'].map((category,i)=>({id:String(i),title:String(i),kind:'place',source:'Qloo',url:'https://example.com/'+i,description:'',location:'Tokyo',checkedAt:now.toISOString(),price:null,priceLabel:'Unknown',availability:'',category,lat:35.67,lon:139.70+[0,.0124,.0001][i],hours:{sunday:[{opens:'12:00',closes:'20:00'}]}} as Opportunity));
 assert.equal(planScout(rows,p,now).stops.length,0);
});
