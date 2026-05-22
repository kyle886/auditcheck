# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

AuditCheck is a single-file static PWA that lets Big-Four (PwC, Deloitte, EY, KPMG) employees check whether tickers in their personal portfolio appear on their firm's audit-restricted issuer list. Data is sourced from PCAOB AuditorSearch Form AP filings 2022–2026 (US registered public companies only).

There is no framework, no build step, no test suite, no linter, and no package manager. The entire app — HTML, CSS, JS, and the full PCAOB dataset (~11k rows) — lives inline in `index.html`. Deployment is a static upload to Vercel (`vercel.json`).

## Running locally

Open `index.html` in a browser, or serve the directory with any static server (e.g. `python3 -m http.server`). No install step.

## Architecture

Everything is in `index.html`. The structure top-to-bottom:

1. `<style>` block — terse CSS using short class names (`fb`, `sw`, `mo`, `md`, etc.) and CSS variables (`--bg`, `--s1`, `--bd`, …). Mobile-first, max-width 520px.
2. `<body>` markup — firm picker, search input, CSV/paste import, portfolio chip list, results list, paste modal.
3. `<script>` block — the single `const D = [...]` array followed by ~30 lines of vanilla JS (no modules, no framework).

### The data array `D`

Each row is `[firm, issuer_name, ticker, date]` where:
- `firm` is one of `"PwC" | "Deloitte" | "EY" | "KPMG"`
- `ticker` is frequently `""` (many issuers are funds / private filers with no listed ticker — these still render but with an em-dash placeholder)
- `date` is `M/D/YYYY` string; only the year is displayed

Two derived indexes are built once at load:
- `byF[firm]` → array of rows for that firm (drives the results list)
- `t2f[TICKER]` → `Set` of firms that audit the issuer for that ticker (drives portfolio conflict marking)

When matching a portfolio ticker against `t2f`, the ticker is normalized by `split('.')[0]` to fold share classes (e.g. `BRK.B` → `BRK`).

### UI flow (state lives in three module-level vars: `sf`, `sq`, `port`)

- `sf` — selected firm (null = picker screen). Clicking the same firm again deselects.
- `sq` — current search query, lowercased and trimmed. Matching: ticker `startsWith(sq)` OR name `includes(sq)`.
- `port` — array of uppercase tickers parsed from CSV upload or pasted text. `parse()` strips non-`[A-Za-z0-9.-]`, requires `/^[A-Z]/`, caps length at 12.

`render()` renders at most 300 result rows and appends a "+N more — refine search" hint when truncated. `doChips()` re-renders portfolio chips as bad (`.bad`) when the ticker hits `t2f[base]` for the selected firm, otherwise ok (`.ok`).

### `data.json` and `vercel.json`

`data.json` is a one-line placeholder (`SEE_BELOW`) — a relic from before the data was inlined into `index.html`. `vercel.json` only sets a `Cache-Control` header on `/data.json`. Neither is currently exercised by the app. Don't restore a fetch-from-`data.json` path without also moving the dataset out of `index.html`.

## Editing conventions

- Keep everything in `index.html`. Don't introduce a build step, bundler, or external dependencies — being a single file is the point.
- Preserve the terse style: short class/var names, single-letter helpers, no comments unless something is genuinely surprising.
- When adding rows to `D`, keep the `[firm, name, ticker, date]` shape and the `M/D/YYYY` date format.
- If you change the firm set, update both the `.fb[data-f=…]` color rules in CSS and the `<button class="fb" data-f="…">` markup in the picker.
