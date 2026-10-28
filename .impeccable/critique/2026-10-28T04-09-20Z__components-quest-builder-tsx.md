---
target: SideQuest UI review
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\Users\\ckx19\\Documents\\ChatGPT\\Career HQ\\sidequest-app\\components\\quest-builder.tsx"
target_fingerprint: "sha256:7c632e87cb6c371ed271ab8f2a7a7b1c266e9948b65a79de474b8ce7b46d6f56"
target_path: "C:\\Users\\ckx19\\Documents\\ChatGPT\\Career HQ\\sidequest-app\\components\\quest-builder.tsx"
timestamp: 2026-10-28T04-09-20Z
slug: components-quest-builder-tsx
---
Method: dual-agent (A: /root/ui_design_review · B: /root/ui_evidence_review)

The UI is visually coherent, but it is not ready for a clean bill of health. Its main problem is trust. Several polished controls and readouts promise behavior or verification that the implementation does not support.

## Design health

Independent design-review judgment, not a user-satisfaction benchmark. Operate surface; all ten heuristics apply.

| Heuristic | Score / 4 | Main finding |
| --- | ---: | --- |
| System status | 3 | Progress and cancel work; static verification text contradicts pending stages |
| Real-world language | 2 | Entropy, coordinates and tool names need decoding |
| User control | 3 | Cancel preserves input; saved quests lack a remove action |
| Consistency | 2 | Navigation changes between quests and catalog; dial selection has no behavioral effect |
| Error prevention | 2 | Date/input safeguards exist; invented route facts undermine them |
| Recognition | 3 | Named examples help; mobile placeholder clips |
| Efficiency | 2 | Optional constraints help; extra steps and settings placement slow the task |
| Minimalism | 2 | Good palette and typography, excessive diagnostic language |
| Error recovery | 3 | Cancellation preserves work; full failure paths were not exercised |
| Help | 2 | Sources and limits exist; opening promise and mode guidance are unclear |
| Total | 24/40 | Acceptable, with significant fixes needed |

## Specificity and impression

Keep the paper background, red ink, editorial serif and cultural examples. They suit a Tokyo field guide. The agent terminology and execution display dominate the visitor's actual task. The strongest opportunity is making the interface's promises accurate and easy to understand.

The deterministic detector returned zero findings on components/quest-builder.tsx. Both independent reviews found behavioral problems it missed. A clean pattern scan does not establish usability or truthful output. No detector false positives required adjudication.

## What works

- A clear initial headline, primary action and named examples make the first interaction approachable.
- Date/budget and source information use progressive disclosure. Follow-up activities are clearer than the surrounding agent terminology.
- Cancellation retained the seed. Limited keyboard checks found a visible focus outline and no trap. Sampled color pairs passed normal-text AA contrast; this was not a full accessibility audit.

## Priority issues

1. **P1. Route facts are manufactured by the UI.** components/quest-builder.tsx:207 calculates Total Walk as stop count multiplied by 0.6km. Line 219 appends Stn to a neighborhood without a station source. Line 256 uses the current stop's incoming travel time for the next leg, with a fabricated 350m/5-minute fallback. Assessment B observed a Jimbocho itinerary claiming Akihabara Stn, with connectors contradicting the next stop's timing. Derive summaries from actual route fields, use the next stop's incoming leg and omit unknown station/distance claims. Suggested command: impeccable harden.

2. **P1. The dispersion dial does nothing to recommendations.** components/quest-builder.tsx:22,62,135 records the selection locally but omits it from the request and planning inputs. Both reviewers changed its visible state. Selection is also missing from radio/pressed accessibility semantics. Connect it to defined, testable behavior or remove it until implemented. Suggested command: impeccable harden.

3. **P1. The loading screen claims completed verification too early.** components/quest-run.tsx:49 hardcodes a quotation claiming a verified walking loop under 2.5km and verified live hours/admission. Both reviewers saw it while checks were pending; A also saw it after cancellation. Display the current operation and only state completed checks when the returned evidence supports them. Suggested command: impeccable clarify.

4. **P2. Technical language and mobile ordering add unnecessary work.** Entropy, hyper-local coordinates, Taste Spark and tool-named stages make a simple outing request harder to understand. At 390x844, the long placeholder clips and practical settings appear after the submit action. Say what the visitor will get, place applicable options before submission and move tool details into a disclosure. Suggested commands: impeccable clarify and adapt.

5. **P2. The catalog handoff buries browsing.** components/outing-builder.tsx:33,40 places preference editing above suggestions. Navigation changes meaning and provides no explicit Back to quests action. Eight category options compete for attention, including empty categories; transient zero counts appear during loading. Make preferences compact, bring results forward and clarify the return path. Suggested commands: impeccable distill and layout.

## Cognitive load and emotional journey

Arrival is the strongest point. Choosing a familiar cultural name creates recognition. The valley starts when the visitor must interpret an execution dashboard, another choice and another run. Progress and cancellation help; unsupported verification claims provide misplaced reassurance.

The catalog has eight category choices, exceeding the critique checklist's four-option threshold. The four examples and three follow-up activities plus skip do not exceed that threshold. Five execution cards are information to scan, not five actionable choices. Their mobile stack still creates scanning work.

## Persona red flags

- First-timer: entropy and affinity terminology obscure the promised timed walk.
- Accessibility-dependent visitor: dial selection lacks programmatic state, focus is not deliberately moved to replacement questions/results, and supporting labels use 11px text.
- Stress tester: changing the mode has no effect, verification text ignores run state, and route summaries contradict itinerary data.

## Smaller findings and limits

The later agent-live-dot animation is not covered by the existing reduced-motion rule. Saved quests lack a remove control. VOL.07 is unexplained decoration. No horizontal overflow was apparent in A's mobile pass.

Evidence comes from the current local preview and source, not a verification of the private deployed version. A inspected desktop and 390x844 but did not reach a completed quest during stale-catalog refresh. B completed a Haruki Murakami quest on desktop. Neither reviewer performed a full screen-reader, 200% zoom, share or storage-recovery audit. These limits prevent an accessibility or production-readiness certification.

## Questions to consider

Which priority should lead: route/control truth, plain-language mobile planning, or catalog browsing?

Should the next pass cover the three P1 issues, all five priority issues, or just the quest flow?
