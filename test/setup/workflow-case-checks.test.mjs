// test/setup/workflow-case-checks.test.mjs — doctor: binding records agree with their ledgers; the fix settles and rebuilds

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { bindWorktree, bindingKeyOf, bindingsDir, createPendingBinding, SENTINEL_NAME } from '../../src/workflow/case-bindings.mjs';
import { checkWorkflowCaseBindingSentinel, checkWorkflowCaseBindings, fixWorkflowCaseBindings } from '../../src/setup/workflow-case-checks.mjs';
import { DOCTOR_CHECKS, FIX_REGISTRATIONS } from '../../src/setup/registrations.mjs';
import { acquireAdvanceLock } from '../../src/workflow/case-lock.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';
import { appendAll, openCase, withHold } from '../helpers/workflow-case-fixture.mjs';

function boundCase() {
  const repoRoot = makeFixtureDir('fgos-doctor-bind-');
  const run = openCase({ repoRoot });
  const worktree = path.join(repoRoot, 'wt');
  fs.mkdirSync(worktree);
  const bound = withHold(run, (hold) => bindWorktree({ mainRoot: repoRoot, hold, caseId: run.caseId, worktree }));
  return { repoRoot, run, worktree, key: bound.key };
}

const recordFile = (repoRoot, key) => path.join(bindingsDir(repoRoot), `${key}.json`);

test('both checks and the fix are registered', () => {
  const ids = DOCTOR_CHECKS.map((c) => c.id);
  assert.ok(ids.includes('workflow-case-binding-sentinel') && ids.includes('workflow-case-bindings'));
  assert.ok(FIX_REGISTRATIONS.some((f) => f.id === 'workflow-case-bindings'));
});

test('a project that never bound a worktree passes; a matching record passes', () => {
  const empty = makeFixtureDir('fgos-doctor-empty-');
  assert.equal(checkWorkflowCaseBindingSentinel(empty).passed, true);
  assert.equal(checkWorkflowCaseBindings(empty).passed, true);

  const { repoRoot } = boundCase();
  assert.equal(checkWorkflowCaseBindingSentinel(repoRoot).passed, true);
  const result = checkWorkflowCaseBindings(repoRoot);
  assert.equal(result.passed, true, result.message);
});

test('a missing sentinel fails, and the fix writes it', () => {
  const { repoRoot } = boundCase();
  fs.rmSync(path.join(bindingsDir(repoRoot), SENTINEL_NAME));
  assert.equal(checkWorkflowCaseBindingSentinel(repoRoot).passed, false);
  fixWorkflowCaseBindings(repoRoot);
  assert.equal(checkWorkflowCaseBindingSentinel(repoRoot).passed, true);
});

test('a record the ledger does not show, an unsettled one and a closed case still held each fail by name', () => {
  const { repoRoot, run, key } = boundCase();
  const file = recordFile(repoRoot, key);

  const record = JSON.parse(fs.readFileSync(file, 'utf8'));
  fs.writeFileSync(file, JSON.stringify({ ...record, generation: 7 }));
  assert.match(checkWorkflowCaseBindings(repoRoot).message, /does not show as bound/);

  fs.writeFileSync(file, JSON.stringify({ ...record, state: 'pending' }));
  assert.match(checkWorkflowCaseBindings(repoRoot).message, /binding-unsettled/);

  fs.writeFileSync(file, JSON.stringify(record));
  appendAll(run, [{ type: 'case.closed', payload: { closedAt: '2026-10-19T00:00:00.000Z' } }]);
  const closed = checkWorkflowCaseBindings(repoRoot);
  assert.equal(closed.passed, false);
  assert.match(closed.message, /closed case/);
});

test('the fix rebuilds a record the ledger says exists, and settles what a crash left', () => {
  const { repoRoot, run, worktree, key } = boundCase();
  fs.rmSync(recordFile(repoRoot, key));
  const missing = checkWorkflowCaseBindings(repoRoot);
  assert.equal(missing.passed, false);
  assert.match(missing.message, /has no record/);

  const fixed = fixWorkflowCaseBindings(repoRoot);
  assert.equal(fixed.changed, true);
  assert.match(fixed.message, /rebuilt record/);
  assert.equal(checkWorkflowCaseBindings(repoRoot).passed, true);
  assert.equal(JSON.parse(fs.readFileSync(recordFile(repoRoot, key), 'utf8')).state, 'committed');

  // A pending record with no event on the ledger is a crash before anything used it.
  const other = path.join(repoRoot, 'wt-crashed');
  fs.mkdirSync(other);
  createPendingBinding({ mainRoot: repoRoot, caseId: run.caseId, generation: 9, worktree: other });
  assert.equal(fs.existsSync(recordFile(repoRoot, bindingKeyOf(other))), true);
  fixWorkflowCaseBindings(repoRoot);
  assert.equal(fs.existsSync(recordFile(repoRoot, bindingKeyOf(other))), false);
  assert.equal(fs.existsSync(worktree), true);
});

test('the fix does not touch a case whose advance lock is held', () => {
  const { repoRoot, run, key } = boundCase();
  const file = recordFile(repoRoot, key);
  fs.rmSync(file);
  // A live binder holds `advance`; settling or rebuilding under it would race that binder.
  const held = acquireAdvanceLock(repoRoot, run.caseId);
  try {
    const result = fixWorkflowCaseBindings(repoRoot);
    assert.match(result.message, /advance lock is held/);
    assert.equal(fs.existsSync(file), false, 'nothing was rebuilt under a live binder');
  } finally {
    held.release();
  }
});
