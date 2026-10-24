// Transport. Recovery policy and resource locks belong to Rust.
import { hotLockDepth } from '../holder-lock/hot-guard.mjs';
import { loadNativeAddon, withNativeLocks } from './native.mjs';
export function createGitRecovery(options, loaderOptions) {
  const outside = () => { if (hotLockDepth() > 0) throw new Error('exec-under-hot-lock: Git Recovery'); };
  outside();
  const native = loadNativeAddon(loaderOptions);
  const port = new native.GitRecovery(options.stateRoot, options.repoPath, options.trustedMain, options.writer);
  return Object.freeze(Object.fromEntries(['inspectOperation', 'listPending', 'listRetainedLand', 'reconcile'].map(method => [method, (args = {}, held = []) => {
    outside(); return withNativeLocks(native, held, loans => port.call(method, args, loans));
  }])));
}
