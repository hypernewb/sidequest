import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {parseTasteLore,confirmedLoreInterest,mergeLoreInterest} from '../lib/taste-lore.ts';
import {interestWeight,interestSeedSchema,strengthLabel} from '../lib/interest-strength.ts';
import {readBrowserTaste,writeBrowserTasteProfile} from '../lib/browser-taste.ts';
import {selectMoments} from '../lib/moments.ts';
import {positiveSignals} from '../lib/catalog-taste.ts';
import {chooseNext} from '../lib/discovery-learning.ts';
import {evidenceFromEntity,graphStrength} from '../lib/qloo-candidates.ts';
import type {Opportunity,Preferences} from '../lib/opportunities.ts';

const id=(n:number)=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const now=new Date('2026-10-29T04:00:00Z');
const seed=(n:number,name:string,weight:number)=>confirmedLoreInterest({id:id(n),name,type:'artist'},weight);
const p:Preferences={intent:'mix',direction:'any',format:'dated',date:'2026-10-29',days:30,budget:'any',unknownPrice:true,seeds:[],exclude:[]};
const gig=(n:number,name:string,genre='jazz'):Opportunity=>({id:'event:'+n,title:name+' live',kind:'gig',source:'Official fixture '+n,url:'https://example.com/'+n,description:'Official programme',location:'Tokyo',start:'2026-10-30',end:'2026-10-30',checkedAt:now.toISOString(),price:null,priceLabel:'Unknown',availability:'Check source',category:'gig',artists:[{id:id(n),name,input:name,genres:[genre]}]});

test('lore separates current obsession, liking, past love and curiosity',()=>{
 const rows=parseTasteLore("I'm obsessed with Nujabes. I like Radiohead. I used to love Digimon, and I'm curious about Björk.");
 assert.deepEqual(rows.map(r=>[r.query,r.weight]),[['Nujabes',1],['Radiohead',.65],['Digimon',0],['Björk',.4]]);
});
test('negation never becomes a positive love, and repeated names use the last explicit wording',()=>{
 assert.deepEqual(parseTasteLore('I love Nujabes but I do not like Gundam. I used to love Digimon.').map(r=>[r.query,r.weight]),[['Nujabes',1],['Gundam',-1],['Digimon',0]]);
 assert.equal(parseTasteLore('I like Radiohead. I hate Radiohead.')[0].weight,-1);
 assert.equal(parseTasteLore('Nujabes is my favourite.')[0].query,'Nujabes');
});
test('unknown strength requires a review and quoted multiword names survive lists',()=>{
 assert.equal(parseTasteLore('Nujabes')[0].weight,undefined);
 assert.deepEqual(parseTasteLore('I love "Belle and Sebastian" and "J Dilla".').map(r=>r.query),['Belle and Sebastian','J Dilla']);
 assert.equal(parseTasteLore('')[0],undefined);
});
test('phone smart apostrophes and not-interested wording retain the right names and strengths',()=>{
 assert.deepEqual(parseTasteLore('I’m obsessed with Nujabes. I’m curious about Björk. I am not interested in Radiohead.').map(r=>[r.query,r.weight]),[['Nujabes',1],['Björk',.4],['Radiohead',-1]]);
});
test('strength survives browser persistence, including zero and negatives; legacy feelings still work',()=>{
 const data=new Map<string,string>(),storage={getItem:(k:string)=>data.get(k)||null,setItem:(k:string,v:string)=>{data.set(k,v);}};
 writeBrowserTasteProfile(storage,{seeds:[seed(1,'Nujabes',1),seed(2,'Radiohead',.65),seed(3,'Past favourite',0),seed(4,'Avoided artist',-1)]});
 assert.deepEqual(readBrowserTaste(storage)?.seeds.map(s=>interestWeight(s)),[1,.65,0,-1]);
 assert.equal(interestWeight({feeling:'curious'}),.4);assert.equal(interestWeight({feeling:'love'}),1);assert.equal(strengthLabel({weight:0}),'Not using');
 assert.equal(interestSeedSchema.safeParse({...seed(1,'Nujabes',1),weight:20}).success,false);
});
test('swapping relative strengths swaps recommendations and inactive names get no personal tier',()=>{
 const items=[gig(1,'Nujabes'),gig(2,'Radiohead','alternative rock')];
 const a={...p,seeds:[seed(1,'Nujabes',1),seed(2,'Radiohead',.4)]},b={...p,seeds:[seed(1,'Nujabes',.4),seed(2,'Radiohead',1)]};
 assert.equal(selectMoments(items,a,'all','all','for-you',now)[0].id,'event:1');assert.equal(selectMoments(items,b,'all','all','for-you',now)[0].id,'event:2');
 assert.equal(chooseNext(selectMoments(items,a,'all','all','for-you',now),[],{tags:[],reactions:[]})?.id,'event:1');assert.equal(chooseNext(selectMoments(items,b,'all','all','for-you',now),[],{tags:[],reactions:[]})?.id,'event:2');
 const inactive=selectMoments([items[0]],{...p,seeds:[seed(1,'Nujabes',0)]},'all','all','for-you',now)[0];assert.equal(inactive.discovery,'wildcard');assert.equal(inactive.matchLevel,'activity');
});
test('avoids hide the named act without treating shared genres as dislikes',()=>{
 const rows=selectMoments([gig(1,'Nujabes'),gig(2,'Other jazz artist')],{...p,seeds:[{...seed(1,'Nujabes',-1),taste:[{name:'jazz',weight:1}]}]},'all','all','for-you',now);
 assert.deepEqual(rows.map(r=>r.id),['event:2']);assert.equal(rows[0].discovery,'wildcard');
});
test('a weaker exact genre does not get a fixed tier above a favourite broad genre connection',()=>{
 const favourite={...seed(1,'Favourite jazz artist',1),taste:[{name:'nu jazz',weight:1}]},curious={...seed(2,'Curious metal act',.4),taste:[{name:'death metal',weight:1}]};
 const rows=selectMoments([gig(3,'Other jazz artist','jazz'),gig(4,'Other metal act','death metal')],{...p,seeds:[favourite,curious]},'all','all','for-you',now);
 assert.equal(rows[0].id,'event:3');
});
test('explicit strengths override old positive saves, and zero or negative identities never go to Qloo as positive signals',()=>{
 const items=[{...gig(1,'Nujabes'),catalogEntities:[{id:id(1),name:'Nujabes',type:'artist',input:'Nujabes',evidence:'performer' as const}]},{...gig(2,'Radiohead'),catalogEntities:[{id:id(2),name:'Radiohead',type:'artist',input:'Radiohead',evidence:'performer' as const}]}];
 const context={tags:[],reactions:[{id:'event:1',action:'save' as const},{id:'event:2',action:'more' as const}]};
 assert.deepEqual(positiveSignals(items,{...p,seeds:[seed(1,'Nujabes',.4),seed(2,'Radiohead',-1)]},context).map(s=>[s.name,s.weight]),[['Nujabes',.4]]);
 assert.deepEqual(positiveSignals(items,{...p,seeds:[seed(1,'Nujabes',0),seed(2,'Radiohead',-1)]},context),[]);
});
test('hydrating fresh and cached Qloo metadata retains the user strength',async()=>{
 const bundle=await build({stdin:{contents:"export {hydrateInterests} from './lib/profile-matching.ts';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});
 const {hydrateInterests}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
 const original=globalThis.fetch;globalThis.fetch=async()=>Response.json({results:[{entity_id:id(1),name:'Nujabes',types:['urn:entity:artist'],tags:[]}]});
 try{const fresh=await hydrateInterests([seed(1,'Nujabes',.65)],'fixture',async()=>null,async()=>{});assert.equal(fresh[0].weight,.65);
 const cached=await hydrateInterests([seed(1,'Nujabes',-1)],'fixture',async()=>({genreSchema:2,at:Date.now(),seed:{...seed(1,'Nujabes',1),taste:[]}}),async()=>{});assert.equal(cached[0].weight,-1);
 }finally{globalThis.fetch=original;}
});
test('reconfirming a name edits its strength rather than duplicating it',()=>{
 const rows=mergeLoreInterest([seed(1,'Nujabes',1)],seed(1,'Nujabes',.4));assert.equal(rows.length,1);assert.equal(rows[0].weight,.4);
});
test('Qloo contributor influence follows explicit strength without altering the provider affinity',()=>{
 const entity={entity_id:id(8),name:'Connected act',query:{affinity:.85,explainability:{'signal.interests.entities':[{entity_id:id(1),score:.7}]}}};
 const love=evidenceFromEntity(entity,'artist',[{id:id(1),name:'Nujabes',weight:1}])!,curious=evidenceFromEntity(entity,'artist',[{id:id(1),name:'Nujabes',weight:.4}])!;
 assert.equal(love.affinity,curious.affinity);assert.ok(graphStrength(love)>graphStrength(curious));assert.equal(curious.contributors[0].weight,.4);
 const unexplained={...entity,query:{affinity:.85}};
 assert.ok(graphStrength(evidenceFromEntity(unexplained,'artist',[{id:id(1),name:'Nujabes',weight:.4}])!)<graphStrength(evidenceFromEntity(unexplained,'artist',[{id:id(1),name:'Nujabes',weight:1}])!));
});
