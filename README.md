# SideQuest

Catch it while it's here.

[Open SideQuest](https://sidequest-tokyo-ckx.ckx-1994.chatgpt.site/) · [Two-minute demo script](DEMO.md) · [Three-taste review](evaluation/THREE-TASTES.md)

SideQuest now starts with time-limited events and drops. Discover a listening party, gig, pop-up, exhibition or timed order window, in person or online. Qloo connects named interests to source evidence. Permanent venues and ordinary stock listings stay outside the main feed. Tokyo walking quests remain at `/quests`.

## Final release check

The 29 October check passed 269 automated tests, TypeScript and live feed, taste and route checks. The current snapshot contained 341 eligible timed finds from 24 sources. Nujabes and Iron Maiden shared none of their top six; Nintendo still had weaker direct coverage. The agent excluded a visitor-reported closed stop and returned a replacement route. Read [the final review](evaluation/FINAL-REVIEW.md), [live results](evaluation/FINAL-LOCAL.json) and [updated two-minute script](DEMO.md). These checks do not establish a human-quality lift.

## Start with events and drops

Browse immediately, tell a short story at `/taste`, or enter an artist, film, game or brand. Use Events, Limited drops, Online only or Tokyo in person. Exact online event times and order deadlines use the browser's timezone. Date-only listings retain organiser dates.

A live check on 28 October 2026 returned 337 eligible finds for the next 30 days, including 118 online opportunities and 18 online timed drops. The snapshot contains 151 gigs, 14 exhibitions, 44 pop-ups, 110 other events and 18 releases. These counts combine the existing official catalog with the new online sources; they are not 266 newly added events or a measure of hype.

New adapters read Bandcamp's online listening-party schedules, hololive's explicit order-period blocks and Steam's official festival announcements. Existing sources still supply independent gigs, art, fashion pop-ups and MEDICOM preorders. The main feed excludes generic product-listing dates, manufacturer shipping dates, expired order windows and permanent locations.

Global records persist in D1 and participate in the existing scheduled catalog refresh. Browsing reads eligible stored records first; an empty catalog has a bounded refresh attempt. The global source adapter retains its one-hour cache. Source failures preserve earlier records with their original check time. Exact cutoffs still remove expired opportunities. No new developer credentials are needed for these public sources.

Taste matching retains direct names and specific genre evidence, then uses Qloo candidate affinity and returned contributor evidence for cultural associations. Source and format variety break ties. No trending score, social popularity count or guaranteed shipping region is inferred. See [the live feed check](evaluation/EVENT-FIRST.md).

## Tell us what matters

At `/taste`, describe named cultural interests in your own words, or add one name. Qloo resolves artists, works and brands. Review each suggestion before adding it, then set its strength. Existing profiles open directly on the strength controls. Stumble opens with one actual find rather than a required either/or game.

Love has weight 1, Like 0.65 and Curious 0.4. Not using has weight 0 and remains in the profile without steering results. Avoid has weight -1 and excludes listings that name the artist, work or franchise. It does not reject a whole genre. Changing these strengths changes direct and genre ranking, Qloo contributor influence, and the single-find selector. Explicit strengths override old positive saves for the same identity.

The story reader recognises explicit English preference wording. It suggests cultural names and strengths, with an editable review for errors and ambiguous identities. It does not infer motives, diagnose a personality or invent a persona. Raw writing stays in component memory; only extracted name searches go to the existing Qloo lookup. Confirmed names and strengths stay in this browser. Save clears older interview tags and session comparisons while preserving practical settings and saved-event reactions.

Qloo receives confirmed positive entity IDs. SideQuest applies the relative strengths to source matching, priority and the returned contributor evidence. A per-entity weight is not fabricated in the provider request, and provider affinity values are retained unchanged. When contributor evidence is absent, the smaller fallback boost follows overall positive strength but cannot distinguish which individual interest caused the association. See [the weighted taste checks](evaluation/TASTE-STRENGTH.md).

## Qloo and the event inventory

The matching service resolves source-named cultural entities and scores inventory candidates in bounded batches across supported domains. It retains affinity and contributor evidence instead of reducing an association to a name-only flag. Comparisons stay within a domain and request context. A film, game or brand can act as an input signal for related cultural candidates. Exact identity ambiguity stays unresolved.

The taste scout chooses one supported official calendar from WWW, mograg or Shibuya PARCO using the current direction or seed domain. It only adds dated announcements that name a confirmed or returned related entity. Zero matching announcements remains zero. Research links for other related names are separate, unverified leads. The optional comparison round remains in source; the primary story setup uses live name lookup and an editable review.

Legacy no-name interview choices use explicit editorial tags against actual listing/category/genre evidence. Those labels are not passed to Qloo as invented tag IDs or described as Qloo findings. Mapped identities, scored candidates and missing coverage remain inspectable under Sources & taste connections. Automated checks cover behavior; they do not establish that Qloo beats a human or another model.

## Optional Tokyo walking quests

Open `/quests`, enter a name, choose an activity, then read the quest. Date and price limits are optional. Each stop includes a task, its published hours, source link and door notes where available. Walking distances are estimates; Google Maps provides street directions.

On 28 October 2026 we tested the same visit date, 29 October, with three contrasting tastes. When asked to disambiguate, we chose Slayer the artist and MUJI the brand.

| Taste and choice | Returned outing | What the connection supports |
| --- | --- | --- |
| Nujabes, records & listening | Hi-Fi Record Store → HMV record shop Shibuya → Bar Music | Reviewed jazz/soul selections. This does not promise a Nujabes performance or a particular record in stock. |
| Slayer, records & listening | Record Boy | A metal specialist. Nearby supported stops did not form a suitable loop, so the result stays at one stop. |
| MUJI, design & architecture | KOFFEE MAMEYA → UTRECHT → WATARI-UM | Design, publishing and architecture connections. Weekly hours do not establish a current exhibition. |

The three returned sets have no venue overlap in this capture. These are functional examples, not a human satisfaction benchmark. Main routes stayed the same after this repair; the fixes protect matching evidence, explain weaker music links and remove duplicate event leads. Source availability can change the routes between runs. Full evidence is in [the review](evaluation/THREE-TASTES.md), with [before](evaluation/three-tastes-before.json) and [after](evaluation/three-tastes-after.json) captures.

## How the scout works

The five tools are exported from `lib/agent-tools.ts`. This is a bounded, deterministic planning workflow with real API calls. It does not use an LLM to invent venues or opening hours.

1. **Find the interest.** Resolve the name through Qloo `/search`. Ask when several cultural entities share it.
2. **Follow taste connections.** Read Qloo metadata and `/v2/insights`, then rank resolved entries from the curated Tokyo venue catalog. Direct seed evidence, lateral associations and nearby stopovers remain distinct.
3. **Check published hours.** Apply Tokyo time, date, budget, coordinates and available schedules. Dated programmes can improve venue relevance when the source supports the connection.
4. **Plan and recheck.** Compare short loops, read candidate official pages, apply supported dated exceptions, and retry when a candidate becomes unusable. Estimated walking legs are capped at 1.5 km and the full walking loop at 4 km. A direct train corridor can help when walking alone cannot form a route. Train times are estimates.
5. **Write the quest.** Return the actual stops, times, authored activities, source notes and map. One or two supported stops are allowed. The engine does not force three.

Progress comes from these tool results over `application/x-ndjson`. The visible run reports completed checks and failures. Detailed calls remain expandable.

Activity choices affect route selection but cannot create a cultural anchor. Exact genre evidence ranks above broad music-family adjacency. Repeat dates of the same programme do not fill the event shortlist.

## Replanning when a stop cannot be used

Each current stop has **Closed? Replan without this stop**. It sends a visitor-reported exclusion and reruns planning with the same taste, activity, date and budget. The result labels the report as unconfirmed by an official notice. Reports remain session-local and can be cleared for the next plan.

The scout also records automatic route changes. A source-specific dated closure is labelled as a published-schedule constraint. An unreadable website is labelled as a source failure, which does not establish that the venue is closed. **Why the route changed** shows the evidence and successive route attempts.

A reproducible controlled closure check uses a Mograg exhibition-page fixture with an explicit Monday closure and synthetic coordinates. The real closure reader and planner remove Mograg and retain a two-stop route. This is a controlled demonstration, not a live closure announcement.

```powershell
node --experimental-strip-types scripts/demo-closed-venue.mjs
```

See [the closure trace](evaluation/closed-venue-replan.json). General closure detection across arbitrary Japanese pages is not implemented; supported adapters and visitor reports have explicit limits.

Pianola's official Japanese access page was checked on 28 October. Its Thursday closure overrides the provider schedule, and its BONUS TRACK address replaces an outdated floor note. [Official access page](https://pianola-records.com/pages/about-us).

## Events, drops and coverage

**Events & drops** browses the persistent source catalog by live music, vinyl, fashion, exhibitions, pop-ups and releases. Interest editing and source evidence are expandable. The catalog ingests official venue calendars, shop and brand announcements, cultural hubs and available event services. Fever is one source, not the whole inventory. Source failures and access-dependent adapters appear in coverage notes.

Current exhibitions or events enter a venue quest only when supported by the catalog and matching logic. Other relevant upcoming announcements appear as separate leads, with their own dates. A shop listing is not proof of a new limited release, current stock or admission. Japanese translation can be unavailable; the original evidence is retained.

## Evidence and limits

The final regression suite has 252 passing tests, including matching, route constraints, closures, candidate batches, cross-domain identity persistence, game context, reactions, Stumble and bounded official scouting. Automated tests measure behavior, not how much someone enjoys an outing. See [the adaptive taste check](evaluation/ADAPTIVE-TASTE.md).

The [25 October comparison](evaluation/QUEST-BENCHMARK.md) remains historical. It used unblinded AI desk judgments and examples also used for debugging. We do not claim a measured percentage improvement in recommendation quality. A held-out human evaluation remains open.

Opening times are published schedules. A successful page read does not prove that the venue is open now, that a particular exhibition is running, or that a product is available. Recheck official details before travelling or buying.

## Run locally

Requires Node 22.13 or newer.

```powershell
npm run install:ci
```

Save the Qloo key in `.dev.vars` as `QLOO_API_KEY`, then run:

```powershell
npm run dev
npm test
npx tsc --noEmit
```

Use the local URL printed by the development server, normally `http://127.0.0.1:5173`. Qloo credentials stay on the server. Hosted catalog persistence uses the configured D1 binding; optional integrations retain their own access requirements.

To repeat the three-taste functional check with an explicit visit date:

```powershell
node scripts/audit-three-tastes.mjs after 2026-10-29
```

This calls real services and writes a dated report. Routes and service response times can change. Private raw responses remain in ignored `.local/three-tastes/`.
