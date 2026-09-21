// coordination/actions-projector.mjs — pure read-only action/status projection (Unit 1A).
// Contract version: coordination-actions.v1
// Pure function: no filesystem I/O, no mutation, no hardcoded protocol IDs, no driver judgment.

import crypto from 'node:crypto';
import {
  collectDriverAuthorizedBindings,
  collectRequiredBindings,
  matchAssignmentsToRequiredBindings,
  evaluateDriverAuthorizedBindings,
  evaluateSpecialistSlots,
  evaluateVisibilityWindows,
  evaluateClosePrerequisites,
  evaluateLegalityFacts,
  resolveDeclaredOperationActor,
  assignmentServesOperation,
} from './legality-facts.mjs';
import { CONTRIBUTION_TYPES } from '../deliberation/schema.mjs';

export const ACTIONS_CONTRACT_VERSION = 'coordination-actions.v1';

export function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function stableStringify(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(stableStringify).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',') + '}';
}

/**
 * Compute actionKey binding:
 * contract version, coordination id, schema, event sequence, definition digest,
 * action kind, exact target, required/optional input schema, allowed values.
 */
export function computeActionKey({
  contractVersion = ACTIONS_CONTRACT_VERSION,
  coordinationId,
  schemaVersion,
  eventSeq,
  definitionDigest,
  kind,
  target,
  requiredInputs = [],
  optionalInputs = [],
  allowedValues = null,
}) {
  const payload = {
    contractVersion,
    coordinationId,
    schemaVersion: String(schemaVersion),
    eventSeq: Number(eventSeq),
    definitionDigest: definitionDigest ?? 'none',
    kind,
    target: target ?? {},
    requiredInputs: [...requiredInputs].sort(),
    optionalInputs: [...optionalInputs].sort(),
    allowedValues: allowedValues ?? null,
  };
  return 'sha256:' + sha256(stableStringify(payload));
}

export function computeActionSetDigest(rawActions) {
  const sorted = [...rawActions].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
    return stableStringify(a.target).localeCompare(stableStringify(b.target));
  });
  return 'sha256:' + sha256(stableStringify(sorted));
}

export function computeSnapshotDigest({
  coordinationId,
  schemaVersion,
  status,
  eventSeq,
  assignmentRefs = [],
  definitionDigest = null,
  quorum = null,
}) {
  const payload = {
    coordinationId,
    schemaVersion: String(schemaVersion),
    status,
    eventSeq: Number(eventSeq),
    assignmentRefs: [...assignmentRefs].sort(),
    definitionDigest: definitionDigest ?? 'none',
    quorum: quorum
      ? {
          missing: Array.isArray(quorum.missing) ? [...quorum.missing].sort() : [],
          failed: Array.isArray(quorum.failed) ? [...quorum.failed].sort() : [],
          completed: Array.isArray(quorum.completed) ? [...quorum.completed].sort() : [],
        }
      : null,
  };
  return 'sha256:' + sha256(stableStringify(payload));
}

/**
 * Pure projector for coordination-actions.v1.
 *
 * @param {object} inputs
 * @param {object} inputs.manifest Session manifest
 * @param {Array<object>} [inputs.events] Raw event list
 * @param {object} [inputs.replayed] Output of replaySession
 * @param {object} [inputs.definition] Immutable FlowDefinition
 * @param {object} [inputs.quorum] Quorum evaluation
 * @param {string} [inputs.phase] Derived session phase
 * @returns {object} Target payload for coordination-actions.v1
 */
export function projectCoordinationActions({
  manifest,
  events = [],
  replayed = null,
  definition = null,
  quorum = null,
  phase = null,
  visibilityWindows = null,
  getAssignment = null,
} = {}) {
  if (!manifest || typeof manifest !== 'object') {
    throw new Error('projectCoordinationActions requires a valid manifest object');
  }

  const coordinationId = manifest.coordinationId;
  const schemaVersion = String(manifest.schemaVersion || '1');
  const eventList = Array.isArray(events) ? events : (replayed?.events ?? []);
  const eventSeq = eventList.length;

  // Definition digest binding:
  // - Schema 3: uses manifest.snapshotRef.digest (or definition.metadata.digest), which is an immutable content pin of snapshot.json.
  // - Schema 1/2: falls back to sha256(stableStringify(manifest.definitionRef)).
  //   IMPORTANT (F-R08): For Schema 1/2, this hash represents an IDENTITY PIN ({ id, version }), NOT a content pin.
  //   It pins the referenced FlowDefinition identity and version, but does NOT guarantee FlowDefinition file content stability across edits.
  let definitionDigest = null;
  const rawDigest =
    manifest.snapshotRef?.digest ??
    definition?.metadata?.digest ??
    (manifest.definitionRef ? sha256(stableStringify(manifest.definitionRef)) : null);
  if (rawDigest) {
    definitionDigest = rawDigest.startsWith('sha256:') ? rawDigest : `sha256:${rawDigest}`;
  }

  // Compute shared pure legality facts
  const facts = evaluateLegalityFacts({
    manifest,
    events: eventList,
    replayed,
    definition,
    quorum,
    phase,
    visibilityWindows,
    getAssignment,
  });

  const rawActions = [];

  if (manifest.status === 'active') {
    const authorizations = replayed?.authorizations ?? [];
    const authorizedMap = new Map();
    for (const a of authorizations) {
      authorizedMap.set(`${a.nodeId}::${a.operationId}`, a);
    }

    // 1. dispatch-operation / fan-out: Required graph operations that are either not yet dispatched,
    // or driver-authorized operations that have been authorized but not yet consumed by an assignment.
    let assignmentToBinding = new Map();
    if (definition?.spec?.graph?.nodes) {
      const requiredBindings = facts.requiredBindings;
      const matched = matchAssignmentsToRequiredBindings(requiredBindings, eventList, {
        definition,
        getAssignment: getAssignment ?? (() => null),
      });
      const assignedBindings = matched.assignedBindings;
      assignmentToBinding = matched.assignmentToBinding;
      for (const req of requiredBindings) {
        // Check if this required operation already has an assignment matched 1:1
        const hasAssignment = assignedBindings.has(req);
        if (!hasAssignment) {
          // Kernel gate: fan-out is emitted ONLY when cohort independence is 'isolated-until-fan-in' (F-R04)
          const isFanOut = definition?.spec?.profile?.cohort?.independence === 'isolated-until-fan-in';

          if (isFanOut) {
            const topologyEdges = definition?.spec?.profile?.topology?.edges ?? [];
            const candidateActors = (definition?.spec?.actors ?? []).filter((a) => {
              // Actor must be declared and legitimately paired with this operation in the graph
              try {
                const resolved = resolveDeclaredOperationActor(definition, req.operationId, a.id);
                if (resolved.actorId !== a.id) return false;
              } catch {
                return false;
              }
              // Independent branches must have no sibling edges between each other
              return !topologyEdges.some(
                (edge) =>
                  (edge.from === a.id || edge.to === a.id) &&
                  (definition?.spec?.actors ?? []).some((other) => other.id !== a.id && (other.id === edge.from || other.id === edge.to)),
              );
            });
            const allowedActorIds = candidateActors.map((a) => a.id);
            if (allowedActorIds.length >= 2) {
              rawActions.push({
                kind: 'fan-out',
                required: true,
                target: {
                  nodeId: req.nodeId,
                  operationId: req.operationId,
                  allowedActorIds,
                },
                allowedActorIds,
                requiredInputs: ['branches'],
                optionalInputs: ['fromAssignmentId'],
                allowedValues: {
                  'branches.actorId': allowedActorIds,
                },
              });
            } else {
              rawActions.push({
                kind: 'dispatch-operation',
                required: true,
                target: {
                  nodeId: req.nodeId,
                  operationId: req.operationId,
                  actorId: req.actorId,
                },
                requiredInputs: ['objective', 'expectedOutputs'],
                optionalInputs: ['contextRefs', 'constraints', 'capabilities', 'fromAssignmentId', 'intent', 'round', 'taskKey', 'mutation'],
              });
            }
          } else {
            rawActions.push({
              kind: 'dispatch-operation',
              required: true,
              target: {
                nodeId: req.nodeId,
                operationId: req.operationId,
                actorId: req.actorId,
              },
              requiredInputs: ['objective', 'expectedOutputs'],
              optionalInputs: ['contextRefs', 'constraints', 'capabilities', 'fromAssignmentId', 'intent', 'round', 'taskKey', 'mutation'],
            });
          }
        }
      }

      const windowOpenMap = new Map((facts.visibilityWindows || []).map((w) => [w.windowId, w.open]));

      // Check authorized driver-authorized operations not yet consumed
      for (const auth of authorizations) {
        if (!auth.consumedByAssignmentId) {
          const node = (definition?.spec?.graph?.nodes ?? []).find((n) => n.id === auth.nodeId);
          const opDef = (node?.operations ?? []).find((o) => (o.ref || o.id) === auth.operationId) ??
                        (definition?.spec?.operations ?? []).find((o) => (o.ref || o.id) === auth.operationId);
          const windowRef = opDef?.contextAccess?.visibilityWindowRef;
          if (windowRef && windowOpenMap.get(windowRef) !== true) {
            continue;
          }
          rawActions.push({
            kind: 'dispatch-operation',
            required: false,
            target: {
              nodeId: auth.nodeId,
              operationId: auth.operationId,
              actorId: auth.targetActorId,
              authorizationId: auth.authorizationId,
            },
            requiredInputs: ['objective', 'expectedOutputs'],
            optionalInputs: ['contextRefs', 'constraints', 'capabilities', 'fromAssignmentId', 'intent', 'round', 'taskKey', 'mutation'],
          });
        }
      }

      // 2. authorize-and-dispatch: Pending driver-authorized bindings whose visibility window (if any) is open
      for (const pending of facts.driverAuthorizedBindings.pending) {
        const node = (definition?.spec?.graph?.nodes ?? []).find((n) => n.id === pending.nodeId);
        const opDef = (node?.operations ?? []).find((o) => (o.ref || o.id) === pending.operationId) ??
                      (definition?.spec?.operations ?? []).find((o) => (o.ref || o.id) === pending.operationId);
        const windowRef = pending.visibilityWindowRef ?? opDef?.contextAccess?.visibilityWindowRef;
        if (windowRef && windowOpenMap.get(windowRef) !== true) {
          continue;
        }
        rawActions.push({
          kind: 'authorize-and-dispatch',
          required: false,
          target: {
            nodeId: pending.nodeId,
            operationId: pending.operationId,
            actorId: pending.actorId,
          },
          requiredInputs: ['authorizationId', 'invocationKey', 'reason', 'objective', 'expectedOutputs'],
          optionalInputs: ['grantedContextRefs', 'targetArtifactRef', 'contextRefs', 'constraints', 'capabilities', 'mutation'],
        });
      }
    }

    // 3. record-disposition: For failed gating outcomes or assignments requiring driver disposition
    const dispositions = replayed?.dispositions ?? [];
    const dispositionTargets = new Set(dispositions.map((d) => d.targetRef));

    // Find any assignment whose result was linked with failed status
    for (const ev of eventList) {
      if (ev.type === 'result-linked') {
        const asgnId = ev.payload?.assignmentId;
        // Check if there's a subsequent failed outcome and no disposition yet
        if (asgnId && !dispositionTargets.has(asgnId)) {
          // If quorum reports this actor as failed or missing
          const isFailedInQuorum = quorum?.failed?.some((f) => f.assignmentId === asgnId || f.actorId === ev.payload?.actorId);
          if (isFailedInQuorum) {
            // Find specific operation and recheck constraints if declared in definition for THIS operation
            let allowedValues = null;
            const asgnCreated = eventList.find(
              (e) => e.type === 'assignment-created' && (e.payload?.assignmentId === asgnId || e.payload?.id === asgnId),
            );
            const matched = assignmentToBinding.get(asgnId);
            let opId = asgnCreated?.payload?.operationId ?? matched?.operationId;
            if (!opId && getAssignment) {
              const asgn = getAssignment(asgnId);
              if (asgn && definition) {
                const allOps = [
                  ...(definition?.spec?.graph?.nodes?.flatMap((n) => n.operations ?? []) ?? []),
                  ...(definition?.spec?.operations ?? []),
                ];
                for (const op of allOps) {
                  const candId = op.id || op.ref;
                  if (candId && assignmentServesOperation(definition, candId, asgn)) {
                    opId = candId;
                    break;
                  }
                }
              }
            }
            const actorId = asgnCreated?.payload?.actorId ?? matched?.actorId ?? ev.payload?.actorId;

            if (definition?.spec?.graph?.nodes) {
              for (const node of definition.spec.graph.nodes) {
                for (const op of node.operations ?? []) {
                  const targetGatingOp = op.rechecks?.operation ?? (typeof op.rechecks === 'string' ? op.rechecks : null);
                  const matchesGating = opId ? targetGatingOp === opId : false;
                  const matchesActor = actorId ? op.actor === actorId : false;
                  if (matchesGating && matchesActor) {
                    const discharge = op.rechecks?.dischargeOn ?? op.dischargeOn;
                    if (Array.isArray(discharge)) {
                      allowedValues = { disposition: [...discharge] };
                      break;
                    }
                  }
                }
                if (allowedValues) break;
              }
            }

            rawActions.push({
              kind: 'record-disposition',
              required: true,
              target: {
                targetRef: asgnId,
                actorId: ev.payload?.actorId ?? null,
              },
              requiredInputs: ['disposition', 'rationale'],
              optionalInputs: ['evidenceRefs'],
              ...(allowedValues ? { allowedValues } : {}),
            });
          }
        }
      }
    }

    // 4. link-contribution: Available for settled assignments whose operation declares contributions
    for (const ev of eventList) {
      if (ev.type === 'result-linked') {
        const asgnId = ev.payload?.assignmentId;
        if (!asgnId) continue;
        const asgnCreated = eventList.find(
          (e) => e.type === 'assignment-created' && (e.payload?.assignmentId === asgnId || e.payload?.id === asgnId),
        );
        const matched = assignmentToBinding.get(asgnId);
        let opId = asgnCreated?.payload?.operationId ?? matched?.operationId;
        if (!opId && getAssignment) {
          const asgn = getAssignment(asgnId);
          if (asgn && definition) {
            const allOps = [
              ...(definition?.spec?.graph?.nodes?.flatMap((n) => n.operations ?? []) ?? []),
              ...(definition?.spec?.operations ?? []),
            ];
            for (const op of allOps) {
              const candId = op.id || op.ref;
              if (candId && assignmentServesOperation(definition, candId, asgn)) {
                opId = candId;
                break;
              }
            }
          }
        }
        if (!opId) continue;
        const nodeOpDef = (definition?.spec?.graph?.nodes?.flatMap((n) => n.operations ?? []) ?? []).find(
          (o) => (o.id || o.ref) === opId,
        );
        const rootOpDef = (definition?.spec?.operations ?? []).find((o) => (o.id || o.ref) === opId);
        const opDef = nodeOpDef?.contributions ? nodeOpDef : (rootOpDef?.contributions ? rootOpDef : (nodeOpDef ?? rootOpDef));
        if (opDef?.contributions) {
          const declaredTypes = Array.isArray(opDef.contributions.allowedTypes)
            ? opDef.contributions.allowedTypes
            : Array.isArray(opDef.contributions)
              ? opDef.contributions
              : undefined;
          const allowedTypes = declaredTypes
            ? declaredTypes.filter((t) => CONTRIBUTION_TYPES.includes(t))
            : [...CONTRIBUTION_TYPES];
          rawActions.push({
            kind: 'link-contribution',
            required: false,
            target: {
              assignmentId: asgnId,
              operationId: opId,
              nodeId: asgnCreated?.payload?.nodeId ?? matched?.nodeId,
              actorId: asgnCreated?.payload?.actorId ?? matched?.actorId,
            },
            requiredInputs: ['contributionId', 'contributionType', 'roundKey'],
            optionalInputs: ['anchors', 'respondsTo', 'artifactRef', 'revision'],
            ...(allowedTypes.length > 0 ? { allowedValues: { contributionType: allowedTypes } } : {}),
          });
        }
      }
    }

    // 5. record-human-turn: Available for any active session (human turns are session-level infrastructure)
    // Matches exact validateHumanTurnStep schema requirements (F-R05)
    rawActions.push({
      kind: 'record-human-turn',
      required: false,
      target: {
        coordinationId,
      },
      requiredInputs: ['turnId', 'turnOrdinal', 'channel', 'artifactRef', 'externalRef', 'attributedTo'],
      optionalInputs: ['respondsToRefs'],
    });

    // 6. close: Available when readyToClose or when explicit driver close can be attempted
    if (facts.readyToClose) {
      rawActions.push({
        kind: 'close',
        required: false,
        target: {
          coordinationId,
        },
        requiredInputs: ['authorizedBy'],
        optionalInputs: ['dissentingActorIds', 'aggregationId'],
      });
    }
  }

  // Compute actionSetDigest before actionKeys are attached
  const actionSetDigest = computeActionSetDigest(rawActions);

  // Attach actionKeys
  const actions = rawActions.map((act) => ({
    ...act,
    actionKey: computeActionKey({
      contractVersion: ACTIONS_CONTRACT_VERSION,
      coordinationId,
      schemaVersion,
      eventSeq,
      definitionDigest,
      kind: act.kind,
      target: act.target,
      requiredInputs: act.requiredInputs,
      optionalInputs: act.optionalInputs,
      allowedValues: act.allowedValues ?? null,
    }),
  }));

  const snapshotDigest = computeSnapshotDigest({
    coordinationId,
    schemaVersion,
    status: manifest.status,
    eventSeq,
    assignmentRefs: manifest.assignmentRefs ?? [],
    definitionDigest,
    quorum,
  });

  return {
    contractVersion: ACTIONS_CONTRACT_VERSION,
    coordinationId,
    session: {
      schemaVersion,
      status: manifest.status,
      phase: facts.phase,
      eventSeq,
      definitionRef: manifest.definitionRef ?? null,
      definitionDigest,
    },
    snapshot: {
      digest: snapshotDigest,
      actionSetDigest,
    },
    readyToClose: facts.readyToClose,
    blockers: facts.blockers,
    facts: {
      visibilityWindows: facts.visibilityWindows,
      pendingDriverAuthorizations: facts.driverAuthorizedBindings.pending,
      quorum: facts.quorum ?? {},
    },
    actions,
  };
}
