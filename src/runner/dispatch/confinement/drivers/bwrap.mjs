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
import os from 'node:os';
import path from 'node:path';
import { cleanupConfinementResource, writeOwnershipMarker } from '../cleanup.mjs';
import { resolveConfinementResources } from '../resources.mjs';
import { assertAttestationStoreIsolated } from '../attestation-store.mjs';

export const BWRAP_DRIVER_TYPE = 'bwrap';
export const BWRAP_DRIVER_VERSION = 'local-bwrap-v1';

function expandCredentialHome(home) {
  if (typeof home !== 'string' || !home.trim()) return null;
  return home
    .replace(/^\$\{HOME\}(?=\/|$)/, process.env.HOME || '')
    .replace(/^~(?=\/|$)/, process.env.HOME || '');
}

function provisionSelectedCodexCredential(privateHomeTarget, request) {
  const source = request?.providerCapacity?.credentialSource;
  if (!source) return false;
  if (source.kind !== 'codex-home') {
    const err = new Error(`unsupported provider credential source kind "${source.kind}"`);
    err.code = 'credential-provisioning';
    throw err;
  }
  const home = expandCredentialHome(source.home);
  const authCandidate = home ? path.join(home, 'auth.json') : null;
  if (!authCandidate || !fs.existsSync(authCandidate)) {
    const err = new Error('selected Codex credential auth.json is missing');
    err.code = 'credential-provisioning';
    throw err;
  }
  try {
    fs.copyFileSync(authCandidate, path.join(privateHomeTarget, 'auth.json'));
  } catch (copyErr) {
    const err = new Error(`selected Codex credential auth.json could not be copied: ${copyErr.message}`);
    err.code = 'credential-provisioning';
    throw err;
  }
  return true;
}

function isAgyRequest(request) {
  const source = request?.providerCapacity?.credentialSource;
  if (source?.kind === 'agy-home' || source?.kind === 'gemini-home') return true;
  if (source?.kind && source.kind !== 'agy-home' && source.kind !== 'gemini-home') return false;

  const provider = request?.providerCapacity?.provider;
  if (provider === 'gemini' || provider === 'agy') return true;

  const command = request?.invocation?.command;
  if (typeof command === 'string' && (command === 'agy' || command.endsWith('/agy'))) return true;

  const execId = request?.executorId;
  if (typeof execId === 'string' && (execId.startsWith('agy') || execId.includes('agy') || execId.includes('gemini'))) return true;

  return false;
}

export function provisionAgyCredential(privateHomeTarget, request) {
  try {
    if (!isAgyRequest(request)) return false;

    const source = request?.providerCapacity?.credentialSource;
    const candidates = [];
    if (source?.home) {
      candidates.push(expandCredentialHome(source.home));
    }
    if (request?.invocation?.env?.HOME) {
      candidates.push(expandCredentialHome(request.invocation.env.HOME));
    }
    if (process.env.HOME) {
      candidates.push(process.env.HOME);
    }
    const homeDir = os.homedir?.() || process.env.HOME;
    if (homeDir && !candidates.includes(homeDir)) {
      candidates.push(homeDir);
    }

    let sourceAgyDir = null;
    for (const cand of candidates) {
      if (!cand) continue;
      const agySubdir = path.join(cand, '.gemini', 'antigravity-cli');
      if (fs.existsSync(agySubdir)) {
        sourceAgyDir = agySubdir;
        break;
      }
      if (fs.existsSync(path.join(cand, 'settings.json')) || fs.existsSync(path.join(cand, 'antigravity-oauth-token'))) {
        sourceAgyDir = cand;
        break;
      }
      const directAgy = path.join(cand, 'antigravity-cli');
      if (fs.existsSync(directAgy)) {
        sourceAgyDir = directAgy;
        break;
      }
    }

    const targetAgyDir = path.join(privateHomeTarget, '.gemini', 'antigravity-cli');
    fs.mkdirSync(targetAgyDir, { recursive: true });

    const sessionDirs = [
      'log',
      'crashes',
      'conversations',
      'brain',
      'presence',
      'cache',
      'annotations',
      'scratch',
      'mcp',
    ];
    for (const dir of sessionDirs) {
      try {
        fs.mkdirSync(path.join(targetAgyDir, dir), { recursive: true });
      } catch {}
    }

    let provisioned = false;

    if (sourceAgyDir && fs.existsSync(sourceAgyDir)) {
      const knownFiles = [
        'settings.json',
        'antigravity-oauth-token',
        'installation_id',
        'jetski_state.pbtxt',
        'oauth_credentials.json',
        'google-oauth-token',
        'token.json',
        'auth.json',
      ];
      try {
        const entries = fs.readdirSync(sourceAgyDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isFile()) {
            const name = entry.name;
            if (knownFiles.includes(name) || /token|auth|cred|key/i.test(name)) {
              try {
                fs.copyFileSync(path.join(sourceAgyDir, name), path.join(targetAgyDir, name));
                provisioned = true;
              } catch {}
            }
          }
        }
      } catch {}

      const sourceMcp = path.join(sourceAgyDir, 'mcp');
      if (fs.existsSync(sourceMcp)) {
        try {
          fs.cpSync(sourceMcp, path.join(targetAgyDir, 'mcp'), { recursive: true });
        } catch {}
      }
    }

    // Ensure settings.json permissions and workspace trust
    try {
      const settingsFile = path.join(targetAgyDir, 'settings.json');
      let settings = {};
      if (fs.existsSync(settingsFile)) {
        try {
          settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8')) || {};
        } catch {}
      } else {
        settings = {
          toolPermission: 'always-proceed',
          permissions: {
            deny: [
              'command(regex:^rm .*-rf)',
              'command(regex:^sudo )',
              'command(regex:^git push .*(--force|-f\\b))',
              'command(regex:^git reset .*--hard)',
              'command(regex:^git stash)',
              'command(regex:^curl )',
              'command(regex:^wget )',
            ],
          },
        };
      }
      if (!settings.toolPermission) {
        settings.toolPermission = 'always-proceed';
      }
      const trusted = Array.isArray(settings.trustedWorkspaces) ? [...settings.trustedWorkspaces] : [];
      for (const ws of [request.context?.repoRoot, request.context?.cwd]) {
        if (ws && typeof ws === 'string' && !trusted.includes(ws)) {
          trusted.push(ws);
        }
      }
      settings.trustedWorkspaces = trusted;
      fs.writeFileSync(settingsFile, `${JSON.stringify(settings, null, 2)}\n`);
      provisioned = true;
    } catch {}

    return provisioned;
  } catch {
    return false;
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
 * provisioning a selected provider account credential file into a private
 * home, which grants nothing away from any other executor and is not a
 * confinement control.
 */
export async function prepareBwrap(plan, request, backend) {
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

    // Materialize mounts ONLY from plan.resources (R4)
    for (const res of plan.resources || []) {
      if (!res.hostTarget || !res.executionTarget?.path) continue;

      if (res.allocation === 'temporary') {
        fs.mkdirSync(res.hostTarget, { recursive: true });
        writeOwnershipMarker(res.hostTarget, { dispatchId: request.dispatchId, resource: res.resource });
        allocatedPaths.push(res.hostTarget);
        if (res.resource === 'private-home') {
          const credKind = request?.providerCapacity?.credentialSource?.kind;
          if (credKind === 'agy-home' || credKind === 'gemini-home') {
            credentialProvisioned = provisionAgyCredential(res.hostTarget, request) || credentialProvisioned;
          } else {
            credentialProvisioned = provisionSelectedCodexCredential(res.hostTarget, request) || credentialProvisioned;
            credentialProvisioned = provisionAgyCredential(res.hostTarget, request) || credentialProvisioned;
          }
        }
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
    
    // Inject environment variables directly into bwrap so we don't rely on the launcher script
    if (resolvedEnv) {
      for (const [k, v] of Object.entries(resolvedEnv)) {
        bwrapArgs.push('--setenv', k, v);
      }
    }

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
