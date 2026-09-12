// coordination/read-evaluators.mjs -- pure decision evaluators extracted
// from session-engine.mjs/store.mjs, per AD-11 (hexagonal/SRP: domain
// decisions live in pure evaluators/planners; adapters own filesystem/
// network details; write doors remain the only mutation boundary).
//
// Each function below is a pure function of its arguments: no fs, no
// child_process, no network, no mutation, no reading of ambient/global
// session state. Every caller (a future write door, per the read-evaluator
// contract) is responsible for gathering the facts these functions need --
// typically the output of `replaySession()` (the `snapshot`) plus any
// externally-resolved evidence (`facts`/`evidence`/`caller`) -- and passing
// them in explicitly. This module never re-derives that evidence itself.
//
// `snapshot` is shaped like a `replaySession()` result: at minimum
// `{ manifest, assignmentRefs }`, where `manifest` carries the session's
// own `coordinationId`, `status` and `provenanceRoot` fields (schema.mjs's
// manifest field table).

import { STATUS_VALUES, CONTRIBUTION_REF_PREFIX } from './schema.mjs';

// The non-'active' members of STATUS_VALUES are exactly the terminal
// statuses a session can transition into (store.mjs's TERMINAL_EVENT_TYPE
// keys: completed/partial/failed/cancelled) -- derived from the single
// schema-owned enum rather than a second, hand-duplicated list.
const TERMINAL_STATUSES = new Set([...STATUS_VALUES].filter((status) => status !== 'active'));

// The only two caller-declared action shapes this cell recognizes: "proceed"
// (facts.requestedAction's own default, below) and "transition" (a requested
// status change). Every real write door fails closed on an operation/event
// type it does not recognize (e.g. `authorizeOperation`'s known-operation
// gate, `transitionSessionStatusLocked`'s known-terminal-status gate) rather
// than defaulting to "allowed" -- legalNext must fail closed the same way for
// an action type outside this known set.
const KNOWN_ACTION_TYPES = new Set(['proceed', 'transition']);

/**
 * legalNext(snapshot, facts) -> action | blocked(reason)
 *
 * Extracted from the "session must be active" gate every write door in
 * store.mjs/session-engine.mjs repeats before doing anything else
 * (authorizeOperation, recordRunRetry, recordDriverDisposition,
 * recordAggregationValidation, recordContributionLink, recordHumanTurn,
 * recordSpecialistAuthorization, proposeConsult, transitionSessionStatus --
 * all throw `CoordinationError('validation', 'session "..." is not active
 * (status: "...")')` on a non-active manifest), plus
 * `transitionSessionStatusLocked`'s own "status must be a legal terminal
 * status" gate (`TERMINAL_EVENT_TYPE` lookup) for the one caller-declared
 * action shape this cell recognizes: requesting a status transition.
 *
 * @param {{manifest: {status: string, coordinationId: string}}} snapshot
 * @param {{requestedAction?: {type: string, status?: string}}} [facts]
 * @returns {{kind: 'action', action: object} | {kind: 'blocked', reason: string}}
 */
export function legalNext(snapshot, facts = {}) {
  const { manifest } = snapshot;
  if (manifest.status !== 'active') {
    return {
      kind: 'blocked',
      reason: `session "${manifest.coordinationId}" is not active (status: "${manifest.status}") -- no further action is legal once the session has left "active"`,
    };
  }

  const requestedAction = facts.requestedAction ?? { type: 'proceed' };
  if (!KNOWN_ACTION_TYPES.has(requestedAction.type)) {
    return {
      kind: 'blocked',
      reason: `requested action type "${requestedAction.type}" is not a legal/known action type (must be one of ${[...KNOWN_ACTION_TYPES].join(', ')}) -- an unrecognized action type is refused, not defaulted to allowed`,
    };
  }
  if (requestedAction.type === 'transition' && !TERMINAL_STATUSES.has(requestedAction.status)) {
    return {
      kind: 'blocked',
      reason: `requested status "${requestedAction.status}" is not a legal terminal status (must be one of ${[...TERMINAL_STATUSES].join(', ')})`,
    };
  }

  return { kind: 'action', action: requestedAction };
}

/**
 * authorize(action, facts) -> allowed | needs-input(reason)
 *
 * Extracted from store.mjs's `assertDriverIdentity` (already pure: it only
 * compares `authorizedBy.id` against `manifest.provenanceRoot.writerId`,
 * the same gate `authorizeOperation`, `recordDriverDisposition` and
 * `recordHumanTurn` all apply before appending anything under a caller-
 * supplied identity) -- AD-09's "current profile requires trusted-config
 * operator authorization ... under the session's own driver/provenance-root
 * identity".
 *
 * @param {{label?: string, subject?: string, fieldName?: string}} [action]
 * @param {{manifest: {coordinationId: string, provenanceRoot: {writerId: string}}, authorizedBy: {id?: string}}} facts
 * @returns {{kind: 'allowed'} | {kind: 'needs-input', reason: string}}
 */
export function authorize(action, facts) {
  const { manifest, authorizedBy } = facts;
  if (authorizedBy?.id !== manifest.provenanceRoot.writerId) {
    const label = action?.label ?? 'authorize';
    const subject = action?.subject ?? 'this action';
    const fieldName = action?.fieldName ?? 'authorizedBy';
    return {
      kind: 'needs-input',
      reason: `${label}: ${fieldName}.id "${authorizedBy?.id}" is not the driver identity of session "${manifest.coordinationId}" (its provenanceRoot.writerId is "${manifest.provenanceRoot.writerId}") -- ${subject} may only be written under the session's own driver/provenance-root identity`,
    };
  }
  return { kind: 'allowed' };
}

// Mirrors session-engine.mjs's own private `refSegments` exactly (split on
// path separators, drop empty segments) -- a path-form ref into a foreign
// session/Assignment directory must be caught the same way a bare id is.
function refSegments(ref) {
  return ref.split(/[\\/]/).filter(Boolean);
}

/**
 * visibility(snapshot, caller) -> projection
 *
 * Extracted from session-engine.mjs's `assertRefsOwnedBySession` (the one
 * rule `validateConsultProposal`'s sibling/foreign-leakage check and
 * `authorizeDeclaredOperation`'s grant-scope gate both apply): a ref in the
 * reserved `contribution:` namespace is never grantable; a ref naming a
 * different real coordination session is refused; a ref resolving to a real
 * Assignment that is not a member of THIS session is refused; a string that
 * merely resembles an id but resolves to nothing real is left alone. A
 * blank or whitespace-only ref is refused outright, matching the write
 * doors' own non-empty-string gates.
 *
 * The original also decides "resolves to a real session/Assignment" by
 * checking, synchronously, whether it exists on disk -- an adapter/
 * filesystem concern this pure module never performs itself (AD-11). The
 * caller supplies that existence evidence via
 * `caller.knownSessionIds`/`caller.knownAssignmentIds` (every OTHER real
 * session id / Assignment id an adapter has already confirmed exists on
 * disk); this function only applies the ownership rule to that evidence.
 *
 * @param {{manifest: {coordinationId: string}, assignmentRefs: string[]}} snapshot
 * @param {{requestedRefs?: string[], knownSessionIds?: string[], knownAssignmentIds?: string[]}} [caller]
 * @returns {Readonly<{visibleRefs: string[], deniedRefs: Readonly<{ref: string, reason: string}>[]}>}
 */
export function visibility(snapshot, caller = {}) {
  const { manifest, assignmentRefs = [] } = snapshot;
  const coordinationId = manifest.coordinationId;
  const { requestedRefs = [], knownSessionIds = [], knownAssignmentIds = [] } = caller;

  const visibleRefs = [];
  const deniedRefs = [];

  for (const ref of requestedRefs) {
    if (typeof ref !== 'string') {
      deniedRefs.push(Object.freeze({ ref, reason: `ref must be a string, got ${typeof ref}` }));
      continue;
    }
    if (ref.trim() === '') {
      deniedRefs.push(
        Object.freeze({
          ref,
          reason: `ref must be a non-empty string -- a blank or whitespace-only ref is never grantable, matching the write doors' own non-empty-string gates (validateConsultProposal's isNonEmptyString pre-gate, authorizeOperation's isStringArray check)`,
        }),
      );
      continue;
    }
    if (ref.startsWith(CONTRIBUTION_REF_PREFIX)) {
      deniedRefs.push(
        Object.freeze({
          ref,
          reason: `ref "${ref}" is in the reserved "${CONTRIBUTION_REF_PREFIX}" namespace -- a contribution carries no content to grant, so it is not a grantable context ref`,
        }),
      );
      continue;
    }

    let denial;
    for (const segment of refSegments(ref)) {
      if (segment !== coordinationId && knownSessionIds.includes(segment)) {
        denial = { ref, reason: `ref "${ref}" names a different coordination session -- cross-session grant authority is out of scope` };
        break;
      }
      if (/^asgn_/.test(segment) && knownAssignmentIds.includes(segment) && !assignmentRefs.includes(segment)) {
        denial = {
          ref,
          reason: `ref "${ref}" resolves to an Assignment that is not a member of coordination session "${coordinationId}" -- every granted ref must resolve to a ref owned by this same coordinationId`,
        };
        break;
      }
    }

    if (denial) deniedRefs.push(Object.freeze(denial));
    else visibleRefs.push(ref);
  }

  return Object.freeze({ visibleRefs: Object.freeze(visibleRefs), deniedRefs: Object.freeze(deniedRefs) });
}

/**
 * completion(snapshot, evidence) -> complete | incomplete | unknown
 *
 * Extracted from the session status enum itself (schema.mjs's
 * STATUS_VALUES) and `transitionSessionStatusLocked`'s own terminal/active
 * split: a session is only ever done via one explicit, immutable
 * transition (`completedAt` set once, manifest status never rewritten
 * again). 'completed' is the sole success terminal; 'partial'/'failed'/
 * 'cancelled' are terminal but did not complete; 'active' means the
 * outcome is not yet decided.
 *
 * @param {{manifest: {status: string, coordinationId: string}}} snapshot
 * @param {object} [evidence] Reserved for a future cell's completion evidence; unused by this status-only extraction.
 * @returns {{kind: 'complete'} | {kind: 'incomplete', reason: string} | {kind: 'unknown', reason: string}}
 */
export function completion(snapshot, evidence = {}) {
  void evidence;
  const { manifest } = snapshot;
  if (manifest.status === 'completed') return { kind: 'complete' };
  if (TERMINAL_STATUSES.has(manifest.status)) {
    return { kind: 'incomplete', reason: `session "${manifest.coordinationId}" reached terminal status "${manifest.status}" without completing` };
  }
  return { kind: 'unknown', reason: `session "${manifest.coordinationId}" is still active (status: "${manifest.status}") -- completion cannot be determined yet` };
}
