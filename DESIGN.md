---
name: SideQuest
description: A pocket city field guide for cultural discovery in Tokyo.
colors:
  paper: "#f4f1e8"
  ink: "#242923"
  muted: "#62665c"
  line: "#d8d8ca"
  red: "#b83b2b"
  red-hover: "#982e21"
  moss: "#505e47"
  pale: "#e8eadf"
  white: "#fffdf8"
typography:
  display:
    fontFamily: "'Field Serif', Georgia, serif"
    fontSize: "76px"
    fontWeight: 400
    lineHeight: 0.99
    letterSpacing: "-2px"
  headline:
    fontFamily: "'Field Serif', Georgia, serif"
    fontSize: "48px"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-1px"
  title:
    fontFamily: "'Field Serif', Georgia, serif"
    fontSize: "28px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.4px"
  body:
    fontFamily: "'Field Sans', sans-serif"
    fontSize: "15px"
    lineHeight: 1.5
  detail:
    fontFamily: "'Field Sans', sans-serif"
    fontSize: "12px"
    lineHeight: 1.75
  control:
    fontFamily: "'Field Sans', sans-serif"
    fontSize: "13px"
    fontWeight: 500
rounded:
  field: "5px"
  dial: "12px"
  chip: "30px"
  circle: "50%"
spacing:
  compact: "7px"
  small: "12px"
  medium: "18px"
  row: "24px"
  section: "28px"
  desktop-gutter: "62px"
components:
  button-primary:
    backgroundColor: "{colors.red}"
    textColor: "{colors.white}"
    typography: "{typography.control}"
    rounded: "{rounded.field}"
    padding: "14px 17px"
  button-primary-hover:
    backgroundColor: "{colors.red-hover}"
  button-text:
    textColor: "{colors.red}"
    padding: "9px 0"
  field:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "0 30px 0 12px"
    height: "42px"
  dial:
    backgroundColor: "{colors.pale}"
    rounded: "{rounded.dial}"
    padding: "23px 28px 15px"
  dial-selected:
    backgroundColor: "{colors.moss}"
    textColor: "{colors.white}"
    rounded: "{rounded.field}"
  icon-button:
    textColor: "{colors.moss}"
    rounded: "{rounded.circle}"
    height: "40px"
    width: "40px"
  icon-button-saved:
    backgroundColor: "{colors.moss}"
    textColor: "{colors.paper}"
---

# Design System: SideQuest

## Overview

**Creative North Star: "Pocket City Field Guide"**

Warm paper, red ink and an editorial serif make discovery feel like consulting an independent city guide. Practical sans-serif controls and open ruled results keep the experience useful when planning a visit. The compass connects familiar interests with a wider cultural radius; it is a functional geometric diagram rather than venue imagery.

This records the direct-code implementation in `app/globals.css` and `app/page.tsx`, including its final cascade overrides. No approved visual comp exists. The named direction comes from `.impeccable/direction.md`; implementation values take precedence over the direction's intentions.

**Key Characteristics:**
- Paper background with restrained red actions and moss selection states.
- Oversized serif headlines paired with compact sans-serif controls.
- Open numbered result rows with inline source and evidence details.
- A desktop sidebar that becomes an inline mobile form.

## Colors

The palette combines warm print neutrals with red editorial emphasis and quiet green utility surfaces. Values in frontmatter mirror the reused root custom properties.

### Primary
- **Red ink:** Primary actions, italic headline emphasis, focus outlines and outbound cues. Its deeper hover token gives actions a visible state change.

### Secondary
- **Moss:** Selected discovery mode, saved bookmarks and supporting orientation cues.
- **Pale moss paper:** Dial surface, interest chips and hover surfaces.

### Neutral
- **Warm paper:** Continuous page canvas.
- **Near-black ink:** Primary reading text and dark toast surface.
- **Muted ink:** Explanations, metadata and supporting copy.
- **Rule gray:** Fine dividers and field borders.
- **Soft white:** Field surfaces and text on filled actions.

**The Ink Role Rule.** Use red to signal an action or editorial emphasis; use moss to show selection and supporting orientation.

## Typography

**Display Font:** Self-hosted Field Serif (DM Serif Display), with Georgia and serif fallbacks.

**Body Font:** Self-hosted Field Sans (DM Sans), with a sans-serif fallback. The CSS aliases are the normative family names; both load local WOFF2 assets with `font-display: swap`.

The serif supplies character and hierarchy. The sans carries instructions, inputs, status and evidence. Emphasized headline words use the serif's italic styling and red ink.

### Hierarchy
- **Display:** Frontmatter desktop role; steps through 68px, 60px and 59px at the implemented responsive widths.
- **Headline:** Welcome message role; varies between 36px and 48px by viewport. Results section headings use 32px by default and 33px on mobile.
- **Title:** Venue names; steps to 25px in narrower desktop layouts and 27px on mobile.
- **Body:** General page copy; introductory support copy uses a more open 1.7 line height.
- **Detail:** Source, provenance, metadata and expanded reading copy. Descriptions cap at 70ch and result reasons at 69ch; result reasons use 13px.
- **Control:** Filled action type. Sans section labels use 18px/600 by default; fields use 12px and form labels 11px/600.

**The Evidence Legibility Rule.** Keep source, detail and result metadata text at least 12px; the final stylesheet overrides earlier smaller declarations.

## Layout

The page uses a continuous paper canvas with a maximum main width of 1320px. The default workspace is a 310px input sidebar plus a flexible discovery column separated by a 62px gutter. Header content is capped at 1440px before the wide-screen override. Fine horizontal rules separate the opening statement, result rows and closing explanation.

At 1440px and below, outer margins are 60px, with a 290px sidebar and 48px gutter. At 1150px, these become 270px and 34px; at 850px, 235px and 28px with 28px page margins. Expanded details become a single column at 1150px and below.

At 640px and below, page margins are 20px and the sidebar becomes an inline form. Filters use a two-column grid. The mobile dial is placed after filters and before the submission button in the component reading order; the desktop dial is hidden. Result rows retain index, main content and a 43px action column. Details expand below the row without a modal.

**The Choice Before Search Rule.** The discovery mode must remain available before mobile submission.

## Elevation & Depth

The system is predominantly flat: paper, tonal surfaces and rules establish grouping. The dial has a pale surface; results have no individual card shells. A small soft compass-needle drop shadow gives the diagram depth. The fixed toast alone uses an ambient box shadow. Exact shadow and motion values live in the sidecar.

## Shapes

Controls use gently rounded corners; the dial has a larger radius. Interest chips are pill shaped. Save controls and compass geometry are circular. Borders are fine and quiet, while selected controls become solid moss surfaces. Open result lists use straight rules rather than rounded containers.

## Components

### Buttons

Filled primary actions use red ink, soft-white text and the field radius. The default minimum height is 46px, increasing to 49px for mobile discovery. Hover deepens the red. Text actions use red and underline on hover. Save controls use a circular outlined shape, pale hover and a solid moss saved state. Visible keyboard focus uses a 2px red outline offset by 5px. Disabled buttons reduce opacity to one half.

### Inputs / Fields

Select and date fields use soft white, a fine rule-gray border, field corners and 12px type. Height increases from 42px to 44px on mobile. Interest search is an open underline field with a 40px square search button. Focus uses a 2px moss outline offset by 2px; the caret is red. Search matches appear in a compact bordered white panel with ruled, minimum-44px rows.

### Chips

Interest chips use a pale moss surface, a muted green border, compact sans type and a pill silhouette. The final remove-button target is 40px square. Chips wrap rather than clipping long names. Evidence chips use a quieter small rectangular surface inside expanded details.

### Navigation

Discover and Saved are text buttons within the header. The active item gains ink text, stronger weight and a fine red underline at the header edge. Mobile navigation retains both labels while hiding the bookmark icon and city marker.

### Discovery Dial

A pale rounded container holds the question, supporting mode copy and three equal choices. Selected mode is solid moss with white text; hover adds a pale green fill. Choices have a minimum height of 42px, increasing to 43px on mobile. The compass needle rotates between mode positions with an eased transition. Reduced-motion preferences collapse transitions and animation and disable smooth page scrolling.

### Result Index and Details

Open, numbered, ruled rows lead with serif venue names and sans metadata. Saving and passing stay in a dedicated action column with minimum-40px controls. Expanding a title reveals the description, venue/map links, taste evidence, hours and source statement inline. Source and detail text retain the Evidence Legibility Rule.

## Do's and Don'ts

### Do:
- **Do** preserve the paper canvas, serif headlines and open ruled result index.
- **Do** keep the discovery dial before the mobile submission action.
- **Do** retain visible focus and minimum-40px compact action targets.
- **Do** keep source, detail and result metadata text at least 12px.
- **Do** respect reduced-motion preferences.

### Don't:
- **Don't** turn each result into a shadowed card; the built result pattern is an open ruled list.
- **Don't** use atmospheric or invented venue photography as evidence for a result.
- **Don't** promote the small decorative compass lettering into a reading-text style.

Not canonized: decorative compass labels and several ancillary microcopy styles remain below 12px in the source; they are not reusable reading-text roles. This documentation pass does not alter application code.
