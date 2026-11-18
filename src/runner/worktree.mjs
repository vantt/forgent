// Worktree consumer adapters. Typed Git ports own Git effects, locks, snapshots
// and recovery. Execution owns provisioning and the dispatch-cwd lease; Work
// owns claim/approval policy. fgw/<id> refs remain durable proposals after
// their disposable checkouts are removed. Administration always uses the
// trusted main handle, so removing or moving a checkout cannot invalidate the
// driver's own gitdir. Native refusals preserve uncertain or undelivered work.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { StoreError } from '../state/store.mjs';
import { createLockScope, HolderLockError, acquireSync } from '../holder-lock/index.mjs';
import crypto from 'node:crypto';
import { nativeDoor } from '../native/door.mjs';
import { gitPortOptions, createGitInspect, worktreeDoor, NO_GIT_DOOR_CODES } from '../git/inspect.mjs';
import { createGitRefs } from '../git/refs.mjs';
import { createGitRemote } from '../git/remote.mjs';
import { createGitSafeRestore } from '../git/restore.mjs';
export const inspectGit = repo => createGitInspect(gitPortOptions(repo));
const refsPort = repo => createGitRefs(gitPortOptions(repo, { mutation: true }));
const operationId = () => crypto.randomUUID();
export function gitWorktrees(repo) {
  const port = inspectGit(repo);
  const rows = [];
  let cursor;
  do {
    const page = port.listWorktrees({ cursor, maxEntries: 4096 });
    rows.push(...page.entries);
    cursor = page.nextCursor;
  } while (cursor);
  return rows;
}
/** The branch checked out at `worktreePath`, or null for a detached or unregistered checkout. */
export function checkedOutBranch(worktreePath) {
  const row = gitWorktrees(worktreePath).find((candidate) => realpathOrSelf(Buffer.from(candidate.path).toString('utf8')) === realpathOrSelf(worktreePath));
  return row?.branch?.startsWith('refs/heads/') ? row.branch.slice('refs/heads/'.length) : null;
}
function checkoutPathIn(rows, branch) {
  const row = rows.find(row => row.branch === `refs/heads/${branch}`);
  return row ? realpathOrSelf(Buffer.from(row.path).toString('utf8')) : null;
}
export function checkoutPathForBranch(repo, branch) { return checkoutPathIn(gitWorktrees(repo), branch); }

export function compareCommits(repo, left, right) {
  return inspectGit(repo).compareCommits({ left: resolveRefSha(repo, left), right: resolveRefSha(repo, right) });
}
function checkoutFacts(repo, worktree, revision) { return inspectGit(worktree).checkoutFacts({ revision: revision ?? currentHead(worktree) }); }
export function deleteBranchRef(repo, branch, expected = resolveRefSha(repo, branch)) {
  return refsPort(repo).deleteRef({ name: `refs/heads/${branch}`, expected, operationId: operationId() });
}
function withCheckoutCustody(worktree, fn, { custody, scope = createLockScope('worktree-custody') } = {}) {
  const options = gitPortOptions(worktree, { mutation: true });
  if (custody) return fn(options, custody);
  const acquired = acquireSync(scope, 'dispatch-cwd', { fgosDir: path.join(options.trustedMain, '.fgos'), cwd: worktree });
  if (acquired.result !== 'acquired') throw new HolderLockError('lock-held', 'worktree custody is held', { lock: 'dispatch-cwd' });
  try { return fn(options, acquired.handle); }
  finally { acquired.handle.release(); }
}
function restoreCheckout(repo, worktree, target, { baseline, reapplyLocalDelta = false, discardLocalDelta = false } = {}) {
  return withCheckoutCustody(worktree, (options, custody) => createGitSafeRestore(options).apply({ operationId: operationId(), request: { expectedHead: currentHead(worktree), target, reason: 'worktree resync', reapplyLocalDelta, checkoutBaseline: baseline, discardLocalDelta, requireCleanBaseline: !!baseline && !reapplyLocalDelta, requireStagedOnly: !!baseline && reapplyLocalDelta } }, [custody]));
}
export function resetDispatchWorktree(repo, worktree, target) { return restoreCheckout(repo, worktree, target, { discardLocalDelta: true }); }

import { statusPaths } from '../util/git-paths.mjs';

/** Raised for any git worktree/branch operation failure. `errorClass`
 * reuses the vocabulary declared in `recovery.mjs`'s `ERROR_CLASSES` (per
 * the cell's key_link) — always `'worktree-fail'` here. */
export class WorktreeError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'WorktreeError';
    this.errorClass = 'worktree-fail';
    // `.category` too (store.mjs's categoryOf contract, R4): any error that
    // sets `.category` participates without store.mjs needing to know about
    // this module specifically.
    this.category = 'worktree-fail';
    Object.assign(this, details);
  }
}

/** The branch name a work item's worktree always uses. */
export function branchNameFor(id) {
  return `fgw/${id}`;
}

















// Same call as `git` above, but with git's own stderr swallowed rather than
// inherited by this process. Only the two probe helpers below use it: both
// ask questions git legitimately answers with a `fatal:` line (no origin
// remote, no such branch, not a repository at all), and both already treat
// that as a normal answer — printing the raw fatal to the caller's stderr
// would turn "this directory is not a repo" into apparent breakage on a
// path that is deliberately fail-open. Byte-identical to the `stdio` the
// two functions had at their previous home in merge.mjs (tsk-49i D1).


function stripExtendedPrefix(p) {
  if (typeof p !== 'string') return p;
  if (p.startsWith('\\\\?\\UNC\\')) {
    return '\\\\' + p.slice(8);
  }
  if (p.startsWith('\\\\?\\')) {
    return p.slice(4);
  }
  return p;
}

export function pathsEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (process.platform === 'win32') {
    return a.toLowerCase() === b.toLowerCase();
  }
  return a === b;
}

export function pathStartsWith(child, parent) {
  if (typeof child !== 'string' || typeof parent !== 'string') return false;
  if (process.platform === 'win32') {
    return child.toLowerCase().startsWith(parent.toLowerCase());
  }
  return child.startsWith(parent);
}

/** Resolve `p` through the filesystem when it exists, and fall back to a
 * plain absolute resolve when it does not — the shape every caller
 * comparing two checkout paths for identity needs. Exported (tsk-49i D3)
 * because `approve`'s session-worktree guard needs the identical rule and
 * used to carry its own byte-identical copy in bin/fgos.mjs.
 *
 * Uses `fs.realpathSync.native` so Windows 8.3 short paths (e.g. RUNNER~1)
 * expand to canonical long paths (runneradmin), matching git's own output,
 * strips Win32 `\\?\` extended-path prefixes, and normalizes separators. */
export function realpathOrSelf(p) {
  if (typeof p !== 'string') return p;
  try {
    const resolved = fs.realpathSync.native ? fs.realpathSync.native(p) : fs.realpathSync(p);
    return path.normalize(stripExtendedPrefix(resolved));
  } catch {
    return path.normalize(path.resolve(p));
  }
}

/** `git <args>` for a plain read, with any failure (not a repo, no commits
 * yet) reported as `validation` rather than escaping as an "unexpected"
 * exit-1 — the R4 exit-code contract every other error surface follows.
 * Private on purpose: the merge-cluster use cases read refs through the two
 * named helpers below (tsk-49i D3) rather than carrying their own
 * git-error policy. */


/** The sha `repoRoot`'s own HEAD currently points at. */
export function currentHead(repoRoot) { return resolveRefSha(repoRoot, 'HEAD'); }

/** tsk-5dk: a named branch/ref's own tip sha, not "whatever HEAD happens to
 * be in some worktree's checkout" (`currentHead` above) — branch refs are
 * shared across every linked worktree of the same repo, so this is correct
 * to call from repoRoot even when the actual merge commit was created in a
 * different (e.g. ephemeral) worktree of the same repo, and stays correct
 * for an idempotent already-merged re-approve too (always reads the
 * target's real current tip, never a stale pre-merge snapshot). */
export function resolveRefSha(repoRoot, ref) {
  try {
    const oid = inspectGit(repoRoot).resolveCommit({ name: ref });
    if (typeof oid !== 'string') throw new Error(`unknown ref ${ref}`);
    return oid;
  } catch (err) { throw new StoreError('validation', `reading ref ${ref} failed in "${repoRoot}": ${err.message}`); }
}

/** Resolve `repoRoot`'s trunk branch name without assuming `'main'`: prefers
 * the remote `origin/HEAD` target (what the repo host itself calls its
 * default branch), then falls back to whichever of `main`/`master` exists
 * locally as a branch, then to the literal `'main'` when neither signal is
 * available (e.g. a brand-new repo with no commits yet on either name).
 *
 * Lives here rather than in `merge.mjs` (its original home, tsk-49i D1):
 * naming a repo's trunk branch is worktree/branch identity, with zero
 * merge-content semantics — and keeping it here removes the circular
 * merge.mjs <-> worktree.mjs import the old placement forced. */
export function detectTrunk(repoRoot) {
  const port = inspectGit(repoRoot);
  const remote = port.resolveRef({ name: 'refs/remotes/origin/HEAD' });
  if (remote.kind === 'symbolic' && remote.target.startsWith('refs/remotes/origin/')) return remote.target.slice('refs/remotes/origin/'.length);
  for (const name of ['main','master']) if (branchExists(repoRoot, name)) return name;
  return 'main';
}

/**
 * Whether `repoRoot` IS the repo's main working tree — never a linked
 * worktree, however it was made (`fgos worktree` or a plain `git worktree
 * add` run by hand). A merge landing on a linked worktree's own checkout, or
 * a goal-check verifying its own (possibly stale/divergent) tree, would leave
 * the item reported "done" / "verified on main" (P44).
 *
 * The check is structural, so it catches every linked worktree: a main
 * worktree's git-common-dir sits directly inside its own toplevel (its
 * parent IS the toplevel); a linked worktree's common-dir resolves to the
 * MAIN repo's `.git`, whose parent is the main repo root — never the linked
 * worktree's own toplevel.
 *
 * A `repoRoot` that is not a git repository at all (legacy-item tests, or a
 * plain directory `approve` is otherwise happy to degrade against) has no
 * worktree concept to violate — trivially "main", fail-open, matching how
 * every other legacy-source path in `approve` already tolerates a non-git
 * cwd.
 *
 * Lives here rather than in `merge.mjs` (its original home, tsk-49i D1):
 * it is a pure worktree-identity check with zero merge-content semantics.
 */
export function isMainWorktree(repoRoot, facts = inspectGit(repoRoot).resolveRepo()) {
  return facts.notARepository || pathsEqual(realpathOrSelf(facts.worktreeRoot), realpathOrSelf(facts.trustedMainRoot));
}

/**
 * Whether a verb may touch the store at `dir` from `cwd`, driven by its registry `store` field. The decision, its
 * refusal texts and their fault classes belong to `fgos-git` (`packages/git/rust/src/store_admission.rs`); this is
 * the adapter: a refusal becomes `StoreError('validation')` carrying `faultClass`, so the shell records it without a
 * hand-set label. Returns `{ warning }` (a line for stderr, or null) when the verb may run.
 */
export function admitStoreAccess({ verb, store, mutates = false, dir, cwd, explicitDir = false }) {
  let answer;
  try {
    // `init` is the verb that creates the store.
    answer = worktreeDoor('admitStoreAccess', { verb, store: store ?? 'none', mutates, creates: verb === 'init', explicitDir, dir, cwd });
  } catch (err) {
    if (!NO_GIT_DOOR_CODES.has(err?.code)) throw err;
    // No Git door: nothing can tell a linked worktree from the main checkout. A verb that needs no store is admitted as it
    // always was; any other refuses by name.
    if (!mutates && (store === undefined || store === 'none')) return { warning: null };
    throw new StoreError('validation', `"${verb}" refused: the Git state of "${cwd}" could not be read: ${err.message}`, { faultClass: 'worktree-identity-unreadable' });
  }
  if (answer.refused) throw new StoreError('validation', answer.refused.message, { faultClass: answer.refused.faultClass });
  return { warning: answer.warning };
}

// Push a runner item's branch to origin unless it already tracks an upstream.
// The upstream probe is a plain execFileSync + try/catch, NOT this module's
// `git` helper: `review`'s own caller rethrows every git failure as
// StoreError('validation', ...), the wrong semantic for an existence probe
// that is *expected* to fail on a never-pushed branch. Only the push itself
// is a real operation. Lives here rather than in bin/fgos.mjs (tsk-49i D3):
// pushing a branch is branch mechanics, this module's own job.
export function ensureBranchPushed(repoRoot, branch) {
  const tracking = inspectGit(repoRoot).remoteTracking({ branch: `refs/heads/${branch}`, remote: 'origin' });
  if (tracking.upstream) return;
  createGitRemote(gitPortOptions(repoRoot, { mutation: true })).pushRefs({ remoteGrant: { name: 'origin', pinnedUrl: tracking.url }, mappings: [[`refs/heads/${branch}`, `refs/heads/${branch}`]], operationId: operationId() });
}

// Exported (pr-lifecycle-2): the approval-gate merge engine (merge.mjs)
// reuses this exact check to classify a proposed item as "runner" (a live
// `fgw/<id>` branch) vs "pull"/"legacy" (no branch) — one existence check,
// never a second implementation of "does this branch exist" elsewhere.
export function branchExists(repoRoot, branch) {
  try { return inspectGit(repoRoot).resolveRef({ name: `refs/heads/${branch}` }).kind === 'direct'; } catch { return false; }
}

/**
 * True when `worktreePath` has any uncommitted change other than the
 * `.fgos` removal `createWorktree` itself always performs right after
 * checkout (ADR0020) — that path is this module's own known artifact,
 * never real user/worker content, and would otherwise make every checkout
 * look dirty regardless of real activity. Fails
 * closed (dirty) on an unreadable status — never assume clean.
 *
 * Exported (tsk-3gx-1): `promote-preflight.mjs` reuses this exact
 * fail-closed dirty check for its own "is this branch actively in use"
 * judgment — never a second implementation of "is this checkout dirty".
 */
export function isCheckoutDirty(repoRoot, worktreePath) {
  try { return checkoutFacts(repoRoot, worktreePath).status.length > 0; } catch { return true; }
}

/**
 * Return an array of relative file paths that are currently dirty (uncommitted
 * or untracked) in `worktreePath`, excluding `.fgos` artifacts (reusing the
 * exact `:!.fgos` pathspec exclusion from `isCheckoutDirty`). Read through
 * `statusPaths`: byte for byte, a rename as both halves, untracked files one
 * by one. Fails open (returns empty array) on git error.
 */
export function checkoutDirtyPaths(repoRoot, worktreePath) {
  try { return statusPaths(Buffer.from(checkoutFacts(repoRoot, worktreePath).status).toString('utf8')); } catch { return []; }
}




/**
 * Create the integration branch `fgw/<id>` (D17: "nhánh tạo sớm, không cần
 * worktree") as a REF ONLY — no worktree/checkout is registered for it.
 * `opts.baseRef` (default: `detectTrunk(repoRoot)`, tsk-386 — no longer a
 * literal `'main'`; a host project whose trunk is `master` would otherwise
 * fail `git branch fgw/<id> main` outright on this fallback, per
 * `docs/platform/git/spec.md#7-hardened-git-backend-parsers-and-hook-contract`'s "No hardcoded trunk" contract).
 * Idempotent: if `fgw/<id>` already exists, this is a no-op — it does NOT
 * move the branch to `baseRef`, mirroring the RETRY-WITHOUT-SELF-COLLISION
 * discipline above (a retried root-dispatch must not disturb a branch that
 * may already carry committed leaf work). Returns `{ branch, created }`,
 * where `created` is `false` when the branch already existed.
 */
export function createBranchRef(repoRoot, id, opts = {}) {
  const branch = branchNameFor(id);
  const baseRef = opts.baseRef ?? detectTrunk(repoRoot);

  if (branchExists(repoRoot, branch)) {
    return { branch, created: false };
  }

  try {
    refsPort(repoRoot).ensureBranch({ name: `refs/heads/${branch}`, next: resolveRefSha(repoRoot, baseRef), operationId: operationId() });
  } catch (err) {
    throw new WorktreeError(`git branch failed creating ref "${branch}" from "${baseRef}": ${err.message}`, {
      branch,
      baseRef,
    });
  }

  return { branch, created: true };
}

// ---------------------------------------------------------------------------
// Work checkout lifecycle: one synchronous call each into the Rust checkout
// door (`fgos-checkout`, through the combined addon). Everything below is
// argument mapping and error-shape mapping; creating, provisioning, resyncing
// and removing a checkout live in the crate.
// ---------------------------------------------------------------------------

// The lock-order rank of the worktree-admin mutex (repo-locks.mjs owns the lock itself).
const WORKTREE_ADMIN = 'worktree-admin';
const WORKTREE_ADMIN_RANK = 40;

/** The repository a lifecycle call acts on: the trusted main checkout, the machine state root and the Git writer. */
function checkoutContext(repoRoot) {
  const options = gitPortOptions(repoRoot, { mutation: true });
  return { repoRoot: options.trustedMain, stateRoot: options.stateRoot, writer: options.writer ?? '' };
}

/** The crate's refusal as the error class a Work caller already handles. */
function checkoutError(err) {
  let refusal;
  try { refusal = JSON.parse(err.message); } catch { return err; }
  if (refusal === null || typeof refusal !== 'object' || typeof refusal.kind !== 'string') return err;
  const details = refusal.details ?? {};
  switch (refusal.kind) {
    case 'worktree': return new WorktreeError(refusal.message, details);
    case 'lock-held': return new HolderLockError('lock-held', refusal.message, details);
    case 'invalid': return new StoreError('validation', refusal.message);
    case 'provision':
      return refusal.command ? new WorktreeError(refusal.message, { worktreePath: refusal.worktreePath, command: refusal.command }) : new Error(refusal.message);
    case 'io': {
      // The directory the checkout was to be allocated in could not be made: keep the errno code a fs call carries.
      const error = new Error(refusal.message);
      const errno = /\(os error (\d+)\)/.exec(refusal.message)?.[1];
      const code = errno === undefined ? undefined : Object.entries(os.constants.errno).find(([, number]) => number === Number(errno))?.[0];
      return code ? Object.assign(error, { code, errno: -Number(errno) }) : error;
    }
    default: return new Error(refusal.message);
  }
}

/** One call into the checkout door; a refusal comes back as the Node error class its kind maps to. */
function checkoutCall(entry, request) {
  const door = nativeDoor().checkout;
  try { return door[entry](request); } catch (err) { throw checkoutError(err); }
}

/** The create entries: a held worktree-admin lock of this scope's order is refused here, as the Node creators always did. */
function createRequest(repoRoot, id, opts) {
  (opts.scope ?? createLockScope('worktree')).assertCanAcquire(WORKTREE_ADMIN, WORKTREE_ADMIN_RANK);
  return { ctx: checkoutContext(repoRoot), id, worktreeDir: opts.worktreeDir ?? null, baseRef: opts.baseRef ?? null, startSha: opts.startSha ?? null, waitMs: opts.waitMs ?? null };
}

/**
 * Create (or reuse, when the branch exists) the checkout of work item `id`: branch `fgw/<id>`, a directory under
 * `opts.worktreeDir` (the system temp directory by default), provisioned and with no `.fgos/` of its own (ADR0020).
 * An existing clean checkout of the branch moves to the new directory, never destroyed; a dirty one refuses.
 * Returns `{ path, branch, reused }`.
 */
export function createWorktree(repoRoot, id, opts = {}) {
  return checkoutCall('createWorktree', createRequest(repoRoot, id, opts));
}

/**
 * The checkout of a claim, which outlives the call: a standing checkout under `opts.worktreeDir` is reattached to
 * and resynced to the branch's tip when that loses nothing, and a branch minted earlier and never started is first
 * moved onto `opts.baseRef` (`refresh` says what happened). Returns `{ path, branch, reused[, refresh] }`.
 */
export function createClaimWorktree(repoRoot, id, opts = {}) {
  return checkoutCall('createClaimWorktree', createRequest(repoRoot, id, opts));
}

/** The checkout of one runner dispatch attempt; pair with `removeDispatchWorktree`. */
export function createDispatchWorktree(repoRoot, id, opts = {}) {
  return checkoutCall('createDispatchWorktree', createRequest(repoRoot, id, opts));
}

/**
 * A disposable checkout detached at `commit`, for verifying a tree no checkout holds; `removeWorktree` also takes
 * back what the verification run built there. Returns its path.
 */
export function createVerifyCheckout(repoRoot, commit) {
  createLockScope('worktree').assertCanAcquire(WORKTREE_ADMIN, WORKTREE_ADMIN_RANK);
  return checkoutCall('createVerifyCheckout', { ctx: checkoutContext(repoRoot), commit });
}

/**
 * Remove the checkout at `worktreePath`; its branch stays (the durable proposal). `opts.deliveredTo` is what the
 * checkout's tip must be contained in; `opts.retainTo` first resets it there and pins the HEAD it held. Returns
 * `{ retainedRef, snapshot }` when a HEAD was pinned, else `undefined`.
 */
export function removeWorktree(repoRoot, worktreePath, opts = {}) {
  return checkoutCall('removeWorktree', { ctx: checkoutContext(repoRoot), path: worktreePath, deliveredTo: opts.deliveredTo ?? null, retainTo: opts.retainTo ?? null }) ?? undefined;
}

/** Cleanup half of the dispatch pair: never throws; a cleanup that cannot finish is reported through `log`. */
export function removeDispatchWorktree(repoRoot, worktreePath, log = () => {}) {
  let lines;
  try { lines = checkoutCall('removeDispatchWorktree', { ctx: checkoutContext(repoRoot), path: worktreePath }); } catch (err) {
    lines = [`fgos-runner: worktree cleanup failed for "${worktreePath}": ${err.message}`];
  }
  if (typeof log === 'function') for (const line of lines) log(line);
}

/**
 * Every `fgw/*` branch left in `repoRoot` with its `aheadCount` against `opts.base` (default `HEAD`), and its `tip`
 * with `opts.includeTip`. Policy stays the caller's: 0 ahead is an orphan a prune loop may delete; more is a
 * proposal to keep.
 */
export function listLeftovers(repoRoot, opts = {}) {
  return checkoutCall('listLeftovers', { ctx: checkoutContext(repoRoot), base: opts.base ?? null, includeTip: !!opts.includeTip });
}

/**
 * Take back the stray checkout of `branch` before the branch is deleted (a crash orphan). A dirty one, a live
 * `callerCwd` inside it, or one of the repository's own refuses. Returns `{ reclaimed, path }`.
 */
export function reclaimOrphanedCheckout(repoRoot, branch, { callerCwd = process.cwd() } = {}) {
  return checkoutCall('reclaimOrphanedCheckout', { ctx: checkoutContext(repoRoot), branch, callerCwd });
}

/** Install the checkout's own `node_modules` when `package.json` declares dependencies; true when it installed. */
export function provisionDependencies(worktreePath) {
  return checkoutCall('provisionDependencies', { worktree: worktreePath });
}

/** Run the project's configured `worktreeSetup.commands` in `worktreePath`. They are read from the main checkout whatever root is passed, so a worker's edit to its own checkout's config never changes what runs. */
export function runWorktreeSetupCommands(worktreePath, repoRoot) {
  const facts = inspectGit(repoRoot).resolveRepo();
  checkoutCall('runSetupCommands', { worktree: worktreePath, repoRoot: facts.notARepository ? repoRoot : facts.trustedMainRoot });
}
