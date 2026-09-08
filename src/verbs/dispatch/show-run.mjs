// show-run.mjs -- read one dispatch Run off disk and say what it looks like.
//
// Read-only by construction, not by promise. This module imports nothing that
// can reach a terminal: no herdr client, no adapter, no session engine. The
// strongest guarantee an observe door can offer is that it has no way to
// contact anything, and that is a property of the import list rather than of
// anyone's discipline.
//
// Observing and contacting are separate capabilities, and V0 hands out only
// the first. Many people may watch a run; exactly one process drives it.

import fs from 'node:fs';
import path from 'node:path';
import { fgosDirFromRoot } from '../../runner/paths.mjs';
import { readVisibility } from '../../runner/dispatch/visibility-session.mjs';

export class DispatchObserveError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'DispatchObserveError';
    this.code = code;
    Object.assign(this, details);
  }
}

function readJsonOrNull(file) {
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function listDirs(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}

/**
 * Find the run directory holding `runId`.
 *
 * Runs live at `.fgos/assignments/<assignmentId>/runs/<NN>/`, and a run's id
 * is a field inside its own `run.json` rather than part of the path, so this
 * walks the two levels and reads. Bounded by how many assignments exist, and
 * a directory that cannot be read is skipped rather than fatal.
 */
export function findRunDir(repoRoot, runId) {
  const fgosDir = fgosDirFromRoot(repoRoot);

  // Both Run layouts, because both are real. An Assignment's runs are nested
  // one level deeper than a runner dispatch's, which writes into
  // `dispatch-runs/<workId>/<stamp>` when it has no Assignment of its own.
  // Knowing only the first meant a real dispatch could be running, its files
  // exactly where they belong, and this door would answer "no such run".
  const searchRoots = [
    { base: path.join(fgosDir, 'assignments'), runsSubdir: 'runs' },
    { base: path.join(fgosDir, 'dispatch-runs'), runsSubdir: null },
  ];

  for (const { base, runsSubdir } of searchRoots) {
    for (const group of listDirs(base)) {
      const runsDir = runsSubdir ? path.join(base, group, runsSubdir) : path.join(base, group);
      for (const attempt of listDirs(runsDir)) {
        const runDir = path.join(runsDir, attempt);
        const meta = readJsonOrNull(path.join(runDir, 'run.json'));
        if (meta && meta.runId === runId) return runDir;
      }
    }
  }
  return null;
}

/** What the worker has put in its outbox so far. Names, sizes and times only
 * -- the contents are the worker's account of its own work, and reading them
 * is the collector's job, not an observer's. */
export function listOutbox(runDir) {
  const outbox = path.join(runDir, 'outbox');
  let entries = [];
  try {
    entries = fs.readdirSync(outbox, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isFile())
    .map((e) => {
      const full = path.join(outbox, e.name);
      let stat = null;
      try { stat = fs.statSync(full); } catch { stat = null; }
      return {
        name: e.name,
        bytes: stat ? stat.size : null,
        modifiedAt: stat ? new Date(stat.mtimeMs).toISOString() : null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * One reading of a run: whether it is still going, where its worker is, and
 * what it has written.
 *
 * `visibility` may legitimately be null -- a `cli-spawn` dispatch never had a
 * pane to record. A corrupt visibility file degrades to a stated error rather
 * than taking the whole reading down, because the point of an observe door is
 * to keep answering while things are going wrong.
 */
export function readRunSnapshot(runDir) {
  const dir = path.resolve(runDir);
  const run = readJsonOrNull(path.join(dir, 'run.json'));
  if (!run) {
    throw new DispatchObserveError('missing-run', `no run.json in ${dir}`, { runDir: dir });
  }
  let visibility = null;
  let visibilityError = null;
  try {
    visibility = readVisibility(dir);
  } catch (err) {
    visibilityError = err.message;
  }
  return {
    runDir: dir,
    run,
    visibility,
    ...(visibilityError ? { visibilityError } : {}),
    outbox: listOutbox(dir),
  };
}

export function showRunUseCase(ctx, { runId } = {}) {
  if (typeof runId !== 'string' || !runId.trim()) {
    throw new DispatchObserveError('invalid-run-id', 'dispatch show-run requires a runId');
  }
  const repoRoot = ctx?.repoRoot ?? ctx?.cwd ?? process.cwd();
  const runDir = findRunDir(repoRoot, runId);
  if (!runDir) {
    throw new DispatchObserveError('run-not-found', `no run "${runId}" under ${repoRoot}`, { runId, repoRoot });
  }
  return { runId, ...readRunSnapshot(runDir) };
}
