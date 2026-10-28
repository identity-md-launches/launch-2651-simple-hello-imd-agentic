# Hello, IMD agentic world

A simple hello page for the IMD agentic world, with **0 styling** as the brief asks. It ships no
CSS at all, so everything renders with the browser's default styles. Type your name, press
**Say hello** (or Enter), and the page greets you back by name. It also lists every hello made in
this tab. The list lives in memory only and clears when you reload.

Built with Vite, React and TypeScript. The finished static export is committed in `dist/`.

## Install

```sh
npm ci
```

Requires Node 20.19+ or 22.12+ (checked with Node 24.22.1 and npm 11.19.1).

## Preview

```sh
npm run dev       # development server with hot reload
npm run preview   # serves the built dist/ locally
```

`dist/` is a plain static site, so any static file server works too. Vite's `base` is `./`, which
keeps every asset URL relative (`./assets/…`, `./favicon.svg`, `./og.png`). The site therefore
works from a subpath such as an IPFS gateway or an ENS name. It is a single page with no routes.

## Rebuild

```sh
npm run build      # tsc --noEmit, then vite build into dist/
npm run typecheck  # type check only
```

Commit the regenerated `dist/` along with the source: the publisher serves the committed export
and does not rebuild.

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | Page shell: title, description, favicon, Open Graph and Twitter card tags |
| `src/App.tsx` | The page: heading, hello form, greeting status, list of hellos |
| `src/BreakableName.tsx` | Renders a name with `<wbr>` so long names wrap without CSS |
| `src/greeting.ts` | Name cleanup, length cap, break-chunk size |
| `public/favicon.svg`, `public/og.png` | Favicon and 1200×630 share image |
| `scripts/check-interactions.mjs` | Browser interaction check for the built export |
| `dist/` | Production export (committed) |
| `DESIGN.md` | Design documentation of the implemented page |
| `artifacts/validation.md` | Review coverage, findings, fixes and check results |

## Checks

The interaction check serves `dist/` under `/preview/` and drives it in Playwright. It covers the
first-screen layout at 390×844, keyboard order, blank-name error, Enter and click submits, newest
first ordering, the 60-character cap, wrapping of a long unbroken name at 320, horizontal overflow at
320/390/1440, and console or network errors. Playwright is not a site dependency, so point the
script at an installed copy:

```sh
npm run build
PLAYWRIGHT_MODULE=/path/to/node_modules/playwright/index.mjs node scripts/check-interactions.mjs [screenshot-dir]
```

### Results recorded for this build (2026-10-28)

| Command | Result |
| --- | --- |
| `npm run build` | Passed: `tsc --noEmit` clean, vite 8.3.5 built `dist/index.html` (1.22 kB) and `dist/assets/index-*.js` (221 kB, 69 kB gzip) |
| `npm run typecheck` | Passed, exit 0 |
| `node scripts/check-interactions.mjs` (Chromium) | 23/23 checks passed |
| same script, WebKit | **Not run**: WebKit downloaded, but this machine lacks its system libraries (libgtk-4, libgstreamer and others), so it would not launch |
| taste@1 probe (`.imd/reads/skills/design-critic/scripts/taste.mjs`) | 16/16 checks passed at 320, 390 and 1440 |

Limitations: these checks ran only in headless Chromium. Safari/WebKit, physical phones, a screen
reader session and native 200% browser zoom were not tested. Because of the brief's 0-styling
rule, the browser-default input text is 13.33px, so iOS Safari may zoom in when the field is
focused. The default controls measure 21px tall, under the 44px comfortable touch size. They sit 16px
apart, which meets the WCAG 2.5.8 spacing exception. Details are in `artifacts/validation.md`.
