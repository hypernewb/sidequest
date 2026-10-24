import test from 'node:test';
import assert from 'node:assert/strict';
import {applyFocus,focusQuestion} from '../lib/quest-focus.ts';
import {eventFit,eventLeads,withProgrammes} from '../lib/quest-event-matching.ts';
import {programmeFor} from '../lib/quest-programmes.ts';
import {planScout} from '../lib/scout.ts';
import {questSeed,type QuestSeed} from '../lib/quest-seeds.ts';
import {questChoices} from '../lib/quests.ts';
import type {Opportunity,Preferences} from '../lib/opportunities.ts';
const now=new Date('2026-10-25T03:00:00Z'),date='2026-10-25';
const seed:QuestSeed={id:'E11125AF-936B-4935-B607-F2DA2E6A6B92',name:'Nujabes',type:'artist',description:'',tags:[],taste:[{name:'Hip hop',weight:1}]};
const p:Preferences={intent:'mix',direction:'any',format:'places',date,days:1,budget:'any',unknownPrice:true,seeds:[{...seed,feeling:'love'}],exclude:[]};
function venue(id:string,role:'coffee'|'books'|'art'|'dig',lat=35.67):Opportunity{return {id,title:'Gallery '+id,kind:'place',source:'Qloo',url:'https://example.com/'+id,description:'',location:'Tokyo',checkedAt:now.toISOString(),price:null,priceLabel:'Unknown',availability:'',category:role,lat,lon:139.70,hours:{sunday:[{opens:'12:00',closes:'20:00'}]},curation:{role,area:'Tokyo',tags:role==='dig'?['hiphop']:[],mission:'Browse',doorNotes:[],source:'https://example.com/'+id,reviewedAt:now.toISOString(),matchBasis:'entity',tasteScore:role==='dig'?80:2,matchStrength:role==='dig'?'anchor':'stopover'}};}
function event(patch:Partial<Opportunity>={}):Opportunity{return {id:'announcement',title:'Nujabes artwork exhibition',kind:'exhibition',source:'Official fixture',url:'https://example.com/announcement',description:'',location:'Gallery art, Tokyo',checkedAt:now.toISOString(),start:date,end:date,price:0,priceLabel:'Free',availability:'',category:'exhibition',...patch};}
test('the same seed can choose records or visual art, and a route must include its chosen activity',()=>{
 const rows=[venue('coffee','coffee'),venue('art','art'),venue('book','books'),venue('record','dig')];
 const visual=planScout(applyFocus(rows,'visual'),p,now),sound=planScout(applyFocus(rows,'sound'),p,now);
 assert.ok(visual.stops.some(s=>s.item.curation?.role==='art'));
 assert.ok(sound.stops.some(s=>s.item.curation?.role==='dig'));
 assert.match(visual.stops.find(s=>s.item.curation?.role==='art')!.reason,/You asked for/);
 assert.equal(planScout(applyFocus(rows.filter(o=>o.curation?.role!=='art'),'visual'),p,now).stops.length,0);
 assert.ok(focusQuestion({...seed,type:'movie'}).options.some(o=>o.id==='print'));
});
test('a relevant dated programme changes venue scores before planning, without mutating the base pool',()=>{
 const rows=[venue('art','art'),venue('coffee','coffee'),venue('book','books')];
 assert.equal(planScout(rows,p,now).stops.length,0);
 const boosted=withProgrammes(rows,[event()],seed,p,now);
 assert.equal(boosted[0].curation?.programmeId,'announcement');
 assert.equal(boosted[0].curation?.matchStrength,'anchor');
 assert.equal(rows[0].curation?.matchStrength,'stopover');
 assert.equal(planScout(boosted,p,now).stops.length,2);
 assert.equal(withProgrammes(rows,[event({price:3000})],seed,{...p,budget:'1000'},now).some(o=>o.id==='art'),false);
});
test('programme selection favors an explicit subject over an unrelated concurrent listing',()=>{
 const unrelated=event({id:'other',title:'Unrelated exhibition'}),specific=event();
 assert.equal(programmeFor(venue('art','art'),date,[unrelated,specific],now,e=>eventFit(e,seed)?.score||0)?.id,'announcement');
});
test('event leads reject expired, stale, sold-out, online, non-Tokyo and expensive records',()=>{
 const valid=event(),bad=[event({id:'old',checkedAt:'2026-10-23T00:00:00Z'}),event({id:'expired',end:'2026-10-24'}),event({id:'online',online:true}),event({id:'osaka',location:'Osaka'}),event({id:'price',price:5000})];
 const sold=event({id:'sold',details:{original:'',artists:[],genres:[],times:[],prices:[],priceCeiling:0,status:'sold_out',checkedAt:now.toISOString(),url:'https://example.com'}});
 assert.deepEqual(eventLeads([valid,...bad,sold],seed,{...p,budget:'1000'},now).map(e=>e.id),['announcement']);
 assert.equal(eventFit(event({title:'Nujabesian exhibition'}),seed),null);
 const film={...seed,name:'Akira',type:'movie'};
 assert.equal(eventFit(event({title:'Jazz night',details:{original:'',artists:['Akira Sakata'],genres:[],times:[],prices:[],priceCeiling:0,status:'unknown',checkedAt:now.toISOString(),url:'https://example.com'}}),film),null);
});
test('genre metadata survives long film keyword lists rather than getting truncated away',()=>{
 const tags=[...Array.from({length:35},(_,i)=>({name:'Keyword '+i,type:'urn:tag:keyword:media'})),{name:'Animation',type:'urn:tag:genre:media'}];
 assert.ok(questSeed({entity_id:seed.id,name:'Film',types:['urn:entity:movie'],tags})?.taste?.some(t=>t.name==='Animation'));
});
test('one supported specialist remains useful without inventing a walking loop',()=>{
 const plan=planScout([venue('specialist','dig')],p,now);
 assert.equal(plan.stops.length,1);assert.equal(plan.walkingMetres,0);
 assert.match(plan.map!,/maps\/search/);assert.match(plan.notes.join(' '),/rather than a walking loop/);
});
test('upcoming gigs can be separate leads, while sold-out cards and online performances stay out',()=>{
 const dex=event({id:'gig',kind:'gig',title:'Metal night',start:'2026-10-28',end:'2026-10-28',artists:[{id:seed.id,input:'Nujabes',name:'Nujabes',genres:[]}]}),sold=event({id:'soldcard',priceLabel:'JPY 6000 SOLD OUT'}),online=event({id:'stream',kind:'gig',online:true});
 assert.deepEqual(eventLeads([dex,sold,online],seed,p,now).map(e=>e.id),['gig']);
 const drop=event({kind:'release',online:true,location:'Online'});
 assert.equal(eventLeads([drop],seed,p,now)[0]?.online,true);
});
test('an artist graph association cannot override a conflicting published genre',()=>{
 const metal=event({title:'DEXCORE',kind:'gig',signals:['Nujabes'],artists:[{id:'other',input:'DEXCORE',name:'DEXCORE',genres:['Metal','Deathcore']}]});
 assert.equal(eventFit(metal,seed),null);
 assert.ok(eventFit(metal,{...seed,name:'Slayer',taste:[{name:'Thrash Metal',weight:1}]}));
});
test('a Japanese franchise announcement can match a game without claiming its exact edition',()=>{
 const pokemon={...seed,name:'Pokemon FireRed Version',type:'videogame',taste:[]};
 const fit=eventFit(event({title:'ポケモン 新作グッズ',kind:'release',online:true}),pokemon);
 assert.equal(fit?.direct,false);assert.match(fit!.reason,/does not confirm this particular edition or stock/);
 assert.equal(eventFit(event({title:'Digimon collectibles'}),pokemon),null);
});
test('disambiguation shows actual exact-name alternatives before unrelated search matches',()=>{
 const choices=[{name:'Slayer',type:'artist'},{name:'Slayer',type:'videogame'},{name:'Slayer Shock',type:'videogame'}];
 assert.equal(questChoices('Slayer',choices).length,2);
 assert.equal(questChoices('Unknown',Array.from({length:10},(_,i)=>({name:String(i)}))).length,4);
});
