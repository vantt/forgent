// main-checkout-reset-guard.mjs — tsk-3au: refuses a destructive
// `git reset --hard` on the main checkout unless the caller has already
// seen the full `git status --porcelain` output and explicitly confirmed.
// Closes the failure mode the item documents: a session ran `reset --hard`
// after checking only the 3 files it meant to touch, discarding other
// in-flight sessions' uncommitted work that was never `git add`-ed (no
// stash/reflog/blob could recover it).

export class UnsafeMainCheckoutResetError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UnsafeMainCheckoutResetError';
  }
}

// `dirty`/`confirmed` are booleans the caller computes itself (the CLI verb
// derives `dirty` from `isMainTreeClean`, whole-repo scope — see
// bin/fgos.mjs's `main-checkout-reset` verb). `lostCommitCount` (or `lostCommits`)
// indicates how many committed commits ahead of target SHA would be discarded.
// This function stays a pure decision, no git/filesystem access of its own,
// so it is unit-testable without a real repo.
export function assertSafeMainCheckoutReset({ dirty, confirmed, lostCommitCount = 0, lostCommits = [], sha }) {
  const commitCount =
    typeof lostCommitCount === 'number' && lostCommitCount > 0
      ? lostCommitCount
      : Array.isArray(lostCommits)
        ? lostCommits.length
        : typeof lostCommits === 'number'
          ? lostCommits
          : 0;

  if (!confirmed) {
    if (dirty && commitCount > 0) {
      throw new UnsafeMainCheckoutResetError(
        `Main checkout has uncommitted changes and reset to ${sha || '<sha>'} would discard ${commitCount} committed commit(s) ahead of target SHA — ` +
          'refusing to reset --hard without --confirm. Review status output and lost commits, then re-run with --confirm ' +
          'once you are sure none of it belongs to another in-flight session.'
      );
    }
    if (dirty) {
      throw new UnsafeMainCheckoutResetError(
        'Main checkout has uncommitted changes (full git status, not just the files you meant to touch) — ' +
          'refusing to reset --hard without --confirm. Review the status output, then re-run with --confirm ' +
          'once you are sure none of it belongs to another in-flight session.'
      );
    }
    if (commitCount > 0) {
      throw new UnsafeMainCheckoutResetError(
        `Main checkout reset to ${sha || '<sha>'} would discard ${commitCount} committed commit(s) ahead of target SHA — ` +
          'refusing to reset --hard without --confirm. Review the lost commits, then re-run with --confirm ' +
          'once you are sure none of it belongs to another in-flight session.'
      );
    }
  }
}

