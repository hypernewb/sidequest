# Catalog population and taste repair

Verified on 25 October 2026.

The previous saved snapshot contained 189 records: 144 gigs, 24 pop-ups, 12 exhibitions, nine other events and zero releases. The legacy drops view used eight hard-coded announcements. MEDICOM preorder headlines failed the release-only parser. Recently launched products expired as if their launch date were a one-day event. Imported records disappeared from discovery after 24 hours even when their dated windows continued.

The revised live local catalog contained 433 records across 19 publisher/source labels, including 223 releases and 43 pop-ups. These include current windows, forthcoming releases and releases from the last 14 days. They are not 433 future Tokyo events or 223 limited editions. See catalog-population-local.json for the timestamped six-search audit. Published data may differ by refresh time.

New readers cover dated BANDAI SPIRITS products, individual MEDICOM preorder products, Tokyo Animate pop-up cards across three pages, and Midtown event cards. The existing four-hour scheduled writer includes these sources. Browse retention is seven days with the real check date preserved; timed quests retain the stricter freshness rule.

The events screen loads without setup, shows counts by category and keeps the whole returned pool available. The older drops screen reads this shared catalog. Named interests carry from quest creation or the classic taste builder into the event browser. Editable example sets retain curiosity rather than claiming favourites. Users can remove picks, change love/curious weighting and hide named franchises with an undo.

Ranking shares Japanese/English subject matching and genre evidence with the quest engine. Server hydration supplies Qloo tags for selected IDs. A graph contribution alone cannot certify personal relevance. The source's own genres outrank potentially ambiguous artist metadata. Diversity cannot lift unrelated filler above even a curiosity match. Explicit sold-out retailer notices are suppressed.

A separate bug allowed an anchored U.F.O.CLUB detail request to read the whole monthly calendar. It now scopes the read to the exact day, preventing another night's jazz from leaking into a punk show.

Visible title translation runs after the list loads and persists successes. Known product formats and character names use concise English labels while unmapped variants retain their source wording. Other titles remain machine translation with the original available; the public translation service can be unavailable or transliterate names poorly. Neither translation nor enrichment renews source freshness.

## Validation and remaining coverage gaps

Regression cases cover exact calendar headings, approximate dates, per-product preorder windows, Tokyo shop filtering, Japanese franchise aliases, source-vs-artist conflicts, shared profile storage, source diversity, stock notices and scoped gig reads. Six live searches cover unfiltered browsing, Pokémon, Gundam, Nujabes, Slayer and art. These are functional checks, not independent human relevance ratings.

Release breadth is still concentrated in Bandai. Only a small fraction of gigs have resolved artists or explicit genres, so music matching remains sparse. The scheduled bounded enrichment pass continues through the catalog; increasing source volume alone cannot supply missing artist metadata. Peatix, TAB and X timeline coverage remain unverified, and Connpass still needs approved credentials. No unsupported reader is counted as active coverage.

A published readback contained 533 retained records, including 317 releases and 50 pop-ups. Some were existing official imports recovered by the retention fix. Product deduplication now includes the product name: multiple distinct items on one dated manufacturer calendar no longer collapse into a single result. Manufacturer shipping milestones retain that label and never claim retail availability.
