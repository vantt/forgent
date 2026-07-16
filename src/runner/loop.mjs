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
// directory checked out at the (reused) branch's head, plus an explicit
// `reset --hard`/`clean -fd` belt-and-braces before re-spawn.
//
// OUTPUT DISCIPLINE (security panel): worker stdout/stderr and verify
// output are surfaced on the console only (a tail, via `log`) — never
// persisted to any committed path. This module writes no files at all
// outside the store facade's own `.fgos/` writes.
//
// REPO ROOT: always derived from the caller's cwd (`git rev-parse
// --show-toplevel`), never from this file's own location — the runner
// operates on whatever repo it is invoked in, not on the repo that happens
// to contain its source.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  listWork,
  moveWork,
  readyWork,
  readRawEvents,
  addOutcome,
  addFriction,
  categoryOf,
  EXIT_CODES,
} from '../state/store.mjs';
import { DEFAULTS } from '../state/work.mjs';
import { resolveAction, resolveStaleDoing } from './recovery.mjs';
import {
  visitCount,
  hasExceededMaxVisits,
  createMissBreaker,
  MAX_VISITS,
  BREAKER_MISSES,
} from './anti-loop.mjs';
import { spawnWorker, modelForTier } from './dispatch.mjs';
import { createWorktree, removeWorktree, listLeftovers, branchNameFor } from './worktree.mjs';
import { resolveDiscovery } from '../intake/discovery.mjs';
import { resolveDecompose } from '../intake/decompose.mjs';

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

/** Goal-check (per D3): the RUNNER runs the item's own `verify` — the
 * literal command string, via a shell, in the worktree checkout — and only
 * its exit status decides. The worker's exit code/report is never trusted. */
function runGoalCheck(item, cwd, timeoutMs) {
  const result = spawnSync(item.verify, {
    shell: true,
    cwd,
    encoding: 'utf8',
    timeout: timeoutMs,
    maxBuffer: 10 * 1024 * 1024,
  });
  return {
    passed: result.status === 0,
    status: result.status,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
  };
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
export function startupReap({ repoRoot, dir, worktreeDir, verifyTimeoutMs, log = () => {}, dryRun = false } = {}) {
  const view = listWork(dir);
  const resolutions = [];

  for (const id of Object.keys(view.work)) {
    const item = view.work[id];
    if (item.status !== 'doing') continue;

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
        verifyPassed = runGoalCheck(item, wt.path, verifyTimeoutMs).passed;
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
function processItem({ repoRoot, dir, item, config, worktreeDir, breaker, log, priorVisits }) {
  moveWork(dir, { id: item.id, to: 'doing', expectedStatus: 'todo', actor: 'runner' });
  log(`fgos-runner: claimed "${item.id}" (todo -> doing)`);
  addOutcome(dir, {
    id: item.id,
    predicted: { tier: item.tier ?? DEFAULTS.tier, deps: item.deps.length, priorVisits },
  });

  let attempt = 0;

  while (true) {
    attempt += 1;
    let wt = null;
    let failure = null;

    try {
      wt = createWorktree(repoRoot, item.id, { worktreeDir });
      if (attempt > 1) {
        // Retry never builds on debris: the fresh checkout is already at the
        // reused branch's head, and this reset/clean makes that explicit.
        execFileSync('git', ['reset', '--hard', 'HEAD'], { cwd: wt.path, encoding: 'utf8', shell: false });
        execFileSync('git', ['clean', '-fdq'], { cwd: wt.path, encoding: 'utf8', shell: false });
      }

      const worker = spawnWorker(item, config, wt.path);
      log(`fgos-runner: worker for "${item.id}" exited ${worker.status ?? `signal ${worker.signal}`} (tier ${worker.tier} -> ${worker.model})`);

      const check = runGoalCheck(item, wt.path, config.timeoutMs);
      const facts = branchFacts(repoRoot, wt.branch);

      if (check.passed && facts.aheadCount > 0) {
        breaker.recordHit();
        moveWork(dir, { id: item.id, to: 'proposed', expectedStatus: 'doing', actor: 'runner' });
        log(`fgos-runner: "${item.id}" proposed on branch ${wt.branch} (${facts.aheadCount} commit(s))`);
        log(`fgos-runner: verify tail:\n${tailLines(check.output)}`);
        addOutcome(dir, {
          id: item.id,
          actual: {
            outcome: 'proposed',
            passed: true,
            attempts: attempt,
            errorClass: null,
            aheadCount: facts.aheadCount,
            visits: visitCount(readRawEvents(dir), item.id),
          },
        });
        return { outcome: 'proposed', id: item.id, branch: wt.branch, attempts: attempt, exitCode: 0 };
      }

      failure = {
        errorClass: 'verify-miss',
        message: check.passed
          ? 'verify passed but the branch carries no commit — the worker must commit its work'
          : `goal-check failed (exit ${check.status})`,
      };
      breaker.recordMiss();
      log(`fgos-runner: goal-check miss for "${item.id}" (attempt ${attempt}): ${failure.message}`);
      log(`fgos-runner: verify tail:\n${tailLines(check.output)}`);
    } catch (err) {
      if (typeof err?.errorClass === 'string') {
        // DispatchError (worker-spawn-fail / worker-timeout) or WorktreeError
        // (worktree-fail) — recovery-matrix vocabulary, routed below.
        failure = { errorClass: err.errorClass, message: err.message };
        log(`fgos-runner: ${err.errorClass} for "${item.id}" (attempt ${attempt}): ${err.message}`);
      } else {
        // Store/CAS/config errors bubble to runOnce's classifier — the
        // finally below still removes the worktree on this path too.
        throw err;
      }
    } finally {
      if (wt) safeRemoveWorktree(repoRoot, wt.path, log);
    }

    const decision = resolveAction(failure.errorClass, attempt);
    const tripped = breaker.isTripped();

    if (decision.action === 'retry' && !tripped) {
      log(`fgos-runner: retrying "${item.id}" (attempt ${attempt + 1}, fresh worktree, branch reused)`);
      continue;
    }

    // Park before any halt so the item never dangles in `doing`. The FSM
    // records the edge itself; the reason lives in the runner's report (the
    // doing -> blocked edge carries no reason payload by design).
    moveWork(dir, {
      id: item.id,
      to: 'blocked',
      expectedStatus: 'doing',
      reason: tripped ? 'breaker-tripped' : failure.errorClass,
      actor: 'runner',
    });

    // Single ACTUAL emission covering BOTH `parked` and `halted` (every
    // failure exit below already passed through the moveWork above) — per
    // D3, sourced from the runner's own branchFacts, not the worker's
    // status/signal.
    addOutcome(dir, {
      id: item.id,
      actual: {
        outcome: tripped || decision.action === 'halt' ? 'halted' : 'parked',
        passed: false,
        attempts: attempt,
        errorClass: failure.errorClass,
        aheadCount: branchFacts(repoRoot, branchNameFor(item.id)).aheadCount,
        visits: visitCount(readRawEvents(dir), item.id),
      },
    });

    // Friction channel — kênh 2 của capture 2 kênh (Phase 3 Slice 2 /
    // lifecycle-vision §8): the runner blames ITSELF at the same choke-point,
    // one record per final failure exit, attributed to a failure layer via
    // FRICTION_LAYER below. Emitted alongside (never instead of) the actual
    // outcome half: outcome carries the numbers the predicted-half is scored
    // against; friction carries the attribution compound-learning mines.
    addFriction(dir, {
      id: item.id,
      disposition: tripped || decision.action === 'halt' ? 'halted' : 'parked',
      errorClass: failure.errorClass,
      layer: FRICTION_LAYER[failure.errorClass] ?? 'task-spec',
      attempts: attempt,
      detail: failure.message,
    });

    if (tripped) {
      log(`fgos-runner: halting — consecutive-miss breaker tripped (${breaker.consecutiveMisses} miss(es)); "${item.id}" parked`);
      return { outcome: 'halted', reason: 'breaker-tripped', id: item.id, errorClass: failure.errorClass, attempts: attempt, exitCode: 1 };
    }
    if (decision.action === 'halt') {
      log(`fgos-runner: halting on ${failure.errorClass} for "${item.id}"`);
      return { outcome: 'halted', errorClass: failure.errorClass, id: item.id, attempts: attempt, exitCode: 1 };
    }

    log(`fgos-runner: parked "${item.id}" (${failure.errorClass}, ${attempt} attempt(s))`);
    return { outcome: 'parked', id: item.id, errorClass: failure.errorClass, attempts: attempt, exitCode: 0 };
  }
}

/**
 * One sequential pass (per A1 — `--once` is Phase 2's only mode): reap,
 * then take the frontier head (FIFO per A2), gate it through anti-loop, and
 * run it to proposed/parked/halted. An item that trips max-visits is parked
 * via the existing `todo -> blocked` edge (per D5) — it genuinely leaves
 * the frontier, so the loop moves on to the next head instead of hovering.
 *
 * Returns a result object; never throws for a classified halt (the caller
 * maps `exitCode` straight to the process exit).
 */
export function runOnce(options = {}) {
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
    const reap = startupReap({ repoRoot, dir, worktreeDir, verifyTimeoutMs: config?.timeoutMs, log, dryRun });

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
      for (const item of Object.values(listWork(dir).work)) {
        if (item.stage === 'clarify' && item.status === 'todo') {
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
        if (item.stage === 'decompose' && item.status === 'todo') {
          resolveDecompose(dir, item.id, config, 'runner');
          log(`fgos-runner: chia-việc swept decompose item "${item.id}"`);
        }
      }
    }

    while (true) {
      const frontierItems = readyWork(dir);
      if (frontierItems.length === 0) {
        log('fgos-runner: frontier empty — nothing to do.');
        return { outcome: 'idle', reap, parked, exitCode: 0 };
      }

      const item = frontierItems[0];
      const visits = visitCount(readRawEvents(dir), item.id);

      if (hasExceededMaxVisits(visits, maxVisits)) {
        if (dryRun) {
          return {
            outcome: 'dry-run',
            plan: { park: item.id, reason: 'anti-loop-max-visits', visits },
            reap,
            parked,
            exitCode: 0,
          };
        }
        moveWork(dir, { id: item.id, to: 'blocked', expectedStatus: 'todo', reason: 'anti-loop-max-visits', actor: 'runner' });
        log(`fgos-runner: parked "${item.id}" — anti-loop max-visits (${visits}/${maxVisits})`);
        parked.push({ id: item.id, reason: 'anti-loop-max-visits', visits });
        continue; // the parked item left the frontier; take the next head
      }

      if (dryRun) {
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

      const result = processItem({ repoRoot, dir, item, config, worktreeDir, breaker, log, priorVisits: visits });
      return { ...result, reap, parked };
    }
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
