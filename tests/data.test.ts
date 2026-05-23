import { describe, expect, it } from 'vitest';
import { buildIndex, stripSuffixes } from '../src/data';
import type { Row } from '../src/types';

const row = (firm: Row[0], name: string, ticker: string, date: string): Row =>
  [firm, name, ticker, date] as Row;

describe('stripSuffixes', () => {
  it('strips a trailing "inc"', () => {
    expect(stripSuffixes('apple inc')).toBe('apple');
  });

  it('strips a trailing "inc." with period', () => {
    expect(stripSuffixes('apple inc.')).toBe('apple');
  });

  it('strips multiple trailing suffix tokens', () => {
    expect(stripSuffixes('microsoft corporation holdings')).toBe('microsoft');
  });

  it('does not strip a single-word name even if it is a suffix', () => {
    expect(stripSuffixes('inc')).toBe('inc');
  });

  it('does not strip mid-name suffix tokens', () => {
    expect(stripSuffixes('inc holdings apple')).toBe('inc holdings apple');
  });

  it('leaves names without suffixes unchanged', () => {
    expect(stripSuffixes('berkshire hathaway')).toBe('berkshire hathaway');
  });
});

describe('buildIndex', () => {
  it('groups rows into byF by firm', () => {
    const rows: Row[] = [
      row('PwC', 'A Inc', 'A', '1/1/2024'),
      row('Deloitte', 'B Corp', 'B', '1/1/2024'),
      row('PwC', 'C Inc', 'C', '1/1/2024'),
    ];
    const { byF } = buildIndex(rows);
    expect(byF.PwC).toHaveLength(2);
    expect(byF.Deloitte).toHaveLength(1);
  });

  it('builds a t2f map keyed by uppercased ticker', () => {
    const rows: Row[] = [
      row('PwC', 'Apple Inc', 'aapl', '1/1/2024'),
      row('EY', 'Apple Inc', 'AAPL', '1/1/2024'),
    ];
    const { t2f } = buildIndex(rows);
    expect([...t2f.AAPL!].sort()).toEqual(['EY', 'PwC']);
  });

  it('skips empty tickers in t2f', () => {
    const rows: Row[] = [row('PwC', 'Some Fund', '', '1/1/2024')];
    const { t2f } = buildIndex(rows);
    expect(Object.keys(t2f)).toHaveLength(0);
  });

  it('dedupes same (firm, name, ticker) across years', () => {
    const rows: Row[] = [
      row('PwC', 'X Co', 'X', '1/1/2022'),
      row('PwC', 'X Co', 'X', '1/1/2023'),
      row('PwC', 'X Co', 'X', '1/1/2025'),
    ];
    const { byF } = buildIndex(rows);
    expect(byF.PwC).toHaveLength(1);
    const r = byF.PwC![0];
    expect(r.yMin).toBe(2022);
    expect(r.yMax).toBe(2025);
  });

  it('preserves first-occurrence order across dedupe', () => {
    const rows: Row[] = [
      row('PwC', 'Alpha', 'AL', '1/1/2024'),
      row('PwC', 'Beta', 'BE', '1/1/2024'),
      row('PwC', 'Alpha', 'AL', '1/1/2025'),
      row('PwC', 'Gamma', 'GA', '1/1/2024'),
    ];
    const { byF } = buildIndex(rows);
    expect(byF.PwC!.map(r => r[1])).toEqual(['Alpha', 'Beta', 'Gamma']);
  });

  it('attaches a stripped lowercased name at index 4', () => {
    const rows: Row[] = [row('PwC', 'Apple Inc.', 'AAPL', '1/1/2024')];
    const { byF } = buildIndex(rows);
    expect(byF.PwC![0][4]).toBe('apple');
  });

  it('computes yearMin / yearMax across all rows', () => {
    const rows: Row[] = [
      row('PwC', 'A', 'A', '1/1/2022'),
      row('EY', 'B', 'B', '1/1/2026'),
      row('Deloitte', 'C', 'C', '1/1/2024'),
    ];
    const { yearMin, yearMax } = buildIndex(rows);
    expect(yearMin).toBe(2022);
    expect(yearMax).toBe(2026);
  });
});
