// src/runner/dispatch/proof-helpers.mjs — leaf module for cryptographic digests,
// canonical JSON serialization, fsynced immutable/mutable publication, and command envelopes.
//
// Extracted per Phase 09 R4 to decouple the Confinement Authority and execution adapters
// from the CLI spawn supervisor adapter layer.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function canonicalJson(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map((elem) => canonicalJson(elem)).join(',') + ']';
  }
  const keys = Object.keys(value).sort();
  const entries = keys
    .filter((k) => value[k] !== undefined)
    .map((k) => JSON.stringify(k) + ':' + canonicalJson(value[k]));
  return '{' + entries.join(',') + '}';
}

export function computeSha256Digest(value) {
  const serialized = typeof value === 'string' ? value : canonicalJson(value);
  return `sha256:${crypto.createHash('sha256').update(serialized).digest('hex')}`;
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

function fsyncDirBestEffort(dir) {
  let fd;
  try {
    fd = fs.openSync(dir, 'r');
    fs.fsyncSync(fd);
  } catch {
  } finally {
    if (fd !== undefined) {
      try { fs.closeSync(fd); } catch {}
    }
  }
}

export function publishImmutableProof(targetPath, record) {
  const dir = path.dirname(targetPath);
  fs.mkdirSync(dir, { recursive: true });
  const content = typeof record === 'string' ? record : `${JSON.stringify(record, null, 2)}\n`;
  const tmpPath = path.join(dir, `.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const fd = fs.openSync(tmpPath, 'w');
  try {
    fs.writeSync(fd, content);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  try {
    fs.linkSync(tmpPath, targetPath);
  } catch (err) {
    try { fs.unlinkSync(tmpPath); } catch {}
    if (err.code === 'EEXIST') {
      return false;
    }
    throw err;
  }
  try { fs.unlinkSync(tmpPath); } catch {}
  fsyncDirBestEffort(dir);
  return true;
}

export function publishMutableProjection(targetPath, record) {
  const dir = path.dirname(targetPath);
  fs.mkdirSync(dir, { recursive: true });
  const content = typeof record === 'string' ? record : `${JSON.stringify(record, null, 2)}\n`;
  const tmpPath = path.join(dir, `.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const fd = fs.openSync(tmpPath, 'w');
  try {
    fs.writeSync(fd, content);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(tmpPath, targetPath);
  fsyncDirBestEffort(dir);
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
  if (controlToken !== undefined) {
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
  if (controlToken !== undefined) {
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
