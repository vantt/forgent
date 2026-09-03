// team-cognition/schema.mjs — pure shape validator for the data an
// aggregation evaluator is handed: declared source operations, structured
// evidence-source refs (each pointing at one immutable RunResult/artifact),
// and required disclosure ids.
//
// Mirrors coordination/schema.mjs's own shape one boundary over (whitelist-
// first field tables, fail-closed on the first violation, stable
// caller-inspectable error category) but is a self-contained module: it
// does not import coordination/schema.mjs or anything else under
// src/runner/coordination/, so the team-cognition boundary never inherits
// session-runtime authority by accident.
//
// Pure data module: no fs, no network, no dispatch, no session mutation.
// component-authority-boundary-map.md §6 (Team Cognition Engine "Must not
// own"): CoordinationSession terminal transitions, context-grant authority,
// Assignment dispatch, RunResult confidence upgrades. This module (and its
// sibling aggregation-evaluator.mjs) touches none of those -- it only
// reads the shape of data callers already hold.

export class AggregationError extends Error {
  constructor(category, message) {
    super(message);
    this.name = 'AggregationError';
    this.category = category;
  }
}

function fail(category, reason) {
  throw new AggregationError(category, `team-cognition: ${reason}`);
}

export function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isNonEmptyStringArray(value) {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
}

function assertOnlyAcceptedFields(obj, accepted, label) {
  for (const key of Object.keys(obj)) {
    if (!accepted.has(key)) fail('validation', `${label} has unknown field "${key}"`);
  }
}

// One structured evidence-source entry: a pointer to an immutable
// RunResult/artifact, plus the disclosures its worker attached. `revision`
// is the immutability pin -- without it a `runId`/`artifactRef` pair could
// silently point at a still-mutable in-flight run, so it is required on
// every entry, not just checked when present.
const AGGREGATION_SOURCE_FIELDS = new Set([
  'sourceOperationRef',
  'assignmentId',
  'runId',
  'artifactRef',
  'revision',
  'disclosures',
]);

/**
 * Validate one `sources[]` entry's shape. Throws `AggregationError`
 * ('validation') on the first violation. Does not check whether
 * `sourceOperationRef` is actually declared -- that cross-reference check
 * belongs to aggregation-evaluator.mjs, which has both lists on hand.
 */
export function validateAggregationSource(source, index) {
  const label = `sources[${index}]`;
  if (!isPlainObject(source)) fail('validation', `${label} must be a non-null object`);
  assertOnlyAcceptedFields(source, AGGREGATION_SOURCE_FIELDS, label);
  if (!isNonEmptyString(source.sourceOperationRef)) fail('validation', `${label}.sourceOperationRef must be a non-empty string`);
  if (!isNonEmptyString(source.assignmentId)) fail('validation', `${label}.assignmentId must be a non-empty string`);
  if (!isNonEmptyString(source.runId)) fail('validation', `${label}.runId must be a non-empty string`);
  if (!isNonEmptyString(source.artifactRef)) fail('validation', `${label}.artifactRef must be a non-empty string`);
  if (!isNonEmptyString(source.revision)) {
    fail('validation', `${label}.revision must be a non-empty string -- an artifact ref without a revision pin is not immutable`);
  }
  if (!isPlainObject(source.disclosures)) fail('validation', `${label}.disclosures must be an object`);
}

/**
 * Validate the declared `sourceOperationRefs[]` list (candidate contract:
 * `completion.aggregation.sourceOperationRefs[]`). Must be a non-empty
 * array of unique, non-empty strings.
 */
export function validateSourceOperationRefs(sourceOperationRefs) {
  if (!isNonEmptyStringArray(sourceOperationRefs)) {
    fail('validation', 'sourceOperationRefs must be a non-empty array of non-empty strings');
  }
  const seen = new Set();
  for (const ref of sourceOperationRefs) {
    if (seen.has(ref)) fail('validation', `sourceOperationRefs carries duplicate entry "${ref}"`);
    seen.add(ref);
  }
}

/**
 * Validate the full `sources[]` array shape (each entry via
 * `validateAggregationSource`).
 */
export function validateSources(sources) {
  if (!Array.isArray(sources)) fail('validation', 'sources must be an array');
  sources.forEach(validateAggregationSource);
}

/**
 * Validate the declared `requiredDisclosures[]` list (candidate contract:
 * `completion.aggregation.requiredDisclosures[]`). Must be a non-empty
 * array of non-empty strings naming disclosure ids every source is
 * expected to carry under `disclosures`.
 */
export function validateRequiredDisclosures(requiredDisclosures) {
  if (!isNonEmptyStringArray(requiredDisclosures)) {
    fail('validation', 'requiredDisclosures must be a non-empty array of non-empty strings');
  }
}

// One caller-declared record (P07.2): a specific declared source operation
// carries disclosed dissent, and whether that dissent has been resolved.
// Candidate contract naming precedent (P00.2.md §3): `dissentRefs`/
// `unresolvedContributionRefs` -- non-contract, but the name this module
// follows for internal consistency.
const DISSENT_REF_FIELDS = new Set(['sourceOperationRef', 'resolved']);

/**
 * Validate one `dissentRefs[]` entry's shape. Throws `AggregationError`
 * ('validation') on the first violation. Does not cross-reference against
 * `sources[]` -- that belongs to aggregation-evaluator.mjs, which has both
 * lists on hand.
 */
export function validateDissentRef(entry, index) {
  const label = `dissentRefs[${index}]`;
  if (!isPlainObject(entry)) fail('validation', `${label} must be a non-null object`);
  assertOnlyAcceptedFields(entry, DISSENT_REF_FIELDS, label);
  if (!isNonEmptyString(entry.sourceOperationRef)) fail('validation', `${label}.sourceOperationRef must be a non-empty string`);
  if (typeof entry.resolved !== 'boolean') fail('validation', `${label}.resolved must be a boolean`);
}

/**
 * Validate the full `dissentRefs[]` array shape. May be empty -- an
 * aggregation with no disclosed dissent supplies `[]`.
 */
export function validateDissentRefs(dissentRefs) {
  if (!Array.isArray(dissentRefs)) fail('validation', 'dissentRefs must be an array');
  dissentRefs.forEach(validateDissentRef);
}

/**
 * Validate the `currentRevisions` map: a caller-supplied, pure-function
 * lookup of each artifact's actual current revision, keyed by
 * `artifactRef`. This module has no store access (P07.3 integration
 * concern, per P07.1's own Gaps), so staleness can only be checked against
 * whatever map the caller provides here -- validating its shape (rather
 * than trusting it blindly) is what keeps a garbage/empty map from
 * silently letting every source through as current.
 */
export function validateCurrentRevisions(currentRevisions) {
  if (!isPlainObject(currentRevisions)) fail('validation', 'currentRevisions must be a non-null object');
  for (const [artifactRef, revision] of Object.entries(currentRevisions)) {
    if (!isNonEmptyString(artifactRef)) fail('validation', 'currentRevisions has an empty-string key');
    if (!isNonEmptyString(revision)) fail('validation', `currentRevisions["${artifactRef}"] must be a non-empty string`);
  }
}
