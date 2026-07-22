import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { judgeDecompose, resolveDecompose } from '../../src/intake/decompose.mjs';
import { addWork, listWork, StoreError, categoryOf } from '../../src/state/store.mjs';

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

test('judgeDecompose returns decompose with normalized children including resolved sibling deps', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, {
    verdict: 'decompose',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser' },
      { title: 'Build renderer', verify: 'npm test -- renderer', deps: [0] },
    ],
  });
  const cfg = cfgFor([scriptPath, '{prompt}']);
  const verdict = judgeDecompose(sampleWork(), cfg);
  assert.equal(verdict.kind, 'decompose');
  assert.equal(verdict.children.length, 2);
  assert.equal(verdict.children[0].deps.length, 0);
  assert.deepEqual(verdict.children[1].deps, [0]);
});

test('judgeDecompose drops a forward/self dep index instead of invalidating the whole verdict', () => {
  const dir = mkTempDir();
  const scriptPath = writeVerdictExecutor(dir, {
    verdict: 'decompose',
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

test('judgeDecompose fails safe (never throws, invalid) on unparsable stdout, retrying up to MAX_JUDGE_ATTEMPTS before falling back (str68 D2/D3, nested-judge-fix)', () => {
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

test('judgeDecompose retries once with a stricter prompt on a parse-shaped failure and resolves to the retry verdict (str68 D2)', () => {
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

test('judgeDecompose fails safe when the executor exits non-zero, attempting exactly once — no retry on a non-parse failure (str68 D2)', () => {
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

test('resolveDecompose on a decompose verdict writes every child with parent/deps/verify and moves the root to executing', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, {
    verdict: 'decompose',
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

test('resolveDecompose assigns positional child ids `${work.id}-<n>` for n=1..N across N siblings', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, {
    verdict: 'decompose',
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
  const scriptPath = writeVerdictExecutor(scriptDir, {
    verdict: 'decompose',
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

test('resolveDecompose routes a risk-heavy root through the human gate even on a clean decompose verdict, writing no children yet', () => {
  const scriptDir = mkTempDir();
  const scriptPath = writeVerdictExecutor(scriptDir, {
    verdict: 'decompose',
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
