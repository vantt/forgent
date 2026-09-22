// verbs/coordination/inspect.mjs — public inspect use case (Unit 2D).
// Read-only inspection projection of a coordination session:
// manifest, phase, facts, definition, visibility windows, and legal actions.

import { StoreError } from '../../state/store.mjs';
import { showCoordinationStatusUseCase } from './status.mjs';

/**
 * Use case: Inspect coordination session details and runtime projection (read-only).
 *
 * @param {object} ctx `{ cwd, repoRoot, packageRoot? }`
 * @param {object} options `{ id, detail?, replay? }`
 * @returns {object} Inspection payload
 */
export function inspectCoordinationUseCase(ctx, options = {}) {
  const id = options.id ?? options.coordinationId;
  if (!id || typeof id !== 'string') {
    throw new StoreError('validation', 'coordination inspect: "id" is required and must be a string');
  }

  // inspect defaults detail to true to give full runtime projection
  const statusResult = showCoordinationStatusUseCase(ctx, {
    id,
    detail: options.detail !== undefined ? Boolean(options.detail) : true,
    replay: Boolean(options.replay),
  });

  return {
    ok: true,
    operationId: 'coordination.inspect',
    effect: 'read',
    status: statusResult.session?.status,
    ...statusResult,
  };
}
