// coordination/legality-facts.mjs — pure legality facts evaluator (Unit 0D).
// Hexagonal / pure evaluation layer: no filesystem I/O, no mutation, no side-effects.
// Shared by showCoordinationUseCase, chainCoordinationUseCase, action projectors,
// and the kernel session-engine itself.

import {
  STATUS_VALUES,
  CONTRIBUTION_REF_PREFIX,
  HUMAN_TURN_REF_PREFIX,
  CoordinationError,
} from './schema.mjs';
import { activationModeOf } from '../definitions/schema.mjs';

export const PROTOCOL_OPERATION_STAMP_PREFIX = 'protocol-operation:';

/**
 * Mint the reserved engine stamp for a declared protocol operation.
 * @param {object} definition Loaded FlowDefinition
 * @param {string} operationId
 * @returns {string}
 */
export function protocolOperationStamp(definition, operationId) {
  return `${PROTOCOL_OPERATION_STAMP_PREFIX}${definition?.metadata?.id}@${definition?.metadata?.version}#${operationId}`;
}

/**
 * `oldActorId -> replacementActorId` for every ACCEPTED `actor-replaced` event in `events`.
 * @param {Array<object>} events
 * @returns {Map<string, string>}
 */
export function buildActorReplacementMap(events = []) {
  const map = new Map();
  for (const event of events) {
    if (event?.type === 'actor-replaced' && event.payload?.oldActorId && event.payload?.replacementActorId) {
      map.set(event.payload.oldActorId, event.payload.replacementActorId);
    }
  }
  return map;
}

/**
 * Pure resolution of a declared operation binding actor.
 * @param {object} definition FlowDefinition
 * @param {string} operationId
 * @param {string} [targetActorId]
 * @param {Map<string, object>} [specialistBindings]
 * @returns {object}
 */
export function resolveDeclaredOperationActor(definition, operationId, targetActorId, specialistBindings = new Map()) {
  const operation = definition?.spec?.operations?.find((op) => op.id === operationId);
  if (!operation) {
    throw new CoordinationError(
      'validation',
      `dispatchDeclaredOperation: operation "${operationId}" is not declared in this protocol's spec.operations`,
    );
  }

  const matches = [];
  for (const node of definition?.spec?.graph?.nodes ?? []) {
    for (const ref of node.operations ?? []) {
      if (ref.ref === operationId) matches.push({ node, ref });
    }
  }

  const effectiveActorIdOf = (ref) =>
    ref.actor !== undefined
      ? ref.actor
      : ref.specialistSlotRef !== undefined
        ? specialistBindings.get(ref.specialistSlotRef)?.specialistActorId
        : undefined;

  const picked = targetActorId !== undefined ? matches.find((m) => effectiveActorIdOf(m.ref) === targetActorId) : matches[0];
  if (!picked) {
    const unboundSlotMatch = matches.find((m) => m.ref.specialistSlotRef !== undefined && specialistBindings.get(m.ref.specialistSlotRef) === undefined);
    if (targetActorId !== undefined && unboundSlotMatch) {
      throw new CoordinationError(
        'validation',
        `dispatchDeclaredOperation: operation "${operationId}" at node "${unboundSlotMatch.node.id}" is bound to specialist slot "${unboundSlotMatch.ref.specialistSlotRef}" -- no specialist is currently authorized for that slot in this session (or its authorization has expired), so this materialization requires an authorized specialist actor first`,
      );
    }
    throw new CoordinationError(
      'validation',
      targetActorId !== undefined
        ? `dispatchDeclaredOperation: operation "${operationId}" bound to actor "${targetActorId}" is not wired into this protocol's graph -- no node pairs this operation with that actor`
        : `dispatchDeclaredOperation: operation "${operationId}" is not wired into this protocol's graph -- an operation must be reachable from a node to be materialized`,
    );
  }
  const { node: matchedNode, ref: matchedRef } = picked;

  let actorEntry;
  if (matchedRef.specialistSlotRef !== undefined) {
    const bound = specialistBindings.get(matchedRef.specialistSlotRef);
    if (!bound) {
      throw new CoordinationError(
        'validation',
        `dispatchDeclaredOperation: operation "${operationId}" at node "${matchedNode.id}" is bound to specialist slot "${matchedRef.specialistSlotRef}" -- no specialist is currently authorized for that slot in this session (or its authorization has expired), so this materialization requires an authorized specialist actor first`,
      );
    }
    actorEntry = Object.freeze({ id: bound.specialistActorId, role: bound.role });
  } else if (matchedRef.actor === undefined) {
    throw new CoordinationError(
      'validation',
      `dispatchDeclaredOperation: operation "${operationId}" is role-only (no actor binding at node "${matchedNode.id}") -- this materialization requires a bound SessionActor`,
    );
  } else {
    actorEntry = (definition?.spec?.actors ?? []).find((a) => a.id === matchedRef.actor);
    if (!actorEntry) {
      throw new CoordinationError(
        'validation',
        `dispatchDeclaredOperation: operation "${operationId}" node "${matchedNode.id}" references actor "${matchedRef.actor}", which is not declared in spec.actors`,
      );
    }
  }
  if (actorEntry.role !== operation.role) {
    throw new CoordinationError(
      'validation',
      `dispatchDeclaredOperation: actor "${actorEntry.id}" has role "${actorEntry.role}", but operation "${operationId}" declared role "${operation.role}"`,
    );
  }
  return {
    operation,
    actorId: actorEntry.id,
    actorEntry,
    node: matchedNode,
    binding: matchedRef,
    specialistAuthorization: matchedRef.specialistSlotRef !== undefined ? specialistBindings.get(matchedRef.specialistSlotRef) : undefined,
  };
}

/**
 * EVERY distinct actor the graph binds `operationId` to, in graph order.
 * @param {object} definition FlowDefinition
 * @param {string} operationId
 * @returns {string[]}
 */
export function declaredOperationBindingActors(definition, operationId) {
  const actorIds = [];
  for (const node of definition?.spec?.graph?.nodes ?? []) {
    for (const ref of node.operations ?? []) {
      if (ref.ref === operationId && ref.actor && !actorIds.includes(ref.actor)) actorIds.push(ref.actor);
    }
  }
  if (actorIds.length === 0) {
    try {
      return [resolveDeclaredOperationActor(definition, operationId).actorId];
    } catch {
      return [];
    }
  }
  return actorIds.map((actorId) => resolveDeclaredOperationActor(definition, operationId, actorId).actorId);
}

/**
 * Gating operation IDs for actorId in definition.
 * @param {object} definition FlowDefinition
 * @param {string} actorId
 * @returns {string[]}
 */
export function actorGatingOperationIds(definition, actorId) {
  const aggregationOutputOperationRef = definition?.spec?.profile?.completion?.aggregation?.outputOperationRef;
  let aggregationActorId;
  if (aggregationOutputOperationRef !== undefined) {
    const boundActorIds = new Set();
    for (const node of definition?.spec?.graph?.nodes ?? []) {
      for (const ref of node.operations ?? []) {
        if (ref.ref === aggregationOutputOperationRef && ref.actor) boundActorIds.add(ref.actor);
      }
    }
    if (boundActorIds.size === 1) {
      [aggregationActorId] = boundActorIds;
    }
  }

  const operationIds = [];
  for (const node of definition?.spec?.graph?.nodes ?? []) {
    for (const ref of node.operations ?? []) {
      if (ref.actor !== actorId) continue;
      if (ref.ref === aggregationOutputOperationRef && actorId === aggregationActorId) continue;
      const mode = activationModeOf(ref);
      const gates = mode === 'required' || (mode === 'driver-authorized' && ref.contextAccess?.visibilityWindowRef !== undefined);
      if (gates && !operationIds.includes(ref.ref)) operationIds.push(ref.ref);
    }
  }
  return operationIds;
}

/**
 * Pure check whether an Assignment carries the reserved stamp for a declared operation.
 * @param {object} definition FlowDefinition
 * @param {string} operationId
 * @param {object} assignment Loaded Assignment object
 * @returns {boolean}
 */
export function assignmentServesOperation(definition, operationId, assignment) {
  if (!assignment) return false;
  const constraints =
    assignment?.provenance?.inline?.contract?.constraints ??
    assignment?.provenance?.contract?.constraints ??
    assignment?.contract?.constraints ??
    assignment?.constraints;
  return Array.isArray(constraints) && constraints.includes(protocolOperationStamp(definition, operationId));
}

export function lastEventFor(events = [], type, assignmentId) {
  return events.findLast((e) => e.type === type && (e.payload?.assignmentId === assignmentId || e.payload?.id === assignmentId));
}

/**
 * Classify ONE already-operation-verified Assignment.
 * Pure function of events and getRunResult callback.
 * @param {Array<object>} events
 * @param {string} effectiveActorId
 * @param {string} assignmentId
 * @param {object} ctx
 * @param {Function} [ctx.getRunResult]
 * @returns {{satisfied: boolean, reason: string|null, actorId: string, assignmentId: string, runId?: string}}
 */
export function classifyOperationAssignment(events = [], effectiveActorId, assignmentId, { getRunResult = () => null, failedAssignmentIds = new Set() } = {}) {
  const linkedEvent = lastEventFor(events, 'result-linked', assignmentId);
  if (!linkedEvent) return { satisfied: false, reason: 'late', actorId: effectiveActorId, assignmentId };
  if (linkedEvent.payload?.status === 'failed' || (failedAssignmentIds && failedAssignmentIds.has(assignmentId))) {
    return { satisfied: false, reason: 'failed', actorId: effectiveActorId, assignmentId, runId: linkedEvent.payload?.runId };
  }
  const runResult = getRunResult(assignmentId, linkedEvent.payload?.runId);
  if (runResult) {
    if (runResult.status === 'failed' || runResult.confidence === 'failed' || runResult.confidence === 'no-evidence') {
      return { satisfied: false, reason: 'failed', actorId: effectiveActorId, assignmentId, runId: runResult.runId ?? linkedEvent.payload?.runId };
    }
    return { satisfied: true, reason: null, actorId: effectiveActorId, assignmentId, runId: runResult.runId };
  }
  return { satisfied: true, reason: null, actorId: effectiveActorId, assignmentId, runId: linkedEvent.payload?.runId };
}

/**
 * Schema-3 accepted-disposition evidence chain verification (pure).
 * failed assignment -> successful work-product assignment -> clean recheck
 */
export function hasAcceptedDispositionRemediation(
  definition,
  failedAssignmentId,
  recheckAssignmentId,
  { events = [], getAssignment = () => null, getRunResult = () => null, lastFailedLinkedIndex },
) {
  const recheckCreatedIndex = events.findIndex(
    (event) => event.type === 'assignment-created' && (event.payload?.assignmentId === recheckAssignmentId || event.payload?.id === recheckAssignmentId),
  );
  if (recheckCreatedIndex <= lastFailedLinkedIndex) return false;

  const recheckAssignment = getAssignment(recheckAssignmentId);
  if (!recheckAssignment) return false;
  const recheckContextRefs = recheckAssignment?.provenance?.inline?.contract?.contextRefs;
  if (!Array.isArray(recheckContextRefs)) return false;

  const workProductOperationIds = (definition?.spec?.operations ?? [])
    .filter((operation) => operation.result?.kind === 'work-product')
    .map((operation) => operation.id);

  return recheckContextRefs.some((remediationAssignmentId) => {
    const remediationCreatedIndex = events.findIndex(
      (event, index) =>
        index > lastFailedLinkedIndex &&
        index < recheckCreatedIndex &&
        event.type === 'assignment-created' &&
        (event.payload?.assignmentId === remediationAssignmentId || event.payload?.id === remediationAssignmentId),
    );
    if (remediationCreatedIndex === -1) return false;

    const remediationAssignment = getAssignment(remediationAssignmentId);
    const remediationContextRefs = remediationAssignment?.provenance?.inline?.contract?.contextRefs;
    if (!Array.isArray(remediationContextRefs) || !remediationContextRefs.includes(failedAssignmentId)) return false;

    if (!workProductOperationIds.some((operationId) => assignmentServesOperation(definition, operationId, remediationAssignment))) {
      return false;
    }

    const linkedEvent = events.findLast(
      (event, index) =>
        index > remediationCreatedIndex &&
        index < recheckCreatedIndex &&
        event.type === 'result-linked' &&
        event.payload?.assignmentId === remediationAssignmentId,
    );
    if (!linkedEvent) return false;
    const runResult = getRunResult(remediationAssignmentId, linkedEvent.payload?.runId);
    if (!runResult) return false;
    return runResult.status !== 'failed' && runResult.confidence !== 'failed' && runResult.confidence !== 'no-evidence';
  });
}

/**
 * Pure resolution of recheck discharge for a failed required operation.
 */
export function resolveRecheckDischarge(
  definition,
  gatingOperationId,
  originalActorId,
  failedOutcome,
  { events = [], getAssignment = () => null, getRunResult = () => null, replacedBy = new Map(), schemaVersion = '3' } = {},
) {
  if (!definition || failedOutcome?.reason !== 'failed') return null;

  let effectiveActorId = originalActorId;
  const seen = new Set();
  while (replacedBy.has(effectiveActorId) && !seen.has(effectiveActorId)) {
    seen.add(effectiveActorId);
    effectiveActorId = replacedBy.get(effectiveActorId);
  }

  const rechecks = [];
  for (const node of definition?.spec?.graph?.nodes ?? []) {
    for (const ref of node.operations ?? []) {
      if (ref.actor !== originalActorId) continue;
      const targetOp = ref.rechecks?.operation ?? (typeof ref.rechecks === 'string' ? ref.rechecks : undefined);
      if (targetOp === gatingOperationId) {
        rechecks.push({ node, ref, dischargeOn: ref.rechecks?.dischargeOn ?? ['accepted'] });
      }
    }
  }
  if (rechecks.length === 0) return null;

  const lastFailedLinkedIndex = events.findLastIndex(
    (event) => event.type === 'result-linked' && event.payload?.assignmentId === failedOutcome.assignmentId,
  );
  if (lastFailedLinkedIndex === -1) return null;

  const dispositionEvent = events.findLast(
    (event, index) =>
      index > lastFailedLinkedIndex &&
      event.type === 'driver-disposition-recorded' &&
      event.payload?.targetRef === failedOutcome.assignmentId,
  );
  if (!dispositionEvent) return null;

  let lastOutcome = null;
  for (const { ref: recheckRef, dischargeOn } of rechecks) {
    if (!dischargeOn.includes(dispositionEvent.payload?.disposition)) continue;

    const recheckOperationId = recheckRef.ref;
    const candidateAssignmentIds = events
      .map((event, index) => ({ event, index }))
      .filter(
        ({ event, index }) =>
          index > lastFailedLinkedIndex &&
          event.type === 'assignment-created' &&
          event.payload?.actorId === effectiveActorId,
      )
      .map(({ event }) => event.payload?.assignmentId || event.payload?.id)
      .filter((assignmentId) => assignmentServesOperation(definition, recheckOperationId, getAssignment(assignmentId)));

    for (const assignmentId of candidateAssignmentIds) {
      lastOutcome = classifyOperationAssignment(events, effectiveActorId, assignmentId, { getRunResult });
      if (lastOutcome.satisfied) {
        if (
          schemaVersion === '3' &&
          dispositionEvent.payload?.disposition === 'accepted' &&
          !hasAcceptedDispositionRemediation(definition, failedOutcome.assignmentId, assignmentId, {
            events,
            getAssignment,
            getRunResult,
            lastFailedLinkedIndex,
          })
        ) {
          lastOutcome = null;
          continue;
        }
        return { ...lastOutcome, supersededAssignmentId: failedOutcome.assignmentId };
      }
    }
  }
  return lastOutcome;
}

/**
 * Pure resolution of the outcome of ONE graph binding of an operation.
 */
export function resolveBindingOutcome(
  definition,
  operationId,
  boundActorId,
  { events = [], getAssignment = () => null, getRunResult = () => null, failedAssignmentIds = new Set(), replacedBy = new Map(), schemaVersion = '3' } = {},
) {
  let effectiveActorId = boundActorId;
  const seen = new Set();
  while (replacedBy.has(effectiveActorId) && !seen.has(effectiveActorId)) {
    seen.add(effectiveActorId);
    effectiveActorId = replacedBy.get(effectiveActorId);
  }

  const assignmentIds = events
    .filter((event) => {
      if (event.type !== 'assignment-created' || event.payload?.actorId !== effectiveActorId) return false;
      const asgnId = event.payload?.assignmentId || event.payload?.id;
      const asgn = getAssignment(asgnId);
      if (asgn) {
        return assignmentServesOperation(definition, operationId, asgn);
      }
      if (event.payload?.operationId === operationId) return true;
      if (Array.isArray(event.payload?.constraints) && event.payload.constraints.includes(protocolOperationStamp(definition, operationId))) return true;
      return false;
    })
    .map((event) => event.payload?.assignmentId || event.payload?.id);

  if (assignmentIds.length === 0) {
    return { boundActorId, satisfied: false, reason: 'missing', actorId: effectiveActorId, assignmentId: null };
  }
  let lastOutcome;
  for (const assignmentId of assignmentIds) {
    lastOutcome = classifyOperationAssignment(events, effectiveActorId, assignmentId, { getRunResult, failedAssignmentIds });
    if (lastOutcome.satisfied) return { boundActorId, ...lastOutcome };
  }
  return { boundActorId, ...lastOutcome };
}

/**
 * Pure resolution of ONE source operation outcome across all bound actors.
 */
export function resolveOperationOutcome(definition, operationId, ctx) {
  const branches = declaredOperationBindingActors(definition, operationId).map((boundActorId) =>
    resolveBindingOutcome(definition, operationId, boundActorId, ctx),
  );
  if (branches.length === 0) {
    return {
      operationRef: operationId,
      satisfied: false,
      reason: 'missing',
      actorId: null,
      assignmentId: null,
      branches: [],
    };
  }
  const reported = branches.find((branch) => !branch.satisfied) ?? branches[0];
  return {
    operationRef: operationId,
    satisfied: branches.every((branch) => branch.satisfied),
    reason: reported.reason,
    actorId: reported.actorId,
    assignmentId: reported.assignmentId,
    ...(reported.runId !== undefined ? { runId: reported.runId } : {}),
    branches: Object.freeze(branches.map((branch) => Object.freeze(branch))),
  };
}

/**
 * Derive whether `windowId` is currently OPEN: pure function of definition, events, and records.
 */
export function evaluateVisibilityWindowState(
  definition,
  windowId,
  { events = [], getAssignment = () => null, getRunResult = () => null, failedAssignmentIds = new Set(), replacedBy: givenReplacedBy = null, schemaVersion = '3' } = {},
) {
  const window = (definition?.spec?.profile?.topology?.visibilityWindows ?? []).find((w) => w.id === windowId);
  if (!window) {
    throw new CoordinationError(
      'dangling-ref',
      `deriveVisibilityWindowState: visibility window "${windowId}" is not declared on protocol "${definition?.metadata?.id}@${definition?.metadata?.version}"`,
    );
  }
  const replacedBy = givenReplacedBy ?? buildActorReplacementMap(events);
  const operationRefs = window.opensAfter?.operationRefs ?? [];
  const sources = operationRefs.map((operationRef) =>
    resolveOperationOutcome(definition, operationRef, { events, getAssignment, getRunResult, failedAssignmentIds, replacedBy, schemaVersion }),
  );
  const open = operationRefs.length === 0 || sources.every((source) => source.satisfied);
  return Object.freeze({ window, open, sources: Object.freeze(sources.map((s) => Object.freeze(s))) });
}

/**
 * Pure evaluation of visibility windows declared in protocol topology.
 * Delegates purely to evaluateVisibilityWindowState for each declared window.
 * @param {object} definition FlowDefinition or null
 * @param {object|Array} ctx Context object ({ events, getAssignment, getRunResult }) or event list
 * @returns {Array<{windowId: string, open: boolean, requiredOperations: string[], sources?: Array}>}
 */
export function evaluateVisibilityWindows(definition, ctx = {}) {
  const windows = definition?.spec?.profile?.topology?.visibilityWindows ?? [];
  if (windows.length === 0) return [];

  const evalCtx = (ctx && typeof ctx === 'object' && ('events' in ctx || 'getAssignment' in ctx))
    ? ctx
    : { events: Array.isArray(ctx) ? ctx : [] };

  return windows.map((w) => {
    const derived = evaluateVisibilityWindowState(definition, w.id, evalCtx);
    return {
      windowId: w.id,
      open: derived.open,
      requiredOperations: w.opensAfter?.operationRefs ?? [],
      sources: derived.sources,
    };
  });
}

/**
 * Collect all graph operation bindings declared with activation.mode: 'driver-authorized'.
 */
export function collectDriverAuthorizedBindings(definition) {
  if (!definition?.spec?.graph?.nodes) return [];
  const bindings = [];
  for (const node of definition.spec.graph.nodes) {
    for (const op of node.operations ?? []) {
      if (op?.activation?.mode === 'driver-authorized') {
        bindings.push({
          nodeId: node.id,
          operationId: op.ref || op.id,
          actorId: op.actor,
          ...(op.contextAccess?.visibilityWindowRef ? { visibilityWindowRef: op.contextAccess.visibilityWindowRef } : {}),
        });
      }
    }
  }
  return bindings;
}

/**
 * Collect all graph operation bindings declared with activation.mode !== 'driver-authorized'.
 */
export function collectRequiredBindings(definition) {
  if (!definition?.spec?.graph?.nodes) return [];
  const bindings = [];
  for (const node of definition.spec.graph.nodes) {
    for (const op of node.operations ?? []) {
      if (op?.activation?.mode !== 'driver-authorized') {
        bindings.push({ nodeId: node.id, operationId: op.ref, actorId: op.actor });
      }
    }
  }
  return bindings;
}

/**
 * Pure evaluation of driver-authorized bindings against issued authorizations.
 */
export function evaluateDriverAuthorizedBindings(definition, authorizations = []) {
  if (!definition) {
    return { declared: [], authorized: [], pending: [] };
  }
  const declared = collectDriverAuthorizedBindings(definition);
  const authorizedKeys = new Set(
    (authorizations || []).map((a) => `${a.nodeId}::${a.operationId}`),
  );
  const pending = declared.filter((b) => !authorizedKeys.has(`${b.nodeId}::${b.operationId}`));
  const authorized = declared.filter((b) => authorizedKeys.has(`${b.nodeId}::${b.operationId}`));

  return { declared, authorized, pending };
}

/**
 * Pure evaluation of specialist slot availability from protocol topology and replayed authorizations.
 */
export function evaluateSpecialistSlots(definition, specialistAuthorizations = []) {
  const slots = definition?.spec?.profile?.topology?.specialistSlots ?? [];
  if (slots.length === 0) return [];

  const boundMap = new Map();
  for (const auth of specialistAuthorizations || []) {
    if (auth.slotId && auth.specialistActorId) {
      boundMap.set(auth.slotId, auth.specialistActorId);
    }
  }

  return slots.map((slot) => ({
    slotId: slot.id,
    role: slot.role,
    bound: boundMap.has(slot.id),
    specialistActorId: boundMap.get(slot.id) ?? null,
  }));
}

/**
 * Pure 1:1 matching of created assignments to required bindings.
 * Matches explicit operationId in payload, or verifies that the assignment serves the operation.
 */
export function matchAssignmentsToRequiredBindings(
  requiredBindings = [],
  events = [],
  { definition = null, getAssignment = () => null } = {},
) {
  const assignedBindings = new Set();
  const assignmentToBinding = new Map();

  for (const ev of events) {
    if (ev.type !== 'assignment-created') continue;
    const p = ev.payload || {};
    const asgnId = p.assignmentId || p.id;
    if (!asgnId) continue;

    // Pass 1: explicit operationId
    if (p.operationId) {
      const match = requiredBindings.find(
        (r) => r.operationId === p.operationId && (!p.actorId || r.actorId === p.actorId) && !assignedBindings.has(r),
      );
      if (match) {
        assignedBindings.add(match);
        assignmentToBinding.set(asgnId, match);
        continue;
      }
    }

    // Pass 2: only match if the assignment is verified to serve the operation
    const assignment = getAssignment(asgnId);
    if (assignment && definition) {
      const match = requiredBindings.find(
        (r) => (!p.actorId || r.actorId === p.actorId) &&
               !assignedBindings.has(r) &&
               assignmentServesOperation(definition, r.operationId, assignment),
      );
      if (match) {
        assignedBindings.add(match);
        assignmentToBinding.set(asgnId, match);
      }
    }
  }

  return { assignedBindings, assignmentToBinding };
}

/**
 * Master pure classification of session quorum against every required SessionActor.
 * Pure function of definition, manifest, events, and records (via callbacks).
 * Shared identically by kernel close and show/chain/actions projector.
 */
export function classifySessionQuorum(
  coordinationId,
  manifest,
  events = [],
  ctx = {},
  opts = {},
) {
  let definition = null;
  if (manifest?.definitionRef) {
    let resolved = null;
    try {
      if (ctx?.resolvedDefinition) {
        resolved = ctx.resolvedDefinition;
      } else if (typeof ctx?.loadDefinition === 'function') {
        resolved = ctx.loadDefinition(manifest, opts);
      }
    } catch (err) {
      if (err.category === 'corrupt-log') throw err;
      resolved = null;
    }
    const drifted = resolved !== null && resolved.metadata?.version !== manifest.definitionRef.version;

    if (opts.enforceDefinitionVersion) {
      if (resolved === null) {
        throw new CoordinationError(
          'validation',
          `classifySessionQuorum: session "${coordinationId}" was opened against definition "${manifest.definitionRef.id}@${manifest.definitionRef.version}", but the definition could not be resolved -- refusing to close against an unresolvable definition`,
        );
      }
      if (drifted) {
        throw new CoordinationError(
          'validation',
          `classifySessionQuorum: session "${coordinationId}" was opened against definition "${manifest.definitionRef.id}@${manifest.definitionRef.version}", but the resolved definition is now version "${resolved.metadata?.version}" -- refusing to close against a drifted definition`,
        );
      }
      definition = resolved;
    } else {
      definition = drifted ? null : resolved;
    }
  }

  const requiredActorIds = ((manifest?.actors && manifest.actors.length > 0)
    ? manifest.actors
    : (definition?.spec?.actors ?? [])
  ).map((actor) => actor.id);

  const replacedBy = new Map();
  const replacementTargets = new Set();
  for (const event of events) {
    if (event.type === 'actor-replaced' && event.payload?.oldActorId && event.payload?.replacementActorId) {
      replacedBy.set(event.payload.oldActorId, event.payload.replacementActorId);
      replacementTargets.add(event.payload.replacementActorId);
    }
  }
  function resolveEffectiveActor(id) {
    let current = id;
    const seen = new Set();
    while (replacedBy.has(current) && !seen.has(current)) {
      seen.add(current);
      current = replacedBy.get(current);
    }
    return current;
  }

  const completed = [];
  const failed = [];
  const late = [];
  const missing = [];
  const replaced = [];

  const getAssignment = ctx?.getAssignment ?? (() => null);
  const getRunResult = ctx?.getRunResult ?? (() => null);

  for (const originalActorId of requiredActorIds) {
    if (replacementTargets.has(originalActorId)) continue;
    const effectiveId = resolveEffectiveActor(originalActorId);
    if (effectiveId !== originalActorId) {
      replaced.push({ actorId: originalActorId, replacedBy: effectiveId });
    }

    const gatingOperationIds = definition ? actorGatingOperationIds(definition, originalActorId) : [];
    if (gatingOperationIds.length > 0) {
      const outcomes = gatingOperationIds.map((operationId) =>
        resolveBindingOutcome(definition, operationId, originalActorId, {
          events,
          getAssignment,
          getRunResult,
          replacedBy,
          schemaVersion: manifest?.schemaVersion,
        }),
      );
      const unsatisfiedIndex = outcomes.findIndex((outcome) => !outcome.satisfied);
      if (unsatisfiedIndex === -1) {
        const last = outcomes[outcomes.length - 1];
        completed.push({ actorId: originalActorId, assignmentId: last.assignmentId, runId: last.runId });
        continue;
      }
      const unsatisfied = outcomes[unsatisfiedIndex];
      if (unsatisfied.reason === 'missing') {
        missing.push({ actorId: originalActorId });
      } else if (unsatisfied.reason === 'late') {
        late.push({ actorId: originalActorId, assignmentId: unsatisfied.assignmentId });
      } else {
        const gatingOperationId = gatingOperationIds[unsatisfiedIndex];
        const discharge = resolveRecheckDischarge(definition, gatingOperationId, originalActorId, unsatisfied, {
          events,
          getAssignment,
          getRunResult,
          replacedBy,
          schemaVersion: manifest?.schemaVersion,
        });
        if (discharge && discharge.satisfied) {
          completed.push({
            actorId: originalActorId,
            assignmentId: discharge.assignmentId,
            runId: discharge.runId,
            supersededAssignmentId: discharge.supersededAssignmentId,
          });
        } else if (discharge && discharge.reason === 'late') {
          late.push({ actorId: originalActorId, assignmentId: discharge.assignmentId });
        } else {
          failed.push({ actorId: originalActorId, assignmentId: unsatisfied.assignmentId, runId: unsatisfied.runId });
        }
      }
      continue;
    }

    // Fallback: no gating binding anywhere for this actor
    const allCreatedEvents = events.filter((event) => event.type === 'assignment-created' && (event.payload?.actorId === effectiveId));
    if (allCreatedEvents.length === 0) {
      missing.push({ actorId: originalActorId });
      continue;
    }
    const firstCreatedEvent = allCreatedEvents[0];
    const firstOperationId = firstCreatedEvent.payload?.operationId;
    const stampedSameBinding =
      definition && firstOperationId
        ? allCreatedEvents.filter((event) =>
            assignmentServesOperation(definition, firstOperationId, getAssignment(event.payload?.assignmentId || event.payload?.id)),
          )
        : [];
    const createdEvents = stampedSameBinding.length > 0 ? stampedSameBinding : [firstCreatedEvent];
    let lastOutcome;
    for (const createdEvent of createdEvents) {
      lastOutcome = classifyOperationAssignment(events, effectiveId, createdEvent.payload?.assignmentId || createdEvent.payload?.id, { getRunResult });
      if (lastOutcome?.satisfied) break;
    }
    if (lastOutcome?.satisfied) {
      completed.push({ actorId: originalActorId, assignmentId: lastOutcome.assignmentId, runId: lastOutcome.runId });
    } else if (lastOutcome?.reason === 'late') {
      late.push({ actorId: originalActorId, assignmentId: lastOutcome.assignmentId });
    } else {
      failed.push({ actorId: originalActorId, assignmentId: lastOutcome?.assignmentId, runId: lastOutcome?.runId });
    }
  }

  return Object.freeze({
    requiredActorIds: Object.freeze(requiredActorIds),
    completed: Object.freeze(completed.map((e) => Object.freeze(e))),
    failed: Object.freeze(failed.map((e) => Object.freeze(e))),
    late: Object.freeze(late.map((e) => Object.freeze(e))),
    missing: Object.freeze(missing.map((e) => Object.freeze(e))),
    replaced: Object.freeze(replaced.map((e) => Object.freeze(e))),
  });
}

/**
 * Pure evaluation of blockers preventing session close.
 * 1:1 projection of the kernel's exact close verification in closeSessionByQuorumLocked.
 */
export function evaluateClosePrerequisites({
  manifest,
  quorum = null,
  pendingDriverAuthorizations = [],
  aggregations = [],
  definition = null,
  settledOperationIds = null,
  requiredBindings = null,
  settledRequiredBindings = null,
  events = [],
  ctx = {},
  opts = {},
} = {}) {
  const blockers = [];

  if (manifest.status !== 'active') {
    blockers.push({
      kind: 'session-inactive',
      blocking: true,
      reason: `Session "${manifest.coordinationId}" is already ${manifest.status}`,
    });
    return { readyToClose: false, blockers };
  }

  // Definition unresolvable or drifted check
  if (manifest.definitionRef) {
    if (!definition) {
      blockers.push({
        kind: 'definition-unresolvable',
        blocking: true,
        reason: `Session "${manifest.coordinationId}" was opened against definition "${manifest.definitionRef.id}@${manifest.definitionRef.version}", but the definition could not be resolved`,
      });
    } else if (definition.metadata?.version !== manifest.definitionRef.version) {
      blockers.push({
        kind: 'definition-drift',
        blocking: true,
        reason: `Session "${manifest.coordinationId}" was opened against definition "${manifest.definitionRef.id}@${manifest.definitionRef.version}", but the resolved definition is now version "${definition.metadata?.version}"`,
      });
    }
  }

  // Check that session has declared actors
  const hasActors = (Array.isArray(manifest.actors) && manifest.actors.length > 0) ||
                    (definition && Array.isArray(definition.spec?.actors) && definition.spec.actors.length > 0) ||
                    (quorum && ((quorum.completed?.length || 0) > 0 || (quorum.missing?.length || 0) > 0 || (quorum.failed?.length || 0) > 0));
  if (!hasActors && (!manifest.assignmentRefs || manifest.assignmentRefs.length === 0)) {
    blockers.push({
      kind: 'no-actors-declared',
      blocking: true,
      reason: `Session "${manifest.coordinationId}" has no declared actors and no assignments`,
    });
  }

  const effectiveAggregationId = opts.aggregationId ?? ctx.aggregationId;
  const aggList = Array.isArray(aggregations) ? aggregations : [];

  if (effectiveAggregationId !== undefined) {
    const validated = aggList.find((record) => record.aggregationId === effectiveAggregationId);
    if (!validated) {
      blockers.push({
        kind: 'dangling-aggregation-ref',
        blocking: true,
        reason: `closeSessionByQuorum: session "${manifest.coordinationId}" has no valid "aggregation-validated" event for aggregation "${effectiveAggregationId}" -- refusing to close against an aggregation this session never validated`,
      });
    } else if (validated.outcome !== 'consensus') {
      blockers.push({
        kind: 'aggregation-no-consensus',
        blocking: true,
        reason: `closeSessionByQuorum: aggregation "${effectiveAggregationId}" of session "${manifest.coordinationId}" validated as "${validated.outcome}", not "consensus" -- refusing to close; resolve the aggregation and validate a new one, or close this session by another declared route`,
      });
    }
  } else if (definition?.spec?.profile?.completion?.aggregation !== undefined) {
    if (aggList.length === 0) {
      blockers.push({
        kind: 'pending-aggregation',
        blocking: true,
        reason: `Protocol declares completion.aggregation, but session has validated no aggregation`,
      });
    } else {
      const latestAgg = aggList[aggList.length - 1];
      if (latestAgg?.outcome && latestAgg.outcome !== 'consensus') {
        blockers.push({
          kind: 'aggregation-no-consensus',
          blocking: true,
          reason: `Protocol declares completion.aggregation, but latest validated aggregation "${latestAgg?.aggregationId}" reached outcome "${latestAgg?.outcome}", not "consensus"`,
        });
      }
    }
  }

  // Resolve quorum
  let effectiveQuorum = quorum;
  if (!effectiveQuorum && (events.length > 0 || hasActors)) {
    try {
      effectiveQuorum = classifySessionQuorum(
        manifest.coordinationId,
        manifest,
        events,
        { ...ctx, resolvedDefinition: definition },
        { ...opts, enforceDefinitionVersion: true },
      );
    } catch (err) {
      blockers.push({
        kind: 'quorum-evaluation-failed',
        blocking: true,
        reason: err.message,
      });
      return { readyToClose: false, blockers };
    }
  }

  if (effectiveQuorum) {
    const incomplete = [
      ...(Array.isArray(effectiveQuorum.failed) ? effectiveQuorum.failed : []),
      ...(Array.isArray(effectiveQuorum.late) ? effectiveQuorum.late : []),
      ...(Array.isArray(effectiveQuorum.missing) ? effectiveQuorum.missing : []),
    ];
    const incompleteActorIds = incomplete.map((entry) => (typeof entry === 'string' ? entry : entry.actorId));

    if (incompleteActorIds.length > 0) {
      const policy = manifest?.partialPolicy;
      if (!policy) {
        blockers.push({
          kind: 'missing-quorum-actors',
          blocking: true,
          reason: `Quorum is missing required actor(s): ${incompleteActorIds.join(', ')} and session declares no partialPolicy`,
        });
      } else {
        const allowed = new Set(policy.allowedOmissions ?? []);
        const notAllowed = incompleteActorIds.filter((id) => !allowed.has(id));
        if (notAllowed.length > 0) {
          blockers.push({
            kind: 'missing-quorum-actors',
            blocking: true,
            reason: `Quorum actor(s) [${notAllowed.join(', ')}] are incomplete and not in partialPolicy.allowedOmissions`,
          });
        }
        if (policy.minimumActors !== undefined && (effectiveQuorum.completed?.length || 0) < policy.minimumActors) {
          blockers.push({
            kind: 'insufficient-completed-actors',
            blocking: true,
            reason: `Only ${effectiveQuorum.completed?.length || 0} actor(s) completed, below partialPolicy.minimumActors (${policy.minimumActors})`,
          });
        }
      }
    }
  } else {
    // Quorum was not supplied directly: evaluate required graph bindings
    const req = requiredBindings ?? (definition ? collectRequiredBindings(definition) : []);
    if (req.length > 0) {
      const unsettled = req.filter((b) => {
        if (settledRequiredBindings) {
          return !settledRequiredBindings.has(b);
        }
        if (settledOperationIds) {
          return !settledOperationIds.has(b.operationId);
        }
        return true;
      });

      if (unsettled.length > 0) {
        const incompleteActorIds = [...new Set(unsettled.map((r) => r.actorId))];
        const policy = manifest?.partialPolicy;
        if (!policy) {
          blockers.push({
            kind: 'missing-quorum-actors',
            blocking: true,
            reason: `Quorum is missing required actor(s): ${incompleteActorIds.join(', ')} and session declares no partialPolicy`,
          });
        } else {
          const allowed = new Set(policy.allowedOmissions ?? []);
          const notAllowed = incompleteActorIds.filter((id) => !allowed.has(id));
          if (notAllowed.length > 0) {
            blockers.push({
              kind: 'missing-quorum-actors',
              blocking: true,
              reason: `Quorum actor(s) [${notAllowed.join(', ')}] are incomplete and not in partialPolicy.allowedOmissions`,
            });
          }
          if (policy.minimumActors !== undefined) {
            const completedCount = req.length - unsettled.length;
            if (completedCount < policy.minimumActors) {
              blockers.push({
                kind: 'insufficient-completed-actors',
                blocking: true,
                reason: `Only ${completedCount} actor(s) completed, below partialPolicy.minimumActors (${policy.minimumActors})`,
              });
            }
          }
        }
      }
    }
  }

  const readyToClose = blockers.length === 0;
  return { readyToClose, blockers };
}

/**
 * Master pure legality facts evaluator.
 */
export function evaluateLegalityFacts({
  manifest,
  events: explicitEvents = null,
  replayed = null,
  definition = null,
  quorum = null,
  phase = null,
  aggregations: explicitAggregations = null,
  fgosDir = null,
  visibilityWindows: precomputedVisibilityWindows = null,
  getAssignment = null,
  getRunResult = null,
} = {}) {
  const authorizations = replayed?.authorizations ?? [];
  const specialistAuthorizations = replayed?.specialistAuthorizations ?? [];
  const aggregations = explicitAggregations ?? replayed?.aggregations ?? [];
  const humanTurns = replayed?.humanTurns ?? [];
  const dispositions = replayed?.dispositions ?? [];

  const { declared, authorized, pending: pendingDriverAuthorizations } =
    evaluateDriverAuthorizedBindings(definition, authorizations);

  const requiredBindings = collectRequiredBindings(definition);
  const specialistSlots = evaluateSpecialistSlots(definition, specialistAuthorizations);

  const eventList = explicitEvents ?? replayed?.events ?? (Array.isArray(manifest?.events) ? manifest.events : []);

  const failedAssignmentIds = new Set();
  if (quorum?.failed) {
    for (const f of quorum.failed) {
      if (f.assignmentId) failedAssignmentIds.add(f.assignmentId);
    }
  }

  const { assignedBindings, assignmentToBinding } = matchAssignmentsToRequiredBindings(requiredBindings, eventList, {
    definition,
    getAssignment: getAssignment ?? (() => null),
  });
  const settledRequiredBindings = new Set();
  const settledOperations = new Set();

  for (const auth of authorizations) {
    if (auth.consumedByAssignmentId && !failedAssignmentIds.has(auth.consumedByAssignmentId)) {
      settledOperations.add(auth.operationId);
    }
  }

  for (const ev of eventList) {
    if (ev.type === 'result-linked') {
      const asgnId = ev.payload?.assignmentId;
      if (asgnId && failedAssignmentIds.has(asgnId)) continue;
      const matched = assignmentToBinding.get(asgnId);
      if (matched) {
        settledRequiredBindings.add(matched);
        if (matched.operationId) settledOperations.add(matched.operationId);
      } else if (ev.payload?.operationId) {
        settledOperations.add(ev.payload.operationId);
      }
    }
  }

  let visibilityWindows = precomputedVisibilityWindows;
  if (!visibilityWindows) {
    visibilityWindows = evaluateVisibilityWindows(definition, {
      events: eventList,
      getAssignment: getAssignment ?? (() => null),
      getRunResult: getRunResult ?? (() => null),
      failedAssignmentIds,
      schemaVersion: String(manifest.schemaVersion || '1'),
    });
  }

  const { readyToClose, blockers } = evaluateClosePrerequisites({
    manifest,
    quorum,
    pendingDriverAuthorizations,
    aggregations,
    definition,
    requiredBindings,
    settledRequiredBindings,
    settledOperationIds: settledOperations,
    events: eventList,
    ctx: { getAssignment, getRunResult },
  });

  return {
    coordinationId: manifest.coordinationId,
    schemaVersion: String(manifest.schemaVersion || '1'),
    status: manifest.status,
    phase: phase ?? (manifest.status === 'active' ? (manifest.assignmentRefs?.length ? 'running' : 'planned') : manifest.status),
    definitionRef: manifest.definitionRef ?? null,
    snapshotRef: manifest.snapshotRef ?? null,
    requiredBindings,
    driverAuthorizedBindings: {
      declared,
      authorized,
      pending: pendingDriverAuthorizations,
    },
    specialistSlots,
    visibilityWindows,
    humanTurnsCount: humanTurns.length,
    dispositionsCount: dispositions.length,
    aggregationsCount: aggregations.length,
    quorum: quorum ?? null,
    readyToClose,
    blockers,
  };
}
