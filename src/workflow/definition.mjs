// src/workflow/definition.mjs — Workflow definition contract and schema validator
// Architecture guard: MUST NOT import src/state/** or src/runner/** (kernel layer)

import path from 'node:path';

/** Thrown for a malformed Workflow definition. Kept free of runner imports so the
 * Work-lifecycle kernel can read step data without depending on dispatch. */
export class WorkflowDefinitionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'WorkflowDefinitionError';
  }
}
const DISALLOWED_G2_FIELDS = new Set([
  'executor',
  'provider',
  'model',
  'tier',
  'invocation',
  'prefer',
  'overrides',
]);

const VALID_RIGORS = new Set(['low', 'standard', 'high', 'critical']);
const VALID_STEP_KINDS = new Set(['standard', 'integrate']);
// Coarse role a step plays when a Work item walks the workflow: which pool a
// reader files the item under and which step is the entry/exit of that part.
const VALID_STEP_PHASES = new Set(['clarify', 'discover', 'plan', 'execute']);
const VALID_OPERATION_DISPATCH = new Set(['human-only']);

function normalizeOperation(raw, label) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new WorkflowDefinitionError(`${label} must be a non-null object`);
  }
  if (typeof raw.id !== 'string' || !raw.id.trim()) {
    throw new WorkflowDefinitionError(`${label} requires a non-empty string "id"`);
  }
  for (const field of DISALLOWED_G2_FIELDS) {
    if (raw[field] !== undefined) {
      throw new WorkflowDefinitionError(`${label} contains disallowed infrastructure field "${field}" (G2 constraint).`);
    }
  }
  const id = raw.id.trim();
  if (raw.dispatch !== undefined && !VALID_OPERATION_DISPATCH.has(raw.dispatch)) {
    throw new WorkflowDefinitionError(`${label} invalid dispatch "${raw.dispatch}", must be one of [${[...VALID_OPERATION_DISPATCH].join(', ')}]`);
  }
  if (raw.skills !== undefined && (!Array.isArray(raw.skills) || raw.skills.some((sk) => typeof sk !== 'string' || !sk.trim()))) {
    throw new WorkflowDefinitionError(`${label}.skills must be an array of non-empty strings`);
  }
  let policy;
  if (raw.policy !== undefined) {
    if (!raw.policy || typeof raw.policy !== 'object' || Array.isArray(raw.policy)) {
      throw new WorkflowDefinitionError(`${label}.policy must be an object`);
    }
    for (const field of DISALLOWED_G2_FIELDS) {
      if (raw.policy[field] !== undefined) {
        throw new WorkflowDefinitionError(`${label}.policy contains disallowed infrastructure field "${field}" (G2 constraint).`);
      }
    }
    policy = Object.freeze({ ...raw.policy });
  }
  return Object.freeze({
    id,
    ...(raw.primary === true ? { primary: true } : {}),
    taskSpec: typeof raw.taskSpec === 'string' && raw.taskSpec.trim() ? raw.taskSpec.trim() : id,
    ...(typeof raw.role === 'string' && raw.role.trim() ? { role: raw.role.trim() } : {}),
    ...(typeof raw.reason === 'string' && raw.reason.trim() ? { reason: raw.reason.trim() } : {}),
    ...(raw.dispatch ? { dispatch: raw.dispatch } : {}),
    ...(raw.skills ? { skills: Object.freeze(raw.skills.map((sk) => sk.trim())) } : {}),
    ...(policy ? { policy } : {}),
  });
}

/**
 * Validate a Workflow definition object.
 *
 * @param {unknown} raw Raw workflow object from YAML or parser
 * @returns {Readonly<object>} Frozen, normalized Workflow object
 */
export function validateWorkflow(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new WorkflowDefinitionError('Workflow definition must be a non-null object');
  }

  // Check top-level G2 violations
  for (const field of DISALLOWED_G2_FIELDS) {
    if (raw[field] !== undefined) {
      throw new WorkflowDefinitionError(
        `Workflow definition "${raw.id || 'unnamed'}" contains disallowed infrastructure field "${field}" (G2 constraint: Workflow is non-infrastructure).`,
      );
    }
  }

  if (typeof raw.id !== 'string' || !raw.id.trim()) {
    throw new WorkflowDefinitionError('Workflow definition requires a non-empty string "id"');
  }

  const id = raw.id.trim();
  const title = typeof raw.title === 'string' ? raw.title.trim() : id;
  const description = typeof raw.description === 'string' ? raw.description.trim() : '';

  if (!Array.isArray(raw.steps) || raw.steps.length === 0) {
    throw new WorkflowDefinitionError(`Workflow "${id}" must declare a non-empty "steps" array`);
  }

  const stepIds = new Set();
  const normalizedSteps = [];

  for (let i = 0; i < raw.steps.length; i++) {
    const s = raw.steps[i];
    const stepLabel = `Workflow "${id}" steps[${i}]`;

    if (!s || typeof s !== 'object' || Array.isArray(s)) {
      throw new WorkflowDefinitionError(`${stepLabel} must be a non-null object`);
    }

    // Check step G2 violations
    for (const field of DISALLOWED_G2_FIELDS) {
      if (s[field] !== undefined) {
        throw new WorkflowDefinitionError(
          `${stepLabel} (id: "${s.id || i}") contains disallowed infrastructure field "${field}" (G2 constraint).`,
        );
      }
    }

    if (typeof s.id !== 'string' || !s.id.trim()) {
      throw new WorkflowDefinitionError(`${stepLabel} requires a non-empty string "id"`);
    }

    const sId = s.id.trim();
    if (stepIds.has(sId)) {
      throw new WorkflowDefinitionError(`${stepLabel} has duplicate step id "${sId}"`);
    }
    stepIds.add(sId);

    const dependsOn = Array.isArray(s.dependsOn)
      ? s.dependsOn.map((d, dIdx) => {
          if (typeof d !== 'string' || !d.trim()) {
            throw new WorkflowDefinitionError(`${stepLabel}.dependsOn[${dIdx}] must be a non-empty string`);
          }
          return d.trim();
        })
      : [];

    const kind = typeof s.kind === 'string' && s.kind.trim() ? s.kind.trim() : 'standard';
    if (!VALID_STEP_KINDS.has(kind)) {
      throw new WorkflowDefinitionError(`${stepLabel} unknown kind "${kind}", must be one of [${[...VALID_STEP_KINDS].join(', ')}]`);
    }

    let gate = null;
    if (s.gate !== undefined && s.gate !== null) {
      if (typeof s.gate !== 'object' || Array.isArray(s.gate)) {
        throw new WorkflowDefinitionError(`${stepLabel}.gate must be an object`);
      }
      const gateKind = s.gate.kind || 'human';
      gate = {
        kind: gateKind,
        question: typeof s.gate.question === 'string' ? s.gate.question.trim() : undefined,
        header: typeof s.gate.header === 'string' ? s.gate.header.trim() : undefined,
      };
    }

    let phase;
    if (s.phase !== undefined) {
      if (!VALID_STEP_PHASES.has(s.phase)) {
        throw new WorkflowDefinitionError(`${stepLabel} unknown phase "${s.phase}", must be one of [${[...VALID_STEP_PHASES].join(', ')}]`);
      }
      phase = s.phase;
    }
    const skill = typeof s.skill === 'string' && s.skill.trim() ? s.skill.trim() : undefined;

    const operations = [];
    if (s.operations !== undefined) {
      if (!Array.isArray(s.operations)) {
        throw new WorkflowDefinitionError(`${stepLabel}.operations must be an array`);
      }
      const opIds = new Set();
      s.operations.forEach((rawOp, oIdx) => {
        const op = normalizeOperation(rawOp, `${stepLabel}.operations[${oIdx}]`);
        if (opIds.has(op.id)) {
          throw new WorkflowDefinitionError(`${stepLabel}.operations has duplicate operation id "${op.id}"`);
        }
        opIds.add(op.id);
        operations.push(op);
      });
    }

    const units = [];
    if (Array.isArray(s.units)) {
      for (let uIdx = 0; uIdx < s.units.length; uIdx++) {
        const u = s.units[uIdx];
        const unitLabel = `${stepLabel}.units[${uIdx}]`;

        if (!u || typeof u !== 'object' || Array.isArray(u)) {
          throw new WorkflowDefinitionError(`${unitLabel} must be a non-null object`);
        }

        // Check unit G2 violations
        for (const field of DISALLOWED_G2_FIELDS) {
          if (u[field] !== undefined) {
            throw new WorkflowDefinitionError(`${unitLabel} contains disallowed infrastructure field "${field}" (G2 constraint).`);
          }
        }

        const template = u.template && typeof u.template === 'object' ? u.template : u;
        for (const field of DISALLOWED_G2_FIELDS) {
          if (template[field] !== undefined) {
            throw new WorkflowDefinitionError(`${unitLabel}.template contains disallowed infrastructure field "${field}" (G2 constraint).`);
          }
        }

        const uId = typeof u.id === 'string' && u.id.trim() ? u.id.trim() : `${sId}-u${uIdx + 1}`;
        const capability = typeof template.capability === 'string' && template.capability.trim()
          ? template.capability.trim()
          : undefined;

        if (!capability) {
          throw new WorkflowDefinitionError(`${unitLabel} requires "capability" (e.g. domain:verb or verb)`);
        }

        const rigor = template.rigor ? String(template.rigor).trim() : undefined;
        if (rigor && !VALID_RIGORS.has(rigor)) {
          throw new WorkflowDefinitionError(`${unitLabel} invalid rigor "${rigor}", must be one of [${[...VALID_RIGORS].join(', ')}]`);
        }

        const writes = Array.isArray(template.writes)
          ? template.writes.map((w, wIdx) => {
              if (typeof w !== 'string' || !w.trim()) {
                throw new WorkflowDefinitionError(`${unitLabel}.writes[${wIdx}] must be a non-empty string`);
              }
              const clean = w.trim();
              if (path.isAbsolute(clean) || clean.startsWith('/') || clean.startsWith('\\')) {
                throw new WorkflowDefinitionError(`${unitLabel}.writes contains absolute path "${clean}". Must be repo-relative.`);
              }
              if (clean.includes('..')) {
                throw new WorkflowDefinitionError(`${unitLabel}.writes contains path escape ".." in "${clean}". Must be repo-relative.`);
              }
              return clean;
            })
          : [];

        const uDependsOn = Array.isArray(u.dependsOn)
          ? u.dependsOn.map((ud) => String(ud).trim()).filter(Boolean)
          : [];

        units.push(
          Object.freeze({
            id: uId,
            template: Object.freeze({
              capability,
              objective: typeof template.objective === 'string' ? template.objective.trim() : undefined,
              pattern: typeof template.pattern === 'string' ? template.pattern.trim() : undefined,
              rigor,
              writes,
              taskSpec: typeof template.taskSpec === 'string' ? template.taskSpec.trim() : undefined,
              persona: typeof template.persona === 'string' ? template.persona.trim() : undefined,
            }),
            dependsOn: uDependsOn,
          }),
        );
      }
    }

    normalizedSteps.push(
      Object.freeze({
        id: sId,
        title: typeof s.title === 'string' ? s.title.trim() : sId,
        dependsOn,
        kind,
        ...(phase ? { phase } : {}),
        ...(skill ? { skill } : {}),
        operations: Object.freeze(operations),
        gate: gate ? Object.freeze(gate) : null,
        units: Object.freeze(units),
      }),
    );
  }

  // Validate step dependsOn references
  for (const step of normalizedSteps) {
    for (const dep of step.dependsOn) {
      if (!stepIds.has(dep)) {
        throw new WorkflowDefinitionError(`Workflow "${id}" step "${step.id}" depends on undeclared step "${dep}"`);
      }
      if (dep === step.id) {
        throw new WorkflowDefinitionError(`Workflow "${id}" step "${step.id}" cannot depend on itself`);
      }
    }
  }

  const transitions = [];
  if (raw.transitions !== undefined) {
    if (!Array.isArray(raw.transitions)) {
      throw new WorkflowDefinitionError(`Workflow "${id}" transitions must be an array`);
    }
    raw.transitions.forEach((t, tIdx) => {
      if (!t || typeof t !== 'object' || !stepIds.has(t.from) || !stepIds.has(t.to)) {
        throw new WorkflowDefinitionError(`Workflow "${id}" transitions[${tIdx}] must name declared steps in "from" and "to"`);
      }
      transitions.push(Object.freeze({ from: t.from, to: t.to }));
    });
  }

  // Names an older record may carry for a step that now has a different id.
  const aliases = {};
  if (raw.aliases !== undefined) {
    if (!raw.aliases || typeof raw.aliases !== 'object' || Array.isArray(raw.aliases)) {
      throw new WorkflowDefinitionError(`Workflow "${id}" aliases must be an object of oldName -> stepId`);
    }
    for (const [oldName, target] of Object.entries(raw.aliases)) {
      if (!stepIds.has(target)) {
        throw new WorkflowDefinitionError(`Workflow "${id}" alias "${oldName}" points at undeclared step "${target}"`);
      }
      aliases[oldName] = target;
    }
  }

  // Skill/taskSpec a Work status (not a step) is handled by, e.g. retrospective.
  const statusSkills = {};
  if (raw.statusSkills !== undefined) {
    if (!raw.statusSkills || typeof raw.statusSkills !== 'object' || Array.isArray(raw.statusSkills)) {
      throw new WorkflowDefinitionError(`Workflow "${id}" statusSkills must be an object of status -> { skill, taskSpec }`);
    }
    for (const [status, entry] of Object.entries(raw.statusSkills)) {
      if (!entry || typeof entry.skill !== 'string' || !entry.skill.trim()) {
        throw new WorkflowDefinitionError(`Workflow "${id}" statusSkills.${status} requires a non-empty "skill"`);
      }
      statusSkills[status] = Object.freeze({
        skill: entry.skill.trim(),
        ...(typeof entry.taskSpec === 'string' && entry.taskSpec.trim() ? { taskSpec: entry.taskSpec.trim() } : {}),
      });
    }
  }

  return Object.freeze({
    id,
    title,
    description,
    steps: Object.freeze(normalizedSteps),
    transitions: Object.freeze(transitions),
    aliases: Object.freeze(aliases),
    statusSkills: Object.freeze(statusSkills),
  });
}
