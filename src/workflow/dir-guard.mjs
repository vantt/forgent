// dir-guard.mjs — spot a `--dir <project>` that names a different project than the one the
// process runs in. Storage follows `--dir`, but a worker pane takes the process's own working
// directory, so the workers end up outside the project whose paths they were given.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// Set by a detached advance for the process it spawns; that process carries the decision made
// by the caller that spawned it, so it does not warn a second time.
const ADVANCE_DETACHED_ENV = 'FGOS_WORKFLOW_ADVANCE_DETACHED';

function realOrResolved(p) {
  try {
    return fs.realpathSync(p);
  } catch {
    return path.resolve(p);
  }
}

/** The checkout's own root and the root shared by all its linked worktrees; null outside a repository. */
function gitRoots(dir) {
  try {
    const git = (args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const toplevel = realOrResolved(git(['rev-parse', '--show-toplevel']));
    const common = realOrResolved(path.resolve(toplevel, git(['rev-parse', '--git-common-dir'])));
    return { toplevel, common };
  } catch {
    return null;
  }
}

function isInside(inner, outer) {
  const rel = path.relative(outer, inner);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

/**
 * The warning for a `--dir` that points at another project than the working directory, or null.
 * Null when there is no `--dir`, an explicit `--worktree` already says where workers run, the
 * process is a detached child, either side is not a git repository, both are the same repository
 * (linked worktrees), or one project sits inside the other.
 *
 * @returns {{ code: string, message: string, fix: string } | null}
 */
export function dirDiffersFromCwdWarning({ dir, worktree, cwd = process.cwd(), env = process.env } = {}) {
  if (!dir || worktree || env[ADVANCE_DETACHED_ENV] === '1') return null;
  const target = gitRoots(path.resolve(dir));
  const here = gitRoots(cwd);
  if (!target || !here || target.common === here.common) return null;
  if (isInside(target.toplevel, here.toplevel) || isInside(here.toplevel, target.toplevel)) return null;
  return {
    code: 'dir-differs-from-cwd',
    message: `--dir ${target.toplevel} is a different project than the current directory ${here.toplevel}: state is stored under --dir, but workers start in ${here.toplevel} and cannot read ${target.toplevel} without a permission prompt`,
    fix: `cd ${target.toplevel} first and run fgos from there (or pass --worktree ${target.toplevel})`,
  };
}

/**
 * Check for the mismatch and, when there is one, print it on stderr as one line right away
 * (a foreground run can take minutes), returning the warning for the caller's output.
 */
export function checkDirDiffersFromCwd(options = {}, { stderr = process.stderr } = {}) {
  const warning = dirDiffersFromCwdWarning(options);
  if (warning) stderr.write(`warning [${warning.code}]: ${warning.message}. Fix: ${warning.fix}\n`);
  return warning;
}

/** Return `result` with the warning listed under `warnings`; untouched when there is no warning. */
export function attachDirWarning(result, warning) {
  if (!warning || result === null || typeof result !== 'object' || Array.isArray(result)) return result;
  return { ...result, warnings: [...(result.warnings ?? []), warning] };
}
