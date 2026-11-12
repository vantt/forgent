// custody-door.mjs -- the Execution doors over a worktree's custody and over the verify command.
//
// Custody (the per-worktree dispatch lease in src/run-supervisor/cwd-lock.mjs) is Execution's to take, hold and
// read; a layer above asks these doors and never names the lease or its scopes. The verify door runs one
// verify command, under the custody the caller holds, and says what the run proves: a verdict (the check ran
// and passed or found something) or an infrastructure failure (the check did not run to an end, so it proves
// nothing and runs again). Both Unit verify and the case gate answer through it.

import crypto from 'node:crypto';

import { createLockScope } from '../../holder-lock/index.mjs';
import { cwdDevIno } from '../../holder-lock/registry.mjs';
import { admitSuccessor, dispatchCwdHolder, recordCustodyHandoff } from '../../run-supervisor/cwd-lock.mjs';
import { runCommand } from '../goal-check.mjs';

const TAIL_LINES = 20;

/**
 * Run `body(custody)` as the successor holder of `worktree`'s custody: admitted before the body starts, the
 * hand-off recorded on the object the body returns once it ends, released whichever way it ends. A body that
 * throws records no hand-off. `body` must return an object (the hand-off may attach a warning to it).
 *
 * @template T
 * @param {string} fgosDir
 * @param {string} worktree an existing directory
 * @param {(custody: object) => Promise<T>} body
 * @returns {Promise<T>}
 */
export async function runUnderCustody(fgosDir, worktree, body) {
  const custody = admitSuccessor(createLockScope('unit-custody'), fgosDir, worktree);
  try {
    const result = await body(custody);
    recordCustodyHandoff(custody, result);
    return result;
  } finally {
    custody.release();
  }
}

/** Whether a dispatch holds custody of `worktree` right now (a directory that is gone is held by nobody). */
export function custodyHeld(fgosDir, worktree) {
  return dispatchCwdHolder(fgosDir, worktree) !== null;
}

/** The identity key of a worktree, the same for every spelling of its path; null when it does not exist. */
export function worktreeKey(worktree) {
  return cwdDevIno(worktree) ?? null;
}

/** The lock scope under which a worktree is added to or removed from a repository. */
export function worktreeAdminScope() {
  return createLockScope('workflow-worktree');
}

/**
 * The Execution outcome of a verify answer: a verdict is its own outcome, an infrastructure failure is the
 * `execution-failure` outcome, so a run that stops on it is rerun by `resume`.
 *
 * @param {{ verdict?: 'pass'|'findings', infrastructure?: string }} verify
 * @returns {'pass'|'findings'|'execution-failure'}
 */
export function outcomeOfVerify(verify) {
  return verify.infrastructure ? 'execution-failure' : verify.verdict;
}

/**
 * Run `command` in `cwd`, bounded by `timeoutMs`, as a borrower of the custody the caller holds, and classify it.
 * Exit 0 is `pass`; any other exit is `findings`; a run that timed out, was killed, or could not start is
 * `infrastructure` (`timeout` or `not-run`), because it reached no verdict. Never rejects.
 *
 * @param {object} params
 * @param {string} params.command
 * @param {string} params.cwd
 * @param {number} [params.timeoutMs]
 * @param {object} [params.custody] the custody handle held over `cwd`
 * @returns {Promise<{ verdict: 'pass'|'findings', status: number|null, how: string, tail: string, durationMs: number, outputDigest: string }
 *   | { infrastructure: 'timeout'|'not-run', status: number|null, how: string, tail: string, durationMs: number, outputDigest: string }>}
 */
export async function runVerify({ command, cwd, timeoutMs, custody }) {
  const startedAt = Date.now();
  let ran;
  try {
    ran = await runCommand(command, cwd, timeoutMs, { custody });
  } catch (error) {
    // A custody that cannot be proven alone again after the run is an authority failure: the run proved nothing.
    ran = { passed: false, status: null, timedOut: false, output: String(error?.message ?? error) };
  }
  const output = String(ran.output ?? '');
  const status = ran.status ?? null;
  const how = ran.timedOut ? `timed out after ${timeoutMs}ms` : status === null ? 'could not run' : `exited ${status}`;
  const facts = {
    status,
    how,
    tail: output.trim().split('\n').slice(-TAIL_LINES).join('\n'),
    durationMs: Date.now() - startedAt,
    outputDigest: `sha256:${crypto.createHash('sha256').update(output).digest('hex')}`,
  };
  if (ran.passed === true) return { verdict: 'pass', ...facts };
  if (ran.timedOut) return { infrastructure: 'timeout', ...facts };
  if (status === null) return { infrastructure: 'not-run', ...facts };
  return { verdict: 'findings', ...facts };
}

/**
 * What a verify answer tells a loop's `verify` hook: a pass; findings; or, when the check did not run to an end,
 * the infrastructure kind with the text that says why (it proved nothing, so it is no finding).
 *
 * @param {Awaited<ReturnType<typeof runVerify>>} verified
 * @param {string} subject what ran, as the text names it: `Verification command`, `Gate command`
 * @param {string} command
 * @returns {{ pass: true } | { pass: false, findings: string[] } | { pass: false, infrastructure: string, error: string }}
 */
export function answerOfVerify(verified, subject, command) {
  if (verified.verdict === 'pass') return { pass: true };
  const text = `${subject} ${verified.how}: ${command}${verified.tail ? `\n${verified.tail}` : ''}`;
  return verified.infrastructure
    ? { pass: false, infrastructure: verified.infrastructure, error: text }
    : { pass: false, findings: [text] };
}
