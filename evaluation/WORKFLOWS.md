# SideQuest quality workflow

## Taste quality: repeatable checks plus a human verdict

Run `node --experimental-strip-types scripts/evaluate-tastes.mjs` against the local preview. It runs 12 fictional inputs from `lib/taste-bench.ts`, resolves exact cultural names and types, then uses the real discovery route. It does not send visitor cookies, read the owner's profile or call Fever. Both sides use Across Tokyo, today and a flexible budget. The six suggested contrasts keep activity constant; changing activity is a separate experiment.

`baseline.json` records the first live run before category expansion. `latest.json` records the live run after it. They contain public place records and fictional sample inputs, never credentials or visitor preferences. These are dated observations, not a permanent provider benchmark. A failed seed lookup is recorded rather than silently replaced with a different work or brand.

Review count, duplicate IDs, source explanations, missing hours, supplied popularity and pairwise shared-place counts. Do not turn these into a satisfaction percentage. A lower popularity value is not proof of quality, obscurity or current availability. Different lists can both be poor. Named Qloo contributors establish a returned association, not a causal explanation of why a person will enjoy a venue.

The browser comparison at `/taste-lab` lets a person rate individual suggestions as Would save / Maybe / Not for me. It starts no search until requested, uses separate browser-local ratings and has an export/clear path. It never applies a sample to the visitor's personal profile or saves a venue to their own list. Use human ratings and a reason for rejection to decide which ranking changes are justified.

### Observed on 23 October 2026

All 12 samples resolved their exact interests and returned places. The initial collecting search returned the same six places for all four collecting samples. Live tag probes found omitted hobby-store and arcade categories; adding those and accepting primary Game store/CD store records expanded the pool while rejecting unrelated bar primaries. The two collecting contrasts changed from 6/6 identical lists to 5 shared places across two lists of 8, and 4 shared across two lists of 8. This is evidence of increased variety, not human approval.

Remaining concern: the Starbucks/Taylor Swift café input returned maid/character cafés. The run is mechanically valid but its taste fit is questionable. Do not mark it as a quality pass. Music and art also contain broad or unexpected associations requiring human judgment. Event relevance, official-feed coverage and product shopping fit are outside this place-only benchmark.

## UX review: drive the flow

Adapted from [Production-grade UX review](https://www.reddit.com/r/ClaudeAI/comments/1u306eg/comment/or332ay/). Name the path first, exercise the real running application, record observed states and fix findings before repeating the affected check. Code inspection alone does not establish that a flow works.

For a change to taste/discovery, check: existing interests survive draft edits; a persona opens follow-up questions; provider errors have retry/skip; review shows actual choices; leaving without Apply preserves the saved profile; date/budget/area scopes are clear; saved data stays in the intended browser store. Check desktop, the current user width and mobile. In comparisons, verify selection changes clear old results, cancellation cannot populate stale results, identical inputs cannot masquerade as a contrast, one failed column does not discard another, and ratings stay separate from personal saves.

### Drive record for this release

- Observed in the running local app: persona → leading-interest question → live Qloo lookup → skip → activity → review → leave without applying → original three interests remain.
- Observed in the running comparison: real jazz/metal and games/anime searches, shared-place counts, a sample rating, reload persistence, rating removal and updated selections. The test rating was cleared, not reported as user research.
- Automated Workers checks: fixed sample inputs, exact name/type resolution, invalid-origin/input rejection, no Fever/cookie forwarding, empty/duplicate overlap and static-reader fallback behavior.
- Provider failure branches use deterministic fixtures. No live provider outage was induced. Hosted PullMD has not been tested because no endpoint was supplied. Storage-denied and screen-reader use require further human/device testing.

## Copy: specificity before personality

Adapted from the [Humanizer editing method](https://www.reddit.com/r/ClaudeCode/comments/1sy4137/the_most_useful_claude_skill_i_ever_created/). Use two bounded passes: first replace abstract copy with an accurate task or source detail; then remove inflated claims, filler and redundant phrases. Check the revised words inside the actual flow. Do not add fabricated opinions, personal experiences or reasons for liking something.

Examples applied here: “What’s the pull with Nintendo?” → “What interests you about Nintendo?”; “Your little black book” → “Saved for later”; loading copy names the search being performed. Recommendation explanations name actual returned Qloo contributors. Missing contributor data says that no individual explanation was supplied. Preserve Japanese source wording, uncertain dates/prices, source failures and the separate role of explicit product follows.

## Optional clean-page reader

[PullMD](https://github.com/AeternaLabsHQ/pullmd) support is implemented as an optional server-side announcement reader. Configure `PULLMD_URL` with an HTTPS service base URL and, only if accepted by that instance, `PULLMD_BEARER_TOKEN`. Do not put either credential in browser code. The hosted app currently has neither configured, as requested by the owner.

Only supported public official-site URLs are sent. Supplied text, unsupported domains and X posts do not go through PullMD. MEDICOM retains its exact official Atom-entry reader. Requests use documented plain-text output, static extraction (`render=skip`), no comments, manual redirects, a 12-second timeout and a 150 kB output limit. Reader errors fall back to the direct official-page reader and disclose that fallback. This does not add X search, a login bypass, browser rendering or broader event-feed coverage. Contract/failure behavior is tested with fixtures; external deployment is still required for a real PullMD comparison.
