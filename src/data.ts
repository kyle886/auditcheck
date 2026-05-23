import type { ByFirm, Firm, Row, Ticker2Firms } from './types';

const SUFFIXES = new Set([
  'inc', 'inc.', 'corp', 'corp.', 'corporation', 'co', 'co.', 'company',
  'ltd', 'ltd.', 'limited', 'llc', 'l.l.c.', 'plc', 'n.v.', 's.a.', 'ag',
  'holdings', 'group',
]);

export function stripSuffixes(s: string): string {
  const w = s.trim().split(/\s+/);
  while (w.length > 1 && SUFFIXES.has(w[w.length - 1])) w.pop();
  return w.join(' ');
}

export interface BuiltIndex {
  byF: ByFirm;
  t2f: Ticker2Firms;
  yearMin: number;
  yearMax: number;
}

export function buildIndex(rows: Row[]): BuiltIndex {
  const byF: ByFirm = {};
  const t2f: Ticker2Firms = {};
  const years: number[] = [];
  for (const r of rows) {
    const f = r[0], t = r[2], d = r[3];
    (byF[f] ||= []).push(r);
    if (t) {
      const u = t.toUpperCase();
      (t2f[u] ||= new Set()).add(f);
    }
    r[4] = stripSuffixes(r[1].toLowerCase());
    const y = +d.split('/')[2];
    if (y) years.push(y);
  }
  for (const f of Object.keys(byF) as Firm[]) {
    const seen = new Map<string, Row>();
    const out: Row[] = [];
    for (const r of byF[f]!) {
      const y = +r[3].split('/')[2] || 0;
      const k = r[1] + '\x00' + r[2];
      const x = seen.get(k);
      if (x) {
        if (y && y < (x.yMin ?? Infinity)) x.yMin = y;
        if (y && y > (x.yMax ?? -Infinity)) x.yMax = y;
        continue;
      }
      r.yMin = y;
      r.yMax = y;
      seen.set(k, r);
      out.push(r);
    }
    byF[f] = out;
  }
  return {
    byF,
    t2f,
    yearMin: years.length ? Math.min(...years) : 0,
    yearMax: years.length ? Math.max(...years) : 0,
  };
}

export async function loadData(): Promise<Row[]> {
  const url = import.meta.env.BASE_URL + 'data.json';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load ' + url + ': ' + res.status);
  return (await res.json()) as Row[];
}
