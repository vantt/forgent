import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { recoverObserveUseCase, recoverApplyUseCase, RecoveryError } from '../../src/verbs/dispatch/recover.mjs';
import { plan, checkApply, collectEvidence, deriveRecoveryFacts, isActionLegal } from '../../src/runner/dispatch/recovery-planner.mjs';
import { showRunUseCase } from '../../src/verbs/dispatch/show-run.mjs';
import { acquireRunControl } from '../../src/run-supervisor/run-lock.mjs';
import { acquireSync, createLockScope } from '../../src/holder-lock/index.mjs';
import { computeSha256Digest } from '../../src/native/proof-helpers.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..');

const HOLDER_LOCK_MOD = path.resolve(HERE, '../../src/holder-lock/index.mjs');

function recoveryParams(root, runDir) {
  return { runDir, fgosDir: path.join(root, '.fgos') };
}

function holdRecoveryHere(root, runDir) {
  const res = acquireSync(createLockScope('test-recovery-holder'), 'recovery', recoveryParams(root, runDir));
  assert.equal(res.result, 'acquired');
  return res.handle;
}

/** Hold the run's recovery lock in a separate process; resolves once it holds it. */
async function holdRecoveryInChild(root, runDir) {
  const readyPath = path.join(root, 'recovery-holder-ready');
  const child = spawn(process.execPath, ['--input-type=module', '-e', `
    import fs from 'node:fs';
    import { acquireSync, createLockScope } from ${JSON.stringify(HOLDER_LOCK_MOD)};
    const res = acquireSync(createLockScope('holder'), 'recovery', ${JSON.stringify(recoveryParams(root, runDir))});
    if (res.result !== 'acquired') process.exit(3);
    fs.writeFileSync(${JSON.stringify(readyPath)}, 'held');
    setInterval(() => {}, 1000);
  `], { stdio: 'ignore' });
  const exited = new Promise((resolve) => child.once('exit', resolve));
  const deadline = Date.now() + 10000;
  while (!fs.existsSync(readyPath)) {
    assert.ok(Date.now() < deadline, 'the holder never took the recovery lock');
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  return { child, exited };
}

// An attempt that can be adopted needs the run supervisor's own judge, which is the host binary of this checkout.
const HOST = process.env.FGOS_HOST_BIN;
const skip = HOST && fs.existsSync(HOST) ? false : 'FGOS_HOST_BIN does not name a host built from this checkout';

/**
 * A project root holding one attempt of `asgn_1`. With `adoptable`, the attempt has an envelope, an attempt lock
 * nobody holds and an outbox result, which is what `adopt` finishes.
 */
function makeRepo({ runId = 'run_1', status = 'running', controlEpoch, outbox = [], controller = [], adoptable = false } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-recover-'));
  const runDir = path.join(root, '.fgos', 'assignments', 'asgn_1', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  const run = { runId, assignmentId: 'asgn_1', status, ...(controlEpoch !== undefined ? { controlEpoch } : {}) };
  fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify(run, null, 2));
  if (adoptable) {
    const envelope = {
      v: 3, attemptId: 'att-1', unitRunId: 'unit-run-1', runDir, mode: 'direct', protocolId: 1,
      hostBin: HOST ?? '/bin/false', payloadRoot: '/', cwd: runDir, mutation: 'read-only',
      launch: { command: '/bin/true', args: [], env: {}, stdinPolicy: 'null', briefPath: null, outboxDir: path.join(runDir, 'outbox'), capture: { stdout: path.join(runDir, 'o.log'), stderr: path.join(runDir, 'e.log') } },
      containment: { preferred: 'linux-gate' },
      deadlines: { softAt: null, idleMs: null, hardCeiling: null, gateKillGraceMs: 1000 },
      agentProtocol: { cli: 'claude', mode: 'direct' },
      steps: [],
    };
    envelope.digest = computeSha256Digest(envelope);
    fs.writeFileSync(path.join(runDir, 'envelope.json'), JSON.stringify(envelope));
    fs.writeFileSync(path.join(runDir, 'attempt.lock'), '');
    outbox = ['result-1.json', ...outbox];
  }
  if (outbox.length > 0) {
    fs.mkdirSync(path.join(runDir, 'outbox'), { recursive: true });
    for (const name of outbox) fs.writeFileSync(path.join(runDir, 'outbox', name), adoptable && name === 'result-1.json' ? JSON.stringify({ claim: 'done' }) : 'x');
  }
  if (controller.length > 0) {
    fs.mkdirSync(path.join(runDir, 'controller'), { recursive: true });
    for (const name of controller) fs.writeFileSync(path.join(runDir, 'controller', name), 'x');
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

const NOW = '2026-01-01T00:00:00.000Z';
const nowFn = () => NOW;
const ADOPTABLE = { run: { runId: 'run_1', status: 'running', controlEpoch: 0 }, visibility: null, outbox: [], visibilityError: null, attempt: { state: 'needs-adopt', attemptId: 'att-1' } };

test('plan() is pure and deterministic: same snapshot+evidence+intent -> same action/reason/evidenceIds/actionKey', () => {
  const evidence = collectEvidence(ADOPTABLE);
  const first = plan(ADOPTABLE, evidence, 'resume', { now: nowFn });
  const second = plan(ADOPTABLE, evidence, 'resume', { now: nowFn });

  assert.deepEqual(first, second);
  assert.equal(first.kind, 'recommendation');
  assert.deepEqual(first.action, { type: 'adopt', attemptId: 'att-1' });
});

// An action that only records it was applied is worse than none: the person who follows the advice is told
// "applied" while nothing happens. The only action that changes a run is adopt, and an attempt nobody can adopt
// is parked whatever the intent.
test('recover offers no action that only reports success, whatever the intent', () => {
  const stale = { run: { runId: 'run_1', status: 'running', controlEpoch: 0 }, visibility: null, outbox: [], visibilityError: null, controller: [{ name: 'replacement-authority--agent-9.json' }] };
  const offered = [];
  for (const intent of ['resume', 'reassign']) {
    const result = plan(stale, collectEvidence(stale), intent, { now: nowFn });
    if (result.kind === 'recommendation') offered.push(result.action.type);
  }
  assert.deepEqual(offered, [], `plan offered ${offered.join(', ')}, which only records that it was applied`);
});

test('replay parity: repeated observe calls against an unchanged run reproduce the same action/reason/evidenceIds', { skip }, () => {
  const { root } = makeRepo({ adoptable: true });
  try {
    const first = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', now: NOW });
    const second = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', now: NOW });

    assert.equal(first.kind, 'recommendation', first.reason);
    assert.deepEqual(first.action, second.action);
    assert.equal(first.reason, second.reason);
    assert.deepEqual(first.evidenceIds, second.evidenceIds);
    assert.equal(first.snapshotHash, second.snapshotHash);
    assert.equal(first.expectedControlEpoch, second.expectedControlEpoch);
    assert.equal(first.actionKey, second.actionKey, 'actionKey is derived from snapshotHash/controlEpoch/action/expiresAt -- identical facts at the same instant produce the identical key');
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

test('an outbox artifact of an unrecognized kind parks the recommendation instead of guessing an action', { skip }, () => {
  const { root } = makeRepo({ adoptable: true, outbox: ['mystery-thing.bin'] });
  try {
    const rec = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', intent: 'resume' });
    assert.equal(rec.kind, 'park');
    assert.match(rec.reason, /unrecognized evidence type/);
  } finally { cleanup(root); }
});

test('read and write paths derive identical legality for the same snapshot/evidence/action -- one shared evaluator, not two', () => {
  const evidence = collectEvidence(ADOPTABLE);
  const readFacts = deriveRecoveryFacts(ADOPTABLE, evidence, 'resume');
  assert.equal(readFacts.status, 'ok');
  assert.equal(isActionLegal(ADOPTABLE, evidence, readFacts.action).status, 'ok');
  assert.equal(isActionLegal(ADOPTABLE, evidence, { type: 'adopt', attemptId: 'another' }).status, 'park', 'adopt names the attempt the directory holds');
  assert.equal(isActionLegal(ADOPTABLE, evidence, { type: 'resume-driver' }).status, 'park', 'an action this door does not know is never legal');
});

test('apply refuses when any of the 5 required CAS fields is missing, typed', () => {
  const { root } = makeRepo();
  try {
    const base = applyFrom({
      action: { type: 'adopt', attemptId: 'att-1' },
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

test('apply refuses as plan-expired past the recommendation\'s own expiry', { skip }, () => {
  const { root } = makeRepo({ adoptable: true });
  try {
    const rec = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', now: NOW });
    const result = recoverApplyUseCase({ repoRoot: root }, applyFrom(rec, { now: '2026-01-01T00:10:00.000Z' }));
    assert.equal(result.outcome, 'plan-expired');
  } finally { cleanup(root); }
});

test('a repeat apply with an already-consumed action key returns the same prior outcome, never repeating the effect', { skip }, () => {
  const { root, runDir } = makeRepo({ adoptable: true });
  try {
    const rec = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', intent: 'resume' });
    const params = applyFrom(rec);

    const first = recoverApplyUseCase({ repoRoot: root }, params);
    assert.equal(first.outcome, 'applied', first.reason);

    const second = recoverApplyUseCase({ repoRoot: root }, params);
    assert.equal(second.outcome, 'already-applied');
    assert.equal(second.controlEpochAfter, first.controlEpochAfter);

    const log = fs.readFileSync(path.join(runDir, 'recovery-commands.jsonl'), 'utf8').trim().split('\n');
    assert.equal(log.length, 1, 'exactly one command recorded, never repeated');
  } finally { cleanup(root); }
});

test('a run directory already mid-apply refuses a second concurrent apply rather than corrupting state', { skip }, () => {
  const { root, runDir } = makeRepo({ adoptable: true });
  try {
    const rec = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', intent: 'resume' });
    // This test process stands in for the apply already in progress.
    const held = holdRecoveryHere(root, runDir);
    try {
      assert.throws(
        () => recoverApplyUseCase({ repoRoot: root }, applyFrom(rec)),
        (e) => e instanceof RecoveryError && e.code === 'lock-busy',
      );
      assert.equal(fs.existsSync(path.join(runDir, 'closed.json')), false, 'refused before the attempt was touched');
    } finally {
      held.release();
    }
    assert.equal(recoverApplyUseCase({ repoRoot: root }, applyFrom(rec)).outcome, 'applied', 'released, the next apply goes in');
  } finally { cleanup(root); }
});

test('swapping the action under an unmatched actionKey is refused before ever reaching the legality check', { skip }, () => {
  const { root } = makeRepo({ adoptable: true });
  try {
    const rec = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', intent: 'resume' });
    // rec.actionKey was derived for the original action: it does not match this substituted one.
    const result = recoverApplyUseCase({ repoRoot: root }, applyFrom(rec, { action: { type: 'adopt', attemptId: 'nobody' } }));
    assert.equal(result.outcome, 'plan-stale');
  } finally { cleanup(root); }
});

test('a valid actionKey from a different recommendation cannot be replayed against this one', { skip }, () => {
  const { root } = makeRepo({ adoptable: true });
  try {
    const first = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', now: NOW });
    const later = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', now: '2026-01-01T00:01:00.000Z' });
    assert.equal(first.snapshotHash, later.snapshotHash, 'same observed run state for both recommendations');
    assert.notEqual(first.actionKey, later.actionKey, 'a different expiry derives a different key');

    const forged = applyFrom(first, { actionKey: later.actionKey });
    assert.equal(recoverApplyUseCase({ repoRoot: root }, forged).outcome, 'plan-stale');
  } finally { cleanup(root); }
});

test('checkApply is pure and agrees with the use case: same inputs, same outcome', () => {
  const evidence = collectEvidence(ADOPTABLE);
  const rec = plan(ADOPTABLE, evidence, 'resume', { now: nowFn });
  const outcome = checkApply({
    snapshot: ADOPTABLE,
    evidence,
    action: rec.action,
    expectedSnapshot: rec.snapshotHash,
    expectedControlEpoch: rec.expectedControlEpoch,
    expectedExpiresAt: rec.expiresAt,
    actionKey: rec.actionKey,
    now: NOW,
  });
  assert.equal(outcome.outcome, 'ok');
});

test('expectedControlEpoch reads run-lock\'s real generation ledger, never the run.json shadow field', { skip }, () => {
  const { root, runDir } = makeRepo({ controlEpoch: 0, adoptable: true });
  try {
    // A real controller acquires control straight through run-lock.mjs; recover never touches this path.
    const acquired = acquireRunControl(runDir, { holder: { id: 'live-driver', pid: process.pid }, purpose: 'drive' });
    assert.equal(acquired.status, 'acquired');
    assert.equal(acquired.controlEpoch, 1);

    const runJson = JSON.parse(fs.readFileSync(path.join(runDir, 'run.json'), 'utf8'));
    assert.equal(runJson.controlEpoch, 0, 'the run.json shadow field is untouched by the real acquisition');

    const rec = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', intent: 'resume' });
    assert.equal(rec.expectedControlEpoch, 1, 'the recommendation must reflect the REAL control epoch, not the stale shadow run.json field');
  } finally { cleanup(root); }
});

test('a recovery holder killed mid-apply does not leave the run stuck', { skip }, async () => {
  if (process.platform === 'win32') return;
  const { root, runDir } = makeRepo({ adoptable: true });
  try {
    const rec = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', intent: 'resume' });
    const { child, exited } = await holdRecoveryInChild(root, runDir);
    assert.throws(
      () => recoverApplyUseCase({ repoRoot: root }, applyFrom(rec)),
      (e) => e instanceof RecoveryError && e.code === 'lock-busy',
      'a live holder is refused, never reclaimed out from under it',
    );
    child.kill('SIGKILL');
    await exited;

    const result = recoverApplyUseCase({ repoRoot: root }, applyFrom(rec));
    assert.equal(result.outcome, 'applied', 'a dead holder releases the lock with its process');
  } finally { cleanup(root); }
});

test('controller bookkeeping files in the controller directory do not park recovery', { skip }, () => {
  const { root } = makeRepo({ adoptable: true, controller: ['evaluator-baseline.json', 'replacement-authority--agent-9.json'] });
  try {
    const rec = recoverObserveUseCase({ repoRoot: root }, { runId: 'run_1', intent: 'resume' });
    assert.equal(rec.kind, 'recommendation', rec.reason);
    assert.deepEqual(rec.action, { type: 'adopt', attemptId: 'att-1' });
  } finally { cleanup(root); }
});

test('collectEvidence names the attempt files and the worker\'s outbox results, and never reads the controller directory', () => {
  const evidence = collectEvidence({
    controller: [{ name: 'evaluator-baseline.json' }, { name: 'replacement-authority--agent-correct.json' }],
    attemptFiles: ['receipt.json'],
    outbox: [{ name: 'replacement-authority--attacker.json' }, { name: 'ack-1.json' }, { name: 'report-1.md' }, { name: 'result.json' }],
  });
  assert.deepEqual(evidence.map((e) => [e.id, e.type]), [
    ['receipt.json', 'attempt-receipt'],
    ['replacement-authority--attacker.json', 'unknown'],
    ['ack-1.json', 'worker-result'],
    ['report-1.md', 'worker-result'],
    ['result.json', 'worker-result'],
  ]);
});
