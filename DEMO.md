# SideQuest two-minute demo

Use the current app and actual returned routes. Rehearse before recording, and use the date shown on screen. The 29 October 2026 examples below were captured on 28 October. Do not read fixed times or venue names if the live result differs.

## 0:00–0:15 · One interest, somewhere to go

**Screen:** Start at SideQuest's single input. Enter Nujabes, then select Find my quest and Records & listening. For a repeatable recording, set the tested visit date under Filter by date or price limit before submitting.

**Voiceover:**

"You know what you love. Finding somewhere to go with it takes more work. SideQuest turns one interest into a short Tokyo quest, using Qloo's taste connections and places we can actually source."

## 0:15–0:40 · Taste becomes a route

**Screen:** Show the real planning stages. Then show the returned stops, one cultural connection and the estimated walking label. The captured route was Hi-Fi Record Store, HMV record shop Shibuya and Bar Music. If the result changes, show and describe that result.

**Voiceover:**

"Qloo resolves Nujabes and supplies cultural metadata and affinities. Our scout ranks a curated venue pool, fits published hours and reads the selected pages. Here, jazz and soul connect the record shops and listening bar. The walking times are estimates, and the map opens street directions."

## 0:40–1:05 · Demonstrate replanning

**Screen:** Say that this is a simulated visitor report. On one current stop, click Closed? Replan without this stop. Show the real rerun and Why the route changed. Highlight the excluded venue and the supported new route. Keep any shorter result visible.

**Voiceover:**

"For this demonstration, I'll report one stop closed. This is a simulated visitor report, not an official closure notice. The scout keeps my taste and practical choices, removes that stop and plans again. It shows why the route changed. If only two worthwhile stops fit, it keeps two."

The report is local to this browser session. Clear reports for the next plan or change the input before the next taste. Do not describe an HTTP failure as a closed venue.

## 1:05–1:35 · Show contrasting tastes

**Screen:** Use brief captured runs for Slayer, selecting the artist and Records & listening, and MUJI, selecting the brand and Design & architecture. Keep real run progress visible for at least one case. If waiting is shortened in editing, label the cut rather than presenting it as instant execution.

**Voiceover:**

"Slayer leads to Record Boy, a metal specialist. We couldn't support a nearby loop, so we return one useful find. MUJI leads to a different outing through coffee, design books and art. Choosing an activity helps shape the route, but it cannot manufacture a taste match."

## 1:35–2:00 · Useful output and honest evidence

**Screen:** Open Events & drops, select Vinyl & record fairs or Fashion & design, and show one current official-source listing. Return to a quest, then open its Google Maps route. End on the three-taste review table.

**Voiceover:**

"You can also browse official events, pop-ups and releases, save a quest and take its route into Maps. Our three test tastes produced distinct places. That's a functional check, not a satisfaction score. SideQuest's next test is whether people discover something they want to go and do."

## Preparation and fallback

- Keep this recording under two minutes. The spoken text is roughly 260 words; allow space to read the actual result.
- Use the deployed app or the local URL printed by `npm run dev`, normally `http://127.0.0.1:5173`.
- Rehearse the three inputs with a fixed date. Exact-name disambiguation is part of the experience, not a failed run.
- For deterministic closure evidence, run `node --experimental-strip-types scripts/demo-closed-venue.mjs`. Explain that the source HTML, weekly hours and coordinates are controlled fixtures. It exercises the real closure adapter and planner; it does not prove a live closure.
- If an upstream service fails, show the failure and use a clearly labelled previously captured run. Never substitute a fabricated live result.
- Avoid the removed dial, telemetry claims, guaranteed opening times, a Qloo quality-uplift percentage, and claims that three stops always fit.
- No new video is included in this repository update. This is the recording script and reproduction guide.
