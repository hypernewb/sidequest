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

Fever's server adapter is implemented but requires credentials issued specifically for this hosted integration. Your personal chat OAuth connection does not supply these.

Request a client ID, client secret and audience from data-ai@feverup.com for SideQuest, using the client_credentials grant and mcp:service scope. Include the app URL and explain this is a Tokyo event-discovery hackathon demo. Confirm the permitted public display of event descriptions/prices and booking links. Official instructions: https://developer.feverup.com/en/#mcp-server

Save these values only in ignored local .dev.vars, then configure the same three as secret Sites runtime values and redeploy:

- FEVER_CLIENT_ID
- FEVER_CLIENT_SECRET
- FEVER_AUDIENCE

The server exchanges them at Fever's documented Auth0 token endpoint, caches the token only until expiry, initializes an MCP session and calls read-only search tools. It supports JSON and SSE responses, bounds requests to 25 seconds and closes the session. No chat credentials, refresh tokens or provider secrets reach the browser or Git.

The combined discovery endpoint isolates provider errors. Missing/failed Fever access does not discard Qloo places. Event-only mode does not call Qloo. Event listings show source, session starts in Tokyo time, starting ticket price and Fever link; users can save/pass events separately. They are explicitly date/area matches, not Qloo-ranked or Qloo-endorsed. Venue association uses explicit Fever venue IDs only. Neighborhood searches inspect at most three provider-selected venues; city searches inspect one page of 36 listings. Coverage is bounded, not exhaustive.

Events lacking explicit matching session times/timezone are excluded. Strict neighborhoods require confirmed venue coordinates; hard budgets require a known JPY upper ticket price. Starting fares alone do not pass caps. Ticket category, fees and availability still require confirmation on Fever. The feed's partial session list is not a complete calendar.

Verification: OAuth/MCP behavior and provider edge cases have contract tests with injected fixture responses. These tests do not prove live M2M access. Live chat venue reads and Qloo place reads work; live hosted Fever activation remains blocked until issued credentials are supplied.

Only the 37 selected IDs are searched. This is not exhaustive Tokyo coverage. Provider descriptions/weekly hours are not independent verification. There is no guaranteed ticket capacity; place admission prices remain unknown. No generated satisfaction score is shown. Human recommendation quality evaluation, public repository setup, and the hackathon submission are still required. Initial deployment is private; judges need a deliberately public deployment later.

Browser-local saves do not sync between devices or origins. Cached saved records may become stale. No analytics or app accounts are added. Normal discovery sends selected entity IDs to Qloo; map and venue links open external websites.

## Structure

`app/page.tsx` — discovery UI. `app/api/search` — interest lookup. `app/api/discover` — validation and live ranking. `lib/qloo.ts` — provider normalization. `lib/discovery.ts` — deterministic hard filters, modes and Tokyo dates. `lib/fever-client.ts` — M2M authentication and read-only MCP transport. `lib/fever-data.ts` — strict event normalization. `components/fever-events.tsx` — sourced event results. `tests/` — ranking/filter/date/link and Fever contract checks.

## License

MIT for authored code; third-party provider content and trademarks retain their own terms. Self-hosted DM Serif Display and DM Sans are supplied under the bundled SIL OFL files.
