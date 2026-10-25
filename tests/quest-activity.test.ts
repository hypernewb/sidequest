import test from 'node:test';
import assert from 'node:assert/strict';
import {leadFitsActivity,activityReason} from '../lib/quest-activity.ts';
import type {Opportunity} from '../lib/opportunities.ts';
const item=(title:string,kind='release',category=''):Opportunity=>({title,kind,category,description:''} as Opportunity);
test('retro game answers reject franchise plush and homeware but retain software releases',()=>{
 assert.equal(leadFitsActivity(item('Pokémon plush'),'games'),false);
 assert.equal(leadFitsActivity(item('Pokémon rug'),'games'),false);
 assert.equal(leadFitsActivity(item('Pokémon FireRed','release','retro game software'),'games'),true);
});
test('art and music answers select different kinds of seed-related leads',()=>{
 const art=item('Nujabes album artwork','exhibition'),gig=item('Nujabes tribute','gig');
 assert.equal(leadFitsActivity(art,'visual'),true);assert.equal(leadFitsActivity(gig,'visual'),false);
 assert.equal(leadFitsActivity(gig,'sound'),true);assert.equal(leadFitsActivity(art,'any'),true);
});
test('activity explanations retain the taste evidence and admit when it is missing',()=>{
 const o={...item('Record shop'),curation:{focusReason:'You asked for records.',matchedTags:['hiphop','jazz'],matchStrength:'anchor'}} as Opportunity;
 assert.match(activityReason(o)!,/records.*Qloo.*hiphop, jazz/);
 assert.match(activityReason({...o,curation:{...o.curation!,matchedTags:[]}})!,/no specific cultural connection/);
});
