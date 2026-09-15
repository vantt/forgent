// Narrow, local guard/projection reconciliation.  This module deliberately
// contains no adapter, recovery, process-control, or execution imports.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const stable = (v) => v && typeof v === 'object' ? (Array.isArray(v) ? `[${v.map(stable).join(',')}]` : `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`) : JSON.stringify(v);
const digest = (v) => `sha256:${createHash('sha256').update(stable(v)).digest('hex')}`;
const json = (file) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return undefined; } };
const startTime = (pid) => { try { return fs.readFileSync(`/proc/${pid}/stat`, 'utf8').trim().split(' ')[21] ?? null; } catch { return null; } };
const expires = (now, ttlMs) => new Date(Date.parse(now) + ttlMs).toISOString();
const actionKey = (snapshot, action, expiresAt) => `reconcile_${createHash('sha256').update(stable({ snapshot, action, expiresAt })).digest('hex')}`;

function lockFile(root) { return path.join(root, '.fgos', 'dispatch.lock'); }
function actionLog(root) { return path.join(root, '.fgos', 'dispatch', 'reconciliation-actions.jsonl'); }
function localLock(root) { return path.join(root, '.fgos', 'dispatch', 'reconcile.lock'); }
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
  if (action !== 'clear-cwd-lock') return { outcome: 'refused', reason: `unsupported reconciliation action: ${action}` };
  const file = lockFile(root), raw = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null, lock = raw === null ? null : json(file);
  if (raw === null) return { outcome: 'blocked', reason: 'no cwd lock exists' };
  if (lock === undefined) return { outcome: 'needs-input', reason: 'cwd lock is corrupt or unparseable' };
  const proof = holder(lock);
  if (proof.state === 'live') return { outcome: 'refused', reason: 'cwd lock holder resource incarnation is live' };
  if (proof.state !== 'dead') return { outcome: 'needs-input', reason: 'cwd lock holder lacks a verifiable resource incarnation' };
  const snapshot = { digest: digest({ raw }), controlEpoch: lock.controlEpoch ?? null, resourceIncarnation: proof.incarnation, expiresAt: expires(now, ttlMs) };
  const proposedAction = { kind: action, path: file };
  return { outcome: 'planned', actionKey: actionKey(snapshot, proposedAction, snapshot.expiresAt), snapshot, proposedAction, preconditions: ['holder-dead-proven', 'no-active-run-for-holder'] };
}

function withLocalLock(root, fn) {
  const file = localLock(root); fs.mkdirSync(path.dirname(file), { recursive: true });
  let fd; try { fd = fs.openSync(file, 'wx'); } catch (e) { return { outcome: 'blocked', reason: 'another reconcile apply is in progress' }; }
  try { fs.writeSync(fd, String(process.pid)); return fn(); } finally { fs.closeSync(fd); try { fs.unlinkSync(file); } catch {} }
}

export function applyReconciliation(root, plan, { now = new Date().toISOString() } = {}) {
  if (!plan?.actionKey || !plan?.snapshot || plan?.proposedAction?.kind !== 'clear-cwd-lock') return { outcome: 'refused', reason: 'apply requires a reconcile plan for a supported action' };
  return withLocalLock(root, () => {
    const prior = records(root).find((r) => r.actionKey === plan.actionKey);
    if (prior) return { outcome: 'already-applied', priorOutcome: prior.outcome, actionKey: plan.actionKey };
    if (Date.parse(now) > Date.parse(plan.snapshot.expiresAt)) return { outcome: 'plan-stale', reason: 'reconcile plan expired' };
    const fresh = planReconciliation(root, { action: plan.proposedAction.kind, now, ttlMs: Math.max(0, Date.parse(plan.snapshot.expiresAt) - Date.parse(now)) });
    if (fresh.outcome !== 'planned' || stable(fresh.snapshot) !== stable(plan.snapshot)) return { outcome: fresh.outcome === 'blocked' ? 'blocked' : 'plan-stale', reason: fresh.reason ?? 'guard facts changed since planning' };
    // Re-read exact bytes immediately before unlink: this protects a successor.
    const raw = fs.readFileSync(plan.proposedAction.path, 'utf8');
    if (digest({ raw }) !== plan.snapshot.digest) return { outcome: 'plan-stale', reason: 'cwd lock changed since planning' };
    fs.unlinkSync(plan.proposedAction.path);
    fs.appendFileSync(actionLog(root), `${JSON.stringify({ actionKey: plan.actionKey, outcome: 'applied', at: now })}\n`);
    return { outcome: 'applied', actionKey: plan.actionKey };
  });
}
