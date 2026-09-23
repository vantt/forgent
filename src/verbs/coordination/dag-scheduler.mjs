// Request-boundary scheduler for immutable coordination DAG declarations.
// It deliberately owns only admission order: `execute` remains the existing
// run.mjs step interpreter and therefore reaches the normal engine doors.
import { StoreError } from '../../state/store.mjs';
import { CoordinationError } from '../../runner/coordination/schema.mjs';

function outcomeFor(error) {
  if ((error instanceof CoordinationError || error instanceof StoreError) && error.category === 'validation') {
    return error.code === 'concurrency-cap' ? 'deferred' : 'refused';
  }
  return null;
}

function errorEvidence(error) {
  return { category: error.category ?? null, code: error.code ?? null, message: error.message };
}

// Dynamic rather than level-based: after *each* Promise.race settlement this
// loop scans the ready frontier and admits every newly-ready node. It never
// sleeps/polls, and an integrity error is held until owned promises settle.
export async function scheduleDagSteps({ steps, declaration, execute, initialStates = new Map(), canAdmit = () => true }) {
  const nodeByLabel = new Map(declaration.nodes.map((node) => [node.displayLabel, node]));
  const index = new Map(steps.map((step, i) => [step.as, i]));
  const states = new Map(steps.map((step) => [step.as, initialStates.get(step.as) ?? { outcome: 'pending' }]));
  const dependents = new Map(steps.map((step) => [step.as, []]));
  for (const node of declaration.nodes) {
    for (const id of node.dependsOn) dependents.get(id.slice('node-'.length)).push(node.displayLabel);
  }
  const inFlight = new Map();
  let overlapSequence = 0;
  let integrityError = null;
  const blockDescendants = (label, blockedBy) => {
    for (const child of dependents.get(label) ?? []) {
      const state = states.get(child);
      if (state.outcome !== 'pending') continue;
      state.outcome = 'blocked';
      state.blockedBy = blockedBy;
      blockDescendants(child, blockedBy);
    }
  };
  const admit = (step) => {
    const state = states.get(step.as);
    // Cancellation is an admission boundary, not an ordinary dispatch
    // refusal: runs already in flight keep their evidence, but this node was
    // never materialized and must stay visibly unattempted.
    if (!canAdmit()) {
      state.outcome = 'blocked';
      state.blockedBy = 'terminal-session';
      return;
    }
    state.outcome = 'in-flight';
    const promise = Promise.resolve().then(() => execute(step)).then(
      (result) => ({ step, result }),
      (error) => ({ step, error }),
    );
    inFlight.set(step.as, promise);
  };
  const ready = (step) => {
    const node = nodeByLabel.get(step.as);
    return states.get(step.as).outcome === 'pending' && node.dependsOn.every((id) => states.get(id.slice('node-'.length)).outcome === 'settled');
  };

  while (true) {
    if (!integrityError) {
      const frontier = steps.filter((step) => ready(step));
      const overlapGroupId = frontier.length > 1 ? `dag-overlap-${++overlapSequence}` : null;
      for (const step of frontier) {
        if (overlapGroupId) states.get(step.as).overlapGroup = { id: overlapGroupId, nodeLabels: frontier.map((node) => node.as) };
        admit(step);
      }
    }
    if (inFlight.size === 0) break;
    const settled = await Promise.race(inFlight.values());
    inFlight.delete(settled.step.as);
    const state = states.get(settled.step.as);
    if (!settled.error) {
      state.outcome = 'settled';
      state.result = settled.result;
      delete state.error;
      // A capacity refusal is intentionally transient. A result-linked node
      // just freed an invocation-owned slot, so retry only those deferred
      // admissions immediately on this settlement signal (never by polling).
      for (const candidate of states.values()) {
        if (candidate.outcome === 'deferred') {
          candidate.outcome = 'pending';
          delete candidate.error;
        }
      }
    } else {
      const outcome = outcomeFor(settled.error);
      if (outcome === null) integrityError ??= settled.error;
      else {
        state.outcome = outcome;
        state.error = errorEvidence(settled.error);
        if (outcome === 'refused') blockDescendants(settled.step.as, settled.step.as);
      }
    }
  }
  if (integrityError) throw integrityError;
  for (const step of steps) {
    const state = states.get(step.as);
    // A ready node denied by the authoritative store cap has already been
    // classified. Pending here means no invocation-owned capacity can free.
    if (state.outcome === 'pending') state.outcome = 'deferred';
  }
  return steps.map((step) => ({ as: step.as, index: index.get(step.as), ...states.get(step.as) }));
}
