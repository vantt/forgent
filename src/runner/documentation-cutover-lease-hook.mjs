// Shared hook policy. The Git hooks supply a read-only Git adapter; no shell
// substitution carries byte paths and the borrower check runs in this process.
import path from 'node:path';
import { checkBorrowedDescription, resolveLock, LOCK_FD_ENV } from '../holder-lock/index.mjs';
import { resolveMainCheckoutRoot } from './paths.mjs';
import {
  DEFAULT_SIDECAR_PATH, parseSidecarJson, intersectsScope, checkLeaseCommitGuard,
  hashHolderToken, readTokenFromWorktree,
} from './documentation-cutover-lease.mjs';

// The empty tree object id for each Git object format.
const EMPTY_TREE = {
  sha1: '4b825dc642cb6eb9a060e54bf8d69288fbee4904',
  sha256: '6ef19b41225c5369f1c104d45d8d85efa9b057b53b14b4b9b939dd74decc5321',
};

// `merge-base --is-ancestor` exits 1 for "not an ancestor"; any other failure
// is a read error and must not grant admission.
function isAncestor(git, ancestor, descendant) {
  try { git(['merge-base', '--is-ancestor', ancestor, descendant]); return true; }
  catch (error) { if (error.status === 1) return false; throw error; }
}

function readBlob(git, revision) {
  try { return git(['cat-file', '-p', `${revision}:${DEFAULT_SIDECAR_PATH}`]).toString('utf8'); }
  catch {
    // A failed read is absent only if an independent tree listing proves it.
    try {
      const entries = git(['ls-tree', '-z', revision, '--', DEFAULT_SIDECAR_PATH]);
      if (entries.length === 0) return null;
    } catch (error) {
      if (revision === 'refs/heads/main') {
        try { git(['show-ref', '--verify', '--quiet', revision]); }
        catch (refError) { if (refError.status === 1) return null; }
      }
      throw error;
    }
    throw new Error('unreadable sidecar');
  }
}
function paths(raw) {
  if (raw.length && raw[raw.length - 1] !== 0) throw new Error('unterminated path list');
  return raw.toString('utf8').split('\0').filter(Boolean);
}
function borrower(root, env) {
  if (env[LOCK_FD_ENV] !== 'main-checkout:3') return false;
  const mainRoot = resolveMainCheckoutRoot(root);
  if (!mainRoot) throw new Error('main checkout cannot be resolved');
  const fgosDir = path.join(mainRoot, '.fgos');
  return checkBorrowedDescription(resolveLock('main-checkout', { fgosDir }).v3Path, { fgosDir, env }).result === 'borrower';
}
function legalTransition(old, next, changed, ref, parent, oldOid, root, env) {
  if (ref !== 'refs/heads/main' || parent !== oldOid || changed.length !== 1 || changed[0] !== DEFAULT_SIDECAR_PATH) return false;
  if (next.status === 'corrupt' || next.status === 'absent') return false;
  // Owner abandon is deliberately available without the holder's token in this
  // single-owner repository, including repair of corrupt committed evidence.
  const ownerAbandon = next.state === 'abandoned' && next.sidecar.abandon?.ownerConfirmed === true
    && typeof next.sidecar.abandon.reason === 'string' && next.sidecar.abandon.reason.trim().length > 0;
  let valid;
  if (old.status === 'corrupt') valid = ownerAbandon;
  else if (old.status === 'held') {
    valid = next.sidecar.holderTokenHash === old.sidecar.holderTokenHash
      && (ownerAbandon || (next.state === 'released'
        && hashHolderToken(readTokenFromWorktree(root)) === old.sidecar.holderTokenHash));
  } else valid = next.state === 'held';
  // The hook authenticates transitions, not drift. Cutover recomputes digests
  // from Git and never treats sidecar drift/releaseScopeDigests as authority.
  return valid && borrower(root, env);
}
export function guardCommit({ git, root, env = process.env }) {
  try {
    const raw = readBlob(git, 'refs/heads/main');
    const old = parseSidecarJson(raw);
    // Free/released leases freeze nothing. The ref hook validates a new held
    // transition before publication, including bootstrap and reacquire.
    if (old.status !== 'held' && old.status !== 'corrupt') return null;
    const changed = paths(git(['diff', '--cached', '--name-only', '-z', '--no-renames']));
    if (changed.includes(DEFAULT_SIDECAR_PATH)) {
      const next = parseSidecarJson(git(['show', `:${DEFAULT_SIDECAR_PATH}`]).toString('utf8'));
      const ref = git(['symbolic-ref', '-q', 'HEAD']).toString('utf8').trim();
      const head = git(['rev-parse', 'HEAD']).toString('utf8').trim();
      if (legalTransition(old, next, changed, ref, head, head, root, env)) return null;
    }
    return checkLeaseCommitGuard(root, { rawSidecarBlob: raw, stagedPaths: changed });
  } catch (error) { return `commit refused: documentation-cutover lease check failed closed (${error.message})`; }
}
export function guardReferenceTransaction({ git, root, input, env = process.env }) {
  try {
    const updates = input.trim().split('\n').filter(Boolean).map(line => line.trim().split(/\s+/));
    for (const [claimedOld, nextOid, ref] of updates) {
      if (ref !== 'refs/heads/main') continue;
      // `update-ref` without an expected old value and `branch -f` hand the hook
      // a zero old value even when main exists. Only a main proven absent is a
      // creation; otherwise judge the move from the main that is really there.
      let oldOid = claimedOld;
      if (/^0+$/.test(claimedOld)) {
        try { oldOid = git(['rev-parse', '--verify', '--quiet', 'refs/heads/main']).toString('utf8').trim() || claimedOld; }
        catch (error) { if (error.status !== 1) throw error; }
      }
      const raw = readBlob(git, 'refs/heads/main');
      const old = parseSidecarJson(raw);
      if (/^0+$/.test(nextOid)) {
        if (old.status === 'corrupt') throw new Error('corrupt lease sidecar');
        if (old.status === 'held') throw new Error('cannot delete main while lease held');
        continue;
      }
      // Another checkout may pull across acquire, holder Land and release.
      // Published history was admitted at its typed doors, not by this clone's
      // local sidecar/borrower. Only a forward move onto published history is
      // admitted: rewinding main would drop a held sidecar. Missing origin/main
      // keeps the local policy.
      let published;
      try { published = git(['rev-parse', '--verify', '--quiet', 'refs/remotes/origin/main']).toString('utf8').trim(); }
      catch (error) { if (error.status !== 1) throw error; }
      if (published && isAncestor(git, nextOid, published) && (/^0+$/.test(oldOid) || isAncestor(git, oldOid, nextOid))) continue;
      const nextRaw = readBlob(git, nextOid);
      if (old.status !== 'held' && old.status !== 'corrupt' && raw === nextRaw) continue;
      // Creating main: compare against the empty tree of this object format,
      // since the main ref it would otherwise resolve does not exist yet.
      const before = /^0+$/.test(oldOid) ? EMPTY_TREE[git(['rev-parse', '--show-object-format']).toString('utf8').trim()] : oldOid;
      if (!before) throw new Error('unknown Git object format');
      const changed = paths(git(['diff-tree', '-r', '--name-only', '-z', '--no-renames', before, nextOid]));
      if (old.status !== 'corrupt' && !intersectsScope(changed)) continue;
      const parents = git(['rev-list', '--parents', '-n', '1', nextOid]).toString('utf8').trim().split(/\s+/);
      if (legalTransition(old, parseSidecarJson(nextRaw), changed, ref, parents[1], oldOid, root, env)) continue;
      if (old.status === 'corrupt') throw new Error('corrupt lease sidecar');
      // Raw main ref movement into frozen scope is refused even for holders.
      if (old.status === 'held' || changed.includes(DEFAULT_SIDECAR_PATH)) throw new Error('reference update touches documentation scope or an unauthorized lease transition');
    }
    return null;
  } catch (error) { return `reference-transaction refused: ${error.message}; failing closed`; }
}
