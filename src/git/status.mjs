// Read and recover every open Git incident of one repository: the model behind `fgos git status|recover`, `fgos init`
// and the doctor rows. Repository trust, the WAL and Recovery policy stay in Rust; this module only asks and reports.
import { readConfig } from '../config/facade.mjs';
import { resolveStateRoot } from '../holder-lock/state-root.mjs';
import { resolveMainCheckoutRoot } from '../runner/paths.mjs';
import { createGitInspect, gitPortOptions } from './inspect.mjs';
import { loadNativeAddon, nativeError } from './native.mjs';
import { createGitRecovery } from './recovery.mjs';

const RECOVERABLE_KINDS = ['Land', 'ScopedCommit', 'RemoteTransfer'];
const AUTHORITY_MISMATCH_CAUSES = ['land-authority-mismatch', 'commit-authority-mismatch', 'remote-authority-mismatch'];

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

// The Recovery port is constructed with a writer even for reads.
const recoveryPort = (cwd, loaderOptions, portOptions) => createGitRecovery(portOptions ?? gitPortOptions(resolveMainCheckoutRoot(cwd) ?? cwd, { mutation: true }), loaderOptions);

/** Land candidates a finished Land still holds, as Recovery lists them. */
export const listRetainedLand = (cwd, loaderOptions, portOptions) => recoveryPort(cwd, loaderOptions, portOptions).listRetainedLand();

/** The commit a merge in the checkout stopped at, or null when none is in progress or it cannot be read. */
export function readMergeHead(mainCheckout) {
  try {
    return createGitInspect(gitPortOptions(mainCheckout)).resolveCommit({ name: 'MERGE_HEAD' }) || null;
  } catch {
    return null;
  }
}

// A repository nothing was ever journalled in has no WAL to list; any other listing failure is the caller's to see.
function pendingOperations(cwd, loaderOptions, portOptions) {
  try { return recoveryPort(cwd, loaderOptions, portOptions).listPending().operations; } catch (err) {
    if (gitFacts(cwd, false, loaderOptions).facts.journal?.initialized) throw err;
    return [];
  }
}

// A part that cannot be read is reported in place and hides no other part; only a missing addon makes the whole door unusable.
function inPlace(err) {
  if (err.code === 'git-addon-not-shipped') throw err;
  return { error: nativeError(err).cause ?? err.message };
}

/** Every open Git incident of the repository at `cwd`. Read-only. */
export function readGitStatus(cwd, { loaderOptions, portOptions, run } = {}) {
  let inspected;
  try { inspected = gitFacts(cwd, false, loaderOptions, run); } catch (err) {
    const error = inPlace(err);
    return { repository: error, journal: error, pendingOperations: error, retainedLand: error, worktrees: error, nativeLocks: error, mergeInProgress: null };
  }
  const { facts, root } = inspected;
  if (facts.notARepository) return { repository: { notARepository: true } };
  const { journal } = facts;
  let pending;
  try { pending = pendingOperations(cwd, loaderOptions, portOptions).map(o => ({ operationId: o.operationId, kind: o.kind, writer: o.intent?.writerIdentity ?? null })); } catch (err) { pending = inPlace(err); }
  let retainedLand;
  try { const { candidates, complete } = listRetainedLand(cwd, loaderOptions, portOptions); retainedLand = { candidates, complete }; } catch (err) { retainedLand = inPlace(err); }
  let worktrees;
  try { const { issues, pendingOperations: worktreeOperations } = gitFacts(cwd, true, loaderOptions, run).facts; worktrees = { issues, pendingOperations: worktreeOperations }; } catch (err) { worktrees = inPlace(err); }
  return {
    repository: { notARepository: false, commonDir: facts.commonDir, layout: facts.layout },
    journal: {
      initialized: journal.initialized,
      complete: journal.complete,
      pendingCount: journal.pendingCount,
      errors: journal.errors,
      retention: { retainedChains: journal.retainedChains, oldestRetainedAtMs: journal.oldestRetainedAtMs, retainedBytes: journal.retainedBytes, ledgerCapacityWarning: Boolean(journal.ledgerCapacityWarning) },
    },
    pendingOperations: pending,
    retainedLand,
    worktrees,
    nativeLocks: facts.nativeLocks,
    mergeInProgress: readMergeHead(root),
  };
}

/**
 * Recover every interrupted Land, ScopedCommit and remote transfer through the one Recovery door, under each kind's own locks (Git spec §9, §10 rule 4b).
 * Rust finds a scoped commit's checkout and takes its custody without waiting, so a gone or busy checkout comes back as a
 * cause. An attempted chain is recovered only by the writer that started it. Nothing is merged, re-published or deleted.
 */
export function recoverGitOperations(cwd, { loaderOptions, portOptions } = {}) {
  const pending = pendingOperations(cwd, loaderOptions, portOptions).filter(o => RECOVERABLE_KINDS.includes(o.kind));
  const recovery = pending.length ? recoveryPort(cwd, loaderOptions, portOptions) : null;
  const recovered = [];
  const kept = [];
  for (const operation of pending) {
    try {
      recovery.reconcile({ operationId: operation.operationId });
      recovered.push(operation.operationId);
    } catch (err) {
      kept.push({ operationId: operation.operationId, cause: nativeError(err).cause, writer: operation.intent.writerIdentity });
    }
  }
  const keptText = ({ operationId, cause, writer }) => `${operationId} (${cause}${AUTHORITY_MISMATCH_CAUSES.includes(cause) ? `; only its writer ${writer} can recover it${cause === 'remote-authority-mismatch' ? ', and the next event sync settles it' : ''}` : ''})`;
  const message = !recovered.length && !kept.length
    ? 'no interrupted Land, ScopedCommit or remote transfer operation'
    : [recovered.length && `recovered interrupted Git operations: ${recovered.join(', ')}`, kept.length && `warning: Git operations kept for recovery: ${kept.map(keptText).join('; ')}`].filter(Boolean).join('; ');
  return { recovered, kept, message };
}
