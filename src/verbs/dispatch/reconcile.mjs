import { planReconciliation, applyReconciliation } from '../../runner/dispatch/reconciliation-planner.mjs';
import { loadGlobalConfig } from '../../config/global-config.mjs';
import { clearProviderAccountQuarantine, quarantineProviderAccount, providerAccountInventory, ProviderCapacityConfigError } from '../../runner/dispatch/provider-capacity.mjs';
export class DispatchReconcileError extends Error {
  constructor(message, { category = 'validation' } = {}) {
    super(message);
    this.name = 'DispatchReconcileError';
    this.category = category;
  }
}
// F6: whitelist exactly the fields this public boundary is meant to accept
// -- never spread the whole caller-supplied payload through. `now`/`ttlMs`
// are deliberately excluded from both use cases: forwarding them would let
// a caller forge the CAS clock/window planReconciliation and
// applyReconciliation otherwise derive from the real wall clock and their
// own expiresAt-vs-now bookkeeping.
export function reconcilePlanUseCase(ctx, payload = {}) {
  const { action, runId, assignmentId, cwd } = payload;
  if ((runId !== undefined || assignmentId !== undefined) && (!action || action === 'clear-cwd-lock')) {
    throw new DispatchReconcileError(
      'dispatch reconcile plan with --run or --assignment requires --action (e.g. collect-result, clear-assignment-claim, or repair-projection)',
    );
  }
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
export function reconcileProviderCapacityQuarantineUseCase(ctx, payload = {}) {
  const { provider, account, reason } = payload;
  const refuse = (reasonCode, detail) => ({ contract: 'provider-capacity.quarantine.v1', status: 'refused', provider, accountId: account, reasonCode, detail });
  if (!provider || typeof provider !== 'string') throw new DispatchReconcileError('provider-capacity quarantine requires --provider');
  if (!account || typeof account !== 'string') throw new DispatchReconcileError('provider-capacity quarantine requires --account');
  if (!reason || typeof reason !== 'string') throw new DispatchReconcileError('provider-capacity quarantine requires --reason');
  const until = new Date(payload.until);
  if (!payload.until || Number.isNaN(until.getTime())) throw new DispatchReconcileError('provider-capacity quarantine requires --until as an ISO date-time');
  if (until.getTime() <= Date.now()) return refuse('until-in-past', `--until ${payload.until} is not in the future`);
  const runnerConfig = loadGlobalConfig(payload.globalConfigPath);
  if (!providerAccountInventory(runnerConfig)[provider]?.accounts?.[account]) {
    return refuse('unknown-account', `unknown provider/account ${provider}/${account}`);
  }
  const quarantine = quarantineProviderAccount({
    provider,
    accountId: account,
    reasonCode: 'quota-limit',
    quarantineKind: 'temporary',
    until: until.toISOString(),
    runtimeDir: payload.runtimeDir,
    detail: { kind: 'owner', reason, caller: ctx?.actor || 'fgos dispatch reconcile provider-capacity quarantine' },
  });
  return { contract: 'provider-capacity.quarantine.v1', status: 'quarantined', provider, accountId: account, quarantine };
}
export function invokeDispatchReconcileOperation(request) {
  if (request?.operationId !== 'dispatch.runtime.reconcile' || request?.effect !== 'write') throw new DispatchReconcileError('unsupported Dispatch reconciliation operation');
  if (request.payload?.providerCapacity?.action === 'quarantine') {
    return reconcileProviderCapacityQuarantineUseCase(request.ctx, request.payload.providerCapacity);
  }
  if (request.payload?.providerCapacity?.action === 'clear-quarantine') {
    return reconcileProviderCapacityClearUseCase(request.ctx, request.payload.providerCapacity);
  }
  return request.payload?.apply ? reconcileApplyUseCase(request.ctx, request.payload) : reconcilePlanUseCase(request.ctx, request.payload);
}
