// verbs/coordination/clean.mjs — safe readiness assessment and ephemeral cleanup for coordination sessions (Unit 2D).
import fs from 'node:fs';
import path from 'node:path';
import { StoreError } from '../../state/store.mjs';
import { CoordinationError } from '../../runner/coordination/schema.mjs';
import { readManifest, resolveSessionPaths } from '../../runner/coordination/store.mjs';

/**
 * Use case: Safe cleanup / readiness assessment for coordination sessions.
 * Never mutates or deletes authoritative event logs or active sessions without explicit force.
 *
 * @param {object} ctx `{ cwd, repoRoot }`
 * @param {object} options `{ id?, dryRun?, force? }`
 * @returns {object} Clean operation result
 */
export function cleanCoordinationUseCase(ctx, options = {}) {
  const repoRoot = ctx.repoRoot ?? process.cwd();
  const sessionsBase = path.join(repoRoot, '.fgos', 'coordination', 'sessions');
  const dryRun = Boolean(options.dryRun ?? options['dry-run']);
  const force = Boolean(options.force);
  const id = options.id ?? options.coordinationId;

  if (id) {
    let manifest;
    try {
      manifest = readManifest(id, { cwd: ctx.cwd, repoRoot });
    } catch (err) {
      if (err instanceof CoordinationError && err.category === 'not-found') {
        throw new StoreError('validation', `coordination clean: session "${id}" not found.`);
      }
      throw err;
    }

    const { sessionDir } = resolveSessionPaths(id, { cwd: ctx.cwd, repoRoot });
    const isTerminal = manifest.status === 'completed' || manifest.status === 'partial' || manifest.status === 'cancelled';
    const removed = [];

    const lockFiles = ['.events.lock', '.recovery.lock', 'events.lock'];
    for (const lockFile of lockFiles) {
      const lockPath = path.join(sessionDir, lockFile);
      if (fs.existsSync(lockPath)) {
        if (!dryRun && (isTerminal || force)) {
          try {
            fs.unlinkSync(lockPath);
            removed.push(lockFile);
          } catch {}
        } else {
          removed.push(`${lockFile} (pending)`);
        }
      }
    }

    return {
      ok: true,
      coordinationId: id,
      status: manifest.status,
      cleaned: isTerminal || force,
      dryRun,
      removed,
      message: isTerminal || force
        ? `coordination session "${id}" cleanup complete.`
        : `coordination session "${id}" is active; safe no-op. Pass --force to clean active session artifacts.`,
    };
  }

  if (!fs.existsSync(sessionsBase)) {
    return {
      ok: true,
      cleaned: true,
      scannedSessions: 0,
      removed: [],
      message: 'no coordination sessions found.',
    };
  }

  const entries = fs.readdirSync(sessionsBase, { withFileTypes: true });
  const sessionDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  let cleanedCount = 0;
  const removed = [];

  for (const sId of sessionDirs) {
    try {
      const sDir = path.join(sessionsBase, sId);
      const manifestPath = path.join(sDir, 'session.json');
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const isTerminal = manifest.status === 'completed' || manifest.status === 'partial' || manifest.status === 'cancelled';
        if (isTerminal || force) {
          const lockPath = path.join(sDir, 'events.lock');
          if (fs.existsSync(lockPath)) {
            if (!dryRun) {
              fs.unlinkSync(lockPath);
            }
            removed.push(`${sId}/events.lock`);
          }
          cleanedCount++;
        }
      }
    } catch {}
  }

  return {
    ok: true,
    cleaned: true,
    scannedSessions: sessionDirs.length,
    eligibleSessions: cleanedCount,
    dryRun,
    removed,
    message: `scanned ${sessionDirs.length} sessions, cleaned ${cleanedCount} eligible sessions.`,
  };
}
