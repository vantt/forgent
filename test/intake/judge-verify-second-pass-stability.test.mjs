import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { judgeVerifySemanticCorrectness } from '../../src/intake/verify-pattern-check.mjs';
import { resolveDiscovery } from '../../src/intake/discovery.mjs';
import { addWork, listWork } from '../../src/state/store.mjs';

// tsk-1x3 D17 (docs/history/fanout-and-delegation-rubric/CONTEXT.md):
// judgeVerifySemanticCorrectness's LLM-fallback branch is retired --
// spawn/prompt/priorRejection-threading, and this file's own prior
// prompt-stability coverage (tsk-5cf D1a) along with it. What survives is
// the mechanical pattern check (tsk-12t) and the two resolveDiscovery
// --force integration tests whose call pattern already used a
// caller-supplied verdict (unaffected by D1/D9/D16's requirement that a
// non-`'runner'` caller with no locked context supply one).
//
// REAL FINDING, not silently dropped: with the LLM branch gone,
// `judgeVerifySemanticCorrectness` can only ever return `{agrees: false}`
// with `mechanical: true` attached -- there is no other source of
// disagreement left. The `secondPass.mechanical !== true` branch in
// resolveDiscovery/resolvePlan (the "a --force can override a
// non-mechanical disagreement" path) is now structurally unreachable. It
// is left in place -- unchanged behavior for the one case that can still
// happen (a mechanical disagreement always falls through to the park
// branch, which is correct) -- but the test that exercised a non-mechanical
// disagreement via a fake executor no longer has anything real to prove,
// since no code path can produce that shape anymore.

function tmpStoreDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-resolve-discovery-stability-'));
}

function sampleWork(overrides = {}) {
  return {
    id: 'item-x',
    title: 'Produce the output file',
    kind: 'feature',
    status: 'todo',
    deps: [],
    risk: 'light',
    refs: [],
    verify: 'chưa xác định — P15 bổ sung',
    // tsk-qod D1/D2: `clarify` is retired as a stage entirely -- `discovery`
    // (`stages[0]`) is the real entry point a fresh item now starts at.
    stage: 'discovery',
    ...overrides,
  };
}

// tsk-12t D1/D2/D4/D6: judgeVerifySemanticCorrectness's own mechanical
// pre-check for the documented node --test / --test-name-pattern
// reporter-format trap (docs/how-to/avoid-vacuous-pass-with-node-test-
// test-name-pattern.md) -- Node's default reporter never prints a
// TAP-style `# pass`/`# fail` line, so a verify grepping for that shape
// can never correctly detect pass/fail regardless of what the tested code
// does. A known-bad verify string built the same way the how-to doc's own
// "First attempt" real example was: `node --test --test-name-pattern=...`
// combined with a `grep -qE "^# pass ..."` check.
const KNOWN_BAD_VERIFY =
  'node --test --test-name-pattern="verify-from" file.test.mjs 2>&1 | grep -qE "^# pass [1-9]"';

test('rejects known-bad node --test reporter pattern (tsk-1x3 D17: mechanical-only signature)', () => {
  const result = judgeVerifySemanticCorrectness(KNOWN_BAD_VERIFY);

  assert.equal(result.agrees, false);
  assert.equal(result.mechanical, true);
  assert.match(result.reason, /node --test/);
  assert.match(result.reason, /avoid-vacuous-pass-with-node-test-test-name-pattern\.md/);
});

test('agrees on a verify string that does not match the known-bad pattern', () => {
  const result = judgeVerifySemanticCorrectness('npm test');
  assert.equal(result.agrees, true);
});

test('does not allow --force to bypass a mechanical pattern rejection', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolveDiscovery(storeDir, 'item-x', {}, undefined, { clear: true, verify: KNOWN_BAD_VERIFY, force: true });

  assert.equal(result.outcome, 'verify-disputed');
  assert.equal(result.secondPass.mechanical, true);
  assert.equal(listWork(storeDir).work['item-x'].status, 'awaiting-human');
});

test('resolveDiscovery --force refuses when the item is already awaiting-human (points at fgos answer instead) (tsk-5ld)', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ status: 'awaiting-human' }));

  assert.throws(
    () => resolveDiscovery(storeDir, 'item-x', {}, undefined, { clear: true, verify: 'npm test -- reporting', force: true }),
    /already "awaiting-human"/,
  );
});
