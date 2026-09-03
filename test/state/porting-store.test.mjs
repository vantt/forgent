import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { initStore, addPorting, movePorting, listPorting, rebuild } from '../../src/state/porting-store.mjs';
import { PortingError } from '../../src/state/porting.mjs';
import { appendEvent } from '../../src/state/events.mjs';

const PORTING_STORE_MJS = path.resolve(fileURLToPath(import.meta.url), '../../../src/state/porting-store.mjs');

// Every test gets its own mkdtemp dir — never touch the repo's .fgos/.
function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-porting-store-'));
}

function readRawPortingEvents(dir) {
  const logPath = path.join(dir, 'porting', 'events.jsonl');
  return fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line));
}

// Spawns N real child OS processes that all call `storeCall` (a snippet of
// source referencing `dir`) at a synchronized start instant, so their
// read-check-append windows genuinely overlap — mirrors test/state/
// store.test.mjs's own raceAcrossProcesses technique (tsk-1jp): in-process
// concurrency can never expose this class of bug, since one event loop
// serializes calls for free.
// `extraArgvPerChild` (tsk-1q5, optional, backward-compatible — both
// pre-existing call sites below pass none): mirrors store.test.mjs's own
// raceAcrossProcesses extension — one value per child, available inside
// `storeCall` as `process.argv[4]`, so a race test can give each child a
// DISTINCT id instead of racing the same one.
//
// `batchSize` (optional, defaults to `nProcesses` — every existing
// call site below is byte-for-byte unaffected unless it opts in): mirrors
// store.test.mjs's own raceAcrossProcesses extension — caps how many child
// processes are synchronized to the SAME start instant at once, reducing
// peak simultaneous contention against the shared events.lock without
// changing total operation count or the cross-process race semantics under
// test (docs/history/tsk-4fx-concurrency-test-lock-timeout-flake/RESEARCH.md).
async function raceAcrossProcesses(dir, storeCall, nProcesses, extraArgvPerChild = null, batchSize = nProcesses) {
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-porting-store-race-'));
  const childScript = `
import { addPorting, movePorting } from ${JSON.stringify(PORTING_STORE_MJS)};
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

test('initStore creates <dir>/porting/events.jsonl and state.json, never touching <dir>\'s own root', () => {
  const dir = tmpDir();
  initStore(dir);
  assert.ok(fs.existsSync(path.join(dir, 'porting', 'events.jsonl')));
  assert.ok(fs.existsSync(path.join(dir, 'porting', 'state.json')));
  assert.ok(!fs.existsSync(path.join(dir, 'events.jsonl')));
  assert.ok(!fs.existsSync(path.join(dir, 'state.json')));
});

test('addPorting seeds a candidate row, forcing status to candidate regardless of caller-supplied status', () => {
  const dir = tmpDir();
  const { view } = addPorting(dir, { id: 'p1', title: 'Widget', status: 'ported' });
  assert.equal(view.porting.p1.status, 'candidate');
  assert.equal(view.porting.p1.title, 'Widget');
});

test('addPorting requires a non-empty "id"', () => {
  const dir = tmpDir();
  assert.throws(
    () => addPorting(dir, {}),
    (err) => err instanceof PortingError && err.category === 'validation',
  );
  assert.throws(
    () => addPorting(dir, { id: '' }),
    (err) => err instanceof PortingError && err.category === 'validation',
  );
});

test('addPorting rejects a duplicate id as validation, checked BEFORE the event is appended', () => {
  const dir = tmpDir();
  addPorting(dir, { id: 'dup' });
  assert.throws(
    () => addPorting(dir, { id: 'dup' }),
    (err) => err instanceof PortingError && err.category === 'validation',
  );
  const raw = fs.readFileSync(path.join(dir, 'porting', 'events.jsonl'), 'utf8').trim().split('\n');
  assert.equal(raw.length, 1, 'the rejected duplicate must never reach the log');
});

test('movePorting delegates transition legality to transitionPorting — an illegal edge surfaces as precondition, not duplicated logic here', () => {
  const dir = tmpDir();
  addPorting(dir, { id: 'p1' });
  assert.throws(
    () => movePorting(dir, { id: 'p1', to: 'in-progress' }),
    (err) => err instanceof PortingError && err.category === 'precondition',
  );
});

test('movePorting CAS mismatch surfaces as conflict — delegated to transitionPorting, not duplicated here', () => {
  const dir = tmpDir();
  addPorting(dir, { id: 'p1' });
  assert.throws(
    () => movePorting(dir, { id: 'p1', to: 'planned', expectedStatus: 'planned' }),
    (err) => err instanceof PortingError && err.category === 'conflict',
  );
});

test('movePorting on a legal edge appends the event and the view reflects the new status', () => {
  const dir = tmpDir();
  addPorting(dir, { id: 'p1' });
  const { view } = movePorting(dir, { id: 'p1', to: 'planned', expectedStatus: 'candidate' });
  assert.equal(view.porting.p1.status, 'planned');
});

test('movePorting on an id never added throws PortingError(validation)', () => {
  const dir = tmpDir();
  assert.throws(
    () => movePorting(dir, { id: 'ghost', to: 'planned' }),
    (err) => err instanceof PortingError && err.category === 'validation',
  );
});

test('listPorting always rebuilds fresh from the log, never off a stale view file', () => {
  const dir = tmpDir();
  addPorting(dir, { id: 'p1' });
  fs.writeFileSync(path.join(dir, 'porting', 'state.json'), `${JSON.stringify({ porting: {} })}\n`, 'utf8');
  const view = listPorting(dir);
  assert.ok(view.porting.p1, 'listPorting must rebuild from the log, ignoring the stale view file on disk');
});

test('write order is append-then-rebuild: a simulated crash between the two steps recovers the correct view from the log alone via rebuild()', () => {
  const dir = tmpDir();
  initStore(dir);
  const logPath = path.join(dir, 'porting', 'events.jsonl');

  // Simulate a crash: append the event directly (bypassing addPorting's own
  // view refresh), so state.json is left exactly as initStore wrote it —
  // stale relative to the log.
  appendEvent(logPath, { type: 'porting.add', payload: { id: 'crash-p1', status: 'candidate', title: 'Crash test' } });
  const staleView = JSON.parse(fs.readFileSync(path.join(dir, 'porting', 'state.json'), 'utf8'));
  assert.deepEqual(staleView.porting, {}, 'view is stale immediately after the simulated crash');

  const recovered = rebuild(dir);
  assert.equal(recovered.porting['crash-p1'].status, 'candidate');
  assert.equal(recovered.porting['crash-p1'].title, 'Crash test');

  const persisted = JSON.parse(fs.readFileSync(path.join(dir, 'porting', 'state.json'), 'utf8'));
  assert.deepEqual(persisted, recovered, 'rebuild() must also persist the recovered view to state.json');
});

test('porting-store never reads or writes the existing .fgos-shaped root events.jsonl/state.json — only the nested porting/ subdir', () => {
  const dir = tmpDir();
  fs.mkdirSync(dir, { recursive: true });
  const rootLogContents = '{"seq":1,"type":"work.add","payload":{"id":"w1"}}\n';
  fs.writeFileSync(path.join(dir, 'events.jsonl'), rootLogContents, 'utf8');

  addPorting(dir, { id: 'p1' });

  assert.equal(
    fs.readFileSync(path.join(dir, 'events.jsonl'), 'utf8'),
    rootLogContents,
    'the root-level work-item log must be left byte-for-byte untouched',
  );
  assert.ok(!fs.existsSync(path.join(dir, 'state.json')), 'porting-store must never write a root-level state.json');
});

test('addPorting under concurrent OS processes racing the SAME id: exactly one succeeds, the rest see "already exists", and the log has exactly one porting.add (tsk-1jp)', async () => {
  const dir = tmpDir();
  initStore(dir);

  const N = 8;
  const results = await raceAcrossProcesses(
    dir,
    `addPorting(dir, { id: 'race-add', title: 'Race Add' });`,
    N,
    null,
    4, // tsk-597: batch to reduce peak events.lock contention under load —
    // same mechanism as the "on DIFFERENT ids" test below and its
    // store.test.mjs sibling (tsk-4fx); still a genuine simultaneous
    // race within each batch of 4, so the "exactly one winner" assertion
    // below is unaffected — see raceAcrossProcesses' own comment.
  );

  const succeeded = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  assert.equal(succeeded.length, 1, `exactly one of ${N} concurrent addPorting calls must win the race`);
  assert.equal(failed.length, N - 1, 'every other concurrent addPorting call must fail its precondition');
  for (const f of failed) {
    assert.equal(f.category, 'validation', 'a losing racer must fail as validation (already exists), not crash or hang');
  }

  const addEvents = readRawPortingEvents(dir).filter((e) => e.type === 'porting.add' && e.payload?.id === 'race-add');
  assert.equal(addEvents.length, 1, 'the log must carry exactly one porting.add event for the raced id, never two conflicting ones');
});

test('movePorting under concurrent OS processes racing the SAME expectedStatus CAS on the SAME id: exactly one succeeds, the rest conflict, and the log has exactly one matching porting.move (tsk-1jp)', async () => {
  const dir = tmpDir();
  initStore(dir);
  addPorting(dir, { id: 'race-move' });
  movePorting(dir, { id: 'race-move', to: 'planned', expectedStatus: 'candidate' });
  movePorting(dir, { id: 'race-move', to: 'in-progress', expectedStatus: 'planned' });

  const N = 8;
  const results = await raceAcrossProcesses(
    dir,
    `movePorting(dir, { id: 'race-move', to: 'ported', expectedStatus: 'in-progress' });`,
    N,
    null,
    4, // tsk-597: batch to reduce peak events.lock contention under load — see the addPorting race test above for the same reasoning.
  );

  const succeeded = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  assert.equal(succeeded.length, 1, `exactly one of ${N} concurrent movePorting CAS calls must win the race`);
  assert.equal(failed.length, N - 1, 'every other concurrent movePorting CAS call must conflict');
  for (const f of failed) {
    assert.equal(f.category, 'conflict', 'a losing racer must fail as conflict (stale CAS), not crash or hang');
  }

  const moveEvents = readRawPortingEvents(dir).filter(
    (e) => e.type === 'porting.move' && e.payload?.id === 'race-move' && e.payload?.to === 'ported',
  );
  assert.equal(moveEvents.length, 1, 'the log must carry exactly one matching porting.move event, never two');
});

// Cross-process regression (tsk-1q5, same fix as store.test.mjs's sibling
// test): before this fix, refreshView(dir) ran AFTER releasing
// withEventsLock, in its own unlocked critical section. Two processes
// racing DIFFERENT ids could interleave their unlocked rebuild-and-
// overwrite-state.json calls, letting the process with the staler log read
// finish (and win) last — silently overwriting a fresher state.json with
// one missing that other mutation.
test('concurrent movePorting calls on DIFFERENT ids never lose a write to state.json (tsk-1q5)', async () => {
  const dir = tmpDir();
  initStore(dir);
  const N_PROC = 8;
  const IDS_PER_PROC = 5; // volume per process — same technique as store.test.mjs's sibling test (many refreshView calls per process, back-to-back, no delay, to maximize scheduler-preemption overlap between processes' unlocked writes)
  const idLists = Array.from({ length: N_PROC }, (_, p) =>
    Array.from({ length: IDS_PER_PROC }, (_, j) => `race-view-${p}-${j}`),
  );
  for (const ids of idLists) {
    for (const id of ids) {
      addPorting(dir, { id });
    }
  }

  const results = await raceAcrossProcesses(
    dir,
    `const ids = process.argv[4].split(',');
for (const id of ids) {
  movePorting(dir, { id, to: 'planned', expectedStatus: 'candidate' });
}`,
    N_PROC,
    idLists.map((ids) => ids.join(',')),
    2, // batch to reduce peak events.lock contention under load — see raceAcrossProcesses' own comment
  );

  assert.deepEqual(results, Array(N_PROC).fill({ ok: true }), 'every concurrent movePorting loop on distinct ids must succeed (no CAS conflict expected across different ids)');

  const persisted = JSON.parse(fs.readFileSync(path.join(dir, 'porting', 'state.json'), 'utf8'));
  const fresh = listPorting(dir);
  for (const ids of idLists) {
    for (const id of ids) {
      assert.equal(persisted.porting[id].status, 'planned', `${id} must show status "planned" in the persisted state.json, not silently lost to a losing refreshView race`);
    }
  }
  assert.deepEqual(persisted.porting, fresh.porting, 'persisted state.json must match a fresh rebuild of the log — any mismatch means a concurrent refreshView race overwrote a fresher view with a staler one');
});
