// The machine's LLM accounts, `runner.llmAccounts.<pool>.<account>` in ~/.fgos/config.json:
// each account names, per agent CLI, the directory where that CLI keeps the account's login
// (`credentialStore: { codex: "${HOME}/.codex-tetnu", pi: "..." }`), plus an optional `label` and
// `disabled`. A pool is the service provider that bills the call; it carries the family name when
// the family's own vendor serves it, and its own name otherwise (`openrouter`).
//
// `readLlmAccounts` only reports. It never throws: what is wrong is listed in `problems` for doctor and
// `fgos dispatch explain`. `deriveLegacyInventory` turns the accounts it accepts into the per-CLI
// credential source shape the lease, probe and renewal read; a pool declared here replaces the same
// pool of `runner.providers.<provider>.accounts`, which stays the source for every pool not declared.

import { normalizeProviderFamily } from './provider-adapter.mjs';
import { credentialStoreOf, expandCredentialHome, validateProviderAccountInventory } from './provider-capacity.mjs';

const ACCOUNT_KEYS = Object.freeze(['credentialStore', 'label', 'disabled']);
// Not digits only: a JS object lists such a key before every other, which would reorder the declared account order.
const ACCOUNT_ID = /^(?!\d+$)[a-zA-Z0-9][a-zA-Z0-9_.-]*$/;
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
 * Read `runner.llmAccounts` from the merged runner config. A project file holding an inventory never gets
 * here: the config door refuses it (`config-key-in-wrong-file`).
 *
 * @param {object} runnerConfig the merged runner section.
 * @returns {{pools: Record<string, {accounts: Record<string, {label: string, disabled: boolean, stores: Record<string, string>}>}>, problems: {code: string, at: string, detail: string}[]}}
 */
export function readLlmAccounts(runnerConfig) {
  const pools = {};
  const problems = [];
  const problem = (code, at, detail) => problems.push({ code, at, detail });

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
        problem('account-id', where, 'an account id is letters, digits, ".", "_" or "-", starting with a letter or digit, and not digits only (a digits-only key sorts before the others and would break the declared account order)');
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
export function compareWithLegacyInventory(runnerConfig) {
  const { pools, problems } = readLlmAccounts(runnerConfig);
  let legacy = {};
  try {
    legacy = validateProviderAccountInventory(runnerConfig, 'runner config');
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

/** Login files per CLI, from the stores the invocations declare, those of the pool's own family first. */
function declaredStoreFiles(runnerConfig, poolKey) {
  const own = new Map();
  const all = new Map();
  const add = (map, use, files) => {
    const list = map.get(use) ?? [];
    for (const file of files) if (!list.includes(file)) list.push(file);
    map.set(use, list);
  };
  for (const executor of Object.values(runnerConfig?.executors ?? {})) {
    const family = normalizeProviderFamily(executor?.providerModel ?? executor?.provider ?? '');
    for (const invocation of Array.isArray(executor?.invocations) ? executor.invocations : []) {
      const store = credentialStoreOf({ ...invocation, command: invocation.command ?? executor.command });
      if (!store?.files) continue;
      add(all, store.use, store.files);
      if (family === poolKey) add(own, store.use, store.files);
    }
  }
  return (use) => own.get(use) ?? all.get(use) ?? null;
}

/**
 * The accounts of `runner.llmAccounts` in the shape the lease reads: per state key, each account with one
 * credential source per CLI (`credentialSources`), in declared order. A `codex` store is a `codex-home`;
 * any other store is `home-files` with the files the invocations of that store declare. A store no
 * invocation declares files for cannot be copied into a private home, so that CLI is left out of the account
 * and named in `unusableFor`; the account never runs with an empty home.
 *
 * @returns {{inventory: Record<string, {accounts: Record<string, object>}>, unusable: {pool: string, account: string, cli: string, reason: string}[]}}
 */
export function deriveLegacyInventory(runnerConfig) {
  const inventory = {};
  const unusable = [];
  const { pools } = readLlmAccounts(runnerConfig);
  for (const [pool, entry] of Object.entries(pools)) {
    const stateKey = legacyStateKey(pool);
    const filesFor = declaredStoreFiles(runnerConfig, stateKey);
    const accounts = {};
    for (const [id, account] of Object.entries(entry.accounts)) {
      const credentialSources = {};
      const unusableFor = [];
      for (const [cli, home] of Object.entries(account.stores)) {
        if (cli === 'codex') {
          credentialSources[cli] = { kind: 'codex-home', home, cli };
          continue;
        }
        const files = filesFor(cli);
        if (!files) {
          const reason = `no invocation declares the login files of store "${cli}", so nothing can be copied into a private home`;
          unusableFor.push({ cli, reason });
          unusable.push({ pool, account: id, cli, reason });
          continue;
        }
        credentialSources[cli] = { kind: 'home-files', home, files: [...files], cli };
      }
      accounts[id] = { id, label: account.label, disabled: account.disabled, credentialSources, ...(unusableFor.length > 0 ? { unusableFor } : {}) };
    }
    inventory[stateKey] = { accounts };
  }
  return { inventory, unusable };
}
