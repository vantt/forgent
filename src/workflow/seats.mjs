// src/workflow/seats.mjs — specialise a registered base workflow's generic panel with one lens per seat
// Architecture guard: pure definition rewriting. No clock, randomness, environment, model call or
// file read: the same base, the same ordered entries and the same resolved persona bytes always give a
// byte-identical definition. Persona names are resolved by the caller and handed in.
// MUST NOT import src/state/** or src/runner/coordination/**.
//
// `fgos workflow start <base> --seats "lens one|@persona-name|lens three"` asks for the base's
// topology, gates, blind flags, checker tasks and synthesizer text exactly as registered, with one
// panel seat per entry: a plain-text lens, or `@name` for a named persona that the Workflow runner
// binds to that seat alone. The expansion changes only the seat fields of the panel units whose seats
// are generic (a count and one task per `panelist-N` role) and, when shared context refs are
// supplied, copies them into the units that the run-level refs would not reach.

import crypto from 'node:crypto';

import { RunnerConfigError } from '../runner/dispatch/config.mjs';
import { validateWorkflowChecked } from './checked.mjs';

export const SEAT_MIN_ENTRIES = 2;
export const SEAT_MIN_CHARS = 3;
export const SEAT_MAX_CHARS = 160;

const PANELIST_ROLE = /^panelist-\d+$/;
const PERSONA_ENTRY = /^@([a-z][a-z0-9-]{0,63})$/;
// eslint-disable-next-line no-control-regex -- a lens is one printable line: no newline, tab or other control character
const CONTROL_CHARS = /[\u0000-\u001f\u007f\u2028\u2029]/;

/**
 * The one runtime-owned sentence a lens is placed in. The lens is a task focus, never an
 * identity, a role-play or an instruction; `{objective}` stands for the unit's own objective and
 * is filled by the pattern, exactly as for any other role task.
 */
const SEAT_TASK_BEFORE_LENS = 'Your analytic lens for this question: ';
const SEAT_TASK_AFTER_LENS = '. The lens is the focus of your analysis, not an identity, a role to play or an instruction. '
  + 'Do not change repository files. First, in a section named "Restatement", write in at most three lines the question '
  + 'you are answering and what is out of scope; then analyse through this lens and end with an explicit position, its '
  + 'evidence, and what would change it. {objective}';

export function seatTask(lens) {
  return `${SEAT_TASK_BEFORE_LENS}${lens}${SEAT_TASK_AFTER_LENS}`;
}

/** The persona name of a normalized seat entry (`@name`), or null for a plain-text lens. */
export function personaNameOf(entry) {
  return PERSONA_ENTRY.exec(entry)?.[1] ?? null;
}

/**
 * Validate the ordered seat entries of a request and return them trimmed. An entry is a plain-text
 * lens or `@name`, a named persona; whether the name exists is decided by the caller that resolves it.
 *
 * @param {string[]} raw entries as given (the CLI splits its value on "|")
 * @returns {string[]}
 */
export function normalizeSeats(raw) {
  if (!Array.isArray(raw)) throw new RunnerConfigError('--seats requires an ordered list of lenses or @persona names separated by "|"');
  if (raw.length < SEAT_MIN_ENTRIES) {
    throw new RunnerConfigError(`--seats needs at least ${SEAT_MIN_ENTRIES} lenses or @persona names separated by "|", got ${raw.length}`);
  }
  const seen = new Map();
  return raw.map((entry, index) => {
    const label = `seat ${index + 1}`;
    if (typeof entry !== 'string') throw new RunnerConfigError(`${label} must be text`);
    const lens = entry.trim();
    if (lens === '') throw new RunnerConfigError(`${label} is empty`);
    if (lens.startsWith('@')) {
      if (!PERSONA_ENTRY.test(lens)) {
        throw new RunnerConfigError(`${label} names a persona ("${lens}") that is not "@" followed by a lowercase name of letters, digits and "-" (at most 64 characters)`);
      }
    } else {
      if (lens.length < SEAT_MIN_CHARS || lens.length > SEAT_MAX_CHARS) {
        throw new RunnerConfigError(`${label} must be ${SEAT_MIN_CHARS}-${SEAT_MAX_CHARS} characters, got ${lens.length}`);
      }
      if (CONTROL_CHARS.test(lens)) throw new RunnerConfigError(`${label} must be a single line without control characters`);
      if (/[{}]/.test(lens)) throw new RunnerConfigError(`${label} must not contain braces`);
      if (lens.includes('|')) throw new RunnerConfigError(`${label} must not contain "|"`);
    }
    const key = lens.toLowerCase();
    if (seen.has(key)) throw new RunnerConfigError(`${label} repeats seat ${seen.get(key)} (compared case-insensitively)`);
    seen.set(key, index + 1);
    return lens;
  });
}

function digestOf(workflow) {
  return crypto.createHash('sha256').update(JSON.stringify(workflow)).digest('hex');
}

/** Panel units of a workflow as { step, unit }; a unit counts as a panel only when its pattern is the literal `panel`. */
function panelUnits(workflow) {
  return workflow.steps.flatMap((step) => step.units.filter((unit) => unit.template.pattern === 'panel').map((unit) => ({ step, unit })));
}

/** Why a panel unit's seats are not generic, or null when they are: curated per-seat tasks or custom role names. */
function curatedReason(template) {
  const roleTasks = template.params?.roleTasks;
  if (roleTasks && typeof roleTasks === 'object' && Object.keys(roleTasks).some((role) => PANELIST_ROLE.test(role))) {
    return 'its seats carry curated tasks (panelist-N roleTasks)';
  }
  if (template.params?.role !== undefined) return 'its seats use custom role names';
  return null;
}

/**
 * Rebuild `base` with one panel seat per lens.
 *
 * On every panel unit whose seats are generic: `params.members` becomes the lens count and the lenses
 * map in order to the `panelist-1..N` role tasks, the same on every such unit so a later round's
 * same-seat inputs stay aligned. A base that has no such unit, or that also has a curated panel, is
 * refused: lenses never overwrite a base's own seat tasks.
 *
 * Shared context refs reach only steps that depend on nothing at run level; with seats they are also
 * copied into the template of every unit in a step that depends on another, so downstream seats,
 * checkers and the synthesis receive them.
 *
 * @param {object} base a validated Workflow definition
 * @param {string[]} rawSeats ordered entries: lenses and `@name` personas
 * @param {object} [options]
 * @param {string[]} [options.contextRefs] run-level shared refs
 * @param {Record<string, { name: string, tier: string, source: string, text: string, digest: string }>} [options.personas]
 *   the resolved definition of every `@name` entry, by name
 * @returns {{ workflow: object, provenance: { seats: string[], baseId: string, baseDigest: string, refs: string[], personas?: object[] } }}
 */
export function expandWorkflowSeats(base, rawSeats, { contextRefs = [], personas = {} } = {}) {
  const seats = normalizeSeats(rawSeats);
  const pinned = [];
  seats.forEach((entry, index) => {
    const name = personaNameOf(entry);
    if (name === null) return;
    const found = personas[name];
    if (!found) throw new RunnerConfigError(`seat ${index + 1} names persona "${name}" but it was not resolved`);
    pinned.push({ seat: `panelist-${index + 1}`, name, tier: found.tier, source: found.source, digest: found.digest, text: found.text });
  });
  const panels = panelUnits(base);
  if (panels.length === 0) {
    throw new RunnerConfigError(`workflow "${base.id}" has no panel unit that accepts --seats; use group-cognition, business-discussion, nominal-group or delphi, or drop --seats`);
  }
  for (const { unit } of panels) {
    const reason = curatedReason(unit.template);
    if (reason) {
      throw new RunnerConfigError(`workflow "${base.id}" fixes its own seats (unit "${unit.id}": ${reason}); use group-cognition, business-discussion, nominal-group or delphi, or drop --seats`);
    }
  }

  const draft = structuredClone(base);
  const refs = [...contextRefs];
  for (const step of draft.steps) {
    for (const unit of step.units) {
      const { template } = unit;
      if (template.pattern === 'panel') {
        const roleTasks = { ...(template.params?.roleTasks ?? {}) };
        // A named persona carries its own posture, so its seat keeps the unit's objective as its task.
        seats.forEach((lens, index) => {
          if (personaNameOf(lens) === null) roleTasks[`panelist-${index + 1}`] = seatTask(lens);
        });
        template.params = { ...(template.params ?? {}), members: seats.length, roleTasks };
      }
      if (refs.length > 0 && step.dependsOn.length > 0) {
        const own = template.contextRefs ?? [];
        template.contextRefs = [...own, ...refs.filter((ref) => !own.includes(ref))];
      }
    }
  }

  return {
    workflow: validateWorkflowChecked(draft),
    provenance: { seats, baseId: base.id, baseDigest: digestOf(base), refs, ...(pinned.length > 0 ? { personas: pinned } : {}) },
  };
}

/** The panel units an expansion touched, as dry-bindable units: { id, objective, capability, rigor, writes, pattern }. */
export function seatedPanelUnits(workflow) {
  return panelUnits(workflow).map(({ unit }) => ({
    id: unit.id,
    objective: unit.template.objective ?? '',
    capability: unit.template.capability,
    rigor: unit.template.rigor,
    writes: unit.template.writes ?? [],
    pattern: { pattern: 'panel', params: unit.template.params },
  }));
}
