import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {
  runHerdrRound,
  reconcileHerdrSpawnRun,
  readHerdrAdapterReceipt,
  publishHerdrAdapterReceipt,
  computeHerdrResourceIncarnation,
  createHerdrLaunchCommand,
  readHerdrLaunchCommand,
  HerdrLaunchCollisionError,
} from '../../src/runner/dispatch/herdr-round.mjs';
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
  const foreground = gone
    ? [{ pid: 100, name: 'zsh' }]
    : [{ pid: 200, name: 'bwrap' }, { pid: 100, name: 'zsh' }];
  ok({ process_info: { pane_id: 'mock-pane-1', shell_pid: 100, foreground_process_group_id: gone ? 100 : 200, foreground_processes: foreground } });
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

// 1. Confinement Authority accepts herdr-spawn with worker-command seam and enforces bwrap
test('1. Confinement Authority accepts herdr-spawn when worker-command seam is present and prepares bwrap', async () => {
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

  assert.ok(prep);
  assert.equal(prep.launchCommand.contract, 'herdr-launch-command.v1');
  assert.equal(prep.launchCommand.herdrName, 'fgos-run-01-cmd-01');
  assert.equal(prep.launchCommand.state, 'pending');
  assert.ok(prep.preparedInvocationDigest);
  assert.equal(prep.launchCommand.preparedInvocationDigest, prep.preparedInvocationDigest);

  // Check prepared command is bwrap
  assert.ok(prep.preparedInvocation.workerInvocation.command.includes('bwrap') || prep.preparedInvocation.workerInvocation.command === 'bwrap');
  assert.ok(prep.preparedInvocation.workerInvocation.args.includes('node'));
  assert.ok(prep.preparedInvocation.workerInvocation.args.includes('worker.mjs'));
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
    command: 'bwrap',
    args: ['--ro-bind', '/', '/', 'node', '-v'],
    cwd: tmp,
    fullEnv: process.env,
    delivery: 'file-pointer',
    agentKind: 'bwrap',
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
  assert.notEqual(receipt.startArgvDigest, receipt.workerCommandDigest);
  assert.equal(receipt.workerCommandDigest, computeSha256Digest({ command: 'bwrap', args: ['--ro-bind', '/', '/', 'node', '-v'] }));
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
    transportDeadlines: {
      startup: { readyMs: 500, promptMs: 500 },
      round: { idleMs: 1000, ceilingMs: 2000 },
    },
  });

  const cmd = readHerdrLaunchCommand(runDir, 'cmd-fresh-01');
  assert.equal(cmd.herdrName, 'fgos-run-fresh-01-cmd-fresh-01');
  assert.equal(cmd.state, 'reconciled');

  // Verify Herdr calls include pane run
  const calls = mock.calls();
  const runCalls = calls.filter((c) => c[0] === 'pane' && c[1] === 'run');
  assert.equal(runCalls.length, 1);
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
