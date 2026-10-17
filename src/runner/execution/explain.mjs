// `fgos dispatch explain`: why a capability lands where it does. It binds the capability exactly as
// a run would (bind() is the one authority on family, tier, model and invocation) and lays the
// pieces out beside the config that produced them: the whole tier cell and which entry runs, and the
// accounts the family's pool has in each inventory. Nothing is leased, spawned or written.

import { bind } from './bind.mjs';
import { deriveProviderFamily, resolveTierCandidates } from '../dispatch/resolve.mjs';
import { readLlmAccounts, legacyStateKey } from '../dispatch/llm-accounts.mjs';
import { providerAccountInventory } from '../dispatch/provider-capacity.mjs';

/**
 * Label every entry of the tier cell: the one that runs is `used`; a later entry served by the
 * family's own pool is `fallback-same-pool`; an entry served by another pool waits for pool routing
 * (`pending-pool-routing`), since the lease rotates accounts within the family's pool only.
 */
function labelCell(runnerConfig, tier, family, model) {
  let entries;
  try {
    entries = resolveTierCandidates(runnerConfig, tier, family);
  } catch (err) {
    return { entries: [], problem: err.message };
  }
  let usedSeen = false;
  return {
    entries: entries.map((entry) => {
      let status;
      if (entry.pool !== family) status = 'pending-pool-routing';
      else if (!usedSeen && entry.model === model) { status = 'used'; usedSeen = true; }
      else status = 'fallback-same-pool';
      return { model: entry.model, pool: entry.pool, status };
    }),
    problem: null,
  };
}

function accountsOf(runnerConfig, pool, projectConfig) {
  let legacy = [];
  let legacyProblem = null;
  try {
    legacy = Object.keys(providerAccountInventory(runnerConfig)?.[legacyStateKey(pool)]?.accounts ?? {});
  } catch (err) {
    legacyProblem = err.message;
  }
  const { pools, problems } = readLlmAccounts(runnerConfig, { projectConfig });
  const declared = runnerConfig?.llmAccounts !== undefined;
  const current = pools[pool]?.accounts ?? {};
  return {
    pool,
    legacyKey: legacyStateKey(pool),
    legacy: legacy.map((id) => ({ id, llmAccounts: declared ? (current[id] ? 'declared' : 'missing') : 'not-configured' })),
    llmAccounts: declared
      ? Object.entries(current).map(([id, a]) => ({ id, disabled: a.disabled, clis: Object.keys(a.stores), inLegacy: legacy.includes(id) }))
      : null,
    problems: [...(legacyProblem ? [{ code: 'legacy-inventory-invalid', at: 'runner.providers', detail: legacyProblem }] : []), ...problems],
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
  const binding = bind({ unit, role: 'producer' }, { runnerConfig, session });
  const ask = { capability, rigor: rigor ?? null, session: { herdrPresent: session?.herdrPresent === true } };
  if (binding.refused) return { ask, refused: binding.refused };

  const executorEntry = runnerConfig.executors?.[binding.executor];
  const family = executorEntry ? deriveProviderFamily(executorEntry) : null;
  const p = binding.provenance ?? {};
  return {
    ask,
    family,
    executor: { id: binding.executor, source: p.executor?.source ?? null },
    invocation: binding.invocation,
    transport: binding.transport,
    tier: { value: binding.tier, source: p.tier?.source ?? null, maxTier: runnerConfig.maxTier ?? null },
    model: { value: binding.model, source: p.model?.source ?? null },
    cell: family ? labelCell(runnerConfig, binding.tier, family, binding.model) : { entries: [], problem: 'the bound executor is not registered in this config' },
    accounts: family ? accountsOf(runnerConfig, family, projectConfig) : null,
  };
}
