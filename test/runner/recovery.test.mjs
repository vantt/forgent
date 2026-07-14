import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ERROR_CLASSES,
  ACTIONS,
  DEFAULT_MAX_RETRIES,
  RECOVERY,
  resolveAction,
  resolveStaleDoing,
} from '../../src/runner/recovery.mjs';

// Pure lib — every input here is a literal built in-memory; no fs, no
// mkdtemp, no `.fgos/` writes anywhere in this file.

test('RECOVERY declares an entry for every ERROR_CLASSES member, no more no less', () => {
  assert.deepEqual(Object.keys(RECOVERY).sort(), [...ERROR_CLASSES].sort());
});

test('every RECOVERY entry action is one of the declared ACTIONS', () => {
  for (const cls of ERROR_CLASSES) {
    assert.ok(ACTIONS.includes(RECOVERY[cls].action), `${cls} -> ${RECOVERY[cls].action}`);
  }
});

const retryClasses = ['worker-spawn-fail', 'worker-timeout', 'verify-miss', 'worktree-fail', 'reject-returned'];

for (const cls of retryClasses) {
  test(`${cls}: below max retries -> retry`, () => {
    assert.deepEqual(resolveAction(cls, DEFAULT_MAX_RETRIES - 1), {
      action: 'retry',
      errorClass: cls,
      attempt: DEFAULT_MAX_RETRIES - 1,
    });
  });

  test(`${cls}: exactly at max retries (boundary) -> park`, () => {
    const result = resolveAction(cls, DEFAULT_MAX_RETRIES);
    assert.equal(result.action, 'park');
    assert.equal(result.errorClass, cls);
    assert.equal(result.reason, 'max-retries-exceeded');
  });

  test(`${cls}: past max retries -> park`, () => {
    const result = resolveAction(cls, DEFAULT_MAX_RETRIES + 5);
    assert.equal(result.action, 'park');
  });
}

test('corrupt-log always halts, regardless of attempt', () => {
  assert.deepEqual(resolveAction('corrupt-log', 1), { action: 'halt', errorClass: 'corrupt-log' });
  assert.deepEqual(resolveAction('corrupt-log', 99), { action: 'halt', errorClass: 'corrupt-log' });
});

test('state-conflict always halts, regardless of attempt (never fights a human for a write)', () => {
  assert.deepEqual(resolveAction('state-conflict', 1), { action: 'halt', errorClass: 'state-conflict' });
  assert.deepEqual(resolveAction('state-conflict', 99), { action: 'halt', errorClass: 'state-conflict' });
});

test('stale-doing classifies to park at the coarse resolveAction level (never invisible)', () => {
  assert.deepEqual(resolveAction('stale-doing', 1), { action: 'park', errorClass: 'stale-doing' });
});

test('an undeclared error class fails safe to halt, never defaults to retry', () => {
  const result = resolveAction('some-made-up-class', 1);
  assert.equal(result.action, 'halt');
  assert.equal(result.reason, 'unknown-error-class');
});

test('resolveAction defaults attempt to 1 when omitted', () => {
  assert.deepEqual(resolveAction('worker-timeout'), {
    action: 'retry',
    errorClass: 'worker-timeout',
    attempt: 1,
  });
});

// -- resolveStaleDoing: branch-state truth table --------------------------

test('resolveStaleDoing: commit + verify pass -> completes (doing -> proposed)', () => {
  assert.deepEqual(resolveStaleDoing({ hasCommit: true, verifyPassed: true }), { to: 'proposed' });
});

test('resolveStaleDoing: commit but verify did not pass -> reclaim-blocked', () => {
  assert.deepEqual(resolveStaleDoing({ hasCommit: true, verifyPassed: false }), {
    to: 'blocked',
    reason: 'runner-crash-reclaim',
  });
});

test('resolveStaleDoing: no commit at all -> reclaim-blocked', () => {
  assert.deepEqual(resolveStaleDoing({ hasCommit: false, verifyPassed: false }), {
    to: 'blocked',
    reason: 'runner-crash-reclaim',
  });
});

test('resolveStaleDoing: no commit but verifyPassed somehow true -> still reclaim-blocked (commit is required)', () => {
  assert.deepEqual(resolveStaleDoing({ hasCommit: false, verifyPassed: true }), {
    to: 'blocked',
    reason: 'runner-crash-reclaim',
  });
});

test('resolveStaleDoing is idempotent: same facts always yield the same transition', () => {
  const facts = { hasCommit: true, verifyPassed: true };
  assert.deepEqual(resolveStaleDoing(facts), resolveStaleDoing(facts));
});

test('resolveStaleDoing defaults missing facts to false -> reclaim-blocked', () => {
  assert.deepEqual(resolveStaleDoing(), { to: 'blocked', reason: 'runner-crash-reclaim' });
});

// -- purity guard: the lib must never import fs/child_process -------------

test('src/runner/recovery.mjs never imports fs or child_process (pure lib prohibition)', () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const source = fs.readFileSync(path.join(here, '../../src/runner/recovery.mjs'), 'utf8');
  assert.doesNotMatch(source, /from\s+['"](node:)?fs['"]/);
  assert.doesNotMatch(source, /from\s+['"](node:)?child_process['"]/);
  assert.doesNotMatch(source, /require\(['"](node:)?(fs|child_process)['"]\)/);
});
