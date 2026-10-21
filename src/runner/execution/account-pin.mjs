// src/runner/execution/account-pin.mjs -- a person may pin the account a seat runs on, written
// `pool/account` (`fgos run --account openai/work`, or `account` in an `--override`).
//
// A pin never bypasses the lease: the dispatch still leases through provider-capacity.mjs, from an
// inventory narrowed to the one account (the narrowing `fgos dispatch probe-account` uses), so a
// quarantine, the lease record and governance all apply exactly as for an unpinned seat. A pin is
// hard: a provider limit on it ends the seat (run.mjs) instead of rotating or walking away.
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/**.

import { inspectProviderCapacity } from '../dispatch/provider-capacity.mjs';
import { configPinnedToAccount } from '../dispatch/provider-account-probe.mjs';
import { legacyStateKey } from '../dispatch/llm-accounts.mjs';
import { RunnerConfigError } from '../dispatch/config.mjs';

const refuse = (reason, detail) => ({ refused: { reason, detail } });

/**
 * Split `pool/account` at the first `/`. A bare id names no pool and is refused with the form to write.
 *
 * @returns {{ pool: string, id: string } | { refused: { reason: string, detail: string } }}
 */
export function parseAccountPin(value) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return refuse('account-pin-invalid', `a pinned account must be written pool/account (for example openai/work), got ${JSON.stringify(value)}`);
  const slash = text.indexOf('/');
  if (slash <= 0 || slash === text.length - 1) {
    return refuse('account-pin-invalid', `a pinned account must be written pool/account (for example openai/work), got "${text}": name the pool the account belongs to`);
  }
  return { pool: text.slice(0, slash), id: text.slice(slash + 1) };
}

/** The runner config a binding is dispatched with: a pinned one leases from its one account only. */
export function runnerConfigForBinding(runnerConfig, bound) {
  if (!bound?.account) return runnerConfig;
  return configPinnedToAccount(runnerConfig, { provider: legacyStateKey(bound.account.pool), accountId: bound.account.id });
}

/**
 * Refuse a pinned account that is quarantined now, naming until when it waits and why. Read from
 * the same capacity state the lease reads; the lease still refuses it on its own at dispatch.
 *
 * @param {Array<{ role?: string, account?: { pool: string, id: string } }>} pins
 */
export function assertPinnedAccountsUsable(pins, { runnerConfig, runtimeDir, what }) {
  for (const { account } of pins) {
    if (!account) continue;
    const provider = legacyStateKey(account.pool);
    const state = inspectProviderCapacity({ runnerConfig, provider, accountId: account.id, runtimeDir })
      .providers[provider]?.accounts?.[account.id];
    if (!state || state.healthy) continue;
    const q = state.quarantine ?? {};
    const until = q.until ? `until ${q.until}` : 'with no end time (cleared by hand)';
    throw new RunnerConfigError(`${what}: account "${account.pool}/${account.id}" is quarantined ${until}${q.reasonCode ? ` (${q.reasonCode})` : ''}; pin another account, or wait`);
  }
}
