import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { addOutcome, addFriction, addDiscovery, moveWork, moveStage, addWork, editWork, StoreError } from '../../src/state/store.mjs';
import { createSession, endSession } from '../../src/runner/session.mjs';
import { DEFAULT_TTL_MS } from '../../src/runner/main-checkout-lock.mjs';

// The CLI under test, resolved by absolute path so it works regardless of
// the spawned process's cwd (which every test below points at a fresh
// mkdtemp dir — never the repo's own `.fgos/`).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');

// A fresh scratch dir with no `.fgos/` at all — never auto-inited. Only
// the handful of tests that specifically exercise pre-init/first-init
// behavior (the `init` verb's own tests, and tsk-4fu-2's new
// `requiresExistingStore` guard tests) should use this directly; every
// other test wants `tmpCwd()` below.
function rawTmpCwd() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-cli-'));
}

// tsk-4fu-2: `fgos init` is no longer implicit — every `requiresExistingStore`
// verb (command-registry.mjs) now refuses when `.fgos/` doesn't exist yet,
// instead of silently auto-vivifying it. This suite's ~340 call sites all
// want a ready-to-use store, not a test of that guard itself, so `tmpCwd()`
// bootstraps it once here rather than needing an explicit `run(cwd,
// ['init'])` at every site. `fgos init` is idempotent (store.mjs's own
// `initStore` docstring), so the handful of tests that still call `init`
// explicitly afterward are unaffected — a harmless no-op second call.
function tmpCwd() {
  const cwd = rawTmpCwd();
  assert.equal(run(cwd, ['init']).status, 0, 'tmpCwd(): "fgos init" failed to bootstrap .fgos/');
  return cwd;
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
  // --footprint stays omitted unless a caller actually passes one (tsk-598
  // own-file-set tests): matches the CLI's own present-or-absent optional
  // shape, so every existing call site (no extra.footprint) is unaffected.
  if (extra.footprint !== undefined) {
    flags.push('--footprint', extra.footprint);
  }
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

// Same shape as initGitCwd, but stops before the commit step — a real git
// repo with no resolvable HEAD, for the str86 gitHeadless notice tests.
function initHeadlessGitCwd() {
  const cwd = tmpCwd();
  execFileSync('git', ['init', '-q'], { cwd });
  return cwd;
}

// Same shape as initGitCwd, but `fgos` (and its `.fgos/`) lives one level
// BELOW the real git top-level — mirrors the STR60 dogfood-fixture layout
// (`repo/dogfood-fixture/.fgos/`, real top-level at `repo/`) that exposed
// both the path-prefix bug (git reports `.fgos/` status lines relative to
// the real top-level, e.g. "workspace/.fgos/...") and the scope bug
// (return's cleanliness check must not scan the whole real repo). Returns
// both the subdirectory `cwd` tests should run `fgos` from, and `topLevel`
// so a test can plant a dirty file OUTSIDE cwd's own subtree.
function initGitCwdInSubdir(subdirName = 'workspace') {
  const topLevel = tmpCwd();
  execFileSync('git', ['init', '-q'], { cwd: topLevel });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: topLevel });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: topLevel });
  fs.writeFileSync(path.join(topLevel, '.gitignore'), '.fgos/state.json\n');
  fs.writeFileSync(path.join(topLevel, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt', '.gitignore'], { cwd: topLevel });
  execFileSync('git', ['commit', '-q', '-m', 'seed'], { cwd: topLevel });
  const cwd = path.join(topLevel, subdirName);
  fs.mkdirSync(cwd, { recursive: true });
  return { cwd, topLevel };
}

// Commits the produced file AND whatever `.fgos/events.jsonl` deltas are
// pending (`git add -A`) — mirrors what a real "commit your work" step looks
// like against a repo where the truth log rides alongside the code.
function commitFile(cwd, filename, content = 'work\n') {
  fs.writeFileSync(path.join(cwd, filename), content);
  execFileSync('git', ['add', '-A'], { cwd });
  execFileSync('git', ['commit', '-q', '-m', `work: ${filename}`], { cwd });
}

// tsk-56t: a real `.fgos`-inited main checkout plus a linked worktree of it
// with no `.fgos/` at all — mirrors what `createWorktree` (worktree.mjs,
// ADR0020) actually produces. Returns both roots: `main` is where the real
// store lives, `wt` is the `.fgos/`-less cwd a worktree-resident session
// would actually run commands from.
function tmpLinkedWorktree() {
  const main = tmpCwd();
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: main });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: main });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: main });
  commitFile(main, 'seed.txt');
  const wt = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-cli-wt-'));
  fs.rmdirSync(wt);
  execFileSync('git', ['worktree', 'add', '-b', 'tsk-56t-dir-flag-test', wt], { cwd: main });
  fs.rmSync(path.join(wt, '.fgos'), { recursive: true, force: true });
  return { main, wt };
}

test('a state verb given --dir succeeds from a .fgos/-less worktree cwd, against the real store at --dir', () => {
  const { main, wt } = tmpLinkedWorktree();
  assert.ok(!fs.existsSync(path.join(wt, '.fgos')));
  const before = eventLines(main).length;
  const result = run(wt, ['submit', 'reached via --dir', '--dir', main]);
  assert.equal(result.status, 0, `submit --dir unexpectedly failed: ${result.stderr}`);
  assert.equal(eventLines(main).length, before + 1, '--dir must write into the given root, not the worktree cwd');
  assert.ok(!fs.existsSync(path.join(wt, '.fgos')), '--dir must never create a .fgos/ at the worktree cwd itself');
});

test('the same state verb with no --dir, from the same .fgos/-less worktree cwd, still refuses exactly as before (tsk-4fu-2 regression guard)', () => {
  const { wt } = tmpLinkedWorktree();
  const result = run(wt, ['submit', 'should never land']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /\.fgos\/ not found/);
  assert.ok(!fs.existsSync(path.join(wt, '.fgos')));
});

test('--dir with no value (a bare trailing flag) is a clean validation error, exit 4, not a crash', () => {
  const { wt } = tmpLinkedWorktree();
  const result = run(wt, ['submit', 'title', '--dir']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /--dir requires a non-empty path value/);
});

test('--dir pointed at a path with no .fgos/ at all gives the same clean refusal as omitting it, not a crash', () => {
  const { wt } = tmpLinkedWorktree();
  const garbage = rawTmpCwd();
  const result = run(wt, ['submit', 'title', '--dir', garbage]);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /\.fgos\/ not found/);
});

test('--dir pointed at the main checkout itself (from main\'s own cwd) is a no-op, identical to omitting it', () => {
  const main = tmpCwd();
  const before = eventLines(main).length;
  const result = run(main, ['submit', 'reached with redundant --dir', '--dir', main]);
  assert.equal(result.status, 0);
  assert.equal(eventLines(main).length, before + 1);
});

// tsk-1wn D1: `docs-index` used to derive its scan/write root from raw
// process.cwd(), independent of --dir -- a worktree-resident session
// running it as instructed (bare `fgos docs-index --dir <main>`) would
// silently scan and write the WORKTREE's own docs/ tree instead of the
// real shared one. These pin repoRoot to track --dir like every other
// verb.
function docsIndexManifestPath(root) {
  return path.join(root, 'docs', 'enduser-docs-index.json');
}

test('docs-index run from a .fgos/-less worktree cwd with --dir writes the shared manifest at the real root, not the worktree cwd (tsk-1wn D1)', () => {
  const { main, wt } = tmpLinkedWorktree();
  fs.mkdirSync(path.join(main, 'docs', 'how-to'), { recursive: true });
  fs.writeFileSync(path.join(main, 'docs', 'how-to', 'sample.md'), '# Sample Doc\n');

  const result = run(wt, ['docs-index', '--dir', main]);
  assert.equal(result.status, 0, `docs-index --dir unexpectedly failed: ${result.stderr}`);

  const data = envelopeData(result.stdout);
  assert.equal(data.count, 1);
  assert.equal(data.entries[0].docPath, 'docs/how-to/sample.md');
  assert.ok(fs.existsSync(docsIndexManifestPath(main)), 'manifest must land at the real main-checkout root');
  assert.ok(!fs.existsSync(docsIndexManifestPath(wt)), 'docs-index must never write into the worktree cwd\'s own docs/ tree');
});

test('docs-index re-run with no doc changes does not rewrite the manifest file (tsk-1wn D3 write-only-if-changed guard)', () => {
  const cwd = tmpCwd();
  fs.mkdirSync(path.join(cwd, 'docs', 'how-to'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'sample.md'), '# Sample Doc\n');

  assert.equal(run(cwd, ['docs-index']).status, 0);
  const mtimeAfterFirst = fs.statSync(docsIndexManifestPath(cwd)).mtimeMs;

  assert.equal(run(cwd, ['docs-index']).status, 0);
  const mtimeAfterSecond = fs.statSync(docsIndexManifestPath(cwd)).mtimeMs;

  assert.equal(mtimeAfterSecond, mtimeAfterFirst, 'unchanged doc content must skip the write, not touch the file');
});

test('docs-index re-run after a real doc change DOES rewrite the manifest (tsk-1wn D3 guard does not mask real updates)', () => {
  const cwd = tmpCwd();
  fs.mkdirSync(path.join(cwd, 'docs', 'how-to'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'sample.md'), '# Sample Doc\n');
  assert.equal(run(cwd, ['docs-index']).status, 0);
  assert.equal(JSON.parse(fs.readFileSync(docsIndexManifestPath(cwd), 'utf8')).length, 1);

  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'second.md'), '# Second Doc\n');
  assert.equal(run(cwd, ['docs-index']).status, 0);
  assert.equal(JSON.parse(fs.readFileSync(docsIndexManifestPath(cwd), 'utf8')).length, 2, 'a real doc addition must still update the manifest');
});

test('docs-index manifest entries come out in deterministic order regardless of directory-read order (tsk-1wn D3 sort)', () => {
  const cwd = tmpCwd();
  fs.mkdirSync(path.join(cwd, 'docs', 'how-to'), { recursive: true });
  // Written deliberately out of alphabetical order.
  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'b-doc.md'), '# B Doc\n');
  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'a-doc.md'), '# A Doc\n');

  const result = run(cwd, ['docs-index']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  const paths = data.entries.filter((e) => e.quadrant === 'how-to').map((e) => e.docPath);
  assert.deepEqual(paths, ['docs/how-to/a-doc.md', 'docs/how-to/b-doc.md']);
});

// tsk-56t D2: `list`/`ready`/etc. stay `requiresExistingStore: false` (a
// fresh non-worktree dir with no store is legitimately "not evaluated",
// not an error) — but a worktree-resident session that forgets `--dir`
// should not read that as "no open work" with zero signal. One
// object-shaped verb (`list`) and one array-shaped verb (`ready`, which
// returns a bare array via paginateVerbResult when unpaginated — the
// reason this is a stderr line, never a JSON field: JSON.stringify drops
// a named property set on an array).
test('list from a .fgos/-less linked worktree cwd, no --dir: exit 0, empty view, but a stderr warning names the real store elsewhere', () => {
  const { wt } = tmpLinkedWorktree();
  const result = run(wt, ['list']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout).work, {});
  assert.match(result.stderr, /warning: \.fgos\/ not found/);
  assert.match(result.stderr, /--dir <mainRoot>/);
});

test('ready (array-shaped, unpaginated) from the same linked worktree cwd: exit 0, empty array, same stderr warning', () => {
  const { wt } = tmpLinkedWorktree();
  const result = run(wt, ['ready']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout), []);
  assert.match(result.stderr, /warning: \.fgos\/ not found/);
});

test('list with --dir pointed at the real store from the same worktree cwd: no warning, real data', () => {
  const { main, wt } = tmpLinkedWorktree();
  run(main, ['add', 'seen-via-dir', '--title', 'Seen via --dir', '--kind', 'task', '--risk', 'low', '--verify', 'npm test']);
  const result = run(wt, ['list', '--dir', main]);
  assert.equal(result.status, 0);
  assert.ok(envelopeData(result.stdout).work['seen-via-dir']);
  assert.equal(result.stderr, '');
});

test('list on a fresh non-worktree dir with no store at all: exit 0, empty view, no warning (legitimately "not evaluated", not a worktree footgun)', () => {
  const cwd = rawTmpCwd();
  const result = run(cwd, ['list']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout).work, {});
  assert.equal(result.stderr, '');
});

// --- list open-only default + --all (tsk-5oa D1/D2) -----------------------

test('list by default excludes a done item, but keeps a todo item', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'open-item', { title: 'Open Item' });
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'finished-item', title: 'Finished Item', kind: 'task', status: 'done', deps: [], risk: 'low', refs: [], verify: 'npm test' });

  const work = envelopeData(run(cwd, ['list']).stdout).work;
  assert.ok(work['open-item']);
  assert.equal(work['finished-item'], undefined);
});

test('list --all restores the done item alongside the open one', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'open-item', { title: 'Open Item' });
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'finished-item', title: 'Finished Item', kind: 'task', status: 'done', deps: [], risk: 'low', refs: [], verify: 'npm test' });

  const work = envelopeData(run(cwd, ['list', '--all']).stdout).work;
  assert.ok(work['open-item']);
  assert.ok(work['finished-item']);
});

// wontfix-terminal-status-filter-consistency D2: the open-only default
// broadens past tsk-5oa's original done-only exclusion to also exclude
// wontfix -- a wontfix item is resolved (nothing further will ever happen
// to it) the same as a done one.
test('list by default excludes a wontfix item, but keeps a todo item', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'open-item', { title: 'Open Item' });
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'closed-item', title: 'Closed Item', kind: 'task', status: 'wontfix', deps: [], risk: 'low', refs: [], verify: 'npm test' });

  const work = envelopeData(run(cwd, ['list']).stdout).work;
  assert.ok(work['open-item']);
  assert.equal(work['closed-item'], undefined);
});

test('list --all restores the wontfix item alongside the open one', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'open-item', { title: 'Open Item' });
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'closed-item', title: 'Closed Item', kind: 'task', status: 'wontfix', deps: [], risk: 'low', refs: [], verify: 'npm test' });

  const work = envelopeData(run(cwd, ['list', '--all']).stdout).work;
  assert.ok(work['open-item']);
  assert.ok(work['closed-item']);
});

// tsk-48i D1: parkReason (parkReasonForStatus, workflow-stage-graphs.mjs)
// stamped at write time, mirroring statusCategory's own precedent -- lets
// a domain-agnostic consumer of `list --json` (e.g. herdr-plugin) tell a
// park state apart from active work without reading coding's own literal
// status strings.
test('list --json exposes parkReason on a blocked item, and omits it on a doing item', () => {
  const cwd = tmpCwd();
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'parked-item', title: 'Parked Item', kind: 'task', status: 'blocked', deps: [], risk: 'low', refs: [], verify: 'npm test' });
  addWork(dir, { id: 'active-item', title: 'Active Item', kind: 'task', status: 'doing', deps: [], risk: 'low', refs: [], verify: 'npm test' });

  const work = envelopeData(run(cwd, ['list', '--all', '--json']).stdout).work;
  assert.equal(work['parked-item'].parkReason, 'system-error');
  assert.equal(work['active-item'].parkReason, undefined);
});

test('list --id returns only that item, ignoring the open-only default and --all entirely (tsk-42m D2)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'open-item', { title: 'Open Item' });
  addOk(cwd, 'other-item', { title: 'Other Item' });

  const work = envelopeData(run(cwd, ['list', '--id', 'open-item']).stdout).work;
  assert.deepEqual(Object.keys(work), ['open-item']);
  assert.equal(work['open-item'].title, 'Open Item');
});

test('list --id on a done item returns it without needing --all (tsk-42m D2: --id bypasses the open-only default entirely)', () => {
  const cwd = tmpCwd();
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'finished-item', title: 'Finished Item', kind: 'task', status: 'done', deps: [], risk: 'low', refs: [], verify: 'npm test' });

  const work = envelopeData(run(cwd, ['list', '--id', 'finished-item']).stdout).work;
  assert.equal(work['finished-item'].status, 'done');
});

test('list --id on an unknown id is rejected as validation (not-found), exit 4 (tsk-42m D2)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'open-item');

  const result = run(cwd, ['list', '--id', 'no-such-item']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /list: work "no-such-item" not found/);
});

test('list default keeps an awaiting-human item visible (D2: excludes only the two terminal statuses done/wontfix, per wontfix-terminal-status-filter-consistency D2 -- never a broader ad-hoc closed/parked set like awaiting-human)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'parked-item', { title: 'Parked Item' });
  run(cwd, ['ask', 'parked-item', '--text', 'need a decision']);

  const work = envelopeData(run(cwd, ['list']).stdout).work;
  assert.equal(work['parked-item'].status, 'awaiting-human');
});

test('list default on a store with only done items returns an empty work map, not an error', () => {
  const cwd = tmpCwd();
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'finished-item', title: 'Finished Item', kind: 'task', status: 'done', deps: [], risk: 'low', refs: [], verify: 'npm test' });

  const result = run(cwd, ['list']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout).work, {});
});

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

test('init in a git repo with zero commits reports gitHeadless: true', () => {
  const cwd = initHeadlessGitCwd();
  const result = run(cwd, ['init']);
  assert.equal(result.status, 0);
  const initData = envelopeData(result.stdout);
  assert.equal(initData.gitHeadless, true);
});

test('init in a git repo with a commit does not report gitHeadless', () => {
  const cwd = initGitCwd();
  const result = run(cwd, ['init']);
  assert.equal(result.status, 0);
  const initData = envelopeData(result.stdout);
  assert.equal(initData.gitHeadless, undefined);
});

// tsk-4fu-2: requiresExistingStore guard (command-registry.mjs) — a
// state-write verb no longer silently auto-vivifies `.fgos/` via
// appendEventCore's own mkdirSync when it's missing; it refuses instead.
test('submit on a directory with no .fgos/ at all is refused, exit 4, writes nothing (no auto-vivify)', () => {
  const cwd = rawTmpCwd();
  assert.ok(!fs.existsSync(path.join(cwd, '.fgos')));
  const result = run(cwd, ['submit', 'should never land']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /\.fgos\/ not found/);
  assert.ok(!fs.existsSync(path.join(cwd, '.fgos')), 'the refused verb must not create .fgos/ as a side effect');
});

test('init inside a linked worktree is refused, exit 4 (ADR0020: worktrees never carry .fgos/)', () => {
  const { wt } = tmpLinkedWorktree();
  assert.ok(!fs.existsSync(path.join(wt, '.fgos')));
  const result = run(wt, ['init']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /linked worktree/);
  assert.ok(!fs.existsSync(path.join(wt, '.fgos')), 'the refused init must not create .fgos/ in the worktree');
});

test('init on a fresh directory that is not a linked worktree still succeeds, exit 0', () => {
  const cwd = rawTmpCwd();
  const result = run(cwd, ['init']);
  assert.equal(result.status, 0);
  assert.ok(fs.existsSync(path.join(cwd, '.fgos')));
});

test('session start inside a .fgos/-less linked worktree still succeeds (D10 symlink actor exempt from the requiresExistingStore guard)', () => {
  const { wt } = tmpLinkedWorktree();
  assert.ok(!fs.existsSync(path.join(wt, '.fgos')));
  const result = run(wt, ['session', 'start']);
  assert.equal(result.status, 0, `session start unexpectedly refused: ${result.stderr}`);
});

// `setup` appends a source line to every rc file it detects under $HOME, so
// this must run against a throwaway HOME: inheriting the real one made every
// `npm test` run permanently append a line naming a temp worktree that the
// test then deletes, leaving a dead `source` in the developer's own profile
// that errors on every interactive shell open. `run`'s `extraEnv` already
// merges over process.env, the same sandboxing test/setup/checks.test.mjs
// does when it spawns `setup`.
test('setup inside a .fgos/-less linked worktree still succeeds (setup never touches .fgos/, exempt from the guard)', () => {
  const { wt } = tmpLinkedWorktree();
  assert.ok(!fs.existsSync(path.join(wt, '.fgos')));
  const result = run(wt, ['setup'], { HOME: rawTmpCwd() });
  assert.equal(result.status, 0, `setup unexpectedly refused: ${result.stderr}`);
});

// tsk-5hi: setup now also runs every registered fix (`runFixes()`, the same
// call `doctor --fix` already makes) instead of leaving a person to
// separately discover and run `doctor --fix`. FGOS_CLAUDE_COMMAND points at
// a nonexistent binary — same seam test/setup/plugin-marketplace-doctor-
// check.test.mjs already proves for the identical fix function — so this
// never shells out to a real `claude` CLI.
test('setup runs every registered fix and reports them under "fixed", never touching a real claude binary', () => {
  const cwd = rawTmpCwd();
  const result = run(cwd, ['setup'], {
    HOME: rawTmpCwd(),
    FGOS_CLAUDE_COMMAND: '/nonexistent/fgos-test-claude-binary',
  });
  assert.equal(result.status, 0, `setup unexpectedly failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.ok(Array.isArray(data.fixed), 'setup result missing a "fixed" array');
  const byId = Object.fromEntries(data.fixed.map((entry) => [entry.id, entry]));
  assert.ok('gate-bypass-configured' in byId, 'setup did not run the gate-bypass-configured fix');
  assert.ok('claude-plugin-marketplace' in byId, 'setup did not run the claude-plugin-marketplace fix');
  assert.equal(byId['claude-plugin-marketplace'].changed, false);
  assert.match(byId['claude-plugin-marketplace'].message, /not found on PATH/);
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

// fsm-wontfix-terminal-status D1/D3: move --to wontfix is legal from each
// of its 3 entry statuses (blocked/todo/doing) through the existing
// generic move verb — no dedicated CLI verb needed.
for (const from of ['blocked', 'todo', 'doing']) {
  test(`move applies ${from} -> wontfix through the generic verb, exit 0`, () => {
    const cwd = tmpCwd();
    addOk(cwd, `wontfix-from-${from}`);
    if (from !== 'todo') run(cwd, ['move', `wontfix-from-${from}`, '--to', from]);
    const result = run(cwd, ['move', `wontfix-from-${from}`, '--to', 'wontfix', '--reason', 'superseded']);
    assert.equal(result.status, 0);
    assert.equal(stateView(cwd).work[`wontfix-from-${from}`].status, 'wontfix');
  });
}

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

// tsk-34y: same invariant as ADD_BAD_FLAG_CASES/SUBMIT_BAD_FLAG_CASES above,
// applied to `move` (D1, docs/history/test-suite-dry-consolidation/CONTEXT.md).
const MOVE_BAD_FLAG_CASES = [
  ['a bare --to (no value)', ['--to']],
  ['a valid --to plus an empty --expect ""', ['--to', 'doing', '--expect', '']],
];

for (const [label, badFlagArgs] of MOVE_BAD_FLAG_CASES) {
  test(`move with ${label} is rejected as validation, exit 4, no event written`, () => {
    const cwd = tmpCwd();
    addOk(cwd, 'move-bad-flag-item');
    const before = eventLines(cwd).length;
    const result = run(cwd, ['move', 'move-bad-flag-item', ...badFlagArgs]);
    assert.equal(result.status, 4);
    assert.equal(eventLines(cwd).length, before);
  });
}

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

// parent-flag-cli D1/D2: --parent on add/edit was a CLI gap — the field
// existed and was validated (work.mjs) and cycle-guarded (store.mjs) since
// record 0012, but no sanctioned CLI door could ever set it. `fgos-planning`
// SKILL.md step 5 assumed this door already existed.

test('add --parent sets lineage; omitting --parent leaves it unset', () => {
  const cwd = tmpCwd();
  assert.equal(addOk(cwd, 'parent-root').status, 0);

  const withParent = run(cwd, ['add', 'parent-child', '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--parent', 'parent-root']);
  assert.equal(withParent.status, 0);
  assert.equal(stateView(cwd).work['parent-child'].parent, 'parent-root');

  assert.equal(addOk(cwd, 'parent-none').status, 0);
  assert.equal(stateView(cwd).work['parent-none'].parent, undefined);
});

test('add --parent "" (bare, no value) is rejected as a valueless flag, same as add --discovered-from', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['add', 'parent-bad', '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--parent']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--parent requires a non-empty id/);
});

test('edit omitting --parent leaves it untouched; an explicit --parent sets it; --parent "" clears it', () => {
  const cwd = tmpCwd();
  assert.equal(addOk(cwd, 'parent-edit-root').status, 0);
  assert.equal(addOk(cwd, 'parent-edit-child').status, 0);
  assert.equal(stateView(cwd).work['parent-edit-child'].parent, undefined);

  const untouched = run(cwd, ['edit', 'parent-edit-child', '--risk', 'high']);
  assert.equal(untouched.status, 0);
  assert.equal(stateView(cwd).work['parent-edit-child'].parent, undefined);

  const setParent = run(cwd, ['edit', 'parent-edit-child', '--parent', 'parent-edit-root']);
  assert.equal(setParent.status, 0);
  assert.equal(stateView(cwd).work['parent-edit-child'].parent, 'parent-edit-root');

  const cleared = run(cwd, ['edit', 'parent-edit-child', '--parent', '']);
  assert.equal(cleared.status, 0);
  assert.equal(stateView(cwd).work['parent-edit-child'].parent, null);
});

test('edit --parent (bare, no value) is rejected as a valueless flag, distinct from --parent ""', () => {
  const cwd = tmpCwd();
  assert.equal(addOk(cwd, 'parent-edit-bad').status, 0);
  const result = run(cwd, ['edit', 'parent-edit-bad', '--parent']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--parent requires a value; use --parent "" to clear it/);
});

test('edit --parent closing a cycle is rejected at the CLI, same "graph cycle" message as the store-layer test', () => {
  const cwd = tmpCwd();
  assert.equal(addOk(cwd, 'parent-cycle-a').status, 0);
  const withParent = run(cwd, ['add', 'parent-cycle-b', '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--parent', 'parent-cycle-a']);
  assert.equal(withParent.status, 0);

  const result = run(cwd, ['edit', 'parent-cycle-a', '--parent', 'parent-cycle-b']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /would close a graph cycle/);
  assert.equal(stateView(cwd).work['parent-cycle-a'].parent, undefined, 'the rejected patch never landed');
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

// --- str7-str8-priority-intent D1/D3/D6: --priority/--intent on `edit` ---
//
// Both flags exist ONLY on `edit` (D3) — `add`/`submit` are untouched
// (see the add-without-tier/domain coverage above for the established shape
// of an omitted-optional-field add; there is no --priority/--intent
// equivalent there by design, so no test asserts a negative for `add` —
// the flags simply don't appear in its parser wiring at all).

test('edit --priority sets the item priority field to the given integer, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-priority');
  const result = run(cwd, ['edit', 'edit-priority', '--priority', '3']);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['edit-priority'].priority, 3);
});

test('edit --intent accepts a negative value (no sign constraint), exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-intent-neg');
  const result = run(cwd, ['edit', 'edit-intent-neg', '--intent', '-1']);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['edit-intent-neg'].intent, -1);
});

// tsk-34y: same invariant as ADD_BAD_FLAG_CASES/SUBMIT_BAD_FLAG_CASES/
// MOVE_BAD_FLAG_CASES above -- a bad, bare, or empty value on one `edit`
// flag is rejected as validation (exit 4), appends no event, and leaves the
// target field unset (never silently coerced). Includes the --docs-ref
// empty-string case that used to sit far below near the other --docs-ref
// tests (D1, docs/history/test-suite-dry-consolidation/CONTEXT.md).
const EDIT_BAD_FLAG_CASES = [
  ['a negative --priority (priority must be non-negative)', ['--priority', '-1'], 'priority'],
  ['a bare --priority (no following value)', ['--priority'], 'priority'],
  ['a non-numeric --intent', ['--intent', 'notanumber'], 'intent'],
  ['a bare --intent (no following value)', ['--intent'], 'intent'],
  ['an empty --docs-ref ""', ['--docs-ref', ''], 'docsRef'],
];

for (const [label, badFlagArgs, fieldName] of EDIT_BAD_FLAG_CASES) {
  test(`edit with ${label} is rejected as validation, exit 4, no event written, field left unset`, () => {
    const cwd = tmpCwd();
    addOk(cwd, 'edit-bad-flag-item');
    const before = eventLines(cwd).length;
    const result = run(cwd, ['edit', 'edit-bad-flag-item', ...badFlagArgs]);
    assert.equal(result.status, 4);
    assert.equal(eventLines(cwd).length, before);
    assert.equal(stateView(cwd).work['edit-bad-flag-item'][fieldName], undefined);
  });
}

test('add with no --priority/--intent leaves both fields absent (undefined), not null and not zero', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'add-no-priority-intent');
  const item = stateView(cwd).work['add-no-priority-intent'];
  assert.equal(item.priority, undefined);
  assert.equal(item.intent, undefined);
});

// --- work-item-priority-matrix D2/D3/D5: --urgent (add + edit),
// --impact/--effort (edit only) ---
//
// --urgent exists on BOTH `add` and `edit` (D2, human-entered at intake or
// later); --impact/--effort exist ONLY on `edit` (D3/D5, computed fields --
// no --impact/--effort equivalent on `add`'s parser wiring, same
// established shape --priority/--intent already use above).

test('add --urgent sets the item urgent field, exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['add', 'add-urgent', '--title', 'Add urgent', '--kind', 'task', '--risk', 'light', '--verify', 'npm test', '--urgent', 'high']);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['add-urgent'].urgent, 'high');
});

test('add with no --urgent leaves the field absent (undefined), not a default of medium', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'add-no-urgent');
  assert.equal(stateView(cwd).work['add-no-urgent'].urgent, undefined);
});

test('edit --urgent/--impact/--effort set the item fields to the given values, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-priority-matrix');
  const result = run(cwd, ['edit', 'edit-priority-matrix', '--urgent', 'critical', '--impact', '12.5', '--effort', '3']);
  assert.equal(result.status, 0);
  const item = stateView(cwd).work['edit-priority-matrix'];
  assert.equal(item.urgent, 'critical');
  assert.equal(item.impact, 12.5);
  assert.equal(item.effort, 3);
});

const EDIT_PRIORITY_MATRIX_BAD_FLAG_CASES = [
  ['an out-of-domain --urgent', ['--urgent', 'extreme'], 'urgent'],
  ['a negative --impact', ['--impact', '-1'], 'impact'],
  ['a bare --impact (no following value)', ['--impact'], 'impact'],
  ['a non-numeric --effort', ['--effort', 'notanumber'], 'effort'],
  ['a bare --effort (no following value)', ['--effort'], 'effort'],
];

for (const [label, badFlagArgs, fieldName] of EDIT_PRIORITY_MATRIX_BAD_FLAG_CASES) {
  test(`edit with ${label} is rejected as validation, exit 4, no event written, field left unset`, () => {
    const cwd = tmpCwd();
    addOk(cwd, 'edit-priority-matrix-bad-flag');
    const before = eventLines(cwd).length;
    const result = run(cwd, ['edit', 'edit-priority-matrix-bad-flag', ...badFlagArgs]);
    assert.equal(result.status, 4);
    assert.equal(eventLines(cwd).length, before);
    assert.equal(stateView(cwd).work['edit-priority-matrix-bad-flag'][fieldName], undefined);
  });
}

test('decision logs one event and appears in the view, exit 0', () => {
  const cwd = tmpCwd();
  run(cwd, ['init']);
  const before = eventLines(cwd).length;
  const result = run(cwd, ['decision', '--text', 'locked D5 naming', '--rationale', 'avoids a naming collision with an existing verb']);
  assert.equal(result.status, 0);
  assert.equal(eventLines(cwd).length, before + 1);
  assert.equal(stateView(cwd).decisions.length, 1);
  assert.equal(stateView(cwd).decisions[0].text, 'locked D5 naming');
  assert.equal(stateView(cwd).decisions[0].rationale, 'avoids a naming collision with an existing verb');
  // source defaults to 'session' when omitted (tsk-63c D3)
  assert.equal(stateView(cwd).decisions[0].source, 'session');
});

test('decision without --text is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  run(cwd, ['init']);
  const before = eventLines(cwd).length;
  const result = run(cwd, ['decision']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});

// tsk-63c D2: rationale is required on `decision`, mirroring bee's own
// throw-if-blank rule -- --text alone is no longer sufficient.
test('decision without --rationale is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  run(cwd, ['init']);
  const before = eventLines(cwd).length;
  const result = run(cwd, ['decision', '--text', 'locked D5 naming']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});

// tsk-63c D1/D3: alternatives/source are optional free text, and an explicit
// --source overrides the 'session' default.
test('decision with --alternatives, --source, and --id folds all fields, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'item-a');
  const before = eventLines(cwd).length;
  const result = run(cwd, [
    'decision',
    '--text', 'chose option B',
    '--rationale', 'option B has no external dependency',
    '--alternatives', 'option A was rejected -- needs a new package',
    '--source', 'human',
    '--id', 'item-a',
  ]);
  assert.equal(result.status, 0);
  assert.equal(eventLines(cwd).length, before + 1);
  const view = stateView(cwd);
  const logged = view.decisions.at(-1);
  assert.equal(logged.alternatives, 'option A was rejected -- needs a new package');
  assert.equal(logged.source, 'human');
  assert.equal(logged.id, 'item-a');
  assert.equal(view.decisionsById['item-a'].length, 1);
  assert.equal(view.decisionsById['item-a'][0].text, 'chose option B');
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
  toProposed(cwd, 'terminal-item');
  toDoneViaChain(cwd, 'terminal-item');
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
  // O1: the error path never prints a fgos.v1 envelope on stdout — diagnostics
  // go to stderr only, so a consumer can trust "stdout parses" as "success".
  assert.equal(result.stdout, '', 'a failing verb prints no stdout envelope');
  assert.throws(() => JSON.parse(result.stdout), 'stdout is not parseable JSON on the error path');
});

test('add with no flags at all is rejected as validation (missing --title), exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['add']);
  assert.equal(result.status, 4);
});

test('add omitting --id auto-generates a collision-free tsk-<hash> id from --title, exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['add', '--title', 'Auto id from title', '--kind', 'task', '--risk', 'low', '--verify', 'x']);
  assert.equal(result.status, 0);
  const generatedId = envelopeData(result.stdout).id;
  assert.match(generatedId, /^tsk-[0-9a-z]{3,8}$/, `generated id "${generatedId}" should match generateId's tsk-<hash> shape`);
  assert.equal(stateView(cwd).work[generatedId].title, 'Auto id from title');
});

test('add with --title but no --id is rejected the same as a fully bare call (missing --title still checked first)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['add', '--kind', 'task', '--risk', 'low', '--verify', 'x']);
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

// tsk-34y: these `add` flag-value rejections shared one invariant -- an
// otherwise-valid `add` invocation with one flag given a bad or bare value
// is rejected as validation (exit 4) and appends no event. Each row below
// used to be its own hand-written test (see D1, docs/history/
// test-suite-dry-consolidation/CONTEXT.md); merging keeps every edge case
// while dropping the repeated shape.
const ADD_BAD_FLAG_CASES = [
  ['a --tier outside the TIERS domain', ['--tier', 'extreme']],
  ['a bare --tier (no value)', ['--tier']],
  ['an unrecognized --domain value', ['--domain', 'bogus']],
  ['a bare --domain (no value)', ['--domain']],
  ['an empty --discovered-from ""', ['--discovered-from', '']],
  ['a bare --discovered-from (no value)', ['--discovered-from']],
  ['a --goal-tier outside its own domain', ['--goal-tier', 'bogus']],
  ['an empty --docs-ref ""', ['--docs-ref', '']],
  ['a bare --docs-ref (no value)', ['--docs-ref']],
];

for (const [label, badFlagArgs] of ADD_BAD_FLAG_CASES) {
  test(`add with ${label} is rejected as validation, exit 4, no event written`, () => {
    const cwd = tmpCwd();
    const before = eventLines(cwd).length;
    const result = run(cwd, ['add', 'bad-flag-item', '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x', ...badFlagArgs]);
    assert.equal(result.status, 4);
    assert.equal(eventLines(cwd).length, before);
  });
}

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

// --- str67-goal-directed-planning D1/D2: --goal-tier and --targets on `add` ---

test('add without --goal-tier/--targets leaves both fields unset, exit 0', () => {
  const cwd = tmpCwd();
  const result = addOk(cwd, 'no-goal-item');
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['no-goal-item'].goalTier, undefined);
  assert.equal(stateView(cwd).work['no-goal-item'].targets, undefined);
});

test('add --goal-tier mvp --targets a,b persists both fields, exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, [
    'add', 'goal-item',
    '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x',
    '--goal-tier', 'mvp', '--targets', 'a,b',
  ]);
  assert.equal(result.status, 0);
  const item = stateView(cwd).work['goal-item'];
  assert.equal(item.goalTier, 'mvp');
  assert.deepEqual(item.targets, ['a', 'b']);
});

test('add --targets "" parses to [] explicitly, exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['add', 'empty-targets-item', '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--targets', '']);
  assert.equal(result.status, 0);
  assert.deepEqual(stateView(cwd).work['empty-targets-item'].targets, []);
});

test('add with a bare --targets (no value) also parses to [], exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['add', 'bare-targets-item', '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--targets']);
  assert.equal(result.status, 0);
  assert.deepEqual(stateView(cwd).work['bare-targets-item'].targets, []);
});

// --- tsk-580: `edit --verify-from-children`/`--verify-from-targets` ---
// docs/history/tsk-580/CONTEXT.md (D1-D3) + plan.md's feasibility matrix:
// auto-generate the item's own `verify` as a resolved-status jq check
// against its direct children (`parent`-tree) or its `targets`
// (goalTier), instead of the two close-out how-to docs' hand-written jq.

// A real git worktree wrapping a real fgOS store at the main checkout --
// proves the `--dir` baked into a generated command resolves to the MAIN
// checkout even when `fgos edit` itself runs from inside a linked
// worktree, the exact scenario `resolveRepoRoot`'s `git rev-parse
// --show-toplevel` gets wrong (it would return the worktree's own path
// instead) -- see CONTEXT.md's corrected scout note.
function initGitCwdWithWorktree() {
  const cwd = initGitCwd();
  const worktreePath = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-wt-'));
  fs.rmSync(worktreePath, { recursive: true, force: true });
  execFileSync('git', ['worktree', 'add', '-b', `wt-${path.basename(worktreePath)}`, worktreePath], { cwd });
  return { cwd, worktreePath };
}

test('edit --verify-from-children generates a jq command listing all direct children ids with the resolved-set check and an absolute --dir, exit 0', () => {
  const { cwd, worktreePath } = initGitCwdWithWorktree();
  assert.equal(run(cwd, ['add', 'parent-x', '--title', 'Parent', '--kind', 'task', '--risk', 'low', '--verify', 'x']).status, 0);
  assert.equal(run(cwd, ['add', 'child-1', '--title', 'Child 1', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--parent', 'parent-x']).status, 0);
  assert.equal(run(cwd, ['add', 'child-2', '--title', 'Child 2', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--parent', 'parent-x']).status, 0);
  // child-1 already resolved (delivered, not yet cleanup/done) -- the
  // resolved-set default (D3) must still count it, unlike a strict-done check.
  assert.equal(run(cwd, ['move', 'child-1', '--to', 'doing']).status, 0);
  assert.equal(run(cwd, ['move', 'child-1', '--to', 'delivered']).status, 0);

  // Run the edit itself with process cwd INSIDE the linked worktree, while
  // --dir still points at the main checkout's real fgOS store -- the exact
  // split real usage has (implementation happens inside a worktree, but
  // .fgos/ only ever lives at the main checkout, ADR0020).
  const result = run(worktreePath, ['edit', 'parent-x', '--verify-from-children', '--dir', cwd]);
  assert.equal(result.status, 0);
  const verify = stateView(cwd).work['parent-x'].verify;
  assert.match(verify, /child-1/);
  assert.match(verify, /child-2/);
  assert.match(verify, /delivered/);
  assert.match(verify, /retrospective/);
  assert.match(verify, /cleanup/);
  assert.match(verify, /"done"/);
  assert.ok(verify.includes(`--dir ${cwd}`), `expected --dir "${cwd}" (main checkout, not the worktree) in: ${verify}`);
  assert.ok(!verify.includes(worktreePath), `verify must not bake in the worktree's own path: ${verify}`);
});

test('edit --verify-from-targets generates a jq command listing all target ids with the resolved-set check and an absolute --dir, exit 0', () => {
  const { cwd, worktreePath } = initGitCwdWithWorktree();
  assert.equal(run(cwd, ['add', 'target-1', '--title', 'Target 1', '--kind', 'task', '--risk', 'low', '--verify', 'x']).status, 0);
  assert.equal(run(cwd, ['add', 'mvp-x', '--title', 'MVP', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--goal-tier', 'mvp', '--targets', 'target-1']).status, 0);

  const result = run(worktreePath, ['edit', 'mvp-x', '--verify-from-targets', '--dir', cwd]);
  assert.equal(result.status, 0);
  const verify = stateView(cwd).work['mvp-x'].verify;
  assert.match(verify, /target-1/);
  assert.match(verify, /delivered/);
  assert.ok(verify.includes(`--dir ${cwd}`), `expected --dir "${cwd}" (main checkout, not the worktree) in: ${verify}`);
});

test('edit --verify-from-children with no children found throws a validation error instead of writing a vacuous verify, exit 4', () => {
  const cwd = tmpCwd();
  assert.equal(addOk(cwd, 'lonely-parent').status, 0);
  const before = stateView(cwd).work['lonely-parent'].verify;
  const result = run(cwd, ['edit', 'lonely-parent', '--verify-from-children']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /no children|no item has parent/i);
  assert.equal(stateView(cwd).work['lonely-parent'].verify, before, 'a failed guard must never write patch.verify');
});

test('edit --verify-from-targets with empty targets throws a validation error instead of writing a vacuous verify, exit 4', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['add', 'targetless-mvp', '--title', 'MVP', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--goal-tier', 'mvp']).status, 0);
  const before = stateView(cwd).work['targetless-mvp'].verify;
  const result = run(cwd, ['edit', 'targetless-mvp', '--verify-from-targets']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /no targets/i);
  assert.equal(stateView(cwd).work['targetless-mvp'].verify, before, 'a failed guard must never write patch.verify');
});

// --- str67-goal-directed-planning D3/D4/D6/D7: `fgos goal set|show` CLI verb ---

function addGoalItem(cwd, id, goalTier = 'mvp') {
  return run(cwd, ['add', id, '--title', `Title ${id}`, '--kind', 'task', '--risk', 'low', '--verify', 'npm test', '--goal-tier', goalTier]);
}

test('goal set on a real goal item succeeds, exit 0, and a following goal show reflects it', () => {
  const cwd = tmpCwd();
  addGoalItem(cwd, 'goal-target-1');
  const setResult = run(cwd, ['goal', 'set', 'goal-target-1']);
  assert.equal(setResult.status, 0);
  assert.equal(envelopeData(setResult.stdout).focus, 'goal-target-1');

  const showResult = run(cwd, ['goal', 'show']);
  assert.equal(showResult.status, 0);
  assert.equal(envelopeData(showResult.stdout).focus, 'goal-target-1');
});

test('goal set on a non-existent id is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  const before = eventLines(cwd).length;
  const result = run(cwd, ['goal', 'set', 'does-not-exist']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});

test('goal set on an existing item without goalTier is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'non-goal-item');
  const before = eventLines(cwd).length;
  const result = run(cwd, ['goal', 'set', 'non-goal-item']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});

test('goal show with no focus ever set returns focus: null, exit 0, not an error', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['goal', 'show']);
  assert.equal(result.status, 0);
  assert.equal(envelopeData(result.stdout).focus, null);
});

test('goal show after a successful set returns the focus id plus goal-scoped ranking data', () => {
  const cwd = tmpCwd();
  addGoalItem(cwd, 'goal-target-2');
  run(cwd, ['goal', 'set', 'goal-target-2']);
  const data = envelopeData(run(cwd, ['goal', 'show']).stdout);
  assert.equal(data.focus, 'goal-target-2');
  assert.ok('criticalPath' in data);
  assert.ok('topUnblock' in data);
});

test('goal focus is not auto-cleared when the focused item reaches status done', () => {
  const cwd = tmpCwd();
  addGoalItem(cwd, 'goal-target-done');
  run(cwd, ['goal', 'set', 'goal-target-done']);
  run(cwd, ['move', 'goal-target-done', '--to', 'doing']);
  run(cwd, ['move', 'goal-target-done', '--to', 'awaiting-approval']);
  const moveResult = toDoneViaChain(cwd, 'goal-target-done');
  assert.equal(moveResult.status, 0);
  assert.equal(stateView(cwd).work['goal-target-done'].status, 'done');

  const data = envelopeData(run(cwd, ['goal', 'show']).stdout);
  assert.equal(data.focus, 'goal-target-done');
});

// --- p50-workflow-induct D7: --docs-ref on `add` (ceremony decision-doc pointer) ---

test('add without --docs-ref leaves docsRef unset, exit 0', () => {
  const cwd = tmpCwd();
  const result = addOk(cwd, 'no-docs-ref-item');
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['no-docs-ref-item'].docsRef, undefined);
});

test('add --docs-ref persists docsRef and round-trips unchanged through fgos list, exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, [
    'add', 'docs-ref-item',
    '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x',
    '--docs-ref', 'docs/history/p50-workflow-induct/',
  ]);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['docs-ref-item'].docsRef, 'docs/history/p50-workflow-induct/');
  const listed = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(listed.work['docs-ref-item'].docsRef, 'docs/history/p50-workflow-induct/');
});

// --- edit --docs-ref: docsRef can now be attached/changed after creation,
// not only at `add` time -- closes the gap where an item created via
// `submit` (no --docs-ref of its own before this) had no way to ever gain
// this link. ---

test('edit --docs-ref sets docsRef on an item that had none, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-docs-ref-new');
  const result = run(cwd, ['edit', 'edit-docs-ref-new', '--docs-ref', 'docs/history/edit-docs-ref-new/']);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['edit-docs-ref-new'].docsRef, 'docs/history/edit-docs-ref-new/');
});

test('edit --docs-ref replaces an existing docsRef (latest-wins), exit 0', () => {
  const cwd = tmpCwd();
  run(cwd, ['add', 'edit-docs-ref-replace', '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--docs-ref', 'docs/history/old-feature/']);
  const result = run(cwd, ['edit', 'edit-docs-ref-replace', '--docs-ref', 'docs/history/new-feature/']);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['edit-docs-ref-replace'].docsRef, 'docs/history/new-feature/');
});

// --- edit --merge-after (tsk-2u0, docs/history/
//     tsk-3bn-merge-conductor-harness-v2/D4/D5) -----------------------------

test('edit --merge-after sets mergeAfter on an item that had none, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'merge-after-target');
  addOk(cwd, 'merge-after-item');
  const result = run(cwd, ['edit', 'merge-after-item', '--merge-after', 'merge-after-target']);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(stateView(cwd).work['merge-after-item'].mergeAfter, ['merge-after-target']);
});

test('edit --merge-after "" clears an existing mergeAfter, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'merge-after-clear-target');
  addOk(cwd, 'merge-after-clear-item');
  run(cwd, ['edit', 'merge-after-clear-item', '--merge-after', 'merge-after-clear-target']);
  const result = run(cwd, ['edit', 'merge-after-clear-item', '--merge-after', '']);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(stateView(cwd).work['merge-after-clear-item'].mergeAfter, []);
});

test('edit --merge-after rejects a target id that does not exist, exit 4, item unchanged', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'merge-after-ghost-item');
  const result = run(cwd, ['edit', 'merge-after-ghost-item', '--merge-after', 'no-such-item']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /not a known id/);
  assert.equal(stateView(cwd).work['merge-after-ghost-item'].mergeAfter, undefined);
});

test('edit --merge-after rejects an item listing itself, exit 4', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'merge-after-self-item');
  const result = run(cwd, ['edit', 'merge-after-self-item', '--merge-after', 'merge-after-self-item']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /own mergeAfter/);
});

test('edit --merge-after rejects a mergeAfter that would close a cycle mixed with deps, exit 4', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'merge-after-cycle-a');
  addOk(cwd, 'merge-after-cycle-b');
  run(cwd, ['edit', 'merge-after-cycle-b', '--deps', 'merge-after-cycle-a']);
  // a deps:[] currently; setting a.mergeAfter:[b] would close a -> b (waits-for) -> a (blocks).
  const result = run(cwd, ['edit', 'merge-after-cycle-a', '--merge-after', 'merge-after-cycle-b']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /cycle/);
  assert.equal(stateView(cwd).work['merge-after-cycle-a'].mergeAfter, undefined);
});

test('edit --merge-after does not require the deps field to have been touched (byte-identical to other list edits)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'merge-after-independent-target');
  addOk(cwd, 'merge-after-independent-item');
  const result = run(cwd, ['edit', 'merge-after-independent-item', '--merge-after', 'merge-after-independent-target']);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(stateView(cwd).work['merge-after-independent-item'].deps, []);
});

// --- edit --superseded-by / --duplicates (tsk-2ie, docs/history/
//     tsk-2ie-duplicate-superseded-guard/ D1-D3) ---------------------------

test('edit --superseded-by sets supersededBy on an item that had none, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'superseded-by-target');
  addOk(cwd, 'superseded-by-item');
  const result = run(cwd, ['edit', 'superseded-by-item', '--superseded-by', 'superseded-by-target']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(stateView(cwd).work['superseded-by-item'].supersededBy, 'superseded-by-target');
});

test('edit --superseded-by "" clears an existing supersededBy, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'superseded-by-clear-target');
  addOk(cwd, 'superseded-by-clear-item');
  run(cwd, ['edit', 'superseded-by-clear-item', '--superseded-by', 'superseded-by-clear-target']);
  const result = run(cwd, ['edit', 'superseded-by-clear-item', '--superseded-by', '']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(stateView(cwd).work['superseded-by-clear-item'].supersededBy, null);
});

test('edit --superseded-by rejects a target id that does not exist, exit 4, item unchanged', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'superseded-by-ghost-item');
  const result = run(cwd, ['edit', 'superseded-by-ghost-item', '--superseded-by', 'no-such-item']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /not a known id/);
  assert.equal(stateView(cwd).work['superseded-by-ghost-item'].supersededBy, undefined);
});

test('edit --superseded-by rejects an item listing itself, exit 4', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'superseded-by-self-item');
  const result = run(cwd, ['edit', 'superseded-by-self-item', '--superseded-by', 'superseded-by-self-item']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /own supersededBy/);
});

test('edit --superseded-by with no value is a validation error, exit 4', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'superseded-by-noval-item');
  const result = run(cwd, ['edit', 'superseded-by-noval-item', '--superseded-by']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /--superseded-by requires a value/);
});

test('edit --duplicates sets duplicates on an item that had none, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'duplicates-target');
  addOk(cwd, 'duplicates-item');
  const result = run(cwd, ['edit', 'duplicates-item', '--duplicates', 'duplicates-target']);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(stateView(cwd).work['duplicates-item'].duplicates, ['duplicates-target']);
});

test('edit --duplicates "" clears an existing duplicates, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'duplicates-clear-target');
  addOk(cwd, 'duplicates-clear-item');
  run(cwd, ['edit', 'duplicates-clear-item', '--duplicates', 'duplicates-clear-target']);
  const result = run(cwd, ['edit', 'duplicates-clear-item', '--duplicates', '']);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(stateView(cwd).work['duplicates-clear-item'].duplicates, []);
});

test('edit --duplicates rejects a target id that does not exist, exit 4, item unchanged', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'duplicates-ghost-item');
  const result = run(cwd, ['edit', 'duplicates-ghost-item', '--duplicates', 'no-such-item']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /not a known id/);
  assert.equal(stateView(cwd).work['duplicates-ghost-item'].duplicates, undefined);
});

test('edit --duplicates rejects an item listing itself, exit 4', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'duplicates-self-item');
  const result = run(cwd, ['edit', 'duplicates-self-item', '--duplicates', 'duplicates-self-item']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /own duplicates/);
});

// --- edit --description/--footprint: `add` already accepted both fields,
// but EDITABLE_FIELDS never listed them, so a description/footprint typo'd
// or left blank at add time -- or an item added before either field
// existed -- had no way to ever gain or correct one after creation. ---

test('edit --description sets description on an item that had none, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-description-new');
  assert.equal(stateView(cwd).work['edit-description-new'].description, undefined);
  const result = run(cwd, ['edit', 'edit-description-new', '--description', 'the full story']);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['edit-description-new'].description, 'the full story');
});

test('edit --footprint sets footprint on an item that had none, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-footprint-new');
  assert.equal(stateView(cwd).work['edit-footprint-new'].footprint, undefined);
  const result = run(cwd, ['edit', 'edit-footprint-new', '--footprint', 'src/a.mjs,src/b.mjs']);
  assert.equal(result.status, 0);
  assert.deepEqual(stateView(cwd).work['edit-footprint-new'].footprint, ['src/a.mjs', 'src/b.mjs']);
});

// --- D5 proposed: new edges + --reason on `move` (phase-2-routing-3) ---

function toProposed(cwd, id) {
  addOk(cwd, id);
  run(cwd, ['move', id, '--to', 'doing']);
  return run(cwd, ['move', id, '--to', 'awaiting-approval']);
}

// Walk awaiting-approval -> delivered -> retrospective -> cleanup -> done via
// the real CLI (work-item-status-delivered-retrospective-cleanup D1/D2/D10)
// — done's one remaining door in. Assumes `id` is already at status
// awaiting-approval (e.g. via toProposed). Returns the final move's result.
function toDoneViaChain(cwd, id) {
  run(cwd, ['move', id, '--to', 'delivered']);
  run(cwd, ['move', id, '--to', 'retrospective']);
  run(cwd, ['move', id, '--to', 'cleanup']);
  return run(cwd, ['move', id, '--to', 'done']);
}

test('move doing -> awaiting-approval applies via the real CLI, exit 0', () => {
  const cwd = tmpCwd();
  const result = toProposed(cwd, 'goal-checked');
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['goal-checked'].status, 'awaiting-approval');
});

test('move awaiting-approval -> delivered (approval) applies via the real CLI, exit 0', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'approved-item');
  const result = run(cwd, ['move', 'approved-item', '--to', 'delivered']);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['approved-item'].status, 'delivered');
});

test('move awaiting-approval -> todo (rejection) without --reason is refused as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'no-reason-item');
  const before = eventLines(cwd).length;
  const result = run(cwd, ['move', 'no-reason-item', '--to', 'todo']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
  assert.equal(stateView(cwd).work['no-reason-item'].status, 'awaiting-approval');
});

test('move awaiting-approval -> todo with an empty --reason "" is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'empty-reason-item');
  const before = eventLines(cwd).length;
  const result = run(cwd, ['move', 'empty-reason-item', '--to', 'todo', '--reason', '']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});

test('move awaiting-approval -> todo (rejection) with --reason carries the reason into the event payload, exit 0', () => {
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

test('move awaiting-approval -> doing is a forbidden edge (proposed is never a re-entry point for doing), exit 2, no event written', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'no-reentry-item');
  const before = eventLines(cwd).length;
  const result = run(cwd, ['move', 'no-reentry-item', '--to', 'doing']);
  assert.equal(result.status, 2);
  assert.equal(eventLines(cwd).length, before);
});

test('move awaiting-approval -> done rejects a CAS expected-status mismatch as conflict, exit 3, no event written', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'cas-proposed-item');
  const before = eventLines(cwd).length;
  const result = run(cwd, ['move', 'cas-proposed-item', '--to', 'done', '--expect', 'todo']);
  assert.equal(result.status, 3);
  assert.equal(eventLines(cwd).length, before);
  assert.equal(stateView(cwd).work['cas-proposed-item'].status, 'awaiting-approval');
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
  assert.equal(data.work['listed-proposed'].status, 'awaiting-approval');
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
  assert.equal(toDoneViaChain(cwd, 'dep-approved').status, 0);
  assert.equal(
    run(cwd, ['add', 'unblocked-item', '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--deps', 'dep-approved']).status,
    0,
  );

  const ready = envelopeData(run(cwd, ['ready']).stdout);
  assert.ok(ready.some((item) => item.id === 'unblocked-item'));
});

test('ready on a directory with no log at all returns an empty result, exit 0 (a read never initializes .fgos/)', () => {
  const cwd = rawTmpCwd();
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

// --- pagination (str46-io-contract D5/D35): `ready`/`triage`/`evolve`/`list`
// opt in to --cursor/--limit; omitting both keeps every one of these verbs'
// default output byte-identical to before this cell (asserted throughout
// this file's existing `ready`/`triage`/`evolve`/`list` tests above, none of
// which pass --cursor/--limit) — this section only exercises the opt-in
// paginated shape through the real CLI binary.

test('ready --limit paginates through the real CLI binary: envelope data carries items+nextCursor, and the cursor round-trips into the remaining items', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'page-a');
  addOk(cwd, 'page-b');
  addOk(cwd, 'page-c');

  const first = run(cwd, ['ready', '--limit', '1']);
  assert.equal(first.status, 0);
  const firstData = envelopeData(first.stdout);
  assert.deepEqual(Object.keys(firstData).sort(), ['items', 'nextCursor']);
  assert.equal(firstData.items.length, 1);
  assert.ok(typeof firstData.nextCursor === 'string' && firstData.nextCursor.length > 0);

  const second = run(cwd, ['ready', '--limit', '1', '--cursor', firstData.nextCursor]);
  assert.equal(second.status, 0);
  const secondData = envelopeData(second.stdout);
  assert.equal(secondData.items.length, 1);
  assert.notEqual(secondData.items[0].id, firstData.items[0].id);

  const third = run(cwd, ['ready', '--limit', '1', '--cursor', secondData.nextCursor]);
  const thirdData = envelopeData(third.stdout);
  assert.equal(thirdData.items.length, 1);
  assert.equal(thirdData.nextCursor, null);

  const allIds = [firstData.items[0].id, secondData.items[0].id, thirdData.items[0].id].sort();
  assert.deepEqual(allIds, ['page-a', 'page-b', 'page-c']);
});

test('ready with no --cursor/--limit still returns the bare frontier array, not the paginated shape (byte-identical default)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'unpaginated-item');
  const result = run(cwd, ['ready']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.ok(Array.isArray(data));
});

test('ready --cursor rejects a stale cursor (id no longer in the current frontier) as validation, exit 4, message states the restart remedy', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'only-item');
  const staleCursor = Buffer.from(JSON.stringify({ order: 'ready-v1', lastId: 'never-existed' }), 'utf8').toString('base64');
  const result = run(cwd, ['ready', '--cursor', staleCursor]);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /re-issue the call without --cursor/);
});

test('list --limit paginates only the work map: view.work becomes {items, nextCursor} while other view keys are untouched', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'list-page-a');
  addOk(cwd, 'list-page-b');
  const result = run(cwd, ['list', '--limit', '1']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.deepEqual(Object.keys(data.work).sort(), ['items', 'nextCursor']);
  assert.equal(Object.keys(data.work.items).length, 1);
  assert.ok(Array.isArray(data.decisions));
});

// --- `fgos check` (phase-3-compound-learning-3): predicted-vs-actual report ---
//
// `check` is a pure read (per D1 request-class, same as `ready`/`list`) over
// `listWork(dir).outcomes` — until compound-learn-enduser-docs slice 3, the
// CLI had no verb that WRITES a work.outcome event (only the runner did, per
// plan Approach S1; `compound --doc-type` is now the one CLI producer, see
// its own tests above), so these tests seed outcome data directly through
// store.mjs's addOutcome, the same single write door the runner uses, then
// exercise the real `check` binary.

test('check on an item with no recorded outcome returns a null predicted/actual entry for that id, exit 0, no throw', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'unchecked-item');
  const result = run(cwd, ['check', 'unchecked-item']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.deepEqual(data.outcomes, [{ id: 'unchecked-item', predicted: null, actual: null, docType: null, docPath: null }]);
});

test('check on a directory with no log at all returns an empty outcomes list, exit 0 (a read never initializes .fgos/)', () => {
  const cwd = rawTmpCwd();
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
    actual: { outcome: 'awaiting-approval', passed: true, attempts: 1, errorClass: null, aheadCount: 1, visits: 1 },
  });

  const result = run(cwd, ['check', 'checked-item']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.outcomes.length, 1);
  assert.equal(data.outcomes[0].id, 'checked-item');
  assert.equal(data.outcomes[0].predicted.tier, 'standard');
  assert.equal(data.outcomes[0].actual.outcome, 'awaiting-approval');
  assert.equal(data.outcomes[0].actual.passed, true);
});

test('check with no id given reports every item that has outcome data, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'item-a');
  addOk(cwd, 'item-b');
  const dir = path.join(cwd, '.fgos');
  addOutcome(dir, { id: 'item-a', predicted: { tier: 'light', deps: 0, priorVisits: 0 } });
  addOutcome(dir, { id: 'item-a', actual: { outcome: 'awaiting-approval', passed: true, attempts: 1, errorClass: null, aheadCount: 1, visits: 1 } });

  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.outcomes.length, 1);
  assert.equal(data.outcomes[0].id, 'item-a', 'item-b has no outcome data yet, so it is not listed');
});

// --- Diataxis docType surfacing in `check` (CONTEXT D5/D6) ------------------
//
// docType rides the SAME outcome/friction capture these tests above already
// exercise — no new collector, no new write door. `check` surfaces a tagged
// outcome via `collectOutcomeEntry`; a tagged friction rides through
// `collectFrictionData`'s existing `recent` spread with no code change
// beyond the store validation these tests prove separately.

test('check surfaces docType for a tagged outcome; an untagged outcome nulls it, output shape otherwise unchanged', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'tagged-outcome-item');
  addOk(cwd, 'untagged-outcome-item');
  const dir = path.join(cwd, '.fgos');
  addOutcome(dir, { id: 'tagged-outcome-item', docType: 'tutorial', predicted: { tier: 'standard', deps: 0, priorVisits: 0 } });
  addOutcome(dir, { id: 'untagged-outcome-item', predicted: { tier: 'standard', deps: 0, priorVisits: 0 } });

  const taggedResult = run(cwd, ['check', 'tagged-outcome-item']);
  assert.equal(taggedResult.status, 0);
  assert.deepEqual(envelopeData(taggedResult.stdout).outcomes[0], {
    id: 'tagged-outcome-item',
    predicted: { tier: 'standard', deps: 0, priorVisits: 0 },
    actual: null,
    docType: 'tutorial',
    docPath: null,
  });

  const untaggedResult = run(cwd, ['check', 'untagged-outcome-item']);
  assert.equal(untaggedResult.status, 0);
  assert.deepEqual(envelopeData(untaggedResult.stdout).outcomes[0], {
    id: 'untagged-outcome-item',
    predicted: { tier: 'standard', deps: 0, priorVisits: 0 },
    actual: null,
    docType: null,
    docPath: null,
  });
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

// --- fgos show: scoped single-task full detail ------------------------------
//
// Unlike `list --id`, which only scopes the `work` map and leaves every
// other per-item log global, `show` scopes ALL of them to the one id given.
// docs/history/fgos-show-scoped-detail/CONTEXT.md D1/D2.

test('show returns the work record plus every per-item log scoped to just that id, leaving a second item\'s data out entirely, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'show-detail-item', { title: 'Show Detail Item' });
  addOk(cwd, 'other-item', { title: 'Other Item' });
  const dir = path.join(cwd, '.fgos');

  addDiscovery(dir, { id: 'show-detail-item', clear: true, verify: 'run the thing' });
  addDiscovery(dir, { id: 'other-item', clear: false, question: 'unrelated question' });
  run(cwd, ['decision', '--id', 'show-detail-item', '--text', 'D1: scoped detail', '--rationale', 'test fixture']);
  run(cwd, ['decision', '--id', 'other-item', '--text', 'D1: unrelated decision', '--rationale', 'test fixture']);
  run(cwd, ['ask', 'show-detail-item', '--text', 'which shape?']);
  run(cwd, ['answer', 'show-detail-item', '--text', 'this one']);
  run(cwd, ['ask', 'other-item', '--text', 'unrelated ask']);
  addOutcome(dir, { id: 'show-detail-item', predicted: { tier: 'standard', deps: 0, priorVisits: 0 } });
  addOutcome(dir, { id: 'other-item', predicted: { tier: 'light', deps: 0, priorVisits: 0 } });
  addFriction(dir, { id: 'show-detail-item', disposition: 'parked', errorClass: 'verify-miss', layer: 'verification', attempts: 1, detail: 'goal-check failed' });
  addFriction(dir, { id: 'other-item', disposition: 'halted', errorClass: 'worker-timeout', layer: 'environment', attempts: 1, detail: 'timed out' });

  const result = run(cwd, ['show', 'show-detail-item']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);

  assert.equal(data.work.id, 'show-detail-item');
  assert.equal(data.work.title, 'Show Detail Item');

  assert.equal(data.discovery.length, 1);
  assert.equal(data.discovery[0].clear, true);

  assert.equal(data.decisions.length, 1);
  assert.equal(data.decisions[0].text, 'D1: scoped detail');

  assert.equal(data.gates.ask, 'which shape?');
  assert.equal(data.gates.answer, 'this one');

  assert.equal(data.outcome.id, 'show-detail-item');
  assert.equal(data.outcome.predicted.tier, 'standard');

  assert.equal(data.friction.count, 1);
  assert.equal(data.friction.recent[0].errorClass, 'verify-miss');

  // Nothing from 'other-item' leaked into 'show-detail-item's scoped view.
  assert.ok(!JSON.stringify(data).includes('unrelated'));
  assert.ok(!JSON.stringify(data).includes('worker-timeout'));
});

test('show on a fresh item with no logs yet returns every key present but empty/null, not omitted, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'bare-item');

  const result = run(cwd, ['show', 'bare-item']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);

  assert.equal(data.work.id, 'bare-item');
  assert.deepEqual(data.discovery, []);
  assert.deepEqual(data.decisions, []);
  assert.equal(data.gates, null);
  assert.deepEqual(data.outcome, { id: 'bare-item', predicted: null, actual: null, docType: null, docPath: null });
  assert.equal(data.friction, null);
  assert.equal(data.settlement, null);
  assert.equal(data.learning, null);
});

test('show on an unknown id is rejected as validation (not-found), exit 4, same shape as list --id\'s miss', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'some-item');

  const result = run(cwd, ['show', 'no-such-item']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /show: work "no-such-item" not found/);
});

test('show with no id at all is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['show']);
  assert.equal(result.status, 4);
});

test('show --json is a byte-identical no-op: output matches show without --json exactly, except generated_at', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'json-noop-item');

  const withoutJson = run(cwd, ['show', 'json-noop-item']).stdout;
  const withJson = run(cwd, ['show', 'json-noop-item', '--json']).stdout;

  const stripGeneratedAt = (s) => s.replace(/"generated_at": "[^"]*"/, '"generated_at": ""');
  assert.equal(stripGeneratedAt(withoutJson), stripGeneratedAt(withJson));
});

test('show never mutates state: no event is appended', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'read-only-item');

  const before = eventLines(cwd);
  const result = run(cwd, ['show', 'read-only-item']);
  assert.equal(result.status, 0);
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

test('triage --all appends done items after the ranked open rows, each with blocks:0 (tsk-5oa D1)', () => {
  const cwd = tmpCwd();
  const dir = path.join(cwd, '.fgos');
  addOk(cwd, 'base');
  addWork(dir, { id: 'done-item', title: 'Done Item', kind: 'task', status: 'done', deps: ['base'], risk: 'low', refs: [], verify: 'npm test' });

  const withoutAll = envelopeData(run(cwd, ['triage']).stdout);
  const withAll = envelopeData(run(cwd, ['triage', '--all']).stdout);
  assert.ok(!withoutAll.some((r) => r.id === 'done-item'));
  assert.deepEqual(withAll.slice(0, withoutAll.length), withoutAll);
  const doneRow = withAll.find((r) => r.id === 'done-item');
  assert.ok(doneRow);
  assert.equal(doneRow.blocks, 0);
  assert.equal(doneRow.componentSize, 0);
  assert.equal(doneRow.isIsolated, true);
});

test('triage never mutates state: no event is appended', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'base');

  const before = eventLines(cwd);
  const result = run(cwd, ['triage']);
  assert.equal(result.status, 0);
  assert.deepEqual(eventLines(cwd), before);
});

test('triage rows carry stage, goalTier, and component membership; declared goals sort ahead of ungrouped work', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'plain');
  run(cwd, ['add', 'goal-item', '--title', 'Goal Item', '--kind', 'task', '--risk', 'low', '--verify', 'npm test', '--goal-tier', 'mvp']);

  const result = run(cwd, ['triage']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  const plain = data.find((r) => r.id === 'plain');
  const goal = data.find((r) => r.id === 'goal-item');
  assert.equal(plain.stage, 'executing');
  assert.equal(plain.goalTier, null);
  assert.equal(plain.isIsolated, true);
  assert.equal(plain.componentSize, 1);
  assert.equal(goal.goalTier, 'mvp');
  assert.deepEqual(data.map((r) => r.id), ['goal-item', 'plain']);
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

test('check surfaces docType for a tagged friction via the existing recent spread — no collectFrictionData change needed', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'fric-doctype-item');
  const dir = path.join(cwd, '.fgos');
  addFriction(dir, { id: 'fric-doctype-item', docType: 'explanation', disposition: 'parked', errorClass: 'verify-miss', layer: 'verification', attempts: 1, detail: 'x' });

  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  const { friction } = envelopeData(result.stdout);
  const record = friction.recent.find((r) => r.id === 'fric-doctype-item');
  assert.equal(record.docType, 'explanation');
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

// tsk-38t-4 (decision record 0027's audit §2): bin/fgos.mjs's FINAL_STATUSES
// used to be a locally-declared Set here, separate from and inconsistent
// with entropy.mjs's own local copy. It now imports the single shared
// export from entropy.mjs instead — this test locks that a tail-segment
// status (delivered, reached via the mechanical move chain, not the normal
// doing->awaiting-approval addOutcome stamp) still nags, unchanged by the
// refactor from a local Set to a shared import.
test('check still nags an item sitting at "delivered" (a tail-segment status) without its actual half, after the FINAL_STATUSES local-Set-to-shared-import refactor', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'nag-item-delivered');
  toProposed(cwd, 'nag-item-delivered');
  run(cwd, ['move', 'nag-item-delivered', '--to', 'delivered']);

  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  const { missingOutcomeNag } = envelopeData(result.stdout);
  assert.deepEqual(missingOutcomeNag, { count: 1, ids: ['nag-item-delivered'] });
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

test('ask/answer round-trip on a todo item: park removes from ready and surfaces the ask via list, answer resumes to todo and reopens ready', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'gated-item');

  const askResult = run(cwd, ['ask', 'gated-item', '--text', 'OAuth or password?']);
  assert.equal(askResult.status, 0);
  assert.deepEqual(envelopeData(askResult.stdout), { id: 'gated-item', from: 'todo', to: 'awaiting-human', seq: 2 });
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
  assert.deepEqual(envelopeData(answerResult.stdout), { id: 'gated-item', from: 'awaiting-human', to: 'todo', seq: 3 });
  assert.equal(stateView(cwd).work['gated-item'].status, 'todo');

  const listedAfterAnswer = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(listedAfterAnswer.gates['gated-item'].ask, 'OAuth or password?');
  assert.equal(listedAfterAnswer.gates['gated-item'].answer, 'OAuth');

  const readyAfterAnswer = envelopeData(run(cwd, ['ready']).stdout);
  assert.ok(readyAfterAnswer.some((i) => i.id === 'gated-item'));
});

// tsk-19zm D2: ask's checkpoint distillate and answer's authoritative word
// live in SEPARATE gates[id] fields -- neither overwrites the other, unlike
// rationale/alternatives/source before this item (answer-only fields).
test('ask --rationale and answer --rationale both persist on gates[id], neither overwriting the other', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'checkpoint-item');

  run(cwd, [
    'ask', 'checkpoint-item', '--text', 'OAuth or password?',
    '--rationale', 'leaning OAuth: fewer support tickets historically',
    '--alternatives', 'password rejected: extra reset-flow maintenance',
    '--source', 'session',
  ]);
  const afterAsk = envelopeData(run(cwd, ['list']).stdout).gates['checkpoint-item'];
  assert.equal(afterAsk.askRationale, 'leaning OAuth: fewer support tickets historically');
  assert.equal(afterAsk.askAlternatives, 'password rejected: extra reset-flow maintenance');
  assert.equal(afterAsk.askSource, 'session');
  assert.equal(afterAsk.rationale, undefined);

  run(cwd, [
    'answer', 'checkpoint-item', '--text', 'OAuth',
    '--rationale', 'confirmed OAuth per compliance requirement',
    '--alternatives', 'password: rejected, same reasons as checkpoint',
    '--source', 'human',
  ]);
  const afterAnswer = envelopeData(run(cwd, ['list']).stdout).gates['checkpoint-item'];
  // Answer's fields land in the answer-only trio, still authoritative.
  assert.equal(afterAnswer.rationale, 'confirmed OAuth per compliance requirement');
  assert.equal(afterAnswer.alternatives, 'password: rejected, same reasons as checkpoint');
  assert.equal(afterAnswer.source, 'human');
  // The agent's original checkpoint from `ask` is still there, untouched.
  assert.equal(afterAnswer.askRationale, 'leaning OAuth: fewer support tickets historically');
  assert.equal(afterAnswer.askAlternatives, 'password rejected: extra reset-flow maintenance');
  assert.equal(afterAnswer.askSource, 'session');
});

// claim-lock §5.1 (intentional contract change from the test above): asking
// a "doing" item now resumes it to "doing", not a claimless "todo" — the
// exact bug the design fixes ("fgos ask/answer mid-claim silently dropped
// the claim"). The item never re-enters the ready set (still `doing`, not
// `todo`), unlike the todo-item round-trip above.
test('ask/answer round-trip on a doing item: answer resumes to doing, preserving the held claim (claim-lock §5.1)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'gated-doing-item');
  assert.equal(run(cwd, ['move', 'gated-doing-item', '--to', 'doing']).status, 0);

  const askResult = run(cwd, ['ask', 'gated-doing-item', '--text', 'OAuth or password?']);
  assert.equal(askResult.status, 0);
  assert.deepEqual(envelopeData(askResult.stdout), { id: 'gated-doing-item', from: 'doing', to: 'awaiting-human', seq: 3 });
  assert.equal(stateView(cwd).work['gated-doing-item'].status, 'awaiting-human');

  const readyWhileAwaiting = envelopeData(run(cwd, ['ready']).stdout);
  assert.ok(!readyWhileAwaiting.some((i) => i.id === 'gated-doing-item'));

  const answerResult = run(cwd, ['answer', 'gated-doing-item', '--text', 'OAuth']);
  assert.equal(answerResult.status, 0);
  assert.deepEqual(envelopeData(answerResult.stdout), { id: 'gated-doing-item', from: 'awaiting-human', to: 'doing', seq: 4 });
  assert.equal(stateView(cwd).work['gated-doing-item'].status, 'doing');

  // Never resurfaces as ready — it resumed to "doing", not "todo".
  const readyAfterAnswer = envelopeData(run(cwd, ['ready']).stdout);
  assert.ok(!readyAfterAnswer.some((i) => i.id === 'gated-doing-item'));
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

// --- `fgos doc-sources <docPath>` (Slice ① gộp-sống, CONTEXT.md D13/D17):
// read-only gather of EVERY compound-learn capture linked to a docPath, not
// just the first (findSourceCaptureIds's plural gather, closing the D13
// no-loss gap `findSourceCaptureId`'s first-match leaves).

test('doc-sources returns every capture linked to a docPath (multiplicity)', () => {
  const cwd = tmpCwd();
  const dir = path.join(cwd, '.fgos');
  toProposed(cwd, 'doc-sources-a');
  addOutcome(dir, { id: 'doc-sources-a', docType: 'how-to', docPath: 'docs/how-to/shared.md' });
  toProposed(cwd, 'doc-sources-b');
  addOutcome(dir, { id: 'doc-sources-b', docType: 'how-to', docPath: 'docs/how-to/shared.md' });
  // A third item linked to a DIFFERENT docPath must never leak into the result.
  toProposed(cwd, 'doc-sources-other');
  addOutcome(dir, { id: 'doc-sources-other', docType: 'how-to', docPath: 'docs/how-to/other.md' });

  const result = run(cwd, ['doc-sources', 'docs/how-to/shared.md']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.docPath, 'docs/how-to/shared.md');
  assert.equal(data.count, 2);
  assert.deepEqual(
    data.captures.map((c) => c.id).sort(),
    ['doc-sources-a', 'doc-sources-b'],
  );
  for (const capture of data.captures) {
    assert.equal(capture.docPath, 'docs/how-to/shared.md');
    assert.equal(capture.docType, 'how-to');
    assert.ok('predicted' in capture && 'actual' in capture, 'capture must carry the same check-content shape as `fgos check`');
  }
});

test('doc-sources on a docPath with zero linked captures is SUCCESS (exit 0), reporting none — not an error', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['doc-sources', 'docs/how-to/never-linked.md']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.equal(data.docPath, 'docs/how-to/never-linked.md');
  assert.equal(data.count, 0);
  assert.deepEqual(data.captures, []);
});

test('doc-sources never mutates state: events.jsonl and state.json are byte-identical before/after', () => {
  const cwd = tmpCwd();
  const dir = path.join(cwd, '.fgos');
  toProposed(cwd, 'doc-sources-readonly');
  addOutcome(dir, { id: 'doc-sources-readonly', docType: 'how-to', docPath: 'docs/how-to/readonly.md' });

  const logBefore = fs.readFileSync(logPath(cwd), 'utf8');
  const viewBefore = fs.readFileSync(viewPath(cwd), 'utf8');

  const result = run(cwd, ['doc-sources', 'docs/how-to/readonly.md']);
  assert.equal(result.status, 0);

  assert.equal(fs.readFileSync(logPath(cwd), 'utf8'), logBefore, 'events.jsonl must be untouched by doc-sources');
  assert.equal(fs.readFileSync(viewPath(cwd), 'utf8'), viewBefore, 'state.json must be untouched by doc-sources');
});

test('doc-sources requires a docPath argument (validation, exit 4)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['doc-sources']);
  assert.equal(result.status, 4);
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

test('two submits of the same text get different ids, both persist, no duplicate-id error (collision retry)', () => {
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

test('submit without a mode flag records mode:"sync"; --async records mode:"async" — both visible via list', () => {
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

test('submit with --unattended is treated the same as --async: mode:"async"', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Draft the onboarding walkthrough', '--unattended']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].mode, 'async');
});

test('submit of text matching no keyword falls back to tier:"standard" and persists, exit 0', () => {
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

// tsk-5q5-1: a clear verdict carrying a real `verify` now triggers ONE more
// call to the same configured executor — judgeVerifySemanticCorrectness's
// own second-pass prompt (judge-executor.mjs). The prompt text is
// substituted into argv (resolveExecutorCommand), so this script sniffs
// argv[2] for the marker unique to that second prompt and answers it with
// agreement, separately from the first-pass verdict — one script covers
// both calls, mirroring test/intake/discovery.test.mjs's
// writeVerdictWithVerifyCheckExecutor.
function writeRunnerConfig(cwd, verdict) {
  const scriptPath = path.join(cwd, 'verdict-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
    const prompt = process.argv[2] ?? '';
    if (prompt.includes('Kiểm tra độc lập một lệnh verify')) {
      process.stdout.write(${JSON.stringify(JSON.stringify({ agrees: true }))});
    } else {
      process.stdout.write(${JSON.stringify(JSON.stringify(verdict))});
    }
    process.exit(0);
    `,
  );
  const cfg = {
    executor: { command: process.execPath, args: [scriptPath, '{prompt}'] },
    models: { light: 'haiku', standard: 'sonnet', heavy: 'opus' },
    timeoutMs: 5000,
  };
  fs.writeFileSync(path.join(cwd, '.fgos-runner.json'), JSON.stringify(cfg));
}

test("submit tags the new item with stage:'clarify', visible via list", () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Investigate the sluggish overview page']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].stage, 'clarify');
});

test('add leaves stage unset — the item reads as executing via the lazy default', () => {
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

// tsk-34y: these `submit` flag-value rejections shared one invariant -- an
// otherwise-valid `submit` invocation with one flag given a bad, bare, or
// empty value is rejected as validation (exit 4) and appends no event.
// Each row below used to be its own hand-written test (see D1, docs/
// history/test-suite-dry-consolidation/CONTEXT.md); merging keeps every
// edge case while dropping the repeated shape.
const SUBMIT_BAD_FLAG_CASES = [
  ['an unrecognized --domain value', ['--domain', 'bogus']],
  ['a bare --domain (no value)', ['--domain']],
  ['an empty --discovered-from ""', ['--discovered-from', '']],
  ['a bare --discovered-from (no value)', ['--discovered-from']],
  ['a nonexistent --deps id', ['--deps', 'ghost-dep']],
  ['a bare --tier (no value)', ['--tier']],
  ['an empty --docs-ref ""', ['--docs-ref', '']],
  ['an empty --kind ""', ['--kind', '']],
];

for (const [label, badFlagArgs] of SUBMIT_BAD_FLAG_CASES) {
  test(`submit with ${label} is rejected as validation, exit 4, no event written`, () => {
    const cwd = tmpCwd();
    const before = eventLines(cwd).length;
    const result = run(cwd, ['submit', 'Try a bad flag value', ...badFlagArgs]);
    assert.equal(result.status, 4);
    assert.equal(eventLines(cwd).length, before);
  });
}

test('submit --domain <bad> produces exactly one stderr line (the validation error), no stray "folding to coding" warning — parity with add (review-20260717-self-improve-base-workflow f3)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Try a bad domain again', '--domain', 'bogus']);
  assert.equal(result.status, 4);
  assert.doesNotMatch(result.stderr, /folding to "coding"/);
  const stderrLines = result.stderr.split('\n').filter(Boolean);
  assert.equal(stderrLines.length, 1, `expected exactly one stderr line, got: ${JSON.stringify(stderrLines)}`);
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

// --- str83-fgos-slash-commands D4: --deps on `submit` (mirrors add's ---
// already-existing --deps handling, same parseListFlag helper, same
// addWork write-gate, cycle-checked)

test('submit without --deps stays byte-identical to today: deps: [], exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Investigate the sluggish overview page']);
  assert.equal(result.status, 0);
  const item = JSON.parse(result.stdout).data;
  assert.deepEqual(item.deps, []);
  const id = item.id;
  assert.deepEqual(envelopeData(run(cwd, ['list']).stdout).work[id].deps, []);
});

test('submit --deps <id1,id2> persists those deps, validated through the same write-gate add uses, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'dep-one');
  addOk(cwd, 'dep-two');
  const result = run(cwd, ['submit', 'Follow up on two prior items', '--deps', 'dep-one,dep-two']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  const item = envelopeData(run(cwd, ['list']).stdout).work[id];
  assert.deepEqual(item.deps, ['dep-one', 'dep-two']);
});

// --- str51-llm-assist-classify D2/D5: --tier/--kind/--risk overrides on ---
// `submit` (each independently overrides classify(text)'s per-field output;
// an omitted flag stays byte-identical to classify()'s own derived value)

test('submit with no --tier/--kind/--risk flags is byte-identical to pre-feature behavior (regression proof)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Investigate the sluggish overview page']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  const item = envelopeData(run(cwd, ['list']).stdout).work[id];
  assert.equal(item.tier, 'standard');
  assert.equal(item.kind, 'task');
  assert.equal(item.risk, 'standard');
});

test('submit --tier heavy --kind bug --risk heavy overrides all three fields regardless of classify(text)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Investigate the sluggish overview page', '--tier', 'heavy', '--kind', 'bug', '--risk', 'heavy']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  const item = envelopeData(run(cwd, ['list']).stdout).work[id];
  assert.equal(item.tier, 'heavy');
  assert.equal(item.kind, 'bug');
  assert.equal(item.risk, 'heavy');
});

test('submit with only --kind overrides just that field; tier and risk still come from classify(text)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Investigate the sluggish overview page', '--kind', 'bug']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  const item = envelopeData(run(cwd, ['list']).stdout).work[id];
  assert.equal(item.kind, 'bug');
  assert.equal(item.tier, 'standard');
  assert.equal(item.risk, 'standard');
});

test('submit --tier override alone does not change risk -- risk still mirrors classify()\'s own tier, not the override', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'Investigate the sluggish overview page', '--tier', 'heavy']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  const item = envelopeData(run(cwd, ['list']).stdout).work[id];
  assert.equal(item.tier, 'heavy');
  assert.equal(item.risk, 'standard');
});

test('submit without --docs-ref leaves docsRef unset, exit 0', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'A task with no docs link']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].docsRef, undefined);
});

test('submit --docs-ref persists docsRef, exit 0 -- an item created through the public door can now carry this link from the start', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['submit', 'A task with a docs link', '--docs-ref', 'docs/history/some-feature/']);
  assert.equal(result.status, 0);
  const id = JSON.parse(result.stdout).data.id;
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].docsRef, 'docs/history/some-feature/');
});

// RETARGET (stage-decompose D2, cell 3): `discover` on a stage-`clarify`
// item still only runs `resolveDiscovery` (one hop) — a clear verdict now
// lands it on stage `decompose`, not `executing` directly, since chia-việc
// is the next stop before executing. This assertion changed its expected
// destination from `executing` to `decompose` for exactly that reason (per
// D2, an intentional contract change, not a test nerf).
test('discover on a clear verdict moves the submitted item to stage decompose with the model-proposed verify', () => {
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

// tsk-2b0 D1 (hard split, no fallback): `discover` and `decompose` are now
// two separate verbs, each bound to exactly one stage. The old combined
// "call discover twice" scenario is split below into its own `decompose`
// calls plus two new wrong-stage-error tests proving the split actually
// removed the old dynamic-dispatch fallback, not just renamed it.
test("decompose on an item sitting at stage decompose dispatches to resolveDecompose and pass-throughs it on to executing (sync/async parity)", () => {
  const cwd = tmpCwd();
  writeRunnerConfig(cwd, { clear: true, verify: 'npm test -- proven' });
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;

  run(cwd, ['discover', id]);
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].stage, 'decompose');

  // Same scripted executor's `{clear:true, verify:...}` reply is not a
  // valid chia-việc verdict shape (no `verdict` key) — judgeDecompose's
  // fail-safe folds it to `invalid`, and resolveDecompose leaves the item
  // exactly where it was for the next sweep/call to retry (mẫu C9).
  const invalidAttempt = run(cwd, ['decompose', id]);
  assert.equal(invalidAttempt.status, 0);
  assert.equal(JSON.parse(invalidAttempt.stdout).data.outcome, 'invalid');
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].stage, 'decompose', 'invalid verdict leaves the item untouched, not silently advanced');

  // Rewrite the executor config with a real pass-through chia-việc verdict
  // and call `decompose` again — now it carries the item the rest of the way.
  writeRunnerConfig(cwd, { verdict: 'pass-through' });
  const passThrough = run(cwd, ['decompose', id]);
  assert.equal(passThrough.status, 0);
  assert.equal(JSON.parse(passThrough.stdout).data.outcome, 'pass-through');
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].stage, 'executing');
});

test('discover on a decompose-stage item errors instead of silently dispatching to resolveDecompose (tsk-2b0 D1: hard split, no fallback)', () => {
  const cwd = tmpCwd();
  writeRunnerConfig(cwd, { clear: true, verify: 'npm test -- proven' });
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;

  run(cwd, ['discover', id]);
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].stage, 'decompose');

  const result = run(cwd, ['discover', id]);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /not "clarify"/);
  assert.match(result.stderr, /fgos decompose/);
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].stage, 'decompose', 'a rejected call must never mutate the item');
});

test('decompose on a clarify-stage item errors instead of silently dispatching to resolveDiscovery (tsk-2b0 D1: hard split, no fallback)', () => {
  const cwd = tmpCwd();
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].stage, 'clarify');

  const result = run(cwd, ['decompose', id]);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /not "decompose"/);
  assert.match(result.stderr, /fgos discover/);
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].stage, 'clarify', 'a rejected call must never mutate the item');
});

test('decompose with no id is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['decompose']);
  assert.equal(result.status, 4);
});

test('discover on an unclear verdict parks the submitted item in awaiting-human with the question, still stage clarify', () => {
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

// str76-runner-bootstrap-e3: a fresh cwd with no .fgos-runner.json used to
// crash `discover` with RunnerConfigError/ENOENT (the bug this feature
// fixes) — it now bootstraps the D1 default config instead. PATH is
// neutralized to exclude the real `claude` binary (baked-in default
// executor, D1) so judge-executor's spawnSync fails fast (spawn-fail) on the
// nested judge call, never invoking a live agent; judgeDiscovery's fail-safe
// (discovery.mjs) then parks the item as unclear, not a bare "success".
test('discover on a fresh cwd with no runner config bootstraps the default config into the shared file instead of crashing on ENOENT', () => {
  const cwd = tmpCwd();
  const configPath = path.join(cwd, '.fgos', 'config.json');
  assert.equal(fs.existsSync(configPath), false);

  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing with no config yet']).stdout).data.id;

  const result = run(cwd, ['discover', id], { PATH: '/usr/bin:/bin' });
  assert.equal(result.status, 0, `expected no RunnerConfigError/ENOENT crash, got stderr: ${result.stderr}`);
  assert.equal(JSON.parse(result.stdout).data.outcome, 'unclear');

  assert.equal(fs.existsSync(configPath), true, 'discover should have auto-written the default runner section into .fgos/config.json');

  const view = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(view.work[id].status, 'awaiting-human');
  assert.equal(view.work[id].stage, 'clarify');
});

test('discover --config pointing at a missing path still throws RunnerConfigError unchanged, exit 4', () => {
  const cwd = tmpCwd();
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing with an explicit missing config']).stdout).data.id;
  const missingConfigPath = path.join(cwd, 'no-such-runner-config.json');

  const result = run(cwd, ['discover', id, '--config', missingConfigPath]);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /cannot read runner config/);
  assert.equal(fs.existsSync(missingConfigPath), false, 'an explicit --config path must never be auto-written');
});

// --- caller-supplied verdict (tsk-27y D1/D2): `--verdict` on `discover`/
// `decompose` lets a live caller skip the judge subprocess entirely for one
// call. Each test below configures the runner's fake executor with the
// OPPOSITE verdict from what `--verdict` supplies — proving the flag
// actually bypassed the judge, not just that a real judge happened to agree.

test('discover --verdict clear --verify moves the item to decompose with that exact verify, bypassing the configured (opposite) judge verdict', () => {
  const cwd = tmpCwd();
  writeRunnerConfig(cwd, { clear: false, question: 'SHOULD NEVER SURFACE' });
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;

  const result = run(cwd, ['discover', id, '--verdict', 'clear', '--verify', 'npm test -- cli-caller']);
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).data.outcome, 'clear');

  const view = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(view.work[id].stage, 'decompose');
  assert.equal(view.work[id].verify, 'npm test -- cli-caller');
  assert.notEqual(view.work[id].status, 'awaiting-human');
});

test('discover --verdict unclear --question parks in awaiting-human with that exact question, bypassing the configured (opposite) judge verdict', () => {
  const cwd = tmpCwd();
  writeRunnerConfig(cwd, { clear: true, verify: 'SHOULD NEVER SURFACE' });
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;

  const result = run(cwd, ['discover', id, '--verdict', 'unclear', '--question', 'Which provider?']);
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).data.outcome, 'unclear');

  const view = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(view.work[id].status, 'awaiting-human');
  assert.equal(view.work[id].stage, 'clarify');
  assert.equal(view.gates[id].ask, 'Which provider?');
});

test('discover --verdict clear with no --verify is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;
  const result = run(cwd, ['discover', id, '--verdict', 'clear']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /--verify/);
});

test('discover --verdict with an unrecognized value is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;
  const result = run(cwd, ['discover', id, '--verdict', 'maybe']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /"clear" or "unclear"/);
});

test('decompose --verdict pass-through moves the item to executing, bypassing the configured (opposite) judge verdict', () => {
  const cwd = tmpCwd();
  writeRunnerConfig(cwd, { clear: true, verify: 'npm test -- proven' });
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;
  run(cwd, ['discover', id]);
  assert.equal(envelopeData(run(cwd, ['list']).stdout).work[id].stage, 'decompose');

  writeRunnerConfig(cwd, { verdict: 'decompose', reason: 'SHOULD NEVER SURFACE', children: [{ title: 'x', verify: 'npm test' }] });
  const result = run(cwd, ['decompose', id, '--verdict', 'pass-through', '--reason', 'single-piece, no split needed']);
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).data.outcome, 'pass-through');

  const view = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(view.work[id].stage, 'executing');
  assert.equal(Object.values(view.work).some((item) => item.parent === id), false);
});

test('decompose --verdict need-human --reason parks in awaiting-human with that exact reason, bypassing the configured (opposite) judge verdict', () => {
  const cwd = tmpCwd();
  writeRunnerConfig(cwd, { clear: true, verify: 'npm test -- proven' });
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;
  run(cwd, ['discover', id]);

  writeRunnerConfig(cwd, { verdict: 'pass-through' });
  const result = run(cwd, ['decompose', id, '--verdict', 'need-human', '--reason', 'Which auth provider?']);
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).data.outcome, 'need-human');

  const view = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(view.work[id].status, 'awaiting-human');
  assert.match(view.gates[id].ask, /Which auth provider\?/);
});

test('decompose --verdict decompose --children writes real children, bypassing the configured (opposite) judge verdict', () => {
  const cwd = tmpCwd();
  writeRunnerConfig(cwd, { clear: true, verify: 'npm test -- proven' });
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;
  run(cwd, ['discover', id]);

  writeRunnerConfig(cwd, { verdict: 'pass-through' });
  const children = JSON.stringify([
    { title: 'Build parser', verify: 'npm test -- parser' },
    { title: 'Build renderer', verify: 'npm test -- renderer' },
  ]);
  const result = run(cwd, ['decompose', id, '--verdict', 'decompose', '--reason', 'two independent surfaces', '--children', children]);
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).data.outcome, 'decompose');

  const view = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(view.work[id].stage, 'executing');
  assert.equal(view.work[`${id}-1`].title, 'Build parser');
  assert.equal(view.work[`${id}-2`].title, 'Build renderer');
});

test('decompose --verdict decompose with malformed --children JSON is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  // tsk-5q5-1: a clear caller-supplied verdict with a real `verify` still
  // triggers judgeVerifySemanticCorrectness's own second-pass call, same as
  // a model verdict (D3 — gates apply regardless of verdict origin) — this
  // config answers that prompt, not the (bypassed) first-pass judgeDiscovery.
  writeRunnerConfig(cwd, { clear: true, verify: 'npm test' });
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;
  run(cwd, ['discover', id, '--verdict', 'clear', '--verify', 'npm test']);

  const result = run(cwd, ['decompose', id, '--verdict', 'decompose', '--reason', 'x', '--children', '{not valid json']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /--children/);
});

test('decompose --verdict decompose with no --children at all is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  // tsk-5q5-1: a clear caller-supplied verdict with a real `verify` still
  // triggers judgeVerifySemanticCorrectness's own second-pass call, same as
  // a model verdict (D3 — gates apply regardless of verdict origin) — this
  // config answers that prompt, not the (bypassed) first-pass judgeDiscovery.
  writeRunnerConfig(cwd, { clear: true, verify: 'npm test' });
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;
  run(cwd, ['discover', id, '--verdict', 'clear', '--verify', 'npm test']);

  const result = run(cwd, ['decompose', id, '--verdict', 'decompose', '--reason', 'x']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /--children/);
});

test('decompose --verdict with an unrecognized value is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  // tsk-5q5-1: a clear caller-supplied verdict with a real `verify` still
  // triggers judgeVerifySemanticCorrectness's own second-pass call, same as
  // a model verdict (D3 — gates apply regardless of verdict origin) — this
  // config answers that prompt, not the (bypassed) first-pass judgeDiscovery.
  writeRunnerConfig(cwd, { clear: true, verify: 'npm test' });
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;
  run(cwd, ['discover', id, '--verdict', 'clear', '--verify', 'npm test']);

  const result = run(cwd, ['decompose', id, '--verdict', 'maybe']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /"pass-through", "need-human", or "decompose"/);
});

// --- settlement channel role attribution (phase-3-compound-learning-5,
// S3-closeout) — real CLI call sites stamp `role` per vision §8: the
// `move`/`answer` verbs are always a human at the keyboard; `discover` is
// the sync, session-driven call site (the async runner sweep is 'runner',
// covered at the runner unit-test layer). ---------------------------------

test('answer via the real CLI stamps role "human" on the event payload and folds into an "answer" settlement', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'answer-actor-item');
  run(cwd, ['move', 'answer-actor-item', '--to', 'doing']);
  run(cwd, ['ask', 'answer-actor-item', '--text', 'OAuth or password?']);

  const result = run(cwd, ['answer', 'answer-actor-item', '--text', 'OAuth']);
  assert.equal(result.status, 0);

  const lines = eventLines(cwd);
  const lastEvent = JSON.parse(lines[lines.length - 1]);
  assert.equal(lastEvent.payload.role, 'human');

  const view = stateView(cwd);
  assert.equal(view.settlements['answer-actor-item'].length, 1);
  assert.equal(view.settlements['answer-actor-item'][0].kind, 'answer');
  assert.equal(view.settlements['answer-actor-item'][0].role, 'human');
});

test('move to done via the real CLI stamps role "human" on the event payload and folds into a "close" settlement', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'close-actor-item');

  const result = toDoneViaChain(cwd, 'close-actor-item');
  assert.equal(result.status, 0);

  const lines = eventLines(cwd);
  const lastEvent = JSON.parse(lines[lines.length - 1]);
  assert.equal(lastEvent.payload.role, 'human');

  const view = stateView(cwd);
  assert.equal(view.settlements['close-actor-item'].length, 1);
  assert.equal(view.settlements['close-actor-item'][0].kind, 'close');
  assert.equal(view.settlements['close-actor-item'][0].role, 'human');
});

test('discover (sync verb) on a clear verdict stamps role "session" on the work.stage event and folds into a clarify-pass settlement', () => {
  const cwd = tmpCwd();
  writeRunnerConfig(cwd, { clear: true, verify: 'npm test -- proven' });
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;

  const result = run(cwd, ['discover', id]);
  assert.equal(result.status, 0);

  const lines = eventLines(cwd);
  const stageEvent = lines.map((l) => JSON.parse(l)).find((e) => e.type === 'work.stage');
  assert.equal(stageEvent.payload.role, 'session');

  const view = stateView(cwd);
  assert.equal(view.settlements[id].length, 1);
  assert.equal(view.settlements[id][0].kind, 'clarify-pass');
  assert.equal(view.settlements[id][0].role, 'session');
});

test('check returns the settlement data — per-kind/role counts + recent records — when settlement data exists', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'settle-item');
  toDoneViaChain(cwd, 'settle-item');

  const result = run(cwd, ['check']);
  assert.equal(result.status, 0);
  const { settlement } = envelopeData(result.stdout);
  assert.equal(settlement.count, 1);
  assert.deepEqual(settlement.byKindRole, { 'close/human': 1 });
  assert.equal(settlement.recent[0].kind, 'close');
  assert.equal(settlement.recent[0].id, 'settle-item');
  assert.equal(settlement.recent[0].role, 'human');
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
    actual: { outcome: 'awaiting-approval', passed: true, attempts: 1, errorClass: null, aheadCount: 1, visits: 1 },
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
  const cwd = rawTmpCwd();
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

  // Walk the sequential chain to done's one remaining door in (work-item-
  // status-delivered-retrospective-cleanup D1/D2/D10).
  moveWork(dir, { id: 'learning-item', to: 'delivered', expectedStatus: 'doing' });
  moveWork(dir, { id: 'learning-item', to: 'retrospective', expectedStatus: 'delivered' });
  moveWork(dir, { id: 'learning-item', to: 'cleanup', expectedStatus: 'retrospective' });
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

test('take with no --id claims the frontier head, defaults role to human, records headAtTake, and writes a predicted outcome', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-a', { verify: 'test -f done.txt' });
  const headBefore = gitHead(cwd);

  const result = run(cwd, ['take']);
  assert.equal(result.status, 0, `take failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.id, 'pull-a');
  assert.equal(data.role, 'human');

  const view = stateView(cwd);
  assert.equal(view.work['pull-a'].status, 'doing');
  assert.equal(view.work['pull-a'].claimRole, 'human');
  assert.equal(view.work['pull-a'].headAtTake, headBefore);
  assert.equal(view.outcomes['pull-a'].predicted.role, 'human');
  assert.equal(view.outcomes['pull-a'].predicted.headAtTake, headBefore);
  assert.equal(view.outcomes['pull-a'].predicted.tier, 'standard');
});

test('take --role session records claimRole "session" instead of the default human', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-session');

  const result = run(cwd, ['take', '--role', 'session']);
  assert.equal(result.status, 0, `take failed: ${result.stderr}`);
  assert.equal(stateView(cwd).work['pull-session'].claimRole, 'session');
});

test('take --role with an invalid value is rejected as validation, exit 4, no event written', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-bad-actor');
  const before = eventLines(cwd).length;

  const result = run(cwd, ['take', '--role', 'robot']);
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

test('take --id on a todo item outside the frontier (dep not done) is rejected as validation — take opens only the same set the runner would dispatch', () => {
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

// tsk-k8u D1/D2 regression guard: take used to pass repoRoot: process.cwd()
// to claimWork, independent of --dir -- a session running it (as instructed)
// from inside a .fgos/-less linked worktree with --dir pointed at the real
// root would record headAtTake against the WORKTREE's own HEAD instead of
// the real root's. Same "pin repoRoot to --dir like every other verb"
// pattern tsk-1wn already fixed for docs-index (see tmpLinkedWorktree above).
test('take --id from --dir records headAtTake against the real root, not the worktree cwd (tsk-k8u D1/D2)', () => {
  const { main, wt } = tmpLinkedWorktree();
  addOk(main, 'pull-via-dir');
  // Advance main's own HEAD past wt's fork point so headAtTake can actually
  // discriminate "read from --dir's root" vs "read from the worktree cwd" —
  // without this, both share the same commit and the assertion below would
  // pass by coincidence even under the pre-fix process.cwd() bug.
  commitFile(main, 'advance-main.txt');
  const headBefore = gitHead(main);
  assert.notEqual(headBefore, gitHead(wt), 'test setup must diverge main from wt before asserting');

  const result = run(wt, ['take', '--id', 'pull-via-dir', '--dir', main]);
  assert.equal(result.status, 0, `take --dir failed: ${result.stderr}`);

  const view = stateView(main);
  assert.equal(view.work['pull-via-dir'].status, 'doing');
  assert.equal(view.work['pull-via-dir'].headAtTake, headBefore, 'take --dir must record HEAD from --dir\'s root, not the worktree cwd');
});

// --- pick: take + createWorktree combined (str83-fgos-slash-commands-4) ---

test('pick with no --id claims the frontier head exactly like take does today, role fixed to "session", and stands up a real (non-detached) git branch/worktree for the claim', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pick-a', { verify: 'test -f done.txt' });
  const headBefore = gitHead(cwd);

  const result = run(cwd, ['pick']);
  assert.equal(result.status, 0, `pick failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.id, 'pick-a');
  assert.equal(data.role, 'session');
  assert.equal(data.from, 'todo');
  assert.equal(data.to, 'doing');
  // A first pick claim records branchHeadAtTake, not the main-based
  // headAtTake — pick always creates a fgw/<id> worktree/branch below, on
  // this first claim exactly as much as on a blocked reclaim, so `return`
  // must take the SAME branch-source path either way.
  assert.equal(data.branchHeadAtTake, headBefore);
  assert.equal('headAtTake' in data, false, 'a pick claim never records the main-based headAtTake');
  assert.equal(data.worktree.branch, 'fgw/pick-a');
  assert.equal(data.worktree.reused, false);
  assert.ok(fs.existsSync(data.worktree.path), 'pick must leave a real worktree checkout on disk');
  // tsk-424 D1/D2: pick's worktree must live under .claude/worktrees/ so the
  // harness's EnterWorktree tool can chain a second in-session switch into
  // it (e.g. a root item decomposing into a child mid-session) — a location
  // outside .claude/worktrees/ is refused by the harness past the first switch.
  assert.ok(
    data.worktree.path.startsWith(path.join(cwd, '.claude', 'worktrees') + path.sep),
    `pick worktree path "${data.worktree.path}" must live under .claude/worktrees/`,
  );

  const view = stateView(cwd);
  assert.equal(view.work['pick-a'].status, 'doing');
  assert.equal(view.work['pick-a'].claimRole, 'session');
  assert.equal(view.work['pick-a'].branchHeadAtTake, headBefore);
  assert.equal(view.outcomes['pick-a'].predicted.role, 'session');

  // truth 3: the branch is real and non-detached — `symbolic-ref HEAD`
  // succeeds inside the worktree (mirrors session.test.mjs's negative check
  // for a genuinely detached session worktree, asserted the other way).
  assert.doesNotThrow(() =>
    execFileSync('git', ['symbolic-ref', '-q', 'HEAD'], { cwd: data.worktree.path, stdio: 'ignore' }),
  );
});

// tsk-k8u D1/D2 regression guard: pick used to derive BOTH repoRoot and
// worktreeDir from process.cwd(), independent of --dir -- a session
// running it (as instructed) from inside a .fgos/-less linked worktree with
// --dir pointed at the real root would stand up the new worktree under the
// WORKTREE's own .claude/worktrees/ instead of the real root's (D2), and
// (D1) risk targeting git ops at the worktree cwd for anything reclaimed.
// Same "pin repoRoot to --dir" pattern tsk-1wn already fixed for docs-index.
test('pick --id from --dir stands up the worktree under --dir\'s own .claude/worktrees/, not the invoking worktree cwd\'s (tsk-k8u D1/D2)', () => {
  const { main, wt } = tmpLinkedWorktree();
  addOk(main, 'pick-via-dir');

  const result = run(wt, ['pick', '--id', 'pick-via-dir', '--dir', main]);
  assert.equal(result.status, 0, `pick --dir failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.ok(fs.existsSync(data.worktree.path), 'pick --dir must leave a real worktree checkout on disk');
  assert.ok(
    data.worktree.path.startsWith(path.join(main, '.claude', 'worktrees') + path.sep),
    `pick --dir worktree path "${data.worktree.path}" must live under --dir's own .claude/worktrees/, not the invoking cwd's`,
  );
  assert.ok(
    !data.worktree.path.startsWith(wt),
    'pick --dir must never place the new worktree under the invoking (worktree-resident) cwd',
  );

  const view = stateView(main);
  assert.equal(view.work['pick-via-dir'].status, 'doing');
});

// tsk-k8u repro (2026-08-02, tsk-2ie): a claim-release + re-pick sequence
// run FROM INSIDE the item's own already-existing worktree used to crash
// with `spawnSync git ENOENT` -- worktreeDir was ALSO process.cwd()-based,
// so the second pick's worktreeDir (the worktree's own path) didn't match
// where the checkout was actually registered (under main's worktreeDir),
// createClaimWorktree's reattach check failed, and it fell through to
// createWorktree's reclaim path with repoRoot === the worktree about to be
// force-removed. With repoRoot/worktreeDir both fixed to derive from --dir,
// worktreeDir stays the SAME stable path across both pick calls, so
// createClaimWorktree's reattach succeeds instead — same path, no removal,
// no crash, an even safer outcome than reclaim-and-recreate would be.
test('pick --id reattaches to its own already-existing worktree/branch when invoked FROM INSIDE that worktree via --dir, without crashing (tsk-k8u repro)', () => {
  const main = initGitCwd();
  run(main, ['init']);
  addOk(main, 'reclaim-from-inside');

  const firstPick = envelopeData(run(main, ['pick', '--id', 'reclaim-from-inside']).stdout);
  const ownWorktree = firstPick.worktree.path;

  // Simulate the claim-lock §3b release (item reached executing, claim
  // released back to todo) while the branch/worktree still stand.
  assert.equal(run(main, ['move', 'reclaim-from-inside', '--to', 'todo', '--expect', 'doing']).status, 0);

  // Re-pick FROM INSIDE the item's own worktree, --dir pointed at main —
  // repoRoot/worktreeDir must resolve to main (stable), never ownWorktree
  // (which the pre-fix bug would have force-removed out from under this
  // very call).
  const result = run(ownWorktree, ['pick', '--id', 'reclaim-from-inside', '--dir', main]);
  assert.equal(result.status, 0, `pick --dir from inside its own worktree failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.worktree.reused, true);
  assert.equal(data.worktree.path, ownWorktree, 'a stable repoRoot/worktreeDir makes this a clean reattach to the SAME checkout, not a force-remove-and-recreate');
  assert.ok(fs.existsSync(data.worktree.path));
});

test('pick --id claims that specific item, role fixed to "session" — pick has no --role flag at all, unlike take', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pick-explicit-other');
  addOk(cwd, 'pick-explicit-target');

  const result = run(cwd, ['pick', '--id', 'pick-explicit-target']);
  assert.equal(result.status, 0, `pick failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.id, 'pick-explicit-target');
  assert.equal(data.role, 'session');
  assert.equal(data.worktree.branch, 'fgw/pick-explicit-target');

  assert.equal(stateView(cwd).work['pick-explicit-other'].status, 'todo', 'pick --id must not touch a different frontier item');
  assert.equal(stateView(cwd).work['pick-explicit-target'].status, 'doing');
  assert.equal(stateView(cwd).work['pick-explicit-target'].claimRole, 'session');
});

test('pick --id on an item already claimed (doing) fails the same way take does today — conflict, exit 3, no double-claim', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pick-double');
  assert.equal(run(cwd, ['pick', '--id', 'pick-double']).status, 0);

  const result = run(cwd, ['pick', '--id', 'pick-double']);
  assert.equal(result.status, 3);
  assert.equal(stateView(cwd).work['pick-double'].status, 'doing');
});

test('pick surfaces a real createWorktree failure and reverts the claim it already made, instead of orphaning the item in doing (tsk-4m0 D1)', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pick-wt-fail');
  // Force `git worktree add -b fgw/pick-wt-fail ...` to fail deterministically
  // and for real (no mock): git's ref namespace cannot hold both a leaf ref
  // and a directory at the same path, so a pre-existing
  // "fgw/pick-wt-fail/leftover" ref makes git itself refuse to create the
  // leaf ref "fgw/pick-wt-fail" — exactly the kind of WorktreeError
  // createWorktree raises after the claim above has already committed.
  execFileSync('git', ['branch', 'fgw/pick-wt-fail/leftover'], { cwd });

  const result = run(cwd, ['pick', '--id', 'pick-wt-fail']);
  assert.notEqual(result.status, 0, 'pick must fail when createWorktree fails');
  assert.match(result.stderr, /git worktree add failed/);

  // tsk-4m0: previously the claim was NOT rolled back here (this test used
  // to assert status stayed "doing" with no worktree, per the original
  // pick cell's must_haves truth 5) — reproduced live on tsk-f31 as an
  // item permanently orphaned in doing with no automatic recovery
  // (docs/history/pick-worktree-claim-race/CONTEXT.md). The claim now
  // reverts back to todo so a failed pick looks like it never happened.
  const view = stateView(cwd);
  assert.equal(view.work['pick-wt-fail'].status, 'todo');
});

// --- pick: claim-lock §3a/§3c/§7 (guard loosen, branch-reuse generalize, claimTrigger) ---

test('pick --id claims a status:todo item at stage clarify (not the frontier at all) — the frontier/stage guard is gone (claim-lock §3a)', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  const id = JSON.parse(run(cwd, ['submit', 'Fuzzy request needing discovery']).stdout).data.id;
  assert.equal(stateView(cwd).work[id].stage, 'clarify');
  assert.ok(!envelopeData(run(cwd, ['ready']).stdout).some((i) => i.id === id), 'a clarify-stage item is never in the frontier');

  const result = run(cwd, ['pick', '--id', id]);
  assert.equal(result.status, 0, `pick failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.from, 'todo');
  assert.equal(data.to, 'doing');
  assert.equal(stateView(cwd).work[id].status, 'doing');
  assert.equal(stateView(cwd).work[id].stage, 'clarify', 'pick claims the item without touching its stage');
});

test('pick with no --id still only opens the frontier head — the loosened guard applies to the explicit --id branch alone', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  run(cwd, ['submit', 'Fuzzy request never picked by id']); // stage clarify, never in the frontier
  const result = run(cwd, ['pick']);
  assert.notEqual(result.status, 0, 'the frontier is empty — a clarify-stage item must not be silently auto-picked');
});

test('pick --via stamps claimTrigger on the item; omitting --via leaves it entirely absent (claim-lock §7)', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pick-via-herdr');
  addOk(cwd, 'pick-via-none');

  assert.equal(run(cwd, ['pick', '--id', 'pick-via-herdr', '--via', 'herdr']).status, 0);
  assert.equal(stateView(cwd).work['pick-via-herdr'].claimTrigger, 'herdr');

  assert.equal(run(cwd, ['pick', '--id', 'pick-via-none']).status, 0);
  assert.equal('claimTrigger' in stateView(cwd).work['pick-via-none'], false);
});

test('pick --via requires a non-empty value, rejected as validation, exit 4', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pick-via-empty');
  const result = run(cwd, ['pick', '--id', 'pick-via-empty', '--via']);
  assert.equal(result.status, 4);
  assert.equal(stateView(cwd).work['pick-via-empty'].status, 'todo', 'a rejected --via must not leave a partial claim');
});

test('pick reclaims a released todo item onto its OWN existing branch tip, not a fresh HEAD (claim-lock §3c: branch-reuse keyed on branchExists alone, not status)', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'reuse-branch-item');

  const firstPick = envelopeData(run(cwd, ['pick', '--id', 'reuse-branch-item']).stdout);
  const worktreePath = firstPick.worktree.path;
  assert.equal(firstPick.worktree.reused, false);

  // Advance the branch's own tip past repoRoot's HEAD — simulates the
  // fgos-exploring/planning hard rule (commit CONTEXT.md/plan.md before the
  // release-triggering `fgos discover` call).
  fs.writeFileSync(path.join(worktreePath, 'CONTEXT.md'), '# decisions\n');
  execFileSync('git', ['add', 'CONTEXT.md'], { cwd: worktreePath });
  execFileSync('git', ['commit', '-m', 'lock decisions'], { cwd: worktreePath });
  const branchTip = execFileSync('git', ['rev-parse', 'fgw/reuse-branch-item'], { cwd, encoding: 'utf8' }).trim();
  assert.notEqual(branchTip, gitHead(cwd), 'the branch must have genuinely advanced past main');

  // Release (claim-lock §3b's own edge, doing -> todo) without settling the
  // item — the branch and its commit survive (worktree.mjs never deletes it).
  assert.equal(run(cwd, ['move', 'reuse-branch-item', '--to', 'todo', '--expect', 'doing']).status, 0);
  assert.equal(stateView(cwd).work['reuse-branch-item'].status, 'todo');

  const secondPick = envelopeData(run(cwd, ['pick', '--id', 'reuse-branch-item']).stdout);
  assert.equal(secondPick.from, 'todo');
  assert.equal(secondPick.branchHeadAtTake, branchTip, 'reclaims the SAME branch tip, not repoRoot\'s current HEAD');
  assert.equal(secondPick.worktree.branch, 'fgw/reuse-branch-item');
  assert.equal(secondPick.worktree.reused, true, 'createWorktree reuses the existing fgw/<id> branch');
});

test('pick on a leaf item whose root has no fgw/<rootId> branch yet forks from repoRoot HEAD instead of orphaning the claim (claim-port.mjs baseRef guard)', () => {
  // A leaf claimed before the runner ever dispatched its root (e.g. a human
  // `pick` right after decompose, no runner involved yet) has no root branch
  // to fork from — claim-port.mjs must fall back to repoRoot's current HEAD,
  // the same as a non-leaf claim, rather than passing createWorktree a
  // baseRef naming a branch git doesn't have. Passing that nonexistent
  // baseRef used to throw AFTER moveWork had already committed the
  // doing-claim, leaving the item stuck in doing with no branch/worktree and
  // no automatic recovery (startupReap skips human/session claims by design).
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'orphan-root-item', { title: 'Root Item' });
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'orphan-leaf-item', title: 'Leaf Item', kind: 'task', status: 'todo', deps: [], risk: 'low', refs: [], verify: 'true', parent: 'orphan-root-item' });

  const result = run(cwd, ['pick', '--id', 'orphan-leaf-item']);
  assert.equal(result.status, 0, `pick failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.id, 'orphan-leaf-item');
  assert.equal(data.branchHeadAtTake, gitHead(cwd), 'no root branch exists yet — must fork from repoRoot HEAD, not a nonexistent baseRef');
  assert.equal(data.worktree.branch, 'fgw/orphan-leaf-item');
  assert.equal(data.worktree.reused, false);
  assert.equal(stateView(cwd).work['orphan-leaf-item'].status, 'doing');
});

test('pick on a leaf item whose root DOES have a live fgw/<rootId> branch forks the leaf worktree from that branch tip, not from repoRoot HEAD (claim-port.mjs D3 leaf-vs-root split, positive path)', () => {
  // The counterpart to the fallback test above: once fgw/<rootId> actually
  // exists (e.g. an earlier sibling already merged into it), a leaf pick
  // must fork FROM that tip — mirroring approve/review's own leaf-vs-root
  // split (bin/fgos.mjs's D3 comment) — never from main/repoRoot HEAD,
  // which would silently drop whatever the root branch already carries
  // (the tsk-1wd-3 dogfood incident this item exists to close).
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'baseref-root-item', { title: 'Root Item' });
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'baseref-leaf-item', title: 'Leaf Item', kind: 'task', status: 'todo', deps: [], risk: 'low', refs: [], verify: 'true', parent: 'baseref-root-item' });

  // Give fgw/baseref-root-item a tip that genuinely differs from repoRoot's
  // current HEAD (same tree, a distinct commit) so the assertion below can
  // tell "forked from root branch" apart from "forked from HEAD" for real.
  const tree = execFileSync('git', ['rev-parse', 'HEAD^{tree}'], { cwd, encoding: 'utf8' }).trim();
  const rootTip = execFileSync('git', ['commit-tree', tree, '-p', 'HEAD', '-m', 'root progress'], { cwd, encoding: 'utf8' }).trim();
  execFileSync('git', ['branch', 'fgw/baseref-root-item', rootTip], { cwd });
  assert.notEqual(rootTip, gitHead(cwd), 'the root branch tip must genuinely differ from repoRoot HEAD for this test to prove anything');

  const result = run(cwd, ['pick', '--id', 'baseref-leaf-item']);
  assert.equal(result.status, 0, `pick failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.branchHeadAtTake, rootTip, 'a live root branch exists — the leaf must fork from ITS tip, not repoRoot HEAD');
  assert.equal(data.worktree.branch, 'fgw/baseref-leaf-item');
  assert.equal(
    execFileSync('git', ['rev-parse', 'HEAD'], { cwd: data.worktree.path, encoding: 'utf8' }).trim(),
    rootTip,
    'the new worktree checkout itself must sit on the root branch tip, not main',
  );
});

test('pick on a leaf item refuses the claim when a dep is not yet status:done, instead of forking a worktree that could be missing that dep\'s content (claim-port.mjs D2 sibling-merge-ordering guard, tsk-3t4)', () => {
  // The tsk-1wd-3 dogfood scenario: a leaf picked directly by id (frontier
  // bypass, claim-lock §3a) whose dep hasn't been approved/merged into
  // fgw/<rootId> yet. Approve is the ONLY path a leaf dep reaches
  // status:'done' through, and it never lands 'done' without first merging
  // into the root branch (bin/fgos.mjs's leaf approve case) — so a dep
  // that isn't 'done' yet is exactly the case that must be refused, not
  // silently forked from a root branch missing that dep's content.
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'guard-root-item', { title: 'Root Item' });
  addOk(cwd, 'guard-dep-item', { title: 'Dep Item' }); // left status: todo — never approved
  const dir = path.join(cwd, '.fgos');
  addWork(dir, {
    id: 'guard-leaf-item',
    title: 'Leaf Item',
    kind: 'task',
    status: 'todo',
    deps: ['guard-dep-item'],
    risk: 'low',
    refs: [],
    verify: 'true',
    parent: 'guard-root-item',
  });
  const before = eventLines(cwd).length;

  const result = run(cwd, ['pick', '--id', 'guard-leaf-item']);
  assert.notEqual(result.status, 0, 'pick must refuse a leaf claim while a dep is not yet status:done');
  assert.match(result.stderr, /guard-dep-item/, 'the refusal must name the unmerged dep');

  // The refusal must be a clean no-op — never the "claimed to doing but no
  // branch/worktree" orphan the 268b172 baseRef fix already closed once for
  // a different cause: no event written, status untouched, no branch made.
  assert.equal(eventLines(cwd).length, before, 'a refused claim must never write a claim event');
  assert.equal(stateView(cwd).work['guard-leaf-item'].status, 'todo');
  assert.equal(
    execFileSync('git', ['branch', '--list', 'fgw/guard-leaf-item'], { cwd, encoding: 'utf8' }).trim(),
    '',
    'a refused claim must never create the leaf\'s own branch',
  );
});

test('return happy path: verify passes -> doing to proposed, actual outcome recorded, no settlement (settlement belongs to the -> done edge)', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-ok', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-ok']).status, 0);
  commitFile(cwd, 'proof.txt');

  const headAtReturn = gitHead(cwd);
  const result = run(cwd, ['return', 'pull-return-ok']);
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.to, 'awaiting-approval');
  assert.equal(data.passed, true);

  const view = stateView(cwd);
  assert.equal(view.work['pull-return-ok'].status, 'awaiting-approval');
  assert.equal(view.outcomes['pull-return-ok'].actual.outcome, 'awaiting-approval');
  assert.equal(view.outcomes['pull-return-ok'].actual.passed, true);
  assert.equal(view.outcomes['pull-return-ok'].actual.aheadCount, 1);
  assert.equal(view.work['pull-return-ok'].headAtReturn, headAtReturn, 'pr-lifecycle D3/D4: return records HEAD at green-return time, mirroring headAtTake at claim time');
  assert.equal('settlements' in view, false, 'doing -> awaiting-approval never settles (D4: settlement belongs to the -> done edge)');
});

test('return (verify passes, main-source): a live main-checkout.lock recorded under THIS session\'s own identity is released early, instead of waiting out the TTL (tsk-45z D1/D2)', () => {
  const cwd = initGitCwd();
  const sessionId = 'tsk-45z-test-session-ok';
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-releases-own-lock', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-releases-own-lock'], { BEE_SESSION_ID: sessionId }).status, 0);
  commitFile(cwd, 'proof.txt');

  const lockPath = path.join(cwd, '.fgos', 'main-checkout.lock');
  fs.writeFileSync(lockPath, JSON.stringify({ pid: sessionId, ts: Date.now() }));

  const result = run(cwd, ['return', 'pull-return-releases-own-lock'], { BEE_SESSION_ID: sessionId });
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  assert.equal(envelopeData(result.stdout).to, 'awaiting-approval');
  assert.equal(fs.existsSync(lockPath), false, 'return must release its own live lock once verify passes and the item settles to proposed');
});

test('return (verify FAILS, main-source): a live own-identity lock is released too — settling to blocked is just as much "done with the checkout" as proposed (tsk-45z D1/D2)', () => {
  const cwd = initGitCwd();
  const sessionId = 'tsk-45z-test-session-blocked';
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-own-lock-blocked', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-own-lock-blocked'], { BEE_SESSION_ID: sessionId }).status, 0);
  commitFile(cwd, 'wrong-file.txt'); // advances HEAD, never satisfies verify

  const lockPath = path.join(cwd, '.fgos', 'main-checkout.lock');
  fs.writeFileSync(lockPath, JSON.stringify({ pid: sessionId, ts: Date.now() }));

  const result = run(cwd, ['return', 'pull-return-own-lock-blocked'], { BEE_SESSION_ID: sessionId });
  assert.equal(result.status, 0, `return should exit 0 for a defined blocked outcome: ${result.stderr}`);
  assert.equal(envelopeData(result.stdout).to, 'blocked');
  assert.equal(fs.existsSync(lockPath), false, 'return must release its own live lock even when verify fails and the item settles to blocked');
});

test('return (main-source) never touches a DIFFERENT session\'s live lock — never a blind unlink (tsk-45z D2)', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-other-untouched', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-other-untouched'], { BEE_SESSION_ID: 'tsk-45z-this-session' }).status, 0);
  commitFile(cwd, 'proof.txt');

  const lockPath = path.join(cwd, '.fgos', 'main-checkout.lock');
  fs.writeFileSync(lockPath, JSON.stringify({ pid: 'tsk-45z-a-different-live-session', ts: Date.now() }));

  const result = run(cwd, ['return', 'pull-return-other-untouched'], { BEE_SESSION_ID: 'tsk-45z-this-session' });
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  assert.equal(envelopeData(result.stdout).to, 'awaiting-approval');
  assert.equal(fs.existsSync(lockPath), true, 'a different session\'s live lock must survive this return untouched');
  assert.equal(JSON.parse(fs.readFileSync(lockPath, 'utf8')).pid, 'tsk-45z-a-different-live-session');
});

test('return: a changed sensitive file outside the item\'s footprint surfaces a frozenJudgeHits advisory, and never blocks the return', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-judge', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-judge']).status, 0);
  commitFile(cwd, 'proof.txt');
  commitFile(cwd, 'package.json', '{}\n');

  const result = run(cwd, ['return', 'pull-return-judge']);
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.to, 'awaiting-approval');
  assert.equal(data.passed, true, 'the frozen-judge advisory never fails the return itself');
  assert.deepEqual(data.frozenJudgeHits, [{ file: 'package.json', rule: 'package manifest' }]);
});

test('return: a changed sensitive file DECLARED in the item\'s footprint is not a hit', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  assert.equal(run(cwd, ['add', 'pull-return-judge-declared', '--title', 'X', '--kind', 'task', '--risk', 'low', '--verify', 'test -f proof.txt', '--footprint', 'package.json']).status, 0);
  assert.equal(run(cwd, ['take', '--id', 'pull-return-judge-declared']).status, 0);
  commitFile(cwd, 'proof.txt');
  commitFile(cwd, 'package.json', '{}\n');

  const result = run(cwd, ['return', 'pull-return-judge-declared']);
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.passed, true);
  assert.deepEqual(data.frozenJudgeHits, []);
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

test('return succeeds when a dirty file on cwd is UNRELATED to the item\'s own committed progress (tsk-598 D1/D2) — own-file-set scoping, not a whole-tree gate', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-unrelated-dirty', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-unrelated-dirty']).status, 0);
  commitFile(cwd, 'proof.txt'); // real committed progress since headAtTake

  // A path this item's headAtTake..HEAD diff never touches — another
  // session's uncommitted work sitting in the same main checkout (the
  // tsk-352 repro shape).
  fs.writeFileSync(path.join(cwd, 'scratch.txt'), 'unrelated uncommitted work\n'); // never git add/commit

  const result = run(cwd, ['return', 'pull-return-unrelated-dirty']);
  assert.equal(result.status, 0, `return should succeed past an unrelated dirty file: ${result.stderr}`);
  assert.equal(stateView(cwd).work['pull-return-unrelated-dirty'].status, 'awaiting-approval');
  assert.equal(fs.readFileSync(path.join(cwd, 'scratch.txt'), 'utf8'), 'unrelated uncommitted work\n', 'the unrelated dirty file must be left untouched, still uncommitted');
});

test('return still refuses when the SAME path the item committed is dirty again — a real conflict, tsk-598 D2, exit 4, item stays doing', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-real-conflict', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-real-conflict']).status, 0);
  commitFile(cwd, 'proof.txt'); // proof.txt is now IN this item's own committed diff

  // Re-dirty the SAME path after committing it — own-file-set membership
  // still blocks this, unchanged from before tsk-598.
  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'clobbered by another writer\n'); // never git add/commit

  const result = run(cwd, ['return', 'pull-return-real-conflict']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /not clean/);
  assert.equal(stateView(cwd).work['pull-return-real-conflict'].status, 'doing');
});

test('return with a declared footprint still refuses on an uncommitted footprint path (tsk-598 D3) even though it was never committed', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-footprint-dirty', { verify: 'test -f proof.txt', footprint: 'footprint-guarded.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-footprint-dirty']).status, 0);
  commitFile(cwd, 'proof.txt'); // real committed progress since headAtTake

  // footprint-guarded.txt is declared in item.footprint but was never
  // committed — absent from headAtTake..HEAD. Per D3, a footprint path
  // still blocks even uncommitted.
  fs.writeFileSync(path.join(cwd, 'footprint-guarded.txt'), 'forgot to commit this\n'); // never git add/commit

  const result = run(cwd, ['return', 'pull-return-footprint-dirty']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /not clean/);
  assert.equal(stateView(cwd).work['pull-return-footprint-dirty'].status, 'doing');
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
  assert.equal(stateView(cwd).work['pull-return-fgos-only-dirty'].status, 'awaiting-approval');
});

test('return succeeds when cwd is a subdirectory of the real git top-level and only .fgos/ (under that subtree) is dirty', () => {
  const { cwd } = initGitCwdInSubdir();
  run(cwd, ['init']);
  addOk(cwd, 'sub-return-fgos-only-dirty', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'sub-return-fgos-only-dirty']).status, 0);

  // Commit ONLY the produced file, same isolation as the top-level
  // "ONLY .fgos/ dirty" test above — the take event's `.fgos/events.jsonl`
  // delta (under the subdirectory) is deliberately left uncommitted.
  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'work\n');
  execFileSync('git', ['add', 'proof.txt'], { cwd });
  execFileSync('git', ['commit', '-q', '-m', 'work: proof.txt'], { cwd });

  const result = run(cwd, ['return', 'sub-return-fgos-only-dirty']);
  assert.equal(result.status, 0, `return should succeed with only the subdirectory's .fgos/ dirty: ${result.stderr}`);
  assert.equal(stateView(cwd).work['sub-return-fgos-only-dirty'].status, 'awaiting-approval');
});

test('return succeeds when cwd is a subdirectory and an unrelated file is dirty ELSEWHERE in the repo, outside cwd\'s own subtree', () => {
  const { cwd, topLevel } = initGitCwdInSubdir();
  run(cwd, ['init']);
  addOk(cwd, 'sub-return-scope-ok', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'sub-return-scope-ok']).status, 0);

  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'work\n');
  execFileSync('git', ['add', 'proof.txt'], { cwd });
  execFileSync('git', ['commit', '-q', '-m', 'work: proof.txt'], { cwd });

  // A different in-flight change elsewhere in the repo, unrelated to this
  // item, never staged/committed — must never block returning THIS item.
  fs.writeFileSync(path.join(topLevel, 'unrelated-elsewhere.txt'), 'unrelated\n');

  const result = run(cwd, ['return', 'sub-return-scope-ok']);
  assert.equal(result.status, 0, `an unrelated dirty file outside cwd's subtree must never block return: ${result.stderr}`);
  assert.equal(stateView(cwd).work['sub-return-scope-ok'].status, 'awaiting-approval');
});

test('return still refuses when cwd is a subdirectory and a non-.fgos file is dirty INSIDE cwd\'s own subtree (real dirt still caught, does not overcorrect)', () => {
  const { cwd } = initGitCwdInSubdir();
  run(cwd, ['init']);
  addOk(cwd, 'sub-return-dirty', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'sub-return-dirty']).status, 0);
  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'uncommitted\n'); // never git add/commit

  const result = run(cwd, ['return', 'sub-return-dirty']);
  assert.equal(result.status, 4);
  assert.equal(stateView(cwd).work['sub-return-dirty'].status, 'doing');
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

test('return --no-new-commits-ok closes out a main-source claim whose HEAD already reflects fully-done, verify-passing work before this claim (tsk-4on) — succeeds, records aheadCount:0', () => {
  const cwd = tmpCwd();
  execFileSync('git', ['init', '-q'], { cwd });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd });
  fs.writeFileSync(path.join(cwd, '.gitignore'), '.fgos/\n');
  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'already done\n');
  execFileSync('git', ['add', '-A'], { cwd });
  execFileSync('git', ['commit', '-q', '-m', 'work already done before claim'], { cwd });

  run(cwd, ['init']);
  addOk(cwd, 'main-return-predone', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'main-return-predone']).status, 0);

  const result = run(cwd, ['return', 'main-return-predone', '--no-new-commits-ok']);
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  assert.match(result.stdout, /awaiting-approval/);
  const view = stateView(cwd);
  assert.equal(view.work['main-return-predone'].status, 'awaiting-approval');
  assert.equal(view.outcomes['main-return-predone'].actual.aheadCount, 0);
});

test('return --no-new-commits-ok never bypasses verify itself for a main-source claim — still parks doing -> blocked + friction when verify fails (tsk-4on)', () => {
  const cwd = tmpCwd();
  execFileSync('git', ['init', '-q'], { cwd });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd });
  fs.writeFileSync(path.join(cwd, '.gitignore'), '.fgos/\n');
  fs.writeFileSync(path.join(cwd, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', '-A'], { cwd });
  execFileSync('git', ['commit', '-q', '-m', 'seed'], { cwd });

  run(cwd, ['init']);
  addOk(cwd, 'main-return-flag-verify-fail', { verify: 'test -f proof.txt' }); // never created
  assert.equal(run(cwd, ['take', '--id', 'main-return-flag-verify-fail']).status, 0);

  const result = run(cwd, ['return', 'main-return-flag-verify-fail', '--no-new-commits-ok']);
  assert.equal(result.status, 0, `return should exit 0 for a defined blocked outcome: ${result.stderr}`);
  assert.equal(envelopeData(result.stdout).to, 'blocked');
  const view = stateView(cwd);
  assert.equal(view.work['main-return-flag-verify-fail'].status, 'blocked');
  assert.equal(view.outcomes['main-return-flag-verify-fail'].actual.outcome, 'blocked');
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

test("return verify-fail: park edge stamps role 'system' (not human) on the doing -> blocked event", () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-red-role', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-red-role']).status, 0);
  commitFile(cwd, 'wrong-file.txt'); // advances HEAD, but never satisfies verify

  const result = run(cwd, ['return', 'pull-return-red-role']);
  assert.equal(result.status, 0, `return should exit 0 for a defined blocked outcome: ${result.stderr}`);
  assert.equal(envelopeData(result.stdout).to, 'blocked');

  const lines = eventLines(cwd);
  const moveEvent = lines.map((l) => JSON.parse(l)).find((e) => e.type === 'work.move' && e.payload.to === 'blocked');
  assert.ok(moveEvent, 'expected a work.move event to blocked');
  assert.equal(moveEvent.payload.role, 'system');
});

test('return on an item that is not "doing" (still todo) is rejected as validation, exit 4', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-not-doing');
  const result = run(cwd, ['return', 'pull-return-not-doing']);
  assert.equal(result.status, 4);
});

test('return on an item claimed by the runner (claimRole "runner", no headAtTake) is rejected as validation — return only completes a take', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-runner-claim');
  const dir = path.join(cwd, '.fgos');
  moveWork(dir, { id: 'pull-return-runner-claim', to: 'doing', expectedStatus: 'todo', role: 'runner' });

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

// tsk-3vo D2/D3/D5: omitting --timeout on return/approve/catchup used to
// mean an unbounded verify, silently diverging from the runner loop's own
// runGoalCheck call (which always passes config.timeoutMs). It now falls
// back to .fgos-runner.json's own timeoutMs instead -- --no-timeout is the
// only way left to actually opt into unbounded. `hang.mjs` (same style as
// goal-check.test.mjs's own timeout test) sleeps 1.5s, well past the 200ms
// config timeout below, so a fallback that fires kills it and a real
// --no-timeout override does not.
function writeShortRunnerConfig(cwd, timeoutMs) {
  // Every DEFAULT_RUNNER_CONFIG key present (dispatch.mjs) so
  // ensureRunnerConfig's mergeConfigDefaults finds nothing missing to
  // rewrite -- an in-call rewrite would dirty the working tree and trip
  // return's own clean-tree check, unrelated to what this test proves.
  const cfg = {
    executor: { command: process.execPath, args: ['{prompt}'] },
    models: { light: 'haiku', standard: 'sonnet', heavy: 'opus' },
    timeoutMs,
    parallel: { maxRoots: 4, maxLeavesPerRoot: 4 },
  };
  fs.writeFileSync(path.join(cwd, '.fgos-runner.json'), JSON.stringify(cfg));
}

function writeHangScript(cwd, ms) {
  const scriptPath = path.join(cwd, 'hang.mjs');
  fs.writeFileSync(scriptPath, `const until = Date.now() + ${ms}; while (Date.now() < until) { /* busy-wait */ }`);
  return scriptPath;
}

test('return omitting --timeout falls back to .fgos-runner.json\'s timeoutMs, blocking a verify that outlives it', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  writeShortRunnerConfig(cwd, 200);
  const scriptPath = writeHangScript(cwd, 1500);
  addOk(cwd, 'pull-return-fallback-timeout', { verify: `${process.execPath} ${JSON.stringify(scriptPath)}` });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-fallback-timeout']).status, 0);
  commitFile(cwd, 'proof.txt');

  const result = run(cwd, ['return', 'pull-return-fallback-timeout']);
  assert.equal(result.status, 0, `return should exit 0 for a defined blocked outcome: ${result.stderr}`);
  assert.equal(envelopeData(result.stdout).to, 'blocked', 'the 200ms fallback timeout should have killed the 1.5s verify');
  assert.equal(stateView(cwd).work['pull-return-fallback-timeout'].status, 'blocked');
});

test('return --no-timeout opts out of the fallback, letting a verify that outlives the config timeout finish and pass', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  writeShortRunnerConfig(cwd, 200);
  const scriptPath = writeHangScript(cwd, 500);
  addOk(cwd, 'pull-return-no-timeout', { verify: `${process.execPath} ${JSON.stringify(scriptPath)}` });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-no-timeout']).status, 0);
  commitFile(cwd, 'proof.txt');

  const result = run(cwd, ['return', 'pull-return-no-timeout', '--no-timeout']);
  assert.equal(result.status, 0, `return should succeed: ${result.stderr}`);
  assert.equal(envelopeData(result.stdout).to, 'awaiting-approval', '--no-timeout should have let the 500ms verify finish past the 200ms config timeout');
  assert.equal(stateView(cwd).work['pull-return-no-timeout'].status, 'awaiting-approval');
});

test('return --timeout and --no-timeout together are rejected as validation, exit 4', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-timeout-conflict', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-timeout-conflict']).status, 0);
  commitFile(cwd, 'proof.txt');

  const result = run(cwd, ['return', 'pull-return-timeout-conflict', '--timeout', '1000', '--no-timeout']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /mutually exclusive/);
  assert.equal(stateView(cwd).work['pull-return-timeout-conflict'].status, 'doing', 'a rejected flag combination never runs verify or moves the item');
});

test('return --timeout error text no longer claims omitting --timeout means no timeout', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'pull-return-timeout-error-text', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'pull-return-timeout-error-text']).status, 0);
  commitFile(cwd, 'proof.txt');

  // A bare --timeout (no value, last arg) is what actually triggers this
  // specific message -- 'soon' fails the separate numeric-check message
  // instead, which never carried the old "omit ... for no timeout" wording.
  const result = run(cwd, ['return', 'pull-return-timeout-error-text', '--timeout']);
  assert.equal(result.status, 4);
  assert.doesNotMatch(result.stderr, /omit --timeout entirely for no timeout/);
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

/** A tiny local package (tsk-2vd) — an absolute `file:` dependency resolves
 * entirely offline, no registry/network hit, so the return-with-a-real-
 * dependency test stays fast and deterministic. */
function mkLocalDependency() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-cli-test-localdep-'));
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'fgos-test-localdep', version: '1.0.0' }));
  fs.writeFileSync(path.join(dir, 'index.js'), 'module.exports = {};\n');
  return dir;
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

// Advance a proposed runner/pull item through the compound-learn stage (D3)
// and fold the resulting stage event into main's commit, so the tree stays
// clean and `approve` can close it to done. Mirrors the state a real
// compound-learn transition leaves behind for a git-backed proposed item.
// Folds pending .fgos/ state (deps/claim/propose events) into a real git
// commit before approve's own clean-tree gate — the compound-learn stage
// (and its `compound` verb) is retired (work-item-status-delivered-
// retrospective-cleanup D11), so this no longer advances any stage, only
// commits. Some callers' setup (e.g. makeRunnerProposedItem) already
// commits its own pending state, leaving nothing dirty here — `git commit`
// with nothing staged exits nonzero, so skip when the tree is already
// clean instead of always committing unconditionally.
function commitPendingBeforeApprove(cwd, id) {
  const status = execFileSync('git', ['status', '--porcelain'], { cwd, encoding: 'utf8' });
  if (status.trim() === '') return;
  commitPending(cwd, `state: propose ${id}`);
}

// Simulates what the real runner (loop.mjs/worktree.mjs) leaves behind for a
// runner-source proposed item: a live `fgw/<id>` branch carrying a real
// commit, with the item's own status independently moved to `proposed`
// through the normal doing -> awaiting-approval edge — these CLI tests never invoke
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

  run(cwd, ['move', id, '--to', 'awaiting-approval']);
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

  run(cwd, ['move', leafId, '--to', 'awaiting-approval']);
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
  const cwd = rawTmpCwd();
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

test('evolve --pick with a bare flag (no value) is refused as validation, not a re-prompt', () => {
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
  run(cwd, ['move', 'review-legacy-item', '--to', 'awaiting-approval']);

  const result = run(cwd, ['review', 'review-legacy-item']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.source, 'legacy');
  assert.match(data.warnings.join('\n'), /no live diff source/);
});

test('review of a leaf proposed item diffs against its resolved root branch (fgw/<root>), not main', () => {
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

test('review of a root proposed item is unchanged — still diffs against main (regression)', () => {
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

test('approve of a runner item (happy path): merges fgw/<id> into main, verifies, awaiting-approval -> delivered with role human, and the branch SURVIVES (tsk-1p9: cleanup deferred to the cleanup verb)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'approve-runner-item', { verify: 'test -f approve-runner-item-produced.txt' });
  commitPendingBeforeApprove(cwd, 'approve-runner-item');

  const result = run(cwd, ['approve', 'approve-runner-item']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(envelopeData(result.stdout).to, 'delivered');
  assert.equal('cleanupWarnings' in envelopeData(result.stdout), false, 'approve no longer performs branch/worktree cleanup itself (tsk-1p9 D1)');

  const view = stateView(cwd);
  assert.equal(view.work['approve-runner-item'].status, 'delivered');
  // The 'close' settlement (RUL20) fires on the actual done-close only —
  // now cleanup->done (work-item-status-delivered-retrospective-cleanup
  // D1/D4), not on approve reaching delivered — so no settlement exists
  // yet at this point in the sequence.
  assert.equal(view.settlements?.['approve-runner-item'], undefined);
  assert.ok(fs.existsSync(path.join(cwd, 'approve-runner-item-produced.txt')), 'the merged file must be present on main');

  const branches = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/fgw/']);
  assert.match(branches, /fgw\/approve-runner-item/, 'the merged branch must survive approve — deleted later by the cleanup verb, not here');
});

test('approve of a runner item succeeds when ONLY .fgos/ (the live event log) is dirty on main — no more manual events.jsonl commit before every approve', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'approve-fgos-only-dirty', { verify: 'test -f approve-fgos-only-dirty-produced.txt' });
  commitPendingBeforeApprove(cwd, 'approve-fgos-only-dirty');

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
  assert.equal(stateView(cwd).work['approve-fgos-only-dirty'].status, 'delivered');
});

test('approve of a runner item succeeds when a dirty file on main is UNRELATED to the item (tsk-598 D1/D2) — own-file-set scoping, not a whole-tree gate', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'approve-unrelated-dirty', { verify: 'test -f approve-unrelated-dirty-produced.txt' });
  commitPendingBeforeApprove(cwd, 'approve-unrelated-dirty');

  // A path the item's own branch-vs-trunk diff never touches — another
  // session's uncommitted work sitting on main, the exact repro shape
  // tsk-598 was filed for (tsk-veg's approve blocked by unrelated docs/
  // plans/ files from a different session).
  fs.writeFileSync(path.join(cwd, 'scratch.txt'), 'unrelated uncommitted work\n'); // never git add/commit

  const result = run(cwd, ['approve', 'approve-unrelated-dirty']);
  assert.equal(result.status, 0, `approve should succeed past an unrelated dirty file: ${result.stderr}`);
  assert.equal(stateView(cwd).work['approve-unrelated-dirty'].status, 'delivered');
  assert.equal(fs.readFileSync(path.join(cwd, 'scratch.txt'), 'utf8'), 'unrelated uncommitted work\n', 'the unrelated dirty file must be left untouched, still uncommitted');
});

test('approve of a runner item still refuses when the SAME path the item touched is dirty again on main — a real conflict, tsk-598 D2, exit 4, item stays proposed', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'approve-real-conflict', { verify: 'test -f approve-real-conflict-produced.txt' });
  commitPendingBeforeApprove(cwd, 'approve-real-conflict');

  // approve-real-conflict-produced.txt IS in this item's own branch-vs-trunk
  // diff (makeRunnerProposedItem committed it on fgw/approve-real-conflict);
  // re-dirtying that SAME path on main after propose is a real conflict —
  // own-file-set membership still blocks it, unchanged from before tsk-598.
  fs.writeFileSync(path.join(cwd, 'approve-real-conflict-produced.txt'), 'clobbered by another writer\n'); // never git add/commit

  const result = run(cwd, ['approve', 'approve-real-conflict']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /not clean/);
  assert.equal(stateView(cwd).work['approve-real-conflict'].status, 'awaiting-approval');
});

test('approve of a runner item with a declared footprint still refuses on an uncommitted footprint path (tsk-598 D3) even though it was never committed to the branch', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'approve-footprint-dirty', {
    verify: 'test -f approve-footprint-dirty-produced.txt',
    footprint: 'footprint-guarded.txt',
  });
  commitPendingBeforeApprove(cwd, 'approve-footprint-dirty');

  // footprint-guarded.txt was never committed to fgw/approve-footprint-dirty
  // (so it is absent from the item's own committed diff) — only DECLARED in
  // item.footprint. Per D3, a footprint path still blocks even uncommitted,
  // protecting against exactly the "forgot to add it" gap a committed-diff-
  // only own-file-set would silently let through.
  fs.writeFileSync(path.join(cwd, 'footprint-guarded.txt'), 'forgot to commit this\n'); // never git add/commit

  const result = run(cwd, ['approve', 'approve-footprint-dirty']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /not clean/);
  assert.equal(stateView(cwd).work['approve-footprint-dirty'].status, 'awaiting-approval');
});

test('approve of a leaf item with a clean merge lands the work on fgw/<root> (not main) via an ephemeral worktree, leaf -> delivered, fgw/<leaf> SURVIVES the approve (tsk-1p9: teardown deferred to the cleanup verb), fgw/<root> survives', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedLeafItem(cwd, 'approve-leaf-root', 'approve-leaf-child', { verify: 'test -f approve-leaf-child-produced.txt' });
  commitPendingBeforeApprove(cwd, 'approve-leaf-child');

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['approve', 'approve-leaf-child']);
  assert.equal(result.status, 0, result.stderr);
  const approveData = envelopeData(result.stdout);
  assert.equal(approveData.branch, 'fgw/approve-leaf-child');
  assert.equal(approveData.target, 'fgw/approve-leaf-root');
  assert.equal(approveData.to, 'delivered');
  assert.equal('cleanupWarnings' in approveData, false, 'approve no longer performs branch/worktree cleanup itself (tsk-1p9 D1)');

  // main must never be touched by a leaf approve.
  assert.equal(gitHead(cwd), headBefore, 'main HEAD must be unchanged by a leaf approve');
  assert.equal(
    fs.existsSync(path.join(cwd, 'approve-leaf-child-produced.txt')),
    false,
    'the leaf\'s produced file must not land on the human\'s own main checkout',
  );

  const view = stateView(cwd);
  assert.equal(view.work['approve-leaf-child'].status, 'delivered');

  // fgw/<leaf> must SURVIVE right after approve (tsk-1p9, restore-to-decision:
  // teardown is deferred to the `cleanup` verb, gated by D7's TTL and D8's
  // harness — no longer synchronous with merge).
  const branches = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/fgw/']);
  assert.match(branches, /fgw\/approve-leaf-child\b/, 'the leaf\'s own branch must survive approve — deleted later by the cleanup verb, not here');
  assert.match(branches, /fgw\/approve-leaf-root\b/, 'the root\'s own integration branch must survive');

  // the merged content must actually be present on fgw/<root>'s tip.
  const rootTreeFile = gitAtCwd(cwd, ['show', 'fgw/approve-leaf-root:approve-leaf-child-produced.txt']);
  assert.match(rootTreeFile, /ok/);
});

test('approve of a runner item that conflicts: aborts the merge, awaiting-approval -> blocked (reason merge-conflict), main left byte-for-byte unchanged (must_have: main never holds a broken merge commit)', () => {
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

  run(cwd, ['move', 'approve-conflict-item', '--to', 'awaiting-approval']);
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

test('approve of a runner item whose staged merge fails its own verify: aborts, awaiting-approval -> blocked (reason verify-fail-post-merge), main left unchanged', () => {
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

test('approve of a root item that HAD children, whose merge into main conflicts, parks with the distinguishing reason integration-drift and a main@<sha> friction detail', () => {
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

  run(cwd, ['move', 'drift-root-item', '--to', 'awaiting-approval']);
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

test('approve of a pull-door item (no merge, code already on main): re-verifies and closes awaiting-approval -> done with role human', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'approve-pull-item', { verify: 'test -f proof.txt' });
  run(cwd, ['take', '--id', 'approve-pull-item']);
  commitFile(cwd, 'proof.txt');
  run(cwd, ['return', 'approve-pull-item']);
  commitPendingBeforeApprove(cwd, 'approve-pull-item');

  const result = run(cwd, ['approve', 'approve-pull-item']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(envelopeData(result.stdout).to, 'delivered');

  const view = stateView(cwd);
  assert.equal(view.work['approve-pull-item'].status, 'delivered');
  // No 'close' settlement yet -- that fires at cleanup->done, not delivered.
  assert.equal(view.settlements?.['approve-pull-item'], undefined);
});

test('approve of a legacy item with a failing verify: blocked (reason verify-fail), not merge-related, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'approve-legacy-fail-item', { verify: 'false' });
  run(cwd, ['move', 'approve-legacy-fail-item', '--to', 'doing']);
  run(cwd, ['move', 'approve-legacy-fail-item', '--to', 'awaiting-approval']);

  const result = run(cwd, ['approve', 'approve-legacy-fail-item']);
  assert.equal(result.status, 0, result.stderr);
  const legacyFailData = envelopeData(result.stdout);
  assert.equal(legacyFailData.to, 'blocked');
  assert.equal(legacyFailData.reason, 'verify-fail');

  const view = stateView(cwd);
  assert.equal(view.work['approve-legacy-fail-item'].status, 'blocked');
});

test("approve verify-fail (legacy item): park edge stamps role 'system' (not human) on the awaiting-approval -> blocked event", () => {
  const cwd = tmpCwd();
  addOk(cwd, 'approve-legacy-fail-role-item', { verify: 'false' });
  run(cwd, ['move', 'approve-legacy-fail-role-item', '--to', 'doing']);
  run(cwd, ['move', 'approve-legacy-fail-role-item', '--to', 'awaiting-approval']);

  const result = run(cwd, ['approve', 'approve-legacy-fail-role-item']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(envelopeData(result.stdout).to, 'blocked');

  const lines = eventLines(cwd);
  const moveEvent = lines.map((l) => JSON.parse(l)).find((e) => e.type === 'work.move' && e.payload.to === 'blocked');
  assert.ok(moveEvent, 'expected a work.move event to blocked');
  assert.equal(moveEvent.payload.role, 'system');
});

test('approve of a legacy item with a passing verify closes it to done — legacy degrade never blocks approve/reject from working (must_have)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'approve-legacy-ok-item', { verify: 'true' });
  run(cwd, ['move', 'approve-legacy-ok-item', '--to', 'doing']);
  run(cwd, ['move', 'approve-legacy-ok-item', '--to', 'awaiting-approval']);

  const result = run(cwd, ['approve', 'approve-legacy-ok-item']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(stateView(cwd).work['approve-legacy-ok-item'].status, 'delivered');
});

// tsk-3vo D5: same shared --timeout/--no-timeout resolution as `return`
// (resolveVerifyTimeoutMs), wired into `approve` too — must reject the same
// way, before any verify runs.
test('approve --timeout and --no-timeout together are rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'approve-timeout-conflict', { verify: 'true' });
  run(cwd, ['move', 'approve-timeout-conflict', '--to', 'doing']);
  run(cwd, ['move', 'approve-timeout-conflict', '--to', 'awaiting-approval']);

  const result = run(cwd, ['approve', 'approve-timeout-conflict', '--timeout', '1000', '--no-timeout']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /mutually exclusive/);
  assert.equal(stateView(cwd).work['approve-timeout-conflict'].status, 'awaiting-approval', 'a rejected flag combination never runs verify or moves the item');
});

test('approve twice: the second approve on an already-done item is rejected as precondition, exit 2 (done is terminal)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'approve-twice-item', { verify: 'true' });
  run(cwd, ['move', 'approve-twice-item', '--to', 'doing']);
  run(cwd, ['move', 'approve-twice-item', '--to', 'awaiting-approval']);
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

  run(cwd, ['move', id, '--to', 'awaiting-approval']);
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
  assert.equal(view.work['iron-refuse-item'].status, 'awaiting-approval', 'a refused approve leaves the item proposed');
  assert.equal(gitHead(cwd), headBefore, 'a refused approve attempts no merge — HEAD is unchanged');
  const survivingBranches = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/']);
  assert.match(survivingBranches, /fgw\/iron-refuse-item/, 'the branch survives an Iron Law refusal — nothing was merged or cleaned up');
});

test('approve --acknowledge-iron-law false (a value form, not the bare flag) still REFUSES -- fail-closed, review-20260718-self-improve-loop f02', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItemTouching(cwd, 'iron-ack-false-item', 'src/runner/probe.mjs', {
    verify: 'test -f src/runner/probe.mjs',
  });

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['approve', 'iron-ack-false-item', '--acknowledge-iron-law', 'false']);
  assert.equal(result.status, 4, `a value form must refuse exactly like no flag at all: ${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /Iron Law/);

  const view = stateView(cwd);
  assert.equal(view.work['iron-ack-false-item'].status, 'awaiting-approval');
  assert.equal(gitHead(cwd), headBefore);
});

test('approve of the same self-modifying diff PROCEEDS with --acknowledge-iron-law: merges, verifies, awaiting-approval -> delivered, branch SURVIVES (tsk-1p9: cleanup deferred to the cleanup verb)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItemTouching(cwd, 'iron-ack-item', 'src/runner/probe.mjs', {
    verify: 'test -f src/runner/probe.mjs',
  });
  commitPendingBeforeApprove(cwd, 'iron-ack-item');

  const result = run(cwd, ['approve', 'iron-ack-item', '--acknowledge-iron-law']);
  assert.equal(result.status, 0, `approve with acknowledgment must succeed: ${result.stderr}`);
  assert.equal(envelopeData(result.stdout).to, 'delivered');

  const view = stateView(cwd);
  assert.equal(view.work['iron-ack-item'].status, 'delivered');
  // No 'close' settlement yet -- that fires at cleanup->done, not delivered.
  assert.equal(view.settlements?.['iron-ack-item'], undefined);
  assert.ok(fs.existsSync(path.join(cwd, 'src/runner/probe.mjs')), 'the merged module file is present on main');
  const branches = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/']);
  assert.match(branches, /fgw\/iron-ack-item/, 'the merged branch must survive approve — deleted later by the cleanup verb, not here');
});

test('approve of an ordinary runner item (diff touches no self-modifying module) is UNAFFECTED — proceeds to done with no --acknowledge-iron-law flag (backward compatibility)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItemTouching(cwd, 'iron-plain-item', 'docs/notes.txt', {
    verify: 'test -f docs/notes.txt',
  });
  commitPendingBeforeApprove(cwd, 'iron-plain-item');

  const result = run(cwd, ['approve', 'iron-plain-item']);
  assert.equal(result.status, 0, `an ordinary diff must approve without any acknowledgment: ${result.stderr}`);
  assert.equal(envelopeData(result.stdout).to, 'delivered');
  assert.doesNotMatch(result.stdout, /Iron Law/);
  assert.equal(stateView(cwd).work['iron-plain-item'].status, 'delivered');
});

// tsk-4voj-iron-law-leaf-scope CONTEXT.md D1: the Iron Law's own
// changedFiles input now diffs a leaf against its resolved root's branch
// (the same D3 leaf-vs-root split `approve`'s merge target and `review`'s
// diff already use), not blind trunk. Before this fix, a leaf forked AFTER
// a sibling already merged a gated-module change into the root inherited
// that sibling's files as if they were its own -- live-reproduced on
// tsk-52g-2. These two tests prove the false-positive is closed (below)
// without under-scoping a leaf's own genuine hit (further below).

test('approve of a leaf item forked AFTER a sibling already merged a gated-module change into the root does NOT trip Iron Law on the ancestor\'s file (tsk-4voj false-positive closed)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);

  const rootId = 'iron-leaf-root';
  const leafId = 'iron-leaf-child';
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: rootId, title: `Title ${rootId}`, kind: 'task', status: 'todo', deps: [], risk: 'low', refs: [], verify: 'true' });
  commitPending(cwd, `state: add ${rootId}`);
  gitAtCwd(cwd, ['branch', `fgw/${rootId}`, 'main']);

  // A sibling child's already-merged gated-module change, landed on the
  // root's own integration branch BEFORE this leaf forks from it -- the
  // exact tsk-52g-2 shape.
  gitAtCwd(cwd, ['checkout', `fgw/${rootId}`]);
  fs.mkdirSync(path.join(cwd, 'src/runner'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'src/runner/sibling-produced.mjs'), 'export const sibling = true;\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'sibling child merged into root (already has its own evidence elsewhere)']);
  gitAtCwd(cwd, ['checkout', 'main']);

  addWork(dir, {
    id: leafId, title: `Title ${leafId}`, kind: 'task', status: 'todo', deps: [], risk: 'low', refs: [],
    verify: 'test -f docs/leaf-note.txt', parent: rootId,
  });
  run(cwd, ['move', leafId, '--to', 'doing']);
  commitPending(cwd, `state: claim ${leafId}`);

  gitAtCwd(cwd, ['checkout', '-b', `fgw/${leafId}`, `fgw/${rootId}`]);
  fs.mkdirSync(path.join(cwd, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs/leaf-note.txt'), 'ok\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', `worker output for ${leafId}`]);
  gitAtCwd(cwd, ['checkout', 'main']);

  run(cwd, ['move', leafId, '--to', 'awaiting-approval']);
  commitPendingBeforeApprove(cwd, leafId);

  const result = run(cwd, ['approve', leafId]);
  assert.equal(result.status, 0, `leaf's own diff never touches a gated module -- must approve without --acknowledge-iron-law: ${result.stdout}${result.stderr}`);
  assert.doesNotMatch(result.stdout, /Iron Law/);
  assert.equal(stateView(cwd).work[leafId].status, 'delivered');
});

test('approve of a leaf item whose OWN commit touches a gated module (src/runner/**) still REFUSES without --acknowledge-iron-law, even with leaf-scoped diff (tsk-4voj D1 does not under-scope)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);

  const rootId = 'iron-leaf-genuine-root';
  const leafId = 'iron-leaf-genuine-child';
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: rootId, title: `Title ${rootId}`, kind: 'task', status: 'todo', deps: [], risk: 'low', refs: [], verify: 'true' });
  commitPending(cwd, `state: add ${rootId}`);
  gitAtCwd(cwd, ['branch', `fgw/${rootId}`, 'main']);

  addWork(dir, {
    id: leafId, title: `Title ${leafId}`, kind: 'task', status: 'todo', deps: [], risk: 'low', refs: [],
    verify: 'test -f src/runner/iron-leaf-genuine-child-produced.mjs', parent: rootId,
  });
  run(cwd, ['move', leafId, '--to', 'doing']);
  commitPending(cwd, `state: claim ${leafId}`);

  gitAtCwd(cwd, ['checkout', '-b', `fgw/${leafId}`, `fgw/${rootId}`]);
  fs.mkdirSync(path.join(cwd, 'src/runner'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'src/runner/iron-leaf-genuine-child-produced.mjs'), 'export const producedByLeaf = true;\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', `worker output for ${leafId}`]);
  gitAtCwd(cwd, ['checkout', 'main']);

  run(cwd, ['move', leafId, '--to', 'awaiting-approval']);
  commitPendingBeforeApprove(cwd, leafId);

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['approve', leafId]);
  assert.equal(result.status, 4, `leaf's own commit genuinely touches a gated module -- must still refuse: ${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /Iron Law/);
  assert.match(result.stderr, /src\/runner\/iron-leaf-genuine-child-produced\.mjs/, 'the refusal must name the leaf\'s own tripped module');
  assert.equal(gitHead(cwd), headBefore, 'a refused approve attempts no merge');
  assert.equal(stateView(cwd).work[leafId].status, 'awaiting-approval');
});

// --- sync-root (tsk-50i, docs/history/tsk-3bn-merge-conductor-harness-v2/) -
//
// Merges fgw/<root-id>'s current tip into its real target (main, or
// fgw/<parentId> for a nested root) WITHOUT changing the root item's own
// status/stage — unlike approve, which always advances an item's FSM
// status. Reuses mergeRunnerItem's exact lock/verify path (constraint #1
// from fgos-validating's feasibility gate).

// Simulates a root whose branch has already advanced past main (a leaf's
// work already landed on fgw/<rootId>, e.g. via approve's own leaf-into-root
// path) — the exact drift shape tsk-3bn's own origin incident reproduced.
// The root item's own status stays 'doing' throughout (a root mid-flight,
// not yet closed) — sync-root must never touch it.
function makeDriftedRoot(cwd, rootId, opts = {}) {
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: rootId, title: `Title ${rootId}`, kind: 'task', status: 'todo', deps: [], risk: 'low', refs: [], verify: opts.verify ?? 'true', ...(opts.parent ? { parent: opts.parent } : {}) });
  commitPending(cwd, `state: add ${rootId}`);
  run(cwd, ['move', rootId, '--to', 'doing']);
  commitPending(cwd, `state: claim ${rootId}`);

  gitAtCwd(cwd, ['checkout', '-b', `fgw/${rootId}`]);
  fs.writeFileSync(path.join(cwd, `${rootId}-produced.txt`), 'ok\n');
  gitAtCwd(cwd, ['add', `${rootId}-produced.txt`]);
  gitAtCwd(cwd, ['commit', '-q', '-m', `leaf work merged into fgw/${rootId}`]);
  gitAtCwd(cwd, ['checkout', 'main']);
}

test('sync-root on a nonexistent id is rejected as validation, exit 4', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  const result = run(cwd, ['sync-root', 'sync-root-ghost']);
  assert.equal(result.status, 4);
});

test('sync-root on a root with no fgw/<id> branch is rejected as validation, exit 4', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'sync-root-no-branch', { verify: 'true' });
  const result = run(cwd, ['sync-root', 'sync-root-no-branch']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /does not exist/);
});

test('sync-root happy path: merges fgw/<root> into main, root item status/stage UNCHANGED, fgw/<root> survives (not deleted)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeDriftedRoot(cwd, 'sync-root-happy', { verify: `test -f sync-root-happy-produced.txt` });
  commitPendingBeforeApprove(cwd, 'sync-root-happy');

  const result = run(cwd, ['sync-root', 'sync-root-happy']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.outcome, 'synced');
  assert.equal(data.target, 'main');
  assert.equal(data.branch, 'fgw/sync-root-happy');

  assert.ok(fs.existsSync(path.join(cwd, 'sync-root-happy-produced.txt')), 'the synced content must land on main');

  const view = stateView(cwd);
  assert.equal(view.work['sync-root-happy'].status, 'doing', 'sync-root must never change the root item\'s own status');

  const branches = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/fgw/']);
  assert.match(branches, /fgw\/sync-root-happy\b/, 'sync-root must NOT delete the root branch — it stays open for further leaf merges');
});

test('sync-root records a real decision on the root item', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeDriftedRoot(cwd, 'sync-root-decision', { verify: 'true' });
  commitPendingBeforeApprove(cwd, 'sync-root-decision');

  const result = run(cwd, ['sync-root', 'sync-root-decision']);
  assert.equal(result.status, 0, result.stderr);

  const lines = eventLines(cwd);
  const decisionEvents = lines.map((l) => JSON.parse(l)).filter((e) => e.type === 'decision' && e.payload?.id === 'sync-root-decision');
  assert.equal(decisionEvents.length, 1, 'sync-root must append exactly one real decision record');
  assert.match(decisionEvents[0].payload.text, /sync-root-decision|fgw\/sync-root-decision/);
});

test('sync-root nested: a root with a parent merges into fgw/<parentId>, not main; main stays untouched; the child root\'s status stays unchanged', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  // grandroot (target for the nested sync) is itself a plain root with a
  // real branch but no drift of its own.
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'sync-root-grandparent', title: 'Title grandparent', kind: 'task', status: 'todo', deps: [], risk: 'low', refs: [], verify: 'true' });
  commitPending(cwd, 'state: add grandparent');

  // fgw/<grandparent> must be cut AFTER the child's own state events (add +
  // claim, inside makeDriftedRoot) already landed on main — cutting it
  // earlier leaves fgw/child's later commits carrying a legitimate .fgos/
  // diff relative to fgw/grandparent (the child's add/claim events main
  // gained afterward), which mergeRunnerItem's ADR0020 guard correctly
  // refuses as fgos-write-rejected. Same ordering makeDriftedRoot's own
  // `checkout -b fgw/<rootId>` already relies on for its OWN branch.
  makeDriftedRoot(cwd, 'sync-root-nested-child', { parent: 'sync-root-grandparent', verify: `test -f sync-root-nested-child-produced.txt` });
  gitAtCwd(cwd, ['branch', 'fgw/sync-root-grandparent', 'main']);
  commitPendingBeforeApprove(cwd, 'sync-root-nested-child');

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['sync-root', 'sync-root-nested-child']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.target, 'fgw/sync-root-grandparent');

  assert.equal(gitHead(cwd), headBefore, 'main must be byte-for-byte unchanged by a nested sync-root');
  assert.equal(
    fs.existsSync(path.join(cwd, 'sync-root-nested-child-produced.txt')),
    false,
    'the nested child\'s content must not land on the human\'s own main checkout',
  );
  const producedOnParent = gitAtCwd(cwd, ['show', 'fgw/sync-root-grandparent:sync-root-nested-child-produced.txt']);
  assert.match(producedOnParent, /ok/);

  const view = stateView(cwd);
  assert.equal(view.work['sync-root-nested-child'].status, 'doing');
});

test('sync-root aborts cleanly on a genuine conflict: main left byte-for-byte unchanged, root status untouched', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeDriftedRoot(cwd, 'sync-root-conflict', { verify: 'true' });
  // Create a conflicting change on main AFTER the root branch forked, on
  // the exact same path the root's own commit touches.
  fs.writeFileSync(path.join(cwd, 'sync-root-conflict-produced.txt'), 'conflicting main content\n');
  gitAtCwd(cwd, ['add', 'sync-root-conflict-produced.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'unrelated main edit that collides']);
  commitPendingBeforeApprove(cwd, 'sync-root-conflict');

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['sync-root', 'sync-root-conflict']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.outcome, 'blocked');
  assert.equal(data.reason, 'merge-conflict');

  assert.equal(gitHead(cwd), headBefore, 'main must be byte-for-byte unchanged after an aborted sync-root');
  assert.equal(stateView(cwd).work['sync-root-conflict'].status, 'doing', 'a blocked sync-root must never touch the root item\'s status');
});

test('sync-root refuses from inside a linked worktree (must land on the real main checkout)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeDriftedRoot(cwd, 'sync-root-worktree-guard', { verify: 'true' });
  commitPendingBeforeApprove(cwd, 'sync-root-worktree-guard');

  const wtParent = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-cli-sync-root-wt-'));
  const wt = path.join(wtParent, 'wt');
  gitAtCwd(cwd, ['worktree', 'add', '-q', '-b', 'sync-root-side-branch', wt]);

  const result = spawnSync(process.execPath, [FGOS, 'sync-root', 'sync-root-worktree-guard'], { cwd: wt, encoding: 'utf8' });
  assert.equal(result.status, 4, result.stderr);
  assert.match(result.stderr, /main checkout/);

  gitAtCwd(cwd, ['worktree', 'remove', '--force', wt]);
});

// --- promote-to-component (tsk-3gx-3, docs/history/promote-to-component/) -
//
// Takes N flat sibling item ids (D2: caller's own explicit list) and
// converges them into one component: resolve/create a shared root (D1),
// merge each member's own branch into it (never a rebase, reusing
// mergeRunnerItem via tsk-3gx-2's engine), and set `parent` ONLY for a
// member whose real merge truly succeeded (never on say-so).

// Register a flat member's state (add + claim) WITHOUT cutting its branch
// yet. Split from the branch-cut step below so a multi-member test can fold
// every member's state onto ONE shared main commit before any branch
// exists — cutting branches at different points in main's history would
// leave their .fgos/events.jsonl content genuinely diverged (each branch
// carrying a different subset of add/claim events), which mergeRunnerItem's
// real ADR0020 guard correctly refuses as a staged .fgos/ change. A
// single-member test can use makeFlatMember below instead, where this
// distinction never matters.
function registerFlatMember(cwd, id, opts = {}) {
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id, title: `Title ${id}`, kind: 'task', status: 'todo', deps: opts.deps ?? [], mergeAfter: opts.mergeAfter, risk: 'low', refs: [], verify: opts.verify ?? 'true' });
  run(cwd, ['move', id, '--to', 'doing']);
}

// Cut `id`'s own `fgw/<id>` branch from whatever main currently is, with one
// real commit. Callers with more than one member must commitPending() all
// registerFlatMember() calls first, THEN cut every branch — see the comment
// above.
function cutMemberBranch(cwd, id) {
  gitAtCwd(cwd, ['checkout', '-b', `fgw/${id}`]);
  fs.writeFileSync(path.join(cwd, `${id}-produced.txt`), 'ok\n');
  gitAtCwd(cwd, ['add', `${id}-produced.txt`]);
  gitAtCwd(cwd, ['commit', '-q', '-m', `work for ${id}`]);
  gitAtCwd(cwd, ['checkout', 'main']);
}

// A plain flat member: its own `fgw/<id>` branch exists with one real
// commit, item status stays 'doing' (claimed, mid-flight — no parent set).
// Safe for single-member setups; a multi-member test that needs the merged
// branches to actually share history should use registerFlatMember +
// cutMemberBranch directly instead (see their own comments above).
function makeFlatMember(cwd, id, opts = {}) {
  registerFlatMember(cwd, id, opts);
  commitPending(cwd, `state: setup ${id}`);
  cutMemberBranch(cwd, id);
}

test('promote-to-component requires at least 2 ids, exit 4', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeFlatMember(cwd, 'ptc-solo-a');

  const result = run(cwd, ['promote-to-component', '--ids', 'ptc-solo-a', '--root-title', 'Component solo']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /at least 2/);
});

test('promote-to-component on a nonexistent member id is rejected as validation, exit 4', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeFlatMember(cwd, 'ptc-real-a');

  const result = run(cwd, ['promote-to-component', '--ids', 'ptc-real-a,ptc-ghost', '--root-title', 'Component ghost']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /ptc-ghost.*not found/);
});

test('promote-to-component refuses a member that already has a parent, exit 4', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeFlatMember(cwd, 'ptc-sibling');
  makeFlatMember(cwd, 'ptc-already-parented', { deps: ['ptc-sibling'] });
  editWork(path.join(cwd, '.fgos'), { id: 'ptc-already-parented', patch: { parent: 'some-other-root' } });
  commitPending(cwd, 'state: pre-parent ptc-already-parented');

  const result = run(cwd, ['promote-to-component', '--ids', 'ptc-already-parented,ptc-sibling', '--root-title', 'Component reject']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /already has parent/);
});

test('promote-to-component refuses ids that are not connected via deps/mergeAfter, exit 4', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeFlatMember(cwd, 'ptc-disconnected-a');
  makeFlatMember(cwd, 'ptc-disconnected-b');

  const result = run(cwd, ['promote-to-component', '--ids', 'ptc-disconnected-a,ptc-disconnected-b', '--root-title', 'Component disconnected']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /not all connected/);
});

test('promote-to-component happy path (D1 new-item): creates a fresh root, merges both members into it, sets parent only after real success, records one decision', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  registerFlatMember(cwd, 'ptc-new-root-a');
  registerFlatMember(cwd, 'ptc-new-root-b', { deps: ['ptc-new-root-a'] });
  commitPending(cwd, 'state: setup ptc-new-root members');
  cutMemberBranch(cwd, 'ptc-new-root-a');
  cutMemberBranch(cwd, 'ptc-new-root-b');

  const result = run(cwd, ['promote-to-component', '--ids', 'ptc-new-root-a,ptc-new-root-b', '--root-title', 'Component new root']);
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(result.stdout).data;
  assert.equal(data.rootCreated, true);
  assert.equal(data.results.find((r) => r.id === 'ptc-new-root-a').outcome, 'merged');
  assert.equal(data.results.find((r) => r.id === 'ptc-new-root-b').outcome, 'merged');

  const view = stateView(cwd);
  assert.equal(view.work['ptc-new-root-a'].parent, data.rootId);
  assert.equal(view.work['ptc-new-root-b'].parent, data.rootId);
  assert.equal(view.work[data.rootId].status, 'todo', 'a freshly created root is not claimed by this action');

  const rootFiles = gitAtCwd(cwd, ['ls-tree', '-r', '--name-only', `fgw/${data.rootId}`]);
  assert.match(rootFiles, /ptc-new-root-a-produced\.txt/);
  assert.match(rootFiles, /ptc-new-root-b-produced\.txt/);

  const decisionEvents = eventLines(cwd).map((l) => JSON.parse(l)).filter((e) => e.type === 'decision' && e.payload?.id === data.rootId);
  assert.equal(decisionEvents.length, 1, 'promote-to-component must append exactly one real decision record');
  assert.match(decisionEvents[0].payload.text, /ptc-new-root-a/);
  assert.match(decisionEvents[0].payload.text, /ptc-new-root-b/);
});

test('promote-to-component happy path (D1 reuse-member): promotes an existing member to root, root itself is skipped not merged', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  // Connectivity edge direction matters here: buildUnifiedAdjacency
  // (src/state/dep-graph.mjs) adds parent -> child for a `parent` edge and
  // id -> target for both `deps` and `mergeAfter` — the SAME direction.
  // Promoting ptc-reuse-root to root sets ptc-reuse-other.parent =
  // 'ptc-reuse-root' (edge root -> other); if the connectivity edge were
  // ptc-reuse-other -> ptc-reuse-root (either field), that closes a real
  // cycle (see the dedicated merged-parent-rejected test below). Declaring
  // the edge on the ROOT side instead (root -> other) matches the parent
  // edge's own direction, so no cycle — this is the genuine happy path.
  registerFlatMember(cwd, 'ptc-reuse-other');
  registerFlatMember(cwd, 'ptc-reuse-root', { mergeAfter: ['ptc-reuse-other'] });
  commitPending(cwd, 'state: setup ptc-reuse members');
  cutMemberBranch(cwd, 'ptc-reuse-root');
  cutMemberBranch(cwd, 'ptc-reuse-other');

  const result = run(cwd, ['promote-to-component', '--ids', 'ptc-reuse-root,ptc-reuse-other', '--root-id', 'ptc-reuse-root']);
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(result.stdout).data;
  assert.equal(data.rootCreated, false);
  assert.equal(data.rootId, 'ptc-reuse-root');
  assert.equal(data.results.find((r) => r.id === 'ptc-reuse-root').outcome, 'skipped');
  assert.equal(data.results.find((r) => r.id === 'ptc-reuse-other').outcome, 'merged');

  const view = stateView(cwd);
  assert.equal(view.work['ptc-reuse-other'].parent, 'ptc-reuse-root');
  assert.equal(view.work['ptc-reuse-root'].parent, undefined, 'root never sets its own parent to itself');

  const rootFiles = gitAtCwd(cwd, ['ls-tree', '-r', '--name-only', 'fgw/ptc-reuse-root']);
  assert.match(rootFiles, /ptc-reuse-other-produced\.txt/);
});

test('promote-to-component reports merged-parent-rejected (never crashes) when the real git merge succeeds but setting parent would close a deps+parent cycle', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  registerFlatMember(cwd, 'ptc-cycle-root');
  // deps (not mergeAfter) deliberately: ptc-cycle-other depends on the very
  // item this test promotes to root, so setting ptc-cycle-other.parent =
  // 'ptc-cycle-root' afterward closes a real deps+parent cycle
  // (assertNoUnifiedCycle) — the exact failure mode the try/catch around
  // editWork above exists for.
  registerFlatMember(cwd, 'ptc-cycle-other', { deps: ['ptc-cycle-root'] });
  commitPending(cwd, 'state: setup ptc-cycle members');
  cutMemberBranch(cwd, 'ptc-cycle-root');
  cutMemberBranch(cwd, 'ptc-cycle-other');

  const result = run(cwd, ['promote-to-component', '--ids', 'ptc-cycle-root,ptc-cycle-other', '--root-id', 'ptc-cycle-root']);
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(result.stdout).data;
  const otherResult = data.results.find((r) => r.id === 'ptc-cycle-other');
  assert.equal(otherResult.outcome, 'merged-parent-rejected');
  assert.match(otherResult.reason, /graph cycle/);

  // The real git merge landed regardless of the state-layer rejection —
  // this outcome exists precisely because git succeeded where state didn't.
  const rootFiles = gitAtCwd(cwd, ['ls-tree', '-r', '--name-only', 'fgw/ptc-cycle-root']);
  assert.match(rootFiles, /ptc-cycle-other-produced\.txt/);

  const view = stateView(cwd);
  assert.equal(view.work['ptc-cycle-other'].parent, undefined, 'a rejected parent-set never silently applies anyway');

  const decisionEvents = eventLines(cwd).map((l) => JSON.parse(l)).filter((e) => e.type === 'decision' && e.payload?.id === data.rootId);
  assert.equal(decisionEvents.length, 1, 'a per-member rejection still gets exactly one real decision record');
  assert.match(decisionEvents[0].payload.text, /ptc-cycle-other/);
});

test('promote-to-component bails a conflicting member without setting its parent, still processes and merges the rest', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);

  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'ptc-conflict-b', title: 'Title conflict b', kind: 'task', status: 'todo', deps: [], risk: 'low', refs: [], verify: 'true' });
  addWork(dir, { id: 'ptc-conflict-a', title: 'Title conflict a', kind: 'task', status: 'todo', deps: ['ptc-conflict-b'], risk: 'low', refs: [], verify: 'true' });
  commitPending(cwd, 'state: add ptc-conflict members');
  run(cwd, ['move', 'ptc-conflict-a', '--to', 'doing']);
  run(cwd, ['move', 'ptc-conflict-b', '--to', 'doing']);
  commitPending(cwd, 'state: claim ptc-conflict members');

  // ptc-conflict-a edits seed.txt one way; the fresh root (branched from
  // current main) will independently... actually the root is created AFTER
  // this, from main's current tip, so give the root-to-be a conflicting
  // edit by pre-seeding seed.txt differently on a throwaway commit on main
  // first, then letting ptc-conflict-a diverge from an EARLIER point.
  gitAtCwd(cwd, ['checkout', '-b', 'fgw/ptc-conflict-a']);
  fs.writeFileSync(path.join(cwd, 'seed.txt'), 'edited by ptc-conflict-a\n');
  gitAtCwd(cwd, ['add', 'seed.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'ptc-conflict-a edits seed.txt']);
  gitAtCwd(cwd, ['checkout', 'main']);
  fs.writeFileSync(path.join(cwd, 'seed.txt'), 'edited by main after branch cut\n');
  gitAtCwd(cwd, ['add', 'seed.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'main also edits seed.txt']);

  gitAtCwd(cwd, ['checkout', '-b', 'fgw/ptc-conflict-b']);
  fs.writeFileSync(path.join(cwd, 'ptc-conflict-b-produced.txt'), 'ok\n');
  gitAtCwd(cwd, ['add', 'ptc-conflict-b-produced.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'work for ptc-conflict-b']);
  gitAtCwd(cwd, ['checkout', 'main']);

  const result = run(cwd, ['promote-to-component', '--ids', 'ptc-conflict-a,ptc-conflict-b', '--root-title', 'Component conflict']);
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(result.stdout).data;
  const aResult = data.results.find((r) => r.id === 'ptc-conflict-a');
  const bResult = data.results.find((r) => r.id === 'ptc-conflict-b');
  assert.equal(aResult.outcome, 'bailed');
  assert.equal(aResult.reason, 'merge-conflict');
  assert.equal(bResult.outcome, 'merged');

  const view = stateView(cwd);
  assert.equal(view.work['ptc-conflict-a'].parent, undefined, 'a bailed member never gets parent set');
  assert.equal(view.work['ptc-conflict-b'].parent, data.rootId);
});

// --- close-out drift guard (tsk-62y, docs/history/
//     tsk-3bn-merge-conductor-harness-v2/) ----------------------------------
//
// tsk-3bn's own origin incident: closing a milestone (a `targets`-bearing
// item) while one of its targets' resolved root branch had drifted ahead of
// main from a later leaf merge — nothing warned or blocked it. This guard
// runs inside `approve`, before any git mutation, whenever the item being
// approved carries a non-empty `targets` array.

function makeMilestone(cwd, id, targets) {
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id, title: `Title ${id}`, kind: 'task', status: 'todo', deps: [], risk: 'low', refs: [], verify: 'true', targets });
  run(cwd, ['move', id, '--to', 'doing']);
  run(cwd, ['move', id, '--to', 'awaiting-approval']);
  commitPending(cwd, `state: propose ${id}`);
}

test('approve of a milestone blocks when a targeted item\'s root has unsynced drift, exit 4, item stays awaiting-approval', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeDriftedRoot(cwd, 'closeout-root', { verify: 'true' });
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'closeout-child', title: 'child', kind: 'task', status: 'todo', deps: [], risk: 'low', refs: [], verify: 'true', parent: 'closeout-root' });
  commitPending(cwd, 'state: add closeout-child');

  makeMilestone(cwd, 'closeout-milestone', ['closeout-child']);

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['approve', 'closeout-milestone']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /unsynced drift/);
  assert.match(result.stderr, /closeout-child/);
  assert.match(result.stderr, /closeout-root/);
  assert.match(result.stderr, /fgos sync-root/);
  assert.equal(gitHead(cwd), headBefore, 'a blocked close-out attempts no merge');
  assert.equal(stateView(cwd).work['closeout-milestone'].status, 'awaiting-approval');
});

test('approve of a milestone succeeds with --acknowledge-drift despite a targeted item\'s root having unsynced drift', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeDriftedRoot(cwd, 'closeout-ack-root', { verify: 'true' });
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'closeout-ack-child', title: 'child', kind: 'task', status: 'todo', deps: [], risk: 'low', refs: [], verify: 'true', parent: 'closeout-ack-root' });
  commitPending(cwd, 'state: add closeout-ack-child');

  makeMilestone(cwd, 'closeout-ack-milestone', ['closeout-ack-child']);

  const result = run(cwd, ['approve', 'closeout-ack-milestone', '--acknowledge-drift']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(stateView(cwd).work['closeout-ack-milestone'].status, 'delivered');
});

test('approve of a milestone with no drift on any target succeeds normally, unaffected by the guard', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  // A root with a real branch but zero drift (no leaf work landed on it
  // beyond main's own tip).
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'closeout-clean-root', title: 'root', kind: 'task', status: 'todo', deps: [], risk: 'low', refs: [], verify: 'true' });
  commitPending(cwd, 'state: add closeout-clean-root');
  gitAtCwd(cwd, ['branch', 'fgw/closeout-clean-root', 'main']);
  addWork(dir, { id: 'closeout-clean-child', title: 'child', kind: 'task', status: 'todo', deps: [], risk: 'low', refs: [], verify: 'true', parent: 'closeout-clean-root' });
  commitPending(cwd, 'state: add closeout-clean-child');

  makeMilestone(cwd, 'closeout-clean-milestone', ['closeout-clean-child']);

  const result = run(cwd, ['approve', 'closeout-clean-milestone']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(stateView(cwd).work['closeout-clean-milestone'].status, 'delivered');
});

test('approve of an ordinary item with no targets is completely unaffected by the close-out guard (regression)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'closeout-no-targets-item', { verify: 'true' });
  run(cwd, ['move', 'closeout-no-targets-item', '--to', 'doing']);
  run(cwd, ['move', 'closeout-no-targets-item', '--to', 'awaiting-approval']);

  const result = run(cwd, ['approve', 'closeout-no-targets-item']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(stateView(cwd).work['closeout-no-targets-item'].status, 'delivered');
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
  run(cwd, ['move', 'reject-no-reason-item', '--to', 'awaiting-approval']);

  const result = run(cwd, ['reject', 'reject-no-reason-item']);
  assert.equal(result.status, 4);
  assert.equal(stateView(cwd).work['reject-no-reason-item'].status, 'awaiting-approval');
});

test('reject on a non-proposed item is rejected as precondition, exit 2', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'reject-not-proposed-item');
  const result = run(cwd, ['reject', 'reject-not-proposed-item', '--reason', 'nope']);
  assert.equal(result.status, 2);
});

test('reject moves awaiting-approval -> todo with the reason recorded, role human, and runs no git command at all — never a revert', () => {
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
  assert.equal(rejectData.from, 'awaiting-approval');
  assert.equal(rejectData.to, 'todo');
  assert.equal(rejectData.reason, 'needs more test coverage');

  assert.equal(gitHead(cwd), headBefore, 'reject must never touch git — HEAD unchanged');
  assert.ok(fs.existsSync(path.join(cwd, 'proof.txt')), 'reject never reverts the code already on main (D4)');

  const view = stateView(cwd);
  assert.equal(view.work['reject-pull-item'].status, 'todo');

  const lines = eventLines(cwd);
  const lastEvent = JSON.parse(lines[lines.length - 1]);
  assert.equal(lastEvent.payload.reason, 'needs more test coverage');
  assert.equal(lastEvent.payload.role, 'human');
});

test('the CLI usage message for an unknown verb lists review/approve/sync-root/reject in the surface', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['bogus-verb']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /review\|approve\|sync-root\|reject/);
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
  run(cwd, ['move', id, '--to', 'awaiting-approval']);
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
  assert.equal(stateView(cwd).work['gh-review-legacy'].status, 'awaiting-approval');
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
  assert.equal(stateView(cwd).work['gh-approve-legacy'].status, 'awaiting-approval');
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
  assert.equal(stateView(cwd).work['gh-review-ok'].status, 'awaiting-approval');
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
  assert.equal(stateView(cwd).work['gh-review-blocked'].status, 'awaiting-approval', 'review never transitions state, even on a gh failure');
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
  assert.equal(stateView(cwd).work['gh-approve-nopr'].status, 'awaiting-approval');
  assert.ok(!fs.existsSync(marker), 'no gh call is made when --pr is missing');
});

// tsk-396 D2: regression for the merge-before-gate ordering bug on the
// --github transport specifically. Before this fix, mergeGitHubPR (a real,
// server-side GitHub merge) ran BEFORE the acceptance-evidence gate — unlike
// a local git merge, a GitHub-side merge can't be aborted, so this path
// carried irreversible-merge risk the local paths don't. The fake gh here
// would succeed if invoked; the test proves it is never invoked at all.
test('approve --github --pr on an item with a missing-evidence acceptance clause is refused BEFORE the real GitHub merge: precondition, exit 2, mergeGitHubPR/gh is never called', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-approve-cos-missing');
  run(cwd, ['edit', 'gh-approve-cos-missing', '--acceptance', JSON.stringify([{ text: 'ship it' }])]);
  commitPendingBeforeApprove(cwd, 'gh-approve-cos-missing');
  const marker = path.join(cwd, 'gh-was-called');
  const fake = writeMarkerFake(cwd, marker);

  const result = run(cwd, ['approve', 'gh-approve-cos-missing', '--github', '--pr', '42'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 2, `${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /ship it/);
  assert.equal(stateView(cwd).work['gh-approve-cos-missing'].status, 'awaiting-approval');
  assert.ok(!fs.existsSync(marker), 'the acceptance-evidence gate must reject before any gh CLI call, including the real merge');
});

test('approve --github with a dirty main tree is NOT blocked by the local dirty-tree gate and proceeds to the GitHub merge', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-approve-dirty');
  commitPendingBeforeApprove(cwd, 'gh-approve-dirty');
  // An unrelated dirty file on main — a LOCAL approve would refuse this, but
  // a GitHub-side merge never touches the local tree, so it must not gate.
  fs.writeFileSync(path.join(cwd, 'unrelated-dirt.txt'), 'uncommitted\n');
  const fake = writeMergeSuccessFake(cwd);

  const result = run(cwd, ['approve', 'gh-approve-dirty', '--github', '--pr', '5'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  assert.doesNotMatch(result.stdout, /not clean/);
  assert.equal(envelopeData(result.stdout).to, 'delivered');
  assert.equal(stateView(cwd).work['gh-approve-dirty'].status, 'delivered');
});

test('approve --github --pr on a fake gh merge success transitions the item awaiting-approval -> delivered with role human', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'gh-approve-merged');
  commitPendingBeforeApprove(cwd, 'gh-approve-merged');
  const fake = writeMergeSuccessFake(cwd);

  const result = run(cwd, ['approve', 'gh-approve-merged', '--github', '--pr', '42'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const mergedData = envelopeData(result.stdout);
  assert.equal(mergedData.prNumber, '42');
  assert.equal(mergedData.to, 'delivered');

  const view = stateView(cwd);
  assert.equal(view.work['gh-approve-merged'].status, 'delivered');
  // No 'close' settlement yet -- that fires at cleanup->done, not delivered.
  assert.equal(view.settlements?.['gh-approve-merged'], undefined);
});

test('approve --github --pr on a fake gh merge failure transitions awaiting-approval -> blocked and records friction with the classified reason, layer, and gh detail', () => {
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
  assert.equal(stateView(cwd).work['gh-status-legacy'].status, 'awaiting-approval');
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
  assert.equal(view.work['gh-status-open'].status, 'awaiting-approval');
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
  assert.equal(view.work['gh-status-merged'].status, 'awaiting-approval');
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
  assert.equal(view.work['gh-status-closed'].status, 'awaiting-approval', 'a GitHub-side close is not a reject — no FSM mutation');
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
  assert.equal(view.work['gh-status-failed'].status, 'awaiting-approval');
  assert.equal(view.frictions?.['gh-status-failed'], undefined);
});

// --- catchup (D6/D7/D11: unified catch-up-by-merge for a merge-related park) ---

// Builds on makeRunnerProposedItem: proposes a ROOT/standalone runner item,
// then parks it blocked with `reason` via the real awaiting-approval -> blocked edge
// (status-fsm.mjs's own reason requirement on that edge, same as the existing
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

test('catchup on a root parked with reason integration-drift, after a non-overlapping main-side change, merges main into fgw/<id> and bounces blocked -> awaiting-approval', () => {
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
  assert.equal(catchupData.to, 'awaiting-approval');

  assert.equal(gitHead(cwd), mainHeadBefore, "catchup must never touch the human's own main checkout");
  assert.equal(gitAtCwd(cwd, ['worktree', 'list', '--porcelain']), worktreesBefore, 'the ephemeral catchup worktree is cleaned up — no leftover');
  assert.equal(stateView(cwd).work['catchup-root-drift'].status, 'awaiting-approval');

  const branchLog = gitAtCwd(cwd, ['log', '--oneline', 'fgw/catchup-root-drift']);
  assert.match(branchLog, /catch-up: merge main into fgw\/catchup-root-drift/);
  const producedFile = gitAtCwd(cwd, ['show', 'fgw/catchup-root-drift:catchup-root-drift-produced.txt']);
  assert.match(producedFile, /ok/);
  const mainSideFile = gitAtCwd(cwd, ['show', 'fgw/catchup-root-drift:main-side-change.txt']);
  assert.match(mainSideFile, /landed while parked/);
});

test('catchup on a leaf parked with reason merge-conflict targets its PARENT branch (fgw/<root>), not main, and succeeds the same way', () => {
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
  assert.equal(leafCatchupData.to, 'awaiting-approval');
  assert.equal(leafCatchupData.target, 'fgw/catchup-leaf-root', 'catchup must merge the PARENT branch, not main');

  assert.equal(gitHead(cwd), mainHeadBefore, 'a leaf catchup must never touch main');
  assert.equal(gitAtCwd(cwd, ['worktree', 'list', '--porcelain']), worktreesBefore, 'the ephemeral catchup worktree is cleaned up — no leftover');
  assert.equal(stateView(cwd).work['catchup-leaf-child'].status, 'awaiting-approval');

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

  run(cwd, ['move', 'catchup-conflict-item', '--to', 'awaiting-approval']);
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

// The branch already contains the target's tip, so catchup's own merge would
// stage nothing and its `git commit` would die with "nothing to commit",
// leaving the item blocked forever. Reproduced here the way it happens for
// real: a person merges the target by hand (or a prior catch-up landed the
// merge and died later), then calls catchup.
function makeAlreadyCaughtUpItem(cwd, id, verify) {
  makeBlockedRunnerItem(cwd, id, 'integration-drift', { verify });
  gitAtCwd(cwd, ['checkout', '-q', `fgw/${id}`]);
  gitAtCwd(cwd, ['merge', '--no-edit', '-q', 'main']);
  gitAtCwd(cwd, ['checkout', '-q', 'main']);
}

test('catchup on a branch that already contains the target reports outcome "already-caught-up", still runs verify, and bounces blocked -> awaiting-approval without creating a commit', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeAlreadyCaughtUpItem(cwd, 'catchup-caught-up', 'test -f catchup-caught-up-produced.txt');

  const mainHeadBefore = gitHead(cwd);
  const branchHeadBefore = gitAtCwd(cwd, ['rev-parse', 'fgw/catchup-caught-up']).trim();
  const worktreesBefore = gitAtCwd(cwd, ['worktree', 'list', '--porcelain']);

  const result = run(cwd, ['catchup', 'catchup-caught-up']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.outcome, 'already-caught-up');
  assert.equal(data.from, 'blocked');
  assert.equal(data.to, 'awaiting-approval');

  assert.equal(stateView(cwd).work['catchup-caught-up'].status, 'awaiting-approval');
  assert.equal(gitAtCwd(cwd, ['rev-parse', 'fgw/catchup-caught-up']).trim(), branchHeadBefore, 'no commit is created when there was nothing to merge');
  assert.equal(gitHead(cwd), mainHeadBefore, "catchup must never touch the human's own main checkout");
  assert.equal(gitAtCwd(cwd, ['worktree', 'list', '--porcelain']), worktreesBefore, 'the ephemeral catchup worktree is cleaned up — no leftover');
});

test('catchup on an already-caught-up branch whose verify is RED stays blocked and reports verify-fail, without attempting a merge --abort that has no merge to abort', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeAlreadyCaughtUpItem(cwd, 'catchup-caught-up-red', 'test -f never-produced.txt');

  const branchHeadBefore = gitAtCwd(cwd, ['rev-parse', 'fgw/catchup-caught-up-red']).trim();

  const result = run(cwd, ['catchup', 'catchup-caught-up-red']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.outcome, 'verify-fail');

  assert.equal(stateView(cwd).work['catchup-caught-up-red'].status, 'blocked');
  assert.equal(gitAtCwd(cwd, ['rev-parse', 'fgw/catchup-caught-up-red']).trim(), branchHeadBefore);
});

test('catchup on an item blocked for an unrelated reason (e.g. anti-loop-max-visits) is rejected with a validation error naming the actual reason, before any git operation runs', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'catchup-unrelated-reason');
  run(cwd, ['move', 'catchup-unrelated-reason', '--to', 'doing']);
  run(cwd, ['move', 'catchup-unrelated-reason', '--to', 'awaiting-approval']);
  run(cwd, ['move', 'catchup-unrelated-reason', '--to', 'blocked', '--reason', 'anti-loop-max-visits']);

  const result = run(cwd, ['catchup', 'catchup-unrelated-reason']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /anti-loop-max-visits/);
  assert.equal(stateView(cwd).work['catchup-unrelated-reason'].status, 'blocked');
});

// tsk-3vo D5: same shared --timeout/--no-timeout resolution as `return`
// (resolveVerifyTimeoutMs), wired into `catchup` too — must reject the same
// way, before any git operation runs.
test('catchup --timeout and --no-timeout together are rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'catchup-timeout-conflict');
  run(cwd, ['move', 'catchup-timeout-conflict', '--to', 'doing']);
  run(cwd, ['move', 'catchup-timeout-conflict', '--to', 'awaiting-approval']);
  run(cwd, ['move', 'catchup-timeout-conflict', '--to', 'blocked', '--reason', 'merge-conflict']);

  const result = run(cwd, ['catchup', 'catchup-timeout-conflict', '--timeout', '1000', '--no-timeout']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /mutually exclusive/);
  assert.equal(stateView(cwd).work['catchup-timeout-conflict'].status, 'blocked', 'a rejected flag combination never runs verify or moves the item');
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

test('init in a project with a .bee/ marker detects it, reports it in the output, and leaves .bee/ byte/mtime unchanged (read-only)', () => {
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

test('init never creates a host AGENTS.md that did not already exist', () => {
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
// (status-fsm.mjs:69), discriminated by `branchHeadAtTake` — the BRANCH's own HEAD,
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
  assert.equal(view.work['branch-take-a'].claimRole, 'human');
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

test('pick --id on a blocked item with a live fgw/<id> branch claims via blocked -> doing (the same edge take uses), role "session", and REUSES the existing branch/worktree instead of creating a duplicate', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeBlockedBranchItem(cwd, 'pick-branch-a');
  const branchHead = gitAtCwd(cwd, ['rev-parse', 'fgw/pick-branch-a']).trim();
  const mainHeadBefore = gitHead(cwd);

  const result = run(cwd, ['pick', '--id', 'pick-branch-a']);
  assert.equal(result.status, 0, `pick failed: ${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.role, 'session');
  assert.equal(data.from, 'blocked');
  assert.equal(data.to, 'doing');
  assert.equal(data.branch, 'fgw/pick-branch-a');
  assert.equal(data.branchHeadAtTake, branchHead);
  assert.equal(data.worktree.branch, 'fgw/pick-branch-a');
  assert.equal(data.worktree.reused, true, 'an existing branch must be reused, never recreated');

  const view = stateView(cwd);
  assert.equal(view.work['pick-branch-a'].status, 'doing');
  assert.equal(view.work['pick-branch-a'].claimRole, 'session');
  assert.equal(view.work['pick-branch-a'].branchHeadAtTake, branchHead);
  assert.equal(gitHead(cwd), mainHeadBefore, "pick never touches the human's own main checkout");

  // truth 3: the reused branch is real and non-detached inside its worktree.
  assert.doesNotThrow(() =>
    execFileSync('git', ['symbolic-ref', '-q', 'HEAD'], { cwd: data.worktree.path, stdio: 'ignore' }),
  );
});

test('return succeeds after a FIRST pick (todo -> doing, no prior blocked branch) once real work is committed on the fresh fgw/<id> worktree — a fresh pick claim records branchHeadAtTake exactly like a blocked reclaim does, so return recognizes the branch\'s own progress instead of checking the (unchanged) main checkout', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'pick-fresh-return-ok', { verify: 'test -f proof.txt' });
  const mainHeadBefore = gitHead(cwd);

  const pickResult = run(cwd, ['pick', '--id', 'pick-fresh-return-ok']);
  assert.equal(pickResult.status, 0, `pick failed: ${pickResult.stderr}`);
  const pickData = envelopeData(pickResult.stdout);
  assert.equal(pickData.worktree.reused, false, 'sanity: this is a fresh claim, not a blocked reclaim');

  // The real work happens on the fresh worktree pick just stood up — never
  // on the human's own main checkout.
  fs.writeFileSync(path.join(pickData.worktree.path, 'proof.txt'), 'built by the fresh pick\n');
  execFileSync('git', ['add', '-A'], { cwd: pickData.worktree.path });
  execFileSync('git', ['commit', '-q', '-m', 'work: proof.txt'], { cwd: pickData.worktree.path });
  const branchHeadAtReturn = gitAtCwd(cwd, ['rev-parse', 'fgw/pick-fresh-return-ok']).trim();
  const worktreesBefore = gitAtCwd(cwd, ['worktree', 'list', '--porcelain']);

  const result = run(cwd, ['return', 'pick-fresh-return-ok']);
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  assert.match(result.stdout, /awaiting-approval/);

  const view = stateView(cwd);
  assert.equal(view.work['pick-fresh-return-ok'].status, 'awaiting-approval');
  assert.equal(view.work['pick-fresh-return-ok'].branchHeadAtReturn, branchHeadAtReturn);
  assert.equal('headAtReturn' in view.work['pick-fresh-return-ok'], false, 'a branch-source return never records the main-based headAtReturn');
  assert.equal(gitHead(cwd), mainHeadBefore, "return never advances or touches the human's own main checkout");
  assert.equal(gitAtCwd(cwd, ['worktree', 'list', '--porcelain']), worktreesBefore, 'the disposable detached verify worktree is cleaned up — no leftover');
});

test('return on a branch-source take: verify passes in a disposable detached worktree at the branch tip -> awaiting-approval, branchHeadAtReturn recorded (never headAtReturn), the human\'s own main checkout is untouched and no worktree is left behind', () => {
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
  assert.match(result.stdout, /awaiting-approval/);

  const view = stateView(cwd);
  assert.equal(view.work['branch-return-ok'].status, 'awaiting-approval');
  assert.equal(view.work['branch-return-ok'].branchHeadAtReturn, branchHeadAtReturn);
  assert.equal('headAtReturn' in view.work['branch-return-ok'], false, 'a branch return never records the main-based headAtReturn (D2 CẤM)');
  assert.equal(gitHead(cwd), mainHeadBefore, "return never advances or touches the human's own main checkout");
  assert.equal(gitAtCwd(cwd, ['worktree', 'list', '--porcelain']), worktreesBefore, 'the disposable detached verify worktree is cleaned up — no leftover');
});

test('return on a branch-source take whose branch declares a real npm dependency: verify passes because the disposable detached worktree gets its own node_modules provisioned first (tsk-2vd — reproduces the real failure that blocked tsk-32n\'s own return)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);

  const localDep = mkLocalDependency();
  fs.writeFileSync(
    path.join(cwd, 'package.json'),
    JSON.stringify({ name: 'x', version: '1.0.0', dependencies: { 'fgos-test-localdep': `file:${localDep}` } }),
  );
  gitAtCwd(cwd, ['add', 'package.json']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'declare a dependency']);

  makeBlockedBranchItem(cwd, 'branch-return-deps', { verify: `node -e "require('fgos-test-localdep')"` });
  assert.equal(run(cwd, ['take', '--id', 'branch-return-deps']).status, 0);
  commitPending(cwd, 'state: take branch-return-deps');

  gitAtCwd(cwd, ['checkout', 'fgw/branch-return-deps']);
  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'fixed by hand\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'human fix']);
  gitAtCwd(cwd, ['checkout', 'main']);

  const result = run(cwd, ['return', 'branch-return-deps']);
  assert.equal(result.status, 0, `return failed (before this item's fix, this failed with ERR_MODULE_NOT_FOUND exactly like tsk-32n's own return did): ${result.stderr}`);
  assert.match(result.stdout, /awaiting-approval/);

  const view = stateView(cwd);
  assert.equal(view.work['branch-return-deps'].status, 'awaiting-approval');
});

test('return on a branch-source take never touches a live main-checkout.lock (tsk-45z D1 scope: only the main-source path releases early — worktree commits never contend for this shared lock)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeBlockedBranchItem(cwd, 'branch-return-lock-untouched', { verify: 'test -f proof.txt' });
  assert.equal(run(cwd, ['take', '--id', 'branch-return-lock-untouched']).status, 0);
  commitPending(cwd, 'state: take branch-return-lock-untouched');

  gitAtCwd(cwd, ['checkout', 'fgw/branch-return-lock-untouched']);
  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'fixed by hand\n');
  gitAtCwd(cwd, ['add', '-A']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'human fix']);
  gitAtCwd(cwd, ['checkout', 'main']);

  // A lock recorded under this session's OWN identity — if return's release
  // wiring wrongly fired on the branch-source path too, this would vanish.
  const lockPath = path.join(cwd, '.fgos', 'main-checkout.lock');
  fs.writeFileSync(lockPath, JSON.stringify({ pid: 'tsk-45z-branch-session', ts: Date.now() }));

  const result = run(cwd, ['return', 'branch-return-lock-untouched'], { BEE_SESSION_ID: 'tsk-45z-branch-session' });
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  assert.match(result.stdout, /awaiting-approval/);
  assert.equal(fs.existsSync(lockPath), true, 'a branch-source return must never touch main-checkout.lock, even one it could self-recognize');
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

test('return without --no-new-commits-ok still refuses a branch-source claim with zero commits since take, even when the branch already satisfies verify (tsk-4on default-unchanged)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'branch-return-predone-noflag', { verify: 'test -f proof.txt' });
  // The real work is already done and committed BEFORE this claim — mirrors
  // tsk-4j9: a parent whose children's merged content already sits on its
  // own branch from a prior session.
  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'already done\n');
  execFileSync('git', ['add', '-A'], { cwd });
  execFileSync('git', ['commit', '-q', '-m', 'work already done before claim'], { cwd });

  assert.equal(run(cwd, ['pick', '--id', 'branch-return-predone-noflag']).status, 0);

  const result = run(cwd, ['return', 'branch-return-predone-noflag']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /has not advanced past branchHeadAtTake/);
  assert.equal(stateView(cwd).work['branch-return-predone-noflag'].status, 'doing');
});

test('return --no-new-commits-ok closes out a branch-source claim whose branch already reflects fully-done, verify-passing work before this claim (tsk-4on) — succeeds, records aheadCount:0', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'branch-return-predone', { verify: 'test -f proof.txt' });
  fs.writeFileSync(path.join(cwd, 'proof.txt'), 'already done\n');
  execFileSync('git', ['add', '-A'], { cwd });
  execFileSync('git', ['commit', '-q', '-m', 'work already done before claim'], { cwd });

  assert.equal(run(cwd, ['pick', '--id', 'branch-return-predone']).status, 0);

  // Zero commits on the branch since take — nothing new to prove, the work
  // was already there before the claim.
  const result = run(cwd, ['return', 'branch-return-predone', '--no-new-commits-ok']);
  assert.equal(result.status, 0, `return failed: ${result.stderr}`);
  assert.match(result.stdout, /awaiting-approval/);

  const view = stateView(cwd);
  assert.equal(view.work['branch-return-predone'].status, 'awaiting-approval');
  assert.equal(view.outcomes['branch-return-predone'].actual.outcome, 'awaiting-approval');
  assert.equal(view.outcomes['branch-return-predone'].actual.passed, true);
  assert.equal(view.outcomes['branch-return-predone'].actual.aheadCount, 0);
});

test('return --no-new-commits-ok refuses a branch-source claim that was already blocked by a real verify-fail — the flag closes out work never returned, never rescues a failed retry (tsk-4on D2)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'branch-return-cheat', { verify: 'test -f proof.txt' });

  const pickResult = run(cwd, ['pick', '--id', 'branch-return-cheat']);
  assert.equal(pickResult.status, 0, `pick failed: ${pickResult.stderr}`);
  const worktreePath = envelopeData(pickResult.stdout).worktree.path;

  // A genuine verify-fail: commits a WRONG file, never satisfies verify.
  fs.writeFileSync(path.join(worktreePath, 'wrong-file.txt'), 'nope\n');
  execFileSync('git', ['add', '-A'], { cwd: worktreePath });
  execFileSync('git', ['commit', '-q', '-m', 'wrong fix'], { cwd: worktreePath });

  const failResult = run(cwd, ['return', 'branch-return-cheat']);
  assert.equal(failResult.status, 0, `return should exit 0 for a defined blocked outcome: ${failResult.stderr}`);
  assert.equal(envelopeData(failResult.stdout).to, 'blocked');
  assert.equal(stateView(cwd).outcomes['branch-return-cheat'].actual.outcome, 'blocked');

  // Retake resets branchHeadAtTake to the (still-failing) tip — the
  // deliberate anti-cheat gate for a blocked-branch retake (human-rounds D2).
  const retakeResult = run(cwd, ['take', '--id', 'branch-return-cheat']);
  assert.equal(retakeResult.status, 0, `retake failed: ${retakeResult.stderr}`);

  // Zero new commits since the retake, flag passed — refused: a real
  // blocked outcome is still on record for this item.
  const result = run(cwd, ['return', 'branch-return-cheat', '--no-new-commits-ok']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /cannot use --no-new-commits-ok/);
  assert.equal(stateView(cwd).work['branch-return-cheat'].status, 'doing');
});

test('return --no-new-commits-ok never bypasses verify itself — a genuinely-fresh branch-source claim whose branch tip still fails verify still parks doing -> blocked + friction (tsk-4on)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  addOk(cwd, 'branch-return-flag-verify-fail', { verify: 'test -f proof.txt' }); // proof.txt never created anywhere

  assert.equal(run(cwd, ['pick', '--id', 'branch-return-flag-verify-fail']).status, 0);

  // Zero commits since take, flag passed — the advance-check is skipped,
  // but verify still runs and still fails.
  const result = run(cwd, ['return', 'branch-return-flag-verify-fail', '--no-new-commits-ok']);
  assert.equal(result.status, 0, `return should exit 0 for a defined blocked outcome: ${result.stderr}`);
  assert.equal(envelopeData(result.stdout).to, 'blocked');
  const view = stateView(cwd);
  assert.equal(view.work['branch-return-flag-verify-fail'].status, 'blocked');
  assert.equal(view.outcomes['branch-return-flag-verify-fail'].actual.outcome, 'blocked');
  assert.equal(view.frictions['branch-return-flag-verify-fail'][0].errorClass, 'verify-miss');
});

test('return on a branch-source take never requires the human\'s own main tree to be clean ("tree người là việc của người") — a dirty main tree never blocks it and is left untouched', () => {
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
  assert.equal(stateView(cwd).work['branch-return-dirty-main'].status, 'awaiting-approval');
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

// `session gc` (p-fgos-session-gc): reclaims registry entries whose worktree
// is gone from git or whose one-shot `session start` CLI pid has since
// exited — every started session qualifies for the pid half almost
// immediately (the CLI process that started it already exited), so these
// tests key on divergence/dirty-work to prove what gc does and does NOT
// touch, matching test/runner/session.test.mjs's own reclaim coverage.

test('session gc reclaims a clean, untouched session and reports it, exit 0', () => {
  const cwd = initGitCwd();
  const { sessionId, worktreePath } = startSession(cwd);

  const gced = run(cwd, ['session', 'gc']);
  assert.equal(gced.status, 0, `gc should succeed: ${gced.stderr}`);
  const data = envelopeData(gced.stdout);
  assert.deepEqual(data.reclaimed, [sessionId], 'the clean session is reclaimed');
  assert.deepEqual(data.skipped, []);
  assert.ok(!fs.existsSync(worktreePath), 'the reclaimed worktree is removed from disk');
  assert.deepEqual(envelopeData(run(cwd, ['session', 'list']).stdout), [], 'registry entry dropped');
});

test('session gc spares a diverged session and reports it as skipped, exit 0', () => {
  const cwd = initGitCwd();
  const { sessionId, worktreePath } = startSession(cwd);
  const danglingSha = commitInWorktree(worktreePath, 'change.txt');

  const gced = run(cwd, ['session', 'gc']);
  assert.equal(gced.status, 0);
  const data = envelopeData(gced.stdout);
  assert.deepEqual(data.reclaimed, []);
  assert.deepEqual(data.skipped, [sessionId], 'the diverged session is skipped, not reclaimed');
  assert.ok(fs.existsSync(worktreePath), 'the worktree with the dangling commit is preserved');

  const ended = run(cwd, ['session', 'end', sessionId]);
  assert.ok(ended.stderr.includes(danglingSha), 'end still names the preserved dangling commit');
  run(cwd, ['session', 'end', sessionId, '--force']);
});

test('session gc spares a session with uncommitted (never-committed) changes, exit 0', () => {
  const cwd = initGitCwd();
  const { sessionId, worktreePath } = startSession(cwd);
  fs.writeFileSync(path.join(worktreePath, 'wip.txt'), 'not committed yet\n');

  const gced = run(cwd, ['session', 'gc']);
  assert.equal(gced.status, 0);
  const data = envelopeData(gced.stdout);
  assert.deepEqual(data.reclaimed, [], 'nothing reclaimed — the only session is dirty');
  assert.deepEqual(data.skipped, [sessionId], 'dirty session is skipped, not silently discarded');
  assert.ok(fs.existsSync(path.join(worktreePath, 'wip.txt')), 'the uncommitted file survives gc');

  run(cwd, ['session', 'end', sessionId, '--force']);
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
// commit, item moved doing->awaiting-approval) on an initSessionSafeCwd, WITHOUT ever
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
  run(cwd, ['move', id, '--to', 'awaiting-approval']);
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
    assert.equal(stateView(cwd).work['approve-nested-runner'].status, 'awaiting-approval', 'item is untouched — no merge, no state change');
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
    assert.equal(stateView(cwd).work['approve-nested-pull'].status, 'awaiting-approval', 'item stays proposed — goal-check never ran to close it');
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
    assert.equal(stateView(cwdR).work['approve-main-runner'].status, 'delivered');
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
    assert.equal(stateView(cwdP).work['approve-main-pull'].status, 'delivered');
  } finally {
    endSession(cwdP, sessionP.sessionId, { force: true });
  }
});

test('return succeeds unchanged from inside a real session worktree (created via session.mjs createSession) — doing -> awaiting-approval, exit 0', () => {
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
    assert.match(result.stdout, /awaiting-approval/);
    assert.equal(stateView(cwd).work['return-in-session'].status, 'awaiting-approval');
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
    assert.equal(stateView(cwd).work['approve-adhoc-runner'].status, 'awaiting-approval', 'sanity: the ad-hoc worktree really does see the item (real committed events log)');
    const result = run(worktreePath, ['approve', 'approve-adhoc-runner']);
    assert.equal(result.status, 4, `expected a clean validation refusal, not a merge on an unregistered worktree: ${result.stdout}${result.stderr}`);
    assert.equal(stateView(cwd).work['approve-adhoc-runner'].status, 'awaiting-approval', 'item is untouched — no merge, no false "done"');
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
    assert.equal(stateView(cwd).work['approve-adhoc-pull'].status, 'awaiting-approval', 'sanity: the ad-hoc worktree really does see the item');
    const result = run(worktreePath, ['approve', 'approve-adhoc-pull']);
    assert.equal(result.status, 4, `expected a clean validation refusal, not a false-verified goal-check: ${result.stdout}${result.stderr}`);
    assert.equal(stateView(cwd).work['approve-adhoc-pull'].status, 'awaiting-approval', 'item stays proposed — goal-check never ran to close it');
  } finally {
    removeAdHocWorktree(cwd, worktreePath);
  }
});

test('approve from the main checkout is unaffected by the ad-hoc-worktree guard — runner and pull both still close to done, exit 0', () => {
  const cwdR = initGitCwdMain();
  run(cwdR, ['init']);
  makeRunnerProposedItem(cwdR, 'approve-adhoc-main-runner', { verify: 'test -f approve-adhoc-main-runner-produced.txt' });
  commitPendingBeforeApprove(cwdR, 'approve-adhoc-main-runner');
  const resR = run(cwdR, ['approve', 'approve-adhoc-main-runner']);
  assert.equal(resR.status, 0, `runner approve from main must still succeed: ${resR.stderr}`);
  assert.equal(stateView(cwdR).work['approve-adhoc-main-runner'].status, 'delivered');

  const cwdP = initGitCwdMain();
  run(cwdP, ['init']);
  addOk(cwdP, 'approve-adhoc-main-pull', { verify: 'test -f proof.txt' });
  run(cwdP, ['take', '--id', 'approve-adhoc-main-pull']);
  commitFile(cwdP, 'proof.txt');
  run(cwdP, ['return', 'approve-adhoc-main-pull']);
  commitPendingBeforeApprove(cwdP, 'approve-adhoc-main-pull');
  const resP = run(cwdP, ['approve', 'approve-adhoc-main-pull']);
  assert.equal(resP.status, 0, `pull approve from main must still succeed: ${resP.stderr}`);
  assert.equal(stateView(cwdP).work['approve-adhoc-main-pull'].status, 'delivered');
});

// --- approve --github + worktree guard (approve-worktree-guard-github-fix) -
//
// P1 finding (review-260718-concurrency-hard-gate-cluster): the --github
// branch (github-adapter) merged server-side and called moveWork/returned
// BEFORE the registry guard loop or isMainWorktree ever ran, so it was never
// covered by P44/approve-worktree-guard — a linked worktree (registered
// session or ad-hoc) running `approve --github` reached `done` while GitHub
// showed the PR merged, exactly the false-verification class the guard
// exists to close. Red-before-green: run against the pre-fix code (guards
// positioned after the `if (flags.github)` branch), each test below fails —
// approve reaches the gh fake and/or moveWork; after relocating the guards
// ahead of the --github branch, both refuse cleanly, proving the fix.

test('approve --github --pr refuses from an ad-hoc worktree never created through "fgos session start" — no gh call, no moveWork, item stays proposed, exit 4', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'approve-adhoc-github', { verify: 'test -f approve-adhoc-github-produced.txt' });
  const headBefore = gitHead(cwd);
  const marker = path.join(cwd, 'gh-was-called');
  const fake = writeMarkerFake(cwd, marker);

  const worktreePath = addAdHocWorktree(cwd, 'adhoc-github-branch');
  try {
    const result = run(worktreePath, ['approve', 'approve-adhoc-github', '--github', '--pr', '9'], { FGOS_GH_COMMAND: fake });
    assert.equal(result.status, 4, `expected a clean validation refusal, not a GitHub merge from an unregistered worktree: ${result.stdout}${result.stderr}`);
    assert.match(result.stderr, /main working tree/, 'the structural worktree-identity message, not the --github source-mismatch message');
    assert.ok(!fs.existsSync(marker), 'the worktree guard must reject before any gh CLI call');
    assert.equal(stateView(cwd).work['approve-adhoc-github'].status, 'awaiting-approval', 'item is untouched — no moveWork, no false "done"');
    assert.equal(gitHead(cwd), headBefore, 'main HEAD must be unchanged — nothing landed on main');
  } finally {
    removeAdHocWorktree(cwd, worktreePath);
  }
});

test('approve --github --pr refuses from inside a registered session worktree, with the registry guard\'s friendlier session-naming message (same precedence as the local path) — no gh call, item stays proposed, exit 4', () => {
  const cwd = initSessionSafeCwd();
  run(cwd, ['init']);
  makeSessionSafeRunnerItem(cwd, 'approve-session-github', { verify: 'test -f approve-session-github-produced.txt' });
  const marker = path.join(cwd, 'gh-was-called');
  const fake = writeMarkerFake(cwd, marker);

  const session = createSession(cwd, { sessionId: 'sess-github' });
  try {
    const result = run(session.worktreePath, ['approve', 'approve-session-github', '--github', '--pr', '9'], { FGOS_GH_COMMAND: fake });
    assert.equal(result.status, 4, `expected a clean validation refusal: ${result.stdout}${result.stderr}`);
    assert.match(result.stderr, /sess-github/, "the registry guard's friendlier session-naming message wins, not the generic structural message");
    assert.match(result.stderr, /session end/, 'the refusal tells the caller how to proceed');
    assert.ok(!fs.existsSync(marker), 'the worktree guard must reject before any gh CLI call');
    assert.equal(stateView(cwd).work['approve-session-github'].status, 'awaiting-approval', 'item is untouched — no moveWork, no false "done"');
  } finally {
    endSession(cwd, session.sessionId, { force: true });
  }
});

// review-20260718-self-improve-loop finding f01: the Iron Law check was
// hoisted ahead of the --github branch so a self-modifying diff cannot land
// via GitHub without ever being classified, mirroring the local path exactly.

test('approve --github --pr on a runner item touching a self-modifying-capable module REFUSES without --acknowledge-iron-law -- no gh call, item stays proposed, exit 4 (f01)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItemTouching(cwd, 'gh-iron-refuse-item', 'src/runner/probe.mjs', {
    verify: 'test -f src/runner/probe.mjs',
  });
  const marker = path.join(cwd, 'gh-was-called');
  const fake = writeMarkerFake(cwd, marker);

  const result = run(cwd, ['approve', 'gh-iron-refuse-item', '--github', '--pr', '13'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 4, `expected a clean Iron Law refusal, not a GitHub merge: ${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /Iron Law/);
  assert.match(result.stderr, /src\/runner\/probe\.mjs/, 'the refusal must name the exact module that tripped required:true');
  assert.ok(!fs.existsSync(marker), 'the Iron Law gate must refuse before any gh CLI call');
  assert.equal(stateView(cwd).work['gh-iron-refuse-item'].status, 'awaiting-approval', 'item is untouched — no moveWork, no false "done"');
});

test('approve --github --pr on the same self-modifying diff PROCEEDS with --acknowledge-iron-law: merges via the fake gh, awaiting-approval -> done (f01)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItemTouching(cwd, 'gh-iron-ack-item', 'src/runner/probe.mjs', {
    verify: 'test -f src/runner/probe.mjs',
  });
  commitPendingBeforeApprove(cwd, 'gh-iron-ack-item');
  const fake = writeMergeSuccessFake(cwd);

  const result = run(cwd, ['approve', 'gh-iron-ack-item', '--github', '--acknowledge-iron-law', '--pr', '14'], { FGOS_GH_COMMAND: fake });
  assert.equal(result.status, 0, `approve --github with acknowledgment must succeed: ${result.stdout}${result.stderr}`);
  assert.equal(envelopeData(result.stdout).to, 'delivered');
  assert.equal(stateView(cwd).work['gh-iron-ack-item'].status, 'delivered');
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
  assert.equal(data.order_version, 2); // FRONTIER_ORDER_VERSION bumped to v2 by str7-str8-priority-intent D2
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

// --- tsk-4j9-3: `fgos merge list` (merge-readiness ranking) ---------------

test('merge list: unknown sub-verb is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  const result = run(cwd, ['merge', 'bogus']);
  assert.equal(result.status, 4);
});

// tsk-66x: `merge` is a `requiresExistingStore: true` verb (like `submit`/
// `approve`) -- a missing `.fgos/` must refuse loudly, never fold silently
// into an empty-but-valid-looking ready/waiting/conflicts result.
test('merge list on a directory with no .fgos/ at all is refused, exit 4, writes nothing (no auto-vivify)', () => {
  const cwd = rawTmpCwd();
  assert.ok(!fs.existsSync(path.join(cwd, '.fgos')));
  const result = run(cwd, ['merge', 'list']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /\.fgos\/ not found/);
  assert.ok(!fs.existsSync(path.join(cwd, '.fgos')), 'the refused verb must not create .fgos/ as a side effect');
});

test('merge next on a directory with no .fgos/ at all is refused, exit 4, no merge attempted', () => {
  const cwd = rawTmpCwd();
  assert.ok(!fs.existsSync(path.join(cwd, '.fgos')));
  const result = run(cwd, ['merge', 'next']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /\.fgos\/ not found/);
  assert.ok(!fs.existsSync(path.join(cwd, '.fgos')), 'the refused verb must not create .fgos/ as a side effect');
});

test('merge next run from inside a linked worktree without --dir is refused, exit 4 -- never the old silent "nothing ready" false negative even though the real store has a ready item', () => {
  const { main, wt } = tmpLinkedWorktree();
  assert.equal(run(main, ['add', 'solo', '--title', 'Solo', '--kind', 'task', '--risk', 'low', '--verify', 'true']).status, 0);
  assert.equal(run(main, ['move', 'solo', '--to', 'doing']).status, 0);
  assert.equal(run(main, ['move', 'solo', '--to', 'awaiting-approval']).status, 0);
  // Confirm the real store genuinely has a ready item, so a refusal below
  // cannot be mistaken for a true "nothing ready" negative.
  assert.deepEqual(envelopeData(run(main, ['merge', 'list']).stdout).ready, ['solo']);

  const result = run(wt, ['merge', 'next']);
  assert.equal(result.status, 4, `expected a refusal, not the old silent false negative: ${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /\.fgos\/ not found/);
  assert.equal(stateView(main).work.solo.status, 'awaiting-approval', 'the ready item at the real store must be untouched');
});

test('merge list on an empty store: empty ready/waiting/conflicts, exit 0, no event appended', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  const before = eventLines(cwd).length;
  const result = run(cwd, ['merge', 'list']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout), { ready: [], waiting: [], conflicts: [], mergeSets: [], blockedOnSync: [], mergeTier: {}, supersededOut: [] });
  assert.equal(eventLines(cwd).length, before, 'merge list must not append any event');
});

test('merge list: a proposed item whose dep is already done is ready', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  // Built explicitly (not via toCompoundLearn/addOk) so --verify is a
  // trivially-passing command: addOk's default ('npm test') has no
  // package.json to run against in this bare sandbox, so approve would
  // park it 'blocked' instead of 'done' — a false negative for this test.
  assert.equal(run(cwd, ['add', 'dep', '--title', 'Dep', '--kind', 'task', '--risk', 'low', '--verify', 'true']).status, 0);
  assert.equal(run(cwd, ['move', 'dep', '--to', 'doing']).status, 0);
  assert.equal(run(cwd, ['move', 'dep', '--to', 'awaiting-approval']).status, 0);
  const approveResult = envelopeData(run(cwd, ['approve', 'dep']).stdout);
  assert.equal(approveResult.to, 'delivered', `expected dep to reach delivered, got: ${JSON.stringify(approveResult)}`);
  // merge list still reads RESOLVED_STATUSES = {done, wontfix} at this point
  // in the sequence (RUL12's own fix is a separate piece) -- walk the rest
  // of the chain so the dep genuinely reaches done.
  assert.equal(run(cwd, ['move', 'dep', '--to', 'retrospective']).status, 0);
  assert.equal(run(cwd, ['move', 'dep', '--to', 'cleanup']).status, 0);
  assert.equal(run(cwd, ['move', 'dep', '--to', 'done']).status, 0);
  assert.equal(run(cwd, ['add', 'leaf', '--title', 'Leaf', '--kind', 'task', '--risk', 'low', '--verify', 'true', '--deps', 'dep']).status, 0);
  toProposed(cwd, 'leaf');
  const data = envelopeData(run(cwd, ['merge', 'list']).stdout);
  assert.deepEqual(data, { ready: ['leaf'], waiting: [], conflicts: [], mergeSets: [], blockedOnSync: [], mergeTier: { leaf: 'root-to-main' }, supersededOut: [] });
});

test('merge list: a proposed item whose dep is NOT done waits, never ready', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(addOk(cwd, 'dep').status, 0); // stays todo
  assert.equal(run(cwd, ['add', 'leaf', '--title', 'Leaf', '--kind', 'task', '--risk', 'low', '--verify', 'true', '--deps', 'dep']).status, 0);
  toProposed(cwd, 'leaf');
  const data = envelopeData(run(cwd, ['merge', 'list']).stdout);
  assert.deepEqual(data, { ready: [], waiting: ['leaf'], conflicts: [], mergeSets: [], blockedOnSync: [], mergeTier: { leaf: 'root-to-main' }, supersededOut: [] });
});

test('merge list: two dep-clear proposed items sharing a footprint are excluded from ready and listed as conflicts', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  assert.equal(run(cwd, ['add', 'a', '--title', 'A', '--kind', 'task', '--risk', 'low', '--verify', 'true', '--footprint', 'src/x.mjs']).status, 0);
  assert.equal(run(cwd, ['add', 'b', '--title', 'B', '--kind', 'task', '--risk', 'low', '--verify', 'true', '--footprint', 'src/x.mjs']).status, 0);
  toProposed(cwd, 'a');
  toProposed(cwd, 'b');
  const data = envelopeData(run(cwd, ['merge', 'list']).stdout);
  assert.deepEqual(data.ready, []);
  assert.deepEqual(data.conflicts, [{ a: 'a', b: 'b', shared: ['src/x.mjs'], suggestions: ['sequence', 'hoist', 're-slice'] }]);
});

// --- tsk-4j9-4: `fgos merge next` (merge-readiness automation) -----------

test('merge next on an empty store: reports nothing ready, exit 0, no merge attempted', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  const result = run(cwd, ['merge', 'next']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout), { picked: null, reason: 'nothing ready to merge' });
});

test('merge next merges the single ready item by recursing into approve, item reaches done', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  // Explicit --verify true (not addOk's 'npm test' default) -- same
  // sandbox pitfall documented in docs/how-to/add-a-read-only-fgos-verb-
  // and-plugin-skill.md.
  assert.equal(run(cwd, ['add', 'solo', '--title', 'Solo', '--kind', 'task', '--risk', 'low', '--verify', 'true']).status, 0);
  assert.equal(run(cwd, ['move', 'solo', '--to', 'doing']).status, 0);
  assert.equal(run(cwd, ['move', 'solo', '--to', 'awaiting-approval']).status, 0);

  const result = run(cwd, ['merge', 'next']);
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.picked, 'solo');
  assert.equal(data.approve.to, 'delivered', `expected the picked item to reach delivered: ${JSON.stringify(data)}`);
  assert.equal(stateView(cwd).work.solo.status, 'delivered');
});

test('merge next picks the higher-ranked (mvp goalTier) item first when two are ready', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  for (const id of ['plain', 'important']) {
    assert.equal(run(cwd, ['add', id, '--title', id, '--kind', 'task', '--risk', 'low', '--verify', 'true', ...(id === 'important' ? ['--goal-tier', 'mvp'] : [])]).status, 0);
    assert.equal(run(cwd, ['move', id, '--to', 'doing']).status, 0);
    assert.equal(run(cwd, ['move', id, '--to', 'awaiting-approval']).status, 0);
  }
  const data = envelopeData(run(cwd, ['merge', 'next']).stdout);
  assert.equal(data.picked, 'important', 'the mvp-goalTier item outranks the plain one per rankImpact');
});

test('merge next on a runner-sourced pick that trips the Iron Law: reports blocked, merges nothing, never auto-acknowledges', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItemTouching(cwd, 'iron-next-item', 'src/runner/probe.mjs', {
    verify: 'test -f src/runner/probe.mjs',
  });

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['merge', 'next']);
  assert.equal(result.status, 0, `merge next itself must not exit non-zero on a blocked pick: ${result.stdout}${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.picked, 'iron-next-item');
  assert.equal(data.blocked, 'iron-law');
  assert.match(data.message, /Iron Law/);

  assert.equal(stateView(cwd).work['iron-next-item'].status, 'awaiting-approval', 'a blocked pick leaves the item proposed');
  assert.equal(gitHead(cwd), headBefore, 'a blocked pick attempts no merge -- HEAD is unchanged');
  const survivingBranches = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/']);
  assert.match(survivingBranches, /fgw\/iron-next-item/, 'the branch survives -- nothing was merged or cleaned up');
});

// --- tsk-173: merge next auto sync-root on blockedOnSync (docs/history/
// merge-next-auto-sync-root/) -----------------------------------------------

test('merge next with nothing ready and no blockedOnSync candidate: unchanged shape, no syncRoot key at all (zero behavior change, D1)', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  const result = run(cwd, ['merge', 'next']);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.deepEqual(data, { picked: null, reason: 'nothing ready to merge' });
  assert.ok(!('syncRoot' in data), 'no blockedOnSync candidate exists -- the new branch must never fire');
});

test('merge next auto-syncs a blockedOnSync root before giving up: drift clears, the now-ready item merges to delivered (tsk-173 D1)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeDriftedRoot(cwd, 'auto-sync-happy', { verify: 'test -f auto-sync-happy-produced.txt' });
  // driftStatus's own findRootIds only tracks ids that are some OTHER
  // item's `parent` -- a childless root is invisible to it, so it would
  // never show up in blockedOnSync at all without this.
  assert.equal(run(cwd, ['add', 'auto-sync-happy-child', '--title', 'child', '--kind', 'task', '--risk', 'low', '--verify', 'true', '--parent', 'auto-sync-happy']).status, 0);
  assert.equal(run(cwd, ['move', 'auto-sync-happy', '--to', 'awaiting-approval']).status, 0);
  commitPendingBeforeApprove(cwd, 'auto-sync-happy');

  const result = run(cwd, ['merge', 'next']);
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.syncRoot.id, 'auto-sync-happy');
  assert.equal(data.syncRoot.outcome, 'synced');
  assert.equal(data.picked, 'auto-sync-happy', `expected the synced root to be picked next: ${JSON.stringify(data)}`);
  assert.equal(data.approve.to, 'delivered', `expected the synced+ready item to reach delivered: ${JSON.stringify(data)}`);
  assert.ok(fs.existsSync(path.join(cwd, 'auto-sync-happy-produced.txt')), 'sync-root\'s merge must land on main before approve re-verifies');
  assert.equal(stateView(cwd).work['auto-sync-happy'].status, 'delivered');
});

test('merge next on a blockedOnSync root whose sync-root attempt hits a genuine conflict: picked is the root id (never null), blocked, main untouched (tsk-173 D1/D2)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeDriftedRoot(cwd, 'auto-sync-conflict', { verify: 'true' });
  // Same collision shape as the direct sync-root conflict test above: an
  // unrelated main commit on the exact path the root's own commit touches.
  fs.writeFileSync(path.join(cwd, 'auto-sync-conflict-produced.txt'), 'conflicting main content\n');
  gitAtCwd(cwd, ['add', 'auto-sync-conflict-produced.txt']);
  gitAtCwd(cwd, ['commit', '-q', '-m', 'unrelated main edit that collides']);
  // See auto-sync-happy above: driftStatus only tracks ids that are some
  // other item's `parent`.
  assert.equal(run(cwd, ['add', 'auto-sync-conflict-child', '--title', 'child', '--kind', 'task', '--risk', 'low', '--verify', 'true', '--parent', 'auto-sync-conflict']).status, 0);
  assert.equal(run(cwd, ['move', 'auto-sync-conflict', '--to', 'awaiting-approval']).status, 0);
  commitPendingBeforeApprove(cwd, 'auto-sync-conflict');

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['merge', 'next']);
  assert.equal(result.status, 0, `merge next itself must not exit non-zero on a blocked sync: ${result.stdout}${result.stderr}`);
  const data = envelopeData(result.stdout);
  // picked must be the resolved root id, NEVER null -- picked: null here
  // would collide with merge-loop's own frontier-empty bullet and silently
  // swallow this real conflict as if nothing were wrong (validated against
  // plugins/fgOS/skills/merge-loop/SKILL.md during fgos-validating).
  assert.equal(data.picked, 'auto-sync-conflict');
  assert.equal(data.blocked, 'merge-conflict');
  assert.equal(data.syncRoot.outcome, 'blocked');
  assert.equal(data.syncRoot.reason, 'merge-conflict');

  assert.equal(gitHead(cwd), headBefore, 'main must be byte-for-byte unchanged after an aborted auto-sync');
  assert.equal(stateView(cwd).work['auto-sync-conflict'].status, 'awaiting-approval', 'a blocked sync must never touch the root item\'s own status');
});

// --- str73-done-flip-cos-check cell 1: --acceptance on add/submit/edit ----

test('add --acceptance persists work.acceptance as the given array, validated through validateWork', () => {
  const cwd = tmpCwd();
  // tsk-5q5-2: evidence must resolve to a real path under cwd (the new
  // write-time traceability gate) -- tmpCwd() only guarantees `.fgos/`
  // files exist, so this points there rather than a fictional source path.
  const clauses = [{ text: 'CLI exits 0 on success' }, { text: 'field round-trips', evidence: '.fgos/events.jsonl' }];
  const result = run(cwd, ['add', 'with-acceptance', '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--acceptance', JSON.stringify(clauses)]);
  assert.equal(result.status, 0);
  assert.deepEqual(stateView(cwd).work['with-acceptance'].acceptance, clauses);
});

// tsk-5q5-2 (D1/D3, docs/history/judge-verdict-evidence-discipline/): the new
// narrow write-time evidence-traceability gate, end to end through the CLI.

test('add --acceptance is refused when a clause supplies text+evidence together but evidence cites no real path', () => {
  const cwd = tmpCwd();
  const clauses = [{ text: 'root cause confirmed', evidence: 'trust me, this is definitely correct' }];
  const result = run(cwd, ['add', 'untraceable', '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--acceptance', JSON.stringify(clauses)]);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /evidence/);
  assert.equal(stateView(cwd).work['untraceable'], undefined, 'nothing is written on a rejected acceptance clause');
});

test('add --acceptance succeeds when a text+evidence clause cites a real path that exists under cwd', () => {
  const cwd = tmpCwd();
  const clauses = [{ text: 'root cause confirmed', evidence: '.fgos/events.jsonl documents the real event log' }];
  const result = run(cwd, ['add', 'traceable', '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--acceptance', JSON.stringify(clauses)]);
  assert.equal(result.status, 0);
  assert.deepEqual(stateView(cwd).work['traceable'].acceptance, clauses);
});

test('add --acceptance with a text-only clause (no evidence yet) is completely unaffected by the traceability gate', () => {
  const cwd = tmpCwd();
  const clauses = [{ text: 'ship it' }];
  const result = run(cwd, ['add', 'text-only', '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--acceptance', JSON.stringify(clauses)]);
  assert.equal(result.status, 0);
  assert.deepEqual(stateView(cwd).work['text-only'].acceptance, clauses);
});

test('edit --acceptance is refused when a clause supplies text+evidence together but evidence cites no real path', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-untraceable');
  const result = run(cwd, ['edit', 'edit-untraceable', '--acceptance', JSON.stringify([{ text: 'root cause confirmed', evidence: 'nothing checkable here' }])]);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /evidence/);
  assert.equal(stateView(cwd).work['edit-untraceable'].acceptance, undefined, 'the rejected patch never applies');
});

test('submit --acceptance persists work.acceptance as the given array (opts -> submitWork work object)', () => {
  const cwd = tmpCwd();
  const clauses = [{ text: 'the intake item satisfies its ask' }];
  const result = run(cwd, ['submit', 'Do the thing', '--acceptance', JSON.stringify(clauses)]);
  assert.equal(result.status, 0);
  const data = envelopeData(result.stdout);
  assert.deepEqual(stateView(cwd).work[data.id].acceptance, clauses);
});

test('edit --acceptance persists work.acceptance as the given array', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-acceptance');
  const clauses = [{ text: 'newly added clause' }];
  const result = run(cwd, ['edit', 'edit-acceptance', '--acceptance', JSON.stringify(clauses)]);
  assert.equal(result.status, 0);
  assert.deepEqual(stateView(cwd).work['edit-acceptance'].acceptance, clauses);
});

test('edit --acceptance replaces the whole array (latest-wins), same semantics as --refs/--deps', () => {
  const cwd = tmpCwd();
  const first = [{ text: 'first clause' }, { text: 'second clause' }];
  const result = run(cwd, ['add', 'edit-acceptance-replace', '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--acceptance', JSON.stringify(first)]);
  assert.equal(result.status, 0);
  assert.deepEqual(stateView(cwd).work['edit-acceptance-replace'].acceptance, first);

  const second = [{ text: 'a completely different clause' }];
  const replaced = run(cwd, ['edit', 'edit-acceptance-replace', '--acceptance', JSON.stringify(second)]);
  assert.equal(replaced.status, 0);
  assert.deepEqual(stateView(cwd).work['edit-acceptance-replace'].acceptance, second, 'edit --acceptance must replace, not merge, the array');
});

test('an item added with no --acceptance flag has work.acceptance absent (undefined), not an empty array', () => {
  const cwd = tmpCwd();
  const result = addOk(cwd, 'no-acceptance-item');
  assert.equal(result.status, 0);
  const view = stateView(cwd);
  assert.equal('acceptance' in view.work['no-acceptance-item'], false, 'an omitted --acceptance leaves the field absent, not []');
  const listed = envelopeData(run(cwd, ['list']).stdout);
  assert.equal('acceptance' in listed.work['no-acceptance-item'], false);
});

test('add with a malformed --acceptance is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  const before = eventLines(cwd).length;

  const invalidJson = run(cwd, ['add', 'bad-json', '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--acceptance', 'not json']);
  assert.equal(invalidJson.status, 4);

  const notArray = run(cwd, ['add', 'bad-shape', '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--acceptance', JSON.stringify({ text: 'x' })]);
  assert.equal(notArray.status, 4);

  const missingText = run(cwd, ['add', 'bad-entry', '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--acceptance', JSON.stringify([{ evidence: 'e' }])]);
  assert.equal(missingText.status, 4);

  const emptyText = run(cwd, ['add', 'bad-empty-text', '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--acceptance', JSON.stringify([{ text: '' }])]);
  assert.equal(emptyText.status, 4);

  const bareFlag = run(cwd, ['add', 'bad-bare-flag', '--title', 'T', '--kind', 'task', '--risk', 'low', '--verify', 'x', '--acceptance']);
  assert.equal(bareFlag.status, 4);

  assert.equal(eventLines(cwd).length, before, 'no malformed --acceptance attempt should append any event');
});

test('edit with a malformed --acceptance is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'edit-bad-acceptance');
  const before = eventLines(cwd).length;

  const invalidJson = run(cwd, ['edit', 'edit-bad-acceptance', '--acceptance', 'not json']);
  assert.equal(invalidJson.status, 4);

  const notArray = run(cwd, ['edit', 'edit-bad-acceptance', '--acceptance', JSON.stringify({ text: 'x' })]);
  assert.equal(notArray.status, 4);

  const missingText = run(cwd, ['edit', 'edit-bad-acceptance', '--acceptance', JSON.stringify([{ evidence: 'e' }])]);
  assert.equal(missingText.status, 4);

  const emptyText = run(cwd, ['edit', 'edit-bad-acceptance', '--acceptance', JSON.stringify([{ text: '' }])]);
  assert.equal(emptyText.status, 4);

  assert.equal(eventLines(cwd).length, before, 'no malformed --acceptance edit should append any event');
  assert.equal('acceptance' in stateView(cwd).work['edit-bad-acceptance'], false);
});

test('submit with a malformed --acceptance is rejected as validation, exit 4, no event written', () => {
  const cwd = tmpCwd();
  const before = eventLines(cwd).length;
  const result = run(cwd, ['submit', 'Try a bad acceptance value', '--acceptance', 'not json']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before);
});

// --- str73-done-flip-cos-check cell 2: per-clause CoS done-gate via the ----
// --- real CLI (move / approve) ---------------------------------------------
//
// Mirrors the RUL50 compound-learn tests above (`toCompoundLearn`, "move
// awaiting-approval -> done (approval) applies via the real CLI"): an item must clear
// BOTH the stage gate and this cell's acceptance-evidence gate before it can
// close. `approve` on a plain (non-git-backed) item resolves to the
// "legacy" source (no `fgw/<id>` branch, no headAtTake/headAtReturn) and its
// verify-only path re-runs `item.verify` against cwd before calling the same
// `moveWork(..., to: 'done')` a direct `move` uses — `verify: 'true'` keeps
// that check trivially green so the test isolates the acceptance gate.

test('move --to delivered is refused when a populated acceptance clause has no evidence: precondition, exit 2, item stays proposed, no event written', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'cli-cos-missing');
  run(cwd, ['edit', 'cli-cos-missing', '--acceptance', JSON.stringify([{ text: 'ship it' }])]);

  const before = eventLines(cwd).length;
  const result = run(cwd, ['move', 'cli-cos-missing', '--to', 'delivered']);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /ship it/);
  assert.equal(stateView(cwd).work['cli-cos-missing'].status, 'awaiting-approval');
  assert.equal(eventLines(cwd).length, before);
});

test('move --to delivered succeeds when every acceptance clause has non-empty evidence, exactly as before this cell', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'cli-cos-evidenced');
  // tsk-5q5-2: evidence must resolve to a real path under cwd -- assert the
  // edit itself succeeds too, so a future regression in the new write-time
  // gate can't silently no-op this edit and let the item coast through on
  // an acceptance field that was never actually set (RUL58's own
  // absent-is-unaffected rule would otherwise mask exactly that).
  const editResult = run(cwd, ['edit', 'cli-cos-evidenced', '--acceptance', JSON.stringify([{ text: 'ship it', evidence: '.fgos/events.jsonl' }])]);
  assert.equal(editResult.status, 0, 'edit --acceptance with real, traceable evidence must succeed');

  const result = run(cwd, ['move', 'cli-cos-evidenced', '--to', 'delivered']);
  assert.equal(result.status, 0);
  assert.equal(stateView(cwd).work['cli-cos-evidenced'].status, 'delivered');
});

test('an item with acceptance absent, or an empty array, closes via move --to delivered completely unaffected (no-op)', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'cli-cos-absent'); // no --acceptance ever set
  assert.equal(run(cwd, ['move', 'cli-cos-absent', '--to', 'delivered']).status, 0);
  assert.equal(stateView(cwd).work['cli-cos-absent'].status, 'delivered');

  const cwd2 = tmpCwd();
  toProposed(cwd2, 'cli-cos-empty');
  run(cwd2, ['edit', 'cli-cos-empty', '--acceptance', JSON.stringify([])]);
  assert.equal(run(cwd2, ['move', 'cli-cos-empty', '--to', 'delivered']).status, 0);
  assert.equal(stateView(cwd2).work['cli-cos-empty'].status, 'delivered');
});

test('editing in the missing evidence after a refusal, then retrying move --to delivered, succeeds — no cached verdict', () => {
  const cwd = tmpCwd();
  toProposed(cwd, 'cli-cos-retry');
  run(cwd, ['edit', 'cli-cos-retry', '--acceptance', JSON.stringify([{ text: 'ship it' }])]);

  assert.equal(run(cwd, ['move', 'cli-cos-retry', '--to', 'delivered']).status, 2);
  assert.equal(stateView(cwd).work['cli-cos-retry'].status, 'awaiting-approval');

  // tsk-5q5-2: evidence must resolve to a real path under cwd.
  const retryEdit = run(cwd, ['edit', 'cli-cos-retry', '--acceptance', JSON.stringify([{ text: 'ship it', evidence: '.fgos/events.jsonl' }])]);
  assert.equal(retryEdit.status, 0, 'edit --acceptance with real, traceable evidence must succeed');
  const result = run(cwd, ['move', 'cli-cos-retry', '--to', 'delivered']);
  assert.equal(result.status, 0, 'the retry must re-read the just-edited evidence, not a cached refusal');
  assert.equal(stateView(cwd).work['cli-cos-retry'].status, 'delivered');
});

test('approve on a proposed item with a missing-evidence acceptance clause is refused the same way as move --to done: precondition, exit 2, item stays proposed, no event written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'approve-cos-missing', { verify: 'true' });
  run(cwd, ['edit', 'approve-cos-missing', '--acceptance', JSON.stringify([{ text: 'ship it' }])]);
  run(cwd, ['move', 'approve-cos-missing', '--to', 'doing']);
  run(cwd, ['move', 'approve-cos-missing', '--to', 'awaiting-approval']);

  const before = eventLines(cwd).length;
  const result = run(cwd, ['approve', 'approve-cos-missing']);
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /ship it/);
  assert.equal(stateView(cwd).work['approve-cos-missing'].status, 'awaiting-approval');
  assert.equal(eventLines(cwd).length, before);
});

// tsk-396 D1: regression for the merge-before-gate ordering bug. Before this
// fix, a runner-sourced item's real `git merge` (mergeRunnerItem) landed on
// main BEFORE the acceptance-evidence gate ran (inside moveWork's own
// `to === 'delivered'` check), so a refused gate here would still leave a
// merge commit on main. assertAcceptanceEvidence now runs as a pre-flight,
// before mergeRunnerItem is ever called — this test proves main's HEAD is
// completely untouched by a refused approve, not just that approve reports
// an error.
test('approve on a runner-sourced item with a missing-evidence acceptance clause is refused BEFORE the real git merge: precondition, exit 2, main HEAD unchanged, item stays awaiting-approval', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'runner-cos-missing');
  run(cwd, ['edit', 'runner-cos-missing', '--acceptance', JSON.stringify([{ text: 'ship it' }])]);
  commitPendingBeforeApprove(cwd, 'runner-cos-missing');

  const mainHeadBefore = gitAtCwd(cwd, ['rev-parse', 'main']).trim();
  const result = run(cwd, ['approve', 'runner-cos-missing']);
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /ship it/);

  assert.equal(gitAtCwd(cwd, ['rev-parse', 'main']).trim(), mainHeadBefore, 'main HEAD must be completely unchanged by a refused approve');
  assert.equal(stateView(cwd).work['runner-cos-missing'].status, 'awaiting-approval');
});

// --- tsk-480: approve's post-success moveWork guard ------------------------
//
// The bug: approve's own success paths call moveWork(...to:'delivered'...)
// as their last step. Before this fix, a throw there (e.g. an
// EventLogError('lock-timeout') from events.lock contention) propagated
// uncaught even though the precondition it was recording (a real merge, or
// a passed verify) had already happened — leaving the item stuck at
// awaiting-approval with zero diagnostic trail. FGOS_TEST_FORCE_APPROVE_
// LOCK_TIMEOUT (bin/fgos.mjs's moveDeliveredOrRecordFault) is a test-only
// seam, same shape as FGOS_GH_COMMAND, that simulates exactly that failure
// for one named item id without touching moveWork/store.mjs itself.

test('approve (pull-door/verify-only): a simulated post-verify lock-timeout is caught, recorded, and left diagnosable instead of crashing uncaught', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'approve-lock-timeout', { verify: 'true' });
  run(cwd, ['move', 'approve-lock-timeout', '--to', 'doing']);
  run(cwd, ['move', 'approve-lock-timeout', '--to', 'awaiting-approval']);

  const before = eventLines(cwd).length;
  const result = run(cwd, ['approve', 'approve-lock-timeout'], { FGOS_TEST_FORCE_APPROVE_LOCK_TIMEOUT: 'approve-lock-timeout' });

  // Caught, not an uncaught crash: exit 0, a well-formed envelope, not the
  // generic "fgos: <message>" exit-1/exit-2 shape an unhandled throw would
  // have produced.
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(result.stdout).data;
  assert.equal(data.mode, 'verify-only');
  assert.equal(data.to, 'awaiting-approval');
  assert.equal(data.deliveryUnrecorded, true);
  assert.match(data.error, /lock-timeout/);
  assert.ok(data.diagnosticLog, 'envelope must point at a real diagnostic log path');

  // Visible immediately to whoever is watching the terminal, not just to a
  // later reader of the JSON envelope or the log file.
  assert.match(result.stderr, /status write failed/);
  assert.match(result.stderr, /diagnostic recorded/);

  // The status write genuinely never happened — no new event, item stays
  // exactly where it was, never silently promoted to "delivered".
  assert.equal(stateView(cwd).work['approve-lock-timeout'].status, 'awaiting-approval');
  assert.equal(eventLines(cwd).length, before);

  // The diagnostic record is real and on disk, independent of events.jsonl.
  const diagnosticLines = fs.readFileSync(data.diagnosticLog, 'utf8').trim().split('\n');
  const record = JSON.parse(diagnosticLines.at(-1));
  assert.equal(record.id, 'approve-lock-timeout');
  assert.equal(record.phase, 'pull-door verify-only');
  assert.match(record.detail, /lock-timeout/);
});

test('approve (pull-door/verify-only): with no simulated failure, the same item approves normally — the guard changes nothing on the happy path', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'approve-lock-timeout-control', { verify: 'true' });
  run(cwd, ['move', 'approve-lock-timeout-control', '--to', 'doing']);
  run(cwd, ['move', 'approve-lock-timeout-control', '--to', 'awaiting-approval']);

  const result = run(cwd, ['approve', 'approve-lock-timeout-control']);
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(result.stdout).data;
  assert.equal(data.to, 'delivered');
  assert.equal(data.deliveryUnrecorded, undefined);
  assert.equal(typeof data.seq, 'number');
  assert.equal(stateView(cwd).work['approve-lock-timeout-control'].status, 'delivered');
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

// --- `fgos unlock` (tsk-3h4): safely clears .fgos/main-checkout.lock -------

function mainCheckoutLockPath(cwd) {
  return path.join(cwd, '.fgos', 'main-checkout.lock');
}

test('unlock: no lock file present -- reports cleared, exit 0', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  const result = run(cwd, ['unlock']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.cleared, true);
  assert.equal(data.reason, 'stale-or-free');
});

test('unlock: lock held by a dead pid -- self-heals via the existing reclaim path, reports cleared', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  fs.mkdirSync(path.dirname(mainCheckoutLockPath(cwd)), { recursive: true });
  // A pid essentially guaranteed dead: an implausibly high, never-assigned value.
  fs.writeFileSync(mainCheckoutLockPath(cwd), JSON.stringify({ pid: 999999999, ts: Date.now() }));

  const result = run(cwd, ['unlock']);

  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.cleared, true);
  assert.equal(data.reason, 'stale-or-free');
});

test('unlock: lock genuinely held by a live session -- refuses, reports the holder identity, never deletes the file', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  fs.mkdirSync(path.dirname(mainCheckoutLockPath(cwd)), { recursive: true });
  // The test process's own pid is genuinely alive and distinct from the
  // spawned CLI child's pid -- a real live-other-holder case.
  fs.writeFileSync(mainCheckoutLockPath(cwd), JSON.stringify({ pid: process.pid, ts: Date.now() }));

  const result = run(cwd, ['unlock']);

  assert.equal(result.status, 7, result.stderr);
  assert.match(result.stderr, new RegExp(`held by a live session \\(${process.pid}, `));
  assert.match(result.stderr, /held \d+[ms].*expires in \d+[ms]/);
  assert.equal(fs.existsSync(mainCheckoutLockPath(cwd)), true);
});

test('unlock: corrupt (unparseable) lock content -- force-reclaims via forceReclaimAmbiguousLock, removes the file', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  fs.mkdirSync(path.dirname(mainCheckoutLockPath(cwd)), { recursive: true });
  fs.writeFileSync(mainCheckoutLockPath(cwd), 'not json at all {{{');

  const result = run(cwd, ['unlock']);

  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.cleared, true);
  assert.equal(data.reason, 'reclaimed');
  assert.equal(fs.existsSync(mainCheckoutLockPath(cwd)), false);
});

test('unlock: registered in the --help --json manifest with write-only touchesState/externalEffect labels', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['--help', '--json']);
  assert.equal(result.status, 0, result.stderr);
  const manifest = JSON.parse(result.stdout);
  const entry = manifest.commands.find((c) => c.name === 'unlock');
  assert.ok(entry, 'unlock entry missing from --help --json manifest');
  assert.equal(entry.touchesState, true);
  assert.equal(entry.externalEffect, false);
});

// --- `fgos lock-status` (tsk-5z2, D1): read-only main-checkout.lock report -

test('lock-status: no lock file present -- reports "free"', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  const result = run(cwd, ['lock-status']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.outcome, 'free');
  assert.equal(data.holderPid, null);
});

test('lock-status: held by a live session -- reports "live" with holder identity, age, and remaining TTL, exit 0 (never refuses)', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  fs.mkdirSync(path.dirname(mainCheckoutLockPath(cwd)), { recursive: true });
  fs.writeFileSync(mainCheckoutLockPath(cwd), JSON.stringify({ pid: process.pid, ts: Date.now() }));

  const result = run(cwd, ['lock-status']);

  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.outcome, 'live');
  assert.equal(data.holderPid, process.pid);
  assert.ok(typeof data.lockAgeMs === 'number');
  assert.ok(typeof data.remainingTtlMs === 'number');
  assert.match(data.lockAge, /^\d+[ms]/);
  assert.match(data.remainingTtl, /^\d+[ms]/);
});

test('lock-status: held by a dead pid -- reports "stale" and never reclaims the file', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  fs.mkdirSync(path.dirname(mainCheckoutLockPath(cwd)), { recursive: true });
  fs.writeFileSync(mainCheckoutLockPath(cwd), JSON.stringify({ pid: 999999999, ts: Date.now() }));

  const result = run(cwd, ['lock-status']);

  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.outcome, 'stale');
  assert.equal(data.holderPid, 999999999);
  assert.equal(fs.existsSync(mainCheckoutLockPath(cwd)), true);
});

test('lock-status: corrupt lock content -- reports "ambiguous" and never removes the file', () => {
  const cwd = tmpCwd();
  assert.equal(run(cwd, ['init']).status, 0);
  fs.mkdirSync(path.dirname(mainCheckoutLockPath(cwd)), { recursive: true });
  fs.writeFileSync(mainCheckoutLockPath(cwd), 'not json at all {{{');

  const result = run(cwd, ['lock-status']);

  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.outcome, 'ambiguous');
  assert.equal(fs.existsSync(mainCheckoutLockPath(cwd)), true);
  assert.equal(fs.readFileSync(mainCheckoutLockPath(cwd), 'utf8'), 'not json at all {{{');
});

test('lock-status: registered in the --help --json manifest as read-only (touchesState/externalEffect both false)', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['--help', '--json']);
  assert.equal(result.status, 0, result.stderr);
  const manifest = JSON.parse(result.stdout);
  const entry = manifest.commands.find((c) => c.name === 'lock-status');
  assert.ok(entry, 'lock-status entry missing from --help --json manifest');
  assert.equal(entry.touchesState, false);
  assert.equal(entry.externalEffect, false);
});

// --- take/pick/approve --wait/--no-wait (tsk-6c2): retry-with-backoff on
// main-checkout-lock contention, default ON, opt-out via --no-wait --------

function writeLiveLock(cwd, ageMs) {
  fs.mkdirSync(path.dirname(mainCheckoutLockPath(cwd)), { recursive: true });
  // This TEST process's own pid is genuinely alive -- reads as a real live
  // holder, mirroring the existing "unlock: genuinely held" fixture.
  fs.writeFileSync(mainCheckoutLockPath(cwd), JSON.stringify({ pid: process.pid, ts: Date.now() - ageMs }));
}

test('take --no-wait fails immediately on a live-held lock, same message/exit code as an unwaited claim, no retry delay', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'wait-no-wait-take', { verify: 'true' });
  writeLiveLock(cwd, 1000); // well within DEFAULT_TTL_MS -- would never clear on its own during this test

  const start = Date.now();
  const result = run(cwd, ['take', 'wait-no-wait-take', '--no-wait']);
  const elapsed = Date.now() - start;

  assert.equal(result.status, 7, result.stderr);
  assert.match(result.stderr, /main checkout locked by pid/);
  assert.doesNotMatch(result.stderr, /waited \d+ms before giving up/, '--no-wait must never engage the retry loop at all');
  assert.ok(elapsed < 2000, `--no-wait must fail fast, not wait out any budget (took ${elapsed}ms)`);
});

test('take (default, no flags) retries through a lock whose remainingTtlMs is short, and succeeds once it clears -- D3\'s default-ON behavior', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'wait-default-take', { verify: 'true' });
  // remainingTtlMs ~= 3s at write time: short enough to clear inside this
  // test without waiting out the real DEFAULT_TTL_MS (3 minutes). The
  // budget's own BOUNDARY_GRACE_MS (lock-wait.mjs) is what actually makes
  // this reliable, not a large margin here -- without it, the loop's own
  // give-up instant and the lock's real clearance instant are derived from
  // the same clock read and coincide almost exactly, racing event-loop
  // timer jitter regardless of how big this margin is.
  writeLiveLock(cwd, DEFAULT_TTL_MS - 3000);

  const start = Date.now();
  const result = run(cwd, ['take', 'wait-default-take']);
  const elapsed = Date.now() - start;

  assert.equal(result.status, 0, result.stderr);
  assert.equal(envelopeData(result.stdout).id, 'wait-default-take');
  assert.ok(elapsed >= 500, `must have actually waited for the lock to clear, not raced past it (took ${elapsed}ms)`);
});

test('take --wait <ms> tightens the budget below the lock\'s own remainingTtlMs, and fails with the exhausted-budget message once spent', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'wait-tight-budget-take', { verify: 'true' });
  writeLiveLock(cwd, 1000); // remainingTtlMs ~179s -- would never clear naturally in a test

  const start = Date.now();
  const result = run(cwd, ['take', 'wait-tight-budget-take', '--wait', '600']);
  const elapsed = Date.now() - start;

  assert.equal(result.status, 7, result.stderr);
  assert.match(result.stderr, /waited \d+ms before giving up/, 'an exhausted explicit --wait budget must be distinguishable from an immediate-fail');
  assert.ok(elapsed >= 500 && elapsed < 5000, `must have waited roughly the --wait budget, not the full remainingTtlMs (took ${elapsed}ms)`);
});

test('take --wait rejects a non-numeric or non-positive value the same way --timeout already does', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'wait-bad-value-take');

  const result = run(cwd, ['take', 'wait-bad-value-take', '--wait', 'nope']);
  assert.equal(result.status, 4, result.stderr);
  assert.match(result.stderr, /--wait must be a positive number of milliseconds/);
});

test('take --wait rejects a value above the 900000ms (15 min) cap -- tsk-2rf D3', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'wait-over-cap-take');

  const result = run(cwd, ['take', 'wait-over-cap-take', '--wait', '900001']);
  assert.equal(result.status, 4, result.stderr);
  assert.match(result.stderr, /--wait must be at most 900000ms \(15 min\)/);
});

test('pick --no-wait fails immediately on a live-held lock, same as take --no-wait', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'wait-no-wait-pick', { verify: 'true' });
  writeLiveLock(cwd, 1000);

  const start = Date.now();
  const result = run(cwd, ['pick', 'wait-no-wait-pick', '--no-wait']);
  const elapsed = Date.now() - start;

  assert.equal(result.status, 7, result.stderr);
  assert.match(result.stderr, /main checkout locked by pid/);
  assert.ok(elapsed < 2000, `--no-wait must fail fast (took ${elapsed}ms)`);
});

test('approve --no-wait fails immediately on a live-held lock, main left untouched -- merge next inherits the same flag by forwarding, per bin/fgos.mjs:1152', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'wait-no-wait-approve', { verify: 'true' });
  commitPendingBeforeApprove(cwd, 'wait-no-wait-approve');
  writeLiveLock(cwd, 1000);

  const start = Date.now();
  const result = run(cwd, ['approve', 'wait-no-wait-approve', '--no-wait']);
  const elapsed = Date.now() - start;

  // 9 ('merge-fail'), not 7 ('lock-timeout') -- MergeError's category is
  // unconditionally 'merge-fail' for every failure mode (pre-existing,
  // unrelated to this item's own `code` discriminator addition).
  assert.equal(result.status, 9, result.stderr);
  assert.match(result.stderr, /main checkout is locked by another live session/);
  assert.ok(elapsed < 2000, `--no-wait must fail fast (took ${elapsed}ms)`);
  assert.equal(stateView(cwd).work['wait-no-wait-approve'].status, 'awaiting-approval', 'a refused-before-merge attempt must leave the item exactly where it was');
});

test('merge next --no-wait fails immediately on a live-held lock -- proves the flag actually forwards into approve (bin/fgos.mjs:1152), not just documented as if it did', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeRunnerProposedItem(cwd, 'wait-merge-next-no-wait', { verify: 'true' });
  commitPendingBeforeApprove(cwd, 'wait-merge-next-no-wait');
  writeLiveLock(cwd, 1000);

  const start = Date.now();
  const result = run(cwd, ['merge', 'next', '--no-wait']);
  const elapsed = Date.now() - start;

  // `merge next` only special-cases an Iron Law rejection (bin/fgos.mjs's
  // `sub === 'next'` case) -- any other error from the inner `runVerb('approve', ...)`
  // rethrows as-is, so this fails exactly like a direct `approve` call does.
  assert.equal(result.status, 9, result.stderr);
  assert.match(result.stderr, /main checkout is locked by another live session/);
  assert.ok(elapsed < 2000, `--no-wait forwarded through merge next must still fail fast, not wait (took ${elapsed}ms)`);
});

test('take/pick/approve are documented in the --help --json manifest with wait/no-wait properties', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['--help', '--json']);
  assert.equal(result.status, 0, result.stderr);
  const manifest = JSON.parse(result.stdout);
  for (const name of ['take', 'pick', 'approve']) {
    const entry = manifest.commands.find((c) => c.name === name);
    assert.ok(entry, `${name} entry missing from --help --json manifest`);
    assert.ok(entry.parameters.properties.wait, `${name} manifest entry missing "wait" property`);
    assert.ok(entry.parameters.properties['no-wait'], `${name} manifest entry missing "no-wait" property`);
  }
});

// --- re-claiming an item whose branch and worktree are still standing
// (tsk-65n) -----------------------------------------------------------------

test('pick on an item whose fgw/<id> worktree is still live hands back that SAME worktree instead of removing it out from under the session working there', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'repick-live-item');

  const firstPick = envelopeData(run(cwd, ['pick', '--id', 'repick-live-item']).stdout);
  const worktreePath = firstPick.worktree.path;
  fs.writeFileSync(path.join(worktreePath, 'CONTEXT.md'), '# decisions\n');
  execFileSync('git', ['add', 'CONTEXT.md'], { cwd: worktreePath });
  execFileSync('git', ['commit', '-m', 'lock decisions'], { cwd: worktreePath });
  // A claim released at the clarify/decompose -> executing boundary, with the
  // session still sitting in its worktree.
  assert.equal(run(cwd, ['move', 'repick-live-item', '--to', 'todo', '--expect', 'doing']).status, 0);

  const secondPick = envelopeData(run(cwd, ['pick', '--id', 'repick-live-item']).stdout);

  assert.equal(secondPick.worktree.path, worktreePath, 'the live worktree is reattached, not replaced');
  assert.equal(secondPick.worktree.reused, true);
  assert.equal(fs.existsSync(worktreePath), true);
  assert.equal(fs.existsSync(path.join(worktreePath, 'CONTEXT.md')), true, 'work committed before the release is still there');
});

test('pick reattaches even when the live worktree has uncommitted work, leaving that work untouched', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'repick-dirty-item');

  const firstPick = envelopeData(run(cwd, ['pick', '--id', 'repick-dirty-item']).stdout);
  const worktreePath = firstPick.worktree.path;
  fs.writeFileSync(path.join(worktreePath, 'CONTEXT.md'), '# decisions\n');
  execFileSync('git', ['add', 'CONTEXT.md'], { cwd: worktreePath });
  execFileSync('git', ['commit', '-m', 'lock decisions'], { cwd: worktreePath });
  fs.writeFileSync(path.join(worktreePath, 'draft.md'), 'half-written\n');
  assert.equal(run(cwd, ['move', 'repick-dirty-item', '--to', 'todo', '--expect', 'doing']).status, 0);

  const secondPick = envelopeData(run(cwd, ['pick', '--id', 'repick-dirty-item']).stdout);

  assert.equal(secondPick.worktree.path, worktreePath);
  assert.equal(fs.readFileSync(path.join(worktreePath, 'draft.md'), 'utf8'), 'half-written\n');
});

test('take refuses a todo item whose own fgw/<id> branch already exists, naming pick instead of silently claiming source:main', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'take-with-branch-item');

  // the branch (and worktree) come into being via pick; the claim is then
  // released, leaving a todo item whose work lives on the branch
  envelopeData(run(cwd, ['pick', '--id', 'take-with-branch-item']).stdout);
  assert.equal(run(cwd, ['move', 'take-with-branch-item', '--to', 'todo', '--expect', 'doing']).status, 0);

  const taken = run(cwd, ['take', '--id', 'take-with-branch-item']);

  assert.notEqual(taken.status, 0, 'a main-checkout take of branch-resident work is refused');
  assert.match(taken.stderr, /already has its own branch fgw\/take-with-branch-item/);
  assert.match(taken.stderr, /fgos pick take-with-branch-item/);
  assert.equal(stateView(cwd).work['take-with-branch-item'].status, 'todo', 'the refusal is a clean no-op');
});

test('take still claims a todo item that has no fgw/<id> branch of its own', () => {
  const cwd = initGitCwd();
  run(cwd, ['init']);
  addOk(cwd, 'take-no-branch-item');

  const taken = run(cwd, ['take', '--id', 'take-no-branch-item']);

  assert.equal(taken.status, 0, `take failed: ${taken.stderr}`);
  const data = envelopeData(taken.stdout);
  assert.equal(data.source, 'main');
  assert.equal(stateView(cwd).work['take-no-branch-item'].status, 'doing');
});

// --- retrospective / cleanup (work-item-status-delivered-retrospective- ---
// --- cleanup D7/D8/D9) ------------------------------------------------

function writeCleanupTtlConfig(cwd, ttlDays) {
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), JSON.stringify({ cleanup: { ttlDays } }));
}

test('retrospective sweeps every delivered item to retrospective, in one pass, leaving non-delivered items untouched', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'retro-todo-item'); // stays todo
  addOk(cwd, 'retro-delivered-a');
  run(cwd, ['move', 'retro-delivered-a', '--to', 'doing']);
  run(cwd, ['move', 'retro-delivered-a', '--to', 'delivered']);
  addOk(cwd, 'retro-delivered-b');
  run(cwd, ['move', 'retro-delivered-b', '--to', 'doing']);
  run(cwd, ['move', 'retro-delivered-b', '--to', 'delivered']);

  const result = run(cwd, ['retrospective']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.count, 2);
  assert.deepEqual(data.swept.map((s) => s.id).sort(), ['retro-delivered-a', 'retro-delivered-b']);

  const view = stateView(cwd);
  assert.equal(view.work['retro-todo-item'].status, 'todo', 'a non-delivered item is never touched');
  assert.equal(view.work['retro-delivered-a'].status, 'retrospective');
  assert.equal(view.work['retro-delivered-b'].status, 'retrospective');
});

test('retrospective on a store with no delivered items is a clean no-op, exit 0, empty sweep', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'nothing-delivered');
  const result = run(cwd, ['retrospective']);
  assert.equal(result.status, 0);
  assert.deepEqual(envelopeData(result.stdout), { swept: [], count: 0 });
});

test('cleanup on a nonexistent id is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['cleanup', 'ghost']);
  assert.equal(result.status, 4);
});

test('cleanup on an item not at status cleanup is rejected as precondition, exit 2', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'cleanup-wrong-status');
  const result = run(cwd, ['cleanup', 'cleanup-wrong-status']);
  assert.equal(result.status, 2);
});

test('cleanup parks cleanup -> blocked, with every failing reason joined, when the TTL has not elapsed and no retrospective content exists', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'cleanup-not-ready');
  run(cwd, ['move', 'cleanup-not-ready', '--to', 'doing']);
  run(cwd, ['move', 'cleanup-not-ready', '--to', 'delivered']);
  run(cwd, ['move', 'cleanup-not-ready', '--to', 'retrospective']);
  run(cwd, ['move', 'cleanup-not-ready', '--to', 'cleanup']);
  // Default TTL (7d, no config written) — freshly entered, not elapsed.

  const result = run(cwd, ['cleanup', 'cleanup-not-ready']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.to, 'blocked');
  assert.match(data.reason, /not ready yet/);
  assert.match(data.reason, /no outcome docType\/docPath or decision record/);

  assert.equal(stateView(cwd).work['cleanup-not-ready'].status, 'blocked');
});

test('cleanup is a no-op — writes zero work.move events and stays at cleanup — when only TTL has not elapsed and the D8 checks pass', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'cleanup-ttl-only');
  run(cwd, ['move', 'cleanup-ttl-only', '--to', 'doing']);
  run(cwd, ['move', 'cleanup-ttl-only', '--to', 'delivered']);
  run(cwd, ['move', 'cleanup-ttl-only', '--to', 'retrospective']);
  const dir = path.join(cwd, '.fgos');
  fs.mkdirSync(path.join(cwd, 'docs', 'how-to'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'cleanup-ttl-only.md'), '# doc\n');
  addOutcome(dir, { id: 'cleanup-ttl-only', docType: 'how-to', docPath: 'docs/how-to/cleanup-ttl-only.md' });
  run(cwd, ['move', 'cleanup-ttl-only', '--to', 'cleanup']);
  // Default TTL (7d, no config written) — freshly entered, not elapsed.
  // No branchHeadAtReturn recorded -> checkMergeStillResolves passes
  // trivially ("nothing to check"), so the only failing check is TTL.

  const before = eventLines(cwd).length;
  const result = run(cwd, ['cleanup', 'cleanup-ttl-only']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.to, 'cleanup');
  assert.equal(data.noop, true);

  assert.equal(eventLines(cwd).length, before, 'TTL-not-elapsed alone must write zero events');
  assert.equal(stateView(cwd).work['cleanup-ttl-only'].status, 'cleanup', 'item must stay at cleanup, not move to blocked');
});

test('cleanup closes to done when TTL is configured to 0 and retrospective content + a resolving merge both exist', () => {
  // tsk-1p9: approve no longer calls cleanupMergedBranch at all — the
  // branch survives all the way from `delivered` through `cleanup`, and
  // this verb is now the ONLY thing that ever deletes it. `cleanupMergedBranch`
  // stays idempotent (branchExists guards it, never throws on an
  // already-gone branch, per merge.test.mjs) as a defensive property, not
  // because this path actually races another deletion anymore.
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  writeCleanupTtlConfig(cwd, 0);
  makeRunnerProposedItem(cwd, 'cleanup-ready-item', { verify: 'test -f cleanup-ready-item-produced.txt' });
  commitPendingBeforeApprove(cwd, 'cleanup-ready-item');

  const approve = run(cwd, ['approve', 'cleanup-ready-item']);
  assert.equal(approve.status, 0, `approve failed: ${approve.stderr}`);
  assert.equal(stateView(cwd).work['cleanup-ready-item'].status, 'delivered');

  run(cwd, ['move', 'cleanup-ready-item', '--to', 'retrospective']);
  const dir = path.join(cwd, '.fgos');
  fs.mkdirSync(path.join(cwd, 'docs', 'how-to'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'cleanup-ready-item.md'), '# doc\n');
  addOutcome(dir, { id: 'cleanup-ready-item', docType: 'how-to', docPath: 'docs/how-to/cleanup-ready-item.md' });
  run(cwd, ['move', 'cleanup-ready-item', '--to', 'cleanup']);

  const result = run(cwd, ['cleanup', 'cleanup-ready-item']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.to, 'done');

  assert.equal(stateView(cwd).work['cleanup-ready-item'].status, 'done');
  const branchAfter = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/fgw/']);
  assert.doesNotMatch(branchAfter, /fgw\/cleanup-ready-item/, 'the branch is gone by the time cleanup finishes, whichever step actually deleted it');
});

// tsk-1p9 (D7/D8): the regression this item exists to close — a LEAF
// item's own branch, merged into its root's branch (never main), must
// still be deleted correctly by cleanup even while the root itself
// remains unmerged. Pre-tsk-1p9, checkMergeStillResolves checked ancestry
// against literal HEAD (always main from repoRoot), which would falsely
// fail for every leaf; this test proves the root-aware fix (D7) plus the
// verb's own force-delete (D8) actually get the leaf's branch gone.
test('cleanup of a LEAF item deletes its own branch even though the ROOT branch is still unmerged into main (tsk-1p9 D7/D8)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  writeCleanupTtlConfig(cwd, 0);
  makeRunnerProposedLeafItem(cwd, 'leaf-cleanup-root', 'leaf-cleanup-child', { verify: 'test -f leaf-cleanup-child-produced.txt' });
  commitPendingBeforeApprove(cwd, 'leaf-cleanup-child');

  const approve = run(cwd, ['approve', 'leaf-cleanup-child']);
  assert.equal(approve.status, 0, `approve failed: ${approve.stderr}`);
  assert.equal(stateView(cwd).work['leaf-cleanup-child'].status, 'delivered');

  // The leaf's branch survives approve (tsk-1p9 D1) — confirms the fixture
  // actually exercises the deferred-cleanup path this test is proving.
  const branchAfterApprove = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/fgw/']);
  assert.match(branchAfterApprove, /fgw\/leaf-cleanup-child\b/, 'the leaf branch must still exist right after approve');
  assert.match(branchAfterApprove, /fgw\/leaf-cleanup-root\b/, 'the root branch must still exist — never merged to main by this test');

  run(cwd, ['move', 'leaf-cleanup-child', '--to', 'retrospective']);
  const dir = path.join(cwd, '.fgos');
  fs.mkdirSync(path.join(cwd, 'docs', 'how-to'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'leaf-cleanup-child.md'), '# doc\n');
  addOutcome(dir, { id: 'leaf-cleanup-child', docType: 'how-to', docPath: 'docs/how-to/leaf-cleanup-child.md' });
  run(cwd, ['move', 'leaf-cleanup-child', '--to', 'cleanup']);

  const result = run(cwd, ['cleanup', 'leaf-cleanup-child']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.to, 'done', `cleanup must close the leaf to done, not park it blocked: ${JSON.stringify(data)}`);

  assert.equal(stateView(cwd).work['leaf-cleanup-child'].status, 'done');
  const branchAfterCleanup = gitAtCwd(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/fgw/']);
  assert.doesNotMatch(branchAfterCleanup, /fgw\/leaf-cleanup-child\b/, 'the leaf branch must actually be deleted by cleanup');
  assert.match(branchAfterCleanup, /fgw\/leaf-cleanup-root\b/, 'the still-open root branch must be untouched');
});

test('cleanup parks cleanup -> blocked when the recorded commit no longer resolves on main (force-pushed/rewritten away)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  writeCleanupTtlConfig(cwd, 0);
  const dir = path.join(cwd, '.fgos');
  addWork(dir, {
    id: 'cleanup-bad-merge',
    title: 'Bad merge',
    kind: 'task',
    status: 'cleanup',
    deps: [],
    risk: 'low',
    refs: [],
    verify: 'true',
    headAtReturn: '0'.repeat(40), // a well-formed but nonexistent sha
  });
  fs.mkdirSync(path.join(cwd, 'docs', 'how-to'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'cleanup-bad-merge.md'), '# doc\n');
  addOutcome(dir, { id: 'cleanup-bad-merge', docType: 'how-to', docPath: 'docs/how-to/cleanup-bad-merge.md' });

  const result = run(cwd, ['cleanup', 'cleanup-bad-merge']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.to, 'blocked');
  assert.match(data.reason, /no longer reachable/);
});

// --- `fgos compound` (tsk-3o3, restored from fcfbae5/tsk-1zi's removal,
// adapted to gate on status `retrospective` instead of the retired
// `compound-learn` stage move) ------------------------------------------

test('compound on a nonexistent id is rejected as validation, exit 4', () => {
  const cwd = tmpCwd();
  const result = run(cwd, ['compound', 'ghost']);
  assert.equal(result.status, 4);
});

test('compound on an item not at status retrospective is rejected as validation, exit 4, no events written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'compound-wrong-status');
  const before = eventLines(cwd).length;
  const result = run(cwd, ['compound', 'compound-wrong-status', '--doc-type', 'how-to']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before, 'a rejected compound writes zero events');
  assert.equal(stateView(cwd).work['compound-wrong-status'].status, 'todo');
});

test('compound with an invalid --doc-type is rejected as validation, exit 4, before any write', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'compound-bad-doctype');
  run(cwd, ['move', 'compound-bad-doctype', '--to', 'doing']);
  run(cwd, ['move', 'compound-bad-doctype', '--to', 'delivered']);
  run(cwd, ['move', 'compound-bad-doctype', '--to', 'retrospective']);
  const before = eventLines(cwd).length;

  const result = run(cwd, ['compound', 'compound-bad-doctype', '--doc-type', 'not-a-real-quadrant']);
  assert.equal(result.status, 4);
  assert.equal(eventLines(cwd).length, before, 'a rejected --doc-type writes zero events');
});

test('compound with no --doc-type is a no-op: exit 0, docType null, no events written', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'compound-noop');
  run(cwd, ['move', 'compound-noop', '--to', 'doing']);
  run(cwd, ['move', 'compound-noop', '--to', 'delivered']);
  run(cwd, ['move', 'compound-noop', '--to', 'retrospective']);
  const before = eventLines(cwd).length;

  const result = run(cwd, ['compound', 'compound-noop']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.deepEqual(data, { id: 'compound-noop', docType: null, docPath: null, status: 'retrospective' });
  assert.equal(eventLines(cwd).length, before, 'an omitted --doc-type writes zero events');
});

test('compound with --doc-type tags the outcome, surfaced by `show`; item stays at status retrospective (no stage/status move)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'compound-tag-only');
  run(cwd, ['move', 'compound-tag-only', '--to', 'doing']);
  run(cwd, ['move', 'compound-tag-only', '--to', 'delivered']);
  run(cwd, ['move', 'compound-tag-only', '--to', 'retrospective']);

  const result = run(cwd, ['compound', 'compound-tag-only', '--doc-type', 'how-to']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.docType, 'how-to');
  assert.equal(data.docPath, null);

  assert.equal(stateView(cwd).work['compound-tag-only'].status, 'retrospective', 'compound never moves status — that stays the retro-loop\'s own job');

  const showResult = run(cwd, ['show', 'compound-tag-only']);
  assert.equal(showResult.status, 0, showResult.stderr);
  assert.equal(envelopeData(showResult.stdout).outcome.docType, 'how-to');
});

// retrospective-doc-write-path D3: `--doc-path` is only ever accepted for a
// document already committed at the main checkout's HEAD — the invariant
// that makes "a tag exists but its document never landed" (34 real
// documents, 2026-08-05) impossible to reproduce rather than detected
// later. These four tests are git-backed (`initGitCwdMain()`), unlike the
// rest of this suite's `compound` tests, because the check itself is
// git-based and has nothing to observe in a non-git `tmpCwd()`.

test('compound with --doc-type and --doc-path tags both when the file is committed at HEAD, surfaced by `show`', () => {
  const cwd = initGitCwdMain();
  addOk(cwd, 'compound-tag-path');
  run(cwd, ['move', 'compound-tag-path', '--to', 'doing']);
  run(cwd, ['move', 'compound-tag-path', '--to', 'delivered']);
  run(cwd, ['move', 'compound-tag-path', '--to', 'retrospective']);
  fs.mkdirSync(path.join(cwd, 'docs', 'explanation'), { recursive: true });
  commitFile(cwd, path.join('docs', 'explanation', 'example.md'), '# Example\n');

  const result = run(cwd, ['compound', 'compound-tag-path', '--doc-type', 'explanation', '--doc-path', 'docs/explanation/example.md']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);
  assert.equal(data.docType, 'explanation');
  assert.equal(data.docPath, 'docs/explanation/example.md');

  const showResult = run(cwd, ['show', 'compound-tag-path']);
  const outcome = envelopeData(showResult.stdout).outcome;
  assert.equal(outcome.docType, 'explanation');
  assert.equal(outcome.docPath, 'docs/explanation/example.md');
});

test('compound --doc-path is rejected as validation, exit 4, when the file does not exist at all', () => {
  const cwd = initGitCwdMain();
  addOk(cwd, 'compound-doc-absent');
  run(cwd, ['move', 'compound-doc-absent', '--to', 'doing']);
  run(cwd, ['move', 'compound-doc-absent', '--to', 'delivered']);
  run(cwd, ['move', 'compound-doc-absent', '--to', 'retrospective']);
  const before = eventLines(cwd).length;

  const result = run(cwd, ['compound', 'compound-doc-absent', '--doc-type', 'how-to', '--doc-path', 'docs/how-to/never-written.md']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /not committed at the main checkout's HEAD/);
  assert.equal(eventLines(cwd).length, before, 'a rejected --doc-path writes zero events — no tag for a document that was never written');
});

test('compound --doc-path is rejected as validation, exit 4, when the file exists but is untracked', () => {
  const cwd = initGitCwdMain();
  addOk(cwd, 'compound-doc-untracked');
  run(cwd, ['move', 'compound-doc-untracked', '--to', 'doing']);
  run(cwd, ['move', 'compound-doc-untracked', '--to', 'delivered']);
  run(cwd, ['move', 'compound-doc-untracked', '--to', 'retrospective']);
  fs.mkdirSync(path.join(cwd, 'docs', 'how-to'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'untracked.md'), '# Untracked\n');
  const before = eventLines(cwd).length;

  const result = run(cwd, ['compound', 'compound-doc-untracked', '--doc-type', 'how-to', '--doc-path', 'docs/how-to/untracked.md']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /not committed at the main checkout's HEAD/);
  assert.equal(eventLines(cwd).length, before, 'present-but-untracked must reject exactly like absent — this is the exact gap that let 34 real documents go missing');
});

test('compound --doc-path is rejected as validation, exit 4, when the file exists and is staged but not committed', () => {
  const cwd = initGitCwdMain();
  addOk(cwd, 'compound-doc-staged');
  run(cwd, ['move', 'compound-doc-staged', '--to', 'doing']);
  run(cwd, ['move', 'compound-doc-staged', '--to', 'delivered']);
  run(cwd, ['move', 'compound-doc-staged', '--to', 'retrospective']);
  fs.mkdirSync(path.join(cwd, 'docs', 'how-to'), { recursive: true });
  fs.writeFileSync(path.join(cwd, 'docs', 'how-to', 'staged-only.md'), '# Staged only\n');
  execFileSync('git', ['add', 'docs/how-to/staged-only.md'], { cwd });
  const before = eventLines(cwd).length;

  const result = run(cwd, ['compound', 'compound-doc-staged', '--doc-type', 'how-to', '--doc-path', 'docs/how-to/staged-only.md']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /not committed at the main checkout's HEAD/);
  assert.equal(eventLines(cwd).length, before, 'staged-but-uncommitted must reject exactly like absent — an index entry is not HEAD');
});
