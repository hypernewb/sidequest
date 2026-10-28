import test from 'node:test';
import assert from 'node:assert/strict';
import {nextStumble,rememberStumble,readStumbleSession,stumbleConnection,stumbleEntityIds,STUMBLE_SESSION_LIMIT,momentTiming,stumbleHasTaste} from '../lib/stumble.ts';
import type {Opportunity} from '../lib/opportunities.ts';
const item=(id:string,patch:Partial<Opportunity>={}):Opportunity=>({id,title:'Official fixture',kind:'event',source:'Official source',url:'https://example.com/'+id,description:'Source wording',location:'Online',checkedAt:'2026-10-29T00:00:00Z',price:null,priceLabel:'Unknown',availability:'Check access',category:'music',...patch});
test('next stumble preserves server ranking and never repeats seen finds across refetches',()=>{
 const a=item('a'),b=item('b'),c=item('c');let seen:string[]=[];
 for(const expected of [a,b,c]){const next=nextStumble([a,b,c],seen);assert.equal(next?.id,expected.id);seen=rememberStumble(seen,next!.id);}
 assert.equal(nextStumble([c,a,b],seen),undefined);assert.equal(nextStumble([c,item('new'),a],seen)?.id,'new');
 assert.equal(nextStumble([a,b,c],[])?.id,'a');
});
test('no-name taste choices and reactions count as a profile',()=>{
 assert.equal(stumbleHasTaste([],{}),false);
 assert.equal(stumbleHasTaste([],{tags:[{id:'editorial:music',name:'Music',weight:1}]}),true);
 assert.equal(stumbleHasTaste([],{direction:'music'}),true);
 assert.equal(stumbleHasTaste([],{reactions:[{id:'event',action:'more'}]}),true);
 assert.equal(stumbleHasTaste([],{direction:'  '}),false);
 assert.equal(stumbleHasTaste(['seed']),true);
});
test('a bounded round stops rather than dropping old history and repeating',()=>{
 const seen=Array.from({length:STUMBLE_SESSION_LIMIT},(_,i)=>String(i));
 assert.equal(nextStumble([item('new')],seen),undefined);assert.equal(rememberStumble(seen,'new').length,STUMBLE_SESSION_LIMIT);
 assert.deepEqual(rememberStumble(['a'],'a'),['a']);
});
test('session history rejects broken data and bounds persisted data',()=>{
 assert.deepEqual(readStumbleSession({getItem:()=>'{broken'}),[]);
 assert.deepEqual(readStumbleSession({getItem:()=>JSON.stringify(['a','a',12,null,'','b'])}),['a','b']);
 assert.equal(readStumbleSession({getItem:()=>JSON.stringify(Array.from({length:250},(_,i)=>String(i)))}).length,200);
});
test('explanations distinguish source identity, associations and no profile',()=>{
 assert.equal(stumbleConnection(item('a',{discovery:'direct',reasons:['Source names a favourite']}),true).label,'Personal connection');
 assert.equal(stumbleConnection(item('b',{discovery:'adjacent',reasons:['Qloo taste association with your selected artist']}),true).text,'Qloo taste association with your selected artist');
 assert.equal(stumbleConnection(item('books',{discovery:'adjacent',reasons:['Your books choices match listing text.']}),true).text,'Your books choices match listing text.');
 assert.equal(stumbleConnection(item('feedback',{discovery:'adjacent',sourceFeedback:{score:2,reasons:['Same format as an earlier find you saved.']}}),true).text,'Same format as an earlier find you saved.');
 assert.match(stumbleConnection(item('c'),true).text,/No personal connection/);
 assert.match(stumbleConnection(item('c'),false).text,/Add taste/);
});
test('reaction entity identities use catalog subjects and performers, not seed contributors',()=>{
 const id='e11125af-936b-4935-b607-f2da2e6a6b92';
 assert.deepEqual(stumbleEntityIds(item('a',{artists:[{id,name:'Artist',input:'Artist',genres:[]}]})),[id]);
 assert.deepEqual(stumbleEntityIds(item('b')),[]);
});
test('date-only announcements retain source dates and unknown dates stay explicit',()=>{
 assert.equal(momentTiming(item('a',{start:'2026-11-01',end:'2026-11-02'})),'1 Nov 2026 to 2 Nov 2026');
 assert.match(momentTiming(item('b')),/Check the official announcement/);
});
