// Typed read facade; policy, parsing and byte paths belong to fgos-git.
import path from 'node:path';
import { resolveStateRoot } from '../holder-lock/index.mjs';
import { resolveWriterIdentity } from '../util/session-identity.mjs';
import { hotLockDepth } from '../holder-lock/hot-guard.mjs';
import { loadNativeAddon } from './native.mjs';
function outsideGate() {
  if (hotLockDepth() > 0) throw Object.assign(new Error('exec-under-hot-lock: Git Inspect'), { code: 'exec-under-hot-lock' });
}
/** `options.detached` marks a background seal or publish child: it never creates a state root that is gone, and fails with code `state-root-gone`. */
export function createGitInspect(options, loaderOptions) {
  outsideGate();
  const native = loadNativeAddon(loaderOptions);
  let port;
  try {
    port = new native.GitInspect(options.stateRoot, options.repoPath, options.trustedMain, options.detached ?? false);
  } catch (error) {
    if (error.message === 'state-root-gone') error.code = 'state-root-gone';
    throw error;
  }
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

/** Mutation options resolve the repository once; a caller that already holds an inspect port for
 * `repoPath` passes it as `inspect` so that resolution is not repeated. */
export function gitPortOptions(repoPath, { mutation = false, inspect, detached = false } = {}) {
  outsideGate();
  const stateRoot = resolveStateRoot().stateRoot;
  const seed = { stateRoot, repoPath, trustedMain: repoPath, detached };
  if (!mutation) return seed;
  const facts = (inspect ?? createGitInspect(seed)).resolveRepo();
  if (facts.notARepository) return seed;
  return { ...seed, trustedMain: facts.trustedMainRoot, writer: gitWriter(path.join(facts.trustedMainRoot, '.fgos')) };
}

/** The codes of a Git door that is not there at all (no addon shipped, or none that loads), as opposed to one that answered with a refusal. */
export const NO_GIT_DOOR_CODES = new Set(['git-addon-unavailable', 'git-addon-not-shipped']);

/**
 * One worktree-tier decision of the addon (`resolveInvocationRoot`, `admitStoreAccess`): the request in, the answer or `{ refused: { faultClass, message } }` out.
 * Policy, refusal texts and fault classes live in `fgos-git`; this only carries the request, outside any hot lock.
 */
export function worktreeDoor(door, request) {
  outsideGate();
  const native = loadNativeAddon();
  if (typeof native[door] !== 'function') {
    throw Object.assign(new Error(`git-addon-unavailable: this addon predates ${door}; restage the active release with fgctl init`), { code: 'git-addon-unavailable' });
  }
  return native[door](request);
}

/** The repository facts of the checkout `cwd` sits in (`notARepository` when it sits in none); throws when Git cannot be read.
 * The one read every root answer is built from. */
export function readRepoFacts(cwd = process.cwd(), { detached = false } = {}) {
  return createGitInspect(gitPortOptions(cwd, { detached })).resolveRepo();
}

/**
 * Whether `relativePath` names an entry at `revision`. A blob larger than the
 * read budget still exists; any other unreadable answer throws.
 */
export function pathExistsAt(root, revision, relativePath) {
  const [entry] = createGitInspect(gitPortOptions(root)).pathsAtRevision({ revision, paths: [[...Buffer.from(relativePath)]], maxBlobBytes: 1 });
  if (!entry) throw new Error(`no answer for ${relativePath}`);
  if (entry.value.kind === 'error' && entry.value.cause !== 'blob-too-large') throw new Error(`${relativePath} at ${revision}: ${entry.value.cause}`);
  return entry.value.kind !== 'absent';
}

/** The commit `name` resolves to; throws when it names none. */
export function commitAt(root, name) {
  const oid = createGitInspect(gitPortOptions(root)).resolveCommit({ name });
  if (!oid) throw new Error(`${name} is not a commit`);
  return oid;
}
