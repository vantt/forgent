// src/runner/execution/unit.mjs — Unit data contract and validator (Wave B / Phase 2)
// Architecture guard: MUST NOT import src/state/**, src/runner/coordination/**, src/runner/worktree.mjs, or src/runner/merge.mjs

import { RunnerConfigError } from '../dispatch/config.mjs';
import { RIGOR_VALUES } from '../rigor.mjs';
import { canonicalizeWriteEntry } from '../dispatch/write-scope.mjs';

const DISALLOWED_UNIT_FIELDS = Object.freeze([
  'executor',
  'provider',
  'model',
  'tier',
  'invocation',
  'actors',
  'overrides',
]);

const PREFER_ENTRY_KEYS = new Set(['executor', 'invocation']);

/**
 * A unit's soft executor preference, in the shape bind() reads a capability's prefer pool:
 * an array of "<executorId>" or {executor, invocation?}. Shape only; ids are not looked up here.
 */
function normalizePrefer(value) {
  if (!Array.isArray(value)) {
    throw new RunnerConfigError('unit.prefer must be an array of executor ids or {executor, invocation?} entries.');
  }
  return Object.freeze(value.map((entry, i) => {
    if (typeof entry === 'string' && entry.trim()) return entry.trim();
    const isEntryObject = entry && typeof entry === 'object' && !Array.isArray(entry);
    if (!isEntryObject || typeof entry.executor !== 'string' || !entry.executor.trim()
      || Object.keys(entry).some((key) => !PREFER_ENTRY_KEYS.has(key))
      || (entry.invocation !== undefined && (typeof entry.invocation !== 'string' || !entry.invocation.trim()))) {
      throw new RunnerConfigError(
        `unit.prefer[${i}] must be a non-empty executor id or {executor, invocation?} with non-empty strings, got: ${JSON.stringify(entry)}.`,
      );
    }
    return Object.freeze({
      executor: entry.executor.trim(),
      ...(entry.invocation !== undefined ? { invocation: entry.invocation.trim() } : {}),
    });
  }));
}

const UNIT_RUN_INPUT_PATTERN = /^unit-run:[^/\s]+\/[^/\s]+$/;
const GATE_ANSWER_INPUT_PATTERN = /^gate-answer:[^/\s]+\/[^/\s]+$/;

/** Question-local labels; never infer options from free text or a model's response. */
export function normalizeStanceOptions(value = []) {
  if (!Array.isArray(value) || value.some((option) => typeof option !== 'string' || !option.trim())) {
    throw new RunnerConfigError('stanceOptions must be an array of non-empty strings.');
  }
  const options = value.map((option) => option.trim());
  if (new Set(options).size !== options.length || options.includes('other')) {
    throw new RunnerConfigError('stanceOptions must be unique; "other" is reserved.');
  }
  return Object.freeze(options);
}

export function normalizeWorkflowLink(value) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'object' || Array.isArray(value)
    || ['runId', 'stepId', 'unitId'].some((key) => typeof value[key] !== 'string' || !value[key].trim())) {
    throw new RunnerConfigError('workflow link requires non-empty runId, stepId, and unitId.');
  }
  return Object.freeze(Object.fromEntries(['runId', 'stepId', 'unitId'].map((key) => [key, value[key].trim()])));
}

/**
 * Validates whether a path is a safe repo-relative path.
 * - must be string
 * - not empty
 * - cannot start with '/'
 * - cannot contain '..' segments
 * - cannot contain backslashes or null bytes
 */
function isValidRepoRelativePath(p) {
  if (typeof p !== 'string' || !p.trim()) return false;
  if (p.startsWith('/')) return false;
  if (p.includes('\\') || p.includes('\0')) return false;
  const segments = p.split('/');
  for (const seg of segments) {
    if (seg === '..') return false;
  }
  return true;
}

/**
 * Validates whether an input is a safe repo-relative path, a 'unit-run:<id>/<role>' reference, or a
 * 'gate-answer:<workflowRunId>/<stepId>' reference.
 */
function isValidInput(inp) {
  if (typeof inp !== 'string' || !inp.trim()) return false;
  if (inp.startsWith('unit-run:')) {
    return UNIT_RUN_INPUT_PATTERN.test(inp);
  }
  if (inp.startsWith('gate-answer:')) {
    return GATE_ANSWER_INPUT_PATTERN.test(inp);
  }
  return isValidRepoRelativePath(inp);
}

/**
 * Validates raw input against the Unit contract and returns a frozen normalized Unit object.
 *
 * Unit contract:
 * - id: non-empty string
 * - objective: non-empty string
 * - capability: non-empty string ('domain:verb' or 'verb')
 * - rigor?: optional ('low'|'standard'|'high'|'critical')
 * - writes: array of repo-relative paths in worktree (empty = read-only; no absolute, no '..')
 * - dependsOn: array of unit ids
 * - pattern?: optional string (e.g. 'solo', 'reviewed', 'panel', or preset name)
 * - inputs: array of repo-relative paths or 'unit-run:<id>/<role>' refs
 * - anonymizeInputs?: optional boolean; copy the 'unit-run:' reports under neutral names (seat-A, ...)
 * - blind?: optional boolean; every role of the unit runs with hostRead: blind (no peer run state
 *   is readable) or is refused, never run unblind
 * - expectedOutputs: array of strings
 * - stanceOptions?: question-local option labels; "other" is reserved; omitted means unmeasured
 * - prefer?: soft executor preference, array of "<executorId>" or {executor, invocation?}
 * - persona?: non-empty string
 * - MUST NOT contain: executor, provider, model, tier, invocation, actors, overrides (G2)
 *
 * @param {unknown} raw
 * @returns {Readonly<{
 *   id: string,
 *   objective: string,
 *   capability: string,
 *   rigor?: string,
 *   writes: readonly string[],
 *   dependsOn: readonly string[],
 *   pattern?: string,
 *   prefer?: readonly (string|{executor: string, invocation?: string})[],
 *   persona?: string,
 *   inputs: readonly string[],
 *   expectedOutputs: readonly string[]
 * }>}
 */
export function validateUnit(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new RunnerConfigError('unit must be a non-null plain object.');
  }

  // G2 constraint check
  for (const field of DISALLOWED_UNIT_FIELDS) {
    if (field in raw && raw[field] !== undefined) {
      throw new RunnerConfigError(
        `unit violates G2 constraint: contains disallowed field "${field}". Unit contract must not specify execution mechanics (${DISALLOWED_UNIT_FIELDS.join(', ')}).`,
      );
    }
  }

  // id
  if (typeof raw.id !== 'string' || !raw.id.trim()) {
    throw new RunnerConfigError('unit.id must be a non-empty string.');
  }
  const id = raw.id.trim();

  // objective
  if (typeof raw.objective !== 'string' || !raw.objective.trim()) {
    throw new RunnerConfigError('unit.objective must be a non-empty string.');
  }
  const objective = raw.objective.trim();

  // capability
  if (typeof raw.capability !== 'string' || !raw.capability.trim()) {
    throw new RunnerConfigError('unit.capability must be a non-empty string ("domain:verb" or "verb").');
  }
  const capability = raw.capability.trim();

  // rigor
  let rigor;
  if (raw.rigor !== undefined && raw.rigor !== null) {
    if (typeof raw.rigor !== 'string' || !RIGOR_VALUES.includes(raw.rigor)) {
      throw new RunnerConfigError(
        `unit.rigor must be one of ${RIGOR_VALUES.join('/')}, got: ${JSON.stringify(raw.rigor)}.`,
      );
    }
    rigor = raw.rigor;
  }

  // writes: canonical spelling, so every consumer reads one entry one way
  if (raw.writes !== undefined && !Array.isArray(raw.writes)) {
    throw new RunnerConfigError('unit.writes must be an array of repo-relative paths.');
  }
  const writes = [];
  (raw.writes ?? []).forEach((w, i) => {
    let entry;
    try {
      entry = canonicalizeWriteEntry(w);
    } catch (err) {
      throw new RunnerConfigError(`unit.writes[${i}] must be a non-empty repo-relative path: ${err.message}`);
    }
    if (!writes.includes(entry)) writes.push(entry);
  });

  // dependsOn
  if (raw.dependsOn !== undefined && !Array.isArray(raw.dependsOn)) {
    throw new RunnerConfigError('unit.dependsOn must be an array of unit ids.');
  }
  const rawDependsOn = raw.dependsOn ?? [];
  const dependsOn = [];
  for (let i = 0; i < rawDependsOn.length; i += 1) {
    const dep = rawDependsOn[i];
    if (typeof dep !== 'string' || !dep.trim()) {
      throw new RunnerConfigError(
        `unit.dependsOn[${i}] must be a non-empty string unit id, got: ${JSON.stringify(dep)}.`,
      );
    }
    dependsOn.push(dep.trim());
  }

  // pattern
  let pattern;
  if (raw.pattern !== undefined && raw.pattern !== null) {
    if (typeof raw.pattern !== 'string' || !raw.pattern.trim()) {
      throw new RunnerConfigError('unit.pattern must be a non-empty string when present.');
    }
    pattern = raw.pattern.trim();
  }

  // inputs
  if (raw.inputs !== undefined && !Array.isArray(raw.inputs)) {
    throw new RunnerConfigError('unit.inputs must be an array of repo-relative paths or unit-run references.');
  }
  const rawInputs = raw.inputs ?? [];
  const inputs = [];
  for (let i = 0; i < rawInputs.length; i += 1) {
    const inp = rawInputs[i];
    if (!isValidInput(inp)) {
      throw new RunnerConfigError(
        `unit.inputs[${i}] must be a repo-relative path or "unit-run:<id>/<role>" ref (or "gate-answer:<workflowRunId>/<stepId>"), got: ${JSON.stringify(inp)}.`,
      );
    }
    inputs.push(inp);
  }

  if (raw.anonymizeInputs !== undefined && typeof raw.anonymizeInputs !== 'boolean') {
    throw new RunnerConfigError('unit.anonymizeInputs must be a boolean when present.');
  }

  if (raw.blind !== undefined && typeof raw.blind !== 'boolean') {
    throw new RunnerConfigError('unit.blind must be a boolean when present.');
  }

  const prefer = raw.prefer !== undefined ? normalizePrefer(raw.prefer) : undefined;

  if (raw.persona !== undefined && (typeof raw.persona !== 'string' || !raw.persona.trim())) {
    throw new RunnerConfigError('unit.persona must be a non-empty string when present.');
  }

  // expectedOutputs
  if (raw.expectedOutputs !== undefined && !Array.isArray(raw.expectedOutputs)) {
    throw new RunnerConfigError('unit.expectedOutputs must be an array of strings.');
  }
  const rawExpectedOutputs = raw.expectedOutputs ?? [];
  const expectedOutputs = [];
  for (let i = 0; i < rawExpectedOutputs.length; i += 1) {
    const out = rawExpectedOutputs[i];
    if (typeof out !== 'string' || !out.trim()) {
      throw new RunnerConfigError(
        `unit.expectedOutputs[${i}] must be a non-empty string, got: ${JSON.stringify(out)}.`,
      );
    }
    expectedOutputs.push(out.trim());
  }

  const normalized = {
    id,
    objective,
    capability,
    ...(rigor !== undefined ? { rigor } : {}),
    writes: Object.freeze(writes),
    dependsOn: Object.freeze(dependsOn),
    ...(pattern !== undefined ? { pattern } : {}),
    ...(prefer !== undefined ? { prefer } : {}),
    ...(raw.persona !== undefined ? { persona: raw.persona.trim() } : {}),
    inputs: Object.freeze(inputs),
    ...(raw.anonymizeInputs === true ? { anonymizeInputs: true } : {}),
    ...(raw.blind === true ? { blind: true } : {}),
    ...(raw.stanceOptions !== undefined ? { stanceOptions: normalizeStanceOptions(raw.stanceOptions) } : {}),
    expectedOutputs: Object.freeze(expectedOutputs),
  };

  return Object.freeze(normalized);
}
