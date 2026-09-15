// Read-only Dispatch runtime inspection. Keep this below recovery, adapter,
// process-control, and Git-mutation layers.
import fs from 'node:fs';
import path from 'node:path';
import { interpretRunResult } from './run-result.mjs';

const INSPECTION_STATUSES = new Set(['resolved', 'partial', 'ambiguous', 'conflicting', 'not-found']);
const json = (file) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } };
const jsonEvidence = (file, fallback) => {
  if (!fs.existsSync(file)) return { complete: false, value: fallback };
  const value = json(file);
  return value === null ? { complete: false, value: fallback } : { complete: true, value };
};
const text = (file) => { try { return fs.readFileSync(file, 'utf8').trim(); } catch { return null; } };
const dirs = (dir) => { try { return fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name); } catch { return []; } };
const uniq = (xs) => [...new Set(xs.filter(Boolean))];
const real = (p) => { try { return fs.realpathSync(p); } catch { return path.resolve(p); } };
const fgosDir = (root) => path.join(root, '.fgos');

function allRuns(root) {
  const base = fgosDir(root), out = [];
  for (const assignmentId of dirs(path.join(base, 'assignments'))) for (const attempt of dirs(path.join(base, 'assignments', assignmentId, 'runs'))) {
    const runDir = path.join(base, 'assignments', assignmentId, 'runs', attempt), run = json(path.join(runDir, 'run.json'));
    out.push({ kind: 'assignment-run', assignmentId, attempt, runDir, run, malformed: !run || typeof run !== 'object' || Array.isArray(run) });
  }
  for (const group of dirs(path.join(base, 'dispatch-runs'))) for (const attempt of dirs(path.join(base, 'dispatch-runs', group))) {
    const runDir = path.join(base, 'dispatch-runs', group, attempt), run = json(path.join(runDir, 'run.json'));
    out.push({ kind: 'dispatch-run', group, attempt, runDir, run, malformed: !run || typeof run !== 'object' || Array.isArray(run) });
  }
  return out;
}
const project = (l) => ({ kind: l.kind, assignmentId: l.assignmentId ?? null, attempt: l.attempt, path: l.runDir });
function result(l) {
  const file = path.join(l.runDir, 'result.json');
  if (!fs.existsSync(file)) return { present: false, value: null };
  try { return { present: true, value: interpretRunResult(file) }; } catch { return { present: true, value: interpretRunResult(null) }; }
}
// The admission ledger is read directly. Importing run-lock would make the
// inspect graph reach its writer/process-control functions.
function admissions(dir) {
  const genDir = path.join(dir, 'admission', 'generations'); let names;
  try { names = fs.readdirSync(genDir); } catch { return { records: [], corrupt: false }; }
  let corrupt = false, records = [];
  for (const name of names.filter((n) => /^\d{10}\.json$/.test(n)).sort()) {
    const record = json(path.join(genDir, name));
    if (!record?.runId) { corrupt = true; continue; }
    const aborted = record.retryId && json(path.join(dir, 'admission', 'markers', `${record.retryId}.aborted.json`));
    if (!aborted) records.push({ ...record, epoch: Number(name.slice(0, 10)) });
  }
  return { records, corrupt };
}
function assignmentEvidence(root, assignmentId, all) {
  const dir = path.join(fgosDir(root), 'assignments', assignmentId), facts = admissions(dir), records = all.filter((l) => l.assignmentId === assignmentId), malformed = records.filter((l) => l.malformed), runs = records.filter((l) => !l.malformed), byId = new Map();
  for (const l of runs) { const candidates = byId.get(l.run.runId) ?? []; candidates.push(l); byId.set(l.run.runId, candidates); }
  const admitted = new Set(facts.records.map((record) => record.runId)), unadmitted = runs.filter((l) => !admitted.has(l.run.runId)), latest = facts.records.at(-1), currentIds = latest ? facts.records.filter((r) => r.attempt === latest.attempt && r.runId !== latest.runId ? true : r === latest).map((r) => r.runId) : [], current = currentIds.flatMap((id) => byId.get(id) ?? []), absent = currentIds.filter((id) => !byId.has(id)), duplicateCurrent = currentIds.filter((id) => (byId.get(id)?.length ?? 0) > 1);
  return { facts, records, malformed, runs, byId, unadmitted, currentIds, current, absent, duplicateCurrent, incomplete: facts.corrupt || malformed.length || unadmitted.length || absent.length };
}
function owner(l, root, all) {
  if (l.malformed || !l.run?.runId) return { complete: false };
  if (l.kind !== 'assignment-run') return { complete: true, kind: 'standalone-run', id: l.run.runId };
  const dir = path.join(fgosDir(root), 'assignments', l.assignmentId), assignment = json(path.join(dir, 'assignment.json')), evidence = assignmentEvidence(root, l.assignmentId, all);
  const admitted = evidence.facts.records.some((record) => record.runId === l.run.runId);
  if (!assignment || assignment.assignmentId !== l.assignmentId || l.run.assignmentId !== l.assignmentId || !admitted || evidence.incomplete) return { complete: false };
  const id = l.run.coordinationId ?? l.run.coordinationSessionId;
  if (!id) return { complete: true, kind: 'standalone-run', id: l.run.runId };
  const session = json(path.join(fgosDir(root), 'coordination', 'sessions', id, 'session.json'));
  return session && Array.isArray(session.assignmentRefs) && session.assignmentRefs.includes(l.assignmentId) ? { complete: true, kind: 'coordination-session', id } : { complete: false };
}
function authority(l, root, all) { const o = owner(l, root, all); if (!o.complete) return null; return o.kind === 'coordination-session' ? { kind: o.kind, id: o.id, observeCommand: `fgos coordination recover ${o.id}` } : { kind: o.kind, id: o.id, observeCommand: `fgos dispatch recover ${o.id}` }; }
function one(l, root, now, all) {
  const terminal = result(l), runResult = terminal.value, o = owner(l, root, all), phase = l.run.phase ?? (terminal.present ? 'settled' : l.run.status ?? 'unknown');
  const observation = { contract: { id: 'run-observation', version: 1 }, observedAt: now(), subject: { kind: 'run', runId: l.run.runId }, phase, resourceState: json(path.join(l.runDir, 'visibility.json'))?.status ?? 'unknown', delivery: l.run.delivery ?? 'unknown', inspectionStatus: terminal.present ? 'resolved' : 'partial', evidenceCompleteness: { identity: 'complete', lifecycle: 'complete', resource: 'missing', result: terminal.present ? 'complete' : 'missing', ownership: o.complete ? 'complete' : 'partial', workspace: 'partial' }, recoveryAuthority: null, observations: [{ kind: 'run-record', source: 'run-repository', level: 'correlated', value: { status: l.run.status ?? null, phase } }] };
  const hint = authority(l, root, all);
  return { inspectionStatus: o.complete && terminal.present ? 'resolved' : 'partial', subject: { kind: 'run', id: l.run.runId, locations: [project(l)] }, observations: observation.observations, runObservation: observation, runResult, ...(hint ? { recoveryAuthority: hint } : {}), reconciliation: { state: o.complete ? 'not-needed' : 'manual-required', reason: o.complete ? 'No stale local guard was observed.' : 'Run ownership is incomplete or disagrees with repository admission facts.' }, links: { assignmentIds: l.assignmentId ? [l.assignmentId] : [], coordinationIds: l.run.coordinationId ? [l.run.coordinationId] : [], runIds: [l.run.runId] } };
}
function workspace(input) { const absolute = path.resolve(input); let cursor = absolute; try { if (!fs.statSync(cursor).isDirectory()) cursor = path.dirname(cursor); } catch { return { path: absolute, root: absolute, commonDir: null, key: absolute }; } for (;;) { const dot = path.join(cursor, '.git'); if (fs.existsSync(dot)) { let gitDir = dot; try { if (fs.statSync(dot).isFile()) { const m = /^gitdir:\s*(.+)\s*$/m.exec(fs.readFileSync(dot, 'utf8')); if (m) gitDir = path.resolve(cursor, m[1]); } } catch {} const common = text(path.join(gitDir, 'commondir')), commonDir = common ? path.resolve(gitDir, common) : gitDir; return { path: absolute, root: real(cursor), commonDir: real(commonDir), key: `${real(cursor)}::${real(commonDir)}` }; } const parent = path.dirname(cursor); if (parent === cursor) break; cursor = parent; } return { path: absolute, root: absolute, commonDir: null, key: absolute }; }
const missing = (kind, id, reason) => ({ inspectionStatus: 'not-found', subject: { kind, id, locations: [] }, observations: [], runObservation: null, runResult: null, reconciliation: { state: 'not-needed', reason }, links: { assignmentIds: [], coordinationIds: [], runIds: [] } });

export function validateInspectionSelector(options = {}) { const supplied = [['run', options.run], ['assignment', options.assignment], ['cwd', options.cwd]].filter(([, v]) => typeof v === 'string' && v.trim()); if (supplied.length !== 1) throw new Error('dispatch inspect requires exactly one selector: --run, --assignment, or --cwd'); return { kind: supplied[0][0], id: supplied[0][1] }; }
export function inspectDispatchRuntime(root, options = {}, { now = () => new Date().toISOString() } = {}) {
  const selector = validateInspectionSelector(options), all = allRuns(root), base = fgosDir(root);
  if (selector.kind === 'run') { const found = all.filter((l) => !l.malformed && l.run.runId === selector.id); if (!found.length) return missing('run', selector.id, 'No matching Run was found in registered Assignment or ad-hoc Run repositories.'); if (found.length > 1) return { ...missing('run', selector.id, 'More than one Run repository owns this run id.'), inspectionStatus: 'ambiguous', subject: { kind: 'run', id: selector.id, locations: found.map(project) }, reconciliation: { state: 'manual-required', reason: 'More than one Run repository owns this run id.' }, links: { assignmentIds: uniq(found.map((l) => l.assignmentId)), coordinationIds: [], runIds: [selector.id] } }; return one(found[0], root, now, all); }
  if (selector.kind === 'assignment') {
    const dir = path.join(base, 'assignments', selector.id), assignment = json(path.join(dir, 'assignment.json')); if (!assignment) return missing('assignment', selector.id, 'No matching Assignment was found.');
    const evidence = assignmentEvidence(root, selector.id, all), { facts, records, malformed, currentIds, current, absent, duplicateCurrent, unadmitted, incomplete } = evidence, ambiguous = current.length > 1 || duplicateCurrent.length > 0, inspected = !ambiguous && current.length === 1 ? one(current[0], root, now, all) : null, status = incomplete ? 'partial' : ambiguous ? 'conflicting' : inspected?.inspectionStatus ?? 'resolved';
    return { inspectionStatus: status, subject: { kind: 'assignment', id: selector.id, locations: records.map(project) }, observations: [{ kind: 'assignment-history', source: 'admission-generation-ledger', level: incomplete ? 'partial' : 'correlated', value: { delivery: facts.records.length ? 'started' : 'not-started', currentRunIds: currentIds, runIds: facts.records.map((r) => r.runId), missingMaterializations: absent, malformedMaterializations: malformed.map(project), unadmittedMaterializations: unadmitted.map(project), duplicateCurrentMaterializations: duplicateCurrent } }], runObservation: inspected?.runObservation ?? null, runResult: inspected?.runResult ?? null, ...(!incomplete && !ambiguous && inspected?.recoveryAuthority ? { recoveryAuthority: inspected.recoveryAuthority } : {}), reconciliation: { state: incomplete || ambiguous ? 'manual-required' : 'not-needed', reason: incomplete ? 'Admission ledger and Run materialization are incomplete or corrupt.' : ambiguous ? 'Multiple current Run materializations were derived from admission facts.' : 'No stale local guard was observed.' }, links: { assignmentIds: [selector.id], coordinationIds: [], runIds: facts.records.map((r) => r.runId) } };
  }
  const identity = workspace(selector.id), valid = all.filter((l) => !l.malformed), found = valid.filter((l) => l.run.cwd && workspace(l.run.cwd).key === identity.key), active = found.filter((l) => !result(l).present), lockEvidence = jsonEvidence(path.join(base, 'dispatch.lock'), null), workspaceEvidence = jsonEvidence(path.join(base, 'workspace-evidence.json'), { dirt: 'unknown' }), projectionEvidence = jsonEvidence(path.join(base, 'dispatch', 'projection-conflicts.json'), []), evidenceComplete = lockEvidence.complete && workspaceEvidence.complete && projectionEvidence.complete && Array.isArray(projectionEvidence.value), malformed = all.some((l) => l.malformed && l.kind === 'assignment-run'), conflicts = Array.isArray(projectionEvidence.value) ? projectionEvidence.value : [], conflict = (active.length > 1 && active.some((l) => l.run.concurrency === 'forbidden')) || conflicts.length > 0, aggregate = { git: identity, lock: lockEvidence.value, activeRunIds: active.map((l) => l.run.runId), historicalRunIds: found.filter((l) => result(l).present).map((l) => l.run.runId), historicalRunResults: found.filter((l) => result(l).present).map((l) => ({ runId: l.run.runId, result: result(l).value })), workspace: workspaceEvidence.value, guardConflicts: conflicts };
  if (!found.length) return { ...missing('cwd', identity.path, 'No Runs are bound to this canonical workspace identity.'), subject: { kind: 'cwd', id: identity.path, locations: [] }, observations: [{ kind: 'cwd-aggregate', source: 'workspace-evidence', level: 'partial', value: aggregate }] };
  const ownershipComplete = found.every((l) => owner(l, root, all).complete), complete = evidenceComplete && !malformed && ownershipComplete, hint = complete && active.length === 1 && !conflict ? authority(active[0], root, all) : null, status = conflict ? 'conflicting' : complete ? 'resolved' : 'partial';
  return { inspectionStatus: status, subject: { kind: 'cwd', id: identity.path, locations: found.map(project) }, observations: [{ kind: 'cwd-aggregate', source: 'workspace-evidence', level: complete && !conflict ? 'correlated' : 'partial', value: aggregate }], runObservation: null, runResult: null, ...(hint ? { recoveryAuthority: hint } : {}), reconciliation: { state: conflict || !complete ? 'manual-required' : 'not-needed', reason: conflict ? 'Workspace guard/projection or concurrency facts conflict.' : !complete ? 'Workspace guard/projection evidence or Run materialization is incomplete or corrupt.' : 'Inspection is read-only and does not repair guards.' }, links: { assignmentIds: uniq(found.map((l) => l.assignmentId)), coordinationIds: [], runIds: found.map((l) => l.run.runId) } };
}
export { INSPECTION_STATUSES };
