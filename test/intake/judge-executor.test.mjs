import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runJudgeExecutor, readScoutNotes } from '../../src/intake/judge-executor.mjs';

// Fake executors only — every "command" spawned here is a node script this
// file writes to a mkdtemp directory at test time, mirroring
// discovery.test.mjs's convention. No real agent CLI is ever invoked.
// Each fake executor also tracks its own invocation count via a counter
// file on disk (the only way to count across separate spawnSync processes),
// which the retry-once tests below assert on directly.

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-judge-executor-test-'));
}

function readCount(counterPath) {
  return fs.existsSync(counterPath) ? parseInt(fs.readFileSync(counterPath, 'utf8'), 10) : 0;
}

function writeValidExecutor(dir, verdict) {
  const scriptPath = path.join(dir, 'valid-executor.mjs');
  const counterPath = path.join(dir, 'valid-count.txt');
  fs.writeFileSync(counterPath, '0');
  fs.writeFileSync(
    scriptPath,
    `
    import fs from 'node:fs';
    const counterPath = ${JSON.stringify(counterPath)};
    fs.writeFileSync(counterPath, String(parseInt(fs.readFileSync(counterPath, 'utf8'), 10) + 1));
    process.stdout.write(${JSON.stringify(JSON.stringify(verdict))});
    process.exit(0);
    `,
  );
  return { scriptPath, counterPath };
}

function writeRawStdoutExecutor(dir, rawStdout) {
  const scriptPath = path.join(dir, 'raw-executor.mjs');
  const counterPath = path.join(dir, 'raw-count.txt');
  fs.writeFileSync(counterPath, '0');
  fs.writeFileSync(
    scriptPath,
    `
    import fs from 'node:fs';
    const counterPath = ${JSON.stringify(counterPath)};
    fs.writeFileSync(counterPath, String(parseInt(fs.readFileSync(counterPath, 'utf8'), 10) + 1));
    process.stdout.write(${JSON.stringify(rawStdout)});
    process.exit(0);
    `,
  );
  return { scriptPath, counterPath };
}

function writeFailingExecutor(dir, exitCode = 1) {
  const scriptPath = path.join(dir, 'failing-executor.mjs');
  const counterPath = path.join(dir, 'failing-count.txt');
  fs.writeFileSync(counterPath, '0');
  fs.writeFileSync(
    scriptPath,
    `
    import fs from 'node:fs';
    const counterPath = ${JSON.stringify(counterPath)};
    fs.writeFileSync(counterPath, String(parseInt(fs.readFileSync(counterPath, 'utf8'), 10) + 1));
    process.exit(${exitCode});
    `,
  );
  return { scriptPath, counterPath };
}

function writeHangingExecutor(dir) {
  const scriptPath = path.join(dir, 'hanging-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
    const until = Date.now() + 30000;
    while (Date.now() < until) { /* busy-wait past any test timeout */ }
    process.exit(0);
    `,
  );
  return scriptPath;
}

// Returns unparsable stdout on invocation 1, a valid verdict on invocation 2
// — proves the retry-once path resolves to the SECOND attempt's verdict.
function writeFlakyThenValidExecutor(dir, badStdout, validVerdict) {
  const scriptPath = path.join(dir, 'flaky-then-valid-executor.mjs');
  const counterPath = path.join(dir, 'flaky-count.txt');
  fs.writeFileSync(counterPath, '0');
  fs.writeFileSync(
    scriptPath,
    `
    import fs from 'node:fs';
    const counterPath = ${JSON.stringify(counterPath)};
    const n = parseInt(fs.readFileSync(counterPath, 'utf8'), 10) + 1;
    fs.writeFileSync(counterPath, String(n));
    if (n === 1) {
      process.stdout.write(${JSON.stringify(badStdout)});
    } else {
      process.stdout.write(${JSON.stringify(JSON.stringify(validVerdict))});
    }
    process.exit(0);
    `,
  );
  return { scriptPath, counterPath };
}

// Returns unparsable stdout on invocation 1 (parse-shaped), then exits
// non-zero on invocation 2 (non-parse failure ON the retry itself) — proves
// D3: any retry failure, parse-shaped or not, resolves to null.
function writeParseThenNonParseExecutor(dir) {
  const scriptPath = path.join(dir, 'parse-then-nonparse-executor.mjs');
  const counterPath = path.join(dir, 'parse-then-nonparse-count.txt');
  fs.writeFileSync(counterPath, '0');
  fs.writeFileSync(
    scriptPath,
    `
    import fs from 'node:fs';
    const counterPath = ${JSON.stringify(counterPath)};
    const n = parseInt(fs.readFileSync(counterPath, 'utf8'), 10) + 1;
    fs.writeFileSync(counterPath, String(n));
    if (n === 1) {
      process.stdout.write('not json at all');
      process.exit(0);
    } else {
      process.exit(9);
    }
    `,
  );
  return { scriptPath, counterPath };
}

// Echoes back which prompt argument it received, but only after the first
// (unparsable) invocation — proves the retry attempt actually sends
// `stricterPrompt`, not `prompt` again.
function writeFlakyEchoExecutor(dir) {
  const scriptPath = path.join(dir, 'flaky-echo-executor.mjs');
  const counterPath = path.join(dir, 'flaky-echo-count.txt');
  fs.writeFileSync(counterPath, '0');
  fs.writeFileSync(
    scriptPath,
    `
    import fs from 'node:fs';
    const counterPath = ${JSON.stringify(counterPath)};
    const n = parseInt(fs.readFileSync(counterPath, 'utf8'), 10) + 1;
    fs.writeFileSync(counterPath, String(n));
    const prompt = process.argv[2];
    if (n === 1) {
      process.stdout.write('not json at all');
    } else {
      process.stdout.write(JSON.stringify({ echoed: prompt }));
    }
    process.exit(0);
    `,
  );
  return scriptPath;
}

// Returns unparsable stdout on invocations 1 and 2, a valid verdict on
// invocation 3 — proves the 3rd (2nd retry) attempt can still succeed.
function writeFlakyTwiceThenValidExecutor(dir, badStdout, validVerdict) {
  const scriptPath = path.join(dir, 'flaky-twice-then-valid-executor.mjs');
  const counterPath = path.join(dir, 'flaky-twice-count.txt');
  fs.writeFileSync(counterPath, '0');
  fs.writeFileSync(
    scriptPath,
    `
    import fs from 'node:fs';
    const counterPath = ${JSON.stringify(counterPath)};
    const n = parseInt(fs.readFileSync(counterPath, 'utf8'), 10) + 1;
    fs.writeFileSync(counterPath, String(n));
    if (n < 3) {
      process.stdout.write(${JSON.stringify(badStdout)});
    } else {
      process.stdout.write(${JSON.stringify(JSON.stringify(validVerdict))});
    }
    process.exit(0);
    `,
  );
  return { scriptPath, counterPath };
}

function cfgFor(scriptPath, overrides = {}) {
  return {
    executor: { command: process.execPath, args: [scriptPath, '{prompt}'] },
    timeoutMs: 5000,
    ...overrides,
  };
}

test('runJudgeExecutor returns the parsed verdict on a clean first attempt, with no retry', () => {
  const dir = mkTempDir();
  const { scriptPath, counterPath } = writeValidExecutor(dir, { clear: true });
  const cfg = cfgFor(scriptPath);
  const verdict = runJudgeExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt');
  assert.deepEqual(verdict, { clear: true });
  assert.equal(readCount(counterPath), 1);
});

test('runJudgeExecutor retries once with the stricter prompt on a parse-shaped failure and returns the retry verdict', () => {
  const dir = mkTempDir();
  const { scriptPath, counterPath } = writeFlakyThenValidExecutor(dir, 'not json at all', { clear: true, verify: 'ok' });
  const cfg = cfgFor(scriptPath);
  const verdict = runJudgeExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt');
  assert.deepEqual(verdict, { clear: true, verify: 'ok' });
  assert.equal(readCount(counterPath), 2);
});

test('runJudgeExecutor sends the stricter prompt (not the original) on the retry attempt', () => {
  const dir = mkTempDir();
  const scriptPath = writeFlakyEchoExecutor(dir);
  const cfg = cfgFor(scriptPath);
  const verdict = runJudgeExecutor(cfg, 'sonnet', 'original prompt', 'STRICTER SUFFIX prompt');
  assert.equal(verdict.echoed, 'STRICTER SUFFIX prompt');
});

test('runJudgeExecutor strips a ```json ... ``` code fence and parses the wrapped verdict on the first attempt, with no retry', () => {
  const dir = mkTempDir();
  const { scriptPath, counterPath } = writeRawStdoutExecutor(dir, '```json\n{"clear": true, "verify": "ok"}\n```');
  const cfg = cfgFor(scriptPath);
  const verdict = runJudgeExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt');
  assert.deepEqual(verdict, { clear: true, verify: 'ok' });
  assert.equal(readCount(counterPath), 1);
});

test('runJudgeExecutor strips a bare ``` ... ``` fence (no language tag) and parses the wrapped verdict', () => {
  const dir = mkTempDir();
  const { scriptPath, counterPath } = writeRawStdoutExecutor(dir, '```\n{"clear": false, "question": "why?"}\n```');
  const cfg = cfgFor(scriptPath);
  const verdict = runJudgeExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt');
  assert.deepEqual(verdict, { clear: false, question: 'why?' });
  assert.equal(readCount(counterPath), 1);
});

test('runJudgeExecutor returns null (fail-safe) when all three attempts hit a parse-shaped failure (nested-judge-fix)', () => {
  const dir = mkTempDir();
  const { scriptPath, counterPath } = writeRawStdoutExecutor(dir, 'not json at all');
  const cfg = cfgFor(scriptPath);
  const verdict = runJudgeExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt');
  assert.equal(verdict, null);
  assert.equal(readCount(counterPath), 3);
});

test('runJudgeExecutor succeeds on the third attempt (second retry) after two parse-shaped failures (nested-judge-fix)', () => {
  const dir = mkTempDir();
  const { scriptPath, counterPath } = writeFlakyTwiceThenValidExecutor(dir, 'not json at all', { clear: true, verify: 'ok' });
  const cfg = cfgFor(scriptPath);
  const verdict = runJudgeExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt');
  assert.deepEqual(verdict, { clear: true, verify: 'ok' });
  assert.equal(readCount(counterPath), 3);
});

test('runJudgeExecutor treats a parsed non-object (array) as a parse-shaped failure and retries', () => {
  const dir = mkTempDir();
  const { scriptPath, counterPath } = writeFlakyThenValidExecutor(dir, '[1,2,3]', { clear: true });
  const cfg = cfgFor(scriptPath);
  const verdict = runJudgeExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt');
  assert.deepEqual(verdict, { clear: true });
  assert.equal(readCount(counterPath), 2);
});

test('runJudgeExecutor returns null immediately (no retry) on a non-parse failure — non-zero exit', () => {
  const dir = mkTempDir();
  const { scriptPath, counterPath } = writeFailingExecutor(dir, 7);
  const cfg = cfgFor(scriptPath);
  const verdict = runJudgeExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt');
  assert.equal(verdict, null);
  assert.equal(readCount(counterPath), 1);
});

test('runJudgeExecutor returns null immediately when the configured command does not exist (spawn fail)', () => {
  const cfg = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    timeoutMs: 5000,
  };
  const verdict = runJudgeExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt');
  assert.equal(verdict, null);
});

test('runJudgeExecutor returns null when a parse-shaped failure on attempt 1 is followed by a non-parse failure on the retry', () => {
  const dir = mkTempDir();
  const { scriptPath, counterPath } = writeParseThenNonParseExecutor(dir);
  const cfg = cfgFor(scriptPath);
  const verdict = runJudgeExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt');
  assert.equal(verdict, null);
  assert.equal(readCount(counterPath), 2);
});

test('runJudgeExecutor fails safe (no retry) when the first attempt hangs past cfg.timeoutMs', () => {
  const dir = mkTempDir();
  const scriptPath = writeHangingExecutor(dir);
  const cfg = cfgFor(scriptPath, { timeoutMs: 200 });
  const verdict = runJudgeExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt');
  assert.equal(verdict, null);
});

// tsk-62d D2: spawnAttempt passes `tier: 'judge'` to resolveExecutorCommand
// (dispatch.mjs's existing generic tier-keyed executors lookup, reused as a
// synthetic role key) — an `executors.judge` override must win over the
// base `executor`, and the base `executor` here is a failing script so a
// verdict can only come back if the override was actually honored.
test('runJudgeExecutor resolves through cfg.executors.judge when present, ahead of the base cfg.executor', () => {
  const dir = mkTempDir();
  const { scriptPath: failingScript } = writeFailingExecutor(dir);
  const { scriptPath: judgeScript, counterPath } = writeValidExecutor(dir, { clear: true, verify: 'from judge override' });
  const cfg = {
    executor: { command: process.execPath, args: [failingScript, '{prompt}'] },
    executors: { judge: { command: process.execPath, args: [judgeScript, '{prompt}'] } },
    timeoutMs: 5000,
  };
  const verdict = runJudgeExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt');
  assert.deepEqual(verdict, { clear: true, verify: 'from judge override' });
  assert.equal(readCount(counterPath), 1);
});

// Absent-safe fallback (D2): a config with no `executors.judge` block must
// still resolve through the base `executor`, byte-identical to pre-tsk-62d
// behavior — no regression for every operator config that never opts in.
test('runJudgeExecutor falls back to the base cfg.executor when cfg.executors.judge is absent', () => {
  const dir = mkTempDir();
  const { scriptPath, counterPath } = writeValidExecutor(dir, { clear: false, question: 'from base executor' });
  const cfg = cfgFor(scriptPath);
  const verdict = runJudgeExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt');
  assert.deepEqual(verdict, { clear: false, question: 'from base executor' });
  assert.equal(readCount(counterPath), 1);
});

// --- tsk-g18: parent-side scout-notes persistence (Cách B) -----------------

function ndjson(events) {
  return `${events.map((e) => JSON.stringify(e)).join('\n')}\n`;
}

// Fake `claude -p --output-format stream-json` transcript: one Bash(rg:*)
// tool_use/tool_result pair plus the terminal `result` event carrying the
// judge's actual verdict JSON — the exact shape extractScoutTranscript
// (judge-executor.mjs) parses.
function writeStreamJsonExecutor(dir, { rgCommand = 'rg foo src/', rgOutput = 'src/foo.mjs:12:function foo() {}', resultVerdict }) {
  const scriptPath = path.join(dir, 'stream-json-executor.mjs');
  const events = [
    { type: 'system', subtype: 'init' },
    {
      type: 'assistant',
      message: { role: 'assistant', content: [{ type: 'tool_use', id: 'tool_1', name: 'Bash', input: { command: rgCommand } }] },
    },
    {
      type: 'user',
      message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tool_1', content: rgOutput }] },
    },
    { type: 'result', subtype: 'success', result: JSON.stringify(resultVerdict) },
  ];
  fs.writeFileSync(scriptPath, `process.stdout.write(${JSON.stringify(ndjson(events))}); process.exit(0);`);
  return scriptPath;
}

function writeArgvRecordingExecutor(dir, argvPath, stdoutContent) {
  const scriptPath = path.join(dir, 'argv-recording-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
    import fs from 'node:fs';
    fs.writeFileSync(${JSON.stringify(argvPath)}, JSON.stringify(process.argv.slice(2)));
    process.stdout.write(${JSON.stringify(stdoutContent)});
    process.exit(0);
    `,
  );
  return scriptPath;
}

test('readScoutNotes returns "" for a missing docsRef, an absent file, and trims a present one', () => {
  const repoRoot = mkTempDir();
  assert.equal(readScoutNotes(repoRoot, ''), '');
  assert.equal(readScoutNotes(repoRoot, undefined), '');
  assert.equal(readScoutNotes(repoRoot, 'docs/history/no-such-item'), '');

  const featureDir = path.join(repoRoot, 'docs/history/real-item');
  fs.mkdirSync(featureDir, { recursive: true });
  fs.writeFileSync(path.join(featureDir, 'scout-notes.md'), '  ## Scout 1\n\ncontent  \n');
  assert.equal(readScoutNotes(repoRoot, 'docs/history/real-item'), '## Scout 1\n\ncontent');
});

// Cách B core proof: a capture:true call parses the stream-json transcript,
// resolves the verdict from the terminal `result` event (never the raw
// NDJSON stdout), and persists the Bash(rg:*) call/output pair to
// docs/history/<docsRef>/scout-notes.md — written by THIS parent code, never
// by the judge subprocess (which was never granted Write).
test('runJudgeExecutor with scout.capture:true parses the stream-json transcript, resolves the verdict from the result event, and persists the Bash(rg:*) transcript to scout-notes.md', () => {
  const dir = mkTempDir();
  const repoRoot = mkTempDir();
  const scriptPath = writeStreamJsonExecutor(dir, {
    rgCommand: 'rg TODO src/',
    rgOutput: 'src/a.mjs:3:// TODO fix',
    resultVerdict: { clear: true, verify: 'npm test -- from scout' },
  });
  const cfg = cfgFor(scriptPath);

  const verdict = runJudgeExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt', {
    repoRoot,
    docsRef: 'docs/history/tsk-scout-x',
    capture: true,
  });

  assert.deepEqual(verdict, { clear: true, verify: 'npm test -- from scout' });

  const notes = readScoutNotes(repoRoot, 'docs/history/tsk-scout-x');
  assert.match(notes, /rg TODO src\//);
  assert.match(notes, /src\/a\.mjs:3:\/\/ TODO fix/);
});

// A tool_use that is not an `rg` call (e.g. `ls`) must never be captured —
// only Bash(rg:*) is the scout signal this item cares about — and with no
// captured entries, writeScoutNotes must not create a file at all.
test('runJudgeExecutor with scout.capture:true captures only Bash(rg:*) calls, never other tool calls, and writes no file when none were rg', () => {
  const dir = mkTempDir();
  const repoRoot = mkTempDir();
  const scriptPath = writeStreamJsonExecutor(dir, {
    rgCommand: 'ls -la src/',
    rgOutput: 'a.mjs\nb.mjs',
    resultVerdict: { clear: false, question: 'from non-rg tool call' },
  });
  const cfg = cfgFor(scriptPath);

  const verdict = runJudgeExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt', {
    repoRoot,
    docsRef: 'docs/history/tsk-scout-y',
    capture: true,
  });

  assert.deepEqual(verdict, { clear: false, question: 'from non-rg tool call' });
  assert.equal(readScoutNotes(repoRoot, 'docs/history/tsk-scout-y'), '');
  assert.equal(fs.existsSync(path.join(repoRoot, 'docs/history/tsk-scout-y', 'scout-notes.md')), false);
});

// scout.capture:false (fresh notes already exist, per the caller's own
// freshness check) must spawn exactly like a pre-tsk-g18 call: no
// `--output-format`/`--verbose` flags appended, and no scout-notes.md
// write — there is nothing new to persist.
test('runJudgeExecutor with scout.capture:false spawns without the stream-json flags and writes no scout-notes.md', () => {
  const dir = mkTempDir();
  const repoRoot = mkTempDir();
  const argvPath = path.join(dir, 'argv.json');
  const scriptPath = writeArgvRecordingExecutor(dir, argvPath, JSON.stringify({ clear: true, verify: 'npm test -- reused notes' }));
  const cfg = cfgFor(scriptPath);

  const verdict = runJudgeExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt', {
    repoRoot,
    docsRef: 'docs/history/tsk-scout-z',
    capture: false,
  });

  assert.deepEqual(verdict, { clear: true, verify: 'npm test -- reused notes' });
  const argv = JSON.parse(fs.readFileSync(argvPath, 'utf8'));
  assert.equal(argv.includes('--output-format'), false);
  assert.equal(argv.includes('stream-json'), false);
  assert.equal(fs.existsSync(path.join(repoRoot, 'docs/history/tsk-scout-z', 'scout-notes.md')), false);
});

// Omitting `scout` entirely (every pre-tsk-g18 caller) must spawn without
// the stream-json flags too — this is the same guarantee the test above
// proves for capture:false, pinned separately since "omitted" and
// "capture:false" are two different inputs reaching the same code path.
test('runJudgeExecutor with scout omitted spawns without the stream-json flags (byte-identical to pre-tsk-g18)', () => {
  const dir = mkTempDir();
  const argvPath = path.join(dir, 'argv.json');
  const scriptPath = writeArgvRecordingExecutor(dir, argvPath, JSON.stringify({ clear: true, verify: 'npm test -- no scout arg' }));
  const cfg = cfgFor(scriptPath);

  const verdict = runJudgeExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt');

  assert.deepEqual(verdict, { clear: true, verify: 'npm test -- no scout arg' });
  const argv = JSON.parse(fs.readFileSync(argvPath, 'utf8'));
  assert.equal(argv.includes('--output-format'), false);
});
