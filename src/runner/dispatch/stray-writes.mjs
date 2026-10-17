// stray-writes.mjs -- evidence of work done outside the workspace a dispatch handed its worker.

import path from 'node:path';
import { checkoutDirtyPaths } from '../worktree.mjs';

/**
 * Watch for work done outside the workspace the dispatch handed the worker.
 *
 * A round settles when the worker writes its own result file. That establishes
 * the worker DID something; it establishes nothing about WHERE. Measured: agy
 * was given a worktree, reported settled, and had written six files into the
 * main checkout instead -- onto another track's branch.
 *
 * This compares the main checkout's dirty paths before and after. It is
 * EVIDENCE, not proof: the main checkout is a live working tree other sessions
 * write to while a round is in flight (measured 2026-10-14: a Doer's whole
 * round was refused for three reports another session wrote into main). So
 * what it sees is reported as a warning on the result, never a refusal; a
 * refusal needs a write observed and bound to the run, which this is not.
 *
 * Nothing is watched when the worker was given the repo root itself as its
 * workspace -- there is no outside to write to.
 */
export function watchWritesOutsideWorkspace({ repoRoot, cwd, before: knownBefore }) {
  const watching = Boolean(repoRoot) && Boolean(cwd) && path.resolve(cwd) !== path.resolve(repoRoot);

  // The workspace usually lives INSIDE the repo root -- fgOS puts worktrees at
  // `<repo>/.claude/worktrees/<id>` -- so the root's own status reports the
  // workspace directory itself as untracked. Everything at or under the
  // workspace is the worker's to write; only what lies outside it is stray.
  const insideWorkspace = (relPath) => {
    const rel = path.relative(path.resolve(cwd), path.resolve(repoRoot, relPath));
    return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
  };
  const outsideOnly = () => (watching
    ? checkoutDirtyPaths(repoRoot, repoRoot).filter((entry) => !insideWorkspace(entry))
    : []);

  // `before` may be handed over from the process that took the first snapshot (a supervised attempt is
  // settled by another process than the one that launched it).
  const before = new Set(knownBefore ?? outsideOnly());
  return {
    watching,
    /** The paths that were already dirty, for a later process to compare against. */
    before: [...before],
    /** Paths outside the workspace that are dirty now and were not before. */
    strayPaths() {
      return outsideOnly().filter((entry) => !before.has(entry));
    },
  };
}

/**
 * The warning a round carries when paths outside its workspace became dirty
 * while it ran, or null when none did. Correlated evidence only: it names what
 * appeared and where, and says nothing about who wrote it. Also printed to
 * stderr so a caller reading only the process output sees it.
 */
export function strayWriteWarning({ repoRoot, strayPaths }) {
  if (!Array.isArray(strayPaths) || strayPaths.length === 0) return null;
  process.stderr.write(
    `fgos: warning: paths outside the worker's workspace became dirty in ${repoRoot} during the round (another session may have written them): ${strayPaths.join(', ')}\n`,
  );
  return {
    code: 'stray-write-correlated',
    level: 'correlated',
    basis: ['pre-post-git-snapshot'],
    repoRoot,
    paths: strayPaths,
  };
}
