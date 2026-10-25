# SideQuest

Give SideQuest one thing you love. It scouts a short Tokyo quest with scheduled stops, something specific to do at each door, and a walking map.

[Open the private prototype](https://sidequest-tokyo-ckx.ckx-1994.chatgpt.site/) · [Live demo guide](DEMO.md) · [Pitch deck](https://chatgpt.com/space/page_d24a68d287908191ab7cfdce84212ace)

Tokyo residents can know an artist or a film without knowing which local rooms, shelves or programmes to explore. SideQuest connects that cultural seed to a reviewed local pool, then checks whether a visit can fit. It also indexes dated events, independent shop listings and pop-ups.

## Try it

1. Enter `Nujabes`, resolve the intended artist and choose Records & listening.
2. Watch real progress through taste expansion, operational checks, geographic planning and dossier composition.
3. Inspect a stop's cultural connection, open the walking map, or copy the itinerary.
4. Change the direction to Art & photography. The route and extra event leads should follow that answer.
5. Try `Pokemon FireRed Version` with Retro games, or browse [vinyl](https://sidequest-tokyo-ckx.ckx-1994.chatgpt.site/explore?format=drops&category=vinyl) and [fashion/design](https://sidequest-tokyo-ckx.ckx-1994.chatgpt.site/explore?format=drops&category=fashion).

Recorded outcomes are examples, not fixed itineraries. Tokyo time, opening windows and source failures can change a route. A supported two-stop quest or single find is preferable to an invented third destination.

## What Qloo does

Qloo resolves the seed, provides cultural tags and cross-domain associations, ranks allowlisted venues, and supplies venue coordinates and weekly hours. Artist reconciliation connects event lineups to Qloo entities. The app distinguishes direct affinity from a genre bridge between Qloo seed tags and reviewed venue tags.

Official pages supply event dates, lineups, genre evidence and price text. These details are not inferred from Qloo affinity. The catalog has 100 reviewed venues; 74 currently have reconciled Qloo IDs. Unresolved venues are excluded from routes.

The scout is deterministic tool orchestration. It considers route alternatives, reads selected venue pages and replans after failures. Authored missions describe what to try. A language model does not invent room details, opening hours or stock. This distinction matters when judging the agentic workflow.

## Planning and refresh

The planner allows 45 minutes per stop, finishes by 22:00 JST, caps each estimated walking leg at 1.5 km and the complete loop at 4 km, and includes the return leg. Dated overrides supersede weekly hours when supported. Distances are estimates, not street-routing measurements.

The D1 catalog retains official source records. The existing four-hour refresh checks sources; stale requests can trigger recovery. Gigs have a separate queue of 24 full-page reads per pass, rotated across publishers. Shop listing publication is labeled separately from a release or restock date. Unknown price, genre and availability remain unknown.

## Evidence, dated 25 October 2026

| Hosted check | Finding |
| --- | --- |
| Nujabes, records | Hi-Fi → HMV Shibuya → Bar Music |
| Same seed, visual art | Gallery Conceal enters the route; music-only leads are removed |
| Pokémon, retro games | HEY → BEEP; unrelated plush and homeware leads excluded |
| Slayer, records | Record Boy plus separate gig leads; local route coverage remains incomplete |

[Six contrasting quest cases](evaluation/quest-hackathon-after.json) · [Latest game/metal routes](evaluation/route-coverage-live.json)

The independent-source expansion added 39 records from BIG LOVE, pianola, CIBONE, PARCEL and WISH LESS. The hosted catalog snapshot held 608 records. Gigs with lineups rose from 120 to 178; Qloo artist name matches from 12 to 71; genre evidence from 16 to 94. These measure coverage, not satisfaction or recommendation quality. See [source checks and limits](evaluation/INDEPENDENT-MUSIC.md).

The earlier venue-list benchmark favored the local-model ranking. A separate repaired quest benchmark scored 2.92/5 relevance on returned quests versus 2.00 for its baseline, but used unblinded agent ratings on the diagnosis set. Neither proves a user-quality uplift. Methods and original results remain in [the ranking scorecard](evaluation/RANKING-SCORECARD.md) and [quest benchmark](evaluation/QUEST-BENCHMARK.md).

## Run locally

Requires Node 22.13+.

1. Run `npm run install:ci`.
2. Create ignored `.dev.vars` with `QLOO_API_KEY="your-hackathon-key"`.
3. Run `npm run dev` and open the printed local URL.
4. Verify with `npm test`, `npx tsc --noEmit` and `npm run build`.

The latest application verification passed 172 tests, type checking and the production build. Vinext/React serves the app, Cloudflare Workers runs server routes, and D1 stores the catalog. The primary quest flow requires Qloo; it does not require a language-model key. Fever is optional. See `.env.example` and [historical integration notes](IMPLEMENTATION-NOTES.md) for other connections. Keep credentials out of Git and browser code.

## Submission limits

The deployed site is owner-private. Judge access must be arranged before submission; no sharing change has been made. Official competition rules, deadline, required video length and eligibility are awaiting confirmation. No competition-readiness or winning claim follows from passing tests.

Metal coverage, some Japanese translations, namesake reconciliation and source-specific closure parsing remain incomplete. BEAMS blocks hosted reads; Connpass awaits approved API access. There is no unattended X timeline crawler. The original product brief has been superseded where later instructions chose one seed and a quest rather than an administrative search form.
