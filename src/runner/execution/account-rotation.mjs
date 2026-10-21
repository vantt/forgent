// src/runner/execution/account-rotation.mjs -- may a failed seat run again on another account of
// the same pool?
//
// The question is answered from the same account inventory and quarantine state the lease ranks
// from (provider-capacity.mjs), never from a second ranking: an account is usable when the
// inventory lists it, it is not disabled and it is not quarantined. Which account the retry then
// runs on stays the lease's choice; this module only says whether a retry has anything to rotate to.

import { inspectProviderCapacity } from '../dispatch/provider-capacity.mjs';
import { legacyStateKey } from '../dispatch/llm-accounts.mjs';
import { bindingIdentity } from './bind.mjs';

/**
 * What an account rotation in `pool` has to work with, read after the failed attempt was settled
 * (its account is already quarantined when the failure was a dead login or a quota).
 *
 * @returns {{ pool: string, total: number, healthy: number } | null}
 *   null when the pool has no account inventory (nothing to rotate) or the state cannot be read
 *   (the seat then walks to the next candidate as it always did).
 */
export function inspectAccountRotation({ runnerConfig, pool, runtimeDir }) {
  const stateKey = legacyStateKey(pool);
  let accounts;
  try {
    accounts = inspectProviderCapacity({ runnerConfig, provider: stateKey, runtimeDir }).providers[stateKey]?.accounts;
  } catch (error) {
    process.stderr.write(`fgos: could not read the account state of pool ${pool}, so no account rotation: ${error?.message ?? error}\n`);
    return null;
  }
  const list = Object.values(accounts ?? {}).filter((account) => account.disabled !== true);
  if (list.length === 0) return null;
  return { pool, total: list.length, healthy: list.filter((account) => account.healthy).length };
}

/**
 * Whether the seat may retry the same candidate now: another usable account exists, and the
 * retries already spent on this candidate stay below the number of accounts it has, so a
 * pool whose failures are not quarantined still never loops on one account.
 *
 * @param {{ total: number, healthy: number } | null} rotation from inspectAccountRotation
 * @param {number} rotationsSpent same-candidate retries already made
 */
export function mayRotateAccount(rotation, rotationsSpent) {
  return Boolean(rotation) && rotation.healthy > 0 && rotationsSpent < rotation.total - 1;
}

/**
 * The seat's earlier bindings that a walk resumes from when attempt `at` is bound (or re-checked by
 * the write gate): every binding recorded before it, oldest first. A binding recorded before bindings
 * carried a pool has no walk state this code can read, so it is left out and the walk restarts at the
 * primary for it. A retry on another account of the same candidate is not a step of the walk: the
 * earlier attempts it repeats are left out, so it resumes exactly where the attempt it retries did.
 *
 * @param {object[]} attempts the seat's recorded attempts (`unit.json` bindings, one role/round)
 * @param {number} at index of the attempt being bound (past the end: the attempt about to be recorded)
 * @returns {object[]}
 */
export function triedBindingsOf(attempts, at) {
  if (!Array.isArray(attempts) || at <= 0) return [];
  const own = attempts[at]?.binding ? bindingIdentity(attempts[at].binding) : null;
  return attempts.slice(0, at)
    .map((attempt) => attempt?.binding)
    .filter((binding) => binding && Object.hasOwn(binding, 'pool') && bindingIdentity(binding) !== own);
}

/**
 * The walk state a recomputed binding of one recorded attempt needs, read from the attempt chain the
 * runner persisted in `unit.json` -- never from the assignment, which a caller could forge, and only
 * from the attempt's own role/round chain. The write gate and the doctor binding check both bind
 * through this one door, so a fallback attempt is recomputed with the seat's earlier bindings and the
 * pools it had walked away from. A first attempt or an unknown assignment binds from the primary.
 *
 * @param {object} unitRecord parsed `unit.json`
 * @param {{ seat: string, round: string|number, assignmentId: string }} attempt the seat and the attempt
 * @returns {{ tried: object[], excludePools: string[], continuity?: object }} the `bind()` walk state
 */
export function walkStateOf(unitRecord, { seat, round, assignmentId }) {
  const attempts = unitRecord?.bindings?.[`${seat}/${round}`];
  const at = Array.isArray(attempts) ? attempts.findIndex((attempt) => attempt?.assignmentId === assignmentId) : -1;
  const boundAt = Date.parse(attempts?.[at]?.boundAt);
  const kept = keptBindingOf(unitRecord, seat, round);
  return {
    tried: Array.isArray(attempts) ? triedBindingsOf(attempts, at) : [],
    excludePools: [...credentialFaultPools(unitRecord, { boundBefore: Number.isFinite(boundAt) ? boundAt : -Infinity })],
    ...(kept ? { continuity: kept } : {}),
  };
}

/**
 * The binding a seat keeps into round `round`: the last binding the unit recorded for the same seat in
 * its latest earlier round. A seat that runs several rounds in one unit (a debate side's rebuttal, a
 * producer's next pass) keeps executor, model and effort; null in its first round.
 *
 * @returns {object|null}
 */
export function keptBindingOf(unitRecord, seat, round) {
  const current = Number(round);
  let latest = null;
  for (const [key, attempts] of Object.entries(unitRecord?.bindings ?? {})) {
    const [keySeat, keyRound] = [key.slice(0, key.lastIndexOf('/')), Number(key.slice(key.lastIndexOf('/') + 1))];
    if (keySeat !== seat || !Number.isFinite(keyRound) || keyRound >= current || !Array.isArray(attempts)) continue;
    const binding = attempts.at(-1)?.binding;
    if (binding && !binding.refused && binding.mechanism !== 'inline' && (latest === null || keyRound > latest.round)) latest = { round: keyRound, binding };
  }
  return latest?.binding ?? null;
}

/**
 * Pools whose login failed in this unit and that a seat then walked away from, read from the attempts
 * the runner recorded (resume rebuilds from them, and the write gate recomputes the same exclusion
 * from them). `boundBefore` (epoch ms) keeps only walks made no later than that instant, so an
 * attempt is judged with exactly what was known when it was bound.
 *
 * @returns {Set<string>} pool names
 */
export function credentialFaultPools(unitRecord, { boundBefore = null } = {}) {
  const pools = new Set();
  for (const attempts of Object.values(unitRecord?.bindings ?? {})) {
    if (!Array.isArray(attempts)) continue;
    attempts.forEach((attempt, index) => {
      const walked = attempts[index + 1];
      const pool = attempt?.binding?.pool;
      if (attempt?.failureCause !== 'credential' || walked?.fallbackFrom?.kind !== 'next-candidate' || !pool) return;
      if (boundBefore !== null && !(Date.parse(walked.boundAt) <= boundBefore)) return;
      pools.add(pool);
    });
  }
  return pools;
}
