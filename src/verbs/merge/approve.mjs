// approve.mjs — use case behind `fgos approve <id>`.
//
// Cổng duyệt — approve (pr-lifecycle D3/D4): merges a runner item's
// branch into main (spike-proven mechanics: --no-commit --no-ff, verify
// on the staged tree, commit only on green — runner/merge.mjs's
// mergeRunnerItem) or, for a pull-door/legacy item (code already on main),
// re-runs the item's OWN verify directly against the current tree. Every
// failure path (conflict, red verify) parks the item at `blocked` with a
// reason instead of leaving main mid-merge or the item silently in
// `proposed` (D3's "merge sạch → done tự động; conflict/đỏ → hủy sạch +
// blocked"). `done`'s role is always "human" (D3: the person who ran
// approve is the settlement, the merge itself is only the mechanical
// consequence).
//
// Moved here whole from bin/fgos.mjs (tsk-49i D3) — a relocation, never a
// decomposition: the CLI test suite asserts on individual payload fields
// rather than deep-equalling the whole object, so every return branch has
// to keep its exact shape and every guard its exact order.
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  listWork,
  moveWork,
  addFriction,
  assertAcceptanceEvidence,
  assertPlanEvidence,
  StoreError,
} from '../../state/store.mjs';
import { EventLogError } from '../../state/events.mjs';
import { resolveRoot, isResolvedStatus } from '../../state/frontier.mjs';
import { driftStatus } from '../../state/drift-status.mjs';
import {
  classifySource,
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
  createBranchRef,
  withMergeEphemeralWorktree,
  detectTrunk,
  isMainWorktree,
  currentHead,
  resolveRefSha,
  realpathOrSelf as realpathOr,
} from '../../runner/worktree.mjs';
import { ironLawForItem, ironLawRefusal } from '../../runner/iron-law-gate.mjs';
import { readIronLawLevel, recordIronLawSkip, recordIronLawAcknowledge } from './iron-law-level.mjs';
import { withLockRetry } from '../../runner/lock-wait.mjs';
import { listSessions } from '../../runner/session.mjs';
import { runGoalCheck } from '../../runner/goal-check.mjs';
import { mergeGitHubPR } from '../../runner/github-adapter.mjs';
import { recordApprovePostSuccessFault } from '../../cli/approve-fault-log.mjs';

// tsk-480: approve's own success paths (merge landed, or verify-only
// passed) call `moveWork(...to:'delivered'...)` as their very last
// step. That write can throw on `events.lock` contention even though
// the precondition it's recording already succeeded permanently —
// without a guard, the exception would propagate uncaught, and (per
// `invocation-fault-log.mjs`'s own documented scope) a fault raised
// this deep inside a verb's handler is deliberately never recorded by
// that mechanism either, so nothing at all would be left to explain
// why a real merge landed while the item stayed `awaiting-approval`
// forever (CONTEXT.md D1). This wraps exactly that one call: on
// success, returns the real event; on failure, records a diagnostic
// through `approve-fault-log.mjs` (D2 — no shared lock with
// `events.jsonl`) and returns `event: null` instead of throwing, so
// every call site can still finish its own cleanup and return a
// truthful envelope.
function moveDeliveredOrRecordFault(dir, id, phase, testForceLockTimeoutId, { mergedSha, mergedInto } = {}) {
  try {
    recordApprovePostSuccessFault(dir, { id, phase, mergedSha, mergedInto });
    // Test-only failure seam (tsk-480 D3), same shape as
    // FGOS_GH_COMMAND: the env var itself is read by the CLI adapter and
    // arrives here as `testForceLockTimeoutId` (a use case never reads
    // process.env), scoped to the exact item id so it can never affect
    // any other item in the same process, inert unless a test
    // explicitly sets it. Production code never sets that variable.
    if (testForceLockTimeoutId === id) {
      throw new EventLogError('lock-timeout', `approve: simulated lock-timeout for "${id}" (FGOS_TEST_FORCE_APPROVE_LOCK_TIMEOUT)`);
    }
    const { event } = moveWork(dir, { id, to: 'delivered', expectedStatus: 'awaiting-approval', role: 'human', mergedSha, mergedInto });
    return { event, error: null, diagnosticLog: null };
  } catch (err) {
    // Only an EventLogError (the write itself failing — e.g.
    // 'lock-timeout', src/state/events.mjs) is the class of failure
    // this guard exists for. A StoreError from transitionWork's own
    // precondition/CAS check (e.g. a missing-evidence acceptance
    // clause) is a legitimate refusal that must keep propagating
    // exactly as before — swallowing it here would silently accept an
    // item transitionWork correctly refused.
    if (!(err instanceof EventLogError)) {
      throw err;
    }
    const diagnosticLog = recordApprovePostSuccessFault(dir, { id, phase, detail: err.message, mergedSha, mergedInto });
    process.stderr.write(
      `fgos: warning: "${id}" ${phase} succeeded but its status write failed (${err.message}); `
        + `item status remains "awaiting-approval" pending manual reconciliation; `
        + `diagnostic recorded to ${diagnosticLog ?? '(unrecorded — see this stderr line)'}.\n`,
    );
    return { event: null, error: err, diagnosticLog };
  }
}

/**
 * @param {{dir: string, repoRoot: string}} ctx - `repoRoot` follows this
 *   verb's own `--trust-dir` policy, resolved by the adapter.
 * @param {{id: string, resolveTimeoutMs: () => number|undefined, resolveWaitFlags: () => {noWait: boolean, waitMs: number|undefined},
 *   github: boolean, prNumber: string|undefined, ghCommand: string,
 *   acknowledgeIronLaw: boolean, acknowledgeDrift: boolean,
 *   testForceLockTimeoutId: string|null}} options
 */
export async function approveUseCase(
  { dir, repoRoot },
  { id, resolveTimeoutMs, resolveWaitFlags, github, prNumber, ghCommand, acknowledgeIronLaw, acknowledgeDrift, testForceLockTimeoutId },
) {
  // Both resolved first, before any guard, and in this order — the exact
  // positions `case 'approve'` resolved them in before the use-case split,
  // so a run that then refuses still touches the runner config, and still
  // refuses a malformed flag, exactly when it always did.
  const timeoutMs = resolveTimeoutMs();
  const { noWait, waitMs } = resolveWaitFlags();
  const runMerge = (mergeFn) => (noWait ? mergeFn() : withLockRetry(mergeFn, { waitMs }));

  const view = listWork(dir);
  const item = view.work[id];
  if (!item) {
    throw new StoreError('validation', `approve: work "${id}" not found.`);
  }
  if (item.status !== 'awaiting-approval') {
    throw new StoreError('precondition', `approve: work "${id}" is "${item.status}", not "awaiting-approval" — nothing to approve.`);
  }

  const source = classifySource(repoRoot, item);

  // Multi-session guard (fgos-multi-session-checkout Epic 2): approve must
  // never run with cwd inside a registered session worktree. One refusal,
  // covering BOTH non-github source paths, each dangerous for its own reason:
  //   - runner: the merge below lands on the session's own detached HEAD,
  //     never main (spike-proven) — a silent "approved" item whose code
  //     never reaches main.
  //   - pull/legacy: runGoalCheck below verifies whatever cwd has checked
  //     out; a session worktree sits at its startCommit, which may predate
  //     later advances to main, so this would verify STALE code while the
  //     "verified on main" message claims otherwise, marking the item done
  //     regardless — a silent false verification.
  // Refuses BEFORE any git command or verify run: the item stays proposed,
  // main untouched. Runs BEFORE the --github branch too (approve-worktree-
  // guard-github-fix D1): a GitHub-side merge is server-side and never
  // touches the local tree, but the local checkout's own IDENTITY — is
  // this even the main worktree? — is a more fundamental precondition than
  // which transport approve uses, so it is checked first for every source.
  // Registry-based: an ad-hoc `git worktree add` never created through
  // `fgos session start` is invisible to this guard (CONTEXT.md Deferred
  // Ideas — ad-hoc unregistered worktree residual risk); the structural
  // check right below catches that case.
  const approveCwdReal = realpathOr(repoRoot);
  for (const session of listSessions(repoRoot)) {
    const wtReal = realpathOr(session.worktreePath);
    if (approveCwdReal === wtReal || approveCwdReal.startsWith(`${wtReal}${path.sep}`)) {
      throw new StoreError(
        'validation',
        `approve: refusing to run from inside session "${session.sessionId}" worktree at "${wtReal}" — approve must land on the main checkout, which a session worktree structurally is not. Run approve from the main checkout, or end the session first with "fgos session end ${session.sessionId}".`,
      );
    }
  }

  // Structural guard (P44): the registry loop above only catches a
  // worktree registered via `fgos session start`. A plain `git worktree
  // add` run by hand is invisible to sessions.json, so it slipped through
  // untouched — same false-verification risk (merge lands on that
  // worktree's own checkout, or goal-check verifies its own possibly-stale
  // tree, while the item is reported "done"/"verified on main"), just
  // unregistered instead of registered. isMainWorktree reads git's own
  // common-dir structure, so it catches ANY linked worktree regardless of
  // how it was created. Also runs BEFORE the --github branch, same
  // rationale as the registry loop above (approve-worktree-guard-github-
  // fix D1).
  if (!isMainWorktree(repoRoot)) {
    throw new StoreError(
      'validation',
      `approve: refusing to run from "${repoRoot}" — this is a git worktree, not the repository's main working tree, whether or not it was created through "fgos session start". Run approve from the main checkout.`,
    );
  }

  // Close-out drift guard (tsk-62y, docs/history/
  // tsk-3bn-merge-conductor-harness-v2/): tsk-3bn's own origin incident
  // was closing a milestone (a `targets`-bearing item) while ONE of its
  // targets' resolved root branches had drifted ahead of main from a
  // later leaf merge — nothing warned or blocked it. `targets` is the
  // real, already-existing field a milestone uses ("a milestone's
  // targets are ordinary work ids", work.mjs). Only runs when `targets`
  // is a non-empty array — an ordinary (non-milestone) approve is
  // completely unaffected. Refuses BEFORE any git mutation, same
  // "acknowledge to override" shape as the Iron Law gate right below —
  // `--acknowledge-drift` is a deliberate human override, not a bypass
  // to route around silently.
  if (Array.isArray(item.targets) && item.targets.length > 0) {
    const drift = driftStatus(repoRoot, view, { trunk: detectTrunk(repoRoot) });
    const driftedTargets = [];
    for (const targetId of item.targets) {
      if (!view.work[targetId]) continue;
      const targetRoot = resolveRoot(view, targetId);
      const status = drift[targetRoot];
      if (status?.needsSync) {
        driftedTargets.push({ targetId, root: targetRoot, ...status });
      }
    }
    if (driftedTargets.length > 0 && acknowledgeDrift !== true) {
      const summary = driftedTargets
        .map((d) => `${d.targetId} (root ${d.root}: ${d.branch} is ${d.aheadOfTarget} commit(s) ahead of ${d.target})`)
        .join(', ');
      throw new StoreError(
        'validation',
        `approve: "${id}" targets item(s) whose root branch has unsynced drift: ${summary}. `
          + `Run "fgos sync-root <root-id>" first, or re-run with --acknowledge-drift to close anyway.`,
      );
    }
  }

  // Resolved-root guard (tsk-4s0, piece 2 of tsk-4qu's leaf-merge-into-
  // resolved-root fix): a leaf approved after its own resolved root
  // (walked via resolveRoot, same as the Iron Law/targets checks below)
  // has already gone delivered/retrospective/cleanup/done/wontfix would
  // land on a branch nothing else will ever sync to main (driftStatus's
  // needsSync is deliberately false for a resolved root, so nothing
  // else catches this — docs/history/leaf-merge-into-resolved-root/
  // CONTEXT.md D2). Hoisted here, ahead of the --github branch, for the
  // exact same reason the Iron Law gate right below was hoisted (f01):
  // a check that only lived in the local-merge branch let --github
  // bypass it entirely. Same "acknowledge to override" shape as the
  // targets drift guard just above — --acknowledge-drift is reused
  // rather than a new flag, since this is the same class of hazard
  // (an unsynced/closed-out root branch) just keyed on the leaf's own
  // parent chain instead of item.targets.
  {
    const ownRootId = resolveRoot(view, id);
    if (ownRootId !== id) {
      const ownRoot = view.work[ownRootId];
      if (isResolvedStatus(ownRoot) && acknowledgeDrift !== true) {
        throw new StoreError(
          'validation',
          `approve: "${id}"'s root "${ownRootId}" is already "${ownRoot?.status}" — merging into "${branchNameFor(ownRootId)}" would strand this work on a branch nothing else will sync to main. `
            + `Run "fgos sync-root ${ownRootId}" first, or re-run with --acknowledge-drift to merge anyway.`,
        );
      }
    }
  }

  // Iron Law gate (D16/D17), hoisted ahead of the --github branch —
  // review-20260718-self-improve-loop finding f01: this check previously
  // lived only inside the local-merge branch further below, so `approve
  // --github` could land the exact same self-modifying diff without ever
  // consulting it — a complete, structural bypass of the loop's own hard
  // gate, contradicting D16's "one common point for every runner-sourced
  // proposal, not just the local path". One check point now guards BOTH
  // merge transports identically, before either can run. changedFiles
  // diffs the item's own branch against its resolved root's branch (the
  // same D3 leaf-vs-root split already used for the human-viewable diff,
  // the GitHub PR base, the real merge target, and `catchup`'s target —
  // never blind trunk for a leaf) so the file set reflects the item's
  // own real diff, not every ancestor commit's files too
  // (tsk-4voj-iron-law-leaf-scope CONTEXT.md D1; previously a leaf
  // over-reported its file set, which is why this comment used to call
  // that the "fail-safe direction, accepted as-is" — superseded, see
  // CONTEXT.md D1). Refuses BEFORE any git mutation or GitHub call: the
  // item stays `proposed`, nothing is touched, neither transport is
  // reached. Hoisted alongside the Iron Law gate (tsk-598 D1/D2): the
  // local-merge branch's own clean-tree check, further below, reuses
  // this exact array as its ownFileSet source instead of recomputing
  // the same diff a second time.
  let runnerOwnDiff;
  if (source === 'runner') {
    // The gate resolves the diff base itself (iron-law-gate.mjs): the
    // item's own resolved-root branch when it exists, the repo trunk
    // otherwise — a resolved root without its own branch (e.g. a
    // milestone root still at stage `clarify`/`todo`, never itself
    // taken/executed) has no `fgw/<root>` ref to diff against.
    const ironLaw = ironLawForItem(repoRoot, item, { view });
    runnerOwnDiff = ironLaw.filesChanged;
    // Trunk-boundary scoping (docs/decisions/0032, tsk-1y6-1 D1): the gate
    // only guards the merge that actually lands on trunk. A leaf merges
    // into `fgw/<root>` (the `rootId !== id` path further below), where
    // nothing reaches main and no unreviewed self-modifying diff can land
    // — so the gate stays quiet there and asks only where it still
    // matters. `resolveRoot(view, id) === id` is exactly the condition
    // under which this call instead merges root-into-trunk.
    if (resolveRoot(view, id) === id) {
      // review-20260718-self-improve-loop finding f02: only the bare flag
      // (parsed as boolean `true`, no following value) counts as
      // acknowledgment; any value form (e.g. a stray "false") fails closed.
      if (ironLaw.required) {
        if (acknowledgeIronLaw === true) {
          // tsk-sdr: the acknowledge path used to record nothing at all,
          // leaving a later audit unable to tell "never tripped" apart from
          // "tripped, human acknowledged" for this item.
          recordIronLawAcknowledge(dir, { verb: 'approve', id, ironLaw });
        } else if (readIronLawLevel(repoRoot) === 'warn') {
          recordIronLawSkip(dir, { verb: 'approve', id, ironLaw });
          process.stderr.write(
            `fgos: approve: "${id}" trips the Iron Law, proceeding at ironLaw.level = "warn". `
              + `Matched flags: [${ironLaw.matchedFlags.join(', ') || 'none'}]; matched modules: [${ironLaw.matchedModules.join(', ') || 'none'}].\n`,
          );
        } else {
          throw new StoreError('validation', ironLawRefusal('approve', id, ironLaw));
        }
      }
    }
  }

  // GitHub transport (github-adapter D1/D3/D5): `approve <id> --github --pr
  // <n>` merges a prior `review --github` PR through GitHub instead of a
  // local git merge. Dispatched BEFORE the runner block's dirty-main-tree
  // gate: a GitHub-side merge never touches the local working tree, so
  // `isMainTreeClean` (which exists only because a LOCAL merge mutates
  // the tree) must not gate it. The Iron Law gate above DOES gate this
  // branch now (hoisted, f01). The source gate is checked BEFORE the
  // --pr presence check so a pull/legacy item always gets the
  // runner-sourced error, never a misleading "missing --pr" message for an
  // item that could never have a PR. Runs AFTER the worktree-identity
  // guards above (approve-worktree-guard-github-fix D1/D3): environment
  // validity (is this even a valid worktree to approve from) is checked
  // before business-logic validity (is this item's source compatible with
  // --github) — an accepted, documented precedence change for the narrow
  // combination of --github + a non-runner-sourced item + a linked
  // worktree, which now sees the worktree-identity refusal instead of this
  // block's own source-mismatch message.
  if (github) {
    if (source !== 'runner') {
      throw new StoreError('validation', `approve --github: "${id}" is a ${source}-sourced item — GitHub approval requires a runner-sourced item with a live fgw/${id} branch (no branch exists to attach a PR to for pull/legacy items).`);
    }
    // Same refusal `requireField` produces in the adapter: absent,
    // empty, or bare (parsed as boolean `true`) all mean "no value given".
    if (prNumber === undefined || prNumber === null || prNumber === '' || prNumber === true) {
      throw new StoreError('validation', 'approve --github requires --pr <n> (the GitHub PR number from a prior review --github)');
    }
    // Acceptance-evidence pre-flight (tsk-396 D2): checked BEFORE the
    // real GitHub-side merge, not caught after the fact inside
    // moveWork's own `to === 'delivered'` check — a GitHub merge can't
    // be `git merge --abort`ed the way a local one can, so this matters
    // even more here than on the local paths above.
    assertAcceptanceEvidence(id, item);
    assertPlanEvidence(id, item, repoRoot);
    const result = await mergeGitHubPR(repoRoot, prNumber, { ghCommand });
    if (result.outcome === 'merged') {
      // Accepted rough edge (this slice): unlike the local merged path, no
      // cleanupMergedBranch runs — the local fgw/<id> branch and its pushed
      // origin copy are both left in place after a server-side merge (no
      // local cleanup mechanism exists for a branch merged on GitHub).
      // tsk-5dk D2: mergeCommit comes from mergeGitHubPR's own post-merge
      // status read (github-adapter.mjs) — may be undefined if GitHub's
      // eventual consistency hasn't attached it yet (accepted rough
      // edge, same as the module's own doc comment); mergedInto matches
      // the literal 'main' the local root-into-main path already uses.
      const mergedSha = result.mergeCommit?.oid;
      recordApprovePostSuccessFault(dir, { id, phase: 'github merge', mergedSha, mergedInto: 'main' });
      const { event } = moveWork(dir, { id, to: 'delivered', expectedStatus: 'awaiting-approval', role: 'human', mergedSha, mergedInto: 'main' });
      return { id, mode: 'github', to: 'delivered', prNumber, seq: event.seq };
    }
    // blocked — mirrors the local merge-conflict/verify-fail-post-merge
    // shape: park awaiting-approval -> blocked with the classifyGhFailure reason,
    // plus a friction record carrying the failure layer and gh's stderr.
    const reason = result.reason;
    const layer = { 'auth-failure': 'environment', 'rate-limited': 'environment', 'unreachable': 'environment', 'gh-invocation-failed': 'state' }[reason] || 'state';
    moveWork(dir, { id, to: 'blocked', expectedStatus: 'awaiting-approval', reason, role: 'system' });
    addFriction(dir, {
      id,
      disposition: 'blocked',
      errorClass: reason,
      layer,
      attempts: 1,
      detail: `gh pr merge #${prNumber} failed at step ${result.step}: ${result.detail}`,
    });
    return { id, mode: 'github', to: 'blocked', prNumber, reason, detail: result.detail };
  }

  if (source === 'runner') {
    // Iron Law check now runs earlier (hoisted above the --github branch,
    // f01) so it guards both merge transports identically — see that
    // block for the full rationale.
    //
    // tsk-kv3 (Q1): the main-checkout clean-tree gate USED to run here,
    // unconditionally, covering both the leaf->root and root->main
    // paths below. Removed for leaf->root specifically: that merge runs
    // entirely inside a DETACHED ephemeral worktree
    // (withMergeEphemeralWorktree, a few lines down) and never reads or
    // writes repoRoot's own working tree at all — gating on its
    // cleanliness protected a resource that path never touches. The
    // gate is re-added below, scoped to the root->main branch only,
    // which genuinely does merge onto the shared checkout.
    const ownFileSet = buildOwnFileSet(runnerOwnDiff, item.footprint);

    // Acceptance-evidence pre-flight (tsk-396 D1): covers both merge
    // paths below (leaf->root and root->main share this one branch
    // point) — checked BEFORE mergeRunnerItem's real git merge, not
    // caught after the fact inside moveWork's own `to === 'delivered'`
    // check (store.mjs). A merge that's about to be refused here never
    // touches the target branch.
    assertAcceptanceEvidence(id, item);
    assertPlanEvidence(id, item, repoRoot);

    // D3 leaf-vs-root split: a leaf's resolved root is a DIFFERENT item
    // (resolveRoot walks item.parent up to the top); a root's resolved
    // root is itself.
    const rootId = resolveRoot(view, id);

    if (rootId !== id) {
      const rootBranch = branchNameFor(rootId);
      // A root only ever driven by a live session/pick (never the
      // runner's own dispatch loop, which creates fgw/<rootId> early,
      // D17) can reach this point before its own branch exists — seed
      // it from the repo's own detected trunk here (tsk-386: no longer
      // a hardcoded 'main' -- createBranchRef's own default already
      // resolves through detectTrunk(repoRoot)), the same fallback
      // createDetachedMergeWorktree already applies at its own later
      // call site below.
      if (!branchExists(repoRoot, rootBranch)) {
        createBranchRef(repoRoot, rootId);
      }
      // Ephemeral worktree checked out on fgw/<rootId> (now guaranteed to
      // exist, either from dispatch-side wiring or the fallback just
      // above) — never the human's own main
      // checkout, and never a literal checkout of fgw/<rootId> itself:
      // withMergeEphemeralWorktree stands up a DETACHED checkout at the
      // branch's current tip commit, merges there, then lands the
      // result via a plain `git branch -f` ref update (worktree.mjs,
      // docs/history/merge-worktree-reclaim-clobbers-kept-checkout/
      // CONTEXT.md D1 — this replaces an earlier version of this
      // comment that attributed the race below to createWorktree's
      // branch-reuse path force-reclaiming any existing checkout of
      // fgw/<rootId>; that mechanism no longer runs here). This still
      // races a concurrent approval of a sibling leaf of the same
      // root, or the runner's own dispatch of that root — D16's
      // per-root merge-mutex lives in the runner's write-queue, not
      // this human-driven CLI verb, so nothing here prevents two such
      // merges from overlapping. What changed (tsk-46a, docs/history/
      // merge-ephemeral-branch-force-race/CONTEXT.md):
      // withMergeEphemeralWorktree's own CAS guard now catches the
      // overlap at the ref-move step and makes the losing side fail
      // loudly instead of silently overwriting the winner's commit —
      // the race can still happen, but it is no longer a silent
      // data-loss risk; the losing `approve` call just needs a retry
      // against the new tip. A long-lived claim worktree checked out
      // on fgw/<rootId> falling behind this same ref update is a
      // separate, guarded concern — see resyncClaimWorktree
      // (worktree.mjs), which runs when that worktree is next
      // reattached to.
      //
      // withMergeEphemeralWorktree's own finally (worktree.mjs) removes
      // the checkout on every exit path below (conflict, verify-fail,
      // merged) — per D4/D17 that never deletes the branch itself.
      // mergeRunnerItem's own conflict/verify-fail outcomes already
      // leave the ephemeral checkout clean via `git merge --abort`, so
      // no cleanupMergedBranch call is needed on those paths.
      // tsk-xyr (§E): the target's own slot is held OUTSIDE
      // withMergeEphemeralWorktree — createDetachedMergeWorktree reads
      // the target's tip BEFORE this callback runs, so the slot must
      // already be held by the time that read happens, not acquired
      // from inside it (that would leave the tip read unprotected).
      // tsk-5k4: withLockRetry must wrap the call that can actually
      // throw lock-held (withMergeTargetSlot's own acquire) — the
      // runMerge below wrapping only mergeRunnerItem(...,{targetSlot:
      // true}) never catches anything, since that path skips its own
      // lock acquire once the caller already holds the target's slot.
      return await runMerge(() => withMergeTargetSlot(repoRoot, rootBranch, async () => {
        // tsk-4ax (D3): catchup as a STANDARD step, not only a recovery
        // from `blocked` — if the target isn't yet an ancestor of the
        // branch, catch it up FIRST, still inside the slot (so the
        // target provably cannot move between this check and the land
        // below — the whole invariant D3 depends on). Once caught up,
        // the branch itself is now an ancestor and carries a commit
        // this call JUST verified green; `effectiveItem` threads that
        // fresh tip into the land below in-memory only (never persisted
        // via moveWork — awaiting-approval -> awaiting-approval is not
        // a valid FSM edge, and there is nothing to persist: this same
        // call is about to consume the proof immediately).
        let effectiveItem = item;
        let alreadyAncestor = false;
        try {
          execFileSync('git', ['merge-base', '--is-ancestor', rootBranch, branchNameFor(id)], { cwd: repoRoot, encoding: 'utf8', shell: false });
          alreadyAncestor = true;
        } catch (ancestorErr) {
          if (ancestorErr.status !== 1) throw ancestorErr;
        }
        if (!alreadyAncestor) {
          const catchupResult = await performCatchUp(repoRoot, id, item, rootBranch, timeoutMs);
          if (catchupResult.outcome === 'conflict') {
            moveWork(dir, { id, to: 'blocked', expectedStatus: 'awaiting-approval', reason: 'merge-conflict', role: 'system' });
            addFriction(dir, {
              id,
              disposition: 'blocked',
              errorClass: 'merge-conflict',
              layer: 'state',
              attempts: 1,
              detail: `catchup (inbound gate): git merge --no-commit --no-ff ${rootBranch} into ${branchNameFor(id)} conflicted; merge aborted, ${branchNameFor(id)} unchanged`,
            });
            return { id, mode: 'merge', to: 'blocked', reason: 'merge-conflict', target: rootBranch, conflictedFiles: catchupResult.conflictedFiles };
          }
          if (catchupResult.outcome === 'verify-fail') {
            const mergeReason = catchupResult.timedOut ? 'verify-timeout-post-merge' : 'verify-fail-post-merge';
            moveWork(dir, { id, to: 'blocked', expectedStatus: 'awaiting-approval', reason: mergeReason, role: 'system' });
            addFriction(dir, {
              id,
              disposition: 'blocked',
              errorClass: catchupResult.timedOut ? 'verify-timeout' : 'verify-miss',
              layer: 'verification',
              attempts: 1,
              detail: catchupResult.timedOut
                ? `catchup (inbound gate): goal-check timed out on staged merge into ${branchNameFor(id)} after ${timeoutMs}ms — not a verify failure; merge aborted, ${branchNameFor(id)} unchanged, rerun catchup`
                : `catchup (inbound gate): goal-check failed on staged merge into ${branchNameFor(id)} (exit ${catchupResult.exitStatus}); merge aborted, ${branchNameFor(id)} unchanged`,
            });
            return { id, mode: 'merge', to: 'blocked', reason: mergeReason, target: rootBranch, timedOut: catchupResult.timedOut, exitStatus: catchupResult.exitStatus, output: catchupResult.output };
          }
          // 'merged' or 'already-caught-up'.
          effectiveItem = { ...item, branchHeadAtReturn: catchupResult.catchupHead };
        }
        return await withMergeEphemeralWorktree(repoRoot, rootId, async (ephemeral) => {
        // tsk-2eq: lockRoot pins the main-checkout lock to the real
        // repo root — ephemeral.path stays the git-op cwd (unchanged)
        // but is never the lock's own root, since it's a throwaway
        // worktree with no writable .fgos/ (ADR0020).
        // targetSlot:true (tsk-xyr): this merge runs entirely in the
        // detached ephemeral worktree above, never touching the shared
        // main checkout — main-checkout.lock protects a resource this
        // path doesn't use, so it is skipped in favor of the target
        // slot already held by withMergeTargetSlot around this whole
        // call.
        const result = await runMerge(() => mergeRunnerItem(ephemeral.path, effectiveItem, { timeoutMs, lockRoot: repoRoot, targetSlot: true }));

        if (result.outcome === 'conflict') {
          moveWork(dir, { id, to: 'blocked', expectedStatus: 'awaiting-approval', reason: 'merge-conflict', role: 'system' });
          addFriction(dir, {
            id,
            disposition: 'blocked',
            errorClass: 'merge-conflict',
            layer: 'state',
            attempts: 1,
            detail: `git merge --no-commit --no-ff ${result.branch} into ${rootBranch} conflicted; merge aborted, ${rootBranch} unchanged`,
          });
          return { id, mode: 'merge', to: 'blocked', reason: 'merge-conflict', target: rootBranch };
        }

        if (result.outcome === 'merge-failed-unclassified') {
          // tsk-18a D1: git merge --no-commit --no-ff failed but never
          // created MERGE_HEAD -- not a real textual conflict, so this
          // gets its own reason instead of being folded into
          // 'merge-conflict'. Real stderr/exit-code carried through so
          // this is actually diagnosable, unlike the static
          // 'merge-conflict' detail string.
          moveWork(dir, { id, to: 'blocked', expectedStatus: 'awaiting-approval', reason: 'merge-failed-unclassified', role: 'system' });
          addFriction(dir, {
            id,
            disposition: 'blocked',
            errorClass: 'merge-failed-unclassified',
            layer: 'state',
            attempts: 1,
            detail: `git merge --no-commit --no-ff ${result.branch} into ${rootBranch} failed without a real conflict (exit ${result.error.status}): ${result.error.stderr || result.error.message}; merge aborted, ${rootBranch} unchanged`,
          });
          return { id, mode: 'merge', to: 'blocked', reason: 'merge-failed-unclassified', target: rootBranch, error: result.error };
        }

        if (result.outcome === 'merge-blocked-other-item') {
          // tsk-4hj D1/D2/D3: a MERGE_HEAD already existed BEFORE this
          // call's own merge attempt ran -- a different item's
          // in-progress or abandoned merge, not this branch's conflict.
          // git merge --no-commit --no-ff was never attempted and
          // git merge --abort was never called, so ${rootBranch}'s own
          // merge state (if any) is exactly as this call found it.
          moveWork(dir, { id, to: 'blocked', expectedStatus: 'awaiting-approval', reason: 'merge-blocked-other-item', role: 'system' });
          addFriction(dir, {
            id,
            disposition: 'blocked',
            errorClass: 'merge-blocked-other-item',
            layer: 'state',
            attempts: 1,
            detail: `main checkout already has a MERGE_HEAD from another item's in-progress merge; ${rootBranch}'s own merge of ${result.branch} was never attempted`,
          });
          return { id, mode: 'merge', to: 'blocked', reason: 'merge-blocked-other-item', target: rootBranch };
        }

        if (result.outcome === 'lock-lost-mid-merge') {
          // tsk-2qp: main checkout lock was lost mid-merge (heartbeat renewal failed).
          // Merge commit was not performed and git merge --abort was never called,
          // preserving the new lock holder's tree state intact.
          moveWork(dir, { id, to: 'blocked', expectedStatus: 'awaiting-approval', reason: 'lock-lost-mid-merge', role: 'system' });
          addFriction(dir, {
            id,
            disposition: 'blocked',
            errorClass: 'lock-lost-mid-merge',
            layer: 'state',
            attempts: 1,
            detail: `main checkout lock was lost mid-merge; ${rootBranch}'s own merge of ${result.branch} was stopped before commit`,
          });
          return { id, mode: 'merge', to: 'blocked', reason: 'lock-lost-mid-merge', target: rootBranch };
        }

        if (result.outcome === 'fgos-write-rejected') {
          moveWork(dir, { id, to: 'blocked', expectedStatus: 'awaiting-approval', reason: 'fgos-write-rejected', role: 'system' });
          addFriction(dir, {
            id,
            disposition: 'blocked',
            errorClass: 'fgos-write-blocked',
            layer: 'state',
            attempts: 1,
            detail: formatFgosWriteRejectedDetail(result.branch, result.paths, rootBranch),
          });
          return { id, mode: 'merge', to: 'blocked', reason: 'fgos-write-rejected', target: rootBranch, paths: result.paths };
        }

        if (result.outcome === 'verify-fail') {
          // tsk-53o: a timeout during the post-merge check is not proof
          // the merge is bad — park under a distinct, catchup-resolvable
          // reason instead of the misleading merge-fail label.
          const mergeReason = result.check.timedOut ? 'verify-timeout-post-merge' : 'verify-fail-post-merge';
          moveWork(dir, { id, to: 'blocked', expectedStatus: 'awaiting-approval', reason: mergeReason, role: 'system' });
          addFriction(dir, {
            id,
            disposition: 'blocked',
            errorClass: result.check.timedOut ? 'verify-timeout' : 'verify-miss',
            layer: 'verification',
            attempts: 1,
            detail: result.check.timedOut
              ? `goal-check timed out on staged merge into ${rootBranch} after ${timeoutMs}ms — not a verify failure; merge aborted, ${rootBranch} unchanged, rerun catchup`
              : `goal-check failed on staged merge into ${rootBranch} (exit ${result.check.status}); merge aborted, ${rootBranch} unchanged`,
          });
          return { id, mode: 'merge', to: 'blocked', reason: mergeReason, target: rootBranch, timedOut: result.check.timedOut, exitStatus: result.check.status, output: result.check.output };
        }

        // Merged: land the leaf's work on its root's branch. The
        // leaf's own branch (and any stray worktree checkout of it) is
        // NO LONGER torn down here (tsk-1p9, restore-to-decision, D1):
        // teardown is deferred to the `cleanup` verb, gated by D7's TTL
        // and D8's harness (which now resolves the correct root-aware
        // git context for a leaf branch, tsk-1p9 D7/D8 — the exact
        // constraint that used to force this call to run from the
        // ephemeral worktree right here no longer applies, since the
        // deferred call resolves its own correct ref).
        // tsk-480: the merge above is already real and permanent —
        // status recording is best-effort from here regardless of
        // outcome (previously: also gated cleanup on this write
        // succeeding; cleanup no longer happens on this path at all).
        // tsk-5dk: read the ephemeral worktree's OWN HEAD, not
        // rootBranch's ref on repoRoot — withMergeEphemeralWorktree
        // (worktree.mjs) only force-moves the real branch AFTER this
        // callback returns (`git branch -f branch endCommit`), so
        // reading repoRoot's ref here would still see the PRE-merge
        // sha. `ephemeral.path`'s HEAD is correct in both the fresh-
        // merge case (it IS the just-created endCommit) and the
        // idempotent-already-merged case (HEAD never advanced past
        // rootBranch's existing tip, which is exactly right there too).
        const mergedSha = currentHead(ephemeral.path);
        const moveResult = moveDeliveredOrRecordFault(dir, id, 'leaf-into-root merge', testForceLockTimeoutId, { mergedSha, mergedInto: rootBranch });
        if (!moveResult.event) {
          return {
            id,
            mode: 'merge',
            to: 'awaiting-approval',
            deliveryUnrecorded: true,
            target: rootBranch,
            branch: result.branch,
            output: result.check.output,
            error: moveResult.error.message,
            diagnosticLog: moveResult.diagnosticLog,
            postLand: result.postLand,
          };
        }
        return {
          id,
          mode: 'merge',
          to: 'delivered',
          target: rootBranch,
          branch: result.branch,
          seq: moveResult.event.seq,
          output: result.check.output,
          postLand: result.postLand,
        };
        });
      }));
    }

    // tsk-kv3 (Q1): unlike leaf->root above, THIS path genuinely merges
    // onto the shared main checkout (mergeRunnerItem(repoRoot, ...)
    // just below, no ephemeral worktree) — the clean-tree gate belongs
    // here, scoped to the item's own file set exactly as it already
    // was before this item (tsk-598's own buildOwnFileSet narrowing,
    // unchanged; only the GATE'S LOCATION moved, not its logic).
    if (!isMainTreeClean(repoRoot, ownFileSet)) {
      throw new StoreError('validation', `approve: working tree at "${repoRoot}" is not clean — commit or stash pending changes before approving "${id}".`);
    }

    // Root merge into main — unchanged except for D8: a root that
    // actually had children (was a decomposed root, per replay.mjs's
    // fold which never clears `parent` on a child that reached `done`)
    // gets the distinguishing reason `integration-drift` instead of the
    // existing reason strings on a conflict/verify-fail, plus a
    // `main@<sha>` ref in the friction detail. A standalone (no
    // children) root keeps today's exact reason strings and message —
    // zero behavior change for the common case.
    const hadChildren = Object.values(view.work).some((w) => w.parent === id);

    const result = await runMerge(() => mergeRunnerItem(repoRoot, item, { timeoutMs }));

    if (result.outcome === 'conflict') {
      const reason = hadChildren ? 'integration-drift' : 'merge-conflict';
      const detail = hadChildren
        ? `cross-root integration drift at main@${currentHead(repoRoot)}; git merge --no-commit --no-ff ${result.branch} conflicted; merge aborted, main unchanged`
        : `git merge --no-commit --no-ff ${result.branch} conflicted; merge aborted, main unchanged`;
      moveWork(dir, { id, to: 'blocked', expectedStatus: 'awaiting-approval', reason, role: 'system' });
      addFriction(dir, {
        id,
        disposition: 'blocked',
        errorClass: 'merge-conflict',
        layer: 'state',
        attempts: 1,
        detail,
      });
      return { id, mode: 'merge', to: 'blocked', reason, target: 'main' };
    }

    if (result.outcome === 'merge-failed-unclassified') {
      // tsk-18a D1: same non-genuine-conflict class as the leaf→root
      // call site above — never folded into 'merge-conflict'/
      // 'integration-drift', regardless of hadChildren, since neither
      // reason is accurate for a failure that never staged a real
      // conflict in the first place.
      const detail = hadChildren
        ? `cross-root integration attempt at main@${currentHead(repoRoot)}; git merge --no-commit --no-ff ${result.branch} failed without a real conflict (exit ${result.error.status}): ${result.error.stderr || result.error.message}; merge aborted, main unchanged`
        : `git merge --no-commit --no-ff ${result.branch} failed without a real conflict (exit ${result.error.status}): ${result.error.stderr || result.error.message}; merge aborted, main unchanged`;
      moveWork(dir, { id, to: 'blocked', expectedStatus: 'awaiting-approval', reason: 'merge-failed-unclassified', role: 'system' });
      addFriction(dir, {
        id,
        disposition: 'blocked',
        errorClass: 'merge-failed-unclassified',
        layer: 'state',
        attempts: 1,
        detail,
      });
      return { id, mode: 'merge', to: 'blocked', reason: 'merge-failed-unclassified', target: 'main', error: result.error };
    }

    if (result.outcome === 'merge-blocked-other-item') {
      // tsk-4hj D1/D2/D3: same non-genuine-conflict, non-genuine-drift
      // class as merge-failed-unclassified above — reason stays constant
      // regardless of hadChildren, since a pre-existing MERGE_HEAD from a
      // DIFFERENT item is neither this branch's own conflict nor cross-root
      // integration drift. git merge --no-commit --no-ff was never
      // attempted and git merge --abort was never called.
      const detail = hadChildren
        ? `cross-root integration attempt at main@${currentHead(repoRoot)}; main checkout already has a MERGE_HEAD from another item's in-progress merge; merge of ${result.branch} was never attempted`
        : `main checkout already has a MERGE_HEAD from another item's in-progress merge; merge of ${result.branch} was never attempted`;
      moveWork(dir, { id, to: 'blocked', expectedStatus: 'awaiting-approval', reason: 'merge-blocked-other-item', role: 'system' });
      addFriction(dir, {
        id,
        disposition: 'blocked',
        errorClass: 'merge-blocked-other-item',
        layer: 'state',
        attempts: 1,
        detail,
      });
      return { id, mode: 'merge', to: 'blocked', reason: 'merge-blocked-other-item', target: 'main' };
    }

    if (result.outcome === 'lock-lost-mid-merge') {
      // tsk-2qp: main checkout lock was lost mid-merge (heartbeat renewal failed).
      // Merge commit was not performed and git merge --abort was never called.
      const detail = hadChildren
        ? `cross-root integration attempt at main@${currentHead(repoRoot)}; main checkout lock was lost mid-merge; merge of ${result.branch} was stopped before commit`
        : `main checkout lock was lost mid-merge; merge of ${result.branch} was stopped before commit`;
      moveWork(dir, { id, to: 'blocked', expectedStatus: 'awaiting-approval', reason: 'lock-lost-mid-merge', role: 'system' });
      addFriction(dir, {
        id,
        disposition: 'blocked',
        errorClass: 'lock-lost-mid-merge',
        layer: 'state',
        attempts: 1,
        detail,
      });
      return { id, mode: 'merge', to: 'blocked', reason: 'lock-lost-mid-merge', target: 'main' };
    }

    if (result.outcome === 'fgos-write-rejected') {
      moveWork(dir, { id, to: 'blocked', expectedStatus: 'awaiting-approval', reason: 'fgos-write-rejected', role: 'system' });
      addFriction(dir, {
        id,
        disposition: 'blocked',
        errorClass: 'fgos-write-blocked',
        layer: 'state',
        attempts: 1,
        detail: formatFgosWriteRejectedDetail(result.branch, result.paths, 'main'),
      });
      return { id, mode: 'merge', to: 'blocked', reason: 'fgos-write-rejected', target: 'main', paths: result.paths };
    }

    if (result.outcome === 'verify-fail') {
      // tsk-53o: a timeout is neither a real verify failure nor evidence
      // of cross-root drift — it gets its own reason regardless of
      // hadChildren, distinct from both branches below.
      const reason = result.check.timedOut ? 'verify-timeout-post-merge' : hadChildren ? 'integration-drift' : 'verify-fail-post-merge';
      const detail = result.check.timedOut
        ? `goal-check timed out on staged merge after ${timeoutMs}ms — not a verify failure; merge aborted, main unchanged, rerun catchup`
        : hadChildren
          ? `cross-root integration drift at main@${currentHead(repoRoot)}; goal-check failed on staged merge (exit ${result.check.status}); merge aborted, main unchanged`
          : `goal-check failed on staged merge (exit ${result.check.status}); merge aborted, main unchanged`;
      moveWork(dir, { id, to: 'blocked', expectedStatus: 'awaiting-approval', reason, role: 'system' });
      addFriction(dir, {
        id,
        disposition: 'blocked',
        errorClass: result.check.timedOut ? 'verify-timeout' : 'verify-miss',
        layer: 'verification',
        attempts: 1,
        detail,
      });
      return { id, mode: 'merge', to: 'blocked', reason, target: 'main', timedOut: result.check.timedOut, exitStatus: result.check.status, output: result.check.output };
    }

    // tsk-480: cleanup used to run either way relative to this write
    // (already real and permanent) — now moot on this path, since
    // cleanup no longer happens here at all (tsk-1p9 D1: deferred to
    // the `cleanup` verb, gated by D7's TTL and D8's harness).
    // tsk-5dk: same resolveRefSha-of-the-target-branch approach as the
    // leaf-into-root path above, kept uniform even though this merge
    // already ran directly on repoRoot (no ephemeral worktree here) —
    // still correct, and still robust for an idempotent already-merged
    // re-approve (see the leaf-into-root comment above for why).
    const mergedSha = resolveRefSha(repoRoot, 'main');
    const moveResult = moveDeliveredOrRecordFault(dir, id, 'root-into-main merge', testForceLockTimeoutId, { mergedSha, mergedInto: 'main' });
    if (!moveResult.event) {
      return {
        id,
        mode: 'merge',
        to: 'awaiting-approval',
        deliveryUnrecorded: true,
        target: 'main',
        branch: result.branch,
        output: result.check.output,
        error: moveResult.error.message,
        diagnosticLog: moveResult.diagnosticLog,
        postLand: result.postLand,
      };
    }
    return {
      id,
      mode: 'merge',
      to: 'delivered',
      target: 'main',
      branch: result.branch,
      seq: moveResult.event.seq,
      output: result.check.output,
      postLand: result.postLand,
    };
  }

  // pull-door or legacy proposal: code is already on main (D4) — no
  // merge step, just re-run the item's own verify against the current
  // tree, exactly the goal-check contract `return` already uses.
  const check = await runGoalCheck(item, repoRoot, timeoutMs);
  if (!check.passed) {
    // tsk-53o: same timeout/fail distinction as `return` — a timeout is
    // not proof the item's verify failed.
    moveWork(dir, { id, to: 'blocked', expectedStatus: 'awaiting-approval', reason: check.timedOut ? 'verify-timeout' : 'verify-fail', role: 'system' });
    addFriction(dir, {
      id,
      disposition: 'blocked',
      errorClass: check.timedOut ? 'verify-timeout' : 'verify-miss',
      layer: 'verification',
      attempts: 1,
      detail: check.timedOut
        ? `goal-check on main timed out after ${timeoutMs}ms — not a verify failure, rerun approve`
        : `goal-check failed on main (exit ${check.status})`,
    });
    return { id, mode: 'verify-only', to: 'blocked', reason: check.timedOut ? 'verify-timeout' : 'verify-fail', timedOut: check.timedOut, exitStatus: check.status, output: check.output };
  }
  // tsk-480: no real merge lands on this path (code is already on
  // main), so a moveWork failure here only desyncs status rather than
  // hiding a permanent mutation — still guarded for consistency with
  // the two merge paths above (CONTEXT.md D1: all three success
  // paths share the same silent-throw shape).
  const moveResult = moveDeliveredOrRecordFault(dir, id, 'pull-door verify-only', testForceLockTimeoutId);
  if (!moveResult.event) {
    return {
      id,
      mode: 'verify-only',
      to: 'awaiting-approval',
      deliveryUnrecorded: true,
      output: check.output,
      error: moveResult.error.message,
      diagnosticLog: moveResult.diagnosticLog,
    };
  }
  return { id, mode: 'verify-only', to: 'delivered', seq: moveResult.event.seq, output: check.output };
}
