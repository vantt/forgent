// verbs/coordination/status.mjs — public status use case (Unit 2B).
// Public read-only door for coordination-actions.v1: compact default,
// optional detail/replay flags, zero mutation, standard envelope.

import { StoreError } from '../../state/store.mjs';
import { showCoordinationActionsUseCase } from './actions.mjs';
import { replaySession } from '../../runner/coordination/replay.mjs';

/**
 * Use case: Read-only projection of coordination session status and legal actions.
 *
 * @param {object} ctx `{ cwd, repoRoot, packageRoot? }`
 * @param {object} options `{ id, detail?, replay? }`
 * @returns {object} Status payload in target contract
 */
export function showCoordinationStatusUseCase(ctx, options = {}) {
  const id = options.id ?? options.coordinationId;
  if (!id || typeof id !== 'string') {
    throw new StoreError('validation', 'coordination status: "id" is required and must be a string');
  }

  const detail = Boolean(options.detail);
  const replay = Boolean(options.replay);

  const actionsResult = showCoordinationActionsUseCase(ctx, { id });

  const compact = {
    contractVersion: actionsResult.contractVersion,
    coordinationId: actionsResult.coordinationId,
    session: actionsResult.session,
    readyToClose: actionsResult.readyToClose,
    blockers: actionsResult.blockers,
    actions: actionsResult.actions,
  };

  if (!detail && !replay) {
    return compact;
  }

  const result = { ...compact };
  if (detail) {
    result.snapshot = actionsResult.snapshot;
    result.facts = actionsResult.facts;
  }
  if (replay) {
    const engineOpts = { cwd: ctx.cwd, repoRoot: ctx.repoRoot };
    result.replay = replaySession(id, engineOpts);
  }

  return result;
}
