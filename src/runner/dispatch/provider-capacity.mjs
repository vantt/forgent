// Provider Capacity Rotator slice 1: account inventory, selector state,
// leases, classifier, and credential facts. This module deliberately stays
// inside an already-resolved provider; it never chooses provider/model/executor.

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { normalizeProviderFamily } from './provider-adapter.mjs';
import { AUTH_FAILURE_TAIL_LINES, matchAuthFailureLine, matchQuotaLimitLine } from './provider-auth-failure.mjs';
import { getProcessStartTime, pidExists, resolveHolderLiveness } from './process-identity.mjs';
import { acquire, acquireSync, createLockScope, lockHolders, resolveLock, resolveLockRoot, runBorrowed } from '../../holder-lock/index.mjs';

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
  constructor(message) {
    super(message);
    this.name = 'ProviderCapacityConfigError';
    this.category = 'validation';
  }
}

export function defaultProviderCapacityRuntimeDir() {
  return path.join(os.homedir(), '.fgos', 'runtime', 'provider-capacity');
}

export function providerCapacityStatePaths(runtimeDir = defaultProviderCapacityRuntimeDir()) {
  return {
    runtimeDir,
    statePath: path.join(runtimeDir, 'state.json'),
  };
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function rejectProjectProviderAccountInventory(projectConfig, sourceLabel = 'project config') {
  const providers = projectConfig?.runner?.providers;
  if (!isPlainObject(providers)) return;
  for (const [provider, entry] of Object.entries(providers)) {
    if (isPlainObject(entry) && entry.accounts !== undefined) {
      throw new ProviderCapacityConfigError(
        `runner config (${sourceLabel}#runner.providers.${provider}.accounts) is global-only; declare provider account inventory in ~/.fgos/config.json, not project config.`,
      );
    }
  }
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
    const canonicalProvider = normalizeProviderFamily(provider) || provider;
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
}

const CLI_KEY = /^[a-z0-9][a-z0-9_-]*$/;

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
 * A capacity selection made ready for the invocation that is actually launched: an account with one store
 * per CLI hands over the store of `command`'s CLI as `credentialSource` (null when it declares none, which
 * the private-home provisioning refuses). A single-store selection is returned unchanged.
 */
export function providerCapacityForCommand(selection, command) {
  if (!selection?.credentialSources) return selection;
  const cli = commandCli(command);
  return { ...selection, credentialCli: cli, credentialSource: credentialSourceForCli(selection, cli) };
}

export function providerAccountInventory(runnerConfig) {
  return validateProviderAccountInventory(runnerConfig, 'runner config');
}

export function hasProviderAccounts(runnerConfig, provider) {
  return Object.keys(providerAccountInventory(runnerConfig)?.[provider]?.accounts ?? {}).length > 0;
}

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

function writeState(statePath, state) {
  const dir = path.dirname(statePath);
  fs.mkdirSync(dir, { recursive: true });
  const content = `${JSON.stringify(state, null, 2)}\n`;
  const tmpPath = path.join(dir, `.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const fd = fs.openSync(tmpPath, 'w');
  try {
    fs.writeSync(fd, content);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(tmpPath, statePath);
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
  return holders.kind === 'list' && holders.pids.length > 0 ? holders.pids[0] : null;
}

// The wait is thirty seconds because the holder flushes to disk (fsync) inside the critical section:
// on a busy disk a live holder can take well over the old five seconds, and giving up then fails a
// caller for no wrong done. A holder that has died releases at once, so a longer wait only costs time
// when a live holder is really slow.
export function withProviderStateLock(fn, { waitMs = 30_000 } = {}) {
  const params = lockParams();
  const res = acquireSync(createLockScope('provider-state'), 'provider-state', params, { waitMs });
  if (res.result !== 'acquired') {
    const lockPath = resolveLock('provider-state', params).v3Path;
    const holderPid = firstHolderPid('provider-state', params);
    throw new ProviderCapacityLockError(
      `provider-capacity lock at "${lockPath}" is still held by a live process${holderPid ? ` (pid ${holderPid})` : ''} after waiting ${waitMs}ms.`,
      { lockPath, holderPid },
    );
  }
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
  return { dir, params: lockParams({ provider, account: accountId }) };
}

function accountLockHandle(dir, kernelHandle) {
  fs.mkdirSync(dir, { recursive: true });
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
    if (err?.code === 'lock-predecessor-domain-not-empty') return null;
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
  const res = await acquire(createLockScope('provider-account'), 'provider-account', params, { waitMs });
  if (res.result === 'acquired') return accountLockHandle(dir, res.handle);
  const lockPath = resolveLock('provider-account', params).v3Path;
  throw new ProviderCapacityLockError(
    `provider-capacity account lock at "${lockPath}" is still held by a live process after waiting.`,
    { lockPath, holderPid: firstHolderPid('provider-account', params) },
  );
}

export function stableHash(seed, accountId) {
  const digest = crypto.createHash('sha256').update(`${seed}\0${accountId}`).digest('hex');
  return digest.slice(0, 16);
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
// RUNNER's own pid (the process that called acquireProviderAccountLease),
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
        && resolveHolderLiveness({ pid: lease.pid, processStartTime: lease.processStartTime }, pidExists(lease.pid)) === 'dead';
      const provenDead = (pidDead && !isRunWorkerAlive(runId, lease)) || runIsDead(runId, lease);
      if (provenDead) {
        delete acct.leases[runId];
        acct.lastReclaimedAt = nowIso;
      }
    }
  }
}

export function rankProviderAccounts({ provider, inventory, state, assignmentId, seed, runIsDead, isRunWorkerAlive, now = Date.now() }) {
  const accounts = inventory?.[provider]?.accounts ?? {};
  const providerState = state.providers?.[provider] ?? { accounts: {} };
  reclaimDeadLeases(providerState, { runIsDead, isRunWorkerAlive });
  const stickyAccountId = assignmentId ? state.assignments?.[`${provider}:${assignmentId}`]?.accountId : null;
  const sticky = stickyAccountId && accounts[stickyAccountId] ? accountState(providerState, stickyAccountId) : null;
  if (stickyAccountId && accounts[stickyAccountId] && sticky && !isQuarantined(sticky, now)) {
    return [stickyAccountId];
  }
  return Object.keys(accounts)
    .filter((accountId) => !isQuarantined(accountState(providerState, accountId), now))
    .sort((a, b) => {
      const aState = accountState(providerState, a);
      const bState = accountState(providerState, b);
      const leaseDelta = Object.keys(aState.leases ?? {}).length - Object.keys(bState.leases ?? {}).length;
      if (leaseDelta !== 0) return leaseDelta;
      const aLast = aState.lastSelectedAt ?? '';
      const bLast = bState.lastSelectedAt ?? '';
      if (aLast !== bLast) return aLast < bLast ? -1 : 1;
      return stableHash(seed, a).localeCompare(stableHash(seed, b));
    });
}

export function acquireProviderAccountLease({
  runnerConfig, provider, assignmentId, runId, seed, runtimeDir, runIsDead, isRunWorkerAlive,
  // The CLI the launch is known to run, when the caller knows it (a pinned invocation): only an account
  // that declares a login store for that CLI is leased. Null leaves every account eligible.
  cli = null,
  now = new Date(),
  // How long to wait for the state lock before throwing
  // ProviderCapacityLockError; omitted keeps withProviderStateLock's own default.
  lockWaitMs,
} = {}) {
  if (!provider || !runId) return null;
  const fullInventory = providerAccountInventory(runnerConfig);
  if (!fullInventory[provider] || Object.keys(fullInventory[provider].accounts).length === 0) return null;
  const inventory = cli ? inventoryServingCli(fullInventory, provider, cli) : fullInventory;
  if (Object.keys(inventory[provider].accounts).length === 0) {
    return { status: 'refused', provider, reason: 'provider-capacity.no-account-for-cli', cli };
  }
  const { statePath } = providerCapacityStatePaths(runtimeDir);
  return withProviderStateLock(() => {
    const state = readState(statePath);
    state.providers[provider] ??= { accounts: {} };
    const providerState = state.providers[provider];
    reclaimDeadLeases(providerState, { runIsDead, isRunWorkerAlive, nowIso: now.toISOString() });
    const ranked = rankProviderAccounts({
      provider, inventory, state, assignmentId, seed: seed ?? runId, runIsDead, isRunWorkerAlive, now: now.getTime(),
    });
    if (ranked.length === 0) {
      return { status: 'refused', provider, reason: 'provider-capacity.exhausted-or-quarantined' };
    }
    const accountId = ranked[0];
    const account = inventory[provider].accounts[accountId];
    const acct = accountState(providerState, accountId);
    const selectedAt = now.toISOString();
    acct.lastSelectedAt = selectedAt;
    acct.leases[runId] = {
      runId,
      assignmentId: assignmentId ?? null,
      pid: process.pid,
      processStartTime: getProcessStartTime(process.pid),
      acquiredAt: selectedAt,
    };
    if (assignmentId) state.assignments[`${provider}:${assignmentId}`] = { accountId, selectedAt };
    writeState(statePath, state);
    return {
      contract: PROVIDER_CAPACITY_SELECTION_CONTRACT,
      status: 'selected',
      provider,
      accountId,
      accountLabel: account.label,
      selectedAt,
      lease: { runId, assignmentId: assignmentId ?? null, pid: process.pid },
      // An account with one store per CLI carries all of them; the launch takes the one of the CLI it
      // actually runs (providerCapacityForCommand). `credentialSource` is the store of `cli` when known.
      credentialSource: credentialSourceForCli(account, cli),
      ...(account.credentialSources ? { credentialSources: account.credentialSources } : {}),
    };
  }, { waitMs: lockWaitMs });
}

/** The provider's inventory narrowed to the accounts that declare a login store for `cli`. */
function inventoryServingCli(inventory, provider, cli) {
  const accounts = {};
  for (const [id, account] of Object.entries(inventory[provider].accounts)) {
    if (credentialSourceForCli(account, cli)) accounts[id] = account;
  }
  return { ...inventory, [provider]: { ...inventory[provider], accounts } };
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

export function quarantineProviderAccount({ provider, accountId, reasonCode, quarantineKind = 'temporary', until, runtimeDir, detail } = {}) {
  const { statePath } = providerCapacityStatePaths(runtimeDir);
  return withProviderStateLock(() => {
    const state = readState(statePath);
    state.providers[provider] ??= { accounts: {} };
    const acct = accountState(state.providers[provider], accountId);
    acct.lastFaultAt = new Date().toISOString();
    acct.quarantine = {
      kind: quarantineKind,
      reasonCode,
      ...(until ? { until } : {}),
      ...(detail ? { detail } : {}),
      quarantinedAt: acct.lastFaultAt,
    };
    writeState(statePath, state);
    return acct.quarantine;
  });
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
    state.providers[provider] ??= { accounts: {} };
    const target = accountState(state.providers[provider], accountId);
    target.quarantine = null;
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

/**
 * Try to unlock the `auth-token` quarantined accounts of `provider`, but only when no account of the
 * provider is usable. At most one real call per account per cooldown; stops after the first account
 * that answers. Never throws for a failed probe: that is recorded and the account stays quarantined.
 *
 * @param {object} options
 * @param {(request: {provider: string, accountId: string, account: object}) => Promise<{ok: boolean, detail?: string}>} options.probe
 *   one real, cheap call made with that account's credential
 * @returns {Promise<Array<{accountId: string, unlocked: boolean, detail: string|null}>>} what was tried
 */
export async function probeQuarantinedAccounts({
  // `cli`: the CLI the dispatch is expected to run; an account with one store per CLI is probed through
  // that CLI's store (the probe receives it), so the call checks the login the dispatch would use.
  runnerConfig, provider, runtimeDir, probe, cli = null, now = Date.now(), cooldownMs = DEFAULT_QUARANTINE_PROBE_COOLDOWN_MS,
  accountLockWaitMs = 120_000,
} = {}) {
  if (typeof probe !== 'function' || !provider) return [];
  const accounts = providerAccountInventory(runnerConfig)[provider]?.accounts;
  if (!accounts) return [];
  const { statePath } = providerCapacityStatePaths(runtimeDir);
  const attemptedAt = new Date(now).toISOString();

  const claimed = withProviderStateLock(() => {
    const state = readState(statePath);
    const providerState = state.providers?.[provider];
    const isUsable = (accountId) => !isQuarantined(providerState?.accounts?.[accountId] ?? {}, now);
    if (Object.keys(accounts).some(isUsable)) return [];
    const picked = [];
    for (const accountId of Object.keys(accounts)) {
      const quarantine = providerState?.accounts?.[accountId]?.quarantine;
      if (quarantine?.kind !== 'manual-clear' || quarantine.reasonCode !== 'auth-token') continue;
      const last = Date.parse(quarantine.probe?.attemptedAt ?? '');
      if (Number.isFinite(last) && now - last < cooldownMs) continue;
      quarantine.probe = { attemptedAt, status: 'running' };
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
      result = await probe({ provider, accountId, account: accounts[accountId], cli, spawnHolding: accountLock.spawnHolding });
    } catch (err) {
      result = { ok: false, detail: err?.message ?? String(err) };
    } finally {
      try { accountLock?.release(); } catch { /* a release problem must not turn a probe answer into a failure */ }
    }
    const ok = result?.ok === true;
    const detail = result?.detail ? String(result.detail).slice(0, 300) : null;
    withProviderStateLock(() => {
      const state = readState(statePath);
      const target = state.providers?.[provider]?.accounts?.[accountId];
      // A person may have cleared or replaced the quarantine while the call ran: leave that alone.
      if (!target?.quarantine || target.quarantine.quarantinedAt !== quarantinedAt) return;
      if (ok) {
        const previous = target.quarantine;
        target.quarantine = null;
        state.audit.push({
          contract: PROVIDER_CAPACITY_AUDIT_CONTRACT,
          action: 'clear-quarantine',
          status: 'cleared',
          clearedAt: new Date().toISOString(),
          provider,
          accountId,
          previousQuarantine: previous,
          reason: 'one real call succeeded',
          caller: 'fgos provider-capacity probe',
          actor: 'fgos provider-capacity probe',
        });
      } else {
        target.quarantine.probe = { attemptedAt, status: 'failed', ...(detail ? { detail } : {}) };
      }
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

// Doctor support: who holds the state lock right now, as the kernel lists it (a pure read, takes no
// lock). A kernel lock is released when its holder dies, so a listed holder is always alive.
// `runtimeDir` is unused: the lock is machine-scoped, not per state file.
export function inspectProviderCapacityLock() {
  const params = lockParams();
  const lockPath = resolveLock('provider-state', params).v3Path;
  const holderPid = firstHolderPid('provider-state', params);
  return holderPid === null
    ? { present: false, lockPath, holderPid: null, holderAlive: null }
    : { present: true, lockPath, holderPid, holderAlive: true };
}

// Pre-Phase-05 gate H1 / post-review-recut.md "Fault classifier correction":
// "quota/rate-limit -> account quarantine with parsed reset window when
// available, otherwise conservative long TTL". A quota quarantine must never
// resolve to a missing `until` -- isQuarantined() above now also fails
// closed on that case defensively, but the classifier is the one place that
// actually KNOWS "no reset window was parseable" and should say so plainly
// rather than lean on the defensive fallback silently.
const DEFAULT_QUOTA_QUARANTINE_TTL_MS = 60 * 60 * 1000; // 1 hour, conservative default reset window.

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

function quotaQuarantineUntil(text, now) {
  const windowMs = parseQuotaResetWindowMs(text);
  if (windowMs !== null) return new Date(now + windowMs).toISOString();
  const clock = parseQuotaResetClockTime(text, now);
  return new Date(clock ?? now + DEFAULT_QUOTA_QUARANTINE_TTL_MS).toISOString();
}

// C2b: the auth-fault regex used to scan the ENTIRE stderr text for the
// bare words "token"/"auth"/"login" anywhere near "failed"/"expired"/etc,
// with no provider check at all when `provider` was omitted (a wildcard
// that matched every provider's stderr). Measured false positive: a plain
// JS test failure whose output happens to contain both "token" (e.g. a
// SyntaxError "Unexpected token") and "failed" (e.g. "1 test failed")
// several lines apart got classified as `auth-token` -- the WORSE of the
// two outcomes (`manual-clear`, requiring an operator, vs `temporary`).
// Anchored instead to actual observed provider CLI error phrases, and only
// within the last few lines (the real failure surface a CLI prints at
// the end of a crash, never scattered incidentally through earlier
// output).
const AUTH_ANCHOR_LINE_WINDOW = 5;
const AUTH_ANCHOR_PATTERNS = [
  /no api key found/i,
  /use\s+\/login/i,
  /authentication failed/i,
  /api key is invalid/i,
  /api key.{0,20}(missing|invalid|expired)/i,
  /login required/i,
];

export function classifyProviderCapacityFault({ provider, stderr = '', adapterOutcome, structuredAgent, now = Date.now() } = {}) {
  // C2b: provider is now required -- the old `provider === undefined`
  // wildcard classified stderr from ANY provider using openai's own
  // vocabulary, which is exactly what let an unrelated syntax-error stderr
  // (no provider identity attached at all) reach the auth-fault regex.
  if (!provider) {
    return { action: 'evidence-only', reasonCode: 'provider-unknown' };
  }
  const text = typeof stderr === 'string' ? stderr : '';
  if (adapterOutcome === 'paused-limit' || adapterOutcome === 'provider-limit' || structuredAgent?.stopReason === 'paused-limit' || structuredAgent?.stopReason === 'provider-limit') {
    // A round that ended on a dead credential is not a quota hit: the account stays out until a
    // person logs in again, and the reset-window rule below must not retry it in an hour.
    // A dead-credential line in the tail decides; further up it only decides when the tail does
    // not end on a quota sentence (a streamed transcript may quote a login error).
    const authInTail = matchAuthFailureLine(text, { tailLines: AUTH_FAILURE_TAIL_LINES });
    const quotaInTail = !authInTail && matchQuotaLimitLine(text, { tailLines: AUTH_FAILURE_TAIL_LINES });
    if (authInTail || (!quotaInTail && matchAuthFailureLine(text))) {
      return { action: 'quarantine', reasonCode: 'auth-token', quarantineKind: 'manual-clear' };
    }
    // The text carries the reset window when the provider named one; otherwise the
    // conservative default, never an expiry-less quarantine.
    return {
      action: 'quarantine',
      reasonCode: 'quota-limit',
      quarantineKind: 'temporary',
      until: quotaQuarantineUntil(text, now),
    };
  }
  if (provider === 'openai' || provider === 'openai-codex') {
    // The shared quota wordings, read from the stderr tail only: codex streams the agent's whole
    // transcript to stderr, so a wording anywhere in it may be the agent quoting it.
    if (matchQuotaLimitLine(text, { tailLines: AUTH_FAILURE_TAIL_LINES })) {
      // Missing/unparseable reset text falls back to the SAME conservative
      // default TTL -- never an expiry-less "temporary" quarantine, which
      // isQuarantined() would otherwise have to catch defensively instead.
      return { action: 'quarantine', reasonCode: 'quota-limit', quarantineKind: 'temporary', until: quotaQuarantineUntil(text, now) };
    }
    // C2b: auth-token is the manual-clear (operator-intervention) outcome,
    // the more disruptive of the two -- require BOTH a corroborating
    // adapterOutcome (the process actually failed/errored, not a clean
    // settle) AND an anchored phrase in only the trailing lines, never
    // text-anywhere alone.
    const adapterCorroborates = adapterOutcome !== undefined
      && adapterOutcome !== 0
      && adapterOutcome !== 'settled'
      && adapterOutcome !== 'done';
    if (adapterCorroborates) {
      const lastLines = text.split('\n').slice(-AUTH_ANCHOR_LINE_WINDOW).join('\n');
      if (AUTH_ANCHOR_PATTERNS.some((pattern) => pattern.test(lastLines))) {
        return { action: 'quarantine', reasonCode: 'auth-token', quarantineKind: 'manual-clear' };
      }
    }
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
  };
}
