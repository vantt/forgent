// paths.mjs — canonical root-path resolver (tsk-63j, D1/D2/D5). Single
// place that resolves the fgOS storage root, logs dir, and skill root, so
// bin/fgos.mjs, fgos-runner, and session/worktree management stop deriving
// these independently.
//
// One Git read of the repository facts feeds every root answer in this file:
// the invocation-root door, `resolveRepoRoot` and `resolveMainCheckoutRoot`.
// A caller holding the facts passes them through `facts`, so one invocation
// reads Git once for all three.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { NO_GIT_DOOR_CODES, createGitInspect, gitPortOptions, readRepoFacts, worktreeDoor } from '../git/inspect.mjs';
import { branchNameFor, checkoutPathForBranch, realpathOrSelf } from './worktree.mjs';

function validationError(message) {
  const error = new Error(message);
  error.category = 'validation';
  return error;
}

/** `readRepoFacts` that reads an unreadable repository as no repository. */
function repoFactsOrNone(cwd, facts) {
  if (facts) return facts;
  try {
    return readRepoFacts(cwd);
  } catch {
    return { notARepository: true };
  }
}

/** Resolve the repo root: the checkout `cwd` sits in, asked of Git Inspect
 * — never `__dirname`, since fgos-runner's binary may live in a different
 * repo than the one it runs on. Throws with category 'validation' when `cwd`
 * is not inside a git repo, or the repo has no resolvable HEAD (no commits
 * yet). */
export function resolveRepoRoot(cwd = process.cwd(), { facts } = {}) {
  let inspect;
  let repoRoot;
  try {
    inspect = createGitInspect(gitPortOptions(cwd));
    const answer = facts ?? inspect.resolveRepo();
    if (answer.notARepository || !answer.worktreeRoot) throw new Error('not a git checkout');
    repoRoot = answer.worktreeRoot;
  } catch (err) {
    throw validationError(`fgos-runner must run inside a git repository (cwd: ${cwd}): ${err.message}`);
  }
  let head = null;
  try {
    head = inspect.resolveCommit({ name: 'HEAD' });
  } catch {
    // unreadable HEAD reads as no commit
  }
  if (typeof head !== 'string') {
    throw validationError(
      `fgos-runner requires at least one commit in ${repoRoot} (HEAD does not resolve) -- run "git commit" (e.g. an initial commit) before running fgos-runner`,
    );
  }
  return realpathOrSelf(repoRoot);
}

/** Resolve the MAIN CHECKOUT root — never a linked worktree's own root,
 * unlike `resolveRepoRoot` above (which returns whichever checkout `cwd`
 * sits in). Via Git Inspect's trusted main root, the checkout that owns the
 * common `.git` regardless of which worktree `cwd` is inside. Returns `null`,
 * never throws, when `cwd` is not inside a git checkout at all. `.fgos/` is
 * unconditionally wiped from every freshly-created worktree (ADR0020) — any
 * caller that needs the real `.fgos/config.json` (not a worktree-local
 * phantom) must resolve through this function, never `resolveRepoRoot`. */
export function resolveMainCheckoutRoot(cwd = process.cwd(), { facts } = {}) {
  const answer = repoFactsOrNone(cwd, facts);
  return answer.notARepository || !answer.trustedMainRoot ? null : realpathOrSelf(answer.trustedMainRoot);
}

const isDirectory = (target) => {
  try {
    return fs.statSync(target).isDirectory();
  } catch {
    return false;
  }
};

// An install with no Git door has no repository to judge: the answer is the named directory itself, never a walk,
// because the Git ceiling of a walk is something only the door knows. The destructive policy has no such exception.
function rootWithoutGitDoor({ cwd, dir, policy }, cause) {
  if (policy === 'main-checkout-only') throw validationError(`cannot establish the main checkout of "${cwd}": ${cause}`);
  const root = path.resolve(typeof dir === 'string' && dir.trim() ? dir : cwd);
  return { root, fgosDir: fgosDirFromRoot(root), found: isDirectory(path.join(root, '.fgos')) };
}

/**
 * Which project, and which `.fgos`, an invocation acts on: `{ root, fgosDir, found }`. The decision, its four policies
 * (`caller-tree`, `main-checkout`, `main-checkout-only`, `strict-cwd`) and every refusal text belong to `fgos-git`
 * (`packages/git/rust/src/invocation_root.rs`); this is the adapter that carries the request and maps a refusal to a
 * `validation` error.
 *
 * `dir` is the caller's request for the root. `facts` are Git facts the caller already read: when passed, they are the only
 * Git answer the door uses (one read per invocation).
 */
export function resolveInvocationRoot({ cwd = process.cwd(), dir, policy = 'caller-tree', home = os.homedir(), facts } = {}) {
  let answer;
  try {
    answer = worktreeDoor('resolveInvocationRoot', { cwd, dir: dir === undefined ? null : typeof dir === 'string' ? dir : '', policy, home, facts: facts ?? null });
  } catch (err) {
    if (!NO_GIT_DOOR_CODES.has(err?.code)) throw err;
    return rootWithoutGitDoor({ cwd, dir, policy }, err.message);
  }
  if (answer.refused) throw validationError(answer.refused.message);
  return answer;
}

/** Join an already-resolved repo root onto `.fgos` — the single place that
 * join happens, so every caller that already has a root (however it got
 * resolved) produces the identical path. */
export function fgosDirFromRoot(root) {
  return path.join(path.resolve(root), '.fgos');
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

/** Resolve an executable on PATH. Platform-aware (handles PATHEXT on win32). */
export function findExecutableOnPath(candidateNames, pathEnv = process.env.PATH) {
  const dirs = typeof pathEnv === 'string' && pathEnv ? pathEnv.split(path.delimiter).filter(Boolean) : [];
  const defaultExts = process.platform === 'win32' ? (process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';').filter(Boolean) : [''];
  for (const name of candidateNames) {
    const hasExt = process.platform === 'win32' && path.extname(name) !== '';
    const exts = hasExt ? ['', ...defaultExts] : defaultExts;
    for (const dir of dirs) {
      for (const ext of exts) {
        try {
          fs.accessSync(path.join(dir, name + ext), fs.constants.X_OK);
          return name;
        } catch {
          // not found in this PATH entry — keep scanning
        }
      }
    }
  }
  return null;
}

/**
 * Whether `command` can be started on this machine: a bare name resolves on PATH, a path (absolute or
 * relative, any separator) names an executable file; a relative path resolves against the process's working
 * directory, so a command in a config is an absolute path or a bare name.
 */
export function isCommandAvailable(command, pathEnv = process.env.PATH) {
  if (typeof command !== 'string' || command === '') return false;
  if (!/[\\/]/.test(command)) return findExecutableOnPath([command], pathEnv) !== null;
  try {
    fs.accessSync(command, fs.constants.X_OK);
    return !fs.statSync(command).isDirectory();
  } catch {
    return false;
  }
}

export const DEFAULT_DOMAIN = 'coding';

/** Resolve the file path for a task-spec (`specId`) belonging to `domain` (or `'core'`). */
export function resolveTaskSpecPath(domain, specId, options = {}) {
  const root = typeof options === 'string' ? options : (options?.cwd ?? '');
  let domainName;
  if (typeof domain === 'string') {
    domainName = domain;
  } else if (domain && typeof domain === 'object') {
    domainName = domain.name ?? DEFAULT_DOMAIN;
  } else {
    domainName = DEFAULT_DOMAIN;
  }
  const filename = specId && specId.endsWith('.md') ? specId : `${specId}.md`;
  const relativePath = domainName === 'core'
    ? path.join('core', 'task-specs', filename)
    : path.join('domains', domainName, 'task-specs', filename);

  return root ? path.join(root, relativePath) : relativePath;
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
// 2) the item's own fgw/<id> worktree from Git Inspect's worktree list
//    (`checkoutPathForBranch`, the same "is this branch checked out
//    somewhere" read `promote-preflight.mjs` uses)
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
    const worktreePath = checkoutPathForBranch(stateRoot, branchNameFor(id));
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
// diagnostic logs...) moved to
// src/state/fgos-file-registry.mjs (kernel layer, tsk phase-03): this
// module (infra) reads git, so a domain/kernel-layer caller
// importing FGOS_FILE/resolveFgosFile from here would violate the
// one-directional-layer rule (test/architecture.test.mjs). Import from
// there instead.
