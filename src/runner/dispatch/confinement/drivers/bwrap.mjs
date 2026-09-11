// bwrap.mjs — local bubblewrap confinement backend driver v1 (Phase 03 R1, R3, R4, spec §6.5, §9.1).
//
// Implements ConfinementBackendDriverV1:
//   - type: 'bwrap', version: 'local-bwrap-v1'
//   - validateConfig: enforces closed schema on bwrap backend instance configs (R1)
//   - assess: checks request against default support matrix only; unsupported controls
//             refuse with named mismatches, never best-effort acceptance (R3)
//   - prepare: constructs sandbox invocation strictly from RESOLVED resources;
//              never uses raw config strings or provider-specific branches (R4)
//   - closes inherited file descriptors to fix MED-1 and ensure no host file tampering

import fs from 'node:fs';
import path from 'node:path';
import { cleanupConfinementResource, writeOwnershipMarker } from '../cleanup.mjs';
import { resolveConfinementResources } from '../resources.mjs';
import { assertAttestationStoreIsolated } from '../attestation-store.mjs';

export const BWRAP_DRIVER_TYPE = 'bwrap';
export const BWRAP_DRIVER_VERSION = 'local-bwrap-v1';

// Executors whose private-home resource is the Codex CLI's own CODEX_HOME
// (config-declared via a `resourceBindings` entry pointing private-home at
// the CODEX_HOME env var) and therefore need the host Codex credential
// provisioned into it -- otherwise codex starts with no auth and cannot run.
// This is a closed, explicit identity allowlist, not a resource-type branch:
// it does not weaken any confinement guarantee (mount read/write-ness,
// hostWrite posture, network egress, ...) for the named executor, it only
// narrows which executor receives an opt-in credential grant that every
// other executor gets by default (none). Keying this off `res.resource`
// alone (as the migration first shipped it) leaked the Codex credential
// into every private-home, including claude-bwrap/agy-bwrap, which have no
// relationship to Codex.
const CODEX_HOME_CREDENTIAL_EXECUTOR_IDS = Object.freeze(['codex-bwrap']);

/**
 * Copies the host's Codex credential file into a Codex executor's own
 * per-dispatch private-home (which that executor's config binds to
 * CODEX_HOME), never any other executor's. Non-fatal on read/copy failure.
 */
function provisionCodexCredential(privateHomeTarget) {
  const authCandidates = [
    path.join(process.env.HOME || '', '.codex', 'auth.json'),
    path.join(process.env.HOME || '', '.codex-fgovn', 'auth.json'),
  ];
  for (const authCandidate of authCandidates) {
    if (fs.existsSync(authCandidate)) {
      try {
        fs.copyFileSync(authCandidate, path.join(privateHomeTarget, 'auth.json'));
      } catch {
        // non-fatal
      }
      break;
    }
  }
}

const ALLOWED_BWRAP_CONFIG_KEYS = Object.freeze([
  'type',
  'enabled',
  'executable',
  'tempRoot',
  'privateHomeRoot',
]);

/**
 * Validates bwrap backend instance configuration schema (R1).
 */
export function validateBwrapConfig(config, label = 'bwrap backend config') {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error(`${label} must be an object.`);
  }

  for (const key of Object.keys(config)) {
    if (!ALLOWED_BWRAP_CONFIG_KEYS.includes(key)) {
      throw new Error(
        `${label} contains unknown config key "${key}". Allowed keys: ${ALLOWED_BWRAP_CONFIG_KEYS.join(', ')}.`,
      );
    }
  }

  if (config.type !== BWRAP_DRIVER_TYPE) {
    throw new Error(`${label} "type" must be "${BWRAP_DRIVER_TYPE}", got: ${JSON.stringify(config.type)}.`);
  }

  if (config.enabled !== undefined && typeof config.enabled !== 'boolean') {
    throw new Error(`${label} "enabled" must be a boolean when present.`);
  }

  if (config.executable !== undefined && (typeof config.executable !== 'string' || !config.executable.trim())) {
    throw new Error(`${label} "executable" must be a non-empty string when present.`);
  }

  if (config.tempRoot !== undefined && (typeof config.tempRoot !== 'string' || !config.tempRoot.trim())) {
    throw new Error(`${label} "tempRoot" must be a non-empty string when present.`);
  }

  if (config.privateHomeRoot !== undefined && (typeof config.privateHomeRoot !== 'string' || !config.privateHomeRoot.trim())) {
    throw new Error(`${label} "privateHomeRoot" must be a non-empty string when present.`);
  }

  return true;
}

/**
 * Assess confinement request against the default support matrix (spec §9.1, R3).
 */
export function assessBwrap(request, backend) {
  validateBwrapConfig(backend?.config || { type: BWRAP_DRIVER_TYPE }, `backend "${backend?.id || 'bwrap'}"`);

  const mismatches = [];
  const coverage = {};
  const readiness = {};

  const reqMode = request.requirement?.mode ?? 'unconfined';

  // Mode support: only required and unconfined in default v1 (spec §9.1)
  if (reqMode === 'preferred') {
    mismatches.push({
      code: 'confinement-unsupported',
      detail: 'preferred confinement mode is not supported in local-bwrap-v1; use required or unconfined.',
    });
  }

  // Invocation override check: default v1 rejects override (spec §9.1)
  if (request.override && Object.keys(request.override).length > 0) {
    mismatches.push({
      code: 'confinement-unsupported',
      detail: 'invocation confinement override is not supported in local-bwrap-v1.',
    });
  }

  const policy = request.requirement?.policy;
  const controls = policy?.controls;

  const supportedControls = new Set([
    'hostWrite', 'hostRead', 'networkEgress', 'process', 'home', 'session', 'workspace',
  ]);

  if (!controls || typeof controls !== 'object' || Array.isArray(controls)) {
    mismatches.push({
      code: 'confinement-unsupported',
      detail: 'required confinement policy must declare a controls object.',
    });
  } else {
    for (const key of Object.keys(controls)) {
      if (!supportedControls.has(key)) {
        mismatches.push({
          code: 'confinement-unsupported',
          detail: `control "${key}" is not supported by local-bwrap-v1.`,
        });
        coverage[`control:${key}`] = 'unsatisfied';
      }
    }
    if (reqMode === 'required') {
      for (const key of supportedControls) {
        if (controls[key] === undefined) {
          mismatches.push({
            code: 'confinement-unsupported',
            detail: `required confinement policy is missing control "${key}".`,
          });
          coverage[`control:${key}`] = 'unsatisfied';
        }
      }
    }
  }

  if (controls) {
    // hostWrite: only deny is supported (or allow for unconfined)
    if (controls.hostWrite === 'deny') {
      coverage['control:hostWrite'] = 'satisfied';
    } else if (controls.hostWrite === 'allow') {
      if (reqMode === 'required') {
        mismatches.push({
          code: 'confinement-unsupported',
          detail: 'required policy cannot specify hostWrite: allow on bwrap backend; must be deny.',
        });
        coverage['control:hostWrite'] = 'unsatisfied';
      } else {
        coverage['control:hostWrite'] = 'satisfied';
      }
    } else {
      coverage['control:hostWrite'] = 'unknown';
    }

    // hostRead: default v1 only supports allow. deny is unsupported.
    if (controls.hostRead === 'allow') {
      coverage['control:hostRead'] = 'satisfied';
    } else {
      mismatches.push({
        code: 'confinement-unsupported',
        detail: `hostRead: ${controls.hostRead} is not supported by local-bwrap-v1 (only hostRead: allow is supported).`,
      });
      coverage['control:hostRead'] = 'unsatisfied';
    }

    // networkEgress: default v1 only supports allow. deny and filtered are unsupported.
    if (controls.networkEgress === 'allow') {
      coverage['control:networkEgress'] = 'satisfied';
    } else {
      mismatches.push({
        code: 'confinement-unsupported',
        detail: `networkEgress: ${controls.networkEgress} is not supported by local-bwrap-v1 (only networkEgress: allow is supported).`,
      });
      coverage['control:networkEgress'] = 'unsatisfied';
    }

    // process: default v1 does not claim process isolation (it runs in host process namespace unless unshared, but spec §4, §9.1 says effective value is host)
    if (controls.process === 'host') {
      coverage['control:process'] = 'satisfied';
    } else {
      mismatches.push({
        code: 'confinement-unsupported',
        detail: `process: ${controls.process} is not supported as a verified claim by local-bwrap-v1 (only process: host is supported).`,
      });
      coverage['control:process'] = 'unsatisfied';
    }

    // host is directly represented by the root mount; private needs a
    // dedicated HOME mount, which this driver does not yet emit.
    if (controls.home === 'host') {
      coverage['control:home'] = 'satisfied';
    } else if (controls.home === 'private') {
      coverage['control:home'] = 'unverified';
    } else {
      coverage['control:home'] = 'unknown';
    }

    // Shared is the host context. Isolated needs an explicit namespace flag.
    if (controls.session === 'shared') {
      coverage['control:session'] = 'satisfied';
    } else {
      coverage['control:session'] = 'unverified';
    }

    // The default mount shares the workspace. Own needs a distinct target.
    if (controls.workspace === 'shared') {
      coverage['control:workspace'] = 'satisfied';
    } else if (controls.workspace === 'own') {
      coverage['control:workspace'] = 'unverified';
    } else {
      coverage['control:workspace'] = 'unknown';
    }
  }

  // Check grants against supported resources
  const policyGrants = policy?.grants || [];
  const policyId = request.requirement?.policyId;
  const isWorkspaceWrite = policyId === 'workspace-write';

  const allowedResources = new Set(['run-output', 'private-home', 'executor-credentials']);
  if (isWorkspaceWrite) {
    allowedResources.add('workspace');
    allowedResources.add('workspace-git-metadata');
  }

  for (const grant of policyGrants) {
    if (!allowedResources.has(grant.resource)) {
      mismatches.push({
        code: 'confinement-grant-invalid',
        detail: `resource "${grant.resource}" is not supported or not permitted under policy "${policyId}".`,
      });
      coverage[`grant:${grant.resource}`] = 'unsatisfied';
    } else {
      coverage[`grant:${grant.resource}`] = 'satisfied';
    }
  }

  // Resolve resources via canonical ResourceResolver (R2)
  let resolvedResources = [];
  try {
    resolvedResources = resolveConfinementResources({
      dispatchId: request.dispatchId,
      context: request.context,
      grants: policyGrants,
      resourceNeeds: request.resourceNeeds,
      backendConfig: backend?.config || {},
      providerSources: {},
    });
  } catch (err) {
    mismatches.push({
      code: err.code || 'confinement-grant-invalid',
      detail: err.message,
    });
  }

  // No provider credential source is currently resolved or mounted by this
  // driver. Never turn that absence into a satisfied security claim.
  const credentialsGrant = policyGrants.find((grant) => grant.resource === 'executor-credentials');
  if (credentialsGrant &&
      !resolvedResources.some((resource) => resource.resource === 'executor-credentials')) {
    coverage['grant:executor-credentials'] = 'unverified';
    if (credentialsGrant.optional === false) {
      mismatches.push({
        code: 'confinement-unsupported',
        detail: 'required executor credentials were requested but no provider credential source was resolved for mounting.',
      });
    }
  }

  // Readiness: check if all resourceNeeds have matching resolved resources with sufficient access
  for (const need of request.resourceNeeds || []) {
    const res = resolvedResources.find((r) => r.resource === need.resource);
    if (!res) {
      readiness[need.resource] = 'unsatisfied';
      mismatches.push({
        code: 'confinement-need-unsatisfied',
        detail: `required resource need "${need.resource}" could not be resolved.`,
      });
    } else {
      readiness[need.resource] = 'satisfied';
    }
  }

  // Verify attestation store isolation: fail closed if store overlaps any writable resource (H1)
  try {
    assertAttestationStoreIsolated(request.context, resolvedResources);
  } catch (err) {
    mismatches.push({
      code: 'confinement-grant-invalid',
      detail: err.message,
    });
    coverage['control:hostWrite'] = 'unsatisfied';
  }

  return {
    coverage,
    resources: resolvedResources,
    readiness,
    mismatches,
  };
}

/**
 * Prepare sandbox invocation strictly from RESOLVED resources (spec §6.5, R4).
 * Never branches on executorId, providerModel, or agent type to decide any
 * confinement guarantee (which resources get mounted, read/write-ness,
 * hostWrite/hostRead/networkEgress posture, ...) -- that stays purely
 * resource-driven. The one narrow, explicitly-documented exception is
 * provisioning a Codex-specific credential file (see
 * CODEX_HOME_CREDENTIAL_EXECUTOR_IDS above), which grants nothing away from
 * any other executor and is not a confinement control.
 */
export async function prepareBwrap(plan, request, backend) {
  // Verify attestation store isolation before materializing mounts (H1)
  assertAttestationStoreIsolated(request.context, plan.resources || []);

  const allocatedPaths = [];

  try {
    const executable = backend?.config?.executable || '/usr/bin/bwrap';
    const bwrapArgs = [
      '--ro-bind', '/', '/',
      '--dev', '/dev',
      '--proc', '/proc',
      '--tmpfs', '/tmp',
    ];

    // Materialize mounts ONLY from plan.resources (R4)
    for (const res of plan.resources || []) {
      if (!res.hostTarget || !res.executionTarget?.path) continue;

      if (res.allocation === 'temporary') {
        fs.mkdirSync(res.hostTarget, { recursive: true });
        writeOwnershipMarker(res.hostTarget, { dispatchId: request.dispatchId, resource: res.resource });
        if (res.resource === 'private-home' && CODEX_HOME_CREDENTIAL_EXECUTOR_IDS.includes(request.executorId)) {
          provisionCodexCredential(res.hostTarget);
        }
        allocatedPaths.push(res.hostTarget);
      }

      const isWritable = res.access === 'write' || res.access === 'read-write';
      if (isWritable) {
        bwrapArgs.push('--bind', res.hostTarget, res.executionTarget.path);
      } else {
        bwrapArgs.push('--ro-bind', res.hostTarget, res.executionTarget.path);
      }
    }

    // Apply generic resource bindings (spec §6.5: no provider branching!)
    const resolvedEnv = { ...(request.invocation?.env || {}) };
    let finalArgs = [...(request.invocation?.args || [])];

    for (const binding of request.invocation?.resourceBindings || []) {
      const match = plan.resources?.find((r) => r.resource === binding.resource);
      if (!match) continue;

      const targetPath = match.executionTarget.path;
      if (binding.target?.kind === 'env') {
        resolvedEnv[binding.target.name] = targetPath;
      } else if (binding.target?.kind === 'argument' && binding.target.token) {
        finalArgs = finalArgs.map((arg) => arg.split(binding.target.token).join(targetPath));
      }
    }

    // Command wrap to ensure no inherited writable fds survive (R7, MED-1 fix)
    // Runs bash helper that closes all fds >= 3 before execing the child command.
    const fdCloserScript = 'for f in $(ls /proc/$$/fd 2>/dev/null); do if [ "$f" -ge 3 ] 2>/dev/null; then eval "exec $f>&-" 2>/dev/null || true; fi; done; exec "$@"';

    const originalCmd = request.invocation.command;
    bwrapArgs.push(
      '--',
      'bash',
      '-c',
      fdCloserScript,
      'bwrap-launch',
      originalCmd,
      ...finalArgs,
    );

    const preparedInvocation = {
      ...request.invocation,
      command: executable,
      args: bwrapArgs,
      env: resolvedEnv,
    };

    const cleanup = async () => {
      for (const p of allocatedPaths) {
        cleanupConfinementResource(p, request.dispatchId);
      }
    };

    return {
      invocation: preparedInvocation,
      claims: { ...plan.coverage },
      cleanup,
    };
  } catch (err) {
    // On prepare error: clean up any allocated resources before throwing
    for (const p of allocatedPaths) {
      try {
        cleanupConfinementResource(p, request.dispatchId);
      } catch {
        // ignore in rollback
      }
    }
    throw err;
  }
}

/**
 * ConfinementBackendDriverV1 implementation for local bwrap.
 */
export const bwrapDriver = Object.freeze({
  type: BWRAP_DRIVER_TYPE,
  version: BWRAP_DRIVER_VERSION,
  validateConfig: validateBwrapConfig,
  assess: assessBwrap,
  prepare: prepareBwrap,
});
