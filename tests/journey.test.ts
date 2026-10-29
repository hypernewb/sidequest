import test from 'node:test';
import assert from 'node:assert/strict';
import {googleJourney,googlePlace,journeyItem,journeyWarnings,readJourney,readVisits,canRateVisit} from '../lib/journey.ts';
import {withEventLocation} from '../lib/event-locations.ts';
import type {Opportunity} from '../lib/opportunities.ts';
const now=new Date('2026-10-30T03:00:00Z');
const item=(patch:Partial<Opportunity>={}):Opportunity=>({id:'event:a',title:'A real show',url:'https://www.unit-tokyo.com/schedule/123/',kind:'gig',source:'UNIT',location:'Daikanyama UNIT, Tokyo',category:'music',description:'Official show',checkedAt:now.toISOString(),price:null,priceLabel:'Unknown',availability:'Check tickets',start:'2026-10-30',end:'2026-10-30',...patch});
test('day routes preserve stop order, encode names and omit online finds',()=>{
 const a=journeyItem(item()),b=journeyItem(item({id:'b',location:'Gallery & Books, Shibuya, Tokyo'})),c=journeyItem(item({id:'c',online:true,location:'Online'})),d=journeyItem(item({id:'d',location:'Record Shop, Tokyo'}));
 const url=new URL(googleJourney([a,c,b,d].map(item=>({item,time:''})))!);
 assert.equal(url.searchParams.get('api'),'1');assert.equal(url.searchParams.get('origin'),a.location);assert.equal(url.searchParams.get('waypoints'),b.location);assert.equal(url.searchParams.get('destination'),d.location);assert.equal(url.searchParams.get('travelmode'),'walking');
 assert.equal(googlePlace(c),undefined);assert.equal(googlePlace(journeyItem(item({location:'Tokyo',source:'PR Times'}))),undefined);
});
test('dates and arrival order produce warnings without inventing travel or event durations',()=>{
 const a=journeyItem(item({startsAt:'2026-10-30T10:00:00Z'})),b=journeyItem(item({id:'b',start:'2026-11-02',end:'2026-11-02'}));
 const warnings=journeyWarnings({date:'2026-10-30',entries:[{item:a,time:'18:00'},{item:b,time:'16:00'}]},now);
 assert.ok(warnings.some(w=>w.includes('starts after')));assert.ok(warnings.some(w=>w.includes('outside')));assert.ok(warnings.some(w=>w.includes('backwards')));
 assert.equal(canRateVisit(a,now),false);assert.equal(canRateVisit(journeyItem(item()),now),true);
});
test('corrupt storage and hostile saved links are rejected; records are bounded',()=>{
 assert.deepEqual(readJourney({getItem:()=>'{bad'},'2026-10-30'),{date:'2026-10-30',entries:[]});
 assert.deepEqual(readVisits({getItem:()=>JSON.stringify([{item:{...journeyItem(item()),url:'javascript:alert(1)'},rating:5,at:now.toISOString()}])}),[]);
 assert.deepEqual(readJourney({getItem:()=>JSON.stringify({date:'2026-10-30',entries:Array.from({length:6},()=>({item:journeyItem(item()),time:''}))})},'2026-10-30').entries,[]);
});
test('official venue location mapping is scoped to its own gigs and preserves supplied coordinates',()=>{
 const located=withEventLocation(item());assert.equal(located.lat,35.6471251);assert.equal(located.lon,139.7022986);
 assert.equal(withEventLocation(item({kind:'release'})).lat,undefined);assert.equal(withEventLocation(item({url:'https://example.com/unit'})).lat,undefined);assert.equal(withEventLocation(item({online:true})).lat,undefined);
 assert.equal(withEventLocation(item({lat:35.1,lon:139.1})).lat,35.1);
});
test('legacy issuer placeholders never become a Tokyo route stop or a false venue pin',()=>{
 const o=withEventLocation(item({source:'PR Times · issuer press release',kind:'popup',title:'Risis opens a pop-up in Osaka',location:'Tokyo · see issuer venue details',url:'https://prtimes.jp/main/html/rd/p/123.html'}));
 assert.equal(o.location,'Osaka · see issuer venue details');assert.equal(googlePlace(journeyItem(o)),undefined);assert.equal(o.lat,undefined);
});
