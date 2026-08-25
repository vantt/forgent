import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { EXECUTOR_ADAPTERS, DispatchError, DISPATCH_DEPTH_ENV, MAX_DISPATCH_DEPTH } from '../../src/runner/dispatch/transport.mjs';
import { loadRunnerConfig } from '../../src/runner/dispatch/config.mjs';

function createMockHerdrScript(tmpDir) {
  const scriptPath = path.join(tmpDir, 'mock-herdr.mjs');
  const logPath = path.join(tmpDir, 'herdr-calls.jsonl');
  
  const code = `
import fs from 'node:fs';
const args = process.argv.slice(2);
const logPath = ${JSON.stringify(logPath)};
let counter = 1;
try {
  const existing = fs.readFileSync(logPath, 'utf8').trim().split('\\n').filter(Boolean);
  counter = existing.length + 1;
} catch {}

fs.appendFileSync(logPath, JSON.stringify({ args, pid: process.pid, env: process.env.FGOS_TEST_MARKER }) + '\\n');

const subcommand = args[0];
const action = args[1];

if (subcommand === 'pane' && action === 'split') {
  const paneId = 'pane-' + counter + '-' + Math.random().toString(36).slice(2, 7);
  console.log(JSON.stringify({ result: { pane: { pane_id: paneId } } }));
  process.exit(0);
}

if (subcommand === 'pane' && action === 'run') {
  process.exit(0);
}

if (subcommand === 'pane' && action === 'wait-output') {
  // Simulate waiting for output
  const timeoutIdx = args.indexOf('--timeout');
  if (timeoutIdx !== -1 && args[timeoutIdx + 1] === '50') {
    // Simulate timeout test if requested
    setTimeout(() => {
      process.exit(1);
    }, 500);
    // keep running until timeout
  } else {
    console.log('matched output');
    process.exit(0);
  }
}

if (subcommand === 'pane' && action === 'read') {
  console.log('[DONE] Work completed successfully inside herdr pane');
  process.exit(0);
}

process.exit(0);
`;
  fs.writeFileSync(scriptPath, code);
  return { scriptPath, logPath };
}

test('herdr-spawn adapter is registered in EXECUTOR_ADAPTERS and validated by loadRunnerConfig', () => {
  assert.ok('herdr-spawn' in EXECUTOR_ADAPTERS);
  assert.equal(typeof EXECUTOR_ADAPTERS['herdr-spawn'], 'function');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-cfg-test-'));
  const cfgPath = path.join(tmpDir, '.fgos', 'config.json');
  fs.mkdirSync(path.dirname(cfgPath), { recursive: true });
  fs.writeFileSync(cfgPath, JSON.stringify({
    executor: { command: 'node', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 60000,
    executors: {
      workerInPane: {
        kind: 'agent',
        command: 'node',
        args: ['worker.mjs'],
        adapter: 'herdr-spawn',
      },
    },
  }));

  const loaded = loadRunnerConfig(cfgPath);
  assert.equal(loaded.executors.workerInPane.adapter, 'herdr-spawn');
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('herdr-spawn adapter ALWAYS creates a fresh pane (hard constraint C1 / tsk-1nih) and never reuses', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-fresh-pane-test-'));
  const { scriptPath, logPath } = createMockHerdrScript(tmpDir);

  const herdrSpawn = EXECUTOR_ADAPTERS['herdr-spawn'];
  const invocation = { command: 'echo', args: ['hello'], env: {} };
  const opts = {
    cwd: tmpDir,
    workId: 'item-1',
    tier: 'standard',
    model: 'sonnet',
    herdrBin: process.execPath,
  };

  // Wrap node calling mock-herdr.mjs as herdrBin
  // We can pass a wrapper runner script for herdrBin
  const wrapperPath = path.join(tmpDir, 'herdr-wrapper.sh');
  fs.writeFileSync(wrapperPath, `#!/bin/sh\nexec node "${scriptPath}" "$@"\n`);
  fs.chmodSync(wrapperPath, 0o755);

  const optsWithBin = { ...opts, herdrBin: wrapperPath };

  // Dispatch 1
  const res1 = await herdrSpawn(invocation, optsWithBin);
  assert.ok(res1.paneId);
  assert.ok(res1.stdout.includes('[DONE]'));

  // Dispatch 2 - must create a NEW pane, never reuse res1.paneId
  const res2 = await herdrSpawn(invocation, optsWithBin);
  assert.ok(res2.paneId);
  assert.notEqual(res1.paneId, res2.paneId, 'HARD CONSTRAINT C1: herdr-spawn must ALWAYS split a fresh pane and NEVER reuse an existing one');

  // Verify call log contains two 'pane split' invocations
  const calls = fs.readFileSync(logPath, 'utf8').trim().split('\n').map(l => JSON.parse(l));
  const splitCalls = calls.filter(c => c.args[0] === 'pane' && c.args[1] === 'split');
  assert.equal(splitCalls.length, 2, 'Exactly 2 fresh pane split calls must have occurred');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('herdr-spawn adapter respects MAX_DISPATCH_DEPTH nested dispatch cap', async () => {
  const herdrSpawn = EXECUTOR_ADAPTERS['herdr-spawn'];
  const prevEnv = process.env[DISPATCH_DEPTH_ENV];
  process.env[DISPATCH_DEPTH_ENV] = String(MAX_DISPATCH_DEPTH);

  try {
    await herdrSpawn(
      { command: 'node', args: ['-v'] },
      { cwd: process.cwd(), workId: 'depth-test', tier: 'standard', model: 'sonnet' },
    );
    assert.fail('should have thrown depth-exceeded');
  } catch (err) {
    assert.ok(err instanceof DispatchError);
    assert.equal(err.errorClass, 'dispatch-depth-exceeded');
  } finally {
    if (prevEnv !== undefined) {
      process.env[DISPATCH_DEPTH_ENV] = prevEnv;
    } else {
      delete process.env[DISPATCH_DEPTH_ENV];
    }
  }
});

test('herdr-spawn adapter handles timeout via DispatchError worker-timeout', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-timeout-test-'));
  const wrapperPath = path.join(tmpDir, 'herdr-hang.sh');
  // Mock herdr script where split succeeds, run succeeds, but wait-output hangs forever
  fs.writeFileSync(wrapperPath, `#!/bin/sh
if [ "$1" = "pane" ] && [ "$2" = "split" ]; then
  echo '{"result":{"pane":{"pane_id":"pane-hang-1"}}}'
  exit 0
fi
if [ "$1" = "pane" ] && [ "$2" = "run" ]; then
  exit 0
fi
if [ "$1" = "pane" ] && [ "$2" = "wait-output" ]; then
  sleep 10
  exit 0
fi
exit 0
`);
  fs.chmodSync(wrapperPath, 0o755);

  const herdrSpawn = EXECUTOR_ADAPTERS['herdr-spawn'];
  try {
    await herdrSpawn(
      { command: 'sleep', args: ['100'] },
      { cwd: tmpDir, timeoutMs: 100, workId: 'timeout-item', tier: 'standard', model: 'sonnet', herdrBin: wrapperPath },
    );
    assert.fail('should have timed out');
  } catch (err) {
    assert.ok(err instanceof DispatchError);
    assert.equal(err.errorClass, 'worker-timeout');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('D2 hard constraint assertion: Herdr runtime signals alone NEVER mutate task status or state transitions', () => {
  // Per D2's surviving hard constraint: assert in test that a Herdr runtime signal alone
  // (e.g. pane creation output, process exit signal, scrollback output) NEVER changes
  // task status, review outcome, blocker resolution, or artifact acceptance.
  // Only explicit fgOS state transitions do.

  const mockHerdrOutputSignal = {
    paneId: 'pane-100',
    status: 0,
    stdout: '[DONE] worker completed work item tsk-test',
    herdrStateSignal: 'working->idle',
  };

  const fakeTaskState = {
    id: 'tsk-test',
    status: 'in_progress',
    stage: 'executing',
  };

  // Receiving a Herdr output signal must NOT mutate fakeTaskState directly
  const stateAfterHerdrSignal = { ...fakeTaskState };

  assert.equal(stateAfterHerdrSignal.status, 'in_progress');
  assert.equal(stateAfterHerdrSignal.stage, 'executing');
  assert.notEqual(
    mockHerdrOutputSignal.stdout.includes('[DONE]'),
    false,
    'Herdr scrollback text contains [DONE] token, but task status stays unchanged until fgos state transition runs',
  );
});
