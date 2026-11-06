// test/runner/execution/run-roles.test.mjs — the fgos run door: reviewed and panel roles, inputs, commits after a producer round, blind units and own-previous reports

import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { runUnitWithPort as runUnit } from '../../helpers/run-unit-with-port.mjs';
import { seedFileLocalBwrapRegistry } from '../confinement-registry-fixture.helper.mjs';

// posture filtering consults the machine backend registry; keep it file-local
seedFileLocalBwrapRegistry();

import { setupGitRepo, panelSeats, reviewedConfig } from '../../helpers/run-unit-repo-fixture.mjs';

test('a reviewed run with a single provider family refuses the checker instead of self-reviewing', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  const res = await runUnit({
    unitData: { id: 'u-indep-1', objective: 'Write docs', capability: 'docs:write', writes: [], pattern: 'reviewed' },
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    pattern: 'reviewed',
  });
  assert.equal(res.outcome, 'policy-refusal');
  const checker = res.results.find((r) => r.seat === 'reviewer');
  assert.equal(checker.refused.reason, 'independence-unsatisfiable');
});

function panelRun(id, members) {
  const { repoRoot, worktreeDir } = setupGitRepo();
  return { repoRoot, worktreeDir, pattern: 'panel', id };
}

const summaryOf = (repoRoot, res) => JSON.parse(fs.readFileSync(path.join(repoRoot, '.fgos', 'assignments', res.unitRunId, 'unit-summary.json'), 'utf8'));

test('a panel with fewer provider families than members runs anyway: seats share families in pool order and the summary says so', async () => {
  const { repoRoot, worktreeDir, pattern } = panelRun('u-panel-2', 6);
  reviewedConfig(repoRoot, ['alpha', 'beta', 'gamma']);
  const res = await runUnit({
    unitData: { id: 'u-panel-2', objective: 'Review the design', capability: 'docs:write', writes: [], pattern: 'panel', seats: panelSeats(6) },
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    pattern,
  });
  assert.equal(res.outcome, 'pass');
  assert.ok(!res.results.some((r) => r.refused), 'no seat is refused for sharing a family');
  const byRole = Object.fromEntries(res.results.map((r) => [r.seat, r.runResult?.executorId]));
  assert.deepEqual(
    [1, 2, 3, 4, 5, 6].map((n) => byRole[`member-${n}`]),
    ['alpha', 'beta', 'gamma', 'alpha', 'beta', 'gamma'],
    'seats are bound in listed order, each on the first unused family in pool order, then the least used',
  );
  const summary = summaryOf(repoRoot, res);
  assert.equal(summary.seats.filter((seat) => seat.kind === 'panelist').length, 6);
  assert.deepEqual(summary.sharedFamilies.map((entry) => entry.seats.length).sort(), [2, 2, 3]);
  const alpha = summary.sharedFamilies.find((entry) => entry.seats.includes('member-1/1'));
  assert.deepEqual(alpha.seats, ['member-1/1', 'member-4/1', 'synthesizer/1']);
});

test('a panel with enough provider families lands every seat on its own family, the synthesizer on one no panelist used, and only the synthesizer is told to read the panelist reports', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta', 'gamma', 'delta']);
  const res = await runUnit({
    unitData: { id: 'u-panel-refs', objective: 'Review the design', capability: 'docs:write', writes: [], pattern: 'panel', seats: panelSeats(3) },
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    pattern: 'panel',
  });
  assert.equal(res.outcome, 'pass');
  assert.deepEqual(res.results.map((r) => r.runResult?.executorId), ['alpha', 'beta', 'gamma', 'delta']);
  assert.equal(summaryOf(repoRoot, res).sharedFamilies, undefined);
  const members = res.results.filter((r) => r.seat.startsWith('member-')).map((r) => r.runResult?.executorId);
  const synth = res.results.find((r) => r.seat === 'synthesizer');
  assert.ok(synth?.runResult?.executorId, `synthesizer should have run, got ${JSON.stringify(res).slice(0, 1500)}`);
  assert.ok(!members.includes(synth.runResult.executorId), 'synthesizer shares a provider family with a panelist');
  const assignmentOf = (role) =>
    JSON.parse(fs.readFileSync(path.join(repoRoot, '.fgos', 'assignments', res.unitRunId, role, '1', 'assignment.json'), 'utf8'));

  const refs = assignmentOf('synthesizer').contextRefs;
  assert.equal(refs.length, 3, `synthesizer refs: ${JSON.stringify(refs)}`);
  for (const [i, ref] of refs.entries()) {
    assert.ok(path.isAbsolute(ref), `ref is absolute: ${ref}`);
    assert.ok(ref.includes(`/member-${i + 1}/`), `ref ${i} points at member-${i + 1}: ${ref}`);
    assert.ok(/(report-\d+|agent-report)\.md$/.test(ref), `ref is a report: ${ref}`);
    assert.ok(fs.existsSync(ref), `ref exists: ${ref}`);
  }
  for (const n of [1, 2, 3]) assert.deepEqual(assignmentOf(`member-${n}`).contextRefs, []);

  // Each role is told its own task: the panelists the plain objective, the synthesizer a synthesis of it.
  for (const n of [1, 2, 3]) assert.equal(assignmentOf(`member-${n}`).objective, 'Review the design');
  const synthObjective = assignmentOf('synthesizer').objective;
  assert.match(synthObjective, /synthesizer/i);
  assert.ok(synthObjective.includes('Review the design'), 'the panel\'s task is quoted to the synthesizer');
});

test('a unit-run input reaches the roles as the absolute path of that role\'s report, resolved once into unit.json; a resume refuses a record from a newer release or one that does not parse', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  const run = (unitData, extra = {}) =>
    runUnit({ unitData, repoRoot, cwd: worktreeDir, worktree: worktreeDir, pattern: 'solo', ...extra });

  const first = await run({ id: 'u-a', objective: 'Write docs', capability: 'docs:write', writes: [] });
  assert.equal(first.outcome, 'pass');
  const reportOfA = path.join(repoRoot, first.results[0].runResult.settleReports[0].path);

  const second = await run({
    id: 'u-b',
    objective: 'Build on it',
    capability: 'docs:write',
    writes: [],
    inputs: ['docs/a.md', `unit-run:${first.unitRunId}/producer`],
  });
  assert.equal(second.outcome, 'pass');
  const dirOfB = path.join(repoRoot, '.fgos', 'assignments', second.unitRunId);
  const expected = ['docs/a.md', reportOfA];
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dirOfB, 'producer', '1', 'assignment.json'), 'utf8')).contextRefs, expected);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dirOfB, 'unit.json'), 'utf8')).resolvedInputs, expected);

  // A resume reuses the stored list: it neither re-reads nor re-checks the earlier report.
  fs.writeFileSync(reportOfA, 'edited after the fact\n');
  const resumed = await run(undefined, { resumeUnitRunId: second.unitRunId });
  assert.equal(resumed.outcome, 'pass');
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dirOfB, 'unit.json'), 'utf8')).resolvedInputs, expected);

  // A unit run recorded without the resolved list cannot be resumed.
  const unitJson = JSON.parse(fs.readFileSync(path.join(dirOfB, 'unit.json'), 'utf8'));
  delete unitJson.resolvedInputs;
  fs.writeFileSync(path.join(dirOfB, 'unit.json'), JSON.stringify(unitJson));
  await assert.rejects(() => run(undefined, { resumeUnitRunId: second.unitRunId }), /no resolvedInputs/);

  // A record carrying a seatSchema from a newer release is refused on resume and left untouched.
  const firstPath = path.join(repoRoot, '.fgos', 'assignments', first.unitRunId, 'unit.json');
  fs.writeFileSync(firstPath, JSON.stringify({ ...JSON.parse(fs.readFileSync(firstPath, 'utf8')), seatSchema: 3 }));
  await assert.rejects(
    () => run(undefined, { resumeUnitRunId: first.unitRunId }),
    (err) => err.code === 'record-from-newer-release' && /seatSchema/.test(err.message),
  );
  assert.equal(JSON.parse(fs.readFileSync(firstPath, 'utf8')).seatSchema, 3, 'the refused record is left untouched');

  // A record that does not parse is refused by name, with its path, and left as it was.
  const unreadable = fs.readFileSync(firstPath, 'utf8');
  fs.writeFileSync(firstPath, '{ not json');
  await assert.rejects(
    () => run(undefined, { resumeUnitRunId: first.unitRunId }),
    (err) => err.code === 'unit-record-unreadable' && err.message.includes(firstPath),
  );
  assert.equal(fs.readFileSync(firstPath, 'utf8'), '{ not json');
  fs.writeFileSync(firstPath, unreadable);

  // Schema 1 and 2 records are accepted by the fence
  fs.writeFileSync(firstPath, JSON.stringify({ ...JSON.parse(fs.readFileSync(firstPath, 'utf8')), seatSchema: 1 }));
  const resumed1 = await run(undefined, { resumeUnitRunId: first.unitRunId });
  assert.equal(resumed1.outcome, 'pass');

  fs.writeFileSync(firstPath, JSON.stringify({ ...JSON.parse(fs.readFileSync(firstPath, 'utf8')), seatSchema: 2 }));
  const resumed2 = await run(undefined, { resumeUnitRunId: first.unitRunId });
  assert.equal(resumed2.outcome, 'pass');
});

test('anonymizeInputs hands the role a copy under a neutral name, keeps the mapping in unit.json, and a resume reuses it', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  const run = (unitData, extra = {}) =>
    runUnit({ unitData, repoRoot, cwd: worktreeDir, worktree: worktreeDir, pattern: 'solo', ...extra });

  const first = await run({ id: 'u-a', objective: 'Write docs', capability: 'docs:write', writes: [] });
  const reportOfA = path.join(repoRoot, first.results[0].runResult.settleReports[0].path);
  const original = fs.readFileSync(reportOfA);

  const second = await run({
    id: 'u-b',
    objective: 'Judge it',
    capability: 'docs:write',
    writes: [],
    inputs: ['docs/a.md', `unit-run:${first.unitRunId}/producer`],
    anonymizeInputs: true,
  });
  assert.equal(second.outcome, 'pass');
  const dirOfB = path.join(repoRoot, '.fgos', 'assignments', second.unitRunId);
  const copy = path.join(dirOfB, 'inputs', 'seat-A.md');
  const expected = ['docs/a.md', copy];
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dirOfB, 'producer', '1', 'assignment.json'), 'utf8')).contextRefs, expected);
  assert.ok(fs.readFileSync(copy).equals(original));

  const unitJson = JSON.parse(fs.readFileSync(path.join(dirOfB, 'unit.json'), 'utf8'));
  assert.deepEqual(unitJson.resolvedInputs, expected);
  assert.deepEqual(unitJson.inputMap, [{ name: 'seat-A.md', input: `unit-run:${first.unitRunId}/producer`, source: reportOfA }]);

  // Neither the brief's assignment nor its context refs name the earlier run or role.
  const assignmentText = fs.readFileSync(path.join(dirOfB, 'producer', '1', 'assignment.json'), 'utf8');
  assert.ok(!assignmentText.includes(first.unitRunId), 'earlier unit run id not in the assignment');

  // A resume reuses the stored copy and list; the source is not read again.
  fs.writeFileSync(reportOfA, 'edited after the fact\n');
  const resumed = await run(undefined, { resumeUnitRunId: second.unitRunId });
  assert.equal(resumed.outcome, 'pass');
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dirOfB, 'unit.json'), 'utf8')).resolvedInputs, expected);
  assert.ok(fs.readFileSync(copy).equals(original));
});

test('a reviewed run never lets the producer family also check its own work; the reviewer is told to review and handed the producer\'s report', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta']);
  const res = await runUnit({
    unitData: { id: 'u-role-task', objective: 'Write docs', capability: 'docs:write', writes: [], pattern: 'reviewed' },
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    pattern: 'reviewed',
  });
  assert.equal(res.outcome, 'pass');
  const byRole = Object.fromEntries(res.results.map((r) => [r.seat, r.runResult?.executorId]));
  assert.equal(byRole.producer, 'alpha');
  assert.equal(byRole.reviewer, 'beta', 'the reviewer must run on a different provider family than the producer');
  const assignmentOf = (role) =>
    JSON.parse(fs.readFileSync(path.join(repoRoot, '.fgos', 'assignments', res.unitRunId, role, '1', 'assignment.json'), 'utf8'));

  assert.equal(assignmentOf('producer').objective, 'Write docs', 'the producer is given the task itself');
  assert.deepEqual(assignmentOf('producer').contextRefs, []);

  const reviewer = assignmentOf('reviewer');
  assert.match(reviewer.objective, /reviewer/i);
  assert.match(reviewer.objective, /do not change any file/i);
  assert.ok(reviewer.objective.includes('Write docs'), 'the reviewer is told what the work was supposed to be');
  assert.equal(reviewer.contextRefs.length, 1);
  assert.ok(reviewer.contextRefs[0].includes('/producer/'), `the reviewer reads the producer's report: ${reviewer.contextRefs[0]}`);
  assert.ok(fs.existsSync(reviewer.contextRefs[0]));
});

test('panel members run on different provider families; when they take every family the synthesizer still runs, on the least used one', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta', 'gamma']);
  const res = await runUnit({
    unitData: { id: 'u-panel-synth-2', objective: 'Review the design', capability: 'docs:write', writes: [], pattern: 'panel', seats: panelSeats(3) },
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    pattern: 'panel',
  });
  assert.equal(res.outcome, 'pass');
  const members = res.results.filter((r) => r.seat.startsWith('member-')).map((r) => r.runResult?.executorId);
  assert.equal(members.length, 3);
  assert.equal(new Set(members).size, 3, `panelists must not share a provider family, got ${members.join(',')}`);
  const synth = res.results.find((r) => r.seat === 'synthesizer');
  assert.equal(synth.refused, undefined);
  assert.equal(synth.runResult.executorId, 'alpha', 'every family is used once, so pool order breaks the tie');
  assert.deepEqual(synth.binding.provenance.familySpread.value.sharedWith, ['member-1']);
});

// A worker that writes a file in its worktree and never touches git.
function writeFileWritingWorker(repoRoot, verdict = 'pass') {
  const script = path.join(repoRoot, 'settling-worker.mjs');
  fs.writeFileSync(
    script,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const prompt = process.argv.slice(2).join(' ');
    const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
    if (true) {
      fs.mkdirSync('src', { recursive: true });
      fs.writeFileSync('src/feature.txt', 'feature\\n');
    }
    if (match) {
      const claimDir = path.dirname(match[1]);
      const outbox = path.join(claimDir, 'worker-output', 'outbox');
      const runDir = fs.existsSync(outbox) ? outbox : claimDir;
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nThe assigned work was carried out and checked in full detail.\\n');
      fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Added the feature file', assessment: { verdict: ${JSON.stringify(verdict)} } }));
    }
    `,
  );
}

test('after a producer round passes, the runner commits what the worker wrote, with the agent summary as message', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  writeFileWritingWorker(repoRoot);
  const before = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: worktreeDir, encoding: 'utf8' }).trim();

  const res = await runUnit({
    unitData: { id: 'u-commit', objective: 'Implement feature', capability: 'docs:write', writes: ['src/feature.txt'] },
    repoRoot, cwd: worktreeDir, pattern: 'solo',
  });

  assert.equal(res.outcome, 'pass');
  assert.equal(res.results[0].commit.status, 'committed');
  assert.deepEqual(res.results[0].commit.files, ['src/feature.txt']);
  assert.equal(execFileSync('git', ['log', '-1', '--format=%s'], { cwd: worktreeDir, encoding: 'utf8' }).trim(), 'chore(u-commit): Added the feature file');
  assert.notEqual(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: worktreeDir, encoding: 'utf8' }).trim(), before);
  assert.equal(execFileSync('git', ['status', '--porcelain'], { cwd: worktreeDir, encoding: 'utf8' }).trim(), '', 'nothing left uncommitted');
  const unitRecord = JSON.parse(fs.readFileSync(path.join(repoRoot, '.fgos', 'assignments', res.unitRunId, 'unit.json'), 'utf8'));
  assert.equal(Object.values(unitRecord.bindings)[0][0].commit.status, 'committed', 'the run record says what the runner committed');
});

test('mutating producer findings preserve dirty work and never create a runner commit', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  writeFileWritingWorker(repoRoot, 'findings');
  const before = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: worktreeDir, encoding: 'utf8' }).trim();
  const res = await runUnit({
    unitData: { id: 'u-findings-no-commit', objective: 'Implement feature while retaining findings', capability: 'docs:write', writes: ['src/feature.txt'] },
    repoRoot, cwd: worktreeDir, pattern: 'solo',
  });
  assert.equal(res.outcome, 'findings');
  assert.equal(res.results[0].runResult.classification.execution.status, 'completed');
  assert.equal(res.results[0].runResult.classification.confidence.level, 'verified');
  assert.equal(res.results[0].commit, undefined);
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: worktreeDir, encoding: 'utf8' }).trim(), before);
  assert.equal(fs.readFileSync(path.join(worktreeDir, 'src', 'feature.txt'), 'utf8'), 'feature\n');
  assert.match(execFileSync('git', ['status', '--porcelain'], { cwd: worktreeDir, encoding: 'utf8' }), /\?\? src\//);
  const record = JSON.parse(fs.readFileSync(path.join(repoRoot, '.fgos', 'assignments', res.unitRunId, 'unit.json'), 'utf8'));
  const attempt = Object.values(record.bindings)[0][0];
  assert.equal(attempt.outcome, 'findings');
  assert.equal(attempt.commit, undefined);
});

// A worker that reports whether it can read a peer's report and which assignment directories it can see.
function writePeerProbingWorker(dir, peerReport) {
  fs.writeFileSync(
    path.join(dir, 'settling-worker.mjs'),
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const prompt = process.argv.slice(2).join(' ');
    const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
    if (match) {
      const code = (fn) => { try { fn(); return 'ok'; } catch (e) { return e.code; } };
      const peer = code(() => fs.readFileSync(${JSON.stringify(peerReport)}));
      const claimDir = path.dirname(match[1]);
      const outbox = path.join(claimDir, 'worker-output', 'outbox');
      const runDir = fs.existsSync(outbox) ? outbox : claimDir;
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\npeer-read: ' + peer + '\\nThe assigned work was inspected and completed with a full explanation of what was checked.\\n');
      fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done', assessment: { verdict: 'pass' } }));
    }
    `,
  );
}

test('a blind unit runs confined with its peers\' run state hidden; the same unit unblind reads it', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  const run = (unitData) => runUnit({ unitData, repoRoot, cwd: worktreeDir, worktree: worktreeDir, pattern: 'solo' });
  const reportOf = (res) => fs.readFileSync(path.join(repoRoot, res.results[0].runResult.settleReports[0].path), 'utf8');

  const first = await run({ id: 'u-peer', objective: 'Write docs', capability: 'docs:write', writes: [] });
  assert.equal(first.outcome, 'pass');
  writePeerProbingWorker(repoRoot, path.join(repoRoot, first.results[0].runResult.settleReports[0].path));

  const unblind = await run({ id: 'u-open', objective: 'Look around', capability: 'docs:write', writes: [] });
  assert.equal(unblind.outcome, 'pass');
  assert.match(reportOf(unblind), /peer-read: ok/);

  const blind = await run({ id: 'u-blind', objective: 'Look around', capability: 'docs:write', writes: [], blind: true });
  assert.equal(blind.outcome, 'pass');
  assert.match(reportOf(blind), /peer-read: ENOENT/);
});

// A worker that lists the context refs it was given with what it reads at each, and what it reads
// at the absolute path of each source of those refs.
function writeRefReadingWorker(dir, sources) {
  fs.writeFileSync(
    path.join(dir, 'settling-worker.mjs'),
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const prompt = process.argv.slice(2).join(' ');
    const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
    if (match) {
      const code = (fn) => { try { return fn(); } catch (e) { return e.code; } };
      const claimDir = path.dirname(match[1]);
      let up = claimDir; while (!fs.existsSync(path.join(up, 'assignment.json'))) up = path.dirname(up);
      const assignment = JSON.parse(fs.readFileSync(path.join(up, 'assignment.json'), 'utf8'));
      const lines = assignment.contextRefs.map((ref) => 'ref ' + path.basename(path.dirname(ref)) + '/' + path.basename(ref) + ': ' + String(code(() => fs.readFileSync(ref, 'utf8'))).trim());
      for (const source of ${JSON.stringify(sources)}) lines.push('source: ' + String(code(() => fs.readFileSync(source, 'utf8') && 'readable')));
      const outbox = path.join(claimDir, 'worker-output', 'outbox');
      const runDir = fs.existsSync(outbox) ? outbox : claimDir;
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\n' + lines.join('\\n') + '\\nThe assigned work was inspected and completed with a full explanation of what was checked.\\n');
      fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done', assessment: { verdict: 'pass' } }));
    }
    `,
  );
}

test('a blind unit reads its unit-run and gate-answer inputs as copies in its own directory, and cannot read the sources', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  const run = (unitData, extra = {}) => runUnit({ unitData, repoRoot, cwd: worktreeDir, worktree: worktreeDir, pattern: 'solo', ...extra });
  const reportOf = (res) => fs.readFileSync(path.join(repoRoot, res.results[0].runResult.settleReports[0].path), 'utf8');

  const first = await run({ id: 'u-peer', objective: 'Write docs', capability: 'docs:write', writes: [] });
  const source = path.join(repoRoot, first.results[0].runResult.settleReports[0].path);
  const answer = path.join(repoRoot, '.fgos', 'workflow-runs', 'wf-run-1', 'gate-answers', 'gate.md');
  fs.mkdirSync(path.dirname(answer), { recursive: true });
  fs.writeFileSync(answer, 'the owner said go\n');
  writeRefReadingWorker(repoRoot, [source, answer]);

  const res = await run({
    id: 'u-blind-in', objective: 'Build on it', capability: 'docs:write', writes: [], blind: true,
    inputs: ['docs/a.md', `unit-run:${first.unitRunId}/producer`, 'gate-answer:wf-run-1/gate'],
  });
  assert.equal(res.outcome, 'pass');

  const dirOfB = path.join(repoRoot, '.fgos', 'assignments', res.unitRunId);
  const refs = JSON.parse(fs.readFileSync(path.join(dirOfB, 'producer', '1', 'assignment.json'), 'utf8')).contextRefs;
  const copies = [path.join(dirOfB, 'producer', '1', 'inputs', '1-producer-r1.md'), path.join(dirOfB, 'producer', '1', 'inputs', '2-gate-gate.md')];
  assert.deepEqual(refs, ['docs/a.md', ...copies]);
  assert.ok(fs.readFileSync(copies[0]).equals(fs.readFileSync(source)), 'byte-identical to the report');
  assert.equal(fs.readFileSync(copies[1], 'utf8'), 'the owner said go\n');

  const seen = reportOf(res);
  assert.match(seen, /ref inputs\/1-producer-r1\.md: #/, 'the copy of the report is readable by the role');
  assert.match(seen, /ref inputs\/2-gate-gate\.md: the owner said go/);
  assert.equal((seen.match(/source: ENOENT/g) ?? []).length, 2, 'the sources are not visible to the blind role');

  const unitJson = JSON.parse(fs.readFileSync(path.join(dirOfB, 'unit.json'), 'utf8'));
  assert.deepEqual(unitJson.resolvedInputs, ['docs/a.md']);
  assert.deepEqual(unitJson.inputMap.map((e) => e.name), ['1-producer-r1.md', '2-gate-gate.md']);

  // A resume hands the same copies again, with the sources gone.
  fs.rmSync(source);
  const resumed = await run(undefined, { resumeUnitRunId: res.unitRunId });
  assert.equal(resumed.outcome, 'pass');
  assert.ok(fs.existsSync(copies[0]));
});

test('a blind unit with anonymized inputs gets neutral names in its own directory', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  const run = (unitData) => runUnit({ unitData, repoRoot, cwd: worktreeDir, worktree: worktreeDir, pattern: 'solo' });

  const first = await run({ id: 'u-peer', objective: 'Write docs', capability: 'docs:write', writes: [] });
  const res = await run({
    id: 'u-blind-anon', objective: 'Judge it', capability: 'docs:write', writes: [], blind: true, anonymizeInputs: true,
    inputs: [`unit-run:${first.unitRunId}/producer`],
  });
  assert.equal(res.outcome, 'pass');
  const dirOfB = path.join(repoRoot, '.fgos', 'assignments', res.unitRunId);
  const assignment = fs.readFileSync(path.join(dirOfB, 'producer', '1', 'assignment.json'), 'utf8');
  assert.deepEqual(JSON.parse(assignment).contextRefs, [path.join(dirOfB, 'producer', '1', 'inputs', 'seat-A.md')]);
  assert.ok(!assignment.includes(first.unitRunId), 'the earlier run is not named');
  assert.equal(fs.existsSync(path.join(dirOfB, 'inputs')), false, 'no copy is shared between the roles of the unit');
});

test('a blind unit whose input cannot be copied is refused with the reason, before anything launches', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  const run = (unitData) => runUnit({ unitData, repoRoot, cwd: worktreeDir, worktree: worktreeDir, pattern: 'solo' });

  const first = await run({ id: 'u-peer', objective: 'Write docs', capability: 'docs:write', writes: [] });
  const source = path.join(repoRoot, first.results[0].runResult.settleReports[0].path);
  fs.writeFileSync(source, 'edited after settle\n');
  await assert.rejects(
    () => run({ id: 'u-edited', objective: 'x', capability: 'docs:write', writes: [], blind: true, inputs: [`unit-run:${first.unitRunId}/producer`] }),
    /report-changed-after-settle/,
  );
  await assert.rejects(
    () => run({ id: 'u-missing', objective: 'x', capability: 'docs:write', writes: [], blind: true, inputs: ['unit-run:unit-run-nope/producer'] }),
    /no-such-run/,
  );
});

test('a blind panel synthesizer reads its panelists\' reports as copies in its own directory', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta', 'gamma', 'delta']);
  const res = await runUnit({
    unitData: { id: 'u-panel-blind', objective: 'Review the design', capability: 'docs:write', writes: [], pattern: 'panel', seats: panelSeats(3), blind: true },
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    pattern: 'panel',
  });
  assert.equal(res.outcome, 'pass');
  const synthDir = path.join(repoRoot, '.fgos', 'assignments', res.unitRunId, 'synthesizer', '1');
  const refs = JSON.parse(fs.readFileSync(path.join(synthDir, 'assignment.json'), 'utf8')).contextRefs;
  assert.deepEqual(refs.map((ref) => path.dirname(ref)), [1, 2, 3].map(() => path.join(synthDir, 'inputs')));
  for (const [i, ref] of refs.entries()) {
    assert.ok(ref.includes(`member-${i + 1}`), `ref ${i} is the copy of member-${i + 1}'s report: ${ref}`);
    assert.ok(fs.statSync(ref).size > 0 && !fs.lstatSync(ref).isSymbolicLink());
  }
});

test('each role of a panel gets its own seat\'s earlier report as own-previous, blind or not, and not the other seats\'; a seat the earlier run did not have is refused by name', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta', 'gamma', 'delta']);
  const run = (unitData) => runUnit({ unitData, repoRoot, cwd: worktreeDir, worktree: worktreeDir, pattern: 'panel' });
  const first = await run({ id: 'u-round-1', objective: 'Propose', capability: 'docs:write', writes: [], pattern: 'panel', seats: panelSeats(3) });
  const reportOf = (role) => path.join(repoRoot, first.results.find((r) => r.seat === role).runResult.settleReports[0].path);

  for (const blind of [false, true]) {
    const res = await run({
      id: `u-round-2-${blind}`, objective: 'Revise', capability: 'docs:write', writes: [], pattern: 'panel', seats: panelSeats(3), blind,
      inputs: [`unit-run:${first.unitRunId}/{seat}`],
    });
    assert.equal(res.outcome, 'pass');
    const unitDir = path.join(repoRoot, '.fgos', 'assignments', res.unitRunId);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(unitDir, 'unit.json'), 'utf8')).resolvedInputs, [], 'resolved per role, not for the unit');

    for (const role of ['member-1', 'member-2', 'member-3']) {
      const roleDir = path.join(unitDir, role, '1');
      const refs = JSON.parse(fs.readFileSync(path.join(roleDir, 'assignment.json'), 'utf8')).contextRefs;
      const own = path.join(roleDir, 'inputs', 'own-previous.md');
      assert.deepEqual(refs, [own], `${role} gets only its own earlier result`);
      assert.ok(fs.readFileSync(own).equals(fs.readFileSync(reportOf(role))));
    }
    // The synthesizer is a seat of the earlier run too; the panelists' reports reach it as before.
    const synthRefs = JSON.parse(fs.readFileSync(path.join(unitDir, 'synthesizer', '1', 'assignment.json'), 'utf8')).contextRefs;
    assert.ok(synthRefs.some((ref) => ref.endsWith('own-previous.md')));
    assert.equal(synthRefs.length, 4);
  }
  await assert.rejects(
    () => runUnit({ unitData: { id: 'u-own', objective: 'x', capability: 'docs:write', writes: [], pattern: 'solo', inputs: [`unit-run:${first.unitRunId}/{seat}`] }, repoRoot, cwd: worktreeDir, worktree: worktreeDir, pattern: 'solo' }),
    /no-such-seat/,
  );
});
