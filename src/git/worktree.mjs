// Typed transport only; worktree policy and effects belong to Rust.
import { hotLockDepth } from '../holder-lock/hot-guard.mjs';
import { loadNativeAddon, withNativeLocks } from './native.mjs';
function outsideGate() {
  if (hotLockDepth() > 0) throw Object.assign(new Error('exec-under-hot-lock: Git worktree'), { code: 'exec-under-hot-lock' });
}
export function createGitWorktree(options, loaderOptions) {
  outsideGate();
  const native = loadNativeAddon(loaderOptions);
  const port = new native.GitWorktree(options.stateRoot, options.repoPath, options.trustedMain, options.writer);
  return Object.freeze(Object.fromEntries(['create', 'createDetached', 'remove', 'relocate', 'inspectOrphans', 'repairRegistration', 'prune'].map(method => [method, (args = {}, held = []) => {
    outsideGate();
    return withNativeLocks(native, held, loans => port.call(method, args, loans));
  }])));
}
