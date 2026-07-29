// claim-port.mjs — single choke-point for all claim flows (tsk-53f D1).
//
// Every claim (CLI take, CLI pick, runner claimItem) goes through this module.
// Centralizes: main-checkout-lock acquire/release, moveWork to 'doing',
// optional worktree creation with correct baseRef for leaf items.
//
// This is the "one door" for claiming work — no direct moveWork(to:'doing')
// calls outside this module except for FSM-internal transitions.

import { moveWork, addOutcome, listWork, readRawEvents } from '../state/store.mjs';
import { visitCount } from './anti-loop.mjs';
import { acquireMainCheckoutLock, HELD, AMBIGUOUS, DEFAULT_TTL_MS, formatLockDurationMs } from './main-checkout-lock.mjs';
import { createWorktree, branchNameFor, branchExists } from './worktree.mjs';
import { resolveRoot } from './root-affinity.mjs';
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
});

export class ClaimError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ClaimError';
    this.code = code;
    this.category = CLAIM_ERROR_CATEGORY[code] ?? 'unexpected';
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
  const view = listWork(dir);
  const item = view.work[id];

  if (!item) {
    throw new ClaimError('not-found', `claimWork: work "${id}" not found.`);
  }

  // Acquire main-checkout-lock before any state mutation. ttlMs is required
  // here (tsk-3w8 follow-up): the pre-commit hook (.githooks/pre-commit,
  // now wired via fgos setup/doctor) writes a STRING-identity record per
  // commit and never releases it -- relying entirely on ttlMs-based
  // staleness. Omitting ttlMs here (the original tsk-53f wiring did) makes
  // that record read as AMBIGUOUS forever once the hook is active,
  // permanently deadlocking every take/pick after the very first commit.
  const lockResult = acquireMainCheckoutLock(dir, { identity: process.pid, ttlMs: DEFAULT_TTL_MS, releaseOnExit: true });
  if (lockResult.status === HELD) {
    const ttlPart = lockResult.remainingTtlMs != null
      ? `, expires in ${formatLockDurationMs(lockResult.remainingTtlMs)}`
      : ', no TTL window known';
    throw new ClaimError(
      'lock-held',
      `claimWork: main checkout locked by pid ${lockResult.holderPid} (held ${formatLockDurationMs(lockResult.lockAgeMs)}${ttlPart})`,
    );
  }
  if (lockResult.status === AMBIGUOUS) {
    const agePart = lockResult.lockAgeMs != null ? ` (lock age ${formatLockDurationMs(lockResult.lockAgeMs)})` : '';
    throw new ClaimError('lock-ambiguous', `claimWork: main checkout lock state ambiguous${agePart}`);
  }

  try {
    const rawEvents = readRawEvents(dir);
    const priorVisits = visitCount(rawEvents, id);
    const branch = branchNameFor(id);
    const branchAlreadyExists = branchExists(repoRoot, branch);

    // Determine baseRef for leaf items (fork from root branch, not main) —
    // only when the root branch actually exists (rootBranchExists guards
    // BOTH baseRef and branchHeadAtTake below). A leaf claimed before the
    // runner ever created its root branch (e.g. a human `pick` on a
    // just-decomposed child, no dispatch involved yet) must fall through to
    // repoRoot's current HEAD like a non-leaf claim — passing a baseRef that
    // names a branch git doesn't have yet made createWorktree throw AFTER
    // moveWork had already durably committed the doing-claim, orphaning the
    // item in `doing` with no branch/worktree and no automatic recovery
    // (startupReap skips human/session claims by design).
    const rootId = resolveRoot(view, id);
    const isLeaf = rootId !== id;
    const rootBranch = isLeaf ? branchNameFor(rootId) : undefined;
    const rootBranchExists = isLeaf && branchExists(repoRoot, rootBranch);
    const baseRef = rootBranchExists ? rootBranch : undefined;

    // Branch reuse: if branch exists, get its HEAD; otherwise use current HEAD.
    // For leaves, try root branch if it exists; fall back to current HEAD if not
    // (runner creates root branch later, in runItem, so it may not exist yet).
    //
    // Reclaim-safe exception (tsk-2zv): a claim-lock §3b release (an item's
    // `pick` claim held through clarify/decompose, released back to `todo`
    // the instant the item reaches `executing`, `decompose.mjs`'s
    // `releaseClaimOnExecuting`) is the SAME execution round split by a
    // mechanical stage edge, not a new attempt — recomputing here would
    // silently swallow every commit made before the release (CONTEXT.md,
    // plan.md, or code already committed). Only THIS specific release is
    // exempted, via `latestTodoReleaseTrigger`'s positive marker check —
    // never inferred from status/branch-existence alone, since a reject
    // (`proposed -> todo`) or a verify-fail park lands an item in the exact
    // same shape without deleting the branch, and MUST still recompute
    // fresh (that recompute is the deliberate anti-cheat gate forcing new
    // work before a retaken item can `return` again).
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

    // Branch take (human-rounds D2): a blocked item with existing branch uses
    // blocked→doing edge; blocked WITHOUT branch falls through to todo edge
    // (will fail CAS, preserving old take behavior).
    const isBranchTake = item.status === 'blocked' && branchAlreadyExists;
    const expectedStatus = isBranchTake ? 'blocked' : 'todo';
    const useBranchSource = isolate || isBranchTake;

    // Claim via moveWork. moveWork's own field is `role` (store.mjs's
    // long-settled settlement-role-attribution contract, S3-closeout) — this
    // module's own opt is named `actor` (its public contract), mapped here.
    const { event } = moveWork(dir, {
      id,
      to: 'doing',
      expectedStatus,
      role: actor,
      branchHeadAtTake: useBranchSource ? branchHeadAtTake : undefined,
      headAtTake: useBranchSource ? undefined : currentHead(repoRoot),
      claimTrigger,
    });

    // Record predicted outcome (skipped when caller handles it separately, e.g. runner)
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
      from: expectedStatus,
      to: 'doing',
      role: actor,
      seq: event.seq,
      source: useBranchSource ? 'branch' : 'main',
      branch: useBranchSource ? branch : undefined,
      branchHeadAtTake: useBranchSource ? branchHeadAtTake : undefined,
      headAtTake: useBranchSource ? undefined : currentHead(repoRoot),
    };

    // Create worktree if isolating
    if (isolate) {
      const worktree = createWorktree(repoRoot, id, { worktreeDir, baseRef });
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
