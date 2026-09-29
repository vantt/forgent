// dispatch/reconcile-cli-spawn.mjs — Reconcile an Assignment-owned cli-spawn Run against durable evidence (R3, Phase 09)
//
// Split out of assignment-runner.mjs to isolate the reconciliation use-case
// from the process-control and launch execution pipeline.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { interpretRunResult } from './run-result.mjs';
import {
  readDetachedRunAdapterReceipt,
  readDetachedRunSupervisorBinding,
  readDetachedRunWorkerBinding,
  getBootId,
  getProcessStartTime,
  computeSha256Digest,
  publishMutableProjection,
} from './detached-run-supervisor.mjs';
import {
  acquireRunControl,
  isRunControlCurrent,
  releaseRunControl,
  buildRunControlHolder,
  isProcessAlive,
} from './run-lock.mjs';
import {
  settleFailedRunFromOutcome,
  settleReceiptRunFromOutcome,
} from './settlement.mjs';

/**
 * Reconcile an Assignment-owned cli-spawn Run against durable evidence.
 *
 * @param {string} runDir Path to Run directory (assignments/<asgn>/runs/<attempt>)
 * @param {object} [opts] Options
 * @returns {Promise<object>} Outcome object
 */
export async function reconcileCliSpawnRun(runDir, opts = {}) {
  // Check action: unsupported operations
  if (opts.action === 'cancel' || opts.operation === 'cancel') {
    return { status: 'parked', reason: 'cancel-unsupported' };
  }
  if (opts.action === 'shared-cwd-takeover' || opts.operation === 'shared-cwd-takeover') {
    return { status: 'parked', reason: 'shared-cwd-takeover-unsupported' };
  }

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
      if (!settledResult || settledResult.corrupt || settledResult.contractCorrupt || settledResult.resultCorrupt || settledResult.classification?.provenance === 'contract-corrupt') {
        return { status: 'corrupt', corrupt: true, resultCorrupt: true, runResult: Object.freeze(settledResult) };
      }
      return { status: 'settled', settled: true, runResult: Object.freeze(settledResult) };
    } catch {}
  }

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
  const command = JSON.parse(fs.readFileSync(commandPath, 'utf8'));

  // Stale controller verification
  const isStale = (opts.controlEpoch !== undefined && opts.controlEpoch < command.controlEpoch) ||
    (opts.controlToken !== undefined && command.controlTokenDigest && computeSha256Digest(opts.controlToken) !== command.controlTokenDigest);
  if (isStale) {
    return { status: 'observed', outcome: command.outcome, receipt: readDetachedRunAdapterReceipt(runDir, launchCommandId), settled: false };
  }

  let controlEpoch = opts.controlEpoch ?? command.controlEpoch ?? 1;
  let controlToken = opts.controlToken ?? 'tok-reconcile-default';

  let acquiredControl = null;
  if (opts.controlToken === undefined) {
    const holder = opts.holder || buildRunControlHolder(`reconciler:${process.pid}:${crypto.randomUUID()}`);
    try {
      const control = acquireRunControl(runDir, { holder, purpose: 'reconciliation', ttlMs: opts.controlTtlMs });
      if (control.status === 'held') {
        return { status: 'held', holder: control.holder, controlEpoch: control.controlEpoch };
      }
      if (control.status === 'stale') {
        return { status: 'stale', controlEpoch: control.controlEpoch };
      }
      acquiredControl = control;
      if (opts.controlEpoch === undefined && control.controlEpoch !== undefined) {
        controlEpoch = control.controlEpoch;
      }
      if (control.controlToken !== undefined) {
        controlToken = control.controlToken;
      }
    } catch {}
  } else {
    // opts.controlToken was supplied (e.g., from a parent executeAssignment).
    // The control ledger must have a registered generation for settleRunControl's
    // CAS to work. If the generations dir is empty (direct-reconciler call site
    // or legacy fixture without prior acquireRunControl), bootstrap it now.
    const generationsDir = path.join(runDir, 'control', 'generations');
    const ledgerEmpty = !fs.existsSync(generationsDir) ||
      fs.readdirSync(generationsDir).filter((f) => f.endsWith('.json')).length === 0;
    if (ledgerEmpty) {
      const bootstrapHolder = opts.holder || buildRunControlHolder(`reconciler-bootstrap:${process.pid}`);
      try {
        const bootstrapControl = acquireRunControl(runDir, { holder: bootstrapHolder, purpose: 'reconciliation', ttlMs: opts.controlTtlMs });
        if (bootstrapControl.status === 'acquired') {
          acquiredControl = bootstrapControl;
          controlEpoch = bootstrapControl.controlEpoch;
          controlToken = bootstrapControl.controlToken;
        }
      } catch {}
    }
  }

  function checkRunControlCurrent() {
    if (opts.tokenCurrent === false) return false;
    const generationsDir = path.join(runDir, 'control', 'generations');
    if (fs.existsSync(generationsDir)) {
      try {
        const files = fs.readdirSync(generationsDir).filter((f) => f.endsWith('.json'));
        if (files.length > 0) {
          return isRunControlCurrent(runDir, { controlEpoch, controlToken });
        }
      } catch {}
    }
    return true;
  }

  try {
    let runMeta = null;
    const runJsonPath = path.join(runDir, 'run.json');
    if (fs.existsSync(runJsonPath)) {
      try { runMeta = JSON.parse(fs.readFileSync(runJsonPath, 'utf8')); } catch {}
    }
    if (!runMeta) {
      const asgnJsonPath = path.join(runDir, 'assignment.json');
      if (fs.existsSync(asgnJsonPath)) {
        try { runMeta = JSON.parse(fs.readFileSync(asgnJsonPath, 'utf8')); } catch {}
      }
    }
    if (!runMeta) {
      return { status: 'parked', reason: 'run-meta-missing' };
    }

    // Window 3a / 13: submission refusal recorded, Run unsettled
    if (command.state === 'reconciled' && command.outcome?.kind === 'submission-refused') {
      if (!checkRunControlCurrent()) {
        return { status: 'observed', outcome: command.outcome, settled: false };
      }
      return await settleFailedRunFromOutcome(runDir, runMeta, command, controlEpoch, controlToken, opts);
    }

    // Check receipt tamper if receipt already exists
    const receipt = readDetachedRunAdapterReceipt(runDir, launchCommandId);
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
    }

    // Window 11 / 12: command outcome recorded, Run unsettled
    if (command.state === 'reconciled' && command.outcome?.kind === 'receipt-backed') {
      const baselinePath = path.join(runDir, 'controller', 'evaluator-baseline.json');
      let baseline = null;
      if (fs.existsSync(baselinePath)) {
        try {
          baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
          const { digest: baselineDigest, ...baselineWithoutDigest } = baseline;
          if (baselineDigest && baselineDigest !== computeSha256Digest(baselineWithoutDigest)) {
            return { status: 'refused', reason: 'evaluator-baseline-mismatch' };
          }
        } catch {
          return { status: 'parked', reason: 'evaluator-baseline-missing' };
        }
      } else {
        return { status: 'parked', reason: 'evaluator-baseline-missing' };
      }
      if (!checkRunControlCurrent()) {
        return { status: 'observed', outcome: command.outcome, settled: false };
      }
      return await settleReceiptRunFromOutcome(runDir, runMeta, command, baseline, controlEpoch, controlToken, null, opts);
    }

    // Window 2: Command pending without envelope
    if (!command.envelopeDigest) {
      return { status: 'parked', reason: 'launch-envelope-missing' };
    }

    let envelopePath = path.join(runDir, 'protected', 'launch-envelope', `${launchCommandId}.json`);
    if (!fs.existsSync(envelopePath)) {
      envelopePath = path.join(runDir, 'protected', 'launch-envelope.json');
    }
    if (!fs.existsSync(envelopePath)) {
      return { status: 'parked', reason: 'launch-envelope-missing' };
    }

    let envelope;
    try {
      envelope = JSON.parse(fs.readFileSync(envelopePath, 'utf8'));
      const { digest: envDigest, ...envelopeWithoutDigest } = envelope;
      if (envDigest && (envDigest !== computeSha256Digest(envelopeWithoutDigest) || (command.envelopeDigest && envDigest !== command.envelopeDigest))) {
        return { status: 'refused', reason: 'protected-artifact-corrupt' };
      }
    } catch {
      return { status: 'refused', reason: 'protected-artifact-corrupt' };
    }

    const { digest: envDigest, ...envelopeWithoutDigest } = envelope;
    const computedEnvDigest = computeSha256Digest(envelopeWithoutDigest);
    const actualEnvDigest = envDigest || computedEnvDigest;

    // Window 3 / 4: Envelope exists, no supervisor binding
    const supervisorBinding = readDetachedRunSupervisorBinding(runDir, launchCommandId);
    if (!supervisorBinding) {
      return { status: 'parked', reason: 'supervisor-binding-unknown' };
    }

    if (supervisorBinding.digest) {
      const { digest: supDig, ...supBody } = supervisorBinding;
      if (supDig !== computeSha256Digest(supBody)) {
        return { status: 'refused', reason: 'protected-artifact-corrupt' };
      }
    }

    if (!supervisorBinding.envelopeDigest || (actualEnvDigest && supervisorBinding.envelopeDigest !== actualEnvDigest)) {
      return { status: 'refused', reason: 'incarnation-mismatch' };
    }

    // Window 15: Host boot changed
    const currentBootId = getBootId();
    const bindingBootId = supervisorBinding.bootId || supervisorBinding.supervisor?.bootId;
    if (bindingBootId && currentBootId && currentBootId !== 'unknown-boot' && bindingBootId !== currentBootId && !receipt) {
      return { status: 'parked', reason: 'host-reboot-unknown' };
    }

    // Check supervisor liveness and starttime
    const supervisorAlive = isProcessAlive(supervisorBinding.supervisor?.pid);
    const supervisorStartTime = getProcessStartTime(supervisorBinding.supervisor?.pid);
    if (supervisorAlive && supervisorStartTime && supervisorBinding.supervisor?.processStartTime) {
      if (supervisorStartTime !== supervisorBinding.supervisor.processStartTime) {
        return { status: 'refused', reason: 'incarnation-mismatch' };
      }
    }

    // Window 5 / 6: Check worker binding
    const workerBinding = readDetachedRunWorkerBinding(runDir, launchCommandId);
    if (!workerBinding) {
      if (supervisorAlive) {
        return { status: 'waiting', state: 'supervisor-running' };
      }
      if (!receipt) {
        return { status: 'parked', reason: 'worker-binding-unknown' };
      }
    } else {
      if (!workerBinding.envelopeDigest || (actualEnvDigest && workerBinding.envelopeDigest !== actualEnvDigest)) {
        return { status: 'refused', reason: 'incarnation-mismatch' };
      }
      if (workerBinding.worker?.pgid && supervisorBinding.supervisor?.pgid && workerBinding.worker.pgid === supervisorBinding.supervisor.pgid) {
        return { status: 'refused', reason: 'incarnation-mismatch' };
      }
      const workerAlive = isProcessAlive(workerBinding.worker?.pid);
      const workerStartTime = getProcessStartTime(workerBinding.worker?.pid);
      if (workerAlive && workerStartTime && workerBinding.worker?.processStartTime) {
        if (workerStartTime !== workerBinding.worker.processStartTime) {
          return { status: 'refused', reason: 'incarnation-mismatch' };
        }
      }
    }

    // Window 7 / 9 / 14: Check receipt
    if (!receipt) {
      const workerAlive = workerBinding ? isProcessAlive(workerBinding.worker?.pid) : false;
      if (supervisorAlive || workerAlive) {
        return { status: 'waiting', state: 'running' };
      }
      return { status: 'parked', reason: 'worker-state-unknown' };
    }

    // Verify receipt digests
    const { digest: recDigest, ...receiptWithoutDigest } = receipt;
    if (recDigest && recDigest !== computeSha256Digest(receiptWithoutDigest)) {
      return { status: 'refused', reason: 'protected-artifact-corrupt' };
    }
    if (receipt.envelopeDigest && actualEnvDigest && receipt.envelopeDigest !== actualEnvDigest) {
      return { status: 'refused', reason: 'confinement-plan-mismatch' };
    }

    const supervisorBindingDigest = supervisorBinding.digest || computeSha256Digest(supervisorBinding);
    let expectedBindingDigest = supervisorBindingDigest;
    if (workerBinding) {
      expectedBindingDigest = computeSha256Digest([supervisorBindingDigest, workerBinding.digest || computeSha256Digest(workerBinding)]);
    }
    if (receipt.bindingDigest && receipt.bindingDigest !== expectedBindingDigest && receipt.bindingDigest !== supervisorBindingDigest) {
      return { status: 'refused', reason: 'incarnation-mismatch' };
    }

    // Stale controller check (Acceptance Test 11)
    if (!checkRunControlCurrent()) {
      return { status: 'observed', receipt, settled: false };
    }

    const baselinePath = path.join(runDir, 'controller', 'evaluator-baseline.json');
    let baseline = null;
    if (fs.existsSync(baselinePath)) {
      try {
        baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
        const { digest: baselineDigest, ...baselineWithoutDigest } = baseline;
        if (baselineDigest && baselineDigest !== computeSha256Digest(baselineWithoutDigest)) {
          return { status: 'refused', reason: 'evaluator-baseline-mismatch' };
        }
      } catch {
        return { status: 'parked', reason: 'evaluator-baseline-missing' };
      }
    } else {
      return { status: 'parked', reason: 'evaluator-baseline-missing' };
    }

    // Publish receipt-backed command outcome
    const outcome = {
      kind: 'receipt-backed',
      receiptDigest: receipt.digest || computeSha256Digest(receipt),
      adapterCompletion: receipt.completion || receipt.outcome,
    };
    command.state = 'reconciled';
    command.receiptDigest = outcome.receiptDigest;
    command.outcome = outcome;
    publishMutableProjection(commandPath, command);

    return await settleReceiptRunFromOutcome(runDir, runMeta, command, baseline, controlEpoch, controlToken, receipt, opts);
  } finally {
    if (acquiredControl?.controlToken) {
      try {
        releaseRunControl(runDir, {
          controlEpoch: acquiredControl.controlEpoch,
          controlToken: acquiredControl.controlToken,
        });
      } catch {}
    }
  }
}
