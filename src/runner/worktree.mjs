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
import { createHash } from 'node:crypto';
import { StoreError } from '../state/store.mjs';
import { createLockScope, HolderLockError, acquireSync } from '../holder-lock/index.mjs';
import { resolveStateRoot } from '../holder-lock/state-root.mjs';
import { addWorktreeSync } from './repo-locks.mjs';
import crypto from 'node:crypto';
import { gitPortOptions, createGitInspect } from '../git/inspect.mjs';
import { createGitWorktree } from '../git/worktree.mjs';
import { createGitRefs } from '../git/refs.mjs';
import { createGitRemote } from '../git/remote.mjs';
import { createGitSafeRestore } from '../git/restore.mjs';
export const inspectGit = repo => createGitInspect(gitPortOptions(repo));
const worktreePort = repo => { const options = gitPortOptions(repo, { mutation: true }); return createGitWorktree({ ...options, repoPath: options.trustedMain }); };
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
function checkoutPathIn(rows, branch) {
  const row = rows.find(row => row.branch === `refs/heads/${branch}`);
  return row ? realpathOrSelf(Buffer.from(row.path).toString('utf8')) : null;
}
export function checkoutPathForBranch(repo, branch) { return checkoutPathIn(gitWorktrees(repo), branch); }

export function compareCommits(repo, left, right) {
  return inspectGit(repo).compareCommits({ left: resolveRefSha(repo, left), right: resolveRefSha(repo, right) });
}
function checkoutFacts(repo, worktree, revision) { return inspectGit(worktree).checkoutFacts({ revision: revision ?? currentHead(worktree) }); }
function ancestorOf(repo, ancestor, descendant) { return inspectGit(repo).ancestry({ ancestor, descendant }).answer === 'yes'; }
export function deleteBranchRef(repo, branch, expected = resolveRefSha(repo, branch)) {
  return refsPort(repo).deleteRef({ name: `refs/heads/${branch}`, expected, operationId: operationId() });
}
function pruneWorktrees(repo, id) {
  if (!id) throw new WorktreeError('worktree prune requires a recorded removal operation', { reason: 'worktree-prune-remove-evidence-required' });
  return worktreePort(repo).prune({ operationId: id });
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

import { readConfig } from '../config/facade.mjs';
import { statusPaths, inspectEntries, inspectPath } from '../util/git-paths.mjs';
import { uniqueTmpTag } from '../util/unique-tmp-tag.mjs';

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
 * Returns true when it installed, so a caller knows `node_modules` is its.
 */
export function provisionDependencies(worktreePath) {
  const packageJsonPath = path.join(worktreePath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) return false;
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const hasDeps = Object.keys(pkg.dependencies ?? {}).length > 0 || Object.keys(pkg.devDependencies ?? {}).length > 0;
  if (!hasDeps) return false;
  const hasLockfile = fs.existsSync(path.join(worktreePath, 'package-lock.json'));
  // On Windows, npm is a .cmd shim, not a directly-executable PE binary --
  // execFileSync without a shell fails ENOENT before npm ever runs.
  execFileSync('npm', [hasLockfile ? 'ci' : 'install'], {
    cwd: worktreePath,
    stdio: 'ignore',
    shell: process.platform === 'win32',
  });
  return true;
}

// Generous ceiling for one setup command (a cold compile can take minutes on
// a loaded machine) -- only there so a hung command can never wedge a claim
// or approve forever.
const WORKTREE_SETUP_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Run the project's configured `worktreeSetup.commands` (read from
 * `repoRoot`'s shared config) inside `worktreePath`, in order, after
 * `provisionDependencies`. Covers what a fresh checkout lacks beyond
 * declared npm dependencies -- e.g. a compiled binary the test suite
 * expects (`cargo build --release`). No-ops when nothing is configured.
 * Each command runs through the shell with `FGOS_REPO_ROOT` set to the
 * main checkout, so a project can point at shared caches from there.
 * Throws WorktreeError (with the command's output) on the first failure.
 */
export function runWorktreeSetupCommands(worktreePath, repoRoot) {
  // `command` values: the door reads them from the main checkout whatever root is passed, so a worker's edit to its own worktree's config never changes what runs.
  const commands = readConfig({ projectRoot: repoRoot, sections: ['worktreeSetup'] }).value.worktreeSetup?.commands ?? [];
  for (const command of commands) {
    try {
      execFileSync(command, {
        cwd: worktreePath,
        shell: true,
        // Like verify commands, these are explicitly configured consumer commands.
        [Symbol.for('fgos.git.consumer-command')]: true,
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: WORKTREE_SETUP_TIMEOUT_MS,
        env: { ...process.env, FGOS_REPO_ROOT: repoRoot },
      });
    } catch (err) {
      const output = `${err.stdout ?? ''}${err.stderr ?? ''}`.trim();
      throw new WorktreeError(`worktree setup command failed in "${worktreePath}": ${command}${output ? `\n${output}` : ''}`, {
        worktreePath,
        command,
      });
    }
  }
}


// The provisioning record: what `provisionWorktree` placed in one checkout,
// so `fgos worktree remove` can take back exactly those bytes before the Git
// port's clean check, and nothing else. One file per checkout, keyed by its
// real path, under the machine state root; Git never reads it.
const PROVISIONING_CONTRACT = 'worktree-provisioning.v1';

/** The state root a checkout keeps its provisioning record under. */
export function provisioningStateRoot() {
  return resolveStateRoot().stateRoot;
}

function provisioningRecordPath(stateRoot, worktreePath) {
  const key = createHash('sha256').update(realpathOrSelf(worktreePath)).digest('hex');
  return path.join(stateRoot, 'worktree-provisioning', `${key}.json`);
}

// Untracked and ignored paths, a wholly untracked or ignored directory collapsed
// to `dir/`. Git also names an ignored path inside a collapsed untracked
// directory; the directory already covers it.
function untrackedEntries(worktreePath) {
  const inspect = inspectGit(worktreePath);
  const listed = inspectEntries((page) => inspect.status({ ...page, untracked: 'normal', ignored: true }))
    .filter((entry) => entry.untracked || entry.ignored)
    .map((entry) => inspectPath(entry.path));
  const dirs = listed.filter((rel) => rel.endsWith('/'));
  return listed.filter((rel) => !dirs.some((dir) => rel !== dir && rel.startsWith(dir)));
}

function fileDigest(file) {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

// Record `rel` and everything under it: a file by its digest, a symlink by its
// target. Any other kind is left unrecorded, so remove leaves it in place.
function recordPlaced(worktreePath, rel, placed) {
  const abs = path.join(worktreePath, rel);
  const st = fs.lstatSync(abs);
  if (st.isSymbolicLink()) placed.push({ path: rel, kind: 'symlink', target: fs.readlinkSync(abs) });
  else if (st.isFile()) placed.push({ path: rel, kind: 'file', sha256: fileDigest(abs) });
  else if (st.isDirectory()) {
    placed.push({ path: rel, kind: 'dir' });
    for (const name of fs.readdirSync(abs).sort()) recordPlaced(worktreePath, path.join(rel, name), placed);
  }
}

/**
 * Provision a checkout the Git port has just created (dependency install,
 * then the project's `worktreeSetup.commands`) and record what that placed:
 * every new untracked or ignored path, a file with its content digest, and
 * the dependency directory `provisionDependencies` installed declared as
 * regenerable. The record is written even when a step fails, so a half
 * provisioned checkout can still be removed. `disposable` marks a checkout
 * fgOS made only to run a check in: removal then takes back every untracked
 * or ignored byte there, since all of it came from provisioning or from that
 * check.
 */
export function provisionWorktree(worktreePath, repoRoot, stateRoot, { disposable = false } = {}) {
  const before = new Set(untrackedEntries(worktreePath));
  const regenerable = [];
  try {
    if (provisionDependencies(worktreePath)) regenerable.push('node_modules');
    runWorktreeSetupCommands(worktreePath, repoRoot);
  } finally {
    const placed = [];
    for (const entry of untrackedEntries(worktreePath)) {
      const rel = entry.replace(/\/$/, '');
      if (!before.has(entry) && !regenerable.includes(rel)) recordPlaced(worktreePath, rel, placed);
    }
    const { dev, ino } = fs.statSync(worktreePath);
    const file = provisioningRecordPath(stateRoot, worktreePath);
    const record = { contract: PROVISIONING_CONTRACT, worktree: realpathOrSelf(worktreePath), identity: { dev, ino }, regenerable, placed, ...(disposable ? { disposable } : {}) };
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.${uniqueTmpTag()}.tmp`;
    fs.writeFileSync(tmp, `${JSON.stringify(record, null, 2)}\n`);
    fs.renameSync(tmp, file);
  }
}

function readProvisioningRecord(file, worktreePath) {
  let record;
  try { record = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
  const { dev, ino } = fs.statSync(worktreePath);
  // A record left by another directory once at this path is not this checkout's.
  if (record?.contract !== PROVISIONING_CONTRACT || record.identity?.dev !== dev || record.identity?.ino !== ino) return null;
  return record;
}

function stillAsPlaced(abs, entry) {
  let st;
  try { st = fs.lstatSync(abs); } catch { return false; }
  if (entry.kind === 'symlink') return st.isSymbolicLink() && fs.readlinkSync(abs) === entry.target;
  return entry.kind === 'file' && st.isFile() && fileDigest(abs) === entry.sha256;
}

/**
 * Move what `provisionWorktree` placed out of `worktreePath`, into a sibling
 * directory, so the Git port judges only the checkout's own bytes. The
 * declared dependency directory moves whole; a copied file or symlink moves
 * only while it still matches the record; a directory the record names is
 * taken out once it is empty. A worker-edited copy, or any byte the record
 * does not name, stays where it is and the port refuses on it.
 * `restore()` puts everything back (the port refused); `discard()` deletes
 * the moved bytes and the record (the port removed the checkout). A record
 * marked disposable also sets aside every other untracked or ignored byte.
 * Without a record for this checkout nothing moves.
 */
function setProvisionedAside(stateRoot, worktreePath) {
  const recordFile = provisioningRecordPath(stateRoot, worktreePath);
  const record = readProvisioningRecord(recordFile, worktreePath);
  const aside = path.join(path.dirname(worktreePath), `.${path.basename(worktreePath)}.provisioned-${uniqueTmpTag()}`);
  const moved = [];
  const emptied = [];
  const restore = () => {
    for (const rel of emptied.reverse()) fs.mkdirSync(path.join(worktreePath, rel), { recursive: true });
    for (const rel of moved.reverse()) {
      fs.mkdirSync(path.dirname(path.join(worktreePath, rel)), { recursive: true });
      fs.renameSync(path.join(aside, rel), path.join(worktreePath, rel));
    }
    fs.rmSync(aside, { recursive: true, force: true });
  };
  if (!record) return { moved: 0, restore() {}, discard() {} };
  const move = (rel) => {
    fs.mkdirSync(path.dirname(path.join(aside, rel)), { recursive: true });
    fs.renameSync(path.join(worktreePath, rel), path.join(aside, rel));
    moved.push(rel);
  };
  try {
    if (record.disposable) for (const entry of untrackedEntries(worktreePath)) move(entry.replace(/\/$/, ''));
    for (const rel of record.regenerable ?? []) if (fs.existsSync(path.join(worktreePath, rel))) move(rel);
    for (const entry of record.placed ?? []) if (entry.kind !== 'dir' && stillAsPlaced(path.join(worktreePath, entry.path), entry)) move(entry.path);
    const dirs = (record.placed ?? []).filter(e => e.kind === 'dir').map(e => e.path).sort((a, b) => b.length - a.length);
    for (const rel of dirs) {
      try { fs.rmdirSync(path.join(worktreePath, rel)); emptied.push(rel); } catch (err) {
        if (err.code !== 'ENOENT' && err.code !== 'ENOTEMPTY' && err.code !== 'EEXIST') throw err;
      }
    }
  } catch (err) {
    restore();
    throw err;
  }
  return {
    moved: moved.length,
    restore,
    discard() {
      fs.rmSync(aside, { recursive: true, force: true });
      fs.rmSync(recordFile, { force: true });
    },
  };
}

/**
 * Run `remove` (one Git port removal of `worktreePath`) with what provisioning
 * placed set aside: the port judges only the checkout's own bytes, a refusal
 * puts the set-aside bytes back, and a removal deletes them with the record.
 * The one removal door for every provisioned checkout, the `fgos worktree
 * remove` verb's and the runner's own alike.
 */
export function removeProvisioned(stateRoot, worktreePath, remove) {
  const provisioned = setProvisionedAside(stateRoot, worktreePath);
  let removed;
  try {
    removed = remove();
  } catch (err) {
    provisioned.restore();
    throw err;
  }
  provisioned.discard();
  return removed;
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
  const facts = inspectGit(repoRoot).resolveRepo();
  return facts.notARepository || pathsEqual(realpathOrSelf(facts.worktreeRoot), realpathOrSelf(facts.trustedMainRoot));
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
 * look dirty regardless of real activity. Mirrors session.mjs's
 * `reclaimOrphanedSessions` (same `:!.fgos` pathspec exclusion). Fails
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
    listing = gitWorktrees(repoRoot);
  } catch (err) {
    throw new WorktreeError(`listing worktrees failed while reclaiming "${branch}": ${err.message}`, { branch });
  }

  const orphanPath = checkoutPathIn(listing, branch);
  if (!orphanPath) return { reclaimed: false, path: null };

  // REPO-ROOT GUARD (tsk-k8u D1): an orphan checkout that resolves to
  // `repoRoot` itself would force-remove the main checkout's own working
  // tree — never a genuine crash-orphan (a crash-orphan is always some
  // OTHER checkout of the branch), and destructive in a way no caller here
  // intends. Refuses the same way the dirty-checkout guard below does,
  // rather than silently reclaiming the ground the caller itself may be
  // standing on.
  if (pathsEqual(realpathOrSelf(orphanPath), realpathOrSelf(repoRoot))) {
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
  const resolvedOrphanPath = realpathOrSelf(orphanPath);
  const resolvedCallerCwd = realpathOrSelf(callerCwd);
  if (
    pathsEqual(resolvedOrphanPath, resolvedCallerCwd) ||
    pathStartsWith(resolvedCallerCwd, resolvedOrphanPath + path.sep)
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
      removeWorktree(repoRoot, orphanPath, { force: true });
    } catch (err) {
      throw new WorktreeError(
        `reclaiming orphaned checkout of "${branch}" at "${orphanPath}" failed: ${err.message}`,
        { branch, orphanPath },
      );
    }
  } else {
    try {
      worktreePort(repoRoot).prune({ path: orphanPath, operationId: operationId() });
    } catch (err) {
      throw new WorktreeError(
        `pruning stale worktree registration for "${branch}" (path already gone: "${orphanPath}") failed: ${err.message}`,
        { branch, orphanPath },
      );
    }
  }
  return { reclaimed: true, path: realpathOrSelf(orphanPath) };
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
    listing = gitWorktrees(repoRoot);
  } catch (err) {
    throw new WorktreeError(`listing worktrees failed while reclaiming "${branch}": ${err.message}`, { branch });
  }

  const orphanPath = checkoutPathIn(listing, branch);
  if (!orphanPath) return { relocated: false };

  if (!fs.existsSync(orphanPath)) {
    try {
      worktreePort(repoRoot).prune({ path: orphanPath, operationId: operationId() });
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
    withCheckoutCustody(orphanPath, (options, custody) => createGitWorktree({ ...options, repoPath: options.trustedMain }).relocate({ source: orphanPath, destination: targetPath, expectedTip: currentHead(orphanPath), operationId: operationId() }, [custody]));
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
    refsPort(repoRoot).ensureBranch({ name: `refs/heads/${branch}`, next: resolveRefSha(repoRoot, baseRef), operationId: operationId() });
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
 * below.
 *
 * Runs after `git worktree add` has returned, so it holds no repo lock:
 * the slow, synchronous `provisionDependencies` (`npm ci`/`npm install`)
 * works entirely inside `worktreePath` and never touches `repoRoot`'s index.
 */
function finishWorktreeSetup(repoRoot, worktreePath, branch) {
  // A symlink to repoRoot's node_modules was considered and rejected here
  // (tsk-2vd D2): instant and no network, but only ever matches whatever
  // repoRoot itself has installed — a worktree whose own package.json
  // declares a dependency repoRoot hasn't installed yet (exactly the
  // scenario that exposed this whole gap: a branch merging in a new
  // dependency before that merge lands on repoRoot's own default branch)
  // would still hit ERR_MODULE_NOT_FOUND. provisionDependencies installs
  // for THIS worktree's own declared dependencies instead, correct at the
  // cost of the install itself. What it places is recorded, so
  // `removeWorktree` can take it back.
  provisionWorktree(worktreePath, repoRoot, provisioningStateRoot());
}

/**
 * Create (or reuse, see module doc) an isolated worktree for work item `id`
 * inside `repoRoot`. `opts.scope` (a lock scope) carries the caller's held
 * locks into the worktree-admin acquire; a fresh scope when absent; `opts.waitMs` bounds the wait for it.
 * `opts.startSha` forks a new branch from that commit instead of reading
 * HEAD again (ignored when `opts.baseRef` is set or the branch exists).
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
 * not shared, not synced. `declareLandFiles` (merge.mjs) is the trusted-side
 * backstop if a worker commits a fresh `.fgos/` of its own anyway.
 */
export function createWorktree(repoRoot, id, opts = {}) {
  const branch = branchNameFor(id);
  const baseDir = opts.worktreeDir ?? path.join(os.tmpdir(), 'fgos-worktrees');
  fs.mkdirSync(baseDir, { recursive: true });
  const worktreePath = fs.mkdtempSync(path.join(baseDir, `${id}-`));

  const scope = opts.scope ?? createLockScope('worktree');
  const reused = branchExists(repoRoot, branch);
  let relocated = false;
  if (reused) {
    try {
      relocated = relocateOrphanedCheckout(repoRoot, branch, worktreePath).relocated;
    } catch (err) {
      try {
        fs.rmdirSync(worktreePath);
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
        addWorktreeSync(scope, repoRoot, [worktreePath, branch], { waitMs: opts.waitMs });
      } else if (opts.baseRef) {
        addWorktreeSync(scope, repoRoot, ['-b', branch, worktreePath, opts.baseRef], { waitMs: opts.waitMs });
      } else if (opts.startSha) {
        addWorktreeSync(scope, repoRoot, ['-b', branch, worktreePath, opts.startSha], { waitMs: opts.waitMs });
      } else {
        addWorktreeSync(scope, repoRoot, ['-b', branch, worktreePath], { waitMs: opts.waitMs });
      }
    } catch (err) {
      try {
        fs.rmdirSync(worktreePath);
      } catch {
        // best-effort cleanup of the empty dir mkdtemp created; the real
        // failure below is what the caller needs to see.
      }
      if (err instanceof HolderLockError) throw err;
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
    finishWorktreeSetup(repoRoot, worktreePath, branch);
  } catch (err) {
    try {
      removeWorktree(repoRoot, worktreePath, { force: true });
    } catch {
      // best-effort — see comment above.
    }
    throw err;
  }

  return { path: realpathOrSelf(worktreePath), branch, reused };
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
 * stricter than `checkoutPathForBranch` alone, on two counts:
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
    listing = gitWorktrees(repoRoot);
  } catch {
    return null;
  }
  const registered = checkoutPathIn(listing, branch);
  if (!registered || !fs.existsSync(registered) || !fs.existsSync(baseDir)) return null;

  let relative;
  try {
    // realpath both sides: `git worktree list` reports resolved paths, while
    // a caller's baseDir can still carry a symlinked segment.
    relative = path.relative(realpathOrSelf(baseDir), realpathOrSelf(registered));
  } catch {
    return null;
  }
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return realpathOrSelf(registered);
}

/**
 * The commit a reattached claim worktree's own files/index are ACTUALLY
 * synced to — never `git -C worktreePath rev-parse HEAD` (tsk-2cd): `HEAD`
 * is a symbolic ref that resolves live through the branch it's checked out
 * on, so once that branch has been moved from elsewhere (a ref update made
 * outside this worktree, such as an external `git branch -f`), `rev-parse
 * HEAD` immediately reports
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
  try { return checkoutFacts(repoRoot, worktreePath).lastSynced || null; } catch { return null; }
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
    const facts = checkoutFacts(repoRoot, worktreePath, lastSynced);
    return facts.delta.length > 0 || Buffer.from(facts.status).toString('utf8').split('\0').some(line => line.startsWith('??'));
  } catch { return true; }
}

/**
 * Resync a reattached claim worktree to its branch's current tip when safe
 * (tsk-2cd, `docs/history/root-worktree-drift-after-child-merge/CONTEXT.md`
 * D1/D3): a ref update made outside this worktree never touches any OTHER
 * worktree already checked out on that branch (Land itself refuses to move
 * a branch another checkout holds, Git spec §9 step 4), so
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

  const branchTip = resolveRefSha(repoRoot, branch);
  if (lastSynced === branchTip) return { resynced: false };

  let isAncestor = true;
  try {
    if (!ancestorOf(repoRoot, lastSynced, branchTip)) throw new Error('not ancestor');
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

  restoreCheckout(repoRoot, worktreePath, branchTip, { baseline: lastSynced });
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
  const orphanedPatches = checkoutFacts(repoRoot, worktreePath).orphanedPatches;
  if (orphanedPatches.length > 0) {
    const orphanedPaths = orphanedPatches;
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

  const branchTip = resolveRefSha(repoRoot, branch);
  if (lastSynced === branchTip) {
    return { resynced: false, reason: 'already-in-sync' };
  }

  let isAncestor = true;
  try {
    if (!ancestorOf(repoRoot, lastSynced, branchTip)) throw new Error('not ancestor');
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
  const facts = checkoutFacts(repoRoot, worktreePath, lastSynced);
  const strayLines = Buffer.from(facts.status).toString('utf8').split('\0').filter(line => line && line[1] !== ' ');
  if (strayLines.length) throw new WorktreeError(`resync-worktree: stray uncommitted changes beyond what's staged (${strayLines.join(', ')})`, { branch, worktreePath, strayLines });
  const reapplied = facts.stagedPatch.length > 0;
  try { restoreCheckout(repoRoot, worktreePath, branchTip, { baseline: lastSynced, reapplyLocalDelta: true }); }
  catch (err) {
    let detail;
    try { detail = JSON.parse(err.message); } catch { detail = {}; }
    const snapshot = detail.detail?.snapshot;
    throw new WorktreeError(`resync-worktree: reapply refused${snapshot ? `; snapshot preserved at ${snapshot}` : ''}: ${err.message}`, { branch, worktreePath, ...(snapshot ? { snapshot } : {}), ...(detail.detail?.patchPath ? { patchPath: detail.detail.patchPath } : {}), ...(detail.operationId ? { operationId: detail.operationId } : {}) });
  }
  return { resynced: true, from: lastSynced, to: branchTip, reapplied };
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
 * "untouched" was the bug, not the fix). The case was originally routine
 * rather than exotic — an item's claim was released back to `todo` the
 * moment it reached stage `executing` (`releaseClaimOnExecuting`,
 * src/intake/plan.mjs), and the session that held it then claimed it again
 * to do the work, from inside the very worktree the claim stands up.
 * tsk-40m D5 retired that release (a runtime claim now stays active
 * unbroken through clarify->executing, so this exact re-claim-at-executing
 * trigger no longer fires for a new item) — this reattach path stays live
 * for every OTHER reason the same worktree gets claimed again (a stale
 * session reclaimed via claim-lock, a human re-`pick`ing after a crash,
 * legacy pre-migration history), so it is not dead code, just no longer
 * this ONE trigger's routine case. Going through `createWorktree`'s reuse
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
  const branchTip = resolveRefSha(repoRoot, branch);
  const targetTip = resolveRefSha(repoRoot, targetRef);

  let ahead = 0;
  let behind = 0;
  try {
    const comparison = compareCommits(repoRoot, targetTip, branchTip);
    const counts = `${comparison.left} ${comparison.right}`;
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
    if (!ancestorOf(repoRoot, branchTip, targetTip)) throw new Error('not ancestor');
    unstarted = true;
  } catch {
    unstarted = false;
  }
  if (!unstarted) {
    return { target: targetRef, ahead, behind, refreshed: false, reason: 'own-commits' };
  }

  try {
    if (checkoutPath) {
      const options = gitPortOptions(checkoutPath, { mutation: true });
      const lock = acquireSync(createLockScope('refresh'), 'dispatch-cwd', { fgosDir: path.join(options.trustedMain, '.fgos'), cwd: checkoutPath });
      if (lock.result !== 'acquired') throw new Error('worktree custody held');
      try { createGitRefs(options).fastForwardCheckedOut({ name: `refs/heads/${branch}`, expected: branchTip, next: targetTip, operationId: operationId() }, [lock.handle]); }
      finally { lock.handle.release(); }
    } else {
      refsPort(repoRoot).advanceRef({ name: `refs/heads/${branch}`, expected: branchTip, next: targetTip, operationId: operationId() });
    }
  } catch (err) {
    return { target: targetRef, ahead, behind, refreshed: false, reason: 'refresh-refused', detail: err.message };
  }
  return { target: targetRef, ahead, behind, refreshed: true, from: branchTip, to: targetTip };
}

/**
 * A disposable checkout detached at `commit`, for verifying a tree that no
 * checkout here holds (a merge already landed on a target branch that is
 * not checked out). Git refuses a second checkout of a BRANCH, never of a
 * commit, so this never inspects, moves or removes any checkout of the
 * branch itself, including one a person keeps open (docs/history/
 * merge-worktree-reclaim-clobbers-kept-checkout/CONTEXT.md D1). It is
 * provisioned like a Land candidate, with what that placed recorded and the
 * record marked disposable, so `removeWorktree` also takes back what the
 * verification run built there; the caller always removes it that way. A provisioning failure
 * removes the checkout before the error is rethrown.
 */
export function createVerifyCheckout(repoRoot, commit) {
  const baseDir = path.join(os.tmpdir(), 'fgos-worktrees');
  fs.mkdirSync(baseDir, { recursive: true });
  const worktreePath = fs.mkdtempSync(path.join(baseDir, 'verify-'));
  try {
    addWorktreeSync(createLockScope('worktree'), repoRoot, ['--detach', worktreePath, commit]);
  } catch (err) {
    try {
      fs.rmdirSync(worktreePath);
    } catch {
      // best-effort cleanup of the empty dir mkdtemp created; the real
      // failure below is what the caller needs to see.
    }
    if (err instanceof HolderLockError) throw err;
    throw new WorktreeError(`git worktree add --detach failed at ${commit}: ${err.message}`, { worktreePath });
  }
  try {
    provisionWorktree(worktreePath, repoRoot, provisioningStateRoot(), { disposable: true });
  } catch (err) {
    try { removeWorktree(repoRoot, worktreePath, { force: true }); } catch { /* the provisioning error is the one to report */ }
    throw err;
  }
  return worktreePath;
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
export function removeDispatchWorktree(repoRoot, worktreePath, log = () => {}) {
  try {
    // What a failed round left in its own dispatch checkout is producer output the Worktree port
    // preserves (it never removes a dirty checkout). SafeRestore pins it in a snapshot before the
    // checkout is reset to its own HEAD, so the removal below can proceed and the retry starts clean.
    if (isCheckoutDirty(repoRoot, worktreePath)) resetDispatchWorktree(repoRoot, worktreePath, currentHead(worktreePath));
    removeWorktree(repoRoot, worktreePath, { force: true });
  } catch (err) {
    if (typeof log === 'function') {
      log(`fgos-runner: worktree cleanup failed for "${worktreePath}": ${err.message}`);
    }
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
  const id = operationId();
  let retained;
  try {
    withCheckoutCustody(worktreePath, (options, custody) => {
      let expectedTip = currentHead(worktreePath);
      if (opts.retainTo && expectedTip !== opts.retainTo) {
        // SafeRestore durably pins the old HEAD before resetting. Keep its
        // evidence unacknowledged: the session is gone but its commit is not.
        const restoreId = operationId();
        const saved = createGitSafeRestore(options).apply({ operationId: restoreId, request: {
          expectedHead: expectedTip, target: opts.retainTo, reason: 'retain forced session HEAD before cleanup',
          discardLocalDelta: true, requireCleanBaseline: true,
        } }, [custody]);
        retained = { retainedRef: `refs/fgos/git-operations/${restoreId}/candidate`, snapshot: saved.snapshot };
        expectedTip = currentHead(worktreePath);
      }
      const deliveredTo = opts.deliveredTo ?? expectedTip;
      const evidenceDigest = crypto.createHash('sha256').update(JSON.stringify({ worktreePath, expectedTip, deliveredTo })).digest('hex');
      removeProvisioned(provisioningStateRoot(), worktreePath, () => createGitWorktree({ ...options, repoPath: options.trustedMain })
        .remove({ path: worktreePath, expectedTip, deliveredTo, evidenceDigest, operationId: id }, [custody]));
    }, opts);
  } catch (err) { throw new WorktreeError(`git worktree remove failed for "${worktreePath}": ${err.message}${retained ? `; commit preserved at ${retained.retainedRef}; snapshot ${retained.snapshot}` : ''}`, { worktreePath, ...retained }); }
  try { pruneWorktrees(repoRoot, id); } catch { /* removal already succeeded */ }
  return retained;
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
  try {
    const base = resolveRefSha(repoRoot, opts.base ?? 'HEAD');
    return inspectGit(repoRoot).listBranches({ prefix: 'refs/heads/fgw/' }).map(ref => {
      const tip = resolveRefSha(repoRoot, ref);
      return { branch: ref.slice('refs/heads/'.length), aheadCount: inspectGit(repoRoot).compareCommits({ left: base, right: tip }).right, ...(opts.includeTip ? { tip } : {}) };
    });
  } catch (err) { throw new WorktreeError(`listing "fgw/" branches failed: ${err.message}`); }
}
