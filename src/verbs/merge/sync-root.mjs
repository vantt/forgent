// sync-root.mjs — use case behind `fgos sync-root <root-id>`.
//
// sync-root (tsk-50i, docs/history/tsk-3bn-merge-conductor-harness-v2/):
// merges fgw/<root-id>'s current tip into its real target — `main`, or
// fgw/<parentId> for a nested root — WITHOUT touching the root item's
// own status/stage (CONTEXT.md's locked contract: this replaces the
// ad-hoc `git merge` tsk-3bn's own origin incident required by hand).
// Reuses `landRunnerItem`'s exact Land/verify path (constraint #1,
// fgos-coding-validating's gate) — never a second bespoke merge mechanism.
// Unlike `approve`'s root-into-main path, this never deletes fgw/<id>
// afterward: the root stays open for further leaf merges.
import { listWork, addDecision, recordFriction, StoreError } from '../../state/store.mjs';
import {
  landRunnerItem,
  acknowledgeLand,
  landAcknowledgement,
  isAlreadyMerged,
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
  resolveRefSha,
} from '../../runner/worktree.mjs';
import { ironLawForItem, ironLawRefusal } from '../../runner/iron-law-gate.mjs';
import { readIronLawLevel, recordIronLawSkip, recordIronLawAcknowledge } from './iron-law-level.mjs';

/**
 * @param {{dir: string, repoRoot: string, cwd?: string}} ctx - `repoRoot` follows this
 *   verb's own `--trust-dir` policy; `cwd` remains the adapter's caller checkout.
 * @param {{id: string, resolveTimeoutMs: () => number|undefined, resolveWaitFlags: () => {noWait: boolean, waitMs: number|undefined}, acknowledgeIronLaw: boolean}} options
 */
export async function syncRootUseCase({ dir, repoRoot, cwd = repoRoot }, { id, resolveTimeoutMs, resolveWaitFlags, acknowledgeIronLaw }) {
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
  // Land waits for the target's merge slot and the main checkout up to this
  // budget (no wait under --no-wait, Land's default when no --wait is given).
  const lockWait = noWait ? { lockWaitMs: 0 } : waitMs !== undefined ? { lockWaitMs: waitMs } : {};

  // Land keeps a candidate until Work durably records its result: a decision
  // for every result of this verb, since sync-root never moves `id` (Git
  // spec §9, M4). A retained candidate never negates that result.
  const releaseLand = (landSettlement, event, state) => {
    if (!landSettlement) return;
    for (const warning of acknowledgeLand(repoRoot, landSettlement.operationId, landAcknowledgement(event))) {
      process.stderr.write(`fgos: warning: "${id}" is ${state}; its Land candidate was retained (${warning}).\n`);
    }
  };
  const blocked = (result, response) => {
    if (result.landSettlement) {
      const { event } = addDecision(dir, {
        text: `sync-root: Land operation ${result.landSettlement.operationId} of ${branch} into ${targetBranch} published nothing (${response.reason})`,
        rationale: `fgos sync-root ${id} — records the unpublished result so Land can release its candidate`,
        id,
        kind: 'engine',
        landOperationIds: [result.landSettlement.operationId],
      });
      releaseLand(result.landSettlement, event, 'not synced');
    }
    return response;
  };

  const runAndReport = async (itemOverride, ownFileSet = null) => {
    const result = await landRunnerItem(repoRoot, itemOverride, { target: targetBranch, timeoutMs, ownFileSet, callerCheckout: cwd, ...lockWait });

    if (result.outcome === 'conflict') {
      recordFriction(dir, {
        id,
        disposition: 'blocked',
        errorClass: 'merge-conflict',
        layer: 'state',
        attempts: 1,
        detail: `sync-root: git merge --no-commit --no-ff ${branch} into ${targetBranch} conflicted; merge aborted, ${targetBranch} unchanged`,
      });
      return blocked(result, { id, mode: 'sync-root', outcome: 'blocked', reason: 'merge-conflict', target: targetBranch, branch });
    }
    if (result.outcome === 'fgos-write-rejected') {
      recordFriction(dir, {
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
      recordFriction(dir, {
        id,
        disposition: 'blocked',
        errorClass: result.check.timedOut ? 'verify-timeout' : 'verify-miss',
        layer: 'verification',
        attempts: 1,
        detail: result.check.timedOut
          ? `sync-root: goal-check timed out on staged merge of ${branch} into ${targetBranch} after ${timeoutMs}ms — not a verify failure; merge aborted, ${targetBranch} unchanged`
          : `sync-root: goal-check failed on staged merge of ${branch} into ${targetBranch} (exit ${result.check.status}); merge aborted, ${targetBranch} unchanged`,
      });
      return blocked(result, { id, mode: 'sync-root', outcome: 'blocked', reason: result.check.timedOut ? 'verify-timeout' : 'verify-fail', timedOut: result.check.timedOut, target: targetBranch, branch, exitStatus: result.check.status, output: result.check.output });
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
      // tsk-3tv: thread result.error (when present, e.g. merge-failed-unclassified)
      // into both friction detail and the CLI response object.
      const errText = result.error
        ? ` (exit ${result.error.status}): ${result.error.stderr || result.error.message}`
        : '';
      recordFriction(dir, {
        id,
        disposition: 'blocked',
        errorClass: 'sync-root-unhandled-outcome',
        layer: 'state',
        attempts: 1,
        detail: `sync-root: landRunnerItem returned unrecognized outcome "${result.outcome}" for ${branch} into ${targetBranch}${errText} — refusing to report success`,
      });
      return blocked(result, {
        id,
        mode: 'sync-root',
        outcome: 'blocked',
        reason: result.outcome,
        target: targetBranch,
        branch,
        ...(result.error ? { error: result.error } : {}),
      });
    }

    // Success — status/stage of `id` is deliberately UNTOUCHED (the
    // locked contract). Only a real decision record marks this sync
    // happened, same append door `fgos decision` itself uses.
    const { event } = addDecision(dir, {
      text: `sync-root: merged ${branch} into ${targetBranch} at ${result.receipt?.localEffect.publishedOid ?? resolveRefSha(repoRoot, targetBranch)}`,
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
      ...(result.landSettlement ? { landOperationIds: [result.landSettlement.operationId] } : {}),
    });
    releaseLand(result.landSettlement, event, 'synced');
    return { id, mode: 'sync-root', outcome: 'synced', target: targetBranch, branch, seq: event.seq, output: result.check.output, postLand: result.postLand, promotion: result.promotion };
  };

  if (item.parent) {
    {
      // tsk-4ax (D3): same inbound-gate catchup as approve's leaf-to-root
      // path — through Sync under the branch's own custody, never under the
      // target's slot: Land pins the target only at prepare and merges from
      // that pin, so whatever lands on it meanwhile is included.
      let effectiveItem = item;
      if (!isAlreadyMerged(repoRoot, targetBranch, branch)) {
        const catchupResult = await performCatchUp(repoRoot, id, item, targetBranch, timeoutMs);
        if (catchupResult.outcome === 'conflict') {
          recordFriction(dir, {
            id,
            disposition: 'blocked',
            errorClass: 'merge-conflict',
            layer: 'state',
            attempts: 1,
            detail: `sync-root catchup (inbound gate): git merge --no-commit --no-ff ${targetBranch} into ${branch} conflicted; merge aborted, ${branch} unchanged`,
          });
          return { id, mode: 'sync-root', outcome: 'blocked', reason: 'merge-conflict', target: targetBranch, branch, conflictedFiles: catchupResult.conflictedFiles };
        }
        if (catchupResult.outcome === 'merge-refused') {
          recordFriction(dir, {
            id,
            disposition: 'blocked',
            errorClass: 'merge-fail',
            layer: 'state',
            attempts: 1,
            detail: `sync-root catchup (inbound gate): git merge --no-commit --no-ff ${targetBranch} into ${branch} refused: ${catchupResult.reason}`,
          });
          return { id, mode: 'sync-root', outcome: 'blocked', reason: 'merge-failed-unclassified', target: targetBranch, branch, detail: catchupResult.reason };
        }
        if (catchupResult.outcome === 'verify-fail') {
          recordFriction(dir, {
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
      return await runAndReport(effectiveItem);
    }
  }
  // tsk-66t: a root with no parent lands on the trunk the shared main
  // checkout holds, unlike the item.parent branch above. Same clean-tree
  // gate `approve`'s own root-into-main path applies before any git
  // mutation; Land re-runs it against the same own-file set right before
  // the ref moves (Git spec §9 step 4) and never commits main's own
  // staged changes.
  const ownFileSet = buildOwnFileSet(runnerOwnDiff, item.footprint);
  if (!isMainTreeClean(repoRoot, ownFileSet)) {
    throw new StoreError('validation', `sync-root: working tree at "${repoRoot}" is not clean — commit or stash pending changes before syncing "${id}".`);
  }
  return await runAndReport(item, ownFileSet);
}
