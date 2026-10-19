// Typed read facade; policy, parsing and byte paths belong to fgos-git.
import { hotLockDepth } from '../state/hot-lock.mjs';
import { loadNativeAddon } from './native.mjs';
function outsideGate() {
  if (hotLockDepth() > 0) throw Object.assign(new Error('exec-under-hot-lock: Git Inspect'), { code: 'exec-under-hot-lock' });
}
export function createGitInspect(options, loaderOptions) {
  outsideGate();
  const native = loadNativeAddon(loaderOptions);
  const port = new native.GitInspect(options.stateRoot, options.repoPath, options.trustedMain);
  const facade = {};
  for (const method of ['resolveRepo', 'resolveRef', 'resolveTrunk', 'status', 'diff', 'ancestry', 'readObjects', 'pathsAtRevision', 'listWorktrees', 'compareContent', 'snapshotWrites']) {
    facade[method] = (args = {}) => { outsideGate(); return port.call(method, args); };
  }
  return Object.freeze(facade);
}
