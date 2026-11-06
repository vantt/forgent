// src/runner/execution/dry-bind.mjs — read-only simulation of how a unit's pattern would bind its seats
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/**. Calls no model,
// starts no process and writes nothing: it drives the SAME pattern code the runner drives, with a
// seat runner that only calls bind().

import { askFor, bind } from './bind.mjs';
import { runLoop } from './loops/index.mjs';
import { createSeatLedger } from './seat-ledger.mjs';
import { resolveCollaboration } from './patterns/catalog.mjs';
import { shippedCatalog } from '../dispatch/shipped-catalog.mjs';

/**
 * Bind every seat a unit's pattern would dispatch, in the order the pattern dispatches them,
 * without running any of them. Each seat is asked exactly as a real run asks it (`askFor`), and a seat
 * that binds is recorded in the ledger, so independence holds both ways as in the run.
 *
 * @param {object} unit Unit contract subset: { id, capability, rigor?, writes?, pattern?, seats? }.
 * @param {object} runnerConfig Runner config (capabilities, executors, patterns, ...).
 * @param {object} [options]
 * @param {object} [options.session] bind() session context. Defaults to a headless session.
 * @param {Array} [options.overrides] Overrides bind() reads, as a unit run would pass them. Defaults to none.
 * @param {boolean} [options.raiseAuthorized] Whether the calling door may raise a tier. Defaults to false.
 * @param {string} [options.workflowId] The workflow the unit belongs to, to name where a seat's recommended tier was declared.
 * @returns {Promise<{ outcome: string, seats: Array<{ seat: string, role: string, executor?: string, invocation?: string|null, tier?: string, loweredFrom?: { from: string, fromSource: string, reason: string }, account?: { provider: string, id: string }, sharesFamilyWith?: string[], refused?: { reason: string, detail: string } }> }>}
 */
export async function simulateUnitBindings(unit, runnerConfig, { session = {}, overrides = [], raiseAuthorized = false, workflowId, collaboration } = {}) {
  const ledger = createSeatLedger();
  const seats = [];
  const unitContext = { overrides, workflowId, raiseAuthorized, blind: unit?.blind === true };
  const runRole = async (request) => {
    const { seat, batch } = request;
    let record;
    try {
      record = await ledger.serialize(() => {
        const bound = bind(askFor({ ...request, unit: request.unit || unit }, ledger, unitContext), { runnerConfig, session: { headless: true, ...session } });
        if (bound.refused) return { seat: seat.seat, role: seat.role, refused: bound.refused };
        ledger.note(seat.seat, bound.executor);
        ledger.noteDependence(seat.seat, request.independentOf);
        return {
          seat: seat.seat,
          role: seat.role,
          executor: bound.executor,
          invocation: bound.invocation,
          tier: bound.tier,
          ...(bound.provenance?.tier?.loweredFrom ? { loweredFrom: bound.provenance.tier.loweredFrom } : {}),
          ...(bound.account ? { account: bound.account } : {}),
          ...(bound.provenance?.account?.skipped ? { accountSkipped: bound.provenance.account.skipped } : {}),
          ...(bound.provenance?.familySpread?.value.sharedWith.length ? { sharesFamilyWith: bound.provenance.familySpread.value.sharedWith } : {}),
        };
      });
    } finally {
      batch?.arrive();
    }
    seats.push(record);
    return record.refused
      ? { outcome: 'policy-refusal', seat: seat.seat, role: seat.role, refused: record.refused }
      : { outcome: 'pass', seat: seat.seat, role: seat.role };
  };
  const normalizedRunnerConfig = runnerConfig?.runner ? runnerConfig : { runner: runnerConfig, ...runnerConfig };
  const effectiveCollaboration = collaboration ?? resolveCollaboration({
    unit,
    selectors: {
      callerObject: typeof unit?.pattern === 'object' && unit?.pattern !== null ? unit.pattern : null,
      callerString: typeof unit?.pattern === 'string' ? unit.pattern : null,
    },
    runnerConfig: normalizedRunnerConfig,
    shipped: shippedCatalog(),
  });
  const effective = effectiveCollaboration.pin?.effective ?? effectiveCollaboration.effective ?? effectiveCollaboration;
  const result = await runLoop(effective, unit, runnerConfig, { runRole });
  return { outcome: result.outcome, seats };
}
