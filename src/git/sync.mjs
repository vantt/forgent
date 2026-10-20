// Typed transport; Rust owns every effect and authority check.
import { hotLockDepth } from '../holder-lock/hot-guard.mjs';
import { loadNativeAddon, withNativeLocks } from './native.mjs';
export function createGitSync(options, loaderOptions) {
  const outside = () => { if (hotLockDepth() > 0) throw new Error('exec-under-hot-lock: Git Sync'); };
  outside();
  const native = loadNativeAddon(loaderOptions);
  const port = new native.GitSync(options.stateRoot, options.repoPath, options.trustedMain, options.writer);
  return Object.freeze(Object.fromEntries(['start', 'prepare', 'inspect', 'continue', 'abort'].map(method => [method, (args = {}, held = []) => {
    outside();
    return withNativeLocks(native, held, loans => port.call(method, args, loans));
  }])));
}
