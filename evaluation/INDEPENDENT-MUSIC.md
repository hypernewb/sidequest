# Independent sources and music matching

Checked 25 October 2026. These are live functional checks, not blinded human ratings.

## Sources that produced current records

| Official publisher | Current records | What we read |
| --- | ---: | --- |
| [BIG LOVE RECORDS](https://bigloverecords.jp/) | 21 | Recent vinyl shop listings |
| [pianola records](https://pianola-records.com/) | 7 | Six vinyl listings and a dated BONUS TRACK record fair |
| [CIBONE](https://www.cibone.com/) | 7 | Fashion, jewelry and design pop-ups with Tokyo venue evidence |
| [PARCEL](https://parceltokyo.jp/) | 2 | Exhibition periods and closure days |
| [WISH LESS](https://wish-less.com/) | 2 | Current and upcoming exhibition periods |

Shop publication dates are labeled as listing dates. They do not establish release dates, restocks, exclusivity or current inventory. BEAMS yielded 13 Tokyo announcements in a standalone reader but timed out in the app runtime. It is not included in the 39 working additions. Disk Union and JET SET blocked reads; several other examined sites were unavailable or did not expose usable dated records.

## Why gig matching failed

Music competed with hundreds of products for a small detail-reading budget. Short calendar text could satisfy a request for a full page. UNIT's structured data supplied a generic Organization field, while LIQUIDROOM's next-month dates could inherit the current month from its sidebar.

The refresh now gives gigs their own queue of 24 full pages per pass, rotates venues, and revisits pages after 24 hours. The existing four-hour refresh uses this queue. A bounded enrichment action lets an operator backfill the catalog. Current and next-month UNIT and LIQUIDROOM calendars are read separately.

The first local check had 142 gigs, 120 lineups, four gigs with reconciled artists and ten with genre evidence. After enrichment, 178 gigs had full pages and lineups, 91 had Qloo artist name matches and 108 had genre evidence. The remaining gaps stay unknown. More records and metadata are coverage measures, not recommendation-quality scores.

## Matching corrections

- Prefer specific Qloo genre tags over conflicting broad taxonomy families, both for seeds and performers. Kelly Simonz's broad Soul tag previously polluted Nujabes results.
- Prefer the official programme's genre evidence. Short supporting-act names need corroboration before their Qloo genres can qualify a show.
- Exclude geographic Seoul, festival-name mentions and Roquefort menu text from genre detection.
- Stop lineup extraction at vendor and ticket sections. Keep named guests and long lineups.
- Match vinyl to artist tastes without treating a band T-shirt as a music recommendation.
- Keep vinyl and fashion filters separate from character merchandise. An anime pop-up at Tower Records is not automatically a vinyl event.

## Reproduction and limits

Run `node scripts/audit-independent.mjs --refresh --enrich` against the local preview. Add `--hosted` for the private deployed site; the script requests its supported Sites service credential through hidden stdin. It saves a dated report and checks seven contrasting tastes with live Qloo seeds. It never writes the credential.

The local report is [independent-local.json](independent-local.json). Nujabes leads with Skaai, Slayer with DEXCORE, and Fontaines D.C. with its own vinyl editions. The independent-gallery case includes PARCEL and WISH LESS. Artist-name reconciliation can still confuse namesakes, genre matching is coarser than musical taste, and translation is incomplete for some source text. No quality-uplift percentage is claimed.

## Published verification

The [hosted report](independent-published.json) checks all seven tastes against the deployed app. CIBONE timed out on the initial run and succeeded on a second read. All 39 independent records are now in the hosted catalog; BEAMS returned 520/403 and remains unavailable. The current catalog has 608 records, including 178 gigs, 18 exhibitions and 58 pop-ups. These totals include existing sources and should not be described as newly added events.

| Hosted music coverage | Before refresh | After backfill |
| --- | ---: | ---: |
| Gigs with lineups | 120 | 178 |
| Gigs with Qloo artist name matches | 12 | 71 |
| Gigs with genre evidence | 16 | 94 |

All 178 current gigs have now had their full official programmes read. Older records did not track full-page status, so the previous zero in that field does not prove that no pages had ever been read. Sold-out shows found during the backfill are excluded.

The browser check also caught a Japanese ambient guitar duo named Lakeside being linked to an American funk band. A sole artist's identity now remains unresolved when its Qloo genre evidence conflicts with the official programme. Fashion pop-ups keep product prices in source evidence without treating them as admission prices. The final suite passed 168 tests, type checking and a production build.
