// test/state/store.test.mjs — câu-6 tự động (Phase 3 S3-closeout (c)):
// moveWork composes a learning record MECHANICALLY the moment an item
// reaches `done` via EITHER entry door (doing->done, awaiting-approval->done — both
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
import { fork, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { initStore, addWork, editWork, moveWork, moveStage, addOutcome, addFriction, addDecision, recordGateApprove, listWork, readRawEvents, setFocus, StoreError, assertPlanEvidence } from '../../src/state/store.mjs';
import { appendEvent } from '../../src/state/events.mjs';
import { REGISTRY, ENV, PID, UNRESOLVED } from "../../src/util/session-identity.mjs";
import { MAX_TITLE_LENGTH } from '../../src/state/work.mjs';

const WRITER_SOURCES = new Set([REGISTRY, ENV, PID, UNRESOLVED]);

const STORE_MJS = path.resolve(fileURLToPath(import.meta.url), '../../../src/state/store.mjs');

// Every test gets its own mkdtemp dir — never touch the repo's .fgos/.
function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-store-learning-'));
}

// Blocking sleep (mirrors events.mjs's own internal sleepSync) — used only to
// force a real millisecond gap between events from different simulated
// writers below, since TA-D7's (ts, file, seq) total order intentionally
// tie-breaks a same-millisecond cross-writer collision by filename, not true
// causal order (documented, not a bug) — this test asserts the ordinary
// (non-colliding) case, not that specific accepted edge.
function sleepMs(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

// Spawns N real child OS processes that all call `storeCall` (a snippet of
// source referencing `dir`/`id`, run inside the child) at a synchronized
// start instant, so their read-check-append windows genuinely overlap —
// mirrors test/state/events.test.mjs's cross-process race technique
// (in-process concurrency can never expose this: one event loop serializes
// calls for free). Each child reports its outcome over the fork IPC channel
// before exiting.
//
// `extraArgvPerChild` (tsk-1q5, optional, backward-compatible — both
// pre-existing call sites below pass none): an array of length `nProcesses`,
// one value per child, available inside `storeCall` as `process.argv[4]` —
// lets a race test give each child a DISTINCT id to mutate (e.g. testing the
// state.json refreshView race, which needs concurrent writers on different
// ids, not a CAS/exists conflict on the same one).
//
// `batchSize` (optional, defaults to `nProcesses` — every existing
// call site below is byte-for-byte unaffected unless it opts in): caps how
// many child processes are synchronized to the SAME start instant at once.
// `acquireEventsLock`'s 2s deadline (src/state/events.mjs) is computed fresh
// per individual lock-acquisition attempt, so a test racing MANY processes
// against the same events.lock can, under real machine load, have a single
// attempt among hundreds land in a window where too many siblings are
// simultaneously retrying for it to succeed inside budget — a standing flake,
// not a regression (docs/history/tsk-4fx-concurrency-test-lock-timeout-flake/
// RESEARCH.md). Batching reduces PEAK simultaneous contention without
// changing the total operation count or the cross-process race semantics
// under test — each batch is still genuine concurrent OS-process racing,
// just fewer processes racing at once.
async function raceAcrossProcesses(dir, storeCall, nProcesses, extraArgvPerChild = null, batchSize = nProcesses) {
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

  const results = [];
  for (let batchStart = 0; batchStart < nProcesses; batchStart += batchSize) {
    const batchCount = Math.min(batchSize, nProcesses - batchStart);
    const startAt = Date.now() + 300;
    const batchResults = await Promise.all(
      Array.from({ length: batchCount }, (_, j) => {
        const i = batchStart + j;
        return new Promise((resolve, reject) => {
          const extraArgv = extraArgvPerChild ? [String(extraArgvPerChild[i])] : [];
          const child = fork(childPath, [dir, String(startAt), ...extraArgv], { stdio: 'inherit' });
          let message = null;
          child.on('message', (msg) => {
            message = msg;
          });
          child.on('exit', (code) => {
            if (!message) return reject(new Error(`child exited (code ${code}) without reporting an outcome`));
            resolve(message);
          });
        });
      }),
    );
    results.push(...batchResults);
  }

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
    risk: 'light',
    refs: [],
    verify: 'npm test',
    ...overrides,
  });
}

// --- addDecision kind field (tsk-1ud D7 step 1): separates engine
// bookkeeping records from real design decisions without matching on
// `text` prefixes. Mirrors the existing `source` default-to-'session'
// coverage right next to it. ---

test('addDecision defaults kind to "design" when the caller omits it', () => {
  const dir = tmpDir();
  addDecision(dir, { text: 'a real design decision', rationale: 'because reasons, cited at file.mjs:1' });

  const view = listWork(dir);
  const last = view.decisions.at(-1);
  assert.equal(last.kind, 'design');
});

test('addDecision keeps an explicit kind (e.g. "engine") unchanged', () => {
  const dir = tmpDir();
  addDecision(dir, { text: 'discovery caller-supplied: clear=true', source: 'resolveDiscovery', kind: 'engine', rationale: 'engine bookkeeping' });

  const view = listWork(dir);
  const last = view.decisions.at(-1);
  assert.equal(last.kind, 'engine');
});

// --- tsk-37t: addDecision now validates a present `id`, matching every
// neighbouring id-taking verb (editWork/moveWork both throw "work <id> not
// found" first) -- a decision scoped to a nonexistent item used to write a
// success envelope and an event `fgos show <id>` could never retrieve. ---

test('tsk-37t: addDecision throws "work <id> not found" for a nonexistent id, same shape editWork/moveWork already use', () => {
  const dir = tmpDir();
  assert.throws(
    () => addDecision(dir, { id: 'no-such-item', text: 'closing report', rationale: 'driver stop reason: awaiting-approval' }),
    (err) => err instanceof StoreError && err.category === 'validation' && /work "no-such-item" not found/.test(err.message),
  );
  // And no event was written for the rejected call -- not silently
  // half-applied.
  const view = listWork(dir);
  assert.equal(view.decisions.length, 0);
});

test('tsk-37t: addDecision still succeeds when id names a real work item', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'real-item');
  addDecision(dir, { id: 'real-item', text: 'closing report', rationale: 'driver stop reason: awaiting-approval' });
  const view = listWork(dir);
  const last = view.decisions.at(-1);
  assert.equal(last.id, 'real-item');
});

test('tsk-37t: addDecision with no id at all is still legitimate (a global decision not scoped to one item)', () => {
  const dir = tmpDir();
  addDecision(dir, { text: 'a global decision', rationale: 'not scoped to one item' });
  const view = listWork(dir);
  assert.equal(view.decisions.at(-1).text, 'a global decision');
});

test('moveWork doing->done composes a learning record reflecting the item\'s actual outcome, friction (by layer), and settlement (by kind/role)', () => {
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

  // done's one remaining door in is cleanup->done (work-item-status-
  // delivered-retrospective-cleanup D1) — walk the sequential chain to it.
  moveWork(dir, { id: 'learn-doing', to: 'delivered', expectedStatus: 'doing' });
  moveWork(dir, { id: 'learn-doing', to: 'retrospective', expectedStatus: 'delivered' });
  moveWork(dir, { id: 'learn-doing', to: 'cleanup', expectedStatus: 'retrospective' });
  const { view } = moveWork(dir, { id: 'learn-doing', to: 'done', expectedStatus: 'cleanup', role: 'human' });

  assert.ok(view.learnings, 'learnings key must exist once an item has closed');
  const records = view.learnings['learn-doing'];
  assert.equal(records.length, 1);
  const record = records[0];
  assert.deepEqual(record.outcome, { disposition: 'pass', attempts: 2, errorClass: null });
  assert.deepEqual(record.frictions, { verification: 1 });
  assert.deepEqual(record.settlements, { 'close/human': 1 });
  assert.equal(typeof record.ts, 'string');
});

// Changed (work-item-status-delivered-retrospective-cleanup D1): done now
// has exactly ONE door in (cleanup->done, not two) — this test's original
// point (both old doors into done compose a learning record) is replaced by
// the equivalent question for the new shape: does the awaiting-approval
// STARTING path (as opposed to the doing hand-move path) still converge on
// the same composeLearning behavior once it reaches the shared cleanup->done
// close? Yes — both paths funnel through the identical chain from delivered
// onward.
test('moveWork via the awaiting-approval path (not just the doing hand-move path) also composes a learning record at the shared cleanup->done close', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'learn-proposed');
  moveWork(dir, { id: 'learn-proposed', to: 'doing', expectedStatus: 'todo' });
  moveWork(dir, { id: 'learn-proposed', to: 'awaiting-approval', expectedStatus: 'doing' });
  moveWork(dir, { id: 'learn-proposed', to: 'delivered', expectedStatus: 'awaiting-approval' });
  moveWork(dir, { id: 'learn-proposed', to: 'retrospective', expectedStatus: 'delivered' });
  moveWork(dir, { id: 'learn-proposed', to: 'cleanup', expectedStatus: 'retrospective' });
  const { view } = moveWork(dir, { id: 'learn-proposed', to: 'done', expectedStatus: 'cleanup', role: 'human' });

  assert.ok(view.learnings?.['learn-proposed'], 'the awaiting-approval path must also produce a learning record');
  assert.equal(view.learnings['learn-proposed'].length, 1);
  assert.deepEqual(view.learnings['learn-proposed'][0].settlements, { 'close/human': 1 });
});

test('moveWork to done for an item with no outcome and no friction still produces a minimal (not skipped) learning record', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'learn-empty');
  moveWork(dir, { id: 'learn-empty', to: 'doing', expectedStatus: 'todo' });
  moveWork(dir, { id: 'learn-empty', to: 'delivered', expectedStatus: 'doing' });
  moveWork(dir, { id: 'learn-empty', to: 'retrospective', expectedStatus: 'delivered' });
  moveWork(dir, { id: 'learn-empty', to: 'cleanup', expectedStatus: 'retrospective' });
  const { view } = moveWork(dir, { id: 'learn-empty', to: 'done', expectedStatus: 'cleanup', role: 'human' });

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
  // Walk the sequential chain up to (but not through) the final close;
  // snapshot the log AFTER this so the assertion below still proves the
  // CLOSE itself (cleanup->done) appends exactly one event, not the chain
  // as a whole.
  moveWork(dir, { id: 'learn-rebuild', to: 'delivered', expectedStatus: 'doing' });
  moveWork(dir, { id: 'learn-rebuild', to: 'retrospective', expectedStatus: 'delivered' });
  moveWork(dir, { id: 'learn-rebuild', to: 'cleanup', expectedStatus: 'retrospective' });

  // Tầng A/T2: writes now land in the ONE open per-writer file under
  // .fgos/events/ (TA-D2/TA-D11), not the frozen events.jsonl baseline.
  const eventsDir = path.join(dir, 'events');
  const filesBefore = fs.readdirSync(eventsDir).sort();
  assert.equal(filesBefore.length, 1, 'exactly one writer, one open file');
  const logPath = path.join(eventsDir, filesBefore[0]);
  const eventsBefore = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean).length;

  const { event } = moveWork(dir, { id: 'learn-rebuild', to: 'done', expectedStatus: 'cleanup', role: 'human' });

  const filesAfter = fs.readdirSync(eventsDir).sort();
  assert.deepEqual(filesAfter, filesBefore, 'no new file appears — the learning record rides the same writer-file append that already happens');

  const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
  assert.equal(lines.length, eventsBefore + 1, 'exactly ONE event appended for the close — not two');
  const types = lines.map((l) => JSON.parse(l).type);
  assert.deepEqual(types, ['work.add', 'work.move', 'work.move', 'work.move', 'work.move', 'work.move']);
  assert.equal(event.type, 'work.move');
  assert.ok(event.payload.learning, 'the returned move event itself carries the learning field');

  const rebuiltOnce = listWork(dir);
  const rebuiltTwice = listWork(dir);
  assert.deepEqual(rebuiltTwice, rebuiltOnce, 'rebuilding the same log twice must be deep-equal (determinism)');
});

// --- Tầng A/T2: multi-file write path (TA-D2/TA-D11/TA-D14) --------------
//
// Two distinct writer identities interleaving their writes must each get
// their OWN file under .fgos/events/ (never share one, never collide), and
// a CAS precondition (moveWork's expectedStatus) must still see the OTHER
// writer's prior event when it reads "current state" — proving the merged
// multi-file view, not just the append side, is correct.
test('two interleaved writer identities each write to their own file under .fgos/events/, and CAS still sees across both', () => {
  const dir = tmpDir();
  const savedSessionId = process.env.FGOS_SESSION_ID;
  try {
    process.env.FGOS_SESSION_ID = 'writer-a';
    addWork(dir, {
      id: 'interleave-1',
      title: 'Title interleave-1',
      kind: 'task',
      status: 'todo',
      deps: [],
      risk: 'light',
      refs: [],
      verify: 'npm test',
    });

    sleepMs(5);
    process.env.FGOS_SESSION_ID = 'writer-b';
    moveWork(dir, { id: 'interleave-1', to: 'doing', expectedStatus: 'todo' });

    sleepMs(5);
    process.env.FGOS_SESSION_ID = 'writer-a';
    // CAS precondition here only succeeds if writer-a's read of "current
    // state" sees writer-b's move, which lives in a DIFFERENT file.
    moveWork(dir, { id: 'interleave-1', to: 'delivered', expectedStatus: 'doing', role: 'human' });

    const eventsDir = path.join(dir, 'events');
    const files = fs.readdirSync(eventsDir).filter((f) => f.endsWith('.jsonl'));
    assert.equal(files.length, 2, 'two distinct writer identities produce two distinct files');
    assert.ok(files.some((f) => f.startsWith('writer-a-')));
    assert.ok(files.some((f) => f.startsWith('writer-b-')));

    const view = listWork(dir);
    assert.equal(view.work['interleave-1'].status, 'delivered');

    const rawEvents = readRawEvents(dir);
    assert.deepEqual(
      rawEvents.map((e) => e.type),
      ['work.add', 'work.move', 'work.move'],
      'readRawEvents merges both writer files in total order',
    );
  } finally {
    if (savedSessionId === undefined) delete process.env.FGOS_SESSION_ID;
    else process.env.FGOS_SESSION_ID = savedSessionId;
  }
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

  const { event } = moveWork(dir, { id: 'branch-take', to: 'doing', expectedStatus: 'blocked', role: 'human', branchHeadAtTake: 'branch-deadbeef' });

  assert.equal(event.payload.branchHeadAtTake, 'branch-deadbeef');
  assert.equal('headAtTake' in event.payload, false, 'a branch take never also stamps the main-based headAtTake');
});

test('moveWork stamps branchHeadAtReturn onto the appended event payload for a doing -> awaiting-approval move that carries it, never headAtReturn', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'branch-return', { status: 'blocked' });
  moveWork(dir, { id: 'branch-return', to: 'doing', expectedStatus: 'blocked', role: 'human', branchHeadAtTake: 'branch-deadbeef' });

  const { event } = moveWork(dir, { id: 'branch-return', to: 'awaiting-approval', expectedStatus: 'doing', branchHeadAtReturn: 'branch-c0ffee' });

  assert.equal(event.payload.branchHeadAtReturn, 'branch-c0ffee');
  assert.equal('headAtReturn' in event.payload, false, 'a branch return never also stamps the main-based headAtReturn (D2 CẤM)');
});

test('moveWork omits branchHeadAtTake/branchHeadAtReturn entirely from the event payload when the caller never supplies them (byte-identical to the prior shape)', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'branch-absent');

  const { event } = moveWork(dir, { id: 'branch-absent', to: 'doing', expectedStatus: 'todo', role: 'human', headAtTake: 'main-deadbeef' });

  assert.equal('branchHeadAtTake' in event.payload, false);
  assert.equal('branchHeadAtReturn' in event.payload, false);
});

// --- delivered-event merge provenance (tsk-5dk) ---------------------------
//
// Same write-side gap class as branchHeadAtTake/branchHeadAtReturn above:
// moveWork's destructure is a fixed field list, so mergedSha/mergedInto must
// be asserted directly on the appended event's own payload, never only on a
// later fold. Additive/optional, same stamp-only-if-defined pattern.

test('moveWork stamps mergedSha and mergedInto onto the appended event payload for a doing -> delivered move that carries them', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'merge-evidence', { status: 'awaiting-approval' });

  const { event } = moveWork(dir, {
    id: 'merge-evidence',
    to: 'delivered',
    expectedStatus: 'awaiting-approval',
    role: 'human',
    mergedSha: 'deadbeefcafe',
    mergedInto: 'main',
  });

  assert.equal(event.payload.mergedSha, 'deadbeefcafe');
  assert.equal(event.payload.mergedInto, 'main');
});

test('moveWork omits mergedSha/mergedInto entirely from the event payload when the caller never supplies them (byte-identical to the prior shape)', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'merge-evidence-absent', { status: 'awaiting-approval' });

  const { event } = moveWork(dir, { id: 'merge-evidence-absent', to: 'delivered', expectedStatus: 'awaiting-approval', role: 'human' });

  assert.equal('mergedSha' in event.payload, false);
  assert.equal('mergedInto' in event.payload, false);
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

test('addOutcome and addFriction stay valid when docType is absent or explicitly null (untagged)', () => {
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

test('a docType-tagged outcome AND friction survive an independent rebuild of the view from the log (zero replay.mjs mechanism change)', () => {
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
    () => addWork(dir, { id: 'self-loop', title: 'Self Loop', kind: 'task', status: 'todo', deps: ['self-loop'], risk: 'light', refs: [], verify: 'npm test' }),
    /cannot list itself as a dep/,
  );
  assert.equal(listWork(dir).work['self-loop'], undefined);
});

test('addWork accepts a forward-only chain built up one item at a time — no false positive from the new guard', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'cyc-a', { deps: [] });
  addSampleWork(dir, 'cyc-b', { deps: ['cyc-a'] });
  addWork(dir, { id: 'cyc-c', title: 'Cyc C', kind: 'task', status: 'todo', deps: ['cyc-b'], risk: 'light', refs: [], verify: 'npm test' });
  assert.ok(listWork(dir).work['cyc-c']);
});

test('a direct 2-node A<->B cycle is rejected once the second half is written — via addWork then editWork', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'cyc-x', { deps: [] });
  // cyc-x has no deps yet, so cyc-y -> cyc-x is a plain forward edge, not a cycle: accepted.
  addWork(dir, { id: 'cyc-y', title: 'Cyc Y', kind: 'task', status: 'todo', deps: ['cyc-x'], risk: 'light', refs: [], verify: 'npm test' });
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
  addWork(dir, { id: 'dag-b', title: 'Dag B', kind: 'task', status: 'todo', deps: ['dag-a'], risk: 'light', refs: [], verify: 'npm test' });
  assert.ok(listWork(dir).work['dag-b']);

  addSampleWork(dir, 'dag-c', { deps: [] });
  editWork(dir, { id: 'dag-b', patch: { deps: ['dag-a', 'dag-c'] } });
  assert.deepEqual(listWork(dir).work['dag-b'].deps, ['dag-a', 'dag-c']);
});

// tsk-2t9c D16: `kind` selects an item's workflow/stage graph
// (`resolveWorkflow`). Locking it once `status` leaves `todo` means kind
// can never drift out from under a stage graph the item is actively
// walking, without needing a separate frozen `workflow` field or a new
// validated-change verb.
test('editWork accepts a kind patch while status is still todo', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'kind-todo', { kind: 'task' });
  editWork(dir, { id: 'kind-todo', patch: { kind: 'bug' } });
  assert.equal(listWork(dir).work['kind-todo'].kind, 'bug');
});

test('editWork refuses a kind patch once status has left todo (doing)', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'kind-doing', { kind: 'task' });
  moveWork(dir, { id: 'kind-doing', to: 'doing', expectedStatus: 'todo' });
  assert.throws(
    () => editWork(dir, { id: 'kind-doing', patch: { kind: 'bug' } }),
    /kind.*status is "doing", not "todo"/s,
  );
  // the item's kind must stay unchanged — the patch never landed
  assert.equal(listWork(dir).work['kind-doing'].kind, 'task');
});

test('editWork refuses a kind patch on a delivered item too (not just doing)', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'kind-delivered', { kind: 'task' });
  moveWork(dir, { id: 'kind-delivered', to: 'doing', expectedStatus: 'todo' });
  moveWork(dir, { id: 'kind-delivered', to: 'delivered', expectedStatus: 'doing' });
  assert.throws(
    () => editWork(dir, { id: 'kind-delivered', patch: { kind: 'bug' } }),
    /kind.*status is "delivered", not "todo"/s,
  );
});

test('editWork still accepts an unrelated-field patch once status has left todo — the kind lock is scoped to kind alone', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'kind-lock-scoped', { kind: 'task' });
  moveWork(dir, { id: 'kind-lock-scoped', to: 'doing', expectedStatus: 'todo' });
  editWork(dir, { id: 'kind-lock-scoped', patch: { priority: 5 } });
  assert.equal(listWork(dir).work['kind-lock-scoped'].priority, 5);
});

test('a dep to an unknown id is still rejected by the existing existence check first, before the cycle guard runs', () => {
  const dir = tmpDir();
  assert.throws(
    () => addWork(dir, { id: 'ghost-dep', title: 'Ghost Dep', kind: 'task', status: 'todo', deps: ['no-such-id'], risk: 'light', refs: [], verify: 'npm test' }),
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
    () => addWork(dir, { id: 'mix-b', title: 'Mix B', kind: 'task', status: 'todo', parent: 'mix-a', deps: ['mix-a'], risk: 'light', refs: [], verify: 'npm test' }),
    /would close a graph cycle/,
  );
  assert.equal(listWork(dir).work['mix-b'], undefined, 'the rejected add never landed');
});

test('a MIXED cycle closed by an editWork patch is rejected — the parent edge exists first, the deps edit closes the loop', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'edit-mix-a', { deps: [] });
  // edit-mix-b's parent is edit-mix-a -> edge edit-mix-a -> edit-mix-b. No
  // cycle yet (a child pointing at its parent is a plain forward edge).
  addWork(dir, { id: 'edit-mix-b', title: 'Edit Mix B', kind: 'task', status: 'todo', parent: 'edit-mix-a', deps: [], risk: 'light', refs: [], verify: 'npm test' });
  assert.ok(listWork(dir).work['edit-mix-b']);

  // Patching edit-mix-b.deps = [edit-mix-a] adds edge edit-mix-b -> edit-mix-a,
  // closing edit-mix-a -> edit-mix-b -> edit-mix-a. This is the deps-patch
  // route to the same MIXED cycle the test below closes via a parent-patch
  // instead (parent-flag-cli D1 made `parent` editable too, both routes go
  // through the same assertNoUnifiedCycle call). The deps-only guard misses
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
  addWork(dir, { id: 'pc-a', title: 'PC A', kind: 'task', status: 'todo', parent: 'pc-b', deps: [], risk: 'light', refs: [], verify: 'npm test' });
  assert.ok(listWork(dir).work['pc-a'], 'a dangling forward parent is allowed on add');

  // Now pc-b names pc-a as ITS parent -> edge pc-a -> pc-b, closing
  // pc-a -> pc-b -> pc-a with zero deps anywhere. Rejected at pc-b's add.
  assert.throws(
    () => addWork(dir, { id: 'pc-b', title: 'PC B', kind: 'task', status: 'todo', parent: 'pc-a', deps: [], risk: 'light', refs: [], verify: 'npm test' }),
    /would close a graph cycle/,
  );
  assert.equal(listWork(dir).work['pc-b'], undefined, 'the rejected add never landed');
});

test('a valid parent chain (no cycle) is still accepted — the unified guard has no false positive on a DAG with parent edges', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'tree-root', { deps: [] });
  addWork(dir, { id: 'tree-child', title: 'Tree Child', kind: 'task', status: 'todo', parent: 'tree-root', deps: [], risk: 'light', refs: [], verify: 'npm test' });
  addWork(dir, { id: 'tree-grandchild', title: 'Tree Grandchild', kind: 'task', status: 'todo', parent: 'tree-child', deps: [], risk: 'light', refs: [], verify: 'npm test' });
  assert.ok(listWork(dir).work['tree-grandchild'], 'a plain parent chain is a DAG, not a cycle');
});

// --- parent now editable (parent-flag-cli D1/D2) ----------------------------
// `parent` joined EDITABLE_FIELDS; the new attack surface this opens is a
// cycle closed by a PARENT-ONLY edit — structurally impossible before D1
// (no test above exercises it, since it couldn't happen). `editWork`'s
// assertNoUnifiedCycle call is unconditional on the merged candidate, so no
// new guard code was needed — this proves that claim rather than assuming it.

test('a MIXED cycle closed by an editWork patch that changes ONLY parent (no deps involved) is rejected', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'pmix-a', { deps: [] });
  // pmix-b's parent is pmix-a -> edge pmix-a -> pmix-b. No cycle yet.
  addWork(dir, { id: 'pmix-b', title: 'Parent Mix B', kind: 'task', status: 'todo', parent: 'pmix-a', deps: [], risk: 'light', refs: [], verify: 'npm test' });
  assert.ok(listWork(dir).work['pmix-b']);

  // Before D1 this patch was rejected outright ("parent" not in
  // EDITABLE_FIELDS) — never reached the cycle guard at all. Now it does:
  // patching pmix-a.parent = pmix-b adds edge pmix-b -> pmix-a, closing
  // pmix-a -> pmix-b -> pmix-a with zero deps anywhere.
  assert.throws(
    () => editWork(dir, { id: 'pmix-a', patch: { parent: 'pmix-b' } }),
    /would close a graph cycle/,
  );
  assert.equal(listWork(dir).work['pmix-a'].parent, undefined, 'the rejected patch never landed');
});

test('editWork can set parent on an item that had none — accepted when it introduces no cycle', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'padd-root', { deps: [] });
  addSampleWork(dir, 'padd-child', { deps: [] });
  assert.equal(listWork(dir).work['padd-child'].parent, undefined);

  editWork(dir, { id: 'padd-child', patch: { parent: 'padd-root' } });
  assert.equal(listWork(dir).work['padd-child'].parent, 'padd-root');
});

test('editWork patch { parent: null } clears an existing parent (edit --parent "" clear semantics, D2)', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'pclear-root', { deps: [] });
  addWork(dir, { id: 'pclear-child', title: 'Clear Child', kind: 'task', status: 'todo', parent: 'pclear-root', deps: [], risk: 'light', refs: [], verify: 'npm test' });
  assert.equal(listWork(dir).work['pclear-child'].parent, 'pclear-root');

  editWork(dir, { id: 'pclear-child', patch: { parent: null } });
  assert.equal(listWork(dir).work['pclear-child'].parent, null, 'null is the work.mjs "absent" sentinel, same as an item that never had a parent');
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
    `addWork(dir, { id: 'race-add', title: 'Race Add', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'npm test' });`,
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
  const N = 6;

  const results = await raceAcrossProcesses(
    dir,
    `moveWork(dir, { id: 'race-move', to: 'delivered', expectedStatus: 'doing' });`,
    N,
  );

  const succeeded = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  assert.equal(succeeded.length, 1, `exactly one of ${N} concurrent moveWork CAS calls must win the race`);
  assert.equal(failed.length, N - 1, 'every other concurrent moveWork CAS call must fail its precondition');
  for (const r of failed) {
    assert.equal(r.category, 'conflict', 'a losing moveWork must fail as FsmError("conflict"), not crash or hang');
  }

  const moveToDeliveredEvents = readRawEvents(dir).filter(
    (e) => e.type === 'work.move' && e.payload?.id === 'race-move' && e.payload?.to === 'delivered',
  );
  assert.equal(moveToDeliveredEvents.length, 1, 'the log must carry exactly one doing->delivered work.move event for the raced id');
});

// Cross-process regression (tsk-1q5): before this fix, every mutation's
// refreshView(dir) call ran AFTER releasing withEventsLock, in its own
// separate, unlocked critical section. Two processes racing DIFFERENT ids
// (so neither hits the addWork/moveWork CAS races proven fixed above) could
// still interleave their unlocked rebuild-and-overwrite-state.json calls:
// whichever process's whole-file write landed last won, even if its own log
// read was captured before the other process's append — silently
// overwriting a fresher state.json with a staler one missing that other
// mutation. refreshView now runs INSIDE the same held events.lock as the
// append (withEventsLockAndRefresh), closing that window structurally.
test('concurrent editWork calls on DIFFERENT ids never lose a write to state.json (tsk-1q5)', async () => {
  const dir = tmpDir();
  const N_PROC = 16;
  const N_EDITS = 30; // per process — volume, same technique events.test.mjs's own append-race test uses (D2: back-to-back, no delay, to maximize scheduler-preemption overlap between processes' unlocked refreshView calls). Kept well under the 2s events.lock timeout (events.mjs EVENTS_LOCK_TIMEOUT_MS) — a higher N_PROC*N_EDITS was tried and caused genuine lock-timeout contention unrelated to the refreshView race this test targets, not a more reliable reproduction of it.
  for (let i = 0; i < N_PROC; i += 1) {
    addSampleWork(dir, `race-view-${i}`);
  }

  const results = await raceAcrossProcesses(
    dir,
    `const id = process.argv[4];
for (let i = 0; i < ${N_EDITS}; i += 1) {
  editWork(dir, { id, patch: { priority: i } });
}`,
    N_PROC,
    Array.from({ length: N_PROC }, (_, i) => `race-view-${i}`),
    4, // batch to reduce peak events.lock contention under load — see raceAcrossProcesses' own comment
  );

  assert.deepEqual(results, Array(N_PROC).fill({ ok: true }), 'every concurrent editWork loop on a distinct id must succeed (no CAS conflict expected across different ids)');

  // The persisted state.json (what every reader actually sees) must equal a
  // fresh rebuild of the now-complete log. Before the fix, a lost refreshView
  // race would leave one or more ids' persisted `priority` behind its own
  // process's LAST edit (i.e. not N_EDITS - 1), even though the log itself has
  // every event.
  const persisted = JSON.parse(fs.readFileSync(path.join(dir, 'state.json'), 'utf8'));
  const fresh = listWork(dir);
  for (let i = 0; i < N_PROC; i += 1) {
    assert.equal(persisted.work[`race-view-${i}`].priority, N_EDITS - 1, `race-view-${i} must show its own process's LAST edit (priority ${N_EDITS - 1}) in the persisted state.json, not silently lost to a losing refreshView race`);
  }
  assert.deepEqual(persisted.work, fresh.work, 'persisted state.json must match a fresh rebuild of the log — any mismatch means a concurrent refreshView race overwrote a fresher view with a staler one');
});

// tsk-4mx: writeView used to be a bare fs.writeFileSync straight onto
// state.json -- a crash or a concurrent read mid-write could observe a
// truncated file. Proves the real fix (write to a uniquely-named temp path,
// then rename(2) it onto state.json) by spying on the real fs calls a
// mutation makes, not just the resulting file content.
test('writeView writes state.json via a temp-file-then-rename, never a direct writeFileSync onto it (tsk-4mx)', () => {
  const dir = tmpDir();
  const viewPath = path.join(dir, 'state.json');
  const writeFileSyncCalls = [];
  const renameSyncCalls = [];
  const originalWriteFileSync = fs.writeFileSync;
  const originalRenameSync = fs.renameSync;
  fs.writeFileSync = function patchedWriteFileSync(target, ...rest) {
    writeFileSyncCalls.push(String(target));
    return originalWriteFileSync.call(fs, target, ...rest);
  };
  fs.renameSync = function patchedRenameSync(from, to) {
    renameSyncCalls.push({ from: String(from), to: String(to) });
    return originalRenameSync.call(fs, from, to);
  };
  try {
    addSampleWork(dir, 'atomic-write-check');
  } finally {
    fs.writeFileSync = originalWriteFileSync;
    fs.renameSync = originalRenameSync;
  }

  const viewWrites = writeFileSyncCalls.filter((target) => target === viewPath || target.startsWith(`${viewPath}.tmp-`));
  assert.ok(viewWrites.every((target) => target !== viewPath), 'no writeFileSync call may target state.json directly');
  assert.ok(viewWrites.some((target) => target.startsWith(`${viewPath}.tmp-`)), 'writeView must writeFileSync to a uniquely-named temp path derived from state.json\'s own path');

  const viewRenames = renameSyncCalls.filter((call) => call.to === viewPath);
  assert.equal(viewRenames.length, 1, 'exactly one renameSync must land the temp file onto state.json');
  assert.ok(viewRenames[0].from.startsWith(`${viewPath}.tmp-`), 'the renamed-from path must be the same temp path writeFileSync wrote to');

  assert.ok(fs.existsSync(viewPath), 'state.json must exist after the rename');
  assert.ok(!fs.existsSync(viewRenames[0].from), 'the temp file must no longer exist after rename(2) moved it');
  JSON.parse(fs.readFileSync(viewPath, 'utf8'));
});

// tsk-37d: writeView must stringify the view object only once per write
test('writeView serializes view content only once per mutation (tsk-37d)', () => {
  const dir = tmpDir();
  let viewStringifyCount = 0;
  const originalStringify = JSON.stringify;
  JSON.stringify = function patchedStringify(obj, ...args) {
    if (obj && typeof obj === 'object' && obj !== null && typeof obj.work === 'object') {
      viewStringifyCount += 1;
    }
    return originalStringify.call(this, obj, ...args);
  };
  try {
    initStore(dir);
    addSampleWork(dir, 'single-stringify-check');
  } finally {
    JSON.stringify = originalStringify;
  }
  // initStore (1 write) + addSampleWork (1 write) = 2 writes.
  // For each write, the view object must be stringified exactly once.
  assert.equal(viewStringifyCount, 2, 'the full view object must be stringified exactly once per state write');
});

// --- str73-done-flip-cos-check cell 2: per-clause CoS done-gate ------------
//
// Retargeted by work-item-status-delivered-retrospective-cleanup D3: this
// gate now runs on `to==='delivered'` (all three doors in), not `to==='done'`
// — a dependent that opens on `delivered` (RUL12) is exactly as protected
// as it was when `done` was the trigger. The old "advance to compound-learn
// first" setup is gone along with the retired RUL50 stage-gate (D11) — a
// bare `doing -> delivered` attempt is all these tests need now.

test('moveWork refuses a doing->delivered close when a populated acceptance clause has no evidence: precondition, item stays "doing", no event written', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'cos-missing-evidence', { acceptance: [{ text: 'field round-trips' }] });
  moveWork(dir, { id: 'cos-missing-evidence', to: 'doing', expectedStatus: 'todo' });

  const before = readRawEvents(dir).length;
  assert.throws(
    () => moveWork(dir, { id: 'cos-missing-evidence', to: 'delivered', expectedStatus: 'doing' }),
    (err) => err instanceof StoreError && err.category === 'precondition' && /field round-trips/.test(err.message),
  );
  assert.equal(listWork(dir).work['cos-missing-evidence'].status, 'doing', 'a refused close must leave the item at its prior status');
  assert.equal(readRawEvents(dir).length, before, 'a refused close must append no event');
});

test('moveWork allows a doing->delivered close when every acceptance clause has non-empty evidence, exactly as before this cell', () => {
  const dir = tmpDir();
  // tsk-5q5-2: evidence must resolve to a real path under repoRoot
  // (path.dirname(dir) here) -- write a real file up front since addWork's
  // own evidence check runs before it ever appends anything to dir itself.
  fs.writeFileSync(path.join(dir, 'evidence.txt'), 'x');
  const realEvidence = `${path.basename(dir)}/evidence.txt`;
  addSampleWork(dir, 'cos-all-evidenced', {
    acceptance: [
      { text: 'field round-trips', evidence: realEvidence },
      { text: 'CLI exits 0', evidence: realEvidence },
    ],
  });
  moveWork(dir, { id: 'cos-all-evidenced', to: 'doing', expectedStatus: 'todo' });

  const { view } = moveWork(dir, { id: 'cos-all-evidenced', to: 'delivered', expectedStatus: 'doing', role: 'human' });
  assert.equal(view.work['cos-all-evidenced'].status, 'delivered');
});

test('moveWork leaves a doing->delivered close completely unaffected when acceptance is absent, or an empty array — a no-op', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'cos-absent'); // no `acceptance` field at all
  addSampleWork(dir, 'cos-empty', { acceptance: [] });
  moveWork(dir, { id: 'cos-absent', to: 'doing', expectedStatus: 'todo' });
  moveWork(dir, { id: 'cos-empty', to: 'doing', expectedStatus: 'todo' });

  const { view: viewAbsent } = moveWork(dir, { id: 'cos-absent', to: 'delivered', expectedStatus: 'doing', role: 'human' });
  assert.equal(viewAbsent.work['cos-absent'].status, 'delivered');

  const { view: viewEmpty } = moveWork(dir, { id: 'cos-empty', to: 'delivered', expectedStatus: 'doing', role: 'human' });
  assert.equal(viewEmpty.work['cos-empty'].status, 'delivered');
});

test('moveWork re-reads fresh state on retry: editing in the missing evidence after a refusal, then retrying, succeeds — no cached verdict', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'cos-retry', { acceptance: [{ text: 'field round-trips' }] });
  moveWork(dir, { id: 'cos-retry', to: 'doing', expectedStatus: 'todo' });

  assert.throws(
    () => moveWork(dir, { id: 'cos-retry', to: 'delivered', expectedStatus: 'doing' }),
    (err) => err instanceof StoreError && err.category === 'precondition',
  );
  assert.equal(listWork(dir).work['cos-retry'].status, 'doing');

  // tsk-5q5-2: evidence must resolve to a real path under repoRoot. Cites
  // state.json (not events.jsonl) since Tầng A/T2 moves new writes under
  // .fgos/events/ — state.json is the one file every mutation still
  // guarantees exists at this root, unlike the now-frozen events.jsonl
  // baseline, which this test's tmpDir() never touches directly (TA-D12).
  editWork(dir, { id: 'cos-retry', patch: { acceptance: [{ text: 'field round-trips', evidence: `${path.basename(dir)}/state.json:1` }] } });

  const { view } = moveWork(dir, { id: 'cos-retry', to: 'delivered', expectedStatus: 'doing', role: 'human' });
  assert.equal(view.work['cos-retry'].status, 'delivered', 'the retry must re-read the just-edited evidence, not a cached refusal');
});

// --- tsk-2p6: assertPlanEvidence -- a risk:heavy item reaching `delivered`
// must have a plan.md on its own fgw/<id> branch. Needs a REAL git repo
// (unlike every test above, which never touches git) since the check reads
// the item's branch content via `git cat-file -e`, never the caller's
// current working tree -- correct both before a merge (pre-flight) and
// after (backstop). `dir` here is always `path.join(repoRoot, '.fgos')`,
// mirroring claim-port.test.mjs's own `setup()` shape.

function gitBackedDir(prefix) {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'seed'], { cwd: repoRoot });
  return { repoRoot, dir: path.join(repoRoot, '.fgos') };
}

test('tsk-2p6: moveWork refuses a doing->delivered close for a risk:heavy item with no plan.md on its own branch', () => {
  const { repoRoot, dir } = gitBackedDir('fgos-plan-evidence-missing-');
  execFileSync('git', ['branch', 'fgw/heavy-no-plan'], { cwd: repoRoot });
  addSampleWork(dir, 'heavy-no-plan', { risk: 'heavy' });
  moveWork(dir, { id: 'heavy-no-plan', to: 'doing', expectedStatus: 'todo' });

  const before = readRawEvents(dir).length;
  assert.throws(
    () => moveWork(dir, { id: 'heavy-no-plan', to: 'delivered', expectedStatus: 'doing' }),
    (err) => err instanceof StoreError && err.category === 'precondition' && /no plan\.md found on branch "fgw\/heavy-no-plan"/.test(err.message),
  );
  assert.equal(listWork(dir).work['heavy-no-plan'].status, 'doing', 'a refused close must leave the item at its prior status');
  assert.equal(readRawEvents(dir).length, before, 'a refused close must append no event');
});

test('tsk-2p6: moveWork allows a doing->delivered close for a risk:heavy item that DOES have a plan.md on its branch (docs/history/<id>/ shape)', () => {
  const { repoRoot, dir } = gitBackedDir('fgos-plan-evidence-present-');
  execFileSync('git', ['checkout', '-q', '-b', 'fgw/heavy-with-plan'], { cwd: repoRoot });
  fs.mkdirSync(path.join(repoRoot, 'docs', 'history', 'heavy-with-plan'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'docs', 'history', 'heavy-with-plan', 'plan.md'), '# plan\n');
  execFileSync('git', ['add', 'docs'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'plan'], { cwd: repoRoot });
  execFileSync('git', ['checkout', '-q', 'main'], { cwd: repoRoot });

  addSampleWork(dir, 'heavy-with-plan', { risk: 'heavy' });
  moveWork(dir, { id: 'heavy-with-plan', to: 'doing', expectedStatus: 'todo' });
  const { view } = moveWork(dir, { id: 'heavy-with-plan', to: 'delivered', expectedStatus: 'doing', role: 'human' });
  assert.equal(view.work['heavy-with-plan'].status, 'delivered');
});

test('tsk-2p6: moveWork allows a doing->delivered close for a risk:heavy item whose docsRef points straight at plan.md\'s own dir', () => {
  const { repoRoot, dir } = gitBackedDir('fgos-plan-evidence-docsref-');
  execFileSync('git', ['checkout', '-q', '-b', 'fgw/heavy-docsref'], { cwd: repoRoot });
  fs.mkdirSync(path.join(repoRoot, 'docs', 'history', 'custom-feature-name'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'docs', 'history', 'custom-feature-name', 'plan.md'), '# plan\n');
  execFileSync('git', ['add', 'docs'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'plan'], { cwd: repoRoot });
  execFileSync('git', ['checkout', '-q', 'main'], { cwd: repoRoot });

  addSampleWork(dir, 'heavy-docsref', { risk: 'heavy', docsRef: 'docs/history/custom-feature-name/' });
  moveWork(dir, { id: 'heavy-docsref', to: 'doing', expectedStatus: 'todo' });
  const { view } = moveWork(dir, { id: 'heavy-docsref', to: 'delivered', expectedStatus: 'doing', role: 'human' });
  assert.equal(view.work['heavy-docsref'].status, 'delivered');
});

test('tsk-2p6: moveWork never gates a light/standard-risk item on plan.md — byte-identical to before this item', () => {
  const { repoRoot, dir } = gitBackedDir('fgos-plan-evidence-light-');
  execFileSync('git', ['branch', 'fgw/light-item'], { cwd: repoRoot });
  addSampleWork(dir, 'light-item', { risk: 'light' });
  moveWork(dir, { id: 'light-item', to: 'doing', expectedStatus: 'todo' });
  const { view } = moveWork(dir, { id: 'light-item', to: 'delivered', expectedStatus: 'doing', role: 'human' });
  assert.equal(view.work['light-item'].status, 'delivered');
});

test('tsk-2p6: assertPlanEvidence fails gracefully (never throws an unrelated git error) when the item\'s own branch does not exist at all', () => {
  const { repoRoot } = gitBackedDir('fgos-plan-evidence-no-branch-');
  assert.throws(
    () => assertPlanEvidence('no-such-branch-item', { risk: 'heavy' }, repoRoot),
    (err) => err instanceof StoreError && err.category === 'precondition' && /no plan\.md found on branch "fgw\/no-such-branch-item"/.test(err.message),
  );
});

// --- `priority`/`intent` in EDITABLE_FIELDS (per str7-str8-priority-intent
// D3): both fields go through the SAME standard write door as every other
// editable field — asserting editWork actually accepts and persists them,
// and that the merged candidate still runs through validateWork (a bad
// value is rejected the same way an invalid `tier` patch already is).

test('editWork accepts a priority patch and persists it through a fresh rebuild', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'prio-a');
  assert.equal(listWork(dir).work['prio-a'].priority, undefined);

  editWork(dir, { id: 'prio-a', patch: { priority: 3 } });
  assert.equal(listWork(dir).work['prio-a'].priority, 3);
});

test('editWork accepts an intent patch, including a negative value (no sign constraint)', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'intent-a');
  assert.equal(listWork(dir).work['intent-a'].intent, undefined);

  editWork(dir, { id: 'intent-a', patch: { intent: -5 } });
  assert.equal(listWork(dir).work['intent-a'].intent, -5);
});

test('editWork rejects a negative priority patch — validateWork still runs on the merged candidate', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'prio-neg');
  assert.throws(
    () => editWork(dir, { id: 'prio-neg', patch: { priority: -1 } }),
    /priority/,
  );
  assert.equal(listWork(dir).work['prio-neg'].priority, undefined, 'the rejected patch never lands');
});

// setFocus (str67-goal-directed-planning D7): the write door's two
// validation-throw cases, asserted directly against the returned view —
// cheaper than round-tripping through the CLI (this file's own top-of-file
// rationale). Mirrors the `assert.throws(... StoreError ... category ===
// 'validation')` shape moveWork's precondition tests above already use.

test('setFocus throws StoreError("validation") when id does not exist in view.work', () => {
  const dir = tmpDir();
  assert.throws(
    () => setFocus(dir, { id: 'no-such-id' }),
    (err) => err instanceof StoreError && err.category === 'validation' && /not found/.test(err.message),
  );
});

test('setFocus throws StoreError("validation") when the item exists but has no goalTier', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'not-a-goal');
  assert.throws(
    () => setFocus(dir, { id: 'not-a-goal' }),
    (err) => err instanceof StoreError && err.category === 'validation' && /goal tier/.test(err.message),
  );
});
// --- writer provenance (D8/D15/D17/D18, str46-io-contract): every event
// written through editWork, moveWork and moveStage carries a writer
// object produced by resolveWriterIdentity -- table-driven since the three
// doors exercise the exact same shape assertion, only the call differs.
test("editWork, moveWork and moveStage each stamp the event payload with writer id/source, never a joined string, never routed through a validator", () => {
  const dir = tmpDir();
  addSampleWork(dir, "writer-a", { stage: "exploring" });

  const doors = [
    { name: "editWork", call: () => editWork(dir, { id: "writer-a", patch: { title: "Writer A edited" } }) },
    { name: "moveWork", call: () => moveWork(dir, { id: "writer-a", to: "doing", expectedStatus: "todo" }) },
    { name: "moveStage", call: () => moveStage(dir, { id: "writer-a", to: "decompose" }) },
  ];

  for (const { name, call } of doors) {
    const { event } = call();
    const writer = event.payload.writer;
    assert.ok(writer && typeof writer === "object" && !Array.isArray(writer), name + ": writer must be a nested object, not a joined string");
    assert.deepEqual(Object.keys(writer).sort(), ["id", "source"], name + ": writer has exactly two children, id and source");
    assert.ok(WRITER_SOURCES.has(writer.source), name + ": source must be one of registry/env/pid/unresolved");
  }
});

// --- title bound at the write doors (work-item-title-contract D2/D5) ---
// The bound truncates instead of rejecting: a long title arriving from a
// script or an agent must not break the call that carried it.

test('addWork truncates an over-length title instead of rejecting the write', () => {
  const dir = tmpDir();
  const long = `${'word '.repeat(60).trim()}`;
  addSampleWork(dir, 'long-add', { title: long });

  const stored = listWork(dir).work['long-add'];
  assert.ok(stored, 'the write went through rather than throwing');
  assert.ok(stored.title.length <= MAX_TITLE_LENGTH);
  assert.equal(stored.title.endsWith('…'), true);
  assert.equal(long.startsWith(stored.title.slice(0, -1)), true);
});

test('addWork leaves a title already within the bound byte-identical', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'short-add', { title: 'Bound the title at both write doors' });
  assert.equal(listWork(dir).work['short-add'].title, 'Bound the title at both write doors');
});

test('editWork truncates a title patch, and the appended event carries the truncated value', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'long-edit');
  const long = `${'word '.repeat(60).trim()}`;
  editWork(dir, { id: 'long-edit', patch: { title: long } });

  const stored = listWork(dir).work['long-edit'];
  assert.ok(stored.title.length <= MAX_TITLE_LENGTH);

  // The event log is the truth and the view is only its projection, so the
  // two have to agree: bounding the candidate alone would leave replay
  // rebuilding the untruncated title.
  const edits = readRawEvents(dir).filter((e) => e.type === 'work.edit' && e.payload?.id === 'long-edit');
  assert.equal(edits.length, 1);
  assert.equal(edits[0].payload.patch.title, stored.title);
});

test('editWork does not reshape a stored title when the patch does not carry one', () => {
  const dir = tmpDir();
  const long = `${'word '.repeat(60).trim()}`;
  addSampleWork(dir, 'untouched-title', { title: long });
  const afterAdd = listWork(dir).work['untouched-title'].title;

  editWork(dir, { id: 'untouched-title', patch: { verify: 'npm run lint' } });

  assert.equal(listWork(dir).work['untouched-title'].title, afterAdd);
});

// tsk-19j D1/D11: recordGateApprove writes a structured approve record,
// folded into gates[id][gate] — separate from, and alongside, the
// ask/answer pair the SAME lazy `gates[id]` object already carries.
test('recordGateApprove folds into gates[id].<gate> with actor/at/verify, one field per gate, never merged across gates', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'gate-approve-item');

  recordGateApprove(dir, { id: 'gate-approve-item', gate: 'contextApprove', actor: 'bypass', verify: 'npm test' });
  const afterContext = listWork(dir).work; // sanity: does not disturb work.mjs's own view shape
  assert.ok(afterContext['gate-approve-item']);

  const viewAfterContext = listWork(dir);
  assert.equal(viewAfterContext.gates['gate-approve-item'].contextApprove.actor, 'bypass');
  assert.equal(viewAfterContext.gates['gate-approve-item'].contextApprove.verify, 'npm test');
  assert.equal(typeof viewAfterContext.gates['gate-approve-item'].contextApprove.at, 'string');

  recordGateApprove(dir, { id: 'gate-approve-item', gate: 'planApprove', actor: 'human', verify: 'node --test test/x.test.mjs' });
  const viewAfterPlan = listWork(dir);
  // planApprove lands alongside contextApprove, never overwriting it.
  assert.equal(viewAfterPlan.gates['gate-approve-item'].contextApprove.actor, 'bypass');
  assert.equal(viewAfterPlan.gates['gate-approve-item'].planApprove.actor, 'human');
  assert.equal(viewAfterPlan.gates['gate-approve-item'].planApprove.verify, 'node --test test/x.test.mjs');

  // A second approve on the SAME gate overwrites just that gate's own field.
  recordGateApprove(dir, { id: 'gate-approve-item', gate: 'contextApprove', actor: 'human', verify: 'npm run lint' });
  const viewAfterReapprove = listWork(dir);
  assert.equal(viewAfterReapprove.gates['gate-approve-item'].contextApprove.actor, 'human');
  assert.equal(viewAfterReapprove.gates['gate-approve-item'].contextApprove.verify, 'npm run lint');
  assert.equal(viewAfterReapprove.gates['gate-approve-item'].planApprove.actor, 'human'); // untouched
});

test('recordGateApprove rejects a missing id, an unrecognized gate, an unrecognized actor, and an empty verify', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'gate-approve-bad');

  assert.throws(() => recordGateApprove(dir, { gate: 'contextApprove', actor: 'human', verify: 'npm test' }), StoreError);
  assert.throws(
    () => recordGateApprove(dir, { id: 'gate-approve-bad', gate: 'notAGate', actor: 'human', verify: 'npm test' }),
    StoreError,
  );
  assert.throws(
    () => recordGateApprove(dir, { id: 'gate-approve-bad', gate: 'contextApprove', actor: 'robot', verify: 'npm test' }),
    StoreError,
  );
  assert.throws(
    () => recordGateApprove(dir, { id: 'gate-approve-bad', gate: 'contextApprove', actor: 'human', verify: '  ' }),
    StoreError,
  );
});

// tsk-1ne D1/D2: editWork used to re-validate the WHOLE merged candidate on
// every patch, not just the fields the patch touched — so an item carrying
// a field that predates a since-tightened rule (a `stage` value no longer
// in the enum, an over-length `id`, a non-traceable `acceptance` clause)
// could never be edited again for ANY field, including ones that had
// nothing to do with the stale field. These items are constructed via a
// raw `work.add` event (bypassing `addWork`'s own validation, which would
// otherwise reject them outright) — this is exactly how such an item
// actually reaches the store: written before the rule that now rejects it
// existed, or before this schema/log started validating at all (replay
// itself never calls validateWorkShape, per work.mjs's own doc comment).
function addLegacyWork(dir, id, overrides = {}) {
  const logPath = path.join(dir, 'events.jsonl');
  appendEvent(logPath, {
    type: 'work.add',
    payload: {
      id,
      title: `Title ${id}`,
      kind: 'task',
      status: 'todo',
      deps: [],
      risk: 'light',
      refs: [],
      verify: 'npm test',
      tier: 'standard',
      ...overrides,
    },
  });
}

test('editWork succeeds patching an unrelated field on an item whose stage predates the current enum (grandfathered, not re-validated)', () => {
  const dir = tmpDir();
  addLegacyWork(dir, 'legacy-stage', { stage: 'compound-learn' });

  editWork(dir, { id: 'legacy-stage', patch: { description: 'unrelated edit' } });

  const after = listWork(dir).work['legacy-stage'];
  assert.equal(after.description, 'unrelated edit');
  assert.equal(after.stage, 'compound-learn'); // grandfathered, not silently "fixed"
});

test('editWork succeeds patching an unrelated field on an item whose id exceeds the current 30-char length cap (grandfathered)', () => {
  const dir = tmpDir();
  const longId = 'a-legacy-id-far-past-the-thirty-char-cap';
  assert.ok(longId.length > 30);
  addLegacyWork(dir, longId);

  editWork(dir, { id: longId, patch: { description: 'unrelated edit' } });

  assert.equal(listWork(dir).work[longId].description, 'unrelated edit');
});

test('editWork succeeds patching an unrelated field on an item whose stored acceptance clause has non-traceable evidence (grandfathered)', () => {
  const dir = tmpDir();
  addLegacyWork(dir, 'legacy-acceptance', {
    acceptance: [{ text: 'field round-trips', evidence: 'no/such/path.mjs' }],
  });

  editWork(dir, { id: 'legacy-acceptance', patch: { description: 'unrelated edit' } });

  assert.equal(listWork(dir).work['legacy-acceptance'].description, 'unrelated edit');
});

test('editWork still fully validates a field the patch DOES touch, even on an item with other legacy-invalid fields', () => {
  const dir = tmpDir();
  addLegacyWork(dir, 'legacy-deps-relational', { stage: 'compound-learn', deps: [] });

  assert.throws(
    () => editWork(dir, { id: 'legacy-deps-relational', patch: { deps: ['does-not-exist'] } }),
    /depends on unknown id/,
  );
});

test('editWork still refuses a patch containing "id"/"status"/"stage"/"domain" — the fix never widens EDITABLE_FIELDS', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'immutable-fields');

  for (const key of ['id', 'status', 'stage', 'domain']) {
    assert.throws(
      () => editWork(dir, { id: 'immutable-fields', patch: { [key]: 'whatever' } }),
      StoreError,
    );
  }
});
