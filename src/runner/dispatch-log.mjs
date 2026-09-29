import { appendEvent } from '../state/events.mjs';
import { resolveWriterLogPath } from '../state/store.mjs';

/**
 * Log an audit line for an in-session executor call (`case 'log':`).
 *
 * This writes an `executor.dispatch` event into the Work event log
 * (`resolveWriterLogPath`).
 *
 * Architectural Boundary Note (F3 / M10):
 * This is an in-session audit log exception into the Work event log
 * preserved for backward compatibility and evaluator confidence reporting
 * (`src/report/dispatch-confidence.mjs`). Dispatch core (`src/runner/dispatch/**`)
 * does not reference `appendEvent` or Work lifecycle mutation verbs.
 */
export function logExecutorDispatch(fgosDir, { id, executorId, provider, command, model, governance, plan, capability, mechanism, tier, fallbackReason, outcome }) {
  const gov = governance ?? plan?.governance ?? null;
  return appendEvent(resolveWriterLogPath(fgosDir), {
    type: 'executor.dispatch',
    payload: {
      id,
      executorId,
      provider,
      command,
      model,
      baseCommit: null,
      headRef: null,
      governance: gov,
      capability: capability ?? null,
      mechanism: mechanism ?? null,
      tier: tier ?? null,
      fallbackReason: fallbackReason ?? null,
      outcome: outcome ?? null,
    },
  });
}
