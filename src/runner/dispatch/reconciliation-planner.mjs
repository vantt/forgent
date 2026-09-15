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
import { inspectDispatchRuntime } from './runtime-inspection.mjs';

const stable = (v) => v && typeof v === 'object' ? (Array.isArray(v) ? `[${v.map(stable).join(',')}]` : `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`) : JSON.stringify(v);
const digest = (v) => `sha256:${createHash('sha256').update(stable(v)).digest('hex')}`;
const json = (file) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return undefined; } };
const startTime = (pid) => { try { return fs.readFileSync(`/proc/${pid}/stat`, 'utf8').trim().split(' ')[21] ?? null; } catch { return null; } };
const expires = (now, ttlMs) => new Date(Date.parse(now) + ttlMs).toISOString();
const actionKey = (snapshot, action, expiresAt) => `reconcile_${createHash('sha256').update(stable({ snapshot, action, expiresAt })).digest('hex')}`;

function lockFile(root) { return path.join(root, '.fgos', 'dispatch.lock'); }
function actionLog(root) { return path.join(root, '.fgos', 'dispatch', 'reconciliation-actions.jsonl'); }
function localLock(root) { return path.join(root, '.fgos', 'dispatch', 'reconcile.lock'); }
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
  // An absent proc entry proves the recorded incarnation is gone.  A reused
  // pid (different start time) proves this incarnation is gone too.
  if (actual === null || actual !== recorded) return { state: 'dead', pid: lock.pid, incarnation: `pid:${lock.pid}:start:${recorded}` };
  return { state: 'live', pid: lock.pid, incarnation: `pid:${lock.pid}:start:${recorded}` };
}

export function planReconciliation(root, { action = 'clear-cwd-lock', now = new Date().toISOString(), ttlMs = 300000 } = {}) {
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

function withLocalLock(root, fn) {
  const file = localLock(root); fs.mkdirSync(path.dirname(file), { recursive: true });
  let fd; try { fd = fs.openSync(file, 'wx'); } catch (e) { return { outcome: 'blocked', reason: 'another reconcile apply is in progress' }; }
  try { fs.writeSync(fd, String(process.pid)); return fn(); } finally { fs.closeSync(fd); try { fs.unlinkSync(file); } catch {} }
}

export function applyReconciliation(root, plan, { now = new Date().toISOString() } = {}) {
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
