// Entry of a post-receipt step of one attempt. The Rust host route `fgos internal attempt-step`
// execs this file from the payload of the release that wrote the envelope:
//
//   node attempt-step.mjs <stepId> --run-dir <attemptDir>
//
// It never goes through bin/fgos.mjs. Stdout carries one JSON line (step-receipt.v1 stepProcess):
// done, retry or error. Exit codes: 0 done, 65 envelope-invalid, 66 payload-missing, 70 error,
// 75 retry (no receipt, adopt runs the step again).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXIT_DONE, EXIT_ENVELOPE_INVALID, EXIT_PAYLOAD_MISSING, EXIT_ERROR, EXIT_RETRY, StepError, readEnvelope } from './step-support.mjs';
import { settleAttempt } from './steps/settle-attempt.mjs';
import { finalizeHome } from './steps/finalize-home.mjs';
import { realpathOrNull, releasePayloadRoot } from './payload-root.mjs';

export { releasePayloadRoot };

const PROTOCOL = 1;
const PAYLOAD_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const STEPS = Object.freeze({
  'settle-attempt': settleAttempt,
  'finalize-home': finalizeHome,
});

/** Variables a step needs from `steps[].env`: the runner starts it with nothing else. */
const REQUIRED_ENV = Object.freeze(['FGOS_STATE_ROOT', process.platform === 'win32' ? 'USERPROFILE' : 'HOME']);

/** The payload that runs this step is the one the envelope names and the release manifest declares. */
export function verifyPayload(envelope) {
  const named = typeof envelope.payloadRoot === 'string' ? realpathOrNull(envelope.payloadRoot) : null;
  if (!named) throw new StepError('payload-missing', 'payloadRoot of the envelope does not exist', EXIT_PAYLOAD_MISSING);
  if (realpathOrNull(PAYLOAD_ROOT) !== named) {
    throw new StepError('payload-missing', 'this step runs from a payload other than the envelope payloadRoot', EXIT_PAYLOAD_MISSING);
  }
  // A host with no release manifest next to it is a development host: the payload that started the
  // controller is the only anchor there is, and the check above already holds the step to it.
  const declared = releasePayloadRoot(envelope.hostBin);
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
    if (!envelope.steps?.some((s) => s.stepId === stepId) || !STEPS[stepId]) {
      throw new StepError('envelope-invalid', `the envelope has no step ${stepId}`, EXIT_ENVELOPE_INVALID);
    }
    requireStepEnv(env);
    verifyPayload(envelope);
    const outcome = await STEPS[stepId]({ runDir, envelope, env });
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
