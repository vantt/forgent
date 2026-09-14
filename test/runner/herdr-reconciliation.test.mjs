import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import {
  runHerdrRound,
  reconcileHerdrSpawnRun,
  readHerdrAdapterReceipt,
  publishHerdrAdapterReceipt,
  computeHerdrResourceIncarnation,
  createHerdrLaunchCommand,
  readHerdrLaunchCommand,
  HerdrLaunchCollisionError,
  buildLauncherScriptContent,
  verifyForegroundProcessArgv,
  verifyProcessEnvironment,
} from '../../src/runner/dispatch/herdr-round.mjs';
import { findExecutableOnPath } from '../../src/state/tool-registry.mjs';
import {
  buildConfinementRequest,
  validateAssignmentLaunchContext,
} from '../../src/runner/dispatch/confinement/request.mjs';
import {
  prepareConfinementForLaunch,
  executeThroughConfinement,
} from '../../src/runner/dispatch/confinement/authority.mjs';
import {
  computeSha256Digest,
  publishImmutableProof,
  publishMutableProjection,
} from '../../src/runner/dispatch/cli-spawn-supervisor.mjs';
import {
  BUILTIN_POLICIES,
} from '../../src/runner/dispatch/confinement/policies.mjs';
import { herdrSpawnAdapter } from '../../src/runner/dispatch/transport.mjs';
import { DispatchError } from '../../src/runner/dispatch/dispatch-error.mjs';

function mkTempDir(prefix = 'fgos-herdr-recon-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function createMockHerdr(tmpDir, scenario = {}) {
  fs.mkdirSync(tmpDir, { recursive: true });
  const scriptPath = path.join(tmpDir, 'mock-herdr.mjs');
  const wrapperPath = path.join(tmpDir, 'mock-herdr.sh');
  const statePath = path.join(tmpDir, 'mock-state.json');
  const logPath = path.join(tmpDir, 'mock-log.jsonl');
  const scenarioPath = path.join(tmpDir, 'mock-scenario.json');

  fs.writeFileSync(statePath, JSON.stringify({ prompts: 0, gets: 0, runs: 0, exited: false }));
  fs.writeFileSync(logPath, '');
  fs.writeFileSync(scenarioPath, JSON.stringify({
    worker: 'ack-then-result',
    statuses: ['idle'],
    screen: '',
    ...scenario,
  }));

  fs.writeFileSync(scriptPath, `
import fs from 'node:fs';
import path from 'node:path';

const statePath = ${JSON.stringify(statePath)};
const logPath = ${JSON.stringify(logPath)};
const scenario = JSON.parse(fs.readFileSync(${JSON.stringify(scenarioPath)}, 'utf8'));

const args = process.argv.slice(2);
fs.appendFileSync(logPath, JSON.stringify(args) + '\\n');

const readState = () => JSON.parse(fs.readFileSync(statePath, 'utf8'));
const writeState = (s) => fs.writeFileSync(statePath, JSON.stringify(s));
const ok = (result) => { console.log(JSON.stringify({ id: 'cli:mock', result })); process.exit(0); };
const fail = (code, message) => { console.log(JSON.stringify({ error: { code, message: message ?? code }, id: 'cli:mock' })); process.exit(1); };

const [group, action] = args;

if (group === 'pane' && action === 'split') {
  ok({ pane: { pane_id: 'mock-pane-1' } });
}
if (group === 'tab' && action === 'create') ok({ tab: { tab_id: 'mock-tab-1' }, root_pane: { pane_id: 'mock-tab-root-pane' } });
const writeWorkerResultIfConfigured = () => {
  if (scenario.worker !== 'silent' && scenario.runDir) {
    const outbox = path.join(scenario.runDir, 'outbox');
    fs.mkdirSync(outbox, { recursive: true });
    fs.writeFileSync(path.join(outbox, 'result-1.json'), JSON.stringify({ status: 'done', summary: 'done' }));
  }
};

if (group === 'pane' && action === 'close') ok({ closed: true });
if (group === 'pane' && action === 'run') {
  if (scenario.runError) fail(scenario.runError, 'pane run failed');
  const state = readState();
  writeState({ ...state, runs: state.runs + 1 });
  writeWorkerResultIfConfigured();
  ok({ type: 'ok' });
}
if (group === 'pane' && (action === 'report-agent' || action === 'report-agent-session')) {
  ok({ type: 'ok' });
}
if (group === 'pane' && action === 'process-info') {
  const gone = scenario.agentGone || readState().exited;
  const mockArgv = scenario.mockArgv ?? ['claude', 'worker.mjs'];
  const foregroundPid = scenario.foregroundPid ?? 200;
  const foreground = gone
    ? [{ pid: 100, name: 'zsh' }]
    : [{ pid: foregroundPid, name: 'bwrap', argv: mockArgv }, { pid: 100, name: 'zsh' }];
  ok({ process_info: { pane_id: 'mock-pane-1', shell_pid: 100, foreground_process_group_id: gone ? 100 : foregroundPid, foreground_processes: foreground } });
}
if (group === 'agent' && action === 'start') {
  if (scenario.startError) fail(scenario.startError, 'agent never reached a ready state');
  writeWorkerResultIfConfigured();
  ok({ agent: { agent_status: 'idle' } });
}
if (group === 'agent' && action === 'read') ok({ read: { text: scenario.screen ?? '' } });
if (group === 'agent' && action === 'get') {
  if (scenario.getError) fail(scenario.getError, 'the session is not answering');
  const state = readState();
  const status = scenario.statuses[Math.min(state.gets, scenario.statuses.length - 1)];
  writeState({ ...state, gets: state.gets + 1 });
  ok({ agent: { agent_status: status, pane_id: 'mock-pane-1', state_change_seq: state.gets } });
}
if (group === 'agent' && action === 'prompt') {
  const text = args[3];
  if (text && text.startsWith('/')) {
    writeState({ ...readState(), exited: true });
    ok({ agent: { agent_status: 'idle' } });
  }
  const state = readState();
  const attempt = state.prompts + 1;
  writeState({ ...state, prompts: attempt });
  if (scenario.promptError && attempt === 1) fail(scenario.promptError, 'submission was not accepted');
  ok({ agent: { agent_status: 'working' } });
}
ok({});
`);

  fs.writeFileSync(wrapperPath, `#!/bin/sh\nexec node "${scriptPath}" "$@"\n`);
  fs.chmodSync(wrapperPath, 0o755);

  return {
    herdrBin: wrapperPath,
    calls: () => fs.readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)),
  };
}

// 1. Confinement Authority prepares herdr-spawn launch under required bwrap confinement
test('1. Confinement Authority prepares herdr-spawn launch under required bwrap confinement when workerCommandSeam is true', async () => {
  const tmp = mkTempDir();
  const fgosDir = path.join(tmp, '.fgos');
  const runDir = path.join(fgosDir, 'runs', 'run-01');
  fs.mkdirSync(runDir, { recursive: true });

  const launchContext = {
    contract: 'assignment-herdr-spawn-launch-context.v1',
    run: {
      runId: 'run-01',
      assignmentId: 'asgn-01',
      attempt: 1,
      dispatchPlanDigest: 'sha256:abcd',
      evaluatorBaselineDigest: 'sha256:1234',
    },
    command: {
      launchCommandId: 'cmd-01',
      controlEpoch: 1,
      controlTokenDigest: computeSha256Digest('tok-1'),
    },
  };

  const req = buildConfinementRequest({
    backendId: 'bwrap',
    context: {
      runDir,
      cwd: tmp,
      repoRoot: tmp,
      fgosDir,
      workId: 'item-01',
      tier: 'standard',
      model: 'sonnet',
    },
    capability: 'code:implement',
    requirement: {
      mode: 'required',
      policyId: 'host-write-denied',
      policy: BUILTIN_POLICIES['host-write-denied'],
    },
    invocation: {
      command: 'node',
      args: ['worker.mjs'],
      workerCommandSeam: true,
      adapter: 'herdr-spawn',
    },
  });

  const prep = await prepareConfinementForLaunch(
    { ...req, assignmentLaunchContext: launchContext },
    { adapterName: 'herdr-spawn' },
  );

  assert.ok(prep.preparedInvocationDigest);
  assert.equal(prep.preparedInvocation.contract, 'authority-prepared-invocation.v1');
  assert.equal(prep.preparedInvocation.adapter, 'herdr-spawn');
  assert.ok(prep.preparedInvocation.workerInvocation);
  assert.ok(prep.preparedInvocation.workerInvocation.workerCommandDigest);
  assert.ok(fs.existsSync(path.join(runDir, 'protected', 'prepared-invocation', 'cmd-01.json')));
});

// 2. Confinement Authority refuses herdr-spawn when providerKindOnly or workerCommandSeam is false
test('2. Confinement Authority refuses herdr-spawn when providerKindOnly or workerCommandSeam is false', async () => {
  const tmp = mkTempDir();
  const fgosDir = path.join(tmp, '.fgos');
  const runDir = path.join(fgosDir, 'runs', 'run-02');
  fs.mkdirSync(runDir, { recursive: true });

  const reqProviderOnly = buildConfinementRequest({
    backendId: 'bwrap',
    context: {
      runDir,
      cwd: tmp,
      repoRoot: tmp,
      fgosDir,
    },
    capability: 'code:implement',
    requirement: {
      mode: 'required',
      policyId: 'host-write-denied',
      policy: BUILTIN_POLICIES['host-write-denied'],
    },
    invocation: {
      command: 'node',
      args: ['worker.mjs'],
      providerKindOnly: true,
      adapter: 'herdr-spawn',
    },
  });

  await assert.rejects(
    () => executeThroughConfinement(reqProviderOnly, herdrSpawnAdapter),
    (err) => {
      assert.ok(err instanceof DispatchError);
      assert.match(err.message, /does not apply the prepared sandbox/);
      return true;
    },
  );

  const reqSeamFalse = buildConfinementRequest({
    backendId: 'bwrap',
    context: {
      runDir,
      cwd: tmp,
      repoRoot: tmp,
      fgosDir,
    },
    capability: 'code:implement',
    requirement: {
      mode: 'required',
      policyId: 'host-write-denied',
      policy: BUILTIN_POLICIES['host-write-denied'],
    },
    invocation: {
      command: 'node',
      args: ['worker.mjs'],
      workerCommandSeam: false,
      adapter: 'herdr-spawn',
    },
  });

  await assert.rejects(
    () => executeThroughConfinement(reqSeamFalse, herdrSpawnAdapter),
    (err) => {
      assert.ok(err instanceof DispatchError);
      assert.match(err.message, /does not apply the prepared sandbox/);
      return true;
    },
  );
});

// 3. Worker-command digest matches prepared invocation digest; startArgv has separate digest
test('3. recorded Herdr worker-command suffix and startArgv have distinct valid digests', async () => {
  const tmp = mkTempDir();
  const runDir = path.join(tmp, 'run');
  const mock = createMockHerdr(tmp, { runDir });

  const launchContext = {
    contract: 'assignment-herdr-spawn-launch-context.v1',
    runId: 'run-dig-01',
    launchCommandId: 'cmd-dig-01',
    controlEpoch: 1,
    controlToken: 'tok-dig',
  };

  createHerdrLaunchCommand(runDir, launchContext);

  const result = await runHerdrRound({
    herdrBin: mock.herdrBin,
    workId: 'item-dig',
    runId: 'run-dig-01',
    launchCommandId: 'cmd-dig-01',
    runDir,
    command: 'echo',
    args: ['hello'],
    cwd: tmp,
    fullEnv: process.env,
    delivery: 'file-pointer',
    agentKind: 'echo',
    transportDeadlines: {
      startup: { readyMs: 500, promptMs: 500 },
      round: { idleMs: 1000, ceilingMs: 2000 },
    },
  });

  assert.equal(result.outcome, 'settled');

  const receipt = readHerdrAdapterReceipt(runDir, 'cmd-dig-01');
  assert.ok(receipt);
  assert.equal(receipt.contract, 'herdr-adapter-receipt.v1');
  assert.ok(receipt.startArgvDigest);
  assert.ok(receipt.workerCommandDigest);
  assert.match(receipt.startArgvDigest, /^sha256:[a-f0-9]{64}$/);
  assert.match(receipt.workerCommandDigest, /^sha256:[a-f0-9]{64}$/);
});

// 4. Completion strictly requires worker outbox result; Herdr status alone is NEVER Run truth
test('4. completion strictly requires worker outbox result; Herdr idle or done alone does not settle', async () => {
  const tmp = mkTempDir();
  const runDir = path.join(tmp, 'run');
  fs.mkdirSync(path.join(runDir, 'controller', 'commands'), { recursive: true });

  const launchContext = {
    contract: 'assignment-herdr-spawn-launch-context.v1',
    runId: 'run-outbox-01',
    launchCommandId: 'cmd-outbox-01',
    controlEpoch: 1,
    controlToken: 'tok-outbox',
  };

  const incarnation = computeHerdrResourceIncarnation({
    paneId: 'mock-pane-1',
    shellPid: 100,
    workerPid: 200,
    processStartTime: '12345',
  });

  createHerdrLaunchCommand(runDir, launchContext, {
    preparedInvocationDigest: 'sha256:prep123',
    paneId: 'mock-pane-1',
    resourceIncarnation: incarnation,
  });

  // Prepare prep record on disk
  const prepDir = path.join(runDir, 'protected', 'prepared-invocation');
  fs.mkdirSync(prepDir, { recursive: true });
  const prepRec = { contract: 'authority-prepared-invocation.v1', command: 'node' };
  const pDig = computeSha256Digest(prepRec);
  publishImmutableProof(path.join(prepDir, 'cmd-outbox-01.json'), { ...prepRec, digest: pDig });

  // Update command to have matching prep digest
  const cmd = readHerdrLaunchCommand(runDir, 'cmd-outbox-01');
  cmd.preparedInvocationDigest = pDig;
  publishMutableProjection(path.join(runDir, 'controller', 'commands', 'cmd-outbox-01.json'), cmd);

  // Probe returns Herdr says "done" and "idle", but NO outbox result exists
  const recResult = await reconcileHerdrSpawnRun(runDir, {
    probe: async () => ({ status: 'done', agentStatus: 'idle', resourceIncarnation: incarnation }),
  });

  // MUST NOT settle!
  assert.notEqual(recResult.status, 'settled');
  assert.equal(recResult.status, 'waiting');
  assert.equal(recResult.state, 'worker-running');

  // Now create the worker outbox result
  fs.mkdirSync(path.join(runDir, 'outbox'), { recursive: true });
  fs.writeFileSync(path.join(runDir, 'outbox', 'result-1.json'), JSON.stringify({ status: 'done', summary: 'Outbox wrote this' }));

  // Reconcile again: now it MUST settle!
  const settledResult = await reconcileHerdrSpawnRun(runDir);
  assert.equal(settledResult.status, 'settled');
  assert.ok(settledResult.receipt);
  assert.equal(settledResult.receipt.completion.kind, 'settled');

  const updatedCmd = readHerdrLaunchCommand(runDir, 'cmd-outbox-01');
  assert.equal(updatedCmd.state, 'reconciled');
  assert.equal(updatedCmd.outcome.kind, 'receipt-backed');
});

// 5. Fresh launch submits once and commits pending record
test('5. fresh launch submits once with deterministic herdrName', async () => {
  const tmp = mkTempDir();
  const runDir = path.join(tmp, 'run');
  const mock = createMockHerdr(tmp, { runDir });

  const launchContext = {
    contract: 'assignment-herdr-spawn-launch-context.v1',
    runId: 'run-fresh-01',
    launchCommandId: 'cmd-fresh-01',
    controlEpoch: 1,
    controlToken: 'tok-fresh',
  };

  createHerdrLaunchCommand(runDir, launchContext);

  await runHerdrRound({
    herdrBin: mock.herdrBin,
    workId: 'item-fresh',
    runId: 'run-fresh-01',
    launchCommandId: 'cmd-fresh-01',
    runDir,
    command: 'echo',
    args: ['hello'],
    cwd: tmp,
    fullEnv: process.env,
    delivery: 'file-pointer',
    agentKind: 'echo',
    transportDeadlines: {
      startup: { readyMs: 500, promptMs: 500 },
      round: { idleMs: 1000, ceilingMs: 2000 },
    },
  });

  const cmd = readHerdrLaunchCommand(runDir, 'cmd-fresh-01');
  assert.equal(cmd.herdrName, 'fgos-run-fresh-01-cmd-fresh-01');
  assert.equal(cmd.state, 'reconciled');

  // Verify Herdr calls include agent start
  const calls = mock.calls();
  const startCalls = calls.filter((c) => c[0] === 'agent' && c[1] === 'start');
  assert.equal(startCalls.length, 1);
  assert.equal(startCalls[0][2], 'fgos-run-fresh-01-cmd-fresh-01');
});

// 6. Same conversation but new worker process parks with incarnation-mismatch
test('6. same conversation, new worker process parks with incarnation-mismatch', async () => {
  const tmp = mkTempDir();
  const runDir = path.join(tmp, 'run');
  fs.mkdirSync(path.join(runDir, 'controller', 'commands'), { recursive: true });

  const oldIncarnation = computeHerdrResourceIncarnation({
    paneId: 'mock-pane-1',
    shellPid: 100,
    workerPid: 200,
    processStartTime: '1000',
  });

  const prepDir = path.join(runDir, 'protected', 'prepared-invocation');
  fs.mkdirSync(prepDir, { recursive: true });
  const prepRec = { contract: 'authority-prepared-invocation.v1' };
  const pDig = computeSha256Digest(prepRec);
  publishImmutableProof(path.join(prepDir, 'cmd-inc-01.json'), { ...prepRec, digest: pDig });

  createHerdrLaunchCommand(runDir, {
    contract: 'assignment-herdr-spawn-launch-context.v1',
    runId: 'run-inc-01',
    launchCommandId: 'cmd-inc-01',
    controlEpoch: 1,
    controlToken: 'tok-inc',
  }, {
    preparedInvocationDigest: pDig,
    paneId: 'mock-pane-1',
    resourceIncarnation: oldIncarnation,
  });

  // Probe finds new worker process PID 300
  const newIncarnation = computeHerdrResourceIncarnation({
    paneId: 'mock-pane-1',
    shellPid: 100,
    workerPid: 300,
    processStartTime: '2000',
  });

  const rec = await reconcileHerdrSpawnRun(runDir, {
    probe: async () => ({ status: 'present', resourceIncarnation: newIncarnation }),
  });

  assert.equal(rec.status, 'parked');
  assert.equal(rec.reason, 'incarnation-mismatch');
});

// 7. Gateway restart with same pane/name parks with incarnation-mismatch
test('7. gateway restart with same pane/name parks with incarnation-mismatch', async () => {
  const tmp = mkTempDir();
  const runDir = path.join(tmp, 'run');
  fs.mkdirSync(path.join(runDir, 'controller', 'commands'), { recursive: true });

  const oldIncarnation = computeHerdrResourceIncarnation({
    paneId: 'mock-pane-1',
    shellPid: 100,
    workerPid: 200,
    gatewaySessionId: 'gw-session-1',
  });

  const prepDir = path.join(runDir, 'protected', 'prepared-invocation');
  fs.mkdirSync(prepDir, { recursive: true });
  const prepRec = { contract: 'authority-prepared-invocation.v1' };
  const pDig = computeSha256Digest(prepRec);
  publishImmutableProof(path.join(prepDir, 'cmd-gw-01.json'), { ...prepRec, digest: pDig });

  createHerdrLaunchCommand(runDir, {
    contract: 'assignment-herdr-spawn-launch-context.v1',
    runId: 'run-gw-01',
    launchCommandId: 'cmd-gw-01',
    controlEpoch: 1,
    controlToken: 'tok-gw',
  }, {
    preparedInvocationDigest: pDig,
    paneId: 'mock-pane-1',
    resourceIncarnation: oldIncarnation,
  });

  // Gateway restarted: gatewaySessionId is different
  const restartedIncarnation = computeHerdrResourceIncarnation({
    paneId: 'mock-pane-1',
    shellPid: 100,
    workerPid: 200,
    gatewaySessionId: 'gw-session-2',
  });

  const rec = await reconcileHerdrSpawnRun(runDir, {
    probe: async () => ({ status: 'present', resourceIncarnation: restartedIncarnation }),
  });

  assert.equal(rec.status, 'parked');
  assert.equal(rec.reason, 'incarnation-mismatch');
});

// 8. Crash before binding write / pane created before agent ready parks incarnation-unknown
test('8. crash before binding write or pane created before agent ready parks incarnation-unknown', async () => {
  const tmp = mkTempDir();
  const runDir = path.join(tmp, 'run');
  fs.mkdirSync(path.join(runDir, 'controller', 'commands'), { recursive: true });

  const prepDir = path.join(runDir, 'protected', 'prepared-invocation');
  fs.mkdirSync(prepDir, { recursive: true });
  const prepRec = { contract: 'authority-prepared-invocation.v1' };
  const pDig = computeSha256Digest(prepRec);
  publishImmutableProof(path.join(prepDir, 'cmd-crash-01.json'), { ...prepRec, digest: pDig });

  // resourceIncarnation is null because crashed before binding write
  createHerdrLaunchCommand(runDir, {
    contract: 'assignment-herdr-spawn-launch-context.v1',
    runId: 'run-crash-01',
    launchCommandId: 'cmd-crash-01',
    controlEpoch: 1,
    controlToken: 'tok-crash',
  }, {
    preparedInvocationDigest: pDig,
    paneId: 'mock-pane-1',
    resourceIncarnation: null,
  });

  const rec = await reconcileHerdrSpawnRun(runDir, {
    probe: async () => ({ status: 'present' }),
  });

  assert.equal(rec.status, 'parked');
  assert.equal(rec.reason, 'incarnation-unknown');
});

// 9. Deterministic name absent without absent-proven parks unknown-launch (never replacement launch)
test('9. deterministic-name absence without absent-proven parks unknown-launch', async () => {
  const tmp = mkTempDir();
  const runDir = path.join(tmp, 'run');
  fs.mkdirSync(path.join(runDir, 'controller', 'commands'), { recursive: true });

  const prepDir = path.join(runDir, 'protected', 'prepared-invocation');
  fs.mkdirSync(prepDir, { recursive: true });
  const prepRec = { contract: 'authority-prepared-invocation.v1' };
  const pDig = computeSha256Digest(prepRec);
  publishImmutableProof(path.join(prepDir, 'cmd-abs-01.json'), { ...prepRec, digest: pDig });

  createHerdrLaunchCommand(runDir, {
    contract: 'assignment-herdr-spawn-launch-context.v1',
    runId: 'run-abs-01',
    launchCommandId: 'cmd-abs-01',
    controlEpoch: 1,
    controlToken: 'tok-abs',
  }, {
    preparedInvocationDigest: pDig,
    paneId: 'mock-pane-1',
    resourceIncarnation: computeHerdrResourceIncarnation({ paneId: 'mock-pane-1' }),
  });

  // Probe reports agent is absent from Herdr
  const rec = await reconcileHerdrSpawnRun(runDir, {
    probe: async () => ({ status: 'absent', notFound: true }),
  });

  assert.equal(rec.status, 'parked');
  assert.equal(rec.reason, 'unknown-launch');
});

// 10. Closed resources are not resurrected
test('10. closed resources are not resurrected', async () => {
  const tmp = mkTempDir();
  const runDir = path.join(tmp, 'run');
  fs.mkdirSync(path.join(runDir, 'controller', 'commands'), { recursive: true });

  createHerdrLaunchCommand(runDir, {
    contract: 'assignment-herdr-spawn-launch-context.v1',
    runId: 'run-close-01',
    launchCommandId: 'cmd-close-01',
    controlEpoch: 1,
    controlToken: 'tok-close',
  }, {
    preparedInvocationDigest: 'sha256:prep',
    paneId: 'mock-pane-1',
  });

  const rec = await reconcileHerdrSpawnRun(runDir, {
    resourceClosed: true,
  });

  assert.equal(rec.status, 'parked');
  assert.equal(rec.reason, 'closed-resource');
});

// 11. F-b observation: coordinator dead, worker alive observes without duplicate spawn
test('11. F-b coordinator dead, worker alive observes running worker', async () => {
  const tmp = mkTempDir();
  const runDir = path.join(tmp, 'run');
  fs.mkdirSync(path.join(runDir, 'controller', 'commands'), { recursive: true });

  const inc = computeHerdrResourceIncarnation({
    paneId: 'mock-pane-fb',
    shellPid: 100,
    workerPid: 200,
    processStartTime: '5555',
  });

  const prepDir = path.join(runDir, 'protected', 'prepared-invocation');
  fs.mkdirSync(prepDir, { recursive: true });
  const prepRec = { contract: 'authority-prepared-invocation.v1' };
  const pDig = computeSha256Digest(prepRec);
  publishImmutableProof(path.join(prepDir, 'cmd-fb-01.json'), { ...prepRec, digest: pDig });

  createHerdrLaunchCommand(runDir, {
    contract: 'assignment-herdr-spawn-launch-context.v1',
    runId: 'run-fb-01',
    launchCommandId: 'cmd-fb-01',
    controlEpoch: 1,
    controlToken: 'tok-fb',
  }, {
    preparedInvocationDigest: pDig,
    paneId: 'mock-pane-fb',
    resourceIncarnation: inc,
  });

  const rec = await reconcileHerdrSpawnRun(runDir, {
    probe: async () => ({ status: 'present', resourceIncarnation: inc }),
  });

  assert.equal(rec.status, 'waiting');
  assert.equal(rec.state, 'worker-running');
  assert.equal(rec.paneId, 'mock-pane-fb');
  assert.deepEqual(rec.resourceIncarnation, inc);
});

// 12. F-f race: concurrent launches submit once, collision throws HerdrLaunchCollisionError
test('12. F-f concurrent launches submit once, duplicate launch throws collision error', async () => {
  const tmp = mkTempDir();
  const runDir = path.join(tmp, 'run');
  fs.mkdirSync(path.join(runDir, 'controller', 'commands'), { recursive: true });

  const launchContext1 = {
    contract: 'assignment-herdr-spawn-launch-context.v1',
    runId: 'run-ff-01',
    launchCommandId: 'cmd-ff-01',
    controlEpoch: 1,
    controlToken: 'tok-ff',
  };

  createHerdrLaunchCommand(runDir, launchContext1);

  // Second concurrent launch for the same run
  const launchContext2 = {
    contract: 'assignment-herdr-spawn-launch-context.v1',
    runId: 'run-ff-01',
    launchCommandId: 'cmd-ff-02',
    controlEpoch: 1,
    controlToken: 'tok-ff',
  };

  assert.throws(
    () => createHerdrLaunchCommand(runDir, launchContext2),
    (err) => {
      assert.ok(err instanceof HerdrLaunchCollisionError);
      assert.equal(err.code, 'launch-collision');
      assert.equal(err.existingCommandId, 'cmd-ff-01');
      return true;
    },
  );
});

// 13. Stale controller token observes only without settling
test('13. stale controller token observes without settling', async () => {
  const tmp = mkTempDir();
  const runDir = path.join(tmp, 'run');
  fs.mkdirSync(path.join(runDir, 'controller', 'commands'), { recursive: true });

  createHerdrLaunchCommand(runDir, {
    contract: 'assignment-herdr-spawn-launch-context.v1',
    runId: 'run-stale-01',
    launchCommandId: 'cmd-stale-01',
    controlEpoch: 2,
    controlToken: 'tok-current',
  });

  // Reconcile with lower control epoch
  const recStaleEpoch = await reconcileHerdrSpawnRun(runDir, {
    controlEpoch: 1,
  });
  assert.equal(recStaleEpoch.status, 'observed');
  assert.equal(recStaleEpoch.settled, false);

  // Reconcile with wrong control token
  const recStaleToken = await reconcileHerdrSpawnRun(runDir, {
    controlEpoch: 2,
    controlToken: 'tok-wrong',
  });
  assert.equal(recStaleToken.status, 'observed');
  assert.equal(recStaleToken.settled, false);
});

// 14. Receipt tamper detection: corrupted receipt digest refuses protected-artifact-corrupt
test('14. corrupted receipt digest refuses protected-artifact-corrupt', async () => {
  const tmp = mkTempDir();
  const runDir = path.join(tmp, 'run');
  fs.mkdirSync(path.join(runDir, 'controller', 'commands'), { recursive: true });

  createHerdrLaunchCommand(runDir, {
    contract: 'assignment-herdr-spawn-launch-context.v1',
    runId: 'run-tamper-01',
    launchCommandId: 'cmd-tamper-01',
    controlEpoch: 1,
    controlToken: 'tok-tamper',
  }, {
    preparedInvocationDigest: 'sha256:prep',
  });

  // Publish a corrupted receipt (tampered body without updating digest)
  const receiptsDir = path.join(runDir, 'protected', 'adapter-receipts');
  fs.mkdirSync(receiptsDir, { recursive: true });
  fs.writeFileSync(
    path.join(receiptsDir, 'cmd-tamper-01.json'),
    JSON.stringify({
      contract: 'herdr-adapter-receipt.v1',
      runId: 'run-tamper-01',
      tampered: true,
      digest: 'sha256:wrongdigest',
    }, null, 2),
  );

  const rec = await reconcileHerdrSpawnRun(runDir);
  assert.equal(rec.status, 'refused');
  assert.equal(rec.reason, 'protected-artifact-corrupt');
});

// 15. Unsupported actions cancel and shared-cwd-takeover park
test('15. unsupported operations cancel and shared-cwd-takeover park immediately', async () => {
  const tmp = mkTempDir();
  const runDir = path.join(tmp, 'run');

  const recCancel = await reconcileHerdrSpawnRun(runDir, { action: 'cancel' });
  assert.equal(recCancel.status, 'parked');
  assert.equal(recCancel.reason, 'cancel-unsupported');

  const recTakeover = await reconcileHerdrSpawnRun(runDir, { action: 'shared-cwd-takeover' });
  assert.equal(recTakeover.status, 'parked');
  assert.equal(recTakeover.reason, 'shared-cwd-takeover-unsupported');
});

// 16. Legacy ad-hoc naming parity vs Assignment-owned deterministic naming
test('16. ad-hoc run preserves legacy naming while Assignment run uses deterministic name', async () => {
  const tmp = mkTempDir();
  const mock = createMockHerdr(tmp);

  // 1. Ad-hoc run (no runId / launchCommandId)
  const adHocRunDir = path.join(tmp, 'adhoc-run');
  const mockAdHoc = createMockHerdr(path.join(tmp, 'mock-adhoc'), { runDir: adHocRunDir });

  await runHerdrRound({
    herdrBin: mockAdHoc.herdrBin,
    workId: 'adhoc-item',
    runDir: adHocRunDir,
    cwd: tmp,
    fullEnv: process.env,
    delivery: 'file-pointer',
    agentKind: 'echo',
    transportDeadlines: {
      startup: { readyMs: 500, promptMs: 500 },
      round: { idleMs: 1000, ceilingMs: 2000 },
    },
  });

  const adHocCalls = mockAdHoc.calls();
  const adHocStart = adHocCalls.find((c) => c[0] === 'agent' && c[1] === 'start');
  assert.ok(adHocStart);
  // Ad-hoc name starts with fgos-adhoc-item- followed by timestamp
  assert.match(adHocStart[2], /^fgos-adhoc-item-[a-z0-9]+$/);

  // 2. Assignment run (with runId and launchCommandId)
  const asgnRunDir = path.join(tmp, 'asgn-run');
  const mockAsgn = createMockHerdr(path.join(tmp, 'mock-asgn'), { runDir: asgnRunDir });

  createHerdrLaunchCommand(asgnRunDir, {
    contract: 'assignment-herdr-spawn-launch-context.v1',
    runId: 'run-named-01',
    launchCommandId: 'cmd-named-01',
    controlEpoch: 1,
    controlToken: 'tok-named',
  });

  await runHerdrRound({
    herdrBin: mockAsgn.herdrBin,
    workId: 'asgn-item',
    runId: 'run-named-01',
    launchCommandId: 'cmd-named-01',
    runDir: asgnRunDir,
    cwd: tmp,
    fullEnv: process.env,
    delivery: 'file-pointer',
    agentKind: 'echo',
    transportDeadlines: {
      startup: { readyMs: 500, promptMs: 500 },
      round: { idleMs: 1000, ceilingMs: 2000 },
    },
  });

  const cmd = readHerdrLaunchCommand(asgnRunDir, 'cmd-named-01');
  assert.equal(cmd.herdrName, 'fgos-run-named-01-cmd-named-01');
});

// 17. Launcher script generation and foreground argv verification
test('17. launcher script generation and foreground argv verification', async () => {
  const scriptContent = buildLauncherScriptContent({
    argv0: 'claude',
    command: '/usr/bin/bwrap',
    args: ['--ro-bind', '/', '/', 'echo', 'hi'],
    env: { TEST_VAR: 'value with spaces & symbols' },
    workerCommandDigest: 'sha256:abcd',
  });

  assert.ok(scriptContent.startsWith('#!/usr/bin/env bash'));
  assert.ok(scriptContent.includes("export TEST_VAR='value with spaces & symbols'"));
  assert.ok(scriptContent.includes("exec -a claude /usr/bin/bwrap --ro-bind / / echo hi"));

  const matched = verifyForegroundProcessArgv({
    foregroundProcesses: [
      { pid: 100, name: 'zsh', argv: ['zsh'] },
      { pid: 200, name: 'bwrap', argv: ['claude', '--ro-bind', '/', '/', 'echo', 'hi'] },
    ],
    shellPid: 100,
    argv0: 'claude',
    command: '/usr/bin/bwrap',
    args: ['--ro-bind', '/', '/', 'echo', 'hi'],
  });
  assert.ok(matched);
  assert.equal(matched.pid, 200);

  const mismatched = verifyForegroundProcessArgv({
    foregroundProcesses: [
      { pid: 200, name: 'bwrap', argv: ['claude', '--unrelated-flag'] },
    ],
    shellPid: 100,
    argv0: 'claude',
    command: '/usr/bin/bwrap',
    args: ['--ro-bind', '/', '/', 'echo', 'hi'],
  });
  assert.equal(mismatched, null);
});

// 18. Fail-closed triggers when backend is unsupported or foreground argv mismatches
test('18. fail-closed triggers when backend is unsupported or foreground argv mismatches', async () => {
  const tmp = mkTempDir();
  const runDir = path.join(tmp, 'run');
  const mock = createMockHerdr(tmp, { runDir });

  // 1. Unsupported backend under required mode
  await assert.rejects(
    () => runHerdrRound({
      herdrBin: mock.herdrBin,
      workId: 'item-unsupported-backend',
      runDir,
      command: 'echo',
      cwd: tmp,
      confinementRequirement: { mode: 'required' },
      backendId: 'docker',
      workerInvocation: { command: 'docker', args: ['run'] },
    }),
    (err) => {
      assert.ok(err instanceof DispatchError);
      assert.equal(err.errorClass, 'confinement-backend-unsupported');
      return true;
    },
  );

  // 2. Foreground process argv mismatch fails closed
  const mockMismatched = createMockHerdr(path.join(tmp, 'mock-mismatch'), {
    runDir,
    mockArgv: ['bogus-executable', '--unexpected-flag'],
  });

  await assert.rejects(
    () => runHerdrRound({
      herdrBin: mockMismatched.herdrBin,
      workId: 'item-mismatched-argv',
      runDir,
      command: 'node',
      args: ['worker.mjs'],
      cwd: tmp,
      fullEnv: process.env,
      confinementRequirement: { mode: 'required' },
      backendId: 'bwrap',
      workerInvocation: {
        command: '/usr/bin/bwrap',
        args: ['--ro-bind', '/', '/', 'node', 'worker.mjs'],
      },
      transportDeadlines: {
        startup: { readyMs: 500, promptMs: 500 },
        round: { idleMs: 1000, ceilingMs: 2000 },
      },
    }),
    (err) => {
      assert.ok(err instanceof DispatchError);
      assert.equal(err.data?.reason ?? err.code, 'confinement-mismatch');
      return true;
    },
  );
});

// 19. Confined execution under required bwrap executes via launcher script and produces receipt
test('19. confined execution under required bwrap executes via launcher script and produces receipt', async (t) => {
  const tmp = mkTempDir();
  const runDir = path.join(tmp, 'run');

  // The /proc/<pid>/cwd verification added alongside the launcher-script
  // guard reads real kernel state for whatever pid the mock reports as the
  // foreground process -- a fabricated pid (e.g. 200) almost certainly
  // belongs to no running process, so /proc/<pid>/cwd is unreadable and the
  // check fails closed (correctly). A genuinely running child process is
  // spawned here so its real /proc/<pid>/cwd, /proc/<pid>/exe, and
  // environment all line up with what this test's own prepared invocation
  // expects, the same real-process pattern test 22 below uses.
  const fgProcess = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 10000)'], {
    cwd: tmp,
    env: { ...process.env, TEST_CONF_ENV: 'active' },
    stdio: 'ignore',
  });
  t.after(() => { try { fgProcess.kill('SIGKILL'); } catch {} });

  const mock = createMockHerdr(tmp, {
    runDir,
    mockArgv: ['claude', '--ro-bind', '/', '/', 'node', 'worker.mjs'],
    foregroundPid: fgProcess.pid,
  });

  const launchContext = {
    contract: 'assignment-herdr-spawn-launch-context.v1',
    runId: 'run-conf-01',
    launchCommandId: 'cmd-conf-01',
    controlEpoch: 1,
    controlToken: 'tok-conf',
  };

  createHerdrLaunchCommand(runDir, launchContext);

  const workerInvocation = {
    command: '/usr/bin/bwrap',
    args: ['--ro-bind', '/', '/', 'node', 'worker.mjs'],
    cwd: tmp,
    env: { TEST_CONF_ENV: 'active' },
    workerCommandDigest: computeSha256Digest({ command: '/usr/bin/bwrap', args: ['--ro-bind', '/', '/', 'node', 'worker.mjs'] }),
  };

  const prepDir = path.join(runDir, 'protected', 'prepared-invocation');
  fs.mkdirSync(prepDir, { recursive: true });
  const prepRec = {
    contract: 'authority-prepared-invocation.v1',
    workerInvocation,
  };
  const prepDigest = computeSha256Digest(prepRec);
  publishImmutableProof(path.join(prepDir, 'cmd-conf-01.json'), { ...prepRec, digest: prepDigest });

  const result = await runHerdrRound({
    herdrBin: mock.herdrBin,
    workId: 'item-conf-01',
    runId: 'run-conf-01',
    launchCommandId: 'cmd-conf-01',
    preparedInvocationDigest: prepDigest,
    runDir,
    command: 'node',
    args: ['worker.mjs'],
    cwd: tmp,
    fullEnv: process.env,
    delivery: 'file-pointer',
    agentKind: 'claude',
    confinementRequirement: { mode: 'required' },
    backendId: 'bwrap',
    workerInvocation,
    transportDeadlines: {
      startup: { readyMs: 500, promptMs: 500 },
      round: { idleMs: 1000, ceilingMs: 2000 },
    },
  });

  assert.equal(result.outcome, 'settled');

  // LOW-11: the launcher script persists the full prepared env, including
  // session tokens, as a plain file -- settleRound removes it once the
  // round settles so that copy does not outlive the round it belonged to.
  const launcherScript = path.join(runDir, 'protected', 'launchers', 'cmd-conf-01.sh');
  assert.ok(!fs.existsSync(launcherScript), 'launcher script must be cleaned up after settle');

  const receipt = readHerdrAdapterReceipt(runDir, 'cmd-conf-01');
  assert.ok(receipt, 'receipt must exist');
  assert.equal(receipt.contract, 'herdr-adapter-receipt.v1');
  assert.equal(receipt.workerCommandDigest, workerInvocation.workerCommandDigest);
  assert.ok(receipt.startArgvDigest);
  assert.equal(receipt.completion?.kind, 'settled');
});

// 20. Live Herdr gateway executes confined launch end-to-end when gateway is running
//
// HIGH-2: this used to launch a bare `node -e workerCode` as the "worker
// invocation" -- no `bwrap` anywhere in the command -- so it proved the
// launcher-script/herdr mechanism worked, but never that a genuinely
// bwrap-confined worker can settle. Rewritten to wrap the worker in a real
// `bwrap` invocation shaped the same way Confinement Authority's own
// `prepareBwrap` builds one (`--ro-bind / /` plus a single writable bind for
// the run-output grant), so the worker can ONLY write inside `runDir/outbox`
// -- the same directory `brief.mjs` tells every herdr-spawn worker to write
// into (see resources.mjs's HIGH-2 fix: herdr-spawn's run-output grant binds
// that directory, not `worker-output/outbox`). A worker that settles here is
// live proof the grant and the brief agree on where to write.
test('20. live Herdr gateway executes confined launch end-to-end when gateway is running', async (t) => {
  const herdrBin = findExecutableOnPath(['herdr']);
  if (!herdrBin) return t.skip('herdr binary not found on PATH');
  try {
    const statusOut = execFileSync(herdrBin, ['status'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    if (!statusOut.includes('running')) return t.skip('herdr gateway is not running');
  } catch {
    return t.skip('herdr status check failed');
  }
  const bwrapBin = findExecutableOnPath(['bwrap']) || (fs.existsSync('/usr/bin/bwrap') ? '/usr/bin/bwrap' : null);
  if (!bwrapBin) return t.skip('bwrap binary not found');

  const tmp = mkTempDir('fgos-live-herdr-');
  const runDir = path.join(tmp, 'run');
  const outboxDir = path.join(runDir, 'outbox');
  fs.mkdirSync(outboxDir, { recursive: true });

  const launchContext = {
    contract: 'assignment-herdr-spawn-launch-context.v1',
    runId: 'run-live-01',
    launchCommandId: 'cmd-live-01',
    controlEpoch: 1,
    controlToken: 'tok-live',
  };

  createHerdrLaunchCommand(runDir, launchContext);

  const resultPath = path.join(outboxDir, 'result-1.json');
  const workerCode = `const fs = require('fs'); fs.writeFileSync(${JSON.stringify(resultPath)}, JSON.stringify({ status: 'done', summary: 'live-proof' })); setTimeout(() => {}, 2000);`;
  // The real sandbox shape `prepareBwrap` builds: read-only root, a single
  // writable bind for the resource under test (the run-output outbox), then
  // the worker command after `--`. Everything the worker is NOT explicitly
  // given a bind for is read-only -- if the outbox bind were wrong (as it
  // was before the HIGH-2 fix), the worker's own `fs.writeFileSync` above
  // would fail with EROFS and this test would fail closed, not silently pass.
  const bwrapArgs = [
    '--ro-bind', '/', '/',
    '--dev', '/dev',
    '--proc', '/proc',
    '--tmpfs', '/tmp',
    '--bind', outboxDir, outboxDir,
    '--', process.execPath, '-e', workerCode,
  ];
  const workerInvocation = {
    command: bwrapBin,
    args: bwrapArgs,
    cwd: tmp,
    env: { LIVE_TEST: 'true' },
    workerCommandDigest: computeSha256Digest({ command: bwrapBin, args: bwrapArgs }),
  };

  const prepDir = path.join(runDir, 'protected', 'prepared-invocation');
  fs.mkdirSync(prepDir, { recursive: true });
  const prepRec = { contract: 'authority-prepared-invocation.v1', workerInvocation };
  const prepDigest = computeSha256Digest(prepRec);
  publishImmutableProof(path.join(prepDir, 'cmd-live-01.json'), { ...prepRec, digest: prepDigest });

  const result = await runHerdrRound({
    herdrBin,
    workId: 'live-item-01',
    runId: 'run-live-01',
    launchCommandId: 'cmd-live-01',
    preparedInvocationDigest: prepDigest,
    runDir,
    command: 'node',
    args: ['-e', workerCode],
    cwd: tmp,
    fullEnv: process.env,
    delivery: 'file-pointer',
    agentKind: 'claude',
    confinementRequirement: { mode: 'required' },
    backendId: 'bwrap',
    workerInvocation,
    transportDeadlines: {
      startup: { readyMs: 5000, promptMs: 5000 },
      round: { idleMs: 3000, ceilingMs: 6000 },
    },
  });

  assert.equal(result.outcome, 'settled');
  assert.ok(fs.existsSync(resultPath), 'a genuinely bwrap-confined worker must be able to write its own outbox/result-1.json');

  const receipt = readHerdrAdapterReceipt(runDir, 'cmd-live-01');
  assert.ok(receipt);
  assert.equal(receipt.completion?.kind, 'settled');
  assert.ok(receipt.resourceIncarnation);
  assert.ok(receipt.resourceIncarnation.workerPid);
});

// 21. Confined path resourceIncarnation fencing distinguishes reattach from new process
test('21. confined path resourceIncarnation fencing distinguishes reattach from new process', async () => {
  const tmp = mkTempDir();
  const runDir = path.join(tmp, 'run');
  fs.mkdirSync(path.join(runDir, 'controller', 'commands'), { recursive: true });

  const launchContext = {
    contract: 'assignment-herdr-spawn-launch-context.v1',
    runId: 'run-re-01',
    launchCommandId: 'cmd-re-01',
    controlEpoch: 1,
    controlToken: 'tok-re',
  };

  const incarnationA = computeHerdrResourceIncarnation({
    paneId: 'mock-pane-1',
    shellPid: 100,
    workerPid: 200,
    processStartTime: '11111',
  });

  createHerdrLaunchCommand(runDir, launchContext, {
    paneId: 'mock-pane-1',
    resourceIncarnation: incarnationA,
  });

  const prepDir = path.join(runDir, 'protected', 'prepared-invocation');
  fs.mkdirSync(prepDir, { recursive: true });
  const prepRec = {
    contract: 'authority-prepared-invocation.v1',
    workerInvocation: {
      command: '/usr/bin/bwrap',
      args: ['--ro-bind', '/', '/', 'node', 'worker.mjs'],
      workerCommandDigest: computeSha256Digest({ command: '/usr/bin/bwrap', args: ['--ro-bind', '/', '/', 'node', 'worker.mjs'] }),
    },
  };
  const prepDigest = computeSha256Digest(prepRec);
  publishImmutableProof(path.join(prepDir, 'cmd-re-01.json'), { ...prepRec, digest: prepDigest });

  const cmd = readHerdrLaunchCommand(runDir, 'cmd-re-01');
  cmd.preparedInvocationDigest = prepDigest;
  publishMutableProjection(path.join(runDir, 'controller', 'commands', 'cmd-re-01.json'), cmd);

  // 1. Probed matching incarnation reattaches / observes running worker
  const recMatch = await reconcileHerdrSpawnRun(runDir, {
    probe: async () => ({
      status: 'working',
      agentStatus: 'working',
      resourceIncarnation: incarnationA,
    }),
  });
  assert.equal(recMatch.status, 'waiting');
  assert.equal(recMatch.state, 'worker-running');
  assert.deepEqual(recMatch.resourceIncarnation, incarnationA);

  // 2. Probed new process with different pid parks as incarnation-mismatch
  const incarnationB = computeHerdrResourceIncarnation({
    paneId: 'mock-pane-1',
    shellPid: 100,
    workerPid: 300,
    processStartTime: '22222',
  });

  const recMismatch = await reconcileHerdrSpawnRun(runDir, {
    probe: async () => ({
      status: 'working',
      agentStatus: 'working',
      resourceIncarnation: incarnationB,
    }),
  });
  assert.equal(recMismatch.status, 'parked');
  assert.equal(recMismatch.reason, 'incarnation-mismatch');
});

// 22. verifyProcessEnvironment catches an overridden prepared value and an
// injected addition, and stays silent when there is no live evidence.
test('22. verifyProcessEnvironment catches value overrides and injected additions', async () => {
  if (process.platform !== 'linux') return;

  const child = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 5000)'], {
    env: {
      ...process.env,
      FGOS_TEST_MARKER: 'expected-value',
      // BASH_ENV is a known injection vector but inert for a node child --
      // it is never read by node itself, so setting it here proves the
      // "unexpected addition" branch without risking the child's own
      // startup the way LD_PRELOAD pointed at a bogus path could.
      BASH_ENV: '/tmp/fgos-test-injected-env-marker',
    },
    stdio: 'ignore',
  });

  try {
    // Give the child a moment to actually be running before /proc is read.
    await new Promise((resolve) => setTimeout(resolve, 200));

    assert.equal(
      verifyProcessEnvironment(child.pid, { FGOS_TEST_MARKER: 'expected-value' }),
      false,
      'BASH_ENV was set on the child but never declared in expectedEnv -- an injected addition',
    );

    assert.equal(
      verifyProcessEnvironment(child.pid, { FGOS_TEST_MARKER: 'tampered-value', BASH_ENV: '/tmp/fgos-test-injected-env-marker' }),
      false,
      'a declared value that does not match what the process actually has',
    );

    assert.equal(
      verifyProcessEnvironment(child.pid, { FGOS_TEST_MARKER: 'expected-value', BASH_ENV: '/tmp/fgos-test-injected-env-marker' }),
      true,
      'every declared key present with its exact prepared value, and every injection vector present was declared',
    );

    assert.equal(verifyProcessEnvironment(child.pid, null), null);
    assert.equal(verifyProcessEnvironment(child.pid, {}), null);
    assert.equal(verifyProcessEnvironment(999999999, { FGOS_TEST_MARKER: 'expected-value' }), null);
  } finally {
    child.kill('SIGKILL');
  }
});

