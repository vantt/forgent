import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { recoverObserveUseCase, recoverApplyUseCase, RecoveryError } from '../../src/verbs/dispatch/recover.mjs';
import { plan, checkApply, collectEvidence, deriveRecoveryFacts, isActionLegal } from '../../src/runner/dispatch/recovery-planner.mjs';
import { showRunUseCase } from '../../src/verbs/dispatch/show-run.mjs';
import { acquireRunControl } from '../../src/runner/dispatch/run-lock.mjs';

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

test('plan() is pure and deterministic: same snapshot+evidence+intent -> same action/reason/evidenceIds/actionKey', () => {
  const snapshot = { run: { runId: 'run_1', status: 'running', controlEpoch: 0 }, visibility: null, outbox: [], visibilityError: null };
  const evidence = collectEvidence(snapshot, { now: '2026-01-01T00:00:00.000Z' });
  const now = () => '2026-01-01T00:00:00.000Z';

  const first = plan(snapshot, evidence, 'resume', { now });
  const second = plan(snapshot, evidence, 'resume', { now });

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
    assert.equal(first.actionKey, second.actionKey, 'actionKey is now deterministically derived (F3) from snapshotHash/controlEpoch/action/expiresAt -- identical facts at the same instant produce the identical key');
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

test('two recommendations racing on the same starting state: the first apply wins, the second never repeats or corrupts its effect', () => {
  const { root, runDir } = makeRepo();
  try {
    // Deliberately no injected `now` here: both recommendations and both
    // applies use the real clock, milliseconds apart -- well inside the
    // default TTL, and the point of this test is the CAS/epoch mechanics,
    // not expiry. actionKey is now DETERMINISTICALLY derived from
    // (snapshotHash, controlEpoch, action, expiresAt) (F3): whether recA and
    // recB land in the same millisecond and thus share an actionKey is real,
    // non-deterministic timing this test does not control -- asserting key
    // inequality here was flaky, not a real invariant.
    const recA = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', intent: 'resume' });
    const recB = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', intent: 'resume' });
    assert.equal(recA.snapshotHash, recB.snapshotHash);
    assert.equal(recA.expectedControlEpoch, recB.expectedControlEpoch);

    const applyA = recoverApplyUseCase({ repoRoot: root }, applyFrom(recA));
    assert.equal(applyA.outcome, 'applied');
    assert.equal(applyA.controlEpochAfter, 1);

    const applyB = recoverApplyUseCase({ repoRoot: root }, applyFrom(recB));
    assert.ok(
      applyB.outcome === 'plan-stale' || applyB.outcome === 'already-applied',
      `recB must never repeat or corrupt applyA's effect: expected plan-stale (distinct actionKey, epoch already moved) or already-applied (same actionKey as recA), got ${applyB.outcome}`,
    );

    const run = JSON.parse(fs.readFileSync(path.join(runDir, 'run.json'), 'utf8'));
    assert.equal(run.controlEpoch, 1, 'controlEpoch bumped exactly once, not twice, regardless of which outcome recB saw');
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

test('F3: swapping the action under an unmatched actionKey is refused before ever reaching the legality check', () => {
  const { root } = makeRepo();
  try {
    const rec = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', intent: 'resume' });
    const tampered = { type: 'reassign-driver', toDriverId: 'nobody' };
    // rec.actionKey was derived for the ORIGINAL resume-driver action -- it
    // does not match this substituted action, so the actionKey binding (F3)
    // must catch this before isActionLegal ever runs.
    const result = recoverApplyUseCase({ repoRoot: root }, applyFrom(rec, { action: tampered }));
    assert.equal(result.outcome, 'plan-stale');
  } finally { cleanup(root); }
});

test('read and write paths still derive identical legality for a genuinely matching action/actionKey pair', () => {
  const { root } = makeRepo({ outbox: ['replacement-authority--agent-9.json'] });
  try {
    const rec = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', intent: 'reassign' });
    assert.equal(rec.kind, 'recommendation');
    // Untampered: action/actionKey/snapshot/epoch/expiresAt all come
    // straight from the same recommendation, so checkApply's actionKey
    // check passes and legality is re-derived via isActionLegal, the same
    // evaluator deriveRecoveryFacts used at plan() time.
    const result = recoverApplyUseCase({ repoRoot: root }, applyFrom(rec));
    assert.equal(result.outcome, 'applied');
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
  const rec = plan(snapshot, evidence, 'resume', { now: () => '2026-01-01T00:00:00.000Z' });
  const outcome = checkApply({
    snapshot,
    evidence,
    action: rec.action,
    expectedSnapshot: rec.snapshotHash,
    expectedControlEpoch: rec.expectedControlEpoch,
    expectedExpiresAt: rec.expiresAt,
    actionKey: rec.actionKey,
    now: '2026-01-01T00:00:00.000Z',
  });
  assert.equal(outcome.outcome, 'ok');
});

test('H1: expectedControlEpoch reads run-lock\'s real generation ledger, never the run.json shadow field', () => {
  const { root, runDir } = makeRepo({ controlEpoch: 0 });
  try {
    // A real controller acquires control straight through run-lock.mjs --
    // recover.mjs never touches this path, mirroring a genuinely live
    // driver that predates this recovery attempt.
    const acquired = acquireRunControl(runDir, { holder: { id: 'live-driver', pid: process.pid }, purpose: 'drive' });
    assert.equal(acquired.status, 'acquired');
    assert.equal(acquired.controlEpoch, 1);

    const runJson = JSON.parse(fs.readFileSync(path.join(runDir, 'run.json'), 'utf8'));
    assert.equal(runJson.controlEpoch, 0, 'the run.json shadow field is untouched by the real acquisition');

    const rec = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', intent: 'resume' });
    assert.equal(rec.expectedControlEpoch, 1, 'the recommendation must reflect the REAL control epoch, not the stale shadow run.json field');
  } finally { cleanup(root); }
});

test('H1: apply refuses via the live-holder gate when the observed epoch matches but a live controller still actively holds it', () => {
  const { root, runDir } = makeRepo();
  try {
    // A live controller acquires real control and never releases.
    const acquired = acquireRunControl(runDir, { holder: { id: 'live-driver', pid: process.pid }, purpose: 'drive' });
    assert.equal(acquired.status, 'acquired');
    assert.equal(acquired.controlEpoch, 1);

    // Issued AFTER that acquisition, so it correctly observes epoch 1 --
    // not stale, not tampered, exactly what a caller would legitimately see.
    const rec = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', intent: 'resume' });
    assert.equal(rec.expectedControlEpoch, 1);

    const result = recoverApplyUseCase({ repoRoot: root }, applyFrom(rec));
    // Pre-fix, this exact scenario applied cleanly: the old code compared
    // against run.json's shadow controlEpoch (undefined -> 0 on both
    // sides) and bumped it to 1, entirely blind to the live controller's
    // real, unreleased epoch-1 hold.
    assert.equal(result.outcome, 'held', 'a live controller still holding the real epoch must block the apply, not be silently overwritten');
    assert.equal(result.holder.id, 'live-driver');

    const runJson = JSON.parse(fs.readFileSync(path.join(runDir, 'run.json'), 'utf8'));
    assert.equal(runJson.controlEpoch, undefined, 'run.json must never be bumped over a live controller');
  } finally { cleanup(root); }
});

test('F1: a run that settles (result.json appears) between plan() and apply refuses as plan-stale even though run.json.status never changed', () => {
  const { root, runDir } = makeRepo();
  try {
    const rec = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', intent: 'resume' });

    // The collector finishes and writes result.json -- classifyRunOutcome()
    // now reports 'settled' -- but nothing has reconciled run.json.status
    // yet (a separate, slower path: markRunSettled/reconcileRun).
    fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({ ok: true }));
    const runJsonBefore = JSON.parse(fs.readFileSync(path.join(runDir, 'run.json'), 'utf8'));
    assert.equal(runJsonBefore.status, 'running', 'run.json.status is still unreconciled');

    const result = recoverApplyUseCase({ repoRoot: root }, applyFrom(rec));
    assert.equal(result.outcome, 'plan-stale', 'a settled run must refuse the apply even though run.json.status never changed');
  } finally { cleanup(root); }
});

test('F5: a settle write landing exactly between acquireRunControl and the settled re-check is always caught, deterministically', () => {
  // Pre-fix, the fresh settled re-check ran BEFORE acquireRunControl (the
  // door's one exclusive resource), so a result.json write landing anywhere
  // across checkApply + the re-check + acquireRunControl + the final write
  // could slip through unnoticed -- red-team's repro measured 74/100 unsafe
  // applies over that window. Post-fix, the re-check is the LAST thing read
  // before the write, so a write landing right after acquireRunControl's own
  // generation record is durably published must always be visible to that
  // re-check (the write's own short duration afterwards is a documented
  // residual, out of this test's scope -- see the F5 comment in recover.mjs).
  //
  // This used to be a worker-thread wall-clock race, and it was
  // deterministically broken: a worker thread's own boot latency (18-28ms)
  // outlives recoverApplyUseCase's entire synchronous duration (5-8ms), so
  // the settle write always landed well after apply had already returned --
  // every trial reported "unsafe" regardless of whether the fix was present,
  // which was never a real signal either way.
  //
  // Instead of racing wall-clock time, this hooks the exact fs call
  // acquireRunControl uses to durably publish its generation record
  // (fs.linkSync onto control/generations/<epoch>.json) and writes
  // result.json synchronously from inside that hook. That lands the settle
  // exactly between acquireRunControl's return and the F5 re-check's own
  // read, every single time, with zero wall-clock dependency -- and if the
  // F5 reorder were ever reverted (the re-check moved back to before
  // acquireRunControl), both of the module's own result.json reads would
  // already have run by the time this hook fires, so the write would slip
  // through unnoticed and this test would fail.
  const TRIALS = 20;
  let unsafe = 0;
  const realLinkSync = fs.linkSync;
  for (let i = 0; i < TRIALS; i += 1) {
    const { root, runDir } = makeRepo();
    const resultPath = path.join(runDir, 'result.json');
    const generationsDir = path.join(runDir, 'control', 'generations');
    let injected = false;
    fs.linkSync = (src, dest) => {
      realLinkSync(src, dest);
      if (!injected && path.dirname(dest) === generationsDir && /^\d{10}\.json$/.test(path.basename(dest))) {
        injected = true;
        fs.writeFileSync(resultPath, JSON.stringify({ ok: true }));
      }
    };
    try {
      const rec = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', intent: 'resume' });
      const result = recoverApplyUseCase({ repoRoot: root }, applyFrom(rec));
      assert.ok(injected, `trial ${i}: expected acquireRunControl's generation-file link to fire the injection hook`);

      // Unsafe iff the apply performed the write ('applied') even though
      // the settle write had already landed on disk by the time we can
      // observe it here.
      if (result.outcome === 'applied' && fs.existsSync(resultPath)) unsafe += 1;
    } finally {
      fs.linkSync = realLinkSync;
      cleanup(root);
    }
  }
  assert.equal(
    unsafe, 0,
    `expected every settle write landing in the acquire->recheck window to be caught by the F5 re-check, got ${unsafe}/${TRIALS} unsafe`,
  );
});

test('F3: a valid actionKey from a different recommendation cannot be replayed against this one', () => {
  const { root } = makeRepo({ outbox: ['replacement-authority--agent-9.json'] });
  try {
    const now = '2026-01-01T00:00:00.000Z';
    const recResume = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', intent: 'resume', now });
    const recReassign = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', intent: 'reassign', now });
    assert.equal(recResume.snapshotHash, recReassign.snapshotHash, 'same observed run state for both recommendations');
    assert.notEqual(recResume.actionKey, recReassign.actionKey, 'different actions must derive different keys');

    // Attacker takes recReassign's still-unconsumed, valid actionKey but
    // submits it alongside recResume's action/snapshot/epoch/expiresAt.
    const forged = applyFrom(recResume, { actionKey: recReassign.actionKey });
    const result = recoverApplyUseCase({ repoRoot: root }, forged);
    assert.equal(result.outcome, 'plan-stale');
  } finally { cleanup(root); }
});

test('M1: a stale .recovery.lock left by a dead process is reclaimed, not left stuck forever', () => {
  const { root, runDir } = makeRepo();
  try {
    const rec = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', intent: 'resume' });
    // Simulate a crash between lock-acquire and release: a lock file
    // recording a pid that is provably not alive.
    fs.writeFileSync(path.join(runDir, '.recovery.lock'), '999999999');

    const result = recoverApplyUseCase({ repoRoot: root }, applyFrom(rec));
    assert.equal(result.outcome, 'applied', 'a dead holder\'s lock must be reclaimed, never block recovery forever');
  } finally { cleanup(root); }
});

test('M1: a .recovery.lock held by a live process is still refused, never reclaimed out from under it', () => {
  const { root, runDir } = makeRepo();
  try {
    const rec = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', intent: 'resume' });
    fs.writeFileSync(path.join(runDir, '.recovery.lock'), String(process.pid));
    try {
      assert.throws(
        () => recoverApplyUseCase({ repoRoot: root }, applyFrom(rec)),
        (e) => e instanceof RecoveryError && e.code === 'lock-busy',
      );
    } finally {
      fs.unlinkSync(path.join(runDir, '.recovery.lock'));
    }
  } finally { cleanup(root); }
});
