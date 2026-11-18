// session-attempt.mjs -- starts one head session as a supervised terminal attempt.
//
// A head session is launched exactly like a terminal worker attempt: run supervisor, sandbox with the herdr socket
// and the user runtime directory masked, account lease, private home, login write-back when it ends. It differs by
// a grant keyed by its role (which project paths are writable) and by having no result: no run control, no settle
// step, no brief contract. The seat is prepared by the one function a worker uses (`prepareAttemptSeat`); this module
// only decides what a session brings to it and never waits for anything to finish.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  acquireAttemptLocks, attemptStepEnv, readLaunchSettings, resolveAttemptHost,
} from '../../run-supervisor/direct-launch.mjs';
import { adoptRun } from '../../run-supervisor/client.mjs';
import { fgosDirFromRoot } from '../paths.mjs';
import { withDefaultExecutor } from './config.mjs';
import { createCredentialRenewal } from './provider-credential-renewal.mjs';
import { BUILTIN_POLICIES, WORKSPACE_PATHS_RESOURCE } from './confinement/policies.mjs';
import {
  closeAttempt, leaseAccountForAttempt, openAttempt, prepareAttemptSeat, publishAttemptIntent,
  releaseSelectedProviderLease, renewLeasedLogin, startAndBind,
} from './assignment-runner.mjs';

export class SessionLaunchError extends Error {
  constructor(code, message, extra = {}) {
    super(message);
    this.name = 'SessionLaunchError';
    this.code = code;
    Object.assign(this, extra);
  }
}

const ATTEMPT_STR = '01';

/** The requirement of a head: the read-only posture plus the writable project paths its grant names. */
function requirementOf(grant) {
  const base = BUILTIN_POLICIES['host-write-denied'];
  const policy = grant.writes.length === 0
    ? base
    : { ...base, grants: [...base.grants, { resource: WORKSPACE_PATHS_RESOURCE, access: 'read-write', scope: 'dispatch', paths: [...grant.writes] }] };
  return { mode: 'required', policyId: 'host-write-denied', policy };
}

/**
 * Starts the session attempt of `key` and returns once the supervisor has bound it; it never waits for the session to
 * end. `binding` is `bind()`'s answer for the seat (executor, invocation, model, tier, account); `grant` is
 * `grantOf(role)`; `opening` is typed verbatim; `ceilingMs` bounds the session; `env` is added to the agent's launch
 * environment. The attempt directory is `.fgos/assignments/<key>/runs/01`, so the account lease lives exactly as long as
 * the attempt. Returns `{ placement: { host: 'terminal', key }, runDir, attemptId }`. A refusal before the handover gives
 * back what was taken (pane, private home, lease, locks) and throws `SessionLaunchError`.
 */
export async function launchSessionAttempt({ binding, runnerConfig, key, role, grant, opening, ceilingMs, env = {}, projectRoot, beside = null, display = null, opts = {} }) {
  const cfg = withDefaultExecutor(runnerConfig);
  const fgosDir = fgosDirFromRoot(projectRoot);
  const assignmentsDir = path.join(fgosDir, 'assignments');
  const assignmentDir = path.join(assignmentsDir, key);
  const runDir = path.join(assignmentDir, 'runs', ATTEMPT_STR);
  const runId = `run_${key}_${ATTEMPT_STR}`;
  if (fs.existsSync(path.join(runDir, 'envelope.json')) || fs.existsSync(path.join(runDir, 'attempt-intent.json'))) {
    throw new SessionLaunchError('head-key-used', `${runDir} already holds an attempt; a head key is used once, start the next generation`);
  }
  fs.mkdirSync(runDir, { recursive: true });

  const attemptId = `cmd_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const launchOpts = { binding, providerCredentialRenew: createCredentialRenewal(), ...opts };
  const executorId = binding.executor;
  const pinnedInvocationId = binding.invocation ?? null;
  const effectivePolicy = { model: binding.model, tier: binding.tier, reasoningEffort: binding.reasoningEffort ?? undefined, executorId };
  const attempt = openAttempt({
    runDir, runId, attemptId, unitRunId: key, terminal: true, cwd: projectRoot,
    host: resolveAttemptHost(), stepEnv: attemptStepEnv(), custody: null, leaseRuntimeDir: opts.providerCapacityRuntimeDir, session: true,
  });
  try {
    // Read-only, so no dispatch-cwd lease: a head writes only the paths its grant binds.
    attempt.locks = acquireAttemptLocks({ executorId, capability: 'execute', fgosDir, assignmentDir, attemptStr: ATTEMPT_STR, cwd: projectRoot, mutating: false, custody: null });
    publishAttemptIntent(attempt);

    const lease = await leaseAccountForAttempt({
      cfg, opts: launchOpts, compiledPlan: { mechanism: 'out-of-process', capability: 'execute' }, effectivePolicy, executorId, pinnedInvocationId,
      assignmentsDir, assignmentId: key, unitRunId: key, runId, runDir, repoRoot: projectRoot,
    });
    if (lease.selection?.status === 'refused') {
      throw new SessionLaunchError('lease-refused', `no account could be leased for ${role}: ${lease.selection.reason}${lease.selection.detail ? ` (${lease.selection.detail})` : ''}`, { refusal: lease.selection });
    }
    attempt.lease = lease.selection;
    const confinementRequirement = requirementOf(grant);
    const providerCapacity = await renewLeasedLogin(attempt.lease, { cfg, opts: launchOpts, executorId, pinnedInvocationId, confinementRequirement });

    const { envelope } = await prepareAttemptSeat(attempt, {
      cfg, opts: launchOpts, root: projectRoot, fgosDir, cwd: projectRoot, executorId, pinnedInvocationId, effectivePolicy,
      prompt: '',
      capability: 'execute',
      assignmentLaunchContext: {
        contract: 'assignment-launch-context.v1',
        kind: 'session',
        run: { runId, assignmentId: key, attempt: 1 },
        command: { launchCommandId: attemptId },
        session: { role },
      },
      providerCapacity,
      providerCapacityEvidence: lease.evidence,
      confinementRequirement,
      repoRoot: projectRoot,
      dispatchBatchKey: beside ?? attemptId,
      mutating: false,
      settings: readLaunchSettings(projectRoot),
      session: { role, verbs: [...grant.verbs] },
      ceilingMs,
      opening,
      display: display ?? undefined,
      beside: beside ?? undefined,
      launchEnv: env,
    });

    const { bound } = await startAndBind(attempt, { envelope });
    if (bound.state !== 'bound') {
      // The supervisor may have refused or ended the attempt in the same breath: adopt judges what is on disk.
      if (bound.state === 'exited') { try { adoptRun(path.resolve(runDir)); } catch { /* adopt names its own failure */ } }
      throw new SessionLaunchError('launch-unknown', `the supervisor did not bind ${role} (${bound.state}${bound.exit != null ? `, exit ${bound.exit}` : ''}); see ${path.join(runDir, 'supervisor.log')}`, { launchState: bound.state });
    }
    return { placement: { host: 'terminal', key: attemptId }, runDir, attemptId };
  } catch (err) {
    // Before the handover the lease is this controller's to give back; after it, the attempt's own end reclaims it.
    if (!attempt.handedOver && attempt.lease?.status === 'selected') releaseSelectedProviderLease(attempt.lease, runId, opts.providerCapacityRuntimeDir);
    throw err;
  } finally {
    await closeAttempt(attempt);
  }
}
