import '../helpers/process-tmp-root.mjs';
import { initializeWorkRepository } from '../helpers/work-store-release.mjs';
import { readRawEvents } from '../../src/state/store.mjs';
import { test } from 'node:test';
import { resolveFgosFile, FGOS_FILE } from '../../src/state/fgos-file-registry.mjs';
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
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-e2e-'));
  initializeWorkRepository(cwd);
  return cwd;
}

function run(cwd, args) {
  return spawnSync(process.execPath, [FGOS, ...args], { cwd, encoding: 'utf8' });
}

// The whole Work history of the store, as the verbs under test see it.
function history(cwd) {
  return readRawEvents(path.join(cwd, '.fgos'));
}

function viewPath(cwd) {
  return resolveFgosFile(path.join(cwd, '.fgos'), FGOS_FILE.STATE);
}

function stateView(cwd) {
  return JSON.parse(fs.readFileSync(viewPath(cwd), 'utf8'));
}

// Every verb's success path prints a single fgos.v1 envelope
// {contract, generated_at, data_hash, data} — this unwraps it to the verb's
// own structured data.
function envelopeData(stdout) {
  return JSON.parse(stdout).data;
}

function add(cwd, id, extra = {}) {
  const flags = [
    '--title', extra.title ?? `Title ${id}`,
    '--kind', extra.kind ?? 'task',
    '--risk', extra.risk ?? 'light',
    '--verify', extra.verify ?? 'npm test',
    // tsk-535: --description is required at add's CLI layer.
    '--description', extra.description ?? `Title ${id}`,
  ];
  if (extra.deps && extra.deps.length) flags.push('--deps', extra.deps.join(','));
  return run(cwd, ['add', id, ...flags]);
}

function move(cwd, id, to, expect) {
  const args = ['move', id, '--to', to];
  if (expect !== undefined) args.push('--expect', expect);
  // tsk-280: doing -> awaiting-approval via move now requires an explicit
  // reason (return's own proof-of-progress checks are the real door) --
  // this e2e test walks the FSM directly, not exercising that guard.
  if (to === 'awaiting-approval') args.push('--skip-return-guard', "e2e fixture: FSM lifecycle-chain test, not exercising return's own guard");
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
  // tsk-40m (docs/architect/doing-coordination-redesign.md): todo -> doing
  // is retired -- no real claim needed here (no branch), straight
  // todo -> awaiting-approval via the redesign's own new direct edge.
  assert.equal(move(cwd, 'a', 'awaiting-approval', 'todo').status, 0);
  // done's one remaining door in is the sequential delivered->retrospective
  // ->cleanup->done chain (work-item-status-delivered-retrospective-cleanup
  // D1/D2/D10) — walk it with --expect at each step.
  assert.equal(move(cwd, 'a', 'delivered', 'awaiting-approval').status, 0);
  assert.equal(move(cwd, 'a', 'retrospective', 'delivered').status, 0);
  assert.equal(move(cwd, 'a', 'cleanup', 'retrospective').status, 0);
  assert.equal(move(cwd, 'a', 'done', 'cleanup').status, 0);

  // tsk-40m: blocked stands in for the retired doing round-trip.
  assert.equal(move(cwd, 'b', 'blocked', 'todo').status, 0);
  assert.equal(move(cwd, 'b', 'todo', 'blocked').status, 0);
  assert.equal(move(cwd, 'b', 'blocked', 'todo').status, 0);

  assert.equal(move(cwd, 'c', 'blocked', 'todo').status, 0);
  assert.equal(move(cwd, 'c', 'todo', 'blocked').status, 0);

  assert.equal(run(cwd, ['decision', '--text', 'locked D3: event log is truth, view is rebuilt', '--rationale', 'keeps the log the single source of truth', '--relation', 'none']).status, 0);

  // `ready` (per phase-2-routing-5): a pure read, exercised mid-journey —
  // it must reflect the frontier at this exact point (only `a` is `done`;
  // `b` and `c` are both `blocked`, neither is ready) and must never
  // perturb the log the determinism check below depends on.
  const historyBeforeReady = history(cwd);
  const readyResult = run(cwd, ['ready']);
  assert.equal(readyResult.status, 0);
  const ready = envelopeData(readyResult.stdout);
  assert.ok(!ready.some((item) => item.id === 'a'), 'a is done, not todo — never in the frontier');
  assert.ok(!ready.some((item) => item.id === 'b'), 'b is blocked, not ready');
  assert.ok(!ready.some((item) => item.id === 'c'), 'c is blocked, not ready');
  assert.deepEqual(history(cwd), historyBeforeReady, 'ready must not append any event');

  const before = stateView(cwd);
  assert.equal(before.work.a.status, 'done');
  assert.equal(before.work.b.status, 'blocked');
  assert.equal(before.work.c.status, 'todo');
  assert.equal(before.work.b.title, 'Tiêu đề tiếng Việt — 日本語タイトル 🎉');
  assert.deepEqual(before.work.c.deps, ['a', 'b']);
  // tsk-40m: just the explicit decision above -- item 'a's own
  // todo -> awaiting-approval step no longer passes through 'doing' at
  // all, so the --skip-return-guard flag the move() helper still sends is
  // a no-op (the guard it bypasses only ever fires when status IS 'doing'),
  // logging no second decision.
  assert.equal(before.decisions.length, 1);

  fs.rmSync(viewPath(cwd));
  assert.ok(!fs.existsSync(viewPath(cwd)));

  const rebuildResult = run(cwd, ['rebuild']);
  assert.equal(rebuildResult.status, 0);

  const after = stateView(cwd);
  // The saved cursor records which history this machine has certified and mirrored, so it follows the store's
  // own bookkeeping; the folded view and its revision are what a rebuild must reproduce.
  const { cursor: cursorBefore, ...viewBefore } = before;
  const { cursor: cursorAfter, ...viewAfter } = after;
  assert.ok(cursorBefore && cursorAfter, 'state.json carries the cursor of the history it folded');
  assert.deepEqual(viewAfter, viewBefore);

  // work-graph-intelligence S3: the persisted view carries a deterministic
  // revision-hash (a sibling of work/decisions on the ON-DISK state.json, never
  // folded back into the rebuild return). It survives the delete+rebuild
  // byte-identically — which is exactly why the deepEqual(after, before) above
  // still holds after the revision was added.
  assert.match(before.revision, /^[0-9a-f]{64}$/, 'state.json carries a sha256 revision-hash');
  assert.equal(after.revision, before.revision, 'revision is deterministic across delete+rebuild');
});

test('rebuild-determinism: CAS conflict — a stale --expect on the second of two moves is refused, exit 3, no event written', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(add(cwd, 'cas-e2e').status, 0);

  // tsk-40m: blocked stands in for the retired todo->doing edge.
  const first = move(cwd, 'cas-e2e', 'blocked', 'todo');
  assert.equal(first.status, 0);

  const eventsBefore = history(cwd).length;

  // Same stale --expect ("todo") reused after the item already moved to
  // "blocked" — the CLI must refuse as a CAS conflict, not overwrite blindly.
  const second = move(cwd, 'cas-e2e', 'done', 'todo');
  assert.equal(second.status, 3);

  const eventsAfter = history(cwd).length;
  assert.equal(eventsAfter, eventsBefore);
  assert.equal(stateView(cwd).work['cas-e2e'].status, 'blocked');
});
