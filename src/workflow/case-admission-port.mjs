// src/workflow/case-admission-port.mjs — the Workflow's implementation of the Execution Core's admission port
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)
//
// The Execution Core owns the interface (src/runner/execution/case-admission-port.mjs) and asks it
// before it runs a Unit for a case; the entry point builds this port and injects it, so the core never
// imports the Workflow. Every operation is a short section under the case's `advance`:
//
//   - a Playbook proposer holds `advance` for its whole life and passes the hold (`heldAdvance`); the
//     port never acquires then, so the proposer's own admit and settle cannot refuse themselves;
//   - anyone else (a conductor, a standalone door) is tried once per operation: `admit` that finds the
//     lock held answers `case-admission-busy` (retryable), `settle` leaves a settle-pending file the next
//     holder of `advance` folds in before anything else, so a receipt is never lost.

import fs from 'node:fs';
import path from 'node:path';

import { appendWorkflowEvent, projectWorkflowState, readWorkflowEvents } from './store.mjs';
import { tryAcquireAdvanceLock } from './case-lock.mjs';
import { applySettle, drainCaseInbox, writeReservationFile, writeSettlePending } from './case-runtime.mjs';
import { projectCase, receiptsFromResults } from './case-projection.mjs';
import { admitProposal, newReservationId, recheckReservation } from './case-admission.mjs';
import { bindWorktree, ensureBindingsSentinel, readBinding } from './case-bindings.mjs';
import { gitOut, playbookSubjectDigests } from './unit-handoff.mjs';

const caseDirOf = (mainRoot, caseId) => path.join(mainRoot, '.fgos', 'workflow-runs', caseId);

const worktreeFacts = (worktree) => ({
  commonDir: gitOut(worktree, ['rev-parse', '--git-common-dir'])?.trim() ?? null,
  ref: gitOut(worktree, ['rev-parse', '--abbrev-ref', 'HEAD'])?.trim() ?? null,
});

/** Read the ledger, once more when an append by another process is caught half-written. */
function readEvents(mainRoot, caseId) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return readWorkflowEvents({ repoRoot: mainRoot, workflowRunId: caseId });
    } catch (err) {
      if (err.code !== 'workflow-ledger-unterminated' || attempt >= 3) throw err;
    }
  }
}

/** The case as admission sees it: the projection with the digests a playbook's subjects have now. */
function readCase(mainRoot, caseId) {
  const events = readEvents(mainRoot, caseId);
  const base = projectCase(events);
  const state = projectWorkflowState(events);
  const currentDigests = base.kind === 'playbook' ? playbookSubjectDigests({ state, workflow: state.workflow, guide: base.guide, mainRoot }) : {};
  return { events, projection: projectCase(events, { currentDigests }) };
}

const refusal = (code, condition) => ({ refused: { code, condition } });

/**
 * @param {object} params
 * @param {string} params.repoRoot the main checkout the ledger and the bindings live under
 * @param {string} [params.caseId] the case this port serves, when its caller is that case's proposer
 * @param {object} [params.heldAdvance] the proposer's `advance` hold; given, the port never acquires
 * @returns {import('../runner/execution/case-admission-port.mjs').CaseAdmissionPort}
 */
export function createCaseAdmissionPort({ repoRoot, caseId = null, heldAdvance = null }) {
  const mainRoot = path.resolve(repoRoot);
  // A host-side sentinel tells a later reader that an empty bindings directory is the real one.
  ensureBindingsSentinel(mainRoot);

  /** Run `section(hold)` under `advance`; `null` when another process holds it. */
  const underAdvance = (id, section) => {
    if (heldAdvance) return section(heldAdvance);
    const hold = tryAcquireAdvanceLock(mainRoot, id);
    if (hold === null) return null;
    try {
      return section(hold);
    } finally {
      hold.release();
    }
  };

  return {
    resolveBinding({ worktree, caseId: asked = null }) {
      const binding = readBinding({ mainRoot, worktree, caseId: asked ?? caseId ?? undefined });
      return { answer: binding.answer, ...(binding.record ? { record: binding.record } : {}) };
    },

    admit(proposal) {
      const id = proposal.caseRef.caseId;
      if (caseId && caseId !== id) return refusal('authority-context-conflict', `this port serves case ${caseId}, the Unit names case ${id}`);
      if (heldAdvance && heldAdvance.workflowRunId !== id) return refusal('authority-context-conflict', `advance of case ${heldAdvance.workflowRunId} is held; a scope never holds two`);
      if (!fs.existsSync(caseDirOf(mainRoot, id))) return refusal('authority-context-invalid', `case ${id} does not exist`);
      const writing = proposal.writes.length > 0;

      const answer = underAdvance(id, (hold) => {
        drainCaseInbox({ mainRoot, caseId: id, hold });
        const { projection } = readCase(mainRoot, id);

        // The same Unit asked again (its controller died before its run existed) keeps its reservation.
        const unitId = proposal.caseRef.unitId ?? null;
        const live = unitId === null ? undefined : projection.liveReservations.find((r) => r.activity === proposal.activity && r.unitId === unitId);
        if (live) {
          let binding = null;
          if (writing) {
            const made = bindWorktree({ mainRoot, hold, caseId: id, worktree: proposal.worktree, ...worktreeFacts(proposal.worktree) });
            if (!made.ok) return refusal(made.answer, `worktree ${proposal.worktree} cannot be bound to case ${id}: ${made.answer}`);
            if (!made.already) binding = { key: made.key, generation: made.generation, created: true };
          }
          writeReservationFile({ mainRoot, caseId: id, reservation: { ...live, worktree: writing ? proposal.worktree : null, unitRunId: proposal.unitRunId, ...(binding ? { binding } : {}) } });
          return { admitted: true, reservationId: live.reservationId, caseId: id, seatLaunchCeiling: live.seatLaunchCeiling ?? null };
        }

        const verdict = admitProposal({
          projection,
          proposal: {
            activity: proposal.activity,
            unitId: proposal.caseRef.unitId,
            writes: proposal.writes,
            worktree: writing ? proposal.worktree : undefined,
            blind: proposal.blind,
            handoffRefs: proposal.handoffRefs,
            rigor: proposal.rigor,
            seatLaunches: proposal.seatLaunches,
            unitRunId: proposal.unitRunId,
            reason: proposal.caseRef.reason,
            proposer: projection.kind === 'playbook' ? 'playbook' : 'agent',
          },
          bindingAnswers: writing ? { [proposal.worktree]: readBinding({ mainRoot, worktree: proposal.worktree, caseId: id }) } : {},
          reservationId: newReservationId(),
        });
        if (verdict.refused) return { refused: verdict.refused };

        let binding = null;
        if (writing) {
          const made = bindWorktree({ mainRoot, hold, caseId: id, worktree: proposal.worktree, ...worktreeFacts(proposal.worktree) });
          if (!made.ok) return refusal(made.answer, `worktree ${proposal.worktree} cannot be bound to case ${id}: ${made.answer}`);
          if (!made.already) binding = { key: made.key, generation: made.generation, created: true };
        }
        for (const event of verdict.events) appendWorkflowEvent({ repoRoot: mainRoot, workflowRunId: id, event, hold });
        writeReservationFile({ mainRoot, caseId: id, reservation: { ...verdict.reservation, ...(binding ? { binding } : {}) } });
        return { admitted: true, reservationId: verdict.reservation.reservationId, caseId: id, seatLaunchCeiling: verdict.reservation.seatLaunchCeiling };
      });
      return answer ?? refusal('case-admission-busy', `case ${id} is being advanced by another process; ask again`);
    },

    settle(reservationId, result) {
      const id = result.caseId;
      const reservation = readEvents(mainRoot, id).find((e) => e.type === 'reservation' && e.payload?.reservationId === reservationId)?.payload;
      if (!reservation) return;
      const payload = {
        reservationId,
        activity: reservation.activity,
        unitId: reservation.unitId,
        unitRunId: result.unitRunId ?? null,
        outcome: result.outcome,
        receipts: receiptsFromResults({ unitRunId: result.unitRunId ?? null, results: result.results ?? [] }),
        achieved: [],
        seatLaunchesUsed: result.seatLaunchesUsed ?? 0,
        ...(result.frameExhausted ? { frameExhausted: true } : {}),
        blind: reservation.blind === true,
        settledAt: new Date().toISOString(),
      };
      const done = underAdvance(id, (hold) => applySettle({ mainRoot, caseId: id, hold, settle: payload }));
      if (done === null) writeSettlePending({ mainRoot, caseId: id, settle: payload });
    },

    recheckEffect(reservationId, { caseId: id }) {
      const { projection } = readCase(mainRoot, id);
      const reservation = projection.liveReservations.find((r) => r.reservationId === reservationId);
      if (!reservation) return refusal('reservation-not-live', `reservation ${reservationId} of case ${id} is not live`);
      const broken = recheckReservation({ projection, reservation });
      return broken ? refusal(broken[0].code, broken.map((v) => v.condition).join('; ')) : { ok: true };
    },
  };
}
