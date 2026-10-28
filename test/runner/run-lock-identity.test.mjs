// Phase 02 H1: acquireRunControl's reclaim decision must be proven-dead
// identity, not raw PID liveness alone -- a PID reused by an unrelated
// process after the real holder died must never be mistaken for the same
// holder. The liveness verdict table is owned by
// test/process/process-facts-vectors.test.mjs; this file exercises the reclaim
// decision through the real acquireRunControl entry point (fixtures craft the holder record
// directly rather than mocking /proc, since real PID liveness/bootId are
// the only fs state this depends on).

import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { acquireRunControl, buildRunControlHolder, listGenerations, publishMarkerOnce, publishNextGeneration } from '../../src/runner/dispatch/run-lock.mjs';
import { selfRecord } from '../../src/runner/dispatch/process-identity.mjs';

function mkRunDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'run-lock-identity-'));
}

// Process identity is read from /proc, so only Linux can prove a pid was
// reused or the host rebooted. Elsewhere resolveHolderLiveness has nothing to
// cross-check and fails closed to 'held' by contract; the tests below assert
// whichever of the two behaviors this platform is supposed to have.
const HAS_PROC_START_TIME = selfRecord().startTime !== undefined;

test('acquireRunControl: a live holder (real process, matching processStartTime) is never reclaimed by a contender, even with no ttlMs (always-attempt path)', () => {
  const runDir = mkRunDir();
  const first = acquireRunControl(runDir, { holder: buildRunControlHolder('first') });
  assert.equal(first.status, 'acquired');

  const contender = acquireRunControl(runDir, { holder: buildRunControlHolder('contender') });
  assert.equal(contender.status, 'held');
  assert.equal(contender.holder.id, 'first');
});

test('acquireRunControl: a holder record whose pid was reused by an unrelated process (processStartTime mismatch) IS reclaimed', () => {
  const runDir = mkRunDir();
  const staleHolder = { id: 'stale-holder', pid: process.pid, bootId: selfRecord().bootId ?? 'unknown-boot', processStartTime: 'not-the-real-starttime', host: os.hostname() };
  const first = acquireRunControl(runDir, { holder: staleHolder });
  assert.equal(first.status, 'acquired');

  const contender = acquireRunControl(runDir, { holder: buildRunControlHolder('contender') });
  if (!HAS_PROC_START_TIME) {
    assert.equal(contender.status, 'held', 'without /proc the reused pid cannot be disproven, so the live pid keeps the lock');
    return;
  }
  assert.equal(contender.status, 'acquired');
  assert.equal(contender.controlEpoch, first.controlEpoch + 1);
});

// Publication is create-only through the durable-file door: of any number of separate processes racing for
// one name, exactly one installs it, and no temporary is left behind.
test('racing processes publish one marker and one next generation, never a replace', async () => {
  const dir = mkRunDir();
  const lock = new URL('../../src/runner/dispatch/run-lock.mjs', import.meta.url).href;
  const race = (code) => Promise.all([1, 2, 3, 4].map((n) => new Promise((resolve) => {
    const child = spawn(process.execPath, ['--input-type=module', '-e', code(n)], { stdio: ['ignore', 'pipe', 'inherit'] });
    let out = '';
    child.stdout.on('data', (chunk) => { out += chunk; });
    child.once('exit', () => resolve(JSON.parse(out)));
  })));
  const marker = path.join(dir, 'releases', '0000000001.json.release');
  const markers = await race((n) => `import { publishMarkerOnce } from ${JSON.stringify(lock)};
    console.log(JSON.stringify(publishMarkerOnce(${JSON.stringify(marker)}, { winner: ${n} })));`);
  assert.equal(markers.filter((r) => r.published).length, 1);
  const generations = path.join(dir, 'generations');
  fs.mkdirSync(generations, { recursive: true });
  const published = await race((n) => `import { publishNextGeneration } from ${JSON.stringify(lock)};
    const r = publishNextGeneration(${JSON.stringify(generations)}, ({ nextEpoch }) => nextEpoch > 1 ? { stop: true } : { record: { winner: ${n} } });
    console.log(JSON.stringify({ published: r.published }));`);
  assert.equal(published.filter((r) => r.published).length, 1);
  assert.equal(listGenerations(generations).length, 1);
  for (const sub of [path.dirname(marker), generations]) assert.deepEqual(fs.readdirSync(sub).filter((f) => f.endsWith('.tmp')), []);
  assert.deepEqual(publishMarkerOnce(marker, { winner: 'late' }), { published: false });
  assert.equal(publishNextGeneration(generations, () => ({ stop: true })).published, false);
});
