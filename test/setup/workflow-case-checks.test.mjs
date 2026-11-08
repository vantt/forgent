// test/setup/workflow-case-checks.test.mjs — doctor: binding records agree with their ledgers; the fix writes the sentinel

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

test('both checks and the sentinel fix are registered', () => {
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

test('every binding condition is judged by the one reader: a record missing for a bound open case, an unparseable record and a ledger that cannot be read', () => {
  const { repoRoot, run, worktree, key } = boundCase();
  fs.rmSync(recordFile(repoRoot, key));
  const missing = checkWorkflowCaseBindings(repoRoot);
  assert.equal(missing.passed, false);
  assert.ok(missing.message.includes('has no record') && missing.message.includes(`fgos workflow resume ${run.caseId}`), missing.message);

  const other = path.join(repoRoot, 'wt-crashed');
  fs.mkdirSync(other);
  createPendingBinding({ mainRoot: repoRoot, caseId: run.caseId, generation: 9, worktree: other });
  fs.writeFileSync(recordFile(repoRoot, bindingKeyOf(worktree)), '{"state": "comm');
  const broken = checkWorkflowCaseBindings(repoRoot);
  assert.match(broken.message, /does not parse/);
  assert.match(broken.message, /is pending \(binding-unsettled\)/);

  fs.writeFileSync(path.join(repoRoot, '.fgos', 'workflow-runs', run.caseId, 'events.jsonl'), '{"seq": 1, garbage\n');
  assert.match(checkWorkflowCaseBindings(repoRoot).message, /ledger unreadable/);
});

test('the fix writes the sentinel only; settling and rebuilding records belongs to the case\'s own hold', () => {
  const { repoRoot, run, key } = boundCase();
  fs.rmSync(path.join(bindingsDir(repoRoot), SENTINEL_NAME));
  fs.rmSync(recordFile(repoRoot, key));
  const fixed = fixWorkflowCaseBindings(repoRoot);
  assert.equal(fixed.message, 'wrote the sentinel');
  assert.equal(fs.existsSync(recordFile(repoRoot, key)), false, 'the doctor rebuilt nothing');
  assert.equal(fixWorkflowCaseBindings(repoRoot).changed, false);
  const held = acquireAdvanceLock(repoRoot, run.caseId);
  held.release();
  assert.equal(fs.existsSync(recordFile(repoRoot, key)), true, 'the case\'s own hold rebuilt it');
});
