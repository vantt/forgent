// Provider Capacity Rotator slice 1: account inventory, selector state,
// leases, classifier, and credential facts. This module deliberately stays
// inside an already-resolved provider; it never chooses provider/model/executor.

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { normalizeProviderFamily } from './provider-adapter.mjs';
import { getProcessStartTime, resolveHolderLiveness } from './process-identity.mjs';

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
      normalized[canonicalProvider].accounts[accountId] = {
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

// C2c: this used to retry on EEXIST purely by elapsed time, never reading
// the lock file's own {pid} back or checking whether that holder is still
// alive -- a crashed process's lock file (openSync succeeded, the process
// died before unlinkSync) held EVERY future lease/release/quarantine call
// hostage for the full waitMs, then threw the raw, uncaught EEXIST error.
// Now: on contention, read the holder's pid and reclaim (unlink) the lock
// immediately once liveness proves it dead, rather than waiting out the
// deadline for a holder that can never release it. A lock file that can't
// be read/parsed (mid-write, or from a version that wrote a different
// shape) is treated as unknown, not dead -- retried like a live holder,
// never force-reclaimed on a guess.
//
// S3 (dispatch-engine-liveness-hardening Phase 4): the dead-holder judgment
// above used to unlink unconditionally on the read taken at judgment time,
// with no re-check right before the unlink -- the audit reproduced this
// racing 17/25 trials: contender B reads the stale lock and decides to
// reclaim it, but before B's unlinkSync runs, contender C (working from the
// SAME stale read) already reclaimed it and re-acquired a FRESH lock; B's
// unlink then deletes C's live lock, letting B and C both enter fn()
// concurrently and clobber each other's state.json write. Fixed with the
// same re-read-immediately-before-unlink pattern main-checkout-lock.mjs's
// own `tryAcquireOnce` already uses (`:308-319`): re-read right before
// unlinking, and only unlink if the content is byte-identical to what was
// judged dead -- changed content means a fresh holder already claimed the
// path, so leave it alone and let this contender retry `openSync` instead.
// This narrows (does not theoretically eliminate) the race to the gap
// between the two back-to-back reads, matching main-checkout-lock.mjs's own
// accepted trade-off there (its own probe: 0/30 trials with real
// concurrent contenders). The stronger link-publish+generation pattern in
// run-lock.mjs is architecturally heavier (an append-only, never-unlinked
// generation ledger built for a different problem: tracking a history of
// holders, not guarding one mutex-style critical section) and would be a
// much larger diff for this single lock/critical-section use -- not
// justified here per KISS, since the audit itself names the re-read
// pattern as "adequate".
//
// Also closes the audit's own C2 gap for this specific lock ("pid-only, no
// start time"): the lock record now carries `startTime` (Phase 1's
// `getProcessStartTime`), and dead-holder judgment routes through Phase 1's
// consolidated judge (`resolveHolderLiveness`) instead of a bare
// `isPidAlive` check, so a pid reused by an unrelated process after the
// real holder died is correctly judged dead rather than mistaken for a
// live holder.
function withFileLock(lockPath, fn, { waitMs = 5000 } = {}) {
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  const deadline = Date.now() + waitMs;
  while (true) {
    let fd;
    try {
      fd = fs.openSync(lockPath, 'wx');
      fs.writeFileSync(fd, JSON.stringify({
        pid: process.pid,
        startTime: getProcessStartTime(process.pid),
        acquiredAt: new Date().toISOString(),
      }));
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
      if (err.code !== 'EEXIST') throw err;
      let raw = null;
      let holder = null;
      try {
        raw = fs.readFileSync(lockPath, 'utf8');
        holder = JSON.parse(raw);
      } catch {
        // Unreadable/mid-write: unknown, not dead -- fall through to the
        // normal wait/retry path below, same as a genuinely live holder.
      }
      const holderPid = Number.isInteger(holder?.pid) && holder.pid > 0 ? holder.pid : null;
      const knownDead = holderPid !== null
        && resolveHolderLiveness({ pid: holderPid, processStartTime: holder.startTime }, isPidAlive(holderPid)) === 'dead';
      if (knownDead) {
        // Re-read right before unlinking: the liveness probe above is the
        // slow window -- a competitor may have already reclaimed and
        // re-acquired this lock since `raw` was read. Changed content is a
        // live lock we must not touch.
        let current = null;
        try {
          current = fs.readFileSync(lockPath, 'utf8');
        } catch (err2) {
          if (err2.code !== 'ENOENT') throw err2;
        }
        if (current === raw) {
          try { fs.unlinkSync(lockPath); } catch (err2) {
            if (err2.code !== 'ENOENT') throw err2;
          }
        }
        continue; // Either we reclaimed it, or a fresh holder already owns it -- retry openSync either way.
      }
      if (Date.now() > deadline) {
        throw new ProviderCapacityLockError(
          `provider-capacity lock at "${lockPath}" is still held by a live process (pid ${holderPid ?? 'unknown'}) after ${waitMs}ms.`,
          { lockPath, holderPid },
        );
      }
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

export function isPidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM';
  }
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
// through Phase 1's consolidated judge instead of a bare `isPidAlive` call,
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
        && resolveHolderLiveness({ pid: lease.pid, processStartTime: lease.processStartTime }, isPidAlive(lease.pid)) === 'dead';
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

// C2c doctor support: a pure read (never opens/writes/unlinks the lock
// itself -- that mutation stays inside withFileLock's own reclaim path)
// so `fgos doctor`'s provider-capacity-lock-stale check can report a lock
// file whose recorded holder pid is provably dead without racing a real
// lease/release/quarantine call for the same lock.
export function inspectProviderCapacityLock(runtimeDir) {
  const { lockPath } = providerCapacityStatePaths(runtimeDir);
  if (!fs.existsSync(lockPath)) {
    return { present: false, lockPath, holderPid: null, holderAlive: null };
  }
  let holderPid = null;
  try {
    holderPid = JSON.parse(fs.readFileSync(lockPath, 'utf8'))?.pid ?? null;
  } catch {
    return { present: true, lockPath, holderPid: null, holderAlive: null };
  }
  const holderAlive = Number.isInteger(holderPid) && holderPid > 0 ? isPidAlive(holderPid) : null;
  return { present: true, lockPath, holderPid, holderAlive };
}

// Pre-Phase-05 gate H1 / post-review-recut.md "Fault classifier correction":
// "quota/rate-limit -> account quarantine with parsed reset window when
// available, otherwise conservative long TTL". A quota quarantine must never
// resolve to a missing `until` -- isQuarantined() above now also fails
// closed on that case defensively, but the classifier is the one place that
// actually KNOWS "no reset window was parseable" and should say so plainly
// rather than lean on the defensive fallback silently.
const DEFAULT_QUOTA_QUARANTINE_TTL_MS = 60 * 60 * 1000; // 1 hour, conservative default reset window.

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
  if (provider === 'openai' || provider === 'openai-codex') {
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
