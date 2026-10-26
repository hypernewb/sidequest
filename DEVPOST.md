# SideQuest: Devpost Submission Dossier

Use this text directly for your submission fields on Devpost or the competition portal.

---

## 1. Project Tagline (Elevator Pitch)
An agentic Tokyo walking engine that turns any cultural spark into a verified 3-stop afternoon quest, with live opening hours and zero venue collisions.

---

## 2. Inspiration
Tokyo is one of the most culturally dense cities on earth, but visiting it usually means falling into one of two traps. You either follow TripAdvisor into a crowd of tourists at a theme cafe, or you spend hours scouring Japanese blogs to find a jazz kissaten that turns out to be closed on Mondays.

When you pass a cultural taste seed like Haruki Murakami or Wong Kar-wai into a standard recommendation system, collaborative filtering recommends either generic tourist hotels or places scattered fifteen kilometers across the prefecture. An algorithm without physical, spatial, and temporal awareness cannot build a real afternoon in Tokyo. We built SideQuest to turn cultural affinity into an executable walking reality.

---

## 3. What It Does
SideQuest takes a single cultural spark (an author, musician, filmmaker, or aesthetic movement) and dispatches an autonomous agent to scout a walkable 3-stop afternoon circuit.

Instead of generating a generic list of venues, SideQuest produces a structured Field Dossier:
- A thematic title and narrative mission for the afternoon.
- An arrival timetable with walking legs strictly capped under 1.5 kilometers.
- Tactical door notes (cash requirements, basement entrances, hidden staircases).
- Live verification of Tokyo operating hours for the current day.
- A one-click export link that opens the complete walking route in Google Maps.

If you input Haruki Murakami, SideQuest constructs a quiet Showa-era literary afternoon through Jimbocho. If you input Wong Kar-wai, you get a neon-lit, late-afternoon film noir walk through Shibuya. Distinct inputs yield distinct circuits with zero venue overlap.

---

## 4. The Agentic Architecture and How We Built It
SideQuest is structured as a deterministic 5-stage agent pipeline exposed via streaming Server-Sent Events (SSE). Each stage runs through an explicit tool schema defined in `lib/agent-tools.ts`:

1. `tool_resolve_entity`: Disambiguates user input into verified Qloo entity identifiers via Qloo `/search`. When an input is ambiguous (such as Akira as a film versus an artist), the agent pauses and presents options.
2. `tool_expand_taste_graph`: Queries Qloo `/v2/insights` across cultural domains (music, film, literature, design) to extract affinity weights and related genres.
3. `tool_schedule_verify`: Checks operating schedules against Asia/Tokyo time. It eliminates closed spots, flags split-hour afternoon gaps, and executes live HTTP requests against official venue pages to catch sudden closures.
4. `tool_spatial_cluster`: Evaluates geographic density. It clusters candidate venues into walking circuits with legs capped at 1.5 kilometers. If a district lacks enough verified open venues, it expands along direct transit corridors (such as the Keio Inokashira Line) rather than stranding the user on a 6-kilometer walk.
5. `tool_synthesize_quest`: Assembles the final dossier, sets the walking sequence, and generates the Google Maps navigation link.

The stack runs on Next.js 16 (React 19, TypeScript, Tailwind CSS) deployed on the Cloudflare Workers edge runtime.

---

## 5. Challenges We Overcame
1. The Collaborative Filtering Gap in Physical Space:
Qloo provides strong cultural affinity signals, but taste models do not know whether a basement jazz bar has a locked door at 2:00 PM on a Tuesday. We solved this by pairing Qloo insights with a curated ground truth of 100 reviewed Tokyo independent spaces and a strict Asia/Tokyo scheduling engine.

2. Entity Disambiguation and API Constraints:
Passing person-type entity IDs directly to place insight endpoints in Qloo returns errors for specific categories. We implemented alias routing and brand entity fallbacks to ensure queries like Isamu Noguchi resolve to verified cultural venues without breaking the agentic loop.

3. Venue Domain Rot:
Independent Tokyo kissaten and record bars frequently change domains or let legacy websites expire. We added live HTTP status checks and official social blog fallbacks to keep schedule verification reliable.

---

## 6. Accomplishments That We Are Proud Of
- 187 automated unit and integration tests passing in under 1.5 seconds.
- Zero venue overlap across distinct cultural seeds.
- A live streaming monospace trace that displays every step of the agent's spatial clustering and schedule verification in real time.
- Field-tested door notes that tell visitors exactly what to expect before stepping down a narrow staircase.

---

## 7. What We Learned
An AI agent operating in the physical world cannot rely on unconstrained generation. Large language models hallucinate opening hours, and raw vector databases ignore walking distances. Real utility comes from combining rich cultural intelligence (Qloo) with deterministic spatial rules, live operating verifications, and curated ground truth.

---

## 8. Built With
- Qloo API (/search and /v2/insights)
- TypeScript
- Next.js 16 (App Router)
- React 19
- Tailwind CSS
- Cloudflare Workers / Vinext
- Leaflet / OpenStreetMap
- Node.js Test Runner (187 tests)

---

## 9. Quick Links for Judges
- Live Demo: [Insert your production URL]
- 2-Minute Demo Video: [Insert your Loom or YouTube URL]
- GitHub Repository: https://github.com/hypernewb/sidequest
- Architectural Documentation: README.md
