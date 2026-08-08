import { readFileSync, writeFileSync } from 'node:fs';
import { normalizeName } from './lib/normalize-name.mjs';

const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const dataIdx = args.indexOf('--data');
const dataPath = dataIdx >= 0 && args[dataIdx + 1] ? args[dataIdx + 1] : 'public/data.json';

const UA = 'AuditCheckDataBot/1.0 (github.com/kyle886/auditcheck)';
const UA_FALLBACK = 'AuditCheckDataBot/1.0 (kyle886/auditcheck)';

const rows = JSON.parse(readFileSync(dataPath, 'utf8'));

let res = await fetch('https://www.sec.gov/files/company_tickers.json', {
  headers: { 'User-Agent': UA },
});
if (res.status === 403) {
  res = await fetch('https://www.sec.gov/files/company_tickers.json', {
    headers: { 'User-Agent': UA_FALLBACK },
  });
}
if (!res.ok) throw new Error('SEC fetch failed: ' + res.status);
const sec = await res.json();

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
