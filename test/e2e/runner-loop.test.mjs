import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

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
    '--risk', extra.risk ?? 'low',
    '--verify', extra.verify ?? 'test -f output.txt',
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

function events(cwd) {
  return fs
    .readFileSync(logPath(cwd), 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function writeRunnerConfig(repoRoot, executorScript) {
  fs.writeFileSync(
    path.join(repoRoot, '.fgos-runner.json'),
    JSON.stringify({
      executor: { command: process.execPath, args: [executorScript, '{prompt}', '--model', '{model}'] },
      models: { light: 'haiku', standard: 'sonnet', heavy: 'opus' },
      timeoutMs: 15000,
    }),
  );
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

/** A discovery-aware executor (stage-clarify D4/D5/D13; extended by
 * stage-decompose D2/cell 3): the runner spawns the SAME configured executor
 * for THREE call sites — the context-discovery verdict call
 * (`discovery.mjs`'s own prompt, which always starts with "# Context-
 * discovery"), the chia-việc verdict call (`decompose.mjs`'s own prompt,
 * "# Chia-việc (decompose)" — a clear-discovery item now lands on stage
 * `decompose` next, per D2, so this call site fires in the SAME sweep pass;
 * answered pass-through here so a simple item still chains straight through
 * to executing), and the worker dispatch call (`dispatch.mjs`'s
 * `buildPrompt`, which always starts with "# Goal"). This script tells the
 * three apart by their fixed prefixes: on a worker prompt it behaves exactly
 * like `writeCommittingExecutor` (writes+commits the proof file). One real
 * process serves all three calls — nothing here stubs `resolveDiscovery`/
 * `resolveDecompose` themselves. */
function writeClearDiscoveryExecutor(scriptDir, { verify, produce = 'output.txt' }) {
  const scriptPath = path.join(scriptDir, 'clear-discovery-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const prompt = process.argv[2] ?? '';
if (prompt.startsWith('# Context-discovery')) {
  process.stdout.write(JSON.stringify({ clear: true, verify: ${JSON.stringify(verify)} }));
} else if (prompt.startsWith('# Chia-việc (decompose)')) {
  process.stdout.write(JSON.stringify({ verdict: 'pass-through' }));
} else {
  fs.writeFileSync(${JSON.stringify(produce)}, 'produced by worker\\n');
  execFileSync('git', ['add', ${JSON.stringify(produce)}]);
  execFileSync('git', ['commit', '-q', '-m', ${JSON.stringify(`worker: ${produce}`)}]);
}
`,
  );
  return scriptPath;
}

/** Always reports an unclear verdict with a fixed question — a work item
 * whose executor is this script never leaves clarify, so it never reaches
 * the worker-prompt call site at all. */
function writeUnclearDiscoveryExecutor(scriptDir, question) {
  const scriptPath = path.join(scriptDir, 'unclear-discovery-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `process.stdout.write(JSON.stringify({ clear: false, question: ${JSON.stringify(question)} }));`,
  );
  return scriptPath;
}

/** Simulates a misbehaving real model call: stdout that is not JSON at all.
 * `judgeDiscovery`'s fail-safe (D4) must fold this into "not clear" without
 * throwing past it — never a crash, never a silent stall. */
function writeGarbageDiscoveryExecutor(scriptDir) {
  const scriptPath = path.join(scriptDir, 'garbage-discovery-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `process.stdout.write('not json at all, definitely garbage output from a misbehaving model call');`,
  );
  return scriptPath;
}

/** A chia-việc-aware executor (stage-decompose D2/D3, mirroring
 * writeClearDiscoveryExecutor one stage over): the SAME configured executor
 * serves THREE call sites — context-discovery ("# Context-discovery"),
 * chia-việc ("# Chia-việc (decompose)", decompose.mjs's own fixed prompt
 * prefix), and the worker dispatch ("# Goal", dispatch.mjs's buildPrompt) —
 * told apart by their fixed prefixes. The worker branch is ADAPTIVE: it
 * pulls the file its own dispatched item's `verify` checks for straight out
 * of the prompt's "Expected proof" section (`test -f <file>`), so one script
 * can produce whatever a root OR any of its generated children need without
 * hardcoding an id — real proof per item, never a single shared stub. */
function writeDecomposeAwareExecutor(scriptDir, { discoveryVerify, decomposeVerdict }) {
  const scriptPath = path.join(scriptDir, 'decompose-aware-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const prompt = process.argv[2] ?? '';
if (prompt.startsWith('# Context-discovery')) {
  process.stdout.write(JSON.stringify({ clear: true, verify: ${JSON.stringify(discoveryVerify)} }));
} else if (prompt.startsWith('# Chia-việc (decompose)')) {
  process.stdout.write(JSON.stringify(${JSON.stringify(decomposeVerdict)}));
} else {
  const match = prompt.match(/test -f (\\S+)/);
  const file = match ? match[1] : 'output.txt';
  fs.writeFileSync(file, 'produced by worker\\n');
  execFileSync('git', ['add', file]);
  execFileSync('git', ['commit', '-q', '-m', \`worker: \${file}\`]);
}
`,
  );
  return scriptPath;
}

// --- stage-clarify e2e: 3 verdict scenarios through real fgos + fgos-runner
// binaries (stage-clarify-4, per plan.md Risk Map "verdict parse phi tất
// định" HIGH row) -------------------------------------------------------

test('e2e stage-clarify (a) clear verdict: submit -> --once takes the item stage clarify->executing with the model-proposed verify replacing the submit sentinel, and the same run dispatches it on to proposed', () => {
  const repoRoot = initTempRepo();
  const scriptDir = mkTempDir('fgos-runner-e2e-discovery-');

  assert.equal(fgos(repoRoot, ['init']).status, 0);
  writeRunnerConfig(
    repoRoot,
    writeClearDiscoveryExecutor(scriptDir, { verify: 'test -f output.txt && echo VERIFY_OK' }),
  );

  const submitted = submit(repoRoot, 'Investigate the sluggish overview page');
  assert.equal(submitted.stage, 'clarify');
  assert.equal(submitted.verify, 'chưa xác định — P15 bổ sung', 'submit sentinel before discovery runs (D5 fgos.mjs)');

  const first = runner(repoRoot, ['--once']);
  assert.equal(first.status, 0, `--once failed: ${first.stderr}`);

  const afterFirst = stateView(repoRoot);
  const item = afterFirst.work[submitted.id];
  assert.equal(item.stage, 'executing', 'a clear verdict moves the item out of clarify (D1/D12)');
  assert.equal(item.verify, 'test -f output.txt && echo VERIFY_OK', 'the verdict verify replaced the submit sentinel, one event (D10)');

  // sweep runs before the frontier is computed (loop.mjs), so this item —
  // still status:todo the whole time — became the frontier head in the same
  // tick and was dispatched to proposed via the SAME scripted executor's
  // worker-prompt branch, all within this one --once call.
  assert.equal(item.status, 'proposed');
  assert.equal(branchExists(repoRoot, `fgw/${submitted.id}`), true);
  assert.match(branchLog(repoRoot, `fgw/${submitted.id}`), /worker: output\.txt/);

  const discovery = afterFirst.discovery[submitted.id];
  assert.equal(discovery.length, 1);
  assert.equal(discovery[0].clear, true);

  // `fgos list` (the public read surface) confirms the same facts.
  const list = envelopeData(fgos(repoRoot, ['list']).stdout);
  assert.equal(list.work[submitted.id].stage, 'executing');
  assert.equal(list.work[submitted.id].verify, 'test -f output.txt && echo VERIFY_OK');
});

test('e2e stage-clarify (b) unclear verdict: submit -> --once parks the item in awaiting-human with the exact question (still stage clarify); answering it and running --once again resweeps discovery (D7 loop)', () => {
  const repoRoot = initTempRepo();
  const scriptDir = mkTempDir('fgos-runner-e2e-discovery-');
  const question = 'Bạn muốn ưu tiên hiệu năng hay độ chính xác?';

  assert.equal(fgos(repoRoot, ['init']).status, 0);
  writeRunnerConfig(repoRoot, writeUnclearDiscoveryExecutor(scriptDir, question));

  const submitted = submit(repoRoot, 'Do the ambiguous work');

  const first = runner(repoRoot, ['--once']);
  assert.equal(first.status, 0, `--once failed: ${first.stderr}`);

  let view = stateView(repoRoot);
  assert.equal(view.work[submitted.id].status, 'awaiting-human');
  assert.equal(view.work[submitted.id].stage, 'clarify', 'an unclear verdict never advances stage (D7)');
  assert.equal(view.gates[submitted.id].ask, question);
  assert.equal(view.discovery[submitted.id].length, 1);
  assert.equal(view.discovery[submitted.id][0].clear, false);
  assert.equal(view.discovery[submitted.id][0].question, question);
  assert.equal(branchExists(repoRoot, `fgw/${submitted.id}`), false, 'an item still in clarify is never dispatched');

  const answered = fgos(repoRoot, ['answer', submitted.id, '--text', 'Ưu tiên độ chính xác.']);
  assert.equal(answered.status, 0, `answer failed: ${answered.stderr}`);
  assert.equal(stateView(repoRoot).work[submitted.id].status, 'todo', 'answering resumes to todo, still stage clarify (D7)');

  const second = runner(repoRoot, ['--once']);
  assert.equal(second.status, 0, `second --once failed: ${second.stderr}`);

  view = stateView(repoRoot);
  assert.equal(view.discovery[submitted.id].length, 2, 'the clarify loop reran context-discovery after the answer (D7)');
  assert.equal(view.work[submitted.id].status, 'awaiting-human', 'the same scripted executor still returns unclear — parked again');
  assert.equal(view.gates[submitted.id].ask, question);
});

test('e2e stage-clarify (c) garbage verdict: an executor that prints non-JSON stdout on the discovery call never crashes --once — the runner still exits 0 and the item lands in awaiting-human with the fixed fail-safe question (D4)', () => {
  const repoRoot = initTempRepo();
  const scriptDir = mkTempDir('fgos-runner-e2e-discovery-');

  assert.equal(fgos(repoRoot, ['init']).status, 0);
  writeRunnerConfig(repoRoot, writeGarbageDiscoveryExecutor(scriptDir));

  const submitted = submit(repoRoot, 'Investigate the sluggish overview page');

  const result = runner(repoRoot, ['--once']);
  assert.equal(result.status, 0, `unparsable discovery stdout must not crash the runner: ${result.stderr}`);
  assert.equal(result.signal, null);

  const view = stateView(repoRoot);
  assert.equal(view.work[submitted.id].status, 'awaiting-human', 'an unparsable verdict folds into "not clear", never a silent drop (D4)');
  assert.equal(view.work[submitted.id].stage, 'clarify');
  assert.equal(view.gates[submitted.id].ask, 'Không phán được rõ ràng — cần người xác nhận thủ công.');
  assert.equal(view.discovery[submitted.id].length, 1);
  assert.equal(view.discovery[submitted.id][0].clear, false);
});

// --- stage-decompose e2e: 3 verdict scenarios through real fgos +
// fgos-runner binaries (stage-decompose-3, mẫu stage-clarify cell 4) -------

test('e2e stage-decompose (a) simple item pass-through: submit -> --once chains clarify->decompose->executing in one sweep pass and dispatches it on to proposed the same run; the clarify-pass settlement (cell 1 re-guard) still fires even though clarify itself now targets decompose', () => {
  const repoRoot = initTempRepo();
  const scriptDir = mkTempDir('fgos-runner-e2e-decompose-');

  assert.equal(fgos(repoRoot, ['init']).status, 0);
  writeRunnerConfig(
    repoRoot,
    writeDecomposeAwareExecutor(scriptDir, {
      discoveryVerify: 'test -f simple-done.txt && echo SIMPLE_OK',
      decomposeVerdict: { verdict: 'pass-through' },
    }),
  );

  const submitted = submit(repoRoot, 'Rename a single config key');
  assert.equal(submitted.stage, 'clarify');

  const first = runner(repoRoot, ['--once']);
  assert.equal(first.status, 0, `--once failed: ${first.stderr}`);

  const view = stateView(repoRoot);
  const item = view.work[submitted.id];
  assert.equal(item.stage, 'executing', 'clarify->decompose->executing chained within one sweep pass (D2)');
  assert.equal(item.status, 'proposed', 'pass-through leaves the item dispatchable in the same tick');
  assert.equal(item.verify, 'test -f simple-done.txt && echo SIMPLE_OK');
  assert.equal(branchExists(repoRoot, `fgw/${submitted.id}`), true);
  assert.match(branchLog(repoRoot, `fgw/${submitted.id}`), /worker: simple-done\.txt/);

  // must_haves truth 4: the clarify-pass settlement (cell 1's re-guard on
  // from === 'clarify') still fires even though clarify's own destination is
  // now `decompose`, not `executing`.
  assert.equal(view.settlements[submitted.id].length, 1);
  assert.equal(view.settlements[submitted.id][0].kind, 'clarify-pass');
  assert.equal(view.settlements[submitted.id][0].actor, 'runner');

  // a pass-through verdict writes no lineage at all.
  assert.equal(Object.values(view.work).some((w) => w.parent === submitted.id), false);
});

test('e2e stage-decompose (b) complex item: decompose sweep writes 2 children (real parent+deps+verify, D2/D5), the root is frontier-blocked until both children reach done, then it lots frontier and runs its OWN verify -> proposed (D4)', () => {
  const repoRoot = initTempRepo();
  const scriptDir = mkTempDir('fgos-runner-e2e-decompose-');

  assert.equal(fgos(repoRoot, ['init']).status, 0);
  writeRunnerConfig(
    repoRoot,
    writeDecomposeAwareExecutor(scriptDir, {
      discoveryVerify: 'test -f root-done.txt && echo ROOT_OK',
      decomposeVerdict: {
        verdict: 'decompose',
        children: [
          { title: 'Build the base module', verify: 'test -f child-a.txt', kind: 'task', risk: 'low', refs: [], deps: [] },
          { title: 'Wire the base module in', verify: 'test -f child-b.txt', kind: 'task', risk: 'low', refs: [], deps: [0] },
        ],
      },
    }),
  );

  const submitted = submit(repoRoot, 'Rebuild the whole intake pipeline');

  // --once #1: clarify sweep + decompose sweep write the 2 children and move
  // the root straight to executing (D4 note: the STAGE never blocks it, the
  // frontier's lineage filter does); childA (no deps) is the frontier head
  // this same tick and gets dispatched.
  const first = runner(repoRoot, ['--once']);
  assert.equal(first.status, 0, `first --once failed: ${first.stderr}`);

  let view = stateView(repoRoot);
  const root = view.work[submitted.id];
  assert.equal(root.stage, 'executing');
  assert.equal(root.status, 'todo', 'the root itself was never dispatched — its descendants are still open (D4/D5 lineage filter)');

  const children = Object.values(view.work)
    .filter((w) => w.parent === submitted.id)
    .sort((x, y) => x.deps.length - y.deps.length);
  assert.equal(children.length, 2, 'two children written with real parent lineage (D5)');
  const [childA, childB] = children;
  assert.equal(childA.deps.length, 0);
  assert.deepEqual(childB.deps, [childA.id], 'sibling dep resolved from the model-supplied index to a real id');
  assert.equal(childA.stage, 'executing');
  assert.equal(childB.stage, 'executing');
  assert.equal(childA.verify, 'test -f child-a.txt');
  assert.equal(childB.verify, 'test -f child-b.txt');
  assert.equal(childA.status, 'proposed', 'childA (no deps) was the frontier head this same tick and got dispatched');
  assert.equal(childB.status, 'todo', 'childB is blocked on childA, which is only proposed (not done) yet');

  // Accept childA into the tree (human close via the normal `done` door).
  // A coding item must pass through the compound-learn stage before done (D3).
  assert.equal(fgos(repoRoot, ['compound', childA.id]).status, 0);
  assert.equal(fgos(repoRoot, ['move', childA.id, '--to', 'done']).status, 0);

  // --once #2: childB's dep is now done — it becomes the frontier head.
  const second = runner(repoRoot, ['--once']);
  assert.equal(second.status, 0, `second --once failed: ${second.stderr}`);
  view = stateView(repoRoot);
  assert.equal(view.work[childB.id].status, 'proposed');
  assert.equal(view.work[submitted.id].status, 'todo', 'the root is still blocked — childB is proposed, not done, yet');

  // childB must also pass through compound-learn before done (D3).
  assert.equal(fgos(repoRoot, ['compound', childB.id]).status, 0);
  assert.equal(fgos(repoRoot, ['move', childB.id, '--to', 'done']).status, 0);

  // --once #3: both children done -> the lineage filter drops -> the root is
  // now the frontier's only item; the runner runs the ROOT'S OWN verify
  // (carried from its clarify-pass, `root-done.txt`), never either child's.
  const third = runner(repoRoot, ['--once']);
  assert.equal(third.status, 0, `third --once failed: ${third.stderr}`);
  view = stateView(repoRoot);
  assert.equal(view.work[submitted.id].status, 'proposed', 'the root lot frontier and proved itself with its own verify (D4)');
  assert.match(branchLog(repoRoot, `fgw/${submitted.id}`), /worker: root-done\.txt/);
  assert.equal(view.work[childA.id].status, 'done');
  assert.equal(view.work[childB.id].status, 'done');
});

test('e2e stage-decompose (c) ambiguous verdict: decompose sweep parks the item in awaiting-human carrying the chia-việc proposal (still stage decompose, no children written); answering resumes it to todo and a resweep re-parks under the still-ambiguous verdict (D3/D7 parity)', () => {
  const repoRoot = initTempRepo();
  const scriptDir = mkTempDir('fgos-runner-e2e-decompose-');
  const reason = 'Không rõ nên tách theo domain hay theo tầng kỹ thuật.';

  assert.equal(fgos(repoRoot, ['init']).status, 0);
  writeRunnerConfig(
    repoRoot,
    writeDecomposeAwareExecutor(scriptDir, {
      discoveryVerify: 'test -f ambiguous-done.txt',
      decomposeVerdict: { verdict: 'need-human', reason },
    }),
  );

  const submitted = submit(repoRoot, 'Restructure the whole thing, somehow');

  const first = runner(repoRoot, ['--once']);
  assert.equal(first.status, 0, `--once failed: ${first.stderr}`);

  let view = stateView(repoRoot);
  assert.equal(view.work[submitted.id].status, 'awaiting-human');
  assert.equal(view.work[submitted.id].stage, 'decompose', 'need-human never advances stage past decompose (mirrors D7 for clarify)');
  assert.ok(view.gates[submitted.id].ask.includes(reason));
  assert.equal(Object.values(view.work).some((w) => w.parent === submitted.id), false, 'need-human writes nothing to the queue yet (Terms: đề xuất chia)');
  assert.equal(branchExists(repoRoot, `fgw/${submitted.id}`), false);

  const answered = fgos(repoRoot, ['answer', submitted.id, '--text', 'Tách theo domain.']);
  assert.equal(answered.status, 0, `answer failed: ${answered.stderr}`);
  assert.equal(stateView(repoRoot).work[submitted.id].status, 'todo');

  const second = runner(repoRoot, ['--once']);
  assert.equal(second.status, 0, `second --once failed: ${second.stderr}`);

  view = stateView(repoRoot);
  assert.equal(view.work[submitted.id].status, 'awaiting-human', 'the same scripted executor still returns need-human — parked again');
  assert.equal(view.work[submitted.id].stage, 'decompose');
  assert.ok(view.gates[submitted.id].ask.includes(reason));
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
  writeRunnerConfig(
    repoRoot,
    writeDecomposeAwareExecutor(scriptDir, {
      discoveryVerify: 'test -f pull-done.txt && echo PULL_OK',
      decomposeVerdict: { verdict: 'pass-through' },
    }),
  );

  const submitted = submit(repoRoot, 'Rename a single config key, take by hand');
  assert.equal(submitted.stage, 'clarify');

  // Pass-through both stages via the SYNC session-actor `discover` verb
  // (mirrors the existing "discover called a second time" CLI test) — this
  // never touches the runner's own dispatch loop, so once the item reaches
  // stage executing it is left sitting at status todo: the exact frontier
  // head a human `take` picks up next, never auto-dispatched to a worker.
  const firstDiscover = fgos(repoRoot, ['discover', submitted.id]);
  assert.equal(firstDiscover.status, 0, `first discover failed: ${firstDiscover.stderr}`);
  assert.equal(stateView(repoRoot).work[submitted.id].stage, 'decompose');

  const secondDiscover = fgos(repoRoot, ['discover', submitted.id]);
  assert.equal(secondDiscover.status, 0, `second discover failed: ${secondDiscover.stderr}`);
  let view = stateView(repoRoot);
  assert.equal(view.work[submitted.id].stage, 'executing', 'clarify->decompose->executing chained via discover alone');
  assert.equal(view.work[submitted.id].status, 'todo', 'pass-through never dispatches — a human takes it next');
  assert.equal(view.work[submitted.id].verify, 'test -f pull-done.txt && echo PULL_OK');

  // A human takes the frontier head by hand.
  const headAtTake = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  const taken = fgos(repoRoot, ['take']);
  assert.equal(taken.status, 0, `take failed: ${taken.stderr}`);
  assert.equal(envelopeData(taken.stdout).id, submitted.id);

  view = stateView(repoRoot);
  assert.equal(view.work[submitted.id].status, 'doing');
  assert.equal(view.work[submitted.id].claimActor, 'human');
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
  assert.equal(view.work[submitted.id].claimActor, 'human', 'still human-claimed after the concurrent run');

  // The human does real work and commits it (the real file, plus whatever
  // events.jsonl deltas take/discover already appended).
  fs.writeFileSync(path.join(repoRoot, 'pull-done.txt'), 'done by hand\n');
  execFileSync('git', ['add', '-A'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'human: pull-done.txt'], { cwd: repoRoot });

  const returned = fgos(repoRoot, ['return', submitted.id]);
  assert.equal(returned.status, 0, `return failed: ${returned.stderr}`);
  const returnedData = envelopeData(returned.stdout);
  assert.equal(returnedData.to, 'proposed');
  assert.match(returnedData.output, /PULL_OK/, 'the real goal-check ran and its output surfaced, not just a status word');

  view = stateView(repoRoot);
  assert.equal(view.work[submitted.id].status, 'proposed');
  assert.equal(view.outcomes[submitted.id].actual.outcome, 'proposed');
  assert.equal(view.outcomes[submitted.id].actual.passed, true);
  assert.ok(view.outcomes[submitted.id].actual.aheadCount >= 1);

  // No settlement from this doing -> proposed edge (D4: settlement belongs
  // only to the -> done edge) — the earlier clarify-pass settlement (from
  // the discover step) is the only one on record.
  const settlementKinds = (view.settlements?.[submitted.id] ?? []).map((s) => s.kind);
  assert.deepEqual(settlementKinds, ['clarify-pass']);
});

// --- case 1: full journey, two items with a dep -----------------------------

test('e2e full journey: item1 (no deps) -> proposed with a worker commit on fgw/, item2 (dep on item1) stays closed while item1 is only proposed, second --once dispatches nothing', () => {
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
  assert.match(first.stdout, /proposed/);
  assert.match(first.stdout, /item1/);

  // item1 proposed, item2 untouched (still todo — its dep is not `done`).
  const afterFirst = stateView(repoRoot);
  assert.equal(afterFirst.work.item1.status, 'proposed');
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
      'work.move:item1:proposed',
      'work.outcome:item1:actual',
    ],
  );
  const doingEvent = afterFirstEvents.find((e) => e.type === 'work.move' && e.payload.to === 'doing');
  const proposedEvent = afterFirstEvents.find((e) => e.type === 'work.move' && e.payload.to === 'proposed');
  assert.equal(doingEvent.payload.id, 'item1');
  assert.equal(proposedEvent.payload.id, 'item1');
  assert.equal(typeof doingEvent.v, 'number', 'doing event carries a schema version');
  assert.equal(typeof proposedEvent.v, 'number', 'proposed event carries a schema version');
  // actual is real dispatch evidence (real subprocess, real goal-check),
  // sourced from the runner's own branchFacts — never the worker's report.
  const actualOutcomeEvent = afterFirstEvents.find((e) => e.type === 'work.outcome' && e.payload.actual);
  assert.equal(actualOutcomeEvent.payload.actual.outcome, 'proposed');
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
  assert.equal(checkData.outcomes[0].actual.outcome, 'proposed', 'actual half carries the real dispatch outcome');
  assert.equal(checkData.outcomes[0].actual.passed, true);
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
  assert.notEqual(stateView(repoRoot).work['item-red'].status, 'proposed');
  assert.equal(branchExists(repoRoot, 'fgw/item-red'), true, 'the (wrong) attempt still leaves its branch behind');

  const redEvents = events(repoRoot);
  const seq = redEvents.map((e) => (e.type === 'work.outcome'
    ? `work.outcome:${e.payload.predicted ? 'predicted' : 'actual'}`
    : `${e.type}:${e.payload.to ?? e.payload.id ?? ''}`));
  assert.deepEqual(seq, [
    'work.add:item-red',
    'work.move:doing',
    'work.outcome:predicted',
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
  writeRunnerConfig(repoRoot, writeParentKillingExecutor(scriptDir, 'output.txt'));

  // First --once: the worker commits, then SIGKILLs its own parent (the
  // runner) before the runner can write `proposed`. The runner process
  // dies mid-dispatch — its own worktree teardown (in a `finally`) never
  // runs, so `fgw/item-crash` is left checked out at whatever path the
  // runner allocated for this attempt.
  const first = runner(repoRoot, ['--once', '--config', path.join(repoRoot, '.fgos-runner.json')]);
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
  const second = runner(repoRoot, ['--once', '--config', path.join(repoRoot, '.fgos-runner.json')]);
  assert.equal(second.status, 6, `expected busy (stale lock cleaned): ${second.stderr}`);
  assert.equal(fs.existsSync(path.join(repoRoot, '.fgos', 'runner.lock')), false);

  // Third --once: acquires a clean lock; startup reap resolves the stale
  // `doing` item to a defined state (proposed, since the branch's commit
  // passes verify) — crash recovery lands within two ticks.
  const third = runner(repoRoot, ['--once', '--config', path.join(repoRoot, '.fgos-runner.json')]);
  assert.equal(third.status, 0, `post-clean --once did not recover cleanly: ${third.stderr}`);

  const finalStatus = stateView(repoRoot).work['item-crash'].status;
  assert.ok(
    finalStatus === 'proposed' || finalStatus === 'blocked',
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
