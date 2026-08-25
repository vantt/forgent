import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { claimWork, ClaimError } from '../../src/runner/claim-port.mjs';
import { LOCK_FILE, DEFAULT_TTL_MS } from '../../src/runner/main-checkout-lock.mjs';
import { initStore, addWork, moveWork, settleClaim, listWork, FsmError, readRawEvents } from '../../src/state/store.mjs';
import { writeSharedConfig } from '../../src/config/shared-config-file.mjs';
import { resolveFgosFile, FGOS_FILE } from '../../src/state/fgos-file-registry.mjs';

// claim-port.mjs's claimWork shares main-checkout.lock with .githooks/
// pre-commit (tsk-3w8) — the hook writes a STRING-identity record per commit
// and never releases it (TTL-based auto-expiry is the design). Every test
// here builds its own disposable git repo + .fgos store; nothing touches
// THIS repo's own checkout.

function initTempRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-claim-port-test-'));
  execFileSync('git', ['init', '-q'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: repoRoot });
  return repoRoot;
}

// D4 (docs/history/session-claim-liveness/CONTEXT.md): backdates the
// COMMITTER date `%ct` (claim-liveness.mjs's `lastActivityAt`) actually
// reads -- `--date`/GIT_AUTHOR_DATE alone would leave it at "now".
function commitAt(cwd, filename, contents, epochSeconds) {
  fs.writeFileSync(path.join(cwd, filename), contents);
  execFileSync('git', ['add', filename], { cwd });
  execFileSync('git', ['commit', '-q', '-m', `test: ${filename}`], {
    cwd,
    env: {
      ...process.env,
      GIT_AUTHOR_DATE: `${epochSeconds} +0000`,
      GIT_COMMITTER_DATE: `${epochSeconds} +0000`,
    },
  });
}

function setup() {
  const repoRoot = initTempRepo();
  const dir = path.join(repoRoot, '.fgos');
  initStore(dir);
  addWork(dir, { id: 'item-a', title: 'Item A', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  return { repoRoot, dir };
}

/** Mirrors the exact shape .githooks/pre-commit writes: a STRING writer
 * identity (never a numeric pid), timestamped `ageMs` in the past. */
function writeHookStyleLock(dir, ageMs) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, LOCK_FILE), JSON.stringify({ pid: 'some-writer-session-id', ts: Date.now() - ageMs }));
}

// tsk-3jh: claimWork used to parse events.jsonl twice for the same
// unmutated data (listWork, then readRawEvents) before moveWork/addOutcome
// ever ran their own separate reads (CAS reread + appendEventCore's own
// seq-computation read, both load-bearing and untouched by this item — see
// docs/history/tsk-3jh-dedupe-redundant-state-reads/RESEARCH.md). Counts
// real fs.readFileSync calls against the log surface to prove the dedupe,
// not just the resulting shape.
//
// Tầng A/T2/T3 (eventlog-tier-a-multifile-content-hash): a writer's own
// events now land in a per-writer file under `.fgos/events/`, not baseline-0
// `.fgos/events.jsonl` — so the single `target === logPath` check this test
// used to make no longer sees most of the activity (it silently degenerated
// to counting only the near-empty baseline file). Widened to count a full
// read of EITHER the baseline file OR any file under `.fgos/events/`,
// preserving the original intent (prove the full-log-read count stays
// bounded) across the new multi-file shape.
test('claimWork reads the event log fully at most 5 times per call, not 6+ (tsk-3jh dedupe + tsk-49e incremental snapshot + Tầng A multi-file + tsk-40m claim/doing split)', () => {
  const { repoRoot, dir } = setup();
  const eventsDir = path.join(dir, 'events');
  const baselinePath = path.join(dir, 'events.jsonl');
  const originalReadFileSync = fs.readFileSync;
  let logReadCount = 0;
  fs.readFileSync = function patched(target, ...rest) {
    const t = String(target);
    if (t === baselinePath || t.startsWith(eventsDir + path.sep)) logReadCount++;
    return originalReadFileSync.call(fs, target, ...rest);
  };
  try {
    claimWork(dir, { id: 'item-a', actor: 'session', isolate: false, repoRoot });
  } finally {
    fs.readFileSync = originalReadFileSync;
  }

  // Up to 5 FULL fs.readFileSync reads: (1) discovery's baseline-0 read
  // (empty/absent, per discoverEventFilePaths always listing it), (2)
  // discovery's single read of the one existing writer file (replay.mjs's
  // readFileWithRawLines — reads+parses from ONE buffer, tsk-3jh's own
  // "never re-read data already in hand" discipline), (3)+(4)
  // runOpportunisticMainCheckoutChecks's own truncation-guard read of the
  // same two files (events-jsonl-truncation-guard.mjs, unrelated to and
  // unchanged by tsk-40m — pre-existing: verified directly against the
  // pre-tsk-40m baseline commit 435444ef, where this same call already read
  // both files every time run in isolation, meaning this assertion already
  // undercounted them at 4 before tsk-40m touched anything; under full-
  // suite concurrency the guard's own read count for those two files can
  // come in lower, an environment-sensitivity this test does not try to
  // pin down further since it belongs to that unrelated subsystem), (5)
  // addOutcome's appendEventCore seq-read of the writer file, predicted-
  // outcome bookkeeping for the claim (unchanged by tsk-40m). tsk-40m's own
  // change — claimWork no longer calls moveWork to durably move the item to
  // 'doing' (acquireClaim writes the runtime claim file instead, no
  // event-log read) — actually DROPS the worst case by one from this same
  // baseline's real (previously unasserted) total of 6: moveWork's own
  // appendEventCore seq-read of the writer file is gone. None of these
  // reads go through rebuildView, so tsk-49e's snapshot fast path never
  // applies to them. Asserted as an upper bound (never a lower one) because
  // this call's own read count is bounded-above and deterministic, but the
  // truncation guard's is not, in ways this test does not own.
  assert.ok(logReadCount >= 2 && logReadCount <= 5, `expected 2-5 full log reads, got ${logReadCount}`);
});

test('claimWork reclaims a stale hook-written (string-identity) lock past DEFAULT_TTL_MS, instead of failing lock-ambiguous forever', () => {
  const { repoRoot, dir } = setup();
  writeHookStyleLock(dir, DEFAULT_TTL_MS + 1000);

  const claim = claimWork(dir, { id: 'item-a', actor: 'session', isolate: false, repoRoot });

  assert.equal(claim.id, 'item-a');
  assert.equal(claim.to, 'doing');
});

test('claimWork throws a categorized ClaimError (not an uncategorized crash) when a fresh hook-written lock is still within DEFAULT_TTL_MS', () => {
  const { repoRoot, dir } = setup();
  writeHookStyleLock(dir, 1000);

  assert.throws(
    () => claimWork(dir, { id: 'item-a', actor: 'session', isolate: false, repoRoot }),
    (err) => {
      assert.ok(err instanceof ClaimError);
      assert.equal(err.code, 'lock-held');
      assert.equal(err.category, 'lock-timeout', 'must be categorized so the runner halts gracefully instead of crashing the whole drain-run');
      // tsk-6c2: a caller-side retry wrapper needs remainingTtlMs to bound
      // its wait budget without parsing it back out of the message string.
      assert.equal(typeof err.remainingTtlMs, 'number');
      assert.equal(err.holderPid, 'some-writer-session-id');
      return true;
    },
  );
});

// tsk-2l8: a lock file with unreadable/corrupt content (not a hook-shaped
// string-identity record) used to fail closed immediately, forcing a
// person to run `/fgOS:unlock` before retrying. claimWork now mirrors that
// verb's own `forceReclaimAmbiguousLock` self-heal (main-checkout-lock.mjs:
// 655-676, its own re-read-before-unlink TOCTOU guard) inline: a ONE-OFF
// unparseable write like this never gets rewritten, so the reclaim-and-retry
// clears it and the claim proceeds normally in the same call.
test('claimWork self-heals a transiently-corrupt lock (unreadable content, not a hook-shaped string-identity record) instead of failing lock-ambiguous', () => {
  const { repoRoot, dir } = setup();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, LOCK_FILE), 'not valid json');

  const claim = claimWork(dir, { id: 'item-a', actor: 'session', isolate: false, repoRoot });

  assert.equal(claim.id, 'item-a');
  assert.equal(claim.to, 'doing');
});

// The reclaim-and-retry above only ever gets ONE retry (mirroring `unlock`'s
// own single forceReclaimAmbiguousLock call, never a loop) — content that is
// STILL unparseable on that second attempt (persistently corrupt, e.g. some
// other process keeps rewriting garbage into the lock file, not a transient
// race with a legitimate writer) must still fail closed exactly like before
// this item. Simulated by patching fs.linkSync so tryAcquireOnce's own
// create-path (writeAtomicCreate) always sees the lock path as already
// occupied — forcing it down the read-and-parse fallback on BOTH attempts —
// and fs.readFileSync so that fallback always reads back corrupt content,
// even after forceReclaimAmbiguousLock unlinks the real file in between.
test('claimWork throws a categorized ClaimError when the lock content is still ambiguous after one reclaim-and-retry — genuinely ambiguous, fails closed', () => {
  const { repoRoot, dir } = setup();
  fs.mkdirSync(dir, { recursive: true });
  const lockPath = path.join(dir, LOCK_FILE);
  fs.writeFileSync(lockPath, 'not valid json');

  const originalReadFileSync = fs.readFileSync;
  const originalLinkSync = fs.linkSync;
  fs.readFileSync = function patchedRead(target, ...rest) {
    if (target === lockPath) return 'still not valid json';
    return originalReadFileSync.call(fs, target, ...rest);
  };
  fs.linkSync = function patchedLink(existingPath, newPath, ...rest) {
    if (newPath === lockPath) {
      const err = new Error('EEXIST: file already exists, link');
      err.code = 'EEXIST';
      throw err;
    }
    return originalLinkSync.call(fs, existingPath, newPath, ...rest);
  };

  try {
    assert.throws(
      () => claimWork(dir, { id: 'item-a', actor: 'session', isolate: false, repoRoot }),
      (err) => {
        assert.ok(err instanceof ClaimError);
        assert.equal(err.code, 'lock-ambiguous');
        assert.equal(err.category, 'lock-timeout');
        // tsk-6c2: a retry wrapper checking `err.code === 'lock-held'` must
        // never mistake this for a retryable state.
        assert.equal(err.remainingTtlMs, undefined);
        return true;
      },
    );
  } finally {
    fs.readFileSync = originalReadFileSync;
    fs.linkSync = originalLinkSync;
  }
});

// tsk-2zv: a claim-lock §3b release (decompose.mjs's releaseClaimOnExecuting)
// is the SAME execution round split by a mechanical stage edge — commits
// made before the release (CONTEXT.md, plan.md, or code) must still count
// as real progress once the item is reclaimed for `executing`.
test('claimWork on a claim-lock §3b-marked release preserves the ORIGINAL branchHeadAtTake on reclaim, instead of recomputing to the tip that already includes the pre-release commit (tsk-2zv)', () => {
  const { repoRoot, dir } = setup();

  const firstClaim = claimWork(dir, { id: 'item-a', actor: 'session', isolate: true, repoRoot });
  assert.equal(firstClaim.source, 'branch');
  const originalBranchHeadAtTake = firstClaim.branchHeadAtTake;

  // Real work committed ON THE CLAIMED WORKTREE before the release fires —
  // mirrors tsk-424's own repro (CONTEXT.md/plan.md committed during
  // clarify/decompose). The branch is already checked out there by
  // createWorktree, so commit inside it rather than in repoRoot's own
  // checkout (which never touches this branch).
  const worktreePath = firstClaim.worktree.path;
  fs.writeFileSync(path.join(worktreePath, 'context.txt'), 'decisions locked\n');
  execFileSync('git', ['add', '-A'], { cwd: worktreePath });
  execFileSync('git', ['commit', '-q', '-m', 'docs: lock decisions'], { cwd: worktreePath });

  settleClaim(dir, { id: 'item-a', claimId: firstClaim.claimId, finalStatus: 'todo', releaseTrigger: 'claim-lock-3b' });

  const reclaim = claimWork(dir, { id: 'item-a', actor: 'session', isolate: true, repoRoot });

  assert.equal(
    reclaim.branchHeadAtTake,
    originalBranchHeadAtTake,
    'reclaim must preserve the ORIGINAL branchHeadAtTake so return still sees the pre-release commit as real progress',
  );
});

// tsk-2zv D2/D3: a reject (`awaiting-approval -> todo`) lands an item in the exact
// same status+branch-existence shape as a §3b release, but never carries
// the marker — it MUST still recompute fresh, the deliberate anti-cheat
// gate that forces new work before a retaken item can `return` again.
test('claimWork on an UNMARKED todo-with-branch reclaim (e.g. reject) still recomputes branchHeadAtTake fresh, never preserving a stale value (tsk-2zv D3)', () => {
  const { repoRoot, dir } = setup();

  const firstClaim = claimWork(dir, { id: 'item-a', actor: 'session', isolate: true, repoRoot });
  const originalBranchHeadAtTake = firstClaim.branchHeadAtTake;

  const worktreePath = firstClaim.worktree.path;
  fs.writeFileSync(path.join(worktreePath, 'attempt.txt'), 'rejected attempt\n');
  execFileSync('git', ['add', '-A'], { cwd: worktreePath });
  execFileSync('git', ['commit', '-q', '-m', 'attempt later rejected'], { cwd: worktreePath });
  const tipAfterAttempt = execFileSync('git', ['rev-parse', 'fgw/item-a'], { cwd: repoRoot, encoding: 'utf8' }).trim();

  // No releaseTrigger here — an unmarked doing -> todo move, standing in
  // for reject's own awaiting-approval -> todo (same shape: status todo, branch
  // alive, no marker).
  settleClaim(dir, { id: 'item-a', claimId: firstClaim.claimId, finalStatus: 'todo' });

  const reclaim = claimWork(dir, { id: 'item-a', actor: 'session', isolate: true, repoRoot });

  assert.notEqual(reclaim.branchHeadAtTake, originalBranchHeadAtTake, 'must NOT preserve the stale pre-attempt marker');
  assert.equal(reclaim.branchHeadAtTake, tipAfterAttempt, 'must recompute fresh to the live tip, demanding new work before a future return');
});

// wontfix-terminal-status-filter-consistency D1: a leaf's dep at 'wontfix'
// never had content to merge in the first place (abandoned, nothing was
// ever built for it) — the unmergedDeps guard must not treat it as
// "missing" content, the same as it already doesn't for 'done'.
test('claimWork isolates a leaf whose dep is "wontfix" without throwing deps-not-merged (D1: wontfix satisfies the merge-guard, same as done)', () => {
  const repoRoot = initTempRepo();
  const dir = path.join(repoRoot, '.fgos');
  initStore(dir);
  addWork(dir, { id: 'root-x', title: 'Root', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  addWork(dir, { id: 'dep-x', title: 'Dep', kind: 'task', status: 'wontfix', deps: [], risk: 'light', refs: [], verify: 'true' });
  addWork(dir, { id: 'leaf-x', title: 'Leaf', kind: 'task', status: 'todo', deps: ['dep-x'], risk: 'light', refs: [], verify: 'true', parent: 'root-x' });

  const claim = claimWork(dir, { id: 'leaf-x', actor: 'session', isolate: true, repoRoot });

  assert.equal(claim.id, 'leaf-x');
  assert.equal(claim.to, 'doing');
});

test('claimWork still refuses to isolate a leaf whose dep is only "blocked" (D1 does not over-broaden the merge-guard past done/wontfix)', () => {
  const repoRoot = initTempRepo();
  const dir = path.join(repoRoot, '.fgos');
  initStore(dir);
  addWork(dir, { id: 'root-y', title: 'Root', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  addWork(dir, { id: 'dep-y', title: 'Dep', kind: 'task', status: 'blocked', deps: [], risk: 'light', refs: [], verify: 'true' });
  addWork(dir, { id: 'leaf-y', title: 'Leaf', kind: 'task', status: 'todo', deps: ['dep-y'], risk: 'light', refs: [], verify: 'true', parent: 'root-y' });

  assert.throws(
    () => claimWork(dir, { id: 'leaf-y', actor: 'session', isolate: true, repoRoot }),
    (err) => {
      assert.ok(err instanceof ClaimError);
      assert.equal(err.code, 'deps-not-merged');
      return true;
    },
  );
});

// tsk-49a: proves the guarantee this item was filed to check — a runner
// claimItem() call must be rejected while an item sits status:doing under a
// live claimRole:session claim, never allowed to race it into a second
// "doing" write. Both take and the runner's own claimItem funnel through
// THIS SAME claimWork choke point (claim-port.mjs's own module comment), so
// exercising both actors through claimWork directly is a faithful proof of
// the real call sites, not a stand-in for them.
test('claimWork rejects a runner claim on an item already claimed (doing) by a live session claim, and leaves the session claim untouched (tsk-49a)', () => {
  const { repoRoot, dir } = setup();

  const sessionClaim = claimWork(dir, { id: 'item-a', actor: 'session', isolate: false, repoRoot });
  assert.equal(sessionClaim.to, 'doing');

  assert.throws(
    () => claimWork(dir, { id: 'item-a', actor: 'runner', isolate: false, repoRoot }),
    (err) => {
      assert.equal(err.category, 'conflict', 'must be categorized as a conflict so the runner halts gracefully instead of overwriting the live claim');
      return true;
    },
  );

  const afterRejectedClaim = listWork(dir).work['item-a'];
  assert.equal(afterRejectedClaim.status, 'doing', 'the rejected runner claim must not have moved the item off doing');
  assert.equal(afterRejectedClaim.claimRole, 'session', 'the original session claim must survive completely untouched');
  assert.equal(afterRejectedClaim.headAtTake, sessionClaim.headAtTake, 'the session claim\'s own headAtTake must not be overwritten by the rejected runner attempt');
});

// tsk-4m0: a worktreeDir whose parent path segment is a plain FILE, not a
// directory, makes createWorktree's own `fs.mkdirSync(baseDir, {recursive:
// true})` throw ENOTDIR before it ever touches git or an existing checkout
// -- a real, reliable failure trigger for createClaimWorktree, no mocking.
function unusableWorktreeDir() {
  const blockerFile = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-claim-port-blocker-'));
  const filePath = path.join(blockerFile, 'not-a-directory');
  fs.writeFileSync(filePath, 'blocks mkdirSync recursive\n');
  return path.join(filePath, 'nested-worktree-dir');
}

// tsk-4m0: previously, moveWork(to:'doing') committed durably BEFORE
// createClaimWorktree ran, so a worktree-creation failure orphaned the item
// in `doing` with no branch/worktree and no automatic recovery (reproduced
// live on tsk-f31, docs/history/pick-worktree-claim-race/CONTEXT.md D1).
test('claimWork reverts the todo->doing claim back to todo when createClaimWorktree fails, instead of orphaning the item in doing (tsk-4m0 D1)', () => {
  const { repoRoot, dir } = setup();

  assert.throws(
    () => claimWork(dir, { id: 'item-a', actor: 'session', isolate: true, repoRoot, worktreeDir: unusableWorktreeDir() }),
    (err) => {
      assert.equal(err.code, 'ENOTDIR');
      return true;
    },
  );

  const after = listWork(dir).work['item-a'];
  assert.equal(after.status, 'todo', 'a failed worktree creation must leave the item claimable again, not stuck in doing');
});

// tsk-4m0: the branch-take path (blocked item, branch already exists) runs
// through the identical moveWork-before-createClaimWorktree ordering, so it
// needs the identical revert -- back to `blocked`, not `todo`.
test('claimWork reverts a branch-take blocked->doing claim back to blocked when createClaimWorktree fails (tsk-4m0 D1)', () => {
  const { repoRoot, dir } = setup();

  const firstClaim = claimWork(dir, { id: 'item-a', actor: 'session', isolate: true, repoRoot });
  assert.equal(firstClaim.source, 'branch');

  settleClaim(dir, { id: 'item-a', claimId: firstClaim.claimId, finalStatus: 'blocked' });

  assert.throws(
    () => claimWork(dir, { id: 'item-a', actor: 'session', isolate: true, repoRoot, worktreeDir: unusableWorktreeDir() }),
    (err) => {
      assert.equal(err.code, 'ENOTDIR');
      return true;
    },
  );

  const after = listWork(dir).work['item-a'];
  assert.equal(after.status, 'blocked', 'a failed worktree creation on a branch-take must revert back to blocked, not fall through to todo');
});

// D1-D5 (docs/history/session-claim-liveness/CONTEXT.md): the stale-claim
// reclaim pre-check. HUMAN_MS below matches STALE_DOING_DEFAULTS.humanMs
// (graph-metrics.mjs) -- D3 reuses that pair as-is.
const HUMAN_MS = 24 * 60 * 60 * 1000;

test('claimWork transparently reclaims a conclusively-quiet session doing claim via pick, reattaching to the existing branch (D2/D4/D5)', () => {
  const { repoRoot, dir } = setup();

  const first = claimWork(dir, { id: 'item-a', actor: 'session', isolate: true, repoRoot });
  assert.equal(first.source, 'branch');

  const staleSeconds = Math.floor((Date.now() - HUMAN_MS - 1000) / 1000);
  commitAt(first.worktree.path, 'stale.txt', 'stale', staleSeconds);

  const second = claimWork(dir, { id: 'item-a', actor: 'session', isolate: true, repoRoot });
  assert.equal(second.to, 'doing');
  assert.equal(second.source, 'branch');
  assert.equal(second.branch, 'fgw/item-a', 'must reattach to the existing branch, never fork a new one');

  const releaseEvents = readRawEvents(dir).filter(
    (e) => e.type === 'work.move' && e.payload?.id === 'item-a' && e.payload?.from === 'doing' && e.payload?.to === 'todo',
  );
  assert.equal(releaseEvents.length, 0, 'runtime claim release does not write a durable doing->todo event');

  const evidenceDecisions = readRawEvents(dir).filter(
    (e) => e.type === 'decision' && e.payload?.id === 'item-a' && e.payload?.source === 'claimWork' && e.payload?.text?.startsWith('stale-claim-reclaim:'),
  );
  assert.equal(evidenceDecisions.length, 1, 'the release must be logged with its evidence (D2c) — reason itself is not stamped for the doing->todo edge (status-fsm.mjs:216-232)');
});

// tsk-40m code-review finding (high, D4/D8): a stale-claim reclaim used to
// only delete the runtime claim file (releaseClaim) with no durable trace —
// the item read back to effective 'todo', indistinguishable from an item
// that had never been claimed at all. It must now carry a durable
// work.attempt(result:'reclaimed') so attemptCount/lastAttempt can tell
// "started then reclaimed" apart from "never started".
test('a stale-claim reclaim records a durable work.attempt(result:"reclaimed") before releasing, distinguishing "started then reclaimed" from "never started" (tsk-40m)', () => {
  const { repoRoot, dir } = setup();

  const first = claimWork(dir, { id: 'item-a', actor: 'session', isolate: true, repoRoot });
  const staleSeconds = Math.floor((Date.now() - HUMAN_MS - 1000) / 1000);
  commitAt(first.worktree.path, 'stale.txt', 'stale', staleSeconds);

  claimWork(dir, { id: 'item-a', actor: 'session', isolate: true, repoRoot });

  const attempts = readRawEvents(dir).filter((e) => e.type === 'work.attempt' && e.payload?.id === 'item-a');
  assert.equal(attempts.length, 1, 'exactly one work.attempt must be recorded for the reclaimed (first) claim');
  assert.equal(attempts[0].payload.result, 'reclaimed');
  assert.equal(attempts[0].payload.claimId, first.claimId);

  const item = listWork(dir).work['item-a'];
  assert.equal(item.attemptCount, 1, 'attemptCount must reflect the reclaimed attempt — never indistinguishable from a never-started item');
  assert.equal(item.lastAttempt.result, 'reclaimed');
});

// tsk-37t: a repo drifted over its own worker-slot ceiling (occupied >
// ceiling, e.g. the ceiling was lowered or stale claims piled up) used to
// refuse EVERY claim, including a stale-claim reclaim that doesn't add net
// occupancy — the one claim that would actually clear the drift. This
// exercises the real gate end-to-end via claimWork, not just
// hasWorkerSlotRoom in isolation.

test('tsk-37t: a stale-claim reclaim succeeds even when the repo is already drifted past its worker-slot ceiling', () => {
  const { repoRoot, dir } = setup();
  writeSharedConfig(repoRoot, { workerSlots: { ceiling: 1 } });

  // item-a is claimed and its worktree goes conclusively quiet.
  const first = claimWork(dir, { id: 'item-a', actor: 'session', isolate: true, repoRoot });
  const staleSeconds = Math.floor((Date.now() - HUMAN_MS - 1000) / 1000);
  commitAt(first.worktree.path, 'stale.txt', 'stale', staleSeconds);

  // A second, unrelated item is also `doing` -- with ceiling 1, occupied
  // (excluding item-a) is already 1, at/over ceiling before the reclaim.
  addWork(dir, { id: 'item-b', title: 'Item B', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  moveWork(dir, { id: 'item-b', to: 'doing', expectedStatus: 'todo' });

  // Reclaiming item-a must succeed: it was already `doing` (occupying its
  // slot) before this call, and stays `doing` after -- no net new
  // occupancy, so the ceiling has nothing real to refuse.
  const second = claimWork(dir, { id: 'item-a', actor: 'session', isolate: true, repoRoot });
  assert.equal(second.to, 'doing');
  assert.equal(second.branch, 'fgw/item-a');
});

test('tsk-37t: a genuinely NEW claim still refuses when the repo is at ceiling, unchanged (the exemption never widens past reclaims)', () => {
  const { repoRoot, dir } = setup();
  writeSharedConfig(repoRoot, { workerSlots: { ceiling: 1 } });

  addWork(dir, { id: 'item-b', title: 'Item B', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  moveWork(dir, { id: 'item-b', to: 'doing', expectedStatus: 'todo' });

  // item-a (todo, never claimed) is a genuinely NEW claim -- not a reclaim
  // of an already-doing item -- so it must still be refused at ceiling 1.
  assert.throws(
    () => claimWork(dir, { id: 'item-a', actor: 'session', isolate: true, repoRoot }),
    (err) => {
      assert.ok(err instanceof ClaimError);
      assert.equal(err.code, 'worker-slot-ceiling');
      return true;
    },
  );
});

// tsk-2ec regression: the literal shape of the bug report that started this
// item -- a claim with real, recent activity must still refuse exactly as
// today, unconditionally.
test('claimWork still refuses a session doing claim with recent activity, unchanged (tsk-2ec regression)', () => {
  const { repoRoot, dir } = setup();

  claimWork(dir, { id: 'item-a', actor: 'session', isolate: true, repoRoot });

  assert.throws(
    () => claimWork(dir, { id: 'item-a', actor: 'session', isolate: true, repoRoot }),
    (err) => {
      assert.equal(err.category, 'conflict');
      return true;
    },
  );

  const after = listWork(dir).work['item-a'];
  assert.equal(after.status, 'doing', 'the recent, still-live claim must survive completely untouched');
});

test('claimWork pre-check is a no-op for a runner-claimed doing item -- stays startupReap\'s domain alone (D2 scope)', () => {
  const { repoRoot, dir } = setup();

  claimWork(dir, { id: 'item-a', actor: 'runner', isolate: false, repoRoot });

  assert.throws(
    () => claimWork(dir, { id: 'item-a', actor: 'session', isolate: true, repoRoot }),
    (err) => {
      assert.equal(err.category, 'conflict');
      return true;
    },
  );

  const after = listWork(dir).work['item-a'];
  assert.equal(after.claimRole, 'runner', 'a runner claim must never be touched by this pre-check');
});

test('claimWork pre-check never fires for a runner CALLER, even against a conclusively-quiet session claim (validating finding: no back door around startupReap\'s human/session exclusion)', () => {
  const { repoRoot, dir } = setup();

  const first = claimWork(dir, { id: 'item-a', actor: 'session', isolate: true, repoRoot });
  const staleSeconds = Math.floor((Date.now() - HUMAN_MS - 1000) / 1000);
  commitAt(first.worktree.path, 'stale.txt', 'stale', staleSeconds);

  assert.throws(
    () => claimWork(dir, { id: 'item-a', actor: 'runner', isolate: true, repoRoot }),
    (err) => {
      assert.equal(err.category, 'conflict');
      return true;
    },
  );

  const after = listWork(dir).work['item-a'];
  assert.equal(after.claimRole, 'session', 'the quiet session claim must survive -- a runner caller must never reclaim it, no matter how stale');
});

test('claimWork pre-check never fires for take (isolate:false), even against a conclusively-quiet session claim (implementation finding: take\'s own branch-reuse gap is separately scoped, tsk-65n)', () => {
  const { repoRoot, dir } = setup();

  const first = claimWork(dir, { id: 'item-a', actor: 'session', isolate: true, repoRoot });
  const staleSeconds = Math.floor((Date.now() - HUMAN_MS - 1000) / 1000);
  commitAt(first.worktree.path, 'stale.txt', 'stale', staleSeconds);

  assert.throws(
    () => claimWork(dir, { id: 'item-a', actor: 'session', isolate: false, repoRoot }),
    (err) => {
      assert.equal(err.category, 'conflict');
      return true;
    },
  );

  const after = listWork(dir).work['item-a'];
  assert.equal(after.claimRole, 'session', 'take must never reclaim, even a quiet claim -- pick is the only door (D5 scope narrowing)');
});

test('claimWork invokes runOpportunisticMainCheckoutChecks non-blockingly and succeeds even when truncation guard detects a break', () => {
  delete process.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS;
  const { repoRoot, dir } = setup();
  const guardPath = resolveFgosFile(dir, FGOS_FILE.GUARD_MARK);
  const warnPath = resolveFgosFile(dir, FGOS_FILE.MAIN_CHECKOUT_GUARD_WARNINGS);
  const eventsDir = path.join(dir, 'events');

  // Tầng A/T5: the guard sidecar is now a map keyed by fileKey ("events.jsonl"
  // for baseline-0, "events/<name>" for a per-writer file); setup()'s addWork
  // wrote into a real per-writer file, so seed a deliberately-regressed mark
  // for THAT file -- a real structural break the guard must still catch now
  // that claimWork does its own real multi-file discovery (no more synthetic
  // single-file `rawLog` injection).
  const writerFileName = fs.readdirSync(eventsDir).find((f) => f.endsWith('.jsonl'));
  fs.mkdirSync(path.dirname(guardPath), { recursive: true });
  fs.writeFileSync(guardPath, JSON.stringify({ [`events/${writerFileName}`]: { seq: 9999, hash: 'badhash' } }));

  // claimWork should succeed normally despite truncation break, and write warning
  const res = claimWork(dir, { id: 'item-a', actor: 'session', isolate: false, repoRoot });
  assert.ok(res);
  assert.equal(fs.existsSync(warnPath), true, 'warning file must be created on truncation break during claimWork');
});

