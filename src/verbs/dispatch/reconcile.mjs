import { planReconciliation, applyReconciliation } from '../../runner/dispatch/reconciliation-planner.mjs';
export class DispatchReconcileError extends Error { constructor(message) { super(message); this.name = 'DispatchReconcileError'; } }
export function reconcilePlanUseCase(ctx, payload = {}) { return planReconciliation(ctx?.repoRoot ?? ctx?.cwd ?? process.cwd(), payload); }
export function reconcileApplyUseCase(ctx, payload = {}) { return applyReconciliation(ctx?.repoRoot ?? ctx?.cwd ?? process.cwd(), payload.plan, payload); }
export function invokeDispatchReconcileOperation(request) {
  if (request?.operationId !== 'dispatch.runtime.reconcile' || request?.effect !== 'write') throw new DispatchReconcileError('unsupported Dispatch reconciliation operation');
  return request.payload?.apply ? reconcileApplyUseCase(request.ctx, request.payload) : reconcilePlanUseCase(request.ctx, request.payload);
}
