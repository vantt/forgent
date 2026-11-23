import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ensure, archiveDirectory, ARCHIVE_SHA256 } from '../../scripts/ort-static.mjs';

// The archive is 120 MB, so these cases stub fetch and never download it; the real fetch is proved by the
// ort-static workflow's digest and by `npm run ort:static`.
function withFetch(fake, body) {
  const original = globalThis.fetch;
  globalThis.fetch = fake;
  return body().finally(() => { globalThis.fetch = original; });
}

test('ensure does nothing and fetches nothing outside Linux x64', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ort-static-'));
  await withFetch(() => { throw new Error('fetched'); }, async () => {
    assert.deepEqual(await ensure({ root, platform: 'darwin', arch: 'arm64' }), { skipped: 'darwin-arm64' });
    assert.deepEqual(await ensure({ root, platform: 'linux', arch: 'arm64' }), { skipped: 'linux-arm64' });
  });
  assert.equal(fs.existsSync(archiveDirectory(root)), false);
});

test('ensure refuses a download whose sha256 differs from the pin and leaves no archive behind', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ort-static-'));
  const served = new Response(Buffer.from('not the pinned archive'));
  await withFetch(async () => served, async () => {
    await assert.rejects(ensure({ root, platform: 'linux', arch: 'x64' }), new RegExp(`pinned ${ARCHIVE_SHA256}`));
  });
  assert.equal(fs.existsSync(path.join(archiveDirectory(root), 'libonnxruntime.a')), false);
});

test('ensure replaces a present archive that does not match the pin instead of trusting it', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ort-static-'));
  fs.mkdirSync(archiveDirectory(root), { recursive: true });
  fs.writeFileSync(path.join(archiveDirectory(root), 'libonnxruntime.a'), 'stale bytes');
  let fetched = 0;
  await withFetch(async () => { fetched += 1; return new Response('', { status: 404 }); }, async () => {
    await assert.rejects(ensure({ root, platform: 'linux', arch: 'x64' }), /answered 404/);
  });
  assert.equal(fetched, 1);
});
