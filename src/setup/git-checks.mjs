// Thin doctor/setup adapter: repository trust, configuration and WAL parsing stay in Rust.
import path from 'node:path';
import { readSharedConfig } from '../config/shared-config-file.mjs';
import { mergeWithGlobalConfig } from '../config/global-config.mjs';
import { randomUUID } from 'node:crypto';
import { loadNativeAddon, nativeError } from '../git/native.mjs';
import { createGitRecovery } from '../git/recovery.mjs';
import { gitPortOptions } from '../git/inspect.mjs';
import { resolveStateRoot } from '../holder-lock/state-root.mjs';
import { resolveMainCheckoutRoot } from '../runner/paths.mjs';
import fs from 'node:fs';
import { OWN_PAYLOAD_ROOT } from '../run-supervisor/payload-root.mjs';
import { verifyCensus } from '../../scripts/git-one-door-scan.mjs';

const transportRemedy = 'For actions/checkout use persist-credentials: false, remove its repo-local http.<url>.extraheader, and configure a trusted global credential helper or GIT_CONFIG_GLOBAL-level setting. Doctor never moves credentials automatically.';
const notARepository = { passed: true, message: 'info: not a Git repository' };

// A checkout kept for its owner (dirty) or locked by a still-running process is not a broken registration.
const advisoryWorktreeReasons = new Set(['dirty-or-stale-checkout-preserved', 'locked-by-live-process']);

function context(cwd, loaderOptions) {
  const root = resolveMainCheckoutRoot(cwd) ?? cwd;
  const config = mergeWithGlobalConfig(readSharedConfig(root));
  // The addon first: a channel without one reports `addon not shipped` before the door-backed state root is asked.
  const native = loadNativeAddon(loaderOptions);
  return { root, remote: config.eventStore?.remote ?? 'origin', stateRoot: resolveStateRoot().stateRoot, native };
}

function worktreeRecoveryRow(facts) {
  if (facts.notARepository) return notARepository;
  const reasons = [...new Set([...facts.issues.map(issue => issue.reason), ...(facts.pendingOperations.length ? ['pending-worktree-operation'] : [])])];
  if (!reasons.length) return { passed: true, message: 'no orphan, dirty or pending worktree found', detail: facts };
  const passed = facts.issues.every(issue => advisoryWorktreeReasons.has(issue.reason)) && facts.pendingOperations.length === 0;
  // This check never repairs or clears predecessor evidence; the finding names what a person must look at.
  return { passed, message: passed ? `info: ${reasons.join(', ')}; nothing to repair, the checkout stays with its owner` : `worktree findings need a person (${reasons.join(', ')}); nothing was changed, inspect them with \`fgos doctor --json\`, then recover each by hand`, detail: facts };
}

function repositoryConfigRow(facts, { remote, mappingMissing, readOrigin }) {
  const keys = facts.untrustedTransportConfig;
  if (!Array.isArray(keys)) return { passed: false, message: 'Git addon lacks transport diagnostics; upgrade the active release' };
  const reserved = facts.reservedLegacyRefs ?? [];
  const problems = [
    keys.length ? `repository-transport-config-untrusted: ${keys.join(', ')}; Publication/Remote transfers refuse these settings. ${transportRemedy}` : '',
    mappingMissing ? 'the required fetch mapping is missing; run fgos doctor --fix (git-publication-refspecs)' : '',
    facts.obsoleteFetchMapping || (remote !== 'origin' && readOrigin().obsoleteFetchMapping) ? 'obsolete exact legacy mapping breaks plain fetch when the remote has no refs/fgos/legacy; run fgos doctor --fix (git-publication-refspecs)' : '',
    reserved.length ? `reserved legacy mirror refs detected: ${reserved.join(', ')}; inspect and remove the foreign refs at their source and these mirrors` : '',
  ].filter(Boolean);
  const detail = { fetchRefspecs: facts.fetchRefspecs, untrustedTransportConfig: keys, reservedLegacyRefs: reserved };
  return problems.length ? { passed: false, message: problems.join('; '), detail } : { passed: true, message: 'repository transport settings and fetch mappings are as fgOS expects', detail };
}

function journalRow(facts, landWarning) {
  const { journal } = facts;
  const detail = { journal, retainedLand: landWarning };
  // Every WAL-writing door refuses without the controller's activation fence, so a WAL without it is a hard stop.
  if (journal.initialized && facts.activationFence === false) return { passed: false, message: 'git-fence-missing: the Git WAL exists but the controller activation fence does not, so every Git write refuses; run `fgctl upgrade` for the active release (it places the fence)', detail };
  const steps = [
    !journal.initialized ? 'the Git WAL is not initialized; run `fgos doctor --fix` (git-wal-dir)' : '',
    journal.initialized && !journal.complete ? 'the Git WAL listing is incomplete; inspect it with `fgos doctor --json`' : '',
    journal.errors.length ? `${journal.errors.length} Git WAL error(s); inspect them with \`fgos doctor --json\`` : '',
    journal.pendingCount > 0 ? `${journal.pendingCount} Git operation(s) unresolved; run \`fgos doctor --fix\` (git-land-recovery) for interrupted Land operations` : '',
  ].filter(Boolean);
  if (steps.length) return { passed: false, message: steps.join('; '), detail };
  return { passed: true, message: landWarning ?? 'the Git WAL is readable with no unresolved operation', detail };
}

export function checkGit(cwd, kind, loaderOptions, portOptions) {
  try {
    const { root, remote, stateRoot, native } = context(cwd, loaderOptions);
    if (kind === 'git-worktree-recovery') return worktreeRecoveryRow(native.inspectGitWorktreeRecovery(stateRoot, cwd, root));
    const facts = native.inspectGit(stateRoot, cwd, root, remote);
    if (kind === 'git-component-compatible') {
      const detail = { versions: native.versions(), floor: facts.floor };
      if (!compatibleGitContracts(detail.versions, facts.floor)) return { passed: false, message: 'the Git addon, its contract versions or the Git feature floor do not match this release; upgrade the active release or its Git binary', detail };
      return { passed: true, message: facts.notARepository ? 'the Git addon, its contracts and the Git feature floor are compatible' : `info: ${facts.commonDir}: ${facts.layout}; ${facts.durability}`, detail };
    }
    if (facts.notARepository) return notARepository;
    switch (kind) {
      case 'git-repository-config': return repositoryConfigRow(facts, { remote, mappingMissing: !native.gitFetchMappings(remote).every(r => facts.fetchRefspecs.includes(r)), readOrigin: () => native.inspectGit(stateRoot, cwd, root, 'origin') });
      case 'git-operation-journal': return journalRow(facts, facts.journal.initialized && facts.activationFence !== false ? retainedLandWarning(cwd, loaderOptions, portOptions) : null);
      case 'git-native-locks': return facts.nativeLocks.length
        ? { passed: false, message: `${facts.nativeLocks.length} native Git lock(s) present and never removed by fgOS; follow the runbook in docs/platform/git/spec.md section 11`, detail: { nativeLocks: facts.nativeLocks } }
        : { passed: true, message: 'no native Git locks detected' };
      default: throw new Error(`unknown Git check: ${kind}`);
    }
  } catch (err) {
    if (kind === 'git-repository-config' && /repository-config-untrusted: credential\.helper/.test(err.message)) return { passed: false, message: `${err.message}; ${transportRemedy}` };
    return { passed: err.code === 'git-addon-not-shipped', message: err.code === 'git-addon-not-shipped' ? 'info: addon not shipped on this channel: onboard this project with `fgctl init`' : err.message };
  }
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
        const { cause } = nativeError(err);
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
 * for a release that needs Work's acknowledgement reader.
 */
function retainedLandWarning(cwd, loaderOptions, portOptions, now = Date.now()) {
  // The Recovery port is constructed with a writer even for reads, as the fix above is.
  const recovery = createGitRecovery(portOptions ?? gitPortOptions(resolveMainCheckoutRoot(cwd) ?? cwd, { mutation: true }), loaderOptions);
  const { candidates, complete } = recovery.listRetainedLand();
  if (!candidates.length) return complete ? null : 'warning: Land candidate scan incomplete';
  const rows = candidates.map(c => {
    const age = c.updatedAtMs == null ? 'age unknown' : `${Math.max(0, Math.round((now - c.updatedAtMs) / 60000))} min old`;
    return `${c.operationId} (${c.worktreePresent ? c.worktree : `${c.worktree} already gone`}; pins ${c.pins.join(', ') || 'none'}; ${age})`;
  });
  return `warning: retained Land candidates: ${rows.join('; ')}. No manual release command exists today; the release sweep arrives with the Work lane, which supplies the acknowledgement it needs. Never delete the worktree or pins by hand.`;
}

export function compatibleGitContracts(versions, floor) {
  return versions.napi === 8 && Object.entries({ gitPort: 1, receipt: 1, walRecord: 1, eventStore: 4 }).every(([key, version]) => versions.contracts?.[key] === version) && floor.supported;
}
