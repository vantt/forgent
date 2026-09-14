import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { recoverObserveUseCase, recoverApplyUseCase, RecoveryError } from '../../src/verbs/dispatch/recover.mjs';
import { plan, checkApply, collectEvidence, deriveRecoveryFacts, isActionLegal } from '../../src/runner/dispatch/recovery-planner.mjs';
import { showRunUseCase } from '../../src/verbs/dispatch/show-run.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..');

function makeRepo({ runId = 'run_1', status = 'running', controlEpoch, outbox = [] } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-recover-'));
  const runDir = path.join(root, '.fgos', 'assignments', 'asgn_1', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  const run = { runId, assignmentId: 'asgn_1', status, ...(controlEpoch !== undefined ? { controlEpoch } : {}) };
  fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify(run, null, 2));
  if (outbox.length > 0) {
    fs.mkdirSync(path.join(runDir, 'outbox'), { recursive: true });
    for (const name of outbox) fs.writeFileSync(path.join(runDir, 'outbox', name), 'x');
  }
  return { root, runDir };
}

const cleanup = (root) => fs.rmSync(root, { recursive: true, force: true });

function applyFrom(rec, overrides = {}) {
  return {
    runId: 'run_1',
    action: rec.action,
    expectedSnapshot: rec.snapshotHash,
    expectedControlEpoch: rec.expectedControlEpoch,
    expectedExpiresAt: rec.expiresAt,
    actionKey: rec.actionKey,
    ...overrides,
  };
}

// Same import-closure walk dispatch-observe.test.mjs uses (duplicated
// rather than shared: neither test file is on the other's lease, and the
// walk is small/self-contained). See that file's own comment for why a
// grep-for-forbidden-words check is not the guarantee that matters here.
function importClosure(entryFiles) {
  const modules = new Map();
  const bindings = new Set();
  const namespaceImports = [];
  const queue = entryFiles.map((f) => path.resolve(REPO, f));

  while (queue.length > 0) {
    const file = queue.pop();
    if (modules.has(file)) continue;
    const src = fs.readFileSync(file, 'utf8');
    modules.set(file, src);
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

    for (const m of code.matchAll(/^import\s+([^;]*?)\s*from\s*['"]([^'"]+)['"]/gm)) {
      const clause = m[1].trim();
      const specifier = m[2];

      if (/^\*\s+as\s+/.test(clause)) namespaceImports.push(`${file} -> ${specifier}`);
      const named = clause.match(/\{([^}]*)\}/);
      if (named) {
        for (const part of named[1].split(',')) {
          const name = part.trim().split(/\s+as\s+/)[0].trim();
          if (name) bindings.add(name);
        }
      }

      if (specifier.startsWith('.')) {
        queue.push(path.resolve(path.dirname(file), specifier));
      }
    }
  }
  return { modules, bindings, namespaceImports };
}

test('recovery-planner.mjs imports no fs/adapter/network module and never reaches src/runner/coordination/', () => {
  const src = fs.readFileSync(path.join(REPO, 'src/runner/dispatch/recovery-planner.mjs'), 'utf8');
  // Only real `import ... from '...'` lines matter here -- the module's own
  // doc comments talk ABOUT src/runner/coordination/ (explaining why it is
  // never imported), so a bare substring check would false-positive on its
  // own prose.
  const importLines = [...src.matchAll(/^import\s+[^;]*?\s*from\s*['"]([^'"]+)['"]/gm)].map((m) => m[1]);
  assert.deepEqual(importLines, ['node:crypto'], 'recovery-planner.mjs must import only pure, non-fs/network/adapter modules');
  for (const specifier of importLines) {
    assert.doesNotMatch(specifier, /coordination\//);
  }
});

test('recover.mjs never reaches src/runner/coordination/ or any session/event-append binding -- no implicit close', () => {
  const closure = importClosure(['src/verbs/dispatch/recover.mjs', 'src/runner/dispatch/recovery-planner.mjs']);
  const forbiddenBindings = [
    'appendEvent', 'appendCoordinationEvent', 'transitionSessionStatus', 'closeSession', 'openSession',
    'recordDriverDisposition', 'writeVisibility', 'markDetached', 'markRunSettled', 'reconcileRun',
  ];
  for (const name of forbiddenBindings) {
    assert.ok(!closure.bindings.has(name), `recover reaches ${name}, a binding only a session/visibility WRITE door should have`);
  }
  for (const file of closure.modules.keys()) {
    assert.ok(!file.includes(`${path.sep}coordination${path.sep}`), `recover reaches a coordination module: ${file}`);
  }
  assert.deepEqual(closure.namespaceImports, [], 'a namespace import would hand a module every export, session writers included');
  assert.ok(closure.modules.size >= 2, `expected a real import closure, saw ${closure.modules.size} modules`);
});

test('plan() is pure and deterministic: same snapshot+evidence+intent -> same action/reason/evidenceIds', () => {
  const snapshot = { run: { runId: 'run_1', status: 'running', controlEpoch: 0 }, visibility: null, outbox: [], visibilityError: null };
  const evidence = collectEvidence(snapshot, { now: '2026-01-01T00:00:00.000Z' });
  const now = () => '2026-01-01T00:00:00.000Z';
  const actionKeyFn = () => 'fixed-key';

  const first = plan(snapshot, evidence, 'resume', { now, actionKeyFn });
  const second = plan(snapshot, evidence, 'resume', { now, actionKeyFn });

  assert.deepEqual(first, second);
  assert.equal(first.kind, 'recommendation');
  assert.deepEqual(first.action, { type: 'resume-driver' });
});

test('replay parity: repeated observe calls against an unchanged run reproduce the same action/reason/evidenceIds', () => {
  const { root } = makeRepo({ outbox: ['replacement-authority--agent-9.json'] });
  try {
    const now = '2026-01-01T00:00:00.000Z';
    const first = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', intent: 'reassign', now });
    const second = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', intent: 'reassign', now });

    assert.equal(first.kind, 'recommendation');
    assert.deepEqual(first.action, second.action);
    assert.equal(first.reason, second.reason);
    assert.deepEqual(first.evidenceIds, second.evidenceIds);
    assert.equal(first.snapshotHash, second.snapshotHash);
    assert.equal(first.expectedControlEpoch, second.expectedControlEpoch);
    assert.notEqual(first.actionKey, second.actionKey, 'actionKey is inherently per-call');
  } finally { cleanup(root); }
});

test('observe (no --action) is pure: never writes run.json or a recovery log, any number of calls', () => {
  const { root, runDir } = makeRepo();
  try {
    const before = fs.readFileSync(path.join(runDir, 'run.json'), 'utf8');
    recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1' });
    recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1' });
    const after = fs.readFileSync(path.join(runDir, 'run.json'), 'utf8');
    assert.equal(before, after);
    assert.equal(fs.existsSync(path.join(runDir, 'recovery-commands.jsonl')), false);
  } finally { cleanup(root); }
});

test('reassign without replacement-authority evidence gets a typed needs-input, never a silent default action', () => {
  const { root } = makeRepo();
  try {
    const rec = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', intent: 'reassign' });
    assert.equal(rec.kind, 'needs-input');
  } finally { cleanup(root); }
});

test('an outbox artifact of an unrecognized kind parks the recommendation instead of guessing an action', () => {
  const { root } = makeRepo({ outbox: ['mystery-thing.bin'] });
  try {
    const rec = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', intent: 'resume' });
    assert.equal(rec.kind, 'park');
  } finally { cleanup(root); }
});

test('read and write paths derive identical legality for the same snapshot/evidence/action -- one shared evaluator, not two', () => {
  const snapshot = { run: { runId: 'run_1', status: 'running', controlEpoch: 0 }, visibility: null, outbox: [{ name: 'replacement-authority--agent-9.json' }], visibilityError: null };
  const evidence = collectEvidence(snapshot, { now: '2026-01-01T00:00:00.000Z' });
  const readFacts = deriveRecoveryFacts(snapshot, evidence, 'reassign');
  assert.equal(readFacts.status, 'ok');
  const writeFacts = isActionLegal(snapshot, evidence, readFacts.action);
  assert.equal(writeFacts.status, 'ok');
});

test('apply refuses when any of the 5 required CAS fields is missing, typed', () => {
  const { root } = makeRepo();
  try {
    const base = applyFrom({
      action: { type: 'resume-driver' },
      snapshotHash: 'x',
      expectedControlEpoch: 0,
      expiresAt: '2030-01-01T00:00:00.000Z',
      actionKey: 'k1',
    });
    for (const field of ['action', 'expectedSnapshot', 'expectedControlEpoch', 'expectedExpiresAt', 'actionKey']) {
      const params = { ...base };
      delete params[field];
      assert.throws(
        () => recoverApplyUseCase({ repoRoot: root }, params),
        (e) => e instanceof RecoveryError && e.code === 'missing-expectation' && e.missing.includes(field),
        `missing ${field} should refuse`,
      );
    }
  } finally { cleanup(root); }
});

test('apply refuses as plan-stale when the run\'s observed snapshot changed since the recommendation was issued', () => {
  const { root, runDir } = makeRepo();
  try {
    const rec = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', intent: 'resume' });
    // Something about the run's observed state moves -- a new outbox file
    // appears -- without any recovery apply happening.
    fs.mkdirSync(path.join(runDir, 'outbox'), { recursive: true });
    fs.writeFileSync(path.join(runDir, 'outbox', 'report-1.md'), 'progress');

    const result = recoverApplyUseCase({ repoRoot: root }, applyFrom(rec));
    assert.equal(result.outcome, 'plan-stale');
  } finally { cleanup(root); }
});

test('two recommendations racing on the same starting state: the first apply wins, the second sees plan-stale -- exactly one winner', () => {
  const { root } = makeRepo();
  try {
    // Deliberately no injected `now` here: both recommendations and both
    // applies use the real clock, milliseconds apart -- well inside the
    // default TTL, and the point of this test is the CAS/epoch mechanics,
    // not expiry.
    const recA = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', intent: 'resume' });
    const recB = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', intent: 'resume' });
    assert.equal(recA.snapshotHash, recB.snapshotHash);
    assert.equal(recA.expectedControlEpoch, recB.expectedControlEpoch);
    assert.notEqual(recA.actionKey, recB.actionKey);

    const applyA = recoverApplyUseCase({ repoRoot: root }, applyFrom(recA));
    assert.equal(applyA.outcome, 'applied');
    assert.equal(applyA.controlEpochAfter, 1);

    const applyB = recoverApplyUseCase({ repoRoot: root }, applyFrom(recB));
    assert.equal(applyB.outcome, 'plan-stale', 'the epoch already moved under recB -- it never repeats or corrupts the first apply\'s effect');
  } finally { cleanup(root); }
});

test('apply refuses as plan-expired past the recommendation\'s own expiry', () => {
  const { root } = makeRepo();
  try {
    const rec = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', intent: 'resume', now: '2026-01-01T00:00:00.000Z' });
    const result = recoverApplyUseCase({ repoRoot: root }, applyFrom(rec, { now: '2026-01-01T00:10:00.000Z' }));
    assert.equal(result.outcome, 'plan-expired');
  } finally { cleanup(root); }
});

test('a repeat apply with an already-consumed action key returns the same prior outcome, never repeating the effect', () => {
  const { root, runDir } = makeRepo();
  try {
    const rec = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', intent: 'resume' });
    const params = applyFrom(rec);

    const first = recoverApplyUseCase({ repoRoot: root }, params);
    assert.equal(first.outcome, 'applied');

    const second = recoverApplyUseCase({ repoRoot: root }, params);
    assert.equal(second.outcome, 'already-applied');
    assert.equal(second.controlEpochAfter, first.controlEpochAfter);

    const run = JSON.parse(fs.readFileSync(path.join(runDir, 'run.json'), 'utf8'));
    assert.equal(run.controlEpoch, 1, 'controlEpoch bumped exactly once, not twice');
    const log = fs.readFileSync(path.join(runDir, 'recovery-commands.jsonl'), 'utf8').trim().split('\n');
    assert.equal(log.length, 1, 'exactly one command recorded, never repeated');
  } finally { cleanup(root); }
});

test('a run directory already mid-apply refuses a second concurrent apply rather than corrupting state', () => {
  const { root, runDir } = makeRepo();
  try {
    const rec = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', intent: 'resume' });
    fs.writeFileSync(path.join(runDir, '.recovery.lock'), 'held-by-someone-else');
    try {
      assert.throws(
        () => recoverApplyUseCase({ repoRoot: root }, applyFrom(rec)),
        (e) => e instanceof RecoveryError && e.code === 'lock-busy',
      );
      const run = JSON.parse(fs.readFileSync(path.join(runDir, 'run.json'), 'utf8'));
      assert.equal(run.controlEpoch, undefined, 'refused before ever touching run.json');
    } finally {
      fs.unlinkSync(path.join(runDir, '.recovery.lock'));
    }
  } finally { cleanup(root); }
});

test('applying an action no longer supported by current evidence is refused via the same legality check the read path uses', () => {
  const { root } = makeRepo();
  try {
    const rec = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', intent: 'resume' });
    const tampered = { type: 'reassign-driver', toDriverId: 'nobody' };
    const result = recoverApplyUseCase({ repoRoot: root }, applyFrom(rec, { action: tampered }));
    assert.equal(result.outcome, 'needs-input');
  } finally { cleanup(root); }
});

test('a schema-1 run.json with no controlEpoch field reads as epoch 0 and stays fully unaffected by an observe call', () => {
  const { root, runDir } = makeRepo();
  try {
    const before = fs.readFileSync(path.join(runDir, 'run.json'), 'utf8');
    const rec = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', intent: 'resume' });
    assert.equal(rec.expectedControlEpoch, 0);
    const after = fs.readFileSync(path.join(runDir, 'run.json'), 'utf8');
    assert.equal(before, after, 'observe never writes');

    // The existing schema-1 read door stays completely unaffected too.
    const shown = showRunUseCase({ repoRoot: root }, { runId: 'run_1' });
    assert.equal(shown.run.status, 'running');
    assert.equal(shown.run.controlEpoch, undefined);
  } finally { cleanup(root); }
});

test('no implicit close: applying resume-driver never touches run.status or settles the run', () => {
  const { root, runDir } = makeRepo();
  try {
    const rec = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', intent: 'resume' });
    const result = recoverApplyUseCase({ repoRoot: root }, applyFrom(rec));
    assert.equal(result.outcome, 'applied', 'the apply itself must actually succeed for this test to prove anything');
    const run = JSON.parse(fs.readFileSync(path.join(runDir, 'run.json'), 'utf8'));
    assert.equal(run.status, 'running', 'recover never invokes unconditional close-after-steps');
  } finally { cleanup(root); }
});

test('checkApply is pure and agrees with the use case: same inputs, same outcome', () => {
  const snapshot = { run: { runId: 'run_1', status: 'running', controlEpoch: 0 }, visibility: null, outbox: [], visibilityError: null };
  const evidence = collectEvidence(snapshot, { now: '2026-01-01T00:00:00.000Z' });
  const rec = plan(snapshot, evidence, 'resume', { now: () => '2026-01-01T00:00:00.000Z', actionKeyFn: () => 'k' });
  const outcome = checkApply({
    snapshot,
    evidence,
    action: rec.action,
    expectedSnapshot: rec.snapshotHash,
    expectedControlEpoch: rec.expectedControlEpoch,
    expectedExpiresAt: rec.expiresAt,
    now: '2026-01-01T00:00:00.000Z',
  });
  assert.equal(outcome.outcome, 'ok');
});
