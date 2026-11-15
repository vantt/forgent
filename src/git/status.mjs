// Open Git incidents of one repository for the Node callers: `fgos init` and the doctor rows. The model of
// `fgos git status|recover` is `fgos-git` (`incidents.rs`), served by the host; this module only asks the addon for the
// same answers and keeps the doctor's per-question fact reads.
import { readConfig } from '../config/facade.mjs';
import { hotLockDepth } from '../holder-lock/hot-guard.mjs';
import { resolveStateRoot } from '../holder-lock/state-root.mjs';
import { resolveMainCheckoutRoot } from '../runner/paths.mjs';
import { createGitInspect, gitPortOptions } from './inspect.mjs';
import { loadNativeAddon } from './native.mjs';

function context(cwd, loaderOptions) {
  const root = resolveMainCheckoutRoot(cwd) ?? cwd;
  // The addon first: a channel without one reports `addon not shipped` before the door-backed state root is asked.
  const native = loadNativeAddon(loaderOptions);
  return { root, remote: readConfig({ projectRoot: root, sections: ['eventStore'] }).value.eventStore?.remote ?? 'origin', stateRoot: resolveStateRoot().stateRoot, native };
}

// One inspection per distinct question: with a doctor run it is asked once and shared, without one it is asked alone.
export function gitFacts(cwd, recovery, loaderOptions, run) {
  const inspect = () => {
    const found = context(cwd, loaderOptions);
    const { native, stateRoot, root, remote } = found;
    return { ...found, facts: recovery ? native.inspectGitWorktreeRecovery(stateRoot, cwd, root) : native.inspectGit(stateRoot, cwd, root, remote) };
  };
  return run ? run.once(`git-${recovery ? 'worktree-recovery' : 'inspect'}:${cwd}`, inspect) : inspect();
}

/** The commit a merge in the checkout stopped at, or null when none is in progress or it cannot be read. */
export function readMergeHead(mainCheckout) {
  try {
    return createGitInspect(gitPortOptions(mainCheckout)).resolveCommit({ name: 'MERGE_HEAD' }) || null;
  } catch {
    return null;
  }
}

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
