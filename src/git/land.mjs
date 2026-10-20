// Dormant transport. Keep the native session alive across consumer verification.
import { hotLockDepth } from '../state/hot-lock.mjs';
import { loadNativeAddon, withNativeLocks } from './native.mjs';

const lockUnavailable = (err) => {
  try { return String(JSON.parse(err.message).cause).startsWith('lock-acquire-unavailable'); } catch { return false; }
};

// A native wait blocks this thread, and with it every timer, child process and
// other Land of this process, including a holder it waits for. Single native
// attempts are spaced here instead, until the caller's budget is spent; an
// attempt that cannot get its lock has changed nothing.
async function within(waitMs = 0, attempt) {
  const deadline = Date.now() + waitMs;
  for (let pause = 5; ; pause = Math.min(pause * 2, 50)) {
    try { return attempt(); } catch (err) { if (!lockUnavailable(err) || Date.now() >= deadline) throw err; }
    await new Promise((resolve) => setTimeout(resolve, Math.max(0, Math.min(pause, deadline - Date.now()))));
  }
}

export function createGitLand(options, loaderOptions) {
  const outside = () => { if (hotLockDepth() > 0) throw new Error('exec-under-hot-lock: Git Land'); };
  outside();
  const native = loadNativeAddon(loaderOptions);
  const port = new native.GitLand(options.stateRoot, options.repoPath, options.trustedMain, options.writer);
  return Object.freeze({
    async prepare({ waitMs, ...args }, held = []) { outside(); return within(waitMs, () => withNativeLocks(native, held, loans => port.prepare({ ...args, waitMs: 0 }, loans))); },
    recover(args, held = []) { outside(); return withNativeLocks(native, held, loans => port.recover(args, loans)); },
    async publish(evidence, { waitMs } = {}) { outside(); return within(waitMs, () => port.publish(evidence, 0)); },
    close() { outside(); port.close(); },
  });
}
