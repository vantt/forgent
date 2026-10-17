// main-fgos-checkpoint.mjs — optional adapter that commits the `.fgos` event
// files of the main checkout while the caller holds the main checkout mutex.
// It borrows that mutex for each git child (runBorrowed) and never takes a
// lock itself; the lock core in repo-locks.mjs does not import this file.

import { runBorrowed, LockHandle } from '../holder-lock/index.mjs';
import { runOpportunisticMainCheckoutChecks } from '../state/events-jsonl-truncation-guard.mjs';

/** checkpointMainFgos(mainHandle, dir, repoRoot, opts) — `mainHandle` is the
 * handle `withMainCheckout` passed to its callback. Programming error to
 * call it without one. */
export function checkpointMainFgos(mainHandle, dir, repoRoot, opts = {}) {
  if (!(mainHandle instanceof LockHandle) || mainHandle.name !== 'main-checkout' || mainHandle.released) {
    throw new TypeError('checkpointMainFgos needs the live main-checkout handle from withMainCheckout');
  }
  const commit = (args) => {
    const res = runBorrowed(mainHandle, { command: 'git', args, cwd: repoRoot });
    if (res.exit !== 0) {
      throw new Error(`git ${args[0]} failed (exit ${res.exit}${res.signal ? `, ${res.signal}` : ''}): ${String(res.stderr).trim()}`);
    }
  };
  return runOpportunisticMainCheckoutChecks(dir, repoRoot, { ...opts, commit });
}
