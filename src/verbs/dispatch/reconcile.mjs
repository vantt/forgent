import { planReconciliation, applyReconciliation } from '../../runner/dispatch/reconciliation-planner.mjs';
import { loadGlobalConfig } from '../../config/global-config.mjs';
import { clearProviderAccountQuarantine, ProviderCapacityConfigError } from '../../runner/dispatch/provider-capacity.mjs';
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
export function reconcileProviderCapacityClearUseCase(ctx, payload = {}) {
  const provider = payload.provider;
  const account = payload.account;
  const reason = payload.reason;
  const force = payload.force === true;
  if (!provider || typeof provider !== 'string') throw new DispatchReconcileError('provider-capacity clear-quarantine requires --provider');
  if (!account || typeof account !== 'string') throw new DispatchReconcileError('provider-capacity clear-quarantine requires --account');
  if (!reason || typeof reason !== 'string') throw new DispatchReconcileError('provider-capacity clear-quarantine requires --reason');
  const runnerConfig = loadGlobalConfig(payload.globalConfigPath);
  try {
    return clearProviderAccountQuarantine({
      runnerConfig,
      provider,
      accountId: account,
      reason,
      force,
      runtimeDir: payload.runtimeDir,
      caller: ctx?.actor || 'fgos dispatch reconcile provider-capacity clear-quarantine',
    });
  } catch (err) {
    if (err instanceof ProviderCapacityConfigError) {
      const reasonCode = /unknown provider\/account/.test(err.message)
        ? 'unknown-account'
        : /not quarantined/.test(err.message)
          ? 'not-quarantined'
          : 'validation';
      return {
        contract: 'provider-capacity.clear-quarantine.v1',
        status: 'refused',
        provider,
        accountId: account,
        reasonCode,
        detail: err.message,
      };
    }
    throw err;
  }
}
export function invokeDispatchReconcileOperation(request) {
  if (request?.operationId !== 'dispatch.runtime.reconcile' || request?.effect !== 'write') throw new DispatchReconcileError('unsupported Dispatch reconciliation operation');
  if (request.payload?.providerCapacity?.action === 'clear-quarantine') {
    return reconcileProviderCapacityClearUseCase(request.ctx, request.payload.providerCapacity);
  }
  return request.payload?.apply ? reconcileApplyUseCase(request.ctx, request.payload) : reconcilePlanUseCase(request.ctx, request.payload);
}
