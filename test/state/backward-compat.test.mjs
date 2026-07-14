// test/state/backward-compat.test.mjs — D7b backward-compatible replay.
//
// Fixture generation recipe (test/fixtures/phase1-events.jsonl, committed,
// NEVER regenerated or hand-edited after this — D7a: the fixture is the
// immutable "old log" under test):
//
//   1. From the repo root: `git worktree add <tmp>/p1 31c1300` — 31c1300 is
//      the last commit before Phase 2 touched the schema
//      (phase-1-state-layer-5, pure Phase 1 shape: no `tier`, no `v`).
//   2. In a SEPARATE temp cwd (never the repo, never the worktree dir), ran
//      that checkout's bin/fgos.mjs directly by absolute path through a
//      real journey:
//        node <tmp>/p1/bin/fgos.mjs init
//        node <tmp>/p1/bin/fgos.mjs add setup-repo    --title "Setup repo" --kind chore --risk low --verify "npm test"
//        node <tmp>/p1/bin/fgos.mjs add design-api    --title "Thiết kế API — 设计" --kind design --risk medium \
//                                                       --refs docs/spec.md --verify "review passes" --deps setup-repo
//        node <tmp>/p1/bin/fgos.mjs add build-feature --title "Build feature" --kind feature --risk high \
//                                                       --verify "npm test" --deps design-api
//        node <tmp>/p1/bin/fgos.mjs move setup-repo --to doing --expect todo
//        node <tmp>/p1/bin/fgos.mjs move setup-repo --to done  --expect doing
//        node <tmp>/p1/bin/fgos.mjs move design-api --to doing --expect todo
//        node <tmp>/p1/bin/fgos.mjs decision --text "Chose fgos naming convention"
//   3. Copied the resulting `<fgos-cwd>/.fgos/events.jsonl` verbatim to
//      test/fixtures/phase1-events.jsonl.
//   4. `git worktree remove --force <tmp>/p1` from the repo root (removing
//      from inside a non-git dir fails).
//
//   Note: the 31c1300 binary prints "event #undefined" for each `move`
//   (moveWork's CLI message reads .seq off the pre-append event, which the
//   FSM returns without one) — purely cosmetic; the `seq` values actually
//   written to the log are correct, as asserted below.
//
// None of the 7 resulting events carry `tier` or `v` — exactly the shape
// D7b's default-injection (src/state/replay.mjs) has to handle, alone and
// mixed with new (v-carrying) events on the same log.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendEvent } from '../../src/state/events.mjs';
import { foldEvents, rebuildView } from '../../src/state/replay.mjs';
import { listWork } from '../../src/state/store.mjs';
import { DEFAULTS, SCHEMA_VERSION } from '../../src/state/work.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = path.join(__dirname, '..', 'fixtures', 'phase1-events.jsonl');
const FIXTURE_RAW_AT_LOAD = fs.readFileSync(FIXTURE_PATH, 'utf8');

// Every test gets its own mkdtemp dir — never touch the repo's .fgos/ and
// never write anywhere near the fixture itself.
function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-backward-compat-'));
}

const EXPECTED_OLD_VIEW = {
  work: {
    'setup-repo': {
      id: 'setup-repo',
      title: 'Setup repo',
      kind: 'chore',
      status: 'done',
      deps: [],
      risk: 'low',
      refs: [],
      verify: 'npm test',
      tier: 'standard',
    },
    'design-api': {
      id: 'design-api',
      title: 'Thiết kế API — 设计',
      kind: 'design',
      status: 'doing',
      deps: ['setup-repo'],
      risk: 'medium',
      refs: ['docs/spec.md'],
      verify: 'review passes',
      tier: 'standard',
    },
    'build-feature': {
      id: 'build-feature',
      title: 'Build feature',
      kind: 'feature',
      status: 'todo',
      deps: ['design-api'],
      risk: 'high',
      refs: [],
      verify: 'npm test',
      tier: 'standard',
    },
  },
  decisions: [{ text: 'Chose fgos naming convention', ts: '2026-07-14T06:17:16.363Z' }],
};

test('fixture carries the expected 7 events, none with tier/v (old log, pre-Phase-2 shape)', () => {
  const lines = FIXTURE_RAW_AT_LOAD.trim().split('\n');
  assert.equal(lines.length, 7);
  for (const line of lines) {
    const event = JSON.parse(line);
    assert.equal('v' in event, false, `event seq ${event.seq} must not carry v`);
    if (event.type === 'work.add') {
      assert.equal('tier' in event.payload, false, `work.add payload for ${event.payload.id} must not carry tier`);
    }
  }
});

test('rebuildView on the fixture alone injects DEFAULTS.tier and folds to the expected view', () => {
  const view = rebuildView(FIXTURE_PATH);
  assert.deepEqual(view, EXPECTED_OLD_VIEW);
});

test('foldEvents on the fixture parsed by hand matches rebuildView (same fold, two entry points)', () => {
  const events = FIXTURE_RAW_AT_LOAD.trim()
    .split('\n')
    .map((line) => JSON.parse(line));
  assert.deepEqual(foldEvents(events), EXPECTED_OLD_VIEW);
});

test('rebuilding the fixture twice is deterministic (D3)', () => {
  const first = rebuildView(FIXTURE_PATH);
  const second = rebuildView(FIXTURE_PATH);
  assert.deepEqual(first, second);
});

test('listWork (store, read-only) folds the fixture the same way as rebuildView', () => {
  const dir = tmpDir();
  const fgosDir = path.join(dir, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });
  fs.copyFileSync(FIXTURE_PATH, path.join(fgosDir, 'events.jsonl'));

  const view = listWork(fgosDir);
  assert.deepEqual(view, EXPECTED_OLD_VIEW);
});

test('a log mixing old (fixture) events followed by new (v-carrying) events folds deterministically', () => {
  const dir = tmpDir();
  const logPath = path.join(dir, 'events.jsonl');
  fs.copyFileSync(FIXTURE_PATH, logPath);

  // New events appended on top of the old log: one item declares its own
  // tier explicitly, one omits it (still must default), and a D5
  // proposed-state move lands on a pre-existing (old) item.
  appendEvent(logPath, {
    type: 'work.add',
    payload: {
      id: 'ship-feature',
      title: 'Ship feature',
      kind: 'feature',
      status: 'todo',
      deps: ['build-feature'],
      risk: 'medium',
      refs: [],
      verify: 'npm test',
      tier: 'heavy',
    },
  });
  appendEvent(logPath, {
    type: 'work.add',
    payload: {
      id: 'write-docs',
      title: 'Write docs',
      kind: 'docs',
      status: 'todo',
      deps: [],
      risk: 'low',
      refs: [],
      verify: 'docs review',
      // tier intentionally omitted — must still default.
    },
  });
  appendEvent(logPath, { type: 'work.move', payload: { id: 'build-feature', from: 'todo', to: 'doing' } });
  appendEvent(logPath, { type: 'work.move', payload: { id: 'build-feature', from: 'doing', to: 'proposed' } });

  const first = rebuildView(logPath);
  const second = rebuildView(logPath);
  assert.deepEqual(first, second);

  // Old items retain their defaulted tier alongside their updated status.
  assert.equal(first.work['setup-repo'].tier, 'standard');
  assert.equal(first.work['build-feature'].status, 'proposed');
  assert.equal(first.work['build-feature'].tier, 'standard');

  // New items: an explicit tier survives untouched; an omitted one still defaults.
  assert.equal(first.work['ship-feature'].tier, 'heavy');
  assert.equal(first.work['write-docs'].tier, 'standard');

  // On disk: the original 7 lines still carry no v; every appended line does.
  const rawLines = fs
    .readFileSync(logPath, 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
  assert.equal(rawLines.length, 7 + 4);
  for (const event of rawLines.slice(0, 7)) assert.equal('v' in event, false);
  for (const event of rawLines.slice(7)) assert.equal(event.v, SCHEMA_VERSION);
});

test('a pure new log (every event carries v) replays correctly, not just old-alone or mixed', () => {
  const dir = tmpDir();
  const logPath = path.join(dir, 'events.jsonl');

  appendEvent(logPath, {
    type: 'work.add',
    payload: { id: 'a', title: 'A', kind: 'chore', status: 'todo', deps: [], risk: 'low', refs: [], verify: 'npm test' },
  });
  appendEvent(logPath, {
    type: 'work.add',
    payload: {
      id: 'b',
      title: 'B',
      kind: 'chore',
      status: 'todo',
      deps: ['a'],
      risk: 'low',
      refs: [],
      verify: 'npm test',
      tier: 'light',
    },
  });
  appendEvent(logPath, { type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing' } });
  appendEvent(logPath, { type: 'work.move', payload: { id: 'a', from: 'doing', to: 'proposed' } });
  appendEvent(logPath, { type: 'work.move', payload: { id: 'a', from: 'proposed', to: 'done' } });
  appendEvent(logPath, { type: 'decision', payload: { text: 'all-new log' } });

  const view = rebuildView(logPath);
  assert.equal(view.work.a.status, 'done');
  assert.equal(view.work.a.tier, DEFAULTS.tier);
  assert.equal(view.work.b.tier, 'light');
  assert.equal(view.decisions.length, 1);

  const rawLines = fs
    .readFileSync(logPath, 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
  assert.equal(rawLines.length, 6);
  for (const event of rawLines) assert.equal(event.v, SCHEMA_VERSION);

  // Deterministic on a pure-new log too, same as the old and mixed cases.
  assert.deepEqual(view, rebuildView(logPath));
});

test('the fixture file itself is never modified by any test in this suite', () => {
  assert.equal(fs.readFileSync(FIXTURE_PATH, 'utf8'), FIXTURE_RAW_AT_LOAD);
});
