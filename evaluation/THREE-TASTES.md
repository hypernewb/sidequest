# Three contrasting tastes and closure replanning

Checked on 28 October 2026 with the live local app and real Qloo requests. All three recommendation cases use visit date 29 October 2026, no price limit, unknown prices allowed and the same activity choice before and after. Slayer was disambiguated to the artist; MUJI to the brand. Qloo and official pages can change between requests, so this is a functional audit rather than a frozen causal experiment or a human benchmark.

## Returned outings

| Input | Activity | Before | After | Judgment |
| --- | --- | --- | --- | --- |
| Nujabes | Records & listening | Hi-Fi Record Store → HMV record shop Shibuya → Bar Music | Same route | Jazz/soul evidence supports the selection. Two record shops are repetitive, so the activities distinguish selection, editions and listening. This is not an exact artist event match. |
| Slayer | Records & listening | Record Boy | Same specialist | Useful metal evidence, but only one supported stop. Do not call this a completed walking loop or add unrelated filler. |
| MUJI | Design & architecture | KOFFEE MAMEYA → UTRECHT → WATARI-UM | Same route | Design and publishing connections are supported. A current exhibition is not confirmed by this route. No separate matching event lead was found in this window. |

All three inputs returned a supported find. Two returned three-stop loops and one returned a single specialist. The seven returned venues are distinct across these examples. Per-request durations are recorded in the structured captures, including explicit disambiguation where needed. These are observations from one run, not latency guarantees.

The routes staying stable is relevant. This repair did not produce an observed quality uplift across these three outings. It removed a general matching shortcut and improved event explanations and diversity. Raw structured reports are [before](three-tastes-before.json) and [after](three-tastes-after.json). Private raw streams remain under ignored `.local/three-tastes/`.

## Weak matches and repairs

**Activity was masquerading as taste.** `applyFocus` previously upgraded every activity match to a cultural anchor and added 85 points. A generic gallery could therefore qualify as a personal match because the visitor selected art. Activity now adds a smaller preference bonus while retaining the original cultural strength. A regression case with only unrelated galleries, books and coffee must return no culturally supported route.

**Broad music families sounded too specific.** The event lead scorer previously treated any shared metal or jazz family as much the same evidence. It now ranks an exact, non-generic genre match above broad family adjacency. Heavy-metal family evidence alone does not establish a thrash-metal match. The live Slayer lead is labelled a broad metal connection, rather than a promise of a Slayer-like performance. This still uses a small genre vocabulary and should not be mistaken for fine-grained musical understanding.

**One tour occupied multiple lead slots.** Two Mark Boals × Kelly SIMONZ dates at UNIT filled Slayer's shortlist. The same programme at the same location now appears once, with the first eligible date. Different programmes and venues remain separate. Additional dates stay on the official site.

**Repeated roles repeated the invitation.** Two bookshops or record shops could produce duplicated introductory copy. Repeated roles now name the later venue's different selection. Authored stop tasks remain source-grounded; no record currently playing, stock, scent or special event is invented.

**Stale practical details.** The browser walkthrough exposed an old second-floor address for Pianola Records. Its [official Japanese access page](https://pianola-records.com/pages/about-us) instead lists BONUS TRACK, 2-36-13 Daita, with 14:00–21:00 hours and Thursday closure. The curated note and source link now use that page, and the official Thursday closure overrides provider hours. A regression checks Wednesday and Thursday separately.

## Closed-venue proof

`node --experimental-strip-types scripts/demo-closed-venue.mjs` runs the real source-specific closure reader and route planner against controlled source HTML, coordinates and weekly hours. The fixture explicitly says the exhibition is closed on Mondays and the requested visit is Monday 26 October 2026.

| Stage | Result |
| --- | --- |
| Initial weekly-hours plan | Fuglen Tokyo → Mograg Gallery → KOTARO NUKAGA |
| Official-page fixture read | Mograg has no public opening window on that Monday |
| Replanned result | Fuglen Tokyo → KOTARO NUKAGA |

The planner keeps a supported two-stop result instead of padding it. [The trace](closed-venue-replan.json) includes the original route, reason, revised route and emitted progress events. The fixture does not assert these real venues form that geographic loop or that Mograg is closed today.

The production flow also supports a visitor report through **Closed? Replan without this stop**. Reports are validated against the curated venue IDs, excluded from planning, labelled as visitor reports and can be cleared. They do not overwrite the shared venue catalog or claim an official closure. An integration check exercises this through the real streamed `/api/quests` handler.

Unreadable pages have a separate failure label. They are not described as confirmed closures. Automatic dated closure extraction currently depends on supported source adapters, including Mograg; it does not understand every arbitrary closure announcement.

## What remains unproven

No held-out human satisfaction, novelty or actionability scores were collected. The 25 October baseline comparison remains historical. We cannot turn these examples or passing tests into a measured quality-gain percentage. The specialist coverage gap for metal is still real, and the Nujabes route could be more distinctive with a verified programme on the selected date.

## Browser check

A local browser run on 28 October used Nujabes and records & listening. The initial Shibuya route contained HMV record shop Shibuya. We used the closure-report button as a simulated visitor report. The actual rerun excluded HMV and returned Record Station → Pianola Records → Little Soul Cafe for 28 October. The result separately labelled an unreadable Manhattan Records page as a source failure. This browser check used 28 October, while the three-taste API comparison above used 29 October. It does not establish a real HMV closure.
