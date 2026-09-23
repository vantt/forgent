import { CoordinationError } from '../../runner/coordination/schema.mjs';
import {
  resumeSession,
  closeSessionByQuorum,
  closeSessionByQuorumLocked,
  evaluateSessionQuorum,
  deriveSessionPhase,
} from '../../runner/coordination/session-engine.mjs';
import { loadDefinitionForSession } from '../../runner/coordination/session-engine.mjs';
import { validateCoordinationCloseRequest } from './schema.mjs';
import { resolveMainCheckoutRoot } from '../../runner/paths.mjs';
import { assertDriverIdentity, resolveSessionPaths } from '../../runner/coordination/store.mjs';
import { executeUnderActionPrecondition } from '../../runner/coordination/action-precondition.mjs';
import { computeDagSharedCwdCaveats } from '../../runner/coordination/dag-declaration.mjs';
import { resolveNodeCwd } from './dag-scheduler.mjs';

function checkDagCloseCaveats(dagDeclaration, assignments, fgosDir, defaultCwd) {
  if (!dagDeclaration?.nodes) return null;
  const nodeCwds = new Map();
  for (const node of dagDeclaration.nodes) {
    const nodeAssignments = (assignments ?? []).filter((entry) => entry.dagNodeId === node.id);
    nodeCwds.set(node.id, resolveNodeCwd(node, nodeAssignments, fgosDir, defaultCwd));
  }
  const dagCaveats = computeDagSharedCwdCaveats({
    declaredNodes: dagDeclaration.nodes,
    getNodeCwd: (id) => nodeCwds.get(id),
  });
  if (dagCaveats.size > 0) {
    return 'recheck-required: concurrent read-only nodes sharing cwd carry non-attributable-verdict caveats';
  }
  return null;
}

function aggregationCloseParams(coordinationId, engineOpts, manifest, aggregations) {
  if (!manifest.definitionRef) return {};
  let definition;
  try {
    definition = loadDefinitionForSession(manifest, { cwd: engineOpts.cwd, packageRoot: engineOpts.packageRoot });
  } catch (err) {
    if (err.category === 'corrupt-log') throw err;
    const wrapped = new CoordinationError(
      'refusal',
      `coordination close: session "${coordinationId}" was opened against definition "${manifest.definitionRef.id}@${manifest.definitionRef.version}", but the definition could not be resolved -- refusing to close against an unresolvable definition: ${err.message}`,
    );
    wrapped.cause = err;
    throw wrapped;
  }
  if (manifest.schemaVersion === '1' && definition.metadata.version !== manifest.definitionRef.version) {
    throw new CoordinationError(
      'refusal',
      `coordination close: session "${coordinationId}" was opened against definition "${manifest.definitionRef.id}@${manifest.definitionRef.version}", but the resolved definition is now version "${definition.metadata.version}" -- refusing to close against a drifted definition`,
    );
  }
  if (definition?.spec?.profile?.completion?.aggregation === undefined) return {};
  if (aggregations.length === 0) {
    throw new CoordinationError(
      'refusal',
      `coordination close: protocol "${definition.metadata.id}" declares completion.aggregation, but session "${coordinationId}" has validated no aggregation -- refusing to close a declared-aggregation protocol on quorum alone (validate one through validateSessionAggregation, then resume this session to close it)`,
    );
  }
  return { aggregationId: aggregations[aggregations.length - 1].aggregationId };
}

export async function executeCoordinationCloseKernel(ctx, request, options = {}) {
  const engineOpts = {
    cwd: ctx.cwd,
    repoRoot: ctx.repoRoot,
    packageRoot: ctx.packageRoot,
  };

  const coordinationId = request.coordinationId;

  if (request.actionKey) {
    return executeUnderActionPrecondition(
      coordinationId,
      {
        actionKey: request.actionKey,
        kind: 'close',
        target: { coordinationId },
        inputPayload: {
          authorizedBy: request.authorizedBy,
          ...(request.dissentingActorIds ? { dissentingActorIds: request.dissentingActorIds } : {}),
          ...(request.aggregationId ? { aggregationId: request.aggregationId } : {}),
        },
      },
      (paths, { manifest: freshManifest, replayed }) => {
        const aggregations = replayed?.aggregations ?? [];
        let closed = false;
        let closeRefusalReason = null;
        const dagCaveatReason = checkDagCloseCaveats(replayed?.dag?.declaration, replayed?.assignments, paths?.fgosDir, engineOpts.cwd);
        if (dagCaveatReason) {
          closeRefusalReason = dagCaveatReason;
        } else {
          try {
            const closeParams = aggregationCloseParams(coordinationId, engineOpts, freshManifest, aggregations);
            closeParams.authorizedBy = request.authorizedBy;
            if (request.dissentingActorIds) closeParams.dissentingActorIds = request.dissentingActorIds;
            if (request.aggregationId) closeParams.aggregationId = request.aggregationId;
            closeSessionByQuorumLocked(coordinationId, closeParams, paths, engineOpts);
            closed = true;
          } catch (err) {
            if (err instanceof CoordinationError && err.category === 'refusal') {
              closeRefusalReason = err.message;
            } else {
              throw err;
            }
          }
        }
        const finalQuorum = evaluateSessionQuorum(coordinationId, engineOpts);
        const phase = deriveSessionPhase(coordinationId, engineOpts);
        return {
          coordinationId,
          kind: request.kind,
          status: phase,
          closed,
          closeAttempted: true,
          actionKey: request.actionKey,
          ...(closeRefusalReason !== null ? { closeRefusalReason } : {}),
          quorum: finalQuorum,
        };
      },
      engineOpts,
    );
  }

  // Backward-compatibility path: unkeyed close bypasses executeUnderActionPrecondition.
  // Note (F11 contract boundary): Phase 2 composers and semantic mutating verbs MUST
  // supply a valid actionKey to ensure atomic lock-held stale-precondition verification.
  const replayed = resumeSession(coordinationId, engineOpts);
  const { manifest, aggregations, assignments, dag } = replayed;
  const { fgosDir } = resolveSessionPaths(coordinationId, engineOpts);

  const quorumBeforeClose = evaluateSessionQuorum(coordinationId, engineOpts);
  let closed = false;
  let closeRefusalReason = null;
  
  assertDriverIdentity(manifest, request.authorizedBy, {
    coordinationId,
    label: 'coordination close',
    subject: 'a session close',
  });

  const dagCaveatReason = checkDagCloseCaveats(dag?.declaration, assignments, fgosDir, engineOpts.cwd);
  if (dagCaveatReason) {
    closeRefusalReason = dagCaveatReason;
  } else {
    try {
      const closeParams = aggregationCloseParams(coordinationId, engineOpts, manifest, aggregations);
      closeParams.authorizedBy = request.authorizedBy;
      closeSessionByQuorum(coordinationId, closeParams, engineOpts);
      closed = true;
    } catch (err) {
      if (err instanceof CoordinationError && err.category === 'refusal') {
        closeRefusalReason = err.message;
      } else {
        throw err;
      }
    }
  }

  const finalQuorum = closed ? evaluateSessionQuorum(coordinationId, engineOpts) : quorumBeforeClose;
  const phase = deriveSessionPhase(coordinationId, engineOpts);

  return {
    coordinationId,
    kind: request.kind,
    status: phase,
    closed,
    closeAttempted: true,
    ...(closeRefusalReason !== null ? { closeRefusalReason } : {}),
    quorum: finalQuorum,
  };
}

export async function closeCoordinationUseCase(ctx, options = {}) {
  const { requestObject } = options;
  if (requestObject === undefined) {
    throw new CoordinationError('validation', 'coordination close: requestObject must be given');
  }
  const request = validateCoordinationCloseRequest(requestObject);
  return executeCoordinationCloseKernel(ctx, request, options);
}
