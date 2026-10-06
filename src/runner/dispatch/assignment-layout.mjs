// Read-only assignment layout. Stop at runs: worker-owned descendants are not repositories.
import fs from 'node:fs';
import path from 'node:path';

export const ASSIGNMENT_LAYOUT_MAX_DEPTH = 16;

function entries(dir) {
  try { return fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0); }
  catch { return []; }
}
function regularFile(file) {
  try { return fs.lstatSync(file).isFile(); } catch { return false; }
}
function readJson(file) {
  if (!regularFile(file)) return null;
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}
// Resolve the existing ancestor as well as the missing suffix. A missing claim
// file must not make a symlinked assignment ancestor pass a spelling-only guard.
function realPath(file) {
  let cursor = path.resolve(file);
  const suffix = [];
  for (;;) {
    try { return path.join(fs.realpathSync(cursor), ...suffix); }
    catch (err) {
      if (err.code !== 'ENOENT') return null;
      try { if (fs.lstatSync(cursor).isSymbolicLink()) return null; } catch {}
      const parent = path.dirname(cursor);
      if (parent === cursor) return null;
      suffix.unshift(path.basename(cursor));
      cursor = parent;
    }
  }
}
export function isWithinDir(parentDir, candidatePath) {
  const parent = realPath(parentDir), candidate = realPath(candidatePath);
  return parent !== null && candidate !== null && (candidate === parent || candidate.startsWith(parent + path.sep));
}

/** Guard caller-supplied nested ids before joining any read or mutation path. */
export function assignmentDir(fgosDir, assignmentId) {
  if (typeof assignmentId !== 'string' || !assignmentId || path.isAbsolute(assignmentId)) return null;
  const parts = assignmentId.split('/');
  if (parts.some((part) => !part || part === '.' || part === '..')) return null;
  const base = path.resolve(fgosDir, 'assignments'), dir = path.resolve(base, assignmentId);
  return isWithinDir(base, dir) ? dir : null;
}

/** Directory-only accounting shared by the lister and doctor coverage check.
 * Barriers count one skipped candidate; their hidden descendants are never read.
 * Assignment metadata and run/result validity are deliberately not admission rules. */
export function scanAssignmentLayout(fgosDir) {
  const base = path.resolve(fgosDir, 'assignments');
  const runs = [], skipped = {};
  let runDirsSeen = 0;
  const barrier = (reason) => { runDirsSeen++; skipped[reason] = (skipped[reason] ?? 0) + 1; };
  function walk(dir, depth) {
    for (const entry of entries(dir)) {
      const child = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) { barrier('symlink'); continue; }
      if (!entry.isDirectory()) continue;
      if (entry.name === 'runs') {
        const assignmentId = path.relative(base, dir).split(path.sep).join('/');
        const hasAssignmentJson = regularFile(path.join(dir, 'assignment.json'));
        for (const attempt of entries(child)) {
          if (attempt.isSymbolicLink()) { barrier('symlink'); continue; }
          if (!attempt.isDirectory()) continue;
          runDirsSeen++;
          runs.push({ assignmentId, attempt: attempt.name, runDir: path.join(child, attempt.name), hasAssignmentJson });
        }
      } else if (depth >= ASSIGNMENT_LAYOUT_MAX_DEPTH) barrier('depth');
      else walk(child, depth + 1);
    }
  }
  try {
    const st = fs.lstatSync(base);
    if (st.isSymbolicLink()) barrier('symlink');
    else if (st.isDirectory()) walk(base, 0);
  } catch {}
  return { runs, skipped, runDirsSeen };
}

export function* listAssignmentRuns(fgosDir) {
  yield* scanAssignmentLayout(fgosDir).runs;
}

/** Ids are fields, never paths. Prefer run metadata, including unsettled runs. */
export function findRunDir(fgosDir, runId) {
  if (typeof runId !== 'string' || !runId) return null;
  for (const { runDir } of listAssignmentRuns(fgosDir)) {
    const run = readJson(path.join(runDir, 'run.json'));
    if (run?.runId === runId) return runDir;
    if (!run?.runId && readJson(path.join(runDir, 'result.json'))?.runId === runId) return runDir;
  }
  return null;
}
