import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// str67-goal-directed-planning Phase 4 dogfood case study: unlike
// test/cli/fgos.test.mjs (every test there runs in a fresh mkdtemp cwd),
// this test runs `fgos goal show` -- read-only, safe -- against
// dogfood-fixture's own REAL committed .fgos/ state. The fixture's durable
// state IS what is under test here, mirroring calculator.test.mjs's own
// precedent of testing the fixture's real code directly rather than a copy.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');
const FIXTURE_CWD = path.resolve(__dirname, '..');

function run(args) {
  return spawnSync(process.execPath, [FGOS, ...args], { cwd: FIXTURE_CWD, encoding: 'utf8' });
}

function envelopeData(stdout) {
  const envelope = JSON.parse(stdout);
  assert.deepEqual(Object.keys(envelope).sort(), ['contract', 'data', 'data_hash', 'generated_at']);
  assert.equal(envelope.contract, 'fgos.v1');
  return envelope.data;
}

test('goal show reflects the dogfood MVP as focus, with a real deps-ancestor chain and a live blocker in topUnblock', () => {
  const result = run(['goal', 'show']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);

  assert.equal(data.focus, 'mvp-fgos-newcomer-loop');

  // Depth >= 2 proves the closure walks through milestone-loop-reliability's
  // deps (D5's deps-ancestor union), not a trivial depth-1 result.
  assert.ok(data.criticalPath.depth >= 2, `expected criticalPath.depth >= 2, got ${data.criticalPath.depth}`);

  // tsk-calc-reliability-audit is milestone-loop-reliability's ONLY
  // not-done dep (its sibling deps tsk-2ie/tsk-5gc are already `done` per
  // .fgos/state.json, so greedyTopUnblock's notDone filter excludes them --
  // this is what proves D5's deps-ancestor-outside-targets fix catches a
  // genuinely live blocker, not closure arithmetic over satisfied deps).
  assert.ok(Array.isArray(data.topUnblock) && data.topUnblock.length > 0, 'expected a non-empty topUnblock');
  assert.ok(
    data.topUnblock.some((entry) => entry.id === 'tsk-calc-reliability-audit'),
    `expected topUnblock to contain tsk-calc-reliability-audit, got ${JSON.stringify(data.topUnblock)}`,
  );
});
