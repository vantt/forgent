// definitions/workflow-adapter.mjs — projects the ALREADY-normalized
// Workflow shape (`src/state/workflow-stage-graphs.mjs`'s internal
// `normalizeWorkflow()` output, reached only through that module's own
// exported `resolveWorkflow`/`operationsForStage`/etc.) into a `Workflow`-
// profile FlowDefinition document, validated by `validateFlowDefinition`
// (`./schema.mjs`, P02.1 — reused, never reimplemented) per
// docs/architect/agent-coordination/contracts/flow-definition.md and
// ADR-009 Decision 2.
//
// PURELY ADDITIVE (ADR-009 Decision 2): this module only READS from
// `workflow-stage-graphs.mjs` through its existing, already-exported
// surface -- `getDomain`, `resolveDomainName`, `resolveWorkflow`,
// `operationsForStage` (roles are read off `getDomain`'s own returned
// `.roleGraph.roles`, the same object `roleGraphFor`'s one-line
// passthrough would return -- this file does not import `roleGraphFor`
// itself). Every one of those was already exported before this cell;
// none of their behavior is touched by this file. `workflow-stage-graphs.mjs`
// itself needed ZERO modification for
// this adapter to exist -- the strongest possible form of "byte-for-byte
// unchanged" for every existing consumer (`getDomain`, `operationsForStage`,
// Stage FSM, skills, TaskSpecs, and the 15+ other call sites ADR-009's
// Context section names) is a zero-diff file.
//
// Layer: infra (same tag as sibling `./schema.mjs` in
// docs/architecture-manifest.json) -- importing the kernel-layer
// `workflow-stage-graphs.mjs` is a down-import (infra -> kernel), the
// same direction `test/architecture.test.mjs`'s one-way-down check already
// allows every other infra module to take.
//
// Node.transitions here means the FlowDefinition graph's own per-node
// OUTGOING-edge list -- a different shape than the raw Workflow YAML's
// flat `{from, to}` transitions array. A raw `{from: 'clarify', to: X}`
// entry has no corresponding FlowDefinition node (`'clarify'` is a
// pre-stage base-workflow marker, never itself a declared Stage/node in
// this Workflow's own `stages` list) -- such entries are silently dropped
// when building each node's outgoing list, they do not become a dangling
// reference or an error. This is a deliberate projection choice (the raw
// Workflow transitions table encodes more than a single-entry FlowDefinition
// graph can represent), not a lossy bug: nothing downstream of this adapter
// consumes it as an execution graph in this phase (R5/R7 explicitly forbid
// runtime wiring).

import {
  validateFlowDefinition,
  FlowDefinitionError,
} from './schema.mjs';
import {
  getDomain,
  resolveDomainName,
  resolveWorkflow,
} from '../../state/workflow-stage-graphs.mjs';
import { operationsForStage } from '../../state/workflow-stage-graphs.mjs';

// PolicyPatch fields this adapter forwards verbatim from a raw operation's
// `.policy` object -- the exact same field set `validatePolicyPatch`
// (schema.mjs) accepts. Filtering to this whitelist here (rather than
// spreading `op.policy` wholesale) keeps a raw operation's own house-style
// fields (there are none known to be out of this set today, but the
// existing `findWorkflowStageOperationProblems` doctor check in
// registrations.mjs already enforces the identical whitelist against raw
// Workflow YAML, so this list is not inventing a new vocabulary) from ever
// silently reaching `validateFlowDefinition` in a way whose rejection
// message would look like a schema.mjs bug rather than an adapter-input
// problem.
const POLICY_PATCH_KEYS = ['minTier', 'preferPersona', 'preferExecutor', 'fallbackExecutors', 'visibility'];

function projectPolicy(rawPolicy) {
  if (!rawPolicy || typeof rawPolicy !== 'object') return undefined;
  const result = {};
  let any = false;
  for (const key of POLICY_PATCH_KEYS) {
    if (rawPolicy[key] !== undefined) {
      result[key] = key === 'fallbackExecutors' ? [...rawPolicy[key]] : rawPolicy[key];
      any = true;
    }
  }
  return any ? result : undefined;
}

/**
 * Project one normalized Workflow operation (as returned by
 * `operationsForStage`) into a FlowDefinition Operation Primitive candidate
 * object. `id` is namespaced `${stage}::${op.id}` because a raw Workflow's
 * own operation ids are only unique WITHIN one stage (e.g. `feature.yaml`
 * legitimately reuses `resolve-question` across `discovery`/`exploring`/
 * `planning`/`executing`), while `spec.operations[].id` must be globally
 * unique across the whole FlowDefinition document (schema.mjs). This is a
 * judgment call recorded in the cell report -- reversible, and invisible to
 * every existing consumer since nothing reads this adapter's operation ids
 * except this adapter's own graph-node `ref`s, built from the same
 * expression right below.
 */
function projectOperation(stage, op) {
  const result = { id: `${stage}::${op.id}`, role: op.role };

  if (Array.isArray(op.skills)) {
    result.capabilities = [...op.skills];
  }

  if (typeof op.taskSpec === 'string' && op.taskSpec.trim() !== '') {
    result.task = { taskSpec: op.taskSpec };
  }

  const policy = projectPolicy(op.policy);
  if (policy) result.policy = policy;

  // Raw Workflow YAML operations never declare a `result` field today
  // (confirmed by reading every `domains/coding/workflows/*.yaml` operation
  // block) -- `result` stays legally absent (schema.mjs: optional), not
  // guessed at by this adapter.
  return result;
}

/**
 * Project `domain`'s `kind`-resolved Workflow (same resolution
 * `resolveWorkflow`/`operationsForStage` already use internally) into a
 * `Workflow`-profile FlowDefinition document, validated and returned by
 * `validateFlowDefinition` (frozen, deep-immutable, normalized -- never a
 * reference into any Workflow-registry object).
 *
 * @param {string} domainName Domain name (resolved via `resolveDomainName`,
 *   same never-throw fold every `workflow-stage-graphs.mjs` helper uses).
 * @param {string|{kind?: string}} [options] A `kind` string, or `{kind}` --
 *   same calling convention as `operationsForStage`/`resolveWorkflow`.
 * @returns {Readonly<object>} the validated FlowDefinition document.
 * @throws {FlowDefinitionError} when the resolved domain declares no
 *   `workflows` at all, the resolved workflow has no stages, or the
 *   projected candidate document fails `validateFlowDefinition`.
 */
export function projectWorkflowToFlowDefinition(domainName, options = {}) {
  const resolvedDomainName = resolveDomainName(domainName);
  const domainObj = getDomain(domainName);
  const kind = typeof options === 'string' ? options : options?.kind;

  const wf = resolveWorkflow(domainObj, kind);
  if (!wf) {
    throw new FlowDefinitionError(
      'validation',
      `workflow-adapter: domain "${resolvedDomainName}" declares no workflows -- nothing to project into a FlowDefinition`,
    );
  }
  if (!Array.isArray(wf.stages) || wf.stages.length === 0) {
    throw new FlowDefinitionError(
      'validation',
      `workflow-adapter: domain "${resolvedDomainName}"'s resolved workflow declares no stages -- nothing to project`,
    );
  }

  // Same resolution expression `resolveWorkflow` already applies
  // internally -- reproduced here only to recover a readable workflow NAME
  // for `metadata.id`, not a second, divergent resolution rule.
  const workflowName = (kind !== undefined && domainObj.workflowFor?.[kind]) || domainObj.defaultWorkflow || 'default';

  const declaredRoles = domainObj.roleGraph?.roles;
  const usedRoles = new Set();

  const operations = [];
  const nodes = wf.stages.map((stage) => {
    const stageOps = operationsForStage(domainObj, stage, { kind });
    const opRefs = stageOps.map((op) => {
      usedRoles.add(op.role);
      operations.push(projectOperation(stage, op));
      return { ref: `${stage}::${op.id}` };
    });

    const transitions = wf.transitions
      .filter((t) => t.from === stage && wf.stages.includes(t.to))
      .map((t) => t.to);

    return { id: stage, operations: opRefs, transitions };
  });

  const roles = Array.isArray(declaredRoles) && declaredRoles.length > 0
    ? [...declaredRoles]
    : [...usedRoles];

  const baseStepMap = { ...wf.stepMap };

  const candidate = {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: { id: `workflow:${resolvedDomainName}/${workflowName}` },
    spec: {
      profile: { kind: 'Workflow', work: { baseStepMap } },
      roles,
      operations,
      graph: { entry: wf.stages[0], nodes },
    },
  };

  try {
    return validateFlowDefinition(candidate);
  } catch (err) {
    if (err instanceof FlowDefinitionError) {
      throw new FlowDefinitionError(
        err.category,
        `workflow-adapter: projecting domain "${resolvedDomainName}" workflow "${workflowName}" -- ${err.message}`,
      );
    }
    throw err;
  }
}
