import {applyFocus,QUEST_FOCUS,type QuestFocus} from './quest-focus.ts';
import {withProgrammes,eventLeads,eventFit,type EventLead} from './quest-event-matching.ts';
import {reportRun,type RunHooks,type RunEvent,type RunStage,type Association} from './quest-run.ts';
import {questSeed,type QuestSeed} from './quest-seeds.ts';
import {datedVenueHours} from './venue-programmes.ts';
import {tasteThreads,culturalFit} from './curated-taste.ts';
import {qloo} from './qloo.ts';
import {VENUES,venueById,type Curation} from './curated-venues.ts';
import type {Opportunity,Preferences} from './opportunities.ts';
import {planScout,prepareScout,openingWindows,type ScoutPlan,type RouteChange} from './scout.ts';
import {plainText} from './announcements.ts';
import {composeQuest,resolveQuestSeed,questChoices,type Quest} from './quests.ts';
import {programmeFor} from './quest-programmes.ts';

// Official weekly hours explicitly checked by the curator. Unknown admission stays unknown.
const daily=(opens:string,closes:string)=>Object.fromEntries(['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(d=>[d,[{opens,closes}]]));
export const verifiedHours:Record<string,Opportunity['hours']>={'Little Soul Cafe':daily('19:00','02:00'),'Bar Music':daily('18:00','24:00'),'NAT RECORDS':daily('11:00','20:00'),'Reload':daily('11:00','20:00'),'Pianola Records':{...daily('14:00','21:00'),thursday:[{closed:true}]}};

export function curatedOpportunity(e:Record<string,any>,seed:QuestSeed,at:string):Opportunity|null{
 const v=venueById.get(String(e.entity_id).toUpperCase()),p=e.properties||{},l=e.location||{},a=Number.isFinite(e.query?.affinity)?e.query.affinity:0;
 if(!v||v.eventOnly||p.is_closed||p.geocode?.country_code!=='JP'||p.geocode?.admin1_region!=='Tokyo'||!Number.isFinite(l.lat)||!Number.isFinite(l.lon))return null;
 const contributors=e.query?.explainability?.['signal.interests.entities']||[];
 const explained=seed.type==='album'?Array.isArray(e.query?.explainability?.['signal.interests.tags'])&&e.query.explainability['signal.interests.tags'].some((s:any)=>s.score>0):contributors.some((s:any)=>String(s.entity_id).toUpperCase()===seed.id.toUpperCase()&&s.score>0);
 const curation:Curation={role:v.role,area:v.area,mission:v.mission,tags:v.tags,doorNotes:v.doorNotes,source:v.source,reviewedAt:v.reviewedAt,matchBasis:seed.type==='album'?'album_tags':'entity',hoursBasis:verifiedHours[v.name]?'Official weekly hours':'Qloo weekly hours'};
 return {id:v.qlooId!,title:v.name,kind:'place',source:'Qloo',url:v.source.replace(/^http:/,'https:'),description:v.tags.join(', '),location:String(p.address||v.area),checkedAt:at,price:null,priceLabel:'Not published',availability:'',category:v.role,affinity:Number.isFinite(e.query?.affinity)?e.query.affinity:undefined,signals:explained?[seed.name]:[],lat:l.lat,lon:l.lon,hours:verifiedHours[v.name]||p.hours||{},curation};
}

export async function checkVenuePage(item:Opportunity,fetcher:typeof fetch=fetch,now=new Date(),date=now.toLocaleDateString('en-CA',{timeZone:'Asia/Tokyo'}),signal?:AbortSignal){
 const v=venueById.get(item.id);if(!v)throw Error('Outside the curated pool');
 const r=await fetcher(v.source,{redirect:'manual',headers:{Accept:'text/html','User-Agent':'SideQuest venue checker'},signal:signal?AbortSignal.any([signal,AbortSignal.timeout(7000)]):AbortSignal.timeout(7000)});
 if(!r.ok||!/text\/html/.test(r.headers.get('content-type')||''))throw Error('Venue page unavailable');
 const reader=r.body?.getReader();if(!reader)throw Error('Empty venue page');let size=0;const chunks:Uint8Array[]=[];try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2500000)throw Error('Page too large');chunks.push(value);}}finally{await reader.cancel();}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}const head=new TextDecoder('latin1').decode(bytes.slice(0,5000)),charset=head.match(/charset=["']?([a-zA-Z0-9_-]+)/i)?.[1]||'utf-8';let html;try{html=new TextDecoder(charset).decode(bytes);}catch{html=new TextDecoder().decode(bytes);}
 const text=plainText(html);if(text.length<80||/^(?:.*\n)?(?:Checking your browser|メンテナンス中)/i.test(text.slice(0,200)))throw Error('No usable venue information');
 return datedVenueHours({...item,curation:{...item.curation!,sourceReadAt:now.toISOString()}},html,date);
}

// ---------------------------------------------------------------------------
// Agent Tool Schemas (Formalized for Qloo Agentic Hackathon evaluation)
// ---------------------------------------------------------------------------

export interface AgentToolSchema {
 name: string;
 stage: RunStage;
 description: string;
 parameters: {
  type: 'object';
  properties: Record<string, {
   type: string;
   description: string;
   enum?: readonly string[];
   items?: Record<string, any>;
  }>;
  required: string[];
 };
}

export const AGENT_TOOL_DEFINITIONS = {
 tool_resolve_entity: {
  name: 'tool_resolve_entity',
  stage: 'resolve' as const,
  description: 'Resolve a visitor cultural seed (artist, album, or place) to a verified Qloo entity with disambiguation.',
  parameters: {
   type: 'object',
   properties: {
    query: {
     type: 'string',
     description: 'The search query or entity name provided by the user.'
    },
    choice: {
     type: 'string',
     description: 'Optional selected entity UUID if disambiguating among multiple candidates.'
    }
   },
   required: ['query']
  }
 },
 tool_expand_taste_graph: {
  name: 'tool_expand_taste_graph',
  stage: 'taste' as const,
  description: 'Expand cross-domain taste affinities via Qloo /v2/insights and rank candidate Tokyo venues against curated tags.',
  parameters: {
   type: 'object',
   properties: {
    seedId: {
     type: 'string',
     description: 'The Qloo entity UUID of the resolved seed.'
    },
    seedType: {
     type: 'string',
     description: 'The cultural domain type of the seed (artist, album, place, brand, movie, tv_show).'
    },
    focus: {
     type: 'string',
     description: 'Optional activity focus to filter ranked venues.',
     enum: QUEST_FOCUS
    }
   },
   required: ['seedId', 'seedType']
  }
 },
 tool_schedule_verify: {
  name: 'tool_schedule_verify',
  stage: 'operations' as const,
  description: 'Verify Asia/Tokyo timetable feasibility, published weekly opening windows, and check official venue pages for dated exceptions.',
  parameters: {
   type: 'object',
   properties: {
    date: {
     type: 'string',
     description: 'Target visit date in YYYY-MM-DD format within Asia/Tokyo timezone.'
    },
    venueIds: {
     type: 'array',
     description: 'Venue IDs to verify opening hours and schedule eligibility.',
     items: {type: 'string'}
    },
    verifyVenuePages: {
     type: 'boolean',
     description: 'Whether to fetch and parse official venue pages for dated hours overrides.'
    }
   },
   required: ['date']
  }
 },
 tool_spatial_cluster: {
  name: 'tool_spatial_cluster',
  stage: 'cluster' as const,
  description: 'Cluster candidate venues into walking loops (legs under 1.5km, loop under 4km) with rail corridor fallback.',
  parameters: {
   type: 'object',
   properties: {
    date: {
     type: 'string',
     description: 'Target visit date in YYYY-MM-DD format.'
    },
    maxLegMetres: {
     type: 'number',
     description: 'Maximum walking distance between adjacent stops in metres (1500m limit).'
    },
    allowRail: {
     type: 'boolean',
     description: 'Whether to allow rail corridor widening along direct transit links.'
    }
   },
   required: ['date']
  }
 },
 tool_synthesize_quest: {
  name: 'tool_synthesize_quest',
  stage: 'synthesis' as const,
  description: 'Synthesize a 3-stop quest with authored visitor missions, Asia/Tokyo timetable, matched official programmes, and route dossier.',
  parameters: {
   type: 'object',
   properties: {
    seedName: {
     type: 'string',
     description: 'Name of the resolved cultural seed.'
    },
    stopIds: {
     type: 'array',
     description: 'Ordered venue IDs forming the quest route.',
     items: {type: 'string'}
    },
    date: {
     type: 'string',
     description: 'Target visit date in YYYY-MM-DD format.'
    }
   },
   required: ['seedName', 'stopIds', 'date']
  }
 }
} as const;

export const AGENT_TOOLS = Object.values(AGENT_TOOL_DEFINITIONS);

// ---------------------------------------------------------------------------
// Tool 1: toolResolveEntity
// Qloo entity search & disambiguation (seed -> Qloo UUID).
// ---------------------------------------------------------------------------

export interface ToolResolveEntityInput {
 query: string;
 choice?: string;
 apiKey: string;
 signal?: AbortSignal;
 hooks?: RunHooks;
}

export interface ToolResolveEntityOutput {
 seed: QuestSeed | null;
 candidates: QuestSeed[];
 choices: {id: string; name: string; type: string; description: string}[];
 message?: string;
}

export async function toolResolveEntity(input: ToolResolveEntityInput): Promise<ToolResolveEntityOutput> {
 const {query, choice, apiKey, signal, hooks} = input;
 reportRun(hooks, 'resolve', 'running', 'Qloo /search · resolving "' + query + '" to one cultural entity.');
 const b = await qloo('/search', {query, take: '8'}, apiKey, signal);
 const candidates = (Array.isArray(b.results) ? b.results : []).map(questSeed).filter((c): c is QuestSeed => !!c);
 const seed = resolveQuestSeed(query, candidates, choice);
 if (!seed) {
  const message = candidates.length
   ? 'Which one did you mean?'
   : 'I could not find that name. Try the full artist, album or place name.';
  reportRun(hooks, 'resolve', 'blocked', message);
  return {
   seed: null,
   candidates,
   choices: questChoices(query, candidates).map(({id, name, type, description}) => ({
    id,
    name,
    type,
    description: description.slice(0, 110)
   })),
   message
  };
 }
 reportRun(hooks, 'resolve', 'complete', 'Resolved "' + query + '" → ' + seed.name + ' · Qloo ' + seed.type.replaceAll('_', ' ') + ' ' + seed.id.slice(0, 8) + '.');
 return {seed, candidates, choices: []};
}

// ---------------------------------------------------------------------------
// Tool 2: toolExpandTasteGraph
// Cross-domain taste expansion via Qloo (/v2/insights).
// ---------------------------------------------------------------------------

export interface ToolExpandTasteGraphInput {
 seed: QuestSeed;
 preferences: Preferences;
 apiKey: string;
 now?: Date;
 hooks?: RunHooks;
 focus?: QuestFocus;
 signal?: AbortSignal;
}

export interface ToolExpandTasteGraphOutput {
 candidates: Opportunity[];
 associations: Association[];
}

export async function toolExpandTasteGraph(input: ToolExpandTasteGraphInput): Promise<ToolExpandTasteGraphOutput> {
 const {seed, preferences: p, apiKey: key, now = new Date(), hooks, focus = 'any', signal} = input;
 const ids = VENUES.filter(v => v.qlooId && !v.eventOnly && !p.exclude.includes(v.qlooId)).map(v => v.qlooId!);
 const items: Opportunity[] = [];
 const associations: Association[] = [];
 let taste = seed.taste || [];
 const runSignal = signal || hooks?.signal;

 if (seed.type !== 'album') {
  try {
   reportRun(hooks, 'taste', 'running', 'Qloo /entities · reading the seed\'s cultural metadata.');
   const b = await qloo('/entities', {entity_ids: seed.id}, key, runSignal);
   const e = (Array.isArray(b.results) ? b.results : [])[0] as Record<string, any>;
   taste = [
    ...taste,
    ...(e?.tags || [])
     .filter((t: any) => /^urn:tag:(genre|music|style|art_style|keyword|theme|design|gameplay)/.test(t.type || t.id || ''))
     .map((t: any) => ({name: t.name, weight: 1}))
   ];
  } catch {
   runSignal?.throwIfAborted();
  }
 }

 associations.push(...taste.slice(0, 3).map(t => ({name: t.name, type: 'tag', relation: 'seed_tag' as const, via: seed.name})));

 if (seed.type === 'artist') {
  try {
   reportRun(hooks, 'taste', 'running', 'Qloo /v2/insights · expanding related music genres.', associations);
   const b = await qloo('/v2/insights', {
    'filter.type': 'urn:tag',
    'filter.tag.types': 'urn:tag:genre:music',
    'signal.interests.entities': seed.id,
    take: '12'
   }, key, runSignal);
   const tags = ((b.results as {tags?: any[]})?.tags || []).filter(t => typeof t.name === 'string' && Number.isFinite(t.query?.affinity));
   taste = [...taste, ...tags.map(t => ({name: t.name, weight: .35}))];
   associations.push(...tags.slice(0, 2).map(t => ({name: t.name, type: 'genre', relation: 'related_tag' as const, via: seed.name})));
  } catch {
   runSignal?.throwIfAborted();
  }
 }

 try {
  const type = seed.type === 'artist' ? 'tv_show' : seed.type === 'movie' || seed.type === 'tv_show' ? 'artist' : seed.type === 'brand' ? 'book' : 'movie';
  reportRun(hooks, 'taste', 'running', 'Qloo /v2/insights · following links into ' + type.replaceAll('_', ' ') + '.', associations);
  const b = await qloo('/v2/insights', {
   'filter.type': 'urn:entity:' + type,
   ...(seed.type === 'album' ? {'signal.interests.tags': seed.tags.join(',')} : {'signal.interests.entities': seed.id}),
   'filter.exclude.entities': seed.id,
   take: '3',
   'feature.explainability': 'true'
  }, key, runSignal);
  for (const e of (b.results as {entities?: Record<string, any>[]})?.entities || []) {
   const related = questSeed(e);
   if (!related || related.type !== type || related.id === seed.id || !Number.isFinite(e.query?.affinity)) continue;
   associations.push({name: related.name, type: related.type, relation: 'related_entity', via: seed.name});
   taste.push(...(related.taste || []).map(t => ({...t, weight: .25})));
  }
 } catch {
  runSignal?.throwIfAborted();
  reportRun(hooks, 'taste', 'running', 'The related-world lookup was unavailable. Keeping the seed evidence and continuing.', associations);
 }

 if (seed.type === 'album' && !taste.length) taste = seed.tags.map(name => ({name, weight: 1}));

 const threads = tasteThreads(taste);
 if (['movie', 'tv_show'].includes(seed.type)) threads.set('film', 1);
 if (['videogame', 'video_game'].includes(seed.type)) threads.set('games', 1);
 const musicSeed = ['artist', 'album'].includes(seed.type) || focus === 'sound';
 const direct = new Map<string, Record<string, any>>();

 for (let i = 0; i < ids.length; i += 20) {
  reportRun(hooks, 'taste', 'running', 'Qloo /v2/insights · ranking curated venues ' + (i + 1) + '–' + Math.min(i + 20, ids.length) + ' of ' + ids.length + '.', associations);
  const b = await qloo('/v2/insights', {
   'filter.type': 'urn:entity:place',
   'filter.results.entities': ids.slice(i, i + 20).join(','),
   ...(seed.type === 'album' ? {'signal.interests.tags': seed.tags.join(',')} : {'signal.interests.entities': seed.id}),
   take: '50',
   'feature.explainability': 'true'
  }, key, runSignal);
  for (const e of (b.results as {entities?: Record<string, any>[]})?.entities || []) direct.set(String(e.entity_id).toUpperCase(), e);
 }

 for (let i = 0; i < ids.length; i += 40) {
  reportRun(hooks, 'taste', 'running', 'Qloo /entities · loading venue coordinates and published schedules.', associations);
  const b = await qloo('/entities', {entity_ids: ids.slice(i, i + 40).join(',')}, key, runSignal);
  for (const raw of Array.isArray(b.results) ? b.results : []) {
   const e = raw as Record<string, any>, id = String(e.entity_id).toUpperCase(), v = venueById.get(id);
   if (!v) continue;
   const ranked = direct.get(id), fit = culturalFit(v.tags, threads, ranked?.query?.affinity || 0), overlap = fit.overlap;
   if (['dig', 'listen'].includes(v.role) && (!musicSeed || !overlap.some(t => t.weight >= (['artist', 'album'].includes(seed.type) ? .75 : .25)))) continue;
   const o = curatedOpportunity({...e, query: ranked?.query || {affinity: 0}}, seed, now.toISOString());
   if (!o) continue;
   o.curation!.matchedTags = overlap.map(t => t.name);
   o.curation!.matchStrength = fit.strength;
   o.curation!.tasteScore = fit.score;
   if (!ranked || !Number.isFinite(ranked?.query?.affinity)) {
    o.affinity = undefined;
    o.curation!.matchBasis = 'genre_bridge';
   }
   items.push(o);
  }
 }

 const unique = [...new Map(items.map(o => [o.id, o])).values()];
 const links = [...new Map(associations.map(a => [a.relation + ':' + a.name, a])).values()];
 reportRun(hooks, 'taste', 'complete', 'Found ' + unique.length + ' candidates in the curated catalog. ' + links.filter(a => a.relation === 'related_entity').length + ' lateral cultural links returned by Qloo.', links);

 return {candidates: applyFocus(unique, focus), associations: links};
}

// ---------------------------------------------------------------------------
// Tool 3: toolScheduleVerify
// Asia/Tokyo timetable verification, open hours, and venue page checks.
// ---------------------------------------------------------------------------

export interface ToolScheduleVerifyInput {
 items: Opportunity[];
 preferences: Preferences;
 seed: QuestSeed;
 records?: Opportunity[];
 focus?: QuestFocus;
 now?: Date;
 hooks?: RunHooks;
}

export interface ToolScheduleVerifyOutput {
 preferences: Preferences;
 pool: Opportunity[];
 tokyoNow: string;
 date: string;
}

export async function toolScheduleVerify(input: ToolScheduleVerifyInput): Promise<ToolScheduleVerifyOutput> {
 const {items, preferences: p, seed, records = [], focus = 'any', now = new Date(), hooks} = input;
 reportRun(hooks, 'operations', 'running', 'Checking Tokyo time and the published opening windows.');
 const candidates = (prefs: Preferences) => withProgrammes(items, records, seed, prefs, now, focus);
 const initialPrefs = {...p, date: prepareScout(items, p, now).date};
 const initial = prepareScout(candidates(initialPrefs), initialPrefs, now);
 reportRun(hooks, 'operations', 'complete', initial.tokyoNow + ' JST · ' + initial.pool.length + ' of ' + items.length + ' candidates pass hours, location and price checks for ' + initial.date + '.');
 return {preferences: initialPrefs, pool: initial.pool, tokyoNow: initial.tokyoNow, date: initialPrefs.date};
}

// ---------------------------------------------------------------------------
// Tool 4: toolSpatialCluster
// Spatial clustering for walking loops (<= 1.5km legs, loop limit) and rail corridor fallback.
// ---------------------------------------------------------------------------

export interface ToolSpatialClusterInput {
 items: Opportunity[];
 preferences: Preferences;
 seed: QuestSeed;
 records?: Opportunity[];
 focus?: QuestFocus;
 now?: Date;
 flexibleDate?: boolean;
 reportedClosed?: string[];
 hooks?: RunHooks;
 signal?: AbortSignal;
}

export interface ToolSpatialClusterOutput {
 plan: ScoutPlan;
 railUsed: boolean;
 checkedCount: number;
 failedCount: number;
}

export async function toolSpatialCluster(input: ToolSpatialClusterInput): Promise<ToolSpatialClusterOutput> {
 const {items, preferences: p, seed, records = [], focus = 'any', now = new Date(), flexibleDate = false, reportedClosed = [], hooks, signal} = input;
 const runSignal = signal || hooks?.signal;
 const checked = new Set<string>();
 const failed = new Set<string>();
 const changes:RouteChange[]=[];
 const candidates = (prefs: Preferences) => withProgrammes(items.filter(o=>!reportedClosed.includes(o.id)), records, seed, prefs, now, focus);
 const initialPrefs = {...p, date: p.date || prepareScout(items, p, now).date};

 reportRun(hooks, 'cluster', 'running', 'Comparing neighborhood pools, including Shimokitazawa, Shibuya / Daikanyama, Shinjuku / Hatagaya and Yanaka / Ueno. Every estimated walking leg must fit within 1.5 km.');
 for(const id of reportedClosed){const v=venueById.get(id);if(v){changes.push({venue:v.name,basis:'visitor_report',reason:'You reported this stop closed. Excluded from this plan; not an official closure notice.',before:[],after:[]});reportRun(hooks,'cluster','running','You reported '+v.name+' closed. Planning without it, keeping your taste, date and price choices.');}}
 let rail = false;
 const widen = (walk: ScoutPlan, rows: Opportunity[], prefs: Preferences) => {
  if (rail || walk.stops.length >= 3) return walk;
  reportRun(hooks, 'cluster', 'running', (walk.stops.length ? 'Only ' + walk.stops.length + ' stop' + (walk.stops.length === 1 ? '' : 's') : 'No stops') + ' fit a walking loop. Expanding the radius along direct train lines: Inokashira, Odakyu, Yamanote, Chuo-Sobu and Keio New Line.');
  const wider = planScout(rows, prefs, now, true);
  const lines = [...new Set([...wider.stops.flatMap(s => s.transit ? [s.transit] : []), ...(wider.returnTransit ? [wider.returnTransit] : [])])];
  if (wider.stops.length <= walk.stops.length) {
   reportRun(hooks, 'cluster', 'running', 'No direct train corridor added a stop. Keeping the walking result.');
   return walk;
  }
  rail = true;
  reportRun(hooks, 'cluster', 'running', 'Train corridor found. ' + wider.stops.length + ' stops linked by ' + lines.join('; ') + '.');
  return wider;
 };

 let plan = widen(planScout(candidates(initialPrefs), initialPrefs, now), candidates(initialPrefs), initialPrefs);

 if (flexibleDate && !plan.stops.length) {
  for (let i = 1; i <= 6 && !plan.stops.length; i++) {
   const date = new Date(Date.parse(initialPrefs.date + 'T12:00:00+09:00') + i * 86400000).toLocaleDateString('en-CA', {timeZone: 'Asia/Tokyo'});
   reportRun(hooks, 'cluster', 'running', 'No complete loop yet. Trying ' + date + ' against the published schedules.');
   plan = planScout(candidates({...p, date}), {...p, date}, now, rail);
  }
  if (plan.stops.length) plan.notes.push('No complete loop fit the first day. This is the next day with a route.');
 }

 const active = {...p, date: plan.date};
 for (let attempt = 0; attempt < 9 && checked.size + failed.size < 12 && plan.stops.length; attempt++) {
  const pending = plan.stops.filter(s => !checked.has(s.item.id)).slice(0, 12 - checked.size - failed.size);
  if (!pending.length) break;
  reportRun(hooks, 'cluster', 'running', 'Reading venue pages for ' + pending.map(s => s.item.title).join(', ') + '.');
  const failedBefore = failed.size;
  const before=plan.stops.map(s=>s.item.title),batch:RouteChange[]=[];
  await Promise.all(pending.map(async s => {
   try {
    const value = await checkVenuePage(s.item, fetch, now, plan.date, runSignal);
    const original = items.find(o => o.id === s.item.id)!;
    original.hours = value.hours;
    original.curation = {...original.curation!, sourceReadAt: value.curation?.sourceReadAt, hoursBasis: value.curation?.hoursBasis};
    checked.add(s.item.id);
    if(!openingWindows(value.hours||{},plan.date).length){
     batch.push({venue:s.item.title,basis:'published_schedule',reason:'The official programme has no public opening window for '+plan.date+'.',before,after:[]});
     reportRun(hooks,'cluster','running',s.item.title+' has no public opening in the published programme for '+plan.date+'. Replanning around it.');
    }else reportRun(hooks, 'cluster', 'running', 'Read ' + s.item.title + ' and applied any supported dated hours.');
   } catch {
    runSignal?.throwIfAborted();
    failed.add(s.item.id);
    batch.push({venue:s.item.title,basis:'source_unavailable',reason:'The official page could not be read. This does not establish a closure.',before,after:[]});
    reportRun(hooks, 'cluster', 'running', 'Could not read ' + s.item.title + '. Removing it and trying another loop.');
   }
  }));
  const rows = candidates(active).filter(o => !failed.has(o.id));
  plan = planScout(rows, active, now, rail);
  if (failed.size > failedBefore) plan = widen(plan, rows, active);
  changes.push(...batch.map(c=>({...c,after:plan.stops.map(s=>s.item.title)})));
 }

 if (plan.stops.some(s => !checked.has(s.item.id))) {
  plan = planScout(candidates(active).filter(o => checked.has(o.id)), active, now, rail);
 }

 reportRun(
  hooks,
  'cluster',
  plan.stops.length ? 'complete' : 'blocked',
  plan.stops.length
   ? 'Selected ' + plan.stops.map(s => s.item.title).join(' → ') + '. About ' + plan.walkingMinutes + (plan.returnTransit || plan.stops.some(s => s.transit) ? ' minutes of walking and train' : ' minutes walking') + ' including the return.'
   : 'No short loop with a supported cultural anchor passed the checks.'
 );

 const fullPlan: ScoutPlan = {
  ...plan,
  changes:changes.map(c=>c.basis==='visitor_report'?{...c,after:plan.stops.map(s=>s.item.title)}:c),
  trace: [
   'Started with ' + seed.name + (seed.type === 'album' ? ' using its Qloo genre tags' : '') + '.',
   'Ranked ' + items.length + ' candidates within ' + VENUES.length + ' curated venues; ' + VENUES.filter(v => v.qlooId).length + ' have resolved Qloo IDs.',
   'Read ' + checked.size + ' venue pages' + (failed.size ? '; replaced ' + failed.size + ' unreadable sources' : '') + '.',
   plan.stops.length ? 'Fitted ' + plan.stops.length + ' stops with varied activities around their weekly hours and a return walk.' : 'No short loop with a supported cultural anchor passed the checks.'
  ]
 };

 return {
  plan: fullPlan,
  railUsed: rail,
  checkedCount: checked.size,
  failedCount: failed.size
 };
}

// ---------------------------------------------------------------------------
// Tool 5: toolSynthesizeQuest
// Synthesis of the 3-stop quest, door notes, timetable, and route dossier.
// ---------------------------------------------------------------------------

export interface ToolSynthesizeQuestInput {
 plan: ScoutPlan;
 seed: Pick<QuestSeed, 'id' | 'name' | 'type'>;
 records?: Opportunity[];
 unavailableCatalog?: boolean;
 budget?: string;
 focus?: QuestFocus;
 preferences?: Preferences;
 events?: RunEvent[];
 hooks?: RunHooks;
 now?: Date;
}

export interface ToolSynthesizeQuestOutput {
 quest: Quest;
 leads: EventLead[];
}

export async function toolSynthesizeQuest(input: ToolSynthesizeQuestInput): Promise<ToolSynthesizeQuestOutput> {
 const {
  plan,
  seed,
  records = [],
  unavailableCatalog = false,
  budget = 'any',
  focus = 'any',
  preferences,
  events = [],
  hooks,
  now = new Date()
 } = input;

 if (budget !== 'any' && !plan.notes.some(n => n.includes('price limit'))) {
  plan.notes.push('Matching official programmes were checked against your price limit before route selection.');
 }

 reportRun(hooks, 'synthesis', 'running', 'Composing the mission, timetable and sourced door notes.');
 const quest = composeQuest(plan, seed);

 if (unavailableCatalog) {
  quest.catalogNote = 'Fresh event listings were unavailable. This is a venue visit plan, with no current event or release claimed.';
  quest.notes.push('No fresh event catalog was available for this dispatch. This route uses checked venues; it does not claim a current event or release.');
 }

 for (const stop of quest.stops) {
  const programme = programmeFor(stop.item, quest.date, records, now, e => eventFit(e, seed)?.score || 0);
  if (!programme) continue;
  stop.programme = {
   title: programme.englishTitle || programme.title,
   url: programme.url,
   start: programme.start!,
   end: programme.end || programme.start!,
   priceLabel: programme.priceLabel
  };
  stop.mission = programme.kind === 'exhibition'
   ? `Visit ${stop.programme.title}. Give one work five unhurried minutes. Notice what holds your attention before you read the label. Keep one image or artist's name for later.`
   : `The official calendar lists ${stop.programme.title}. ` + stop.mission;
 }

 reportRun(
  hooks,
  'synthesis',
  quest.stops.length ? 'complete' : 'blocked',
  quest.stops.length
   ? quest.stops.length === 1
     ? 'One supported find. No complete walking route fit.'
     : 'Dossier ready. ' + quest.stops.length + ' stops, a return walk and venue sources.'
   : 'No complete route to write. Your seed is kept.'
 );

 const leadsPrefs = preferences || {
  intent: 'mix' as const,
  direction: 'any',
  format: 'places' as const,
  date: quest.date,
  days: 1 as const,
  budget: budget as any,
  unknownPrice: true,
  seeds: [{id: seed.id, name: seed.name, type: seed.type, feeling: 'love' as const}],
  exclude: []
 };

 const leads = eventLeads(records, seed, {...leadsPrefs, date: quest.date}, now, 3, focus)
  .filter(e => !quest.stops.some(s => s.programme?.url === e.url));

 if (!quest.stops.length) {
  quest.notes.push(
   focus === 'any'
    ? 'The current catalog could not support a complete walk for this seed.'
    : 'No checked walking route included the activity you chose. Try another direction or keep the seed without a direction.'
  );
 }

 quest.run = [...events];
 return {quest, leads};
}

// Snake_case aliases for agent runtime / MCP tool registries
export const tool_resolve_entity = toolResolveEntity;
export const tool_expand_taste_graph = toolExpandTasteGraph;
export const tool_schedule_verify = toolScheduleVerify;
export const tool_spatial_cluster = toolSpatialCluster;
export const tool_synthesize_quest = toolSynthesizeQuest;
