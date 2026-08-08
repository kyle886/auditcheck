import { describe, expect, it } from 'vitest';
import { normalizeName } from '../tools/lib/normalize-name.mjs';
import { stripSuffixes } from '../src/data';

describe('normalizeName', () => {
  it('lowercases and strips trailing corp suffixes', () => {
    expect(normalizeName('Apple Inc.')).toBe('apple');
  });

  it('matches stripSuffixes after lowercasing', () => {
    const names = [
      'Apple Inc.',
      'Microsoft Corporation Holdings',
      'Berkshire Hathaway',
      'NVDA',
    ];
    for (const n of names) {
      expect(normalizeName(n)).toBe(stripSuffixes(n.toLowerCase()));
    }
  });

  it('does not strip a single-word suffix name', () => {
    expect(normalizeName('Inc')).toBe('inc');
  });
});
