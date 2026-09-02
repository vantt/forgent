// schema.mjs — the R2 request/schema trust boundary for `fgos coordination
// run`. Validates a caller-supplied request FILE (portable/semantic content:
// objective, context, constraints, a protocol REFERENCE, and a bounded set
// of trusted per-actor policy bindings) before it ever reaches
// `session-engine.mjs`. This module never opens a session, never dispatches,
// never touches `.fgos/` — it is pure input validation, mirroring every
// other verb's own `StoreError('validation', ...)` convention (see
// `src/verbs/merge/reject.mjs`) so a rejected request surfaces through the
// CLI's existing, documented exit-code contract (EXIT_CODES.validation = 4).
//
// Trust boundary (docs/architect/agent-coordination/contracts/coordination-session.md,
// docs/routing-handoff-contract.md "Ranh giới tin cậy"): the request FILE
// itself is operator-authored and trusted (same posture `.fgos/config.json`'s
// `runner` section already has) -- what this module guards against is a
// request file smuggling PORTABLE PROTOCOL content, a Role/actor-topology
// rewrite, a Work-lifecycle side channel, a path-traversal id, or a field
// that overlaps the CLI's own reserved --executor/--model/--tier authority.
// Every one of R2's named reject categories below has its own dedicated
// check function and its own dedicated negative test (test/cli/coordination.test.mjs).

import { StoreError } from '../../state/store.mjs';

// Same safe filesystem charset session-engine.mjs's own
// `assertSafeCoordinationId` enforces (store.mjs), applied here too so a
// path-escape-shaped id is rejected AT THE SCHEMA BOUNDARY with an
// attributable "path escape" reason, not merely deferred to the engine's own
// generic validation error.
const SAFE_ID_RE = /^[A-Za-z0-9_-]+$/;

const READ_ONLY_ROLES = new Set(['reviewer', 'researcher', 'advisor']);

// Fields the CLI's own global trusted --executor/--model/--tier flags own
// exclusively (R1). A request file that declares any of these at the TOP
// LEVEL is not "an unknown field" -- it is a genuine authority conflict
// between two trusted-but-distinct channels (R2's own "CLI/file conflicts"
// reject reason), so it gets its own distinct message.
const CLI_OWNED_TOP_LEVEL_FIELDS = new Set(['executor', 'model', 'tier']);

// Recursive deep-scan denylist (R2 "Work lifecycle authority"): per
// ADR-001/Work Integration, no field anywhere in a coordination request may
// carry Work status/stage/accept/approve/claim/return/merge authority. This
// list is deliberately over-inclusive substrings-as-exact-keys, mirroring
// coordination-static.test.mjs's own "deliberately over-inclusive" posture
// for its import-substring denylist.
const WORK_LIFECYCLE_KEYS = new Set([
  'workStatus', 'workStage', 'workAction', 'workMutation', 'workTransition',
  'approve', 'merge', 'claim', 'accept', 'moveWork', 'workMove',
  'missionId', // ADR-008 Decision 5, reaffirmed at this boundary too
]);

function fail(reason) {
  throw new StoreError('validation', `coordination request: ${reason}`);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function assertSafeId(value, label) {
  if (!isNonEmptyString(value)) fail(`${label} must be a non-empty string`);
  if (!SAFE_ID_RE.test(value)) {
    fail(`${label} "${value}" contains characters outside the safe filesystem charset (letters, digits, underscore, hyphen only) -- path escape rejected`);
  }
}

// Allows a literal safe id OR a "$ref:<label>" / "$ref:<label>.<actorId>"
// placeholder (resolved later by run.mjs against this run's own dispatched
// assignment ids -- never a caller-guessable real assignment id ahead of
// dispatch time). Only the reference SHAPE is validated here; resolution
// happens in run.mjs, which is the only place that knows what has actually
// been dispatched so far.
function assertSafeRefOrId(value, label) {
  if (!isNonEmptyString(value)) fail(`${label} must be a non-empty string`);
  if (value.startsWith('$ref:')) {
    const body = value.slice('$ref:'.length);
    const [refLabel, refActor] = body.split('.');
    assertSafeId(refLabel, `${label} ($ref label)`);
    if (refActor !== undefined) assertSafeId(refActor, `${label} ($ref actor id)`);
    if (body.split('.').length > 2) fail(`${label} "${value}" is not a valid $ref (expected $ref:<label> or $ref:<label>.<actorId>)`);
    return;
  }
  assertSafeId(value, label);
}

function assertAllowedKeys(obj, allowed, label) {
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) {
      fail(`unknown field "${key}" in ${label} (allowed: ${[...allowed].join(', ')})`);
    }
  }
}

// R2 "Work lifecycle authority": recursive scan over the WHOLE raw request
// object (before any field-by-field allowlisting narrows it), so a
// Work-lifecycle-shaped key smuggled at ANY nesting depth is caught, not
// just at depths this module otherwise inspects field-by-field.
function assertNoWorkLifecycleKeys(value, pathLabel = 'request') {
  if (Array.isArray(value)) {
    value.forEach((item, i) => assertNoWorkLifecycleKeys(item, `${pathLabel}[${i}]`));
    return;
  }
  if (!isPlainObject(value)) return;
  for (const [key, nested] of Object.entries(value)) {
    if (WORK_LIFECYCLE_KEYS.has(key)) {
      fail(`field "${key}" at ${pathLabel}.${key} carries Work lifecycle authority -- a coordination request can never move/accept/approve/claim/return/merge Work (ADR-001)`);
    }
    assertNoWorkLifecycleKeys(nested, `${pathLabel}.${key}`);
  }
}

function assertMutationReadOnly(value, pathLabel) {
  if (value === undefined) return;
  if (value !== 'read-only') {
    fail(`field "mutation" at ${pathLabel} must be "read-only" -- the whole standalone-session CLI surface is read-only in V1 (plan.md Locked Product Decisions)`);
  }
}

const ACTOR_ALLOWED_KEYS = new Set(['id', 'persona', 'executor', 'model', 'tier']);

// R2's trust boundary for `actors[]`: a trusted request may bind a declared
// SessionActor to Persona/executor/model/tier POLICY only -- it may never
// carry `role` (that would rewrite Role responsibility, R2's explicit
// "actor-role rewrites" reject), and every id must be distinct
// ("undeclared actor multiplicity"). Which ids are LEGAL (i.e. actually
// declared by the session being opened) is checked by the caller (run.mjs),
// since that depends on which protocol/kind was requested -- this function
// only validates SHAPE.
function validateActorsShape(actors) {
  if (actors === undefined) return [];
  if (!Array.isArray(actors)) fail('"actors" must be an array');
  const seenIds = new Set();
  for (const [i, actor] of actors.entries()) {
    if (!isPlainObject(actor)) fail(`actors[${i}] must be an object`);
    if ('role' in actor) {
      fail(`actors[${i}] declares "role" -- a trusted request may bind Persona/executor/model/tier policy to a declared SessionActor, but it can never redefine Role responsibility (R2, actor-role rewrite rejected)`);
    }
    assertAllowedKeys(actor, ACTOR_ALLOWED_KEYS, `actors[${i}]`);
    assertSafeId(actor.id, `actors[${i}].id`);
    if (seenIds.has(actor.id)) {
      fail(`actors[${i}].id "${actor.id}" is bound more than once -- undeclared actor multiplicity rejected`);
    }
    seenIds.add(actor.id);
    for (const key of ['persona', 'executor', 'model', 'tier']) {
      if (actor[key] !== undefined && !isNonEmptyString(actor[key])) {
        fail(`actors[${i}].${key} must be a non-empty string when present`);
      }
    }
  }
  return actors;
}

const AGGREGATE_BOUNDS_KEYS = new Set(['wallTimeMs', 'maxAssignments', 'maxConcurrency', 'maxRounds', 'maxTaskDepth']);

function validateAggregateBounds(bounds) {
  if (bounds === undefined) return undefined;
  if (!isPlainObject(bounds)) fail('"aggregateBounds" must be an object');
  assertAllowedKeys(bounds, AGGREGATE_BOUNDS_KEYS, '"aggregateBounds"');
  for (const [key, value] of Object.entries(bounds)) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      fail(`aggregateBounds.${key} must be a positive finite number`);
    }
  }
  return bounds;
}

const PARTIAL_POLICY_KEYS = new Set(['minimumActors', 'allowedOmissions']);

function validatePartialPolicy(policy) {
  if (policy === undefined || policy === null) return null;
  if (!isPlainObject(policy)) fail('"partialPolicy" must be an object or null');
  assertAllowedKeys(policy, PARTIAL_POLICY_KEYS, '"partialPolicy"');
  if (policy.minimumActors !== undefined && (!Number.isInteger(policy.minimumActors) || policy.minimumActors < 0)) {
    fail('partialPolicy.minimumActors must be a non-negative integer');
  }
  if (policy.allowedOmissions !== undefined) {
    if (!Array.isArray(policy.allowedOmissions) || policy.allowedOmissions.some((v) => !isNonEmptyString(v))) {
      fail('partialPolicy.allowedOmissions must be an array of non-empty strings');
    }
  }
  return policy;
}

function validateStringArray(value, label, { required = false } = {}) {
  if (value === undefined) {
    if (required) fail(`${label} is required`);
    return [];
  }
  if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) {
    fail(`${label} must be an array of strings`);
  }
  return value;
}

const TASK_ALLOWED_KEYS = new Set(['taskKey', 'contextRefs', 'constraints', 'expectedOutputs', 'evidenceRequired', 'capabilities', 'mutation']);

function validateTask(task) {
  if (!isPlainObject(task)) fail('"task" is required and must be an object when kind is "agent-led"');
  assertAllowedKeys(task, TASK_ALLOWED_KEYS, '"task"');
  assertMutationReadOnly(task.mutation, 'task.mutation');
  if (task.taskKey !== undefined) assertSafeId(task.taskKey, 'task.taskKey');
  const contextRefs = validateStringArray(task.contextRefs, 'task.contextRefs');
  contextRefs.forEach((ref, i) => assertSafeRefOrId(ref, `task.contextRefs[${i}]`));
  const constraints = validateStringArray(task.constraints, 'task.constraints');
  const expectedOutputs = validateStringArray(task.expectedOutputs, 'task.expectedOutputs', { required: true });
  if (expectedOutputs.length === 0) fail('task.expectedOutputs must be a non-empty array');
  if (task.evidenceRequired !== 'reported' && task.evidenceRequired !== 'verified') {
    fail('task.evidenceRequired must be "reported" or "verified"');
  }
  const capabilities = task.capabilities !== undefined ? validateStringArray(task.capabilities, 'task.capabilities') : undefined;
  return {
    taskKey: task.taskKey,
    contextRefs,
    constraints,
    expectedOutputs,
    evidenceRequired: task.evidenceRequired,
    capabilities,
  };
}

const PROTOCOL_REF_ALLOWED_KEYS = new Set(['id']);

function validateProtocolRef(protocolRef) {
  if (!isPlainObject(protocolRef)) fail('"protocolRef" is required and must be an object when kind is "declared-protocol"');
  // R2 "portable concrete infra": protocolRef must stay a pure REFERENCE
  // (an id string the engine resolves live through loadCoordinationProtocol)
  // -- any other key would mean the request is trying to carry inline
  // protocol topology/operationMap/actors content instead of just pointing
  // at an already-registered, already-reviewed FlowDefinition.
  assertAllowedKeys(protocolRef, PROTOCOL_REF_ALLOWED_KEYS, '"protocolRef" (a request may only reference a protocol by id -- inline protocol topology/operationMap/actors content is portable concrete infra, rejected)');
  if (!isNonEmptyString(protocolRef.id)) fail('"protocolRef.id" must be a non-empty string');
  // Charset check after normalizing "." separators, which
  // loadCoordinationProtocol's own real ids legitimately use
  // (e.g. "core.coordination-protocol.group-cognition-framework").
  assertSafeId(protocolRef.id.replace(/\./g, '-'), '"protocolRef.id"');
  return { id: protocolRef.id };
}

const OPERATION_STEP_ALLOWED_KEYS = new Set([
  'type', 'as', 'operationId', 'targetActorId', 'objective', 'expectedOutputs',
  'contextRefs', 'constraints', 'capabilities', 'fromAssignmentId', 'intent', 'round', 'taskKey', 'mutation',
]);

function validateOperationStep(step, i) {
  assertAllowedKeys(step, OPERATION_STEP_ALLOWED_KEYS, `steps[${i}] (type "operation")`);
  assertMutationReadOnly(step.mutation, `steps[${i}].mutation`);
  if (!isNonEmptyString(step.operationId)) fail(`steps[${i}].operationId is required`);
  if (step.targetActorId !== undefined) assertSafeId(step.targetActorId, `steps[${i}].targetActorId`);
  if (!isNonEmptyString(step.objective)) fail(`steps[${i}].objective is required`);
  const expectedOutputs = validateStringArray(step.expectedOutputs, `steps[${i}].expectedOutputs`, { required: true });
  if (expectedOutputs.length === 0) fail(`steps[${i}].expectedOutputs must be a non-empty array`);
  const contextRefs = validateStringArray(step.contextRefs, `steps[${i}].contextRefs`);
  contextRefs.forEach((ref, j) => assertSafeRefOrId(ref, `steps[${i}].contextRefs[${j}]`));
  const constraints = validateStringArray(step.constraints, `steps[${i}].constraints`);
  const capabilities = step.capabilities !== undefined ? validateStringArray(step.capabilities, `steps[${i}].capabilities`) : undefined;
  if (step.fromAssignmentId !== undefined) assertSafeRefOrId(step.fromAssignmentId, `steps[${i}].fromAssignmentId`);
  if (step.intent !== undefined && !isNonEmptyString(step.intent)) fail(`steps[${i}].intent must be a non-empty string when present`);
  if (step.round !== undefined && (!Number.isInteger(step.round) || step.round < 1)) fail(`steps[${i}].round must be a positive integer when present`);
  if (step.taskKey !== undefined) assertSafeId(step.taskKey, `steps[${i}].taskKey`);
  return {
    type: 'operation',
    as: step.as,
    operationId: step.operationId,
    targetActorId: step.targetActorId,
    objective: step.objective,
    expectedOutputs,
    contextRefs,
    constraints,
    capabilities,
    fromAssignmentId: step.fromAssignmentId,
    intent: step.intent,
    round: step.round,
    taskKey: step.taskKey,
  };
}

const FAN_OUT_BRANCH_ALLOWED_KEYS = new Set(['actorId', 'objective', 'expectedOutputs', 'constraints', 'capabilities', 'fromAssignmentId', 'intent', 'taskKey', 'mutation']);

function validateFanOutBranch(branch, i, j) {
  if (!isPlainObject(branch)) fail(`steps[${i}].branches[${j}] must be an object`);
  assertAllowedKeys(branch, FAN_OUT_BRANCH_ALLOWED_KEYS, `steps[${i}].branches[${j}]`);
  assertMutationReadOnly(branch.mutation, `steps[${i}].branches[${j}].mutation`);
  assertSafeId(branch.actorId, `steps[${i}].branches[${j}].actorId`);
  if (!isNonEmptyString(branch.objective)) fail(`steps[${i}].branches[${j}].objective is required`);
  const expectedOutputs = validateStringArray(branch.expectedOutputs, `steps[${i}].branches[${j}].expectedOutputs`, { required: true });
  if (expectedOutputs.length === 0) fail(`steps[${i}].branches[${j}].expectedOutputs must be a non-empty array`);
  const constraints = validateStringArray(branch.constraints, `steps[${i}].branches[${j}].constraints`);
  const capabilities = branch.capabilities !== undefined ? validateStringArray(branch.capabilities, `steps[${i}].branches[${j}].capabilities`) : undefined;
  if (branch.fromAssignmentId !== undefined) assertSafeRefOrId(branch.fromAssignmentId, `steps[${i}].branches[${j}].fromAssignmentId`);
  if (branch.intent !== undefined && !isNonEmptyString(branch.intent)) fail(`steps[${i}].branches[${j}].intent must be a non-empty string when present`);
  if (branch.taskKey !== undefined) assertSafeId(branch.taskKey, `steps[${i}].branches[${j}].taskKey`);
  return {
    actorId: branch.actorId,
    objective: branch.objective,
    expectedOutputs,
    constraints,
    capabilities,
    fromAssignmentId: branch.fromAssignmentId,
    intent: branch.intent,
    taskKey: branch.taskKey,
  };
}

const FAN_OUT_STEP_ALLOWED_KEYS = new Set(['type', 'as', 'operationId', 'branches', 'fromAssignmentId', 'mutation']);

function validateFanOutStep(step, i) {
  assertAllowedKeys(step, FAN_OUT_STEP_ALLOWED_KEYS, `steps[${i}] (type "fan-out")`);
  assertMutationReadOnly(step.mutation, `steps[${i}].mutation`);
  if (!isNonEmptyString(step.operationId)) fail(`steps[${i}].operationId is required`);
  if (!Array.isArray(step.branches) || step.branches.length === 0) fail(`steps[${i}].branches must be a non-empty array`);
  const branches = step.branches.map((branch, j) => validateFanOutBranch(branch, i, j));
  const seenActors = new Set();
  for (const branch of branches) {
    if (seenActors.has(branch.actorId)) fail(`steps[${i}].branches names actorId "${branch.actorId}" more than once -- undeclared actor multiplicity rejected`);
    seenActors.add(branch.actorId);
  }
  if (step.fromAssignmentId !== undefined) assertSafeRefOrId(step.fromAssignmentId, `steps[${i}].fromAssignmentId`);
  return { type: 'fan-out', as: step.as, operationId: step.operationId, branches, fromAssignmentId: step.fromAssignmentId };
}

function validateSteps(steps) {
  if (!Array.isArray(steps) || steps.length === 0) fail('"steps" is required and must be a non-empty array when kind is "declared-protocol"');
  const seenLabels = new Set();
  return steps.map((step, i) => {
    if (!isPlainObject(step)) fail(`steps[${i}] must be an object`);
    assertSafeId(step.as, `steps[${i}].as`);
    if (seenLabels.has(step.as)) fail(`steps[${i}].as "${step.as}" is reused -- every step label must be unique`);
    seenLabels.add(step.as);
    if (step.type === 'operation') return validateOperationStep(step, i);
    if (step.type === 'fan-out') return validateFanOutStep(step, i);
    fail(`steps[${i}].type must be "operation" or "fan-out"`);
    return undefined; // unreachable, keeps linters happy
  });
}

const TOP_LEVEL_ALLOWED_KEYS = new Set([
  'kind', 'objective', 'writerId', 'coordinationId', 'workRef',
  'aggregateBounds', 'partialPolicy', 'primaryRole', 'task', 'protocolRef', 'steps', 'actors',
]);

const OBJECTIVE_MAX_LENGTH = 20000;

/**
 * Validate + normalize a raw parsed-JSON coordination request object,
 * enforcing every R2 reject category. Throws `StoreError('validation', ...)`
 * (exit code 4, per src/state/store.mjs's EXIT_CODES) on the first violation.
 * Never mutates `raw`; returns a fresh, narrowed object carrying only
 * recognized fields.
 *
 * `cliFlags` ({executor?, model?, tier?}) is passed in ONLY so this
 * function can detect a genuine "CLI/file conflict" (R2): a top-level
 * executor/model/tier key in the FILE is always rejected regardless of the
 * CLI flags (that authority is CLI-only, R1), but the specific message
 * differs when a CLI flag was also actually supplied, naming the conflict
 * explicitly rather than reporting a generic unknown-field error.
 */
export function validateCoordinationRequest(raw, cliFlags = {}) {
  if (!isPlainObject(raw)) fail('request must be a JSON object');

  assertNoWorkLifecycleKeys(raw);

  for (const field of CLI_OWNED_TOP_LEVEL_FIELDS) {
    if (field in raw) {
      const cliValue = cliFlags[field];
      fail(
        cliValue !== undefined
          ? `top-level "${field}" conflicts with the CLI's own --${field} flag (value "${cliValue}") -- global trusted executor/model/tier policy is CLI-only (R1); declare a per-actor override under "actors" instead`
          : `top-level "${field}" is reserved for the CLI's own --${field} flag -- global trusted executor/model/tier policy is CLI-only (R1), never a portable request-file field; declare a per-actor override under "actors" instead`,
      );
    }
  }

  assertAllowedKeys(raw, TOP_LEVEL_ALLOWED_KEYS, 'request');

  if (raw.kind !== 'agent-led' && raw.kind !== 'declared-protocol') {
    fail('"kind" must be "agent-led" or "declared-protocol"');
  }
  if (!isNonEmptyString(raw.objective) || raw.objective.length > OBJECTIVE_MAX_LENGTH) {
    fail(`"objective" must be a non-empty string of at most ${OBJECTIVE_MAX_LENGTH} characters`);
  }
  if (!isNonEmptyString(raw.writerId)) {
    fail('"writerId" is required -- the trusted operator identity opening this session (the request file is operator-authored, so this is trusted data, not portable protocol content)');
  }
  if (raw.coordinationId !== undefined) assertSafeId(raw.coordinationId, '"coordinationId"');
  if (raw.workRef !== undefined && raw.workRef !== null && !isNonEmptyString(raw.workRef)) {
    fail('"workRef" must be a non-empty string or null when present');
  }

  const aggregateBounds = validateAggregateBounds(raw.aggregateBounds);
  const partialPolicy = validatePartialPolicy(raw.partialPolicy);
  const actors = validateActorsShape(raw.actors);

  const normalized = {
    kind: raw.kind,
    objective: raw.objective,
    writerId: raw.writerId,
    coordinationId: raw.coordinationId,
    workRef: raw.workRef ?? null,
    aggregateBounds,
    partialPolicy,
    actors,
  };

  if (raw.kind === 'agent-led') {
    if ('protocolRef' in raw) fail('"protocolRef" is not allowed when kind is "agent-led"');
    if ('steps' in raw) fail('"steps" is not allowed when kind is "agent-led"');
    if (!isNonEmptyString(raw.primaryRole) || !READ_ONLY_ROLES.has(raw.primaryRole)) {
      fail(`"primaryRole" is required and must be one of ${[...READ_ONLY_ROLES].join(', ')} when kind is "agent-led"`);
    }
    for (const actor of actors) {
      if (actor.id !== 'primary') {
        fail(`actors[].id "${actor.id}" is not a registered actor for an agent-led session -- only "primary" is declared before dispatch (unregistered actor override rejected)`);
      }
    }
    normalized.primaryRole = raw.primaryRole;
    normalized.task = validateTask(raw.task);
  } else {
    if ('primaryRole' in raw) fail('"primaryRole" is not allowed when kind is "declared-protocol"');
    if ('task' in raw) fail('"task" is not allowed when kind is "declared-protocol"');
    normalized.protocolRef = validateProtocolRef(raw.protocolRef);
    normalized.steps = validateSteps(raw.steps);
    // NOTE: actors[].id membership against the protocol's OWN declared
    // spec.actors is validated by run.mjs (this module has no access to
    // the loaded FlowDefinition) -- see run.mjs's own
    // assertActorsRegisteredForProtocol.
  }

  return normalized;
}

export { SAFE_ID_RE, READ_ONLY_ROLES };
