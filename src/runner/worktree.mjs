// worktree.mjs — isolated git worktree/branch lifecycle for the runner (per
// D2/D4, reliability panel revision on phase-2-routing-7): every worker runs
// on its own worktree, checked out on branch `fgw/<id>`, so its result stays
// a proposal on a disposable branch (per D4) until a human/review approves
// it — this module never merges, pushes, or touches the main working tree.
//
// SAME-USER TRUST INVARIANT: like dispatch.mjs, this module assumes the
// repo it operates on is the user's own trusted checkout — it shells out to
// `git` with the repo root as `cwd`, and does not sandbox or restrict what
// the worker committed on its branch. Isolation here is "own branch, easy
// to discard," not a security boundary against a hostile worker.
//
// CWD DISCIPLINE (probe-learned, reliability panel): every `git` call in
// this module runs with `cwd: repoRoot` — NEVER from inside a worktree that
// is itself being removed. Running `git worktree remove` (or anything else)
// from inside the very worktree it targets makes the process's own cwd
// vanish mid-command; the fix is structural, not a retry: always operate
// from the stable repo root.
//
// RETRY-WITHOUT-SELF-COLLISION: `createWorktree` REUSES an existing
// `fgw/<id>` branch (checkout via `git worktree add <path> <branch>`, never
// `-b`) whenever that branch already exists, and always allocates a FRESH
// worktree directory (via `mkdtemp`) for the checkout. A retried dispatch of
// the same work item therefore never collides with its own previous attempt
// — same branch, new empty directory slot.
//
// BRANCH-TREE TOPOLOGY (fan-out-parallel, D3/D4/D17): a root's integration
// branch `fgw/<root>` is created EARLY as a ref only, via `createBranchRef`
// — no worktree/checkout, just `git branch <branch> <baseRef>`. Leaves of
// that root then fork their own `fgw/<leaf>` branch from the *tip of the
// root's branch* (D3 "leaf fork-from-tip-of-parent") by passing that tip as
// `opts.baseRef` to `createWorktree`, instead of forking from `main`/current
// HEAD. D17 revises the original D4 design: no worktree is ever long-lived
// here — only branches are durable; every checkout (leaf execution,
// leaf-into-parent merge, root-into-main merge) is ephemeral and rebuilt
// from its branch ref on demand.
//
// CRASH RECLAIM (phase-2-routing-10): a normal teardown always runs
// `removeWorktree` before a branch is ever reused, so under ordinary
// operation the branch is never checked out anywhere when `createWorktree`
// reuses it. But a genuine process kill (the runner itself SIGKILLed
// mid-item) skips every `finally` — the worker's commit lands, yet the
// worktree checkout is never torn down, so `fgw/<id>` stays checked out at
// that now-orphaned path. The next `createWorktree` call for the same id
// (e.g. the startup reap's own throwaway goal-check worktree) would
// otherwise hit git's own "already checked out at <path>" refusal.
// `reclaimOrphanedCheckout` runs first whenever the branch is being reused:
// it finds any existing checkout of the branch via `git worktree list
// --porcelain` and clears it — force-removing the directory if it still
// exists on disk, or pruning git's own bookkeeping if the directory is
// already gone — before the fresh worktree is added. The branch (and its
// commit) survives; only the stale checkout directory is discarded, exactly
// like an ordinary `removeWorktree` would have done had it run. Only a
// genuinely irreconcilable state surfaces as a hard `worktree-fail`.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

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

/**
 * Provision `worktreePath`'s own `node_modules` before anything runs
 * `verify` against it (tsk-2vd D1/D2): a disposable worktree never inherits
 * the host repo's `node_modules` — git only checks out tracked files.
 * No-ops when `worktreePath/package.json` is absent or declares no
 * `dependencies`/`devDependencies` at all (same skip precedent as
 * `checkDependenciesInstalled`, `src/setup/registrations.mjs`) — keeps
 * every existing zero-dependency caller (this repo's own history until
 * `tsk-slq` added `yaml`) byte-identical, no install cost paid when
 * nothing is declared. Runs `npm ci` when `worktreePath/package-lock.json`
 * exists (reproducible, matches the lockfile exactly), else `npm install`
 * (D2) — never a `node_modules` symlink from the host repo (D2's rejected
 * alternative: risks masking a real dependency mismatch when the
 * worktree's own `package.json` diverged from the host's installed set).
 */
export function provisionDependencies(worktreePath) {
  const packageJsonPath = path.join(worktreePath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) return;
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const hasDeps = Object.keys(pkg.dependencies ?? {}).length > 0 || Object.keys(pkg.devDependencies ?? {}).length > 0;
  if (!hasDeps) return;
  const hasLockfile = fs.existsSync(path.join(worktreePath, 'package-lock.json'));
  execFileSync('npm', [hasLockfile ? 'ci' : 'install'], { cwd: worktreePath, stdio: 'ignore' });
}

function git(repoRoot, args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', shell: false });
}

// Exported (pr-lifecycle-2): the approval-gate merge engine (merge.mjs)
// reuses this exact check to classify a proposed item as "runner" (a live
// `fgw/<id>` branch) vs "pull"/"legacy" (no branch) — one existence check,
// never a second implementation of "does this branch exist" elsewhere.
export function branchExists(repoRoot, branch) {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`], {
      cwd: repoRoot,
      encoding: 'utf8',
      shell: false,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse `git worktree list --porcelain` output and return the checkout
 * path currently registered for `branch` (as `refs/heads/<branch>`), or
 * `null` if the branch is not checked out anywhere. Porcelain records are
 * blank-line-separated stanzas, each starting with a `worktree <path>`
 * line followed by a `branch refs/heads/<name>` line (or `detached`).
 */
function findCheckoutPath(porcelainOutput, branch) {
  const ref = `refs/heads/${branch}`;
  let currentPath = null;
  for (const line of porcelainOutput.split('\n')) {
    if (line.startsWith('worktree ')) {
      currentPath = line.slice('worktree '.length).trim();
    } else if (line.startsWith('branch ')) {
      if (line.slice('branch '.length).trim() === ref) return currentPath;
    } else if (line === '') {
      currentPath = null;
    }
  }
  return null;
}

/**
 * True when `worktreePath` has any uncommitted change other than the
 * `.fgos` removal `createWorktree` itself always performs right after
 * checkout (ADR0020) — that path is this module's own known artifact,
 * never real user/worker content, and would otherwise make every checkout
 * look dirty regardless of real activity. Mirrors session.mjs's
 * `reclaimOrphanedSessions` (same `:!.fgos` pathspec exclusion). Fails
 * closed (dirty) on an unreadable status — never assume clean.
 */
function isCheckoutDirty(repoRoot, worktreePath) {
  let status;
  try {
    status = git(repoRoot, ['-C', worktreePath, 'status', '--porcelain', '--', ':!.fgos']);
  } catch {
    return true;
  }
  return status.trim().length > 0;
}

/**
 * Reclaim `branch` from any existing checkout before it is reused (per
 * CRASH RECLAIM in the module doc). Idempotent: a branch not checked out
 * anywhere is a no-op. Returns `{ reclaimed, path }`.
 *
 * DATA-LOSS GUARD (tsk-1os): a genuine crash-orphan is clean — the
 * worker's commit lands before the process dies, per CRASH RECLAIM above.
 * A checkout with real uncommitted changes is therefore NOT a crash-orphan
 * — it may be a live checkout (an ad-hoc `git worktree add` on this
 * branch, invisible to any registry) still in active use, so this refuses
 * to force-remove it instead of silently discarding the work. The caller
 * (createWorktree's reuse path) does not catch this — it propagates as a
 * hard failure rather than destroying the checkout.
 */
export function reclaimOrphanedCheckout(repoRoot, branch) {
  let listing;
  try {
    listing = git(repoRoot, ['worktree', 'list', '--porcelain']);
  } catch (err) {
    throw new WorktreeError(`listing worktrees failed while reclaiming "${branch}": ${err.message}`, { branch });
  }

  const orphanPath = findCheckoutPath(listing, branch);
  if (!orphanPath) return { reclaimed: false, path: null };

  if (fs.existsSync(orphanPath)) {
    if (isCheckoutDirty(repoRoot, orphanPath)) {
      throw new WorktreeError(
        `refusing to reclaim checkout of "${branch}" at "${orphanPath}" — it has uncommitted changes, so it is not a genuine crash-orphan (a real one is clean, its commit already landed) and may be a live checkout still in use. Commit or discard the work there, or remove the worktree yourself, before retrying.`,
        { branch, orphanPath },
      );
    }
    try {
      git(repoRoot, ['worktree', 'remove', '--force', orphanPath]);
    } catch (err) {
      throw new WorktreeError(
        `reclaiming orphaned checkout of "${branch}" at "${orphanPath}" failed: ${err.message}`,
        { branch, orphanPath },
      );
    }
  } else {
    try {
      git(repoRoot, ['worktree', 'prune']);
    } catch (err) {
      throw new WorktreeError(
        `pruning stale worktree registration for "${branch}" (path already gone: "${orphanPath}") failed: ${err.message}`,
        { branch, orphanPath },
      );
    }
  }
  return { reclaimed: true, path: orphanPath };
}

/**
 * Create the integration branch `fgw/<id>` (D17: "nhánh tạo sớm, không cần
 * worktree") as a REF ONLY — no worktree/checkout is registered for it.
 * `opts.baseRef` (default `'main'`) is the ref the new branch forks from.
 * Idempotent: if `fgw/<id>` already exists, this is a no-op — it does NOT
 * move the branch to `baseRef`, mirroring the RETRY-WITHOUT-SELF-COLLISION
 * discipline above (a retried root-dispatch must not disturb a branch that
 * may already carry committed leaf work). Returns `{ branch, created }`,
 * where `created` is `false` when the branch already existed.
 */
export function createBranchRef(repoRoot, id, opts = {}) {
  const branch = branchNameFor(id);
  const baseRef = opts.baseRef ?? 'main';

  if (branchExists(repoRoot, branch)) {
    return { branch, created: false };
  }

  try {
    git(repoRoot, ['branch', branch, baseRef]);
  } catch (err) {
    throw new WorktreeError(`git branch failed creating ref "${branch}" from "${baseRef}": ${err.message}`, {
      branch,
      baseRef,
    });
  }

  return { branch, created: true };
}

/**
 * Create (or reuse, see module doc) an isolated worktree for work item `id`
 * inside `repoRoot`. Always allocates a fresh temp directory for the
 * checkout via `mkdtemp` (default base: `os.tmpdir()/fgos-worktrees`,
 * overridable via `opts.worktreeDir` — tests use this to stay inside a
 * disposable temp git repo, never the main repo). When the branch does not
 * already exist, `opts.baseRef` (D3 "leaf fork-from-tip-of-parent") forks
 * the new branch from that ref instead of the implicit current HEAD; it is
 * ignored on the reuse path (an existing branch is reused exactly as
 * before, regardless of `opts.baseRef`). Returns `{ path, branch, reused }`.
 *
 * `.fgos/` (ADR0020): since `.fgos/` is git-tracked in this repo, a bare
 * `git worktree add` would check out a snapshot frozen at fork time —
 * stale the moment main gets another uncommitted event, and a live escape
 * hatch into the shared store if it were symlinked instead (rejected,
 * ADR0020). The worker running in this worktree has no legitimate reason to
 * read or write `.fgos/` at all (`0005`: the runner is the sole writer,
 * always against `repoRoot`), so any checked-out copy is removed outright —
 * not shared, not synced. `mergeRunnerItem` (merge.mjs) is the trusted-side
 * backstop if a worker commits a fresh `.fgos/` of its own anyway.
 */
export function createWorktree(repoRoot, id, opts = {}) {
  const branch = branchNameFor(id);
  const baseDir = opts.worktreeDir ?? path.join(os.tmpdir(), 'fgos-worktrees');
  fs.mkdirSync(baseDir, { recursive: true });
  const worktreePath = fs.mkdtempSync(path.join(baseDir, `${id}-`));

  const reused = branchExists(repoRoot, branch);
  if (reused) {
    try {
      reclaimOrphanedCheckout(repoRoot, branch);
    } catch (err) {
      try {
        fs.rmSync(worktreePath, { recursive: true, force: true });
      } catch {
        // best-effort cleanup of the empty dir mkdtemp created; the real
        // failure below is what the caller needs to see.
      }
      throw err;
    }
  }
  try {
    if (reused) {
      git(repoRoot, ['worktree', 'add', worktreePath, branch]);
    } else if (opts.baseRef) {
      git(repoRoot, ['worktree', 'add', '-b', branch, worktreePath, opts.baseRef]);
    } else {
      git(repoRoot, ['worktree', 'add', '-b', branch, worktreePath]);
    }
  } catch (err) {
    try {
      fs.rmSync(worktreePath, { recursive: true, force: true });
    } catch {
      // best-effort cleanup of the empty dir mkdtemp created; the real
      // failure below is what the caller needs to see.
    }
    throw new WorktreeError(`git worktree add failed for branch "${branch}": ${err.message}`, {
      branch,
      worktreePath,
    });
  }

  try {
    fs.rmSync(path.join(worktreePath, '.fgos'), { recursive: true, force: true });
  } catch (err) {
    throw new WorktreeError(`removing checked-out .fgos in worktree "${worktreePath}" failed: ${err.message}`, {
      branch,
      worktreePath,
    });
  }

  provisionDependencies(worktreePath);

  return { path: worktreePath, branch, reused };
}

// OPERATION-TYPE WRAPPERS (docs/decisions/0022 candidate #3, ranked-priority
// row "createWorktree 6 call site tự quyết baseRef/cleanup"): every
// createWorktree call site falls into exactly one of these 3 recurring
// shapes, but before this each site re-decided its own cleanup policy
// (force-remove now vs best-effort-remove-and-log vs no cleanup at all)
// separately. `createWorktree`/`removeWorktree` above stay the only two
// low-level primitives; these wrappers only name which shape a call site is
// and centralize that shape's cleanup, never a second worktree/branch
// implementation.

/**
 * The checkout of `branch` a claim may reattach to instead of standing up a
 * new one, or `null` when there is none to reattach to. Deliberately
 * stricter than `findCheckoutPath` alone, on two counts:
 *
 * - the registration must still exist on disk. `git worktree list` reports
 *   a path whose directory was deleted out from under it until someone
 *   prunes, and handing that back would be a checkout that isn't there.
 * - the checkout must live under `baseDir`, the directory THIS caller
 *   allocates its own worktrees in. A runner dispatch worktree for the same
 *   item lands elsewhere (the runner passes no `worktreeDir`, so its
 *   checkouts go to the `os.tmpdir()` default while a `pick` claim uses
 *   `.claude/worktrees`), and a live one means a worker is running in it
 *   right now — reattaching a second claim into that directory would put two
 *   workers in one checkout.
 *
 * Cleanliness is deliberately NOT a condition here: nothing is removed on
 * this path, so `reclaimOrphanedCheckout`'s data-loss guard has nothing to
 * protect against. A checkout with uncommitted work is precisely the session
 * that most needs to resume where it left off.
 */
function reattachableCheckout(repoRoot, branch, baseDir) {
  let listing;
  try {
    listing = git(repoRoot, ['worktree', 'list', '--porcelain']);
  } catch {
    return null;
  }
  const registered = findCheckoutPath(listing, branch);
  if (!registered || !fs.existsSync(registered) || !fs.existsSync(baseDir)) return null;

  let relative;
  try {
    // realpath both sides: `git worktree list` reports resolved paths, while
    // a caller's baseDir can still carry a symlinked segment.
    relative = path.relative(fs.realpathSync(baseDir), fs.realpathSync(registered));
  } catch {
    return null;
  }
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return registered;
}

/**
 * claim-isolate: the worktree returned here IS the work — it outlives this
 * call, and its owning claim (`claim-port.mjs`'s `claimWork`) tears it down
 * later at return/reject time, never inline here.
 *
 * REATTACH (tsk-65n): a claim whose `fgw/<id>` checkout is still standing
 * gets that same checkout back, untouched. The case is routine rather than
 * exotic — an item's claim is released back to `todo` the moment it reaches
 * stage `executing` (`decompose.mjs`'s `releaseClaimOnExecuting`), and the
 * session that held it then claims it again to do the work, from inside the
 * very worktree the claim stands up. Going through `createWorktree`'s reuse
 * path there would reclaim that live checkout: force-removed when clean —
 * pulling the directory out from under the running session — or a hard
 * failure when dirty. Neither is what a re-claim means.
 *
 * This is why the reattach lives here and not in `createWorktree`: the reuse
 * path is shared with the runner's own retry, which deliberately wants a
 * FRESH directory on the reused branch so a retry never builds on a previous
 * attempt's debris (see RETRY-WITHOUT-SELF-COLLISION in the module doc).
 * Keeping the decision in this wrapper leaves that path, and the
 * merge-ephemeral one, byte-for-byte unchanged.
 */
export function createClaimWorktree(repoRoot, id, opts = {}) {
  const branch = branchNameFor(id);
  if (branchExists(repoRoot, branch)) {
    const baseDir = opts.worktreeDir ?? path.join(os.tmpdir(), 'fgos-worktrees');
    const existing = reattachableCheckout(repoRoot, branch, baseDir);
    // `reused: true` is the same answer the add-on-an-existing-branch path
    // already gives, and means the same thing to a caller: this claim did not
    // fork a new branch.
    if (existing) return { path: existing, branch, reused: true };
  }
  return createWorktree(repoRoot, id, opts);
}

/**
 * merge-ephemeral: a worktree created ONLY to stage one merge (approve's
 * leaf-into-root merge, catchup's target-into-item merge) against a branch
 * that already exists — `opts.baseRef` is never needed here (createWorktree's
 * branch-reuse path ignores it) — and force-removed unconditionally once
 * `fn` settles, whether it returns or throws. Replaces the identical
 * try/finally both call sites used to write out by hand.
 */
export async function withMergeEphemeralWorktree(repoRoot, id, fn) {
  const worktree = createWorktree(repoRoot, id, {});
  try {
    return await fn(worktree);
  } finally {
    removeWorktree(repoRoot, worktree.path, { force: true });
  }
}

/**
 * runner-dispatch: a worktree created for one dispatch attempt (startup
 * reap's throwaway goal-check checkout, or a claimed item's worker run).
 * `opts` carries whatever baseRef/worktreeDir the caller's own leaf/root
 * logic already resolved (D3 "leaf fork-from-tip-of-parent" stays call-site
 * business logic, not a choke-point — only the cleanup policy was
 * duplicated). Pair with `removeDispatchWorktree` below: a cleanup failure
 * there is logged, never thrown, so it can never mask the attempt's real
 * outcome — the same policy `loop.mjs` used to define as its own private
 * `safeRemoveWorktree` at every call site.
 */
export function createDispatchWorktree(repoRoot, id, opts = {}) {
  return createWorktree(repoRoot, id, opts);
}

/** Cleanup half of the runner-dispatch pair — see `createDispatchWorktree`. */
export function removeDispatchWorktree(repoRoot, worktreePath, log) {
  try {
    removeWorktree(repoRoot, worktreePath, { force: true });
  } catch (err) {
    log(`fgos-runner: worktree cleanup failed for "${worktreePath}": ${err.message}`);
  }
}

/**
 * Remove the worktree checkout at `worktreePath` (per CWD DISCIPLINE above:
 * always run from `repoRoot`, never from inside `worktreePath`). Does NOT
 * delete the branch itself — the branch is the durable D1-level proposal
 * artifact (per D4) and survives worktree teardown for human/review to
 * inspect or merge later.
 */
export function removeWorktree(repoRoot, worktreePath, opts = {}) {
  const args = ['worktree', 'remove', worktreePath];
  if (opts.force) args.push('--force');
  try {
    git(repoRoot, args);
  } catch (err) {
    throw new WorktreeError(`git worktree remove failed for "${worktreePath}": ${err.message}`, {
      worktreePath,
    });
  }
  try {
    git(repoRoot, ['worktree', 'prune']);
  } catch {
    // best-effort — a failed prune does not invalidate a successful remove.
  }
}

/**
 * List every `fgw/*` branch left in `repoRoot`, each with its `aheadCount`
 * (commits reachable from the branch but not from its merge-base with
 * `opts.base`, default `HEAD`). POLICY (caller's to enforce, documented
 * here since this is where the fact is computed): `aheadCount === 0` means
 * an orphan — a worktree that was created and torn down without ever
 * committing anything on it — safe for a caller's prune loop to delete
 * outright; `aheadCount > 0` means the branch carries a real proposal and
 * must be kept for human/review, never auto-deleted.
 */
export function listLeftovers(repoRoot, opts = {}) {
  const base = opts.base ?? 'HEAD';
  let refsOut;
  try {
    refsOut = git(repoRoot, ['for-each-ref', '--format=%(refname:short)', 'refs/heads/fgw/']);
  } catch (err) {
    throw new WorktreeError(`listing "fgw/" branches failed: ${err.message}`, {});
  }

  const branches = refsOut
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return branches.map((branch) => {
    let aheadCount;
    try {
      const mergeBase = git(repoRoot, ['merge-base', base, branch]).trim();
      const countOut = git(repoRoot, ['rev-list', '--count', `${mergeBase}..${branch}`]);
      aheadCount = parseInt(countOut.trim(), 10) || 0;
    } catch (err) {
      throw new WorktreeError(`computing ahead-count for branch "${branch}" failed: ${err.message}`, {
        branch,
      });
    }
    return { branch, aheadCount };
  });
}
