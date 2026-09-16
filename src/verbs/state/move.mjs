import { execFileSync } from 'node:child_process';
import { moveWork, addDecision, listWork, StoreError } from '../../state/store.mjs';
import { branchNameFor, branchExists, detectTrunk } from '../../runner/worktree.mjs';

function isBranchReachableFromTrunk(cwd, branch, trunk) {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', `refs/heads/${branch}`, trunk], { cwd, encoding: 'utf8', shell: false });
    return true;
  } catch (err) {
    if (err.status === 1) return false;
    throw new StoreError('validation', `git merge-base --is-ancestor "${branch}" "${trunk}" failed in "${cwd}": ${err.message}`);
  }
}

export function moveUseCase({ dir, repoRoot }, { id, to, expectedStatus, reason, answer, overrideReason, skipReturnGuard, role = 'human' }) {
  if (to === 'delivered') {
    const branch = branchNameFor(id);
    if (branchExists(repoRoot, branch)) {
      const trunk = detectTrunk(repoRoot);
      if (!isBranchReachableFromTrunk(repoRoot, branch, trunk)) {
        if (!overrideReason) {
          throw new StoreError(
            'validation',
            `move: "${id}" has a live "${branch}" branch not yet reachable from "${trunk}" — moving it to "delivered" here would record no merge evidence (mergedSha/mergedInto). `
              + `Use "fgos approve ${id}" to merge for real, or pass --override-reason "<why>" to force this move anyway (recorded to the decision log).`,
          );
        }
        addDecision(dir, {
          id,
          text: `move --to delivered override for "${id}": "${branch}" not reachable from "${trunk}"`,
          rationale: overrideReason,
          kind: 'engine',
        });
      }
    }
  }
  if (to === 'awaiting-approval') {
    const item = listWork(dir).work[id];
    if (item?.status === 'doing') {
      if (!skipReturnGuard) {
        throw new StoreError(
          'validation',
          `move: "${id}" is "doing" — moving it to "awaiting-approval" here would record no proof of real progress (no branch-advance check, no clean-tree check, no verify run). `
            + `Use "fgos return ${id}" to prove it for real (pass --no-new-commits-ok if the work was already done before this claim), or pass --skip-return-guard "<why>" to force this move anyway (recorded to the decision log).`,
        );
      }
      addDecision(dir, {
        id,
        text: `move --to awaiting-approval skip-return-guard override for "${id}": status was "doing"`,
        rationale: skipReturnGuard,
        kind: 'engine',
      });
    }
  }
  const { event } = moveWork(dir, { id, to, expectedStatus, reason, answer, role });
  return { id, from: event.payload.from, to: event.payload.to, seq: event.seq };
}
