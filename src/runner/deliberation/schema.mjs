// deliberation/schema.mjs — MVP8 (Step 09) contribution model and typed
// lineage validator, per plans/260903-2334-step09-mvp6-to-mvp9/
// phase-08-mvp8-deliberation-memory.md's Candidate Contract and this cell's
// (P08.1) own scope: "persist typed reasoning lineage across rounds without
// creating a general message/thread/mailbox subsystem."
//
// Self-contained, matching team-cognition/schema.mjs's own precedent one
// concern over: this module imports nothing from src/runner/coordination/
// (session-engine, store, replay, headless-adapter, cohort-planner, or its
// schema.mjs) and nothing from src/runner/team-cognition/, so the
// deliberation boundary never inherits session-runtime or aggregation
// authority by accident (component-authority-boundary-map.md §6, Team
// Cognition Engine's own "Must not own" row applies here too: this module
// must never own CoordinationSession terminal transitions, context-grant
// authority, Assignment dispatch, or RunResult confidence upgrades).
//
// Pure data module: no fs, no network, no session/store access, no dispatch.
// It validates the SHAPE and LINEAGE of one contribution against a
// caller-supplied context (declared operations, already-known contributions
// in the same session, and optionally the known Assignments those
// contributions claim provenance from) — it never resolves that context
// itself. Session append/replay/visibility-window enforcement is P08.2's
// concern, not this module's.
//
// Explicitly OUT of scope (plan.md Non-Negotiable Deferrals, restated by
// this cell's own dispatch contract): no `recipient`, `delivery`, `unread`,
// mutable `status`, or arbitrary free-form `body` field. A contribution is
// an immutable, artifact-backed lineage link — never an inbox message.

export class DeliberationError extends Error {
  constructor(category, message) {
    super(message);
    this.name = 'DeliberationError';
    this.category = category;
  }
}

function fail(category, reason) {
  throw new DeliberationError(category, `deliberation: ${reason}`);
}

export function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isNonEmptyStringArray(value) {
  return Array.isArray(value) && value.every(isNonEmptyString);
}

function assertOnlyAcceptedFields(obj, accepted, label) {
  for (const key of Object.keys(obj)) {
    if (!accepted.has(key)) fail('validation', `${label} has unknown field "${key}"`);
  }
}

// Closed MVP8 contribution-type enum (phase-08-mvp8-deliberation-memory.md
// Candidate Contract). Closed by design — a fixed module-level list, not
// data the caller can extend — so a caller's `declaredOperations` can only
// ever narrow which of these types one operation accepts, never legalize a
// type this module doesn't itself recognize.
export const CONTRIBUTION_TYPES = Object.freeze([
  'proposal',
  'objection',
  'response',
  'clarification',
  'rank',
  'specialist-request',
]);

const CONTRIBUTION_TYPE_SET = new Set(CONTRIBUTION_TYPES);

/**
 * Validate a contribution `type` value against the closed MVP8 enum.
 * Throws `DeliberationError` ('undeclared-type') for any value outside the
 * six declared types, including a well-typed but unrecognized string.
 */
export function validateContributionType(type) {
  if (!isNonEmptyString(type)) fail('validation', 'type must be a non-empty string');
  if (!CONTRIBUTION_TYPE_SET.has(type)) {
    fail(
      'undeclared-type',
      `"${type}" is not one of the closed MVP8 contribution types (${CONTRIBUTION_TYPES.join(' | ')})`,
    );
  }
}

function escapeRegExpLiteral(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * A `runId` that does not have the shape `run_<assignmentId>_<digits>` is not
 * a Run of the Assignment it claims. Mirrors coordination/store.mjs's own
 * `assertValidRunIdForAssignment` -- full shape, never a prefix-only check,
 * since a prefix check accepts a same-prefix malicious suffix
 * (`run_<assignmentId>_../../../../tmp/evil`). This module joins no paths, but
 * it hands the ref onward to callers that do.
 */
function assertRunIdBelongsToAssignment(assignmentId, runId) {
  const pattern = new RegExp(`^run_${escapeRegExpLiteral(assignmentId)}_\\d+$`);
  if (!pattern.test(runId)) {
    fail(
      'foreign-provenance',
      `contribution.runId "${runId}" does not match the expected shape for assignment "${assignmentId}" (expected "run_${assignmentId}_<digits>")`,
    );
  }
}

// One `deliberation-contribution-linked` record's shape (Candidate
// Contract: "contribution type, Assignment/Run/artifact provenance,
// anchors, response lineage, round key, visibility-window provenance, and
// timestamp"). `revision` mirrors team-cognition/schema.mjs's own
// AggregationSource immutability-pin convention: an artifactRef without a
// revision pin is not immutable backing, so it is required here for the
// same reason.
const CONTRIBUTION_FIELDS = new Set([
  'contributionId',
  'sessionId',
  'operationRef',
  'type',
  'assignmentId',
  'runId',
  'artifactRef',
  'revision',
  'anchors',
  'respondsTo',
  'roundKey',
  'visibilityWindowRef',
  'ts',
]);

/**
 * Validate one contribution's shape in isolation — field whitelist, typed
 * enum, required immutable Assignment/Run/artifact provenance, and required
 * round key/visibility-window provenance/timestamp. Does not check anchors,
 * response lineage, session membership, or operation/type legality against
 * any wider context — those are `validateContributionLineage`'s job, since
 * they need a caller-supplied context this function does not take.
 */
export function validateContributionShape(contribution) {
  if (!isPlainObject(contribution)) fail('validation', 'contribution must be a non-null object');
  assertOnlyAcceptedFields(contribution, CONTRIBUTION_FIELDS, 'contribution');

  if (!isNonEmptyString(contribution.contributionId)) fail('validation', 'contribution.contributionId must be a non-empty string');
  if (!isNonEmptyString(contribution.sessionId)) fail('validation', 'contribution.sessionId must be a non-empty string');
  if (!isNonEmptyString(contribution.operationRef)) fail('validation', 'contribution.operationRef must be a non-empty string');
  validateContributionType(contribution.type);

  if (!isNonEmptyString(contribution.assignmentId)) fail('validation', 'contribution.assignmentId must be a non-empty string');
  if (!isNonEmptyString(contribution.runId)) fail('validation', 'contribution.runId must be a non-empty string');
  assertRunIdBelongsToAssignment(contribution.assignmentId, contribution.runId);
  if (!isNonEmptyString(contribution.artifactRef)) fail('validation', 'contribution.artifactRef must be a non-empty string');
  if (!isNonEmptyString(contribution.revision)) {
    fail('validation', 'contribution.revision must be a non-empty string -- an artifact ref without a revision pin is not immutable');
  }

  if (contribution.anchors !== undefined && !isNonEmptyStringArray(contribution.anchors)) {
    fail('validation', 'contribution.anchors must be an array of non-empty strings when present');
  }
  if (contribution.respondsTo !== undefined && !isNonEmptyString(contribution.respondsTo)) {
    fail('validation', 'contribution.respondsTo must be a non-empty string when present');
  }
  if (contribution.type === 'response' && contribution.respondsTo === undefined) {
    fail('validation', 'a "response" contribution must set respondsTo');
  }

  if (!isNonEmptyString(contribution.roundKey)) fail('validation', 'contribution.roundKey must be a non-empty string');
  if (!isNonEmptyString(contribution.visibilityWindowRef)) fail('validation', 'contribution.visibilityWindowRef must be a non-empty string');
  if (!isNonEmptyString(contribution.ts)) fail('validation', 'contribution.ts must be a non-empty string');
}

/**
 * Validate that `declaredOperations[operationRef].allowedTypes[]` (Candidate
 * Contract: "Operation results declare `contributions.allowedTypes[]`")
 * actually lists `type`. An operationRef absent from `declaredOperations`
 * entirely is treated the same as one with an empty/missing allowedTypes —
 * both mean the operation never declared this type legal.
 */
export function validateOperationDeclaresType(operationRef, type, declaredOperations) {
  if (!isPlainObject(declaredOperations)) fail('validation', 'declaredOperations must be a non-null object');
  // Own property only: a `declaredOperations` built over a prototype would
  // otherwise legalize types the caller never declared on this object.
  const operation = Object.hasOwn(declaredOperations, operationRef) ? declaredOperations[operationRef] : undefined;
  const allowedTypes = operation && Array.isArray(operation.allowedTypes) ? operation.allowedTypes : null;
  if (!allowedTypes || !allowedTypes.includes(type)) {
    fail(
      'operation-type-mismatch',
      `operation "${operationRef}" does not declare "${type}" in its contributions.allowedTypes[]`,
    );
  }
}

/**
 * Validate that `contribution.sessionId` matches the session this lineage
 * check is scoped to. A contribution claiming membership in a different
 * session than the ledger it is being validated against is rejected
 * up front, before any anchor/response ref is even inspected.
 */
export function validateSessionMembership(contribution, sessionId) {
  if (!isNonEmptyString(sessionId)) fail('validation', 'sessionId must be a non-empty string');
  if (contribution.sessionId !== sessionId) {
    fail('foreign-session-ref', `contribution.sessionId "${contribution.sessionId}" does not match session "${sessionId}"`);
  }
}

// `knownContributions` is a caller-supplied, pure-data lookup of every
// contribution this module is allowed to treat as already-existing —
// `Map<contributionId, {sessionId, respondsTo?}>`. This module has no
// session/store access (P08.2 integration concern, same boundary
// team-cognition/aggregation-evaluator.mjs draws for `currentRevisions`),
// so anchor/response resolution can only ever be checked against whatever
// map the caller provides. An entry may legitimately carry a `sessionId`
// different from the session under validation — that is precisely how a
// foreign-session ref is distinguished from a dangling one below.
function resolveRef(ref, knownContributions, sessionId, refLabel, danglingCategory) {
  const known = knownContributions.get(ref);
  if (!known) fail(danglingCategory, `${refLabel} "${ref}" does not resolve to a known contribution`);
  if (known.sessionId !== sessionId) {
    fail('foreign-session-ref', `${refLabel} "${ref}" resolves to a contribution from a different session`);
  }
  return known;
}

/**
 * Validate every entry in `contribution.anchors[]` resolves to a
 * known contribution in the SAME session. Rejects a dangling anchor (not
 * found at all) and a foreign-session anchor (found, but in another
 * session) as distinct categories.
 */
export function validateAnchors(contribution, knownContributions, sessionId) {
  if (!(knownContributions instanceof Map)) fail('validation', 'knownContributions must be a Map');
  const anchors = contribution.anchors ?? [];
  for (const anchor of anchors) {
    resolveRef(anchor, knownContributions, sessionId, 'anchor', 'dangling-anchor');
  }
}

/**
 * Validate `contribution.respondsTo` response lineage: the target must
 * resolve (not dangling) in the same session (not foreign-session), and
 * walking the existing `respondsTo` chain from the candidate must never
 * revisit an id already seen in that walk — a response chain that loops
 * back on itself, whether directly (a cycle among already-known nodes) or
 * back to the candidate's own `contributionId`.
 *
 * The walk is bounded by `knownContributions.size + 1` steps so a
 * corrupt/pre-existing cyclic chain in the supplied map can never spin this
 * function forever even before it revisits a node — that overrun is itself
 * treated as a cycle, since a well-formed acyclic chain can never need more
 * steps than there are known nodes.
 */
export function validateResponseLineage(contribution, knownContributions, sessionId) {
  if (!(knownContributions instanceof Map)) fail('validation', 'knownContributions must be a Map');
  if (contribution.respondsTo === undefined) return;

  resolveRef(contribution.respondsTo, knownContributions, sessionId, 'respondsTo', 'dangling-response');

  const visited = new Set([contribution.contributionId]);
  let cursor = contribution.respondsTo;
  let steps = 0;
  const maxSteps = knownContributions.size + 1;
  while (cursor !== undefined) {
    if (visited.has(cursor)) {
      fail('cycle', `response lineage from "${contribution.contributionId}" loops back through "${cursor}"`);
    }
    visited.add(cursor);
    steps += 1;
    if (steps > maxSteps) {
      fail('cycle', `response lineage from "${contribution.contributionId}" exceeds the known-contribution bound without terminating`);
    }
    const node = knownContributions.get(cursor);
    cursor = node ? node.respondsTo : undefined;
  }
}

/**
 * Validate the contribution's Assignment/Run provenance against a
 * caller-supplied `knownAssignments` lookup:
 * `Map<assignmentId, {sessionId, operationRef}>`.
 *
 * Optional by design, and for one structural reason: this module has no
 * session/store access, so Assignment *existence* can only ever be known to a
 * caller that does (the ledger layer, P08.2). The channel is declared here
 * because P08.2 cannot add it later without changing this module's public
 * signature. When it is not supplied, provenance stays presence-checked only,
 * which the trace states plainly rather than calling "real".
 *
 * When it IS supplied, three things must hold, and each closes a different
 * accepted-today forgery:
 * - the `assignmentId` resolves at all (a fabricated Assignment is refused);
 * - it belongs to the session under validation (a foreign-session Assignment
 *   is refused, the same rule anchors and responses already carry);
 * - it carries the claimed `operationRef` (an Assignment that answered one
 *   operation cannot back a contribution labelled as another -- the "right
 *   type, wrong operation" class the coordination layer needed its own
 *   stamp channel to close one boundary down).
 */
export function validateAssignmentProvenance(contribution, knownAssignments, sessionId) {
  if (knownAssignments === undefined) return;
  if (!(knownAssignments instanceof Map)) fail('validation', 'knownAssignments must be a Map when provided');

  const known = knownAssignments.get(contribution.assignmentId);
  if (!known) {
    fail('foreign-provenance', `contribution.assignmentId "${contribution.assignmentId}" does not resolve to a known Assignment`);
  }
  if (known.sessionId !== sessionId) {
    fail(
      'foreign-session-ref',
      `contribution.assignmentId "${contribution.assignmentId}" resolves to an Assignment of a different session`,
    );
  }
  if (known.operationRef !== contribution.operationRef) {
    fail(
      'foreign-provenance',
      `contribution.assignmentId "${contribution.assignmentId}" answered operation "${known.operationRef}", not the claimed "${contribution.operationRef}"`,
    );
  }
}

/**
 * Top-level typed lineage validator: given one contribution and its
 * session-scoped context, throw `DeliberationError` on the first violation
 * found, in this fixed order: shape/enum, session membership,
 * operation/type declaration, Assignment provenance (when
 * `knownAssignments` is supplied), anchors, response lineage. Returns a frozen
 * `{ok: true, contributionId}` on success — there is no "report, don't
 * throw" mode, since every rejection this validator names is a hard reject
 * per this cell's contract, not a soft/advisory finding.
 *
 * @param {object} contribution
 * @param {object} context
 * @param {string} context.sessionId
 * @param {Object<string, {allowedTypes: string[]}>} context.declaredOperations
 * @param {Map<string, {sessionId: string, respondsTo?: string}>} context.knownContributions
 * @param {Map<string, {sessionId: string, operationRef: string}>} [context.knownAssignments]
 */
export function validateContributionLineage(contribution, context) {
  validateContributionShape(contribution);
  if (!isPlainObject(context)) fail('validation', 'context must be a non-null object');

  const { sessionId, declaredOperations, knownContributions, knownAssignments } = context;
  validateSessionMembership(contribution, sessionId);
  validateOperationDeclaresType(contribution.operationRef, contribution.type, declaredOperations);
  validateAssignmentProvenance(contribution, knownAssignments, sessionId);
  validateAnchors(contribution, knownContributions, sessionId);
  validateResponseLineage(contribution, knownContributions, sessionId);

  return Object.freeze({ ok: true, contributionId: contribution.contributionId });
}
