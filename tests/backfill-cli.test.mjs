import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const mock = 'globalThis.fetch = async () => ({ok:true,status:200,json:async()=>({0:{ticker:"AAPL",title:"Apple Inc"}})});';

describe('backfill CLI local errors', () => {
  it.each(['invalid JSON', 'invalid rows', 'missing file'])('%s fails without writing or a stack trace', kind => {
    const dir = mkdtempSync(join(tmpdir(), 'auditcheck-backfill-'));
    const path = join(dir, 'data.json');
    const source = kind === 'invalid JSON' ? '{' : JSON.stringify([['PwC', 'Apple Inc', '', '2024'], null]);
    try {
      if (kind !== 'missing file') writeFileSync(path, source);
      const result = spawnSync(process.execPath, ['--import', 'data:text/javascript,' + encodeURIComponent(mock),
        'tools/backfill-tickers.mjs', '--data', path], { encoding: 'utf8', timeout: 5000 });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('error: invalid local data:');
      expect(result.stderr).not.toContain('    at ');
      expect(result.stdout).toBe('');
      if (kind !== 'missing file') expect(readFileSync(path, 'utf8')).toBe(source);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
