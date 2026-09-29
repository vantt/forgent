// attestation-store.mjs — persistent attestation records outside agent write grants (Phase 03 R6, spec §6.6).
//
// Ensures:
//   - Attestation records are stored in host storage outside all agent write grants,
//     preventing any dispatched agent from tampering with its own security record.
//   - Public events and results carry redacted references and digests only.
//     (Phase 04 H11: this now also covers authority.mjs's own
//     authority-prepared-invocation.v1 and cli-spawn-launch-envelope.v2
//     records -- their `env` field is an allow-list, never the real spawn
//     env; the real env lives only in a 0600 side file the supervisor
//     reads once and deletes, see authority.mjs's `redactEnvForPersistence`
//     and detached-run-supervisor.mjs's `publishSecretSideFile`.)
//   - Attestation schema covers all four phases: prepared, completed, failed, refused.
//   - Channels completeness: filesystem, inherited-fd, stdio, host-ipc, network.

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const ATTESTATION_CONTRACT = 'confinement-attestation.v1';
export const ATTESTATION_REF_CONTRACT = 'confinement-attestation-ref.v1';
export const REQUIRED_CHANNELS = Object.freeze([
  'filesystem',
  'inherited-fd',
  'stdio',
  'host-ipc',
  'network',
]);
export const VALID_PHASES = Object.freeze(['prepared', 'completed', 'failed', 'refused']);
export const VALID_OUTCOMES = Object.freeze(['enforced', 'unconfined', 'degraded', 'refused', 'unknown']);

export class AttestationStoreError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AttestationStoreError';
  }
}

/**
 * Validate ConfinementAttestationV1 schema completeness (R6 verification).
 */
export function validateAttestationCompleteness(attestation) {
  if (!attestation || typeof attestation !== 'object' || Array.isArray(attestation)) {
    throw new AttestationStoreError('attestation must be an object.');
  }
  if (attestation.contract !== ATTESTATION_CONTRACT) {
    throw new AttestationStoreError(`attestation contract must be "${ATTESTATION_CONTRACT}", got "${attestation.contract}".`);
  }
  if (!attestation.dispatchId || typeof attestation.dispatchId !== 'string') {
    throw new AttestationStoreError('attestation dispatchId must be a non-empty string.');
  }
  if (!VALID_PHASES.includes(attestation.phase)) {
    throw new AttestationStoreError(`attestation phase must be one of ${VALID_PHASES.join('/')}, got "${attestation.phase}".`);
  }
  if (!VALID_OUTCOMES.includes(attestation.outcome)) {
    throw new AttestationStoreError(`attestation outcome must be one of ${VALID_OUTCOMES.join('/')}, got "${attestation.outcome}".`);
  }

  // Channels completeness verification
  if (!Array.isArray(attestation.channels)) {
    throw new AttestationStoreError('attestation channels must be an array.');
  }
  const seenChannels = new Set(attestation.channels.map((c) => c?.name));
  for (const reqChannel of REQUIRED_CHANNELS) {
    if (!seenChannels.has(reqChannel)) {
      throw new AttestationStoreError(`attestation channels is missing required channel "${reqChannel}".`);
    }
  }

  return true;
}

/**
 * Verifies that the attestation store directory does not overlap ANY resource
 * granted write access to the confined process (Phase 03 H1 fix, R6).
 * Fails closed (throws AttestationStoreError) if storeDir is inside, contains,
 * or equals any writable resource path.
 */
export function verifyAttestationStoreIsolation(storeDir, resources = []) {
  if (!storeDir || typeof storeDir !== 'string') {
    throw new AttestationStoreError('attestation storeDir must be a non-empty string.');
  }

  const absStore = path.resolve(storeDir);
  let realStore = absStore;
  try {
    if (fs.existsSync(absStore)) {
      realStore = fs.realpathSync(absStore);
    } else {
      let ancestor = path.dirname(absStore);
      let tail = path.basename(absStore);
      while (ancestor !== path.dirname(ancestor) && !fs.existsSync(ancestor)) {
        tail = path.join(path.basename(ancestor), tail);
        ancestor = path.dirname(ancestor);
      }
      if (fs.existsSync(ancestor)) {
        realStore = path.join(fs.realpathSync(ancestor), tail);
      }
    }
  } catch {
    realStore = absStore;
  }

  for (const res of resources) {
    const isWritable = res.access === 'write' || res.access === 'read-write';
    if (!isWritable) continue;

    const targetPath = res.hostTarget || res.executionTarget?.path;
    if (!targetPath) continue;

    const absTarget = path.resolve(targetPath);
    let realTarget = absTarget;
    try {
      if (fs.existsSync(absTarget)) {
        realTarget = fs.realpathSync(absTarget);
      } else {
        let ancestor = path.dirname(absTarget);
        let tail = path.basename(absTarget);
        while (ancestor !== path.dirname(ancestor) && !fs.existsSync(ancestor)) {
          tail = path.join(path.basename(ancestor), tail);
          ancestor = path.dirname(ancestor);
        }
        if (fs.existsSync(ancestor)) {
          realTarget = path.join(fs.realpathSync(ancestor), tail);
        }
      }
    } catch {
      realTarget = absTarget;
    }

    const isSame = realStore === realTarget;
    const storeInsideTarget = realStore.startsWith(realTarget.endsWith(path.sep) ? realTarget : realTarget + path.sep);
    const targetInsideStore = realTarget.startsWith(realStore.endsWith(path.sep) ? realStore : realStore + path.sep);

    if (isSame || storeInsideTarget || targetInsideStore) {
      throw new AttestationStoreError(
        `attestation store directory "${realStore}" overlaps with writable resource "${res.resource}" at "${realTarget}" (fail closed).`,
      );
    }
  }

  return true;
}

/**
 * Refuse to persist an attestation anywhere a confined process can write.
 */
export function assertAttestationStoreIsolated(context = {}, resources = []) {
  const storeDir = resolveAttestationStoreDir(context);
  verifyAttestationStoreIsolation(storeDir, resources);
  return storeDir;
}

/**
 * Resolves the host attestation store directory outside agent write grants.
 * Store default is user-machine state, never project-local .fgos state.
 */
export function resolveAttestationStoreDir(context = {}) {
  if (process.env.FGOS_CONFINEMENT_ATTESTATION_STORE_PATH) {
    return path.resolve(process.env.FGOS_CONFINEMENT_ATTESTATION_STORE_PATH);
  }
  if (context.attestationStoreDir) {
    return path.resolve(context.attestationStoreDir);
  }
  return path.join(process.env.XDG_STATE_HOME || path.join(os.homedir(), '.local', 'state'), 'fgos', 'attestations');
}

/**
 * Persist an attestation record outside agent write grants.
 */
export function saveAttestationRecord(attestation, context = {}) {
  validateAttestationCompleteness(attestation);

  const storeDir = resolveAttestationStoreDir(context);
  if (Array.isArray(attestation.resources) && attestation.resources.length > 0) {
    verifyAttestationStoreIsolation(storeDir, attestation.resources);
  }

  fs.mkdirSync(storeDir, { recursive: true });

  const fileName = `${attestation.dispatchId}.${attestation.phase}.json`;
  const filePath = path.join(storeDir, fileName);
  const tmpPath = `${filePath}.tmp.${Date.now()}`;

  fs.writeFileSync(tmpPath, JSON.stringify(attestation, null, 2), 'utf8');
  fs.renameSync(tmpPath, filePath);

  return {
    path: filePath,
    dispatchId: attestation.dispatchId,
    phase: attestation.phase,
  };
}

/**
 * Persist plan record outside agent write grants.
 */
export function savePlanRecord(plan, context = {}) {
  if (!plan || !plan.dispatchId) {
    throw new AttestationStoreError('plan must have dispatchId.');
  }
  const storeDir = resolveAttestationStoreDir(context);
  if (Array.isArray(plan.resources) && plan.resources.length > 0) {
    verifyAttestationStoreIsolation(storeDir, plan.resources);
  }

  fs.mkdirSync(storeDir, { recursive: true });

  const fileName = `${plan.dispatchId}.plan.json`;
  const filePath = path.join(storeDir, fileName);
  const tmpPath = `${filePath}.tmp.${Date.now()}`;

  fs.writeFileSync(tmpPath, JSON.stringify(plan, null, 2), 'utf8');
  fs.renameSync(tmpPath, filePath);

  return { path: filePath, dispatchId: plan.dispatchId };
}

/**
 * Load attestation record by dispatchId and phase.
 */
export function loadAttestationRecord(dispatchId, phase = 'completed', context = {}) {
  const storeDir = resolveAttestationStoreDir(context);
  const fileName = `${dispatchId}.${phase}.json`;
  const filePath = path.join(storeDir, fileName);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  validateAttestationCompleteness(parsed);
  return parsed;
}

/**
 * Create redacted public attestation reference (R6).
 * Strips raw env, credentials, and sensitive paths; provides digest and reference only.
 */
export function createRedactedAttestationReference(attestation) {
  validateAttestationCompleteness(attestation);

  const canonicalJson = JSON.stringify({
    contract: attestation.contract,
    dispatchId: attestation.dispatchId,
    phase: attestation.phase,
    outcome: attestation.outcome,
    coverage: attestation.coverage,
    effectiveControls: attestation.effectiveControls,
    mismatches: attestation.mismatches,
  });

  const digest = crypto.createHash('sha256').update(canonicalJson).digest('hex');

  return {
    contract: ATTESTATION_REF_CONTRACT,
    dispatchId: attestation.dispatchId,
    phase: attestation.phase,
    outcome: attestation.outcome,
    digest: `sha256:${digest}`,
    ref: `attestation:${attestation.dispatchId}:${attestation.phase}`,
    mismatches: Array.isArray(attestation.mismatches)
      ? attestation.mismatches.map((m) => (typeof m === 'object' ? m.code : m))
      : [],
  };
}

// --- Falsification probe cache (R9 / Performance Audit) ---------------------

export const DEFAULT_PROBE_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const inMemoryProbeCache = new Map();

function probeFingerprintDigest(fingerprint) {
  return crypto.createHash('sha256').update(JSON.stringify(fingerprint)).digest('hex');
}

function probeCachePath(storeDir, fpDigest) {
  return path.join(storeDir, `probe-${fpDigest}.json`);
}

export function clearProbeCache() {
  inMemoryProbeCache.clear();
}

/**
 * Save successful probe result into attestation store keyed by fingerprint.
 */
export function saveProbeCacheRecord(fingerprint, probeResult, context = {}, { now = Date.now() } = {}) {
  if (!probeResult || !probeResult.passed) return null;
  const fpDigest = probeFingerprintDigest(fingerprint);
  const nowMs = typeof now === 'number' ? now : Date.parse(now);
  const record = {
    contract: 'confinement-probe-cache.v1',
    fingerprint,
    fpDigest,
    passed: true,
    passedAt: new Date(nowMs).toISOString(),
    passedAtMs: nowMs,
    message: probeResult.message,
    results: probeResult.results,
  };

  inMemoryProbeCache.set(fpDigest, record);

  try {
    const storeDir = resolveAttestationStoreDir(context);
    fs.mkdirSync(storeDir, { recursive: true });
    const filePath = probeCachePath(storeDir, fpDigest);
    const tmpPath = `${filePath}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpPath, JSON.stringify(record, null, 2), 'utf8');
    fs.renameSync(tmpPath, filePath);
  } catch {
    // Best-effort disk persistence
  }

  return record;
}

/**
 * Load probe cache from memory or attestation store if fresh within TTL.
 */
export function loadProbeCacheRecord(fingerprint, context = {}, { ttlMs = DEFAULT_PROBE_CACHE_TTL_MS, now = Date.now() } = {}) {
  const fpDigest = probeFingerprintDigest(fingerprint);
  const nowMs = typeof now === 'number' ? now : Date.parse(now);

  // Check in-memory cache first
  const mem = inMemoryProbeCache.get(fpDigest);
  if (mem && mem.passed && nowMs - mem.passedAtMs <= ttlMs) {
    return {
      passed: true,
      message: mem.message,
      results: mem.results,
      passedAt: mem.passedAt,
      cached: true,
    };
  }

  // Check persistent attestation store on disk
  try {
    const storeDir = resolveAttestationStoreDir(context);
    const filePath = probeCachePath(storeDir, fpDigest);
    if (!fs.existsSync(filePath)) return null;

    const raw = fs.readFileSync(filePath, 'utf8');
    const record = JSON.parse(raw);
    if (!record || !record.passed) return null;
    const passedAtMs = record.passedAtMs || (record.passedAt ? Date.parse(record.passedAt) : NaN);
    if (!Number.isFinite(passedAtMs) || (nowMs - passedAtMs > ttlMs)) {
      return null;
    }
    inMemoryProbeCache.set(fpDigest, record);
    return {
      passed: true,
      message: record.message,
      results: record.results,
      passedAt: record.passedAt,
      cached: true,
    };
  } catch {
    return null;
  }
}
