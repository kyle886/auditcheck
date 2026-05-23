const HDR = new Set([
  'SYMBOL', 'TICKER', 'SECURITY', 'SECURITYDESCRIPTION', 'DESCRIPTION',
  'QUANTITY', 'CUSIP', 'ACCOUNT', 'TOTAL', 'CASH',
]);

export function parse(s: string): string[] {
  s = s.replace(/^﻿/, '').replace(/"/g, '');
  const out: string[] = [];
  for (const l of s.trim().split(/[\n\r]+/)) {
    for (const p of l.split(/[,;\t ]+/)) {
      const c = p.replace(/[^A-Za-z0-9.\-]/g, '').toUpperCase();
      if (HDR.has(c)) continue;
      if (c.length >= 1 && /^[A-Z]/.test(c)) out.push(c);
    }
  }
  return out;
}
