# SideQuest

Tokyo cultural discovery for the Qloo Agentic Hackathon. User supplied the SideQuest PRD and explicitly requested building the app after feasibility research.

## Confirmed product
- English web app for Tokyo residents aged 18+.
- One to eight confirmed interests, Tokyo area, dates, budget, places/events/both.
- Familiar / Explore / Surprise dial changes relevant recommendations.
- Small shortlist with grounded explanations, provenance, details, source links, save and reject.
- No account requirement within the app. Saves stay on this browser; rejection lasts this session.
- Qloo API key exists and its use is authorized. It must remain server-side.
- Hosted personal Fever OAuth and live event retrieval are verified. Keep per-visitor authorization separate from chat access.
- Event research is not licensed production inventory. Do not publish it as live event data.
- Unknown prices fail a hard budget cap. No invented IDs, availability, satisfaction percentages, or sources.

## Implementation decisions delegated by build request
Vinext/React with a server API on Sites. Private first deployment. Direct code implementation, no generated visual mockup required. Live Qloo places provide the useful first flow. Events use each visitor’s separate personal Fever connection and show an actionable connection/unavailable state when needed. User can still choose dates for visit planning; opening hours must be checked with venue.

## Visual direction
Tokyo independent city guide: warm paper, strong red ink, oversized editorial serif, compact sans-serif interface, open ruled lists. The app is a practical cultural field guide, not a booking marketplace. A geometric taste compass explains moving from familiar to unexpected.

## Still unverified
Event reuse rights for broader distribution, public launch approval, human taste-quality evaluation, public submission repository.

## Fever integration update
Server-side M2M adapter, event session/price normalization, separate event results and browser-local event saves are implemented. The legacy M2M path is retained in the adapter; the deployed private demo instead uses verified personal OAuth. No personal chat OAuth credentials are reused. Event listings must match dates/area. A bounded shortlist favors literal mentions of selected interest names and varies title-derived formats and venues; it is not Qloo event-affinity ranking.

## Personal Fever demo decision
User explicitly chose personal Fever sign-in for a private demo. Register SideQuest as its own OAuth client; user completes sign-in, no company M2M credentials. Preserve Sites/ChatGPT app authentication. Provider tokens stay encrypted in host-only HttpOnly cookies bound to that Site user, with PKCE/state validation, refresh, disconnect and a 30-day ceiling. Read live event data only through that visitor connection.

2026-10-23: User requested a map and live Tokyo event verification. Add an optional discovery map using existing visual tokens, source-derived coordinates, separate place/event pins, and an accessible location list. Keep unmapped events visible; never guess venue coordinates.

## Taste discovery and official drops
User requested deeper self-discovery because the fixed franchise quiz did not help them understand or uncover interests. Replace it with optional adaptive Qloo exploration: exact cultural entity search, one live connection at a time, love versus curiosity reactions, and contextual questions using Qloo-supplied genres, moods and styles. New positive choices or an explicitly chosen theme change the next Insights request; users can branch into films, music, games or books, or combine the trail. Reflection may identify shared metadata across confirmed picks, with no personality diagnosis or invented explanation of personal motives. Unfamiliarity and dislike remain distinct and neither is sent as a negative entity signal. Eight picks maximum, remove controls, current-round undo, explicit apply, browser-local persistence with legacy profile compatibility. Favourites and curiosity both become Tokyo search interests when applied; Tokyo search requires at least one confirmed interest. Official drop follows are independently editable, never inferred from a related work.

Drops use a small, manually checked official-announcement catalog, with source links, source-access caveats, Japan-local dates, release versus preorder deadline versus delivery, prices where supplied, restrictions and unknown stock. Franchises marked pass leave discovery. Saved records retain ended/stale status. No purchases, affiliate claims, notifications, background updates or implied overseas shipping. Announcements expire from discovery when their window ends or source check is older than 14 days. Taste and saved-drop IDs stay in browser storage, with edit/clear controls. Existing Qloo/Fever places/events and map remain available.
## Announcement imports

Users can paste a public announcement link from Drops & pop-ups, inspect candidate dates, place, price and attendance/purchase instructions, correct the result, compare it with their taste and save it separately from the editor-checked catalog. Public X posts use official oEmbed without user cookies; an allowlist of official release sites supports direct reading. Other hosts, blocked sources and image-only announcements require pasted source text. No login bypass, OCR, background monitoring, recursive link crawling, bookings or inferred coordinates.

Japanese title and evidence excerpts use MyMemory machine translation, with original wording retained. The free anonymous provider quota is 5,000 characters/day; each import submits up to 1,500 characters, split into bounded UTF-8 requests. Full short announcements are included when budget permits; longer pages translate selected evidence. Partial/failed translation stays explicit and preserves the original. Names and date phrasing require human review. Extraction is deterministic source-line detection, not a language model's semantic interpretation. It never invents a missing year, timezone, stock or admission price.

Direct matches identify positive explicit franchise follows or literal mentions of current interests. The user may confirm an exact cultural entity for a live Qloo Insights association with up to eight current search interests. This does not verify an announcement or establish product suitability. Qloo match results are displayed during import, not persisted as a permanent endorsement. Up to 30 imported records stay in browser-local storage, deduplicated by canonical source URL; they can be updated or removed from Saved. Imported records retain source type, check date, Japanese evidence, English notes and edits, and remain labelled unverified.

## Bring-your-taste starters
The user chose the credential-free implementation: screenshots, pasted lists and editable demo personas. Visitors without valid stored search interests start in taste setup with no example interests assigned to them. Your taste remains available in the main navigation. The focused setup shows one title, defaults to Choose a persona, and keeps Paste names and Use a screenshot alongside it; single-entity search is in a disclosure. The duplicate interest sidebar, discovery hero and explanatory footer are hidden while editing taste.

Lists can contain chosen music artists, favourite films, mixed cultural names, or recognised cultural Reddit community names. Profile/playlist URLs and usernames alone are not fetched. Reddit intake uses a small explicit cultural whitelist and ignores other communities; community membership is not inferred, and example film seeds are labelled examples. Up to four names per lookup return exact Qloo candidates for human confirmation. Each chosen match is labelled Already love or Want to try before Add these interests merges it into the existing eight-pick draft. No unconfirmed lookup results or shopping follows are silently applied.

Screenshots use self-hosted Tesseract.js OCR in the browser, with English and optional Japanese language data. Images stay on-device, are not uploaded or persisted, and may be chosen through a file control or pasted into the focused screenshot area. Limits: PNG/JPEG/WebP, 8 MB and 16 million pixels. OCR reads visible text, not poster/album artwork identity. Users correct the extracted text before submitting selected names to Qloo. Cancellation, retry, no-text and invalid-image recovery preserve the list/manual path. These starters join the existing explicit-apply taste persistence flow.

Three editable demo personas—Nostalgia & games; Music, design & film; Fantasy & alternative music—show their cultural seeds and use verified UUIDs. Try this persona adds its seeds as Want to try and opens a four-step quick taste round: choose a leading entity or the whole mix, answer up to two live Qloo tag questions, and choose a Tokyo activity. The second tag question uses the first answer, changes cultural tag types and deduplicates previously offered associations. Questions can be skipped to the activity; provider failure offers retry or skip. Existing picks and their feelings survive a persona merge; exceeding eight interests leaves the draft unchanged and asks the user to remove picks. These are exploration shortcuts, not personality classes or demographic predictions. Review shows the actual leading interest, selected tags, activity and editable interests. Find my Tokyo sidequest saves the draft and discovery context in this browser, applies it and automatically runs Tokyo discovery with the current filters. Manual/list/screenshot picks can enter the same questions; the earlier media trail remains available for legacy/manual continuation. Removing a context anchor clears that context. Leaving before apply does not persist the draft.

Place discovery searches Qloo activity categories rather than a fixed 37-ID universe. Games/collectibles, records/live music, art and cafés each use verified category tags, unrestricted-popularity and lower-popularity queries, deduplication and local category/geographic checks. Explore/Surprise reserve lower-popularity results only when relevant candidates exist; no hidden-gem guarantee is made. Unknown prices still fail hard budget caps.

Discover previews the official drops catalog before or alongside results, with detail/source/save and a browse-all path. Fever events appear before the place list. City event searches request two pages of 36, retain a successful page if the other fails, normalize/deduplicate up to 72 eligible records, then select six using literal-interest matches and format/venue variety. Provider city results can include out-of-Tokyo cross-sells; strict location/session/budget eligibility remains in force. Fever does not comprehensively cover independent local events.

## Around Tokyo official sources

Around Tokyo is a separate official-source feed in Discover and Drops & pop-ups. Visitors can browse it without setting taste or connecting Fever. It reads dated announcements from Shindaita FEVER, WWW / WWW X, Shibuya PARCO, mograg gallery and MEDICOM TOY. Shindaita FEVER is a Tokyo live house, distinct from the Fever ticket service. Coverage includes Tokyo gigs, exhibitions and pop-ups plus Japan collector releases. It is a bounded source sample, not complete Tokyo coverage.

The feed has its own category and next-45-days / this-weekend filters. Qloo/Fever area, budget and date controls do not filter it. Sources alternate in the list so busy gig calendars do not bury smaller art and release feeds. Eight listings appear initially, with more on request. Each row links its official announcement and exposes source wording, date range, check time and ticket/stock uncertainty. Source failures and partially readable calendars remain visible. Literal mentions of current interests can be labelled; the feed has no Qloo affinity ranking. Venue links open directions without adding inferred map pins.

Users can save up to 100 validated announcement snapshots separately in this browser. Saved retains ended dates and checks older than 24 hours with explicit status; discovery excludes them. Read, translate & match to my taste opens the existing announcement importer with the source URL filled in. That flow retains its editable Japanese translation and optional user-confirmed Qloo association. MEDICOM imports match the exact announcement URL in its official Atom feed. Public indexed Google and native X search links support further research; useful posts can be pasted into the importer. No X timeline crawler, background schedule, stock guarantee or automatic booking is added.

## Taste comparison and quality review

The user approved a driven UX review, a Humanizer copy pass and contrasting fictional taste profiles. `/taste-lab` compares two of 12 samples without applying them to the visitor's taste. Each sample resolves its cultural names and entity types exactly through Qloo, then calls the existing discovery route with places only, Across Tokyo, today and a flexible budget. Missing exact matches stop that sample rather than substituting another entity. Suggested contrasts keep the requested activity the same; choosing different activities is disclosed as an additional difference.

The comparison starts only on request, reports shared places across the complete returned lists and initially shows four results per side, with a shared expansion control for up to eight each. Each result can be rated Would save, Maybe or Not for me. Ratings have their own browser storage, export and clear controls. Sample requests do not forward visitor cookies or call Fever, and the comparison does not change personal interests or saved places. Counts, returned contributors, popularity and overlap are diagnostics, not a taste score or evidence of satisfaction.

Live observations on 23 October 2026 are retained in `evaluation/baseline.json` and `evaluation/latest.json`. Adding omitted hobby/arcade categories and accepting relevant primary Game store/CD store categories expanded collecting results from six to eight. The two collecting contrasts went from identical six-place sets to five and four shared places respectively across eight-place lists. This establishes more variety only. The Starbucks/Taylor Swift sample still returned questionable maid/character cafe associations; human recommendation quality remains unverified. `evaluation/WORKFLOWS.md` records the driven UX checks, copy method and remaining evaluation limits.

## Optional announcement reader

The user requested preparation for an optional PullMD connection and explicitly supplied no hosted endpoint. The connection remains inactive. A future server-configured HTTPS service can read supported public official announcement pages through bounded static extraction, with a direct-reader fallback and a visible fallback notice. Pasted text, X posts, unsupported hosts and MEDICOM's dedicated official-feed path remain outside that connection. This adds no browser rendering, background monitoring or broader source coverage.

## Activity-first opportunity discovery
The main route now uses an activity, relevant direction and practical window/format/price choices. Optional exact cultural interests preserve favourite versus curious influence. Places, available Fever sessions, official calendars and current release catalog entries share eligibility, deduplication and evidence-based ranking in /api/opportunities. Coverage gaps and activity-only matches are explicit. The prior experience and its browser saves remain at /classic. See evaluation/OPPORTUNITY-PIPELINE.md for verification and limitations.

## v16 — Official event detail evidence
Full-page enrichment and translated excerpts now inform the outing recommendations. Added Cotton Club calendars and Tower Records Shibuya pop-up announcements. See evaluation/EVENT-ENRICHMENT.md for source coverage, verification and limits.

## v17 — Persistent catalog and verified performers
D1 catalog stores official source records, translations, source health and exact Qloo artist matches. Added U.F.O.CLUB, Taka Ishii Gallery and Sanrio weekly official release announcements. Unattended updater contract: evaluation/CATALOG-REFRESH.md. Refresh schedule is linked in Sites after publishing; stored translations are produced by the scheduled task model, with the public translation service as an optional on-demand fallback.

## v18 — Expanded Tokyo source coverage
Added six direct official/publisher readers, a source registry with explicit access gaps, and the prepared Connpass v2 adapter. Source refresh groups alternate automatically. See evaluation/CATALOG-REFRESH.md.

## v19 — Contrasting taste audit and English catalog
Corrected activity leakage, verified Qloo genre hydration, bounded source diversity and opt-in activity-only alternatives. Added persisted English card fields and guarded translation envelopes for future refreshes. See evaluation/CONTRASTING-TASTE-AUDIT.md.

## v20 — Quests and a measured ranking review
The main entry accepts one cultural seed and returns one afternoon quest with a title, suggested actions, timed nearby stops and a walking-map link. Optional date and price settings remain folded away. The scout checks fresh Qloo coordinates, weekly hours and Tokyo time, and refuses to pad an unverified route. The earlier catalog is available at `/explore`. The twelve-profile local-model comparison and original workbook review are scored, with limitations and negative results retained in evaluation/RANKING-SCORECARD.md. The benchmark does not evaluate quest quality.


## Event-first entry, 28 October 2026

The home route now prioritises time-limited opportunities, not permanent locations. It uses the official persistent event catalog and new Bandcamp, hololive order-period and Steam festival adapters. `/api/moments` excludes ordinary stock listings, expired windows and permanent places, and separates online access from physical retailer announcements. The visitor can browse immediately, optionally expand one exact-name taste input, filter events versus timed drops, choose online-only or Tokyo in-person access, order by deadlines and save items locally. Qloo hydrates interests and artist metadata; specific evidence outranks broad genre adjacency. No popularity or hype score is invented. `/quests` retains the walking scout and closure replanning. The current paper, red and editorial type style remains. See evaluation/EVENT-FIRST.md for the dated functional check and limits.

## Adaptive taste round and Stumble

The user requested three GPT-6.1 Sol workers to deepen Qloo matching, build a one-minute game-like interview with optional personas, retain earlier choices and add Stumble discovery. `/taste` provides six quick rounds and explicit review/apply. No-name visitors choose concrete scenes and react to checked catalog entries. Named interests, optional transparent persona anchors and positive reactions with resolved cultural entities can produce live Qloo follow-up tags. Drafts remain separate from applied browser taste, support undo/skip/resume/reset, and keep provider lookups bounded so a slow request can be skipped.

The interview, main feed and `/stumble` share bounded tags, reactions, access and price context. Legacy taste writes retain that context. Persona works are question anchors rather than silently confirmed favourites. Unknown, price, access and format reactions remain distinct from taste. Source-based editorial directions are labelled separately from Qloo evidence.

Stumble shows one actual timed opportunity, with source, dates, practical details and personal/adjacent/wildcard connection wording. Next affects a bounded no-repeat round without permanently dismissing the listing. Save/More like this guide later discovery; explicit passes can hide a listing with a reason. Saved finds use the main feed's existing collection.

Qloo candidate matching now retains affinity and contributor evidence, handles bounded batches beyond the old first-fifty limit, resolves source-named cultural entities across domains and rejects ambiguous identities. Positive reactions use server-known catalog identities rather than accepting browser-supplied affiliations. Exact factual matches, cultural associations, editorial matches and unknown coverage stay inspectable. Verification measures behavior and contrasts, not a claimed human satisfaction lift.

## Visual comparisons update

The entry at /stumble and the /taste route now use real visual comparisons instead of the old six-round interview. The first choice is useful immediately, and the next pair adapts locally. Current-session choices remain distinct from explicit kept interests. Single-find mode remains available. See evaluation/DISCOVERY-PLAY.md for scope and verification. The established paper, red and editorial style remains.

## Map, day planning and visit ratings, 30 October 2026

The home feed adds All finds, Map & plan and Been & rated controls, a grouped Google map with fallback, and a browser-local day of up to five ordered stops with a date, optional times and Google route links. Visitors can record one 1-to-5 enjoyment rating, edit it and forget visit history. Quest stops share these ratings and offer an explicit action to replace My day. Replacement removes the previous planned intent while preserving actual visits. Positive ratings contribute trusted server-known identities to Qloo; negative feedback remains bounded within local and curated ranking. The existing paper, red, moss and serif system remains. The finish reviewer disposition is ship, with browser and automated checks verified in the implementation task. See `.impeccable/journey-finish.md` for review evidence and documentation drift. No human satisfaction or benchmark lift is established.
