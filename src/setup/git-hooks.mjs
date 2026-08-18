// git-hooks.mjs — infra layer: real git-config I/O for wiring this repo's
// `.githooks/pre-commit` (str65-worktree-isolation-enforcement's main-
// checkout lock) into a checkout. Two entry points, one each for the two
// activation paths this repo has (str88: `prepare`-lifecycle auto-wiring was
// removed because pnpm 10+ blocks it for a git-hosted dependency, leaving
// `npm run setup:hooks` / `fgos setup` as the only paths left):
//   - installGitHooks: the writer, used by scripts/install-git-hooks.mjs
//     (npm run setup:hooks) and by `fgos setup` (bin/fgos.mjs).
//   - mainCheckoutHookWired: the read-only check, used by `fgos doctor`
//     (src/setup/checks.mjs) and by `fgos setup`'s own report of what it did.

import { existsSync, rmSync, readdirSync, rmdirSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function readHooksPath(repoRoot) {
  try {
    return execFileSync('git', ['config', '--get', 'core.hooksPath'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

// core.hooksPath is shared repo-wide config (this repo does not set
// extensions.worktreeConfig), but a RELATIVE value does NOT reliably
// resolve against the MAIN checkout's own root: `.githooks/` is itself a
// tracked, versioned directory, so every linked worktree carries its own
// on-disk copy of `.githooks/pre-commit`, frozen at whatever commit that
// worktree's own branch currently has checked out (tsk-2u5, docs/history/
// stale-worktree-index-guard/CONTEXT.md D4 -- verified directly: a
// relative hooksPath runs each worktree's own frozen copy of the hook,
// never the main checkout's latest). `installGitHooks` below writes an
// ABSOLUTE path for exactly this reason. This resolver stays for
// `resolvesToGithooks`'s own comparison (matching either an absolute path
// already set, or a legacy relative one, against the canonical target)
// and for `uninstallGitHooks`'s detection. Falls back to `cwd` itself when
// git can't answer (no .git at all, or git unavailable), matching this
// module's existing never-throws contract.
function resolveRepoRoot(cwd) {
  try {
    const commonDir = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], {
      cwd,
      encoding: 'utf8',
    }).trim();
    return commonDir ? path.dirname(commonDir) : cwd;
  } catch {
    return cwd;
  }
}

// Resolves both `value` (git's own core.hooksPath) and the canonical
// `.githooks` target to absolute paths against the real repo root before
// comparing (tsk-1gn CONTEXT.md D2), instead of the raw string equality
// this module used to use. core.hooksPath surviving as an absolute path
// (observed drifting from relative sometime after 2026-07-28, cause
// undetermined -- tsk-1gn CONTEXT.md D3, out of scope) still resolves to
// the same directory and must read as wired -- from the main checkout AND
// from any of its linked worktrees alike.
function resolvesToGithooks(cwd, value) {
  if (value === '') return false;
  const repoRoot = resolveRepoRoot(cwd);
  return path.resolve(repoRoot, value) === path.resolve(repoRoot, '.githooks');
}

/**
 * Sets core.hooksPath to this repo root's own ABSOLUTE `.githooks` path
 * (never the bare relative string -- see the module-level comment above
 * `resolveRepoRoot` for why: a relative value resolves per-worktree, not
 * to this root, once `.githooks/` is a tracked, versioned directory), if
 * (and only if) a `.git` entry exists there (a directory for a plain
 * clone, a file for a linked worktree -- existsSync is true for both). Idempotent: safe
 * to run repeatedly (e.g. every `npm install`/`npm pack`, or every `fgos
 * setup`). No-ops silently when installed as a dependency (no `.git`
 * retained, per docs/specs/distribution.md) -- never throws.
 *
 * FILL-ONLY, never overwrite (matches this verb's other two side effects --
 * shell-rc.mjs's insertSourceLine only ever appends, config-merge.mjs's
 * mergeConfigDefaults never touches a value the user already has): a
 * pre-existing `core.hooksPath` pointing anywhere OTHER than `.githooks`
 * (husky, lefthook, a hand-rolled hooks dir) is left untouched -- silently
 * repointing it would stop the user's own hooks firing with zero warning.
 * Returns `{ wired, skippedExisting }`: `wired` is the FINAL state (true
 * whether freshly set or already correct); `skippedExisting` carries the
 * untouched custom value when one was found (`null` otherwise), for the
 * caller to surface.
 */
export function installGitHooks(repoRoot) {
  if (!existsSync(path.join(repoRoot, '.git'))) return { wired: false, skippedExisting: null };
  const current = readHooksPath(repoRoot);
  if (resolvesToGithooks(repoRoot, current)) return { wired: true, skippedExisting: null };
  if (current !== '') return { wired: false, skippedExisting: current };
  execFileSync('git', ['config', 'core.hooksPath', path.join(repoRoot, '.githooks')], { cwd: repoRoot });
  return { wired: true, skippedExisting: null };
}

/**
 * Whether `cwd`'s git config points `core.hooksPath` at this repo's own
 * `.githooks/` -- the str65 main-checkout lock only actually guards commits
 * when this is wired. Any other value (unset, or a different hooks dir)
 * means commits on this checkout are NOT running the lock check. Never
 * throws: a cwd with no `.git` at all (or git itself unavailable) reads the
 * same as "not wired".
 */
export function mainCheckoutHookWired(cwd) {
  try {
    const current = execFileSync('git', ['config', '--get', 'core.hooksPath'], { cwd, encoding: 'utf8' }).trim();
    return resolvesToGithooks(cwd, current);
  } catch {
    return false;
  }
}

/**
 * Reverses `installGitHooks` (tsk-4iv-1, CONTEXT.md D2): unsets
 * `core.hooksPath` and deletes `.githooks/pre-commit` (plus the `.githooks`
 * dir itself, if left empty), but ONLY when `core.hooksPath` is still
 * exactly `.githooks` at call time -- the same fill-only detection
 * `installGitHooks` uses to decide what it owns. Any other value (unset,
 * or a custom hooks dir the caller pointed at deliberately) is left
 * completely untouched, matching `installGitHooks`'s own "never touch a
 * value the user already has" contract in the opposite direction. Returns
 * `{ unwired, skippedExisting }`: `unwired` is true only when this call
 * actually changed something; `skippedExisting` carries the untouched
 * custom value when one was found (`null` otherwise).
 */
export function uninstallGitHooks(repoRoot) {
  if (!existsSync(path.join(repoRoot, '.git'))) return { unwired: false, skippedExisting: null };
  const current = readHooksPath(repoRoot);
  if (current === '') return { unwired: false, skippedExisting: null };
  if (!resolvesToGithooks(repoRoot, current)) return { unwired: false, skippedExisting: current };
  execFileSync('git', ['config', '--unset', 'core.hooksPath'], { cwd: repoRoot });
  const hooksDir = path.join(repoRoot, '.githooks');
  const preCommitPath = path.join(hooksDir, 'pre-commit');
  if (existsSync(preCommitPath)) {
    rmSync(preCommitPath);
  }
  if (existsSync(hooksDir) && readdirSync(hooksDir).length === 0) {
    rmdirSync(hooksDir);
  }
  return { unwired: true, skippedExisting: null };
}
