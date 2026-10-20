// Typed transport only; authority and Git policy remain in Rust.
import { hotLockDepth } from '../holder-lock/hot-guard.mjs';
import { loadNativeAddon, withNativeLocks } from './native.mjs';
function outsideGate() {
  if (hotLockDepth() > 0) throw Object.assign(new Error('exec-under-hot-lock: Git remote'), { code: 'exec-under-hot-lock' });
}
export function createGitRemote(options, loaderOptions) {
  outsideGate();
  const native = loadNativeAddon(loaderOptions);
  const port = new native.GitRemote(options.stateRoot, options.repoPath, options.trustedMain, options.writer);
  const facade = {};
  for (const method of ['fetchRefs', 'pushRefs', 'inspectRemote']) {
    facade[method] = (args = {}, held = []) => {
      outsideGate();
      return withNativeLocks(native, held, loans => port.call(method, args, loans));
    };
  }
  return Object.freeze(facade);
}
