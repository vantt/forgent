// Provider Capacity Rotator slice 1: account inventory, selector state,
// leases, classifier, and credential facts. This module deliberately stays
// inside an already-resolved provider; it never chooses provider/model/executor.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { replaceDurably } from '../../native/door.mjs';
import { globalFgosDir, readMachineAccounts } from '../../config/facade.mjs';
import { deriveLegacyInventory, legacyStateKey } from './llm-accounts.mjs';
import { resolveHolderLiveness, selfRecord } from '../../native/process-identity.mjs';
import { acquire, acquireSync, createLockScope, lockHolders, resolveLock, resolveLockRoot, runBorrowed } from '../../holder-lock/index.mjs';
import { appendFaultRecord } from '../../util/capped-jsonl-log.mjs';

export const PROVIDER_CAPACITY_STATE_CONTRACT = 'provider-capacity-state.v1';
export const PROVIDER_CAPACITY_SELECTION_CONTRACT = 'provider-capacity-selection.v1';
export const PROVIDER_CAPACITY_AUDIT_CONTRACT = 'provider-capacity-audit.v1';

const FORBIDDEN_ACCOUNT_KEYS = Object.freeze([
  'executor', 'executors', 'capability', 'capabilities', 'model', 'models',
  'modelTier', 'mutation', 'confinement', 'tool', 'tools', 'fallback',
  'providerFallback', 'runtime', 'runtimeClass', 'providerRuntime',
  'providerRuntimes',
]);

const PROVIDER_ENTRY_KEYS = Object.freeze(['accounts']);
const ACCOUNT_ENTRY_KEYS = Object.freeze(['label', 'credentialSource', 'credentialSources']);
const CREDENTIAL_SOURCE_KEYS = Object.freeze(['kind', 'home', 'files']);
const CREDENTIAL_SOURCE_KINDS = Object.freeze(['codex-home', 'home-files']);

export class ProviderCapacityConfigError extends Error {
  constructor(message, { code } = {}) {
    super(message);
    this.name = 'ProviderCapacityConfigError';
    this.category = 'validation';
    if (code) this.code = code;
  }
}

export function defaultProviderCapacityRuntimeDir() {
  return path.join(globalFgosDir(), 'runtime', 'provider-capacity');
}

export function providerCapacityStatePaths(runtimeDir = defaultProviderCapacityRuntimeDir()) {
  return {
    runtimeDir,
    statePath: path.join(runtimeDir, 'state.json'),
    // Every account's history (faults, clears, state resets): a log beside the state, never a field of it (L1).
    auditPath: path.join(runtimeDir, 'audit.jsonl'),
  };
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function validateProviderAccountInventory(runnerConfig, sourceLabel = 'runner config') {
  const runnerSection = isPlainObject(runnerConfig?.runner) ? runnerConfig.runner : runnerConfig;
  const providers = runnerSection?.providers;
  if (providers === undefined) return {};
  if (!isPlainObject(providers)) {
    throw new ProviderCapacityConfigError(`runner config (${sourceLabel}.providers) must be an object mapping provider -> { accounts } when present.`);
  }
  // M6: keyed by the NORMALIZED provider family ('openai' and 'openai-codex'
  // are the same bucket) -- a config declaring accounts under both spellings
  // is refused with a named collision rather than silently splitting one
  // provider's accounts across two never-jointly-visible inventory keys
  // (the fault classifier and lease/quarantine lookups only ever see one).
  const rawToNormalized = {};
  const normalized = {};
  for (const [provider, providerEntry] of Object.entries(providers)) {
    if (!provider || typeof provider !== 'string') {
      throw new ProviderCapacityConfigError(`runner config (${sourceLabel}.providers) provider id must be a non-empty string.`);
    }
    const canonicalProvider = legacyStateKey(provider);
    if (normalized[canonicalProvider] !== undefined) {
      throw new ProviderCapacityConfigError(
        `runner config (${sourceLabel}.providers) declares both "${rawToNormalized[canonicalProvider]}" and "${provider}", which normalize to the same provider family "${canonicalProvider}" -- consolidate their accounts under one key.`,
      );
    }
    rawToNormalized[canonicalProvider] = provider;
    if (!isPlainObject(providerEntry)) {
      throw new ProviderCapacityConfigError(`runner config (${sourceLabel}.providers.${provider}) must be an object.`);
    }
    for (const key of Object.keys(providerEntry)) {
      if (!PROVIDER_ENTRY_KEYS.includes(key)) {
        throw new ProviderCapacityConfigError(
          `runner config (${sourceLabel}.providers.${provider}) contains unknown key "${key}". Slice 1 only allows: ${PROVIDER_ENTRY_KEYS.join(', ')}.`,
        );
      }
    }
    const accounts = providerEntry.accounts;
    if (accounts === undefined) continue;
    if (!isPlainObject(accounts)) {
      throw new ProviderCapacityConfigError(`runner config (${sourceLabel}.providers.${provider}.accounts) must be a keyed object, not an array.`);
    }
    normalized[canonicalProvider] = { accounts: {} };
    for (const [accountId, account] of Object.entries(accounts)) {
      validateAccountId(accountId, `${sourceLabel}.providers.${provider}.accounts`);
      if (!isPlainObject(account)) {
        throw new ProviderCapacityConfigError(`runner config (${sourceLabel}.providers.${provider}.accounts.${accountId}) must be an object.`);
      }
      for (const key of Object.keys(account)) {
        if (FORBIDDEN_ACCOUNT_KEYS.includes(key)) {
          throw new ProviderCapacityConfigError(
            `runner config (${sourceLabel}.providers.${provider}.accounts.${accountId}) must not declare "${key}"; accounts may only describe credentials/capacity, not placement policy.`,
          );
        }
        if (!ACCOUNT_ENTRY_KEYS.includes(key)) {
          throw new ProviderCapacityConfigError(
            `runner config (${sourceLabel}.providers.${provider}.accounts.${accountId}) contains unknown key "${key}". Allowed keys: ${ACCOUNT_ENTRY_KEYS.join(', ')}.`,
          );
        }
      }
      if (account.label !== undefined && (typeof account.label !== 'string' || !account.label.trim())) {
        throw new ProviderCapacityConfigError(`runner config (${sourceLabel}.providers.${provider}.accounts.${accountId}.label) must be a non-empty string when present.`);
      }
      const where = `${sourceLabel}.providers.${provider}.accounts.${accountId}`;
      const hasSingle = account.credentialSource !== undefined;
      const hasPerCli = account.credentialSources !== undefined;
      if (hasSingle === hasPerCli) {
        throw new ProviderCapacityConfigError(
          `runner config (${where}) must declare exactly one of "credentialSource" (one login store for every CLI) or "credentialSources" (one login store per CLI, keyed by the CLI command name).`,
        );
      }
      const entry = { id: accountId, label: account.label ?? accountId };
      if (hasSingle) {
        entry.credentialSource = normalizeCredentialSource(account.credentialSource, `${where}.credentialSource`);
      } else {
        if (!isPlainObject(account.credentialSources) || Object.keys(account.credentialSources).length === 0) {
          throw new ProviderCapacityConfigError(`runner config (${where}.credentialSources) must be a non-empty object mapping a CLI command name (codex, pi, omp, agy, ...) to a credential source.`);
        }
        entry.credentialSources = {};
        for (const [cli, source] of Object.entries(account.credentialSources)) {
          if (!CLI_KEY.test(cli)) {
            throw new ProviderCapacityConfigError(`runner config (${where}.credentialSources) key ${JSON.stringify(cli)} must be a CLI command name (lower-case letters, digits, "-" or "_").`);
          }
          entry.credentialSources[cli] = { ...normalizeCredentialSource(source, `${where}.credentialSources.${cli}`), cli };
        }
      }
      normalized[canonicalProvider].accounts[accountId] = entry;
    }
  }
  return Object.freeze(normalized);
}

function validateAccountId(accountId, label) {
  if (typeof accountId !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(accountId)) {
    throw new ProviderCapacityConfigError(`runner config (${label}) account id must be a non-empty safe key, got ${JSON.stringify(accountId)}.`);
  }
  // The account order is the key order of the object, and a JS object lists a digits-only key before every other.
  if (/^\d+$/.test(accountId)) {
    throw new ProviderCapacityConfigError(`runner config (${label}) account id ${JSON.stringify(accountId)} is digits only; such a key sorts before the others and would break the declared account order. Add a letter.`);
  }
}

const CLI_KEY = /^[a-z0-9][a-z0-9_-]*$/;
const ENV_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const CREDENTIAL_STORE_KEYS = Object.freeze(['use', 'homeEnv', 'files', 'sessionDir']);

function normalizeCredentialSource(credentialSource, label) {
  if (!isPlainObject(credentialSource)) {
    throw new ProviderCapacityConfigError(`runner config (${label}) must be an object.`);
  }
  for (const key of Object.keys(credentialSource)) {
    if (!CREDENTIAL_SOURCE_KEYS.includes(key)) {
      throw new ProviderCapacityConfigError(
        `runner config (${label}) contains unknown key "${key}". Allowed keys: ${CREDENTIAL_SOURCE_KEYS.join(', ')}.`,
      );
    }
  }
  if (!CREDENTIAL_SOURCE_KINDS.includes(credentialSource.kind)) {
    throw new ProviderCapacityConfigError(`runner config (${label}.kind) must be one of ${CREDENTIAL_SOURCE_KINDS.join(', ')}.`);
  }
  if (typeof credentialSource.home !== 'string' || !credentialSource.home.trim()) {
    throw new ProviderCapacityConfigError(`runner config (${label}.home) must be a non-empty string.`);
  }
  if (credentialSource.kind === 'home-files') {
    const files = credentialSource.files;
    if (!Array.isArray(files) || files.length === 0 || files.some((f) => typeof f !== 'string' || !f.trim() || path.isAbsolute(f) || f.split(/[\\/]/).includes('..'))) {
      throw new ProviderCapacityConfigError(`runner config (${label}.files) must be a non-empty list of relative paths without "..".`);
    }
  } else if (credentialSource.files !== undefined) {
    throw new ProviderCapacityConfigError(`runner config (${label}.files) is only valid for kind "home-files".`);
  }
  return {
    kind: credentialSource.kind,
    home: credentialSource.home,
    ...(credentialSource.kind === 'home-files' ? { files: [...credentialSource.files] } : {}),
  };
}

/** The CLI an invocation runs: the basename of its command, lower-cased; null when there is none. */
export function commandCli(command) {
  const name = path.basename(String(command ?? '')).toLowerCase();
  return name || null;
}

/**
 * The login store of `account` (an inventory entry, or a capacity selection that carries one) that the
 * CLI `cli` reads. An account with one `credentialSource` gives it to every CLI; an account with
 * `credentialSources` gives the CLI's own entry, or null when it declares none for that CLI. A per-CLI entry
 * carries its key as `cli`, which also names where its renewal copies are kept.
 */
export function credentialSourceForCli(account, cli) {
  if (!account) return null;
  if (account.credentialSources) return (cli && account.credentialSources[cli]) || null;
  return account.credentialSource ?? null;
}

/** Every login store an account declares, the single one or each per-CLI one. */
export function accountCredentialSources(account) {
  if (!account) return [];
  if (account.credentialSources) return Object.values(account.credentialSources);
  return account.credentialSource ? [account.credentialSource] : [];
}

/**
 * An account's credential home as an absolute path: a leading `~`, `${HOME}` or `$HOME` is the user's home
 * directory. Null when the value is empty, not a string, or not absolute once expanded.
 */
export function expandCredentialHome(home) {
  if (typeof home !== 'string' || !home.trim()) return null;
  const expanded = home
    .replace(/^\$\{HOME\}(?=\/|$)/, os.homedir())
    .replace(/^\$HOME(?=\/|$)/, os.homedir())
    .replace(/^~(?=\/|$)/, os.homedir());
  return path.isAbsolute(expanded) ? expanded : null;
}

/**
 * Why `store` is not a valid `credentialStore` declaration, or null when it is. One reading of the shape for
 * the config door and the confinement request door.
 */
export function credentialStoreProblem(store) {
  if (!isPlainObject(store)) return 'must be an object {use, homeEnv, files?, sessionDir?}';
  for (const key of Object.keys(store)) {
    if (!CREDENTIAL_STORE_KEYS.includes(key)) return `contains unknown key "${key}" (allowed: ${CREDENTIAL_STORE_KEYS.join(', ')})`;
  }
  if (typeof store.use !== 'string' || !CLI_KEY.test(store.use)) return '"use" must name a login store, a lowercase key such as "codex" or "pi"';
  if (typeof store.homeEnv !== 'string' || !ENV_NAME.test(store.homeEnv)) return '"homeEnv" must be an environment variable name';
  if (store.files !== undefined) {
    const files = store.files;
    if (!Array.isArray(files) || files.length === 0
      || files.some((f) => typeof f !== 'string' || !f.trim() || path.isAbsolute(f) || f.split(/[\\/]/).includes('..'))) {
      return '"files" must be a non-empty list of relative paths without ".."';
    }
    if (new Set(files).size !== files.length) return '"files" must not repeat a path';
  }
  if (store.sessionDir !== undefined
    && (typeof store.sessionDir !== 'string' || !store.sessionDir.trim() || path.isAbsolute(store.sessionDir) || store.sessionDir.split(/[\\/]/).includes('..'))) {
    return '"sessionDir" must be a relative path without ".."';
  }
  return null;
}

/**
 * The login store an invocation reads: the `credentialStore` it declares, else (config written before
 * that field existed: the machine-global config and other projects still carry it) the one its
 * `private-home` env binding implies, keyed by the CLI its command runs. Null when it reads none. The
 * inference is the only reader of `resourceBindings`; it goes when those configs have moved.
 */
export function credentialStoreOf(invocation) {
  if (!invocation) return null;
  if (invocation.credentialStore) return invocation.credentialStore;
  const binding = (invocation.resourceBindings ?? []).find((b) => b?.resource === 'private-home' && b.target?.kind === 'env' && b.target.name);
  const use = commandCli(invocation.command);
  return binding && use ? { use, homeEnv: binding.target.name } : null;
}

/**
 * A capacity selection made ready for the invocation that is actually launched: the store the invocation
 * reads (`credentialStoreOf`) picks the account's login store as `credentialSource` (null when the
 * account declares none for it, which the private-home provisioning refuses). An invocation that reads no
 * store gets none, so a lease never puts a login into a home that did not ask for one.
 */
export function providerCapacityForInvocation(selection, invocation) {
  if (!selection) return selection;
  const store = credentialStoreOf(invocation);
  if (!store) return { ...selection, credentialCli: null, credentialSource: null };
  return { ...selection, credentialCli: store.use, credentialSource: credentialSourceForCli(selection, store.use) };
}

/**
 * The accounts the lease, probe, pin and renewal read, per state key. A pool declared in
 * `runner.llmAccounts` supplies its own accounts; a pool it does not declare keeps reading
 * `runner.providers.<provider>.accounts`. That second read is the transition read: it goes, with the
 * `runner.providers` key, once every fgOS release on the machine reads `runner.llmAccounts`.
 */
export function providerAccountInventory(runnerConfig) {
  const legacy = validateProviderAccountInventory(runnerConfig, 'runner config');
  const section = isPlainObject(runnerConfig?.runner) ? runnerConfig.runner : runnerConfig;
  if (section?.llmAccounts === undefined) return legacy;
  return Object.freeze({ ...legacy, ...deriveLegacyInventory(section).inventory });
}

export function hasProviderAccounts(runnerConfig, provider) {
  return Object.keys(providerAccountInventory(runnerConfig)?.[provider]?.accounts ?? {}).length > 0;
}

// `audit` holds the records this change adds to the audit log; `writeState` appends them and never writes
// the field, so a fault history left in state.json by an older release moves to the log on the next write.
function emptyState() {
  return {
    contract: PROVIDER_CAPACITY_STATE_CONTRACT,
    providers: {},
    assignments: {},
    audit: [],
  };
}

// H3: a corrupt state.json (a torn write from a crash before this phase's
// atomic writeState below existed, or external tampering) used to throw
// JSON.parse's raw SyntaxError straight out of every reader -- every
// lease/release/quarantine/inspect call for every provider/account on the
// whole host, not just the affected one. Renamed aside (never deleted, so
// the raw evidence survives for a human to look at) with an audit entry
// recorded in the FRESH state describing the corruption, and callers get a
// genuinely empty, working state back -- open leases/quarantines are lost
// (accepted; the risk/rollback note calls this out explicitly), but every
// account still re-derives cleanly from the config inventory on the next
// call, rather than every provider-capacity operation on the host staying
// broken until an operator manually intervenes.
function readState(statePath) {
  if (!fs.existsSync(statePath)) return emptyState();
  const raw = fs.readFileSync(statePath, 'utf8');
  if (!raw.trim()) return emptyState();
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    const corruptPath = `${statePath}.corrupt-${Date.now()}`;
    try { fs.renameSync(statePath, corruptPath); } catch {}
    const fresh = emptyState();
    fresh.audit.push({
      contract: PROVIDER_CAPACITY_AUDIT_CONTRACT,
      action: 'state-reset',
      status: 'corrupt-state-reset',
      resetAt: new Date().toISOString(),
      reason: err.message,
      corruptStateRenamedTo: corruptPath,
    });
    return fresh;
  }
  if (!isPlainObject(parsed)) {
    const fresh = emptyState();
    fresh.audit.push({
      contract: PROVIDER_CAPACITY_AUDIT_CONTRACT,
      action: 'state-reset',
      status: 'corrupt-state-reset',
      resetAt: new Date().toISOString(),
      reason: 'state.json parsed but is not an object',
    });
    return fresh;
  }
  return {
    ...emptyState(),
    ...parsed,
    providers: isPlainObject(parsed.providers) ? parsed.providers : {},
    assignments: isPlainObject(parsed.assignments) ? parsed.assignments : {},
    audit: Array.isArray(parsed.audit) ? parsed.audit : [],
  };
}

/**
 * Writes the state under the state lock (every caller holds it). The audit records go to the log first.
 * The log is evidence, not state: a record it refuses (a full disk) is dropped with one warning, and the
 * state is written either way, so the audit never blocks a lease. A crash between the append and the state
 * write moves an old state.json history again on the next write: a duplicate line, never a lost one.
 */
function writeState(statePath, state) {
  const dir = path.dirname(statePath);
  fs.mkdirSync(dir, { recursive: true });
  const { audit = [], ...rest } = state;
  try {
    for (const record of audit) appendFaultRecord(providerCapacityStatePaths(dir).auditPath, record);
  } catch (err) {
    process.stderr.write(`fgos: warning: provider-capacity audit log not written (${err.message}); its unwritten records are dropped\n`);
  }
  state.audit = [];
  replaceDurably(dir, path.basename(statePath), `${JSON.stringify(rest, null, 2)}\n`, 0o644);
}

export class ProviderCapacityLockError extends Error {
  constructor(message, { lockPath, holderPid } = {}) {
    super(message);
    this.name = 'ProviderCapacityLockError';
    this.code = 'provider-capacity-lock-stale';
    this.lockPath = lockPath;
    this.holderPid = holderPid ?? null;
  }
}

// The state lock and the account locks are kernel locks (src/holder-lock):
// machine-scoped mutexes under the state root's `locks/` directory, so every
// process of this machine -- a sandboxed worker with its own HOME included,
// since dispatch pins FGOS_STATE_ROOT into it -- contends for the same lock.
// A holder that dies releases at once; there is no record to read back, no
// dead-holder reclaim and nothing that grows per acquisition.
function lockParams(extra = {}) {
  return { lockRoot: resolveLockRoot(), ...extra };
}

function firstHolderPid(name, params) {
  const holders = lockHolders(name, params);
  return holders.kind === 'list' && holders.holders.length > 0 ? holders.holders[0].pid : null;
}

// The lock's own answers that mean "not yours yet" become the caller-facing ProviderCapacityLockError:
// a wait that ran out, and a previous holder whose children are still dying after the kill wait.
function lockBusyError(name, params, message) {
  const lockPath = resolveLock(name, params).v3Path;
  const holderPid = firstHolderPid(name, params);
  return new ProviderCapacityLockError(`${message.replace('%s', lockPath)}${holderPid ? ` (pid ${holderPid})` : ''}.`, { lockPath, holderPid });
}

function isPredecessorNotEmpty(err) {
  return err?.code === 'lock-predecessor-domain-not-empty';
}

// The wait is thirty seconds because the holder flushes to disk (fsync) inside the critical section:
// on a busy disk a live holder can take well over the old five seconds, and giving up then fails a
// caller for no wrong done. A holder that has died releases at once, so a longer wait only costs time
// when a live holder is really slow.
export function withProviderStateLock(fn, { waitMs = 30_000 } = {}) {
  const params = lockParams();
  const busy = () => lockBusyError('provider-state', params, `provider-capacity lock at "%s" is still held by a live process after waiting ${waitMs}ms`);
  let res;
  try {
    res = acquireSync(createLockScope('provider-state'), 'provider-state', params, { waitMs });
  } catch (err) {
    if (isPredecessorNotEmpty(err)) throw busy();
    throw err;
  }
  if (res.result !== 'acquired') throw busy();
  try {
    return fn();
  } finally {
    res.handle.release();
  }
}

// The account lock: one per provider account, separate from the state lock above, so a renewal call that
// takes minutes never holds up leasing or quarantine. Everything about one account that must not be
// touched by two processes at once lives under its directory: the copies of a login renewed somewhere
// else and waiting to be applied, a scratch home while a renewal runs, the failure cooldown.
function accountKeyIsSafe(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(value);
}

/** The directory that holds everything about one account's login; null for an unsafe provider or account id. */
export function providerAccountDir(runtimeDir = defaultProviderCapacityRuntimeDir(), provider, accountId) {
  if (!accountKeyIsSafe(provider) || !accountKeyIsSafe(accountId)) return null;
  return path.join(runtimeDir, 'account-locks', provider, accountId);
}

/**
 * Where the copies of one login store wait (`pending/`, scratch homes, the failure cooldown): the account
 * directory for an account with one store; `stores/<cli>` under it for a store of an account that keeps one
 * per CLI, so a copy of the pi store is never applied to the Codex store. The account lock stays one per
 * account. Null for an unsafe id or CLI key.
 */
export function credentialStoreDir(runtimeDir, provider, accountId, cli = null) {
  const accountDir = providerAccountDir(runtimeDir, provider, accountId);
  if (!accountDir || cli === null || cli === undefined) return accountDir;
  if (!accountKeyIsSafe(cli)) return null;
  return path.join(accountDir, 'stores', cli);
}

function accountLockTarget(runtimeDir, provider, accountId) {
  const dir = providerAccountDir(runtimeDir, provider, accountId);
  if (dir === null) throw new ProviderCapacityConfigError(`provider-capacity account lock refused: unsafe provider/account ${JSON.stringify(provider)}/${JSON.stringify(accountId)}`);
  // Made before the lock is taken: a failure here must never leave a held lock behind.
  fs.mkdirSync(dir, { recursive: true });
  return { dir, params: lockParams({ provider, account: accountId }) };
}

function accountLockHandle(dir, kernelHandle) {
  return {
    dir,
    /**
     * Start a child that holds the account lock with this holder (`spawn`'s signature and ChildProcess).
     * Its `borrowed` promise settles once the child exited and nothing it left behind still holds the lock.
     * While the child lives the lock stays held, even after this holder has died.
     */
    spawnHolding(command, args, options = {}) {
      return runBorrowed(kernelHandle, { command, args, cwd: options.cwd, env: options.env, stdin: options.stdio?.[0], detached: options.detached }, { sync: false });
    },
    release() {
      kernelHandle.release();
    },
  };
}

/**
 * Take the account lock without waiting. Returns a handle `{dir, spawnHolding, release}`, or null when a
 * live holder (or a child it lent the lock to) has it. For callers that must not wait (a removal that
 * has to finish).
 */
export function tryAcquireAccountLock({ runtimeDir, provider, accountId } = {}) {
  const { dir, params } = accountLockTarget(runtimeDir, provider, accountId);
  let res;
  try {
    res = acquireSync(createLockScope('provider-account'), 'provider-account', params);
  } catch (err) {
    // The last holder's children are still dying: as busy as a live holder.
    if (isPredecessorNotEmpty(err)) return null;
    throw err;
  }
  return res.result === 'acquired' ? accountLockHandle(dir, res.handle) : null;
}

/**
 * Take the account lock, waiting with timers (never blocking the event loop: panel seats run in one
 * process and may share an account). Throws ProviderCapacityLockError when a live holder keeps it past `waitMs`.
 */
export async function acquireAccountLock({ runtimeDir, provider, accountId, waitMs = 30_000 } = {}) {
  const { dir, params } = accountLockTarget(runtimeDir, provider, accountId);
  const busy = () => lockBusyError('provider-account', params, 'provider-capacity account lock at "%s" is still held by a live process after waiting');
  let res;
  try {
    res = await acquire(createLockScope('provider-account'), 'provider-account', params, { waitMs });
  } catch (err) {
    if (isPredecessorNotEmpty(err)) throw busy();
    throw err;
  }
  if (res.result === 'acquired') return accountLockHandle(dir, res.handle);
  throw busy();
}

function accountState(providerState, accountId) {
  providerState.accounts ??= {};
  providerState.accounts[accountId] ??= {};
  providerState.accounts[accountId].leases ??= {};
  return providerState.accounts[accountId];
}

function isQuarantined(accountStateValue, now = Date.now()) {
  const quarantine = accountStateValue?.quarantine;
  if (!quarantine) return false;
  if (quarantine.kind === 'manual-clear') return true;
  // Pre-Phase-05 gate H1 (plans/260915-executor-policy-dispatch-seams/plan.md):
  // a temporary quarantine with no `until` must not be treated as healthy/
  // selectable -- it must fail closed the same way manual-clear does, not
  // silently expire on the spot. Every writer below now always supplies a
  // conservative `until` for a temporary quarantine, but this read-time
  // check stays defensive: a quarantine record with a missing/unparseable
  // `until` can never be misread as "already expired".
  if (!quarantine.until) return true;
  const untilMs = Date.parse(quarantine.until);
  if (Number.isNaN(untilMs)) return true;
  return untilMs > now;
}

// S1 (dispatch-engine-liveness-hardening Phase 2): `lease.pid` is the
// RUNNER's own pid (the process that called acquireNamedAccountLease),
// never the detached supervisor/worker that actually holds and uses the
// credential -- the runner can die while its detached child keeps working,
// same root cause as admitRunAttempt's own in-flight gap. A dead runner
// pid alone must NOT prove the lease reclaimable when the caller can show
// (`isRunWorkerAlive`) that Run's real worker is still alive; `runIsDead`
// keeps its existing, opposite-polarity job of proving death through OTHER
// evidence even when the pid check alone is inconclusive (e.g. an alive
// pid that was actually reused by an unrelated process) -- both default to
// values that reproduce the exact pre-fix behavior when a caller supplies
// neither.
//
// S3/C2 (dispatch-engine-liveness-hardening Phase 4): `pidDead` now routes
// through Phase 1's consolidated judge instead of a bare `pidExists` call,
// so a lease's recorded pid being reused by an unrelated process (the
// "pid-only, no start time" gap the audit's own C2 table names for this
// lock) is correctly judged dead rather than mistaken for the original
// holder. `lease.processStartTime` is optional and missing on any lease
// written before this fix -- resolveHolderLiveness's own documented
// fallback (alive pid, no recorded start time -> 'held') reproduces the
// exact pre-fix behavior for those legacy records.
function reclaimDeadLeases(providerState, { runIsDead = () => false, isRunWorkerAlive = () => false, nowIso = new Date().toISOString() } = {}) {
  for (const [accountId, acct] of Object.entries(providerState.accounts ?? {})) {
    for (const [runId, lease] of Object.entries(acct.leases ?? {})) {
      const pidDead = lease.pid !== undefined
        && resolveHolderLiveness(lease.record ?? { pid: lease.pid, processStartTime: lease.processStartTime }) === 'dead';
      const provenDead = (pidDead && !isRunWorkerAlive(runId, lease)) || runIsDead(runId, lease);
      if (provenDead) {
        delete acct.leases[runId];
        acct.lastReclaimedAt = nowIso;
      }
    }
  }
}

/** The account inventory sections of a runner config: machine config read live, never kept in a unit record. */
export function accountInventoryConfigOf(runnerConfig) {
  const out = {};
  for (const key of ['llmAccounts', 'providers']) if (runnerConfig?.[key] !== undefined) out[key] = runnerConfig[key];
  return out;
}

/** Why a lease was refused because the account Seat Binding named was not takeable any more. */
export const LEASE_CONFLICT_REASON = 'provider-capacity.lease-conflict';

/**
 * What the account facts of one provider's pool are, read without the state lock: whether this assignment
 * already holds an account (sticky), until when an account is quarantined, and whether a quarantine is one a
 * real call may lift (a dead login whose probe cooldown has passed). The caller turns it into the
 * `accountView` Seat Binding ranks from; ranking is not done here.
 *
 * @returns {Record<string, {sticky: boolean, quarantinedUntil: number|null, probeable: boolean, probeFailed: boolean}>}
 */
export function readAccountStates({ provider, assignmentId, runtimeDir, now = Date.now(), cooldownMs = DEFAULT_QUARANTINE_PROBE_COOLDOWN_MS } = {}) {
  const { statePath } = providerCapacityStatePaths(runtimeDir);
  const state = readState(statePath);
  const stickyId = assignmentId ? state.assignments?.[`${provider}:${assignmentId}`]?.accountId : null;
  const out = {};
  for (const [accountId, acct] of Object.entries(state.providers?.[provider]?.accounts ?? {})) {
    const quarantine = acct?.quarantine;
    const until = Date.parse(quarantine?.until ?? '');
    const never = !quarantine?.until || Number.isNaN(until);
    const lastProbe = Date.parse(quarantine?.probe?.attemptedAt ?? '');
    out[accountId] = {
      sticky: stickyId === accountId,
      quarantinedUntil: !quarantine ? null : (quarantine.kind === 'manual-clear' || never ? Number.MAX_SAFE_INTEGER : until),
      // A real call may lift a dead login (after its cooldown) or a quota lock whose end fgOS guessed.
      probeable: (quarantine?.kind === 'manual-clear' && quarantine.reasonCode === 'auth-token' && !(Number.isFinite(lastProbe) && now - lastProbe < cooldownMs))
        || (quarantine?.reasonCode === 'quota-limit' && quarantine.resetKnown === false && !never && until > now),
      probeFailed: quarantine?.probe?.status === 'failed',
    };
  }
  // The account an assignment holds is sticky even when the lease state has nothing else to say about it.
  if (stickyId && !out[stickyId]) out[stickyId] = { sticky: true, quarantinedUntil: null, probeable: false, probeFailed: false };
  return out;
}

/**
 * Lease exactly the account Seat Binding named. The ranking was done before the lock; under the lock this
 * only re-checks that the account can still be taken (enabled, holding a login store for `cli`, not
 * quarantined) and writes the lease. An account that cannot is a `lease-conflict` the runner answers with a
 * fresh bind; it is never replaced by another account here. Returns null when the provider is not managed
 * (no account list), and a receipt in the selection when the lease is written.
 */
export function acquireNamedAccountLease({
  runnerConfig, provider, accountId, assignmentId, runId, runtimeDir, runIsDead, isRunWorkerAlive,
  // The CLI the launch runs: only an account that declares a login store for it can be leased.
  cli = null,
  // Digest of the account view Seat Binding ranked from, kept in the receipt.
  accountViewDigest = null,
  now = new Date(),
  lockWaitMs,
} = {}) {
  if (!provider || !runId) return null;
  // A confined worker has no accounts layer, so "no accounts" would read as "provider not managed": refuse by name instead.
  if (readMachineAccounts().state === 'unavailable-confined') {
    throw new ProviderCapacityConfigError(
      'config-accounts-unavailable-confined: a confined session cannot lease an account; the runner, which runs outside the sandbox, leases one and hands the worker its credential',
      { code: 'config-accounts-unavailable-confined' },
    );
  }
  const accounts = providerAccountInventory(runnerConfig)[provider]?.accounts ?? {};
  if (Object.keys(accounts).length === 0) return null;
  const conflict = (detail) => ({ status: 'refused', provider, accountId: accountId ?? null, reason: LEASE_CONFLICT_REASON, detail, ...(cli ? { cli } : {}) });
  const account = accountId ? accounts[accountId] : null;
  if (!account) return conflict(`account "${provider}/${accountId}" is not in the inventory`);
  if (account.disabled === true) return conflict(`account "${provider}/${accountId}" is disabled`);
  if (cli && !credentialSourceForCli(account, cli)) return conflict(`account "${provider}/${accountId}" holds no "${cli}" login store`);
  const { statePath } = providerCapacityStatePaths(runtimeDir);
  return withProviderStateLock(() => {
    const state = readState(statePath);
    state.providers[provider] ??= { accounts: {} };
    const providerState = state.providers[provider];
    reclaimDeadLeases(providerState, { runIsDead, isRunWorkerAlive, nowIso: now.toISOString() });
    const acct = accountState(providerState, accountId);
    if (isQuarantined(acct, now.getTime())) return conflict(`account "${provider}/${accountId}" is quarantined`);
    const acquiredAt = now.toISOString();
    acct.lastSelectedAt = acquiredAt;
    const self = selfRecord();
    acct.leases[runId] = {
      runId,
      assignmentId: assignmentId ?? null,
      pid: process.pid,
      processStartTime: self.startTime,
      record: self,
      acquiredAt,
    };
    if (assignmentId) state.assignments[`${provider}:${assignmentId}`] = { accountId, selectedAt: acquiredAt };
    writeState(statePath, state);
    return {
      contract: PROVIDER_CAPACITY_SELECTION_CONTRACT,
      status: 'selected',
      provider,
      accountId,
      accountLabel: account.label,
      selectedAt: acquiredAt,
      lease: { runId, assignmentId: assignmentId ?? null, pid: process.pid },
      leaseReceipt: { provider, accountId, runId, acquiredAt, accountViewDigest },
      // An account with one store per CLI carries all of them; the launch takes the one of the CLI it
      // actually runs (providerCapacityForCommand). `credentialSource` is the store of `cli` when known.
      credentialSource: credentialSourceForCli(account, cli),
      ...(account.credentialSources ? { credentialSources: account.credentialSources } : {}),
    };
  }, { waitMs: lockWaitMs });
}

/**
 * Audit a lease receipt against the provider's own record of the lease it granted. The receipt is read
 * from the attempt directory, which a worker can reach; the record in the provider state is not, so the
 * record decides whether there is anything to audit: an assignment the record holds a lease for needs a
 * receipt that agrees (`null` when it is missing or unreadable is a mismatch). Returns null when they
 * agree, or when neither exists, and what differs when they do not (including a receipt the provider
 * never granted).
 */
export function auditLeaseReceipt(receipt, { assignmentId, runtimeDir } = {}) {
  const { statePath } = providerCapacityStatePaths(runtimeDir);
  const { assignments = {} } = readState(statePath);
  if (!receipt) {
    const held = Object.keys(assignments).find((key) => key.endsWith(`:${assignmentId}`));
    return held ? `the provider record names a lease for this assignment (${held.slice(0, -assignmentId.length - 1)}), the attempt has no readable receipt` : null;
  }
  const held = assignments[`${receipt.provider}:${assignmentId}`];
  if (held?.accountId === receipt.accountId && held?.selectedAt === receipt.acquiredAt) return null;
  return `the receipt names ${receipt.provider}/${receipt.accountId} acquired ${receipt.acquiredAt}, the provider record names ${held ? `${held.accountId} selected ${held.selectedAt}` : 'no lease for this assignment'}`;
}

export function releaseProviderAccountLease({ provider, accountId, runId, runtimeDir } = {}) {
  if (!provider || !accountId || !runId) return false;
  const { statePath } = providerCapacityStatePaths(runtimeDir);
  return withProviderStateLock(() => {
    const state = readState(statePath);
    const leases = state.providers?.[provider]?.accounts?.[accountId]?.leases;
    if (!leases?.[runId]) return false;
    delete leases[runId];
    writeState(statePath, state);
    return true;
  });
}

/**
 * Forget which account an attempt's assignment held, once the controller has recorded the attempt's
 * outcome: from then on no bind or audit of that assignment id happens again (a later attempt of the seat
 * has its own id). An attempt whose controller died before recording its outcome keeps the entry, which a
 * rebind of the same id reads as its sticky account.
 */
export function dropAssignmentRecord({ assignmentId, runtimeDir } = {}) {
  if (!assignmentId) return false;
  const { statePath } = providerCapacityStatePaths(runtimeDir);
  return withProviderStateLock(() => {
    const state = readState(statePath);
    const keys = Object.keys(state.assignments ?? {}).filter((key) => key.endsWith(`:${assignmentId}`));
    if (keys.length === 0) return false;
    for (const key of keys) delete state.assignments[key];
    writeState(statePath, state);
    return true;
  });
}

function setQuarantine(state, { provider, accountId, reasonCode, quarantineKind = 'temporary', until, resetKnown, detail }) {
  state.providers[provider] ??= { accounts: {} };
  const acct = accountState(state.providers[provider], accountId);
  acct.lastFaultAt = new Date().toISOString();
  acct.quarantine = {
    kind: quarantineKind,
    reasonCode,
    ...(until ? { until } : {}),
    // Whether the end came from the provider's own words; a record without the field reads as known.
    ...(typeof resetKnown === 'boolean' ? { resetKnown } : {}),
    ...(detail ? { detail } : {}),
    quarantinedAt: acct.lastFaultAt,
  };
  return acct.quarantine;
}

export function quarantineProviderAccount({ provider, accountId, reasonCode, quarantineKind = 'temporary', until, resetKnown, runtimeDir, detail } = {}) {
  const { statePath } = providerCapacityStatePaths(runtimeDir);
  return withProviderStateLock(() => {
    const state = readState(statePath);
    const quarantine = setQuarantine(state, { provider, accountId, reasonCode, quarantineKind, until, resetKnown, detail });
    writeState(statePath, state);
    return quarantine;
  });
}

/** The classified faults an account's history keeps: a stop the provider itself named. */
const AUDITED_FAULTS = new Set(['quota-limit', 'auth-token', 'provider-error']);

/**
 * Records one classified provider fault on the account that ran the attempt: quarantines it when the
 * classifier says so, and appends one `fault` line to the audit log, both under the state lock. Returns
 * the quarantine set, or null. A fault that is no provider stop (low confidence, unknown provider)
 * leaves nothing.
 */
export function recordProviderAccountFault({ provider, accountId, fault, providerSignal = null, runId = null, assignmentId = null, source = 'run', runtimeDir } = {}) {
  if (!fault || (fault.action !== 'quarantine' && !AUDITED_FAULTS.has(fault.reasonCode))) return null;
  const { statePath } = providerCapacityStatePaths(runtimeDir);
  return withProviderStateLock(() => {
    const state = readState(statePath);
    const quarantine = applyFault(state, { provider, accountId, fault, providerSignal, runId, assignmentId, source });
    writeState(statePath, state);
    return quarantine;
  });
}

/** The fault write, on a state the caller holds the lock for: the quarantine and its one `fault` line. */
function applyFault(state, { provider, accountId, fault, providerSignal, runId, assignmentId, source }) {
  const quarantine = fault.action === 'quarantine'
    ? setQuarantine(state, {
      provider,
      accountId,
      reasonCode: fault.reasonCode,
      quarantineKind: fault.quarantineKind,
      until: fault.until,
      resetKnown: fault.resetKnown,
      detail: { kind: 'provider-stop', runId, assignmentId },
    })
    : null;
  state.audit.push({
    contract: PROVIDER_CAPACITY_AUDIT_CONTRACT,
    action: 'fault',
    at: new Date().toISOString(),
    provider,
    accountId,
    reasonCode: fault.reasonCode,
    quarantine: quarantine
      ? { kind: quarantine.kind, ...(quarantine.until ? { until: quarantine.until } : {}), ...(typeof quarantine.resetKnown === 'boolean' ? { resetKnown: quarantine.resetKnown } : {}) }
      : null,
    providerSignal: providerSignal ?? null,
    runId,
    assignmentId,
    // A run's stop is the default and carries no marker; only a probe's is marked.
    ...(source === 'probe' ? { source } : {}),
  });
  return quarantine;
}

/** The clear write, on a state the caller holds the lock for: drops the quarantine and appends its one line. */
function applyClear(state, { provider, accountId, reason, caller }) {
  const previous = state.providers?.[provider]?.accounts?.[accountId]?.quarantine ?? null;
  state.providers[provider] ??= { accounts: {} };
  accountState(state.providers[provider], accountId).quarantine = null;
  const record = {
    contract: PROVIDER_CAPACITY_AUDIT_CONTRACT,
    action: 'clear-quarantine',
    status: 'cleared',
    clearedAt: new Date().toISOString(),
    provider,
    accountId,
    previousQuarantine: previous,
    reason: reason || null,
    caller,
    actor: caller,
  };
  state.audit.push(record);
  return record;
}

export function clearProviderAccountQuarantine({ runnerConfig, provider, accountId, reason, force = false, runtimeDir, caller = process.env.USER || null } = {}) {
  const inventory = providerAccountInventory(runnerConfig);
  if (!inventory[provider]?.accounts?.[accountId]) {
    throw new ProviderCapacityConfigError(`provider-capacity clear-quarantine refused: unknown provider/account ${provider}/${accountId}`);
  }
  const { statePath } = providerCapacityStatePaths(runtimeDir);
  return withProviderStateLock(() => {
    const state = readState(statePath);
    const acct = state.providers?.[provider]?.accounts?.[accountId];
    const previous = acct?.quarantine ?? null;
    if (!previous && !force) {
      throw new ProviderCapacityConfigError(`provider-capacity clear-quarantine refused: account ${provider}/${accountId} is not quarantined`);
    }
    const record = applyClear(state, { provider, accountId, reason, caller });
    writeState(statePath, state);
    return record;
  });
}

// An account quarantined for a dead credential (`auth-token`, manual clear) has no end time: the owner
// logs in again and fgOS cannot see that. Rather than wait for a person to run the clear command, a
// dispatch that would otherwise be refused for lack of any usable account tries each such account with
// one real call. The call runs outside the state lock (it takes seconds), and an attempt is recorded
// first so that a second dispatch, or a crash, does not repeat it before the cooldown is over.
export const DEFAULT_QUARANTINE_PROBE_COOLDOWN_MS = 30 * 60 * 1000;

const PROBE_SOURCES = new Set(['probe-account', 'self']);
const ACCOUNT_FAULT_REASONS = { login: 'credential', 'usage-limit': 'quota' };
const CLEARABLE_BY_PROBE = new Set(['quota-limit', 'auth-token']);

/** A direct row that proves the account itself is at fault: the CLI named a login or quota stop and exited non-zero. */
const isAccountFaultRow = (row) => row?.ok !== true && row?.reason in ACCOUNT_FAULT_REASONS
  && typeof row.exitCode === 'number' && row.exitCode !== 0;

/** The account-side verdict one leg alone can give: `healthy`, `account-fault`, or null when it is inconclusive. */
const directVerdict = (rows) => {
  if (rows.length > 0 && rows.every((row) => row?.ok === true)) return 'healthy';
  if (rows.length > 0 && rows.every(isAccountFaultRow)) return 'account-fault';
  return null;
};

/** The probe write, on a state the caller holds the lock for. See `recordAccountProbe`. */
function applyAccountProbe(state, { provider, accountId, direct, verdict, source, now }) {
  state.audit.push({
    contract: PROVIDER_CAPACITY_AUDIT_CONTRACT,
    action: 'probe',
    at: new Date(now).toISOString(),
    provider,
    accountId,
    verdict,
    direct: direct.map((row) => ({
      cli: row.cli ?? null, ok: row.ok === true, reason: row.reason ?? null, providerSignal: row.providerSignal ?? null, elapsedMs: row.elapsedMs ?? null,
    })),
    source,
  });
  const faultRow = direct.find(isAccountFaultRow);
  if (faultRow) {
    const fault = classifyProviderCapacityFault({
      provider, adapterOutcome: 'provider-limit', stopCause: ACCOUNT_FAULT_REASONS[faultRow.reason], providerSignal: faultRow.providerSignal ?? null, now,
    });
    applyFault(state, { provider, accountId, fault, providerSignal: faultRow.providerSignal ?? null, runId: null, assignmentId: null, source: 'probe' });
    return;
  }
  const held = state.providers?.[provider]?.accounts?.[accountId]?.quarantine;
  if (direct.length > 0 && direct.every((row) => row.ok === true) && held && CLEARABLE_BY_PROBE.has(held.reasonCode)) {
    applyClear(state, {
      provider, accountId, reason: 'a direct call answered', caller: source === 'self' ? 'fgos provider-capacity probe' : 'fgos dispatch probe-account',
    });
  }
}

/**
 * Records what a direct call to an account found, in one state-lock section: a login or quota stop
 * quarantines the account through the fault door, a call that answered on every login store lifts a quota or
 * login quarantine, and one `probe` line says what was seen either way (the history that tells when an
 * account was last seen healthy). A timeout or other failure only leaves the `probe` line.
 *
 * @param {object} options
 * @param {Array<{cli?: string, ok: boolean, reason?: string|null, providerSignal?: object|null, exitCode?: number|null, elapsedMs?: number}>} options.direct
 * @param {'probe-account'|'self'} [options.source]
 */
export function recordAccountProbe({ provider, accountId, direct, verdict = null, source = 'probe-account', runtimeDir, now = Date.now() } = {}) {
  if (!provider || !accountId || !Array.isArray(direct)) {
    throw new ProviderCapacityConfigError('provider-capacity record-account-probe refused: provider, accountId and a direct row list are required');
  }
  if (!PROBE_SOURCES.has(source)) {
    throw new ProviderCapacityConfigError(`provider-capacity record-account-probe refused: unknown source ${source}`);
  }
  const { statePath } = providerCapacityStatePaths(runtimeDir);
  return withProviderStateLock(() => {
    const state = readState(statePath);
    applyAccountProbe(state, { provider, accountId, direct, verdict, source, now });
    writeState(statePath, state);
    return state.providers?.[provider]?.accounts?.[accountId]?.quarantine ?? null;
  });
}

/**
 * Try the quarantined accounts of `provider` with one real call each, and stop at the first that answers.
 * Two kinds of account are tried:
 *  - an `auth-token` lock, only when no account of the provider is usable, at most once per cooldown;
 *  - a `quota-limit` lock whose reset the provider never named (`resetKnown: false`, the end is a guess), at
 *    most once per `runKey`: while it is active and no account is usable, or after it expired when it is
 *    `accountId`, the account the seat is about to use.
 * Never throws for a failed probe: the answer goes through `recordAccountProbe`'s rules (a login or quota
 * stop re-dates the lock, any other failure leaves it) and the attempt is stamped on the lock.
 *
 * @param {object} options
 * @param {(request: {provider: string, accountId: string, account: object, cli: string|null, model: string|null, spawnHolding: Function}) => Promise<{ok: boolean, detail?: string, reason?: string|null, providerSignal?: object|null, exitCode?: number|null, elapsedMs?: number}>} options.probe
 *   one real, cheap call made with that account's credential
 * @param {string|null} [options.accountId] the account the caller is about to use (an expired quota lock is only tried for it)
 * @param {string|null} [options.runKey] the run asking; a quota lock already tried by this run is not tried again
 * @param {string|null} [options.model] handed to `probe` as is
 * @returns {Promise<Array<{accountId: string, unlocked: boolean, detail: string|null}>>} what was tried
 */
export async function probeQuarantinedAccounts({
  // `cli`: the CLI the dispatch is expected to run; an account with one store per CLI is probed through
  // that CLI's store (the probe receives it), so the call checks the login the dispatch would use.
  runnerConfig, provider, runtimeDir, probe, cli = null, model = null, accountId: namedAccountId = null, runKey = null,
  now = Date.now(), cooldownMs = DEFAULT_QUARANTINE_PROBE_COOLDOWN_MS, accountLockWaitMs = 120_000,
} = {}) {
  if (typeof probe !== 'function' || !provider) return [];
  const accounts = providerAccountInventory(runnerConfig)[provider]?.accounts;
  if (!accounts) return [];
  const { statePath } = providerCapacityStatePaths(runtimeDir);
  const attemptedAt = new Date(now).toISOString();

  const claimed = withProviderStateLock(() => {
    const state = readState(statePath);
    const providerState = state.providers?.[provider];
    const enabled = Object.keys(accounts).filter((accountId) => accounts[accountId].disabled !== true);
    const quarantineOf = (accountId) => providerState?.accounts?.[accountId]?.quarantine;
    const noneUsable = !enabled.some((accountId) => !isQuarantined(providerState?.accounts?.[accountId] ?? {}, now));
    const picked = [];
    for (const accountId of enabled) {
      const quarantine = quarantineOf(accountId);
      if (!quarantine) continue;
      const active = isQuarantined(providerState.accounts[accountId], now);
      if (quarantine.kind === 'manual-clear' && quarantine.reasonCode === 'auth-token') {
        const last = Date.parse(quarantine.probe?.attemptedAt ?? '');
        if (!noneUsable || (Number.isFinite(last) && now - last < cooldownMs)) continue;
      } else if (quarantine.reasonCode === 'quota-limit' && quarantine.resetKnown === false) {
        if (!runKey || quarantine.probe?.runKey === runKey) continue;
        if (active ? !noneUsable : accountId !== namedAccountId) continue;
      } else continue;
      quarantine.probe = { attemptedAt, status: 'running', ...(runKey ? { runKey } : {}) };
      picked.push({ accountId, quarantinedAt: quarantine.quarantinedAt });
    }
    if (picked.length > 0) writeState(statePath, state);
    return picked;
  });

  const tried = [];
  for (const { accountId, quarantinedAt } of claimed) {
    let result;
    // The call may renew the login in the account's own home; a renewal made by fgOS elsewhere must not
    // run at the same time, so the call holds the account lock.
    let accountLock = null;
    try {
      accountLock = await acquireAccountLock({ runtimeDir, provider, accountId, waitMs: accountLockWaitMs });
      // The probe starts its call through the lock, so a dead holder with a live call keeps the lock.
      result = await probe({ provider, accountId, account: accounts[accountId], cli, model, spawnHolding: accountLock.spawnHolding });
    } catch (err) {
      result = { ok: false, detail: err?.message ?? String(err) };
    } finally {
      try { accountLock?.release(); } catch { /* a release problem must not turn a probe answer into a failure */ }
    }
    const ok = result?.ok === true;
    const detail = result?.detail ? String(result.detail).slice(0, 300) : null;
    const row = {
      cli, ok, reason: result?.reason ?? null, providerSignal: result?.providerSignal ?? null, exitCode: result?.exitCode ?? null, elapsedMs: result?.elapsedMs ?? null,
    };
    withProviderStateLock(() => {
      const state = readState(statePath);
      const target = state.providers?.[provider]?.accounts?.[accountId];
      // A person may have cleared or replaced the quarantine while the call ran: leave that alone.
      if (!target?.quarantine || target.quarantine.quarantinedAt !== quarantinedAt) return;
      applyAccountProbe(state, { provider, accountId, direct: [row], verdict: directVerdict([row]), source: 'self', now });
      // Whatever lock is left (the same one, or a newer one a login or quota stop just wrote) carries the attempt.
      if (!ok && target.quarantine) target.quarantine.probe = { attemptedAt, status: 'failed', ...(detail ? { detail } : {}), ...(runKey ? { runKey } : {}) };
      writeState(statePath, state);
    });
    tried.push({ accountId, unlocked: ok, detail });
    if (ok) break;
  }
  return tried;
}

export function inspectProviderCapacity({ runnerConfig, provider, accountId, runtimeDir } = {}) {
  const inventory = providerAccountInventory(runnerConfig);
  const { statePath } = providerCapacityStatePaths(runtimeDir);
  const state = readState(statePath);
  const providers = {};
  for (const [providerId, providerInventory] of Object.entries(inventory)) {
    if (provider && providerId !== provider) continue;
    providers[providerId] = { accounts: {} };
    for (const [id, account] of Object.entries(providerInventory.accounts ?? {})) {
      if (accountId && id !== accountId) continue;
      const acctState = state.providers?.[providerId]?.accounts?.[id] ?? {};
      providers[providerId].accounts[id] = {
        accountId: id,
        label: account.label,
        ...(account.disabled === true ? { disabled: true } : {}),
        ...(account.unusableFor ? { unusableFor: account.unusableFor } : {}),
        healthy: !isQuarantined(acctState),
        quarantine: acctState.quarantine ?? null,
        openLeases: Object.values(acctState.leases ?? {}).map((lease) => ({
          runId: lease.runId,
          assignmentId: lease.assignmentId ?? null,
          pid: lease.pid ?? null,
          acquiredAt: lease.acquiredAt,
        })),
        lastSelectedAt: acctState.lastSelectedAt ?? null,
        lastFaultAt: acctState.lastFaultAt ?? null,
      };
    }
  }
  return { contract: 'provider-capacity-inspect.v1', providers };
}

// A quota quarantine always ends: when no wait or reset is named, the conservative default holds the
// account out for an hour rather than leave a quarantine with no end time (isQuarantined() also fails
// closed on that case).
const DEFAULT_QUOTA_QUARANTINE_TTL_MS = 60 * 60 * 1000;
// The longest a quota stop holds an account out. The wait and the reset are read from the CLI's last words,
// which the agent can also print, so a forged "Provider requested 99999999999ms wait" must not lock an
// account for years. A day covers the longest window a provider resets on per request (a daily quota); a
// longer limit (a weekly one) is met again on the next real run after the day and quarantines again.
const MAX_QUOTA_QUARANTINE_MS = 24 * 60 * 60 * 1000;

/**
 * The reset window a provider names in its own words: "resets in 2h", "Resets in 24m1s",
 * "reset in 1h 30m". Returns milliseconds, or null when no window is named.
 */
export function parseQuotaResetWindowMs(text) {
  if (typeof text !== 'string') return null;
  const match = /resets?\s+in\s+((?:\d+\s*[hms](?![a-z])\s*)+)/i.exec(text);
  if (!match) return null;
  const unitMs = { h: 3600000, m: 60000, s: 1000 };
  let total = 0;
  for (const [, amount, unit] of match[1].matchAll(/(\d+)\s*([hms])(?![a-z])/gi)) {
    total += Number(amount) * unitMs[unit.toLowerCase()];
  }
  return total > 0 ? total : null;
}

/**
 * The reset moment codex prints as a local clock time: "... or try again at 6:02 PM." Returns the
 * next such time after `now` in epoch milliseconds, or null when the text names none.
 */
export function parseQuotaResetClockTime(text, now) {
  const match = /try again at\s+(\d{1,2}):(\d{2})\s*([ap]m)/i.exec(typeof text === 'string' ? text : '');
  if (!match) return null;
  let hour = Number(match[1]) % 12;
  if (match[3].toLowerCase() === 'pm') hour += 12;
  const reset = new Date(now);
  reset.setHours(hour, Number(match[2]), 0, 0);
  if (reset.getTime() <= now) reset.setDate(reset.getDate() + 1);
  return reset.getTime();
}

/** What the provider itself said, as one short phrase ("HTTP 429, RESOURCE_EXHAUSTED, wait 30s"); null when the signal carries nothing. */
export function describeProviderSignal(signal) {
  if (!signal || typeof signal !== 'object') return null;
  const parts = [];
  if (signal.status !== undefined) parts.push(`HTTP ${signal.status}`);
  if (signal.statusWord) parts.push(signal.statusWord);
  if (signal.requestedWaitMs !== undefined) parts.push(`wait ${Math.ceil(signal.requestedWaitMs / 1000)}s`);
  if (signal.resetHint) parts.push(signal.resetHint);
  return parts.length ? parts.join(', ') : null;
}

/**
 * When a quota stop's quarantine ends, from the provider signal the receipt carried: the wait the provider
 * requested, else the reset its hint names (a window or a clock time), else the one-hour default; never
 * past `MAX_QUOTA_QUARANTINE_MS`. `resetKnown` is false only for the default, an end fgOS guessed.
 */
function quotaQuarantineUntil(providerSignal, now) {
  const requested = providerSignal?.requestedWaitMs;
  const hint = typeof providerSignal?.resetHint === 'string' ? providerSignal.resetHint : '';
  const named = (typeof requested === 'number' && requested > 0 ? requested : null)
    ?? parseQuotaResetWindowMs(hint)
    ?? ((at) => (at === null ? null : at - now))(parseQuotaResetClockTime(hint, now));
  const waitMs = named ?? DEFAULT_QUOTA_QUARANTINE_TTL_MS;
  return { until: new Date(now + Math.min(waitMs, MAX_QUOTA_QUARANTINE_MS)).toISOString(), resetKnown: named !== null };
}

/**
 * `stopCause` ('credential', 'quota' or 'provider') is the supervisor's verdict on why the provider stopped the
 * agent, taken from its receipt: it decides auth fault versus quota. A 'provider' stop (the provider answered
 * the call with an HTTP error) moves the walk on but says nothing against the account, so it quarantines
 * nothing. `providerSignal` (the receipt's, see quotaQuarantineUntil) only dates a quota stop; no agent text
 * is read here.
 */
export function classifyProviderCapacityFault({ provider, adapterOutcome, structuredAgent, stopCause = null, providerSignal = null, now = Date.now() } = {}) {
  // Provider is required: a fault with no provider identity is never held against an account.
  if (!provider) {
    return { action: 'evidence-only', reasonCode: 'provider-unknown' };
  }
  if (adapterOutcome === 'paused-limit' || adapterOutcome === 'provider-limit' || structuredAgent?.stopReason === 'paused-limit' || structuredAgent?.stopReason === 'provider-limit') {
    // A round that ended on a dead credential is not a quota hit: the account stays out until a
    // person logs in again, and the reset rule below must not retry it in an hour.
    if (stopCause === 'credential') {
      return { action: 'quarantine', reasonCode: 'auth-token', quarantineKind: 'manual-clear' };
    }
    if (stopCause === 'provider') return { action: 'evidence-only', reasonCode: 'provider-error' };
    return { action: 'quarantine', reasonCode: 'quota-limit', quarantineKind: 'temporary', ...quotaQuarantineUntil(providerSignal, now) };
  }
  return { action: 'evidence-only', reasonCode: 'unknown-or-low-confidence' };
}

export function redactProviderCapacitySelection(selection) {
  if (!selection || selection.status !== 'selected') return selection;
  return {
    contract: selection.contract,
    status: selection.status,
    provider: selection.provider,
    accountId: selection.accountId,
    accountLabel: selection.accountLabel,
    selectedAt: selection.selectedAt,
    lease: selection.lease,
    ...(selection.leaseReceipt ? { leaseReceipt: selection.leaseReceipt } : {}),
  };
}
