# Quest and event repairs, 25 October 2026

The app had two separate gaps. A single seed did not tell it what someone wanted to do, and dated events entered the quest only after venue selection. The catalog could also silently disappear when a scheduled refresh was delayed beyond its 24-hour read window.

## What changed

After resolving the seed, the app asks one optional activity question. An artist can lead to records, visual art or books. A film can lead to visual art, books or design. The person can skip the question and follow the seed. The selected activity must appear in any returned route. Its explanation says it comes from the person's answer, rather than attributing it to Qloo. Disambiguation now shows exact-name alternatives first, with short descriptions.

Matching official exhibitions and pop-ups now affect scores and budget eligibility before the route is selected. An explicit subject match outranks a generic venue connection. If several programmes share a venue, the selector favors the relevant one. Event evidence never invents a visit window, current stock or admission price.

The result can also show up to three matching announcements over the following seven days. These are separate from the timed route. A gig outside the curated walking pool can therefore remain useful. Online releases can appear here, but never become physical map stops. A small reviewed franchise alias list connects Japanese Pokémon/Digimon/Zelda/Final Fantasy/Mario announcements to related game inputs, with an explicit distinction between franchise relevance and edition or stock confirmation.

If only one matching venue has usable hours, the app returns that find and a map search, with no fabricated loop or walking distance. This recovers Record Boy for Slayer and BEEP for retro games. BEEP is not a claim that a particular Pokémon edition is stocked.

The first quest after twelve hours checks catalog refresh state. It refreshes stale official calendars and then stale expanded sources, rather than interpreting a TTL-filtered empty read as zero coverage. The events page can also repair an empty stale catalog. Existing fresh records and translations remain readable. Failed source refreshes are explained; they do not manufacture events.

Newer source adapters previously skipped Qloo artist reconciliation. Expanded-source refresh now runs the same exact-name/alias matching as the main refresh.

## What the live checks found

The local catalog initially returned zero records, with refresh state dated 23 October. The repaired request recovered 189 records across 13 publishers. A subsequent expanded-source check resolved DEXCORE to metal/metalcore/deathcore genres and Optimo to electronic/techno genres. Only two artists resolved in that check. The catalog is not fully reconciled.

Qloo also supplied positive associations between DEXCORE and unrelated seeds such as Nujabes and MUJI. Those associations alone produced bad recommendations in the first live run. The final matcher requires an explicit subject/franchise match or compatible published/resolved genres. Artist affinity can strengthen an existing genre match; it cannot qualify a conflicting gig. Sold-out status and explicit sold-out price cards exclude a lead. Optimo's sold-out listing therefore stays out.

Final live local app checks produced these results:

| Input and answer | Result |
| --- | --- |
| Nujabes, records | Hi-Fi → HMV Shibuya → Bar Music; a dated jazz announcement as a separate lead |
| Nujabes, visual art | Gallery Conceal replaces HMV; the route still retains reviewed music connections |
| Slayer, records | Record Boy as a single find; DEXCORE at LIQUIDROOM on 28 October as a metal lead |
| Akira, books | GLITCH → Bohemian's Guild → Komiyama; no deathcore announcement |
| MUJI, design | ONIBUS → T-Site → Art Front; no deathcore announcement |
| Pokemon FireRed Version, retro games | BEEP as a single find; no invented Pokémon stock or irrelevant gig |

These are functional checks, not user satisfaction scores. The raw six-request summary is [quest-live-check-2026-10-25.json](quest-live-check-2026-10-25.json). The historical relevance benchmark remains unchanged because its three-stop/two-stop conditions differ from this implementation.

The frozen direction audit covers seven seeds and seven accepted API directions, including combinations not offered by the UI. Every returned result includes its selected activity; some combinations have no suitable venue. See [quest-directions-2026-10-25.json](quest-directions-2026-10-25.json). Replay with `node scripts/audit-quest-directions.mjs` using the ignored private benchmark snapshots. Run `node scripts/check-live-quest-matches.mjs` against a local preview for the live catalog checks. Missing private inputs are errors, not a reason to synthesize results.

## Remaining limits

Activity choice is an explicit request, not a personality inference. Film and fashion routes still rely on broad cultural adjacency where specialist programmes are missing. Many indexed events lack useful genres or resolved artists. Scheduled refresh can still fail at individual sources; request-time repair adds latency to the first visit after a stale period. These changes improve recovery and matching discipline, but do not establish a new quality uplift over the baseline.
