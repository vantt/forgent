// Dormant transport. Keep the native session alive across consumer verification.
import { hotLockDepth } from '../state/hot-lock.mjs';
import { loadNativeAddon, withNativeLocks } from './native.mjs';
export function createGitLand(options, loaderOptions) {
  const outside = () => { if (hotLockDepth() > 0) throw new Error('exec-under-hot-lock: Git Land'); };
  outside();
  const native = loadNativeAddon(loaderOptions);
  const port = new native.GitLand(options.stateRoot, options.repoPath, options.trustedMain, options.writer);
  return Object.freeze({
    prepare(args, held = []) { outside(); return withNativeLocks(native, held, loans => port.prepare(args, loans)); },
    recover(args, held = []) { outside(); return withNativeLocks(native, held, loans => port.recover(args, loans)); },
    publish(evidence) { outside(); return port.publish(evidence); },
    close() { outside(); port.close(); },
  });
}
