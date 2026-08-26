import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { EXECUTOR_ADAPTERS, DispatchError, DISPATCH_DEPTH_ENV, MAX_DISPATCH_DEPTH } from '../../src/runner/dispatch/transport.mjs';
import { loadRunnerConfig } from '../../src/runner/dispatch/config.mjs';
import { executeExecutorCli } from '../../src/runner/dispatch/cli.mjs';
import { findExecutableOnPath } from '../../src/state/tool-registry.mjs';

function writeRunnerConfigFixture(root, cfg) {
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(root, '.fgos', 'config.json'), JSON.stringify({ runner: cfg }, null, 2));
}

// Live-binary regression guard (self-review finding, 2026-08-25, fourth
// round): every mock in this file simulates herdr's CLI contract by hand,
// and that simulation was itself wrong in ways that only surfaced against
// the REAL binary -- `pane split` requires `--direction` (the mocks below
// accepted anything), and an unanchored completion regex matches the
// pane's own echo of the typed command line before the real command even
// runs (the mocks below never modeled that echo-then-output timing at
// all). Skips honestly when herdr isn't installed, same pattern
// test/e2e/coexistence-canary.test.mjs already uses for its own
// real-binary dependency.
const HERDR_BIN = findExecutableOnPath(['herdr']);
const AGY_BIN = findExecutableOnPath(['agy']);
const HERDR_SKIP = HERDR_BIN ? false : 'herdr binary not found on PATH -- live-binary regression tests skip honestly';
const AGY_HERDR_SKIP = HERDR_BIN && AGY_BIN ? false : 'herdr or agy binary not found on PATH -- live agy-herdr test skips honestly';

function herdrPane(args) {
  return execFileSync(HERDR_BIN, args, { encoding: 'utf8' });
}

// A realistic mock: unlike createMockHerdrScript below (which never
// actually runs the "pane run" command text, so it can't exercise the
// self-review sentinel-fallback fix), this one really executes it via a
// real shell and lets "pane wait-output"/"pane read" observe the real
// resulting output -- close enough to real herdr semantics to prove the
// sentinel actually gets matched and the real exit code actually surfaces.
function createRealisticMockHerdrScript(tmpDir) {
  const scriptPath = path.join(tmpDir, 'realistic-mock-herdr.mjs');
  const outputsDir = path.join(tmpDir, 'pane-outputs');
  const code = `
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
const outputsDir = ${JSON.stringify(outputsDir)};
fs.mkdirSync(outputsDir, { recursive: true });
const args = process.argv.slice(2);
const subcommand = args[0];
const action = args[1];

if (subcommand === 'pane' && action === 'split') {
  // Real herdr refuses without --direction (self-review finding,
  // 2026-08-25, confirmed live: exit 2). Mirrored here for the same reason
  // as createMockHerdrScript's own copy of this check.
  if (!args.includes('--direction')) {
    process.stderr.write('usage: herdr pane split ... --direction right|down ...\\n');
    process.exit(2);
  }
  const paneId = 'pane-real-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  fs.writeFileSync(path.join(outputsDir, paneId + '.txt'), '');
  console.log(JSON.stringify({ result: { pane: { pane_id: paneId } } }));
  process.exit(0);
}

if (subcommand === 'pane' && action === 'run') {
  const paneId = args[2];
  const cmd = args[3];
  // Real herdr's pane FIRST echoes the typed command line back (terminal
  // convention -- confirmed live), THEN the command actually runs and
  // produces its own real output. Written here in that same order so a
  // regex without the (?m)^ anchoring fix (self-review finding,
  // 2026-08-25) would match the echoed line's own literal token/sentinel
  // text -- exactly the false-positive this mock exists to catch.
  fs.appendFileSync(path.join(outputsDir, paneId + '.txt'), cmd + '\\n');
  let out = '';
  try {
    out = execSync(cmd, { shell: '/bin/sh', encoding: 'utf8' });
  } catch (err) {
    out = (err.stdout || '') + (err.stderr || '');
  }
  fs.appendFileSync(path.join(outputsDir, paneId + '.txt'), out);
  process.exit(0);
}

if (subcommand === 'pane' && action === 'wait-output') {
  const paneId = args[2];
  const regexIdx = args.indexOf('--regex');
  // Real herdr's --regex is a Rust regex; this adapter's own pattern uses
  // Rust's inline (?m) flag syntax, which JS's RegExp constructor does NOT
  // support (throws "Invalid group") -- confirmed live. Strip it and apply
  // JS's own 'm' flag instead, same semantics.
  const rawPattern = args[regexIdx + 1];
  const re = new RegExp(rawPattern.replace(/\\(\\?m\\)/g, ''), 'm');
  const outFile = path.join(outputsDir, paneId + '.txt');
  // No --timeout is ever passed by this adapter anymore (self-review
  // finding, 2026-08-25: dropped in favor of the adapter's own JS timer as
  // sole authority) -- this mock waits until SIGTERM'd, same as the real
  // binary's own "without --timeout, waits indefinitely", capped at a
  // generous safety ceiling so a forgotten test-side timeout can't hang
  // the suite forever.
  const deadline = Date.now() + 30000;
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

// Same as createRealisticMockHerdrScript, except "pane run" echoes the
// typed line TWICE before running it -- once bare, once with a fake shell
// prompt prefix -- reproducing a real live finding (2026-08-26): herdr's
// actual pane transcript shows the typed "sh '<scriptPath>'" invocation
// twice (the typed keystrokes, then again once the pane redraws with the
// shell's own prompt in front of it). A fix that strips only the FIRST
// occurrence leaves the second one sitting in the "cleaned" stdout.
function createDoubleEchoMockHerdrScript(tmpDir) {
  const scriptPath = path.join(tmpDir, 'double-echo-mock-herdr.mjs');
  const outputsDir = path.join(tmpDir, 'pane-outputs');
  const code = `
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
const outputsDir = ${JSON.stringify(outputsDir)};
fs.mkdirSync(outputsDir, { recursive: true });
const args = process.argv.slice(2);
const subcommand = args[0];
const action = args[1];

if (subcommand === 'pane' && action === 'split') {
  const paneId = 'pane-double-echo-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  fs.writeFileSync(path.join(outputsDir, paneId + '.txt'), '');
  console.log(JSON.stringify({ result: { pane: { pane_id: paneId } } }));
  process.exit(0);
}

if (subcommand === 'pane' && action === 'run') {
  const paneId = args[2];
  const cmd = args[3];
  const outFile = path.join(outputsDir, paneId + '.txt');
  fs.appendFileSync(outFile, cmd + '\\n');
  fs.appendFileSync(outFile, '\\u2794  /tmp ' + cmd + '\\n');
  let out = '';
  try {
    out = execSync(cmd, { shell: '/bin/sh', encoding: 'utf8' });
  } catch (err) {
    out = (err.stdout || '') + (err.stderr || '');
  }
  fs.appendFileSync(outFile, out);
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

function createMockHerdrScript(tmpDir) {
  const scriptPath = path.join(tmpDir, 'mock-herdr.mjs');
  const logPath = path.join(tmpDir, 'herdr-calls.jsonl');
  const scriptContentsPath = path.join(tmpDir, 'herdr-run-script-contents.jsonl');

  const code = `
import fs from 'node:fs';
const args = process.argv.slice(2);
const logPath = ${JSON.stringify(logPath)};
const scriptContentsPath = ${JSON.stringify(scriptContentsPath)};
let counter = 1;
try {
  const existing = fs.readFileSync(logPath, 'utf8').trim().split('\\n').filter(Boolean);
  counter = existing.length + 1;
} catch {}

fs.appendFileSync(logPath, JSON.stringify({ args, pid: process.pid, env: process.env.FGOS_TEST_MARKER }) + '\\n');

const subcommand = args[0];
const action = args[1];

if (subcommand === 'pane' && action === 'split') {
  // Real herdr refuses without --direction (self-review finding,
  // 2026-08-25, confirmed live: exit 2, "usage: herdr pane split ...
  // --direction right|down ..."). Mirrored here so a regression (the flag
  // silently dropped again) fails this mock too, not just the live suite.
  if (!args.includes('--direction')) {
    process.stderr.write('usage: herdr pane split [<pane_id>|--pane ID|--current] --direction right|down ...\\n');
    process.exit(2);
  }
  const paneId = 'pane-' + counter + '-' + Math.random().toString(36).slice(2, 7);
  console.log(JSON.stringify({ result: { pane: { pane_id: paneId } } }));
  process.exit(0);
}

if (subcommand === 'pane' && action === 'run') {
  // Script-file indirection (sixth-round fix): the typed text is no longer
  // the full command -- it is a short "sh '<scriptPath>'" invocation, and
  // the real quoted command lives in that script FILE, which the adapter
  // deletes once it settles. Read the file's content here (before that
  // cleanup can run) and log it, so a test can inspect the real quoted
  // command after the dispatch has already resolved/rejected.
  const typedCmd = args[3] || '';
  const pathMatch = typedCmd.match(/^sh '(.*)'$/);
  if (pathMatch) {
    try {
      const scriptContent = fs.readFileSync(pathMatch[1], 'utf8');
      fs.appendFileSync(scriptContentsPath, JSON.stringify({ paneId: args[2], scriptContent }) + '\\n');
    } catch {}
  }
  process.exit(0);
}

if (subcommand === 'pane' && action === 'wait-output') {
  // Real herdr embeds the matched snapshot directly in its own JSON
  // response (self-review finding, 2026-08-25, confirmed live) -- this
  // adapter reads result.read.text from THIS response, never a separate
  // "pane read" call (which the real binary can return EMPTY for on a
  // "recent"/"recent-unwrapped" source when nothing has scrolled
  // off-screen yet).
  //
  // Sentinel-aware (sixth-round fix, 2026-08-26): the adapter now REJECTS
  // any wait-output response whose captured text carries no evaluated
  // completion sentinel (never defaults to status 0) -- a canned response
  // with no sentinel at all, as this mock used to return unconditionally,
  // would make every test using this mock fail. The real sentinel is
  // embedded in the --regex this mock was actually called with, so it is
  // extracted from there rather than hardcoded.
  const regexIdx = args.indexOf('--regex');
  const rawPattern = args[regexIdx + 1] || '';
  const sentinelMatch = rawPattern.match(/__fgos_herdr_exit_[^:]+__/);
  const sentinelToken = sentinelMatch ? sentinelMatch[0] : '__fgos_herdr_exit_unknown__';
  const matchedLine = sentinelToken + ':0';
  console.log(JSON.stringify({
    result: {
      matched_line: matchedLine,
      read: { text: '[DONE] Work completed successfully inside herdr pane\\n' + matchedLine },
    },
  }));
  process.exit(0);
}

process.exit(0);
`;
  fs.writeFileSync(scriptPath, code);
  return { scriptPath, logPath, scriptContentsPath };
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

test('herdr-spawn adapter: shell metacharacters in a prompt/arg never execute when the typed pane command is later run by a real POSIX shell (self-review finding)', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-shell-injection-test-'));
  const { scriptPath, logPath, scriptContentsPath } = createMockHerdrScript(tmpDir);
  const wrapperPath = path.join(tmpDir, 'herdr-wrapper.sh');
  fs.writeFileSync(wrapperPath, `#!/bin/sh\nexec node "${scriptPath}" "$@"\n`);
  fs.chmodSync(wrapperPath, 0o755);

  const markerFile = path.join(tmpDir, 'pwned.txt');
  // A prompt containing command substitution, a backtick, single/double
  // quotes, a semicolon, and a pipe -- everything the old regex-based
  // conditional-quoting missed or mishandled.
  const dangerousArg = `before $(touch ${markerFile}) \`touch ${markerFile}\` "quoted" 'single' ; touch ${markerFile} | cat after`;

  const herdrSpawn = EXECUTOR_ADAPTERS['herdr-spawn'];
  const res = await herdrSpawn(
    { command: 'echo', args: [dangerousArg], env: {} },
    { cwd: tmpDir, workId: 'injection-item', tier: 'standard', model: 'sonnet', herdrBin: wrapperPath },
  );
  assert.ok(res.paneId);

  // Extract the real quoted command -- since the script-file indirection
  // fix (sixth-round), "pane run"'s own 4th argv element is no longer the
  // full command; it is a short "sh '<scriptPath>'" invocation, and the
  // real quoted command lives in that script FILE, which the adapter
  // deletes once it settles. The mock's own "run" handler above captured
  // that file's content into the log before cleanup could run.
  const calls = fs.readFileSync(logPath, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const runCall = calls.find((c) => c.args[0] === 'pane' && c.args[1] === 'run');
  assert.ok(runCall, 'expected a "pane run" call to be logged');
  const typedText = runCall.args[3];
  assert.ok(typedText, 'expected the typed command text as pane run\'s 4th argv element');
  assert.match(typedText, /^sh '.*'$/, 'the typed pane-run text must be a short, fixed-shape script invocation, never the raw command itself');

  const scriptContentCalls = fs.readFileSync(scriptContentsPath, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.equal(scriptContentCalls.length, 1, 'expected the mock to have captured exactly one real script file content');
  const scriptContent = scriptContentCalls[0].scriptContent;

  // The real proof: actually hand the captured script content to a real
  // POSIX shell, exactly like herdr's own pane would run it via the "sh
  // '<scriptPath>'" invocation. If quoting is broken, `touch <markerFile>`
  // fires and the file exists afterward. (The script also carries a
  // trailing `echo "<sentinel>:$?"` line -- the completion-detection
  // sentinel, a separate self-review fix -- so only the FIRST line is the
  // real echo output under test here.)
  const shellOutput = execFileSync('sh', ['-c', scriptContent], { encoding: 'utf8' });
  assert.ok(!fs.existsSync(markerFile), 'command substitution/backtick/semicolon/pipe in the prompt must NEVER execute when the pane types this text into its shell');
  assert.equal(shellOutput.split('\n')[0], dangerousArg, 'echo must receive the dangerous string as ONE literal argument, unmangled');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('herdr-spawn adapter: a worker that finishes WITHOUT ever printing [DONE]/[BLOCKED] is still detected via the runner-owned sentinel, not lost to a hard timeout -- and the real worker exit code surfaces as status (self-review finding, P1/P2)', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-sentinel-fallback-test-'));
  const { scriptPath } = createRealisticMockHerdrScript(tmpDir);
  const wrapperPath = path.join(tmpDir, 'herdr-wrapper.sh');
  fs.writeFileSync(wrapperPath, `#!/bin/sh\nexec node "${scriptPath}" "$@"\n`);
  fs.chmodSync(wrapperPath, 0o755);

  const herdrSpawn = EXECUTOR_ADAPTERS['herdr-spawn'];
  // A "worker" that does real work (prints something) and exits nonzero --
  // but never once prints [DONE] or [BLOCKED]. Before this fix, this
  // scenario just sat in `herdr pane wait-output`'s own dead regex wait
  // until the adapter's timeout fired and hard-rejected, discarding the
  // existing headBefore/headAfter git-inference fallback entirely.
  const res = await herdrSpawn(
    { command: 'sh', args: ['-c', 'echo hello-no-token; exit 7'], env: {} },
    { cwd: tmpDir, timeoutMs: 5000, workId: 'sentinel-item', tier: 'standard', model: 'sonnet', herdrBin: wrapperPath },
  );

  assert.ok(res.paneId);
  // P2: status must be the REAL worker exit code (7), never
  // `herdr pane wait-output`'s own exit code (which would read 0 here --
  // wait-output succeeded at finding the sentinel, that is not the same
  // fact as "the worker exited 0").
  assert.equal(res.status, 7, 'status must be the real worker exit code, not wait-output\'s own exit code');
  // The internal sentinel line itself must never leak into what looks like
  // real worker output -- the surrounding shell prompt/typed-command echo
  // noise (the pane's own terminal behavior, confirmed live) is a
  // pre-existing, accepted characteristic shared with the [DONE]/[BLOCKED]
  // fast path, not something this fix changes.
  assert.ok(res.stdout.includes('hello-no-token'));
  assert.ok(!res.stdout.includes('__fgos_herdr_exit_'), 'the sentinel marker itself must never appear in the returned stdout');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('herdr-spawn adapter: the worker\'s own [DONE] token remains visible to downstream result parsing after sentinel-based completion (regression guard -- wait-output no longer matches on the token at all)', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-token-fastpath-test-'));
  const { scriptPath } = createRealisticMockHerdrScript(tmpDir);
  const wrapperPath = path.join(tmpDir, 'herdr-wrapper.sh');
  fs.writeFileSync(wrapperPath, `#!/bin/sh\nexec node "${scriptPath}" "$@"\n`);
  fs.chmodSync(wrapperPath, 0o755);

  const herdrSpawn = EXECUTOR_ADAPTERS['herdr-spawn'];
  const res = await herdrSpawn(
    { command: 'sh', args: ['-c', 'echo "[DONE] real work finished"'], env: {} },
    { cwd: tmpDir, timeoutMs: 5000, workId: 'token-item', tier: 'standard', model: 'sonnet', herdrBin: wrapperPath },
  );

  assert.ok(res.stdout.includes('[DONE] real work finished'));
  assert.equal(res.status, 0);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('herdr-spawn adapter passes the resolved executor env into the pane itself via "pane split --env KEY=VALUE" (self-review finding, P1)', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-env-propagation-test-'));
  const { scriptPath, logPath } = createMockHerdrScript(tmpDir);
  const wrapperPath = path.join(tmpDir, 'herdr-wrapper.sh');
  fs.writeFileSync(wrapperPath, `#!/bin/sh\nexec node "${scriptPath}" "$@"\n`);
  fs.chmodSync(wrapperPath, 0o755);

  const herdrSpawn = EXECUTOR_ADAPTERS['herdr-spawn'];
  await herdrSpawn(
    { command: 'echo', args: ['hi'], env: { ANTHROPIC_BASE_URL: 'https://openrouter.ai/api', SOME_API_KEY: 'sk-test-12345' } },
    { cwd: tmpDir, workId: 'env-item', tier: 'standard', model: 'sonnet', herdrBin: wrapperPath },
  );

  const calls = fs.readFileSync(logPath, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const splitCall = calls.find((c) => c.args[0] === 'pane' && c.args[1] === 'split');
  assert.ok(splitCall, 'expected a "pane split" call to be logged');
  // Before this fix: fullEnv only ever governed the LOCAL calls this
  // adapter makes to the herdr CLI itself, never the worker inside the
  // pane -- which would run under ambient/default env instead, diverging
  // from what the audit event (built from the same resolved config)
  // records as the real egress target.
  assert.ok(splitCall.args.includes('--env'), 'pane split must receive --env flags carrying the resolved executor env');
  assert.ok(splitCall.args.includes('ANTHROPIC_BASE_URL=https://openrouter.ai/api'));
  assert.ok(splitCall.args.includes('SOME_API_KEY=sk-test-12345'));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('herdr-spawn adapter never leaks a resolved env secret into its own DispatchError message when "pane split" fails (self-review finding: "không log secret")', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-env-secret-test-'));
  // A wrapper that fails "pane split" with a NON-ENOENT, non-zero exit --
  // the exact shape whose Node execFileSync error message embeds the full
  // argv ("Command failed: <cmd> <args...>"), which would otherwise echo
  // the secret value straight into this adapter's own DispatchError.
  const wrapperPath = path.join(tmpDir, 'herdr-failing-split.sh');
  fs.writeFileSync(wrapperPath, `#!/bin/sh\nif [ "$1" = "pane" ] && [ "$2" = "split" ]; then echo "boom" 1>&2; exit 3; fi\nexit 0\n`);
  fs.chmodSync(wrapperPath, 0o755);

  const secretValue = 'sk-super-secret-do-not-leak-98765';
  const herdrSpawn = EXECUTOR_ADAPTERS['herdr-spawn'];
  try {
    await herdrSpawn(
      { command: 'echo', args: ['hi'], env: { SOME_API_KEY: secretValue } },
      { cwd: tmpDir, workId: 'secret-item', tier: 'standard', model: 'sonnet', herdrBin: wrapperPath },
    );
    assert.fail('should have rejected on pane split failure');
  } catch (err) {
    assert.ok(err instanceof DispatchError);
    assert.ok(!err.message.includes(secretValue), `DispatchError message must never contain the resolved secret value, got: ${err.message}`);
    assert.ok(!JSON.stringify(err).includes(secretValue), 'no field on the DispatchError (including its own serialization) may carry the secret value');
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('herdr-spawn adapter rejects worker-spawn-fail when wait-output reports success but its response carries no result.read.text (sixth-round advisor finding, P2)', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-missing-read-text-test-'));
  const wrapperPath = path.join(tmpDir, 'herdr-missing-read-text.sh');
  fs.writeFileSync(wrapperPath, `#!/bin/sh
if [ "$1" = "pane" ] && [ "$2" = "split" ]; then
  echo '{"result":{"pane":{"pane_id":"pane-missing-read-text"}}}'
  exit 0
fi
if [ "$1" = "pane" ] && [ "$2" = "run" ]; then
  exit 0
fi
if [ "$1" = "pane" ] && [ "$2" = "wait-output" ]; then
  echo '{"result":{}}'
  exit 0
fi
exit 0
`);
  fs.chmodSync(wrapperPath, 0o755);

  const herdrSpawn = EXECUTOR_ADAPTERS['herdr-spawn'];
  try {
    await herdrSpawn(
      { command: 'echo', args: ['hi'], env: {} },
      { cwd: tmpDir, timeoutMs: 5000, workId: 'missing-read-text-item', tier: 'standard', model: 'sonnet', herdrBin: wrapperPath },
    );
    assert.fail('should have rejected -- wait-output reported success with no readable scrollback');
  } catch (err) {
    assert.ok(err instanceof DispatchError);
    assert.equal(err.errorClass, 'worker-spawn-fail');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('herdr-spawn adapter rejects worker-spawn-fail when the captured transcript carries no evaluated completion sentinel (sixth-round advisor finding, P2 -- never defaults status to 0)', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-missing-sentinel-test-'));
  const wrapperPath = path.join(tmpDir, 'herdr-missing-sentinel.sh');
  fs.writeFileSync(wrapperPath, `#!/bin/sh
if [ "$1" = "pane" ] && [ "$2" = "split" ]; then
  echo '{"result":{"pane":{"pane_id":"pane-missing-sentinel"}}}'
  exit 0
fi
if [ "$1" = "pane" ] && [ "$2" = "run" ]; then
  exit 0
fi
if [ "$1" = "pane" ] && [ "$2" = "wait-output" ]; then
  echo '{"result":{"read":{"text":"worker output\\n"}}}'
  exit 0
fi
exit 0
`);
  fs.chmodSync(wrapperPath, 0o755);

  const herdrSpawn = EXECUTOR_ADAPTERS['herdr-spawn'];
  try {
    await herdrSpawn(
      { command: 'echo', args: ['hi'], env: {} },
      { cwd: tmpDir, timeoutMs: 5000, workId: 'missing-sentinel-item', tier: 'standard', model: 'sonnet', herdrBin: wrapperPath },
    );
    assert.fail('should have rejected -- no sentinel means unconfirmed completion, never assume status 0');
  } catch (err) {
    assert.ok(err instanceof DispatchError);
    assert.equal(err.errorClass, 'worker-spawn-fail');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('herdr-spawn adapter: BOTH occurrences of the pane\'s echoed script invocation are stripped, not just the first (regression guard, 2026-08-26 live finding)', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-double-echo-test-'));
  const { scriptPath } = createDoubleEchoMockHerdrScript(tmpDir);
  const wrapperPath = path.join(tmpDir, 'herdr-wrapper.sh');
  fs.writeFileSync(wrapperPath, `#!/bin/sh\nexec node "${scriptPath}" "$@"\n`);
  fs.chmodSync(wrapperPath, 0o755);

  const herdrSpawn = EXECUTOR_ADAPTERS['herdr-spawn'];
  const res = await herdrSpawn(
    { command: 'sh', args: ['-c', 'echo worker-with-no-contract-signal'], env: {} },
    { cwd: tmpDir, timeoutMs: 5000, workId: 'double-echo-item', tier: 'standard', model: 'sonnet', herdrBin: wrapperPath },
  );

  assert.equal(
    res.stdout.trim(),
    'worker-with-no-contract-signal',
    `the returned stdout must contain ONLY the worker's real output, no remnant of either echoed occurrence of the typed script invocation -- got: ${JSON.stringify(res.stdout)}`,
  );
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('executeExecutorCli via herdr-spawn: a dispatched prompt mentioning "[DONE]" as instructional prose never leaks into stdout through the pane\'s command echo, and a worker that never signals resolves outcome "unsignaled" (sixth-round advisor finding, acceptance test)', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-execute-unsignaled-test-'));
  const { scriptPath } = createRealisticMockHerdrScript(tmpDir);
  const wrapperPath = path.join(tmpDir, 'herdr-wrapper.sh');
  fs.writeFileSync(wrapperPath, `#!/bin/sh\nexec node "${scriptPath}" "$@"\n`);
  fs.chmodSync(wrapperPath, 0o755);

  // A fake "agent CLI" that ignores its own argv (the substituted prompt)
  // entirely and prints only a benign, contract-silent line -- modeling a
  // real worker that does real work but never emits [DONE]/[BLOCKED].
  const fakeAgentCliPath = path.join(tmpDir, 'fake-agent-cli.sh');
  fs.writeFileSync(fakeAgentCliPath, '#!/bin/sh\necho worker-with-no-contract-signal\n');
  fs.chmodSync(fakeAgentCliPath, 0o755);

  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-execute-unsignaled-root-'));
  writeRunnerConfigFixture(root, {
    executor: { command: '/global/executor', args: ['{prompt}'] },
    executors: {
      'herdr-worker': { kind: 'agent', command: fakeAgentCliPath, args: ['{prompt}'], adapter: 'herdr-spawn', allowCrossProvider: true },
    },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });

  const dispatchedPrompt = 'Do the task. Report [DONE] when finished, or [BLOCKED] if stuck.';
  const prevHerdrBin = process.env.FGOS_HERDR_BIN;
  process.env.FGOS_HERDR_BIN = wrapperPath;
  try {
    const result = await executeExecutorCli('herdr-worker', { prompt: dispatchedPrompt, repoRoot: root, cwd: tmpDir, tier: 'standard' });
    assert.equal(result.outcome, 'unsignaled', 'a worker that never itself prints [DONE]/[BLOCKED] must resolve outcome "unsignaled", never a false positive from the echoed prompt');
    assert.ok(result.stdout.includes('worker-with-no-contract-signal'), 'the worker\'s own real output must still be present');
    assert.ok(!result.stdout.includes('[DONE]'), 'the dispatched prompt\'s own "[DONE]" mention must never leak into stdout via the pane\'s command echo');
    assert.ok(!result.stdout.includes('[BLOCKED]'), 'the dispatched prompt\'s own "[BLOCKED]" mention must never leak into stdout via the pane\'s command echo');
    assert.ok(!result.stdout.includes(dispatchedPrompt), 'the raw dispatched prompt text must never appear in stdout at all');
  } finally {
    if (prevHerdrBin !== undefined) {
      process.env.FGOS_HERDR_BIN = prevHerdrBin;
    } else {
      delete process.env.FGOS_HERDR_BIN;
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// --- Live-binary regression guard (fourth-round self-review findings) ---
//
// Everything below dispatches against the REAL installed `herdr` binary --
// no mock. Each test tracks its own pane_id and closes it in a `finally`,
// same courtesy `herdr pane close` itself proved reliable for in live
// probing (a real `sleep 45` launched via `pane run`, confirmed via `ps`,
// was gone within one second of the close call).

test('herdr-spawn adapter (LIVE): a worker that finishes without ever printing [DONE]/[BLOCKED] is detected via the sentinel against the real binary, with the real exit code and no sentinel leak', { skip: HERDR_SKIP }, async () => {
  const herdrSpawn = EXECUTOR_ADAPTERS['herdr-spawn'];
  const res = await herdrSpawn(
    { command: 'sh', args: ['-c', 'echo real-live-hello; exit 7'], env: {} },
    { cwd: '/tmp', timeoutMs: 10000, workId: 'live-sentinel-item', tier: 'standard', model: 'sonnet', herdrBin: HERDR_BIN },
  );
  try {
    assert.equal(res.status, 7, 'status must be the real worker exit code');
    assert.ok(res.stdout.includes('real-live-hello'));
    assert.ok(!res.stdout.includes('__fgos_herdr_exit_'), 'the sentinel marker must never leak into stdout, including its echoed/unevaluated form');
  } finally {
    try { herdrPane(['pane', 'close', res.paneId]); } catch {}
  }
});

test('herdr-spawn adapter (LIVE): timeout actually stops the real worker process, not just the watcher', { skip: HERDR_SKIP }, async () => {
  const herdrSpawn = EXECUTOR_ADAPTERS['herdr-spawn'];
  let caught;
  try {
    await herdrSpawn(
      { command: 'sh', args: ['-c', 'sleep 20'], env: {} },
      { cwd: '/tmp', timeoutMs: 2000, workId: 'live-timeout-item', tier: 'standard', model: 'sonnet', herdrBin: HERDR_BIN },
    );
  } catch (err) {
    caught = err;
  }
  assert.ok(caught instanceof DispatchError);
  assert.equal(caught.errorClass, 'worker-timeout');
  // Give the (best-effort) pane close a moment to actually land, then
  // confirm no `sleep 20` launched by this test is still alive anywhere.
  await new Promise((r) => setTimeout(r, 1500));
  const survivors = execFileSync('sh', ['-c', 'ps -eo args | grep "^sleep 20$" || true'], { encoding: 'utf8' }).trim();
  assert.equal(survivors, '', `expected no surviving "sleep 20" process, found: ${survivors}`);
});

test('herdr-spawn adapter (LIVE): a dispatched prompt that itself mentions "[DONE]" as instructional prose never triggers a false-positive match on its own echoed command line', { skip: HERDR_SKIP }, async () => {
  const herdrSpawn = EXECUTOR_ADAPTERS['herdr-spawn'];
  // The typed command's own text contains "[DONE]" as prose (mirroring a
  // real worker-contract prompt instructing the agent to report it) --
  // BEFORE the real, standalone `[DONE]` line the "worker" prints after a
  // real 2s delay. An unanchored regex matches the echoed prose instantly;
  // this must wait for and match only the real standalone token line.
  const start = Date.now();
  const res = await herdrSpawn(
    {
      command: 'sh',
      args: ['-c', "echo 'Report [DONE] when finished with your task.'; sleep 2; echo '[DONE]'"],
      env: {},
    },
    { cwd: '/tmp', timeoutMs: 10000, workId: 'live-anchor-item', tier: 'standard', model: 'sonnet', herdrBin: HERDR_BIN },
  );
  const elapsedMs = Date.now() - start;
  try {
    assert.ok(elapsedMs >= 1500, `expected to genuinely wait past the 2s sleep for the real token (only waited ${elapsedMs}ms) -- an unanchored regex would match the echoed prose instantly`);
    assert.ok(res.stdout.includes('[DONE]'));
  } finally {
    try { herdrPane(['pane', 'close', res.paneId]); } catch {}
  }
});

test('herdr-spawn adapter (LIVE): "pane split" is called with the required --direction flag -- confirmed by the real binary accepting the call instead of refusing with exit 2', { skip: HERDR_SKIP }, async () => {
  const herdrSpawn = EXECUTOR_ADAPTERS['herdr-spawn'];
  // If --direction were ever dropped again, `herdr pane split` itself
  // refuses (confirmed live, 2026-08-25: exit 2, "usage: herdr pane split
  // ... --direction right|down ...") before a pane is ever created --
  // this adapter would reject worker-spawn-fail immediately. A clean
  // resolve here is the real proof the flag is present and accepted.
  const res = await herdrSpawn(
    { command: 'echo', args: ['direction-flag-ok'], env: {} },
    { cwd: '/tmp', timeoutMs: 10000, workId: 'live-direction-item', tier: 'standard', model: 'sonnet', herdrBin: HERDR_BIN },
  );
  try {
    assert.ok(res.paneId);
    assert.ok(res.stdout.includes('direction-flag-ok'));
  } finally {
    try { herdrPane(['pane', 'close', res.paneId]); } catch {}
  }
});

test('herdr-spawn adapter (LIVE): a worker that prints [DONE] and then keeps running is NOT treated as complete until it actually exits (fifth-round advisor finding)', { skip: HERDR_SKIP }, async () => {
  const herdrSpawn = EXECUTOR_ADAPTERS['herdr-spawn'];
  const start = Date.now();
  const res = await herdrSpawn(
    { command: 'sh', args: ['-c', "echo '[DONE]'; sleep 2; echo still-running-after-done"], env: {} },
    { cwd: '/tmp', timeoutMs: 10000, workId: 'live-early-resolve-item', tier: 'standard', model: 'sonnet', herdrBin: HERDR_BIN },
  );
  const elapsedMs = Date.now() - start;
  try {
    // Matching herdr, having resolved on the [DONE] token alone (the old
    // design) would return in well under a second here -- confirmed live
    // this scenario previously resolved in ~10ms, before the worker had
    // done anything past printing the token.
    assert.ok(elapsedMs >= 1800, `expected to wait for the real exit (~2s), only waited ${elapsedMs}ms -- resolved before the worker actually finished`);
    assert.ok(res.stdout.includes('still-running-after-done'), 'output produced AFTER the [DONE] token must still be captured -- proves this adapter waited for the real exit, not the token');
  } finally {
    try { herdrPane(['pane', 'close', res.paneId]); } catch {}
  }
});

test('herdr-spawn adapter (LIVE): an observer failure (pane closed out from under wait-output) rejects, it is never reported as if it were a worker result (fifth-round advisor finding)', { skip: HERDR_SKIP }, async () => {
  const herdrSpawn = EXECUTOR_ADAPTERS['herdr-spawn'];
  const dispatchPromise = herdrSpawn(
    { command: 'sh', args: ['-c', 'sleep 10'], env: {} },
    { cwd: '/tmp', timeoutMs: 15000, workId: 'live-observer-fail-item', tier: 'standard', model: 'sonnet', herdrBin: HERDR_BIN },
  );
  // Give the adapter a moment to split its own pane and start waiting,
  // then find and close it externally -- exactly the shape of a real
  // observer failure (someone/something else closes the pane, herdr
  // reports an error) this adapter never causes itself. This test owns no
  // /tmp panes of its own beforehand, so every no-agent /tmp pane found
  // here is the adapter's own fresh split.
  await new Promise((r) => setTimeout(r, 500));
  let caught;
  try {
    const panes = JSON.parse(herdrPane(['pane', 'list'])).result.panes.filter((p) => p.cwd === '/tmp' && !p.agent);
    for (const p of panes) {
      try { herdrPane(['pane', 'close', p.pane_id]); } catch {}
    }
    await dispatchPromise;
  } catch (err) {
    caught = err;
  }
  assert.ok(caught instanceof DispatchError, `expected a DispatchError rejection, got: ${caught}`);
});

test('herdr-spawn adapter closes the pane on success path (Requirement 1)', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-pane-close-test-'));
  const { scriptPath, logPath } = createMockHerdrScript(tmpDir);
  const wrapperPath = path.join(tmpDir, 'herdr-wrapper.sh');
  fs.writeFileSync(wrapperPath, `#!/bin/sh\nexec node "${scriptPath}" "$@"\n`);
  fs.chmodSync(wrapperPath, 0o755);

  const herdrSpawn = EXECUTOR_ADAPTERS['herdr-spawn'];
  const res = await herdrSpawn(
    { command: 'echo', args: ['hello'], env: {} },
    { cwd: tmpDir, workId: 'close-test-item', tier: 'standard', model: 'sonnet', herdrBin: wrapperPath },
  );

  assert.ok(res.paneId);
  const calls = fs.readFileSync(logPath, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const closeCalls = calls.filter((c) => c.args[0] === 'pane' && c.args[1] === 'close' && c.args[2] === res.paneId);
  assert.equal(closeCalls.length, 1, 'herdr pane close <paneId> must be called on success path');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('herdr-spawn adapter supports liveOutput config shape & bash PIPESTATUS pipeline (Requirement 2)', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-live-output-test-'));
  const { scriptPath } = createRealisticMockHerdrScript(tmpDir);
  const wrapperPath = path.join(tmpDir, 'herdr-wrapper.sh');
  fs.writeFileSync(wrapperPath, `#!/bin/sh\nexec node "${scriptPath}" "$@"\n`);
  fs.chmodSync(wrapperPath, 0o755);

  const rendererScript = path.join(tmpDir, 'dummy-renderer.mjs');
  fs.writeFileSync(rendererScript, `
import readline from 'node:readline';
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    if (obj.text) process.stdout.write('RENDERED: ' + obj.text + '\\n');
  } catch {}
});
`);

  const herdrSpawn = EXECUTOR_ADAPTERS['herdr-spawn'];
  const invocation = {
    command: 'bash',
    args: ['-c', 'echo "{\\"text\\":\\"streamed-content\\"}"'],
    env: {},
    liveOutput: {
      streamFlags: [],
      renderer: rendererScript,
    },
  };

  const res = await herdrSpawn(invocation, {
    cwd: tmpDir,
    timeoutMs: 5000,
    workId: 'live-output-item',
    tier: 'standard',
    model: 'sonnet',
    herdrBin: wrapperPath,
  });

  assert.equal(res.status, 0);
  assert.ok(res.stdout.includes('RENDERED: streamed-content'), `stdout should contain output from renderer, got: ${JSON.stringify(res.stdout)}`);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('claude-stream-json.mjs live renderer formats JSONL correctly (Requirement 3)', () => {
  const scriptPath = path.resolve('src/runner/dispatch/live-renderers/claude-stream-json.mjs');
  const jsonl = [
    JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hello ' } }),
    JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'world' } }),
    JSON.stringify({ type: 'content_block_start', content_block: { type: 'tool_use', name: 'Bash' } }),
  ].join('\n') + '\n';

  const output = execFileSync(process.execPath, [scriptPath], { input: jsonl, encoding: 'utf8' });
  assert.ok(output.includes('Hello world'));
  assert.ok(output.includes('→ Bash'));
});

test('pi-agent-session.mjs live renderer formats JSONL correctly (Requirement 3)', () => {
  const scriptPath = path.resolve('src/runner/dispatch/live-renderers/pi-agent-session.mjs');
  const jsonl = [
    JSON.stringify({ type: 'message_update', assistantMessageEvent: { type: 'text_delta', delta: 'Pi output line' } }),
    JSON.stringify({ type: 'tool_execution_start', toolName: 'read', args: { path: 'file.txt' } }),
    JSON.stringify({ type: 'tool_execution_end', toolName: 'read', isError: false }),
  ].join('\n') + '\n';

  const output = execFileSync(process.execPath, [scriptPath], { input: jsonl, encoding: 'utf8' });
  assert.ok(output.includes('Pi output line'));
  assert.ok(output.includes('→ read'));
  assert.ok(output.includes('← read [OK]'));
});

test('herdr-spawn adapter (LIVE): dispatch via real agy-herdr executor against real herdr and agy binaries (Requirement 5)', { skip: AGY_HERDR_SKIP }, async () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'live-agy-proof-'));
  execFileSync('git', ['init'], { cwd: tmpRoot });
  execFileSync('git', ['commit', '--allow-empty', '-m', 'initial'], { cwd: tmpRoot });

  const root = path.resolve('.');
  const res = await executeExecutorCli('agy-herdr', {
    prompt: 'Print Hello from agy-herdr live proof and exit. Write [DONE] when done.',
    repoRoot: root,
    cwd: tmpRoot,
    tier: 'light',
  });

  try {
    assert.equal(res.status, 0);
    assert.ok(res.stdout.includes('Hello from agy-herdr live proof'));
    assert.ok(res.stdout.includes('[DONE]'));
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});
