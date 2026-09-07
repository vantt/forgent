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

// A fake herdr that answers in herdr 0.8.2's real envelope shapes and, when
// asked to submit a prompt, plays the worker: it reads the brief and writes
// the files the brief told the worker to write. Nothing here needs a terminal,
// a herdr install, or an agent.
//
// `scenario` decides what goes wrong, if anything:
//   startError   -- herdr refuses to bring an agent to ready
//   promptError  -- the first submission fails with this code
//   screen       -- what `agent read` shows (used to explain a blocked agent)
//   statuses     -- what successive `agent get` calls report
//   worker       -- 'ack-then-result' | 'result-only' | 'silent'
//   workerOnPrompt -- which brief submission the worker finally responds to
function createMockHerdr(tmpDir, scenario = {}) {
  const scriptPath = path.join(tmpDir, 'mock-herdr.mjs');
  const wrapperPath = path.join(tmpDir, 'mock-herdr.sh');
  const statePath = path.join(tmpDir, 'mock-state.json');
  const logPath = path.join(tmpDir, 'mock-log.jsonl');
  const scenarioPath = path.join(tmpDir, 'mock-scenario.json');

  fs.writeFileSync(statePath, JSON.stringify({ prompts: 0, gets: 0, exited: false }));
  fs.writeFileSync(logPath, '');
  fs.writeFileSync(scenarioPath, JSON.stringify({
    worker: 'ack-then-result',
    workerOnPrompt: 1,
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

if (group === 'pane' && action === 'split') ok({ pane: { pane_id: 'mock-pane-1' } });
if (group === 'pane' && action === 'close') ok({ closed: true });
if (group === 'pane' && action === 'process-info') {
  // A real pane always lists its own shell. "The agent is there" means a
  // foreground process that is NOT the shell -- so an agent that exited, or
  // one the scenario says never survived, leaves the shell alone.
  const gone = scenario.agentGone || readState().exited;
  const foreground = gone
    ? [{ pid: 100, name: 'zsh' }]
    : [{ pid: 200, name: 'agy' }, { pid: 100, name: 'zsh' }];
  ok({ process_info: { pane_id: 'mock-pane-1', shell_pid: 100, foreground_process_group_id: gone ? 100 : 200, foreground_processes: foreground } });
}
if (group === 'agent' && action === 'start') {
  if (scenario.startError) fail(scenario.startError, 'agent never reached a ready state');
  ok({ agent: { agent_status: 'idle' } });
}
if (group === 'agent' && action === 'read') ok({ read: { text: scenario.screen ?? '' } });
if (group === 'agent' && action === 'get') {
  const state = readState();
  const status = scenario.statuses[Math.min(state.gets, scenario.statuses.length - 1)];
  writeState({ ...state, gets: state.gets + 1 });
  ok({ agent: { agent_status: status, pane_id: 'mock-pane-1', state_change_seq: state.gets } });
}
if (group === 'agent' && action === 'prompt') {
  const text = args[3];
  // A slash command is the exit sequence, not a brief -- it neither counts as
  // a delivery attempt nor makes the worker do anything.
  if (text.startsWith('/')) {
    writeState({ ...readState(), exited: true });
    ok({ agent: { agent_status: 'idle' } });
  }

  const state = readState();
  const attempt = state.prompts + 1;
  writeState({ ...state, prompts: attempt });

  if (scenario.promptError && attempt === 1) fail(scenario.promptError, 'submission was not accepted');

  if (scenario.worker !== 'silent' && attempt >= (scenario.workerOnPrompt ?? 1)) {
    // Play the worker: find the brief, then write exactly what it asked for.
    let briefText = text;
    const pointer = text.match(/^Read (.+) and do what it says\\.$/);
    if (pointer) briefText = fs.readFileSync(pointer[1], 'utf8');
    const ackMatch = briefText.match(/(\\/\\S+\\/outbox\\/ack-1\\.json)/);
    if (ackMatch) {
      const outbox = path.dirname(ackMatch[1]);
      const atomicWrite = (file, body) => {
        fs.writeFileSync(file + '.tmp', body);
        fs.renameSync(file + '.tmp', file);
      };
      if (scenario.worker !== 'result-only') {
        atomicWrite(path.join(outbox, 'ack-1.json'), JSON.stringify({ round: 1, receivedAt: new Date().toISOString() }));
      }
      atomicWrite(path.join(outbox, 'report-1.md'), 'the worker wrote this report');
      atomicWrite(path.join(outbox, 'result-1.json'), JSON.stringify({ status: 'settled', summary: 'done', findings: [], evidenceRefs: [] }));
    }
  }
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

function dispatchThroughMock(tmpDir, mock, { prompt, interactiveMode, promptDelivery, timeoutMs = 5000, idleTimeoutMs, argsTemplate } = {}) {
  const runDir = path.join(tmpDir, 'run');
  fs.mkdirSync(runDir, { recursive: true });
  return EXECUTOR_ADAPTERS['herdr-spawn'](
    {
      command: 'agy',
      args: ['-i', prompt, '--mode', 'accept-edits'],
      argsTemplate: argsTemplate ?? ['-i', '{prompt}', '--mode', 'accept-edits'],
      prompt,
      env: {},
      promptDelivery,
      interactiveMode: { exitCommand: '/exit', resendAfterMs: 200, ...interactiveMode },
    },
    { cwd: tmpDir, timeoutMs, idleTimeoutMs, workId: 'w1', tier: 'standard', model: 'sonnet', herdrBin: mock.herdrBin, runDir },
  );
}

const MULTILINE_PROMPT = [
  '# Implement the thing',
  '',
  'Steps:',
  '1. read the spec',
  '2. change the code',
  '',
  'Do not ask questions.',
].join('\n');

test('herdr-spawn adapter validates interactiveMode config shape', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-interactive-cfg-test-'));
  const cfgPath = path.join(tmpDir, '.fgos', 'config.json');
  fs.mkdirSync(path.dirname(cfgPath), { recursive: true });
  const withInteractiveMode = (interactiveMode) => JSON.stringify({
    executor: { command: 'node', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 60000,
    executors: {
      agyHerdr: { kind: 'agent', command: 'agy', args: ['-i', '{prompt}'], adapter: 'herdr-spawn', interactiveMode },
    },
  });

  fs.writeFileSync(cfgPath, withInteractiveMode({ exitCommand: '/exit', kind: 'agy', promptTimeoutMs: 20000 }));
  const loaded = loadRunnerConfig(cfgPath);
  assert.equal(loaded.executors.agyHerdr.interactiveMode.exitCommand, '/exit');
  assert.equal(loaded.executors.agyHerdr.interactiveMode.kind, 'agy');

  fs.writeFileSync(cfgPath, withInteractiveMode({ exitCommand: '' }));
  assert.throws(() => loadRunnerConfig(cfgPath), /exitCommand/);

  fs.writeFileSync(cfgPath, withInteractiveMode({ exitCommand: '/exit', kind: 'Claude' }));
  assert.throws(() => loadRunnerConfig(cfgPath), /kind/);

  // Shorter than herdr's own 5000ms stall detector means this side always wins
  // the race and the caller never learns why the brief did not land.
  fs.writeFileSync(cfgPath, withInteractiveMode({ exitCommand: '/exit', promptTimeoutMs: 3000 }));
  assert.throws(() => loadRunnerConfig(cfgPath), /promptTimeoutMs/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('the prompt travels as a file and only a one-line pointer is ever typed', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-brief-file-'));
  const mock = createMockHerdr(tmpDir);
  const res = await dispatchThroughMock(tmpDir, mock, { prompt: MULTILINE_PROMPT });

  const brief = fs.readFileSync(path.join(tmpDir, 'run', 'brief-1.md'), 'utf8');
  assert.ok(brief.includes(MULTILINE_PROMPT), 'the brief carries the real prompt verbatim, newlines and all');

  const submissions = mock.calls().filter((c) => c[0] === 'agent' && c[1] === 'prompt' && !c[3].startsWith('/'));
  assert.equal(submissions.length, 1);
  const typed = submissions[0][3];
  assert.ok(!typed.includes('\n'), 'what gets typed at a TUI is a single line');
  assert.match(typed, /^Read .*brief-1\.md and do what it says\.$/);
  assert.ok(!typed.includes('read the spec'), 'the work itself never goes through the terminal');
  assert.equal(res.status, 0);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('startup goes through agent start and never types a command into a shell', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-agent-start-'));
  const mock = createMockHerdr(tmpDir);
  await dispatchThroughMock(tmpDir, mock, { prompt: 'do the thing' });

  const calls = mock.calls();
  assert.ok(
    calls.some((c) => c[0] === 'agent' && c[1] === 'start'),
    'the agent is started by herdr, which is what absorbs the shell boot race',
  );
  assert.ok(
    !calls.some((c) => c[0] === 'pane' && c[1] === 'run'),
    'nothing is ever typed at the shell to launch the worker',
  );

  const start = calls.find((c) => c[0] === 'agent' && c[1] === 'start');
  assert.ok(start.includes('--kind'), 'the agent kind is declared');
  assert.equal(start[start.indexOf('--kind') + 1], 'agy');
  const afterSeparator = start.slice(start.indexOf('--') + 1);
  // Only the array element that carried `{prompt}` is dropped. Every other
  // declared flag is the executor's own and is passed through untouched.
  assert.deepEqual(afterSeparator, ['-i', '--mode', 'accept-edits']);
  assert.ok(!afterSeparator.some((a) => a.includes('do the thing')), 'the prompt is not among the agent argv');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('completion is the worker result file, never an agent status', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-receipt-'));
  // An agent that reports `working` forever still completes, because what
  // completes it is a file the worker wrote.
  const mock = createMockHerdr(tmpDir, { statuses: ['working'] });
  const res = await dispatchThroughMock(tmpDir, mock, { prompt: 'do the thing' });

  assert.equal(res.status, 0);
  assert.equal(res.stdout, 'the worker wrote this report');
  assert.ok(fs.existsSync(path.join(tmpDir, 'run', 'outbox', 'result-1.json')));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('a round fast enough to skip the acknowledgement still completes', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-result-only-'));
  const mock = createMockHerdr(tmpDir, { worker: 'result-only' });
  const res = await dispatchThroughMock(tmpDir, mock, { prompt: 'do the thing' });

  assert.equal(res.status, 0);
  assert.ok(!fs.existsSync(path.join(tmpDir, 'run', 'outbox', 'ack-1.json')));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('an agent that never becomes ready fails by that name and leaves its pane open', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-not-ready-'));
  const mock = createMockHerdr(tmpDir, { startError: 'agent_not_ready' });

  await assert.rejects(
    () => dispatchThroughMock(tmpDir, mock, { prompt: 'do the thing' }),
    (err) => {
      assert.ok(err instanceof DispatchError);
      assert.equal(err.reason, 'agent_not_ready');
      assert.equal(err.paneId, 'mock-pane-1');
      return true;
    },
  );
  assert.ok(
    !mock.calls().some((c) => c[0] === 'pane' && c[1] === 'close'),
    'a failed dispatch keeps its pane -- that screen is the only place the reason is still legible',
  );

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('a brief that stalls on submission is reported as a stall, not as a timeout', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-stalled-'));
  const mock = createMockHerdr(tmpDir, { promptError: 'agent_prompt_stalled' });

  await assert.rejects(
    () => dispatchThroughMock(tmpDir, mock, { prompt: 'do the thing' }),
    (err) => {
      assert.equal(err.reason, 'agent_prompt_stalled');
      assert.match(err.message, /failed to brief/);
      return true;
    },
  );

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('a blocked agent is reported as blocked, with the line that is on its screen', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-blocked-'));
  const mock = createMockHerdr(tmpDir, {
    promptError: 'agent_blocked',
    screen: 'Do you trust the files in this folder?\n1. Yes, proceed',
  });

  await assert.rejects(
    () => dispatchThroughMock(tmpDir, mock, { prompt: 'do the thing' }),
    (err) => {
      assert.equal(err.reason, 'agent_blocked');
      assert.equal(err.screen, '1. Yes, proceed');
      assert.match(err.message, /last line on screen/);
      return true;
    },
  );

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('a working agent is never interrupted with a second copy of its own brief', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-no-resend-'));
  const mock = createMockHerdr(tmpDir, { worker: 'silent', statuses: ['working'] });

  await assert.rejects(
    () => dispatchThroughMock(tmpDir, mock, { prompt: 'do the thing', timeoutMs: 1500 }),
    (err) => {
      // A worker that stays busy past the absolute ceiling ends there, not on
      // a staleness reading -- `working` is progress, so it never goes stale.
      assert.equal(err.outcome, 'timed-out-ceiling');
      assert.equal(err.errorClass, 'worker-timeout');
      return true;
    },
  );

  const submissions = mock.calls().filter((c) => c[0] === 'agent' && c[1] === 'prompt' && !c[3].startsWith('/'));
  assert.equal(submissions.length, 1, 'the brief was delivered once and never re-typed while the agent was busy');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('a brief that landed nowhere is offered again once the agent is back at rest', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-resend-'));
  // `done`, not `idle`: a --no-focus pane settles there because a CLI read
  // never marks it seen, and the ready gate has to accept it.
  const mock = createMockHerdr(tmpDir, { statuses: ['done'], workerOnPrompt: 2 });
  const res = await dispatchThroughMock(tmpDir, mock, { prompt: 'do the thing', timeoutMs: 5000 });

  assert.equal(res.status, 0);
  const submissions = mock.calls().filter((c) => c[0] === 'agent' && c[1] === 'prompt' && !c[3].startsWith('/'));
  assert.equal(submissions.length, 2);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('inline delivery types the brief itself, and is a declared choice rather than the default', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-inline-'));
  const mock = createMockHerdr(tmpDir);
  const res = await dispatchThroughMock(tmpDir, mock, { prompt: MULTILINE_PROMPT, promptDelivery: 'inline' });

  assert.equal(res.status, 0);
  const typed = mock.calls().find((c) => c[0] === 'agent' && c[1] === 'prompt' && !c[3].startsWith('/'))[3];
  assert.ok(typed.includes(MULTILINE_PROMPT), 'inline puts the whole brief through the terminal');
  assert.ok(fs.existsSync(path.join(tmpDir, 'run', 'brief-1.md')), 'the brief is still written for the record');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('the exit sequence asks the agent to leave, waits for the pane to be its own again, then closes it', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-exit-'));
  const mock = createMockHerdr(tmpDir);
  await dispatchThroughMock(tmpDir, mock, { prompt: 'do the thing' });

  const calls = mock.calls();
  const exitIdx = calls.findIndex((c) => c[0] === 'agent' && c[1] === 'prompt' && c[3] === '/exit');
  // process-info is also the liveness probe during the round, so the drain is
  // the reading that comes AFTER the exit command, not the first one overall.
  const drainIdx = calls.findIndex((c, i) => i > exitIdx && c[0] === 'pane' && c[1] === 'process-info');
  const closeIdx = calls.findIndex((c) => c[0] === 'pane' && c[1] === 'close');
  assert.ok(exitIdx !== -1, 'the agent is asked to leave');
  assert.ok(drainIdx > exitIdx, 'the pane is watched after the exit command');
  assert.ok(closeIdx > drainIdx, 'and closed only once it is its own again');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('an agent that leaves the pane without writing a result is reported dead, and its pane is kept', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-died-'));
  // The pane still exists and still lists its own shell -- what is gone is the
  // agent process. A live pane is not a live agent.
  const mock = createMockHerdr(tmpDir, { worker: 'silent', agentGone: true, statuses: ['idle'] });

  await assert.rejects(
    () => dispatchThroughMock(tmpDir, mock, { prompt: 'do the thing', timeoutMs: 20000 }),
    (err) => {
      assert.equal(err.outcome, 'died');
      assert.equal(err.errorClass, 'worker-spawn-fail');
      assert.match(err.message, /consecutive/);
      return true;
    },
  );
  assert.ok(
    !mock.calls().some((c) => c[0] === 'pane' && c[1] === 'close'),
    'the pane is forensics now, not rubbish',
  );

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('a stale worker whose screen names a provider limit is paused, not timed out', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-paused-'));
  const mock = createMockHerdr(tmpDir, {
    worker: 'silent',
    statuses: ['idle'],
    screen: 'Claude usage limit reached. Your limit will reset at 3pm.',
  });

  await assert.rejects(
    () => dispatchThroughMock(tmpDir, mock, { prompt: 'do the thing', timeoutMs: 20000, idleTimeoutMs: 700 }),
    (err) => {
      assert.equal(err.outcome, 'paused-limit');
      assert.match(err.screen, /usage limit/i);
      assert.match(err.screen, /3pm/, 'the reset time survives into the error');
      return true;
    },
  );

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('a stale worker with an ordinary screen is an idle timeout that still quotes the screen', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-idle-'));
  const mock = createMockHerdr(tmpDir, {
    worker: 'silent',
    statuses: ['idle'],
    screen: 'waiting for you to say something',
  });

  await assert.rejects(
    () => dispatchThroughMock(tmpDir, mock, { prompt: 'do the thing', timeoutMs: 20000, idleTimeoutMs: 700 }),
    (err) => {
      assert.equal(err.outcome, 'timed-out-idle');
      assert.match(err.message, /Last line on screen: waiting for you/);
      return true;
    },
  );

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('a settled round reports its outcome so the confidence ladder does not overwrite it with a guess', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-outcome-'));
  const mock = createMockHerdr(tmpDir);
  const res = await dispatchThroughMock(tmpDir, mock, { prompt: 'do the thing' });
  assert.equal(res.outcome, 'settled');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('an executor with no way to name its agent kind is refused instead of guessed at', async () => {
  await assert.rejects(
    () => EXECUTOR_ADAPTERS['herdr-spawn'](
      { command: '', args: [], env: {}, interactiveMode: { exitCommand: '/exit' } },
      { cwd: process.cwd(), workId: 'w1', tier: 'standard', model: 'sonnet' },
    ),
    (err) => err.errorClass === 'invalid-config' && /agent kind/.test(err.message),
  );
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
