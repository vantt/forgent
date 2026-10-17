// Shared by the attempt-step entry and the steps: exit codes, the step error, and the readers of
// the envelope and the side file.

import fs from 'node:fs';
import path from 'node:path';
import { computeSha256Digest } from '../runner/dispatch/proof-helpers.mjs';

export const EXIT_DONE = 0;
export const EXIT_ENVELOPE_INVALID = 65;
export const EXIT_PAYLOAD_MISSING = 66;
export const EXIT_ERROR = 70;
export const EXIT_RETRY = 75;

export class StepError extends Error {
  constructor(code, message, exit = EXIT_ERROR) {
    super(message);
    this.name = 'StepError';
    this.code = code;
    this.exit = exit;
  }
}

export function readEnvelope(runDir) {
  let envelope;
  try {
    envelope = JSON.parse(fs.readFileSync(path.join(runDir, 'envelope.json'), 'utf8'));
  } catch (err) {
    throw new StepError('envelope-invalid', `envelope.json cannot be read: ${err.code ?? err.message}`, EXIT_ENVELOPE_INVALID);
  }
  const { digest, ...body } = envelope ?? {};
  if (envelope?.v !== 3 || digest !== computeSha256Digest(body)) {
    throw new StepError('envelope-invalid', 'envelope is not version 3 or its digest does not match', EXIT_ENVELOPE_INVALID);
  }
  return envelope;
}

/** The secret side file of the attempt, or null when it is gone. */
export function readSideFile(envelope) {
  let side;
  try { side = JSON.parse(fs.readFileSync(envelope.sideFile, 'utf8')); } catch { return null; }
  if (side?.v !== 1 || side.attemptId !== envelope.attemptId) {
    throw new StepError('envelope-invalid', 'side file does not belong to this attempt', EXIT_ENVELOPE_INVALID);
  }
  return side;
}

