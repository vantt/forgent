// What a controller does when a person presses Ctrl-C (r6 §16): ask the supervisor of every attempt it
// handed over to stop that attempt, wait a bounded time for the receipt, say how to continue, and leave.
// The controller never signals an agent itself; it only publishes `cancel-requested.json`, which the
// supervisor polls. An attempt that is being handed over (`beginLaunch` until its binding is known, or the
// launch fails) is waited for: once it binds it is asked to cancel too, so a signal that lands before the
// binding never leaves an attempt running uncancelled. After the first signal no new launch and no new
// step starts (`assertNotCancelled`): the controller only waits for the receipts and leaves.
//
// Handlers are installed only by a process that asked for it (`enableCancelOnSignal`, the CLI entry);
// an in-process caller of the runner keeps its own signal handling.

import fs from 'node:fs';
import path from 'node:path';
import { publishImmutableProof } from '../runner/dispatch/proof-helpers.mjs';
import { selfRecord } from '../runner/dispatch/process-identity.mjs';

const POLL_MS = 50;
const EXIT_CODES = Object.freeze({ SIGINT: 130, SIGTERM: 143 });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Attempt directories this process delivered to a supervisor and has not yet read the answer of. */
const delivered = new Set();
/** Attempt directories handed to a supervisor whose binding is not known yet. */
const launching = new Set();

// Set by the first signal and never cleared by a running process: the controller is on its way out.
let cancelSignal = null;

/** Forget a cancel request (a host that outlives its controller, such as a test). */
export function resetCancelRequest() {
  cancelSignal = null;
}

export class RunCancelledError extends Error {
  constructor(signal) {
    super(`cancelled by ${signal}: no new step starts; the attempts in flight are stopped and the unit can be resumed`);
    this.name = 'RunCancelledError';
    this.code = 'run-cancelled';
    this.signal = signal;
  }
}

/** Throws `RunCancelledError` once a signal asked this process to cancel; called before every new step. */
export function assertNotCancelled() {
  if (cancelSignal) throw new RunCancelledError(cancelSignal);
}

/** Mark `runDir` as handed to a supervisor; refuses once a cancel was requested (nothing starts after it). */
export function beginLaunch(runDir) {
  assertNotCancelled();
  launching.add(path.resolve(runDir));
}

/** The binding of `runDir` is known (or the launch failed): it is registered or gone. */
export function endLaunch(runDir) {
  launching.delete(path.resolve(runDir));
}

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

// The tuple as the door gives it: the form Rust compares (`pidNs` as `pid:[N]` or `none`).
const selfTuple = selfRecord;

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

/**
 * Handle SIGINT and SIGTERM: the first one cancels every attempt this process delivered or is still handing
 * over, waits for the receipts (at most `cancelWaitMs`), prints the resume line and exits 130 or 143; the
 * second exits at once (the cancel files are already written, the supervisors still stop their attempts).
 * @returns {() => void} removes the handlers
 */
export function installCancelOnSignal({ cancelWaitMs, exit = (code) => process.exit(code), stderr = process.stderr } = {}) {
  let first = null;
  const onSignal = (signal) => {
    const code = EXIT_CODES[signal];
    if (first) { exit(first.code); return; }
    first = { code };
    cancelSignal = signal;
    (async () => {
      const seen = new Set();
      const asked = new Set();
      const sweep = () => {
        for (const dir of [...delivered, ...launching]) {
          seen.add(dir);
          if (delivered.has(dir) && !asked.has(dir)) requestCancel(dir, signal) && asked.add(dir);
        }
      };
      const deadline = Date.now() + cancelWaitMs;
      try {
        for (;;) {
          sweep();
          const answered = [...asked].every((dir) => fs.existsSync(path.join(dir, 'receipt.json')));
          if ((launching.size === 0 && answered) || Date.now() >= deadline) break;
          await sleep(POLL_MS);
        }
      } finally {
        const units = new Set([...seen].map((dir) => readEnvelope(dir)?.unitRunId).filter(Boolean));
        for (const unit of units) stderr.write(`unit ${unit} chờ resume: fgos run --resume ${unit}\n`);
        exit(code);
      }
    })();
  };
  const handlers = Object.keys(EXIT_CODES).map((signal) => [signal, () => onSignal(signal)]);
  for (const [signal, handler] of handlers) process.on(signal, handler);
  return () => { for (const [signal, handler] of handlers) process.off(signal, handler); };
}
