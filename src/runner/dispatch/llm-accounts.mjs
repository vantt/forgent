// The machine's LLM accounts, `runner.llmAccounts.<pool>.<account>` in ~/.fgos/config.json:
// each account names, per agent CLI, the directory where that CLI keeps the account's login
// (`credentialStore: { codex: "${HOME}/.codex-tetnu", pi: "..." }`), plus an optional `label` and
// `disabled`. A pool is the service provider that bills the call; it carries the family name when
// the family's own vendor serves it, and its own name otherwise (`openrouter`).
//
// This reader only reports. It never throws: what is wrong is listed in `problems` for doctor and
// `fgos dispatch explain`. The lease still reads `runner.providers.<provider>.accounts` until it
// moves to this inventory.

import { normalizeProviderFamily } from './provider-adapter.mjs';
import { expandCredentialHome } from './provider-credential-probe.mjs';
import { providerAccountInventory } from './provider-capacity.mjs';

const ACCOUNT_KEYS = Object.freeze(['credentialStore', 'label', 'disabled']);
const ACCOUNT_ID = /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/;
const CLI_KEY = /^[a-z0-9][a-z0-9_-]*$/;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** The families this config runs: every executor's `providerModel` and every `modelPolicies` key. */
function configuredFamilies(runnerConfig) {
  const families = new Set(Object.keys(runnerConfig?.modelPolicies ?? {}));
  for (const entry of Object.values(runnerConfig?.executors ?? {})) {
    if (typeof entry?.providerModel === 'string' && entry.providerModel) families.add(entry.providerModel);
  }
  return families;
}

/**
 * The family a pool name is another spelling of, or null. `codex`, `openai-codex`, `glm` and `agy`
 * are other spellings of the families `openai`, `z-ai` and `gemini`; a pool is named once, by the
 * family name, so state and leases never split one pool across two keys.
 */
function aliasOf(pool, families) {
  if (families.has(pool)) return null;
  const canonical = normalizeProviderFamily(pool);
  if (!canonical) return null;
  for (const family of families) {
    if (normalizeProviderFamily(family) === canonical) return family;
  }
  return null;
}

/**
 * Read `runner.llmAccounts` from the merged runner config.
 *
 * @param {object} runnerConfig the merged runner section.
 * @param {{projectConfig?: object}} [options] the raw project config, to report an inventory declared there.
 * @returns {{pools: Record<string, {accounts: Record<string, {label: string, disabled: boolean, stores: Record<string, string>}>}>, problems: {code: string, at: string, detail: string}[]}}
 */
export function readLlmAccounts(runnerConfig, { projectConfig } = {}) {
  const pools = {};
  const problems = [];
  const problem = (code, at, detail) => problems.push({ code, at, detail });

  if (projectConfig?.runner?.llmAccounts !== undefined) {
    problem('project-llm-accounts', 'runner.llmAccounts', 'the account inventory is machine-wide; declare it in ~/.fgos/config.json, not in the project config');
  }
  const inventory = runnerConfig?.llmAccounts;
  if (inventory === undefined) return { pools, problems };
  if (!isPlainObject(inventory)) {
    problem('llm-accounts-shape', 'runner.llmAccounts', 'must be an object mapping pool -> account -> { credentialStore }');
    return { pools, problems };
  }

  const families = configuredFamilies(runnerConfig);
  for (const [pool, accounts] of Object.entries(inventory)) {
    const at = `runner.llmAccounts.${pool}`;
    if (pool.includes('@')) {
      problem('pool-name-at', at, 'a pool name cannot contain "@", which separates model and pool in a tier cell');
      continue;
    }
    const alias = aliasOf(pool, families);
    if (alias) {
      problem('pool-name-alias', at, `"${pool}" is another spelling of the family "${alias}"; name the pool "${alias}"`);
      continue;
    }
    if (!isPlainObject(accounts)) {
      problem('llm-accounts-shape', at, 'must be an object mapping account -> { credentialStore }');
      continue;
    }
    pools[pool] = { accounts: {} };
    for (const [accountId, account] of Object.entries(accounts)) {
      const where = `${at}.${accountId}`;
      if (!ACCOUNT_ID.test(accountId)) {
        problem('account-id', where, 'an account id is letters, digits, ".", "_" or "-", starting with a letter or digit');
        continue;
      }
      if (!isPlainObject(account)) {
        problem('llm-accounts-shape', where, 'must be an object with credentialStore');
        continue;
      }
      const unknown = Object.keys(account).filter((key) => !ACCOUNT_KEYS.includes(key));
      if (unknown.length > 0) problem('account-unknown-key', where, `unknown key(s) ${unknown.join(', ')}; allowed: ${ACCOUNT_KEYS.join(', ')}`);
      const stores = {};
      const declared = isPlainObject(account.credentialStore) ? account.credentialStore : {};
      if (account.credentialStore !== undefined && !isPlainObject(account.credentialStore)) {
        problem('llm-accounts-shape', `${where}.credentialStore`, 'must be an object mapping a CLI name to its login directory');
      }
      for (const [cli, store] of Object.entries(declared)) {
        if (!CLI_KEY.test(cli)) {
          problem('store-cli', `${where}.credentialStore.${cli}`, 'a CLI name is lower-case letters, digits, "-" or "_"');
          continue;
        }
        if (typeof store !== 'string' || !store.trim()) {
          problem('store-path', `${where}.credentialStore.${cli}`, 'must be a directory path');
          continue;
        }
        const expanded = expandCredentialHome(store);
        if (!expanded) {
          problem('store-path', `${where}.credentialStore.${cli}`, 'must be absolute, or start with ~ or ${HOME}');
          continue;
        }
        stores[cli] = expanded;
      }
      if (Object.keys(stores).length === 0) {
        problem('account-no-store', where, 'names no credentialStore, so no CLI can run on it');
        continue;
      }
      if (account.label !== undefined && (typeof account.label !== 'string' || !account.label.trim())) {
        problem('account-label', `${where}.label`, 'must be a non-empty string when present');
      }
      if (account.disabled !== undefined && typeof account.disabled !== 'boolean') {
        problem('account-disabled', `${where}.disabled`, 'must be true or false when present');
      }
      pools[pool].accounts[accountId] = {
        label: typeof account.label === 'string' && account.label.trim() ? account.label : accountId,
        disabled: account.disabled === true,
        stores,
      };
    }
  }
  return { pools, problems };
}

/**
 * The key the lease's state uses for a pool while it still reads the old inventory: the old
 * inventory keyed providers by their normalized family (`openai` became `openai-codex`).
 */
export function legacyStateKey(pool) {
  return normalizeProviderFamily(pool) || pool;
}

function legacyStores(account) {
  const stores = {};
  if (account.credentialSources) {
    for (const [cli, source] of Object.entries(account.credentialSources)) stores[cli] = expandCredentialHome(source.home);
  } else if (account.credentialSource) {
    stores['*'] = expandCredentialHome(account.credentialSource.home);
  }
  return stores;
}

/**
 * Accounts the old inventory (`runner.providers.<provider>.accounts`) and `runner.llmAccounts`
 * disagree on. The old inventory keys accounts by normalized provider family, the new one by pool,
 * matched here through `legacyStateKey`. An old account with one store for every CLI matches a new
 * one when every new store is that directory.
 *
 * @returns {{onlyLegacy: {pool: string, account: string}[], onlyNew: {pool: string, account: string}[], storeMismatch: {pool: string, account: string, legacy: object, current: object}[], problems: object[]}}
 */
export function compareWithLegacyInventory(runnerConfig, options = {}) {
  const { pools, problems } = readLlmAccounts(runnerConfig, options);
  let legacy = {};
  try {
    legacy = providerAccountInventory(runnerConfig);
  } catch (err) {
    problems.push({ code: 'legacy-inventory-invalid', at: 'runner.providers', detail: err.message });
  }
  const newByKey = new Map();
  for (const [pool, entry] of Object.entries(pools)) {
    for (const [account, value] of Object.entries(entry.accounts)) newByKey.set(`${legacyStateKey(pool)}\u0000${account}`, { pool, account, value });
  }
  const onlyLegacy = [];
  const storeMismatch = [];
  const seen = new Set();
  for (const [provider, entry] of Object.entries(legacy)) {
    for (const [account, value] of Object.entries(entry.accounts ?? {})) {
      const key = `${provider}\u0000${account}`;
      const current = newByKey.get(key);
      if (!current) {
        onlyLegacy.push({ pool: provider, account });
        continue;
      }
      seen.add(key);
      const old = legacyStores(value);
      const now = current.value.stores;
      const same = old['*'] !== undefined
        ? Object.values(now).every((dir) => dir === old['*'])
        : Object.keys(old).length === Object.keys(now).length && Object.entries(old).every(([cli, dir]) => now[cli] === dir);
      if (!same) storeMismatch.push({ pool: current.pool, account, legacy: old, current: now });
    }
  }
  const onlyNew = [...newByKey.entries()].filter(([key]) => !seen.has(key)).map(([, v]) => ({ pool: v.pool, account: v.account }));
  return { onlyLegacy, onlyNew, storeMismatch, problems };
}
