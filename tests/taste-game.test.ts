import test from 'node:test';
import assert from 'node:assert/strict';
import {momentsContextSchema,withReaction} from '../lib/taste-profile.ts';
import {readBrowserTaste,writeBrowserTaste,writeBrowserTasteProfile,appendBrowserReaction,readBrowserReactions,TASTE_KEY} from '../lib/browser-taste.ts';
import {answerChoice,INVITATIONS,textureChoices,readGameDraft,TASTE_DRAFT_KEY,positiveQuestionAnchors} from '../lib/taste-game.ts';
function storage(){const map=new Map<string,string>();return {getItem:(key:string)=>map.get(key)||null,setItem:(key:string,value:string)=>{map.set(key,value);},removeItem:(key:string)=>{map.delete(key);}};}
test('legacy caller updates seeds without erasing direction, reactions or additional profile context',()=>{
 const s=storage();s.setItem(TASTE_KEY,JSON.stringify({seeds:[],avoid:['Example'],legacyTrail:{type:'preserved'},context:{legacyActivity:'art',tags:[{id:'editorial:jazz',name:'jazz',weight:1}],reactions:[{id:'one',action:'more'}],access:'online'}}));
 writeBrowserTaste(s,[]);const p=readBrowserTaste(s)!;
 assert.equal(p.context?.access,'online');assert.equal(p.context?.legacyActivity,'art');assert.equal(p.context?.reactions[0].action,'more');assert.deepEqual(p.legacyTrail,{type:'preserved'});assert.deepEqual(p.avoid,['Example']);
});
test('draft changes and resume never alter applied profile until explicit apply',()=>{
 const s=storage();writeBrowserTaste(s,[]);const original=s.getItem(TASTE_KEY);
 const context=answerChoice({tags:[],reactions:[]},'invitation',INVITATIONS[0]);
 s.setItem(TASTE_DRAFT_KEY,JSON.stringify({step:1,context}));
 assert.equal(readGameDraft(s)?.step,1);assert.equal(s.getItem(TASTE_KEY),original);
 writeBrowserTasteProfile(s,{seeds:[],context});assert.equal(readBrowserTaste(s)?.context?.direction,'music');
});
test('concrete first choice changes the next question and replacing it removes dependent answers',()=>{
 const a=answerChoice({tags:[],reactions:[]},'invitation',INVITATIONS[0]);
 const music=textureChoices(a);const b=answerChoice(a,'texture',music[0]);
 const art=answerChoice(b,'invitation',INVITATIONS[2]);
 assert.notDeepEqual(music,textureChoices(art));assert.equal(art.answers?.texture,undefined);assert.ok(!art.tags.some(t=>t.name==='jazz'));
});
test('unfamiliar and practical rejection reasons remain distinct from dislike',()=>{
 const context=momentsContextSchema.parse({});
 const unknown=withReaction(context,{id:'one',action:'seen',reason:'unknown'});
 const price=withReaction(unknown,{id:'two',action:'too-expensive',reason:'price'});
 assert.deepEqual(price.reactions.map(r=>r.reason),['unknown','price']);assert.deepEqual(price.tags,[]);
});
test('reaction history is bounded, replaces a prior reaction and preserves known taste',()=>{
 const s=storage();writeBrowserTasteProfile(s,{seeds:[],context:{tags:[{id:'editorial:jazz',name:'jazz',weight:1}],reactions:[]}});
 for(let i=0;i<105;i++)appendBrowserReaction(s,{id:String(i),action:'more'});
 appendBrowserReaction(s,{id:'104',action:'pass',reason:'format'});
 const rows=readBrowserReactions(s);assert.equal(rows.length,100);assert.equal(rows.filter(r=>r.id==='104').length,1);assert.equal(rows.at(-1)?.reason,'format');assert.equal(readBrowserTaste(s)?.context?.tags[0].name,'jazz');
});
test('context rejects excessive weights, invalid identifiers, invalid budgets and oversized history',()=>{
 for(const value of [{tags:[{id:'editorial:jazz',name:'jazz',weight:2}]},{tags:[{id:'untrusted',name:'jazz',weight:1}]},{budget:Infinity},{budget:-1},{reactions:Array(101).fill({id:'one',action:'more'})}])assert.equal(momentsContextSchema.safeParse(value).success,false);
});
test('returning interview uses positive reaction entities as Qloo anchors and keeps prior Qloo choices',()=>{
 const one='11111111-1111-4111-8111-111111111111',two='22222222-2222-4222-8222-222222222222';
 const context=momentsContextSchema.parse({tags:[{id:'urn:tag:genre:music:jazz',name:'Jazz',weight:.8}],reactions:[{id:'one',action:'more',entityIds:[one]},{id:'two',action:'pass',reason:'unknown',entityIds:[two]}]});
 assert.deepEqual(positiveQuestionAnchors(context),[one]);
 const next=answerChoice(context,'invitation',INVITATIONS[2]);assert.ok(next.tags.some(t=>t.id==='urn:tag:genre:music:jazz'));assert.equal(next.reactions.length,2);
});
