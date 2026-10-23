// Dormant transport. Keep the native session alive across consumer verification.
import { hotLockDepth } from '../holder-lock/hot-guard.mjs';
import { loadNativeAddon, withNativeLocks } from './native.mjs';

// The port decides what waits and for how long; a call settles when its attempt does and never
// blocks this thread, so a holder in this process can release while a Land waits for it.
export function createGitLand(options, loaderOptions) {
  const outside = () => { if (hotLockDepth() > 0) throw new Error('exec-under-hot-lock: Git Land'); };
  outside();
  const native = loadNativeAddon(loaderOptions);
  const port = new native.GitLand(options.stateRoot, options.repoPath, options.trustedMain, options.writer);
  return Object.freeze({
    async prepare({ waitMs = 0, ...args }, held = []) { outside(); return withNativeLocks(native, held, loans => port.prepare({ ...args, waitMs }, loans)); },
    recover(args, held = []) { outside(); return withNativeLocks(native, held, loans => port.recover(args, loans)); },
    async publish(evidence, { waitMs = 0 } = {}) { outside(); return port.publish(evidence, waitMs); },
    close() { outside(); port.close(); },
  });
}
