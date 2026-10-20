// Typed read facade; policy, parsing and byte paths belong to fgos-git.
import path from 'node:path';
import { resolveStateRoot } from '../holder-lock/index.mjs';
import { resolveWriterIdentity } from '../util/session-identity.mjs';
import { hotLockDepth } from '../holder-lock/hot-guard.mjs';
import { loadNativeAddon } from './native.mjs';
function outsideGate() {
  if (hotLockDepth() > 0) throw Object.assign(new Error('exec-under-hot-lock: Git Inspect'), { code: 'exec-under-hot-lock' });
}
export function createGitInspect(options, loaderOptions) {
  outsideGate();
  const native = loadNativeAddon(loaderOptions);
  const port = new native.GitInspect(options.stateRoot, options.repoPath, options.trustedMain);
  const facade = {};
  for (const method of ['compareCommits', 'listBranches', 'checkoutFacts', 'remoteTracking', 'resolveCommit', 'resolveRepo', 'resolveRef', 'resolveTrunk', 'status', 'diff', 'ancestry', 'readObjects', 'pathsAtRevision', 'listWorktrees', 'compareContent', 'snapshotWrites']) {
    facade[method] = (args = {}) => { outsideGate(); return port.call(method, args); };
  }
  return Object.freeze(facade);
}

export function gitPortOptions(repoPath, { mutation = false } = {}) {
  outsideGate();
  const stateRoot = resolveStateRoot({ fgosDir: path.join(repoPath, '.fgos') }).stateRoot;
  const seed = { stateRoot, repoPath, trustedMain: repoPath };
  if (!mutation) return seed;
  const facts = createGitInspect(seed).resolveRepo();
  if (facts.notARepository) return seed;
  const options = { ...seed, trustedMain: facts.trustedMainRoot };
  if (mutation) options.writer = String(resolveWriterIdentity(path.join(facts.trustedMainRoot, '.fgos')).id);
  return options;
}
