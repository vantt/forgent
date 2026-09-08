// dispatch/assignment-normalizer.mjs — pure normalizer for the Assignment
// snapshot fields ADR-006 R2 introduces: `mutation`, `evidence.required`,
// `resultKind`, and `onAdvance`.
//
// Pure data module: no fs, no store writes, no network, no imports of
// assignment.mjs or operation-choice.mjs. Every export here is a plain
// object -> plain object (or plain object -> string) transform driven only
// by its own inputs.
//
// This module owns the single source of truth for the DECLARED
// mutation/evidence-requirement mapping. `READ_ONLY_ROLES`, and
// `isReadOnlyAssignment()`'s formerly function-local `KNOWN_MUTATING_OPS`/
// `READ_ONLY_OPS` sets, moved here from `assignment.mjs` verbatim (ADR-006
// R2). `assignment.mjs` still re-exports `READ_ONLY_ROLES` (public surface,
// unaffected); `KNOWN_MUTATING_OPS`/`READ_ONLY_OPS` stay here as the
// declared-mapping source of truth ONLY, consulted exclusively by
// `classifyDeclaredMutation`/`stampDeclaredAssignment` below at build time.
// `isReadOnlyAssignment()` (ADR-006 R7) no longer re-derives classification
// from role/operation/missionId/workId at all — it reads the `mutation`
// field this module stamps, once, per Assignment.
//
// The per-operation evidence-requirement table below is lifted from
// `operation-choice.mjs`'s existing `interpretAssignmentRunResult` branches
// (~1600-1990; read reference only, not modified here or by this cell):
//   - `validate-plan` / `review-item` / `scout-blast-radius` accept
//     `confidence === 'reported' || confidence === 'verified'` -> `reported`.
//   - `fix-verify-red` / `scoped-subtask` require `confidence === 'verified'`
//     outright -> `verified`.
//   - `implement-item` has no interpretation branch of its own (falls
//     through to the generic "unsupported operation" reason) but is a
//     `KNOWN_MUTATING_OPS` entry; ADR-006 R2 explicitly assigns it
//     `verified` alongside its mutating peers.
// Every other declared operation (e.g. `resolve-question`, `shape-plan`,
// `lock-decisions`, `judge-ambiguity`, `compound-learn`, a synthesized
// `decompose`) falls back to a role/mutation-derived default: read-only ->
// `reported`, mutating -> `verified`. This is deliberately the SAME signal
// already used to compute `mutation` for that operation (rather than a
// second, independently-derived role check) so the two stamps never
// disagree for an operation this table doesn't name explicitly.

import { RunnerConfigError } from './config.mjs';
import { carriesProtocolOperationStamp } from './execution-contract.mjs';

export const NORMALIZER_VERSION = '1';

// Roles whose declared Assignments are read-only regardless of operation
// (Step 04 §5.4). Moved from assignment.mjs verbatim.
export const READ_ONLY_ROLES = new Set(['reviewer', 'researcher', 'advisor']);

// Operations known to mutate the repo regardless of role. Moved from
// assignment.mjs's isReadOnlyAssignment() (was function-local) verbatim.
export const KNOWN_MUTATING_OPS = new Set(['implement-item', 'fix-verify-red', 'scoped-subtask']);

// Operations known to be read-only regardless of role. Moved from
// assignment.mjs's isReadOnlyAssignment() (was function-local) verbatim.
export const READ_ONLY_OPS = new Set([
  'validate-plan',
  'resolve-question',
  'scout-blast-radius',
  'shape-plan',
  'lock-decisions',
  'judge-ambiguity',
  'compound-learn',
]);

const EVIDENCE_REQUIRED_BY_OPERATION = new Map([
  ['validate-plan', 'reported'],
  ['review-item', 'reported'],
  ['scout-blast-radius', 'reported'],
  ['scoped-subtask', 'verified'],
  ['implement-item', 'verified'],
  ['fix-verify-red', 'verified'],
]);

const RESULT_KIND_BY_OPERATION = new Map([
  ['validate-plan', 'gate-verdict'],
  ['review-item', 'review-verdict'],
]);

const ON_ADVANCE_BY_OPERATION = new Map([
  // Names Phase 01's already-built planVerdictFromPlanMd for a LATER cell
  // (R5) to actually dispatch through. This cell only stamps the string.
  ['validate-plan', 'derive-plan-verdict-from-plan-md'],
]);

/**
 * Classify a declared Assignment's mutation posture from its role/operation
 * (ADR-006 R2). Mirrors assignment.mjs's isReadOnlyAssignment() classification
 * EXCEPT for the `missionId || workId === null` heuristic clause -- see
 * module header.
 *
 * @param {{ role: string, operation: string }} params
 * @returns {'read-only'|'mutating'}
 */
function classifyDeclaredMutation({ role, operation }) {
  if (KNOWN_MUTATING_OPS.has(operation)) return 'mutating';
  if (READ_ONLY_ROLES.has(role) || READ_ONLY_OPS.has(operation)) return 'read-only';
  return 'mutating';
}

/**
 * Stamp `mutation` / `evidence.required` / `resultKind` / `onAdvance` for a
 * DECLARED Assignment from its resolved role and operation id (ADR-006 R2).
 *
 * A missing/invalid stamp is always a build failure (`RunnerConfigError`),
 * never a silent default (ADR-006 §2) -- unreachable in practice for any
 * operation reaching this function, since every branch below resolves to a
 * concrete value, but enforced here as the universal invariant this module
 * guarantees regardless of how it is called.
 *
 * @param {object} params
 * @param {string} [params.role] Resolved Assignment role (defaults 'implementer' like isReadOnlyAssignment)
 * @param {string} params.operation Operation id
 * @returns {Readonly<{ mutation: string, evidence: Readonly<{required: string}>, resultKind: string, onAdvance?: string }>}
 */
export function stampDeclaredAssignment({ role, operation }) {
  const resolvedRole = role ?? 'implementer';
  const mutation = classifyDeclaredMutation({ role: resolvedRole, operation });

  const evidenceRequired =
    EVIDENCE_REQUIRED_BY_OPERATION.get(operation) ?? (mutation === 'read-only' ? 'reported' : 'verified');

  const resultKind =
    RESULT_KIND_BY_OPERATION.get(operation) ?? (mutation === 'read-only' ? 'advisory' : 'work-product');

  const onAdvance = ON_ADVANCE_BY_OPERATION.get(operation);

  if (mutation !== 'read-only' && mutation !== 'mutating') {
    throw new RunnerConfigError(
      `assignment-normalizer: could not stamp "mutation" for declared operation "${operation}"`,
    );
  }
  if (evidenceRequired !== 'reported' && evidenceRequired !== 'verified') {
    throw new RunnerConfigError(
      `assignment-normalizer: could not stamp "evidence.required" for declared operation "${operation}"`,
    );
  }

  return Object.freeze({
    mutation,
    evidence: Object.freeze({ required: evidenceRequired }),
    resultKind,
    ...(onAdvance ? { onAdvance } : {}),
  });
}

/**
 * Stamp `mutation` / `evidence.required` for an INLINE Assignment straight
 * from its already-validated execution contract (ADR-006 R2). By the time
 * this runs, `execution-contract.mjs` has already rejected a contract with a
 * missing/invalid `mutation` or `evidence.required`, and already rejected
 * `mutation: 'mutating'` unless it carried the engine-reserved
 * protocol-operation stamp (ADR-006 §6 / Phase 01 mutation-unlock R6a). The
 * check here is a defensive SECOND gate against that same invariant (this
 * module's own universal guarantee, not the primary enforcement point) --
 * `mutation: 'mutating'` is therefore held to the identical stamp
 * requirement a second time, so this function can never itself become a
 * path that lets an unstamped `'mutating'` inline contract through even if
 * `execution-contract.mjs`'s own gate were ever bypassed or weakened.
 *
 * @param {object} contract Validated inline execution contract
 * @returns {Readonly<{ mutation: string, evidence: Readonly<{required: string}> }>}
 */
export function stampInlineAssignment(contract) {
  const mutation = contract?.mutation;
  const evidenceRequired = contract?.evidence?.required;

  if (mutation !== 'read-only' && mutation !== 'mutating') {
    throw new RunnerConfigError(
      'assignment-normalizer: inline contract missing/invalid "mutation" after normalization (must be "read-only" or "mutating", ADR-006 §6)',
    );
  }
  if (mutation === 'mutating' && !carriesProtocolOperationStamp(contract?.constraints)) {
    throw new RunnerConfigError(
      'assignment-normalizer: inline contract mutation "mutating" carries no engine-reserved protocol-operation stamp -- rejected as a second, defensive gate (ADR-006 §6 / Phase 01 mutation-unlock R6a)',
    );
  }
  if (evidenceRequired !== 'reported' && evidenceRequired !== 'verified') {
    throw new RunnerConfigError(
      'assignment-normalizer: inline contract missing/invalid "evidence.required" after normalization',
    );
  }

  return Object.freeze({
    mutation,
    evidence: Object.freeze({ required: evidenceRequired }),
  });
}
