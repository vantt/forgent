// claim-port.mjs — single choke-point for all claim flows (tsk-53f D1).
//
// Every claim (CLI take, CLI pick, runner claimItem) goes through this module.
// Centralizes: main-checkout-lock acquire/release, moveWork to 'doing',
// optional worktree creation with correct baseRef for leaf items.
//
// This is the "one door" for claiming work — no direct moveWork(to:'doing')
// calls outside this module except for FSM-internal transitions.

import { moveWork, addOutcome, addDecision, recordClaimAttempt, readRawEvents, FsmError } from '../state/store.mjs';
import { foldEvents } from '../state/replay.mjs';
import { isResolvedStatus, resolveRoot } from '../state/frontier.mjs';
import { getDomain, stageForStep } from '../state/workflow-stage-graphs.mjs';
import { visitCount } from './anti-loop.mjs';
import { acquireMainCheckoutLock, forceReclaimAmbiguousLock, HELD, AMBIGUOUS, DEFAULT_TTL_MS, formatLockDurationMs, HOLDER_PID_ENV_VAR } from './main-checkout-lock.mjs';
import { createClaimWorktree, branchNameFor, branchExists } from './worktree.mjs';
import { lastActivityAt, isReclaimEligible } from './claim-liveness.mjs';
import { hasWorkerSlotRoom } from '../state/worker-slots.mjs';
import { readSharedConfigOrEmpty } from '../config/shared-config-file.mjs';
import { runOpportunisticMainCheckoutChecks } from '../state/events-jsonl-truncation-guard.mjs';
import { acquireClaim, releaseClaim, readClaims, readClaim, buildEffectiveView, getItemDurableRevision } from '../state/runtime-coordination.mjs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function git(repoRoot, args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', shell: false });
}

function currentHead(repoRoot) {
  return git(repoRoot, ['rev-parse', 'HEAD']).trim();
}

function gitAt(repoRoot, args) {
  return git(repoRoot, args);
}
import { DEFAULTS } from '../state/work.mjs';

/**
 * Read `releaseTrigger` off the MOST RECENT `work.move` event that landed
 * `id` on `to: 'todo'` — never off a durable item field, so a later
 * reject/verify-fail-park (which never carries this marker) always wins
 * over an earlier claim-lock §3b release's marker instead of the stale
 * value silently surviving (tsk-2zv). Returns `undefined` when the item
 * has never moved to `todo`, or when its latest such move didn't carry
 * the marker (reject, verify-fail park, or a genuinely fresh take).
 */
function latestTodoReleaseTrigger(events, id) {
  let marker;
  for (const event of events) {
    if (!event || !event.payload) continue;
    if (event.type === 'work.move' && event.payload.id === id && event.payload.to === 'todo') {
      marker = event.payload.releaseTrigger;
    }
  }
  return marker;
}

// category (R4, store.mjs's categoryOf contract): 'not-found' mirrors
// StoreError's own not-found convention ('validation'); 'lock-held'/
// 'lock-ambiguous' reuse 'lock-timeout' (events.mjs's own category for the
// same "couldn't get exclusive access" class) — without this, an uncategorized
// ClaimError falls through categoryOf to 'unexpected' and crashes the whole
// runOnce drain-run instead of a graceful per-item halt (same failure mode
// store.mjs's own EXIT_CODES comment documents for WorktreeError/MergeError).
const CLAIM_ERROR_CATEGORY = Object.freeze({
  'not-found': 'validation',
  'lock-held': 'lock-timeout',
  'lock-ambiguous': 'lock-timeout',
  'deps-not-merged': 'validation',
  // Same reasoning as 'deps-not-merged': a refused claim is an ordinary,
  // expected outcome, so the runner must halt this one item gracefully
  // rather than crash its whole drain-run on an 'unexpected' category.
  'worker-slot-ceiling': 'validation',
  // The pre-claim durable-status CAS below (tsk-40m D2: preClaimStatus vs
  // expectedStatus) reports the same 'conflict' category moveWork's own CAS
  // always has for "the state changed since you read it" — a real,
  // expected concurrent-claim outcome (exit 3), not a crash.
  conflict: 'conflict',
});

export class ClaimError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ClaimError';
    this.code = code;
    this.category = CLAIM_ERROR_CATEGORY[code] ?? 'unexpected';
    Object.assign(this, details);
  }
}

/**
 * Claim work through the single choke-point.
 *
 * @param {string} dir - .fgos directory
 * @param {Object} opts
 * @param {string} opts.id - work item id
 * @param {string} opts.actor - 'session' | 'runner' | 'human'
 * @param {boolean} opts.isolate - if true, create worktree (pick behavior); if false, no worktree (take behavior)
 * @param {string} [opts.claimTrigger] - optional claim trigger stamp
 * @param {string} [opts.repoRoot] - repo root (defaults to process.cwd())
 * @param {string} [opts.worktreeDir] - custom worktree directory (for runner)
 * @returns {Object} claim result with worktree info if isolated
 */
export function claimWork(dir, { id, actor, isolate, claimTrigger, repoRoot = process.cwd(), worktreeDir, skipOutcome = false } = {}) {
  // Acquire main-checkout-lock before any state mutation. ttlMs is required
  // here (tsk-3w8 follow-up): the pre-commit hook (.githooks/pre-commit,
  // now wired via fgos setup/doctor) writes a STRING-identity record per
  // commit and never releases it -- relying entirely on ttlMs-based
  // staleness. Omitting ttlMs here (the original tsk-53f wiring did) makes
  // that record read as AMBIGUOUS forever once the hook is active,
  // permanently deadlocking every take/pick after the very first commit.
  let lockResult = acquireMainCheckoutLock(dir, { identity: process.pid, ttlMs: DEFAULT_TTL_MS, releaseOnExit: true });
  if (lockResult.status === AMBIGUOUS) {
    // tsk-2l8: AMBIGUOUS means the lock file's content is unparseable, not
    // that a live holder disagrees -- the same shape verb `unlock` already
    // self-heals via forceReclaimAmbiguousLock (its own re-read-before-unlink
    // TOCTOU guard, main-checkout-lock.mjs:655-676), just as a separate
    // manual command. Mirror that single reclaim-and-retry here so pick/take
    // recovers in the same call instead of requiring a person to run
    // `/fgOS:unlock` before retrying. A transient race (a live holder wrote a
    // valid record between the first read and this call) surfaces below as
    // whatever that fresh content actually is (HELD/ACQUIRED); only a
    // SECOND consecutive AMBIGUOUS (content persistently unparseable) still
    // fails closed.
    forceReclaimAmbiguousLock(dir);
    lockResult = acquireMainCheckoutLock(dir, { identity: process.pid, ttlMs: DEFAULT_TTL_MS, releaseOnExit: true });
  }
  if (lockResult.status === HELD) {
    const ttlPart = lockResult.remainingTtlMs != null
      ? `, expires in ${formatLockDurationMs(lockResult.remainingTtlMs)}`
      : ', no TTL window known';
    throw new ClaimError(
      'lock-held',
      `claimWork: main checkout locked by pid ${lockResult.holderPid} (held ${formatLockDurationMs(lockResult.lockAgeMs)}${ttlPart})`,
      { remainingTtlMs: lockResult.remainingTtlMs, holderPid: lockResult.holderPid, lockAgeMs: lockResult.lockAgeMs },
    );
  }
  if (lockResult.status === AMBIGUOUS) {
    const agePart = lockResult.lockAgeMs != null ? ` (lock age ${formatLockDurationMs(lockResult.lockAgeMs)})` : '';
    throw new ClaimError('lock-ambiguous', `claimWork: main checkout lock state ambiguous${agePart}`, { lockAgeMs: lockResult.lockAgeMs });
  }

  try {
    // Tầng A (T2/T3): events now live under baseline-0 (.fgos/events.jsonl)
    // PLUS every per-writer file under .fgos/events/ -- readRawEvents(dir)
    // is the one door that reads all of it, merged/deduped (TA-D7/TA-D13).
    // Passing a single-file `rawLog` override into the checks call below
    // (the old shape, back when there was only ever one file to read) would
    // scope the truncation guard to baseline-0 only and silently skip every
    // per-writer file (T5's own multi-file guard never sees rawLog !== null
    // as anything but a deliberate single-file test injection) -- so this
    // no longer passes one at all, letting the checks do their own real
    // multi-file discovery from disk.
    const rawEvents = readRawEvents(dir);
    // commitEnv (tsk-32v): this call runs right after acquiring
    // main-checkout-lock above (identity: process.pid) -- without threading
    // that same identity into the periodic checkpoint's own git commit,
    // .githooks/pre-commit's own lock re-check sees a foreign identity and
    // refuses it, silently leaving .fgos/events.jsonl staged-but-uncommitted
    // (the same self-collision confirmed live in merge.mjs's own two call
    // sites).
    runOpportunisticMainCheckoutChecks(dir, repoRoot, { commitEnv: { [HOLDER_PID_ENV_VAR]: String(process.pid) } });
    const durableView = foldEvents(rawEvents);
    const claims = readClaims(dir);
    const view = buildEffectiveView(durableView, claims);
    const item = view.work[id];

    if (!item) {
      throw new ClaimError('not-found', `claimWork: work "${id}" not found.`);
    }

    const priorVisits = visitCount(rawEvents, id);
    const branch = branchNameFor(id);
    const branchAlreadyExists = branchExists(repoRoot, branch);

    const rootId = resolveRoot(view, id);
    const isLeaf = rootId !== id;
    const rootBranch = isLeaf ? branchNameFor(rootId) : undefined;
    const rootBranchExists = isLeaf && branchExists(repoRoot, rootBranch);
    const baseRef = rootBranchExists ? rootBranch : undefined;

    if (isolate && isLeaf) {
      const unmergedDeps = (item.deps ?? []).filter((dep) => !isResolvedStatus(view.work[dep]));
      if (unmergedDeps.length > 0) {
        throw new ClaimError(
          'deps-not-merged',
          `claimWork: leaf "${id}" has dep(s) not yet status:done — ${unmergedDeps.join(', ')} — forking from "${rootBranch}" now risks missing their content; approve/merge them into "${rootBranch}" first.`,
        );
      }
    }

    const activeClaim = claims[id];
    const effectiveClaimRole = item.claimRole || activeClaim?.claimRole;

    const isPotentialStaleClaimReclaim = isolate
      && (activeClaim || item.status === 'doing')
      && (effectiveClaimRole === 'human' || effectiveClaimRole === 'session')
      && (actor === 'session' || actor === 'human')
      && isReclaimEligible(repoRoot, id, effectiveClaimRole);

    const room = hasWorkerSlotRoom(view, {
      ceiling: readSharedConfigOrEmpty(path.dirname(dir))?.workerSlots?.ceiling,
      excludeId: id,
    });
    if (!room.allowed && !isPotentialStaleClaimReclaim) {
      throw new ClaimError(
        'worker-slot-ceiling',
        `claimWork: worker-slot ceiling reached — ${room.occupied} of ${room.ceiling} slots in use; finish or park a running item before claiming "${id}".`,
        { occupied: room.occupied, ceiling: room.ceiling },
      );
    }

    const isClaimLockReclaim = branchAlreadyExists
      && typeof item.branchHeadAtTake === 'string'
      && item.branchHeadAtTake
      && latestTodoReleaseTrigger(rawEvents, id) === 'claim-lock-3b';

    let branchHeadAtTake;
    if (isClaimLockReclaim) {
      branchHeadAtTake = item.branchHeadAtTake;
    } else if (branchAlreadyExists) {
      branchHeadAtTake = gitAt(repoRoot, ['rev-parse', branch]).trim();
    } else if (rootBranchExists) {
      branchHeadAtTake = gitAt(repoRoot, ['rev-parse', rootBranch]).trim();
    } else {
      branchHeadAtTake = currentHead(repoRoot);
    }

    const isBranchTake = item.status === 'blocked' && branchAlreadyExists;
    const expectedStatus = isBranchTake ? 'blocked' : 'todo';
    const useBranchSource = isolate || isBranchTake;

    let durableStateMutatedByReclaim = false;
    if (
      isolate
      && !isBranchTake
      && (activeClaim || item.status === 'doing')
      && (effectiveClaimRole === 'human' || effectiveClaimRole === 'session')
      && (actor === 'session' || actor === 'human')
      && isReclaimEligible(repoRoot, id, effectiveClaimRole)
    ) {
      try {
        if (activeClaim) {
          // tsk-40m code-review finding (high, D4/D8): releasing a claim
          // used to just delete the runtime claim file, with no durable
          // trace — a reclaimed item read identical to one that never
          // started. Record the attempt first so attemptCount/lastAttempt
          // (replay.mjs) can tell "started then reclaimed" apart from
          // "never started". `phase` mirrors anti-loop.mjs's own
          // executing-stage check (claim-lock) so a reclaim of a clarify/
          // decompose-phase claim never inflates the execute-phase budget.
          const executeStage = stageForStep(getDomain(item.domain), 'Execute');
          const claimPhase = (item.stage ?? executeStage) === executeStage ? 'execute' : (item.stage || 'unknown');
          recordClaimAttempt(dir, { id, phase: claimPhase, result: 'reclaimed', claimId: activeClaim.claimId, actor: activeClaim.actor });
          releaseClaim(dir, { id, claimId: activeClaim.claimId });
        } else if (item.status === 'doing') {
          moveWork(dir, { id, to: 'todo', expectedStatus: 'doing' });
          durableStateMutatedByReclaim = true;
        }
        const activityAt = lastActivityAt(repoRoot, id);
        addDecision(dir, {
          id,
          text: `stale-claim-reclaim: released ${effectiveClaimRole} claim (last activity ${activityAt === null ? 'unknown' : new Date(activityAt).toISOString()})`,
          source: 'claimWork',
          kind: 'engine',
          rationale: `docs/history/session-claim-liveness/CONTEXT.md D2/D4/D5 — worktree activity signal past the ${effectiveClaimRole === 'runner' ? 'agentMs' : 'humanMs'} threshold, reclaimed by a live ${actor} claim attempt`,
        });
      } catch (err) {
        if (!(err instanceof FsmError) || err.category !== 'conflict') throw err;
      }
    }

    // Re-fold fresh ONLY when the reclaim block above actually wrote a
    // durable transition (the legacy moveWork-to-'todo' branch, for an item
    // whose durable status was still literally 'doing' pre-migration) —
    // that mutates state out from under the `durableView` snapshot read at
    // the top of this call. `releaseClaim` never touches durable events, so
    // it never needs this; skipping the re-fold on the common path (no
    // reclaim, or a pure runtime-claim release) keeps this call's log-read
    // count unchanged from before this CAS check existed.
    let preClaimStatus = durableView.work[id].status;
    let preClaimRevision = getItemDurableRevision(durableView, id);
    if (durableStateMutatedByReclaim) {
      const freshDurableView = foldEvents(readRawEvents(dir));
      preClaimStatus = freshDurableView.work[id].status;
      preClaimRevision = getItemDurableRevision(freshDurableView, id);
    }

    if (preClaimStatus !== expectedStatus) {
      throw new ClaimError(
        'conflict',
        `claimWork: expected "${id}" durable status "${expectedStatus}" but found "${preClaimStatus}" (durable state changed since read)`,
      );
    }

    const runtimeClaim = acquireClaim(dir, {
      id,
      actor,
      source: useBranchSource ? 'branch' : 'main',
      branch: useBranchSource ? branch : undefined,
      branchHeadAtTake: useBranchSource ? branchHeadAtTake : undefined,
      headAtTake: useBranchSource ? undefined : currentHead(repoRoot),
      claimTrigger,
      preClaimStatus,
      preClaimRevision,
      claimRole: actor,
    });

    if (!skipOutcome) {
      addOutcome(dir, {
        id,
        predicted: {
          tier: item.tier ?? DEFAULTS.tier,
          deps: item.deps?.length ?? 0,
          priorVisits,
          role: actor,
          branchHeadAtTake: useBranchSource ? branchHeadAtTake : undefined,
          headAtTake: useBranchSource ? undefined : currentHead(repoRoot),
        },
      });
    }

    const claim = {
      id,
      claimId: runtimeClaim.claimId,
      from: expectedStatus,
      to: 'doing',
      role: actor,
      seq: runtimeClaim.claimId,
      source: useBranchSource ? 'branch' : 'main',
      branch: useBranchSource ? branch : undefined,
      branchHeadAtTake: useBranchSource ? branchHeadAtTake : undefined,
      headAtTake: useBranchSource ? undefined : currentHead(repoRoot),
    };

    if (isolate) {
      let worktree;
      try {
        worktree = createClaimWorktree(repoRoot, id, { worktreeDir, baseRef, beforeProvision: () => lockResult.release() });
      } catch (err) {
        releaseClaim(dir, { id, claimId: runtimeClaim.claimId });
        throw err;
      }
      return { ...claim, worktree };
    }

    return claim;
  } finally {
    // Always release lock after claim completes (success or failure). Goes
    // through lockResult.release() (tsk-45z), not the raw
    // releaseMainCheckoutLock -- the ACQUIRED result's release() is also
    // what un-registers the releaseOnExit crash-safety listeners above;
    // calling the raw function directly would leave those listeners
    // attached for the rest of this process's life, leaking 3 per call in
    // a long-running runner that claims many items in sequence.
    lockResult.release();
  }
}
