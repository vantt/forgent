import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

test('every facade entry refuses a non-Linux platform before resolving paths or loading the addon', () => {
  const url = new URL('../../src/event-store/index.mjs', import.meta.url).href;
  const script = `
    import assert from 'node:assert/strict';
    import fs from 'node:fs';
    Object.defineProperty(process, 'platform', { value: 'darwin' });
    const api = await import(${JSON.stringify(url)});
    // An I/O trap after module loading proves refusal precedes disk access.
    fs.readFileSync = () => { throw new Error('unexpected disk access'); };
    for (const name of Object.keys(api)) {
      assert.throws(() => api[name](), { code: 'event-store-unsupported-platform' }, name);
    }
  `;
  execFileSync(process.execPath, ['--input-type=module', '-e', script]);
});
