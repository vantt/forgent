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
const AGY_HERDR_SKIP = HERDR_BIN && AGY_BIN ? false : 'herdr or agy binary not found on PATH -- live agy-herdr test skips honestly';

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

test('herdr-spawn adapter (LIVE): dispatch a real agy-herdr interactiveMode executor against real binaries', { skip: AGY_HERDR_SKIP }, async () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'live-agy-interactive-proof-'));
  execFileSync('git', ['init'], { cwd: tmpRoot });
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
    prompt: 'Print Hello from agy-herdr interactive live proof.',
    repoRoot: tmpRoot,
    cwd: tmpRoot,
    tier: 'light',
  });

  try {
    assert.equal(res.status, 0);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});
