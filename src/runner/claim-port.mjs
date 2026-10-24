// claim-port.mjs — single choke-point for all claim flows (tsk-53f D1).
//
// Every claim (CLI take, CLI pick, runner claimItem) goes through this module.
// Centralizes: the worker-slot ceiling check + acquireClaim in one state
// transaction (runtime claim only — tsk-40m retired the durable
// moveWork(to:'doing') claim-time write entirely; doing is derived purely from
// the active-claim overlay), optional worktree creation with correct baseRef for leaf items.
//
// This is the "one door" for claiming work — no direct acquireClaim call
// outside this module except for FSM-internal transitions.

import { moveWork, addOutcome, addDecision, recordClaimAttempt, readRawEvents, FsmError } from '../state/store.mjs';
import { foldEvents } from '../state/replay.mjs';
import { isResolvedStatus, resolveRoot } from '../state/frontier.mjs';
import { getDomain, stepForPhase, effectiveStep } from '../state/domain-registry.mjs';
import { visitCount } from './anti-loop.mjs';
import { LockScope } from '../holder-lock/index.mjs';
import { createClaimWorktree, branchNameFor, branchExists, currentHead, resolveRefSha } from './worktree.mjs';
import { lastActivityAt, isReclaimEligible } from './claim-liveness.mjs';
import { hasWorkerSlotRoom } from '../state/worker-slots.mjs';
import { readConfig } from '../config/facade.mjs';
import { acquireClaimTx, releaseClaim, readClaims, readClaim, buildEffectiveView, getItemDurableRevision, withMainState } from '../state/runtime-coordination.mjs';
import fs from 'node:fs';
import path from 'node:path';

import { DEFAULTS } from '../state/work.mjs';

/** `workerSlots.ceiling` of the project that owns the `.fgos` directory `dir` (null: no ceiling armed), following a linked worktree's `.fgos` symlink to the main checkout that holds the store; a refused config file throws. */
export function readWorkerSlotCeiling(dir) {
  return readConfig({ projectRoot: path.dirname(fs.realpathSync(dir)), sections: ['workerSlots'] }).value.workerSlots?.ceiling;
}

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
// StoreError's own not-found convention ('validation') — without this, an uncategorized
// ClaimError falls through categoryOf to 'unexpected' and crashes the whole
// runOnce drain-run instead of a graceful per-item halt (same failure mode
// store.mjs's own EXIT_CODES comment documents for WorktreeError/MergeError).
const CLAIM_ERROR_CATEGORY = Object.freeze({
  'not-found': 'validation',
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
export async function claimWork(dir, { id, actor, isolate, claimTrigger, repoRoot = process.cwd(), worktreeDir, skipOutcome = false } = {}) {
  // Everything that needs a child process happens before the state lock: the
  // checkout's HEAD is read once, here, and that one answer is both the commit
  // a fresh worktree forks from and the commit recorded on the claim.
  const head = currentHead(repoRoot);
  const scope = new LockScope('claim');

  // readRawEvents(dir) is the one door that reads the whole Work history, through the Event Store facade.
  const rawEvents = readRawEvents(dir);
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

  const ceiling = readWorkerSlotCeiling(dir);

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
    branchHeadAtTake = resolveRefSha(repoRoot, branch);
  } else if (rootBranchExists) {
    branchHeadAtTake = resolveRefSha(repoRoot, rootBranch);
  } else {
    branchHeadAtTake = head;
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

  // tsk-40m code-review finding (blocker, TOCTOU): everything above took real
  // wall-clock time with no lock held, long enough for a genuinely DIFFERENT
  // process to durably move this item or take the last worker slot. So the
  // fresh read, the status check, the worker-slot ceiling check and the
  // claim write are one `state` transaction: no other durable write or claim
  // can land between the read and the claim file being written.
  const runtimeClaim = withMainState(dir, (tx) => {
    const freshDurableView = tx.view;
    const freshStatus = freshDurableView.work[id]?.status;
    if (freshStatus !== expectedStatus) {
      throw new ClaimError(
        'conflict',
        `claimWork: expected "${id}" durable status "${expectedStatus}" but found "${freshStatus}" (durable state changed since read)`,
      );
    }
    const freshRevision = getItemDurableRevision(freshDurableView, id);

    if (!isPotentialStaleClaimReclaim) {
      const room = hasWorkerSlotRoom(buildEffectiveView(freshDurableView, readClaims(dir, tx)), { ceiling, excludeId: id });
      if (!room.allowed) {
        throw new ClaimError(
          'worker-slot-ceiling',
          `claimWork: worker-slot ceiling reached — ${room.occupied} of ${room.ceiling} slots in use; finish or park a running item before claiming "${id}".`,
          { occupied: room.occupied, ceiling: room.ceiling },
        );
      }
    }

    return acquireClaimTx(tx, {
      id,
      actor,
      source: useBranchSource ? 'branch' : 'main',
      branch: useBranchSource ? branch : undefined,
      branchHeadAtTake: useBranchSource ? branchHeadAtTake : undefined,
      headAtTake: useBranchSource ? undefined : head,
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
        headAtTake: useBranchSource ? undefined : head,
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
    headAtTake: useBranchSource ? undefined : head,
  };

  if (!isolate) return claim;
  let worktree;
  try {
    // A fresh branch forks from the same commit the claim recorded; the
    // worktree-admin mutex (rank 40) is taken here, with no other lock held.
    worktree = createClaimWorktree(repoRoot, id, { worktreeDir, baseRef, startSha: head, scope });
  } catch (err) {
    releaseClaim(dir, { id, claimId: runtimeClaim.claimId });
    throw err;
  }
  return { ...claim, worktree };
}
