import test from 'node:test';
import assert from 'node:assert/strict';
import {applyChoice,chooseNext,choosePair,discoveryFacets,recordComparison} from '../lib/discovery-learning.ts';
import type {Opportunity} from '../lib/opportunities.ts';
const context={tags:[],reactions:[]};
const item=(id:string,category='jazz',patch:Partial<Opportunity>={}):Opportunity=>({id,title:'Programme '+id,kind:'gig',category,source:'Official',url:'https://example.com/'+id,description:'A soulful evening with an imagined celebrity',location:'Tokyo',price:null,priceLabel:'Check',availability:'Check official page',checkedAt:'2026-10-29T00:00:00Z',...patch});
test('same inputs are deterministic and selected objects belong to the supplied eligible inventory',()=>{
 const items=[item('b'),item('a'),item('c','art',{kind:'exhibition'})];
 assert.deepEqual(choosePair(items,[],context),choosePair(items,[],context));
 const pair=choosePair(items,[],context);assert.ok(items.includes(pair.left!));assert.ok(items.includes(pair.right!));
 assert.equal(pair.left?.availability,'Check official page');
});
test('last preference changes the next comparison, while several tastes survive',()=>{
 const a=item('a','jazz'),b=item('b','art',{kind:'exhibition'}),c=item('c','jazz'),d=item('d','art',{kind:'exhibition'});
 const items=[a,b,c,d];
 const jazz=recordComparison([],a,b,'left'),art=recordComparison([],a,b,'right');
 assert.equal(choosePair(items,[],context,jazz).left?.id,'c');
 assert.equal(choosePair(items,[],context,art).left?.id,'d');
 const draft=applyChoice(applyChoice(context,a),b);
 assert.equal(draft.reactions.length,2);assert.equal(draft.tags.length,2);assert.deepEqual(context,{tags:[],reactions:[]});
});
test('unknown and neither record distinct answers without making negative taste evidence',()=>{
 const a=item('a'),b=item('b','art',{kind:'exhibition'}),items=[a,b,item('c'),item('d','art',{kind:'exhibition'})];
 const unknown=recordComparison([],a,b,'unknown'),neither=recordComparison([],a,b,'neither');
 assert.notDeepEqual(unknown,neither);
 assert.deepEqual(choosePair(items,[],context,unknown),choosePair(items,[],context,neither));
 assert.ok(applyChoice(context,a,b).reactions.every(r=>r.action==='more'));
});
test('comparison diversity follows cultural facets rather than publisher and removes near duplicates',()=>{
 const a=item('a','jazz',{title:'Tokyo Jazz Night 2026'}),duplicate=item('b','jazz',{title:'Tokyo Jazz Night 2027',source:'Other publisher'}),other=item('c','art',{kind:'exhibition'});
 assert.equal(choosePair([a,duplicate,other],[],context).right?.id,'c');
 assert.equal(chooseNext([a,duplicate,other],['a'],context)?.id,'c');
 assert.equal(chooseNext([a,item('clone','jazz',{url:a.url})],['a'],context),undefined);
});
test('unrestricted prose and unknown names create no artist or soul genre fallback',()=>{
 const facets=discoveryFacets(item('a'));
 assert.ok(!facets.some(f=>/soul|celebrity|entity:/.test(f)));
 assert.equal(chooseNext([item('a')],[],context)?.id,'a');
});
test('verified Qloo association supplies a prior without a name fallback or invented candidate',()=>{
 const a=item('a'),z=item('z','jazz',{qlooEvidence:[{entityId:'verified',entityName:'Verified artist',domain:'artist',affinity:.9,percentile:1,contributors:[{id:'seed',name:'Seed',score:1,weight:1}]}]});
 assert.equal(chooseNext([a,z],[],context)?.id,'z');
 assert.equal(chooseNext([a],[],context)?.id,'a');
});
test('literal title subjects distinguish books from photography despite generic popup categories',()=>{
 const category='popup goods art fashion';
 const books=item('a',category,{kind:'popup',title:'CORNER BOOKS popup'});
 const moreBooks=item('b',category,{kind:'popup',title:'Independent ZINE book fair'});
 const photo=item('c',category,{kind:'popup',title:'写真展 Frame the Wild'});
 assert.ok(discoveryFacets(books).includes('subject:books-zines'));
 assert.ok(discoveryFacets(photo).includes('subject:photography'));
 assert.ok(!discoveryFacets(books).includes('subject:fashion'));
 assert.equal(choosePair([books,moreBooks,photo],[],context).right?.id,'c');
 assert.equal(choosePair([books,moreBooks,photo],[],applyChoice(context,books)).right?.id,'c');
 assert.equal(chooseNext([books,moreBooks,photo],['a'],context)?.id,'c');
 const prose=item('prose',category,{title:'A soulful evening',description:'Photography books vinyl artist toys fashion'});
 assert.ok(!discoveryFacets(prose).some(f=>f.startsWith('subject:')||f.startsWith('genre:')));
});
test('recent semantic repetition yields to plausible variety but relevance floor excludes unrelated low-evidence items',()=>{
 const a=item('a'),b=item('b'),c=item('c','art',{kind:'exhibition'});
 assert.equal(chooseNext([a,b,c],['a'],context)?.id,'c');
 assert.equal(choosePair([item('strong','jazz',{score:40,discovery:'direct'}),item('junk','unrelated')],[],context).right,undefined);
});
test('rounds terminate with partial and exhausted results and bound history',()=>{
 const a=item('a');assert.equal(choosePair([a],[],context).right,undefined);
 assert.equal(choosePair([a],['a'],context).left,undefined);
 assert.equal(chooseNext([a],Array.from({length:200},(_,i)=>String(i)),context),undefined);
 let history=[] as ReturnType<typeof recordComparison>;for(let i=0;i<80;i++)history=recordComparison(history,a,item('b'),'unknown');assert.equal(history.length,40);
 const full=choosePair([item('new'),item('another')],[],context,history);assert.equal(full.left,undefined);assert.equal(full.exhausted,true);assert.match(full.reason,/40-comparison/);
});
