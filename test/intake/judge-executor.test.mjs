import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runJudgeExecutor, JUDGE_CALLER_CONTEXT_PREAMBLE } from '../../src/intake/judge-executor.mjs';

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

// Echoes back the prompt argument it received on every invocation as a
// valid JSON verdict — proves the caller-context preamble is prepended to
// whatever this fake executor actually receives on argv.
function writeEchoExecutor(dir) {
  const scriptPath = path.join(dir, 'echo-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
    const prompt = process.argv[2];
    process.stdout.write(JSON.stringify({ echoed: prompt }));
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

test('runJudgeExecutor retries once with the stricter prompt on a parse-shaped failure and returns the retry verdict (str68 D2)', () => {
  const dir = mkTempDir();
  const { scriptPath, counterPath } = writeFlakyThenValidExecutor(dir, 'not json at all', { clear: true, verify: 'ok' });
  const cfg = cfgFor(scriptPath);
  const verdict = runJudgeExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt');
  assert.deepEqual(verdict, { clear: true, verify: 'ok' });
  assert.equal(readCount(counterPath), 2);
});

test('runJudgeExecutor sends the stricter prompt (not the original) on the retry attempt (str68 D2)', () => {
  const dir = mkTempDir();
  const scriptPath = writeFlakyEchoExecutor(dir);
  const cfg = cfgFor(scriptPath);
  const verdict = runJudgeExecutor(cfg, 'sonnet', 'original prompt', 'STRICTER SUFFIX prompt');
  assert.equal(verdict.echoed, JUDGE_CALLER_CONTEXT_PREAMBLE + 'STRICTER SUFFIX prompt');
});

test('runJudgeExecutor prepends JUDGE_CALLER_CONTEXT_PREAMBLE to the prompt sent to the executor (str68 nested-judge-fix)', () => {
  const dir = mkTempDir();
  const scriptPath = writeEchoExecutor(dir);
  const cfg = cfgFor(scriptPath);
  const verdict = runJudgeExecutor(cfg, 'sonnet', 'original prompt', 'stricter prompt');
  assert.equal(verdict.echoed, JUDGE_CALLER_CONTEXT_PREAMBLE + 'original prompt');
  assert.ok(verdict.echoed.startsWith(JUDGE_CALLER_CONTEXT_PREAMBLE));
});

test('runJudgeExecutor returns null (fail-safe) when all three attempts hit a parse-shaped failure (str68 D3, nested-judge-fix)', () => {
  const dir = mkTempDir();
  const { scriptPath, counterPath } = writeRawStdoutExecutor(dir, 'not json at all');
  const cfg = cfgFor(scriptPath);
  const verdict = runJudgeExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt');
  assert.equal(verdict, null);
  assert.equal(readCount(counterPath), 3);
});

test('runJudgeExecutor succeeds on the third attempt (second retry) after two parse-shaped failures (str68 nested-judge-fix)', () => {
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

test('runJudgeExecutor returns null immediately (no retry) on a non-parse failure — non-zero exit (str68 D2)', () => {
  const dir = mkTempDir();
  const { scriptPath, counterPath } = writeFailingExecutor(dir, 7);
  const cfg = cfgFor(scriptPath);
  const verdict = runJudgeExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt');
  assert.equal(verdict, null);
  assert.equal(readCount(counterPath), 1);
});

test('runJudgeExecutor returns null immediately when the configured command does not exist (spawn fail, str68 D2)', () => {
  const cfg = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    timeoutMs: 5000,
  };
  const verdict = runJudgeExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt');
  assert.equal(verdict, null);
});

test('runJudgeExecutor returns null when a parse-shaped failure on attempt 1 is followed by a non-parse failure on the retry (str68 D3)', () => {
  const dir = mkTempDir();
  const { scriptPath, counterPath } = writeParseThenNonParseExecutor(dir);
  const cfg = cfgFor(scriptPath);
  const verdict = runJudgeExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt');
  assert.equal(verdict, null);
  assert.equal(readCount(counterPath), 2);
});

test('runJudgeExecutor fails safe (no retry) when the first attempt hangs past cfg.timeoutMs (str68 D4)', () => {
  const dir = mkTempDir();
  const scriptPath = writeHangingExecutor(dir);
  const cfg = cfgFor(scriptPath, { timeoutMs: 200 });
  const verdict = runJudgeExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt');
  assert.equal(verdict, null);
});
