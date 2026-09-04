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
//     to an "unrecognized" value -- UNLESS the contract carries the
//     engine-reserved protocol-operation stamp (Phase 01 mutation-unlock,
//     R6a, `carriesProtocolOperationStamp` below), proof it was built by
//     session-engine.mjs's own mediated `dispatchDeclaredOperation` door and
//     not forged by a bare caller.
//   - `coordinationId` (and other session/coordination field names) is
//     rejected by name, not merely because it happens to be absent from the
//     accepted field set today -- so a future accidental addition to that
//     set could never silently re-admit one of these.

import { MODEL_POLICY_TIERS, RunnerConfigError } from './config.mjs';

export const CONTRACT_POLICY_VERSION = '1';

// Phase 01 mutation-unlock (R6a): the ONE reserved `contract.constraints`
// namespace that marks an inline contract as ENGINE-derived operation
// provenance, minted exclusively by session-engine.mjs's own
// `buildSessionContract`/`assertNoReservedOperationStamp` mechanism for a
// declared `dispatchDeclaredOperation` call. Defined here (dispatch/infra
// layer) rather than in session-engine.mjs (coordination/use-case layer) so
// this module and assignment-normalizer.mjs -- both infra-layer, per
// docs/architecture-manifest.json -- never import upward from
// src/runner/coordination/** (the one-directional-layer rule
// test/architecture.test.mjs enforces); session-engine.mjs imports this
// constant from here instead of re-declaring it, so there is exactly one
// definition either side of the layer boundary trusts.
export const PROTOCOL_OPERATION_STAMP_PREFIX = 'protocol-operation:';

/** `true` when `constraints` carries at least one entry stamped with the
 * reserved `PROTOCOL_OPERATION_STAMP_PREFIX` namespace -- the one signal
 * that lets `validateExecutionContract` (below) and
 * `assignment-normalizer.mjs`'s `stampInlineAssignment` distinguish a
 * mutating inline contract session-engine.mjs itself built from one any
 * other caller could have forged by hand. */
export function carriesProtocolOperationStamp(constraints) {
  return Array.isArray(constraints) && constraints.some((entry) => typeof entry === 'string' && entry.startsWith(PROTOCOL_OPERATION_STAMP_PREFIX));
}

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
  // ADR-007 §1/§3: the operation id an inline contract claims to support,
  // when it is attached to a Work at a declared Stage. Format-check only
  // here (non-empty string when present) -- this generic, domain-ignorant
  // validator never knows what a legal operation id is; that semantic
  // legality check belongs solely to the domain harness seam
  // (domains/coding/harness/enrich-and-validate-contract.mjs), which the
  // foundation calls strictly after this validator (ADR-007 §2).
  'supports',
  // Step 08 P04.2b: an explicit, single-field exception, not a general
  // PolicyPatch passthrough -- `contract.policy` may carry EXACTLY one key
  // (`minTier`, checked against `ACCEPTED_POLICY_FIELDS` below), never
  // `preferExecutor`/`preferPersona`/`model`/`visibility`/
  // `fallbackExecutors`. Without this, no coordination dispatch (agent-led
  // or declared) had any way to populate `assignment.policy`, so
  // `resolveAssignmentDispatchPolicy`'s tier floor (`assignment-policy.mjs`,
  // `opPolicy.minTier || 'standard'`) could never be lowered below
  // `'standard'` -- and the real `.fgos/config.json` only configures
  // `lightweight` for every non-`claude` provider family, so no
  // coordination dispatch could ever reach a non-Claude provider family at
  // all. This field exists solely to let a caller that has already
  // composed a legal, lower tier requirement (e.g. Cohort Planner
  // allocation) record it where `resolveAssignmentDispatchPolicy` actually
  // reads its starting floor from, instead of only through
  // `cliOverride.minTier` (which can only ever RAISE the floor, never
  // lower it, per that resolver's own `resolveStrongerTier` monotonicity).
  'policy',
]);

const ACCEPTED_CALLER_FIELDS = new Set(['writerId', 'parentAssignmentId']);
const ACCEPTED_BUDGET_FIELDS = new Set(['timeoutMs', 'maxRuns', 'tokens']);
const ACCEPTED_EVIDENCE_FIELDS = new Set(['required']);
// Step 08 P04.2b: see the `'policy'` entry in ACCEPTED_CONTRACT_FIELDS above
// for why this exists and why it is exactly one field wide.
const ACCEPTED_POLICY_FIELDS = new Set(['minTier']);

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
  // first slice is read-only only, UNLESS the contract carries the
  // engine-reserved protocol-operation stamp (Phase 01 mutation-unlock,
  // R6a) -- proof this exact contract was built by session-engine.mjs's
  // own mediated `dispatchDeclaredOperation` door, never a bare caller
  // forging `mutation: 'mutating'` by hand. Named explicitly, not folded
  // into the generic "must equal read-only" branch below, so each failure
  // mode always reports its own, distinct reason.
  if (contract.mutation === 'mutating') {
    if (!carriesProtocolOperationStamp(contract.constraints)) {
      fail(
        'contract.mutation "mutating" is rejected -- only an inline contract carrying the engine-reserved protocol-operation stamp in its constraints (session-engine.mjs\'s own mediated dispatchDeclaredOperation door) may declare "mutating"; every other caller stays read-only-only (ADR-006 §6)',
      );
    }
  } else if (contract.mutation !== 'read-only') {
    fail('contract.mutation must be "read-only" or "mutating" (missing, or any other value, is rejected)');
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
  if (contract.supports !== undefined && !isNonEmptyString(contract.supports)) {
    fail('contract.supports must be a non-empty string when provided (an operation id it claims to support -- legality against the Work\'s declared Stage is checked by the domain harness seam, ADR-007 §3, not here)');
  }
  if (contract.capabilities !== undefined && !isStringArray(contract.capabilities)) {
    fail('contract.capabilities must be an array of strings when provided (capability hints)');
  }

  // Step 08 P04.2b: `contract.policy` is optional; when present it must
  // carry EXACTLY `minTier` (one of MODEL_POLICY_TIERS) and nothing else --
  // see ACCEPTED_CONTRACT_FIELDS' own doc comment above for why this narrow
  // exception exists.
  if (contract.policy !== undefined) {
    if (!isPlainObject(contract.policy)) {
      fail('contract.policy must be an object when provided');
    }
    assertOnlyAcceptedFields(contract.policy, ACCEPTED_POLICY_FIELDS, 'contract.policy');
    if (!MODEL_POLICY_TIERS.includes(contract.policy.minTier)) {
      fail(`contract.policy.minTier must be one of ${MODEL_POLICY_TIERS.join(', ')}`);
    }
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
