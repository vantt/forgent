// Thin doctor/setup adapter: repository trust, configuration and WAL parsing stay in Rust.
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { loadNativeAddon } from '../git/native.mjs';
import { resolveStateRoot } from '../holder-lock/state-root.mjs';
import { resolveMainCheckoutRoot } from '../runner/paths.mjs';

export const FETCH_MAPPING = ['+refs/fgos/events/*:refs/fgos/remotes/origin/events/*', '+refs/fgos/legacy:refs/fgos/remotes/origin/legacy'];
function context(cwd, loaderOptions) {
  const root = resolveMainCheckoutRoot(cwd) ?? cwd;
  return { root, stateRoot: resolveStateRoot({ fgosDir: path.join(root, '.fgos') }).stateRoot, native: loadNativeAddon(loaderOptions) };
}
export function checkGit(cwd, kind, loaderOptions) {
  try {
    const { root, stateRoot, native } = context(cwd, loaderOptions);
    const versions = native.versions();
    const facts = native.inspectGit(stateRoot, cwd, root);
    if (kind === 'git-component-compatible') return { passed: compatibleGitContracts(versions, facts.floor), message: JSON.stringify({ versions, floor: facts.floor }) };
    if (facts.notARepository) return { passed: true, message: 'info: not a Git repository' };
    switch (kind) {
      case 'git-trust-topology': return { passed: true, message: `${facts.commonDir}: ${facts.layout}` };
      case 'git-operation-journal': return { passed: facts.journal.initialized && facts.journal.complete && facts.journal.errors.length === 0 && facts.journal.pendingCount === 0, message: JSON.stringify(facts.journal) };
      case 'git-native-locks': return { passed: facts.nativeLocks.length === 0, message: facts.nativeLocks.length ? `native locks detected (never removed): ${facts.nativeLocks.join(', ')}` : 'no native Git locks detected' };
      case 'git-publication-refspecs': return { passed: FETCH_MAPPING.every(r => facts.fetchRefspecs.includes(r)), message: JSON.stringify(facts.fetchRefspecs) };
      case 'git-durability-capability': return { passed: true, message: `info: ${facts.durability}` };
      default: throw new Error(`unknown Git check: ${kind}`);
    }
  } catch (err) { return { passed: err.code === 'git-addon-not-shipped', message: err.code === 'git-addon-not-shipped' ? 'info: addon not shipped on this channel until M10' : err.message }; }
}
function initializeWal(cwd) {
  const { root, stateRoot, native } = context(cwd);
  const before = native.inspectGit(stateRoot, cwd, root);
  if (before.notARepository) return { changed: false, message: 'not a Git repository' };
  native.initializeGitWal(stateRoot, cwd, root);
  return { changed: !before.journal.initialized, message: 'Git WAL initialized and trusted' };
}
function installFetchMapping(cwd) {
  const { root, stateRoot, native } = context(cwd);
  const before = native.inspectGit(stateRoot, cwd, root);
  if (before.notARepository || FETCH_MAPPING.every(r => before.fetchRefspecs.includes(r))) return { changed: false, message: 'no fetch mapping change needed' };
  native.ensureGitFetchMapping(stateRoot, cwd, root, 'origin', FETCH_MAPPING, `setup-${randomUUID()}`);
  return { changed: true, message: 'installed additive fgOS origin fetch mappings' };
}

function attemptFix(cwd, fix) {
  try { return fix(cwd); }
  catch (err) { return { changed: false, message: `warning: Git setup refused: ${err.message}` }; }
}
export function fixGitWal(cwd) { return attemptFix(cwd, initializeWal); }
export function fixGitFetchMapping(cwd) { return attemptFix(cwd, installFetchMapping); }

export function compatibleGitContracts(versions, floor) {
  return versions.napi === 8 && Object.entries({ gitPort: 1, receipt: 1, walRecord: 1, eventStore: 4 }).every(([key, version]) => versions.contracts?.[key] === version) && floor.supported && floor.probes.every(p => p.passed);
}
