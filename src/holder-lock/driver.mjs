// driver.mjs -- the only module of the facade that knows the native door,
// the host binary and a file descriptor. Every lock operation runs in this
// process through the `holderLock` namespace of the combined addon: the
// capability that lets it act on an open description is taken here once and
// never leaves this module. The host binary is still needed for the two
// processes that remain (`lock-fd --borrowed-check` and the Windows
// `lock-hold` helper) and is found once per process (FGOS_HOST_BIN, then the
// activation). Nothing here decides a lock result: it carries the door's
// answer or names why there is none.
//
// There is no fallback to a lock implemented in Node: without the addon every
// acquire fails with `lock-driver-unavailable`.

import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { resolveActiveHostBin, routeEnv } from '../util/host-bin-path.mjs';
import { nativeDoor, nativeHelperExe } from '../native/door.mjs';
import { HolderLockError, PROTOCOL, parseRouteLine } from './protocol.mjs';

const MAX_OUTPUT_BYTES = 64 * 1024;
/** Bound for the route calls that neither wait nor kill: the borrowed check. */
export const ROUTE_CALL_TIMEOUT_MS = 2000;
/** Headroom added to every bounded wait, so the helper is only killed when it really hung. */
export const ROUTE_SLACK_MS = 1000;

/**
 * How a lock reaches the kernel from Node: `fd` hands an open description to
 * `lock-fd` (POSIX flock), `hold` keeps one `lock-hold` helper alive per held
 * lock (Windows LockFileEx belongs to the process that took it). The only
 * place that looks at the platform; the facade branches on this answer.
 */
export function lockTransport(platform = process.platform) {
  return platform === 'win32' ? 'hold' : 'fd';
}

/**
 * How a borrow on the fd transport finds what its child left behind: `holders`
 * lists the processes that hold the description (Linux /proc), `group`
 * signals the child's process group (macOS). The hold transport never asks:
 * its helper ends the borrow's job itself.
 */
export function leftoverSweep(platform = process.platform) {
  return platform === 'linux' ? 'holders' : 'group';
}

/** Whether a borrowed child on the fd transport must lead its own process
 * group: when the group sweep needs it, or the caller signals the group. */
export function borrowLeadsGroup(spec, platform = process.platform) {
  return spec.detached === true || (platform !== 'linux' && platform !== 'win32');
}

let resolvedBin = null;

/**
 * The host binary, resolved once per process on first success. `fgosDir`
 * and `cwd` only matter for that first resolution (the activation next to
 * the store, then the nearest activation above cwd). No binary -> the named
 * error, with every place looked at.
 */
export function hostBin({ fgosDir, cwd } = {}) {
  if (resolvedBin) return resolvedBin;
  const { bin, tried } = resolveActiveHostBin({ fgosDir, cwd });
  if (!bin) {
    throw new HolderLockError(
      'lock-driver-unavailable',
      `no fgos host binary found (tried: ${tried.join('; ')}); run through the \`fgos\` command of an activated workspace, or set FGOS_HOST_BIN to a host binary`,
      { reason: 'no-host-binary', tried },
    );
  }
  resolvedBin = bin;
  return bin;
}

function unavailable(reason, detail, extra = {}) {
  return new HolderLockError('lock-driver-unavailable', detail, { reason, ...extra });
}

/** The next step every route failure that is not a version mismatch names. */
const ROUTE_NEXT_STEP = 'Run `fgos doctor`; if the host binary is stale or broken, rebuild the host from this checkout (`npm run fgos:dev`) or restage the active release.';

/** Turn a finished child (spawnSync result, or the same fields collected
 * from spawn) into the route's parsed line, or throw the named error. A
 * child this process killed on its own deadline comes back as
 * `{ result: 'killed' }`: nothing was acquired, the caller closes its fd. */
function interpretRoute({ status, signal, stdout, stderr, error, timedOut }, bin, verb) {
  if (error && (error.code === 'ENOENT' || error.code === 'EACCES')) {
    throw unavailable('no-host-binary', `cannot run ${bin} (${error.code})`, { tried: [bin] });
  }
  if (timedOut || (error && error.code === 'ETIMEDOUT')) {
    return { v: PROTOCOL, protocol: PROTOCOL, result: 'killed' };
  }
  if (error) {
    throw new HolderLockError('lock-route-error', `${bin} ${verb} failed to run: ${error.message}. ${ROUTE_NEXT_STEP}`, { cause: error.code ?? null });
  }
  const text = String(stdout ?? '');
  if (text.trim() === '') {
    const err = String(stderr ?? '').trim();
    if (/unknown verb "internal"/.test(err)) {
      throw unavailable('host-version-mismatch', `${bin} has no "internal" route: the active release is older than this payload; restage/activate it (fgctl), or set FGOS_HOST_BIN to a host built from this checkout`);
    }
    if (/host-version-mismatch/.test(err)) {
      throw unavailable('host-version-mismatch', `${bin} ${verb} refused protocol ${PROTOCOL}: ${err.slice(0, 300)}`);
    }
    const how = signal ? `signal ${signal}` : `exit ${status}`;
    throw new HolderLockError('lock-route-bad-output', `${bin} ${verb} printed nothing (${how})${err ? `: ${err.slice(0, 300)}` : ''}. ${ROUTE_NEXT_STEP}`, { status, signal, stderr: err.slice(0, 300) });
  }
  return routeLineOrThrow(parseRouteLine(text, bin), bin, verb, status);
}

/** A parsed route line, or the named error when the route answered `error`.
 * Shared by the fd transport (stdout) and the hold transport (`ready.json`). */
export function routeLineOrThrow(line, bin, verb, status = null) {
  if (line.result === 'error') {
    if (line.code === 'host-version-mismatch') throw unavailable('host-version-mismatch', `${bin} ${verb}: ${line.message}`);
    if (line.code === 'usage') throw new HolderLockError('lock-route-usage', `${bin} ${verb}: ${line.message}`, { argv: verb });
    throw new HolderLockError('lock-route-error', `${bin} ${verb}: ${line.message}. ${ROUTE_NEXT_STEP}`, { routeCode: line.code, status });
  }
  return line;
}

function lockFdArgv(args) {
  return ['internal', 'lock-fd', '--protocol', String(PROTOCOL), ...args];
}

/**
 * Run `fgos internal lock-fd <args>` and wait. `fd`, when given, is handed to
 * the child at slot 3 (the one moment the description is not close-on-exec).
 * The child is killed with SIGKILL at `timeoutMs`; when this returns the
 * helper is dead and reaped, whatever happened.
 */
export function runLockRouteSync({ bin, args, fd, timeoutMs, env = routeEnv() }) {
  const stdio = fd === undefined ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'pipe', 'pipe', fd];
  const res = spawnSync(bin, lockFdArgv(args), {
    env,
    encoding: 'utf8',
    stdio,
    timeout: timeoutMs,
    killSignal: 'SIGKILL',
    maxBuffer: MAX_OUTPUT_BYTES,
    windowsHide: true,
  });
  return interpretRoute(res, bin, `lock-fd ${args.join(' ')}`);
}

// --- the door -------------------------------------------------------------

const ADDON_NEXT_STEP = {
  'addon-not-shipped': 'onboard this project with `fgctl init`, or run through `npm run fgos:dev` from a checkout',
  'addon-unavailable': 'the release does not carry a loadable addon; restage/activate it (fgctl), or rebuild with `npm run fgos:dev`',
};

function doorUnavailable(err) {
  if (err instanceof HolderLockError) return err;
  const reason = err?.code === 'git-addon-not-shipped' ? 'addon-not-shipped' : 'addon-unavailable';
  return unavailable(reason, `${err.message} (${ADDON_NEXT_STEP[reason]})`);
}

/** Map a failure of a door call: the door's own (single load, missing driver, no `holderLock`) is `lock-driver-unavailable`. */
function doorError(err) {
  if (err instanceof HolderLockError) return err;
  const message = String(err?.message ?? err);
  if (message.startsWith('holder-lock-unavailable:')) return unavailable('addon-unavailable', message);
  return new HolderLockError('lock-door-error', message, { cause: err?.code ?? null });
}

let door = null; // { ns, capability } taken once on first use; never exported

function lockDoor() {
  if (door) return door;
  let addon;
  try {
    addon = nativeDoor();
  } catch (err) {
    throw doorUnavailable(err);
  }
  try {
    door = { ns: addon.holderLock, capability: addon.holderLock.take() };
  } catch (err) {
    throw doorError(err);
  }
  return door;
}

/** Fail by name, before anything is created, when the lock door cannot be reached. */
export function assertLockDoor() {
  lockDoor();
}

function viaDoor(call) {
  const { ns, capability } = lockDoor();
  try {
    return call(ns, capability);
  } catch (err) {
    throw doorError(err);
  }
}

/** Lock the open description `fd`: `{ result, ... , lock? }`; `lock` (an acquired lock) belongs to the facade's entry for this fd. */
export const doorLockFd = (fd, wait, killWaitMs, predecessorKinds) => viaDoor((ns, cap) => ns.lockFd(cap, fd, 'ex', wait, killWaitMs, predecessorKinds ?? []));
/** The state root of `env` and what decided it: `{ stateRoot, lockRoot, source }`, the host's own formula. */
export const doorStateRoot = (env) => viaDoor((ns) => ns.stateRoot({ ...env }));
export const doorProbe = (lockPath) => viaDoor((ns) => ns.probe(path.resolve(lockPath)));
export const doorDrain = (lock, childPid, protectedRoots) => viaDoor((ns, cap) => ns.drainChild(cap, lock, childPid, protectedRoots));
export const doorClearDomain = (lock, lockPath) => viaDoor((ns, cap) => ns.clearDomain(cap, lock, path.resolve(lockPath)));
/** Settle a lock whose own descriptor is already closed: `{ settled: 'released' | 'stuck', killed, pids }`. */
export const doorReleaseFd = (lock) => viaDoor((ns, cap) => ns.releaseFd(cap, lock));
/** Drop the lock's duplicate without settling: the description lives on in the process it was handed to. */
export const doorCloseHandedOver = (lock) => viaDoor((ns, cap) => ns.closeHandedOver(cap, lock));
/** The processes holding `lockFile`, each with the origin Rust decided for the lock `name`. */
export const doorHolders = (lockFile, name) => viaDoor((ns) => ns.holders(path.resolve(lockFile), name));
export const doorPredecessorState = (lockFile) => viaDoor((ns) => ns.predecessorState(path.resolve(lockFile)));
/** Elapsed milliseconds of the two-process kernel-semantics probe in `dir`, with the release's own `fgos` as the holder helper where one is needed (Windows); a failure throws with the reason. */
export const doorTwoProcessProbe = (dir) => viaDoor((ns) => ns.twoProcessProbe(path.resolve(dir), nativeHelperExe(nativeDoor())));

const guarantees = new Map();

/**
 * The driver's guarantee for the directory `lockPath` lives in, asked of the
 * door once per directory and cached for the process. The directory must
 * exist (the door reads its filesystem).
 */
export function guaranteeFor(lockPath) {
  const dir = path.resolve(path.dirname(lockPath));
  const cached = guarantees.get(dir);
  if (cached) return cached;
  const guarantee = viaDoor((ns) => ns.guarantee(dir));
  guarantees.set(dir, guarantee);
  return guarantee;
}

/**
 * The guarantee of `lockPath`'s directory when the driver can exclude there;
 * the named `lock-driver-unavailable` otherwise (a network filesystem gives
 * `none`, a platform without a driver gives `unsupported`).
 */
export function assertDriverUsable(lockPath) {
  const guarantee = guaranteeFor(lockPath);
  const dir = path.dirname(lockPath);
  if (guarantee.exclusion === 'none') {
    throw unavailable('unsupported-filesystem', `${dir}: the ${guarantee.driver} driver gives no exclusion on this filesystem (${(guarantee.notes ?? []).join('; ')})`, { lockDir: dir, guarantee });
  }
  if (guarantee.exclusion === 'unsupported') {
    throw unavailable('unsupported-platform', `${dir}: no holder-lock driver on ${guarantee.platform} (${(guarantee.notes ?? []).join('; ')})`, { lockDir: dir, guarantee });
  }
  return guarantee;
}
