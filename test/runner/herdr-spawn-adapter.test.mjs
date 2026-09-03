import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { EXECUTOR_ADAPTERS, DispatchError } from '../../src/runner/dispatch/transport.mjs';
import { loadRunnerConfig } from '../../src/runner/dispatch/config.mjs';
import { executeExecutorCli } from '../../src/runner/dispatch/cli.mjs';
import { findExecutableOnPath } from '../../src/state/tool-registry.mjs';

function writeRunnerConfigFixture(root, cfg) {
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(root, '.fgos', 'config.json'), JSON.stringify({ runner: cfg }, null, 2));
}

const HERDR_BIN = findExecutableOnPath(['herdr']);
const AGY_BIN = findExecutableOnPath(['agy']);
const AGY_HERDR_SKIP =
  process.env.FGOS_RUN_LIVE_AGY_HERDR === '1' && HERDR_BIN && AGY_BIN
    ? false
    : 'set FGOS_RUN_LIVE_AGY_HERDR=1 with herdr and agy on PATH to run the live agy-herdr proof';

test('herdr-spawn adapter rejects invocation missing interactiveMode', async () => {
  const herdrSpawn = EXECUTOR_ADAPTERS['herdr-spawn'];
  await assert.rejects(
    () => herdrSpawn(
      { command: 'node', args: ['-v'], env: {} },
      { cwd: process.cwd(), workId: 'missing-interactive-item', tier: 'standard', model: 'sonnet' },
    ),
    (err) => {
      assert.ok(err instanceof DispatchError);
      assert.equal(err.errorClass, 'invalid-config');
      assert.match(err.message, /requires interactiveMode/);
      return true;
    },
  );
});

function createInteractiveMockHerdrScript(tmpDir) {
  const scriptPath = path.join(tmpDir, 'interactive-mock-herdr.mjs');
  const outputsDir = path.join(tmpDir, 'pane-outputs');
  const code = `
import fs from 'node:fs';
import path from 'node:path';
const outputsDir = ${JSON.stringify(outputsDir)};
fs.mkdirSync(outputsDir, { recursive: true });
const args = process.argv.slice(2);
const subcommand = args[0];
const action = args[1];

if (subcommand === 'pane' && action === 'split') {
  if (!args.includes('--direction')) {
    process.stderr.write('usage: herdr pane split ... --direction right|down ...\\n');
    process.exit(2);
  }
  const paneId = 'pane-interactive-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  fs.writeFileSync(path.join(outputsDir, paneId + '.txt'), '');
  fs.writeFileSync(path.join(outputsDir, paneId + '-polls.txt'), '0');
  console.log(JSON.stringify({ result: { pane: { pane_id: paneId } } }));
  process.exit(0);
}

if (subcommand === 'pane' && action === 'run') {
  const paneId = args[2];
  const cmd = args[3];
  const outFile = path.join(outputsDir, paneId + '.txt');
  fs.appendFileSync(outFile, cmd + '\\n');
  fs.appendFileSync(outFile, '➜  /tmp ' + cmd + '\\n');
  if (cmd.startsWith("'agy'") || cmd.startsWith("agy")) {
    fs.appendFileSync(outFile, 'Interactive agy output: Hello interactive mode!\\n');
  } else if (cmd.includes('__fgos_herdr_exit_')) {
    const sentinelMatch = cmd.match(/__fgos_herdr_exit_[^:]+/);
    if (sentinelMatch) {
      fs.appendFileSync(outFile, sentinelMatch[0] + ':0\\n');
    }
  }
  process.exit(0);
}

if (subcommand === 'pane' && action === 'get') {
  const paneId = args[2];
  const pollsFile = path.join(outputsDir, paneId + '-polls.txt');
  let count = 0;
  try { count = parseInt(fs.readFileSync(pollsFile, 'utf8'), 10) || 0; } catch {}
  fs.writeFileSync(pollsFile, String(count + 1));
  const status = count >= 2 ? 'idle' : 'working';
  console.log(JSON.stringify({ result: { pane: { pane_id: paneId, agent_status: status } } }));
  process.exit(0);
}

if (subcommand === 'pane' && action === 'wait-output') {
  const paneId = args[2];
  const regexIdx = args.indexOf('--regex');
  const rawPattern = args[regexIdx + 1];
  const re = new RegExp(rawPattern.replace(/\\(\\?m\\)/g, ''), 'm');
  const outFile = path.join(outputsDir, paneId + '.txt');
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const content = fs.existsSync(outFile) ? fs.readFileSync(outFile, 'utf8') : '';
    const match = re.exec(content);
    if (match) {
      console.log(JSON.stringify({ result: { matched_line: match[0], read: { text: content } } }));
      process.exit(0);
    }
  }
  console.log(JSON.stringify({ error: { code: 'timeout', message: 'timed out waiting for output match' } }));
  process.exit(1);
}

process.exit(0);
`;
  fs.writeFileSync(scriptPath, code);
  return { scriptPath, outputsDir };
}

test('herdr-spawn adapter validates interactiveMode config shape', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-interactive-cfg-test-'));
  const cfgPath = path.join(tmpDir, '.fgos', 'config.json');
  fs.mkdirSync(path.dirname(cfgPath), { recursive: true });
  fs.writeFileSync(cfgPath, JSON.stringify({
    executor: { command: 'node', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 60000,
    executors: {
      agyHerdr: {
        kind: 'agent',
        command: 'agy',
        args: ['-i', '{prompt}'],
        adapter: 'herdr-spawn',
        interactiveMode: { exitCommand: '/exit' },
      },
    },
  }));

  const loaded = loadRunnerConfig(cfgPath);
  assert.equal(loaded.executors.agyHerdr.interactiveMode.exitCommand, '/exit');

  // Test invalid interactiveMode shape throws RunnerConfigError
  fs.writeFileSync(cfgPath, JSON.stringify({
    executor: { command: 'node', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 60000,
    executors: {
      invalidAgy: {
        kind: 'agent',
        command: 'agy',
        args: ['-i', '{prompt}'],
        adapter: 'herdr-spawn',
        interactiveMode: { exitCommand: '' },
      },
    },
  }));

  assert.throws(() => loadRunnerConfig(cfgPath), /exitCommand/);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('herdr-spawn adapter interactiveMode execution: polls agent_status until idle, sends exitCommand, parses sentinel, strips double echo', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-interactive-exec-test-'));
  const { scriptPath } = createInteractiveMockHerdrScript(tmpDir);
  const wrapperPath = path.join(tmpDir, 'herdr-wrapper.sh');
  fs.writeFileSync(wrapperPath, `#!/bin/sh\nexec node "${scriptPath}" "$@"\n`);
  fs.chmodSync(wrapperPath, 0o755);

  const herdrSpawn = EXECUTOR_ADAPTERS['herdr-spawn'];
  const res = await herdrSpawn(
    {
      command: 'agy',
      args: ['-i', 'hello from prompt'],
      env: {},
      interactiveMode: { exitCommand: '/exit' },
    },
    { cwd: tmpDir, timeoutMs: 5000, workId: 'interactive-item', tier: 'standard', model: 'sonnet', herdrBin: wrapperPath },
  );

  assert.ok(res.paneId);
  assert.equal(res.status, 0);
  assert.ok(res.stdout.includes('Hello interactive mode!'));
  assert.ok(!res.stdout.includes('/exit'));
  assert.ok(!res.stdout.includes('__fgos_herdr_exit_'));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('herdr-spawn adapter interactiveMode handles timeout when agent_status stays working', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-interactive-timeout-test-'));
  const wrapperPath = path.join(tmpDir, 'herdr-wrapper.sh');
  fs.writeFileSync(wrapperPath, `#!/bin/sh
if [ "$1" = "pane" ] && [ "$2" = "split" ]; then
  echo '{"result":{"pane":{"pane_id":"pane-interactive-hang"}}}'
  exit 0
fi
if [ "$1" = "pane" ] && [ "$2" = "run" ]; then
  exit 0
fi
if [ "$1" = "pane" ] && [ "$2" = "get" ]; then
  echo '{"result":{"pane":{"agent_status":"working"}}}'
  exit 0
fi
exit 0
`);
  fs.chmodSync(wrapperPath, 0o755);

  const herdrSpawn = EXECUTOR_ADAPTERS['herdr-spawn'];
  try {
    await herdrSpawn(
      {
        command: 'agy',
        args: ['-i', 'hanging prompt'],
        env: {},
        interactiveMode: { exitCommand: '/exit' },
      },
      { cwd: tmpDir, timeoutMs: 100, workId: 'interactive-timeout-item', tier: 'standard', model: 'sonnet', herdrBin: wrapperPath },
    );
    assert.fail('should have timed out');
  } catch (err) {
    assert.ok(err instanceof DispatchError);
    assert.equal(err.errorClass, 'worker-timeout');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('herdr-spawn adapter interactiveMode ignores premature idle signal until working is observed at least once (tsk-2rr)', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-false-idle-mock-test-'));
  const scriptPath = path.join(tmpDir, 'false-idle-mock-herdr.mjs');
  const outputsDir = path.join(tmpDir, 'pane-outputs');
  fs.mkdirSync(outputsDir, { recursive: true });

  // A mock herdr whose pane get returns:
  // Poll 0: 'idle' (false-idle reading!)
  // Poll 1: 'working'
  // Poll 2: 'idle' (real completion)
  const code = `
import fs from 'node:fs';
import path from 'node:path';
const outputsDir = ${JSON.stringify(outputsDir)};
const args = process.argv.slice(2);
const subcommand = args[0];
const action = args[1];

if (subcommand === 'pane' && action === 'split') {
  const paneId = 'pane-false-idle-' + Date.now();
  fs.writeFileSync(path.join(outputsDir, paneId + '.txt'), '');
  fs.writeFileSync(path.join(outputsDir, paneId + '-polls.txt'), '0');
  fs.writeFileSync(path.join(outputsDir, paneId + '-exit-sent.txt'), 'false');
  console.log(JSON.stringify({ result: { pane: { pane_id: paneId } } }));
  process.exit(0);
}

if (subcommand === 'pane' && action === 'run') {
  const paneId = args[2];
  const cmd = args[3];
  const outFile = path.join(outputsDir, paneId + '.txt');
  fs.appendFileSync(outFile, cmd + '\\n');
  if (cmd.includes('__fgos_herdr_exit_')) {
    fs.writeFileSync(path.join(outputsDir, paneId + '-exit-sent.txt'), 'true');
    const sentinelMatch = cmd.match(/__fgos_herdr_exit_[^:]+/);
    if (sentinelMatch) {
      fs.appendFileSync(outFile, sentinelMatch[0] + ':0\\n');
    }
  }
  process.exit(0);
}

if (subcommand === 'pane' && action === 'get') {
  const paneId = args[2];
  const pollsFile = path.join(outputsDir, paneId + '-polls.txt');
  let count = 0;
  try { count = parseInt(fs.readFileSync(pollsFile, 'utf8'), 10) || 0; } catch {}
  fs.writeFileSync(pollsFile, String(count + 1));

  let status = 'unknown';
  if (count === 0) {
    status = 'idle'; // False idle!
  } else if (count === 1) {
    status = 'working';
  } else {
    status = 'idle'; // Real completion after working
  }
  console.log(JSON.stringify({ result: { pane: { pane_id: paneId, agent_status: status } } }));
  process.exit(0);
}

if (subcommand === 'pane' && action === 'wait-output') {
  const paneId = args[2];
  const regexIdx = args.indexOf('--regex');
  const rawPattern = args[regexIdx + 1];
  const re = new RegExp(rawPattern.replace(/\\(\\?m\\)/g, ''), 'm');
  const outFile = path.join(outputsDir, paneId + '.txt');
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const content = fs.existsSync(outFile) ? fs.readFileSync(outFile, 'utf8') : '';
    const match = re.exec(content);
    if (match) {
      console.log(JSON.stringify({ result: { matched_line: match[0], read: { text: content } } }));
      process.exit(0);
    }
  }
  process.exit(1);
}

process.exit(0);
`;
  fs.writeFileSync(scriptPath, code);
  const wrapperPath = path.join(tmpDir, 'herdr-wrapper.sh');
  fs.writeFileSync(wrapperPath, `#!/bin/sh\nexec node "${scriptPath}" "$@"\n`);
  fs.chmodSync(wrapperPath, 0o755);

  const herdrSpawn = EXECUTOR_ADAPTERS['herdr-spawn'];
  const res = await herdrSpawn(
    {
      command: 'agy',
      args: ['-i', 'prompt test'],
      env: {},
      interactiveMode: { exitCommand: '/exit' },
    },
    { cwd: tmpDir, timeoutMs: 5000, workId: 'false-idle-item', tier: 'standard', model: 'sonnet', herdrBin: wrapperPath },
  );

  assert.equal(res.status, 0);
  // Poll 0 (premature idle, ignored) + poll 1 (working) + polls 2-4 (3
  // consecutive idle to satisfy the debounce) = 5 polls minimum.
  const pollFiles = fs.readdirSync(outputsDir).filter((f) => f.endsWith('-polls.txt'));
  assert.equal(pollFiles.length, 1);
  const totalPolls = parseInt(fs.readFileSync(path.join(outputsDir, pollFiles[0]), 'utf8'), 10);
  assert.ok(totalPolls >= 5, `expected at least 5 polls (0: premature idle, 1: working, 2-4: 3 consecutive real idle), got ${totalPolls}`);

  // Verify exit command was sent
  const exitFiles = fs.readdirSync(outputsDir).filter((f) => f.endsWith('-exit-sent.txt'));
  assert.equal(exitFiles.length, 1);
  const exitSent = fs.readFileSync(path.join(outputsDir, exitFiles[0]), 'utf8');
  assert.equal(exitSent, 'true');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('herdr-spawn adapter interactiveMode debounce: a mid-turn dip back to working resets the terminal-poll counter, only a full 3-in-a-row run completes (review finding, tsk-2rr)', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-debounce-mock-test-'));
  const scriptPath = path.join(tmpDir, 'debounce-mock-herdr.mjs');
  const outputsDir = path.join(tmpDir, 'pane-outputs');
  fs.mkdirSync(outputsDir, { recursive: true });

  // Deterministic sequence (0-indexed polls):
  // 0: working -- sawWorking becomes true
  // 1: idle    -- consecutive count 1
  // 2: idle    -- consecutive count 2 (NOT enough -- must NOT exit here)
  // 3: working -- a mid-turn dip back to working, resets the counter to 0
  // 4: idle    -- consecutive count 1 (fresh run)
  // 5: idle    -- consecutive count 2
  // 6: idle    -- consecutive count 3 -- NOW it completes
  const sequence = ['working', 'idle', 'idle', 'working', 'idle', 'idle', 'idle'];
  const code = `
import fs from 'node:fs';
import path from 'node:path';
const outputsDir = ${JSON.stringify(outputsDir)};
const sequence = ${JSON.stringify(sequence)};
const args = process.argv.slice(2);
const subcommand = args[0];
const action = args[1];

if (subcommand === 'pane' && action === 'split') {
  const paneId = 'pane-debounce-' + Date.now();
  fs.writeFileSync(path.join(outputsDir, paneId + '.txt'), '');
  fs.writeFileSync(path.join(outputsDir, paneId + '-polls.txt'), '0');
  fs.writeFileSync(path.join(outputsDir, paneId + '-exit-sent.txt'), 'false');
  console.log(JSON.stringify({ result: { pane: { pane_id: paneId } } }));
  process.exit(0);
}

if (subcommand === 'pane' && action === 'run') {
  const paneId = args[2];
  const cmd = args[3];
  const outFile = path.join(outputsDir, paneId + '.txt');
  fs.appendFileSync(outFile, cmd + '\\n');
  if (cmd.includes('__fgos_herdr_exit_')) {
    const pollsFile = path.join(outputsDir, paneId + '-polls.txt');
    const pollsAtExit = fs.readFileSync(pollsFile, 'utf8');
    fs.writeFileSync(path.join(outputsDir, paneId + '-polls-at-exit.txt'), pollsAtExit);
    fs.writeFileSync(path.join(outputsDir, paneId + '-exit-sent.txt'), 'true');
    const sentinelMatch = cmd.match(/__fgos_herdr_exit_[^:]+/);
    if (sentinelMatch) {
      fs.appendFileSync(outFile, sentinelMatch[0] + ':0\\n');
    }
  }
  process.exit(0);
}

if (subcommand === 'pane' && action === 'get') {
  const paneId = args[2];
  const pollsFile = path.join(outputsDir, paneId + '-polls.txt');
  let count = 0;
  try { count = parseInt(fs.readFileSync(pollsFile, 'utf8'), 10) || 0; } catch {}
  fs.writeFileSync(pollsFile, String(count + 1));

  const status = count < sequence.length ? sequence[count] : sequence[sequence.length - 1];
  console.log(JSON.stringify({ result: { pane: { pane_id: paneId, agent_status: status } } }));
  process.exit(0);
}

if (subcommand === 'pane' && action === 'wait-output') {
  const paneId = args[2];
  const regexIdx = args.indexOf('--regex');
  const rawPattern = args[regexIdx + 1];
  const re = new RegExp(rawPattern.replace(/\\(\\?m\\)/g, ''), 'm');
  const outFile = path.join(outputsDir, paneId + '.txt');
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const content = fs.existsSync(outFile) ? fs.readFileSync(outFile, 'utf8') : '';
    const match = re.exec(content);
    if (match) {
      console.log(JSON.stringify({ result: { matched_line: match[0], read: { text: content } } }));
      process.exit(0);
    }
  }
  process.exit(1);
}

process.exit(0);
`;
  fs.writeFileSync(scriptPath, code);
  const wrapperPath = path.join(tmpDir, 'herdr-wrapper.sh');
  fs.writeFileSync(wrapperPath, `#!/bin/sh\nexec node "${scriptPath}" "$@"\n`);
  fs.chmodSync(wrapperPath, 0o755);

  const herdrSpawn = EXECUTOR_ADAPTERS['herdr-spawn'];
  const res = await herdrSpawn(
    {
      command: 'agy',
      args: ['-i', 'prompt test'],
      env: {},
      interactiveMode: { exitCommand: '/exit' },
    },
    { cwd: tmpDir, timeoutMs: 6000, workId: 'debounce-item', tier: 'standard', model: 'sonnet', herdrBin: wrapperPath },
  );

  assert.equal(res.status, 0);

  const pollFiles = fs.readdirSync(outputsDir).filter((f) => f.endsWith('-polls.txt') && !f.includes('-at-exit'));
  assert.equal(pollFiles.length, 1);
  const totalPolls = parseInt(fs.readFileSync(path.join(outputsDir, pollFiles[0]), 'utf8'), 10);
  // Must NOT have completed at poll 3 (the first idle,idle pair, 2-in-a-row)
  // -- proves the debounce actually requires 3 in a row, not merely "some
  // idle reading was seen after working" (the exact gap a weaker assertion
  // that only checks totalPolls >= 3 would miss, review finding).
  assert.ok(
    totalPolls >= 7,
    `expected at least 7 polls (the mid-turn dip back to "working" at poll 3 must reset the debounce, requiring a fresh 3-in-a-row run), got ${totalPolls}`,
  );

  const exitFiles = fs.readdirSync(outputsDir).filter((f) => f.endsWith('-exit-sent.txt'));
  assert.equal(exitFiles.length, 1);
  assert.equal(fs.readFileSync(path.join(outputsDir, exitFiles[0]), 'utf8'), 'true');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('herdr-spawn adapter interactiveMode: a "done" completion never passing through "working" still completes, not gated on sawWorking (review finding, tsk-2rr)', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-done-no-working-mock-test-'));
  const scriptPath = path.join(tmpDir, 'done-no-working-mock-herdr.mjs');
  const outputsDir = path.join(tmpDir, 'pane-outputs');
  fs.mkdirSync(outputsDir, { recursive: true });

  // "working" never appears at all -- an ultra-fast response that goes
  // straight from "unknown" to a stable "done", the scenario tsk-10j's own
  // bug #2 fix was written for. If "done" were gated on sawWorking (the
  // same way "idle" correctly is), this would never complete and would hit
  // the adapter's own timeout instead.
  const sequence = ['unknown', 'unknown', 'done', 'done', 'done'];
  const code = `
import fs from 'node:fs';
import path from 'node:path';
const outputsDir = ${JSON.stringify(outputsDir)};
const sequence = ${JSON.stringify(sequence)};
const args = process.argv.slice(2);
const subcommand = args[0];
const action = args[1];

if (subcommand === 'pane' && action === 'split') {
  const paneId = 'pane-done-' + Date.now();
  fs.writeFileSync(path.join(outputsDir, paneId + '.txt'), '');
  fs.writeFileSync(path.join(outputsDir, paneId + '-polls.txt'), '0');
  fs.writeFileSync(path.join(outputsDir, paneId + '-exit-sent.txt'), 'false');
  console.log(JSON.stringify({ result: { pane: { pane_id: paneId } } }));
  process.exit(0);
}

if (subcommand === 'pane' && action === 'run') {
  const paneId = args[2];
  const cmd = args[3];
  const outFile = path.join(outputsDir, paneId + '.txt');
  fs.appendFileSync(outFile, cmd + '\\n');
  if (cmd.includes('__fgos_herdr_exit_')) {
    fs.writeFileSync(path.join(outputsDir, paneId + '-exit-sent.txt'), 'true');
    const sentinelMatch = cmd.match(/__fgos_herdr_exit_[^:]+/);
    if (sentinelMatch) {
      fs.appendFileSync(outFile, sentinelMatch[0] + ':0\\n');
    }
  }
  process.exit(0);
}

if (subcommand === 'pane' && action === 'get') {
  const paneId = args[2];
  const pollsFile = path.join(outputsDir, paneId + '-polls.txt');
  let count = 0;
  try { count = parseInt(fs.readFileSync(pollsFile, 'utf8'), 10) || 0; } catch {}
  fs.writeFileSync(pollsFile, String(count + 1));

  const status = count < sequence.length ? sequence[count] : sequence[sequence.length - 1];
  console.log(JSON.stringify({ result: { pane: { pane_id: paneId, agent_status: status } } }));
  process.exit(0);
}

if (subcommand === 'pane' && action === 'wait-output') {
  const paneId = args[2];
  const regexIdx = args.indexOf('--regex');
  const rawPattern = args[regexIdx + 1];
  const re = new RegExp(rawPattern.replace(/\\(\\?m\\)/g, ''), 'm');
  const outFile = path.join(outputsDir, paneId + '.txt');
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const content = fs.existsSync(outFile) ? fs.readFileSync(outFile, 'utf8') : '';
    const match = re.exec(content);
    if (match) {
      console.log(JSON.stringify({ result: { matched_line: match[0], read: { text: content } } }));
      process.exit(0);
    }
  }
  process.exit(1);
}

process.exit(0);
`;
  fs.writeFileSync(scriptPath, code);
  const wrapperPath = path.join(tmpDir, 'herdr-wrapper.sh');
  fs.writeFileSync(wrapperPath, `#!/bin/sh\nexec node "${scriptPath}" "$@"\n`);
  fs.chmodSync(wrapperPath, 0o755);

  const herdrSpawn = EXECUTOR_ADAPTERS['herdr-spawn'];
  const res = await herdrSpawn(
    {
      command: 'agy',
      args: ['-i', 'prompt test'],
      env: {},
      interactiveMode: { exitCommand: '/exit' },
    },
    { cwd: tmpDir, timeoutMs: 5000, workId: 'done-no-working-item', tier: 'standard', model: 'sonnet', herdrBin: wrapperPath },
  );

  assert.equal(res.status, 0);

  const exitFiles = fs.readdirSync(outputsDir).filter((f) => f.endsWith('-exit-sent.txt'));
  assert.equal(exitFiles.length, 1);
  assert.equal(
    fs.readFileSync(path.join(outputsDir, exitFiles[0]), 'utf8'),
    'true',
    'a "done" completion that never passed through "working" must still complete, not hang until timeout',
  );

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('herdr-spawn adapter (LIVE): dispatch a real agy-herdr interactiveMode executor against real binaries', { skip: AGY_HERDR_SKIP }, async () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'live-agy-interactive-proof-'));
  execFileSync('git', ['init'], { cwd: tmpRoot });
  execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: tmpRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tmpRoot });
  execFileSync('git', ['commit', '--allow-empty', '-m', 'initial'], { cwd: tmpRoot });
  writeRunnerConfigFixture(tmpRoot, {
    executor: { command: 'agy', args: ['-i', '{prompt}', '--model', '{model}'] },
    models: { light: 'gemini-3.6-flash-medium' },
    timeoutMs: 60000,
    executors: {
      'test-agy-herdr-interactive': {
        kind: 'agent',
        allowCrossProvider: true,
        invocations: [{
          via: 'cli',
          adapter: 'herdr-spawn',
          interactiveMode: { exitCommand: '/exit' },
          command: 'agy',
          args: ['-i', '{prompt}', '--mode', 'accept-edits', '--new-project', '--model', '{model}'],
        }],
      },
    },
  });

  const res = await executeExecutorCli('test-agy-herdr-interactive', {
    prompt: 'Create a file named PROOF.txt containing "proof content", add PROOF.txt to git, and run git commit -m "proof commit". Do not ask questions, execute now.',
    repoRoot: tmpRoot,
    cwd: tmpRoot,
    tier: 'light',
  });

  try {
    assert.equal(res.status, 0);
    const proofPath = path.join(tmpRoot, 'PROOF.txt');
    assert.ok(fs.existsSync(proofPath), 'PROOF.txt must exist on disk after interactive dispatch');
    const content = fs.readFileSync(proofPath, 'utf8');
    assert.ok(content.includes('proof content'), 'PROOF.txt must contain expected proof content');
    const gitLog = execFileSync('git', ['log', '-1', '--oneline'], { cwd: tmpRoot, encoding: 'utf8' });
    assert.ok(gitLog.includes('proof commit'), 'git log must confirm a new commit landed');
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});
