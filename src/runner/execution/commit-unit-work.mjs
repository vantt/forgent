// commit-unit-work.mjs — the runner commits a producer's work, the producer never does.
//
// A confined producer can write files in its Unit worktree and its outbox, and
// nothing under git's metadata (its own gitdir and the shared common dir are
// read-only): a worker able to write there could move any branch ref or
// overwrite objects of the whole repository. So after a producer round passes,
// this trusted code, running outside the confinement, stages and commits what
// the worker left in the worktree -- only the part inside the unit's write
// scope, and only paths it staged itself.

import { execFileSync } from 'node:child_process';

import { partitionPaths } from '../dispatch/write-scope.mjs';

const STORE_PREFIX = '.fgos/';

/** Conventional commit subject: `type(scope)!: text`. */
const CONVENTIONAL_SUBJECT = /^(feat|fix|docs|refactor|test|chore|perf|build|ci|style|revert)(\([^)]+\))?!?: \S/;

const SUBJECT_MAX = 100;

function git(cwd, args, { env, input } = {}) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: [input === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
    ...(input === undefined ? {} : { input }),
    env: env ? { ...process.env, ...env } : process.env,
  });
}

const nulList = (out) => out.split('\0').filter(Boolean);

function hasConfigured(cwd, key) {
  try {
    return git(cwd, ['config', '--get', key]).trim() !== '';
  } catch {
    return false;
  }
}

/** Paths in the index that differ from HEAD; renames are reported as their two halves. */
export function stagedPaths(worktree) {
  return nulList(git(worktree, ['diff', '--cached', '--name-only', '--no-renames', '-z']));
}

/**
 * Every path `git status` sees as changed, staged or not, untracked files one by one. An unstaged
 * rename shows up as a deletion and an untracked file, so each half is judged on its own.
 */
export function changedPaths(worktree) {
  const fields = git(worktree, ['status', '--porcelain=v1', '-z', '--untracked-files=all']).split('\0');
  const paths = [];
  for (let i = 0; i < fields.length; i += 1) {
    const entry = fields[i];
    if (entry.length < 4) continue;
    paths.push(entry.slice(3));
    // A staged rename or copy is followed by its source path.
    if (entry[0] === 'R' || entry[0] === 'C') paths.push(fields[++i]);
  }
  return [...new Set(paths)];
}

const outsideStore = (p) => !p.startsWith(STORE_PREFIX) && p !== '.fgos';

/**
 * What the worktree holds before a producer launches: paths already staged (the run must refuse
 * them, it stages only what it chose) and paths already dirty inside the scope (never committed
 * by the run; they stay for whoever left them).
 */
export function preflightUnitWorktree({ worktree, scope }) {
  return {
    foreignStaged: stagedPaths(worktree),
    preExistingInScope: partitionPaths(changedPaths(worktree).filter(outsideStore), scope).inScope,
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
function withPaths(worktree, args, paths) {
  return git(worktree, [...args, '--pathspec-from-file=-', '--pathspec-file-nul'], {
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
 * @param {string} p.unitId
 * @param {string} [p.summary]
 * @param {string[]} p.scope canonical write scope; `['**']` for "everything outside .fgos"
 * @param {string[]|null} [p.changedFiles] what the run's evidence says the agent changed
 * @param {string[]} [p.excludePaths]
 * @param {string[]} [p.needsWrites] paths the agent said it needed beyond the scope, echoed back
 * @returns {{ status: 'committed'|'no-changes'|'failed', sha?: string, subject?: string, files?: string[],
 *   outOfScope: string[], preExistingInScope: string[], needsWrites?: string[], reason?: string, error?: string }}
 */
export function commitUnitWork({ worktree, unitId, summary, scope, changedFiles = null, excludePaths = [], needsWrites }) {
  if (!Array.isArray(scope)) throw new TypeError('commitUnitWork requires a write scope (use ["**"] for the whole worktree)');
  const base = {
    outOfScope: [],
    preExistingInScope: [...excludePaths],
    ...(Array.isArray(needsWrites) ? { needsWrites } : {}),
  };
  const failed = (reason, detail, extra = {}) => ({ status: 'failed', reason, error: detail, ...base, ...extra });
  try {
    const foreign = stagedPaths(worktree);
    if (foreign.length > 0) {
      return failed('foreign-staged-index', foreignIndexDetail(foreign), { stagedPaths: foreign });
    }

    const excluded = new Set(excludePaths);
    const candidates = changedPaths(worktree).filter((p) => outsideStore(p) && !excluded.has(p));
    const { inScope, outOfScope } = partitionPaths(candidates, scope);
    const agentChanged = new Set(changedFiles ?? []);
    base.outOfScope = outOfScope.filter((p) => agentChanged.has(p));
    if (inScope.length === 0) return { status: 'no-changes', ...base };

    withPaths(worktree, ['add', '-A'], inScope);
    const nowStaged = stagedPaths(worktree);
    if (!sameSet(nowStaged, inScope)) {
      // Take back only what this call staged; whatever else appeared in the index is not ours.
      try { withPaths(worktree, ['reset', '-q'], inScope); } catch { /* reported below */ }
      return failed('staged-set-mismatch', 'the index after staging does not hold exactly the in-scope paths', {
        unexpected: nowStaged.filter((p) => !inScope.includes(p)),
        missing: inScope.filter((p) => !nowStaged.includes(p)),
      });
    }

    const subject = subjectFrom(summary, unitId);
    // Use the repository's own identity; only fill the gap when it has none.
    const identity = {};
    if (!hasConfigured(worktree, 'user.name')) {
      identity.GIT_AUTHOR_NAME = identity.GIT_COMMITTER_NAME = 'fgOS runner';
    }
    if (!hasConfigured(worktree, 'user.email')) {
      identity.GIT_AUTHOR_EMAIL = identity.GIT_COMMITTER_EMAIL = 'runner@fgos.local';
    }
    git(worktree, ['commit', '-q', '-m', subject], { env: identity });
    const sha = git(worktree, ['rev-parse', 'HEAD']).trim();

    // A pre-commit hook can still change the index between the check above and the commit.
    const inCommit = nulList(git(worktree, ['show', '--name-only', '--no-renames', '--format=', '-z', 'HEAD']));
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

/** Whether `sha` is still in the history of the worktree's HEAD. */
export function commitOnBranch(worktree, sha) {
  try {
    git(worktree, ['merge-base', '--is-ancestor', sha, 'HEAD']);
    return true;
  } catch {
    return false;
  }
}
