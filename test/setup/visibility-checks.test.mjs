import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  checkHerdrAvailable,
  checkTrustStoreWritable,
  checkExecutorConfinement,
} from '../../src/setup/registrations.mjs';

// Phase 01 group D. These are the checks that turn "the machine is not set up for
// interactive dispatch" from a runtime surprise into a doctor line.
//
// Each one exists because its absence was measured, not imagined: without herdr
// there is no transport at all; without a readable trust store every dispatch into
// a fresh worktree stops at a folder dialog; and a bypass executor missing its
// confinement is the one configuration this phase refuses outright, so doctor
// should say so on a machine where it slipped in some other way.

test('checkHerdrAvailable reports a structured pass or fail, never throws', () => {
  const r = checkHerdrAvailable();
  assert.equal(typeof r.passed, 'boolean');
  assert.ok(typeof r.message === 'string' && r.message.length > 0);
});

test('checkTrustStoreWritable passes for a readable store and fails by name for a broken one', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-doctor-trust-'));
  try {
    const good = path.join(dir, 'good.json');
    fs.writeFileSync(good, JSON.stringify({ projects: {} }));
    assert.equal(checkTrustStoreWritable(good).passed, true);

    const bad = path.join(dir, 'bad.json');
    fs.writeFileSync(bad, 'not json at all');
    const badResult = checkTrustStoreWritable(bad);
    assert.equal(badResult.passed, false);
    assert.match(badResult.message, /not valid JSON|unreadable/i);

    const missing = path.join(dir, 'nope.json');
    assert.equal(checkTrustStoreWritable(missing).passed, false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('checkExecutorConfinement passes when no executor declares bypass', () => {
  const r = checkExecutorConfinement({ executors: { a: { kind: 'agent' }, b: { kind: 'agent', permissionMode: 'ask' } } });
  assert.equal(r.passed, true);
});

test('checkExecutorConfinement passes for a fully confined bypass executor', () => {
  const r = checkExecutorConfinement({
    executors: { a: { kind: 'agent', permissionMode: 'bypass', confinement: { privateHome: true, isolatedSession: true, ownWorktree: true } } },
  });
  assert.equal(r.passed, true);
});

test('checkExecutorConfinement fails and names the executor and the missing flags', () => {
  const r = checkExecutorConfinement({
    executors: {
      safe: { kind: 'agent', permissionMode: 'ask' },
      risky: { kind: 'agent', permissionMode: 'bypass', confinement: { privateHome: true } },
    },
  });
  assert.equal(r.passed, false);
  assert.match(r.message, /risky/, 'the offending executor is named');
  assert.match(r.message, /isolatedSession/, 'the missing flags are named');
  assert.doesNotMatch(r.message, /safe/, 'a compliant executor is not dragged into the message');
});

test('checkExecutorConfinement tolerates a config with no executors at all', () => {
  assert.equal(checkExecutorConfinement({}).passed, true);
  assert.equal(checkExecutorConfinement({ executors: {} }).passed, true);
});
