// cleanup.mjs — ownership markers and removal of local temp/private-home resources (spec §8.6).
//
// Ensures:
//   - Ownership markers are written before any allocation side effect is exposed.
//   - A cleanup never removes a directory it did not create.
//   - An attempt home is removed only by adopt's finalize-home step, or settled once it was held.
//   - Where a home's renewed login goes back to, and how often its staging failed, are kept in a host-only
//     record beside the home (outside every grant of the sandbox), never in the home itself.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { stopProcessesInside } from '../stop-processes-inside.mjs';
import { writeFileAtomic, writeBackRenewedCredential } from '../provider-credential-renewal.mjs';
import { readAgentFileSync } from '../../../native/proof-helpers.mjs';

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
    // lstat: a link another user left under the shared name is theirs, whatever it points at.
    if (fs.lstatSync(shared).uid !== uid) return `${shared}-${uid}`;
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

// The marker sits in a home the agent could write: read through the agent-file door (no link followed, no
// blocking on a pipe, a bounded regular file). It only identifies the home; it never says where a login goes.
export const MAX_HOME_MARKER_BYTES = 64 * 1024;
const UNSAFE_MARKER_ERRORS = new Set(['ELOOP', 'ENOTREGULAR', 'E2BIG']);

function readMarkerText(dirPath) {
  return readAgentFileSync(path.join(dirPath, OWNERSHIP_MARKER_FILE), MAX_HOME_MARKER_BYTES).toString('utf8');
}

/** The marker of an attempt home (version 2), or null when the directory has none of ours. */
export function readAttemptOwnershipMarker(dirPath) {
  try {
    const parsed = JSON.parse(readMarkerText(dirPath));
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
    const parsed = JSON.parse(readMarkerText(dirPath));
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
  try { raw = readMarkerText(dirPath); } catch (err) {
    // A link, a pipe or an oversized file in the marker's place is not a marker, and says nothing about the login.
    return UNSAFE_MARKER_ERRORS.has(err?.code);
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed === null || typeof parsed !== 'object' || Array.isArray(parsed) || typeof parsed.contract !== 'string';
  } catch { return true; }
}

// ---------------------------------------------------------------------------------------------------
// The host-only record of an attempt home: `<tempRoot>/<dispatchId>/attempt-home.json`, beside the home in the
// owner-only dispatch directory, which no sandbox is granted (the sandbox sees the host read-only at most, and
// the default temp root not at all). It names the attempt, the write-back target the finalization descriptor
// holds and the count of failed stagings. Nothing written inside the home can change it.
// ---------------------------------------------------------------------------------------------------

export const ATTEMPT_HOME_RECORD_FILE = 'attempt-home.json';
const ATTEMPT_HOME_RECORD_CONTRACT = 'confinement-attempt-home-record.v1';

const recordPathOf = (homeDir) => path.join(path.dirname(homeDir), ATTEMPT_HOME_RECORD_FILE);

/** Write the host record of an attempt home (whole, atomically, 0600). Returns its path. */
export function writeAttemptHomeRecord(homeDir, { attemptId, runDir, dispatchId, credentialWriteBack = null, credentialKept } = {}) {
  const file = recordPathOf(homeDir);
  writeFileAtomic(file, `${JSON.stringify({
    contract: ATTEMPT_HOME_RECORD_CONTRACT,
    attemptId,
    runDir,
    dispatchId,
    home: homeDir,
    credentialWriteBack,
    ...(credentialKept ? { credentialKept } : {}),
  }, null, 2)}\n`);
  return file;
}

/**
 * The host record of `homeDir`, or null when there is none of this contract for exactly that home (an older
 * release wrote none). With `attemptId`/`runDir`, a record of another attempt is none as well.
 */
export function readAttemptHomeRecord(homeDir, { attemptId, runDir } = {}) {
  let record;
  try { record = JSON.parse(fs.readFileSync(recordPathOf(homeDir), 'utf8')); } catch { return null; }
  if (record?.contract !== ATTEMPT_HOME_RECORD_CONTRACT || record.home !== homeDir || record.dispatchId !== path.basename(path.dirname(homeDir))) return null;
  if ((attemptId !== undefined && record.attemptId !== attemptId) || (runDir !== undefined && record.runDir !== runDir)) return null;
  return record;
}

/**
 * Count one failed removal of a home whose renewed login could not be staged, in its host record (written from
 * `fields` when the home has none yet). An attempt close after the last counted one is not counted again, so a
 * transient fault cannot use up the budget. Returns the number of counted attempts.
 */
export function countCredentialKeep(homeDir, fields, now = Date.now) {
  const record = readAttemptHomeRecord(homeDir, fields) ?? fields;
  const kept = record.credentialKept;
  const at = now();
  const spaced = !Number.isFinite(kept?.lastCountedAt) || at - kept.lastCountedAt >= CREDENTIAL_KEEP_MIN_INTERVAL_MS;
  const attempts = (kept?.attempts ?? 0) + (spaced ? 1 : 0);
  if (spaced) {
    try {
      writeAttemptHomeRecord(homeDir, { ...fields, credentialKept: { attempts, since: kept?.since ?? new Date(at).toISOString(), lastCountedAt: at } });
    } catch { /* the home is kept either way; the next removal counts again */ }
  }
  return attempts;
}

/** Remove an attempt home, its host record and the dispatch directory once nothing else is in it. */
export function removeAttemptHome(homeDir, dispatchId) {
  fs.rmSync(homeDir, { recursive: true, force: true });
  fs.rmSync(recordPathOf(homeDir), { force: true });
  removeEmptyDispatchParent(homeDir, dispatchId);
}

/**
 * Delete a confinement directory of a dispatch outside the assignment door (the driver's cleanup and the
 * finalizer of a settled dispatch). Such a home is never written back: only an attempt opts in to credential
 * write-back, and an attempt home is removed only by adopt's finalize-home step. Nothing a home's own marker
 * says can make this removal write a login anywhere.
 *
 * @param {string} dirPath
 * @param {{stopProcesses?: boolean}} [options] `stopProcesses`: end whatever still runs from inside first
 */
export function removeConfinementDir(dirPath, { stopProcesses = false } = {}) {
  // An attempt home is removed only by adopt's finalize-home step, never through this door.
  if (readAttemptOwnershipMarker(dirPath)) throw new Error('attempt-home-owned-by-adopt');
  if (stopProcesses) {
    const { left } = stopProcessesInside(dirPath);
    if (left.length > 0) throw new Error(`confinement-dir-in-use: pid ${left.map((view) => view.pid).join(', ')} still runs from the directory or has no readable identity`);
  }
  const marker = readOwnershipMarker(dirPath);
  // A marker file that is there but cannot be recognised (a writer died half-way, or it holds something
  // else) does not prove the home holds no login: leave it alone.
  if (!marker && markerIsUnrecognisable(dirPath)) {
    throw new Error('ownership-marker-unreadable');
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
 * Private homes under `tempRoot` that were kept because their renewed login could not be staged. Read-only;
 * counts, times, the home directory and its host `record` (null for a home an older release counted in its
 * marker: such a home names no store anyone may trust, and is recovered by hand), never a value. `held` homes
 * have used up CREDENTIAL_KEEP_MAX_ATTEMPTS and are no longer retried by their attempt.
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
      const record = readAttemptHomeRecord(cand);
      const kept = record ? record.credentialKept : (readOwnershipMarker(cand) ?? readAttemptOwnershipMarker(cand))?.credentialKept;
      const attempts = kept?.attempts;
      if (!Number.isInteger(attempts) || attempts < 1) continue;
      found.push({ dir: cand, attempts, held: attempts >= CREDENTIAL_KEEP_MAX_ATTEMPTS, since: kept.since ?? null, record });
    }
  }
  return found;
}

/**
 * Settle the held homes under `tempRoots` whose host record says where their login goes: the login is staged
 * beside the account's store (`writeBackRenewedCredential`, which never applies it; the next refresh-ahead
 * applies it after the probe), or proven no newer, and the home is removed. A home without a record, or whose
 * staging still fails, stays held. `unretriedRoots`: roots no attempt retries by itself, where a kept home
 * counts as held. Never throws; returns `{settled, held}` as counts.
 */
export function settleHeldCredentialHomes({ tempRoots = [resolveConfinementTempRoot()], unretriedRoots = [] } = {}) {
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
      if (!home.held && !unretried.has(canonicalRoot(root))) continue;
      try {
        if (home.record && writeBackRenewedCredential(home.dir, home.record.credentialWriteBack ?? undefined).status !== 'failed') {
          removeAttemptHome(home.dir, home.record.dispatchId);
          settled += 1;
          continue;
        }
      } catch { /* it stays; the next pass retries */ }
      held += 1;
    }
  }
  return { settled, held };
}

/**
 * A root as the file system sees it: the real path when it exists (a symlink to another root is the same
 * root), the resolved path otherwise. Roots are compared by this, never by how they were spelled.
 */
export function canonicalRoot(root) {
  try { return fs.realpathSync(root); } catch { return path.resolve(root); }
}
