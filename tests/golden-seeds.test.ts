import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveQuestSeed, composeQuest} from '../lib/quests.ts';
import {planScout} from '../lib/scout.ts';
import {VENUES, venueById} from '../lib/curated-venues.ts';
import {culturalFit, tasteThreads} from '../lib/curated-taste.ts';
import type {Opportunity, Preferences} from '../lib/opportunities.ts';
import type {QuestSeed} from '../lib/quest-seeds.ts';

const now = new Date('2026-10-25T03:00:00Z');
const date = '2026-10-25';

function venueOpportunity(name: string, affinity = 0.8, strength: 'anchor' | 'adjacent' | 'stopover' = 'anchor'): Opportunity {
  const v = VENUES.find(item => item.name === name);
  if (!v) throw Error('Venue not found: ' + name);
  const coords: Record<string, {lat: number; lon: number}> = {
    'Kanda Brazil': {lat: 35.6961, lon: 139.7578},
    "Bohemian's Guild": {lat: 35.6960, lon: 139.7590},
    'Komiyama Tokyo': {lat: 35.6955, lon: 139.7585},
    'Bear Pond Espresso': {lat: 35.6635, lon: 139.6675},
    'Reload': {lat: 35.6645, lon: 139.6690},
    'Pianola Records': {lat: 35.6610, lon: 139.6670},
    'GALLERY CONCEAL SHIBUYA': {lat: 35.6568, lon: 139.6997},
    'SHIBUYA PUBLISHING & BOOKSELLERS': {lat: 35.6631, lon: 139.6924},
    'Bar Music': {lat: 35.6580, lon: 139.6990},
    'KOFFEE MAMEYA': {lat: 35.6685, lon: 139.7100},
    'UTRECHT': {lat: 35.6660, lon: 139.7070},
    'WATARI-UM': {lat: 35.6710, lon: 139.7118}
  };
  const hoursMap: Record<string, Opportunity['hours']> = {
    'Kanda Brazil': {sunday: [{opens: '11:00', closes: '19:00'}]},
    "Bohemian's Guild": {sunday: [{opens: '12:00', closes: '18:00'}]},
    'Komiyama Tokyo': {sunday: [{opens: '12:00', closes: '17:30'}]},
    'Bear Pond Espresso': {sunday: [{opens: '11:00', closes: '17:30'}]},
    'Reload': {sunday: [{opens: '11:00', closes: '20:00'}]},
    'Pianola Records': {sunday: [{opens: '14:00', closes: '21:00'}]},
    'GALLERY CONCEAL SHIBUYA': {sunday: [{opens: '11:00', closes: '20:00'}]},
    'SHIBUYA PUBLISHING & BOOKSELLERS': {sunday: [{opens: '11:00', closes: '21:00'}]},
    'Bar Music': {sunday: [{opens: '18:00', closes: '24:00'}]},
    'KOFFEE MAMEYA': {sunday: [{opens: '10:00', closes: '18:00'}]},
    'UTRECHT': {sunday: [{opens: '12:00', closes: '19:00'}]},
    'WATARI-UM': {sunday: [{opens: '11:00', closes: '19:00'}]}
  };
  const c = coords[name] || {lat: 35.67, lon: 139.70};
  return {
    id: v.qlooId || name,
    title: v.name,
    kind: 'place',
    source: 'Qloo',
    url: v.source.replace(/^http:/, 'https:'),
    description: v.tags.join(', '),
    location: v.area + ', Tokyo',
    checkedAt: now.toISOString(),
    price: null,
    priceLabel: 'Not published',
    availability: '',
    category: v.role,
    affinity,
    signals: [],
    lat: c.lat,
    lon: c.lon,
    hours: hoursMap[name] || {sunday: [{opens: '11:00', closes: '20:00'}]},
    curation: {
      role: v.role,
      area: v.area,
      mission: v.mission,
      tags: v.tags,
      doorNotes: v.doorNotes,
      source: v.source,
      reviewedAt: v.reviewedAt,
      matchBasis: 'entity',
      matchStrength: strength,
      tasteScore: strength === 'anchor' ? 80 : 5
    }
  };
}

test('golden seeds resolve correctly without ambiguity', () => {
  const murakamiCandidates = [
    {id: '99EE4D7C-2722-4903-86A5-1CB829A8D1EC', name: 'Haruki Murakami', type: 'artist'}
  ];
  const murakami = resolveQuestSeed('Haruki Murakami', murakamiCandidates);
  assert.equal(murakami?.id, '99EE4D7C-2722-4903-86A5-1CB829A8D1EC');

  const ymoCandidates = [
    {id: 'CED00034-CCA1-4640-B526-933D816CE6FB', name: 'Yellow Magic Orchestra', type: 'artist'},
    {id: '9F052358-FC43-4C7F-825E-316FB405414D', name: 'Yellow Magic Orchestra', type: 'album'}
  ];
  const ymo = resolveQuestSeed('Yellow Magic Orchestra', ymoCandidates);
  assert.equal(ymo?.id, 'CED00034-CCA1-4640-B526-933D816CE6FB');
  assert.equal(ymo?.type, 'artist');

  const wkwCandidates = [
    {id: '4C49C6C1-6669-46F6-B102-6D58B41F794F', name: 'Wong Kar-Wai', type: 'artist'}
  ];
  const wkw = resolveQuestSeed('Wong Kar-wai', wkwCandidates);
  assert.equal(wkw?.id, '4C49C6C1-6669-46F6-B102-6D58B41F794F');

  const noguchiCandidates = [
    {id: '29461F65-0F16-4883-9C79-FA1AF9B5875C', name: 'Noguchi Museum', type: 'brand'}
  ];
  const noguchi = resolveQuestSeed('Isamu Noguchi', noguchiCandidates);
  assert.equal(noguchi?.id, '29461F65-0F16-4883-9C79-FA1AF9B5875C');
  assert.equal(noguchi?.name, 'Isamu Noguchi');
});

test('four golden seeds produce distinct three-stop walking circuits without venue overlap', () => {
  const p: Preferences = {
    intent: 'mix',
    direction: 'any',
    format: 'places',
    date,
    days: 1,
    budget: 'any',
    unknownPrice: true,
    seeds: [],
    exclude: []
  };

  // Murakami: Jimbocho
  const murakamiVenues = [
    venueOpportunity('Kanda Brazil', 0.8, 'anchor'),
    venueOpportunity("Bohemian's Guild", 0.85, 'anchor'),
    venueOpportunity('Komiyama Tokyo', 0.8, 'anchor')
  ];
  const murakamiPlan = planScout(murakamiVenues, p, now, false);
  assert.equal(murakamiPlan.stops.length, 3);
  assert.deepEqual(murakamiPlan.stops.map(s => s.item.title), ['Kanda Brazil', "Bohemian's Guild", 'Komiyama Tokyo']);
  assert.ok(murakamiPlan.stops.every(s => s.item.curation?.doorNotes.length! > 0));

  // Yellow Magic Orchestra: Shimokitazawa
  const ymoVenues = [
    venueOpportunity('Bear Pond Espresso', 0.6, 'stopover'),
    venueOpportunity('Reload', 0.85, 'anchor'),
    venueOpportunity('Pianola Records', 0.9, 'anchor')
  ];
  const ymoPlan = planScout(ymoVenues, p, now, false);
  assert.equal(ymoPlan.stops.length, 3);
  assert.deepEqual(ymoPlan.stops.map(s => s.item.title), ['Bear Pond Espresso', 'Reload', 'Pianola Records']);
  assert.ok(ymoPlan.stops.every(s => s.item.curation?.doorNotes.length! > 0));

  // Wong Kar-wai: Shibuya
  const wkwVenues = [
    venueOpportunity('GALLERY CONCEAL SHIBUYA', 0.85, 'anchor'),
    venueOpportunity('SHIBUYA PUBLISHING & BOOKSELLERS', 0.8, 'anchor'),
    venueOpportunity('Bar Music', 0.9, 'anchor')
  ];
  const wkwPlan = planScout(wkwVenues, p, now, false);
  assert.equal(wkwPlan.stops.length, 3);
  assert.deepEqual(wkwPlan.stops.map(s => s.item.title), ['GALLERY CONCEAL SHIBUYA', 'SHIBUYA PUBLISHING & BOOKSELLERS', 'Bar Music']);
  assert.ok(wkwPlan.stops.every(s => s.item.curation?.doorNotes.length! > 0));

  // Isamu Noguchi: Harajuku / Aoyama
  const noguchiVenues = [
    venueOpportunity('KOFFEE MAMEYA', 0.8, 'anchor'),
    venueOpportunity('UTRECHT', 0.85, 'anchor'),
    venueOpportunity('WATARI-UM', 0.9, 'anchor')
  ];
  const noguchiPlan = planScout(noguchiVenues, p, now, false);
  assert.equal(noguchiPlan.stops.length, 3);
  assert.deepEqual(
    noguchiPlan.stops.map(s => s.item.title).sort(),
    ['KOFFEE MAMEYA', 'UTRECHT', 'WATARI-UM'].sort()
  );
  assert.ok(noguchiPlan.stops.every(s => s.item.curation?.doorNotes.length! > 0));

  // Verify total set of venues has zero overlap across all 4 seeds
  const allStops = [
    ...murakamiPlan.stops.map(s => s.item.title),
    ...ymoPlan.stops.map(s => s.item.title),
    ...wkwPlan.stops.map(s => s.item.title),
    ...noguchiPlan.stops.map(s => s.item.title)
  ];
  assert.equal(allStops.length, 12);
  assert.equal(new Set(allStops).size, 12);
});

test('golden seed door notes comply with unslop rules without em dashes', () => {
  const targetVenues = [
    'Kanda Brazil', "Bohemian's Guild", 'Komiyama Tokyo',
    'Bear Pond Espresso', 'Reload', 'Pianola Records',
    'GALLERY CONCEAL SHIBUYA', 'SHIBUYA PUBLISHING & BOOKSELLERS', 'Bar Music',
    'KOFFEE MAMEYA', 'UTRECHT', 'WATARI-UM'
  ];
  for (const name of targetVenues) {
    const v = VENUES.find(item => item.name === name);
    assert.ok(v, 'Venue exists: ' + name);
    assert.ok(v!.doorNotes.length > 0, 'Door notes present: ' + name);
    for (const note of v!.doorNotes) {
      assert.ok(!/[—–]/.test(note), 'No em dashes in door note: ' + note);
      assert.ok(!note.includes(': '), 'No colon mid-sentence connectors in door note: ' + note);
    }
  }
});
