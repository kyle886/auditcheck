import { describe, expect, it } from 'vitest';
import { assertSecShape, backfillRows, buildTickerMap } from '../tools/lib/backfill.mjs';

const sec = {
  '0': { cik_str: 320193, ticker: 'aapl', title: 'Apple Inc.' },
  '1': { cik_str: 789019, ticker: 'MSFT', title: 'MICROSOFT CORP' },
  '2': { cik_str: 1, ticker: 'FOOA', title: 'Foo Holdings' },
  '3': { cik_str: 2, ticker: 'FOOB', title: 'Foo Group' },
  '4': { cik_str: 3, ticker: 'BAR', title: 'Bar Inc' },
  '5': { cik_str: 3, ticker: 'BAR', title: 'Bar Corp' },
};

describe('assertSecShape', () => {
  it('accepts the SEC company_tickers.json shape', () => {
    expect(assertSecShape(sec)).toHaveLength(6);
  });

  it.each([
    ['null', null],
    ['array', []],
    ['empty object', {}],
    ['html error page string', '<html>Request Rate Threshold Exceeded</html>'],
    ['entry missing title', { '0': { ticker: 'X' } }],
  ])('rejects %s', (_, payload) => {
    expect(() => assertSecShape(payload)).toThrow();
  });
});

describe('buildTickerMap', () => {
  it('keys by normalized name and uppercases tickers', () => {
    const { map } = buildTickerMap(sec);
    expect(map.get('apple')).toBe('AAPL');
    expect(map.get('microsoft')).toBe('MSFT');
  });

  it('marks names that normalize to different tickers as ambiguous', () => {
    const { map, ambiguous } = buildTickerMap(sec);
    expect(ambiguous.has('foo')).toBe(true);
    expect(map.has('foo')).toBe(false);
  });

  it('does not treat repeated identical tickers as ambiguous', () => {
    const { map, ambiguous } = buildTickerMap(sec);
    expect(map.get('bar')).toBe('BAR');
    expect(ambiguous.has('bar')).toBe(false);
  });

  it('keeps a name ambiguous even if a later entry repeats the first ticker', () => {
    const { map, ambiguous } = buildTickerMap({
      '0': { ticker: 'A', title: 'Dup Inc' },
      '1': { ticker: 'B', title: 'Dup Corp' },
      '2': { ticker: 'A', title: 'Dup' },
    });
    expect(ambiguous.has('dup')).toBe(true);
    expect(map.has('dup')).toBe(false);
  });
});

describe('backfillRows', () => {
  it('fills empty tickers, skips ambiguous, never overwrites, and reports stats', () => {
    const rows = [
      ['PwC', 'Apple Inc', '', '1/1/2024'],
      ['EY', 'Microsoft Corporation', '', '1/1/2024'],
      ['KPMG', 'Foo Holdings', '', '1/1/2024'],
      ['Deloitte', 'Unknown Fund Trust', '', '1/1/2024'],
      ['PwC', 'Apple Inc', 'KEEP', '1/1/2024'],
    ];
    const stats = backfillRows(rows, buildTickerMap(sec));
    expect(rows.map(r => r[2])).toEqual(['AAPL', 'MSFT', '', '', 'KEEP']);
    expect(stats).toEqual({ filled: 2, skippedAmbiguous: 1, stillEmpty: 2, uniqueTickersAfter: 3 });
  });
});
