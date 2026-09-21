import fs from 'node:fs';
import path from 'node:path';
import { CoordinationError } from './schema.mjs';
import { resolveSessionPaths, readManifestRaw, withSessionLock } from './store.mjs';
import { readEvents } from '../../state/events.mjs';
import { replaySession } from './replay.mjs';
import {
  loadDefinitionForSession,
  evaluateSessionQuorum,
  deriveSessionPhase,
  deriveVisibilityWindowState,
} from './session-engine.mjs';
import {
  computeActionKey,
  computeSnapshotDigest,
  stableStringify,
  sha256,
  ACTIONS_CONTRACT_VERSION,
  projectCoordinationActions,
} from './actions-projector.mjs';
import { assignmentServesOperation, protocolOperationStamp } from './legality-facts.mjs';
import { CONTRIBUTION_TYPES } from '../deliberation/schema.mjs';

function resolveDriverIdentity(currentPayload = {}, precondition = {}, expectedKind = null) {
  if (expectedKind && expectedKind !== 'close') {
    if (currentPayload.authorizedBy !== undefined || precondition.authorizedBy !== undefined) {
      throw new CoordinationError(
        'validation',
        'action precondition failed: "authorizedBy" is not permitted on non-close actions; writerId is the single driver identity channel',
      );
    }
    return precondition.writerId ?? currentPayload.writerId ?? null;
  }
  const candidate = currentPayload.authorizedBy ?? precondition.authorizedBy ?? currentPayload.writerId ?? precondition.writerId;
  if (!candidate) return null;
  if (typeof candidate === 'string') return candidate;
  if (typeof candidate === 'object') return candidate.id ?? candidate.writerId ?? null;
  return null;
}

/**
 * Pure assertion comparing expected action precondition against loaded session state.
 * Throws CoordinationError on any mismatch.
 */
export function assertActionPrecondition({
  coordinationId,
  manifest,
  events = [],
  definitionDigest = null,
  expectedActionKey,
  expectedKind,
  expectedTarget,
  expectedEventSeq,
  expectedSnapshotDigest,
  requiredInputs = [],
  optionalInputs = [],
  allowedValues = null,
  inputPayload = {},
  writerId,
  authorizedBy,
}) {
  if (manifest.status !== 'active') {
    throw new CoordinationError(
      'validation',
      `action precondition failed: session "${coordinationId}" is not active (status: "${manifest.status}")`,
    );
  }

  // Mandatory driver identity check (F-R06): refuse unconditionally if missing or mismatched
  const expectedDriverId = manifest.provenanceRoot?.writerId;
  if (!expectedDriverId) {
    throw new CoordinationError(
      'unauthorized',
      `action precondition failed: session "${coordinationId}" has no declared driver identity (manifest.provenanceRoot.writerId is missing)`,
    );
  }
  const authId = resolveDriverIdentity(inputPayload, { writerId, authorizedBy }, expectedKind);
  if (!authId || authId !== expectedDriverId) {
    throw new CoordinationError(
      'unauthorized',
      `action precondition failed: ${expectedKind === 'close' ? 'authorizedBy' : 'writerId'} "${authId ?? 'missing'}" does not match session driver writerId "${expectedDriverId}"`,
    );
  }

  const currentEventSeq = events.length;
  if (typeof expectedEventSeq === 'number' && expectedEventSeq !== currentEventSeq) {
    throw new CoordinationError(
      'stale-action-key',
      `action precondition failed: expected event sequence ${expectedEventSeq} but session "${coordinationId}" is currently at sequence ${currentEventSeq} — action key is stale`,
    );
  }

  if (expectedSnapshotDigest) {
    const currentSnapshotDigest = computeSnapshotDigest({
      coordinationId,
      schemaVersion: manifest.schemaVersion,
      status: manifest.status,
      eventSeq: currentEventSeq,
      assignmentRefs: manifest.assignmentRefs ?? [],
      definitionDigest,
    });
    if (expectedSnapshotDigest !== currentSnapshotDigest) {
      throw new CoordinationError(
        'stale-snapshot',
        `action precondition failed: snapshot digest mismatch for session "${coordinationId}" (expected ${expectedSnapshotDigest}, got ${currentSnapshotDigest}) — session state changed`,
      );
    }
  }

  // Verify action key recomputation matches
  if (expectedActionKey) {
    const computedKey = computeActionKey({
      contractVersion: ACTIONS_CONTRACT_VERSION,
      coordinationId,
      schemaVersion: manifest.schemaVersion,
      eventSeq: currentEventSeq,
      definitionDigest,
      kind: expectedKind,
      target: expectedTarget,
      requiredInputs,
      optionalInputs,
      allowedValues,
    });

    if (computedKey !== expectedActionKey) {
      throw new CoordinationError(
        'stale-action-key',
        `action precondition failed: actionKey mismatch (expected "${expectedActionKey}", computed "${computedKey}") — target, kind, or session preconditions diverged`,
      );
    }
  }

  // Validate required inputs
  if (Array.isArray(requiredInputs)) {
    for (const inputKey of requiredInputs) {
      if (inputPayload[inputKey] === undefined || inputPayload[inputKey] === null) {
        throw new CoordinationError(
          'validation',
          `action precondition failed: missing required input "${inputKey}" for action "${expectedKind}"`,
        );
      }
    }
  }

  // Validate allowed values if declared
  if (allowedValues && typeof allowedValues === 'object') {
    for (const [field, allowedList] of Object.entries(allowedValues)) {
      if (inputPayload[field] !== undefined && Array.isArray(allowedList) && !allowedList.includes(inputPayload[field])) {
        throw new CoordinationError(
          'validation',
          `action precondition failed: field "${field}" value "${inputPayload[field]}" is not in protocol-declared allowed values [${allowedList.join(', ')}]`,
        );
      }
    }
  }

  return true;
}

/**
 * Atomic execution under session lock:
 * 1. Acquire coordination session lock
 * 2. Load fresh manifest and events
 * 3. Enforce mandatory driver identity against session provenanceRoot.writerId
 * 4. Inactive session: recover idempotent close from authoritative terminal event or fail stale
 * 5. Active session: run actions projector; if actionKey is currently legal, validate inputs and execute mutationFn
 * 6. If actionKey is no longer currently legal, reconstruct prior execution from authoritative records:
 *    - Same actionKey + same normalized payload -> idempotent return
 *    - Same actionKey + different payload -> payload-conflict
 *    - Neither -> stale-action-key
 *
 * Zero sidecar files (.action-keys.json completely eliminated).
 * Guarantees zero TOCTOU races between precondition verification and state mutation.
 */
export function executeUnderActionPrecondition(
  coordinationId,
  precondition,
  mutationFn,
  opts = {},
) {
  return withSessionLock(coordinationId, (paths) => {
    const manifest = readManifestRaw(paths.manifestPath);
    const events = readEvents(paths.eventsPath);

    if (!precondition?.actionKey || typeof precondition.actionKey !== 'string' || !precondition.actionKey.startsWith('sha256:')) {
      throw new CoordinationError(
        'validation',
        'executeUnderActionPrecondition requires a valid sha256 actionKey',
      );
    }

    const currentPayload = precondition.inputPayload ?? {};
    const expectedDriverId = manifest.provenanceRoot?.writerId;
    if (!expectedDriverId) {
      throw new CoordinationError(
        'unauthorized',
        `action precondition failed: session "${coordinationId}" has no declared driver identity (manifest.provenanceRoot.writerId is missing)`,
      );
    }

    let authId;
    if (precondition.kind === 'close') {
      const candidate = currentPayload.authorizedBy ?? precondition.authorizedBy ?? currentPayload.writerId ?? precondition.writerId;
      if (typeof candidate === 'string') authId = candidate;
      else if (typeof candidate === 'object') authId = candidate?.id ?? candidate?.writerId ?? null;
      if (!authId || authId !== expectedDriverId) {
        throw new CoordinationError(
          'unauthorized',
          `action precondition failed: authorizedBy "${authId ?? 'missing'}" does not match session driver writerId "${expectedDriverId}"`,
        );
      }
    } else {
      if (currentPayload.authorizedBy !== undefined || precondition.authorizedBy !== undefined) {
        throw new CoordinationError(
          'validation',
          'action precondition failed: "authorizedBy" is not permitted on non-close actions; writerId is the single driver identity channel',
        );
      }
      authId = precondition.writerId ?? currentPayload.writerId;
      if (!authId || authId !== expectedDriverId) {
        throw new CoordinationError(
          'unauthorized',
          `action precondition failed: writerId "${authId ?? 'missing'}" does not match session driver writerId "${expectedDriverId}"`,
        );
      }
    }

    // 1. Resolve definition and definitionDigest from immutable session snapshot
    let definition = null;
    let definitionDigest = null;
    if (manifest.definitionRef) {
      try {
        definition = loadDefinitionForSession(manifest, opts);
      } catch (err) {
        if (err instanceof CoordinationError || err.category === 'corrupt-log') throw err;
        const wrapped = new CoordinationError(
          'refusal',
          `executeUnderActionPrecondition: session "${coordinationId}" was opened against definition "${manifest.definitionRef.id}@${manifest.definitionRef.version}", but the definition could not be resolved: ${err.message}`,
        );
        wrapped.cause = err;
        throw wrapped;
      }
    }
    const rawDigest =
      manifest.snapshotRef?.digest ??
      definition?.metadata?.digest ??
      (manifest.definitionRef ? sha256(stableStringify(manifest.definitionRef)) : null);
    if (rawDigest) {
      definitionDigest = rawDigest.startsWith('sha256:') ? rawDigest : `sha256:${rawDigest}`;
    }

    // 2. If session is not active, check if actionKey closed the session
    if (manifest.status !== 'active') {
      const terminalEvent = events[events.length - 1];
      const isTerminalEvent = terminalEvent && (
        terminalEvent.type === 'coordination-completed' ||
        terminalEvent.type === 'coordination-partial' ||
        terminalEvent.type === 'session-completed' ||
        terminalEvent.type === 'session-partial'
      );
      if (isTerminalEvent && events.length > 0) {
        const expectedCloseKey = computeActionKey({
          contractVersion: ACTIONS_CONTRACT_VERSION,
          coordinationId,
          schemaVersion: manifest.schemaVersion,
          eventSeq: events.length - 1,
          definitionDigest,
          kind: 'close',
          target: { coordinationId },
          requiredInputs: ['authorizedBy'],
          optionalInputs: ['dissentingActorIds', 'aggregationId'],
          allowedValues: null,
        });

        if (precondition.actionKey === expectedCloseKey) {
          if (!authId || authId !== expectedDriverId) {
            throw new CoordinationError(
              'payload-conflict',
              `action precondition failed: actionKey "${precondition.actionKey}" was already executed under driver identity "${expectedDriverId}"`,
            );
          }
          const p = terminalEvent.payload ?? {};
          const recordedDissenting = (p.dissentingActors ?? p.dissentingActorIds ?? []).slice().sort();
          const currentDissenting = (currentPayload.dissentingActorIds ?? []).slice().sort();
          const recordedAggregationId = p.aggregationId ?? null;
          const currentAggregationId = currentPayload.aggregationId ?? null;
          if (
            stableStringify(recordedDissenting) !== stableStringify(currentDissenting) ||
            recordedAggregationId !== currentAggregationId
          ) {
            throw new CoordinationError(
              'payload-conflict',
              `action precondition failed: actionKey "${precondition.actionKey}" was already executed with different close parameters`,
            );
          }
          return {
            idempotent: true,
            cached: true,
            actionKey: precondition.actionKey,
            coordinationId,
            kind: 'close',
            status: manifest.status,
            closed: true,
            closeAttempted: true,
          };
        }
      }

      throw new CoordinationError(
        'stale-action-key',
        `action precondition failed: session "${coordinationId}" is not active (status: "${manifest.status}") — action key is stale`,
      );
    }

    // 4. Fresh read, replay, quorum, phase, visibilityWindows inside held lock
    const replayed = replaySession(coordinationId, opts);
    const quorum = evaluateSessionQuorum(coordinationId, opts);
    const phase = deriveSessionPhase(coordinationId, opts);

    let visibilityWindows = null;
    const declaredWindows = definition?.spec?.profile?.topology?.visibilityWindows ?? [];
    if (declaredWindows.length > 0 && replayed && paths?.fgosDir) {
      visibilityWindows = declaredWindows.map((w) => {
        const derived = deriveVisibilityWindowState(definition, w.id, replayed, paths.fgosDir);
        return {
          windowId: w.id,
          open: Boolean(derived?.open),
          requiredOperations: (w.opensAfter?.operationRefs ?? []).slice(),
        };
      });
    }

    const getAssignment = (asgnId) => {
      try {
        if (paths?.fgosDir) {
          const p = path.join(paths.fgosDir, 'assignments', asgnId, 'assignment.json');
          if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
        }
      } catch {}
      return null;
    };

    // 5. Run authoritative actions projector inside the lock
    const projected = projectCoordinationActions({
      manifest,
      events,
      replayed,
      definition,
      quorum,
      phase,
      visibilityWindows,
      getAssignment,
    });

    const matchedAction = projected.actions.find((a) => a.actionKey === precondition.actionKey);

    if (matchedAction) {
      // Validate input requirements and allowed values against matched action
      if (precondition.kind && precondition.kind !== matchedAction.kind) {
        throw new CoordinationError(
          'stale-action-key',
          `action precondition failed: action kind mismatch (expected "${precondition.kind}", actionKey is for kind "${matchedAction.kind}")`,
        );
      }
      if (precondition.target && stableStringify(precondition.target) !== stableStringify(matchedAction.target)) {
        throw new CoordinationError(
          'stale-action-key',
          `action precondition failed: target mismatch against projected action target`,
        );
      }
      if (Array.isArray(matchedAction.requiredInputs)) {
        for (const inputKey of matchedAction.requiredInputs) {
          if (currentPayload[inputKey] === undefined || currentPayload[inputKey] === null) {
            throw new CoordinationError(
              'validation',
              `action precondition failed: missing required input "${inputKey}" for action "${matchedAction.kind}"`,
            );
          }
        }
      }
      if (matchedAction.allowedValues && typeof matchedAction.allowedValues === 'object') {
        for (const [field, allowedList] of Object.entries(matchedAction.allowedValues)) {
          if (currentPayload[field] !== undefined && Array.isArray(allowedList) && !allowedList.includes(currentPayload[field])) {
            throw new CoordinationError(
              'validation',
              `action precondition failed: field "${field}" value "${currentPayload[field]}" is not in protocol-declared allowed values [${allowedList.join(', ')}]`,
            );
          }
        }
      }

      // Execute mutation callback under lock
      if (typeof mutationFn !== 'function') {
        throw new CoordinationError('validation', 'executeUnderActionPrecondition requires a valid mutationFn');
      }

      return mutationFn(paths, {
        manifest,
        events,
        replayed,
        definition,
        quorum,
        phase,
        projected,
        action: matchedAction,
      });
    }

    // 6. Action key was not in currently projected actions: check if it was ALREADY executed in this session
    // Reconstruct idempotency strictly from authoritative session records
    let priorExecution = null;

    if (precondition.kind === 'dispatch-operation') {
      const targetActor = precondition.target?.actorId;
      const targetOp = precondition.target?.operationId;
      for (let i = 0; i < events.length; i++) {
        const ev = events[i];
        if (ev.type === 'assignment-created') {
          const p = ev.payload || {};
          const matchesActor = targetActor ? p.actorId === targetActor : true;
          const asgnId = p.assignmentId || p.id;
          let recordedContract = {};
          let servesOp = false;
          if (asgnId && paths?.fgosDir) {
            const asgnPath = path.join(paths.fgosDir, 'assignments', asgnId, 'assignment.json');
            try {
              if (fs.existsSync(asgnPath)) {
                const asgnData = JSON.parse(fs.readFileSync(asgnPath, 'utf8'));
                recordedContract = asgnData?.provenance?.inline?.contract ?? asgnData?.provenance?.contract ?? asgnData?.contract ?? {};
                servesOp = targetOp ? (assignmentServesOperation(definition, targetOp, asgnData) || p.operationId === targetOp) : true;
              }
            } catch {}
          }
          if (!servesOp && targetOp) {
            servesOp = p.operationId === targetOp;
          }
          if (matchesActor && servesOp) {
            const candidateKey = computeActionKey({
              contractVersion: ACTIONS_CONTRACT_VERSION,
              coordinationId,
              schemaVersion: manifest.schemaVersion,
              eventSeq: i,
              definitionDigest,
              kind: 'dispatch-operation',
              target: precondition.target,
              requiredInputs: ['objective', 'expectedOutputs'],
              optionalInputs: ['contextRefs', 'constraints', 'capabilities', 'fromAssignmentId', 'intent', 'round', 'taskKey', 'mutation'],
              allowedValues: precondition.allowedValues ?? null,
            });
            if (candidateKey === precondition.actionKey) {
              priorExecution = {
                eventSeq: i,
                assignmentId: asgnId,
                recordedPayload: {
                  objective: recordedContract.objective ?? p.objective,
                  expectedOutputs: recordedContract.expectedOutputs ?? p.expectedOutputs,
                  contextRefs: recordedContract.contextRefs,
                  constraints: recordedContract.constraints,
                  capabilities: recordedContract.capabilities,
                  mutation: recordedContract.mutation,
                },
                result: { status: 'dispatched', assignmentId: asgnId, actionKey: precondition.actionKey },
              };
              break;
            }
          }
        }
      }
    } else if (precondition.kind === 'authorize-and-dispatch') {
      const targetActor = precondition.target?.actorId;
      const targetOp = precondition.target?.operationId;
      const targetNode = precondition.target?.nodeId;
      for (let i = 0; i < events.length; i++) {
        const ev = events[i];
        if (ev.type === 'operation-authorized') {
          const p = ev.payload || {};
          const matchesActor = targetActor ? p.targetActorId === targetActor : true;
          const matchesOp = targetOp ? p.operationId === targetOp : true;
          const matchesNode = targetNode ? p.nodeId === targetNode : true;
          if (matchesActor && matchesOp && matchesNode) {
            const candidateKey = computeActionKey({
              contractVersion: ACTIONS_CONTRACT_VERSION,
              coordinationId,
              schemaVersion: manifest.schemaVersion,
              eventSeq: i,
              definitionDigest,
              kind: 'authorize-and-dispatch',
              target: precondition.target,
              requiredInputs: ['authorizationId', 'invocationKey', 'reason', 'objective', 'expectedOutputs'],
              optionalInputs: ['grantedContextRefs', 'targetArtifactRef', 'contextRefs', 'constraints', 'capabilities', 'mutation'],
              allowedValues: precondition.allowedValues ?? null,
            });
            if (candidateKey === precondition.actionKey) {
              const authId = p.authorizationId;
              const matchingAsgn = events.slice(i + 1).find(
                (e) => e.type === 'assignment-created' && (
                  e.payload?.authorizationId === authId ||
                  e.payload?.authorizationProvenance?.authorizationId === authId
                ),
              );
              const asgnId = matchingAsgn?.payload?.assignmentId;
              let recordedContract = {};
              if (asgnId && paths?.fgosDir) {
                const asgnPath = path.join(paths.fgosDir, 'assignments', asgnId, 'assignment.json');
                try {
                  if (fs.existsSync(asgnPath)) {
                    const asgnData = JSON.parse(fs.readFileSync(asgnPath, 'utf8'));
                    recordedContract = asgnData?.provenance?.inline?.contract ?? asgnData?.provenance?.contract ?? asgnData?.contract ?? {};
                  }
                } catch {}
              }
              priorExecution = {
                eventSeq: i,
                authorizationId: authId,
                assignmentId: asgnId,
                recordedPayload: {
                  authorizationId: p.authorizationId,
                  invocationKey: p.invocationKey,
                  reason: p.reason,
                  grantedContextRefs: p.grantedContextRefs,
                  targetArtifactRef: p.targetArtifactRef,
                  objective: recordedContract.objective ?? matchingAsgn?.payload?.objective,
                  expectedOutputs: recordedContract.expectedOutputs ?? matchingAsgn?.payload?.expectedOutputs,
                  contextRefs: recordedContract.contextRefs,
                  constraints: recordedContract.constraints,
                  capabilities: recordedContract.capabilities,
                  mutation: recordedContract.mutation,
                },
                result: {
                  status: 'dispatched',
                  authorizationId: authId,
                  assignmentId: asgnId,
                  actionKey: precondition.actionKey,
                },
              };
              break;
            }
          }
        }
      }
    } else if (precondition.kind === 'record-disposition') {
      const targetRef = precondition.target?.targetRef;
      for (let i = 0; i < events.length; i++) {
        const ev = events[i];
        if (ev.type === 'driver-disposition-recorded' && ev.payload?.targetRef === targetRef) {
          const candidateKey = computeActionKey({
            contractVersion: ACTIONS_CONTRACT_VERSION,
            coordinationId,
            schemaVersion: manifest.schemaVersion,
            eventSeq: i,
            definitionDigest,
            kind: precondition.kind,
            target: precondition.target,
            requiredInputs: precondition.requiredInputs ?? ['disposition', 'rationale'],
            optionalInputs: precondition.optionalInputs ?? ['evidenceRefs'],
            allowedValues: precondition.allowedValues ?? null,
          });
          if (candidateKey === precondition.actionKey) {
            priorExecution = {
              eventSeq: i,
              recordedPayload: {
                targetRef: ev.payload.targetRef,
                disposition: ev.payload.disposition,
                rationale: ev.payload.rationale,
                evidenceRefs: ev.payload.evidenceRefs ?? [],
              },
              result: { ...ev.payload, actionKey: precondition.actionKey },
            };
            break;
          }
        }
      }
    } else if (precondition.kind === 'link-contribution') {
      const contribId = currentPayload.contributionId;
      for (let i = 0; i < events.length; i++) {
        const ev = events[i];
        if (ev.type === 'deliberation-contribution-linked' && ev.payload?.contributionId === contribId) {
          let allowedValues = precondition.allowedValues ?? null;
          if (!allowedValues && definition && (precondition.target?.operationId || ev.payload.operationRef)) {
            const opId = precondition.target?.operationId || ev.payload.operationRef;
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
              if (allowedTypes.length > 0) {
                allowedValues = { contributionType: allowedTypes };
              }
            }
          }
          const candidateKey = computeActionKey({
            contractVersion: ACTIONS_CONTRACT_VERSION,
            coordinationId,
            schemaVersion: manifest.schemaVersion,
            eventSeq: i,
            definitionDigest,
            kind: precondition.kind,
            target: precondition.target,
            requiredInputs: precondition.requiredInputs ?? ['contributionId', 'contributionType', 'roundKey'],
            optionalInputs: precondition.optionalInputs ?? ['anchors', 'respondsTo', 'artifactRef', 'revision'],
            allowedValues,
          });
          if (candidateKey === precondition.actionKey) {
            priorExecution = {
              eventSeq: i,
              recordedPayload: {
                contributionId: ev.payload.contributionId,
                contributionType: ev.payload.type,
                roundKey: ev.payload.roundKey,
                anchors: ev.payload.anchors,
                respondsTo: ev.payload.respondsTo,
                artifactRef: ev.payload.artifactRef,
                revision: ev.payload.revision,
              },
              result: { ...ev.payload, actionKey: precondition.actionKey },
            };
            break;
          }
        }
      }
    } else if (precondition.kind === 'record-human-turn') {
      for (let i = 0; i < events.length; i++) {
        const ev = events[i];
        if (ev.type === 'human-turn-recorded') {
          const candidateKey = computeActionKey({
            contractVersion: ACTIONS_CONTRACT_VERSION,
            coordinationId,
            schemaVersion: manifest.schemaVersion,
            eventSeq: i,
            definitionDigest,
            kind: precondition.kind,
            target: precondition.target,
            requiredInputs: precondition.requiredInputs ?? ['turnId', 'turnOrdinal', 'channel', 'artifactRef', 'externalRef', 'attributedTo'],
            optionalInputs: precondition.optionalInputs ?? ['respondsToRefs'],
            allowedValues: precondition.allowedValues ?? null,
          });
          if (candidateKey === precondition.actionKey) {
            priorExecution = {
              eventSeq: i,
              recordedPayload: {
                turnId: ev.payload.turnId,
                turnOrdinal: ev.payload.turnOrdinal,
                channel: ev.payload.channel,
                artifactRef: ev.payload.artifactRef,
                revision: ev.payload.revision,
                externalRef: ev.payload.externalRef,
                attributedTo: ev.payload.attributedTo,
                respondsToRefs: ev.payload.respondsToRefs ?? [],
              },
              result: { ...ev.payload, actionKey: precondition.actionKey },
            };
            break;
          }
        }
      }
    } else if (precondition.kind === 'fan-out') {
      const targetOp = precondition.target?.operationId;
      for (let i = 0; i < events.length; i++) {
        const candidateKey = computeActionKey({
          contractVersion: ACTIONS_CONTRACT_VERSION,
          coordinationId,
          schemaVersion: manifest.schemaVersion,
          eventSeq: i,
          definitionDigest,
          kind: precondition.kind,
          target: precondition.target,
          requiredInputs: ['branches'],
          optionalInputs: ['fromAssignmentId'],
          allowedValues: precondition.allowedValues ?? null,
        });
        if (candidateKey === precondition.actionKey) {
          const reqBranches = Array.isArray(currentPayload.branches) ? currentPayload.branches : [];
          const reqActorIds = new Set(reqBranches.map((b) => b.actorId));
          const matchedBranches = [];
          for (let j = i; j < events.length; j++) {
            const ev = events[j];
            if (ev.type === 'assignment-created') {
              const p = ev.payload || {};
              const asgnId = p.assignmentId || p.id;
              let branchContract = {};
              let servesOp = false;
              if (asgnId && paths?.fgosDir) {
                const asgnPath = path.join(paths.fgosDir, 'assignments', asgnId, 'assignment.json');
                try {
                  if (fs.existsSync(asgnPath)) {
                    const asgnData = JSON.parse(fs.readFileSync(asgnPath, 'utf8'));
                    branchContract = asgnData?.provenance?.inline?.contract ?? asgnData?.provenance?.contract ?? asgnData?.contract ?? {};
                    servesOp = targetOp ? (assignmentServesOperation(definition, targetOp, asgnData) || p.operationId === targetOp) : true;
                  }
                } catch {}
              }
              if (!servesOp && targetOp) {
                servesOp = p.operationId === targetOp;
              }
              if (servesOp && reqActorIds.has(p.actorId)) {
                matchedBranches.push({
                  actorId: p.actorId,
                  assignmentId: asgnId,
                  status: 'dispatched',
                  objective: branchContract.objective ?? p.objective,
                  expectedOutputs: branchContract.expectedOutputs ?? p.expectedOutputs,
                });
              }
            }
          }
          if (matchedBranches.length >= reqBranches.length && reqBranches.length > 0) {
            priorExecution = {
              eventSeq: i,
              recordedPayload: {
                branches: matchedBranches.map((m) => ({
                  actorId: m.actorId,
                  objective: m.objective,
                  expectedOutputs: m.expectedOutputs,
                })),
              },
              result: {
                status: 'dispatched',
                actionKey: precondition.actionKey,
                branches: matchedBranches,
              },
            };
            break;
          }
        }
      }
    }

    if (priorExecution) {
      const recorded = priorExecution.recordedPayload || {};
      let hasConflict = false;
      for (const [k, v] of Object.entries(recorded)) {
        if (v !== undefined && currentPayload[k] !== undefined) {
          if (k === 'branches' && Array.isArray(v) && Array.isArray(currentPayload.branches)) {
            if (v.length !== currentPayload.branches.length) {
              hasConflict = true;
              break;
            }
            for (let idx = 0; idx < v.length; idx++) {
              const rBranch = v[idx];
              const cBranch = currentPayload.branches[idx];
              if (rBranch.actorId !== cBranch.actorId || (rBranch.objective && cBranch.objective !== rBranch.objective)) {
                hasConflict = true;
                break;
              }
            }
            if (hasConflict) break;
          } else if (typeof v === 'object' && v !== null) {
            if (stableStringify(currentPayload[k]) !== stableStringify(v)) {
              hasConflict = true;
              break;
            }
          } else if (currentPayload[k] !== v) {
            hasConflict = true;
            break;
          }
        }
      }
      if (hasConflict) {
        throw new CoordinationError(
          'payload-conflict',
          `action precondition failed: actionKey "${precondition.actionKey}" was already executed with different payload`,
        );
      }
      return {
        idempotent: true,
        cached: true,
        actionKey: precondition.actionKey,
        ...(priorExecution.result ?? {}),
      };
    }

    throw new CoordinationError(
      'stale-action-key',
      `action precondition failed: actionKey "${precondition.actionKey}" is not in current legal action set (found ${projected.actions.length} actions) — action is stale or target is unauthorized/invalid`,
    );
  }, opts);
}
