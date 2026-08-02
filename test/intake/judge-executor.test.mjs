import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runJudgeExecutor, runRetryingExecutor, readScoutNotes } from '../../src/intake/judge-executor.mjs';
import { RunnerConfigError } from '../../src/runner/dispatch.mjs';
import { initStore, registerTool } from '../../src/state/store.mjs';
import { writeLocalStatus } from '../../src/state/tool-registry.mjs';

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

// Echoes back whichever prompt argument it received, on its one and only
// invocation — used to prove which prompt an escalation attempt actually
// sends, without needing a multi-invocation counter.
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

// tsk-2yp: capacityId/fgosDir wiring — capacities.<capacityId> now wins
// ahead of executors.<tier> for judge dispatch too, mirroring dispatch.mjs's
// own resolveExecutorConfig precedence tests.

test('runJudgeExecutor resolves through cfg.capacities.<capacityId> when configured, ahead of cfg.executors.judge', () => {
  const dir = mkTempDir();
  const { scriptPath: judgeScript } = writeValidExecutor(dir, { clear: false, question: 'from executors.judge' });
  const { scriptPath: capacityScript, counterPath } = writeValidExecutor(dir, { clear: true, verify: 'from capacity' });
  const cfg = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    executors: { judge: { command: process.execPath, args: [judgeScript, '{prompt}'] } },
    capacities: { 'judge-discovery': { command: process.execPath, args: [capacityScript, '{prompt}'] } },
    timeoutMs: 5000,
  };
  const verdict = runJudgeExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt', undefined, 'judge-discovery');
  assert.deepEqual(verdict, { clear: true, verify: 'from capacity' });
  assert.equal(readCount(counterPath), 1);
});

test('runJudgeExecutor falls back to cfg.executors.judge unchanged when capacityId is given but has no matching capacities entry', () => {
  const dir = mkTempDir();
  const { scriptPath, counterPath } = writeValidExecutor(dir, { clear: true, verify: 'from executors.judge' });
  const cfg = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    executors: { judge: { command: process.execPath, args: [scriptPath, '{prompt}'] } },
    timeoutMs: 5000,
  };
  const verdict = runJudgeExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt', undefined, 'judge-decompose');
  assert.deepEqual(verdict, { clear: true, verify: 'from executors.judge' });
  assert.equal(readCount(counterPath), 1);
});

test('runJudgeExecutor throws (propagates RunnerConfigError, no catch at this layer) when a kind:"cli" capacity is not registered and fgosDir is given', () => {
  const dir = mkTempDir();
  initStore(dir);
  const cfg = {
    executor: { command: process.execPath, args: [writeValidExecutor(dir, { clear: true }).scriptPath, '{prompt}'] },
    capacities: { 'judge-discovery': { kind: 'cli', command: 'agy-definitely-not-registered-xyz', args: ['{prompt}'] } },
    timeoutMs: 5000,
  };
  assert.throws(
    () => runJudgeExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt', undefined, 'judge-discovery', dir),
    RunnerConfigError,
  );
});

test('runJudgeExecutor skips the kind:"cli" presence check (byte-identical) when fgosDir is omitted, even with a matching capacities entry', () => {
  const dir = mkTempDir();
  const { scriptPath, counterPath } = writeValidExecutor(dir, { clear: true, verify: 'from capacity, no presence check' });
  const cfg = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    capacities: {
      'judge-discovery': { kind: 'cli', command: process.execPath, args: [scriptPath, '{prompt}'], allowCrossProvider: true },
    },
    timeoutMs: 5000,
  };
  const verdict = runJudgeExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt', undefined, 'judge-discovery');
  assert.deepEqual(verdict, { clear: true, verify: 'from capacity, no presence check' });
  assert.equal(readCount(counterPath), 1);
});

// tsk-418-2: runRetryingExecutor's opt-in escalation step. `runJudgeExecutor`
// never passes `escalateTier`, so every test above stays byte-identical —
// these tests call the generic function directly instead.

test('runRetryingExecutor escalates to escalateTier after base attempts exhaust on parse-shaped failures', () => {
  const dir = mkTempDir();
  const { scriptPath: baseScript, counterPath: baseCount } = writeRawStdoutExecutor(dir, 'not json at all');
  const { scriptPath: fallbackScript, counterPath: fallbackCount } = writeValidExecutor(dir, { clear: true, verify: 'from fallback' });
  const cfg = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    executors: {
      primary: { command: process.execPath, args: [baseScript, '{prompt}'] },
      fallback: { command: process.execPath, args: [fallbackScript, '{prompt}'] },
    },
    timeoutMs: 5000,
  };
  const verdict = runRetryingExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt', {
    tier: 'primary',
    maxAttempts: 3,
    escalateTier: 'fallback',
  });
  assert.deepEqual(verdict, { clear: true, verify: 'from fallback' });
  assert.equal(readCount(baseCount), 3);
  assert.equal(readCount(fallbackCount), 1);
});

test('runRetryingExecutor escalates to escalateTier after an immediate non-parse failure (no base retries)', () => {
  const dir = mkTempDir();
  const { scriptPath: baseScript, counterPath: baseCount } = writeFailingExecutor(dir, 9);
  const { scriptPath: fallbackScript, counterPath: fallbackCount } = writeValidExecutor(dir, { clear: true });
  const cfg = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    executors: {
      primary: { command: process.execPath, args: [baseScript, '{prompt}'] },
      fallback: { command: process.execPath, args: [fallbackScript, '{prompt}'] },
    },
    timeoutMs: 5000,
  };
  const verdict = runRetryingExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt', {
    tier: 'primary',
    maxAttempts: 3,
    escalateTier: 'fallback',
  });
  assert.deepEqual(verdict, { clear: true });
  assert.equal(readCount(baseCount), 1);
  assert.equal(readCount(fallbackCount), 1);
});

test('runRetryingExecutor sends stricterPrompt (not the original prompt) to the escalation attempt', () => {
  const dir = mkTempDir();
  const { scriptPath: baseScript } = writeFailingExecutor(dir);
  const echoScript = writeEchoExecutor(dir);
  const cfg = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    executors: {
      primary: { command: process.execPath, args: [baseScript, '{prompt}'] },
      fallback: { command: process.execPath, args: [echoScript, '{prompt}'] },
    },
    timeoutMs: 5000,
  };
  const verdict = runRetryingExecutor(cfg, 'sonnet', 'original prompt', 'stricter prompt', {
    tier: 'primary',
    maxAttempts: 1,
    escalateTier: 'fallback',
  });
  assert.deepEqual(verdict, { echoed: 'stricter prompt' });
});

test('runRetryingExecutor returns null when escalateTier is not declared and base attempts exhaust — zero-config unchanged behavior', () => {
  const dir = mkTempDir();
  const { scriptPath } = writeFailingExecutor(dir);
  const cfg = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    executors: { primary: { command: process.execPath, args: [scriptPath, '{prompt}'] } },
    timeoutMs: 5000,
  };
  const verdict = runRetryingExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt', {
    tier: 'primary',
    maxAttempts: 2,
  });
  assert.equal(verdict, null);
});

test('runRetryingExecutor returns null when the escalation attempt itself fails — single-shot, no further retry', () => {
  const dir = mkTempDir();
  const fallbackDir = mkTempDir();
  const { scriptPath: baseScript } = writeFailingExecutor(dir, 1);
  const { scriptPath: fallbackScript, counterPath: fallbackCount } = writeFailingExecutor(fallbackDir, 2);
  const cfg = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    executors: {
      primary: { command: process.execPath, args: [baseScript, '{prompt}'] },
      fallback: { command: process.execPath, args: [fallbackScript, '{prompt}'] },
    },
    timeoutMs: 5000,
  };
  const verdict = runRetryingExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt', {
    tier: 'primary',
    maxAttempts: 1,
    escalateTier: 'fallback',
  });
  assert.equal(verdict, null);
  assert.equal(readCount(fallbackCount), 1);
});

// D3 (docs/history/agent-executor-retry-escalate-helper/CONTEXT.md): a
// non-judge capacity opts into the same retry/escalate helper via a test
// double, standing in for a real capacity like tsk-5l2's
// submit-assist-classify — this item's own scope stops at proving the
// helper is reusable, not at wiring a real second consumer.
test('a non-judge test-double capacity opts into runRetryingExecutor with its own tier and escalateTier', () => {
  const dir = mkTempDir();
  const { scriptPath: classifyScript } = writeRawStdoutExecutor(dir, 'não consigo responder em json');
  const { scriptPath: fallbackScript } = writeValidExecutor(dir, { tier: 'light', kind: 'bug', risk: 'low' });
  const cfg = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    executors: {
      'submit-assist-classify': { command: process.execPath, args: [classifyScript, '{prompt}'] },
      'submit-assist-classify-fallback': { command: process.execPath, args: [fallbackScript, '{prompt}'] },
    },
    timeoutMs: 5000,
  };
  // Stands in for a real capacity's own dispatch call — not judge-executor's
  // internal wrapper — demonstrating the helper is genuinely capacity-agnostic.
  const verdict = runRetryingExecutor(cfg, 'haiku', 'classify this task', 'classify this task, JSON only', {
    tier: 'submit-assist-classify',
    maxAttempts: 2,
    escalateTier: 'submit-assist-classify-fallback',
  });
  assert.deepEqual(verdict, { tier: 'light', kind: 'bug', risk: 'low' });
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

// tsk-4rd (route A, discussion point 4): `scoutCaptureOut`, the optional
// 9th out-param, lets a caller read back how many scoutable tool calls this
// attempt made — the same `.entries` the throwaway internal `{}` always
// held, just exposed instead of discarded. Return shape (bare verdict) is
// unchanged either way.
test('runJudgeExecutor populates a supplied scoutCaptureOut with the captured entries, without changing its own return shape', () => {
  const dir = mkTempDir();
  const repoRoot = mkTempDir();
  const scriptPath = writeStreamJsonExecutor(dir, {
    rgCommand: 'rg TODO src/',
    rgOutput: 'src/a.mjs:3:// TODO fix',
    resultVerdict: { clear: true, verify: 'npm test -- from scout' },
  });
  const cfg = cfgFor(scriptPath);
  const scoutCaptureOut = {};

  const verdict = runJudgeExecutor(
    cfg,
    'sonnet',
    'prompt',
    'stricter prompt',
    { repoRoot, docsRef: 'docs/history/tsk-scout-out', capture: true },
    undefined,
    undefined,
    scoutCaptureOut,
  );

  assert.deepEqual(verdict, { clear: true, verify: 'npm test -- from scout' });
  assert.equal(scoutCaptureOut.entries.length, 1);
  assert.equal(scoutCaptureOut.entries[0].command, 'rg TODO src/');
});

test('runJudgeExecutor omitting scoutCaptureOut stays byte-identical (every pre-tsk-4rd caller, incl. judgeDecompose)', () => {
  const dir = mkTempDir();
  const repoRoot = mkTempDir();
  const scriptPath = writeStreamJsonExecutor(dir, {
    resultVerdict: { clear: true, verify: 'npm test -- unaffected' },
  });
  const cfg = cfgFor(scriptPath);

  const verdict = runJudgeExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt', {
    repoRoot,
    docsRef: 'docs/history/tsk-scout-no-out',
    capture: true,
  });

  assert.deepEqual(verdict, { clear: true, verify: 'npm test -- unaffected' });
  assert.equal(fs.existsSync(path.join(repoRoot, 'docs/history/tsk-scout-no-out', 'scout-notes.md')), true);
});

// A Bash tool_use that is not an `rg` call (e.g. `ls`) must never be
// captured — a non-rg Bash call is an action (or noise), never the scout
// signal this item cares about — and with no captured entries,
// writeScoutNotes must not create a file at all.
test('runJudgeExecutor with scout.capture:true never captures a non-rg Bash call, and writes no file when none were captured', () => {
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

// tsk-4rd (route A): widened `--allowedTools` (Task/WebSearch/WebFetch/Read
// alongside the original Bash(rg:*)) means a scout pass may now legitimately
// use any of those instead of `rg` — this proves a non-Bash scoutable tool
// (WebSearch here) is captured and persisted exactly like an rg call always
// was, unconditionally (no command-text filter the way Bash gets one).
test('runJudgeExecutor with scout.capture:true also captures a WebSearch tool_use (route A: widened allowedTools), not just Bash(rg:*)', () => {
  const dir = mkTempDir();
  const repoRoot = mkTempDir();
  const events = [
    { type: 'system', subtype: 'init' },
    {
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [{ type: 'tool_use', id: 'tool_1', name: 'WebSearch', input: { query: 'WEBSEARCH-QUERY-MARKER' } }],
      },
    },
    {
      type: 'user',
      message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tool_1', content: 'WEBSEARCH-RESULT-MARKER' }] },
    },
    { type: 'result', subtype: 'success', result: JSON.stringify({ clear: true, verify: 'npm test -- from web scout' }) },
  ];
  const scriptPath = path.join(dir, 'stream-json-websearch-executor.mjs');
  fs.writeFileSync(scriptPath, `process.stdout.write(${JSON.stringify(ndjson(events))}); process.exit(0);`);
  const cfg = cfgFor(scriptPath);

  const verdict = runJudgeExecutor(cfg, 'sonnet', 'prompt', 'stricter prompt', {
    repoRoot,
    docsRef: 'docs/history/tsk-scout-web',
    capture: true,
  });

  assert.deepEqual(verdict, { clear: true, verify: 'npm test -- from web scout' });
  const notes = readScoutNotes(repoRoot, 'docs/history/tsk-scout-web');
  assert.match(notes, /WebSearch/);
  assert.match(notes, /WEBSEARCH-QUERY-MARKER/);
  assert.match(notes, /WEBSEARCH-RESULT-MARKER/);
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
