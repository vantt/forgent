// src/workflow/guide-schema.mjs — the one guide model of a Workflow definition
// Architecture guard: kernel layer. Pure functions of plain data; MUST NOT import src/state/** or src/runner/**,
// and imports nothing at all, so the Work-lifecycle kernel can load it beside definition.mjs.
//
// A guide is an operating guide, not a script: milestones with evidence, activities that need some
// milestones and produce others, decision points with routes, MUST rows that each name one existing
// check, and what is deliberately not enforced. A file that lists `steps` with runner fields (a
// playbook) is read into the same model: each step becomes one activity, `dependsOn` its entry
// milestones, a gate a decision point. The model is data only; every rule is one line naming a check
// that already exists, never an expression the harness interprets.

/** Raised for a malformed guide; definition.mjs surfaces it as a WorkflowDefinitionError. */
export class GuideSchemaError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GuideSchemaError';
  }
}

/** The closed catalog of checks a guide's MUST row may name. */
export const GUARD_PRIMITIVES = Object.freeze([
  'milestone-reached',
  'human-consent',
  'verify-receipt',
  'write-scope-isolation',
  'independence-blind',
  'frame-allowance',
]);

/** Guards the platform already enforces; a MUST row names one as `platform:<name>` and never re-implements it. */
export const PLATFORM_GUARDS = Object.freeze([
  'g2',
  'bind-floor',
  'persona-lock',
  'harness-commit',
  'worktree-mutation-gate',
  'confinement',
  'consent-gate',
  'human-only-op',
  'approve-door',
  'lifecycle-transition',
]);

const PLATFORM_PREFIX = 'platform:';
const GUIDE_KINDS = Object.freeze(['playbook', 'guide']);
const EFFECTS = Object.freeze(['none', 'writes']);
const GATE_MODES = Object.freeze(['consent', 'input']);
const RIGORS = Object.freeze(['low', 'standard', 'high', 'critical']);
/** Primitives that check a milestone's subject, so their row must name the milestone. */
const SUBJECT_GUARDS = new Set(['milestone-reached', 'human-consent', 'verify-receipt', 'independence-blind']);
/** A frame default left for the approver to size. */
export const SET_AT_APPROVAL = 'set-at-approval';
const COUNT_DEFAULTS = Object.freeze(['dispatches', 'mutatingDispatches', 'fallbackPerSeat', 'deviationsBeforeAsk']);
const FRAME_DEFAULT_KEYS = new Set([...COUNT_DEFAULTS, 'seatLaunchesPerDispatch', 'rigorFloor']);
// Names that would turn a guide into a rule language; a rule is a row naming a check, never an expression.
const EXPRESSION_KEYS = new Set(['when', 'if', 'unless', 'expr', 'expression', 'condition', 'predicate']);

// The parts of a definition that are guide rules; `steps` and their unit templates are the runner's own data.
const GUIDE_HEAD_KEYS = Object.freeze(['roles', 'milestones', 'activities', 'decisions', 'must', 'unenforced', 'frameDefaults', 'closure']);

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isText = (value) => typeof value === 'string' && value.trim().length > 0;

function fail(message) {
  throw new GuideSchemaError(message);
}

function text(value, label) {
  if (!isText(value)) fail(`${label} must be a non-empty string`);
  return value.trim();
}

function optionalText(value, label) {
  return value === undefined || value === null ? null : text(value, label);
}

function list(value, label) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  return value;
}

function idList(value, label) {
  return list(value, label).map((entry, i) => text(entry, `${label}[${i}]`));
}

function rejectExpressionKeys(value, label) {
  if (Array.isArray(value)) {
    value.forEach((entry, i) => rejectExpressionKeys(entry, `${label}[${i}]`));
    return;
  }
  if (!isObject(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (EXPRESSION_KEYS.has(key)) {
      fail(`${label} has "${key}": a guide holds no expressions (a rule is one row naming a check from the catalog [${GUARD_PRIMITIVES.join(', ')}])`);
    }
    // A unit template is the runner's own data, not guide rules.
    if (key !== 'unit') rejectExpressionKeys(child, `${label}.${key}`);
  }
}

function rejectListedRoutesOnly(row, label) {
  if (isObject(row) && row.listedRoutesOnly !== undefined) {
    fail(`${label} has "listedRoutesOnly", which only a decision point may carry`);
  }
}

function uniqueIds(rows, label) {
  const seen = new Set();
  for (const row of rows) {
    if (seen.has(row.id)) fail(`${label} has duplicate id "${row.id}"`);
    seen.add(row.id);
  }
}

function normalizeRoles(raw) {
  const roles = list(raw, 'roles').map((entry, i) => {
    if (typeof entry === 'string') return Object.freeze({ id: text(entry, `roles[${i}]`), consults: Object.freeze([]) });
    if (!isObject(entry)) fail(`roles[${i}] must be a role id or { id, consults }`);
    return Object.freeze({ id: text(entry.id, `roles[${i}].id`), consults: Object.freeze(idList(entry.consults, `roles[${i}].consults`)) });
  });
  uniqueIds(roles, 'roles');
  return roles;
}

function normalizeMilestones(raw) {
  const milestones = list(raw, 'milestones').map((entry, i) => {
    const label = `milestones[${i}]`;
    if (!isObject(entry)) fail(`${label} must be an object`);
    rejectListedRoutesOnly(entry, label);
    return Object.freeze({
      id: text(entry.id, `${label}.id`),
      subject: optionalText(entry.subject, `${label}.subject`),
      evidence: optionalText(entry.evidence, `${label}.evidence`),
      acceptedBy: optionalText(entry.acceptedBy, `${label}.acceptedBy`),
      ...(entry.settledBy === undefined ? {} : { settledBy: text(entry.settledBy, `${label}.settledBy`) }),
    });
  });
  uniqueIds(milestones, 'milestones');
  return milestones;
}

/** The activities a playbook's steps stand for, plus the consent decision of every gated step. */
function activitiesFromSteps(steps, explicitMilestones) {
  const settledBy = new Map();
  for (const milestone of explicitMilestones) {
    if (milestone.settledBy === undefined) continue;
    if (!steps.some((step) => step.id === milestone.settledBy)) {
      fail(`milestones "${milestone.id}" is settledBy step "${milestone.settledBy}", which this workflow does not declare`);
    }
    settledBy.set(milestone.settledBy, [...(settledBy.get(milestone.settledBy) ?? []), milestone.id]);
  }
  const activities = [];
  const decisions = [];
  const stepMilestones = [];
  for (const step of steps) {
    // The step's own milestone; for a gated step it is reached once the gate is answered.
    const settled = `${step.id}.settled`;
    stepMilestones.push(Object.freeze({
      id: settled, subject: `unit reports of ${step.id}`, evidence: 'unit-report', acceptedBy: 'runner',
    }));
    const writes = step.kind === 'integrate' || step.units.some((unit) => unit.template.writes.length > 0);
    const unit = step.kind === 'integrate'
      ? { kind: 'integrate', ...(step.target ? { target: step.target } : {}) }
      : (step.units.length > 0 ? { step: step.id, units: step.units.map((u) => u.id) } : undefined);
    activities.push(Object.freeze({
      id: step.id,
      entry: Object.freeze(step.dependsOn.map((dep) => `${dep}.settled`)),
      produces: Object.freeze([settled, ...(settledBy.get(step.id) ?? [])]),
      effects: writes ? 'writes' : 'none',
      ...(unit ? { unit: Object.freeze(unit) } : {}),
    }));
    if (step.gate) {
      decisions.push(Object.freeze({
        at: settled,
        should: Object.freeze([`gate:${step.id}`]),
        reason: step.gate.question ?? `a person answers the ${step.gate.mode} gate of step ${step.id}`,
        mayInstead: Object.freeze([]),
        listedRoutesOnly: true,
        gate: step.gate.mode,
      }));
    }
  }
  return { activities, decisions, stepMilestones };
}

function normalizeActivities(raw, milestoneIds) {
  const activities = list(raw, 'activities').map((entry, i) => {
    const label = `activities[${i}]`;
    if (!isObject(entry)) fail(`${label} must be an object`);
    rejectListedRoutesOnly(entry, label);
    const id = text(entry.id, `${label}.id`);
    const entryIds = idList(entry.entry, `${label}.entry`);
    const produces = idList(entry.produces, `${label}.produces`);
    for (const ref of entryIds) {
      if (!milestoneIds.has(ref)) fail(`${label} ("${id}") entry names unknown milestone "${ref}"`);
    }
    for (const ref of produces) {
      if (!milestoneIds.has(ref)) fail(`${label} ("${id}") produces unknown milestone "${ref}"`);
    }
    if (!EFFECTS.includes(entry.effects)) fail(`${label} ("${id}") effects must be one of [${EFFECTS.join(', ')}]`);
    if (entry.unit !== undefined && !isObject(entry.unit)) fail(`${label} ("${id}") unit must be an object`);
    return Object.freeze({
      id,
      entry: Object.freeze(entryIds),
      produces: Object.freeze(produces),
      effects: entry.effects,
      ...(entry.operation === undefined ? {} : { operation: text(entry.operation, `${label}.operation`) }),
      ...(entry.unit === undefined ? {} : { unit: Object.freeze(structuredClone(entry.unit)) }),
    });
  });
  uniqueIds(activities, 'activities');
  return activities;
}

function normalizeDecisions(raw, milestoneIds, defaultListedRoutesOnly) {
  return list(raw, 'decisions').map((entry, i) => {
    const label = `decisions[${i}]`;
    if (!isObject(entry)) fail(`${label} must be an object`);
    const at = text(entry.at, `${label}.at`);
    if (!milestoneIds.has(at)) fail(`${label} is at unknown milestone "${at}"`);
    const routes = (value, name) => list(value === undefined || Array.isArray(value) ? value : [value], `${label}.${name}`).map((route, r) => {
      rejectListedRoutesOnly(route, `${label}.${name}[${r}]`);
      return text(route, `${label}.${name}[${r}]`);
    });
    const should = routes(entry.should, 'should');
    const mayInstead = routes(entry.mayInstead, 'mayInstead');
    if (entry.listedRoutesOnly !== undefined && typeof entry.listedRoutesOnly !== 'boolean') {
      fail(`${label}.listedRoutesOnly must be true or false`);
    }
    if (entry.gate !== undefined && !GATE_MODES.includes(entry.gate)) fail(`${label}.gate must be one of [${GATE_MODES.join(', ')}]`);
    const reason = optionalText(entry.reason, `${label}.reason`);
    if (should.length > 0 && reason === null) fail(`${label} (at "${at}") has a SHOULD route and needs a "reason"`);
    return Object.freeze({
      at,
      should: Object.freeze(should),
      reason,
      mayInstead: Object.freeze(mayInstead),
      listedRoutesOnly: entry.listedRoutesOnly ?? defaultListedRoutesOnly,
      ...(entry.gate === undefined ? {} : { gate: entry.gate }),
    });
  });
}

function normalizeMust(raw, milestoneIds) {
  const rows = list(raw, 'must').map((entry, i) => {
    const label = `must[${i}]`;
    if (!isObject(entry)) fail(`${label} must be an object`);
    rejectListedRoutesOnly(entry, label);
    const id = text(entry.id, `${label}.id`);
    const guard = entry.guard === undefined ? null : text(entry.guard, `${label}.guard`);
    const named = guard !== null && (GUARD_PRIMITIVES.includes(guard)
      || (guard.startsWith(PLATFORM_PREFIX) && PLATFORM_GUARDS.includes(guard.slice(PLATFORM_PREFIX.length))));
    if (!named) {
      fail(`${label} ("${id}") ${guard === null ? 'names no guard' : `names guard "${guard}", which is not an existing check`}: use one of [${GUARD_PRIMITIVES.join(', ')}] `
        + `or platform:<${PLATFORM_GUARDS.join('|')}>; a hard rule with no check belongs under "unenforced" as a SHOULD (no guard, no MUST)`);
    }
    const subject = optionalText(entry.subject, `${label}.subject`);
    if (SUBJECT_GUARDS.has(guard) && subject === null) fail(`${label} ("${id}") guard "${guard}" checks a milestone and needs "subject"`);
    if (subject !== null && !milestoneIds.has(subject)) fail(`${label} ("${id}") subject names unknown milestone "${subject}"`);
    const reason = optionalText(entry.reason ?? entry.note, `${label}.reason`);
    if (reason === null) fail(`${label} ("${id}") needs a "reason" (a hard rule says why)`);
    return Object.freeze({ id, guard, ...(subject === null ? {} : { subject }), reason });
  });
  uniqueIds(rows, 'must');
  return rows;
}

function normalizeUnenforced(raw) {
  const rows = list(raw, 'unenforced').map((entry, i) => {
    const label = `unenforced[${i}]`;
    if (!isObject(entry)) fail(`${label} must be an object`);
    rejectListedRoutesOnly(entry, label);
    const becomes = optionalText(entry.becomes, `${label}.becomes`);
    const note = optionalText(entry.note, `${label}.note`);
    if (becomes === null && note === null) fail(`${label} needs a "note" or what it "becomes"`);
    return Object.freeze({ id: text(entry.id, `${label}.id`), ...(becomes === null ? {} : { becomes }), ...(note === null ? {} : { note }) });
  });
  uniqueIds(rows, 'unenforced');
  return rows;
}

function normalizeFrameDefaults(raw) {
  if (raw === undefined || raw === null) return null;
  if (!isObject(raw)) fail('frameDefaults must be an object');
  if (raw.rigorCeiling !== undefined) fail('frameDefaults has "rigorCeiling": a frame sets a rigor floor ("rigorFloor") and never a ceiling');
  for (const key of Object.keys(raw)) {
    if (!FRAME_DEFAULT_KEYS.has(key)) fail(`frameDefaults has unknown key "${key}" (allowed: ${[...FRAME_DEFAULT_KEYS].join(', ')})`);
  }
  const out = {};
  for (const key of [...COUNT_DEFAULTS, 'seatLaunchesPerDispatch']) {
    const value = raw[key];
    if (value === undefined) {
      if (key !== 'seatLaunchesPerDispatch') fail(`frameDefaults needs "${key}" (a count, or "${SET_AT_APPROVAL}")`);
      continue;
    }
    if (value !== SET_AT_APPROVAL && !(Number.isInteger(value) && value >= 0)) {
      fail(`frameDefaults.${key} must be a non-negative integer or "${SET_AT_APPROVAL}"`);
    }
    out[key] = value;
  }
  const floor = raw.rigorFloor;
  if (floor !== SET_AT_APPROVAL && !RIGORS.includes(floor)) fail(`frameDefaults.rigorFloor must be one of [${RIGORS.join(', ')}] or "${SET_AT_APPROVAL}"`);
  out.rigorFloor = floor;
  return Object.freeze(out);
}

/**
 * Build the one guide model of a Workflow.
 *
 * The input is the raw definition (a file's own head and steps) or an already built definition, whose
 * `guide` is checked again as the model; the output is the same either way.
 *
 * @param {object} raw raw Workflow definition (top-level keys of the file) or a built one carrying `guide`
 * @param {object} context
 * @param {string} context.id Workflow id
 * @param {ReadonlyArray<object>} context.steps normalized steps (id, dependsOn, kind, gate, units)
 * @returns {Readonly<object>} frozen guide model
 * @throws {GuideSchemaError}
 */
export function normalizeGuide(raw, { id, steps }) {
  const head = isObject(raw.guide) ? raw.guide : raw;
  for (const key of GUIDE_HEAD_KEYS) rejectExpressionKeys(head[key], `Workflow "${id}" ${key}`);
  const explicitMilestones = normalizeMilestones(head.milestones);
  const hasActivities = Array.isArray(head.activities) && head.activities.length > 0;
  const kind = head.kind === undefined ? (hasActivities ? 'guide' : 'playbook') : head.kind;
  if (!GUIDE_KINDS.includes(kind)) fail(`kind must be one of [${GUIDE_KINDS.join(', ')}], got "${String(head.kind)}"`);

  // Explicit activities are authoritative (the steps then only carry the Work lifecycle); otherwise the steps are the playbook.
  const fromSteps = hasActivities ? null : activitiesFromSteps(steps, explicitMilestones);
  const stepMilestones = fromSteps?.stepMilestones ?? [];
  for (const milestone of stepMilestones) {
    if (explicitMilestones.some((m) => m.id === milestone.id)) fail(`milestones "${milestone.id}" is generated from step "${milestone.id.replace(/\.settled$/, '')}" and cannot be declared`);
  }
  const milestones = [...stepMilestones, ...explicitMilestones];
  uniqueIds(milestones, 'milestones');
  const milestoneIds = new Set(milestones.map((m) => m.id));

  const activities = fromSteps ? fromSteps.activities : normalizeActivities(head.activities, milestoneIds);
  const defaultListedRoutesOnly = kind === 'playbook';
  const decisions = [...(fromSteps?.decisions ?? []), ...normalizeDecisions(head.decisions, milestoneIds, defaultListedRoutesOnly)];
  const closure = idList(head.closure, 'closure');
  for (const ref of closure) {
    if (!milestoneIds.has(ref)) fail(`closure names unknown milestone "${ref}"`);
  }
  return Object.freeze({
    id,
    kind,
    purpose: optionalText(head.purpose, 'purpose'),
    roles: Object.freeze(normalizeRoles(head.roles)),
    milestones: Object.freeze(milestones),
    activities: Object.freeze(activities),
    decisions: Object.freeze(decisions),
    must: Object.freeze(normalizeMust(head.must, milestoneIds)),
    unenforced: Object.freeze(normalizeUnenforced(head.unenforced)),
    frameDefaults: normalizeFrameDefaults(head.frameDefaults),
    closure: Object.freeze(closure),
  });
}
