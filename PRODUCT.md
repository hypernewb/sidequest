# SideQuest

Tokyo cultural discovery for the Qloo Agentic Hackathon. User supplied the SideQuest PRD and explicitly requested building the app after feasibility research.

## Confirmed product
- English web app for Tokyo residents aged 18+.
- Three to eight interests, Tokyo area, dates, budget, places/events/both.
- Familiar / Explore / Surprise dial changes relevant recommendations.
- Small shortlist with grounded explanations, provenance, details, source links, save and reject.
- No account requirement within the app. Saves stay on this browser; rejection lasts this session.
- Qloo API key exists and its use is authorized. It must remain server-side.
- Hosted personal Fever OAuth and live event retrieval are verified. Keep per-visitor authorization separate from chat access.
- Event research is not licensed production inventory. Do not publish it as live event data.
- Unknown prices fail a hard budget cap. No invented IDs, availability, satisfaction percentages, or sources.

## Implementation decisions delegated by build request
Vinext/React with a server API on Sites. Private first deployment. Direct code implementation, no generated visual mockup required. Live Qloo places provide the useful first flow. Events get an honest unavailable state until a deployable provider is configured. User can still choose dates for visit planning; opening hours must be checked with venue.

## Visual direction
Tokyo independent city guide: warm paper, strong red ink, oversized editorial serif, compact sans-serif interface, open ruled lists. The app is a practical cultural field guide, not a booking marketplace. A geometric taste compass explains moving from familiar to unexpected.

## Still unverified
Event reuse rights for broader distribution, public launch approval, human taste-quality evaluation, public submission repository.

## Fever integration update
Server-side M2M adapter, event session/price normalization, separate event results and browser-local event saves are implemented. The legacy M2M path is retained in the adapter; the deployed private demo instead uses verified personal OAuth. No personal chat OAuth credentials are reused. Event listings are date/area matches rather than Qloo-ranked recommendations.

## Personal Fever demo decision
User explicitly chose personal Fever sign-in for a private demo. Register SideQuest as its own OAuth client; user completes sign-in, no company M2M credentials. Preserve Sites/ChatGPT app authentication. Provider tokens stay encrypted in host-only HttpOnly cookies bound to that Site user, with PKCE/state validation, refresh, disconnect and a 30-day ceiling. Read live event data only through that visitor connection.

2026-10-23: User requested a map and live Tokyo event verification. Add an optional discovery map using existing visual tokens, source-derived coordinates, separate place/event pins, and an accessible location list. Keep unmapped events visible; never guess venue coordinates.

## Taste discovery and official drops
User requested deeper self-discovery because the fixed franchise quiz did not help them understand or uncover interests. Replace it with optional adaptive Qloo exploration: exact cultural entity search, one live connection at a time, love versus curiosity reactions, and contextual questions using Qloo-supplied genres, moods and styles. New positive choices or an explicitly chosen theme change the next Insights request; users can branch into films, music, games or books, or combine the trail. Reflection may identify shared metadata across confirmed picks, with no personality diagnosis or invented explanation of personal motives. Unfamiliarity and dislike remain distinct and neither is sent as a negative entity signal. Eight picks maximum, remove controls, current-round undo, explicit apply, browser-local persistence with legacy profile compatibility. Favourites and curiosity both become Tokyo search interests when applied; Tokyo place searches still require three. Official drop follows are independently editable, never inferred from a related work.

Drops use a small, manually checked official-announcement catalog, with source links, source-access caveats, Japan-local dates, release versus preorder deadline versus delivery, prices where supplied, restrictions and unknown stock. Franchises marked pass leave discovery. Saved records retain ended/stale status. No purchases, affiliate claims, notifications, background updates or implied overseas shipping. Announcements expire from discovery when their window ends or source check is older than 14 days. Taste and saved-drop IDs stay in browser storage, with edit/clear controls. Existing Qloo/Fever places/events and map remain available.
## Announcement imports

Users can paste a public announcement link from Drops & pop-ups, inspect candidate dates, place, price and attendance/purchase instructions, correct the result, compare it with their taste and save it separately from the editor-checked catalog. Public X posts use official oEmbed without user cookies; an allowlist of official release sites supports direct reading. Other hosts, blocked sources and image-only announcements require pasted source text. No login bypass, OCR, background monitoring, recursive link crawling, bookings or inferred coordinates.

Japanese title and evidence excerpts use MyMemory machine translation, with original wording retained. The free anonymous provider quota is 5,000 characters/day; each import submits up to 1,500 characters, split into bounded UTF-8 requests. Full short announcements are included when budget permits; longer pages translate selected evidence. Partial/failed translation stays explicit and preserves the original. Names and date phrasing require human review. Extraction is deterministic source-line detection, not a language model's semantic interpretation. It never invents a missing year, timezone, stock or admission price.

Direct matches identify positive explicit franchise follows or literal mentions of current interests. The user may confirm an exact cultural entity for a live Qloo Insights association with up to eight current search interests. This does not verify an announcement or establish product suitability. Qloo match results are displayed during import, not persisted as a permanent endorsement. Up to 30 imported records stay in browser-local storage, deduplicated by canonical source URL; they can be updated or removed from Saved. Imported records retain source type, check date, Japanese evidence, English notes and edits, and remain labelled unverified.

## Bring-your-taste starters
The user chose the credential-free implementation: screenshots, pasted lists and editable demo personas. The top of the taste builder offers those three paths. Lists can contain chosen music artists, favourite films, mixed cultural names, or recognised cultural Reddit community names. Profile/playlist URLs and usernames alone are not fetched. Reddit intake uses a small explicit cultural whitelist and ignores other communities; community membership is not inferred, and example film seeds are labelled examples. Up to four names per lookup return exact Qloo candidates for human confirmation. Each seed is labelled Already love or Want to try before it is merged into the existing eight-pick draft. No unconfirmed results or shopping follows are silently applied.

Screenshots use self-hosted Tesseract.js OCR in the browser, with English and optional Japanese language data. Images stay on-device, are not uploaded or persisted, and may be chosen through a file control or pasted into the focused screenshot area. Limits: PNG/JPEG/WebP, 8 MB and 16 million pixels. OCR reads visible text, not poster/album artwork identity. Users correct the extracted text before submitting selected names to Qloo. Cancellation, retry, no-text and invalid-image recovery preserve the list/manual path. These starters join the existing explicit-apply taste persistence flow.

Three editable demo personas—Pocket worlds, Quiet city wanderer, Strange worlds/open ears—use verified cultural UUIDs and start as curiosity rather than invented existing favourites. They are exploration shortcuts, not personality classes or demographic predictions. Existing preferences survive merging; exceeding eight interests requires removing picks or importing fewer names.
