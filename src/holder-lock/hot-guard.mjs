// Shared critical-section depth and process guard; no consumer dependencies.
import childProcess from 'node:child_process';
import nodeModule from 'node:module';

/** Error raised by hot-lock operations. `code` is the contract name; `category` feeds
 * the CLI's exit-code table (a timeout is `lock-timeout`, the rest are
 * caller-correctable `precondition`s). */
export class HotLockError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'HotLockError';
    this.code = code;
    this.category = code === 'hot-lock-timeout' ? 'lock-timeout' : 'precondition';
    Object.assign(this, details);
  }
}

// --- critical-section depth and the child-process guard ------------------

let depth = 0;
export function enterHotLock() {
  depth += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    depth = Math.max(0, depth - 1);
  };
}

/** Whether this process is inside a hot critical section right now. */
export function hotLockDepth() {
  return depth;
}

function failIfInside(what) {
  if (depth > 0) {
    throw new HotLockError('exec-under-hot-lock', `${what} was called inside a hot-lock critical section; resolve it before taking the lock and pass it in`);
  }
}

function guarded(name, original) {
  const wrapper = function guardedChildProcessCall(...args) {
    failIfInside(`child_process.${name}`);
    return Reflect.apply(original, this, args);
  };
  // util.promisify.custom and friends live on the original as symbols.
  for (const key of Reflect.ownKeys(original)) {
    if (!(key in wrapper) || typeof key === 'symbol') {
      Object.defineProperty(wrapper, key, Object.getOwnPropertyDescriptor(original, key));
    }
  }
  wrapper.__hotLockGuard = true;
  return wrapper;
}

/** Wrap every child-process entry once per process, then re-sync the ESM
 * namespace so `import { execFileSync } from 'node:child_process'` that was
 * linked before this module loaded sees the wrapper too. */
function installChildProcessGuard() {
  for (const name of ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']) {
    if (typeof childProcess[name] === 'function' && !childProcess[name].__hotLockGuard) {
      childProcess[name] = guarded(name, childProcess[name]);
    }
  }
  const proto = childProcess.ChildProcess?.prototype;
  if (proto && !proto.spawn.__hotLockGuard) proto.spawn = guarded('ChildProcess.prototype.spawn', proto.spawn);
  nodeModule.syncBuiltinESMExports();
}

installChildProcessGuard();

