import { describe, expect, it } from 'vitest';
import { parse } from '../src/parse';

describe('parse', () => {
  it('returns tickers from a simple comma list', () => {
    expect(parse('AAPL,MSFT,NVDA')).toEqual(['AAPL', 'MSFT', 'NVDA']);
  });

  it('handles whitespace-separated tickers', () => {
    expect(parse('AAPL MSFT NVDA')).toEqual(['AAPL', 'MSFT', 'NVDA']);
  });

  it('handles newline-separated tickers', () => {
    expect(parse('AAPL\nMSFT\nNVDA')).toEqual(['AAPL', 'MSFT', 'NVDA']);
  });

  it('preserves hyphenated share-class tickers', () => {
    expect(parse('BRK-B BF-B')).toEqual(['BRK-B', 'BF-B']);
  });

  it('preserves dotted share-class tickers', () => {
    expect(parse('BRK.B')).toEqual(['BRK.B']);
  });

  it('strips a leading BOM', () => {
    expect(parse('﻿AAPL,MSFT')).toEqual(['AAPL', 'MSFT']);
  });

  it('strips quoted CSV fields', () => {
    expect(parse('"AAPL","MSFT","NVDA"')).toEqual(['AAPL', 'MSFT', 'NVDA']);
  });

  it('skips broker CSV header rows', () => {
    expect(parse('Symbol,Quantity\nAAPL,10\nMSFT,5')).toEqual(['AAPL', 'MSFT']);
  });

  it('skips header tokens case-insensitively', () => {
    expect(parse('SECURITY DESCRIPTION\nAAPL')).toEqual(['AAPL']);
  });

  it('strips non-ticker characters from tokens', () => {
    expect(parse('AAPL$100')).toEqual(['AAPL100']);
  });

  it('drops tokens that do not start with a letter', () => {
    expect(parse('100AAPL,AAPL')).toEqual(['AAPL']);
  });

  it('returns an empty array for empty input', () => {
    expect(parse('')).toEqual([]);
  });

  it('handles a Robinhood-style BOM + quoted line', () => {
    expect(parse('﻿"AAPL","100"\n"MSFT","50"')).toEqual(['AAPL', 'MSFT']);
  });
});
