// test/workflow/workflow-runner-resume.test.mjs — how a run ends and how `resume` picks it up: a dead controller's Unit run is
// continued, a refused or throwing unit fails its step by name, and an infrastructure failure is run again once per call.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { validateWorkflow } from '../../src/workflow/definition.mjs';
import { readWorkflowEvents, projectWorkflowState } from '../../src/workflow/store.mjs';
import { startWorkflow, resumeWorkflow } from '../../src/workflow/index.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { writeProjectConfig, readProjectConfig } from '../helpers/config-fixture.mjs';
import { setupTestRepo } from '../helpers/workflow-runner-fixture.mjs';

seedFileLocalBwrapRegistry();

test('a resumed workflow continues the unit run its dead controller started and dispatches no settled seat again', async () => {
  const tmp = setupTestRepo();
  const workflow = validateWorkflow({
    id: 'test/resume-unit-run',
    steps: [{ id: 'only', dependsOn: [], units: [{ id: 'u1', template: { capability: 'docs:write' } }] }],
  });
  const first = await startWorkflow({ workflow, repoRoot: tmp, cwd: tmp });
  assert.equal(first.status, 'completed');
  const id = first.workflowRunId;
  const events = readWorkflowEvents({ repoRoot: tmp, workflowRunId: id });
  const started = events.find((e) => e.type === 'unit.started');
  const completed = events.find((e) => e.type === 'unit.complete');
  assert.ok(started, 'the Unit run id is journaled when the run is created');
  assert.equal(started.payload.unitRunId, completed.payload.unitRunId);
  assert.ok(started.seq < completed.seq, 'and before the unit can complete');

  // The controller dies after the Unit run settled its seat but before the unit completed.
  const eventsFile = path.join(tmp, '.fgos', 'workflow-runs', id, 'events.jsonl');
  const kept = events.filter((e) => e.seq < completed.seq);
  fs.writeFileSync(eventsFile, kept.map((e) => JSON.stringify(e)).join('\n') + '\n');
  assert.equal(projectWorkflowState(kept).steps.only.units.u1.unitRunId, started.payload.unitRunId, 'a running unit carries its run id');
  const attemptsBefore = fs.readdirSync(path.join(tmp, '.fgos', 'assignments', started.payload.unitRunId, 'producer', '1', 'runs'));

  const resumed = await resumeWorkflow(id, { repoRoot: tmp, cwd: tmp });

  assert.equal(resumed.status, 'completed');
  assert.equal(resumed.steps.only.units.u1.unitRunId, started.payload.unitRunId, 'the same Unit run was continued');
  assert.deepEqual(fs.readdirSync(path.join(tmp, '.fgos', 'assignments')).filter((d) => d.startsWith('unit-run-')), [started.payload.unitRunId], 'no second Unit run was created');
  assert.deepEqual(
    fs.readdirSync(path.join(tmp, '.fgos', 'assignments', started.payload.unitRunId, 'producer', '1', 'runs')),
    attemptsBefore,
    'the settled seat was not dispatched again',
  );
});

test('a running unit whose recorded worktree is gone starts a fresh Unit run instead of failing the workflow', async () => {
  const tmp = setupTestRepo();
  const workflow = validateWorkflow({
    id: 'test/resume-missing-worktree',
    steps: [{ id: 'only', dependsOn: [], units: [{ id: 'u1', template: { capability: 'docs:write' } }] }],
  });
  const first = await startWorkflow({ workflow, repoRoot: tmp, cwd: tmp });
  const id = first.workflowRunId;
  const events = readWorkflowEvents({ repoRoot: tmp, workflowRunId: id });
  const completed = events.find((e) => e.type === 'unit.complete');
  const oldRunId = completed.payload.unitRunId;
  // Died before completing, and the worktree it ran in no longer exists (temp-dir cleanup, reboot).
  const kept = events.filter((e) => e.seq < completed.seq).map((e) => (
    e.type === 'unit.scheduled' ? { ...e, payload: { ...e.payload, worktreePath: path.join(tmp, 'gone-worktree'), branch: 'wf/x/u1' } } : e
  ));
  fs.writeFileSync(path.join(tmp, '.fgos', 'workflow-runs', id, 'events.jsonl'), kept.map((e) => JSON.stringify(e)).join('\n') + '\n');

  const resumed = await resumeWorkflow(id, { repoRoot: tmp, cwd: tmp });

  assert.equal(resumed.status, 'completed', 'the workflow carries on rather than failing for good');
  assert.notEqual(resumed.steps.only.units.u1.unitRunId, oldRunId, 'a fresh Unit run replaced the one that could not be continued');
});

test('a unit refused by policy fails its step and the workflow; dependent steps never run', async () => {
  const tmp = setupTestRepo();
  // The capability is declared, but its pool's only executor has no model at the tier it asks for: policy refuses it.
  const cfg = readProjectConfig(tmp);
  cfg.runner.capabilities['unconfigured:capability'] = { prefer: [{ executor: 'test-node' }], tier: 'frontier' };
  writeProjectConfig(tmp, cfg);
  const workflow = validateWorkflow({
    id: 'refusal-stops-run',
    steps: [
      {
        id: 'first',
        units: [{ id: 'u1', template: { capability: 'unconfigured:capability', pattern: 'solo', objective: 'no executor serves this' } }],
      },
      {
        id: 'second',
        dependsOn: ['first'],
        units: [{ id: 'u2', template: { capability: 'docs:write', pattern: 'solo', objective: 'must never start' } }],
      },
    ],
  });

  const state = await startWorkflow({ workflow, repoRoot: tmp, cwd: tmp, worktree: tmp });

  assert.equal(state.status, 'failed');
  assert.equal(state.outcome, 'policy-refusal');
  assert.equal(state.steps.first.status, 'failed');
  assert.match(state.steps.first.reason, /unconfigured:capability/);
  assert.equal(state.steps.second.status, 'pending');
  assert.deepEqual(state.steps.second.units, {});

  // A verdict is terminal: resuming refuses by name, records nothing, and never starts the dependent step.
  const before = readWorkflowEvents({ repoRoot: tmp, workflowRunId: state.workflowRunId }).length;
  await assert.rejects(
    () => resumeWorkflow(state.workflowRunId, { repoRoot: tmp, cwd: tmp, worktree: tmp }),
    /nothing-to-resume: step first ended policy-refusal/,
  );
  const events = readWorkflowEvents({ repoRoot: tmp, workflowRunId: state.workflowRunId });
  assert.equal(events.length, before);
  const types = events.map((e) => e.type);
  assert.ok(!types.includes('step.complete'));
  assert.deepEqual(types.filter((t) => t === 'step.fail' || t === 'workflow.fail'), ['step.fail', 'workflow.fail']);
});

test('resume runs a unit that failed on infrastructure again as a fresh Unit run, once per call, and a second failure ends the step again', async () => {
  const tmp = setupTestRepo();
  const workflow = validateWorkflow({
    id: 'test/resume-infrastructure-failure',
    steps: [
      { id: 'first', dependsOn: [], units: [{ id: 'u1', template: { capability: 'docs:write' } }] },
      { id: 'second', dependsOn: ['first'], units: [{ id: 'u2', template: { capability: 'docs:write' } }] },
    ],
  });
  const worker = path.join(tmp, 'echo-worker.mjs');
  const kept = fs.readFileSync(worker, 'utf8');
  fs.rmSync(worker);
  const failed = await startWorkflow({ workflow, repoRoot: tmp, cwd: tmp, worktree: tmp });
  assert.equal(failed.status, 'failed');
  assert.equal(failed.steps.first.units.u1.outcome, 'execution-failure');
  const firstRunId = failed.steps.first.units.u1.unitRunId;

  // Still broken: the rerun is one admitted Unit run and ends the step again; nothing retries by itself.
  const again = await resumeWorkflow(failed.workflowRunId, { repoRoot: tmp, cwd: tmp, worktree: tmp });
  assert.equal(again.status, 'failed');
  const runsAfterSecondTry = fs.readdirSync(path.join(tmp, '.fgos', 'assignments')).filter((d) => d.startsWith('unit-run-'));
  assert.equal(runsAfterSecondTry.length, 2, 'one fresh Unit run for the one resume');
  assert.notEqual(again.steps.first.units.u1.unitRunId, firstRunId);

  fs.writeFileSync(worker, kept);
  const resumed = await resumeWorkflow(failed.workflowRunId, { repoRoot: tmp, cwd: tmp, worktree: tmp });
  assert.equal(resumed.status, 'completed', JSON.stringify(resumed.steps));
  assert.equal(resumed.steps.first.units.u1.outcome, 'pass');
  assert.equal(resumed.steps.second.status, 'completed');
  const types = readWorkflowEvents({ repoRoot: tmp, workflowRunId: failed.workflowRunId }).map((e) => e.type);
  assert.equal(types.filter((t) => t === 'step.start').length, 4, 'first, two reopenings, then second');
  assert.equal(types.filter((t) => t === 'unit.scheduled').length, 4, 'three attempts of u1 and one of u2');
});

test('a completed unit is recorded without the evidence of its seat results and keeps every field a reader uses', async () => {
  const tmp = setupTestRepo();
  const workflow = validateWorkflow({
    id: 'test/slim-ledger',
    steps: [{ id: 'only', dependsOn: [], units: [{ id: 'u1', template: { capability: 'docs:write' } }] }],
  });
  const state = await startWorkflow({ workflow, repoRoot: tmp, cwd: tmp, worktree: tmp });
  assert.equal(state.status, 'completed');
  const complete = readWorkflowEvents({ repoRoot: tmp, workflowRunId: state.workflowRunId }).find((e) => e.type === 'unit.complete');
  const [result] = complete.payload.results;
  assert.equal('evidence' in result.runResult, false);
  assert.equal(result.runResult.agentClaim.summary, 'Done');
  assert.equal(result.runResult.executorId, 'test-node');
  assert.ok(result.runResult.settledAt && Array.isArray(result.runResult.settleReports));
  assert.equal(result.binding.executor, 'test-node');
  assert.equal(result.outcome, 'pass');
});

test('a unit that throws instead of returning fails its step and the workflow with the reason recorded', async () => {
  const tmp = setupTestRepo();
  const workflow = validateWorkflow({
    id: 'throw-stops-run',
    steps: [
      {
        id: 'first',
        units: [{ id: 'u1', template: { capability: 'docs:write', pattern: 'no-such-pattern', objective: 'cannot be dispatched' } }],
      },
      {
        id: 'second',
        dependsOn: ['first'],
        units: [{ id: 'u2', template: { capability: 'docs:write', pattern: 'solo', objective: 'must never start' } }],
      },
    ],
  });

  const state = await startWorkflow({ workflow, repoRoot: tmp, cwd: tmp, worktree: tmp });

  assert.equal(state.status, 'failed');
  assert.equal(state.outcome, 'execution-failure');
  assert.equal(state.steps.first.status, 'failed');
  assert.match(state.steps.first.reason, /unit u1 could not run: .*no-such-pattern/);
  assert.equal(state.steps.first.units.u1.status, 'completed');
  assert.equal(state.steps.first.units.u1.outcome, 'execution-failure');
  assert.equal(state.steps.second.status, 'pending');
  const types = readWorkflowEvents({ repoRoot: tmp, workflowRunId: state.workflowRunId }).map((e) => e.type);
  assert.deepEqual(types.filter((t) => t === 'step.fail' || t === 'workflow.fail'), ['step.fail', 'workflow.fail']);
});

test('resume refuses --timeout and --account before it reads the run: a resumed run keeps what it started with', async () => {
  const tmp = setupTestRepo();
  await assert.rejects(resumeWorkflow('no-such-run', { repoRoot: tmp, cwd: tmp, timeout: '2h' }), /--timeout cannot change a resumed workflow run: it keeps the timeout it was started with/);
  await assert.rejects(resumeWorkflow('no-such-run', { repoRoot: tmp, cwd: tmp, account: 'node/acct-cli' }), /--account cannot change a resumed workflow run: it keeps the account its seats were bound to/);
});
