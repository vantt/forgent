import '../helpers/process-tmp-root.mjs';
// V-CONSUMER (Git spec §15, §1): the real business-discussion Workflow, a read-only Unit route,
// runs where a business project lives. No other test runs a registered Workflow on a detached HEAD
// without origin/HEAD or outside a repository: test/workflow/business-discussion-workflow.test.mjs
// owns the preset's step order and gate on an ordinary branch checkout, and
// test/git/inspect.test.mjs owns Inspect's typed `notARepository` answer.
// The fake worker is confined by bwrap, so this file needs a host that allows user namespaces.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { startWorkflow, answerWorkflow } from '../../src/workflow/index.mjs';
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
