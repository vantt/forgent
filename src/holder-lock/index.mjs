// index.mjs -- the Node facade of the holder-lock port
// (packages/holder-lock/contracts/holder-lock.port.v1.json).
//
// A lock is a kernel lock on an open file description. This process opens
// the lock file (O_RDWR|O_CREAT; Node opens close-on-exec), hands the
// description to `fgos internal lock-fd` at stdio slot 3, the helper locks it
// and exits, and the lock stays with the description this process owns.
// Release is close(fd). Nobody ever calls LOCK_UN.
//
// Where that is impossible (Windows: a LockFileEx lock belongs to the process
// that took it) the transport is `hold`: one `fgos internal lock-hold` helper
// lives as long as the lock, and release ends it (hold-transport.mjs).
// `driver.lockTransport()` is the only place that tells the two apart.
//
// Callers see handles, results and named errors; never a file descriptor.
// The descriptor lives in a module-private WeakMap, and the only operation
// that hands it to another process is `runBorrowed`, through an explicit
// stdio mapping to exactly one child.
//
// Acquire returns `acquired` only when the kernel lock is held AND the
// predecessor domain recorded next to the lock file is empty; the route
// implements that rule, this facade forwards `lock.predecessorKillWaitMs`
// as the bound and maps a `held (predecessor-domain-not-empty)` answer to
// the named error `lock-predecessor-domain-not-empty`.

import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { HolderLockError, LOCK_FD_ENV, LOCK_FD_SLOT, LOCK_JOB_ENV, readPredecessorKillWaitMs } from './protocol.mjs';
import { resolveLock, loadLockRegistry, lockEntry } from './registry.mjs';
import { LockScope, createLockScope, assertLockScope } from './lock-scope.mjs';
import { resolveStateRoot, resolveLockRoot } from './state-root.mjs';
import {
  hostBin,
  routeEnv,
  runLockRouteSync,
  runLockRoute,
  assertDriverUsable,
  guaranteeFor,
  lockTransport,
  leftoverSweep,
  borrowLeadsGroup,
  descriptionHolders,
  ROUTE_CALL_TIMEOUT_MS,
  ROUTE_SLACK_MS,
} from './driver.mjs';
import { startHold, waitReady, waitReadySync, readyBoundMs, releaseHold, removeWorkDir, borrowSync, borrowAsync, clearDomainHold } from './hold-transport.mjs';

export { HolderLockError, LOCK_FD_ENV, LOCK_FD_SLOT, LOCK_JOB_ENV, readPredecessorKillWaitMs } from './protocol.mjs';
export { LockScope, createLockScope, resolveLock, loadLockRegistry, lockEntry, resolveStateRoot, resolveLockRoot, guaranteeFor };

/** How many times an acquire re-opens the file when the inode it locked is
 * no longer the inode at the path (the file was replaced under it). */
const INODE_RETRIES = 3;
const DEFAULT_POLL_MS = 25;
const MAX_OUTPUT_BYTES = 16 * 1024 * 1024;

const descriptions = new WeakMap();
const handleAuthority = Symbol();
let nativeRegistered = false;

function descriptionOf(handle) {
  const entry = descriptions.get(handle);
  if (!entry) throw new HolderLockError('lock-handle-invalid', 'not a handle returned by acquire', {});
  return entry;
}

/** The handle `acquire` returns. Owns one open description of the lock file
 * (fd transport) or one lock-hold helper (hold transport) until `release()`;
 * releasing twice is a no-op. */
export class LockHandle {
  constructor({ name, path: lockPath, rank, kind, scope, projectRoot, killWaitMs, claim }, authority) {
    if (authority !== handleAuthority) throw new HolderLockError('lock-handle-invalid', 'handles are minted by acquire', {});
    this.name = name;
    this.path = lockPath;
    this.rank = rank;
    this.kind = kind;
    this.scope = scope;
    this.projectRoot = projectRoot;
    this.killWaitMs = killWaitMs;
    descriptions.set(this, { fd: claim.fd ?? null, hold: claim.hold ?? null, borrows: 0, borrowRoots: new Set(), sweeps: 0, released: false, reachFloorTicks: claim.reachFloorTicks ?? null });
    Object.freeze(this);
  }

  get released() {
    return descriptionOf(this).released;
  }

  /** The existing hold-helper request channel, for a supervisor to declare
   * its domain under this acquired handle before GO (no OS handle escapes). */
  domainEndpoint() {
    const entry = descriptionOf(this);
    if (entry.released) throw new HolderLockError('lock-handle-released', 'domain declaration needs a held handle', {});
    return entry.hold ? entry.hold.work : null;
  }

  /** Record a completed handoff while this holder still excludes successors. */
  clearDomain() {
    const entry = descriptionOf(this);
    if (entry.released || entry.borrows > 0) throw new HolderLockError('lock-handle-invalid', 'clearDomain requires an idle held handle', {});
    const answer = entry.hold
      ? clearDomainHold(entry.hold, this.killWaitMs + ROUTE_SLACK_MS)
      : runLockRouteSync({ bin: hostBin({ fgosDir: this.projectRoot && path.join(this.projectRoot, '.fgos') }), args: ['--clear-domain', this.path, '--kill-wait-ms', String(this.killWaitMs)], fd: entry.fd, timeoutMs: this.killWaitMs + ROUTE_SLACK_MS });
    if (answer.result !== 'cleared') throw new HolderLockError('lock-domain-not-empty', 'the holder domain was not proven empty', { answer });
  }

  /** Close the description (hold transport: end the helper). The kernel drops
   * the lock once every copy of the description is closed (a borrowing child
   * keeps its own copy until it exits). Refused while a borrowed child is
   * still running: a holder releases only after its domain is empty. */
  release() {
    const entry = descriptionOf(this);
    if (entry.released) return false;
    if (entry.borrows > 0) {
      throw new HolderLockError('lock-release-while-borrowed', `${this.name}: a borrowed child is still running; await its result before releasing`, { lock: this.name });
    }
    if (entry.hold) {
      releaseHold(entry.hold);
      entry.hold = null;
    } else {
      fs.closeSync(entry.fd);
      entry.fd = null;
    }
    entry.released = true;
    this.scope.untrack(this);
    return true;
  }
}

function closeQuietly(fd) {
  try {
    fs.closeSync(fd);
  } catch {
    // already closed
  }
}

function openLockFile(lockPath) {
  return fs.openSync(lockPath, fs.constants.O_RDWR | fs.constants.O_CREAT, 0o644);
}

function sameInode(fd, lockPath) {
  try {
    const open = fs.fstatSync(fd);
    const onDisk = fs.statSync(lockPath);
    return open.ino === onDisk.ino && open.dev === onDisk.dev;
  } catch {
    return false;
  }
}

function projectRootOf(params) {
  return typeof params.fgosDir === 'string' && params.fgosDir ? path.dirname(path.resolve(params.fgosDir)) : undefined;
}

function normalizeWait(waitMs) {
  if (waitMs === undefined || waitMs === null) return { kind: 'try' };
  if (!Number.isInteger(waitMs) || waitMs < 1) {
    throw new HolderLockError('lock-wait-invalid', `waitMs must be an integer >= 1 or omitted, got ${JSON.stringify(waitMs)}`, { waitMs });
  }
  return { kind: 'ms', ms: waitMs };
}

/** Everything an acquire needs before it opens anything: the lock row, the
 * order check, the binary, the guarantee of the directory, the kill bound.
 * Order matters: a scope violation and a missing driver both fail before a
 * single file is touched. */
function prepareAcquire(scope, name, params) {
  assertLockScope(scope);
  const lock = resolveLock(name, params);
  scope.assertCanAcquire(lock.name, lock.rank);
  const projectRoot = projectRootOf(params);
  const killWaitMs = readPredecessorKillWaitMs({ projectRoot });
  const bin = hostBin({ fgosDir: params.fgosDir });
  ensureLockFile(lock);
  const { reachFloorTicks } = assertDriverUsable(lock.v3Path, { fgosDir: params.fgosDir });
  return { lock, bin, projectRoot, killWaitMs, reachFloorTicks, predecessorKinds: params.predecessorKinds, env: routeEnv() };
}

/** The lock file exists (created once, never removed while the resource
 * lives) so the driver can read the filesystem it is on. */
function ensureLockFile(lock) {
  fs.mkdirSync(lock.lockDir, { recursive: true });
  closeQuietly(openLockFile(lock.v3Path));
}

function modeArgs(wait, killWaitMs, predecessorKinds) {
  const mode = wait.kind === 'ms' ? ['--wait-ms', String(wait.ms)] : ['--try'];
  return [...mode, '--kill-wait-ms', String(killWaitMs), ...(predecessorKinds ? ['--predecessor-kinds', predecessorKinds.join(',')] : [])];
}

function routeTimeoutMs(wait, killWaitMs) {
  return (wait.kind === 'ms' ? wait.ms : 0) + killWaitMs + ROUTE_SLACK_MS;
}

/** `claim` is what the lock lives in: `{ fd }` or `{ hold }`. */
function makeHandle(prepared, scope, claim) {
  const { lock, projectRoot, killWaitMs } = prepared;
  const handle = new LockHandle({ name: lock.name, path: lock.v3Path, rank: lock.rank, kind: lock.kind, scope, projectRoot, killWaitMs, claim: { ...claim, reachFloorTicks: prepared.reachFloorTicks } }, handleAuthority);
  scope.track(handle);
  return handle;
}

/** The result of a route answer that is not `acquired`, for a description
 * the caller has already closed: a value for held/timeout, a named error
 * for everything the caller must not retry blindly. */
function settleNotAcquired(line, lock, wait, killWaitMs = null) {
  switch (line.result) {
    case 'held':
      if (line.reason === 'predecessor-domain-not-empty') {
        throw new HolderLockError(
          'lock-predecessor-domain-not-empty',
          `${lock.name}: the previous holder's domain is still not empty after the kill wait (${JSON.stringify(line.domain)})`,
          { lock: lock.name, path: lock.v3Path, domain: line.domain ?? null, killWaitMs },
        );
      }
      return { result: 'held', reason: line.reason ?? 'kernel-lock-held', ...(line.holders !== undefined ? { holders: line.holders } : {}) };
    case 'timeout':
      return { result: 'timeout', waitedMs: Number.isInteger(line.waitedMs) ? line.waitedMs : (wait.kind === 'ms' ? wait.ms : 0) };
    case 'killed':
      // The helper hung past wait + kill bound and this process killed it;
      // the description is closed, so nothing can be held.
      return { result: 'timeout', waitedMs: wait.kind === 'ms' ? wait.ms : 0 };
    case 'unavailable':
      throw new HolderLockError('lock-driver-unavailable', `${lock.name}: ${line.detail}`, { reason: line.reason, lock: lock.name, path: lock.v3Path });
    default:
      throw new HolderLockError('lock-route-bad-output', `${lock.name}: unexpected route answer ${JSON.stringify(line.result)}`, { lock: lock.name, line });
  }
}

/**
 * acquireSync(scope, name, params, { waitMs }) ->
 *   { result: 'acquired', handle } | { result: 'held', reason, holders? } | { result: 'timeout', waitedMs }
 *
 * `params` fills the registry row's path template (`fgosDir`, `lockRoot`,
 * `runDir`, `cwd`, ...). Without `waitMs` this is one try; with it the
 * helper retries until `waitMs` has elapsed, and this process blocks for at
 * most waitMs + killWaitMs + slack before killing the helper (result
 * `timeout`, nothing held). Throws the named errors: `lock-order-violation`,
 * `lock-driver-unavailable`, `lock-predecessor-domain-not-empty`,
 * `lock-config-invalid`, `lock-path-param-missing`, `unknown-lock`.
 */
export function acquireSync(scope, name, params = {}, { waitMs } = {}) {
  const wait = normalizeWait(waitMs);
  const prepared = prepareAcquire(scope, name, params);
  if (lockTransport() === 'hold') return acquireHoldSync(scope, prepared, wait);
  const { lock, bin, killWaitMs, env } = prepared;
  for (let attempt = 0; attempt < INODE_RETRIES; attempt += 1) {
    const fd = openLockFile(lock.v3Path);
    let line;
    try {
      line = runLockRouteSync({ bin, args: modeArgs(wait, killWaitMs, prepared.predecessorKinds), fd, timeoutMs: routeTimeoutMs(wait, killWaitMs), env });
    } catch (err) {
      closeQuietly(fd);
      throw err;
    }
    if (line.result === 'acquired') {
      if (sameInode(fd, lock.v3Path)) return { result: 'acquired', handle: makeHandle(prepared, scope, { fd }) };
      closeQuietly(fd);
      continue;
    }
    closeQuietly(fd);
    return settleNotAcquired(line, lock, wait, killWaitMs);
  }
  throw new HolderLockError('lock-inode-unstable', `${lock.name}: ${lock.v3Path} was replaced ${INODE_RETRIES} times during acquire`, { lock: lock.name, path: lock.v3Path });
}

/** One helper, the whole wait inside it (`--wait-ms`); this process polls for
 * its answer, blocking at most wait + kill bound + slack before it ends the
 * helper and reports `timeout`. */
function acquireHoldSync(scope, prepared, wait) {
  const { lock, bin, killWaitMs, env } = prepared;
  const hold = startHold({ bin, lockPath: lock.v3Path, wait, killWaitMs, predecessorKinds: prepared.predecessorKinds, env });
  const { line } = waitReadySync(hold, bin, readyBoundMs(wait, killWaitMs, ROUTE_SLACK_MS));
  if (line === null) return settleNotAcquired({ result: 'killed' }, lock, wait, killWaitMs);
  if (line.result === 'acquired') return { result: 'acquired', handle: makeHandle(prepared, scope, { hold }) };
  removeWorkDir(hold.work);
  return settleNotAcquired(line, lock, wait, killWaitMs);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * acquire(scope, name, params, { waitMs, pollMs }) -> same results as acquireSync
 *
 * The event-loop-friendly twin: one `--try` per poll, never a blocking
 * wait. Each try carries the same predecessor bound; `held` is retried
 * until `waitMs` has elapsed (then `timeout`), or returned at once when no
 * wait was asked for.
 */
export async function acquire(scope, name, params = {}, { waitMs, pollMs = DEFAULT_POLL_MS } = {}) {
  const wait = normalizeWait(waitMs);
  const prepared = prepareAcquire(scope, name, params);
  const reservation = scope.reserve(prepared.lock.name, prepared.lock.rank);
  try {
    return await acquireLoop(scope, prepared, wait, pollMs);
  } finally {
    scope.untrack(reservation);
  }
}

/** One `--try` on the fd transport: `{ line, claim }`; `claim` is the open
 * description when the answer is `acquired`, else it is already closed. */
async function attemptFd(prepared, tryOnce) {
  const { lock, bin, killWaitMs, env } = prepared;
  for (let attempt = 0; attempt < INODE_RETRIES; attempt += 1) {
    const fd = openLockFile(lock.v3Path);
    let answer;
    try {
      answer = await runLockRoute({ bin, args: modeArgs(tryOnce, killWaitMs, prepared.predecessorKinds), fd, timeoutMs: routeTimeoutMs(tryOnce, killWaitMs), env });
    } catch (err) {
      closeQuietly(fd);
      throw err;
    }
    if (answer.result === 'acquired' && !sameInode(fd, lock.v3Path)) {
      closeQuietly(fd);
      continue;
    }
    if (answer.result !== 'acquired') closeQuietly(fd);
    return { line: answer, claim: { fd } };
  }
  throw new HolderLockError('lock-inode-unstable', `${lock.name}: ${lock.v3Path} was replaced ${INODE_RETRIES} times during acquire`, { lock: lock.name, path: lock.v3Path });
}

/** One `--try` helper on the hold transport, same shape as `attemptFd`. */
async function attemptHold(prepared, tryOnce) {
  const { lock, bin, killWaitMs, env } = prepared;
  const hold = startHold({ bin, lockPath: lock.v3Path, wait: tryOnce, killWaitMs, predecessorKinds: prepared.predecessorKinds, env });
  const { line } = await waitReady(hold, bin, readyBoundMs(tryOnce, killWaitMs, ROUTE_SLACK_MS));
  if (line === null) return { line: { result: 'killed' }, claim: null };
  if (line.result !== 'acquired') removeWorkDir(hold.work);
  return { line, claim: { hold } };
}

async function acquireLoop(scope, prepared, wait, pollMs) {
  const { lock, killWaitMs } = prepared;
  const attemptOnce = lockTransport() === 'hold' ? attemptHold : attemptFd;
  const startedAt = Date.now();
  const deadline = wait.kind === 'ms' ? startedAt + wait.ms : null;
  const tryOnce = { kind: 'try' };
  for (;;) {
    const { line, claim } = await attemptOnce(prepared, tryOnce);
    if (line.result === 'acquired') return { result: 'acquired', handle: makeHandle(prepared, scope, claim) };
    const stillHeld = line.result === 'held' && line.reason !== 'predecessor-domain-not-empty';
    if (stillHeld && deadline !== null) {
      const now = Date.now();
      if (now < deadline) {
        await sleep(Math.min(pollMs, deadline - now));
        continue;
      }
      return { result: 'timeout', waitedMs: now - startedAt };
    }
    return settleNotAcquired(line, lock, wait, killWaitMs);
  }
}

/**
 * probe(name, params) -> { result: 'free' | 'held' }
 *
 * A non-blocking shared try on a fresh description, closed at once: tells
 * whether somebody holds the lock without obstructing anyone.
 */
export function probe(name, params = {}) {
  const lock = resolveLock(name, params);
  const bin = hostBin({ fgosDir: params.fgosDir });
  ensureLockFile(lock);
  assertDriverUsable(lock.v3Path, { fgosDir: params.fgosDir });
  let line;
  if (lockTransport() === 'hold') {
    line = runLockRouteSync({ bin, args: ['--probe', path.resolve(lock.v3Path)], timeoutMs: ROUTE_CALL_TIMEOUT_MS });
  } else {
    const fd = openLockFile(lock.v3Path);
    try {
      line = runLockRouteSync({ bin, args: ['--shared-try'], fd, timeoutMs: ROUTE_CALL_TIMEOUT_MS });
    } finally {
      closeQuietly(fd);
    }
  }
  if (line.result === 'free' || line.result === 'held') return { result: line.result };
  // A probe answers free or held; a helper that hung is an error, never a
  // `timeout` the caller would have to read as one of those two.
  if (line.result === 'killed') {
    throw new HolderLockError('lock-route-error', `${lock.name}: the probe helper did not answer within ${ROUTE_CALL_TIMEOUT_MS} ms and was killed`, { lock: lock.name });
  }
  return settleNotAcquired(line, lock, { kind: 'try' });
}

/**
 * lockHolders(name, params) -> { kind: 'list', pids } | { kind: 'unlistable', reason }
 *
 * The processes holding a description of the lock file right now, as the
 * kernel shows them (Linux /proc scan). Diagnostic; never a lock decision.
 */
export function lockHolders(name, params = {}) {
  const lock = resolveLock(name, params);
  return descriptionHolders(lock.v3Path);
}

function isGit(command) {
  return path.basename(String(command)).replace(/\.exe$/i, '') === 'git';
}

function borrowedArgv(command, args) {
  const list = Array.isArray(args) ? args.map(String) : [];
  // git 2.34+ runs `gc --auto` as a daemon that would inherit the borrowed
  // description and keep the lock after the commit returned: never on this path.
  return isGit(command) ? ['-c', 'gc.auto=0', '-c', 'maintenance.auto=false', ...list] : list;
}

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function leftoverError(handle, remaining, extra) {
  return new HolderLockError(
    'borrow-leftover-not-killed',
    `${handle.name}: ${remaining.length} process(es) still hold the borrowed description after ${handle.killWaitMs} ms: ${remaining.join(', ')}`,
    { lock: handle.name, pids: remaining, ...extra },
  );
}

/** Release step 0: Rust applies the refined description-domain rule. */
function sweepAnswer(handle, answer) {
  if (!['drained', 'not-drained'].includes(answer.result) || !Array.isArray(answer.remaining) || (answer.result === 'not-drained' && answer.remaining.length === 0)) {
    throw new HolderLockError('borrow-leftover-not-killed', `${handle.name}: Rust drain did not prove completion`, { lock: handle.name, result: answer.result });
  }
  return answer;
}
function sweepRequest(handle, childPid) {
  return {
    bin: hostBin({ fgosDir: handle.projectRoot && path.join(handle.projectRoot, '.fgos') }),
    args: ['--drain-child', String(childPid), '--kill-wait-ms', String(handle.killWaitMs), '--protected-roots', [...descriptionOf(handle).borrowRoots].filter(pid => pid !== childPid).join(',') || '-', '--reach-floor-ticks', String(descriptionOf(handle).reachFloorTicks ?? '-')],
    fd: descriptionOf(handle).fd,
    timeoutMs: handle.killWaitMs + ROUTE_SLACK_MS,
  };
}
function sweepLeftoversSync(handle, childPid) {
  if (leftoverSweep() !== 'holders') return sweepProcessGroup(childPid);
  return sweepAnswer(handle, runLockRouteSync(sweepRequest(handle, childPid)));
}
async function sweepLeftovers(handle, childPid) {
  if (leftoverSweep() !== 'holders') return sweepProcessGroup(childPid);
  const entry = descriptionOf(handle);
  entry.sweeps += 1;
  try { return sweepAnswer(handle, await runLockRoute(sweepRequest(handle, childPid))); }
  finally { entry.sweeps -= 1; }
}

function sweepProcessGroup(childPid) {
  if (Number.isInteger(childPid) && childPid > 0) {
    try {
      process.kill(-childPid, 'SIGKILL');
    } catch {
      // the group is already gone
    }
  }
  return { leftoversKilled: 0, remaining: [] };
}

/** The named error for a helper answer that is not a clean result. */
function borrowError(handle, spec, result) {
  switch (result.error) {
    case 'borrow-leftover-not-killed':
      return leftoverError(handle, Array.isArray(result.pids) ? result.pids : [], { exit: result.exit ?? null, signal: null });
    case 'borrow-spawn-failed':
      return new HolderLockError('borrow-spawn-failed', `${handle.name}: cannot run ${spec.command}: ${result.message ?? 'spawn failed'}`, { lock: handle.name, cause: null });
    default:
      return new HolderLockError(result.error, `${handle.name}: ${result.message ?? result.error}`, { lock: handle.name });
  }
}

/** runBorrowed on the hold transport: the helper runs the child in a job and
 * ends the job (the release rule) before it answers, so there is no sweep here. */
function runBorrowedHold(handle, entry, spec, sync) {
  if (spec.stdin !== undefined && spec.stdin !== 'ignore') {
    throw new HolderLockError('borrow-spec-invalid', `${handle.name}: a borrowed child's stdin is always null on this platform, got ${JSON.stringify(spec.stdin)}`, { lock: handle.name });
  }
  entry.borrows += 1;
  if (sync) {
    let answer;
    try {
      answer = borrowSync(entry.hold, spec, { killWaitMs: handle.killWaitMs });
    } finally {
      entry.borrows -= 1;
    }
    if (answer.result.error) throw borrowError(handle, spec, answer.result);
    return { exit: answer.result.exit ?? null, signal: null, stdout: answer.stdout, stderr: answer.stderr, leftoversKilled: answer.result.leftoversKilled ?? 0 };
  }
  let settle;
  const borrowed = new Promise((resolve, reject) => {
    settle = { resolve, reject };
  });
  borrowed.catch(() => {});
  let child;
  try {
    child = borrowAsync(entry.hold, spec, {
      killWaitMs: handle.killWaitMs,
      onResult: (result) => {
        entry.borrows -= 1;
        if (result.error) settle.reject(borrowError(handle, spec, result));
        else settle.resolve({ exit: result.exit ?? null, signal: null, leftoversKilled: result.leftoversKilled ?? 0 });
      },
    });
  } catch (err) {
    entry.borrows -= 1;
    throw err;
  }
  child.borrowed = borrowed;
  return child;
}

/**
 * runBorrowed(handle, spec, { sync }) -- the one way a child command runs
 * with the holder's authority. `spec = { command, args, cwd, env, stdin, input, detached, maxOutputBytes }`.
 * `input` supplies synchronous fd-transport stdin when `stdin: pipe`; the
 * hold transport retains its null-stdin contract.
 * The description goes to the child at slot 3 and `FGOS_LOCK_FD=<name>:3`
 * names it; a git command gets `-c gc.auto=0 -c maintenance.auto=false`
 * in front of its arguments. After the child exits, whatever still holds
 * the description is killed and the call returns only once the kernel
 * shows the holder alone (`borrow-leftover-not-killed` past the bound).
 *
 * sync (default): returns `{ exit, signal, stdout, stderr, leftoversKilled }`.
 * async (`{ sync: false }`): returns the ChildProcess at once; its
 * `borrowed` promise resolves `{ exit, signal, leftoversKilled }` after the
 * sweep. The handle refuses to release while that promise is pending.
 */
export function runBorrowed(handle, spec, { sync = true } = {}) {
  const entry = descriptionOf(handle);
  if (entry.released) throw new HolderLockError('lock-handle-released', `${handle.name}: cannot borrow a released lock`, { lock: handle.name });
  if (!spec || typeof spec.command !== 'string' || !spec.command) {
    throw new HolderLockError('borrow-spec-invalid', 'runBorrowed needs spec.command', {});
  }
  if (spec.maxOutputBytes !== undefined && (!Number.isSafeInteger(spec.maxOutputBytes) || spec.maxOutputBytes < 1)) throw new HolderLockError('borrow-spec-invalid', 'maxOutputBytes must be a positive safe integer', {});
  if (entry.fd !== null && !sameInode(entry.fd, handle.path)) throw new HolderLockError('lock-resource-replaced', `${handle.name}: the held lock resource was replaced`, {});
  if (entry.hold) return runBorrowedHold(handle, entry, spec, sync);
  const argv = borrowedArgv(spec.command, spec.args);
  const childEnv = { ...(spec.env ?? process.env), [LOCK_FD_ENV]: `${handle.name}:${LOCK_FD_SLOT}` };
  const stdio = [spec.stdin ?? 'ignore', 'pipe', 'pipe', entry.fd];
  // The group sweep needs the child to lead a process group; a caller that
  // signals the child's group itself asks for one everywhere.
  // A drain's protected-root snapshot must not miss a newly spawned sibling.
  if (entry.sweeps > 0) throw new HolderLockError('borrow-drain-in-progress', `${handle.name}: borrow drain in progress`, { lock: handle.name, retryable: true });
  const detached = borrowLeadsGroup(spec);

  if (sync) {
    entry.borrows += 1;
    let res;
    try {
      res = spawnSync(spec.command, argv, { cwd: spec.cwd, env: childEnv, stdio, detached, encoding: 'utf8', maxBuffer: spec.maxOutputBytes ?? MAX_OUTPUT_BYTES, ...(spec.input === undefined ? {} : { input: spec.input }), windowsHide: true });
    } catch (err) {
      entry.borrows -= 1;
      throw err;
    }
    let sweep;
    try {
      sweep = res.pid ? sweepLeftoversSync(handle, res.pid) : { remaining: [], leftoversKilled: 0 };
    } finally {
      entry.borrows -= 1;
    }
    if (sweep.remaining.length > 0) throw leftoverError(handle, sweep.remaining, { exit: res.status, signal: res.signal });
    if (res.error) {
      throw new HolderLockError('borrow-spawn-failed', `${handle.name}: cannot run ${spec.command}: ${res.error.message}`, { lock: handle.name, cause: res.error.code ?? null });
    }
    return { exit: res.status, signal: res.signal, stdout: res.stdout, stderr: res.stderr, leftoversKilled: sweep.leftoversKilled };
  }

  const child = spawn(spec.command, argv, { cwd: spec.cwd, env: childEnv, stdio, detached, windowsHide: true });
  entry.borrows += 1;
  if (child.pid) entry.borrowRoots.add(child.pid);
  let settled = false;
  const finish = () => {
    if (settled) return false;
    settled = true;
    entry.borrowRoots.delete(child.pid);
    entry.borrows -= 1;
    return true;
  };
  child.borrowed = new Promise((resolve, reject) => {
    child.once('error', (err) => {
      if (!finish()) return;
      reject(new HolderLockError('borrow-spawn-failed', `${handle.name}: cannot run ${spec.command}: ${err.message}`, { lock: handle.name, cause: err.code ?? null }));
    });
    child.once('exit', (exit, signal) => {
      entry.borrowRoots.delete(child.pid);
      sweepLeftovers(handle, child.pid).then((sweep) => {
        if (!finish()) return;
        if (sweep.remaining.length > 0) reject(leftoverError(handle, sweep.remaining, { exit, signal }));
        else resolve({ exit, signal, leftoversKilled: sweep.leftoversKilled });
      }, (err) => {
        if (finish()) reject(err);
      });
    });
  });
  // A caller that only reads the child's exit must still not crash the
  // process on a sweep failure; awaiting `borrowed` still sees it.
  child.borrowed.catch(() => {});
  return child;
}

/**
 * spawnWithLocks(handles, spec) -- start one detached child that keeps the locks alive on its own.
 * `spec = { command, args, cwd, env, stdout, stderr }` (`stdout`/`stderr` are open file descriptors
 * or omitted for the null device). The child leads its own session, has no IPC channel, and receives
 * the description of `handles[i]` at descriptor `3 + i`; every other descriptor of this process stays
 * closed in it. Returns the ChildProcess, already unreferenced; the caller still owns every handle and
 * releases them (closing its own copies) once the child has taken over.
 *
 * Only the descriptor transport can hand a lock over: where a lock lives in a helper process (Windows)
 * the call throws `lock-transport-hold` and the child takes the lock itself.
 */
export function spawnWithLocks(handles, spec) {
  if (!Array.isArray(handles) || handles.length === 0 || !spec || typeof spec.command !== 'string' || !spec.command) {
    throw new HolderLockError('spawn-spec-invalid', 'spawnWithLocks needs handles and spec.command', {});
  }
  const fds = handles.map((handle) => {
    const entry = descriptionOf(handle);
    if (entry.released) throw new HolderLockError('lock-handle-released', `${handle.name}: cannot hand over a released lock`, { lock: handle.name });
    if (entry.sweeps > 0) throw new HolderLockError('borrow-drain-in-progress', `${handle.name}: borrow drain in progress`, { lock: handle.name, retryable: true });
    if (entry.fd === null) throw new HolderLockError('lock-transport-hold', `${handle.name}: this platform keeps the lock in a helper; the child must take it itself`, { lock: handle.name });
    return entry.fd;
  });
  const stdio = ['ignore', spec.stdout ?? 'ignore', spec.stderr ?? 'ignore', ...fds];
  const child = spawn(spec.command, spec.args ?? [], { cwd: spec.cwd, env: spec.env ?? process.env, stdio, detached: true, windowsHide: true });
  // A program that cannot start is reported asynchronously: keep it on the child for the caller to read
  // instead of letting an unhandled 'error' event end this process.
  child.once('error', (err) => { child.spawnError = err; });
  child.unref();
  return child;
}

/**
 * checkBorrowedDescription(lockPath, { env }) ->
 *   { result: 'borrower', name } | { result: 'not-borrower', reason, name }
 *
 * For a process that may have inherited a borrowed description (a git
 * hook): reads `FGOS_LOCK_FD=<name>:<slot>` from `env`, hands that slot to
 * the route's borrower test (same dev:ino as `lockPath`, and a
 * non-blocking exclusive lock on the inherited description succeeds). A
 * sibling that opened the file itself fails that test. No env -> not a
 * borrower, no route call.
 */
export function checkBorrowedDescription(lockPath, { env = process.env, fgosDir } = {}) {
  if (lockTransport() === 'hold') return checkBorrowedJob(lockPath, { env, fgosDir });
  const raw = env[LOCK_FD_ENV];
  const match = typeof raw === 'string' ? /^([^:]+):(\d+)$/.exec(raw) : null;
  if (!match) return { result: 'not-borrower', reason: 'fd-missing', name: null };
  const name = match[1];
  const slot = Number(match[2]);
  const bin = hostBin({ fgosDir });
  // The route sees the inherited description at its own slot 3, so it is told
  // that slot, whatever number the caller's process gave the descriptor.
  const childEnv = routeEnv({ ...process.env, [LOCK_FD_ENV]: `${name}:${LOCK_FD_SLOT}` });
  const line = runLockRouteSync({ bin, args: ['--borrowed-check', path.resolve(lockPath)], fd: slot, timeoutMs: ROUTE_CALL_TIMEOUT_MS, env: childEnv });
  return borrowedAnswer(line, name);
}

/** The route's answer to a borrower check, as the facade reports it. */
function borrowedAnswer(line, name) {
  if (line.result === 'borrower') return { result: 'borrower', name };
  if (line.result === 'not-borrower') return { result: 'not-borrower', reason: line.reason ?? 'lock-not-held-by-description', name };
  if (line.result === 'unavailable') {
    throw new HolderLockError('lock-driver-unavailable', `${name}: ${line.detail}`, { reason: line.reason, lock: name });
  }
  throw new HolderLockError('lock-route-bad-output', `${name}: unexpected borrowed-check answer ${JSON.stringify(line.result)}`, { lock: name, line });
}

/** The hold transport's borrower check: no descriptor exists, so the route
 * judges the process by the job named in `FGOS_LOCK_JOB` (membership, the
 * predecessor record, the holder among its ancestors). The caller's own
 * environment reaches the route, because membership is the process's own. */
function checkBorrowedJob(lockPath, { env, fgosDir }) {
  const raw = env[LOCK_JOB_ENV];
  const match = typeof raw === 'string' ? /^([^:]+):(.+)$/.exec(raw) : null;
  if (!match) return { result: 'not-borrower', reason: 'job-missing', name: null };
  const name = match[1];
  const bin = hostBin({ fgosDir });
  const line = runLockRouteSync({ bin, args: ['--borrowed-check', path.resolve(lockPath)], timeoutMs: ROUTE_CALL_TIMEOUT_MS, env: routeEnv({ ...process.env, ...env }) });
  return borrowedAnswer(line, name);
}

/** Read-only predecessor observation; never acquires or edits the record. */
export function predecessorState(lockPath, { fgosDir } = {}) {
  return runLockRouteSync({ bin: hostBin({ fgosDir }), args: ['--predecessor-state', path.resolve(lockPath)], timeoutMs: ROUTE_CALL_TIMEOUT_MS });
}

/** Private registration seam, imported only by native-handover.mjs. No
 * description accessor escapes: mint and consume within the same call. */
export function registerNativeHandover(mint, dispose) {
  if (nativeRegistered) throw new HolderLockError('lock-handover-already-registered', 'native bridge already registered', {});
  nativeRegistered = true;
  return (handles, call) => {
    if (process.platform === 'win32') throw new HolderLockError('git-lock-handover-unsupported', 'native description handover unavailable', {});
    const entries = handles.map(handle => {
      const entry = descriptionOf(handle);
      if (entry.released) throw new HolderLockError('lock-handle-released', 'cannot hand over a released lock', {});
      if (entry.sweeps > 0) throw new HolderLockError('borrow-drain-in-progress', `${handle.name}: borrow drain in progress`, { lock: handle.name, retryable: true });
      if (entry.fd === null) throw new HolderLockError('git-lock-handover-unsupported', 'description unavailable', {});
      return entry;
    });
    const loans = [];
    for (const entry of entries) entry.borrows += 1;
    try {
      for (let i = 0; i < handles.length; i += 1) {
        const handle = handles[i];
        loans.push(mint(entries[i].fd, handle.name, handle.path, handle.killWaitMs, entries[i].reachFloorTicks, [...entries[i].borrowRoots]));
      }
      // Native calls are synchronous; Externals are consumed once and closed
      // before this guard ends, including marshaling/validation failures.
      return call(loans);
    } finally {
      try { for (const loan of loans) dispose(loan); }
      finally { for (const entry of entries) entry.borrows -= 1; }
    }
  };
}
