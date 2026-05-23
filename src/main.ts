import './styles.css';
import type { Firm, Row } from './types';
import { buildIndex, loadData } from './data';
import { parse } from './parse';
import { renderResults } from './results';
import { doChips } from './chips';
import { closeModal, openModal } from './modal';

let sf: Firm | null = null;
let sq = '';
let port: string[] = [];

const $ = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error('Missing element: #' + id);
  return el as T;
};

async function init(): Promise<void> {
  const rows = await loadData() as Row[];
  const { byF, t2f, yearMin, yearMax } = buildIndex(rows);

  $('yr').textContent = yearMin === yearMax ? '' + yearMin : yearMin + '–' + yearMax;

  document.querySelectorAll<HTMLButtonElement>('.fb').forEach(b => {
    const f = b.dataset.f as Firm;
    const c = document.createElement('span');
    c.className = 'ct';
    c.textContent = (byF[f]?.length ?? 0).toLocaleString();
    b.appendChild(c);
  });

  const re = () => renderResults({
    byF, firm: sf, query: sq,
    lcEl: $('lc'), rcEl: $('rc'),
  });
  const ch = () => doChips({
    port, firm: sf, t2f,
    chipsEl: $('chips'), sumEl: $('psum'),
  });

  document.querySelectorAll<HTMLButtonElement>('.fb').forEach(b => {
    b.addEventListener('click', () => {
      const f = b.dataset.f as Firm;
      document.querySelectorAll<HTMLButtonElement>('.fb').forEach(x => {
        x.classList.remove('on');
        x.setAttribute('aria-pressed', 'false');
      });
      if (sf === f) {
        sf = null;
        $('main').style.display = 'none';
        return;
      }
      sf = f;
      b.classList.add('on');
      b.setAttribute('aria-pressed', 'true');
      $('main').style.display = 'block';
      re();
      ch();
    });
  });

  const si = $<HTMLInputElement>('si');
  si.addEventListener('input', () => {
    sq = si.value.trim().toLowerCase();
    $('sw').classList.toggle('hv', !!sq);
    re();
  });

  $('xb-clr').addEventListener('click', () => {
    si.value = '';
    sq = '';
    $('sw').classList.remove('hv');
    re();
  });

  $('btn-import').addEventListener('click', () => $('fi').click());
  $('btn-paste').addEventListener('click', () => openModal($('mo'), $<HTMLTextAreaElement>('pa')));

  $<HTMLInputElement>('fi').addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = (v) => setPort(parse(String(v.target?.result ?? '')));
    r.readAsText(file);
    target.value = '';
  });

  $('btn-clrport').addEventListener('click', () => {
    port = [];
    $('pfsec').style.display = 'none';
    $('chips').innerHTML = '';
    const sumEl = $('psum');
    sumEl.style.display = 'none';
    sumEl.textContent = '';
  });

  $('mo').addEventListener('click', (e) => {
    if (e.target === $('mo')) closeModal($('mo'));
  });
  $('btn-mo-cancel').addEventListener('click', () => closeModal($('mo')));
  $('btn-mo-apply').addEventListener('click', () => {
    const pa = $<HTMLTextAreaElement>('pa');
    setPort(parse(pa.value));
    closeModal($('mo'));
    pa.value = '';
  });

  function setPort(tks: string[]): void {
    port = [...new Set(
      tks.map(t => t.toUpperCase().trim())
         .filter(t => t && /^[A-Z]/.test(t) && t.length <= 12)
    )];
    ch();
    $('pfsec').style.display = port.length ? 'block' : 'none';
  }
}

init().catch((err) => {
  console.error(err);
  const e = document.getElementById('err');
  if (e) {
    e.textContent = 'Failed to load dataset. Please refresh.';
    e.style.display = 'block';
  }
});
