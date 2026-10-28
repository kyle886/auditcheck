import { normalizeName } from './normalize-name.mjs';

// SEC company_tickers.json: { "0": { cik_str, ticker, title }, ... }
export function assertSecShape(sec) {
  if (!sec || typeof sec !== 'object' || Array.isArray(sec)) {
    throw new Error('SEC payload is not an object');
  }
  const entries = Object.values(sec);
  if (entries.length === 0) throw new Error('SEC payload is empty');
  const bad = entries.find(e => !e || typeof e.ticker !== 'string' || typeof e.title !== 'string');
  if (bad !== undefined) throw new Error('SEC payload entry missing ticker/title');
  return entries;
}

export function buildTickerMap(sec) {
  const map = new Map();
  const ambiguous = new Set();
  for (const entry of assertSecShape(sec)) {
    const key = normalizeName(entry.title);
    const ticker = entry.ticker.toUpperCase();
    if (ambiguous.has(key)) continue;
    if (!map.has(key)) {
      map.set(key, ticker);
    } else if (map.get(key) !== ticker) {
      map.delete(key);
      ambiguous.add(key);
    }
  }
  return { map, ambiguous };
}

// Mutates rows in place; never overwrites a non-empty ticker.
export function backfillRows(rows, { map, ambiguous }) {
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
  return { filled, skippedAmbiguous, stillEmpty, uniqueTickersAfter };
}
