// src/runner/execution/unit-run-record.mjs — the Unit-run record port: what a Unit run's directory says, and when it may go
// Architecture guard: MUST NOT import src/state/**, src/workflow/** or src/runner/coordination/** (A4 boundary)
//
// A Unit run's lifecycle and record (exists, settled, controller held, worktree, write scope, resumable,
// removable) are Execution's. The Workflow asks here and never opens `.fgos/assignments/<unitRunId>` itself; it
// keeps only "a case still names this run" and passes what other cases name as `unless`.
// Read-only except `removeUnitRun`, the one place a Unit run directory is deleted.

import fs from 'node:fs';
import path from 'node:path';
import { assignmentDir } from '../dispatch/assignment-layout.mjs';
import { realpathOrNull } from '../../run-supervisor/payload-root.mjs';
import { custodyHeld } from './custody-door.mjs';
import { unitControllerHeld } from './unit-control.mjs';
import { deriveUnitState } from './unit-state.mjs';

export const UNIT_RUN_RECORD_CONTRACT = Object.freeze({ id: 'unit-run-record', version: 1 });

const readJson = (file) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } };
const lstatOrNull = (p) => { try { return fs.lstatSync(p); } catch { return null; } };

/**
 * What a Unit run's directory says. A run id that names no directory, or that is not a plain id, reads as
 * `exists: false`; an unreadable record reads as not settled and not resumable (only positive evidence counts).
 *
 * @param {string} fgosDir
 * @param {string} unitRunId
 * @returns {{ contract: {id: string, version: number}, exists: boolean, settled: boolean, controllerHeld: boolean,
 *   worktree: string|null, writeScope: string[]|null, resumable: boolean, caseId: string|null }}
 */
export function unitRunFacts(fgosDir, unitRunId) {
  const dir = typeof unitRunId === 'string' ? assignmentDir(fgosDir, unitRunId) : null;
  const exists = dir !== null && fs.existsSync(path.join(dir, 'unit.json'));
  const record = exists ? readJson(path.join(dir, 'unit.json')) : null;
  const worktree = typeof record?.worktree === 'string' ? record.worktree : null;
  return {
    contract: UNIT_RUN_RECORD_CONTRACT,
    exists,
    settled: record?.execution?.status === 'settled',
    controllerHeld: exists && unitControllerHeld(dir),
    worktree,
    writeScope: record ? (record.writeScope ?? record.unit?.writes ?? null) : null,
    resumable: worktree !== null && fs.existsSync(worktree),
    caseId: record?.workflow?.caseId ?? null,
  };
}

// A summary-less run has no verdict; the probe is never asked to judge a live attempt, so such a run stays unsettled.
const NO_PROBE = () => ({ state: 'unprobed' });

// The reasons a Unit run stays, in the order they are asked (the first that fires wins). `blocks`: whoever removes
// several runs together keeps them all, so a kept ledger never names a removed run. A run that another case owns or
// names stays alone: nothing kept then names it from the case asking.
const KEEP_REASONS = [
  { reason: 'unit-record-missing', blocks: true, fires: ({ expected }) => !lstatOrNull(path.join(expected, 'unit.json'))?.isFile() },
  { reason: 'names-other-case', blocks: false, fires: ({ record, caseId }) => record?.workflow?.caseId !== caseId },
  { reason: 'named-by-other-case', blocks: false, fires: ({ unitRunId, unless }) => unless.has(unitRunId) },
  { reason: 'controller-held', blocks: true, fires: ({ expected }) => unitControllerHeld(expected) },
  { reason: 'custody-held', blocks: true, fires: ({ record, fgosDir }) => typeof record.worktree === 'string' && custodyHeld(fgosDir, record.worktree) },
  { reason: 'unsettled', blocks: true, fires: ({ expected }) => { const { unitState } = deriveUnitState(expected, { probe: NO_PROBE }); return unitState !== 'completed' && unitState !== 'failed'; } },
];

/**
 * Where one Unit run of `caseId` stands: `{ dir }` when it may go, `{ gone: true }` when there is nothing to
 * remove, `{ keep, blocks }` otherwise. The path is checked first: it decides whether the directory may be read at all.
 *
 * @param {string} fgosDir
 * @param {string} unitRunId
 * @param {{ caseId: string, unless?: Set<string> }} owner `unless`: the Unit runs another case names, which stay
 */
export function judgeUnitRun(fgosDir, unitRunId, { caseId, unless = new Set() }) {
  const dir = typeof unitRunId === 'string' ? assignmentDir(fgosDir, unitRunId) : null;
  if (dir === null) {
    const plain = typeof unitRunId === 'string' && unitRunId !== '' && unitRunId !== '.' && unitRunId !== '..' && !/[/\\]/.test(unitRunId);
    return { keep: plain && lstatOrNull(path.join(fgosDir, 'assignments', unitRunId))?.isSymbolicLink() ? 'link' : 'unsafe-path', blocks: true };
  }
  const base = realpathOrNull(path.join(fgosDir, 'assignments')) ?? path.join(fgosDir, 'assignments');
  const expected = path.join(base, unitRunId);
  const stat = lstatOrNull(expected);
  if (stat === null) return { gone: true };
  if (stat.isSymbolicLink() || !stat.isDirectory() || realpathOrNull(expected) !== expected) return { keep: 'link', blocks: true };
  const facts = { fgosDir, caseId, unitRunId, unless, expected, record: readJson(path.join(expected, 'unit.json')) };
  const row = KEEP_REASONS.find((candidate) => candidate.fires(facts));
  return row ? { keep: row.reason, blocks: row.blocks } : { dir: expected };
}

/**
 * Delete a Unit run that judges removable, judged again now. Never follows a link.
 *
 * @returns {{ removed: true } | { gone: true } | { keep: string, blocks: boolean }} a deletion that fails throws
 */
export function removeUnitRun(fgosDir, unitRunId, owner) {
  const verdict = judgeUnitRun(fgosDir, unitRunId, owner);
  if (!verdict.dir) return verdict;
  fs.rmSync(verdict.dir, { recursive: true, force: true });
  return { removed: true };
}
