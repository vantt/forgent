// What a unit run is doing when nobody may be driving it: derived from files and the adopt probe, never stored.
// The names and rules are packages/run-supervisor/contracts/unit-state.v1.json. Read-only: nothing here starts,
// adopts or settles an attempt; the adopt probe is passed in by the caller.

import fs from 'node:fs';
import path from 'node:path';
import { listGenerations } from '../dispatch/run-lock.mjs';
import { unitControllerHeld } from './unit-control.mjs';

const readJson = (file) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } };

/**
 * The newest attempt directory the admission ledger committed for `assignmentId`, with its run id; null
 * while nothing was admitted or the directory was never materialized.
 */
export function currentAttemptOf(assignmentsDir, assignmentId) {
  const generationsDir = path.join(assignmentsDir, assignmentId, 'admission', 'generations');
  const current = listGenerations(generationsDir).at(-1)?.record;
  if (!current) return null;
  const dir = path.join(assignmentsDir, assignmentId, 'runs', current.attemptStr ?? String(current.attempt).padStart(2, '0'));
  return fs.existsSync(dir) ? { dir, runId: current.runId } : null;
}

/** The last attempt recorded for each role/round of a unit record. */
export function lastAttempts(unitRecord) {
  return Object.values(unitRecord.bindings ?? {}).map((attempts) => attempts[attempts.length - 1]).filter(Boolean);
}

/** Unit run directories under `assignmentsDir` that recorded an attempt of `assignmentId`. */
export function unitDirsOfAssignment(assignmentsDir, assignmentId) {
  let names;
  try { names = fs.readdirSync(assignmentsDir, { withFileTypes: true }); } catch { return []; }
  const found = [];
  for (const entry of names) {
    if (!entry.isDirectory()) continue;
    const unitDir = path.join(assignmentsDir, entry.name);
    const record = readJson(path.join(unitDir, 'unit.json'));
    if (record && lastAttempts(record).some((attempt) => attempt.assignmentId === assignmentId)) found.push(unitDir);
  }
  return found;
}

// A stored summary whose outcome is not yet known (a run still in flight) is not a verdict.
const UNSETTLED_SUMMARY_OUTCOMES = new Set(['unknown', 'undetermined']);

/**
 * @param {string} unitDir
 * @param {{probe: (attemptDir: string) => {state: string}}} options probe: read-only adopt judgement of one attempt directory
 * @returns {{unitState: 'running'|'awaiting-resume'|'completed'|'failed', unitRunId: string, resumeCommand?: string}}
 */
export function deriveUnitState(unitDir, { probe }) {
  const unitRunId = path.basename(unitDir);
  const summary = readJson(path.join(unitDir, 'unit-summary.json'));
  if (summary && !UNSETTLED_SUMMARY_OUTCOMES.has(summary.outcome)) {
    return { unitRunId, unitState: summary.outcome === 'pass' ? 'completed' : 'failed' };
  }
  // Held, or not provably dead, counts as a live controller: the unit keeps `running`.
  if (unitControllerHeld(unitDir)) return { unitRunId, unitState: 'running' };
  const record = readJson(path.join(unitDir, 'unit.json'));
  const assignmentsDir = path.dirname(unitDir);
  for (const attempt of record ? lastAttempts(record) : []) {
    if (typeof attempt.assignmentId !== 'string') continue;
    const current = currentAttemptOf(assignmentsDir, attempt.assignmentId);
    if (current !== null && probe(current.dir).state !== 'closed') return { unitRunId, unitState: 'running' };
  }
  return { unitRunId, unitState: 'awaiting-resume', resumeCommand: `fgos run --resume ${unitRunId}` };
}
