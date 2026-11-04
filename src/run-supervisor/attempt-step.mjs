// Entry of a post-receipt step of one attempt. The Rust host route `fgos internal attempt-step` execs
// `node attempt-step.mjs <stepId> --run-dir <attemptDir>` from the payload of the release that wrote the
// envelope; it never goes through bin/fgos.mjs. Stdout carries one JSON line (step-receipt.v1 stepProcess):
// done, retry or error. Exit codes: 0 done, 65 envelope-invalid, 66 payload-missing, 70 error,
// 75 retry (no receipt, adopt runs the step again).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXIT_DONE, EXIT_ENVELOPE_INVALID, EXIT_PAYLOAD_MISSING, EXIT_ERROR, EXIT_RETRY, StepError, readEnvelope } from './step-support.mjs';
import { realpathOrNull, releasePayloadRoot } from './payload-root.mjs';
import { RUN_SUPERVISOR_PROTOCOL as PROTOCOL } from './protocol.mjs';

// Each step module is loaded only when its step runs: a step does not pay for the imports of the others.
const STEP_LOADERS = Object.freeze({
  'settle-attempt': async () => (await import('./steps/settle-attempt.mjs')).settleAttempt,
  'finalize-home': async () => (await import('./steps/finalize-home.mjs')).finalizeHome,
  'cleanup-trust': async () => (await import('./steps/cleanup-trust.mjs')).cleanupTrust,
});

/** Variables a step needs from `steps[].env`: the runner starts it with nothing else. */
const REQUIRED_ENV = Object.freeze(['FGOS_STATE_ROOT', process.platform === 'win32' ? 'USERPROFILE' : 'HOME']);

/**
 * The host route already verified the envelope digest, the step id and the payload it execs from. Node
 * checks that the release manifest next to `hostBin` declares the payload the envelope names; a host
 * with no manifest is a development host with nothing to cross-check.
 */
export function verifyPayload(envelope) {
  const named = realpathOrNull(envelope.payloadRoot);
  const declared = typeof envelope.hostBin === 'string' ? releasePayloadRoot(envelope.hostBin) : null;
  if (declared !== null && declared !== named) {
    throw new StepError('payload-missing', 'the release manifest of hostBin does not declare the envelope payloadRoot', EXIT_PAYLOAD_MISSING);
  }
}

function requireStepEnv(env) {
  for (const name of REQUIRED_ENV) {
    if (typeof env[name] !== 'string' || env[name] === '') {
      throw new StepError('envelope-invalid', `step environment lacks ${name}`, EXIT_ENVELOPE_INVALID);
    }
  }
}

function emit(line) {
  process.stdout.write(`${JSON.stringify({ v: 1, protocol: PROTOCOL, ...line })}\n`);
}

/** Run one step; returns the exit code and prints the one result line. */
export async function runAttemptStep(stepId, runDir, { env = process.env } = {}) {
  try {
    const envelope = readEnvelope(runDir);
    const load = STEP_LOADERS[stepId];
    if (!load || !envelope.steps?.some((s) => s.stepId === stepId)) {
      throw new StepError('envelope-invalid', `the envelope has no step ${stepId}`, EXIT_ENVELOPE_INVALID);
    }
    requireStepEnv(env);
    verifyPayload(envelope);
    const outcome = await (await load())({ runDir, envelope, env });
    if (outcome.result === 'retry') {
      emit({ result: 'retry', reason: outcome.reason });
      return EXIT_RETRY;
    }
    emit({ result: 'done', detail: outcome.detail ?? {} });
    return EXIT_DONE;
  } catch (err) {
    const exit = err instanceof StepError ? err.exit : EXIT_ERROR;
    const code = err instanceof StepError ? err.code : (err?.code === 'ENOSPC' || err?.code === 'EACCES' || err?.code === 'EIO' ? 'io' : 'internal');
    emit({ result: 'error', code, message: String(err?.message ?? err).slice(0, 500) });
    return exit;
  }
}

function parseArgs(argv) {
  const stepId = argv[0];
  const at = argv.indexOf('--run-dir');
  const runDir = at > 0 ? argv[at + 1] : undefined;
  return stepId && !stepId.startsWith('--') && runDir ? { stepId, runDir: path.resolve(runDir) } : null;
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  const args = parseArgs(process.argv.slice(2));
  if (!args) {
    process.stderr.write('usage: attempt-step.mjs <stepId> --run-dir <attemptDir>\n');
    process.exitCode = 2;
  } else {
    process.exitCode = await runAttemptStep(args.stepId, args.runDir);
  }
}
