import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

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
