import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { judgeDiscovery, resolveDiscovery } from '../../src/intake/discovery.mjs';
import { addWork, listWork, StoreError, categoryOf, putInAwaiting, answerAwaiting } from '../../src/state/store.mjs';

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

test('judgeDiscovery fails safe (never throws, never clear) on unparsable stdout, retrying up to MAX_JUDGE_ATTEMPTS before falling back (str68 D2/D3, nested-judge-fix)', () => {
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

test('judgeDiscovery retries once with a stricter prompt on a parse-shaped failure and resolves to the retry verdict (str68 D2)', () => {
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

test('judgeDiscovery fails safe when the executor exits non-zero, attempting exactly once — no retry on a non-parse failure (str68 D2)', () => {
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

test('resolveDiscovery on a clear verdict writes the discovery record and moves stage to decompose with the proposed verify (stage-decompose D2 retarget)', () => {
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

test('resolveDiscovery on a clear verdict with no model-proposed verify falls back to a placeholder distinct from the retired P14 sentinel (stage-decompose D2 retarget)', () => {
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
