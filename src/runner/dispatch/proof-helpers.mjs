// src/runner/dispatch/proof-helpers.mjs — leaf module for cryptographic digests,
// canonical JSON serialization, fsynced immutable/mutable publication, and command envelopes.
//
// Extracted per Phase 09 R4 to decouple the Confinement Authority and execution adapters
// from the CLI spawn supervisor adapter layer.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { canonicalJson, installOnce, replaceDurably } from '../../native/door.mjs';

export { canonicalJson } from '../../native/door.mjs';

export function computeSha256Digest(value) {
  const serialized = typeof value === 'string' ? value : canonicalJson(value);
  return `sha256:${crypto.createHash('sha256').update(serialized).digest('hex')}`;
}

const FILE_HASH_CHUNK_BYTES = 1024 * 1024;

/**
 * Hex sha256 of a regular file's bytes, read in fixed-size chunks so memory
 * stays bounded regardless of file size. Symlinks are followed. Anything that
 * is not a regular file (directory, FIFO, socket, device) throws instead of
 * being read: a FIFO would block forever and a device can be endless. The open
 * is non-blocking so a FIFO swapped in after a caller's existence check still
 * cannot hang the process.
 */
export function sha256FileSync(filePath) {
  const nonBlock = fs.constants.O_NONBLOCK ?? 0;
  const fd = fs.openSync(filePath, fs.constants.O_RDONLY | nonBlock);
  try {
    if (!fs.fstatSync(fd).isFile()) {
      const err = new Error(`not a regular file: ${filePath}`);
      err.code = 'ENOTREGULAR';
      throw err;
    }
    const hash = crypto.createHash('sha256');
    const buf = Buffer.allocUnsafe(FILE_HASH_CHUNK_BYTES);
    let bytesRead;
    while ((bytesRead = fs.readSync(fd, buf, 0, buf.length, null)) > 0) {
      hash.update(buf.subarray(0, bytesRead));
    }
    return hash.digest('hex');
  } finally {
    fs.closeSync(fd);
  }
}

export function normalizeAgentName(raw, { maxLength = 32 } = {}) {
  const cleaned = String(raw ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (cleaned.length <= maxLength) return cleaned || 'fgos-agent';
  const hashLen = Math.min(8, Math.floor(maxLength / 2));
  const hash = crypto.createHash('sha1').update(cleaned).digest('hex').slice(0, hashLen);
  const head = maxLength - hashLen;
  return `${cleaned.slice(0, head)}${hash}`;
}

export function publishImmutableProof(targetPath, record) {
  const dir = path.dirname(targetPath);
  fs.mkdirSync(dir, { recursive: true });
  const content = typeof record === 'string' ? record : `${JSON.stringify(record, null, 2)}\n`;
  return installOnce(dir, path.basename(targetPath), content, 0o644) === 'created';
}

export function publishMutableProjection(targetPath, record) {
  const dir = path.dirname(targetPath);
  fs.mkdirSync(dir, { recursive: true });
  const content = typeof record === 'string' ? record : `${JSON.stringify(record, null, 2)}\n`;
  replaceDurably(dir, path.basename(targetPath), content, 0o644);
}

export function publishSecretSideFile(targetPath, record) {
  const dir = path.dirname(targetPath);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  try { fs.chmodSync(dir, 0o700); } catch {}
  const content = typeof record === 'string' ? record : JSON.stringify(record);
  fs.writeFileSync(targetPath, content, { mode: 0o600 });
  try { fs.chmodSync(targetPath, 0o600); } catch {}
}

export function consumeSecretSideFile(targetPath) {
  let parsed = null;
  try {
    parsed = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
  } catch {
    return null;
  } finally {
    try { fs.unlinkSync(targetPath); } catch {}
  }
  return parsed;
}

export const readSecretSideFile = consumeSecretSideFile;

export function updateCommandEnvelope({
  runDir,
  launchCommandId,
  controlEpoch,
  controlToken,
  envelopeDigest,
}) {
  const commandPath = path.join(runDir, 'controller', 'commands', `${launchCommandId}.json`);
  if (!fs.existsSync(commandPath)) {
    throw new Error(`Command state file "${commandPath}" does not exist.`);
  }
  const existing = JSON.parse(fs.readFileSync(commandPath, 'utf8'));
  const controlTokenDigest = computeSha256Digest(controlToken);
  if (existing.controlEpoch !== controlEpoch || existing.controlTokenDigest !== controlTokenDigest) {
    throw new Error(`Control token/epoch mismatch for command "${launchCommandId}".`);
  }
  if (existing.state !== 'pending') {
    throw new Error(`Cannot update envelope on command with state "${existing.state}".`);
  }

  const updated = {
    ...existing,
    envelopeDigest,
  };
  publishMutableProjection(commandPath, updated);
  return updated;
}

export function commitCommandOutcome({
  runDir,
  launchCommandId,
  controlEpoch,
  controlToken,
  outcome,
  state = 'reconciled',
  receiptDigest = null,
  bindingDigest = null,
  patch = {},
}) {
  const commandPath = path.join(runDir, 'controller', 'commands', `${launchCommandId}.json`);
  if (!fs.existsSync(commandPath)) {
    throw new Error(`Command state file "${commandPath}" does not exist.`);
  }
  const existing = JSON.parse(fs.readFileSync(commandPath, 'utf8'));
  if (controlToken !== undefined && controlToken !== null) {
    const controlTokenDigest = computeSha256Digest(controlToken);
    if (existing.controlEpoch !== controlEpoch || existing.controlTokenDigest !== controlTokenDigest) {
      throw new Error(`Control token/epoch mismatch for command "${launchCommandId}".`);
    }
  }

  const updated = {
    ...existing,
    ...patch,
    state,
    outcome,
    receiptDigest: receiptDigest ?? existing.receiptDigest,
    bindingDigest: bindingDigest ?? existing.bindingDigest,
  };
  publishMutableProjection(commandPath, updated);
  return updated;
}

export function patchCommandRecord({ runDir, launchCommandId, controlEpoch, controlToken, patch }) {
  const commandPath = path.join(runDir, 'controller', 'commands', `${launchCommandId}.json`);
  if (!fs.existsSync(commandPath)) {
    throw new Error(`Command state file "${commandPath}" does not exist.`);
  }
  const existing = JSON.parse(fs.readFileSync(commandPath, 'utf8'));
  if (controlToken !== undefined && controlToken !== null) {
    const controlTokenDigest = computeSha256Digest(controlToken);
    if (existing.controlEpoch !== controlEpoch || existing.controlTokenDigest !== controlTokenDigest) {
      throw new Error(`Control token/epoch mismatch for command "${launchCommandId}".`);
    }
  }
  const updated = { ...existing, ...patch };
  publishMutableProjection(commandPath, updated);
  return updated;
}

export function readCommandState(runDir, launchCommandId) {
  const commandPath = path.join(runDir, 'controller', 'commands', `${launchCommandId}.json`);
  if (!fs.existsSync(commandPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(commandPath, 'utf8'));
  } catch {
    return null;
  }
}
