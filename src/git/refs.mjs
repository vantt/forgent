// Typed transport only; authority and Git policy remain in Rust.
import { hotLockDepth } from '../state/hot-lock.mjs';
import { loadNativeAddon, withNativeLocks } from './native.mjs';
function outsideGate() {
  if (hotLockDepth() > 0) throw Object.assign(new Error('exec-under-hot-lock: Git refs'), { code: 'exec-under-hot-lock' });
}
export function createGitRefs(options, loaderOptions) {
  outsideGate();
  const native = loadNativeAddon(loaderOptions);
  const port = new native.GitRefs(options.stateRoot, options.repoPath, options.trustedMain, options.writer);
  const facade = {};
  for (const method of ['ensureBranch', 'advanceRef', 'deleteRef', 'fastForwardCheckedOut']) {
    facade[method] = (args = {}, held = []) => {
      outsideGate();
      return withNativeLocks(native, held, loans => port.call(method, args, loans));
    };
  }
  return Object.freeze(facade);
}
