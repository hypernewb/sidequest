# Announcement importer extension

Operate mode; extend the established SideQuest paper field guide. User asked to paste an announcement link, pull details, translate Japanese, and match it to taste. First surface: public source URL, optional pasted-text recovery, and one Read action. Result: editable title/type, ruled evidence rows for dates/place/price/method, expandable original/English notes, direct-interest match and optional exact-entity Qloo confirmation. Save imports separately from curated official announcements.

Signature behavior: a Japanese announcement becomes reviewable English evidence with its original retained; a confirmed cultural target connects to the user's existing taste. UI must name missing facts, inaccessible sources, machine translation and candidate status honestly. Never silently infer dates or product fit. All source HTML is treated as data. No new visual world, assets or tokens; use existing serif headings, paper, ink, red controls, moss selection and open ruled rows. Desktop 1440x1000 and mobile 390x844 viewport crops are evidence rather than full-page captures.

Quality bar: discoverable from Drops & pop-ups; real official page extraction/translation; public X reading with explicit text fallback; editable evidence; safe bounded reads; direct versus Qloo match distinction; correct browser-local Saved integration and reload; readable mobile fields with no overflow. The source reader supports a finite host list, not unrestricted web crawling; full short posts and selected long-page excerpts are translated subject to the free provider quota.

## Implemented boundary · 2026-10-23

`components/announcement-inbox.tsx` implements the URL/text form, editable review, source disclosures and separate Saved rows. Dates, location, price and attendance/purchase method use a ruled definition list; absent fields say they were not found. Original and English reading notes remain expandable. Edits are marked as user edits. Source provenance distinguishes an official page, public X embed and supplied text; none becomes editor-checked inventory by saving it.

`app/globals.css` extends existing rules without adding root tokens: serif review titles, paper canvas, soft-white fields, red actions/disclosures and pale moss Qloo feedback. Evidence uses 12–13px text; reading notes use 13px with 1.75 line height. At 640px and below the evidence label/value columns stack and the save action fills its row. These are surface patterns, not replacements for `DESIGN.md` or `.impeccable/design.json`.

The reader uses bounded allowlisted official reads or public X oEmbed; supplied text bypasses source fetching. It does not read announcement images. MyMemory receives Japanese title/evidence excerpts under the per-import budget; source text survives incomplete translation. Direct interest mentions and an explicitly chosen exact Qloo target remain separate. The live association is review feedback, not a saved endorsement. Imports remain browser-local, capped at 30 and deduplicated by canonical URL, with removal in Saved. No stock, booking, monitoring or inferred map location is added.

Verification for this documentation pass was source inspection of the component, stylesheet, reader, schema and announcement routes. Runtime/browser evidence and automated checks belong to the implementation review; this pass did not rerun them.
