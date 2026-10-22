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
