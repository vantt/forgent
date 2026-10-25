import '../helpers/process-tmp-root.mjs';
// V-CONSUMER (Git spec §15, §1): the real business-discussion Workflow, a read-only Unit route,
// runs where a business project lives. No other test runs a registered Workflow on a detached HEAD
// without origin/HEAD or outside a repository: test/workflow/business-discussion-workflow.test.mjs
// owns the preset's step order and gate on an ordinary branch checkout, and
// test/git/inspect.test.mjs owns Inspect's typed `notARepository` answer. The labelled writing
// fixture below is the one noncoding Unit that writes and lands; it is never a production caller.
// The fake worker is confined by bwrap, so this file needs a host that allows user namespaces.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { execFileSync } from 'node:child_process';

import { startWorkflow, answerWorkflow, validateWorkflow } from '../../src/workflow/index.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { setupWorkflowFixtureRepo } from '../helpers/workflow-fixture-repo.mjs';

seedFileLocalBwrapRegistry();

function businessProject(prefix) {
  return setupWorkflowFixtureRepo({
    prefix,
    readme: '# Business project',
    gitName: 'Consumer Test',
    capabilities: ['business:frame', 'business:perspectives', 'business:critique', 'business:synthesize', 'business:plan'],
    reviewed: { maxRounds: 2, checkersByRigor: { standard: ['reviewer'] } },
    workerBody: `
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Strategic Report\\nComprehensive strategic business analysis completed with clear market viability and financial risk assessments.\\n');
      fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done' }));
    `,
  });
}

async function runToCompletion(dir) {
  let state = await startWorkflow({ workflowId: 'business-discussion', repoRoot: dir, cwd: dir });
  assert.equal(state.status, 'parked', JSON.stringify(state.steps));
  assert.equal(state.questions[0].stepId, 'approval');
  state = await answerWorkflow(state.workflowRunId, { stepId: 'approval', answer: 'Approved', approved: true, repoRoot: dir, cwd: dir });
  assert.equal(state.status, 'completed');
  assert.equal(state.outcome, 'pass');
}

test('business-discussion completes on a detached HEAD without origin/HEAD and moves no ref', async () => {
  const dir = businessProject('fgos-consumer-detached-');
  const git = path.join(dir, '.git');
  // Detach by writing HEAD itself: the fixture has no remote, so origin/HEAD does not exist either.
  const tip = fs.readFileSync(path.join(git, 'refs/heads/main'), 'utf8').trim();
  fs.writeFileSync(path.join(git, 'HEAD'), `${tip}\n`);
  assert.equal(fs.existsSync(path.join(git, 'refs/remotes/origin/HEAD')), false);

  await runToCompletion(dir);

  // A read-only route leaves the checkout exactly where it was.
  assert.equal(fs.readFileSync(path.join(git, 'HEAD'), 'utf8').trim(), tip);
  assert.equal(fs.readFileSync(path.join(git, 'refs/heads/main'), 'utf8').trim(), tip);
});

test('business-discussion completes in a directory that is not a repository', async () => {
  // Owner decision 2026-10-18 (Git plan Q1, spec §18 item 8): a Workflow whose Units declare no
  // writes runs outside a repository; Inspect answers notARepository and nothing creates one.
  const dir = businessProject('fgos-consumer-norepo-');
  fs.rmSync(path.join(dir, '.git'), { recursive: true, force: true });

  await runToCompletion(dir);

  assert.equal(fs.existsSync(path.join(dir, '.git')), false);
});

test('a labelled noncoding writing fixture lands its one declared file on main', async () => {
  // Fixture, not a production route: a business capability whose Unit declares writes is committed
  // by the runner and landed by an integrate step exactly as a coding Unit is.
  const dir = setupWorkflowFixtureRepo({
    prefix: 'fgos-consumer-writing-',
    readme: '# Business project',
    gitName: 'Consumer Test',
    capabilities: ['business:plan'],
    workerBody: `
      if (match[1].includes('/producer/')) fs.writeFileSync('business-plan.md', '# Business plan\\n');
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Business plan\\nThe plan was written to its declared file and checked against the brief in full.\\n');
      fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done', assessment: { verdict: 'pass' } }));
    `,
  });
  const git = (args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim();
  const before = git(['rev-parse', 'main']);
  const workflow = validateWorkflow({
    id: 'noncoding-writing-fixture',
    steps: [
      { id: 'plan', units: [{ id: 'plan', template: { capability: 'business:plan', pattern: 'reviewed', objective: 'Write the business plan.', writes: ['business-plan.md'] } }] },
      { id: 'land', kind: 'integrate', dependsOn: ['plan'] },
    ],
  });

  const state = await startWorkflow({ workflow, repoRoot: dir, cwd: dir, worktree: dir });

  assert.equal(state.status, 'completed', JSON.stringify(state.steps));
  assert.equal(git(['show', 'main:business-plan.md']), '# Business plan');
  assert.equal(git(['merge-base', '--is-ancestor', before, 'main']), '');
  assert.notEqual(git(['rev-parse', 'main']), before);
});
