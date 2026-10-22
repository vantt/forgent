// Runner configs a Work seat can be bound under. Seat Binding binds a Work operation or a raw dispatch the
// way it binds a unit run's seat, so a fixture needs a pool for the capability: `prefer`, or the families
// `tierFallback` lists for a tier. `bindable` adds the latter, from the agent executors the config registers
// (the global `executor` included, serving the first family the config has cells for), when the fixture states none.

import { withDefaultExecutor } from '../../src/runner/dispatch/config.mjs';
import { deriveProviderFamily } from '../../src/runner/dispatch/resolve.mjs';

const TIERS = ['nano', 'mini', 'standard', 'advanced', 'flagship', 'frontier'];

export function bindable(input) {
  if (input.tierFallback) return input;
  // The global executor serves the first family the config has cells for.
  const family = Object.keys(input.modelPolicies ?? {})[0];
  let config = input.executor && family ? { ...input, executor: { providerModel: family, ...input.executor } } : input;
  // An executor named after a family it has cells for serves that family, whatever program it runs.
  const named = (id, entry) => (entry && typeof entry === 'object' && !entry.providerModel && !entry.provider && input.modelPolicies?.[id] ? { ...entry, providerModel: id } : entry);
  if (config.executors) config = { ...config, executors: Object.fromEntries(Object.entries(config.executors).map(([id, entry]) => [id, named(id, entry)])) };
  const loaded = withDefaultExecutor(config);
  const registered = loaded.executors ?? {};
  const families = [...new Set(Object.entries(registered).filter(([, entry]) => entry?.kind !== 'tool').map(([id, entry]) => entry?.providerModel ?? deriveProviderFamily(entry, entry?.command ?? id)))];
  return { ...loaded, tierFallback: Object.fromEntries(TIERS.map((tier) => [tier, families])) };
}

/** `executeAssignment` with the runner config made bindable, for fixtures that state the minimum. */
export const bindableExecute = (execute) => (assignment, options = {}) => execute(assignment, options.runnerConfig ? { ...options, runnerConfig: bindable(options.runnerConfig) } : options);
