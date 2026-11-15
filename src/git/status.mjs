// Open Git incidents of one repository for the Node caller `fgos init`. The model of
// `fgos git status|recover` is `fgos-git` (`incidents.rs`), served by the host; this module only asks the addon for the
// same answers.
import { hotLockDepth } from '../holder-lock/hot-guard.mjs';
import { resolveStateRoot } from '../holder-lock/state-root.mjs';
import { loadNativeAddon } from './native.mjs';

// The one question each door asks the addon: where the state root is, and never inside a hot lock (Git never runs under one).
function ask(call, loaderOptions, portOptions) {
  if (hotLockDepth() > 0) throw Object.assign(new Error('exec-under-hot-lock: Git incidents'), { code: 'exec-under-hot-lock' });
  const native = loadNativeAddon(loaderOptions);
  return call(native, portOptions?.stateRoot ?? resolveStateRoot().stateRoot);
}

/** Every open Git incident of the repository at `cwd`. Read-only. */
export function readGitStatus(cwd, { loaderOptions, portOptions } = {}) {
  return ask((native, stateRoot) => native.readGitStatus(stateRoot, cwd), loaderOptions, portOptions);
}

/**
 * Recover every interrupted Land, ScopedCommit and remote transfer under each kind's own locks (Git spec §9, §10 rule 4b).
 * An attempted chain is recovered only by the writer that started it, so `portOptions.writer` may name another. Nothing is
 * merged, re-published or deleted.
 */
export function recoverGitOperations(cwd, { loaderOptions, portOptions } = {}) {
  return ask((native, stateRoot) => native.recoverGitOperations(stateRoot, cwd, portOptions?.writer ?? null), loaderOptions, portOptions);
}
