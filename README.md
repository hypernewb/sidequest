# SideQuest

Taste-led Tokyo discovery for the Qloo Agentic Hackathon. Vinext/React app with a server-side Qloo adapter. No language model or second API key is required to run the current experience.

## Dispatch SideQuest Agent

The main screen asks for one artist, album or place. After one optional activity choice, dispatch produces a quest dossier with an authored task at each door, scheduled visits, source links and a walking loop. Date and price settings stay in an optional disclosure. Events and drops remain under /explore; older tools and saves remain under /classic.

The local catalog contains 100 source-reviewed entries. 73 have exact Qloo IDs after name, domain and branch checks. The remaining entries are not route candidates. Closed locations and event-only rooms without a dated performance are excluded. The catalog includes independent record shops, small galleries, bookshops, coffee rooms and game shops. It is a maintained editorial selection, not a claim to cover all Tokyo subcultures.

Dispatch resolves the seed, requests Qloo affinities only for allowlisted venue IDs, retrieves fresh venue coordinates and hours, and considers complete three-stop loops. Some indexed shops have no computed place affinity. A separate genre bridge matches Qloo seed tags against source-reviewed venue tags. The dossier distinguishes that bridge from direct place affinity. Albums use their Qloo genre tags because the tested Insights endpoint did not accept the album ID as a signal. No individual preference or psychological trait is inferred.

The planner combines direct affinity and explicit genre overlap, then penalizes distance and waiting. It requires varied activities, allows 45 minutes per stop, finishes by 22:00, limits each estimated walking leg to 1.5 km and the whole loop to 4 km, and includes the return leg in the map. Weekly hours are checked for the chosen Tokyo date; dated overrides take precedence. It reads selected venue pages and replans after failed sources, with at most twelve page reads. Unknown hours cannot become opening windows. Special closures and gallery changeovers remain a limit outside source-specific adapters.

The scout is deterministic tool orchestration. It does not use a language model. Venue tasks are authored in the catalog. No room smells, current records, products in stock, cash rules or photo restrictions are invented. Door notes are shown only when backed by a linked source. Qloo response descriptions, coordinates and hours are fetched at dispatch, rather than bundled in the public catalog.

The current quest-engine benchmark uses eight contrasting seeds and frozen Qloo/source responses. The fixed engine returns 6/8 quests (previously 4/8), with desk-review relevance 2.92/5 for returned quests, versus 2.00 for a local-model baseline that returns 8/8. Counting missing quests as zero gives 2.19 versus 2.00. These are unblinded agent judgments on the diagnosis set, not a held-out user study. Film/fashion routes still overlap, and metal/game coverage remains incomplete. See [the current benchmark, bad matches and limitations](evaluation/QUEST-BENCHMARK.md).

## Visible scout run and sharing

The main dispatch streams newline-delimited stage events while the work runs. The four visible nodes cover Qloo taste expansion, Tokyo operational checks, geographic optimization and dossier composition. Every status update comes from a tool call or completed planning operation. There are no timed pretend steps. The completed dossier retains the run for inspection. Cancelling aborts the request and bounded provider calls; an interrupted stream cannot become a completed quest.

Taste expansion now makes a bounded cross-domain Insights request, such as music into television or a brand into books. Only returned entities with finite affinity are shown. Tags from those lateral results have weight 0.25, below direct seed metadata at 1.0. The display distinguishes direct seed tags, related genres and related entities. It does not invent a chain of cultural influence. Missing lateral results leave the direct seed route available.

Each estimated walking leg, including the return, is limited to 1.5 km. The entire loop remains capped at 4 km. The planner keeps a selected future date during source-check replanning. Published hours remain schedule evidence, rather than proof of an unscheduled opening.

Share Quest opens a selectable itinerary with a copy action. A separate device-share action is available when supported, so a stalled device share sheet never blocks copying. It shares the actual itinerary, suggested tasks, sourced door notes and Google Maps link. It does not create a public copy of the private app, regenerate a different route from a seed link or transmit anything until the visitor chooses to share. The scout uses deterministic scheduling and authored instructions; a language model is not used to fabricate a dossier.

## Named neighborhood pools

The planner groups live venue coordinates into Shimokitazawa, Shibuya / Daikanyama, Shinjuku / Hatagaya and Yanaka / Ueno. These are discovery districts around catalog anchors, not promises that the whole district fits a walk. A route cannot mix named pools. Other Tokyo areas remain available as local routes. Every leg, including the return, must still satisfy the 1.5 km walking estimate and the full loop must fit within 4 km. A missing third eligible stop produces no route rather than a cross-city filler.

## Original four-metric workbook result

The original Review sheet is already fully scored, with 64 numeric ratings across 16 recommendations. This is an agent desk review of the earlier venue lists, not a human study or an evaluation of the current quest engine. The original condition key differs from the twelve-profile comparison below.

| Original condition | Relevance | Novelty | Coherence | Actionability |
| --- | ---: | ---: | ---: | ---: |
| A: Local-model baseline | 3.63 | 2.75 | 3.63 | 3.00 |
| B: Qloo affinity | 2.75 | 3.00 | 2.75 | 3.00 |

The original four-metric mean is 3.25 for the baseline and 2.875 for Qloo, a descriptive relative difference of -11.5%. It does not support a 35% lift. Actionability was not scored in the separate twelve-profile comparison. Existing scores were preserved rather than rewritten to favor the new implementation.

## Measured ranking comparison

The scored workbook now includes all twelve fictional profiles. Codex rated the top four choices per condition on the original 1–5 rubric. A uses the saved app Qloo ranking with diversity rules. B uses the local model's fresh metadata ranking of the same five-to-eight-place pool, without Qloo affinity or contributor scores. Each candidate receives the same rating wherever it appears within a profile.

| Condition | Relevance | Novelty | Coherence | Mean of three |
| --- | ---: | ---: | ---: | ---: |
| A: App Qloo ranking | 2.56 | 2.17 | 2.56 | 2.43 |
| B: Local-model metadata ranking | 2.79 | 2.33 | 2.79 | 2.64 |
| Descriptive relative difference | -8.2% | -7.1% | -8.2% | -7.9% |

This evaluation does **not** show a 30–40% Qloo gain. It is an unblinded agent desk review on provider-derived candidate pools, not a human study or an independent retrieval benchmark. It excludes live events, drops and scout routes. The original one-profile, eight-per-list comparison is also scored and favours the local-model list on relevance/coherence. See [the complete method and findings](evaluation/RANKING-SCORECARD.md). The practical next test is independent user save/reject feedback after fixing explicit franchise and programme evidence.

## Run locally

Node 22.13+ (tested on Node 24) is required.

1. Install dependencies: `npm run install:ci`.
2. Create an ignored `.dev.vars` containing `QLOO_API_KEY="your-hackathon-key"`.
3. Run `npm run dev`. Open the printed local URL (normally http://127.0.0.1:5173).
4. Run `npm test`, `npx tsc --noEmit`, then `npm run build`.

On Windows, if the system npm shim fails, invoke npm's official JavaScript entrypoint with Node. No credentials belong in shell arguments, Git, browser bundles, or hosting.json. Production uses the secret QLOO_API_KEY configured in Sites.

## What works

- Search real Qloo entities for artists, films, brands and books. User chooses the intended entity; ambiguous names are never silently replaced.
- Live Qloo affinity and explainability across activity-specific Tokyo category searches: games/collectibles, records/live music, art and cafés. Unrestricted-popularity and <=0.8 popularity queries are combined, deduplicated and checked against primary categories and local geography. No fixed 37-ID pool remains. Content is fetched at request time; no cached provider descriptions are bundled.
- Three discovery modes: Familiar prioritizes affinity, Explore and Surprise apply increasing category repetition penalties. All modes retain a 0.55 relative-affinity floor; Explore/Surprise reserve up to two lower-popularity slots where relevant candidates exist. Qloo popularity does not prove a place is a hidden gem. Saves give their category a modest next-search boost; this is app logic, not a claim that Qloo learned an individual preference.
- Area radius and published weekly closure checks before ranking. Date processing uses Asia/Tokyo. Prices are unknown in this source, so every hard budget excludes them.
- Source details, published hours with uncertainty, venue and map links, local saved places and session rejections.
- Explicit loading, error, empty, storage failure and unavailable-events states. Responsive layout and reduced-motion support.

## Honest limits / remaining hackathon work

The private demo now uses personal Fever OAuth. SideQuest's HTTPS callback was accepted through Fever's advertised Dynamic Client Registration endpoint. No company-issued M2M credentials are needed for this flow. A visitor signs into the private Site through ChatGPT and then explicitly clicks Connect Fever. Sites still owns app sign-in; Fever authorizes only event access.

Hosted configuration uses secret runtime values FEVER_OAUTH_CLIENT_ID, FEVER_OAUTH_CLIENT_SECRET, FEVER_OAUTH_REDIRECT_URI and FEVER_SESSION_KEY (a random 32-byte base64url AES key). These are already provisioned for the private demo. Never copy OAuth credentials from the chat client or expose them in source, browser scripts, URLs or logs.

The app uses authorization-code flow with S256 PKCE, a random thirty-minute state cookie, exact registered redirect and MCP resource binding. Tokens are encrypted with AES-GCM in Secure, HttpOnly, SameSite=Lax host-only cookies. The encrypted payload is bound to the signed-in Site user and Site origin. Personal tokens never enter the shared M2M cache. Expired access tokens renew with the provider refresh token; rotated refresh tokens replace the old encrypted value. Connections expire after at most 30 days and require sign-in again. Temporary refresh failures preserve the connection; revoked grants prompt reauthentication. Disconnect attempts provider revocation and clears the browser session.

Routes: /api/fever/start, /api/fever/callback, /api/fever/status and POST /api/fever/disconnect. Callback errors return only a fixed outcome flag; codes and tokens are never echoed into the app page. Status returns only configuration/connection booleans. The reserved Sites /callback route is unchanged.

The combined discovery endpoint isolates provider errors. Unconnected/failed Fever access does not discard Qloo places. Event-only mode does not call Qloo. Listings show source, Tokyo session starts, starting ticket prices and Fever links; users can save/pass events separately. Listings match dates/area. The six-item shortlist favors literal mentions of selected interest names and varies title-derived formats and venues; it is not Qloo event-affinity ranking or endorsement. Venue association uses explicit Fever venue IDs. Neighborhood searches inspect at most three provider-selected venues; city searches request pages 0 and 1 with 36 listings each. Successful pages survive a failure on the other page. Normalization deduplicates and retains up to 72 eligible events before the six-item variety shortlist.

Events lacking explicit matching session times/timezone are excluded. Strict neighborhoods require confirmed coordinates; hard budgets require a known JPY upper ticket price. Starting fares alone do not pass caps. Ticket category, fees and availability require confirmation on Fever. Published session lists are partial.

Verification: client registration and callback acceptance are live-verified. OAuth/MCP, encrypted storage, visitor isolation, state/PKCE checks, refresh, disconnect and provider edge cases have automated tests with fixture credentials/responses. The owner completed personal Fever sign-in and the hosted app returned live Tokyo events on 2026-10-23. Each visitor still needs their own Fever connection; the owner's grant is never shared.

Place search spans the selected activity categories, with useful successful category responses retained if another request fails. These bounded category/popularity samples are not exhaustive Tokyo coverage. Fever remains a separate commercial catalog; independent gigs, neighborhood festivals and small gallery/organizer announcements may be absent. Provider descriptions/weekly hours are not independent verification. There is no guaranteed ticket capacity; place admission prices remain unknown. No generated satisfaction score is shown. Human recommendation quality evaluation, public repository setup, and the hackathon submission are still required. Initial deployment is private; judges need a deliberately public deployment later.

Browser-local saves do not sync between devices or origins. Cached saved records may become stale. No analytics or app accounts are added. Normal discovery sends selected entity IDs to Qloo; map and venue links open external websites.

## Structure

`app/page.tsx` — discovery UI. `app/api/search` — interest lookup. `app/api/discover` — validation and live ranking. `lib/qloo.ts` — provider normalization. `lib/discovery.ts` — deterministic hard filters, modes and Tokyo dates. `lib/fever-client.ts` — M2M authentication and read-only MCP transport. `lib/fever-data.ts` — strict event normalization. `components/fever-events.tsx` — sourced event results. `tests/` — ranking/filter/date/link and Fever contract checks.

## License

MIT for authored code; third-party provider content and trademarks retain their own terms. Self-hosted DM Serif Display and DM Sans are supplied under the bundled SIL OFL files.

Map: on-demand Leaflet/OpenStreetMap view of the current and saved discoveries. Uses only finite coordinates; Fever city listings acquire pins only after an event-ID match in an explicit venue-scoped search. Unresolved locations remain in the list. No geolocation permission or map API key is needed. Tiles load directly in the browser with attribution; no prefetch/offline cache. OAuth connection window is 30 minutes; the personal session still has a 30-day ceiling.

Verified 2026-10-23: personal OAuth completes on the hosted Site. Fever requests use manual redirects and reject non-success responses because the deployed Workers runtime rejects redirect mode "error". A real Workers test covers the authorization-code exchange and MCP initialization/search. City event responses may contain cross-sells: SideQuest excludes listings without Tokyo location evidence (or in-area venue coordinates) and rejects confirmed out-of-area points. A listing's partial session list is not full availability.

## Find my taste / Drops & pop-ups
The default persona path opens a four-step quick taste round: choose a leading persona entity (or the whole mix), answer up to two live Qloo association questions, and choose a real-world activity. `/api/taste/questions` uses live tag Insights; the first answer affects the second request, which changes supported cultural tag types and excludes previous choices, with comic-family duplicates collapsed. Retry preserves the draft; Skip to Tokyo activity aborts the request and clears its error/Retry control. Activity choices are a mix, games/collectibles, records/live music, art/exhibitions or cafés. Review displays the actual answers. Find my Tokyo sidequest explicitly saves the profile/context and automatically searches with current Tokyo filters. One confirmed interest is enough; the cap is eight.

Exact search, lists and screenshots can enter the questions too. The older adaptive media trail remains available for legacy/manual continuation. It starts from exact Qloo search results or explicitly confirmed current interests. A fresh visitor without valid stored search interests enters taste setup with an empty interest list; bundled example interests are not assigned as preferences. Valid stored interests restore normally. Your taste in the navigation always opens setup. Its local layout hides the discovery hero, interest sidebar and explanatory footer, and places the setup in the main content width. `/api/taste/explore` uses live `/v2/insights`, one category or three parallel categories (films/music/games) for the mixed path. Choosing a new positive pick changes the entity signal; choosing its provider-supplied cultural theme adds `signal.interests.tags`. Books have a dedicated branch. No language model is required. Returned descriptions, cultural tags and actual explainability contributions provide context; the app never manufactures a psychological reason for a connection. Results exclude selected, skipped and previous-set IDs; requests are bounded to eight signals, 88 exclusions and six displayed candidates. Partial provider failures retain successful categories; failures preserve the draft and offer retry/different direction.

The UI presents one connection at a time with love, curiosity, pass and unsure reactions, alternatives, current-round undo, editable trail and reflection. Shared metadata across picks is framed as a possible thread, not a personality trait. Only positive picks become place-search interests after explicit apply; curiosity remains labelled separately in the profile. One confirmed interest is sufficient for Tokyo search. Profiles preserve the previous franchise follows and enjoyment fields; independently edited drop follows are never inferred from Qloo affinities. Applied trails are browser-local, can be restored or cleared, and do not sync. Drafts are not saved before Find my Tokyo sidequest; applying also starts discovery. The browser-local profile carries selected anchor IDs, up to two safe cultural tags and activity. Discovery accepts context only when its anchor IDs still belong to the submitted interests. The older `/api/taste` exact-alias route is retained for compatibility.

Discover includes an official drops/pop-ups preview with detail/source/save and browse-all access, including before the first place search. Fever events appear before the place list. `lib/drops.ts` contains eight manually checked official announcements (six products, two Tokyo pop-ups), not a scraper or live stock feed. Evidence distinguishes directly opened pages from official indexed announcements whose pages timed out or were under maintenance. Sources are linked in each expanded row. Some releases are ordinary launches, not limited editions. Gundam retailer stock was sold out when checked. Preorder windows, launch dates and delivery are separate. Discovery hides ended windows and source checks older than 14 days, with no scheduled refresh; maintain the catalog manually before demonstrating later dates. Saved records remain visible with their ended/stale state. Profiles rank explicit follows; pass excludes a franchise unless a collaboration also matches a positive follow. Unfamiliarity is not dislike. Format/location/weekend filters and saved-drop IDs work without Qloo or Fever access. No checkout, notifications or automatic purchase intent.

Source review date: 2026-10-23. Relevant official hosts: Premium Bandai, Pokémon Card Game, Bandai Toys/Tamagotchi, Movic, Tower Records Shibuya, and official retailer Yamada Webcom. Text is limited to paraphrased announcement facts and links; no copyrighted product images are bundled. See the catalog for exact source URLs and evidence limits.

## Paste an announcement link
`/api/announcements` reads public X oEmbed text or bounded HTML/text from the explicit official-host allowlist in `lib/announcement-reader.ts`. Unsupported/blocked sources can be processed from user-pasted text without fetching the link. Only public HTTPS links are accepted; credentials, IP literals/private names and unapproved redirect destinations are rejected. Fetches use manual redirects, timeouts, body-size caps and no visitor credentials. Source HTML is stripped to text and never executed. Images and linked pages are not read.

`lib/announcements.ts` detects candidate source lines for dates, locations, prices and purchase/attendance methods, classifies the announcement, and recognises known Japanese franchise aliases. It does not normalise ambiguous dates or infer absent facts. MyMemory's documented free GET API translates Japanese title/evidence lines, with an aggregate 1,500-character import budget, chunks below 500 UTF-8 bytes, three requests at a time and a small isolate-local cache. Free quota is 5,000 characters/day; original text and a partial/unavailable notice survive quota/network failure. No API key or model is required. Machine translation can mistranslate proper names; title and fields are editable. Only public announcement excerpts should be supplied. Provider: https://mymemory.translated.net/doc/spec.php and https://mymemory.translated.net/doc/usagelimits.php.

`/api/announcements/match` checks a user-confirmed exact cultural target via Qloo `filter.results.entities`, using current search interests and actual explainability contributors. Direct follows/literal mentions remain separate from that affinity. The optional live association is not saved as an endorsement. Imports are browser-local under `sidequest-announcements-v1`, schema validated, limited to 30 and deduplicated by canonical URL. Saved shows imported records independently of curated drops; saving does not book, publish, create map pins, or claim availability. New content requires a fresh source check.

## Taste builder list / screenshot / persona inputs
`components/taste-starter.tsx` is the entry selector at the top of the seed stage. Choose a persona is selected on entry, with Paste names and Use a screenshot as alternatives; Search for one specific interest is a separate disclosure. User selected no-credential operation. It does not fetch Spotify, Last.fm, Reddit or Letterboxd profiles. Users bring chosen names from their own lists or screenshots. `/api/taste/import` accepts up to four bounded names and cultural category hints, makes bounded Qloo searches, isolates failures, and returns candidates without selecting them. Find matches opens Choose the correct matches; each selected entity has an editable Already love / Want to try field. Add these interests merges reviewed list/screenshot picks into the draft without starting exploration or persisting it.

`lib/taste-import.ts` preserves titles such as 1917 and 2001: A Space Odyssey, rejects URLs/usernames/email/interface noise as source names, caps results at four and uses a small cultural-community whitelist. It does not analyse Reddit activity or sensitive communities. The visible personas are Nostalgia & games; Music, design & film; Fantasy & alternative music. Their seed names are shown directly. Try this persona merges verified seeds as Want to try and opens the leading-interest question, without a list, account or intermediate match-review step. Existing matching picks retain their previous feeling; personas do not create drop follows.

Successful starter merges clear earlier reaction undo history, decisions and focus/theme, keeping a stale Undo choice from restoring a trail that predates the import. Existing unrelated picks survive, list/screenshot duplicates use the reviewed feeling, persona duplicates preserve the existing pick, and exceeding eight picks leaves the draft unchanged. Review my interests opens the review stage; Find my Tokyo sidequest applies and persists the profile and automatically runs Tokyo discovery. The round’s leading entity, selected tags and activity reach the place query. Leave for now exits without applying the draft. Live Qloo question errors preserve the draft and offer Retry or Skip to Tokyo activity. Legacy media exploration retains More like these and Change starting interests recovery.

`lib/taste-ocr.ts` dynamically loads Tesseract.js 7.0.0 and self-hosted worker/core/language assets under public/ocr. Source/licence records are in public/ocr/SOURCES.txt and accompanying Apache licences. No image is sent to a server: local file/clipboard -> browser Wasm OCR -> editable text -> user-confirmed name queries only. English and optional Japanese models are supplied. OCR supports visible names rather than visual poster recognition, rejects unsupported/over-8MB/over-16MP inputs, and supports cancellation/retry. Image previews are memory-only object URLs revoked on replacement/unmount. No browser storage is used for raw screenshots or OCR drafts.

## Around Tokyo official feed

`components/official-board.tsx` extends Discover and Drops & pop-ups with a separate feed and adds official snapshots to Saved. `lib/official-events.ts` parses, validates, filters and interleaves sources; `lib/official-scan.ts` fetches them through `GET /api/official`. No additional credentials are required. The current source set is Shindaita FEVER (the live house, separate from Fever tickets), WWW / WWW X, Shibuya PARCO, mograg gallery and MEDICOM TOY.

Each scan checks the current and next month's FEVER/WWW calendars, PARCO event pages 1-3, mograg's current/next shows and MEDICOM's official Atom release feed. Requests use manual redirects, a 10-second timeout and a 1.2 MB response cap per page. Successful pages survive failures elsewhere; source status discloses partial or complete failures. The response retains at most 180 current records. A runtime-isolate cache can reuse a scan for 10 minutes and shares an in-flight request. The HTTP response itself is private/no-store. Refresh sources can therefore return a recent cached check; no background schedule runs.

Discovery uses Japan-local dates, includes ongoing listings through the next 45 days and offers this-weekend/category filters independent of Qloo/Fever controls. It excludes ended listings and checks older than 24 hours. Sources alternate rather than competing for a taste score. Prices, ticket capacity, stock, store allocation, gallery closures and entry rules still require checking the official announcement. The parsers cover known page formats and can miss announcements or fail when publishers change markup. There is no complete-coverage claim.

Browser-local official saves use `sidequest-official-saves-v1`, are schema validated and capped at 100 snapshots. Ended/stale saves stay visible and removable. The importer handoff prefills the source URL for the existing translation, editing and optional Qloo-match flow. Its official-host allowlist now includes the live houses, gallery and MEDICOM sources. MEDICOM blog imports read the exact URL-matched entry from the official Atom feed because the storefront page exceeds the normal bounded reader; if the entry has left that feed, the user can paste source text. External Google-indexed X and native X searches are links only. SideQuest does not crawl X timelines or run unattended searches.

## Compare fictional tastes

Open `/taste-lab` to choose two of 12 fictional samples and compare live Qloo places. `POST /api/taste/sample` accepts a listed profile ID and discovery mode, resolves exact cultural names/types, and calls the main discovery handler with fixed Across Tokyo, today, flexible-budget and places-only conditions. It supplies no visitor cookies, saved-category boosts or rejected places and does not call Fever. Unresolved seeds fail explicitly. The six suggested contrasts keep activity constant; the UI warns when manually selected activities differ.

The page compares complete place-ID sets, shows four results per side initially and can expand both to eight. Selection changes/cancellation discard stale results; a failed side leaves the other available. Would save / Maybe / Not for me ratings use `sidequest-sample-ratings-v1`, separate from personal taste and saves. Clicking a selected rating removes it. Export downloads ratings as JSON; Clear sample ratings removes the stored votes. Storage failure is disclosed as page-only persistence.

Run `node --experimental-strip-types scripts/evaluate-tastes.mjs` against the local preview for a repeatable live check. See [evaluation/WORKFLOWS.md](evaluation/WORKFLOWS.md) for the UX drive record, Humanizer copy method, optional-reader contract and limits. The baseline and latest JSON files contain real dated provider results for fictional inputs. On 23 October 2026, category expansion increased collecting results from six to eight; the two collecting contrasts changed from 6/6 identical sets to five and four shared places across eight-place lists. The Starbucks/Taylor Swift cafe associations remain questionable. Counts, category variety, popularity, returned contributors and overlap do not establish a human quality pass. Events, official feeds and shopping fit are outside this benchmark.

## Optional PullMD connection

No hosted PullMD endpoint is configured. To connect an externally deployed instance later, set server-only `PULLMD_URL` to its HTTPS base URL and optionally `PULLMD_BEARER_TOKEN` if the instance accepts bearer authentication. Leave them blank to retain the direct announcement reader. `.env.example` documents the variables; local preview reads ignored `.dev.vars`.

`lib/pullmd-reader.ts` calls the service's `api` endpoint with plain-text output, `frontmatter=false`, `render=skip` and `comments=false`. It uses manual redirects, a 12-second timeout and a 150,000-byte response cap, then retains at most 12,000 characters of stripped text. Only the existing supported official-host path uses it. Pasted text, X oEmbed, unsupported hosts and MEDICOM's exact Atom-entry path bypass it. Failure falls back to direct official-page reading with a source notice. Contract and failure fixtures cover this path; a real hosted service comparison remains untested.

## Current quest benchmark

| Condition | Quests / eight seeds | Relevance on returned quests | Missing quests as zero |
| --- | ---: | ---: | ---: |
| Previous Qloo quest engine | 4 | 2.50 | 1.25 |
| Fixed Qloo quest engine | 6 | 2.92 | 2.19 |
| Local-model baseline with current planner | 8 | 2.00 | 2.00 |

Codex desk ratings, 1–5. The last column is a separate coverage penalty. No human-quality or novelty uplift is established. See [method and per-profile routes](evaluation/QUEST-BENCHMARK.md) and [auditable results](evaluation/quest-benchmark-2026-10-25.json). Historical workbook results above remain unchanged.

## Event-first quests and explicit direction

The current app asks one optional activity question after resolving a seed, and any returned route must contain that activity. Matching dated exhibitions and pop-ups affect selection before route planning. Separate upcoming event/release leads can appear outside the walk. A single useful find remains visible when no compatible loop fits.

Stale catalogs refresh on demand, and expanded-source events now receive exact artist reconciliation. A live check recovered 189 records across 13 sources. Artist graph associations cannot qualify conflicting genres; the repaired live check keeps DEXCORE for Slayer and rejects it for Nujabes, MUJI and the other tested seeds. These are functional findings, not a new relevance uplift claim. See [the repair review and remaining gaps](evaluation/QUEST-EVENT-REPAIR.md). The historical benchmark above retains its original conditions and scores.

## Catalog population and shared taste

The event browser now opens on the saved catalog, with category counts and editable named interests. Dated Bandai products, MEDICOM preorders, Animate Tokyo pop-ups and Midtown events join the existing source readers. Recent releases retain their actual launch dates; expired buying windows are removed. The legacy drops view reads the shared catalog. See [the population and matching review](evaluation/CATALOG-POPULATION.md) and [the live contrast audit](evaluation/catalog-population-local.json). These checks do not establish a human-rated recommendation uplift.
