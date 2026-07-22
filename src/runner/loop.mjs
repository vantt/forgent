// loop.mjs — the sequential runner loop (per D2/D3/D4/D5, A1): startup reap
// → frontier → anti-loop gate → claim → isolated worktree → dispatch →
// goal-check → propose/park/halt. One item at a time (A1), FIFO head first
// (A2), and inside the dispatch loop the RUNNER is the only writer through
// the store facade (per D3) — the worker's prompt forbids it from calling
// `fgos`, and nothing here ever trusts the worker's own report: the runner
// re-runs the item's `verify` itself in the worktree (goal-check).
//
// WRITE DISCIPLINE: every state mutation in this module goes through
// store.mjs's moveWork (the single write door) with an explicit
// `expectedStatus` (CAS). A CAS conflict on the runner's OWN write means
// someone else (a human operator, another process) raced it — classified
// `state-conflict`, and per the recovery matrix the runner never fights for
// the write: it cleans up its worktree (the finally below) and halts with
// the conflict exit code. It never overwrites blindly and never retries the
// write.
//
// WORKTREE LIFECYCLE: `removeWorktree` runs in a `finally` around EVERY
// per-item path — propose, retry, park, halt, and any throw — so no exit
// path leaks a checkout. The branch (`fgw/<id>`) always survives teardown:
// it is the durable D1-level proposal artifact (per D4). A retry never
// builds on a previous attempt's debris: each attempt gets a FRESH worktree
// directory checked out at the (reused) branch's current tip, then reset
// --hard to this item's own DISPATCH BASELINE (the branch tip captured on
// this item's first attempt, before any worker of its own ran) — not HEAD,
// which IS the prior attempt's own commit whenever that attempt committed
// before failing verify. The baseline preserves anything legitimately on
// the branch before this item's own dispatch (e.g. an earlier merged leaf,
// D3) while discarding only this item's own failed work.
//
// OUTPUT DISCIPLINE (security panel): worker stdout/stderr and verify
// output are surfaced on the console only (a tail, via `log`) — never
// persisted to any committed path. This module writes no files at all
// outside the store facade's own `.fgos/` writes.
// SUPERSEDED (D1, worker-dispatch-log) — narrowed, not repealed: worker
// stdout/stderr is now ALSO persisted to `.fgos/logs/` (git-ignored, per D4)
// via the sibling worker-log.mjs facade, so an orchestrator can recover what
// a worker did after the console tail scrolls past. The guarantee that
// actually mattered still holds exactly — worker output never lands in a
// committed/git-tracked path. Verify/goal-check output stays console-only
// (out of scope).
// LIVE TEE (P39): each chunk is ALSO persisted the instant it arrives, via
// spawnWorker's onChunk hook -> appendWorkerLogChunk (same sole-writer
// facade), so `tail -f` on a work item's log shows output in real time while
// the worker is still running. The terminal block appended once dispatch
// settles (below) is unchanged.
//
// REPO ROOT: always derived from the caller's cwd (`git rev-parse
// --show-toplevel`), never from this file's own location — the runner
// operates on whatever repo it is invoked in, not on the repo that happens
// to contain its source.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  listWork,
  moveWork,
  addWork,
  readyWork,
  readRawEvents,
  addOutcome,
  addFriction,
  categoryOf,
  EXIT_CODES,
} from '../state/store.mjs';
import { DEFAULTS } from '../state/work.mjs';
import { getDomain, stageForStep } from '../state/workflow-stage-graphs.mjs';
import { resolveAction, resolveStaleDoing } from './recovery.mjs';
import {
  visitCount,
  visitsSinceLastHumanEvent,
  hasExceededMaxVisits,
  createMissBreaker,
  MAX_VISITS,
  BREAKER_MISSES,
} from './anti-loop.mjs';
import { spawnWorker, modelForTier } from './dispatch.mjs';
import { appendWorkerLog, appendWorkerLogChunk } from './worker-log.mjs';
import { createWorktree, removeWorktree, listLeftovers, branchNameFor, createBranchRef } from './worktree.mjs';
import { runGoalCheck } from './goal-check.mjs';
import { createWriteQueue } from './write-queue.mjs';
import { createOwnershipStore, resolveRoot, claimRoot, steerFrontier } from './root-affinity.mjs';
import { resolveDiscovery, FALLBACK_VERIFY } from '../intake/discovery.mjs';
import { resolveDecompose } from '../intake/decompose.mjs';
import { classify, generateId } from '../intake/classify.mjs';

// errorClass -> failure layer: 5-layer self-attribution (task-spec / context /
// environment / verification / state) the runner stamps on every friction
// record at the park/halt choke-point. The mapping is mechanical DATA, not a
// judgment baked into logic — accumulated frictions are exactly the evidence
// compound-learning later uses to recalibrate it (plan.md Slice 2 chi tiết).
// An error class this map does not know falls back to 'task-spec' (the most
// actionable default: re-read what the task asked for).
const FRICTION_LAYER = Object.freeze({
  'verify-miss': 'verification',
  'worker-spawn-fail': 'environment',
  'worker-timeout': 'environment',
  'worktree-fail': 'environment',
  'corrupt-log': 'state',
  'stale-doing': 'state',
  'state-conflict': 'state',
  'reject-returned': 'context',
});

/** Exit code for the `busy` outcome: another live runner already holds the
 * inter-process lock. Deliberately outside the R4 category map — busy is not
 * an error the store classifies, it is a clean "someone else has this repo"
 * result — and distinct from every code already spoken for (0 ok, 1
 * unexpected, 2-5 in store.mjs's EXIT_CODES). */
export const EXIT_BUSY = 6;

export const LOCK_FILE = 'runner.lock';

/** Two-tier parallelism defaults (D10), applied when `.fgos-runner.json`
 * declares no `parallel` block at all — every existing config keeps working
 * with zero changes. `maxRoots` caps concurrent ROOTS in flight; the wave a
 * single poll dispatches is bounded by `maxRoots * maxLeavesPerRoot`, and
 * `min(cap, |ready|)` throughout. */
export const DEFAULT_MAX_ROOTS = 4;
export const DEFAULT_MAX_LEAVES_PER_ROOT = 4;

/** P6 is single-machine (D14): one fixed owner identity for the entire
 * drain-run, threaded through root-affinity's in-memory ownership store. A
 * future P27 multi-machine deploy would pass a real machine/session id here;
 * P6 needs only a constant — root-affinity never interprets it, only compares
 * for equality. */
export const RUNNER_OWNER_IDENTITY = 'local';

function positiveIntOr(value, fallback) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

/** Read the two-tier cap (D10) from the runner config's OPTIONAL `parallel`
 * block, falling back to the in-code defaults when it (or a field) is absent.
 * dispatch.mjs's `loadRunnerConfig` already rejects a malformed block at load
 * time, so this stays lenient: a hand-built test config with no `parallel`
 * key behaves exactly like a real config that omits it. */
function resolveParallel(config) {
  const parallel = config?.parallel;
  return {
    maxRoots: positiveIntOr(parallel?.maxRoots, DEFAULT_MAX_ROOTS),
    maxLeavesPerRoot: positiveIntOr(parallel?.maxLeavesPerRoot, DEFAULT_MAX_LEAVES_PER_ROOT),
  };
}

/** Group the steered ready set by resolved root and take a bounded wave: up
 * to `maxRoots` distinct roots (FIFO), and within each up to
 * `maxLeavesPerRoot` of its ready items (D10). Frontier FIFO order is
 * preserved — `steered` already arrives in frontier order and a `Map` keeps
 * first-insertion root order. */
function selectWave(steered, view, { maxRoots, maxLeavesPerRoot }) {
  const byRoot = new Map();
  for (const item of steered) {
    const root = resolveRoot(view, item.id);
    if (!byRoot.has(root)) byRoot.set(root, []);
    byRoot.get(root).push(item);
  }
  const wave = [];
  let rootsTaken = 0;
  for (const items of byRoot.values()) {
    if (rootsTaken >= maxRoots) break;
    rootsTaken += 1;
    for (const item of items.slice(0, maxLeavesPerRoot)) wave.push(item);
  }
  return wave;
}

/** Signal-0 liveness probe. EPERM means the pid exists but belongs to
 * another user — still very much alive, so still busy. */
function isPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM';
  }
}

/**
 * Take the exclusive inter-process lock: `.fgos/runner.lock`, created with
 * `wx` (atomic fail-if-exists — the one primitive that makes two racing
 * runners impossible on a local fs), holding this process's pid.
 *
 * When the file already exists, the pid inside decides: a live pid means a
 * runner is genuinely working this repo — back off (`acquired: false`,
 * never touch the holder's lock). A dead pid (or unreadable/non-positive
 * content, which no live holder can prove ownership of) is a crash
 * leftover: CLEAN AND YIELD — re-read the file immediately before the
 * unlink (the slow liveness probe sat between the first read and now; if
 * the content changed, a fresh holder took the path and nothing is
 * deleted), remove it, and return busy with `reclaimedStale: true`. The
 * reclaimer NEVER creates its own lock in the same call that deleted one:
 * every acquisition is a bare `wx` create on an empty path, so two
 * processes racing the same stale lock can each at worst clean-and-yield —
 * neither can steal a lock the other just created (delete-then-create in
 * one call was the TOCTOU the review flagged). The next invocation
 * acquires cleanly; under a cron/loop cadence that costs one tick after a
 * crash.
 */
export function acquireRunnerLock(dir, { pid = process.pid } = {}) {
  const lockPath = path.join(dir, LOCK_FILE);
  fs.mkdirSync(dir, { recursive: true });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const fd = fs.openSync(lockPath, 'wx');
      try {
        fs.writeSync(fd, String(pid));
      } finally {
        fs.closeSync(fd);
      }
      return {
        acquired: true,
        lockPath,
        release() {
          try {
            fs.unlinkSync(lockPath);
          } catch (err) {
            if (err.code !== 'ENOENT') throw err;
          }
        },
      };
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }

    let raw;
    try {
      raw = fs.readFileSync(lockPath, 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT') continue; // holder released in between — retry the create
      throw err;
    }
    const holderPid = parseInt(raw.trim(), 10);

    // pid must be a positive integer before probing: kill(0, 0) would probe
    // our own process group and misread garbage content as "alive".
    if (Number.isInteger(holderPid) && holderPid > 0 && isPidAlive(holderPid)) {
      return { acquired: false, holderPid, lockPath };
    }

    // Stale. Re-read right before the delete: the liveness probe above is
    // the slow window — a competitor may have cleaned this lock and a fresh
    // holder created its own here since `raw` was read. Changed content is
    // a live lock we must not touch.
    let current;
    try {
      current = fs.readFileSync(lockPath, 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT') {
        // someone else already cleaned it — same yield, nothing deleted
        return { acquired: false, holderPid: null, reclaimedStale: true, lockPath };
      }
      throw err;
    }
    if (current !== raw) {
      const freshPid = parseInt(current.trim(), 10);
      return { acquired: false, holderPid: Number.isInteger(freshPid) && freshPid > 0 ? freshPid : null, lockPath };
    }

    try {
      fs.unlinkSync(lockPath); // stale — dead holder; clean…
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
    // …and yield: never wx-create on the path this call just deleted.
    return { acquired: false, holderPid: null, reclaimedStale: true, lockPath };
  }

  // Lost the wx create twice in a row: a live contender keeps beating us.
  return { acquired: false, holderPid: null, lockPath };
}

/** Resolve the repo root from `cwd` via git itself (never from __dirname —
 * the runner binary may live in a different repo than the one it runs on).
 * Throws with category 'validation' when `cwd` is not inside a git repo. */
export function resolveRepoRoot(cwd = process.cwd()) {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd,
      encoding: 'utf8',
      shell: false,
    }).trim();
  } catch (err) {
    const error = new Error(`fgos-runner must run inside a git repository (cwd: ${cwd}): ${err.message}`);
    error.category = 'validation';
    throw error;
  }
}

function git(repoRoot, args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', shell: false });
}

/** Branch facts the recovery matrix needs (stale-doing resolution, goal-
 * check's has-a-commit requirement): does `fgw/<id>` exist, and how many
 * commits does it carry beyond its merge-base with HEAD? */
function branchFacts(repoRoot, branch) {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`], {
      cwd: repoRoot,
      encoding: 'utf8',
      shell: false,
    });
  } catch {
    return { exists: false, aheadCount: 0 };
  }
  const mergeBase = git(repoRoot, ['merge-base', 'HEAD', branch]).trim();
  const aheadCount = parseInt(git(repoRoot, ['rev-list', '--count', `${mergeBase}..${branch}`]).trim(), 10) || 0;
  return { exists: true, aheadCount };
}

function tailLines(text, n = 10) {
  const lines = String(text ?? '').trimEnd().split('\n');
  return lines.slice(-n).join('\n');
}

/** Teardown that never masks the real outcome: a failed removal is logged
 * and swallowed (the item's propose/park/halt result must still surface).
 * `force` because a failed worker may leave the checkout dirty. */
function safeRemoveWorktree(repoRoot, worktreePath, log) {
  try {
    removeWorktree(repoRoot, worktreePath, { force: true });
  } catch (err) {
    log(`fgos-runner: worktree cleanup failed for "${worktreePath}": ${err.message}`);
  }
}

/**
 * STARTUP REAP (reliability panel a/e/f): run BEFORE the frontier is even
 * computed, so `--once` is idempotent after a crash.
 *
 * 1. Stale-doing resolution: any item sitting in `doing` (at most one under
 *    A1, but all are handled) has no live worker — the runner that claimed
 *    it is gone. Resolve per `resolveStaleDoing`: a branch carrying a commit
 *    whose verify passes completes the work (`doing -> proposed`); anything
 *    less reclaims it (`doing -> blocked`, reason runner-crash-reclaim).
 *    The verify for the completed case runs in a throwaway worktree of the
 *    item's own branch, torn down in a finally.
 * 2. Orphan pruning: `fgw/*` branches with zero commits beyond their
 *    merge-base with HEAD are worktree debris, deleted outright; branches
 *    carrying real commits are proposals — always kept and reported, never
 *    auto-deleted (per D4).
 *
 * With `dryRun` nothing is written, no worktree is created, no branch is
 * deleted — only the planned resolutions are reported.
 */
export async function startupReap({ repoRoot, dir, worktreeDir, verifyTimeoutMs, log = () => {}, dryRun = false } = {}) {
  const view = listWork(dir);
  const resolutions = [];

  for (const id of Object.keys(view.work)) {
    const item = view.work[id];
    if (item.status !== 'doing') continue;
    // Pull-door claims never expire on their own (stage-decompose S2-pull
    // D1/cell action (4)): a human/session claimant holds `doing`
    // indefinitely — reap only reclaims a claim the RUNNER itself made and
    // then crashed on. `claimActor` is folded onto the item by replay.mjs
    // from the claiming `work.move`'s own `actor` field; a legacy log with
    // no actor at all (or a runner claim, `actor: 'runner'`) is untouched —
    // this is a strict narrowing of what already gets reaped, never a
    // widening.
    if (item.claimActor === 'human' || item.claimActor === 'session') continue;

    const branch = branchNameFor(id);
    const facts = branchFacts(repoRoot, branch);
    const hasCommit = facts.exists && facts.aheadCount > 0;

    if (dryRun) {
      resolutions.push({ id, planned: hasCommit ? 'verify-then-resolve' : 'blocked' });
      continue;
    }

    let verifyPassed = false;
    let worktreeFailed = false;
    if (hasCommit) {
      let wt = null;
      try {
        wt = createWorktree(repoRoot, id, { worktreeDir });
        verifyPassed = (await runGoalCheck(item, wt.path, verifyTimeoutMs)).passed;
      } catch (err) {
        // A worktree-fail here (e.g. this branch is irreconcilably checked
        // out somewhere even after the reclaim in worktree.mjs) must never
        // bubble past this loop and crash the whole reap raw: degrade this
        // one item to a defined, reported state instead (per D5's blocked
        // edge) and let the reap continue with the next stale item.
        if (err?.errorClass === 'worktree-fail') {
          worktreeFailed = true;
          log(`fgos-runner: worktree-fail while reaping stale "doing" item "${id}": ${err.message}`);
        } else {
          throw err;
        }
      } finally {
        if (wt) safeRemoveWorktree(repoRoot, wt.path, log);
      }
    }

    const resolution = worktreeFailed
      ? { to: 'blocked', reason: 'runner-crash-reclaim' }
      : resolveStaleDoing({ hasCommit, verifyPassed });
    moveWork(dir, { id, to: resolution.to, expectedStatus: 'doing', reason: resolution.reason, actor: 'runner' });
    log(`fgos-runner: reaped stale doing "${id}" -> ${resolution.to}${resolution.reason ? ` (${resolution.reason})` : ''}`);
    resolutions.push({ id, to: resolution.to, reason: resolution.reason ?? null });
  }

  const pruned = [];
  const kept = [];
  for (const { branch, aheadCount } of listLeftovers(repoRoot)) {
    if (aheadCount === 0) {
      if (!dryRun) {
        git(repoRoot, ['branch', '-D', branch]);
        log(`fgos-runner: pruned orphan branch ${branch} (no commits)`);
      }
      pruned.push(branch);
    } else {
      log(`fgos-runner: keeping ${branch} (${aheadCount} commit(s) — a proposal, never auto-deleted)`);
      kept.push({ branch, aheadCount });
    }
  }

  return { resolutions, pruned, kept };
}

/**
 * Run one item through the full dispatch loop: claim it (`todo -> doing`,
 * CAS on `todo` — a conflict here means someone raced the runner to it and
 * bubbles up as a state-conflict halt), then dispatch. Per-claim attempt
 * loop: each failure is
 * classified into the recovery matrix's error-class vocabulary and routed
 * through `resolveAction` — retry (fresh worktree, reused branch), park
 * (`doing -> blocked`), or halt. The consecutive-miss breaker only counts
 * goal-check misses (per anti-loop.mjs); when it trips, the item is parked
 * first (never left dangling in `doing`) and the whole run halts.
 *
 * COMPOUND-LEARNING (per Phase 3 D2/D3, plan Approach S1): a `predicted`
 * `work.outcome` is written right after the claim, and an `actual`
 * `work.outcome` is written at exactly the two TERMINAL exits below — the
 * pass return and the park-move block (which covers both `parked` and
 * `halted`, since every failure exit passes through that one `moveWork`
 * first). The non-terminal goal-check miss never gets an `actual` — it may
 * still retry, and recording one there would log a false `passed: false`
 * for an attempt that later succeeds. Both payloads are sourced from the
 * runner's own `runGoalCheck`/`branchFacts`, never the worker's own
 * status/signal (D3) — the worker's report is never trusted on its own.
 */
/**
 * Claim one item as a SINGLE atomic write-queue transaction (D13/D16): read a
 * FRESH view, resolve the item's root, decide ownership, apply the owner set,
 * and move `todo -> doing` — decide-and-apply-and-write all inside the one
 * `enqueue()` body, never on a pre-read snapshot. This is exactly the shape
 * the D13 2-actor race spike proved race-free: computing the decision on a
 * stale snapshot outside the queue reopens the very race the single write-door
 * exists to close.
 *
 * On single-machine P6 (one fixed `ownerIdentity`) the decision is always
 * accepted — `claim` for a root's first leaf, `noop` for a later leaf of an
 * already-owned root. The `reject` branch is real, working code (a different
 * owner already holds the root) but never fires in-process; a rejected item is
 * simply left in the frontier for a later poll rather than dispatched.
 */
async function claimItem({ dir, ownershipStore, queue, ownerIdentity, item }) {
  return queue.enqueue(async () => {
    const freshView = listWork(dir);
    const decision = claimRoot(ownershipStore, freshView, item.id, ownerIdentity);
    if (decision.action === 'claim') ownershipStore.setOwner(decision.root, ownerIdentity);
    if (decision.accepted) {
      moveWork(dir, { id: item.id, to: 'doing', expectedStatus: 'todo', actor: 'runner' });
    }
    return decision;
  });
}

/**
 * Run one ALREADY-CLAIMED item (`doing`) through the dispatch pipeline:
 * predicted outcome, then the per-attempt loop (fresh worktree → async worker
 * → goal-check → propose/park/halt). Every state mutation — the predicted
 * outcome, the propose/park move, the actual outcome, the friction record —
 * goes through the shared write-queue as its OWN atomic transaction, so N of
 * these running concurrently never interleave a raw log write (D16). The
 * worker spawn and goal-check run OUTSIDE the queue: that is where the real
 * parallelism lives (the coordinator stays I/O-light).
 *
 * The consecutive-miss breaker is now keyed per item id (cell
 * fan-out-parallel-5): concurrent items' misses never conflate. COMPOUND-
 * LEARNING payloads are unchanged from the sequential version — predicted at
 * claim, actual at the two terminal exits (pass, and the park/halt block that
 * covers both `parked` and `halted`), sourced from the runner's own
 * goal-check/branchFacts, never the worker's own status/signal (D3).
 *
 * BRANCH TARGETING (cell fan-out-parallel-9, D3/D4/D17): `rootId` is the
 * item's resolved root (`decision.root` from `claimItem`'s
 * `claimRoot`/`resolveRoot` call — threaded down rather than re-read via a
 * second `listWork`, since `claimAndDispatch` already has it). A LEAF
 * (`rootId !== item.id`) first ensures its root's integration branch exists
 * (`createBranchRef`, idempotent — a no-op if an earlier sibling leaf or the
 * root's own prior dispatch already created it) and then forks its OWN
 * worktree from that root branch's current tip, not from `main`. A ROOT or
 * parent-less standalone item (`rootId === item.id`) is unchanged:
 * `createWorktree`'s existing branch-reuse path already forks from
 * `fgw/<item.id>`'s own tip if that branch already exists (e.g. from an
 * earlier merged leaf), and forks fresh from `main`/current HEAD otherwise —
 * byte-for-byte the pre-fan-out-parallel-9 single-item behavior.
 */
// work-graph-intelligence S2b (wgi-8): the worker->runner discovery-report
// channel. The worker (dispatch.mjs prompt) MAY emit fenced ```fgos-discovered
// JSON blocks to surface newly-discovered work — DATA ONLY; it still never
// calls fgos or writes .fgos/ (D3: the runner is the sole writer). This parser
// extracts every well-formed block from a captured worker output string. It is
// FAIL-SAFE by construction: a malformed JSON body, a block missing a non-empty
// `title`, a non-object payload, or absent fences all yield fewer/zero blocks —
// it never throws, so a garbled worker report can never derail a dispatch.
const FGOS_DISCOVERED_FENCE = /```fgos-discovered[^\n]*\n([\s\S]*?)```/g;

export function parseDiscoveredBlocks(output) {
  const blocks = [];
  if (typeof output !== 'string' || !output) return blocks;
  for (const match of output.matchAll(FGOS_DISCOVERED_FENCE)) {
    let parsed;
    try {
      parsed = JSON.parse(match[1]);
    } catch {
      continue; // malformed body — skip this block, keep scanning
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) continue;
    if (typeof parsed.title !== 'string' || !parsed.title.trim()) continue;
    blocks.push({
      title: parsed.title.trim(),
      kind: typeof parsed.kind === 'string' && parsed.kind.trim() ? parsed.kind.trim() : undefined,
      risk: typeof parsed.risk === 'string' && parsed.risk.trim() ? parsed.risk.trim() : undefined,
      description: typeof parsed.description === 'string' ? parsed.description : undefined,
    });
  }
  return blocks;
}

// Per-dispatch ceiling on how many fgos-discovered blocks a single worker
// output can mint into items (review-fix S10, P2 finding): untrusted worker
// stdout could otherwise emit an unbounded run of blocks, each becoming an
// autonomously-dispatched item. The cap never throws and never touches the
// dispatch outcome — it only bounds how many of the parsed blocks are acted
// on; the surplus is logged and dropped.
const DISCOVERY_CAP = 20;
const DISCOVERY_TITLE_LOG_MAX = 120;

// Collapses whitespace/newlines and clamps length so a crafted discovery-block
// title can never forge extra runner log lines (review-fix S11, P3 finding).
// Only the logged copy is normalized — the title stored on the work item via
// addWork is never touched by this.
function sanitizeTitleForLog(title) {
  const collapsed = title.replace(/\s+/g, ' ').trim();
  return collapsed.length > DISCOVERY_TITLE_LOG_MAX
    ? `${collapsed.slice(0, DISCOVERY_TITLE_LOG_MAX)}…`
    : collapsed;
}

// Create a work item for each block the worker reported, RUNNER-side (D3),
// stamping discoveredFrom = the dispatched item's id. Each item is submit-
// shaped: classify()-derived tier/kind/risk (block overrides win), a shared
// clarify-entry verify placeholder (FALLBACK_VERIFY — never a hardcoded
// duplicate), status 'todo', stage 'clarify' (so context-discovery attaches
// the real verify later), deps/refs empty. discoveredFrom is non-blocking
// provenance (excluded from the cycle-check by design). Every write goes
// through queue.enqueue (the serialized write door) — never a raw addWork —
// and generateId is computed INSIDE the serialized callback so back-to-back
// discoveries never collide on an id. The same callback also re-scans the
// current view for a prior item with discoveredFrom === item.id and a
// case/whitespace-insensitive matching title (review-fix S10, P2 finding):
// the same worker output repeating a block, or a re-dispatched item
// re-emitting a block it already captured, is recognized as already-captured
// and skipped rather than minting a second item. The scan runs inside the
// serialized callback so it stays race-free against a concurrent discovery
// in the same dispatch. FAIL-SAFE: parsing and each create are isolated so a
// bad block is logged and skipped, never altering the dispatch outcome or
// control flow.
async function captureDiscoveredWork({ output, item, queue, dir, log }) {
  let blocks;
  try {
    blocks = parseDiscoveredBlocks(output);
  } catch (err) {
    log(`fgos-runner: discovery-report parse failed for "${item.id}" (ignored): ${err.message}`);
    return;
  }
  const capped = blocks.slice(0, DISCOVERY_CAP);
  const surplus = blocks.length - capped.length;
  if (surplus > 0) {
    log(`fgos-runner: discovery-report for "${item.id}" had ${blocks.length} blocks, capped to ${DISCOVERY_CAP} (${surplus} skipped)`);
  }
  for (const block of capped) {
    try {
      await queue.enqueue(async () => {
        const view = listWork(dir).work;
        const normalizedTitle = block.title.trim().toLowerCase();
        const alreadyCaptured = Object.values(view).some(
          (w) => w.discoveredFrom === item.id && w.title.trim().toLowerCase() === normalizedTitle,
        );
        if (alreadyCaptured) {
          log(`fgos-runner: discovery-report for "${item.id}" ("${sanitizeTitleForLog(block.title)}") already captured, skipped (idempotent)`);
          return;
        }
        const id = generateId(block.title, Object.keys(view));
        const derived = classify(block.title);
        addWork(dir, {
          id,
          title: block.title,
          description: block.description,
          kind: block.kind ?? derived.kind,
          status: 'todo',
          deps: [],
          risk: block.risk ?? derived.risk,
          refs: [],
          verify: FALLBACK_VERIFY,
          tier: derived.tier,
          stage: 'clarify',
          discoveredFrom: item.id,
        });
        log(`fgos-runner: discovered work "${id}" from "${item.id}" (runner-created, stage clarify)`);
      });
    } catch (err) {
      log(`fgos-runner: discovery-report create skipped for "${item.id}" ("${sanitizeTitleForLog(block.title)}"): ${err.message}`);
    }
  }
}

async function dispatchClaimedItem({ repoRoot, dir, item, config, worktreeDir, breaker, queue, log, priorVisits, rootId }) {
  log(`fgos-runner: claimed "${item.id}" (todo -> doing)`);
  await queue.enqueue(async () => {
    addOutcome(dir, {
      id: item.id,
      predicted: { tier: item.tier ?? DEFAULTS.tier, deps: item.deps.length, priorVisits },
    });
  });

  let attempt = 0;
  // Captured once, on this item's first attempt: the branch tip BEFORE this
  // item's own worker ever ran (see WORKTREE LIFECYCLE above). Retries reset
  // to this, not HEAD.
  let dispatchBaseline = null;
  // wgi-8: the most recent attempt's captured worker output — set from
  // worker.stdout on the success/verify-miss path and from err.stdout on the
  // dispatch-failure path, so the terminal-outcome capture below parses the
  // discovery report exactly once, whichever way this dispatch ends.
  let lastWorkerOutput = '';

  try {
  while (true) {
    attempt += 1;
    let wt = null;
    let failure = null;

    try {
      if (rootId !== item.id) {
        // Leaf: idempotent — createBranchRef is a no-op if fgw/<rootId>
        // already exists (an earlier sibling leaf, or the root's own prior
        // dispatch, already created it).
        createBranchRef(repoRoot, rootId, { baseRef: 'main' });
        wt = createWorktree(repoRoot, item.id, { worktreeDir, baseRef: branchNameFor(rootId) });
      } else {
        wt = createWorktree(repoRoot, item.id, { worktreeDir });
      }
      if (dispatchBaseline === null) {
        dispatchBaseline = git(repoRoot, ['rev-parse', wt.branch]).trim();
      } else {
        // Retry never builds on debris: the reused branch's HEAD is the
        // prior attempt's OWN commit whenever that attempt committed before
        // failing verify, so `reset --hard HEAD` would be a no-op against
        // it. Reset to this item's own dispatch baseline instead.
        execFileSync('git', ['reset', '--hard', dispatchBaseline], { cwd: wt.path, encoding: 'utf8', shell: false });
        execFileSync('git', ['clean', '-fdq'], { cwd: wt.path, encoding: 'utf8', shell: false });
      }

      // Human feedback rides into the worker prompt (worker-feedback): the
      // clarify answer and the latest reject/park reason are how a reject
      // loop converges — without them the next round re-produces the same
      // rejected proposal. Read fresh: `item` predates this claim's moves.
      const feedbackView = listWork(dir);
      const worker = await spawnWorker(item, config, wt.path, {
        feedback: {
          answer: feedbackView.gates?.[item.id]?.answer,
          reason: feedbackView.work?.[item.id]?.reason,
        },
        // P39: live tee, chunk by chunk, through worker-log.mjs's sole
        // writer — so `tail -f .fgos/logs/<id>.log` shows this worker's
        // output while it is still running. The terminal block below (after
        // spawnWorker resolves) is unchanged.
        onChunk: (stream, chunk) => appendWorkerLogChunk(dir, item.id, chunk),
      });
      lastWorkerOutput = worker.stdout ?? ''; // wgi-8: terminal-outcome discovery source (success/verify-miss)
      log(`fgos-runner: worker for "${item.id}" exited ${worker.status ?? `signal ${worker.signal}`} (tier ${worker.tier} -> ${worker.model})`);
      // Persist the worker's own output for after-the-fact recovery (D1/D3/D4):
      // right after the spawn resolves, before goal-check — so success AND
      // verify-miss are both captured (goal-check runs next).
      appendWorkerLog(dir, item.id, {
        attempt,
        tier: worker.tier,
        model: worker.model,
        templateName: worker.templateName,
        templateHash: worker.templateHash,
        status: worker.status,
        signal: worker.signal,
        stdout: worker.stdout,
        stderr: worker.stderr,
      });

      const check = await runGoalCheck(item, wt.path, config.timeoutMs);
      const facts = branchFacts(repoRoot, wt.branch);

      if (check.passed && facts.aheadCount > 0) {
        breaker.recordHit(item.id);
        await queue.enqueue(async () => {
          moveWork(dir, { id: item.id, to: 'proposed', expectedStatus: 'doing', actor: 'runner' });
        });
        log(`fgos-runner: "${item.id}" proposed on branch ${wt.branch} (${facts.aheadCount} commit(s))`);
        log(`fgos-runner: verify tail:\n${tailLines(check.output)}`);
        const visits = visitCount(readRawEvents(dir), item.id);
        await queue.enqueue(async () => {
          addOutcome(dir, {
            id: item.id,
            actual: {
              outcome: 'proposed',
              passed: true,
              attempts: attempt,
              errorClass: null,
              aheadCount: facts.aheadCount,
              visits,
            },
          });
        });
        return { outcome: 'proposed', id: item.id, branch: wt.branch, attempts: attempt, exitCode: 0 };
      }

      failure = {
        errorClass: 'verify-miss',
        message: check.passed
          ? 'verify passed but the branch carries no commit — the worker must commit its work'
          : `goal-check failed (exit ${check.status})`,
      };
      breaker.recordMiss(item.id);
      log(`fgos-runner: goal-check miss for "${item.id}" (attempt ${attempt}): ${failure.message}`);
      log(`fgos-runner: verify tail:\n${tailLines(check.output)}`);
    } catch (err) {
      if (typeof err?.errorClass === 'string') {
        // DispatchError (worker-spawn-fail / worker-timeout) or WorktreeError
        // (worktree-fail) — recovery-matrix vocabulary, routed below.
        failure = { errorClass: err.errorClass, message: err.message };
        lastWorkerOutput = err.stdout ?? lastWorkerOutput; // wgi-8: a timed-out/failed worker can still have surfaced discoveries
        log(`fgos-runner: ${err.errorClass} for "${item.id}" (attempt ${attempt}): ${err.message}`);
        // Persist the failing outcome (D1/D3/D4). DispatchError carries the
        // buffered stdout/stderr (cell worker-dispatch-log-1); WorktreeError
        // has no tier/model/stdout/stderr — appendWorkerLog degrades to
        // errorClass+message only, never throwing on the missing fields.
        appendWorkerLog(dir, item.id, {
          attempt,
          errorClass: err.errorClass,
          message: err.message,
          tier: err.tier,
          model: err.model,
          templateName: err.templateName,
          templateHash: err.templateHash,
          status: err.status,
          signal: err.signal,
          stdout: err.stdout,
          stderr: err.stderr,
        });
      } else {
        // Store/CAS/config errors bubble to claimAndDispatch's classifier —
        // the finally below still removes the worktree on this path too.
        throw err;
      }
    } finally {
      if (wt) safeRemoveWorktree(repoRoot, wt.path, log);
    }

    const decision = resolveAction(failure.errorClass, attempt);
    const tripped = breaker.isTripped(item.id);

    if (decision.action === 'retry' && !tripped) {
      log(`fgos-runner: retrying "${item.id}" (attempt ${attempt + 1}, fresh worktree, branch reused)`);
      continue;
    }

    // Park before any halt so the item never dangles in `doing`. The FSM
    // records the edge itself; the reason lives in the runner's report (the
    // doing -> blocked edge carries no reason payload by design).
    await queue.enqueue(async () => {
      moveWork(dir, {
        id: item.id,
        to: 'blocked',
        expectedStatus: 'doing',
        reason: tripped ? 'breaker-tripped' : failure.errorClass,
        actor: 'runner',
      });
    });

    // Single ACTUAL emission covering BOTH `parked` and `halted` (every
    // failure exit below already passed through the moveWork above) — per
    // D3, sourced from the runner's own branchFacts, not the worker's
    // status/signal.
    const aheadCount = branchFacts(repoRoot, branchNameFor(item.id)).aheadCount;
    const visits = visitCount(readRawEvents(dir), item.id);
    await queue.enqueue(async () => {
      addOutcome(dir, {
        id: item.id,
        actual: {
          outcome: tripped || decision.action === 'halt' ? 'halted' : 'parked',
          passed: false,
          attempts: attempt,
          errorClass: failure.errorClass,
          aheadCount,
          visits,
        },
      });
    });

    // Friction channel — kênh 2 của capture 2 kênh (Phase 3 Slice 2 /
    // lifecycle-vision §8): the runner blames ITSELF at the same choke-point,
    // one record per final failure exit, attributed to a failure layer via
    // FRICTION_LAYER below. Emitted alongside (never instead of) the actual
    // outcome half: outcome carries the numbers the predicted-half is scored
    // against; friction carries the attribution compound-learning mines.
    await queue.enqueue(async () => {
      addFriction(dir, {
        id: item.id,
        disposition: tripped || decision.action === 'halt' ? 'halted' : 'parked',
        errorClass: failure.errorClass,
        layer: FRICTION_LAYER[failure.errorClass] ?? 'task-spec',
        attempts: attempt,
        detail: failure.message,
      });
    });

    // Reachable only when the caller passes an explicit lower
    // `breakerThreshold` (see createMissBreaker's doc comment in
    // anti-loop.mjs) — under shipped defaults this branch is dead because
    // DEFAULT_MAX_RETRIES caps an item's own attempts below BREAKER_MISSES.
    if (tripped) {
      log(`fgos-runner: halting — consecutive-miss breaker tripped (${breaker.consecutiveMissesFor(item.id)} miss(es)); "${item.id}" parked`);
      return { outcome: 'halted', reason: 'breaker-tripped', id: item.id, errorClass: failure.errorClass, attempts: attempt, exitCode: 1 };
    }
    if (decision.action === 'halt') {
      log(`fgos-runner: halting on ${failure.errorClass} for "${item.id}"`);
      return { outcome: 'halted', errorClass: failure.errorClass, id: item.id, attempts: attempt, exitCode: 1 };
    }

    log(`fgos-runner: parked "${item.id}" (${failure.errorClass}, ${attempt} attempt(s))`);
    return { outcome: 'parked', id: item.id, errorClass: failure.errorClass, attempts: attempt, exitCode: 0 };
  }
  } finally {
    // wgi-8: ONE discovery capture per dispatch, at the terminal attempt's
    // outcome. It runs before the proposed/parked/halted return (or a bubbled
    // store error) — never on a retry `continue` (those never leave the loop),
    // so a re-emitted block can never mint duplicate items across retries.
    // captureDiscoveredWork is fail-safe and never throws, so it cannot mask a
    // real error propagating out of the loop.
    await captureDiscoveredWork({ output: lastWorkerOutput, item, queue, dir, log });
  }
}

/**
 * Claim then dispatch one item, mapping a store/CAS failure to a defined
 * halted result exactly as the sequential runOnce's own catch used to (a
 * `conflict` -> `state-conflict`, exit 3; other classified store categories
 * to their own code). A genuinely unexpected (uncategorized) error is
 * re-thrown so it surfaces as a rejected wave result and, through runOnce's
 * outer catch, exits 1 like a real bug always did. `priorVisits` is read
 * before the claim's own `doing` move, matching the sequential predicted
 * payload.
 */
async function claimAndDispatch(ctx) {
  const { dir, item, log } = ctx;
  const priorVisits = visitCount(readRawEvents(dir), item.id);
  try {
    const decision = await claimItem(ctx);
    if (!decision.accepted) {
      log(`fgos-runner: claim for "${item.id}" rejected — root held by "${decision.currentOwner}"; left for a later poll`);
      return { outcome: 'claim-rejected', id: item.id, currentOwner: decision.currentOwner, exitCode: 0 };
    }
    return await dispatchClaimedItem({ ...ctx, priorVisits, rootId: decision.root });
  } catch (err) {
    const category = categoryOf(err);
    const exitCode = EXIT_CODES[category];
    if (exitCode === undefined) throw err; // a real bug — surfaces via runOnce's outer catch (exit 1)
    const errorClass = category === 'conflict' ? 'state-conflict' : category;
    log(`fgos-runner: halting (${errorClass}): ${err.message}`);
    return { outcome: 'halted', errorClass, id: item.id, message: err.message, exitCode };
  }
}

/**
 * One bounded DRAIN-RUN (D10/D13/D14/D15): reap, sweep, then poll the FULL
 * ready set, steer it through root-affinity (D13), and dispatch a bounded
 * wave — up to `maxRoots × maxLeavesPerRoot` items (D10) — CONCURRENTLY. Each
 * wave is awaited to settle, then the frontier is re-polled and the run
 * refills up to the caps until nothing is in-flight AND the frontier is empty
 * (D15's poll-on-completion, FIFO-by-seq, bounded terminating drain — not
 * P8's persistent signal-driven reactor). One in-memory ownership store and
 * one write-queue are created here per invocation and threaded through the
 * whole drain-run (D16's in-process write-door); the store is never persisted.
 *
 * RETURN SHAPE (changed from the sequential single-item version): a real
 * dispatch run returns `{ outcome: 'drained', dispatched: [...perItem],
 * parked: [...anti-loop], reap, exitCode }`. `busy` (lock contention) and
 * `idle` (nothing to drain) and `dry-run` keep their existing top-level
 * shapes — they are pre-dispatch short-circuits with nothing to drain.
 * `exitCode` follows the same contract: 0 normally, 1 on a halt, the store
 * category code (e.g. 3 for a state-conflict) when a halt came from a CAS
 * failure. An item that trips max-visits is still parked via `todo -> blocked`
 * (per D5) and reported in `parked`; a per-item halt stops further refills.
 */
export async function runOnce(options = {}) {
  const log = options.log ?? ((...args) => console.log(...args));
  const dryRun = options.dryRun ?? false;
  const repoRoot = options.repoRoot ?? resolveRepoRoot(options.cwd ?? process.cwd());
  const dir = options.dir ?? path.join(repoRoot, '.fgos');
  const config = options.config;
  const worktreeDir = options.worktreeDir;
  const maxVisits = options.maxVisits ?? MAX_VISITS;
  const breaker = options.breaker ?? createMissBreaker(options.breakerThreshold ?? BREAKER_MISSES);
  const parked = [];

  // Inter-process exclusivity BEFORE any store write or worktree op — the
  // startup reap itself mutates state, so even it must not run concurrently.
  // A busy result touches nothing: no reap, no claim, and never the live
  // holder's lock file.
  const lock = acquireRunnerLock(dir);
  if (!lock.acquired) {
    log(lock.reclaimedStale
      ? `fgos-runner: busy — stale lock at ${lock.lockPath} cleaned (dead holder); run again to acquire`
      : `fgos-runner: busy — another runner${lock.holderPid ? ` (pid ${lock.holderPid})` : ''} holds ${lock.lockPath}`);
    return { outcome: 'busy', holderPid: lock.holderPid, reclaimedStale: lock.reclaimedStale ?? false, parked, exitCode: EXIT_BUSY };
  }

  try {
    const reap = await startupReap({ repoRoot, dir, worktreeDir, verifyTimeoutMs: config?.timeoutMs, log, dryRun });

    // CLARIFY SWEEP (D13): the safety net for context-discovery. Before any
    // executing item is dispatched, resolve every clarify+todo item —
    // regardless of its `mode` (mode is a calling-convention signal about who
    // is expected to run `discover` first, never a runtime branch, D5). Only
    // `todo` is touched: an item already in `awaiting-human` is waiting on a
    // person and must never be swept again (R15). No sweep under dry-run —
    // resolveDiscovery calls the model and writes state. A clear verdict now
    // lands the item on stage `decompose` (stage-decompose D2 retarget), not
    // `executing` — the DECOMPOSE SWEEP right below is what carries it the
    // rest of the way.
    if (!dryRun) {
      // Domain-aware per base-workflow-model D2/D3: each item's own domain
      // (lazily read, absent -> 'coding') decides which stage name means
      // "at the Clarify step" / "at the Divide step" — 'clarify'/'decompose'
      // for the 'coding' domain, byte-for-byte the literal checks this sweep
      // used before the retrofit. An unrecognized item.domain never throws
      // here (domains.mjs's fail-safe) — it folds to 'coding' with a
      // diagnostic log line instead, so a corrupt/rolled-back domain value
      // can never wedge the sweep.
      for (const item of Object.values(listWork(dir).work)) {
        const domain = getDomain(item.domain, {
          onUnrecognized: (bad) =>
            log(`fgos-runner: work "${item.id}" has unrecognized domain "${bad}" — folding to "coding".`),
        });
        const clarifyStage = stageForStep(domain, 'Clarify');
        if (clarifyStage !== undefined && item.stage === clarifyStage && item.status === 'todo') {
          resolveDiscovery(dir, item.id, config, 'runner');
          log(`fgos-runner: context-discovery swept clarify item "${item.id}"`);
        }
      }

      // DECOMPOSE SWEEP (stage-decompose D2/D4, mirrors the clarify sweep
      // above one stage over): re-reads the view FRESH rather than reusing
      // the clarify sweep's snapshot, so an item the clarify sweep just
      // moved into `decompose` this same tick is swept in the same `--once`
      // pass too (the chain must not wait a full extra tick to continue).
      // Only `todo` is touched, same R15 rule as the clarify sweep — an item
      // already parked in `awaiting-human` (D3's need-human/risk-heavy gate)
      // is never re-swept.
      for (const item of Object.values(listWork(dir).work)) {
        const domain = getDomain(item.domain, {
          onUnrecognized: (bad) =>
            log(`fgos-runner: work "${item.id}" has unrecognized domain "${bad}" — folding to "coding".`),
        });
        const decomposeStage = stageForStep(domain, 'Divide');
        if (decomposeStage !== undefined && item.stage === decomposeStage && item.status === 'todo') {
          resolveDecompose(dir, item.id, config, 'runner');
          log(`fgos-runner: chia-việc swept decompose item "${item.id}"`);
        }
      }
    }

    // DRY-RUN preview keeps the sequential contract exactly: a preview reports
    // just the FIRST planned item (or the first anti-loop park), never the real
    // batch — dry-run's job is a preview, not the drain (cell action (6)).
    if (dryRun) {
      const frontierItems = readyWork(dir);
      if (frontierItems.length === 0) {
        log('fgos-runner: frontier empty — nothing to do.');
        return { outcome: 'idle', reap, parked, dispatched: [], exitCode: 0 };
      }
      const item = frontierItems[0];
      // Gate on the human-rounds D1 budget (resets on the item's own last
      // human answer/reject-with-reason), not the lifetime visitCount above
      // — see anti-loop.mjs's visitsSinceLastHumanEvent.
      const visits = visitsSinceLastHumanEvent(readRawEvents(dir), item.id);
      if (hasExceededMaxVisits(visits, maxVisits)) {
        return { outcome: 'dry-run', plan: { park: item.id, reason: 'anti-loop-max-visits', visits }, reap, parked, exitCode: 0 };
      }
      const tier = item.tier ?? DEFAULTS.tier;
      const plan = {
        dispatch: item.id,
        tier,
        model: modelForTier(config, tier),
        branch: branchNameFor(item.id),
        verify: item.verify,
        visits,
      };
      log(`fgos-runner: dry-run — would dispatch "${item.id}" (tier ${plan.tier} -> ${plan.model}) on ${plan.branch}`);
      return { outcome: 'dry-run', plan, reap, parked, exitCode: 0 };
    }

    // DRAIN RUN. One ownership store + one write-queue for the whole run
    // (D13/D16). Each wave is awaited to full settlement before the next poll,
    // so "in-flight" is 0 at every poll boundary and the exit condition
    // reduces to "no dispatchable wave remains" (D15).
    const ownershipStore = createOwnershipStore();
    const queue = options.queue ?? createWriteQueue();
    const ownerIdentity = options.ownerIdentity ?? RUNNER_OWNER_IDENTITY;
    const parallel = resolveParallel(config);
    const dispatched = [];
    let haltExitCode = null;

    while (true) {
      const frontierItems = readyWork(dir);

      // Anti-loop max-visits parks every over-limit item (they genuinely
      // leave the frontier via `todo -> blocked`, per D5), then re-polls —
      // exactly the sequential loop's per-head guard, applied to the whole
      // ready set before steering. Gated on the human-rounds D1 budget
      // (visitsSinceLastHumanEvent), not the lifetime visitCount — a human's
      // answer or reject-with-reason resets an item's own budget, per-item.
      const overLimit = frontierItems.filter(
        (it) => hasExceededMaxVisits(visitsSinceLastHumanEvent(readRawEvents(dir), it.id), maxVisits),
      );
      if (overLimit.length > 0) {
        for (const it of overLimit) {
          const visits = visitsSinceLastHumanEvent(readRawEvents(dir), it.id);
          await queue.enqueue(async () => {
            moveWork(dir, { id: it.id, to: 'blocked', expectedStatus: 'todo', reason: 'anti-loop-max-visits', actor: 'runner' });
          });
          log(`fgos-runner: parked "${it.id}" — anti-loop max-visits (${visits}/${maxVisits})`);
          parked.push({ id: it.id, reason: 'anti-loop-max-visits', visits });
        }
        continue; // the parked items left the frontier; re-poll
      }

      const view = listWork(dir);
      const steered = steerFrontier(frontierItems, view, ownershipStore, ownerIdentity);
      const wave = selectWave(steered, view, parallel);
      if (wave.length === 0) break; // nothing dispatchable — drain complete

      const ctxBase = { repoRoot, dir, config, worktreeDir, breaker, queue, log, ownershipStore, ownerIdentity };
      const settled = await Promise.allSettled(wave.map((item) => claimAndDispatch({ ...ctxBase, item })));

      let progressed = false;
      for (const s of settled) {
        if (s.status === 'rejected') throw s.reason; // uncategorized real bug -> outer catch (exit 1)
        const r = s.value;
        if (r.outcome === 'claim-rejected') continue; // never dispatched; left for a later poll
        progressed = true;
        dispatched.push(r);
        if (r.outcome === 'halted') haltExitCode = r.exitCode;
      }

      if (haltExitCode !== null) break; // a halt stops the whole drain-run
      if (!progressed) break; // an all-rejected wave made no progress — never spin
    }

    if (dispatched.length === 0) {
      log('fgos-runner: frontier empty — nothing to do.');
      return { outcome: 'idle', reap, parked, dispatched, exitCode: 0 };
    }
    return { outcome: 'drained', dispatched, parked, reap, exitCode: haltExitCode ?? 0 };
  } catch (err) {
    const category = categoryOf(err);
    const exitCode = EXIT_CODES[category];
    if (exitCode === undefined) throw err; // a real bug — the caller exits 1
    const errorClass = category === 'conflict' ? 'state-conflict' : category;
    log(`fgos-runner: halting (${errorClass}): ${err.message}`);
    return { outcome: 'halted', errorClass, message: err.message, parked, exitCode };
  } finally {
    lock.release();
  }
}
