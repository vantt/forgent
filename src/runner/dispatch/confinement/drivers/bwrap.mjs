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
import { cleanupConfinementResource, writeOwnershipMarker, ensurePrivateDir, markResourceRetained } from '../cleanup.mjs';
import { resolveConfinementResources, isInsideRoot, requestIsBlind } from '../resources.mjs';
import { assertAttestationStoreIsolated } from '../attestation-store.mjs';

export const BWRAP_DRIVER_TYPE = 'bwrap';
export const BWRAP_DRIVER_VERSION = 'local-bwrap-v1';

function expandCredentialHome(home) {
  if (typeof home !== 'string' || !home.trim()) return null;
  return home
    .replace(/^\$\{HOME\}(?=\/|$)/, process.env.HOME || '')
    .replace(/^~(?=\/|$)/, process.env.HOME || '');
}

function credentialError(message) {
  const err = new Error(message);
  err.code = 'credential-provisioning';
  return err;
}

/**
 * Copies an explicit allow-list of files from an account's real home into the
 * private home, at the same relative paths. Nothing outside the list is
 * copied and the real home is never mounted. Fails closed: a missing, escaping
 * or non-regular entry aborts before the worker is spawned.
 */
function copyHomeFiles(privateHomeTarget, sourceHome, files) {
  let realHome;
  try {
    realHome = fs.realpathSync(sourceHome);
  } catch (err) {
    throw credentialError(`selected credential home is not readable: ${err.message}`);
  }
  for (const rel of files) {
    if (typeof rel !== 'string' || !rel.trim() || path.isAbsolute(rel) || rel.split(/[\\/]/).includes('..')) {
      throw credentialError(`credential file ${JSON.stringify(rel)} must be a relative path without "..".`);
    }
    let realSource;
    try {
      realSource = fs.realpathSync(path.join(realHome, rel));
    } catch {
      throw credentialError(`selected credential file "${rel}" is missing`);
    }
    if (!realSource.startsWith(realHome + path.sep) || !fs.statSync(realSource).isFile()) {
      throw credentialError(`selected credential file "${rel}" is not a regular file inside the credential home`);
    }
    const destination = path.join(privateHomeTarget, rel);
    try {
      ensurePrivateDir(path.dirname(destination), { root: privateHomeTarget });
      fs.copyFileSync(realSource, destination);
      // Credentials stay owner-only; a listed helper binary keeps its exec bit.
      fs.chmodSync(destination, fs.statSync(realSource).mode & 0o100 ? 0o700 : 0o600);
    } catch (copyErr) {
      throw credentialError(`selected credential file "${rel}" could not be copied: ${copyErr.message}`);
    }
  }
}

function provisionSelectedCodexCredential(privateHomeTarget, request) {
  const source = request?.providerCapacity?.credentialSource;
  if (!source) return false;
  const home = expandCredentialHome(source.home);
  if (source.kind === 'home-files') {
    if (!home || !path.isAbsolute(home) || !Array.isArray(source.files) || source.files.length === 0) {
      throw credentialError('selected home-files credential needs an absolute "home" and a non-empty "files" list');
    }
    copyHomeFiles(privateHomeTarget, home, source.files);
    return true;
  }
  if (source.kind !== 'codex-home') {
    throw credentialError(`unsupported provider credential source kind "${source.kind}"`);
  }
  const authCandidate = home ? path.join(home, 'auth.json') : null;
  if (!authCandidate || !fs.existsSync(authCandidate)) {
    throw credentialError('selected Codex credential auth.json is missing');
  }
  try {
    const authCopy = path.join(privateHomeTarget, 'auth.json');
    fs.copyFileSync(authCandidate, authCopy);
    fs.chmodSync(authCopy, 0o600);
  } catch (copyErr) {
    throw credentialError(`selected Codex credential auth.json could not be copied: ${copyErr.message}`);
  }
  return true;
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
 * The one invocation override this driver accepts: `hostRead: blind` and nothing else.
 */
function isBlindOnlyOverride(override) {
  const keys = Object.keys(override || {});
  if (keys.length !== 1 || keys[0] !== 'controls') return false;
  const controlKeys = Object.keys(override.controls || {});
  return controlKeys.length === 1 && controlKeys[0] === 'hostRead' && override.controls.hostRead === 'blind';
}

function realPathOrResolved(p) {
  try {
    return fs.realpathSync(p);
  } catch {
    return path.resolve(p);
  }
}

/**
 * Refusals specific to `hostRead: blind`, read off the resolved resources: a workspace that
 * sits inside a hidden root would be masked away from its own worker, and a context ref that
 * points into a hidden root outside the dispatch's own directory could never be read.
 */
function blindRefusals(request, resolvedResources) {
  const hiddenRoots = resolvedResources.filter((r) => r.resource === 'hidden-root').map((r) => r.hostTarget);
  const own = resolvedResources.find((r) => r.resource === 'own-assignment')?.hostTarget;
  const mismatches = [];
  const context = request.context || {};

  for (const [name, dir] of [['cwd', context.cwd], ['repoRoot', context.repoRoot]]) {
    if (typeof dir !== 'string' || !dir) continue;
    const real = realPathOrResolved(dir);
    const root = hiddenRoots.find((hidden) => isInsideRoot(real, hidden));
    if (root) {
      mismatches.push({
        code: 'blind-hides-workspace',
        detail: `hostRead: blind would hide the ${name} "${real}" from its own worker: it lies inside the hidden root "${root}".`,
      });
    }
  }

  const base = context.cwd || context.repoRoot || process.cwd();
  for (const ref of Array.isArray(context.contextRefs) ? context.contextRefs : []) {
    if (typeof ref !== 'string' || !ref || /^[a-z][a-z0-9+.-]*:/i.test(ref)) continue;
    const real = realPathOrResolved(path.resolve(base, ref));
    const root = hiddenRoots.find((hidden) => isInsideRoot(real, hidden));
    if (root && !(own && isInsideRoot(real, own))) {
      mismatches.push({
        code: 'blind-ref-hidden',
        detail: `context ref "${ref}" lies inside the hidden root "${root}" and outside the dispatch's own directory; a blind worker could not read it.`,
      });
    }
  }
  return mismatches;
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

  // Invocation override check: default v1 rejects override (spec §9.1), except the one
  // that only narrows reads to `blind`.
  if (request.override && Object.keys(request.override).length > 0 && !isBlindOnlyOverride(request.override)) {
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

    // hostRead: default v1 supports allow and blind. deny is unsupported.
    const hostRead = isBlindOnlyOverride(request.override) ? 'blind' : controls.hostRead;
    if (hostRead === 'allow' || hostRead === 'blind') {
      coverage['control:hostRead'] = 'satisfied';
    } else {
      mismatches.push({
        code: 'confinement-unsupported',
        detail: `hostRead: ${hostRead} is not supported by local-bwrap-v1 (only hostRead: allow and blind are supported).`,
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
      context: {
        ...request.context,
        assignmentLaunchContext: request.assignmentLaunchContext,
        // HIGH-2: resources.mjs needs to know which adapter's worker is
        // actually going to run in the sandbox to bind the right outbox
        // subdirectory writable -- see resources.mjs's own comment.
        adapter: request.invocation?.adapter,
      },
      grants: policyGrants,
      resourceNeeds: request.resourceNeeds,
      backendConfig: backend?.config || {},
      providerSources: {},
      blind: requestIsBlind(request),
    });
    if (requestIsBlind(request)) mismatches.push(...blindRefusals(request, resolvedResources));
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
 * provisioning a selected provider account credential file into a private
 * home, which grants nothing away from any other executor and is not a
 * confinement control.
 */
export async function prepareBwrap(plan, request, backend) {
  return prepareBwrapSync(plan, request, backend);
}

/**
 * The body of prepareBwrap. It has nothing to await, and the blind-read probe needs the exact
 * argv a real dispatch would get from a synchronous caller.
 */
export function prepareBwrapSync(plan, request, backend) {
  // Verify attestation store isolation before materializing mounts (H1)
  assertAttestationStoreIsolated(request.context, plan.resources || []);

  const allocatedPaths = [];
  let credentialProvisioned = false;

  try {
    const executable = backend?.config?.executable || '/usr/bin/bwrap';
    const bwrapArgs = [
      '--ro-bind', '/', '/',
      '--dev', '/dev',
      '--proc', '/proc',
      '--tmpfs', '/tmp',
    ];

    const resources = plan.resources || [];
    const blind = requestIsBlind(request);
    const hidden = blind ? resources.filter((r) => r.resource === 'hidden-root' && r.executionTarget?.path) : [];
    const own = blind ? resources.find((r) => r.resource === 'own-assignment') : null;
    if (blind && !own) {
      throw new Error('hostRead: blind plan has no own-assignment resource to bind back.');
    }

    const materialize = (res) => {
      if (!res.hostTarget || !res.executionTarget?.path) return;

      if (res.allocation === 'temporary') {
        // <tempRoot>/<dispatchId>/home: when the resolver names the temp root, the
        // root, the per-dispatch parent and the home all end up owner-only -- the
        // home receives a login copy. Nothing above the named root is touched.
        ensurePrivateDir(res.hostTarget, { root: res.tempRoot ?? res.hostTarget });
        writeOwnershipMarker(res.hostTarget, { dispatchId: request.dispatchId, resource: res.resource });
        allocatedPaths.push(res.hostTarget);
        if (res.resource === 'private-home') {
          credentialProvisioned = provisionSelectedCodexCredential(res.hostTarget, request) || credentialProvisioned;
        }
      }

      const isWritable = res.access === 'write' || res.access === 'read-write';
      if (isWritable) {
        bwrapArgs.push('--bind', res.hostTarget, res.executionTarget.path);
      } else {
        bwrapArgs.push('--ro-bind', res.hostTarget, res.executionTarget.path);
      }
    };

    // Materialize mounts ONLY from plan.resources (R4)
    const mounts = resources.filter((r) => r.resource !== 'hidden-root' && r.resource !== 'own-assignment');
    if (!blind) {
      mounts.forEach(materialize);
    } else {
      // A later mount over a parent hides an earlier one beneath it, so the order is the
      // contract: mounts that do not sit inside a hidden root (a workspace may contain one),
      // then the masks, then the dispatch's own directory read-only, then the mounts inside
      // a hidden root (its outbox, its private home), and last the masks made read-only.
      const insideMasked = (res) => [...hidden, own].some((h) => res.executionTarget?.path && isInsideRoot(res.executionTarget.path, h.executionTarget.path));
      bwrapArgs.push('--unshare-pid');
      mounts.filter((r) => !insideMasked(r)).forEach(materialize);
      for (const h of hidden) bwrapArgs.push('--tmpfs', h.executionTarget.path);
      bwrapArgs.push('--ro-bind', own.hostTarget, own.executionTarget.path);
      mounts.filter(insideMasked).forEach(materialize);
      for (const h of hidden) bwrapArgs.push('--remount-ro', h.executionTarget.path);
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

    // The worker's pane was left open after a failed run: keep the homes, tag
    // them with the pane, and hand back where they are so the failure record
    // can say. They are reaped once the pane is gone.
    const retain = ({ paneId, herdrSession } = {}) => allocatedPaths.filter((p) => markResourceRetained(p, { paneId, herdrSession }));

    return {
      invocation: preparedInvocation,
      claims: { ...plan.coverage },
      providerCapacity: credentialProvisioned ? { credentialProvisioned: true } : undefined,
      cleanup,
      retain,
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
