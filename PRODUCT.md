# SideQuest

Tokyo cultural discovery for the Qloo Agentic Hackathon. User supplied the SideQuest PRD and explicitly requested building the app after feasibility research.

## Confirmed product
- English web app for Tokyo residents aged 18+.
- Three to eight interests, Tokyo area, dates, budget, places/events/both.
- Familiar / Explore / Surprise dial changes relevant recommendations.
- Small shortlist with grounded explanations, provenance, details, source links, save and reject.
- No account requirement within the app. Saves stay on this browser; rejection lasts this session.
- Qloo API key exists and its use is authorized. It must remain server-side.
- Fever MCP is connected in this chat, but hosted access is not established. Do not pretend the hosted app has that access.
- Event research is not licensed production inventory. Do not publish it as live event data.
- Unknown prices fail a hard budget cap. No invented IDs, availability, satisfaction percentages, or sources.

## Implementation decisions delegated by build request
Vinext/React with a server API on Sites. Private first deployment. Direct code implementation, no generated visual mockup required. Live Qloo places provide the useful first flow. Events get an honest unavailable state until a deployable provider is configured. User can still choose dates for visit planning; opening hours must be checked with venue.

## Visual direction
Tokyo independent city guide: warm paper, strong red ink, oversized editorial serif, compact sans-serif interface, open ruled lists. The app is a practical cultural field guide, not a booking marketplace. A geometric taste compass explains moving from familiar to unexpected.

## Still unverified
Hosted Fever credentials, event reuse rights, public launch approval, human taste-quality evaluation, public submission repository.

## Fever integration update
Server-side M2M adapter, event session/price normalization, separate event results and browser-local event saves are implemented. Live activation still requires Fever-issued FEVER_CLIENT_ID, FEVER_CLIENT_SECRET and FEVER_AUDIENCE with mcp:service. No personal chat OAuth credentials are reused. Event listings are date/area matches rather than Qloo-ranked recommendations.

## Personal Fever demo decision
User explicitly chose personal Fever sign-in for a private demo. Register SideQuest as its own OAuth client; user completes sign-in, no company M2M credentials. Preserve Sites/ChatGPT app authentication. Provider tokens stay encrypted in host-only HttpOnly cookies bound to that Site user, with PKCE/state validation, refresh, disconnect and a 30-day ceiling. Read live event data only through that visitor connection.

2026-10-23: User requested a map and live Tokyo event verification. Add an optional discovery map using existing visual tokens, source-derived coordinates, separate place/event pins, and an accessible location list. Keep unmapped events visible; never guess venue coordinates.
