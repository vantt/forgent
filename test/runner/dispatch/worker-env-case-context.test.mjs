// test/runner/dispatch/worker-env-case-context.test.mjs — the case a worker names is the one its launch was admitted into, never inherited

import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { workerBaseEnv, caseContextEnv, CASE_ID_ENV, CASE_RESERVATION_ENV } from '../../../src/runner/dispatch/adapters.mjs';
import { terminalAgentArgs } from '../../../src/runner/dispatch/assignment-runner.mjs';
import { runUnit } from '../../../src/runner/execution/run.mjs';
import { resolveUnitInputs } from '../../../src/runner/execution/handoff-refs.mjs';
import { createCaseAdmissionPort } from '../../../src/workflow/case-admission-port.mjs';
import { seedFileLocalBwrapRegistry } from '../confinement-registry-fixture.helper.mjs';
import { setupWorkflowFixtureRepo } from '../../helpers/workflow-fixture-repo.mjs';
import { openCase } from '../../helpers/workflow-case-fixture.mjs';

seedFileLocalBwrapRegistry();

// The worker reports the case variables it was started with, as its own report.
const WORKER_BODY = `
  const seen = { id: process.env.FGOS_CASE_ID ?? null, reservation: process.env.FGOS_CASE_RESERVATION ?? null };
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nThe worker saw the case variables: ' + JSON.stringify(seen) + '. Nothing else was inspected.\\n');
  fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done' }));
`;

function setupRepo() {
  const tmp = setupWorkflowFixtureRepo({ prefix: 'fgos-worker-env-', readme: '# Env', gitName: 'Env Test', capabilities: ['docs:write'], workerBody: WORKER_BODY });
  fs.appendFileSync(`${tmp}/.gitignore`, '.fgos/\n*.mjs\n');
  return tmp;
}

const unit = { id: 'u-look', objective: 'Look around', capability: 'docs:write', writes: [] };
const seenBy = (tmp, unitRunId) => {
  const [report] = resolveUnitInputs([`unit-run:${unitRunId}/producer`], tmp).refs;
  return JSON.parse(/case variables: (\{.*?\})\./.exec(fs.readFileSync(report, 'utf8'))[1]);
};

test('a worker starts with none of its controller\'s lock descriptions: the lock fd, lock job and main-lock holder pid are dropped', () => {
  const env = workerBaseEnv({ PATH: '/usr/bin', FGOS_LOCK_FD: 'main-checkout:3', FGOS_LOCK_JOB: 'job-1', FGOS_MAIN_LOCK_HOLDER_PID: '4242' });
  assert.equal(env.FGOS_LOCK_FD, undefined);
  assert.equal(env.FGOS_LOCK_JOB, undefined);
  assert.equal(env.FGOS_MAIN_LOCK_HOLDER_PID, undefined);
  assert.equal(env.PATH, '/usr/bin');
});

test('a worker starts with neither case variable of its controller: both are dropped like the session ids', () => {
  const env = workerBaseEnv({ PATH: '/usr/bin', [CASE_ID_ENV]: 'wf-a', [CASE_RESERVATION_ENV]: 'rsv-a', FGOS_SESSION_ID: 's' });
  assert.equal(env[CASE_ID_ENV], undefined);
  assert.equal(env[CASE_RESERVATION_ENV], undefined);
  assert.equal(env.FGOS_SESSION_ID, undefined);
  assert.deepEqual(caseContextEnv({ caseId: 'wf-b', reservationId: 'rsv-b' }), { FGOS_CASE_ID: 'wf-b', FGOS_CASE_RESERVATION: 'rsv-b' });
});

test('a worker cannot name the host binary of its controller: FGOS_HOST_BIN is dropped and the rest kept', () => {
  const env = workerBaseEnv({ PATH: '/usr/bin', FGOS_HOST_BIN: '/tmp/other-host/fgos' });
  assert.equal(env.FGOS_HOST_BIN, undefined);
  assert.equal(env.PATH, '/usr/bin');
});

test('a controller carrying case A launches a worker admitted into case B: the worker sees B only; a standalone launch sees none', async () => {
  const tmp = setupRepo();
  const caseB = openCase({ repoRoot: tmp });
  const before = { id: process.env[CASE_ID_ENV], reservation: process.env[CASE_RESERVATION_ENV] };
  process.env[CASE_ID_ENV] = 'wf-controller-case';
  process.env[CASE_RESERVATION_ENV] = 'rsv-controller';
  try {
    const port = createCaseAdmissionPort({ repoRoot: tmp, env: {} });
    const admitted = await runUnit({ unitData: unit, caseAdmission: port, caseRef: { caseId: caseB.caseId, activity: 'scout' }, repoRoot: tmp, cwd: tmp, worktree: tmp });
    assert.equal(admitted.outcome, 'pass');
    const link = JSON.parse(fs.readFileSync(`${tmp}/.fgos/assignments/${admitted.unitRunId}/unit.json`, 'utf8')).workflow;
    assert.deepEqual(seenBy(tmp, admitted.unitRunId), { id: caseB.caseId, reservation: link.reservationId });

    const standalone = await runUnit({ unitData: unit, caseAdmission: createCaseAdmissionPort({ repoRoot: tmp, env: {} }), repoRoot: tmp, cwd: tmp, worktree: tmp });
    assert.equal(standalone.outcome, 'pass');
    assert.deepEqual(seenBy(tmp, standalone.unitRunId), { id: null, reservation: null });
  } finally {
    for (const [name, value] of [[CASE_ID_ENV, before.id], [CASE_RESERVATION_ENV, before.reservation]]) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  }
});

test('an executor that does not pass the environment gets the case beside the writer id in its injected config', () => {
  const resolvedCmd = { command: 'codex', args: ['exec'], argsTemplate: ['exec', '{prompt}'], interactiveMode: undefined };
  const base = { resolvedCmd, prompt: 'brief', model: 'm', runDir: '/run', writerId: 'writer-1' };
  const withCase = terminalAgentArgs({ ...base, caseContext: { caseId: 'wf-b', reservationId: 'rsv-b' } });
  assert.equal(withCase.at(-1), 'shell_environment_policy.set={FGOS_SESSION_ID="writer-1",FGOS_CASE_ID="wf-b",FGOS_CASE_RESERVATION="rsv-b"}');
  assert.equal(withCase.at(-2), '-c');
  const standalone = terminalAgentArgs(base);
  assert.equal(standalone.at(-1), 'shell_environment_policy.set={FGOS_SESSION_ID="writer-1"}', 'a launch no case admitted carries none');
  const claude = terminalAgentArgs({ ...base, resolvedCmd: { ...resolvedCmd, command: 'claude' }, caseContext: { caseId: 'wf-b', reservationId: 'rsv-b' } });
  assert.equal(claude.some((arg) => String(arg).includes('shell_environment_policy')), false, 'only a codex shell needs the setting; the rest read the pane environment');
});
