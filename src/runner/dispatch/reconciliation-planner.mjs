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

const stable = (v) => v && typeof v === 'object' ? (Array.isArray(v) ? `[${v.map(stable).join(',')}]` : `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`) : JSON.stringify(v);
const digest = (v) => `sha256:${createHash('sha256').update(stable(v)).digest('hex')}`;
const json = (file) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return undefined; } };
// Paren-aware /proc/<pid>/stat parser, deliberately kept as its own copy
// rather than importing detached-run-supervisor.mjs's getProcessStartTime: that
// module is the cli-spawn ADAPTER (it also owns child_process.spawn, worker
// PGID signalling, receipt publication) and importing any one export from it
// would put the whole adapter/process-control module on this file's import
// graph, which the file-top comment and
// test/runner/dispatch-reconciliation-import-graph.test.mjs's own static
// import-graph walk both forbid. The algorithm below is intentionally
// byte-identical to
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
    if (err && err.code === 'ENOENT') {
      try {
        process.kill.call(process, pid, 0);
        return undefined;
      } catch (killErr) {
        if (killErr && killErr.code === 'EPERM') return undefined;
      }
    }
    // ENOENT on a procfs-capable host proves the incarnation is gone; on
    // hosts without /proc (macOS), a live `kill(pid, 0)` result means the
    // stat path is unsupported, not dead proof.
    return err && err.code === 'ENOENT' ? null : undefined;
  }
  const lastParen = stat.lastIndexOf(')');
  if (lastParen === -1) return undefined;
  const rest = stat.slice(lastParen + 2).split(' ');
  // A truncated line (fewer than the 20 fixed-index fields starttime at
  // index 19 requires) is a read/format anomaly this parser cannot
  // interpret, not proof of anything -- it must return `undefined`
  // (ambiguous) the same as any other unparseable line, never fall through
  // to `rest[19] || null`, which would misread "field absent because the
  // line was cut short" as "field present but empty" and collapse into the
  // confirmed-dead `null` signal.
  if (rest.length < 20) return undefined;
  return rest[19] || null;
}
// USER_HZ (clock ticks per second) that /proc/<pid>/stat's starttime field
// (index 19, clock ticks since boot) is expressed in. 100 is the value on
// every mainstream Linux distro's default kernel config and is what this
// host's own `getconf CLK_TCK` reports -- but it is a kernel build-time
// constant this process cannot query directly, so `verifyUserHz` below is a
// load-once tripwire against that specific assumption being wrong on some
// other host, not a per-call check.
const USER_HZ = 100;
let userHzVerified;
function readBtimeMs() {
  let stat;
  try {
    stat = fs.readFileSync('/proc/stat', 'utf8');
  } catch {
    return undefined;
  }
  const match = /^btime (\d+)$/m.exec(stat);
  return match ? Number(match[1]) * 1000 : undefined;
}
// Computes this OWN process's start time via /proc/self/stat + /proc/stat's
// btime (the exact conversion cwdLockHolder below applies to a lock's
// holder pid) and compares it against Node's own trusted
// `Date.now() - process.uptime() * 1000` -- a value this process did not
// derive from USER_HZ at all. Agreement within a few seconds is cheap
// evidence the USER_HZ=100 assumption holds on this host; disagreement
// means the conversion cannot be trusted for ANY pid, so every subsequent
// call falls back to 'ambiguous' rather than risking a wrong dead/live
// verdict off a silently-mistaken tick rate.
function verifyUserHz() {
  if (userHzVerified !== undefined) return userHzVerified;
  const ticks = startTime(process.pid);
  const btimeMs = readBtimeMs();
  if (typeof ticks !== 'string' || !/^\d+$/.test(ticks) || btimeMs === undefined) {
    userHzVerified = false;
    return userHzVerified;
  }
  const computedStartMs = btimeMs + Number(ticks) * (1000 / USER_HZ);
  const realStartMs = Date.now() - process.uptime() * 1000;
  userHzVerified = Math.abs(computedStartMs - realStartMs) <= 2000;
  return userHzVerified;
}
// Dead-margin (D05 fail-closed insurance, not a TTL): tick-rate rounding and
// scheduling jitter between reading `now`/btime and the kernel's own
// starttime sample can legitimately disagree by a small amount even for the
// SAME incarnation -- 5s comfortably absorbs that noise without weakening
// the reuse proof, which needs a materially LATER start time, not a
// millisecond one.
const CWD_LOCK_DEAD_MARGIN_MS = 5000;
// Real production record shape for the per-cwd dispatch lock
// (main-checkout-lock.mjs's own tryAcquireOnce, written under the filename
// dispatchLockFile(cwd) computes): `{pid: "<pid>:<acquiredAtMs>:<rand>", ts:
// <int>}`, where `pid` is a composite identity string, never a bare
// integer. Distinct from holder() below, which parses withLocalLock's own
// `{pid: integer, startTime: string}` reclaim-marker shape -- never reused
// for a lock that DOES have a real, known production shape (H1's own class
// of defect: matching a fixture instead of the real writer).
const CWD_LOCK_IDENTITY_RE = /^(\d+):(\d+):[a-z0-9]+$/;
function cwdLockHolder(lock) {
  if (!lock || typeof lock !== 'object' || typeof lock.pid !== 'string') return { state: 'unparseable' };
  const match = CWD_LOCK_IDENTITY_RE.exec(lock.pid);
  if (!match) return { state: 'unparseable' };
  const pid = Number(match[1]);
  const identityTs = Number(match[2]);
  if (!Number.isInteger(lock.ts) || lock.ts < identityTs) return { state: 'unparseable' };
  const incarnation = `pid:${pid}:acquired:${identityTs}`;
  const ticks = startTime(pid);
  // ENOENT: the incarnation that acquired this lock is confirmed gone.
  if (ticks === null) return { state: 'dead', pid, incarnation };
  // Any other read/parse failure proves nothing either way -- same
  // ambiguous-not-dead discipline as holder() above.
  if (ticks === undefined) return { state: 'ambiguous', pid };
  if (!verifyUserHz()) return { state: 'ambiguous', pid };
  const btimeMs = readBtimeMs();
  if (btimeMs === undefined || !/^\d+$/.test(ticks)) return { state: 'ambiguous', pid };
  const startWallMs = btimeMs + Number(ticks) * (1000 / USER_HZ);
  // A materially LATER start time than the identity's own acquisition ts is
  // proof a different, later-started process now holds this pid -- reuse,
  // not the same incarnation. NEVER lock age/TTL here (D04): a live,
  // same-or-earlier-started incarnation is fail-closed live regardless of
  // how long it has held the lock.
  if (startWallMs > identityTs + CWD_LOCK_DEAD_MARGIN_MS) return { state: 'dead', pid, incarnation };
  return { state: 'live', pid, incarnation };
}
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

// Real production per-cwd dispatch lock file, matching
// main-checkout-lock.mjs's own dispatchLockFile(cwd) filename computation --
// a local one-liner, deliberately NOT importing dispatchLockFile itself
// (main-checkout-lock.mjs is a lock-acquisition primitive, not one of this
// module's own read-only guard/projection imports; see the file-top
// comment). test/runner/dispatch-reconciliation.test.mjs pins this
// computation to agreement with the real dispatchLockFile export so the two
// can never silently drift apart.
function lockFile(root, cwd) { return path.join(root, '.fgos', `dispatch--${encodeURIComponent(cwd)}.lock`); }
function actionLog(root) { return path.join(root, '.fgos', 'dispatch', 'reconciliation-actions.jsonl'); }
function localLock(root) { return path.join(root, '.fgos', 'dispatch', 'reconcile.lock'); }
function resultFile(runDir) { return path.join(runDir, 'result.json'); }
// Plans arrive over a public CLI boundary.  A path in one is descriptive only;
// apply derives its actual target from the trusted root and action kind.
function canonicalAction(root, kind, cwd) {
  if (kind === 'clear-cwd-lock') return { kind, path: lockFile(root, cwd), cwd };
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

export function planReconciliation(root, { action = 'clear-cwd-lock', runId, assignmentId, cwd = process.cwd(), now = new Date().toISOString(), ttlMs = 300000, runsCache = null } = {}) {
  return withRunsCache(runsCache, () => {
    if ((runId !== undefined || assignmentId !== undefined) && (!action || action === 'clear-cwd-lock')) {
      return { outcome: 'refused', reason: 'dispatch reconcile plan with --run or --assignment requires --action (e.g. collect-result or repair-projection)' };
    }
    if (action === 'collect-result') return planCollectResult(root, { runId, now, ttlMs });
    if (action === 'repair-projection') return planRepairProjection(root, { runId, now, ttlMs });
    const proposedAction = canonicalAction(root, action, cwd);
    if (!proposedAction) return { outcome: 'refused', reason: `unsupported reconciliation action: ${action}` };
    const file = proposedAction.path, raw = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null, lock = raw === null ? null : json(file);
    if (raw === null) return { outcome: 'blocked', reason: 'no cwd lock exists' };
    if (lock === undefined) return { outcome: 'needs-input', reason: 'cwd lock is corrupt or unparseable' };
    const proof = cwdLockHolder(lock);
    if (proof.state === 'live') return { outcome: 'refused', reason: 'cwd lock holder resource incarnation is live' };
    if (proof.state !== 'dead') return { outcome: 'needs-input', reason: 'cwd lock holder lacks a verifiable resource incarnation' };
    // No `controlEpoch` field here: the real production record
    // ({pid, ts}, see lockFile's doc comment) never carries one, and the
    // full-byte `digest` below already detects any successor rewrite of this
    // exact file -- an inert, always-null field would add nothing a real
    // writer could ever populate.
    const snapshot = { digest: digest({ raw }), resourceIncarnation: proof.incarnation, expiresAt: expires(now, ttlMs) };
    return { outcome: 'planned', actionKey: actionKey(snapshot, proposedAction, snapshot.expiresAt), snapshot, proposedAction, preconditions: ['holder-dead-proven', 'no-active-run-for-holder'] };
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

// M9a: this module already has everything a dead-holder reclaim needs
// (`startTime`/`holder`, the exact {pid, startTime} proof) -- withLocalLock
// itself never used any of it. A crashed applyReconciliation/
// applyCollectResult/applyRepairProjection call used to leave
// reconcile.lock wedged FOREVER (no TTL, no reclaim at all), blocking every
// future reconcile apply on this host. Reclaim only ever fires on
// `holder(...).state === 'dead'` -- the same PID+startTime proof, never
// elapsed time alone.
function withLocalLock(root, fn) {
  const file = localLock(root); fs.mkdirSync(path.dirname(file), { recursive: true });
  const record = { pid: process.pid, startTime: startTime(process.pid) };
  let fd;
  try {
    fd = fs.openSync(file, 'wx');
  } catch (e) {
    if (e.code !== 'EEXIST') throw e;
    let existing;
    try {
      existing = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      return { outcome: 'blocked', reason: 'another reconcile apply is in progress' };
    }
    if (holder(existing).state !== 'dead') {
      return { outcome: 'blocked', reason: 'another reconcile apply is in progress' };
    }
    try { fs.unlinkSync(file); } catch { /* raced with the dead holder's own cleanup -- fine either way */ }
    try {
      fd = fs.openSync(file, 'wx');
    } catch (retryErr) {
      if (retryErr.code === 'EEXIST') return { outcome: 'blocked', reason: 'another reconcile apply is in progress' };
      throw retryErr;
    }
  }
  try {
    fs.writeSync(fd, JSON.stringify(record));
    return fn();
  } finally {
    fs.closeSync(fd);
    try { fs.unlinkSync(file); } catch {}
  }
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
    const tmp = `${plan.proposedAction.path}.tmp-${uniqueTmpTag()}`;
    fs.writeFileSync(tmp, `${JSON.stringify({ ...runMeta, resultCollectedAt: now }, null, 2)}\n`);
    fs.renameSync(tmp, plan.proposedAction.path);
    fs.appendFileSync(actionLog(root), `${JSON.stringify({ actionKey: plan.actionKey, outcome: 'applied', at: now })}\n`);
    clearAllRunsCache(root);
    return { outcome: 'applied', actionKey: plan.actionKey };
  });
}

// clear-cwd-lock's delete-semantics apply (below) unlinks a file;
// repair-projection instead additively patches run.json.status the same way visibility-session.mjs's
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
    const canonical = canonicalAction(root, plan?.proposedAction?.kind, plan?.proposedAction?.cwd);
    if (!plan?.actionKey || !plan?.snapshot || !canonical) return { outcome: 'refused', reason: 'apply requires a reconcile plan for a supported action' };
    // Do this before looking up a prior record: a replay must not turn a
    // caller-controlled path/action-key combination into an authorization.
    if (stable(plan.proposedAction) !== stable(canonical)) return { outcome: 'plan-stale', reason: 'reconcile action target is not the canonical guard target' };
    return withLocalLock(root, () => {
      const prior = records(root).find((r) => r.actionKey === plan.actionKey);
    if (prior) return { outcome: 'already-applied', priorOutcome: prior.outcome, actionKey: plan.actionKey };
    if (Date.parse(now) > Date.parse(plan.snapshot.expiresAt)) return { outcome: 'plan-stale', reason: 'reconcile plan expired' };
    const fresh = planReconciliation(root, { action: canonical.kind, cwd: canonical.cwd, now, ttlMs: Math.max(0, Date.parse(plan.snapshot.expiresAt) - Date.parse(now)) });
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
    // F1: `canonical.cwd` -- the specific cwd this per-cwd lock was
    // acquired for -- not `root` (the repo/.fgos root, a different thing
    // now that one root can hold many per-cwd locks). Using `root` here
    // would check the wrong cwd's active-Run bindings whenever a caller's
    // cwd differs from the repo root.
    const runtimeView = inspectDispatchRuntime(root, { cwd: canonical.cwd });
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
    clearAllRunsCache(root);
    return { outcome: 'applied', actionKey: plan.actionKey };
  });
  });
}
