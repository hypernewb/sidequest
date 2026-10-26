# SideQuest 2-Minute Demonstration Script

This guide outlines the timecoded voiceover and on-screen actions for the two-minute hackathon submission video.

Target Duration: 120 seconds (2 minutes flat).

---

## Timecoded Script

### 0:00 to 0:25 · The Tokyo Discovery Problem

- **Screen Action**: Start on a full-screen view of Google Maps zoomed into Shibuya and Shinjuku, showing an impenetrable tangle of pins and crowded tourist spots. Transition smoothly to the SideQuest homepage at `localhost:3000`.
- **Spoken Voiceover**:  
  "Tokyo has one hundred thousand backstreets and some of the richest niche subcultures on the planet. If you search for an afternoon itinerary on standard maps, you get generic four-point-five-star tourist traps with ninety-minute queues. If you ask a standard AI chatbot, it hallucinates non-existent cafes or pairs venues on opposite sides of the city with impossible walking times. SideQuest solves this. It takes a single cultural obsession and dispatches an autonomous agent to build a walkable, time-verified Tokyo quest."
- **Key Visual**: The SideQuest header with the vermilion wordmark and the hero statement: *"Tuned to your obsessions, mapped to Tokyo alleys."*

---

### 0:25 to 0:50 · The Cultural Spark & Live Agent Pipeline

- **Screen Action**: Hover over the spark prompt. Click the `+ Haruki Murakami` quick-pick chip. Click the primary button: **Dispatch SideQuest Agent**. As the agent runs, point to the live telemetry bar and the monospace agent stages streaming down the screen.
- **Spoken Voiceover**:  
  "Let's enter Haruki Murakami. Instead of running a static database filter, SideQuest triggers a five-stage agent pipeline. First, `tool_resolve_entity` queries Qloo to resolve Murakami to his verified entity record. Second, `tool_expand_taste_graph` uses Qloo's insights endpoints to fan out into postwar jazz kissaten, literary counterculture, and vintage bookshops. Third, `tool_schedule_verify` evaluates Sunday Tokyo opening hours and validates venue homepages live to catch temporary closures. Fourth, `tool_spatial_cluster` bounds walking legs to under one point five kilometres. Finally, `tool_synthesize_quest` compiles the complete route."
- **Key Visual**: The live monospace trace displaying `tool_resolve_entity` -> `tool_expand_taste_graph` -> `tool_schedule_verify` -> `tool_spatial_cluster` -> `tool_synthesize_quest`.

---

### 0:50 to 1:20 · The Quest Dossier & Tactical Door Notes

- **Screen Action**: Scroll into the synthesized Quest Dossier: *"Jimbocho, one shelf over."* Highlight the vital metrics bar (3 stops, 20 minutes walking, 368 metres total walk). Slowly scroll through the three stops: Kanda Brazil, Bohemian's Guild, and Komiyama Tokyo. Click to expand the **Tactical Door Notes** panel.
- **Spoken Voiceover**:  
  "Here is our quest. This is not a spreadsheet. It is a curated afternoon loop in Jimbocho, timed to start at twelve fifteen. Stop one is Kanda Brazil, a classic Showa kissaten founded in 1972, serving hand-drip dark roast. Stop two is Bohemian's Guild, with rare literary editions and Surrealist monographs. Stop three is Komiyama Tokyo, with four floors of vintage postwar photography. Look at the tactical door notes: basement stairs, cash only, quiet atmosphere. These are concrete operational details travelers actually need."
- **Key Visual**: The Tactical Door Notes callout box and the directional walking leg connectors between consecutive stops.

---

### 1:20 to 1:45 · Dynamic Taste Contrast

- **Screen Action**: Scroll back to the input box. Click the `+ Wong Kar-wai` chip and run the agent again. Show the new route generated in Shibuya starting at fifteen forty-five.
- **Spoken Voiceover**:  
  "Now watch what happens when we switch to film director Wong Kar-wai. The agent detects cinematic soundscapes, film noir, and low-lit atmospheres. It completely reroutes us to Shibuya and Oku-Shibuya: starting at Gallery Conceal for contemporary indie art, moving to Shibuya Publishing and Booksellers for foreign cinema monographs, and finishing at Bar Music, an intimate listening bar with vintage McIntosh amplification that unlocks right at eighteen hundred. Across all our demonstration seeds, there is zero venue overlap."
- **Key Visual**: The Shibuya evening route with Bar Music timed right at its 18:00 door opening.

---

### 1:45 to 2:00 · Technical Foundation & One-Click Navigation

- **Screen Action**: Click the vermilion primary button: **Open Route in Google Maps →**. Show the new tab opening Google Maps with all three waypoints and the origin loop closure pre-populated. Cut to a terminal window running `npm test` showing 187 passing tests in one point two seconds.
- **Spoken Voiceover**:  
  "One tap exports the entire walking circuit directly into Google Maps with turn-by-turn walking waypoints ready on your phone. Behind this interface are one hundred eighty-seven automated tests, real Qloo taste graph integration, and verified physical ground truth. That is SideQuest: personal obsessions mapped to Tokyo alleys."
- **Key Visual**: The Google Maps route tab pre-populated, followed by the passing terminal test suite.

---

## Recording Checklist

1. **Local Setup**:
   - Start the local dev server: `npm run dev`.
   - Open Chrome at `http://localhost:3000` in full-screen (1080p or 1440p).
   - Ensure browser zoom is set to 100% so typography renders sharply.
2. **Timing Rehearsal**:
   - Rehearse with a stopwatch. Speak at a measured, conversational pace.
   - Do not rush through the door notes. Let the viewer read the stop titles.
3. **Contingency Notes**:
   - Both `Haruki Murakami` and `Wong Kar-wai` have been tested against Qloo live endpoints and return instant three-stop loops.
   - Keep the terminal window open in a split screen or background tab for the final five-second cut.
