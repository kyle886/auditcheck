# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

AuditCheck is a single-file static PWA that helps Big-Four (PwC, Deloitte, EY, KPMG) personnel quickly check whether a stock they're thinking about buying is one their firm audits — i.e. an issuer that would land on the firm's personal-independence restricted list. The user picks their firm, then either searches a single ticker / company name or pastes / uploads a portfolio; tickers that match an issuer audited by the selected firm are flagged.

There is no framework, no build step, no test suite, no linter, and no package manager. The entire app — HTML, CSS, JS, and the full PCAOB dataset (~11k rows) — lives inline in `index.html`. Deployment is a static upload to Vercel (`vercel.json`).

## Regulatory context (why this app exists)

Auditor independence is governed by overlapping rule sets:

- **SEC Regulation S-X, Rule 2-01** — prohibits an accounting firm and its "covered persons" from holding a direct or material indirect financial interest in an audit client. Rule 2-01(f)(11) defines covered persons and Rule 2-01(c)(1) requires firms to maintain automated systems that flag impermissible investments by partners and managerial employees.
- **AICPA Code of Professional Conduct** — applies the "covered member" concept; independence is impaired if a covered member, their spouse / spousal equivalent, or a dependent holds a direct financial interest in an attest client.
- **PCAOB Rule 3211** — requires every PCAOB-registered firm to file a **Form AP** for each issuer audit report, naming the engagement partner and other participating firms. These filings are aggregated in the public **PCAOB AuditorSearch** database — the source of this app's dataset.

What this means for users in practice:

- Each Big-Four firm publishes an internal **restricted entity list** (often surfaced through systems like Deloitte's GIMS or EY's GMS). Covered personnel must check it **before** any trade in their own or an immediate family member's account. The firm's internal list — not this app — is the authoritative source.
- Restrictions extend to **immediate family** (spouse / spousal equivalent / dependents) and to **indirect interests** (e.g. holding shares of an audit client through a self-directed brokerage account). Passive, broad-market ETFs and mutual funds where the employee doesn't pick the holdings are generally *not* restricted, even if they include an audit client.
- Scope of who is "covered" varies by role (partners and managers vs. staff, client-facing vs. not) and by which member firm employs them. This app does not model role-based scope — it treats every issuer audited by the selected firm as potentially restricted.

### Limits of the PCAOB-derived dataset

Future agents should not over-promise what this tool can do:

1. **Public proxy, not the firm's list.** The dataset is built from Form AP filings, which cover SEC-registered issuer audits only. It will miss private-company audits, non-issuer assurance work, affiliate / portfolio-company restrictions, prospective clients, and any internal additions a firm makes to its own restricted list.
2. **PCAOB AuditorSearch's bulk download does not include the ticker field** — tickers in the inlined `D` array were joined in from another source. Many rows still have an empty ticker (funds and other issuers with no listed common stock); those rows render with an em-dash and won't match anything from a pasted portfolio.
3. **No "covered person" scoping, no family-account handling, no indirect-interest analysis.** The app is a fast lookup, not a compliance system. Any user-facing wording (in `index.html` or future docs) should keep the disclaimer that users must still confirm against their firm's internal restricted list — the existing footer already says this and shouldn't be weakened.

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
