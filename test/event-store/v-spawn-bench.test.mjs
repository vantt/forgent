import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { benchmark } from '../../scripts/event-store/v-spawn-bench.mjs';

test('benchmark refuses an existing root without changing its contents', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'event-store-bench-existing-'));
  try {
    fs.writeFileSync(path.join(root, 'sentinel'), 'untouched');
    await assert.rejects(benchmark({root, out:path.join(root,'result.json')}), /fresh/);
    assert.deepEqual(fs.readdirSync(root), ['sentinel']);
    assert.equal(fs.readFileSync(path.join(root,'sentinel'),'utf8'), 'untouched');
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
});
test('benchmark refuses tmpfs before creating the fixture', {skip: process.platform !== 'linux' || !fs.existsSync('/dev/shm')}, async () => {
  const root = `/dev/shm/event-store-bench-${process.pid}`;
  assert.equal(fs.existsSync(root),false);
  await assert.rejects(benchmark({root, out:path.join(root,'result.json')}), /ext4 required/);
  assert.equal(fs.existsSync(root),false);
});
