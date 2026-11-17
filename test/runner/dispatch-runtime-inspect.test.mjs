import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { acquireSync, createLockScope } from '../../src/holder-lock/index.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  inspectDispatchRuntime,
  attentionView,
  validateInspectionSelector,
  VALID_PHASES,
  VALID_RESOURCE_STATES,
  VALID_DELIVERIES,
  VALID_COMPLETENESS,
  INSPECTION_STATUSES,
} from '../../src/runner/dispatch/runtime-inspection.mjs';
import { invokeDispatchInspectOperation, inspectDispatchUseCase } from '../../src/verbs/dispatch/inspect.mjs';

const fixture = () => fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-inspect-'));
function assignment(root, id) { const dir = path.join(root, '.fgos', 'assignments', id); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'assignment.json'), JSON.stringify({ assignmentId: id })); return dir; }
function run(root, id, attempt, value, result) { const dir = path.join(root, '.fgos', 'assignments', id, 'runs', attempt); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'run.json'), JSON.stringify({ assignmentId: id, ...value })); if (result) fs.writeFileSync(path.join(dir, 'result.json'), JSON.stringify(result)); return dir; }
function admit(root, id, epoch, value) { const dir = path.join(root, '.fgos', 'assignments', id, 'admission', 'generations'); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, `${String(epoch).padStart(10, '0')}.json`), JSON.stringify(value)); }
const v1 = (runId, assignmentId) => ({ runId, assignmentId, status: 'done', confidence: 'reported' });
// A version-2 record as runs written before version 3 left it on disk.
const v2 = (runId, assignmentId) => ({
  contract: { id: 'assignment-run-result', version: 2 }, runId, assignmentId, status: 'done', confidence: 'reported',
  classification: { execution: { status: 'completed', exitCode: 0 }, assessment: { verdict: 'pass' }, confidence: { level: 'reported', basis: ['valid-agent-result-claim'] }, failure: null, policy: { disposition: 'allow', code: null }, delivery: { mode: 'fresh' }, provenance: 'native-v2' },
});

test('inspection requires exactly one typed selector', () => { assert.throws(() => validateInspectionSelector({}), /exactly one selector/); assert.throws(() => validateInspectionSelector({ run: 'r', cwd: '/tmp' }), /exactly one selector/); });
test('run and assignment not-found include no authority hint', () => { const root = fixture(); assert.equal(inspectDispatchRuntime(root, { run: 'none' }).inspectionStatus, 'not-found'); assert.equal(inspectDispatchRuntime(root, { assignment: 'none' }).inspectionStatus, 'not-found'); });
test('duplicate Run ids remain ambiguous and never select a candidate', () => { const root = fixture(); run(root, 'a', '01', { runId: 'same' }); run(root, 'b', '01', { runId: 'same' }); const got = inspectDispatchRuntime(root, { run: 'same' }); assert.equal(got.inspectionStatus, 'ambiguous'); assert.equal(got.subject.locations.length, 2); assert.equal(got.recoveryAuthority, undefined); });
test('Run selector interprets legacy, v2, and contract-corrupt terminal results', () => { const root = fixture(); assignment(root, 'a'); run(root, 'a', '01', { runId: 'legacy' }, v1('legacy', 'a')); run(root, 'a', '02', { runId: 'native' }, v2('native', 'a')); run(root, 'a', '03', { runId: 'corrupt' }, { contract: { id: 'assignment-run-result', version: 2 }, runId: 'corrupt' }); admit(root, 'a', 1, { runId: 'legacy', attempt: 1 }); admit(root, 'a', 2, { runId: 'native', attempt: 2 }); admit(root, 'a', 3, { runId: 'corrupt', attempt: 3 }); const legacy = inspectDispatchRuntime(root, { run: 'legacy' }); assert.equal(legacy.runResult.classification.provenance, 'legacy-derived'); assert.equal(legacy.runResult.contract.version, 2); assert.equal(inspectDispatchRuntime(root, { run: 'native' }).runResult.classification.provenance, 'native-v2'); const corrupt = inspectDispatchRuntime(root, { run: 'corrupt' }); assert.equal(corrupt.runResult.contractCorrupt, true); assert.equal(corrupt.runResult.classification.provenance, 'contract-corrupt'); });
test('assignment current projects the interpreted terminal RunResult', () => { const root = fixture(); assignment(root, 'a'); run(root, 'a', '01', { runId: 'old' }); run(root, 'a', '02', { runId: 'current' }, v1('current', 'a')); admit(root, 'a', 1, { runId: 'old', attempt: 1 }); admit(root, 'a', 2, { runId: 'current', attempt: 2, predecessorRunId: 'old' }); const got = inspectDispatchRuntime(root, { assignment: 'a' }); assert.equal(got.runObservation.subject.runId, 'current'); assert.equal(got.runResult.classification.provenance, 'legacy-derived'); });
test('missing admission materialization is partial and has no hint', () => { const root = fixture(); assignment(root, 'a'); admit(root, 'a', 1, { runId: 'ghost', attempt: 1 }); const got = inspectDispatchRuntime(root, { assignment: 'a' }); assert.equal(got.inspectionStatus, 'partial'); assert.equal(got.recoveryAuthority, undefined); });
test('multiple current admission facts are conflicting and have no hint', () => { const root = fixture(); assignment(root, 'a'); run(root, 'a', '01', { runId: 'one' }); run(root, 'a', '02', { runId: 'two' }); admit(root, 'a', 1, { runId: 'one', attempt: 2 }); admit(root, 'a', 2, { runId: 'two', attempt: 2 }); const got = inspectDispatchRuntime(root, { assignment: 'a' }); assert.equal(got.inspectionStatus, 'conflicting'); assert.equal(got.recoveryAuthority, undefined); });
test('duplicate admitted current Run materializations are conflicting and retain every location', () => { const root = fixture(); assignment(root, 'a'); run(root, 'a', '01', { runId: 'same' }, v1('same', 'a')); run(root, 'a', '02', { runId: 'same' }, v1('same', 'a')); admit(root, 'a', 1, { runId: 'same', attempt: 1 }); const got = inspectDispatchRuntime(root, { assignment: 'a' }); assert.equal(got.inspectionStatus, 'conflicting'); assert.equal(got.subject.locations.length, 2); assert.equal(got.runObservation, null); assert.equal(got.recoveryAuthority, undefined); assert.deepEqual(got.observations[0].value.duplicateCurrentMaterializations, ['same']); });
test('incomplete or mismatched Assignment ownership never emits recovery authority', () => { const root = fixture(); run(root, 'orphan', '01', { runId: 'orphan' }); assert.equal(inspectDispatchRuntime(root, { run: 'orphan' }).recoveryAuthority, undefined); assignment(root, 'bad'); run(root, 'bad', '01', { runId: 'bad-run', assignmentId: 'other' }); admit(root, 'bad', 1, { runId: 'bad-run' }); assert.equal(inspectDispatchRuntime(root, { assignment: 'bad' }).recoveryAuthority, undefined); });
test('unadmitted Assignment Runs have no hint through Run or cwd selectors', () => { const root = fixture(), cwd = path.join(root, 'cwd'); fs.mkdirSync(cwd); assignment(root, 'a'); run(root, 'a', '01', { runId: 'unadmitted', cwd }); const byRun = inspectDispatchRuntime(root, { run: 'unadmitted' }); assert.equal(byRun.inspectionStatus, 'partial'); assert.equal(byRun.recoveryAuthority, undefined); const byCwd = inspectDispatchRuntime(root, { cwd }); assert.equal(byCwd.recoveryAuthority, undefined); });
test('malformed Assignment run materialization is partial/manual-required and never hinted', () => { const root = fixture(); assignment(root, 'a'); run(root, 'a', '01', { runId: 'valid' }); admit(root, 'a', 1, { runId: 'valid', attempt: 1 }); const bad = path.join(root, '.fgos', 'assignments', 'a', 'runs', '02'); fs.mkdirSync(bad, { recursive: true }); fs.writeFileSync(path.join(bad, 'run.json'), '{ invalid json'); const got = inspectDispatchRuntime(root, { assignment: 'a' }); assert.equal(got.inspectionStatus, 'partial'); assert.equal(got.reconciliation.state, 'manual-required'); assert.equal(got.recoveryAuthority, undefined); });
test('Run selector fails closed when its Assignment has a malformed sibling', () => { const root = fixture(); assignment(root, 'a'); run(root, 'a', '01', { runId: 'good' }, v1('good', 'a')); admit(root, 'a', 1, { runId: 'good', attempt: 1 }); const bad = path.join(root, '.fgos', 'assignments', 'a', 'runs', '02'); fs.mkdirSync(bad, { recursive: true }); fs.writeFileSync(path.join(bad, 'run.json'), '{ invalid json'); const got = inspectDispatchRuntime(root, { run: 'good' }); assert.equal(got.inspectionStatus, 'partial'); assert.equal(got.reconciliation.state, 'manual-required'); assert.equal(got.recoveryAuthority, undefined); });
test('cwd aggregates lock, active and terminal history when all evidence is present', () => { const root = fixture(), work = path.join(root, 'work'); fs.mkdirSync(path.join(work, '.git'), { recursive: true }); fs.writeFileSync(path.join(work, '.git', 'commondir'), '.'); fs.mkdirSync(path.join(work, 'child')); assignment(root, 'a'); assignment(root, 'b'); run(root, 'a', '01', { runId: 'active', cwd: path.join(work, 'child') }); run(root, 'b', '01', { runId: 'terminal', cwd: work }, v1('terminal', 'b')); admit(root, 'a', 1, { runId: 'active', attempt: 1 }); admit(root, 'b', 1, { runId: 'terminal', attempt: 1 }); fs.mkdirSync(path.join(root, '.fgos', 'dispatch'), { recursive: true }); fs.writeFileSync(path.join(root, '.fgos', 'dispatch.lock'), JSON.stringify({ holder: 'runner' })); fs.writeFileSync(path.join(root, '.fgos', 'workspace-evidence.json'), JSON.stringify({ dirt: 'clean' })); fs.writeFileSync(path.join(root, '.fgos', 'dispatch', 'projection-conflicts.json'), JSON.stringify([])); const got = inspectDispatchRuntime(root, { cwd: work }), value = got.observations[0].value; assert.equal(got.inspectionStatus, 'resolved'); assert.equal(got.observations[0].level, 'correlated'); assert.equal(value.lock.holder, 'runner'); assert.deepEqual(value.activeRunIds, ['active']); assert.deepEqual(value.historicalRunIds, ['terminal']); assert.equal(value.historicalRunResults[0].result.classification.provenance, 'legacy-derived'); });
test('cwd evidence absence or malformation is partial and never correlated', () => { const root = fixture(), cwd = path.join(root, 'cwd'); fs.mkdirSync(cwd); assignment(root, 'a'); run(root, 'a', '01', { runId: 'a', cwd }); admit(root, 'a', 1, { runId: 'a', attempt: 1 }); let got = inspectDispatchRuntime(root, { cwd }); assert.equal(got.inspectionStatus, 'partial'); assert.equal(got.observations[0].level, 'partial'); fs.mkdirSync(path.join(root, '.fgos', 'dispatch'), { recursive: true }); fs.writeFileSync(path.join(root, '.fgos', 'dispatch.lock'), '{bad'); fs.writeFileSync(path.join(root, '.fgos', 'workspace-evidence.json'), '{bad'); fs.writeFileSync(path.join(root, '.fgos', 'dispatch', 'projection-conflicts.json'), '{bad'); got = inspectDispatchRuntime(root, { cwd }); assert.equal(got.inspectionStatus, 'partial'); assert.equal(got.observations[0].level, 'partial'); });
test('cwd selector fails closed when a bound sibling is valid but unadmitted', () => { const root = fixture(), cwd = path.join(root, 'cwd'); fs.mkdirSync(cwd); assignment(root, 'a'); assignment(root, 'b'); run(root, 'a', '01', { runId: 'good', cwd }, v1('good', 'a')); run(root, 'b', '01', { runId: 'bad', cwd }, v1('bad', 'b')); admit(root, 'a', 1, { runId: 'good', attempt: 1 }); fs.mkdirSync(path.join(root, '.fgos', 'dispatch'), { recursive: true }); fs.writeFileSync(path.join(root, '.fgos', 'dispatch.lock'), '{}'); fs.writeFileSync(path.join(root, '.fgos', 'workspace-evidence.json'), '{}'); fs.writeFileSync(path.join(root, '.fgos', 'dispatch', 'projection-conflicts.json'), '[]'); const got = inspectDispatchRuntime(root, { cwd }); assert.equal(got.inspectionStatus, 'partial'); assert.equal(got.observations[0].level, 'partial'); assert.equal(got.reconciliation.state, 'manual-required'); assert.equal(got.recoveryAuthority, undefined); });
test('cwd not-found and concurrency-permitted active runs are distinct from conflict', () => { const root = fixture(), cwd = path.join(root, 'cwd'); fs.mkdirSync(cwd); assert.equal(inspectDispatchRuntime(root, { cwd }).inspectionStatus, 'not-found'); assignment(root, 'a'); assignment(root, 'b'); run(root, 'a', '01', { runId: 'a', cwd, concurrency: 'permitted' }); run(root, 'b', '01', { runId: 'b', cwd, concurrency: 'permitted' }); admit(root, 'a', 1, { runId: 'a' }); admit(root, 'b', 1, { runId: 'b' }); fs.mkdirSync(path.join(root, '.fgos', 'dispatch'), { recursive: true }); fs.writeFileSync(path.join(root, '.fgos', 'dispatch.lock'), '{}'); fs.writeFileSync(path.join(root, '.fgos', 'workspace-evidence.json'), '{}'); fs.writeFileSync(path.join(root, '.fgos', 'dispatch', 'projection-conflicts.json'), '[]'); assert.equal(inspectDispatchRuntime(root, { cwd }).inspectionStatus, 'resolved'); });
test('host routing selects solely operation/effect; Dispatch alone receives selector payload', () => { const selected = []; const answer = invokeDispatchInspectOperation({ operationId: 'dispatch.runtime.inspect', effect: 'read', payload: { selector: { run: 'none' } }, ctx: { repoRoot: fixture() } }, { selectProvider: (route) => { selected.push(route); return (ctx, selector) => ({ ctx, selector }); } }); assert.deepEqual(selected, [{ operationId: 'dispatch.runtime.inspect', effect: 'read' }]); assert.deepEqual(answer.selector, { run: 'none' }); });
test('the terminal selector answers the allocation scan and names no run; the scan itself is owned by the terminal-control client test', () => {
  const root = fixture();
  const terminalControl = { capabilities: () => ({ defaults: { allocationGraceMs: 60000 } }), reconcileScan: ({ olderThanMs }) => ({ result: 'scan', findings: [{ key: 'slot-a', kind: 'retain-expired', paneId: 'p1' }], olderThanMs }) };
  const got = inspectDispatchUseCase({ repoRoot: root }, { terminal: true, terminalControl, globalConfigPath: path.join(root, 'no-global-config.json') });
  assert.equal(got.state, 'scanned');
  assert.deepEqual(got.findings.map((f) => [f.key, f.kind, f.paneId]), [['slot-a', 'retain-expired', 'p1']]);
  assert.equal(got.runObservation, undefined);
});
test('public inspect use-case import graph cannot reach mutation/recovery/process/Git execution', () => {
  const root = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
  const seen = new Set();
  // run-result.mjs: proven leaf (this test's own header comment on the
  // sibling reconciliation-import-graph test cites this exact carve-out).
  // config/facade.mjs: `inspect.mjs` imports only its `readMachineConfig`, one read-only
  // `snapshot` call of the native config door that builds `runnerConfig` for read-only
  // inspection context. The same file also exports the `fixConfig`
  // writer (`inspect.mjs` never imports or calls it), and it reaches the native door
  // module, whose text names process and file-writing calls. A whole-file text scan cannot
  // distinguish the exports; proven safe by the same read-the-actual-reachable-code standard
  // every other entry here relies on.
  //
  // provider-capacity.mjs: `inspect.mjs` also directly imports
  // `inspectProviderCapacity` from it (doctor/inspect reporting) -- verified
  // by direct reading that export only ever calls `readState`/
  // `providerAccountInventory`/`isQuarantined` (pure reads of its own state
  // file), never the file's UNRELATED `isPidAlive` helper (`process.kill(pid,
  // 0)`, used only by `reclaimDeadLeases`/`rankProviderAccounts`, neither
  // reachable from `inspect.mjs`). Same identical-file, different-export
  // carve-out as the reconciliation-import-graph test's own proven leaf.
  //
  // run-supervisor/client.mjs: `inspect.mjs` reaches it only through
  // `show-run.mjs` `readAttemptView`, which calls `adoptRun(dir, { probeOnly: true })`.
  // The host's adopt route with `--probe-only` returns its verdict before any
  // write (`adopt_one` in packages/run-supervisor/rust/src/adopt.rs), and its
  // lock probe takes a shared try-lock that it releases at once
  // (`fgos_holder_lock::probe`). The file's other exports (adopt without
  // probing, the scan) are not reachable from `inspect.mjs`. Same
  // identical-file, different-export carve-out as the entries above.
  //
  // terminal-control/client.mjs: `inspect.mjs` reaches it only through `scanTerminalAllocations`, which calls the
  // port's `capabilities` and `reconcileScan` operations. The route's scan only observes (it reads the allocation
  // records and the panes; closing a pane is the separate `release` operation, which `scanTerminalAllocations` never
  // calls). The file's other operations (allocate, attach, release, read) are not reachable from `inspect.mjs`.
  // Same identical-file, different-export carve-out as the entries above.
  //
  // The attempt view also reaches three files for one read each, verified by
  // direct reading: runner/paths.mjs `fgosDirFromRoot` (a path join);
  // dispatch/visibility-session.mjs `readVisibility` (one JSON read);
  // run-supervisor/run-lock.mjs `listGenerations` and `inspectRunControl` (directory
  // and JSON reads). Their writers (acquire,
  // release, the visibility session) are not reachable from `inspect.mjs`.
  const isProvenLeaf = (file) => {
    const f = file.replaceAll('\\', '/');
    return f.endsWith('/run-result.mjs') || f.endsWith('/config/facade.mjs') || f.endsWith('/provider-capacity.mjs') || f.endsWith('/run-supervisor/client.mjs') || f.endsWith('/terminal-control/client.mjs')
      || f.endsWith('/runner/paths.mjs') || f.endsWith('/run-supervisor/run-lock.mjs') || f.endsWith('/dispatch/visibility-session.mjs');
  };
  function walk(file) {
    if (seen.has(file)) return;
    seen.add(file);
    if (isProvenLeaf(file)) return;
    const source = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /node:child_process|\b(?:recoverApply|executeAssignment|spawn|execFile|process\.kill|\.kill\(|\.signal\(|git\s+(?:reset|clean|commit|add)|writeFileSync|mkdirSync|rmSync)\b/);
    for (const m of source.matchAll(/from\s+['"](\.{1,2}\/[^'"]+)['"]/g)) {
      let target = path.resolve(path.dirname(file), m[1]);
      if (!path.extname(target)) target += '.mjs';
      walk(target);
    }
  }
  walk(path.join(root, 'src/verbs/dispatch/inspect.mjs'));
  assert.ok(seen.has(path.join(root, 'src/runner/dispatch/runtime-inspection.mjs')));
  assert.ok(seen.has(path.join(root, 'src/config/facade.mjs')));
});

test('RunObservation vocabulary derives phase, delivery, resourceState and workspace completeness from facts', () => {
  const root = fixture();
  assignment(root, 'asgn1');
  // 1. In-flight run with controller commands -> phase: bound, delivery: not-sent -> not-started, visibility: working while the supervisor holds the attempt lock -> live-proven (the same run with nobody holding it is ambiguous), no cwd -> workspace: unsupported
  const run1Dir = run(root, 'asgn1', '01', { runId: 'run1', delivery: 'not-sent' });
  const cmdFile = path.join(run1Dir, 'controller', 'commands', 'cmd1.json');
  fs.mkdirSync(path.dirname(cmdFile), { recursive: true });
  fs.writeFileSync(cmdFile, JSON.stringify({ state: 'pending' }));
  fs.writeFileSync(path.join(run1Dir, 'visibility.json'), JSON.stringify({ status: 'working', lastSeenAt: new Date().toISOString() }));
  admit(root, 'asgn1', 1, { runId: 'run1', attempt: 1 });

  const held = acquireSync(createLockScope('test-supervisor'), 'attempt', { runDir: path.dirname(path.dirname(run1Dir)), NN: '01' });
  assert.equal(held.result, 'acquired');
  let inspect1;
  try { inspect1 = inspectDispatchRuntime(root, { run: 'run1' }); } finally { held.handle.release(); }
  const obs1 = inspect1.runObservation;
  assert.equal(obs1.phase, 'bound');
  assert.equal(obs1.delivery, 'not-started');
  assert.equal(obs1.resourceState, 'live-proven');
  assert.equal(inspectDispatchRuntime(root, { run: 'run1' }).runObservation.resourceState, 'ambiguous', 'a fresh heartbeat alone proves nothing once nobody holds the attempt lock');
  assert.equal(obs1.evidenceCompleteness.resource, 'complete');
  assert.equal(obs1.evidenceCompleteness.workspace, 'unsupported');

  // 2. Settled run with cwd and workspace evidence, visibility: died -> dead-proven
  assignment(root, 'asgn2');
  const cwd = path.join(root, 'work');
  fs.mkdirSync(cwd, { recursive: true });
  const run2Dir = run(root, 'asgn2', '01', { runId: 'run2', cwd, delivery: 'delivered' }, v1('run2', 'asgn2'));
  fs.writeFileSync(path.join(run2Dir, 'visibility.json'), JSON.stringify({ status: 'died' }));
  fs.writeFileSync(path.join(run2Dir, 'workspace-evidence.json'), JSON.stringify({ dirt: 'clean' }));
  admit(root, 'asgn2', 1, { runId: 'run2', attempt: 1 });

  const inspect2 = inspectDispatchRuntime(root, { run: 'run2' });
  const obs2 = inspect2.runObservation;
  assert.equal(obs2.phase, 'settled');
  assert.equal(obs2.delivery, 'delivered');
  assert.equal(obs2.resourceState, 'dead-proven');
  assert.equal(obs2.evidenceCompleteness.resource, 'complete');
  assert.equal(obs2.evidenceCompleteness.workspace, 'complete');

  // 3. Visibility settling -> ambiguous (no adapter declares absence proof), evidence stale
  assignment(root, 'asgn3');
  const run3Dir = run(root, 'asgn3', '01', { runId: 'run3', status: 'launched', cwd });
  fs.writeFileSync(path.join(run3Dir, 'visibility.json'), JSON.stringify({ status: 'settling' }));
  admit(root, 'asgn3', 1, { runId: 'run3', attempt: 1 });

  const obs3 = inspectDispatchRuntime(root, { run: 'run3' }).runObservation;
  assert.equal(obs3.phase, 'launched');
  assert.equal(obs3.resourceState, 'ambiguous');
  assert.equal(obs3.evidenceCompleteness.resource, 'stale');
  assert.equal(obs3.evidenceCompleteness.workspace, 'unsupported');

  // 4. Real writer status: 'running' maps to admitted when no commands/launchedAt exist
  assignment(root, 'asgn4');
  const run4Dir = run(root, 'asgn4', '01', { runId: 'run4', status: 'running' });
  admit(root, 'asgn4', 1, { runId: 'run4', attempt: 1 });
  const obs4 = inspectDispatchRuntime(root, { run: 'run4' }).runObservation;
  assert.equal(obs4.phase, 'admitted');
  assert.equal(obs4.resourceState, 'unobserved');
  assert.equal(obs4.evidenceCompleteness.resource, 'missing');

  // 5. run.status === 'settled' WITHOUT valid result.json is unknown, never falsely settled
  assignment(root, 'asgn5');
  const run5Dir = run(root, 'asgn5', '01', { runId: 'run5', status: 'settled' });
  admit(root, 'asgn5', 1, { runId: 'run5', attempt: 1 });
  const obs5 = inspectDispatchRuntime(root, { run: 'run5' }).runObservation;
  assert.equal(obs5.phase, 'unknown');

  // 6. Stale visibility heartbeat (>60s) -> ambiguous, evidence stale
  assignment(root, 'asgn6');
  const run6Dir = run(root, 'asgn6', '01', { runId: 'run6', status: 'running' });
  fs.writeFileSync(path.join(run6Dir, 'visibility.json'), JSON.stringify({
    status: 'working',
    lastSeenAt: new Date(Date.now() - 120000).toISOString(),
  }));
  admit(root, 'asgn6', 1, { runId: 'run6', attempt: 1 });
  const obs6 = inspectDispatchRuntime(root, { run: 'run6' }).runObservation;
  assert.equal(obs6.resourceState, 'ambiguous');
  assert.equal(obs6.evidenceCompleteness.resource, 'stale');

  // 7. Corrupt result.json -> evidenceCompleteness.result is corrupt
  assignment(root, 'asgn7');
  const run7Dir = run(root, 'asgn7', '01', { runId: 'run7', status: 'settled' });
  fs.writeFileSync(path.join(run7Dir, 'result.json'), 'not-valid-json{');
  admit(root, 'asgn7', 1, { runId: 'run7', attempt: 1 });
  const obs7 = inspectDispatchRuntime(root, { run: 'run7' }).runObservation;
  assert.equal(obs7.phase, 'unknown');
  assert.equal(obs7.evidenceCompleteness.result, 'corrupt');
});

test('real fixture run with cwd strictly conforms to RunObservation closed vocabularies', () => {
  const root = fixture();
  assignment(root, 'asgn_real');
  const cwd = path.join(root, 'work_real');
  fs.mkdirSync(cwd, { recursive: true });
  // Real writer produces run.json with cwd, status: 'running', launchedAt
  run(root, 'asgn_real', '01', {
    runId: 'run_real_01',
    cwd,
    status: 'running',
    launchedAt: new Date().toISOString(),
  });
  admit(root, 'asgn_real', 1, { runId: 'run_real_01', attempt: 1 });

  const inspectRes = inspectDispatchRuntime(root, { run: 'run_real_01' });
  const obs = inspectRes.runObservation;
  assert.ok(obs, 'runObservation must be present');

  // Verify all closed vocabularies
  assert.ok(VALID_PHASES.has(obs.phase), `phase ${obs.phase} must be in VALID_PHASES`);
  assert.ok(VALID_RESOURCE_STATES.has(obs.resourceState), `resourceState ${obs.resourceState} must be in VALID_RESOURCE_STATES`);
  assert.ok(VALID_DELIVERIES.has(obs.delivery), `delivery ${obs.delivery} must be in VALID_DELIVERIES`);
  assert.ok(INSPECTION_STATUSES.has(obs.inspectionStatus), `inspectionStatus ${obs.inspectionStatus} must be in INSPECTION_STATUSES`);

  // Verify every dimension in evidenceCompleteness
  for (const [dim, val] of Object.entries(obs.evidenceCompleteness)) {
    assert.ok(VALID_COMPLETENESS.has(val), `evidenceCompleteness.${dim} value '${val}' must be in VALID_COMPLETENESS`);
  }
  assert.equal(obs.evidenceCompleteness.workspace, 'unsupported');
  assert.equal(obs.evidenceCompleteness.ownership, 'complete');

  // Verify unadmitted/conflicting ownership variations adhere to VALID_COMPLETENESS
  run(root, 'asgn_real', '02', { runId: 'run_unadmitted', cwd });
  const unadmittedObs = inspectDispatchRuntime(root, { run: 'run_unadmitted' }).runObservation;
  assert.ok(VALID_COMPLETENESS.has(unadmittedObs.evidenceCompleteness.ownership), 'ownership completeness must be in VALID_COMPLETENESS');
  assert.equal(unadmittedObs.evidenceCompleteness.ownership, 'missing');
});

test('inspecting a workspace reads each bound run result once, however many times the aggregate uses it', (t) => {
  const root = fixture(), work = path.join(root, 'work');
  fs.mkdirSync(path.join(work, '.git'), { recursive: true });
  fs.writeFileSync(path.join(work, '.git', 'commondir'), '.');
  for (const id of ['a', 'b', 'c']) {
    assignment(root, id);
    run(root, id, '01', { runId: `run-${id}`, cwd: work }, v1(`run-${id}`, id));
    admit(root, id, 1, { runId: `run-${id}`, attempt: 1 });
  }
  const reads = [];
  const original = fs.readFileSync;
  t.mock.method(fs, 'readFileSync', (file, ...rest) => {
    if (typeof file === 'string' && file.endsWith(`${path.sep}result.json`)) reads.push(file);
    return original.call(fs, file, ...rest);
  });
  const got = inspectDispatchRuntime(root, { cwd: work });
  assert.equal(got.observations[0].value.historicalRunIds.length, 3);
  assert.equal(reads.length, 3);
});

// The attention view: one project store, several worktrees, one row per run that needs a person.
function attentionFixture() {
  const root = fixture(), wt = (name) => { const d = path.join(root, name); fs.mkdirSync(d, { recursive: true }); fs.mkdirSync(path.join(d, '.git'), { recursive: true }); return d; };
  const one = wt('one'), two = wt('two');
  // The stored status and confidence must equal the projection of the classification, or the record reads as corrupt.
  const classified = (runId, assignmentId, status, confidence, classification) => ({ ...v2(runId, assignmentId), status, confidence, classification: { ...v2(runId, assignmentId).classification, ...classification } });
  const refused = (runId, assignmentId) => classified(runId, assignmentId, 'failed', 'reported', { assessment: { verdict: 'inconclusive' }, policy: { disposition: 'refuse', code: 'no-write' } });
  const add = (id, runId, cwd, startedAt, res, extra = {}) => { assignment(root, id); const dir = run(root, id, '01', { runId, cwd, startedAt, ...extra }, res); admit(root, id, 1, { runId, attempt: 1 }); return dir; };
  const settledAt = (runId, id, status, at) => {
    const base = status === 'done' ? v2(runId, id)
      : status === 'blocked' ? classified(runId, id, 'blocked', 'reported', { assessment: { verdict: 'blocked' }, confidence: { level: 'reported', basis: ['valid-agent-result-claim'] } })
        : classified(runId, id, 'failed', 'failed', { execution: { status: 'failed', exitCode: 1 }, confidence: { level: 'failed', basis: ['exit-nonzero'] }, failure: { family: 'unknown', code: 'worker-exit' } });
    return { ...base, settledAt: at };
  };
  add('a-fail', 'r-fail', one, '2026-11-17T08:00:00.000Z', settledAt('r-fail', 'a-fail', 'failed', '2026-11-17T08:05:00.000Z'));
  add('a-block', 'r-block', two, '2026-11-17T08:00:00.000Z', settledAt('r-block', 'a-block', 'blocked', '2026-11-17T08:06:00.000Z'));
  add('a-refuse', 'r-refuse', one, '2026-11-17T08:00:00.000Z', { ...refused('r-refuse', 'a-refuse'), settledAt: '2026-11-17T08:07:00.000Z' });
  const human = add('a-human', 'r-human', two, '2026-11-17T08:00:00.000Z', settledAt('r-human', 'a-human', 'failed', '2026-11-17T08:08:00.000Z'));
  fs.writeFileSync(path.join(human, 'receipt.json'), JSON.stringify({ outcome: 'abandoned-early', reason: 'terminal:needs-setup' }));
  add('a-pass', 'r-pass', one, '2026-11-17T08:00:00.000Z', settledAt('r-pass', 'a-pass', 'done', '2026-11-17T08:09:00.000Z'));
  // A failed first attempt followed by a passing fallback of the same seat is a measure, not an alert.
  add('u/seat/1', 'r-first', one, '2026-11-17T08:00:00.000Z', settledAt('r-first', 'u/seat/1', 'failed', '2026-11-17T08:10:00.000Z'));
  add('u/seat/1-fb1', 'r-fallback', one, '2026-11-17T08:11:00.000Z', settledAt('r-fallback', 'u/seat/1-fb1', 'done', '2026-11-17T08:12:00.000Z'));
  add('a-old', 'r-old', two, '2026-11-10T08:00:00.000Z', settledAt('r-old', 'a-old', 'failed', '2026-11-10T08:05:00.000Z'));
  // A round that ended with findings and the next round that passed: findings belong to the unit's outcome, no row.
  const findings = { ...classified('r-find', 'u2/producer/1', 'failed', 'reported', { assessment: { verdict: 'findings' } }), agentClaim: { summary: 'two broken links' }, settledAt: '2026-11-17T08:13:00.000Z' };
  add('u2/producer/1', 'r-find', one, '2026-11-17T08:12:00.000Z', findings);
  add('u2/producer/2', 'r-find-fixed', one, '2026-11-17T08:14:00.000Z', settledAt('r-find-fixed', 'u2/producer/2', 'done', '2026-11-17T08:15:00.000Z'));
  // No result and nobody holds its attempt lock: its controller died.
  add('a-live', 'r-live', one, '2026-11-17T08:00:00.000Z', null, { timeoutMs: 3600000, status: 'running' });
  return { root, one, two };
}
const NOW = () => '2026-11-17T10:00:00.000Z';
const kinds = (got) => Object.fromEntries(got.rows.map((r) => [r.runId, r.kind]));

test('attention lists failed, blocked, refused, needs-human and controller-dead runs of every worktree with a reason and a next command', () => {
  const { root, one, two } = attentionFixture();
  const got = attentionView(root, { since: '2026-11-17' }, { now: NOW });
  assert.deepEqual(kinds(got), { 'r-fail': 'failed', 'r-block': 'blocked', 'r-refuse': 'refused', 'r-human': 'needs-human', 'r-live': 'controller-dead' });
  assert.deepEqual([...new Set(got.rows.map((r) => r.worktree))].sort(), [fs.realpathSync(one), fs.realpathSync(two)].sort());
  for (const row of got.rows) { assert.ok(row.reason.length > 0); assert.equal(row.nextCommand, `fgos dispatch inspect --run ${row.runId}`); assert.equal(row.line, `${row.kind} ${row.runId} ${row.worktree} ${row.reason} -> ${row.nextCommand}`); }
  assert.deepEqual(got.lines, got.rows.map((r) => r.line));
  assert.equal(got.contract.id, 'attention-view');
});
test('attention leaves out a settled pass, a failure a later fallback passed, a round that ended with findings, and runs older than since (date-only bound included)', () => {
  const { root } = attentionFixture();
  const got = attentionView(root, { since: '2026-11-17' }, { now: NOW });
  for (const absent of ['r-pass', 'r-first', 'r-fallback', 'r-find', 'r-find-fixed', 'r-old']) assert.equal(kinds(got)[absent], undefined, absent);
  assert.equal(kinds(attentionView(root, { since: '2026-11-01T00:00:00Z' }, { now: NOW }))['r-old'], 'failed');
  assert.equal(kinds(attentionView(root, { since: '2026-11-17T08:07:00.000Z' }, { now: NOW }))['r-block'], undefined);
});
test('attention takes the next command from the unit view', () => {
  const { root } = attentionFixture();
  const got = attentionView(root, { since: '2026-11-17' }, { now: NOW, view: (runDir) => (runDir.includes('a-fail') ? { resumeCommand: 'fgos run --resume unit-x' } : {}) });
  assert.equal(got.rows.find((r) => r.runId === 'r-fail').nextCommand, 'fgos run --resume unit-x');
  assert.equal(got.idle.state, 'not-readable');
});
test('attention names an attempt whose controller died with its resume command, and drops it once a resume replaced it or its unit settled', () => {
  const { root } = attentionFixture();
  const awaiting = attentionView(root, { since: '2026-11-17' }, { now: NOW, view: (runDir) => (runDir.includes('a-live') ? { attemptState: 'unprobed', unitState: 'awaiting-resume', resumeCommand: 'fgos run --resume unit-y' } : {}) });
  const row = awaiting.rows.find((r) => r.runId === 'r-live');
  assert.equal(row.kind, 'controller-dead');
  assert.match(row.reason, /controller died/);
  assert.equal(row.nextCommand, 'fgos run --resume unit-y');
  for (const gone of [{ attemptState: 'superseded' }, { unitState: 'completed' }, { unitState: 'failed' }]) {
    assert.equal(kinds(attentionView(root, { since: '2026-11-17' }, { now: NOW, view: () => gone }))['r-live'], undefined, JSON.stringify(gone));
  }
});
test('attention names a live run past its declared timeout only while its supervisor holds the attempt lock', () => {
  const { root, one } = attentionFixture();
  const attempt = path.join(root, '.fgos', 'assignments', 'a-live', 'runs', '01');
  const late = fs.readFileSync(path.join(attempt, 'run.json'), 'utf8').replace('3600000', '60000');
  fs.writeFileSync(path.join(attempt, 'run.json'), late);
  assert.equal(kinds(attentionView(root, { since: '2026-11-17' }, { now: NOW }))['r-live'], 'controller-dead', 'no held lock: not a live run');
  const held = acquireSync(createLockScope('test-supervisor'), 'attempt', { runDir: path.join(root, '.fgos', 'assignments', 'a-live'), NN: '01' });
  assert.equal(held.result, 'acquired');
  try {
    const row = attentionView(root, { since: '2026-11-17' }, { now: NOW }).rows.find((r) => r.runId === 'r-live');
    assert.equal(row.kind, 'past-deadline');
    assert.match(row.reason, /declared timeout of 60s/);
    assert.equal(row.nextCommand, 'fgos dispatch watch r-live');
    assert.equal(row.worktree, fs.realpathSync(one));
    // Late now, though it started before the bound: a live row is timed at the observation.
    assert.equal(kinds(attentionView(root, { since: '2026-11-17T09:00:00Z' }, { now: NOW }))['r-live'], 'past-deadline');
    fs.writeFileSync(path.join(attempt, 'run.json'), late.replace('60000', '86400000'));
    assert.equal(kinds(attentionView(root, { since: '2026-11-17' }, { now: NOW }))['r-live'], undefined, 'held and within its timeout: no row');
  } finally { held.handle.release(); }
});
test('attention requires since and refuses another selector beside it', () => {
  assert.throws(() => validateInspectionSelector({ attention: true }), /--since/);
  for (const refused of ['yesterday', '2026-11-17T08:00', '2026-02-30', '2026-11-17 Z']) assert.throws(() => validateInspectionSelector({ attention: true, since: refused }), /--since/, refused);
  assert.doesNotThrow(() => validateInspectionSelector({ attention: true, since: '2026-11-17T08:00:00+07:00' }));
  assert.throws(() => validateInspectionSelector({ attention: true, since: '2026-11-17', run: 'r' }), /exactly one selector/);
  assert.throws(() => validateInspectionSelector({ run: 'r', since: '2026-11-17' }), /belongs to --attention/);
  assert.deepEqual(validateInspectionSelector({ attention: true, since: '2026-11-17' }), { kind: 'attention', id: '2026-11-17' });
});
test('attention through the use case reads the shared store from a linked worktree and writes nothing', () => {
  const { root } = attentionFixture();
  const main = path.join(root, 'main'), linked = path.join(root, 'linked');
  const git = (cwd, ...args) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.invalid', ...args], { cwd, stdio: 'pipe' });
  fs.mkdirSync(main); git(main, 'init', '-q'); git(main, 'commit', '-q', '--allow-empty', '-m', 'init'); git(main, 'worktree', 'add', '-q', linked);
  fs.renameSync(path.join(root, '.fgos'), path.join(main, '.fgos'));
  const terminalControl = { capabilities: () => ({ defaults: { allocationGraceMs: 60000 } }), reconcileScan: () => ({ result: 'scan', findings: [] }) };
  const listing = () => { const out = []; const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else out.push(`${f}:${fs.statSync(f).mtimeMs}:${fs.statSync(f).size}`); } }; walk(path.join(main, '.fgos')); return out.sort(); };
  const before = listing();
  const got = inspectDispatchUseCase({ repoRoot: linked }, { attention: true, since: '2026-11-17', terminalControl, globalConfigPath: path.join(root, 'no-global-config.json') });
  assert.deepEqual(Object.keys(kinds(got)).sort(), ['r-block', 'r-fail', 'r-human', 'r-live', 'r-refuse']);
  assert.match(got.terminal.state, /^(scanned|not-scanned)$/); // the scan itself is owned by the terminal-control client test
  assert.deepEqual(listing(), before);
  assert.throws(() => inspectDispatchUseCase({ repoRoot: linked }, { attention: true, terminalControl }), /--since/);
  assert.throws(() => inspectDispatchUseCase({ repoRoot: linked }, { attention: true, since: '2026-11-17', terminal: true, terminalControl }), /--attention cannot be combined with --terminal/);
  assert.throws(() => inspectDispatchUseCase({ repoRoot: linked }, { attention: true, since: '2026-11-17', providerCapacity: true }), /--attention cannot be combined with --provider-capacity/);
});
