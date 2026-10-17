// claim-port.mjs — single choke-point for all claim flows (tsk-53f D1).
//
// Every claim (CLI take, CLI pick, runner claimItem) goes through this module.
// Centralizes: main checkout mutex (repo-locks.mjs), acquireClaim (runtime
// claim only — tsk-40m retired the durable moveWork(to:'doing') claim-time
// write entirely; doing is derived purely from the active-claim overlay),
// optional worktree creation with correct baseRef for leaf items.
//
// This is the "one door" for claiming work — no direct acquireClaim call
// outside this module except for FSM-internal transitions.

import { moveWork, addOutcome, addDecision, recordClaimAttempt, readRawEvents, FsmError } from '../state/store.mjs';
import { foldEvents } from '../state/replay.mjs';
import { isResolvedStatus, resolveRoot } from '../state/frontier.mjs';
import { getDomain, stepForPhase, effectiveStep } from '../state/domain-registry.mjs';
import { visitCount } from './anti-loop.mjs';
import { withMainCheckout } from './repo-locks.mjs';
import { checkpointMainFgos } from './main-fgos-checkpoint.mjs';
import { LockScope, HolderLockError } from '../holder-lock/index.mjs';
import { createClaimWorktree, branchNameFor, branchExists } from './worktree.mjs';
import { lastActivityAt, isReclaimEligible } from './claim-liveness.mjs';
import { hasWorkerSlotRoom } from '../state/worker-slots.mjs';
import { readSharedConfigOrEmpty } from '../config/shared-config-file.mjs';
import { acquireClaimTx, releaseClaim, readClaims, readClaim, buildEffectiveView, getItemDurableRevision, withMainState } from '../state/runtime-coordination.mjs';
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
 * Read `releaseTrigger` off the MOST RECENT settle-to-'todo' event for
 * `id` — a `work.move(to: 'todo')`, or (tsk-40m: a same-state settle whose
 * preClaimStatus was already 'todo' writes no work.move at all) a
 * `work.attempt(to: 'todo')` — never off a durable item field, so a later
 * reject/verify-fail-park (which never carries this marker) always wins
 * over an earlier claim-lock §3b release's marker instead of the stale
 * value silently surviving (tsk-2zv). Returns `undefined` when the item
 * has never settled to `todo`, or when its latest such settle didn't carry
 * the marker (reject, verify-fail park, or a genuinely fresh take).
 */
function latestTodoReleaseTrigger(events, id) {
  let marker;
  for (const event of events) {
    if (!event || !event.payload) continue;
    if (event.payload.id !== id || event.payload.to !== 'todo') continue;
    if (event.type === 'work.move' || event.type === 'work.attempt') {
      marker = event.payload.releaseTrigger;
    }
  }
  return marker;
}

// category (R4, store.mjs's categoryOf contract): 'not-found' mirrors
// StoreError's own not-found convention ('validation'); 'lock-held'
// reuses 'lock-timeout' (events.mjs's own category for the
// same "couldn't get exclusive access" class) — without this, an uncategorized
// ClaimError falls through categoryOf to 'unexpected' and crashes the whole
// runOnce drain-run instead of a graceful per-item halt (same failure mode
// store.mjs's own EXIT_CODES comment documents for WorktreeError/MergeError).
const CLAIM_ERROR_CATEGORY = Object.freeze({
  'not-found': 'validation',
  'lock-held': 'lock-timeout',
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
export async function claimWork(dir, { id, actor, isolate, claimTrigger, repoRoot = process.cwd(), worktreeDir, skipOutcome = false, waitMs } = {}) {
  // One scope per claim: the main checkout mutex (rank 50) is held for the
  // checkpoint, the read-only checks, the worker-slot ceiling check and the
  // claim write, and released before the worktree is created, so a later
  // worktree-admin acquire (rank 40) never nests under main (ranks only go up
  // inside a scope). Serializing every claim on the main mutex is what keeps
  // the ceiling check correct. `scope` is handed to createClaimWorktree for
  // that later acquire; the worktree module does not take the lock yet.
  const scope = new LockScope('claim');
  const underMain = (mainHandle) => {
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
    checkpointMainFgos(mainHandle, dir, repoRoot);
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

    // tsk-40m (docs/architect/doing-coordination-redesign.md): claim time no
    // longer writes a durable work.move(->doing), so the ORIGINAL claim's
    // branchHeadAtTake no longer lands on the item's own sticky top-level
    // field (that field is only ever set by a work.move payload) — it now
    // lives on the settle's own work.attempt, folded into item.lastAttempt.
    const priorBranchHeadAtTake = item.lastAttempt?.branchHeadAtTake;
    const isClaimLockReclaim = branchAlreadyExists
      && typeof priorBranchHeadAtTake === 'string'
      && priorBranchHeadAtTake
      && latestTodoReleaseTrigger(rawEvents, id) === 'claim-lock-3b';

    let branchHeadAtTake;
    if (isClaimLockReclaim) {
      branchHeadAtTake = priorBranchHeadAtTake;
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

    if (
      isolate
      && !isBranchTake
      && (activeClaim || item.status === 'doing')
      && (effectiveClaimRole === 'human' || effectiveClaimRole === 'session')
      && (actor === 'session' || actor === 'human')
      && isReclaimEligible(repoRoot, id, effectiveClaimRole)
    ) {
      try {
        let adminRelease = null;
        if (activeClaim) {
          // tsk-40m code-review finding (high, D4/D8): releasing a claim
          // used to just delete the runtime claim file, with no durable
          // trace — a reclaimed item read identical to one that never
          // started. Record the attempt first so attemptCount/lastAttempt
          // (replay.mjs) can tell "started then reclaimed" apart from
          // "never started". `phase` mirrors anti-loop.mjs's own
          // executing-stage check (claim-lock) so a reclaim of a clarify/
          // decompose-phase claim never inflates the execute-phase budget.
          const claimDomain = getDomain(item.domain);
          const claimPhase = effectiveStep(item, claimDomain) === stepForPhase(claimDomain, 'execute', item.kind)
            ? 'execute'
            : (item.workflowStep || 'unknown');
          recordClaimAttempt(dir, { id, phase: claimPhase, result: 'reclaimed', claimId: activeClaim.claimId, actor: activeClaim.actor });
          // Another session's claim, past its liveness threshold: released
          // through the named admin path, never the owner-only default.
          const rel = releaseClaim(dir, { id, claimId: activeClaim.claimId, adminReason: 'stale-claim-reclaim' });
          if (rel.admin) adminRelease = { ...rel.admin, claimId: activeClaim.claimId };
        } else if (item.status === 'doing') {
          moveWork(dir, { id, to: 'todo', expectedStatus: 'doing' });
        }
        const activityAt = lastActivityAt(repoRoot, id);
        addDecision(dir, {
          id,
          text: `stale-claim-reclaim: released ${effectiveClaimRole} claim (last activity ${activityAt === null ? 'unknown' : new Date(activityAt).toISOString()})`,
          source: 'claimWork',
          kind: 'engine',
          rationale: `docs/history/session-claim-liveness/CONTEXT.md D2/D4/D5 — worktree activity signal past the ${effectiveClaimRole === 'runner' ? 'agentMs' : 'humanMs'} threshold, reclaimed by a live ${actor} claim attempt`,
          // Another writer's claim was released: keep who owned it and who released it.
          ...(adminRelease ? { admin: adminRelease } : {}),
        });
      } catch (err) {
        if (!(err instanceof FsmError) || err.category !== 'conflict') throw err;
      }
    }

    // tsk-40m code-review finding (blocker, TOCTOU): re-read the durable
    // view FRESH here, ALWAYS — not only when this call's own reclaim
    // block wrote something. Everything between the `durableView` snapshot
    // read at the top of this call and this point (worker-slot check,
    // branch/rev-parse git calls, the stale-claim-reclaim block's own
    // liveness check) takes real wall-clock time with no lock held — long
    // enough for a genuinely DIFFERENT process's moveWork/settleClaim to
    // durably move this item without this call ever seeing it. Wrapped in
    // the SAME events.lock every durable writer serializes on (even though
    // acquireClaim itself never appends an event) so no other durable
    // write can land between this read and the runtime claim actually
    // being written — the read-validate-write sequence is now atomic with
    // respect to every other writer, not just this call's own prior
    // reclaim.
    // HEAD needs git, so it is read before the state lock.
    const headAtTakeForClaim = useBranchSource ? undefined : currentHead(repoRoot);
    const runtimeClaim = withMainState(dir, (tx) => {
      const freshDurableView = foldEvents(readRawEvents(dir));
      const freshStatus = freshDurableView.work[id]?.status;
      if (freshStatus !== expectedStatus) {
        throw new ClaimError(
          'conflict',
          `claimWork: expected "${id}" durable status "${expectedStatus}" but found "${freshStatus}" (durable state changed since read)`,
        );
      }
      const freshRevision = getItemDurableRevision(freshDurableView, id);

      return acquireClaimTx(tx, {
        id,
        actor,
        source: useBranchSource ? 'branch' : 'main',
        branch: useBranchSource ? branch : undefined,
        branchHeadAtTake: useBranchSource ? branchHeadAtTake : undefined,
        headAtTake: headAtTakeForClaim,
        claimTrigger,
        preClaimStatus: freshStatus,
        preClaimRevision: freshRevision,
        claimRole: actor,
      });
    });

    if (!skipOutcome) {
      addOutcome(dir, {
        id,
        predicted: {
          size: item.size ?? DEFAULTS.size,
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

    return { claim, claimId: runtimeClaim.claimId, baseRef };
  };

  let held;
  try {
    held = await withMainCheckout(scope, 'claim', underMain, { fgosDir: dir, waitMs });
  } catch (err) {
    if (err instanceof HolderLockError && err.code === 'lock-held') {
      throw new ClaimError('lock-held', `claimWork: ${err.message}`, { holders: err.holders, lock: err.lock, timedOut: err.timedOut });
    }
    throw err;
  }

  if (!isolate) return held.claim;
  let worktree;
  try {
    worktree = createClaimWorktree(repoRoot, id, { worktreeDir, baseRef: held.baseRef, startSha: held.claim.headAtTake, scope });
  } catch (err) {
    releaseClaim(dir, { id, claimId: held.claimId });
    throw err;
  }
  return { ...held.claim, worktree };
}
