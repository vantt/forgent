// src/runner/execution/dry-bind.mjs — read-only simulation of how a unit's pattern would bind its seats
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/**. Calls no model,
// starts no process and writes nothing: it drives the SAME pattern code the runner drives, with a
// seat runner that only calls bind().

import { bind } from './bind.mjs';
import { runPattern } from './patterns/index.mjs';
import { createSeatLedger } from './seat-ledger.mjs';
import { workflowTierOf } from './seat-resolver.mjs';

/**
 * Bind every seat a unit's pattern would dispatch, in the order the pattern dispatches them,
 * without running any of them. A seat that binds is recorded in the ledger so a later seat's
 * `independentOf` excludes its provider family, exactly as in a real run.
 *
 * @param {object} unit Unit contract subset: { id, capability, rigor?, writes?, pattern?, seats? }.
 * @param {object} runnerConfig Runner config (capabilities, executors, patterns, ...).
 * @param {object} [options]
 * @param {object} [options.session] bind() session context. Defaults to a headless session.
 * @param {Array} [options.overrides] Overrides bind() reads, as a unit run would pass them. Defaults to none.
 * @param {object} [options.selectors] What the calling door chose (persona, seat, capability), as a unit run would pass it.
 * @param {boolean} [options.raiseAuthorized] Whether the calling door may raise a tier. Defaults to false.
 * @param {string} [options.workflowId] The workflow the unit belongs to, to name where a seat's recommended tier was declared.
 * @returns {Promise<{ outcome: string, seats: Array<{ seat: string, role: string, executor?: string, invocation?: string|null, account?: { provider: string, id: string }, sharesFamilyWith?: string[], refused?: { reason: string, detail: string } }> }>}
 */
export async function simulateUnitBindings(unit, runnerConfig, { session = {}, overrides = [], selectors, raiseAuthorized = false, workflowId } = {}) {
  const ledger = createSeatLedger();
  const seats = [];
  const runRole = async ({ seat, unit: seatUnit, independentOf = [], preferIndependentOf = [], batch }) => {
    const workflowTier = workflowTierOf(seat, seatUnit || unit, workflowId);
    const record = await ledger.serialize(() => {
      const bound = bind(
        {
          unit: seatUnit || unit,
          seat: seat.seat,
          role: seat.role,
          posture: seat.posture,
          ...(seat.persona ? { persona: seat.persona } : {}),
          ...(workflowTier ? { workflowTier } : {}),
          ...(selectors && Object.values(selectors).some((v) => v) ? { selectors } : {}),
          raiseAuthorized: raiseAuthorized === true,
          readOnly: seat.posture.readOnly,
          independentOf: ledger.resolve(independentOf),
          ...(preferIndependentOf.length > 0 ? { preferIndependentOf: ledger.seats(preferIndependentOf) } : {}),
          overrides,
        },
        { runnerConfig, session: { headless: true, ...session } },
      );
      if (bound.refused) return { seat: seat.seat, role: seat.role, refused: bound.refused };
      ledger.note(seat.seat, bound.executor);
      return {
        seat: seat.seat,
        role: seat.role,
        executor: bound.executor,
        invocation: bound.invocation,
        ...(bound.account ? { account: bound.account } : {}),
        ...(bound.provenance?.account?.skipped ? { accountSkipped: bound.provenance.account.skipped } : {}),
        ...(bound.provenance?.familySpread?.value.sharedWith.length ? { sharesFamilyWith: bound.provenance.familySpread.value.sharedWith } : {}),
      };
    });
    seats.push(record);
    batch?.arrive();
    return record.refused
      ? { outcome: 'policy-refusal', seat: seat.seat, role: seat.role, refused: record.refused }
      : { outcome: 'pass', seat: seat.seat, role: seat.role };
  };
  const result = await runPattern(unit.pattern || 'solo', unit, runnerConfig, { runRole });
  return { outcome: result.outcome, seats };
}
