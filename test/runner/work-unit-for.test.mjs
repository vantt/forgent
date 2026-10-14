// test/runner/work-unit-for.test.mjs — workUnitFor: the one place a Work item becomes Unit data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { workUnitFor } from '../../src/runner/work-dispatch.mjs';
import { buildPrompt } from '../../src/runner/work-compat.mjs';
import { validateUnit } from '../../src/runner/execution/unit.mjs';
import { RunnerConfigError } from '../../src/runner/dispatch/config.mjs';

function tmpRoot() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-work-unit-for-'));
  execFileSync('git', ['init', '-q', dir]);
  return dir;
}

const item = (over = {}) => ({ id: 'tsk-abc', title: 'Add pagination', status: 'todo', domain: 'coding', ...over });

test('an executing item becomes a mutating solo Unit whose objective is the worker prompt', () => {
  const work = item();
  const { unitData, declared, pinInputs, worktree } = workUnitFor(work, { cfg: {}, worktree: '/wt/tsk-abc' });
  assert.deepEqual(unitData.writes, ['**']);
  assert.equal(unitData.pattern, 'solo');
  assert.equal(unitData.id, 'work-tsk-abc-executing');
  assert.equal(unitData.objective, buildPrompt(work, undefined, undefined));
  assert.equal(typeof unitData.capability, 'string');
  assert.ok(unitData.capability.length > 0);
  assert.equal(declared, undefined);
  assert.equal(pinInputs, undefined);
  assert.equal(worktree, '/wt/tsk-abc');
  validateUnit(unitData);
});

test('a mutating Unit with declared expected files writes exactly those files', () => {
  const { unitData } = workUnitFor(item(), { cfg: {}, worktree: '/wt', expectedFiles: ['src/a.mjs', 'test/a.test.mjs'] });
  assert.deepEqual(unitData.writes, ['src/a.mjs', 'test/a.test.mjs']);
});

test('the Unit id is ascii and stable for the same item and step', () => {
  const a = workUnitFor(item({ id: 'Tsk_ÄB.9' }), { cfg: {}, worktree: '/wt' }).unitData.id;
  const b = workUnitFor(item({ id: 'Tsk_ÄB.9' }), { cfg: {}, worktree: '/wt' }).unitData.id;
  assert.equal(a, b);
  assert.match(a, /^[a-z0-9-]+$/);
});

test('rigor: risk heavy without an explicit rigor reads as high', () => {
  const { unitData } = workUnitFor(item({ risk: 'heavy' }), { cfg: {}, worktree: '/wt' });
  assert.equal(unitData.rigor, 'high');
});

test('rigor: an explicit work rigor wins over risk heavy, even when lower', () => {
  const { unitData } = workUnitFor(item({ risk: 'heavy', rigor: 'low' }), { cfg: {}, worktree: '/wt' });
  assert.equal(unitData.rigor, 'low');
});

test('rigor: no explicit source leaves the Unit rigor to the lower layer', () => {
  const { unitData } = workUnitFor(item(), { cfg: {}, worktree: '/wt' });
  assert.equal(unitData.rigor, undefined);
});

test('rigor: the operation policy rigor comes first and later sources only raise it', () => {
  const stateRoot = tmpRoot();
  const raised = workUnitFor(item({ rigor: 'high' }), { cfg: {}, stateRoot, stage: 'planning', operation: 'validate-plan' });
  assert.equal(raised.unitData.rigor, 'high');
  const notLowered = workUnitFor(item({ rigor: 'low' }), { cfg: {}, stateRoot, stage: 'planning', operation: 'validate-plan' });
  assert.equal(notLowered.unitData.rigor, 'standard');
});

test('rigor: an invalid work rigor is refused', () => {
  assert.throws(() => workUnitFor(item({ rigor: 'extreme' }), { cfg: {}, worktree: '/wt' }), RunnerConfigError);
});

test('feedback reaches the objective of a step Unit and of an operation Unit', () => {
  const feedback = { answer: 'use the existing OAuth provider', reason: 'tests were missing' };
  const step = workUnitFor(item(), { cfg: {}, worktree: '/wt', feedback });
  assert.match(step.unitData.objective, /use the existing OAuth provider/);
  assert.match(step.unitData.objective, /tests were missing/);
  const op = workUnitFor(item(), { cfg: {}, stateRoot: tmpRoot(), stage: 'planning', operation: 'validate-plan', feedback });
  assert.match(op.unitData.objective, /^Execute planning\.validate-plan operation/);
  assert.match(op.unitData.objective, /use the existing OAuth provider/);
  assert.match(op.unitData.objective, /tests were missing/);
});

test('a read-only operation Unit writes nothing, declares its operation and pins the plan where it lives', () => {
  const stateRoot = tmpRoot();
  const docsRef = 'docs/history/work-unit-for-fixture-plan';
  fs.mkdirSync(path.join(stateRoot, docsRef), { recursive: true });
  fs.writeFileSync(path.join(stateRoot, docsRef, 'plan.md'), '# plan\n');
  const work = item({ docsRef, refs: ['src/x.mjs', docsRef] });
  const { unitData, declared, pinInputs, worktree } = workUnitFor(work, {
    cfg: {}, stateRoot, stage: 'planning', operation: 'validate-plan',
  });
  assert.deepEqual(unitData.writes, []);
  assert.equal(unitData.id, 'work-tsk-abc-validate-plan');
  assert.deepEqual(unitData.inputs, [docsRef, `${docsRef}/plan.md`, `${docsRef}/CONTEXT.md`, 'src/x.mjs']);
  assert.equal(declared.workId, 'tsk-abc');
  assert.equal(declared.domain, 'coding');
  assert.equal(declared.workflow, 'feature');
  assert.equal(declared.stage, 'planning');
  assert.equal(declared.operation, 'validate-plan');
  assert.ok(declared.operations.every((o) => o && typeof o === 'object' && typeof o.id === 'string'));
  assert.ok(declared.operations.some((o) => o.id === 'validate-plan'));
  assert.deepEqual(pinInputs, [path.join(stateRoot, docsRef, 'plan.md')]);
  assert.equal(worktree, stateRoot);
  validateUnit(unitData);
});

test('an operation Unit pins nothing when the plan file does not exist', () => {
  const { pinInputs } = workUnitFor(item({ docsRef: 'docs/history/work-unit-for-fixture-none' }), {
    cfg: {}, stateRoot: tmpRoot(), stage: 'planning', operation: 'validate-plan',
  });
  assert.deepEqual(pinInputs, []);
});

test('a mutating operation Unit runs in the worktree the caller names', () => {
  const { unitData, worktree } = workUnitFor(item(), {
    cfg: {}, stateRoot: tmpRoot(), stage: 'executing', operation: 'implement-item', worktree: '/wt/item',
  });
  assert.deepEqual(unitData.writes, ['**']);
  assert.equal(worktree, '/wt/item');
});

test('a mutating Unit without a worktree is refused', () => {
  assert.throws(() => workUnitFor(item(), { cfg: {} }), RunnerConfigError);
});

test('an operation the step does not declare is refused', () => {
  assert.throws(
    () => workUnitFor(item(), { cfg: {}, stateRoot: tmpRoot(), stage: 'planning', operation: 'implement-item' }),
    RunnerConfigError,
  );
});

test('work refs that are not safe repo-relative paths are skipped with a warning', () => {
  const { unitData, warnings } = workUnitFor(item({ refs: ['/etc/passwd', '../outside.md', 'ok.md'] }), { cfg: {}, worktree: '/wt' });
  assert.deepEqual(unitData.inputs, ['ok.md']);
  assert.equal(warnings.length, 2);
  validateUnit(unitData);
});

test('prefer names the step executor only when it is configured', () => {
  const none = workUnitFor(item(), { cfg: {}, worktree: '/wt' });
  assert.equal(none.unitData.prefer, undefined);
  const viaCapability = workUnitFor(item(), {
    cfg: { executors: { claude: { command: 'claude' } }, capabilities: { 'fgos-coding-implement': { prefer: 'claude' } } },
    worktree: '/wt',
  });
  assert.deepEqual(viaCapability.unitData.prefer, ['claude']);
  const direct = workUnitFor(item(), {
    cfg: { executors: { 'fgos-coding-implement': { command: 'x' } } },
    worktree: '/wt',
  });
  assert.deepEqual(direct.unitData.prefer, ['fgos-coding-implement']);
});
