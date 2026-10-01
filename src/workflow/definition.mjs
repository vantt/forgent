// src/workflow/definition.mjs — Workflow definition contract and schema validator
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)

import { RunnerConfigError } from '../runner/dispatch/config.mjs';

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

/**
 * Validate a Workflow definition object.
 *
 * @param {unknown} raw Raw workflow object from YAML or parser
 * @returns {Readonly<object>} Frozen, normalized Workflow object
 */
export function validateWorkflow(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new RunnerConfigError('Workflow definition must be a non-null object');
  }

  // Check top-level G2 violations
  for (const field of DISALLOWED_G2_FIELDS) {
    if (raw[field] !== undefined) {
      throw new RunnerConfigError(
        `Workflow definition "${raw.id || 'unnamed'}" contains disallowed infrastructure field "${field}" (G2 constraint: Workflow is non-infrastructure).`,
      );
    }
  }

  if (typeof raw.id !== 'string' || !raw.id.trim()) {
    throw new RunnerConfigError('Workflow definition requires a non-empty string "id"');
  }

  const id = raw.id.trim();
  const title = typeof raw.title === 'string' ? raw.title.trim() : id;
  const description = typeof raw.description === 'string' ? raw.description.trim() : '';

  if (!Array.isArray(raw.steps) || raw.steps.length === 0) {
    throw new RunnerConfigError(`Workflow "${id}" must declare a non-empty "steps" array`);
  }

  const stepIds = new Set();
  const normalizedSteps = [];

  for (let i = 0; i < raw.steps.length; i++) {
    const s = raw.steps[i];
    const stepLabel = `Workflow "${id}" steps[${i}]`;

    if (!s || typeof s !== 'object' || Array.isArray(s)) {
      throw new RunnerConfigError(`${stepLabel} must be a non-null object`);
    }

    // Check step G2 violations
    for (const field of DISALLOWED_G2_FIELDS) {
      if (s[field] !== undefined) {
        throw new RunnerConfigError(
          `${stepLabel} (id: "${s.id || i}") contains disallowed infrastructure field "${field}" (G2 constraint).`,
        );
      }
    }

    if (typeof s.id !== 'string' || !s.id.trim()) {
      throw new RunnerConfigError(`${stepLabel} requires a non-empty string "id"`);
    }

    const sId = s.id.trim();
    if (stepIds.has(sId)) {
      throw new RunnerConfigError(`${stepLabel} has duplicate step id "${sId}"`);
    }
    stepIds.add(sId);

    const dependsOn = Array.isArray(s.dependsOn)
      ? s.dependsOn.map((d, dIdx) => {
          if (typeof d !== 'string' || !d.trim()) {
            throw new RunnerConfigError(`${stepLabel}.dependsOn[${dIdx}] must be a non-empty string`);
          }
          return d.trim();
        })
      : [];

    const kind = typeof s.kind === 'string' && s.kind.trim() ? s.kind.trim() : 'standard';
    if (!VALID_STEP_KINDS.has(kind)) {
      throw new RunnerConfigError(`${stepLabel} unknown kind "${kind}", must be one of [${[...VALID_STEP_KINDS].join(', ')}]`);
    }

    let gate = null;
    if (s.gate !== undefined && s.gate !== null) {
      if (typeof s.gate !== 'object' || Array.isArray(s.gate)) {
        throw new RunnerConfigError(`${stepLabel}.gate must be an object`);
      }
      const gateKind = s.gate.kind || 'human';
      gate = {
        kind: gateKind,
        question: typeof s.gate.question === 'string' ? s.gate.question.trim() : undefined,
        header: typeof s.gate.header === 'string' ? s.gate.header.trim() : undefined,
      };
    }

    const units = [];
    if (Array.isArray(s.units)) {
      for (let uIdx = 0; uIdx < s.units.length; uIdx++) {
        const u = s.units[uIdx];
        const unitLabel = `${stepLabel}.units[${uIdx}]`;

        if (!u || typeof u !== 'object' || Array.isArray(u)) {
          throw new RunnerConfigError(`${unitLabel} must be a non-null object`);
        }

        // Check unit G2 violations
        for (const field of DISALLOWED_G2_FIELDS) {
          if (u[field] !== undefined) {
            throw new RunnerConfigError(`${unitLabel} contains disallowed infrastructure field "${field}" (G2 constraint).`);
          }
        }

        const template = u.template && typeof u.template === 'object' ? u.template : u;
        for (const field of DISALLOWED_G2_FIELDS) {
          if (template[field] !== undefined) {
            throw new RunnerConfigError(`${unitLabel}.template contains disallowed infrastructure field "${field}" (G2 constraint).`);
          }
        }

        const uId = typeof u.id === 'string' && u.id.trim() ? u.id.trim() : `${sId}-u${uIdx + 1}`;
        const capability = typeof template.capability === 'string' && template.capability.trim()
          ? template.capability.trim()
          : undefined;

        if (!capability) {
          throw new RunnerConfigError(`${unitLabel} requires "capability" (e.g. domain:verb or verb)`);
        }

        const rigor = template.rigor ? String(template.rigor).trim() : undefined;
        if (rigor && !VALID_RIGORS.has(rigor)) {
          throw new RunnerConfigError(`${unitLabel} invalid rigor "${rigor}", must be one of [${[...VALID_RIGORS].join(', ')}]`);
        }

        const writes = Array.isArray(template.writes)
          ? template.writes.map((w, wIdx) => {
              if (typeof w !== 'string' || !w.trim()) {
                throw new RunnerConfigError(`${unitLabel}.writes[${wIdx}] must be a non-empty string`);
              }
              const clean = w.trim();
              if (path.isAbsolute(clean) || clean.startsWith('/') || clean.startsWith('\\')) {
                throw new RunnerConfigError(`${unitLabel}.writes contains absolute path "${clean}". Must be repo-relative.`);
              }
              if (clean.includes('..')) {
                throw new RunnerConfigError(`${unitLabel}.writes contains path escape ".." in "${clean}". Must be repo-relative.`);
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
        gate: gate ? Object.freeze(gate) : null,
        units: Object.freeze(units),
      }),
    );
  }

  // Validate step dependsOn references
  for (const step of normalizedSteps) {
    for (const dep of step.dependsOn) {
      if (!stepIds.has(dep)) {
        throw new RunnerConfigError(`Workflow "${id}" step "${step.id}" depends on undeclared step "${dep}"`);
      }
      if (dep === step.id) {
        throw new RunnerConfigError(`Workflow "${id}" step "${step.id}" cannot depend on itself`);
      }
    }
  }

  return Object.freeze({
    id,
    title,
    description,
    steps: Object.freeze(normalizedSteps),
  });
}
