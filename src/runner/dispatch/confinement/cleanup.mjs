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

export const OWNERSHIP_MARKER_FILE = '.fgos-confinement-owner.json';
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
export function markResourceRetained(dirPath, { paneId } = {}) {
  const marker = readOwnershipMarker(dirPath);
  if (!marker || !paneId) return false;
  fs.writeFileSync(
    path.join(dirPath, OWNERSHIP_MARKER_FILE),
    JSON.stringify({ ...marker, paneId: String(paneId), retainedAt: new Date().toISOString() }, null, 2),
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
    stopProcessesInside(dirPath);
    fs.rmSync(dirPath, { recursive: true, force: true });
    // The per-dispatch parent exists only to hold this resource; leave no
    // empty shell behind (rmdir refuses a non-empty directory, so a sibling
    // resource keeps it alive).
    const parent = path.dirname(dirPath);
    if (path.basename(parent) === marker.dispatchId) {
      try { fs.rmdirSync(parent); } catch { /* still in use */ }
    }
    return { cleaned: true, path: dirPath, dispatchId: marker.dispatchId };
  } catch (err) {
    return { cleaned: false, reason: 'removal-failed', error: err.message };
  }
}

/** Whether a herdr pane is still open: true / false, or null when herdr
 * cannot be asked (not installed, no reachable session). Imported lazily so
 * this module stays free of the transport unless a retained home exists. */
function defaultPaneOpen(paneId) {
  try {
    const out = spawnSync('herdr', ['pane', 'list'], { encoding: 'utf8', timeout: 5000 });
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
        const open = checkPaneOpen(marker.paneId);
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
