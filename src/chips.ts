import type { Firm, Ticker2Firms } from './types';

export function tickerRestricted(t: string, firm: Firm | null, t2f: Ticker2Firms): boolean {
  if (!firm) return false;
  const base = t.split(/[.\-]/)[0];
  const alt = t.replace(/-/g, '.');
  return (
    (t2f[t] || new Set()).has(firm) ||
    (t2f[alt] || new Set()).has(firm) ||
    (t2f[base] || new Set()).has(firm)
  );
}

export interface ChipsOpts {
  port: string[];
  firm: Firm | null;
  t2f: Ticker2Firms;
  chipsEl: HTMLElement;
  sumEl: HTMLElement;
}

export function doChips({ port, firm, t2f, chipsEl, sumEl }: ChipsOpts): void {
  if (!port.length) {
    sumEl.style.display = 'none';
    sumEl.textContent = '';
    return;
  }
  let bads = 0;
  chipsEl.innerHTML = port.map(t => {
    const bad = tickerRestricted(t, firm, t2f);
    if (bad) bads++;
    return '<span class="chip ' + (bad ? 'bad' : 'ok') + '">' +
      (bad ? '&#x26A0;' : '&#x2713;') + '&nbsp;' + t +
      '<span class="sr"> ' + (bad ? 'restricted' : 'permitted') + '</span></span>';
  }).join('');
  if (!firm) {
    sumEl.style.display = 'none';
    sumEl.textContent = '';
    return;
  }
  sumEl.style.display = 'block';
  sumEl.style.color = bads ? 'var(--red)' : 'var(--grn)';
  sumEl.innerHTML = (bads ? '&#x26A0; ' : '&#x2713; ') +
    bads + ' of ' + port.length + ' tickers restricted by ' + firm;
}
