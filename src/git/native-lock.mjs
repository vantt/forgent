// Explicit native repair; callers cannot supply or forge ownership evidence.
import { hotLockDepth } from '../holder-lock/hot-guard.mjs';
import { loadNativeAddon, withNativeLocks } from './native.mjs';
export function createGitNativeLockRepair(options, loaderOptions) {
  const outside = () => { if (hotLockDepth() > 0) throw new Error('exec-under-hot-lock: Git native repair'); };
  outside();
  const native = loadNativeAddon(loaderOptions);
  const port = new native.GitNativeLockRepair(options.stateRoot, options.repoPath, options.trustedMain);
  return Object.freeze({ repairNativeIndexLock(args, held = []) {
    outside(); return withNativeLocks(native, held, loans => port.repairNativeIndexLock(args, loans));
  } });
}
