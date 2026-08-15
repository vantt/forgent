// merge.mjs — use cases behind `fgos merge list` and `fgos merge next`.
//
// Request-class per D1 (same contract as `ready`/`triage`/`conflicts`): a
// pure read. Merge-readiness ranking (docs/history/merge-standardization/
// CONTEXT.md/plan.md): "list" surfaces which `proposed` items are
// actually ready to merge right now (dependency-wait gate clear, no
// footprint conflict), ordered by `rankImpact`, alongside which ones are
// still waiting on an unmerged dep and which are footprint-conflicted.
// Wraps `mergeReadiness` (`src/state/graph-harness.mjs`) — never
// reimplements the ranking here.
import { listWork, StoreError } from '../../state/store.mjs';
import { resolveRoot } from '../../state/frontier.mjs';
import { mergeReadiness, mergeTree } from '../../state/graph-harness.mjs';
import { driftStatus } from '../../state/drift-status.mjs';
import { classifySource } from '../../runner/merge.mjs';
import { detectTrunk } from '../../runner/worktree.mjs';
import { ironLawForItem } from '../../runner/iron-law-gate.mjs';
import { readIronLawLevel } from './iron-law-level.mjs';
import { approveUseCase } from './approve.mjs';
import { syncRootUseCase } from './sync-root.mjs';

/**
 * `driftStatus` (tsk-2u0) is computed once per call and handed into the
 * pure `mergeReadiness` as `opts.drift` — `mergeReadiness` itself never
 * shells git (stays pure), this layer does the one real, read-only git read
 * that populates `blockedOnSync`. Best-effort: a repo-less/detached cwd
 * still returns a usable ranking (`driftStatus` just reports no roots),
 * same "read never throws on a legacy shape" posture `review`'s own diff
 * already has.
 */
function readDrift(cwd, view) {
  return driftStatus(cwd, view, { trunk: detectTrunk(cwd) });
}

/** @param {{dir: string, cwd: string}} ctx */
export function mergeList({ dir, cwd }) {
  const mergeView = listWork(dir);
  const drift = readDrift(cwd, mergeView);
  // tsk-2x9k D1/D4: mergeReadiness's own return shape stays
  // untouched (4 existing tests do an exact deepEqual against it) --
  // `tree` is composed here, one layer up, never spread into that
  // object directly.
  const readiness = mergeReadiness(mergeView, { drift });
  return { ...readiness, tree: mergeTree(mergeView, readiness, { drift }) };
}

/**
 * Picks the single top-ranked ready item and merges it by calling the SAME
 * `approve` use case directly (never a parallel merge path, D6,
 * docs/history/merge-standardization/CONTEXT.md). The options for
 * `approve`/`sync-root` are built ONCE by the adapter and forwarded whole —
 * this never injects `acknowledge-iron-law` itself (D7): the Iron Law gate
 * (D16/D17) exists specifically to require a human-verified failing-test-
 * first proof before a self-modifying diff lands, so an unattended
 * `merge next` run must never be able to silently satisfy that proof on its
 * own authority. If the top pick trips it, this reports which item and why,
 * merges nothing, and stops — it does NOT fall through to the next-ranked
 * item (that would silently change merge order semantics `merge list`
 * already promised).
 *
 * @param {{dir: string, cwd: string, repoRoot: string}} ctx - `cwd` reads
 *   drift, `repoRoot` follows the `--trust-dir` policy and is what both
 *   forwarded use cases run against, exactly as the recursive `runVerb`
 *   call resolved it before.
 * @param {{acknowledgeIronLaw: boolean, approveOptions: object, syncRootOptions: object}} options
 */
export async function mergeNext({ dir, cwd, repoRoot }, { acknowledgeIronLaw, approveOptions, syncRootOptions }) {
  const mergeView = listWork(dir);
  const drift = readDrift(cwd, mergeView);

  // tsk-xyr (absorbs tsk-1zd): decide, WITHOUT attempting a merge,
  // whether `candidateId` provably cannot progress this turn.
  // `ironLawForItem` is the same gate approve's own Iron Law
  // pre-check runs (src/runner/iron-law-gate.mjs) -- reusing it
  // here (source==='runner' only; a pull/legacy item never trips it)
  // lets the picker decide this WITHOUT running the real merge
  // attempt approve would make, and without persisting a skip list
  // (the gate is cheap and recomputable every call, so there is
  // nothing to go stale).
  const wouldTripIronLaw = (candidateId) => {
    if (acknowledgeIronLaw === true) return false;
    // Trunk-boundary scoping (docs/decisions/0032, tsk-1y6-1 D1): at
    // `warn` the real gate inside `approveUseCase` below never refuses, so
    // a candidate this pre-check parked would be a skip nothing was ever
    // going to block.
    if (readIronLawLevel(repoRoot) === 'warn') return false;
    const candidate = mergeView.work[candidateId];
    if (!candidate || classifySource(repoRoot, candidate) !== 'runner') return false;
    // The gate only guards the trunk boundary. This mirrors `approve`'s
    // own merge-target split — a candidate whose resolved root is some
    // other item lands on `fgw/<root>`, so it goes straight through here
    // exactly as it will there.
    if (resolveRoot(mergeView, candidateId) !== candidateId) return false;
    return ironLawForItem(repoRoot, candidate, { view: mergeView }).required;
  };

  const { ready, blockedOnSync } = mergeReadiness(mergeView, { drift });
  // tsk-173 (docs/history/merge-next-auto-sync-root/CONTEXT.md D1/D2):
  // before giving up, try the single top-ranked blockedOnSync root
  // through `sync-root` — one mutation per call, same "no parallel
  // merge mechanism" contract the approve path below already holds.
  // `picked` is ALWAYS the resolved root id on a real attempt here,
  // NEVER null: `picked: null` collides with merge-loop's own
  // frontier-empty bullet (SKILL.md step 4), which would otherwise
  // silently swallow a real merge-conflict/Iron-Law block as if
  // nothing were wrong — the exact invisibility this item exists to
  // fix, one level down (validated against the real skill file during
  // fgos-coding-validating).
  if (ready.length === 0 && blockedOnSync.length > 0) {
    const rootId = resolveRoot(mergeView, blockedOnSync[0]);
    try {
      const syncResult = await syncRootUseCase({ dir, repoRoot }, { ...syncRootOptions, id: rootId });
      if (syncResult.outcome === 'synced') {
        const freshView = listWork(dir);
        const freshDrift = readDrift(cwd, freshView);
        const { ready: readyAfterSync } = mergeReadiness(freshView, { drift: freshDrift });
        if (readyAfterSync.length === 0) {
          return { picked: null, reason: 'nothing ready to merge', syncRoot: { id: rootId, outcome: 'synced' } };
        }
        const syncedId = readyAfterSync[0];
        try {
          const approveResult = await approveUseCase({ dir, repoRoot }, { ...approveOptions, id: syncedId });
          return { picked: syncedId, approve: approveResult, syncRoot: { id: rootId, outcome: 'synced' } };
        } catch (err) {
          if (err instanceof StoreError && err.message.includes('Iron Law')) {
            return { picked: syncedId, blocked: 'iron-law', message: err.message, syncRoot: { id: rootId, outcome: 'synced' } };
          }
          throw err;
        }
      }
      // sync-root's own 'blocked' outcome (merge-conflict /
      // fgos-write-rejected / verify-fail) — no retry, no fallback to
      // a different blockedOnSync candidate (D2).
      return { picked: rootId, blocked: syncResult.reason, syncRoot: syncResult };
    } catch (err) {
      if (err instanceof StoreError && err.message.includes('Iron Law')) {
        return { picked: rootId, blocked: 'iron-law', message: err.message, syncRoot: { id: rootId } };
      }
      // tsk-66t: sync-root's own dirty-tree gate refuses the
      // same way Iron Law does — recognized here the same way, so an
      // unattended `merge next`/merge-loop run gets the graceful
      // `{picked, blocked, syncRoot}` shape merge-loop/SKILL.md's own
      // same-id-blocked-twice rule already parses, instead of an
      // uncaught exit-4 crash.
      if (err instanceof StoreError && err.message.includes('is not clean')) {
        return { picked: rootId, blocked: 'dirty-tree', message: err.message, syncRoot: { id: rootId } };
      }
      throw err;
    }
  }
  if (ready.length === 0) {
    return { picked: null, reason: 'nothing ready to merge' };
  }
  // tsk-xyr (absorbs tsk-1zd): walk the ranked list, skipping any
  // candidate the pure pre-check already proves can't progress this
  // turn, instead of always returning ready[0] and letting a caller
  // loop on the same blocked item forever (tsk-2ej's own measured 13
  // repeats). "nothing ready" and "everything ready was skipped" are
  // deliberately DISTINCT reasons here — merge-loop's own pool-empty
  // stop rule depends on telling them apart (a genuinely empty ready
  // list means stop; an all-skipped one means a human is needed on
  // at least one of the skipped items, not that the pool is empty).
  const skipped = [];
  let id;
  for (const candidateId of ready) {
    if (wouldTripIronLaw(candidateId)) {
      skipped.push({ id: candidateId, reason: 'iron-law' });
      continue;
    }
    id = candidateId;
    break;
  }
  if (id === undefined) {
    return { picked: null, reason: 'every ready item is blocked', skipped };
  }
  try {
    const approveResult = await approveUseCase({ dir, repoRoot }, { ...approveOptions, id });
    return { picked: id, approve: approveResult, ...(skipped.length > 0 ? { skipped } : {}) };
  } catch (err) {
    if (err instanceof StoreError && err.message.includes('Iron Law')) {
      // The pure pre-check said this one was safe, but the gate
      // is recomputed fresh inside approve too (never cached) -- a
      // description/diff change between the pre-check and this real
      // attempt (another session editing the item concurrently) can
      // still surface it here. Reported exactly as before; this is
      // not the "provable in advance" case the pre-check targets.
      return { picked: id, blocked: 'iron-law', message: err.message, ...(skipped.length > 0 ? { skipped } : {}) };
    }
    throw err;
  }
}
