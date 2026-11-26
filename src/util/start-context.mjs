// The Node side of the start-context composer: one call of `fgos internal start-context compose` through the host
// (`FGOS_HOST_BIN` or the activated release). Every Node caller that needs start text asks here; none renders it.

import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { resolveHostBin } from './host-bin.mjs';

const PREFIX = '\u001eFGOS-START-CONTEXT ';
const PROTOCOL = 1;
const TIMEOUT_MS = 60_000;

export class StartContextError extends Error {
  constructor(code, message, extra = {}) {
    super(message);
    this.name = 'StartContextError';
    this.code = code;
    Object.assign(this, extra);
  }
}

/**
 * Composes one start: `request` is a StartRequest (`packages/agent-start-context/contracts/start-request.v1.json`).
 * Answers the StartContext; a refusal throws `StartContextError` with code `START_CONTEXT_REFUSED` and the refusal,
 * a missing or failing host with `START_CONTEXT_FAILED`.
 */
export function composeStart(projectRoot, request) {
  const root = path.resolve(projectRoot);
  const hostBin = resolveHostBin(root);
  if (!hostBin) throw new StartContextError('START_CONTEXT_FAILED', 'No fgos host binary found to compose the start (set FGOS_HOST_BIN or activate a release)');
  const run = spawnSync(hostBin, ['internal', 'start-context', 'compose', '--protocol', String(PROTOCOL), '--root', root], {
    input: `${JSON.stringify(request)}\n`,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    timeout: TIMEOUT_MS,
    killSignal: 'SIGKILL',
    windowsHide: true,
  });
  if (run.error) throw new StartContextError('START_CONTEXT_FAILED', `The fgos host at ${hostBin} could not compose the start: ${run.error.message}`);
  const answer = (run.stdout ?? '').split('\n').find((line) => line.startsWith(PREFIX));
  let line;
  try {
    line = JSON.parse(answer.slice(PREFIX.length));
  } catch {
    throw new StartContextError(
      'START_CONTEXT_FAILED',
      `The fgos host at ${hostBin} gave no start-context answer (exit ${run.status}): ${String(run.stderr ?? '').trim().slice(0, 300) || 'no output'}; it may predate that door`,
    );
  }
  if (line.error) throw new StartContextError('START_CONTEXT_FAILED', `The start-context composer failed (${line.error.code}): ${line.error.message}`);
  if (line.refusal) throw new StartContextError('START_CONTEXT_REFUSED', `The start is refused: ${line.refusal.code}: ${line.refusal.message}`, { refusal: line.refusal });
  return line.result;
}

/** The text an agent receives: the blocks in order, a blank line between two blocks. */
export const startText = (context) => context.blocks.map((block) => block.text).join('\n\n');
