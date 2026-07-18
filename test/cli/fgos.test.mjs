import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { addOutcome, addFriction, moveWork, addWork, editWork, StoreError } from '../../src/state/store.mjs';
import { createSession, endSession } from '../../src/runner/session.mjs';

// The CLI under test, resolved by absolute path so it works regardless of
// the spawned process's cwd (which every test below points at a fresh
// mkdtemp dir — never the repo's own `.fgos/`).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');

function tmpCwd() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-cli-'));
}

function run(cwd, args, extraEnv = {}) {
  const opts = { cwd, encoding: 'utf8' };
  // Only override env when the caller actually injects one (e.g. the GitHub
  // tests' FGOS_GH_COMMAND): omitting the `env` key entirely lets spawnSync
  // inherit process.env, keeping every existing call site byte-identical.
  if (Object.keys(extraEnv).length > 0) {
    opts.env = { ...process.env, ...extraEnv };
  }
  return spawnSync(process.execPath, [FGOS, ...args], opts);
}

function logPath(cwd) {
  return path.join(cwd, '.fgos', 'events.jsonl');
}

function viewPath(cwd) {
  return path.join(cwd, '.fgos', 'state.json');
}

// Every verb's success path now prints a single fgos.v1 envelope
// {contract, generated_at, data_hash, data} (the dispatcher choke-point in
// main() wraps every verb's raw structured return value exactly once). This
// helper asserts the envelope shape once per call site and hands back the
// verb's own structured `data` payload, so each test below only needs to
// assert the fields it actually cares about.
function envelopeData(stdout) {
  const envelope = JSON.parse(stdout);
  assert.deepEqual(Object.keys(envelope).sort(), ['contract', 'data', 'data_hash', 'generated_at']);
  assert.equal(envelope.contract, 'fgos.v1');
  assert.match(envelope.data_hash, /^[0-9a-f]{64}$/);
  assert.ok(!Number.isNaN(Date.parse(envelope.generated_at)));
  return envelope.data;
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

// Git-backed cwd (stage-decompose S2-pull): `take`/`return` operate on the
// real host repo directly (never a worktree) — a real HEAD, a real working
// tree, and real commits are the whole point of D1's "mirror the runner's
// own proposed contract" design. Every other verb in this file never needs
// git at all, so this helper is scoped to only the take/return tests below.
//
// `.fgos/state.json` is gitignored (same convention this very repo's own
// .gitignore declares: "state.json is a derived view") — `.fgos/events.jsonl`
// is the truth log and IS committed, so "commit your work" for `return`
// means the real files AND the log entries `take`/`add` already appended.
function initGitCwd() {
  const cwd = tmpCwd();
  execFileSync('git', ['init', '-q'], { cwd });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd });
  fs.writeFileSync(path.join(cwd, '.gitignore'), '.fgos/state.json\n');
  fs.writeFileSync(path.join(cwd, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt', '.gitignore'], { cwd });
  execFileSync('git', ['commit', '-q', '-m', 'seed'], { cwd });
  return cwd;
}

function gitHead(cwd) {
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' }).trim();
}

// Commits the produced file AND whatever `.fgos/events.jsonl` deltas are
// pending (`git add -A`) — mirrors what a real "commit your work" step looks
// like against a repo where the truth log rides alongside the code.
function commitFile(cwd, filename, content = 'work\n') {
  fs.writeFileSync(path.join(cwd, filename), content);
  execFileSync('git', ['add', '-A'], { cwd });
  execFileSync('git', ['commit', '-q', '-m', `work: ${filename}`], { cwd });
}

test('init creates .fgos/ with an empty log and a rebuilt (empty) view, exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['init']);
  assert.equal(result.status, 0);
  assert.ok(fs.existsSync(logPath(cwd)));
  const view = stateView(cwd);
  assert.deepEqual(view.work, {});
  assert.deepEqual(view.decisions, []);
  // work-graph-intelligence S3: the persisted (on-disk) view now carries a
  // deterministic revision-hash sibling — the fold return stays pure, but
  // state.json fingerprints its own folded state.
  assert.match(view.revision, /^[0-9a-f]{64}$/);
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

test('move reports the real event seq in its envelope data, not undefined', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'seq-check'); // event #1
  const result = run(cwd, ['move', 'seq-check', '--to', 'doing']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.seq, 2);
  assert.equal(data.id, 'seq-check');
  assert.equal(data.from, 'todo');
  assert.equal(data.to, 'doing');
});

test('edit changes only the targeted field, every other field unchanged, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-risk', { risk: 'low' });
  const before = eventLines(cwd).length;
  const result = run(cwd, ['edit', 'edit-risk', '--risk', 'high']);
  assert.equal(result.status, 0);
  assert.equal(eventLines(cwd).length, before + 1);
  const item = stateView(cwd).work['edit-risk'];
  assert.equal(item.risk, 'high');
  assert.equal(item.title, 'Title edit-risk');
  assert.equal(item.kind, 'task');
  assert.equal(item.status, 'todo');
});

test('two sequential edits both land — the second patch does not undo the first', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-twice');
  run(cwd, ['edit', 'edit-twice', '--risk', 'high']);
  const result = run(cwd, ['edit', 'edit-twice', '--verify', 'npm run check']);
  assert.equal(result.status, 0);
  const item = stateView(cwd).work['edit-twice'];
  assert.equal(item.risk, 'high');
  assert.equal(item.verify, 'npm run check');
});

test('edit on an unknown id is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['edit', 'never-added', '--risk', 'high']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, 0);
});

test('edit with zero field flags is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-no-flags');
  const before = eventLines(cwd).length;
  const result = run(cwd, ['edit', 'edit-no-flags']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});

test('edit --deps pointing at an unknown id is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-bad-dep');
  const before = eventLines(cwd).length;
  const result = run(cwd, ['edit', 'edit-bad-dep', '--deps', 'ghost-dep']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});

test('edit rejects a patch targeting id/status/stage/domain, exit 4, no event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-locked-fields');
  const before = eventLines(cwd).length;
  for (const field of ['status', 'stage', 'domain']) {
    const result = run(cwd, ['edit', 'edit-locked-fields', `--${field}`, 'whatever']);
    assert.equal(result.status, 4, `--${field} should be rejected`);
  }
  assert.equal(eventLines(cwd).length, before);
  assert.equal(stateView(cwd).work['edit-locked-fields'].status, 'todo');
});

test('edit succeeds identically regardless of the item current status', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-any-status');
  run(cwd, ['move', 'edit-any-status', '--to', 'doing']);
  const result = run(cwd, ['edit', 'edit-any-status', '--risk', 'high']);
  assert.equal(result.status, 0);
  const item = stateView(cwd).work['edit-any-status'];
  assert.equal(item.risk, 'high');
  assert.equal(item.status, 'doing');
});

test('a pre-existing event log with no work.edit events replays byte-identical', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'no-edit-here');
  const before = stateView(cwd);
  run(cwd, ['rebuild']);
  assert.deepEqual(stateView(cwd), before);
});

test('edit omitting --refs/--deps leaves the field untouched; an explicit empty value clears it', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['add', 'edit-refs', '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--refs', 'a,b']);
  assert.equal(result.status, 0);

  const untouched = run(cwd, ['edit', 'edit-refs', '--risk', 'high']);
  assert.equal(untouched.status, 0);
  assert.deepEqual(stateView(cwd).work['edit-refs'].refs, ['a', 'b']);

  const cleared = run(cwd, ['edit', 'edit-refs', '--refs', '']);
  assert.equal(cleared.status, 0);
  assert.deepEqual(stateView(cwd).work['edit-refs'].refs, []);
});

test('editWork rejects a patch containing id/status/stage/domain as validation, before merge, no event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-store-locked');
  const dir = path.join(cwd, '.fgos');
  const before = eventLines(cwd).length;
  for (const key of ['id', 'status', 'stage', 'domain']) {
    assert.throws(
      () => editWork(dir, { id: 'edit-store-locked', patch: { [key]: 'whatever' } }),
      (err) => err instanceof StoreError && err.category === 'validation',
      `patch.${key} should be rejected`,
    );
  }
  assert.equal(eventLines(cwd).length, before);
});

test('edit reports the real event seq in its envelope data, not undefined', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-seq-check'); // event #1
  const result = run(cwd, ['edit', 'edit-seq-check', '--risk', 'high']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.seq, 2);
  assert.equal(data.id, 'edit-seq-check');
  assert.deepEqual(data.fields, ['risk']);
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

test('list prints the current view as parseable envelope data, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'listed');
  const result = run(cwd, ['list']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.ok(data.work.listed);
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

test('repair fixes a truncated final line via the real CLI, log becomes readable and usable again', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'before-truncation');
  const before = eventLines(cwd).length;
  fs.appendFileSync(logPath(cwd), '{"seq":99,"partial', 'utf8');

  const repaired = run(cwd, ['repair']);
  assert.equal(repaired.status, 0);
  assert.equal(eventLines(cwd).length, before);

  const list = run(cwd, ['list']);
  assert.equal(list.status, 0);
  assert.ok(envelopeData(list.stdout).work['before-truncation']);
});

test('repair refuses mid-file corruption via the real CLI (valid, corrupt, valid), exit 5, log left untouched', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'a');
  addOk(cwd, 'b');
  const [firstLine, secondLine] = eventLines(cwd);
  fs.writeFileSync(logPath(cwd), `${firstLine}\nnot json either\n${secondLine}\n`, 'utf8');
  const before = fs.readFileSync(logPath(cwd), 'utf8');

  const result = run(cwd, ['repair']);
  assert.equal(result.status, 5);
  assert.equal(fs.readFileSync(logPath(cwd), 'utf8'), before);
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

// --- base-workflow-model S2: --domain on `add` (D1-D4) ---

test('add without --domain leaves domain unset — the view still reads "coding" behavior unchanged, exit 0', () => {
  const cwd = tmpCwd();
  const result = addOk(cwd, 'default-domain-item');
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['default-domain-item'].domain, undefined);
});

test('add --domain synthetic persists work.domain and the item\'s default stage resolves to "assembling" (no --stage flag needed), exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, [
    'add', 'synthetic-item',
    '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x',
    '--domain', 'synthetic',
  ]);
  assert.equal(result.status, 0);
  const item = stateView(cwd).work['synthetic-item'];
  assert.equal(item.domain, 'synthetic');
  assert.equal(item.stage, undefined, 'add still omits stage explicitly — the lazy per-domain default resolves it, not new fgos.mjs code');
  assert.deepEqual(envelopeData(run(cwd, ['ready']).stdout).map((w) => w.id), ['synthetic-item'], 'the item resolves to its domain\'s one Execute-mapped stage ("assembling") through the existing lazy default, so it is already frontier-ready');
});

test('add --domain coding is explicit and behaves identically to omitting --domain, exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, [
    'add', 'explicit-coding-item',
    '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x',
    '--domain', 'coding',
  ]);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['explicit-coding-item'].domain, 'coding');
});

test('add with an unrecognized --domain value is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  const before = eventLines(cwd).length;
  const result = run(cwd, [
    'add', 'bad-domain-item',
    '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x',
    '--domain', 'bogus',
  ]);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});

test('add with a bare --domain (no value) is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  const before = eventLines(cwd).length;
  const result = run(cwd, ['add', 'bare-domain-item', '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--domain']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});

test('add never gained a --stage flag: passing --stage is simply ignored (not a recognized flag on this verb)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['add', 'stage-flag-ignored', '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--stage', 'assembling']);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['stage-flag-ignored'].stage, undefined);
});

// --- work-graph-intelligence S2b: --discovered-from on `add` (producer A) ---

test('add without --discovered-from leaves discoveredFrom unset, exit 0', () => {
  const cwd = tmpCwd();
  const result = addOk(cwd, 'no-discovered-item');
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['no-discovered-item'].discoveredFrom, undefined);
});

test('add --discovered-from persists discoveredFrom on the new item, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'origin-item');
  const result = run(cwd, [
    'add', 'discovered-item',
    '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x',
    '--discovered-from', 'origin-item',
  ]);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['discovered-item'].discoveredFrom, 'origin-item');
});

test('add with an empty --discovered-from "" is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  const before = eventLines(cwd).length;
  const result = run(cwd, ['add', 'empty-discovered-item', '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--discovered-from', '']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});

test('add with a bare --discovered-from (no value) is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  const before = eventLines(cwd).length;
  const result = run(cwd, ['add', 'bare-discovered-item', '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--discovered-from']);
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
  const data = envelopeData(result.stdout);
  assert.equal(data.work['listed-proposed'].status, 'proposed');
  assert.equal(data.work['listed-proposed'].tier, 'standard');
});

// --- `fgos ready` (phase-2-routing-5) ---

test('ready prints the frontier as parseable, machine-readable envelope data, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'freestanding');
  const result = run(cwd, ['ready']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.ok(Array.isArray(data));
  assert.equal(data.length, 1);
  assert.equal(data[0].id, 'freestanding');
});

test('ready excludes a todo item whose dep sits at proposed (proposed is not done): dep at proposed does NOT open dependent work', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'dep-in-proposed');
  const result = run(cwd, ['add', 'blocked-on-proposed', '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--deps', 'dep-in-proposed']);
  assert.equal(result.status, 0);

  const ready = envelopeData(run(cwd, ['ready']).stdout);
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

  const ready = envelopeData(run(cwd, ['ready']).stdout);
  assert.ok(ready.some((item) => item.id === 'unblocked-item'));
});

test('ready on a directory with no log at all returns an empty result, exit 0 (a read never initializes .fgos/)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['ready']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout), []);
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
  // generated_at legitimately differs between the two envelopes (each is
  // stamped at call time) — the golden byte-identical claim belongs to the
  // underlying data, not the envelope wrapper.
  assert.deepEqual(envelopeData(first.stdout), envelopeData(second.stdout));

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

test('check on an item with no recorded outcome returns a null predicted/actual entry for that id, exit 0, no throw', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'unchecked-item');
  const result = run(cwd, ['check', 'unchecked-item']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.deepEqual(data.outcomes, [{ id: 'unchecked-item', predicted: null, actual: null }]);
});

test('check on a directory with no log at all returns an empty outcomes list, exit 0 (a read never initializes .fgos/)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.deepEqual(data.outcomes, []);
  assert.equal(data.friction, null);
  assert.equal(data.entropy, null);
  assert.ok(!fs.existsSync(path.join(cwd, '.fgos')));
});

test('check returns BOTH predicted and actual values for an item with real outcome data, exit 0', () => {
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
  const data = envelopeData(result.stdout);
  assert.equal(data.outcomes.length, 1);
  assert.equal(data.outcomes[0].id, 'checked-item');
  assert.equal(data.outcomes[0].predicted.tier, 'standard');
  assert.equal(data.outcomes[0].actual.outcome, 'proposed');
  assert.equal(data.outcomes[0].actual.passed, true);
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
  const data = envelopeData(result.stdout);
  assert.equal(data.outcomes.length, 1);
  assert.equal(data.outcomes[0].id, 'item-a', 'item-b has no outcome data yet, so it is not listed');
});

// --- rollup view theo bộ (P24) ----------------------------------------------
//
// A root item's children carry `parent` (set by decompose, P16) — `add`
// itself has no `--parent` flag, so these seed a child through store.mjs's
// addWork directly, the same way decompose.mjs writes one in production.

test('rollup on a root with n children, k done, prints k/n and lists every child with its own status, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'root-item', { title: 'Root Item' });
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'child-a', title: 'Child A', kind: 'task', status: 'done', deps: [], risk: 'low', refs: [], verify: 'npm test', parent: 'root-item' });
  addWork(dir, { id: 'child-b', title: 'Child B', kind: 'task', status: 'todo', deps: [], risk: 'low', refs: [], verify: 'npm test', parent: 'root-item' });
  addWork(dir, { id: 'child-c', title: 'Child C', kind: 'task', status: 'done', deps: [], risk: 'low', refs: [], verify: 'npm test', parent: 'root-item' });

  const result = run(cwd, ['rollup', 'root-item']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.id, 'root-item');
  assert.equal(data.title, 'Root Item');
  assert.equal(data.status, 'todo');
  assert.equal(data.doneCount, 2);
  assert.equal(data.totalCount, 3);
  assert.deepEqual(data.children, [
    { id: 'child-a', title: 'Child A', status: 'done' },
    { id: 'child-b', title: 'Child B', status: 'todo' },
    { id: 'child-c', title: 'Child C', status: 'done' },
  ]);
});

test('rollup on an item with no children returns 0/0 and an empty children list, exit 0, no throw', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'lonely-item');

  const result = run(cwd, ['rollup', 'lonely-item']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.doneCount, 0);
  assert.equal(data.totalCount, 0);
  assert.deepEqual(data.children, []);
});

test('rollup on a nonexistent id is rejected as validation (not-found), exit 4', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'root-item');

  const result = run(cwd, ['rollup', 'no-such-item']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /rollup: work "no-such-item" not found/);
});

test('rollup with no id at all is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['rollup']);
  assert.equal(result.status, 4);
});

test('rollup never mutates state: no event is appended and no children of an unrelated item are counted', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'root-item');
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'child-a', title: 'Child A', kind: 'task', status: 'done', deps: [], risk: 'low', refs: [], verify: 'npm test', parent: 'root-item' });
  addOk(cwd, 'unrelated-item');

  const before = eventLines(cwd);
  const result = run(cwd, ['rollup', 'root-item']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.doneCount, 1);
  assert.equal(data.totalCount, 1);
  assert.ok(!data.children.some((c) => c.id === 'unrelated-item'));
  assert.deepEqual(eventLines(cwd), before);
});

// --- backlog-triage impact ranking (P21) ------------------------------------
//
// Separate from P14's intake-time risk/lane classification: `triage` ranks
// OPEN work by blocking fan-out (how many other still-open items depend on
// it), highest first.

test('triage on an empty backlog returns an empty ranked list, exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['triage']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout), []);
});

test('triage ranks a base item above the items that depend on it', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'base');
  run(cwd, ['add', 'dep1', '--title', 'Dep1', '--kind', 'task', '--risk', 'low', '--verify', 'npm test', '--deps', 'base']);
  run(cwd, ['add', 'dep2', '--title', 'Dep2', '--kind', 'task', '--risk', 'low', '--verify', 'npm test', '--deps', 'base']);

  const result = run(cwd, ['triage']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  const base = data.find((r) => r.id === 'base');
  const dep1 = data.find((r) => r.id === 'dep1');
  assert.equal(base.title, 'Title base');
  assert.equal(base.status, 'todo');
  assert.equal(base.blocks, 2);
  assert.equal(dep1.title, 'Dep1');
  assert.equal(dep1.blocks, 0);
});

test('triage excludes a done item from ranking, and a done dependent never counts as blocked', () => {
  const cwd = tmpCwd();
  const dir = path.join(cwd, '.fgos');
  addOk(cwd, 'base');
  addWork(dir, { id: 'finished-dependent', title: 'Finished Dependent', kind: 'task', status: 'done', deps: ['base'], risk: 'low', refs: [], verify: 'npm test' });
  addWork(dir, { id: 'done-item', title: 'Done Item', kind: 'task', status: 'done', deps: [], risk: 'low', refs: [], verify: 'npm test' });

  const result = run(cwd, ['triage']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  const base = data.find((r) => r.id === 'base');
  assert.equal(base.status, 'todo');
  assert.equal(base.blocks, 0);
  assert.ok(!data.some((r) => r.id === 'done-item'));
});

test('triage never mutates state: no event is appended', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'base');

  const before = eventLines(cwd);
  const result = run(cwd, ['triage']);
  assert.equal(result.status, 0);
  assert.deepEqual(eventLines(cwd), before);
});

// --- friction channel in `check` (phase-3-compound-learning-4, S2) ---------
//
// Same write-door discipline as the outcome tests above: only the runner
// writes work.friction in production, so these seed through store.mjs's
// addFriction and exercise the real `check` binary read-side.

test('check returns the friction data — per-layer counts + recent records — when friction data exists', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'fric-item');
  const dir = path.join(cwd, '.fgos');
  addFriction(dir, { id: 'fric-item', disposition: 'parked', errorClass: 'verify-miss', layer: 'verification', attempts: 2, detail: 'goal-check failed (exit 1)' });
  addFriction(dir, { id: 'fric-item', disposition: 'halted', errorClass: 'worker-timeout', layer: 'environment', attempts: 1, detail: 'timed out' });

  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  const { friction } = envelopeData(result.stdout);
  assert.equal(friction.count, 2);
  assert.deepEqual(friction.byLayer, { verification: 1, environment: 1 });
  const parked = friction.recent.find((r) => r.disposition === 'parked');
  const halted = friction.recent.find((r) => r.disposition === 'halted');
  assert.equal(parked.id, 'fric-item');
  assert.equal(parked.errorClass, 'verify-miss');
  assert.equal(parked.layer, 'verification');
  assert.equal(parked.attempts, 2);
  assert.equal(halted.id, 'fric-item');
  assert.equal(halted.errorClass, 'worker-timeout');
  assert.equal(halted.layer, 'environment');
});

test('check nags items sitting in a final status without their actual half (porting-outcome-lifecycle: no silent record)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'nag-item');
  toProposed(cwd, 'nag-item');

  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  const { missingOutcomeNag } = envelopeData(result.stdout);
  assert.deepEqual(missingOutcomeNag, { count: 1, ids: ['nag-item'] });
});

test('check output on a log with no friction and no final-status gaps is unchanged — no friction data, no nag', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'clean-item');
  const dir = path.join(cwd, '.fgos');
  addOutcome(dir, { id: 'clean-item', predicted: { tier: 'standard', deps: 0, priorVisits: 0 } });

  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.friction, null);
  assert.equal(data.missingOutcomeNag, null);
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
  assert.deepEqual(envelopeData(askResult.stdout), { id: 'gated-item', from: 'doing', to: 'awaiting-human', seq: 3 });
  assert.equal(stateView(cwd).work['gated-item'].status, 'awaiting-human');

  // D7: list surfaces the parked item's status and its question, no new
  // read command/formatter — the existing `view.gates` fold carries it.
  const listedWhileAwaiting = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(listedWhileAwaiting.work['gated-item'].status, 'awaiting-human');
  assert.equal(listedWhileAwaiting.gates['gated-item'].ask, 'OAuth or password?');
  assert.equal(listedWhileAwaiting.gates['gated-item'].answer, undefined);

  // D6: a parked item is never in the ready set.
  const readyWhileAwaiting = envelopeData(run(cwd, ['ready']).stdout);
  assert.ok(!readyWhileAwaiting.some((i) => i.id === 'gated-item'));

  const answerResult = run(cwd, ['answer', 'gated-item', '--text', 'OAuth']);
  assert.equal(answerResult.status, 0);
  assert.deepEqual(envelopeData(answerResult.stdout), { id: 'gated-item', from: 'awaiting-human', to: 'todo', seq: 4 });
  assert.equal(stateView(cwd).work['gated-item'].status, 'todo');

  const listedAfterAnswer = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(listedAfterAnswer.gates['gated-item'].ask, 'OAuth or password?');
  assert.equal(listedAfterAnswer.gates['gated-item'].answer, 'OAuth');

  const readyAfterAnswer = envelopeData(run(cwd, ['ready']).stdout);
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

test('submit persists the full text as description, separate from the (possibly truncated) title (P30)', () => {
  const cwd = tmpCwd();
  const text = 'Investigate the sluggish overview page and figure out why it takes so long to render for large accounts';
  const result = run(cwd, ['submit', text]);
  assert.equal(result.status, 0);
  const item = JSON.parse(result.stdout).data;
  assert.equal(item.description, text);

  const view = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(view.work[item.id].description, text);
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

  const view = envelopeData(run(cwd, ['list']).stdout);
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

  const view = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(view.work[syncId].mode, 'sync');
  assert.equal(view.work[asyncId].mode, 'async');
});

test('submit with --unattended is treated the same as --async: mode:"async" (D2)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Draft the onboarding walkthrough', '--unattended']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].mode, 'async');
});

test('submit of text matching no keyword falls back to tier:"standard" and persists, exit 0 (D1)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Investigate the sluggish overview page']);
  assert.equal(result.status, 0);
  const item = JSON.parse(result.stdout).data;
  assert.equal(item.tier, 'standard');
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[item.id].tier, 'standard');
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
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].stage, 'clarify');
});

test('add leaves stage unset — the item reads as executing via the lazy default (D8)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'plain-add');
  const item = envelopeData(run(cwd, ['list']).stdout).work['plain-add'];
  assert.equal(item.stage, undefined);
});

// --- base-workflow-model S2: --domain on `submit` (D1-D4, E3) ---

test('submit without --domain is byte-identical to before: domain unset, stage "clarify" (coding\'s Clarify-mapped stage), exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Investigate the sluggish overview page']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  const item = envelopeData(run(cwd, ['list']).stdout).work[id];
  assert.equal(item.domain, undefined);
  assert.equal(item.stage, 'clarify');
});

test('submit --domain coding is explicit and still resolves stage to "clarify", exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Investigate the sluggish overview page', '--domain', 'coding']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  const item = envelopeData(run(cwd, ['list']).stdout).work[id];
  assert.equal(item.domain, 'coding');
  assert.equal(item.stage, 'clarify');
});

test('submit --domain synthetic persists work.domain and resolves stage to its own first stage ("assembling", no Clarify-mapped stage), exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Try the synthetic domain', '--domain', 'synthetic']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  const item = envelopeData(run(cwd, ['list']).stdout).work[id];
  assert.equal(item.domain, 'synthetic');
  assert.equal(item.stage, 'assembling');
});

test('submit with an unrecognized --domain value is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  const before = eventLines(cwd).length;
  const result = run(cwd, ['submit', 'Try a bad domain', '--domain', 'bogus']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});

test('submit --domain <bad> produces exactly one stderr line (the validation error), no stray "folding to coding" warning — parity with add (review-20260717-self-improve-base-workflow f3)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Try a bad domain again', '--domain', 'bogus']);
  assert.equal(result.status, 4);
  assert.doesNotMatch(result.stderr, /folding to "coding"/);
  const stderrLines = result.stderr.split('\n').filter(Boolean);
  assert.equal(stderrLines.length, 1, `expected exactly one stderr line, got: ${JSON.stringify(stderrLines)}`);
});

test('submit with a bare --domain (no value) is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  const before = eventLines(cwd).length;
  const result = run(cwd, ['submit', 'Try a bare domain flag', '--domain']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});

// --- work-graph-intelligence S2b: --discovered-from on `submit` (producer A, two-hop) ---

test('submit without --discovered-from leaves discoveredFrom unset, exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Investigate the sluggish overview page']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  const item = envelopeData(run(cwd, ['list']).stdout).work[id];
  assert.equal(item.discoveredFrom, undefined);
});

test('submit --discovered-from persists discoveredFrom (two-hop: opts -> submitWork work object), exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'origin-item');
  const result = run(cwd, ['submit', 'Follow up on the origin item', '--discovered-from', 'origin-item']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  const item = envelopeData(run(cwd, ['list']).stdout).work[id];
  assert.equal(item.discoveredFrom, 'origin-item');
});

test('submit with an empty --discovered-from "" is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  const before = eventLines(cwd).length;
  const result = run(cwd, ['submit', 'Try an empty discovered-from', '--discovered-from', '']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});

test('submit with a bare --discovered-from (no value) is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  const before = eventLines(cwd).length;
  const result = run(cwd, ['submit', 'Try a bare discovered-from flag', '--discovered-from']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});

// RETARGET (stage-decompose D2, cell 3): `discover` on a stage-`clarify`
// item still only runs `resolveDiscovery` (one hop) — a clear verdict now
// lands it on stage `decompose`, not `executing` directly, since chia-việc
// is the next stop before executing. This assertion changed its expected
// destination from `executing` to `decompose` for exactly that reason (per
// D2, an intentional contract change, not a test nerf).
test('discover on a clear verdict moves the submitted item to stage decompose with the model-proposed verify (D5/D10, stage-decompose D2 retarget)', () => {
  const cwd = tmpCwd();
  writeRunnerConfig(cwd, { clear: true, verify: 'npm test -- proven' });
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;

  const result = run(cwd, ['discover', id]);
  assert.equal(result.status, 0);
  const envelope = JSON.parse(result.stdout);
  assert.equal(envelope.contract, 'fgos.v1');
  assert.equal(envelope.data.outcome, 'clear');

  const item = envelopeData(run(cwd, ['list']).stdout).work[id];
  assert.equal(item.stage, 'decompose');
  assert.equal(item.verify, 'npm test -- proven');
});

// The sync path's second hop (stage-decompose D3 parity): calling `discover`
// again on the same item, now sitting at stage `decompose`, dispatches to
// `resolveDecompose` instead of `resolveDiscovery` — same verb, same actor
// attribution, the engine picked by the item's CURRENT stage.
test("discover called a second time, once the item sits at stage decompose, dispatches to resolveDecompose and pass-throughs it on to executing (D3 sync/async parity)", () => {
  const cwd = tmpCwd();
  writeRunnerConfig(cwd, { clear: true, verify: 'npm test -- proven' });
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;

  run(cwd, ['discover', id]);
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].stage, 'decompose');

  // Same scripted executor's `{clear:true, verify:...}` reply is not a
  // valid chia-việc verdict shape (no `verdict` key) — judgeDecompose's
  // fail-safe folds it to `invalid`, and resolveDecompose leaves the item
  // exactly where it was for the next sweep/call to retry (mẫu C9).
  const invalidAttempt = run(cwd, ['discover', id]);
  assert.equal(invalidAttempt.status, 0);
  assert.equal(JSON.parse(invalidAttempt.stdout).data.outcome, 'invalid');
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].stage, 'decompose', 'invalid verdict leaves the item untouched, not silently advanced');

  // Rewrite the executor config with a real pass-through chia-việc verdict
  // and call `discover` a third time — now it dispatches to resolveDecompose
  // and carries the item the rest of the way.
  writeRunnerConfig(cwd, { verdict: 'pass-through' });
  const passThrough = run(cwd, ['discover', id]);
  assert.equal(passThrough.status, 0);
  assert.equal(JSON.parse(passThrough.stdout).data.outcome, 'pass-through');
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].stage, 'executing');
});

test('discover on an unclear verdict parks the submitted item in awaiting-human with the question, still stage clarify (D5/D7)', () => {
  const cwd = tmpCwd();
  writeRunnerConfig(cwd, { clear: false, question: 'Which service?' });
  const id = JSON.parse(run(cwd, ['submit', 'Do the ambiguous work']).stdout).data.id;

  const result = run(cwd, ['discover', id]);
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).data.outcome, 'unclear');

  const view = envelopeData(run(cwd, ['list']).stdout);
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

test('check returns the settlement data — per-kind/actor counts + recent records — when settlement data exists', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'settle-item');
  run(cwd, ['move', 'settle-item', '--to', 'done']);

  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  const { settlement } = envelopeData(result.stdout);
  assert.equal(settlement.count, 1);
  assert.deepEqual(settlement.byKindActor, { 'close/human': 1 });
  assert.equal(settlement.recent[0].kind, 'close');
  assert.equal(settlement.recent[0].id, 'settle-item');
  assert.equal(settlement.recent[0].actor, 'human');
});

test('check output on a log with no settling transitions is unchanged — no settlement data', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'no-settlement-item');

  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  assert.equal(envelopeData(result.stdout).settlement, null);
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
  const { entropy } = envelopeData(result.stdout);
  assert.equal(entropy.trend.baseline, true);
  assert.equal(entropy.trend.delta, null);
  const stalePart = entropy.parts.find((p) => p.label === 'stale-doing');
  assert.deepEqual(stalePart, { label: 'stale-doing', count: 1, weight: 5, points: 5 });
  assert.notEqual(entropy.score, 0, 'a doing item must contribute a nonzero baseline score');
});

test('check reports a seal-digest delta only meaningfully for channels with real compound data, and every channel is always present (per this cell action (3))', () => {
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
  const firstEntropy = envelopeData(first.stdout).entropy;
  assert.equal(firstEntropy.compounded.outcomes, 1);
  assert.equal(firstEntropy.compounded.frictions, 0);
  assert.equal(firstEntropy.compounded.settlements, 0);

  // Second run over the same (unchanged) store: the outcome channel already
  // has data, so its delta is now zero against the last checkpoint — the
  // digest is a live snapshot, not a one-shot "something changed" flag.
  const second = run(cwd, ['check']);
  assert.equal(second.status, 0);
  assert.equal(envelopeData(second.stdout).entropy.compounded.outcomes, 0);
});

test('check on a second consecutive run over the same store prints a real trend delta against the first run (not baseline again)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'entropy-trend-item');
  assert.equal(run(cwd, ['move', 'entropy-trend-item', '--to', 'doing']).status, 0);

  const first = run(cwd, ['check']);
  assert.equal(first.status, 0);
  assert.equal(envelopeData(first.stdout).entropy.trend.baseline, true);

  // Move the item out of "doing" (stale-suspect ×5) into "awaiting-human"
  // (×2) between the two checks — the score must genuinely shift, not just
  // repeat, so the delta on run 2 is real evidence of trend.
  assert.equal(run(cwd, ['ask', 'entropy-trend-item', '--text', 'blocked on what?']).status, 0);

  const second = run(cwd, ['check']);
  assert.equal(second.status, 0);
  const secondEntropy = envelopeData(second.stdout).entropy;
  assert.equal(secondEntropy.trend.baseline, false);
  assert.equal(secondEntropy.trend.delta, 2 - 5, 'doing(×5) -> awaiting-human(×2) must show a -3 delta');
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

test('check tolerates a torn final entropy-history line — folds trend against the last COMPLETE checkpoint instead of throwing', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'torn-history-item');
  run(cwd, ['move', 'torn-history-item', '--to', 'doing']);

  // First check writes one complete checkpoint line — the baseline.
  const first = run(cwd, ['check']);
  assert.equal(first.status, 0);
  assert.equal(envelopeData(first.stdout).entropy.trend.baseline, true);

  // Simulate a crash mid-append: a partial, unparseable JSON line at EOF.
  const historyPath = path.join(cwd, '.fgos', 'entropy-history.jsonl');
  fs.appendFileSync(historyPath, '{"ts":"2026-07-18T00:00:00.000Z","score":9,"cou', 'utf8');

  // The torn last line must NOT crash check: readLastHistoryEntry walks back to
  // the previous COMPLETE checkpoint, so trend still folds as a real delta.
  const second = run(cwd, ['check']);
  assert.equal(second.status, 0);
  const trend = envelopeData(second.stdout).entropy.trend;
  assert.equal(trend.baseline, false);
  assert.equal(typeof trend.delta, 'number');
});

test('check on a directory with no log at all still never initializes .fgos/ (entropy data stays absent, same as friction/settlement)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.deepEqual(data.outcomes, []);
  assert.equal(data.entropy, null);
  assert.ok(!fs.existsSync(path.join(cwd, '.fgos')));
});

// --- câu-6 tự động (phase-3-compound-learning-7, S3-closeout (c)) — the
// learning record is composed mechanically by store.mjs at close time
// (never here); these tests only exercise its surfacing through the real
// `fgos check` binary. ------------------------------------------------------

test('check returns the learning data — outcome/friction/settlement summary — for an item that reached done with real outcome+friction data', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'learning-item');
  const dir = path.join(cwd, '.fgos');
  run(cwd, ['move', 'learning-item', '--to', 'doing']);
  addOutcome(dir, {
    id: 'learning-item',
    actual: { outcome: 'pass', passed: true, attempts: 1, errorClass: null, aheadCount: 0, visits: 1 },
  });
  addFriction(dir, {
    id: 'learning-item',
    disposition: 'parked',
    errorClass: 'verify-miss',
    layer: 'verification',
    attempts: 1,
    detail: 'miss',
  });

  const result = run(cwd, ['move', 'learning-item', '--to', 'done']);
  assert.equal(result.status, 0);

  const check = run(cwd, ['check']);
  assert.equal(check.status, 0);
  const { learning } = envelopeData(check.stdout);
  assert.equal(learning.count, 1);
  const record = learning.recent[0];
  assert.equal(record.id, 'learning-item');
  assert.equal(record.outcome.disposition, 'pass');
  assert.equal(record.outcome.attempts, 1);
  assert.equal(record.outcome.errorClass, null);
  assert.deepEqual(record.frictions, { verification: 1 });
  assert.deepEqual(record.settlements, { 'close/human': 1 });
});

test('check on a log with no item ever reaching done is unchanged — no learning data', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'no-learning-item');
  run(cwd, ['move', 'no-learning-item', '--to', 'doing']);

  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  assert.equal(envelopeData(result.stdout).learning, null);
});

// --- take/return: cửa pull giao–nhận việc (stage-decompose S2-pull D1) -----

test('take with no --id claims the frontier head, defaults actor to human, records headAtTake, and writes a predicted outcome', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-a', { verify: 'test -f done.txt' });
  const headBefore = gitHead(cwd);

  const result = run(cwd, ['take']);
  assert.equal(result.status, 0, `take failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.id, 'pull-a');
  assert.equal(data.actor, 'human');

  const view = stateView(cwd);
  assert.equal(view.work['pull-a'].status, 'doing');
  assert.equal(view.work['pull-a'].claimActor, 'human');
  assert.equal(view.work['pull-a'].headAtTake, headBefore);
  assert.equal(view.outcomes['pull-a'].predicted.actor, 'human');
  assert.equal(view.outcomes['pull-a'].predicted.headAtTake, headBefore);
  assert.equal(view.outcomes['pull-a'].predicted.tier, 'standard');
});

test('take --actor session records claimActor "session" instead of the default human', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-session');

  const result = run(cwd, ['take', '--actor', 'session']);
  assert.equal(result.status, 0, `take failed: ${result.stderr}`);
  assert.equal(stateView(cwd).work['pull-session'].claimActor, 'session');
});

test('take --actor with an invalid value is rejected as validation, exit 4, no event written', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-bad-actor');
  const before = eventLines(cwd).length;

  const result = run(cwd, ['take', '--actor', 'robot']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});

test('take on an empty frontier is rejected as validation, exit 4, no event written', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  const before = eventLines(cwd).length;

  const result = run(cwd, ['take']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});

test('take --id on a todo item outside the frontier (dep not done) is rejected as validation — take opens only the same set the runner would dispatch (D1)', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-dep-source');
  run(cwd, ['add', 'pull-dep-blocked', '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'npm test', '--deps', 'pull-dep-source']);
  const before = eventLines(cwd).length;

  const result = run(cwd, ['take', '--id', 'pull-dep-blocked']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before, 'a rejected take never claims and never writes an event');
  assert.equal(stateView(cwd).work['pull-dep-blocked'].status, 'todo');
});

test('take --id on an item already claimed (doing) falls through to moveWork\'s own CAS — conflict, exit 3, not a duplicated validation message', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-double-take');
  assert.equal(run(cwd, ['take', '--id', 'pull-double-take']).status, 0);

  const result = run(cwd, ['take', '--id', 'pull-double-take']);
  assert.equal(result.status, 3);
  assert.equal(stateView(cwd).work['pull-double-take'].status, 'doing');
});

test('take --id not found is rejected as validation, exit 4', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  const result = run(cwd, ['take', '--id', 'no-such-item']);
  assert.equal(result.status, 4);
});

test('return happy path: verify passes -> doing to proposed, actual outcome recorded, no settlement (settlement belongs to the -> done edge, D4)', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-ok', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-ok']).status, 0);
  commitFile(cwd, 'proof.txt');

  const headAtReturn = gitHead(cwd);
  const result = run(cwd, ['return', 'pull-return-ok']);
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.to, 'proposed');
  assert.equal(data.passed, true);

  const view = stateView(cwd);
  assert.equal(view.work['pull-return-ok'].status, 'proposed');
  assert.equal(view.outcomes['pull-return-ok'].actual.outcome, 'proposed');
  assert.equal(view.outcomes['pull-return-ok'].actual.passed, true);
  assert.equal(view.outcomes['pull-return-ok'].actual.aheadCount, 1);
  assert.equal(view.work['pull-return-ok'].headAtReturn, headAtReturn, 'pr-lifecycle D3/D4: return records HEAD at green-return time, mirroring headAtTake at claim time');
  assert.equal('settlements' in view, false, 'doing -> proposed never settles (D4: settlement belongs to the -> done edge)');
});

test('return refuses a dirty working tree (uncommitted changes) as validation, exit 4, item stays doing', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-dirty', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-dirty']).status, 0);
  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'uncommitted\n'); // never git add/commit

  // Sanity: `.fgos/` is ALSO dirty here (take's own event, never committed —
  // reported collapsed as "?? .fgos/" since nothing inside it has ever been
  // tracked yet) — proving the .fgos/ exclusion below does not accidentally
  // mask this rejection; it's proof.txt, a real non-.fgos path, that trips it.
  assert.match(execFileSync('git', ['status', '--porcelain'], { cwd, encoding: 'utf8' }), /\.fgos/);

  const result = run(cwd, ['return', 'pull-return-dirty']);
  assert.equal(result.status, 4);
  assert.equal(stateView(cwd).work['pull-return-dirty'].status, 'doing');
});

test('return succeeds when ONLY .fgos/ (the live event log) is dirty — its own take/return writes are excluded from the clean-tree gate (no more manual events.jsonl commit before every return)', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-fgos-only-dirty', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-fgos-only-dirty']).status, 0);

  // Commit ONLY the produced file — deliberately leave the take event's
  // `.fgos/events.jsonl` delta uncommitted, unlike commitFile's `git add -A`
  // which would fold both together and never isolate the exclusion.
  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'work\n');
  execFileSync('git', ['add', 'proof.txt'], { cwd });
  execFileSync('git', ['commit', '-q', '-m', 'work: proof.txt'], { cwd });

  // `.fgos/` has never had a tracked file inside it in this fixture, so git
  // reports it collapsed as a single untracked directory ("?? .fgos/")
  // rather than listing events.jsonl individually — either shape must still
  // count as "only .fgos/ dirty" for the exclusion below.
  const statusLines = execFileSync('git', ['status', '--porcelain'], { cwd, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
  assert.equal(statusLines.length, 1, 'sanity: .fgos/ must be the ONLY dirty path at this point');
  assert.match(statusLines[0], /\.fgos\/?$/);

  const result = run(cwd, ['return', 'pull-return-fgos-only-dirty']);
  assert.equal(result.status, 0, `return should succeed with only .fgos/ dirty: ${result.stderr}`);
  assert.equal(stateView(cwd).work['pull-return-fgos-only-dirty'].status, 'proposed');
});

test('return refuses when HEAD has not advanced past headAtTake — a clean tree with zero real progress — as validation, exit 4, item stays doing', () => {
  // `.fgos/` entirely gitignored here (unlike initGitCwd's `.fgos/state.json`
  // only) so the tree is genuinely clean right after `take` with no commit
  // at all — isolating the HEAD-advance check from the tree-clean check,
  // which a tracked events.jsonl would otherwise always fail together (this
  // repo's own convention commits events.jsonl, so making the tree clean
  // there always requires a commit that also advances HEAD).
  const cwd = tmpCwd();
  execFileSync('git', ['init', '-q'], { cwd });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd });
  fs.writeFileSync(path.join(cwd, '.gitignore'), '.fgos/\n');
  fs.writeFileSync(path.join(cwd, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt', '.gitignore'], { cwd });
  execFileSync('git', ['commit', '-q', '-m', 'seed'], { cwd });

  run(cwd, ['init']);
  addOk(cwd, 'pull-return-stale', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-stale']).status, 0);

  const result = run(cwd, ['return', 'pull-return-stale']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /HEAD has not advanced/);
  assert.equal(stateView(cwd).work['pull-return-stale'].status, 'doing');
});

test('return verify-fail: doing -> blocked + friction (verification layer), exit 0 (a defined outcome, not a CLI error) — mirrors the runner\'s own park path', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-red', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-red']).status, 0);
  commitFile(cwd, 'wrong-file.txt'); // advances HEAD, but never satisfies verify

  const result = run(cwd, ['return', 'pull-return-red']);
  assert.equal(result.status, 0, `return should exit 0 for a defined blocked outcome: ${result.stderr}`);
  assert.equal(envelopeData(result.stdout).to, 'blocked');

  const view = stateView(cwd);
  assert.equal(view.work['pull-return-red'].status, 'blocked');
  assert.equal(view.outcomes['pull-return-red'].actual.outcome, 'blocked');
  assert.equal(view.outcomes['pull-return-red'].actual.passed, false);
  assert.equal(view.frictions['pull-return-red'][0].layer, 'verification');
  assert.equal(view.frictions['pull-return-red'][0].errorClass, 'verify-miss');
});

test('return on an item that is not "doing" (still todo) is rejected as validation, exit 4', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-not-doing');
  const result = run(cwd, ['return', 'pull-return-not-doing']);
  assert.equal(result.status, 4);
});

test('return on an item claimed by the runner (claimActor "runner", no headAtTake) is rejected as validation — return only completes a take', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-runner-claim');
  const dir = path.join(cwd, '.fgos');
  moveWork(dir, { id: 'pull-return-runner-claim', to: 'doing', expectedStatus: 'todo', actor: 'runner' });

  const result = run(cwd, ['return', 'pull-return-runner-claim']);
  assert.equal(result.status, 4);
  assert.equal(stateView(cwd).work['pull-return-runner-claim'].status, 'doing');
});

test('return with no id at all is rejected as validation, exit 4', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  const result = run(cwd, ['return']);
  assert.equal(result.status, 4);
});

test('return --timeout with a non-numeric or non-positive value is rejected as validation, exit 4', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-bad-timeout', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-bad-timeout']).status, 0);
  commitFile(cwd, 'proof.txt');

  const result = run(cwd, ['return', 'pull-return-bad-timeout', '--timeout', 'soon']);
  assert.equal(result.status, 4);
  assert.equal(stateView(cwd).work['pull-return-bad-timeout'].status, 'doing', 'a rejected --timeout never runs verify or moves the item');
});

// --- pr-lifecycle S1-gate: review/approve/reject (pr-lifecycle-2) ---------
//
// Cổng duyệt PR nội bộ (D1/D4): `review` is a pure read over whichever diff
// source classifySource resolves; `approve` merges (runner item) or
// re-verifies on main (pull/legacy item) and only then closes to `done`;
// `reject` is a pure FSM move that never touches git. `initGitCwdMain` pins
// the trunk branch name to "main" (the shared `initGitCwd` above leaves it
// at whatever the local git default happens to be) because merge.mjs's
// runner-source diff/merge is written against the literal trunk name "main"
// (per plan.md's locked Approach) — only the runner-source tests below need
// it; pull/legacy tests reuse the existing `initGitCwd`/`tmpCwd` helpers
// since their approve path never references a branch name at all.

function initGitCwdMain() {
  const cwd = tmpCwd();
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd });
  fs.writeFileSync(path.join(cwd, '.gitignore'), '.fgos/state.json\n');
  fs.writeFileSync(path.join(cwd, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt', '.gitignore'], { cwd });
  execFileSync('git', ['commit', '-q', '-m', 'seed'], { cwd });
  return cwd;
}

function gitAtCwd(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' });
}

// `.fgos/events.jsonl` is tracked-but-uncommitted the moment any fgos verb
// appends to it (same convention `commitFile` above already relies on for
// take/return) — approve's runner path refuses a dirty main tree, so every
// test that reaches a real merge must fold pending event-log changes into a
// real commit first, exactly like a human would commit their own state
// bookkeeping alongside code.
function commitPending(cwd, message) {
  execFileSync('git', ['add', '-A'], { cwd });
  execFileSync('git', ['commit', '-q', '-m', message], { cwd });
}

// Simulates what the real runner (loop.mjs/worktree.mjs) leaves behind for a
// runner-source proposed item: a live `fgw/<id>` branch carrying a real
// commit, with the item's own status independently moved to `proposed`
// through the normal doing -> proposed edge — these CLI tests never invoke
// the real runner, only the git/state shape it produces.
function makeRunnerProposedItem(cwd, id, extra = {}) {
  addOk(cwd, id, extra);
  run(cwd, ['move', id, '--to', 'doing']);
  commitPending(cwd, `state: claim ${id}`);

  gitAtCwd(cwd, ['checkout', '-b', `fgw/${id}`]);
  fs.writeFileSync(path.join(cwd, `${id}-produced.txt`), 'ok\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', `worker output for ${id}`]);
  gitAtCwd(cwd, ['checkout', 'main']);

  run(cwd, ['move', id, '--to', 'proposed']);
  commitPending(cwd, `state: propose ${id}`);
}

// Simulates what a real fan-out-parallel dispatch (D3, cell
// fan-out-parallel-9) leaves behind for a LEAF item under the per-root
// branch tree: a durable `fgw/<rootId>` integration branch (created early,
// ref only, per D17) and the leaf's own `fgw/<leafId>` branch forked from
// that root branch's TIP, carrying a real commit — with the leaf item's own
// status independently moved to `proposed` and `parent: rootId` set
// directly through store.mjs's addWork (the CLI's `add` verb has no
// --parent flag; only decompose.mjs writes it in production). The root
// item itself is added but never dispatched through the CLI — only its
// existence (for `resolveRoot` to resolve against) and its branch matter to
// these tests.
//
// `opts.rootDivergesFromMain`: commits a file on `fgw/<rootId>` BEFORE the
// leaf forks from it, so a test can prove a leaf's diff/merge target is
// really the root branch (and not main) by asserting the root-only content
// is absent/present as the trunk in play dictates.
function makeRunnerProposedLeafItem(cwd, rootId, leafId, extra = {}) {
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: rootId, title: `Title ${rootId}`, kind: 'task', status: 'todo', deps: [], risk: 'low', refs: [], verify: 'true' });
  // Commit the root's own work.add event onto MAIN before any branch
  // switching — `.fgos/events.jsonl` is git-tracked in this fixture (same
  // convention every take/return/approve test here already relies on), so
  // leaving it uncommitted-but-existing here would let a later `checkout`
  // + `git add -A` on a different branch sweep it up and lose it from
  // main's own log.
  commitPending(cwd, `state: add ${rootId}`);
  gitAtCwd(cwd, ['branch', `fgw/${rootId}`, 'main']);

  if (extra.rootDivergesFromMain) {
    gitAtCwd(cwd, ['checkout', `fgw/${rootId}`]);
    fs.writeFileSync(path.join(cwd, 'root-only.txt'), 'root\n');
    gitAtCwd(cwd, ['add', 'root-only.txt']);
    gitAtCwd(cwd, ['commit', '-q', '-m', 'root diverges from main']);
    gitAtCwd(cwd, ['checkout', 'main']);
  }

  addWork(dir, {
    id: leafId,
    title: extra.title ?? `Title ${leafId}`,
    kind: 'task',
    status: 'todo',
    deps: [],
    risk: 'low',
    refs: [],
    verify: extra.verify ?? 'npm test',
    parent: rootId,
  });
  run(cwd, ['move', leafId, '--to', 'doing']);
  commitPending(cwd, `state: claim ${leafId}`);

  gitAtCwd(cwd, ['checkout', '-b', `fgw/${leafId}`, `fgw/${rootId}`]);
  fs.writeFileSync(path.join(cwd, `${leafId}-produced.txt`), 'ok\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', `worker output for ${leafId}`]);
  gitAtCwd(cwd, ['checkout', 'main']);

  run(cwd, ['move', leafId, '--to', 'proposed']);
  commitPending(cwd, `state: propose ${leafId}`);
}

// --- `fgos evolve` (self-improve-loop P13 Slice 1, Gate A) -----------------
//
// Request-class per D1 (same contract as `ready`/`list`/`check`): a pure
// read over `listWork(dir)`, ranked by `src/evolve/candidates.mjs`. Two-shot
// per D11 — `evolve` lists, `evolve --pick <id>` reprints one candidate's
// friction record — never an interactive stdin loop, never a re-prompt on a
// bad id. Friction is seeded directly through store.mjs's addFriction (the
// same single write door the runner uses in production), same discipline as
// the friction-section tests for `check` above.

test('evolve with zero open friction returns an empty candidate list and exits 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'clean-item');
  const result = run(cwd, ['evolve']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout), []);
});

test('evolve on a directory with no log at all returns an empty candidate list, exit 0 (a read never initializes .fgos/)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['evolve']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout), []);
  assert.ok(!fs.existsSync(path.join(cwd, '.fgos')));
});

test('evolve with candidates returns the ranked list with every field id/disposition/errorClass/layer/detail/attempts/score', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'rank-item');
  const dir = path.join(cwd, '.fgos');
  addFriction(dir, { id: 'rank-item', disposition: 'blocked', errorClass: 'verify-miss', layer: 'verification', attempts: 2, detail: 'goal-check failed (exit 1)' });

  const result = run(cwd, ['evolve']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.length, 1);
  assert.equal(data[0].id, 'rank-item');
  assert.equal(data[0].score, 2);
  assert.equal(data[0].disposition, 'blocked');
  assert.equal(data[0].errorClass, 'verify-miss');
  assert.equal(data[0].layer, 'verification');
  assert.equal(data[0].attempts, 2);
  assert.equal(data[0].detail, 'goal-check failed (exit 1)');
});

test('evolve with a candidate missing disposition/errorClass/layer/attempts carries those fields as null/undefined, never the literal string "null"', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'sparse-item');
  const dir = path.join(cwd, '.fgos');
  addFriction(dir, { id: 'sparse-item' });

  const result = run(cwd, ['evolve']);
  assert.equal(result.status, 0);
  assert.doesNotMatch(result.stdout, /"disposition":"null"|"errorClass":"null"|"layer":"null"|"attempts":"null"/);
});

test('evolve --pick <valid-id> returns that candidate\'s full friction record, no state change', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'pick-item');
  const dir = path.join(cwd, '.fgos');
  addFriction(dir, { id: 'pick-item', disposition: 'blocked', errorClass: 'verify-miss', layer: 'verification', attempts: 1, detail: 'goal-check failed' });

  const result = run(cwd, ['evolve', '--pick', 'pick-item']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.count, 1);
  assert.equal(data.recent[0].id, 'pick-item');
  assert.equal(data.recent[0].disposition, 'blocked');
  assert.equal(data.recent[0].errorClass, 'verify-miss');
  assert.equal(data.recent[0].layer, 'verification');
});

test('evolve --pick <invalid-id> prints a clean error and exits non-zero, with no state change', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'exists-item');
  const dir = path.join(cwd, '.fgos');
  addFriction(dir, { id: 'exists-item', disposition: 'blocked', errorClass: 'verify-miss', layer: 'verification', attempts: 1, detail: 'x' });

  const logBefore = fs.readFileSync(logPath(cwd), 'utf8');
  const viewBefore = fs.readFileSync(viewPath(cwd), 'utf8');

  const result = run(cwd, ['evolve', '--pick', 'nonexistent-id']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /not an open candidate/);

  assert.equal(fs.readFileSync(logPath(cwd), 'utf8'), logBefore, 'events.jsonl must be untouched by an invalid --pick');
  assert.equal(fs.readFileSync(viewPath(cwd), 'utf8'), viewBefore, 'state.json must be untouched by an invalid --pick');
});

test('evolve --pick with a bare flag (no value) is refused as validation, not a re-prompt (D11)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'bare-pick-item');
  const result = run(cwd, ['evolve', '--pick']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /evolve --pick requires a non-empty candidate id/);
});

test('GOLDEN evolve is read-only: events.jsonl and state.json are byte-identical before/after both the list and --pick paths', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'ro-item');
  const dir = path.join(cwd, '.fgos');
  addFriction(dir, { id: 'ro-item', disposition: 'blocked', errorClass: 'verify-miss', layer: 'verification', attempts: 1, detail: 'goal-check failed' });

  const logBefore = fs.readFileSync(logPath(cwd), 'utf8');
  const viewBefore = fs.readFileSync(viewPath(cwd), 'utf8');

  const list = run(cwd, ['evolve']);
  assert.equal(list.status, 0);
  assert.equal(fs.readFileSync(logPath(cwd), 'utf8'), logBefore, 'events.jsonl must be untouched by evolve (list)');
  assert.equal(fs.readFileSync(viewPath(cwd), 'utf8'), viewBefore, 'state.json must be untouched by evolve (list)');

  const pick = run(cwd, ['evolve', '--pick', 'ro-item']);
  assert.equal(pick.status, 0);
  assert.equal(fs.readFileSync(logPath(cwd), 'utf8'), logBefore, 'events.jsonl must be untouched by evolve (--pick)');
  assert.equal(fs.readFileSync(viewPath(cwd), 'utf8'), viewBefore, 'state.json must be untouched by evolve (--pick)');
});

test('evolve never touches git (no branch/worktree operation) — succeeds on a directory that is not even a git repo', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'no-git-item');
  const dir = path.join(cwd, '.fgos');
  addFriction(dir, { id: 'no-git-item', disposition: 'blocked', errorClass: 'verify-miss', layer: 'verification', attempts: 1, detail: 'x' });
  assert.equal(fs.existsSync(path.join(cwd, '.git')), false);

  const result = run(cwd, ['evolve']);
  assert.equal(result.status, 0);
  const pickResult = run(cwd, ['evolve', '--pick', 'no-git-item']);
  assert.equal(pickResult.status, 0);
});

// --- `submit` extraction regression (self-improve-loop D15): the verb's
// body was pulled out into a shared submitWork(dir, text, opts) so `evolve
// --submit` below can reuse it without duplicating the work-object
// construction. These combined-flag calls were never exercised together
// pre-extraction (--async/--domain were each tested separately above) —
// proving they still combine correctly is the regression coverage D15
// requires.

test('submit stays byte-identical after the submitWork extraction: a plain call and a call combining --async + --domain', () => {
  const cwd = tmpCwd();

  const plain = run(cwd, ['submit', 'Investigate the sluggish overview page']);
  assert.equal(plain.status, 0);
  const plainItem = JSON.parse(plain.stdout).data;
  assert.equal(plainItem.status, 'todo');
  assert.equal(plainItem.mode, 'sync');
  assert.equal(plainItem.domain, undefined);
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[plainItem.id].stage, 'clarify');

  const flagged = run(cwd, ['submit', 'Try the synthetic domain', '--async', '--domain', 'synthetic']);
  assert.equal(flagged.status, 0);
  const flaggedItem = JSON.parse(flagged.stdout).data;
  assert.equal(flaggedItem.mode, 'async');
  assert.equal(flaggedItem.domain, 'synthetic');
  assert.equal(flaggedItem.stage, 'assembling');

  const unattended = run(cwd, ['submit', 'Draft the onboarding walkthrough', '--unattended']);
  assert.equal(unattended.status, 0);
  assert.equal(JSON.parse(unattended.stdout).data.mode, 'async');
});

// --- `fgos evolve --submit <id>` (self-improve-loop P13 Slice 3, D15) ------
//
// The only mutating action on the whole evolve/Gate A surface: bridges a
// ranked friction candidate into a real work item through the same
// submitWork door `submit` uses. `evolve` (no flag) and `evolve --pick` stay
// exactly as shipped in Slice 1 (asserted below too, not just by the golden
// test above).

test("evolve --submit <id> with a matching candidate creates exactly one new work item via submitWork, described from the candidate's fields", () => {
  const cwd = tmpCwd();
  addOk(cwd, 'submit-item');
  const dir = path.join(cwd, '.fgos');
  addFriction(dir, { id: 'submit-item', disposition: 'blocked', errorClass: 'verify-miss', layer: 'verification', attempts: 2, detail: 'goal-check failed (exit 1)' });

  const before = eventLines(cwd).length;
  const result = run(cwd, ['evolve', '--submit', 'submit-item']);
  assert.equal(result.status, 0);
  const envelope = JSON.parse(result.stdout);
  assert.equal(envelope.contract, 'fgos.v1');
  const item = envelope.data;
  assert.equal(item.status, 'todo');
  assert.equal(item.stage, 'clarify');
  assert.match(item.description, /Self-improve candidate submit-item/);
  assert.match(item.description, /blocked/);
  assert.match(item.description, /verify-miss/);
  assert.match(item.description, /layer verification/);
  assert.match(item.description, /2 attempt\(s\)/);
  assert.match(item.description, /goal-check failed \(exit 1\)/);

  assert.equal(eventLines(cwd).length, before + 1, 'evolve --submit appends exactly one new event');
  const view = envelopeData(run(cwd, ['list']).stdout);
  assert.ok(view.work[item.id], 'the new work item persisted');
  assert.equal(view.work['submit-item'].status, 'todo', 'the candidate\'s own item is untouched');
});

test('evolve --submit <id> with no matching candidate creates no work item, prints a clean error, exits non-zero', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'exists-item-2');
  const dir = path.join(cwd, '.fgos');
  addFriction(dir, { id: 'exists-item-2', disposition: 'blocked', errorClass: 'verify-miss', layer: 'verification', attempts: 1, detail: 'x' });

  const before = eventLines(cwd).length;
  const result = run(cwd, ['evolve', '--submit', 'nonexistent-id']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /not an open candidate/);
  assert.equal(eventLines(cwd).length, before, 'no event appended on an invalid --submit id');
});

test('evolve --submit with a bare flag (no value) is refused as validation, not a re-prompt', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'bare-submit-item');
  const result = run(cwd, ['evolve', '--submit']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /evolve --submit requires a non-empty candidate id/);
});

test('evolve --submit composes its description gracefully around missing candidate fields, never printing the literal "undefined"', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'sparse-item');
  const dir = path.join(cwd, '.fgos');
  addFriction(dir, { id: 'sparse-item', disposition: 'blocked', attempts: 1 });

  const result = run(cwd, ['evolve', '--submit', 'sparse-item']);
  assert.equal(result.status, 0);
  const description = JSON.parse(result.stdout).data.description;
  assert.doesNotMatch(description, /undefined/);
  assert.match(description, /Self-improve candidate sparse-item/);
  assert.match(description, /blocked/);
  assert.match(description, /1 attempt\(s\)/);
});

test('evolve (no flag) and evolve --pick remain unaffected by the new --submit path: same output, no event appended', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'unaffected-item');
  const dir = path.join(cwd, '.fgos');
  addFriction(dir, { id: 'unaffected-item', disposition: 'blocked', errorClass: 'verify-miss', layer: 'verification', attempts: 1, detail: 'goal-check failed' });

  const before = eventLines(cwd).length;
  const list = run(cwd, ['evolve']);
  assert.equal(list.status, 0);
  const listData = envelopeData(list.stdout);
  assert.equal(listData[0].id, 'unaffected-item');
  assert.equal(listData[0].score, 2);
  assert.equal(listData[0].disposition, 'blocked');

  const pick = run(cwd, ['evolve', '--pick', 'unaffected-item']);
  assert.equal(pick.status, 0);
  assert.equal(envelopeData(pick.stdout).count, 1);

  assert.equal(eventLines(cwd).length, before, 'evolve and evolve --pick still append no events');
});

test('review on a nonexistent id is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['review', 'ghost']);
  assert.equal(result.status, 4);
});

test('review on a non-proposed item is rejected as precondition, exit 2', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'not-proposed-review');
  const result = run(cwd, ['review', 'not-proposed-review']);
  assert.equal(result.status, 2);
});

test('review of a runner-source proposed item prints the branch diff and no warnings, exit 0', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'review-runner-item');

  const result = run(cwd, ['review', 'review-runner-item']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.mode, 'local');
  assert.equal(data.source, 'runner');
  assert.match(data.diff, /review-runner-item-produced\.txt/);
  assert.deepEqual(data.warnings, []);
});

test('review of a pull-door proposed item prints the headAtTake..headAtReturn diff, exit 0', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'review-pull-item', { verify: 'test -f proof.txt' });
  run(cwd, ['take', '--id', 'review-pull-item']);
  commitFile(cwd, 'proof.txt');
  run(cwd, ['return', 'review-pull-item']);

  const result = run(cwd, ['review', 'review-pull-item']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.source, 'pull');
  assert.match(data.diff, /proof\.txt/);
  assert.deepEqual(data.warnings, []);
});

test('review of a legacy proposed item (no branch, no headAtTake/headAtReturn) degrades honestly — a warning, no throw, exit 0 (must_have: legacy degrade)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'review-legacy-item');
  run(cwd, ['move', 'review-legacy-item', '--to', 'doing']);
  run(cwd, ['move', 'review-legacy-item', '--to', 'proposed']);

  const result = run(cwd, ['review', 'review-legacy-item']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.source, 'legacy');
  assert.match(data.warnings.join('\n'), /no live diff source/);
});

test('review of a leaf proposed item diffs against its resolved root branch (fgw/<root>), not main (D3)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedLeafItem(cwd, 'review-leaf-root', 'review-leaf-child', { rootDivergesFromMain: true });

  const result = run(cwd, ['review', 'review-leaf-child']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.source, 'runner');
  assert.match(data.diff, /review-leaf-child-produced\.txt/);
  assert.doesNotMatch(data.diff, /root-only\.txt/, 'diff against fgw/<root> must not include the root branch\'s own divergence from main');
});

test('review of a root proposed item is unchanged — still diffs against main (regression, D3)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'review-root-regression-item');

  const result = run(cwd, ['review', 'review-root-regression-item']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.source, 'runner');
  assert.match(data.diff, /review-root-regression-item-produced\.txt/);
});

test('approve on a nonexistent id is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['approve', 'ghost']);
  assert.equal(result.status, 4);
});

test('approve on a non-proposed item is rejected as precondition, exit 2', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'not-proposed-approve');
  const result = run(cwd, ['approve', 'not-proposed-approve']);
  assert.equal(result.status, 2);
});

test('approve of a runner item (happy path): merges fgw/<id> into main, verifies, proposed -> done with actor human, and cleans up the branch', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'approve-runner-item', { verify: 'test -f approve-runner-item-produced.txt' });

  const result = run(cwd, ['approve', 'approve-runner-item']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(envelopeData(result.stdout).to, 'done');

  const view = stateView(cwd);
  assert.equal(view.work['approve-runner-item'].status, 'done');
  assert.equal(view.settlements['approve-runner-item'][0].kind, 'close');
  assert.equal(view.settlements['approve-runner-item'][0].actor, 'human');
  assert.ok(fs.existsSync(path.join(cwd, 'approve-runner-item-produced.txt')), 'the merged file must be present on main');

  const branches = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/fgw/']);
  assert.doesNotMatch(branches, /fgw\/approve-runner-item/, 'the fully-merged branch is cleaned up');
});

test('approve of a runner item succeeds when ONLY .fgos/ (the live event log) is dirty on main — no more manual events.jsonl commit before every approve', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'approve-fgos-only-dirty', { verify: 'test -f approve-fgos-only-dirty-produced.txt' });

  // Dirty ONLY `.fgos/events.jsonl` on main after the item is proposed —
  // an unrelated `add` appends an event and never touches any other file —
  // deliberately left uncommitted (unlike makeRunnerProposedItem's own
  // commitPending calls, which fold everything together).
  assert.equal(addOk(cwd, 'approve-fgos-only-dirty-noise').status, 0);

  const statusLines = execFileSync('git', ['status', '--porcelain'], { cwd, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
  assert.equal(statusLines.length, 1, 'sanity: .fgos/events.jsonl must be the ONLY dirty path at this point');
  assert.match(statusLines[0], /\.fgos\/events\.jsonl$/);

  const result = run(cwd, ['approve', 'approve-fgos-only-dirty']);
  assert.equal(result.status, 0, `approve should succeed with only .fgos/ dirty: ${result.stderr}`);
  assert.equal(stateView(cwd).work['approve-fgos-only-dirty'].status, 'done');
});

test('approve of a runner item still refuses when a non-.fgos file on main is dirty, as validation, exit 4, item stays proposed', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'approve-real-dirty', { verify: 'test -f approve-real-dirty-produced.txt' });

  fs.writeFileSync(path.join(cwd, 'scratch.txt'), 'unrelated uncommitted work\n'); // never git add/commit

  const result = run(cwd, ['approve', 'approve-real-dirty']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /not clean/);
  assert.equal(stateView(cwd).work['approve-real-dirty'].status, 'proposed');
});

test('approve of a leaf item with a clean merge lands the work on fgw/<root> (not main) via an ephemeral worktree, leaf -> done, fgw/<leaf> is actually deleted, fgw/<root> survives (D3/D4/D17)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedLeafItem(cwd, 'approve-leaf-root', 'approve-leaf-child', { verify: 'test -f approve-leaf-child-produced.txt' });

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['approve', 'approve-leaf-child']);
  assert.equal(result.status, 0, result.stderr);
  const approveData = envelopeData(result.stdout);
  assert.equal(approveData.branch, 'fgw/approve-leaf-child');
  assert.equal(approveData.target, 'fgw/approve-leaf-root');
  assert.equal(approveData.to, 'done');

  // main must never be touched by a leaf approve.
  assert.equal(gitHead(cwd), headBefore, 'main HEAD must be unchanged by a leaf approve');
  assert.equal(
    fs.existsSync(path.join(cwd, 'approve-leaf-child-produced.txt')),
    false,
    'the leaf\'s produced file must not land on the human\'s own main checkout',
  );

  const view = stateView(cwd);
  assert.equal(view.work['approve-leaf-child'].status, 'done');

  // fgw/<leaf> must be ACTUALLY deleted (git branch list), not just the
  // ephemeral worktree directory gone — the exact gap validating found.
  const branches = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/fgw/']);
  assert.doesNotMatch(branches, /fgw\/approve-leaf-child\b/, 'the leaf\'s own branch must be deleted after merging into its root');
  assert.match(branches, /fgw\/approve-leaf-root\b/, 'the root\'s own integration branch must survive');

  // the merged content must actually be present on fgw/<root>'s tip.
  const rootTreeFile = gitAtCwd(cwd, ['show', 'fgw/approve-leaf-root:approve-leaf-child-produced.txt']);
  assert.match(rootTreeFile, /ok/);
});

test('approve of a runner item that conflicts: aborts the merge, proposed -> blocked (reason merge-conflict), main left byte-for-byte unchanged (must_have: main never holds a broken merge commit)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'base\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'seed shared.txt']);

  addOk(cwd, 'approve-conflict-item');
  run(cwd, ['move', 'approve-conflict-item', '--to', 'doing']);
  commitPending(cwd, 'state: claim approve-conflict-item');

  gitAtCwd(cwd, ['checkout', '-b', 'fgw/approve-conflict-item']);
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'branch-change\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'branch changes shared.txt']);
  gitAtCwd(cwd, ['checkout', 'main']);
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'main-change\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'main changes shared.txt']);

  run(cwd, ['move', 'approve-conflict-item', '--to', 'proposed']);
  commitPending(cwd, 'state: propose approve-conflict-item');

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['approve', 'approve-conflict-item']);
  assert.equal(result.status, 0, result.stderr);
  const conflictData = envelopeData(result.stdout);
  assert.equal(conflictData.to, 'blocked');
  assert.equal(conflictData.reason, 'merge-conflict');

  assert.equal(gitHead(cwd), headBefore, 'HEAD must be unchanged after an aborted merge');
  assert.equal(fs.readFileSync(path.join(cwd, 'shared.txt'), 'utf8'), 'main-change\n', 'main content must be unchanged');

  const view = stateView(cwd);
  assert.equal(view.work['approve-conflict-item'].status, 'blocked');
  assert.equal(view.frictions['approve-conflict-item'][0].errorClass, 'merge-conflict');
});

test('approve of a runner item whose staged merge fails its own verify: aborts, proposed -> blocked (reason verify-fail-post-merge), main left unchanged', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'approve-verify-fail-item', { verify: 'test -f file-never-produced.txt' });

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['approve', 'approve-verify-fail-item']);
  assert.equal(result.status, 0, result.stderr);
  const verifyFailData = envelopeData(result.stdout);
  assert.equal(verifyFailData.to, 'blocked');
  assert.equal(verifyFailData.reason, 'verify-fail-post-merge');

  assert.equal(gitHead(cwd), headBefore, 'HEAD must be unchanged after an aborted merge');
  assert.equal(fs.existsSync(path.join(cwd, 'approve-verify-fail-item-produced.txt')), false, 'a staged-then-aborted merge must not leave its file behind');

  const view = stateView(cwd);
  assert.equal(view.work['approve-verify-fail-item'].status, 'blocked');
  assert.equal(view.frictions['approve-verify-fail-item'][0].errorClass, 'verify-miss');
});

test('approve of a root item that HAD children, whose merge into main conflicts, parks with the distinguishing reason integration-drift and a main@<sha> friction detail (D8)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'base\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'seed shared.txt']);

  const dir = path.join(cwd, '.fgos');
  addOk(cwd, 'drift-root-item');
  // A child (any status) is enough to mark this root as "actually had
  // children" (D8's check reads existence of `parent === id`, per
  // replay.mjs's fold never clearing `parent` even once the child is done).
  addWork(dir, {
    id: 'drift-root-child',
    title: 'drift child',
    kind: 'task',
    status: 'todo',
    deps: [],
    risk: 'low',
    refs: [],
    verify: 'true',
    parent: 'drift-root-item',
  });

  run(cwd, ['move', 'drift-root-item', '--to', 'doing']);
  commitPending(cwd, 'state: claim drift-root-item');

  gitAtCwd(cwd, ['checkout', '-b', 'fgw/drift-root-item']);
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'branch-change\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'branch changes shared.txt']);
  gitAtCwd(cwd, ['checkout', 'main']);
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'main-change\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'main changes shared.txt']);

  run(cwd, ['move', 'drift-root-item', '--to', 'proposed']);
  commitPending(cwd, 'state: propose drift-root-item');

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['approve', 'drift-root-item']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(envelopeData(result.stdout).reason, 'integration-drift');

  assert.equal(gitHead(cwd), headBefore, 'HEAD must be unchanged after an aborted merge');
  assert.equal(fs.readFileSync(path.join(cwd, 'shared.txt'), 'utf8'), 'main-change\n', 'main content must be unchanged');

  const view = stateView(cwd);
  assert.equal(view.work['drift-root-item'].status, 'blocked');
  assert.equal(view.frictions['drift-root-item'][0].errorClass, 'merge-conflict');
  assert.match(view.frictions['drift-root-item'][0].detail, new RegExp(`main@${headBefore}`), 'friction detail must record the main@<sha> ref');
});

test('approve of a pull-door item (no merge, code already on main): re-verifies and closes proposed -> done with actor human', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'approve-pull-item', { verify: 'test -f proof.txt' });
  run(cwd, ['take', '--id', 'approve-pull-item']);
  commitFile(cwd, 'proof.txt');
  run(cwd, ['return', 'approve-pull-item']);

  const result = run(cwd, ['approve', 'approve-pull-item']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(envelopeData(result.stdout).to, 'done');

  const view = stateView(cwd);
  assert.equal(view.work['approve-pull-item'].status, 'done');
  assert.equal(view.settlements['approve-pull-item'][0].actor, 'human');
});

test('approve of a legacy item with a failing verify: blocked (reason verify-fail), not merge-related, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'approve-legacy-fail-item', { verify: 'false' });
  run(cwd, ['move', 'approve-legacy-fail-item', '--to', 'doing']);
  run(cwd, ['move', 'approve-legacy-fail-item', '--to', 'proposed']);

  const result = run(cwd, ['approve', 'approve-legacy-fail-item']);
  assert.equal(result.status, 0, result.stderr);
  const legacyFailData = envelopeData(result.stdout);
  assert.equal(legacyFailData.to, 'blocked');
  assert.equal(legacyFailData.reason, 'verify-fail');

  const view = stateView(cwd);
  assert.equal(view.work['approve-legacy-fail-item'].status, 'blocked');
});

test('approve of a legacy item with a passing verify closes it to done — legacy degrade never blocks approve/reject from working (must_have)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'approve-legacy-ok-item', { verify: 'true' });
  run(cwd, ['move', 'approve-legacy-ok-item', '--to', 'doing']);
  run(cwd, ['move', 'approve-legacy-ok-item', '--to', 'proposed']);

  const result = run(cwd, ['approve', 'approve-legacy-ok-item']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(stateView(cwd).work['approve-legacy-ok-item'].status, 'done');
});

test('approve twice: the second approve on an already-done item is rejected as precondition, exit 2 (done is terminal)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'approve-twice-item', { verify: 'true' });
  run(cwd, ['move', 'approve-twice-item', '--to', 'doing']);
  run(cwd, ['move', 'approve-twice-item', '--to', 'proposed']);
  assert.equal(run(cwd, ['approve', 'approve-twice-item']).status, 0);

  const result = run(cwd, ['approve', 'approve-twice-item']);
  assert.equal(result.status, 2);
});

// --- approve Iron Law gate (self-improve-loop P13 Slice 3, D16/D17) --------
//
// A runner-sourced diff that touches a self-modifying-capable module
// (iron-law.mjs's D10/D14 list) must not merge without the approver
// consciously passing --acknowledge-iron-law. The check is generic to every
// runner-sourced proposal (D16), scoped inside the runner-source block before
// the leaf/root split, and refuses BEFORE any git mutation (D17). An ordinary
// diff (no module/keyword match) is entirely unaffected — the backward-
// compatibility guarantee proven by every pr-gate scenario above.

// Like makeRunnerProposedItem, but the branch's real commit lands its file at
// `relPath` (relative to cwd) — used to make the branch diff touch (or not
// touch) a self-modifying-capable module path the Iron Law classifies.
function makeRunnerProposedItemTouching(cwd, id, relPath, extra = {}) {
  addOk(cwd, id, extra);
  run(cwd, ['move', id, '--to', 'doing']);
  commitPending(cwd, `state: claim ${id}`);

  gitAtCwd(cwd, ['checkout', '-b', `fgw/${id}`]);
  const abs = path.join(cwd, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, 'export const produced = true;\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', `worker output for ${id}`]);
  gitAtCwd(cwd, ['checkout', 'main']);

  run(cwd, ['move', id, '--to', 'proposed']);
  commitPending(cwd, `state: propose ${id}`);
}

test('approve of a runner item whose diff touches a self-modifying-capable module (src/runner/**) REFUSES without --acknowledge-iron-law: validation exit 4, item stays proposed, no merge, message names the tripped module', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItemTouching(cwd, 'iron-refuse-item', 'src/runner/probe.mjs', {
    verify: 'test -f src/runner/probe.mjs',
  });

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['approve', 'iron-refuse-item']);
  assert.equal(result.status, 4, `expected a validation refusal: ${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /Iron Law/);
  assert.match(result.stderr, /src\/runner\/probe\.mjs/, 'the refusal must name the exact module that tripped required:true');
  assert.match(result.stderr, /--acknowledge-iron-law/);

  const view = stateView(cwd);
  assert.equal(view.work['iron-refuse-item'].status, 'proposed', 'a refused approve leaves the item proposed');
  assert.equal(gitHead(cwd), headBefore, 'a refused approve attempts no merge — HEAD is unchanged');
  const survivingBranches = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/']);
  assert.match(survivingBranches, /fgw\/iron-refuse-item/, 'the branch survives an Iron Law refusal — nothing was merged or cleaned up');
});

test('approve of the same self-modifying diff PROCEEDS with --acknowledge-iron-law: merges, verifies, proposed -> done, branch cleaned up', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItemTouching(cwd, 'iron-ack-item', 'src/runner/probe.mjs', {
    verify: 'test -f src/runner/probe.mjs',
  });

  const result = run(cwd, ['approve', 'iron-ack-item', '--acknowledge-iron-law']);
  assert.equal(result.status, 0, `approve with acknowledgment must succeed: ${result.stderr}`);
  assert.equal(envelopeData(result.stdout).to, 'done');

  const view = stateView(cwd);
  assert.equal(view.work['iron-ack-item'].status, 'done');
  assert.equal(view.settlements['iron-ack-item'][0].actor, 'human');
  assert.ok(fs.existsSync(path.join(cwd, 'src/runner/probe.mjs')), 'the merged module file is present on main');
  const branches = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/']);
  assert.doesNotMatch(branches, /fgw\/iron-ack-item/, 'the fully-merged branch is cleaned up');
});

test('approve of an ordinary runner item (diff touches no self-modifying module) is UNAFFECTED — proceeds to done with no --acknowledge-iron-law flag (backward compatibility, D17)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItemTouching(cwd, 'iron-plain-item', 'docs/notes.txt', {
    verify: 'test -f docs/notes.txt',
  });

  const result = run(cwd, ['approve', 'iron-plain-item']);
  assert.equal(result.status, 0, `an ordinary diff must approve without any acknowledgment: ${result.stderr}`);
  assert.equal(envelopeData(result.stdout).to, 'done');
  assert.doesNotMatch(result.stdout, /Iron Law/);
  assert.equal(stateView(cwd).work['iron-plain-item'].status, 'done');
});

test('reject on a nonexistent id is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['reject', 'ghost', '--reason', 'nope']);
  assert.equal(result.status, 4);
});

test('reject without --reason is rejected as validation, exit 4, item stays proposed', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'reject-no-reason-item');
  run(cwd, ['move', 'reject-no-reason-item', '--to', 'doing']);
  run(cwd, ['move', 'reject-no-reason-item', '--to', 'proposed']);

  const result = run(cwd, ['reject', 'reject-no-reason-item']);
  assert.equal(result.status, 4);
  assert.equal(stateView(cwd).work['reject-no-reason-item'].status, 'proposed');
});

test('reject on a non-proposed item is rejected as precondition, exit 2', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'reject-not-proposed-item');
  const result = run(cwd, ['reject', 'reject-not-proposed-item', '--reason', 'nope']);
  assert.equal(result.status, 2);
});

test('reject moves proposed -> todo with the reason recorded, actor human, and runs no git command at all — never a revert (D4)', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'reject-pull-item', { verify: 'test -f proof.txt' });
  run(cwd, ['take', '--id', 'reject-pull-item']);
  commitFile(cwd, 'proof.txt');
  run(cwd, ['return', 'reject-pull-item']);

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['reject', 'reject-pull-item', '--reason', 'needs more test coverage']);
  assert.equal(result.status, 0, result.stderr);
  const rejectData = envelopeData(result.stdout);
  assert.equal(rejectData.from, 'proposed');
  assert.equal(rejectData.to, 'todo');
  assert.equal(rejectData.reason, 'needs more test coverage');

  assert.equal(gitHead(cwd), headBefore, 'reject must never touch git — HEAD unchanged');
  assert.ok(fs.existsSync(path.join(cwd, 'proof.txt')), 'reject never reverts the code already on main (D4)');

  const view = stateView(cwd);
  assert.equal(view.work['reject-pull-item'].status, 'todo');

  const lines = eventLines(cwd);
  const lastEvent = JSON.parse(lines[lines.length - 1]);
  assert.equal(lastEvent.payload.reason, 'needs more test coverage');
  assert.equal(lastEvent.payload.actor, 'human');
});

test('the CLI usage message for an unknown verb lists review/approve/reject in the surface', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['bogus-verb']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /review\|approve\|reject/);
});

// --- `review`/`approve` --github (github-adapter D1/D3/D5) -------------------
//
// Every "gh" invoked here is a short-lived fake node script (shebang + chmod
// 0o755) injected into the spawned fgos.mjs subprocess via FGOS_GH_COMMAND —
// a JS-level opts object cannot cross the spawnSync process boundary that the
// `run()` helper puts between the test and the CLI, so the environment
// variable is the only viable injection channel. No real `gh` binary is ever
// invoked and no network call is ever made.

function writeFakeGh(dir, name, body) {
  const scriptPath = path.join(dir, name);
  fs.writeFileSync(scriptPath, `#!/usr/bin/env node\n${body}\n`);
  fs.chmodSync(scriptPath, 0o755);
  return scriptPath;
}

// Logs each invocation's argv to `logPath`, then for `pr create` prints the
// real observed gh URL shape (S1 ANSWER1) and exits 0.
function writeCreateFake(dir, logPath, prNumber) {
  return writeFakeGh(dir, 'gh-create.cjs',
    `const fs = require('fs');
fs.appendFileSync(${JSON.stringify(logPath)}, process.argv.slice(2).join(' ') + '\\n');
process.stdout.write('https://github.com/vantt/forgent/pull/${prNumber}\\n');
process.exit(0);`);
}

// `pr view` prints a settled MERGEABLE view (no poll needed); `pr merge`
// exits 0 — a clean two-step merge.
function writeMergeSuccessFake(dir) {
  return writeFakeGh(dir, 'gh-merge-ok.cjs',
    `const args = process.argv.slice(2);
if (args[1] === 'view') {
  process.stdout.write(JSON.stringify({ state: 'OPEN', mergeable: 'MERGEABLE', mergeStateStatus: 'CLEAN', mergedAt: null, closed: false, closedAt: null }));
  process.exit(0);
}
process.exit(0);`);
}

// Exits 1 with S1's real auth-failure stderr on ANY call.
function writeAuthFailFake(dir) {
  return writeFakeGh(dir, 'gh-auth-fail.cjs',
    `process.stderr.write('HTTP 401: Bad credentials (https://api.github.com/graphql)\\n');
process.exit(1);`);
}

// Writes a marker file on ANY invocation — a probe used to prove the gh path
// was NEVER reached (assert the marker is absent) when a gate rejects first.
function writeMarkerFake(dir, markerPath) {
  return writeFakeGh(dir, 'gh-marker.cjs',
    `const fs = require('fs');
fs.writeFileSync(${JSON.stringify(markerPath)}, 'called');
process.exit(0);`);
}

// A `pr view` fake for the read-only status check: logs each invocation's argv
// to `logPath` (so a test can count invocations and prove pollTimeoutMs:0
// collapses the poll loop to a single read even when `mergeable` is "UNKNOWN"),
// then prints the given PR-status fields as JSON. `review --github --pr` only
// ever calls `gh pr view`, so the JSON is emitted unconditionally.
function writeViewFake(dir, name, logPath, fields) {
  return writeFakeGh(dir, name,
    `const fs = require('fs');
fs.appendFileSync(${JSON.stringify(logPath)}, process.argv.slice(2).join(' ') + '\\n');
process.stdout.write(${JSON.stringify(JSON.stringify(fields))});
process.exit(0);`);
}

// Adds a plain filesystem bare repo as `origin` on the main checkout — no
// network, no real GitHub. `git push` against it is a normal fast local op,
// so `review --github`'s push step works against a real remote.
function addBareOrigin(cwd) {
  const bare = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-cli-origin-'));
  execFileSync('git', ['init', '-q', '--bare', bare]);
  execFileSync('git', ['remote', 'add', 'origin', bare], { cwd });
  return bare;
}

// A legacy proposed item (no fgw/<id> branch, no headAtTake/headAtReturn) —
// classifySource resolves it to 'legacy', the non-runner case the --github
// source gate must reject.
function makeLegacyProposedItem(cwd, id) {
  addOk(cwd, id);
  run(cwd, ['move', id, '--to', 'doing']);
  run(cwd, ['move', id, '--to', 'proposed']);
}

test('review --github on a legacy (non-runner) item is a validation error, no state change, and no gh call is attempted', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeLegacyProposedItem(cwd, 'gh-review-legacy');
  const marker = path.join(cwd, 'gh-was-called');
  const fake = writeMarkerFake(cwd, marker);

  const result = run(cwd, ['review', 'gh-review-legacy', '--github'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 4, `${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /runner-sourced item/);
  assert.equal(stateView(cwd).work['gh-review-legacy'].status, 'proposed');
  assert.ok(!fs.existsSync(marker), 'the source gate must reject before any gh CLI call');
});

test('approve --github on a legacy (non-runner) item is a validation error, no state change, and no gh call is attempted', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeLegacyProposedItem(cwd, 'gh-approve-legacy');
  const marker = path.join(cwd, 'gh-was-called');
  const fake = writeMarkerFake(cwd, marker);

  // --pr present too — the source gate must still win over the --pr check.
  const result = run(cwd, ['approve', 'gh-approve-legacy', '--github', '--pr', '7'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 4, `${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /runner-sourced item/);
  assert.equal(stateView(cwd).work['gh-approve-legacy'].status, 'proposed');
  assert.ok(!fs.existsSync(marker), 'the source gate must reject before any gh CLI call');
});

test('review --github on a runner item pushes the branch and opens a PR via a real subprocess-injected fake gh, reports the PR number, and never mutates FSM state', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-review-ok');
  addBareOrigin(cwd);
  const ghLog = path.join(cwd, 'gh-invocations.log');
  const fake = writeCreateFake(cwd, ghLog, 314);

  const result = run(cwd, ['review', 'gh-review-ok', '--github'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const ghData = envelopeData(result.stdout);
  assert.equal(ghData.outcome, 'created');
  assert.equal(ghData.prNumber, 314);
  assert.equal(ghData.head, 'fgw/gh-review-ok');
  assert.equal(ghData.base, 'main');

  // Crossed the real process boundary: the fake logged its argv.
  assert.match(fs.readFileSync(ghLog, 'utf8'), /pr create .*-H fgw\/gh-review-ok -B main/);
  // The branch really got pushed to origin.
  assert.match(execFileSync('git', ['ls-remote', '--heads', 'origin', 'fgw/gh-review-ok'], { cwd, encoding: 'utf8' }), /fgw\/gh-review-ok/);
  // review stays read-only on FSM state.
  assert.equal(stateView(cwd).work['gh-review-ok'].status, 'proposed');
});

test('review --github reports a gh failure as plain output with no state mutation (read-only contract holds on the blocked path)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-review-blocked');
  addBareOrigin(cwd);
  const fake = writeAuthFailFake(cwd);

  const result = run(cwd, ['review', 'gh-review-blocked', '--github'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const ghData = envelopeData(result.stdout);
  assert.equal(ghData.outcome, 'failed');
  assert.equal(ghData.reason, 'auth-failure');
  assert.equal(stateView(cwd).work['gh-review-blocked'].status, 'proposed', 'review never transitions state, even on a gh failure');
  assert.equal(stateView(cwd).frictions?.['gh-review-blocked'], undefined, 'review never records friction');
});

test('approve --github without --pr is a validation error, item stays proposed, and mergeGitHubPR is never called', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-approve-nopr');
  const marker = path.join(cwd, 'gh-was-called');
  const fake = writeMarkerFake(cwd, marker);

  const result = run(cwd, ['approve', 'gh-approve-nopr', '--github'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 4, `${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /requires --pr/);
  assert.equal(stateView(cwd).work['gh-approve-nopr'].status, 'proposed');
  assert.ok(!fs.existsSync(marker), 'no gh call is made when --pr is missing');
});

test('approve --github with a dirty main tree is NOT blocked by the local dirty-tree gate and proceeds to the GitHub merge', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-approve-dirty');
  // An unrelated dirty file on main — a LOCAL approve would refuse this, but
  // a GitHub-side merge never touches the local tree, so it must not gate.
  fs.writeFileSync(path.join(cwd, 'unrelated-dirt.txt'), 'uncommitted\n');
  const fake = writeMergeSuccessFake(cwd);

  const result = run(cwd, ['approve', 'gh-approve-dirty', '--github', '--pr', '5'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  assert.doesNotMatch(result.stdout, /not clean/);
  assert.equal(envelopeData(result.stdout).to, 'done');
  assert.equal(stateView(cwd).work['gh-approve-dirty'].status, 'done');
});

test('approve --github --pr on a fake gh merge success transitions the item proposed -> done with actor human', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-approve-merged');
  const fake = writeMergeSuccessFake(cwd);

  const result = run(cwd, ['approve', 'gh-approve-merged', '--github', '--pr', '42'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const mergedData = envelopeData(result.stdout);
  assert.equal(mergedData.prNumber, '42');
  assert.equal(mergedData.to, 'done');

  const view = stateView(cwd);
  assert.equal(view.work['gh-approve-merged'].status, 'done');
  assert.equal(view.settlements['gh-approve-merged'][0].actor, 'human');
});

test('approve --github --pr on a fake gh merge failure transitions proposed -> blocked and records friction with the classified reason, layer, and gh detail', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-approve-blocked');
  const fake = writeAuthFailFake(cwd);

  const result = run(cwd, ['approve', 'gh-approve-blocked', '--github', '--pr', '99'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const blockedData = envelopeData(result.stdout);
  assert.equal(blockedData.to, 'blocked');
  assert.equal(blockedData.reason, 'auth-failure');

  const view = stateView(cwd);
  assert.equal(view.work['gh-approve-blocked'].status, 'blocked');
  const friction = view.frictions['gh-approve-blocked'][0];
  assert.equal(friction.errorClass, 'auth-failure');
  assert.equal(friction.layer, 'environment');
  assert.match(friction.detail, /Bad credentials/);
});

// --- `review --github --pr <n>` read-only status check (github-adapter D6/D4) ---
//
// Detection-only: reports an existing PR's live GitHub status and never mutates
// FSM state or friction under any outcome (a GitHub-side close is not itself an
// approval or reject action — only local `fgos reject` moves the item, D6).
// Classification branches solely on `closed` + `mergedAt`, never the `state`
// string (S1's spike never observed state's closed/merged values). Every gh is
// the same subprocess-injected fake; no real gh binary, no network call.

test('review --github --pr on a legacy (non-runner) item is the same runner-sourced validation error as without --pr, and no gh call is attempted', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeLegacyProposedItem(cwd, 'gh-status-legacy');
  const marker = path.join(cwd, 'gh-was-called');
  const fake = writeMarkerFake(cwd, marker);

  const result = run(cwd, ['review', 'gh-status-legacy', '--github', '--pr', '9'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 4, `${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /runner-sourced item/);
  assert.equal(stateView(cwd).work['gh-status-legacy'].status, 'proposed');
  assert.ok(!fs.existsSync(marker), 'the source gate must reject before any gh CLI call, --pr present or not');
});

test('review --github --pr on a still-open PR (closed:false) reports it is open and mutates neither FSM state nor friction', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-status-open');
  const ghLog = path.join(cwd, 'gh-view.log');
  const fake = writeViewFake(cwd, 'gh-view-open.cjs', ghLog,
    { state: 'OPEN', mergeable: 'MERGEABLE', mergeStateStatus: 'CLEAN', mergedAt: null, closed: false, closedAt: null });

  const result = run(cwd, ['review', 'gh-status-open', '--github', '--pr', '11'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const statusData = envelopeData(result.stdout);
  assert.equal(statusData.prNumber, '11');
  assert.equal(statusData.outcome, 'open');
  // Crossed the real process boundary as a status read, never a create/push.
  assert.match(fs.readFileSync(ghLog, 'utf8'), /pr view 11/);
  const view = stateView(cwd);
  assert.equal(view.work['gh-status-open'].status, 'proposed');
  assert.equal(view.frictions?.['gh-status-open'], undefined, 'the status check never records friction');
});

test('review --github --pr on a merged PR (closed:true, mergedAt set) reports it merged, informational only, with no local state or friction change', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-status-merged');
  const ghLog = path.join(cwd, 'gh-view.log');
  const fake = writeViewFake(cwd, 'gh-view-merged.cjs', ghLog,
    { state: 'MERGED', mergeable: 'MERGEABLE', mergeStateStatus: 'CLEAN', mergedAt: '2026-07-17T10:00:00Z', closed: true, closedAt: '2026-07-17T10:00:00Z' });

  const result = run(cwd, ['review', 'gh-status-merged', '--github', '--pr', '42'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const mergedStatusData = envelopeData(result.stdout);
  assert.equal(mergedStatusData.prNumber, '42');
  assert.equal(mergedStatusData.outcome, 'merged');
  assert.equal(mergedStatusData.mergedAt, '2026-07-17T10:00:00Z');
  const view = stateView(cwd);
  // This cell never reconciles a GitHub-side merge into FSM state (out of scope, D4/D6).
  assert.equal(view.work['gh-status-merged'].status, 'proposed');
  assert.equal(view.frictions?.['gh-status-merged'], undefined);
});

test('review --github --pr on a closed-without-merge PR names the PR, points to fgos reject, mutates nothing, and resolves in exactly one gh invocation with mergeable UNKNOWN — proving pollTimeoutMs:0', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-status-closed');
  const ghLog = path.join(cwd, 'gh-view.log');
  // mergeable:"UNKNOWN" is the honest test: were pollTimeoutMs the default 10s
  // (fix absent), viewGitHubPRStatus would re-invoke this fake on a poll loop
  // while mergeable stays UNKNOWN. Exactly one logged invocation proves the
  // pollTimeoutMs:0 override collapsed the loop to a single read.
  const fake = writeViewFake(cwd, 'gh-view-closed.cjs', ghLog,
    { state: 'CLOSED', mergeable: 'UNKNOWN', mergeStateStatus: 'UNKNOWN', mergedAt: null, closed: true, closedAt: '2026-07-17T09:00:00Z' });

  const startedAt = Date.now();
  const result = run(cwd, ['review', 'gh-status-closed', '--github', '--pr', '77'], { FGOS_GH_COMMAND: fake });
  const elapsedMs = Date.now() - startedAt;

  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const closedData = envelopeData(result.stdout);
  assert.equal(closedData.prNumber, '77');
  assert.equal(closedData.outcome, 'closed-unmerged');

  const invocations = fs.readFileSync(ghLog, 'utf8').trim().split('\n').filter(Boolean);
  assert.equal(invocations.length, 1, `expected exactly one gh invocation under pollTimeoutMs:0, got ${invocations.length}`);
  assert.ok(elapsedMs < 5000, `status check must resolve well under the default 10s poll timeout, took ${elapsedMs}ms`);

  const view = stateView(cwd);
  assert.equal(view.work['gh-status-closed'].status, 'proposed', 'a GitHub-side close is not a reject — no FSM mutation');
  assert.equal(view.frictions?.['gh-status-closed'], undefined, 'the status check never records friction');
});

test('review --github --pr reports a gh status-check failure as plain output with no state mutation or friction', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-status-failed');
  const fake = writeAuthFailFake(cwd);

  const result = run(cwd, ['review', 'gh-status-failed', '--github', '--pr', '5'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const failedData = envelopeData(result.stdout);
  assert.equal(failedData.outcome, 'check-failed');
  assert.equal(failedData.reason, 'auth-failure');
  const view = stateView(cwd);
  assert.equal(view.work['gh-status-failed'].status, 'proposed');
  assert.equal(view.frictions?.['gh-status-failed'], undefined);
});

// --- catchup (D6/D7/D11: unified catch-up-by-merge for a merge-related park) ---

// Builds on makeRunnerProposedItem: proposes a ROOT/standalone runner item,
// then parks it blocked with `reason` via the real proposed -> blocked edge
// (fsm.mjs's own reason requirement on that edge, same as the existing
// 'approve of a runner item that conflicts' test above) so item.reason is
// genuine, not synthesized.
function makeBlockedRunnerItem(cwd, id, reason, extra = {}) {
  makeRunnerProposedItem(cwd, id, extra);
  run(cwd, ['move', id, '--to', 'blocked', '--reason', reason]);
  commitPending(cwd, `state: park ${id} (${reason})`);
}

// Same shape, for a leaf under a per-root branch tree (mirrors
// makeRunnerProposedLeafItem above).
function makeBlockedLeafItem(cwd, rootId, leafId, reason, extra = {}) {
  makeRunnerProposedLeafItem(cwd, rootId, leafId, extra);
  run(cwd, ['move', leafId, '--to', 'blocked', '--reason', reason]);
  commitPending(cwd, `state: park ${leafId} (${reason})`);
}

test('catchup on a root parked with reason integration-drift, after a non-overlapping main-side change, merges main into fgw/<id> and bounces blocked -> proposed (D7)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeBlockedRunnerItem(cwd, 'catchup-root-drift', 'integration-drift', { verify: 'test -f catchup-root-drift-produced.txt' });

  // A genuinely non-overlapping change lands on main AFTER the park
  // (another root's own approve, simulated directly).
  fs.writeFileSync(path.join(cwd, 'main-side-change.txt'), 'landed while parked\n');
  gitAtCwd(cwd, ['add', 'main-side-change.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'another root lands on main']);

  const mainHeadBefore = gitHead(cwd);
  const worktreesBefore = gitAtCwd(cwd, ['worktree', 'list', '--porcelain']);
  const result = run(cwd, ['catchup', 'catchup-root-drift']);
  assert.equal(result.status, 0, result.stderr);
  const catchupData = envelopeData(result.stdout);
  assert.equal(catchupData.from, 'blocked');
  assert.equal(catchupData.to, 'proposed');

  assert.equal(gitHead(cwd), mainHeadBefore, "catchup must never touch the human's own main checkout");
  assert.equal(gitAtCwd(cwd, ['worktree', 'list', '--porcelain']), worktreesBefore, 'the ephemeral catchup worktree is cleaned up — no leftover');
  assert.equal(stateView(cwd).work['catchup-root-drift'].status, 'proposed');

  const branchLog = gitAtCwd(cwd, ['log', '--oneline', 'fgw/catchup-root-drift']);
  assert.match(branchLog, /catch-up: merge main into fgw\/catchup-root-drift/);
  const producedFile = gitAtCwd(cwd, ['show', 'fgw/catchup-root-drift:catchup-root-drift-produced.txt']);
  assert.match(producedFile, /ok/);
  const mainSideFile = gitAtCwd(cwd, ['show', 'fgw/catchup-root-drift:main-side-change.txt']);
  assert.match(mainSideFile, /landed while parked/);
});

test('catchup on a leaf parked with reason merge-conflict targets its PARENT branch (fgw/<root>), not main, and succeeds the same way (D11)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeBlockedLeafItem(cwd, 'catchup-leaf-root', 'catchup-leaf-child', 'merge-conflict', { verify: 'test -f catchup-leaf-child-produced.txt' });

  // A sibling leaf's own merge lands on fgw/<root> AFTER this leaf's park —
  // non-overlapping (a different file).
  gitAtCwd(cwd, ['checkout', 'fgw/catchup-leaf-root']);
  fs.writeFileSync(path.join(cwd, 'sibling-produced.txt'), 'sibling ok\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'sibling leaf merged into root']);
  gitAtCwd(cwd, ['checkout', 'main']);

  const mainHeadBefore = gitHead(cwd);
  const worktreesBefore = gitAtCwd(cwd, ['worktree', 'list', '--porcelain']);
  const result = run(cwd, ['catchup', 'catchup-leaf-child']);
  assert.equal(result.status, 0, result.stderr);
  const leafCatchupData = envelopeData(result.stdout);
  assert.equal(leafCatchupData.from, 'blocked');
  assert.equal(leafCatchupData.to, 'proposed');
  assert.equal(leafCatchupData.target, 'fgw/catchup-leaf-root', 'catchup must merge the PARENT branch, not main');

  assert.equal(gitHead(cwd), mainHeadBefore, 'a leaf catchup must never touch main');
  assert.equal(gitAtCwd(cwd, ['worktree', 'list', '--porcelain']), worktreesBefore, 'the ephemeral catchup worktree is cleaned up — no leftover');
  assert.equal(stateView(cwd).work['catchup-leaf-child'].status, 'proposed');

  const branchLog = gitAtCwd(cwd, ['log', '--oneline', 'fgw/catchup-leaf-child']);
  assert.match(branchLog, /catch-up: merge fgw\/catchup-leaf-root into fgw\/catchup-leaf-child/);
  const ownFile = gitAtCwd(cwd, ['show', 'fgw/catchup-leaf-child:catchup-leaf-child-produced.txt']);
  assert.match(ownFile, /ok/);
  const siblingFile = gitAtCwd(cwd, ['show', 'fgw/catchup-leaf-child:sibling-produced.txt']);
  assert.match(siblingFile, /sibling ok/);
});

test('catchup on an item whose target has a REAL same-line conflict leaves it blocked, aborts cleanly (branch tip unchanged), and names the conflicted file', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'base\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'seed shared.txt']);

  addOk(cwd, 'catchup-conflict-item');
  run(cwd, ['move', 'catchup-conflict-item', '--to', 'doing']);
  commitPending(cwd, 'state: claim catchup-conflict-item');

  gitAtCwd(cwd, ['checkout', '-b', 'fgw/catchup-conflict-item']);
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'branch-change\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'branch changes shared.txt']);
  gitAtCwd(cwd, ['checkout', 'main']);

  run(cwd, ['move', 'catchup-conflict-item', '--to', 'proposed']);
  commitPending(cwd, 'state: propose catchup-conflict-item');
  run(cwd, ['move', 'catchup-conflict-item', '--to', 'blocked', '--reason', 'merge-conflict']);
  commitPending(cwd, 'state: park catchup-conflict-item');

  // main changes the SAME line differently after the park — a genuine
  // conflict for catchup's merge (main into the branch) to detect.
  fs.writeFileSync(path.join(cwd, 'shared.txt'), 'main-change\n');
  gitAtCwd(cwd, ['add', 'shared.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'main changes shared.txt']);

  const mainHeadBefore = gitHead(cwd);
  const branchHeadBefore = gitAtCwd(cwd, ['rev-parse', 'fgw/catchup-conflict-item']).trim();
  const worktreesBefore = gitAtCwd(cwd, ['worktree', 'list', '--porcelain']);

  const result = run(cwd, ['catchup', 'catchup-conflict-item']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /conflicted/);
  assert.match(result.stdout, /shared\.txt/);

  assert.equal(gitHead(cwd), mainHeadBefore, 'main must be unchanged by a failed catchup');
  assert.equal(gitAtCwd(cwd, ['rev-parse', 'fgw/catchup-conflict-item']).trim(), branchHeadBefore, "the item's own branch tip must be unchanged after an aborted catchup");
  assert.equal(gitAtCwd(cwd, ['worktree', 'list', '--porcelain']), worktreesBefore, 'the ephemeral catchup worktree is cleaned up even on abort — no leftover');
  assert.equal(stateView(cwd).work['catchup-conflict-item'].status, 'blocked');
});

test('catchup on an item blocked for an unrelated reason (e.g. anti-loop-max-visits) is rejected with a validation error naming the actual reason, before any git operation runs', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'catchup-unrelated-reason');
  run(cwd, ['move', 'catchup-unrelated-reason', '--to', 'doing']);
  run(cwd, ['move', 'catchup-unrelated-reason', '--to', 'proposed']);
  run(cwd, ['move', 'catchup-unrelated-reason', '--to', 'blocked', '--reason', 'anti-loop-max-visits']);

  const result = run(cwd, ['catchup', 'catchup-unrelated-reason']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /anti-loop-max-visits/);
  assert.equal(stateView(cwd).work['catchup-unrelated-reason'].status, 'blocked');
});

test('catchup on a nonexistent id is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['catchup', 'ghost']);
  assert.equal(result.status, 4);
});

test('catchup on a status other than blocked is rejected as precondition, exit 2', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'catchup-not-blocked');
  const result = run(cwd, ['catchup', 'catchup-not-blocked']);
  assert.equal(result.status, 2);
});

test('the CLI usage message for an unknown verb lists catchup in the surface', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['bogus-verb']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /catchup/);
});

// --- coexistence: harness marker detection + territory manifest -----------
// (install-coexistence D2/D4/D6 — see src/install/coexist.mjs)

function coexistPath(cwd) {
  return path.join(cwd, '.fgos', 'coexistence.json');
}

test('init with no other harness present still writes .fgos/coexistence.json with an empty detected_harnesses', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['init']);
  assert.equal(result.status, 0);
  assert.doesNotMatch(result.stdout, /Detected other harness/);

  const manifest = JSON.parse(fs.readFileSync(coexistPath(cwd), 'utf8'));
  assert.equal(manifest.v, 1);
  assert.deepEqual(manifest.detected_harnesses, []);
});

test('init in a project with a .bee/ marker detects it, reports it in the output, and leaves .bee/ byte/mtime unchanged (D4 read-only)', () => {
  const cwd = tmpCwd();
  const beeDir = path.join(cwd, '.bee');
  fs.mkdirSync(beeDir);
  const beeMarkerFile = path.join(beeDir, 'state.json');
  fs.writeFileSync(beeMarkerFile, '{"phase":"idle"}');
  const beforeStat = fs.statSync(beeMarkerFile);
  const beforeContent = fs.readFileSync(beeMarkerFile);

  const result = run(cwd, ['init']);
  assert.equal(result.status, 0);
  const initData = envelopeData(result.stdout);
  assert.deepEqual(initData.detectedHarnesses, [{ name: 'bee', markers: ['.bee'] }]);

  const manifest = JSON.parse(fs.readFileSync(coexistPath(cwd), 'utf8'));
  assert.deepEqual(manifest.detected_harnesses, [{ name: 'bee', markers: ['.bee'] }]);

  const afterStat = fs.statSync(beeMarkerFile);
  assert.equal(afterStat.mtimeMs, beforeStat.mtimeMs);
  assert.deepEqual(fs.readFileSync(beeMarkerFile), beforeContent);
});

test('init never creates a host AGENTS.md that did not already exist (D6)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['init']);
  assert.equal(result.status, 0);
  assert.equal(fs.existsSync(path.join(cwd, 'AGENTS.md')), false);
});

test('init runs a second time (idempotent) and rewrites coexistence.json with the same content when nothing in the project changed', () => {
  const cwd = tmpCwd();
  fs.mkdirSync(path.join(cwd, '.claude'));

  assert.equal(run(cwd, ['init']).status, 0);
  const first = JSON.parse(fs.readFileSync(coexistPath(cwd), 'utf8'));

  assert.equal(run(cwd, ['init']).status, 0);
  const second = JSON.parse(fs.readFileSync(coexistPath(cwd), 'utf8'));

  assert.deepEqual(second, first);
});

// --- take/return: nguồn nhánh (human-rounds D2) — a second door for a
// `blocked` item that already carries a live `fgw/<id>` branch (parked by
// the runner after too many visits, or a rejected proposal whose branch
// survives): `take` claims it via the existing blocked -> doing edge
// (fsm.mjs:69), discriminated by `branchHeadAtTake` — the BRANCH's own HEAD,
// never the main-based `headAtTake`; `return` verifies on the branch itself,
// in a disposable DETACHED worktree, and never inspects or touches the
// human's own main checkout (D2: "tree người là việc của người"). ----------

// Leaves behind exactly what a real parked runner branch looks like: item at
// `blocked`, a live `fgw/<id>` branch one commit ahead of main, the human's
// own main tree/HEAD completely undisturbed — mirrors
// `makeRunnerProposedItem`'s "simulate what the runner leaves behind"
// discipline, but the item never reaches `proposed`; it stays `blocked`,
// the D2 starting point.
function makeBlockedBranchItem(cwd, id, extra = {}) {
  addOk(cwd, id, extra);
  // Commit the add BEFORE branching off (mirrors makeRunnerProposedItem's
  // own ordering above) — otherwise the pending events.jsonl delta rides
  // along into the branch's own commit and is lost from main the moment
  // `checkout main` restores main's own (add-less) tracked state.
  commitPending(cwd, `state: add ${id}`);

  gitAtCwd(cwd, ['checkout', '-b', `fgw/${id}`]);
  fs.writeFileSync(path.join(cwd, `${id}-attempt.txt`), 'worker attempt\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', `worker attempt for ${id}`]);
  gitAtCwd(cwd, ['checkout', 'main']);
  run(cwd, ['move', id, '--to', 'blocked']);
  commitPending(cwd, `state: park ${id}`);
}

test('take --id on a blocked item with a live fgw/<id> branch claims via blocked -> doing, recording branchHeadAtTake (the branch\'s own HEAD, never the main-based headAtTake)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeBlockedBranchItem(cwd, 'branch-take-a');
  const branchHead = gitAtCwd(cwd, ['rev-parse', 'fgw/branch-take-a']).trim();
  const mainHeadBefore = gitHead(cwd);
  assert.notEqual(branchHead, mainHeadBefore, 'sanity: the branch really is ahead of main');

  const result = run(cwd, ['take', '--id', 'branch-take-a']);
  assert.equal(result.status, 0, `take failed: ${result.stderr}`);
  const takeData = envelopeData(result.stdout);
  assert.equal(takeData.from, 'blocked');
  assert.equal(takeData.to, 'doing');
  assert.equal(takeData.branch, 'fgw/branch-take-a');

  const view = stateView(cwd);
  assert.equal(view.work['branch-take-a'].status, 'doing');
  assert.equal(view.work['branch-take-a'].claimActor, 'human');
  assert.equal(view.work['branch-take-a'].branchHeadAtTake, branchHead);
  assert.equal('headAtTake' in view.work['branch-take-a'], false, 'a branch take never records the main-based headAtTake');
  assert.equal(view.outcomes['branch-take-a'].predicted.branchHeadAtTake, branchHead);
  assert.equal(gitHead(cwd), mainHeadBefore, "take never touches the human's own main checkout");
});

test('take --id on a blocked item with NO live branch still falls through to the old todo-only CAS — conflict, exit 3, item stays blocked', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'blocked-no-branch');
  run(cwd, ['move', 'blocked-no-branch', '--to', 'blocked']);

  const result = run(cwd, ['take', '--id', 'blocked-no-branch']);
  assert.equal(result.status, 3);
  assert.equal(stateView(cwd).work['blocked-no-branch'].status, 'blocked');
});

test('return on a branch-source take: verify passes in a disposable detached worktree at the branch tip -> proposed, branchHeadAtReturn recorded (never headAtReturn), the human\'s own main checkout is untouched and no worktree is left behind', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeBlockedBranchItem(cwd, 'branch-return-ok', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'branch-return-ok']).status, 0);
  // take's own event lands on events.jsonl in the SAME main tree (take never
  // uses a worktree) — commit that bookkeeping to main before switching
  // branches, exactly like commitFile's own doc comment describes.
  commitPending(cwd, 'state: take branch-return-ok');

  // The human commits their fix ON THE BRANCH — never on main.
  gitAtCwd(cwd, ['checkout', 'fgw/branch-return-ok']);
  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'fixed by hand\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'human fix']);
  const branchHeadAtReturn = gitAtCwd(cwd, ['rev-parse', 'fgw/branch-return-ok']).trim();
  gitAtCwd(cwd, ['checkout', 'main']);
  const mainHeadBefore = gitHead(cwd);
  const worktreesBefore = gitAtCwd(cwd, ['worktree', 'list', '--porcelain']);

  const result = run(cwd, ['return', 'branch-return-ok']);
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  assert.match(result.stdout, /proposed/);

  const view = stateView(cwd);
  assert.equal(view.work['branch-return-ok'].status, 'proposed');
  assert.equal(view.work['branch-return-ok'].branchHeadAtReturn, branchHeadAtReturn);
  assert.equal('headAtReturn' in view.work['branch-return-ok'], false, 'a branch return never records the main-based headAtReturn (D2 CẤM)');
  assert.equal(gitHead(cwd), mainHeadBefore, "return never advances or touches the human's own main checkout");
  assert.equal(gitAtCwd(cwd, ['worktree', 'list', '--porcelain']), worktreesBefore, 'the disposable detached verify worktree is cleaned up — no leftover');
});

test('return on a branch-source take refuses when the branch has NOT advanced past branchHeadAtTake (no new commit) — validation, exit 4, item stays doing', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeBlockedBranchItem(cwd, 'branch-return-stale', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'branch-return-stale']).status, 0);

  const result = run(cwd, ['return', 'branch-return-stale']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /has not advanced past branchHeadAtTake/);
  assert.equal(stateView(cwd).work['branch-return-stale'].status, 'doing');
});

test('return on a branch-source take never requires the human\'s own main tree to be clean (D2: "tree người là việc của người") — a dirty main tree never blocks it and is left untouched', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeBlockedBranchItem(cwd, 'branch-return-dirty-main', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'branch-return-dirty-main']).status, 0);
  commitPending(cwd, 'state: take branch-return-dirty-main');

  gitAtCwd(cwd, ['checkout', 'fgw/branch-return-dirty-main']);
  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'fixed by hand\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'human fix']);
  gitAtCwd(cwd, ['checkout', 'main']);

  // Dirty the human's own main working tree — untracked, uncommitted, and
  // unrelated to this item entirely.
  fs.writeFileSync(path.join(cwd, 'scratch.txt'), 'unrelated in-progress work\n');

  const result = run(cwd, ['return', 'branch-return-dirty-main']);
  assert.equal(result.status, 0, `return must never inspect the main tree for a branch-source item: ${result.stderr}`);
  assert.equal(stateView(cwd).work['branch-return-dirty-main'].status, 'proposed');
  assert.equal(fs.readFileSync(path.join(cwd, 'scratch.txt'), 'utf8'), 'unrelated in-progress work\n', "the human's own dirty scratch file is untouched");
});

test('return on a branch-source take: verify-fail -> doing -> blocked + friction (verification layer), exit 0 (a defined outcome, not a CLI error)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeBlockedBranchItem(cwd, 'branch-return-red', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'branch-return-red']).status, 0);
  commitPending(cwd, 'state: take branch-return-red');

  gitAtCwd(cwd, ['checkout', 'fgw/branch-return-red']);
  fs.writeFileSync(path.join(cwd, 'wrong-file.txt'), 'nope\n'); // advances the branch, never satisfies verify
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'wrong fix']);
  gitAtCwd(cwd, ['checkout', 'main']);

  const result = run(cwd, ['return', 'branch-return-red']);
  assert.equal(result.status, 0, `return should exit 0 for a defined blocked outcome: ${result.stderr}`);
  assert.match(result.stdout, /blocked/);

  const view = stateView(cwd);
  assert.equal(view.work['branch-return-red'].status, 'blocked');
  assert.equal(view.outcomes['branch-return-red'].actual.outcome, 'blocked');
  assert.equal(view.frictions['branch-return-red'][0].layer, 'verification');
  assert.equal(view.frictions['branch-return-red'][0].errorClass, 'verify-miss');
});

// --- `fgos session` (fgos-multi-session-checkout Epic 1b) -------------------
//
// CLI-surface integration checks for the `session` verb family wiring
// session.mjs's createSession/endSession/listSessions. The module's own
// divergence/lock/worktree algorithm is proven by test/runner/session.test.mjs
// (cell fgos-multi-session-checkout-1); these tests exercise only the CLI
// dispatch, output shape, and exit-code surface. A session worktree is a real
// `git worktree add --detach` on the repo's HEAD, so every test uses a
// git-backed cwd; each started session is ended (plain or --force) so its
// worktree never leaks.

// Parses `session start`'s output into { result, sessionId, worktreePath }.
function startSession(cwd, extraArgs = []) {
  const result = run(cwd, ['session', 'start', ...extraArgs]);
  const data = result.status === 0 ? envelopeData(result.stdout) : null;
  return {
    result,
    sessionId: data ? data.sessionId : null,
    worktreePath: data ? data.worktreePath : null,
  };
}

// Makes a commit from INSIDE a detached-HEAD session worktree, diverging its
// HEAD from the recorded start commit (a genuinely dangling commit). Returns
// the new commit sha. The worktree shares the repo's git config (user set by
// initGitCwd), so the commit needs no extra setup.
function commitInWorktree(worktreePath, filename, content = 'inside-session\n') {
  fs.writeFileSync(path.join(worktreePath, filename), content);
  execFileSync('git', ['add', filename], { cwd: worktreePath });
  execFileSync('git', ['commit', '-q', '-m', `inside: ${filename}`], { cwd: worktreePath });
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: worktreePath, encoding: 'utf8' }).trim();
}

test('session start returns a session id and an existing worktree path, exit 0', () => {
  const cwd = initGitCwd();
  const { result, sessionId, worktreePath } = startSession(cwd);
  assert.equal(result.status, 0, `session start should succeed: ${result.stderr}`);
  assert.ok(sessionId, 'data names a session id');
  assert.ok(worktreePath, 'data names a worktree path to cd into');
  assert.ok(fs.existsSync(worktreePath), 'the worktree directory actually exists on disk');

  run(cwd, ['session', 'end', sessionId]);
});

test('session list shows a started session, then omits it after it ends', () => {
  const cwd = initGitCwd();
  const { sessionId, worktreePath } = startSession(cwd, ['--item', 'work-x']);

  const listed = run(cwd, ['session', 'list']);
  assert.equal(listed.status, 0);
  const listedData = envelopeData(listed.stdout);
  const entry = listedData.find((e) => e.sessionId === sessionId);
  assert.ok(entry, 'the started session id is listed');
  assert.equal(entry.itemId, 'work-x', 'the bound item id is listed');
  assert.equal(entry.worktreePath, worktreePath, 'the worktree path is listed');

  assert.equal(run(cwd, ['session', 'end', sessionId]).status, 0);
  const listedAfter = run(cwd, ['session', 'list']);
  assert.equal(listedAfter.status, 0);
  const listedAfterData = envelopeData(listedAfter.stdout);
  assert.ok(!listedAfterData.some((e) => e.sessionId === sessionId), 'ended session no longer listed');
  assert.deepEqual(listedAfterData, [], 'empty registry returns an empty list');
});

test('session end removes a non-diverged session cleanly — exit 0, worktree gone', () => {
  const cwd = initGitCwd();
  const { sessionId, worktreePath } = startSession(cwd);
  assert.ok(fs.existsSync(worktreePath));

  const ended = run(cwd, ['session', 'end', sessionId]);
  assert.equal(ended.status, 0, `clean end should succeed: ${ended.stderr}`);
  assert.ok(!fs.existsSync(worktreePath), 'the worktree directory is removed from disk');
});

test('session end on a diverged session refuses at the CLI level and names the dangling sha, exit 4', () => {
  const cwd = initGitCwd();
  const { sessionId, worktreePath } = startSession(cwd);
  const danglingSha = commitInWorktree(worktreePath, 'change.txt');

  const ended = run(cwd, ['session', 'end', sessionId]);
  assert.equal(ended.status, 4, 'a diverged session is refused as a clean validation error, not a crash');
  assert.ok(ended.stderr.includes(danglingSha), `the refusal names the dangling commit sha: ${ended.stderr}`);
  assert.ok(fs.existsSync(worktreePath), 'the worktree is left in place — no silent loss of the dangling commit');

  // Cleanup: only --force can remove a diverged session.
  run(cwd, ['session', 'end', sessionId, '--force']);
});

test('session end --force removes a diverged session anyway, exit 0', () => {
  const cwd = initGitCwd();
  const { sessionId, worktreePath } = startSession(cwd);
  commitInWorktree(worktreePath, 'change.txt');

  const forced = run(cwd, ['session', 'end', sessionId, '--force']);
  assert.equal(forced.status, 0, `--force should override the divergence refusal: ${forced.stderr}`);
  assert.equal(envelopeData(forced.stdout).forced, true);
  assert.ok(!fs.existsSync(worktreePath), 'the worktree directory is removed under --force');
  const remaining = envelopeData(run(cwd, ['session', 'list']).stdout);
  assert.ok(!remaining.some((e) => e.sessionId === sessionId));
});

test('session end on an unknown session id is a clean validation error, exit 4, no crash', () => {
  const cwd = initGitCwd();
  const result = run(cwd, ['session', 'end', 'no-such-session']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /unknown or already-ended session/);
});

test('session with no sub-verb, and an unknown sub-verb, are both rejected as validation, exit 4', () => {
  const cwd = initGitCwd();
  assert.equal(run(cwd, ['session']).status, 4);
  assert.equal(run(cwd, ['session', 'bogus']).status, 4);
});

// --- approve session-nesting guard (fgos-multi-session-checkout Epic 2) ------
//
// approve (NOT --github) refuses when cwd is inside a registered session
// worktree, covering BOTH non-github source paths — runner (a merge there
// lands on the session's own detached HEAD, never main) and pull/legacy (a
// goal-check verifies whatever cwd has checked out while claiming "verified on
// main"). Every session below is created via session.mjs's REAL createSession
// (not a mock) so the guard sees a genuinely registered worktree, and torn
// down with endSession(force) so no worktree leaks.

// A git-backed cwd with a `main` default branch AND `.fgos/` ENTIRELY
// gitignored (not just state.json). The full ignore is load-bearing here:
// createSession runs `git worktree add --detach HEAD`, so if HEAD carried a
// committed `.fgos/` (the repo's usual convention), the new worktree would
// materialize it and collide (EEXIST) with the `.fgos` symlink createSession
// then creates. Gitignoring `.fgos/` keeps it out of every commit; the shared
// store still lives on disk and is symlinked into each session worktree, and
// isMainTreeClean already excludes `.fgos/`, so approve is unaffected.
function initSessionSafeCwd() {
  const cwd = tmpCwd();
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd });
  fs.writeFileSync(path.join(cwd, '.gitignore'), '.fgos/\n');
  fs.writeFileSync(path.join(cwd, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt', '.gitignore'], { cwd });
  execFileSync('git', ['commit', '-q', '-m', 'seed'], { cwd });
  return cwd;
}

// Builds a runner-classified proposed item (a live fgw/<id> branch with a real
// commit, item moved doing->proposed) on an initSessionSafeCwd, WITHOUT ever
// committing `.fgos/` into HEAD — the only difference from makeRunnerProposedItem,
// whose `git add -A` commits would both fold `.fgos/` into HEAD (breaking the
// session-worktree symlink) and, under a fully-ignored `.fgos/`, have nothing to
// commit. main's HEAD stays at seed; only the fgw/<id> branch carries the produced
// file, exactly what classifySource keys off.
function makeSessionSafeRunnerItem(cwd, id, extra = {}) {
  addOk(cwd, id, extra);
  run(cwd, ['move', id, '--to', 'doing']);
  gitAtCwd(cwd, ['checkout', '-b', `fgw/${id}`]);
  fs.writeFileSync(path.join(cwd, `${id}-produced.txt`), 'ok\n');
  gitAtCwd(cwd, ['add', `${id}-produced.txt`]);
  gitAtCwd(cwd, ['commit', '-q', '-m', `worker output for ${id}`]);
  gitAtCwd(cwd, ['checkout', 'main']);
  run(cwd, ['move', id, '--to', 'proposed']);
}

test('approve refuses from inside a registered session worktree (runner source) — no merge, item stays proposed, main HEAD unchanged, exit 4', () => {
  const cwd = initSessionSafeCwd();
  run(cwd, ['init']);
  makeSessionSafeRunnerItem(cwd, 'approve-nested-runner', { verify: 'test -f approve-nested-runner-produced.txt' });
  const headBefore = gitHead(cwd);

  const session = createSession(cwd, { sessionId: 'sess-runner' });
  try {
    const result = run(session.worktreePath, ['approve', 'approve-nested-runner']);
    assert.equal(result.status, 4, `expected a clean validation refusal: ${result.stdout}${result.stderr}`);
    assert.match(result.stderr, /sess-runner/, 'the refusal names the session id cwd is nested inside');
    assert.match(result.stderr, /session end/, 'the refusal tells the caller how to proceed');
    assert.equal(stateView(cwd).work['approve-nested-runner'].status, 'proposed', 'item is untouched — no merge, no state change');
    assert.equal(gitHead(cwd), headBefore, 'main HEAD must be unchanged — no merge landed');
  } finally {
    endSession(cwd, session.sessionId, { force: true });
  }
});

test('approve refuses from inside a registered session worktree (pull source) — refuses before any goal-check, item stays proposed, exit 4', () => {
  const cwd = initSessionSafeCwd();
  run(cwd, ['init']);
  addOk(cwd, 'approve-nested-pull', { verify: 'test -f proof.txt' });
  run(cwd, ['take', '--id', 'approve-nested-pull']);
  commitFile(cwd, 'proof.txt');
  run(cwd, ['return', 'approve-nested-pull']);

  const session = createSession(cwd, { sessionId: 'sess-pull' });
  try {
    // proof.txt exists at HEAD, so an unguarded pull-source approve would run
    // goal-check, pass, and mark the item done. The guard must refuse first.
    const result = run(session.worktreePath, ['approve', 'approve-nested-pull']);
    assert.equal(result.status, 4, `expected a clean validation refusal: ${result.stdout}${result.stderr}`);
    assert.match(result.stderr, /sess-pull/, 'the refusal names the session id cwd is nested inside');
    assert.equal(stateView(cwd).work['approve-nested-pull'].status, 'proposed', 'item stays proposed — goal-check never ran to close it');
  } finally {
    endSession(cwd, session.sessionId, { force: true });
  }
});

test('approve from the main checkout is unaffected by the guard even while a session is registered — runner and pull both close to done, exit 0', () => {
  // runner source: main-checkout approve still merges fgw/<id> and closes.
  const cwdR = initSessionSafeCwd();
  run(cwdR, ['init']);
  makeSessionSafeRunnerItem(cwdR, 'approve-main-runner', { verify: 'test -f approve-main-runner-produced.txt' });
  const sessionR = createSession(cwdR, { sessionId: 'sess-active-runner' });
  try {
    const resR = run(cwdR, ['approve', 'approve-main-runner']);
    assert.equal(resR.status, 0, `runner approve from main must still succeed with a session active: ${resR.stderr}`);
    assert.equal(stateView(cwdR).work['approve-main-runner'].status, 'done');
  } finally {
    endSession(cwdR, sessionR.sessionId, { force: true });
  }

  // pull source: main-checkout approve still re-verifies on main and closes.
  const cwdP = initSessionSafeCwd();
  run(cwdP, ['init']);
  addOk(cwdP, 'approve-main-pull', { verify: 'test -f proof.txt' });
  run(cwdP, ['take', '--id', 'approve-main-pull']);
  commitFile(cwdP, 'proof.txt');
  run(cwdP, ['return', 'approve-main-pull']);
  const sessionP = createSession(cwdP, { sessionId: 'sess-active-pull' });
  try {
    const resP = run(cwdP, ['approve', 'approve-main-pull']);
    assert.equal(resP.status, 0, `pull approve from main must still succeed with a session active: ${resP.stderr}`);
    assert.equal(stateView(cwdP).work['approve-main-pull'].status, 'done');
  } finally {
    endSession(cwdP, sessionP.sessionId, { force: true });
  }
});

test('return succeeds unchanged from inside a real session worktree (created via session.mjs createSession) — doing -> proposed, exit 0', () => {
  const cwd = initSessionSafeCwd();
  run(cwd, ['init']);
  addOk(cwd, 'return-in-session', { verify: 'test -f proof.txt' });
  run(cwd, ['take', '--id', 'return-in-session']); // headAtTake = current main HEAD

  // Real detached-HEAD worktree at headAtTake, then advance it with a genuine
  // commit made FROM INSIDE the session worktree (a real dangling commit).
  const session = createSession(cwd, { sessionId: 'sess-return' });
  commitInWorktree(session.worktreePath, 'proof.txt', 'work\n');

  try {
    const result = run(session.worktreePath, ['return', 'return-in-session']);
    assert.equal(result.status, 0, `return from inside a session worktree should succeed unchanged: ${result.stdout}${result.stderr}`);
    assert.match(result.stdout, /proposed/);
    assert.equal(stateView(cwd).work['return-in-session'].status, 'proposed');
  } finally {
    endSession(cwd, session.sessionId, { force: true });
  }
});

// --- approve ad-hoc (unregistered) worktree guard (P44) --------------------
//
// The registry-based guard above only catches a worktree created through
// `fgos session start` (session.mjs's createSession). A plain `git worktree
// add` run by hand is invisible to sessions.json, so it slipped through the
// same guard block untouched — approve would merge/verify against that
// worktree's checkout while still reporting the item `done`, exactly the
// silent false-verification the registry guard exists to prevent, just from
// an unregistered path instead of a registered one. The fix must catch ANY
// worktree structurally — main-vs-linked, not registered-vs-not.
//
// Uses initGitCwdMain (the REAL fgos convention: `.fgos/events.jsonl` tracked
// and committed, only `.fgos/state.json` gitignored) rather than
// initSessionSafeCwd's fully-ignored `.fgos/` — a plain `git worktree add`
// only ever checks out tracked content, so the ad-hoc worktree must have a
// genuinely committed events log to see the item at all (mirroring what a
// real ad-hoc worktree of this repo would have on disk).

function addAdHocWorktree(cwd, branch) {
  const worktreePath = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-adhoc-wt-'));
  fs.rmdirSync(worktreePath); // git worktree add requires the path not exist yet
  execFileSync('git', ['worktree', 'add', '-b', branch, worktreePath, 'HEAD'], { cwd });
  return worktreePath;
}

function removeAdHocWorktree(cwd, worktreePath) {
  execFileSync('git', ['worktree', 'remove', '--force', worktreePath], { cwd });
}

test('approve refuses from an ad-hoc worktree never created through "fgos session start" (runner source) — no merge, item stays proposed, main HEAD unchanged, exit 4', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'approve-adhoc-runner', { verify: 'test -f approve-adhoc-runner-produced.txt' });
  const headBefore = gitHead(cwd);

  const worktreePath = addAdHocWorktree(cwd, 'adhoc-runner-branch');
  try {
    assert.equal(stateView(cwd).work['approve-adhoc-runner'].status, 'proposed', 'sanity: the ad-hoc worktree really does see the item (real committed events log)');
    const result = run(worktreePath, ['approve', 'approve-adhoc-runner']);
    assert.equal(result.status, 4, `expected a clean validation refusal, not a merge on an unregistered worktree: ${result.stdout}${result.stderr}`);
    assert.equal(stateView(cwd).work['approve-adhoc-runner'].status, 'proposed', 'item is untouched — no merge, no false "done"');
    assert.equal(gitHead(cwd), headBefore, 'main HEAD must be unchanged — nothing landed on main');
  } finally {
    removeAdHocWorktree(cwd, worktreePath);
  }
});

test('approve refuses from an ad-hoc worktree never created through "fgos session start" (pull source) — refuses before any goal-check, item stays proposed, exit 4', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  commitPending(cwd, 'state: init');
  addOk(cwd, 'approve-adhoc-pull', { verify: 'test -f proof.txt' });
  commitPending(cwd, 'state: add');
  run(cwd, ['take', '--id', 'approve-adhoc-pull']);
  commitFile(cwd, 'proof.txt');
  run(cwd, ['return', 'approve-adhoc-pull']);
  commitPending(cwd, 'state: return');

  // proof.txt exists at HEAD, so an unguarded ad-hoc-worktree approve would
  // run goal-check, pass, and mark the item done without ever having proven
  // anything about the actual main checkout — the exact silent
  // false-verification this guard must close.
  const worktreePath = addAdHocWorktree(cwd, 'adhoc-pull-branch');
  try {
    assert.equal(stateView(cwd).work['approve-adhoc-pull'].status, 'proposed', 'sanity: the ad-hoc worktree really does see the item');
    const result = run(worktreePath, ['approve', 'approve-adhoc-pull']);
    assert.equal(result.status, 4, `expected a clean validation refusal, not a false-verified goal-check: ${result.stdout}${result.stderr}`);
    assert.equal(stateView(cwd).work['approve-adhoc-pull'].status, 'proposed', 'item stays proposed — goal-check never ran to close it');
  } finally {
    removeAdHocWorktree(cwd, worktreePath);
  }
});

test('approve from the main checkout is unaffected by the ad-hoc-worktree guard — runner and pull both still close to done, exit 0', () => {
  const cwdR = initGitCwdMain();
  run(cwdR, ['init']);
  makeRunnerProposedItem(cwdR, 'approve-adhoc-main-runner', { verify: 'test -f approve-adhoc-main-runner-produced.txt' });
  const resR = run(cwdR, ['approve', 'approve-adhoc-main-runner']);
  assert.equal(resR.status, 0, `runner approve from main must still succeed: ${resR.stderr}`);
  assert.equal(stateView(cwdR).work['approve-adhoc-main-runner'].status, 'done');

  const cwdP = initGitCwdMain();
  run(cwdP, ['init']);
  addOk(cwdP, 'approve-adhoc-main-pull', { verify: 'test -f proof.txt' });
  run(cwdP, ['take', '--id', 'approve-adhoc-main-pull']);
  commitFile(cwdP, 'proof.txt');
  run(cwdP, ['return', 'approve-adhoc-main-pull']);
  const resP = run(cwdP, ['approve', 'approve-adhoc-main-pull']);
  assert.equal(resP.status, 0, `pull approve from main must still succeed: ${resP.stderr}`);
  assert.equal(stateView(cwdP).work['approve-adhoc-main-pull'].status, 'done');
});

// --- work-graph-intelligence S5: `fgos graph` read verb -------------------

test('graph verb: reports connected components (independent parallel tracks) in a fgos.v1 envelope, and is a pure read (no event appended, exit 0)', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(addOk(cwd, 'a').status, 0);
  assert.equal(run(cwd, ['add', 'b', '--title', 'B', '--kind', 'task', '--risk', 'low', '--verify', 'true', '--deps', 'a']).status, 0);
  assert.equal(addOk(cwd, 'c').status, 0); // isolated -> its own track

  const before = eventLines(cwd).length;
  const result = run(cwd, ['graph']);
  assert.equal(result.status, 0);

  const data = envelopeData(result.stdout); // asserts the C1 envelope shape
  assert.equal(data.order_version, 1);
  assert.equal(data.componentCount, 2);
  assert.deepEqual(data.components.map((component) => component.items), [['a', 'b'], ['c']]);

  // S6: the umbrella completes P43's stated acceptance — critical path,
  // stale-blocked, and greedy top-k-unblock. S7 adds the architecture frame.
  assert.deepEqual(Object.keys(data), ['order_version', 'frame', 'componentCount', 'components', 'criticalPath', 'staleBlocked', 'topUnblock']);
  assert.deepEqual(data.criticalPath, { depth: 2, path: ['b', 'a'] });
  assert.deepEqual(data.staleBlocked, [{ id: 'b', status: 'todo', blockedBy: ['a'] }]);
  assert.deepEqual(data.topUnblock[0], { id: 'a', unblocks: 1, newlyUnblocks: 2 });
  assert.match(data.frame.revision, /^[0-9a-f]{64}$/);
  assert.equal(data.frame.nodeCount, 3);
  assert.deepEqual(data.frame.skipped, []);

  // Pure read: no event written by the verb.
  assert.equal(eventLines(cwd).length, before, 'graph must not append any event');
});

test('graph --what-if <id>: reports what completing that item unblocks, in a fgos.v1 envelope, pure read', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(addOk(cwd, 'a').status, 0);
  assert.equal(run(cwd, ['add', 'b', '--title', 'B', '--kind', 'task', '--risk', 'low', '--verify', 'true', '--deps', 'a']).status, 0);

  const before = eventLines(cwd).length;
  const result = run(cwd, ['graph', '--what-if', 'a']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.deepEqual(data, { id: 'a', exists: true, unblocksTransitive: 1, newlyReady: ['b'] });
  assert.equal(eventLines(cwd).length, before, 'what-if must not append any event');
});

test('graph --what-if on an unknown id: exists false, zero impact, still exit 0 + envelope', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  const result = run(cwd, ['graph', '--what-if', 'ghost']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout), { id: 'ghost', exists: false, unblocksTransitive: 0, newlyReady: [] });
});

// --- work-graph-intelligence S8: `fgos stale` advisory --------------------

test('stale verb: a freshly-claimed doing item is NOT stale; a valid envelope + pure read (no event, exit 0)', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(addOk(cwd, 'a').status, 0);
  assert.equal(run(cwd, ['move', 'a', '--to', 'doing', '--expect', 'todo']).status, 0);

  const before = eventLines(cwd).length;
  const result = run(cwd, ['stale']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.deepEqual(data.stale, [], 'a just-claimed item is well within any grace window');
  assert.equal(data.thresholds.agentMs, 15 * 60 * 1000);
  assert.equal(data.thresholds.humanMs, 24 * 60 * 60 * 1000);
  assert.equal(eventLines(cwd).length, before, 'stale must not append any event');
});

test('stale verb on a store with nothing in doing: empty advisory, exit 0', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(addOk(cwd, 'a').status, 0); // stays todo, never claimed
  const data = envelopeData(run(cwd, ['stale']).stdout);
  assert.deepEqual(data.stale, []);
});

// --- work-graph-intelligence S9: footprint field + `fgos conflicts` -------

test('add --footprint persists the list; omitting the flag leaves footprint absent', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(run(cwd, ['add', 'withfp', '--title', 'X', '--kind', 'task', '--risk', 'low', '--verify', 'true', '--footprint', 'src/a.mjs,src/b.mjs']).status, 0);
  assert.equal(addOk(cwd, 'nofp').status, 0);
  const view = stateView(cwd);
  assert.deepEqual(view.work.withfp.footprint, ['src/a.mjs', 'src/b.mjs']);
  assert.equal('footprint' in view.work.nofp, false, 'an omitted --footprint leaves the field absent, not []');
});

test('conflicts verb: two ready items sharing a footprint path are flagged with shared + suggestions, pure read', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(run(cwd, ['add', 'a', '--title', 'A', '--kind', 'task', '--risk', 'low', '--verify', 'true', '--footprint', 'src/x.mjs,src/y.mjs']).status, 0);
  assert.equal(run(cwd, ['add', 'b', '--title', 'B', '--kind', 'task', '--risk', 'low', '--verify', 'true', '--footprint', 'src/y.mjs,src/z.mjs']).status, 0);
  assert.equal(run(cwd, ['add', 'c', '--title', 'C', '--kind', 'task', '--risk', 'low', '--verify', 'true', '--footprint', 'src/w.mjs']).status, 0);

  const before = eventLines(cwd).length;
  const result = run(cwd, ['conflicts']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.deepEqual(data, [{ a: 'a', b: 'b', shared: ['src/y.mjs'], suggestions: ['sequence', 'hoist', 're-slice'] }]);
  assert.equal(eventLines(cwd).length, before, 'conflicts must not append any event');
});

test('conflicts verb on a store with no overlaps: empty list, exit 0', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(addOk(cwd, 'a').status, 0); // no footprint
  assert.deepEqual(envelopeData(run(cwd, ['conflicts']).stdout), []);
});

test('graph verb on an empty store: zero components, still a valid envelope, exit 0', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  const result = run(cwd, ['graph']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.componentCount, 0);
  assert.deepEqual(data.components, []);
});
