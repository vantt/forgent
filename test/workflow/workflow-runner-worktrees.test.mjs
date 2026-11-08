// test/workflow/workflow-runner-worktrees.test.mjs — the worktrees a case leaves behind: created on a branch and removed again, the
// integrated ones removed when the case ends and the others kept with their paths, dirty bytes never lost, and the trunk a unit is
// judged against.

import '../helpers/process-tmp-root.mjs';
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { validateWorkflow } from '../../src/workflow/definition.mjs';
import { createWorkflowRun, appendWorkflowEvent, readWorkflowEvents } from '../../src/workflow/store.mjs';
import { createWorkflowWorktree, resolveIntegrationTarget, cleanupWorkflowWorktree } from '../../src/workflow/unit-handoff.mjs';
import { resumeWorkflow } from '../../src/workflow/index.mjs';
import { acquireAdvanceLock } from '../../src/workflow/case-lock.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';
import { setupTestRepo } from '../helpers/workflow-runner-fixture.mjs';

seedFileLocalBwrapRegistry();

// Worktrees created in the default location outlive the test unless removed here.
const worktreeDirs = [];
after(() => {
  for (const dir of worktreeDirs) fs.rmSync(dir, { recursive: true, force: true });
});

test('workflow worktree helpers: create a worktree on a branch and clean it up', async () => {
  const tmp = setupTestRepo();
  const branchName = 'test-feat-branch';

  // 1. Create worktree
  const { worktreePath, branch } = createWorkflowWorktree({
    repoRoot: tmp,
    branch: branchName,
  });
  worktreeDirs.push(worktreePath);
  assert.ok(fs.existsSync(worktreePath));
  assert.equal(branch, branchName);

  // Make a commit in worktree
  fs.writeFileSync(path.join(worktreePath, 'feature.txt'), 'new feature\n');
  execFileSync('git', ['add', 'feature.txt'], { cwd: worktreePath, stdio: 'ignore' });
  execFileSync('git', ['commit', '-m', 'add feature'], { cwd: worktreePath, stdio: 'ignore' });

  // 2. Cleanup worktree and branch
  cleanupWorkflowWorktree({
    repoRoot: tmp,
    worktreePath,
    branch: branchName,
    deleteBranch: true,
  });
  assert.equal(fs.existsSync(worktreePath), false);
});

async function seedRunWithUnitWorktrees(tmp, { terminal }) {
  const workflow = validateWorkflow({
    id: 'test/cleanup',
    title: 'Cleanup',
    steps: [
      {
        id: 's1',
        units: [
          { id: 'merged', template: { capability: 'docs:write', writes: ['a.txt'] } },
          { id: 'unmerged', template: { capability: 'docs:write', writes: ['b.txt'] } },
          { id: 'dirty', template: { capability: 'docs:write', writes: ['c.txt'] } },
          { id: 'broken', template: { capability: 'docs:write', writes: ['d.txt'] } },
        ],
      },
    ],
  });
  const { workflowRunId } = createWorkflowRun({ repoRoot: tmp, workflowId: workflow.id, workflow });
  const hold = acquireAdvanceLock(tmp, workflowRunId);
  const units = {};
  for (const id of ['merged', 'unmerged', 'dirty', 'broken']) {
    const branch = `wf/${workflowRunId}/${id}`;
    const wt = createWorkflowWorktree({ repoRoot: tmp, branch });
    worktreeDirs.push(wt.worktreePath);
    units[id] = { branch, worktreePath: wt.worktreePath };
    appendWorkflowEvent({
      repoRoot: tmp,
      workflowRunId,
      hold,
      event: { type: 'unit.scheduled', payload: { stepId: 's1', unitId: id, worktreePath: wt.worktreePath, branch } },
    });
  }
  const commitIn = (id, file) => {
    fs.writeFileSync(path.join(units[id].worktreePath, file), `${id}\n`);
    execFileSync('git', ['add', file], { cwd: units[id].worktreePath, stdio: 'ignore' });
    execFileSync('git', ['-c', 'user.name=T', '-c', 'user.email=t@t.local', 'commit', '-m', id], { cwd: units[id].worktreePath, stdio: 'ignore' });
  };
  commitIn('merged', 'a.txt');
  execFileSync('git', ['-c', 'user.name=T', '-c', 'user.email=t@t.local', 'merge', '--no-ff', '-m', 'land merged', units.merged.branch], { cwd: tmp, stdio: 'ignore' });
  commitIn('unmerged', 'b.txt');
  fs.writeFileSync(path.join(units.dirty.worktreePath, 'scratch.txt'), 'uncommitted\n');
  for (const id of ['merged', 'unmerged', 'dirty']) {
    appendWorkflowEvent({ repoRoot: tmp, workflowRunId, hold, event: { type: 'unit.complete', payload: { stepId: 's1', unitId: id, outcome: 'pass' } } });
  }
  appendWorkflowEvent({ repoRoot: tmp, workflowRunId, hold, event: { type: 'unit.complete', payload: { stepId: 's1', unitId: 'broken', outcome: 'execution-failure' } } });
  appendWorkflowEvent({ repoRoot: tmp, workflowRunId, hold, event: { type: terminal, payload: { outcome: terminal === 'workflow.fail' ? 'execution-failure' : 'pass' } } });
  hold.release();
  return { workflowRunId, units };
}

test('a finished workflow removes integrated unit worktrees and keeps the others with their paths in the run event', async () => {
  const tmp = setupTestRepo();
  const { workflowRunId, units } = await seedRunWithUnitWorktrees(tmp, { terminal: 'workflow.complete' });

  const state = await resumeWorkflow(workflowRunId, { repoRoot: tmp, cwd: tmp });

  assert.equal(fs.existsSync(units.merged.worktreePath), false, 'integrated unit worktree should be removed');
  assert.equal(execFileSync('git', ['branch', '--list', units.merged.branch], { cwd: tmp, encoding: 'utf8' }).trim(), '');
  for (const id of ['unmerged', 'dirty', 'broken']) {
    assert.equal(fs.existsSync(units[id].worktreePath), true, `${id} worktree must stay`);
  }
  assert.deepEqual(state.worktrees.removed.map((e) => e.unitId), ['merged']);
  const kept = Object.fromEntries(state.worktrees.kept.map((e) => [e.unitId, e]));
  assert.equal(kept.broken.worktreePath, units.broken.worktreePath);
  assert.match(kept.broken.reason, /execution-failure/);
  assert.match(kept.unmerged.reason, /not integrated/);
  assert.match(kept.dirty.reason, /uncommitted/);
  const logged = readWorkflowEvents({ repoRoot: tmp, workflowRunId }).filter((e) => e.type === 'workflow.worktrees');
  assert.equal(logged.length, 1);

  // A second pass over the finished run changes nothing and logs nothing more.
  await resumeWorkflow(workflowRunId, { repoRoot: tmp, cwd: tmp });
  assert.equal(readWorkflowEvents({ repoRoot: tmp, workflowRunId }).filter((e) => e.type === 'workflow.worktrees').length, 1);
});

test('a failed workflow cleans up the same way', async () => {
  const tmp = setupTestRepo();
  const { workflowRunId, units } = await seedRunWithUnitWorktrees(tmp, { terminal: 'workflow.fail' });
  const state = await resumeWorkflow(workflowRunId, { repoRoot: tmp, cwd: tmp });
  assert.equal(state.status, 'failed');
  assert.equal(fs.existsSync(units.merged.worktreePath), false);
  assert.equal(fs.existsSync(units.broken.worktreePath), true);
});

test('a repository whose trunk is "master" still gets its integrated unit worktrees removed', async () => {
  const tmp = setupTestRepo();
  execFileSync('git', ['branch', '-m', 'main', 'master'], { cwd: tmp, stdio: 'ignore' });
  const { workflowRunId, units } = await seedRunWithUnitWorktrees(tmp, { terminal: 'workflow.complete' });

  const state = await resumeWorkflow(workflowRunId, { repoRoot: tmp, cwd: tmp });

  assert.equal(fs.existsSync(units.merged.worktreePath), false, 'a unit merged into master is integrated');
  assert.deepEqual(state.worktrees.removed.map((e) => e.unitId), ['merged']);
  assert.match(state.worktrees.kept.find((e) => e.unitId === 'unmerged').reason, /not integrated/);
});

test('the trunk a finished unit is judged against is the remote default branch, else the checkout branch', () => {
  const tmp = setupTestRepo();
  execFileSync('git', ['branch', '-m', 'main', 'trunk'], { cwd: tmp, stdio: 'ignore' });
  assert.equal(resolveIntegrationTarget({ repoRoot: tmp }), 'trunk', 'local-only repo: its own branch');

  const origin = makeFixtureDir('fgos-wf-origin-');
  execFileSync('git', ['init', '--bare', '-b', 'develop', origin], { stdio: 'ignore' });
  execFileSync('git', ['remote', 'add', 'origin', origin], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['push', '-q', 'origin', 'trunk:develop'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['fetch', '-q', 'origin'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['remote', 'set-head', 'origin', 'develop'], { cwd: tmp, stdio: 'ignore' });
  assert.equal(resolveIntegrationTarget({ repoRoot: tmp }), 'develop', "remote's default branch wins over the checkout");
});

test('workflow cleanup preserves dirty bytes, registration and branch on refusal', () => {
  const tmp = setupTestRepo();
  const branch = 'wf/dirty-cleanup';
  const { worktreePath } = createWorkflowWorktree({ repoRoot: tmp, branch });
  worktreeDirs.push(worktreePath);
  const scratch = path.join(worktreePath, 'scratch.txt');
  fs.writeFileSync(scratch, 'must survive\n');
  assert.throws(() => cleanupWorkflowWorktree({ repoRoot: tmp, worktreePath, branch }), /worktree.*dirty|dirty.*preserved/);
  assert.equal(fs.readFileSync(scratch, 'utf8'), 'must survive\n');
  assert.equal(execFileSync('git', ['branch', '--list', branch], { cwd: tmp, encoding: 'utf8' }).trim(), `+ ${branch}`);
  assert.ok(execFileSync('git', ['worktree', 'list', '--porcelain'], { cwd: tmp, encoding: 'utf8' }).includes(worktreePath));
});
