// show-run.mjs -- read one dispatch Run off disk and say what it looks like.
//
// Read-only by construction, not by promise. This module imports nothing that
// can reach a terminal: no herdr client, no adapter, no session engine. The
// strongest guarantee an observe door can offer is that it has no way to
// contact anything, and that is a property of the import list rather than of
// anyone's discipline.
//
// The one process it starts is the run supervisor's adopt probe, which only
// reads (it writes nothing and takes no lock).
//
// Observing and contacting are separate capabilities, and V0 hands out only
// the first. Many people may watch a run; exactly one process drives it.

import fs from 'node:fs';
import path from 'node:path';
import { fgosDirFromRoot } from '../../runner/paths.mjs';
import { readVisibility } from '../../runner/dispatch/visibility-session.mjs';
import { interpretRunResult } from '../../runner/dispatch/run-result.mjs';
import { findRunDir, listAssignmentRuns, RunLookupError } from '../../runner/dispatch/assignment-layout.mjs';
import { adoptRun } from '../../run-supervisor/client.mjs';
import { deriveUnitState, unitDirsOfAssignment } from '../../runner/execution/unit-state.mjs';

export class DispatchObserveError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'DispatchObserveError';
    this.code = code;
    this.category = (code === 'run-not-found' || code === 'missing-run' || code === 'run-ambiguous') ? 'precondition' : 'validation';
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
 * Controller-owned state directory listing (grants, replacement-authority, etc.).
 * Unlike worker-writable outbox, controller/ contains authoritative state written
 * exclusively by a supervisor/controller.
 */
export function listController(runDir) {
  const controller = path.join(runDir, 'controller');
  let entries = [];
  try {
    entries = fs.readdirSync(controller, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isFile())
    .map((e) => {
      const full = path.join(controller, e.name);
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
  const resultFile = path.join(dir, 'result.json');
  let settled = false;
  let resultCorrupt = false;
  let result = null;
  if (fs.existsSync(resultFile)) {
    try {
      const st = fs.lstatSync(resultFile);
      if (!st.isFile()) {
        resultCorrupt = true;
      } else {
        const interpreted = interpretRunResult(resultFile, { expectedRunId: run?.runId });
        if (!interpreted || interpreted.corrupt || interpreted.contractCorrupt || interpreted.resultCorrupt || interpreted.classification?.provenance === 'contract-corrupt') {
          resultCorrupt = true;
        } else {
          settled = true;
          result = interpreted;
        }
      }
    } catch {
      resultCorrupt = true;
    }
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
    settled,
    ...(resultCorrupt ? { resultCorrupt: true } : {}),
    ...(result ? { result } : {}),
    visibility,
    ...(visibilityError ? { visibilityError } : {}),
    outbox: listOutbox(dir),
    controller: listController(dir),
  };
}

/** The run id of the attempt a later `--resume` launched in place of this one (its run.json names this
 * run in `supersedesRunId`), or null. */
function supersededBy(fgosDir, runId) {
  if (!fgosDir || typeof runId !== 'string') return null;
  for (const { runDir } of listAssignmentRuns(fgosDir)) {
    const other = readJsonOrNull(path.join(runDir, 'run.json'));
    if (other?.supersedesRunId === runId) return other.runId ?? null;
  }
  return null;
}

const probeAttempt = (attemptDir) => adoptRun(attemptDir, { probeOnly: true });

/**
 * What the run supervisor and the unit say about one attempt directory, read-only (the adopt probe writes
 * nothing and takes no lock). `attemptState` is the probe's word, or the receipt outcome of a closed
 * attempt that never ran the agent, or `abandoned-legacy` once the doctor settled an attempt from before
 * the supervisor; `unprobed` (with the reason) when the host cannot judge. `unitState` is set when a
 * unit run owns this attempt; an `awaiting-resume` unit names the command that goes on.
 */
export function readAttemptView(runDir, { fgosDir, probe = probeAttempt } = {}) {
  const run = readJsonOrNull(path.join(runDir, 'run.json'));
  let attemptState;
  let attemptReason;
  if (run?.settlement === 'abandoned-legacy') {
    attemptState = 'abandoned-legacy';
  } else {
    try {
      const verdict = probe(runDir);
      attemptState = verdict.state;
      if (verdict.reason) attemptReason = verdict.reason;
      if (attemptState === 'closed') {
        const outcome = String(readJsonOrNull(path.join(runDir, 'receipt.json'))?.outcome ?? '');
        if (outcome.startsWith('abandoned')) attemptState = outcome;
      }
    } catch (err) {
      attemptState = 'unprobed';
      attemptReason = err.message;
    }
  }
  // A closed attempt a resume replaced is neither live nor a failure of its own: it reads as superseded.
  const replacement = attemptState === 'closed' || String(attemptState).startsWith('abandoned') ? supersededBy(fgosDir, run?.runId) : null;
  const view = replacement
    ? { attemptState: 'superseded', supersededBy: replacement, attemptOutcome: attemptState }
    : { attemptState, ...(attemptReason ? { attemptReason } : {}) };
  const unitDir = typeof run?.assignmentId === 'string' && fgosDir
    ? unitDirsOfAssignment(path.join(fgosDir, 'assignments'), run.assignmentId)[0]
    : undefined;
  if (unitDir === undefined) return view;
  let unit;
  try { unit = deriveUnitState(unitDir, { probe }); } catch { return view; }
  return { ...view, unitRunId: unit.unitRunId, unitState: unit.unitState, ...(unit.resumeCommand ? { resumeCommand: unit.resumeCommand } : {}) };
}

export function showRunUseCase(ctx, { runId } = {}) {
  if (typeof runId !== 'string' || !runId.trim()) {
    throw new DispatchObserveError('invalid-run-id', 'dispatch show-run requires a runId');
  }
  const repoRoot = ctx?.repoRoot ?? ctx?.cwd ?? process.cwd();
  let runDir;
  try { runDir = findRunDir(fgosDirFromRoot(repoRoot), runId); }
  catch (err) {
    if (err instanceof RunLookupError) {
      throw new DispatchObserveError(err.code, err.message, { runId, repoRoot, locations: err.locations });
    }
    throw err;
  }
  if (!runDir) {
    throw new DispatchObserveError('run-not-found', `no run "${runId}" under ${repoRoot}`, { runId, repoRoot });
  }
  return { runId, ...readRunSnapshot(runDir), ...readAttemptView(runDir, { fgosDir: fgosDirFromRoot(repoRoot) }) };
}
