// attestation-store.mjs — persistent attestation records outside agent write grants (Phase 03 R6, spec §6.6).
//
// Ensures:
//   - Attestation records are stored in host storage outside all agent write grants,
//     preventing any dispatched agent from tampering with its own security record.
//   - Public events and results carry redacted references and digests only.
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
 * Resolves the host attestation store directory outside agent write grants.
 */
export function resolveAttestationStoreDir(context = {}) {
  if (process.env.FGOS_CONFINEMENT_ATTESTATION_STORE_PATH) {
    return path.resolve(process.env.FGOS_CONFINEMENT_ATTESTATION_STORE_PATH);
  }
  if (context.fgosDir) {
    return path.join(context.fgosDir, 'attestations');
  }
  return path.join(os.homedir(), '.fgos', 'attestations');
}

/**
 * Persist an attestation record outside agent write grants.
 */
export function saveAttestationRecord(attestation, context = {}) {
  validateAttestationCompleteness(attestation);

  const storeDir = resolveAttestationStoreDir(context);
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
