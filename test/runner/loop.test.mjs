import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { initStore, addWork, moveWork, listWork, readRawEvents, readyWork, recordClaimAttempt } from '../../src/state/store.mjs';
import { appendEvent } from '../../src/state/events.mjs';
import { acquireClaim } from '../../src/state/runtime-coordination.mjs';
import { MAX_TITLE_LENGTH } from '../../src/state/work.mjs';
import { createWorktree, removeWorktree, createBranchRef, branchNameFor } from '../../src/runner/worktree.mjs';
import { runOnce, runWatch, resolveRepoRoot } from '../../src/runner/loop.mjs';
import { resolveDiscovery } from '../../src/intake/discovery.mjs';
import { createMissBreaker } from '../../src/runner/anti-loop.mjs';

// Fake executors only — every "worker" spawned here is a node script this
// file writes into a mkdtemp directory. Every test builds its own
// disposable git repo (git init in mkdtemp) with its own `.fgos/` inside
// it; nothing here ever creates a worktree, a branch, or a `.fgos/` entry
// in THIS repo (forgent itself).

const noLog = () => {};

// Pinned to "main" (mirrors merge.test.mjs's initRepo()): cell fan-out-parallel-9
// wires createBranchRef's default baseRef ('main', worktree.mjs) into a real
// leaf dispatch path, so a leaf whose root has no branch yet forks it from
// literally "main" — a bare `git init` leaves the default branch name to this
// machine's `init.defaultBranch` (often not "main"), which would make that
// codepath fail here even though the real forgent/repo (whose default branch
// really is "main") is unaffected.
function initTempRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-loop-test-repo-'));
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: repoRoot });
  return repoRoot;
}

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function seedItem(dir, overrides = {}) {
  const item = {
    id: 'item-x',
    title: 'Produce the output file',
    kind: 'feature',
    status: 'todo',
    deps: [],
    risk: 'light',
    refs: [],
    verify: 'test -f output.txt',
    ...overrides,
  };
  addWork(dir, item);
  return item;
}

/** A worker that behaves: bumps a run counter, produces a file, commits it
 * on its branch. Never touches `.fgos/`. */
function writeCommittingExecutor(scriptDir, counterFile, produce = 'output.txt') {
  const scriptPath = path.join(scriptDir, 'committing-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
fs.appendFileSync(${JSON.stringify(counterFile)}, 'run\\n');
fs.writeFileSync(${JSON.stringify(produce)}, 'produced by worker ' + Date.now() + '\\n');
execFileSync('git', ['add', ${JSON.stringify(produce)}]);
const statusStr = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' });
if (statusStr.trim().length > 0) {
  execFileSync('git', ['commit', '-q', '-m', ${JSON.stringify(`worker: ${produce}`)}]);
}
`,
  );
  return scriptPath;
}

/** A worker that writes several DISTINCT stdout chunks (separate write()
 * calls, keyed by the item's own produce target so two concurrent items
 * never share a marker) before producing and committing its file — for
 * proving the live tee (P39) persists each chunk to `.fgos/logs/<id>.log`
 * as it arrives, not just in the terminal recap block. */
function writeChunkyCommittingExecutor(scriptDir, counterFile) {
  const scriptPath = path.join(scriptDir, 'chunky-committing-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const prompt = process.argv[2] ?? '';
const match = prompt.match(/test -f (\\S+)/);
const file = match ? match[1] : 'output.txt';
fs.appendFileSync(${JSON.stringify(counterFile)}, 'run\\n');
process.stdout.write('chunk-1-for-' + file + '\\n');
process.stdout.write('chunk-2-for-' + file + '\\n');
fs.writeFileSync(file, 'produced by worker\\n');
execFileSync('git', ['add', file]);
execFileSync('git', ['commit', '-q', '-m', 'worker: ' + file]);
`,
  );
  return scriptPath;
}

/** A worker that produces the verify target but never commits it. */
function writeNonCommittingExecutor(scriptDir, counterFile) {
  const scriptPath = path.join(scriptDir, 'non-committing-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
import fs from 'node:fs';
fs.appendFileSync(${JSON.stringify(counterFile)}, 'run\\n');
fs.writeFileSync('output.txt', 'uncommitted\\n');
`,
  );
  return scriptPath;
}

/** A rogue writer that races the runner: does the work, commits it, then
 * moves the item doing -> blocked in the MAIN repo's .fgos behind the
 * runner's back — so the runner's own doing -> awaiting-approval CAS must conflict. */
function writeRacingExecutor(scriptDir, counterFile, mainDir, id) {
  const storeUrl = pathToFileURL(path.resolve(import.meta.dirname, '../../src/state/store.mjs')).href;
  const scriptPath = path.join(scriptDir, 'racing-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
fs.appendFileSync(${JSON.stringify(counterFile)}, 'run\\n');
fs.writeFileSync('output.txt', 'produced by worker\\n');
execFileSync('git', ['add', 'output.txt']);
execFileSync('git', ['commit', '-q', '-m', 'worker: output.txt']);
const { moveWork } = await import(${JSON.stringify(storeUrl)});
moveWork(${JSON.stringify(mainDir)}, { id: ${JSON.stringify(id)}, to: 'blocked', expectedStatus: 'todo' });
`,
  );
  return scriptPath;
}

/** tsk-40m code-review finding (blocker): a rogue writer that races the
 * runner's CLAIM (not its status move) — does the work, commits it, then
 * releases the runner's own runtime claim and acquires a fresh one under a
 * DIFFERENT actor, behind the runner's back. Simulates a stale-claim
 * reclaim happening mid-dispatch (bypassing claim-port.mjs's own liveness
 * gate directly, the same way writeRacingExecutor above bypasses moveWork's
 * normal callers to force the race deterministically). The runner's own
 * settleClaim call must still carry the EXACT claimId it acquired at claim
 * time — never re-derive "whichever claim is active now" — so this must
 * conflict instead of silently settling the different actor's claim. */
function writeClaimReclaimingExecutor(scriptDir, counterFile, mainDir, id) {
  const runtimeCoordUrl = pathToFileURL(path.resolve(import.meta.dirname, '../../src/state/runtime-coordination.mjs')).href;
  const scriptPath = path.join(scriptDir, 'claim-reclaiming-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
fs.appendFileSync(${JSON.stringify(counterFile)}, 'run\\n');
fs.writeFileSync('output.txt', 'produced by worker\\n');
execFileSync('git', ['add', 'output.txt']);
execFileSync('git', ['commit', '-q', '-m', 'worker: output.txt']);
const { readClaim, releaseClaim, acquireClaim } = await import(${JSON.stringify(runtimeCoordUrl)});
const stale = readClaim(${JSON.stringify(mainDir)}, ${JSON.stringify(id)});
releaseClaim(${JSON.stringify(mainDir)}, { id: ${JSON.stringify(id)}, claimId: stale.claimId });
acquireClaim(${JSON.stringify(mainDir)}, { id: ${JSON.stringify(id)}, actor: 'a-different-actor', preClaimStatus: 'todo' });
`,
  );
  return scriptPath;
}

/** A worker that records a real execution INTERVAL: it writes a start marker,
 * waits long enough that two concurrent dispatches must overlap in wall time,
 * then writes+commits its proof file and an end marker. Each item writes to
 * its OWN marker files (keyed by the produce target parsed out of the prompt's
 * `test -f <file>` verify line, exactly as the real e2e decompose-aware
 * executor does), so two concurrent executors never race on the same file —
 * the overlap is proven by interval intersection, not a delay-only proxy. */
function writeIntervalExecutor(scriptDir, markerDir, sleepMs = 300) {
  const scriptPath = path.join(scriptDir, 'interval-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const prompt = process.argv[2] ?? '';
const match = prompt.match(/test -f (\\S+)/);
const file = match ? match[1] : 'output.txt';
const marker = path.join(${JSON.stringify(markerDir)}, file);
fs.writeFileSync(marker + '.start', String(Date.now()));
await new Promise((r) => setTimeout(r, ${sleepMs}));
fs.writeFileSync(file, 'produced by worker\\n');
execFileSync('git', ['add', file]);
execFileSync('git', ['commit', '-q', '-m', 'worker: ' + file]);
fs.writeFileSync(marker + '.end', String(Date.now()));
`,
  );
  return scriptPath;
}

/** A worker that fails verify on its first attempt (commits junk.txt, not
 * the output the seeded item's verify demands) then succeeds on its retry
 * (commits output.txt) — proves a retry's reset target: whichever attempt
 * this is decided purely from how many runs the counter file already
 * recorded, so it needs no state beyond what dispatchClaimedItem's own
 * retry loop already drives. */
function writeFlakyThenFixingExecutor(scriptDir, counterFile) {
  const scriptPath = path.join(scriptDir, 'flaky-then-fixing-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const priorRuns = fs.existsSync(${JSON.stringify(counterFile)})
  ? fs.readFileSync(${JSON.stringify(counterFile)}, 'utf8').split('\\n').filter(Boolean).length
  : 0;
fs.appendFileSync(${JSON.stringify(counterFile)}, 'run\\n');
if (priorRuns === 0) {
  fs.writeFileSync('junk.txt', 'wrong output from the failed first attempt\\n');
  execFileSync('git', ['add', 'junk.txt']);
  execFileSync('git', ['commit', '-q', '-m', 'worker: junk.txt (attempt 1, fails verify)']);
} else {
  fs.writeFileSync('output.txt', 'correct output from the retry\\n');
  execFileSync('git', ['add', 'output.txt']);
  execFileSync('git', ['commit', '-q', '-m', 'worker: output.txt (retry, passes verify)']);
}
`,
  );
  return scriptPath;
}

function configFor(scriptPath) {
  return {
    executor: { command: process.execPath, args: [scriptPath, '{prompt}', '--model', '{model}'] },
    models: { light: 'haiku', standard: 'sonnet', heavy: 'opus' },
    timeoutMs: 30000,
  };
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

function countRuns(counterFile) {
  if (!fs.existsSync(counterFile)) return 0;
  return fs.readFileSync(counterFile, 'utf8').split('\n').filter(Boolean).length;
}

/** Plant a real commit directly on `branch` via a throwaway worktree
 * checkout (mirrors worktree.test.mjs's `commitOnWorktree`), synthesizing
 * "a branch that already carries content" without a real merge/dispatch —
 * exactly what cell fan-out-parallel-9's own tests need to prove
 * fork-from-tip/branch-reuse without the (still deferred) approve-side
 * leaf-to-root merge mechanism. */
function plantCommit(repoRoot, worktreeDir, id, filename, contents) {
  const wt = createWorktree(repoRoot, id, { worktreeDir });
  fs.writeFileSync(path.join(wt.path, filename), contents);
  execFileSync('git', ['add', filename], { cwd: wt.path });
  execFileSync('git', ['commit', '-q', '-m', `planted: ${filename}`], { cwd: wt.path });
  removeWorktree(repoRoot, wt.path);
}

/** True when `ref` contains `filename` at its tip — used to prove a branch's
 * ACTUAL fork point/content (which base ref its history includes), not just
 * its name. */
function fileAtRef(repoRoot, ref, filename) {
  try {
    // stderr silenced (mirrors branchExists's `--quiet` rev-parse above): a
    // missing path is an expected, asserted-on outcome in these tests, not a
    // real failure worth printing "fatal: path ... does not exist" for.
    execFileSync('git', ['show', `${ref}:${filename}`], { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return true;
  } catch {
    return false;
  }
}

function setup() {
  const repoRoot = initTempRepo();
  const dir = path.join(repoRoot, '.fgos');
  initStore(dir);
  const scriptDir = mkTempDir('fgos-loop-test-exec-');
  const worktreeDir = mkTempDir('fgos-loop-test-wt-');
  const counterFile = path.join(scriptDir, 'runs.log');
  return { repoRoot, dir, scriptDir, worktreeDir, counterFile };
}

// --- happy path: --once runs the full circle -----------------------------

test('runOnce full circle: todo -> doing -> worker commit -> goal-check pass -> awaiting-approval, branch kept, worktree gone, runner is the only .fgos writer', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-happy' });
  const config = configFor(writeCommittingExecutor(scriptDir, counterFile));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained');
  assert.equal(result.exitCode, 0);
  assert.equal(result.dispatched.length, 1);
  assert.equal(result.dispatched[0].outcome, 'awaiting-approval');
  assert.equal(result.dispatched[0].id, 'item-happy');
  assert.equal(result.dispatched[0].branch, 'fgw/item-happy');
  assert.equal(listWork(dir).work['item-happy'].status, 'awaiting-approval');
  assert.equal(branchExists(repoRoot, 'fgw/item-happy'), true);
  const log = execFileSync('git', ['log', '--oneline', 'fgw/item-happy'], { cwd: repoRoot, encoding: 'utf8' });
  assert.match(log, /worker: output\.txt/);
  // worktree torn down, branch survives (D4 proposal artifact)
  assert.deepEqual(fs.readdirSync(worktreeDir), []);
  // one door: the log carries exactly the runner's writes — the worker
  // never touched .fgos/ (add + claim (no durable write) + predicted +
  // executor-dispatch audit (D8, tsk-62v) + settle + actual, nothing
  // else). tsk-40m (docs/architect/doing-coordination-redesign.md):
  // settleClaim writes an enriched work.attempt then transitions the item
  // DIRECTLY from its preClaimStatus to finalStatus — no durable
  // intermediate work.move(->doing) leg. `work.handoff:reviewer` is not a
  // second writer — it is `moveWork`'s own D18 side effect, fired
  // synchronously inside the SAME settle call the runner already made
  // (`coding`'s default domain declares a `roleGraph`), never a write the
  // worker or a second door performed.
  const events = readRawEvents(dir);
  assert.deepEqual(
    events.map((e) => (e.type === 'work.outcome' ? `work.outcome:${e.payload.predicted ? 'predicted' : 'actual'}` : `${e.type}:${e.payload.to ?? 'add'}`)),
    ['work.add:add', 'work.outcome:predicted', 'executor.dispatch:add', 'work.attempt:awaiting-approval', 'work.move:awaiting-approval', 'work.handoff:reviewer', 'work.outcome:actual'],
  );
  // predicted is written right at claim time, before dispatch ever runs
  const predictedEvent = events.find((e) => e.type === 'work.outcome' && e.payload.predicted);
  assert.deepEqual(predictedEvent.payload.predicted, { tier: 'standard', deps: 0, priorVisits: 0 });
  // actual is written on the pass terminal, sourced from the runner's own
  // goal-check/branchFacts — never the worker's status/signal
  const actualEvent = events.find((e) => e.type === 'work.outcome' && e.payload.actual);
  assert.equal(actualEvent.payload.actual.outcome, 'awaiting-approval');
  assert.equal(actualEvent.payload.actual.passed, true);
  assert.equal(actualEvent.payload.actual.aheadCount, 1);
});

// --- executor-aware dispatch announce/audit (D8, tsk-62v) ---------------

test('runOnce logs the "<executorId> — <provider> — <model>" announce line and appends a matching executor.dispatch audit event', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-announce' });
  const config = configFor(writeCommittingExecutor(scriptDir, counterFile));
  const logs = [];

  await runOnce({ repoRoot, config, worktreeDir, log: (msg) => logs.push(msg) });

  assert.ok(
    logs.includes(`fgos-runner: fgos-coding-implement — ${process.execPath} — sonnet`),
    `expected an announce line in: ${JSON.stringify(logs)}`,
  );
  const events = readRawEvents(dir);
  const auditEvent = events.find((e) => e.type === 'executor.dispatch');
  assert.ok(auditEvent, 'expected a executor.dispatch event in the log');
  // baseCommit/headRef (tsk-4hl): asserted by shape, not exact value -- both
  // are real per-run git reads (a fresh worktree's own HEAD/branch), so a
  // literal SHA/branch string would be non-deterministic across runs. This
  // still pins the property that actually matters: a real 40-hex commit and
  // the item's own dispatch branch, proving attestRoot: cwd reached the
  // production spawnWorker path end-to-end, not just the dispatch.mjs unit
  // tests (found missing by independent review after tsk-4hl merged --
  // this whole test file was outside that item's own verify scope).
  const { baseCommit, headRef, ...rest } = auditEvent.payload;
  assert.deepEqual(rest, {
    id: 'item-announce',
    executorId: 'fgos-coding-implement',
    provider: process.execPath,
    // command (tsk-33w D9): equal to provider here because this fixture's
    // config never overrides either -- both fall back to the same resolved
    // executor.command. The differing-value case (provider a declared
    // label, command the real spawned executable) is proven separately
    // below.
    command: process.execPath,
    model: 'sonnet',
    // governance (self-review finding, 2026-08-25): computed by
    // resolveExecutorConfig for the global-executor fallback path this
    // fixture takes -- process.execPath is neither a Claude CLI command
    // nor a declared executors.* entry, so it resolves cross-provider with
    // no declared providerModel/carries override (defaults apply).
    governance: {
      providerFamily: process.execPath,
      egress: { kind: 'cross-provider', target: process.execPath, content: 'repo-content' },
    },
  });
  assert.match(baseCommit, /^[0-9a-f]{40}$/, 'baseCommit must be a real commit sha, not null/undefined');
  assert.equal(headRef, 'fgw/item-announce', 'headRef must be this item\'s own dispatch branch, not the main checkout\'s');
  // the audit entry is unknown to the FSM view — never breaks replay/state.json
  assert.equal(listWork(dir).work['item-announce'].status, 'awaiting-approval');
});

test('runOnce\'s executor.dispatch audit event records the REAL spawned command even when a executor declares a different provider label (tsk-33w D9: the audit must not lie when the two diverge)', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-command-mismatch' });
  const scriptPath = writeCommittingExecutor(scriptDir, counterFile);
  // fgos-coding-implement is the executing-stage executorId a plain coding
  // work item resolves to (dispatch.mjs's executorIdForWork) -- overriding
  // it here is what makes byExecutor win over the global executor below.
  const config = {
    executor: { command: process.execPath, args: [scriptPath, '{prompt}', '--model', '{model}'] },
    executors: {
      'fgos-coding-implement': {
        kind: 'agent',
        command: process.execPath,
        args: [scriptPath, '{prompt}', '--model', '{model}'],
        allowCrossProvider: true,
        // a declared label that is NOT the real command -- exactly the
        // shape the item's own description warns about: a session reading
        // only `provider` back from the audit log would wrongly conclude
        // "claude" ran, when the real spawned command is `process.execPath`.
        provider: 'claude',
      },
    },
    models: { light: 'haiku', standard: 'sonnet', heavy: 'opus' },
    timeoutMs: 30000,
  };

  await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  const events = readRawEvents(dir);
  const auditEvent = events.find((e) => e.type === 'executor.dispatch');
  assert.ok(auditEvent, 'expected a executor.dispatch event in the log');
  assert.equal(auditEvent.payload.provider, 'claude', 'provider stays the declared label');
  assert.equal(auditEvent.payload.command, process.execPath, 'command must be the REAL spawned executable, not the label');
  assert.notEqual(auditEvent.payload.command, auditEvent.payload.provider, 'this is precisely the divergence the item exists to close');
});

// --- settlement role attribution (phase-3-compound-learning-5,
// S3-closeout): every moveWork call the runner itself makes stamps
// role:'runner' on the raw event payload (per vision §8 — the runner is
// never a human/session). -------------------------------------------------

test('runOnce stamps role "runner" on every claim/propose work.move it writes', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-actor' });
  const config = configFor(writeCommittingExecutor(scriptDir, counterFile));

  await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  // Claim time no longer durably writes a work.move — settleClaim writes
  // exactly one work.move (the direct preClaimStatus -> finalStatus
  // settle), so this asserts BOTH surviving carriers of the runner's
  // identity: the settle's own work.move.role, and the settle's paired
  // work.attempt.actor (the claim-time signal now rides this field).
  const moves = readRawEvents(dir).filter((e) => e.type === 'work.move');
  assert.ok(moves.length >= 1, 'the propose settle wrote a move');
  for (const move of moves) {
    assert.equal(move.payload.role, 'runner');
  }
  const attempts = readRawEvents(dir).filter((e) => e.type === 'work.attempt');
  assert.ok(attempts.length >= 1, 'the settle wrote an attempt');
  for (const attempt of attempts) {
    assert.equal(attempt.payload.actor, 'runner');
  }
});

// (tsk-40m docs/architect/doing-coordination-redesign.md: settleClaim no
// longer writes a durable work.move(->doing) at claim time — the claim
// itself is a runtime-only claim file, and the "runner did this" signal at
// claim time now rides the settle's own work.attempt.actor field instead.)

// tsk-1x3 D1/D9/D16 (docs/history/fanout-and-delegation-rubric/CONTEXT.md):
// the clarify/decompose sweeps' own judge subprocess is retired — a
// role='runner' call on either stage now safely no-ops instead of
// consulting a scripted judge, so `writeClearDiscoveryExecutor`'s
// discovery/chia-việc prompt-answering branches (above `writeCommittingExecutor`'s
// plain worker-dispatch shape) have nothing left to answer. The three tests
// below that used to configure it now drive clarify/decompose via the
// readLockedContext/tiny-mode TRUST SIGNAL instead (unaffected by D16 — the
// one remaining way a `role: 'runner'` sweep can still legitimately advance
// an item past clarify/decompose without a live caller): a real committed
// CONTEXT.md (discovery's skip) plus a plan.md declaring `mode: tiny`
// (decompose's own skip-and-advance) reproduces the exact same
// "clarify+decompose chain to executing in one runOnce pass" shape these
// tests always proved, just via the mechanism that is still real.

/** Plants a real, committed-shaped CONTEXT.md (+ plan.md when `mode` is
 * given) directly under `repoRoot/docsRef` — no git commit needed here,
 * since `resolveContentRoot`'s own stateRoot fallback branch finds it by
 * construction (`dir` is always `repoRoot/.fgos` in this file's `setup()`,
 * so stateRoot and this content live under the same repoRoot). */
function mkLockedContextFixture(repoRoot, docsRef, { mode } = {}) {
  const featureDir = path.join(repoRoot, docsRef);
  fs.mkdirSync(featureDir, { recursive: true });
  fs.writeFileSync(path.join(featureDir, 'CONTEXT.md'), '# CONTEXT\n\nD1: locked.\n');
  if (mode) {
    fs.writeFileSync(path.join(featureDir, 'plan.md'), `# plan\n\nmode = **${mode}**.\n`);
  }
}

// tsk-5mj D1/D6/D7 finding (docs/history/fanout-and-delegation-rubric/
// CONTEXT.md): this item's own verify (`! rg -q "resolveDiscovery"
// src/runner/loop.mjs`) required removing the runner's OWN clarify-stage
// sweep entirely (it replaced with the new DISCOVERY DISPATCH, a different
// stage) — not just the tsk-1x3 D16 no-op path, the readLockedContext
// trust-signal skip too, since that skip only ever fired THROUGH a
// `resolveDiscovery` call, and loop.mjs no longer makes one at all for
// stage `clarify`. A real, structural consequence, stated plainly: a
// clarify-stage item with a real committed CONTEXT.md is no longer
// auto-advanced by any runner sweep — only an explicit `fgos discover
// --verdict ...` call (role `'session'`) can move it now, same as an item
// with no trust signal at all. The clarify-pass settlement's `role` field
// can therefore only ever read `'session'` today; no live path produces
// `role: 'runner'` on it anymore. This test now advances the item past
// clarify itself (mirroring the one live way left) before proving what IS
// still real: the decompose sweep + dispatch chain the same runOnce pass.
test('runOnce: an item already advanced to planning (via an explicit prior discover call, the only live path left post-tsk-5mj) still gets swept to executing and dispatched in the SAME runOnce pass; the clarify-pass settlement recorded at that prior call reads role "session"', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  const docsRef = 'docs/history/item-clarify';
  mkLockedContextFixture(repoRoot, docsRef, { mode: 'tiny' });
  seedItem(dir, { id: 'item-clarify', stage: 'discovery', verify: 'test -f output.txt', docsRef });
  // tsk-qod D1/D2: `clarify` is retired entirely -- a fresh item now starts
  // at `discovery` (`stages[0]`) directly. tsk-30v D2/D6: a clear verdict at
  // discovery now skips exploring and lands on planning directly in ONE
  // explicit discover call (previously two hops walked
  // discovery->exploring->planning).
  resolveDiscovery(dir, 'item-clarify', {}, 'session', { clear: true, verify: 'test -f output.txt' });
  const config = configFor(writeCommittingExecutor(scriptDir, counterFile));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained', 'the decompose sweep clears the item before the frontier dispatches it in the same pass');
  assert.equal(result.dispatched[0].outcome, 'awaiting-approval');
  assert.equal(result.dispatched[0].id, 'item-clarify');
  const view = listWork(dir);
  assert.equal(view.work['item-clarify'].stage, 'executing');
  assert.equal(view.settlements['item-clarify'].length, 1);
  assert.equal(view.settlements['item-clarify'][0].kind, 'clarify-pass');
  assert.equal(view.settlements['item-clarify'][0].role, 'session');
});

// --- domain-aware sweeps (per base-workflow-model D2/D3): an unrecognized
// item.domain must never throw inside the hot loop — it folds to 'coding'
// (same clarify/decompose stage names as today) with a diagnostic log line.
// validateWork (intake) rejects an unrecognized domain by design, so the
// only realistic way this reaches the runner is data that never went
// through addWork — e.g. a future domain later dropped from the registry
// (approach.md's rollback plan). Exercised here via a raw appended event,
// bypassing addWork's validation on purpose. ---

// tsk-5mj D1/D6/D7 finding (see the test above): the clarify-stage sweep is
// gone from loop.mjs entirely, so this item is advanced past clarify with a
// direct `resolveDiscovery` call (the one live path left) before ever
// reaching `runOnce` — the domain-fold behavior this test proves still gets
// a real, live exercise from the DECOMPOSE sweep right after (unchanged
// code, `domain: 'bogus-domain'` rides along on the item unaffected by the
// stage move).
test('runOnce decompose sweep folds an unrecognized item.domain to "coding" (fail-safe), logging a warning instead of throwing', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  const docsRef = 'docs/history/item-clarify';
  mkLockedContextFixture(repoRoot, docsRef, { mode: 'tiny' });
  appendEvent(path.join(dir, 'events.jsonl'), {
    type: 'work.add',
    payload: {
      id: 'item-clarify',
      title: 'Produce the output file',
      kind: 'feature',
      status: 'todo',
      deps: [],
      risk: 'light',
      refs: [],
      verify: 'test -f output.txt',
      stage: 'discovery',
      domain: 'bogus-domain',
      docsRef,
    },
  });
  // tsk-30v D2/D6: see the earlier test's own comment -- a clear verdict at
  // discovery now lands on planning directly in one hop.
  resolveDiscovery(dir, 'item-clarify', {}, 'session', { clear: true, verify: 'test -f output.txt' });
  const config = configFor(writeCommittingExecutor(scriptDir, counterFile));
  const lines = [];
  const capture = (msg) => lines.push(msg);

  const result = await runOnce({ repoRoot, config, worktreeDir, log: capture });

  assert.equal(result.outcome, 'drained', 'the decompose sweep still clears the item despite the unrecognized domain');
  assert.equal(result.dispatched[0].id, 'item-clarify');
  assert.ok(
    lines.some((line) => /unrecognized domain "bogus-domain"/.test(line)),
    'the fold must be logged, not silent',
  );
});

// --- clarify/decompose sweeps never match on a domain with no Clarify/Divide
// stage (base-workflow-model-4): stageForStep returns undefined for the
// 'synthetic' domain's Clarify/Divide steps, and an item with no explicit
// `stage` also reads as `item.stage === undefined` (D8 lazy default) — the
// pre-fix comparison (`item.stage === clarifyStage`) wrongly matched
// undefined === undefined and swept the item into resolveDiscovery, which
// then threw a stage conflict (synthetic's lazily-resolved "from" stage is
// its own Execute stage, 'assembling', never 'clarify') and halted the whole
// drain-run. The fixed guard requires clarifyStage/decomposeStage to be a
// real stage name before comparing, so a synthetic-domain item is left alone
// by both sweeps and reaches the frontier (already ready, since its own
// lazy-default stage IS its Execute stage) and dispatches normally.

test('runOnce clarify+decompose sweeps never touch a synthetic-domain item with no Clarify/Divide-mapped stage — it dispatches straight through instead of being wrongly swept', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-synthetic', domain: 'synthetic', verify: 'test -f output.txt' });
  const config = configFor(writeCommittingExecutor(scriptDir, counterFile));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained', 'the synthetic item must dispatch, never halt on a bogus stage conflict');
  assert.equal(result.dispatched.length, 1);
  assert.equal(result.dispatched[0].outcome, 'awaiting-approval');
  assert.equal(result.dispatched[0].id, 'item-synthetic');
  assert.equal(listWork(dir).work['item-synthetic'].status, 'awaiting-approval');
  // no work.discovery / work.stage event was ever written — the sweeps
  // genuinely skipped it rather than happening to succeed
  const events = readRawEvents(dir);
  assert.ok(!events.some((e) => e.type === 'work.discovery' || e.type === 'work.stage'));
});

test('runOnce decompose sweep still fires normally for a coding-domain item advanced to planning (no behavior change for coding)', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  const docsRef = 'docs/history/item-coding-clarify';
  mkLockedContextFixture(repoRoot, docsRef, { mode: 'tiny' });
  seedItem(dir, { id: 'item-coding-clarify', stage: 'discovery', verify: 'test -f output.txt', docsRef });
  // tsk-30v D2/D6: a clear verdict at discovery now skips exploring and
  // lands on planning directly in ONE hop (previously two hops walked
  // discovery->exploring->planning).
  resolveDiscovery(dir, 'item-coding-clarify', {}, 'session', { clear: true, verify: 'test -f output.txt' });
  const config = configFor(writeCommittingExecutor(scriptDir, counterFile));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained');
  assert.equal(result.dispatched[0].outcome, 'awaiting-approval');
  assert.equal(result.dispatched[0].id, 'item-coding-clarify');
  assert.equal(listWork(dir).work['item-coding-clarify'].stage, 'executing');
});

// --- real parallelism: two independent items overlap in one runOnce -------
// (fan-out-parallel D10/D16 — the whole point of the drain-run rewrite). The
// overlap is proven CONCRETELY (interval intersection), not by a wall-clock-
// under-2x-delay proxy: two sequential delayed dispatches would pass a delay-
// only check, so only genuinely intersecting [start,end] intervals prove it.

test('real concurrency: two independent ready items dispatched in ONE runOnce overlap in wall time (interval intersection) and both reach proposed with a consistent event log', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir } = setup();
  const markerDir = mkTempDir('fgos-loop-test-marker-');
  seedItem(dir, { id: 'item-a', verify: 'test -f a.txt' });
  seedItem(dir, { id: 'item-b', verify: 'test -f b.txt' });
  const config = configFor(writeIntervalExecutor(scriptDir, markerDir, 1000));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  // both items dispatched in the same drain-run, both proposed
  assert.equal(result.outcome, 'drained');
  const outcomes = new Map(result.dispatched.map((d) => [d.id, d.outcome]));
  assert.equal(outcomes.get('item-a'), 'awaiting-approval');
  assert.equal(outcomes.get('item-b'), 'awaiting-approval');

  // event-log internal consistency: the log replays cleanly and both items
  // land at proposed in the rebuilt view (the write-queue kept the concurrent
  // workers' state writes from interleaving into corruption).
  const view = listWork(dir);
  assert.equal(view.work['item-a'].status, 'awaiting-approval');
  assert.equal(view.work['item-b'].status, 'awaiting-approval');

  // CONCRETE overlap proof: item-a's [start,end] and item-b's [start,end]
  // genuinely intersect — impossible under sequential dispatch, where b would
  // not start until a's worker had fully finished (b.start > a.end).
  const readMarker = (f, suffix) => parseInt(fs.readFileSync(path.join(markerDir, `${f}.${suffix}`), 'utf8'), 10);
  const aStart = readMarker('a.txt', 'start');
  const aEnd = readMarker('a.txt', 'end');
  const bStart = readMarker('b.txt', 'start');
  const bEnd = readMarker('b.txt', 'end');
  assert.ok(
    Math.max(aStart, bStart) < Math.min(aEnd, bEnd),
    `the two dispatches must overlap in wall time: a=[${aStart},${aEnd}] b=[${bStart},${bEnd}]`,
  );
});

// --- bounded drain-run: cap + refill + terminate (D10/D15) ----------------

test('bounded drain-run: three independent ready items under maxRoots=2 dispatch across two waves (refill) — all reach proposed, then the run terminates', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'root-1' });
  seedItem(dir, { id: 'root-2' });
  seedItem(dir, { id: 'root-3' });
  const config = { ...configFor(writeCommittingExecutor(scriptDir, counterFile)), parallel: { maxRoots: 2, maxLeavesPerRoot: 1 } };

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained');
  assert.equal(result.dispatched.length, 3, 'the cap dispatched 2 then refilled the 3rd — all three, none dropped');
  for (const id of ['root-1', 'root-2', 'root-3']) {
    assert.equal(listWork(dir).work[id].status, 'awaiting-approval');
  }
  assert.equal(countRuns(counterFile), 3); // three real worker dispatches
  assert.deepEqual(readyWork(dir), [], 'the drain terminated with the frontier empty (D15), it did not spin');
});

// --- two-tier cap + root-affinity: leaves of one root share an owner ------

test('two-tier cap: a root with three ready leaves dispatches maxLeavesPerRoot per wave, refills the rest, all leaves reach proposed under one shared root owner', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'the-root', verify: 'test -f root.txt' });
  seedItem(dir, { id: 'leaf-1', parent: 'the-root' });
  seedItem(dir, { id: 'leaf-2', parent: 'the-root' });
  seedItem(dir, { id: 'leaf-3', parent: 'the-root' });
  const config = { ...configFor(writeCommittingExecutor(scriptDir, counterFile)), parallel: { maxRoots: 4, maxLeavesPerRoot: 2 } };

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained');
  assert.equal(result.dispatched.length, 3, 'all three leaves of the one root dispatched (2 in wave 1, 1 refilled)');
  for (const id of ['leaf-1', 'leaf-2', 'leaf-3']) {
    assert.equal(listWork(dir).work[id].status, 'awaiting-approval');
  }
  // the root itself never dispatched — its descendants are only proposed (not
  // done), so the lineage filter keeps it off the frontier this whole run.
  assert.equal(listWork(dir).work['the-root'].status, 'todo');
  assert.equal(countRuns(counterFile), 3);
});

// --- the shared worker-slot ceiling bounds the wave (D6/D7/D8) ------------

/** Occupy `count` execution-lane slots with items parked at `doing`. A real
 * runtime claim (`claimRole: 'session'`) keeps startupReap's own stale-claim
 * reclaim off them (it only ever reaps a claim the runner itself made), so
 * they stay occupied for the whole run — the same shape
 * test/state/worker-slots.test.mjs's own occupants use. tsk-40m (docs/
 * architect/doing-coordination-redesign.md): `todo -> doing` is retired from
 * status-fsm.mjs's TRANSITIONS table, so `doing` is reached via a claim
 * (listWork's effective view), never a durable moveWork. */
function occupySlots(dir, count) {
  for (let n = 0; n < count; n++) {
    const id = `busy-${n}`;
    seedItem(dir, { id });
    acquireClaim(dir, { id, actor: 'session', preClaimStatus: 'todo', claimRole: 'session' });
  }
}

function writeCeiling(repoRoot, ceiling) {
  fs.writeFileSync(path.join(repoRoot, '.fgos', 'config.json'), JSON.stringify({ workerSlots: { ceiling } }));
}

test('no workerSlots ceiling configured leaves the drain-run exactly as it was — occupancy is not a ceiling on its own', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  occupySlots(dir, 20);
  seedItem(dir, { id: 'root-1' });
  const config = configFor(writeCommittingExecutor(scriptDir, counterFile));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained');
  assert.equal(result.exitCode, 0);
  assert.equal(listWork(dir).work['root-1'].status, 'awaiting-approval');
  assert.equal(countRuns(counterFile), 1);
});

test('the drain-run asks for worker-slot room before dispatching: a full ceiling ends the run cleanly instead of halting on a claim refusal', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  occupySlots(dir, 2);
  writeCeiling(repoRoot, 2);
  seedItem(dir, { id: 'root-1' });
  const config = configFor(writeCommittingExecutor(scriptDir, counterFile));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  // Refusal is an answer, not an error: no worker was ever stood up (D6), so
  // there is nothing to halt on and nothing for a caller to treat as failure.
  assert.equal(result.outcome, 'idle');
  assert.equal(result.exitCode, 0);
  assert.deepEqual(result.dispatched, []);
  assert.equal(countRuns(counterFile), 0, 'no worker was spawned while the lane was full');
  assert.equal(listWork(dir).work['root-1'].status, 'todo', 'the item is left for a later poll, never parked or blocked');
});

test('an overshooting batch lands soft: the member the ceiling gate refuses is left for a later poll, and the drain-run neither halts nor exits non-zero', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  occupySlots(dir, 2);
  writeCeiling(repoRoot, 3); // exactly one free slot for a two-member wave
  seedItem(dir, { id: 'root-1' });
  seedItem(dir, { id: 'root-2' });
  const config = { ...configFor(writeCommittingExecutor(scriptDir, counterFile)), parallel: { maxRoots: 2, maxLeavesPerRoot: 1 } };

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.exitCode, 0, 'a ceiling refusal mid-batch is not a halt');
  assert.equal(result.dispatched.filter((d) => d.outcome === 'halted').length, 0);
  // The refused member is not lost: the next poll finds a freed slot and
  // dispatches it, so the whole batch still lands — just not in one wave.
  assert.equal(listWork(dir).work['root-1'].status, 'awaiting-approval');
  assert.equal(listWork(dir).work['root-2'].status, 'awaiting-approval');
  assert.equal(countRuns(counterFile), 2);
});

// The discovery sweep stands a REAL worker process up but never claims the
// item — it stays `todo` and only moves to `doing` inside the worker — so
// occupancy, which counts `doing`, cannot see that process at all. Left
// ungated it ran even while the lane was full, and `fgos slots` under-
// reported the machine every other launcher was deciding against.
test('the discovery sweep obeys the shared ceiling too: a full lane spawns no research worker', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  occupySlots(dir, 2);
  writeCeiling(repoRoot, 2);
  seedItem(dir, { id: 'item-research-blocked', stage: 'discovery', verify: 'chưa xác định — bổ sung thủ công' });
  const body = JSON.stringify({ clear: true, verify: 'npm test -- research' });
  const config = configFor(writeDiscoveryVerdictExecutor(scriptDir, counterFile, body));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(countRuns(counterFile), 0, 'no research worker may be stood up while the lane is full');
  assert.equal(result.exitCode, 0, 'a refusal is an answer, not a failure');
  const item = listWork(dir).work['item-research-blocked'];
  assert.equal(item.stage, 'discovery', 'the item is left exactly where it was, for a later poll');
  assert.equal(item.status, 'todo');
});

test('the discovery sweep still runs normally when the lane has room', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  occupySlots(dir, 1);
  writeCeiling(repoRoot, 4);
  seedItem(dir, { id: 'item-research-ok', stage: 'discovery', verify: 'chưa xác định — bổ sung thủ công' });
  const body = JSON.stringify({ clear: true, verify: 'npm test -- research' });
  const config = configFor(writeDiscoveryVerdictExecutor(scriptDir, counterFile, body));

  await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(countRuns(counterFile), 1, 'room means the sweep is untouched');
  assert.equal(listWork(dir).work['item-research-ok'].stage, 'planning');
});

// "Nothing to do" and "work is waiting behind a full lane" are opposite
// situations that used to return the same envelope and log the same line —
// one line after printing the refusal that contradicted it. A caller polling
// `idle` could not tell a quiet backlog from a wedged one.
test('an idle run says WHY it was idle: an empty frontier and a full lane are not the same answer', async () => {
  const full = setup();
  occupySlots(full.dir, 2);
  writeCeiling(full.repoRoot, 2);
  seedItem(full.dir, { id: 'root-waiting' });
  const fullResult = await runOnce({
    repoRoot: full.repoRoot,
    config: configFor(writeCommittingExecutor(full.scriptDir, full.counterFile)),
    worktreeDir: full.worktreeDir,
    log: noLog,
  });

  assert.equal(fullResult.outcome, 'idle');
  assert.equal(fullResult.reason, 'worker-slot-ceiling', 'work IS waiting — it just cannot start');

  const quiet = setup();
  const quietResult = await runOnce({
    repoRoot: quiet.repoRoot,
    config: configFor(writeCommittingExecutor(quiet.scriptDir, quiet.counterFile)),
    worktreeDir: quiet.worktreeDir,
    log: noLog,
  });

  assert.equal(quietResult.outcome, 'idle');
  assert.equal(quietResult.reason, 'frontier-empty', 'genuinely nothing to do');
});

// --- D3 branch targeting: leaf fork-from-root-tip, root branch-reuse ------

test('cell fan-out-parallel-9: a leaf whose root branch already carries a planted commit forks its own worktree from that root tip, not from main', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'the-root', verify: 'test -f root.txt' });
  seedItem(dir, { id: 'leaf-1', parent: 'the-root', verify: 'test -f leaf.txt' });

  // Synthesize a root branch tip that differs from main: ensure fgw/the-root
  // exists (ref-only, from main), then plant a real commit on it — mirrors
  // "an earlier sibling leaf already merged into fgw/the-root", without the
  // (still deferred) approve-side merge mechanism.
  createBranchRef(repoRoot, 'the-root', { baseRef: 'main' });
  plantCommit(repoRoot, worktreeDir, 'the-root', 'root-marker.txt', 'planted on the root branch\n');
  assert.equal(fileAtRef(repoRoot, 'main', 'root-marker.txt'), false, 'main itself never got the planted commit');

  const result = await runOnce({ repoRoot, config: configFor(writeCommittingExecutor(scriptDir, counterFile, 'leaf.txt')), worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained');
  assert.equal(result.dispatched[0].outcome, 'awaiting-approval');
  assert.equal(listWork(dir).work['leaf-1'].status, 'awaiting-approval');

  // The leaf's OWN branch carries the root's planted content — proof it
  // forked from fgw/the-root's tip (D3 "leaf fork-from-tip-of-parent"), not
  // from main, which never had root-marker.txt.
  assert.equal(fileAtRef(repoRoot, branchNameFor('leaf-1'), 'root-marker.txt'), true, 'leaf branch forked from the root branch tip, carries its planted file');
  assert.equal(fileAtRef(repoRoot, branchNameFor('leaf-1'), 'leaf.txt'), true, 'leaf branch also carries its own worker commit');
});

test('cell fan-out-parallel-9: a root-less item is unaffected (byte-for-byte regression) — its worktree still forks fresh from main, exactly as before this cell', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'standalone', verify: 'test -f output.txt' });

  const result = await runOnce({ repoRoot, config: configFor(writeCommittingExecutor(scriptDir, counterFile)), worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained');
  assert.equal(listWork(dir).work.standalone.status, 'awaiting-approval');
  assert.equal(branchExists(repoRoot, 'fgw/standalone'), true);
  const mergeBase = execFileSync('git', ['merge-base', 'main', 'fgw/standalone'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  const mainTip = execFileSync('git', ['rev-parse', 'main'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  assert.equal(mergeBase, mainTip, 'a parent-less item still forks fresh from main, same as pre-fan-out-parallel-9 behavior');
});

test('cell fan-out-parallel-9: a root whose own branch already carries a planted commit (simulating an earlier merged leaf) reuses it via the existing branch-reuse path — proves the mechanism, not a real leaf-to-root merge', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'the-root2', verify: 'test -f root2.txt' });

  // Simulate "an earlier leaf already merged into fgw/the-root2" — plant a
  // commit directly on the root's own branch before it is ever dispatched.
  plantCommit(repoRoot, worktreeDir, 'the-root2', 'child-merged.txt', 'from an earlier merged leaf\n');

  const result = await runOnce({ repoRoot, config: configFor(writeCommittingExecutor(scriptDir, counterFile, 'root2.txt')), worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained');
  assert.equal(result.dispatched[0].outcome, 'awaiting-approval');
  assert.equal(listWork(dir).work['the-root2'].status, 'awaiting-approval');

  // Both the planted (pre-existing) content and the fresh worker commit are
  // on the SAME branch — createWorktree's branch-reuse path (opts.baseRef
  // ignored) forked the dispatch worktree from the branch's own tip, never
  // discarding what was already there.
  assert.equal(fileAtRef(repoRoot, 'fgw/the-root2', 'child-merged.txt'), true, 'the pre-existing planted commit survived (branch reused, not recreated)');
  assert.equal(fileAtRef(repoRoot, 'fgw/the-root2', 'root2.txt'), true, 'the worker\'s own commit landed on the same, reused branch');
});

// --- verify-miss: retry then park ----------------------------------------

test('verify-miss: worker commits the wrong thing -> retry once, then park to blocked (never proposed)', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-miss' });
  // commits junk.txt, but verify demands output.txt -> goal-check miss
  const config = configFor(writeCommittingExecutor(scriptDir, counterFile, 'junk.txt'));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained');
  assert.equal(result.dispatched[0].outcome, 'parked');
  assert.equal(result.dispatched[0].errorClass, 'verify-miss');
  assert.equal(result.dispatched[0].attempts, 2);
  assert.equal(countRuns(counterFile), 2); // retry really re-dispatched
  assert.equal(listWork(dir).work['item-miss'].status, 'blocked');
  assert.deepEqual(fs.readdirSync(worktreeDir), []);

  // predicted at claim, and actual on the PARK branch (closes the HIGH-risk
  // "failures learn nothing" gap — a park/halt must not be silent).
  const events = readRawEvents(dir);
  const predictedEvent = events.find((e) => e.type === 'work.outcome' && e.payload.predicted);
  assert.ok(predictedEvent, 'predicted work.outcome written at claim');
  const actualEvent = events.find((e) => e.type === 'work.outcome' && e.payload.actual);
  assert.ok(actualEvent, 'actual work.outcome written on the park branch');
  assert.equal(actualEvent.payload.actual.outcome, 'parked');
  assert.equal(actualEvent.payload.actual.passed, false);
  assert.equal(actualEvent.payload.actual.errorClass, 'verify-miss');
  assert.equal(actualEvent.payload.actual.attempts, 2);

  // friction channel (S2 — kênh 2 của capture): the runner blames itself at
  // the same park choke-point, layer attributed mechanically from the class.
  const frictionEvent = events.find((e) => e.type === 'work.friction');
  assert.ok(frictionEvent, 'work.friction written on the park branch');
  assert.equal(frictionEvent.payload.disposition, 'parked');
  assert.equal(frictionEvent.payload.errorClass, 'verify-miss');
  assert.equal(frictionEvent.payload.layer, 'verification');
  assert.equal(frictionEvent.payload.attempts, 2);
  assert.ok(frictionEvent.payload.detail, 'friction carries the failure message');
});

test('P1 fix: retry resets to this item\'s own dispatch baseline, not HEAD — a differently-committing retry never carries the first (failed) attempt\'s commit forward', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-retry-clean' }); // default verify: 'test -f output.txt'
  const config = configFor(writeFlakyThenFixingExecutor(scriptDir, counterFile));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained');
  assert.equal(result.dispatched[0].outcome, 'awaiting-approval');
  assert.equal(result.dispatched[0].attempts, 2);
  assert.equal(listWork(dir).work['item-retry-clean'].status, 'awaiting-approval');

  const branch = branchNameFor('item-retry-clean');
  assert.equal(fileAtRef(repoRoot, branch, 'output.txt'), true, "the retry's own commit landed");
  assert.equal(
    fileAtRef(repoRoot, branch, 'junk.txt'),
    false,
    "the first (failed) attempt's commit was discarded by the retry reset, not carried forward",
  );

  // Exactly one commit ahead of main — proof the retry reset to the dispatch
  // baseline (main's tip), not HEAD, which would have kept the first
  // attempt's commit and stacked the retry's commit on top of it (two ahead).
  const aheadCount = parseInt(
    execFileSync('git', ['rev-list', '--count', `main..${branch}`], { cwd: repoRoot, encoding: 'utf8' }).trim(),
    10,
  );
  assert.equal(aheadCount, 1, 'exactly one commit ahead of main — the failed first attempt did not stack under the retry');
});

test('P1 fix (defect-class sweep): a retry on a root item whose branch already carries a planted commit preserves that pre-existing content while still discarding only its own failed first-attempt commit', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'the-root3' }); // default verify: 'test -f output.txt'

  // Simulate "an earlier leaf already merged into fgw/the-root3" — plant a
  // commit directly on the root's own branch BEFORE it is ever dispatched
  // (mirrors cell fan-out-parallel-9's own planted-commit tests). A
  // dispatch-baseline reset must preserve this; a merge-base(trunk, branch)
  // reset — the explicitly-rejected alternative — would have discarded it.
  plantCommit(repoRoot, worktreeDir, 'the-root3', 'root-marker.txt', 'from an earlier merged leaf\n');

  const result = await runOnce({ repoRoot, config: configFor(writeFlakyThenFixingExecutor(scriptDir, counterFile)), worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained');
  assert.equal(result.dispatched[0].outcome, 'awaiting-approval');
  assert.equal(result.dispatched[0].attempts, 2);

  const branch = branchNameFor('the-root3');
  assert.equal(fileAtRef(repoRoot, branch, 'root-marker.txt'), true, 'planted (pre-existing) content survived the retry reset');
  assert.equal(fileAtRef(repoRoot, branch, 'output.txt'), true, "the retry's own commit landed");
  assert.equal(fileAtRef(repoRoot, branch, 'junk.txt'), false, "the failed first attempt's own commit was discarded");
});

test('verify passes but the worker never committed -> classified verify-miss, parked after retries', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-nocommit' });
  const config = configFor(writeNonCommittingExecutor(scriptDir, counterFile));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained');
  assert.equal(result.dispatched[0].outcome, 'parked');
  assert.equal(result.dispatched[0].errorClass, 'verify-miss');
  assert.equal(listWork(dir).work['item-nocommit'].status, 'blocked');
  assert.deepEqual(fs.readdirSync(worktreeDir), []);
});

// --- spawn-fail: routed by the recovery matrix ----------------------------

test('worker-spawn-fail: nonexistent executor -> retry per matrix, then park to blocked', async () => {
  const { repoRoot, dir, worktreeDir } = setup();
  seedItem(dir, { id: 'item-nospawn' });
  const config = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    models: { light: 'haiku', standard: 'sonnet', heavy: 'opus' },
    timeoutMs: 30000,
  };

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained');
  assert.equal(result.dispatched[0].outcome, 'parked');
  assert.equal(result.dispatched[0].errorClass, 'worker-spawn-fail');
  assert.equal(result.dispatched[0].attempts, 2);
  assert.equal(listWork(dir).work['item-nospawn'].status, 'blocked');
  assert.deepEqual(fs.readdirSync(worktreeDir), []);
  // worker-dispatch-log (D1/D3/D4): the failing outcome is persisted to
  // .fgos/logs/<id>.log — recoverable after the fact, not console-only.
  const logFile = path.join(dir, 'logs', 'item-nospawn.log');
  assert.ok(fs.existsSync(logFile), 'worker dispatch log persisted for the failed spawn');
  assert.match(fs.readFileSync(logFile, 'utf8'), /worker-spawn-fail/);
});

// --- live tee: chunks land in .fgos/logs/<id>.log as they arrive (P39) ----

test('live tee: each stdout chunk is persisted to .fgos/logs/<id>.log AS IT ARRIVES, and the terminal block still follows it intact', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-live' });
  const config = configFor(writeChunkyCommittingExecutor(scriptDir, counterFile));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained');
  assert.equal(result.dispatched[0].outcome, 'awaiting-approval');
  const logFile = path.join(dir, 'logs', 'item-live.log');
  const content = fs.readFileSync(logFile, 'utf8');

  // both chunks landed, raw and unwrapped, in arrival order
  const rawChunk1 = content.indexOf('chunk-1-for-output.txt');
  const rawChunk2 = content.indexOf('chunk-2-for-output.txt');
  assert.ok(rawChunk1 >= 0 && rawChunk2 > rawChunk1, 'chunks are live-teed in order');
  // the terminal block (D1/D3/D4 recap) still appends after, unchanged
  const terminalBlock = content.indexOf('=== ');
  assert.ok(terminalBlock > rawChunk2, 'terminal block appended after the live-teed chunks');
  assert.match(content, /exit 0/);
  assert.match(content.slice(terminalBlock), /chunk-1-for-output\.txt/, 'terminal block still carries the full stdout recap');
});

test('live tee: two items dispatched in the same parallel wave never interleave into each other\'s log file', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-live-a', verify: 'test -f a.txt', refs: ['a.txt'] });
  seedItem(dir, { id: 'item-live-b', verify: 'test -f b.txt', refs: ['b.txt'] });
  const config = {
    ...configFor(writeChunkyCommittingExecutor(scriptDir, counterFile)),
    parallel: { maxRoots: 2, maxLeavesPerRoot: 1 },
  };

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained');
  assert.equal(result.dispatched.length, 2);
  assert.ok(result.dispatched.every((r) => r.outcome === 'awaiting-approval'));

  const contentA = fs.readFileSync(path.join(dir, 'logs', 'item-live-a.log'), 'utf8');
  const contentB = fs.readFileSync(path.join(dir, 'logs', 'item-live-b.log'), 'utf8');
  assert.match(contentA, /chunk-1-for-a\.txt/);
  assert.match(contentA, /chunk-2-for-a\.txt/);
  assert.doesNotMatch(contentA, /for-b\.txt/, 'item-a\'s log carries no trace of item-b\'s chunks');
  assert.match(contentB, /chunk-1-for-b\.txt/);
  assert.match(contentB, /chunk-2-for-b\.txt/);
  assert.doesNotMatch(contentB, /for-a\.txt/, 'item-b\'s log carries no trace of item-a\'s chunks');
});

test('live tee: .fgos/logs is never committed (live tee did not change the committed surface)', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-live-clean' });
  const config = configFor(writeChunkyCommittingExecutor(scriptDir, counterFile));

  await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.ok(fs.existsSync(path.join(dir, 'logs', 'item-live-clean.log')));
  // main only ever gains the worker's own commit (produced by the committing
  // executor) — .fgos/logs never enters a git object at all, tracked or not.
  // .fgos/events.jsonl itself IS expected to be committed here (tsk-1ji:
  // claimWork's own opportunistic periodic checkpoint runs on every claim),
  // so this only asserts the live-tee surface, not .fgos as a whole.
  const tracked = execFileSync('git', ['ls-files'], { cwd: repoRoot, encoding: 'utf8' });
  assert.doesNotMatch(tracked, /\.fgos\/logs/, 'no .fgos/logs path is ever committed');
});

// --- anti-loop: max-visits parks the item OFF the frontier ----------------

test('anti-loop: an item at MAX_VISITS is parked todo -> blocked and truly leaves the frontier — the next item runs in the same pass', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-loopy' });
  seedItem(dir, { id: 'item-fresh' });
  // one prior visit for item-loopy: a real settle-style work.attempt
  // (tsk-40m D3: visitCount counts ONLY work.attempt(phase:'execute')
  // events now, never a raw doing-move — hard migration, no dual-count
  // legacy), then parked back to todo via blocked (todo -> doing is
  // retired; blocked stands in for the same "parked mid-flight" shape).
  recordClaimAttempt(dir, { id: 'item-loopy', phase: 'execute', result: 'failed' });
  moveWork(dir, { id: 'item-loopy', to: 'blocked', expectedStatus: 'todo' });
  moveWork(dir, { id: 'item-loopy', to: 'todo', expectedStatus: 'blocked' });
  const config = configFor(writeCommittingExecutor(scriptDir, counterFile));

  const result = await runOnce({ repoRoot, config, worktreeDir, maxVisits: 1, log: noLog });

  // the FIFO head was parked, and the drain moved on instead of hovering
  assert.deepEqual(result.parked, [{ id: 'item-loopy', reason: 'anti-loop-max-visits', visits: 1 }]);
  assert.equal(listWork(dir).work['item-loopy'].status, 'blocked');
  assert.equal(result.outcome, 'drained');
  assert.equal(result.dispatched.length, 1);
  assert.equal(result.dispatched[0].id, 'item-fresh');
  assert.equal(result.dispatched[0].outcome, 'awaiting-approval');
  assert.deepEqual(readyWork(dir), []);
});

test('anti-loop: a human reject (with reason) resets the runner gate — visits BEFORE it no longer count toward the cap', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-reprieved' });
  // one machine visit that would already be AT the cap (maxVisits: 1) on its
  // own — then a human rejects with a reason, which per D1 resets the item's
  // own budget. Reaching `proposed` first (not just blocked -> todo)
  // exercises the real reject edge (awaiting-approval -> todo, reason required).
  recordClaimAttempt(dir, { id: 'item-reprieved', phase: 'execute', result: 'success' });
  moveWork(dir, { id: 'item-reprieved', to: 'awaiting-approval', expectedStatus: 'todo' });
  moveWork(dir, { id: 'item-reprieved', to: 'todo', expectedStatus: 'awaiting-approval', reason: 'not quite right', role: 'human' });
  // lifetime visitCount is already 1 here — the OLD (pre-D1) gate would have
  // parked this item immediately at maxVisits: 1, never dispatching it again.
  const config = configFor(writeCommittingExecutor(scriptDir, counterFile));

  const result = await runOnce({ repoRoot, config, worktreeDir, maxVisits: 1, log: noLog });

  // the human reject reset the budget to 0 doing-entries-since — the item
  // dispatches and proposes instead of being parked as over-limit.
  assert.deepEqual(result.parked, []);
  assert.equal(result.dispatched.length, 1);
  assert.equal(result.dispatched[0].id, 'item-reprieved');
  assert.equal(result.dispatched[0].outcome, 'awaiting-approval');
});

test('anti-loop: a BARE resume (no reason, no human role) does NOT reset the gate — the machine-only loop still dies at the cap', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-loopy-bare' });
  // a real prior visit (work.attempt), then blocked -> todo with no reason,
  // no role: a bare resume, never a human trigger per D1c. The prior visit
  // must still count.
  recordClaimAttempt(dir, { id: 'item-loopy-bare', phase: 'execute', result: 'failed' });
  moveWork(dir, { id: 'item-loopy-bare', to: 'blocked', expectedStatus: 'todo' });
  moveWork(dir, { id: 'item-loopy-bare', to: 'todo', expectedStatus: 'blocked' });
  const config = configFor(writeCommittingExecutor(scriptDir, counterFile));

  const result = await runOnce({ repoRoot, config, worktreeDir, maxVisits: 1, log: noLog });

  assert.deepEqual(result.parked, [{ id: 'item-loopy-bare', reason: 'anti-loop-max-visits', visits: 1 }]);
  assert.equal(listWork(dir).work['item-loopy-bare'].status, 'blocked');
  assert.equal(result.dispatched.length, 0);
});

// --- circuit breaker: consecutive misses halt the whole run ---------------

test('breaker trip: a goal-check miss at threshold parks the item and halts the run — worktree gone, branch kept (halt path teardown)', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-breaker' });
  const config = configFor(writeCommittingExecutor(scriptDir, counterFile, 'junk.txt'));

  const result = await runOnce({ repoRoot, config, worktreeDir, breakerThreshold: 1, log: noLog });

  assert.equal(result.outcome, 'drained');
  assert.equal(result.exitCode, 1);
  assert.equal(result.dispatched[0].outcome, 'halted');
  assert.equal(result.dispatched[0].reason, 'breaker-tripped');
  assert.equal(result.dispatched[0].attempts, 1); // the breaker vetoed the matrix's retry
  assert.equal(countRuns(counterFile), 1);
  assert.equal(listWork(dir).work['item-breaker'].status, 'blocked'); // never dangles in doing
  // removeWorktree ran in the finally even on the halt path
  assert.deepEqual(fs.readdirSync(worktreeDir), []);
  assert.equal(branchExists(repoRoot, 'fgw/item-breaker'), true);

  // friction channel (S2): the HALT path writes friction too — a halt must
  // not be silent any more than a park (ghi CẢ đường thất bại).
  const frictionEvent = readRawEvents(dir).find((e) => e.type === 'work.friction');
  assert.ok(frictionEvent, 'work.friction written on the halt branch');
  assert.equal(frictionEvent.payload.disposition, 'halted');
  assert.equal(frictionEvent.payload.errorClass, 'verify-miss');
  assert.equal(frictionEvent.payload.layer, 'verification');
});

test('breaker inert under default config: same goal-check miss with no breakerThreshold override parks the item instead of tripping the breaker (phase2-p1-breaker-inert-fix)', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-breaker-default' });
  const config = configFor(writeCommittingExecutor(scriptDir, counterFile, 'junk.txt'));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained');
  assert.equal(result.exitCode, 0);
  assert.equal(result.dispatched[0].outcome, 'parked');
  assert.equal(result.dispatched[0].errorClass, 'verify-miss');
  assert.equal(result.dispatched[0].attempts, 2);
  assert.equal(countRuns(counterFile), 2); // DEFAULT_MAX_RETRIES retried once, unvetoed by the breaker
});

// --- startup reap: stale doing + orphan branches --------------------------

test('startup reap: a crashed run\'s doing item with a committed, verify-passing branch is completed to proposed before the frontier runs', async () => {
  const { repoRoot, dir, worktreeDir } = setup();
  const item = seedItem(dir, { id: 'item-crashed' });
  // simulate the crashed run: claim, do the work on the branch, crash
  // before writing proposed (worktree torn down, branch left behind)
  acquireClaim(dir, { id: item.id, actor: 'runner', preClaimStatus: 'todo' });
  const wt = createWorktree(repoRoot, item.id, { worktreeDir });
  fs.writeFileSync(path.join(wt.path, 'output.txt'), 'done before crash\n');
  execFileSync('git', ['add', 'output.txt'], { cwd: wt.path });
  execFileSync('git', ['commit', '-q', '-m', 'worker: output.txt'], { cwd: wt.path });
  removeWorktree(repoRoot, wt.path);
  // an executor that would blow up if the runner wrongly re-dispatched
  const config = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 30000,
  };

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.deepEqual(result.reap.resolutions, [{ id: 'item-crashed', to: 'awaiting-approval', reason: null }]);
  assert.equal(listWork(dir).work['item-crashed'].status, 'awaiting-approval');
  assert.equal(result.outcome, 'idle'); // frontier was empty after the reap
  assert.deepEqual(fs.readdirSync(worktreeDir), []);
});

test('startup reap reclaims an orphaned checkout left behind by a genuine crash (worktree teardown never ran) instead of dying raw', async () => {
  const { repoRoot, dir, worktreeDir } = setup();
  const item = seedItem(dir, { id: 'item-orphaned-crash' });
  // simulate a genuine process kill: claim, commit on the branch, but never
  // call removeWorktree -- the runner died before its own `finally` ran, so
  // fgw/item-orphaned-crash is still checked out at wt.path when reap starts
  // and its own throwaway goal-check worktree would otherwise collide with it.
  acquireClaim(dir, { id: item.id, actor: 'runner', preClaimStatus: 'todo' });
  const wt = createWorktree(repoRoot, item.id, { worktreeDir });
  fs.writeFileSync(path.join(wt.path, 'output.txt'), 'done before crash\n');
  execFileSync('git', ['add', 'output.txt'], { cwd: wt.path });
  execFileSync('git', ['commit', '-q', '-m', 'worker: output.txt'], { cwd: wt.path });
  const config = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 30000,
  };

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.deepEqual(result.reap.resolutions, [{ id: 'item-orphaned-crash', to: 'awaiting-approval', reason: null }]);
  assert.equal(listWork(dir).work['item-orphaned-crash'].status, 'awaiting-approval');
  assert.equal(result.outcome, 'idle');
  // the orphaned checkout is reclaimed, not leaked
  assert.equal(fs.existsSync(wt.path), false);
});

test('startup reap: a doing item with nothing on its branch is reclaimed to blocked (runner-crash-reclaim)', async () => {
  const { repoRoot, dir, worktreeDir } = setup();
  seedItem(dir, { id: 'item-vanished' });
  acquireClaim(dir, { id: 'item-vanished', actor: 'runner', preClaimStatus: 'todo' });
  const config = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 30000,
  };

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.deepEqual(result.reap.resolutions, [
    { id: 'item-vanished', to: 'blocked', reason: 'runner-crash-reclaim' },
  ]);
  assert.equal(listWork(dir).work['item-vanished'].status, 'blocked');
  assert.equal(result.outcome, 'idle');
});

// --- startup reap never reclaims a pull-door (human/session) claim --------
// (stage-decompose S2-pull D1/cell action (4)): a person holds `doing`
// indefinitely — only a runner's own crashed claim is ever reaped.

test('startup reap SKIPS a doing item claimed by a human (claimRole) — never reclaimed, even with no branch/commit at all', async () => {
  const { repoRoot, dir, worktreeDir } = setup();
  const item = seedItem(dir, { id: 'item-human-held' });
  acquireClaim(dir, { id: item.id, actor: 'human', preClaimStatus: 'todo', claimRole: 'human', headAtTake: 'deadbeef' });
  const config = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 30000,
  };

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.deepEqual(result.reap.resolutions, [], 'the human-held item is never entered into the reap resolutions at all');
  assert.equal(listWork(dir).work['item-human-held'].status, 'doing', 'still held — a person is working it, no auto-reclaim');
  assert.equal(result.outcome, 'idle', 'the item stays out of the frontier too (status doing, not todo)');
});

test('startup reap SKIPS a doing item claimed by a session, but still reaps a plain runner claim in the SAME pass — selective, not a blanket disablement', async () => {
  const { repoRoot, dir, worktreeDir } = setup();
  const held = seedItem(dir, { id: 'item-session-held' });
  acquireClaim(dir, { id: held.id, actor: 'session', preClaimStatus: 'todo', claimRole: 'session', headAtTake: 'cafebabe' });
  const vanished = seedItem(dir, { id: 'item-runner-vanished' });
  acquireClaim(dir, { id: vanished.id, actor: 'runner', preClaimStatus: 'todo', claimRole: 'runner' });
  const config = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 30000,
  };

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.deepEqual(result.reap.resolutions, [
    { id: 'item-runner-vanished', to: 'blocked', reason: 'runner-crash-reclaim' },
  ]);
  assert.equal(listWork(dir).work['item-session-held'].status, 'doing', 'session claim untouched');
  assert.equal(listWork(dir).work['item-runner-vanished'].status, 'blocked', 'runner claim still reclaimed');
});

test('startup reap: empty fgw/ orphan branches are pruned, branches carrying commits are kept', async () => {
  const { repoRoot, dir, worktreeDir } = setup();
  // orphan: worktree created and torn down without a single commit
  const orphan = createWorktree(repoRoot, 'orphan-x', { worktreeDir });
  removeWorktree(repoRoot, orphan.path);
  // keeper: carries a real commit — a proposal, never auto-deleted
  const keeper = createWorktree(repoRoot, 'keeper-y', { worktreeDir });
  fs.writeFileSync(path.join(keeper.path, 'proposal.txt'), 'real work\n');
  execFileSync('git', ['add', 'proposal.txt'], { cwd: keeper.path });
  execFileSync('git', ['commit', '-q', '-m', 'worker: proposal.txt'], { cwd: keeper.path });
  removeWorktree(repoRoot, keeper.path);
  const config = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 30000,
  };

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.deepEqual(result.reap.pruned, ['fgw/orphan-x']);
  assert.deepEqual(result.reap.kept, [{ branch: 'fgw/keeper-y', aheadCount: 1 }]);
  assert.equal(branchExists(repoRoot, 'fgw/orphan-x'), false);
  assert.equal(branchExists(repoRoot, 'fgw/keeper-y'), true);
});

// tsk-577: a zero-ahead root branch must NOT be pruned while it still has a
// descendant that isn't done/wontfix yet — that descendant's own
// checkMergeStillResolves check (cleanup-harness.mjs) still needs this ref
// alive. Confirmed root cause of a real 14-item false-positive block.
test('startup reap: a zero-ahead root branch with an open (non-done/wontfix) leaf descendant is kept, not pruned (tsk-577)', async () => {
  const { repoRoot, dir, worktreeDir } = setup();
  // root-a: same shape as the existing orphan case (zero commits ahead) —
  // the only difference is it now has a leaf still relying on it.
  const rootBranch = createWorktree(repoRoot, 'root-a', { worktreeDir });
  removeWorktree(repoRoot, rootBranch.path);
  seedItem(dir, { id: 'root-a', status: 'cleanup' });
  seedItem(dir, { id: 'leaf-b', parent: 'root-a', status: 'cleanup' });

  const config = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 30000,
  };

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.deepEqual(result.reap.pruned, [], 'root-a must not be pruned — leaf-b still needs it');
  assert.deepEqual(result.reap.kept, [{ branch: 'fgw/root-a', aheadCount: 0, reason: 'descendant-still-needed' }]);
  assert.equal(branchExists(repoRoot, 'fgw/root-a'), true, 'the ref must survive this pass');
});

test('startup reap: a zero-ahead root branch whose only descendant is already done/wontfix is still pruned normally (tsk-577 regression guard)', async () => {
  const { repoRoot, dir, worktreeDir } = setup();
  const rootBranch = createWorktree(repoRoot, 'root-c', { worktreeDir });
  removeWorktree(repoRoot, rootBranch.path);
  seedItem(dir, { id: 'root-c', status: 'cleanup' });
  seedItem(dir, { id: 'leaf-d', parent: 'root-c', status: 'done' });

  const config = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 30000,
  };

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.deepEqual(result.reap.pruned, ['fgw/root-c'], 'a fully-resolved descendant must not block the existing prune behavior');
  assert.equal(branchExists(repoRoot, 'fgw/root-c'), false);
});

test('startup reap: a wontfix branch with real commits ahead and no open descendants is force-deleted', async () => {
  const { repoRoot, dir, worktreeDir } = setup();
  const wt = createWorktree(repoRoot, 'wontfix-a', { worktreeDir });
  fs.writeFileSync(path.join(wt.path, 'wontfix.txt'), 'abandoned work\n');
  execFileSync('git', ['add', 'wontfix.txt'], { cwd: wt.path });
  execFileSync('git', ['commit', '-q', '-m', 'wontfix work'], { cwd: wt.path });
  removeWorktree(repoRoot, wt.path);
  seedItem(dir, { id: 'wontfix-a', status: 'wontfix' });

  const config = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 30000,
  };

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.deepEqual(result.reap.pruned, ['fgw/wontfix-a']);
  assert.equal(branchExists(repoRoot, 'fgw/wontfix-a'), false);
});

test('startup reap: a wontfix branch with an open descendant is kept, not pruned', async () => {
  const { repoRoot, dir, worktreeDir } = setup();
  const wt = createWorktree(repoRoot, 'wontfix-root', { worktreeDir });
  fs.writeFileSync(path.join(wt.path, 'wontfix.txt'), 'abandoned work\n');
  execFileSync('git', ['add', 'wontfix.txt'], { cwd: wt.path });
  execFileSync('git', ['commit', '-q', '-m', 'wontfix work'], { cwd: wt.path });
  removeWorktree(repoRoot, wt.path);
  seedItem(dir, { id: 'wontfix-root', status: 'wontfix' });
  seedItem(dir, { id: 'child-open', parent: 'wontfix-root', status: 'doing' });

  const config = {
    executor: { command: '/no/such/executor-binary-xyz', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 30000,
  };

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.deepEqual(result.reap.pruned, []);
  assert.deepEqual(result.reap.kept, [{ branch: 'fgw/wontfix-root', aheadCount: 1 }]);
  assert.equal(branchExists(repoRoot, 'fgw/wontfix-root'), true);
});

// --- CAS conflict on the runner's own write -> clean halt, exit 3 ---------

test('state-conflict: a racing write under the runner\'s claim makes its own CAS fail -> cleanup, clean halt, exit 3', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-race' });
  const config = configFor(writeRacingExecutor(scriptDir, counterFile, dir, 'item-race'));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained');
  assert.equal(result.exitCode, 3);
  assert.equal(result.dispatched[0].outcome, 'halted');
  assert.equal(result.dispatched[0].errorClass, 'state-conflict');
  // the racing writer's state stands — the runner never overwrote it blindly
  assert.equal(listWork(dir).work['item-race'].status, 'blocked');
  // cleanup still ran on this halt path: worktree gone, branch kept
  assert.deepEqual(fs.readdirSync(worktreeDir), []);
  assert.equal(branchExists(repoRoot, 'fgw/item-race'), true);
});

test('tsk-40m code-review finding (blocker): a claim reclaimed by a DIFFERENT actor mid-dispatch is never silently settled by the runner\'s own stale claimId -- CAS conflict, clean halt, exit 3', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-race-claim' });
  const config = configFor(writeClaimReclaimingExecutor(scriptDir, counterFile, dir, 'item-race-claim'));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.outcome, 'drained');
  assert.equal(result.exitCode, 3);
  assert.equal(result.dispatched[0].outcome, 'halted');
  assert.equal(result.dispatched[0].errorClass, 'state-conflict');
  // the reclaiming actor's claim stands untouched — the runner never settled it
  const { readClaim } = await import('../../src/state/runtime-coordination.mjs');
  const currentClaim = readClaim(dir, 'item-race-claim');
  assert.ok(currentClaim, 'the different actor\'s claim must still be active');
  assert.equal(currentClaim.actor, 'a-different-actor');
  // cleanup still ran on this halt path: worktree gone, branch kept
  assert.deepEqual(fs.readdirSync(worktreeDir), []);
  assert.equal(branchExists(repoRoot, 'fgw/item-race-claim'), true);
});

// --- dry-run: reads only, writes nothing ----------------------------------

test('dry-run: prints the plan (tier -> model, branch) and writes no event, no branch, no worktree', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-plan' });
  const config = configFor(writeCommittingExecutor(scriptDir, counterFile));

  const result = await runOnce({ repoRoot, config, worktreeDir, dryRun: true, log: noLog });

  assert.equal(result.outcome, 'dry-run');
  assert.equal(result.plan.dispatch, 'item-plan');
  assert.equal(result.plan.tier, 'standard');
  assert.equal(result.plan.model, 'sonnet');
  assert.equal(result.plan.branch, 'fgw/item-plan');
  assert.equal(result.exitCode, 0);
  assert.equal(countRuns(counterFile), 0); // nothing dispatched
  assert.equal(readRawEvents(dir).length, 1); // only the seeding work.add
  assert.equal(listWork(dir).work['item-plan'].status, 'todo');
  assert.equal(branchExists(repoRoot, 'fgw/item-plan'), false);
  assert.deepEqual(fs.readdirSync(worktreeDir), []);
});

// --- the binary: repo root from cwd, categorized exit ----------------------

test('bin/fgos-runner.mjs run from a SUBDIRECTORY of another repo operates on that repo (root from cwd, never __dirname)', () => {
  const { repoRoot, dir, scriptDir, counterFile } = setup();
  seedItem(dir, { id: 'item-cli' });
  const scriptPath = writeCommittingExecutor(scriptDir, counterFile);
  fs.mkdirSync(path.join(repoRoot, '.fgos'), { recursive: true });
  fs.writeFileSync(
    path.join(repoRoot, '.fgos', 'config.json'),
    JSON.stringify({
      runner: {
        executor: { command: process.execPath, args: [scriptPath, '{prompt}', '--model', '{model}'] },
        models: { light: 'haiku', standard: 'sonnet', heavy: 'opus' },
        timeoutMs: 30000,
      },
    }),
  );
  const nested = path.join(repoRoot, 'nested');
  fs.mkdirSync(nested);
  const runnerBin = path.resolve(import.meta.dirname, '../../bin/fgos-runner.mjs');

  const run = spawnSync(process.execPath, [runnerBin, '--once'], { cwd: nested, encoding: 'utf8' });

  assert.equal(run.status, 0, `stderr: ${run.stderr}`);
  assert.match(run.stdout, /awaiting-approval/);
  assert.equal(listWork(dir).work['item-cli'].status, 'awaiting-approval');
  assert.equal(branchExists(repoRoot, 'fgw/item-cli'), true);
});

test('bin/fgos-runner.mjs rejects an unknown flag with the validation exit code', () => {
  const repoRoot = initTempRepo();
  const runnerBin = path.resolve(import.meta.dirname, '../../bin/fgos-runner.mjs');
  const run = spawnSync(process.execPath, [runnerBin, '--frobnicate'], { cwd: repoRoot, encoding: 'utf8' });
  assert.equal(run.status, 4);
  assert.match(run.stderr, /unknown flag/);
});

// --- wgi-8: runner-automatic discovered-from (report-not-write channel) ----
// The worker surfaces newly-discovered work as a fenced ```fgos-discovered
// JSON block in its output; the RUNNER (never the worker, D3) creates each
// item, stamping discoveredFrom = the dispatched item's id. Discovered items
// enter at stage `clarify` with a placeholder verify, exactly like a submit.

/** A committing worker that ALSO emits one fgos-discovered block per entry in
 * `bodies` on stdout (bodies are raw strings, so a test can feed malformed
 * JSON too). With `commit: false` the verify target is never produced. */
function writeDiscoveringExecutor(scriptDir, counterFile, bodies, { commit = true } = {}) {
  const scriptPath = path.join(scriptDir, 'discovering-executor.mjs');
  const emit = bodies
    .map((body) => `process.stdout.write(${JSON.stringify('```fgos-discovered\n' + body + '\n```\n')});`)
    .join('\n');
  const commitLines = commit
    ? `fs.writeFileSync('output.txt', 'produced by worker\\n');
execFileSync('git', ['add', 'output.txt']);
execFileSync('git', ['commit', '-q', '-m', 'worker: output.txt']);`
    : '';
  fs.writeFileSync(
    scriptPath,
    `
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
fs.appendFileSync(${JSON.stringify(counterFile)}, 'run\\n');
${emit}
${commitLines}
`,
  );
  return scriptPath;
}

test('wgi-8: a worker fgos-discovered block makes the RUNNER create a new item stamped discoveredFrom = the dispatched item (the worker never writes)', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-happy' });
  const body = JSON.stringify({
    title: 'Wire retry metrics into the dashboard',
    kind: 'feature',
    risk: 'standard',
    description: 'surfaced while doing item-happy',
  });
  const config = configFor(writeDiscoveringExecutor(scriptDir, counterFile, [body]));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.dispatched[0].outcome, 'awaiting-approval');
  const view = listWork(dir);
  const discovered = Object.values(view.work).filter((w) => w.discoveredFrom === 'item-happy');
  assert.equal(discovered.length, 1, 'exactly one discovered item, created by the RUNNER');
  const d = discovered[0];
  assert.equal(d.title, 'Wire retry metrics into the dashboard');
  assert.equal(d.description, 'surfaced while doing item-happy');
  assert.equal(d.status, 'todo');
  assert.equal(d.stage, 'discovery', 'enters at discovery (stages[0], tsk-qod D1/D2: clarify retired) so context-discovery attaches the real verify later');
  assert.equal(d.kind, 'feature', 'block kind override wins over classify()');
  assert.equal(d.risk, 'standard', 'block risk override wins over classify()');
  assert.equal(d.deps.length, 0);
  assert.match(d.verify, /chưa xác định/, 'reuses the shared clarify-entry verify placeholder, not a hardcoded duplicate');
  // D3: the worker committed only its own file; the .fgos work.add for the
  // discovered item was written by the runner, so item-happy still proposed.
  assert.equal(view.work['item-happy'].status, 'awaiting-approval');
});

// tsk-535 D4: block.description is optional per the fgos-discovered report
// schema -- a worker that omits it must not leave the created item with no
// description at all (the third write path this item's own scout found).
test('tsk-535 D4: a fgos-discovered block with no description falls back to the block\'s own title, not undefined', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-happy' });
  const body = JSON.stringify({
    title: 'Wire retry metrics into the dashboard',
    kind: 'feature',
    risk: 'standard',
  });
  const config = configFor(writeDiscoveringExecutor(scriptDir, counterFile, [body]));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.dispatched[0].outcome, 'awaiting-approval');
  const view = listWork(dir);
  const discovered = Object.values(view.work).filter((w) => w.discoveredFrom === 'item-happy');
  assert.equal(discovered.length, 1);
  assert.equal(discovered[0].description, 'Wire retry metrics into the dashboard');
});

test('tsk-2ck: a fgos-discovered block with an out-of-vocabulary risk (e.g. "medium") is coerced to derived.risk, creating the item instead of dropping it', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-happy' });
  const body = JSON.stringify({
    title: 'Fix crash in parser',
    kind: 'bug',
    risk: 'medium',
  });
  const config = configFor(writeDiscoveringExecutor(scriptDir, counterFile, [body]));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.dispatched[0].outcome, 'awaiting-approval');
  const view = listWork(dir);
  const discovered = Object.values(view.work).filter((w) => w.discoveredFrom === 'item-happy');
  assert.equal(discovered.length, 1, 'item was created instead of being silently dropped');
  assert.equal(discovered[0].kind, 'bug');
  assert.equal(discovered[0].risk, 'standard', 'out-of-vocabulary risk "medium" was coerced to derived.risk');
});

test('tsk-2ck: a fgos-discovered block with an out-of-vocabulary kind is coerced to derived.kind, creating the item instead of dropping it', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-happy' });
  const body = JSON.stringify({
    title: 'Fix crash in parser',
    kind: 'superbug',
    risk: 'light',
  });
  const config = configFor(writeDiscoveringExecutor(scriptDir, counterFile, [body]));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.dispatched[0].outcome, 'awaiting-approval');
  const view = listWork(dir);
  const discovered = Object.values(view.work).filter((w) => w.discoveredFrom === 'item-happy');
  assert.equal(discovered.length, 1, 'item was created instead of being silently dropped');
  assert.equal(discovered[0].risk, 'light');
  assert.equal(discovered[0].kind, 'bug', 'out-of-vocabulary kind "superbug" was coerced to derived.kind');
});

test('tsk-2ck: a fgos-discovered block with absent kind and risk falls back to derived.kind and derived.risk', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-happy' });
  const body = JSON.stringify({
    title: 'Fix crash in parser',
  });
  const config = configFor(writeDiscoveringExecutor(scriptDir, counterFile, [body]));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.dispatched[0].outcome, 'awaiting-approval');
  const view = listWork(dir);
  const discovered = Object.values(view.work).filter((w) => w.discoveredFrom === 'item-happy');
  assert.equal(discovered.length, 1);
  assert.equal(discovered[0].kind, 'bug');
  assert.equal(discovered[0].risk, 'standard');
});

test('wgi-8: a malformed fgos-discovered block is skipped (fail-safe) — the dispatch still proposes and no item is created', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-happy' });
  const config = configFor(writeDiscoveringExecutor(scriptDir, counterFile, ['{ this is not valid json )']));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.dispatched[0].outcome, 'awaiting-approval', 'a garbled report never derails the dispatch');
  assert.deepEqual(Object.keys(listWork(dir).work), ['item-happy'], 'malformed block creates nothing');
});

// --- S10 review-fix: discovery-capture cap + idempotency (2 P2 findings) ---

test('S10: a worker output with more than DISCOVERY_CAP (20) fgos-discovered blocks creates exactly 20 items, surplus skipped, dispatch outcome unaffected', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-flood' });
  const bodies = Array.from({ length: 25 }, (_, i) =>
    JSON.stringify({ title: `Discovered item ${i + 1}` }),
  );
  const config = configFor(writeDiscoveringExecutor(scriptDir, counterFile, bodies));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.dispatched[0].outcome, 'awaiting-approval', 'the cap never affects the dispatch outcome');
  const discovered = Object.values(listWork(dir).work).filter((w) => w.discoveredFrom === 'item-flood');
  assert.equal(discovered.length, 20, 'exactly DISCOVERY_CAP items created, the surplus 5 blocks skipped');
});

test('S10: a worker output repeating the identical block twice (same output) creates exactly one item', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-repeat' });
  const body = JSON.stringify({ title: 'Wire retry metrics into the dashboard' });
  const config = configFor(writeDiscoveringExecutor(scriptDir, counterFile, [body, body]));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.dispatched[0].outcome, 'awaiting-approval');
  const discovered = Object.values(listWork(dir).work).filter((w) => w.discoveredFrom === 'item-repeat');
  assert.equal(discovered.length, 1, 'the second, identical block is recognized as already-captured and skipped');
});

test('S10: a re-dispatched item re-emitting a block it already captured on a prior dispatch creates no additional item', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-redispatch' });
  // Simulate a prior dispatch's already-captured discovery: a work item
  // already exists, discoveredFrom = item-redispatch, matching title
  // (different case/whitespace to also prove the match is normalized).
  addWork(dir, {
    id: 'prior-discovery',
    title: '  wire RETRY metrics into the dashboard  ',
    kind: 'feature',
    status: 'todo',
    deps: [],
    risk: 'standard',
    refs: [],
    verify: 'chưa xác định',
    stage: 'discovery',
    discoveredFrom: 'item-redispatch',
  });
  const body = JSON.stringify({ title: 'Wire retry metrics into the dashboard' });
  const config = configFor(writeDiscoveringExecutor(scriptDir, counterFile, [body]));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.dispatched[0].outcome, 'awaiting-approval');
  const discovered = Object.values(listWork(dir).work).filter((w) => w.discoveredFrom === 'item-redispatch');
  assert.equal(discovered.length, 1, 'still only the pre-existing capture — the re-emitted block minted no second item');
});

test('S10: two genuinely distinct blocks in one output still both create items (idempotency check does not over-match)', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-distinct' });
  const bodies = [
    JSON.stringify({ title: 'Wire retry metrics into the dashboard' }),
    JSON.stringify({ title: 'Add a health-check endpoint' }),
  ];
  const config = configFor(writeDiscoveringExecutor(scriptDir, counterFile, bodies));

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.equal(result.dispatched[0].outcome, 'awaiting-approval');
  const discovered = Object.values(listWork(dir).work).filter((w) => w.discoveredFrom === 'item-distinct');
  assert.equal(discovered.length, 2, 'two distinct titles both create items');
  const titles = discovered.map((d) => d.title).sort();
  assert.deepEqual(titles, ['Add a health-check endpoint', 'Wire retry metrics into the dashboard']);
});

// --- S11 review-fix: sanitize discovery-block title before logging (1 P3 finding) ---

test('S11: a discovery block title with embedded newlines cannot forge extra log lines (sanitized in the idempotent-skip log), and a very long title is clamped in the log and bounded in the stored item', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-newline-title' });
  const craftedTitle = `${'A'.repeat(200)}\nfgos-runner: FORGED — fake halt event`;
  const body = JSON.stringify({ title: craftedTitle });
  // The same block twice: the first capture creates the item, the second hits
  // the idempotent-skip log path — exactly where block.title is interpolated.
  const config = configFor(writeDiscoveringExecutor(scriptDir, counterFile, [body, body]));
  const lines = [];
  const capture = (msg) => lines.push(msg);

  const result = await runOnce({ repoRoot, config, worktreeDir, log: capture });

  assert.equal(result.dispatched[0].outcome, 'awaiting-approval');
  const discovered = Object.values(listWork(dir).work).filter((w) => w.discoveredFrom === 'item-newline-title');
  assert.equal(discovered.length, 1, 'the second, identical block is recognized as already-captured');
  // The store bounds every title it accepts (work-item-title-contract D5), so
  // the stored record holds the bounded prefix rather than the whole crafted
  // string. The bound lands before the crafted newline, which means the forged
  // suffix cannot reach the stored title either — the same property this test
  // already asserts for the log line.
  assert.equal(
    discovered[0].title,
    `${'A'.repeat(MAX_TITLE_LENGTH - 1)}…`,
    'the stored title is bounded at the write door, with a trailing ellipsis marking the cut',
  );
  assert.ok(!discovered[0].title.includes('FORGED'), 'the bounded title never reaches the forged suffix');
  assert.equal(discovered[0].title.split('\n').length, 1, 'the stored title carries no embedded newline');

  const skipLines = lines.filter((line) => line.includes('already captured'));
  assert.equal(skipLines.length, 1, 'exactly one skip log line, not forged into extra lines');
  assert.equal(skipLines[0].split('\n').length, 1, 'the log line itself contains no embedded newline');
  assert.ok(
    skipLines[0].includes(`("${'A'.repeat(120)}…")`),
    'the logged title is clamped to the fixed length, with an ellipsis marker',
  );
  assert.ok(!skipLines[0].includes('FORGED'), 'the clamped log line never reaches the forged suffix');
});

/** A worker that emits a discovery block, then hangs past the timeout — so its
 * output reaches the runner on the DispatchError(err.stdout) path, never
 * worker.stdout. Proves the terminal-outcome capture covers BOTH sources. */
function writeHangingDiscoveringExecutor(scriptDir, body) {
  const scriptPath = path.join(scriptDir, 'hanging-discovering-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
process.stdout.write(${JSON.stringify('```fgos-discovered\n' + body + '\n```\n')});
await new Promise(() => {}); // hang until SIGTERM (timeout)
`,
  );
  return scriptPath;
}

test('wgi-8: even a TIMED-OUT worker (output on the err.stdout path) has its fgos-discovered report captured exactly once at the terminal outcome, no duplicate across the retry', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir } = setup();
  seedItem(dir, { id: 'item-slow' });
  const body = JSON.stringify({ title: 'Investigate the slow path' });
  const scriptPath = writeHangingDiscoveringExecutor(scriptDir, body);
  const config = {
    executor: { command: process.execPath, args: [scriptPath, '{prompt}'] },
    models: { light: 'haiku', standard: 'sonnet', heavy: 'opus' },
    timeoutMs: 400,
  };

  const result = await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  assert.notEqual(result.dispatched[0].outcome, 'awaiting-approval', 'the item itself times out — it never proposes');
  const discovered = Object.values(listWork(dir).work).filter((w) => w.discoveredFrom === 'item-slow');
  assert.equal(discovered.length, 1, 'the err.stdout (timeout) report is captured once, never duplicated across retries');
  assert.equal(discovered[0].title, 'Investigate the slow path');
});

test('resolveRepoRoot: a git repo with zero commits throws category "validation" naming the cause and the fix', () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-loop-test-headless-'));
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });

  assert.throws(
    () => resolveRepoRoot(repoRoot),
    (err) => {
      assert.equal(err.category, 'validation');
      assert.match(err.message, /HEAD does not resolve/);
      assert.match(err.message, /git commit/);
      return true;
    },
  );
});

test('resolveRepoRoot: a git repo with at least one commit still returns the repo root string unchanged', () => {
  const repoRoot = initTempRepo();

  assert.equal(resolveRepoRoot(repoRoot), fs.realpathSync(repoRoot));
});


// --- runWatch (D7/D8/D9): the persistent --watch loop mode -----------------
// Level-triggered ("did the last cycle commit anything?") instead of an
// EventEmitter listener -- see decision d3445024 (loop.mjs's own runWatch
// doc comment) for why the listener shape was rejected in validation.

test('runWatch: a cycle that committed is followed by an immediate next cycle; a cycle that committed nothing is followed by a next cycle only after roughly pollFallbackMs', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-watch-timing' });
  const config = configFor(writeCommittingExecutor(scriptDir, counterFile));
  const pollFallbackMs = 300;
  const timestamps = [];
  const controller = new AbortController();

  await runWatch({
    repoRoot,
    dir,
    config,
    worktreeDir,
    pollFallbackMs,
    signal: controller.signal,
    log: noLog,
    onCycle: () => {
      timestamps.push(Date.now());
      if (timestamps.length >= 3) controller.abort();
    },
  });

  assert.equal(timestamps.length, 3, 'collected exactly 3 cycles before aborting');
  // cycle 1 dispatches+proposes the seeded item (commits) -> cycle 2 starts
  // immediately, with no artificial wait; cycle 2 itself is a cheap idle poll
  // (the item is already proposed, nothing left to dispatch), so this gap is
  // dominated by cycle 2's own tiny duration, not by pollFallbackMs.
  const immediateGap = timestamps[1] - timestamps[0];
  // cycle 2 committed nothing (idle) -> runWatch waits ~pollFallbackMs before
  // cycle 3 starts.
  const waitedGap = timestamps[2] - timestamps[1];
  assert.ok(immediateGap < pollFallbackMs / 2, `expected the post-commit gap (${immediateGap}ms) to be well under pollFallbackMs (${pollFallbackMs}ms)`);
  assert.ok(waitedGap >= pollFallbackMs - 20, `expected the post-idle gap (${waitedGap}ms) to be roughly pollFallbackMs (${pollFallbackMs}ms)`);
  assert.ok(waitedGap > immediateGap, 'the waited (idle) gap is clearly larger than the immediate (committed) gap');
});

test('runWatch stops promptly when its AbortSignal aborts mid-wait, and resolves cleanly without throwing', async () => {
  const { repoRoot, dir, worktreeDir } = setup(); // empty frontier -- idle every cycle
  const pollFallbackMs = 2000;
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 30);

  const started = Date.now();
  await runWatch({ repoRoot, dir, worktreeDir, pollFallbackMs, signal: controller.signal, log: noLog });
  const elapsed = Date.now() - started;

  assert.ok(elapsed < pollFallbackMs / 2, `expected runWatch to resolve promptly on abort (took ${elapsed}ms, pollFallbackMs was ${pollFallbackMs}ms)`);
});

test('runWatch threads the SAME breaker instance into every cycle: misses accumulate ACROSS cycles past what one dispatch alone could reach (cross-cycle sharing)', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-watch-breaker' });
  // commits junk.txt, but verify demands output.txt -> every attempt misses.
  const config = configFor(writeCommittingExecutor(scriptDir, counterFile, 'junk.txt'));
  const breaker = createMissBreaker(); // default threshold, BREAKER_MISSES = 3
  const results = [];
  const controller = new AbortController();

  await runWatch({
    repoRoot,
    dir,
    config,
    worktreeDir,
    breaker,
    pollFallbackMs: 5,
    signal: controller.signal,
    log: noLog,
    onCycle: (result) => {
      results.push(result);
      if (results.length === 1) {
        // cycle 1's own retry cap (2 attempts) cannot reach the default
        // threshold (3) on its own -- resume the item so a SECOND cycle
        // dispatches it again, against the SAME breaker instance.
        assert.equal(breaker.consecutiveMissesFor('item-watch-breaker'), 2, "one dispatch alone never reaches the default threshold");
        moveWork(dir, { id: 'item-watch-breaker', to: 'todo', expectedStatus: 'blocked', role: 'human', reason: 'test-resume' });
      } else {
        controller.abort();
      }
    },
  });

  assert.equal(results.length, 2);
  assert.equal(results[0].dispatched[0].outcome, 'parked');
  assert.equal(results[0].dispatched[0].attempts, 2);
  // cycle 2's FIRST attempt alone pushes the SAME breaker's streak from 2 to
  // 3, tripping it immediately (attempts: 1, retry vetoed) -- reachable only
  // because the breaker persisted across cycles.
  assert.equal(results[1].dispatched[0].outcome, 'halted');
  assert.equal(results[1].dispatched[0].reason, 'breaker-tripped');
  assert.equal(results[1].dispatched[0].attempts, 1);
  assert.equal(breaker.consecutiveMissesFor('item-watch-breaker'), 3);
});

test('runWatch catches a runOnce throw, reports it via onCycle with outcome "error", and keeps looping instead of terminating', async () => {
  const { repoRoot, dir, worktreeDir } = setup(); // empty frontier -- reaches the idle log call every cycle
  let logCalls = 0;
  const flakyLog = () => {
    logCalls += 1;
    if (logCalls === 1) throw new Error('injected-log-throw'); // only the first cycle's log call throws
  };
  const results = [];
  const controller = new AbortController();

  await runWatch({
    repoRoot,
    dir,
    worktreeDir,
    pollFallbackMs: 5,
    signal: controller.signal,
    log: flakyLog,
    onCycle: (result) => {
      results.push(result);
      if (results.length >= 3) controller.abort();
    },
  });

  assert.equal(results.length, 3, 'the injected throw did not end the watch loop early');
  assert.equal(results[0].outcome, 'error');
  assert.match(results[0].error.message, /injected-log-throw/);
  // the loop kept going and ran at least 2 more cycles successfully
  assert.equal(results[1].outcome, 'idle');
  assert.equal(results[2].outcome, 'idle');
});

// --- tsk-4v6: DISCOVERY DISPATCH sweep respects the real clear/unclear
// verdict (CONTEXT.md D5, docs/history/tsk-4b2-discovery-exploring-stage-
// wiring/) instead of the old "any real commit advances" bug. ---

/** A worker dispatched at stage 'discovery' that commits a research file
 * and, when `verdictBody` is given, emits a single `fgos-verdict` fence
 * carrying it — mirrors `writeDiscoveringExecutor`'s shape for the sibling
 * `fgos-discovered` channel, one fence format down. Omitting `verdictBody`
 * simulates a worker that committed real research but never reported a
 * verdict (the malformed/absent-fence case). */
function writeDiscoveryVerdictExecutor(scriptDir, counterFile, verdictBody) {
  const scriptPath = path.join(scriptDir, 'discovery-verdict-executor.mjs');
  const emit = verdictBody
    ? `process.stdout.write(${JSON.stringify('```fgos-verdict\n' + verdictBody + '\n```\n')});`
    : '';
  fs.writeFileSync(
    scriptPath,
    `
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
fs.appendFileSync(${JSON.stringify(counterFile)}, 'run\\n');
${emit}
fs.writeFileSync('RESEARCH.md', 'findings\\n');
execFileSync('git', ['add', 'RESEARCH.md']);
execFileSync('git', ['commit', '-q', '-m', 'worker: RESEARCH.md']);
`,
  );
  return scriptPath;
}

test('tsk-30v: DISCOVERY DISPATCH sweep advances discovery -> planning on a clear verdict, skipping exploring, carrying the worker\'s proposed verify onto the item', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  // FALLBACK_VERIFY, not seedItem's default -- a fresh discovery-stage item
  // has no real verify yet, same starting shape as an item that just landed
  // on discovery via the clarify->discovery edge (D3).
  seedItem(dir, { id: 'item-research-clear', stage: 'discovery', verify: 'chưa xác định — bổ sung thủ công' });
  const body = JSON.stringify({ clear: true, verify: 'npm test -- research' });
  const config = configFor(writeDiscoveryVerdictExecutor(scriptDir, counterFile, body));

  await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  const item = listWork(dir).work['item-research-clear'];
  assert.equal(item.stage, 'planning', 'tsk-30v D2/D6: a clear verdict skips exploring, discovery -> planning directly');
  assert.equal(item.status, 'todo', 'planning is a fresh todo stop, not doing/awaiting-approval');
  assert.equal(item.verify, 'npm test -- research', "the worker's own proposed verify rides onto the item");
});

test('tsk-4v6/tsk-30v: DISCOVERY DISPATCH sweep advances the item to exploring AND parks it on an unclear verdict, matching the interactive driver path', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-research-unclear', stage: 'discovery' });
  const question = '## Context\n\nThe research worker needs a retry backoff strategy for this item.\n\n## Why this matters\n\nThis directly affects the outcome: which retry backoff strategy should this follow?';
  const body = JSON.stringify({ clear: false, question });
  const config = configFor(writeDiscoveryVerdictExecutor(scriptDir, counterFile, body));

  await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  const view = listWork(dir);
  const item = view.work['item-research-unclear'];
  assert.equal(item.stage, 'exploring', 'tsk-30v D2/D3: unclear no longer parks in place -- stage advances to exploring');
  assert.equal(item.status, 'awaiting-human', 'unclear verdict parks the item, matching resolveDiscovery\'s session-role behavior');
  assert.equal(view.gates?.['item-research-unclear']?.ask, question);
});

test('tsk-4v6: DISCOVERY DISPATCH sweep never advances the item when a real commit lands but no verdict fence is reported — the exact bug this item fixes', async () => {
  const { repoRoot, dir, scriptDir, worktreeDir, counterFile } = setup();
  seedItem(dir, { id: 'item-research-silent', stage: 'discovery' });
  // no verdictBody -- the worker commits real research but reports nothing,
  // the same shape the pre-fix worker-prompt-discovery.txt template produced
  const config = configFor(writeDiscoveryVerdictExecutor(scriptDir, counterFile, undefined));

  await runOnce({ repoRoot, config, worktreeDir, log: noLog });

  const item = listWork(dir).work['item-research-silent'];
  assert.equal(item.stage, 'discovery', 'a commit with no verdict never advances the item (the old bug: any real commit used to advance it)');
  assert.equal(item.status, 'todo', 'left exactly as today\'s no-commit branch already does, for the next sweep to retry');
});

test('tsk-4v6: parseVerdictBlock is fail-safe on absent/malformed fences and picks the last well-formed block when more than one is emitted', async () => {
  const { parseVerdictBlock } = await import('../../src/runner/loop.mjs');
  assert.equal(parseVerdictBlock(''), null);
  assert.equal(parseVerdictBlock('no fence here'), null);
  assert.equal(parseVerdictBlock('```fgos-verdict\nnot json\n```'), null);
  assert.equal(parseVerdictBlock('```fgos-verdict\n{"clear": "yes"}\n```'), null, 'clear must be boolean');
  assert.deepEqual(parseVerdictBlock('```fgos-verdict\n{"clear": true, "verify": "npm test"}\n```'), {
    clear: true,
    verify: 'npm test',
  });
  assert.deepEqual(parseVerdictBlock('```fgos-verdict\n{"clear": false, "question": "which one?"}\n```'), {
    clear: false,
    question: 'which one?',
  });
  const twoBlocks =
    '```fgos-verdict\n{"clear": false, "question": "first"}\n```\n' +
    '```fgos-verdict\n{"clear": true, "verify": "npm test"}\n```';
  assert.deepEqual(parseVerdictBlock(twoBlocks), { clear: true, verify: 'npm test' }, 'last well-formed block wins');
});

test('tsk-2yo: parseVerdictBlock parses optional tier/kind/risk additively, without changing the shape of a fence that omits them', async () => {
  const { parseVerdictBlock } = await import('../../src/runner/loop.mjs');
  // A fence that predates D12/D17 (no classification fields) parses to the
  // exact same two-key object as before this item -- not a three-key object
  // with tier/kind/risk present-but-undefined, which would break every
  // caller (and this file's own prior assertions above) doing a deepEqual
  // against the old two-key shape.
  assert.deepEqual(parseVerdictBlock('```fgos-verdict\n{"clear": true, "verify": "npm test"}\n```'), {
    clear: true,
    verify: 'npm test',
  });
  assert.deepEqual(
    parseVerdictBlock('```fgos-verdict\n{"clear": true, "verify": "npm test", "tier": "heavy", "kind": "bug", "risk": "heavy"}\n```'),
    { clear: true, verify: 'npm test', tier: 'heavy', kind: 'bug', risk: 'heavy' },
  );
  // Partial classification (only one of the three fields) — each key is
  // independent, never all-or-nothing.
  assert.deepEqual(parseVerdictBlock('```fgos-verdict\n{"clear": true, "verify": "npm test", "kind": "feature"}\n```'), {
    clear: true,
    verify: 'npm test',
    kind: 'feature',
  });
  // A non-string classification value is dropped the same way a non-string
  // `verify` already is -- fail-safe, never a thrown error.
  assert.deepEqual(parseVerdictBlock('```fgos-verdict\n{"clear": true, "verify": "npm test", "tier": 5}\n```'), {
    clear: true,
    verify: 'npm test',
  });
  // An `unclear` verdict never carries classification fields at all — the
  // parser only reads them from the `clear: true` branch.
  assert.deepEqual(
    parseVerdictBlock('```fgos-verdict\n{"clear": false, "question": "which one?", "tier": "heavy"}\n```'),
    { clear: false, question: 'which one?' },
  );
});

test('tsk-2yo: classificationPatchFromVerdict only builds a patch on a clear discovery outcome with a clear caller verdict, and only for fields actually reported', async () => {
  const { classificationPatchFromVerdict } = await import('../../src/runner/loop.mjs');
  assert.deepEqual(classificationPatchFromVerdict('clear', { clear: true, tier: 'heavy', kind: 'bug', risk: 'heavy' }), {
    tier: 'heavy',
    kind: 'bug',
    risk: 'heavy',
  });
  assert.deepEqual(classificationPatchFromVerdict('clear', { clear: true, tier: 'heavy' }), { tier: 'heavy' }, 'partial classification stays partial');
  assert.deepEqual(classificationPatchFromVerdict('clear', { clear: true }), {}, 'no classification fields reported -> empty patch, no edit call');
  assert.deepEqual(
    classificationPatchFromVerdict('unclear', { clear: true, tier: 'heavy' }),
    {},
    'never applies when the discovery outcome itself is not clear',
  );
  assert.deepEqual(classificationPatchFromVerdict('clear', { clear: false, tier: 'heavy' }), {}, 'never applies when the caller verdict itself is not clear');
  assert.deepEqual(classificationPatchFromVerdict('clear', null), {}, 'no caller verdict at all (fence absent/malformed) -> empty patch');
});

test('tsk-2yo: a headless clear verdict carrying tier/kind/risk actually applies them to the work item via editWork', async () => {
  const { classificationPatchFromVerdict } = await import('../../src/runner/loop.mjs');
  const { editWork } = await import('../../src/state/store.mjs');
  const dir = mkTempDir('fgos-loop-test-classify-');
  initStore(dir);
  addWork(dir, {
    id: 'item-headless-classify',
    title: 'Headless classify test',
    description: 'test',
    kind: 'task',
    status: 'todo',
    deps: [],
    risk: 'standard',
    refs: [],
    verify: 'npm test',
    tier: 'standard',
    stage: 'discovery',
    domain: 'coding',
  });
  const callerVerdict = { clear: true, verify: 'npm test', tier: 'heavy', kind: 'bug', risk: 'heavy' };
  const patch = classificationPatchFromVerdict('clear', callerVerdict);
  editWork(dir, { id: 'item-headless-classify', patch, role: 'runner' });
  const item = listWork(dir).work['item-headless-classify'];
  assert.equal(item.tier, 'heavy');
  assert.equal(item.kind, 'bug');
  assert.equal(item.risk, 'heavy');
});

test('tsk-34o5: startupReap parks a stale doing item with attestation-mismatch when baseCommit/headRef diverges', async () => {
  const { repoRoot, dir, worktreeDir } = setup();
  const id = 'stale-attest-item';
  seedItem(dir, { id });
  acquireClaim(dir, { id, actor: 'runner', preClaimStatus: 'todo', claimRole: 'runner' });

  const branch = branchNameFor(id);
  const baseCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  execFileSync('git', ['checkout', '-b', branch], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'stale.txt'), 'stale content');
  execFileSync('git', ['add', 'stale.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-m', 'stale commit'], { cwd: repoRoot });
  execFileSync('git', ['checkout', 'main'], { cwd: repoRoot });

  appendEvent(path.join(dir, 'events.jsonl'), {
    type: 'executor.dispatch',
    payload: { id, executorId: 'cli', baseCommit, headRef: 'main' },
  });

  const { startupReap } = await import('../../src/runner/loop.mjs');
  const result = await startupReap({ repoRoot, dir, worktreeDir, log: noLog });

  assert.equal(result.resolutions[0].to, 'blocked');
  assert.equal(result.resolutions[0].reason, 'attestation-mismatch');

  const view = listWork(dir);
  assert.equal(view.work[id].status, 'blocked');
});

test('tsk-34o5: startupReap does NOT halt a legitimate retry on a branch with previous commits if latest attestation baseCommit is ancestor', async () => {
  const { repoRoot, dir, worktreeDir } = setup();
  const id = 'retry-attest-item';
  seedItem(dir, { id, verify: 'exit 0' });
  acquireClaim(dir, { id, actor: 'runner', preClaimStatus: 'todo', claimRole: 'runner' });

  const branch = branchNameFor(id);
  const baseCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  execFileSync('git', ['checkout', '-b', branch], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'attempt1.txt'), 'failed attempt');
  execFileSync('git', ['add', 'attempt1.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-m', 'attempt 1'], { cwd: repoRoot });

  appendEvent(path.join(dir, 'events.jsonl'), {
    type: 'executor.dispatch',
    payload: { id, executorId: 'cli', baseCommit, headRef: branch },
  });

  fs.writeFileSync(path.join(repoRoot, 'attempt2.txt'), 'successful attempt');
  execFileSync('git', ['add', 'attempt2.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-m', 'attempt 2'], { cwd: repoRoot });
  execFileSync('git', ['checkout', 'main'], { cwd: repoRoot });

  appendEvent(path.join(dir, 'events.jsonl'), {
    type: 'executor.dispatch',
    payload: { id, executorId: 'cli', baseCommit, headRef: branch },
  });

  const { startupReap } = await import('../../src/runner/loop.mjs');
  await startupReap({ repoRoot, dir, worktreeDir, log: noLog });

  const view = listWork(dir);
  assert.equal(view.work[id].status, 'awaiting-approval');
});
