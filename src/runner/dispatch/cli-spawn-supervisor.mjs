// cli-spawn-supervisor.mjs — Per-Run local supervisor process for Assignment-owned cli-spawn
// (plans/260911-2305-runtime-recovery/phase-designs/cli-spawn-local-contract.md).
//
// The supervisor owns crash-surviving timers, protected stdout/stderr capture,
// worker PGID signalling, and immutable adapter receipt publication.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import child_process from 'node:child_process';
import { fileURLToPath } from 'node:url';

// --- Canonical JSON and Digests -------------------------------------------

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

// --- Host, Boot, Process Info --------------------------------------------

// Hoisted to process-identity.mjs (Phase 02 H1): a pure fs-only leaf so
// run-lock.mjs (banned from reaching any process-control adapter, per
// test/runner/dispatch-reconciliation-import-graph.test.mjs) can use the
// same identity check without importing this file's child_process/spawn
// surface. Re-exported here unchanged for this file's own existing callers.
import { getBootId, getProcessStartTime } from './process-identity.mjs';
export { getBootId, getProcessStartTime };

export function getProcessPgid(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return pid;
  try {
    const stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8');
    const lastParen = stat.lastIndexOf(')');
    if (lastParen !== -1) {
      const rest = stat.slice(lastParen + 2).split(' ');
      const pgrp = parseInt(rest[2], 10);
      if (Number.isInteger(pgrp)) return pgrp;
    }
  } catch {}
  return pid;
}

export function isProcessAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM';
  }
}

// --- Fsynced Publication Helpers ------------------------------------------

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

// --- Immutable Proof Publication and Collision Errors ---------------------

export class ReceiptPathCollisionError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'ReceiptPathCollisionError';
    this.code = options.code || 'receipt-path-collision';
    this.targetPath = options.targetPath;
    this.expectedDigest = options.expectedDigest;
    this.existingDigest = options.existingDigest;
  }
}

export class SupervisorBindingPathCollisionError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'SupervisorBindingPathCollisionError';
    this.code = options.code || 'binding-path-collision';
    this.targetPath = options.targetPath;
    this.expectedDigest = options.expectedDigest;
    this.existingDigest = options.existingDigest;
  }
}

export class WorkerBindingPathCollisionError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'WorkerBindingPathCollisionError';
    this.code = options.code || 'worker-binding-path-collision';
    this.targetPath = options.targetPath;
    this.expectedDigest = options.expectedDigest;
    this.existingDigest = options.existingDigest;
  }
}

function computeFileSha256Digest(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const { digest, ...body } = parsed;
        if (digest && digest === computeSha256Digest(body)) {
          return digest;
        }
        return computeSha256Digest(parsed);
      }
      return computeSha256Digest(raw);
    } catch {
      return computeSha256Digest(raw);
    }
  } catch {
    return null;
  }
}

export function publishAdapterReceipt(receiptPath, receipt, { launchCommandId = null, envelope = null } = {}) {
  const publishedReceipt = publishImmutableProof(receiptPath, receipt);
  if (!publishedReceipt) {
    const existingDigest = computeFileSha256Digest(receiptPath);
    const expectedDigest = receipt.digest || computeSha256Digest(receipt);
    if (existingDigest !== expectedDigest) {
      throw new ReceiptPathCollisionError(
        `supervisor: adapter receipt path collision for ${launchCommandId || path.basename(receiptPath, '.json')} at ${receiptPath} (expected digest ${expectedDigest}, found ${existingDigest || 'unknown'})`,
        {
          code: 'receipt-path-collision',
          targetPath: receiptPath,
          expectedDigest,
          existingDigest,
        },
      );
    }
  }

  if (envelope?.paths?.receiptsDir) {
    try {
      publishImmutableProof(path.join(envelope.paths.receiptsDir, 'adapter-receipt.json'), receipt);
      if (launchCommandId) {
        publishImmutableProof(path.join(envelope.paths.receiptsDir, `${launchCommandId}.json`), receipt);
      }
    } catch {}
  }
  return receipt;
}

export function publishSupervisorBinding(supervisorBindingPath, supervisorBinding, { launchCommandId = null, envelope = null } = {}) {
  const published = publishImmutableProof(supervisorBindingPath, supervisorBinding);
  if (!published) {
    const existingDigest = computeFileSha256Digest(supervisorBindingPath);
    const expectedDigest = supervisorBinding.digest || computeSha256Digest(supervisorBinding);
    if (existingDigest !== expectedDigest) {
      throw new SupervisorBindingPathCollisionError(
        `supervisor: duplicate supervisor binding rejected for ${launchCommandId || path.basename(supervisorBindingPath, '.json')} at ${supervisorBindingPath}`,
        {
          code: 'binding-path-collision',
          targetPath: supervisorBindingPath,
          expectedDigest,
          existingDigest,
        },
      );
    }
  }

  if (envelope?.paths?.bindingsDir) {
    try {
      publishImmutableProof(path.join(envelope.paths.bindingsDir, 'supervisor.json'), supervisorBinding);
      if (launchCommandId) {
        publishImmutableProof(path.join(envelope.paths.bindingsDir, `${launchCommandId}.json`), supervisorBinding);
      }
    } catch {}
  }
  return supervisorBinding;
}

export function publishWorkerBinding(workerBindingPath, workerBinding, { launchCommandId = null, envelope = null } = {}) {
  const publishedWorkerBinding = publishImmutableProof(workerBindingPath, workerBinding);
  if (!publishedWorkerBinding) {
    const existingDigest = computeFileSha256Digest(workerBindingPath);
    const expectedDigest = workerBinding.digest || computeSha256Digest(workerBinding);
    if (existingDigest !== expectedDigest) {
      throw new WorkerBindingPathCollisionError(
        `supervisor: worker binding path collision for ${launchCommandId || path.basename(workerBindingPath, '.worker.json')} at ${workerBindingPath} (expected digest ${expectedDigest}, found ${existingDigest || 'unknown'})`,
        {
          code: 'worker-binding-path-collision',
          targetPath: workerBindingPath,
          expectedDigest,
          existingDigest,
        },
      );
    }
  }

  if (envelope?.paths?.bindingsDir) {
    try {
      publishImmutableProof(path.join(envelope.paths.bindingsDir, 'worker.json'), workerBinding);
      if (launchCommandId) {
        publishImmutableProof(path.join(envelope.paths.bindingsDir, `${launchCommandId}.worker.json`), workerBinding);
      }
    } catch {}
  }
  return workerBinding;
}

// --- Readers --------------------------------------------------------------

export function readSupervisorBinding(runDir, launchCommandId) {
  const candidatePaths = [
    path.join(runDir, 'protected', 'supervisor-binding', `${launchCommandId}.json`),
    path.join(runDir, 'protected', 'bindings', launchCommandId, 'supervisor.json'),
    path.join(runDir, 'protected', 'bindings', `${launchCommandId}.json`),
    path.join(runDir, 'protected', 'supervisor-binding.json'),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch {}
    }
  }
  return null;
}

export function readWorkerBinding(runDir, launchCommandId) {
  const candidatePaths = [
    path.join(runDir, 'protected', 'supervisor-binding', `${launchCommandId}.worker.json`),
    path.join(runDir, 'protected', 'bindings', launchCommandId, 'worker.json'),
    path.join(runDir, 'protected', 'bindings', `${launchCommandId}.worker.json`),
    path.join(runDir, 'protected', 'worker-binding.json'),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch {}
    }
  }
  return null;
}

export function readAdapterReceipt(runDir, launchCommandId) {
  const candidatePaths = [
    path.join(runDir, 'protected', 'adapter-receipts', `${launchCommandId}.json`),
    path.join(runDir, 'protected', 'receipts', launchCommandId, 'adapter-receipt.json'),
    path.join(runDir, 'protected', 'receipts', `${launchCommandId}.json`),
    path.join(runDir, 'protected', 'adapter-receipt.json'),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch {}
    }
  }
  return null;
}

// --- Supervisor Core ------------------------------------------------------

/**
 * Execute the supervisor lifecycle for a launch envelope.
 *
 * @param {string} envelopePath Absolute path to cli-spawn-launch-envelope.v1
 * @param {object} [opts] Options
 * @param {Function} [opts.onChunk] Live chunk observer
 * @returns {Promise<object>} The published adapter receipt
 */
export async function runSupervisor(envelopePath, opts = {}) {
  // Ignore pipe/IPC broken-pipe errors so parent exit doesn't kill supervisor
  process.on('disconnect', () => {});
  if (process.stdout && typeof process.stdout.on === 'function') {
    process.stdout.on('error', () => {});
  }
  if (process.stderr && typeof process.stderr.on === 'function') {
    process.stderr.on('error', () => {});
  }

  const envelopeRaw = fs.readFileSync(envelopePath, 'utf8');
  const envelope = JSON.parse(envelopeRaw);

  if (envelope.contract !== 'cli-spawn-launch-envelope.v1') {
    throw new Error(`supervisor: invalid launch envelope contract: ${envelope.contract}`);
  }

  // Verify envelope digest
  const { digest: expectedEnvelopeDigest, ...envelopeWithoutDigest } = envelope;
  const computedEnvelopeDigest = computeSha256Digest(envelopeWithoutDigest);
  if (expectedEnvelopeDigest && expectedEnvelopeDigest !== computedEnvelopeDigest) {
    throw new Error(`supervisor: envelope digest mismatch: expected ${expectedEnvelopeDigest}, computed ${computedEnvelopeDigest}`);
  }
  const envelopeDigest = expectedEnvelopeDigest || computedEnvelopeDigest;

  const runId = envelope.run?.runId || envelope.runId || 'run_local';
  const launchCommandId = envelope.command?.launchCommandId || envelope.launchCommandId || path.basename(envelopePath, '.json');
  const runDir = envelope.run?.runDir || (envelopePath.includes('/protected/') ? envelopePath.slice(0, envelopePath.indexOf('/protected/')) : path.resolve(path.dirname(envelopePath), '..', '..'));

  // Paths per contract
  const bindingDir = path.join(runDir, 'protected', 'supervisor-binding');
  const supervisorBindingPath = path.join(bindingDir, `${launchCommandId}.json`);
  const workerBindingPath = path.join(bindingDir, `${launchCommandId}.worker.json`);

  const captureDir = path.join(runDir, 'protected', 'capture', launchCommandId);
  fs.mkdirSync(captureDir, { recursive: true });
  const stdoutPath = path.join(captureDir, 'stdout.log');
  const stderrPath = path.join(captureDir, 'stderr.log');

  const receiptsDir = path.join(runDir, 'protected', 'adapter-receipts');
  const receiptPath = path.join(receiptsDir, `${launchCommandId}.json`);

  // Step 1: Publish supervisor binding
  const supervisorPgid = getProcessPgid(process.pid);
  const supervisorStartTime = getProcessStartTime(process.pid) || String(Date.now());
  const hostId = os.hostname();
  const bootId = getBootId();

  const supervisorBinding = {
    contract: 'cli-spawn-supervisor-binding.v1',
    runId,
    launchCommandId,
    envelopeDigest,
    host: hostId,
    bootId,
    supervisor: {
      pid: process.pid,
      processStartTime: supervisorStartTime,
      pgid: supervisorPgid,
      bootId,
      starttime: supervisorStartTime,
    },
    worker: null,
    publishedAt: new Date().toISOString(),
  };

  publishSupervisorBinding(supervisorBindingPath, supervisorBinding, { launchCommandId, envelope });
  const supervisorBindingDigest = computeSha256Digest(supervisorBinding);

  // Step 2: Open capture files
  const stdoutFd = fs.openSync(stdoutPath, 'w');
  const stderrFd = fs.openSync(stderrPath, 'w');

  const invocation = envelope.invocation || {};
  const command = invocation.command || envelope.command;
  const args = invocation.args || envelope.args || [];
  const cwd = invocation.cwd || envelope.cwd || runDir;
  const env = invocation.env || envelope.env || {};
  const timeoutMs = invocation.timeoutMs || envelope.limits?.timeoutMs || 900000;
  const idleTimeoutMs = invocation.idleTimeoutMs || envelope.limits?.idleTimeoutMs || null;
  const maxBuffer = invocation.maxBuffer || envelope.limits?.maxBuffer || 10485760;

  let stdoutBytesCaptured = 0;
  let stderrBytesCaptured = 0;
  let overflowChunkDeliveredToLiveStream = false;
  let captureFrozen = false;
  let receiptPublished = false;

  const startTime = Date.now();
  let workerChild = null;
  let workerBinding = null;
  let workerBindingDigest = null;
  let bindingDigest = supervisorBindingDigest;

  function deliverLiveChunk(chunk, stream) {
    if (opts.onChunk) {
      try {
        opts.onChunk(chunk, stream);
      } catch {}
    }
    if (process.send) {
      try {
        process.send({ type: 'chunk', stream, chunk: chunk.toString('utf8') });
      } catch {}
    }
    try {
      if (stream === 'stdout' && process.stdout && !process.stdout.destroyed) {
        process.stdout.write(chunk);
      } else if (stream === 'stderr' && process.stderr && !process.stderr.destroyed) {
        process.stderr.write(chunk);
      }
    } catch {}
  }

  function publishReceiptOnce(completion, processTree) {
    if (receiptPublished) return;
    receiptPublished = true;
    captureFrozen = true;

    try { fs.fsyncSync(stdoutFd); } catch {}
    try { fs.closeSync(stdoutFd); } catch {}
    try { fs.fsyncSync(stderrFd); } catch {}
    try { fs.closeSync(stderrFd); } catch {}

    let stdoutDigest = 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    let stderrDigest = 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    try {
      const stdoutBytes = fs.readFileSync(stdoutPath);
      stdoutDigest = computeSha256Digest(stdoutBytes);
    } catch {}
    try {
      const stderrBytes = fs.readFileSync(stderrPath);
      stderrDigest = computeSha256Digest(stderrBytes);
    } catch {}

    const outcome = {
      kind: completion.kind,
      exitCode: completion.exitCode,
      signal: completion.signal,
      errorClass: completion.errorClass,
      cause: completion.cause,
      settledAt: completion.settledAt,
      durationMs: completion.durationMs,
    };

    const receiptBody = {
      contract: 'cli-spawn-adapter-receipt.v1',
      runId,
      launchCommandId,
      envelopeDigest,
      bindingDigest,
      exitCode: completion.exitCode,
      signal: completion.signal,
      outcome,
      completion,
      output: {
        stdoutPath: path.relative(runDir, stdoutPath),
        stderrPath: path.relative(runDir, stderrPath),
        stdoutDigest,
        stderrDigest,
        stdoutBytesCaptured,
        stderrBytesCaptured,
        maxBufferBytes: maxBuffer,
        overflowChunkDeliveredToLiveStream,
      },
      processTree,
    };

    const receiptDigest = computeSha256Digest(receiptBody);
    const receipt = {
      ...receiptBody,
      digest: receiptDigest,
    };

    return publishAdapterReceipt(receiptPath, receipt, { launchCommandId, envelope });
  }

  return new Promise((resolve, reject) => {
    let timeoutTimer = null;
    let idleTimer = null;

    function deliverReceipt(completion, processTree) {
      try {
        const receipt = publishReceiptOnce(completion, processTree);
        resolve(receipt);
      } catch (err) {
        reject(err);
      }
    }

    function resetIdleTimer() {
      if (!idleTimeoutMs) return;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (captureFrozen) return;
        const durationMs = Date.now() - startTime;
        killWorkerPgid('SIGTERM');
        deliverReceipt(
          {
            kind: 'idle-timeout',
            exitCode: 124,
            signal: 'SIGTERM',
            errorClass: 'worker-timeout',
            cause: `worker exceeded idle timeout of ${idleTimeoutMs}ms`,
            settledAt: new Date().toISOString(),
            durationMs,
          },
          {
            terminationTarget: 'worker-pgid',
            terminatedPgid: workerBinding?.worker?.pgid ?? null,
            coverage: 'partial-escaped-descendant-possible',
            stoppedProof: 'not-claimed',
          },
        );
      }, idleTimeoutMs);
    }

    function killWorkerPgid(sig = 'SIGTERM') {
      const targetPgid = workerBinding?.worker?.pgid || workerChild?.pid;
      if (targetPgid) {
        try {
          process.kill(-targetPgid, sig);
        } catch {
          try {
            process.kill(targetPgid, sig);
          } catch {}
        }
      }
    }

    if (timeoutMs) {
      timeoutTimer = setTimeout(() => {
        if (captureFrozen) return;
        const durationMs = Date.now() - startTime;
        killWorkerPgid('SIGTERM');
        deliverReceipt(
          {
            kind: 'timeout',
            exitCode: 124,
            signal: 'SIGTERM',
            errorClass: 'worker-timeout',
            cause: `execution timed out after ${timeoutMs}ms`,
            settledAt: new Date().toISOString(),
            durationMs,
          },
          {
            terminationTarget: 'worker-pgid',
            terminatedPgid: workerBinding?.worker?.pgid ?? null,
            coverage: 'partial-escaped-descendant-possible',
            stoppedProof: 'not-claimed',
          },
        );
      }, timeoutMs);
    }

    // Step 3: Spawn worker process
    try {
      workerChild = child_process.spawn(command, args, {
        cwd,
        env,
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: true,
      });
    } catch (err) {
      const durationMs = Date.now() - startTime;
      deliverReceipt(
        {
          kind: 'spawn-failed',
          exitCode: 1,
          signal: null,
          errorClass: 'worker-spawn-fail',
          cause: err.message,
          settledAt: new Date().toISOString(),
          durationMs,
        },
        {
          terminationTarget: 'worker-pgid',
          terminatedPgid: null,
          coverage: 'process-group',
          stoppedProof: 'not-claimed',
        },
      );
      return;
    }

    workerChild.on('error', (err) => {
      if (captureFrozen) return;
      const durationMs = Date.now() - startTime;
      deliverReceipt(
        {
          kind: 'spawn-failed',
          exitCode: 1,
          signal: null,
          errorClass: 'worker-spawn-fail',
          cause: err.message,
          settledAt: new Date().toISOString(),
          durationMs,
        },
        {
          terminationTarget: 'worker-pgid',
          terminatedPgid: workerBinding?.worker?.pgid ?? null,
          coverage: 'process-group',
          stoppedProof: 'not-claimed',
        },
      );
    });

    if (!workerChild.pid) {
      const durationMs = Date.now() - startTime;
      deliverReceipt(
        {
          kind: 'spawn-failed',
          exitCode: 1,
          signal: null,
          errorClass: 'worker-spawn-fail',
          cause: 'worker child failed to provide PID',
          settledAt: new Date().toISOString(),
          durationMs,
        },
        {
          terminationTarget: 'worker-pgid',
          terminatedPgid: null,
          coverage: 'process-group',
          stoppedProof: 'not-claimed',
        },
      );
      return;
    }

    // Step 4: Publish worker binding
    const workerPid = workerChild.pid;
    const workerPgid = getProcessPgid(workerPid);
    const workerStartTime = getProcessStartTime(workerPid) || String(Date.now());

    const workerBindingBody = {
      contract: 'cli-spawn-worker-binding.v1',
      runId,
      launchCommandId,
      envelopeDigest,
      supervisorBindingDigest,
      worker: {
        pid: workerPid,
        processStartTime: workerStartTime,
        pgid: workerPgid,
      },
      workerSpawnedAt: new Date().toISOString(),
    };

    workerBindingDigest = computeSha256Digest(workerBindingBody);
    workerBinding = {
      ...workerBindingBody,
      digest: workerBindingDigest,
    };

    try {
      publishWorkerBinding(workerBindingPath, workerBinding, { launchCommandId, envelope });
    } catch (err) {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      if (idleTimer) clearTimeout(idleTimer);
      killWorkerPgid('SIGKILL');
      reject(err);
      return;
    }
    bindingDigest = computeSha256Digest([supervisorBindingDigest, workerBindingDigest]);

    // Setup Timeout
    if (timeoutMs) {
      timeoutTimer = setTimeout(() => {
        if (captureFrozen) return;
        const durationMs = Date.now() - startTime;
        killWorkerPgid('SIGTERM');
        deliverReceipt(
          {
            kind: 'timeout',
            exitCode: 124,
            signal: 'SIGTERM',
            errorClass: 'worker-timeout',
            cause: `execution timed out after ${timeoutMs}ms`,
            settledAt: new Date().toISOString(),
            durationMs,
          },
          {
            terminationTarget: 'worker-pgid',
            terminatedPgid: workerPgid,
            coverage: 'partial-escaped-descendant-possible',
            stoppedProof: 'not-claimed',
          },
        );
      }, timeoutMs);
    }

    resetIdleTimer();

    // Stream Stdout
    workerChild.stdout.on('data', (chunk) => {
      if (captureFrozen) return;
      deliverLiveChunk(chunk, 'stdout');

      if (stdoutBytesCaptured + stderrBytesCaptured + chunk.length > maxBuffer) {
        overflowChunkDeliveredToLiveStream = true;
        killWorkerPgid('SIGTERM');
        const durationMs = Date.now() - startTime;
        deliverReceipt(
          {
            kind: 'max-buffer',
            exitCode: 1,
            signal: 'SIGTERM',
            errorClass: 'worker-spawn-fail',
            cause: `combined stdout/stderr exceeded maxBuffer of ${maxBuffer} bytes`,
            settledAt: new Date().toISOString(),
            durationMs,
          },
          {
            terminationTarget: 'worker-pgid',
            terminatedPgid: workerPgid,
            coverage: 'partial-escaped-descendant-possible',
            stoppedProof: 'not-claimed',
          },
        );
        return;
      }

      try {
        fs.writeSync(stdoutFd, chunk);
        stdoutBytesCaptured += chunk.length;
      } catch {}
      resetIdleTimer();
    });

    // Stream Stderr
    workerChild.stderr.on('data', (chunk) => {
      if (captureFrozen) return;
      deliverLiveChunk(chunk, 'stderr');

      if (stdoutBytesCaptured + stderrBytesCaptured + chunk.length > maxBuffer) {
        overflowChunkDeliveredToLiveStream = true;
        killWorkerPgid('SIGTERM');
        const durationMs = Date.now() - startTime;
        deliverReceipt(
          {
            kind: 'max-buffer',
            exitCode: 1,
            signal: 'SIGTERM',
            errorClass: 'worker-spawn-fail',
            cause: `combined stdout/stderr exceeded maxBuffer of ${maxBuffer} bytes`,
            settledAt: new Date().toISOString(),
            durationMs,
          },
          {
            terminationTarget: 'worker-pgid',
            terminatedPgid: workerPgid,
            coverage: 'partial-escaped-descendant-possible',
            stoppedProof: 'not-claimed',
          },
        );
        return;
      }

      try {
        fs.writeSync(stderrFd, chunk);
        stderrBytesCaptured += chunk.length;
      } catch {}
      resetIdleTimer();
    });

    // Worker Close
    workerChild.on('close', (code, signal) => {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      if (idleTimer) clearTimeout(idleTimer);
      if (captureFrozen) return;

      const durationMs = Date.now() - startTime;
      const isSignaled = Boolean(signal);
      const exitCode = typeof code === 'number' ? code : (isSignaled ? 128 + 1 : 0);

      deliverReceipt(
        {
          kind: isSignaled ? 'signaled' : 'exited',
          exitCode,
          signal: signal ?? null,
          errorClass: null,
          cause: null,
          settledAt: new Date().toISOString(),
          durationMs,
        },
        {
          terminationTarget: 'worker-pgid',
          terminatedPgid: workerPgid,
          coverage: 'process-group',
          stoppedProof: 'not-claimed',
        },
      );
    });
  });
}

/**
 * Start a supervisor process in the background, or await it if live.
 */
export function startSupervisorProcess({ envelopePath, detached = true, onChunk = null }) {
  const supervisorScript = fileURLToPath(import.meta.url);
  const proc = child_process.spawn(process.execPath, [supervisorScript, envelopePath], {
    detached,
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });

  if (onChunk) {
    proc.on('message', (msg) => {
      if (msg && msg.type === 'chunk') {
        try {
          onChunk(Buffer.from(msg.chunk, 'utf8'), msg.stream);
        } catch {}
      }
    });
    if (proc.stdout) {
      proc.stdout.on('data', (chunk) => {
        try { onChunk(chunk, 'stdout'); } catch {}
      });
    }
    if (proc.stderr) {
      proc.stderr.on('data', (chunk) => {
        try { onChunk(chunk, 'stderr'); } catch {}
      });
    }
  }

  return proc;
}

// --- Evaluator Baseline V1 ------------------------------------------------

export function writeEvaluatorBaseline({
  runDir,
  runId,
  assignmentId,
  cwd,
  gitBefore = null,
  gitBeforeSource = 'pre-launch',
  dirtyBefore = [],
  dirtyBeforeSnapshots = {},
}) {
  const controllerDir = path.join(runDir, 'controller');
  fs.mkdirSync(controllerDir, { recursive: true });

  const baselineBody = {
    contract: 'evaluator-baseline.v1',
    runId,
    assignmentId,
    cwd: path.resolve(cwd),
    gitBefore,
    gitBeforeSource,
    dirtyBefore: Array.isArray(dirtyBefore) ? dirtyBefore : [],
    dirtyBeforeSnapshots: dirtyBeforeSnapshots || {},
    capturedAt: new Date().toISOString(),
  };

  const digest = computeSha256Digest(baselineBody);
  const baseline = {
    ...baselineBody,
    digest,
  };

  const baselinePath = path.join(controllerDir, 'evaluator-baseline.json');
  publishMutableProjection(baselinePath, baseline);
  return baseline;
}

export function readEvaluatorBaseline(runDir) {
  const baselinePath = path.join(runDir, 'controller', 'evaluator-baseline.json');
  if (!fs.existsSync(baselinePath)) {
    const err = new Error(`Evaluator baseline missing at "${baselinePath}".`);
    err.code = 'evaluator-baseline-missing';
    throw err;
  }
  let baseline;
  try {
    baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  } catch (cause) {
    const err = new Error(`Evaluator baseline corrupt at "${baselinePath}": ${cause.message}`);
    err.code = 'evaluator-baseline-mismatch';
    throw err;
  }
  const { digest, ...body } = baseline;
  const expectedDigest = computeSha256Digest(body);
  if (digest !== expectedDigest) {
    const err = new Error(`Evaluator baseline digest mismatch at "${baselinePath}".`);
    err.code = 'evaluator-baseline-mismatch';
    throw err;
  }
  return baseline;
}

// --- Command State V1 -----------------------------------------------------

export function commitCommandPending({
  runDir,
  runId,
  launchCommandId,
  controlEpoch,
  controlToken,
}) {
  const commandsDir = path.join(runDir, 'controller', 'commands');
  fs.mkdirSync(commandsDir, { recursive: true });

  const commandPath = path.join(commandsDir, `${launchCommandId}.json`);
  const controlTokenDigest = computeSha256Digest(controlToken);

  const commandState = {
    contract: 'assignment-command-state.v1',
    runId,
    launchCommandId,
    controlEpoch,
    controlTokenDigest,
    state: 'pending',
    envelopeDigest: null,
    bindingDigest: null,
    receiptDigest: null,
    outcome: null,
  };

  publishMutableProjection(commandPath, commandState);
  return commandState;
}

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

  const updated = {
    ...existing,
    state,
    outcome,
    receiptDigest: receiptDigest ?? existing.receiptDigest,
    bindingDigest: bindingDigest ?? existing.bindingDigest,
  };
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

// --- Reconciliation V1 ----------------------------------------------------

export async function reconcileCliSpawnRun({
  runDir,
  launchCommandId,
  controlEpoch,
  controlToken,
  operation = 'reconcile',
}) {
  if (operation === 'cancel') {
    return {
      status: 'refused',
      reason: 'capability-unsupported',
      message: 'operator cancel after coordinator death is unsupported by local-process profile',
    };
  }
  if (operation === 'shared-cwd-takeover') {
    return {
      status: 'refused',
      reason: 'capability-unsupported',
      message: 'shared-cwd mutating continuation is unsupported',
    };
  }

  const commandState = readCommandState(runDir, launchCommandId);
  if (!commandState) {
    return { status: 'not-requested' };
  }

  // Already reconciled
  if (commandState.state === 'reconciled') {
    if (commandState.outcome?.kind === 'submission-refused') {
      return {
        status: 'submission-refused',
        outcome: commandState.outcome,
        commandState,
      };
    }
    if (commandState.outcome?.kind === 'receipt-backed') {
      let baseline = null;
      try {
        baseline = readEvaluatorBaseline(runDir);
      } catch (err) {
        return { status: 'refused', reason: err.code || 'evaluator-baseline-missing', error: err };
      }
      const receiptPath = path.join(runDir, 'protected', 'adapter-receipts', `${launchCommandId}.json`);
      let receipt = null;
      if (fs.existsSync(receiptPath)) {
        try {
          receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
        } catch {}
      }
      return {
        status: 'reconciled',
        outcome: commandState.outcome,
        receipt,
        baseline,
        commandState,
        reusedStoredOutcome: true,
      };
    }
  }

  // Pending
  if (commandState.state === 'pending') {
    // 1. Check envelope
    const envelopePath = path.join(runDir, 'protected', 'launch-envelope', `${launchCommandId}.json`);
    if (!fs.existsSync(envelopePath)) {
      return { status: 'parked', reason: 'launch-envelope-missing' };
    }
    let envelope;
    try {
      envelope = JSON.parse(fs.readFileSync(envelopePath, 'utf8'));
      const { digest, ...body } = envelope;
      if (digest !== computeSha256Digest(body)) {
        return { status: 'refused', reason: 'protected-artifact-corrupt' };
      }
    } catch {
      return { status: 'refused', reason: 'protected-artifact-corrupt' };
    }

    // 2. Check supervisor binding
    const supBindingPath = path.join(runDir, 'protected', 'supervisor-binding', `${launchCommandId}.json`);
    if (!fs.existsSync(supBindingPath)) {
      return { status: 'parked', reason: 'supervisor-binding-unknown' };
    }
    let supBinding;
    try {
      supBinding = JSON.parse(fs.readFileSync(supBindingPath, 'utf8'));
      const { digest, ...body } = supBinding;
      if (digest !== computeSha256Digest(body)) {
        return { status: 'refused', reason: 'protected-artifact-corrupt' };
      }
    } catch {
      return { status: 'refused', reason: 'protected-artifact-corrupt' };
    }

    // Check host boot ID
    const currentBootId = getBootId();
    if (supBinding.bootId && currentBootId && currentBootId !== 'unknown-boot' && supBinding.bootId !== currentBootId) {
      const receiptPath = path.join(runDir, 'protected', 'adapter-receipts', `${launchCommandId}.json`);
      if (!fs.existsSync(receiptPath)) {
        return { status: 'parked', reason: 'host-reboot-unknown' };
      }
    }

    // 3. Check worker binding
    const workerBindingPath = path.join(runDir, 'protected', 'supervisor-binding', `${launchCommandId}.worker.json`);
    let workerBinding = null;
    if (!fs.existsSync(workerBindingPath)) {
      const supAlive = isProcessAlive(supBinding.supervisor?.pid);
      if (!supAlive) {
        return { status: 'parked', reason: 'worker-binding-unknown' };
      }
      return { status: 'running', phase: 'supervisor-started' };
    } else {
      try {
        workerBinding = JSON.parse(fs.readFileSync(workerBindingPath, 'utf8'));
        const { digest, ...body } = workerBinding;
        if (digest !== computeSha256Digest(body)) {
          return { status: 'refused', reason: 'protected-artifact-corrupt' };
        }
      } catch {
        return { status: 'refused', reason: 'protected-artifact-corrupt' };
      }

      // Incarnation check
      if (workerBinding.worker?.pid && workerBinding.worker?.processStartTime) {
        const liveStartTime = getProcessStartTime(workerBinding.worker.pid);
        const isWorkerAlive = isProcessAlive(workerBinding.worker.pid);
        if (isWorkerAlive && liveStartTime && liveStartTime !== workerBinding.worker.processStartTime) {
          return { status: 'refused', reason: 'incarnation-mismatch' };
        }
      }
      if (supBinding.supervisor?.pid && supBinding.supervisor?.processStartTime) {
        const liveStartTime = getProcessStartTime(supBinding.supervisor.pid);
        const isSupAlive = isProcessAlive(supBinding.supervisor.pid);
        if (isSupAlive && liveStartTime && liveStartTime !== supBinding.supervisor.processStartTime) {
          return { status: 'refused', reason: 'incarnation-mismatch' };
        }
      }
    }

    // 4. Check adapter receipt
    const receiptPath = path.join(runDir, 'protected', 'adapter-receipts', `${launchCommandId}.json`);
    if (!fs.existsSync(receiptPath)) {
      const supAlive = isProcessAlive(supBinding.supervisor?.pid);
      if (supAlive) {
        return { status: 'running', phase: 'worker-running' };
      }
      return { status: 'parked', reason: 'worker-state-unknown' };
    }

    let receipt;
    try {
      receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
      const { digest, ...body } = receipt;
      if (digest !== computeSha256Digest(body)) {
        return { status: 'refused', reason: 'protected-artifact-corrupt' };
      }
    } catch {
      return { status: 'refused', reason: 'protected-artifact-corrupt' };
    }

    if (receipt.envelopeDigest !== envelope.digest) {
      return { status: 'refused', reason: 'protected-artifact-corrupt' };
    }

    const expectedBindingDigest = workerBinding
      ? computeSha256Digest([supBinding.digest, workerBinding.digest])
      : supBinding.digest;
    if (receipt.bindingDigest !== expectedBindingDigest) {
      return { status: 'refused', reason: 'protected-artifact-corrupt' };
    }

    // Read evaluator baseline
    let baseline;
    try {
      baseline = readEvaluatorBaseline(runDir);
    } catch (err) {
      return { status: 'refused', reason: err.code || 'evaluator-baseline-missing', error: err };
    }

    // Stale controller check
    const controlTokenDigest = computeSha256Digest(controlToken);
    const isCurrentToken = commandState.controlEpoch === controlEpoch && commandState.controlTokenDigest === controlTokenDigest;
    if (!isCurrentToken) {
      return {
        status: 'observed-stale',
        receipt,
        baseline,
        commandState,
      };
    }

    // Current controller records outcome
    const outcome = {
      kind: 'receipt-backed',
      receiptDigest: receipt.digest,
      adapterCompletion: {
        kind: receipt.completion?.kind || 'unknown',
      },
    };

    commitCommandOutcome({
      runDir,
      launchCommandId,
      controlEpoch,
      controlToken,
      outcome,
      state: 'reconciled',
      receiptDigest: receipt.digest,
      bindingDigest: receipt.bindingDigest,
    });

    return {
      status: 'reconciled',
      outcome,
      receipt,
      baseline,
      commandState: {
        ...commandState,
        state: 'reconciled',
        outcome,
        receiptDigest: receipt.digest,
        bindingDigest: receipt.bindingDigest,
      },
      capture: {
        stdoutPath: path.join(runDir, receipt.output.stdoutPath),
        stderrPath: path.join(runDir, receipt.output.stderrPath),
      },
    };
  }

  return { status: 'unknown' };
}

// CLI entry point
if (process.argv[1] && (path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) || path.basename(process.argv[1]) === 'cli-spawn-supervisor.mjs')) {
  const envelopeArg = process.argv[2];
  if (!envelopeArg) {
    process.stderr.write('usage: node cli-spawn-supervisor.mjs <envelopePath>\n');
    process.exit(1);
  }
  runSupervisor(path.resolve(envelopeArg))
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      process.stderr.write(`supervisor: fatal error: ${err.message}\n`);
      process.exit(1);
    });
}
