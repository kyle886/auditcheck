import { readFileSync, writeFileSync } from 'node:fs';
import { normalizeName } from './lib/normalize-name.mjs';

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

const sec = await res.json();
const rows = JSON.parse(readFileSync(dataPath, 'utf8'));

const map = new Map();
const ambiguous = new Set();
for (const entry of Object.values(sec)) {
  const key = normalizeName(entry.title);
  const ticker = String(entry.ticker).toUpperCase();
  if (ambiguous.has(key)) continue;
  if (!map.has(key)) {
    map.set(key, ticker);
  } else if (map.get(key) !== ticker) {
    map.delete(key);
    ambiguous.add(key);
  }
}

let filled = 0;
let skippedAmbiguous = 0;
let stillEmpty = 0;

for (const row of rows) {
  if (row[2] !== '') continue;
  const key = normalizeName(row[1]);
  if (ambiguous.has(key)) {
    skippedAmbiguous++;
    stillEmpty++;
    continue;
  }
  const ticker = map.get(key);
  if (ticker) {
    row[2] = ticker;
    filled++;
  } else {
    stillEmpty++;
  }
}

const uniqueTickersAfter = new Set(rows.filter(r => r[2]).map(r => r[2].toUpperCase())).size;

if (!dry) {
  writeFileSync(dataPath, JSON.stringify(rows));
}

console.log(JSON.stringify({ filled, skippedAmbiguous, stillEmpty, uniqueTickersAfter }));
