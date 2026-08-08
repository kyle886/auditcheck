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
  const list = document.createElement('div');
  list.className = 'list';
  for (const r of fil.slice(0, 300)) {
    const n = r[1], t = r[2];
    const row = document.createElement('div');
    row.className = 'it';
    const tkSpan = document.createElement('span');
    if (t) {
      tkSpan.className = 'tk';
      tkSpan.textContent = t;
    } else {
      tkSpan.className = 'tk nt';
      tkSpan.textContent = '\u2014';
    }
    row.appendChild(tkSpan);
    const nmSpan = document.createElement('span');
    nmSpan.className = 'nm';
    nmSpan.title = n;
    nmSpan.textContent = n;
    row.appendChild(nmSpan);
    const dtSpan = document.createElement('span');
    dtSpan.className = 'dt';
    if (r.yMin) {
      dtSpan.textContent = r.yMin === r.yMax ? '' + r.yMin : r.yMin + '–' + r.yMax;
    }
    row.appendChild(dtSpan);
    list.appendChild(row);
  }
  lcEl.replaceChildren(list);
  if (fil.length > 300) {
    const more = document.createElement('p');
    more.style.textAlign = 'center';
    more.style.color = '#3a3a3a';
    more.style.fontSize = '12px';
    more.style.marginTop = '10px';
    more.textContent = '+' + (fil.length - 300) + ' more — refine search';
    lcEl.appendChild(more);
  }
}
