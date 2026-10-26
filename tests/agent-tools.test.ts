import test from 'node:test';
import assert from 'node:assert/strict';
import {
 AGENT_TOOL_DEFINITIONS,
 AGENT_TOOLS,
 toolResolveEntity,
 toolExpandTasteGraph,
 toolScheduleVerify,
 toolSpatialCluster,
 toolSynthesizeQuest
} from '../lib/agent-tools.ts';

test('agent tool definitions provide explicit schemas for hackathon evaluation', () => {
 const keys = ['tool_resolve_entity', 'tool_expand_taste_graph', 'tool_schedule_verify', 'tool_spatial_cluster', 'tool_synthesize_quest'] as const;
 for (const key of keys) {
  const tool = AGENT_TOOL_DEFINITIONS[key];
  assert.ok(tool, 'Tool ' + key + ' must exist');
  assert.equal(tool.name, key);
  assert.ok(tool.description.length > 20);
  assert.equal(tool.parameters.type, 'object');
  assert.ok(Array.isArray(tool.parameters.required));
  assert.ok(Object.keys(tool.parameters.properties).length > 0);
 }
 assert.equal(AGENT_TOOLS.length, 5);
});

test('toolResolveEntity resolves exact seeds and presents disambiguation', async t => {
 t.mock.method(globalThis, 'fetch', async (input: string | URL) => {
  const u = new URL(String(input));
  if (u.pathname === '/search') {
   return Response.json({
    results: [
     { entity_id: 'E11125AF-936B-4935-B607-F2DA2E6A6B92', name: 'Nujabes', types: ['urn:entity:artist'], properties: { description: 'Japanese producer' } },
     { entity_id: '9B33A620-68CA-49B3-BFCF-F09CCF8AD595', name: 'Nujabes Tribute', types: ['urn:entity:artist'], properties: { description: 'Tribute band' } }
    ]
   });
  }
  return Response.json({ results: [] });
 });

 const resolved = await toolResolveEntity({ query: 'Nujabes', apiKey: 'fixture' });
 assert.ok(resolved.seed);
 assert.equal(resolved.seed.name, 'Nujabes');
 assert.equal(resolved.choices.length, 0);

 const ambiguous = await toolResolveEntity({ query: 'Nujab', apiKey: 'fixture' });
 assert.equal(ambiguous.seed, null);
 assert.equal(ambiguous.choices.length, 2);
 assert.equal(ambiguous.choices[0].name, 'Nujabes');
 assert.equal(ambiguous.message, 'Which one did you mean?');
});

test('toolSynthesizeQuest creates a complete quest with timetable and door notes', async () => {
 const dummyPlan = {
  date: '2026-10-25',
  checkedAt: new Date().toISOString(),
  tokyoNow: '14:00 JST',
  stops: [{
   arrival: '14:00',
   departure: '14:45',
   hours: '12:00-20:00',
   travelMinutes: 0,
   distanceMetres: 0,
   reason: 'Cultural anchor',
   item: {
    id: 'test-stop-1',
    title: 'Test Venue',
    kind: 'place' as const,
    source: 'Qloo',
    url: 'https://example.com/venue',
    description: 'Jazz kissaten',
    location: 'Shimokitazawa, Tokyo',
    checkedAt: new Date().toISOString(),
    price: null,
    priceLabel: 'Not published',
    availability: '',
    category: 'cafe',
    curation: {
     role: 'listen' as const,
     area: 'Shimokitazawa',
     mission: 'Listen to one full record sleeve.',
     tags: ['jazz', 'vinyl'],
     doorNotes: ['Opens at noon.'],
     source: 'https://example.com',
     reviewedAt: new Date().toISOString(),
     matchBasis: 'entity' as const,
     hoursBasis: 'Official weekly hours'
    }
   }
  }],
  brief: 'One stop quest in Shimokitazawa.',
  map: 'https://www.google.com/maps',
  examined: 1,
  eligible: 1,
  notes: []
 };

 const seed = { id: 'seed-1', name: 'Nujabes', type: 'artist' };
 const { quest, leads } = await toolSynthesizeQuest({
  plan: dummyPlan,
  seed,
  records: []
 });

 assert.ok(quest);
 assert.equal(quest.stops.length, 1);
 assert.equal(quest.stops[0].mission, 'Listen to one full record sleeve.');
 assert.equal(quest.seed.name, 'Nujabes');
 assert.ok(Array.isArray(leads));
});
