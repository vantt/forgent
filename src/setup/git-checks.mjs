// Thin doctor/setup adapter: repository trust, configuration and WAL parsing stay in Rust.
import path from 'node:path';
import { readSharedConfig } from '../config/shared-config-file.mjs';
import { mergeWithGlobalConfig } from '../config/global-config.mjs';
import { randomUUID } from 'node:crypto';
import { loadNativeAddon } from '../git/native.mjs';
import { createGitRecovery } from '../git/recovery.mjs';
import { gitPortOptions } from '../git/inspect.mjs';
import { resolveStateRoot } from '../holder-lock/state-root.mjs';
import { resolveMainCheckoutRoot } from '../runner/paths.mjs';
import fs from 'node:fs';
import { OWN_PAYLOAD_ROOT } from '../run-supervisor/payload-root.mjs';
import { verifyCensus } from '../../scripts/git-one-door-scan.mjs';

const transportRemedy = 'For actions/checkout use persist-credentials: false, remove its repo-local http.<url>.extraheader, and configure a trusted global credential helper or GIT_CONFIG_GLOBAL-level setting. Doctor never moves credentials automatically.';

// A checkout kept for its owner (dirty) or locked by a still-running process is not a broken registration.
const advisoryWorktreeReasons = new Set(['dirty-or-stale-checkout-preserved', 'locked-by-live-process']);

function context(cwd, loaderOptions) {
  const root = resolveMainCheckoutRoot(cwd) ?? cwd;
  const config = mergeWithGlobalConfig(readSharedConfig(root));
  // The addon first: a channel without one reports `addon not shipped` before the door-backed state root is asked.
  const native = loadNativeAddon(loaderOptions);
  return { root, remote: config.eventStore?.remote ?? 'origin', stateRoot: resolveStateRoot().stateRoot, native };
}
export function checkGit(cwd, kind, loaderOptions) {
  try {
    const { root, remote, stateRoot, native } = context(cwd, loaderOptions);
    if (kind === 'git-worktree-recovery') {
      const facts = native.inspectGitWorktreeRecovery(stateRoot, cwd, root);
      if (facts.notARepository) return { passed: true, message: 'info: not a Git repository' };
      // Each producer owns its diagnostic row; custody adds its own facts here
      // in phase 04. This check never repairs or clears predecessor evidence.
      return { passed: facts.issues.every(issue => advisoryWorktreeReasons.has(issue.reason)) && facts.pendingOperations.length === 0, message: JSON.stringify(facts) };
    }
    const versions = native.versions();
    const facts = native.inspectGit(stateRoot, cwd, root, remote);
    if (kind === 'git-component-compatible') return { passed: compatibleGitContracts(versions, facts.floor), message: JSON.stringify({ versions, floor: facts.floor }) };
    if (facts.notARepository) return { passed: true, message: 'info: not a Git repository' };
    switch (kind) {
      case 'git-transport-config': {
        const keys = facts.untrustedTransportConfig;
        if (!Array.isArray(keys)) return { passed: false, message: 'Git addon lacks transport diagnostics; upgrade the active release' };
        return { passed: keys.length === 0, message: keys.length ? `repository-transport-config-untrusted: ${keys.join(', ')}; Publication/Remote transfers refuse these settings. ${transportRemedy}` : 'no repository-local transport settings would refuse Publication/Remote' };
      }
      case 'git-trust-topology': return { passed: true, message: `${facts.commonDir}: ${facts.layout}` };
      case 'git-operation-journal':
        // Every WAL-writing door refuses without the controller's activation fence, so a WAL without it is a hard stop.
        if (facts.journal.initialized && facts.activationFence === false) return { passed: false, message: 'git-fence-missing: the Git WAL exists but the controller activation fence does not, so every Git write refuses; run `fgctl upgrade` for the active release (it places the fence)' };
        return { passed: facts.journal.initialized && facts.journal.complete && facts.journal.errors.length === 0 && facts.journal.pendingCount === 0, message: JSON.stringify(facts.journal) };
      case 'git-native-locks': return { passed: facts.nativeLocks.length === 0, message: facts.nativeLocks.length ? `native locks detected (never removed): ${facts.nativeLocks.join(', ')}` : 'no native Git locks detected' };
      case 'git-publication-refspecs': {
        const origin = remote === 'origin' ? facts : native.inspectGit(stateRoot, cwd, root, 'origin');
        const obsolete = facts.obsoleteFetchMapping || origin.obsoleteFetchMapping;
        const reserved = facts.reservedLegacyRefs ?? [];
        return { passed: native.gitFetchMappings(remote).every(r => facts.fetchRefspecs.includes(r)) && !obsolete && reserved.length === 0,
          message: [JSON.stringify(facts.fetchRefspecs), obsolete ? 'obsolete exact legacy mapping breaks plain fetch when the remote has no refs/fgos/legacy; run fgos doctor --fix (git-publication-refspecs)' : '', reserved.length ? `reserved legacy mirror refs detected: ${reserved.join(', ')}; inspect and remove the foreign refs at their source and these mirrors` : ''].filter(Boolean).join('; ') };
      }
      case 'git-durability-capability': return { passed: true, message: `info: ${facts.durability}` };
      default: throw new Error(`unknown Git check: ${kind}`);
    }
  } catch (err) {
    if (kind === 'git-transport-config' && /repository-config-untrusted: credential\.helper/.test(err.message)) return { passed: false, message: `${err.message}; ${transportRemedy}` };
    return { passed: err.code === 'git-addon-not-shipped', message: err.code === 'git-addon-not-shipped' ? 'info: addon not shipped on this channel: onboard this project with `fgctl init`' : err.message }; }
}
/** The release's mutation census (built from its own payload) lists no Git spawn outside the driver. */
export function checkMutationOneDoor(payloadRoot = OWN_PAYLOAD_ROOT) {
  let doc = null;
  try { doc = JSON.parse(fs.readFileSync(path.join(payloadRoot, 'packages/git/contracts/mutation-census.v1.json'), 'utf8')); } catch { /* reported below */ }
  return verifyCensus(doc, payloadRoot);
}
/** The Git binary fgos-git runs and its floor verdict; Git is only ever spawned by the driver. */
export function gitFloor(cwd, loaderOptions) {
  const { root, stateRoot, native } = context(cwd, loaderOptions);
  return native.inspectGit(stateRoot, cwd, root).floor;
}
function initializeWal(cwd) {
  const { root, remote, stateRoot, native } = context(cwd);
  const before = native.inspectGit(stateRoot, cwd, root, remote);
  if (before.notARepository) return { changed: false, message: 'not a Git repository' };
  native.initializeGitWal(stateRoot, cwd, root);
  return { changed: !before.journal.initialized, message: 'Git WAL initialized and trusted' };
}
function installFetchMapping(cwd, loaderOptions) {
  const { root, remote, stateRoot, native } = context(cwd, loaderOptions);
  const before = native.inspectGit(stateRoot, cwd, root, remote);
  if (before.notARepository) return { changed: false, message: 'not a Git repository' };
  const repairs = [];
  if (!native.gitFetchMappings(remote).every(r => before.fetchRefspecs.includes(r)) || before.obsoleteFetchMapping) repairs.push(remote);
  if (remote !== 'origin' && native.inspectGit(stateRoot, cwd, root, 'origin').obsoleteFetchMapping) repairs.push('origin');
  for (const target of repairs) native.ensureGitFetchMapping(stateRoot, cwd, root, target, native.gitFetchMappings(target), `setup-${randomUUID()}`);
  return { changed: repairs.length > 0, message: repairs.length ? `installed fgOS fetch mappings and repaired obsolete legacy mapping: ${repairs.join(', ')}` : 'no fetch mapping change needed' };
}

function attemptFix(cwd, fix) {
  try { return fix(cwd); }
  catch (err) { return { changed: false, message: `warning: Git setup refused: ${err.message}` }; }
}
export function fixGitDriverDirectories(cwd, loaderOptions) {
  return attemptFix(cwd, () => {
    const { stateRoot, native } = context(cwd, loaderOptions);
    return { changed: native.prepareGitDriverDirectories(stateRoot), message: 'fgOS Git driver directories are current-user-owned and safely permissioned' };
  });
}
export function fixGitWal(cwd) {
  const prepared = fixGitDriverDirectories(cwd);
  const result = attemptFix(cwd, initializeWal);
  return { ...result, changed: prepared.changed || result.changed };
}
export function fixGitFetchMapping(cwd, loaderOptions) {
  const prepared = fixGitDriverDirectories(cwd, loaderOptions);
  const result = attemptFix(cwd, () => installFetchMapping(cwd, loaderOptions));
  return { ...result, changed: prepared.changed || result.changed };
}
/**
 * Recover every interrupted Land through the one Recovery door, under Land's
 * own destination, admin, main and recovery locks (Git spec §9, §10 rule 4b).
 * A chain without a TargetAttempt closes `abandonedBeforeAttempt` whoever
 * runs it; an attempted chain is recovered only by the writer that started
 * it, so any other writer gets that writer named instead. Nothing is merged,
 * re-published or deleted here: candidates stay until Work acknowledges them.
 */
export function fixLandRecovery(cwd, loaderOptions, portOptions) {
  return attemptFix(cwd, () => {
    const recovery = createGitRecovery(portOptions ?? gitPortOptions(resolveMainCheckoutRoot(cwd) ?? cwd, { mutation: true }), loaderOptions);
    const recovered = [];
    const kept = [];
    for (const operation of recovery.listPending().operations.filter(o => o.kind === 'Land')) {
      try {
        recovery.reconcile({ operationId: operation.operationId });
        recovered.push(operation.operationId);
      } catch (err) {
        let cause;
        try { cause = JSON.parse(err.message).cause; } catch { cause = err.message; }
        const writer = cause === 'land-authority-mismatch' ? `; only its writer ${operation.intent.writerIdentity} can recover it` : '';
        kept.push(`${operation.operationId} (${cause}${writer})`);
      }
    }
    if (!recovered.length && !kept.length) return { changed: false, message: 'no interrupted Land operation' };
    return { changed: recovered.length > 0, message: [
      recovered.length ? `recovered interrupted Land operations: ${recovered.join(', ')}` : '',
      kept.length ? `warning: Land operations kept for recovery: ${kept.join('; ')}` : '',
    ].filter(Boolean).join('; ') };
  });
}

/**
 * Land candidates a finished Land still holds (worktree and pins stay until
 * Work acknowledges the result). Read-only through the Recovery door; a
 * warning, never a failure, because nothing is broken: the candidate waits
 * for the release sweep of a Land command (`releaseRecordedLand`).
 */
export function checkLandRetainedCandidates(cwd, loaderOptions, portOptions, now = Date.now()) {
  try {
    // The Recovery port is constructed with a writer even for reads, as the fix above is.
    const recovery = createGitRecovery(portOptions ?? gitPortOptions(resolveMainCheckoutRoot(cwd) ?? cwd, { mutation: true }), loaderOptions);
    const { candidates, complete } = recovery.listRetainedLand();
    if (!candidates.length) return { passed: true, message: complete ? 'no retained Land candidate' : 'warning: Land candidate scan incomplete' };
    const rows = candidates.map(c => {
      const age = c.updatedAtMs == null ? 'age unknown' : `${Math.max(0, Math.round((now - c.updatedAtMs) / 60000))} min old`;
      return `${c.operationId} (${c.worktreePresent ? c.worktree : `${c.worktree} already gone`}; pins ${c.pins.join(', ') || 'none'}; ${age})`;
    });
    return { passed: true, message: `warning: retained Land candidates: ${rows.join('; ')}. No manual release command exists today: the next approve, sync-root or promote-to-component releases a candidate whose result Work recorded, and one with no recorded result stays. Never delete the worktree or pins by hand.` };
  } catch (err) {
    return { passed: err.code === 'git-addon-not-shipped', message: err.code === 'git-addon-not-shipped' ? 'info: addon not shipped on this channel: onboard this project with `fgctl init`' : err.message };
  }
}

export function compatibleGitContracts(versions, floor) {
  return versions.napi === 8 && Object.entries({ gitPort: 1, receipt: 1, walRecord: 1, eventStore: 4 }).every(([key, version]) => versions.contracts?.[key] === version) && floor.supported && floor.probes.every(p => p.passed);
}
