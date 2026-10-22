import test from 'node:test';
import assert from 'node:assert/strict';
import {TOPICS,EMPTY_TASTE,tasteSchema,selectedTopics,qlooAnchors} from '../lib/taste.ts';
import {DROPS,dropState,filterDrops,dropMatch} from '../lib/drops.ts';
const now=new Date('2026-10-23T10:00:00+09:00');
const profile=tasteSchema.parse({version:1,answers:{digimon:'love',pokemon:'curious',tamagotchi:'pass',gundam:'unknown'},enjoyments:['watch']});
test('self-discovery keeps curiosity, dislike, unfamiliarity and enjoyment separate',()=>{
 assert.deepEqual(selectedTopics(profile).map(t=>t.id),['digimon','pokemon']);
 assert.deepEqual(profile.enjoyments,['watch']);
 assert.equal(tasteSchema.safeParse({...profile,answers:{invented:'love'}}).success,false);
 assert.equal(tasteSchema.safeParse({...profile,enjoyments:['buy everything']}).success,false);
});
test('Qloo anchors only use valid exact aliases and supported types, never a fuzzy franchise substitution',()=>{
 const item={entity_id:'9B33A620-68CA-49B3-BFCF-F09CCF8AD595',name:'Spirited Away',types:['urn:entity:movie']};
 assert.equal(qlooAnchors(TOPICS[7],{results:[item,{...item,name:'Spirited Away Piano Collection'},{...item,entity_id:'fake'},{...item,types:['urn:entity:place']}]}).length,1);
 assert.deepEqual(qlooAnchors(TOPICS[0],{results:[item]}),[]);
});
test('drops respect explicit follows, format, channel and weekend overlap',()=>{
 const opts={category:'all',channel:'all',period:'all',matched:true,profile,now};
 assert.deepEqual(filterDrops(DROPS,opts).map(d=>d.id),['digimon-beatbreak-color','pokemon-mega-deck']);
 assert.equal(dropMatch(DROPS.find(d=>d.id==='tama-neon-planets')!,profile).length,0);
 assert.ok(!filterDrops(DROPS,{...opts,matched:false}).some(d=>d.topics.includes('tamagotchi')));
 const weekend=filterDrops(DROPS,{...opts,matched:false,period:'weekend'});
 assert.ok(weekend.some(d=>d.id==='digimon-beatbreak-color'));
 assert.ok(weekend.some(d=>d.id==='aot-dj-shibuya'));
 assert.ok(!weekend.some(d=>d.id==='pokemon-mega-deck'));
 assert.ok(filterDrops(DROPS,{...opts,matched:false,channel:'tokyo'}).every(d=>d.category==='popup'));
 assert.equal(filterDrops(DROPS,{...opts,profile:EMPTY_TASTE}).length,0);
});
test('order deadlines never become release dates; ended and stale records leave discovery',()=>{
 const d=DROPS.find(d=>d.id==='digimon-beatbreak-color')!;
 assert.equal(d.releaseDate,undefined);assert.match(d.delivery!,/2027/);
 assert.equal(dropState(d,now),'scheduled');
 assert.equal(dropState(d,new Date('2026-10-25T23:00:01+09:00')),'ended');
 assert.equal(filterDrops(DROPS,{category:'all',channel:'all',period:'all',matched:false,profile,now:new Date('2026-11-10T00:00:00+09:00')}).length,0);
 assert.equal(dropState(DROPS.find(d=>d.id==='pokemon-mega-deck')!,new Date('2026-11-10T00:00:00+09:00')),'needs-review');
});
test('every curated record has an official source, clear date evidence and bounded price',()=>{
 const allowed=new Set(['p-bandai.jp','www.movic.jp','towershibuya.jp','www.yamada-denkiweb.com','toy.bandai.co.jp','www.pokemon-card.com','tamagotchi-official.com']);
 for(const d of DROPS){const u=new URL(d.sourceUrl);assert.equal(u.protocol,'https:');assert.ok(allowed.has(u.hostname));assert.ok(Number.isFinite(Date.parse(d.startsAt)));assert.ok(Number.isFinite(Date.parse(d.checkedAt)));assert.ok(d.restrictions.length>0);if(d.price!==null)assert.ok(d.price>=0&&Number.isFinite(d.price));if(d.evidence==='indexed')assert.ok(d.evidenceNote);}
});
