// Thin doctor/setup adapter: repository trust, configuration and WAL parsing stay in Rust.
import path from 'node:path';
import { readSharedConfig } from '../config/shared-config-file.mjs';
import { mergeWithGlobalConfig } from '../config/global-config.mjs';
import { randomUUID } from 'node:crypto';
import { loadNativeAddon } from '../git/native.mjs';
import { resolveStateRoot } from '../holder-lock/state-root.mjs';
import { resolveMainCheckoutRoot } from '../runner/paths.mjs';

const transportRemedy = 'For actions/checkout use persist-credentials: false, remove its repo-local http.<url>.extraheader, and configure a trusted global credential helper or GIT_CONFIG_GLOBAL-level setting. Doctor never moves credentials automatically.';

function context(cwd, loaderOptions) {
  const root = resolveMainCheckoutRoot(cwd) ?? cwd;
  const config = mergeWithGlobalConfig(readSharedConfig(root));
  return { root, remote: config.eventStore?.remote ?? 'origin', stateRoot: resolveStateRoot({ fgosDir: path.join(root, '.fgos') }).stateRoot, native: loadNativeAddon(loaderOptions) };
}
export function checkGit(cwd, kind, loaderOptions) {
  try {
    const { root, remote, stateRoot, native } = context(cwd, loaderOptions);
    if (kind === 'git-worktree-recovery') {
      const facts = native.inspectGitWorktreeRecovery(stateRoot, cwd, root);
      if (facts.notARepository) return { passed: true, message: 'info: not a Git repository' };
      // Each producer owns its diagnostic row; custody adds its own facts here
      // in phase 04. This check never repairs or clears predecessor evidence.
      return { passed: facts.issues.every(issue => issue.reason === 'dirty-or-stale-checkout-preserved') && facts.pendingOperations.length === 0, message: JSON.stringify(facts) };
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
      case 'git-operation-journal': return { passed: facts.journal.initialized && facts.journal.complete && facts.journal.errors.length === 0 && facts.journal.pendingCount === 0, message: JSON.stringify(facts.journal) };
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
    return { passed: err.code === 'git-addon-not-shipped', message: err.code === 'git-addon-not-shipped' ? 'info: addon not shipped on this channel until M10' : err.message }; }
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

export function compatibleGitContracts(versions, floor) {
  return versions.napi === 8 && Object.entries({ gitPort: 1, receipt: 1, walRecord: 1, eventStore: 4 }).every(([key, version]) => versions.contracts?.[key] === version) && floor.supported && floor.probes.every(p => p.passed);
}
