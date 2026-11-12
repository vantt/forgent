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
  fs.writeFileSync(path.join(runDir, 'report-1.md'), '# Report\\nThe worker saw the case variables: ' + JSON.stringify(seen) + '. Nothing else was inspected.\\n');
  fs.writeFileSync(path.join(runDir, 'result-1.json'), JSON.stringify({ status: 'done', summary: 'Done' }));
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

// The one owning proof of what a worker's base environment holds. It retires the per-name "drops X" proofs
// of the lock, case, host and session variables: each of those names is in this canary set.
test('a worker starts from the allowlist only: no variable of its controller outside it crosses, whatever its name', () => {
  const allowed = { PATH: '/usr/bin', HOME: '/home/u', USER: 'u', LANG: 'C.UTF-8', LC_TIME: 'C', TERM: 'xterm', TMPDIR: '/tmp', CLAUDE_CONFIG_DIR: '/c',
    HTTPS_PROXY: 'http://proxy:3128', no_proxy: 'localhost', SSL_CERT_FILE: '/ca.pem', NODE_EXTRA_CA_CERTS: '/ca.pem', CARGO_HOME: '/cargo', RUSTUP_HOME: '/rustup', GOPATH: '/go', GOROOT: '/goroot', JAVA_HOME: '/jdk' };
  const canaries = {
    CANARY_SECRET: 'x', SOME_PROVIDER_API_KEY: 'x', OPENROUTER_API_KEY: 'x', ANTHROPIC_AUTH_TOKEN: 'x',
    CLAUDE_CODE_CHILD_SESSION: '1', CLAUDE_CODE_MESSAGING_SOCKET: '/s', CLAUDE_CODE_MESSAGING_TOKEN: 'x', CLAUDE_CODE_ENTRYPOINT: 'cli',
    CLAUDECODE: '1', CLAUDE_PID: '1', AI_AGENT: 'x', CLAUDE_CODE_SESSION_ID: 's', CODEX_THREAD_ID: 't', PI_SESSION_ID: 'p', PI_SESSION_FILE: '/p',
    PI_PROFILE: 'x', OMP_PROFILE: 'x', OMPCODE: '1', FGOS_SESSION_ID: '', FGOS_HOST_BIN: '/tmp/other-host/fgos', FGOS_RUST_HOST_RECURSION_GUARD: '1',
    FGOS_LOCK_FD: 'main-checkout:3', FGOS_LOCK_JOB: 'job-1', FGOS_MAIN_LOCK_HOLDER_PID: '4242',
    [CASE_ID_ENV]: 'wf-a', [CASE_RESERVATION_ENV]: 'rsv-a', HERDR_SOCKET_PATH: '/cockpit.sock', XDG_RUNTIME_DIR: '/run/user/1', SSH_AUTH_SOCK: '/agent',
  };
  const env = workerBaseEnv({ ...allowed, ...canaries });
  for (const [name, value] of Object.entries(allowed)) assert.equal(env[name], value, `${name} is allowed`);
  for (const name of Object.keys(canaries)) assert.equal(name in env, false, `${name} must not cross`);
  assert.deepEqual(Object.keys(env).filter((name) => !(name in allowed) && name !== 'FGOS_STATE_ROOT'), []);
  assert.deepEqual(caseContextEnv({ caseId: 'wf-b', reservationId: 'rsv-b' }), { FGOS_CASE_ID: 'wf-b', FGOS_CASE_RESERVATION: 'rsv-b' });
});

test('a headless worker sees only allowed names of a controller that carries secrets and a messaging credential', async () => {
  const body = `
    const names = Object.keys(process.env).filter((n) => /^CANARY_|^CLAUDE_CODE_|TOKEN$|_KEY$|^HERDR_/.test(n));
    fs.writeFileSync(path.join(runDir, 'report-1.md'), '# Report\\nThe worker saw these variable names: ' + JSON.stringify(names) + '. Nothing else was inspected.\\n');
    fs.writeFileSync(path.join(runDir, 'result-1.json'), JSON.stringify({ status: 'done', summary: 'Done' }));
  `;
  const tmp = setupWorkflowFixtureRepo({ prefix: 'fgos-worker-env-', readme: '# Env', gitName: 'Env Test', capabilities: ['docs:write'], workerBody: body });
  fs.appendFileSync(`${tmp}/.gitignore`, '.fgos/\n*.mjs\n');
  const planted = { CANARY_SECRET: 'x', CLAUDE_CODE_MESSAGING_TOKEN: 'x', CLAUDE_CODE_CHILD_SESSION: '1', SOME_PROVIDER_API_KEY: 'x' };
  const before = Object.fromEntries(Object.keys(planted).map((name) => [name, process.env[name]]));
  Object.assign(process.env, planted);
  try {
    const done = await runUnit({ unitData: unit, caseAdmission: createCaseAdmissionPort({ repoRoot: tmp, env: {} }), repoRoot: tmp, cwd: tmp, worktree: tmp });
    assert.equal(done.outcome, 'pass');
    const [report] = resolveUnitInputs([`unit-run:${done.unitRunId}/producer`], tmp).refs;
    assert.deepEqual(JSON.parse(/variable names: (\[.*?\])\./.exec(fs.readFileSync(report, 'utf8'))[1]), []);
  } finally {
    for (const [name, value] of Object.entries(before)) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  }
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
