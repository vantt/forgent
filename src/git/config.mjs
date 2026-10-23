// RepositoryConfig facade; every policy and mutation belongs to Rust.
import { hotLockDepth } from '../holder-lock/hot-guard.mjs';
import { loadNativeAddon } from './native.mjs';
export function createGitRepositoryConfig(options, loaderOptions) {
  const outside = () => { if (hotLockDepth() > 0) throw new Error('exec-under-hot-lock: Git RepositoryConfig'); };
  outside();
  const native = loadNativeAddon(loaderOptions);
  const port = new native.GitRepositoryConfig(options.stateRoot, options.repoPath, options.trustedMain);
  return Object.freeze(Object.fromEntries(['inspectHooks', 'ensureHooks', 'removeOwnedHooksConfig'].map(method => [method, args => {
    outside(); return port.call(method, args);
  }])));
}
