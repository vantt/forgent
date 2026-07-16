import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { addOutcome, addFriction } from '../../src/state/store.mjs';

// The CLI under test, resolved by absolute path so it works regardless of
// the spawned process's cwd (which every test below points at a fresh
// mkdtemp dir — never the repo's own `.fgos/`).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');

function tmpCwd() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-cli-'));
}

function run(cwd, args) {
  return spawnSync(process.execPath, [FGOS, ...args], { cwd, encoding: 'utf8' });
}

function logPath(cwd) {
  return path.join(cwd, '.fgos', 'events.jsonl');
}

function viewPath(cwd) {
  return path.join(cwd, '.fgos', 'state.json');
}

function eventLines(cwd) {
  if (!fs.existsSync(logPath(cwd))) return [];
  return fs
    .readFileSync(logPath(cwd), 'utf8')
    .split('\n')
    .filter(Boolean);
}

function stateView(cwd) {
  return JSON.parse(fs.readFileSync(viewPath(cwd), 'utf8'));
}

function addOk(cwd, id, extra = {}) {
  const flags = ['--title', extra.title ?? `Title ${id}`, '--kind', extra.kind ?? 'task', '--risk', extra.risk ?? 'low', '--verify', extra.verify ?? 'npm test'];
  return run(cwd, ['add', id, ...flags]);
}

test('init creates .fgos/ with an empty log and a rebuilt (empty) view, exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['init']);
  assert.equal(result.status, 0);
  assert.ok(fs.existsSync(logPath(cwd)));
  assert.deepEqual(stateView(cwd), { work: {}, decisions: [] });
});

test('add creates exactly one work.add event and the view reflects the new item, exit 0', () => {
  const cwd = tmpCwd();
  const before = eventLines(cwd).length;
  const result = addOk(cwd, 'build-cli', { title: 'Build CLI', kind: 'feature', risk: 'medium', verify: "node --test 'test/cli/*.test.mjs'" });
  assert.equal(result.status, 0);
  assert.equal(eventLines(cwd).length, before + 1);

  const view = stateView(cwd);
  assert.equal(view.work['build-cli'].status, 'todo');
  assert.equal(view.work['build-cli'].title, 'Build CLI');
  assert.equal(view.work['build-cli'].kind, 'feature');
  assert.equal(view.work['build-cli'].risk, 'medium');
});

test('add with a missing required field (--verify) is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['add', 'no-verify', '--title', 'X', '--kind', 'task', '--risk', 'low']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, 0);
});

test('add with an invalid (non kebab-case) id is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = addOk(cwd, 'Not_Kebab');
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, 0);
});

test('add with a duplicate id is rejected as validation, exit 4, no extra event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'dup-id');
  const before = eventLines(cwd).length;
  const result = addOk(cwd, 'dup-id');
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});

test('add with an unknown dep id is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['add', 'has-bad-dep', '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--deps', 'ghost-dep']);
  assert.equal(result.status, 4);
});

test('move applies a legal transition, appends one event, and updates the view, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'movable');
  const before = eventLines(cwd).length;
  const result = run(cwd, ['move', 'movable', '--to', 'doing']);
  assert.equal(result.status, 0);
  assert.equal(eventLines(cwd).length, before + 1);
  assert.equal(stateView(cwd).work.movable.status, 'doing');
});

test('move rejects an illegal transition as precondition, exit 2, no event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'stuck-todo');
  const before = eventLines(cwd).length;
  const result = run(cwd, ['move', 'stuck-todo', '--to', 'done']);
  assert.equal(result.status, 2);
  assert.equal(eventLines(cwd).length, before);
});

test('move rejects a CAS expected-status mismatch as conflict, exit 3, no event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'cas-item');
  run(cwd, ['move', 'cas-item', '--to', 'doing']);
  const before = eventLines(cwd).length;
  const result = run(cwd, ['move', 'cas-item', '--to', 'done', '--expect', 'todo']);
  assert.equal(result.status, 3);
  assert.equal(eventLines(cwd).length, before);
  assert.equal(stateView(cwd).work['cas-item'].status, 'doing');
});

test('move on a nonexistent id is rejected as validation (not-found), exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['move', 'never-added', '--to', 'doing']);
  assert.equal(result.status, 4);
});

test('move with a bare --to (no value) is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'bare-to');
  const before = eventLines(cwd).length;
  const result = run(cwd, ['move', 'bare-to', '--to']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});

test('move with an empty --expect "" is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'empty-expect');
  const before = eventLines(cwd).length;
  const result = run(cwd, ['move', 'empty-expect', '--to', 'doing', '--expect', '']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});

test('move reports the real event seq in its message, not "undefined"', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'seq-check'); // event #1
  const result = run(cwd, ['move', 'seq-check', '--to', 'doing']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /event #2\b/);
  assert.doesNotMatch(result.stdout, /event #undefined/);
});

test('decision logs one event and appears in the view, exit 0', () => {
  const cwd = tmpCwd();
  run(cwd, ['init']);
  const before = eventLines(cwd).length;
  const result = run(cwd, ['decision', '--text', 'locked D5 naming']);
  assert.equal(result.status, 0);
  assert.equal(eventLines(cwd).length, before + 1);
  assert.equal(stateView(cwd).decisions.length, 1);
  assert.equal(stateView(cwd).decisions[0].text, 'locked D5 naming');
});

test('decision without --text is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  run(cwd, ['init']);
  const before = eventLines(cwd).length;
  const result = run(cwd, ['decision']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});

test('list prints the current view as parseable JSON, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'listed');
  const result = run(cwd, ['list']);
  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.ok(parsed.work.listed);
});

test('rebuild reconstructs state.json from the log alone after the view file is deleted', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'a');
  addOk(cwd, 'b');
  run(cwd, ['move', 'a', '--to', 'doing']);
  const before = stateView(cwd);

  fs.rmSync(viewPath(cwd));
  assert.ok(!fs.existsSync(viewPath(cwd)));

  const result = run(cwd, ['rebuild']);
  assert.equal(result.status, 0);
  assert.deepEqual(stateView(cwd), before);
});

test('rebuild reconstructs state.json from the log alone when the view file still exists but is stale (not deleted)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'a');
  addOk(cwd, 'b');
  run(cwd, ['move', 'a', '--to', 'doing']);
  const freshFromLog = stateView(cwd);

  // Corrupt the view IN PLACE (file still exists) rather than deleting it:
  // wrong status for "a" and a missing item "b" — the exact failure mode
  // the risk map called out (a stale-but-present view), not a removed file.
  const stale = {
    work: {
      a: { ...freshFromLog.work.a, status: 'todo' },
    },
    decisions: [],
  };
  fs.writeFileSync(viewPath(cwd), `${JSON.stringify(stale, null, 2)}\n`, 'utf8');
  assert.ok(fs.existsSync(viewPath(cwd)));
  assert.notDeepEqual(stateView(cwd), freshFromLog);

  const result = run(cwd, ['rebuild']);
  assert.equal(result.status, 0);
  assert.deepEqual(stateView(cwd), freshFromLog);
});

test('done is terminal via the real CLI: moving out of done is refused as precondition, exit 2, no event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'terminal-item');
  run(cwd, ['move', 'terminal-item', '--to', 'doing']);
  run(cwd, ['move', 'terminal-item', '--to', 'done']);
  const before = eventLines(cwd).length;

  const result = run(cwd, ['move', 'terminal-item', '--to', 'doing']);
  assert.equal(result.status, 2);
  assert.equal(eventLines(cwd).length, before);
  assert.equal(stateView(cwd).work['terminal-item'].status, 'done');
});

test('a mutation (add) attempted on an already-corrupt log is refused as corrupt-log, exit 5, no event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'before-corruption');
  fs.appendFileSync(logPath(cwd), 'not valid json\n', 'utf8');
  const before = eventLines(cwd).length;

  const result = run(cwd, ['add', 'after-corruption', '--title', 'X', '--kind', 'task', '--risk', 'low', '--verify', 'x']);
  assert.equal(result.status, 5);
  assert.equal(eventLines(cwd).length, before);
});

test('a mutation (move) attempted on an already-corrupt log is refused as corrupt-log, exit 5, no event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'move-target');
  fs.appendFileSync(logPath(cwd), 'not valid json\n', 'utf8');
  const before = eventLines(cwd).length;

  const result = run(cwd, ['move', 'move-target', '--to', 'doing']);
  assert.equal(result.status, 5);
  assert.equal(eventLines(cwd).length, before);
});

test('a dependency cycle is impossible to construct: add requires deps to already exist, so both sides of an attempted cycle are rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  // "a" depends on "b", but "b" does not exist yet — validation, exit 4.
  const firstAttempt = run(cwd, ['add', 'a', '--title', 'A', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--deps', 'b']);
  assert.equal(firstAttempt.status, 4);
  assert.equal(eventLines(cwd).length, 0);

  // "b" depends on "a", but "a" was never added (the attempt above failed
  // before writing anything) — so this is also validation, exit 4. There is
  // no sequence of `add` calls that can ever produce a cycle, because a dep
  // must reference an id that already exists at add-time.
  const secondAttempt = run(cwd, ['add', 'b', '--title', 'B', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--deps', 'a']);
  assert.equal(secondAttempt.status, 4);
  assert.equal(eventLines(cwd).length, 0);
});

test('a corrupt trailing line in the event log is reported as corrupt-log, exit 5', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'before-corruption');
  fs.appendFileSync(logPath(cwd), 'not valid json\n', 'utf8');

  const result = run(cwd, ['list']);
  assert.equal(result.status, 5);
});

test('an unknown verb is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['bogus-verb']);
  assert.equal(result.status, 4);
});

test('add with no id at all is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['add']);
  assert.equal(result.status, 4);
});

// --- D6 tier: --tier on `add` (phase-2-routing-3) ---

test('add with --tier records the given tier explicitly in the view, exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['add', 'heavy-item', '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--tier', 'heavy']);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['heavy-item'].tier, 'heavy');
});

test('add without --tier defaults to work.mjs DEFAULTS.tier ("standard"), exit 0', () => {
  const cwd = tmpCwd();
  const result = addOk(cwd, 'default-tier-item');
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['default-tier-item'].tier, 'standard');
});

test('add explicitly writes the tier into the work.add event payload itself, not only the folded view', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'explicit-tier-item');
  const lines = eventLines(cwd);
  const addEvent = JSON.parse(lines[lines.length - 1]);
  assert.equal(addEvent.type, 'work.add');
  assert.equal(addEvent.payload.tier, 'standard');
});

test('add with a --tier outside the TIERS domain is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  const before = eventLines(cwd).length;
  const result = run(cwd, ['add', 'bad-tier-item', '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--tier', 'extreme']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});

test('add with a bare --tier (no value) is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  const before = eventLines(cwd).length;
  const result = run(cwd, ['add', 'bare-tier-item', '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--tier']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});

// --- D5 proposed: new edges + --reason on `move` (phase-2-routing-3) ---

function toProposed(cwd, id) {
  addOk(cwd, id);
  run(cwd, ['move', id, '--to', 'doing']);
  return run(cwd, ['move', id, '--to', 'proposed']);
}

test('move doing -> proposed applies via the real CLI, exit 0', () => {
  const cwd = tmpCwd();
  const result = toProposed(cwd, 'goal-checked');
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['goal-checked'].status, 'proposed');
});

test('move proposed -> done (approval) applies via the real CLI, exit 0', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'approved-item');
  const result = run(cwd, ['move', 'approved-item', '--to', 'done']);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['approved-item'].status, 'done');
});

test('move proposed -> todo (rejection) without --reason is refused as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'no-reason-item');
  const before = eventLines(cwd).length;
  const result = run(cwd, ['move', 'no-reason-item', '--to', 'todo']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
  assert.equal(stateView(cwd).work['no-reason-item'].status, 'proposed');
});

test('move proposed -> todo with an empty --reason "" is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'empty-reason-item');
  const before = eventLines(cwd).length;
  const result = run(cwd, ['move', 'empty-reason-item', '--to', 'todo', '--reason', '']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});

test('move proposed -> todo (rejection) with --reason carries the reason into the event payload, exit 0', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'rejected-item');
  const result = run(cwd, ['move', 'rejected-item', '--to', 'todo', '--reason', 'flaky test coverage']);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['rejected-item'].status, 'todo');

  const lines = eventLines(cwd);
  const lastEvent = JSON.parse(lines[lines.length - 1]);
  assert.equal(lastEvent.type, 'work.move');
  assert.equal(lastEvent.payload.reason, 'flaky test coverage');
});

test('move proposed -> doing is a forbidden edge (proposed is never a re-entry point for doing), exit 2, no event written', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'no-reentry-item');
  const before = eventLines(cwd).length;
  const result = run(cwd, ['move', 'no-reentry-item', '--to', 'doing']);
  assert.equal(result.status, 2);
  assert.equal(eventLines(cwd).length, before);
});

test('move proposed -> done rejects a CAS expected-status mismatch as conflict, exit 3, no event written', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'cas-proposed-item');
  const before = eventLines(cwd).length;
  const result = run(cwd, ['move', 'cas-proposed-item', '--to', 'done', '--expect', 'todo']);
  assert.equal(result.status, 3);
  assert.equal(eventLines(cwd).length, before);
  assert.equal(stateView(cwd).work['cas-proposed-item'].status, 'proposed');
});

test('move --reason on a non-rejection edge is accepted but ignored, not embedded in the payload', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'reason-ignored-item');
  const result = run(cwd, ['move', 'reason-ignored-item', '--to', 'doing', '--reason', 'not a rejection']);
  assert.equal(result.status, 0);

  const lines = eventLines(cwd);
  const lastEvent = JSON.parse(lines[lines.length - 1]);
  assert.equal(lastEvent.payload.reason, undefined);
});

test('list shows tier and the proposed status for the real CLI view, exit 0', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'listed-proposed');
  const result = run(cwd, ['list']);
  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.work['listed-proposed'].status, 'proposed');
  assert.equal(parsed.work['listed-proposed'].tier, 'standard');
});

// --- `fgos ready` (phase-2-routing-5) ---

test('ready prints the frontier as parseable, machine-readable JSON, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'freestanding');
  const result = run(cwd, ['ready']);
  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.ok(Array.isArray(parsed));
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].id, 'freestanding');
});

test('ready excludes a todo item whose dep sits at proposed (proposed is not done): dep at proposed does NOT open dependent work', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'dep-in-proposed');
  const result = run(cwd, ['add', 'blocked-on-proposed', '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--deps', 'dep-in-proposed']);
  assert.equal(result.status, 0);

  const ready = JSON.parse(run(cwd, ['ready']).stdout);
  assert.ok(!ready.some((item) => item.id === 'blocked-on-proposed'));
  assert.ok(!ready.some((item) => item.id === 'dep-in-proposed'));
});

test('ready opens a todo item once its dep reaches done (approved, not merely proposed)', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'dep-approved');
  assert.equal(run(cwd, ['move', 'dep-approved', '--to', 'done']).status, 0);
  assert.equal(
    run(cwd, ['add', 'unblocked-item', '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--deps', 'dep-approved']).status,
    0,
  );

  const ready = JSON.parse(run(cwd, ['ready']).stdout);
  assert.ok(ready.some((item) => item.id === 'unblocked-item'));
});

test('ready on a directory with no log at all returns an empty result, exit 0 (a read never initializes .fgos/)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['ready']);
  assert.equal(result.status, 0);
  assert.deepEqual(JSON.parse(result.stdout), []);
  assert.ok(!fs.existsSync(path.join(cwd, '.fgos')));
});

test('ready on a corrupt log is refused as corrupt-log, exit 5', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'before-corruption-ready');
  fs.appendFileSync(logPath(cwd), 'not valid json\n', 'utf8');

  const result = run(cwd, ['ready']);
  assert.equal(result.status, 5);
});

test('GOLDEN request-class: running ready twice never appends to events.jsonl, and the view file is untouched too', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'golden-a');
  addOk(cwd, 'golden-b');
  run(cwd, ['move', 'golden-b', '--to', 'doing']);

  const logBefore = fs.readFileSync(logPath(cwd), 'utf8');
  const viewExistedBefore = fs.existsSync(viewPath(cwd));
  const viewBefore = viewExistedBefore ? fs.readFileSync(viewPath(cwd), 'utf8') : null;

  const first = run(cwd, ['ready']);
  assert.equal(first.status, 0);
  const second = run(cwd, ['ready']);
  assert.equal(second.status, 0);
  assert.equal(first.stdout, second.stdout);

  const logAfter = fs.readFileSync(logPath(cwd), 'utf8');
  assert.equal(logAfter, logBefore, 'events.jsonl must be byte-identical before/after ready x2');

  const viewAfter = fs.existsSync(viewPath(cwd)) ? fs.readFileSync(viewPath(cwd), 'utf8') : null;
  assert.equal(viewAfter, viewBefore, 'state.json must be untouched by ready (read never writes the view)');
});

// --- `fgos check` (phase-3-compound-learning-3): predicted-vs-actual report ---
//
// `check` is a pure read (per D1 request-class, same as `ready`/`list`) over
// `listWork(dir).outcomes` — the CLI itself has no verb that WRITES a
// work.outcome event (only the runner does, per plan Approach S1), so these
// tests seed outcome data directly through store.mjs's addOutcome, the same
// single write door the runner uses, then exercise the real `check` binary.

test('check on an item with no recorded outcome prints "chưa có dữ liệu" for that id, exit 0, no throw', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'unchecked-item');
  const result = run(cwd, ['check', 'unchecked-item']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /chưa có dữ liệu/);
});

test('check on a directory with no log at all prints "chưa có dữ liệu", exit 0 (a read never initializes .fgos/)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /chưa có dữ liệu/);
  assert.ok(!fs.existsSync(path.join(cwd, '.fgos')));
});

test('check prints BOTH predicted and actual values for an item with real outcome data, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'checked-item');
  const dir = path.join(cwd, '.fgos');
  addOutcome(dir, { id: 'checked-item', predicted: { tier: 'standard', deps: 0, priorVisits: 0 } });
  addOutcome(dir, {
    id: 'checked-item',
    actual: { outcome: 'proposed', passed: true, attempts: 1, errorClass: null, aheadCount: 1, visits: 1 },
  });

  const result = run(cwd, ['check', 'checked-item']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /checked-item/);
  assert.match(result.stdout, /predicted/);
  assert.match(result.stdout, /"tier":"standard"/);
  assert.match(result.stdout, /actual/);
  assert.match(result.stdout, /"outcome":"proposed"/);
  assert.match(result.stdout, /"passed":true/);
});

test('check with no id given reports every item that has outcome data, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'item-a');
  addOk(cwd, 'item-b');
  const dir = path.join(cwd, '.fgos');
  addOutcome(dir, { id: 'item-a', predicted: { tier: 'light', deps: 0, priorVisits: 0 } });
  addOutcome(dir, { id: 'item-a', actual: { outcome: 'proposed', passed: true, attempts: 1, errorClass: null, aheadCount: 1, visits: 1 } });

  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /item-a/);
  assert.doesNotMatch(result.stdout, /item-b/, 'item-b has no outcome data yet, so it is not listed');
});

// --- friction channel in `check` (phase-3-compound-learning-4, S2) ---------
//
// Same write-door discipline as the outcome tests above: only the runner
// writes work.friction in production, so these seed through store.mjs's
// addFriction and exercise the real `check` binary read-side.

test('check prints the friction section — per-layer counts + recent records — when friction data exists', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'fric-item');
  const dir = path.join(cwd, '.fgos');
  addFriction(dir, { id: 'fric-item', disposition: 'parked', errorClass: 'verify-miss', layer: 'verification', attempts: 2, detail: 'goal-check failed (exit 1)' });
  addFriction(dir, { id: 'fric-item', disposition: 'halted', errorClass: 'worker-timeout', layer: 'environment', attempts: 1, detail: 'timed out' });

  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /friction \(2\)/);
  assert.match(result.stdout, /verification 1/);
  assert.match(result.stdout, /environment 1/);
  assert.match(result.stdout, /\[parked\] fric-item verify-miss\/verification \(attempts 2\)/);
  assert.match(result.stdout, /\[halted\] fric-item worker-timeout\/environment/);
});

test('check nags items sitting in a final status without their actual half (porting-outcome-lifecycle: no silent record)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'nag-item');
  toProposed(cwd, 'nag-item');

  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /nhắc: 1 item ở trạng thái cuối chưa có nửa actual: nag-item/);
});

test('check output on a log with no friction and no final-status gaps is unchanged — no friction section, no nag', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'clean-item');
  const dir = path.join(cwd, '.fgos');
  addOutcome(dir, { id: 'clean-item', predicted: { tier: 'standard', deps: 0, priorVisits: 0 } });

  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  assert.doesNotMatch(result.stdout, /friction/);
  assert.doesNotMatch(result.stdout, /nhắc/);
});

// --- `fgos ask`/`fgos answer` (async-human-gate-3): the human-gate round-trip ---
//
// e2e per D5/D6/D7: `ask` parks a work item into `awaiting-human` carrying
// the question; while parked, `ready` must exclude it (D6) and `list` must
// surface it — status + its question, via the existing view.gates fold, no
// new formatter (D7); `answer` records the answer and resumes the item to
// `todo`, at which point it is actionable again (back in `ready`).

test('ask/answer round-trip: park removes from ready and surfaces the ask via list, answer resumes to todo and reopens ready (per D5/D6/D7)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'gated-item');
  assert.equal(run(cwd, ['move', 'gated-item', '--to', 'doing']).status, 0);

  const askResult = run(cwd, ['ask', 'gated-item', '--text', 'OAuth or password?']);
  assert.equal(askResult.status, 0);
  assert.equal(stateView(cwd).work['gated-item'].status, 'awaiting-human');

  // D7: list surfaces the parked item's status and its question, no new
  // read command/formatter — the existing `view.gates` fold carries it.
  const listedWhileAwaiting = JSON.parse(run(cwd, ['list']).stdout);
  assert.equal(listedWhileAwaiting.work['gated-item'].status, 'awaiting-human');
  assert.equal(listedWhileAwaiting.gates['gated-item'].ask, 'OAuth or password?');
  assert.equal(listedWhileAwaiting.gates['gated-item'].answer, undefined);

  // D6: a parked item is never in the ready set.
  const readyWhileAwaiting = JSON.parse(run(cwd, ['ready']).stdout);
  assert.ok(!readyWhileAwaiting.some((i) => i.id === 'gated-item'));

  const answerResult = run(cwd, ['answer', 'gated-item', '--text', 'OAuth']);
  assert.equal(answerResult.status, 0);
  assert.equal(stateView(cwd).work['gated-item'].status, 'todo');

  const listedAfterAnswer = JSON.parse(run(cwd, ['list']).stdout);
  assert.equal(listedAfterAnswer.gates['gated-item'].ask, 'OAuth or password?');
  assert.equal(listedAfterAnswer.gates['gated-item'].answer, 'OAuth');

  const readyAfterAnswer = JSON.parse(run(cwd, ['ready']).stdout);
  assert.ok(readyAfterAnswer.some((i) => i.id === 'gated-item'));
});

test('ask without --text is rejected as validation, exit 4, no event written, item stays in its prior status', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'no-text-ask');
  run(cwd, ['move', 'no-text-ask', '--to', 'doing']);
  const before = eventLines(cwd).length;

  const result = run(cwd, ['ask', 'no-text-ask']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
  assert.equal(stateView(cwd).work['no-text-ask'].status, 'doing');
});

test('answer on an item that is not awaiting-human is rejected as precondition, exit 2, no event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'never-parked');
  const before = eventLines(cwd).length;

  const result = run(cwd, ['answer', 'never-parked', '--text', 'irrelevant']);
  assert.equal(result.status, 2);
  assert.equal(eventLines(cwd).length, before);
  assert.equal(stateView(cwd).work['never-parked'].status, 'todo');
});

test('ask rejects a CAS expected-status mismatch as conflict, exit 3, no event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'cas-ask-item');
  run(cwd, ['move', 'cas-ask-item', '--to', 'doing']);
  const before = eventLines(cwd).length;

  const result = run(cwd, ['ask', 'cas-ask-item', '--text', 'ready?', '--expect', 'todo']);
  assert.equal(result.status, 3);
  assert.equal(eventLines(cwd).length, before);
  assert.equal(stateView(cwd).work['cas-ask-item'].status, 'doing');
});

test('check never mutates state: events.jsonl and state.json are byte-identical before/after', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'read-only-item');
  const dir = path.join(cwd, '.fgos');
  addOutcome(dir, { id: 'read-only-item', predicted: { tier: 'standard', deps: 0, priorVisits: 0 } });

  const logBefore = fs.readFileSync(logPath(cwd), 'utf8');
  const viewBefore = fs.readFileSync(viewPath(cwd), 'utf8');

  const result = run(cwd, ['check', 'read-only-item']);
  assert.equal(result.status, 0);

  assert.equal(fs.readFileSync(logPath(cwd), 'utf8'), logBefore, 'events.jsonl must be untouched by check');
  assert.equal(fs.readFileSync(viewPath(cwd), 'utf8'), viewBefore, 'state.json must be untouched by check');
});

// --- `fgos submit` (stage-intake-3): free-text intake verb (P14, D1-D6) ---
//
// e2e through the real binary (never a direct call to classify.mjs) per the
// plan's Learnings Applied: id-collision retry and the C1 envelope must be
// proven end-to-end. `submit` runs parallel to `add`, auto-derives title/id
// and mechanically classifies tier/kind/risk, persists through the same
// addWork door, and prints the fgos.v1 envelope.

test('submit prints a well-formed fgos.v1 envelope: contract + generated_at + data_hash + data, exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Investigate the sluggish overview page']);
  assert.equal(result.status, 0);
  const envelope = JSON.parse(result.stdout);
  assert.deepEqual(Object.keys(envelope).sort(), ['contract', 'data', 'data_hash', 'generated_at']);
  assert.equal(envelope.contract, 'fgos.v1');
  assert.match(envelope.data_hash, /^[0-9a-f]{64}$/);
  assert.ok(!Number.isNaN(Date.parse(envelope.generated_at)));
  assert.equal(typeof envelope.data.id, 'string');
  assert.equal(envelope.data.status, 'todo');
});

test('two submits of the same text get different ids, both persist, no duplicate-id error (D3 collision retry)', () => {
  const cwd = tmpCwd();
  const text = 'Fix the broken login button';

  const first = run(cwd, ['submit', text]);
  assert.equal(first.status, 0);
  const second = run(cwd, ['submit', text]);
  assert.equal(second.status, 0);

  const idA = JSON.parse(first.stdout).data.id;
  const idB = JSON.parse(second.stdout).data.id;
  assert.notEqual(idA, idB, 'a second submit of the same text must not collide on id');

  const view = JSON.parse(run(cwd, ['list']).stdout);
  assert.ok(view.work[idA], 'first submitted item persisted');
  assert.ok(view.work[idB], 'second submitted item persisted');
});

test('submit without a mode flag records mode:"sync"; --async records mode:"async" — both visible via list (D6)', () => {
  const cwd = tmpCwd();

  const syncSubmit = run(cwd, ['submit', 'Investigate the sluggish overview page']);
  assert.equal(syncSubmit.status, 0);
  const syncId = JSON.parse(syncSubmit.stdout).data.id;

  const asyncSubmit = run(cwd, ['submit', 'Rework the settings navigation flow', '--async']);
  assert.equal(asyncSubmit.status, 0);
  const asyncId = JSON.parse(asyncSubmit.stdout).data.id;

  const view = JSON.parse(run(cwd, ['list']).stdout);
  assert.equal(view.work[syncId].mode, 'sync');
  assert.equal(view.work[asyncId].mode, 'async');
});

test('submit with --unattended is treated the same as --async: mode:"async" (D2)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Draft the onboarding walkthrough', '--unattended']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  assert.equal(JSON.parse(run(cwd, ['list']).stdout).work[id].mode, 'async');
});

test('submit of text matching no keyword falls back to tier:"standard" and persists, exit 0 (D1)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Investigate the sluggish overview page']);
  assert.equal(result.status, 0);
  const item = JSON.parse(result.stdout).data;
  assert.equal(item.tier, 'standard');
  assert.equal(JSON.parse(run(cwd, ['list']).stdout).work[item.id].tier, 'standard');
});

test('submit with no text at all is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, 0);
});

// --- stage `clarify` wiring (stage-clarify-3): submit tags the stage, add
// does not, and the `discover` verb runs the sync branch's context-discovery
// (D5/D8/D10). A scripted verdict-executor (a node script this test writes)
// stands in for the real model — no agent CLI is ever invoked.

function writeRunnerConfig(cwd, verdict) {
  const scriptPath = path.join(cwd, 'verdict-executor.mjs');
  fs.writeFileSync(scriptPath, `process.stdout.write(${JSON.stringify(JSON.stringify(verdict))}); process.exit(0);`);
  const cfg = {
    executor: { command: process.execPath, args: [scriptPath, '{prompt}'] },
    models: { light: 'haiku', standard: 'sonnet', heavy: 'opus' },
    timeoutMs: 5000,
  };
  fs.writeFileSync(path.join(cwd, '.fgos-runner.json'), JSON.stringify(cfg));
}

test("submit tags the new item with stage:'clarify' (D8), visible via list", () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Investigate the sluggish overview page']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  assert.equal(JSON.parse(run(cwd, ['list']).stdout).work[id].stage, 'clarify');
});

test('add leaves stage unset — the item reads as executing via the lazy default (D8)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'plain-add');
  const item = JSON.parse(run(cwd, ['list']).stdout).work['plain-add'];
  assert.equal(item.stage, undefined);
});

test('discover on a clear verdict moves the submitted item to stage executing with the model-proposed verify (D5/D10)', () => {
  const cwd = tmpCwd();
  writeRunnerConfig(cwd, { clear: true, verify: 'npm test -- proven' });
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;

  const result = run(cwd, ['discover', id]);
  assert.equal(result.status, 0);
  const envelope = JSON.parse(result.stdout);
  assert.equal(envelope.contract, 'fgos.v1');
  assert.equal(envelope.data.outcome, 'clear');

  const item = JSON.parse(run(cwd, ['list']).stdout).work[id];
  assert.equal(item.stage, 'executing');
  assert.equal(item.verify, 'npm test -- proven');
});

test('discover on an unclear verdict parks the submitted item in awaiting-human with the question, still stage clarify (D5/D7)', () => {
  const cwd = tmpCwd();
  writeRunnerConfig(cwd, { clear: false, question: 'Which service?' });
  const id = JSON.parse(run(cwd, ['submit', 'Do the ambiguous work']).stdout).data.id;

  const result = run(cwd, ['discover', id]);
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).data.outcome, 'unclear');

  const view = JSON.parse(run(cwd, ['list']).stdout);
  assert.equal(view.work[id].status, 'awaiting-human');
  assert.equal(view.work[id].stage, 'clarify');
  assert.equal(view.gates[id].ask, 'Which service?');
});

test('discover with no id is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['discover']);
  assert.equal(result.status, 4);
});

// --- settlement channel actor attribution (phase-3-compound-learning-5,
// S3-closeout) — real CLI call sites stamp `actor` per vision §8: the
// `move`/`answer` verbs are always a human at the keyboard; `discover` is
// the sync, session-driven call site (the async runner sweep is 'runner',
// covered at the runner unit-test layer). ---------------------------------

test('answer via the real CLI stamps actor "human" on the event payload and folds into an "answer" settlement', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'answer-actor-item');
  run(cwd, ['move', 'answer-actor-item', '--to', 'doing']);
  run(cwd, ['ask', 'answer-actor-item', '--text', 'OAuth or password?']);

  const result = run(cwd, ['answer', 'answer-actor-item', '--text', 'OAuth']);
  assert.equal(result.status, 0);

  const lines = eventLines(cwd);
  const lastEvent = JSON.parse(lines[lines.length - 1]);
  assert.equal(lastEvent.payload.actor, 'human');

  const view = stateView(cwd);
  assert.equal(view.settlements['answer-actor-item'].length, 1);
  assert.equal(view.settlements['answer-actor-item'][0].kind, 'answer');
  assert.equal(view.settlements['answer-actor-item'][0].actor, 'human');
});

test('move to done via the real CLI stamps actor "human" on the event payload and folds into a "close" settlement', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'close-actor-item');

  const result = run(cwd, ['move', 'close-actor-item', '--to', 'done']);
  assert.equal(result.status, 0);

  const lines = eventLines(cwd);
  const lastEvent = JSON.parse(lines[lines.length - 1]);
  assert.equal(lastEvent.payload.actor, 'human');

  const view = stateView(cwd);
  assert.equal(view.settlements['close-actor-item'].length, 1);
  assert.equal(view.settlements['close-actor-item'][0].kind, 'close');
  assert.equal(view.settlements['close-actor-item'][0].actor, 'human');
});

test('discover (sync verb) on a clear verdict stamps actor "session" on the work.stage event and folds into a clarify-pass settlement', () => {
  const cwd = tmpCwd();
  writeRunnerConfig(cwd, { clear: true, verify: 'npm test -- proven' });
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;

  const result = run(cwd, ['discover', id]);
  assert.equal(result.status, 0);

  const lines = eventLines(cwd);
  const stageEvent = lines.map((l) => JSON.parse(l)).find((e) => e.type === 'work.stage');
  assert.equal(stageEvent.payload.actor, 'session');

  const view = stateView(cwd);
  assert.equal(view.settlements[id].length, 1);
  assert.equal(view.settlements[id][0].kind, 'clarify-pass');
  assert.equal(view.settlements[id][0].actor, 'session');
});

test('check prints the settlement section — per-kind/actor counts + recent records — when settlement data exists', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'settle-item');
  run(cwd, ['move', 'settle-item', '--to', 'done']);

  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /settlement \(1\)/);
  assert.match(result.stdout, /close\/human 1/);
  assert.match(result.stdout, /\[close\] settle-item actor=human/);
});

test('check output on a log with no settling transitions is unchanged — no settlement section', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'no-settlement-item');

  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  assert.doesNotMatch(result.stdout, /settlement/);
});

// --- entropy-trend + seal-digest in `check` (phase-3-compound-learning-6,
// S3-closeout (b)) — a real event-backed store (never fixture-only, per this
// cell's must_haves: repo has NO live .fgos to assume data from, confirmed
// by `ls`), driven entirely through the real `fgos` binary so the trend
// history file (entropy-history.jsonl, in the SAME data dir as
// events.jsonl) is genuinely written and read back across two runs. ------

test('check reports a nonzero baseline entropy score with an explainable part for a real event-backed store with a stale-doing item', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'entropy-item');
  assert.equal(run(cwd, ['move', 'entropy-item', '--to', 'doing']).status, 0);

  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /entropy: \d+ \(baseline\)/);
  assert.match(result.stdout, /stale-doing: 1 × 5 = 5/);

  const scoreMatch = result.stdout.match(/entropy: (\d+) \(baseline\)/);
  assert.ok(scoreMatch);
  assert.notEqual(Number(scoreMatch[1]), 0, 'a doing item must contribute a nonzero baseline score');
});

test('check prints a seal-digest clause only for channels with real compound data, format "compounded: +N outcome" (per this cell action (3)), and never mentions a channel with no data', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'seal-digest-item');
  const dir = path.join(cwd, '.fgos');
  addOutcome(dir, { id: 'seal-digest-item', predicted: { tier: 'standard', deps: 0, priorVisits: 0 } });
  addOutcome(dir, {
    id: 'seal-digest-item',
    actual: { outcome: 'proposed', passed: true, attempts: 1, errorClass: null, aheadCount: 1, visits: 1 },
  });

  const first = run(cwd, ['check']);
  assert.equal(first.status, 0);
  assert.match(first.stdout, /compounded: \+1 outcome/);
  assert.doesNotMatch(first.stdout, /friction/);
  assert.doesNotMatch(first.stdout, /compounded:[^\n]*settlement/);

  // Second run over the same (unchanged) store: the outcome channel already
  // has data, so its clause still appears, now with a zero delta — the
  // digest is a live snapshot against the last checkpoint, not a one-shot
  // "something changed" flag.
  const second = run(cwd, ['check']);
  assert.equal(second.status, 0);
  assert.match(second.stdout, /compounded: \+0 outcome/);
});

test('check on a second consecutive run over the same store prints a real trend delta against the first run (not baseline again)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'entropy-trend-item');
  assert.equal(run(cwd, ['move', 'entropy-trend-item', '--to', 'doing']).status, 0);

  const first = run(cwd, ['check']);
  assert.equal(first.status, 0);
  assert.match(first.stdout, /\(baseline\)/);

  // Move the item out of "doing" (stale-suspect ×5) into "awaiting-human"
  // (×2) between the two checks — the score must genuinely shift, not just
  // repeat, so the delta printed on run 2 is real evidence of trend.
  assert.equal(run(cwd, ['ask', 'entropy-trend-item', '--text', 'blocked on what?']).status, 0);

  const second = run(cwd, ['check']);
  assert.equal(second.status, 0);
  assert.doesNotMatch(second.stdout, /\(baseline\)/);
  assert.match(second.stdout, /entropy: \d+ \([+-]\d+ so lần trước\)/);

  const deltaMatch = second.stdout.match(/entropy: \d+ \(([+-]\d+) so lần trước\)/);
  assert.ok(deltaMatch);
  assert.equal(Number(deltaMatch[1]), 2 - 5, 'doing(×5) -> awaiting-human(×2) must show a -3 delta');
});

test('entropy-history.jsonl is written in the SAME data dir as events.jsonl, not a hardcoded path, one line per check run', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'history-path-item');
  run(cwd, ['move', 'history-path-item', '--to', 'doing']);

  run(cwd, ['check']);
  run(cwd, ['check']);

  const historyPath = path.join(cwd, '.fgos', 'entropy-history.jsonl');
  assert.ok(fs.existsSync(historyPath));
  const lines = fs.readFileSync(historyPath, 'utf8').split('\n').filter(Boolean);
  assert.equal(lines.length, 2);
  for (const line of lines) {
    const entry = JSON.parse(line);
    assert.equal(typeof entry.score, 'number');
    assert.equal(typeof entry.counts.outcomes, 'number');
    assert.equal(typeof entry.counts.frictions, 'number');
    assert.equal(typeof entry.counts.settlements, 'number');
  }
});

test('check on a directory with no log at all still never initializes .fgos/ (entropy section stays absent, same as friction/settlement)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /chưa có dữ liệu/);
  assert.doesNotMatch(result.stdout, /entropy/);
  assert.ok(!fs.existsSync(path.join(cwd, '.fgos')));
});
