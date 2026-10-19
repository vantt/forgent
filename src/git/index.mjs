// Dormant facade. Never bypass the hot gate merely because Rust can spawn directly.
import { hotLockDepth } from '../holder-lock/hot-guard.mjs';
import { loadNativeAddon } from './native.mjs';
function outsideGate() {
  if (hotLockDepth() > 0) throw Object.assign(new Error('exec-under-hot-lock: Git publication'), { code: 'exec-under-hot-lock' });
}
export function createGitPublication(options, loaderOptions) {
  outsideGate();
  const native = loadNativeAddon(loaderOptions);
  const port = new native.GitPublication(options.stateRoot, options.repoPath, options.trustedMain, options.reference, options.writer, native.helperExe);
  const facade = { close() { outsideGate(); return port.close(); } };
  for (const method of ['resolveRepo', 'writeBlob', 'writeTree', 'writeCommit', 'readRef', 'readObject', 'walkCommits', 'compareAndSwap', 'fetchRefs', 'pushRefs', 'ensureFetchMapping', 'configuredFetchRefspecs', 'pushRefspecs', 'remoteUrl', 'machineId', 'gitFloorVerdict', 'fetchMappingProvenance', 'recover', 'supersede']) {
    facade[method] = (args = {}) => { outsideGate(); return port.call(method, args); };
  }
  return Object.freeze(facade);
}
export function versions(loaderOptions) { return loadNativeAddon(loaderOptions).versions(); }

export { createGitInspect } from './inspect.mjs';

export { createGitRefs } from './refs.mjs';
export { createGitRemote } from './remote.mjs';
export { createGitWorktree } from './worktree.mjs';

export { createGitScopedCommit } from './scoped-commit.mjs';
export { createGitSync } from './sync.mjs';

export { createGitLand } from './land.mjs';

export { createGitSafeRestore } from './restore.mjs';

export { createGitRepositoryConfig } from './config.mjs';
export { createGitNativeLockRepair } from './native-lock.mjs';

export { createGitRecovery } from "./recovery.mjs";
