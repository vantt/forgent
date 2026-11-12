// main-checkout-reset-guard.mjs — tsk-3au: refuses a destructive
// `git reset --hard` on the main checkout unless the caller has already
// seen the full `git status --porcelain` output and explicitly confirmed.
// Closes the failure mode the item documents: a session ran `reset --hard`
// after checking only the 3 files it meant to touch, discarding other
// in-flight sessions' uncommitted work that was never `git add`-ed (no
// stash/reflog/blob could recover it).

import { randomUUID } from 'node:crypto';
import { StoreError } from '../state/store-error.mjs';
import { createLockScope } from '../holder-lock/index.mjs';
import { gitPortOptions } from '../git/inspect.mjs';
import { nativeError } from '../git/native.mjs';
import { createGitSafeRestore } from '../git/restore.mjs';
import { fgosDirFromRoot } from './paths.mjs';
import { isWorkingTreeClean } from './merge.mjs';
import { withMainCheckout } from './repo-locks.mjs';
import { inspectGit, isMainWorktree } from './worktree.mjs';

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

// `main-checkout-reset` reads: the commits a reset would drop and the whole-repo status, both through
// Inspect. Listing is advisory, so it is bounded and degrades instead of failing the verb.
const RESET_LISTED_COMMITS = 50;
function describeLostCommits(inspect, commits) {
  const shown = commits.slice(0, RESET_LISTED_COMMITS);
  let objects = [];
  try {
    objects = inspect.readObjects({ oids: shown, maxBytes: 8 * 1024 * 1024 });
  } catch (_err) {
    // Details unavailable: the short ids below still name every listed commit.
  }
  const lines = shown.map((oid, i) => {
    const object = objects[i];
    if (object?.kind !== 'present' || object.objectType !== 'commit') return `${oid.slice(0, 7)} (commit details unavailable)`;
    const [header, ...body] = Buffer.from(object.bytes).toString('utf8').split('\n\n');
    const author = /^author (.*) <([^>]*)> \d+ [+-]\d{4}$/m.exec(header);
    return `${oid.slice(0, 7)} ${author ? `${author[1]} (${author[2]})` : '(unknown author)'}: ${body.join('\n\n').split('\n', 1)[0]}`;
  });
  if (commits.length > shown.length) lines.push(`... and ${commits.length - shown.length} more`);
  return lines.join('\n');
}
function renderStatus(inspect) {
  const lines = [];
  let cursor;
  do {
    const page = inspect.status({ untracked: 'all', maxEntries: 4096, cursor });
    for (const entry of page.entries) {
      const xy = entry.untracked ? '??' : entry.ignored ? '!!' : String.fromCharCode(entry.index, entry.worktree).replaceAll('.', ' ');
      lines.push(`${xy} ${Buffer.from(entry.path).toString('utf8')}`);
    }
    cursor = page.nextCursor;
  } while (cursor);
  return lines.join('\n');
}

/**
 * `main-checkout-reset`: reset the main checkout `repoRoot` to `sha` through SafeRestore, under the main-checkout lock.
 * `repoRoot` is the root the invocation-root door already vetted (`main-checkout-only`: a `--dir` must be that main
 * root). Without `--dir` a linked worktree's `cwd` is refused, so the reset is never aimed at a tree the caller did not
 * name. Without `confirmed`, a dirty tree or discarded commits refuse with the whole status and the commits listed.
 * Lock refusals surface as `HolderLockError` for the caller to classify.
 */
export async function mainCheckoutResetUseCase({ repoRoot, cwd, explicitDir }, { sha, confirmed }) {
  if (!explicitDir && !isMainWorktree(cwd)) {
    throw new StoreError(
      'validation',
      'main-checkout-reset: refusing to run without --dir <mainRoot> -- cwd is a linked worktree, and without --dir this verb would silently ' +
        'target it (git reset --hard) instead of the main checkout. Pass --dir <mainRoot> explicitly, e.g. ' +
        '`fgos main-checkout-reset --sha <sha> --dir "$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)"`.',
    );
  }
  const reset = async (handle) => {
    const inspect = inspectGit(repoRoot);
    const target = inspect.resolveCommit({ name: sha });
    if (!target) throw new StoreError('validation', `main-checkout-reset: "${sha}" does not name a commit in "${repoRoot}"`);
    const head = inspect.resolveCommit({ name: 'HEAD' });
    if (!head) throw new StoreError('validation', `main-checkout-reset: "${repoRoot}" has no commit to reset from`);
    const dirty = !isWorkingTreeClean(repoRoot);
    const lostCommitCount = inspect.countCommits({ include: head, exclude: target });
    try {
      assertSafeMainCheckoutReset({ dirty, confirmed, lostCommitCount, sha });
    } catch (err) {
      let details = `main-checkout-reset: ${err.message}`;
      if (dirty) {
        details += `\n\nFull git status (main checkout, whole repo):\n${renderStatus(inspect) || '(empty)'}`;
      }
      if (lostCommitCount > 0) {
        const lost = inspect.compareCommits({ left: target, right: head }).commits;
        details += `\n\nCommits about to be discarded (${lostCommitCount}):\n${describeLostCommits(inspect, lost)}`;
      }
      throw new StoreError('validation', details);
    }
    // Without --confirm only a clean forward move reaches here: a plain restore, nothing discarded.
    const options = gitPortOptions(repoRoot, { mutation: true });
    const operationId = randomUUID();
    const request = {
      expectedHead: head,
      target,
      reason: `main-checkout-reset --sha ${sha}`,
      ...(confirmed ? { discardLocalDelta: true, confirmedBy: `fgos main-checkout-reset --confirm (writer ${options.writer})` } : {}),
    };
    let restored;
    try {
      restored = createGitSafeRestore(options).apply({ operationId, request }, [handle]);
    } catch (err) {
      throw new StoreError('validation', `main-checkout-reset: SafeRestore refused to reset "${repoRoot}" to ${sha}: ${nativeError(err).cause}`);
    }
    return { sha, wasDirty: dirty, lostCommitCount, confirmed, operationId, snapshot: restored.snapshot };
  };
  return withMainCheckout(createLockScope('main-checkout-reset'), 'reset', reset, { fgosDir: fgosDirFromRoot(repoRoot) });
}
