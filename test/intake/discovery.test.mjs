import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { judgeDiscovery, resolveDiscovery } from '../../src/intake/discovery.mjs';
import { readScoutNotes } from '../../src/intake/judge-executor.mjs';
import { computeImpact, computePriority } from '../../src/state/priority-formula.mjs';
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

// --- work-item-priority-matrix D3 (was STR8 D4's intentScore): judgeDiscovery
// gains an optional impactScore, computed from STR43's graphMetrics + STR21's
// rankImpact context, never gating clear/unclear -

test('judgeDiscovery includes a valid integer impactScore on a clear verdict', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, { clear: true, verify: 'ok', impactScore: 72 });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDiscovery(sampleWork(), cfg);
  assert.deepEqual(verdict, { clear: true, verify: 'ok', impactScore: 72 });
});

test('judgeDiscovery includes a valid integer impactScore on an unclear verdict too (not gated on clear)', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, { clear: false, question: 'Which file?', impactScore: 15 });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDiscovery(sampleWork(), cfg);
  assert.deepEqual(verdict, { clear: false, question: 'Which file?', impactScore: 15 });
});

test('judgeDiscovery omits impactScore (never throws) when the model supplies a missing or non-integer value', () => {
  const cases = [
    { label: 'missing', raw: { clear: true, verify: 'ok' } },
    { label: 'string', raw: { clear: true, verify: 'ok', impactScore: '80' } },
    { label: 'float', raw: { clear: true, verify: 'ok', impactScore: 12.5 } },
    { label: 'null', raw: { clear: true, verify: 'ok', impactScore: null } },
  ];
  for (const { label, raw } of cases) {
    const dir = mkTempDir();
    const scriptPath = writeVerdictExecutor(dir, raw);
    const cfg = cfgFor([scriptPath, '{prompt}']);
    let verdict;
    assert.doesNotThrow(() => {
      verdict = judgeDiscovery(sampleWork(), cfg);
    }, `case: ${label}`);
    assert.equal('impactScore' in verdict, false, `case: ${label}`);
  }
});

test('the judge prompt states the impactScore response-format range as 0 to 100', () => {
  const dir = mkTempDir();
  const scriptPath = echoPromptExecutor(dir);
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDiscovery(sampleWork(), cfg);
  assert.match(verdict.verify, /impactScore[^\n]*0[^\n]*100/);
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

// --- tsk-4rd (route A, discover-research-recipe D2 "enrich"): deps' real
// title/description, not just their id, are embedded in the prompt so the
// judge can see "task liên đới đã làm/chưa làm" without a separate lookup.

test('judgeDiscovery with a view embeds each dep\'s real title and description, not just its id', () => {
  const dir = mkTempDir();
  const scriptPath = echoPromptExecutor(dir);
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const dep = sampleWork({
    id: 'item-dep',
    title: 'DEP-TITLE-MARKER',
    status: 'done',
    stage: 'executing',
    description: 'DEP-DESCRIPTION-MARKER explaining what already happened.',
  });
  const work = sampleWork({ deps: ['item-dep'] });
  const view = { work: { [work.id]: work, [dep.id]: dep } };
  const verdict = judgeDiscovery(work, cfg, view);
  assert.match(verdict.verify, /# Task liên đới/);
  assert.match(verdict.verify, /DEP-TITLE-MARKER/);
  assert.match(verdict.verify, /DEP-DESCRIPTION-MARKER explaining what already happened\./);
  assert.match(verdict.verify, /status:done/);
});

test('judgeDiscovery reports a dep missing from the view instead of throwing or silently dropping it', () => {
  const dir = mkTempDir();
  const scriptPath = echoPromptExecutor(dir);
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const work = sampleWork({ deps: ['no-such-item'] });
  const view = { work: { [work.id]: work } };
  let verdict;
  assert.doesNotThrow(() => {
    verdict = judgeDiscovery(work, cfg, view);
  });
  assert.match(verdict.verify, /no-such-item: \(không tìm thấy trong store/);
});

test('judgeDiscovery with no deps states plainly that there are none, rather than an empty section', () => {
  const dir = mkTempDir();
  const scriptPath = echoPromptExecutor(dir);
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const work = sampleWork();
  const verdict = judgeDiscovery(work, cfg, { work: { [work.id]: work } });
  assert.match(verdict.verify, /item này không có dependency nào/);
});

// --- tsk-4rd (route A, recipe step 1 "làm sạch yêu cầu"): optional
// titleProposal/descriptionProposal ride on either outcome exactly like
// impactScore, never gate clear/unclear, and are omitted whenever the model
// doesn't supply a non-empty string for them.

test('judgeDiscovery includes titleProposal/descriptionProposal on a clear verdict when the model supplies them', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, {
    clear: true,
    verify: 'ok',
    titleProposal: 'Cleaner title',
    descriptionProposal: 'Cleaner description.',
  });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDiscovery(sampleWork(), cfg);
  assert.deepEqual(verdict, {
    clear: true,
    verify: 'ok',
    titleProposal: 'Cleaner title',
    descriptionProposal: 'Cleaner description.',
  });
});

test('judgeDiscovery includes titleProposal/descriptionProposal on an unclear verdict too (not gated on clear)', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, {
    clear: false,
    question: 'Which file?',
    titleProposal: 'Cleaner title',
  });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDiscovery(sampleWork(), cfg);
  assert.deepEqual(verdict, { clear: false, question: 'Which file?', titleProposal: 'Cleaner title' });
});

test('judgeDiscovery omits titleProposal/descriptionProposal (never throws) when the model supplies a missing, blank, or non-string value', () => {
  const cases = [
    { label: 'missing', raw: { clear: true, verify: 'ok' } },
    { label: 'blank', raw: { clear: true, verify: 'ok', titleProposal: '   ', descriptionProposal: '' } },
    { label: 'number', raw: { clear: true, verify: 'ok', titleProposal: 42 } },
    { label: 'null', raw: { clear: true, verify: 'ok', descriptionProposal: null } },
  ];
  for (const { label, raw } of cases) {
    const dir = mkTempDir();
    const scriptPath = writeVerdictExecutor(dir, raw);
    const cfg = cfgFor([scriptPath, '{prompt}']);
    let verdict;
    assert.doesNotThrow(() => {
      verdict = judgeDiscovery(sampleWork(), cfg);
    }, `case: ${label}`);
    assert.equal('titleProposal' in verdict, false, `case: ${label}`);
    assert.equal('descriptionProposal' in verdict, false, `case: ${label}`);
  }
});

test('resolveDiscovery persists titleProposal/descriptionProposal on the discovery record via the existing addDiscovery spread, without touching work.title/work.description', () => {
  const scriptPath = writeVerdictExecutor(mkTempDir(), {
    clear: false,
    question: 'Which file?',
    titleProposal: 'Cleaner title',
    descriptionProposal: 'Cleaner description.',
  });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolveDiscovery(storeDir, 'item-x', cfg);
  assert.equal(result.verdict.titleProposal, 'Cleaner title');
  assert.equal(result.verdict.descriptionProposal, 'Cleaner description.');

  const view = listWork(storeDir);
  const record = view.discovery['item-x'].at(-1);
  assert.equal(record.titleProposal, 'Cleaner title');
  assert.equal(record.descriptionProposal, 'Cleaner description.');
  // Never auto-applied — a proposal is a read-only surface for a person to
  // act on via `fgos edit`, not a silent overwrite of a user-authored field.
  assert.equal(view.work['item-x'].title, sampleWork().title);
});

// --- work-item-priority-matrix D6/D7 (was STR8 D4's intent write): `intent`
// is retired in place -- resolveDiscovery now computes+writes `priority` via
// a second, try/catch-wrapped editWork call, right after addDiscovery,
// before the clear/unclear branch. Expected values are derived from the same
// computeImpact/computePriority functions (not hand-duplicated arithmetic)
// so these stay integration tests, not a second copy of the formula. -----

test('resolveDiscovery writes priority (never intent) when a clear verdict carries a valid integer impactScore', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, {
    clear: true,
    verify: 'npm test -- discovered',
    impactScore: 88,
  });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  const work = sampleWork();
  addWork(storeDir, work);

  resolveDiscovery(storeDir, 'item-x', cfg);
  const view = listWork(storeDir);
  const expected = computePriority({
    impact: computeImpact({ blocks: 0, semanticRelatedness: 88 }),
    urgent: work.urgent,
    risk: work.risk,
  });
  assert.equal(view.work['item-x'].priority, expected);
  assert.equal(view.work['item-x'].intent, undefined);
});

test('resolveDiscovery writes priority when an unclear verdict carries a valid integer impactScore too (not gated on clear)', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, { clear: false, question: 'Which file?', impactScore: 40 });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  const work = sampleWork();
  addWork(storeDir, work);

  resolveDiscovery(storeDir, 'item-x', cfg);
  const view = listWork(storeDir);
  const expected = computePriority({
    impact: computeImpact({ blocks: 0, semanticRelatedness: 40 }),
    urgent: work.urgent,
    risk: work.risk,
  });
  assert.equal(view.work['item-x'].priority, expected);
});

test('resolveDiscovery still computes priority from blocks alone when the verdict carries no impactScore', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, { clear: true, verify: 'npm test -- discovered' });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  const work = sampleWork();
  addWork(storeDir, work);

  resolveDiscovery(storeDir, 'item-x', cfg);
  const view = listWork(storeDir);
  const expected = computePriority({
    impact: computeImpact({ blocks: 0, semanticRelatedness: 0 }),
    urgent: work.urgent,
    risk: work.risk,
  });
  assert.equal(view.work['item-x'].priority, expected);
});

test('resolveDiscovery writes EXACTLY ONE work.edit event carrying priority per call (no duplicate write)', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, {
    clear: true,
    verify: 'npm test -- discovered',
    impactScore: 55,
  });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  resolveDiscovery(storeDir, 'item-x', cfg);

  const events = readEvents(path.join(storeDir, 'events.jsonl'));
  const priorityEdits = events.filter(
    (e) => e.type === 'work.edit' && e.payload?.id === 'item-x' && e.payload?.patch?.priority !== undefined,
  );
  assert.equal(priorityEdits.length, 1);
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
    impactScore: 60,
  });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  const logPath = path.join(storeDir, 'events.jsonl');
  // Bypass the normal addWork write door to plant a corrupted item shape
  // (empty `risk`) — replay never validates on fold, so it reads back fine,
  // but editWork's validateWork rejects it when merging the priority patch.
  // This proves resolveDiscovery's try/catch around editWork never aborts
  // the moveStage/putInAwaiting resolution that follows.
  appendEvent(logPath, { type: 'work.add', payload: { ...sampleWork(), risk: '' } });

  assert.doesNotThrow(() => resolveDiscovery(storeDir, 'item-x', cfg));
  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'decompose');
  assert.equal(view.work['item-x'].priority, undefined);
});

// --- tsk-g18: resolveDiscovery threads scout-notes.md through judgeDiscovery

// tmpStoreDir() (above) creates its store dir DIRECTLY under os.tmpdir(), so
// resolveDiscovery's own `repoRoot = path.dirname(dir)` collapses to the
// shared os.tmpdir() itself — fine for every other test here (none of them
// touch the filesystem under repoRoot), but scout-notes.md tests write a
// REAL file under `<repoRoot>/<docsRef>`, so reusing tmpStoreDir() would
// leak state across separate test runs sharing the same os.tmpdir(). This
// nests the store dir one level under its own fresh repo root instead, so
// `path.dirname(storeDir)` is unique per test — the same shape a real repo
// has (`.fgos/` directly under the repo root).
function tmpRepoAndStoreDir() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-scout-notes-repo-'));
  const storeDir = path.join(repoRoot, '.fgos');
  fs.mkdirSync(storeDir);
  return storeDir;
}

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
      message: { role: 'assistant', content: [{ type: 'tool_use', id: 't1', name: 'Bash', input: { command: 'rg produce-the-output' } }] },
    },
    { type: 'user', message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't1', content: 'src/output.mjs:1:produce-the-output' }] } },
    { type: 'result', subtype: 'success', result: JSON.stringify(resultVerdict) },
  ];
  return `${events.map((e) => JSON.stringify(e)).join('\n')}\n`;
}

// Freshness (tsk-4rd route A: capture is now ALWAYS attempted, never gated
// on `!priorScoutNotes` — see judgeDiscovery's own comment for why a
// capture-once-forever note was the direct cause of a stale item getting
// the same "unclear" verdict round after round). A pre-existing
// scout-notes.md under the item's docsRef must still (a) show up in the
// judge's prompt as a starting point, AND (b) the spawn must still request
// stream-json transcript capture — a fake executor that reports no tool
// calls simply leaves the existing file untouched (nothing new to persist),
// it does not skip the capture attempt itself.
test('resolveDiscovery with an existing scout-notes.md embeds it in the prompt and still attempts stream-json capture', () => {
  const scriptDir = mkTempDir();
  const argvPath = path.join(scriptDir, 'argv.json');
  const scriptPath = writeArgvAndPromptRecordingExecutor(
    scriptDir,
    argvPath,
    JSON.stringify({ clear: true, verify: 'ok' }),
  );
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpRepoAndStoreDir();
  const docsRef = 'docs/history/scout-fresh-item';
  const featureDir = path.join(path.dirname(storeDir), docsRef);
  fs.mkdirSync(featureDir, { recursive: true });
  fs.writeFileSync(path.join(featureDir, 'scout-notes.md'), '## Scout 1\n\n**Command:** `rg PRIOR-EVIDENCE-MARKER`\n');
  addWork(storeDir, sampleWork({ docsRef }));

  const result = resolveDiscovery(storeDir, 'item-x', cfg);
  assert.equal(result.outcome, 'clear');

  const [prompt] = JSON.parse(fs.readFileSync(argvPath, 'utf8'));
  assert.match(prompt, /PRIOR-EVIDENCE-MARKER/);
  const argv = JSON.parse(fs.readFileSync(argvPath, 'utf8'));
  assert.equal(argv.includes('--output-format'), true);

  // No new tool_use captured by this fake executor (it never emits an
  // NDJSON transcript) — writeScoutNotes never fires, so the prior evidence
  // is left exactly as it was, not blanked out.
  const notes = readScoutNotes(path.dirname(storeDir), docsRef);
  assert.match(notes, /PRIOR-EVIDENCE-MARKER/);
});

// No scout-notes.md yet: the judge call captures its own stream-json
// transcript and this becomes the FIRST persisted scout-notes.md for the
// item, written by resolveDiscovery's own call chain (parent code), never
// by the judge subprocess.
test('resolveDiscovery with no existing scout-notes.md captures the transcript and persists it under the item docsRef', () => {
  const scriptDir = mkTempDir();
  const scriptPath = path.join(scriptDir, 'stream-json-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `process.stdout.write(${JSON.stringify(ndjsonScoutTranscript({ clear: true, verify: 'npm test -- scouted' }))}); process.exit(0);`,
  );
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpRepoAndStoreDir();
  const docsRef = 'docs/history/scout-new-item';
  addWork(storeDir, sampleWork({ docsRef }));

  const result = resolveDiscovery(storeDir, 'item-x', cfg);
  assert.equal(result.outcome, 'clear');
  assert.equal(result.verdict.verify, 'npm test -- scouted');

  const notes = readScoutNotes(path.dirname(storeDir), docsRef);
  assert.match(notes, /rg produce-the-output/);
  assert.match(notes, /src\/output\.mjs:1:produce-the-output/);
});

// --- tsk-4rd (route A, discussion point 4 "đo trước khi ép"): mechanical
// researchToolCallCount, measured (never enforced) per call, so real usage
// against the recipe's own "~5 lượt" budget can be read back later.

test('resolveDiscovery reports researchToolCallCount matching the number of scoutable tool calls actually made', () => {
  const scriptDir = mkTempDir();
  const scriptPath = path.join(scriptDir, 'stream-json-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `process.stdout.write(${JSON.stringify(ndjsonScoutTranscript({ clear: true, verify: 'npm test -- scouted' }))}); process.exit(0);`,
  );
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpRepoAndStoreDir();
  addWork(storeDir, sampleWork({ docsRef: 'docs/history/research-count-item' }));

  const result = resolveDiscovery(storeDir, 'item-x', cfg);
  // ndjsonScoutTranscript's fixture makes exactly one Bash(rg:*) tool call.
  assert.equal(result.verdict.researchToolCallCount, 1);

  const view = listWork(storeDir);
  assert.equal(view.discovery['item-x'].at(-1).researchToolCallCount, 1);
});

test('resolveDiscovery reports researchToolCallCount 0 (not omitted) when scouting was attempted but made no tool calls', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeArgvAndPromptRecordingExecutor(
    scriptDir,
    path.join(scriptDir, 'argv.json'),
    JSON.stringify({ clear: true, verify: 'ok' }),
  );
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpRepoAndStoreDir();
  addWork(storeDir, sampleWork({ docsRef: 'docs/history/research-count-zero-item' }));

  const result = resolveDiscovery(storeDir, 'item-x', cfg);
  assert.equal(result.verdict.researchToolCallCount, 0);
});

test('judgeDiscovery omits researchToolCallCount entirely when called with no scoutContext (old 2-arg callers)', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, { clear: true, verify: 'ok' });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDiscovery(sampleWork(), cfg);
  assert.equal('researchToolCallCount' in verdict, false);
});
