import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { benchmark, percentile } from '../../scripts/event-store/v-spawn-bench.mjs';

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

test('benchmark refuses source-tree fixture and result paths before mutation', async () => {
  const root = path.resolve('scripts/event-store/forbidden-fixture');
  await assert.rejects(benchmark({root,out:'/tmp/unused-bench.json'}), /checkout writes/);
  assert.equal(fs.existsSync(root),false);
  await assert.rejects(benchmark({root:'/tmp/unused-fresh-bench',out:path.resolve('scripts/event-store/forbidden.json')}), /checkout writes/);
});
test('nearest-rank percentile handles unsorted observations and tails', () => {
  assert.equal(percentile([4,1,3,2],.5),2);
  assert.equal(percentile(Array.from({length:40},(_,i)=>40-i),.95),38);
  assert.equal(percentile([4,1,3,2],.99),4);
});
