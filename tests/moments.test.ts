import test from 'node:test';
import {extractEventDetails} from '../lib/event-detail-parser.ts';
import assert from 'node:assert/strict';
import {parseBandcamp,parseHololive,parseSteam} from '../lib/global-sources.ts';
import {momentEligible,selectMoments,onlineMoment} from '../lib/moments.ts';
import type {Opportunity,Preferences} from '../lib/opportunities.ts';
const now=new Date('2026-10-28T04:00:00Z'),stamp=now.toISOString();
const p:Preferences={intent:'mix',direction:'any',format:'dated',date:'2026-10-28',days:30,budget:'any',unknownPrice:true,seeds:[],exclude:[]};
const item=(patch:Partial<Opportunity>={}):Opportunity=>({id:'one',title:'Limited art release',kind:'release',source:'Official fixture',url:'https://example.com/drop',description:'An official limited edition',location:'Online shop',online:true,start:'2026-10-28',end:'2026-11-02',checkedAt:stamp,price:null,priceLabel:'See prices',availability:'Check availability',category:'collectibles',...patch});

test('booking contacts after an INFO header do not become performers',()=>{
 const details=extractEventDetails('LINE UP\nArtist One\nArtist Two\nINFO\nDARK HORSES BOOKINGS office@example.com','https://www.liquidroom.net/schedule/test');
 assert.deepEqual(details.artists,['Artist One','Artist Two']);
});

test('listening parties use real scheduled instants and do not turn album pricing into admission',()=>{
 const e={artist:'Real artist',title:'New record party',liveEventUrl:'https://artist.bandcamp.com/live/party',scheduledStartDate:'28 Oct 2026 16:00:00 GMT',description:'Ambient music listening party',eventType:'l',price:{amount:500,currency:'USD'}};
 const blob=JSON.stringify({appData:{featuredEvents:{items:[e]},events:{items:[e]}}}).replaceAll('"','&quot;');
 const rows=parseBandcamp(`<div data-blob="${blob}"></div>`,stamp);
 assert.equal(rows.length,1);assert.equal(rows[0].startsAt,'2026-10-28T16:00:00.000Z');assert.equal(rows[0].start,'2026-10-29');assert.equal(rows[0].price,null);assert.equal(rows[0].endsAt,undefined);assert.deepEqual(rows[0].details?.artists,['Real artist']);
 const bad=blob.replaceAll('artist.bandcamp.com/live/party','evil.example/party');assert.equal(parseBandcamp(`<div data-blob="${bad}"></div>`,stamp).length,0);
});

test('preorder windows come from the order block, with exact JST cutoffs and separate shipping',()=>{
 const html='<meta property="og:title" content="A birthday collection"><p><span>Order Period</span> : 2026/10/19 11:05 ~ 2026/11/24 18:00 (JST)</p><p>Shipping by late May 2027</p>';
 const [o]=parseHololive(html,'https://shop.hololivepro.com/en/products/birthday',stamp);
 assert.equal(o.endsAt,'2026-11-24T09:00:00.000Z');assert.equal(o.start,'2026-10-19');assert.equal(o.end,'2026-11-24');assert.equal(o.online,true);assert.match(o.availability,/not proof of a numbered edition/);
 assert.deepEqual(parseHololive('<meta property="og:title" content="Ordinary stock"><p>Published 2026/10/19. Shipping May 2027.</p>',o.url,stamp),[]);
 assert.deepEqual(parseHololive(html,'https://malicious.example/products/birthday',stamp),[]);
});

test('Steam requires an explicit festival range and does not mistake news metadata for duration',()=>{
 const entry={gid:'12345',published:1,event_name:'Steam Scream is here',rtime32_start_time:1793036400,rtime32_end_time:1793040000,jsondata:JSON.stringify({localized_subtitle:['October 26th through November 2nd is packed with games']}),announcement_body:{body:'From now through November 2nd at 10 a.m. PT.'}};
 const [o]=parseSteam(JSON.stringify({events:[entry]}),stamp);
 assert.equal(o.start,'2026-10-26');assert.equal(o.endsAt,'2026-11-02T18:00:00.000Z');assert.equal(o.end,'2026-11-03');
 assert.deepEqual(parseSteam(JSON.stringify({events:[{...entry,event_name:'Steam client update'}]}),stamp),[]);
 assert.deepEqual(parseSteam(JSON.stringify({events:[{...entry,jsondata:'{}'}]}),stamp),[]);
});

test('moments exclude permanent venues, generic stock, ended orders and already-started streams of unknown duration',()=>{
 assert.equal(momentEligible(item({kind:'place',start:undefined,end:undefined}),now),false);
 assert.equal(momentEligible(item({actionLabel:'Shop listing published'}),now),false);
 assert.equal(momentEligible(item({actionLabel:'Preorder window',endsAt:'2026-10-28T03:00:00Z'}),now),false);
 assert.equal(momentEligible(item({kind:'event',startsAt:'2026-10-28T03:00:00Z',endsAt:undefined}),now),false);
 assert.equal(momentEligible(item({actionLabel:'Preorder window',endsAt:'2026-10-29T03:00:00Z'}),now),true);
 assert.equal(onlineMoment(item({location:'Japan · participating retailers',actionLabel:'In-store lottery release'})),false);
});

test('online and Tokyo filters keep access separate; source variety does not overrule a genuine taste match',()=>{
 const online=item(),tokyo=item({id:'tokyo',kind:'gig',title:'Tokyo show',source:'Local venue',url:'https://example.com/show',online:false,location:'Tokyo'}),osaka=item({id:'osaka',kind:'popup',online:false,location:'Osaka',url:'https://example.com/osaka'});
 assert.deepEqual(selectMoments([online,tokyo,osaka],p,'online','all','for-you',now).map(o=>o.id),['one']);
 assert.deepEqual(selectMoments([online,tokyo,osaka],p,'tokyo','all','for-you',now).map(o=>o.id),['tokyo']);
 const seed={id:'E11125AF-936B-4935-B607-F2DA2E6A6B92',name:'Nujabes',type:'artist',feeling:'love' as const};
 const match=item({id:'match',title:'Nujabes record listening party',kind:'event',url:'https://example.com/match'});
 assert.equal(selectMoments([online,match],{...p,seeds:[seed]},'all','all','for-you',now)[0].id,'match');
});
