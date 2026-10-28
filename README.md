# SideQuest

One thing you love. A Tokyo quest.

[Open SideQuest](https://sidequest-tokyo-ckx.ckx-1994.chatgpt.site/) · [Two-minute demo script](DEMO.md) · [Three-taste review](evaluation/THREE-TASTES.md)

SideQuest turns an artist, author, film or brand into a short Tokyo outing. Qloo supplies cultural associations and venue affinity. A curated venue catalog and official event pages supply the places, programmes and published schedules. The planner fits supported stops together and explains changes when a venue cannot be used.

## What to try

Enter a name, choose an activity, then read the quest. Date and price limits are optional. Each stop includes a task, its published hours, source link and door notes where available. Walking distances are estimates; Google Maps provides street directions.

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

The final regression suite has 196 passing tests, including matching, route constraints, reported closures, source-specific closure replanning and failure labels. Automated tests measure behavior, not how much someone enjoys an outing.

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
