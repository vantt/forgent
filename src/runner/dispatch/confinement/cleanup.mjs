// cleanup.mjs — cleanup and reaper for local temp/private-home resources (Phase 03 R5, spec §8.6).
//
// Ensures:
//   - Ownership markers are written before any allocation side effect is exposed.
//   - A cleanup or reaper never removes a directory it did not create.
//   - Reaper is idempotent: running it multiple times never errors or double-acts.

import fs from 'node:fs';
import path from 'node:path';

export const OWNERSHIP_MARKER_FILE = '.fgos-confinement-owner.json';
export const OWNERSHIP_CONTRACT = 'confinement-resource-ownership.v1';
export const OWNERSHIP_CREATOR = 'fgos-confinement';

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
    fs.rmSync(dirPath, { recursive: true, force: true });
    return { cleaned: true, path: dirPath, dispatchId: marker.dispatchId };
  } catch (err) {
    return { cleaned: false, reason: 'removal-failed', error: err.message };
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

      if (processDead || isExpired) {
        const res = cleanupConfinementResource(cand, marker.dispatchId);
        if (res.cleaned) {
          reaped.push({ path: cand, dispatchId: marker.dispatchId, reason: processDead ? 'process-dead' : 'expired' });
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
      } else {
        skipped.push({ path: cand, reason: 'process-alive-and-not-expired' });
      }
    }
  }

  return { reaped, skipped };
}
