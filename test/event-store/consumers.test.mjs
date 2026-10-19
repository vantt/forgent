import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { consumers, registryFiles, loadRebuildModule } from '../../src/event-store/consumers.mjs';

test('the dormant registry matches the shipped manifest without import-time registration', { skip: process.platform !== 'linux' }, () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../../packages/event-store/contracts/consumers.v1.json', import.meta.url)));
  assert.deepEqual(consumers(), manifest.consumers);
  assert.equal(consumers(), consumers());
  assert.ok(Object.isFrozen(consumers()));
  assert.equal(registryFiles().length, manifest.consumers.length);
  assert.throws(() => loadRebuildModule('missing'), { code: 'event-store-consumer-registry' });
});

test('the manifest is the authority for contracts and lazy rebuilds, and rejects duplicate/unsafe entries', { skip: process.platform !== 'linux' }, async t => {
  const os = await import('node:os');
  const path = await import('node:path');
  const { execFileSync } = await import('node:child_process');
  const { pathToFileURL } = await import('node:url');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-es-consumers-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  for (const dir of ['src/event-store', 'src/run-supervisor', 'packages/event-store/contracts', 'src/example']) fs.mkdirSync(path.join(temp, dir), { recursive: true });
  fs.copyFileSync(new URL('../../src/event-store/consumers.mjs', import.meta.url), path.join(temp, 'src/event-store/consumers.mjs'));
  fs.copyFileSync(new URL('../../src/run-supervisor/payload-root.mjs', import.meta.url), path.join(temp, 'src/run-supervisor/payload-root.mjs'));
  fs.writeFileSync(path.join(temp, 'src/example/rebuild.mjs'), 'globalThis.consumerLoaded = true; export const rebuild = 42;');
  const file = path.join(temp, 'packages/event-store/contracts/consumers.v1.json');
  const entry = { id: 'example', contractFile: 'packages/event-store/contracts/example.json', cachePath: '.fgos/example-view.json', rebuildModule: 'src/example/rebuild.mjs' };
  const url = pathToFileURL(path.join(temp, 'src/event-store/consumers.mjs')).href;
  fs.writeFileSync(file, JSON.stringify({ v: 1, consumers: [entry] }));
  execFileSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    const api = await import(${JSON.stringify(url)});
    assert.equal(api.consumers()[0].id, 'example');
    assert.equal(api.registryFiles()[0], ${JSON.stringify(path.join(temp, entry.contractFile))});
    assert.equal(globalThis.consumerLoaded, undefined);
    assert.equal((await api.loadRebuildModule('example')).rebuild, 42);
    assert.equal(globalThis.consumerLoaded, true);
  `]);
  for (const consumers of [[entry, entry], [{ ...entry, contractFile: '../escape.json' }], [{ ...entry, rebuildModule: '/absolute.mjs' }], [{ ...entry, cachePath: 'a/../b' }]]) {
    fs.writeFileSync(file, JSON.stringify({ v: 1, consumers }));
    execFileSync(process.execPath, ['--input-type=module', '-e', `
      import assert from 'node:assert/strict';
      const api = await import(${JSON.stringify(url)});
      assert.throws(() => api.consumers(), { code: 'event-store-consumer-registry' });
    `]);
  }
});
