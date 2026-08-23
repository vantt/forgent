import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { resolvePlan, resolveCallerPlanVerdict, resolveContentRoot, findUncoveredLockedDecisions } from '../../src/intake/plan.mjs';
import { computeImpact, computePriority } from '../../src/state/priority-formula.mjs';
import { addWork, listWork, StoreError, categoryOf, moveWork, readRawEvents, recordGateApprove, addDecision } from '../../src/state/store.mjs';
import { appendEvent } from '../../src/state/events.mjs';
import { createWorktree } from '../../src/runner/worktree.mjs';

// tsk-1x3 D1/D9/D16 (docs/history/fanout-and-delegation-rubric/CONTEXT.md):
// `judgeDecompose` (a nested `claude -p` subprocess) is retired, mirroring
// discovery.mjs one stage over. This file used to be dominated by direct
// tests of that function's own prompt construction, retry logic, and
// fail-safe logging, plus a `cfg`/fake-executor rig every remaining test
// had to carry along even when it never touched the judge at all — all
// removed. What survives, and what changed:
//
// - the plan.md tiny/small skip-and-advance trust signal — unchanged, a
//   real skip path that requires no verdict at all;
// - the caller-supplied verdict path (`resolveCallerPlanVerdict`,
//   exported) — unchanged, and now the ONLY way an interactive caller
//   reaches a pass-through/need-human/decompose outcome;
// - `resolvePlan`'s own write behavior (children written with
//   parent/deps/verify/footprint/action/description, priority computed,
//   claim released, heavy-risk/blast-radius/footprint-overlap gates,
//   completeness advisory) is real and independent of how the verdict was
//   produced — rewritten here to feed it via `callerVerdict` instead of a
//   fake judge executor, since that is now the only live way to hand
//   resolvePlan a controlled verdict at all;
// - `cfg` is a bare `{}` throughout: neither the retired judgeDecompose nor
//   the now-mechanical, synchronous `judgeVerifySemanticCorrectness`
//   (verify-pattern-check.mjs) ever spawns anything, so the whole
//   fake-executor-script rig this file used to carry (writeVerdictExecutor
//   and its half-dozen siblings) has nothing left to answer.
// - two NEW tests proving D16's own behavior directly: a `'runner'` caller
//   with nothing to go on now no-ops instead of spawning a blind judge, and
//   any other caller refuses loudly instead of silently guessing.
//
// THREE REAL DEAD-CODE FINDINGS surfaced while triaging this file, stated
// plainly rather than silently dropped:
//
// 1. `verdict.mode`/`verdict.blastRadius` were judgeDecompose-model-only
//    fields — `fgos decompose --verdict ...` has no `--mode`/
//    `--blast-radius` flag (`bin/fgos.mjs`'s `parseDecomposeCallerVerdict`),
//    and `resolveCallerPlanVerdict` never sets either on the verdict
//    it returns. With judgeDecompose gone, NOTHING can ever populate them
//    again — the mode-aware priority refinement (`effortForMode` branch)
//    and the entire `blastRadiusGate`/`BLAST_RADIUS_GATE_THRESHOLD`
//    machinery in `resolvePlan` are now structurally unreachable. Left
//    in place (harmless — falls back to the same EFFORT_FLOOR/no-gate
//    behavior it always had for a verdict with no mode/blastRadius), but
//    every test that exercised the mode/blastRadius-present path via a fake
//    judge response is gone with it, not quietly rewritten to pretend it
//    still works.
// 2. tsk-25g D2's priorRejection-threading (a disputed child's prior-round
//    rejection text threaded into the NEXT per-child verify-check prompt)
//    has nothing left to attach to — the new `judgeVerifySemanticCorrectness`
//    takes a single `proposedVerify` string, no prompt, no memory of a
//    prior round at all.
// 3. `resolvePlan`'s own disputedChild `--force` branch
//    (`secondPass.mechanical !== true`) is unreachable for the same reason
//    `judge-verify-second-pass-stability.test.mjs` already documents for
//    discovery.mjs's identical branch: the shared mechanical-only checker
//    can only ever return `mechanical: true` disagreements now, so a
//    caller-supplied `--force` never has a non-mechanical disagreement left
//    to override. The one still-reachable behavior — a mechanical
//    disagreement always parks regardless of `--force` — is the test kept.
//
// Retired without replacement, matching discovery.test.mjs's own reasoning
// exactly one stage over: the scout-notes.md transcript-capture tests
// (tsk-g18) — the mechanism they proved (judgeDecompose's own stream-json
// capture) no longer exists; research capture now lives in
// `fgos-researching`'s RESEARCH.md, a separate, already-built mechanism,
// never a silent regression.

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-decompose-test-'));
}

function tmpStoreDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-resolve-decompose-'));
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

// `cfg` is inert (see header) -- a bare object, never inspected.
const cfg = {};

// tsk-12t: the documented `node --test`/`--test-name-pattern` reporter-
// format trap (docs/how-to/avoid-vacuous-pass-with-node-test-test-name-
// pattern.md) -- the ONE thing verify-pattern-check.mjs's mechanical check
// still catches, reused here to produce a real, reachable disputed-child
// outcome without any executor.
const KNOWN_BAD_VERIFY = 'node --test --test-name-pattern="x" test/foo.test.mjs | grep "^# pass"';

test('resolvePlan throws a validation StoreError for an unknown id', () => {
  const storeDir = tmpStoreDir();
  assert.throws(
    () => resolvePlan(storeDir, 'nope', cfg, 'runner'),
    (err) => err instanceof StoreError && categoryOf(err) === 'validation',
  );
});

// --- tsk-1x3 D1/D9/D16: the retired judgeDecompose fallback's replacement -

test('resolvePlan with no callerVerdict, no locked plan.md, and role "runner" no-ops instead of spawning a subprocess judge (D16)', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolvePlan(storeDir, 'item-x', cfg, 'runner');
  assert.equal(result.outcome, 'noop');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'decompose');
  assert.equal(view.work['item-x'].status, 'todo');
});

test('resolvePlan with no callerVerdict, no locked plan.md, and role "session" refuses loudly instead of guessing (D1/D9)', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  assert.throws(
    () => resolvePlan(storeDir, 'item-x', cfg, 'session'),
    (err) => {
      assert.ok(err instanceof StoreError);
      assert.match(err.message, /no --verdict and plan.md does not declare tiny\/small mode/);
      assert.match(err.message, /fgos plan item-x --verdict/);
      return true;
    },
  );
});

// --- resolvePlan's own pre-verdict early returns: unaffected by the
// judge retirement -- both fire before any verdict is ever needed. ---

test('resolvePlan is a no-op on an item already past stage decompose (idempotent, CAS-backed)', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ stage: 'executing' }));

  const result = resolvePlan(storeDir, 'item-x', cfg, 'runner');
  assert.equal(result.outcome, 'noop');
  assert.equal(listWork(storeDir).work['item-x'].stage, 'executing');
});

test('resolvePlan completes an interrupted decompose (children exist, a decompose decision was already logged, root still at decompose stage) without regenerating children', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());
  // Simulates the crash window: the addWork loop already wrote the child
  // and logDecomposeVerdict already logged the 'decompose' completion
  // decision (plan.mjs's own ordering: decision BEFORE moveStage), but the
  // root's own moveStage never landed before the crash (tsk-4n8: this is
  // the real signal resolvePlan now keys its re-entrancy check on, not
  // bare child existence -- see the "stray child" test below for the case
  // this file used to conflate with this one).
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
  addDecision(storeDir, {
    id: 'item-x',
    text: 'decompose verdict: decompose (1 children)',
    source: 'resolvePlan',
    kind: 'engine',
    rationale: 'test fixture: simulates the crash window between addWork and moveStage',
  });

  const result = resolvePlan(storeDir, 'item-x', cfg, 'runner');
  assert.equal(result.outcome, 'already-decomposed');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'executing');
  const children = Object.values(view.work).filter((item) => item.parent === 'item-x');
  assert.equal(children.length, 1, 'no duplicate generated');
});

test('resolvePlan on the already-decomposed re-entrant path also releases a held claim (claim-lock §3b)', () => {
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
  addDecision(storeDir, {
    id: 'item-x',
    text: 'decompose verdict: decompose (1 children)',
    source: 'resolvePlan',
    kind: 'engine',
    rationale: 'test fixture: simulates the crash window between addWork and moveStage',
  });

  const result = resolvePlan(storeDir, 'item-x', cfg, 'session');
  assert.equal(result.outcome, 'already-decomposed');
  assert.equal(listWork(storeDir).work['item-x'].status, 'todo');
});

// --- tsk-4n8: the bug this item exists to fix -- a stray child (no
// decompose decision logged for it: a prior partial/superseded --children
// submission, or a human's manual `fgos add --parent` workaround) must
// NOT be mistaken for a completed decompose. A later decompose call must
// still be able to run, reconciling by title against what already exists
// instead of permanently refusing. ---

test('resolvePlan does not treat a stray child (no decompose decision logged) as already-decomposed -- it can still add the missing children', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());
  // A stray child: exists, but no 'decompose verdict: decompose' decision
  // was ever logged for item-x (e.g. a human's manual `fgos add --parent`
  // recovery step, or an unrelated write) -- this must not block a real
  // decompose call from running.
  addWork(storeDir, {
    id: 'item-x-1',
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

  const result = resolvePlan(storeDir, 'item-x', cfg, 'session', {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser', action: 'reuse the existing sibling', deps: [] },
      { title: 'Build renderer', verify: 'npm test -- renderer', action: 'the second half of the split', deps: [] },
    ],
  });

  assert.equal(result.outcome, 'decompose');
  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'executing');
  const children = Object.values(view.work).filter((item) => item.parent === 'item-x');
  assert.equal(children.length, 2, 'the existing stray child is reused, one new child is added');
  assert.ok(view.work['item-x-1'], 'the existing sibling id is reused, not recreated');
  assert.equal(view.work['item-x-1'].title, 'Build parser');
  const newChild = children.find((c) => c.title === 'Build renderer');
  assert.ok(newChild, 'the missing child was created');
  assert.equal(newChild.id, 'item-x-2', 'the new id continues past the existing sibling suffix, no collision');
});

test('resolvePlan still parks need-human when a NEW child\'s footprint collides with an EXISTING sibling\'s real footprint', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());
  addWork(storeDir, {
    id: 'item-x-1',
    title: 'Build parser',
    kind: 'feature',
    status: 'todo',
    deps: [],
    risk: 'standard',
    refs: [],
    verify: 'npm test -- parser',
    footprint: ['src/shared.mjs'],
    stage: 'executing',
    parent: 'item-x',
  });

  const result = resolvePlan(storeDir, 'item-x', cfg, 'session', {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser', action: 'reuse the existing sibling', deps: [], footprint: ['src/shared.mjs'] },
      { title: 'Build renderer', verify: 'npm test -- renderer', action: 'the second half of the split', deps: [], footprint: ['src/shared.mjs'] },
    ],
  });

  assert.equal(result.outcome, 'need-human');
  const children = Object.values(listWork(storeDir).work).filter((item) => item.parent === 'item-x');
  assert.equal(children.length, 1, 'the new colliding child was never written');
});

// --- resolveCallerPlanVerdict (tsk-27y D1/D2): pure normalization
// logic -- same rejection/dep-index/D-ID-citation rules a model-produced
// verdict used to go through inside judgeDecompose, now the only door. ---

test('resolveCallerPlanVerdict normalizes a decompose verdict with resolved sibling deps', () => {
  const verdict = resolveCallerPlanVerdict({
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser', action: 'x' },
      { title: 'Build renderer', verify: 'npm test -- renderer', action: 'x', deps: [0] },
    ],
  });
  assert.equal(verdict.kind, 'decompose');
  assert.equal(verdict.children.length, 2);
  assert.deepEqual(verdict.children[0].deps, []);
  assert.deepEqual(verdict.children[1].deps, [0]);
});

test('resolveCallerPlanVerdict drops a forward/self dep index instead of invalidating the whole verdict', () => {
  const verdict = resolveCallerPlanVerdict({
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser', action: 'x', deps: [1] }, // forward ref, dropped
      { title: 'Build renderer', verify: 'npm test -- renderer', action: 'x', deps: [1] }, // self ref, dropped
    ],
  });
  assert.equal(verdict.kind, 'decompose');
  assert.deepEqual(verdict.children[0].deps, []);
  assert.deepEqual(verdict.children[1].deps, []);
});

test('resolveCallerPlanVerdict normalizes an empty children array on a decompose verdict to pass-through', () => {
  const verdict = resolveCallerPlanVerdict({ verdict: 'decompose', reason: 'no split needed after all', children: [] });
  assert.deepEqual(verdict, { kind: 'pass-through', reason: 'no split needed after all' });
});

test('resolveCallerPlanVerdict is invalid when any child is missing a real verify (no placeholder allowed)', () => {
  const verdict = resolveCallerPlanVerdict({
    verdict: 'decompose',
    reason: 'x',
    children: [{ title: 'Build parser', verify: 'npm test -- parser' }, { title: 'Build renderer' }],
  });
  assert.deepEqual(verdict, { kind: 'invalid' });
});

test('resolveCallerPlanVerdict is invalid when a child verify is a blank/whitespace-only string', () => {
  const verdict = resolveCallerPlanVerdict({
    verdict: 'decompose',
    reason: 'x',
    children: [{ title: 'Build parser', verify: '   ' }],
  });
  assert.deepEqual(verdict, { kind: 'invalid' });
});

test('resolveCallerPlanVerdict is invalid when a decompose verdict has no top-level reason (tsk-6b6 D3)', () => {
  const verdict = resolveCallerPlanVerdict({
    verdict: 'decompose',
    children: [{ title: 'Build parser', verify: 'npm test -- parser' }],
  });
  assert.deepEqual(verdict, { kind: 'invalid' });
});

test('resolveCallerPlanVerdict is invalid when a decompose verdict has a blank/whitespace-only reason', () => {
  const verdict = resolveCallerPlanVerdict({
    verdict: 'decompose',
    reason: '   ',
    children: [{ title: 'Build parser', verify: 'npm test -- parser' }],
  });
  assert.deepEqual(verdict, { kind: 'invalid' });
});

// tsk-3xd D2: action is bắt buộc, same "no placeholder invalidates the
// whole verdict" discipline verify already has above.

test('resolveCallerPlanVerdict is invalid when any child is missing action (tsk-3xd D2, mirrors the missing-verify rule)', () => {
  const verdict = resolveCallerPlanVerdict(
    {
      verdict: 'decompose',
      reason: 'Two independent surfaces, no shared state',
      children: [
        { title: 'Build parser', verify: 'npm test -- parser', action: 'D1: implement per parent.' },
        { title: 'Build renderer', verify: 'npm test -- renderer' }, // missing action
      ],
    },
    '## Locked decisions\n\nD1: placeholder.\n',
  );
  assert.deepEqual(verdict, { kind: 'invalid' });
});

test('resolveCallerPlanVerdict is invalid when a child action is a blank/whitespace-only string', () => {
  const verdict = resolveCallerPlanVerdict(
    { verdict: 'decompose', reason: 'x', children: [{ title: 'Build parser', verify: 'npm test -- parser', action: '   ' }] },
    '## Locked decisions\n\nD1: placeholder.\n',
  );
  assert.deepEqual(verdict, { kind: 'invalid' });
});

test('resolveCallerPlanVerdict is invalid when a child action cites a D-ID that was never locked in the parent CONTEXT.md (tsk-3xd D2)', () => {
  const verdict = resolveCallerPlanVerdict(
    { verdict: 'decompose', reason: 'x', children: [{ title: 'Build parser', verify: 'npm test -- parser', action: 'D9: a decision that was never locked.' }] },
    '## Locked decisions\n\nD1: placeholder.\nD2: another one.\n',
  );
  assert.deepEqual(verdict, { kind: 'invalid' });
});

test('resolveCallerPlanVerdict accepts a child action citing a real D-ID from the parent CONTEXT.md (tsk-3xd D2)', () => {
  const verdict = resolveCallerPlanVerdict(
    { verdict: 'decompose', reason: 'x', children: [{ title: 'Build parser', verify: 'npm test -- parser', action: 'D1: implement the parser per the locked format.' }] },
    '## Locked decisions\n\nD1: placeholder.\n',
  );
  assert.equal(verdict.kind, 'decompose');
  assert.equal(verdict.children[0].action, 'D1: implement the parser per the locked format.');
});

test('resolveCallerPlanVerdict accepts any non-empty action when the parent CONTEXT.md has no "## Locked decisions" section at all (tsk-3xd D2 graceful degrade)', () => {
  const verdict = resolveCallerPlanVerdict({
    verdict: 'decompose',
    reason: 'x',
    children: [{ title: 'Build parser', verify: 'npm test -- parser', action: 'Implement it — no locked decisions exist to cite.' }],
  }); // no lockedContext at all
  assert.equal(verdict.kind, 'decompose');
});

test('resolveCallerPlanVerdict falls back to a default reason when a need-human verdict supplies none', () => {
  const verdict = resolveCallerPlanVerdict({ verdict: 'need-human' });
  assert.equal(verdict.kind, 'need-human');
  assert.equal(typeof verdict.reason, 'string');
  assert.ok(verdict.reason.length > 0);
});

test('resolveCallerPlanVerdict keeps a need-human verdict\'s own reason', () => {
  const verdict = resolveCallerPlanVerdict({ verdict: 'need-human', reason: 'Scope unclear across two services' });
  assert.deepEqual(verdict, { kind: 'need-human', reason: 'Scope unclear across two services' });
});

// --- resolvePlan: read-verdict-write over the real store, fed via
// callerVerdict -- the only live door left now that judgeDecompose is
// retired. ---

test('resolvePlan on a caller-supplied pass-through verdict moves the item straight to executing, keeping its existing verify', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolvePlan(storeDir, 'item-x', cfg, 'runner', { verdict: 'pass-through', reason: 'single cohesive change' });
  assert.equal(result.outcome, 'pass-through');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'executing');
  assert.equal(view.work['item-x'].verify, 'npm test -- reporting');
});

test('resolvePlan still computes a priority (EFFORT_FLOOR default) on a caller-supplied verdict, which never carries mode/blastRadius', () => {
  const storeDir = tmpStoreDir();
  const work = sampleWork();
  addWork(storeDir, work);

  resolvePlan(storeDir, 'item-x', cfg, 'runner', { verdict: 'pass-through' });
  const view = listWork(storeDir);
  const expected = computePriority({ impact: computeImpact({ blocks: 0 }), urgent: work.urgent, risk: work.risk });
  assert.equal(view.work['item-x'].priority, expected);
});

// claim-lock §3b: a pick claim held through clarify/decompose (status
// 'doing') is released back to 'todo' the moment the root actually reaches
// stage executing, so `pick <id>` can re-claim it for the executing phase.
test('resolvePlan on a caller-supplied pass-through verdict releases a held claim (doing -> todo) once the root reaches executing (claim-lock §3b)', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());
  moveWork(storeDir, { id: 'item-x', to: 'doing', expectedStatus: 'todo', role: 'session' });

  const result = resolvePlan(storeDir, 'item-x', cfg, 'session', { verdict: 'pass-through' });
  assert.equal(result.outcome, 'pass-through');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'executing');
  assert.equal(view.work['item-x'].status, 'todo');

  // tsk-2zv: the release carries a positive marker so claimWork can tell
  // this todo-entry apart from a reject/verify-fail park.
  const releaseEvent = readRawEvents(storeDir)
    .filter((e) => e.type === 'work.move' && e.payload.id === 'item-x' && e.payload.to === 'todo')
    .at(-1);
  assert.equal(releaseEvent.payload.releaseTrigger, 'claim-lock-3b');
});

// tsk-4hb: the refined priority-write pass (this file's own call site) logs
// the same observability decision discovery.mjs's rough pass does when
// work.risk is present but not a real RISK_DISCOUNTS key. `addWork` now
// enforces risk as an enum (tsk-5wz), so this shape only exists as legacy
// data -- appendEvent bypasses the write door to plant one, same technique
// discovery.test.mjs uses for its own legacy-shape fixtures.
test('resolvePlan logs a decision when work.risk is present but unrecognized, never for a recognized value', () => {
  const storeDir = tmpStoreDir();
  const logPath = path.join(storeDir, 'events.jsonl');
  appendEvent(logPath, { type: 'work.add', payload: { ...sampleWork(), id: 'item-unrecognized', risk: 'medium' } });
  appendEvent(logPath, { type: 'work.add', payload: { ...sampleWork(), id: 'item-recognized', risk: 'heavy' } });

  resolvePlan(storeDir, 'item-unrecognized', cfg, 'session', { verdict: 'pass-through' });
  resolvePlan(storeDir, 'item-recognized', cfg, 'session', { verdict: 'pass-through' });

  const view = listWork(storeDir);
  const unrecognizedDecisions = (view.decisionsById?.['item-unrecognized'] ?? []).filter((d) => d.text.includes('not a recognized RISK_DISCOUNTS key'));
  const recognizedDecisions = (view.decisionsById?.['item-recognized'] ?? []).filter((d) => d.text.includes('not a recognized RISK_DISCOUNTS key'));
  assert.equal(unrecognizedDecisions.length, 1);
  assert.match(unrecognizedDecisions[0].text, /work\.risk "medium"/);
  assert.equal(recognizedDecisions.length, 0);
});

// tsk-sq9: the refined priority-write pass skips its own overwrite when a
// human already logged a `priority-override` decision (via `edit
// --priority`) for the item, and writes normally when it has not.
test('resolvePlan skips its priority overwrite when a priority-override decision is on record, writes normally otherwise', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ id: 'item-overridden', priority: 42 }));
  addWork(storeDir, sampleWork({ id: 'item-not-overridden' }));
  addDecision(storeDir, {
    id: 'item-overridden',
    text: 'priority set to 42 via edit --priority',
    source: 'edit',
    kind: 'priority-override',
    rationale: 'test fixture: simulate a human override recorded before the refined pass runs',
  });

  resolvePlan(storeDir, 'item-overridden', cfg, 'session', { verdict: 'pass-through' });
  resolvePlan(storeDir, 'item-not-overridden', cfg, 'session', { verdict: 'pass-through' });

  const view = listWork(storeDir);
  assert.equal(view.work['item-overridden'].priority, 42, 'the human-set value must survive the refined pass');
  assert.notEqual(view.work['item-not-overridden'].priority, undefined, 'the refined pass still computes/writes priority when no override is on record');

  const skipDecisions = (view.decisionsById?.['item-overridden'] ?? []).filter((d) => d.text.includes('skipped refined-pass overwrite'));
  assert.equal(skipDecisions.length, 1);
  const noSkipDecisions = (view.decisionsById?.['item-not-overridden'] ?? []).filter((d) => d.text.includes('skipped refined-pass overwrite'));
  assert.equal(noSkipDecisions.length, 0);
});

test('resolvePlan on a caller-supplied decompose verdict writes every child with parent/deps/verify and moves the root to executing', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolvePlan(storeDir, 'item-x', cfg, 'runner', {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser', action: 'implement the described change for this test.' },
      { title: 'Build renderer', verify: 'npm test -- renderer', action: 'implement the described change for this test.', deps: [0] },
    ],
  });
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

test('resolvePlan on a caller-supplied decompose verdict releases a held claim (doing -> todo) once the root reaches executing (claim-lock §3b)', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());
  moveWork(storeDir, { id: 'item-x', to: 'doing', expectedStatus: 'todo', role: 'session' });

  const result = resolvePlan(storeDir, 'item-x', cfg, 'session', {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [{ title: 'Build parser', verify: 'npm test -- parser', action: 'implement the described change for this test.' }],
  });
  assert.equal(result.outcome, 'decompose');
  assert.equal(listWork(storeDir).work['item-x'].status, 'todo');
});

test('resolvePlan writes footprint on a child exactly when the verdict provided one, undefined otherwise', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolvePlan(storeDir, 'item-x', cfg, 'runner', {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser', action: 'x', footprint: ['src/parser.mjs', 'test/parser.test.mjs'] },
      { title: 'Build renderer', verify: 'npm test -- renderer', action: 'x' },
    ],
  });
  assert.equal(result.outcome, 'decompose');

  const view = listWork(storeDir);
  const [firstId, secondId] = result.childIds;
  assert.deepEqual(view.work[firstId].footprint, ['src/parser.mjs', 'test/parser.test.mjs']);
  assert.equal(view.work[secondId].footprint, undefined);
});

// tsk-3xd D1/D3 (tầng 3 fix): action survives from the verdict all the way
// into the actual written child work item.
test('resolvePlan writes action on every child exactly as the verdict provided it (tsk-3xd D1/D3)', () => {
  const storeDir = tmpStoreDir();
  const { docsRef } = mkContextFixture(storeDir, '## Locked decisions\n\nD1: placeholder — filled below.\n');
  addWork(storeDir, sampleWork({ docsRef }));

  const result = resolvePlan(storeDir, 'item-x', cfg, 'runner', {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser', action: 'D1: implement the parser per the locked format.' },
      { title: 'Build renderer', verify: 'npm test -- renderer', action: 'D1: implement the renderer per the locked format.' },
    ],
  });
  assert.equal(result.outcome, 'decompose');

  const view = listWork(storeDir);
  const [firstId, secondId] = result.childIds;
  assert.equal(view.work[firstId].action, 'D1: implement the parser per the locked format.');
  assert.equal(view.work[secondId].action, 'D1: implement the renderer per the locked format.');
});

// tsk-535 D2: description = the child's own title, not action.
test('resolvePlan writes description on every child, equal to its own title (tsk-535 D2)', () => {
  const storeDir = tmpStoreDir();
  const { docsRef } = mkContextFixture(storeDir, '## Locked decisions\n\nD1: placeholder — filled below.\n');
  addWork(storeDir, sampleWork({ docsRef }));

  const result = resolvePlan(storeDir, 'item-x', cfg, 'runner', {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser', action: 'D1: implement the parser per the locked format.' },
      { title: 'Build renderer', verify: 'npm test -- renderer', action: 'D1: implement the renderer per the locked format.' },
    ],
  });
  assert.equal(result.outcome, 'decompose');

  const view = listWork(storeDir);
  const [firstId, secondId] = result.childIds;
  assert.equal(view.work[firstId].description, 'Build parser');
  assert.equal(view.work[secondId].description, 'Build renderer');
});

test('resolvePlan leaves footprint undefined when a child provides a malformed (non-array) footprint, without invalidating the verdict', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolvePlan(storeDir, 'item-x', cfg, 'runner', {
    verdict: 'decompose',
    reason: 'x',
    children: [{ title: 'Build parser', verify: 'npm test -- parser', action: 'x', footprint: 'not-an-array' }],
  });
  assert.equal(result.outcome, 'decompose');
  assert.equal(listWork(storeDir).work[result.childIds[0]].footprint, undefined);
});

// --- tsk-5e97 D1: footprint overlap among the TENTATIVE children of a
// decompose verdict gates to awaiting-human, writing no children -- same
// shape as keywordRiskGate/blastRadiusGate, never auto-adjusting. ---

test('resolvePlan gates to awaiting-human when tentative children declare overlapping footprint, writing no children (tsk-5e97 D1)', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolvePlan(storeDir, 'item-x', cfg, 'runner', {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser', action: 'x', footprint: ['src/parser.mjs', 'src/shared.mjs'] },
      { title: 'Build renderer', verify: 'npm test -- renderer', action: 'x', footprint: ['src/shared.mjs', 'src/renderer.mjs'] },
    ],
  });
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

test('resolvePlan honors a declared deps edge between tentative children as the sequence resolution for a shared footprint', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolvePlan(storeDir, 'item-x', cfg, 'runner', {
    verdict: 'decompose',
    reason: 'One child must finish before the other touches the same file',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser', action: 'x', footprint: ['src/parser.mjs', 'src/shared.mjs'] },
      {
        title: 'Build renderer',
        verify: 'npm test -- renderer',
        action: 'x',
        footprint: ['src/shared.mjs'],
        deps: [0],
      },
    ],
  });
  assert.equal(result.outcome, 'decompose');
  assert.equal(result.childIds.length, 2);

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'executing');
  assert.deepEqual(view.work[result.childIds[1]].deps, [result.childIds[0]]);
});

test('resolvePlan proceeds normally when tentative children declare disjoint (or absent) footprint', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolvePlan(storeDir, 'item-x', cfg, 'runner', {
    verdict: 'decompose',
    reason: 'x',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser', action: 'x', footprint: ['src/parser.mjs'] },
      { title: 'Build renderer', verify: 'npm test -- renderer', action: 'x' }, // no footprint declared
    ],
  });
  assert.equal(result.outcome, 'decompose');
  assert.equal(result.childIds.length, 2);
  assert.equal(listWork(storeDir).work['item-x'].stage, 'executing');
});

test('resolvePlan: the heavy-risk gate preempts the footprint-overlap check', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ risk: 'heavy' }));

  const result = resolvePlan(storeDir, 'item-x', cfg, 'runner', {
    verdict: 'decompose',
    reason: 'x',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser', action: 'x', footprint: ['src/parser.mjs', 'src/shared.mjs'] },
      { title: 'Build renderer', verify: 'npm test -- renderer', action: 'x', footprint: ['src/shared.mjs'] },
    ],
  });
  assert.equal(result.outcome, 'need-human');
  const view = listWork(storeDir);
  assert.match(view.gates['item-x'].ask, /risk cao \(heavy\)/);
  assert.doesNotMatch(view.gates['item-x'].ask, /Footprint trùng/);
  assert.equal(Object.values(view.work).filter((item) => item.parent === 'item-x').length, 0);
});

test('resolvePlan logs a decisionsById entry on a footprint-overlap need-human outcome, naming the conflict count', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  resolvePlan(storeDir, 'item-x', cfg, 'runner', {
    verdict: 'decompose',
    reason: 'x',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser', action: 'x', footprint: ['src/parser.mjs', 'src/shared.mjs'] },
      { title: 'Build renderer', verify: 'npm test -- renderer', action: 'x', footprint: ['src/shared.mjs'] },
    ],
  });

  const entries = listWork(storeDir).decisionsById['item-x'];
  assert.equal(entries.length, 2, 'the caller-supplied entry plus the footprint-overlap entry');
  assert.match(entries[1].text, /need-human/);
  assert.match(entries[1].text, /1 footprint conflicts/);
  assert.match(entries[1].rationale, /Footprint trùng giữa các việc con dự kiến/);
});

test('resolvePlan self-resolves the footprint-overlap gate once the next call proposes non-overlapping children (no bypass constant needed, tsk-5e97 D1)', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const first = resolvePlan(storeDir, 'item-x', cfg, 'human', {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser', action: 'x', footprint: ['src/parser.mjs', 'src/shared.mjs'] },
      { title: 'Build renderer', verify: 'npm test -- renderer', action: 'x', footprint: ['src/shared.mjs'] },
    ],
  });
  assert.equal(first.outcome, 'need-human');

  moveWork(storeDir, { id: 'item-x', to: 'todo', expectedStatus: 'awaiting-human', answer: 'Đã re-slice, không còn trùng file.' });

  const second = resolvePlan(storeDir, 'item-x', cfg, 'human', {
    verdict: 'decompose',
    reason: 'Re-sliced after human input — no shared file left',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser', action: 'x', footprint: ['src/parser.mjs'] },
      { title: 'Build renderer', verify: 'npm test -- renderer', action: 'x', footprint: ['src/renderer.mjs'] },
    ],
  });
  assert.equal(second.outcome, 'decompose', 'the gate must pass once the fresh verdict proposes non-overlapping children');
  assert.equal(second.childIds.length, 2);
  assert.equal(listWork(storeDir).work['item-x'].stage, 'executing');
});

test('resolvePlan assigns positional child ids `${work.id}-<n>` for n=1..N across N siblings', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolvePlan(storeDir, 'item-x', cfg, 'runner', {
    verdict: 'decompose',
    reason: 'x',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser', action: 'x' },
      { title: 'Build renderer', verify: 'npm test -- renderer', action: 'x' },
      { title: 'Build linker', verify: 'npm test -- linker', action: 'x' },
    ],
  });
  assert.equal(result.outcome, 'decompose');
  assert.deepEqual(result.childIds, ['item-x-1', 'item-x-2', 'item-x-3']);
});

test('resolvePlan on a grandchild decompose produces `<root>-<m>-<n>` ids with no special-case code', () => {
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

  const result = resolvePlan(storeDir, 'item-x-2', cfg, 'runner', {
    verdict: 'decompose',
    reason: 'x',
    children: [{ title: 'Build sub-parser', verify: 'npm test -- sub-parser', action: 'x' }],
  });
  assert.equal(result.outcome, 'decompose');
  assert.deepEqual(result.childIds, ['item-x-2-1']);
  assert.equal(listWork(storeDir).work['item-x-2-1'].parent, 'item-x-2');
});

test('resolvePlan on a caller-supplied need-human verdict parks the item in awaiting-human carrying the proposal, writing no children', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolvePlan(storeDir, 'item-x', cfg, 'runner', { verdict: 'need-human', reason: 'Ambiguous scope' });
  assert.equal(result.outcome, 'need-human');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].status, 'awaiting-human');
  assert.equal(view.work['item-x'].stage, 'decompose');
  assert.match(view.gates['item-x'].ask, /Ambiguous scope/);
  assert.equal(Object.values(view.work).filter((item) => item.parent === 'item-x').length, 0);
});

test('resolvePlan on a caller-supplied need-human verdict stamps statusAtAsk "doing" when a pick claim is held (claim-lock §5.1)', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());
  moveWork(storeDir, { id: 'item-x', to: 'doing', expectedStatus: 'todo', role: 'session' });

  const result = resolvePlan(storeDir, 'item-x', cfg, 'session', { verdict: 'need-human', reason: 'Ambiguous scope' });
  assert.equal(result.outcome, 'need-human');
  assert.equal(listWork(storeDir).gates['item-x'].statusAtAsk, 'doing');
});

test('resolvePlan routes a risk-heavy root through the human gate even on a clean caller-supplied decompose verdict, writing no children yet', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ risk: 'heavy' }));

  const result = resolvePlan(storeDir, 'item-x', cfg, 'runner', {
    verdict: 'decompose',
    reason: 'x',
    children: [{ title: 'Build parser', verify: 'npm test -- parser', action: 'x' }],
  });
  assert.equal(result.outcome, 'need-human');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].status, 'awaiting-human');
  assert.match(view.gates['item-x'].ask, /Build parser/);
  assert.equal(Object.values(view.work).filter((item) => item.parent === 'item-x').length, 0);
});

test('resolvePlan routes a risk-heavy root through the human gate on a caller-supplied pass-through verdict too', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ risk: 'heavy' }));

  const result = resolvePlan(storeDir, 'item-x', cfg, 'runner', { verdict: 'pass-through' });
  assert.equal(result.outcome, 'need-human');
  assert.equal(listWork(storeDir).work['item-x'].stage, 'decompose');
});

// --- heavy-risk gate release (tsk-3w8 follow-up): without this, a
// risk-heavy root re-fires the SAME "confirm before splitting" ask forever
// regardless of any answer a human gives -- the gate must release once a
// human has genuinely answered ITS OWN prior ask, never a stale answer from
// an unrelated question. ---

test('resolvePlan releases a risk-heavy root once the human has answered THIS gate\'s own prior ask, proceeding with the caller-supplied verdict', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ risk: 'heavy' }));

  const first = resolvePlan(storeDir, 'item-x', cfg, 'human', { verdict: 'pass-through' });
  assert.equal(first.outcome, 'need-human');
  assert.match(listWork(storeDir).gates['item-x'].ask, /risk cao \(heavy\)/);

  moveWork(storeDir, { id: 'item-x', to: 'todo', expectedStatus: 'awaiting-human', answer: 'Đã xác nhận, cứ pass-through.' });

  const second = resolvePlan(storeDir, 'item-x', cfg, 'human', { verdict: 'pass-through' });
  assert.equal(second.outcome, 'pass-through', 'the gate must release once its own prior ask has a real answer on record');
  const finalView = listWork(storeDir);
  assert.equal(finalView.work['item-x'].stage, 'executing');

  // tsk-6b6: both calls log a decisionsById entry, accumulating rather than
  // overwriting -- the caller-supplied entry + the need-human entry from
  // round 1, then the caller-supplied entry + the pass-through entry from
  // round 2.
  const entries = finalView.decisionsById['item-x'];
  assert.equal(entries.length, 4);
  assert.ok(entries.some((e) => /need-human/.test(e.text)));
  assert.ok(entries.some((e) => /pass-through/.test(e.text)));
  assert.ok(entries.every((e) => e.source === 'resolvePlan'));
});

test('resolvePlan does NOT release the risk-heavy gate on a stale/unrelated gate answer (never a false bypass)', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ risk: 'heavy' }));
  // A gate answer already on record, but from an unrelated question (e.g.
  // the clarify-stage's own ask) — must never be read as confirming this
  // gate's own distinct ask.
  moveWork(storeDir, { id: 'item-x', to: 'awaiting-human', ask: '## Context\n\nA prior clarify-stage question already exists on this item, unrelated to the current gate.\n\n## Why this matters\n\nThis directly affects the outcome: Which file exactly?', statusAtAsk: 'todo' });
  moveWork(storeDir, { id: 'item-x', to: 'todo', expectedStatus: 'awaiting-human', answer: 'The parser module.' });

  const result = resolvePlan(storeDir, 'item-x', cfg, 'human', { verdict: 'pass-through' });
  assert.equal(result.outcome, 'need-human', 'an unrelated prior answer must not bypass the heavy-risk gate');
  assert.equal(listWork(storeDir).work['item-x'].stage, 'decompose');
});

// --- tsk-wve D1: the heavy-risk floor skips only when the verdict's own
// reason cites a real, already-locked decision from the item's own
// CONTEXT.md -- same D-ID-citation precedent normalizeChild already
// applies to a decompose child's own action field. ---

test('resolvePlan skips the risk-heavy gate when the verdict cites a real locked decision from the item\'s own CONTEXT.md (tsk-wve D1)', () => {
  const storeDir = tmpStoreDir();
  const { docsRef } = mkContextFixture(storeDir, '## Locked decisions\n\nD1: placeholder.\n');
  addWork(storeDir, sampleWork({ risk: 'heavy', docsRef }));

  const result = resolvePlan(storeDir, 'item-x', cfg, 'human', {
    verdict: 'pass-through',
    reason: 'D1: already grounded in the locked decision, no split needed.',
  });
  assert.equal(result.outcome, 'pass-through', 'a real D-ID citation grounds the verdict, releasing the heavy-risk floor');
  assert.equal(listWork(storeDir).work['item-x'].stage, 'executing');
});

test('resolvePlan still gates a risk-heavy root when its CONTEXT.md carries no locked decisions at all, even if the reason mentions a D-ID-shaped token (tsk-wve D1, fail-safe against a fabricated citation)', () => {
  const storeDir = tmpStoreDir();
  const { docsRef } = mkContextFixture(storeDir, '# CONTEXT\n\nNo locked decisions section here.\n');
  addWork(storeDir, sampleWork({ risk: 'heavy', docsRef }));

  const result = resolvePlan(storeDir, 'item-x', cfg, 'human', {
    verdict: 'pass-through',
    reason: 'D1: nothing real backs this -- the parent never locked a D1.',
  });
  assert.equal(result.outcome, 'need-human', 'a D-ID-shaped token with nothing real to cite must never bypass the floor');
  assert.equal(listWork(storeDir).work['item-x'].stage, 'decompose');
});

test('resolvePlan rejects a caller-supplied decompose verdict with a child missing verify, same fail-safe an invalid shape always gets — no partial write', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolvePlan(storeDir, 'item-x', cfg, 'session', {
    verdict: 'decompose',
    reason: 'Two independent surfaces',
    children: [{ title: 'Build parser' }], // no verify
  });
  assert.equal(result.outcome, 'invalid');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'decompose', 'item left exactly where it was');
  assert.equal(Object.values(view.work).some((item) => item.parent === 'item-x'), false);
});

// --- tsk-5q5-1 (D2/D4): each child's proposed verify gets an independent
// second-pass mechanical check (tsk-1x3 D17: verify-pattern-check.mjs),
// before ANY child is written -- a disagreement on any one of them parks
// the WHOLE decompose verdict as need-human, never a partial write. ---

test('resolvePlan parks as need-human (no children written) when a child\'s verify trips the mechanical bad-pattern check', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolvePlan(storeDir, 'item-x', cfg, 'runner', {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser', action: 'x' },
      { title: 'Build renderer', verify: KNOWN_BAD_VERIFY, action: 'x' },
    ],
  });
  assert.equal(result.outcome, 'need-human');

  const view = listWork(storeDir);
  // No partial write -- neither child exists, root stays at decompose.
  assert.equal(view.work['item-x'].stage, 'decompose');
  assert.equal(Object.values(view.work).filter((item) => item.parent === 'item-x').length, 0);
  assert.match(view.gates['item-x'].ask, /node --test/);
});

test('resolvePlan still writes every child when the mechanical second-pass check agrees with all of them', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolvePlan(storeDir, 'item-x', cfg, 'runner', {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser', action: 'x' },
      { title: 'Build renderer', verify: 'npm test -- renderer', action: 'x' },
    ],
  });
  assert.equal(result.outcome, 'decompose');
  assert.equal(result.childIds.length, 2);
});

test('resolvePlan --force never overrides a MECHANICAL disagreement (tsk-12t D6) -- still parks', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolvePlan(storeDir, 'item-x', cfg, 'runner', {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [{ title: 'Build parser', verify: KNOWN_BAD_VERIFY, action: 'x' }],
    force: true,
  });
  assert.equal(result.outcome, 'need-human');
  assert.equal(Object.values(listWork(storeDir).work).filter((item) => item.parent === 'item-x').length, 0);
});

// --- tsk-4m4 (narrowed, D1): planApproveVerify itself gets the same
// mechanical second-pass check the per-child verify already gets above --
// one check, before ANY of the four call sites that reuse it (hasChildren
// re-entrancy, tiny/small skip-and-advance, explicit pass-through, real
// decompose success). ---

test('resolvePlan parks as verify-disputed (no stage move) when the item\'s own verify trips the mechanical bad-pattern check, on a pass-through verdict', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ verify: KNOWN_BAD_VERIFY }));

  const result = resolvePlan(storeDir, 'item-x', cfg, 'runner', { verdict: 'pass-through', reason: 'single cohesive change' });
  assert.equal(result.outcome, 'verify-disputed');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'decompose', 'item left exactly where it was, never advanced to executing');
  assert.match(view.gates['item-x'].ask, /node --test/);
});

test('resolvePlan --force never overrides a MECHANICAL planApproveVerify disagreement either (tsk-12t D6) -- still parks', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ verify: KNOWN_BAD_VERIFY }));

  const result = resolvePlan(storeDir, 'item-x', cfg, 'runner', { verdict: 'pass-through', reason: 'single cohesive change', force: true });
  assert.equal(result.outcome, 'verify-disputed');
  assert.equal(listWork(storeDir).work['item-x'].stage, 'decompose');
});

test('resolvePlan parks as verify-disputed on the real decompose success path too, before any child is written', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ verify: KNOWN_BAD_VERIFY }));

  const result = resolvePlan(storeDir, 'item-x', cfg, 'runner', {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [{ title: 'Build parser', verify: 'npm test -- parser', action: 'x' }],
  });
  assert.equal(result.outcome, 'verify-disputed');
  assert.equal(Object.values(listWork(storeDir).work).filter((item) => item.parent === 'item-x').length, 0, 'no partial write -- the root\'s own verify parked before any child was considered');
});

test('resolvePlan still proceeds normally (pass-through) when planApproveVerify agrees -- undisputed verify is unaffected', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolvePlan(storeDir, 'item-x', cfg, 'runner', { verdict: 'pass-through', reason: 'single cohesive change' });
  assert.equal(result.outcome, 'pass-through');
  assert.equal(listWork(storeDir).work['item-x'].stage, 'executing');
});

// --- decision-trail capture (tsk-6b6): every verdict branch logs a
// decisionsById entry via the shipped addDecision (tsk-63c). ---

test('resolvePlan logs a decisionsById entry on an invalid (missing top-level reason) caller-supplied verdict', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolvePlan(storeDir, 'item-x', cfg, 'runner', {
    verdict: 'decompose',
    children: [{ title: 'Build parser', verify: 'npm test -- parser', action: 'x' }],
    // no `reason` -- fails buildDecomposeChildrenVerdict's D3 check
  });
  assert.equal(result.outcome, 'invalid');

  const entries = listWork(storeDir).decisionsById['item-x'];
  assert.equal(entries.length, 1);
  assert.match(entries[0].text, /invalid/);
  assert.match(entries[0].rationale, /Caller-supplied verdict không hợp lệ/);
});

test('resolvePlan logs a decisionsById entry on a caller-supplied need-human verdict, using the caller\'s reason', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  resolvePlan(storeDir, 'item-x', cfg, 'runner', { verdict: 'need-human', reason: 'Scope unclear across two services' });

  const entries = listWork(storeDir).decisionsById['item-x'];
  const needHumanEntry = entries.find((e) => e.text.startsWith('decompose verdict:'));
  assert.match(needHumanEntry.text, /need-human/);
  assert.equal(needHumanEntry.rationale, 'Scope unclear across two services');
});

test('resolvePlan logs a decisionsById entry on a caller-supplied pass-through verdict, using the caller\'s reason when supplied', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  resolvePlan(storeDir, 'item-x', cfg, 'runner', { verdict: 'pass-through', reason: 'Single cohesive change' });

  const entries = listWork(storeDir).decisionsById['item-x'];
  const passThroughEntry = entries.find((e) => e.text.startsWith('decompose verdict:'));
  assert.match(passThroughEntry.text, /pass-through/);
  assert.equal(passThroughEntry.rationale, 'Single cohesive change');
});

test('resolvePlan logs a fixed fallback rationale on a caller-supplied pass-through verdict with no reason', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  resolvePlan(storeDir, 'item-x', cfg, 'runner', { verdict: 'pass-through' });

  const entries = listWork(storeDir).decisionsById['item-x'];
  const passThroughEntry = entries.find((e) => e.text.startsWith('decompose verdict:'));
  assert.ok(passThroughEntry.rationale.length > 0);
});

test('resolvePlan logs a decisionsById entry on a caller-supplied decompose verdict, including the child count', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  resolvePlan(storeDir, 'item-x', cfg, 'runner', {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser', action: 'x' },
      { title: 'Build renderer', verify: 'npm test -- renderer', action: 'x' },
    ],
  });

  const entries = listWork(storeDir).decisionsById['item-x'];
  const decomposeEntry = entries.find((e) => /decompose/.test(e.text) && /children/.test(e.text));
  assert.match(decomposeEntry.text, /2 children/);
  assert.equal(decomposeEntry.rationale, 'Two independent surfaces, no shared state');
});

// --- decompose-side skip-and-advance + real verify (tsk-19j D1/D3/D7):
// resolvePlan skips requiring a verdict entirely ONLY when plan.md's
// own recorded mode is tiny/small (single-piece by fgos-planning's mode
// gate, so there is nothing to decide). Any other mode, or no locked
// plan.md at all, now falls through to D16's no-op/refuse branch instead
// of a subprocess judge call. Every advance to executing still prefers
// gates[id].planApprove.verify over the item's existing verify when a
// Track A approve record exists.

function mkPlanFixture(storeDir, planContent) {
  const repoRoot = path.dirname(storeDir);
  const featureDir = fs.mkdtempSync(path.join(repoRoot, 'fgos-plan-'));
  fs.writeFileSync(path.join(featureDir, 'CONTEXT.md'), '# CONTEXT\n\nD1: locked.\n');
  fs.writeFileSync(path.join(featureDir, 'plan.md'), planContent);
  return path.basename(featureDir);
}

function mkContextFixture(storeDir, contextContent) {
  const repoRoot = path.dirname(storeDir);
  const featureDir = fs.mkdtempSync(path.join(repoRoot, 'fgos-ctx-'));
  fs.writeFileSync(path.join(featureDir, 'CONTEXT.md'), contextContent);
  return { docsRef: path.basename(featureDir), featureDir };
}

test('resolvePlan skips requiring a verdict and advances straight to executing when plan.md declares mode "tiny"', () => {
  const storeDir = tmpStoreDir();
  const docsRef = mkPlanFixture(storeDir, '# plan\n\nmode = **tiny** (1 file, direct task).\n');
  addWork(storeDir, sampleWork({ docsRef }));
  recordGateApprove(storeDir, { id: 'item-x', gate: 'planApprove', actor: 'human', verify: 'npm test -- tiny-item' });

  const result = resolvePlan(storeDir, 'item-x', cfg, 'session');
  assert.equal(result.outcome, 'pass-through');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'executing');
  assert.equal(view.work['item-x'].verify, 'npm test -- tiny-item');
  assert.equal(Object.values(view.work).some((item) => item.parent === 'item-x'), false, 'no children ever get written on the skip path');
  const decisions = view.decisionsById?.['item-x'] ?? [];
  assert.ok(decisions.some((d) => d.text.startsWith('decompose skip:')), 'skip must log an audit-trail decision');
});

test('resolvePlan skips for mode "small" too, falling back to the item\'s own verify when no planApprove record exists', () => {
  const storeDir = tmpStoreDir();
  const docsRef = mkPlanFixture(storeDir, '# plan\n\nMode: small — a few files, no gray areas.\n');
  addWork(storeDir, sampleWork({ docsRef }));

  const result = resolvePlan(storeDir, 'item-x', cfg, 'session');
  assert.equal(result.outcome, 'pass-through');
  assert.equal(listWork(storeDir).work['item-x'].verify, 'npm test -- reporting', 'unchanged from sampleWork\'s own verify — no planApprove to prefer');
});

test('resolvePlan never skips past mode "standard"/"high-risk" — role "session" refuses, role "runner" no-ops (D16, skip never applies past tiny/small)', () => {
  for (const mode of ['standard', 'high-risk']) {
    const storeDir = tmpStoreDir();
    const docsRef = mkPlanFixture(storeDir, `# plan\n\nmode = **${mode}**.\n`);
    addWork(storeDir, sampleWork({ docsRef }));

    assert.throws(() => resolvePlan(storeDir, 'item-x', cfg, 'session'), StoreError, `mode "${mode}" must still require a verdict for role session`);

    const runnerResult = resolvePlan(storeDir, 'item-x', cfg, 'runner');
    assert.equal(runnerResult.outcome, 'noop', `mode "${mode}" must no-op for role runner, never guess`);
  }
});

test('resolvePlan never skips when no plan.md is locked at all (unchanged: docsRef pointing nowhere real behaves like no docsRef)', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ docsRef: 'docs/history/never-written/' }));

  assert.throws(() => resolvePlan(storeDir, 'item-x', cfg, 'session'), StoreError);
  assert.equal(resolvePlan(storeDir, 'item-x', cfg, 'runner').outcome, 'noop');
});

test('resolvePlan real caller-supplied pass-through path still prefers gates[id].planApprove.verify when present, even for mode "standard"', () => {
  const storeDir = tmpStoreDir();
  const docsRef = mkPlanFixture(storeDir, '# plan\n\nmode = **standard** (real judgment needed).\n');
  addWork(storeDir, sampleWork({ docsRef }));
  recordGateApprove(storeDir, { id: 'item-x', gate: 'planApprove', actor: 'human', verify: 'node --test test/real-standard-item.test.mjs' });

  const result = resolvePlan(storeDir, 'item-x', cfg, 'session', { verdict: 'pass-through', reason: 'simple enough' });
  assert.equal(result.outcome, 'pass-through');
  assert.equal(listWork(storeDir).work['item-x'].verify, 'node --test test/real-standard-item.test.mjs');
});

// --- resolveContentRoot (tsk-1ni D1): mkPlanFixture above builds its
// content as a sibling of storeDir, so repoRoot == content-root by
// construction. These two tests cover the other two resolution branches
// explicitly, with a REAL git repo/worktree instead of a coincidental
// sibling directory. ---

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

test('resolvePlan skips (advances via trust signal) when plan.md is only reachable via process.cwd() (D1 branch 1, real end-to-end)', () => {
  const { storeDir } = initTempGitRepoWithStore();

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
    result = resolvePlan(storeDir, 'item-x', cfg, 'session');
  } finally {
    process.chdir(originalCwd);
  }

  assert.equal(result.outcome, 'pass-through');
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

test('resolvePlan skips when plan.md is only reachable via a real registered worktree (D1 branch 2, real end-to-end)', () => {
  const { repoRoot, storeDir } = initTempGitRepoWithStore();

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
    result = resolvePlan(storeDir, 'item-x', cfg, 'session');
  } finally {
    process.chdir(originalCwd);
  }

  assert.equal(result.outcome, 'pass-through');
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

// --- caller-supplied verdict (tsk-27y D1/D2/D3): resolvePlan skips
// requiring a verdict entirely when a caller (e.g. a live fgos-planning
// session) passes its own already-rendered verdict, checked BEFORE the
// plan.md tiny/small mode skip-and-advance heuristic. Downstream safety
// gates (heavy-risk/blast-radius/footprint-overlap) still apply
// unconditionally. ---

test('resolvePlan advances to executing on a caller-supplied pass-through verdict even with no locked plan.md at all', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolvePlan(storeDir, 'item-x', cfg, 'session', { verdict: 'pass-through', reason: 'single-piece, no split needed' });
  assert.equal(result.outcome, 'pass-through');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'executing');
  const decisions = view.decisionsById?.['item-x'] ?? [];
  assert.ok(decisions.some((d) => d.text.startsWith('decompose caller-supplied:')), 'caller-supplied path must log a distinct audit-trail decision');
});

test('resolvePlan parks in awaiting-human on a caller-supplied need-human verdict, with the caller-supplied reason', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolvePlan(storeDir, 'item-x', cfg, 'session', { verdict: 'need-human', reason: 'Which auth provider should the split assume?' });
  assert.equal(result.outcome, 'need-human');

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].status, 'awaiting-human');
  assert.match(view.gates['item-x'].ask, /Which auth provider should the split assume\?/);
});

test('resolvePlan writes real children on a caller-supplied decompose verdict, same shape as any other decompose write', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolvePlan(storeDir, 'item-x', cfg, 'session', {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser', action: 'x' },
      { title: 'Build renderer', verify: 'npm test -- renderer', action: 'x' },
    ],
  });
  assert.equal(result.outcome, 'decompose');
  assert.deepEqual(result.childIds, ['item-x-1', 'item-x-2']);

  const view = listWork(storeDir);
  assert.equal(view.work['item-x'].stage, 'executing');
  assert.equal(view.work['item-x-1'].title, 'Build parser');
  assert.equal(view.work['item-x-1'].verify, 'npm test -- parser');
  assert.equal(view.work['item-x-1'].parent, 'item-x');
  assert.equal(view.work['item-x-2'].title, 'Build renderer');
});

test('resolvePlan still gates a caller-supplied decompose verdict to awaiting-human on overlapping footprint (D3 — gates apply regardless of verdict origin)', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork());

  const result = resolvePlan(storeDir, 'item-x', cfg, 'session', {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser', action: 'x', footprint: ['src/parser.mjs', 'src/shared.mjs'] },
      { title: 'Build renderer', verify: 'npm test -- renderer', action: 'x', footprint: ['src/shared.mjs', 'src/renderer.mjs'] },
    ],
  });
  assert.equal(result.outcome, 'need-human');

  const view = listWork(storeDir);
  assert.match(view.gates['item-x'].ask, /src\/shared\.mjs/);
  assert.equal(Object.values(view.work).filter((item) => item.parent === 'item-x').length, 0);
});

test('resolvePlan still routes a caller-supplied verdict through the heavy-risk gate (D3 — gates apply regardless of verdict origin)', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ risk: 'heavy' }));

  const result = resolvePlan(storeDir, 'item-x', cfg, 'session', { verdict: 'pass-through', reason: 'single-piece' });
  assert.equal(result.outcome, 'need-human');
  assert.match(listWork(storeDir).gates['item-x'].ask, /risk cao \(heavy\)/);
});

test('resolvePlan caller-supplied verdict takes precedence over the plan.md tiny/small mode skip-and-advance heuristic (D2)', () => {
  const storeDir = tmpStoreDir();
  const docsRef = mkPlanFixture(storeDir, '# plan\n\nmode = **tiny** (1 file, direct task).\n');
  addWork(storeDir, sampleWork({ docsRef }));

  const result = resolvePlan(storeDir, 'item-x', cfg, 'session', { verdict: 'pass-through', reason: 'caller already decided' });
  assert.equal(result.outcome, 'pass-through');

  const view = listWork(storeDir);
  const decisions = view.decisionsById?.['item-x'] ?? [];
  assert.ok(decisions.some((d) => d.text.startsWith('decompose caller-supplied:')));
  assert.ok(!decisions.some((d) => d.text.startsWith('decompose skip:')), 'the plan.md mode skip-and-advance path must never fire when a caller verdict is present');
});

// --- tsk-1gr D1/D2 (docs/history/decompose-locked-decision-footprint-
// coverage/CONTEXT.md): findUncoveredLockedDecisions -- mechanical
// path-token check over CONTEXT.md's own "## Locked decisions" section,
// advisory only, never blocks. Pure function, entirely unaffected by the
// judge retirement. ---

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

// --- tsk-gio fixes (independent review, post-tsk-1gr): dotfile tokens,
// directory-shaped footprint coverage, advisory fail-safe. ---

test('findUncoveredLockedDecisions: a root dotfile keeps its leading dot and is checked at the real path (tsk-gio regression, the tsk-2ta case)', () => {
  const repoRoot = mkTempDir();
  fs.writeFileSync(path.join(repoRoot, '.fgos-runner.json'), '{}\n');
  const contextText = '## Locked decisions\n\nD1 amended: move `.fgos-runner.json` to `.fgos/config.json`.\n';
  const uncovered = findUncoveredLockedDecisions(contextText, [{ footprint: ['src/other.mjs'] }], repoRoot);
  assert.deepEqual(uncovered, ['.fgos-runner.json']);
});

test('findUncoveredLockedDecisions: a dotfile IS covered when a child footprint declares it with its leading dot', () => {
  const repoRoot = mkTempDir();
  fs.writeFileSync(path.join(repoRoot, '.fgos-runner.json'), '{}\n');
  const contextText = '## Locked decisions\n\nD1: move `.fgos-runner.json`.\n';
  const uncovered = findUncoveredLockedDecisions(contextText, [{ footprint: ['.fgos-runner.json'] }], repoRoot);
  assert.deepEqual(uncovered, []);
});

test('findUncoveredLockedDecisions: a directory-shaped footprint entry covers every real path underneath it (tsk-gio fix)', () => {
  const repoRoot = mkTempDir();
  fs.mkdirSync(path.join(repoRoot, 'src', 'intake'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'src', 'intake', 'decompose.mjs'), '// fixture\n');
  const contextText = '## Locked decisions\n\nD1: touches `src/intake/decompose.mjs`.\n';
  const uncovered = findUncoveredLockedDecisions(contextText, [{ footprint: ['src/'] }], repoRoot);
  assert.deepEqual(uncovered, [], 'a "src/" footprint entry must cover a path nested inside it');
});

test('findUncoveredLockedDecisions: directory-shaped coverage requires a real "/" boundary, never a bare prefix match', () => {
  const repoRoot = mkTempDir();
  fs.mkdirSync(path.join(repoRoot, 'src-extra'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'src-extra', 'file.mjs'), '// fixture\n');
  const contextText = '## Locked decisions\n\nD1: touches `src-extra/file.mjs`.\n';
  const uncovered = findUncoveredLockedDecisions(contextText, [{ footprint: ['src'] }], repoRoot);
  assert.deepEqual(uncovered, ['src-extra/file.mjs'], '"src" must never prefix-match "src-extra/..." without a "/" boundary');
});

// --- tsk-297 (post-tsk-gio independent review): a non-string footprint
// entry must never crash, and directory-shaped DECISION paths must be
// covered by a file-shaped child footprint nested inside them. ---

test('findUncoveredLockedDecisions: a non-string footprint entry (e.g. null) is skipped, never thrown on', () => {
  const repoRoot = mkTempDir();
  fs.writeFileSync(path.join(repoRoot, 'important.mjs'), '// fixture\n');
  const contextText = '## Locked decisions\n\nD1: touches `important.mjs`.\n';
  assert.doesNotThrow(() => {
    const uncovered = findUncoveredLockedDecisions(contextText, [{ footprint: [null, 'other.mjs'] }], repoRoot);
    assert.deepEqual(uncovered, ['important.mjs'], 'neither the ignored null nor the unrelated other.mjs covers this decision');
  });
});

test('findUncoveredLockedDecisions: a locked decision naming a DIRECTORY is covered by a child footprint naming a file inside it (mirror of the footprint-side directory fix)', () => {
  const repoRoot = mkTempDir();
  fs.mkdirSync(path.join(repoRoot, 'src', 'intake'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'src', 'intake', 'decompose.mjs'), '// fixture\n');
  const contextText = '## Locked decisions\n\nD1: touches `src/intake/`.\n';
  const uncovered = findUncoveredLockedDecisions(contextText, [{ footprint: ['src/intake/decompose.mjs'] }], repoRoot);
  assert.deepEqual(uncovered, [], 'a decision naming the enclosing directory must be covered by a file footprint nested inside it');
});

test('findUncoveredLockedDecisions: directory-decision coverage also requires a real "/" boundary, never a bare prefix match', () => {
  const repoRoot = mkTempDir();
  fs.mkdirSync(path.join(repoRoot, 'abc', 'xyz'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'abc', 'xyz', 'file.mjs'), '// fixture\n');
  const contextText = '## Locked decisions\n\nD1: touches `abc/xyz/`.\n';
  const uncovered = findUncoveredLockedDecisions(contextText, [{ footprint: ['abc/xyz-extra/file.mjs'] }], repoRoot);
  assert.deepEqual(uncovered, ['abc/xyz/'], '"abc/xyz-extra/file.mjs" must never boundary-match "abc/xyz/" as if it were nested inside it');
});

test('resolvePlan caller-supplied decompose verdict: an uncovered locked-decision path logs an advisory decision but still writes children (D1 — never blocks)', () => {
  const storeDir = tmpStoreDir();
  const { docsRef } = mkContextFixture(storeDir, '## Locked decisions\n\nD1: placeholder — filled below.\n');
  const fixtureRelPath = `${docsRef}.mjs`;
  fs.writeFileSync(path.join(path.dirname(storeDir), fixtureRelPath), '// fixture\n');
  fs.writeFileSync(
    path.join(path.dirname(storeDir), docsRef, 'CONTEXT.md'),
    `## Locked decisions\n\nD1: canonical output lives at \`${fixtureRelPath}\`.\n`,
  );
  addWork(storeDir, sampleWork({ docsRef }));

  const result = resolvePlan(storeDir, 'item-x', cfg, 'session', {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [
      { title: 'Build parser', verify: 'npm test -- parser', action: 'D1: canonical output per parent CONTEXT.md.', footprint: ['src/parser.mjs'] },
      { title: 'Build renderer', verify: 'npm test -- renderer', action: 'D1: canonical output per parent CONTEXT.md.', footprint: ['src/renderer.mjs'] },
    ],
  });
  assert.equal(result.outcome, 'decompose', 'the advisory must never block the real decompose write');

  const view = listWork(storeDir);
  assert.equal(Object.values(view.work).filter((item) => item.parent === 'item-x').length, 2, 'children are still written despite the coverage gap');
  const decisions = view.decisionsById?.['item-x'] ?? [];
  assert.ok(
    decisions.some((d) => d.text.includes('completeness advisory') && d.text.includes(fixtureRelPath)),
    'the coverage gap must be logged as its own decision',
  );
});

test('resolvePlan caller-supplied decompose verdict: a child footprint that covers the locked-decision path logs no advisory', () => {
  const storeDir = tmpStoreDir();
  const { docsRef } = mkContextFixture(storeDir, '## Locked decisions\n\nD1: placeholder — filled below.\n');
  const fixtureRelPath = `${docsRef}.mjs`;
  fs.writeFileSync(path.join(path.dirname(storeDir), fixtureRelPath), '// fixture\n');
  fs.writeFileSync(
    path.join(path.dirname(storeDir), docsRef, 'CONTEXT.md'),
    `## Locked decisions\n\nD1: canonical output lives at \`${fixtureRelPath}\`.\n`,
  );
  addWork(storeDir, sampleWork({ docsRef }));

  const result = resolvePlan(storeDir, 'item-x', cfg, 'session', {
    verdict: 'decompose',
    reason: 'Two independent surfaces, no shared state',
    children: [{ title: 'Build parser', verify: 'npm test -- parser', action: 'D1: canonical output per parent CONTEXT.md.', footprint: [fixtureRelPath] }],
  });
  assert.equal(result.outcome, 'decompose');

  const view = listWork(storeDir);
  const decisions = view.decisionsById?.['item-x'] ?? [];
  assert.ok(!decisions.some((d) => d.text.includes('completeness advisory')), 'a covered path must never be reported');
});
