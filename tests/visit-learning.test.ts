import test from 'node:test';
import assert from 'node:assert/strict';
import {withReaction,replacePlanReactions,learningReactions,reactionTasteWeight,momentsContextSchema} from '../lib/taste-profile.ts';
import {positiveSignals,enrichMomentTaste} from '../lib/catalog-taste.ts';
import {selectMoments} from '../lib/moments.ts';
import {VENUES} from '../lib/curated-venues.ts';
import {applyQuestLearning} from '../lib/visit-learning.ts';
import type {Opportunity,Preferences} from '../lib/opportunities.ts';
const id=(n:number)=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const now=new Date('2026-10-30T03:00:00Z');
const entity={id:id(1),name:'Artist One',type:'artist',input:'Artist One',evidence:'performer' as const};
const item=(key:string,extra:Partial<Opportunity>={}):Opportunity=>({id:key,title:'Artist One live',kind:'gig',source:'Official fixture',url:'https://example.com/'+key,description:'A show',location:'Tokyo',category:'live music',checkedAt:now.toISOString(),start:'2026-10-30',end:'2026-10-30',price:null,priceLabel:'Unknown',availability:'Check source',catalogEntities:[entity],details:{original:'LINE UP\nArtist One',artists:['Artist One'],genres:[],times:[],prices:[],priceCeiling:null,status:'unknown',checkedAt:now.toISOString(),url:'https://example.com/'+key},...extra});
const p:Preferences={intent:'mix',direction:'any',format:'dated',date:'2026-10-30',days:30,budget:'any',unknownPrice:true,seeds:[],exclude:[]};
test('visit ratings supersede planning and saving, rerating replaces instead of accumulating',()=>{
 let context=withReaction({tags:[],reactions:[]},{id:'past',action:'planned'});
 context=withReaction(context,{id:'past',action:'save'});context=withReaction(context,{id:'past',action:'visit',rating:5});
 assert.equal(reactionTasteWeight(learningReactions(context)[0]),1);
 context=withReaction(context,{id:'past',action:'visit',rating:3});context=withReaction(context,{id:'past',action:'save'});
 assert.equal(reactionTasteWeight(learningReactions(context)[0]),0);assert.equal(context.reactions.filter(r=>r.action==='visit').length,1);
 assert.ok(!momentsContextSchema.safeParse({tags:[],reactions:[{id:'past',action:'visit',rating:6}]}).success);
});
test('replacing a day removes its old intent signals while preserving actual visit ratings',()=>{
 const context={tags:[],reactions:[{id:'old',action:'planned' as const},{id:'old',action:'visit' as const,rating:5},{id:'saved',action:'save' as const}]};
 const next=replacePlanReactions(context,['old'],['new']);
 assert.ok(!next.reactions.some(r=>r.id==='old'&&r.action==='planned'));assert.ok(next.reactions.some(r=>r.id==='old'&&r.action==='visit'));assert.ok(next.reactions.some(r=>r.id==='saved'));assert.ok(next.reactions.some(r=>r.id==='new'&&r.action==='planned'));
});
test('intent is weaker than enjoyment and browser-supplied identities cannot become Qloo signals',()=>{
 const context={tags:[],reactions:[{id:'past',action:'planned' as const,entityIds:[id(99)]}]};
 const planned=positiveSignals([item('past')],p,context);assert.equal(planned[0].weight,.2);assert.equal(planned[0].id,id(1));
 const loved=positiveSignals([item('past')],p,withReaction(context,{id:'past',action:'visit',rating:5}));assert.equal(loved[0].weight,1);
 const disliked=positiveSignals([item('past')],p,withReaction(context,{id:'past',action:'visit',rating:1}));assert.equal(disliked.length,0);
});
test('ratings still learn from trusted server history after a dated show expires',()=>{
 const result=positiveSignals([],p,{tags:[],reactions:[{id:'expired',action:'visit',rating:4}]},{expired:[entity]});assert.equal(result[0].id,id(1));assert.equal(result[0].weight,.5);
});
test('a rated curated quest stop becomes a trusted place signal, while arbitrary place IDs do not',()=>{
 const venue=VENUES.find(v=>v.qlooId)!;
 const context={tags:[],reactions:[{id:venue.qlooId!,action:'visit' as const,rating:5},{id:id(999),action:'visit' as const,rating:5,entityIds:[venue.qlooId!]}]};
 const signals=positiveSignals([],p,context);assert.equal(signals.length,1);assert.equal(signals[0].name,venue.name);assert.equal(signals[0].weight,1);
});
test('quest enjoyment changes the ranking score while preserving cultural fit and hours constraints',()=>{
 const o=item('venue',{curation:{role:'listen',area:'Tokyo',mission:'Listen',tags:['jazz'],doorNotes:[],source:'https://example.com',reviewedAt:'2026-10-30',matchBasis:'entity',tasteScore:50,matchStrength:'anchor'}});
 const love=applyQuestLearning([o],{tags:[],reactions:[{id:o.id,action:'visit',rating:5}]})[0];
 const low=applyQuestLearning([o],{tags:[],reactions:[{id:o.id,action:'visit',rating:1}]})[0];
 const plan=applyQuestLearning([o],{tags:[],reactions:[{id:o.id,action:'planned'}]})[0];
 assert.equal(love.curation?.tasteScore,70);assert.equal(low.curation?.tasteScore,30);assert.ok(plan.curation!.tasteScore!<love.curation!.tasteScore!);assert.equal(low.curation?.matchStrength,'anchor');assert.equal(o.curation?.tasteScore,50);
});
test('a low rating reduces the same artist but leaves unrelated artists and the genre available',async()=>{
 const past=item('past'),same=item('same'),other=item('other',{title:'Artist Two live',catalogEntities:[{...entity,id:id(2),name:'Artist Two',input:'Artist Two'}],details:{...past.details!,artists:['Artist Two']}});
 const context={tags:[],reactions:[{id:past.id,action:'visit' as const,rating:1}]};
 const result=await enrichMomentTaste([same,other],p,'fixture',async()=>null,async()=>{},context,async()=>({results:{entities:[]}}),[past,same,other]);
 const rows=selectMoments(result.items,p,'all','all','for-you',now,context);
 assert.equal(rows[0].id,'other');assert.equal(rows.length,2);assert.ok(rows[1].reasons?.some(r=>r.includes('1/5 enjoyment rating')));assert.equal(result.diagnostics.positiveSignals.length,0);
});
