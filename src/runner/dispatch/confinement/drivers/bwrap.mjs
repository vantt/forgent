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
import * as cleanup from '../cleanup.mjs';
import { cleanupConfinementResource, writeOwnershipMarker, extendOwnershipMarker, ensurePrivateDir } from '../cleanup.mjs';
import { copyCredentialFiles, credentialWriteBackMarker } from '../../provider-credential-renewal.mjs';
import { expandCredentialHome } from '../../provider-capacity.mjs';
import { resolveConfinementResources, isInsideRoot, requestIsBlind } from '../resources.mjs';
import { assertAttestationStoreIsolated } from '../attestation-store.mjs';
import { computeSha256Digest } from '../../proof-helpers.mjs';
import { ensureRuntimeSocketDir } from '../../../../run-supervisor/runtime-dir.mjs';

export const BWRAP_DRIVER_TYPE = 'bwrap';
export const BWRAP_DRIVER_VERSION = 'local-bwrap-v1';

function credentialError(message) {
  const err = new Error(message);
  err.code = 'credential-provisioning';
  return err;
}

/**
 * Copies the listed files that exist in an account's real home into the private home, at the same
 * relative paths, and returns the ones copied. Nothing outside the list is copied and the real home is
 * never mounted. Fails closed: an escaping, dangling or non-regular entry aborts before the worker is
 * spawned. A SQLite store (`agent.db`) is copied as a consistent snapshot, not as a raw file.
 */
function copyHomeFiles(privateHomeTarget, sourceHome, files) {
  return copyCredentialFiles(privateHomeTarget, sourceHome, files, {
    makeError: credentialError,
    ensureDir: (dir) => ensurePrivateDir(dir, { root: privateHomeTarget }),
    skipMissing: true,
  });
}

/**
 * Copies the login files of the store the invocation declares into the private home: the invocation's own
 * `files`, else the listed files of the account's home-files source, else a Codex home's `auth.json`.
 * The files present are copied; none present refuses the launch, since the worker would start logged out.
 * An invocation that declares no store gets nothing, whatever account was leased. Returns false when the
 * request selects no credential.
 */
function provisionSelectedCredential(privateHomeTarget, request) {
  const store = request?.invocation?.credentialStore;
  if (!store) return false;
  const capacity = request?.providerCapacity;
  const source = capacity?.credentialSource;
  if (!source) {
    // An account that keeps one login per CLI and declares none for the CLI being launched has nothing
    // this home could log in with: refuse before the worker starts logged out.
    if (capacity?.credentialSources) {
      throw credentialError(`account "${capacity.accountId}" declares no credential source for CLI "${capacity.credentialCli ?? 'unknown'}"`);
    }
    return false;
  }
  const home = expandCredentialHome(source.home);
  let files;
  if (source.kind === 'home-files') {
    if (!home || !Array.isArray(source.files) || source.files.length === 0) {
      throw credentialError('selected home-files credential needs an absolute "home" and a non-empty "files" list');
    }
    files = source.files;
  } else if (source.kind === 'codex-home') {
    if (!home) throw credentialError('selected Codex credential needs an absolute "home"');
    files = ['auth.json'];
  } else {
    throw credentialError(`unsupported provider credential source kind "${source.kind}"`);
  }
  files = store.files ?? files;
  if (copyHomeFiles(privateHomeTarget, home, files).length === 0) {
    throw credentialError(`credential-store-empty: account "${capacity.accountId}" has none of [${files.join(', ')}] of store "${store.use}" under ${home}`);
  }
  return true;
}

/**
 * When the dispatch opted in to credential renewal, the ownership marker records which account login this
 * home was copied from, so removing the home can write a login renewed inside it back to its source.
 * Only names and paths go into the marker, never a credential value.
 */
function recordCredentialWriteBack(privateHomeTarget, request) {
  const capacity = request?.providerCapacity;
  if (!capacity?.credentialWriteBack) return;
  const credentialWriteBack = credentialWriteBackMarker({
    provider: capacity.provider,
    accountId: capacity.accountId,
    credentialSource: capacity.credentialSource,
    runtimeDir: capacity.credentialWriteBack.runtimeDir,
  });
  if (credentialWriteBack) extendOwnershipMarker(privateHomeTarget, { credentialWriteBack });
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
  const hiddenRoots = resolvedResources.filter((r) => r.resource === 'hidden-root' && !r.machinePrivate).map((r) => r.hostTarget);
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
 * Refusal specific to machine-private roots (spec section 9.3), for every confined request: the
 * workspace, cwd, repo root or a granted mount that lies inside one would be masked away from the
 * worker that was given it.
 */
function machinePrivateRefusals(request, resolvedResources) {
  const roots = resolvedResources.filter((r) => r.resource === 'hidden-root' && r.machinePrivate).map((r) => r.hostTarget);
  if (roots.length === 0) return [];
  const context = request.context || {};
  const candidates = [
    ['cwd', context.cwd],
    ['repoRoot', context.repoRoot],
    ...resolvedResources
      .filter((r) => r.resource !== 'hidden-root' && r.resource !== 'own-assignment')
      .map((r) => [`${r.resource} mount`, r.hostTarget]),
  ];
  const mismatches = [];
  for (const [name, dir] of candidates) {
    if (typeof dir !== 'string' || !dir) continue;
    const real = realPathOrResolved(dir);
    const root = roots.find((hidden) => isInsideRoot(real, hidden));
    if (root) {
      mismatches.push({
        code: 'machine-private-hides-workspace',
        detail: `the ${name} "${real}" lies inside the machine-private root "${root}", which is hidden from every confined dispatch.`,
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

  // A store is handed over through the private home: a policy that grants none leaves the worker
  // nowhere to find it, and its home variable would keep naming the real store.
  if (request.invocation?.credentialStore && policy && !policyGrants.some((grant) => grant.resource === 'private-home')) {
    mismatches.push({
      code: 'confinement-grant-invalid',
      detail: `the invocation reads login store "${request.invocation.credentialStore.use}" through a private home, and policy "${policyId}" grants no "private-home".`,
    });
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
    mismatches.push(...machinePrivateRefusals(request, resolvedResources));
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

function writeAttemptMarker(dir, fields) {
  if (typeof cleanup.writeOwnershipMarkerV2 !== 'function') {
    const err = new Error('attempt home markers need writeOwnershipMarkerV2 from confinement/cleanup.mjs');
    err.code = 'marker-v2-writer-missing';
    throw err;
  }
  cleanup.writeOwnershipMarkerV2(dir, fields);
}

/**
 * Digest of what a supervised attempt really runs: the bwrap prefix, the gate command that follows
 * it, and the agent argv the gate execs. Changing any of them changes the digest.
 */
export function computeLaunchDigest({ bwrapPrefix, gateCommand, agentArgv }) {
  return computeSha256Digest({ bwrapPrefix, gateCommand, agentArgv });
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
      // Every launch gets its own pid namespace with the launched command as pid 1, so the
      // namespace is empty exactly when that command's tree is gone.
      '--unshare-pid', '--as-pid-1',
    ];
    // Only a terminal-mode launch is tied to its launcher's lifetime. A direct attempt must
    // outlive a dead supervisor, so it never gets --die-with-parent.
    const terminal = request.launchMode === 'terminal';
    if (terminal) {
      const socketDir = ensureRuntimeSocketDir();
      bwrapArgs.push('--die-with-parent', '--bind', socketDir, socketDir);
    }
    const attemptId = typeof request.attemptId === 'string' && request.attemptId !== '' ? request.attemptId : null;
    // The private /tmp above hides whatever lives under the host's /tmp. The gate reads its envelope
    // from the run directory and is itself a host binary, so each is bound back where it sits.
    if (attemptId) {
      const gateBin = Array.isArray(request.gateCommand) ? request.gateCommand[0] : null;
      for (const hostPath of [request.context?.runDir, gateBin]) {
        if (typeof hostPath === 'string' && isInsideRoot(path.resolve(hostPath), '/tmp')) {
          bwrapArgs.push('--ro-bind', path.resolve(hostPath), path.resolve(hostPath));
        }
      }
    }

    const resources = plan.resources || [];
    const blind = requestIsBlind(request);
    const hidden = resources.filter((r) => r.resource === 'hidden-root' && r.executionTarget?.path);
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
        if (attemptId) {
          // An attempt home is removed only by adopt's finalize-home step.
          writeAttemptMarker(res.hostTarget, { attemptId, runDir: request.context?.runDir, dispatchId: request.dispatchId, resource: res.resource });
        } else {
          // A dispatch outside the assignment door removes its own home when it settles.
          writeOwnershipMarker(res.hostTarget, { dispatchId: request.dispatchId, resource: res.resource });
        }
        allocatedPaths.push(res.hostTarget);
        if (res.resource === 'private-home') {
          const provisioned = provisionSelectedCredential(res.hostTarget, request);
          credentialProvisioned = provisioned || credentialProvisioned;
          if (provisioned) recordCredentialWriteBack(res.hostTarget, request);
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
    // Files of the attempt the gate must write from inside the sandbox (its exit record and the capture
    // files). The controller creates them empty beforehand; the attempt directory itself stays read-only.
    const bindAttemptFiles = () => {
      if (!attemptId) return;
      for (const file of request.attemptBinds ?? []) bwrapArgs.push('--bind', file, file);
    };
    if (!blind) {
      // Only machine-private roots are hidden here (spec section 9.3); with none on the host this
      // is the mounts and the attempt binds, byte for byte.
      mounts.forEach(materialize);
      for (const h of hidden) bwrapArgs.push('--tmpfs', h.executionTarget.path);
      bindAttemptFiles();
      for (const h of hidden) bwrapArgs.push('--remount-ro', h.executionTarget.path);
    } else {
      // A later mount over a parent hides an earlier one beneath it, so the order is the
      // contract: mounts that do not sit inside a hidden root (a workspace may contain one),
      // then the masks, then the dispatch's own directory read-only, then the mounts inside
      // a hidden root (its outbox, its private home), and last the masks made read-only.
      const insideMasked = (res) => [...hidden, own].some((h) => res.executionTarget?.path && isInsideRoot(res.executionTarget.path, h.executionTarget.path));
      mounts.filter((r) => !insideMasked(r)).forEach(materialize);
      for (const h of hidden) bwrapArgs.push('--tmpfs', h.executionTarget.path);
      bwrapArgs.push('--ro-bind', own.hostTarget, own.executionTarget.path);
      mounts.filter(insideMasked).forEach(materialize);
      bindAttemptFiles();
      for (const h of hidden) bwrapArgs.push('--remount-ro', h.executionTarget.path);
    }

    // The invocation names the variable its CLI reads its login home from; it points at the private home
    // (spec §6.5: no provider branching, only the name the invocation declared). It wins over a value the
    // invocation's own env carries, which names the real store.
    const resolvedEnv = { ...(request.invocation?.env || {}) };
    const finalArgs = [...(request.invocation?.args || [])];
    const homeEnv = request.invocation?.credentialStore?.homeEnv;
    const privateHome = plan.resources?.find((r) => r.resource === 'private-home');
    if (homeEnv && privateHome) resolvedEnv[homeEnv] = privateHome.executionTarget.path;

    // Command wrap to ensure no inherited writable fds survive (R7, MED-1 fix)
    // Runs bash helper that closes all fds >= 3 before execing the child command.
    const fdCloserScript = 'for f in $(ls /proc/$$/fd 2>/dev/null); do if [ "$f" -ge 3 ] 2>/dev/null; then eval "exec $f>&-" 2>/dev/null || true; fi; done; exec "$@"';

    const originalCmd = request.invocation.command;
    const agentArgv = [originalCmd, ...finalArgs];
    // A supervised attempt hands the prefix to the envelope and the gate is the command, so the
    // worker argv is not appended here.
    if (attemptId) {
      bwrapArgs.push('--');
    } else {
      bwrapArgs.push('--', 'bash', '-c', fdCloserScript, 'bwrap-launch', ...agentArgv);
    }

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
      ...(attemptId ? { bwrapPrefix: [...bwrapArgs], agentArgv, ...(Array.isArray(request.gateCommand) ? { launchDigest: computeLaunchDigest({ bwrapPrefix: bwrapArgs, gateCommand: request.gateCommand, agentArgv }) } : {}) } : {}),
      providerCapacity: credentialProvisioned ? { credentialProvisioned: true } : undefined,
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
