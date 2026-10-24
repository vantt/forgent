// `fgos dispatch explain`: why a capability lands where it does. It asks Seat Binding exactly as a run
// would (explainSeat: the crate is the one authority on family, tier, model, pool, effort and
// invocation) and lays the pieces out beside the config that produced them: the candidates with the
// reason one is out, the walk a seat takes when each binding fails, the crate's own explanation, and
// the accounts of every pool on the walk in the order the lease takes them. Nothing is leased, spawned
// or written.

import { explainSeat } from './bind.mjs';
import { deriveProviderFamily } from '../dispatch/resolve.mjs';
import { readLlmAccounts, legacyStateKey } from '../dispatch/llm-accounts.mjs';
import { credentialSourceForCli, credentialStoreOf, providerAccountInventory } from '../dispatch/provider-capacity.mjs';

/**
 * The login store the bound invocation reads, and whether the config declares it or it is inferred from
 * an older config's private-home binding; null when the invocation is not named or reads none.
 */
function storeOfBinding(executorEntry, invocationId) {
  const entry = invocationId ? executorEntry?.invocations?.find((inv) => inv?.id === invocationId) : null;
  const store = entry ? credentialStoreOf({ ...entry, command: entry.command ?? executorEntry.command }) : null;
  return store ? { ...store, source: entry.credentialStore ? 'declared' : 'inferred' } : null;
}

/**
 * The accounts of `pool` in the order the lease takes them, each with whether the CLI `cli` can run on
 * it. A pool no inventory lists runs on the executor's own login.
 */
function accountsOf(runnerConfig, pool, cli) {
  let accounts = {};
  let inventoryProblem = null;
  try {
    accounts = providerAccountInventory(runnerConfig)?.[legacyStateKey(pool)]?.accounts ?? {};
  } catch (err) {
    inventoryProblem = { code: 'inventory-invalid', at: 'runner.providers', detail: err.message };
  }
  const declared = runnerConfig?.llmAccounts?.[pool] !== undefined;
  const { problems } = readLlmAccounts(runnerConfig);
  return {
    pool,
    stateKey: legacyStateKey(pool),
    source: declared ? 'llmAccounts' : 'providers',
    accounts: Object.entries(accounts).map(([id, account]) => {
      const reason = account.disabled === true ? 'disabled'
        : cli && !credentialSourceForCli(account, cli) ? `no "${cli}" login store`
          : null;
      return { id, usable: reason === null, ...(reason ? { reason } : {}) };
    }),
    problems: [...(inventoryProblem ? [inventoryProblem] : []), ...problems.filter((p) => p.at.startsWith(`runner.llmAccounts.${pool}`) || p.at === 'runner.llmAccounts')],
  };
}

/**
 * @param {object} runnerConfig the merged runner section.
 * @param {object} ask
 * @param {string} ask.capability
 * @param {string} [ask.rigor]
 * @param {object} ask.session the bind() session (`headless`, `herdrPresent`).
 */
export function explainCapability(runnerConfig, { capability, rigor, session } = {}) {
  if (typeof capability !== 'string' || !capability) throw new Error('dispatch explain requires --for <capability>');
  const unit = { id: 'explain', capability, writes: [], ...(rigor ? { rigor } : {}) };
  const { binding, policy, ranked, explain, walk } = explainSeat({ unit, role: 'producer' }, { runnerConfig, session });
  const ask = { capability, rigor: rigor ?? null, session: { herdrPresent: session?.herdrPresent === true } };
  const explanation = explain?.lines ?? [];
  if (binding.refused) return { ask, refused: binding.refused, explanation };

  const executorEntry = runnerConfig.executors?.[binding.executor];
  const family = executorEntry ? deriveProviderFamily(executorEntry) : null;
  const p = binding.provenance ?? {};
  const storeOf = (executor, invocation) => storeOfBinding(runnerConfig.executors?.[executor], invocation);

  const candidates = [
    ...(ranked?.candidates ?? []).map((c) => ({ family: c.family, executor: c.executor, invocation: c.invocation ?? null, pool: c.pool ?? null, model: c.model ?? null, state: 'in' })),
    ...(ranked?.skipped ?? []).filter((c) => c.family).map((c) => ({ family: c.family, executor: c.executor, invocation: null, pool: c.pool ?? null, model: c.model ?? null, state: 'out', reason: c.reason, detail: c.detail })),
  ];
  // The entries of the bound executor's cell at the tier it ran at, in cell order, each used, kept for the
  // walk, or out for the reason the crate gave.
  const cellEntries = (policy?.cells?.[family] ?? [])
    .map((entry) => ({ model: entry.model, pool: entry.pool ?? family }))
    .filter(() => binding.pool !== null)
    .map(({ model, pool }) => {
      const found = candidates.find((c) => c.executor === binding.executor && c.model === model && c.pool === pool);
      const status = model === binding.model && pool === binding.pool ? 'used' : found?.state === 'out' ? 'unusable' : 'fallback';
      return { model, pool, status, ...(found?.state === 'out' ? { reason: found.detail } : {}) };
    });
  const pools = [...new Map(walk.filter((b) => b.pool).map((b) => [b.pool, storeOf(b.executor, b.invocation)?.use ?? null])).entries()];

  return {
    ask,
    family,
    executor: { id: binding.executor, source: p.executor?.source ?? null },
    invocation: binding.invocation,
    credentialStore: storeOfBinding(executorEntry, binding.invocation),
    transport: binding.transport,
    // Where the tier came from, the workflow's recommendation when it is not the tier chosen, and the
    // ceiling: a tier lowered by `maxTier` names the tier it was lowered from and the `maxTier` line.
    tier: {
      value: binding.tier,
      source: p.tier?.source ?? null,
      definition: policy?.definition ?? null,
      recommendation: p.tier?.recommendation ?? null,
      loweredFrom: p.tier?.loweredFrom ?? null,
      maxTier: p.tier?.maxTier ?? null,
    },
    model: { value: binding.model, source: p.model?.source ?? null },
    effort: { value: binding.reasoningEffort, source: p.reasoningEffort?.source ?? null },
    pool: binding.pool,
    cell: { entries: cellEntries },
    candidates,
    walk: walk.map((b, position) => ({
      position,
      family: deriveProviderFamily(runnerConfig.executors?.[b.executor]),
      executor: b.executor,
      invocation: b.invocation,
      pool: b.pool,
      model: b.model,
      store: storeOf(b.executor, b.invocation)?.use ?? null,
    })),
    accounts: pools.map(([pool, cli]) => accountsOf(runnerConfig, pool, cli)),
    explanation,
  };
}
