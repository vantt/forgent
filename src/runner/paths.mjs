// paths.mjs — canonical root-path resolver (tsk-63j, D1/D2/D5). Single
// place that resolves the fgOS storage root, logs dir, and skill root, so
// bin/fgos.mjs, fgos-runner, and session/worktree management stop deriving
// these independently.
//
// D5: root resolution takes an explicit `strict` mode rather than picking
// one behavior for both existing callers — bin/fgos.mjs's CLI is
// intentionally cwd-strict (never git-resolved, see its own dataDir()
// comment), while fgos-runner/session management deliberately resolves via
// git so it works correctly from inside a worktree. Both are preserved
// exactly; `strict` is the switch between them.

import { execFileSync } from 'node:child_process';
import path from 'node:path';

/** Resolve the repo root. Default (git) mode shells out to `git
 * rev-parse --show-toplevel` — never `__dirname`, since fgos-runner's
 * binary may live in a different repo than the one it runs on — and
 * throws with category 'validation' when `cwd` is not inside a git repo,
 * or the repo has no resolvable HEAD (no commits yet). `strict: true`
 * (bin/fgos.mjs's CLI contract) skips git entirely and returns `cwd`
 * as-is: `.fgos/` always lives under the caller's own cwd, never
 * resolved upward, never treating a worktree as equivalent to its main
 * checkout. */
export function resolveRepoRoot(cwd = process.cwd(), { strict = false } = {}) {
  if (strict) return cwd;

  let repoRoot;
  try {
    repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd,
      encoding: 'utf8',
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (err) {
    const error = new Error(`fgos-runner must run inside a git repository (cwd: ${cwd}): ${err.message}`);
    error.category = 'validation';
    throw error;
  }
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', 'HEAD'], {
      cwd: repoRoot,
      encoding: 'utf8',
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch {
    const error = new Error(
      `fgos-runner requires at least one commit in ${repoRoot} (HEAD does not resolve) -- run "git commit" (e.g. an initial commit) before running fgos-runner`,
    );
    error.category = 'validation';
    throw error;
  }
  return repoRoot;
}

/** Resolve the MAIN CHECKOUT root — never a linked worktree's own root,
 * unlike `resolveRepoRoot` above (`--show-toplevel`, which returns
 * whichever checkout `cwd` sits in). Via `--git-common-dir`, which always
 * points at the main checkout's `.git` regardless of which worktree `cwd`
 * is inside (same resolution `scripts/fgos-shell-integration.sh`'s `fgos`
 * shell function already uses). Returns `null`, never throws, when `cwd`
 * is not inside a git checkout at all — the one real caller of this
 * distinction (tsk-5hv, extracted from `src/setup/registrations.mjs`'s
 * own `resolveMainCheckout`, now delegating here instead of duplicating
 * the git shell-out) needs a graceful "nothing to resolve" path, not a
 * thrown validation error. `.fgos/` is unconditionally wiped from every
 * freshly-created worktree (ADR0020) — any caller that needs the real
 * `.fgos/config.json` (not a worktree-local phantom) must resolve through
 * this function, never `resolveRepoRoot`. */
export function resolveMainCheckoutRoot(cwd = process.cwd()) {
  let commonDir;
  try {
    commonDir = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], {
      cwd,
      encoding: 'utf8',
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return null;
  }
  return commonDir ? path.dirname(commonDir) : null;
}

/** Join an already-resolved repo root onto `.fgos` — the single place that
 * join happens, so every caller that already has a root (however it got
 * resolved) produces the identical path. */
export function fgosDirFromRoot(root) {
  return path.join(path.resolve(root), '.fgos');
}

/** Resolve the repo root (per `opts`' `strict`/`cwd`) and join `.fgos` in
 * one call — the shape most callers actually want. */
export function resolveFgosDir(cwd = process.cwd(), opts = {}) {
  return fgosDirFromRoot(resolveRepoRoot(cwd, opts));
}

/** The logs directory under an already-resolved `.fgos` root. */
export function resolveLogsDir(fgosDir) {
  return path.join(fgosDir, 'logs');
}

/** Resolve the skill root the same way the `plugins/fgOS/skills` per-verb
 * `SKILL.md` templates' own shell substitution does (D4-revised): the templates keep
 * their existing `${CLAUDE_PROJECT_DIR}${FGOS_NESTED_PREFIX:+/$FGOS_NESTED_PREFIX}`
 * pattern unchanged (it is read nowhere in JS and resolves before Node
 * starts, so an in-process function cannot become that read) — this is a
 * second, independent reader of the same variable name for JS-side needs.
 * Returns `null` when `CLAUDE_PROJECT_DIR` is unset (nothing to resolve
 * against). */
export function resolveSkillRoot(env = process.env) {
  const projectDir = env.CLAUDE_PROJECT_DIR;
  if (!projectDir) return null;
  const nestedPrefix = env.FGOS_NESTED_PREFIX;
  return nestedPrefix ? path.join(projectDir, nestedPrefix) : projectDir;
}

// Well-known FILE paths under `.fgos/` (state.json, tool-status.local.json,
// the truncation-guard mark, diagnostic logs...) moved to
// src/state/fgos-file-registry.mjs (kernel layer, tsk phase-03): this
// module (infra) shells out to git, so a domain/kernel-layer caller
// importing FGOS_FILE/resolveFgosFile from here would violate the
// one-directional-layer rule (test/architecture.test.mjs). Import from
// there instead.
