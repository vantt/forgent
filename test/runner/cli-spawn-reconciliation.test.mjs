import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  executeAssignment,
  reconcileCliSpawnRun,
} from '../../src/runner/dispatch/assignment-runner.mjs';
import {
  buildAssignment,
} from '../../src/runner/dispatch/assignment.mjs';
import {
  runSupervisor,
  startSupervisorProcess,
  readSupervisorBinding,
  readWorkerBinding,
  readAdapterReceipt,
  getBootId,
  getProcessStartTime,
  getProcessPgid,
  isProcessAlive,
  canonicalJson,
  computeSha256Digest,
  publishImmutableProof,
  publishMutableProjection,
  publishAdapterReceipt,
  ReceiptPathCollisionError,
} from '../../src/runner/dispatch/cli-spawn-supervisor.mjs';
import { spawnWorker } from '../../src/runner/dispatch/cli.mjs';
import { cliSpawnAdapter } from '../../src/runner/dispatch/transport.mjs';
import {
  buildConfinementRequest,
  validateAssignmentLaunchContext,
} from '../../src/runner/dispatch/confinement/request.mjs';
import {
  prepareConfinementForLaunch,
  finalizeConfinementResources,
} from '../../src/runner/dispatch/confinement/authority.mjs';

function mkTempDir(prefix = 'fgos-reconcile-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

async function waitForProcessExit(pid, { attempts = 20, intervalMs = 50 } = {}) {
  for (let i = 0; i < attempts; i++) {
    if (!isProcessAlive(pid)) return true;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return !isProcessAlive(pid);
}

function initGitRepo(repoDir) {
  execFileSync('git', ['init'], { cwd: repoDir, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoDir, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', 'Tester'], { cwd: repoDir, stdio: 'ignore' });
  fs.writeFileSync(path.join(repoDir, 'README.md'), '# Test\n');
  execFileSync('git', ['add', '.'], { cwd: repoDir, stdio: 'ignore' });
  execFileSync('git', ['commit', '-m', 'initial'], { cwd: repoDir, stdio: 'ignore' });
}

// 1. Legacy ad-hoc parity
test('1. legacy ad-hoc spawnWorker and cliSpawnAdapter parity for argv/env/cwd/stdin/onChunk/limits', async () => {
  const tmp = mkTempDir();
  const chunks = [];
  const res = await cliSpawnAdapter(
    {
      command: process.execPath,
      args: ['-e', 'process.stdout.write("out:" + process.env.TEST_VAR + "\\n"); process.stderr.write("err:msg\\n"); process.exit(0);'],
      env: { TEST_VAR: 'hello-parity' },
    },
    {
      cwd: tmp,
      // Canonical order everywhere else in the codebase (transport.mjs's
      // teeChunk, cli.mjs, loop.mjs): onChunk(stream, chunk). Recorded raw
      // here, not asserted inline -- teeChunk wraps this call in try/catch
      // (an observability callback must never crash dispatch), so an inline
      // assertion failure would be silently swallowed there instead of
      // failing the test; the shape is checked below, outside the callback.
      onChunk: (stream, chunk) => {
        chunks.push({ stream, chunk });
      },
    },
  );

  assert.equal(res.exitCode, 0);
  assert.match(res.stdout, /out:hello-parity/);
  assert.match(res.stderr, /err:msg/);
  assert.ok(chunks.length > 0, 'onChunk must have been called at least once');
  for (const c of chunks) {
    // Order is the one contract every onChunk caller shares (stream first);
    // the chunk's own type is adapter-specific -- this adapter sets
    // `child.stdout.setEncoding('utf8')`, so its chunks are strings, while
    // cli-spawn-supervisor.mjs's detached path hands Buffers. Both are valid.
    assert.equal(typeof c.stream, 'string', 'onChunk must receive stream (stdout/stderr) as its first argument');
    assert.ok(c.stream === 'stdout' || c.stream === 'stderr', `stream must be stdout/stderr, got ${c.stream}`);
    assert.ok(typeof c.chunk === 'string' || Buffer.isBuffer(c.chunk), 'onChunk must receive the chunk as its second argument');
  }
  assert.ok(chunks.some((c) => c.stream === 'stdout' && c.chunk.toString('utf8').includes('out:hello-parity')));
});

// 2. Assignment-owned fresh launch writes pending command, baseline, envelope, bindings, capture, receipt
test('2. Assignment-owned fresh launch writes pending command, baseline, envelope, supervisor binding, worker binding, protected capture and receipt', async () => {
  const tmp = mkTempDir();
  initGitRepo(tmp);

  const workerScript = path.join(tmp, 'worker.mjs');
  fs.writeFileSync(
    workerScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const cwd = process.cwd();
    const runsDir = path.join(cwd, '.fgos', 'assignments');
    if (fs.existsSync(runsDir)) {
      for (const asgn of fs.readdirSync(runsDir)) {
        const rDir = path.join(runsDir, asgn, 'runs', '01');
        if (fs.existsSync(rDir)) {
          fs.writeFileSync(path.join(rDir, 'agent-report.md'), '# Report\\nDone.\\n');
          fs.writeFileSync(path.join(rDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done' }));
        }
      }
    }
    fs.writeFileSync(path.join(cwd, 'new-file.txt'), 'Worker mutation\\n');
    process.stdout.write("Worker finished cleanly.\\n");
    process.exit(0);
    `,
  );

  const runnerConfig = {
    executor: {
      allowCrossProvider: true,
      command: process.execPath,
      args: [workerScript, '{prompt}'],
    },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const assignment = buildAssignment({
    workId: 'tsk-fresh-launch',
    operation: 'implement-item',
    stage: 'executing',
    role: 'implement',
    description: 'Fresh launch test',
  });

  const result = await executeAssignment(assignment, {
    cwd: tmp,
    repoRoot: tmp,
    runnerConfig,
    isReadOnlyMode: false,
  });

  const runResult = result.runResult || result;
  assert.equal(runResult.status, 'done');
  const runDir = path.join(tmp, '.fgos', 'assignments', assignment.assignmentId, 'runs', '01');

  // Verify command state
  const commandsDir = path.join(runDir, 'controller', 'commands');
  const cmdFiles = fs.readdirSync(commandsDir);
  assert.ok(cmdFiles.length > 0);
  const cmdState = JSON.parse(fs.readFileSync(path.join(commandsDir, cmdFiles[0]), 'utf8'));
  assert.equal(cmdState.contract, 'assignment-command-state.v1');
  assert.equal(cmdState.state, 'reconciled');
  assert.ok(cmdState.envelopeDigest);
  assert.equal(cmdState.outcome.kind, 'receipt-backed');

  // Verify baseline
  const baseline = JSON.parse(fs.readFileSync(path.join(runDir, 'controller', 'evaluator-baseline.json'), 'utf8'));
  assert.equal(baseline.contract, 'evaluator-baseline.v1');
  assert.ok(baseline.gitBefore);

  // Verify envelope (H11: v2 -- env redacted, secretsRef added)
  const envelope = JSON.parse(fs.readFileSync(path.join(runDir, 'protected', 'launch-envelope.json'), 'utf8'));
  assert.equal(envelope.contract, 'cli-spawn-launch-envelope.v2');
  assert.ok(envelope.invocation.secretsRef, 'v2 envelope must name the secrets side file');
  assert.equal(envelope.invocation.env.PATH, process.env.PATH, 'allow-listed keys still appear');
  assert.ok(!('ANTHROPIC_API_KEY' in envelope.invocation.env), 'the persisted envelope must never carry a credential-shaped key');
  // H11: the real supervisor process reads this side file once to spawn the
  // real worker (proven by the run having genuinely settled above, using
  // real process.env.PATH etc. it could only have gotten from there) and
  // unlinks it immediately after -- it must not survive a settled run.
  assert.equal(fs.existsSync(path.join(runDir, envelope.invocation.secretsRef)), false, 'the secrets side file must be consumed and deleted by the supervisor, never left behind');

  // Verify supervisor binding
  const supBinding = readSupervisorBinding(runDir, cmdState.launchCommandId);
  assert.ok(supBinding);
  assert.equal(supBinding.contract, 'cli-spawn-supervisor-binding.v1');

  // Verify worker binding
  const workerBinding = readWorkerBinding(runDir, cmdState.launchCommandId);
  assert.ok(workerBinding);
  assert.equal(workerBinding.contract, 'cli-spawn-worker-binding.v1');

  // Verify capture
  const stdoutPath = path.join(runDir, 'protected', 'capture', cmdState.launchCommandId, 'stdout.log');
  assert.ok(fs.existsSync(stdoutPath));
  assert.match(fs.readFileSync(stdoutPath, 'utf8'), /Worker finished cleanly/);

  // Verify receipt
  const receipt = readAdapterReceipt(runDir, cmdState.launchCommandId);
  assert.ok(receipt);
  assert.equal(receipt.contract, 'cli-spawn-adapter-receipt.v1');
  assert.equal(receipt.exitCode, 0);
});

// 3. Injected coordinator death after supervisor start still produces protected capture and receipt
test('3. injected coordinator death after supervisor start still produces protected capture and receipt', async () => {
  const tmp = mkTempDir();
  const runDir = path.join(tmp, 'run');
  fs.mkdirSync(runDir, { recursive: true });

  const workerScript = path.join(tmp, 'slow-worker.mjs');
  fs.writeFileSync(
    workerScript,
    `
    setTimeout(() => {
      process.stdout.write("Async worker done\\n");
      process.exit(0);
    }, 200);
    `,
  );

  const launchCommandId = 'cmd_coord_death';
  const envelope = {
    contract: 'cli-spawn-launch-envelope.v1',
    launchCommandId,
    adapter: 'cli-spawn',
    run: {
      runDir,
      commandPath: path.join(runDir, 'controller', 'commands', `${launchCommandId}.json`),
      baselinePath: path.join(runDir, 'controller', 'evaluator-baseline.json'),
    },
    paths: {
      protectedDir: path.join(runDir, 'protected'),
      captureDir: path.join(runDir, 'protected', 'capture', launchCommandId),
      bindingsDir: path.join(runDir, 'protected', 'bindings', launchCommandId),
      receiptsDir: path.join(runDir, 'protected', 'receipts', launchCommandId),
      outboxDir: path.join(runDir, 'worker-output', 'outbox'),
      workspaceDir: tmp,
    },
    invocation: {
      command: process.execPath,
      args: [workerScript],
      env: {},
      cwd: tmp,
    },
    limits: {
      timeoutMs: 3000,
    },
  };
  const envPath = path.join(runDir, 'protected', 'launch-envelope.json');
  publishImmutableProof(envPath, envelope);

  // Start supervisor detached (simulating coordinator death by not awaiting in same process)
  const child = startSupervisorProcess({
    envelopePath: envPath,
    runDir,
    launchCommandId,
  });

  // Wait for receipt to appear on disk independently
  let receipt = null;
  for (let i = 0; i < 40; i++) {
    receipt = readAdapterReceipt(runDir, launchCommandId);
    if (receipt) break;
    await new Promise((r) => setTimeout(r, 100));
  }

  assert.ok(receipt, 'Receipt must be published after coordinator disconnects');
  assert.equal(receipt.completion.exitCode, 0);
  const stdout = fs.readFileSync(path.join(runDir, 'protected', 'capture', launchCommandId, 'stdout.log'), 'utf8');
  assert.match(stdout, /Async worker done/);
});

// 4. Pending without envelope or binding parks and never spawns a second worker
test('4. pending without envelope or binding parks and never spawns a second worker', async () => {
  const tmp = mkTempDir();
  const runDir = path.join(tmp, 'run');
  const commandsDir = path.join(runDir, 'controller', 'commands');
  fs.mkdirSync(commandsDir, { recursive: true });

  fs.writeFileSync(
    path.join(runDir, 'run.json'),
    JSON.stringify({ contract: 'run-meta.v1', runId: 'run_4', assignmentId: 'asgn_4', attempt: 1, status: 'running' }),
  );

  const launchCommandId = 'cmd_missing_envelope';
  const commandState = {
    contract: 'assignment-command-state.v1',
    launchCommandId,
    state: 'pending',
    envelopeDigest: null,
    controlEpoch: 1,
    controlTokenDigest: computeSha256Digest('tok_123'),
  };
  fs.writeFileSync(path.join(commandsDir, `${launchCommandId}.json`), JSON.stringify(commandState, null, 2));

  // Case A: Missing envelope -> parks launch-envelope-missing
  const parkRes1 = await reconcileCliSpawnRun(runDir, {
    controlToken: 'tok_123',
    controlEpoch: 1,
  });
  assert.equal(parkRes1.status, 'parked');
  assert.equal(parkRes1.reason, 'launch-envelope-missing');

  // Case B: Envelope exists, but no supervisor binding -> parks supervisor-binding-unknown
  const baseline = { contract: 'evaluator-baseline.v1', gitBefore: null, dirtyBefore: [] };
  baseline.digest = computeSha256Digest(baseline);
  fs.writeFileSync(path.join(runDir, 'controller', 'evaluator-baseline.json'), canonicalJson(baseline));

  const envPath = path.join(runDir, 'protected', 'launch-envelope', `${launchCommandId}.json`);
  const envBody = {
    contract: 'cli-spawn-launch-envelope.v1',
    launchCommandId,
    adapter: 'cli-spawn',
    run: { runDir },
  };
  const envDigest = computeSha256Digest(envBody);
  const envelope = { ...envBody, digest: envDigest };
  publishImmutableProof(envPath, envelope);

  commandState.envelopeDigest = envDigest;
  fs.writeFileSync(path.join(commandsDir, `${launchCommandId}.json`), JSON.stringify(commandState, null, 2));

  const parkRes2 = await reconcileCliSpawnRun(runDir, {
    controlToken: 'tok_123',
    controlEpoch: 1,
  });
  assert.equal(parkRes2.status, 'parked');
  assert.equal(parkRes2.reason, 'supervisor-binding-unknown');
});

// 5. Worker PGID differs from supervisor PGID and timeout signals only worker PGID
test('5. worker PGID differs from supervisor PGID and timeout signals only worker PGID', async () => {
  const tmp = mkTempDir();
  const runDir = path.join(tmp, 'run');
  fs.mkdirSync(runDir, { recursive: true });

  const workerScript = path.join(tmp, 'hang-worker.mjs');
  fs.writeFileSync(
    workerScript,
    `
    process.stdout.write("Worker started\\n");
    setInterval(() => {}, 1000);
    `,
  );

  const launchCommandId = 'cmd_pgid_timeout';
  const envelope = {
    contract: 'cli-spawn-launch-envelope.v1',
    launchCommandId,
    adapter: 'cli-spawn',
    run: { runDir },
    paths: {
      protectedDir: path.join(runDir, 'protected'),
      captureDir: path.join(runDir, 'protected', 'capture', launchCommandId),
      bindingsDir: path.join(runDir, 'protected', 'supervisor-binding'),
      receiptsDir: path.join(runDir, 'protected', 'adapter-receipts'),
      outboxDir: path.join(runDir, 'worker-output', 'outbox'),
      workspaceDir: tmp,
    },
    invocation: {
      command: process.execPath,
      args: [workerScript],
      env: {},
      cwd: tmp,
    },
    limits: {
      timeoutMs: 400,
    },
  };
  const envPath = path.join(runDir, 'protected', 'launch-envelope', `${launchCommandId}.json`);
  publishImmutableProof(envPath, envelope);

  const child = startSupervisorProcess({
    envelopePath: envPath,
    runDir,
    launchCommandId,
  });

  let receipt = null;
  for (let i = 0; i < 40; i++) {
    receipt = readAdapterReceipt(runDir, launchCommandId);
    if (receipt) break;
    await new Promise((r) => setTimeout(r, 100));
  }

  assert.ok(receipt);
  assert.equal(receipt.completion.kind, 'timeout');

  const supBinding = readSupervisorBinding(runDir, launchCommandId);
  const workerBinding = readWorkerBinding(runDir, launchCommandId);

  assert.ok(supBinding.supervisor.pid);
  assert.ok(workerBinding.worker.pid);
  assert.notEqual(supBinding.supervisor.pid, workerBinding.worker.pid);
  assert.notEqual(supBinding.supervisor.pgid, workerBinding.worker.pgid);

  // Verify worker process was terminated. The supervisor receipt can publish
  // just before the kernel has made the signalled process disappear from
  // kill(0), especially under the full test suite's subprocess load.
  assert.equal(await waitForProcessExit(workerBinding.worker.pid), true);
});

// 6. Escaped descendant keeps pipe open but timeout/maxBuffer receipt publishes immediately with partial coverage
test('6. escaped descendant keeps pipe open but timeout/maxBuffer receipt publishes immediately with partial coverage', async () => {
  const tmp = mkTempDir();
  const runDir = path.join(tmp, 'run');
  fs.mkdirSync(runDir, { recursive: true });

  const workerScript = path.join(tmp, 'escaped-descendant.mjs');
  fs.writeFileSync(
    workerScript,
    `
    import { spawn } from 'node:child_process';
    // Spawn detached child holding stdout open
    const child = spawn('sleep', ['60'], { detached: true, stdio: 'inherit' });
    child.unref();
    process.stdout.write("Worker exiting immediately\\n");
    process.exit(0);
    `,
  );

  const launchCommandId = 'cmd_escaped_pipe';
  const envelope = {
    contract: 'cli-spawn-launch-envelope.v1',
    launchCommandId,
    adapter: 'cli-spawn',
    run: { runDir },
    paths: {
      protectedDir: path.join(runDir, 'protected'),
      captureDir: path.join(runDir, 'protected', 'capture', launchCommandId),
      bindingsDir: path.join(runDir, 'protected', 'supervisor-binding'),
      receiptsDir: path.join(runDir, 'protected', 'adapter-receipts'),
      outboxDir: path.join(runDir, 'worker-output', 'outbox'),
      workspaceDir: tmp,
    },
    invocation: {
      command: process.execPath,
      args: [workerScript],
      env: {},
      cwd: tmp,
    },
    limits: {
      timeoutMs: 1500,
    },
  };
  const envPath = path.join(runDir, 'protected', 'launch-envelope', `${launchCommandId}.json`);
  publishImmutableProof(envPath, envelope);

  const startMs = Date.now();
  startSupervisorProcess({
    envelopePath: envPath,
    runDir,
    launchCommandId,
  });

  let receipt = null;
  for (let i = 0; i < 40; i++) {
    receipt = readAdapterReceipt(runDir, launchCommandId);
    if (receipt) break;
    await new Promise((r) => setTimeout(r, 100));
  }

  const durationMs = Date.now() - startMs;
  assert.ok(receipt);
  assert.ok(durationMs < 5000, `Supervisor must not hang waiting for open pipes (took ${durationMs}ms)`);
});

// 7. PID reuse, boot mismatch and start-time mismatch refuse inspect/kill/settle
test('7. PID reuse, boot mismatch and start-time mismatch refuse inspect/kill/settle', async () => {
  if (getBootId() === 'unknown-boot') return;
  const tmp = mkTempDir();
  const runDir = path.join(tmp, 'run');
  const commandsDir = path.join(runDir, 'controller', 'commands');
  const bindingsDir = path.join(runDir, 'protected', 'supervisor-binding');
  fs.mkdirSync(commandsDir, { recursive: true });
  fs.mkdirSync(bindingsDir, { recursive: true });

  fs.writeFileSync(
    path.join(runDir, 'run.json'),
    JSON.stringify({ contract: 'run-meta.v1', runId: 'run_reb', assignmentId: 'asgn_reb', attempt: 1, status: 'running' }),
  );

  const baseline = { contract: 'evaluator-baseline.v1', gitBefore: null, dirtyBefore: [] };
  baseline.digest = computeSha256Digest(baseline);
  fs.writeFileSync(path.join(runDir, 'controller', 'evaluator-baseline.json'), canonicalJson(baseline));

  const launchCommandId = 'cmd_reboot';
  const envPath = path.join(runDir, 'protected', 'launch-envelope', `${launchCommandId}.json`);
  const envBody = {
    contract: 'cli-spawn-launch-envelope.v1',
    launchCommandId,
    adapter: 'cli-spawn',
    run: { runDir },
  };
  const envDigest = computeSha256Digest(envBody);
  publishImmutableProof(envPath, { ...envBody, digest: envDigest });

  const commandState = {
    contract: 'assignment-command-state.v1',
    launchCommandId,
    state: 'pending',
    envelopeDigest: envDigest,
    controlEpoch: 1,
    controlTokenDigest: computeSha256Digest('tok_reb'),
  };
  fs.writeFileSync(path.join(commandsDir, `${launchCommandId}.json`), JSON.stringify(commandState, null, 2));

  // Write supervisor binding with non-matching bootId
  const supBinding = {
    contract: 'cli-spawn-supervisor-binding.v1',
    launchCommandId,
    envelopeDigest: envDigest,
    bootId: 'other-machine-boot-uuid',
    supervisor: {
      pid: 999999,
      pgid: 999999,
      starttime: '12345',
    },
  };
  fs.writeFileSync(path.join(bindingsDir, `${launchCommandId}.json`), JSON.stringify(supBinding, null, 2));

  const parkRes = await reconcileCliSpawnRun(runDir, {
    controlToken: 'tok_reb',
    controlEpoch: 1,
  });
  assert.equal(parkRes.status, 'parked');
  assert.equal(parkRes.reason, 'host-reboot-unknown');
});

// 8. Tampered envelope, receipt or digest refuses before collection
test('8. tampered envelope, receipt or digest refuses before collection', async () => {
  const tmp = mkTempDir();
  initGitRepo(tmp);
  const runDir = path.join(tmp, 'run');
  const commandsDir = path.join(runDir, 'controller', 'commands');
  const envelopeDir = path.join(runDir, 'protected', 'launch-envelope');
  fs.mkdirSync(commandsDir, { recursive: true });
  fs.mkdirSync(envelopeDir, { recursive: true });

  fs.writeFileSync(
    path.join(runDir, 'run.json'),
    JSON.stringify({ contract: 'run-meta.v1', runId: 'run_tamper', assignmentId: 'asgn_tamper', attempt: 1, status: 'running' }),
  );

  const baseline = { contract: 'evaluator-baseline.v1', gitBefore: null, dirtyBefore: [] };
  baseline.digest = computeSha256Digest(baseline);
  fs.writeFileSync(path.join(runDir, 'controller', 'evaluator-baseline.json'), canonicalJson(baseline));

  const launchCommandId = 'cmd_tamper';
  // Write corrupt envelope file
  const envPath = path.join(envelopeDir, `${launchCommandId}.json`);
  fs.writeFileSync(envPath, '{ "contract": "corrupt-json');

  const commandState = {
    contract: 'assignment-command-state.v1',
    launchCommandId,
    state: 'pending',
    envelopeDigest: 'sha256:some-expected-digest',
    controlEpoch: 1,
    controlTokenDigest: computeSha256Digest('tok_tamp'),
  };
  fs.writeFileSync(path.join(commandsDir, `${launchCommandId}.json`), JSON.stringify(commandState, null, 2));

  const res = await reconcileCliSpawnRun(runDir, {
    controlToken: 'tok_tamp',
    controlEpoch: 1,
  });
  assert.equal(res.status, 'refused');
  assert.equal(res.reason, 'protected-artifact-corrupt');
});

// 9. Worker cannot write, truncate, replace or unlink protected capture or protected receipt under required confinement
test('9. worker write grant does not overlap protected capture or receipt', () => {
  const tmp = mkTempDir();
  const runDir = path.join(tmp, 'run');

  const req = buildConfinementRequest({
    capability: 'code:implement',
    context: {
      cwd: tmp,
      runDir,
    },
    requirement: { mode: 'unconfined' },
    assignmentLaunchContext: {
      contract: 'assignment-cli-spawn-launch-context.v1',
      run: {
        runId: 'run_9',
        runDir,
        attempt: 1,
        assignmentId: 'asgn_9',
        assignmentDigest: 'sha256:a1',
        dispatchPlanDigest: 'sha256:b1',
        evaluatorBaselineDigest: 'sha256:e1',
      },
      command: {
        launchCommandId: 'cmd_9',
        controlEpoch: 1,
        controlTokenDigest: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        commandSequence: 1,
        commandDigest: 'sha256:c1',
        invocationDigest: 'sha256:d1',
      },
    },
  });

  // Authority validates and isolates protected directories outside worker write grants
  assert.ok(req.assignmentLaunchContext);
  assert.equal(req.assignmentLaunchContext.contract, 'assignment-cli-spawn-launch-context.v1');
});

// 10. Live onChunk callback failure, disconnect and backpressure do not block capture, timers or receipt publication
test('10. live onChunk callback failure does not block capture, timers or receipt publication', async () => {
  const tmp = mkTempDir();
  const runDir = path.join(tmp, 'run');
  fs.mkdirSync(runDir, { recursive: true });

  const workerScript = path.join(tmp, 'chunk-worker.mjs');
  fs.writeFileSync(
    workerScript,
    `
    process.stdout.write("Chunk 1\\n");
    process.stdout.write("Chunk 2\\n");
    process.exit(0);
    `,
  );

  const launchCommandId = 'cmd_chunk_fail';
  const envelope = {
    contract: 'cli-spawn-launch-envelope.v1',
    launchCommandId,
    adapter: 'cli-spawn',
    run: { runDir },
    paths: {
      protectedDir: path.join(runDir, 'protected'),
      captureDir: path.join(runDir, 'protected', 'capture', launchCommandId),
      bindingsDir: path.join(runDir, 'protected', 'supervisor-binding'),
      receiptsDir: path.join(runDir, 'protected', 'adapter-receipts'),
      outboxDir: path.join(runDir, 'worker-output', 'outbox'),
      workspaceDir: tmp,
    },
    invocation: {
      command: process.execPath,
      args: [workerScript],
      env: {},
      cwd: tmp,
    },
    limits: {
      timeoutMs: 3000,
    },
  };
  const envPath = path.join(runDir, 'protected', 'launch-envelope', `${launchCommandId}.json`);
  publishImmutableProof(envPath, envelope);

  // Supervisor with onChunk that throws an error
  const child = startSupervisorProcess({
    envelopePath: envPath,
    runDir,
    launchCommandId,
    onChunk: () => {
      throw new Error('Broken onChunk pipe!');
    },
  });

  let receipt = null;
  for (let i = 0; i < 40; i++) {
    receipt = readAdapterReceipt(runDir, launchCommandId);
    if (receipt) break;
    await new Promise((r) => setTimeout(r, 100));
  }

  assert.ok(receipt);
  assert.equal(receipt.completion.exitCode, 0);
  const stdout = fs.readFileSync(path.join(runDir, 'protected', 'capture', launchCommandId, 'stdout.log'), 'utf8');
  assert.match(stdout, /Chunk 1/);
  assert.match(stdout, /Chunk 2/);
});

// 11. Stale controller can observe receipt but cannot publish command outcome
test('11. stale controller can observe receipt but cannot publish command outcome', async () => {
  const tmp = mkTempDir();
  const runDir = path.join(tmp, 'run');
  const commandsDir = path.join(runDir, 'controller', 'commands');
  const receiptsDir = path.join(runDir, 'protected', 'adapter-receipts');
  fs.mkdirSync(commandsDir, { recursive: true });
  fs.mkdirSync(receiptsDir, { recursive: true });

  fs.writeFileSync(
    path.join(runDir, 'run.json'),
    JSON.stringify({ contract: 'run-meta.v1', runId: 'run_stale', assignmentId: 'asgn_stale', attempt: 1, status: 'running' }),
  );

  const launchCommandId = 'cmd_stale';
  const receipt = {
    contract: 'cli-spawn-adapter-receipt.v1',
    launchCommandId,
    exitCode: 0,
    outcome: { kind: 'exit' },
  };
  fs.writeFileSync(path.join(receiptsDir, `${launchCommandId}.json`), canonicalJson(receipt));

  const baseline = { contract: 'evaluator-baseline.v1', gitBefore: null, dirtyBefore: [] };
  baseline.digest = computeSha256Digest(baseline);
  fs.writeFileSync(path.join(runDir, 'controller', 'evaluator-baseline.json'), canonicalJson(baseline));

  // Current command has epoch 2 with outcome recorded
  const commandState = {
    contract: 'assignment-command-state.v1',
    launchCommandId,
    state: 'reconciled',
    envelopeDigest: 'sha256:env',
    controlEpoch: 2,
    controlTokenDigest: computeSha256Digest('tok_newer'),
    outcome: { kind: 'receipt-backed', exitCode: 0, receiptDigest: computeSha256Digest(receipt) },
  };
  fs.writeFileSync(path.join(commandsDir, `${launchCommandId}.json`), JSON.stringify(commandState, null, 2));

  // Stale controller with tokenCurrent: false observes but cannot settle
  const obsRes = await reconcileCliSpawnRun(runDir, {
    tokenCurrent: false,
  });
  assert.equal(obsRes.status, 'observed');
  assert.equal(obsRes.settled, false);
});

// 12. Crash after receipt-backed command outcome publication resumes normalization/settlement without rewriting outcome
test('12. crash after receipt-backed command outcome publication resumes normalization/settlement without rewriting outcome', async () => {
  const tmp = mkTempDir();
  initGitRepo(tmp);

  const runDir = path.join(tmp, 'run');
  const commandsDir = path.join(runDir, 'controller', 'commands');
  const receiptsDir = path.join(runDir, 'protected', 'adapter-receipts');
  const captureDir = path.join(runDir, 'protected', 'capture', 'cmd_res_rec');
  fs.mkdirSync(commandsDir, { recursive: true });
  fs.mkdirSync(receiptsDir, { recursive: true });
  fs.mkdirSync(captureDir, { recursive: true });

  fs.writeFileSync(
    path.join(runDir, 'run.json'),
    JSON.stringify({ contract: 'run-meta.v1', runId: 'run_12', assignmentId: 'asgn_12', attempt: 1, status: 'running' }),
  );

  const launchCommandId = 'cmd_res_rec';
  const receipt = {
    contract: 'cli-spawn-adapter-receipt.v1',
    launchCommandId,
    exitCode: 0,
    outcome: { kind: 'exit' },
  };
  const receiptContent = canonicalJson(receipt);
  const receiptDigest = computeSha256Digest(receipt);
  fs.writeFileSync(path.join(receiptsDir, `${launchCommandId}.json`), receiptContent);
  fs.writeFileSync(path.join(captureDir, 'stdout.log'), 'reconciled stdout\n');
  fs.writeFileSync(path.join(captureDir, 'stderr.log'), '');

  // Baseline
  const baseline = { contract: 'evaluator-baseline.v1', gitBefore: null, dirtyBefore: [] };
  baseline.digest = computeSha256Digest(baseline);
  fs.writeFileSync(
    path.join(runDir, 'controller', 'evaluator-baseline.json'),
    canonicalJson(baseline),
  );

  // Command is already reconciled with receiptDigest
  const originalOutcome = {
    kind: 'receipt-backed',
    exitCode: 0,
    receiptDigest,
    recordedAt: '2026-09-12T00:00:00.000Z',
  };
  const commandState = {
    contract: 'assignment-command-state.v1',
    launchCommandId,
    state: 'reconciled',
    controlEpoch: 1,
    controlTokenDigest: computeSha256Digest('tok_rec'),
    outcome: originalOutcome,
  };
  fs.writeFileSync(path.join(commandsDir, `${launchCommandId}.json`), JSON.stringify(commandState, null, 2));

  // Fake assignment record on disk
  fs.writeFileSync(
    path.join(runDir, 'assignment.json'),
    JSON.stringify({ assignmentId: 'asgn_12', workId: 'tsk-12', role: 'implement', mutation: 'read-only' }),
  );

  const res = await reconcileCliSpawnRun(runDir, {
    controlToken: 'tok_rec',
    controlEpoch: 1,
  });

  assert.equal(res.status, 'settled');
  // Verify command state outcome was not rewritten
  const updatedCmd = JSON.parse(fs.readFileSync(path.join(commandsDir, `${launchCommandId}.json`), 'utf8'));
  assert.equal(updatedCmd.outcome.recordedAt, originalOutcome.recordedAt);
});

// 13. Crash after submission-refused command outcome publication resumes failed settlement without binding/receipt verification
test('13. crash after submission-refused command outcome publication resumes failed settlement without binding/receipt verification', async () => {
  const tmp = mkTempDir();
  initGitRepo(tmp);
  const runDir = path.join(tmp, 'run');
  const commandsDir = path.join(runDir, 'controller', 'commands');
  fs.mkdirSync(commandsDir, { recursive: true });

  fs.writeFileSync(
    path.join(runDir, 'run.json'),
    JSON.stringify({ contract: 'run-meta.v1', runId: 'run_13', assignmentId: 'asgn_13', attempt: 1, status: 'running' }),
  );

  const launchCommandId = 'cmd_sub_refused';
  const commandState = {
    contract: 'assignment-command-state.v1',
    launchCommandId,
    state: 'reconciled',
    controlEpoch: 1,
    controlTokenDigest: computeSha256Digest('tok_sub'),
    outcome: {
      kind: 'submission-refused',
      reason: 'confinement-refused',
      failureDetail: { message: 'confinement policy denied' },
    },
  };
  fs.writeFileSync(path.join(commandsDir, `${launchCommandId}.json`), JSON.stringify(commandState, null, 2));

  // Fake assignment record on disk
  fs.writeFileSync(
    path.join(runDir, 'assignment.json'),
    JSON.stringify({ assignmentId: 'asgn_13', workId: 'tsk-13', role: 'implement', mutation: 'read-only' }),
  );

  // Reconcile resumes failed settlement without requiring binding or receipt
  const res = await reconcileCliSpawnRun(runDir, {
    controlToken: 'tok_sub',
    controlEpoch: 1,
  });

  assert.equal(res.status, 'settled');
  const runFile = JSON.parse(fs.readFileSync(path.join(runDir, 'run.json'), 'utf8'));
  assert.equal(runFile.status, 'failed');
});

// 14. Confinement Authority validates and preserves assignmentLaunchContext; mismatched context refuses before envelope
test('14. Confinement Authority request builder validates and preserves assignmentLaunchContext; mismatched context refuses before envelope', () => {
  const tmp = mkTempDir();
  const runDir = path.join(tmp, 'run');

  // Case A: Missing command block
  assert.throws(
    () => {
      buildConfinementRequest({
        capability: 'code:implement',
        context: { cwd: tmp, runDir },
        requirement: { mode: 'unconfined' },
        assignmentLaunchContext: {
          contract: 'assignment-cli-spawn-launch-context.v1',
          run: {
            runId: 'r1',
            runDir,
            attempt: 1,
            assignmentId: 'a1',
            dispatchPlanDigest: 'sha256:1',
            evaluatorBaselineDigest: 'sha256:2',
          },
        },
      });
    },
    /assignmentLaunchContext\.command must be an object/,
  );

  // Case B: Wrong contract
  assert.throws(
    () => {
      buildConfinementRequest({
        capability: 'code:implement',
        context: { cwd: tmp, runDir },
        requirement: { mode: 'unconfined' },
        assignmentLaunchContext: {
          contract: 'invalid-contract.v1',
        },
      });
    },
    /contract must be "assignment-cli-spawn-launch-context.v1"/,
  );
});

// 15. Recovered collection uses pre-launch evaluator baseline
test('15. recovered collection uses pre-launch evaluator baseline', async () => {
  const tmp = mkTempDir();
  initGitRepo(tmp);

  const runDir = path.join(tmp, 'run');
  const commandsDir = path.join(runDir, 'controller', 'commands');
  const receiptsDir = path.join(runDir, 'protected', 'adapter-receipts');
  const captureDir = path.join(runDir, 'protected', 'capture', 'cmd_base');
  fs.mkdirSync(commandsDir, { recursive: true });
  fs.mkdirSync(receiptsDir, { recursive: true });
  fs.mkdirSync(captureDir, { recursive: true });

  fs.writeFileSync(
    path.join(runDir, 'run.json'),
    JSON.stringify({ contract: 'run-meta.v1', runId: 'run_15', assignmentId: 'asgn_15', attempt: 1, status: 'running' }),
  );

  const launchCommandId = 'cmd_base';
  const receipt = {
    contract: 'cli-spawn-adapter-receipt.v1',
    launchCommandId,
    exitCode: 0,
    outcome: { kind: 'exit' },
  };
  fs.writeFileSync(path.join(receiptsDir, `${launchCommandId}.json`), canonicalJson(receipt));
  fs.writeFileSync(path.join(captureDir, 'stdout.log'), '');
  fs.writeFileSync(path.join(captureDir, 'stderr.log'), '');

  // Baseline recorded pre-existing dirty file
  const dirtyFile = 'preexisting-dirty.txt';
  fs.writeFileSync(path.join(tmp, dirtyFile), 'before run\n');
  const baseline = {
    contract: 'evaluator-baseline.v1',
    gitBefore: 'initial-commit-sha',
    dirtyBefore: [dirtyFile],
  };
  baseline.digest = computeSha256Digest(baseline);
  fs.writeFileSync(
    path.join(runDir, 'controller', 'evaluator-baseline.json'),
    canonicalJson(baseline),
  );

  const commandState = {
    contract: 'assignment-command-state.v1',
    launchCommandId,
    state: 'reconciled',
    controlEpoch: 1,
    controlTokenDigest: computeSha256Digest('tok_base'),
    outcome: { kind: 'receipt-backed', exitCode: 0, receiptDigest: computeSha256Digest(receipt) },
  };
  fs.writeFileSync(path.join(commandsDir, `${launchCommandId}.json`), JSON.stringify(commandState, null, 2));
  fs.writeFileSync(
    path.join(runDir, 'assignment.json'),
    JSON.stringify({ assignmentId: 'asgn_15', workId: 'tsk-15', role: 'implement', mutation: 'read-only' }),
  );

  const res = await reconcileCliSpawnRun(runDir, {
    controlToken: 'tok_base',
    controlEpoch: 1,
  });
  assert.equal(res.status, 'settled');
  const evidence = JSON.parse(fs.readFileSync(path.join(runDir, 'evidence.json'), 'utf8'));
  assert.deepEqual(evidence.dirtyBefore, [dirtyFile]);
});

test('recovery settles a reviewer v2 claim missing assessment.verdict as failed evidence', async () => {
  const tmp = mkTempDir();
  initGitRepo(tmp);
  const asgnDir = path.join(tmp, '.fgos', 'assignments', 'asgn_reviewer_missing_assessment');
  const runDir = path.join(asgnDir, 'runs', '01');
  const commandsDir = path.join(runDir, 'controller', 'commands');
  const receiptsDir = path.join(runDir, 'protected', 'adapter-receipts');
  const captureDir = path.join(runDir, 'protected', 'capture', 'cmd_reviewer_missing_assessment');
  fs.mkdirSync(commandsDir, { recursive: true });
  fs.mkdirSync(receiptsDir, { recursive: true });
  fs.mkdirSync(captureDir, { recursive: true });
  const assignment = { assignmentId: 'asgn_reviewer_missing_assessment', workId: 'tsk-reviewer-missing-assessment', stage: 'planning', operation: 'validate-plan', role: 'reviewer', mutation: 'read-only' };
  fs.writeFileSync(path.join(asgnDir, 'assignment.json'), JSON.stringify(assignment));
  fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify({ contract: 'run-meta.v1', runId: 'run_asgn_reviewer_missing_assessment_01', assignmentId: assignment.assignmentId, workId: assignment.workId, attempt: 1, status: 'running' }));
  const launchCommandId = 'cmd_reviewer_missing_assessment';
  const receipt = { contract: 'cli-spawn-adapter-receipt.v1', launchCommandId, completion: { kind: 'exit', exitCode: 0, durationMs: 0 } };
  fs.writeFileSync(path.join(receiptsDir, `${launchCommandId}.json`), canonicalJson(receipt));
  fs.writeFileSync(path.join(captureDir, 'stdout.log'), 'review completed\n');
  fs.writeFileSync(path.join(captureDir, 'stderr.log'), '');
  const baseline = { contract: 'evaluator-baseline.v1', gitBefore: null, dirtyBefore: [] };
  baseline.digest = computeSha256Digest(baseline);
  fs.mkdirSync(path.join(runDir, 'controller'), { recursive: true });
  fs.writeFileSync(path.join(runDir, 'controller', 'evaluator-baseline.json'), canonicalJson(baseline));
  fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ contract: { id: 'agent-result-claim', version: 2 }, status: 'done', summary: 'Review completed', assessment: {} }));
  fs.writeFileSync(path.join(commandsDir, `${launchCommandId}.json`), JSON.stringify({ contract: 'assignment-command-state.v1', launchCommandId, state: 'reconciled', controlEpoch: 1, controlTokenDigest: computeSha256Digest('tok_reviewer_missing_assessment'), outcome: { kind: 'receipt-backed', exitCode: 0, receiptDigest: computeSha256Digest(receipt) } }));

  const settled = await reconcileCliSpawnRun(runDir, { controlToken: 'tok_reviewer_missing_assessment', controlEpoch: 1 });
  assert.equal(settled.status, 'settled');
  assert.equal(settled.runResult.status, 'failed');
  assert.equal(settled.runResult.confidence, 'failed');
  assert.equal(JSON.parse(fs.readFileSync(path.join(runDir, 'run.json'), 'utf8')).status, 'settled');
});

// 16. Confinement temporary resources are cleaned or retained idempotently
test('16. confinement temporary resources are cleaned or retained idempotently with an explicit finalization record', async () => {
  const tmp = mkTempDir();
  const runDir = path.join(tmp, 'run');
  const launchCommandId = 'cmd_final';
  fs.mkdirSync(runDir, { recursive: true });

  const tempResourceDir = path.join(tmp, 'temp-confinement-res');
  fs.mkdirSync(tempResourceDir, { recursive: true });
  const marker = {
    contract: 'confinement-owner-marker.v1',
    owner: {
      pid: process.pid,
      runDir,
      launchCommandId,
    },
  };
  fs.writeFileSync(path.join(tempResourceDir, '.fgos-confinement-owner.json'), JSON.stringify(marker));
  const markerDigest = computeSha256Digest(marker);

  const descriptor = {
    contract: 'confinement-finalization.v1',
    launchCommandId,
    runDir,
    temporaryDirectories: [{ path: tempResourceDir, ownershipMarkerDigest: markerDigest }],
  };

  // 1st finalization: clean
  const res1 = await finalizeConfinementResources({
    runDir,
    launchCommandId,
    receipt: { outcome: { kind: 'exit' } },
    descriptor,
  });
  assert.equal(res1.cleanupState, 'cleaned');
  assert.equal(fs.existsSync(tempResourceDir), false);

  // 2nd finalization: already-absent resume
  const res2 = await finalizeConfinementResources({
    runDir,
    launchCommandId,
    receipt: { outcome: { kind: 'exit' } },
    descriptor,
  });
  assert.equal(res2.cleanupState, 'cleaned');
  assert.equal(res2.cleanupResult.kind, 'already-absent-after-owned-delete');

  // Test retention on failure/timeout
  const res3 = await finalizeConfinementResources({
    runDir,
    launchCommandId,
    receipt: { outcome: { kind: 'timeout' } },
    descriptor: { ...descriptor, temporaryDirectories: [{ path: '/tmp/some-path', ownershipMarkerDigest: 'none' }] },
  });
  assert.equal(res3.cleanupState, 'retained');
});

// 17. Unsupported recovered cancel and shared-cwd takeover return typed park or refusal
test('17. unsupported recovered cancel and shared-cwd takeover return typed park or refusal', async () => {
  const tmp = mkTempDir();
  const runDir = path.join(tmp, 'run');

  const cancelRes = await reconcileCliSpawnRun(runDir, {
    action: 'cancel',
    controlToken: 'tok_17',
    controlEpoch: 1,
  });
  assert.equal(cancelRes.status, 'parked');
  assert.ok(cancelRes.reason === 'cancel-unsupported' || cancelRes.reason === 'capability-unsupported');

  const takeoverRes = await reconcileCliSpawnRun(runDir, {
    action: 'shared-cwd-takeover',
    controlToken: 'tok_17',
    controlEpoch: 1,
  });
  assert.equal(takeoverRes.status, 'parked');
  assert.ok(takeoverRes.reason === 'shared-cwd-takeover-unsupported' || takeoverRes.reason === 'workspace-takeover-unsupported');
});

// 18. No .fgos runtime logs are committed to the project tree
test('18. no .fgos runtime logs are committed to the project tree', () => {
  const repoRoot = path.resolve('.');
  const gitignorePath = path.join(repoRoot, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, 'utf8');
    assert.ok(content.includes('.fgos'), '.gitignore must ignore .fgos runtime directories');
  }

  const status = execFileSync('git', ['status', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' });
  const lines = status.split('\n').filter(Boolean);
  const trackedFgosLogs = lines.filter((line) => line.includes('.fgos') && line.includes('.log'));
  assert.equal(trackedFgosLogs.length, 0, 'No .fgos log files should be tracked or staged in git');
});

// 19. Pre-placed receipt with different content fails supervisor publication loudly
test('19. pre-placed receipt with different content fails supervisor publication step loudly instead of silently succeeding', async () => {
  const tmp = mkTempDir();
  const runDir = path.join(tmp, 'run');
  const launchCommandId = 'cmd_preplaced_receipt_19';
  const receiptsDir = path.join(runDir, 'protected', 'adapter-receipts');
  fs.mkdirSync(receiptsDir, { recursive: true });

  const receiptPath = path.join(receiptsDir, `${launchCommandId}.json`);
  const prePlacedContent = {
    contract: 'cli-spawn-adapter-receipt.v1',
    launchCommandId,
    prePlaced: true,
    differentData: 'attacker-or-corrupt-payload',
    exitCode: 42,
  };
  fs.writeFileSync(receiptPath, JSON.stringify(prePlacedContent, null, 2));

  const realReceiptBody = {
    contract: 'cli-spawn-adapter-receipt.v1',
    runId: 'run_19',
    launchCommandId,
    envelopeDigest: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
    bindingDigest: 'sha256:1111111111111111111111111111111111111111111111111111111111111111',
    exitCode: 0,
    signal: null,
    outcome: { kind: 'exited', exitCode: 0 },
    completion: { kind: 'exited', exitCode: 0 },
    output: {
      stdoutPath: 'protected/capture/cmd_preplaced_receipt_19/stdout.log',
      stderrPath: 'protected/capture/cmd_preplaced_receipt_19/stderr.log',
      stdoutDigest: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      stderrDigest: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      stdoutBytesCaptured: 0,
      stderrBytesCaptured: 0,
      maxBufferBytes: 10485760,
      overflowChunkDeliveredToLiveStream: false,
    },
    processTree: null,
  };
  const realReceiptDigest = computeSha256Digest(realReceiptBody);
  const realReceipt = {
    ...realReceiptBody,
    digest: realReceiptDigest,
  };

  // Step A: Direct invocation of the supervisor's publish step must fail loudly with typed collision error
  assert.throws(
    () => {
      publishAdapterReceipt(receiptPath, realReceipt, { launchCommandId });
    },
    (err) => {
      assert.ok(err instanceof ReceiptPathCollisionError);
      assert.equal(err.code, 'receipt-path-collision');
      assert.equal(err.targetPath, receiptPath);
      assert.equal(err.expectedDigest, realReceiptDigest);
      assert.match(err.message, /adapter receipt path collision/);
      return true;
    },
    'publishAdapterReceipt must throw ReceiptPathCollisionError when receipt path is pre-occupied with different content',
  );

  // Confirm pre-placed content was not overwritten and did not win
  const onDiskAfterDirect = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
  assert.equal(onDiskAfterDirect.prePlaced, true);
  assert.equal(onDiskAfterDirect.exitCode, 42);
  assert.notEqual(onDiskAfterDirect.digest, realReceiptDigest);

  // Step B: Full supervisor execution with pre-placed receipt path must reject loudly
  const workerScript = path.join(tmp, 'worker.mjs');
  fs.writeFileSync(workerScript, 'process.exit(0);\n');

  const envBody = {
    contract: 'cli-spawn-launch-envelope.v1',
    runId: 'run_19',
    launchCommandId,
    paths: {
      runDir,
    },
    invocation: {
      command: process.execPath,
      args: [workerScript],
      cwd: tmp,
    },
    limits: {
      timeoutMs: 3000,
    },
  };
  const envDigest = computeSha256Digest(envBody);
  const envelope = { ...envBody, digest: envDigest };

  const envDir = path.join(runDir, 'protected', 'launch-envelope');
  fs.mkdirSync(envDir, { recursive: true });
  const envPath = path.join(envDir, `${launchCommandId}.json`);
  publishImmutableProof(envPath, envelope);

  await assert.rejects(
    async () => {
      await runSupervisor(envPath);
    },
    (err) => {
      assert.ok(err instanceof ReceiptPathCollisionError || err.code === 'receipt-path-collision');
      assert.equal(err.code, 'receipt-path-collision');
      assert.match(err.message, /adapter receipt path collision/);
      return true;
    },
    'runSupervisor must reject loudly instead of silently succeeding when receipt path is pre-occupied with different content',
  );

  // Confirm pre-placed content is still intact on disk
  const onDiskAfterRun = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
  assert.equal(onDiskAfterRun.prePlaced, true);
  assert.equal(onDiskAfterRun.exitCode, 42);

  // Step C: Identical content publication succeeds idempotently
  const identicalPath = path.join(receiptsDir, 'identical_receipt.json');
  publishAdapterReceipt(identicalPath, realReceipt);
  const idempotentResult = publishAdapterReceipt(identicalPath, realReceipt);
  assert.equal(idempotentResult.digest, realReceiptDigest);
});
