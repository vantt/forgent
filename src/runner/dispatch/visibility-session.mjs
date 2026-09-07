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

const isPidAliveDefault = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    // EPERM means the process exists but belongs to someone else.
    return err.code === 'EPERM';
  }
};

/**
 * Take the driving seat for this run.
 *
 * One actor at a time; any number of readers. A claim is refused only while
 * the current holder is BOTH unexpired and still running -- an expired lease
 * or a dead pid is a seat nobody is sitting in, and refusing to take it would
 * strand the run forever.
 */
export function claimActor(runDir, { pid, token, leaseMs = 60000, now = Date.now(), isPidAlive = isPidAliveDefault } = {}) {
  if (!Number.isInteger(pid) || pid <= 0) {
    throw new VisibilityError('invalid-actor', `actor pid must be a positive integer, got: ${JSON.stringify(pid)}`);
  }
  if (typeof token !== 'string' || !token) {
    throw new VisibilityError('invalid-actor', 'actor token must be a non-empty string');
  }
  const current = readVisibility(runDir)?.actor ?? null;
  if (current && current.pid !== pid) {
    const leaseUntil = Date.parse(current.leaseUntil ?? '');
    const unexpired = Number.isFinite(leaseUntil) && leaseUntil > now;
    if (unexpired && isPidAlive(current.pid)) {
      throw new VisibilityError(
        'actor-held',
        `run is already being driven by pid ${current.pid} until ${current.leaseUntil}`,
        { holderPid: current.pid, leaseUntil: current.leaseUntil },
      );
    }
  }
  const actor = { pid, token, leaseUntil: new Date(now + leaseMs).toISOString() };
  writeVisibility(runDir, { actor });
  return actor;
}

/** Release the seat. Identity is pid AND token together, so an actor that
 * already lost its lease to a takeover cannot delete the winner's claim on
 * its way out. */
export function releaseActor(runDir, { pid, token } = {}) {
  const current = readVisibility(runDir)?.actor ?? null;
  if (!current) return false;
  if (current.pid !== pid || current.token !== token) return false;
  writeVisibility(runDir, { actor: null });
  return true;
}

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
    const hit = entries.filter((n) => /^result-\d+\.json$/.test(n)).sort().pop();
    if (hit) return path.join(outbox, hit);
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
export function reconcileRun(runDir, { liveness = 'unknown' } = {}) {
  const dir = path.resolve(runDir);
  const runFile = path.join(dir, RUN_FILE);
  const runMeta = readJson(runFile);
  if (!runMeta) {
    throw new VisibilityError('missing-run', `no ${RUN_FILE} in ${dir}`, { runDir: dir });
  }

  const resultPath = findWorkerResult(dir);
  let outcome;
  if (resultPath) outcome = 'settled';
  else if (liveness === 'absent') outcome = 'died';
  else outcome = 'unknown';

  const changed = runMeta.status !== outcome;
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
