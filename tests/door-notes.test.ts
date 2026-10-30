import test from 'node:test';
import assert from 'node:assert/strict';
import {officialDoorFacts,applyDoorFacts,appreciationFor,guideFor} from '../lib/door-notes.ts';
import {openingWindows} from '../lib/scout.ts';
import {composeQuest} from '../lib/quests.ts';
import {questShareText} from '../lib/quest-share.ts';
import type {Opportunity} from '../lib/opportunities.ts';
const at='2026-10-30T01:00:00Z';
const seed={id:'seed',name:'Nujabes',type:'artist'};
const place=(title='Little Soul Cafe',url='https://www.littlesoulcafe.com/'):Opportunity=>({id:'venue',title,kind:'place',source:'Qloo',url,description:'',location:'Tokyo',checkedAt:at,price:null,priceLabel:'Unknown',availability:'',category:'listen',curation:{role:'listen',area:'Tokyo',tags:['jazz'],matchedTags:['jazz'],matchStrength:'anchor',mission:'Listen',doorNotes:['Cash only. No photos. ¥500 cover.'],source:url,reviewedAt:at,matchBasis:'genre_bridge'}});

test('official facts have literal evidence, source and check time; unverified catalog rules stay out',()=>{
 const item=place(),html='<p>2F Taisei Bldg, 3-20-2 Kitazawa</p><p>7pm–2am Open Every Night</p><p>Upcoming special event ¥500.</p>';
 const facts=officialDoorFacts(item,html,at);
 assert.equal(facts.length,2);
 assert.ok(facts.every(f=>html.includes(f.evidence)&&f.url===item.url&&f.checkedAt===at));
 assert.equal(facts.some(f=>/cash|photos|500/i.test(f.text)),false);
 assert.deepEqual(guideFor(item,seed).practical,[]);
 assert.deepEqual(officialDoorFacts({...item,title:'Another bar'},html,at),[]);
 assert.deepEqual(officialDoorFacts({...item,url:'https://example.com',curation:undefined},html,at),[]);
});

test('Japanese evidence is retained beside the scoped English access note',()=>{
 const facts=officialDoorFacts(place('Pianola Records','https://pianola-records.com/pages/about-us'),'<p>東京都世田谷区代田2丁目36-13 BONUS TRACK 内</p><p>14:00〜21:00（定休日：木）</p>',at);
 assert.match(facts[0].text,/Inside BONUS TRACK/);
 assert.match(facts[0].evidence,/世田谷/);
 assert.match(facts[1].text,/Closed Thursdays/);
});

test('explicit purchase and stock rules are source scoped, not inferred from a store category',()=>{
 const html='<p>We do not allow customers who do not intend to purchase to enter the store, or use the bar space or restrooms only.</p><p>We do not accept inquiries regarding stock.</p>';
 assert.equal(officialDoorFacts(place('BIG LOVE RECORDS','https://bigloverecords.jp/en/pages/about'),html,at).filter(f=>f.kind==='entry').length,2);
 assert.equal(officialDoorFacts(place('Other Records','https://other.example'),html,at).length,0);
});

test('structured addresses require an exact venue name and never become payment or booking rules',()=>{
 const html='<script type="application/ld+json">'+JSON.stringify({'@graph':[{name:'Other branch',address:{streetAddress:'Wrong address'}},{name:'Little Soul Cafe',address:{streetAddress:'2F source address',addressLocality:'Tokyo'},paymentAccepted:'Cash',isAccessibleForFree:true}]})+'</script>';
 const facts=officialDoorFacts(place(),html,at);
 assert.equal(facts.length,1);assert.equal(facts[0].text,'2F source address, Tokyo');
 assert.deepEqual(officialDoorFacts(place(),'<script type="application/ld+json">broken</script>',at),[]);
});

test('newly read hours replace a stale weekly opening before route planning',()=>{
 const item=place('Bar Music','https://barmusic-coffee.blogspot.com');
 item.hours={friday:[{opens:'18:00',closes:'24:00'}]};
 const current=applyDoorFacts(item,'<p>Open / 18:30~Midnight （ 金曜は翌早朝まで、 土 曜 ・日曜は18:00 Open ）</p>',at);
 assert.equal(openingWindows(current.hours||{},'2026-10-30')[0].open,1110);
 assert.equal(openingWindows(current.hours||{},'2026-10-31')[0].open,1080);
 assert.match(current.curation!.hoursBasis!,/read at dispatch/);
 const unchanged=applyDoorFacts(item,'<p>Unrelated event opens 17:00</p>',at);
 assert.equal(openingWindows(unchanged.hours||{},'2026-10-30')[0].open,1080);
 assert.deepEqual(unchanged.curation!.doorFacts,[]);
});

test('contrasting Qloo tag evidence changes the appreciation task without inventing what is playing',()=>{
 const hip=place();hip.curation!.matchedTags=['hiphop','jazz'];
 const metal=place();metal.curation!.matchedTags=['metal'];
 const a=appreciationFor(hip,seed),b=appreciationFor(metal,{name:'Iron Maiden'});
 assert.match(a.text,/Nujabes.*sampled phrase/);
 assert.match(b.text,/Iron Maiden.*riff/);
 assert.notEqual(a.text,b.text);
 assert.ok(!/is playing|cash only|no photos|cover charge/i.test(a.text+b.text));
 const stopover=appreciationFor({...hip,curation:{...hip.curation!,matchStrength:'stopover'}},seed);
 assert.ok(!stopover.text.includes('Nujabes'));assert.match(stopover.basis,/No specific cultural connection/);
 const books=place();books.curation={...books.curation!,role:'books',matchedTags:['photography']};
 assert.match(appreciationFor(books,{name:'Wong Kar-wai'}).text,/crop/);
 const digging={...hip,curation:{...hip.curation!,role:'dig' as const,matchedTags:['jazz']}};
 assert.notEqual(appreciationFor(digging,seed,0).text,appreciationFor(digging,seed,1).text);
 assert.notEqual(appreciationFor(digging,seed).text,appreciationFor({...digging,curation:{...digging.curation!,role:'listen'}},seed).text);
 const film={...books,curation:{...books.curation!,matchedTags:['film']}};
 assert.match(appreciationFor(film,{name:'Wong Kar-wai'}).text,/Wong Kar-wai.*sequence of pages/);
 assert.match(appreciationFor({...film,curation:{...film.curation!,role:'art'}},{name:'Wong Kar-wai'}).text,/film still/);
});

test('generated and shared quests retain evidence and distinguish suggestions from rules',()=>{
 const item=applyDoorFacts(place(),'<p>2F Taisei Bldg, 3-20-2 Kitazawa</p>',at);
 const q=composeQuest({date:'2026-10-30',checkedAt:at,tokyoNow:'',brief:'',map:null,notes:[],examined:1,eligible:1,stops:[{item,arrival:'19:00',departure:'19:45',hours:'19:00–24:00',travelMinutes:0,distanceMetres:0,reason:'Jazz match'}]},seed);
 assert.equal(q.stops[0].guide!.practical.length,1);
 const shared=questShareText(q);
 assert.match(shared,/Before you go: Second floor/);assert.match(shared,/Source: https/);assert.match(shared,/SideQuest suggestion:/);
 assert.ok(!shared.includes('Cash only'));
});
