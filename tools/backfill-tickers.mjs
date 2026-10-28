import { readFileSync, writeFileSync } from 'node:fs';
import { backfillRows, buildTickerMap } from './lib/backfill.mjs';

const SEC_URL = 'https://www.sec.gov/files/company_tickers.json';
const FETCH_MS = 30_000;
// SEC rejects some User-Agents containing "github.com"; fall back if we get 403.
const UA = 'AuditCheckDataBot/1.0 (github.com/kyle886/auditcheck)';
const UA_FALLBACK = 'AuditCheckDataBot/1.0 (kyle886/auditcheck)';

const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const dataIdx = args.indexOf('--data');
let dataPath = 'public/data.json';
if (dataIdx >= 0) {
  const p = args[dataIdx + 1];
  if (!p || p.startsWith('-')) {
    console.error('error: --data requires a path');
    process.exit(1);
  }
  dataPath = p;
}

async function fetchSec(ua) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_MS);
  try {
    return await fetch(SEC_URL, {
      headers: { 'User-Agent': ua },
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

let res;
try {
  res = await fetchSec(UA);
  if (res.status === 403) res = await fetchSec(UA_FALLBACK);
} catch (err) {
  const msg = err?.name === 'AbortError' ? 'timed out after ' + FETCH_MS + 'ms' : String(err?.message || err);
  console.error('error: SEC fetch failed: ' + msg);
  process.exit(1);
}
if (!res.ok) {
  console.error('error: SEC fetch failed: ' + res.status);
  process.exit(1);
}

let index;
try {
  index = buildTickerMap(await res.json());
} catch (err) {
  console.error('error: unexpected SEC response: ' + String(err?.message || err));
  process.exit(1);
}
const rows = JSON.parse(readFileSync(dataPath, 'utf8'));
const stats = backfillRows(rows, index);

if (!dry) {
  writeFileSync(dataPath, JSON.stringify(rows));
}

console.log(JSON.stringify(stats));
