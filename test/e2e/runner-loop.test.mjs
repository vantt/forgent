import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync, spawn } from 'node:child_process';

// e2e — the runner's own binary (bin/fgos-runner.mjs), exercised as a real
// child process against a real, disposable git repo, alongside the CLI
// binary (bin/fgos.mjs) for setup. Nothing here imports src/runner or
// src/state directly (per this cell's prohibitions): every assertion reads
// the on-disk log/branch state the same way an outside observer would.
//
// Every test builds its own mkdtemp temp repo + temp worktree dir + temp
// executor-script dir — never the main repo's own `.fgos/`, worktrees, or
// branches. Fake executors are self-contained Node scripts (no deps); item
// `verify` commands are self-contained shell checks (`test -f ...`) since a
// temp repo carries no test suite of its own.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');
const RUNNER = path.resolve(__dirname, '../../bin/fgos-runner.mjs');

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

// Pinned to "main" (mirrors merge.test.mjs's initRepo(), and loop.test.mjs's
// own initTempRepo() fixed by cell fan-out-parallel-9 for the same reason): a
// leaf dispatch whose root has no branch yet forks fgw/<root> from literally
// "main" (worktree.mjs's createBranchRef default) — a bare `git init` leaves
// the default branch name to this machine's `init.defaultBranch`, which is
// not reliably "main".
function initTempRepo() {
  const repoRoot = mkTempDir('fgos-runner-e2e-repo-');
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'root commit'], { cwd: repoRoot });
  return repoRoot;
}

function fgos(cwd, args) {
  return spawnSync(process.execPath, [FGOS, ...args], { cwd, encoding: 'utf8' });
}

function runner(cwd, args = ['--once']) {
  return spawnSync(process.execPath, [RUNNER, ...args], { cwd, encoding: 'utf8' });
}

function add(cwd, id, extra = {}) {
  const flags = [
    '--title', extra.title ?? `Title ${id}`,
    '--kind', extra.kind ?? 'task',
    '--risk', extra.risk ?? 'light',
    '--verify', extra.verify ?? 'test -f output.txt',
    // tsk-535: --description is required at add's CLI layer.
    '--description', extra.description ?? `Title ${id}`,
    // add-stage-default-gap D1/D2: add now defaults to stage 'clarify'
    // instead of the old implicit 'executing' -- this file's whole point
    // is exercising the runner's dispatch loop, which only ever picks up
    // executing-stage items, so default this helper's --stage to
    // 'executing' the same way test/cli/fgos.test.mjs's own addOk does.
    '--stage', extra.stage ?? 'executing',
  ];
  if (extra.deps && extra.deps.length) flags.push('--deps', extra.deps.join(','));
  const result = fgos(cwd, ['add', id, ...flags]);
  assert.equal(result.status, 0, `fgos add ${id} failed: ${result.stderr}`);
  return result;
}

function submit(cwd, text, extra = {}) {
  const flags = [];
  if (extra.async) flags.push('--async');
  const result = fgos(cwd, ['submit', text, ...flags]);
  assert.equal(result.status, 0, `fgos submit failed: ${result.stderr}`);
  return JSON.parse(result.stdout).data;
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

// Every verb's success path prints a single fgos.v1 envelope
// {contract, generated_at, data_hash, data} — this unwraps it to the verb's
// own structured data.
function envelopeData(stdout) {
  return JSON.parse(stdout).data;
}

// Tầng A/T2/T3 (TA-D2/TA-D7/TA-D12): new events land in a per-writer file
// under `.fgos/events/<writer-id>-<openTs>.jsonl` (many, one per CLI
// subprocess invocation here — a fresh process is a fresh writer identity,
// TA-D11's degraded per-invocation mode), not baseline-0's
// `.fgos/events.jsonl` alone (still read too — legacy content lives there,
// zero rewrite). This file's own "never import src/state directly" rule
// (top of file) means it re-derives the TA-D7 total order `(ts, file,
// seq)` here rather than delegating to replay.mjs's readAllEventsFromDir —
// same order production replay produces, read as an outside observer would.
function events(cwd) {
  const tagged = [];
  if (fs.existsSync(logPath(cwd))) {
    for (const line of fs.readFileSync(logPath(cwd), 'utf8').split('\n').filter(Boolean)) {
      tagged.push({ ev: JSON.parse(line), file: '' });
    }
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
    for (const line of fs.readFileSync(path.join(eventsDir, name), 'utf8').split('\n').filter(Boolean)) {
      tagged.push({ ev: JSON.parse(line), file: name });
    }
  }
  tagged.sort((a, b) => {
    if (a.ev.ts !== b.ev.ts) return a.ev.ts < b.ev.ts ? -1 : 1;
    if (a.file !== b.file) return a.file < b.file ? -1 : 1;
    return (a.ev.seq ?? 0) - (b.ev.seq ?? 0);
  });
  return tagged.map(({ ev }) => ev);
}

function writeRunnerConfig(repoRoot, executorScript) {
  fs.mkdirSync(path.join(repoRoot, '.fgos'), { recursive: true });
  fs.writeFileSync(
    path.join(repoRoot, '.fgos', 'config.json'),
    JSON.stringify({
      runner: {
        executor: { command: process.execPath, args: [executorScript, '{prompt}', '--model', '{model}'] },
        models: { light: 'haiku', standard: 'sonnet', heavy: 'opus' },
        timeoutMs: 15000,
      },
    }),
  );
}

/** For the explicit `--config <path>` tests below (independent of the
 * shared `.fgos/config.json` -- `--config` names an arbitrary file). */
function writeExplicitRunnerConfigFile(repoRoot, executorScript) {
  const configPath = path.join(repoRoot, 'runner-config.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      executor: { command: process.execPath, args: [executorScript, '{prompt}', '--model', '{model}'] },
      models: { light: 'haiku', standard: 'sonnet', heavy: 'opus' },
      timeoutMs: 15000,
    }),
  );
  return configPath;
}

function branchLog(repoRoot, branch) {
  return execFileSync('git', ['log', '--oneline', branch], { cwd: repoRoot, encoding: 'utf8' });
}

function branchAheadCount(repoRoot, branch) {
  const mergeBase = execFileSync('git', ['merge-base', 'HEAD', branch], { cwd: repoRoot, encoding: 'utf8' }).trim();
  const count = execFileSync('git', ['rev-list', '--count', `${mergeBase}..${branch}`], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim();
  return parseInt(count, 10) || 0;
}

function branchExists(repoRoot, branch) {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    return true;
  } catch {
    return false;
  }
}

/** Count of live `git worktree` entries for `repoRoot` (the main worktree
 * itself always counts as 1) — the binary never accepts a test-controlled
 * `worktreeDir` (that override only exists for the library-level unit
 * tests), so "no leak" here is measured the only environment-independent
 * way available to an e2e test: repoRoot's own worktree admin state, not a
 * directory listing under the shared OS temp dir. */
function worktreeCount(repoRoot) {
  const out = execFileSync('git', ['worktree', 'list', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' });
  return out.split('\n').filter((line) => line.startsWith('worktree ')).length;
}

/** A well-behaved fake executor: writes the file the item's own verify
 * checks for, commits it on the current branch. Self-contained (no deps
 * beyond node:fs/node:child_process), never touches `.fgos/`. */
function writeCommittingExecutor(scriptDir, produce = 'output.txt') {
  const scriptPath = path.join(scriptDir, 'committing-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
fs.writeFileSync(${JSON.stringify(produce)}, 'produced by worker\\n');
execFileSync('git', ['add', ${JSON.stringify(produce)}]);
execFileSync('git', ['commit', '-q', '-m', ${JSON.stringify(`worker: ${produce}`)}]);
`,
  );
  return scriptPath;
}

/** A fake executor that commits something that does NOT satisfy the item's
 * verify — every dispatch is a real, deterministic goal-check miss. */
function writeWrongCommitExecutor(scriptDir) {
  const scriptPath = path.join(scriptDir, 'wrong-commit-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
fs.writeFileSync('junk.txt', 'not what verify wants\\n');
execFileSync('git', ['add', 'junk.txt']);
execFileSync('git', ['commit', '-q', '-m', 'worker: junk.txt']);
`,
  );
  return scriptPath;
}

/** A fake executor that reproduces a genuine runner crash: it commits the
 * real proof file (so the branch carries a legitimate worker commit), then
 * kills its OWN PARENT (the runner process, still blocked inside
 * `spawnSync` waiting on this very child) before the runner ever gets to
 * write `proposed`. This is not a simulated/hand-built post-crash state —
 * it is a real SIGKILL of the real runner process, mid-dispatch, so
 * whatever the OS/git left behind (worktree checkout included) is exactly
 * what a real crash leaves behind. */
function writeParentKillingExecutor(scriptDir, produce = 'output.txt') {
  const scriptPath = path.join(scriptDir, 'parent-killing-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
fs.writeFileSync(${JSON.stringify(produce)}, 'produced by worker\\n');
execFileSync('git', ['add', ${JSON.stringify(produce)}]);
execFileSync('git', ['commit', '-q', '-m', ${JSON.stringify(`worker: ${produce}`)}]);
process.kill(process.ppid, 'SIGKILL');
await new Promise((resolve) => setTimeout(resolve, 200));
process.exit(1);
`,
  );
  return scriptPath;
}

// tsk-1x3 D1/D9/D16 (docs/history/fanout-and-delegation-rubric/CONTEXT.md):
// the runner sweep no longer spawns a judge subprocess for clarify/decompose
// -- a role='runner' `--once` call on either stage now safely no-ops. The
// three executor builders that used to answer that subprocess's
// "# Context-discovery"/"# Chia-việc (decompose)" prompts
// (writeClearDiscoveryExecutor, writeUnclearDiscoveryExecutor,
// writeGarbageDiscoveryExecutor, writeDecomposeAwareExecutor) are retired
// along with it -- every test below now drives clarify/decompose explicitly
// via `fgos discover/decompose --verdict ...`, the only live door left, and
// the executor these builders wrote is only ever reached for its ORIGINAL
// worker-dispatch branch. writeAdaptiveWorkerExecutor below is that one
// surviving branch, unbundled from the retired judge-prompt-answering code.

/** Worker-dispatch executor: pulls the file its own dispatched item's
 * `verify` checks for straight out of the prompt's "Expected proof" section
 * (`test -f <file>`), so one script can produce whatever a root OR any of
 * its generated children need without hardcoding an id — real proof per
 * item, never a single shared stub. */
function writeAdaptiveWorkerExecutor(scriptDir) {
  const scriptPath = path.join(scriptDir, 'adaptive-worker-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const prompt = process.argv[2] ?? '';
const match = prompt.match(/test -f (\\S+)/);
const file = match ? match[1] : 'output.txt';
fs.writeFileSync(file, 'produced by worker\\n');
execFileSync('git', ['add', file]);
execFileSync('git', ['commit', '-q', '-m', \`worker: \${file}\`]);
`,
  );
  return scriptPath;
}

// --- stage-clarify/stage-decompose e2e (tsk-1x3 D1/D9/D16 retarget): the
// old scenarios here (stage-clarify-4, stage-decompose-3) proved the RUNNER
// SWEEP autonomously resolving clarify/decompose via a scripted subprocess
// judge -- exactly the mechanism this item retires (CONTEXT.md D16: "the
// runner has never dispatched a real worker for this stage in this repo's
// history"). The garbage-verdict fail-safe scenario
// (judgeDiscovery's own unparsable-stdout handling) has nothing left to
// prove at all -- the runner sweep no longer spawns a subprocess for
// clarify/decompose, so there is no stdout to be garbage. What survives,
// rewritten to drive clarify/decompose explicitly (the only live door
// left) and to prove the runner sweep now safely no-ops on either stage
// instead of guessing: -------------------------------------------------

test('e2e stage-clarify+stage-decompose (a) clear+pass-through: --once safely no-ops on a fresh clarify item (D16); explicit discover/decompose --verdict calls advance it to executing, then --once dispatches it', () => {
  const repoRoot = initTempRepo();
  const scriptDir = mkTempDir('fgos-runner-e2e-discovery-');

  assert.equal(fgos(repoRoot, ['init']).status, 0);
  writeRunnerConfig(repoRoot, writeAdaptiveWorkerExecutor(scriptDir));

  const submitted = submit(repoRoot, 'Investigate the sluggish overview page');
  assert.equal(submitted.stage, 'discovery');
  assert.equal(submitted.verify, 'chưa xác định — P15 bổ sung', 'submit sentinel before discovery runs (D5 fgos.mjs)');

  const noop = runner(repoRoot, ['--once']);
  assert.equal(noop.status, 0, `--once failed: ${noop.stderr}`);
  assert.equal(stateView(repoRoot).work[submitted.id].stage, 'discovery', 'a runner sweep never advances discovery/exploring on its own now (D16)');

  const discovered = fgos(repoRoot, ['discover', submitted.id, '--verdict', 'clear', '--verify', 'test -f output.txt && echo VERIFY_OK']);
  assert.equal(discovered.status, 0, `discover failed: ${discovered.stderr}`);
  assert.equal(stateView(repoRoot).work[submitted.id].stage, 'planning', 'tsk-30v D2/D6: a clear verdict at discovery skips exploring and lands on planning directly, in one hop');

  const decomposed = fgos(repoRoot, ['plan', submitted.id, '--verdict', 'pass-through', '--reason', 'single cohesive change']);
  assert.equal(decomposed.status, 0, `decompose failed: ${decomposed.stderr}`);

  const afterAdvance = stateView(repoRoot);
  const item = afterAdvance.work[submitted.id];
  assert.equal(item.stage, 'executing');
  assert.equal(item.verify, 'test -f output.txt && echo VERIFY_OK', 'the caller-supplied verify replaced the submit sentinel');
  assert.equal(item.status, 'todo', 'a caller-supplied pass-through never dispatches -- the item is only now a frontier head');

  const dispatched = runner(repoRoot, ['--once']);
  assert.equal(dispatched.status, 0, `--once failed: ${dispatched.stderr}`);

  const afterDispatch = stateView(repoRoot);
  assert.equal(afterDispatch.work[submitted.id].status, 'awaiting-approval');
  assert.equal(branchExists(repoRoot, `fgw/${submitted.id}`), true);
  assert.match(branchLog(repoRoot, `fgw/${submitted.id}`), /worker: output\.txt/);

  // `fgos list` (the public read surface) confirms the same facts.
  const list = envelopeData(fgos(repoRoot, ['list']).stdout);
  assert.equal(list.work[submitted.id].stage, 'executing');
  assert.equal(list.work[submitted.id].verify, 'test -f output.txt && echo VERIFY_OK');
});

test('e2e stage-clarify (b) unclear verdict: an explicit discover --verdict unclear parks the item in awaiting-human with the exact question; answering resumes it to todo, and --once still never re-judges clarify on its own (D16)', () => {
  const repoRoot = initTempRepo();
  const scriptDir = mkTempDir('fgos-runner-e2e-discovery-unclear-');
  const question = '## Context\n\nBackground needed to understand this question without opening another file.\n\n## Why this matters\n\nThis directly affects the outcome: Bạn muốn ưu tiên hiệu năng hay độ chính xác?';

  assert.equal(fgos(repoRoot, ['init']).status, 0);
  // tsk-qod D1/D2: a fresh item now starts at `discovery` (stages[0])
  // immediately, not `clarify` -- which means the FIRST `runner --once`
  // call below now lands squarely on loop.mjs's own DISCOVERY DISPATCH
  // sweep (tsk-5mj/tsk-4v6, pre-dating this item), unlike before when a
  // fresh item safely sat at `clarify`, a stage that sweep never touches.
  // Without a configured fake executor, `ensureRunnerConfigForDir` would
  // bootstrap a default pointed at whatever real assistant CLI it
  // auto-detects on PATH and dispatch it for real research -- exactly the
  // non-determinism every other dispatch-adjacent test in this file
  // already guards against via `writeRunnerConfig`. This scripted
  // executor produces no verdict fence, so the sweep's own no-callerVerdict
  // 'runner'-role no-op fires (D16) and the item is left untouched, same
  // as this test's own original intent.
  writeRunnerConfig(repoRoot, writeAdaptiveWorkerExecutor(scriptDir));

  const submitted = submit(repoRoot, 'Do the ambiguous work');

  const noop = runner(repoRoot, ['--once']);
  assert.equal(noop.status, 0, `--once failed: ${noop.stderr}`);
  assert.equal(stateView(repoRoot).work[submitted.id].stage, 'discovery', 'a runner sweep never advances discovery on its own now (D16)');

  const discovered = fgos(repoRoot, ['discover', submitted.id, '--verdict', 'unclear', '--question', question]);
  assert.equal(discovered.status, 0, `discover failed: ${discovered.stderr}`);

  let view = stateView(repoRoot);
  assert.equal(view.work[submitted.id].status, 'awaiting-human');
  // tsk-30v D2/D3: unclear no longer parks in place -- stage advances to
  // exploring even though status stays awaiting-human.
  assert.equal(view.work[submitted.id].stage, 'exploring');
  assert.equal(view.gates[submitted.id].ask, question);
  assert.equal(view.discovery[submitted.id].length, 1);
  assert.equal(view.discovery[submitted.id][0].clear, false);
  assert.equal(view.discovery[submitted.id][0].question, question);
  // tsk-qod D1/D2: a `fgw/<id>` branch/worktree now legitimately exists
  // from the discovery-dispatch sweep's own (scripted, no-op-outcome)
  // worker run above -- that sweep already uses the same worktree
  // machinery `executing`-stage dispatch does (tsk-5mj/tsk-4v6, pre-dating
  // this item), so branch existence is no longer a proxy for "this item
  // was advanced/executed"; the stage/status assertions above already
  // cover that directly.

  const answered = fgos(repoRoot, ['answer', submitted.id, '--text', 'Ưu tiên độ chính xác.']);
  assert.equal(answered.status, 0, `answer failed: ${answered.stderr}`);
  assert.equal(stateView(repoRoot).work[submitted.id].status, 'todo', 'answering resumes to todo, now sitting at stage exploring (tsk-30v)');

  const secondNoop = runner(repoRoot, ['--once']);
  assert.equal(secondNoop.status, 0, `second --once failed: ${secondNoop.stderr}`);
  view = stateView(repoRoot);
  assert.equal(view.work[submitted.id].status, 'todo', 'the runner sweep still never re-judges discovery/exploring on its own (D16) -- a human must call discover again');
  assert.equal(view.discovery[submitted.id].length, 1, 'no second discovery entry was auto-generated');
});

test('e2e stage-decompose (b) complex item: an explicit decompose --verdict decompose --children writes 2 children (real parent+deps+verify); the root is frontier-blocked until both children reach done, then it lots frontier and runs its OWN verify -> awaiting-approval', () => {
  const repoRoot = initTempRepo();
  const scriptDir = mkTempDir('fgos-runner-e2e-decompose-');

  assert.equal(fgos(repoRoot, ['init']).status, 0);
  writeRunnerConfig(repoRoot, writeAdaptiveWorkerExecutor(scriptDir));

  const submitted = submit(repoRoot, 'Rebuild the whole intake pipeline');
  // tsk-30v D2/D6: a fresh item now starts at discovery (stages[0])
  // directly, and a clear verdict there skips exploring, landing on
  // planning in ONE explicit discover call.
  assert.equal(fgos(repoRoot, ['discover', submitted.id, '--verdict', 'clear', '--verify', 'test -f root-done.txt && echo ROOT_OK']).status, 0);

  const children = JSON.stringify([
    { title: 'Build the base module', verify: 'test -f child-a.txt', action: 'tsk-3xd fixture: build the base module.', kind: 'task', risk: 'light' },
    { title: 'Wire the base module in', verify: 'test -f child-b.txt', action: 'tsk-3xd fixture: wire the base module in.', kind: 'task', risk: 'light', deps: [0] },
  ]);
  const decomposed = fgos(repoRoot, ['plan', submitted.id, '--verdict', 'decompose', '--reason', 'Two independent surfaces, no shared state', '--children', children]);
  assert.equal(decomposed.status, 0, `decompose failed: ${decomposed.stderr}`);

  // clarify/decompose->executing chained via two explicit CLI calls (D1/D9/
  // D16 replace the old single-sweep judge-driven chain); childA (no deps)
  // becomes the frontier head for the FIRST --once dispatch below.
  let view = stateView(repoRoot);
  const root = view.work[submitted.id];
  assert.equal(root.stage, 'executing');
  assert.equal(root.status, 'todo', 'the root itself was never dispatched — its descendants are still open (D4/D5 lineage filter)');

  const kids = Object.values(view.work)
    .filter((w) => w.parent === submitted.id)
    .sort((x, y) => x.deps.length - y.deps.length);
  assert.equal(kids.length, 2, 'two children written with real parent lineage (D5)');
  const [childA, childB] = kids;
  assert.equal(childA.deps.length, 0);
  assert.deepEqual(childB.deps, [childA.id], 'sibling dep resolved from the caller-supplied index to a real id');
  assert.equal(childA.stage, 'executing');
  assert.equal(childB.stage, 'executing');
  assert.equal(childA.verify, 'test -f child-a.txt');
  assert.equal(childB.verify, 'test -f child-b.txt');

  const first = runner(repoRoot, ['--once']);
  assert.equal(first.status, 0, `first --once failed: ${first.stderr}`);
  view = stateView(repoRoot);
  assert.equal(view.work[childA.id].status, 'awaiting-approval', 'childA (no deps) was the frontier head this same tick and got dispatched');
  assert.equal(view.work[childB.id].status, 'todo', 'childB is blocked on childA, which is only proposed (not done) yet');

  // Accept childA into the tree (human close via the normal `done` door) —
  // walk the sequential delivered->retrospective->cleanup->done chain
  // (work-item-status-delivered-retrospective-cleanup D1/D2/D10). This
  // proves the FSM lifecycle chain itself, not merge mechanics — childA's
  // own real fgw/<id> branch is deliberately never merged onto trunk here,
  // so tsk-5dk's move-refusal check needs --override-reason (its intended
  // escape hatch for exactly this kind of non-merge delivery).
  assert.equal(fgos(repoRoot, ['move', childA.id, '--to', 'delivered', '--override-reason', 'e2e fixture: lifecycle-chain test, not a real merge']).status, 0);
  assert.equal(fgos(repoRoot, ['move', childA.id, '--to', 'retrospective']).status, 0);
  assert.equal(fgos(repoRoot, ['move', childA.id, '--to', 'cleanup']).status, 0);
  assert.equal(fgos(repoRoot, ['move', childA.id, '--to', 'done']).status, 0);

  // --once #2: childB's dep is now done — it becomes the frontier head.
  const second = runner(repoRoot, ['--once']);
  assert.equal(second.status, 0, `second --once failed: ${second.stderr}`);
  view = stateView(repoRoot);
  assert.equal(view.work[childB.id].status, 'awaiting-approval');
  assert.equal(view.work[submitted.id].status, 'todo', 'the root is still blocked — childB is proposed, not done, yet');

  // childB walks the same sequential chain before done (same non-merge
  // override reasoning as childA above).
  assert.equal(fgos(repoRoot, ['move', childB.id, '--to', 'delivered', '--override-reason', 'e2e fixture: lifecycle-chain test, not a real merge']).status, 0);
  assert.equal(fgos(repoRoot, ['move', childB.id, '--to', 'retrospective']).status, 0);
  assert.equal(fgos(repoRoot, ['move', childB.id, '--to', 'cleanup']).status, 0);
  assert.equal(fgos(repoRoot, ['move', childB.id, '--to', 'done']).status, 0);

  // --once #3: both children done -> the lineage filter drops -> the root is
  // now the frontier's only item; the runner runs the ROOT'S OWN verify
  // (carried from its clarify-pass, `root-done.txt`), never either child's.
  const third = runner(repoRoot, ['--once']);
  assert.equal(third.status, 0, `third --once failed: ${third.stderr}`);
  view = stateView(repoRoot);
  assert.equal(view.work[submitted.id].status, 'awaiting-approval', 'the root lot frontier and proved itself with its own verify (D4)');
  assert.match(branchLog(repoRoot, `fgw/${submitted.id}`), /worker: root-done\.txt/);
  assert.equal(view.work[childA.id].status, 'done');
  assert.equal(view.work[childB.id].status, 'done');
});

test('e2e stage-decompose (c) ambiguous verdict: an explicit decompose --verdict need-human parks the item in awaiting-human carrying the reason (still stage decompose, no children written); answering resumes it to todo, and --once still never re-judges decompose on its own (D16)', () => {
  const repoRoot = initTempRepo();
  const reason = 'Không rõ nên tách theo domain hay theo tầng kỹ thuật.';

  assert.equal(fgos(repoRoot, ['init']).status, 0);

  const submitted = submit(repoRoot, 'Restructure the whole thing, somehow');
  // tsk-30v D2/D6: a fresh item now starts at discovery (stages[0])
  // directly, and a clear verdict there skips exploring, landing on
  // planning in ONE explicit discover call.
  assert.equal(fgos(repoRoot, ['discover', submitted.id, '--verdict', 'clear', '--verify', 'test -f ambiguous-done.txt']).status, 0);

  const decomposed = fgos(repoRoot, ['plan', submitted.id, '--verdict', 'need-human', '--reason', reason]);
  assert.equal(decomposed.status, 0, `decompose failed: ${decomposed.stderr}`);

  let view = stateView(repoRoot);
  assert.equal(view.work[submitted.id].status, 'awaiting-human');
  assert.equal(view.work[submitted.id].stage, 'planning', 'need-human never advances stage past planning');
  assert.ok(view.gates[submitted.id].ask.includes(reason));
  assert.equal(Object.values(view.work).some((w) => w.parent === submitted.id), false, 'need-human writes nothing to the queue yet (Terms: đề xuất chia)');
  assert.equal(branchExists(repoRoot, `fgw/${submitted.id}`), false);

  const answered = fgos(repoRoot, ['answer', submitted.id, '--text', 'Tách theo domain.']);
  assert.equal(answered.status, 0, `answer failed: ${answered.stderr}`);
  assert.equal(stateView(repoRoot).work[submitted.id].status, 'todo');

  const noop = runner(repoRoot, ['--once']);
  assert.equal(noop.status, 0, `--once failed: ${noop.stderr}`);
  view = stateView(repoRoot);
  assert.equal(view.work[submitted.id].status, 'todo', 'the runner sweep still never re-judges decompose on its own (D16) -- a human must call decompose again');
  assert.equal(view.work[submitted.id].stage, 'planning');
});

// --- stage-discovery e2e (tsk-5mj D1/D6/D7, tsk-4v6): the runner
// dispatches a stage:discovery item to a real worker running
// fgos-coding-discovering (tsk-tku D7 — the skill chủ that itself calls
// fgos-researching as a helper), via the same spawnWorker/
// createDispatchWorktree pair stage:executing already uses. Originally
// (tsk-5mj) this had no verdict to
// gate the transition — any real commit unconditionally advanced discovery
// -> exploring. tsk-4v6 (CONTEXT.md D5, driver/launcher parity per
// 0026/0028/0029) closed that gap: the worker's own {clear, question?,
// verify?} verdict, reported via a `fgos-verdict` fence, now gates the
// transition exactly like the interactive driver path. -------------------

/** A fake research worker: writes RESEARCH.md under the item's own feature
 * dir, commits it on the dispatch branch (same discipline
 * writeCommittingExecutor already proves for stage:executing), and reports
 * its verdict via a `fgos-verdict` fence (tsk-4v6) — `clear: true` by
 * default; pass `clear: false` to prove the park path instead. Never that
 * fgos-coding-discovering's own real content shape (nor the
 * fgos-researching helper it calls) is followed (out of this item's
 * scope -- that skill's own job). */
function writeResearchWorkerExecutor(scriptDir, featureDir, { clear = true, verify = 'test -f later.txt', question = 'Which approach?' } = {}) {
  const scriptPath = path.join(scriptDir, 'research-worker-executor.mjs');
  const verdictBody = clear ? { clear: true, verify } : { clear: false, question };
  fs.writeFileSync(
    scriptPath,
    `
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
fs.mkdirSync(${JSON.stringify(featureDir)}, { recursive: true });
fs.writeFileSync(${JSON.stringify(path.posix.join(featureDir, 'RESEARCH.md'))}, '## Round 1\\n\\nFound: nothing blocking.\\n');
execFileSync('git', ['add', ${JSON.stringify(path.posix.join(featureDir, 'RESEARCH.md'))}]);
execFileSync('git', ['commit', '-q', '-m', 'research: round 1']);
process.stdout.write(${JSON.stringify('```fgos-verdict\n' + JSON.stringify(verdictBody) + '\n```\n')});
`,
  );
  return scriptPath;
}

test('e2e stage-discovery: --once dispatches a stage:discovery item to a real worker (isolated worktree/branch), which writes+commits RESEARCH.md and reports a clear verdict; the item advances discovery -> planning, status stays todo (never claimed/proposed)', () => {
  const repoRoot = initTempRepo();
  const scriptDir = mkTempDir('fgos-runner-e2e-discovery-dispatch-');
  const featureDir = 'docs/history/discovery-dispatch-item';

  assert.equal(fgos(repoRoot, ['init']).status, 0);
  writeRunnerConfig(repoRoot, writeResearchWorkerExecutor(scriptDir, featureDir));

  add(repoRoot, 'item-research', { stage: 'discovery', verify: 'chưa xác định — bổ sung thủ công' });
  assert.equal(stateView(repoRoot).work['item-research'].stage, 'discovery');

  const result = runner(repoRoot, ['--once']);
  assert.equal(result.status, 0, `--once failed: ${result.stderr}`);

  const view = stateView(repoRoot);
  const item = view.work['item-research'];
  assert.equal(item.stage, 'planning', 'tsk-30v D2/D6: a clear verdict skips exploring, advancing discovery -> planning directly');
  assert.equal(item.status, 'todo', 'discovery dispatch never claims/proposes -- planning is the next stop, not a terminal one');
  assert.equal(item.verify, 'test -f later.txt', "the worker's own proposed verify rode onto the item");
  assert.equal(branchExists(repoRoot, 'fgw/item-research'), true, 'the worker ran on its own real dispatch branch');
  assert.match(branchLog(repoRoot, 'fgw/item-research'), /research: round 1/);
});

test('e2e stage-discovery: --once advances the item to exploring and parks it in awaiting-human when the real worker reports an unclear verdict (tsk-4v6/tsk-30v)', () => {
  const repoRoot = initTempRepo();
  const scriptDir = mkTempDir('fgos-runner-e2e-discovery-dispatch-unclear-');
  const featureDir = 'docs/history/discovery-dispatch-unclear-item';

  assert.equal(fgos(repoRoot, ['init']).status, 0);
  writeRunnerConfig(repoRoot, writeResearchWorkerExecutor(scriptDir, featureDir, { clear: false, question: '## Context\n\nThe worker needs to pick a retry backoff strategy for the research step.\n\n## Why this matters\n\nThis directly affects the outcome: which retry backoff strategy?' }));

  add(repoRoot, 'item-research-unclear', { stage: 'discovery', verify: 'chưa xác định — bổ sung thủ công' });

  const result = runner(repoRoot, ['--once']);
  assert.equal(result.status, 0, `--once failed: ${result.stderr}`);

  const view = stateView(repoRoot);
  const item = view.work['item-research-unclear'];
  assert.equal(item.stage, 'exploring', 'tsk-30v D2/D3: unclear no longer parks in place -- it advances stage to exploring');
  assert.equal(item.status, 'awaiting-human', 'an unclear verdict parks the item, matching the interactive driver path');
  assert.equal(view.gates['item-research-unclear'].ask, '## Context\n\nThe worker needs to pick a retry backoff strategy for the research step.\n\n## Why this matters\n\nThis directly affects the outcome: which retry backoff strategy?');
});

test('e2e stage-discovery fail-safe: a worker that crashes leaves the item at stage:discovery, status:todo for the next sweep to retry -- never stuck, never silently advanced', () => {
  const repoRoot = initTempRepo();
  const scriptDir = mkTempDir('fgos-runner-e2e-discovery-dispatch-crash-');
  const crashingScript = path.join(scriptDir, 'crashing-executor.mjs');
  fs.writeFileSync(crashingScript, `process.exit(1);`);

  assert.equal(fgos(repoRoot, ['init']).status, 0);
  writeRunnerConfig(repoRoot, crashingScript);

  add(repoRoot, 'item-research-crash', { stage: 'discovery', verify: 'test -f later.txt' });

  const result = runner(repoRoot, ['--once']);
  assert.equal(result.status, 0, `--once must still exit 0 -- one item's failed research dispatch never halts the whole tick: ${result.stderr}`);

  const view = stateView(repoRoot);
  const item = view.work['item-research-crash'];
  assert.equal(item.stage, 'discovery', 'left exactly where it was for the next sweep to retry');
  assert.equal(item.status, 'todo');
});

// --- stage-decompose S2-pull e2e: cửa pull take/return through real fgos +
// fgos-runner binaries (stage-decompose-4, cell action (5)) ----------------

test('e2e S2-pull: submit pass-throughs 2 stages via discover, a human takes the frontier head, a concurrent fgos-runner --once never stomps the human-held claim, then the human commits real progress and returns to proposed', () => {
  const repoRoot = initTempRepo();
  const scriptDir = mkTempDir('fgos-runner-e2e-pull-');

  // `.fgos/state.json` is a derived view (gitignored); `.fgos/events.jsonl`
  // is the truth log and IS committed — same convention this very repo's own
  // .gitignore already declares. "Commit your work" for `return` therefore
  // covers both the real file AND the log deltas `take`/`discover` already
  // appended.
  fs.writeFileSync(path.join(repoRoot, '.gitignore'), '.fgos/state.json\n');
  execFileSync('git', ['add', '.gitignore'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'gitignore'], { cwd: repoRoot });

  assert.equal(fgos(repoRoot, ['init']).status, 0);
  writeRunnerConfig(repoRoot, writeAdaptiveWorkerExecutor(scriptDir));

  const submitted = submit(repoRoot, 'Rename a single config key, take by hand');
  assert.equal(submitted.stage, 'discovery');

  // Pass-through both stages via the SYNC session-role `discover`/`decompose`
  // verbs, each supplying an explicit --verdict (tsk-1x3 D1/D9/D16: a
  // session-role caller with nothing to go on now refuses loudly instead of
  // spawning a blind judge) — this never touches the runner's own dispatch
  // loop, so once the item reaches stage executing it is left sitting at
  // status todo: the exact frontier head a human `take` picks up next,
  // never auto-dispatched to a worker.
  const firstDiscover = fgos(repoRoot, ['discover', submitted.id, '--verdict', 'clear', '--verify', 'test -f pull-done.txt && echo PULL_OK']);
  assert.equal(firstDiscover.status, 0, `first discover failed: ${firstDiscover.stderr}`);
  assert.equal(stateView(repoRoot).work[submitted.id].stage, 'planning', 'tsk-30v D2/D6: a clear verdict at discovery skips exploring and lands on planning directly, in one hop');

  const decomposed = fgos(repoRoot, ['plan', submitted.id, '--verdict', 'pass-through', '--reason', 'single cohesive change']);
  assert.equal(decomposed.status, 0, `decompose failed: ${decomposed.stderr}`);
  let view = stateView(repoRoot);
  assert.equal(view.work[submitted.id].stage, 'executing', 'discovery->planning->executing chained via discover then plan');
  assert.equal(view.work[submitted.id].status, 'todo', 'pass-through never dispatches — a human takes it next');
  assert.equal(view.work[submitted.id].verify, 'test -f pull-done.txt && echo PULL_OK');

  // A human takes the frontier head by hand.
  const headAtTake = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  const taken = fgos(repoRoot, ['take']);
  assert.equal(taken.status, 0, `take failed: ${taken.stderr}`);
  assert.equal(envelopeData(taken.stdout).id, submitted.id);

  view = stateView(repoRoot);
  assert.equal(view.work[submitted.id].status, 'doing');
  assert.equal(view.work[submitted.id].claimRole, 'human');
  assert.equal(view.work[submitted.id].headAtTake, headAtTake);

  // A concurrent fgos-runner --once run right before return: the only item
  // is `doing`, held by a human — the frontier is empty and the reap must
  // never touch a human-held claim (cell action (4): reap skips human/
  // session, only reclaims a crashed RUNNER claim).
  const concurrent = runner(repoRoot, ['--once']);
  assert.equal(concurrent.status, 0, `concurrent --once failed: ${concurrent.stderr}`);
  assert.match(concurrent.stdout, /idle/);
  view = stateView(repoRoot);
  assert.equal(view.work[submitted.id].status, 'doing', 'the concurrent runner never reaped or reclaimed the human-held claim');
  assert.equal(view.work[submitted.id].claimRole, 'human', 'still human-claimed after the concurrent run');

  // The human does real work and commits it (the real file, plus whatever
  // events.jsonl deltas take/discover already appended).
  fs.writeFileSync(path.join(repoRoot, 'pull-done.txt'), 'done by hand\n');
  execFileSync('git', ['add', '-A'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'human: pull-done.txt'], { cwd: repoRoot });

  const returned = fgos(repoRoot, ['return', submitted.id]);
  assert.equal(returned.status, 0, `return failed: ${returned.stderr}`);
  const returnedData = envelopeData(returned.stdout);
  assert.equal(returnedData.to, 'awaiting-approval');
  assert.match(returnedData.output, /PULL_OK/, 'the real goal-check ran and its output surfaced, not just a status word');

  view = stateView(repoRoot);
  assert.equal(view.work[submitted.id].status, 'awaiting-approval');
  assert.equal(view.outcomes[submitted.id].actual.outcome, 'awaiting-approval');
  assert.equal(view.outcomes[submitted.id].actual.passed, true);
  assert.ok(view.outcomes[submitted.id].actual.aheadCount >= 1);

  // No settlement from this doing -> awaiting-approval edge (D4: settlement belongs
  // only to the -> done edge) — the earlier clarify-pass settlement (from
  // the discover step) is the only one on record.
  const settlementKinds = (view.settlements?.[submitted.id] ?? []).map((s) => s.kind);
  assert.deepEqual(settlementKinds, ['clarify-pass']);
});

// --- case 1: full journey, two items with a dep -----------------------------

test('e2e full journey: item1 (no deps) -> awaiting-approval with a worker commit on fgw/, item2 (dep on item1) stays closed while item1 is only proposed, second --once dispatches nothing', () => {
  const repoRoot = initTempRepo();
  const scriptDir = mkTempDir('fgos-runner-e2e-exec-');

  assert.equal(fgos(repoRoot, ['init']).status, 0);
  add(repoRoot, 'item1', { verify: 'test -f output.txt && echo VERIFY_OK' });
  add(repoRoot, 'item2', { deps: ['item1'], verify: 'test -f output2.txt' });

  writeRunnerConfig(repoRoot, writeCommittingExecutor(scriptDir, 'output.txt'));

  const eventsBeforeAdds = events(repoRoot);
  assert.equal(eventsBeforeAdds.length, 2, 'only the two work.add events so far');
  assert.equal(eventsBeforeAdds[0].type, 'work.add');
  assert.equal(eventsBeforeAdds[1].type, 'work.add');

  const first = runner(repoRoot, ['--once']);
  assert.equal(first.status, 0, `first --once failed: ${first.stderr}`);
  assert.match(first.stdout, /awaiting-approval/);
  assert.match(first.stdout, /item1/);

  // item1 proposed, item2 untouched (still todo — its dep is not `done`).
  const afterFirst = stateView(repoRoot);
  assert.equal(afterFirst.work.item1.status, 'awaiting-approval');
  assert.equal(afterFirst.work.item2.status, 'todo');

  // fgw/item1 exists and carries exactly the worker's commit.
  assert.equal(branchExists(repoRoot, 'fgw/item1'), true);
  assert.match(branchLog(repoRoot, 'fgw/item1'), /worker: output\.txt/);
  assert.equal(branchAheadCount(repoRoot, 'fgw/item1'), 1);
  assert.equal(branchExists(repoRoot, 'fgw/item2'), false, 'item2 was never dispatched');

  // the runner ran the item's OWN verify itself (goal-check) — its stdout
  // is the evidence, not the worker's say-so: the tail the runner prints
  // carries the marker only `test -f output.txt && echo VERIFY_OK` prints.
  assert.match(first.stdout, /VERIFY_OK/);

  // events.jsonl carries the real chain: two adds, then doing, then a
  // predicted work.outcome (written at claim), then proposed for item1
  // only, then an actual work.outcome (written on the pass terminal) —
  // every event from Phase 2 on carries `v`.
  const afterFirstEvents = events(repoRoot);
  assert.deepEqual(
    afterFirstEvents.map((e) => (e.type === 'work.outcome'
      ? `work.outcome:${e.payload.id}:${e.payload.predicted ? 'predicted' : 'actual'}`
      : `${e.type}:${e.payload.id}:${e.payload.to ?? 'add'}`)),
    [
      'work.add:item1:add',
      'work.add:item2:add',
      'work.move:item1:doing',
      'work.outcome:item1:predicted',
      'executor.dispatch:item1:add', // D8, tsk-62v: dispatch announce/audit entry
      'work.move:item1:awaiting-approval',
      'work.handoff:item1:reviewer', // D18: moveWork's own side effect on reaching awaiting-approval, not a second writer
      'work.outcome:item1:actual',
    ],
  );
  const doingEvent = afterFirstEvents.find((e) => e.type === 'work.move' && e.payload.to === 'doing');
  const proposedEvent = afterFirstEvents.find((e) => e.type === 'work.move' && e.payload.to === 'awaiting-approval');
  assert.equal(doingEvent.payload.id, 'item1');
  assert.equal(proposedEvent.payload.id, 'item1');
  assert.equal(typeof doingEvent.v, 'number', 'doing event carries a schema version');
  assert.equal(typeof proposedEvent.v, 'number', 'proposed event carries a schema version');
  // actual is real dispatch evidence (real subprocess, real goal-check),
  // sourced from the runner's own branchFacts — never the worker's report.
  const actualOutcomeEvent = afterFirstEvents.find((e) => e.type === 'work.outcome' && e.payload.actual);
  assert.equal(actualOutcomeEvent.payload.actual.outcome, 'awaiting-approval');
  assert.equal(actualOutcomeEvent.payload.actual.passed, true);
  assert.equal(actualOutcomeEvent.payload.actual.aheadCount, 1);

  // second --once: item2's dep (item1) is `proposed`, not `done` — the
  // frontier is empty, nothing gets dispatched a second time.
  const second = runner(repoRoot, ['--once']);
  assert.equal(second.status, 0, `second --once failed: ${second.stderr}`);
  assert.match(second.stdout, /idle/);
  assert.equal(stateView(repoRoot).work.item2.status, 'todo');
  assert.equal(events(repoRoot).length, afterFirstEvents.length, 'the idle pass appended no event');

  // CoS evidence (phase-3-compound-learning-3): after a REAL --once run (not
  // fixture-only), `fgos check` reads the on-disk log and prints BOTH
  // halves of the predicted->actual pair for item1 — real values, not just
  // an "outcome exists" flag.
  const check = fgos(repoRoot, ['check', 'item1']);
  assert.equal(check.status, 0, `fgos check failed: ${check.stderr}`);
  const checkData = envelopeData(check.stdout);
  assert.equal(checkData.outcomes[0].id, 'item1');
  assert.equal(checkData.outcomes[0].predicted.tier, 'standard', 'predicted half carries the real claimed tier');
  assert.equal(checkData.outcomes[0].actual.outcome, 'awaiting-approval', 'actual half carries the real dispatch outcome');
  assert.equal(checkData.outcomes[0].actual.passed, true);
});

// CoS evidence (D2/l2-3): the "full journey" test above already asserts
// `first.stdout` against /awaiting-approval/ and /item1/ substring regexes, but those
// match loop.mjs's own untouched progress-trace lines (loop.mjs:730-731), not
// printResult()'s envelope line — it never parses stdout as structured data.
// This test covers that new case: the runner's own trailing line is a real,
// parseable fgos.v1 envelope, not just a string containing the right words.
test('e2e runner --once prints a trailing fgos.v1 envelope: the last stdout line parses as fgos.v1 with the real dispatched outcome', () => {
  const repoRoot = initTempRepo();
  const scriptDir = mkTempDir('fgos-runner-e2e-exec-');

  assert.equal(fgos(repoRoot, ['init']).status, 0);
  add(repoRoot, 'item1', { verify: 'test -f output.txt && echo VERIFY_OK' });
  writeRunnerConfig(repoRoot, writeCommittingExecutor(scriptDir));

  const result = runner(repoRoot, ['--once']);
  assert.equal(result.status, 0, `--once failed: ${result.stderr}`);

  // loop.mjs's own progress-trace lines (untouched, D2) and printResult()'s
  // one compact single-line envelope are two independent, interleaved stdout
  // writers — the envelope is reliably the LAST non-empty line because it is
  // the only thing printResult() writes, and it writes after runOnce settles.
  const lines = result.stdout.split('\n').filter(Boolean);
  const envelope = JSON.parse(lines[lines.length - 1]);
  assert.equal(envelope.contract, 'fgos.v1');
  assert.equal(typeof envelope.data_hash, 'string');
  assert.ok(envelope.data_hash.length > 0, 'data_hash is a non-empty string');
  assert.equal(envelope.data.dispatched[0].outcome, 'awaiting-approval');
});

// --- case 2: verify-red -> blocked, never proposed --------------------------

test('e2e verify-red: a worker that commits the wrong thing fails goal-check on every attempt -> retried per the matrix, then parked blocked, never proposed', () => {
  const repoRoot = initTempRepo();
  const scriptDir = mkTempDir('fgos-runner-e2e-exec-');

  assert.equal(fgos(repoRoot, ['init']).status, 0);
  add(repoRoot, 'item-red', { verify: 'test -f output.txt' });
  writeRunnerConfig(repoRoot, writeWrongCommitExecutor(scriptDir));

  const result = runner(repoRoot, ['--once']);
  assert.equal(result.status, 0, `--once should still exit 0 for a parked item: ${result.stderr}`);
  assert.match(result.stdout, /parked/);

  assert.equal(stateView(repoRoot).work['item-red'].status, 'blocked');
  assert.notEqual(stateView(repoRoot).work['item-red'].status, 'awaiting-approval');
  assert.equal(branchExists(repoRoot, 'fgw/item-red'), true, 'the (wrong) attempt still leaves its branch behind');

  const redEvents = events(repoRoot);
  const seq = redEvents.map((e) => (e.type === 'work.outcome'
    ? `work.outcome:${e.payload.predicted ? 'predicted' : 'actual'}`
    : `${e.type}:${e.payload.to ?? e.payload.id ?? ''}`));
  assert.deepEqual(seq, [
    'work.add:item-red',
    'work.move:doing',
    'work.outcome:predicted',
    // D8, tsk-62v: one dispatch announce/audit entry per attempt — two
    // retry attempts run before the item parks to blocked.
    'executor.dispatch:item-red',
    'executor.dispatch:item-red',
    'work.move:blocked',
    'work.outcome:actual',
    'work.friction:item-red',
  ]);

  // actual on the park terminal, real verify-red evidence — closes the
  // HIGH-risk "failures learn nothing" gap: a park must not be silent.
  // work.friction (S2, kênh 2 của capture) rides alongside it, real e2e
  // evidence the friction channel fires on a genuine dispatch, not just unit.
  const actualOutcomeEvent = redEvents.find((e) => e.type === 'work.outcome' && e.payload.actual);
  assert.equal(actualOutcomeEvent.payload.actual.outcome, 'parked');
  assert.equal(actualOutcomeEvent.payload.actual.passed, false);
  assert.equal(actualOutcomeEvent.payload.actual.errorClass, 'verify-miss');
});

// --- case 3: crash-idempotency ----------------------------------------------

test('e2e crash-idempotency: runner killed mid-item (after doing, before proposed) -> a second --once reaps the item to a defined state, exactly one worker commit, no leaked worktree', () => {
  const repoRoot = initTempRepo();
  const scriptDir = mkTempDir('fgos-runner-e2e-exec-');

  assert.equal(fgos(repoRoot, ['init']).status, 0);
  add(repoRoot, 'item-crash', { verify: 'test -f output.txt' });
  const configPath = writeExplicitRunnerConfigFile(repoRoot, writeParentKillingExecutor(scriptDir, 'output.txt'));

  // First --once: the worker commits, then SIGKILLs its own parent (the
  // runner) before the runner can write `proposed`. The runner process
  // dies mid-dispatch — its own worktree teardown (in a `finally`) never
  // runs, so `fgw/item-crash` is left checked out at whatever path the
  // runner allocated for this attempt.
  const first = runner(repoRoot, ['--once', '--config', configPath]);
  // Killed by SIGKILL: no graceful exit code, no controlled stdout.
  assert.equal(first.status, null);
  assert.equal(first.signal, 'SIGKILL');

  // The claim (todo -> doing) landed before the kill; the item is left
  // sitting in `doing` with a real commit already on its branch.
  assert.equal(stateView(repoRoot).work['item-crash'].status, 'doing');
  assert.equal(branchExists(repoRoot, 'fgw/item-crash'), true);
  assert.equal(branchAheadCount(repoRoot, 'fgw/item-crash'), 1);

  // Second --once: the killed runner left its runner.lock behind, so this
  // run cleans the stale lock and yields busy (exit 6) — the reclaimer
  // never acquires on the path it just deleted (clean-and-yield).
  const second = runner(repoRoot, ['--once', '--config', configPath]);
  assert.equal(second.status, 6, `expected busy (stale lock cleaned): ${second.stderr}`);
  assert.equal(fs.existsSync(path.join(repoRoot, '.fgos', 'runner.lock')), false);

  // Third --once: acquires a clean lock; startup reap resolves the stale
  // `doing` item to a defined state (proposed, since the branch's commit
  // passes verify) — crash recovery lands within two ticks.
  const third = runner(repoRoot, ['--once', '--config', configPath]);
  assert.equal(third.status, 0, `post-clean --once did not recover cleanly: ${third.stderr}`);

  const finalStatus = stateView(repoRoot).work['item-crash'].status;
  assert.ok(
    finalStatus === 'awaiting-approval' || finalStatus === 'blocked',
    `expected the crashed item to reap to a defined state (proposed/blocked), got "${finalStatus}"`,
  );

  // Exactly one worker commit on the branch — the reap must never re-run
  // (and hence never re-commit) the same item.
  assert.equal(branchAheadCount(repoRoot, 'fgw/item-crash'), 1);

  // No worktree leak: only the main worktree is still registered against
  // this repo — the killed first attempt's checkout and the second
  // attempt's own throwaway reap checkout must both be gone.
  assert.equal(worktreeCount(repoRoot), 1);
});

// --- --watch (str7-str8-priority-intent D8) ---------------------------------
// Async spawn+kill pattern (not spawnSync, which blocks until exit and
// cannot deliver a mid-run signal) mirrors test/util/session-identity
// .test.mjs's real spawned-process test (~lines 87-139): spawn, await a
// stdout marker via a Promise, act on the live child, assert, SIGKILL in a
// `finally` so a bug here fails loudly instead of hanging the suite.

function runnerAsync(cwd, args) {
  return spawn(process.execPath, [RUNNER, ...args], { cwd, encoding: 'utf8' });
}

/** Buffer a child's stdout and resolve the first time it contains `marker`,
 * rejecting on early exit/error or after `timeoutMs` — polls the buffer
 * rather than sleeping a fixed duration, so the wait is exactly as long as
 * the real cycle takes and no longer. */
function waitForStdout(child, marker, timeoutMs = 5000) {
  let buf = '';
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out waiting for "${marker}" in stdout; got: ${buf}`)), timeoutMs);
    const onData = (chunk) => {
      buf += chunk;
      if (buf.includes(marker)) {
        clearTimeout(timer);
        child.stdout.off('data', onData);
        resolve(buf);
      }
    };
    child.stdout.on('data', onData);
    child.once('exit', (code, signal) => {
      if (!buf.includes(marker)) {
        clearTimeout(timer);
        reject(new Error(`process exited (code ${code}, signal ${signal}) before "${marker}" appeared; got: ${buf}`));
      }
    });
    child.once('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

test('e2e --watch: stays alive over an idle frontier, completes a cycle, and a single SIGINT stops it cleanly (exit 0) within 2000ms', { timeout: 10_000 }, async () => {
  const repoRoot = initTempRepo();
  assert.equal(fgos(repoRoot, ['init']).status, 0);

  const child = runnerAsync(repoRoot, ['--watch', '--poll-ms', '200']);
  let stdout = '';
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  let stderr = '';
  child.stderr.on('data', (chunk) => { stderr += chunk; });

  try {
    // Proof of at least one completed drain cycle over the idle frontier —
    // never a fixed sleep. Marker is loop.mjs's own untouched progress-trace
    // line (D2: this cell only reshapes printResult()'s trailing line into
    // an fgos.v1 envelope, not loop.mjs's log() stream, so this text is the
    // same before and after).
    await waitForStdout(child, 'fgos-runner: frontier empty — nothing to do.');

    const sigintSentAt = Date.now();
    child.kill('SIGINT');

    const exit = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`did not exit within bound; stdout: ${stdout}; stderr: ${stderr}`)), 2000);
      child.once('exit', (code, signal) => {
        clearTimeout(timer);
        resolve({ code, signal });
      });
    });

    assert.ok(Date.now() - sigintSentAt < 2000, 'exited within the 2000ms bound');
    assert.equal(exit.code, 0, `expected clean exit 0, got code=${exit.code} signal=${exit.signal}; stderr: ${stderr}`);
    assert.match(stdout, /fgos-runner: watch mode stopped \(signal received\)/);
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
  }
});

test('e2e --watch --dry-run is rejected as a validation error (exit 4)', () => {
  const repoRoot = initTempRepo();
  assert.equal(fgos(repoRoot, ['init']).status, 0);

  const result = runner(repoRoot, ['--watch', '--dry-run']);
  assert.equal(result.status, 4, `expected validation exit 4: ${result.stderr}`);
  assert.match(result.stderr, /--watch cannot be combined with --dry-run/);
});

test('e2e --watch --poll-ms with a non-positive/invalid value is rejected as a validation error (exit 4), never silently becomes NaN', () => {
  const repoRoot = initTempRepo();
  assert.equal(fgos(repoRoot, ['init']).status, 0);

  const nonNumeric = runner(repoRoot, ['--watch', '--poll-ms', 'abc']);
  assert.equal(nonNumeric.status, 4, `expected validation exit 4: ${nonNumeric.stderr}`);
  assert.match(nonNumeric.stderr, /--poll-ms requires a positive number/);

  const negative = runner(repoRoot, ['--watch', '--poll-ms', '-1']);
  assert.equal(negative.status, 4, `expected validation exit 4: ${negative.stderr}`);
  assert.match(negative.stderr, /--poll-ms requires a positive number/);
});
