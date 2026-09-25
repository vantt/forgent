// dispatch/herdr-reconcile.mjs — S2 proof layer & reconciliation for Herdr spawn runs (Phase 09 R5)
//
// Extracts Herdr launch command tracking, adapter receipts, resource incarnation,
// and state reconciliation out of herdr-round.mjs into an independent reconciliation module.

import fs from 'node:fs';
import path from 'node:path';
import { DispatchError } from './dispatch-error.mjs';
import { interpretRunResult } from './run-result.mjs';
import { getProcessStartTime } from './process-identity.mjs';
import {
  publishImmutableProof,
  publishMutableProjection,
  computeSha256Digest,
  commitCommandOutcome,
  patchCommandRecord,
} from './proof-helpers.mjs';

export class HerdrLaunchCollisionError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'HerdrLaunchCollisionError';
    this.code = 'launch-collision';
    Object.assign(this, details);
  }
}

export function computeHerdrResourceIncarnation({
  paneId = null,
  shellPid = null,
  workerPid = null,
  foregroundPgid = null,
  gatewaySessionId = null,
  processStartTime = null,
} = {}) {
  return {
    contract: 'herdr-resource-incarnation.v1',
    paneId: paneId || null,
    shellPid: shellPid || null,
    workerPid: workerPid || null,
    foregroundPgid: foregroundPgid || null,
    gatewaySessionId: gatewaySessionId || null,
    processStartTime: processStartTime || null,
  };
}

export function matchIncarnations(a, b) {
  if (!a || !b) return false;
  if (a.paneId && b.paneId && a.paneId !== b.paneId) return false;
  if (a.workerPid && b.workerPid) {
    if (a.workerPid !== b.workerPid) return false;
  } else if ((a.workerPid && !b.workerPid) || (!a.workerPid && b.workerPid)) {
    return false;
  }
  if (a.processStartTime && b.processStartTime) {
    if (a.processStartTime !== b.processStartTime) return false;
  } else if ((a.processStartTime && !b.processStartTime) || (!a.processStartTime && b.processStartTime)) {
    return false;
  }
  if (a.shellPid && b.shellPid && a.shellPid !== b.shellPid) return false;
  if (a.gatewaySessionId && b.gatewaySessionId && a.gatewaySessionId !== b.gatewaySessionId) return false;
  return true;
}

export function createHerdrLaunchCommand(runDir, launchContext, {
  state = 'pending',
  herdrName = null,
  preparedInvocationDigest = null,
  agentSession = null,
  paneId = null,
  resourceIncarnation = null,
  outcome = null,
  checkDuplicate = true,
} = {}) {
  const runId = launchContext.run?.runId || launchContext.runId;
  const launchCommandId = launchContext.command?.launchCommandId || launchContext.launchCommandId;
  const controlEpoch = launchContext.command?.controlEpoch ?? launchContext.controlEpoch ?? 1;
  const controlTokenDigest = launchContext.command?.controlTokenDigest || (launchContext.controlToken ? computeSha256Digest(launchContext.controlToken) : null);
  const requestDigest = computeSha256Digest(launchContext);
  const effectiveHerdrName = herdrName || `fgos-${runId}-${launchCommandId}`;

  const commandsDir = path.join(runDir, 'controller', 'commands');
  fs.mkdirSync(commandsDir, { recursive: true });
  const cmdPath = path.join(commandsDir, `${launchCommandId}.json`);

  if (checkDuplicate) {
    const existingFiles = fs.readdirSync(commandsDir).filter((f) => f.endsWith('.json'));
    for (const f of existingFiles) {
      try {
        const existing = JSON.parse(fs.readFileSync(path.join(commandsDir, f), 'utf8'));
        if (existing.runId === runId && (existing.state === 'pending' || existing.state === 'reconciled')) {
          if (existing.launchCommandId !== launchCommandId || f !== `${launchCommandId}.json`) {
            throw new HerdrLaunchCollisionError(`launch command for run ${runId} already exists as ${existing.launchCommandId}`, {
              runId,
              existingCommandId: existing.launchCommandId,
              existingCommand: existing,
            });
          }
        }
      } catch (err) {
        if (err instanceof HerdrLaunchCollisionError) throw err;
      }
    }
  }

  const cmd = {
    contract: 'herdr-launch-command.v1',
    runId,
    launchCommandId,
    controlEpoch,
    controlTokenDigest,
    state,
    requestDigest,
    preparedInvocationDigest,
    herdrName: effectiveHerdrName,
    agentSession,
    paneId,
    resourceIncarnation,
    outcome,
  };

  publishMutableProjection(cmdPath, cmd);
  return cmd;
}

export function readHerdrLaunchCommand(runDir, launchCommandId) {
  const cmdPath = path.join(runDir, 'controller', 'commands', `${launchCommandId}.json`);
  if (!fs.existsSync(cmdPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(cmdPath, 'utf8'));
  } catch {
    return null;
  }
}

export function publishHerdrAdapterReceipt(runDir, launchCommandId, receiptData) {
  const { digest: _existingDigest, ...receiptWithoutDigest } = receiptData;
  const digest = computeSha256Digest(receiptWithoutDigest);
  const fullReceipt = {
    ...receiptWithoutDigest,
    digest,
  };
  const receiptsDir = path.join(runDir, 'protected', 'adapter-receipts');
  fs.mkdirSync(receiptsDir, { recursive: true });
  const receiptPath = path.join(receiptsDir, `${launchCommandId}.json`);
  publishImmutableProof(receiptPath, fullReceipt);
  return fullReceipt;
}

export function readHerdrAdapterReceipt(runDir, launchCommandId) {
  const receiptPath = path.join(runDir, 'protected', 'adapter-receipts', `${launchCommandId}.json`);
  if (!fs.existsSync(receiptPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Unified receipt publication and terminal outcome commit for Herdr spawn runs (Phase 09 R5).
 * Used by runHerdrRound for both settled and failed paths, and by reconcileHerdrSpawnRun.
 */
export function publishHerdrCompletionReceipt({
  runDir,
  launchCommandId,
  runId,
  preparedInvocationDigest = null,
  herdrName,
  paneId = null,
  agentSession = null,
  resourceIncarnation = null,
  startArgvDigest = null,
  workerCommandDigest = null,
  completion,
  result = null,
  controlEpoch,
  controlToken,
  verifyDigests = false,
}) {
  let effectivePreparedInvocationDigest = preparedInvocationDigest;
  if (verifyDigests) {
    let prepRec = null;
    const prepPath = path.join(runDir, 'protected', 'prepared-invocation', `${launchCommandId}.json`);
    if (fs.existsSync(prepPath)) {
      try { prepRec = JSON.parse(fs.readFileSync(prepPath, 'utf8')); } catch {}
    }
    const cmdOnDisk = readHerdrLaunchCommand(runDir, launchCommandId);
    if (!effectivePreparedInvocationDigest) {
      effectivePreparedInvocationDigest = cmdOnDisk?.preparedInvocationDigest || null;
    }
    if (cmdOnDisk?.preparedInvocationDigest && effectivePreparedInvocationDigest && effectivePreparedInvocationDigest !== cmdOnDisk.preparedInvocationDigest) {
      throw new DispatchError('confinement-mismatch', `preparedInvocationDigest mismatch: caller gave ${effectivePreparedInvocationDigest} but launch command has ${cmdOnDisk.preparedInvocationDigest}`);
    }
    if (prepRec) {
      const actualPDig = prepRec.digest || computeSha256Digest(prepRec);
      if (effectivePreparedInvocationDigest && effectivePreparedInvocationDigest !== actualPDig) {
        throw new DispatchError('confinement-mismatch', `preparedInvocationDigest mismatch: record is ${actualPDig} but got ${effectivePreparedInvocationDigest}`);
      }
    }
  }

  const receiptData = {
    contract: 'herdr-adapter-receipt.v1',
    runId,
    launchCommandId,
    preparedInvocationDigest: effectivePreparedInvocationDigest,
    herdrName,
    paneId: paneId || null,
    agentSession: agentSession || null,
    resourceIncarnation,
    startArgvDigest,
    workerCommandDigest,
    completion: {
      kind: completion.kind,
      reason: completion.reason || completion.kind,
      settledAt: completion.settledAt || new Date().toISOString(),
    },
    result: result || null,
  };

  const receipt = publishHerdrAdapterReceipt(runDir, launchCommandId, receiptData);

  commitCommandOutcome({
    runDir,
    launchCommandId,
    controlEpoch,
    controlToken,
    state: 'reconciled',
    outcome: { kind: 'receipt-backed', receiptDigest: receipt.digest },
    patch: {
      paneId: paneId || null,
      agentSession: agentSession || null,
      ...(resourceIncarnation ? { resourceIncarnation } : {}),
    },
  });

  return receipt;
}

export async function reconcileHerdrSpawnRun(runDir, opts = {}) {
  // 1. Check action: unsupported operations
  if (opts.action === 'cancel' || opts.operation === 'cancel') {
    return { status: 'parked', reason: 'cancel-unsupported' };
  }
  if (opts.action === 'shared-cwd-takeover' || opts.operation === 'shared-cwd-takeover') {
    return { status: 'parked', reason: 'shared-cwd-takeover-unsupported' };
  }
  if (opts.resourceClosed === true) {
    return { status: 'parked', reason: 'closed-resource' };
  }

  // 2. Check result.json
  const resultJsonPath = path.join(runDir, 'result.json');
  if (fs.existsSync(resultJsonPath)) {
    try {
      let expectedRunId = opts.expectedRunId ?? opts.runId;
      if (!expectedRunId) {
        const runJsonPath = path.join(runDir, 'run.json');
        if (fs.existsSync(runJsonPath)) {
          try { expectedRunId = JSON.parse(fs.readFileSync(runJsonPath, 'utf8'))?.runId; } catch {}
        }
      }
      const settledResult = interpretRunResult(resultJsonPath, { expectedRunId });
      const hasMismatch = Boolean(expectedRunId && settledResult?.runId && settledResult.runId !== expectedRunId);
      if (hasMismatch || !settledResult) {
        return { status: 'corrupt', corrupt: true, resultCorrupt: true, runResult: Object.freeze(settledResult) };
      }
      return { status: 'settled', settled: true, runResult: Object.freeze(settledResult) };
    } catch {}
  }

  // 3. Check controller/commands
  const commandsDir = path.join(runDir, 'controller', 'commands');
  if (!fs.existsSync(commandsDir)) {
    return { status: 'parked', reason: 'command-missing' };
  }
  const commandFiles = fs.readdirSync(commandsDir).filter((f) => f.endsWith('.json'));
  if (commandFiles.length === 0) {
    return { status: 'parked', reason: 'command-missing' };
  }

  commandFiles.sort();
  const commandFile = commandFiles[commandFiles.length - 1];
  const launchCommandId = path.basename(commandFile, '.json');
  const commandPath = path.join(commandsDir, commandFile);
  let command;
  try {
    command = JSON.parse(fs.readFileSync(commandPath, 'utf8'));
  } catch {
    return { status: 'parked', reason: 'command-missing' };
  }

  // Stale controller verification
  const isStale = (opts.controlEpoch !== undefined && opts.controlEpoch < command.controlEpoch) ||
    (opts.controlToken !== undefined && command.controlTokenDigest && computeSha256Digest(opts.controlToken) !== command.controlTokenDigest);
  if (isStale) {
    return { status: 'observed', outcome: command.outcome, receipt: readHerdrAdapterReceipt(runDir, launchCommandId), settled: false };
  }
  if (opts.tokenCurrent === false) {
    return { status: 'observed', outcome: command.outcome, receipt: readHerdrAdapterReceipt(runDir, launchCommandId), settled: false };
  }

  // Check evaluator baseline if exists
  const baselinePath = path.join(runDir, 'controller', 'evaluator-baseline.json');
  if (fs.existsSync(baselinePath)) {
    try {
      const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
      const { digest: baselineDigest, ...baselineWithoutDigest } = baseline;
      if (baselineDigest && baselineDigest !== computeSha256Digest(baselineWithoutDigest)) {
        return { status: 'refused', reason: 'evaluator-baseline-mismatch' };
      }
    } catch {
      return { status: 'parked', reason: 'evaluator-baseline-missing' };
    }
  }

  // Check receipt tamper if receipt already exists
  const receipt = readHerdrAdapterReceipt(runDir, launchCommandId);
  if (receipt) {
    if (receipt.digest) {
      const { digest: rDig, ...rBody } = receipt;
      if (rDig !== computeSha256Digest(rBody)) {
        return { status: 'refused', reason: 'protected-artifact-corrupt' };
      }
    }
    const actualRecDigest = receipt.digest || computeSha256Digest(receipt);
    if (command.outcome?.receiptDigest && command.outcome.receiptDigest !== actualRecDigest) {
      return { status: 'refused', reason: 'protected-artifact-corrupt' };
    }
    if (command.receiptDigest && command.receiptDigest !== actualRecDigest) {
      return { status: 'refused', reason: 'protected-artifact-corrupt' };
    }

    // HIGH-4: Cross-check receipt digests against pending command
    if (receipt.preparedInvocationDigest || command.preparedInvocationDigest) {
      if (receipt.preparedInvocationDigest !== command.preparedInvocationDigest) {
        return { status: 'refused', reason: 'confinement-mismatch' };
      }
    }
  }

  // Window: command already reconciled
  if (command.state === 'reconciled') {
    if (command.outcome?.kind === 'submission-refused') {
      return { status: 'refused', outcome: command.outcome, reason: 'submission-refused' };
    }
    if (command.outcome?.kind === 'receipt-backed') {
      // F2: Settlement MUST require the real worker outbox result file to exist and be readable
      if (receipt && receipt.completion?.kind === 'settled' && receipt.result?.outboxPath) {
        const outboxFullPath = path.join(runDir, receipt.result.outboxPath);
        if (fs.existsSync(outboxFullPath)) {
          try {
            const outboxContent = fs.readFileSync(outboxFullPath, 'utf8');
            const outboxDigest = computeSha256Digest(outboxContent);
            if (receipt.result.outboxDigest && receipt.result.outboxDigest !== outboxDigest) {
              return { status: 'refused', reason: 'protected-artifact-corrupt', settled: false };
            }
            return { status: 'settled', outcome: command.outcome, receipt, settled: true };
          } catch {
            return { status: 'refused', reason: 'protected-artifact-corrupt', settled: false };
          }
        }
      }
      return {
        status: 'failed',
        outcome: command.outcome,
        receipt,
        settled: false,
        reason: receipt?.completion?.kind || 'unsettled-outcome',
      };
    }
  }

  // Window: command pending, no prepared invocation
  if (!command.preparedInvocationDigest) {
    if (opts.canPrepare && typeof opts.prepareConfinement === 'function') {
      try {
        const prep = await opts.prepareConfinement();
        command.preparedInvocationDigest = prep.preparedInvocationDigest;
        // H13: same CAS-fenced door as driveRound's own interim writes --
        // a caller reaching this branch is doing live confinement
        // preparation, the same class of operation that already threads a
        // real controlEpoch/controlToken everywhere else in this file.
        patchCommandRecord({
          runDir, launchCommandId,
          controlEpoch: opts.controlEpoch, controlToken: opts.controlToken,
          patch: { preparedInvocationDigest: command.preparedInvocationDigest },
        });
      } catch (err) {
        return { status: 'parked', reason: 'prepared-invocation-missing', error: err.message };
      }
    } else {
      return { status: 'parked', reason: 'prepared-invocation-missing' };
    }
  }

  // Check prepared invocation on disk
  const prepPath = path.join(runDir, 'protected', 'prepared-invocation', `${launchCommandId}.json`);
  if (!fs.existsSync(prepPath)) {
    return { status: 'parked', reason: 'prepared-invocation-missing' };
  }
  // Authority's own canonical `workerInvocation.workerCommandDigest`
  // (sha256 of just {command, args}), hoisted out of the try block below so
  // a synthesized receipt (built further down when settlement is inferred
  // from a real outbox result with no receipt yet on disk) can reuse the
  // SAME value instead of falling back to `command.preparedInvocationDigest`
  // -- a different digest entirely (of the whole prepared-invocation
  // record, not the worker command), which conflated two distinct notions
  // of "workerCommandDigest" and could never agree with a receipt a live
  // round actually published.
  let authorityWorkerCommandDigest = null;
  try {
    const prepRec = JSON.parse(fs.readFileSync(prepPath, 'utf8'));
    const { digest: pDig, ...pBody } = prepRec;
    if (pDig && pDig !== computeSha256Digest(pBody)) {
      return { status: 'refused', reason: 'protected-artifact-corrupt' };
    }
    const actualPDig = pDig || computeSha256Digest(prepRec);
    if (command.preparedInvocationDigest && command.preparedInvocationDigest !== actualPDig) {
      return { status: 'refused', reason: 'confinement-mismatch' };
    }
    if (receipt && receipt.preparedInvocationDigest && receipt.preparedInvocationDigest !== actualPDig) {
      return { status: 'refused', reason: 'confinement-mismatch' };
    }
    // Authority's real prepared-invocation record nests these under
    // `workerInvocation` (confinement-adapter-contract.md's Authority Prepared
    // Invocation V1 shape) -- reading them off `prepRec` directly compared
    // against `undefined` and this check silently never fired.
    if (receipt && prepRec.workerInvocation?.workerCommandDigest && receipt.workerCommandDigest && receipt.workerCommandDigest !== prepRec.workerInvocation.workerCommandDigest) {
      return { status: 'refused', reason: 'confinement-mismatch' };
    }
    if (receipt && prepRec.workerInvocation?.envDigest && receipt.envDigest && receipt.envDigest !== prepRec.workerInvocation.envDigest) {
      return { status: 'refused', reason: 'confinement-mismatch' };
    }
    authorityWorkerCommandDigest = prepRec.workerInvocation?.workerCommandDigest ?? null;
  } catch {
    return { status: 'refused', reason: 'protected-artifact-corrupt' };
  }

  // Check worker outbox result
  const outboxDirs = [
    path.join(runDir, 'outbox'),
    path.join(runDir, 'worker-output', 'outbox'),
  ];
  let outboxResultPath = null;
  for (const od of outboxDirs) {
    if (fs.existsSync(od)) {
      const files = fs.readdirSync(od).filter((f) => (f.startsWith('result-') || f === 'result.json') && f.endsWith('.json'));
      if (files.length > 0) {
        outboxResultPath = path.join(od, files[0]);
        break;
      }
    }
  }

  if (outboxResultPath && fs.existsSync(outboxResultPath)) {
    const outboxContent = fs.readFileSync(outboxResultPath, 'utf8');
    const outboxDigest = computeSha256Digest(outboxContent);
    let effectiveReceipt = receipt;
    if (!effectiveReceipt) {
      effectiveReceipt = publishHerdrCompletionReceipt({
        runDir,
        launchCommandId,
        runId: command.runId,
        preparedInvocationDigest: command.preparedInvocationDigest,
        herdrName: command.herdrName,
        paneId: command.paneId,
        agentSession: command.agentSession,
        resourceIncarnation: command.resourceIncarnation,
        startArgvDigest: command.startArgvDigest || computeSha256Digest({ herdrName: command.herdrName }),
        workerCommandDigest: command.workerCommandDigest ?? authorityWorkerCommandDigest,
        completion: {
          kind: 'settled',
          reason: 'worker-outbox-settled',
        },
        result: {
          outboxPath: path.relative(runDir, outboxResultPath),
          outboxDigest,
        },
        controlEpoch: opts.controlEpoch,
        controlToken: opts.controlToken,
      });
    } else {
      const commandOutcome = { kind: 'receipt-backed', receiptDigest: effectiveReceipt.digest };
      commitCommandOutcome({
        runDir, launchCommandId,
        controlEpoch: opts.controlEpoch, controlToken: opts.controlToken,
        state: 'reconciled',
        outcome: commandOutcome,
      });
    }

    const commandOutcome = { kind: 'receipt-backed', receiptDigest: effectiveReceipt.digest };
    return {
      status: 'settled',
      settled: true,
      receipt: effectiveReceipt,
      outcome: commandOutcome,
    };
  }

  // If no outbox result, check closed resource
  if (opts.resourceClosed === true) {
    return { status: 'parked', reason: 'closed-resource' };
  }

  // Check Herdr probe
  const probe = opts.probe || (opts.herdrClient ? async (herdrName, paneId) => {
    let info = null;
    try {
      info = opts.herdrClient.agentGet(herdrName);
    } catch {
      if (paneId) {
        try {
          info = opts.herdrClient.agentGet(paneId);
        } catch {}
      }
    }
    if (info) {
      let pInfo = null;
      if (paneId) {
        try { pInfo = opts.herdrClient.paneProcessInfo(paneId); } catch {}
      }
      const workerProc = pInfo?.foregroundProcesses?.find((p) => p.pid && p.pid !== pInfo?.shellPid);
      const gwSessionId = opts.gatewaySessionId || opts.herdrClient?.gatewaySessionId || process.env.HERDR_GATEWAY_SESSION_ID || null;
      const resourceIncarnation = pInfo ? computeHerdrResourceIncarnation({
        paneId,
        shellPid: pInfo.shellPid || null,
        workerPid: workerProc?.pid || null,
        foregroundPgid: pInfo.foregroundPgid || null,
        gatewaySessionId: gwSessionId,
        processStartTime: workerProc?.pid ? getProcessStartTime(workerProc.pid) : null,
      }) : null;
      return {
        status: info?.agent_status || info?.agentStatus || 'present',
        agentSession: info?.agent_session?.value || info?.agentSession || null,
        resourceIncarnation,
        info,
      };
    }
    if (paneId) {
      try {
        const pInfo = opts.herdrClient.paneProcessInfo(paneId);
        const workerProc = pInfo?.foregroundProcesses?.find((p) => p.pid && p.pid !== pInfo?.shellPid);
        const gwSessionId = opts.gatewaySessionId || opts.herdrClient?.gatewaySessionId || process.env.HERDR_GATEWAY_SESSION_ID || null;
        return {
          status: workerProc ? 'present' : 'absent',
          resourceIncarnation: computeHerdrResourceIncarnation({
            paneId,
            shellPid: pInfo.shellPid || null,
            workerPid: workerProc?.pid || null,
            foregroundPgid: pInfo.foregroundPgid || null,
            gatewaySessionId: gwSessionId,
            processStartTime: workerProc?.pid ? getProcessStartTime(workerProc.pid) : null,
          }),
        };
      } catch {
        return { status: 'absent' };
      }
    }
    return { status: 'absent' };
  } : null);

  if (probe) {
    const probeResult = await probe(command.herdrName, command.paneId);
    if (probeResult.closed === true || probeResult.status === 'closed') {
      return { status: 'parked', reason: 'closed-resource' };
    }

    if (probeResult.status === 'absent' || probeResult.notFound || probeResult.absentProven === true) {
      return { status: 'parked', reason: 'unknown-launch' };
    }

    // Probed resource exists
    // Require non-trivial recorded incarnation (must have workerPid or shellPid)
    if (!command.resourceIncarnation || (!command.resourceIncarnation.workerPid && !command.resourceIncarnation.shellPid)) {
      return { status: 'parked', reason: 'incarnation-unknown' };
    }

    // Check agentSession from probe
    const probeSession = probeResult.agentSession ||
      probeResult.info?.agent_session?.value ||
      probeResult.info?.agent?.agent_session?.value ||
      probeResult.info?.agent_session ||
      probeResult.info?.agent?.agent_session;

    if (probeSession) {
      if (command.agentSession && probeSession !== command.agentSession) {
        return { status: 'parked', reason: 'incarnation-mismatch' };
      }
      if (!command.agentSession && probeResult.resourceIncarnation?.workerPid !== command.resourceIncarnation.workerPid) {
        return { status: 'parked', reason: 'incarnation-mismatch' };
      }
    }

    if (!probeResult.resourceIncarnation || (!probeResult.resourceIncarnation.workerPid && !probeResult.resourceIncarnation.shellPid)) {
      return { status: 'parked', reason: 'incarnation-unknown' };
    }

    if (!matchIncarnations(command.resourceIncarnation, probeResult.resourceIncarnation)) {
      return { status: 'parked', reason: 'incarnation-mismatch' };
    }

    // Alive and matches incarnation (F-b observation)
    return {
      status: 'waiting',
      state: 'worker-running',
      herdrName: command.herdrName,
      paneId: command.paneId,
      resourceIncarnation: command.resourceIncarnation,
    };
  }

  // Without live probe or outbox
  if (!command.resourceIncarnation) {
    return { status: 'parked', reason: 'incarnation-unknown' };
  }

  return { status: 'parked', reason: 'unknown-launch' };
}
