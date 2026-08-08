import { describe, expect, it } from 'vitest';
import { tickerRestricted } from '../src/chips';
import type { Firm, Ticker2Firms } from '../src/types';

const t2f = (entries: [string, Firm[]][]): Ticker2Firms =>
  Object.fromEntries(entries.map(([t, firms]) => [t, new Set(firms)]));

describe('tickerRestricted', () => {
  it('exact ticker hit', () => {
    expect(tickerRestricted('AAPL', 'PwC', t2f([['AAPL', ['PwC']]]))).toBe(true);
  });

  it('BRK-B hits BRK.B in t2f', () => {
    expect(tickerRestricted('BRK-B', 'Deloitte', t2f([['BRK.B', ['Deloitte']]]))).toBe(true);
  });

  it('base BRK hits when only base is indexed', () => {
    expect(tickerRestricted('BRK-B', 'EY', t2f([['BRK', ['EY']]]))).toBe(true);
  });

  it('no firm → not restricted', () => {
    expect(tickerRestricted('AAPL', null, t2f([['AAPL', ['PwC']]]))).toBe(false);
  });

  it('unrelated ticker → false', () => {
    expect(tickerRestricted('MSFT', 'KPMG', t2f([['AAPL', ['KPMG']]]))).toBe(false);
  });
});
