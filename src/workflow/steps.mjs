// src/workflow/steps.mjs — read helpers over a validated Workflow definition
// Architecture guard: kernel layer. Pure functions of a Workflow object; MUST NOT import src/state/** or src/runner/**.
//
// A Workflow owns its steps, the skill and operations each step offers, and the
// legal step moves for a Work item walking it. Callers that need any of that
// (the Work lifecycle, the runner loop, the verbs) read it here and hand what
// dispatch needs to dispatch; dispatch never looks a step up itself.

const EMPTY = Object.freeze([]);

/** @param {object} wf @param {string} stepId */
export function stepById(wf, stepId) {
  return wf?.steps?.find((s) => s.id === stepId);
}

/** Steps a Work item can be "at": the ones that declare a `phase`. */
export function walkableSteps(wf) {
  return (wf?.steps ?? EMPTY).filter((s) => s.phase !== undefined).map((s) => s.id);
}

/** The step a Work item enters first — the first walkable step. */
export function entryStep(wf) {
  return walkableSteps(wf)[0];
}

/** First walkable step playing `phase`, or undefined. */
export function stepForPhase(wf, phase) {
  return (wf?.steps ?? EMPTY).find((s) => s.phase === phase)?.id;
}

/** Every step id playing one of `phases`, in declaration order. */
export function stepsForPhases(wf, phases) {
  const wanted = new Set(phases);
  return (wf?.steps ?? EMPTY).filter((s) => wanted.has(s.phase)).map((s) => s.id);
}

/** Map a step name an older record carries onto the step id it became. */
export function resolveStepAlias(wf, name) {
  if (typeof name !== 'string') return name;
  return stepById(wf, name) ? name : (wf?.aliases?.[name] ?? name);
}

/** Whether a Work item may move from `from` to `to` in this workflow. */
export function isLegalStepMove(wf, from, to) {
  return (wf?.transitions ?? EMPTY).some((t) => t.from === from && t.to === to);
}

/**
 * The skill a session should load for a step, or for a Work status handled by
 * a skill instead of a step (e.g. retrospective). null when none is declared.
 */
export function skillForStep(wf, stepOrStatus) {
  return stepById(wf, stepOrStatus)?.skill ?? wf?.statusSkills?.[stepOrStatus]?.skill ?? null;
}

/** The primary operation's task spec for a step, or the status skill's task spec. */
export function taskSpecForStep(wf, stepOrStatus) {
  const step = stepById(wf, stepOrStatus);
  if (step) {
    const primary = step.operations.find((o) => o.primary) ?? step.operations[0];
    return primary?.taskSpec ?? null;
  }
  return wf?.statusSkills?.[stepOrStatus]?.taskSpec ?? null;
}

/**
 * Operations legal at a step. A step that declares none but has a skill offers
 * one synthesized primary operation; otherwise [].
 */
export function operationsForStep(wf, stepId, { defaultRole = 'implementer' } = {}) {
  const step = stepById(wf, stepId);
  if (!step) return EMPTY;
  if (step.operations.length > 0) return step.operations;
  if (step.skill) {
    return Object.freeze([
      Object.freeze({
        id: step.id,
        primary: true,
        taskSpec: step.id,
        role: defaultRole,
        skills: Object.freeze([step.skill]),
      }),
    ]);
  }
  return EMPTY;
}
