// friction-client.mjs — Thin Node client for Observe friction writer (Lane B - Phase F5).
// Calls Rust host CLI: `fgos friction record` and `fgos friction resolve`.
// Write errors are side-channel / best-effort: failure logs to invocation-faults.jsonl
// and emits stderr warning, never throwing into core workflow operations.
// Programming/validation errors still throw so tests catch them.

import path from 'node:path';
import { invokeHost } from '../util/host-bin.mjs';
import { recordInvocationFault } from '../cli/invocation-fault-log.mjs';
import { fgosDirFromRoot } from '../runner/paths.mjs';

const PUBLISHED_LAYERS = new Set([
  'verification',
  'state',
  'environment',
  'docs',
  'task',
  'task-spec',
  'executor',
  'attestation',
  'context',
]);

const PUBLISHED_DISPOSITIONS = new Set(['advisory', 'blocked', 'parked', 'halted']);

const VALID_DOC_TYPES = new Set(['tutorial', 'how-to', 'reference', 'explanation']);

const VALID_RESOLVE_REASONS = new Set(['answer', 'done', 'wontfix', 'clarify-pass', 'migrated']);

function resolveFgosDir(dir) {
  if (!dir) return null;
  if (dir.endsWith('.fgos')) return dir;
  return fgosDirFromRoot(dir) || path.join(dir, '.fgos');
}

/**
 * Record a friction event via Observe Rust host writer.
 *
 * @param {string|object} dirOrOptions
 * @param {object} [maybePayload]
 */
export function recordFriction(dirOrOptions, maybePayload) {
  let dir;
  let payload;

  if (typeof dirOrOptions === 'string') {
    dir = dirOrOptions;
    payload = maybePayload || {};
  } else if (dirOrOptions && typeof dirOrOptions === 'object') {
    payload = dirOrOptions;
    dir = dirOrOptions.dir || process.cwd();
  } else {
    throw new TypeError('recordFriction: invalid arguments');
  }

  const { id } = payload;
  if (!id || typeof id !== 'string' || !id.trim()) {
    const err = new Error('friction requires a non-empty "id".');
    err.name = 'StoreError';
    err.category = 'validation';
    throw err;
  }

  const layer = payload.layer || 'state';
  if (!PUBLISHED_LAYERS.has(layer)) {
    const err = new Error(`invalid layer "${layer}". Published layers: ${Array.from(PUBLISHED_LAYERS).join(', ')}`);
    err.name = 'StoreError';
    err.category = 'validation';
    throw err;
  }

  const disposition = payload.disposition || 'advisory';
  if (!PUBLISHED_DISPOSITIONS.has(disposition)) {
    const err = new Error(`invalid disposition "${disposition}". Allowed dispositions: ${Array.from(PUBLISHED_DISPOSITIONS).join(', ')}`);
    err.name = 'StoreError';
    err.category = 'validation';
    throw err;
  }

  if (payload.docType !== undefined && payload.docType !== null && !VALID_DOC_TYPES.has(payload.docType)) {
    const err = new Error(`payload.docType "${payload.docType}" must be one of: ${Array.from(VALID_DOC_TYPES).join(', ')}`);
    err.name = 'StoreError';
    err.category = 'validation';
    throw err;
  }

  const errorClass = payload.errorClass || 'unknown';
  const producer = payload.producer || 'work';
  const detail = payload.detail != null ? String(payload.detail) : '';

  const args = [
    'friction',
    'record',
    '--subject',
    `work:${id}`,
    '--layer',
    layer,
    '--error-class',
    errorClass,
    '--disposition',
    disposition,
    '--producer',
    producer,
    '--detail-stdin',
  ];

  if (typeof payload.attempts === 'number') {
    args.push('--attempts', String(payload.attempts));
  }
  if (payload.docType) {
    args.push('--doc-type', payload.docType);
  }

  try {
    return invokeHost(args, { input: detail, dir });
  } catch (err) {
    const fgosDir = resolveFgosDir(dir);
    const code = err.code || 'host-exec-error';
    recordInvocationFault({
      fgosDir,
      cwd: dir,
      verb: 'friction',
      faultClass: 'friction-write-failed',
      message: `${code}: ${err.message}`,
      argv: args,
    });
    console.error(`fgos: warning: friction write failed [${code}]: ${err.message}`);
    return null;
  }
}

/**
 * Resolve an existing friction event for a work item via Observe Rust host writer.
 *
 * @param {string|object} dirOrOptions
 * @param {object} [maybeOptions]
 */
export function resolveFriction(dirOrOptions, maybeOptions) {
  let dir;
  let opts;

  if (typeof dirOrOptions === 'string') {
    dir = dirOrOptions;
    opts = maybeOptions || {};
  } else if (dirOrOptions && typeof dirOrOptions === 'object') {
    opts = dirOrOptions;
    dir = dirOrOptions.dir || process.cwd();
  } else {
    throw new TypeError('resolveFriction: invalid arguments');
  }

  const { id, reason, by = 'work' } = opts;
  if (!id || typeof id !== 'string' || !id.trim()) {
    const err = new Error('resolveFriction requires a non-empty "id".');
    err.name = 'StoreError';
    err.category = 'validation';
    throw err;
  }

  if (!reason || typeof reason !== 'string' || !VALID_RESOLVE_REASONS.has(reason)) {
    const err = new Error(`resolveFriction: invalid reason "${reason}". Allowed reasons: ${Array.from(VALID_RESOLVE_REASONS).join(', ')}`);
    err.name = 'StoreError';
    err.category = 'validation';
    throw err;
  }

  const args = [
    'friction',
    'resolve',
    '--subject',
    `work:${id}`,
    '--reason',
    reason,
    '--by',
    by,
  ];

  try {
    return invokeHost(args, { dir });
  } catch (err) {
    const fgosDir = resolveFgosDir(dir);
    const code = err.code || 'host-exec-error';
    recordInvocationFault({
      fgosDir,
      cwd: dir,
      verb: 'friction',
      faultClass: 'friction-write-failed',
      message: `${code}: ${err.message}`,
      argv: args,
    });
    console.error(`fgos: warning: friction resolve failed [${code}]: ${err.message}`);
    return null;
  }
}
