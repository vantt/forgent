import '../helpers/process-tmp-root.mjs';
import { prepareWorkStore } from '../../src/state/work-event-store.mjs';
import { initializeWorkRepository } from '../helpers/work-store-release.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fork } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { initStore, addPorting, movePorting, listPorting, rebuild } from '../../src/state/porting-store.mjs';
import { PortingError } from '../../src/state/porting.mjs';
import { resolveFgosFile, FGOS_FILE } from '../../src/state/fgos-file-registry.mjs';
import { execFileSync } from 'node:child_process';

const PORTING_STORE_MJS = pathToFileURL(path.resolve(fileURLToPath(import.meta.url), '../../../src/state/porting-store.mjs')).href;

// Every test gets its own mkdtemp dir — never touch the repo's .fgos/.
function tmpDir() {
  return initializeWorkRepository(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-porting-store-')));
}

// The registry-declared cache that holds the porting view and its cursor.
function viewPath(dir) {
  return resolveFgosFile(dir, FGOS_FILE.PORTING_STATE);
}

function readRawPortingEvents(dir) {
  return prepareWorkStore(dir, dir).store.read({ streams: ['project:porting'] }, []).sequence;
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
// peak simultaneous contention against the shared state lock without
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

test('initStore writes the derived porting view into the .fgos cache, with no event log and nothing under <dir>/porting', () => {
  const dir = tmpDir();
  initStore(dir);
  assert.ok(!fs.existsSync(path.join(dir, 'porting')));
  assert.ok(fs.existsSync(viewPath(dir)));
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
  const raw = readRawPortingEvents(dir).map(JSON.stringify);
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
  fs.writeFileSync(viewPath(dir), `${JSON.stringify({ porting: {} })}\n`, 'utf8');
  const view = listPorting(dir);
  assert.ok(view.porting.p1, 'listPorting must rebuild from the log, ignoring the stale view file on disk');
});

test('write order is append-then-rebuild: a simulated crash between the two steps recovers the correct view from the log alone via rebuild()', () => {
  const dir = tmpDir();
  initStore(dir);

  // Simulate a crash: append the event directly (bypassing addPorting's own
  // view refresh), so the cache is left exactly as initStore wrote it —
  // stale relative to the log.
  prepareWorkStore(dir, dir).store.append('project:porting', [{ eventType: 'porting.add', schemaVersion: 1, payload: { id: 'crash-p1', status: 'candidate', title: 'Crash test' }, ts: new Date().toISOString() }], {}, 'fixture', []);
  const staleView = JSON.parse(fs.readFileSync(viewPath(dir), 'utf8'));
  assert.deepEqual(staleView.porting, {}, 'view is stale immediately after the simulated crash');

  const recovered = rebuild(dir);
  assert.equal(recovered.porting['crash-p1'].status, 'candidate');
  assert.equal(recovered.porting['crash-p1'].title, 'Crash test');

  const persisted = JSON.parse(fs.readFileSync(viewPath(dir), 'utf8'));
  assert.deepEqual(persisted.porting, recovered.porting, 'rebuild() must also persist the recovered view to the cache');
});

test('porting-store never reads or writes the root-level events.jsonl/state.json', () => {
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
  assert.ok(!fs.existsSync(resolveFgosFile(dir, FGOS_FILE.STATE)), 'porting-store must never write Work\'s view cache');
});

test('a porting mutation leaves git status clean and keeps view and cursor in the untracked cache, even when dir is a tracked directory', () => {
  const main = tmpDir();
  const repo = path.dirname(main);
  const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' });
  const stateDir = path.join(repo, 'docs', 'distillery', 'state');
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(path.join(repo, '.gitignore'), '.fgos/\n');
  fs.writeFileSync(path.join(stateDir, 'keep.txt'), 'tracked\n');
  git('add', '-A');
  git('commit', '-q', '-m', 'fixture');
  assert.equal(git('status', '--porcelain'), '');

  addPorting(stateDir, { id: 'p1', title: 'Widget' });
  movePorting(stateDir, { id: 'p1', to: 'planned', expectedStatus: 'candidate' });

  assert.equal(git('status', '--porcelain'), '', 'a porting mutation must not dirty the working tree');
  assert.deepEqual(fs.readdirSync(stateDir), ['keep.txt'], 'nothing is written beside the caller\'s dir');
  const cached = JSON.parse(fs.readFileSync(viewPath(main), 'utf8'));
  assert.equal(cached.porting.p1.status, 'planned');
  assert.ok(cached.cursor, 'the cursor lives only in the untracked cache');
  assert.equal(listPorting(stateDir).porting.p1.status, 'planned');
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
    4, // tsk-597: batch to reduce peak state lock contention under load —
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
    4, // tsk-597: batch to reduce peak state lock contention under load — see the addPorting race test above for the same reasoning.
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
// withStateTx, in its own unlocked critical section. Two processes
// racing DIFFERENT ids could interleave their unlocked rebuild-and-
// overwrite-the-view calls, letting the process with the staler log read
// finish (and win) last — silently overwriting a fresher view with
// one missing that other mutation.
test('concurrent movePorting calls on DIFFERENT ids never lose a write to the view cache (tsk-1q5)', async () => {
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
    2, // batch to reduce peak state lock contention under load — see raceAcrossProcesses' own comment
  );

  assert.deepEqual(results, Array(N_PROC).fill({ ok: true }), 'every concurrent movePorting loop on distinct ids must succeed (no CAS conflict expected across different ids)');

  const persisted = JSON.parse(fs.readFileSync(viewPath(dir), 'utf8'));
  const fresh = listPorting(dir);
  for (const ids of idLists) {
    for (const id of ids) {
      assert.equal(persisted.porting[id].status, 'planned', `${id} must show status "planned" in the persisted view, not silently lost to a racing writer`);
    }
  }
  assert.deepEqual(persisted.porting, fresh.porting, 'persisted view must match a fresh rebuild of the log — any mismatch means a concurrent refreshView race overwrote a fresher view with a staler one');
});
