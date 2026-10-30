# Public release check, 30 October 2026

The public application at https://sidequest-tokyo-ckx.ckx-1994.chatgpt.site/ was deployed from application commit `55533a6c9501b51e9787bbf32b1c8a22ab87d61e`, Sites version 56. Public access was explicitly enabled. GitHub was updated without a force push and reports the repository as public with a recognized MIT license.

## Verification

- 292 automated tests passed. TypeScript and the production build passed.
- Anonymous HTTP checks used no cookies, owner session or service credential. Home, taste, Stumble, quests and classic pages returned successfully. Catalog filters, invalid input handling and expiry ordering passed.
- The source snapshot contained 389 eligible timed finds from 30 sources. This comprised 51 releases, 146 gigs, 67 pop-ups, 14 exhibitions and 111 other events. Counts are a snapshot, not a claim of completeness or future availability.
- Nujabes, Iron Maiden, Nintendo and Pokemon FireRed Version each received actual Qloo scores for 113 mapped candidate entities, with status ready. Nujabes and Iron Maiden shared none of their top six finds. Nintendo and the Pokemon game shared all six. Distinct inputs do not always imply distinct results.
- An additional Portishead request also returned 113 scored entities with status ready. The cold-start regression test asserts that candidate scoring precedes optional discovery and name resolution. This fixes the earlier request ordering that could spend the budget on identity searches before ranking.
- The anonymous agent returned Hi-Fi Record Store, HMV record shop Shibuya and Bar Music. A simulated visitor closure report excluded Hi-Fi Record Store and returned Record Station, Pianola Records and Little Soul Cafe. This is not evidence of an actual closure.
- Fresh headless Chrome contexts began without cookies. Catalog rendering, Google Maps, adding to My day, reload persistence, a three-stop quest and expandable Japanese door-note evidence passed. No application page errors were observed. At a 390-pixel mobile viewport, document width was also 390 pixels.
- A settled Google map showed seven grouped venue pins for 136 mapped finds, with no Google error overlay. Online finds and missing coordinates remain explicitly outside map coverage.
- An official UNIT announcement import retained the Japanese original and extracted the published 18:30 door time, 19:30 start and admission information. The imported item survived reload. Translation was partial and the structured venue field remained missing. These limitations were visible to the visitor.
- A staged five-star enjoyment rating persisted in an isolated browser. A generated quest transferred three stops and their arrival times into My day with a Google directions link. This check does not claim attendance.
- Anonymous bulk catalog editing returned 403. An authorized empty maintenance update returned 200 with zero changes. Public visitors can still request generated translations of existing catalog records.

## Remaining work

Complete the actual Devpost entry, eligibility declarations and final submission. The optional 2:05 video is local until uploaded to a video host.

The existing cloud refresh task needs the added maintenance credential header. Its prompt could not be inspected or updated because the desktop automation-management connection returned Transport closed. Authorized maintenance itself was verified, but unattended execution is not verified. See [.openai/catalog-maintenance.md](../.openai/catalog-maintenance.md). Do not describe the scheduled updater as confirmed after this release.

Clean-checkout installation was not repeated in this release check. Human recommendation-quality evaluation and provider reuse review remain separate from functional verification. No satisfaction percentage or benchmark lift is claimed.

Detailed local traces and screenshots are retained in ignored `outputs/final-public-check.json`, `outputs/cold-public-qloo.json` and `outputs/public-browser/`. The published summary contains derived results rather than full provider responses.
