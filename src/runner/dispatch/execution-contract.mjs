// dispatch/execution-contract.mjs — pure validator for an agent-proposed
// INLINE execution contract (ADR-006 R3).
//
// Pure data module: no fs, no store writes, no network. Validates the
// ADR-006 §4 minimum inline-contract field set and fails closed (throws
// `RunnerConfigError`) on anything outside it.
//
// Two checks are deliberately redundant with the generic unknown-field gate
// below, because they are the single most safety-critical checks in this
// cell (ADR-006 §6 -- first slice is read-only only, no session/coordination
// reference this slice):
//   - `mutation: 'mutating'` is rejected by name, not merely because it maps
//     to an "unrecognized" value.
//   - `coordinationId` (and other session/coordination field names) is
//     rejected by name, not merely because it happens to be absent from the
//     accepted field set today -- so a future accidental addition to that
//     set could never silently re-admit one of these.

import { RunnerConfigError } from './config.mjs';

export const CONTRACT_POLICY_VERSION = '1';

const ACCEPTED_CONTRACT_FIELDS = new Set([
  'objective',
  'contextRefs',
  'constraints',
  'expectedOutputs',
  'mutation',
  'evidence',
  'role',
  'capabilities',
  'budget',
]);

const ACCEPTED_CALLER_FIELDS = new Set(['writerId', 'parentAssignmentId']);
const ACCEPTED_BUDGET_FIELDS = new Set(['timeoutMs', 'maxRuns', 'tokens']);
const ACCEPTED_EVIDENCE_FIELDS = new Set(['required']);

// ADR-006 §6: no session or coordination reference in this slice.
const FORBIDDEN_SESSION_FIELDS = new Set(['coordinationId', 'sessionId', 'threadId', 'coordinationRef']);

const EVIDENCE_REQUIRED_VALUES = new Set(['reported', 'verified']);

// Mirrors src/util/session-identity.mjs's own SESSION_ID_RE/MAX_ID_LENGTH
// (that module does not export them). This is a format-only floor against
// garbage caller.writerId values -- NOT a real identity check, and this
// module deliberately never calls resolveWriterIdentity() itself (stays
// pure, no process shell-out; see the module header and buildInlineAssignment
// in ./assignment.mjs for why).
const WRITER_ID_RE = /^[A-Za-z0-9._-]+$/;
const MAX_WRITER_ID_LENGTH = 200;

function fail(reason) {
  throw new RunnerConfigError(`execution-contract: ${reason}`);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

function assertNoForbiddenFields(obj, label) {
  for (const key of Object.keys(obj)) {
    if (FORBIDDEN_SESSION_FIELDS.has(key)) {
      fail(`${label} carries a forbidden session/coordination field "${key}" -- no session reference in this slice (ADR-006 §6)`);
    }
  }
}

function assertOnlyAcceptedFields(obj, accepted, label) {
  for (const key of Object.keys(obj)) {
    if (!accepted.has(key)) {
      fail(`${label} has unknown field "${key}"`);
    }
  }
}

/**
 * Validate an inline execution contract plus its caller provenance against
 * the ADR-006 §4 minimum field set (ADR-006 R3). Throws `RunnerConfigError`
 * for any violation. Returns nothing on success -- the caller already holds
 * the validated `contract`/`caller` objects it passed in.
 *
 * @param {object} params
 * @param {object} params.contract Agent-proposed execution contract
 * @param {object} params.caller Caller provenance ({ writerId, parentAssignmentId? })
 */
export function validateExecutionContract({ contract, caller } = {}) {
  if (!isPlainObject(contract)) {
    fail('contract must be a non-null object');
  }

  assertNoForbiddenFields(contract, 'contract');
  assertOnlyAcceptedFields(contract, ACCEPTED_CONTRACT_FIELDS, 'contract');

  if (!isNonEmptyString(contract.objective)) {
    fail('contract.objective must be a non-empty string');
  }

  if (!isStringArray(contract.contextRefs)) {
    fail('contract.contextRefs must be an array of strings (bounded context references)');
  }

  if (!isStringArray(contract.constraints)) {
    fail('contract.constraints must be an array of strings (constraints/authority)');
  }

  if (!isStringArray(contract.expectedOutputs) || contract.expectedOutputs.length === 0) {
    fail('contract.expectedOutputs must be a non-empty array of strings');
  }

  // ADR-006 §6: the single most safety-critical check in this module --
  // first slice is read-only only. Named explicitly, not folded into the
  // generic "must equal read-only" branch below, so this exact failure mode
  // always reports its own reason.
  if (contract.mutation === 'mutating') {
    fail('contract.mutation "mutating" is rejected -- first slice is read-only only (ADR-006 §6)');
  }
  if (contract.mutation !== 'read-only') {
    fail('contract.mutation must be "read-only" (missing, or any value other than "read-only", is rejected)');
  }

  if (!isPlainObject(contract.evidence)) {
    fail('contract.evidence must be an object with a "required" field');
  }
  assertOnlyAcceptedFields(contract.evidence, ACCEPTED_EVIDENCE_FIELDS, 'contract.evidence');
  if (!EVIDENCE_REQUIRED_VALUES.has(contract.evidence.required)) {
    fail('contract.evidence.required must be "reported" or "verified"');
  }

  if (!isNonEmptyString(contract.role)) {
    fail('contract.role must be a non-empty string (role hint)');
  }
  if (contract.capabilities !== undefined && !isStringArray(contract.capabilities)) {
    fail('contract.capabilities must be an array of strings when provided (capability hints)');
  }

  if (!isPlainObject(contract.budget)) {
    fail('contract.budget must be an object');
  }
  assertOnlyAcceptedFields(contract.budget, ACCEPTED_BUDGET_FIELDS, 'contract.budget');
  if (!Number.isInteger(contract.budget.timeoutMs) || contract.budget.timeoutMs <= 0) {
    fail('contract.budget.timeoutMs must be a positive integer (milliseconds) -- the only enforced time budget');
  }
  if (!Number.isInteger(contract.budget.maxRuns) || contract.budget.maxRuns <= 0) {
    fail('contract.budget.maxRuns must be a positive integer -- the only enforced run-count budget');
  }
  if (contract.budget.tokens !== undefined && (typeof contract.budget.tokens !== 'number' || !Number.isFinite(contract.budget.tokens) || contract.budget.tokens < 0)) {
    fail('contract.budget.tokens must be a non-negative finite number when provided (telemetry only, never enforced as a limit)');
  }

  if (!isPlainObject(caller)) {
    fail('caller must be a non-null object');
  }
  assertNoForbiddenFields(caller, 'caller');
  assertOnlyAcceptedFields(caller, ACCEPTED_CALLER_FIELDS, 'caller');
  if (!isNonEmptyString(caller.writerId)) {
    fail('caller.writerId must be a non-empty string');
  }
  if (caller.writerId.length > MAX_WRITER_ID_LENGTH || !WRITER_ID_RE.test(caller.writerId)) {
    fail(`caller.writerId must match ${WRITER_ID_RE} and be at most ${MAX_WRITER_ID_LENGTH} characters (format-only floor, not an identity check)`);
  }
  if (caller.parentAssignmentId !== undefined && !isNonEmptyString(caller.parentAssignmentId)) {
    fail('caller.parentAssignmentId must be a non-empty string when provided');
  }
}
