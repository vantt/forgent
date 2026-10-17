// Narrow, local guard/projection reconciliation.  This module deliberately
// contains no adapter, recovery, process-control, or execution imports.
// runtime-inspection.mjs is the one exception: it is itself a read-only
// Dispatch inspection layer (same layer as this module, not adapter/
// recovery/process-control/execution), and reusing its already-proven
// --cwd Run/admission view here avoids re-deriving that same read a second
// time (RUL11: consolidate, do not duplicate a scattered near-copy).
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { inspectDispatchRuntime, clearAllRunsCache, withRunsCache } from './runtime-inspection.mjs';
// visibility-session.mjs's own import graph is fs/path + worker-artifacts.mjs
// (also fs/path only) -- no adapter/process-control, so importing its
// RUN_STATUSES vocabulary here does not widen this module's excluded-import
// boundary (see the file-top comment and the static import-graph test in
// test/runner/dispatch-reconciliation-import-graph.test.mjs).
import { RUN_STATUSES } from './visibility-session.mjs';
import { uniqueTmpTag } from '../../util/unique-tmp-tag.mjs';
// The lock door: reconcile's own apply mutex and the per-cwd dispatch lock it
// reports on are kernel locks (the import-graph test pins the door's files).
import { acquireSync, createLockScope } from '../../holder-lock/index.mjs';
import { dispatchCwdHolder } from './cwd-lock.mjs';

const stable = (v) => v && typeof v === 'object' ? (Array.isArray(v) ? `[${v.map(stable).join(',')}]` : `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`) : JSON.stringify(v);
const digest = (v) => `sha256:${createHash('sha256').update(stable(v)).digest('hex')}`;
const json = (file) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return undefined; } };
// The Run's REAL control epoch, off run-lock.mjs's own generation ledger
// (`control/generations/`) -- never a `controlEpoch` field copied onto some
// OTHER JSON blob (run.json, a lock, a claim), which nothing fences against
// a live controller's own acquireRunControl/releaseRunControl calls (see
// src/verbs/dispatch/recover.mjs's own `readRealControlEpoch`, whose
// algorithm this is a byte-identical, deliberately NOT imported, copy of --
// recover.mjs and run-lock.mjs are both banned from this module's import
// graph, see the file-top comment and
// test/runner/dispatch-reconciliation-import-graph.test.mjs's exact-set
// assertion). `0` (no generation ever published) matches recover.mjs's own
// "epoch 0" convention.
function readRealControlEpoch(runDir) {
  const generationsDir = path.join(runDir, 'control', 'generations');
  let names;
  try {
    names = fs.readdirSync(generationsDir);
  } catch (err) {
    if (err.code === 'ENOENT') return 0;
    throw err;
  }
  let maxEpoch = 0;
  for (const name of names) {
    const match = /^(\d{10})\.json$/.exec(name);
    if (!match) continue;
    if (json(path.join(generationsDir, name)) === undefined) continue; // unparseable -- not a real published generation
    maxEpoch = Math.max(maxEpoch, Number(match[1]));
  }
  return maxEpoch;
}
const expires = (now, ttlMs) => new Date(Date.parse(now) + ttlMs).toISOString();
// Reuse visibility-session.mjs's own RUN_STATUSES vocabulary rather than
// inventing a second one -- this assertion is a load-time tripwire, not a
// per-call check, against that vocabulary ever dropping 'settled'.
const SETTLED_STATUS = 'settled';
if (!RUN_STATUSES.includes(SETTLED_STATUS)) throw new Error('reconciliation-planner: repair-projection target status must be a member of visibility-session.mjs RUN_STATUSES');
const actionKey = (snapshot, action, expiresAt) => `reconcile_${createHash('sha256').update(stable({ snapshot, action, expiresAt })).digest('hex')}`;

function actionLog(root) { return path.join(root, '.fgos', 'dispatch', 'reconciliation-actions.jsonl'); }
function resultFile(runDir) { return path.join(runDir, 'result.json'); }
// Plans arrive over a public CLI boundary.  A path in one is descriptive only;
// apply derives its actual target from the trusted root and action kind.
function canonicalAction(kind, cwd) {
  if (kind === 'clear-cwd-lock') return { kind, cwd };
  return null;
}
function records(root) { try { return fs.readFileSync(actionLog(root), 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse); } catch { return []; } }
export const RECONCILE_RUN_REQUIRES_ACTION = 'dispatch reconcile plan with --run requires --action (e.g. collect-result or repair-projection)';

export function planReconciliation(root, { action = 'clear-cwd-lock', runId, cwd = process.cwd(), now = new Date().toISOString(), ttlMs = 300000, runsCache = null } = {}) {
  return withRunsCache(runsCache, () => {
    if (runId !== undefined && (!action || action === 'clear-cwd-lock')) {
      return { outcome: 'refused', reason: RECONCILE_RUN_REQUIRES_ACTION };
    }
    if (action === 'collect-result') return planCollectResult(root, { runId, now, ttlMs });
    if (action === 'repair-projection') return planRepairProjection(root, { runId, now, ttlMs });
    if (!canonicalAction(action, cwd)) return { outcome: 'refused', reason: `unsupported reconciliation action: ${action}` };
    // The per-cwd dispatch lock is a kernel lock: a holder that dies has
    // already released it, so there is never a dead holder's lock to clear.
    // The plan only reports whether a live dispatch holds it.
    if (dispatchCwdHolder(path.join(root, '.fgos'), cwd)) return { outcome: 'refused', reason: 'cwd lock is held by a live dispatch' };
    return { outcome: 'blocked', reason: 'no cwd lock is held' };
  });
}

// collect-result links/collects an already-written, already-valid result.json
// through its owning authority (the Assignment that admitted it, or a bare
// ad-hoc dispatch-run with no Assignment at all). It never derives ownership
// or admission facts itself: it reuses inspectDispatchRuntime's --run and
// --assignment views verbatim (the SAME owner/admission-ledger logic
// runtime-inspection.mjs already implements for I04), so this action can
// never disagree with dispatch.runtime.inspect about who owns a Run or which
// Run is current. A CoordinationSession-owned Run is refused, not planned:
// linking its result is that session's own driver-authored write
// (`result-linked`, src/runner/coordination/replay.mjs) -- a different,
// more privileged door this narrow guard/projection repair must never
// substitute for.
function planCollectResult(root, { runId, now, ttlMs }) {
  if (typeof runId !== 'string' || !runId.trim()) return { outcome: 'refused', reason: 'collect-result requires a runId' };
  const view = inspectDispatchRuntime(root, { run: runId });
  if (view.inspectionStatus === 'not-found') return { outcome: 'blocked', reason: 'no matching Run was found for collect-result' };
  if (view.inspectionStatus === 'ambiguous') return { outcome: 'needs-input', reason: 'more than one Run repository owns this run id' };
  const loc = view.subject.locations[0];
  if (!loc) return { outcome: 'blocked', reason: 'no matching Run was found for collect-result' };
  const runResult = view.runResult;
  if (!runResult) return { outcome: 'blocked', reason: 'no result exists yet to collect' };
  if (runResult.corrupt || runResult.contractCorrupt) return { outcome: 'needs-input', reason: 'result is corrupt or fails RunResult validation and cannot be auto-collected' };
  const hint = view.recoveryAuthority;
  if (!hint) return { outcome: 'needs-input', reason: 'owner authority for this Run is incomplete or inconsistent' };
  if (hint.kind === 'coordination-session') return { outcome: 'refused', reason: `owning authority is a CoordinationSession ("${hint.id}"); result linking belongs to its own recovery door (${hint.observeCommand}), not dispatch.runtime.reconcile` };
  const assignmentId = view.links.assignmentIds[0] ?? null;
  if (assignmentId) {
    const assignmentView = inspectDispatchRuntime(root, { assignment: assignmentId });
    const currentRunIds = assignmentView.observations?.[0]?.value?.currentRunIds ?? [];
    if (!currentRunIds.includes(runId)) return { outcome: 'blocked', reason: `a newer current Run supersedes this one for assignment "${assignmentId}" (current: ${currentRunIds.join(', ') || 'none'})` };
  }
  const runDir = loc.path;
  let raw;
  try {
    raw = fs.readFileSync(resultFile(runDir), 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return { outcome: 'blocked', reason: 'no result exists yet to collect' };
    throw err;
  }
  // F2: the REAL control epoch off control/generations/, never run.json's
  // own shadow copy (see readRealControlEpoch's doc comment) -- a live
  // controller can legitimately bump the real epoch without run.json ever
  // being touched, which would let a stale plan's CAS check pass on a
  // field that was never fenced against that controller in the first
  // place.
  const snapshot = { digest: digest({ raw }), runId, ownerAuthority: { kind: hint.kind, id: hint.id }, controlEpoch: readRealControlEpoch(runDir), expiresAt: expires(now, ttlMs) };
  const proposedAction = { kind: 'collect-result', runId, path: path.join(runDir, 'run.json') };
  return { outcome: 'planned', actionKey: actionKey(snapshot, proposedAction, snapshot.expiresAt), snapshot, proposedAction, preconditions: ['result-valid', 'owner-authority-standalone', 'not-superseded'] };
}

// repair-projection additively patches run.json.status to 'settled' when an
// already-validated, immutable terminal RunResult proves the Run finished
// but the real production settlement marker (run.json.status --
// visibility-session.mjs's markRunSettled/RUN_STATUSES, read by
// findRunningRuns, watch.mjs, and classifyRunOutcome) still reads a
// non-terminal value like 'running' -- the crash window this closes is a
// supervisor/writer that wrote result.json but died before calling
// markRunSettled to stamp run.json.status to agree with it. (An earlier
// version of this action targeted a `run.json.phase` field that no
// production writer ever set -- `status` is the one real marker every
// reader above actually consults, so the target field was corrected to
// match.) Like collect-result, it never derives Run/result facts itself: it
// reuses inspectDispatchRuntime's --run view verbatim (the SAME RunResult
// interpretation runtime-inspection.mjs's `one()` already performs, backed
// by run-result.mjs's single interpretRunResult path), so this guard can
// never disagree with dispatch.runtime.inspect -- or with collect-result --
// about whether a Run settled or whether its result is corrupt. There is
// exactly one RunResult-interpretation path in this codebase; re-deriving a
// second one here would let this narrow guard disagree with inspection
// about the same bytes.
//
// D04's "projection source epoch still matches" maps to the Run's REAL
// control epoch, read off control/generations/ via readRealControlEpoch --
// the same real read collect-result's own CAS snapshot uses -- so a
// concurrent writer that legitimately re-drives this Run (bumping the real
// epoch) makes the plan stale instead of letting a repair land on top of a
// newer incarnation's state. Deliberately NOT run.json's own `controlEpoch`
// field: that field is only a shadow copy nothing fences against a live
// controller's own acquireRunControl/releaseRunControl calls (F2; see
// src/verbs/dispatch/recover.mjs's own doc comment for the same
// distinction), so checking it instead could let a plan pass CAS against a
// field that was never actually kept in step with the real generation
// ledger.
//
// Unlike the retired `phase` field, `status` DOES have a real writer (every
// materialized run.json starts life with a status, per visibility-session.mjs's
// own doc comment), so an absent status is itself part of the defect this
// module exists to close, not a legitimately-already-correct state -- it is
// treated as stale (repairable) exactly like 'running'/'died'/'unknown'.
// Only `status === 'settled'` already matches what a terminal RunResult
// proves, so only that value is reported `blocked` ("nothing to repair"),
// matching every other "nothing to act on" case in this module (clear-cwd-
// lock's "no cwd lock exists", collect-result's "no result exists yet")
// rather than a silent no-op `applied` that would falsely claim a mutation
// happened.
function planRepairProjection(root, { runId, now, ttlMs }) {
  if (typeof runId !== 'string' || !runId.trim()) return { outcome: 'refused', reason: 'repair-projection requires a runId' };
  const view = inspectDispatchRuntime(root, { run: runId });
  if (view.inspectionStatus === 'not-found') return { outcome: 'blocked', reason: 'no matching Run was found for repair-projection' };
  if (view.inspectionStatus === 'ambiguous') return { outcome: 'needs-input', reason: 'more than one Run repository owns this run id' };
  const loc = view.subject.locations[0];
  if (!loc) return { outcome: 'blocked', reason: 'no matching Run was found for repair-projection' };
  const runResult = view.runResult;
  if (!runResult) return { outcome: 'blocked', reason: 'no terminal result exists yet to prove settlement' };
  if (runResult.corrupt || runResult.contractCorrupt) return { outcome: 'needs-input', reason: 'result is corrupt or fails RunResult validation and cannot prove settlement' };
  const runDir = loc.path;
  let raw;
  try {
    raw = fs.readFileSync(resultFile(runDir), 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return { outcome: 'blocked', reason: 'no terminal result exists yet to prove settlement' };
    throw err;
  }
  const runMeta = json(path.join(runDir, 'run.json')) ?? {};
  const currentStatus = runMeta.status ?? null;
  if (currentStatus === SETTLED_STATUS) return { outcome: 'blocked', reason: 'run.json.status already reflects settlement; nothing to repair' };
  const snapshot = { digest: digest({ raw }), runId, currentStatus, controlEpoch: readRealControlEpoch(runDir), expiresAt: expires(now, ttlMs) };
  const proposedAction = { kind: 'repair-projection', runId, path: path.join(runDir, 'run.json') };
  return { outcome: 'planned', actionKey: actionKey(snapshot, proposedAction, snapshot.expiresAt), snapshot, proposedAction, preconditions: ['terminal-result-valid', 'status-stale', 'projection-epoch-matches'] };
}

// One reconcile apply at a time per repo: a kernel mutex at
// `<fgosDir>/locks/reconcile.lock`, one try. A crashed apply released it when
// it died, so nothing here ever judges a holder alive or dead.
function withLocalLock(root, fn) {
  const res = acquireSync(createLockScope('reconcile'), 'reconcile', { fgosDir: path.join(root, '.fgos') });
  if (res.result !== 'acquired') return { outcome: 'blocked', reason: 'another reconcile apply is in progress' };
  try {
    fs.mkdirSync(path.dirname(actionLog(root)), { recursive: true });
    return fn();
  } finally {
    res.handle.release();
  }
}

// collect-result's own target (a specific run.json, keyed by runId) cannot be
// re-derived from the action kind alone -- it needs the runId too. Kept as its
// own apply path rather than folding into canonicalAction()'s (kind, cwd) shape.
function applyCollectResult(root, plan, { now }) {
  const runId = plan?.proposedAction?.runId;
  if (!plan?.actionKey || !plan?.snapshot || typeof runId !== 'string' || !runId.trim()) return { outcome: 'refused', reason: 'apply requires a reconcile plan for a supported action' };
  return withLocalLock(root, () => {
    const prior = records(root).find((r) => r.actionKey === plan.actionKey);
    if (prior) return { outcome: 'already-applied', priorOutcome: prior.outcome, actionKey: plan.actionKey };
    if (Date.parse(now) > Date.parse(plan.snapshot.expiresAt)) return { outcome: 'plan-stale', reason: 'reconcile plan expired' };
    // Full re-derivation from root+runId alone -- the caller-supplied
    // proposedAction.path is never trusted as the mutation target until it is
    // proven identical to what a fresh, from-scratch plan computes right now.
    const fresh = planCollectResult(root, { runId, now, ttlMs: Math.max(0, Date.parse(plan.snapshot.expiresAt) - Date.parse(now)) });
    if (fresh.outcome !== 'planned' || stable(fresh.proposedAction) !== stable(plan.proposedAction) || stable(fresh.snapshot) !== stable(plan.snapshot)) {
      return { outcome: fresh.outcome === 'blocked' ? 'blocked' : 'plan-stale', reason: fresh.reason ?? 'run facts changed since planning' };
    }
    const expectedActionKey = actionKey(fresh.snapshot, fresh.proposedAction, fresh.snapshot.expiresAt);
    if (plan.actionKey !== expectedActionKey) return { outcome: 'plan-stale', reason: 'reconcile action key does not bind the canonical snapshot and target' };
    const runDir = path.dirname(plan.proposedAction.path);
    // Re-read before the write: collect-result's goal state (a persisted
    // marker) is never satisfied by an absent file, so ENOENT here is always
    // plan-stale (facts changed), never "goal already achieved".
    let raw;
    try {
      raw = fs.readFileSync(resultFile(runDir), 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT') return { outcome: 'plan-stale', reason: 'the result was removed since planning' };
      throw err;
    }
    if (digest({ raw }) !== plan.snapshot.digest) return { outcome: 'plan-stale', reason: 'the result changed since planning' };
    let runMeta;
    try {
      runMeta = JSON.parse(fs.readFileSync(plan.proposedAction.path, 'utf8'));
    } catch (err) {
      if (err.code === 'ENOENT') return { outcome: 'plan-stale', reason: 'the run record was removed since planning' };
      throw err;
    }
    const tmp = `${plan.proposedAction.path}.tmp-${uniqueTmpTag()}`;
    fs.writeFileSync(tmp, `${JSON.stringify({ ...runMeta, resultCollectedAt: now }, null, 2)}\n`);
    fs.renameSync(tmp, plan.proposedAction.path);
    fs.appendFileSync(actionLog(root), `${JSON.stringify({ actionKey: plan.actionKey, outcome: 'applied', at: now })}\n`);
    clearAllRunsCache(root);
    return { outcome: 'applied', actionKey: plan.actionKey };
  });
}

// repair-projection additively patches run.json.status the same way visibility-session.mjs's
// own markRunSettled does (status + settledAt), the same shape as
// applyCollectResult -- kept as its own function for the same reason
// collect-result is: its target depends on a caller-supplied runId that
// canonicalAction()'s (kind, cwd) shape cannot carry.
//
// This deliberately does NOT call markRunSettled itself, for two reasons:
//   1. markRunSettled stamps `settledAt` from its own `new Date()`, not from
//      the `now` this reconcile apply path threads through every other CAS
//      check and every other companion-timestamp write (collect-result's
//      own `resultCollectedAt: now`) -- calling it would make this the one
//      apply path with a non-deterministic, untestable timestamp.
//   2. markRunSettled does its own unconditional read-then-write with no
//      CAS re-verification; folding it in here would bypass the
//      digest/controlEpoch re-check this function already performs
//      immediately before the write (the same tmp+rename write already used
//      by every other action in this file).
// The field shape it writes (`status`, `settledAt`) is copied verbatim from
// markRunSettled so the two paths can never disagree about what "settled"
// looks like on disk.
function applyRepairProjection(root, plan, { now }) {
  const runId = plan?.proposedAction?.runId;
  if (!plan?.actionKey || !plan?.snapshot || typeof runId !== 'string' || !runId.trim()) return { outcome: 'refused', reason: 'apply requires a reconcile plan for a supported action' };
  return withLocalLock(root, () => {
    const prior = records(root).find((r) => r.actionKey === plan.actionKey);
    if (prior) return { outcome: 'already-applied', priorOutcome: prior.outcome, actionKey: plan.actionKey };
    if (Date.parse(now) > Date.parse(plan.snapshot.expiresAt)) return { outcome: 'plan-stale', reason: 'reconcile plan expired' };
    // Full re-derivation from root+runId alone -- the caller-supplied
    // proposedAction.path is never trusted as the mutation target until it is
    // proven identical to what a fresh, from-scratch plan computes right now.
    const fresh = planRepairProjection(root, { runId, now, ttlMs: Math.max(0, Date.parse(plan.snapshot.expiresAt) - Date.parse(now)) });
    if (fresh.outcome !== 'planned' || stable(fresh.proposedAction) !== stable(plan.proposedAction) || stable(fresh.snapshot) !== stable(plan.snapshot)) {
      return { outcome: fresh.outcome === 'blocked' ? 'blocked' : 'plan-stale', reason: fresh.reason ?? 'projection facts changed since planning' };
    }
    const expectedActionKey = actionKey(fresh.snapshot, fresh.proposedAction, fresh.snapshot.expiresAt);
    if (plan.actionKey !== expectedActionKey) return { outcome: 'plan-stale', reason: 'reconcile action key does not bind the canonical snapshot and target' };
    const runDir = path.dirname(plan.proposedAction.path);
    // Writer parity with applyCollectResult's own pre-mutation re-read: the
    // goal state (an explicit 'settled' status) is never satisfied by an
    // absent result, so ENOENT here is always plan-stale, never "goal
    // already achieved".
    let raw;
    try {
      raw = fs.readFileSync(resultFile(runDir), 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT') return { outcome: 'plan-stale', reason: 'the result was removed since planning' };
      throw err;
    }
    if (digest({ raw }) !== plan.snapshot.digest) return { outcome: 'plan-stale', reason: 'the result changed since planning' };
    let runMeta;
    try {
      runMeta = JSON.parse(fs.readFileSync(plan.proposedAction.path, 'utf8'));
    } catch (err) {
      if (err.code === 'ENOENT') return { outcome: 'plan-stale', reason: 'the run record was removed since planning' };
      throw err;
    }
    const tmp = `${plan.proposedAction.path}.tmp-${uniqueTmpTag()}`;
    fs.writeFileSync(tmp, `${JSON.stringify({ ...runMeta, status: SETTLED_STATUS, settledAt: now }, null, 2)}\n`);
    fs.renameSync(tmp, plan.proposedAction.path);
    fs.appendFileSync(actionLog(root), `${JSON.stringify({ actionKey: plan.actionKey, outcome: 'applied', at: now })}\n`);
    clearAllRunsCache(root);
    return { outcome: 'applied', actionKey: plan.actionKey };
  });
}

export function applyReconciliation(root, plan, { now = new Date().toISOString(), runsCache = null } = {}) {
  return withRunsCache(runsCache, () => {
    if (plan?.proposedAction?.kind === 'collect-result') return applyCollectResult(root, plan, { now });
    if (plan?.proposedAction?.kind === 'repair-projection') return applyRepairProjection(root, plan, { now });
    const canonical = canonicalAction(plan?.proposedAction?.kind, plan?.proposedAction?.cwd);
    if (!plan?.actionKey || !plan?.snapshot || !canonical) return { outcome: 'refused', reason: 'apply requires a reconcile plan for a supported action' };
    if (stable(plan.proposedAction) !== stable(canonical)) return { outcome: 'plan-stale', reason: 'reconcile action target is not the canonical guard target' };
    // clear-cwd-lock never plans a mutation (a kernel lock has no dead
    // holder's file to clear), so applying one only reports today's facts.
    const fresh = planReconciliation(root, { action: canonical.kind, cwd: canonical.cwd, now });
    return { outcome: fresh.outcome === 'blocked' ? 'blocked' : 'plan-stale', reason: fresh.reason };
  });
}
