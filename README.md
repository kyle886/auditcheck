# AuditCheck

AuditCheck is a static PWA for Big-Four (PwC, Deloitte, EY, KPMG) personnel to quickly check whether a stock or pasted portfolio includes issuers their firm audits — a fast lookup against PCAOB Form AP data, not a substitute for your firm's internal restricted list. Portfolio data never leaves the browser.

**Live:** [auditcheck-three.vercel.app](https://auditcheck-three.vercel.app) · PR previews deploy via Vercel on each push.

## Develop

```bash
npm install && npm run dev   # Vite dev server (port 5173)
npm test                     # Vitest unit tests
npm run build                # Type-check + production build
```

## Refresh dataset tickers

After replacing raw PCAOB rows in `public/data.json`, backfill empty tickers from SEC EDGAR:

```bash
npm run backfill:tickers              # write public/data.json
node tools/backfill-tickers.mjs --dry-run   # preview stats only
```

See [CLAUDE.md](./CLAUDE.md) for the full dataset refresh runbook (including SEC User-Agent fallback).

**Disclaimer:** Always verify against your firm's internal restricted list.
