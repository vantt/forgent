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
import { acquireMainCheckoutLock, releaseMainCheckoutLock, HELD, AMBIGUOUS } from './main-checkout-lock.mjs';
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

export class ClaimError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ClaimError';
    this.code = code;
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
export function claimWork(dir, { id, actor, isolate, claimTrigger, repoRoot = process.cwd(), worktreeDir } = {}) {
  const view = listWork(dir);
  const item = view.work[id];

  if (!item) {
    throw new ClaimError('not-found', `claimWork: work "${id}" not found.`);
  }

  // Acquire main-checkout-lock before any state mutation
  const lockResult = acquireMainCheckoutLock(dir, { identity: process.pid });
  if (lockResult.status === HELD) {
    throw new ClaimError('lock-held', `claimWork: main checkout locked by pid ${lockResult.holderPid}`);
  }
  if (lockResult.status === AMBIGUOUS) {
    throw new ClaimError('lock-ambiguous', 'claimWork: main checkout lock state ambiguous');
  }

  try {
    const priorVisits = visitCount(readRawEvents(dir), id);
    const branch = branchNameFor(id);
    const branchAlreadyExists = branchExists(repoRoot, branch);

    // Determine baseRef for leaf items (fork from root branch, not main)
    const rootId = resolveRoot(view, id);
    const isLeaf = rootId !== id;
    const baseRef = isLeaf ? branchNameFor(rootId) : undefined;

    // Branch reuse: if branch exists, get its HEAD; otherwise use current HEAD
    // For leaves, this still applies but with root branch consideration
    const branchHeadAtTake = branchAlreadyExists
      ? gitAt(repoRoot, ['rev-parse', branch]).trim()
      : (isLeaf && baseRef ? gitAt(repoRoot, ['rev-parse', baseRef]).trim() : currentHead(repoRoot));

    const expectedStatus = item.status === 'blocked' ? 'blocked' : 'todo';

    // Claim via moveWork
    const { event } = moveWork(dir, {
      id,
      to: 'doing',
      expectedStatus,
      actor,
      branchHeadAtTake: isolate ? branchHeadAtTake : undefined,
      headAtTake: isolate ? undefined : currentHead(repoRoot),
      claimTrigger,
    });

    // Record predicted outcome
    addOutcome(dir, {
      id,
      predicted: {
        tier: item.tier ?? DEFAULTS.tier,
        deps: item.deps?.length ?? 0,
        priorVisits,
        actor,
        branchHeadAtTake: isolate ? branchHeadAtTake : undefined,
        headAtTake: isolate ? undefined : currentHead(repoRoot),
      },
    });

    const claim = {
      id,
      from: expectedStatus,
      to: 'doing',
      actor,
      seq: event.seq,
      source: isolate ? 'branch' : 'main',
      branch: isolate ? branch : undefined,
      branchHeadAtTake: isolate ? branchHeadAtTake : undefined,
      headAtTake: isolate ? undefined : currentHead(repoRoot),
    };

    // Create worktree if isolating
    if (isolate) {
      const worktree = createWorktree(repoRoot, id, { worktreeDir, baseRef });
      return { ...claim, worktree };
    }

    return claim;
  } finally {
    // Always release lock after claim completes (success or failure)
    releaseMainCheckoutLock(dir);
  }
}
