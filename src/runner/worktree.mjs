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
import { StoreError } from '../state/store.mjs';

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

// Same call as `git` above, but with git's own stderr swallowed rather than
// inherited by this process. Only the two probe helpers below use it: both
// ask questions git legitimately answers with a `fatal:` line (no origin
// remote, no such branch, not a repository at all), and both already treat
// that as a normal answer — printing the raw fatal to the caller's stderr
// would turn "this directory is not a repo" into apparent breakage on a
// path that is deliberately fail-open. Byte-identical to the `stdio` the
// two functions had at their previous home in merge.mjs (tsk-49i D1).
function gitQuiet(repoRoot, args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
}

/** Resolve `p` through the filesystem when it exists, and fall back to a
 * plain absolute resolve when it does not — the shape every caller
 * comparing two checkout paths for identity needs. Exported (tsk-49i D3)
 * because `approve`'s session-worktree guard needs the identical rule and
 * used to carry its own byte-identical copy in bin/fgos.mjs. */
export function realpathOrSelf(p) {
  try {
    return fs.realpathSync(p);
  } catch {
    return path.resolve(p);
  }
}

/** `git <args>` for a plain read, with any failure (not a repo, no commits
 * yet) reported as `validation` rather than escaping as an "unexpected"
 * exit-1 — the R4 exit-code contract every other error surface follows.
 * Private on purpose: the merge-cluster use cases read refs through the two
 * named helpers below (tsk-49i D3) rather than carrying their own
 * git-error policy. */
function gitRead(repoRoot, args) {
  try {
    return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', shell: false });
  } catch (err) {
    throw new StoreError('validation', `git ${args.join(' ')} failed in "${repoRoot}": ${err.message}`);
  }
}

/** The sha `repoRoot`'s own HEAD currently points at. */
export function currentHead(repoRoot) {
  return gitRead(repoRoot, ['rev-parse', 'HEAD']).trim();
}

/** tsk-5dk: a named branch/ref's own tip sha, not "whatever HEAD happens to
 * be in some worktree's checkout" (`currentHead` above) — branch refs are
 * shared across every linked worktree of the same repo, so this is correct
 * to call from repoRoot even when the actual merge commit was created in a
 * different (e.g. ephemeral) worktree of the same repo, and stays correct
 * for an idempotent already-merged re-approve too (always reads the
 * target's real current tip, never a stale pre-merge snapshot). */
export function resolveRefSha(repoRoot, ref) {
  return gitRead(repoRoot, ['rev-parse', ref]).trim();
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
  try {
    const ref = gitQuiet(repoRoot, ['symbolic-ref', '--short', 'refs/remotes/origin/HEAD']).trim();
    if (ref.startsWith('origin/')) {
      return ref.slice('origin/'.length);
    }
  } catch {
    // no origin remote, or origin/HEAD isn't set locally — fall through
  }

  for (const candidate of ['main', 'master']) {
    try {
      gitQuiet(repoRoot, ['show-ref', '--verify', '--quiet', `refs/heads/${candidate}`]);
      return candidate;
    } catch {
      // candidate branch doesn't exist locally — try the next one
    }
  }

  return 'main';
}

/**
 * Whether `repoRoot` IS the repo's main working tree — never a linked
 * worktree, registered through `fgos session start` (session.mjs) or ad-hoc
 * (a plain `git worktree add` run by hand, invisible to `sessions.json`).
 * `approve`'s registry-based guard only ever caught the registered case; an
 * ad-hoc worktree slipped through the exact same risk untouched — a merge
 * landing on that worktree's own checkout, or a goal-check verifying its own
 * (possibly stale/divergent) tree, while the item is still reported "done" /
 * "verified on main" (P44).
 *
 * The check is structural, not registry-based, so it catches both: a main
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
export function isMainWorktree(repoRoot) {
  let toplevelRaw;
  try {
    toplevelRaw = gitQuiet(repoRoot, ['rev-parse', '--show-toplevel']).trim();
  } catch {
    return true;
  }
  const toplevel = realpathOrSelf(toplevelRaw);
  const commonDirRaw = gitQuiet(repoRoot, ['rev-parse', '--git-common-dir']).trim();
  const commonDirAbs = path.isAbsolute(commonDirRaw) ? commonDirRaw : path.resolve(repoRoot, commonDirRaw);
  const commonDirParent = realpathOrSelf(path.dirname(commonDirAbs));
  return toplevel === commonDirParent;
}

// Push a runner item's branch to origin unless it already tracks an upstream.
// The upstream probe is a plain execFileSync + try/catch, NOT this module's
// `git` helper: `review`'s own caller rethrows every git failure as
// StoreError('validation', ...), the wrong semantic for an existence probe
// that is *expected* to fail on a never-pushed branch. Only the push itself
// is a real operation. Lives here rather than in bin/fgos.mjs (tsk-49i D3):
// pushing a branch is branch mechanics, this module's own job.
export function ensureBranchPushed(repoRoot, branch) {
  try {
    execFileSync('git', ['rev-parse', '--abbrev-ref', `${branch}@{upstream}`], { cwd: repoRoot, encoding: 'utf8', shell: false });
    return; // upstream already set — nothing to push
  } catch {
    // no upstream yet — the normal, expected first-review case; fall through
  }
  execFileSync('git', ['push', '-u', 'origin', branch], { cwd: repoRoot, encoding: 'utf8', shell: false });
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
 *
 * Exported (tsk-3gx-1): `promote-preflight.mjs` reuses this exact parse to
 * judge whether a member branch is currently checked out elsewhere before
 * a retarget — same "one implementation of this check" discipline
 * `branchExists` above already documents for its own callers.
 */
export function findCheckoutPath(porcelainOutput, branch) {
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
 *
 * Exported (tsk-3gx-1): `promote-preflight.mjs` reuses this exact
 * fail-closed dirty check for its own "is this branch actively in use"
 * judgment — never a second implementation of "is this checkout dirty".
 */
export function isCheckoutDirty(repoRoot, worktreePath) {
  let status;
  try {
    status = git(repoRoot, ['-C', worktreePath, 'status', '--porcelain', '--', ':!.fgos']);
  } catch {
    return true;
  }
  return status.trim().length > 0;
}

/**
 * Return an array of relative file paths that are currently dirty (uncommitted
 * or untracked) in `worktreePath`, excluding `.fgos` artifacts (reusing the
 * exact `:!.fgos` pathspec exclusion from `isCheckoutDirty`). Fails open
 * (returns empty array) on git error.
 *
 * Exported (tsk-3bh): `executeExecutorCli` (src/runner/dispatch/cli.mjs)
 * uses this to detect uncommitted paths lost across an out-of-process dispatch.
 */
export function checkoutDirtyPaths(repoRoot, worktreePath) {
  let statusOutput;
  try {
    statusOutput = git(repoRoot, ['-C', worktreePath, 'status', '--porcelain', '-z', '--', ':!.fgos']);
  } catch {
    return [];
  }
  const records = statusOutput.split('\0').filter((entry) => entry.length > 0);
  const paths = [];
  for (let i = 0; i < records.length; i += 1) {
    const entry = records[i];
    const statusCode = entry.slice(0, 2);
    const filePath = entry.slice(3);
    if (filePath) {
      paths.push(filePath);
    }
    if (statusCode.includes('R') || statusCode.includes('C')) {
      i += 1;
    }
  }
  return paths;
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
 *
 * DESTROY-ON-PURPOSE (tsk-3lx): stays destroy-only, unlike its sibling
 * `relocateOrphanedCheckout` below — `cleanupMergedBranch` (merge.mjs)
 * calls this directly to dispose of a stray leftover checkout right
 * before deleting `branch` itself, where there is no replacement checkout
 * to relocate to. `createWorktree`'s own reuse path is what actually needs
 * the checkout to keep living (just at a new path), which is exactly what
 * makes that ONE call site the zero-destroy incident's origin — see
 * `relocateOrphanedCheckout`.
 */
export function reclaimOrphanedCheckout(repoRoot, branch, { callerCwd = process.cwd() } = {}) {
  let listing;
  try {
    listing = git(repoRoot, ['worktree', 'list', '--porcelain']);
  } catch (err) {
    throw new WorktreeError(`listing worktrees failed while reclaiming "${branch}": ${err.message}`, { branch });
  }

  const orphanPath = findCheckoutPath(listing, branch);
  if (!orphanPath) return { reclaimed: false, path: null };

  // REPO-ROOT GUARD (tsk-k8u D1): an orphan checkout that resolves to
  // `repoRoot` itself would force-remove the main checkout's own working
  // tree — never a genuine crash-orphan (a crash-orphan is always some
  // OTHER checkout of the branch), and destructive in a way no caller here
  // intends. Refuses the same way the dirty-checkout guard below does,
  // rather than silently reclaiming the ground the caller itself may be
  // standing on.
  if (path.resolve(orphanPath) === path.resolve(repoRoot)) {
    throw new WorktreeError(
      `refusing to reclaim checkout of "${branch}" at "${orphanPath}" — it resolves to repoRoot itself, so reclaiming it would force-remove the main checkout's own working tree. This is never a genuine crash-orphan; check how "${branch}" ended up checked out at repoRoot before retrying.`,
      { branch, orphanPath },
    );
  }

  // LIVE SESSION GUARD (tsk-1tm): an orphan checkout that is the CALLING
  // session's own live worktree — or a worktree the session's cwd is
  // currently nested inside — is never a genuine crash-orphan either,
  // regardless of how clean its git status looks. `fgos`'s own shell
  // wrapper (`scripts/fgos-shell-integration.sh`) never `cd`s before
  // invoking `node bin/fgos.mjs`, and this codebase never calls
  // `process.chdir()`, so `process.cwd()` at the moment `approve` runs is
  // always the real, live cwd of whatever session/shell invoked it —
  // including a session standing inside a claimed item's own worktree via
  // the documented tsk-424 chained-`EnterWorktree` pattern (root worktree
  // -> `EnterWorktree` into a child item's worktree). Approving a leaf and
  // then its root from inside that chain each reclaim a DIFFERENT
  // worktree the session is/was still standing in — this guard catches
  // both, one call at a time, with no cross-call state needed. `callerCwd`
  // is injectable (tests only; production always uses the real
  // `process.cwd()`).
  const resolvedOrphanPath = path.resolve(orphanPath);
  const resolvedCallerCwd = path.resolve(callerCwd);
  if (
    resolvedOrphanPath === resolvedCallerCwd ||
    resolvedCallerCwd.startsWith(resolvedOrphanPath + path.sep)
  ) {
    throw new WorktreeError(
      `refusing to reclaim checkout of "${branch}" at "${orphanPath}" — it is the calling session's own live checkout (cwd "${callerCwd}"), so it is not a genuine crash-orphan (a real one belongs to no live session) and force-removing it would destroy the session's own working directory mid-operation. Finish or exit that session's work there before retrying.`,
      { branch, orphanPath },
    );
  }

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
 * Relocate `branch`'s existing clean checkout directly onto `targetPath`
 * via `git worktree move`, instead of destroying it first (tsk-3lx D2,
 * zero-destroy): if the move fails for any reason, the pre-existing
 * checkout is left exactly where it was, still valid, still on `branch`.
 * This is what `createWorktree`'s reuse path calls instead of
 * `reclaimOrphanedCheckout` — the incident this closes (`spawnSync git
 * ENOENT` mid-`git worktree add`, deleting the exact checkout a live
 * session was sitting in) only ever happened on THIS path, where a
 * replacement checkout was always the point; `reclaimOrphanedCheckout`
 * itself stays destroy-only for its other caller, `cleanupMergedBranch`,
 * which has no replacement to relocate to (see its own docstring).
 *
 * Returns `{ relocated: true, from, to }` when a live checkout was moved,
 * `{ relocated: false }` when there was nothing to relocate — no existing
 * checkout at all, or one whose directory is already gone (pruned instead,
 * same as `reclaimOrphanedCheckout`'s own already-gone branch — nothing
 * physical to lose there either way).
 *
 * Shares the DATA-LOSS GUARD above verbatim (tsk-1os, unchanged): a
 * checkout with real uncommitted changes is refused, never moved.
 *
 * `targetPath` must not already exist on disk. `git worktree move` nests
 * the source under an existing directory instead of placing it there —
 * verified empirically against this repo's own git (2.34.1), recorded in
 * `docs/history/pick-worktree-reclaim-zero-destroy/plan.md`'s "Validated
 * at fgos-coding-validating" section — so the caller's own `mkdtemp`'d empty
 * placeholder directory must be removed immediately before this call, not
 * reused as-is.
 */
function relocateOrphanedCheckout(repoRoot, branch, targetPath) {
  let listing;
  try {
    listing = git(repoRoot, ['worktree', 'list', '--porcelain']);
  } catch (err) {
    throw new WorktreeError(`listing worktrees failed while reclaiming "${branch}": ${err.message}`, { branch });
  }

  const orphanPath = findCheckoutPath(listing, branch);
  if (!orphanPath) return { relocated: false };

  if (!fs.existsSync(orphanPath)) {
    try {
      git(repoRoot, ['worktree', 'prune']);
    } catch (err) {
      throw new WorktreeError(
        `pruning stale worktree registration for "${branch}" (path already gone: "${orphanPath}") failed: ${err.message}`,
        { branch, orphanPath },
      );
    }
    return { relocated: false };
  }

  if (isCheckoutDirty(repoRoot, orphanPath)) {
    throw new WorktreeError(
      `refusing to reclaim checkout of "${branch}" at "${orphanPath}" — it has uncommitted changes, so it is not a genuine crash-orphan (a real one is clean, its commit already landed) and may be a live checkout still in use. Commit or discard the work there, or remove the worktree yourself, before retrying.`,
      { branch, orphanPath },
    );
  }

  try {
    fs.rmdirSync(targetPath);
  } catch (err) {
    throw new WorktreeError(`preparing relocation target "${targetPath}" for "${branch}" failed: ${err.message}`, {
      branch,
      orphanPath,
      targetPath,
    });
  }

  try {
    git(repoRoot, ['worktree', 'move', orphanPath, targetPath]);
  } catch (err) {
    throw new WorktreeError(
      `relocating checkout of "${branch}" from "${orphanPath}" to "${targetPath}" failed: ${err.message}`,
      { branch, orphanPath, targetPath },
    );
  }

  return { relocated: true, from: orphanPath, to: targetPath };
}

/**
 * Create the integration branch `fgw/<id>` (D17: "nhánh tạo sớm, không cần
 * worktree") as a REF ONLY — no worktree/checkout is registered for it.
 * `opts.baseRef` (default: `detectTrunk(repoRoot)`, tsk-386 — no longer a
 * literal `'main'`; a host project whose trunk is `master` would otherwise
 * fail `git branch fgw/<id> main` outright on this fallback, per
 * `docs/distribution-vision.md`'s "installed into other repos" story).
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
 * `.fgos/` strip (ADR0020) + dependency provisioning, shared by every
 * function in this module that stands up a fresh checkout — `createWorktree`
 * and `createDetachedMergeWorktree` below.
 *
 * `beforeProvision` (tsk-1mn, optional, default none): called with no
 * arguments right after the fast `.fgos/` strip and immediately before the
 * slow, synchronous `provisionDependencies` (`npm ci`/`npm install`) call
 * below — the exact seam `claimWork` (claim-port.mjs) needs to release
 * `main-checkout.lock` at. Neither this strip nor `provisionDependencies`
 * ever touches `repoRoot`'s own `.git/index` (both operate entirely inside
 * `worktreePath`, a directory the lock's own STR65 concern never covers —
 * main-checkout-lock.mjs's own header: "two concurrent writers racing this
 * checkout's own `.git/index`"), and every `repoRoot`-touching git call this
 * module makes (`worktree add`, `branch`) already ran before this function
 * is ever called — so releasing right here, mid-function, is provably safe
 * regardless of which caller passes the callback. `createDetachedMergeWorktree`
 * below never passes one: that call site's own lock hold
 * (`withMergeTargetSlot`, merge.mjs) already has a working heartbeat, so it
 * has no TTL-starvation gap to close and stays byte-identical.
 */
function finishWorktreeSetup(worktreePath, branch, { beforeProvision } = {}) {
  // `.fgos/` (ADR0020): since `.fgos/` is git-tracked in this repo, a bare
  // checkout would carry a snapshot frozen at fork time — stale the moment
  // main gets another uncommitted event, and a live escape hatch into the
  // shared store if it were symlinked instead (rejected, ADR0020). The
  // worker running in this worktree has no legitimate reason to read or
  // write `.fgos/` at all (`0005`: the runner is the sole writer, always
  // against `repoRoot`), so any checked-out copy is removed outright — not
  // shared, not synced. `mergeRunnerItem` (merge.mjs) is the trusted-side
  // backstop if a worker commits a fresh `.fgos/` of its own anyway.
  try {
    fs.rmSync(path.join(worktreePath, '.fgos'), { recursive: true, force: true });
  } catch (err) {
    throw new WorktreeError(`removing checked-out .fgos in worktree "${worktreePath}" failed: ${err.message}`, {
      branch,
      worktreePath,
    });
  }

  // A symlink to repoRoot's node_modules was considered and rejected here
  // (tsk-2vd D2): instant and no network, but only ever matches whatever
  // repoRoot itself has installed — a worktree whose own package.json
  // declares a dependency repoRoot hasn't installed yet (exactly the
  // scenario that exposed this whole gap: a branch merging in a new
  // dependency before that merge lands on repoRoot's own default branch)
  // would still hit ERR_MODULE_NOT_FOUND. provisionDependencies installs
  // for THIS worktree's own declared dependencies instead, correct at the
  // cost of the install itself.
  beforeProvision?.();
  provisionDependencies(worktreePath);
}

/**
 * Create (or reuse, see module doc) an isolated worktree for work item `id`
 * inside `repoRoot`. `opts.beforeProvision` (tsk-1mn, optional): forwarded
 * verbatim to `finishWorktreeSetup` — see that function's own doc for what
 * it's for and why the seam is safe.
 *
 * Always allocates a fresh temp directory for the
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
  let relocated = false;
  if (reused) {
    try {
      relocated = relocateOrphanedCheckout(repoRoot, branch, worktreePath).relocated;
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
  if (!relocated) {
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
  }

  // tsk-4yv: by this point `git worktree add` has already succeeded (or the
  // reuse/relocate path above already reattached), so `worktreePath` is a
  // REGISTERED worktree, unlike the two catch blocks above which only ever
  // run before registration -- a bare fs.rmSync here would leave git's own
  // `.git/worktrees/<name>/` bookkeeping dangling, a broken entry future
  // `git worktree` calls would trip over. `finishWorktreeSetup` (the
  // `.fgos/` strip, or `provisionDependencies`'s `npm ci`/`npm install`) can
  // throw for real (a permissions error, an npm registry flake) -- nothing
  // downstream of this call ever cleaned that up before, so a checkout
  // stayed registered and on disk indefinitely, accumulating with every
  // repeated flake. `removeWorktree`'s own `--force` mirrors the other
  // cleanup attempts in this function: best-effort, swallowed if it itself
  // fails, so a cleanup failure never masks the real error the caller needs
  // to see.
  try {
    finishWorktreeSetup(worktreePath, branch, { beforeProvision: opts.beforeProvision });
  } catch (err) {
    try {
      removeWorktree(repoRoot, worktreePath, { force: true });
    } catch {
      // best-effort — see comment above.
    }
    throw err;
  }

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
 * The commit a reattached claim worktree's own files/index are ACTUALLY
 * synced to — never `git -C worktreePath rev-parse HEAD` (tsk-2cd): `HEAD`
 * is a symbolic ref that resolves live through the branch it's checked out
 * on, so once that branch has been force-moved from elsewhere (`git branch
 * -f`, the mechanism `withMergeEphemeralWorktree` below uses to land a
 * merge — see its own doc comment), `rev-parse HEAD` immediately reports
 * the NEW tip even though the worktree's actual files/index were never
 * touched. The worktree's own PER-WORKTREE `HEAD` reflog is the right
 * signal instead: it only gains an entry when a real operation (checkout,
 * commit, reset) runs FROM INSIDE this specific worktree, so its most
 * recent entry survives an external `git branch -f` on the branch itself
 * untouched (empirically confirmed, `docs/history/root-worktree-drift-
 * after-child-merge/plan.md`'s Approach section). Returns `null` when the
 * reflog is empty or unreadable — the caller fails closed on that, never
 * assumes a sync point it could not actually read.
 */
function lastSyncedCommit(repoRoot, worktreePath) {
  let output;
  try {
    output = git(repoRoot, ['-C', worktreePath, 'reflog', 'show', 'HEAD', '-n', '1', '--format=%H']).trim();
  } catch {
    return null;
  }
  return output || null;
}

/**
 * Whether `worktreePath` has any real uncommitted change relative to
 * `lastSynced` — deliberately NOT `isCheckoutDirty` above (tsk-2cd):
 * `isCheckoutDirty` compares against live `HEAD`, which after an external
 * `git branch -f` no longer reflects what this worktree's files were last
 * synced to, so it would report the drift itself as "dirty" (index still
 * holds `lastSynced`'s tree, HEAD now names a different commit) even when
 * nothing was actually edited. Two checks against `lastSynced` instead:
 * `git diff --quiet` for already-tracked files (catches modified/deleted/
 * staged-new tracked content), plus a plain `--porcelain` scan for `??`
 * lines for untracked files (`git diff <commit>` never reports those,
 * regardless of which commit it's compared against). Fails closed (dirty)
 * on an unreadable status, same stance `isCheckoutDirty` already takes.
 */
function isDirtyRelativeToSync(repoRoot, worktreePath, lastSynced) {
  try {
    git(repoRoot, ['-C', worktreePath, 'diff', '--quiet', lastSynced, '--', ':!.fgos']);
  } catch {
    return true;
  }
  let status;
  try {
    status = git(repoRoot, ['-C', worktreePath, 'status', '--porcelain', '--', ':!.fgos']);
  } catch {
    return true;
  }
  return status.split('\n').some((line) => line.startsWith('??'));
}

/**
 * Resync a reattached claim worktree to its branch's current tip when safe
 * (tsk-2cd, `docs/history/root-worktree-drift-after-child-merge/CONTEXT.md`
 * D1/D3): `approve`'s leaf→root merge lands via a plain ref update from a
 * DETACHED ephemeral checkout (`withMergeEphemeralWorktree` below) — it
 * never touches any OTHER worktree already checked out on that branch, so
 * a long-lived claim worktree (this function's own caller,
 * `createClaimWorktree`'s reattach path) can silently fall behind: the
 * branch has advanced, but this worktree's files/index stay exactly where
 * they were the last time something ran inside it.
 *
 * Auto-resyncs (`git reset --hard <branchTip>`) only when BOTH hold: the
 * worktree's own last-synced commit is a proven ancestor of the branch's
 * current tip (`git merge-base --is-ancestor` — no commit would be lost),
 * and the worktree has no real uncommitted changes relative to that same
 * last-synced commit. Refuses loudly otherwise — never resets blind, the
 * same discipline `docs/how-to/safely-reset-the-main-checkout.md` already
 * documents for the main checkout, applied here to a claim worktree
 * instead (a different protected target — this stays its own guard, not a
 * reuse of `main-checkout-reset-guard.mjs`). A worktree already at its
 * branch's tip is a no-op before either check runs, so the ordinary
 * dirty-but-not-behind reattach (`createClaimWorktree`'s own reattach
 * exists for exactly this — a session resuming its own in-progress work)
 * is completely unaffected.
 */
export function resyncClaimWorktree(repoRoot, worktreePath, branch) {
  const lastSynced = lastSyncedCommit(repoRoot, worktreePath);
  if (!lastSynced) {
    throw new WorktreeError(
      `refusing to resync claim worktree "${worktreePath}" on "${branch}" — could not read its own HEAD reflog to determine what commit it was last synced to. Inspect "${worktreePath}" by hand before claiming "${branch}" again.`,
      { branch, worktreePath },
    );
  }

  const branchTip = git(repoRoot, ['rev-parse', branch]).trim();
  if (lastSynced === branchTip) return { resynced: false };

  let isAncestor = true;
  try {
    git(repoRoot, ['merge-base', '--is-ancestor', lastSynced, branchTip]);
  } catch {
    isAncestor = false;
  }

  if (!isAncestor) {
    throw new WorktreeError(
      `refusing to resync claim worktree "${worktreePath}" on "${branch}" — its last-synced commit (${lastSynced}) is not an ancestor of the branch's current tip (${branchTip}), so a reset would risk losing commits. Inspect "${worktreePath}" and reconcile by hand before claiming "${branch}" again.`,
      { branch, worktreePath, lastSynced, branchTip },
    );
  }

  if (isDirtyRelativeToSync(repoRoot, worktreePath, lastSynced)) {
    throw new WorktreeError(
      `refusing to resync claim worktree "${worktreePath}" on "${branch}" — its last-synced commit (${lastSynced}) is behind the branch's current tip (${branchTip}, likely from a child merge landing since this worktree was last synced) and the tree has uncommitted changes. Commit or discard the work in "${worktreePath}" before claiming "${branch}" again — never auto-reset over uncommitted work. Not sure whether this is real work or a stale artifact left over from the drift? See docs/how-to/tell-a-stale-worktree-index-apart-from-real-uncommitted-work.md for the diagnostic recipe.`,
      { branch, worktreePath, lastSynced, branchTip },
    );
  }

  git(repoRoot, ['-C', worktreePath, 'reset', '--hard', branchTip]);
  stripFgosAfterReset(worktreePath, branch);
  return { resynced: true, from: lastSynced, to: branchTip };
}

/**
 * tsk-1d7 (docs/history/stale-worktree-index-guard/CONTEXT.md D3): a plain
 * `reset --hard` checks out whatever `.fgos/` the branch tip has tracked,
 * resurrecting a stale snapshot in a worktree in violation of ADR0020
 * (verified directly) -- the same strip `finishWorktreeSetup` already
 * performs right after a fresh `git worktree add`, needed again after any
 * later `reset --hard`. Shared by `resyncClaimWorktree` above and
 * `resyncWorktree` below. Only the strip, never the rest of
 * `finishWorktreeSetup` (dependency provisioning is out of scope for a
 * resync, an unrelated side effect this must not add).
 */
function stripFgosAfterReset(worktreePath, branch) {
  try {
    fs.rmSync(path.join(worktreePath, '.fgos'), { recursive: true, force: true });
  } catch (err) {
    throw new WorktreeError(`removing checked-out .fgos in resynced worktree "${worktreePath}" failed: ${err.message}`, {
      branch,
      worktreePath,
    });
  }
}

/**
 * The repair verb behind `fgos resync-worktree` (tsk-1d7, docs/history/
 * stale-worktree-index-guard/CONTEXT.md D3) -- fixes exactly the failure
 * `.githooks/pre-commit`'s own stale-index guard (D2) detects and refuses:
 * a worktree whose branch ref was force-moved from outside (e.g. `approve`'s
 * leaf->root merge) while this worktree still holds files/index at the OLD
 * tree. Unlike `resyncClaimWorktree` above -- which REFUSES when the
 * worktree has any uncommitted change, because that function exists for the
 * routine "clean reattach" case -- this verb is invoked precisely because
 * the worktree has real staged work worth carrying forward (the commit that
 * was about to happen), so it captures that staged content as a patch
 * BEFORE resetting, then reapplies it after.
 *
 * Never auto-invoked by the hook itself (D2: the hook only detects and
 * refuses, printing the command to run this). A caller runs this by hand
 * (or a session runs it on the user's behalf) once notified.
 */
export function resyncWorktree(repoRoot, worktreePath, branch) {
  // tsk-jg4: an earlier run of THIS function can be killed in the window
  // between the `reset --hard` below (step 2) and the patch reapply
  // completing (step 4) -- the worktree ends up reset to the branch tip
  // (a real reflog entry, so the NEXT run's own `lastSyncedCommit` check
  // below reads "already in sync" and does nothing) while the staged
  // patch it never got to reapply is still sitting on disk, orphaned and
  // unmentioned. Detect that BEFORE anything else touches the worktree --
  // same signal, same refusal shape the real-conflict path below already
  // uses (a patch file on disk IS the actionable thing to point at), just
  // checked proactively instead of only encountered reactively.
  const gitCommonDir = git(repoRoot, ['rev-parse', '--path-format=absolute', '--git-common-dir']).trim();
  const patchDir = path.join(gitCommonDir, 'fgos-resync-patches');
  const branchPrefix = `${branch.replace(/\//g, '-')}-`;
  let orphanedPatches = [];
  try {
    orphanedPatches = fs.readdirSync(patchDir).filter((name) => name.startsWith(branchPrefix) && name.endsWith('.patch'));
  } catch {
    // patchDir not created yet -- nothing to orphan.
  }
  if (orphanedPatches.length > 0) {
    const orphanedPaths = orphanedPatches.map((name) => path.join(patchDir, name));
    throw new WorktreeError(
      `resync-worktree: refusing "${worktreePath}" on "${branch}" — a prior resync-worktree run left ${orphanedPaths.length === 1 ? 'a patch' : 'patches'} behind at ${orphanedPaths.map((p) => `"${p}"`).join(', ')}, most likely from being interrupted between its own reset and reapply. Inspect ${orphanedPaths.length === 1 ? 'it' : 'them'} by hand — the worktree may already be reset to the branch tip with this content never reapplied — then remove the file(s) before resyncing again.`,
      { branch, worktreePath, orphanedPaths },
    );
  }

  const lastSynced = lastSyncedCommit(repoRoot, worktreePath);
  if (!lastSynced) {
    throw new WorktreeError(
      `resync-worktree: could not read "${worktreePath}"'s own HEAD reflog to determine what commit it was last synced to. Inspect "${worktreePath}" by hand.`,
      { branch, worktreePath },
    );
  }

  const branchTip = git(repoRoot, ['rev-parse', branch]).trim();
  if (lastSynced === branchTip) {
    return { resynced: false, reason: 'already-in-sync' };
  }

  let isAncestor = true;
  try {
    git(repoRoot, ['merge-base', '--is-ancestor', lastSynced, branchTip]);
  } catch {
    isAncestor = false;
  }
  if (!isAncestor) {
    throw new WorktreeError(
      `resync-worktree: refusing "${worktreePath}" on "${branch}" — its last-synced commit (${lastSynced}) is not an ancestor of the branch's current tip (${branchTip}), so a reset would risk losing commits. Inspect "${worktreePath}" and reconcile by hand.`,
      { branch, worktreePath, lastSynced, branchTip },
    );
  }

  // Stray dirt beyond what's staged (untracked, or unstaged changes to a
  // tracked file) is refused outright rather than guessed into a merge
  // (D3) -- only STAGED content is what this repair carries forward.
  // Porcelain column 2 (working-tree status) is ' ' for a purely-staged
  // entry; anything else means real dirt outside the index.
  const status = git(repoRoot, ['-C', worktreePath, 'status', '--porcelain', '--', ':!.fgos']);
  const strayLines = status.split('\n').filter((line) => line !== '' && line[1] !== ' ');
  if (strayLines.length > 0) {
    throw new WorktreeError(
      `resync-worktree: refusing "${worktreePath}" on "${branch}" — stray uncommitted changes beyond what's staged (${strayLines.join(', ')}). Commit, stage, or discard them before resyncing; never guessing a merge over stray dirt.`,
      { branch, worktreePath, strayLines },
    );
  }

  // 1. Extract the staged content as a patch BEFORE touching anything,
  // saved under --git-common-dir -- never the worktree's own --git-dir,
  // which fgOS can force-remove later, losing the only copy (D3).
  // `gitCommonDir`/`patchDir` already resolved above, by the orphaned-
  // patch pre-check (tsk-jg4).
  const patch = git(repoRoot, ['-C', worktreePath, 'diff', '--cached', '--binary', lastSynced]);
  fs.mkdirSync(patchDir, { recursive: true });
  const patchPath = path.join(patchDir, `${branch.replace(/\//g, '-')}-${Date.now()}.patch`);
  fs.writeFileSync(patchPath, patch);

  // 2. Reset to the branch's real tip.
  git(repoRoot, ['-C', worktreePath, 'reset', '--hard', branchTip]);

  // 3. Re-strip .fgos/ -- reset --hard always reintroduces it (D3).
  stripFgosAfterReset(worktreePath, branch);

  if (patch.trim() === '') {
    // Nothing was staged -- nothing to reapply.
    fs.rmSync(patchPath, { force: true });
    return { resynced: true, from: lastSynced, to: branchTip, reapplied: false };
  }

  // 4. Reapply the patch, merging both index and working tree in one step
  // -- never `--3way`, which was tested to leave unmerged/conflict state
  // (D3). A real content conflict refuses and preserves the patch file so
  // a person can review/apply it by hand.
  try {
    git(repoRoot, ['-C', worktreePath, 'apply', '--index', patchPath]);
  } catch (err) {
    throw new WorktreeError(
      `resync-worktree: "${worktreePath}" was reset to "${branchTip}" but reapplying its staged changes hit a real conflict — the patch is preserved at "${patchPath}" for manual review. ${err.message}`,
      { branch, worktreePath, patchPath },
    );
  }

  fs.rmSync(patchPath, { force: true });
  return { resynced: true, from: lastSynced, to: branchTip, reapplied: true };
}

/**
 * claim-isolate: the worktree returned here IS the work — it outlives this
 * call, and its owning claim (`claim-port.mjs`'s `claimWork`) tears it down
 * later at return/reject time, never inline here.
 *
 * REATTACH (tsk-65n): a claim whose `fgw/<id>` checkout is still standing
 * gets that same checkout back, resynced to the branch's current tip when
 * that's provably safe (tsk-2cd: `resyncClaimWorktree` above — the branch
 * may have advanced past this checkout via a child merge while this
 * worktree sat claimed-but-anchored; see that function's own doc for why
 * "untouched" was the bug, not the fix). The case is routine rather than
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
    if (existing) {
      resyncClaimWorktree(repoRoot, existing, branch);
      return { path: existing, branch, reused: true };
    }
    // tsk-55p: no LIVE checkout to reattach to, but the branch ref already
    // exists -- the decompose-time bare-ref case (createBranchRef, D17),
    // never yet picked. createWorktree's own reuse path below checks this
    // branch out exactly as it stands, ignoring opts.baseRef by design (its
    // own docblock) -- so a branch minted long before this pick, from a
    // base that has since moved, would stand on that stale tip with no
    // refresh at all. refreshUnstartedBranch closes that gap HERE, before
    // the checkout is created, not inside createWorktree itself (shared
    // with the runner's own retry-without-self-collision dispatch path,
    // which must stay byte-identical).
    const refresh = opts.baseRef ? refreshUnstartedBranch(repoRoot, branch, opts.baseRef) : undefined;
    return { ...createWorktree(repoRoot, id, opts), refresh };
  }
  return createWorktree(repoRoot, id, opts);
}

/**
 * Refreshes `branch` onto `targetRef`'s current tip, but ONLY when `branch`
 * provably has no commits of its own yet (tsk-55p, closing the decompose-
 * to-pick staleness gap: `fgw/<id>` is normally minted at decompose time,
 * `createBranchRef(..., baseRef: 'main')`, then sits untouched until
 * someone picks it -- by which point `main`/its parent may have moved
 * considerably).
 *
 * "No commits of its own" is decided the same way D2 requires everywhere
 * else in this module: `branch`'s tip must be its own merge-base with
 * `targetRef` -- i.e. an ancestor of it. That is the literal "compare the
 * branch's tip to its own base" test, not "does a worktree exist for it" --
 * and it fails CLOSED: any error probing the relationship (a corrupt ref,
 * a detached/unreachable commit) is treated as "has its own commits, do not
 * touch", never as license to refresh. Because the check already proved
 * `branch` is an ancestor of `targetRef`, the refresh itself is a provable
 * fast-forward -- the degenerate, always-safe case of merge-target-into-
 * branch (D2: never rebase a branch with commits of its own; there are
 * none here to rewrite).
 *
 * `checkoutPath`, when supplied, refreshes via a real `merge --ff-only`
 * inside that checkout instead of a bare `git branch -f` -- git itself
 * refuses either form if it would discard anything, so both refusal paths
 * downgrade to `{refreshed: false, reason: 'refresh-refused'}` rather than
 * failing the claim outright.
 */
export function refreshUnstartedBranch(repoRoot, branch, targetRef, checkoutPath = null) {
  const branchTip = git(repoRoot, ['rev-parse', branch]).trim();
  const targetTip = git(repoRoot, ['rev-parse', targetRef]).trim();

  let ahead = 0;
  let behind = 0;
  try {
    const counts = git(repoRoot, ['rev-list', '--left-right', '--count', `${targetRef}...${branch}`]).trim();
    const [behindStr, aheadStr] = counts.split(/\s+/);
    const parsedBehind = Number.parseInt(behindStr, 10);
    const parsedAhead = Number.parseInt(aheadStr, 10);
    behind = Number.isFinite(parsedBehind) ? parsedBehind : 0;
    ahead = Number.isFinite(parsedAhead) ? parsedAhead : 0;
  } catch {
    // Rare ref race (e.g. a ref deleted between the two rev-parse calls
    // above and this rev-list) -- report zero drift rather than throwing;
    // the ancestor check right below is the real safety gate, not this.
  }

  if (branchTip === targetTip) {
    return { target: targetRef, ahead, behind, refreshed: false, reason: 'already-current' };
  }

  let unstarted = false;
  try {
    git(repoRoot, ['merge-base', '--is-ancestor', branch, targetRef]);
    unstarted = true;
  } catch {
    unstarted = false;
  }
  if (!unstarted) {
    return { target: targetRef, ahead, behind, refreshed: false, reason: 'own-commits' };
  }

  try {
    if (checkoutPath) {
      git(repoRoot, ['-C', checkoutPath, 'merge', '--ff-only', targetTip]);
    } else {
      git(repoRoot, ['branch', '-f', branch, targetTip]);
    }
  } catch (err) {
    return { target: targetRef, ahead, behind, refreshed: false, reason: 'refresh-refused', detail: err.message };
  }
  return { target: targetRef, ahead, behind, refreshed: true, from: branchTip, to: targetTip };
}

/**
 * merge-ephemeral: a worktree created ONLY to stage one merge (approve's
 * leaf-into-root merge, catchup's target-into-item merge) against a branch
 * that already exists — `opts.baseRef` is never needed here (createWorktree's
 * branch-reuse path ignores it) — and force-removed unconditionally once
 * `fn` settles, whether it returns or throws. Replaces the identical
 * try/finally both call sites used to write out by hand.
 */
/**
 * The checkout `withMergeEphemeralWorktree` uses for `id`'s branch —
 * detached at the branch's current tip COMMIT, never the branch ref
 * itself. Git only refuses a second checkout of the same BRANCH; a
 * detached checkout of the same commit is unrestricted, so this never
 * inspects, moves, or removes any existing checkout of the branch —
 * including one a person is deliberately keeping open (`ExitWorktree`
 * "keep"), clean or dirty, live session or not (docs/history/
 * merge-worktree-reclaim-clobbers-kept-checkout/CONTEXT.md D1). This
 * sidesteps the conflict entirely rather than detecting and refusing it —
 * `createWorktree`'s own reuse/relocate path above stays exactly as-is
 * for its other callers (`pick`/`take` reclaiming a session's own
 * abandoned checkout, a genuinely different, intentional use case
 * CONTEXT.md D1 explicitly leaves untouched).
 *
 * `fgw/<id>` is normally created EARLY as a ref only, via `createBranchRef`
 * (D17, `loop.mjs`'s own leaf-dispatch call) — but a root only ever driven
 * by a live session (never through the runner's own dispatch loop) never
 * gets that early call, so the branch can genuinely not exist yet the
 * first time a merge needs it (docs/history/
 * tsk-6ch-merge-worktree-branch-fallback/CONTEXT.md). Falling back to
 * `createBranchRef` here — idempotent, same early-creation step
 * `loop.mjs` already uses — replaces that missing step instead of crashing
 * the merge outright. No explicit `baseRef` (tsk-386): `createBranchRef`'s
 * own default already resolves through `detectTrunk(repoRoot)`, never a
 * hardcoded `'main'` — a host repo whose trunk is `master` would otherwise
 * fail this exact fallback outright.
 */
function createDetachedMergeWorktree(repoRoot, id) {
  const branch = branchNameFor(id);
  if (!branchExists(repoRoot, branch)) {
    createBranchRef(repoRoot, id);
  }
  const startCommit = git(repoRoot, ['rev-parse', branch]).trim();
  const baseDir = path.join(os.tmpdir(), 'fgos-worktrees');
  fs.mkdirSync(baseDir, { recursive: true });
  const worktreePath = fs.mkdtempSync(path.join(baseDir, `${branch.replace(/\//g, '-')}-merge-`));

  try {
    git(repoRoot, ['worktree', 'add', '--detach', worktreePath, startCommit]);
  } catch (err) {
    try {
      fs.rmSync(worktreePath, { recursive: true, force: true });
    } catch {
      // best-effort cleanup of the empty dir mkdtemp created; the real
      // failure below is what the caller needs to see.
    }
    throw new WorktreeError(`git worktree add --detach failed for "${branch}" at ${startCommit}: ${err.message}`, {
      branch,
      worktreePath,
    });
  }

  // tsk-4yv: same reasoning as createWorktree's own identical wrap above --
  // `git worktree add --detach` has already succeeded by this point, so a
  // `finishWorktreeSetup` failure (the `.fgos/` strip, or
  // `provisionDependencies`'s `npm ci`/`npm install`) must force-remove the
  // now-registered worktree before rethrowing, or it leaks: this is
  // specifically the DETACHED case (a `withMergeEphemeralWorktree` call
  // during `approve`), which `reclaimOrphanedCheckout`/`findCheckoutPath`
  // (both branch-keyed) never reclaim, unlike a branch-attached
  // `createWorktree` checkout, which mostly self-heals via the
  // relocate/reattach paths. Left unfixed, a repeated npm registry flake
  // during `approve` accumulates full checkouts under tmp indefinitely.
  try {
    finishWorktreeSetup(worktreePath, branch);
  } catch (err) {
    try {
      removeWorktree(repoRoot, worktreePath, { force: true });
    } catch {
      // best-effort — a failed cleanup here must never mask the real
      // finishWorktreeSetup failure the caller needs to see.
    }
    throw err;
  }

  // Racy-git stat-cache guard: immediately after this fresh checkout, git's
  // index can still carry a stale mtime for a path whose on-disk content
  // already matches HEAD (mtime granularity can't distinguish "just checked
  // out" from "modified microseconds later" under heavy concurrent I/O from
  // sibling worktrees). A `git merge` attempted this soon can then refuse an
  // untouched path outright with "not uptodate. Cannot merge." even though
  // the path is genuinely clean — reproduced directly on a real merge
  // branch: a path the branch never touched since its merge-base failed
  // this way 3/3 times, with the working tree confirmed byte-equal to HEAD
  // immediately beforehand via debug instrumentation. `git update-index
  // --refresh` forces a real content re-check and clears the stale cache
  // entries. Its own exit code is ignored: `.fgos/`'s deliberate unstaged
  // deletion above always makes it report "needs update" for those paths,
  // which is expected, not a real failure — this call is best-effort
  // stat-cache hygiene, never a gate.
  try {
    execFileSync('git', ['update-index', '-q', '--refresh'], { cwd: worktreePath, encoding: 'utf8', shell: false, stdio: 'ignore' });
  } catch {
    // best-effort — see comment above.
  }

  return { path: worktreePath, branch, startCommit };
}

export async function withMergeEphemeralWorktree(repoRoot, id, fn) {
  const branch = branchNameFor(id);
  const worktree = createDetachedMergeWorktree(repoRoot, id);
  try {
    const result = await fn(worktree);
    // fn committed on top of startCommit (a successful merge) -- land it on
    // the real branch via a plain ref update, which needs no exclusive
    // checkout, instead of the ephemeral checkout ever having BEEN the real
    // branch. fn that only read/verified without committing (conflict,
    // verify-fail, already-caught-up) leaves HEAD at startCommit, so no
    // ref move happens -- the real branch is untouched, same as today.
    const endCommit = git(worktree.path, ['rev-parse', 'HEAD']).trim();
    if (endCommit !== worktree.startCommit) {
      // CAS GUARD (tsk-46a, docs/history/merge-ephemeral-branch-force-race/
      // CONTEXT.md D1; hardened tsk-18k): `startCommit` was captured back in
      // createDetachedMergeWorktree, before `fn` ran and before any lock was
      // held over THIS step -- a second concurrent call for the same `id`
      // (e.g. two leaf approves into the same fgw/<rootId>) can land its own
      // ref update in between, moving `branch` out from under this call
      // without this call ever knowing.
      //
      // `git update-ref <ref> <new> <old>` is git's own atomic
      // compare-and-swap on the ref: it refuses the write outright
      // (non-zero exit, ref left completely untouched) unless the ref's
      // CURRENT value still equals `<old>` at the exact moment of the
      // write -- there is no separate read-then-write window left for a
      // second caller to land in between. The prior shape here was a plain
      // `git rev-parse` (read) followed by an unconditional `git branch -f`
      // (write): two genuinely concurrent callers could BOTH pass that read
      // before either one wrote, letting the second `branch -f` silently
      // discard whichever commit the first one had just landed, with no
      // error and no conflict. That window is exactly what tsk-18k's own
      // bug (the merge-target-slot lock's release/renew misidentifying a
      // sibling's live lock as its own after a TTL-starvation reclaim,
      // fixed above in `withMergeTargetSlot`) could put two callers through
      // at once -- confirmed still possible even after that identity fix,
      // since a TTL-starvation reclaim can happen while the original
      // holder's own `fn()` (this whole merge) is still running, unaware
      // its lock was reclaimed. D2 still holds: fail loudly here, never
      // retry automatically -- the caller (merge-loop, or a person
      // re-running `fgos approve`) owns retrying against the new tip.
      try {
        git(repoRoot, ['update-ref', `refs/heads/${branch}`, endCommit, worktree.startCommit]);
      } catch {
        // update-ref's own error already named the mismatch on stderr; read
        // the branch's actual current tip here only to report it back in
        // the same message/field shape callers and tests already expect --
        // this read is diagnostic, never the guard itself (the guard
        // already ran, atomically, in the update-ref call above).
        const liveTip = git(repoRoot, ['rev-parse', branch]).trim();
        throw new WorktreeError(
          `refusing to force-move "${branch}" to ${endCommit} -- its tip changed from ${worktree.startCommit} to ${liveTip} since this merge started (a concurrent merge into the same branch already landed). Retry against the new tip instead of overwriting it.`,
          { branch, expectedTip: worktree.startCommit, actualTip: liveTip, endCommit },
        );
      }
    }
    return result;
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
