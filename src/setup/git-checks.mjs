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
import { retentionNote } from './git-retention-note.mjs';

const transportRemedy = 'For actions/checkout use persist-credentials: false, remove its repo-local http.<url>.extraheader, and configure a trusted global credential helper or GIT_CONFIG_GLOBAL-level setting. Doctor never moves credentials automatically.';
// A checkout kept for its owner (dirty) or locked by a still-running process is not a broken registration.
const advisoryWorktreeReasons = new Set(['dirty-or-stale-checkout-preserved', 'locked-by-live-process']);

function context(cwd, loaderOptions) {
  const root = resolveMainCheckoutRoot(cwd) ?? cwd;
  // The addon first: a channel without one reports `addon not shipped` before the door-backed state root is asked.
  const native = loadNativeAddon(loaderOptions);
  return { root, remote: mergeWithGlobalConfig(readSharedConfig(root)).eventStore?.remote ?? 'origin', stateRoot: resolveStateRoot().stateRoot, native };
}
// A row is its problems joined into one sentence, or its passing text; the facts it judged go under detail.
const row = (problems, ok, detail, found = problems.filter(Boolean)) => found.length ? { passed: false, message: found.join('; '), detail } : { passed: true, message: ok, detail };

export function checkGit(cwd, kind, loaderOptions, portOptions) {
  try {
    const { root, remote, stateRoot, native } = context(cwd, loaderOptions);
    const facts = kind === 'git-worktree-recovery' ? native.inspectGitWorktreeRecovery(stateRoot, cwd, root) : native.inspectGit(stateRoot, cwd, root, remote);
    if (facts.notARepository && kind !== 'git-component-compatible') return { passed: true, message: 'info: not a Git repository' };
    switch (kind) {
      case 'git-worktree-recovery': {
        const reasons = [...new Set([...facts.issues.map(i => i.reason), ...(facts.pendingOperations.length ? ['pending-worktree-operation'] : [])])];
        // This check never repairs or clears predecessor evidence; the finding names what a person must look at.
        const blocked = facts.issues.some(i => !advisoryWorktreeReasons.has(i.reason)) || facts.pendingOperations.length > 0;
        return row(blocked ? [`worktree findings need a person (${reasons.join(', ')}); nothing was changed, inspect them with \`fgos doctor --json\`, then recover each by hand`] : [], reasons.length ? `info: ${reasons.join(', ')}; nothing to repair, the checkout stays with its owner` : 'no orphan, dirty or pending worktree found', facts);
      }
      case 'git-component-compatible': {
        const detail = { versions: native.versions(), floor: facts.floor };
        return row(compatibleGitContracts(detail.versions, facts.floor) ? [] : ['the Git addon, its contract versions or the Git feature floor do not match this release; upgrade the active release or its Git binary'],
          facts.notARepository ? 'the Git addon, its contracts and the Git feature floor are compatible' : `info: ${facts.commonDir}: ${facts.layout}; ${facts.durability}`, detail);
      }
      case 'git-repository-config': {
        const keys = facts.untrustedTransportConfig;
        if (!Array.isArray(keys)) return row(['Git addon lacks transport diagnostics; upgrade the active release']);
        const reserved = facts.reservedLegacyRefs ?? [];
        const obsolete = facts.obsoleteFetchMapping || (remote !== 'origin' && native.inspectGit(stateRoot, cwd, root, 'origin').obsoleteFetchMapping);
        return row([
          keys.length && `repository-transport-config-untrusted: ${keys.join(', ')}; Publication/Remote transfers refuse these settings. ${transportRemedy}`,
          !native.gitFetchMappings(remote).every(r => facts.fetchRefspecs.includes(r)) && 'the required fetch mapping is missing; run fgos doctor --fix (git-publication-refspecs)',
          obsolete && 'obsolete exact legacy mapping breaks plain fetch when the remote has no refs/fgos/legacy; run fgos doctor --fix (git-publication-refspecs)',
          reserved.length && `reserved legacy mirror refs detected: ${reserved.join(', ')}; inspect and remove the foreign refs at their source and these mirrors`,
        ], 'repository transport settings and fetch mappings are as fgOS expects', { fetchRefspecs: facts.fetchRefspecs, untrustedTransportConfig: keys, reservedLegacyRefs: reserved });
      }
      case 'git-operation-journal': {
        const { journal } = facts;
        const fenceMissing = journal.initialized && facts.activationFence === false;
        const landWarning = journal.initialized && !fenceMissing ? retainedLandWarning(cwd, loaderOptions, portOptions) : null;
        const notes = [landWarning, retentionNote(journal)].filter(Boolean);
        // Every WAL-writing door refuses without the controller's activation fence, so a WAL without it is a hard stop.
        const verdict = row([
          fenceMissing && 'git-fence-missing: the Git WAL exists but the controller activation fence does not, so every Git write refuses; run `fgctl upgrade` for the active release (it places the fence)',
          !journal.initialized && 'the Git WAL is not initialized; run `fgos doctor --fix` (git-wal-dir)',
          journal.initialized && !journal.complete && 'the Git WAL listing is incomplete; inspect it with `fgos doctor --json`',
          journal.errors.length && `${journal.errors.length} Git WAL error(s); inspect them with \`fgos doctor --json\``,
          journal.pendingCount > 0 && `${journal.pendingCount} Git operation(s) unresolved; run \`fgos doctor --fix\` (git-land-recovery) for interrupted Land operations`,
        ], notes.some(n => n.startsWith('warning:')) ? notes.join('; ') : ['the Git WAL is readable with no unresolved operation', ...notes].join('; '), { journal, retainedLand: landWarning });
        return notes.length && !verdict.passed ? { ...verdict, message: `${verdict.message}; ${notes.join('; ')}` } : verdict;
      }
      case 'git-native-locks': return row([facts.nativeLocks.length && `${facts.nativeLocks.length} native Git lock(s) present and never removed by fgOS; follow the runbook in docs/platform/git/spec.md section 11`], 'no native Git locks detected', { nativeLocks: facts.nativeLocks });
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
/** The repository as the fixes found it, or null when there is none to fix. */
function readBefore(cwd, loaderOptions) {
  const ctx = context(cwd, loaderOptions);
  const before = ctx.native.inspectGit(ctx.stateRoot, cwd, ctx.root, ctx.remote);
  return before.notARepository ? null : { ...ctx, before };
}
const noRepository = { changed: false, message: 'not a Git repository' };
const initializeWal = (cwd) => {
  const found = readBefore(cwd);
  if (!found) return noRepository;
  found.native.initializeGitWal(found.stateRoot, cwd, found.root);
  return { changed: !found.before.journal.initialized, message: 'Git WAL initialized and trusted' };
};
const installFetchMapping = (cwd, loaderOptions) => {
  const found = readBefore(cwd, loaderOptions);
  if (!found) return noRepository;
  const { root, remote, stateRoot, native, before } = found;
  const repairs = [];
  if (!native.gitFetchMappings(remote).every(r => before.fetchRefspecs.includes(r)) || before.obsoleteFetchMapping) repairs.push(remote);
  if (remote !== 'origin' && native.inspectGit(stateRoot, cwd, root, 'origin').obsoleteFetchMapping) repairs.push('origin');
  for (const target of repairs) native.ensureGitFetchMapping(stateRoot, cwd, root, target, native.gitFetchMappings(target), `setup-${randomUUID()}`);
  return { changed: repairs.length > 0, message: repairs.length ? `installed fgOS fetch mappings and repaired obsolete legacy mapping: ${repairs.join(', ')}` : 'no fetch mapping change needed' };
};
const attemptFix = (cwd, fix) => {
  try { return fix(cwd); } catch (err) { return { changed: false, message: `warning: Git setup refused: ${err.message}` }; }
};
export const fixGitDriverDirectories = (cwd, loaderOptions) => attemptFix(cwd, () => {
  const { stateRoot, native } = context(cwd, loaderOptions);
  return { changed: native.prepareGitDriverDirectories(stateRoot), message: 'fgOS Git driver directories are current-user-owned and safely permissioned' };
});
/** A fix that first makes the driver directories safe, then runs its own repair. */
const afterDriverDirectories = (cwd, loaderOptions, fix) => {
  const prepared = fixGitDriverDirectories(cwd, loaderOptions);
  const result = attemptFix(cwd, fix);
  return { ...result, changed: prepared.changed || result.changed };
};
export const fixGitWal = (cwd) => afterDriverDirectories(cwd, undefined, initializeWal);
export const fixGitFetchMapping = (cwd, loaderOptions) => afterDriverDirectories(cwd, loaderOptions, () => installFetchMapping(cwd, loaderOptions));
// The Recovery port is constructed with a writer even for reads.
const recoveryPort = (cwd, loaderOptions, portOptions) => createGitRecovery(portOptions ?? gitPortOptions(resolveMainCheckoutRoot(cwd) ?? cwd, { mutation: true }), loaderOptions);
/**
 * Recover every interrupted Land through the one Recovery door, under Land's own locks (Git spec §9, §10 rule 4b).
 * A chain without a TargetAttempt closes `abandonedBeforeAttempt` whoever runs it; an attempted chain is recovered
 * only by the writer that started it. Nothing is merged, re-published or deleted: candidates stay until Work acknowledges them.
 */
export function fixLandRecovery(cwd, loaderOptions, portOptions) {
  return attemptFix(cwd, () => {
    const recovery = recoveryPort(cwd, loaderOptions, portOptions);
    const recovered = [];
    const kept = [];
    for (const operation of recovery.listPending().operations.filter(o => o.kind === 'Land')) {
      try { recovery.reconcile({ operationId: operation.operationId }); recovered.push(operation.operationId); }
      catch (err) {
        const { cause } = nativeError(err);
        kept.push(`${operation.operationId} (${cause}${cause === 'land-authority-mismatch' ? `; only its writer ${operation.intent.writerIdentity} can recover it` : ''})`);
      }
    }
    if (!recovered.length && !kept.length) return { changed: false, message: 'no interrupted Land operation' };
    return { changed: recovered.length > 0, message: [recovered.length && `recovered interrupted Land operations: ${recovered.join(', ')}`, kept.length && `warning: Land operations kept for recovery: ${kept.join('; ')}`].filter(Boolean).join('; ') };
  });
}
/** Land candidates a finished Land still holds: read-only, a warning never a failure (they wait for Work's acknowledgement reader). */
function retainedLandWarning(cwd, loaderOptions, portOptions, now = Date.now()) {
  let listing;
  try { listing = recoveryPort(cwd, loaderOptions, portOptions).listRetainedLand(); }
  catch (err) { // a failed listing must not hide the WAL findings; a missing addon keeps its own info path
    if (err.code === 'git-addon-not-shipped') throw err;
    return `warning: Land candidate scan failed: ${nativeError(err).cause}`;
  }
  const { candidates, complete } = listing;
  if (!candidates.length) return complete ? null : 'warning: Land candidate scan incomplete';
  const rows = candidates.map(c => `${c.operationId} (${c.worktreePresent ? c.worktree : `${c.worktree} already gone`}; pins ${c.pins.join(', ') || 'none'}; ${c.updatedAtMs == null ? 'age unknown' : `${Math.max(0, Math.round((now - c.updatedAtMs) / 60000))} min old`})`);
  return `warning: retained Land candidates: ${rows.join('; ')}. No manual release command exists today; the release sweep arrives with the Work lane, which supplies the acknowledgement it needs. Never delete the worktree or pins by hand.`;
}

export function compatibleGitContracts(versions, floor) {
  return versions.napi === 8 && Object.entries({ gitPort: 1, receipt: 1, walRecord: 1, eventStore: 4 }).every(([key, version]) => versions.contracts?.[key] === version) && floor.supported;
}
