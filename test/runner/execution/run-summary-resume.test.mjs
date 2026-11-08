// test/runner/execution/run-summary-resume.test.mjs — the fgos run door: unit summaries, settlement failures, write scope, resume refusals, commit-only resumes and the workspace persona

import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { nativeDoor } from '../../../src/native/door.mjs';
import { runUnitWithPort as runUnit } from '../../helpers/run-unit-with-port.mjs';
import { snapshotRunnerConfig } from '../../../src/runner/execution/run.mjs';
import { RunnerConfigError } from '../../../src/runner/dispatch/runner-config-error.mjs';
import { writeUnitSummary } from '../../../src/runner/execution/unit-summary.mjs';
import { seedFileLocalBwrapRegistry } from '../confinement-registry-fixture.helper.mjs';

// posture filtering consults the machine backend registry; keep it file-local
seedFileLocalBwrapRegistry();

import { holdLockInChild } from '../../helpers/hold-lock-in-child.mjs';
import { writeProjectConfig, readProjectConfig } from '../../helpers/config-fixture.mjs';
import { setupGitRepo, reviewedConfig, recordedUnitFixture, writeScopedWorker, gitIn, headOf, producerSpawns } from '../../helpers/run-unit-repo-fixture.mjs';

test('unit summaries cover refusal, thrown execution and resume without duplicating settled seats', async (t) => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  t.after(() => fs.rmSync(worktreeDir, { recursive: true, force: true }));
  const unitData = { id: 'summary-doors', capability: 'unserved:answer', objective: 'Answer question', writes: [] };
  const refused = await runUnit({ unitData, repoRoot, cwd: worktreeDir });
  const dir = path.join(repoRoot, '.fgos', 'assignments', refused.unitRunId);
  const readSummary = () => JSON.parse(fs.readFileSync(path.join(dir, 'unit-summary.json'), 'utf8'));
  assert.equal(refused.outcome, 'policy-refusal');
  assert.equal(readSummary().outcome, 'policy-refusal');
  assert.deepEqual(readSummary().seats, []);
  assert.equal(readSummary().workflow, null);
  // An unknown pattern now refuses before admission: the run is refused before any unit directory exists.
  await assert.rejects(
    runUnit({ unitData, repoRoot, cwd: worktreeDir, pattern: 'nonexistent-pattern' }),
    (err) => err instanceof RunnerConfigError && /not in the catalog/.test(err.message),
  );
  assert.deepEqual(fs.readdirSync(path.dirname(dir)), [refused.unitRunId]);
  // A thrown execution after admission publishes a summary with outcome execution-failure.
  reviewedConfig(repoRoot, ['alpha']);
  const failure = new Error('the producer attempt could not be prepared');
  const mkdir = fs.mkdirSync;
  const mockedMkdir = t.mock.method(fs, 'mkdirSync', (target, ...args) => {
    if (typeof target === 'string' && target.includes(`${path.sep}producer${path.sep}`)) throw failure;
    return mkdir(target, ...args);
  });
  const thrownUnitData = { id: 'summary-thrown', capability: 'docs:write', objective: 'Write docs', writes: [] };
  await assert.rejects(
    runUnit({ unitData: thrownUnitData, repoRoot, cwd: worktreeDir }),
    (err) => err === failure,
  );
  mockedMkdir.mock.restore();
  const thrownDir = fs.readdirSync(path.dirname(dir)).find((id) => id !== refused.unitRunId);
  assert.ok(thrownDir);
  const thrownSummary = JSON.parse(fs.readFileSync(path.join(path.dirname(dir), thrownDir, 'unit-summary.json'), 'utf8'));
  assert.equal(thrownSummary.outcome, 'execution-failure');
  assert.equal(thrownSummary.workflow, null);
  // A resumed solo uses settled history and never launches the unavailable executor.
  const runDir = path.join(dir, 'producer', '1', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({
    runId: 'synthetic-resumed-run', settledAt: '2026-10-05T01:00:00Z',
    classification: { outcome: { category: 'ok' } },
  }));
  const resumed = await runUnit({ resumeUnitRunId: refused.unitRunId, repoRoot, cwd: worktreeDir });
  assert.equal(resumed.outcome, 'pass');
  assert.equal(readSummary().seats.length, 1);
  assert.equal(readSummary().seats[0].attempts.length, 1);
  assert.equal(readSummary().seats[0].final.runId, 'synthetic-resumed-run');
});

test('summary I/O failure leaves a successful resumed execution successful and authoritative', async (t) => {
  const fixture = recordedUnitFixture(t);
  const runDir = path.join(fixture.unitDir, 'producer', '1', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({
    runId: 'settled-producer', settledAt: '2026-10-05T01:01:00Z', classification: { outcome: { category: 'ok' } },
  }));
  fs.mkdirSync(path.join(fixture.unitDir, 'unit-summary.json'));
  const warning = t.mock.method(console, 'warn', () => {});
  const resumed = await runUnit({ repoRoot: fixture.repoRoot, cwd: fixture.worktreeDir,
    resumeUnitRunId: fixture.unitRunId });
  assert.equal(resumed.outcome, 'pass');
  assert.equal(fixture.readRecord().settlement.outcome, 'pass');
  assert.ok(fixture.readRecord().settlement.settledAt);
  assert.equal(warning.mock.callCount(), 1);
});

test('a reopened unit cannot retain its prior terminal summary when republishing fails', async (t) => {
  const fixture = recordedUnitFixture(t);
  fixture.record.settlement = { outcome: 'policy-refusal', settledAt: '2026-10-05T01:01:00Z' };
  fs.writeFileSync(path.join(fixture.unitDir, 'unit.json'), JSON.stringify(fixture.record));
  writeUnitSummary(fixture.unitDir);
  assert.equal(fixture.readSummary().outcome, 'policy-refusal');
  const runDir = path.join(fixture.unitDir, 'producer', '1', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({
    runId: 'settled-producer', settledAt: '2026-10-05T01:02:00Z', classification: { outcome: { category: 'ok' } },
  }));
  const summaryFile = path.join(fixture.unitDir, 'unit-summary.json');
  const replace = nativeDoor().durableFile.replaceDurably;
  t.mock.method(nativeDoor().durableFile, 'replaceDurably', (dir, name, ...rest) => {
    if (path.join(dir, name) === summaryFile) throw new Error('summary storage unavailable');
    return replace(dir, name, ...rest);
  });
  t.mock.method(console, 'warn', () => {});
  const resumed = await runUnit({ repoRoot: fixture.repoRoot, cwd: fixture.worktreeDir,
    resumeUnitRunId: fixture.unitRunId });
  assert.equal(resumed.outcome, 'pass');
  assert.equal(fixture.readRecord().settlement.outcome, 'pass');
  assert.equal(fs.existsSync(summaryFile), false);
});

test('failed invalidation leaves the prior settled unit and published artifact authoritative', async (t) => {
  const fixture = recordedUnitFixture(t);
  fixture.record.settlement = { outcome: 'policy-refusal', settledAt: '2026-10-05T01:01:00Z' };
  const unitFile = path.join(fixture.unitDir, 'unit.json');
  fs.writeFileSync(unitFile, JSON.stringify(fixture.record));
  writeUnitSummary(fixture.unitDir);
  const summaryFile = path.join(fixture.unitDir, 'unit-summary.json');
  const beforeUnit = fs.readFileSync(unitFile, 'utf8');
  const beforeSummary = fs.readFileSync(summaryFile, 'utf8');
  const unlink = fs.unlinkSync;
  t.mock.method(fs, 'unlinkSync', (file) => {
    if (file === summaryFile) throw Object.assign(new Error('directory is read-only'), { code: 'EACCES' });
    return unlink(file);
  });
  await assert.rejects(runUnit({ repoRoot: fixture.repoRoot, cwd: fixture.worktreeDir,
    resumeUnitRunId: fixture.unitRunId }), RunnerConfigError);
  assert.equal(fs.readFileSync(unitFile, 'utf8'), beforeUnit);
  assert.equal(fs.readFileSync(summaryFile, 'utf8'), beforeSummary);
});

test('summary I/O failure cannot replace the original execution error', async (t) => {
  const fixture = recordedUnitFixture(t);
  reviewedConfig(fixture.repoRoot, ['alpha']);
  fixture.record.unit.capability = 'docs:write';
  fixture.record.configSnapshot = snapshotRunnerConfig(fixture.repoRoot);
  fs.writeFileSync(path.join(fixture.unitDir, 'unit.json'), JSON.stringify(fixture.record));
  fs.mkdirSync(path.join(fixture.unitDir, 'unit-summary.json'));
  // The producer seat fails before it launches.
  const failure = new Error('the producer attempt could not be prepared');
  const producerDir = path.join(fixture.unitDir, 'producer');
  const mkdir = fs.mkdirSync;
  t.mock.method(fs, 'mkdirSync', (dir, ...args) => {
    if (typeof dir === 'string' && (dir === producerDir || dir.startsWith(producerDir + path.sep))) throw failure;
    return mkdir(dir, ...args);
  });
  const warning = t.mock.method(console, 'warn', () => {});
  await assert.rejects(runUnit({ repoRoot: fixture.repoRoot, cwd: fixture.worktreeDir,
    resumeUnitRunId: fixture.unitRunId }),
  (error) => {
    assert.equal(error, failure);
    return true;
  });
  assert.equal(fixture.readRecord().settlement.outcome, 'execution-failure');
  assert.equal(warning.mock.callCount(), 1);
});

test('resume refuses supplied stance options without altering the stored question or publishing a summary', async (t) => {
  const fixture = recordedUnitFixture(t);
  const before = fs.readFileSync(path.join(fixture.unitDir, 'unit.json'), 'utf8');
  for (const stanceOptions of [['a', 'b'], ['changed'], [], null]) {
    await assert.rejects(runUnit({ repoRoot: fixture.repoRoot, cwd: fixture.worktreeDir,
      resumeUnitRunId: fixture.unitRunId, stanceOptions }), RunnerConfigError);
    assert.equal(fs.readFileSync(path.join(fixture.unitDir, 'unit.json'), 'utf8'), before);
    assert.equal(fs.existsSync(path.join(fixture.unitDir, 'unit-summary.json')), false);
  }
});

test('a reviewed execution error publishes its summary only after the dispatched sibling result exists', async (t) => {
  const fixture = recordedUnitFixture(t, 'rfc');
  reviewedConfig(fixture.repoRoot, ['alpha', 'beta']);
  fixture.record.unit.capability = 'docs:write';
  fixture.record.configSnapshot = snapshotRunnerConfig(fixture.repoRoot);
  fixture.record.bindings = {
    'producer/1': [{ role: 'producer', round: 1, binding: { executor: 'alpha' } }],
  };
  fs.writeFileSync(path.join(fixture.unitDir, 'unit.json'), JSON.stringify(fixture.record));
  const producerDir = path.join(fixture.unitDir, 'producer', '1', 'runs', '01');
  fs.mkdirSync(producerDir, { recursive: true });
  const reportFile = path.join(producerDir, 'report-1.md');
  fs.writeFileSync(reportFile, '# Producer report\nThe requested source evidence was inspected and the proposed change was documented.\n');
  fs.writeFileSync(path.join(producerDir, 'result.json'), JSON.stringify({
    runId: 'prior-producer', settledAt: '2026-10-05T01:01:00Z', executorId: 'alpha',
    evidence: { artifacts: [path.relative(fixture.repoRoot, reportFile)] },
    classification: { outcome: { category: 'ok' } },
  }));
  // The reviewer seat fails before it launches; its sibling still runs to a result.
  const failure = new Error('the reviewer attempt could not be prepared');
  const reviewerDir = path.join(fixture.unitDir, 'reviewer');
  const mkdir = fs.mkdirSync;
  t.mock.method(fs, 'mkdirSync', (dir, ...args) => {
    if (typeof dir === 'string' && (dir === reviewerDir || dir.startsWith(reviewerDir + path.sep))) throw failure;
    return mkdir(dir, ...args);
  });
  await assert.rejects(runUnit({ repoRoot: fixture.repoRoot, cwd: fixture.worktreeDir,
    resumeUnitRunId: fixture.unitRunId }), (error) => error === failure);
  const summary = fixture.readSummary();
  assert.equal(summary.outcome, 'execution-failure');
  const sibling = summary.seats.find((seat) => seat.seat === 'red-team');
  assert.ok(sibling?.final.runId);
  assert.equal(sibling.final.outcome, 'pass');
  assert.equal(sibling.kind, 'checker');
  assert.equal(fixture.readRecord().settlement.outcome, 'execution-failure');
});

test('a failed settlement write never replaces the execution error that caused it', async (t) => {
  const fixture = recordedUnitFixture(t, 'solo');
  reviewedConfig(fixture.repoRoot, ['alpha']);
  fixture.record.unit.capability = 'docs:write';
  fixture.record.configSnapshot = snapshotRunnerConfig(fixture.repoRoot);
  fs.writeFileSync(path.join(fixture.unitDir, 'unit.json'), JSON.stringify(fixture.record));
  const unitFile = path.join(fixture.unitDir, 'unit.json');
  const replace = nativeDoor().durableFile.replaceDurably;
  const failure = new Error('the producer attempt could not be prepared');
  const producerDir = path.join(fixture.unitDir, 'producer');
  const mkdir = fs.mkdirSync;
  t.mock.method(fs, 'mkdirSync', (dir, ...args) => {
    if (typeof dir === 'string' && (dir === producerDir || dir.startsWith(producerDir + path.sep))) throw failure;
    return mkdir(dir, ...args);
  });
  t.mock.method(nativeDoor().durableFile, 'replaceDurably', (dir, name, bytes, ...rest) => {
    // Only the settlement record fails to land; the earlier running-state writes succeed.
    if (path.join(dir, name) === unitFile && JSON.parse(Buffer.from(bytes).toString('utf8')).execution?.status === 'settled') {
      throw Object.assign(new Error('unit record storage unavailable'), { code: 'EIO' });
    }
    return replace(dir, name, bytes, ...rest);
  });
  const warning = t.mock.method(console, 'warn', () => {});
  await assert.rejects(runUnit({ repoRoot: fixture.repoRoot, cwd: fixture.worktreeDir,
    resumeUnitRunId: fixture.unitRunId }),
  (error) => error === failure);
  assert.equal(warning.mock.callCount(), 1);
  assert.match(warning.mock.calls[0].arguments[0], /could not record the failed settlement.*unit record storage unavailable/);
  assert.equal(fixture.readRecord().execution.status, 'running', 'the record keeps the last state that was written');
  assert.equal(fixture.readRecord().settlement, undefined);
  assert.deepEqual(fs.readdirSync(fixture.unitDir).filter((name) => name.endsWith('.tmp')), [], 'no partial record is left behind');
});

function setGeneratedPaths(repoRoot, generatedPaths) {
  const config = readProjectConfig(repoRoot);
  config.runner.generatedPaths = generatedPaths;
  writeProjectConfig(repoRoot, config);
}

const SKILL_RENDERS = [{ from: 'core/skills/**', also: ['.agents/skills/**', 'plugins/fgOS/skills/**'] }];

test('runUnit records the write scope widened by generatedPaths and hands it to the assignment', async (t) => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  t.after(() => fs.rmSync(worktreeDir, { recursive: true, force: true }));
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  setGeneratedPaths(repoRoot, SKILL_RENDERS);
  const res = await runUnit({
    unitData: { id: 'u-skill', objective: 'Edit a skill', capability: 'docs:write', writes: ['./core/skills/x/SKILL.md', 'docs/'] },
    repoRoot, cwd: worktreeDir, pattern: 'solo',
  });
  const unitDir = path.join(repoRoot, '.fgos', 'assignments', res.unitRunId);
  const record = JSON.parse(fs.readFileSync(path.join(unitDir, 'unit.json'), 'utf8'));
  const expected = ['core/skills/x/SKILL.md', 'docs', '.agents/skills/**', 'plugins/fgOS/skills/**'];
  assert.deepEqual(record.unit.writes, ['core/skills/x/SKILL.md', 'docs']);
  assert.deepEqual(record.writeScope, expected);
  const assignment = JSON.parse(fs.readFileSync(path.join(unitDir, 'producer', '1', 'assignment.json'), 'utf8'));
  assert.deepEqual(assignment.writes, expected);
});

test('a resumed unit keeps its recorded write scope even after generatedPaths changes', async (t) => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  t.after(() => fs.rmSync(worktreeDir, { recursive: true, force: true }));
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  setGeneratedPaths(repoRoot, SKILL_RENDERS);
  const unitData = { id: 'u-resume-scope', objective: 'Edit a skill', capability: 'unserved:answer', writes: ['core/skills/y.md'] };
  const first = await runUnit({ unitData, repoRoot, cwd: worktreeDir });
  const unitJson = path.join(repoRoot, '.fgos', 'assignments', first.unitRunId, 'unit.json');
  const expected = ['core/skills/y.md', '.agents/skills/**', 'plugins/fgOS/skills/**'];
  assert.deepEqual(JSON.parse(fs.readFileSync(unitJson, 'utf8')).writeScope, expected);
  setGeneratedPaths(repoRoot, []);
  await runUnit({ resumeUnitRunId: first.unitRunId, repoRoot, cwd: worktreeDir });
  assert.deepEqual(JSON.parse(fs.readFileSync(unitJson, 'utf8')).writeScope, expected);
});

test('a resumed unit recorded before write scopes existed hands its own writes to the assignment', async (t) => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  t.after(() => fs.rmSync(worktreeDir, { recursive: true, force: true }));
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  setGeneratedPaths(repoRoot, SKILL_RENDERS);
  const first = await runUnit({
    unitData: { id: 'u-old-record', objective: 'Edit a skill', capability: 'docs:write', writes: ['core/skills/z.md'] },
    repoRoot, cwd: worktreeDir, pattern: 'solo',
  });
  const unitDir = path.join(repoRoot, '.fgos', 'assignments', first.unitRunId);
  const unitJson = path.join(unitDir, 'unit.json');
  const record = JSON.parse(fs.readFileSync(unitJson, 'utf8'));
  delete record.writeScope;
  delete record.settlement;
  record.execution = { status: 'running' };
  fs.writeFileSync(unitJson, JSON.stringify(record, null, 2));
  fs.rmSync(path.join(unitDir, 'producer'), { recursive: true, force: true });
  await runUnit({ resumeUnitRunId: first.unitRunId, repoRoot, cwd: worktreeDir });
  // A producer that did not pass is bound again as a new attempt, so the assignment is the last attempt's.
  const attempts = JSON.parse(fs.readFileSync(unitJson, 'utf8')).bindings['producer/1'];
  const lastDir = attempts.length === 1 ? '1' : `1-fb${attempts.length - 1}`;
  const assignment = JSON.parse(fs.readFileSync(path.join(unitDir, 'producer', lastDir, 'assignment.json'), 'utf8'));
  assert.deepEqual(assignment.writes, ['core/skills/z.md']);
  assert.equal(JSON.parse(fs.readFileSync(unitJson, 'utf8')).writeScope, undefined);
});

test('a resumed writing seat whose recorded attempt has no native baseline is refused by name, not thrown', async (t) => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  t.after(() => fs.rmSync(worktreeDir, { recursive: true, force: true }));
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  const first = await runUnit({
    unitData: { id: 'u-no-baseline', objective: 'Edit a doc', capability: 'docs:write', writes: ['docs/x.md'] },
    repoRoot, cwd: worktreeDir, pattern: 'solo',
  });
  const unitJson = path.join(repoRoot, '.fgos', 'assignments', first.unitRunId, 'unit.json');
  const record = JSON.parse(fs.readFileSync(unitJson, 'utf8'));
  const attempts = record.bindings['producer/1'];
  assert.ok(attempts?.length > 0, 'the first run recorded a binding');
  for (const attempt of attempts) delete attempt.nativeBaseline;
  fs.writeFileSync(unitJson, JSON.stringify(record, null, 2));
  const resumed = await runUnit({ resumeUnitRunId: first.unitRunId, repoRoot, cwd: worktreeDir });
  assert.equal(resumed.outcome, 'policy-refusal');
  const refusal = resumed.results.at(-1);
  assert.equal(refusal.role, 'producer');
  assert.equal(refusal.refused.reason, 'native-baseline-missing');
});

test('a resumed unit keeps the run timeout it started with; an override passed to the resume does not change it', async (t) => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  t.after(() => fs.rmSync(worktreeDir, { recursive: true, force: true }));
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  const first = await runUnit({
    unitData: { id: 'u-resume-timeout', objective: 'Read the docs', capability: 'docs:write', writes: [] },
    overrides: [{ origin: 'human-cli', timeoutMs: 5400000 }],
    repoRoot, cwd: worktreeDir, pattern: 'solo',
  });
  const unitDir = path.join(repoRoot, '.fgos', 'assignments', first.unitRunId);
  const unitJson = path.join(unitDir, 'unit.json');
  const record = JSON.parse(fs.readFileSync(unitJson, 'utf8'));
  // As if the run died mid-round: the binding stays recorded, the round's output is gone.
  delete record.settlement;
  record.execution = { status: 'running' };
  for (const attempt of record.bindings['producer/1']) delete attempt.outcome;
  fs.writeFileSync(unitJson, JSON.stringify(record, null, 2));
  fs.rmSync(path.join(unitDir, 'producer'), { recursive: true, force: true });
  await runUnit({ resumeUnitRunId: first.unitRunId, overrides: [{ origin: 'human-cli', timeoutMs: 120000 }], repoRoot, cwd: worktreeDir });
  const runJson = JSON.parse(fs.readFileSync(path.join(unitDir, 'producer', '1', 'runs', '01', 'run.json'), 'utf8'));
  assert.equal(runJson.timeoutMs, 5400000);
  assert.deepEqual(JSON.parse(fs.readFileSync(unitJson, 'utf8')).overrides, [{ origin: 'human-cli', timeoutMs: 5400000 }]);
});

test('a resume is refused while a live process holds the dispatch lock of the unit worktree, and proceeds once that holder is dead', async (t) => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  t.after(() => fs.rmSync(worktreeDir, { recursive: true, force: true }));
  const unitData = { id: 'resume-lock', capability: 'unserved:answer', objective: 'Answer question', writes: [] };
  const refused = await runUnit({ unitData, repoRoot, cwd: worktreeDir, worktree: worktreeDir });
  assert.equal(refused.outcome, 'policy-refusal');
  const runDir = path.join(repoRoot, '.fgos', 'assignments', refused.unitRunId, 'producer', '1', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({
    runId: 'synthetic-resumed-run', settledAt: '2026-10-05T01:00:00Z',
    classification: { outcome: { category: 'ok' } },
  }));
  const resume = () => runUnit({ resumeUnitRunId: refused.unitRunId, repoRoot, cwd: worktreeDir, worktree: worktreeDir });

  // A mutating dispatch in another process holds the worktree's dispatch-cwd lock while its worker runs.
  const { child, exited } = await holdLockInChild('dispatch-cwd', { fgosDir: path.join(repoRoot, '.fgos'), cwd: worktreeDir });
  try {
    await assert.rejects(resume, { name: 'DispatchError', code: 'dispatch-in-flight', holderPid: child.pid, cwd: worktreeDir });
  } finally {
    child.kill('SIGKILL');
    await exited;
  }
  assert.equal((await resume()).outcome, 'pass');
});

const unitRecordOf = (repoRoot, unitRunId) => JSON.parse(fs.readFileSync(path.join(repoRoot, '.fgos', 'assignments', unitRunId, 'unit.json'), 'utf8'));

async function waitForFile(file, ms = 20000) {
  const until = Date.now() + ms;
  while (!fs.existsSync(file)) {
    if (Date.now() > until) throw new Error(`timed out waiting for ${file}`);
    await new Promise((r) => setTimeout(r, 50));
  }
}

test('a mutating unit with a foreign staged index is refused before any producer is spawned', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  writeScopedWorker(repoRoot, { files: { 'docs/a.md': 'a\n' } });
  fs.writeFileSync(path.join(worktreeDir, 'staged.txt'), 's\n');
  gitIn(worktreeDir, 'add', 'staged.txt');
  const res = await runUnit({
    unitData: { id: 'u-foreign', objective: 'Write docs', capability: 'docs:write', writes: ['docs'] },
    repoRoot, cwd: worktreeDir, pattern: 'solo',
  });
  assert.equal(res.outcome, 'policy-refusal');
  assert.equal(res.results[0].refused.reason, 'foreign-staged-index');
  assert.deepEqual(res.results[0].refused.paths, ['staged.txt']);
  assert.match(res.results[0].refused.detail, /staged\.txt/);
  assert.equal(producerSpawns(repoRoot, res.unitRunId), 0, 'the worker never ran');
  assert.equal(fs.existsSync(path.join(worktreeDir, 'docs', 'a.md')), false);
  assert.equal(gitIn(worktreeDir, 'diff', '--cached', '--name-only').trim(), 'staged.txt', 'the index is left as it was');
});

test('a file dirty in scope before launch is not committed and is recorded as preExistingInScope', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  writeScopedWorker(repoRoot, { files: { 'docs/new.md': 'n\n' } });
  fs.mkdirSync(path.join(worktreeDir, 'docs'));
  fs.writeFileSync(path.join(worktreeDir, 'docs', 'wip.md'), 'a person is half way through this\n');
  const res = await runUnit({
    unitData: { id: 'u-wip', objective: 'Write docs', capability: 'docs:write', writes: ['docs'] },
    repoRoot, cwd: worktreeDir, pattern: 'solo',
  });
  assert.equal(res.outcome, 'pass');
  const commit = res.results[0].commit;
  assert.equal(commit.status, 'committed');
  assert.deepEqual(commit.files, ['docs/new.md']);
  assert.deepEqual(commit.preExistingInScope, ['docs/wip.md']);
  assert.match(gitIn(worktreeDir, 'status', '--porcelain', '--untracked-files=all'), /\?\? docs\/wip\.md/);
  const attempt = unitRecordOf(repoRoot, res.unitRunId).bindings['producer/1'][0];
  assert.deepEqual(attempt.preExistingInScope, ['docs/wip.md']);
  assert.deepEqual(attempt.commit.preExistingInScope, ['docs/wip.md']);
});

test('a producer writing in and out of scope gets only the in-scope file committed and still passes', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  writeScopedWorker(repoRoot, { files: { 'docs/in.md': 'i\n', 'src/out.txt': 'o\n' }, summary: 'feat(docs): add the page' });
  const res = await runUnit({
    unitData: { id: 'u-scope', objective: 'Write docs', capability: 'docs:write', writes: ['docs'] },
    repoRoot, cwd: worktreeDir, pattern: 'solo',
  });
  assert.equal(res.outcome, 'pass');
  const commit = res.results[0].commit;
  assert.deepEqual(commit.files, ['docs/in.md']);
  assert.deepEqual(commit.outOfScope, ['src/out.txt']);
  assert.equal(commit.subject, 'feat(docs): add the page');
  assert.equal(gitIn(worktreeDir, 'show', '--name-only', '--format=', 'HEAD').trim(), 'docs/in.md');
  assert.deepEqual(unitRecordOf(repoRoot, res.unitRunId).bindings['producer/1'][0].commit.outOfScope, ['src/out.txt']);
});

test('resume after a foreign index appeared mid-round only commits: the producer is not spawned again', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  writeScopedWorker(repoRoot, { files: { 'docs/in.md': 'i\n' }, waitFor: '.go' });
  const unitData = { id: 'u-midround', objective: 'Write docs', capability: 'docs:write', writes: ['docs'] };
  const running = runUnit({ unitData, repoRoot, cwd: worktreeDir, pattern: 'solo' });
  await waitForFile(path.join(worktreeDir, '.started'));
  fs.writeFileSync(path.join(worktreeDir, 'foreign.txt'), 'f\n');
  gitIn(worktreeDir, 'add', 'foreign.txt');
  fs.writeFileSync(path.join(worktreeDir, '.go'), '');
  const first = await running;
  assert.equal(first.outcome, 'execution-failure');
  assert.equal(first.results[0].commit.reason, 'foreign-staged-index');
  assert.equal(producerSpawns(repoRoot, first.unitRunId), 1);
  const before = headOf(worktreeDir);

  gitIn(worktreeDir, 'reset', '-q', 'foreign.txt');
  const resumed = await runUnit({ resumeUnitRunId: first.unitRunId, repoRoot, cwd: worktreeDir });
  assert.equal(resumed.outcome, 'pass');
  assert.equal(producerSpawns(repoRoot, first.unitRunId), 1, 'resume committed without spawning the producer again');
  assert.equal(resumed.results[0].commit.status, 'committed');
  assert.deepEqual(resumed.results[0].commit.files, ['docs/in.md']);
  assert.notEqual(headOf(worktreeDir), before);
  const record = unitRecordOf(repoRoot, first.unitRunId);
  assert.equal(record.bindings['producer/1'].length, 1);
  assert.equal(record.bindings['producer/1'][0].commit.status, 'committed');
  assert.equal(record.bindings['producer/1'][0].outcome, 'pass');
  assert.equal(record.settlement.outcome, 'pass');
});

test('resume after committed-set-mismatch refuses while the commit is on the branch', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  writeScopedWorker(repoRoot, { files: { 'docs/in.md': 'i\n' } });
  const hooks = path.join(repoRoot, 'test-hooks');
  fs.mkdirSync(hooks);
  fs.writeFileSync(path.join(hooks, 'pre-commit'), '#!/bin/sh\necho sneaky > sneaky.txt\ngit add sneaky.txt\n', { mode: 0o755 });
  gitIn(repoRoot, 'config', 'core.hooksPath', hooks);
  const first = await runUnit({
    unitData: { id: 'u-hooked', objective: 'Write docs', capability: 'docs:write', writes: ['docs'] },
    repoRoot, cwd: worktreeDir, pattern: 'solo',
  });
  assert.equal(first.outcome, 'execution-failure');
  const commit = first.results[0].commit;
  assert.equal(commit.reason, 'committed-set-mismatch');
  assert.equal(commit.sha, headOf(worktreeDir));

  await assert.rejects(
    () => runUnit({ resumeUnitRunId: first.unitRunId, repoRoot, cwd: worktreeDir }),
    (error) => error instanceof RunnerConfigError
      && error.message.includes(commit.sha)
      && /sneaky\.txt/.test(error.message)
      && /outside the scope/.test(error.message),
  );
  assert.equal(producerSpawns(repoRoot, first.unitRunId), 1);

  // Once a person takes that commit off the branch (keeping its files), resume commits again.
  gitIn(repoRoot, 'config', '--unset', 'core.hooksPath');
  gitIn(worktreeDir, 'reset', '-q', 'HEAD~1');
  fs.rmSync(path.join(worktreeDir, 'sneaky.txt'));
  const resumed = await runUnit({ resumeUnitRunId: first.unitRunId, repoRoot, cwd: worktreeDir });
  assert.equal(resumed.outcome, 'pass');
  assert.deepEqual(resumed.results[0].commit.files, ['docs/in.md']);
  assert.equal(producerSpawns(repoRoot, first.unitRunId), 1, 'still no second spawn');
});

test('a commit-only resume whose in-scope work is gone fails as work-missing instead of passing empty', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  writeScopedWorker(repoRoot, { files: { 'docs/in.md': 'i\n' }, waitFor: '.go' });
  const running = runUnit({ unitData: { id: 'u-gone', objective: 'Write docs', capability: 'docs:write', writes: ['docs'] }, repoRoot, cwd: worktreeDir, pattern: 'solo' });
  await waitForFile(path.join(worktreeDir, '.started'));
  fs.writeFileSync(path.join(worktreeDir, 'foreign.txt'), 'f\n');
  gitIn(worktreeDir, 'add', 'foreign.txt');
  fs.writeFileSync(path.join(worktreeDir, '.go'), '');
  const first = await running;
  assert.equal(first.results[0].commit.reason, 'foreign-staged-index');

  // The person clears the index and, with it, the agent's file.
  gitIn(worktreeDir, 'reset', '-q', 'foreign.txt');
  fs.rmSync(path.join(worktreeDir, 'docs'), { recursive: true, force: true });
  const resumed = await runUnit({ resumeUnitRunId: first.unitRunId, repoRoot, cwd: worktreeDir });
  assert.equal(resumed.outcome, 'execution-failure');
  assert.equal(resumed.results[0].commit.status, 'failed');
  assert.equal(resumed.results[0].commit.reason, 'work-missing');
  assert.deepEqual(resumed.results[0].commit.missing, ['docs/in.md']);
  assert.equal(producerSpawns(repoRoot, first.unitRunId), 1);
});

test('a unit persona defined in the workspace tier reaches the prompt as text pinned when the unit run starts', async (t) => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  t.after(() => fs.rmSync(worktreeDir, { recursive: true, force: true }));
  const personaText = [
    'name: ledger-keeper',
    'version: 0.1.0',
    'description: Keeps the ledger straight for {objective}',
    'role: Producer',
    'persona:',
    '  voice: Plain ledger voice',
    '  style: Numbers first',
    '  archetype: A careful bookkeeper',
    'decision_boundary:',
    '  can_decide:',
    '    - How to order the entries',
    '  must_escalate:',
    '    - Anything that moves money',
    '',
  ].join('\n');
  fs.mkdirSync(path.join(repoRoot, 'fgos', 'agents'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'fgos', 'agents', 'ledger-keeper.yaml'), personaText);
  const res = await runUnit({
    unitData: { id: 'u-persona', objective: 'Write docs', capability: 'docs:write', writes: [], persona: 'ledger-keeper' },
    repoRoot, cwd: worktreeDir, worktree: worktreeDir,
  });
  const unitDir = path.join(repoRoot, '.fgos', 'assignments', res.unitRunId);
  const assignment = JSON.parse(fs.readFileSync(path.join(unitDir, 'producer', '1', 'assignment.json'), 'utf8'));
  assert.equal(assignment.policy.personaPin?.name, 'ledger-keeper');
  assert.equal(assignment.policy.personaPin?.text, personaText);
  // The pin is recorded once, so an edit to the file after the start never reaches a resume.
  assert.equal(JSON.parse(fs.readFileSync(path.join(unitDir, 'unit.json'), 'utf8')).personaPin.text, personaText);
});
