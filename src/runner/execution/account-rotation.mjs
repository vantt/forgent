// src/runner/execution/account-rotation.mjs -- may a failed seat run again on another account of
// the same provider?
//
// The question is answered from the same account inventory and quarantine state the lease ranks
// from (provider-capacity.mjs), never from a second ranking: an account is usable when the
// inventory lists it and it is not quarantined. Which account the retry then runs on stays the
// lease's choice; this module only says whether a retry has anything to rotate to.

import { deriveProviderFamily } from '../dispatch/resolve.mjs';
import { normalizeProviderFamily } from '../dispatch/provider-adapter.mjs';
import { inspectProviderCapacity } from '../dispatch/provider-capacity.mjs';
import { getProviderFamily } from './bind.mjs';

/** The provider bucket the capacity lease keys an executor's accounts under. */
export function capacityProviderOf(runnerConfig, executorId) {
  const executors = runnerConfig?.executors ?? runnerConfig?.runner?.executors ?? {};
  const fallbackExecutor = runnerConfig?.executor ?? runnerConfig?.runner?.executor;
  return normalizeProviderFamily(deriveProviderFamily(executors[executorId] ?? fallbackExecutor));
}

/**
 * What an account rotation for `executorId` has to work with, read after the failed attempt was
 * settled (its account is already quarantined when the failure was a dead login or a quota).
 *
 * @returns {{ provider: string, total: number, healthy: number } | null}
 *   null when the executor's provider has no account inventory (nothing to rotate) or the state
 *   cannot be read (the seat then walks to the next candidate as it always did).
 */
export function inspectAccountRotation({ runnerConfig, executorId, runtimeDir }) {
  const provider = capacityProviderOf(runnerConfig, executorId);
  let accounts;
  try {
    accounts = inspectProviderCapacity({ runnerConfig, provider, runtimeDir }).providers[provider]?.accounts;
  } catch (error) {
    process.stderr.write(`fgos: could not read the account state of provider ${provider}, so no account rotation: ${error?.message ?? error}\n`);
    return null;
  }
  const list = Object.values(accounts ?? {});
  if (list.length === 0) return null;
  return { provider, total: list.length, healthy: list.filter((account) => account.healthy).length };
}

/**
 * Whether the seat may retry the same executor now: another usable account exists, and the
 * retries already spent on this candidate stay below the number of accounts it has, so a
 * provider whose failures are not quarantined still never loops on one account.
 *
 * @param {{ total: number, healthy: number } | null} rotation from inspectAccountRotation
 * @param {number} rotationsSpent same-candidate retries already made
 */
export function mayRotateAccount(rotation, rotationsSpent) {
  return Boolean(rotation) && rotation.healthy > 0 && rotationsSpent < rotation.total - 1;
}

/**
 * Provider families whose login failed in this unit and that a seat then walked away from, read
 * from the attempts the runner recorded (resume rebuilds from them, and the write gate recomputes
 * the same exclusion from them). `boundBefore` (epoch ms) keeps only walks made no later than
 * that instant, so an attempt is judged with exactly what was known when it was bound.
 *
 * @returns {Set<string>} lower-cased provider families
 */
export function credentialFaultFamilies(unitRecord, { boundBefore = null } = {}) {
  const families = new Set();
  const runnerConfig = unitRecord?.configSnapshot?.runner;
  for (const attempts of Object.values(unitRecord?.bindings ?? {})) {
    if (!Array.isArray(attempts)) continue;
    attempts.forEach((attempt, index) => {
      const walked = attempts[index + 1];
      if (attempt?.failureCause !== 'credential' || walked?.fallbackFrom?.kind !== 'next-candidate' || !attempt.binding?.executor) return;
      if (boundBefore !== null && !(Date.parse(walked.boundAt) <= boundBefore)) return;
      families.add(getProviderFamily(runnerConfig, attempt.binding.executor).toLowerCase());
    });
  }
  return families;
}
