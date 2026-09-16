// setup/executor-profile-warnings.mjs — Phase 06 (executor-policy-dispatch-seams,
// phase-06-executor-profile-invocations.md): doctor WARNINGS (never hard
// failures -- config loading/dispatch stays unchanged) that name legacy
// executor config entries hardcoding policy-shaped behavior that belongs to
// a later ExecutorProfile/invocation/PlacementPolicy migration instead.
//
// Read-only by construction (RUL9, matching checkConfigNotStale's own
// discipline): only ever loads config, never writes, never scaffolds a fix.
// Legacy executor ids remain fully accepted -- this only surfaces WHERE a
// later migration target lives, per each warning's own `migrateTo` field.

import { normalizeProviderFamily, extractPolicyShapedFlags } from '../runner/dispatch/provider-adapter.mjs';

// Env var name patterns that look like they are trying to do Provider
// Capacity Rotator's own job (account pool / credential home selection)
// from inside an executor's static config, instead of through
// `runner.providers.<provider>.accounts` (plans/260916-account-rotator/).
// Intentionally a name-pattern heuristic, not an exhaustive enum: the
// specific incident this guards against (`FGOS_CODEX_CREDENTIAL_HOMES`,
// removed in the provider-capacity-rotator slice-1 commit) is gone, but a
// project could reintroduce an equivalent pattern under a different name.
const ACCOUNT_POOL_ENV_NAME_PATTERN = /_(CREDENTIAL_HOMES?|ACCOUNT_POOL|ACCOUNTS)$/i;

function invocationsCliEntry(executorEntry) {
  return Array.isArray(executorEntry?.invocations) ? executorEntry.invocations.find((inv) => inv.via === 'cli') : undefined;
}

function collectArgsAndEnv(executorEntry) {
  const cli = invocationsCliEntry(executorEntry);
  return {
    args: cli?.args ?? executorEntry?.args ?? [],
    env: cli?.env ?? executorEntry?.env ?? {},
    command: cli?.command ?? executorEntry?.command,
    providerModel: executorEntry?.providerModel,
  };
}

/**
 * Scan every registered executor + every capability's overrides for
 * policy-shaped runtime behavior hardcoded where the target architecture
 * (design.md §3.5/§3.6/§3.7) says it should instead live in
 * ProviderAdapter runtime options, a compatibility alias patch, an
 * invocation, or PlacementPolicy/model-calibration -- never a hard failure,
 * always named with its migration target.
 *
 * @param {object} cfg a loaded runner config (`loadRunnerConfigFromDir`'s
 *   own shape: top-level `executors`/`capabilities`, not the `{runner:
 *   {...}}` wrapper)
 * @returns {{id: string, migrateTo: string, detail: string}[]}
 */
export function collectExecutorProfileWarnings(cfg) {
  const warnings = [];
  const executors = cfg?.executors && typeof cfg.executors === 'object' ? cfg.executors : {};
  const capabilities = cfg?.capabilities && typeof cfg.capabilities === 'object' ? cfg.capabilities : {};

  for (const [executorId, executorEntry] of Object.entries(executors)) {
    const { args, env, command, providerModel } = collectArgsAndEnv(executorEntry);

    const flags = extractPolicyShapedFlags(args, normalizeProviderFamily(providerModel, command));
    if (flags.length > 0) {
      warnings.push({
        id: `executor.${executorId}.policy-shaped-flags`,
        migrateTo: 'ProviderAdapter runtime option (design.md §3.5)',
        detail: `executors.${executorId} hardcodes policy-shaped flag(s) in args: ${flags.join(', ')}`,
      });
    }

    if (executorEntry?.rigorOverrides !== undefined) {
      warnings.push({
        id: `executor.${executorId}.rigor-overrides`,
        migrateTo: 'PlacementPolicy model calibration (design.md §3.6), not executor identity',
        detail: `executors.${executorId} declares its own "rigorOverrides" -- model calibration living on executor identity instead of PlacementPolicy`,
      });
    }

    for (const [envName] of Object.entries(env)) {
      if (ACCOUNT_POOL_ENV_NAME_PATTERN.test(envName)) {
        warnings.push({
          id: `executor.${executorId}.account-pool-env.${envName}`,
          migrateTo: 'Provider Capacity Rotator global account inventory (plans/260916-account-rotator/, runner.providers.<provider>.accounts)',
          detail: `executors.${executorId} declares env "${envName}", which looks like executor-owned account/credential-pool selection -- that belongs to the global Provider Capacity Rotator inventory, never a static executor env value`,
        });
      }
    }
  }

  for (const [capabilityId, capabilityEntry] of Object.entries(capabilities)) {
    const overrides = capabilityEntry?.overrides;
    if (overrides?.rigorOverrides !== undefined) {
      warnings.push({
        id: `capability.${capabilityId}.rigor-overrides`,
        migrateTo: 'PlacementPolicy model calibration (design.md §3.6)',
        detail: `capabilities.${capabilityId}.overrides declares "rigorOverrides" -- current legacy calibration channel; PlacementPolicy is the documented target source once shadow proof (Phase 05) is promoted to production (Phase 07)`,
      });
    }
  }

  return warnings;
}

/**
 * Doctor check wrapper (registerCheck's own {passed, message} contract).
 * `passed: false` here means "doctor has something to name", not "this
 * config is broken" -- config loading/dispatch behavior is completely
 * unaffected either way (RUL9/H-track precedent: doctor surfaces, never
 * blocks). Legacy executor ids remain fully accepted.
 */
export function checkExecutorProfileWarnings(cwd, cfg) {
  const warnings = collectExecutorProfileWarnings(cfg);
  if (warnings.length === 0) {
    return { passed: true, message: 'no legacy policy-shaped executor/capability entries found' };
  }
  const summary = warnings.map((w) => `${w.id} -> ${w.migrateTo}`).join('; ');
  return {
    passed: false,
    message: `${warnings.length} legacy executor-profile warning(s) (informational, not blocking): ${summary}`,
  };
}
