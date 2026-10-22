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
  for (const method of ['lastPathCommitTime', 'mergeTree', 'listTree', 'attributes', 'firstAncestryMerge', 'compareCommits', 'listBranches', 'checkoutFacts', 'remoteTracking', 'resolveCommit', 'resolveRepo', 'resolveRef', 'resolveLiteralRef', 'resolveTrunk', 'status', 'diff', 'diffText', 'ancestry', 'readObjects', 'pathsAtRevision', 'listWorktrees', 'compareContent', 'snapshotWrites', 'commitTime', 'countCommits', 'unmatchedCommitCount', 'trackedPaths', 'remoteUrl']) {
    facade[method] = (args = {}) => { outsideGate(); return port.call(method, args); };
  }
  return Object.freeze(facade);
}

/** The writer a Git port records for `fgosDir`'s session: the identity id as text (a `pid`
 * answer is an integer, every port's writer is a string). */
export function gitWriter(fgosDir) {
  return String(resolveWriterIdentity(fgosDir).id);
}

export function gitPortOptions(repoPath, { mutation = false } = {}) {
  outsideGate();
  const stateRoot = resolveStateRoot().stateRoot;
  const seed = { stateRoot, repoPath, trustedMain: repoPath };
  if (!mutation) return seed;
  const facts = createGitInspect(seed).resolveRepo();
  if (facts.notARepository) return seed;
  const options = { ...seed, trustedMain: facts.trustedMainRoot };
  if (mutation) options.writer = gitWriter(path.join(facts.trustedMainRoot, '.fgos'));
  return options;
}
