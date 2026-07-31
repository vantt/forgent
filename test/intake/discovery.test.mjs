import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { judgeDiscovery, resolveDiscovery } from '../../src/intake/discovery.mjs';
import { addWork, listWork, StoreError, categoryOf, putInAwaiting, answerAwaiting, moveWork } from '../../src/state/store.mjs';
import { appendEvent, readEvents } from '../../src/state/events.mjs';

// Fake executors only — every "command" spawned here is a node script this
// file writes to a mkdtemp directory at test time, mirroring dispatch.test.mjs's
// convention. No real agent CLI is ever invoked.

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-discovery-test-'));
}

function writeVerdictExecutor(dir, verdict) {
  const scriptPath = path.join(dir, 'verdict-executor.mjs');
  fs.writeFileSync(scriptPath, `process.stdout.write(${JSON.stringify(JSON.stringify(verdict))}); process.exit(0);`);
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

function writeCountingRawStdoutExecutor(dir, rawStdout) {
  const scriptPath = path.join(dir, 'counting-raw-executor.mjs');
  const counterPath = path.join(dir, 'counting-raw-count.txt');
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
// — proves judgeDiscovery's retry (str68 D2) resolves to the retry verdict.
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
    title: 'Produce the output file',
    kind: 'feature',
    status: 'todo',
    deps: [],
    risk: 'low',
    refs: [],
    verify: 'P15 will fill this in',
    stage: 'clarify',
    ...overrides,
  };
}

// --- judgeDiscovery: real-model-shaped path + fail-safe on every failure --

test('judgeDiscovery returns clear:true with the model-proposed verify', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, { clear: true, verify: 'npm test -- discovered' });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDiscovery(sampleWork(), cfg);
  assert.deepEqual(verdict, { clear: true, verify: 'npm test -- discovered' });
});

test('judgeDiscovery returns clear:true with no verify key when the model omits one', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, { clear: true });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDiscovery(sampleWork(), cfg);
  assert.deepEqual(verdict, { clear: true });
});

test('judgeDiscovery returns clear:false with the model-proposed question', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, { clear: false, question: 'What is the target file?' });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDiscovery(sampleWork(), cfg);
  assert.deepEqual(verdict, { clear: false, question: 'What is the target file?' });
});

test('judgeDiscovery falls back to a default question when the model says unclear but supplies none', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, { clear: false });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDiscovery(sampleWork(), cfg);
  assert.equal(verdict.clear, false);
  assert.equal(typeof verdict.question, 'string');
  assert.ok(verdict.question.length > 0);
});

test('judgeDiscovery embeds the item title/kind/refs/deps in the prompt sent to the executor', () => {
  const dir = mkTempDir();
  const echoScript = path.join(dir, 'echo-prompt.mjs');
  fs.writeFileSync(
    echoScript,
    `
    const prompt = process.argv[2];
    process.stdout.write(JSON.stringify({ clear: true, verify: prompt.includes('Produce the output file') ? 'ok' : 'missing' }));
    process.exit(0);
    `,
  );
  const cfg = cfgFor([echoScript, '{prompt}']);
  const verdict = judgeDiscovery(sampleWork({ refs: ['a.mjs'], deps: [] }), cfg);
  assert.deepEqual(verdict, { clear: true, verify: 'ok' });
});

test('judgeDiscovery fails safe (never throws, never clear) on unparsable stdout, retrying up to MAX_JUDGE_ATTEMPTS before falling back (nested-judge-fix)', () => {
  const dir = mkTempDir();
  const { scriptPath, counterPath } = writeCountingRawStdoutExecutor(dir, 'not json at all');
  const cfg = cfgFor([scriptPath, '{prompt}']);
  let verdict;
  assert.doesNotThrow(() => {
    verdict = judgeDiscovery(sampleWork(), cfg);
  });
  assert.equal(verdict.clear, false);
  assert.equal(typeof verdict.question, 'string');
  assert.equal(readCount(counterPath), 3);
});

test('judgeDiscovery retries once with a stricter prompt on a parse-shaped failure and resolves to the retry verdict', () => {
  const dir = mkTempDir();
  const scriptPath = writeFlakyThenValidExecutor(dir, 'not json at all', {
    clear: true,
    verify: 'npm test -- retried',
  });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDiscovery(sampleWork(), cfg);
  assert.deepEqual(verdict, { clear: true, verify: 'npm test -- retried' });
});

test('judgeDiscovery fails safe when the verdict JSON is missing the "clear" field', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, { question: 'huh' });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDiscovery(sampleWork(), cfg);
  assert.equal(verdict.clear, false);
});

test('judgeDiscovery fails safe when "clear" is present but not a boolean', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, { clear: 'yes' });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDiscovery(sampleWork(), cfg);
  assert.equal(verdict.clear, false);
});

test('judgeDiscovery fails safe when the executor exits non-zero, attempting exactly once — no retry on a non-parse failure', () => {
  const dir = mkTempDir();
  const { scriptPath, counterPath } = writeCountingFailingExecutor(dir, 7);
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDiscovery(sampleWork(), cfg);
  assert.equal(verdict.clear, false);
  assert.equal(readCount(counterPath), 1);
});

test('judgeDiscovery fails safe when the configured command does not exist (spawn fail)', () => {
  const cfg = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };
  const verdict = judgeDiscovery(sampleWork(), cfg);
  assert.equal(verdict.clear, false);
});

test('judgeDiscovery fails safe when the executor hangs past the timeout budget', () => {
  const dir = mkTempDir();
  const scriptPath = writeHangingExecutor(dir);
  const cfg = cfgFor([scriptPath], { timeoutMs: 200 });
  const verdict = judgeDiscovery(sampleWork(), cfg);
  assert.equal(verdict.clear, false);
});

test('judgeDiscovery fails safe when the work item\'s tier has no configured model', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, { clear: true, verify: 'ok' });
  const cfg = { executor: { command: process.execPath, args: [scriptPath, '{prompt}'] }, models: {}, timeoutMs: 5000 };
  const verdict = judgeDiscovery(sampleWork({ tier: 'standard' }), cfg);
  assert.equal(verdict.clear, false);
});

// --- discovery-context (P30): description + ask/answer + prior-verdict -----
// context threaded into the prompt via the optional `view` param -----------

function echoPromptExecutor(dir) {
  const scriptPath = path.join(dir, 'echo-full-prompt.mjs');
  fs.writeFileSync(
    scriptPath,
    `
    const prompt = process.argv[2];
    process.stdout.write(JSON.stringify({ clear: true, verify: prompt }));
    process.exit(0);
    `,
  );
  return scriptPath;
}

test('judgeDiscovery with a view embeds the item description verbatim and the latest gate answer in the prompt (P30)', () => {
  const dir = mkTempDir();
  const scriptPath = echoPromptExecutor(dir);
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const work = sampleWork({ description: 'Full submitted text: fix the sluggish overview page for real.' });
  const view = {
    work: { [work.id]: work },
    gates: { [work.id]: { ask: 'Which page exactly?', answer: 'The account overview page, definitely final.' } },
  };
  const verdict = judgeDiscovery(work, cfg, view);
  // `verify` here is the prompt itself (echo executor), per the `verdict.verify`
  // convention used elsewhere in this file — asserting on it is asserting on
  // the actual prompt text sent to the executor.
  assert.match(verdict.verify, /Full submitted text: fix the sluggish overview page for real\./);
  assert.match(verdict.verify, /Which page exactly\?/);
  assert.match(verdict.verify, /The account overview page, definitely final\./);
});

test('judgeDiscovery with a view embeds prior discovery verdicts in the prompt (P30)', () => {
  const dir = mkTempDir();
  const scriptPath = echoPromptExecutor(dir);
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const work = sampleWork();
  const view = {
    work: { [work.id]: work },
    discovery: { [work.id]: [{ clear: false, question: 'What is the target file?' }] },
  };
  const verdict = judgeDiscovery(work, cfg, view);
  assert.match(verdict.verify, /What is the target file\?/);
});

test('judgeDiscovery degrades to placeholders (no throw) when the item has no description and no view is passed — old 2-arg call stays backward-compatible (P30)', () => {
  const dir = mkTempDir();
  const scriptPath = echoPromptExecutor(dir);
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const work = sampleWork();
  assert.equal(work.description, undefined);
  const verdict = judgeDiscovery(work, cfg); // 2-arg, no view — must not throw
  assert.match(verdict.verify, /\(không có\)/);
  assert.match(verdict.verify, /chưa có vòng hỏi-đáp nào với người/);
  assert.match(verdict.verify, /chưa phán lần nào/);
});

test('judgeDiscovery degrades description/gates to placeholders when a view is passed but has no entries for this item (legacy item, P30)', () => {
  const dir = mkTempDir();
  const scriptPath = echoPromptExecutor(dir);
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const work = sampleWork();
  const view = { work: { [work.id]: work } }; // no gates, no discovery for this id
  const verdict = judgeDiscovery(work, cfg, view);
  assert.match(verdict.verify, /\(không có\)/);
  assert.match(verdict.verify, /chưa có vòng hỏi-đáp nào với người/);
  assert.match(verdict.verify, /chưa phán lần nào/);
});

// --- resolveDiscovery: read-judge-write, both outcomes recorded ----------

function tmpStoreDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-resolve-discovery-'));
}

// RETARGET (stage-decompose D2, cell 3): a clear verdict now lands the item
// on stage `decompose`, not `executing` directly — chia-việc is the next
// stop. The two assertions below changed their expected destination from
// `executing` to `decompose` for exactly this reason (per D2, an intentional
// contract change, not a test nerf).

test('resolveDiscovery on a clear verdict writes the discovery record and moves stage to decompose with the proposed verify', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, { clear: true, verify: 'npm test -- discovered' });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolveDiscovery(storeDir, 'item-x', cfg);
  assert.equal(result.outcome, 'clear');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'decompose');
  assert.equal(view.work['item-x'].verify, 'npm test -- discovered');
  assert.equal(view.discovery['item-x'].length, 1);
  assert.equal(view.discovery['item-x'][0].clear, true);
});

test('resolveDiscovery on a clear verdict with no model-proposed verify falls back to a placeholder distinct from the retired P14 sentinel', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, { clear: true });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  resolveDiscovery(storeDir, 'item-x', cfg);
  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'decompose');
  assert.notEqual(view.work['item-x'].verify, 'P15 will fill this in');
  assert.notEqual(view.work['item-x'].verify, 'chưa xác định — P15 bổ sung');
  assert.equal(typeof view.work['item-x'].verify, 'string');
  assert.ok(view.work['item-x'].verify.length > 0);
});

test('resolveDiscovery on an unclear verdict writes the discovery record and parks the item in awaiting-human with the question', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, { clear: false, question: 'Which endpoint?' });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolveDiscovery(storeDir, 'item-x', cfg);
  assert.equal(result.outcome, 'unclear');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].status, 'awaiting-human');
  assert.equal(view.work['item-x'].stage, 'clarify');
  assert.equal(view.gates['item-x'].ask, 'Which endpoint?');
  assert.equal(view.discovery['item-x'].length, 1);
  assert.equal(view.discovery['item-x'][0].clear, false);
});

// claim-lock §5.1: the item's OWN status at the moment of park (not the
// parent's) rides the same putInAwaiting call as statusAtAsk, so
// answerAwaiting can resume to it later instead of always falling to 'todo'.
test('resolveDiscovery on an unclear verdict stamps statusAtAsk from the item\'s status at call time — "todo" when never claimed', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, { clear: false, question: 'Which endpoint?' });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  resolveDiscovery(storeDir, 'item-x', cfg);
  const view = listWork(storeDir);
  assert.equal(view.gates['item-x'].statusAtAsk, 'todo');
});

test('resolveDiscovery on an unclear verdict stamps statusAtAsk "doing" when a pick claim is held through clarify (claim-lock §1/§5.1)', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, { clear: false, question: 'Which endpoint?' });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());
  moveWork(storeDir, { id: 'item-x', to: 'doing', expectedStatus: 'todo', role: 'session' });

  resolveDiscovery(storeDir, 'item-x', cfg);
  const view = listWork(storeDir);
  assert.equal(view.gates['item-x'].statusAtAsk, 'doing');
});

test('resolveDiscovery records the discovery event on the fail-safe path too (a spawn failure still gets an unclear record)', () => {
  const cfg = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  };

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  resolveDiscovery(storeDir, 'item-x', cfg);
  const view = listWork(storeDir);
  assert.equal(view.discovery['item-x'].length, 1);
  assert.equal(view.discovery['item-x'][0].clear, false);
  assert.equal(view.work['item-x'].status, 'awaiting-human');
});

test('resolveDiscovery throws a validation StoreError for an unknown id', () => {
  const storeDir = tmpStoreDir();
  assert.throws(
    () => resolveDiscovery(storeDir, 'nope', cfgFor(['{prompt}'])),
    (err) => err instanceof StoreError && categoryOf(err) === 'validation',
  );
});

// --- P30 CoS regression (dogfood run-1): the re-judge after a person answers
// must see BOTH the full submitted description and the answer, not just the
// (possibly truncated) title — this is the exact gap run-1 hit (the model
// re-asked the same question because the prompt never carried either). ------

test('resolveDiscovery threads the real store view so a re-judge after an answer sees the description and the latest answer (P30 / dogfood run-1 regression)', () => {
  const echoDir = mkTempDir();
  const echoScript = echoPromptExecutor(echoDir);
  const cfg = cfgFor([echoScript, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(
    storeDir,
    sampleWork({
      description: 'Bỏ hardcode tên trunk "main" trong merge engine.',
    }),
  );
  putInAwaiting(storeDir, { id: 'item-x', ask: 'Nguồn tên trunk: auto-detect hay config?' });
  answerAwaiting(storeDir, { id: 'item-x', answer: 'CHỐT: auto-detect, fallback "main". KHÔNG hỏi thêm.' });

  const verdict = resolveDiscovery(storeDir, 'item-x', cfg);
  // Echo executor returns the prompt itself as `verify` — asserting on it
  // asserts on what the model actually saw.
  assert.match(verdict.verdict.verify, /Bỏ hardcode tên trunk "main" trong merge engine\./);
  assert.match(verdict.verdict.verify, /CHỐT: auto-detect, fallback "main"\. KHÔNG hỏi thêm\./);
});

// --- STR8 (D4): judgeDiscovery gains an optional intentScore, computed from
// STR43's graphMetrics + STR21's rankImpact context, never gating clear/unclear -

test('judgeDiscovery includes a valid integer intentScore on a clear verdict', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, { clear: true, verify: 'ok', intentScore: 72 });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDiscovery(sampleWork(), cfg);
  assert.deepEqual(verdict, { clear: true, verify: 'ok', intentScore: 72 });
});

test('judgeDiscovery includes a valid integer intentScore on an unclear verdict too (not gated on clear)', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, { clear: false, question: 'Which file?', intentScore: 15 });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDiscovery(sampleWork(), cfg);
  assert.deepEqual(verdict, { clear: false, question: 'Which file?', intentScore: 15 });
});

test('judgeDiscovery omits intentScore (never throws) when the model supplies a missing or non-integer value', () => {
  const cases = [
    { label: 'missing', raw: { clear: true, verify: 'ok' } },
    { label: 'string', raw: { clear: true, verify: 'ok', intentScore: '80' } },
    { label: 'float', raw: { clear: true, verify: 'ok', intentScore: 12.5 } },
    { label: 'null', raw: { clear: true, verify: 'ok', intentScore: null } },
  ];
  for (const { label, raw } of cases) {
    const dir = mkTempDir();
    const scriptPath = writeVerdictExecutor(dir, raw);
    const cfg = cfgFor([scriptPath, '{prompt}']);
    let verdict;
    assert.doesNotThrow(() => {
      verdict = judgeDiscovery(sampleWork(), cfg);
    }, `case: ${label}`);
    assert.equal('intentScore' in verdict, false, `case: ${label}`);
  }
});

test('the judge prompt states the intentScore response-format range as 0 to 100', () => {
  const dir = mkTempDir();
  const scriptPath = echoPromptExecutor(dir);
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDiscovery(sampleWork(), cfg);
  assert.match(verdict.verify, /intentScore[^\n]*0[^\n]*100/);
});

test('judgeDiscovery with a view embeds the exact graph-context heading and mechanical graph/impact numbers', () => {
  const dir = mkTempDir();
  const scriptPath = echoPromptExecutor(dir);
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const work = sampleWork();
  // item-y depends on item-x -> item-x blocks 1 open item, and both land in
  // the same connected component (size 2) via the undirected deps edge.
  const blocked = sampleWork({ id: 'item-y', deps: ['item-x'] });
  const view = { work: { [work.id]: work, [blocked.id]: blocked } };
  const verdict = judgeDiscovery(work, cfg, view);
  assert.match(verdict.verify, /# Ngữ cảnh đồ thị \(cơ học, chỉ để tham khảo, không tự suy lại\)/);
  assert.match(verdict.verify, /chặn 1 việc khác còn mở/);
  assert.match(verdict.verify, /nhóm liên thông.*2 item/);
});

test('judgeDiscovery with a view but no graph edges degrades the graph-context section without throwing', () => {
  const dir = mkTempDir();
  const scriptPath = echoPromptExecutor(dir);
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const work = sampleWork();
  const view = { work: { [work.id]: work } };
  const verdict = judgeDiscovery(work, cfg, view);
  assert.match(verdict.verify, /# Ngữ cảnh đồ thị \(cơ học, chỉ để tham khảo, không tự suy lại\)/);
  assert.match(verdict.verify, /chặn 0 việc khác còn mở/);
});

// --- STR8 (D4): resolveDiscovery writes `intent` via a second, try/catch-
// wrapped editWork call, right after addDiscovery, before the clear/unclear
// branch -----------------------------------------------------------------

test('resolveDiscovery writes intent when a clear verdict carries a valid integer intentScore', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, {
    clear: true,
    verify: 'npm test -- discovered',
    intentScore: 88,
  });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  resolveDiscovery(storeDir, 'item-x', cfg);
  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].intent, 88);
});

test('resolveDiscovery writes intent when an unclear verdict carries a valid integer intentScore too (not gated on clear)', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, { clear: false, question: 'Which file?', intentScore: 40 });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  resolveDiscovery(storeDir, 'item-x', cfg);
  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].intent, 40);
});

test('resolveDiscovery leaves intent absent when the verdict carries no intentScore', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, { clear: true, verify: 'npm test -- discovered' });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  resolveDiscovery(storeDir, 'item-x', cfg);
  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].intent, undefined);
});

test('resolveDiscovery writes EXACTLY ONE work.edit event carrying intent per call (no duplicate write)', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, {
    clear: true,
    verify: 'npm test -- discovered',
    intentScore: 55,
  });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  resolveDiscovery(storeDir, 'item-x', cfg);

  const events = readEvents(path.join(storeDir, 'events.jsonl'));
  const intentEdits = events.filter(
    (e) => e.type === 'work.edit' && e.payload?.id === 'item-x' && e.payload?.patch?.intent !== undefined,
  );
  assert.equal(intentEdits.length, 1);
});

// --- trust signal (tsk-ozl D1-D3): resolveDiscovery skips judgeDiscovery
// entirely when the item already carries a committed, non-empty
// CONTEXT.md under its docsRef, instead of re-judging blind past a
// decision a human already locked. Same signal for both `session` and
// `runner` callers — no role branch. ---------------------------------

// Builds a docsRef fixture directory as a sibling of storeDir (both live
// directly under os.tmpdir(), so repoRoot = path.dirname(storeDir) is
// their shared parent, exactly matching readLockedContext's real
// `path.join(repoRoot, docsRef)` resolution) and returns the relative
// docsRef string to set on the work item.
function mkLockedContextFixture(storeDir, content = '# CONTEXT\n\nD1: locked.\n') {
  const repoRoot = path.dirname(storeDir);
  const featureDir = fs.mkdtempSync(path.join(repoRoot, 'fgos-context-'));
  fs.writeFileSync(path.join(featureDir, 'CONTEXT.md'), content);
  return path.basename(featureDir);
}

test('resolveDiscovery skips judgeDiscovery and advances to decompose when docsRef points at a real, non-empty CONTEXT.md', () => {
  const scriptDir = mkTempDir();
  const { scriptPath, counterPath } = writeCountingRawStdoutExecutor(scriptDir, JSON.stringify({ clear: true, verify: 'should never run' }));
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  const docsRef = mkLockedContextFixture(storeDir);
  addWork(storeDir, sampleWork({ docsRef }));

  const result = resolveDiscovery(storeDir, 'item-x', cfg, 'session');
  assert.equal(result.outcome, 'clear');
  assert.equal(result.verdict.skipped, true);
  assert.equal(readCount(counterPath), 0, 'judgeDiscovery must never spawn the executor on the skip path');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'decompose');
  assert.equal(view.discovery['item-x'].length, 1);
  assert.equal(view.discovery['item-x'][0].clear, true);
  const decisions = view.decisionsById?.['item-x'] ?? [];
  assert.ok(decisions.some((d) => d.text.startsWith('discovery skip:')), 'skip must log an audit-trail decision');
});

test('resolveDiscovery skip path applies identically for role "runner" (RUL19 sweep) as for role "session" — content-based, no role branch', () => {
  const scriptDir = mkTempDir();
  const { scriptPath, counterPath } = writeCountingRawStdoutExecutor(scriptDir, JSON.stringify({ clear: true, verify: 'should never run' }));
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  const docsRef = mkLockedContextFixture(storeDir);
  addWork(storeDir, sampleWork({ docsRef }));

  const result = resolveDiscovery(storeDir, 'item-x', cfg, 'runner');
  assert.equal(result.outcome, 'clear');
  assert.equal(result.verdict.skipped, true);
  assert.equal(readCount(counterPath), 0);
});

test('resolveDiscovery still calls judgeDiscovery when docsRef is set but CONTEXT.md is missing (fail-open, unchanged behavior)', () => {
  const scriptDir = mkTempDir();
  const { scriptPath, counterPath } = writeCountingRawStdoutExecutor(scriptDir, JSON.stringify({ clear: true, verify: 'ok' }));
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  // docsRef points at a directory that is never created — mirrors an item
  // that predates fgos-exploring or has a stale/incorrect docsRef.
  addWork(storeDir, sampleWork({ docsRef: 'docs/history/never-written/' }));

  const result = resolveDiscovery(storeDir, 'item-x', cfg);
  assert.equal(result.outcome, 'clear');
  assert.equal(result.verdict.skipped, undefined);
  assert.equal(readCount(counterPath), 1, 'no trust signal means judgeDiscovery must still run the model exactly once');
});

test('resolveDiscovery still calls judgeDiscovery when docsRef points at an existing but empty CONTEXT.md (fail-open, unchanged behavior)', () => {
  const scriptDir = mkTempDir();
  const { scriptPath, counterPath } = writeCountingRawStdoutExecutor(scriptDir, JSON.stringify({ clear: true, verify: 'ok' }));
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  const docsRef = mkLockedContextFixture(storeDir, '   \n');
  addWork(storeDir, sampleWork({ docsRef }));

  const result = resolveDiscovery(storeDir, 'item-x', cfg);
  assert.equal(result.outcome, 'clear');
  assert.equal(result.verdict.skipped, undefined);
  assert.equal(readCount(counterPath), 1);
});

test('resolveDiscovery calls judgeDiscovery as before when the item has no docsRef at all (default, most items)', () => {
  const scriptDir = mkTempDir();
  const { scriptPath, counterPath } = writeCountingRawStdoutExecutor(scriptDir, JSON.stringify({ clear: true, verify: 'ok' }));
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolveDiscovery(storeDir, 'item-x', cfg);
  assert.equal(result.outcome, 'clear');
  assert.equal(result.verdict.skipped, undefined);
  assert.equal(readCount(counterPath), 1);
});

test('resolveDiscovery still completes clear/unclear resolution when editWork throws for a corrupted item shape (fail-safe)', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, {
    clear: true,
    verify: 'npm test -- discovered',
    intentScore: 60,
  });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  const logPath = path.join(storeDir, 'events.jsonl');
  // Bypass the normal addWork write door to plant a corrupted item shape
  // (empty `risk`) — replay never validates on fold, so it reads back fine,
  // but editWork's validateWork rejects it when merging the intent patch.
  // This proves resolveDiscovery's try/catch around editWork never aborts
  // the moveStage/putInAwaiting resolution that follows.
  appendEvent(logPath, { type: 'work.add', payload: { ...sampleWork(), risk: '' } });

  assert.doesNotThrow(() => resolveDiscovery(storeDir, 'item-x', cfg));
  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'decompose');
  assert.equal(view.work['item-x'].intent, undefined);
});
