// Owning proof of the one lifecycle wrapper around a command (spec §16): which effects run, in which order, and which
// facts switch them off. It has its own file because the wrapper switches this process to hand-off sealing, which
// the inline-sealing cases of triggers.test.mjs cannot share. What a trigger seals and publishes is owned there.
import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runWithEventStoreLifecycle } from '../../src/event-store/maintenance.mjs';

// A directory with no Event Store: every trigger against it ends with an error code instead of work.
function noStore(t) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-lifecycle-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  return temp;
}

function harness(order) {
  return {
    recordFault: (faultClass, message) => { assert.equal(typeof message, 'string'); order.push(faultClass); },
    releaseLand: async (root) => { order.push(`land:${root}`); },
  };
}

test('a dispatched worker runs the start trigger, the verb, the end trigger and no Land release, and a start-trigger error is recorded', async (t) => {
  const cwd = noStore(t);
  const order = [];
  const result = await runWithEventStoreLifecycle({ cwd, dispatched: true, opensStore: true, landed: true, ...harness(order) }, async () => { order.push('verb'); return 'answer'; });
  assert.equal(result, 'answer');
  assert.deepEqual(order, ['event-store-start-trigger', 'verb', 'event-store-end-trigger']);
});

test('the clone owner runs no start trigger; the verb, the end trigger and then the Land release follow in that order', async (t) => {
  const cwd = noStore(t);
  const order = [];
  await runWithEventStoreLifecycle({ cwd, dispatched: false, opensStore: true, landed: true, ...harness(order) }, async () => { order.push('verb'); });
  assert.deepEqual(order, ['verb', 'event-store-end-trigger', `land:${cwd}`], 'a failed end trigger is recorded and still releases Land');
});

test('the Land release fires only for a verb that landed, and a verb that creates the store has no start trigger', async (t) => {
  const cwd = noStore(t);
  const notLanded = [];
  await runWithEventStoreLifecycle({ cwd, opensStore: true, ...harness(notLanded) }, async () => {});
  assert.deepEqual(notLanded, ['event-store-end-trigger']);
  const creating = [];
  await runWithEventStoreLifecycle({ cwd, dispatched: true, opensStore: true, creating: true, ...harness(creating) }, async () => {});
  assert.deepEqual(creating, ['event-store-end-trigger']);
});

test('a verb that does not open the store runs neither trigger nor the Land release', async (t) => {
  const cwd = noStore(t);
  const order = [];
  await runWithEventStoreLifecycle({ cwd, dispatched: true, opensStore: false, landed: true, ...harness(order) }, async () => { order.push('verb'); });
  assert.deepEqual(order, ['verb']);
});

test('a verb that throws still gets its end trigger and Land release, and its error reaches the caller unchanged', async (t) => {
  const cwd = noStore(t);
  const order = [];
  const failure = new Error('verb refused');
  await assert.rejects(
    runWithEventStoreLifecycle({ cwd, opensStore: true, landed: true, ...harness(order) }, async () => { throw failure; }),
    (error) => error === failure,
  );
  assert.deepEqual(order, ['event-store-end-trigger', `land:${cwd}`]);
});

test('a main checkout root that cannot be read is recorded, never replaced by the working directory, and releases nothing', async (t) => {
  const cwd = noStore(t);
  const order = [];
  const unreadable = () => { throw Object.assign(new Error('git facts unreadable'), { code: 'git-facts-unreadable' }); };
  const faults = [];
  await runWithEventStoreLifecycle({
    cwd, trustedMain: unreadable, dispatched: true, opensStore: true, landed: true,
    recordFault: (faultClass, message) => faults.push([faultClass, message]),
    releaseLand: async () => { order.push('land'); },
  }, async () => { order.push('verb'); });
  assert.deepEqual(faults, [['event-store-start-trigger', 'git-facts-unreadable'], ['event-store-end-trigger', 'git-facts-unreadable']]);
  assert.deepEqual(order, ['verb']);
});

test('a Land release that throws is recorded and never fails the command it ended', async (t) => {
  const cwd = noStore(t);
  const faults = [];
  const result = await runWithEventStoreLifecycle({
    cwd, opensStore: true, landed: true,
    recordFault: (faultClass, message) => faults.push([faultClass, message]),
    releaseLand: async () => { throw Object.assign(new Error('release refused'), { code: 'land-release-refused' }); },
  }, async () => 'answer');
  assert.equal(result, 'answer');
  assert.deepEqual(faults.at(-1), ['event-store-land-release', 'land-release-refused']);
});
