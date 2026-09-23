// dispatch/effective-execution-contract.mjs — pure projection, validation,
// and prompt summary for the secret-free Effective Execution Contract (I02).
//
// Acceptance:
// - Persisted before worker launch under run directory (effective-execution-contract.json).
// - Contains no secrets and no raw env token values.
// - Records assignment id, run id, mutation, cwd/write scope, main checkout,
//   executor id, adapter family, limits, result claim path, and permission
//   enforcement posture.
// - Prompt/brief and persisted contract agree on claim path, mutation, and limits.
// - Honest about requested vs enforced permissions: shell restrictions are not
//   labeled enforced unless confinement or the adapter actually enforces them.
// - Digest/provenance links to dispatch-plan.json and resolved config.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { RunnerConfigError } from './config.mjs';
import { resolveMutatingCwdPosture } from './execution-contract.mjs';
import { resolveMainCheckoutRoot, resolveRepoRoot } from '../paths.mjs';
import { isReadOnlyAssignment } from './assignment.mjs';
import { AGENT_RESULT_CLAIM_CONTRACT } from './agent-result-claim-contract.mjs';

export const EFFECTIVE_EXECUTION_CONTRACT = Object.freeze({
  id: 'effective-execution-contract',
  version: 1,
});

export const EFFECTIVE_EXECUTION_CONTRACT_FILE = 'effective-execution-contract.json';

const SECRET_KEY_PATTERN = /token|secret|password|credential|apiKey|privateKey|auth(?!entication|orization\b)|cookie/i;

/**
 * Deterministically sort and serialize a JSON-compatible value.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function canonicalJson(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(',')}}`;
}

/**
 * Compute sha256 digest string prefixed with 'sha256:'.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function computeSha256Digest(value) {
  const json = typeof value === 'string' ? value : canonicalJson(value);
  const hash = crypto.createHash('sha256').update(json).digest('hex');
  return `sha256:${hash}`;
}

/**
 * Recursively strip any potential secrets, credentials, or raw environment tokens.
 *
 * @param {unknown} value
 * @returns {unknown}
 */
export function stripSecrets(value) {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(stripSecrets);
  }
  const clean = {};
  for (const [key, val] of Object.entries(value)) {
    if (key === 'credentialProvisioned' && typeof val === 'boolean') {
      clean[key] = val;
      continue;
    }
    if (SECRET_KEY_PATTERN.test(key) || key === 'env' || key === 'environment' || key === 'headers') {
      continue;
    }
    clean[key] = stripSecrets(val);
  }
  return clean;
}

/**
 * Scan an object recursively to ensure it does not contain secret keys.
 *
 * @param {unknown} value
 * @param {string} [pathStr='']
 */
export function assertNoSecrets(value, pathStr = '') {
  if (value === null || typeof value !== 'object') {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoSecrets(item, `${pathStr}[${index}]`));
    return;
  }
  for (const [key, val] of Object.entries(value)) {
    const currentPath = pathStr ? `${pathStr}.${key}` : key;
    if (key === 'credentialProvisioned' && typeof val === 'boolean') {
      continue;
    }
    if (SECRET_KEY_PATTERN.test(key)) {
      throw new RunnerConfigError(
        `effective-execution-contract: prohibited secret field "${currentPath}" detected in effective contract`,
      );
    }
    assertNoSecrets(val, currentPath);
  }
}

/**
 * Build a pure projection of the effective execution contract.
 *
 * @param {object} params
 * @param {object} params.assignment Required assignment object
 * @param {object} params.dispatchPlan Required DispatchPlan object
 * @param {string} params.runId Required run id
 * @param {string} params.runDir Required run directory
 * @param {string} [params.cwd] Workspace current working directory
 * @param {string} [params.repoRoot] Main repository root
 * @param {object} [params.runnerConfig] Runner configuration
 * @param {number} [params.timeoutMs] Timeout in milliseconds
 * @param {string} [params.sessionWallTimeExpiresAt] Session expiration timestamp
 * @param {string} [params.executorId] Resolved executor id
 * @param {string} [params.adapter] Resolved adapter
 * @param {object} [params.confinement] Confinement configuration
 * @param {object} [params.providerCapacity] Redacted provider account selection
 * @param {string} [params.resultClaimPath] Custom result claim path
 * @returns {Readonly<object>}
 */
export function buildEffectiveExecutionContract({
  assignment,
  dispatchPlan,
  runId,
  runDir,
  cwd,
  repoRoot,
  runnerConfig,
  timeoutMs,
  sessionWallTimeExpiresAt,
  executorId,
  adapter,
  confinement,
  providerCapacity,
  resultClaimPath,
  templateProvenance,
} = {}) {
  if (!assignment || typeof assignment !== 'object') {
    throw new RunnerConfigError('effective-execution-contract: assignment must be a non-null object');
  }
  if (!assignment.assignmentId || typeof assignment.assignmentId !== 'string') {
    throw new RunnerConfigError('effective-execution-contract: assignment.assignmentId must be a non-empty string');
  }

  // Mutation determination
  let effectiveMutation = assignment.mutation;
  if (!effectiveMutation) {
    effectiveMutation = isReadOnlyAssignment(assignment) ? 'read-only' : 'mutating';
  }
  if (effectiveMutation !== 'read-only' && effectiveMutation !== 'mutating') {
    throw new RunnerConfigError(
      `effective-execution-contract: mutation must be "read-only" or "mutating", got ${JSON.stringify(effectiveMutation)}`,
    );
  }

  if (!runId || typeof runId !== 'string') {
    throw new RunnerConfigError('effective-execution-contract: runId must be a non-empty string');
  }
  if (!runDir || typeof runDir !== 'string') {
    throw new RunnerConfigError('effective-execution-contract: runDir must be a non-empty string');
  }

  // Contract between DispatchPlan and adapter: verify required DispatchPlan fields
  if (!dispatchPlan || typeof dispatchPlan !== 'object') {
    throw new RunnerConfigError('effective-execution-contract: dispatchPlan must be a non-null object');
  }
  if (dispatchPlan.mechanism === undefined || dispatchPlan.mechanism === null) {
    throw new RunnerConfigError('effective-execution-contract: dispatchPlan.mechanism is required');
  }

  const resolvedExecutorId = executorId ?? dispatchPlan.executorId;
  if (!resolvedExecutorId || typeof resolvedExecutorId !== 'string') {
    throw new RunnerConfigError('effective-execution-contract: executorId must be a non-empty string');
  }

  const resolvedAdapter = adapter ?? dispatchPlan.invocation?.adapter;
  if (!resolvedAdapter || typeof resolvedAdapter !== 'string') {
    throw new RunnerConfigError('effective-execution-contract: adapter must be a non-empty string (from dispatchPlan.invocation.adapter or parameter)');
  }

  // Workspace and CWD posture
  const effectiveCwd = cwd ?? dispatchPlan.invocation?.cwd ?? dispatchPlan.cwd ?? process.cwd();
  const absCwd = path.resolve(effectiveCwd);

  const postureResult = resolveMutatingCwdPosture(absCwd);
  let workspacePosture = 'unknown';
  let mainCheckoutRoot = null;
  if (postureResult.ok) {
    workspacePosture = 'worktree';
    mainCheckoutRoot = postureResult.mainCheckoutRoot;
  } else if (postureResult.reason === 'main-checkout') {
    workspacePosture = 'main-checkout';
    mainCheckoutRoot = postureResult.repoRoot;
  } else if (postureResult.reason === 'outside-git') {
    workspacePosture = 'outside-git';
    mainCheckoutRoot = null;
  } else {
    workspacePosture = postureResult.reason || 'unresolvable';
    mainCheckoutRoot = repoRoot ? path.resolve(repoRoot) : null;
  }

  const writeScope = effectiveMutation === 'read-only' ? [] : [absCwd];

  // Confinement & permissions
  const conf = confinement
    ?? dispatchPlan.policy?.confinement
    ?? runnerConfig?.executors?.[resolvedExecutorId]?.confinement
    ?? runnerConfig?.executor?.confinement
    ?? null;

  // A declared policy is only a request. The production launch path supplies
  // the Authority's prepared requirement/backend pair, which is the durable
  // statement of what will actually be applied.
  const resolvedRequirement = conf?.requirement ?? conf;
  const resolvedBackend = conf?.backend ?? null;
  const isConfinementEnforced = Boolean(
    resolvedRequirement &&
    resolvedRequirement.mode !== 'unconfined' &&
    (resolvedRequirement.policyId || resolvedRequirement.controls || resolvedRequirement.mode === 'required') &&
    (!resolvedBackend || (resolvedBackend.id !== 'none' && resolvedBackend.type !== 'none')),
  );

  // Shell command filtering is not enforced by current adapters (cli-spawn, herdr-spawn)
  // or bwrap confinement; be completely honest and label it 'instructed'.
  const isShellEnforced = false;
  const shellMode = effectiveMutation === 'read-only' ? 'restricted' : 'worktree-write';
  const allowedCommands = effectiveMutation === 'read-only' ? [] : ['git add', 'git commit'];
  const overallPosture = isConfinementEnforced ? 'enforced' : 'instructed';

  // Limits
  const effectiveTimeoutMs = Number.isInteger(timeoutMs) && timeoutMs > 0
    ? timeoutMs
    : (Number.isInteger(assignment.budget?.timeoutMs) && assignment.budget.timeoutMs > 0
      ? assignment.budget.timeoutMs
      : (Number.isInteger(runnerConfig?.timeoutMs) && runnerConfig.timeoutMs > 0
        ? runnerConfig.timeoutMs
        : 900000));

  // Result claim
  const absRunDir = path.resolve(runDir);
  const claimPath = resultClaimPath
    ? path.resolve(resultClaimPath)
    : path.join(absRunDir, 'agent-result.json');

  // Provenance (sanitized of secrets)
  const dispatchPlanHash = computeSha256Digest(stripSecrets(dispatchPlan));
  const configHash = runnerConfig ? computeSha256Digest(stripSecrets(runnerConfig)) : null;

  const contract = {
    contract: { id: EFFECTIVE_EXECUTION_CONTRACT.id, version: EFFECTIVE_EXECUTION_CONTRACT.version },
    assignmentId: assignment.assignmentId,
    runId,
    mutation: effectiveMutation,
    workspace: {
      cwd: absCwd,
      writeScope,
      mainCheckout: mainCheckoutRoot,
      posture: workspacePosture,
    },
    tools: {
      shell: {
        mode: shellMode,
        enforced: isShellEnforced,
        enforcement: isShellEnforced ? 'enforced' : 'instructed',
        allowedCommands,
      },
    },
    permissions: {
      posture: overallPosture,
      shell: {
        mode: shellMode,
        enforced: isShellEnforced,
        enforcement: isShellEnforced ? 'enforced' : 'instructed',
        allowedCommands,
      },
      filesystem: {
        mode: effectiveMutation === 'read-only' ? 'read-only' : 'workspace-write',
        enforced: isConfinementEnforced,
        enforcement: isConfinementEnforced ? 'enforced' : 'instructed',
        writeScope,
      },
      network: {
        enforced: false,
        enforcement: 'instructed',
      },
    },
    limits: {
      executorTimeoutMs: effectiveTimeoutMs,
      ...(sessionWallTimeExpiresAt ? { sessionWallTimeExpiresAt } : {}),
    },
    resultClaim: {
      contract: { id: AGENT_RESULT_CLAIM_CONTRACT.id, version: AGENT_RESULT_CLAIM_CONTRACT.version },
      path: claimPath,
    },
    provenance: {
      dispatchPlanHash,
      ...(configHash ? { configHash } : {}),
      executorId: resolvedExecutorId,
      adapter: resolvedAdapter,
      adapterFamily: resolvedAdapter,
      ...(templateProvenance ? { template: templateProvenance } : (assignment.provenance?.template ? { template: assignment.provenance.template } : {})),
    },
    ...(providerCapacity ? { providerCapacity: stripSecrets(providerCapacity) } : {}),
    enforcementPosture: overallPosture,
    permissionEnforcementPosture: overallPosture,
    executorId: resolvedExecutorId,
    adapter: resolvedAdapter,
    adapterFamily: resolvedAdapter,
  };

  validateEffectiveExecutionContract(contract);
  return Object.freeze(contract);
}

/**
 * Validate that an effective execution contract conforms to the v1 schema and contains no secrets.
 *
 * @param {unknown} value
 */
export function validateEffectiveExecutionContract(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new RunnerConfigError('effective-execution-contract: contract must be a non-null object');
  }

  assertNoSecrets(value);

  if (!value.contract || typeof value.contract !== 'object' || Array.isArray(value.contract)) {
    throw new RunnerConfigError('effective-execution-contract: contract.contract must be an object');
  }
  if (value.contract.id !== EFFECTIVE_EXECUTION_CONTRACT.id || value.contract.version !== EFFECTIVE_EXECUTION_CONTRACT.version) {
    throw new RunnerConfigError(
      `effective-execution-contract: contract must have id "${EFFECTIVE_EXECUTION_CONTRACT.id}" and version ${EFFECTIVE_EXECUTION_CONTRACT.version}`,
    );
  }

  if (typeof value.assignmentId !== 'string' || !value.assignmentId.trim()) {
    throw new RunnerConfigError('effective-execution-contract: assignmentId must be a non-empty string');
  }

  if (typeof value.runId !== 'string' || !value.runId.trim()) {
    throw new RunnerConfigError('effective-execution-contract: runId must be a non-empty string');
  }

  if (value.mutation !== 'read-only' && value.mutation !== 'mutating') {
    throw new RunnerConfigError('effective-execution-contract: mutation must be "read-only" or "mutating"');
  }

  if (!value.workspace || typeof value.workspace !== 'object' || Array.isArray(value.workspace)) {
    throw new RunnerConfigError('effective-execution-contract: workspace must be a non-null object');
  }
  if (typeof value.workspace.cwd !== 'string' || !value.workspace.cwd.trim()) {
    throw new RunnerConfigError('effective-execution-contract: workspace.cwd must be a non-empty string');
  }
  if (!Array.isArray(value.workspace.writeScope)) {
    throw new RunnerConfigError('effective-execution-contract: workspace.writeScope must be an array');
  }
  if (!Object.hasOwn(value.workspace, 'mainCheckout') || (value.workspace.mainCheckout !== null && (typeof value.workspace.mainCheckout !== 'string' || !value.workspace.mainCheckout.trim()))) {
    throw new RunnerConfigError('effective-execution-contract: workspace.mainCheckout must be a non-empty string or null');
  }

  if (!value.tools || typeof value.tools !== 'object' || Array.isArray(value.tools)) {
    throw new RunnerConfigError('effective-execution-contract: tools must be a non-null object');
  }
  if (!value.tools.shell || typeof value.tools.shell !== 'object' || Array.isArray(value.tools.shell)) {
    throw new RunnerConfigError('effective-execution-contract: tools.shell must be a non-null object');
  }
  if (typeof value.tools.shell.enforced !== 'boolean') {
    throw new RunnerConfigError('effective-execution-contract: tools.shell.enforced must be a boolean');
  }
  if (!value.permissions || typeof value.permissions !== 'object' || Array.isArray(value.permissions)) {
    throw new RunnerConfigError('effective-execution-contract: permissions must be a non-null object');
  }
  if (typeof value.permissions.filesystem?.enforced !== 'boolean') {
    throw new RunnerConfigError('effective-execution-contract: permissions.filesystem.enforced must be a boolean');
  }
  if (value.enforcementPosture !== 'enforced' && value.enforcementPosture !== 'instructed') {
    throw new RunnerConfigError('effective-execution-contract: enforcementPosture must be "enforced" or "instructed"');
  }
  if (typeof value.adapterFamily !== 'string' || !value.adapterFamily.trim()) {
    throw new RunnerConfigError('effective-execution-contract: adapterFamily must be a non-empty string');
  }

  if (!value.limits || typeof value.limits !== 'object' || Array.isArray(value.limits)) {
    throw new RunnerConfigError('effective-execution-contract: limits must be a non-null object');
  }
  if (!Number.isInteger(value.limits.executorTimeoutMs) || value.limits.executorTimeoutMs <= 0) {
    throw new RunnerConfigError('effective-execution-contract: limits.executorTimeoutMs must be a positive integer');
  }

  if (!value.resultClaim || typeof value.resultClaim !== 'object' || Array.isArray(value.resultClaim)) {
    throw new RunnerConfigError('effective-execution-contract: resultClaim must be a non-null object');
  }
  if (value.resultClaim.contract?.id !== AGENT_RESULT_CLAIM_CONTRACT.id || value.resultClaim.contract?.version !== AGENT_RESULT_CLAIM_CONTRACT.version) {
    throw new RunnerConfigError(
      `effective-execution-contract: resultClaim.contract must be { id: "${AGENT_RESULT_CLAIM_CONTRACT.id}", version: ${AGENT_RESULT_CLAIM_CONTRACT.version} }`,
    );
  }
  if (typeof value.resultClaim.path !== 'string' || !value.resultClaim.path.trim()) {
    throw new RunnerConfigError('effective-execution-contract: resultClaim.path must be a non-empty string');
  }

  if (!value.provenance || typeof value.provenance !== 'object' || Array.isArray(value.provenance)) {
    throw new RunnerConfigError('effective-execution-contract: provenance must be a non-null object');
  }
  if (typeof value.provenance.dispatchPlanHash !== 'string' || !value.provenance.dispatchPlanHash.startsWith('sha256:')) {
    throw new RunnerConfigError('effective-execution-contract: provenance.dispatchPlanHash must be a sha256 digest string');
  }
  if (typeof value.provenance.executorId !== 'string' || !value.provenance.executorId.trim()) {
    throw new RunnerConfigError('effective-execution-contract: provenance.executorId must be a non-empty string');
  }
  if (typeof value.provenance.adapter !== 'string' || !value.provenance.adapter.trim()) {
    throw new RunnerConfigError('effective-execution-contract: provenance.adapter must be a non-empty string');
  }
  if (value.provenance.template !== undefined) {
    const tmpl = value.provenance.template;
    if (tmpl === null || typeof tmpl !== 'object' || Array.isArray(tmpl)) {
      throw new RunnerConfigError('effective-execution-contract: provenance.template must be an object when present');
    }
    if (typeof tmpl.id !== 'string' || !tmpl.id.trim()) {
      throw new RunnerConfigError('effective-execution-contract: provenance.template.id must be a non-empty string');
    }
    const SHA256_HEX_REGEX = /^sha256:[0-9a-f]{64}$/;
    if (typeof tmpl.contentDigest !== 'string' || !SHA256_HEX_REGEX.test(tmpl.contentDigest)) {
      throw new RunnerConfigError('effective-execution-contract: provenance.template.contentDigest must be a valid sha256 digest string');
    }
    if (typeof tmpl.renderedPromptDigest !== 'string' || !SHA256_HEX_REGEX.test(tmpl.renderedPromptDigest)) {
      throw new RunnerConfigError('effective-execution-contract: provenance.template.renderedPromptDigest must be a valid sha256 digest string');
    }
    if (tmpl.tier !== undefined && (typeof tmpl.tier !== 'string' || !tmpl.tier.trim())) {
      throw new RunnerConfigError('effective-execution-contract: provenance.template.tier must be a non-empty string when present');
    }
    if (tmpl.source !== undefined && (typeof tmpl.source !== 'string' || !tmpl.source.trim())) {
      throw new RunnerConfigError('effective-execution-contract: provenance.template.source must be a non-empty string when present');
    }
    if (tmpl.filePath !== undefined && tmpl.filePath !== null && (typeof tmpl.filePath !== 'string' || !tmpl.filePath.trim())) {
      throw new RunnerConfigError('effective-execution-contract: provenance.template.filePath must be a string or null when present');
    }
    if (tmpl.templateSnapshot !== undefined) {
      if (typeof tmpl.templateSnapshot !== 'string' || !tmpl.templateSnapshot.trim()) {
        throw new RunnerConfigError('effective-execution-contract: provenance.template.templateSnapshot must be a non-empty string when present');
      }
      const actualDigest = `sha256:${crypto.createHash('sha256').update(tmpl.templateSnapshot, 'utf8').digest('hex')}`;
      if (actualDigest !== tmpl.contentDigest) {
        throw new RunnerConfigError(
          `effective-execution-contract: provenance.template.templateSnapshot digest mismatch: expected "${tmpl.contentDigest}", computed "${actualDigest}"`,
        );
      }
    }
  }
  if (value.providerCapacity !== undefined) {
    if (!value.providerCapacity || typeof value.providerCapacity !== 'object' || Array.isArray(value.providerCapacity)) {
      throw new RunnerConfigError('effective-execution-contract: providerCapacity must be an object when present');
    }
    for (const forbidden of ['credentialSource', 'home', 'env', 'environment', 'authJsonDigest', 'sha256']) {
      if (Object.hasOwn(value.providerCapacity, forbidden)) {
        throw new RunnerConfigError(`effective-execution-contract: providerCapacity must not persist "${forbidden}"`);
      }
    }
    if (typeof value.providerCapacity.provider !== 'string' || !value.providerCapacity.provider.trim()) {
      throw new RunnerConfigError('effective-execution-contract: providerCapacity.provider must be a non-empty string when present');
    }
    if (typeof value.providerCapacity.accountId !== 'string' || !value.providerCapacity.accountId.trim()) {
      throw new RunnerConfigError('effective-execution-contract: providerCapacity.accountId must be a non-empty string when present');
    }
  }
}

/**
 * Render a concise, stable human-readable execution contract summary for prompt/brief inclusion.
 *
 * @param {object} contract Validated effective execution contract
 * @returns {string}
 */
export function renderEffectiveContractSummary(contract) {
  const lines = [
    'Effective execution contract:',
    `- Contract: ${contract.contract.id}.v${contract.contract.version}`,
    `- Mutation: ${contract.mutation}`,
    `- Claim path: ${contract.resultClaim.path}`,
    `- Timeout: ${contract.limits.executorTimeoutMs ?? contract.limits.timeoutMs}ms`,
    `- Write scope: ${contract.workspace.writeScope.length > 0 ? contract.workspace.writeScope.join(', ') : '(none - read-only)'}`,
    `- Main checkout: ${contract.workspace.mainCheckout || '(none)'}`,
    `- Permission enforcement: ${contract.enforcementPosture}`,
  ];
  return lines.join('\n');
}

/**
 * Read and validate an effective execution contract file from a run directory.
 *
 * @param {string} runDir Absolute path to the run directory
 * @returns {Readonly<object>}
 */
export function readEffectiveExecutionContract(runDir) {
  const contractPath = path.join(path.resolve(runDir), EFFECTIVE_EXECUTION_CONTRACT_FILE);
  if (!fs.existsSync(contractPath)) {
    throw new RunnerConfigError(`effective execution contract not found at ${contractPath}`);
  }
  let raw;
  try {
    raw = fs.readFileSync(contractPath, 'utf8');
  } catch (err) {
    throw new RunnerConfigError(`cannot read effective execution contract at ${contractPath}: ${err.message}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new RunnerConfigError(`invalid JSON in effective execution contract at ${contractPath}: ${err.message}`);
  }
  validateEffectiveExecutionContract(parsed);
  return Object.freeze(parsed);
}
