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
import fs from 'node:fs';
import path from 'node:path';
import { branchNameFor, findCheckoutPath } from './worktree.mjs';

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

// Best-effort read of the locked-decisions artifacts fgos-coding-exploring/
// fgos-coding-planning write under `work.docsRef` (docs/history/<feature>/). A
// missing docsRef, or a missing/unreadable file under it, is never fatal.
//
// MOVED HERE from src/intake/plan.mjs (Cell 6.7 G1): this pure fs read had
// no use-case-layer dependency of its own, but living in plan.mjs made
// resolveContentRoot below (which infra callers like assignment-runner.mjs
// need) an upward "infra imports use-case" layering violation
// (test/architecture.test.mjs's one-directional-layer check). plan.mjs
// re-exports both this and resolveContentRoot unchanged for every existing
// caller (discovery.mjs, bin/fgos.mjs, operation-choice.mjs, loop.mjs, ...).
//
// EXPORTED (tsk-ozl D2): discovery.mjs's resolveDiscovery reuses this same
// read as its clarify-stage trust signal — a non-empty result means a
// human already locked decisions into CONTEXT.md, so re-judging blind is
// both wasteful and can re-ask an already-answered question.
export function readLockedContext(repoRoot, docsRef) {
  if (typeof docsRef !== 'string' || !docsRef.trim()) return '';
  const featureDir = path.join(repoRoot, docsRef);
  const sections = [];
  for (const file of ['CONTEXT.md', 'plan.md']) {
    try {
      const content = fs.readFileSync(path.join(featureDir, file), 'utf8');
      if (content.trim()) sections.push(`## ${file}\n${content.trim()}`);
    } catch {
      // optional artifact; absence is not an error (item may still be
      // mid-clarify with no plan.md yet, or predate fgos-coding-exploring)
    }
  }
  return sections.join('\n\n');
}

// CONTENT-ROOT RESOLUTION (tsk-1ni D1, moved from src/intake/plan.mjs per
// Cell 6.7 G1 -- see readLockedContext's own MOVED HERE note above): every
// caller of readLockedContext used to pass `stateRoot` (`path.dirname(dir)`,
// always the main checkout per ADR0020) as the content root too -- but
// fgos-coding-exploring/fgos-coding-planning commit CONTEXT.md/plan.md to
// the item's OWN fgw/<id> branch/worktree, never to main, so that always
// missed the real content in the standard interactive workflow (the exact
// scenario the trust-signal shortcuts above exist to serve). Tries, in
// order, first hit wins:
// 1) `process.cwd()` -- the common case: an interactive session invokes
//    `fgos discover`/`fgos plan` from inside the worktree it just
//    committed to (fgos-coding-exploring's/fgos-coding-planning's own hard rule: commit
//    before calling either verb). Zero extra cost.
// 2) the item's own fgw/<id> worktree via `git worktree list --porcelain`
//    (`findCheckoutPath`, the exact parse `promote-preflight.mjs` already
//    reuses for the same "is this branch checked out somewhere" question)
//    -- covers the crashed-mid-session case tsk-ozl D3 named as the
//    reason a sweep should trust a committed CONTEXT.md even with no live
//    session attached: the worktree still exists on disk after the
//    session that created it ends.
// 3) `stateRoot` itself -- today's prior behavior, last resort: the
//    item's branch already merged to main (content really does live at
//    stateRoot now), or a genuinely untouched item with nothing to find
//    either way (correctly fails open to requiring an explicit verdict,
//    unchanged).
// Never throws: any git/fs failure at a candidate just falls through to
// the next one, ending at the always-available stateRoot.
export function resolveContentRoot(stateRoot, id, docsRef) {
  const candidates = [process.cwd()];
  try {
    const listing = execFileSync('git', ['worktree', 'list', '--porcelain'], {
      cwd: stateRoot,
      encoding: 'utf8',
      shell: false,
    });
    const worktreePath = findCheckoutPath(listing, branchNameFor(id));
    if (worktreePath) candidates.push(worktreePath);
  } catch {
    // no git, or worktree list failed -- fall through to stateRoot
  }
  candidates.push(stateRoot);

  for (const candidate of candidates) {
    if (readLockedContext(candidate, docsRef)) return candidate;
  }
  return stateRoot;
}

// Well-known FILE paths under `.fgos/` (state.json, tool-status.local.json,
// the truncation-guard mark, diagnostic logs...) moved to
// src/state/fgos-file-registry.mjs (kernel layer, tsk phase-03): this
// module (infra) shells out to git, so a domain/kernel-layer caller
// importing FGOS_FILE/resolveFgosFile from here would violate the
// one-directional-layer rule (test/architecture.test.mjs). Import from
// there instead.
