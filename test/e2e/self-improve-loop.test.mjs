import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

// e2e — the whole self-improve loop (self-improve-loop P13 D1-D17), exercised
// as real fgos.mjs + fgos-runner.mjs subprocesses against a disposable
// mkdtemp git repo. Mirrors pr-gate.test.mjs's discipline (nothing here
// imports src/runner or src/state directly — on-disk state is the only
// source of truth for assertions) plus runner-loop.test.mjs's discovery-aware
// dispatch pattern (writeClearDiscoveryExecutor's 3 call sites), since the
// item `evolve --submit` creates starts at stage clarify, not executing —
// pr-gate.test.mjs's plain worker-only executor would leave it stuck there.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');
const RUNNER = path.resolve(__dirname, '../../bin/fgos-runner.mjs');

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

// Pinned to "main" (mirrors pr-gate.test.mjs/runner-loop.test.mjs's own
// initTempRepo): approve's runner-path merge assumes this literal trunk name
// (merge.mjs). `.fgos/state.json` is gitignored (derived view) while
// `.fgos/events.jsonl` (the truth log) is a real tracked file — same
// convention every e2e file in this dir already follows; approve's runner
// path refuses a dirty main tree, so every scenario that reaches approve
// folds pending log deltas into a real commit first.
function initTempRepo() {
  const repoRoot = mkTempDir('fgos-self-improve-e2e-repo-');
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, '.gitignore'), '.fgos/state.json\n');
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt', '.gitignore'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'root commit'], { cwd: repoRoot });
  return repoRoot;
}

function fgos(cwd, args) {
  return spawnSync(process.execPath, [FGOS, ...args], { cwd, encoding: 'utf8' });
}

function runner(cwd, args = ['--once']) {
  return spawnSync(process.execPath, [RUNNER, ...args], { cwd, encoding: 'utf8' });
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

function eventsRaw(cwd) {
  return fs.readFileSync(logPath(cwd), 'utf8');
}

// Seeds a real `work.friction` event straight onto the disposable repo's own
// event log — same on-disk shape events.mjs's appendEvent produces (`v` is
// optional/backward-compatible per events.mjs's own doc comment, so omitting
// it here is not a fabricated/degraded record; `seq` is derived from the
// existing log tail, same rule appendEvent itself follows). This is a real
// file write, never an `import` of src/state — the deterministic route this
// cell's action calls for: a real unsettled friction record whose `detail`
// contains a HEAVY_KEYWORDS entry, so a real Iron-Law-tripping candidate
// exists, never a fabricated module-path-touching commit. `rankCandidates`
// (src/evolve/candidates.mjs) derives candidates from `view.frictions` alone
// — no backing `view.work[id]` entry required — so the friction id is kept
// standalone here, deliberately avoiding an extra dispatchable item that
// would otherwise compete in the runner's frontier during the dispatch step.
function seedFriction(repoRoot, payload) {
  const p = logPath(repoRoot);
  let seq = 1;
  if (fs.existsSync(p)) {
    const lines = fs.readFileSync(p, 'utf8').split('\n').filter(Boolean);
    if (lines.length > 0) seq = JSON.parse(lines[lines.length - 1]).seq + 1;
  }
  const event = { seq, ts: new Date().toISOString(), type: 'work.friction', payload };
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.appendFileSync(p, `${JSON.stringify(event)}\n`, 'utf8');
}

function gitAt(repoRoot, args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' });
}

function currentHead(repoRoot) {
  return gitAt(repoRoot, ['rev-parse', 'HEAD']).trim();
}

/** Folds every pending `.fgos/` delta into one real commit on main — same
 * convention pr-gate.test.mjs's commitPending / runner-loop.test.mjs's
 * S2-pull e2e already rely on, required before any call that refuses a dirty
 * tree (`approve` on a runner item). */
function commitPending(repoRoot, message) {
  gitAt(repoRoot, ['add', '-A']);
  gitAt(repoRoot, ['commit', '-q', '-m', message]);
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

/** Count of live `git worktree` entries (the main worktree itself always
 * counts as 1) — mirrors pr-gate.test.mjs/runner-loop.test.mjs's own
 * worktreeCount. */
function worktreeCount(repoRoot) {
  const out = gitAt(repoRoot, ['worktree', 'list', '--porcelain']);
  return out.split('\n').filter((line) => line.startsWith('worktree ')).length;
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

/** Discovery-aware executor (mirrors runner-loop.test.mjs's
 * writeClearDiscoveryExecutor exactly): the SAME configured executor serves
 * THREE call sites — context-discovery ("# Context-discovery"), chia-việc
 * ("# Chia-việc (decompose)", answered pass-through so a simple item chains
 * straight through), and the worker dispatch ("# Goal") — told apart by
 * their fixed prompt prefixes. `evolve --submit`'s item starts at stage
 * clarify (not executing), so this three-call-site executor is required —
 * pr-gate.test.mjs's plain committing executor (worker-only) would leave the
 * item stuck in clarify/decompose forever. */
function writeClearDiscoveryExecutor(scriptDir, { verify, produce = 'output.txt' }) {
  const scriptPath = path.join(scriptDir, 'clear-discovery-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const prompt = process.argv[2] ?? '';
if (prompt.includes('# Context-discovery')) {
  process.stdout.write(JSON.stringify({ clear: true, verify: ${JSON.stringify(verify)} }));
} else if (prompt.includes('# Chia-việc (decompose)')) {
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

test(
  'e2e self-improve loop full contract (D1-D17): friction w/ heavy keyword -> evolve list/--pick (read-only) '
    + '-> evolve --submit -> runner dispatch -> review -> approve refuses without --acknowledge-iron-law '
    + '-> approve --acknowledge-iron-law succeeds -> done',
  () => {
    const repoRoot = initTempRepo();
    const scriptDir = mkTempDir('fgos-self-improve-e2e-exec-');

    assert.equal(fgos(repoRoot, ['init']).status, 0);

    // (1) seed a real unsettled friction record whose detail carries a
    // HEAVY_KEYWORDS entry ("schema migration") — the deterministic route to
    // a real Iron-Law-tripping candidate (per this cell's action), never a
    // fabricated module-path-touching commit.
    seedFriction(repoRoot, {
      id: 'self-fix-source',
      disposition: 'blocked',
      errorClass: 'verify-miss',
      layer: 'verification',
      attempts: 2,
      detail: 'Needs a schema migration in the candidate store before this keeps tripping goal-check.',
    });
    commitPending(repoRoot, 'seed friction for self-fix-source');

    // (2) `fgos evolve` (list) — candidate appears with every field a human
    // needs to judge it (D12).
    const list = fgos(repoRoot, ['evolve']);
    assert.equal(list.status, 0, `evolve list failed: ${list.stderr}`);
    const listData = envelopeData(list.stdout);
    const candidate = listData.find((c) => c.id === 'self-fix-source');
    assert.ok(candidate, 'self-fix-source appears in the ranked list');
    assert.equal(candidate.score, 2);
    assert.equal(candidate.disposition, 'blocked');
    assert.equal(candidate.errorClass, 'verify-miss');
    assert.equal(candidate.layer, 'verification');
    assert.equal(candidate.attempts, 2);
    assert.match(candidate.detail, /schema migration/);

    // (3) `fgos evolve --pick <id>` is read-only (D6/D11) — byte-compare the
    // event log before/after, not just an assertion about the return value.
    const beforePick = eventsRaw(repoRoot);
    const pick = fgos(repoRoot, ['evolve', '--pick', 'self-fix-source']);
    assert.equal(pick.status, 0, `evolve --pick failed: ${pick.stderr}`);
    assert.equal(envelopeData(pick.stdout).recent[0].id, 'self-fix-source');
    const afterPick = eventsRaw(repoRoot);
    assert.equal(afterPick, beforePick, 'evolve --pick must append zero events (read-only, D6/D11)');

    // (4) `fgos evolve --submit <id>` — the ONLY mutating action on the whole
    // evolve surface (D15): creates exactly one new work item, description
    // composed from the candidate's friction fields (therefore carrying the
    // same heavy keyword).
    const submit = fgos(repoRoot, ['evolve', '--submit', 'self-fix-source']);
    assert.equal(submit.status, 0, `evolve --submit failed: ${submit.stderr}`);
    const submitted = envelopeData(submit.stdout);
    assert.equal(submitted.status, 'todo');
    assert.equal(submitted.stage, 'clarify');
    assert.match(submitted.description, /Self-improve candidate self-fix-source/);
    assert.match(submitted.description, /schema migration/);
    commitPending(repoRoot, `state: evolve --submit ${submitted.id}`);

    // The composed description's HEAVY_KEYWORDS match ALSO sets classify()'s
    // risk:'heavy' at submit time (same shared keyword list, D13/D14) —
    // decompose.mjs's risk-heavy gate parks ANY heavy-risk root at
    // awaiting-human unconditionally, on every verdict including
    // pass-through (test/intake/decompose.test.mjs asserts both), and
    // work.risk never resets on its own — so a heavy-risk item would park
    // forever, never reaching dispatch. Lowering risk via the ordinary `edit`
    // verb is a real operator action that leaves `description` untouched, so
    // Iron Law's keyword test at approve-time (which reads item.description,
    // not item.risk) still trips exactly as intended — the two mechanisms
    // are deliberately independent (D5 Iron Law vs classify()'s intake
    // tiering).
    const edited = fgos(repoRoot, ['edit', submitted.id, '--risk', 'standard']);
    assert.equal(edited.status, 0, `edit --risk failed: ${edited.stderr}`);
    commitPending(repoRoot, `state: edit ${submitted.id} risk`);

    // (5) real runner dispatch: the discovery-aware executor answers all 3
    // call sites (context-discovery, chia-việc, worker) within one --once,
    // per runner-loop.test.mjs's stage-clarify (a) / stage-decompose (a)
    // precedent — the item chains clarify->decompose->executing->proposed in
    // one call.
    writeRunnerConfig(
      repoRoot,
      writeClearDiscoveryExecutor(scriptDir, { verify: 'test -f fixed.txt && echo FIX_OK', produce: 'fixed.txt' }),
    );
    const dispatch = runner(repoRoot, ['--once']);
    assert.equal(dispatch.status, 0, `--once failed: ${dispatch.stderr}`);

    const afterDispatch = stateView(repoRoot);
    const item = afterDispatch.work[submitted.id];
    assert.equal(item.status, 'proposed', 'the discovery-aware executor chains the item all the way to proposed in one --once');
    assert.equal(item.stage, 'executing');
    assert.equal(branchExists(repoRoot, `fgw/${submitted.id}`), true);

    // (6) `fgos review <id>` — real diff shown.
    const review = fgos(repoRoot, ['review', submitted.id]);
    assert.equal(review.status, 0, `review failed: ${review.stderr}`);
    const reviewData = envelopeData(review.stdout);
    assert.equal(reviewData.source, 'runner');
    assert.match(reviewData.diff, /fixed\.txt/);

    // A coding item must pass through the compound-learn stage before it can
    // close (D3) — take the deliberate transition while the item is proposed.
    assert.equal(fgos(repoRoot, ['compound', submitted.id]).status, 0);

    // approve's runner path refuses a dirty main tree — fold the evolve/
    // dispatch/compound log deltas into a real commit first (same convention
    // every pr-gate.test.mjs runner scenario follows).
    commitPending(repoRoot, `state: propose ${submitted.id}`);

    // (7) `approve <id>` WITHOUT --acknowledge-iron-law: a REAL refusal
    // against a REAL proposed item carrying the real Iron-Law-tripping
    // description — exercised in this file, never established only by
    // cross-referencing self-improve-loop-5's cli tests (must_haves).
    const headBeforeRefusal = currentHead(repoRoot);
    const refused = fgos(repoRoot, ['approve', submitted.id]);
    assert.equal(refused.status, 4, `expected a validation refusal: ${refused.stdout}${refused.stderr}`);
    assert.match(refused.stderr, /Iron Law/);
    assert.match(refused.stderr, /migration/, 'the refusal names the matched keyword');
    assert.match(refused.stderr, /--acknowledge-iron-law/);

    const afterRefusal = stateView(repoRoot);
    assert.equal(afterRefusal.work[submitted.id].status, 'proposed', 'a refused approve leaves the item proposed');
    assert.equal(currentHead(repoRoot), headBeforeRefusal, 'a refused approve attempts no merge — HEAD unchanged');
    assert.equal(branchExists(repoRoot, `fgw/${submitted.id}`), true, 'the branch survives an Iron Law refusal');

    // (8) `approve <id> --acknowledge-iron-law` — the deliberate override
    // succeeds: merges, verifies, proposed -> done, branch cleaned up.
    const approved = fgos(repoRoot, ['approve', submitted.id, '--acknowledge-iron-law']);
    assert.equal(approved.status, 0, `approve with acknowledgment must succeed: ${approved.stderr}`);
    const approvedData = envelopeData(approved.stdout);
    assert.equal(approvedData.to, 'done');
    assert.match(approvedData.output, /FIX_OK/);

    const finalView = stateView(repoRoot);
    assert.equal(finalView.work[submitted.id].status, 'done');
    // The item already carries an earlier settlement (clarify-pass, actor
    // runner) from the clarify/decompose sweep during dispatch — the close
    // edge's settlement (actor human, D3: the approver is the settlement,
    // merge is only the mechanical consequence) is the LAST one, not the
    // first.
    const closeSettlement = finalView.settlements[submitted.id].at(-1);
    assert.equal(closeSettlement.kind, 'close');
    assert.equal(closeSettlement.actor, 'human');
    assert.equal(branchExists(repoRoot, `fgw/${submitted.id}`), false, 'the fully-merged branch is cleaned up');
    assert.equal(worktreeCount(repoRoot), 1, 'no leaked worktree after cleanup');
    assert.ok(fs.existsSync(path.join(repoRoot, 'fixed.txt')), 'the merged file is present on main');
  },
);
