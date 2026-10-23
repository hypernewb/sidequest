# Contrasting taste audit — 2026-10-23

Eight profiles were compared against the same 208-record catalog snapshot, using 2026-10-24 and a 30-day dated-event window: jazz, heavy music, electronic/experimental, independent galleries, anime goods, retro games, designer toys and coffee. Before rankings used the published v18 function. After rankings used corrected relevance rules plus four freshly read performance pages and verified Qloo entity metadata. This is a source-evidence audit, not a claim of human satisfaction or complete Tokyo coverage.

| Taste | Before problem | Corrected verified examples |
| --- | --- | --- |
| Jazz | PARCO performance-art installation ranked as jazz because of a composer's biography | Wolfgang Haffner Trio, Cotton Club |
| Heavy | Mostly the same generic gigs seen under other music choices | DEXCORE, LIQUIDROOM; source-labelled punk at Shindaita FEVER |
| Electronic / experimental | Same early-date gigs as jazz | Optimo was identified through verified artist tags, then excluded by its sold-out ticket notice; no available verified dated match remains in this test |
| Independent galleries | Generic injected gallery tags promoted a major design exhibition and children's learning display | mograg solo shows; Kohei Yamada and Sterling Ruby at Taka Ishii Gallery |
| Anime goods | Relevant Tower pop-ups mixed with fashion retailers | Kuroko's Basketball / Attack on Titan pop-ups and a clearly labelled Nendoroid shipping milestone |
| Retro games | Art installations appeared because their text mentioned games | No verified dated match in this snapshot; Qloo arcade/place search remains a separate option |
| Designer toys | BE@RBRICK release followed by unrelated fashion shops | BE@RBRICK Evangelion release; unrelated shopping suggestions removed |
| Coffee | A gallery exhibition appeared because its long page happened to mention a café | No verified dated match in this snapshot; café/place search remains available |

Fixes: activity eligibility uses event identity and concise evidence rather than arbitrary long-page words; only verified source/artist style matches appear by default when a specific preference is chosen. Activity-only alternatives require an explicit click. Provider variety has a bounded penalty, so it cannot bury strong matches. Qloo genre hydration reads tag_id from /entities and excludes audience/personality tags. Matched artist IDs are scored directly against seeds rather than hoping they appear among a general top-50 recommendation pool. Existing artist matches survive the per-refresh lookup budget. UNIT and LIQUIDROOM readers scope the event body and exclude recommended-show times.

Translations: 208 card records prepared, including all 60 populated detail-text records in the enriched snapshot. The initial local-model output was rejected where it summarized, invented name readings or omitted prices. A sentence-level pass preserved original proper names, then corrected known bad readings and checked practical fields. Japanese performer names are deliberately retained where no official English spelling is verified. Clock times and prices remain visible from source evidence; originals remain accessible. These are machine translations, not a professional human translation certification.

English card fields and detail translations persist only against matching original title/description/text. Background refresh preserves unchanged translations. The translation queue now includes TITLE/DESCRIPTION/DETAILS sections so scheduled work can translate future card fields too; an unparseable or stale result stays queued. Full-page data not yet read is still explicitly calendar evidence. New announcements after the audit may need translation in the next scheduled pass.

Validation: regression cases cover installation/jazz/game/café leakage, independent-gallery false positives, fashion/collectible separation, provider diversity, tag_id parsing, future translation envelopes, exact original matching and event-body boundaries. Production readback and contrasting live requests are required after publication.

Final production findings: the Cotton Club talking-blues event is a talk show and is excluded from music; Optimo's SOLD OUT notice sits on the price line and is now recognized. Both have regression tests. Empty calendar descriptions are valid and do not keep translation jobs pending. Final validation includes 208 English card records, 60 populated detail translations, zero pending catalog translations, and 110 passing checks. Proper names without verified English spellings remain in Japanese.
