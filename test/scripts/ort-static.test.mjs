import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ensure, archiveDirectory, ARCHIVE_SHA256, ORT_VERSION } from '../../scripts/ort-static.mjs';

// The archive is 120 MB, so these cases stub fetch and never download it; the real fetch is proved by the
// ort-static workflow's digest and by `npm run ort:static`.
function withFetch(fake, body) {
  const original = globalThis.fetch;
  globalThis.fetch = fake;
  return body().finally(() => { globalThis.fetch = original; });
}

test('ensure does nothing and fetches nothing outside Linux x64', async () => {
  const env = { XDG_CACHE_HOME: fs.mkdtempSync(path.join(os.tmpdir(), 'ort-static-')) };
  await withFetch(() => { throw new Error('fetched'); }, async () => {
    assert.deepEqual(await ensure({ env, platform: 'darwin', arch: 'arm64' }), { skipped: 'darwin-arm64' });
    assert.deepEqual(await ensure({ env, platform: 'linux', arch: 'arm64' }), { skipped: 'linux-arm64' });
  });
  assert.equal(fs.existsSync(archiveDirectory(env)), false);
});

test('ensure refuses a download whose sha256 differs from the pin and leaves no archive behind', async () => {
  const env = { XDG_CACHE_HOME: fs.mkdtempSync(path.join(os.tmpdir(), 'ort-static-')) };
  const served = new Response(Buffer.from('not the pinned archive'));
  await withFetch(async () => served, async () => {
    await assert.rejects(ensure({ env, platform: 'linux', arch: 'x64' }), new RegExp(`pinned ${ARCHIVE_SHA256}`));
  });
  assert.equal(fs.existsSync(path.join(archiveDirectory(env), 'libonnxruntime.a')), false);
});

test('ensure replaces a present archive that does not match the pin instead of trusting it', async () => {
  const env = { XDG_CACHE_HOME: fs.mkdtempSync(path.join(os.tmpdir(), 'ort-static-')) };
  fs.mkdirSync(archiveDirectory(env), { recursive: true });
  fs.writeFileSync(path.join(archiveDirectory(env), 'libonnxruntime.a'), 'stale bytes');
  let fetched = 0;
  await withFetch(async () => { fetched += 1; return new Response('', { status: 404 }); }, async () => {
    await assert.rejects(ensure({ env, platform: 'linux', arch: 'x64' }), /answered 404/);
  });
  assert.equal(fetched, 1);
});

test('the archive folder is one per machine: XDG_CACHE_HOME when absolute, else the account home, never a scratch HOME', () => {
  const account = path.join(os.userInfo().homedir, '.cache', 'fgos', 'ort-static', ORT_VERSION);
  assert.equal(archiveDirectory({ XDG_CACHE_HOME: '/c' }), path.join('/c', 'fgos', 'ort-static', ORT_VERSION));
  assert.equal(archiveDirectory({ XDG_CACHE_HOME: 'rel' }), account);
  assert.equal(archiveDirectory({ HOME: '/scratch/home' }), account);
});
