# SideQuest

Taste-led Tokyo discovery for the Qloo Agentic Hackathon. Vinext/React app with a server-side Qloo adapter. No language model or second API key is required to run the current experience.

## Run locally

Node 22.13+ (tested on Node 24) is required.

1. Install dependencies: `npm run install:ci`.
2. Create an ignored `.dev.vars` containing `QLOO_API_KEY="your-hackathon-key"`.
3. Run `npm run dev`. Open the printed local URL (normally http://127.0.0.1:5173).
4. Run `npm test`, `npx tsc --noEmit`, then `npm run build`.

On Windows, if the system npm shim fails, invoke npm's official JavaScript entrypoint with Node. No credentials belong in shell arguments, Git, browser bundles, or hosting.json. Production uses the secret QLOO_API_KEY configured in Sites.

## What works

- Search real Qloo entities for artists, films, brands and books. User chooses the intended entity; ambiguous names are never silently replaced.
- Live Qloo affinity and explainability for 37 previously validated Tokyo cultural-place IDs. Content is fetched at request time; no cached provider descriptions are bundled.
- Three discovery modes: Familiar prioritizes affinity, Explore and Surprise apply increasing category repetition penalties. All modes retain an affinity floor. Saves give their category a modest next-search boost; this is app logic, not a claim that Qloo learned an individual preference.
- Area radius and published weekly closure checks before ranking. Date processing uses Asia/Tokyo. Prices are unknown in this source, so every hard budget excludes them.
- Source details, published hours with uncertainty, venue and map links, local saved places and session rejections.
- Explicit loading, error, empty, storage failure and unavailable-events states. Responsive layout and reduced-motion support.

## Honest limits / remaining hackathon work

The private demo now uses personal Fever OAuth. SideQuest's HTTPS callback was accepted through Fever's advertised Dynamic Client Registration endpoint. No company-issued M2M credentials are needed for this flow. A visitor signs into the private Site through ChatGPT and then explicitly clicks Connect Fever. Sites still owns app sign-in; Fever authorizes only event access.

Hosted configuration uses secret runtime values FEVER_OAUTH_CLIENT_ID, FEVER_OAUTH_CLIENT_SECRET, FEVER_OAUTH_REDIRECT_URI and FEVER_SESSION_KEY (a random 32-byte base64url AES key). These are already provisioned for the private demo. Never copy OAuth credentials from the chat client or expose them in source, browser scripts, URLs or logs.

The app uses authorization-code flow with S256 PKCE, a random ten-minute state cookie, exact registered redirect and MCP resource binding. Tokens are encrypted with AES-GCM in Secure, HttpOnly, SameSite=Lax host-only cookies. The encrypted payload is bound to the signed-in Site user and Site origin. Personal tokens never enter the shared M2M cache. Expired access tokens renew with the provider refresh token; rotated refresh tokens replace the old encrypted value. Connections expire after at most 30 days and require sign-in again. Temporary refresh failures preserve the connection; revoked grants prompt reauthentication. Disconnect attempts provider revocation and clears the browser session.

Routes: /api/fever/start, /api/fever/callback, /api/fever/status and POST /api/fever/disconnect. Callback errors return only a fixed outcome flag; codes and tokens are never echoed into the app page. Status returns only configuration/connection booleans. The reserved Sites /callback route is unchanged.

The combined discovery endpoint isolates provider errors. Unconnected/failed Fever access does not discard Qloo places. Event-only mode does not call Qloo. Listings show source, Tokyo session starts, starting ticket prices and Fever links; users can save/pass events separately. Listings are date/area matches, not Qloo-ranked or Qloo-endorsed. Venue association uses explicit Fever venue IDs. Neighborhood searches inspect at most three provider-selected venues; city searches inspect one page of 36 listings.

Events lacking explicit matching session times/timezone are excluded. Strict neighborhoods require confirmed coordinates; hard budgets require a known JPY upper ticket price. Starting fares alone do not pass caps. Ticket category, fees and availability require confirmation on Fever. Published session lists are partial.

Verification: client registration and callback acceptance are live-verified. OAuth/MCP, encrypted storage, visitor isolation, state/PKCE checks, refresh, disconnect and provider edge cases have automated tests with fixture credentials/responses. Final live personal event access requires the owner to complete Fever's sign-in. These tests and a successful deployment are not a claim that the owner has authorized Fever yet.

Only the 37 selected IDs are searched. This is not exhaustive Tokyo coverage. Provider descriptions/weekly hours are not independent verification. There is no guaranteed ticket capacity; place admission prices remain unknown. No generated satisfaction score is shown. Human recommendation quality evaluation, public repository setup, and the hackathon submission are still required. Initial deployment is private; judges need a deliberately public deployment later.

Browser-local saves do not sync between devices or origins. Cached saved records may become stale. No analytics or app accounts are added. Normal discovery sends selected entity IDs to Qloo; map and venue links open external websites.

## Structure

`app/page.tsx` — discovery UI. `app/api/search` — interest lookup. `app/api/discover` — validation and live ranking. `lib/qloo.ts` — provider normalization. `lib/discovery.ts` — deterministic hard filters, modes and Tokyo dates. `lib/fever-client.ts` — M2M authentication and read-only MCP transport. `lib/fever-data.ts` — strict event normalization. `components/fever-events.tsx` — sourced event results. `tests/` — ranking/filter/date/link and Fever contract checks.

## License

MIT for authored code; third-party provider content and trademarks retain their own terms. Self-hosted DM Serif Display and DM Sans are supplied under the bundled SIL OFL files.
