# Current quest-engine review, 25 October 2026

Qloo was losing because the app treated broad place affinity as evidence of cultural fit. The route solver then optimized those scores into convenient loops. This was an app ranking problem as well as a catalog problem. The previous twelve-profile scores do not measure the current quest engine.

## Fresh comparison

Eight single seeds cover jazz-influenced hip-hop, thrash metal, electronic music, minimal design, animation, a retro game and fashion. The exact resolved inputs were Nujabes, Slayer, Aphex Twin, MUJI, Spirited Away, Akira, Pokemon FireRed Version and Comme des Garcons. Seed spelling/type was disambiguated before capture. No profile was removed for failing to produce a route.

| Condition | Quests returned | Three / two stops | Relevance of returned quests, 1–5 | Missing quests counted as zero |
| --- | ---: | ---: | ---: | ---: |
| Previous Qloo quest engine | 4/8 | 4 / 0 | 2.50 | 1.25 |
| Fixed Qloo quest engine | 6/8 | 3 / 3 | 2.92 | 2.19 |
| Local-model baseline, current planner | 8/8 | 8 / 0 | 2.00 | 2.00 |

These are **unblinded Codex desk judgments**, not user ratings, measured novelty or statistically significant gains. Relevance is averaged within each quest, then equally across profiles with a result. The final column is a deliberately separate coverage penalty, not a standard satisfaction metric. It exposes the cost of abstaining. It is not valid to advertise a 46% product-quality gain from the returned-quests column.

The sample doubles as the diagnosis set used to make the fixes. It is not held out. The baseline's fictional cultural interpretations can also be poor. Its high scores for punk/record shops under MUJI are a useful example. Neither condition establishes stock, admission or current exhibition suitability from weekly hours.

## Bad matches and fixes

* Slayer previously received Gallery Conceal, SPBS and Bar Music. The first two had no supplied metal connection; Bar Music's reviewed selection is jazz/soul. Music shops and listening rooms now require matching genre evidence. Affinity alone cannot qualify them.
* Aphex Twin previously finished at Little Soul Cafe, despite its jazz/soul selection. It now gets a shorter experimental-art walk. The result is adjacent visual culture, not a claim that the gallery has an Aphex Twin programme.
* Nujabes gave two jazz/soul tags twice the points of one hip-hop tag. The strongest connection now dominates, with a small capped contribution from additional tags. Affinity is a small tie-breaker.
* Akira's `Postmodernism` keyword matched the substring `modernism`, which became minimalist-design shopping. Word boundaries fix this false bridge. A film medium link remains broad and is not an Akira stock claim.
* Hard neighborhood buckets blocked genuinely walkable MUJI routes. Actual per-leg distance, full return distance and hours still constrain every route; a district label no longer vetoes a short walk across its arbitrary boundary.
* The old pool could omit a nearby break simply because Qloo returned no affinity. All resolved, operational curated places can now provide a clearly labeled stopover. A route still needs a supported cultural anchor and can contain at most one unrelated stopover. Weak cross-domain links cannot establish that anchor.
* When only two relevant stops fit, the engine can return a shorter quest with an explicit note. It no longer needs an incompatible third stop to complete the dossier.

## Returned routes

| Seed | Fixed Qloo route | Baseline route |
| --- | --- | --- |
| Nujabes | Hi-Fi Record Store → HMV record shop Shibuya → Bar Music | Bear Pond → Record Station → Little Soul Cafe |
| Slayer | No supported walking quest | KOFFEE MAMEYA → WATARI-UM → BIG LOVE |
| Aphex Twin | Dandelion Chocolate Kuramae → Mograg Gallery | Fuglen → Hi-Fi Record Store → SPBS |
| MUJI | GLITCH Jimbocho → Bohemian's Guild → Komiyama Tokyo | Bear Pond → NAT RECORDS → Record Station |
| Spirited Away | ONIBUS Nakameguro → Daikanyama T-Site → Art Front Gallery | Same set, different order |
| Akira | ONIBUS Nakameguro → Daikanyama T-Site → Art Front Gallery | Kanda Brazil → Komiyama Tokyo → Bohemian's Guild |
| Pokemon FireRed Version | No supported walking quest | KOFFEE MAMEYA → UTRECHT → BIG LOVE |
| Comme des Garcons | ONIBUS Nakameguro → Art Front Gallery → Daikanyama T-Site | Fuglen → HMV record shop Shibuya → SPBS |

The film/fashion overlap remains a failure. Mean pairwise set overlap among returned fixed quests is 0.156, versus 0.083 before and 0.054 for the baseline. Lower overlap does not guarantee relevance; the baseline illustrates that. Still, the fixed engine has not solved taste differentiation. A film bookshelf is a broad connection, not a franchise-specific afternoon.

## Controlled method and reproduction

Planning is frozen at 12:00 JST on Sunday 25 October 2026, with the same date, unconstrained budget, source-read snapshot, weekly hours, 45-minute visits, walking estimates and return requirements in every condition. The catalog has 100 entries, 73 resolved Qloo IDs; event-only rooms remain excluded. Sixty-four venue sources were readable in this capture. Unknown opening hours remain unusable. A successful page read is not proof of an exhibition or special opening.

The local model `bionic qwen3.5-text-9b-nsfw-rp-roleplay-i1` scored the complete common readable venue pool at temperature zero with reasoning disabled, using seed name/type and curated names, roles, tags and activities. It received no Qloo affinity, related entities or seed-tag expansion. Its scores feed the same **current** route planner as the fixed condition. Model scores of at least 75 establish a baseline anchor, 50–74 an adjacency, and lower scores a stopover. The Qloo condition establishes those levels from direct versus lateral metadata evidence. Comparing them tests the full ranking policies, not raw Qloo versus model intelligence in isolation.

Codex rated each seed/venue pair once and reused the rating wherever it appeared in any condition. The annotation manifest is [quest-review-rubric.json](quest-review-rubric.json). Full per-profile routes, timings, ratings and aggregate calculations are in [quest-benchmark-2026-10-25.json](quest-benchmark-2026-10-25.json). The historical workbook and its negative scores remain unchanged.

The scripts capture private responses under ignored `.local/quest-benchmark/`, then replay those exact bytes. Run `node scripts/benchmark-quests.mjs before` only for a fresh pre-change capture, `node scripts/benchmark-quest-baseline.mjs` for the configured local model, `node scripts/benchmark-quests.mjs after` for frozen replay, and `node scripts/summarize-quest-benchmark.mjs` for the review summary. A missing replay response fails rather than silently contacting a changing API. Freeze or copy the pre-change engine before editing when starting a new experiment. The committed summary contains authored judgments and catalog titles, not provider response bodies or credentials.

## What needs work next

Fill complete walkable pools around the best anchors. Metal needs a usable Koenji route around Record Boy; retro games need compatible Akihabara stops. Animation and fashion need source-confirmed specialist venues, programs or stock. Resolving an ID without usable hours does not fill that gap. Adding another generic café does not either.

Use explicit artist/franchise/designer matches from the persistent event/drop catalog as stronger anchors when a dated listing exists. Keep them distinct from general venue tags. Then run held-out tastes and collect users' save/reject reasons. Novelty needs users' familiarity; it cannot be inferred from a low popularity score or a different neighborhood.
