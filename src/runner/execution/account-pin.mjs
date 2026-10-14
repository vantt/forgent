// src/runner/execution/account-pin.mjs -- a person may pin the provider account a seat runs on
// (`fgos run --account <id>`, or `account` in an `--override`).
//
// A pin never bypasses the lease: the dispatch still leases through provider-capacity.mjs, from an
// inventory narrowed to the one account (the narrowing `fgos dispatch probe-account` uses), so a
// quarantine, the lease record and governance all apply exactly as for an unpinned seat. A pin is
// hard: a provider limit on it ends the seat (run.mjs) instead of rotating or walking away.
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/**.

import { deriveProviderFamily } from '../dispatch/resolve.mjs';
import { normalizeProviderFamily } from '../dispatch/provider-adapter.mjs';
import { inspectProviderCapacity, providerAccountInventory } from '../dispatch/provider-capacity.mjs';
import { configPinnedToAccount } from '../dispatch/provider-account-probe.mjs';
import { RunnerConfigError } from '../dispatch/config.mjs';

/** The provider bucket the capacity lease keys an executor's accounts under. */
export function capacityProviderOf(runnerConfig, executorId) {
  const executors = runnerConfig?.executors ?? runnerConfig?.runner?.executors ?? {};
  const fallbackExecutor = runnerConfig?.executor ?? runnerConfig?.runner?.executor;
  return normalizeProviderFamily(deriveProviderFamily(executors[executorId] ?? fallbackExecutor));
}

const refuse = (reason, detail) => ({ refused: { reason, detail } });

/**
 * Whether `accountId` can be pinned on a seat bound to `executorId` with `mechanism`.
 *
 * @returns {{ provider: string, id: string } | { refused: { reason: string, detail: string } }}
 */
export function resolveAccountPin(runnerConfig, { executorId, mechanism, accountId }) {
  if (typeof accountId !== 'string' || accountId.trim() === '') {
    return refuse('account-pin-invalid', `a pinned account must be a non-empty account id, got ${JSON.stringify(accountId)}`);
  }
  const executors = runnerConfig?.executors ?? runnerConfig?.runner?.executors ?? {};
  if (mechanism !== 'out-of-process' || executors[executorId]?.kind === 'tool') {
    return refuse('account-pin-unsupported', `account "${accountId}" cannot be pinned on executor "${executorId}": only an out-of-process agent executor leases a provider account (this binding is ${executors[executorId]?.kind === 'tool' ? 'a tool' : mechanism})`);
  }
  const provider = capacityProviderOf(runnerConfig, executorId);
  const accounts = providerAccountInventory(runnerConfig)?.[provider]?.accounts ?? {};
  const known = Object.keys(accounts);
  if (known.length === 0) {
    return refuse('account-pin-no-inventory', `account "${accountId}" cannot be pinned: executor "${executorId}" (provider "${provider}") has no account list (providers.${provider}.accounts in ~/.fgos/config.json), so it leases no account`);
  }
  if (!Object.hasOwn(accounts, accountId)) {
    return refuse('account-pin-unknown', `account "${accountId}" is not in providers.${provider}.accounts of executor "${executorId}" (provider "${provider}"); its accounts are: ${known.join(', ')}`);
  }
  return { provider, id: accountId };
}

/** The runner config a binding is dispatched with: a pinned one leases from its one account only. */
export function runnerConfigForBinding(runnerConfig, bound) {
  if (!bound?.account) return runnerConfig;
  return configPinnedToAccount(runnerConfig, { provider: bound.account.provider, accountId: bound.account.id });
}

/**
 * Refuse a pinned account that is quarantined now, naming until when it waits and why. Read from
 * the same capacity state the lease reads; the lease still refuses it on its own at dispatch.
 *
 * @param {Array<{ role?: string, account?: { provider: string, id: string } }>} pins
 */
export function assertPinnedAccountsUsable(pins, { runnerConfig, runtimeDir, what }) {
  for (const { account } of pins) {
    if (!account) continue;
    const state = inspectProviderCapacity({ runnerConfig, provider: account.provider, accountId: account.id, runtimeDir })
      .providers[account.provider]?.accounts?.[account.id];
    if (!state || state.healthy) continue;
    const q = state.quarantine ?? {};
    const until = q.until ? `until ${q.until}` : 'with no end time (cleared by hand)';
    throw new RunnerConfigError(`${what}: account "${account.id}" of provider "${account.provider}" is quarantined ${until}${q.reasonCode ? ` (${q.reasonCode})` : ''}; pin another account, or wait`);
  }
}
