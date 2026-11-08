// src/workflow/definition.mjs — Workflow definition contract and schema validator
// Architecture guard: MUST NOT import src/state/** or src/runner/** (kernel layer). The exceptions are two
// import-free leaves: src/runner/dispatch/write-scope.mjs, so a workflow and a unit read writes one way, and
// src/runner/dispatch/run-timeout.mjs, so they check a unit's timeoutMs one way.

import path from 'node:path';
import { canonicalizeWrites } from '../runner/dispatch/write-scope.mjs';
import { runTimeoutProblem } from '../runner/dispatch/run-timeout.mjs';
import { GATE_MODES, GuideSchemaError, RIGOR_ORDER, normalizeGuide } from './guide-schema.mjs';
import { dependencyOrder } from './steps.mjs';

/** Thrown for a malformed Workflow definition. Kept free of runner imports (bar the import-free
 * write-scope and run-timeout leaves) so the Work-lifecycle kernel can read step data without depending on dispatch. */
export class WorkflowDefinitionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'WorkflowDefinitionError';
  }
}
const DISALLOWED_G2_FIELDS = Object.freeze(['executor', 'provider', 'model', 'tier', 'invocation', 'prefer', 'overrides']);
const VALID_STEP_PHASES = new Set(['clarify', 'discover', 'plan', 'execute']);
const VALID_OPERATION_DISPATCH = new Set(['human-only']);
const INPUT_ENTRY_KEYS = new Set(['step', 'sameSeat', 'label']);
// Where a definition comes from, as the caller that loaded it says -- never a field of the data.
// Only a units file (`fgos workflow start --units`) is a one-off list of Units, so only its unit
// templates may carry a soft executor `prefer`; a preset or plan is shipped to other projects
// and keeps the G2 rule (its seats are tuned with --seats and personas instead).
const UNITS_FILE_SOURCE = 'units-file';

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isText = (value) => typeof value === 'string' && value.trim().length > 0;
const trimmedOrUndefined = (value) => (typeof value === 'string' ? value.trim() : undefined);
const fail = (message) => { throw new WorkflowDefinitionError(message); };

/** Refuse an infrastructure field on `object`: the one G2 rule for every place a definition can carry one. */
function rejectInfraFields(object, subject, { allow, suffix = '' } = {}) {
  for (const field of DISALLOWED_G2_FIELDS) {
    if (field === allow) continue;
    if (object[field] !== undefined) fail(`${subject} contains disallowed infrastructure field "${field}" (G2 constraint${suffix}).`);
  }
}

export function normalizeContextRefs(raw = [], label = 'contextRefs') {
  if (!Array.isArray(raw) || raw.some((ref) => typeof ref !== 'string' || !ref.trim() ||
    (ref.startsWith('unit-run:') || ref.startsWith('gate-answer:')
      ? !/^(unit-run|gate-answer):[^/\\\s\0]+\/[^/\\\s\0]+$/.test(ref) || ref.split(/[:/]/).slice(1).some((part) => part === '.' || part === '..')
      : path.isAbsolute(ref) || ref.includes('\\') || ref.includes('\0') || ref.split('/').includes('..')))) {
    throw new WorkflowDefinitionError(`${label} must be an array of safe repo-relative paths or handoff references`);
  }
  return Object.freeze([...raw]);
}

/** One `inputs` entry of a unit template: which earlier step's results the unit receives. */
function normalizeInputEntry(raw, label) {
  if (!isObject(raw)) fail(`${label} must be an object like { step: <step id> }`);
  for (const key of Object.keys(raw)) {
    if (!INPUT_ENTRY_KEYS.has(key)) fail(`${label} has unknown key "${key}" (allowed: step, sameSeat, label)`);
  }
  if (!isText(raw.step)) fail(`${label} requires "step" (the id of an earlier step)`);
  if (raw.sameSeat !== undefined && typeof raw.sameSeat !== 'boolean') fail(`${label} sameSeat must be true or false`);
  if (raw.label !== undefined && !isText(raw.label)) fail(`${label} label must be a non-empty string`);
  return Object.freeze({
    step: raw.step.trim(),
    ...(raw.sameSeat === true ? { sameSeat: true } : {}),
    ...(raw.label ? { label: raw.label.trim() } : {}),
  });
}

function normalizeGate(raw, stepLabel) {
  if (raw === undefined || raw === null) return null;
  if (!isObject(raw)) fail(`${stepLabel}.gate must be an object`);
  const mode = raw.mode !== undefined ? String(raw.mode).trim() : 'consent';
  if (!GATE_MODES.includes(mode)) fail(`${stepLabel}.gate.mode must be ${GATE_MODES.map((m) => `"${m}"`).join(' or ')}, got "${raw.mode}"`);
  return Object.freeze({ kind: raw.kind || 'human', mode, question: trimmedOrUndefined(raw.question), header: trimmedOrUndefined(raw.header) });
}

function normalizeWriteScope(raw, label) {
  if (raw === undefined) return [];
  try {
    return canonicalizeWrites(raw);
  } catch (err) {
    return fail(`${label}.writes: ${err.message}`);
  }
}

function normalizeStanceOptions(raw, label) {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw) || raw.some((option) => !isText(option))) fail(`${label} stanceOptions must be an array of non-empty strings`);
  const options = raw.map((option) => option.trim());
  if (new Set(options).size !== options.length || options.includes('other')) fail(`${label} stanceOptions must be unique; "other" is reserved`);
  return Object.freeze(options);
}

function normalizeAcceptOutcomes(raw, label) {
  const outcomes = raw === undefined ? ['pass'] : raw;
  if (!Array.isArray(outcomes) || !outcomes.length
    || outcomes.some((outcome) => !['pass', 'findings'].includes(outcome)) || new Set(outcomes).size !== outcomes.length) {
    fail(`${label}.acceptOutcomes requires a reviewed template and unique pass/findings outcomes`);
  }
  return outcomes;
}

/** The checks on a unit template's declared fields, throwing on the first that fails; returns the trimmed rigor. */
function checkTemplateFields(template, label) {
  if (!isText(template.capability)) fail(`${label} requires "capability" (e.g. domain:verb or verb)`);
  const timeoutProblem = template.timeoutMs === undefined ? null : runTimeoutProblem(template.timeoutMs, `${label} timeoutMs`);
  if (timeoutProblem) fail(timeoutProblem);
  if (template.verify !== undefined && !isText(template.verify)) fail(`${label} verify must be a non-empty command string`);
  if (template.skills !== undefined && (!Array.isArray(template.skills) || template.skills.length === 0 || template.skills.some((skill) => !isText(skill)))) {
    fail(`${label} skills must be a non-empty array of non-empty skill names`);
  }
  const rigor = template.rigor ? String(template.rigor).trim() : undefined;
  if (rigor && !RIGOR_ORDER.includes(rigor)) fail(`${label} invalid rigor "${rigor}", must be one of [${RIGOR_ORDER.join(', ')}]`);
  return rigor;
}

function checkTemplateShapes(template, label) {
  if (template.seats !== undefined && (!Array.isArray(template.seats) || !template.seats.every(isObject))) {
    fail(`${label}.seats must be an array of { seat, role, persona?, tier? } (checked in full by validateWorkflowChecked)`);
  }
  if (template.params !== undefined && !isObject(template.params)) fail(`${label} params must be an object (pattern params such as roleTasks)`);
  for (const flag of ['anonymizeInputs', 'blind']) {
    if (template[flag] !== undefined && typeof template[flag] !== 'boolean') fail(`${label} ${flag} must be true or false`);
  }
  if (template.inputs !== undefined && !Array.isArray(template.inputs)) fail(`${label} inputs must be an array of { step, sameSeat?, label? } entries`);
}

function normalizeTemplate(template, label, allowPrefer) {
  const rigor = checkTemplateFields(template, label);
  const writes = normalizeWriteScope(template.writes, label);
  checkTemplateShapes(template, label);
  const stanceOptions = normalizeStanceOptions(template.stanceOptions, label);
  const contextRefs = normalizeContextRefs(template.contextRefs, `${label}.contextRefs`);
  const acceptOutcomes = normalizeAcceptOutcomes(template.acceptOutcomes, label);
  const inputs = template.inputs?.map((entry, iIdx) => normalizeInputEntry(entry, `${label}.inputs[${iIdx}]`));
  return Object.freeze({
    capability: template.capability.trim(),
    objective: trimmedOrUndefined(template.objective),
    pattern: trimmedOrUndefined(template.pattern),
    rigor,
    writes,
    taskSpec: trimmedOrUndefined(template.taskSpec),
    persona: isText(template.persona) ? template.persona.trim() : undefined,
    ...(template.timeoutMs !== undefined ? { timeoutMs: template.timeoutMs } : {}),
    ...(template.verify !== undefined ? { verify: template.verify.trim() } : {}),
    ...(template.skills !== undefined ? { skills: Object.freeze([...new Set(template.skills.map((skill) => skill.trim()))]) } : {}),
    // Shape is checked by the Unit contract (validateUnit) before a units file gets here and again at run.
    ...(allowPrefer && template.prefer !== undefined ? { prefer: Object.freeze(structuredClone(template.prefer)) } : {}),
    params: template.params === undefined ? undefined : structuredClone(template.params),
    ...(template.seats !== undefined ? { seats: Object.freeze(template.seats.map((entry) => Object.freeze({ ...entry }))) } : {}),
    contextRefs,
    ...(template.acceptOutcomes !== undefined
      ? { acceptOutcomes: Object.freeze([...acceptOutcomes]) }
      : (template.pattern === 'reviewed' ? { acceptOutcomes: Object.freeze(['pass']) } : {})),
    ...(stanceOptions === undefined ? {} : { stanceOptions }),
    anonymizeInputs: template.anonymizeInputs === true ? true : undefined,
    blind: template.blind === true ? true : undefined,
    inputs: inputs ? Object.freeze(inputs) : undefined,
  });
}

function normalizeUnit(u, uIdx, stepLabel, stepId, allowPrefer) {
  const label = `${stepLabel}.units[${uIdx}]`;
  if (!isObject(u)) fail(`${label} must be a non-null object`);
  rejectInfraFields(u, label);
  const template = u.template && typeof u.template === 'object' ? u.template : u;
  rejectInfraFields(template, `${label}.template`, { allow: allowPrefer ? 'prefer' : undefined });
  return Object.freeze({
    id: isText(u.id) ? u.id.trim() : `${stepId}-u${uIdx + 1}`,
    template: normalizeTemplate(template, label, allowPrefer),
    dependsOn: Array.isArray(u.dependsOn) ? u.dependsOn.map((ud) => String(ud).trim()).filter(Boolean) : [],
  });
}

function normalizeStep(s, i, workflowId, stepIds, allowPrefer) {
  const label = `Workflow "${workflowId}" steps[${i}]`;
  if (!isObject(s)) fail(`${label} must be a non-null object`);
  rejectInfraFields(s, `${label} (id: "${s.id || i}")`);
  if (!isText(s.id)) fail(`${label} requires a non-empty string "id"`);
  const id = s.id.trim();
  if (stepIds.has(id)) fail(`${label} has duplicate step id "${id}"`);
  stepIds.add(id);
  const dependsOn = Array.isArray(s.dependsOn)
    ? s.dependsOn.map((d, dIdx) => (isText(d) ? d.trim() : fail(`${label}.dependsOn[${dIdx}] must be a non-empty string`)))
    : [];
  if (s.kind !== undefined && s.kind !== null && s.kind !== 'standard') {
    fail(s.kind === 'integrate'
      ? `${label} kind "integrate" is no longer a Playbook step kind: a unit's branch is merged at the approve door, not by the Playbook`
      : `${label} unknown kind ${JSON.stringify(s.kind)}, the only step kind is "standard"`);
  }
  if (s.target !== undefined && s.target !== null) {
    fail(`${label} "target" is not a Playbook step field: a unit's branch is merged at the approve door, not by the Playbook`);
  }
  const gate = normalizeGate(s.gate, label);
  const stepMachine = normalizeWorkStepFields(s, label);
  const units = Array.isArray(s.units) ? s.units.map((u, uIdx) => normalizeUnit(u, uIdx, label, id, allowPrefer)) : [];
  return Object.freeze({
    id,
    title: typeof s.title === 'string' ? s.title.trim() : id,
    dependsOn,
    ...(stepMachine.phase ? { phase: stepMachine.phase } : {}),
    ...(stepMachine.skill ? { skill: stepMachine.skill } : {}),
    operations: Object.freeze(stepMachine.operations),
    gate,
    units: Object.freeze(units),
  });
}

/** Declared steps must exist, not wait on themselves or in a loop; a unit's `inputs` name steps its step builds on. */
function checkStepRefs(workflowId, steps) {
  const stepIds = new Set(steps.map((step) => step.id));
  for (const step of steps) {
    for (const dep of step.dependsOn) {
      if (!stepIds.has(dep)) fail(`Workflow "${workflowId}" step "${step.id}" depends on undeclared step "${dep}"`);
      if (dep === step.id) fail(`Workflow "${workflowId}" step "${step.id}" cannot depend on itself`);
    }
  }
  const { stuck } = dependencyOrder(steps);
  if (stuck.length > 0) fail(`Workflow "${workflowId}" steps ${stuck.map((step) => `"${step.id}"`).join(', ')} wait on each other`);
  const stepsById = new Map(steps.map((step) => [step.id, step]));
  const builtOn = (stepId, seen = new Set()) => {
    for (const dep of stepsById.get(stepId).dependsOn) {
      if (!seen.has(dep)) builtOn(dep, seen.add(dep));
    }
    return seen;
  };
  for (const step of steps) {
    const earlier = builtOn(step.id);
    for (const u of step.units) {
      (u.template.inputs ?? []).forEach((entry, iIdx) => {
        const where = `Workflow "${workflowId}" step "${step.id}" unit "${u.id}" inputs[${iIdx}]`;
        if (!stepIds.has(entry.step)) fail(`${where} names undeclared step "${entry.step}"`);
        if (!earlier.has(entry.step)) fail(`${where} names step "${entry.step}", which this step does not depend on (directly or not)`);
      });
    }
  }
}

/**
 * Validate a Workflow definition object.
 *
 * @param {unknown} raw Raw workflow object from YAML or parser
 * @param {object} [options]
 * @param {string} [options.source] Who loaded the definition; 'units-file' lets unit templates carry `prefer`
 * @returns {Readonly<object>} Frozen, normalized Workflow object, with its `guide` model (see guide-schema.mjs)
 */
export function validateWorkflow(raw, { source } = {}) {
  if (!isObject(raw)) fail('Workflow definition must be a non-null object');
  rejectInfraFields(raw, `Workflow definition "${raw.id || 'unnamed'}"`, { suffix: ': Workflow is non-infrastructure' });
  if (!isText(raw.id)) fail('Workflow definition requires a non-empty string "id"');
  const id = raw.id.trim();
  if (!Array.isArray(raw.steps) || raw.steps.length === 0) fail(`Workflow "${id}" must declare a non-empty "steps" array`);
  const stepIds = new Set();
  const steps = raw.steps.map((s, i) => normalizeStep(s, i, id, stepIds, source === UNITS_FILE_SOURCE));
  checkStepRefs(id, steps);
  const transitions = normalizeTransitions(raw.transitions, id, stepIds);
  const aliases = normalizeAliases(raw.aliases, id, stepIds);
  const statusSkills = normalizeStatusSkills(raw.statusSkills, id);
  let guide;
  try {
    guide = normalizeGuide(raw, { id, steps });
  } catch (err) {
    if (err instanceof GuideSchemaError) fail(`Workflow "${id}" guide: ${err.message}`);
    throw err;
  }
  return Object.freeze({
    id,
    title: typeof raw.title === 'string' ? raw.title.trim() : id,
    description: typeof raw.description === 'string' ? raw.description.trim() : '',
    steps: Object.freeze(steps),
    transitions: Object.freeze(transitions),
    aliases: Object.freeze(aliases),
    statusSkills: Object.freeze(statusSkills),
    guide,
  });
}

// ─── Work step machine ─────────────────────────────────────────────────────────
// Everything below serves the Work step machine (a Work item walking a workflow's steps: `phase`, `skill`,
// `operations`, `transitions`, `aliases`, `statusSkills`) until its cutover; the guide and the Playbook read none of it.

function normalizeOperation(raw, label) {
  if (!isObject(raw)) fail(`${label} must be a non-null object`);
  if (!isText(raw.id)) fail(`${label} requires a non-empty string "id"`);
  rejectInfraFields(raw, label);
  const id = raw.id.trim();
  if (raw.dispatch !== undefined && !VALID_OPERATION_DISPATCH.has(raw.dispatch)) {
    fail(`${label} invalid dispatch "${raw.dispatch}", must be one of [${[...VALID_OPERATION_DISPATCH].join(', ')}]`);
  }
  if (raw.skills !== undefined && (!Array.isArray(raw.skills) || raw.skills.some((sk) => !isText(sk)))) {
    fail(`${label}.skills must be an array of non-empty strings`);
  }
  let policy;
  if (raw.policy !== undefined) {
    if (!isObject(raw.policy)) fail(`${label}.policy must be an object`);
    rejectInfraFields(raw.policy, `${label}.policy`);
    policy = Object.freeze({ ...raw.policy });
  }
  return Object.freeze({
    id,
    ...(raw.primary === true ? { primary: true } : {}),
    taskSpec: isText(raw.taskSpec) ? raw.taskSpec.trim() : id,
    ...(isText(raw.role) ? { role: raw.role.trim() } : {}),
    ...(isText(raw.reason) ? { reason: raw.reason.trim() } : {}),
    ...(raw.dispatch ? { dispatch: raw.dispatch } : {}),
    ...(raw.skills ? { skills: Object.freeze(raw.skills.map((sk) => sk.trim())) } : {}),
    ...(policy ? { policy } : {}),
  });
}

/** A step's coarse `phase` (which pool a Work item sits in), its `skill`, and its `operations`. */
function normalizeWorkStepFields(s, label) {
  if (s.phase !== undefined && !VALID_STEP_PHASES.has(s.phase)) {
    fail(`${label} unknown phase "${s.phase}", must be one of [${[...VALID_STEP_PHASES].join(', ')}]`);
  }
  const operations = [];
  if (s.operations !== undefined) {
    if (!Array.isArray(s.operations)) fail(`${label}.operations must be an array`);
    const opIds = new Set();
    s.operations.forEach((rawOp, oIdx) => {
      const op = normalizeOperation(rawOp, `${label}.operations[${oIdx}]`);
      if (opIds.has(op.id)) fail(`${label}.operations has duplicate operation id "${op.id}"`);
      opIds.add(op.id);
      operations.push(op);
    });
  }
  return { phase: s.phase, skill: isText(s.skill) ? s.skill.trim() : undefined, operations };
}

function normalizeTransitions(raw, workflowId, stepIds) {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) fail(`Workflow "${workflowId}" transitions must be an array`);
  return raw.map((t, tIdx) => {
    if (!t || typeof t !== 'object' || !stepIds.has(t.from) || !stepIds.has(t.to)) {
      fail(`Workflow "${workflowId}" transitions[${tIdx}] must name declared steps in "from" and "to"`);
    }
    return Object.freeze({ from: t.from, to: t.to });
  });
}

/** Names an older record may carry for a step that now has a different id. */
function normalizeAliases(raw, workflowId, stepIds) {
  const aliases = {};
  if (raw === undefined) return aliases;
  if (!isObject(raw)) fail(`Workflow "${workflowId}" aliases must be an object of oldName -> stepId`);
  for (const [oldName, target] of Object.entries(raw)) {
    if (!stepIds.has(target)) fail(`Workflow "${workflowId}" alias "${oldName}" points at undeclared step "${target}"`);
    aliases[oldName] = target;
  }
  return aliases;
}

/** Skill/taskSpec a Work status (not a step) is handled by, e.g. retrospective. */
function normalizeStatusSkills(raw, workflowId) {
  const statusSkills = {};
  if (raw === undefined) return statusSkills;
  if (!isObject(raw)) fail(`Workflow "${workflowId}" statusSkills must be an object of status -> { skill, taskSpec }`);
  for (const [status, entry] of Object.entries(raw)) {
    if (!entry || !isText(entry.skill)) fail(`Workflow "${workflowId}" statusSkills.${status} requires a non-empty "skill"`);
    statusSkills[status] = Object.freeze({
      skill: entry.skill.trim(),
      ...(isText(entry.taskSpec) ? { taskSpec: entry.taskSpec.trim() } : {}),
    });
  }
  return statusSkills;
}
