// Typed transport: every call carries the caller's verified native loans.
import { hotLockDepth } from '../holder-lock/hot-guard.mjs';
import { loadNativeAddon, withNativeLocks } from './native.mjs';
export function createGitSafeRestore(options, loaderOptions) {
  const outside = () => { if (hotLockDepth() > 0) throw new Error('exec-under-hot-lock: Git SafeRestore'); };
  outside();
  const native = loadNativeAddon(loaderOptions);
  const port = new native.GitSafeRestore(options.stateRoot, options.repoPath, options.trustedMain, options.writer);
  return Object.freeze(Object.fromEntries(['preview', 'apply', 'recover', 'listSnapshot', 'extractPath', 'acknowledge'].map(method => [method, (args, held = []) => {
    outside(); return withNativeLocks(native, held, loans => port.call(method, args, loans));
  }])));
}
