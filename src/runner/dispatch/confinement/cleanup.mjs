// cleanup.mjs — cleanup and reaper for local temp/private-home resources (Phase 03 R5, spec §8.6).
//
// Ensures:
//   - Ownership markers are written before any allocation side effect is exposed.
//   - A cleanup or reaper never removes a directory it did not create.
//   - Reaper is idempotent: running it multiple times never errors or double-acts.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { stopProcessesInside } from '../stop-processes-inside.mjs';
import { envForSession } from '../worker-session.mjs';
import { writeBackRenewedCredential, settleHeldCredentialHome, writeFileAtomic } from '../provider-credential-renewal.mjs';

export const OWNERSHIP_MARKER_FILE = '.fgos-confinement-owner.json';

/** How old an empty per-dispatch directory must be before the reaper removes it. */
export const EMPTY_SHELL_GRACE_MS = 600000;
export const OWNERSHIP_CONTRACT = 'confinement-resource-ownership.v1';
export const OWNERSHIP_CREATOR = 'fgos-confinement';

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
 * Record that the pane this resource's worker runs in was left open, so the
 * home (and the login copy in it) must outlive the failed run. The reaper
 * reclaims it once the pane is gone.
 */
export function markResourceRetained(dirPath, { paneId, herdrSession } = {}) {
  const marker = readOwnershipMarker(dirPath);
  if (!marker || !paneId) return false;
  fs.writeFileSync(
    path.join(dirPath, OWNERSHIP_MARKER_FILE),
    JSON.stringify({ ...marker, paneId: String(paneId), ...(herdrSession ? { herdrSession: String(herdrSession) } : {}), retainedAt: new Date().toISOString() }, null, 2),
    { encoding: 'utf8', mode: 0o600 },
  );
  return true;
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
  const marker = readOwnershipMarker(dirPath);
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

function markerIsTorn(dirPath) {
  let raw;
  try { raw = fs.readFileSync(path.join(dirPath, OWNERSHIP_MARKER_FILE), 'utf8'); } catch { return false; }
  try { JSON.parse(raw); return false; } catch { return true; }
}

/**
 * Delete a confinement directory. The one removal every path goes through (the driver's cleanup, the
 * finalizer of a settled dispatch and the orphan reaper), so a login renewed inside a private home is
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
  if (stopProcesses) stopProcessesInside(dirPath);
  const marker = readOwnershipMarker(dirPath);
  // A marker that is there but is not even valid JSON (a writer died half-way) does not prove the home
  // holds no login: leave it alone. One that parses but is not ours is the caller's ownership question.
  if (!marker && markerIsTorn(dirPath)) {
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
        const kept = marker.credentialKept;
        const at = now();
        const spaced = !Number.isFinite(kept?.lastCountedAt) || at - kept.lastCountedAt >= CREDENTIAL_KEEP_MIN_INTERVAL_MS;
        const attempts = (kept?.attempts ?? 0) + (spaced ? 1 : 0);
        if (spaced) {
          try {
            extendOwnershipMarker(dirPath, { credentialKept: { attempts, since: kept?.since ?? new Date(at).toISOString(), lastCountedAt: at } });
          } catch { /* the home is kept either way; the next removal counts again */ }
        }
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
 * (`credentialKept` in the marker). Read-only; names, counts and times only, never a path or a value.
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
      const marker = readOwnershipMarker(cand);
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
 * `lockHeld`: the caller already holds the account lock. Returns `{settled, held}` as counts.
 */
export function settleHeldCredentialHomes({ tempRoots = [resolveConfinementTempRoot()], provider, accountId, lockHeld = false, loadSqlite, now, tryLock } = {}) {
  let settled = 0;
  let held = 0;
  for (const root of tempRoots) {
    for (const home of listKeptCredentialHomes(root)) {
      if (!home.held) continue;
      if (provider !== undefined && (home.provider !== provider || home.accountId !== accountId)) continue;
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

/** Whether a herdr pane is still open: true / false, or null when herdr
 * cannot be asked (not installed, no reachable session). Imported lazily so
 * this module stays free of the transport unless a retained home exists. */
function defaultPaneOpen(paneId, herdrSession) {
  try {
    // The server that owns the pane: the recorded session's, never whichever one this process's own
    // environment happens to name. A marker without a session cannot be asked, so the expiry rule decides.
    if (!herdrSession) return null;
    const out = spawnSync(process.env.FGOS_HERDR_BIN?.trim() || 'herdr', ['pane', 'list'], {
      encoding: 'utf8', timeout: 5000, env: envForSession(process.env, herdrSession),
    });
    if (out.status !== 0) return null;
    const parsed = JSON.parse(out.stdout);
    const panes = parsed?.result?.panes ?? parsed?.panes ?? [];
    return panes.some((p) => (p.pane_id ?? p.paneId) === paneId);
  } catch {
    return null;
  }
}

function isProcessAlive(pid) {
  if (typeof pid !== 'number' || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM'; // Process exists but owned by someone else
  }
}

/**
 * Idempotent reaper for orphaned confinement resources under a tempRoot (spec §8.6, R5).
 * Safe to run repeatedly; ignores unowned or still-active directories.
 */
export function reapOrphanedConfinementResources({
  tempRoot,
  maxAgeMs = 3600000,
  checkLiveness = isProcessAlive,
  checkPaneOpen = defaultPaneOpen,
} = {}) {
  if (!tempRoot || !fs.existsSync(tempRoot)) {
    return { reaped: [], skipped: [] };
  }

  const reaped = [];
  const skipped = [];
  const now = Date.now();

  let entries = [];
  try {
    entries = fs.readdirSync(tempRoot, { withFileTypes: true });
  } catch {
    return { reaped, skipped };
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dispatchDir = path.join(tempRoot, entry.name);

    // A per-dispatch directory with nothing in it holds no credential copy and no marker to
    // trust; it is a shell a dispatch left behind. Removing it is safe once it is old enough
    // that no dispatch can still be about to fill it (rmdir refuses a non-empty directory).
    try {
      if (fs.readdirSync(dispatchDir).length === 0 && now - fs.statSync(dispatchDir).mtimeMs > Math.min(maxAgeMs, EMPTY_SHELL_GRACE_MS)) {
        fs.rmdirSync(dispatchDir);
        reaped.push({ path: dispatchDir, dispatchId: entry.name, reason: 'empty' });
        continue;
      }
    } catch {
      // vanished or filled meanwhile: leave it to the marker rules below
    }

    // Check dispatchDir or subdirectories (e.g. dispatchDir/home)
    const candidates = [dispatchDir];
    try {
      const subEntries = fs.readdirSync(dispatchDir, { withFileTypes: true });
      for (const sub of subEntries) {
        if (sub.isDirectory()) {
          candidates.push(path.join(dispatchDir, sub.name));
        }
      }
    } catch {
      // ignore
    }

    for (const cand of candidates) {
      const marker = readOwnershipMarker(cand);
      if (!marker) {
        // Not created by us; do not touch
        continue;
      }

      const createdTime = marker.createdAt ? new Date(marker.createdAt).getTime() : 0;
      const isExpired = createdTime > 0 && now - createdTime > maxAgeMs;
      const processDead = !checkLiveness(marker.pid);

      // A home kept for a left-open pane is in use until that pane closes,
      // whatever became of the process that launched it. Expiry still wins
      // over an unanswerable pane check (`checkPaneOpen` -> null), so a
      // credential copy cannot outlive maxAgeMs just because herdr is away.
      if (marker.paneId) {
        const open = checkPaneOpen(marker.paneId, marker.herdrSession);
        if (open === true || (open === null && !isExpired)) {
          skipped.push({ path: cand, reason: 'pane-still-open' });
          continue;
        }
      } else if (!(processDead || isExpired)) {
        skipped.push({ path: cand, reason: 'process-alive-and-not-expired' });
        continue;
      }

      {
        const res = cleanupConfinementResource(cand, marker.dispatchId);
        if (res.cleaned) {
          reaped.push({ path: cand, dispatchId: marker.dispatchId, reason: marker.paneId ? 'pane-closed' : processDead ? 'process-dead' : 'expired' });
          // If dispatchDir is now empty, clean it up too
          try {
            if (fs.existsSync(dispatchDir) && fs.readdirSync(dispatchDir).length === 0) {
              fs.rmSync(dispatchDir, { recursive: true, force: true });
            }
          } catch {
            // ignore
          }
        } else {
          skipped.push({ path: cand, reason: res.reason });
        }
      }
    }
  }

  return { reaped, skipped };
}
