import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { inspectDispatchRuntime, validateInspectionSelector } from '../../src/runner/dispatch/runtime-inspection.mjs';
import { invokeDispatchInspectOperation } from '../../src/verbs/dispatch/inspect.mjs';
import { normalizeRunResultV2 } from '../../src/runner/dispatch/run-result.mjs';

const fixture = () => fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-inspect-'));
function assignment(root, id) { const dir = path.join(root, '.fgos', 'assignments', id); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'assignment.json'), JSON.stringify({ assignmentId: id })); return dir; }
function run(root, id, attempt, value, result) { const dir = path.join(root, '.fgos', 'assignments', id, 'runs', attempt); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'run.json'), JSON.stringify({ assignmentId: id, ...value })); if (result) fs.writeFileSync(path.join(dir, 'result.json'), JSON.stringify(result)); return dir; }
function admit(root, id, epoch, value) { const dir = path.join(root, '.fgos', 'assignments', id, 'admission', 'generations'); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, `${String(epoch).padStart(10, '0')}.json`), JSON.stringify(value)); }
const v1 = (runId, assignmentId) => ({ runId, assignmentId, status: 'done', confidence: 'reported' });
const v2 = (runId, assignmentId) => normalizeRunResultV2({ runId, assignmentId, runtime: { exitCode: 0 }, agentClaim: { status: 'done', summary: 'ok' } });

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
test('public inspect use-case import graph cannot reach mutation/recovery/process/Git execution', () => {
  const root = path.resolve(new URL('../..', import.meta.url).pathname);
  const seen = new Set();
  // run-result.mjs: proven leaf (this test's own header comment on the
  // sibling reconciliation-import-graph test cites this exact carve-out).
  // global-config.mjs (Provider Capacity Rotator-era global/project config
  // awareness): `inspect.mjs` imports only its read-only `loadGlobalConfig`
  // (`fs.existsSync`+`fs.readFileSync`+`JSON.parse`, verified by direct
  // reading, never `mkdirSync`/`writeFileSync`) to build `runnerConfig` for
  // read-only inspection context -- but the same file also defines an
  // UNRELATED `writeGlobalConfig` export (`inspect.mjs` never imports or
  // calls it) that does call `mkdirSync`/`writeFileSync`. A whole-file text
  // scan cannot distinguish the two; proven safe by the same
  // read-the-actual-reachable-code standard every other entry here relies on.
  //
  // provider-capacity.mjs: `inspect.mjs` also directly imports
  // `inspectProviderCapacity` from it (doctor/inspect reporting) -- verified
  // by direct reading that export only ever calls `readState`/
  // `providerAccountInventory`/`isQuarantined` (pure reads of its own state
  // file), never the file's UNRELATED `isPidAlive` helper (`process.kill(pid,
  // 0)`, used only by `reclaimDeadLeases`/`rankProviderAccounts`, neither
  // reachable from `inspect.mjs`). Same identical-file, different-export
  // carve-out as the reconciliation-import-graph test's own proven leaf.
  const isProvenLeaf = (file) => file.endsWith('/run-result.mjs') || file.endsWith('/global-config.mjs') || file.endsWith('/provider-capacity.mjs');
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
  assert.ok(seen.has(path.join(root, 'src/config/global-config.mjs')));
});

test('RunObservation vocabulary derives phase, delivery, resourceState and workspace completeness from facts', () => {
  const root = fixture();
  assignment(root, 'asgn1');
  // 1. In-flight run with controller commands -> phase: bound, delivery: not-sent -> not-started, visibility: working with fresh heartbeat -> live-proven, no cwd -> workspace: unsupported
  const run1Dir = run(root, 'asgn1', '01', { runId: 'run1', delivery: 'not-sent' });
  const cmdFile = path.join(run1Dir, 'controller', 'commands', 'cmd1.json');
  fs.mkdirSync(path.dirname(cmdFile), { recursive: true });
  fs.writeFileSync(cmdFile, JSON.stringify({ state: 'pending' }));
  fs.writeFileSync(path.join(run1Dir, 'visibility.json'), JSON.stringify({ status: 'working', lastSeenAt: new Date().toISOString() }));
  admit(root, 'asgn1', 1, { runId: 'run1', attempt: 1 });

  const inspect1 = inspectDispatchRuntime(root, { run: 'run1' });
  const obs1 = inspect1.runObservation;
  assert.equal(obs1.phase, 'bound');
  assert.equal(obs1.delivery, 'not-started');
  assert.equal(obs1.resourceState, 'live-proven');
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

  // 3. Visibility settling -> ambiguous (no adapter declares absence proof), evidence incomplete
  assignment(root, 'asgn3');
  const run3Dir = run(root, 'asgn3', '01', { runId: 'run3', status: 'launched', cwd });
  fs.writeFileSync(path.join(run3Dir, 'visibility.json'), JSON.stringify({ status: 'settling' }));
  admit(root, 'asgn3', 1, { runId: 'run3', attempt: 1 });

  const obs3 = inspectDispatchRuntime(root, { run: 'run3' }).runObservation;
  assert.equal(obs3.phase, 'launched');
  assert.equal(obs3.resourceState, 'ambiguous');
  assert.equal(obs3.evidenceCompleteness.resource, 'incomplete');
  assert.equal(obs3.evidenceCompleteness.workspace, 'partial');

  // 4. Real writer status: 'running' maps to running when no commands/launchedAt exist
  assignment(root, 'asgn4');
  const run4Dir = run(root, 'asgn4', '01', { runId: 'run4', status: 'running' });
  admit(root, 'asgn4', 1, { runId: 'run4', attempt: 1 });
  const obs4 = inspectDispatchRuntime(root, { run: 'run4' }).runObservation;
  assert.equal(obs4.phase, 'running');
  assert.equal(obs4.resourceState, 'unobserved');
  assert.equal(obs4.evidenceCompleteness.resource, 'missing');

  // 5. run.status === 'settled' WITHOUT valid result.json is unknown, never falsely settled
  assignment(root, 'asgn5');
  const run5Dir = run(root, 'asgn5', '01', { runId: 'run5', status: 'settled' });
  admit(root, 'asgn5', 1, { runId: 'run5', attempt: 1 });
  const obs5 = inspectDispatchRuntime(root, { run: 'run5' }).runObservation;
  assert.equal(obs5.phase, 'unknown');

  // 6. Stale visibility heartbeat (>60s) -> ambiguous
  assignment(root, 'asgn6');
  const run6Dir = run(root, 'asgn6', '01', { runId: 'run6', status: 'running' });
  fs.writeFileSync(path.join(run6Dir, 'visibility.json'), JSON.stringify({
    status: 'working',
    lastSeenAt: new Date(Date.now() - 120000).toISOString(),
  }));
  admit(root, 'asgn6', 1, { runId: 'run6', attempt: 1 });
  const obs6 = inspectDispatchRuntime(root, { run: 'run6' }).runObservation;
  assert.equal(obs6.resourceState, 'ambiguous');
  assert.equal(obs6.evidenceCompleteness.resource, 'incomplete');
});
