// Workflow's pure scheduling projection; the keeper never reads a case ledger itself.

const text = (value) => typeof value === 'string' && value.length > 0;

/** One record per open activity. Eligibility comes from the existing case projection, not a second FSM. */
export function recordsOfCase({ events, state, projection: p }) {
  if (!p.open || state.status === 'completed') return [];
  const open = new Set([...p.eligible, ...p.openGates.map((g) => g.stepId), ...p.reservations.map((r) => r.activity)]);
  return (p.guide?.activities ?? []).filter((a) => open.has(a.id)).map((a) => {
    const record = { item: p.caseId, step: a.id };
    const capabilities = a.unit?.capability ? [a.unit.capability] : (state.workflow?.steps?.find((s) => s.id === a.id)?.units ?? []).map((u) => u.template?.capability).filter(text);
    const unique = [...new Set(capabilities)];
    if (unique.length === 1) {
      const maxRounds = p.frame?.dispatches;
      record.needs = { kind: 'capability', ref: unique[0], ...(Number.isInteger(maxRounds) && maxRounds >= 0 ? { maxRounds } : {}) };
    }
    const gate = p.openGates.find((g) => g.stepId === a.id);
    const live = p.liveReservations.find((r) => r.activity === a.id);
    if (gate) {
      // Older gates contain only prose. Never pretend that prose names an owner question.
      const parked = events.findLast((e) => e.type === 'gate.park' && e.payload?.stepId === a.id)?.payload;
      const question = parked?.questionId ?? gate.question;
      if (text(question) && /^q-[a-z0-9]+$/.test(question)) record.waitingOn = { kind: 'person', ref: question };
      else delete record.needs; // Only this legacy item needs judgement; never dispatch through its gate.
    } else if (live) {
      record.waitingOn = { kind: 'actor', ref: live.unitRunId ?? live.reservationId };
    } else {
      const last = p.reservations.findLast((r) => r.activity === a.id && r.settled);
      const current = a.produces.every((id) => p.milestones[id]?.state === 'achieved');
      if (current && ((last && ['pass', 'findings'].includes(last.outcome)) || ['completed', 'answered'].includes(state.steps[a.id]?.status))) record.outcome = 'done';
      else if (last && ['cancelled', 'withdrawn', 'wontfix'].includes(last.outcome)) record.outcome = last.outcome;
    }
    return record;
  });
}
