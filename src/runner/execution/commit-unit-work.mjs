// Compatibility translations only. fgos-git owns Git, custody, hooks and recovery.
import crypto from 'node:crypto';
import path from 'node:path';
import { createGitScopedCommit } from '../../git/scoped-commit.mjs';
import { createGitSync } from '../../git/sync.mjs';
import { createGitInspect, gitWriter } from '../../git/inspect.mjs';
import { nativeError } from '../../git/native.mjs';
import { resolveStateRoot } from '../../holder-lock/index.mjs';
import { partitionPaths } from '../dispatch/write-scope.mjs';

const CONVENTIONAL_SUBJECT = /^(feat|fix|docs|refactor|test|chore|perf|build|ci|style|revert)(\([^)]+\))?!?: \S/;
const SUBJECT_MAX = 100;
const outsideStore = p => p !== '.fgos' && !p.startsWith('.fgos/');
export function gitContext({ worktree, repoRoot, custody, loaderOptions, writer }) {
  if (!repoRoot) throw new TypeError('the runner commit requires repoRoot (the main checkout)');
  return { worktree, repoRoot, custody, loaderOptions, writer };
}
function options(ctx) {
  const fgosDir = path.join(ctx.repoRoot, '.fgos');
  return { stateRoot: resolveStateRoot().stateRoot, repoPath: ctx.worktree,
    trustedMain: ctx.repoRoot, writer: ctx.writer ?? gitWriter(fgosDir) };
}
const held = ctx => ctx.custody ? [ctx.custody] : [];
const scoped = ctx => createGitScopedCommit(options(ctx), ctx.loaderOptions);
const syncPort = ctx => createGitSync(options(ctx), ctx.loaderOptions);
const inspect = ctx => createGitInspect(options(ctx), ctx.loaderOptions);
function state(ctx) { return scoped(ctx).worktreeState({}, held(ctx)); }
export const stagedPaths = ctx => state(ctx).staged;
export const changedPaths = ctx => [...new Set([...state(ctx).changed, ...stagedPaths(ctx)])];
export function foreignIndexDetail(paths) {
  return `the index has staged changes this run did not make: ${paths.join(', ')}; unstage or commit them, then run again`;
}
function refusal(error) {
  const e = nativeError(error);
  const cause = e.cause ?? 'git-error';
  const reason = cause === 'foreign-merge-head' ? 'merge-in-progress'
    : /untrusted-worktree|trusted-main-gitfile|not-a-repository/.test(cause) ? 'untrusted-worktree'
    : cause === 'unscopable-conflict-path' ? cause
    : cause === 'sync-index-changed' ? 'staged-set-mismatch'
    : ['foreign-staged-index','staged-set-mismatch','merge-refused','hook-refused'].includes(cause) ? cause
    : cause.startsWith('conflict-markers') ? 'conflict-markers' : 'git-error';
  const stderr = Buffer.from(e.stderr ?? []).toString('utf8');
  return { ...(e.detail ?? {}), status: 'failed', reason, error: stderr || cause, ...(stderr ? { stderr, stderrBytes: e.stderr } : {}), nativeCause: cause };
}
export function preflightUnitWorktree(args) {
  const ctx = gitContext(args);
  try {
    const baseline = scoped(ctx).preflight(args.sync?.status === 'conflicted' ? { syncOperationId: args.sync.operationId } : {}, held(ctx));
    return { foreignStaged: [], foreignMerge: null,
      preExistingInScope: partitionPaths(baseline.dirty.map(([p]) => p).filter(outsideStore), args.scope).inScope, baseline };
  } catch (error) {
    const e = nativeError(error);
    if (e.cause === 'foreign-staged-index' || e.cause === 'foreign-merge-head') {
      const current = state(ctx);
      return { foreignStaged: current.staged, foreignMerge: current.mergeHead, preExistingInScope: [] };
    }
    throw error;
  }
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


export const syncSubject = ref => fitSubject(`chore(sync): merge ${ref}`);
export function commitUnitWork(args) {
  const { unitId, summary, objective, scope, baseline, changedFiles = null, excludePaths = [], needsWrites } = args;
  if (!Array.isArray(scope)) throw new TypeError('commitUnitWork requires a write scope');
  const ctx = gitContext(args);
  const base = { outOfScope: [], preExistingInScope: [...excludePaths], ...(Array.isArray(needsWrites) ? { needsWrites } : {}) };
  try {
    const port = scoped(ctx);
    let recovered = null;
    if (args.resumeOperation) {
      const outcome = port.recover({operationId: args.resumeOperation.nativeRequest.operationId}, held(ctx));
      if (outcome.kind === 'commit') recovered = port.commit(args.resumeOperation.nativeRequest, held(ctx));
      else if (outcome.kind !== 'abandonedBeforeAttempt' && !(outcome.kind === 'commitRejected' && ['commit-rejected','hook-refused'].includes(outcome.cause))) {
        return {...base, status:'failed', reason:'git-error', error:`native commit recovery: ${outcome.cause ?? outcome.kind}`};
      }
    }
    const current = recovered ? { changed: [], staged: [], mergeHead: null } : port.worktreeState({}, held(ctx));
    if (current.mergeHead) return { ...base, status: 'failed', reason: 'merge-in-progress', error: `the worktree has a merge in progress (MERGE_HEAD ${current.mergeHead})` };
    if (current.staged.length) return { ...base, status: 'failed', reason: 'foreign-staged-index', error: foreignIndexDetail(current.staged), stagedPaths: current.staged };
    if (!baseline) return { ...base, status: 'failed', reason: 'baseline-required', error: 'the native baseline captured before producer launch is required; start a new run' };
    const candidates = current.changed.filter(p => outsideStore(p) && !excludePaths.includes(p));
    const selection = recovered ? {inScope:args.resumeOperation.expectedPaths, outOfScope:[]} : partitionPaths(candidates, scope);
    base.outOfScope = selection.outOfScope.filter(p => (changedFiles ?? []).includes(p));
    const subject = recovered ? args.resumeOperation.nativeRequest.request.message : subjectFrom(summary, unitId, objective);
    const nativeRequest = { baseline, request: { writes: scope, message: subject, cutoverGrant: null }, operationId: args.operationId ?? crypto.randomUUID() };
    if (!recovered) args.onPrepared?.({nativeRequest, expectedPaths: selection.inScope, base});
    else Object.assign(base, args.resumeOperation.base);
    const result = recovered ?? port.commit(nativeRequest, held(ctx));
    const extra = { ...(result.warnings?.length ? { warnings: result.warnings } : {}), operationId: result.operationId };
    if (result.status === 'unchanged') return { status: 'no-changes', ...base, ...extra };
    const commit = { sha: result.oid, subject, files: result.files, ...base, ...extra };
    if (result.status === 'committed-but-contract-violation') return { ...commit, status: 'failed', reason: 'committed-set-mismatch', error: `commit ${result.oid} is on the branch but violates the scoped commit contract`, unexpected: result.files.filter(p => !selection.inScope.includes(p)), missing: selection.inScope.filter(p => !result.files.includes(p)) };
    return { status: 'committed', ...commit };
  } catch (error) { return { ...base, ...refusal(error) }; }
}
export function commitOnBranch(worktree, sha, repoRoot, custody, loaderOptions) {
  const ctx = gitContext({ worktree, repoRoot, custody, loaderOptions });
  try {
    const port = inspect(ctx);
    const head = port.resolveCommit({ name: 'HEAD' });
    return Boolean(head && port.ancestry({ ancestor: sha, descendant: head }).answer === 'yes');
  } catch (error) {
    if (/untrusted|not-a-repository/.test(nativeError(error).cause)) throw new Error('not a working tree of the trusted repository');
    throw error;
  }
}
export function resolveSyncBase(args) { return inspect(gitContext(args)).resolveCommit({ name: args.ref }); }
function translateSync(result, ref) {
  const base = { ref, sha: result.target, head: result.head, operationId: result.operationId,
    ...(result.warnings?.length ? { warnings: result.warnings } : {}) };
  if (['in-progress', 'conflicted-open'].includes(result.state)) return { ...base, status: 'conflicted', conflicts: result.resolverGrant, mergeStaged: (result.staged ?? []).filter(p => !result.resolverGrant.includes(p)) };
  if (result.state === 'up-to-date') return { ...base, status: 'up-to-date' };
  if (result.state === 'done') {
    const commit = result.commit ? { sha: result.commit.oid, subject: syncSubject(ref), files: result.commit.files } : { by: 'outside' };
    if (result.commit?.status === 'committed-but-contract-violation') return { ...base, status: 'failed', reason: 'committed-set-mismatch', error: `merge commit ${commit.sha} is on the branch but violates the merge contract`, commit, files: result.commit.files, unexpected: result.unexpected ?? [], missing: result.missing ?? [] };
    return { ...base, status: 'merged', commit };
  }
  return { ...base, status: 'failed', reason: 'sync-merge-lost', error: `sync operation ${result.operationId}: ${result.state}` };
}
export function startSyncMerge(args) {
  const ctx = gitContext(args);
  const operationId = args.operationId ?? crypto.randomUUID();
  try { return translateSync(syncPort(ctx).start({ operationId, target: args.sha, message: syncSubject(args.ref) }, held(ctx)), args.ref); }
  catch (error) {
    const result = { ref: args.ref, sha: args.sha, operationId, ...refusal(error) };
    // Unit clean-start semantics: the native operation owns and aborts its merge.
    // Never use abort to clean someone else's state or a landed contract violation.
    try {
      if (!['commit-rejected','hook-refused'].includes(result.nativeCause)) return result;
      const port = syncPort(ctx);
      const own = port.inspect({ operationId }, held(ctx));
      if (own.state === 'rejected-open' && own.resolverGrant.length === 0) port.abort({ operationId }, held(ctx));
    } catch (cleanup) { result.cleanupError = nativeError(cleanup).cause; }
    return result;
  }
}
export function syncMergeState(args) {
  const ctx = gitContext(args);
  const r = syncPort(ctx).inspect({ operationId: args.sync.operationId }, held(ctx));
  const current = state(ctx);
  return { state: r.state === 'rejected-open' ? 'in-progress' : r.state === 'conflict-aborted' ? 'not-started' : r.state,
    unmerged: current.unmerged, rejected: r.state === 'rejected-open', staged: current.staged, mergeHead: current.mergeHead, head: current.head };
}
export function finishSyncMerge(args) {
  const ctx = gitContext(args);
  try {
    const r = syncPort(ctx).continue({ operationId: args.sync.operationId, ...(args.sync.nextOperationId ? { nextOperationId: args.sync.nextOperationId } : {}) }, held(ctx));
    const result = translateSync(r, args.sync.ref);
    if (result.status === 'failed') return { ...result, ...(result.commit ? { sha: result.commit.sha, subject: result.commit.subject } : {}) };
    return r.commit ? { operationId: r.operationId, status: 'committed', sha: r.commit.oid, subject: syncSubject(args.sync.ref), files: r.commit.files, warnings: r.warnings } : { status: 'merged-outside', sha: state(ctx).head };
  } catch (error) {
    const result = refusal(error);
    if (result.reason === 'merge-in-progress') { result.reason = 'sync-merge-lost'; result.error = `the merge of ${args.sync.ref} this run started is no longer in progress; start a new run`; }
    if (result.reason === 'conflict-markers') result.error = `conflict markers are still in ${(result.paths ?? []).join(', ')}; remove them, then resume the run to commit the merge of ${args.sync.ref}`;
    if (nativeError(error).operationId) result.operationId = nativeError(error).operationId;
    return result;
  }
}
