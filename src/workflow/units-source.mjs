// src/workflow/units-source.mjs — Turns a units file into a one-off Workflow definition
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)

import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

import { validateWorkflowChecked as validateWorkflow } from './checked.mjs';
import { validateUnit } from '../runner/execution/unit.mjs';
import { RunnerConfigError } from '../runner/dispatch/config.mjs';

const BRANCH_SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

/**
 * Read a units file (`fgos workflow start --units <file>`) and build the Workflow it stands for:
 * one step per Unit, the Unit's `dependsOn` as the step's, so units run in dependency order and
 * each later unit is handed the reports of the ones it builds on.
 *
 * The file is YAML or JSON: `{ id?, title?, units: [Unit, ...] }` or a bare array of Units. Every
 * Unit passes the Unit contract (validateUnit) first. Only the Unit fields a workflow unit carries
 * are copied, so a field the data says about itself (a `source`, an `origin`) has no effect; the
 * source that lets a template keep `prefer` is given by this loader, never read from the file.
 *
 * @param {string} unitsPath
 * @returns {Readonly<object>} Validated Workflow definition, id `units/<id or file basename>`
 */
export function translateUnitsToWorkflow(unitsPath) {
  const resolved = path.resolve(unitsPath);
  let text;
  try {
    text = fs.readFileSync(resolved, 'utf8');
  } catch (err) {
    throw new RunnerConfigError(`units file not readable at "${resolved}": ${err.message}`);
  }
  let doc;
  try {
    doc = YAML.parse(text);
  } catch (err) {
    throw new RunnerConfigError(`units file "${resolved}" is neither YAML nor JSON: ${err.message}`);
  }
  const rawUnits = Array.isArray(doc) ? doc : doc?.units;
  if (!Array.isArray(rawUnits) || rawUnits.length === 0) {
    throw new RunnerConfigError(`units file "${resolved}" must hold at least one unit: { units: [...] } or a list of units`);
  }

  const seen = new Set();
  const steps = rawUnits.map((raw, i) => {
    let unit;
    try {
      unit = validateUnit(raw);
    } catch (err) {
      throw new RunnerConfigError(`units[${i}]: ${err.message}`);
    }
    if (seen.has(unit.id)) throw new RunnerConfigError(`units[${i}] has duplicate unit id "${unit.id}"`);
    // The id names the unit's step and its branch (wf/<run>/<id>), so it must be a safe branch segment.
    if (!BRANCH_SAFE_ID.test(unit.id) || unit.id.includes('..') || unit.id.endsWith('.lock')) {
      throw new RunnerConfigError(`units[${i}] unit id "${unit.id}" must be letters, digits, ".", "_" or "-", starting with a letter or digit (it names the unit's branch)`);
    }
    seen.add(unit.id);
    if (unit.expectedOutputs.length > 0) {
      throw new RunnerConfigError(`units[${i}] "${unit.id}": expectedOutputs is not carried by a workflow unit; state it in the objective`);
    }
    return {
      id: unit.id,
      title: unit.id,
      dependsOn: [...unit.dependsOn],
      units: [{
        id: unit.id,
        template: {
          capability: unit.capability,
          objective: unit.objective,
          ...(unit.pattern !== undefined ? { pattern: unit.pattern } : {}),
          ...(unit.rigor !== undefined ? { rigor: unit.rigor } : {}),
          writes: [...unit.writes],
          ...(unit.persona !== undefined ? { persona: unit.persona } : {}),
          ...(unit.prefer !== undefined ? { prefer: structuredClone(unit.prefer) } : {}),
          contextRefs: [...unit.inputs],
          ...(unit.stanceOptions !== undefined ? { stanceOptions: [...unit.stanceOptions] } : {}),
          ...(unit.anonymizeInputs ? { anonymizeInputs: true } : {}),
          ...(unit.blind ? { blind: true } : {}),
        },
      }],
    };
  });

  const name = typeof doc?.id === 'string' && doc.id.trim() ? doc.id.trim() : path.basename(resolved, path.extname(resolved));
  return validateWorkflow({
    id: `units/${name}`,
    title: typeof doc?.title === 'string' && doc.title.trim() ? doc.title.trim() : `units/${name}`,
    description: `Workflow built from units file ${path.basename(resolved)}`,
    steps,
  }, { source: 'units-file' });
}
