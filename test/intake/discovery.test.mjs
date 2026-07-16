import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { judgeDiscovery, resolveDiscovery } from '../../src/intake/discovery.mjs';
import { addWork, listWork, StoreError, categoryOf } from '../../src/state/store.mjs';

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

test('judgeDiscovery fails safe (never throws, never clear) on unparsable stdout', () => {
  const dir = mkTempDir();
  const scriptPath = writeRawStdoutExecutor(dir, 'not json at all');
  const cfg = cfgFor([scriptPath, '{prompt}']);
  assert.doesNotThrow(() => judgeDiscovery(sampleWork(), cfg));
  const verdict = judgeDiscovery(sampleWork(), cfg);
  assert.equal(verdict.clear, false);
  assert.equal(typeof verdict.question, 'string');
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

test('judgeDiscovery fails safe when the executor exits non-zero', () => {
  const dir = mkTempDir();
  const scriptPath = writeFailingExecutor(dir, 7);
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDiscovery(sampleWork(), cfg);
  assert.equal(verdict.clear, false);
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

// --- resolveDiscovery: read-judge-write, both outcomes recorded ----------

function tmpStoreDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-resolve-discovery-'));
}

test('resolveDiscovery on a clear verdict writes the discovery record and moves stage to executing with the proposed verify', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, { clear: true, verify: 'npm test -- discovered' });
  const cfg = cfgFor([scriptPath, '{prompt}']);

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolveDiscovery(storeDir, 'item-x', cfg);
  assert.equal(result.outcome, 'clear');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'executing');
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
  assert.equal(view.work['item-x'].stage, 'executing');
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
