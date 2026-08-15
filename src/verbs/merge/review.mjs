// review.mjs — use case behind `fgos review <id>`.
//
// Cổng duyệt PR nội bộ (pr-lifecycle D1/D4): a proposed item's diff,
// shown from whichever source classifySource resolves (runner branch,
// pull-door head range, or legacy degrade — runner/merge.mjs). A pure read —
// never appends an event, never mutates state.json, same D1 request-class
// as `ready`/`list`/`check`.
import { listWork, StoreError } from '../../state/store.mjs';
import { resolveRoot } from '../../state/frontier.mjs';
import { classifySource, reviewDiff } from '../../runner/merge.mjs';
import { branchNameFor, branchExists, detectTrunk, ensureBranchPushed } from '../../runner/worktree.mjs';
import { createGitHubPR, viewGitHubPRStatus } from '../../runner/github-adapter.mjs';
import { collectReviewTrace } from '../../report/item-trace.mjs';

/**
 * @param {{dir: string, cwd: string}} ctx - `cwd` is the repo the diff is
 *   read from; this verb has no `--trust-dir` gate, it always reads the
 *   caller's own checkout.
 * @param {{id: string, github: boolean, prNumber: string|undefined, ghCommand: string}} options
 *   `ghCommand` is resolved by the adapter (it reads FGOS_GH_COMMAND —
 *   env is adapter input, never read here).
 */
export async function reviewUseCase({ dir, cwd }, { id, github, prNumber, ghCommand }) {
  const view = listWork(dir);
  const item = view.work[id];
  if (!item) {
    throw new StoreError('validation', `review: work "${id}" not found.`);
  }
  if (item.status !== 'awaiting-approval') {
    throw new StoreError('precondition', `review: work "${id}" is "${item.status}", not "awaiting-approval" — nothing to review.`);
  }

  // GitHub transport (github-adapter D1/D5): `review <id> --github` opens a
  // real GitHub PR for a runner-sourced item instead of printing the local
  // diff. Opt-in and additive — the flag's absence leaves the path below
  // byte-identical. Stays read-only on FSM state exactly like local review:
  // a gh failure is reported as plain output, never a moveWork/addFriction.
  if (github) {
    const repoRoot = cwd;
    const source = classifySource(repoRoot, item);
    if (source !== 'runner') {
      throw new StoreError('validation', `review --github: "${id}" is a ${source}-sourced item — GitHub review requires a runner-sourced item with a live fgw/${id} branch (no branch exists to attach a PR to for pull/legacy items).`);
    }

    // GitHub-close detection (github-adapter D6/D4): `review <id> --github
    // --pr <n>` skips PR creation and reports an existing PR's live status
    // read-only. It classifies on `closed` (boolean) + `mergedAt` (null vs
    // timestamp) only — never on the `state` string, whose closed/merged
    // values S1's spike never observed. Like every review path it stays
    // read-only: no moveWork/addFriction under any outcome, because a
    // GitHub-side close is not itself an approval or reject action (D6);
    // only local `fgos reject` moves the item. pollTimeoutMs:0 is
    // load-bearing: this check reads only closed/mergedAt (unrelated to
    // GitHub's async `mergeable` computation), so it must resolve after a
    // single `gh pr view` instead of polling up to the default 10s while
    // `mergeable` may stay "UNKNOWN" forever on a closed PR.
    if (prNumber !== undefined) {
      // Same refusal `optionalField` produced in the adapter before
      // tsk-h6r, at the same point in the sequence: an omitted `--pr` is
      // fine (the create path below), but a bare or empty one is a
      // validation error — and only once the guards above have had their
      // say, so a nonexistent id is still reported as a nonexistent id.
      if (prNumber === null || prNumber === '' || prNumber === true) {
        throw new StoreError('validation', 'review --github --pr requires a PR number: --pr <n>');
      }
      const result = await viewGitHubPRStatus(repoRoot, prNumber, { ghCommand, pollTimeoutMs: 0 });
      if (result.outcome === 'blocked') {
        return { id, mode: 'github-status', prNumber, outcome: 'check-failed', reason: result.reason, detail: result.detail };
      }
      if (!result.closed) {
        return { id, mode: 'github-status', prNumber, outcome: 'open' };
      }
      if (result.mergedAt) {
        return { id, mode: 'github-status', prNumber, outcome: 'merged', mergedAt: result.mergedAt };
      }
      return { id, mode: 'github-status', prNumber, outcome: 'closed-unmerged' };
    }

    const head = branchNameFor(id);
    const rootId = resolveRoot(view, id);
    // Leaf-vs-root base split mirrors approve/review's local path: a root
    // targets the repo trunk, a leaf targets its resolved root's branch.
    // Known limitation (accepted this slice): only the leaf's own branch is
    // pushed below — the root's branch is never pushed here, so a real
    // `gh pr create` for a leaf would fail with base absent on origin. The
    // fake-gh tests don't validate remote branch existence, so they pass;
    // the leaf/root GitHub push semantics need their own follow-up slice.
    const base = rootId !== id ? branchNameFor(rootId) : detectTrunk(repoRoot);
    ensureBranchPushed(repoRoot, head);
    const result = await createGitHubPR(
      repoRoot,
      { head, base, title: item.title, body: item.description || `Runner-proposed change (fgos work item ${id}).` },
      { ghCommand },
    );
    if (result.outcome === 'created') {
      return { id, mode: 'github-create', outcome: 'created', prNumber: result.prNumber, head, base };
    }
    return { id, mode: 'github-create', outcome: 'failed', reason: result.reason, detail: result.detail };
  }

  // D3 leaf-vs-root split: a leaf (its resolved root is a different
  // item) diffs against its parent's integration branch instead of
  // main; a root (resolved root is itself) keeps the default
  // (main) trunk — byte-for-byte unchanged.
  const rootId = resolveRoot(view, id);
  const rootBranchForReview = rootId !== id ? branchNameFor(rootId) : null;
  // Same milestone-root-without-a-branch fallback as approve's Iron Law
  // check: no `fgw/<root>` ref to diff against means the trunk
  // stays the repo trunk, not a crash on an unknown revision.
  const { source, diff, warnings } = rootBranchForReview && branchExists(cwd, rootBranchForReview)
    ? reviewDiff(cwd, item, { trunk: rootBranchForReview })
    : reviewDiff(cwd, item);
  return { id, mode: 'local', source, warnings, diff, trace: collectReviewTrace(view, id) };
}
