// dispatch/executor-governance.mjs -- the two checks every dispatch door runs on the executor it is about to
// use: which registered entry and provider family the executor id names, and whether governance allows
// that executor and provider (`disallowedProviders` / `disallowedExecutors`). Neither chooses anything:
// the executor was decided upstream (Seat Binding for a unit seat, the caller's own pin elsewhere).

import { RunnerConfigError } from './config.mjs';
import { deriveProviderFamily } from './resolve.mjs';
import { checkProviderDisallowed } from './provider-adapter.mjs';

/**
 * Resolve `primaryExecutor` to its REGISTERED config entry (Phase 00 R6,
 * fixes H2a/H2b) and derive its provider family (Phase 00 R6 fix F1) --
 * extracted verbatim from the dispatch policy's own former
 * inline steps 3b/4 (dispatch-engine-liveness-hardening Phase 7, C3
 * finding) so `cli.mjs`'s `executeExecutorCli` can derive the SAME
 * `resolvedProvider` it needs for governance without running this
 * resolver's entire tier/quality/persona/model computation. Same checks,
 * same order, same throws as before this extraction -- a pure move.
 *
 * @param {object} params
 * @param {object} [params.runnerConfig]
 * @param {string} params.primaryExecutor
 * @param {string} [params.explicitProviderModel] an already-resolved
 *   providerModel override (cliOverride/opPolicy), when the caller has one
 * @param {{disallowedProviders?: string[], disallowedExecutors?: string[]}} [params.options]
 * @returns {{resolvedProvider: string, registeredExecutorEntry: object|undefined}}
 */
export function resolveExecutorProvider({ runnerConfig, primaryExecutor, options = {} }) {
  const hasExecutorRegistry = Boolean(runnerConfig && runnerConfig.executors && typeof runnerConfig.executors === 'object');
  const hasGovernanceOptions =
    (Array.isArray(options.disallowedProviders) && options.disallowedProviders.length > 0) ||
    (Array.isArray(options.disallowedExecutors) && options.disallowedExecutors.length > 0);
  if (hasGovernanceOptions && !hasExecutorRegistry) {
    throw new RunnerConfigError(
      `governance requires "disallowedProviders"/"disallowedExecutors" but runnerConfig.executors is absent -- provider family cannot be verified for executor "${primaryExecutor}"`,
    );
  }
  const registeredExecutorEntry = hasExecutorRegistry ? runnerConfig.executors[primaryExecutor] : undefined;
  const isImplicitDefaultExecutor = primaryExecutor === 'claude' || primaryExecutor === runnerConfig?.executor?.command || primaryExecutor === runnerConfig?.executor?.invocations?.[0]?.command || primaryExecutor === runnerConfig?.executor?.invocations?.[0]?.id;
  if (hasExecutorRegistry && !registeredExecutorEntry && !isImplicitDefaultExecutor) {
    throw new RunnerConfigError(`preferExecutor "${primaryExecutor}" is not a registered executor (runnerConfig.executors has no such entry).`);
  }
  const registeredExecutorCommand = registeredExecutorEntry?.invocations?.find((inv) => inv.via === 'cli')?.command;
  const resolvedProvider = registeredExecutorEntry
    ? deriveProviderFamily(registeredExecutorEntry, registeredExecutorCommand)
    : isImplicitDefaultExecutor
      ? deriveProviderFamily({ command: runnerConfig?.executor?.command }, primaryExecutor)
      : primaryExecutor;
  return { resolvedProvider, registeredExecutorEntry };
}

/**
 * Governance gate (Phase 00 R6/F2): reject an already-resolved provider
 * family / executor id pair against `options.disallowedProviders`/
 * `.disallowedExecutors`. Extracted from the dispatch policy
 * (dispatch-engine-liveness-hardening Phase 7, C3 finding) so a caller that
 * has already resolved its own provider/executor (e.g. `cli.mjs`'s
 * `executeExecutorCli`/`spawnWorker`, which used to run this resolver's
 * entire tier/quality/persona/model computation only to reach this same
 * check) can run the SAME governance check directly, without a second,
 * redundant resolver call whose rich result it then discarded.
 *
 * @param {object} params
 * @param {string} params.primaryExecutor the resolved executor id
 * @param {string} params.providerModel the resolved provider family
 * @param {{disallowedProviders?: string[], disallowedExecutors?: string[]}} [params.options]
 * @returns {{canonicalProvider: string}}
 */
export function resolveExecutorGovernance({ primaryExecutor, providerModel, options = {} }) {
  const providerGov = checkProviderDisallowed(options.disallowedProviders, providerModel);
  if (providerGov.disallowed) {
    throw new RunnerConfigError(`governance gate rejected provider "${providerGov.canonicalProvider}": disallowed egress`, {
      code: 'governance.disallowed-provider',
    });
  }
  if (options.disallowedExecutors && options.disallowedExecutors.includes(primaryExecutor)) {
    throw new RunnerConfigError(`governance gate rejected executor "${primaryExecutor}": disallowed`, {
      code: 'governance.disallowed-executor',
    });
  }
  return { canonicalProvider: providerGov.canonicalProvider };
}
