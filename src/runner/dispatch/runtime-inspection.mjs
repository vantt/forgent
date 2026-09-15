// Dispatch runtime inspection is deliberately a filesystem reader.  It does
// not import recovery, adapters, process control, or Git mutation helpers.

import fs from 'node:fs';
import path from 'node:path';
import { fgosDirFromRoot } from '../paths.mjs';
import { interpretRunResult } from './run-result.mjs';

const INSPECTION_STATUSES = new Set(['resolved', 'partial', 'ambiguous', 'conflicting', 'not-found']);

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function directories(dir) {
  try { return fs.readdirSync(dir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name); } catch { return []; }
}

function allRunLocations(repoRoot) {
  const fgosDir = fgosDirFromRoot(repoRoot);
  const locations = [];
  for (const assignmentId of directories(path.join(fgosDir, 'assignments'))) {
    const assignmentDir = path.join(fgosDir, 'assignments', assignmentId);
    for (const attempt of directories(path.join(assignmentDir, 'runs'))) {
      locations.push({ kind: 'assignment-run', assignmentId, attempt, runDir: path.join(assignmentDir, 'runs', attempt) });
    }
  }
  for (const group of directories(path.join(fgosDir, 'dispatch-runs'))) {
    for (const attempt of directories(path.join(fgosDir, 'dispatch-runs', group))) {
      locations.push({ kind: 'dispatch-run', group, attempt, runDir: path.join(fgosDir, 'dispatch-runs', group, attempt) });
    }
  }
  return locations.map((location) => ({ ...location, run: readJson(path.join(location.runDir, 'run.json')) })).filter((location) => location.run);
}

function locationProjection(location) {
  return { kind: location.kind, assignmentId: location.assignmentId ?? null, attempt: location.attempt, path: location.runDir };
}

function resultFor(location) {
  const resultPath = path.join(location.runDir, 'result.json');
  if (!fs.existsSync(resultPath)) return null;
  try { return interpretRunResult(resultPath); } catch { return null; }
}

function observationFor(location, result, now) {
  const visibility = readJson(path.join(location.runDir, 'visibility.json'));
  const phase = location.run.phase ?? (result ? 'settled' : location.run.status ?? 'unknown');
  return {
    contract: { id: 'run-observation', version: 1 }, observedAt: now(),
    subject: { kind: 'run', runId: location.run.runId }, phase,
    resourceState: visibility?.status ?? 'unknown', delivery: location.run.delivery ?? 'unknown',
    inspectionStatus: result ? 'resolved' : 'partial',
    evidenceCompleteness: { identity: 'complete', lifecycle: location.run ? 'complete' : 'missing', resource: visibility ? 'complete' : 'missing', result: result ? 'complete' : 'missing', ownership: location.run.coordinationId || location.run.coordinationSessionId || location.assignmentId ? 'complete' : 'partial', workspace: 'unsupported' },
    recoveryAuthority: null,
    observations: [{ kind: 'run-record', source: 'run-repository', level: 'correlated', value: { status: location.run.status ?? null, phase } }],
  };
}

function recoveryAuthority(location) {
  const coordinationId = location.run.coordinationId ?? location.run.coordinationSessionId ?? null;
  if (coordinationId) return { kind: 'coordination-session', id: coordinationId, observeCommand: `fgos coordination recover ${coordinationId}` };
  if (location.run.runId) return { kind: 'standalone-run', id: location.run.runId, observeCommand: `fgos dispatch recover ${location.run.runId}` };
  return null;
}

function inspectOne(location, { now }) {
  const runResult = resultFor(location);
  const runObservation = observationFor(location, runResult, now);
  return {
    inspectionStatus: runResult ? 'resolved' : 'partial',
    subject: { kind: 'run', id: location.run.runId, locations: [locationProjection(location)] },
    observations: runObservation.observations, runObservation, runResult,
    recoveryAuthority: recoveryAuthority(location),
    reconciliation: { state: 'not-needed', reason: 'No stale local guard was observed.' },
    links: { assignmentIds: location.assignmentId ? [location.assignmentId] : [], coordinationIds: location.run.coordinationId ? [location.run.coordinationId] : [], runIds: [location.run.runId] },
  };
}

export function validateInspectionSelector(options = {}) {
  const supplied = [['run', options.run], ['assignment', options.assignment], ['cwd', options.cwd]].filter(([, value]) => typeof value === 'string' && value.trim());
  if (supplied.length !== 1) throw new Error('dispatch inspect requires exactly one selector: --run, --assignment, or --cwd');
  const [kind, id] = supplied[0];
  return { kind, id };
}

export function inspectDispatchRuntime(repoRoot, options = {}, { now = () => new Date().toISOString() } = {}) {
  const selector = validateInspectionSelector(options);
  const locations = allRunLocations(repoRoot);
  if (selector.kind === 'run') {
    const matches = locations.filter((location) => location.run.runId === selector.id);
    if (matches.length === 0) return { inspectionStatus: 'not-found', subject: { kind: 'run', id: selector.id, locations: [] }, observations: [], runObservation: null, runResult: null, reconciliation: { state: 'not-needed', reason: 'No matching Run was found.' }, links: { assignmentIds: [], coordinationIds: [], runIds: [] } };
    if (matches.length > 1) return { inspectionStatus: 'ambiguous', subject: { kind: 'run', id: selector.id, locations: matches.map(locationProjection) }, observations: [], runObservation: null, runResult: null, reconciliation: { state: 'manual-required', reason: 'More than one Run repository owns this run id.' }, links: { assignmentIds: [...new Set(matches.map((match) => match.assignmentId).filter(Boolean))], coordinationIds: [], runIds: [selector.id] } };
    return inspectOne(matches[0], { now });
  }
  if (selector.kind === 'assignment') {
    const assignmentDir = path.join(fgosDirFromRoot(repoRoot), 'assignments', selector.id);
    const assignment = readJson(path.join(assignmentDir, 'assignment.json'));
    if (!assignment) return { inspectionStatus: 'not-found', subject: { kind: 'assignment', id: selector.id, locations: [] }, observations: [], runObservation: null, runResult: null, reconciliation: { state: 'not-needed', reason: 'No matching Assignment was found.' }, links: { assignmentIds: [], coordinationIds: [], runIds: [] } };
    const runs = locations.filter((location) => location.assignmentId === selector.id);
    const current = runs.filter((location) => !runs.some((other) => other.run.supersedesRunId === location.run.runId) && !resultFor(location));
    const status = current.length > 1 ? 'conflicting' : runs.length ? (current.length ? 'partial' : 'resolved') : 'resolved';
    const inspected = current.length === 1 ? inspectOne(current[0], { now }) : null;
    return { inspectionStatus: status, subject: { kind: 'assignment', id: selector.id, locations: runs.map(locationProjection) }, observations: [{ kind: 'assignment-history', source: 'assignment-repository', level: 'correlated', value: { delivery: runs.length ? 'started' : 'not-started', currentRunIds: current.map((run) => run.run.runId), runIds: runs.map((run) => run.run.runId) } }], runObservation: inspected?.runObservation ?? null, runResult: inspected?.runResult ?? null, ...(current.length === 1 ? { recoveryAuthority: inspected.recoveryAuthority } : {}), reconciliation: { state: current.length > 1 ? 'manual-required' : 'not-needed', reason: current.length > 1 ? 'Multiple current Runs were derived from admission facts.' : 'No stale local guard was observed.' }, links: { assignmentIds: [selector.id], coordinationIds: [], runIds: runs.map((run) => run.run.runId) } };
  }
  const canonicalCwd = path.resolve(selector.id);
  const matches = locations.filter((location) => location.run.cwd && path.resolve(location.run.cwd) === canonicalCwd);
  const lock = readJson(path.join(fgosDirFromRoot(repoRoot), 'dispatch.lock'));
  const active = matches.filter((location) => !resultFor(location));
  const authority = active.length === 1 ? recoveryAuthority(active[0]) : null;
  return { inspectionStatus: matches.length ? (active.length > 1 ? 'conflicting' : 'resolved') : 'not-found', subject: { kind: 'cwd', id: canonicalCwd, locations: matches.map(locationProjection) }, observations: [{ kind: 'cwd-aggregate', source: 'workspace-evidence', level: 'correlated', value: { lock, activeRunIds: active.map((run) => run.run.runId), historicalRunIds: matches.filter((run) => resultFor(run)).map((run) => run.run.runId), workspace: 'unsupported' } }], runObservation: null, runResult: null, ...(authority ? { recoveryAuthority: authority } : {}), reconciliation: { state: 'not-needed', reason: 'Inspection is read-only and does not repair guards.' }, links: { assignmentIds: [...new Set(matches.map((match) => match.assignmentId).filter(Boolean))], coordinationIds: [], runIds: matches.map((match) => match.run.runId) } };
}

export { INSPECTION_STATUSES };
