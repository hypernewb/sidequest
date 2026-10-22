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

Fever MCP works in the development chat and returned Tokyo listings for Oct 24–25, 2026. That OAuth session is not a hosted app credential. This app deliberately does not copy session credentials or masquerade a build-time event snapshot as live data. Events mode explains the missing connection; no fake event listings ship. To enable hosted events, provision a supported Sites connector grant (if eligible) or a Fever-approved server-to-server data path and confirm display/reuse terms. Then join actual venue IDs to Qloo evidence; never label an event Qloo-backed based only on guessed tags.

Only the 37 selected IDs are searched. This is not exhaustive Tokyo coverage. Provider descriptions/weekly hours are not independent verification. There is no live ticket capacity or confirmed admission-price feed. No generated satisfaction score is shown. Human recommendation quality evaluation, public repository setup, and the hackathon submission are still required. Initial deployment is private; judges need a deliberately public deployment later.

Browser-local saves do not sync between devices or origins. Cached saved records may become stale. No analytics or app accounts are added. Normal discovery sends selected entity IDs to Qloo; map and venue links open external websites.

## Structure

`app/page.tsx` — discovery UI. `app/api/search` — interest lookup. `app/api/discover` — validation and live ranking. `lib/qloo.ts` — provider normalization. `lib/discovery.ts` — deterministic hard filters, modes and Tokyo dates. `tests/` — ranking/filter/date/link checks.

## License

MIT for authored code; third-party provider content and trademarks retain their own terms. Self-hosted DM Serif Display and DM Sans are supplied under the bundled SIL OFL files.
