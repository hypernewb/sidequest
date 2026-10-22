import test from 'node:test';
import assert from 'node:assert/strict';
import {discoveryPoints} from '../lib/map-data.ts';
import {attachFeverCoordinates} from '../lib/fever-client.ts';
import {parseFeverEvents,type FeverEvent} from '../lib/fever-data.ts';
import type {Place} from '../lib/discovery.ts';
const e={id:'fever:100',name:'Location contract',location:'Test venue, Tokyo',url:'https://feverup.com/m/100'} as FeverEvent;
const q={area:'tokyo' as const,dates:['2099-10-24'],budget:'flexible',rejected:[]};
test('map pins reject invalid coordinates and never infer a point from a location name',()=>{
 const p={id:'p',name:'Place',lat:35.6,lon:139.7,address:'Tokyo'} as Place;
 const points=discoveryPoints([p,{...p,id:'bad',lat:NaN}],[e,{...e,id:'fever:101',coordinates:{lat:35.7,lon:139.8}},{...e,id:'bad',coordinates:{lat:91,lon:0}}]);
 assert.deepEqual(points.map(p=>p.label),['P1','E2']);assert.equal(points[0].kind,'place');assert.equal(points[1].kind,'event');
});
test('Fever mapping requires event ID membership in the candidate venue; failures retain the listing',async()=>{
 const call=async(name:string,args:Record<string,unknown>)=>name==='search_venues'?{results:[{venue_id:10,latitude:35.658,longitude:139.7016,city_code:'HND',country_code:'JP'}]}:(assert.equal(args.venue_id,10),{results:[{id:100}]});
 const confirmed=await attachFeverCoordinates([e],q,{},call);assert.deepEqual(confirmed[0].coordinates,{lat:35.658,lon:139.7016});
 const mismatch=await attachFeverCoordinates([e],q,{},async(name,args)=>name==='search_events'?{results:[{id:101}]}:call(name,args));assert.equal(mismatch[0].coordinates,undefined);
 const failure=await attachFeverCoordinates([e],q,{},async()=>{throw Error('Provider unavailable');});assert.deepEqual(failure,[e]);
});
test('Fever parser carries valid venue coordinates but excludes malformed coordinates from map data',()=>{
 const raw={id:100,name:'Test',url:e.url,timezone:'Asia/Tokyo',session_start_times:['2099-10-24T10:00:00']};
 assert.deepEqual(parseFeverEvents({results:[{...raw,venue:{latitude:35.6,longitude:139.7}}]},q,'2099-10-23T00:00:00Z')[0].coordinates,{lat:35.6,lon:139.7});
 assert.equal(parseFeverEvents({results:[{...raw,venue:{latitude:95,longitude:139.7}}]},q,'2099-10-23T00:00:00Z')[0].coordinates,undefined);
});
