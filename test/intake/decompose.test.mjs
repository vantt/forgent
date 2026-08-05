import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { judgeDecompose, resolveDecompose, resolveContentRoot, findUncoveredLockedDecisions } from '../../src/intake/decompose.mjs';
import { readScoutNotes } from '../../src/intake/judge-executor.mjs';
import { computeImpact, computePriority, effortForMode } from '../../src/state/priority-formula.mjs';
import { addWork, listWork, StoreError, categoryOf, moveWork, readRawEvents, recordGateApprove } from '../../src/state/store.mjs';
import { createWorktree } from '../../src/runner/worktree.mjs';

// Fake executors only — every "command" spawned here is a node script this
// file writes to a mkdtemp directory at test time, mirroring
// discovery.test.mjs's convention. No real agent CLI is ever invoked.

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-decompose-test-'));
}

function writeVerdictExecutor(dir, verdict) {
  const scriptPath = path.join(dir, 'verdict-executor.mjs');
  fs.writeFileSync(scriptPath, `process.stdout.write(${JSON.stringify(JSON.stringify(verdict))}); process.exit(0);`);
  return scriptPath;
}

// tsk-5q5-1: a 'decompose' verdict now triggers ONE more call to the same
// configured executor PER CHILD — judgeVerifySemanticCorrectness's own
// second-pass prompt (judge-executor.mjs), checked before any child is
// written. The prompt text is substituted into argv (resolveExecutorCommand),
// so this fake sniffs argv[2] for a marker unique to that second prompt and
// answers it separately from the first-pass verdict — one script covers
// every call `resolveDecompose` makes for a given test.
function writeVerdictWithVerifyCheckExecutor(dir, verdict, agrees = true, reason = 'test-forced-disagree') {
  const scriptPath = path.join(dir, 'verdict-with-verify-check-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
    const prompt = process.argv[2] ?? '';
    if (prompt.includes('Kiểm tra độc lập một lệnh verify')) {
      process.stdout.write(${JSON.stringify(JSON.stringify({ agrees, reason }))});
    } else {
      process.stdout.write(${JSON.stringify(JSON.stringify(verdict))});
    }
    process.exit(0);
    `,
  );
  return scriptPath;
}

function writeRawStdoutExecutor(dir, rawStdout) {
  const scriptPath = path.join(dir, 'raw-executor.mjs');
  fs.writeFileSync(scriptPath, `process.stdout.write(${JSON.stringify(rawStdout)}); process.exit(0);`);
  return scriptPath;
}

function writeFailingExecutor(dir, exitCode = 1) {
  const scriptPath = path.join(dir, 'failing-executor.mjs');
  fs.writeFileSync(scriptPath, `process.exit(${exitCode});`);
  return scriptPath;
}

function readCount(counterPath) {
  return fs.existsSync(counterPath) ? parseInt(fs.readFileSync(counterPath, 'utf8'), 10) : 0;
}

// tsk-5q5-1: a child carrying a real `verify` now triggers a second,
// independent call to this same configured executor per child
// (judgeVerifySemanticCorrectness's own verify-check prompt). This fake
// answers that second prompt with `{agrees: true}` WITHOUT touching the
// counter, so every existing counting assertion here keeps counting only
// the first-pass (judgeDecompose-shaped) calls it was written to count —
// same sniff-the-prompt technique writeVerdictWithVerifyCheckExecutor
// already uses.
function writeCountingRawStdoutExecutor(dir, rawStdout) {
  const scriptPath = path.join(dir, 'counting-raw-executor.mjs');
  const counterPath = path.join(dir, 'counting-raw-count.txt');
  fs.writeFileSync(counterPath, '0');
  fs.writeFileSync(
    scriptPath,
    `
    import fs from 'node:fs';
    const prompt = process.argv[2] ?? '';
    if (prompt.includes('Kiểm tra độc lập một lệnh verify')) {
      process.stdout.write(${JSON.stringify(JSON.stringify({ agrees: true }))});
      process.exit(0);
    }
    const counterPath = ${JSON.stringify(counterPath)};
    fs.writeFileSync(counterPath, String(parseInt(fs.readFileSync(counterPath, 'utf8'), 10) + 1));
    process.stdout.write(${JSON.stringify(rawStdout)});
    process.exit(0);
    `,
  );
  return { scriptPath, counterPath };
}

function writeCountingFailingExecutor(dir, exitCode = 1) {
  const scriptPath = path.join(dir, 'counting-failing-executor.mjs');
  const counterPath = path.join(dir, 'counting-failing-count.txt');
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

// Returns unparsable stdout on invocation 1, a valid verdict on invocation 2
// — proves judgeDecompose's retry (str68 D2) resolves to the retry verdict.
function writeFlakyThenValidExecutor(dir, badStdout, validVerdict) {
  const scriptPath = path.join(dir, 'flaky-then-valid-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
    import fs from 'node:fs';
    const counterPath = ${JSON.stringify(path.join(dir, 'flaky-count.txt'))};
    let n = 1;
    try { n = parseInt(fs.readFileSync(counterPath, 'utf8'), 10) + 1; } catch { n = 1; }
    fs.writeFileSync(counterPath, String(n));
    if (n === 1) {
      process.stdout.write(${JSON.stringify(badStdout)});
    } else {
      process.stdout.write(${JSON.stringify(JSON.stringify(validVerdict))});
    }
    process.exit(0);
    `,
  );
  return scriptPath;
}

function echoPromptExecutor(dir) {
  const scriptPath = path.join(dir, 'echo-full-prompt.mjs');
  fs.writeFileSync(
    scriptPath,
    `
    const prompt = process.argv[2];
    process.stdout.write(JSON.stringify({ verdict: 'need-human', reason: prompt }));
    process.exit(0);
    `,
  );
  return scriptPath;
}

function cfgFor(executorArgs, overrides = {}) {
  return {
    executor: { command: process.execPath, args: executorArgs },
    models: { light: 'haiku', standard: 'sonnet', heavy: 'opus' },
    timeoutMs: 5000,
    ...overrides,
  };
}

function sampleWork(overrides = {}) {
  return {
    id: 'item-x',
    title: 'Build the reporting pipeline',
    kind: 'feature',
    status: 'todo',
    deps: [],
    risk: 'standard',
    refs: [],
    verify: 'npm test -- reporting',
    stage: 'decompose',
    ...overrides,
  };
}

function tmpStoreDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-resolve-decompose-'));
}

// --- judgeDecompose: real-model-shaped path + fail-safe on every failure --

test('judgeDecompose returns pass-through when the model says the item is simple', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, { verdict: 'pass-through' });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDecompose(sampleWork(), cfg);
  assert.deepEqual(verdict, { kind: 'pass-through' });
});

// --- work-item-priority-matrix D5/D8: mode/blastRadius ride on every
// non-invalid outcome, same "never gates the decision" discipline as
// reason/children above. ------------------------------------------------

test('judgeDecompose includes a recognized mode and a valid blastRadius on a pass-through verdict', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, { verdict: 'pass-through', mode: 'standard', blastRadius: 5 });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDecompose(sampleWork(), cfg);
  assert.deepEqual(verdict, { kind: 'pass-through', mode: 'standard', blastRadius: 5 });
});

test('judgeDecompose omits an unrecognized mode string but keeps a valid blastRadius', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, { verdict: 'pass-through', mode: 'gigantic', blastRadius: 3 });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDecompose(sampleWork(), cfg);
  assert.deepEqual(verdict, { kind: 'pass-through', blastRadius: 3 });
});

test('judgeDecompose omits a negative or non-numeric blastRadius but keeps a valid mode', () => {
  for (const blastRadius of [-1, 'nine', null, NaN]) {
    const dir = mkTempDir();
    const scriptPath = writeVerdictExecutor(dir, { verdict: 'pass-through', mode: 'tiny', blastRadius });
    const cfg = cfgFor([scriptPath, '{prompt}']);
    const verdict = judgeDecompose(sampleWork(), cfg);
    assert.deepEqual(verdict, { kind: 'pass-through', mode: 'tiny' });
  }
});

test('judgeDecompose omits both mode and blastRadius (never throws) when the model supplies neither', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, { verdict: 'pass-through' });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDecompose(sampleWork(), cfg);
  assert.equal('mode' in verdict, false);
  assert.equal('blastRadius' in verdict, false);
});

test('judgeDecompose returns decompose with normalized children including resolved sibling deps', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser' },
      { title: 'Build renderer', verify: 'npm test -- renderer', deps: [0] },
    ],
  });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDecompose(sampleWork(), cfg);
  assert.equal(verdict.kind, 'decompose');
  assert.equal(verdict.reason, 'Two independent surfaces, no shared state');
  assert.equal(verdict.children.length, 2);
  assert.equal(verdict.children[0].deps.length, 0);
  assert.deepEqual(verdict.children[1].deps, [0]);
});

test('judgeDecompose drops a forward/self dep index instead of invalidating the whole verdict', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser', deps: [1] }, // forward ref, dropped
      { title: 'Build renderer', verify: 'npm test -- renderer', deps: [1] }, // self ref, dropped
    ],
  });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDecompose(sampleWork(), cfg);
  assert.equal(verdict.kind, 'decompose');
  assert.deepEqual(verdict.children[0].deps, []);
  assert.deepEqual(verdict.children[1].deps, []);
});

test('judgeDecompose normalizes an empty children array on a decompose verdict to pass-through', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, { verdict: 'decompose', children: [] });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDecompose(sampleWork(), cfg);
  assert.deepEqual(verdict, { kind: 'pass-through' });
});

test('judgeDecompose returns invalid when any child is missing a real verify (no placeholder allowed)', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, {
    verdict: 'decompose',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser' },
      { title: 'Build renderer' }, // missing verify
    ],
  });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDecompose(sampleWork(), cfg);
  assert.deepEqual(verdict, { kind: 'invalid' });
});

test('judgeDecompose returns invalid when a child verify is a blank/whitespace-only string', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, {
    verdict: 'decompose',
    children: [{ title: 'Build parser', verify: '   ' }],
  });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDecompose(sampleWork(), cfg);
  assert.deepEqual(verdict, { kind: 'invalid' });
});

test('judgeDecompose returns invalid when a decompose verdict has no top-level reason (tsk-6b6 D3)', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, {
    verdict: 'decompose',
    children: [{ title: 'Build parser', verify: 'npm test -- parser' }],
  });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDecompose(sampleWork(), cfg);
  assert.deepEqual(verdict, { kind: 'invalid' });
});

test('judgeDecompose returns invalid when a decompose verdict has a blank/whitespace-only reason (tsk-6b6 D3)', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, {
    verdict: 'decompose',
    reason: '   ',
    children: [{ title: 'Build parser', verify: 'npm test -- parser' }],
  });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDecompose(sampleWork(), cfg);
  assert.deepEqual(verdict, { kind: 'invalid' });
});

test('judgeDecompose returns need-human with the model-proposed reason', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, { verdict: 'need-human', reason: 'Scope unclear across two services' });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDecompose(sampleWork(), cfg);
  assert.deepEqual(verdict, { kind: 'need-human', reason: 'Scope unclear across two services' });
});

test('judgeDecompose falls back to a default reason when need-human supplies none', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, { verdict: 'need-human' });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDecompose(sampleWork(), cfg);
  assert.equal(verdict.kind, 'need-human');
  assert.equal(typeof verdict.reason, 'string');
  assert.ok(verdict.reason.length > 0);
});

test('judgeDecompose fails safe (never throws, invalid) on unparsable stdout, retrying up to MAX_JUDGE_ATTEMPTS before falling back (nested-judge-fix)', () => {
  const dir = mkTempDir();
  const { scriptPath, counterPath } = writeCountingRawStdoutExecutor(dir, 'not json at all');
  const cfg = cfgFor([scriptPath, '{prompt}']);
  let verdict;
  assert.doesNotThrow(() => {
    verdict = judgeDecompose(sampleWork(), cfg);
  });
  assert.deepEqual(verdict, { kind: 'invalid' });
  assert.equal(readCount(counterPath), 3);
});

test('judgeDecompose retries once with a stricter prompt on a parse-shaped failure and resolves to the retry verdict', () => {
  const dir = mkTempDir();
  const scriptPath = writeFlakyThenValidExecutor(dir, 'not json at all', { verdict: 'pass-through' });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDecompose(sampleWork(), cfg);
  assert.deepEqual(verdict, { kind: 'pass-through' });
});

test('judgeDecompose fails safe when the verdict JSON is missing the "verdict" field', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, { reason: 'huh' });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  assert.deepEqual(judgeDecompose(sampleWork(), cfg), { kind: 'invalid' });
});

test('judgeDecompose fails safe when the executor exits non-zero, attempting exactly once — no retry on a non-parse failure', () => {
  const dir = mkTempDir();
  const { scriptPath, counterPath } = writeCountingFailingExecutor(dir, 7);
  const cfg = cfgFor([scriptPath, '{prompt}']);
  assert.deepEqual(judgeDecompose(sampleWork(), cfg), { kind: 'invalid' });
  assert.equal(readCount(counterPath), 1);
});

test('judgeDecompose fails safe when the configured command does not exist (spawn fail)', () => {
  const cfg = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  assert.deepEqual(judgeDecompose(sampleWork(), cfg), { kind: 'invalid' });
});

test('judgeDecompose fails safe when the work item\'s tier has no configured model', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, { verdict: 'pass-through' });
  const cfg = { executor: { command: process.execPath, args: [scriptPath, '{prompt}'] }, models: {}, timeoutMs: 5000 };
  assert.deepEqual(judgeDecompose(sampleWork({ tier: 'standard' }), cfg), { kind: 'invalid' });
});

// --- tsk-5d2: judge fail-safe debug log — each distinct branch tagged, ----
// the returned fallback verdict never changes (fail-safe contract is the
// same one the tests above already prove; these add the log-side proof).
// Mirrors discovery.test.mjs's own tsk-5d2 block exactly (D2: same
// shared fail-safe code path in judge-executor.mjs).

function readJudgeFailLog(fgosDir, id) {
  return fs.readFileSync(path.join(fgosDir, 'logs', `${id}-judge-fail.log`), 'utf8');
}

test('judgeDecompose fail-safe (outer-exception): logs reason:outer-exception with the real error message, verdict unchanged', () => {
  const dir = mkTempDir();
  const fgosDir = path.join(mkTempDir(), '.fgos');
  const scriptPath = writeVerdictExecutor(dir, { verdict: 'pass-through' });
  const cfg = { executor: { command: process.execPath, args: [scriptPath, '{prompt}'] }, models: {}, timeoutMs: 5000 };
  const verdict = judgeDecompose(sampleWork({ id: 'item-outer-exc', tier: 'standard' }), cfg, undefined, undefined, undefined, fgosDir);
  assert.deepEqual(verdict, { kind: 'invalid' });
  const log = readJudgeFailLog(fgosDir, 'item-outer-exc');
  assert.match(log, /reason outer-exception/);
  assert.match(log, /message: /);
});

test('judgeDecompose fail-safe (non-parse-exit): logs reason:non-parse-exit with the real exit status, verdict unchanged', () => {
  const dir = mkTempDir();
  const fgosDir = path.join(mkTempDir(), '.fgos');
  const { scriptPath } = writeCountingFailingExecutor(dir, 7);
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDecompose(sampleWork({ id: 'item-non-parse-exit' }), cfg, undefined, undefined, undefined, fgosDir);
  assert.deepEqual(verdict, { kind: 'invalid' });
  const log = readJudgeFailLog(fgosDir, 'item-non-parse-exit');
  assert.match(log, /reason non-parse-exit/);
  assert.match(log, /exit status: 7/);
});

test('judgeDecompose fail-safe (parse-exhausted): logs reason:parse-exhausted with all 3 attempts\' raw stdout, verdict unchanged', () => {
  const dir = mkTempDir();
  const fgosDir = path.join(mkTempDir(), '.fgos');
  const { scriptPath, counterPath } = writeCountingRawStdoutExecutor(dir, 'not json at all');
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDecompose(sampleWork({ id: 'item-parse-exhausted' }), cfg, undefined, undefined, undefined, fgosDir);
  assert.deepEqual(verdict, { kind: 'invalid' });
  assert.equal(readCount(counterPath), 3);
  const log = readJudgeFailLog(fgosDir, 'item-parse-exhausted');
  assert.match(log, /reason parse-exhausted/);
  assert.match(log, /ATTEMPT 1 STDOUT/);
  assert.match(log, /ATTEMPT 3 STDOUT/);
  assert.equal((log.match(/not json at all/g) || []).length, 3);
});

test('judgeDecompose fail-safe (shape-invalid): logs reason:shape-invalid with the parsed verdict object, verdict unchanged', () => {
  const dir = mkTempDir();
  const fgosDir = path.join(mkTempDir(), '.fgos');
  const scriptPath = writeVerdictExecutor(dir, { reason: 'huh' });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDecompose(sampleWork({ id: 'item-shape-invalid' }), cfg, undefined, undefined, undefined, fgosDir);
  assert.deepEqual(verdict, { kind: 'invalid' });
  const log = readJudgeFailLog(fgosDir, 'item-shape-invalid');
  assert.match(log, /reason shape-invalid/);
  assert.match(log, /"reason":"huh"/);
});

test('judgeDecompose fail-safe with fgosDir omitted writes no log and never throws (byte-identical to every pre-tsk-5d2 caller)', () => {
  const dir = mkTempDir();
  const { scriptPath } = writeCountingFailingExecutor(dir, 7);
  const cfg = cfgFor([scriptPath, '{prompt}']);
  let verdict;
  assert.doesNotThrow(() => {
    verdict = judgeDecompose(sampleWork({ id: 'item-no-fgosdir' }), cfg);
  });
  assert.deepEqual(verdict, { kind: 'invalid' });
});

// --- judgeDecompose gate consultation (tsk-3w8 follow-up, mirrors --------
// discovery.test.mjs's own P30 tests): a "need-human" verdict parks the item
// via the SAME putInAwaiting/view.gates door discovery.mjs's "unclear" does
// — the prompt must actually consult that answer on the next call, or a
// human's `fgos answer` never changes anything and the same question repeats
// forever. ---------------------------------------------------------------

test('judgeDecompose with a view embeds the latest gate answer in the prompt', () => {
  const dir = mkTempDir();
  const scriptPath = echoPromptExecutor(dir);
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const work = sampleWork();
  const view = {
    work: { [work.id]: work },
    gates: { [work.id]: { ask: 'Chia hay pass-through?', answer: 'Pass-through — không cần tách con.' } },
  };
  const verdict = judgeDecompose(work, cfg, '', view);
  // need-human's `reason` here is the prompt itself (echo executor) — asserting
  // on it is asserting on the actual prompt text sent to the executor.
  assert.match(verdict.reason, /Chia hay pass-through\?/);
  assert.match(verdict.reason, /Pass-through — không cần tách con\./);
});

test('judgeDecompose degrades to a placeholder (no throw) when no view is passed — old 3-arg call stays backward-compatible', () => {
  const dir = mkTempDir();
  const scriptPath = echoPromptExecutor(dir);
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDecompose(sampleWork(), cfg, ''); // 3-arg, no view — must not throw
  assert.match(verdict.reason, /chưa có vòng hỏi-đáp nào với người/);
});

test('resolveDecompose: a need-human verdict parks via putInAwaiting, and the NEXT resolveDecompose call sees that answer in the prompt (end-to-end)', () => {
  const scriptDir = mkTempDir();
  const echoScript = echoPromptExecutor(scriptDir);
  const cfg = cfgFor([echoScript, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const first = resolveDecompose(storeDir, 'item-x', cfg, 'human');
  assert.equal(first.outcome, 'need-human');
  const view1 = listWork(storeDir);
  assert.equal(view1.work['item-x'].status, 'awaiting-human');
  assert.ok(view1.gates['item-x'].ask);

  // Resolve the gate via the same store door `fgos answer` uses (moveWork's
  // answer edge), never a hand-written state change.
  moveWork(storeDir, {
    id: 'item-x',
    to: 'todo',
    expectedStatus: 'awaiting-human',
    answer: 'Pass-through — đã xác nhận, không cần tách con.',
  });

  const second = resolveDecompose(storeDir, 'item-x', cfg, 'human');
  assert.equal(second.outcome, 'need-human');
  // The SECOND call's prompt (echoed back as verdict.reason via the fake
  // executor) must contain the answer just recorded — proving it was
  // actually consulted, not just stored and ignored.
  assert.match(second.verdict.reason, /đã xác nhận, không cần tách con/);
});

// --- resolveDecompose: read-judge-write over the real store ---------------

test('resolveDecompose on a pass-through verdict moves the item straight to executing, keeping its existing verify', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, { verdict: 'pass-through' });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'runner');
  assert.equal(result.outcome, 'pass-through');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'executing');
  assert.equal(view.work['item-x'].verify, 'npm test -- reporting');
});

// --- work-item-priority-matrix D6/D8: the refined pass writes `priority`
// on the root using real `mode`/`blastRadius` when the judge supplies them,
// same as discovery.mjs's rough pass but with EFFORT_FLOOR replaced by the
// judge-read mode. Expected values derived from computeImpact/
// computePriority directly, not hand-duplicated arithmetic. ------------

test('resolveDecompose writes a refined priority using mode/blastRadius when the judge supplies them', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, { verdict: 'pass-through', mode: 'high-risk', blastRadius: 9 });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  const work = sampleWork();
  addWork(storeDir, work);

  resolveDecompose(storeDir, 'item-x', cfg, 'runner');
  const view = listWork(storeDir);
  const expected = computePriority({
    impact: computeImpact({ blocks: 0, blastRadius: 9 }),
    urgent: work.urgent,
    effort: effortForMode('high-risk'),
    risk: work.risk,
    blastRadius: 9,
  });
  assert.equal(view.work['item-x'].priority, expected);
});

test('resolveDecompose still computes a priority (EFFORT_FLOOR default) when the judge supplies neither mode nor blastRadius', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, { verdict: 'pass-through' });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  const work = sampleWork();
  addWork(storeDir, work);

  resolveDecompose(storeDir, 'item-x', cfg, 'runner');
  const view = listWork(storeDir);
  const expected = computePriority({
    impact: computeImpact({ blocks: 0 }),
    urgent: work.urgent,
    risk: work.risk,
  });
  assert.equal(view.work['item-x'].priority, expected);
});

test('resolveDecompose ignores an unrecognized mode string from the judge (falls back to EFFORT_FLOOR, never throws)', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, { verdict: 'pass-through', mode: 'not-a-real-mode' });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  const work = sampleWork();
  addWork(storeDir, work);

  assert.doesNotThrow(() => resolveDecompose(storeDir, 'item-x', cfg, 'runner'));
  const view = listWork(storeDir);
  const expected = computePriority({ impact: computeImpact({ blocks: 0 }), urgent: work.urgent, risk: work.risk });
  assert.equal(view.work['item-x'].priority, expected);
});

// claim-lock §3b: a pick claim held through clarify/decompose (status
// 'doing') is released back to 'todo' the moment the root actually reaches
// stage executing, so `pick <id>` can re-claim it for the executing phase.
test('resolveDecompose on a pass-through verdict releases a held claim (doing -> todo) once the root reaches executing (claim-lock §3b)', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, { verdict: 'pass-through' });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());
  moveWork(storeDir, { id: 'item-x', to: 'doing', expectedStatus: 'todo', role: 'session' });

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'session');
  assert.equal(result.outcome, 'pass-through');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'executing');
  assert.equal(view.work['item-x'].status, 'todo');

  // tsk-2zv: the release carries a positive marker so claimWork can tell
  // this todo-entry apart from a reject/verify-fail park, which land the
  // same status without deleting the branch.
  const releaseEvent = readRawEvents(storeDir)
    .filter((e) => e.type === 'work.move' && e.payload.id === 'item-x' && e.payload.to === 'todo')
    .at(-1);
  assert.equal(releaseEvent.payload.releaseTrigger, 'claim-lock-3b');
});

// R15 (runner sweep only touches status 'todo' items, never claims): an
// unclaimed item passing through the same edge is an explicit no-op for the
// release call — status stays 'todo' throughout, no spurious moveWork error.
test('resolveDecompose on a pass-through verdict is a no-op release for an item that was never claimed (status stays todo)', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, { verdict: 'pass-through' });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'runner');
  assert.equal(result.outcome, 'pass-through');
  assert.equal(listWork(storeDir).work['item-x'].status, 'todo');
});

test('resolveDecompose on a decompose verdict writes every child with parent/deps/verify and moves the root to executing', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictWithVerifyCheckExecutor(scriptDir, {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser' },
      { title: 'Build renderer', verify: 'npm test -- renderer', deps: [0] },
    ],
  });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'runner');
  assert.equal(result.outcome, 'decompose');
  assert.equal(result.childIds.length, 2);

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'executing');

  const [firstId, secondId] = result.childIds;
  assert.equal(firstId, 'item-x-1');
  assert.equal(secondId, 'item-x-2');
  assert.equal(view.work[firstId].parent, 'item-x');
  assert.equal(view.work[firstId].stage, 'executing');
  assert.equal(view.work[firstId].status, 'todo');
  assert.equal(view.work[firstId].verify, 'npm test -- parser');
  assert.deepEqual(view.work[firstId].deps, []);

  assert.equal(view.work[secondId].parent, 'item-x');
  assert.deepEqual(view.work[secondId].deps, [firstId]);
  assert.equal(view.work[secondId].verify, 'npm test -- renderer');

  // D4/D5: children are lineage only, never written into the root's own deps.
  assert.deepEqual(view.work['item-x'].deps, []);
});

test('resolveDecompose on a decompose verdict releases a held claim (doing -> todo) once the root reaches executing (claim-lock §3b)', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictWithVerifyCheckExecutor(scriptDir, {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [{ title: 'Build parser', verify: 'npm test -- parser' }],
  });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());
  moveWork(storeDir, { id: 'item-x', to: 'doing', expectedStatus: 'todo', role: 'session' });

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'session');
  assert.equal(result.outcome, 'decompose');
  assert.equal(listWork(storeDir).work['item-x'].status, 'todo');
});

test('resolveDecompose writes footprint on a child exactly when the verdict provided one, undefined otherwise', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictWithVerifyCheckExecutor(scriptDir, {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser', footprint: ['src/parser.mjs', 'test/parser.test.mjs'] },
      { title: 'Build renderer', verify: 'npm test -- renderer' },
    ],
  });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'runner');
  assert.equal(result.outcome, 'decompose');

  const view = listWork(storeDir);
  const [firstId, secondId] = result.childIds;
  assert.deepEqual(view.work[firstId].footprint, ['src/parser.mjs', 'test/parser.test.mjs']);
  assert.equal(view.work[secondId].footprint, undefined);
});

test('resolveDecompose leaves footprint undefined when a child provides a malformed (non-array) footprint, without invalidating the verdict', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictWithVerifyCheckExecutor(scriptDir, {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [{ title: 'Build parser', verify: 'npm test -- parser', footprint: 'not-an-array' }],
  });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'runner');
  assert.equal(result.outcome, 'decompose');

  const view = listWork(storeDir);
  assert.equal(view.work[result.childIds[0]].footprint, undefined);
});

// --- tsk-5e97 D1 (docs/history/tsk-5e97-decompose-footprint-overlap-gate/
// CONTEXT.md): footprint overlap among the TENTATIVE children of a
// decompose verdict gates to awaiting-human, writing no children — same
// shape as keywordRiskGate/blastRadiusGate above, never auto-adjusting. --

test('resolveDecompose gates to awaiting-human when tentative children declare overlapping footprint, writing no children (tsk-5e97 D1)', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictWithVerifyCheckExecutor(scriptDir, {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser', footprint: ['src/parser.mjs', 'src/shared.mjs'] },
      { title: 'Build renderer', verify: 'npm test -- renderer', footprint: ['src/shared.mjs', 'src/renderer.mjs'] },
    ],
  });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'runner');
  assert.equal(result.outcome, 'need-human');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].status, 'awaiting-human');
  assert.equal(view.work['item-x'].stage, 'decompose');
  assert.match(view.gates['item-x'].ask, /src\/shared\.mjs/);
  assert.match(view.gates['item-x'].ask, /item-x-1/);
  assert.match(view.gates['item-x'].ask, /item-x-2/);
  const children = Object.values(view.work).filter((item) => item.parent === 'item-x');
  assert.equal(children.length, 0);
});

test('resolveDecompose proceeds normally when tentative children declare disjoint (or absent) footprint', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictWithVerifyCheckExecutor(scriptDir, {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser', footprint: ['src/parser.mjs'] },
      { title: 'Build renderer', verify: 'npm test -- renderer' }, // no footprint declared
    ],
  });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'runner');
  assert.equal(result.outcome, 'decompose');
  assert.equal(result.childIds.length, 2);
  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'executing');
});

test('resolveDecompose: the existing heavy-risk gate still preempts the footprint-overlap check (risksGate checked before the decompose branch)', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser', footprint: ['src/parser.mjs', 'src/shared.mjs'] },
      { title: 'Build renderer', verify: 'npm test -- renderer', footprint: ['src/shared.mjs'] },
    ],
  });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ risk: 'heavy' }));

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'runner');
  assert.equal(result.outcome, 'need-human');
  const view = listWork(storeDir);
  assert.match(view.gates['item-x'].ask, /risk cao \(heavy\)/);
  assert.doesNotMatch(view.gates['item-x'].ask, /Footprint trùng/);
  const children = Object.values(view.work).filter((item) => item.parent === 'item-x');
  assert.equal(children.length, 0);
});

test('resolveDecompose logs a decisionsById entry on a footprint-overlap need-human outcome, naming the conflict count', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictWithVerifyCheckExecutor(scriptDir, {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser', footprint: ['src/parser.mjs', 'src/shared.mjs'] },
      { title: 'Build renderer', verify: 'npm test -- renderer', footprint: ['src/shared.mjs'] },
    ],
  });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  resolveDecompose(storeDir, 'item-x', cfg, 'runner');

  const entries = listWork(storeDir).decisionsById['item-x'];
  assert.equal(entries.length, 1);
  assert.match(entries[0].text, /need-human/);
  assert.match(entries[0].text, /1 footprint conflicts/);
  assert.match(entries[0].rationale, /Footprint trùng giữa các việc con dự kiến/);
});

test('resolveDecompose self-resolves the footprint-overlap gate once the next judge call proposes non-overlapping children (no bypass constant needed, tsk-5e97 D1)', () => {
  const overlappingDir = mkTempDir();
  const overlappingScript = writeVerdictWithVerifyCheckExecutor(overlappingDir, {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser', footprint: ['src/parser.mjs', 'src/shared.mjs'] },
      { title: 'Build renderer', verify: 'npm test -- renderer', footprint: ['src/shared.mjs'] },
    ],
  });
  const overlappingCfg = cfgFor([overlappingScript, '{prompt}']);

  const resolvedDir = mkTempDir();
  const resolvedScript = writeVerdictWithVerifyCheckExecutor(resolvedDir, {
    verdict: 'decompose',
    reason: 'Re-sliced after human input — no shared file left',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser', footprint: ['src/parser.mjs'] },
      { title: 'Build renderer', verify: 'npm test -- renderer', footprint: ['src/renderer.mjs'] },
    ],
  });
  const resolvedCfg = cfgFor([resolvedScript, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const first = resolveDecompose(storeDir, 'item-x', overlappingCfg, 'human');
  assert.equal(first.outcome, 'need-human');

  moveWork(storeDir, { id: 'item-x', to: 'todo', expectedStatus: 'awaiting-human', answer: 'Đã re-slice, không còn trùng file.' });

  const second = resolveDecompose(storeDir, 'item-x', resolvedCfg, 'human');
  assert.equal(
    second.outcome,
    'decompose',
    'the gate must pass once the fresh verdict proposes non-overlapping children — no bypass constant needed',
  );
  assert.equal(second.childIds.length, 2);

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'executing');
});

test('resolveDecompose assigns positional child ids `${work.id}-<n>` for n=1..N across N siblings', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictWithVerifyCheckExecutor(scriptDir, {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser' },
      { title: 'Build renderer', verify: 'npm test -- renderer' },
      { title: 'Build linker', verify: 'npm test -- linker' },
    ],
  });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'runner');
  assert.equal(result.outcome, 'decompose');
  assert.deepEqual(result.childIds, ['item-x-1', 'item-x-2', 'item-x-3']);
});

test('resolveDecompose on a grandchild decompose produces `<root>-<m>-<n>` ids with no special-case code', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictWithVerifyCheckExecutor(scriptDir, {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [{ title: 'Build sub-parser', verify: 'npm test -- sub-parser' }],
  });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());
  // Simulate a child already produced by a prior decompose of the root
  // (id `item-x-2`), itself now sitting at stage `decompose`.
  addWork(storeDir, {
    id: 'item-x-2',
    title: 'Build renderer',
    kind: 'feature',
    status: 'todo',
    deps: [],
    risk: 'standard',
    refs: [],
    verify: 'npm test -- renderer',
    stage: 'decompose',
    parent: 'item-x',
  });

  const result = resolveDecompose(storeDir, 'item-x-2', cfg, 'runner');
  assert.equal(result.outcome, 'decompose');
  assert.deepEqual(result.childIds, ['item-x-2-1']);

  const view = listWork(storeDir);
  assert.equal(view.work['item-x-2-1'].parent, 'item-x-2');
});

test('resolveDecompose completes an interrupted decompose (children exist, root still at decompose stage) without regenerating children', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, { verdict: 'pass-through' }); // never consulted on this path
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());
  // Simulate the crash window: a child already exists with parent==root, but
  // the root itself is still at stage `decompose` (its own moveStage never
  // landed before the crash).
  addWork(storeDir, {
    id: 'orphan-child-abc',
    title: 'Build parser',
    kind: 'feature',
    status: 'todo',
    deps: [],
    risk: 'standard',
    refs: [],
    verify: 'npm test -- parser',
    stage: 'executing',
    parent: 'item-x',
  });

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'runner');
  assert.equal(result.outcome, 'already-decomposed');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'executing');
  // Still exactly one child — no duplicate generated.
  const children = Object.values(view.work).filter((item) => item.parent === 'item-x');
  assert.equal(children.length, 1);
});

test('resolveDecompose on the already-decomposed re-entrant path also releases a held claim (claim-lock §3b)', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, { verdict: 'pass-through' }); // never consulted on this path
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());
  moveWork(storeDir, { id: 'item-x', to: 'doing', expectedStatus: 'todo', role: 'session' });
  addWork(storeDir, {
    id: 'orphan-child-def',
    title: 'Build parser',
    kind: 'feature',
    status: 'todo',
    deps: [],
    risk: 'standard',
    refs: [],
    verify: 'npm test -- parser',
    stage: 'executing',
    parent: 'item-x',
  });

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'session');
  assert.equal(result.outcome, 'already-decomposed');
  assert.equal(listWork(storeDir).work['item-x'].status, 'todo');
});

test('resolveDecompose on a need-human verdict parks the item in awaiting-human carrying the proposal, writing no children', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, { verdict: 'need-human', reason: 'Ambiguous scope' });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'runner');
  assert.equal(result.outcome, 'need-human');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].status, 'awaiting-human');
  assert.equal(view.work['item-x'].stage, 'decompose');
  assert.match(view.gates['item-x'].ask, /Ambiguous scope/);
  const children = Object.values(view.work).filter((item) => item.parent === 'item-x');
  assert.equal(children.length, 0);
});

test('resolveDecompose on a need-human verdict stamps statusAtAsk "doing" when a pick claim is held (claim-lock §5.1)', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, { verdict: 'need-human', reason: 'Ambiguous scope' });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());
  moveWork(storeDir, { id: 'item-x', to: 'doing', expectedStatus: 'todo', role: 'session' });

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'session');
  assert.equal(result.outcome, 'need-human');
  assert.equal(listWork(storeDir).gates['item-x'].statusAtAsk, 'doing');
});

test('resolveDecompose routes a risk-heavy root through the human gate even on a clean decompose verdict, writing no children yet', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [{ title: 'Build parser', verify: 'npm test -- parser' }],
  });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ risk: 'heavy' }));

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'runner');
  assert.equal(result.outcome, 'need-human');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].status, 'awaiting-human');
  assert.match(view.gates['item-x'].ask, /Build parser/);
  const children = Object.values(view.work).filter((item) => item.parent === 'item-x');
  assert.equal(children.length, 0);
});

test('resolveDecompose routes a risk-heavy root through the human gate on a pass-through verdict too', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, { verdict: 'pass-through' });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ risk: 'heavy' }));

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'runner');
  assert.equal(result.outcome, 'need-human');
  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'decompose');
});

// --- heavy-risk gate release on confirmation (tsk-3w8 follow-up) ----------
// Without this, a risk-heavy root re-fires the SAME "confirm before
// splitting" ask forever, regardless of any answer a human gives — `fgos
// answer` resumes status to `todo` but stage stays `decompose`, so the very
// next resolveDecompose call hit the exact same unconditional gate again
// (real dogfood, tsk-3w8, 2026-07-28: 3 discover calls, identical ask each
// time). The gate must release once a human has genuinely answered ITS OWN
// prior ask — never a stale answer from an unrelated question.

test('resolveDecompose releases a risk-heavy root once the human has answered THIS gate\'s own prior ask, proceeding with the model verdict', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, { verdict: 'pass-through' });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ risk: 'heavy' }));

  const first = resolveDecompose(storeDir, 'item-x', cfg, 'human');
  assert.equal(first.outcome, 'need-human');
  const askedView = listWork(storeDir);
  assert.match(askedView.gates['item-x'].ask, /risk cao \(heavy\)/);

  // Answer through the same door `fgos answer` uses — resumes status to
  // todo, stage stays decompose (unchanged by this edge).
  moveWork(storeDir, { id: 'item-x', to: 'todo', expectedStatus: 'awaiting-human', answer: 'Đã xác nhận, cứ pass-through.' });

  const second = resolveDecompose(storeDir, 'item-x', cfg, 'human');
  assert.equal(second.outcome, 'pass-through', 'the gate must release once its own prior ask has a real answer on record');
  const finalView = listWork(storeDir);
  assert.equal(finalView.work['item-x'].stage, 'executing');

  // tsk-6b6: both calls log a decisionsById entry, accumulating rather than
  // overwriting -- the first (need-human, heavy-risk-forced) and the second
  // (pass-through, the model's own verdict) must both be on record.
  const entries = finalView.decisionsById['item-x'];
  assert.equal(entries.length, 2);
  assert.match(entries[0].text, /need-human/);
  assert.match(entries[1].text, /pass-through/);
  assert.ok(entries.every((e) => e.source === 'judgeDecompose'));
});

test('resolveDecompose does NOT release the risk-heavy gate on a stale/unrelated gate answer (never a false bypass)', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, { verdict: 'pass-through' });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ risk: 'heavy' }));
  // A gate answer already on record, but from an unrelated question (e.g.
  // the clarify-stage's own ask) — must never be read as confirming this
  // gate's own distinct ask.
  moveWork(storeDir, { id: 'item-x', to: 'awaiting-human', ask: 'Which file exactly?', statusAtAsk: 'todo' });
  moveWork(storeDir, { id: 'item-x', to: 'todo', expectedStatus: 'awaiting-human', answer: 'The parser module.' });

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'human');
  assert.equal(result.outcome, 'need-human', 'an unrelated prior answer must not bypass the heavy-risk gate');
  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'decompose');
});

// --- work-item-priority-matrix D4/D8, Phase C: blast-radius is an
// INDEPENDENT gate alongside the keyword-risk gate -- either can force
// need-human, neither ever loosens the other. --------------------------

test('resolveDecompose routes a keyword-LIGHT root through the human gate when blastRadius is over threshold (capability signal adds caution, never skipped)', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, { verdict: 'pass-through', blastRadius: 25 });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ risk: 'light' }));

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'runner');
  assert.equal(result.outcome, 'need-human');
  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'decompose');
  assert.match(view.gates?.['item-x']?.ask ?? '', /Blast-radius/);
});

test('resolveDecompose keeps the keyword-heavy gate even when blastRadius is LOW (floor holds — capability signal never loosens the existing gate)', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, { verdict: 'pass-through', blastRadius: 1 });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ risk: 'heavy' }));

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'runner');
  assert.equal(result.outcome, 'need-human');
  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'decompose');
});

test('resolveDecompose proceeds (no gate) when risk is light AND blastRadius is under threshold', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, { verdict: 'pass-through', blastRadius: 5 });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ risk: 'light' }));

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'runner');
  assert.equal(result.outcome, 'pass-through');
  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'executing');
});

test('resolveDecompose releases the blast-radius gate once the human has answered THIS gate\'s own prior ask', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, { verdict: 'pass-through', blastRadius: 25 });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ risk: 'light' }));

  const first = resolveDecompose(storeDir, 'item-x', cfg, 'runner');
  assert.equal(first.outcome, 'need-human');

  const gate = listWork(storeDir).gates?.['item-x'];
  moveWork(storeDir, { id: 'item-x', to: 'todo', expectedStatus: 'awaiting-human', answer: 'Confirmed, proceed.' });
  assert.match(gate.ask, /Blast-radius/);

  const second = resolveDecompose(storeDir, 'item-x', cfg, 'runner');
  assert.equal(second.outcome, 'pass-through');
  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'executing');
});

test('resolveDecompose does NOT release the blast-radius gate on a stale/unrelated gate answer (never a false bypass)', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, { verdict: 'pass-through', blastRadius: 25 });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ risk: 'light' }));
  moveWork(storeDir, { id: 'item-x', to: 'awaiting-human', ask: 'Which file exactly?', statusAtAsk: 'todo' });
  moveWork(storeDir, { id: 'item-x', to: 'todo', expectedStatus: 'awaiting-human', answer: 'The parser module.' });

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'human');
  assert.equal(result.outcome, 'need-human', 'an unrelated prior answer must not bypass the blast-radius gate');
});

test('resolveDecompose leaves the item untouched (invalid, fail-safe) on a spawn failure — no awaiting-human, no move', () => {
  const cfg = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'runner');
  assert.equal(result.outcome, 'invalid');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'decompose');
  assert.equal(view.work['item-x'].status, 'todo');
});

test('resolveDecompose leaves the item untouched (invalid) when a child is missing verify — no partial write', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, {
    verdict: 'decompose',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser' },
      { title: 'Build renderer' },
    ],
  });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'runner');
  assert.equal(result.outcome, 'invalid');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'decompose');
  const children = Object.values(view.work).filter((item) => item.parent === 'item-x');
  assert.equal(children.length, 0);
});

// tsk-5q5-1 (D2/D4, docs/history/judge-verdict-evidence-discipline/): each
// child's model-proposed `verify` now gets an independent second-pass check
// too, before ANY child is written.

test('resolveDecompose parks as need-human (no children written) when the second-pass check disagrees with ANY child\'s verify', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictWithVerifyCheckExecutor(
    scriptDir,
    {
      verdict: 'decompose',
      reason: 'Two independent surfaces, no shared state',
      children: [
        { title: 'Build parser', verify: 'npm test -- parser' },
        { title: 'Build renderer', verify: 'Skill("fgOS:ready") loads without error' },
      ],
    },
    false,
    'lệnh này không kiểm chứng đúng claim của việc con',
  );
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'runner');
  assert.equal(result.outcome, 'need-human');

  const view = listWork(storeDir);
  // No partial write -- neither child exists, root stays at decompose.
  assert.equal(view.work['item-x'].stage, 'decompose');
  const children = Object.values(view.work).filter((item) => item.parent === 'item-x');
  assert.equal(children.length, 0);
  assert.match(view.gates['item-x'].ask, /lệnh này không kiểm chứng đúng claim của việc con/);
});

test('resolveDecompose still writes every child when the second-pass check agrees with all of them', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictWithVerifyCheckExecutor(
    scriptDir,
    {
      verdict: 'decompose',
      reason: 'Two independent surfaces, no shared state',
      children: [
        { title: 'Build parser', verify: 'npm test -- parser' },
        { title: 'Build renderer', verify: 'npm test -- renderer' },
      ],
    },
    true,
  );
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'runner');
  assert.equal(result.outcome, 'decompose');
  assert.equal(result.childIds.length, 2);
});

test('resolveDecompose is a no-op on an item already past stage decompose (idempotent, CAS-backed)', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, { verdict: 'pass-through' }); // never consulted
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ stage: 'executing' }));

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'runner');
  assert.equal(result.outcome, 'noop');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'executing');
});

test('resolveDecompose throws a validation StoreError for an unknown id', () => {
  const storeDir = tmpStoreDir();
  assert.throws(
    () => resolveDecompose(storeDir, 'nope', cfgFor(['{prompt}']), 'runner'),
    (err) => err instanceof StoreError && categoryOf(err) === 'validation',
  );
});

// --- decision-trail capture (tsk-6b6): every verdict branch logs a --------
// decisionsById entry via the shipped addDecision (tsk-63c) -- the item's own
// stated verify criterion, "cả 4 nhánh" (all 4 branches). ------------------

test('resolveDecompose logs a decisionsById entry on an invalid (spawn failure) verdict', () => {
  const cfg = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  resolveDecompose(storeDir, 'item-x', cfg, 'runner');

  const entries = listWork(storeDir).decisionsById['item-x'];
  assert.equal(entries.length, 1);
  assert.equal(entries[0].source, 'judgeDecompose');
  assert.match(entries[0].text, /invalid/);
  assert.ok(entries[0].rationale.length > 0);
});

test('resolveDecompose logs a decisionsById entry on a need-human verdict, using the model reason', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, {
    verdict: 'need-human',
    reason: 'Scope unclear across two services',
  });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  resolveDecompose(storeDir, 'item-x', cfg, 'runner');

  const entries = listWork(storeDir).decisionsById['item-x'];
  assert.equal(entries.length, 1);
  assert.match(entries[0].text, /need-human/);
  assert.equal(entries[0].rationale, 'Scope unclear across two services');
});

test('resolveDecompose logs a decisionsById entry on a pass-through verdict, using the model reason when supplied', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, { verdict: 'pass-through', reason: 'Single cohesive change' });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  resolveDecompose(storeDir, 'item-x', cfg, 'runner');

  const entries = listWork(storeDir).decisionsById['item-x'];
  assert.equal(entries.length, 1);
  assert.match(entries[0].text, /pass-through/);
  assert.equal(entries[0].rationale, 'Single cohesive change');
});

test('resolveDecompose logs a fixed fallback rationale on a pass-through verdict with no model reason', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, { verdict: 'pass-through' });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  resolveDecompose(storeDir, 'item-x', cfg, 'runner');

  const entries = listWork(storeDir).decisionsById['item-x'];
  assert.equal(entries.length, 1);
  assert.match(entries[0].text, /pass-through/);
  assert.ok(entries[0].rationale.length > 0);
});

test('resolveDecompose logs a decisionsById entry on a decompose verdict, including the child count', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictWithVerifyCheckExecutor(scriptDir, {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser' },
      { title: 'Build renderer', verify: 'npm test -- renderer' },
    ],
  });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  resolveDecompose(storeDir, 'item-x', cfg, 'runner');

  const entries = listWork(storeDir).decisionsById['item-x'];
  assert.equal(entries.length, 1);
  assert.match(entries[0].text, /decompose/);
  assert.match(entries[0].text, /2 children/);
  assert.equal(entries[0].rationale, 'Two independent surfaces, no shared state');
});

// --- tsk-g18: resolveDecompose threads scout-notes.md through judgeDecompose

function writeArgvAndPromptRecordingExecutor(dir, argvPath, stdoutContent) {
  const scriptPath = path.join(dir, 'argv-prompt-recording-executor.mjs');
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

function ndjsonScoutTranscript(resultVerdict) {
  const events = [
    {
      type: 'assistant',
      message: { role: 'assistant', content: [{ type: 'tool_use', id: 't1', name: 'Bash', input: { command: 'rg reporting-pipeline' } }] },
    },
    { type: 'user', message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't1', content: 'src/report.mjs:1:reporting-pipeline' }] } },
    { type: 'result', subtype: 'success', result: JSON.stringify(resultVerdict) },
  ];
  return `${events.map((e) => JSON.stringify(e)).join('\n')}\n`;
}

// tmpStoreDir() (above) creates its store dir DIRECTLY under os.tmpdir(), so
// resolveDecompose's own `repoRoot = path.dirname(dir)` collapses to the
// shared os.tmpdir() itself — fine for every other test here, but
// scout-notes.md tests write a REAL file under `<repoRoot>/<docsRef>`, so
// reusing tmpStoreDir() would leak state across separate test runs sharing
// the same os.tmpdir(). This nests the store dir one level under its own
// fresh repo root instead, so `path.dirname(storeDir)` is unique per test —
// the same shape a real repo has (`.fgos/` directly under the repo root).
function tmpRepoAndStoreDir() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-scout-notes-repo-'));
  const storeDir = path.join(repoRoot, '.fgos');
  fs.mkdirSync(storeDir);
  return storeDir;
}

// Same freshness contract discovery.mjs proves for judgeDiscovery: a
// pre-existing scout-notes.md under the item's docsRef shows up in
// judgeDecompose's prompt and skips stream-json transcript capture — no new
// evidence to persist, spawn stays exactly like a pre-tsk-g18 call.
test('resolveDecompose with an existing scout-notes.md embeds it in the prompt and skips stream-json capture', () => {
  const scriptDir = mkTempDir();
  const argvPath = path.join(scriptDir, 'argv.json');
  const scriptPath = writeArgvAndPromptRecordingExecutor(
    scriptDir,
    argvPath,
    JSON.stringify({ verdict: 'pass-through' }),
  );
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpRepoAndStoreDir();
  const docsRef = 'docs/history/decompose-scout-fresh-item';
  const featureDir = path.join(path.dirname(storeDir), docsRef);
  fs.mkdirSync(featureDir, { recursive: true });
  fs.writeFileSync(path.join(featureDir, 'scout-notes.md'), '## Scout 1\n\n**Command:** `rg PRIOR-DECOMPOSE-EVIDENCE`\n');
  addWork(storeDir, sampleWork({ docsRef }));

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'runner');
  assert.equal(result.outcome, 'pass-through');

  const [prompt] = JSON.parse(fs.readFileSync(argvPath, 'utf8'));
  assert.match(prompt, /PRIOR-DECOMPOSE-EVIDENCE/);
  const argv = JSON.parse(fs.readFileSync(argvPath, 'utf8'));
  assert.equal(argv.includes('--output-format'), false);
});

// No scout-notes.md yet: the judge call captures its own stream-json
// transcript and resolveDecompose's own call chain persists it as the
// item's first scout-notes.md — parent-written, never by the judge itself.
test('resolveDecompose with no existing scout-notes.md captures the transcript and persists it under the item docsRef', () => {
  const scriptDir = mkTempDir();
  const scriptPath = path.join(scriptDir, 'stream-json-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `process.stdout.write(${JSON.stringify(ndjsonScoutTranscript({ verdict: 'pass-through', reason: 'scouted, simple' }))}); process.exit(0);`,
  );
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpRepoAndStoreDir();
  const docsRef = 'docs/history/decompose-scout-new-item';
  addWork(storeDir, sampleWork({ docsRef }));

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'runner');
  assert.equal(result.outcome, 'pass-through');

  const notes = readScoutNotes(path.dirname(storeDir), docsRef);
  assert.match(notes, /rg reporting-pipeline/);
  assert.match(notes, /src\/report\.mjs:1:reporting-pipeline/);
});

// --- decompose-side skip-and-advance + real verify (tsk-19j D1/D3/D7,
// closes gaps 2/3): resolveDecompose skips judgeDecompose ONLY when
// plan.md's own recorded mode is tiny/small (single-piece by fgos-planning's
// mode gate, so there is nothing for the model to judge) -- any other mode,
// or no locked plan.md at all, still calls the real model unchanged. Every
// advance to executing prefers gates[id].planApprove.verify over the item's
// existing verify/FALLBACK_VERIFY when a Track A approve record exists. ---

function mkPlanFixture(storeDir, planContent) {
  const repoRoot = path.dirname(storeDir);
  const featureDir = fs.mkdtempSync(path.join(repoRoot, 'fgos-plan-'));
  fs.writeFileSync(path.join(featureDir, 'CONTEXT.md'), '# CONTEXT\n\nD1: locked.\n');
  fs.writeFileSync(path.join(featureDir, 'plan.md'), planContent);
  return path.basename(featureDir);
}

test('resolveDecompose skips judgeDecompose and advances straight to executing when plan.md declares mode "tiny"', () => {
  const dir = mkTempDir();
  const { scriptPath, counterPath } = writeCountingRawStdoutExecutor(dir, JSON.stringify({ verdict: 'decompose', reason: 'should never run', children: [{ title: 'x', verify: 'npm test' }] }));
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  const docsRef = mkPlanFixture(storeDir, '# plan\n\nmode = **tiny** (1 file, direct task).\n');
  addWork(storeDir, sampleWork({ docsRef }));
  recordGateApprove(storeDir, { id: 'item-x', gate: 'planApprove', actor: 'human', verify: 'npm test -- tiny-item' });

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'session');
  assert.equal(result.outcome, 'pass-through');
  assert.equal(readCount(counterPath), 0, 'judgeDecompose must never spawn the executor on the skip path');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'executing');
  assert.equal(view.work['item-x'].verify, 'npm test -- tiny-item');
  assert.equal(Object.values(view.work).some((item) => item.parent === 'item-x'), false, 'no children ever get written on the skip path');
  const decisions = view.decisionsById?.['item-x'] ?? [];
  assert.ok(decisions.some((d) => d.text.startsWith('decompose skip:')), 'skip must log an audit-trail decision');
});

test('resolveDecompose skips judgeDecompose for mode "small" too, falling back to the item\'s own verify when no planApprove record exists', () => {
  const dir = mkTempDir();
  const { scriptPath, counterPath } = writeCountingRawStdoutExecutor(dir, JSON.stringify({ verdict: 'pass-through' }));
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  const docsRef = mkPlanFixture(storeDir, '# plan\n\nMode: small — a few files, no gray areas.\n');
  addWork(storeDir, sampleWork({ docsRef }));

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'session');
  assert.equal(result.outcome, 'pass-through');
  assert.equal(readCount(counterPath), 0);

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].verify, 'npm test -- reporting', 'unchanged from sampleWork\'s own verify — no planApprove to prefer');
});

test('resolveDecompose still calls judgeDecompose when plan.md declares mode "standard" or "high-risk" (skip never applies past tiny/small)', () => {
  for (const mode of ['standard', 'high-risk']) {
    const dir = mkTempDir();
    const { scriptPath, counterPath } = writeCountingRawStdoutExecutor(dir, JSON.stringify({ verdict: 'pass-through', reason: 'real judgment ran' }));
    const cfg = cfgFor([scriptPath, '{prompt}']);

    const storeDir = tmpStoreDir();
    const docsRef = mkPlanFixture(storeDir, `# plan\n\nmode = **${mode}**.\n`);
    addWork(storeDir, sampleWork({ docsRef }));

    const result = resolveDecompose(storeDir, 'item-x', cfg, 'session');
    assert.equal(result.outcome, 'pass-through');
    assert.equal(readCount(counterPath), 1, `judgeDecompose must still run for mode "${mode}"`);
  }
});

test('resolveDecompose still calls judgeDecompose when no plan.md is locked at all (unchanged behavior)', () => {
  const dir = mkTempDir();
  const { scriptPath, counterPath } = writeCountingRawStdoutExecutor(dir, JSON.stringify({ verdict: 'pass-through' }));
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ docsRef: 'docs/history/never-written/' }));

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'session');
  assert.equal(result.outcome, 'pass-through');
  assert.equal(readCount(counterPath), 1);
});

test('resolveDecompose real pass-through path (via judgeDecompose) still prefers gates[id].planApprove.verify when present', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, { verdict: 'pass-through', reason: 'simple enough' });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  const docsRef = mkPlanFixture(storeDir, '# plan\n\nmode = **standard** (real judgment needed).\n');
  addWork(storeDir, sampleWork({ docsRef }));
  recordGateApprove(storeDir, { id: 'item-x', gate: 'planApprove', actor: 'human', verify: 'node --test test/real-standard-item.test.mjs' });

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'session');
  assert.equal(result.outcome, 'pass-through');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].verify, 'node --test test/real-standard-item.test.mjs');
});

// --- resolveContentRoot (tsk-1ni D1): mkPlanFixture above builds its
// content as a sibling of storeDir, so repoRoot == content-root by
// construction -- exactly the coincidence discovery.test.mjs's own
// mkLockedContextFixture comment already named as what let the real
// repoRoot bug ship uncaught. Those existing tests above still pass
// unchanged because that coincidence lands resolveContentRoot on its OWN
// third (stateRoot) fallback branch when neither process.cwd() nor a real
// registered worktree hold the content -- covered implicitly, not a gap.
// These two tests cover the other two branches explicitly, with a REAL
// git repo/worktree instead of a coincidental sibling directory. ---

function initTempGitRepoWithStore() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-resolve-content-root-repo-'));
  execFileSync('git', ['init', '-q'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: repoRoot });
  const storeDir = path.join(repoRoot, '.fgos');
  fs.mkdirSync(storeDir, { recursive: true });
  return { repoRoot, storeDir };
}

test('resolveContentRoot finds a real plan.md via process.cwd() when neither the state root nor any worktree hold it', () => {
  const { storeDir } = initTempGitRepoWithStore();

  const contentDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-resolve-content-root-cwd-'));
  const featureDir = path.join(contentDir, 'feature');
  fs.mkdirSync(featureDir, { recursive: true });
  fs.writeFileSync(path.join(featureDir, 'plan.md'), 'mode = **tiny** (1 file, direct task).\n');

  const originalCwd = process.cwd();
  process.chdir(contentDir);
  let resolved;
  try {
    resolved = resolveContentRoot(path.dirname(storeDir), 'item-x', 'feature');
  } finally {
    process.chdir(originalCwd);
  }

  assert.equal(resolved, contentDir);
});

test('resolveDecompose skips judgeDecompose when plan.md is only reachable via process.cwd() (D1 branch 1, real end-to-end)', () => {
  const { storeDir } = initTempGitRepoWithStore();
  const { scriptPath, counterPath } = writeCountingRawStdoutExecutor(
    mkTempDir(),
    JSON.stringify({ verdict: 'decompose', reason: 'should never run', children: [{ title: 'x', verify: 'npm test' }] }),
  );
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const contentDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-resolve-content-root-cwd-e2e-'));
  const featureDir = path.join(contentDir, 'feature');
  fs.mkdirSync(featureDir, { recursive: true });
  fs.writeFileSync(path.join(featureDir, 'plan.md'), 'mode = **tiny** (1 file, direct task).\n');

  addWork(storeDir, sampleWork({ docsRef: 'feature' }));
  recordGateApprove(storeDir, { id: 'item-x', gate: 'planApprove', actor: 'human', verify: 'npm test -- cwd-hit' });

  const originalCwd = process.cwd();
  process.chdir(contentDir);
  let result;
  try {
    result = resolveDecompose(storeDir, 'item-x', cfg, 'session');
  } finally {
    process.chdir(originalCwd);
  }

  assert.equal(result.outcome, 'pass-through');
  assert.equal(readCount(counterPath), 0, 'judgeDecompose must never spawn when cwd already holds the locked plan.md');
});

test('resolveContentRoot finds a real committed plan.md via git worktree list when cwd does not hold it (D1 branch 2, crash-recovery case)', () => {
  const { repoRoot, storeDir } = initTempGitRepoWithStore();

  const worktreeBase = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-resolve-content-root-wt-'));
  const { path: worktreePath } = createWorktree(repoRoot, 'item-x', { worktreeDir: worktreeBase });
  const featureDir = path.join(worktreePath, 'feature');
  fs.mkdirSync(featureDir, { recursive: true });
  fs.writeFileSync(path.join(featureDir, 'plan.md'), 'mode = **tiny** (1 file, direct task).\n');
  execFileSync('git', ['add', 'feature'], { cwd: worktreePath });
  execFileSync('git', ['commit', '-q', '-m', 'plan: item-x'], { cwd: worktreePath });

  const elsewhere = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-resolve-content-root-elsewhere-'));
  const originalCwd = process.cwd();
  process.chdir(elsewhere);
  let resolved;
  try {
    resolved = resolveContentRoot(repoRoot, 'item-x', 'feature');
  } finally {
    process.chdir(originalCwd);
  }

  assert.equal(resolved, worktreePath);
});

test('resolveDecompose skips judgeDecompose when plan.md is only reachable via a real registered worktree (D1 branch 2, real end-to-end)', () => {
  const { repoRoot, storeDir } = initTempGitRepoWithStore();
  const { scriptPath, counterPath } = writeCountingRawStdoutExecutor(
    mkTempDir(),
    JSON.stringify({ verdict: 'decompose', reason: 'should never run', children: [{ title: 'x', verify: 'npm test' }] }),
  );
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const worktreeBase = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-resolve-content-root-wt-e2e-'));
  const { path: worktreePath } = createWorktree(repoRoot, 'item-x', { worktreeDir: worktreeBase });
  const featureDir = path.join(worktreePath, 'feature');
  fs.mkdirSync(featureDir, { recursive: true });
  fs.writeFileSync(path.join(featureDir, 'plan.md'), 'mode = **tiny** (1 file, direct task).\n');
  execFileSync('git', ['add', 'feature'], { cwd: worktreePath });
  execFileSync('git', ['commit', '-q', '-m', 'plan: item-x'], { cwd: worktreePath });

  addWork(storeDir, sampleWork({ docsRef: 'feature' }));
  recordGateApprove(storeDir, { id: 'item-x', gate: 'planApprove', actor: 'human', verify: 'npm test -- worktree-hit' });

  const elsewhere = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-resolve-content-root-elsewhere-e2e-'));
  const originalCwd = process.cwd();
  process.chdir(elsewhere);
  let result;
  try {
    result = resolveDecompose(storeDir, 'item-x', cfg, 'session');
  } finally {
    process.chdir(originalCwd);
  }

  assert.equal(result.outcome, 'pass-through');
  assert.equal(readCount(counterPath), 0, 'judgeDecompose must never spawn when a real registered worktree already holds the locked plan.md');
});

test('resolveContentRoot falls back to stateRoot when neither cwd nor any registered worktree hold the content (D1 branch 3, unchanged behavior)', () => {
  const { repoRoot, storeDir } = initTempGitRepoWithStore();
  fs.mkdirSync(path.join(repoRoot, 'feature'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'feature', 'plan.md'), 'mode = **tiny** (1 file, direct task).\n');

  const elsewhere = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-resolve-content-root-fallback-'));
  const originalCwd = process.cwd();
  process.chdir(elsewhere);
  let resolved;
  try {
    resolved = resolveContentRoot(repoRoot, 'item-x', 'feature');
  } finally {
    process.chdir(originalCwd);
  }

  assert.equal(resolved, repoRoot);
});

// --- caller-supplied verdict (tsk-27y D1/D2/D3): resolveDecompose skips
// judgeDecompose entirely when a caller (e.g. a live fgos-planning session)
// passes its own already-rendered verdict, checked BEFORE the plan.md
// tiny/small mode skip-and-advance heuristic. Downstream safety gates
// (heavy-risk/blast-radius/footprint-overlap) still apply unconditionally. -

test('resolveDecompose skips judgeDecompose and advances to executing on a caller-supplied pass-through verdict', () => {
  const dir = mkTempDir();
  const { scriptPath, counterPath } = writeCountingRawStdoutExecutor(dir, JSON.stringify({ verdict: 'decompose', reason: 'should never run', children: [{ title: 'x', verify: 'npm test' }] }));
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'session', { verdict: 'pass-through', reason: 'single-piece, no split needed' });
  assert.equal(result.outcome, 'pass-through');
  assert.equal(readCount(counterPath), 0, 'judgeDecompose must never spawn the executor when a caller verdict is supplied');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'executing');
  const decisions = view.decisionsById?.['item-x'] ?? [];
  assert.ok(decisions.some((d) => d.text.startsWith('decompose caller-supplied:')), 'caller-supplied path must log a distinct audit-trail decision');
});

test('resolveDecompose parks in awaiting-human on a caller-supplied need-human verdict, with the caller-supplied reason', () => {
  const dir = mkTempDir();
  const { scriptPath, counterPath } = writeCountingRawStdoutExecutor(dir, JSON.stringify({ verdict: 'pass-through' }));
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'session', { verdict: 'need-human', reason: 'Which auth provider should the split assume?' });
  assert.equal(result.outcome, 'need-human');
  assert.equal(readCount(counterPath), 0);

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].status, 'awaiting-human');
  assert.match(view.gates['item-x'].ask, /Which auth provider should the split assume\?/);
});

test('resolveDecompose writes real children on a caller-supplied decompose verdict, same shape a model verdict produces', () => {
  const dir = mkTempDir();
  const { scriptPath, counterPath } = writeCountingRawStdoutExecutor(dir, JSON.stringify({ verdict: 'pass-through', reason: 'should never run' }));
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'session', {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser' },
      { title: 'Build renderer', verify: 'npm test -- renderer' },
    ],
  });
  assert.equal(result.outcome, 'decompose');
  assert.equal(readCount(counterPath), 0);
  assert.deepEqual(result.childIds, ['item-x-1', 'item-x-2']);

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'executing');
  assert.equal(view.work['item-x-1'].title, 'Build parser');
  assert.equal(view.work['item-x-1'].verify, 'npm test -- parser');
  assert.equal(view.work['item-x-1'].parent, 'item-x');
  assert.equal(view.work['item-x-2'].title, 'Build renderer');
});

test('resolveDecompose rejects a caller-supplied decompose verdict with a child missing verify, same fail-safe a model verdict gets', () => {
  const dir = mkTempDir();
  const { scriptPath, counterPath } = writeCountingRawStdoutExecutor(dir, JSON.stringify({ verdict: 'pass-through' }));
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'session', {
    verdict: 'decompose',
    reason: 'Two independent surfaces',
    children: [{ title: 'Build parser' }], // no verify
  });
  assert.equal(result.outcome, 'invalid');
  assert.equal(readCount(counterPath), 0);

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'decompose', 'item left exactly where it was, same as a model-verdict invalid outcome');
  assert.equal(Object.values(view.work).some((item) => item.parent === 'item-x'), false);
});

test('resolveDecompose still gates a caller-supplied decompose verdict to awaiting-human on overlapping footprint (D3 — gates apply regardless of verdict origin)', () => {
  const dir = mkTempDir();
  const { scriptPath, counterPath } = writeCountingRawStdoutExecutor(dir, JSON.stringify({ verdict: 'pass-through' }));
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'session', {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser', footprint: ['src/parser.mjs', 'src/shared.mjs'] },
      { title: 'Build renderer', verify: 'npm test -- renderer', footprint: ['src/shared.mjs', 'src/renderer.mjs'] },
    ],
  });
  assert.equal(result.outcome, 'need-human');
  assert.equal(readCount(counterPath), 0);

  const view = listWork(storeDir);
  assert.match(view.gates['item-x'].ask, /src\/shared\.mjs/);
  const children = Object.values(view.work).filter((item) => item.parent === 'item-x');
  assert.equal(children.length, 0);
});

test('resolveDecompose still routes a caller-supplied verdict through the heavy-risk gate (D3 — gates apply regardless of verdict origin)', () => {
  const dir = mkTempDir();
  const { scriptPath, counterPath } = writeCountingRawStdoutExecutor(dir, JSON.stringify({ verdict: 'pass-through' }));
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ risk: 'heavy' }));

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'session', { verdict: 'pass-through', reason: 'single-piece' });
  assert.equal(result.outcome, 'need-human');
  assert.equal(readCount(counterPath), 0);

  const view = listWork(storeDir);
  assert.match(view.gates['item-x'].ask, /risk cao \(heavy\)/);
});

test('resolveDecompose caller-supplied verdict takes precedence over the plan.md tiny/small mode skip-and-advance heuristic (D2)', () => {
  const dir = mkTempDir();
  const { scriptPath, counterPath } = writeCountingRawStdoutExecutor(dir, JSON.stringify({ verdict: 'decompose', reason: 'should never run', children: [{ title: 'x', verify: 'npm test' }] }));
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  const docsRef = mkPlanFixture(storeDir, '# plan\n\nmode = **tiny** (1 file, direct task).\n');
  addWork(storeDir, sampleWork({ docsRef }));

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'session', { verdict: 'pass-through', reason: 'caller already decided' });
  assert.equal(result.outcome, 'pass-through');
  assert.equal(readCount(counterPath), 0);

  const view = listWork(storeDir);
  const decisions = view.decisionsById?.['item-x'] ?? [];
  assert.ok(decisions.some((d) => d.text.startsWith('decompose caller-supplied:')));
  assert.ok(!decisions.some((d) => d.text.startsWith('decompose skip:')), 'the plan.md mode skip-and-advance path must never fire when a caller verdict is present');
});

// --- tsk-1gr D1/D2 (docs/history/decompose-locked-decision-footprint-
// coverage/CONTEXT.md): findUncoveredLockedDecisions -- mechanical
// path-token check over CONTEXT.md's own "## Locked decisions" section,
// advisory only, never blocks. ---

function mkContextFixture(storeDir, contextContent) {
  const repoRoot = path.dirname(storeDir);
  const featureDir = fs.mkdtempSync(path.join(repoRoot, 'fgos-ctx-'));
  fs.writeFileSync(path.join(featureDir, 'CONTEXT.md'), contextContent);
  return { docsRef: path.basename(featureDir), featureDir };
}

test('findUncoveredLockedDecisions: a real path named in Locked decisions with no covering child footprint is uncovered', () => {
  const repoRoot = mkTempDir();
  fs.writeFileSync(path.join(repoRoot, 'important.mjs'), '// fixture\n');
  const contextText = '## Locked decisions\n\nD1: results must be written to `important.mjs`.\n';
  const uncovered = findUncoveredLockedDecisions(contextText, [{ footprint: ['src/other.mjs'] }], repoRoot);
  assert.deepEqual(uncovered, ['important.mjs']);
});

test('findUncoveredLockedDecisions: a path a child footprint already covers is not reported', () => {
  const repoRoot = mkTempDir();
  fs.writeFileSync(path.join(repoRoot, 'important.mjs'), '// fixture\n');
  const contextText = '## Locked decisions\n\nD1: results must be written to `important.mjs`.\n';
  const uncovered = findUncoveredLockedDecisions(contextText, [{ footprint: ['important.mjs'] }], repoRoot);
  assert.deepEqual(uncovered, []);
});

test('findUncoveredLockedDecisions: no "## Locked decisions" section at all yields no findings', () => {
  const repoRoot = mkTempDir();
  const contextText = '## plan.md\n\nmode = tiny, no locked-decisions heading here.\n';
  assert.deepEqual(findUncoveredLockedDecisions(contextText, [], repoRoot), []);
});

test('findUncoveredLockedDecisions: a path-shaped token that names no real file is exempt (prose, not a real file)', () => {
  const repoRoot = mkTempDir();
  const contextText = '## Locked decisions\n\nD1: this reads like a/path but names nothing real.\n';
  assert.deepEqual(findUncoveredLockedDecisions(contextText, [], repoRoot), []);
});

test('resolveDecompose caller-supplied decompose verdict: an uncovered locked-decision path logs an advisory decision but still writes children (D1 — never blocks)', () => {
  const dir = mkTempDir();
  const { scriptPath, counterPath } = writeCountingRawStdoutExecutor(dir, JSON.stringify({ verdict: 'pass-through', reason: 'should never run' }));
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  // Named uniquely off docsRef itself (a fresh mkdtemp basename) so the
  // fixture file, living directly under the shared os.tmpdir() repo root,
  // never collides with another test's own fixture of the same shape.
  const { docsRef } = mkContextFixture(storeDir, '## Locked decisions\n\nD1: placeholder — filled below.\n');
  const fixtureRelPath = `${docsRef}.mjs`;
  fs.writeFileSync(path.join(path.dirname(storeDir), fixtureRelPath), '// fixture\n');
  fs.writeFileSync(
    path.join(path.dirname(storeDir), docsRef, 'CONTEXT.md'),
    `## Locked decisions\n\nD1: canonical output lives at \`${fixtureRelPath}\`.\n`,
  );
  addWork(storeDir, sampleWork({ docsRef }));

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'session', {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser', footprint: ['src/parser.mjs'] },
      { title: 'Build renderer', verify: 'npm test -- renderer', footprint: ['src/renderer.mjs'] },
    ],
  });
  assert.equal(result.outcome, 'decompose', 'the advisory must never block the real decompose write');
  assert.equal(readCount(counterPath), 0);

  const view = listWork(storeDir);
  assert.equal(Object.values(view.work).filter((item) => item.parent === 'item-x').length, 2, 'children are still written despite the coverage gap');
  const decisions = view.decisionsById?.['item-x'] ?? [];
  assert.ok(
    decisions.some((d) => d.text.includes('completeness advisory') && d.text.includes(fixtureRelPath)),
    'the coverage gap must be logged as its own decision',
  );
});

test('resolveDecompose caller-supplied decompose verdict: a child footprint that covers the locked-decision path logs no advisory', () => {
  const dir = mkTempDir();
  const { scriptPath, counterPath } = writeCountingRawStdoutExecutor(dir, JSON.stringify({ verdict: 'pass-through', reason: 'should never run' }));
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  const { docsRef } = mkContextFixture(storeDir, '## Locked decisions\n\nD1: placeholder — filled below.\n');
  const fixtureRelPath = `${docsRef}.mjs`;
  fs.writeFileSync(path.join(path.dirname(storeDir), fixtureRelPath), '// fixture\n');
  fs.writeFileSync(
    path.join(path.dirname(storeDir), docsRef, 'CONTEXT.md'),
    `## Locked decisions\n\nD1: canonical output lives at \`${fixtureRelPath}\`.\n`,
  );
  addWork(storeDir, sampleWork({ docsRef }));

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'session', {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [{ title: 'Build parser', verify: 'npm test -- parser', footprint: [fixtureRelPath] }],
  });
  assert.equal(result.outcome, 'decompose');
  assert.equal(readCount(counterPath), 0);

  const view = listWork(storeDir);
  const decisions = view.decisionsById?.['item-x'] ?? [];
  assert.ok(!decisions.some((d) => d.text.includes('completeness advisory')), 'a covered path must never be reported');
});

test('resolveDecompose auto-judged (model) decompose verdict also runs the completeness advisory (tsk-1gr fix: not caller-verdict-only)', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictWithVerifyCheckExecutor(dir, {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [{ title: 'Build parser', verify: 'npm test -- parser', footprint: ['src/parser.mjs'] }],
  });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  const { docsRef } = mkContextFixture(storeDir, '## Locked decisions\n\nD1: placeholder — filled below.\n');
  const fixtureRelPath = `${docsRef}.mjs`;
  fs.writeFileSync(path.join(path.dirname(storeDir), fixtureRelPath), '// fixture\n');
  fs.writeFileSync(
    path.join(path.dirname(storeDir), docsRef, 'CONTEXT.md'),
    `## Locked decisions\n\nD1: canonical output lives at \`${fixtureRelPath}\`.\n`,
  );
  addWork(storeDir, sampleWork({ docsRef }));

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'runner');
  assert.equal(result.outcome, 'decompose');

  const view = listWork(storeDir);
  const decisions = view.decisionsById?.['item-x'] ?? [];
  assert.ok(
    decisions.some((d) => d.text.includes('completeness advisory') && d.text.includes(fixtureRelPath)),
    'the completeness check must fire on the model-judged path too, not only callerVerdict',
  );
});

test('resolveDecompose omitting callerVerdict entirely keeps prior behavior (byte-identical call site)', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, { verdict: 'pass-through', reason: 'real judgment ran' });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolveDecompose(storeDir, 'item-x', cfg, 'session');
  assert.equal(result.outcome, 'pass-through');
});
