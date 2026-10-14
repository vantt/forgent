// commit-unit-work.mjs — the runner commits a producer's work, the producer never does.
//
// A confined producer can write files in its Unit worktree and its outbox, and
// nothing under git's metadata (its own gitdir and the shared common dir are
// read-only): a worker able to write there could move any branch ref or
// overwrite objects of the whole repository. So after a producer round passes,
// this trusted code, running outside the confinement, stages and commits what
// the worker left in the worktree -- only the part inside the unit's write
// scope, and only paths it staged itself.
//
// Everything in the worktree is the worker's to write, the `.git` pointer file
// and any hook directory a relative core.hooksPath names included. So the git
// calls here never read either from the worktree: the gitdir comes from the
// main repository, the hook path is resolved against the main checkout, no
// fsmonitor runs, and no GIT_* variable of the caller's environment applies.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { partitionPaths } from '../dispatch/write-scope.mjs';

const STORE_PREFIX = '.fgos/';

/** Conventional commit subject: `type(scope)!: text`. */
const CONVENTIONAL_SUBJECT = /^(feat|fix|docs|refactor|test|chore|perf|build|ci|style|revert)(\([^)]+\))?!?: \S/;

const SUBJECT_MAX = 100;

/** GIT_* variables that name who commits or which user config applies, never which repository. */
const KEPT_GIT_ENV = /^GIT_(AUTHOR|COMMITTER)_(NAME|EMAIL|DATE)$|^GIT_CONFIG_(GLOBAL|SYSTEM|NOSYSTEM)$/;

/** The caller's environment without the GIT_* variables that could redirect these calls. */
function cleanEnv(extra = {}) {
  const env = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith('GIT_') || KEPT_GIT_ENV.test(key)) env[key] = value;
  }
  return { ...env, ...extra };
}

function rawGit(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: cleanEnv() });
}

/** Raised when `worktree` is not a working tree of the trusted repository. */
class UntrustedWorktreeError extends Error {}

/**
 * How to run git on `worktree`. `repoRoot` must be the main checkout, which a confined worker
 * cannot write: the gitdir is looked up from that repository's own worktree list, never read from
 * the worktree's `.git` file.
 */
export function gitContext({ worktree, repoRoot }) {
  if (!repoRoot) throw new TypeError('the runner commit requires repoRoot (the main checkout): the gitdir is never read from the worktree');
  const workTree = fs.realpathSync(worktree);
  const prefix = ['-c', 'core.fsmonitor=false'];

  const mainRoot = fs.realpathSync(repoRoot);
  const commonDir = path.resolve(mainRoot, rawGit(mainRoot, ['rev-parse', '--git-common-dir']).trim());
  // A linked worktree named as the root would hand its own (worker-writable) pointer the trust.
  if (fs.realpathSync(path.dirname(commonDir)) !== mainRoot) {
    throw new UntrustedWorktreeError(`${mainRoot} is not the main checkout of its repository; pass the main checkout as repoRoot`);
  }
  let gitDir = null;
  if (workTree === mainRoot) {
    gitDir = commonDir;
  } else {
    const linked = path.join(commonDir, 'worktrees');
    for (const name of fs.existsSync(linked) ? fs.readdirSync(linked) : []) {
      let pointer;
      try { pointer = fs.readFileSync(path.join(linked, name, 'gitdir'), 'utf8').trim(); } catch { continue; }
      let target;
      try { target = fs.realpathSync(path.dirname(path.resolve(linked, name, pointer))); } catch { continue; }
      if (target === workTree) { gitDir = path.join(linked, name); break; }
    }
  }
  if (!gitDir) throw new UntrustedWorktreeError(`${workTree} is not a working tree of the repository at ${mainRoot}`);

  // A relative hooks path is read against the main checkout, whose hooks the worker cannot edit.
  let hooksPath = '';
  try { hooksPath = rawGit(mainRoot, ['config', '--get', 'core.hooksPath']).trim(); } catch { /* unset */ }
  if (hooksPath && !path.isAbsolute(hooksPath) && !hooksPath.startsWith('~')) {
    prefix.push('-c', `core.hooksPath=${path.resolve(mainRoot, hooksPath)}`);
  }
  return { cwd: workTree, prefix: ['--git-dir', gitDir, '--work-tree', workTree, ...prefix] };
}

function git(ctx, args, { env, input } = {}) {
  return execFileSync('git', [...ctx.prefix, ...args], {
    cwd: ctx.cwd,
    encoding: 'utf8',
    stdio: [input === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
    ...(input === undefined ? {} : { input }),
    env: cleanEnv(env),
  });
}

const nulList = (out) => out.split('\0').filter(Boolean);

function hasConfigured(ctx, key) {
  try {
    return git(ctx, ['config', '--get', key]).trim() !== '';
  } catch {
    return false;
  }
}

/** Paths in the index that differ from HEAD; renames are reported as their two halves. */
export function stagedPaths(ctx) {
  return nulList(git(ctx, ['diff', '--cached', '--name-only', '--no-renames', '-z']));
}

/**
 * Every path `git status` sees as changed, staged or not, untracked files one by one. An unstaged
 * rename shows up as a deletion and an untracked file, so each half is judged on its own.
 */
export function changedPaths(ctx) {
  // Content changes inside a submodule are not a change of this repository: staging the
  // submodule path would stage nothing and the staged-set check would fail.
  const fields = git(ctx, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--ignore-submodules=dirty']).split('\0');
  const paths = [];
  for (let i = 0; i < fields.length; i += 1) {
    const entry = fields[i];
    if (entry.length < 4) continue;
    // An untracked nested repository is listed as `dir/` but staged (as a gitlink) as `dir`.
    paths.push(entry.slice(3).replace(/\/$/, ''));
    // A rename or copy, staged or intent-to-add, is followed by its source path.
    if ('RC'.includes(entry[0]) || 'RC'.includes(entry[1])) paths.push(fields[++i]);
  }
  return [...new Set(paths)];
}

const outsideStore = (p) => !p.startsWith(STORE_PREFIX) && p !== '.fgos';

/**
 * What the worktree holds before a producer launches: paths already staged (the run must refuse
 * them, it stages only what it chose) and paths already dirty inside the scope (never committed
 * by the run; they stay for whoever left them).
 */
export function preflightUnitWorktree({ worktree, repoRoot, scope }) {
  const ctx = gitContext({ worktree, repoRoot });
  return {
    foreignStaged: stagedPaths(ctx),
    preExistingInScope: partitionPaths(changedPaths(ctx).filter(outsideStore), scope).inScope,
  };
}

/** The refusal text for a staged index this run did not make. */
export function foreignIndexDetail(paths) {
  return `the index has staged changes this run did not make: ${paths.join(', ')}; unstage or commit them, then run again`;
}

/** First non-empty line of the agent's own summary, as a conventional subject. */
export function subjectFrom(summary, unitId) {
  const line = String(summary ?? '').split(/\r?\n/).map((l) => l.trim()).find(Boolean) ?? '';
  const bounded = (text) => (text.length > SUBJECT_MAX ? `${text.slice(0, SUBJECT_MAX - 3)}...` : text);
  if (CONVENTIONAL_SUBJECT.test(line)) return bounded(line);
  const ownPrefix = `${unitId}: `;
  const text = line.startsWith(ownPrefix) ? line.slice(ownPrefix.length).trim() : line;
  return bounded(`chore(${unitId}): ${text || 'producer changes'}`);
}

const sameSet = (a, b) => a.length === b.length && new Set([...a, ...b]).size === a.length;

/** Literal pathspecs on stdin: no argument limit, and no `*`, `[` or `:(magic)` reading. */
function withPaths(ctx, args, paths) {
  return git(ctx, [...args, '--pathspec-from-file=-', '--pathspec-file-nul'], {
    env: { GIT_LITERAL_PATHSPECS: '1' },
    input: `${paths.join('\0')}\0`,
  });
}

/**
 * Stage and commit what the producer left in `worktree` inside `scope`.
 *
 * Refuses (`foreign-staged-index`) when anything is already staged: the runner stages only paths
 * it chose. `.fgos/` is never staged: fgOS state is written through its own door and a worker
 * branch must not carry it. `excludePaths` (paths dirty in scope before the producer launched)
 * are left in the worktree for the caller. `outOfScope` lists changed paths outside the scope
 * that the agent itself changed (`changedFiles`); a path dirty before the run cannot be told apart.
 *
 * @param {object} p
 * @param {string} p.worktree
 * @param {string} p.repoRoot the main checkout; the trusted source of the gitdir and hooks
 * @param {string} p.unitId
 * @param {string} [p.summary]
 * @param {string[]} p.scope canonical write scope; `['**']` for "everything outside .fgos"
 * @param {string[]|null} [p.changedFiles] what the run's evidence says the agent changed
 * @param {string[]} [p.excludePaths]
 * @param {string[]} [p.needsWrites] paths the agent said it needed beyond the scope, echoed back
 * @returns {{ status: 'committed'|'no-changes'|'failed', sha?: string, subject?: string, files?: string[],
 *   outOfScope: string[], preExistingInScope: string[], needsWrites?: string[], reason?: string, error?: string }}
 */
export function commitUnitWork({ worktree, repoRoot, unitId, summary, scope, changedFiles = null, excludePaths = [], needsWrites }) {
  if (!Array.isArray(scope)) throw new TypeError('commitUnitWork requires a write scope (use ["**"] for the whole worktree)');
  if (!repoRoot) throw new TypeError('commitUnitWork requires repoRoot (the main checkout): the gitdir is never read from the worktree');
  const base = {
    outOfScope: [],
    preExistingInScope: [...excludePaths],
    ...(Array.isArray(needsWrites) ? { needsWrites } : {}),
  };
  const failed = (reason, detail, extra = {}) => ({ status: 'failed', reason, error: detail, ...base, ...extra });
  try {
    let ctx;
    try {
      ctx = gitContext({ worktree, repoRoot });
    } catch (err) {
      if (err instanceof UntrustedWorktreeError) return failed('untrusted-worktree', err.message);
      throw err;
    }
    const foreign = stagedPaths(ctx);
    if (foreign.length > 0) {
      return failed('foreign-staged-index', foreignIndexDetail(foreign), { stagedPaths: foreign });
    }

    const excluded = new Set(excludePaths);
    const candidates = changedPaths(ctx).filter((p) => outsideStore(p) && !excluded.has(p));
    const { inScope, outOfScope } = partitionPaths(candidates, scope);
    const agentChanged = new Set(changedFiles ?? []);
    base.outOfScope = outOfScope.filter((p) => agentChanged.has(p));
    if (inScope.length === 0) return { status: 'no-changes', ...base };

    // From here until the commit lands, a failure takes back only what this call staged, so a
    // retry does not find the runner's own staging and refuse it as foreign.
    const unstage = () => { try { withPaths(ctx, ['reset', '-q'], inScope); } catch { /* best effort */ } };
    try {
      withPaths(ctx, ['add', '-A'], inScope);
    } catch (err) {
      unstage();
      throw err;
    }
    const nowStaged = stagedPaths(ctx);
    if (!sameSet(nowStaged, inScope)) {
      unstage();
      return failed('staged-set-mismatch', 'the index after staging does not hold exactly the in-scope paths', {
        unexpected: nowStaged.filter((p) => !inScope.includes(p)),
        missing: inScope.filter((p) => !nowStaged.includes(p)),
      });
    }

    const subject = subjectFrom(summary, unitId);
    // Use the repository's own identity; only fill the gap when it has none.
    const identity = {};
    if (!hasConfigured(ctx, 'user.name')) {
      identity.GIT_AUTHOR_NAME = identity.GIT_COMMITTER_NAME = 'fgOS runner';
    }
    if (!hasConfigured(ctx, 'user.email')) {
      identity.GIT_AUTHOR_EMAIL = identity.GIT_COMMITTER_EMAIL = 'runner@fgos.local';
    }
    try {
      git(ctx, ['commit', '-q', '-m', subject], { env: identity });
    } catch (err) {
      unstage();
      throw err;
    }
    const sha = git(ctx, ['rev-parse', 'HEAD']).trim();

    // A pre-commit hook can still change the index between the check above and the commit.
    const inCommit = nulList(git(ctx, ['show', '--name-only', '--no-renames', '--format=', '-z', 'HEAD']));
    if (!sameSet(inCommit, inScope)) {
      const unexpected = inCommit.filter((p) => !inScope.includes(p));
      const missing = inScope.filter((p) => !inCommit.includes(p));
      return failed('committed-set-mismatch', `commit ${sha} is on the branch but does not hold exactly the in-scope paths (unexpected: ${unexpected.join(', ') || 'none'}; missing: ${missing.join(', ') || 'none'})`, {
        sha, subject, files: inCommit, unexpected, missing,
      });
    }
    return { status: 'committed', sha, subject, files: inScope, ...base };
  } catch (err) {
    const detail = err.stderr ? String(err.stderr).trim() : err.message;
    return failed('git-error', detail);
  }
}

/** Whether `sha` is still in the history of the worktree's HEAD. A worktree it cannot trust throws. */
export function commitOnBranch(worktree, sha, repoRoot) {
  const ctx = gitContext({ worktree, repoRoot });
  try {
    git(ctx, ['merge-base', '--is-ancestor', sha, 'HEAD']);
    return true;
  } catch {
    return false;
  }
}
