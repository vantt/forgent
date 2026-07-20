// test/state/store.test.mjs — câu-6 tự động (Phase 3 S3-closeout (c)):
// moveWork composes a learning record MECHANICALLY the moment an item
// reaches `done` via EITHER entry door (doing->done, proposed->done — both
// converge on this one moveWork call), from data the view already folded
// for the item (outcome/friction/settlement channels). No model call, no
// second write door (per this cell's must_haves).
//
// Store is otherwise tested through the CLI (see test/state/awaiting.test.mjs
// — "There is no store.test.mjs"); this file exists because asserting the
// exact composed learning content is cheaper directly against moveWork's
// returned `view` than round-tripping through the CLI's stdout formatting.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { addWork, editWork, moveWork, moveStage, addOutcome, addFriction, listWork, readRawEvents } from '../../src/state/store.mjs';

const STORE_MJS = path.resolve(fileURLToPath(import.meta.url), '../../../src/state/store.mjs');

// Every test gets its own mkdtemp dir — never touch the repo's .fgos/.
function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-store-learning-'));
}

// Spawns N real child OS processes that all call `storeCall` (a snippet of
// source referencing `dir`/`id`, run inside the child) at a synchronized
// start instant, so their read-check-append windows genuinely overlap —
// mirrors test/state/events.test.mjs's cross-process race technique
// (in-process concurrency can never expose this: one event loop serializes
// calls for free). Each child reports its outcome over the fork IPC channel
// before exiting.
async function raceAcrossProcesses(dir, storeCall, nProcesses) {
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-store-race-'));
  const childScript = `
import { addWork, editWork, moveWork, moveStage, StoreError, FsmError } from ${JSON.stringify(STORE_MJS)};
const dir = process.argv[2];
const startAt = Number(process.argv[3]);
const waitMs = startAt - Date.now();
if (waitMs > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, waitMs);
try {
  ${storeCall}
  process.send({ ok: true });
} catch (err) {
  process.send({ ok: false, category: err.category, message: err.message });
}
`;
  const childPath = path.join(workDir, 'race-child.mjs');
  fs.writeFileSync(childPath, childScript);

  const startAt = Date.now() + 300;
  const results = await Promise.all(
    Array.from({ length: nProcesses }, () =>
      new Promise((resolve, reject) => {
        const child = fork(childPath, [dir, String(startAt)], { stdio: 'inherit' });
        let message = null;
        child.on('message', (msg) => {
          message = msg;
        });
        child.on('exit', (code) => {
          if (!message) return reject(new Error(`child exited (code ${code}) without reporting an outcome`));
          resolve(message);
        });
      }),
    ),
  );

  fs.rmSync(workDir, { recursive: true, force: true });
  return results;
}

function addSampleWork(dir, id, overrides = {}) {
  addWork(dir, {
    id,
    title: `Title ${id}`,
    kind: 'task',
    status: 'todo',
    deps: [],
    risk: 'low',
    refs: [],
    verify: 'npm test',
    ...overrides,
  });
}

test('moveWork doing->done composes a learning record reflecting the item\'s actual outcome, friction (by layer), and settlement (by kind/actor)', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'learn-doing');
  moveWork(dir, { id: 'learn-doing', to: 'doing', expectedStatus: 'todo' });

  addOutcome(dir, { id: 'learn-doing', predicted: { tier: 'standard', deps: 0, priorVisits: 0 } });
  addOutcome(dir, {
    id: 'learn-doing',
    actual: { outcome: 'pass', passed: true, attempts: 2, errorClass: null, aheadCount: 0, visits: 1 },
  });
  addFriction(dir, {
    id: 'learn-doing',
    disposition: 'parked',
    errorClass: 'verify-miss',
    layer: 'verification',
    attempts: 1,
    detail: 'first miss',
  });

  // A coding item must pass through the compound-learn stage before it can
  // close (D3) — advance the stage before the doing->done move the learning
  // record is asserted on.
  moveStage(dir, { id: 'learn-doing', to: 'compound-learn' });
  const { view } = moveWork(dir, { id: 'learn-doing', to: 'done', expectedStatus: 'doing', actor: 'human' });

  assert.ok(view.learnings, 'learnings key must exist once an item has closed');
  const records = view.learnings['learn-doing'];
  assert.equal(records.length, 1);
  const record = records[0];
  assert.deepEqual(record.outcome, { disposition: 'pass', attempts: 2, errorClass: null });
  assert.deepEqual(record.frictions, { verification: 1 });
  assert.deepEqual(record.settlements, { 'close/human': 1 });
  assert.equal(typeof record.ts, 'string');
});

test('moveWork proposed->done (the SECOND door into done) also composes a learning record — not only doing->done', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'learn-proposed');
  moveWork(dir, { id: 'learn-proposed', to: 'doing', expectedStatus: 'todo' });
  moveWork(dir, { id: 'learn-proposed', to: 'proposed', expectedStatus: 'doing' });

  // Pass through compound-learn before the proposed->done close (D3).
  moveStage(dir, { id: 'learn-proposed', to: 'compound-learn' });
  const { view } = moveWork(dir, { id: 'learn-proposed', to: 'done', expectedStatus: 'proposed', actor: 'human' });

  assert.ok(view.learnings?.['learn-proposed'], 'proposed->done must also produce a learning record');
  assert.equal(view.learnings['learn-proposed'].length, 1);
  assert.deepEqual(view.learnings['learn-proposed'][0].settlements, { 'close/human': 1 });
});

test('moveWork to done for an item with no outcome and no friction still produces a minimal (not skipped) learning record', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'learn-empty');
  moveWork(dir, { id: 'learn-empty', to: 'doing', expectedStatus: 'todo' });

  // Pass through compound-learn before the doing->done close (D3).
  moveStage(dir, { id: 'learn-empty', to: 'compound-learn' });
  const { view } = moveWork(dir, { id: 'learn-empty', to: 'done', expectedStatus: 'doing', actor: 'human' });

  const record = view.learnings['learn-empty'][0];
  assert.equal(record.outcome, null, 'no outcome recorded -> null, never fabricated');
  assert.deepEqual(record.frictions, {}, 'no friction -> empty group, not omitted');
  // The close transition itself IS a settlement (per phase-3-compound-learning-5)
  // — it is never possible for `settlements` to be empty on a learning
  // record, since reaching `done` always settles at least the close.
  assert.deepEqual(record.settlements, { 'close/human': 1 });
});

test('the learning record rides the SAME work.move event that closes the item — single write door, no extra event, no extra file, and rebuild is deterministic', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'learn-rebuild');
  moveWork(dir, { id: 'learn-rebuild', to: 'doing', expectedStatus: 'todo' });
  // Pass through compound-learn before the close (D3); snapshot the log AFTER
  // this so the assertion below still proves the CLOSE itself appends exactly
  // one event (the stage move is a separate, earlier lifecycle step).
  moveStage(dir, { id: 'learn-rebuild', to: 'compound-learn' });

  const logPath = path.join(dir, 'events.jsonl');
  const filesBefore = fs.readdirSync(dir).sort();
  const eventsBefore = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean).length;

  const { event } = moveWork(dir, { id: 'learn-rebuild', to: 'done', expectedStatus: 'doing', actor: 'human' });

  const filesAfter = fs.readdirSync(dir).sort();
  assert.deepEqual(filesAfter, filesBefore, 'no new file appears — the learning record rides the events.jsonl append that already happens');

  const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
  assert.equal(lines.length, eventsBefore + 1, 'exactly ONE event appended for the close — not two');
  const types = lines.map((l) => JSON.parse(l).type);
  assert.deepEqual(types, ['work.add', 'work.move', 'work.stage', 'work.move']);
  assert.equal(event.type, 'work.move');
  assert.ok(event.payload.learning, 'the returned move event itself carries the learning field');

  const rebuiltOnce = listWork(dir);
  const rebuiltTwice = listWork(dir);
  assert.deepEqual(rebuiltTwice, rebuiltOnce, 'rebuilding the same log twice must be deep-equal (determinism)');
});

// --- branch-source take/return write-side stamp (human-rounds D2) ---------
//
// moveWork's destructure is a FIXED field list (never a `...rest` spread,
// per the fold-allowlist critical pattern) — a caller passing a new field
// that this facade does not also destructure gets it silently dropped
// before the event is ever appended. This asserts the write side directly
// (the exact gap a reviewer caught during validating): branchHeadAtTake/
// branchHeadAtReturn must land on the appended event's own payload, not
// only on replay.mjs's later fold.

test('moveWork stamps branchHeadAtTake onto the appended event payload for a blocked -> doing move that carries it', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'branch-take', { status: 'blocked' });

  const { event } = moveWork(dir, { id: 'branch-take', to: 'doing', expectedStatus: 'blocked', actor: 'human', branchHeadAtTake: 'branch-deadbeef' });

  assert.equal(event.payload.branchHeadAtTake, 'branch-deadbeef');
  assert.equal('headAtTake' in event.payload, false, 'a branch take never also stamps the main-based headAtTake');
});

test('moveWork stamps branchHeadAtReturn onto the appended event payload for a doing -> proposed move that carries it, never headAtReturn', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'branch-return', { status: 'blocked' });
  moveWork(dir, { id: 'branch-return', to: 'doing', expectedStatus: 'blocked', actor: 'human', branchHeadAtTake: 'branch-deadbeef' });

  const { event } = moveWork(dir, { id: 'branch-return', to: 'proposed', expectedStatus: 'doing', branchHeadAtReturn: 'branch-c0ffee' });

  assert.equal(event.payload.branchHeadAtReturn, 'branch-c0ffee');
  assert.equal('headAtReturn' in event.payload, false, 'a branch return never also stamps the main-based headAtReturn (D2 CẤM)');
});

test('moveWork omits branchHeadAtTake/branchHeadAtReturn entirely from the event payload when the caller never supplies them (byte-identical to the pre-D2 shape)', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'branch-absent');

  const { event } = moveWork(dir, { id: 'branch-absent', to: 'doing', expectedStatus: 'todo', actor: 'human', headAtTake: 'main-deadbeef' });

  assert.equal('branchHeadAtTake' in event.payload, false);
  assert.equal('branchHeadAtReturn' in event.payload, false);
});

// --- Diataxis docType tag on outcome/friction capture (CONTEXT D5/D6) -----
//
// docType is an OPTIONAL, additive axis on the compound-learn capture
// payload — orthogonal to the engineer type-axis these events already
// carry. Absent/null must always stay valid (untagged); present, it must be
// one of exactly the four Diataxis quadrants. The load-bearing assertion is
// replay survival: the field must ride the existing spread-fold with zero
// change to replay.mjs, so a rebuild (a fresh `listWork`, not just the
// call's own returned view) still carries it.

const DIATAXIS_QUADRANTS = ['tutorial', 'how-to', 'reference', 'explanation'];

test('addOutcome accepts a docType tag of any of the four Diataxis quadrants', () => {
  const dir = tmpDir();
  for (const docType of DIATAXIS_QUADRANTS) {
    addSampleWork(dir, `outcome-doctype-${docType}`);
    const { view } = addOutcome(dir, { id: `outcome-doctype-${docType}`, docType, predicted: { tier: 'standard', deps: 0, priorVisits: 0 } });
    assert.equal(view.outcomes[`outcome-doctype-${docType}`].docType, docType);
  }
});

test('addFriction accepts a docType tag of any of the four Diataxis quadrants', () => {
  const dir = tmpDir();
  for (const docType of DIATAXIS_QUADRANTS) {
    addSampleWork(dir, `friction-doctype-${docType}`);
    const { view } = addFriction(dir, { id: `friction-doctype-${docType}`, docType, disposition: 'parked', errorClass: 'verify-miss', layer: 'verification', attempts: 1, detail: 'x' });
    const records = view.frictions[`friction-doctype-${docType}`];
    assert.equal(records[records.length - 1].docType, docType);
  }
});

test('addOutcome and addFriction stay valid when docType is absent or explicitly null (untagged, per D6)', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'outcome-untagged');
  addSampleWork(dir, 'friction-untagged');

  const { view: v1 } = addOutcome(dir, { id: 'outcome-untagged', predicted: { tier: 'standard', deps: 0, priorVisits: 0 } });
  assert.equal('docType' in v1.outcomes['outcome-untagged'], false, 'absent docType is never fabricated onto the folded record');

  const { view: v2 } = addOutcome(dir, { id: 'outcome-untagged', docType: null, actual: { outcome: 'pass', passed: true, attempts: 1, errorClass: null, aheadCount: 0, visits: 1 } });
  assert.equal(v2.outcomes['outcome-untagged'].docType, null, 'an explicit null is accepted and folds through as null');

  const { view: v3 } = addFriction(dir, { id: 'friction-untagged', disposition: 'parked', errorClass: 'verify-miss', layer: 'verification', attempts: 1, detail: 'x' });
  assert.equal('docType' in v3.frictions['friction-untagged'][0], false);

  const { view: v4 } = addFriction(dir, { id: 'friction-untagged', docType: null, disposition: 'halted', errorClass: 'worker-timeout', layer: 'environment', attempts: 1, detail: 'y' });
  assert.equal(v4.frictions['friction-untagged'][1].docType, null);
});

test('addOutcome and addFriction reject a docType outside the four Diataxis quadrants — non-quadrant string, empty/whitespace, and non-string', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'outcome-bad-doctype');
  addSampleWork(dir, 'friction-bad-doctype');

  const badValues = ['pattern', '', '   ', 42, true, {}];
  for (const docType of badValues) {
    assert.throws(
      () => addOutcome(dir, { id: 'outcome-bad-doctype', docType, predicted: { tier: 'standard', deps: 0, priorVisits: 0 } }),
      /docType.*must be one of/,
    );
    assert.throws(
      () => addFriction(dir, { id: 'friction-bad-doctype', docType, disposition: 'parked', errorClass: 'verify-miss', layer: 'verification', attempts: 1, detail: 'x' }),
      /docType.*must be one of/,
    );
  }
  // Neither rejected call left a partial event behind.
  assert.equal(listWork(dir).outcomes?.['outcome-bad-doctype'], undefined);
  assert.equal(listWork(dir).frictions?.['friction-bad-doctype'], undefined);
});

test('a docType-tagged outcome AND friction survive an independent rebuild of the view from the log (load-bearing D6 proof: zero replay.mjs mechanism change)', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'replay-survival');

  addOutcome(dir, { id: 'replay-survival', docType: 'how-to', predicted: { tier: 'standard', deps: 0, priorVisits: 0 } });
  addFriction(dir, { id: 'replay-survival', docType: 'reference', disposition: 'parked', errorClass: 'verify-miss', layer: 'verification', attempts: 1, detail: 'x' });

  // A fresh, independent rebuild from the on-disk log — not the write call's
  // own returned view — is the actual replay-survival proof.
  const rebuilt = listWork(dir);
  assert.equal(rebuilt.outcomes['replay-survival'].docType, 'how-to', 'tagged outcome retains docType after rebuild');
  assert.equal(rebuilt.frictions['replay-survival'][0].docType, 'reference', 'tagged friction retains docType after rebuild');
});

// --- cycle guard at the write door (work-graph-intelligence S1) -----------
//
// dep-graph.mjs's findDepCycle/assertNoCycle are unit-tested directly in
// test/state/dep-graph.test.mjs; these cases assert the guard is actually
// WIRED into addWork/editWork — the single write door — not just present as
// an unused import. `editWork` closes a live gap: before this cell, a patch
// introducing an A<->B cycle through `deps` (deps is in EDITABLE_FIELDS)
// passed straight through, since validateDeps only checks existence.

// A genuine multi-node cycle can never actually reach assertNoCycle's check
// from addWork's site: every dep on a NEW item must already exist (the
// existence check), and nothing existing can already depend (even
// transitively) on an id that is only being created right now — induction
// on write order. The only shape addWork could ever hand assertNoCycle a
// cycle for is a self-loop, and that is already rejected earlier in the same
// validateWork() call (validateWorkShape's self-reference check) before
// assertNoCycle ever runs. This asserts addWork's guard is wired at the
// call site (matching the must_haves key_link) without asserting an
// unreachable multi-node scenario; the real, reachable gap this cell closes
// is editWork's (covered by the tests below), which patches deps onto an
// item that already has neighbors.
test('addWork still rejects a self-loop (defense-in-depth: caught by shape validation before the cycle guard runs, and the guard is wired at the same site regardless)', () => {
  const dir = tmpDir();
  assert.throws(
    () => addWork(dir, { id: 'self-loop', title: 'Self Loop', kind: 'task', status: 'todo', deps: ['self-loop'], risk: 'low', refs: [], verify: 'npm test' }),
    /cannot list itself as a dep/,
  );
  assert.equal(listWork(dir).work['self-loop'], undefined);
});

test('addWork accepts a forward-only chain built up one item at a time — no false positive from the new guard', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'cyc-a', { deps: [] });
  addSampleWork(dir, 'cyc-b', { deps: ['cyc-a'] });
  addWork(dir, { id: 'cyc-c', title: 'Cyc C', kind: 'task', status: 'todo', deps: ['cyc-b'], risk: 'low', refs: [], verify: 'npm test' });
  assert.ok(listWork(dir).work['cyc-c']);
});

test('a direct 2-node A<->B cycle is rejected once the second half is written — via addWork then editWork', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'cyc-x', { deps: [] });
  // cyc-x has no deps yet, so cyc-y -> cyc-x is a plain forward edge, not a cycle: accepted.
  addWork(dir, { id: 'cyc-y', title: 'Cyc Y', kind: 'task', status: 'todo', deps: ['cyc-x'], risk: 'low', refs: [], verify: 'npm test' });
  assert.ok(listWork(dir).work['cyc-y']);

  // now closing it the other way (cyc-x -> cyc-y) would form A<->B: rejected.
  assert.throws(
    () => editWork(dir, { id: 'cyc-x', patch: { deps: ['cyc-y'] } }),
    /would close a dependency cycle/,
  );
});

test('editWork patch introducing an A<->B cycle is rejected — the live gap this cell closes', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'edit-cyc-a', { deps: [] });
  addSampleWork(dir, 'edit-cyc-b', { deps: ['edit-cyc-a'] });

  assert.throws(
    () => editWork(dir, { id: 'edit-cyc-a', patch: { deps: ['edit-cyc-b'] } }),
    /would close a dependency cycle/,
  );
  // the item's deps must stay unchanged — the patch never landed
  assert.deepEqual(listWork(dir).work['edit-cyc-a'].deps, []);
});

test('a valid DAG add and a valid DAG edit are still accepted unchanged through the write door', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'dag-a', { deps: [] });
  addWork(dir, { id: 'dag-b', title: 'Dag B', kind: 'task', status: 'todo', deps: ['dag-a'], risk: 'low', refs: [], verify: 'npm test' });
  assert.ok(listWork(dir).work['dag-b']);

  addSampleWork(dir, 'dag-c', { deps: [] });
  editWork(dir, { id: 'dag-b', patch: { deps: ['dag-a', 'dag-c'] } });
  assert.deepEqual(listWork(dir).work['dag-b'].deps, ['dag-a', 'dag-c']);
});

test('a dep to an unknown id is still rejected by the existing existence check first, before the cycle guard runs', () => {
  const dir = tmpDir();
  assert.throws(
    () => addWork(dir, { id: 'ghost-dep', title: 'Ghost Dep', kind: 'task', status: 'todo', deps: ['no-such-id'], risk: 'low', refs: [], verify: 'npm test' }),
    /depends on unknown id/,
  );

  addSampleWork(dir, 'exist-a', { deps: [] });
  assert.throws(
    () => editWork(dir, { id: 'exist-a', patch: { deps: ['no-such-id'] } }),
    /depends on unknown id/,
  );
});

// --- unified cycle guard: blocks + parent-child at the write door ----------
// (work-graph-intelligence S2a, record 0012)
//
// The write door now rejects any add/edit that closes a cycle in the UNIFIED
// graph (deps projected as `blocks` edges + `parent` projected as
// `parent-child` edges), superseding the deps-only guard alone. A pure-deps
// cycle keeps its S1 "dependency cycle" message (the two cases above); a cycle
// that involves a parent-child edge reports the unified "graph cycle" message.
// Edge direction is parent -> child: a parent waits for its descendants
// (frontier.mjs `hasOpenDescendant`), so a `parent` field on child C yields
// edge parent -> C. These cycles are INVISIBLE to the deps-only guard — the
// point of the supersession.

test('a MIXED cycle (deps edge + parent-child edge) is rejected at addWork — invisible to the deps-only guard', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'mix-a', { deps: [] });
  // mix-b declares mix-a as BOTH its parent (edge mix-a -> mix-b) and a dep
  // (edge mix-b -> mix-a): the two edges close a cycle that only the unified
  // graph sees. The deps-only guard walks mix-b -> mix-a and stops (mix-a has
  // no deps back), so before S2a this add went straight through.
  assert.throws(
    () => addWork(dir, { id: 'mix-b', title: 'Mix B', kind: 'task', status: 'todo', parent: 'mix-a', deps: ['mix-a'], risk: 'low', refs: [], verify: 'npm test' }),
    /would close a graph cycle/,
  );
  assert.equal(listWork(dir).work['mix-b'], undefined, 'the rejected add never landed');
});

test('a MIXED cycle closed by an editWork patch is rejected — the parent edge exists first, the deps edit closes the loop', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'edit-mix-a', { deps: [] });
  // edit-mix-b's parent is edit-mix-a -> edge edit-mix-a -> edit-mix-b. No
  // cycle yet (a child pointing at its parent is a plain forward edge).
  addWork(dir, { id: 'edit-mix-b', title: 'Edit Mix B', kind: 'task', status: 'todo', parent: 'edit-mix-a', deps: [], risk: 'low', refs: [], verify: 'npm test' });
  assert.ok(listWork(dir).work['edit-mix-b']);

  // Patching edit-mix-b.deps = [edit-mix-a] adds edge edit-mix-b -> edit-mix-a,
  // closing edit-mix-a -> edit-mix-b -> edit-mix-a. `deps` is editable; `parent`
  // is not — the parent edge was fixed at add time. The deps-only guard misses
  // this (edit-mix-a has no deps), the unified guard catches it.
  assert.throws(
    () => editWork(dir, { id: 'edit-mix-b', patch: { deps: ['edit-mix-a'] } }),
    /would close a graph cycle/,
  );
  assert.deepEqual(listWork(dir).work['edit-mix-b'].deps, [], 'the patch never landed');
});

test('a PURE parent-child cycle is rejected — reachable TODAY via a dangling forward parent (parent ids are never existence-checked)', () => {
  const dir = tmpDir();
  // pc-a names pc-b as its parent before pc-b exists. `validateDeps` checks
  // deps existence only; nothing checks parent existence, so this dangling
  // forward parent is accepted (edge pc-b -> pc-a is recorded, walkable).
  addWork(dir, { id: 'pc-a', title: 'PC A', kind: 'task', status: 'todo', parent: 'pc-b', deps: [], risk: 'low', refs: [], verify: 'npm test' });
  assert.ok(listWork(dir).work['pc-a'], 'a dangling forward parent is allowed on add');

  // Now pc-b names pc-a as ITS parent -> edge pc-a -> pc-b, closing
  // pc-a -> pc-b -> pc-a with zero deps anywhere. Rejected at pc-b's add.
  assert.throws(
    () => addWork(dir, { id: 'pc-b', title: 'PC B', kind: 'task', status: 'todo', parent: 'pc-a', deps: [], risk: 'low', refs: [], verify: 'npm test' }),
    /would close a graph cycle/,
  );
  assert.equal(listWork(dir).work['pc-b'], undefined, 'the rejected add never landed');
});

test('a valid parent chain (no cycle) is still accepted — the unified guard has no false positive on a DAG with parent edges', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'tree-root', { deps: [] });
  addWork(dir, { id: 'tree-child', title: 'Tree Child', kind: 'task', status: 'todo', parent: 'tree-root', deps: [], risk: 'low', refs: [], verify: 'npm test' });
  addWork(dir, { id: 'tree-grandchild', title: 'Tree Grandchild', kind: 'task', status: 'todo', parent: 'tree-child', deps: [], risk: 'low', refs: [], verify: 'npm test' });
  assert.ok(listWork(dir).work['tree-grandchild'], 'a plain parent chain is a DAG, not a cycle');
});

// Cross-process regression (store-atomic-rmw): before this fix, addWork's
// "id already exists" precondition read `before` OUTSIDE any lock, so two
// OS processes racing addWork on the SAME id could each pass the stale
// check and each append a work.add event — two valid-but-conflicting events
// for one id. withEventsLock now holds the SAME events.lock appendEvent
// already used across the whole check-then-append, so the second process to
// acquire the lock re-reads with the first's event already on disk.
test('addWork under concurrent OS processes racing the SAME id: exactly one succeeds, the rest see "already exists", and the log has exactly one work.add for that id', async () => {
  const dir = tmpDir();
  const N = 6;

  const results = await raceAcrossProcesses(
    dir,
    `addWork(dir, { id: 'race-add', title: 'Race Add', kind: 'task', status: 'todo', deps: [], risk: 'low', refs: [], verify: 'npm test' });`,
    N,
  );

  const succeeded = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  assert.equal(succeeded.length, 1, `exactly one of ${N} concurrent addWork calls must win the race`);
  assert.equal(failed.length, N - 1, 'every other concurrent addWork call must fail its precondition');
  for (const r of failed) {
    assert.equal(r.category, 'validation', 'a losing addWork must fail as StoreError("validation"), not crash or hang');
    assert.match(r.message, /already exists/);
  }

  const addEvents = readRawEvents(dir).filter((e) => e.type === 'work.add' && e.payload?.id === 'race-add');
  assert.equal(addEvents.length, 1, 'the log must carry exactly one work.add event for the raced id, never two conflicting ones');
});

// Cross-process regression (store-atomic-rmw): before this fix, moveWork's
// `expectedStatus` CAS read `before` OUTSIDE any lock, so two OS processes
// racing the SAME status transition on the SAME id could each pass the
// stale CAS check and each append a work.move event. Same fix as addWork
// above: the lookup, the CAS decision, and the append now share one held
// events.lock critical section.
test('moveWork under concurrent OS processes racing the SAME expectedStatus CAS on the SAME id: exactly one succeeds, the rest conflict, and the log has exactly one matching work.move', async () => {
  const dir = tmpDir();
  addSampleWork(dir, 'race-move');
  moveWork(dir, { id: 'race-move', to: 'doing', expectedStatus: 'todo' });
  // Advance to compound-learn so the raced doing->done move is gated only by
  // the status CAS (D3) — the race is about concurrent CAS, not the stage gate.
  moveStage(dir, { id: 'race-move', to: 'compound-learn' });
  const N = 6;

  const results = await raceAcrossProcesses(
    dir,
    `moveWork(dir, { id: 'race-move', to: 'done', expectedStatus: 'doing' });`,
    N,
  );

  const succeeded = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  assert.equal(succeeded.length, 1, `exactly one of ${N} concurrent moveWork CAS calls must win the race`);
  assert.equal(failed.length, N - 1, 'every other concurrent moveWork CAS call must fail its precondition');
  for (const r of failed) {
    assert.equal(r.category, 'conflict', 'a losing moveWork must fail as FsmError("conflict"), not crash or hang');
  }

  const moveToDoneEvents = readRawEvents(dir).filter(
    (e) => e.type === 'work.move' && e.payload?.id === 'race-move' && e.payload?.to === 'done',
  );
  assert.equal(moveToDoneEvents.length, 1, 'the log must carry exactly one doing->done work.move event for the raced id');
});
