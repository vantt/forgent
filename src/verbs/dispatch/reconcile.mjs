import { planReconciliation, applyReconciliation } from '../../runner/dispatch/reconciliation-planner.mjs';
export class DispatchReconcileError extends Error { constructor(message) { super(message); this.name = 'DispatchReconcileError'; } }
// F6: whitelist exactly the fields this public boundary is meant to accept
// -- never spread the whole caller-supplied payload through. `now`/`ttlMs`
// are deliberately excluded from both use cases: forwarding them would let
// a caller forge the CAS clock/window planReconciliation and
// applyReconciliation otherwise derive from the real wall clock and their
// own expiresAt-vs-now bookkeeping.
export function reconcilePlanUseCase(ctx, payload = {}) {
  const { action, runId, assignmentId, cwd } = payload;
  return planReconciliation(ctx?.repoRoot ?? ctx?.cwd ?? process.cwd(), { action, runId, assignmentId, cwd });
}
export function reconcileApplyUseCase(ctx, payload = {}) { return applyReconciliation(ctx?.repoRoot ?? ctx?.cwd ?? process.cwd(), payload.plan); }
export function invokeDispatchReconcileOperation(request) {
  if (request?.operationId !== 'dispatch.runtime.reconcile' || request?.effect !== 'write') throw new DispatchReconcileError('unsupported Dispatch reconciliation operation');
  return request.payload?.apply ? reconcileApplyUseCase(request.ctx, request.payload) : reconcilePlanUseCase(request.ctx, request.payload);
}
