# Event-first discovery, 28 October 2026

The main route now opens a timed opportunity feed. The walking quest engine remains available at `/quests`. This changes what the visitor discovers first while retaining the existing field-guide visual style.

## Live inventory check

The check used the local Worker preview, current source catalog and real Qloo calls. [Structured capture](event-first-live.json).

| View | Eligible results | Online results |
| --- | ---: | ---: |
| Everything | 266 | 47 |
| Online only | 47 | 47 |
| Online limited drops | 18 | 18 |
| Tokyo in person | 219 | 0 |

The combined view contains 151 gigs, 14 exhibitions, 44 pop-ups, 39 other events and 18 release windows. These are current eligible records across old and new sources, not the number added by this change. Counts will change as source dates pass.

## New public sources

- [Bandcamp Live](https://bandcamp.com/live) provides scheduled listening parties and streams, artist names, artwork and UTC instants. Album pricing is not treated as event admission. Subscriber-only access is labelled. Events with no published end time leave upcoming discovery once their start passes rather than being described as still live.
- [hololive official shop](https://shop.hololivepro.com/en) supplies product links. Each product's dedicated Order Period block supplies the start and deadline in JST. Shipping periods are separate. Ten eligible current order windows were captured. Timed ordering does not establish a numbered edition or shipping to every country.
- [Steam's official event feed](https://store.steampowered.com/events/ajaxgetpartnereventspageable/?clan_accountid=27766192&offset=0&count=15) supplies festival announcements. Only explicit festival date ranges qualify. Client updates and news publication timestamps cannot become festivals. The current Scream festival's 10 a.m. Pacific deadline converts across the November daylight-saving change.

The Bandcamp and shop adapters together parsed 39 records in the API refresh; one Steam festival brought the parsed total to 40. One already-started listening session was ineligible by the check. Existing online MEDICOM windows bring online eligibility to 47.

## Selection and matching

A dated listing can be a gig, event, pop-up or exhibition. A release needs an explicit order/lottery window or source evidence of a limited edition. Ordinary shop listings and manufacturer shipping notices are excluded even if a listing description contains the word limited. Physical retailer lotteries do not become online drops merely because they have a web page.

Qloo hydrates user interests and resolves music artists. Direct names and specific genre matches rank ahead of broad family links. Broad connections keep their weaker wording. Source variety and upcoming dates shape discovery within those tiers. Long-running exhibitions receive a small duration penalty rather than crowding out short windows.

The Nujabes check returned a Kota the Friend gig with shared Jazz Hop evidence, alongside broader online listening-party connections. Source-derived artist, genre and English detail excerpts are used when available. A booking contact after INFO is excluded from artist lists.

## Persistence and boundaries

Online source results use the existing event catalog table. Request-triggered checks refresh their source cache after one hour. Expanded catalog refreshes also collect the new sources. Original timestamps remain on retained records after failures.

The UI offers Everything, Events & pop-ups, Limited drops, an access selector, deadline ordering, optional exact-name taste input, source links and browser-local saves. No persona, radius or date form is required. Tokyo walking quests and full catalog tools remain accessible.

These are functional and source checks, not human recommendation ratings or measured social hype. Online booking, subscriptions, product stock, shipping regions and physical access still depend on the source. No paid X API or new account access was used.
