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

import { canonicalizeWriteEntry, partitionPaths } from '../dispatch/write-scope.mjs';
import { nulPaths, statusPaths, GIT_LIST_MAX_BUFFER } from '../../util/git-paths.mjs';

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
    maxBuffer: GIT_LIST_MAX_BUFFER,
    ...(input === undefined ? {} : { input }),
    env: cleanEnv(env),
  });
}

function hasConfigured(ctx, key) {
  try {
    return git(ctx, ['config', '--get', key]).trim() !== '';
  } catch {
    return false;
  }
}

/** Paths in the index that differ from HEAD; renames are reported as their two halves. */
export function stagedPaths(ctx) {
  return nulPaths(git(ctx, ['diff', '--cached', '--name-only', '--no-renames', '--no-relative', '-z']));
}

/**
 * Every path `git status` sees as changed, staged or not, untracked files one by one. An unstaged
 * rename shows up as a deletion and an untracked file, so each half is judged on its own.
 */
export function changedPaths(ctx) {
  // Content changes inside a submodule are not a change of this repository: staging the
  // submodule path would stage nothing and the staged-set check would fail.
  return statusPaths(git(ctx, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--ignore-submodules=dirty']));
}

const outsideStore = (p) => !p.startsWith(STORE_PREFIX) && p !== '.fgos';

/**
 * What the worktree holds before a producer launches: paths already staged (the run must refuse
 * them, it stages only what it chose) and paths already dirty inside the scope (never committed
 * by the run; they stay for whoever left them).
 */
export function preflightUnitWorktree({ worktree, repoRoot, scope, sync = null }) {
  const ctx = gitContext({ worktree, repoRoot });
  // The merge a sync of this run left open is the run's own: its staged and conflicted paths are
  // neither foreign nor dirt to keep out of the commit. Any other open merge is someone else's.
  const mergeHead = mergeHeadOf(ctx);
  const own = sync?.status === 'conflicted' && mergeHead === sync.sha
    ? new Set([...sync.conflicts, ...(sync.mergeStaged ?? [])])
    : new Set();
  return {
    foreignStaged: stagedPaths(ctx).filter((p) => !own.has(p)),
    foreignMerge: mergeHead && own.size === 0 ? mergeHead : null,
    preExistingInScope: partitionPaths(changedPaths(ctx).filter((p) => outsideStore(p) && !own.has(p)), scope).inScope,
  };
}

/** The refusal text for a staged index this run did not make. */
export function foreignIndexDetail(paths) {
  return `the index has staged changes this run did not make: ${paths.join(', ')}; unstage or commit them, then run again`;
}

/**
 * The line that names `text`: its first line that is not a markdown heading (a prompt opens with
 * `# Goal` before the goal itself), else the first heading's text; without any ellipsis.
 */
function headline(text) {
  const lines = String(text ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const line = lines.find((l) => !l.startsWith('#')) ?? (lines[0] ?? '').replace(/^#+\s*/, '');
  return line.replace(/\s*(?:\.{3,}|\u2026)\s*/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * `subject` within SUBJECT_MAX: cut at the last sentence end that fits, else at the last word
 * boundary, else hard; never past the `type(scope): ` prefix, never ending in punctuation.
 */
function fitSubject(subject) {
  if (subject.length <= SUBJECT_MAX) return subject;
  const prefixEnd = subject.indexOf(': ') + 2;
  const window = subject.slice(0, SUBJECT_MAX + 1);
  let cut = -1;
  for (const m of window.matchAll(/[.!?;](?=\s)/g)) if (m.index > prefixEnd) cut = m.index;
  if (cut < 0) {
    const space = window.lastIndexOf(' ');
    cut = space > prefixEnd ? space : SUBJECT_MAX;
  }
  return subject.slice(0, cut).replace(/[\s.,;:!?-]+$/, '');
}

/**
 * The runner's commit subject: the first line of the agent's own summary, or of the unit's
 * objective when there is no summary, kept as it is when already conventional and otherwise
 * filed under `chore(<unitId>)`.
 */
export function subjectFrom(summary, unitId, objective) {
  const line = headline(summary) || headline(objective);
  if (CONVENTIONAL_SUBJECT.test(line)) return fitSubject(line);
  const ownPrefix = `${unitId}: `;
  const text = line.startsWith(ownPrefix) ? line.slice(ownPrefix.length).trim() : line;
  return fitSubject(`chore(${unitId}): ${text || 'producer changes'}`);
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
 * @param {string} [p.objective] the unit's objective; its first line names the commit when there is no summary
 * @param {string[]} p.scope canonical write scope; `['**']` for "everything outside .fgos"
 * @param {string[]|null} [p.changedFiles] what the run's evidence says the agent changed
 * @param {string[]} [p.excludePaths]
 * @param {string[]} [p.needsWrites] paths the agent said it needed beyond the scope, echoed back
 * @returns {{ status: 'committed'|'no-changes'|'failed', sha?: string, subject?: string, files?: string[],
 *   outOfScope: string[], preExistingInScope: string[], needsWrites?: string[], reason?: string, error?: string }}
 */
export function commitUnitWork({ worktree, repoRoot, unitId, summary, objective, scope, changedFiles = null, excludePaths = [], needsWrites }) {
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
    const openMerge = mergeHeadOf(ctx);
    if (openMerge) {
      return failed('merge-in-progress', `the worktree has a merge in progress (MERGE_HEAD ${openMerge}); a commit now would conclude it with the agent's files`);
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

    const subject = subjectFrom(summary, unitId, objective);
    try {
      git(ctx, ['commit', '-q', '-m', subject], { env: commitIdentity(ctx) });
    } catch (err) {
      unstage();
      throw err;
    }
    const sha = git(ctx, ['rev-parse', 'HEAD']).trim();

    // A pre-commit hook can still change the index between the check above and the commit.
    const inCommit = nulPaths(git(ctx, ['show', '--name-only', '--no-renames', '--no-relative', '--format=', '-z', 'HEAD']));
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

// ---------------------------------------------------------------------------------------------
// Sync: the runner merges a base ref into the unit's branch.
//
// A confined worker cannot run `git merge` (the gitdir is read-only to it), so this trusted code
// runs the merge, through the same gitdir, hooks and environment rules as the commit above. A
// clean merge is committed at once; a conflicted one is left in progress for the worker, whose
// only job is to edit the conflicted files; `finishSyncMerge` then concludes the merge commit.
// The shape follows `performCatchUp` (merge --no-commit --no-ff, list `--diff-filter=U`, commit or
// abort, `.fgos/` conflicts take the base side); its code is not reused because it runs plain git
// in its own throwaway worktree.

/**
 * A line git writes to open, split or close a conflict hunk, at the default size or a larger
 * `conflict-marker-size` (`=======` alone is too common to read as one).
 */
const CONFLICT_MARKER = /^(?:<{7,}|>{7,}|\|{7,})(?: |\r?$)/m;

/**
 * Whether a conflicted path can enter a write scope as itself: the scope's normalizer keeps it
 * unchanged, it holds no glob and no control character (it is also printed into the brief).
 */
function scopableConflictPath(p) {
  if (p.includes('*') || /[\u0000-\u001f\u007f]/.test(p)) return false;
  try {
    return canonicalizeWriteEntry(p) === p;
  } catch {
    return false;
  }
}

/** What a merge must never take from the caller's config: rerere replays, autostash moves dirt. */
const MERGE_FLAGS = ['-c', 'rerere.enabled=false', '-c', 'merge.autoStash=false'];

/** The subject of the runner's sync merge commit. */
export const syncSubject = (ref) => fitSubject(`chore(sync): merge ${ref}`);

function mergeHeadOf(ctx) {
  try {
    return git(ctx, ['rev-parse', '-q', '--verify', 'MERGE_HEAD']).trim() || null;
  } catch {
    return null;
  }
}

function isAncestor(ctx, sha, rev = 'HEAD') {
  try {
    git(ctx, ['merge-base', '--is-ancestor', sha, rev]);
    return true;
  } catch (err) {
    if (err.status === 1) return false;
    throw err;
  }
}

function unmergedPaths(ctx) {
  return nulPaths(git(ctx, ['diff', '--name-only', '--no-relative', '--diff-filter=U', '-z']));
}

/** Git's identity for a commit the runner makes: the repository's own, else the runner's. */
function commitIdentity(ctx) {
  const identity = {};
  if (!hasConfigured(ctx, 'user.name')) identity.GIT_AUTHOR_NAME = identity.GIT_COMMITTER_NAME = 'fgOS runner';
  if (!hasConfigured(ctx, 'user.email')) identity.GIT_AUTHOR_EMAIL = identity.GIT_COMMITTER_EMAIL = 'runner@fgos.local';
  return identity;
}

/** The commit `ref` names, read through the trusted gitdir; null when it names none. */
export function resolveSyncBase({ worktree, repoRoot, ref }) {
  const ctx = gitContext({ worktree, repoRoot });
  try {
    return git(ctx, ['rev-parse', '-q', '--verify', '--end-of-options', `${ref}^{commit}`]).trim() || null;
  } catch {
    return null;
  }
}

/** A conflict under `.fgos/` takes the base side: a worker branch never decides fgOS state. */
function takeBaseSide(ctx, p) {
  const stages = git(ctx, ['ls-files', '-u', '-z', '--', p], { env: { GIT_LITERAL_PATHSPECS: '1' } });
  if (/^\d+ [0-9a-f]+ 3\t/m.test(stages.replace(/\0/g, '\n'))) {
    git(ctx, ['checkout', '--theirs', '--', p], { env: { GIT_LITERAL_PATHSPECS: '1' } });
    git(ctx, ['add', '--', p], { env: { GIT_LITERAL_PATHSPECS: '1' } });
  } else {
    git(ctx, ['rm', '-q', '--', p], { env: { GIT_LITERAL_PATHSPECS: '1' } });
  }
}

function abortMerge(ctx) {
  if (mergeHeadOf(ctx)) git(ctx, ['merge', '--abort']);
}

/**
 * Merge `sha` (named `ref`) into the worktree's branch.
 *
 * - `up-to-date`: `sha` is already in the branch; nothing changed.
 * - `merged`: the merge was clean and the runner committed it (`commit: { sha, subject }`).
 * - `conflicted`: the merge is left in progress; `conflicts` are the paths with conflict markers
 *   for the worker, `mergeStaged` the paths the merge already staged cleanly.
 * - `failed`: nothing is left in progress; `reason` is `untrusted-worktree`, `merge-in-progress`
 *   (a merge someone else started), `foreign-staged-index`, `merge-refused` (git would not start,
 *   e.g. a dirty file it would overwrite), `unscopable-conflict-path` (a conflicted path a write
 *   scope cannot name literally) or `git-error`.
 */
export function startSyncMerge({ worktree, repoRoot, ref, sha, adoptOpenMerge = false }) {
  const failed = (reason, error, extra = {}) => ({ status: 'failed', reason, error, ref, sha, ...extra });
  let ctx;
  try {
    ctx = gitContext({ worktree, repoRoot });
  } catch (err) {
    if (err instanceof UntrustedWorktreeError) return failed('untrusted-worktree', err.message);
    throw err;
  }
  try {
    const head = git(ctx, ['rev-parse', 'HEAD']).trim();
    const openMerge = mergeHeadOf(ctx);
    // A run that died between starting git and recording the result finds its own merge open.
    const adopted = adoptOpenMerge && openMerge === sha;
    if (openMerge && !adopted) {
      return failed('merge-in-progress', `the worktree already has a merge in progress (MERGE_HEAD ${openMerge}) that this run did not start; finish or abort it (git merge --abort), then run again`);
    }
    if (!adopted) {
      const staged = stagedPaths(ctx);
      if (staged.length > 0) return failed('foreign-staged-index', foreignIndexDetail(staged), { stagedPaths: staged });
      if (isAncestor(ctx, sha)) return { status: 'up-to-date', ref, sha, head };
      try {
        git(ctx, [...MERGE_FLAGS, 'merge', '--no-commit', '--no-ff', '--no-edit', '-q', sha]);
      } catch (err) {
        if (!mergeHeadOf(ctx)) {
          return failed('merge-refused', `git did not start the merge of ${ref}: ${String(err.stderr || err.message).trim()}`);
        }
      }
    }

    for (const p of unmergedPaths(ctx).filter((u) => !outsideStore(u))) takeBaseSide(ctx, p);
    const conflicts = unmergedPaths(ctx);
    const unscopable = conflicts.filter((p) => !scopableConflictPath(p));
    if (unscopable.length > 0) {
      abortMerge(ctx);
      return failed('unscopable-conflict-path', `the merge of ${ref} conflicts in paths a write scope cannot name exactly (${unscopable.map((p) => JSON.stringify(p)).join(', ')}); merge it by hand`);
    }
    if (conflicts.length > 0) {
      const mergeStaged = stagedPaths(ctx).filter((p) => !conflicts.includes(p));
      return { status: 'conflicted', ref, sha, head, conflicts, mergeStaged };
    }

    const subject = syncSubject(ref);
    const staged = stagedPaths(ctx);
    try {
      git(ctx, ['commit', '-q', '--no-edit', '-m', subject], { env: commitIdentity(ctx) });
    } catch (err) {
      abortMerge(ctx);
      return failed('git-error', `the clean merge of ${ref} could not be committed: ${String(err.stderr || err.message).trim()}`);
    }
    const merged = mergeCommitCheck(ctx, { head, sha, staged });
    if (merged.error) {
      return failed('committed-set-mismatch', `merge commit ${merged.sha} is on the branch but ${merged.error}`, { head, commit: { sha: merged.sha, subject }, ...merged.detail });
    }
    return { status: 'merged', ref, sha, head, commit: { sha: merged.sha, subject } };
  } catch (err) {
    try { abortMerge(ctx); } catch { /* reported below */ }
    return failed('git-error', err.stderr ? String(err.stderr).trim() : err.message);
  }
}

/**
 * Where a sync this run started stands now: `in-progress` (its merge is still open: MERGE_HEAD is
 * its sha and HEAD has not moved), `done` (its sha is in the branch: committed, by the runner or
 * by hand), `not-started` (no merge open and HEAD where it was), or `lost` (anything else).
 */
export function syncMergeState({ worktree, repoRoot, sync }) {
  const ctx = gitContext({ worktree, repoRoot });
  const mergeHead = mergeHeadOf(ctx);
  const head = git(ctx, ['rev-parse', 'HEAD']).trim();
  if (mergeHead === sync.sha && head === sync.head) return { state: 'in-progress', unmerged: unmergedPaths(ctx), staged: stagedPaths(ctx) };
  if (!mergeHead && isAncestor(ctx, sync.sha)) return { state: 'done' };
  if (!mergeHead && head === sync.head) return { state: 'not-started' };
  return { state: 'lost', mergeHead, head };
}

/**
 * Whether HEAD is the merge of `sha` over `head` holding exactly the `staged` paths (a hook can
 * change the index between staging and the commit). Returns `{ sha, files }`, plus `error` and
 * `detail` when it is not.
 */
function mergeCommitCheck(ctx, { head, sha, staged }) {
  const commit = git(ctx, ['rev-parse', 'HEAD']).trim();
  const parents = git(ctx, ['rev-list', '--parents', '-n', '1', 'HEAD']).trim().split(' ').slice(1);
  const files = nulPaths(git(ctx, ['diff', '--name-only', '--no-renames', '--no-relative', '-z', head, 'HEAD']));
  if (parents[0] === head && parents[1] === sha && sameSet(files, staged)) return { sha: commit, files };
  return {
    sha: commit,
    files,
    error: `it is not the merge of ${sha} over ${head} holding exactly its staged paths`,
    detail: { files, unexpected: files.filter((p) => !staged.includes(p)), missing: staged.filter((p) => !files.includes(p)) },
  };
}

/** The paths of `paths` whose content still holds a conflict marker (binary files are not read). */
export function pathsWithConflictMarkers(worktree, paths) {
  return paths.filter((p) => {
    let st;
    try { st = fs.lstatSync(path.join(worktree, p)); } catch { return false; }
    if (!st.isFile()) return false;
    const bytes = fs.readFileSync(path.join(worktree, p));
    return !bytes.includes(0) && CONFLICT_MARKER.test(bytes.toString('utf8'));
  });
}

/**
 * Conclude the merge `startSyncMerge` left `conflicted`, after the worker edited its conflicts:
 * refuse while a conflict marker is left (`conflict-markers`, nothing staged, the merge kept),
 * stage the conflicted paths, check the index holds only the merge's own paths, and commit with
 * MERGE_HEAD as second parent. `merged-outside` when the sha is already in the branch (someone
 * concluded it by hand); `sync-merge-lost` when the merge is gone or HEAD moved.
 */
export function finishSyncMerge({ worktree, repoRoot, sync }) {
  const failed = (reason, error, extra = {}) => ({ status: 'failed', reason, error, ...extra });
  let ctx;
  try {
    ctx = gitContext({ worktree, repoRoot });
  } catch (err) {
    if (err instanceof UntrustedWorktreeError) return failed('untrusted-worktree', err.message);
    throw err;
  }
  try {
    const mergeHead = mergeHeadOf(ctx);
    const head = git(ctx, ['rev-parse', 'HEAD']).trim();
    if (mergeHead !== sync.sha || head !== sync.head) {
      if (!mergeHead && isAncestor(ctx, sync.sha)) return { status: 'merged-outside', sha: head };
      return failed('sync-merge-lost', `the merge of ${sync.ref} this run started is no longer in progress (MERGE_HEAD ${mergeHead ?? 'none'}, HEAD ${head}, expected ${sync.sha} over ${sync.head}); start a new run`);
    }
    const marked = pathsWithConflictMarkers(ctx.cwd, sync.conflicts);
    if (marked.length > 0) {
      return failed('conflict-markers', `conflict markers are still in ${marked.join(', ')}; remove them, then resume the run to commit the merge of ${sync.ref}`, { paths: marked });
    }
    const allowed = new Set([...sync.conflicts, ...(sync.mergeStaged ?? [])]);
    const before = new Set(stagedPaths(ctx));
    withPaths(ctx, ['add', '-A'], sync.conflicts);
    const staged = stagedPaths(ctx);
    const unexpected = staged.filter((p) => !allowed.has(p));
    if (unexpected.length > 0) {
      // Take back what this call staged outside the merge, so a resume does not find it as foreign.
      const own = unexpected.filter((p) => !before.has(p));
      if (own.length > 0) withPaths(ctx, ['reset', '-q'], own);
      return failed('staged-set-mismatch', `the index holds paths the merge of ${sync.ref} did not stage: ${unexpected.join(', ')}`, { unexpected });
    }
    const left = unmergedPaths(ctx);
    if (left.length > 0) return failed('staged-set-mismatch', `paths are still unmerged after staging: ${left.join(', ')}`, { unexpected: left });
    const subject = syncSubject(sync.ref);
    git(ctx, ['commit', '-q', '--no-edit', '-m', subject], { env: commitIdentity(ctx) });
    const merged = mergeCommitCheck(ctx, { head: sync.head, sha: sync.sha, staged });
    if (merged.error) return failed('committed-set-mismatch', `merge commit ${merged.sha} is on the branch but ${merged.error}`, { sha: merged.sha, subject, ...merged.detail });
    return { status: 'committed', sha: merged.sha, subject, files: merged.files };
  } catch (err) {
    return failed('git-error', err.stderr ? String(err.stderr).trim() : err.message);
  }
}
