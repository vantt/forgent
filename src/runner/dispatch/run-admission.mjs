// dispatch/run-admission.mjs — admit one Run attempt of an Assignment: the attempt number, the
// admission fences (retry identity, predecessor, a prior attempt still in flight) and the atomic
// materialization of its run directory.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { RunnerConfigError } from './runner-config-error.mjs';
import { EFFECTIVE_EXECUTION_CONTRACT_FILE } from './effective-execution-contract.mjs';
import { adoptRun } from '../../run-supervisor/client.mjs';
import {
  publishNextGeneration,
  readMarker,
  fsyncFileBestEffort,
  fsyncDirBestEffort,
  buildRunControlHolder,
  inspectRunControl,
} from '../../run-supervisor/run-lock.mjs';
import { resolveHolderLiveness } from '../../native/process-identity.mjs';
import { publishMutableProjection } from '../../native/proof-helpers.mjs';

function normalizeDigest(digest) {
  if (!digest || typeof digest !== 'string') return null;
  return digest.startsWith('sha256:') ? digest.slice(7) : digest;
}

/**
 * Whether a supervised attempt (`direct` or `terminal`) is still doing real work, independent of whether the
 * runner that started it (the control holder `inspectRunControl` tracks) is alive. The supervisor and the agent
 * outlive their controller, so a runner-only liveness check reads `held: false` the instant the runner dies even
 * while the agent keeps mutating the cwd. Admission's in-flight check and provider-capacity's lease reclaim both
 * need this signal.
 *
 * The answer is the adopt door's own read-only probe of the attempt lock and the domain it declared (`running`,
 * `being-adopted`, `held`). A Run with no envelope (never launched) reads `false`. A probe that cannot run reads
 * `true`: undecidable liveness fails closed.
 */
export function isSupervisedAttemptStillWorking(runDir) {
  if (!fs.existsSync(path.join(runDir, 'envelope.json'))) return false;
  try {
    const { state } = adoptRun(runDir, { probeOnly: true });
    return state === 'running' || state === 'being-adopted' || state === 'held';
  } catch {
    return true;
  }
}

/**
 * The Run id of the most recent admitted generation that still counts: a generation whose retry id was later
 * aborted counts only when its run directory was materialized under that same retry id.
 */
function currentValidRunId(generations, runsDir, admissionMarkersDir) {
  const isGenerationValid = (g) => {
    if (!g.record?.retryId) return true;
    const isAborted = readMarker(path.join(admissionMarkersDir, `${g.record.retryId}.aborted.json`)) !== null;
    if (!isAborted) return true;
    const attemptStr = g.record.attemptStr || String(g.record.attempt).padStart(2, '0');
    const runJsonPath = path.join(runsDir, attemptStr, 'run.json');
    if (!fs.existsSync(runJsonPath)) return false;
    try {
      const runMeta = JSON.parse(fs.readFileSync(runJsonPath, 'utf8'));
      return runMeta?.retryId === g.record.retryId;
    } catch {
      return false;
    }
  };
  const validGenerations = generations.filter(isGenerationValid);
  return validGenerations.length > 0 ? (validGenerations[validGenerations.length - 1].record?.runId ?? null) : null;
}

/**
 * Atomically admit one Run attempt for `assignmentId` under `runsDir`. Fences three outcomes:
 *
 * - The SAME `(retryId, destination, payloadDigest)` tuple as an already-committed generation returns that SAME
 *   attempt/runId, never a new one (idempotent retry).
 * - A DIFFERENT tuple reusing an already-used `retryId` is refused (`duplicate-retry`): a caller's retry identity
 *   may not change what it means partway through.
 * - A caller naming `predecessorRunId` (or contending while a Run is already admitted at all) must supersede the
 *   EXACT current committed Run; any other value is refused (`invalid-predecessor`).
 *
 * The admission-generation ledger (`assignmentDir/admission/generations/`, run-lock.mjs's append-only primitive)
 * is the sole source of truth for attempt numbers: concurrent callers race on one hard-linked path, exactly one
 * wins, every loser rereads and re-evaluates against the new current generation. Once an attempt/runId is
 * committed there, it is never reused or leapfrogged, whether or not its run directory was materialized.
 *
 * The run directory itself (`runs/<NN>/run.json` + `dispatch-plan.json`) is built in a same-filesystem staging
 * directory, fsynced, then published with one atomic rename: a reader never observes a partially-written attempt
 * directory, and a crash between generation commit and rename leaves the generation record as the sole durable
 * fact until a later call for the same tuple resumes and completes it. Final attempt directories are never
 * created empty.
 */
export function admitRunAttempt(
  assignmentDir,
  runsDir,
  assignmentId,
  { retryId, predecessorRunId = null, destination, payloadDigest, expectedRunId, buildRunMeta, buildDispatchPlan, buildEffectiveExecutionContract: buildEffectiveContractOpt, forceNewAttempt = false, refuseIfSettled = false },
) {
  const admissionGenerationsDir = path.join(assignmentDir, 'admission', 'generations');
  const admissionMarkersDir = path.join(assignmentDir, 'admission', 'markers');

  if (retryId !== undefined) {
    if (readMarker(path.join(admissionMarkersDir, `${retryId}.aborted.json`)) !== null) {
      throw new RunnerConfigError(
        `executeAssignment: retryId "${retryId}" for assignment "${assignmentId}" was aborted -- refuse identity reuse`,
      );
    }
  }

  const admission = publishNextGeneration(admissionGenerationsDir, ({ current, nextEpoch, generations }) => {
    // Strict tuple/predecessor fencing is opt-in, gated on the caller supplying a `retryId` at all: a caller
    // that passes none gets "next available attempt". A caller that does opts into the full admission
    // contract: same tuple resumes idempotently, a changed tuple under the same retryId is refused, and the
    // caller must name the exact current Run it supersedes.
    if (retryId !== undefined) {
      const priorForRetryId = generations.find((g) => g.record.retryId === retryId);
      if (priorForRetryId) {
        if (priorForRetryId.record.destination === destination && priorForRetryId.record.admissionPayloadDigest === payloadDigest) {
          return { stop: true, status: 'duplicate', epoch: priorForRetryId.epoch, record: priorForRetryId.record };
        }
        return { stop: true, status: 'duplicate-retry', epoch: priorForRetryId.epoch, record: priorForRetryId.record };
      }
      const currentRunId = currentValidRunId(generations, runsDir, admissionMarkersDir);
      if (predecessorRunId !== currentRunId) {
        return { stop: true, status: 'invalid-predecessor', currentRunId };
      }
    }

    let maxDir = 0;
    if (fs.existsSync(runsDir)) {
      try {
        const entries = fs.readdirSync(runsDir);
        for (const name of entries) {
          if (/^\d+$/.test(name)) {
            const n = parseInt(name, 10);
            if (!Number.isNaN(n) && n > maxDir) maxDir = n;
          }
        }
      } catch {}
    }
    for (const g of generations) {
      if (g.record?.attempt && g.record.attempt > maxDir) {
        maxDir = g.record.attempt;
      }
    }
    let attempt = Math.max(nextEpoch, maxDir + 1);
    while (fs.existsSync(path.join(runsDir, String(attempt).padStart(2, '0')))) {
      attempt += 1;
    }

    // `expectedRunId` is checked against the computed attempt, never used to bump it: a caller that named an
    // exact expected identity (a session retry declaration) gets exactly that identity or a refusal, never a
    // different runId drifting out of two ledgers that were supposed to stay in lockstep.
    const attemptStr = String(attempt).padStart(2, '0');
    const runId = `run_${assignmentId}_${attemptStr}`;
    if (expectedRunId !== undefined && runId !== expectedRunId) {
      return { stop: true, status: 'invalid-predecessor', currentRunId: currentValidRunId(generations, runsDir, admissionMarkersDir), expectedRunId, computedRunId: runId };
    }
    // A new admission is refused while the current attempt has neither settled (result.json) nor provably
    // stopped: admitting anyway would start a second worker racing the first. Its runner being dead is not
    // enough, since the supervisor and agent outlive it. The operator overrides with `forceNewAttempt`
    // (--force-new-attempt).
    if (current && !forceNewAttempt) {
      const priorAttemptStr = current.record.attemptStr || String(current.record.attempt).padStart(2, '0');
      const priorRunDir = path.join(runsDir, priorAttemptStr);
      if (!fs.existsSync(path.join(priorRunDir, 'result.json'))) {
        const priorControl = inspectRunControl(priorRunDir);
        // Between its admission and its run control (`acquireRunControl`, a later step of `executeAssignment`)
        // a sibling caller holds neither a control record nor a supervisor, so the only sign of it is the
        // admitting process stamped into the same CAS record as `admittedBy`. Consulted only while no control
        // record exists; once one does, `priorControl.held` alone decides.
        const admitterAlive =
          !priorControl.controlEpoch && current.record.admittedBy && resolveHolderLiveness(current.record.admittedBy) === 'held';
        const priorDetachedRunStillWorking = isSupervisedAttemptStillWorking(priorRunDir);
        if (priorControl.held || priorDetachedRunStillWorking || admitterAlive) {
          return {
            stop: true,
            status: 'run-in-flight',
            priorRunId: current.record.runId,
            priorAttempt: current.record.attempt,
            holder: priorControl.holder ?? current.record.admittedBy ?? null,
          };
        }
      } else if (refuseIfSettled) {
        // Opt-in only: a settled current attempt is what a legitimate retry admits a fresh attempt over. A
        // first, non-retry dispatch cannot otherwise tell "a concurrent sibling already finished this exact
        // dispatch" from "nothing has happened yet"; deciding it inside this CAS is the only race-free place.
        return { stop: true, status: 'run-already-settled', priorRunId: current.record.runId, priorAttempt: current.record.attempt };
      }
    }
    return {
      record: {
        attempt,
        attemptStr,
        runId,
        retryId: retryId ?? null,
        predecessorRunId,
        destination,
        admissionPayloadDigest: payloadDigest,
        admittedAt: new Date().toISOString(),
        // The admitting process, stamped into this same atomic commit (see `admitterAlive` above).
        admittedBy: buildRunControlHolder(`${runId}:admission:${process.pid}`),
      },
    };
  });

  if (admission.status === 'duplicate-retry') {
    throw new RunnerConfigError(
      `executeAssignment: retryId "${retryId}" for assignment "${assignmentId}" was already admitted with a different destination/payload digest -- refusing (duplicate-retry)`,
      { code: 'admission-duplicate-retry', phase: 'pre-admission' },
    );
  }
  if (admission.status === 'invalid-predecessor') {
    throw new RunnerConfigError(
      `executeAssignment: predecessorRunId "${predecessorRunId}" for assignment "${assignmentId}" does not match the current committed Run "${admission.currentRunId}" -- refusing (invalid-predecessor)`,
      { code: 'admission-invalid-predecessor', phase: 'pre-admission' },
    );
  }
  if (admission.status === 'run-in-flight') {
    // Nothing for this new attempt was created (no run directory): 'pre-admission', like every refusal above.
    throw new RunnerConfigError(
      `executeAssignment: assignment "${assignmentId}"'s prior attempt "${admission.priorRunId}" (attempt ${admission.priorAttempt}) has not settled and its control holder is alive or its liveness could not be disproven -- refusing a new attempt that would race it (pass --force-new-attempt to override)`,
      { code: 'admission-run-in-flight', phase: 'pre-admission', priorRunId: admission.priorRunId, priorAttempt: admission.priorAttempt, holder: admission.holder },
    );
  }
  if (admission.status === 'run-already-settled') {
    throw new RunnerConfigError(
      `executeAssignment: assignment "${assignmentId}"'s prior attempt "${admission.priorRunId}" (attempt ${admission.priorAttempt}) already settled -- the caller opted into refuseIfSettled and must resume/link that result instead of dispatching a fresh attempt over it`,
      { code: 'admission-run-already-settled', phase: 'pre-admission', priorRunId: admission.priorRunId, priorAttempt: admission.priorAttempt },
    );
  }

  const record = admission.record;
  const runDir = path.join(runsDir, record.attemptStr);

  if (fs.existsSync(runDir)) {
    if (retryId !== undefined && admission.status === 'duplicate') {
      return { attemptNum: record.attempt, attemptStr: record.attemptStr, runId: record.runId, runDir, resumed: true };
    }
  }

  // Abandoned staging is not admission: it is removed only after its retry id and digest match this record.
  try {
    if (fs.existsSync(runsDir)) {
      const entries = fs.readdirSync(runsDir);
      for (const name of entries) {
        if (name === `.staging-${record.attemptStr}` || name.startsWith(`.staging-${record.attemptStr}-`)) {
          const abandonedPath = path.join(runsDir, name);
          try {
            // Never delete a staging directory of a live process.
            const pidMatch = /^\.staging-[^-]+-(\d+)-/.exec(name);
            if (pidMatch) {
              const stagedPid = parseInt(pidMatch[1], 10);
              if (resolveHolderLiveness({ pid: stagedPid }) !== 'dead') {
                continue;
              }
            }

            // Staging named without pid and uuid (.staging-NN).
            if (name === `.staging-${record.attemptStr}`) {
              fs.rmSync(abandonedPath, { recursive: true, force: true });
              continue;
            }

            const stagedMetaPath = path.join(abandonedPath, 'run.json');
            if (fs.existsSync(stagedMetaPath)) {
              const stagedMeta = JSON.parse(fs.readFileSync(stagedMetaPath, 'utf8'));
              const normStaged = normalizeDigest(stagedMeta.payloadDigest);
              const normAdmission = normalizeDigest(record.admissionPayloadDigest);
              if (
                stagedMeta.retryId === (record.retryId ?? null) &&
                normStaged === normAdmission
              ) {
                fs.rmSync(abandonedPath, { recursive: true, force: true });
              }
            }
          } catch {}
        }
      }
    }
  } catch {}

  const stagingDir = path.join(runsDir, `.staging-${record.attemptStr}-${process.pid}-${crypto.randomUUID()}`);
  fs.mkdirSync(stagingDir, { recursive: true });

  const runMeta = buildRunMeta(record);
  const runMetaPath = path.join(stagingDir, 'run.json');
  fs.writeFileSync(runMetaPath, `${JSON.stringify(runMeta, null, 2)}\n`);
  fsyncFileBestEffort(runMetaPath);

  if (buildDispatchPlan) {
    const dispatchPlan = buildDispatchPlan(record);
    if (dispatchPlan) {
      const dispatchPlanPath = path.join(stagingDir, 'dispatch-plan.json');
      fs.writeFileSync(dispatchPlanPath, `${JSON.stringify(dispatchPlan, null, 2)}\n`);
      fsyncFileBestEffort(dispatchPlanPath);
    }
  }

  if (buildEffectiveContractOpt) {
    const effectiveContract = buildEffectiveContractOpt(record);
    if (effectiveContract) {
      const contractPath = path.join(stagingDir, EFFECTIVE_EXECUTION_CONTRACT_FILE);
      publishMutableProjection(contractPath, effectiveContract);
    }
  }
  fsyncDirBestEffort(stagingDir);

  try {
    fs.renameSync(stagingDir, runDir);
  } catch (err) {
    if (
      err.code === 'ENOTEMPTY' ||
      err.code === 'EEXIST' ||
      (process.platform === 'win32' && (err.code === 'EPERM' || err.code === 'EACCES') && fs.existsSync(runDir))
    ) {
      fs.rmSync(stagingDir, { recursive: true, force: true });
      return { attemptNum: record.attempt, attemptStr: record.attemptStr, runId: record.runId, runDir, resumed: true };
    } else {
      throw err;
    }
  }
  fsyncDirBestEffort(runsDir);

  return { attemptNum: record.attempt, attemptStr: record.attemptStr, runId: record.runId, runDir, resumed: false };
}
