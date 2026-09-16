// Provider Capacity Rotator slice 1: account inventory, selector state,
// leases, classifier, and credential facts. This module deliberately stays
// inside an already-resolved provider; it never chooses provider/model/executor.

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

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
const ACCOUNT_ENTRY_KEYS = Object.freeze(['label', 'credentialSource']);
const CREDENTIAL_SOURCE_KEYS = Object.freeze(['kind', 'home']);

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
    lockPath: path.join(runtimeDir, 'state.lock'),
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
  const normalized = {};
  for (const [provider, providerEntry] of Object.entries(providers)) {
    if (!provider || typeof provider !== 'string') {
      throw new ProviderCapacityConfigError(`runner config (${sourceLabel}.providers) provider id must be a non-empty string.`);
    }
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
    normalized[provider] = { accounts: {} };
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
      const credentialSource = account.credentialSource;
      if (!isPlainObject(credentialSource)) {
        throw new ProviderCapacityConfigError(`runner config (${sourceLabel}.providers.${provider}.accounts.${accountId}.credentialSource) must be an object.`);
      }
      for (const key of Object.keys(credentialSource)) {
        if (!CREDENTIAL_SOURCE_KEYS.includes(key)) {
          throw new ProviderCapacityConfigError(
            `runner config (${sourceLabel}.providers.${provider}.accounts.${accountId}.credentialSource) contains unknown key "${key}". Allowed keys: ${CREDENTIAL_SOURCE_KEYS.join(', ')}.`,
          );
        }
      }
      if (credentialSource.kind !== 'codex-home') {
        throw new ProviderCapacityConfigError(`runner config (${sourceLabel}.providers.${provider}.accounts.${accountId}.credentialSource.kind) must be "codex-home" in slice 1.`);
      }
      if (typeof credentialSource.home !== 'string' || !credentialSource.home.trim()) {
        throw new ProviderCapacityConfigError(`runner config (${sourceLabel}.providers.${provider}.accounts.${accountId}.credentialSource.home) must be a non-empty string.`);
      }
      normalized[provider].accounts[accountId] = {
        id: accountId,
        label: account.label ?? accountId,
        credentialSource: { kind: credentialSource.kind, home: credentialSource.home },
      };
    }
  }
  return Object.freeze(normalized);
}

function validateAccountId(accountId, label) {
  if (typeof accountId !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(accountId)) {
    throw new ProviderCapacityConfigError(`runner config (${label}) account id must be a non-empty safe key, got ${JSON.stringify(accountId)}.`);
  }
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

function readState(statePath) {
  if (!fs.existsSync(statePath)) return emptyState();
  const raw = fs.readFileSync(statePath, 'utf8');
  if (!raw.trim()) return emptyState();
  const parsed = JSON.parse(raw);
  return {
    ...emptyState(),
    ...parsed,
    providers: isPlainObject(parsed.providers) ? parsed.providers : {},
    assignments: isPlainObject(parsed.assignments) ? parsed.assignments : {},
    audit: Array.isArray(parsed.audit) ? parsed.audit : [],
  };
}

function writeState(statePath, state) {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
}

function withFileLock(lockPath, fn, { waitMs = 5000 } = {}) {
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  const deadline = Date.now() + waitMs;
  while (true) {
    let fd;
    try {
      fd = fs.openSync(lockPath, 'wx');
      fs.writeFileSync(fd, JSON.stringify({ pid: process.pid, acquiredAt: new Date().toISOString() }));
      try {
        return fn();
      } finally {
        try { fs.closeSync(fd); } catch {}
        try { fs.unlinkSync(lockPath); } catch {}
      }
    } catch (err) {
      if (fd !== undefined) {
        try { fs.closeSync(fd); } catch {}
      }
      if (err.code !== 'EEXIST' || Date.now() > deadline) throw err;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);
    }
  }
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

function isPidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM';
  }
}

function reclaimDeadLeases(providerState, { runIsDead = () => false, nowIso = new Date().toISOString() } = {}) {
  for (const [accountId, acct] of Object.entries(providerState.accounts ?? {})) {
    for (const [runId, lease] of Object.entries(acct.leases ?? {})) {
      const pidDead = lease.pid !== undefined && !isPidAlive(lease.pid);
      const provenDead = pidDead || runIsDead(runId, lease);
      if (provenDead) {
        delete acct.leases[runId];
        acct.lastReclaimedAt = nowIso;
      }
    }
  }
}

export function rankProviderAccounts({ provider, inventory, state, assignmentId, seed, runIsDead, now = Date.now() }) {
  const accounts = inventory?.[provider]?.accounts ?? {};
  const providerState = state.providers?.[provider] ?? { accounts: {} };
  reclaimDeadLeases(providerState, { runIsDead });
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
  runnerConfig, provider, assignmentId, runId, seed, runtimeDir, runIsDead,
  now = new Date(),
} = {}) {
  if (!provider || !runId) return null;
  const inventory = providerAccountInventory(runnerConfig);
  if (!inventory[provider] || Object.keys(inventory[provider].accounts).length === 0) return null;
  const { statePath, lockPath } = providerCapacityStatePaths(runtimeDir);
  return withFileLock(lockPath, () => {
    const state = readState(statePath);
    state.providers[provider] ??= { accounts: {} };
    const providerState = state.providers[provider];
    reclaimDeadLeases(providerState, { runIsDead, nowIso: now.toISOString() });
    const ranked = rankProviderAccounts({
      provider, inventory, state, assignmentId, seed: seed ?? runId, runIsDead, now: now.getTime(),
    });
    if (ranked.length === 0) {
      return { status: 'refused', provider, reason: 'provider-capacity.exhausted-or-quarantined' };
    }
    const accountId = ranked[0];
    const account = inventory[provider].accounts[accountId];
    const acct = accountState(providerState, accountId);
    const selectedAt = now.toISOString();
    acct.lastSelectedAt = selectedAt;
    acct.leases[runId] = { runId, assignmentId: assignmentId ?? null, pid: process.pid, acquiredAt: selectedAt };
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
      credentialSource: account.credentialSource,
    };
  });
}

export function releaseProviderAccountLease({ provider, accountId, runId, runtimeDir } = {}) {
  if (!provider || !accountId || !runId) return false;
  const { statePath, lockPath } = providerCapacityStatePaths(runtimeDir);
  return withFileLock(lockPath, () => {
    const state = readState(statePath);
    const leases = state.providers?.[provider]?.accounts?.[accountId]?.leases;
    if (!leases?.[runId]) return false;
    delete leases[runId];
    writeState(statePath, state);
    return true;
  });
}

export function quarantineProviderAccount({ provider, accountId, reasonCode, quarantineKind = 'temporary', until, runtimeDir, detail } = {}) {
  const { statePath, lockPath } = providerCapacityStatePaths(runtimeDir);
  return withFileLock(lockPath, () => {
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
  const { statePath, lockPath } = providerCapacityStatePaths(runtimeDir);
  return withFileLock(lockPath, () => {
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

// Pre-Phase-05 gate H1 / post-review-recut.md "Fault classifier correction":
// "quota/rate-limit -> account quarantine with parsed reset window when
// available, otherwise conservative long TTL". A quota quarantine must never
// resolve to a missing `until` -- isQuarantined() above now also fails
// closed on that case defensively, but the classifier is the one place that
// actually KNOWS "no reset window was parseable" and should say so plainly
// rather than lean on the defensive fallback silently.
const DEFAULT_QUOTA_QUARANTINE_TTL_MS = 60 * 60 * 1000; // 1 hour, conservative default reset window.

export function classifyProviderCapacityFault({ provider, stderr = '', adapterOutcome, structuredAgent, now = Date.now() } = {}) {
  const text = typeof stderr === 'string' ? stderr : '';
  const lower = text.toLowerCase();
  if (adapterOutcome === 'paused-limit' || structuredAgent?.stopReason === 'paused-limit') {
    // No stderr text to parse a reset window from at all in this branch --
    // always the conservative default, never an expiry-less quarantine.
    return {
      action: 'quarantine',
      reasonCode: 'quota-limit',
      quarantineKind: 'temporary',
      until: new Date(now + DEFAULT_QUOTA_QUARANTINE_TTL_MS).toISOString(),
    };
  }
  if (provider === 'openai-codex' || provider === undefined) {
    if (/you(?:'|’)ve hit your usage limit/i.test(text) || /usage limit has been reached/i.test(text) || /individual quota reached/i.test(text)) {
      const reset = /resets?\s+in\s+(\d+)\s*h/i.exec(text);
      // Missing/unparseable reset text falls back to the SAME conservative
      // default TTL -- never an expiry-less "temporary" quarantine, which
      // isQuarantined() would otherwise have to catch defensively instead.
      const until = reset
        ? new Date(now + Number(reset[1]) * 60 * 60 * 1000).toISOString()
        : new Date(now + DEFAULT_QUOTA_QUARANTINE_TTL_MS).toISOString();
      return { action: 'quarantine', reasonCode: 'quota-limit', quarantineKind: 'temporary', until };
    }
    if (/\b(login|auth|authentication|token)\b/i.test(lower) && /\b(failed|expired|invalid|required|missing|no api key)\b/i.test(lower)) {
      return { action: 'quarantine', reasonCode: 'auth-token', quarantineKind: 'manual-clear' };
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
