import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { resolveDiscovery, RETIRED_P14_PLACEHOLDER, FALLBACK_VERIFY } from '../../src/intake/discovery.mjs';
import { computeImpact, computePriority } from '../../src/state/priority-formula.mjs';
import { addWork, listWork, StoreError, categoryOf, putInAwaiting, answerAwaiting, moveWork, recordGateApprove } from '../../src/state/store.mjs';
import { appendEvent, readEvents } from '../../src/state/events.mjs';
import { createWorktree } from '../../src/runner/worktree.mjs';

// tsk-1x3 D1/D9/D16 (docs/history/fanout-and-delegation-rubric/CONTEXT.md):
// `judgeDiscovery` (a nested `claude -p` subprocess) is retired. This file
// used to be dominated by direct tests of that function's own prompt
// construction, retry logic, and fail-safe logging — all removed along
// with the function. What survives:
//
// - the readLockedContext trust signal (B1) — unchanged, still a real skip
//   path that requires no verdict at all;
// - the caller-supplied verdict path (D1's `callerVerdict` parameter) —
//   unchanged, and now the ONLY way an interactive caller reaches a
//   `clear`/`unclear` outcome;
// - a handful of tests rewritten from a blind-judge call to a
//   caller-supplied verdict, where the underlying behavior under test
//   (FALLBACK_VERIFY, re-entrancy on a second park, statusAtAsk, priority
//   computation, the verify-overwrite guard) still exists and is not
//   covered elsewhere;
// - two NEW tests proving D16's own behavior directly: a `'runner'` caller
//   with nothing to go on now no-ops instead of spawning a blind judge, and
//   any other caller refuses loudly instead of silently guessing.
//
// Retired without replacement, and why: judgeDiscovery's own prompt
// content/retry/fail-log tests (the function no longer exists to test);
// titleProposal/descriptionProposal and the scout-notes.md capture tests
// (both were judge-model-only fields/mechanisms with no caller-verdict
// equivalent — superseded by separate, already-built items: `fgos-
// clarifying`'s own D14 rewrite-and-report for titles/descriptions, and
// `fgos-researching`'s own RESEARCH.md for research capture — never a
// silent regression, a replaced mechanism); impactScore tests beyond the
// one that proves the no-impactScore fallback still works (impactScore was
// also judge-model-only, and `callerVerdict` never carries one, so the
// impactScore-present branch is now dead code with nothing left to
// exercise).

function tmpStoreDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-resolve-discovery-'));
}

function sampleWork(overrides = {}) {
  return {
    id: 'item-x',
    title: 'Produce the output file',
    kind: 'feature',
    status: 'todo',
    deps: [],
    risk: 'light',
    refs: [],
    // tsk-1ni D2: the real submit-time sentinel (bin/fgos.mjs's own
    // SUBMIT_VERIFY_SENTINEL carries this exact string), not an arbitrary
    // fixture literal -- resolveDiscovery's verify-overwrite guard treats
    // any OTHER string as "already real" and protects it.
    verify: RETIRED_P14_PLACEHOLDER,
    stage: 'clarify',
    ...overrides,
  };
}

test('resolveDiscovery throws a validation StoreError for an unknown id', () => {
  const storeDir = tmpStoreDir();
  assert.throws(
    () => resolveDiscovery(storeDir, 'nope', {}),
    (err) => err instanceof StoreError && categoryOf(err) === 'validation',
  );
});

// --- tsk-1x3 D1/D9/D16: the retired blind-judge fallback's replacement --

test('resolveDiscovery with no callerVerdict, no locked CONTEXT.md, and role "runner" no-ops instead of spawning a subprocess judge (D16)', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolveDiscovery(storeDir, 'item-x', {}, 'runner');
  assert.equal(result.outcome, 'noop');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'clarify');
  assert.equal(view.work['item-x'].status, 'todo');
});

test('resolveDiscovery with no callerVerdict, no locked CONTEXT.md, and role "session" refuses loudly instead of guessing (D1/D9)', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  assert.throws(
    () => resolveDiscovery(storeDir, 'item-x', {}, 'session'),
    (err) => {
      assert.ok(err instanceof StoreError);
      assert.match(err.message, /no committed CONTEXT.md and no --verdict was given/);
      assert.match(err.message, /fgos discover item-x --verdict/);
      return true;
    },
  );
});

test('resolveDiscovery with no callerVerdict and no role given (undefined, same as an unattributed caller) also refuses', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  assert.throws(() => resolveDiscovery(storeDir, 'item-x', {}), StoreError);
});

// --- trust signal (tsk-ozl D1-D3): resolveDiscovery skips requiring a
// verdict entirely when the item already carries a committed, non-empty
// CONTEXT.md under its docsRef, instead of guessing past a decision a
// human already locked. Same signal for both `session` and `runner`
// callers — no role branch. ---------------------------------

function mkLockedContextFixture(storeDir, content = '# CONTEXT\n\nD1: locked.\n') {
  const repoRoot = path.dirname(storeDir);
  const featureDir = fs.mkdtempSync(path.join(repoRoot, 'fgos-context-'));
  fs.writeFileSync(path.join(featureDir, 'CONTEXT.md'), content);
  return path.basename(featureDir);
}

test('resolveDiscovery advances to decompose when docsRef points at a real, non-empty CONTEXT.md, with no verdict required', () => {
  const storeDir = tmpStoreDir();
  const docsRef = mkLockedContextFixture(storeDir);
  addWork(storeDir, sampleWork({ docsRef }));

  const result = resolveDiscovery(storeDir, 'item-x', {}, 'session');
  assert.equal(result.outcome, 'clear');
  assert.equal(result.verdict.skipped, true);

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'decompose');
  assert.equal(view.discovery['item-x'].length, 1);
  assert.equal(view.discovery['item-x'][0].clear, true);
  const decisions = view.decisionsById?.['item-x'] ?? [];
  assert.ok(decisions.some((d) => d.text.startsWith('discovery skip:')), 'skip must log an audit-trail decision');
});

test('resolveDiscovery skip path applies identically for role "runner" (RUL19 sweep) as for role "session" — content-based, no role branch', () => {
  const storeDir = tmpStoreDir();
  const docsRef = mkLockedContextFixture(storeDir);
  addWork(storeDir, sampleWork({ docsRef }));

  const result = resolveDiscovery(storeDir, 'item-x', {}, 'runner');
  assert.equal(result.outcome, 'clear');
  assert.equal(result.verdict.skipped, true);
});

test('resolveDiscovery skip path uses gates[id].contextApprove.verify when a Track A approve record exists, instead of FALLBACK_VERIFY', () => {
  const storeDir = tmpStoreDir();
  const docsRef = mkLockedContextFixture(storeDir);
  addWork(storeDir, sampleWork({ docsRef }));
  recordGateApprove(storeDir, { id: 'item-x', gate: 'contextApprove', actor: 'bypass', verify: 'node --test test/real-item-x.test.mjs' });

  const result = resolveDiscovery(storeDir, 'item-x', {}, 'session');
  assert.equal(result.outcome, 'clear');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].verify, 'node --test test/real-item-x.test.mjs');
});

test('resolveDiscovery skip path falls back to FALLBACK_VERIFY when no contextApprove record exists (unchanged behavior)', () => {
  const storeDir = tmpStoreDir();
  const docsRef = mkLockedContextFixture(storeDir);
  addWork(storeDir, sampleWork({ docsRef }));

  resolveDiscovery(storeDir, 'item-x', {}, 'session');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].verify, 'chưa xác định — bổ sung thủ công');
});

test('resolveDiscovery skip path preserves an existing real work.verify instead of falling back to FALLBACK_VERIFY (D2)', () => {
  const storeDir = tmpStoreDir();
  const docsRef = mkLockedContextFixture(storeDir);
  addWork(storeDir, sampleWork({ docsRef, verify: 'node --test test/real-locked-item.test.mjs' }));

  const result = resolveDiscovery(storeDir, 'item-x', {}, 'session');
  assert.equal(result.outcome, 'clear');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].verify, 'node --test test/real-locked-item.test.mjs');
});

// --- resolveContentRoot end-to-end through resolveDiscovery (tsk-1ni D1) --

function initTempGitRepoWithStore() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-discovery-content-root-repo-'));
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

test('resolveDiscovery skip path finds CONTEXT.md via process.cwd() when the state root does not hold it (D1 branch 1, real end-to-end)', () => {
  const { storeDir } = initTempGitRepoWithStore();

  const contentDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-discovery-content-root-cwd-'));
  const featureDir = path.join(contentDir, 'feature');
  fs.mkdirSync(featureDir, { recursive: true });
  fs.writeFileSync(path.join(featureDir, 'CONTEXT.md'), '# CONTEXT\n\nD1: locked.\n');

  addWork(storeDir, sampleWork({ docsRef: 'feature' }));

  const originalCwd = process.cwd();
  process.chdir(contentDir);
  let result;
  try {
    result = resolveDiscovery(storeDir, 'item-x', {}, 'session');
  } finally {
    process.chdir(originalCwd);
  }

  assert.equal(result.outcome, 'clear');
  assert.equal(result.verdict.skipped, true);
});

test('resolveDiscovery skip path finds CONTEXT.md via a real registered worktree when cwd does not hold it (D1 branch 2, crash-recovery case)', () => {
  const { repoRoot, storeDir } = initTempGitRepoWithStore();

  const worktreeBase = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-discovery-content-root-wt-'));
  const { path: worktreePath } = createWorktree(repoRoot, 'item-x', { worktreeDir: worktreeBase });
  const featureDir = path.join(worktreePath, 'feature');
  fs.mkdirSync(featureDir, { recursive: true });
  fs.writeFileSync(path.join(featureDir, 'CONTEXT.md'), '# CONTEXT\n\nD1: locked.\n');
  execFileSync('git', ['add', 'feature'], { cwd: worktreePath });
  execFileSync('git', ['commit', '-q', '-m', 'context: item-x'], { cwd: worktreePath });

  addWork(storeDir, sampleWork({ docsRef: 'feature' }));

  const elsewhere = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-discovery-content-root-elsewhere-'));
  const originalCwd = process.cwd();
  process.chdir(elsewhere);
  let result;
  try {
    result = resolveDiscovery(storeDir, 'item-x', {}, 'session');
  } finally {
    process.chdir(originalCwd);
  }

  assert.equal(result.outcome, 'clear');
  assert.equal(result.verdict.skipped, true);
});

// --- caller-supplied verdict (tsk-27y D1/D2): the ONLY way an interactive
// caller reaches a clear/unclear outcome now that judgeDiscovery is retired.

test('resolveDiscovery advances to decompose on a caller-supplied clear verdict', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolveDiscovery(storeDir, 'item-x', {}, 'session', { clear: true, verify: 'npm test -- caller' });
  assert.equal(result.outcome, 'clear');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'decompose');
  assert.equal(view.work['item-x'].verify, 'npm test -- caller');
  assert.equal(view.discovery['item-x'].at(-1).clear, true);
  const decisions = view.decisionsById?.['item-x'] ?? [];
  assert.ok(decisions.some((d) => d.text.startsWith('discovery caller-supplied:')), 'caller-supplied path must log a distinct audit-trail decision');
});

test('resolveDiscovery parks in awaiting-human on a caller-supplied unclear verdict, with the caller-supplied question', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolveDiscovery(storeDir, 'item-x', {}, 'session', { clear: false, question: 'Which auth provider?' });
  assert.equal(result.outcome, 'unclear');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].status, 'awaiting-human');
  assert.equal(view.gates?.['item-x']?.ask, 'Which auth provider?');
});

test('resolveDiscovery caller-supplied verdict takes precedence over the readLockedContext trust signal (D2)', () => {
  const storeDir = tmpStoreDir();
  const docsRef = mkLockedContextFixture(storeDir);
  addWork(storeDir, sampleWork({ docsRef }));

  const result = resolveDiscovery(storeDir, 'item-x', {}, 'session', { clear: true, verify: 'npm test -- precedence' });
  assert.equal(result.outcome, 'clear');

  const view = listWork(storeDir);
  // The caller-supplied verify wins -- if readLockedContext's own skip path
  // had fired instead, verify would be FALLBACK_VERIFY (no contextApprove
  // record exists in this fixture), never this caller-supplied string.
  assert.equal(view.work['item-x'].verify, 'npm test -- precedence');
  const decisions = view.decisionsById?.['item-x'] ?? [];
  assert.ok(decisions.some((d) => d.text.startsWith('discovery caller-supplied:')));
  assert.ok(!decisions.some((d) => d.text.startsWith('discovery skip:')), 'the readLockedContext skip path must never fire when a caller verdict is present');
});

test('resolveDiscovery on a caller-supplied clear verdict with no verify falls back to a placeholder distinct from the retired P14 sentinel', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  resolveDiscovery(storeDir, 'item-x', {}, 'session', { clear: true });
  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'decompose');
  assert.notEqual(view.work['item-x'].verify, RETIRED_P14_PLACEHOLDER);
  assert.equal(view.work['item-x'].verify, FALLBACK_VERIFY);
});

// tsk-wcl: a second consecutive unclear verdict for an already-awaiting-human
// item must not throw (status-fsm.mjs has no self-transition edge for
// awaiting-human -> awaiting-human, and putInAwaiting always attempts a real
// transition) — the discovery history still gains the new entry.
test('resolveDiscovery on a SECOND consecutive caller-supplied unclear verdict for an already-awaiting-human item does not throw, and still records the new verdict', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const first = resolveDiscovery(storeDir, 'item-x', {}, 'session', { clear: false, question: 'Which endpoint?' });
  assert.equal(first.outcome, 'unclear');
  assert.equal(listWork(storeDir).work['item-x'].status, 'awaiting-human');

  answerAwaiting(storeDir, { id: 'item-x', answer: 'still thinking' });

  let second;
  assert.doesNotThrow(() => {
    second = resolveDiscovery(storeDir, 'item-x', {}, 'session', { clear: false, question: 'Still which endpoint, now with more detail?' });
  });
  assert.equal(second.outcome, 'unclear');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].status, 'awaiting-human');
  assert.equal(view.discovery['item-x'].length, 2);
  assert.equal(view.discovery['item-x'][1].question, 'Still which endpoint, now with more detail?');
});

// claim-lock §5.1: the item's OWN status at the moment of park rides the
// same putInAwaiting call as statusAtAsk, so answerAwaiting can resume to
// it later instead of always falling to 'todo'.
test('resolveDiscovery on a caller-supplied unclear verdict stamps statusAtAsk from the item\'s status at call time — "todo" when never claimed', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  resolveDiscovery(storeDir, 'item-x', {}, 'session', { clear: false, question: 'Which endpoint?' });
  const view = listWork(storeDir);
  assert.equal(view.gates['item-x'].statusAtAsk, 'todo');
});

test('resolveDiscovery on a caller-supplied unclear verdict stamps statusAtAsk "doing" when a pick claim is held through clarify (claim-lock §1/§5.1)', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());
  moveWork(storeDir, { id: 'item-x', to: 'doing', expectedStatus: 'todo', role: 'session' });

  resolveDiscovery(storeDir, 'item-x', {}, 'session', { clear: false, question: 'Which endpoint?' });
  const view = listWork(storeDir);
  assert.equal(view.gates['item-x'].statusAtAsk, 'doing');
});

test('resolveDiscovery refuses a caller-supplied clear verdict when work.status is already awaiting-human from an earlier park (tsk-60r D1)', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());
  // Simulates an earlier round's verify-dispute park -- same shape
  // resolveDiscovery's own dispute branch produces (putInAwaiting with
  // statusAtAsk), without needing a full first discover round.
  putInAwaiting(storeDir, { id: 'item-x', ask: 'Đề xuất verify bị nghi ngờ...', statusAtAsk: 'todo' });

  assert.throws(
    () => resolveDiscovery(storeDir, 'item-x', {}, 'session', { clear: true, verify: 'npm test -- corrected' }),
    (err) => {
      assert.ok(err instanceof StoreError);
      assert.match(err.message, /already "awaiting-human"/);
      assert.match(err.message, /fgos answer item-x/);
      return true;
    },
  );

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].status, 'awaiting-human', 'refused before touching status');
  assert.equal(view.work['item-x'].stage, 'clarify', 'refused before touching stage');
});

test('resolveDiscovery still advances normally on a caller-supplied clear verdict when work.status is not awaiting-human (tsk-60r D1, unchanged behavior)', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolveDiscovery(storeDir, 'item-x', {}, 'session', { clear: true, verify: 'npm test -- caller' });
  assert.equal(result.outcome, 'clear');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'decompose');
  assert.notEqual(view.work['item-x'].status, 'awaiting-human');
});

// --- D2 verify-overwrite guard (tsk-1ni): an already-real work.verify must
// survive a clear caller-supplied verdict, same as it already does on the
// skip path (covered above). ---

test('resolveDiscovery preserves an existing real work.verify instead of overwriting it with the caller-supplied guess (D2, tsk-5e97/tsk-3sw shape)', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ verify: 'node --test test/intake/decompose.test.mjs' }));

  const result = resolveDiscovery(storeDir, 'item-x', {}, 'session', { clear: true, verify: 'npm test' });
  assert.equal(result.outcome, 'clear');
  assert.equal(result.verdict.verify, 'npm test', 'the caller still proposed its own guess in the verdict record');

  const view = listWork(storeDir);
  assert.equal(
    view.work['item-x'].verify,
    'node --test test/intake/decompose.test.mjs',
    'the already-locked real verify must survive, not the caller\'s broader guess',
  );
});

test('resolveDiscovery still fills an empty/placeholder work.verify with the caller-supplied guess (unchanged behavior)', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ verify: RETIRED_P14_PLACEHOLDER }));

  const result = resolveDiscovery(storeDir, 'item-x', {}, 'session', { clear: true, verify: 'npm test' });
  assert.equal(result.outcome, 'clear');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].verify, 'npm test');
  assert.notEqual(view.work['item-x'].verify, FALLBACK_VERIFY);
});

// --- work-item-priority-matrix D6/D7: resolveDiscovery computes+writes
// `priority` via a second, try/catch-wrapped editWork call, right after
// addDiscovery, before the clear/unclear branch. A caller-supplied verdict
// never carries `impactScore` (no `--impact-score` flag exists on `fgos
// discover`), so this always exercises the blocks-only path now — the
// impactScore-present path is retired along with judgeDiscovery, its own
// only real producer. ---

test('resolveDiscovery writes priority (never intent) computed from blocks alone on a caller-supplied clear verdict', () => {
  const storeDir = tmpStoreDir();
  const work = sampleWork();
  addWork(storeDir, work);

  resolveDiscovery(storeDir, 'item-x', {}, 'session', { clear: true, verify: 'npm test -- discovered' });
  const view = listWork(storeDir);
  const expected = computePriority({
    impact: computeImpact({ blocks: 0, semanticRelatedness: 0 }),
    urgent: work.urgent,
    risk: work.risk,
  });
  assert.equal(view.work['item-x'].priority, expected);
  assert.equal(view.work['item-x'].intent, undefined);
});

test('resolveDiscovery writes EXACTLY ONE work.edit event carrying priority per call (no duplicate write)', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  resolveDiscovery(storeDir, 'item-x', {}, 'session', { clear: true, verify: 'npm test -- discovered' });

  const events = readEvents(path.join(storeDir, 'events.jsonl'));
  const priorityEdits = events.filter(
    (e) => e.type === 'work.edit' && e.payload?.id === 'item-x' && e.payload?.patch?.priority !== undefined,
  );
  assert.equal(priorityEdits.length, 1);
});

test('resolveDiscovery still updates priority on a legacy-invalid item shape — editWork\'s scoped validation (tsk-1ne) grandfathers the untouched field instead of blocking the patch', () => {
  const storeDir = tmpStoreDir();
  const logPath = path.join(storeDir, 'events.jsonl');
  // Bypass the normal addWork write door to plant a corrupted item shape
  // (empty `risk`) — replay never validates on fold, so it reads back fine.
  // Before tsk-1ne, editWork's validateWork re-checked the WHOLE merged
  // candidate on every patch, so this legacy-invalid `risk` blocked even an
  // unrelated `priority` patch — resolveDiscovery's try/catch around
  // editWork existed specifically to survive that rejection without
  // aborting the clear/unclear resolution that follows. tsk-1ne scoped
  // that re-validation to only the fields a patch actually touches —
  // `risk` is never in this patch (`{priority}` only), so it is now
  // grandfathered and no longer rejected.
  appendEvent(logPath, { type: 'work.add', payload: { ...sampleWork(), risk: '' } });

  assert.doesNotThrow(() => resolveDiscovery(storeDir, 'item-x', {}, 'session', { clear: true, verify: 'npm test -- discovered' }));
  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'decompose');
  assert.equal(typeof view.work['item-x'].priority, 'number');
});
