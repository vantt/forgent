// claim-port.mjs — single choke-point for all claim flows (tsk-53f D1).
//
// Every claim (CLI take, CLI pick, runner claimItem) goes through this module.
// Centralizes: main-checkout-lock acquire/release, moveWork to 'doing',
// optional worktree creation with correct baseRef for leaf items.
//
// This is the "one door" for claiming work — no direct moveWork(to:'doing')
// calls outside this module except for FSM-internal transitions.

import { moveWork, addOutcome, addDecision, readRawEvents, FsmError } from '../state/store.mjs';
import { foldEvents } from '../state/replay.mjs';
import { isResolvedStatus, resolveRoot } from '../state/frontier.mjs';
import { visitCount } from './anti-loop.mjs';
import { acquireMainCheckoutLock, forceReclaimAmbiguousLock, HELD, AMBIGUOUS, DEFAULT_TTL_MS, formatLockDurationMs, HOLDER_PID_ENV_VAR } from './main-checkout-lock.mjs';
import { createClaimWorktree, branchNameFor, branchExists } from './worktree.mjs';
import { lastActivityAt, isReclaimEligible } from './claim-liveness.mjs';
import { hasWorkerSlotRoom } from '../state/worker-slots.mjs';
import { readSharedConfigOrEmpty } from '../config/shared-config-file.mjs';
import { runOpportunisticMainCheckoutChecks } from '../state/events-jsonl-truncation-guard.mjs';
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
    const view = foldEvents(rawEvents);
    const item = view.work[id];

    if (!item) {
      throw new ClaimError('not-found', `claimWork: work "${id}" not found.`);
    }

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

    // Sibling-merge-ordering guard (D2, tsk-3t4): isolating a leaf forks a
    // NEW branch/worktree from baseRef right now (below) — unlike `take`
    // (isolate: false), which never forks anything and so can't hit this.
    // A leaf's own dep reaching `status: 'done'` is only possible through
    // `approve`'s leaf path, which never lands `done` without first
    // merging that dep's branch into `rootBranch` (bin/fgos.mjs's leaf
    // `approve` case) — so `done` on every dep already guarantees their
    // content is on `rootBranch` by the time this leaf forks from it. A dep
    // at `wontfix` (per wontfix-terminal-status-filter-consistency D1)
    // never had content to merge in the first place — abandoned, nothing
    // was ever built for it — so it can never be "unmerged" and is
    // excluded from this guard the same as `done`.
    // Checked and refused BEFORE moveWork below, on purpose: passing a
    // baseRef/expectation that later fails AFTER moveWork has committed is
    // exactly the orphaning bug `268b172` already fixed once for a
    // nonexistent baseRef — refusing here keeps this a clean no-op claim
    // instead of repeating that failure mode for a different cause.
    if (isolate && isLeaf) {
      const unmergedDeps = (item.deps ?? []).filter((dep) => !isResolvedStatus(view.work[dep]));
      if (unmergedDeps.length > 0) {
        throw new ClaimError(
          'deps-not-merged',
          `claimWork: leaf "${id}" has dep(s) not yet status:done — ${unmergedDeps.join(', ')} — forking from "${rootBranch}" now risks missing their content; approve/merge them into "${rootBranch}" first.`,
        );
      }
    }

    // Worker-slot ceiling gate (docs/history/orchestrator-worker-slots/
    // plan.md §Shape T1, D6/D7/D8). Sits BESIDE the deps guard above, never
    // nested inside it: that one is scoped to `isolate && isLeaf`, so it only
    // ever fires for `pick`. A worker occupies a slot whether or not it got a
    // worktree, so this has to fire uniformly across take/pick/runner — which
    // is also what makes exactly one gate enough for all six pool pickers
    // (D6): the gate never needs to know which picker chose the item, only
    // how many are already running.
    //
    // Checked before moveWork for the same reason the deps guard is: refusing
    // after the claim has durably committed would orphan the item in `doing`
    // with no branch and no automatic recovery.
    //
    // An absent or malformed `workerSlots.ceiling` means no ceiling at all,
    // so this is a no-op until a project configures one — behavior stays
    // identical to before the gate existed, the same posture
    // shared-config-file.mjs already documents for invariantChecks. `dir` is
    // the `.fgos` directory, so its parent is the project root
    // readSharedConfig expects — resolved the same way readGateBypassLevel
    // does, rather than from `repoRoot`, which callers set independently.
    // tsk-37t: a stale-claim reclaim (below) re-claims an item that is
    // ALREADY `doing` — occupancy is unchanged before and after (the item
    // held its slot under the stale claim, and holds the same slot under
    // the fresh one), so the ceiling gate has nothing real to refuse here.
    // Computed BEFORE the gate on purpose: `excludeId: id` already removes
    // this item from the room-check's own occupancy count, but that count
    // still refuses when every OTHER item alone is at or past ceiling (the
    // exact drift this item was filed against) — which is precisely the
    // situation a person reclaiming a stale claim is trying to clear. Same
    // condition the reclaim block below re-derives independently as a
    // signal-check, not a status change, so evaluating it twice (cheap:
    // `isReclaimEligible` here decides only whether to SKIP the gate, the
    // block below still runs its own reclaim attempt against fresh state)
    // never lets a claim through this gate that the reclaim block itself
    // then declines to take.
    const isPotentialStaleClaimReclaim = isolate
      && item.status === 'doing'
      && (item.claimRole === 'human' || item.claimRole === 'session')
      && (actor === 'session' || actor === 'human')
      && isReclaimEligible(repoRoot, id, item.claimRole);

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
    // (`awaiting-approval -> todo`) or a verify-fail park lands an item in the exact
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

    // Stale-claim reclaim pre-check (D1/D2/D3/D4/D5,
    // docs/history/session-claim-liveness/CONTEXT.md): about to hit the
    // ordinary CAS conflict below (item.status is 'doing', not a
    // blocked branch-take) — before that, check whether the EXISTING
    // human/session claim's worktree has genuinely gone quiet. Runner
    // claims are untouched (startupReap's own domain, loop.mjs:364-372);
    // this door is also never opened for a `runner` CALLER (this session's
    // own `actor`), so the unattended runner can never walk through it and
    // silently reclaim a human's stale work — only a live session/human
    // attempt can trigger it.
    //
    // `isolate` (pick) only, never a plain `take`: per docs/specs/runner.md
    // §3b, `pick` is the intended re-claim door, and `take` has its own
    // pre-existing, separately-scoped gap (tsk-65n's own item boundary —
    // never actually shipped in this file, confirmed by reading it) where
    // it silently mis-claims as `source: 'main'` on a `todo` item whose
    // branch already exists, instead of reusing that branch. Falling
    // through into that gap via THIS new door would be introducing a new
    // way to hit an old, separately-owned bug — out of this item's
    // boundary (no new verb, no take-mis-claim fix; CONTEXT.md/plan.md).
    if (
      isolate
      && !isBranchTake
      && item.status === 'doing'
      && (item.claimRole === 'human' || item.claimRole === 'session')
      && (actor === 'session' || actor === 'human')
      && isReclaimEligible(repoRoot, id, item.claimRole)
    ) {
      try {
        // Same doing->todo edge already registered (status-fsm.mjs:117),
        // guarded by its own CAS — a genuine race between two reclaimers
        // still lets only one through, the same single-writer guarantee
        // every other moveWork call in this module already relies on.
        // `reason` is NOT stamped into the payload for this edge
        // (status-fsm.mjs:216-232 scopes it to exactly three unrelated
        // edges) — the evidence trail (D2c) is the `addDecision` call
        // below instead, the same `kind: 'engine'` mechanism
        // `resolveDiscovery`/`resolvePlan` already use for their own
        // mechanical audit entries.
        moveWork(dir, { id, to: 'todo', expectedStatus: 'doing' });
        const activityAt = lastActivityAt(repoRoot, id);
        addDecision(dir, {
          id,
          text: `stale-claim-reclaim: released ${item.claimRole} claim (last activity ${activityAt === null ? 'unknown' : new Date(activityAt).toISOString()})`,
          source: 'claimWork',
          kind: 'engine',
          rationale: `docs/history/session-claim-liveness/CONTEXT.md D2/D4/D5 — worktree activity signal past the ${item.claimRole === 'runner' ? 'agentMs' : 'humanMs'} threshold, reclaimed by a live ${actor} claim attempt`,
        });
      } catch (err) {
        // Lost the race to another claimant's own release (or the item
        // moved for an unrelated reason in between) — fall through to the
        // ORIGINAL claim attempt below, which throws today's ordinary
        // conflict shape. Never leak this release step's own CAS message
        // (a different shape: "expected doing but found todo") in its
        // place (D5's error-shape-normalization requirement).
        if (!(err instanceof FsmError) || err.category !== 'conflict') throw err;
      }
    }

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

    // Create worktree if isolating. moveWork above already committed the
    // claim durably (tsk-4m0: this was previously unguarded) -- a
    // createClaimWorktree failure here must not leave the item orphaned in
    // `doing` with no branch/worktree and no automatic recovery
    // (startupReap skips human/session claims by design, per
    // docs/history/pick-worktree-claim-race/CONTEXT.md D1/D3). Revert the
    // claim back to expectedStatus before rethrowing, so a failed pick
    // looks like it never happened and a retry sees ordinary CAS semantics.
    //
    // beforeProvision (tsk-1mn, Finding 2): releases main-checkout.lock
    // right before createClaimWorktree's own synchronous `npm ci`/`npm
    // install` step -- the durable state mutation above (moveWork,
    // addOutcome) is already committed by now, and every repoRoot-touching
    // git call this claim makes (`worktree add`/`branch`) has already run
    // by the time this fires (worktree.mjs's own `finishWorktreeSetup` doc).
    // A fully synchronous `execFileSync` blocks the event loop for its whole
    // duration, so a timer-based heartbeat (the fix `withMergeTargetSlot`
    // uses for its own async hold) literally cannot fire here -- shrinking
    // the hold, not renewing it, is the only fix that actually closes the
    // gap: on a cold npm cache exceeding the lock's `ttlMs`, the lock is no
    // longer held at all by then, so there is nothing left for a concurrent
    // writer to wrongly judge stale and reclaim. `lockResult.release()` is
    // idempotent (tsk-45z's own closure) -- the outer `finally` below still
    // calls it unconditionally, safe whether this callback already fired or
    // never got the chance to (creation failed before reaching it).
    if (isolate) {
      let worktree;
      try {
        worktree = createClaimWorktree(repoRoot, id, { worktreeDir, baseRef, beforeProvision: () => lockResult.release() });
      } catch (err) {
        moveWork(dir, { id, to: expectedStatus, expectedStatus: 'doing', role: actor });
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
