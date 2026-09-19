import { CoordinationError } from '../../runner/coordination/schema.mjs';
import {
  resumeSession,
  closeSessionByQuorum,
  evaluateSessionQuorum,
  deriveSessionPhase,
} from '../../runner/coordination/session-engine.mjs';
import { loadDefinitionForSession } from '../../runner/coordination/session-engine.mjs';
import { validateCoordinationCloseRequest } from './schema.mjs';
import { resolveMainCheckoutRoot } from '../../runner/paths.mjs';
import { assertDriverIdentity } from '../../runner/coordination/store.mjs';

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

export async function closeCoordinationUseCase(ctx, options = {}) {
  const { requestObject } = options;
  if (requestObject === undefined) {
    throw new CoordinationError('validation', 'coordination close: requestObject must be given');
  }
  const request = validateCoordinationCloseRequest(requestObject);

  const engineOpts = {
    cwd: ctx.cwd,
    repoRoot: ctx.repoRoot,
    packageRoot: ctx.packageRoot,
  };

  const coordinationId = request.coordinationId;

  const { manifest, aggregations } = resumeSession(coordinationId, engineOpts);

  const quorumBeforeClose = evaluateSessionQuorum(coordinationId, engineOpts);
  let closed = false;
  let closeRefusalReason = null;
  
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
