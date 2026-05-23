import type { ByFirm, Firm, Row } from './types';

export interface RenderOpts {
  byF: ByFirm;
  firm: Firm | null;
  query: string;
  lcEl: HTMLElement;
  rcEl: HTMLElement;
}

export function renderResults({ byF, firm, query, lcEl, rcEl }: RenderOpts): void {
  if (!firm) return;
  const data = byF[firm] || [];
  const fil = query
    ? data.filter((r: Row) => {
        const t = r[2];
        const sn = r[4] ?? '';
        return (t && t.toLowerCase().startsWith(query)) || sn.includes(query);
      })
    : data;
  rcEl.textContent = fil.length.toLocaleString() + ' issuers';
  if (!fil.length) {
    lcEl.innerHTML =
      '<div style="text-align:center;padding:50px 20px;color:#666"><div style="font-size:32px;margin-bottom:10px">&#x1F50D;</div><p>No matches</p></div>';
    return;
  }
  const rows = fil.slice(0, 300).map((r: Row) => {
    const n = r[1], t = r[2];
    const tkEl = t ? '<span class="tk">' + t + '</span>' : '<span class="tk nt">&mdash;</span>';
    const yr = r.yMin ? (r.yMin === r.yMax ? '' + r.yMin : r.yMin + '–' + r.yMax) : '';
    return '<div class="it">' + tkEl + '<span class="nm" title="' + n + '">' + n + '</span><span class="dt">' + yr + '</span></div>';
  }).join('');
  const more = fil.length > 300
    ? '<p style="text-align:center;color:#3a3a3a;font-size:12px;margin-top:10px">+' + (fil.length - 300) + ' more — refine search</p>'
    : '';
  lcEl.innerHTML = '<div class="list">' + rows + '</div>' + more;
}
