// The one hand-off: an earlier role's work reaches a later role as the absolute, read-only path
// of its report, listed in the later role's context refs.
//
// Inside a Unit run the pattern passes the earlier role's record (`reportRefOf`). Across Units a
// Unit names `unit-run:<unitRunId>/<role>` in its `inputs`; `resolveUnitInputs` turns that into
// the path once, when the Unit run is created, and the result is kept in unit.json so a resume or
// a fallback hands out the same list.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

import { RunnerConfigError } from '../dispatch/config.mjs';
import { readUnitRunHistory } from './unit-run-history.mjs';

const UNIT_RUN_PREFIX = 'unit-run:';

/** A hand-off that cannot be turned into a path; `reason` names why. */
export class HandoffRefError extends RunnerConfigError {
  constructor(subject, reason) {
    super(`handoff-ref-unresolved: ${subject}: ${reason}`);
    this.reason = reason;
  }
}

const sha256OfFile = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

/**
 * The path of the account one role record left behind, absolute.
 *
 * Settlement lists a report only when it was substantive, with the sha256 of its bytes; that file
 * is handed over after checking it still has those bytes. Without a report the role's claim is the
 * only artifact settlement kept. An inline producer has no settlement: its evidence refs are
 * relative to the Unit run's worktree.
 *
 * @param {{role: string, round: number, runResult?: object}} record role result as returned by runRole / history
 * @param {{mainRoot: string, worktree?: string}} where repo-relative artifact paths are relative to `mainRoot`
 * @returns {string}
 */
export function reportRefOf(record, { mainRoot, worktree = mainRoot }) {
  const subject = `role "${record?.role}" round ${record?.round}`;
  const runResult = record?.runResult ?? {};

  const settled = Array.isArray(runResult.settleReports) ? runResult.settleReports[0] : null;
  if (settled?.path) {
    const file = path.resolve(mainRoot, settled.path);
    let actual = null;
    try {
      actual = sha256OfFile(file);
    } catch {
      actual = null;
    }
    if (actual !== settled.sha256) throw new HandoffRefError(subject, 'report-changed-after-settle');
    return file;
  }

  const artifact = (runResult.evidence?.artifacts ?? []).find((a) => typeof a === 'string' && a !== '');
  if (artifact) return path.resolve(mainRoot, artifact);

  const inline = (Array.isArray(runResult.evidenceRefs) ? runResult.evidenceRefs : []).find((a) => typeof a === 'string' && a !== '');
  if (inline) return path.resolve(worktree, inline);

  throw new HandoffRefError(subject, 'no-report');
}

/**
 * The paths of the reports of in-run role results, in input order, each listed once.
 */
export function reportRefsOf(records, where) {
  const refs = [];
  for (const record of Array.isArray(records) ? records : []) {
    const ref = reportRefOf(record, where);
    if (!refs.includes(ref)) refs.push(ref);
  }
  return refs;
}

function resolveUnitRunRef(input, mainRoot) {
  const [unitRunId, role] = input.slice(UNIT_RUN_PREFIX.length).split('/');
  const fail = (reason) => new HandoffRefError(input, reason);

  const assignmentsDir = path.join(mainRoot, '.fgos', 'assignments');
  const unitDir = path.resolve(assignmentsDir, unitRunId);
  if (path.dirname(unitDir) !== assignmentsDir || !fs.existsSync(unitDir)) throw fail('no-such-run');

  // The latest round of the role is the one that counts; the history already keeps only the
  // latest fallback attempt of each round.
  const rounds = readUnitRunHistory(unitDir).filter((r) => r.role === role);
  if (rounds.length === 0) throw fail('no-such-role');
  const latest = rounds.reduce((a, b) => (b.round > a.round ? b : a));

  let worktree = mainRoot;
  try {
    worktree = JSON.parse(fs.readFileSync(path.join(unitDir, 'unit.json'), 'utf8')).worktree ?? mainRoot;
  } catch {
    // an inline record's refs fall back to the main checkout
  }
  try {
    return reportRefOf(latest, { mainRoot, worktree });
  } catch (err) {
    if (err instanceof HandoffRefError) throw fail(err.reason);
    throw err;
  }
}

/**
 * Turn a Unit's `inputs` into the context refs its roles are given: a repo-relative path stays as
 * it is, a `unit-run:<unitRunId>/<role>` becomes the absolute path of that role's report.
 * Throws before anything is dispatched when a ref cannot be resolved.
 *
 * @param {readonly string[]} inputs
 * @param {string} mainRoot main checkout root
 * @returns {string[]}
 */
export function resolveUnitInputs(inputs, mainRoot) {
  const refs = [];
  for (const input of inputs ?? []) {
    const ref = input.startsWith(UNIT_RUN_PREFIX) ? resolveUnitRunRef(input, mainRoot) : input;
    if (!refs.includes(ref)) refs.push(ref);
  }
  return refs;
}
