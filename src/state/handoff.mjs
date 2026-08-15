// handoff.mjs — pure legality guard for the multi-role team harness
// (tsk-2t9c D1/D3/D4/D5/D8). LAYER: domain, same tier as stage-fsm.mjs --
// it may import kernel (workflow-stage-graphs.mjs) but never fs, never a
// config read. Cap and open-call-depth are always caller-supplied
// (`hasWorkerSlotRoom({ ceiling })`'s own purity precedent,
// src/state/worker-slots.mjs) so this module stays a pure function of its
// arguments, testable with no store, no lock, no disk.
//
// Mechanism vs policy (D3): this file only ever answers "is this call
// legal" -- it never picks who should be called, never judges whether a
// call is a good idea. A refused call always carries the legal
// alternatives so the caller (soul) can self-correct without a second
// round trip -- "chặn và dạy tại chỗ".

import { legalCallEdges } from './workflow-stage-graphs.mjs';

/**
 * Evaluate whether a proposed handoff is legal.
 *
 * @param {object} args
 * @param {object} args.domain - a DOMAINS registry entry (already resolved
 *   via getDomain).
 * @param {string} args.stage - the item's current stage.
 * @param {string} args.fromRole - the role currently holding the item
 *   (item.holder, or the domain's roleGraph.defaultRole when unset).
 * @param {string} args.toRole - the role being called.
 * @param {string} args.reason - one of the edge's declared reasons
 *   (advise/assist/review/consult) -- matched against the registered
 *   edge, never invented here.
 * @param {number} [args.openCallDepth] - how many async calls are
 *   already open on this item's current call-thread (derived by the
 *   caller from replay, never a stored counter -- D-instance R7). Only
 *   meaningful for `mode: 'async'` edges; sync calls never nest against
 *   this cap.
 * @returns {{ ok: true, edge: object } | { ok: false, refusal: string, legalEdges: object[] }}
 */
export function evaluateHandoff({ domain, stage, fromRole, toRole, reason, openCallDepth = 0 }) {
  const legalEdges = legalCallEdges(domain, stage, fromRole);

  if (legalEdges.length === 0) {
    return {
      ok: false,
      refusal: domain?.roleGraph
        ? `no legal call edges for role "${fromRole}" at stage "${stage}"`
        : `domain declares no roleGraph -- handoff is not available`,
      legalEdges: [],
    };
  }

  const edge = legalEdges.find((candidate) => candidate.to === toRole && candidate.reason === reason);
  if (!edge) {
    return {
      ok: false,
      refusal: `no legal edge from "${fromRole}" to "${toRole}" with reason "${reason}" at stage "${stage}"`,
      legalEdges,
    };
  }

  const cap = domain?.roleGraph?.callstackCap;
  if (edge.mode === 'async' && typeof cap === 'number' && openCallDepth >= cap) {
    return {
      ok: false,
      refusal: `callstack cap (${cap}) reached -- cannot open another async call on this thread`,
      legalEdges,
    };
  }

  return { ok: true, edge };
}
