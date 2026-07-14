import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Demo mốc C (per plan.md Shape/C) as an automated e2e test, exercised
// through the real CLI binary via child_process — never through the
// library directly, and never with a mocked filesystem (per this cell's
// prohibitions).
//
// MANDATORY isolation (per this cell): every child process below runs with
// cwd = a fresh mkdtemp temp dir, including the corrupt-truncation case.
// No step ever creates, writes, or truncates `.fgos/` inside the repo.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');

function tmpCwd() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-e2e-'));
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

function stateView(cwd) {
  return JSON.parse(fs.readFileSync(viewPath(cwd), 'utf8'));
}

function add(cwd, id, extra = {}) {
  const flags = [
    '--title', extra.title ?? `Title ${id}`,
    '--kind', extra.kind ?? 'task',
    '--risk', extra.risk ?? 'low',
    '--verify', extra.verify ?? 'npm test',
  ];
  if (extra.deps && extra.deps.length) flags.push('--deps', extra.deps.join(','));
  return run(cwd, ['add', id, ...flags]);
}

function move(cwd, id, to, expect) {
  const args = ['move', id, '--to', to];
  if (expect !== undefined) args.push('--expect', expect);
  return run(cwd, args);
}

test('rebuild-determinism: init, add work with deps + unicode title, move through statuses with --expect, decision, delete view, rebuild -> deep-equal view', () => {
  const cwd = tmpCwd();

  assert.equal(run(cwd, ['init']).status, 0);

  // Deps: b depends on a, c depends on a and b — exercises D4 flat deps.
  assert.equal(add(cwd, 'a', { title: 'Nền tảng cốt lõi' }).status, 0);
  assert.equal(
    add(cwd, 'b', { title: 'Tiêu đề tiếng Việt — 日本語タイトル 🎉', deps: ['a'] }).status,
    0,
  );
  assert.equal(add(cwd, 'c', { title: 'Third item', deps: ['a', 'b'] }).status, 0);

  // Move each item through a distinct path, always with --expect (CAS),
  // so the whole journey proves precondition + CAS on real transitions.
  assert.equal(move(cwd, 'a', 'doing', 'todo').status, 0);
  assert.equal(move(cwd, 'a', 'done', 'doing').status, 0);

  assert.equal(move(cwd, 'b', 'doing', 'todo').status, 0);
  assert.equal(move(cwd, 'b', 'blocked', 'doing').status, 0);
  assert.equal(move(cwd, 'b', 'doing', 'blocked').status, 0);

  assert.equal(move(cwd, 'c', 'blocked', 'todo').status, 0);
  assert.equal(move(cwd, 'c', 'todo', 'blocked').status, 0);

  assert.equal(run(cwd, ['decision', '--text', 'locked D3: event log is truth, view is rebuilt']).status, 0);

  // `ready` (per phase-2-routing-5): a pure read, exercised mid-journey —
  // it must reflect the frontier at this exact point (only `a` is `done`;
  // `b` is `doing`, `c` is `blocked`, neither is ready) and must never
  // perturb the log the determinism check below depends on.
  const logBeforeReady = fs.readFileSync(logPath(cwd), 'utf8');
  const readyResult = run(cwd, ['ready']);
  assert.equal(readyResult.status, 0);
  const ready = JSON.parse(readyResult.stdout);
  assert.ok(!ready.some((item) => item.id === 'a'), 'a is done, not todo — never in the frontier');
  assert.ok(!ready.some((item) => item.id === 'b'), 'b is doing, not ready');
  assert.ok(!ready.some((item) => item.id === 'c'), 'c is blocked, not ready');
  assert.equal(fs.readFileSync(logPath(cwd), 'utf8'), logBeforeReady, 'ready must not append any event');

  const before = stateView(cwd);
  assert.equal(before.work.a.status, 'done');
  assert.equal(before.work.b.status, 'doing');
  assert.equal(before.work.c.status, 'todo');
  assert.equal(before.work.b.title, 'Tiêu đề tiếng Việt — 日本語タイトル 🎉');
  assert.deepEqual(before.work.c.deps, ['a', 'b']);
  assert.equal(before.decisions.length, 1);

  fs.rmSync(viewPath(cwd));
  assert.ok(!fs.existsSync(viewPath(cwd)));

  const rebuildResult = run(cwd, ['rebuild']);
  assert.equal(rebuildResult.status, 0);

  const after = stateView(cwd);
  assert.deepEqual(after, before);
});

test('rebuild-determinism: CAS conflict — a stale --expect on the second of two moves is refused, exit 3, no event written', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(add(cwd, 'cas-e2e').status, 0);

  const first = move(cwd, 'cas-e2e', 'doing', 'todo');
  assert.equal(first.status, 0);

  const eventsBefore = fs.readFileSync(logPath(cwd), 'utf8').split('\n').filter(Boolean).length;

  // Same stale --expect ("todo") reused after the item already moved to
  // "doing" — the CLI must refuse as a CAS conflict, not overwrite blindly.
  const second = move(cwd, 'cas-e2e', 'done', 'todo');
  assert.equal(second.status, 3);

  const eventsAfter = fs.readFileSync(logPath(cwd), 'utf8').split('\n').filter(Boolean).length;
  assert.equal(eventsAfter, eventsBefore);
  assert.equal(stateView(cwd).work['cas-e2e'].status, 'doing');
});

test('rebuild-determinism: a truncated final event-log line is reported as corrupt-log, exit 5, message names the error', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(add(cwd, 'before-truncation').status, 0);

  // Simulate a crash mid-append: cut the last line off partway through
  // rather than replacing it with different-but-valid or garbage content.
  const raw = fs.readFileSync(logPath(cwd), 'utf8');
  const lines = raw.split('\n').filter(Boolean);
  const lastLine = lines[lines.length - 1];
  const truncatedLast = lastLine.slice(0, Math.floor(lastLine.length / 2));
  const truncated = [...lines.slice(0, -1), truncatedLast].join('\n');
  fs.writeFileSync(logPath(cwd), `${truncated}\n`, 'utf8');

  const result = run(cwd, ['list']);
  assert.equal(result.status, 5);
  assert.match(result.stderr, /corrupt/i);
});
