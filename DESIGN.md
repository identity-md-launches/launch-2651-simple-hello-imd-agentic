# DESIGN.md: Hello, IMD agentic world

## Overview

A single page that says hello to the IMD agentic world and greets the visitor by name. The brief
asked for **0 styling**, so the design system is the browser's default stylesheet. The source has
no CSS file, no `style` attributes, no class names and no CSS-in-JS. Hierarchy comes from semantic
HTML alone: one `h1`, one `h2`, paragraphs, a labelled form and an ordered list.

That is the rule for any future page: add structure with HTML elements and let the user agent
render them. Adding a stylesheet would break the brief, not extend the system.

Source of truth: `index.html`, `src/App.tsx`, `src/BreakableName.tsx`, `src/greeting.ts`,
`public/`. There are no tokens, theme files or design dependencies.

## Colors

No colors are declared. What renders are the user agent defaults (Chromium values from the render):

| Role | Value | Source |
| --- | --- | --- |
| Page background | Canvas (white in light mode) | browser default |
| Text | CanvasText (black) | browser default |
| Field and button chrome | Field/ButtonFace system colors | browser default |
| Focus ring | browser default `:focus-visible` outline | browser default |

There is no accent, status ramp or dark theme. The page has no `color-scheme` declaration, so it
renders light in every mode. The taste@1 probe measured all text at 4.5:1 or better in Chromium (see
`artifacts/validation.md`). The favicon (`public/favicon.svg`) is a white serif "H" on a black square.
The share image (`public/og.png`, 1200×630) is black serif text on white, matching the page.

## Typography

No fonts are loaded or declared. The page uses the default serif (Times New Roman in the Chromium
used for checks). Form controls use the browser's control font (Arial at 13.33px in Chromium).
Sizes measured by the probe at 390 and 1440 wide:

| Role | Element | Size | Weight |
| --- | --- | --- | --- |
| Page title | `h1` (`src/App.tsx:32`) | 32px (2em) | 700 |
| Section title | `h2` (`src/App.tsx:67`) | 24px (1.5em) | 700 |
| Body, label, status, list | `p`, `label`, `li` | 16px | 400 |
| Control text | `input`, `button` | 13.33px (shown as 13.5px by the probe) | 400 |

That is four sizes, two weights and two families. Line height is the default `normal`. With no
measure cap, lines run the full width at 1440. That trade-off comes from the brief.

Wrapping: since there is no `overflow-wrap`, `BreakableName` (`src/BreakableName.tsx:5`) inserts
`<wbr>` every `BREAK_EVERY` = 16 characters (`src/greeting.ts:4`). A long unbroken name then wraps
at 320 wide, with no added characters and nothing hidden.

## Layout

Normal flow, one column, browser default margins: 8px around `body`, 1em between paragraphs, and
the default heading margins. There are no breakpoints. The page adapts because block elements fill
the viewport width and text wraps. `<meta name="viewport" content="width=device-width,
initial-scale=1">` (`index.html:5`) makes phones use the device width and does not limit zoom.

Reading order equals DOM order: title, one-line description, name field, Say hello button, greeting
status, then the list of hellos and its note. At 390×844 the title, field and button are all on the
first screen, and the full empty page fits within roughly 300px of height.

Controls each sit in their own paragraph (`src/App.tsx:36`, `src/App.tsx:54`), so the field and
button are separated by 1em rather than crowded on one line.

## Elevation & Depth

Flat. No shadows, borders or layers beyond the native borders of the input and button.

## Shapes

Only the native control shapes (the browser's default input and button border and radius).

## Components

**Hello form** (`src/App.tsx:35-57`): a native `<form>` with `noValidate` and `onSubmit`.
- Field: visible `<label htmlFor>` "Your name", `type="text"`, `autoComplete="given-name"`,
  `maxLength` 60 (`NAME_MAX_LENGTH`, `src/greeting.ts:1`), with the example placeholder "Ada".
- Button: native `<button type="submit">` "Say hello". Enter in the field submits too.
- Valid submit: the name is trimmed and its inner whitespace collapsed (`cleanName`,
  `src/greeting.ts:7`). The greeting appears in the status, the name is added to the list and the
  field clears.
- Blank submit: the error "Type your name, then press Say hello." appears under the field
  (`src/App.tsx:53`). The field gets `aria-invalid="true"` and `aria-describedby` pointing at the
  error, and focus returns to it. The error clears on the next valid hello.

**Greeting status** (`src/App.tsx:59-65`): a `<p role="status">` that is always rendered, empty
until the first hello, so screen readers get polite announcements from a stable region.

**Hellos list** (`src/App.tsx:67-79`): `h2` "Hellos on this page", then either the empty state
"No hellos yet. Say hello above to add the first." or an `<ol reversed>`, newest first with
descending numbers. A note always says where the data lives: "This list stays in this tab and
clears when you reload." It is React state only, with no storage or network.

**BreakableName** (`src/BreakableName.tsx`): renders visitor text with `<wbr>` break chances. Use it
anywhere visitor text is shown.

## Do's and Don'ts

- Do add content with semantic elements (`h2`, `p`, `ol`, `label`, `button`) and keep one `h1`.
- Do use native controls with visible labels. Keep error text next to its field, linked by
  `aria-describedby`.
- Do render any visitor-supplied text through `BreakableName`.
- Don't add CSS, `style` props, class names or a font: the brief asks for 0 styling.
- Don't imply shared or saved data. The list belongs to this tab only, and the page says so.

Recipe for one more page: add a section to `src/App.tsx` (or a hash-routed view, since the export is
static) as an `h2` plus paragraphs or native controls. Run `npm run build`, then
`node scripts/check-interactions.mjs` and the taste probe, as described in `README.md`.
