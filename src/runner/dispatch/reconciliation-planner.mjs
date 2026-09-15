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
import { inspectDispatchRuntime, findCoordinationSessionOwningAssignment } from './runtime-inspection.mjs';
// visibility-session.mjs's own import graph is fs/path + worker-artifacts.mjs
// (also fs/path only) -- no adapter/process-control, so importing its
// RUN_STATUSES vocabulary here does not widen this module's excluded-import
// boundary (see the file-top comment and the static import-graph test in
// test/runner/dispatch-reconciliation-import-graph.test.mjs).
import { RUN_STATUSES } from './visibility-session.mjs';

const stable = (v) => v && typeof v === 'object' ? (Array.isArray(v) ? `[${v.map(stable).join(',')}]` : `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`) : JSON.stringify(v);
const digest = (v) => `sha256:${createHash('sha256').update(stable(v)).digest('hex')}`;
const json = (file) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return undefined; } };
// Paren-aware /proc/<pid>/stat parser, deliberately kept as its own copy
// rather than importing cli-spawn-supervisor.mjs's getProcessStartTime: that
// module is the cli-spawn ADAPTER (it also owns child_process.spawn, worker
// PGID signalling, receipt publication) and importing any one export from it
// would put the whole adapter/process-control module on this file's import
// graph, which the file-top comment and H4's static import-graph test both
// forbid. The algorithm below is intentionally byte-identical to
// getProcessStartTime's: split on the LAST ")" so a comm field containing
// spaces or parens (e.g. "(some (weird) name)") never desyncs the fixed-index
// fields that follow it, then take field 19 (starttime) of the
// space-separated remainder. A regression test in
// test/runner/dispatch-reconciliation.test.mjs pins the two parsers to
// agreement on a comm-with-space fixture.
function startTime(pid) {
  let stat;
  try {
    stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8');
  } catch (err) {
    // ENOENT (or ESRCH-shaped absence) proves the incarnation is gone -- the
    // caller's holder() below is entitled to read that as dead. Anything
    // else (EACCES, EIO, ...) is a read failure that proves nothing about
    // whether the process exists, so it must propagate as "we could not
    // read this" (return undefined), never be folded into the same `null`
    // "confirmed absent" signal absence-by-ENOENT uses.
    return err && err.code === 'ENOENT' ? null : undefined;
  }
  const lastParen = stat.lastIndexOf(')');
  if (lastParen === -1) return undefined;
  const rest = stat.slice(lastParen + 2).split(' ');
  return rest[19] || null;
}
const expires = (now, ttlMs) => new Date(Date.parse(now) + ttlMs).toISOString();
// Reuse visibility-session.mjs's own RUN_STATUSES vocabulary rather than
// inventing a second one -- this assertion is a load-time tripwire, not a
// per-call check, against that vocabulary ever dropping 'settled'.
const SETTLED_STATUS = 'settled';
if (!RUN_STATUSES.includes(SETTLED_STATUS)) throw new Error('reconciliation-planner: repair-projection target status must be a member of visibility-session.mjs RUN_STATUSES');
const actionKey = (snapshot, action, expiresAt) => `reconcile_${createHash('sha256').update(stable({ snapshot, action, expiresAt })).digest('hex')}`;

function lockFile(root) { return path.join(root, '.fgos', 'dispatch.lock'); }
// Per-Assignment counterpart to lockFile's per-cwd `dispatch.lock`: the same
// holder-identity guard shape (pid/startTime/controlEpoch, see `holder()`
// below), scoped to one Assignment instead of one cwd. A real writer DOES
// exist: coordination/session-engine.mjs's `createAndExecuteSessionTask`
// creates this exact file (0 bytes, `fs.openSync(dispatchClaimPath, 'wx')`,
// src/runner/coordination/session-engine.mjs) as a CoordinationSession's own
// in-process dispatch-exclusivity marker -- never populated with
// pid/startTime/controlEpoch content the way `dispatch.lock` is, and never
// removed on success (see that function's own doc comment). Because it
// carries no holder identity, `holder()` below can only ever read it as
// corrupt/unparseable; the CoordinationSession-ownership check in
// `planClearAssignmentClaim` (via `findCoordinationSessionOwningAssignment`)
// refuses BEFORE that parse is even attempted, matching collect-result's own
// CoordinationSession refusal. D04/D05 (plans/260914-dispatch-operability-
// evidence-attribution) separately deferred a STANDALONE (non-session)
// Assignment-level launch/drive exclusivity writer -- for that case,
// `clear-assignment-claim` still legitimately reports `blocked: 'no
// assignment claim exists'`, the same shape clear-cwd-lock reports before
// any cwd lock has ever been written, and non-session test fixtures for both
// actions write this file directly rather than relying on a real writer
// (see dispatch-reconciliation.test.mjs).
function assignmentClaimFile(root, assignmentId) { return path.join(root, '.fgos', 'assignments', assignmentId, 'dispatch.claim'); }
function actionLog(root) { return path.join(root, '.fgos', 'dispatch', 'reconciliation-actions.jsonl'); }
function localLock(root) { return path.join(root, '.fgos', 'dispatch', 'reconcile.lock'); }
function resultFile(runDir) { return path.join(runDir, 'result.json'); }
// Plans arrive over a public CLI boundary.  A path in one is descriptive only;
// apply derives its actual target from the trusted root and action kind.
function canonicalAction(root, kind) {
  if (kind === 'clear-cwd-lock') return { kind, path: lockFile(root) };
  return null;
}
function records(root) { try { return fs.readFileSync(actionLog(root), 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse); } catch { return []; } }
function holder(lock) {
  if (!lock || typeof lock !== 'object' || !Number.isInteger(lock.pid) || lock.pid < 1) return { state: 'unparseable' };
  const recorded = String(lock.startTime ?? lock.processStartTime ?? '');
  const actual = startTime(lock.pid);
  if (!recorded) return { state: 'ambiguous', pid: lock.pid };
  // startTime() returning `undefined` means the read itself failed for a
  // reason OTHER than the process being gone (EACCES, EIO, an unparseable
  // /proc line) -- that is a fact we could not observe, not proof of death,
  // so it must fall to the same 'ambiguous' -> needs-input outcome as a
  // holder with no recorded start time at all. Only a confirmed absence
  // (`null`, ENOENT) or a confirmed mismatch (a live but different
  // incarnation reusing the pid) counts as proof of death.
  if (actual === undefined) return { state: 'ambiguous', pid: lock.pid };
  if (actual === null || actual !== recorded) return { state: 'dead', pid: lock.pid, incarnation: `pid:${lock.pid}:start:${recorded}` };
  return { state: 'live', pid: lock.pid, incarnation: `pid:${lock.pid}:start:${recorded}` };
}

export function planReconciliation(root, { action = 'clear-cwd-lock', runId, assignmentId, now = new Date().toISOString(), ttlMs = 300000 } = {}) {
  if (action === 'collect-result') return planCollectResult(root, { runId, now, ttlMs });
  if (action === 'clear-assignment-claim') return planClearAssignmentClaim(root, { assignmentId, now, ttlMs });
  if (action === 'repair-projection') return planRepairProjection(root, { runId, now, ttlMs });
  const proposedAction = canonicalAction(root, action);
  if (!proposedAction) return { outcome: 'refused', reason: `unsupported reconciliation action: ${action}` };
  const file = proposedAction.path, raw = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null, lock = raw === null ? null : json(file);
  if (raw === null) return { outcome: 'blocked', reason: 'no cwd lock exists' };
  if (lock === undefined) return { outcome: 'needs-input', reason: 'cwd lock is corrupt or unparseable' };
  const proof = holder(lock);
  if (proof.state === 'live') return { outcome: 'refused', reason: 'cwd lock holder resource incarnation is live' };
  if (proof.state !== 'dead') return { outcome: 'needs-input', reason: 'cwd lock holder lacks a verifiable resource incarnation' };
  const snapshot = { digest: digest({ raw }), controlEpoch: lock.controlEpoch ?? null, resourceIncarnation: proof.incarnation, expiresAt: expires(now, ttlMs) };
  return { outcome: 'planned', actionKey: actionKey(snapshot, proposedAction, snapshot.expiresAt), snapshot, proposedAction, preconditions: ['holder-dead-proven', 'no-active-run-for-holder'] };
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
  const runMeta = json(path.join(runDir, 'run.json')) ?? {};
  const snapshot = { digest: digest({ raw }), runId, ownerAuthority: { kind: hint.kind, id: hint.id }, controlEpoch: runMeta.controlEpoch ?? null, expiresAt: expires(now, ttlMs) };
  const proposedAction = { kind: 'collect-result', runId, path: path.join(runDir, 'run.json') };
  return { outcome: 'planned', actionKey: actionKey(snapshot, proposedAction, snapshot.expiresAt), snapshot, proposedAction, preconditions: ['result-valid', 'owner-authority-standalone', 'not-superseded'] };
}

// clear-assignment-claim removes `dispatch.claim`, the per-Assignment
// counterpart to clear-cwd-lock's per-cwd `dispatch.lock` (assignmentClaimFile
// above). Like collect-result, it never derives ownership/admission facts
// itself -- it reuses inspectDispatchRuntime's --assignment and --run views
// verbatim, so it can never disagree with dispatch.runtime.inspect about
// which Run is current for an Assignment or whether that Run has settled.
//
// D04's required proof has three parts, each mapped to a concrete,
// re-derivable fact instead of a human judgment call:
//   1. "no admitted unsettled Run or pending launch exists" -- an admission
//      generation committed with no materialized run.json yet IS a pending
//      launch (inspectDispatchRuntime's own missingMaterializations), and an
//      admitted, materialized Run with no result.json yet IS an unsettled
//      Run (inspectDispatchRuntime's own runResult === null for the current
//      Run). Both are reported `blocked`, not `needs-input`: the facts are
//      complete, a named precondition is simply false.
//   2. "no linked result is pending collection" -- once a Run settles
//      (result.json exists) it must be linked through collect-result's own
//      door FIRST (run.json.resultCollectedAt stamped); clearing the claim
//      out from under an uncollected result would let that evidence become
//      unreachable the moment the claim (and whatever cwd/session context it
//      names) is gone. Also `blocked`.
//   3. "claimed resource absence is proven" -- reuses the exact same
//      PID/start-time dead-incarnation proof clear-cwd-lock already applies
//      via `holder()`: the claim's holder field records the runner process
//      that admitted/drove this Assignment, and only a provably dead
//      incarnation authorizes removal (never TTL alone, per D04's Refusals).
// Multiple current Run ids or corrupt/malformed materializations are
// `needs-input`: unlike missing-materialization or unsettled-Run, an
// ambiguous or corrupt admission ledger is not a single named precondition
// failing, it is runtime-inspection itself unable to say what is true.
function planClearAssignmentClaim(root, { assignmentId, now, ttlMs }) {
  if (typeof assignmentId !== 'string' || !assignmentId.trim()) return { outcome: 'refused', reason: 'clear-assignment-claim requires an assignmentId' };
  const view = inspectDispatchRuntime(root, { assignment: assignmentId });
  if (view.inspectionStatus === 'not-found') return { outcome: 'blocked', reason: 'no matching Assignment was found for clear-assignment-claim' };
  // A CoordinationSession-owned claim (session-engine.mjs's own exclusivity
  // marker, see assignmentClaimFile's doc comment above) is refused before
  // any settlement/admission facts are even consulted: clearing it belongs
  // to that session's own recovery door, never this narrow guard repair --
  // the same refusal shape planCollectResult already applies to a
  // CoordinationSession-owned Run. Checked ahead of the corrupt/unparseable
  // branch below too, since a 0-byte session claim would otherwise only ever
  // reach that generic "needs-input" outcome, which does not name the real
  // owning door.
  const sessionOwner = findCoordinationSessionOwningAssignment(root, assignmentId);
  if (sessionOwner) {
    return { outcome: 'refused', reason: `owning authority is a CoordinationSession ("${sessionOwner.id}"); clearing its dispatch.claim belongs to its own recovery door (${sessionOwner.observeCommand}), not dispatch.runtime.reconcile` };
  }
  const obs = view.observations?.[0]?.value ?? {};
  const currentRunIds = obs.currentRunIds ?? [];
  const missingMaterializations = obs.missingMaterializations ?? [];
  const malformedMaterializations = obs.malformedMaterializations ?? [];
  const duplicateCurrentMaterializations = obs.duplicateCurrentMaterializations ?? [];
  if (malformedMaterializations.length > 0 || duplicateCurrentMaterializations.length > 0) {
    return { outcome: 'needs-input', reason: `assignment "${assignmentId}" admission/materialization facts are corrupt or conflicting; claim proof cannot be verified` };
  }
  if (missingMaterializations.length > 0) {
    return { outcome: 'blocked', reason: `a pending launch is admitted for assignment "${assignmentId}" but not yet materialized` };
  }
  if (currentRunIds.length > 1) {
    return { outcome: 'needs-input', reason: `more than one current Run is derived for assignment "${assignmentId}"; claim proof cannot be verified` };
  }
  if (currentRunIds.length === 1) {
    const runId = currentRunIds[0];
    const runView = inspectDispatchRuntime(root, { run: runId });
    if (runView.inspectionStatus === 'ambiguous') return { outcome: 'needs-input', reason: `more than one Run repository owns assignment "${assignmentId}"'s current run id` };
    const loc = runView.subject.locations[0];
    if (!loc) return { outcome: 'blocked', reason: `admitted run "${runId}" for assignment "${assignmentId}" has not materialized` };
    if (!runView.runResult) return { outcome: 'blocked', reason: `an admitted, unsettled Run ("${runId}") exists for assignment "${assignmentId}"` };
    const runMeta = json(path.join(loc.path, 'run.json')) ?? {};
    if (!runMeta.resultCollectedAt) return { outcome: 'blocked', reason: `a linked result for run "${runId}" is still pending collection for assignment "${assignmentId}"` };
  }
  const file = assignmentClaimFile(root, assignmentId);
  const raw = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null, claim = raw === null ? null : json(file);
  if (raw === null) return { outcome: 'blocked', reason: 'no assignment claim exists' };
  if (claim === undefined) return { outcome: 'needs-input', reason: 'assignment claim is corrupt or unparseable' };
  const proof = holder(claim);
  if (proof.state === 'live') return { outcome: 'refused', reason: 'assignment claim holder resource incarnation is live' };
  if (proof.state !== 'dead') return { outcome: 'needs-input', reason: 'assignment claim holder lacks a verifiable resource incarnation' };
  const snapshot = { digest: digest({ raw }), assignmentId, controlEpoch: claim.controlEpoch ?? null, resourceIncarnation: proof.incarnation, expiresAt: expires(now, ttlMs) };
  const proposedAction = { kind: 'clear-assignment-claim', assignmentId, path: file };
  return { outcome: 'planned', actionKey: actionKey(snapshot, proposedAction, snapshot.expiresAt), snapshot, proposedAction, preconditions: ['holder-dead-proven', 'no-pending-result-collection', 'no-admitted-unsettled-run-or-pending-launch'] };
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
// reader above actually consults; fixed as part of H1.) Like collect-result
// and clear-assignment-claim, it never derives Run/result facts itself: it
// reuses inspectDispatchRuntime's --run view verbatim (the SAME RunResult
// interpretation runtime-inspection.mjs's `one()` already performs, backed
// by run-result.mjs's single interpretRunResult path), so this guard can
// never disagree with dispatch.runtime.inspect -- or with collect-result --
// about whether a Run settled or whether its result is corrupt. There is
// exactly one RunResult-interpretation path in this codebase; re-deriving a
// second one here would let this narrow guard disagree with inspection
// about the same bytes.
//
// D04's "projection source epoch still matches" maps to run.json's own
// controlEpoch field -- the same field collect-result and
// clear-assignment-claim already fold into their CAS snapshot -- so a
// concurrent writer that legitimately re-drives this Run (bumping
// controlEpoch) makes the plan stale instead of letting a repair land on
// top of a newer incarnation's state.
//
// Unlike the retired `phase` field, `status` DOES have a real writer (every
// materialized run.json starts life with a status, per visibility-session.mjs's
// own doc comment), so an absent status is itself part of the defect this
// module exists to close, not a legitimately-already-correct state -- it is
// treated as stale (repairable) exactly like 'running'/'died'/'unknown'.
// Only `status === 'settled'` already matches what a terminal RunResult
// proves, so only that value is reported `blocked` ("nothing to repair"),
// matching every other "nothing to act on" case in this module (clear-cwd-
// lock's "no cwd lock exists", clear-assignment-claim's "no assignment claim
// exists", collect-result's "no result exists yet") rather than a silent
// no-op `applied` that would falsely claim a mutation happened.
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
  const snapshot = { digest: digest({ raw }), runId, currentStatus, controlEpoch: runMeta.controlEpoch ?? null, expiresAt: expires(now, ttlMs) };
  const proposedAction = { kind: 'repair-projection', runId, path: path.join(runDir, 'run.json') };
  return { outcome: 'planned', actionKey: actionKey(snapshot, proposedAction, snapshot.expiresAt), snapshot, proposedAction, preconditions: ['terminal-result-valid', 'status-stale', 'projection-epoch-matches'] };
}

function withLocalLock(root, fn) {
  const file = localLock(root); fs.mkdirSync(path.dirname(file), { recursive: true });
  let fd; try { fd = fs.openSync(file, 'wx'); } catch (e) { return { outcome: 'blocked', reason: 'another reconcile apply is in progress' }; }
  try { fs.writeSync(fd, String(process.pid)); return fn(); } finally { fs.closeSync(fd); try { fs.unlinkSync(file); } catch {} }
}

// collect-result's own target (a specific run.json, keyed by runId) cannot be
// re-derived from `root` and `action` kind alone the way clear-cwd-lock's
// single global cwd-lock file can -- it needs the runId too. Kept as its own
// apply path rather than folding into canonicalAction()'s (root, kind) shape.
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
    // Writer parity with clear-cwd-lock's own pre-mutation re-read (see
    // below): unlike a lock's delete-semantics, collect-result's goal state
    // (a persisted marker) is never satisfied by an absent file, so ENOENT
    // here is always plan-stale (facts changed), never "goal already
    // achieved" -- that shortcut only fits an action whose goal IS absence.
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
    const tmp = `${plan.proposedAction.path}.tmp-${process.pid}-${Date.now().toString(36)}`;
    fs.writeFileSync(tmp, `${JSON.stringify({ ...runMeta, resultCollectedAt: now }, null, 2)}\n`);
    fs.renameSync(tmp, plan.proposedAction.path);
    fs.appendFileSync(actionLog(root), `${JSON.stringify({ actionKey: plan.actionKey, outcome: 'applied', at: now })}\n`);
    return { outcome: 'applied', actionKey: plan.actionKey };
  });
}

// Delete-semantics apply, structurally the same shape as applyReconciliation's
// own clear-cwd-lock branch below (re-derive fresh under the local lock,
// require byte-for-byte agreement with the plan, unlink, tolerate a
// concurrent ENOENT as goal-already-achieved) -- kept as its own function
// because, like collect-result, its target depends on a caller-supplied id
// (assignmentId) that canonicalAction()'s (root, kind) shape cannot carry.
function applyClearAssignmentClaim(root, plan, { now }) {
  const assignmentId = plan?.proposedAction?.assignmentId;
  if (!plan?.actionKey || !plan?.snapshot || typeof assignmentId !== 'string' || !assignmentId.trim()) return { outcome: 'refused', reason: 'apply requires a reconcile plan for a supported action' };
  return withLocalLock(root, () => {
    const prior = records(root).find((r) => r.actionKey === plan.actionKey);
    if (prior) return { outcome: 'already-applied', priorOutcome: prior.outcome, actionKey: plan.actionKey };
    if (Date.parse(now) > Date.parse(plan.snapshot.expiresAt)) return { outcome: 'plan-stale', reason: 'reconcile plan expired' };
    // Full re-derivation from root+assignmentId alone -- the caller-supplied
    // proposedAction.path is never trusted as the mutation target until it is
    // proven identical to what a fresh, from-scratch plan computes right now.
    const fresh = planClearAssignmentClaim(root, { assignmentId, now, ttlMs: Math.max(0, Date.parse(plan.snapshot.expiresAt) - Date.parse(now)) });
    if (fresh.outcome !== 'planned' || stable(fresh.proposedAction) !== stable(plan.proposedAction) || stable(fresh.snapshot) !== stable(plan.snapshot)) {
      return { outcome: fresh.outcome === 'blocked' ? 'blocked' : 'plan-stale', reason: fresh.reason ?? 'assignment claim facts changed since planning' };
    }
    const expectedActionKey = actionKey(fresh.snapshot, fresh.proposedAction, fresh.snapshot.expiresAt);
    if (plan.actionKey !== expectedActionKey) return { outcome: 'plan-stale', reason: 'reconcile action key does not bind the canonical snapshot and target' };
    let raw;
    try {
      raw = fs.readFileSync(plan.proposedAction.path, 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT') return { outcome: 'plan-stale', reason: 'assignment claim was already removed by a concurrent cleanup' };
      throw err;
    }
    if (digest({ raw }) !== plan.snapshot.digest) return { outcome: 'plan-stale', reason: 'assignment claim changed since planning' };
    try {
      fs.unlinkSync(plan.proposedAction.path);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      // Goal state (claim absent) already achieved by a concurrent cleanup --
      // same spirit as clear-cwd-lock's own unlink-ENOENT tolerance below.
    }
    fs.appendFileSync(actionLog(root), `${JSON.stringify({ actionKey: plan.actionKey, outcome: 'applied', at: now })}\n`);
    return { outcome: 'applied', actionKey: plan.actionKey };
  });
}

// Delete-semantics siblings above unlink a file; repair-projection instead
// additively patches run.json.status the same way visibility-session.mjs's
// own markRunSettled does (status + settledAt), the same shape as
// applyCollectResult -- kept as its own function for the same reason
// collect-result is: its target depends on a caller-supplied runId that
// canonicalAction()'s (root, kind) shape cannot carry.
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
    const tmp = `${plan.proposedAction.path}.tmp-${process.pid}-${Date.now().toString(36)}`;
    fs.writeFileSync(tmp, `${JSON.stringify({ ...runMeta, status: SETTLED_STATUS, settledAt: now }, null, 2)}\n`);
    fs.renameSync(tmp, plan.proposedAction.path);
    fs.appendFileSync(actionLog(root), `${JSON.stringify({ actionKey: plan.actionKey, outcome: 'applied', at: now })}\n`);
    return { outcome: 'applied', actionKey: plan.actionKey };
  });
}

export function applyReconciliation(root, plan, { now = new Date().toISOString() } = {}) {
  if (plan?.proposedAction?.kind === 'collect-result') return applyCollectResult(root, plan, { now });
  if (plan?.proposedAction?.kind === 'clear-assignment-claim') return applyClearAssignmentClaim(root, plan, { now });
  if (plan?.proposedAction?.kind === 'repair-projection') return applyRepairProjection(root, plan, { now });
  const canonical = canonicalAction(root, plan?.proposedAction?.kind);
  if (!plan?.actionKey || !plan?.snapshot || !canonical) return { outcome: 'refused', reason: 'apply requires a reconcile plan for a supported action' };
  // Do this before looking up a prior record: a replay must not turn a
  // caller-controlled path/action-key combination into an authorization.
  if (stable(plan.proposedAction) !== stable(canonical)) return { outcome: 'plan-stale', reason: 'reconcile action target is not the canonical guard target' };
  return withLocalLock(root, () => {
    const prior = records(root).find((r) => r.actionKey === plan.actionKey);
    if (prior) return { outcome: 'already-applied', priorOutcome: prior.outcome, actionKey: plan.actionKey };
    if (Date.parse(now) > Date.parse(plan.snapshot.expiresAt)) return { outcome: 'plan-stale', reason: 'reconcile plan expired' };
    const fresh = planReconciliation(root, { action: canonical.kind, now, ttlMs: Math.max(0, Date.parse(plan.snapshot.expiresAt) - Date.parse(now)) });
    if (fresh.outcome !== 'planned' || stable(fresh.snapshot) !== stable(plan.snapshot)) return { outcome: fresh.outcome === 'blocked' ? 'blocked' : 'plan-stale', reason: fresh.reason ?? 'guard facts changed since planning' };
    const expectedActionKey = actionKey(fresh.snapshot, canonical, fresh.snapshot.expiresAt);
    if (plan.actionKey !== expectedActionKey) return { outcome: 'plan-stale', reason: 'reconcile action key does not bind the canonical snapshot and target' };
    // no-active-run-for-holder (the second precondition planReconciliation
    // already names): a dead cwd-lock holder does not mean the Run it was
    // guarding is actually finished -- a successor process could be mid
    // launch against this same cwd with no result.json written yet. Reuse
    // the real read-only Run/admission view (runtime-inspection.mjs's own
    // --cwd selector) instead of trusting the unverified precondition
    // string. activeRunIds is populated purely from Run materialization
    // (run.json present, result.json absent) and is computed before that
    // view's own ownership/evidence-completeness checks, so it is reliable
    // even when the rest of the view is only 'partial'.
    const runtimeView = inspectDispatchRuntime(root, { cwd: root });
    const activeRunIds = runtimeView.observations?.[0]?.value?.activeRunIds ?? [];
    if (activeRunIds.length > 0) return { outcome: 'blocked', reason: `active Run(s) still bound to this holder's cwd: ${activeRunIds.join(', ')}` };
    if (runtimeView.inspectionStatus === 'partial' || runtimeView.inspectionStatus === 'conflicting' || runtimeView.inspectionStatus === 'ambiguous') {
      return { outcome: 'needs-input', reason: 'dispatch runtime inspection for this cwd is incomplete or conflicting; no-active-run-for-holder cannot be verified' };
    }
    // Re-read the canonical guard bytes immediately before unlink -- writer
    // parity with tryAcquireOnce's own reclaim (src/runner/main-checkout-lock.mjs
    // lines 304-323): any successor guard visible at this re-read (changed
    // digest) survives untouched (plan-stale below). The residual window
    // between this read and the unlink syscall itself is the same accepted,
    // inherent-to-POSIX-pathname-locks race tryAcquireOnce and
    // releaseMainCheckoutLockIfOwn already carry for the identical
    // dead-holder-reclaim scenario -- not closable without a writer-side
    // protocol change (every dispatch-lock writer taking a sidecar
    // meta-lock), recorded as accepted residual risk, not a defect.
    let raw;
    try {
      raw = fs.readFileSync(canonical.path, 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT') return { outcome: 'plan-stale', reason: 'cwd lock was already removed by a concurrent cleanup' };
      throw err;
    }
    if (digest({ raw }) !== plan.snapshot.digest) return { outcome: 'plan-stale', reason: 'cwd lock changed since planning' };
    try {
      fs.unlinkSync(canonical.path);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      // Goal state (guard absent) already achieved by a concurrent cleanup --
      // same spirit as tryAcquireOnce's own unlink-ENOENT tolerance.
    }
    fs.appendFileSync(actionLog(root), `${JSON.stringify({ actionKey: plan.actionKey, outcome: 'applied', at: now })}\n`);
    return { outcome: 'applied', actionKey: plan.actionKey };
  });
}
