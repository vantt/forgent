// One door onto a run directory's lifecycle truth.
//
// Two files, two jobs, and the line between them is the point:
//
//   visibility.json  where the worker currently IS -- pane, agent session,
//                    who is driving it, when it was last seen. Volatile,
//                    rewritten often, and never evidence of anything.
//   run.json.status  whether the run is still going. Rewritten twice at
//                    most: once when it starts, once when it ends.
//
// Neither says what the work produced. That is `result.json`, written by the
// collector, and nothing here touches it.
//
// The defect this module exists to close: `run.json` used to be written once
// with `status: "running"` and never updated, so a run that finished an hour
// ago and a run whose process was killed mid-flight read exactly the same
// from disk. Reconciliation is the repair, and its most important answer is
// `unknown` -- a crashed dispatch that left no result is not a success and
// not automatically a retry. It is a run nobody can currently account for,
// and saying so is more useful than guessing.
//
// No new entity: a run directory already has the authority to describe its
// own run, so this adds a file to it rather than a record elsewhere.

import fs from 'node:fs';
import path from 'node:path';

export class VisibilityError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'VisibilityError';
    this.code = code;
    Object.assign(this, details);
  }
}

/** Where a worker is in its life. Ordered roughly as they occur, but not a
 * state machine anyone enforces -- a binding that skips ahead is a binding
 * that was written late, not a violation. */
export const VISIBILITY_STATES = Object.freeze([
  'requested',
  'pane-created',
  'agent-ready',
  'briefed',
  'working',
  'detached',
  'settling',
  'reconciled',
  'died',
  'blocked',
]);

/** What `run.json.status` may say. `settled` means the run reached its end
 * and wrote a RunResult -- it says nothing about whether the work succeeded.
 * `died` and `unknown` are reachable only through reconciliation. */
export const RUN_STATUSES = Object.freeze(['running', 'settled', 'died', 'unknown']);

const VISIBILITY_FILE = 'visibility.json';
const RUN_FILE = 'run.json';

function readJson(file) {
  if (!fs.existsSync(file)) return null;
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch (err) {
    throw new VisibilityError('unreadable', `could not read ${file}: ${err.message}`, { file });
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    // Never silently fall back to an empty object: that would let a corrupt
    // file be quietly overwritten with a fresh one, losing whatever binding
    // it still held.
    throw new VisibilityError('corrupt', `${file} is not valid JSON: ${err.message}`, { file });
  }
}

/** Write through a temp file in the same directory, then rename. A reader
 * polling this file must never catch it half-written. */
function writeJsonAtomic(file, value) {
  const tmp = `${file}.tmp-${process.pid}-${Date.now().toString(36)}`;
  try {
    fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`);
    fs.renameSync(tmp, file);
  } catch (err) {
    try { fs.rmSync(tmp, { force: true }); } catch { /* the temp file is not worth a second failure */ }
    throw new VisibilityError('write-failed', `could not write ${file}: ${err.message}`, { file });
  }
  return value;
}

export function visibilityPath(runDir) {
  return path.join(path.resolve(runDir), VISIBILITY_FILE);
}

export function readVisibility(runDir) {
  return readJson(visibilityPath(runDir));
}

/**
 * Merge `patch` into the run's visibility record and stamp `lastSeenAt`.
 *
 * Merge rather than replace: bindings are learned at different moments (the
 * pane id right after the split, the agent session right after the agent
 * starts), and a later write must never erase an earlier one just because it
 * did not repeat it.
 */
export function writeVisibility(runDir, patch = {}, { now = () => new Date().toISOString() } = {}) {
  if (patch.status !== undefined && !VISIBILITY_STATES.includes(patch.status)) {
    throw new VisibilityError(
      'unknown-state',
      `visibility status must be one of ${VISIBILITY_STATES.join('/')}, got: ${JSON.stringify(patch.status)}`,
    );
  }
  const file = visibilityPath(runDir);
  const current = readJson(file) ?? {};
  return writeJsonAtomic(file, { ...current, ...patch, lastSeenAt: now() });
}

/** Losing the gateway, or the person watching, is not the worker dying. This
 * moves the visibility record only -- `run.json` is deliberately untouched. */
export function markDetached(runDir, opts = {}) {
  return writeVisibility(runDir, { status: 'detached' }, opts);
}

// The actor lease that used to sit here is gone, deliberately.
//
// It promised one-driver-at-a-time and could not deliver it: claim was a read
// followed by a write with nothing between them, so two processes racing the
// same run both saw a free seat and both took it. The tests asserted the
// promise rather than the behaviour, which made an unenforceable guarantee
// look enforced -- worse than having no lease at all, because a caller would
// have relied on it.
//
// Nothing called it. V0 grants observation only, and observation needs no
// lease: any number of readers, no coordination. When contact arrives in V1
// there will be something real to serialise, and the lock it needs (an
// atomic create, not a check-then-write) can be built against that real
// requirement instead of guessed at now.

/**
 * Find this run's agent among the ones herdr currently reports.
 *
 * Pane id first, then the agent session value. herdr does not reuse a pane id
 * after the pane closes, so a handle that finds nothing means the pane is
 * gone -- it can never quietly resolve to somebody else's pane.
 */
export function findAgentBinding(agents, visibility) {
  if (!Array.isArray(agents) || !visibility) return null;
  const { paneId, agentSession } = visibility;
  if (paneId) {
    const byPane = agents.find((a) => a && (a.pane_id ?? a.paneId) === paneId);
    if (byPane) return byPane;
  }
  const wanted = agentSession?.value;
  if (wanted) {
    const bySession = agents.find((a) => (a?.agent_session?.value ?? a?.agentSession?.value) === wanted);
    if (bySession) return bySession;
  }
  return null;
}

/** Did the worker leave a result behind? Its own file first -- after a crash
 * the collector never ran, so the collector's `result.json` proves nothing
 * about the worker. */
export function findWorkerResult(runDir) {
  const dir = path.resolve(runDir);
  const outbox = path.join(dir, 'outbox');
  if (fs.existsSync(outbox)) {
    let entries = [];
    try { entries = fs.readdirSync(outbox); } catch { entries = []; }
    // Numeric, not lexicographic: sorted as text "result-9" beats "result-11",
    // which would reconcile a resumed Run on an older round's result. The
    // collector orders the same files the same way; two readers of one
    // directory must not disagree about which round is latest.
    const hit = entries
      .map((name) => ({ name, round: Number((name.match(/^result-(\d+)\.json$/) ?? [])[1]) }))
      .filter((e) => Number.isFinite(e.round))
      .sort((a, b) => a.round - b.round)
      .pop();
    if (hit) return path.join(outbox, hit.name);
  }
  const collected = path.join(dir, 'result.json');
  return fs.existsSync(collected) ? collected : null;
}

/**
 * Decide what became of a run whose dispatch process is no longer around, and
 * write that decision into `run.json`.
 *
 * Three answers, and only three:
 *   settled  the worker's own result file is on disk. It finished.
 *   died     the worker is provably gone and left nothing.
 *   unknown  nobody can tell. NOT a success, and NOT an automatic retry --
 *            a caller that wants to retry must decide that itself, knowing
 *            it is deciding it.
 *
 * A run still marked `running` whose liveness cannot be read stays honest by
 * becoming `unknown`, never by being left as `running` (which would claim it
 * is still working) and never by becoming `died` (which would claim the
 * opposite on the same missing evidence).
 */
/**
 * What became of this run, deciding nothing and writing nothing.
 *
 * Split out from `reconcileRun` so a read-only caller -- `fgos stale`, which
 * documents that it never writes -- can report on orphaned runs without
 * quietly changing them. A reader that cannot probe liveness passes
 * `unknown` and gets `unknown` back: saying so is the honest answer, and it
 * is specifically NOT `died`, which would be an assertion about a process
 * nobody looked at.
 */
export function classifyRunOutcome(runDir, { liveness = 'unknown' } = {}) {
  const dir = path.resolve(runDir);
  const runMeta = readJson(path.join(dir, RUN_FILE));
  if (!runMeta) {
    throw new VisibilityError('missing-run', `no ${RUN_FILE} in ${dir}`, { runDir: dir });
  }
  const resultPath = findWorkerResult(dir);
  let outcome;
  if (resultPath) outcome = 'settled';
  else if (liveness === 'absent') outcome = 'died';
  else outcome = 'unknown';
  return { outcome, resultPath, runMeta, changed: runMeta.status !== outcome };
}

/** Every run under `fgosDir` still claiming to be running. Both layouts are
 * scanned: assignment runs, and the flat dispatch-runs a runner dispatch
 * writes when it has no Assignment of its own. */
export function findRunningRuns(fgosDir) {
  const roots = [path.join(fgosDir, 'assignments'), path.join(fgosDir, 'dispatch-runs')];
  const found = [];
  const listDirs = (d) => {
    try {
      return fs.readdirSync(d, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
    } catch {
      return [];
    }
  };
  for (const root of roots) {
    for (const first of listDirs(root)) {
      // assignments/<id>/runs/<NN>, dispatch-runs/<workId>/<stamp>
      const mid = path.join(root, first, 'runs');
      const bases = fs.existsSync(mid) ? [mid] : [path.join(root, first)];
      for (const base of bases) {
        for (const leaf of listDirs(base)) {
          const dir = path.join(base, leaf);
          const meta = readJson(path.join(dir, RUN_FILE));
          if (meta && meta.status === 'running') found.push({ runDir: dir, runId: meta.runId ?? null, startedAt: meta.startedAt ?? null });
        }
      }
    }
  }
  return found;
}

export function reconcileRun(runDir, { liveness = 'unknown' } = {}) {
  const dir = path.resolve(runDir);
  const runFile = path.join(dir, RUN_FILE);
  const { outcome, resultPath, runMeta, changed } = classifyRunOutcome(dir, { liveness });
  if (changed) {
    writeJsonAtomic(runFile, {
      ...runMeta,
      status: outcome,
      reconciledAt: new Date().toISOString(),
      ...(resultPath ? { workerResultPath: path.relative(dir, resultPath) } : {}),
    });
  }
  try {
    writeVisibility(dir, { status: outcome === 'died' ? 'died' : 'reconciled' });
  } catch {
    // A run directory may legitimately have no visibility record (a
    // cli-spawn dispatch never had a pane). Reconciling run.json is the
    // point; the visibility stamp is a courtesy.
  }
  return { outcome, changed, resultPath };
}

/** Mark a run finished by the normal path: the dispatch returned and its
 * RunResult was written. Says nothing about whether the work succeeded. */
export function markRunSettled(runDir, { status = 'settled' } = {}) {
  if (!RUN_STATUSES.includes(status)) {
    throw new VisibilityError('unknown-state', `run status must be one of ${RUN_STATUSES.join('/')}, got: ${JSON.stringify(status)}`);
  }
  const runFile = path.join(path.resolve(runDir), RUN_FILE);
  const runMeta = readJson(runFile);
  if (!runMeta) return false;
  if (runMeta.status === status) return false;
  writeJsonAtomic(runFile, { ...runMeta, status, settledAt: new Date().toISOString() });
  return true;
}
