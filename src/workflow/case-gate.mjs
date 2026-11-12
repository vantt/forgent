// src/workflow/case-gate.mjs — the case's whole-worktree gate: the runner, not a seat, runs the project's
// own check over a case worktree and settles the result as the receipt of an activity.
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)
//
// A checker seat runs in a read-only sandbox and cannot run the whole suite, so a regression that only the
// whole suite sees would surface at the last gate. This verb runs that check where it can run: it admits the
// activity like any dispatch (frame, binding, write scope), runs the one bounded command runner in the
// worktree, and settles through the same port a Unit does, so the receipt and its subject digest come from
// the one place that already builds them. Only a passing run can achieve a delivery milestone.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { assertRunTimeoutMs, loadRunnerConfigForDir } from '../runner/dispatch/config.mjs';
import { RunnerConfigError } from '../runner/dispatch/runner-config-error.mjs';
import { answerOfVerify, outcomeOfVerify, runUnderCustody, runVerify } from '../runner/execution/custody-door.mjs';
import { verifyCommandOf, verifySeatResult } from '../runner/execution/loops/verify.mjs';
import { CaseAdmissionRefusedError } from '../runner/execution/case-admission-port.mjs';
import { createCaseAdmissionPort } from './case-admission-port.mjs';
import { GATE_RUN_PREFIX } from './case-runtime.mjs';

/** The default activity a gate settles: the one that produces the integrated tree's receipt. */
const GATE_ACTIVITY = 'integrate';

/**
 * Run the gate command in `worktree` for `activity` of case `caseId`, and settle the result.
 *
 * The command is the `verify` the runner config declares for `capability`, never one a caller supplies; with
 * none declared the gate refuses by name, so a gate never passes for want of something to run. `writes` are the
 * tested paths: the subject whose digest the receipt carries, the same way a slice's write scope is.
 *
 * @param {object} params
 * @param {string} params.mainRoot
 * @param {string} params.caseId
 * @param {string} params.worktree
 * @param {string[]} params.writes
 * @param {string} [params.activity]
 * @param {string} [params.capability]
 * @param {number} [params.timeoutMs]
 * @param {string} [params.reason]
 * @param {object} [params.runnerConfig] test seam: the config instead of the project's
 * @param {object} [params.env]
 * @returns {Promise<{ caseId: string, activity: string, reservationId: string, outcome: 'pass'|'findings'|'execution-failure', gate: object }>}
 */
export async function runCaseGate({
  mainRoot,
  caseId,
  worktree,
  writes,
  activity = GATE_ACTIVITY,
  capability,
  timeoutMs,
  reason,
  runnerConfig,
  env = process.env,
}) {
  if (!Array.isArray(writes) || writes.length === 0) {
    throw new RunnerConfigError('a gate names the paths it tests: pass --writes <paths>', { code: 'gate-writes-required' });
  }
  if (!worktree || !fs.existsSync(worktree)) {
    throw new RunnerConfigError(`a gate runs in a worktree that exists: ${worktree ?? '(none given)'}`, { code: 'gate-worktree-missing' });
  }
  const cfg = runnerConfig ?? loadRunnerConfigForDir(mainRoot);
  const verify = verifyCommandOf({ capability }, cfg)?.trim();
  if (!verify) {
    throw new RunnerConfigError(
      'a gate runs the command declared as capabilities.<capability>.verify: declare it and pass --capability <capability>',
      { code: 'gate-command-missing' },
    );
  }
  const limit = timeoutMs ?? cfg.timeoutMs;
  assertRunTimeoutMs(limit, 'gate timeoutMs');

  const realWorktree = fs.realpathSync(worktree);
  const port = createCaseAdmissionPort({ repoRoot: mainRoot, env });
  const unitRunId = `${GATE_RUN_PREFIX}${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  // The gate's command runs as a borrower of the worktree's custody lease, so killing the gate ends the command
  // with it and a reservation whose custody is free is provably dead. Custody is released before the settle, so
  // the worktree is quiet when the port gives its binding back.
  let admitted;
  const verified = await runUnderCustody(path.join(mainRoot, '.fgos'), realWorktree, async (custody) => {
    admitted = port.admit({
      unitRunId,
      caseRef: { caseId, activity, ...(reason ? { reason } : {}) },
      activity,
      writes,
      worktree: realWorktree,
      readOnly: false,
      seatLaunches: 0,
      blind: false,
      handoffRefs: [],
      reason: reason ?? null,
    });
    if (admitted.refused) throw new CaseAdmissionRefusedError(admitted.refused);
    return runVerify({ command: verify, cwd: realWorktree, timeoutMs: limit, custody });
  });
  // A verdict is the outcome as it stands; a check that did not run to an end is an execution failure, which the
  // case treats as nothing proven.
  const outcome = outcomeOfVerify(verified);
  const passed = outcome === 'pass';
  const gate = {
    command: verify,
    passed,
    status: verified.status,
    timedOut: verified.infrastructure === 'timeout',
    durationMs: verified.durationMs,
    outputDigest: verified.outputDigest,
  };
  const tail = verified.tail;
  const seatResult = verifySeatResult(answerOfVerify(verified, 'Gate command', verify), 1);

  port.settle(admitted.reservationId, {
    caseId,
    outcome,
    unitRunId,
    results: [seatResult],
    seatLaunchesUsed: 0,
    gate,
  });

  return { caseId, activity, reservationId: admitted.reservationId, outcome, gate: { ...gate, ...(passed ? {} : { tail }) } };
}
