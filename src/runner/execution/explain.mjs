// `fgos dispatch explain`: why a capability lands where it does. It binds the capability exactly as
// a run would (bind() is the one authority on family, tier, model, pool and invocation) and lays the
// pieces out beside the config that produced them: the candidates in order with the reason one is
// out, the walk a seat takes when each binding fails, and the accounts of every pool on the walk in
// the order the lease takes them. Nothing is leased, spawned or written.

import { bind, listCandidates, walkBindings } from './bind.mjs';
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
function accountsOf(runnerConfig, pool, cli, projectConfig) {
  let accounts = {};
  let inventoryProblem = null;
  try {
    accounts = providerAccountInventory(runnerConfig)?.[legacyStateKey(pool)]?.accounts ?? {};
  } catch (err) {
    inventoryProblem = { code: 'inventory-invalid', at: 'runner.providers', detail: err.message };
  }
  const declared = runnerConfig?.llmAccounts?.[pool] !== undefined;
  const { problems } = readLlmAccounts(runnerConfig, { projectConfig });
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
 * @param {object} [ask.projectConfig] the raw project config, to report an account inventory declared there.
 */
export function explainCapability(runnerConfig, { capability, rigor, session, projectConfig } = {}) {
  if (typeof capability !== 'string' || !capability) throw new Error('dispatch explain requires --for <capability>');
  const unit = { id: 'explain', capability, writes: [], ...(rigor ? { rigor } : {}) };
  const bindAsk = { unit, role: 'producer' };
  const bindCtx = { runnerConfig, session };
  const binding = bind(bindAsk, bindCtx);
  const ask = { capability, rigor: rigor ?? null, session: { herdrPresent: session?.herdrPresent === true } };
  if (binding.refused) return { ask, refused: binding.refused };

  const executorEntry = runnerConfig.executors?.[binding.executor];
  const family = executorEntry ? deriveProviderFamily(executorEntry) : null;
  const p = binding.provenance ?? {};
  const { candidates, policy } = listCandidates(bindAsk, bindCtx);
  const walk = walkBindings(bindAsk, bindCtx);
  const storeOf = (executor, invocation) => storeOfBinding(runnerConfig.executors?.[executor], invocation);

  const cellEntries = candidates
    .filter((c) => c.executor === binding.executor && c.pool !== null)
    .map((c) => ({
      model: c.model,
      pool: c.pool,
      status: c.model === binding.model && c.pool === binding.pool ? 'used' : c.out ? 'unusable' : 'fallback',
      ...(c.out ? { reason: c.out.detail } : {}),
    }));
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
    pool: binding.pool,
    cell: { entries: cellEntries },
    candidates: candidates.map((c) => ({
      family: c.family,
      executor: c.executor,
      invocation: c.invocation,
      pool: c.pool,
      model: c.model,
      state: c.out ? 'out' : 'in',
      ...(c.out ? { reason: c.out.reason, detail: c.out.detail } : {}),
    })),
    walk: walk.map((b, position) => ({
      position,
      family: deriveProviderFamily(runnerConfig.executors?.[b.executor]),
      executor: b.executor,
      invocation: b.invocation,
      pool: b.pool,
      model: b.model,
      store: storeOf(b.executor, b.invocation)?.use ?? null,
    })),
    accounts: pools.map(([pool, cli]) => accountsOf(runnerConfig, pool, cli, projectConfig)),
  };
}
