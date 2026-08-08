const SUFFIXES = new Set([
  'inc', 'inc.', 'corp', 'corp.', 'corporation', 'co', 'co.', 'company',
  'ltd', 'ltd.', 'limited', 'llc', 'l.l.c.', 'plc', 'n.v.', 's.a.', 'ag',
  'holdings', 'group',
]);

export function normalizeName(s) {
  const w = String(s).trim().toLowerCase().split(/\s+/);
  while (w.length > 1 && SUFFIXES.has(w[w.length - 1])) w.pop();
  return w.join(' ');
}
