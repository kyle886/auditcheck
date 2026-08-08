# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

AuditCheck is a static PWA that helps Big-Four (PwC, Deloitte, EY, KPMG) personnel quickly check whether a stock they're thinking about buying is one their firm audits — i.e. an issuer that would land on the firm's personal-independence restricted list. The user picks their firm, then either searches a single ticker / company name or pastes / uploads a portfolio; tickers that match an issuer audited by the selected firm are flagged.

The app is built with **Vite + TypeScript** (no framework) and deployed to Vercel. The PCAOB dataset (~11k rows) ships as `public/data.json`, fetched at load. Portfolio data never leaves the browser.

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
2. **PCAOB AuditorSearch's bulk download does not include the ticker field** — tickers in `public/data.json` were joined in from another source. Many rows still have an empty ticker (funds and other issuers with no listed common stock); those rows render with an em-dash and won't match anything from a pasted portfolio.
3. **No "covered person" scoping, no family-account handling, no indirect-interest analysis.** The app is a fast lookup, not a compliance system. Any user-facing wording (in `src/index.html` or future docs) should keep the disclaimer that users must still confirm against their firm's internal restricted list — the existing footer already says this and shouldn't be weakened.

## Running locally

```
npm install
npm run dev      # Vite dev server (port 5173)
npm test         # Vitest unit tests
npm run build    # Type-check + production build into dist/
```

## Architecture

```
src/
  index.html        shell only (markup, meta tags, mount point — no inline JS)
  main.ts           entry — loads data.json, builds indexes, wires events
  styles.css        all CSS
  types.ts          Firm, Row, ByFirm, Ticker2Firms
  parse.ts          parse() — portfolio text → tickers (handles BOM, quotes, headers)
  data.ts           loadData(), buildIndex(), stripSuffixes(), SUFFIXES
  results.ts        renderResults() — the main search results list
  chips.ts          doChips() — portfolio chips + conflict summary
  modal.ts          openModal() / closeModal()
public/
  data.json         the PCAOB row array, fetched at load
tests/
  parse.test.ts
  data.test.ts
.github/workflows/
  ci.yml            runs `npm test` + `npm run build` on every PR
```

### The data array

`public/data.json` is a JSON array of rows, each `[firm, issuer_name, ticker, date]`:
- `firm`: `"PwC" | "Deloitte" | "EY" | "KPMG"`
- `ticker`: frequently `""` (many issuers are funds / private filers with no listed ticker — these render with an em-dash placeholder and won't match a portfolio paste)
- `date`: `M/D/YYYY` string; only the year is displayed

At load, `buildIndex()` in `src/data.ts` produces:
- `byF[firm]` → deduped rows per firm, each with `yMin` / `yMax` properties for the filing-year range
- `t2f[TICKER]` → `Set<Firm>` for portfolio conflict marking
- `yearMin` / `yearMax` for the footer year range

Row dedup key: `(firm, name, ticker)`. First-occurrence order is preserved. Each retained row gets `yMin` / `yMax` from the spread of years across its duplicates.

Each row also gets `r[4]` set to a lowercased, suffix-stripped name (Inc, Corp, LLC, etc.) at index time, used by `renderResults()`'s substring match so short queries like "apple" match "Apple Inc."

### Refreshing the dataset

1. **Source rows:** Download Form AP audit-client rows for the Big Four from [PCAOB AuditorSearch](https://pcaobus.org/resources/tools/auditorsearch). Filter to PwC, Deloitte, EY, and KPMG; map each row to `[firm, issuer_name, ticker, date]` with `ticker` left `""` (AuditorSearch bulk export has no ticker column).
2. **Replace `public/data.json`:** Overwrite the file with the new array. Keep the tuple shape and minified JSON style.
3. **Backfill tickers:** Run `npm run backfill:tickers` (or `node tools/backfill-tickers.mjs --dry-run` first). The script fetches SEC `company_tickers.json` (30s timeout), matches empty tickers by normalized issuer name, and writes the file. It **never overwrites** a non-empty ticker. If a normalized name maps to more than one SEC ticker, that name is treated as ambiguous and left empty. SEC sometimes 403s User-Agents that contain `github.com`; the script retries with a shortened UA automatically.

4. **Footer years:** Do not edit year ranges by hand — `buildIndex()` derives `yearMin` / `yearMax` from filing dates at load.
5. **Verify:** `npm test` and spot-check the app. Re-deploy so Vercel serves the updated `/data.json`.
6. **Reminder:** Even after refresh, this remains a public PCAOB proxy, not any firm's internal restricted list.

### UI state (module-level vars in `main.ts`)

- `sf` — selected firm (null = picker screen). Clicking the same firm again deselects.
- `sq` — current search query, lowercased and trimmed. Matching: ticker `startsWith(sq)` OR stripped-name `includes(sq)`.
- `port` — array of uppercase tickers parsed from CSV upload or pasted text. `parse()` strips non-`[A-Za-z0-9.-]`, requires `/^[A-Z]/`, caps length at 12.

When matching a portfolio ticker against `t2f`, three forms are checked: the raw ticker, the hyphen-as-dot form (`BRK-B` → `BRK.B`), and the base symbol before `.` or `-`.

### `vercel.json`

Sets a 24h `Cache-Control` on `/data.json`. Vite handles the rest — Vercel auto-detects the project type and runs `npm run build`, serving from `dist/`.

## Editing conventions

- **Edit the smallest module that fits.** A bug in `parse()` is one file; a chip rendering tweak is one file.
- **No new frameworks or dependencies.** Vite + TypeScript + Vitest is the entire toolchain. Don't add React, Tailwind, lodash, etc. — the codebase is small enough that vanilla works.
- **Tests must stay green.** `npm test` runs in CI. New behavior in `parse()` or `data.ts` should land with a Vitest case.
- **Preserve the terse style.** Short identifiers (`sf`, `sq`, `byF`, `t2f`), no comments unless something is genuinely surprising. Types provide the readability that long names used to.
- **Row shape is fixed.** Tuples in `data.json` are `[firm, name, ticker, date]`. Don't reshape unless you have a plan for re-indexing.
- **Footer disclaimer is load-bearing.** "Always verify against your firm's internal restricted list." — that exact sentence in `src/index.html` must stay. Don't weaken or paraphrase it.
- **If you change the firm set,** update `src/types.ts` (`Firm`, `FIRMS`), the `.fb[data-f=…]` color rules in `src/styles.css`, and the picker markup in `src/index.html` together.
