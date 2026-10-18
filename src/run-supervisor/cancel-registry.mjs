// What a controller does when a person presses Ctrl-C (r6 §16): ask the supervisor of every attempt it
// handed over to stop that attempt, wait a bounded time for the receipt, say how to continue, and leave.
// The controller never signals an agent itself; it only publishes `cancel-requested.json`, which the
// supervisor polls. An attempt that has no binding yet is not in the registry: the controller still holds
// its attempt lock there, so dying is enough (adopt judges it `abandoned-not-started`).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { publishImmutableProof } from '../runner/dispatch/proof-helpers.mjs';
import { getBootId, getPidNs, getProcessStartTime } from '../runner/dispatch/process-identity.mjs';
import { readSharedConfigOrEmpty } from '../config/shared-config-file.mjs';
import { mergeWithGlobalConfig } from '../config/global-config.mjs';
import { DEFAULT_GATE_KILL_GRACE_MS, resolveGateKillGrace } from './gate-kill-grace.mjs';

export const CANCEL_WAIT_KEY = 'dispatch.cancelWaitMs';
/** Slack past the kill grace: the supervisor's own domain sweep and the steps after the receipt. */
const CANCEL_WAIT_SLACK_MS = 5000;
export const MIN_CANCEL_WAIT_MS = 1000;
const POLL_MS = 50;
const EXIT_CODES = Object.freeze({ SIGINT: 130, SIGTERM: 143 });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Attempt directories this process delivered to a supervisor and has not yet read the answer of. */
const delivered = new Set();

/** Remember `runDir` once its supervisor has bound the attempt. */
export function register(runDir) {
  delivered.add(path.resolve(runDir));
}

/** Forget `runDir` once its result was read. */
export function unregister(runDir) {
  delivered.delete(path.resolve(runDir));
}

export function registeredRuns() {
  return [...delivered].sort();
}

/**
 * `dispatch.cancelWaitMs` of the project rooted at `projectRoot`: project over global, default
 * `gateKillGraceMs + 5000`. Setup never writes the key; a present but unusable value throws.
 */
export function readCancelWaitMs({ projectRoot } = {}) {
  let merged;
  try {
    merged = mergeWithGlobalConfig(projectRoot ? readSharedConfigOrEmpty(projectRoot) : {});
  } catch {
    merged = {};
  }
  const value = merged?.dispatch?.cancelWaitMs;
  if (value === undefined) {
    const grace = resolveGateKillGrace({ project: merged }).value;
    return (Number.isInteger(grace) ? grace : DEFAULT_GATE_KILL_GRACE_MS) + CANCEL_WAIT_SLACK_MS;
  }
  if (!Number.isInteger(value) || value < MIN_CANCEL_WAIT_MS) {
    throw new Error(`${CANCEL_WAIT_KEY} must be an integer of at least ${MIN_CANCEL_WAIT_MS} ms, got ${JSON.stringify(value)}`);
  }
  return value;
}

function selfTuple() {
  return {
    host: os.hostname(),
    bootId: getBootId(),
    pidNs: process.platform === 'linux' ? (/\[(\d+)\]/.exec(getPidNs())?.[1] ?? '') : '',
    pid: process.pid,
    startTime: getProcessStartTime(process.pid) ?? '',
  };
}

function readEnvelope(runDir) {
  try { return JSON.parse(fs.readFileSync(path.join(runDir, 'envelope.json'), 'utf8')); } catch { return null; }
}

/**
 * Publish `cancel-requested.json` for one attempt (once; a file already there stands).
 * @returns {boolean} true when a request is on disk afterwards
 */
export function requestCancel(runDir, signal) {
  const attemptId = readEnvelope(runDir)?.attemptId;
  if (typeof attemptId !== 'string') return false;
  try {
    publishImmutableProof(path.join(runDir, 'cancel-requested.json'), {
      v: 1,
      attemptId,
      requestedBy: `controller pid ${process.pid}`,
      by: `signal:${signal}`,
      requester: selfTuple(),
      at: new Date().toISOString(),
    });
  } catch { return false; }
  return true;
}

/** Wait until every run in `runDirs` has a receipt, or `waitMs` passes. */
async function waitForReceipts(runDirs, waitMs) {
  const deadline = Date.now() + waitMs;
  while (Date.now() < deadline) {
    if (runDirs.every((dir) => fs.existsSync(path.join(dir, 'receipt.json')))) return;
    await sleep(POLL_MS);
  }
}

/**
 * Handle SIGINT and SIGTERM: the first one cancels every registered attempt, waits for the receipts
 * (at most `cancelWaitMs`), prints the resume line and exits 130 or 143; the second exits at once (the
 * cancel files are already written, the supervisors still stop their attempts).
 * @returns {() => void} removes the handlers
 */
export function installCancelOnSignal({ cancelWaitMs, exit = (code) => process.exit(code), stderr = process.stderr } = {}) {
  let first = null;
  const onSignal = (signal) => {
    const code = EXIT_CODES[signal];
    if (first) { exit(first.code); return; }
    first = { code };
    const runDirs = registeredRuns();
    const asked = runDirs.filter((dir) => requestCancel(dir, signal));
    (async () => {
      try { await waitForReceipts(asked, cancelWaitMs); } finally {
        const units = new Set(runDirs.map((dir) => readEnvelope(dir)?.unitRunId).filter(Boolean));
        for (const unit of units) stderr.write(`unit ${unit} chờ resume: fgos run --resume ${unit}\n`);
        exit(code);
      }
    })();
  };
  const handlers = Object.keys(EXIT_CODES).map((signal) => [signal, () => onSignal(signal)]);
  for (const [signal, handler] of handlers) process.on(signal, handler);
  return () => { for (const [signal, handler] of handlers) process.off(signal, handler); };
}
