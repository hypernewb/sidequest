# SideQuest submission draft

Prepared for the Qloo Agentic Hackathon on 30 October 2026. Complete SUBMISSION-CHECKLIST.md before submitting.

## Elevator pitch

Turn the things you love into gigs, pop-ups, limited releases and a day worth going out for.

## Inspiration

The interesting stuff is scattered. A gig lives on a venue calendar, a short-run collaboration on a Japanese announcement page, and a record release on a shop's website. Searching each separately takes work. Searching for things to do often brings back the same landmarks.

SideQuest starts with a different question. What do you already love, and what is happening that connects to it?

## What it does

Start with an artist, film, brand or other supported cultural interest. Confirm the right Qloo entity and say how strongly you like it. SideQuest uses those signals to rank time-limited events, pop-ups and releases from official sources. Online opportunities belong alongside physical events.

Browse several options, react in Stumble, or put mapped finds into My day. For a Tokyo outing, dispatch the SideQuest Agent. It ranks a curated venue pool, applies supported schedules and geographic constraints, reads candidate official pages, and retries when a stop becomes unusable. It returns one to three supported stops rather than forcing a complete route.

Door notes separate published practical details from a personalized suggestion for appreciating the stop. Expand the source to see the wording and read time. Import a Japanese announcement to extract supported details while retaining the original alongside its English rendering. After a visit, one enjoyment rating influences later recommendations in the same browser.

## How we built it

Qloo /search resolves cultural identities and /v2/insights supplies taste associations. The catalog supplies real opportunities and their evidence. These have different jobs. A cultural association is not proof that an artist is playing an event or that a limited release is still available.

The bounded agent workflow resolves interests, expands taste connections, checks published schedules, compares geographic routes and assembles the quest. Tool results stream to the screen as completed checks and failures. Route checks can remove an unusable candidate and build a replacement. It does not use an LLM to invent venues or opening hours.

The application uses TypeScript, Next.js/React, Tailwind CSS, Vinext and Cloudflare Workers. The map uses Google Maps when configured, with an OpenStreetMap fallback and Google directions links. Plans, reactions and ratings are stored in the user's browser.

## Challenges and decisions

Sparse listings made weak recommendations look precise. We added official-page enrichment for supported artist, genre, date, price and entry information, and kept missing fields explicit. Qloo entity resolution and source evidence help distinguish a supported match from a nearby stopover.

Published weekly schedules do not establish a special closure or ticket availability. SideQuest shows what it checked and keeps sourced facts separate from editorial suggestions. Walking distances are estimates. Google Maps provides street navigation after export.

## What we tested

The last application verification recorded 292 passing automated tests, TypeScript and a production build. Functional reviews compare contrasting tastes, exercise closure replanning, inspect map and planning behavior, and check sourced door notes. Evidence is linked in README.md and evaluation/PUBLIC-RELEASE.md.

The demo compares selected Nujabes and Iron Maiden recommendations. Its closure report and visit rating are labelled demo interactions. These checks do not establish a human satisfaction score or a percentage improvement over a baseline.

## What comes next

Broader independent source coverage, more complete Japanese extraction and translation, and a held-out human recommendation study. The existing scheduled updater needs its new maintenance header configured and verified. Provider access and reuse terms still constrain which sources can be offered publicly.

## Built with

Qloo API, TypeScript, Next.js, React, Tailwind CSS, Cloudflare Workers, Vinext, Google Maps, Leaflet/OpenStreetMap.

## Links and judge walkthrough

- App URL: https://sidequest-tokyo-ckx.ckx-1994.chatgpt.site/ . Public and tested signed out on 30 October 2026.
- Repository: https://github.com/hypernewb/sidequest . Public and updated with the current application release.
- Optional video: outputs/submission-ready/SideQuest-submission-with-your-voice-1080p.mp4 . Add a hosted URL if using the video field. Do not paste a local path into Devpost.
- Begin with Nujabes, confirm the artist and adjust interest strength. Browse finds and the map, then open /quests to dispatch an outing. Try Iron Maiden separately to compare recommendations. Current availability can change results.
- Setup and evidence: README.md. License: LICENSE. Provider and asset notices: THIRD-PARTY-NOTICES.md.
