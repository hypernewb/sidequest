# Quest stop field-note documentation

30 October 2026. Narrow documentation handoff for the Before you go and A way into it extension at `/quests`. This records the implemented behavior and reviewed evidence. Automated checks were supplied by the implementation task and were not rerun by the documenter.

## Product behavior

Each stop keeps its schedule, venue name, address, rating, programme link, closure-replan control and cultural explanation. `components/quest-stop-guide.tsx` replaces the old visible mission and static door-note block with two short sections. Before you go shows up to three supported non-hours facts, or hours when no other fact exists. Source wording expands to all retained facts, their literal excerpts, official links and Tokyo read times. Japanese excerpts retain their original wording beside scoped English descriptions. With no extracted facts, the stop says so and directs the visitor to the official venue page.

`lib/door-notes.ts` checks venue identity and official host, with exact paths where needed, before accepting narrow source patterns. Its ten named adapters are Little Soul Cafe, Bar Music, Pianola Records, HMV record shop Shibuya, BIG LOVE RECORDS, UTRECHT, Kanda Brazil, Komiyama Tokyo, Bohemian's Guild and 21_21 DESIGN SIGHT. Exact-name JSON-LD can provide an address elsewhere. This is selected coverage, not a general venue-policy reader. Unmatched wording and malformed structured data supply no fact. No category inference supplies payment, fees, accessibility, photography or booking requirements. Existing programme prices remain separate.

A way into it uses authored prompts selected from the supported Qloo taste expansion, reviewed venue tags and stop role. Record browsing varies with stop order. Listening, gallery viewing and book browsing have role-specific actions. Nearby stopovers use an activity suggestion without claiming a cultural match. The visible label is SideQuest suggestion; The connection exposes its basis. No claim attributes the prose or venue rules to Qloo.

`lib/agent-tools.ts` applies extracted weekly hours before the route is checked again. Bar Music's supported weekday opening is 18:30, while weekends retain 18:00. Friday's early-morning wording does not establish an exact closing time. Dated source exceptions retain the existing path. `lib/quest-share.ts` preserves practical descriptions, source URLs and read timestamps, and labels the appreciation as a SideQuest suggestion. Shared timestamps remain ISO-formatted; the on-screen source disclosure formats them in Tokyo time.

Old browser saves may use their previous mission as the suggestion. Their old free-text catalog notes do not gain official verification. The component filters malformed facts and unsafe links before display.

## Checked evidence

The documenter read `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`, the quest-builder surface brief, the Impeccable document reference and the final relevant source files. The last stylesheet additions use a 66ch reading width, 15px practical and suggestion copy, 13px source details, a 44px disclosure target, a visible focus outline and fine rules between sections.

The inspected screenshots are `.impeccable/review/door-desktop.png`, `door-mobile.png` and `door-mobile-compact.png`. The desktop and mobile captures show a real Haruki Murakami route through Kanda Brazil, Komiyama Tokyo and Bohemian's Guild. Kanda Brazil's expanded disclosure shows Japanese source text, the official link and Tokyo read time. The compact mobile crop shows the collapsed practical block and labelled suggestion in the existing open stop row. These captures support reading flow and evidence separation; they do not prove every viewport or keyboard path.

`outputs/door-notes/Nujabes-final.json` contains two different jazz-record browsing prompts and an instrument-focused listening prompt. HMV and Bar Music carry sourced practical details. Hi-Fi Record Store has no extracted practical facts. `outputs/door-notes/Wong-Kar-wai-final.json` contains film-framing, image-led-book and imagined-scene listening prompts. The first two stops have no extracted practical facts; Bar Music retains its official access and hours evidence. Both quests use 31 October 2026, a Saturday. Their Bar Music arrival of 18:02 is consistent with weekend opening and does not itself demonstrate the weekday correction. The implementation and its reported tests cover weekday propagation.

The implementation task reports 290 passing tests, including extraction failures, appreciation distinctions, sharing and source-hours propagation. TypeScript and a production build passed before the last copy and spacing adjustments. Final packaging verification remains with the parent implementation task. This document makes no independent test-run, deployment or final reviewer disposition claim.

## Design documentation disposition and limits

The extension preserves the paper canvas, red actions, moss accents, serif venue headings and ruled stop list. It adds no media, visual world or durable system decision. `DESIGN.md` and `.impeccable/design.json` remain unchanged. The scoped contract is `.impeccable/surfaces/components-quest-builder-tsx.md`.

Existing broader design-document drift is outside this handoff. Source pages may change, narrow extraction may miss valid details, and successful reading does not establish complete entry rules, stock, accessibility or holiday opening. Authored prompts are invitations rather than inventory or programme promises. No human satisfaction or recommendation-quality lift has been measured.
