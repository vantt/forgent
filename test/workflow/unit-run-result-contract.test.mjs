// test/workflow/unit-run-result-contract.test.mjs — the one wiring proof of the Unit run result contract
// (docs/platform/runner/contracts/unit-run-result.md, section 8) through Workflow: a three-seat case in which one
// seat ends on infrastructure and is run again by `resume`, one reaches a verdict and one is refused by policy.
//
// What the case does with each seat is decided from the contract's fields alone: `outcome`, `infrastructure`,
// `outOfScope`, `evaluations` and each attempt's `activity`. The case is run end to end through the real
// Execution Core with fixture executors declared in this test's own config; nothing here reads a private file of
// Execution (`unit.json`, assignment directories). The per-outcome cases are owned by the golden fixtures
// (`test/runner/execution/unit-run-result-fixtures.test.mjs`) and by `workflow-store-ledger.test.mjs`; this test only proves the wiring.

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

// The fields of a settled seat result and of a Unit that the contract names (sections 3 and 4). A ledger entry
// cut down to these is everything a Workflow reader may rely on.
const CONTRACT_UNIT_FIELDS = ['stepId', 'unitId', 'unitRunId', 'outcome', 'infrastructure', 'outOfScope', 'outOfScopeOnBranch', 'evaluations'];
const CONTRACT_RESULT_FIELDS = ['seat', 'role', 'round', 'posture', 'outcome', 'infrastructure', 'binding', 'output'];

const pick = (source, fields) => Object.fromEntries(fields.filter((f) => f in source).map((f) => [f, source[f]]));

function contractOnly(event) {
  if (event.type !== 'unit.complete') return event;
  const results = (event.payload.results ?? []).map((result) => ({
    ...pick(result, CONTRACT_RESULT_FIELDS),
    ...(result.runResult?.activity ? { runResult: { activity: result.runResult.activity } } : {}),
  }));
  return { ...event, payload: { ...pick(event.payload, CONTRACT_UNIT_FIELDS), results } };
}

// What a case reader decides about each unit: where it stands, how it ended, whether `resume` may run it again.
const decisionsOf = (state) => Object.fromEntries(Object.entries(state.steps).map(([id, step]) => [id, {
  status: step.status,
  outcome: step.outcome ?? null,
  units: Object.fromEntries(Object.entries(step.units).map(([uid, u]) => [uid, { status: u.status, outcome: u.outcome ?? null, rerunnable: u.rerunnable === true }])),
}]));

test('a three-seat case settles from contract fields alone: an infrastructure seat is run again, a verdict stands and a refusal is terminal', async () => {
  const tmp = setupTestRepo();
  const healthy = path.join(tmp, 'echo-worker.mjs');
  const brokenWorker = path.join(tmp, 'broken-worker.mjs');
  fs.appendFileSync(path.join(tmp, '.git', 'info', 'exclude'), 'broken-worker.mjs\n');

  // The fixture executor `broken-node` runs a worker that does not exist yet: its seat ends on infrastructure.
  const cfg = readProjectConfig(tmp);
  const args = [brokenWorker, '{prompt}'];
  cfg.runner.executors['broken-node'] = {
    ...cfg.runner.executors['test-node'],
    description: 'Fixture executor whose worker is missing until the test installs it',
    args,
    invocations: [{ id: 'cli-default', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command: process.execPath, args }],
  };
  cfg.runner.capabilities['docs:flaky'] = { prefer: [{ executor: 'broken-node' }], rigor: 'standard', tier: 'standard' };
  // No model of the pool serves the frontier tier: policy refuses this seat before anything runs.
  cfg.runner.capabilities['unconfigured:capability'] = { prefer: [{ executor: 'test-node' }], tier: 'frontier' };
  writeProjectConfig(tmp, cfg);

  const workflow = validateWorkflow({
    id: 'test/unit-run-result-contract',
    steps: [{
      id: 'council',
      dependsOn: [],
      units: [
        { id: 'seat-verdict', template: { capability: 'docs:write' } },
        { id: 'seat-flaky', template: { capability: 'docs:flaky' } },
        { id: 'seat-refused', template: { capability: 'unconfigured:capability', pattern: 'solo', objective: 'no executor serves this' } },
      ],
    }],
  });

  // 1. The verdict seat passes; the next seat ends on infrastructure, so the case stops there with nothing decided.
  const first = await startWorkflow({ workflow, repoRoot: tmp, cwd: tmp, worktree: tmp });
  assert.equal(first.status, 'failed');
  assert.equal(first.steps.council.units['seat-verdict'].outcome, 'pass');
  assert.equal(first.steps.council.units['seat-flaky'].outcome, 'execution-failure');
  assert.equal(first.steps.council.units['seat-flaky'].rerunnable, true, 'infrastructure is the one fact that lets resume run a seat again');
  assert.equal(first.steps.council.units['seat-verdict'].rerunnable, undefined, 'a verdict is never run again');
  assert.equal(first.steps.council.units['seat-refused'], undefined, 'the seat after the failure never started');
  const flakyRun = first.steps.council.units['seat-flaky'].unitRunId;
  const verdictRun = first.steps.council.units['seat-verdict'].unitRunId;

  // 2. The infrastructure is repaired. Resume runs the failed seat again as a fresh Unit run, keeps the verdict,
  // and the seat that policy refuses ends the case by name.
  fs.copyFileSync(healthy, brokenWorker);
  const second = await resumeWorkflow(first.workflowRunId, { repoRoot: tmp, cwd: tmp, worktree: tmp });
  assert.equal(second.status, 'failed');
  assert.equal(second.outcome, 'policy-refusal');
  assert.equal(second.steps.council.units['seat-verdict'].unitRunId, verdictRun, 'the verdict seat was not run again');
  assert.equal(second.steps.council.units['seat-flaky'].outcome, 'pass');
  assert.notEqual(second.steps.council.units['seat-flaky'].unitRunId, flakyRun, 'the seat that failed on infrastructure ran as a fresh Unit run');
  assert.equal(second.steps.council.units['seat-refused'].outcome, 'policy-refusal');
  assert.equal(second.steps.council.units['seat-refused'].rerunnable, undefined, 'a refusal is not infrastructure');

  // 3. A verdict-class ending is terminal: resume refuses by name and records nothing.
  const before = readWorkflowEvents({ repoRoot: tmp, workflowRunId: first.workflowRunId }).length;
  await assert.rejects(
    () => resumeWorkflow(first.workflowRunId, { repoRoot: tmp, cwd: tmp, worktree: tmp }),
    /nothing-to-resume: step council ended policy-refusal/,
  );
  const events = readWorkflowEvents({ repoRoot: tmp, workflowRunId: first.workflowRunId });
  assert.equal(events.length, before);

  // 4. The same decisions come out of a ledger cut down to the contract's fields: no reader of the case depends on
  // a field the contract does not name.
  const withContractFieldsOnly = events.map(contractOnly);
  assert.deepEqual(decisionsOf(projectWorkflowState(withContractFieldsOnly)), decisionsOf(projectWorkflowState(events)));
  const completions = events.filter((e) => e.type === 'unit.complete').map((e) => e.payload);
  for (const completion of completions) {
    assert.equal(typeof completion.infrastructure, 'boolean', `${completion.unitId}: Execution hands up the infrastructure fact`);
  }
  assert.deepEqual(
    completions.map((c) => [c.unitId, c.outcome, c.infrastructure]),
    [['seat-verdict', 'pass', false], ['seat-flaky', 'execution-failure', true], ['seat-flaky', 'pass', false], ['seat-refused', 'policy-refusal', false]],
  );
});
