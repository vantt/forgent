// coordination/schema.mjs — pure validator for the CoordinationSession
// manifest (`session.json`) and event log (`events.jsonl`) shape, per
// docs/architect/agent-coordination/contracts/coordination-session.md
// (ADR-008).
//
// Pure data module: no fs, no store writes, no network — mirrors
// dispatch/execution-contract.mjs's own "pure validator" shape one layer
// up (session, not Assignment). Fails closed (throws CoordinationError) on
// anything outside the contract's exact field table.

export const SCHEMA_VERSION = '1';

export const STATUS_VALUES = new Set(['active', 'completed', 'partial', 'failed', 'cancelled']);

// Contract's manifest field table, verbatim. Any OTHER top-level key
// (missionId included) is rejected below by whitelist, not by naming it
// individually -- closes the whole class of stray/dead field, not just the
// one named example.
const MANIFEST_FIELDS = new Set([
  'schemaVersion',
  'coordinationId',
  'objective',
  'status',
  'createdAt',
  'provenanceRoot',
  'definitionRef',
  'workRef',
  'actors',
  'aggregateBounds',
  'assignmentRefs',
  'completedAt',
  'partialPolicy',
]);

const PROVENANCE_ROOT_FIELDS = new Set(['writerId', 'parentAssignmentId']);
const ACTOR_FIELDS = new Set(['id', 'role', 'persona', 'policy']);
const DEFINITION_REF_FIELDS = new Set(['id', 'version']);

// R1 (Phase 06): "An explicit partial policy names minimum actors/results
// and allowed omissions before execution." Persisted on the manifest so the
// policy exists BEFORE any Assignment is dispatched (never conjured at
// closure time) -- immutable once the session is opened, like every other
// manifest field store.mjs's mutators never rewrite.
const PARTIAL_POLICY_FIELDS = new Set(['minimumActors', 'allowedOmissions']);

// ADR-008 Decision 5: no V1 schema carries `missionId`, mandatory or
// optional, at any nesting level. `sessionId`/`threadId`/`coordinationRef`
// have no legitimate use anywhere in a CoordinationSession manifest or
// event payload either (the manifest's own id field is `coordinationId`,
// checked separately by the whitelist above) -- deep-scanned across the
// whole object tree, not just the top level, so a value smuggled inside
// e.g. `provenanceRoot` or an `actors[]` entry is caught too.
const FORBIDDEN_FIELD_NAMES = new Set(['missionId', 'sessionId', 'threadId', 'coordinationRef']);

// Assignment stays session-blind (ADR-008 Decision 2, reaffirming ADR-006
// §6's FORBIDDEN_SESSION_FIELDS, execution-contract.mjs:48). This is the
// coordination-side mirror of that same gate: `coordinationId` is legal
// only ON THE MANIFEST, never on a persisted Assignment record.
const FORBIDDEN_ON_ASSIGNMENT = new Set(['sessionId', 'coordinationId', 'threadId', 'coordinationRef']);

// "the foundation's configured ceiling" (contract: "Any bound omitted at
// open time defaults to the foundation's configured ceiling; it is never
// unbounded by omission"). These are that ceiling -- generous enough for a
// real bounded agent-led session, never infinite.
export const DEFAULT_AGGREGATE_BOUNDS = Object.freeze({
  wallTimeMs: 3600000, // 1 hour
  maxAssignments: 20,
  maxConcurrency: 4,
  maxRounds: 10,
  maxTaskDepth: 3,
});

const AGGREGATE_BOUND_FIELDS = new Set(Object.keys(DEFAULT_AGGREGATE_BOUNDS));

/**
 * Error raised by this module and by store.mjs/replay.mjs. `category` is a
 * stable, caller-inspectable reason (mirrors state/events.mjs's
 * EventLogError shape): 'validation' (bad input), 'not-found', or a
 * replay-specific corruption category ('corrupt-log' bubbled from
 * state/events.mjs unchanged, 'duplicate-ref', 'dangling-ref',
 * 'foreign-ref', 'out-of-order-ref', 'schema-version-mismatch').
 */
export class CoordinationError extends Error {
  constructor(category, message) {
    super(message);
    this.name = 'CoordinationError';
    this.category = category;
  }
}

function fail(category, reason) {
  throw new CoordinationError(category, `coordination: ${reason}`);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isIsoTimestamp(value) {
  return typeof value === 'string' && value !== '' && !Number.isNaN(Date.parse(value));
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function assertOnlyAcceptedFields(obj, accepted, label) {
  for (const key of Object.keys(obj)) {
    if (!accepted.has(key)) fail('validation', `${label} has unknown field "${key}"`);
  }
}

/**
 * Recursively scan `value` (plain objects and arrays only -- strings,
 * numbers, booleans, null are leaves) for any object key in `forbidden`,
 * at any nesting depth. Used for the ADR-008 Decision 5 "at any nesting
 * level" requirement, and reused identically for event payloads.
 */
export function assertNoForbiddenFieldsDeep(value, forbidden, label, seen = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) assertNoForbiddenFieldsDeep(item, forbidden, label, seen);
    return;
  }
  if (!isPlainObject(value)) return;
  if (seen.has(value)) return; // defensive: never loop forever on a cyclic input
  seen.add(value);
  for (const key of Object.keys(value)) {
    if (forbidden.has(key)) {
      fail('validation', `${label} carries a forbidden field "${key}" -- rejected at validation (ADR-008 Decision 5 / coordination-session.md "Forbidden fields")`);
    }
    assertNoForbiddenFieldsDeep(value[key], forbidden, label, seen);
  }
}

function validateProvenanceRoot(provenanceRoot, label) {
  if (!isPlainObject(provenanceRoot)) fail('validation', `${label} must be a non-null object`);
  assertOnlyAcceptedFields(provenanceRoot, PROVENANCE_ROOT_FIELDS, label);
  if (!isNonEmptyString(provenanceRoot.writerId)) fail('validation', `${label}.writerId must be a non-empty string`);
  if (provenanceRoot.parentAssignmentId !== undefined && !isNonEmptyString(provenanceRoot.parentAssignmentId)) {
    fail('validation', `${label}.parentAssignmentId must be a non-empty string when provided`);
  }
}

function validatePartialPolicy(policy, label) {
  if (!isPlainObject(policy)) fail('validation', `${label} must be an object when provided`);
  assertOnlyAcceptedFields(policy, PARTIAL_POLICY_FIELDS, label);
  if (policy.minimumActors === undefined && policy.allowedOmissions === undefined) {
    fail('validation', `${label} must declare at least one of minimumActors/allowedOmissions`);
  }
  if (policy.minimumActors !== undefined && !isPositiveInteger(policy.minimumActors)) {
    fail('validation', `${label}.minimumActors must be a positive integer`);
  }
  if (policy.allowedOmissions !== undefined) {
    if (!Array.isArray(policy.allowedOmissions) || policy.allowedOmissions.length === 0 || !policy.allowedOmissions.every(isNonEmptyString)) {
      fail('validation', `${label}.allowedOmissions must be a non-empty array of non-empty strings when provided`);
    }
  }
}

function validateActor(actor, index) {
  const label = `actors[${index}]`;
  if (!isPlainObject(actor)) fail('validation', `${label} must be a non-null object`);
  assertOnlyAcceptedFields(actor, ACTOR_FIELDS, label);
  if (!isNonEmptyString(actor.id)) fail('validation', `${label}.id must be a non-empty string`);
  if (!isNonEmptyString(actor.role)) fail('validation', `${label}.role must be a non-empty string`);
  if (actor.persona !== undefined && !isNonEmptyString(actor.persona)) fail('validation', `${label}.persona must be a non-empty string when provided`);
  if (actor.policy !== undefined && !isPlainObject(actor.policy)) fail('validation', `${label}.policy must be an object when provided`);
}

/**
 * Merge caller-supplied aggregate bounds with `DEFAULT_AGGREGATE_BOUNDS`
 * for every omitted field -- "never unbounded by omission" (contract).
 * Throws on an unknown field or a non-positive-integer value for any of
 * the 5 required bound fields.
 */
export function applyAggregateBoundDefaults(bounds) {
  const input = bounds === undefined ? {} : bounds;
  if (!isPlainObject(input)) fail('validation', 'aggregateBounds must be an object when provided');
  assertOnlyAcceptedFields(input, AGGREGATE_BOUND_FIELDS, 'aggregateBounds');
  const resolved = {};
  for (const key of AGGREGATE_BOUND_FIELDS) {
    resolved[key] = input[key] !== undefined ? input[key] : DEFAULT_AGGREGATE_BOUNDS[key];
    if (!isPositiveInteger(resolved[key])) fail('validation', `aggregateBounds.${key} must be a positive integer`);
  }
  return Object.freeze(resolved);
}

/**
 * Validate a full manifest object against the contract's field table.
 * Throws `CoordinationError('validation', ...)` on the first violation.
 * Pure -- never reads schemaVersion against the running contract version
 * (that recovery-time check belongs to replay.mjs, which has the "is this
 * an old manifest on disk" context this function does not).
 */
export function validateManifest(manifest) {
  if (!isPlainObject(manifest)) fail('validation', 'manifest must be a non-null object');
  assertOnlyAcceptedFields(manifest, MANIFEST_FIELDS, 'manifest');
  assertNoForbiddenFieldsDeep(manifest, FORBIDDEN_FIELD_NAMES, 'manifest');

  if (!isNonEmptyString(manifest.schemaVersion)) fail('validation', 'manifest.schemaVersion must be a non-empty string');
  if (!isNonEmptyString(manifest.coordinationId)) fail('validation', 'manifest.coordinationId must be a non-empty string');
  if (!isNonEmptyString(manifest.objective)) fail('validation', 'manifest.objective must be a non-empty string');
  if (!STATUS_VALUES.has(manifest.status)) fail('validation', `manifest.status must be one of ${[...STATUS_VALUES].join(' | ')}`);
  if (!isIsoTimestamp(manifest.createdAt)) fail('validation', 'manifest.createdAt must be an ISO 8601 timestamp string');

  validateProvenanceRoot(manifest.provenanceRoot, 'manifest.provenanceRoot');

  if (manifest.definitionRef !== undefined && manifest.definitionRef !== null) {
    const ref = manifest.definitionRef;
    if (!isPlainObject(ref)) fail('validation', 'manifest.definitionRef must be an object or null');
    assertOnlyAcceptedFields(ref, DEFINITION_REF_FIELDS, 'manifest.definitionRef');
    if (!isNonEmptyString(ref.id)) fail('validation', 'manifest.definitionRef.id must be a non-empty string');
    if (!isNonEmptyString(ref.version)) fail('validation', 'manifest.definitionRef.version must be a non-empty string');
  }

  if (manifest.workRef !== undefined && manifest.workRef !== null && !isNonEmptyString(manifest.workRef)) {
    fail('validation', 'manifest.workRef must be a non-empty string or null');
  }

  if (manifest.actors !== undefined) {
    if (!Array.isArray(manifest.actors)) fail('validation', 'manifest.actors must be an array when provided');
    const seenIds = new Set();
    manifest.actors.forEach((actor, index) => {
      validateActor(actor, index);
      if (seenIds.has(actor.id)) fail('validation', `manifest.actors carries duplicate actor id "${actor.id}"`);
      seenIds.add(actor.id);
    });
  }

  if (!isPlainObject(manifest.aggregateBounds)) fail('validation', 'manifest.aggregateBounds must be an object');
  assertOnlyAcceptedFields(manifest.aggregateBounds, AGGREGATE_BOUND_FIELDS, 'manifest.aggregateBounds');
  for (const key of AGGREGATE_BOUND_FIELDS) {
    if (!isPositiveInteger(manifest.aggregateBounds[key])) fail('validation', `manifest.aggregateBounds.${key} must be a positive integer`);
  }

  if (!Array.isArray(manifest.assignmentRefs)) fail('validation', 'manifest.assignmentRefs must be an array');
  const seenRefs = new Set();
  for (const ref of manifest.assignmentRefs) {
    if (!isNonEmptyString(ref)) fail('validation', 'manifest.assignmentRefs entries must be non-empty strings');
    if (seenRefs.has(ref)) fail('validation', `manifest.assignmentRefs carries duplicate entry "${ref}"`);
    seenRefs.add(ref);
  }

  if (manifest.completedAt !== undefined && manifest.completedAt !== null && !isIsoTimestamp(manifest.completedAt)) {
    fail('validation', 'manifest.completedAt must be an ISO 8601 timestamp string or null');
  }
  if (manifest.status === 'active' && manifest.completedAt) {
    fail('validation', 'manifest.completedAt must be null while status is "active"');
  }
  if (manifest.status !== 'active' && !manifest.completedAt) {
    fail('validation', `manifest.completedAt must be set once status leaves "active" (status: "${manifest.status}")`);
  }

  if (manifest.partialPolicy !== undefined && manifest.partialPolicy !== null) {
    validatePartialPolicy(manifest.partialPolicy, 'manifest.partialPolicy');
  }
}

// Event Log table (coordination-session.md), required/accepted payload
// fields per kind. `ts` is excluded on purpose -- state/events.mjs stamps
// it on every event automatically (appendEventCore), so it is never a
// payload field here.
const EVENT_SPECS = {
  'session-opened': { required: ['coordinationId', 'provenanceRoot'], accepted: ['coordinationId', 'provenanceRoot'] },
  'actor-bound': { required: ['actorId', 'role'], accepted: ['actorId', 'role', 'persona', 'policy'] },
  // `operationId`/`nodeId`/`authorizationId`/`invocationKey`/`contextGrant`
  // are ADDITIVE driver-authorization provenance, present only on a
  // dispatch that a driver actually authorized ("so replay can explain why
  // the worker ran and which grant made its context legal"). Every existing
  // agent-led dispatch (`dispatchPrimaryTask`/`proposeConsult`) and every
  // `activation.mode: required` declared dispatch keeps emitting exactly
  // `{assignmentId, actorId?}` -- these fields are accepted, never required.
  'assignment-created': {
    required: ['assignmentId'],
    accepted: ['assignmentId', 'actorId', 'operationId', 'nodeId', 'authorizationId', 'invocationKey', 'contextGrant'],
  },
  // A driver authorizes ONE `activation.mode: driver-authorized` node-
  // operation binding for dispatch. The binding is identified by the full
  // (nodeId, operationId, targetActorId) triple -- one actor is routinely
  // bound to several different operations at several different graph nodes,
  // so no single one of the three identifies a binding on its own.
  'operation-authorized': {
    required: ['authorizationId', 'operationId', 'nodeId', 'targetActorId', 'invocationKey', 'authorizedBy', 'reason', 'grantedContextRefs'],
    accepted: [
      'authorizationId',
      'operationId',
      'nodeId',
      'targetActorId',
      'invocationKey',
      'authorizedBy',
      'reason',
      'grantedContextRefs',
      'targetArtifactRef',
    ],
  },
  'result-linked': { required: ['assignmentId', 'runId'], accepted: ['assignmentId', 'runId'] },
  // Phase 06 R2: retry creates a new Run for the SAME Assignment. Declared
  // BEFORE dispatch (store.mjs's recordRunRetry appends this first, matching
  // the "record intent before mutating/spawning" discipline every other
  // store.mjs door already uses) so a crash between declaration and dispatch
  // always leaves a durable, resumable trace -- never a silently lost retry.
  'run-retried': { required: ['assignmentId', 'reason'], accepted: ['assignmentId', 'reason', 'previousRunId'] },
  // Phase 06 R2: actor replacement, recorded ONLY through declared retry
  // policy (session-engine.mjs's replaceSessionActor). `allocationProvenance`
  // is an opaque, caller-supplied pass-through record (e.g. a cohort-planner
  // allocation) -- this module has no allocation semantics of its own to
  // invent.
  'actor-replaced': { required: ['oldActorId', 'replacementActorId', 'reason'], accepted: ['oldActorId', 'replacementActorId', 'reason', 'allocationProvenance'] },
  'session-completed': { required: [], accepted: ['replacedActors', 'dissentingActors'] },
  // R1: "Final state lists every missing, failed, replaced, late, and
  // dissenting branch; partial never serializes as consensus." `missingActors`
  // stays the one REQUIRED field (contract-mandated); the rest are optional
  // denormalized summaries -- the authoritative record of WHY/HOW stays the
  // event log itself (`run-retried`/`actor-replaced`), these are just a
  // durable, at-a-glance final-state snapshot on the terminal event.
  'session-partial': { required: ['missingActors'], accepted: ['missingActors', 'failedActors', 'lateActors', 'replacedActors', 'dissentingActors'] },
  'session-failed': { required: ['reason'], accepted: ['reason'] },
  // R4: cancellation "records in-flight outcomes" -- `inFlightAssignmentIds`
  // is a snapshot (assignment-created with no result-linked yet) taken at
  // the moment of cancellation, never mutated afterward.
  'session-cancelled': { required: ['reason'], accepted: ['reason', 'inFlightAssignmentIds'] },
};

export const EVENT_KINDS = Object.freeze(Object.keys(EVENT_SPECS));

// Optional array-of-non-empty-string fields shared by several event kinds
// above (beyond the REQUIRED `missingActors`, already handled inline in
// `validateEventPayload`). Centralized here so a new bucket name is added
// in exactly one place.
const OPTIONAL_STRING_ARRAY_FIELDS = new Set(['failedActors', 'lateActors', 'replacedActors', 'dissentingActors', 'inFlightAssignmentIds']);

// Optional non-empty-string fields shared by more than one event kind, in
// the same "checked regardless of kind, only ever ACCEPTED where the kind's
// own `accepted` list allows it" shape as OPTIONAL_STRING_ARRAY_FIELDS above.
const OPTIONAL_STRING_FIELDS = new Set(['actorId', 'operationId', 'nodeId', 'authorizationId', 'invocationKey', 'targetArtifactRef']);

// The `assignment-created` driver-authorization provenance fields OTHER than
// `authorizationId` itself -- none of them is meaningful, or checkable, on an
// Assignment that names no authorization (see validateEventPayload below).
const DRIVER_PROVENANCE_COMPANION_FIELDS = ['operationId', 'nodeId', 'invocationKey', 'contextGrant'];

const AUTHORIZED_BY_FIELDS = new Set(['type', 'id']);
const CONTEXT_GRANT_FIELDS = new Set(['refs']);

function isStringArray(value) {
  return Array.isArray(value) && value.every(isNonEmptyString);
}

/**
 * `authorizedBy: {type: "driver", id: <driver-identity>}` -- the driver is
 * never a `spec.actors[]` worker, so `type` is a closed single-value enum
 * here rather than an open label. This module is pure (no session on hand),
 * so it enforces only the shape the contract's field table names; tying that
 * `id` to the session's own `provenanceRoot.writerId` is done where the
 * manifest is actually readable, lock-held in `store.mjs`'s
 * `authorizeOperation`.
 */
function validateAuthorizedBy(authorizedBy, label) {
  if (!isPlainObject(authorizedBy)) fail('validation', `${label} must be a non-null object`);
  assertOnlyAcceptedFields(authorizedBy, AUTHORIZED_BY_FIELDS, label);
  if (authorizedBy.type !== 'driver') fail('validation', `${label}.type must be "driver"`);
  if (!isNonEmptyString(authorizedBy.id)) fail('validation', `${label}.id must be a non-empty string`);
}

/**
 * Validate one event's `type` + `payload` against the contract's Event Log
 * table. Throws `CoordinationError('validation', ...)` on an unknown kind,
 * a missing required field, an unlisted field, or a forbidden field found
 * anywhere in the payload.
 */
export function validateEventPayload(type, payload) {
  const spec = EVENT_SPECS[type];
  if (!spec) fail('validation', `unknown event kind "${type}" (expected one of ${EVENT_KINDS.join(', ')})`);

  const body = payload ?? {};
  if (!isPlainObject(body)) fail('validation', `event "${type}" payload must be an object`);
  assertOnlyAcceptedFields(body, new Set(spec.accepted), `event "${type}" payload`);
  assertNoForbiddenFieldsDeep(body, FORBIDDEN_FIELD_NAMES, `event "${type}" payload`);

  for (const field of spec.required) {
    const value = body[field];
    if (field === 'missingActors') {
      if (!Array.isArray(value) || value.length === 0 || !value.every(isNonEmptyString)) {
        fail('validation', `event "${type}" payload.missingActors must be a non-empty array of non-empty strings`);
      }
      continue;
    }
    // `provenanceRoot` is an object, validated below by validateProvenanceRoot
    // -- only checked for presence here, not string-shaped.
    if (field === 'provenanceRoot') {
      if (!isPlainObject(value)) fail('validation', `event "${type}" payload.provenanceRoot must be a non-null object`);
      continue;
    }
    if (field === 'authorizedBy') {
      validateAuthorizedBy(value, `event "${type}" payload.authorizedBy`);
      continue;
    }
    if (field === 'grantedContextRefs') {
      // An EMPTY array is legal and meaningful: the authorization grants no
      // extra refs beyond the Assignment's own always-legal base context.
      if (!isStringArray(value)) {
        fail('validation', `event "${type}" payload.grantedContextRefs must be an array of non-empty strings`);
      }
      continue;
    }
    if (!isNonEmptyString(value)) fail('validation', `event "${type}" payload.${field} must be a non-empty string`);
  }

  // Optional fields shared by more than one event kind, checked regardless
  // of which kind is being validated (each is only ever ACCEPTED on the
  // kinds that declare it above, so this never legalizes a field a given
  // kind's own `accepted` list omits).
  for (const field of OPTIONAL_STRING_ARRAY_FIELDS) {
    if (body[field] === undefined) continue;
    if (!Array.isArray(body[field]) || !body[field].every(isNonEmptyString)) {
      fail('validation', `event "${type}" payload.${field} must be an array of non-empty strings when provided`);
    }
  }
  if (body.previousRunId !== undefined && !isNonEmptyString(body.previousRunId)) {
    fail('validation', `event "${type}" payload.previousRunId must be a non-empty string when provided`);
  }
  if (body.allocationProvenance !== undefined && !isPlainObject(body.allocationProvenance)) {
    fail('validation', `event "${type}" payload.allocationProvenance must be an object when provided`);
  }
  for (const field of OPTIONAL_STRING_FIELDS) {
    if (body[field] === undefined) continue;
    if (!isNonEmptyString(body[field])) {
      fail('validation', `event "${type}" payload.${field} must be a non-empty string when provided`);
    }
  }
  if (body.contextGrant !== undefined) {
    const label = `event "${type}" payload.contextGrant`;
    if (!isPlainObject(body.contextGrant)) fail('validation', `${label} must be an object when provided`);
    assertOnlyAcceptedFields(body.contextGrant, CONTEXT_GRANT_FIELDS, label);
    if (!isStringArray(body.contextGrant.refs)) fail('validation', `${label}.refs must be an array of non-empty strings`);
  }

  if (type === 'assignment-created') {
    // The driver-authorization provenance group travels together.
    // `authorizationId` is the member that makes the rest verifiable -- it
    // is the only one that names an `operation-authorized` event a reader
    // can check the others against. Without it, an Assignment could record
    // a `contextGrant` no driver ever issued and still replay clean, which
    // would make "replay can explain why the worker ran and which grant
    // made its context legal" unenforced rather than merely unenforced-yet.
    const orphaned = DRIVER_PROVENANCE_COMPANION_FIELDS.filter((field) => body[field] !== undefined);
    if (orphaned.length > 0 && body.authorizationId === undefined) {
      fail(
        'validation',
        `event "assignment-created" payload carries driver-authorization provenance (${orphaned.join(', ')}) without "authorizationId" -- these fields travel together or not at all`,
      );
    }
  }
  if (type === 'session-opened') {
    validateProvenanceRoot(body.provenanceRoot, `event "session-opened" payload.provenanceRoot`);
  }
  if (type === 'actor-bound') {
    if (body.persona !== undefined && !isNonEmptyString(body.persona)) fail('validation', 'event "actor-bound" payload.persona must be a non-empty string when provided');
    if (body.policy !== undefined && !isPlainObject(body.policy)) fail('validation', 'event "actor-bound" payload.policy must be an object when provided');
  }
}

/**
 * Recovery Rule #4: "A schema/version mismatch... fails recovery with a
 * named reason; it never silently reinterprets the old shape." Shared by
 * every store.mjs door that reads a manifest off disk before mutating or
 * replaying it -- `replaySession` and all four store mutators
 * (`createSessionAssignment`/`bindActor`/`linkResult`/
 * `transitionSessionStatus`) call this immediately after `readManifestRaw`
 * returns, so none of them can keep acting on a manifest whose persisted
 * `schemaVersion` no longer matches the running contract.
 *
 * @param {object} manifest Already-parsed, shape-validated manifest.
 * @param {string} manifestPath Path it was read from, for the error message.
 */
export function assertSchemaVersionCurrent(manifest, manifestPath) {
  if (manifest.schemaVersion !== SCHEMA_VERSION) {
    throw new CoordinationError(
      'schema-version-mismatch',
      `session.json at ${manifestPath} has schemaVersion "${manifest.schemaVersion}", running contract is "${SCHEMA_VERSION}" -- recovery refuses to reinterpret an old shape`,
    );
  }
}

/**
 * Defense-in-depth mirror of ADR-006 §6's FORBIDDEN_SESSION_FIELDS gate
 * (execution-contract.mjs:48), applied from the coordination side: an
 * Assignment record read back off disk via a session's `assignmentRefs`
 * must never carry a session/coordination field (ADR-008 Decision 2 --
 * Assignment stays session-blind). `execution-contract.mjs` already
 * refuses to BUILD such an Assignment; this only confirms nothing external
 * (a hand-tampered or foreign-tool-written assignment.json) has done so
 * for a record this session is about to treat as its own member.
 */
export function assertAssignmentIsSessionBlind(assignmentObj, assignmentId) {
  if (!isPlainObject(assignmentObj)) return;
  for (const key of Object.keys(assignmentObj)) {
    if (FORBIDDEN_ON_ASSIGNMENT.has(key)) {
      fail(
        'validation',
        `Assignment "${assignmentId}" carries a forbidden session/coordination field "${key}" -- Assignment must stay session-blind (ADR-008 Decision 2)`,
      );
    }
  }
}
