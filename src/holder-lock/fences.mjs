// Fences for the stop-everything lock cutover.
//
// The locks this release moves onto kernel locks keep their old on-disk
// paths readable by any older fgOS binary still installed on the machine.
// A fence makes that older binary fail loudly at its first acquire instead
// of silently holding the old lock next to the new one:
//
//   - tombstone: the old lock FILE path becomes a directory holding a
//     TOMBSTONE record. Old code tries `link`/`open(wx)` onto the path
//     (EEXIST), then reads it as a file (EISDIR) and throws or refuses.
//   - blocking generation: a generation ledger (a directory of numbered
//     records, where the highest number is the current holder) gets a final
//     generation whose holder is pid 1 without a start time or boot id. Old
//     code judges pid 1 alive in every namespace and, lacking a start time,
//     never disproves the holder, so it sees the ledger as held forever.
//
// Which locks are fenced, and how, is read from the lock registry; this
// module only knows how to enumerate each lock's old paths. Fences are
// placed exactly once, after `checkStopped` has shown that no other fgOS
// process of the workspace is running, and never over a lock file that is
// still there: an old file at a tombstone path or a live holder in a ledger
// stops the whole placement with `v1-lock-present` before anything is
// written, so a workspace is never left half fenced.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { listAssignmentRuns } from '../runner/dispatch/assignment-layout.mjs';
import { resolveHostBin } from '../util/host-bin.mjs';
import { resolveStateRoot } from './state-root.mjs';

const REGISTRY_URL = new URL('../../packages/holder-lock/contracts/lock-registry.v1.json', import.meta.url);

/** The release whose cutover places the first fences; also the registry `owner` of the locks it fences. */
export const CUTOVER_RELEASE = '4.2';
/** Every registry `owner` whose old lock paths this module fences: the Node locks, the main checkout cutover and the Rust callers' (`fgctl`, Observe). */
export const CUTOVER_OWNERS = ['4.2', '4.3', '4.4'];

/**
 * The repo locks of the main checkout cutover, by registry name: the main
 * door (`main-checkout`, `merge-slot`) and the two hot mutexes of the state
 * store (`state` replaces `events.lock` and `runtime/claims.lock`,
 * `porting-events` replaces `porting/events.lock`).
 */
const MAIN_DOOR_RELEASE = '4.3';
/** The repo locks of the main checkout cutover; `worktree-admin` is new and has no old path to fence. */
export const MAIN_DOOR_LOCKS = ['main-checkout', 'merge-slot', 'state', 'porting-events', 'worktree-admin'];
const MAIN_DOOR_FENCED = new Set(MAIN_DOOR_LOCKS);

/** Whether a registry row is a lock a cutover moved onto a kernel lock. */
export function isCutOverLock(lock) {
  if (!CUTOVER_OWNERS.includes(lock.owner)) return false;
  return lock.owner !== MAIN_DOOR_RELEASE || MAIN_DOOR_FENCED.has(lock.name);
}
/** Written as `by` in every tombstone and as `fence` in every blocking generation. */
export function fenceBy(owner) {
  return `fgos ${owner}`;
}
export const FENCE_BY = fenceBy(CUTOVER_RELEASE);
export const TOMBSTONE_FILE = 'TOMBSTONE';
export const V1_LOCK_PRESENT = 'v1-lock-present';

const SCAN_PROTOCOL = 1;
const SCAN_TIMEOUT_MS = 30_000;
// The old ledger reader only sees ten-digit `<epoch>.json` names.
const GENERATION_FILE_RE = /^(\d{10})\.json$/;

function readRegistry() {
  return JSON.parse(fs.readFileSync(REGISTRY_URL, 'utf8'));
}

/** The provider-capacity runtime directory the old ledgers live under. */
export function defaultProviderRuntimeDir() {
  return path.join(os.homedir(), '.fgos', 'runtime', 'provider-capacity');
}

function subdirs(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return [];
    throw err;
  }
  return entries.filter((entry) => entry.isDirectory()).map((entry) => path.join(dir, entry.name)).sort();
}

function isDirectory(dir) {
  try {
    return fs.statSync(dir).isDirectory();
  } catch {
    return false;
  }
}

function isPidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM';
  }
}

// ---------------------------------------------------------------------
// Enumerating the old paths
// ---------------------------------------------------------------------

/**
 * Every working directory an old dispatch could have locked under this
 * workspace: the root itself and every linked worktree, each in the form
 * `path.resolve` gives and in its `realpath` form, because the old lock
 * name was computed from whichever form the caller passed. A claim's
 * checkout is always one of these worktrees, so claims add no path of
 * their own. Holder-lock sits below Git, so the caller lists the worktrees.
 */
function dispatchCwds(workspaceRoot, worktrees) {
  const roots = new Set([path.resolve(workspaceRoot), ...worktrees.map((dir) => path.resolve(dir))]);
  const cwds = new Set();
  for (const root of roots) {
    cwds.add(root);
    try {
      cwds.add(fs.realpathSync(root));
    } catch {
      // A registered worktree whose directory is gone cannot be a cwd anymore.
    }
  }
  return [...cwds].sort();
}

function accountLockDirs(providerRuntimeDir) {
  const dirs = [];
  for (const provider of subdirs(path.join(providerRuntimeDir, 'account-locks'))) {
    for (const account of subdirs(provider)) dirs.push(path.join(account, 'lock'));
  }
  return dirs;
}

/**
 * Every target ref an old merge could have taken a slot for: each local
 * branch, as the caller lists it (short name). The slot name is
 * `merge-slot--<encodeURIComponent(ref)>.lock` (the formula of the deleted
 * `mergeSlotLockFile`, recorded in the registry row so this module does not
 * depend on the deleted code).
 */
function mergeSlotCandidates(branches) {
  return [...new Set(branches.filter(Boolean))].sort();
}

// Old paths that depend on what exists at cutover time; fixed paths come
// straight from the registry's `v1Path`.
const ENUMERATED_V1_PATHS = {
  advance: ({ fgosDir }) => subdirs(path.join(fgosDir, 'workflow-runs')).map((runDir) => path.join(runDir, 'advance.lock')),
  recovery: ({ fgosDir }) => [...listAssignmentRuns(fgosDir)].map(({ runDir }) => path.join(runDir, '.recovery.lock')),
  'merge-slot': ({ fgosDir, branches }) => mergeSlotCandidates(branches).map((ref) => path.join(fgosDir, `merge-slot--${encodeURIComponent(ref)}.lock`)),
  'dispatch-cwd': ({ fgosDir, workspaceRoot, worktrees }) => dispatchCwds(workspaceRoot, worktrees).map((cwd) => path.join(fgosDir, `dispatch--${encodeURIComponent(cwd)}.lock`)),
  'provider-account': ({ providerRuntimeDir }) => accountLockDirs(providerRuntimeDir),
  'provider-state': ({ providerRuntimeDir }) => (isDirectory(providerRuntimeDir) ? [path.join(providerRuntimeDir, 'state-lock')] : []),
};

const STATE_ROOT_PREFIX = '<stateRoot>/';

function v1PathsOf(lock, context) {
  const enumerate = ENUMERATED_V1_PATHS[lock.name];
  if (enumerate) return enumerate(context);
  if (Array.isArray(lock.v1Path)) return lock.v1Path.flatMap((v1Path) => v1PathsOf({ ...lock, v1Path }, context));
  if (typeof lock.v1Path === 'string' && lock.v1Path.startsWith(STATE_ROOT_PREFIX) && !lock.v1Path.slice(STATE_ROOT_PREFIX.length).includes('<')) {
    return [path.join(context.stateRoot(), ...lock.v1Path.slice(STATE_ROOT_PREFIX.length).split('/'))];
  }
  if (typeof lock.v1Path === 'string' && lock.v1Path.startsWith('.fgos/') && !lock.v1Path.includes('<')) {
    return [path.join(context.fgosDir, ...lock.v1Path.slice('.fgos/'.length).split('/'))];
  }
  throw new Error(`lock "${lock.name}" is fenced by the registry but this module cannot enumerate its old path ${JSON.stringify(lock.v1Path)}`);
}

/**
 * Every old path that needs a fence in this workspace: `{lock, fence, owner,
 * path}` per path, for the registry locks of the `owners` (default: every
 * cutover owner) whose fence is not `none`. A path under `<stateRoot>` (the
 * machine-scope install lock) is placed once for the machine: the state
 * root is `stateRoot` when given, else the process's own resolution, asked
 * only when such a lock is among the owners. `worktrees` (linked worktree
 * directories) and `branches` (short local branch names) are the
 * workspace's Git listing, read by the caller; both are empty outside a
 * repository.
 */
export function fenceTargets({ fgosDir, workspaceRoot, worktrees, branches, providerRuntimeDir = defaultProviderRuntimeDir(), stateRoot, owners = CUTOVER_OWNERS } = {}) {
  if (!fgosDir) throw new Error('fenceTargets requires fgosDir');
  if (!Array.isArray(worktrees) || !Array.isArray(branches)) throw new Error('fenceTargets requires the workspace listing: worktrees and branches (empty outside a repository)');
  let resolvedStateRoot = stateRoot ? path.resolve(stateRoot) : null;
  const context = {
    fgosDir: path.resolve(fgosDir),
    workspaceRoot: path.resolve(workspaceRoot ?? path.dirname(fgosDir)),
    worktrees,
    branches,
    providerRuntimeDir,
    stateRoot: () => (resolvedStateRoot ??= path.resolve(resolveStateRoot({ fgosDir }).stateRoot)),
  };
  const targets = [];
  for (const lock of readRegistry().locks) {
    if (!owners.includes(lock.owner) || !isCutOverLock(lock) || !lock.fence || lock.fence === 'none') continue;
    for (const p of v1PathsOf(lock, context)) targets.push({ lock: lock.name, fence: lock.fence, owner: lock.owner, path: p, ...(lock.name === 'activation' && p === path.join(context.fgosDir, 'locks/activation.lock') ? { managedBy: 'fgctl' } : {}) });
  }
  return targets;
}

// ---------------------------------------------------------------------
// Tombstones
// ---------------------------------------------------------------------

/** `absent` | `fenced` | `empty-dir` (a tombstone whose record was never written) | `v1-present`. */
function tombstoneState(lockPath) {
  let stat;
  try {
    stat = fs.lstatSync(lockPath);
  } catch (err) {
    if (err.code === 'ENOENT') return 'absent';
    throw err;
  }
  if (!stat.isDirectory()) return 'v1-present';
  if (fs.existsSync(path.join(lockPath, TOMBSTONE_FILE))) return 'fenced';
  return fs.readdirSync(lockPath).length === 0 ? 'empty-dir' : 'v1-present';
}

function v1LockPresent(target) {
  const err = new Error(`an old lock is still present at ${target.path} (${target.lock}); stop its holder or remove it by hand before fencing`);
  err.code = V1_LOCK_PRESENT;
  err.lockPath = target.path;
  err.lock = target.lock;
  return err;
}

function placeTombstone(target, now) {
  fs.mkdirSync(path.dirname(target.path), { recursive: true });
  try {
    fs.mkdirSync(target.path);
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
    const state = tombstoneState(target.path);
    if (state === 'fenced') return 'already';
    if (state !== 'empty-dir') throw v1LockPresent(target);
  }
  fs.writeFileSync(path.join(target.path, TOMBSTONE_FILE), `${JSON.stringify({ lock: target.lock, at: now, by: fenceBy(target.owner) })}\n`);
  return 'placed';
}

// ---------------------------------------------------------------------
// Blocking generations
// ---------------------------------------------------------------------

function generationFileName(epoch) {
  return `${String(epoch).padStart(10, '0')}.json`;
}

/** The highest parseable generation of a ledger, `{epoch, record}`, or null. */
function currentGeneration(lockDir) {
  let names;
  try {
    names = fs.readdirSync(lockDir);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
  let best = null;
  for (const name of names) {
    const match = GENERATION_FILE_RE.exec(name);
    if (!match) continue;
    const epoch = Number(match[1]);
    if (best !== null && epoch <= best.epoch) continue;
    let record;
    try {
      record = JSON.parse(fs.readFileSync(path.join(lockDir, name), 'utf8'));
    } catch {
      continue; // vanished or corrupt: never authoritative
    }
    best = { epoch, record };
  }
  return best;
}

/**
 * The highest epoch named in the ledger, readable or not. A new generation
 * goes above it: a corrupt top file would otherwise take the epoch the
 * reader computed from the readable ones, and every `link` would fail.
 */
function highestGenerationEpoch(lockDir) {
  let names;
  try {
    names = fs.readdirSync(lockDir);
  } catch (err) {
    if (err.code === 'ENOENT') return 0;
    throw err;
  }
  let highest = 0;
  for (const name of names) {
    const match = GENERATION_FILE_RE.exec(name);
    if (match) highest = Math.max(highest, Number(match[1]));
  }
  return highest;
}

/** `absent` | `fenced` | `released` | `dead` (holder and child gone) | `v1-present` (a holder still alive). */
function generationState(lockDir) {
  const current = currentGeneration(lockDir);
  if (!current) return 'absent';
  const { record } = current;
  if (record?.releasedAt) return 'released';
  if (record?.fence) return 'fenced';
  if (isPidAlive(record?.holder?.pid) || isPidAlive(record?.child?.pid)) return 'v1-present';
  return 'dead';
}

function publishBlockingGeneration(target, now) {
  const lockDir = target.path;
  fs.mkdirSync(lockDir, { recursive: true });
  for (;;) {
    const state = generationState(lockDir);
    if (state === 'fenced') return 'already';
    if (state === 'v1-present') throw v1LockPresent(target);
    const epoch = highestGenerationEpoch(lockDir) + 1;
    const tmpPath = path.join(lockDir, `.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const fd = fs.openSync(tmpPath, 'w');
    try {
      fs.writeSync(fd, JSON.stringify({ holder: { pid: 1 }, fence: fenceBy(target.owner), lock: target.lock, at: now }));
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
    try {
      fs.linkSync(tmpPath, path.join(lockDir, generationFileName(epoch)));
    } catch (err) {
      fs.rmSync(tmpPath, { force: true });
      if (err.code !== 'EEXIST') throw err;
      continue; // lost the epoch to a concurrent writer: read the ledger again and decide again
    }
    fs.rmSync(tmpPath, { force: true });
    return 'placed';
  }
}

// ---------------------------------------------------------------------
// Public surface
// ---------------------------------------------------------------------

function stateOf(target) {
  return target.fence === 'blocking-generation' ? generationState(target.path) : tombstoneState(target.path);
}

/**
 * Whether each old path of this workspace already carries its fence.
 * Returns `{targets, missing, v1Present, complete, controllerMissing}`;
 * `targets` lists every path, each with a `state` and a `fenced` flag.
 * `missing`, `v1Present` and `complete` cover the fences this module places;
 * a path marked `managedBy: 'fgctl'` is placed only by fgctl inside its
 * activation, so it is reported in `targets` and, while unfenced, in
 * `controllerMissing`, never in `missing`. A path at state `v1-present` is
 * an old lock that is still there and blocks placement.
 */
export function fenceStatus(options = {}) {
  const targets = fenceTargets(options).map((target) => {
    const state = stateOf(target);
    return { ...target, state, fenced: state === 'fenced' };
  });
  const placedHere = targets.filter((target) => target.managedBy !== 'fgctl');
  const missing = placedHere.filter((target) => !target.fenced).map((target) => target.path);
  const v1Present = placedHere.filter((target) => target.state === 'v1-present').map((target) => target.path);
  const controllerMissing = targets.filter((target) => target.managedBy === 'fgctl' && !target.fenced).map((target) => target.path);
  return { targets, missing, v1Present, complete: missing.length === 0, controllerMissing };
}

/**
 * Place every missing fence of the workspace, once. Checks every path
 * first: any old lock still present (`v1-present`) returns
 * `{ok: false, error: 'v1-lock-present', paths}` with nothing written.
 * Otherwise returns `{ok: true, placed, skipped}`; a second call places
 * nothing and skips everything. A lock that appears between the check and
 * the write still stops the placement, with `placed` naming what landed
 * before it.
 */
export function placeFences({ now = new Date().toISOString(), ...options } = {}) {
  const status = fenceStatus(options);
  if (status.v1Present.length > 0) {
    return { ok: false, error: V1_LOCK_PRESENT, paths: status.v1Present, placed: [], skipped: [] };
  }
  const placed = [];
  const skipped = [];
  for (const target of status.targets) {
    // Only fgctl may replace the old kernel file while holding both descriptions.
    if (target.managedBy === 'fgctl') continue;
    let outcome;
    try {
      outcome = target.fence === 'blocking-generation' ? publishBlockingGeneration(target, now) : placeTombstone(target, now);
    } catch (err) {
      if (err.code !== V1_LOCK_PRESENT) throw err;
      return { ok: false, error: V1_LOCK_PRESENT, paths: [err.lockPath], placed, skipped };
    }
    (outcome === 'placed' ? placed : skipped).push(target.path);
  }
  return { ok: true, placed, skipped };
}

// ---------------------------------------------------------------------
// Stop check
// ---------------------------------------------------------------------

function parentPid(pid) {
  if (process.platform !== 'linux') return 0;
  try {
    const stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8');
    const rest = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
    return Number.parseInt(rest[1], 10) || 0;
  } catch {
    return 0;
  }
}

/** This process and its ancestors (the shell that launched it, and up): the pids a scan must not count. */
export function ownPidChain() {
  const pids = [process.pid];
  let pid = process.ppid;
  while (pid > 1 && !pids.includes(pid)) {
    pids.push(pid);
    pid = parentPid(pid);
  }
  return pids;
}

function hostError(code, message, extra = {}) {
  const err = new Error(message);
  err.code = code;
  Object.assign(err, extra);
  return err;
}

function scanWorkspace(hostBin, { root, worktrees }, excludePids, timeoutMs) {
  const args = ['internal', 'quiesce-scan', '--protocol', String(SCAN_PROTOCOL), '--root', root];
  for (const dir of worktrees) args.push('--dir', dir);
  for (const pid of excludePids) args.push('--exclude-pid', String(pid));
  const res = spawnSync(hostBin, args, { encoding: 'utf8', timeout: timeoutMs, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024 });
  if (res.error) {
    throw hostError('host-exec-error', `quiesce-scan of ${root} could not run: ${res.error.message}`, { cause: res.error });
  }
  const stderr = (res.stderr ?? '').trim();
  if (res.status === 3) throw hostError('host-version-mismatch', `quiesce-scan: ${stderr || 'host-version-mismatch'}`, { status: res.status });
  if (![0, 10, 12].includes(res.status)) {
    throw hostError('quiesce-scan-failed', `quiesce-scan of ${root} exited ${res.status}${res.signal ? ` (${res.signal})` : ''}: ${stderr || res.stdout}`, { status: res.status, stderr });
  }
  let parsed;
  try {
    parsed = JSON.parse(res.stdout);
  } catch (err) {
    throw hostError('quiesce-scan-invalid-output', `quiesce-scan of ${root} printed no JSON: ${err.message}\n${res.stdout}`);
  }
  if (parsed?.v !== 1 || parsed.protocol !== SCAN_PROTOCOL || !['clean', 'processes', 'unavailable'].includes(parsed.result)) {
    throw hostError('quiesce-scan-invalid-output', `quiesce-scan of ${root} answered outside its contract: ${res.stdout}`);
  }
  return {
    root,
    result: parsed.result,
    processes: Array.isArray(parsed.processes) ? parsed.processes : [],
    unreadable: Number.isInteger(parsed.unreadable) ? parsed.unreadable : 0,
    detail: typeof parsed.detail === 'string' ? parsed.detail : null,
  };
}

/**
 * Ask the host's `quiesce-scan` whether any fgOS process other than this
 * one (and its ancestors) is still running for each workspace. A workspace
 * is its root path, or `{root, worktrees}` with the linked worktree
 * directories the caller listed through Git (holder-lock never lists them
 * itself); a bare root scans that directory alone. Returns
 * `{status, blockers, scans, detail}` with status `clean`, `blocked` (a
 * process was found or an entry could not be read, listed in `blockers`)
 * or `needs-attest` (this platform cannot scan; a person has to confirm).
 * Throws when the host binary is missing or answers outside the contract.
 */
export function checkStopped({ workspaces, hostBin, excludePids = ownPidChain(), timeoutMs = SCAN_TIMEOUT_MS } = {}) {
  if (!Array.isArray(workspaces) || workspaces.length === 0) throw new Error('checkStopped requires at least one workspace root');
  const listed = workspaces.map((workspace) => (typeof workspace === 'string' ? { root: workspace, worktrees: [] } : workspace))
    .map(({ root, worktrees = [] }) => ({ root: path.resolve(root), worktrees: worktrees.map((dir) => path.resolve(dir)) }));
  const bin = hostBin ?? resolveHostBin(listed[0].root);
  if (!bin) throw hostError('host-unavailable', 'Rust host binary unavailable (FGOS_HOST_BIN unset and no active installation manifest)');
  const scans = listed.map((workspace) => scanWorkspace(bin, workspace, excludePids, timeoutMs));
  const blockers = [];
  for (const scan of scans) {
    for (const proc of scan.processes) blockers.push({ kind: 'process', workspace: scan.root, ...proc });
    if (scan.unreadable > 0) blockers.push({ kind: 'unreadable', workspace: scan.root, count: scan.unreadable });
  }
  const unavailable = scans.filter((scan) => scan.result === 'unavailable');
  const status = blockers.length > 0 ? 'blocked' : unavailable.length > 0 ? 'needs-attest' : 'clean';
  return { status, blockers, scans, detail: unavailable.map((scan) => scan.detail).filter(Boolean).join('; ') || null };
}

/**
 * The whole cutover step, in the only safe order: check that everything
 * has stopped, place the fences, check again. Blockers before placement
 * mean nothing is placed. Blockers found afterwards are processes that
 * started while the fences went down; they already fail against the
 * fences, and are reported so a person can stop them. A platform that
 * cannot scan needs `attested: true` (a person confirmed that nothing is
 * running) before anything is placed.
 */
export function fenceCutover({ workspaces, fgosDir, workspaceRoot, worktrees, branches, providerRuntimeDir, stateRoot, owners, hostBin, excludePids, attested = false, now } = {}) {
  const scanOptions = { workspaces, hostBin, ...(excludePids ? { excludePids } : {}) };
  const before = checkStopped(scanOptions);
  if (before.status === 'blocked' || (before.status === 'needs-attest' && !attested)) {
    return { status: before.status, before, fences: null, after: null };
  }
  const fences = placeFences({ fgosDir, workspaceRoot, worktrees, branches, providerRuntimeDir, stateRoot, ...(owners ? { owners } : {}), ...(now ? { now } : {}) });
  if (!fences.ok) return { status: fences.error, before, fences, after: null };
  const after = checkStopped(scanOptions);
  return { status: after.status === 'blocked' ? 'placed-then-blocked' : 'placed', before, fences, after };
}
