// sync-root.mjs — use case behind `fgos sync-root <root-id>`.
//
// sync-root (tsk-50i, docs/history/tsk-3bn-merge-conductor-harness-v2/):
// merges fgw/<root-id>'s current tip into its real target — `main`, or
// fgw/<parentId> for a nested root — WITHOUT touching the root item's
// own status/stage (CONTEXT.md's locked contract: this replaces the
// ad-hoc `git merge` tsk-3bn's own origin incident required by hand).
// Reuses `mergeRunnerItem`'s exact lock/verify path (constraint #1,
// fgos-coding-validating's gate) — never a second bespoke merge mechanism.
// Unlike `approve`'s root-into-main path, this never deletes fgw/<id>
// afterward: the root stays open for further leaf merges.
import { execFileSync } from 'node:child_process';
import { listWork, addDecision, addFriction, StoreError } from '../../state/store.mjs';
import {
  mergeRunnerItem,
  withMergeTargetSlot,
  performCatchUp,
  buildOwnFileSet,
  isWorkingTreeClean as isMainTreeClean,
  formatFgosWriteRejectedDetail,
} from '../../runner/merge.mjs';
import {
  branchNameFor,
  branchExists,
  detectTrunk,
  isMainWorktree,
  withMergeEphemeralWorktree,
  currentHead,
} from '../../runner/worktree.mjs';
import { ironLawForItem, ironLawRefusal } from '../../runner/iron-law-gate.mjs';
import { readIronLawLevel, recordIronLawSkip, recordIronLawAcknowledge } from './iron-law-level.mjs';
import { withLockRetry } from '../../runner/lock-wait.mjs';

/**
 * @param {{dir: string, repoRoot: string}} ctx - `repoRoot` follows this
 *   verb's own `--trust-dir` policy, resolved by the adapter.
 * @param {{id: string, resolveTimeoutMs: () => number|undefined, resolveWaitFlags: () => {noWait: boolean, waitMs: number|undefined}, acknowledgeIronLaw: boolean}} options
 */
export async function syncRootUseCase({ dir, repoRoot }, { id, resolveTimeoutMs, resolveWaitFlags, acknowledgeIronLaw }) {
  const view = listWork(dir);
  const item = view.work[id];
  if (!item) {
    throw new StoreError('validation', `sync-root: work "${id}" not found.`);
  }

  if (!isMainWorktree(repoRoot)) {
    throw new StoreError(
      'validation',
      `sync-root: refusing to run from "${repoRoot}" — sync-root must land on the main checkout, which a linked worktree structurally is not.`,
    );
  }

  const branch = branchNameFor(id);
  if (!branchExists(repoRoot, branch)) {
    throw new StoreError('validation', `sync-root: branch "${branch}" does not exist — nothing to sync.`);
  }
  const targetBranch = item.parent ? branchNameFor(item.parent) : detectTrunk(repoRoot);
  if (item.parent && !branchExists(repoRoot, targetBranch)) {
    throw new StoreError('validation', `sync-root: target branch "${targetBranch}" (from "${id}"'s parent "${item.parent}") does not exist.`);
  }

  // Iron Law gate — same evidence, same acknowledgment flag, same
  // "refuse before any git mutation" discipline `approve` already
  // applies to a runner-sourced item (source is 'runner' here by
  // construction: branchExists(branch) just confirmed it above).
  const ironLaw = ironLawForItem(repoRoot, item, { trunk: item.parent ? targetBranch : null });
  // Reused further below as the clean-tree gate's `ownFileSet` source,
  // exactly as `approve` reuses its own — one git read, not two.
  const runnerOwnDiff = ironLaw.filesChanged;
  // Trunk-boundary scoping (docs/decisions/0032, tsk-1y6-1 D1) —
  // deliberately NOT `approve`'s own discriminator (resolveRoot(view,id)
  // === id). This verb lands on the DIRECT parent: `targetBranch` above is
  // `fgw/<item.parent>` whenever a parent exists, and only `detectTrunk`
  // when none does. `resolveRoot` climbs to the top of the lineage instead
  // of stopping one level up, so it answers a different question than the
  // one this call site's own target asks; on an item whose parent id is
  // absent from the view it would return the item itself and trip the
  // gate on a merge that never goes near trunk. `!item.parent` is exactly
  // the condition under which this call syncs straight onto trunk.
  if (!item.parent && ironLaw.required) {
    if (acknowledgeIronLaw === true) {
      // tsk-sdr: the acknowledge path used to record nothing at all,
      // leaving a later audit unable to tell "never tripped" apart from
      // "tripped, human acknowledged" for this item.
      recordIronLawAcknowledge(dir, { verb: 'sync-root', id, ironLaw });
    } else if (readIronLawLevel(repoRoot) === 'warn') {
      recordIronLawSkip(dir, { verb: 'sync-root', id, ironLaw });
      process.stderr.write(
        `fgos: sync-root: "${id}" trips the Iron Law, proceeding at ironLaw.level = "warn". `
          + `Matched flags: [${ironLaw.matchedFlags.join(', ') || 'none'}]; matched modules: [${ironLaw.matchedModules.join(', ') || 'none'}].\n`,
      );
    } else {
      throw new StoreError('validation', ironLawRefusal('sync-root', id, ironLaw));
    }
  }

  // Both resolved here and not earlier — the exact positions
  // `case 'sync-root'` resolved them in before the use-case split. The
  // timeout is the first thing in this verb that can WRITE (a missing
  // runner config), and neither parser can refuse before the guards above
  // have had their say, so every refusal above still names the real
  // problem and stays side-effect-free.
  const timeoutMs = resolveTimeoutMs();
  const { noWait, waitMs } = resolveWaitFlags();
  const runMerge = (mergeFn) => (noWait ? mergeFn() : withLockRetry(mergeFn, { waitMs }));

  const runAndReport = async (mergeRoot, lockRoot, targetSlot = false, itemOverride = item) => {
    const result = await runMerge(() => mergeRunnerItem(mergeRoot, itemOverride, lockRoot ? { timeoutMs, lockRoot, targetSlot } : { timeoutMs }));

    if (result.outcome === 'conflict') {
      addFriction(dir, {
        id,
        disposition: 'blocked',
        errorClass: 'merge-conflict',
        layer: 'state',
        attempts: 1,
        detail: `sync-root: git merge --no-commit --no-ff ${branch} into ${targetBranch} conflicted; merge aborted, ${targetBranch} unchanged`,
      });
      return { id, mode: 'sync-root', outcome: 'blocked', reason: 'merge-conflict', target: targetBranch, branch };
    }
    if (result.outcome === 'fgos-write-rejected') {
      addFriction(dir, {
        id,
        disposition: 'blocked',
        errorClass: 'fgos-write-blocked',
        layer: 'state',
        attempts: 1,
        detail: `sync-root: ${formatFgosWriteRejectedDetail(branch, result.paths, targetBranch)}`,
      });
      return { id, mode: 'sync-root', outcome: 'blocked', reason: 'fgos-write-rejected', target: targetBranch, branch, paths: result.paths };
    }
    if (result.outcome === 'verify-fail') {
      // tsk-53o: a timeout is not proof the staged merge's verify failed.
      addFriction(dir, {
        id,
        disposition: 'blocked',
        errorClass: result.check.timedOut ? 'verify-timeout' : 'verify-miss',
        layer: 'verification',
        attempts: 1,
        detail: result.check.timedOut
          ? `sync-root: goal-check timed out on staged merge of ${branch} into ${targetBranch} after ${timeoutMs}ms — not a verify failure; merge aborted, ${targetBranch} unchanged`
          : `sync-root: goal-check failed on staged merge of ${branch} into ${targetBranch} (exit ${result.check.status}); merge aborted, ${targetBranch} unchanged`,
      });
      return { id, mode: 'sync-root', outcome: 'blocked', reason: result.check.timedOut ? 'verify-timeout' : 'verify-fail', timedOut: result.check.timedOut, target: targetBranch, branch, exitStatus: result.check.status, output: result.check.output };
    }

    if (result.outcome !== 'merged') {
      // tsk-4hj D4: defensive guard against any outcome this call site
      // does not explicitly recognize above (today:
      // 'merge-blocked-other-item', 'merge-failed-unclassified') --
      // without this, an unhandled outcome fell through unguarded to
      // the success block below, and sync-root silently reported
      // { outcome: 'synced' } for a merge that never actually
      // completed. Deliberately never lists specific outcome strings
      // here (unlike the named branches above) -- this guard's whole
      // point is to catch whatever this call site doesn't already
      // handle by name, today and for any outcome added later.
      addFriction(dir, {
        id,
        disposition: 'blocked',
        errorClass: 'sync-root-unhandled-outcome',
        layer: 'state',
        attempts: 1,
        detail: `sync-root: mergeRunnerItem returned unrecognized outcome "${result.outcome}" for ${branch} into ${targetBranch} — refusing to report success`,
      });
      return { id, mode: 'sync-root', outcome: 'blocked', reason: result.outcome, target: targetBranch, branch };
    }

    // Success — status/stage of `id` is deliberately UNTOUCHED (the
    // locked contract). Only a real decision record marks this sync
    // happened, same append door `fgos decision` itself uses.
    const { event } = addDecision(dir, {
      text: `sync-root: merged ${branch} into ${targetBranch} at ${currentHead(mergeRoot)}`,
      rationale: `fgos sync-root ${id} — closes the drift window this item's own design exists to prevent`,
      id,
      // Engine bookkeeping, not reflection: a branch sync is machinery
      // this verb performs, never someone thinking about the work. The
      // record stays fully visible in `fgos show` (which filters
      // decisions by id, never by kind) -- but `kind` is what stops it
      // counting as retrospective content at the cleanup gate
      // (`checkRetrospectiveContent`). Without it addDecision defaults
      // to `kind: 'design'` (store.mjs), actively labelling a merge as
      // a design decision, and any synced root could reach `done` with
      // no retrospective document behind it.
      kind: 'engine',
    });
    return { id, mode: 'sync-root', outcome: 'synced', target: targetBranch, branch, seq: event.seq, output: result.check.output, postLand: result.postLand };
  };

  if (item.parent) {
    // tsk-xyr (§E): same target-slot-outside-the-ephemeral-worktree
    // ordering as approve's leaf-to-root path above — the slot must be
    // held before createDetachedMergeWorktree reads the target's tip.
    // tsk-5k4: withLockRetry must wrap the call that can actually throw
    // lock-held (withMergeTargetSlot's own acquire) — runMerge alone
    // around the inner mergeRunnerItem(...,{targetSlot:true}) below
    // never catches anything, since that path skips its own lock
    // acquire entirely once the caller already holds the target's slot.
    return await runMerge(() => withMergeTargetSlot(repoRoot, targetBranch, async () => {
      // tsk-4ax (D3): same inbound-gate catchup as approve's leaf-to-root
      // path — still inside the slot, so the target provably cannot
      // move between this check and the land below.
      let effectiveItem = item;
      let alreadyAncestor = false;
      try {
        execFileSync('git', ['merge-base', '--is-ancestor', targetBranch, branch], { cwd: repoRoot, encoding: 'utf8', shell: false });
        alreadyAncestor = true;
      } catch (ancestorErr) {
        if (ancestorErr.status !== 1) throw ancestorErr;
      }
      if (!alreadyAncestor) {
        const catchupResult = await performCatchUp(repoRoot, id, item, targetBranch, timeoutMs);
        if (catchupResult.outcome === 'conflict') {
          addFriction(dir, {
            id,
            disposition: 'blocked',
            errorClass: 'merge-conflict',
            layer: 'state',
            attempts: 1,
            detail: `sync-root catchup (inbound gate): git merge --no-commit --no-ff ${targetBranch} into ${branch} conflicted; merge aborted, ${branch} unchanged`,
          });
          return { id, mode: 'sync-root', outcome: 'blocked', reason: 'merge-conflict', target: targetBranch, branch, conflictedFiles: catchupResult.conflictedFiles };
        }
        if (catchupResult.outcome === 'verify-fail') {
          addFriction(dir, {
            id,
            disposition: 'blocked',
            errorClass: catchupResult.timedOut ? 'verify-timeout' : 'verify-miss',
            layer: 'verification',
            attempts: 1,
            detail: catchupResult.timedOut
              ? `sync-root catchup (inbound gate): goal-check timed out on staged merge into ${branch} after ${timeoutMs}ms — not a verify failure; merge aborted, ${branch} unchanged`
              : `sync-root catchup (inbound gate): goal-check failed on staged merge into ${branch} (exit ${catchupResult.exitStatus}); merge aborted, ${branch} unchanged`,
          });
          return { id, mode: 'sync-root', outcome: 'blocked', reason: catchupResult.timedOut ? 'verify-timeout' : 'verify-fail', timedOut: catchupResult.timedOut, target: targetBranch, branch, exitStatus: catchupResult.exitStatus, output: catchupResult.output };
        }
        effectiveItem = { ...item, branchHeadAtReturn: catchupResult.catchupHead };
      }
      return await withMergeEphemeralWorktree(repoRoot, item.parent, async (ephemeral) => runAndReport(ephemeral.path, repoRoot, true, effectiveItem));
    }));
  }
  // tsk-66t: a root with no parent merges directly on the shared main
  // checkout (runAndReport(repoRoot) below), unlike the item.parent
  // branch above which merges in a throwaway ephemeral worktree. Same
  // clean-tree gate `approve`'s own local-merge branch already applies
  // before any git mutation (bin/fgos.mjs's `case 'approve'`) — without
  // it, a dirty repoRoot here means `git commit --no-edit` (merge.mjs's
  // mergeRunnerItem) sweeps another session's staged changes into this
  // merge commit silently.
  const ownFileSet = buildOwnFileSet(runnerOwnDiff, item.footprint);
  if (!isMainTreeClean(repoRoot, ownFileSet)) {
    throw new StoreError('validation', `sync-root: working tree at "${repoRoot}" is not clean — commit or stash pending changes before syncing "${id}".`);
  }
  return await runAndReport(repoRoot);
}
