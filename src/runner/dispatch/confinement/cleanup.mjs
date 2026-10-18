// cleanup.mjs — ownership markers and removal of local temp/private-home resources (spec §8.6).
//
// Ensures:
//   - Ownership markers are written before any allocation side effect is exposed.
//   - A cleanup never removes a directory it did not create.
//   - An attempt home is removed only by adopt's finalize-home step.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { stopProcessesInside } from '../stop-processes-inside.mjs';
import { writeBackRenewedCredential, settleHeldCredentialHome, writeFileAtomic, createCredentialRenewal } from '../provider-credential-renewal.mjs';

export const OWNERSHIP_MARKER_FILE = '.fgos-confinement-owner.json';

export const OWNERSHIP_CONTRACT = 'confinement-resource-ownership.v1';
export const OWNERSHIP_CREATOR = 'fgos-confinement';
/** The marker of a home that belongs to one supervised attempt: its owner is that attempt, not a process. */
export const ATTEMPT_HOME_MARKER_CONTRACT = 'confinement-resource-ownership.v2';

const ROOT_DIR_NAME = 'fgos-confinement';

/**
 * The temp root private homes live under. A private home holds a copy of an
 * account login, so the root must belong to the current user: when a directory
 * of that name already exists but is owned by someone else (a shared /tmp), a
 * per-uid root is used instead of trusting or fighting over it.
 */
export function resolveConfinementTempRoot(base = os.tmpdir()) {
  const shared = path.join(base, ROOT_DIR_NAME);
  const uid = typeof process.getuid === 'function' ? process.getuid() : null;
  if (uid === null) return shared;
  try {
    if (fs.statSync(shared).uid !== uid) return `${shared}-${uid}`;
  } catch {
    // Absent: the shared name is ours to create.
  }
  return shared;
}

/**
 * Create `dir` and every missing level between `root` and it owner-only (0700).
 * `mkdirSync({ recursive, mode })` ignores `mode` for a parent that already
 * exists and is masked by the umask for the rest, so each level is chmod'ed
 * explicitly. Levels above `root` are never touched.
 */
export function ensurePrivateDir(dir, { root } = {}) {
  const target = path.resolve(dir);
  const top = path.resolve(root ?? dir);
  const rel = path.relative(top, target);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`ensurePrivateDir: "${target}" is not inside "${top}".`);
  }
  const levels = [top];
  for (const part of rel === '' ? [] : rel.split(path.sep)) {
    levels.push(path.join(levels[levels.length - 1], part));
  }
  fs.mkdirSync(top, { recursive: true, mode: 0o700 });
  for (const level of levels) {
    if (!fs.existsSync(level)) fs.mkdirSync(level, { mode: 0o700 });
    const uid = typeof process.getuid === 'function' ? process.getuid() : null;
    if (uid === null || fs.statSync(level).uid === uid) fs.chmodSync(level, 0o700);
  }
  return target;
}

/**
 * Write ownership marker inside allocated directory.
 */
export function writeOwnershipMarker(dirPath, { dispatchId, resource = 'private-home', pid = process.pid } = {}) {
  if (!dirPath || typeof dirPath !== 'string') {
    throw new Error('dirPath is required for writeOwnershipMarker.');
  }
  if (!dispatchId || typeof dispatchId !== 'string') {
    throw new Error('dispatchId is required for writeOwnershipMarker.');
  }

  const markerData = {
    contract: OWNERSHIP_CONTRACT,
    creator: OWNERSHIP_CREATOR,
    dispatchId,
    resource,
    pid,
    createdAt: new Date().toISOString(),
  };

  const markerPath = path.join(dirPath, OWNERSHIP_MARKER_FILE);
  fs.writeFileSync(markerPath, JSON.stringify(markerData, null, 2), 'utf8');
  return markerPath;
}

/**
 * Write the ownership marker of a home that belongs to one supervised attempt. Only adopt's
 * finalize-home step removes such a home. Written atomically.
 */
export function writeOwnershipMarkerV2(dirPath, { attemptId, runDir, dispatchId, resource = 'private-home' } = {}) {
  if (!dirPath || typeof dirPath !== 'string') throw new Error('dirPath is required for writeOwnershipMarkerV2.');
  if (typeof attemptId !== 'string' || attemptId === '') throw new Error('attemptId is required for writeOwnershipMarkerV2.');
  if (typeof runDir !== 'string' || runDir === '') throw new Error('runDir is required for writeOwnershipMarkerV2.');
  const markerPath = path.join(dirPath, OWNERSHIP_MARKER_FILE);
  writeFileAtomic(markerPath, JSON.stringify({
    contract: ATTEMPT_HOME_MARKER_CONTRACT,
    creator: OWNERSHIP_CREATOR,
    attemptId,
    runDir,
    ...(typeof dispatchId === 'string' && dispatchId !== '' ? { dispatchId } : {}),
    resource,
    createdAt: new Date().toISOString(),
  }, null, 2));
  return markerPath;
}

/** The marker of an attempt home (version 2), or null when the directory has none of ours. */
export function readAttemptOwnershipMarker(dirPath) {
  try {
    const parsed = JSON.parse(fs.readFileSync(path.join(dirPath, OWNERSHIP_MARKER_FILE), 'utf8'));
    if (parsed?.contract === ATTEMPT_HOME_MARKER_CONTRACT && parsed.creator === OWNERSHIP_CREATOR) return parsed;
  } catch { /* absent or malformed: not an attempt home */ }
  return null;
}

/** Removal attempts a home with an unstaged renewed login gets before it is held for the owner. */
export const CREDENTIAL_KEEP_MAX_ATTEMPTS = 5;
export const CREDENTIAL_HOME_KEPT = 'credential-home-kept';
export const CREDENTIAL_HOME_HELD = 'credential-home-held';
/** Two failed attempts closer together than this count as one: a transient fault must not use up the budget. */
export const CREDENTIAL_KEEP_MIN_INTERVAL_MS = 15 * 60 * 1000;

/**
 * Add fields to the marker of a home this process created. Used for facts only known once the home is
 * filled (which account login it was copied from).
 */
export function extendOwnershipMarker(dirPath, fields) {
  const marker = readOwnershipMarker(dirPath) ?? readAttemptOwnershipMarker(dirPath);
  if (!marker) return false;
  // Temp file and rename: a remover in another process that reads the marker meanwhile sees the old or the
  // new content, never a half-written one (an unreadable marker would make the home look unowned).
  writeFileAtomic(path.join(dirPath, OWNERSHIP_MARKER_FILE), JSON.stringify({ ...marker, ...fields }, null, 2));
  return true;
}

/**
 * Read and validate ownership marker.
 */
export function readOwnershipMarker(dirPath) {
  const markerPath = path.join(dirPath, OWNERSHIP_MARKER_FILE);
  if (!fs.existsSync(markerPath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(markerPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && parsed.contract === OWNERSHIP_CONTRACT && parsed.creator === OWNERSHIP_CREATOR) {
      return parsed;
    }
  } catch {
    // Malformed marker is not a valid owned resource
  }
  return null;
}

/**
 * The per-dispatch parent exists only to hold its resources; once one is
 * removed, leave no empty shell behind (rmdir refuses a non-empty directory,
 * so a sibling resource keeps it alive).
 */
export function removeEmptyDispatchParent(removedPath, dispatchId) {
  const parent = path.dirname(removedPath);
  if (!dispatchId || path.basename(parent) !== dispatchId) return;
  try { fs.rmdirSync(parent); } catch { /* still in use */ }
}

// A marker file that is not recognisable as a marker of any fgOS contract (not JSON, not an object, no
// contract name). Such a file proves nothing about whether the home holds a login. One that names a
// contract but is not this module's own is the caller's ownership question.
function markerIsUnrecognisable(dirPath) {
  let raw;
  try { raw = fs.readFileSync(path.join(dirPath, OWNERSHIP_MARKER_FILE), 'utf8'); } catch { return false; }
  try {
    const parsed = JSON.parse(raw);
    return parsed === null || typeof parsed !== 'object' || Array.isArray(parsed) || typeof parsed.contract !== 'string';
  } catch { return true; }
}

/**
 * Count one failed removal of a home whose renewed login could not be staged, in its marker. An attempt
 * close after the last counted one is not counted again, so a transient fault cannot use up the budget.
 * Returns the number of counted attempts.
 */
export function countCredentialKeep(dirPath, marker, now = Date.now) {
  const kept = marker.credentialKept;
  const at = now();
  const spaced = !Number.isFinite(kept?.lastCountedAt) || at - kept.lastCountedAt >= CREDENTIAL_KEEP_MIN_INTERVAL_MS;
  const attempts = (kept?.attempts ?? 0) + (spaced ? 1 : 0);
  if (spaced) {
    try {
      extendOwnershipMarker(dirPath, { credentialKept: { attempts, since: kept?.since ?? new Date(at).toISOString(), lastCountedAt: at } });
    } catch { /* the home is kept either way; the next removal counts again */ }
  }
  return attempts;
}

/**
 * Delete a confinement directory. The one removal every path goes through (the driver's cleanup, the
 * finalizer of a settled dispatch and adopt's finalize-home step), so a login renewed inside a private home is
 * offered to its source before the home is gone, whichever path gets there. A home whose marker does not
 * ask for write-back is removed exactly as before; a write-back problem is reported by a fixed code on
 * stderr and never stops the removal, except that a home whose renewed login could not be staged is kept
 * (the call throws `credential-home-kept`, and the attempt is counted in the marker) so a later removal
 * retries; after CREDENTIAL_KEEP_MAX_ATTEMPTS the call throws `credential-home-held` without trying again.
 *
 * @param {string} dirPath
 * @param {{stopProcesses?: boolean}} [options] `stopProcesses`: end whatever still runs from inside first
 */
export function removeConfinementDir(dirPath, { stopProcesses = false, now = Date.now } = {}) {
  // An attempt home is removed only by adopt's finalize-home step, never through this door.
  if (readAttemptOwnershipMarker(dirPath)) throw new Error('attempt-home-owned-by-adopt');
  if (stopProcesses) stopProcessesInside(dirPath);
  const marker = readOwnershipMarker(dirPath);
  // A marker file that is there but cannot be recognised (a writer died half-way, or it holds something
  // else) does not prove the home holds no login: leave it alone.
  if (!marker && markerIsUnrecognisable(dirPath)) {
    throw new Error('ownership-marker-unreadable');
  }
  if (marker?.credentialWriteBack !== undefined) {
    // A home whose staging already failed the allowed number of times is not retried any more and is
    // never deleted for being old: `fgos doctor` reports it, and a later renewal of its account or
    // `fgos doctor --fix` settles it once that can be shown safe.
    if ((marker.credentialKept?.attempts ?? 0) >= CREDENTIAL_KEEP_MAX_ATTEMPTS) {
      throw new Error(CREDENTIAL_HOME_HELD);
    }
    const result = writeBackRenewedCredential(dirPath, marker);
    if (result.status === 'failed') {
      if (result.keepHome) {
        // The home may hold the only good refresh token and no copy of it is safe yet: leave it and its
        // marker so a later removal retries (up to the bound), and say so with a fixed code (no paths, no
        // values). An attempt close after the last counted one is not counted again.
        const attempts = countCredentialKeep(dirPath, marker, now);
        const held = attempts >= CREDENTIAL_KEEP_MAX_ATTEMPTS;
        process.stderr.write(`fgos: credential write-back not done (${result.code}); private home ${held ? 'held for the owner' : 'kept for a later retry'}\n`);
        throw new Error(held ? CREDENTIAL_HOME_HELD : CREDENTIAL_HOME_KEPT);
      }
      process.stderr.write(`fgos: credential write-back not done (${result.code})\n`);
    }
  }
  fs.rmSync(dirPath, { recursive: true, force: true });
}

/**
 * Cleanup a single confinement resource safely.
 * Only removes if ownership marker matches dispatchId.
 */
export function cleanupConfinementResource(dirPath, dispatchId) {
  if (!dirPath || !fs.existsSync(dirPath)) {
    return { cleaned: false, reason: 'not-found' };
  }

  const marker = readOwnershipMarker(dirPath);
  if (!marker) {
    return { cleaned: false, reason: 'missing-or-invalid-marker' };
  }

  if (dispatchId && marker.dispatchId !== dispatchId) {
    return { cleaned: false, reason: 'dispatch-id-mismatch' };
  }

  try {
    // Whatever still runs from inside a resource that is being deleted is a leftover of its
    // dispatch (an agent CLI's own background server); it would outlive the files it runs from.
    removeConfinementDir(dirPath, { stopProcesses: true });
    removeEmptyDispatchParent(dirPath, marker.dispatchId);
    return { cleaned: true, path: dirPath, dispatchId: marker.dispatchId };
  } catch (err) {
    return { cleaned: false, reason: 'removal-failed', error: err.message };
  }
}

/**
 * Private homes under `tempRoot` that were kept because their renewed login could not be staged
 * (`credentialKept` in the marker). Read-only; names, counts, times and the home directory, never a value.
 * `held` homes have used up CREDENTIAL_KEEP_MAX_ATTEMPTS and are no longer retried.
 */
export function listKeptCredentialHomes(tempRoot) {
  const found = [];
  let dispatches = [];
  try { dispatches = fs.readdirSync(tempRoot, { withFileTypes: true }); } catch { return found; }
  for (const entry of dispatches) {
    if (!entry.isDirectory()) continue;
    const dispatchDir = path.join(tempRoot, entry.name);
    const candidates = [dispatchDir];
    try {
      for (const sub of fs.readdirSync(dispatchDir, { withFileTypes: true })) {
        if (sub.isDirectory()) candidates.push(path.join(dispatchDir, sub.name));
      }
    } catch { /* vanished meanwhile */ }
    for (const cand of candidates) {
      const marker = readOwnershipMarker(cand) ?? readAttemptOwnershipMarker(cand);
      const attempts = marker?.credentialKept?.attempts;
      if (!Number.isInteger(attempts) || attempts < 1) continue;
      found.push({
        dir: cand,
        provider: typeof marker.credentialWriteBack?.provider === 'string' ? marker.credentialWriteBack.provider : 'unknown',
        accountId: typeof marker.credentialWriteBack?.accountId === 'string' ? marker.credentialWriteBack.accountId : 'unknown',
        attempts,
        held: attempts >= CREDENTIAL_KEEP_MAX_ATTEMPTS,
        since: marker.credentialKept.since ?? marker.createdAt ?? null,
        marker,
      });
    }
  }
  return found;
}

/**
 * Re-check the held homes under `tempRoots` (optionally only one account's) and remove the ones that can
 * now be shown safe to remove: the source proves the login in the home is not newer, or it has been
 * staged beside the source. Every other held home stays exactly as it was; age never removes one.
 * `unretriedRoots`: roots nothing retries by itself (a registered backend's own roots); a kept home there counts
 * as held. `lockHeld`: the caller already holds the account lock. Returns `{settled, held}` as counts.
 */
/**
 * A root as the file system sees it: the real path when it exists (a symlink to another root is the same
 * root), the resolved path otherwise. Roots are compared by this, never by how they were spelled.
 */
export function canonicalRoot(root) {
  try { return fs.realpathSync(root); } catch { return path.resolve(root); }
}

export function settleHeldCredentialHomes({ tempRoots = [resolveConfinementTempRoot()], unretriedRoots = [], provider, accountId, runtimeDir, lockHeld = false, loadSqlite, now, tryLock } = {}) {
  let settled = 0;
  let held = 0;
  const seen = new Set();
  const unretried = new Set(unretriedRoots.map(canonicalRoot));
  for (const root of tempRoots) {
    for (const home of listKeptCredentialHomes(root)) {
      // A root nested inside another is listed twice; a home is looked at once.
      const dir = path.join(canonicalRoot(path.dirname(home.dir)), path.basename(home.dir));
      if (seen.has(dir)) continue;
      seen.add(dir);
      // A home under a root no dispatch retries is never going to count its own attempts up, so
      // it is treated as held from the start.
      if (!home.held && !unretried.has(canonicalRoot(root))) continue;
      if (provider !== undefined && (home.provider !== provider || home.accountId !== accountId)) continue;
      if (runtimeDir !== undefined && home.marker.credentialWriteBack?.runtimeDir !== runtimeDir) continue;
      const result = settleHeldCredentialHome(home.dir, home.marker, { lockHeld, loadSqlite, now, tryLock });
      if (result.status === 'settled') {
        try {
          fs.rmSync(home.dir, { recursive: true, force: true });
          removeEmptyDispatchParent(home.dir, home.marker.dispatchId);
          settled += 1;
          continue;
        } catch { /* it stays; the next pass retries */ }
      }
      held += 1;
    }
  }
  return { settled, held };
}

/**
 * The renewal function a dispatch is opted in with, wired to this module's held homes: refresh-ahead of an
 * account re-checks that account's held homes under the account lock it already holds. Every dispatch
 * caller passes this one (the renewal module itself knows nothing of confinement).
 */
export function createConfinementCredentialRenewal({ tempRoots, ...options } = {}) {
  // `tempRoots`: an array, or a function returning one (read at each use, so a registry change is seen).
  const roots = () => (typeof tempRoots === 'function' ? tempRoots() : tempRoots) ?? [resolveConfinementTempRoot()];
  const ofAccount = (home, provider, accountId, runtimeDir) => home.held && home.provider === provider && home.accountId === accountId
    && home.marker.credentialWriteBack?.runtimeDir === runtimeDir;
  return createCredentialRenewal({
    ...options,
    heldHomes: {
      has: ({ provider, accountId, runtimeDir }) => roots().some((root) => listKeptCredentialHomes(root).some((h) => ofAccount(h, provider, accountId, runtimeDir))),
      settle: ({ provider, accountId, runtimeDir, loadSqlite, now }) => settleHeldCredentialHomes({ tempRoots: roots(), provider, accountId, runtimeDir, lockHeld: true, loadSqlite, now }),
    },
  });
}
