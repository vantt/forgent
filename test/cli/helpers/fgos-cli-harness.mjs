// fgos-cli-harness.mjs -- bộ đồ nghề dùng chung của các file test CLI, tách
// nguyên văn ra khỏi test/cli/fgos.test.mjs khi file đó được chẻ nhỏ (tsk-3um).
// Không có test nào ở đây: chỉ import, hằng số và helper mà các file test bên
// cạnh dùng chung.
//
// Hai thứ đổi, vì module này nằm sâu hơn file gốc đúng một thư mục:
//   - specifier của các dòng import lùi thêm một cấp; ESM giải chúng theo vị
//     trí FILE, nên chúng phải đổi;
//   - __dirname lại được định nghĩa lùi ngược một cấp, để trỏ về test/cli/ như
//     cũ; nhờ vậy mọi path.resolve(__dirname, ...) trong helper giữ nguyên
//     từng chữ. Sửa từng đường dẫn thay vì sửa __dirname sẽ bỏ sót những chỗ
//     không viết dưới dạng chuỗi import -- REAL_REPO_ROOT là một ví dụ thật.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { addOutcome, addFriction, addDiscovery, moveWork, moveStage, addWork, editWork, StoreError } from '../../../src/state/store.mjs';
import { createSession, endSession } from '../../../src/runner/session.mjs';
import { DEFAULT_TTL_MS } from '../../../src/runner/main-checkout-lock.mjs';

// The CLI under test, resolved by absolute path so it works regardless of
// the spawned process's cwd (which every test below points at a fresh
// mkdtemp dir — never the repo's own `.fgos/`).
const __dirname = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
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

// Tầng A/T2: new events land under `.fgos/events/<writer>-<ts>.jsonl`, not
// the frozen baseline `logPath(cwd)` (TA-D12) -- this counts/exposes every
// raw line across BOTH, so every existing caller's "N more events since
// before" or "find the event with type X" check keeps working unchanged
// regardless of which physical file the CLI actually wrote to.
function eventLines(cwd) {
  const lines = [];
  if (fs.existsSync(logPath(cwd))) {
    lines.push(...fs.readFileSync(logPath(cwd), 'utf8').split('\n').filter(Boolean));
  }
  const eventsDir = path.join(cwd, '.fgos', 'events');
  let names = [];
  try {
    names = fs
      .readdirSync(eventsDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.jsonl'))
      .map((entry) => entry.name);
  } catch {
    names = [];
  }
  for (const name of names) {
    lines.push(...fs.readFileSync(path.join(eventsDir, name), 'utf8').split('\n').filter(Boolean));
  }
  return lines;
}

function stateView(cwd) {
  return JSON.parse(fs.readFileSync(viewPath(cwd), 'utf8'));
}

function addOk(cwd, id, extra = {}) {
  // add-stage-default-gap D1/D2: add now stamps an entry stage by default
  // (same door submit has always had — 'discovery' as of tsk-qod D1/D2,
  // 'clarify' before it), instead of the old implicit 'executing'. Every
  // pre-existing call site of this helper (ready/take/
  // pick/conflicts/triage/ask-answer tests, none of which are testing add's
  // own stage semantics) relied on that old implicit default to get an
  // immediately frontier-ready item — default this helper's own --stage to
  // 'executing' so those call sites stay byte-identical without touching
  // each one; a caller testing add's own stage behavior passes extra.stage
  // (or bypasses this helper entirely, same as the dedicated --stage tests
  // near "add stamps stage" above do).
  const flags = ['--title', extra.title ?? `Title ${id}`, '--kind', extra.kind ?? 'task', '--risk', extra.risk ?? 'light', '--verify', extra.verify ?? 'npm test', '--stage', extra.stage ?? 'executing'];
  // --footprint stays omitted unless a caller actually passes one (tsk-598
  // own-file-set tests): matches the CLI's own present-or-absent optional
  // shape, so every existing call site (no extra.footprint) is unaffected.
  if (extra.footprint !== undefined) {
    flags.push('--footprint', extra.footprint);
  }
  return run(cwd, ['add', id, ...flags, '--description', 'tsk-535 fixture description.']);
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
  fs.writeFileSync(path.join(cwd, '.gitignore'), '.fgos/state.json\n.fgos/runtime/\n');
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
  fs.writeFileSync(path.join(topLevel, '.gitignore'), '.fgos/state.json\n.fgos/runtime/\n');
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

// tsk-1wn D1: `docs-index` used to derive its scan/write root from raw
// process.cwd(), independent of --dir -- a worktree-resident session
// running it as instructed (bare `fgos docs-index --dir <main>`) would
// silently scan and write the WORKTREE's own docs/ tree instead of the
// real shared one. These pin repoRoot to track --dir like every other
// verb.
function docsIndexManifestPath(root) {
  return path.join(root, 'docs', 'enduser-docs-index.json');
}

// tsk-34y: same invariant as ADD_BAD_FLAG_CASES/SUBMIT_BAD_FLAG_CASES above,
// applied to `move` (D1, docs/history/test-suite-dry-consolidation/CONTEXT.md).
const MOVE_BAD_FLAG_CASES = [
  ['a bare --to (no value)', ['--to']],
  ['a valid --to plus an empty --expect ""', ['--to', 'doing', '--expect', '']],
];

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

const EDIT_PRIORITY_MATRIX_BAD_FLAG_CASES = [
  ['an out-of-domain --urgent', ['--urgent', 'extreme'], 'urgent'],
  ['a negative --impact', ['--impact', '-1'], 'impact'],
  ['a bare --impact (no following value)', ['--impact'], 'impact'],
  ['a non-numeric --effort', ['--effort', 'notanumber'], 'effort'],
  ['a bare --effort (no following value)', ['--effort'], 'effort'],
];

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
  ['a --stage outside the domain\'s own stage enum', ['--stage', 'assembling']],
  ['a bare --stage (no value)', ['--stage']],
  ['an empty --discovered-from ""', ['--discovered-from', '']],
  ['a bare --discovered-from (no value)', ['--discovered-from']],
  ['a --goal-tier outside its own domain', ['--goal-tier', 'bogus']],
  ['an empty --docs-ref ""', ['--docs-ref', '']],
  ['a bare --docs-ref (no value)', ['--docs-ref']],
];

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

// tsk-1ia: the `--verify-from-*` generated command bakes in `node
// <repo-root>/bin/fgos.mjs` (same assumption the pre-existing close-out
// how-to docs' own hand-written examples already make) -- true for this
// repo's own dogfooded checkout, but not for a throwaway git repo created
// only as a disposable fgOS data store. Symlinking `bin`/`src` from the
// REAL repo this test file itself lives in lets a generated verify
// command actually be executed end-to-end against a throwaway fixture,
// without that unrelated, pre-existing repo-root/bin-path assumption
// (out of scope for this item -- tracked separately under distribution-
// vision.md's "aware 3 context" milestone) getting in the way.
const REAL_REPO_ROOT = path.resolve(__dirname, '../..');
function linkFgosBinInto(cwd) {
  fs.symlinkSync(path.join(REAL_REPO_ROOT, 'bin'), path.join(cwd, 'bin'), 'dir');
  fs.symlinkSync(path.join(REAL_REPO_ROOT, 'src'), path.join(cwd, 'src'), 'dir');
}

// --- str67-goal-directed-planning D3/D4/D6/D7: `fgos goal set|show` CLI verb ---

function addGoalItem(cwd, id, goalTier = 'mvp') {
  return run(cwd, ['add', id, '--title', `Title ${id}`, '--kind', 'task', '--risk', 'light', '--verify', 'npm test', '--goal-tier', goalTier, '--description', 'tsk-535 fixture description.']);
}

// --- D5 proposed: new edges + --reason on `move` (phase-2-routing-3) ---

function toProposed(cwd, id) {
  addOk(cwd, id);
  run(cwd, ['move', id, '--to', 'doing']);
  return run(cwd, ['move', id, '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
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
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), JSON.stringify({ runner: cfg }));
}

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

// tsk-30v D2/D6: a clear verdict at `discovery` now skips `exploring` and
// lands directly on `planning` in ONE `discover` call (previously two
// explicit calls walked discovery->exploring->planning). Shared by every
// test below that needs an item actually AT `planning` for its own setup.
function advanceThroughDiscoveryToPlanning(cwd, id, verify = 'npm test -- proven') {
  const step1 = run(cwd, ['discover', id, '--verdict', 'clear', '--verify', verify]);
  assert.equal(step1.status, 0, `expected discovery->planning to succeed: ${step1.stderr}`);
}

// tsk-3vo D2/D3/D5: omitting --timeout on return/approve/catchup used to
// mean an unbounded verify, silently diverging from the runner loop's own
// runGoalCheck call (which always passes config.timeoutMs). It now falls
// back to the runner config's own timeoutMs instead -- --no-timeout is the
// only way left to actually opt into unbounded. `hang.mjs` (same style as
// goal-check.test.mjs's own timeout test) sleeps 1.5s, well past the 200ms
// config timeout below, so a fallback that fires kills it and a real
// --no-timeout override does not.
function writeShortRunnerConfig(cwd, timeoutMs) {
  // Every DEFAULT_RUNNER_CONFIG key present (dispatch.mjs) so
  // ensureRunnerConfigForDir's mergeConfigDefaults finds nothing missing to
  // rewrite -- an in-call rewrite would dirty the working tree and trip
  // return's own clean-tree check, unrelated to what this test proves.
  const cfg = {
    executor: { command: process.execPath, args: ['{prompt}'] },
    models: { light: 'haiku', standard: 'sonnet', heavy: 'opus' },
    timeoutMs,
    parallel: { maxRoots: 4, maxLeavesPerRoot: 4 },
  };
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), JSON.stringify({ runner: cfg }));
}

function writeHangScript(cwd, ms) {
  const scriptPath = path.join(cwd, 'hang.mjs');
  fs.writeFileSync(scriptPath, `const until = Date.now() + ${ms}; while (Date.now() < until) { /* busy-wait */ }`);
  return scriptPath;
}

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
  fs.writeFileSync(path.join(cwd, '.gitignore'), '.fgos/state.json\n.fgos/runtime/\n');
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

  run(cwd, ['move', id, '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
  commitPending(cwd, `state: propose ${id}`);
}

// Simulates what a real fan-out-parallel dispatch (D3, cell
// fan-out-parallel-9) leaves behind for a LEAF item under the per-root
// branch tree: a durable `fgw/<rootId>` integration branch (created early,
// ref only, per D17) and the leaf's own `fgw/<leafId>` branch forked from
// that root branch's TIP, carrying a real commit — with the leaf item's own
// status independently moved to `proposed` and `parent: rootId` set
// directly through store.mjs's addWork (the CLI's `add` verb has no
// --parent flag; only plan.mjs writes it in production). The root
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
  addWork(dir, { id: rootId, title: `Title ${rootId}`, kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
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
    risk: 'light',
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

  run(cwd, ['move', leafId, '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
  commitPending(cwd, `state: propose ${leafId}`);
}

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

  run(cwd, ['move', id, '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
  commitPending(cwd, `state: propose ${id}`);
}

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
  addWork(dir, { id: rootId, title: `Title ${rootId}`, kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: opts.verify ?? 'true', ...(opts.parent ? { parent: opts.parent } : {}) });
  commitPending(cwd, `state: add ${rootId}`);
  run(cwd, ['move', rootId, '--to', 'doing']);
  commitPending(cwd, `state: claim ${rootId}`);

  gitAtCwd(cwd, ['checkout', '-b', `fgw/${rootId}`]);
  fs.writeFileSync(path.join(cwd, `${rootId}-produced.txt`), 'ok\n');
  gitAtCwd(cwd, ['add', `${rootId}-produced.txt`]);
  gitAtCwd(cwd, ['commit', '-q', '-m', `leaf work merged into fgw/${rootId}`]);
  gitAtCwd(cwd, ['checkout', 'main']);
}

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
  addWork(dir, { id, title: `Title ${id}`, kind: 'task', status: 'todo', deps: opts.deps ?? [], mergeAfter: opts.mergeAfter, risk: 'light', refs: [], verify: opts.verify ?? 'true' });
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
  addWork(dir, { id, title: `Title ${id}`, kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true', targets });
  run(cwd, ['move', id, '--to', 'doing']);
  run(cwd, ['move', id, '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
  commitPending(cwd, `state: propose ${id}`);
}

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
  run(cwd, ['move', id, '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
}

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

// --- coexistence: harness marker detection + territory manifest -----------
// (install-coexistence D2/D4/D6 — see src/install/coexist.mjs)

function coexistPath(cwd) {
  return path.join(cwd, '.fgos', 'coexistence.json');
}

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
  run(cwd, ['move', id, '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
}

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

// --- `fgos unlock` (tsk-3h4): safely clears .fgos/main-checkout.lock -------

function mainCheckoutLockPath(cwd) {
  return path.join(cwd, '.fgos', 'main-checkout.lock');
}

// --- take/pick/approve --wait/--no-wait (tsk-6c2): retry-with-backoff on
// main-checkout-lock contention, default ON, opt-out via --no-wait --------

function writeLiveLock(cwd, ageMs) {
  fs.mkdirSync(path.dirname(mainCheckoutLockPath(cwd)), { recursive: true });
  // This TEST process's own pid is genuinely alive -- reads as a real live
  // holder, mirroring the existing "unlock: genuinely held" fixture.
  fs.writeFileSync(mainCheckoutLockPath(cwd), JSON.stringify({ pid: process.pid, ts: Date.now() - ageMs }));
}

// --- retrospective / cleanup (work-item-status-delivered-retrospective- ---
// --- cleanup D7/D8/D9) ------------------------------------------------

function writeCleanupTtlConfig(cwd, ttlDays) {
  fs.mkdirSync(path.join(cwd, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(cwd, '.fgos', 'config.json'), JSON.stringify({ cleanup: { ttlDays } }));
}
export {
  ADD_BAD_FLAG_CASES,
  DEFAULT_TTL_MS,
  EDIT_BAD_FLAG_CASES,
  EDIT_PRIORITY_MATRIX_BAD_FLAG_CASES,
  FGOS,
  MOVE_BAD_FLAG_CASES,
  REAL_REPO_ROOT,
  SUBMIT_BAD_FLAG_CASES,
  StoreError,
  addAdHocWorktree,
  addBareOrigin,
  addDiscovery,
  addFriction,
  addGoalItem,
  addOk,
  addOutcome,
  addWork,
  advanceThroughDiscoveryToPlanning,
  assert,
  coexistPath,
  commitFile,
  commitInWorktree,
  commitPending,
  commitPendingBeforeApprove,
  createSession,
  cutMemberBranch,
  docsIndexManifestPath,
  editWork,
  endSession,
  envelopeData,
  eventLines,
  execFileSync,
  fileURLToPath,
  fs,
  gitAtCwd,
  gitHead,
  initGitCwd,
  initGitCwdInSubdir,
  initGitCwdMain,
  initGitCwdWithWorktree,
  initHeadlessGitCwd,
  initSessionSafeCwd,
  linkFgosBinInto,
  logPath,
  mainCheckoutLockPath,
  makeAlreadyCaughtUpItem,
  makeBlockedBranchItem,
  makeBlockedLeafItem,
  makeBlockedRunnerItem,
  makeDriftedRoot,
  makeFlatMember,
  makeLegacyProposedItem,
  makeMilestone,
  makeRunnerProposedItem,
  makeRunnerProposedItemTouching,
  makeRunnerProposedLeafItem,
  makeSessionSafeRunnerItem,
  mkLocalDependency,
  moveStage,
  moveWork,
  os,
  path,
  rawTmpCwd,
  registerFlatMember,
  removeAdHocWorktree,
  run,
  spawnSync,
  startSession,
  stateView,
  tmpCwd,
  tmpLinkedWorktree,
  toDoneViaChain,
  toProposed,
  viewPath,
  writeAuthFailFake,
  writeCleanupTtlConfig,
  writeCreateFake,
  writeFakeGh,
  writeHangScript,
  writeLiveLock,
  writeMarkerFake,
  writeMergeSuccessFake,
  writeRunnerConfig,
  writeShortRunnerConfig,
  writeViewFake,
};
