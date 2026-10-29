# Final release check

Checked on 29 October 2026. The evidence describes working behavior and current inventory, not a satisfaction benchmark or a predicted hackathon result.

## Result

All 270 automated tests passed. TypeScript passed. The local Workers preview passed the live final check for the main feed, taste setup, Stumble, quest page and announcement-import entry. Browser checks covered saved-drop persistence, Undo Save, smart-apostrophe story input, the single-find handoff, Next advancing and the phone layout without horizontal overflow.

The final live catalog contained 341 eligible timed finds from 24 sources. It had 152 gigs, 15 exhibitions, 110 other events, 44 pop-ups and 20 releases. Online-only returned 121 finds. These are a dated snapshot; they change as sources refresh and cutoffs pass.

## Final fixes

- Phone smart apostrophes no longer turn "I'm obsessed with Nujabes" into a search for an apostrophe fragment. "Not interested in" is also recognised and reviewed as an avoid suggestion.
- An Experimental-only music overlap is a weak connection rather than an exact style match. The Radiohead-to-metal case no longer receives a strong genre bonus.
- Visual-style tags from a game no longer count as musical genre evidence for online listening parties. Literal game/franchise references still qualify.
- Partial taste-check coverage is now explicit under the source details in the feed and Stumble.
- An unsupported music association for a non-music seed no longer keeps a positive ranking boost while being labelled a wildcard.
- New browser reactions override an older session snapshot. More like this and Save are no longer silently replaced by stale feedback during the next request.
- Undo Save removes that save signal. It preserves a later explicit More like this reaction and unrelated feedback.
- Price labels for sale price, general/international entry and age-18-and-under tickets translate without changing amounts or eligibility. Lineup previews exclude role headings and mixing labels. Matching explanations name the interest behind the connection.
- A walking request reads the existing catalog snapshot. It no longer waits for a city-wide source refresh and a separate catalog-wide artist-affinity pass before planning. Venue graph expansion and official-page checks still run for the route.

## Contrasting tastes

The captured Nujabes, Iron Maiden and Nintendo requests returned ready Qloo evidence. The final regression also includes Pokemon FireRed Version after the production-discovered visual-style mismatch. Each had 91 mapped listings and 121 scored cultural entities within the current inventory. A ready response does not mean all 341 listings are personally matched.

| Seed | First result | Shared top six with Nujabes |
| --- | --- | --- |
| Nujabes | Moses Boyd, Songs For Sinners listening party | Same profile |
| Iron Maiden | Mark Boals x Kelly SIMONZ at Daikanyama UNIT | 0 |
| Nintendo | A PARCO exhibition involving the film Kamome Diner | 1 |

Nintendo is still the weakest case. The captured lead is a lateral film association, not a Nintendo event. Removing an unsupported music bonus prevents false prioritisation; it does not manufacture missing gaming inventory. Keep that limitation in the pitch.

The Pokemon FireRed Version regression no longer claims a visual-style-to-music genre match. Its captured top six remained wildcards, so the game-specific coverage gap is still open.

The report retains the actual reasons and wildcard labels. See [the captured live results](FINAL-LOCAL.json). None of these numbers establishes a percentage quality lift over a baseline.

## Agent and closure check

The final run streamed resolve, taste, operations, cluster and synthesis stages. It returned Hi-Fi Record Store, HMV record shop Shibuya and Bar Music for 30 October. Tokyo's afternoon had already passed, so the next-day date is expected.

Reporting Hi-Fi Record Store closed excluded it. The replacement route used Record Station, Pianola Records and Little Soul Cafe, also on 30 October. A separate unreadable-source replacement remained labelled source_unavailable. The Thursday closure check for Pianola passed.

This was a simulated visitor closure report. It is not an organiser announcement. Controlled tests separately prove replanning from a published dated closure.

The first diagnostic run took about 82 seconds while the older route path could wait on catalog refresh and extra artist scoring. After the critical-path fix, a captured route took 6.7 seconds and replanning took 5.4 seconds. Earlier warm runs took around 11 seconds. The latest full regression took 18.8 seconds for the route and 27.5 seconds for replanning. Provider and source conditions vary, so these captures do not establish a guaranteed speed or a controlled performance lift.

## Recording and reproduction

[DEMO.md](../DEMO.md) contains the two-minute recording sequence, a labelled closure action and recovery lines for provider failure. It removes the retired comparison-game instructions.

Run `npm test`, `node node_modules/typescript/bin/tsc --noEmit` and `node scripts/check-final.mjs` with the local preview running. The live check changes no visitor taste or saved finds. It reads the catalog and may update normal server-side provider/source caches.

For the existing private production Site, use `node scripts/check-final.mjs --hosted` and supply its short-lived Site credential through hidden stdin. The production result is written to ignored `outputs/final-hosted-check.json`; no credential is stored in the report. The local report remains in `evaluation/FINAL-LOCAL.json`.

Full Japanese announcement translation and cultural identity coverage remain uneven. Known labels and source details are readable, but unknown names stay original and some previews explicitly say the full translation is unavailable. Stock, shipping eligibility and live ticket availability still depend on the official source.
