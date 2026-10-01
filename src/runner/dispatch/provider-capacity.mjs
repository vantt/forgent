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
    // A directory of append-only generation records (dispatch-engine-
    // liveness-hardening Phase 4 round 2), not a single lock file -- see
    // withFileLock's own header comment for why.
    lockDir: path.join(runtimeDir, 'state-lock'),
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
// Now: on contention, read the holder's identity and reclaim the lock
// immediately once liveness proves it dead, rather than waiting out the
// deadline for a holder that can never release it.
//
// S3 (dispatch-engine-liveness-hardening Phase 4, round 2): round 1 fixed
// the single-lock-file design with a re-read-immediately-before-unlink
// guard (matching main-checkout-lock.mjs's own `tryAcquireOnce` pattern,
// `:308-319`). That guard closed the gap between JUDGING a holder dead and
// RE-READING to confirm nothing changed -- but `fs.unlinkSync` itself has
// no compare-and-swap semantics: it deletes whatever is CURRENTLY at the
// path, regardless of what the caller most recently read. A real
// marker-file exclusivity probe (this phase's own test, `markerPath` in
// the S3 race test below) proved a genuine window remained: contender A
// re-reads, sees the still-stale content, and is about to call
// `unlinkSync`; in the few microseconds before that call actually runs,
// contender B (which ALSO re-read the same still-stale content, since
// neither had unlinked yet) unlinks first and re-acquires a FRESH live
// lock; A's own unlink then fires a moment later and deletes B's live lock
// out from under it, letting a THIRD contender in concurrently. Measured:
// 2/20 trials with a genuine double-critical-section-entry via the marker
// probe, and separately confirmed independently by this track's own Lead
// under real load. No amount of re-reading closes this: as long as the
// reclaim path is "read, decide, THEN unlink" as two separate steps, a
// third party can always interleave between the last read and the mutating
// unlink, because plain `unlink(2)` has no way to say "only if it still
// looks like X".
//
// Fixed by switching the RECLAIM decision itself onto a genuinely atomic
// primitive: an append-only generation ledger (`acquireGenerationLock`/
// `releaseGenerationLock` below), the same pattern `run-lock.mjs` already
// proves correct for Run control-epoch fencing -- reimplemented locally
// here (not imported) because `run-lock.mjs` is on this repo's own banned
// list for `provider-capacity.mjs`'s import graph
// (`test/runner/dispatch-reconciliation-import-graph.test.mjs`'s
// `BANNED_FILES`, which documents `provider-capacity.mjs` as a PROVEN LEAF
// with "no further relative imports to walk" -- reachable from
// `reconcile.mjs`'s own quarantine-clear action, which must never pull in
// `run-lock.mjs`'s own ledger-writer machinery). Nothing here ever unlinks
// or overwrites a published generation record while it could still be the
// current one: each acquisition attempt publishes a NEW, higher-numbered
// record via an EXCLUSIVE hard link (`fs.linkSync`, atomic, EEXIST if a
// concurrent contender already published that exact number) -- the
// mutating step IS the arbiter of who wins, not a separate belief formed
// from an earlier read, so there is no window for a third party to
// interleave. A dead holder is reclaimed by simply publishing the NEXT
// generation (never deleting the dead one); every contender who loses that
// race rereads the ledger fresh and re-decides against the real winner.
// Published records are NEVER deleted or reused, deliberately -- an earlier
// version of this fix pruned superseded generations to bound this
// high-frequency lock's own directory growth, but that reopened a
// different real race (see `acquireGenerationLock`'s own header comment):
// freeing an epoch NUMBER for reuse lets a contender that computed it long
// ago, then got preempted, reclaim it long after it's obsolete. The
// resulting unbounded directory growth is a named, deferred trade-off, not
// a silently accepted one -- see that same comment.
const GENERATION_FILE_RE = /^(\d{10})\.json$/;

function generationFileName(epoch) {
  return `${String(epoch).padStart(10, '0')}.json`;
}

function writeFsyncedTemp(dir, content) {
  const tmpPath = path.join(dir, `.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const fd = fs.openSync(tmpPath, 'w');
  try {
    fs.writeSync(fd, content);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  return tmpPath;
}

function removeBestEffort(filePath) {
  try {
    fs.unlinkSync(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

// Distinguishes "this exact file never existed / was removed" (ENOENT) from
// "the file exists but its content is unparseable" -- currentGeneration
// below needs that distinction to tell a genuine race apart from genuinely
// corrupt content (see its own header comment).
function readGenerationFile(filePath) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return { present: false };
    throw err;
  }
  try {
    return { present: true, record: JSON.parse(raw) };
  } catch {
    // A record this primitive published is always complete (fsynced temp +
    // atomic link); unparseable content here can only mean something else
    // wrote into this directory. Treated as absent, never authoritative.
    return { present: true, record: null };
  }
}

function parseGenerationFile(filePath) {
  const result = readGenerationFile(filePath);
  return result.present ? result.record : null;
}

// S3 round 2 follow-up (found by Lead's own real-load reproduction after
// round 2's first pass): `readdirSync` (the LIST) and the per-file
// `readFileSync` (the READ) below are two separate steps with real
// wall-clock time between them -- if THIS process gets preempted (CPU
// starvation under real contention) in that gap, a DIFFERENT contender's
// `pruneOldGenerations` can delete every generation this listing named
// (pruning only ever deletes generations strictly below whichever NEW one
// its own caller just won, so if everything in OUR stale listing vanished,
// a newer generation is GUARANTEED to now exist). The original version
// read that as "the ledger is empty" and returned null, letting the caller
// fall back to `nextEpoch = 1` -- re-winning an already-pruned, long-
// forgotten epoch number that nobody else is watching anymore, running
// concurrently with the REAL current holder (confirmed via a direct
// marker-file trace: two live holders, epoch 1 and epoch 5, active at the
// same instant). Fixed by re-listing whenever every named candidate turns
// out to have vanished, instead of concluding "empty": that can only
// happen via exactly this race (a genuinely un-contended, truly-empty
// ledger has nothing in the listing to begin with, so `epochs.length === 0`
// already returns null without ever reaching this branch). Guaranteed to
// terminate: each retry either finds a real winner or advances past
// whichever concurrent prune caused this iteration's miss.
function currentGeneration(lockDir) {
  for (;;) {
    let names;
    try {
      names = fs.readdirSync(lockDir);
    } catch (err) {
      if (err.code === 'ENOENT') return null;
      throw err;
    }
    const epochs = [];
    for (const name of names) {
      const match = GENERATION_FILE_RE.exec(name);
      if (match) epochs.push(Number(match[1]));
    }
    if (epochs.length === 0) return null;
    let best = null;
    let anyVanished = false;
    for (const epoch of epochs) {
      const result = readGenerationFile(path.join(lockDir, generationFileName(epoch)));
      if (!result.present) {
        anyVanished = true;
        continue;
      }
      if (result.record === null) continue; // genuinely corrupt, not a race -- never authoritative.
      if (best === null || epoch > best.epoch) best = { epoch, record: result.record };
    }
    if (best !== null) return best;
    // Defensive, not currently load-bearing: nothing in this file's own
    // acquire/release path deletes a published generation record anymore
    // (see acquireGenerationLock's own header comment for why pruning was
    // removed) -- but this loop stays correct even if some future change,
    // or something external, ever does remove one mid-read, rather than
    // silently trusting readdir+read to be atomic together.
    if (anyVanished) continue; // Every listed candidate vanished since we listed -- a newer generation may now exist; re-list.
    return null; // Listing had generation-pattern names, but every one genuinely failed to parse (corrupt) -- treat as empty.
  }
}

function isGenerationHeld(current) {
  if (!current || current.record.releasedAt) return false;
  const holderPid = Number.isInteger(current.record.holder?.pid) && current.record.holder.pid > 0
    ? current.record.holder.pid
    : null;
  if (holderPid === null) return false;
  return resolveHolderLiveness(
    { pid: holderPid, processStartTime: current.record.holder.processStartTime },
    isPidAlive(holderPid),
  ) === 'held';
}

// S3 round 2 follow-up #2 (found by Lead's own real-load reproduction,
// after follow-up #1 above): the first version of this function pruned
// (deleted) every generation strictly below the one it just won, right
// after winning, to bound this high-frequency lock's own directory growth.
// That reintroduced exactly the class of bug this whole redesign exists to
// remove: `fs.linkSync`'s exclusivity only guarantees ONE winner for a
// given epoch NUMBER -- it says nothing about a number that was already
// used, released, and superseded, then FREED UP AGAIN by a delete. A
// contender that read `current` and computed `nextEpoch = N` long ago, then
// got CPU-preempted before actually calling `fs.linkSync`, can wake up
// after epoch N has since been won, released, superseded by epoch N+1 (or
// higher), AND pruned -- and its now-stale `fs.linkSync` for epoch N
// SUCCEEDS again (the path is free once more), granting it the lock
// concurrently with the real current holder. Confirmed via the direct
// marker-file trace: epoch 2 (a re-win of an already-superseded number) and
// epoch 3 (the real current holder) both live at the same instant. This is
// NOT a narrower version of the original TOCTOU -- it is a structurally
// different bug pruning itself introduces, and it is why run-lock.mjs's own
// generation ledger documents "nothing here ever unlinks or overwrites a
// published record" as a hard invariant, not a style choice. Fixed by
// removing pruning entirely, matching that invariant exactly: an epoch
// number, once published, is NEVER freed for reuse, so a stale contender's
// belated `fs.linkSync` for an old number always correctly fails EEXIST
// (the record is still there) rather than spuriously succeeding.
//
// Trade-off, named rather than silently accepted: this lock's own directory
// now grows by one small JSON record per acquisition, unbounded, for as
// long as a host runs (unlike run-lock.mjs's own per-Run scope, which is
// naturally bounded by Run lifetime). At realistic dispatch volumes this is
// a slow, low-priority disk-hygiene concern, not a correctness one -- a
// SEPARATE, out-of-band maintenance sweep (e.g. a future `fgos doctor` fix
// action, deleting only generations both non-current AND older than a
// conservative age floor far beyond any realistic scheduling delay) would
// be safe to add later without reopening this exact race, but is out of
// this phase's own scope and not implemented here.
function acquireGenerationLock(lockDir, holder, deadline) {
  fs.mkdirSync(lockDir, { recursive: true });
  for (;;) {
    const current = currentGeneration(lockDir);
    if (isGenerationHeld(current)) {
      if (Date.now() > deadline) {
        throw new ProviderCapacityLockError(
          `provider-capacity lock at "${lockDir}" is still held by a live process (pid ${current.record.holder.pid}) after waiting.`,
          { lockPath: lockDir, holderPid: current.record.holder.pid },
        );
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);
      continue;
    }
    const nextEpoch = (current?.epoch ?? 0) + 1;
    const targetPath = path.join(lockDir, generationFileName(nextEpoch));
    const tmpPath = writeFsyncedTemp(lockDir, JSON.stringify({ holder, acquiredAt: new Date().toISOString() }));
    try {
      fs.linkSync(tmpPath, targetPath);
    } catch (err) {
      removeBestEffort(tmpPath);
      if (err.code !== 'EEXIST') throw err;
      continue; // Lost the race for this epoch -- reread and re-decide against the real winner.
    }
    removeBestEffort(tmpPath);
    return nextEpoch;
  }
}

function releaseGenerationLock(lockDir, epoch) {
  const filePath = path.join(lockDir, generationFileName(epoch));
  const record = parseGenerationFile(filePath);
  if (record === null) return;
  // Atomic replace (write-temp + rename, same discipline as writeState
  // below), never an in-place mutation -- a concurrent reader must always
  // see either the pre-release or fully-released content, never torn JSON.
  const tmpPath = writeFsyncedTemp(lockDir, JSON.stringify({ ...record, releasedAt: new Date().toISOString() }));
  fs.renameSync(tmpPath, filePath);
}

// Exported for direct exclusivity testing (a marker-file-style probe run
// INSIDE `fn`, independent of any downstream symptom like a lost
// state.json write) -- every other caller in this file reaches it only
// through acquireProviderAccountLease/releaseProviderAccountLease/
// quarantineProviderAccount/clearProviderAccountQuarantine.
export function withFileLock(lockDir, fn, { waitMs = 5000 } = {}) {
  const deadline = Date.now() + waitMs;
  const holder = { pid: process.pid, processStartTime: getProcessStartTime(process.pid) };
  const epoch = acquireGenerationLock(lockDir, holder, deadline);
  try {
    return fn();
  } finally {
    releaseGenerationLock(lockDir, epoch);
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
  const { statePath, lockDir } = providerCapacityStatePaths(runtimeDir);
  return withFileLock(lockDir, () => {
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
  const { statePath, lockDir } = providerCapacityStatePaths(runtimeDir);
  return withFileLock(lockDir, () => {
    const state = readState(statePath);
    const leases = state.providers?.[provider]?.accounts?.[accountId]?.leases;
    if (!leases?.[runId]) return false;
    delete leases[runId];
    writeState(statePath, state);
    return true;
  });
}

export function quarantineProviderAccount({ provider, accountId, reasonCode, quarantineKind = 'temporary', until, runtimeDir, detail } = {}) {
  const { statePath, lockDir } = providerCapacityStatePaths(runtimeDir);
  return withFileLock(lockDir, () => {
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
  const { statePath, lockDir } = providerCapacityStatePaths(runtimeDir);
  return withFileLock(lockDir, () => {
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

// C2c doctor support: a pure read (never publishes/prunes a generation
// itself -- that mutation stays inside withFileLock's own acquire/release
// path) so `fgos doctor`'s provider-capacity-lock-stale check can report a
// lock whose recorded holder pid is provably dead without racing a real
// lease/release/quarantine call for the same lock. Phase 4 round 2: the
// lock is now a generation-ledger directory, not a single file -- "present"
// means the CURRENT (highest-epoch) generation exists and is not yet
// released; a released or absent ledger reads as `present: false`, matching
// this check's original "no lock file" meaning.
export function inspectProviderCapacityLock(runtimeDir) {
  const { lockDir } = providerCapacityStatePaths(runtimeDir);
  const current = currentGeneration(lockDir);
  if (!current || current.record.releasedAt) {
    return { present: false, lockPath: lockDir, holderPid: null, holderAlive: null };
  }
  const holderPid = Number.isInteger(current.record.holder?.pid) && current.record.holder.pid > 0
    ? current.record.holder.pid
    : null;
  if (holderPid === null) {
    return { present: true, lockPath: lockDir, holderPid: null, holderAlive: null };
  }
  const holderAlive = resolveHolderLiveness(
    { pid: holderPid, processStartTime: current.record.holder.processStartTime },
    isPidAlive(holderPid),
  ) === 'held';
  return { present: true, lockPath: lockDir, holderPid, holderAlive };
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
  if (adapterOutcome === 'paused-limit' || adapterOutcome === 'provider-limit' || structuredAgent?.stopReason === 'paused-limit' || structuredAgent?.stopReason === 'provider-limit') {
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
