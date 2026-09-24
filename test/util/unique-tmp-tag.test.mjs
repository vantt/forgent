import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
import { uniqueTmpTag } from '../../src/util/unique-tmp-tag.mjs';

test('uniqueTmpTag never repeats within one thread, even in the same millisecond', () => {
  const tags = new Set(Array.from({ length: 2000 }, () => uniqueTmpTag()));
  assert.equal(tags.size, 2000);
});

test('worker threads sharing one pid get distinct temp tags (each loads its own module copy)', async () => {
  const moduleUrl = new URL('../../src/util/unique-tmp-tag.mjs', import.meta.url).href;
  const source = `
import { parentPort } from 'node:worker_threads';
import { uniqueTmpTag } from ${JSON.stringify(moduleUrl)};
parentPort.postMessage(Array.from({ length: 200 }, () => uniqueTmpTag()));
`;
  const run = () => new Promise((resolve, reject) => {
    const w = new Worker(source, { eval: true });
    w.once('message', (tags) => w.terminate().then(() => resolve(tags), reject));
    w.once('error', reject);
  });
  const [a, b] = await Promise.all([run(), run()]);
  assert.equal(a[0].split('-')[0], b[0].split('-')[0], 'same process, same pid');
  const all = new Set([...a, ...b]);
  assert.equal(all.size, 400, 'no tag is shared between the two threads');
});
