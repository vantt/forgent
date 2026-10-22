// Runner configs a Work seat can be bound under. Seat Binding binds a Work operation or a raw dispatch the
// way it binds a unit run's seat. The executor the caller names, else the runner's default executor, reaches
// the crate as a pin, so a config with a default executor needs no pool. Only a config with no executor at all
// has nothing to pin and no `prefer`, so `bindable` gives it the families its executors serve as the tier list.

import { withDefaultExecutor } from '../../src/runner/dispatch/config.mjs';
import { deriveProviderFamily } from '../../src/runner/dispatch/resolve.mjs';

const TIERS = ['nano', 'mini', 'standard', 'advanced', 'flagship', 'frontier'];

export function bindable(input) {
  return poolOf(input, true);
}

/** `bindable` for a config written to a project file: the loader registers the default executor itself. */
export function bindableFile(input) {
  return poolOf(input, false);
}

function poolOf(input, expanded) {
  if (input.tierFallback) return input;
  // The global executor serves the first family the config has cells for.
  const family = Object.keys(input.modelPolicies ?? {})[0];
  let config = input.executor && family ? { ...input, executor: { providerModel: family, ...input.executor } } : input;
  // An executor named after a family it has cells for serves that family, whatever program it runs.
  const named = (id, entry) => (entry && typeof entry === 'object' && !entry.providerModel && !entry.provider && input.modelPolicies?.[id] ? { ...entry, providerModel: id } : entry);
  if (config.executors) config = { ...config, executors: Object.fromEntries(Object.entries(config.executors).map(([id, entry]) => [id, named(id, entry)])) };
  const loaded = expanded || !input.executor ? withDefaultExecutor(config) : config;
  const base = expanded ? loaded : config;
  if (input.executor) return base; // the default executor is the pin
  const families = [...new Set(Object.entries(loaded.executors ?? {}).filter(([, entry]) => entry?.kind !== 'tool').map(([id, entry]) => entry?.providerModel ?? deriveProviderFamily(entry, entry?.command ?? id)))];
  return { ...base, tierFallback: Object.fromEntries(TIERS.map((tier) => [tier, families])) };
}

/** `executeAssignment` with the runner config made bindable, for fixtures that state the minimum. */
export const bindableExecute = (execute) => (assignment, options = {}) => execute(assignment, options.runnerConfig ? { ...options, runnerConfig: bindable(options.runnerConfig) } : options);
