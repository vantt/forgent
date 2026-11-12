// test/runner/execution/run-verify-pin.test.mjs — the fgos run door: custody handoff, rigor families, verify, signals, pending-record resume, pinned units and the account inventory

import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import crypto from 'node:crypto';
import { runUnitWithPort as runUnit } from '../../helpers/run-unit-with-port.mjs';
import { runUnit as coreRunUnit, readAccountInventory, snapshotRunnerConfig } from '../../../src/runner/execution/run.mjs';
import { writeUnitSummary, buildUnitSummary } from '../../../src/runner/execution/unit-summary.mjs';
import { seedFileLocalBwrapRegistry } from '../confinement-registry-fixture.helper.mjs';

// posture filtering consults the machine backend registry; keep it file-local
seedFileLocalBwrapRegistry();

// Confined runs mount a private tmpfs over /tmp, so fixtures that the executor
// must reach (command, worker script, worktree) live outside it.
import { makeFixtureDir } from '../../helpers/fixture-dir.mjs';
import { writeAccountsFile, writeProjectConfig, readProjectConfig, withHome } from '../../helpers/config-fixture.mjs';
import { setupGitRepo, panelSeats, withCancelHandlers, reviewedConfig, recordedUnitFixture, writeScopedWorker, gitIn, headOf, producerSpawns } from '../../helpers/run-unit-repo-fixture.mjs';

test('a committed Unit result survives a failed custody handoff with a warning', async (t) => {
  const { resolveLock } = await import('../../../src/holder-lock/index.mjs');
  const { repoRoot, worktreeDir } = setupGitRepo();
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  t.after(() => fs.rmSync(worktreeDir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(repoRoot, 'docs'));
  fs.writeFileSync(path.join(repoRoot, 'docs', 'in.md'), 'completed\n');
  gitIn(repoRoot, 'add', 'docs/in.md');
  gitIn(repoRoot, 'commit', '-qm', 'feat(docs): upstream change');
  const record = `${resolveLock('dispatch-cwd', { fgosDir: path.join(repoRoot, '.fgos'), cwd: worktreeDir }).v3Path}.predecessor.json`;
  const hook = path.join(repoRoot, '.git', 'hooks', 'pre-commit');
  fs.writeFileSync(hook, `#!/bin/sh\nprintf 'broken record' > '${record.replaceAll("'", "'\\''")}'\n`, { mode: 0o755 });
  const result = await runUnit({
    unitData: { id: 'handoff-warning', capability: 'docs:write', writes: ['docs'], syncBase: 'main' },
    repoRoot, cwd: worktreeDir, pattern: 'solo',
  });
  assert.equal(result.outcome, 'pass');
  assert.equal(result.results[0].commit.status, 'committed');
  assert.equal(result.results[0].commit.sha, headOf(worktreeDir));
  assert.equal(result.warnings[0].code, 'custody-handoff-not-recorded');
  assert.equal(fs.readFileSync(record, 'utf8'), 'broken record');
});

// Gives each named executor family its own model for every tier a rigor may ask for.
function withModelPolicies(repoRoot, families, patch = {}) {
  const cfg = readProjectConfig(repoRoot);
  for (const family of families) cfg.runner.modelPolicies[family] = { standard: `${family}-std`, flagship: `${family}-flagship`, frontier: `${family}-frontier` };
  Object.assign(cfg.runner, patch);
  writeProjectConfig(repoRoot, cfg);
}

function reviewedRun(repoRoot, worktreeDir, unitData, pattern = 'reviewed') {
  return runUnit({ unitData: { objective: 'Write docs', capability: 'docs:write', writes: [], pattern: 'reviewed', ...unitData }, repoRoot, cwd: worktreeDir, worktree: worktreeDir, pattern });
}

test('a reviewed run at rigor high puts the producer and both checkers on three provider families', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta', 'gamma']);
  withModelPolicies(repoRoot, ['alpha', 'beta', 'gamma']);
  const res = await reviewedRun(repoRoot, worktreeDir, { id: 'u-high-3', rigor: 'high' });
  assert.equal(res.outcome, 'pass');
  const byRole = Object.fromEntries(res.results.map((r) => [r.seat, r.runResult?.executorId]));
  assert.equal(new Set([byRole.producer, byRole.reviewer, byRole['red-team']]).size, 3, JSON.stringify(byRole));
});

test('a reviewed run at rigor high refuses the checker that no unused family can serve', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta']);
  withModelPolicies(repoRoot, ['alpha', 'beta']);
  const res = await reviewedRun(repoRoot, worktreeDir, { id: 'u-high-2', rigor: 'high' });
  assert.equal(res.outcome, 'policy-refusal');
  const refused = res.results.find((r) => r.refused);
  assert.equal(refused.seat, 'red-team');
  assert.equal(refused.refused.reason, 'independence-unsatisfiable');
});

test('a reviewed run at rigor standard lets two checkers share a family, as before', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta']);
  withModelPolicies(repoRoot, ['alpha', 'beta']);
  const res = await reviewedRun(repoRoot, worktreeDir, { id: 'u-std-2', rigor: 'standard' }, { pattern: 'reviewed', params: { minCheckers: ['reviewer', 'red-team'] } });
  assert.equal(res.outcome, 'pass');
  const byRole = Object.fromEntries(res.results.map((r) => [r.seat, r.runResult?.executorId]));
  assert.equal(byRole.reviewer, byRole['red-team']);
  assert.notEqual(byRole.producer, byRole.reviewer);
});

test('a unit verify command runs in the worktree after the producing round and a zero exit passes', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta']);
  const res = await reviewedRun(repoRoot, worktreeDir, { id: 'u-verify-ok', verify: `node -e "require('fs').writeFileSync('verify-ran.txt', process.cwd())"` });
  assert.equal(res.outcome, 'pass');
  assert.equal(res.verify, undefined, 'a run that verified says nothing about missing verify');
  assert.equal(res.results.filter((r) => r.seat === 'verify' && r.outcome === 'pass').length, 1);
  assert.equal(fs.realpathSync(fs.readFileSync(path.join(worktreeDir, 'verify-ran.txt'), 'utf8')), fs.realpathSync(worktreeDir));
});

test('a writing unit\'s verify child borrows the custody lease while it runs', { skip: process.platform === 'win32' && 'the hold transport keeps the description in its helper' }, async (t) => {
  const { resolveLock } = await import('../../../src/holder-lock/index.mjs');
  const { repoRoot, worktreeDir } = setupGitRepo();
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  t.after(() => fs.rmSync(worktreeDir, { recursive: true, force: true }));
  reviewedConfig(repoRoot, ['alpha', 'beta']);
  writeScopedWorker(repoRoot, { files: { 'docs/in.md': 'i\n' } });
  // Only the producer writes; the checker keeps the read-only settling worker.
  const cfg = readProjectConfig(repoRoot);
  const settling = [path.join(repoRoot, 'settling-worker.mjs'), '{prompt}'];
  cfg.runner.executors.beta.args = settling;
  for (const invocation of cfg.runner.executors.beta.invocations) invocation.args = settling;
  writeProjectConfig(repoRoot, cfg);
  const probe = path.join(repoRoot, 'verify-probe.json');
  const script = `const fs = require('fs'); fs.writeFileSync(${JSON.stringify(probe)}, JSON.stringify({ name: process.env.FGOS_LOCK_FD, ino: String(fs.fstatSync(3, { bigint: true }).ino) }))`;
  const res = await reviewedRun(repoRoot, worktreeDir, { id: 'u-verify-custody', writes: ['docs'], verify: `node -e ${JSON.stringify(script)}` });
  assert.equal(res.outcome, 'pass', JSON.stringify(res));
  assert.equal(res.results.find((r) => r.seat === 'producer').commit.status, 'committed');
  const seen = JSON.parse(fs.readFileSync(probe, 'utf8'));
  const lock = resolveLock('dispatch-cwd', { fgosDir: path.join(repoRoot, '.fgos'), cwd: worktreeDir }).v3Path;
  assert.equal(seen.name, 'dispatch-cwd:3');
  assert.equal(seen.ino, String(fs.statSync(lock, { bigint: true }).ino), 'the verify child holds a copy of the lease description');
});

test('a failing unit verify becomes findings that carry its exit status and output', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta']);
  const res = await reviewedRun(repoRoot, worktreeDir, { id: 'u-verify-red', verify: `node -e "console.error('assertion exploded'); process.exit(3)"` });
  assert.equal(res.outcome, 'findings');
  assert.ok(res.findings.some((f) => /exited 3/.test(f) && /assertion exploded/.test(f)), res.findings.join('\n'));
});

// The child sleeps far longer than any plausible machine slowness, so only the timeout kill can end the run early.
const VERIFY_CHILD_SLEEP_MS = 120000;

test('a verify command that outlives runner.timeoutMs is an infrastructure failure with the timeout named, never a findings verdict, and never hangs', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta']);
  withModelPolicies(repoRoot, [], { timeoutMs: 4000 });
  const started = Date.now();
  const res = await reviewedRun(
    repoRoot,
    worktreeDir,
    { id: 'u-verify-slow', verify: `node -e "setTimeout(() => {}, ${VERIFY_CHILD_SLEEP_MS})"` },
    { pattern: 'reviewed', params: { maxRounds: 1 } },
  );
  assert.equal(res.outcome, 'execution-failure');
  const verified = res.results.find((r) => r.seat === 'verify');
  assert.equal(verified.outcome, 'execution-failure');
  assert.equal(verified.infrastructure, 'timeout');
  assert.match(verified.error, /timed out after 4000ms/);
  assert.ok(Date.now() - started < VERIFY_CHILD_SLEEP_MS / 2, 'the run did not wait for the verify command to finish by itself');
});

test('a verify declared on the capability is used when the unit names none', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta']);
  const cfg = readProjectConfig(repoRoot);
  cfg.runner.capabilities['docs:write'].verify = 'node -e "process.exit(5)"';
  writeProjectConfig(repoRoot, cfg);
  const res = await reviewedRun(repoRoot, worktreeDir, { id: 'u-verify-cap' });
  assert.equal(res.outcome, 'findings');
  assert.ok(res.findings.some((f) => /exited 5/.test(f)));
});

test('a reviewed run with no verify command passes but says it verified nothing; the code-change preset pins none', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta']);
  const res = await reviewedRun(repoRoot, worktreeDir, { id: 'u-no-verify', pattern: 'code-change' }, 'code-change');
  assert.equal(res.outcome, 'pass');
  assert.equal(res.verify.ran, false);
  assert.match(res.verify.reason, /no verify command/);
  assert.equal(res.results.some((r) => r.seat === 'verify'), false);
});

test('a solo run needs no verify and does not claim to have skipped one', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  const res = await reviewedRun(repoRoot, worktreeDir, { id: 'u-solo-no-verify', pattern: 'solo' }, 'solo');
  assert.equal(res.outcome, 'pass');
  assert.equal(res.verify, undefined);
});

test('a solo record with a command does not settle before verify completes and resume runs verify', async (t) => {
  // Solo record with a verify command: producer passed but verify not run leaves derived outcome unknown, not pass
  const cmdFix = recordedUnitFixture(t);
  cmdFix.record.unit.verify = 'node -e "process.exit(0)"';
  fs.writeFileSync(path.join(cmdFix.unitDir, 'unit.json'), JSON.stringify(cmdFix.record));
  const cmdRunDir = path.join(cmdFix.unitDir, 'producer', '1', 'runs', '01');
  fs.mkdirSync(cmdRunDir, { recursive: true });
  fs.writeFileSync(path.join(cmdRunDir, 'result.json'), JSON.stringify({
    runId: 'settled-producer', settledAt: '2026-10-05T01:01:00Z', classification: { outcome: { category: 'ok' } },
  }));
  const writeRes = writeUnitSummary(cmdFix.unitDir);
  assert.equal(writeRes.skipped, 'unsettled');
  assert.equal(fs.existsSync(path.join(cmdFix.unitDir, 'unit-summary.json')), false);
  assert.equal(buildUnitSummary(cmdFix.unitDir).outcome, 'unknown');
  // Resuming runs verify and settles with pass only after verify passes
  const resumed = await runUnit({
    repoRoot: cmdFix.repoRoot,
    cwd: cmdFix.worktreeDir,
    resumeUnitRunId: cmdFix.unitRunId,
  });
  assert.equal(resumed.outcome, 'pass');
  assert.equal(resumed.results.filter((r) => r.seat === 'verify' && r.outcome === 'pass').length, 1);
  assert.equal(cmdFix.readRecord().execution?.status, 'settled');
  assert.equal(cmdFix.readRecord().settlement?.outcome, 'pass');
  assert.equal(cmdFix.readSummary().outcome, 'pass');
});

test('a solo run with a failing verify command settles with findings and no second producer launch', async (t) => {
  const fixture = recordedUnitFixture(t);
  fixture.record.unit.verify = 'node -e "console.error(\'failed verify check\'); process.exit(2)"';
  fs.writeFileSync(path.join(fixture.unitDir, 'unit.json'), JSON.stringify(fixture.record));
  const runDir = path.join(fixture.unitDir, 'producer', '1', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({
    runId: 'settled-producer', settledAt: '2026-10-05T01:01:00Z', classification: { outcome: { category: 'ok' } },
  }));

  const resumed = await runUnit({
    repoRoot: fixture.repoRoot,
    cwd: fixture.worktreeDir,
    resumeUnitRunId: fixture.unitRunId,
  });
  assert.equal(resumed.outcome, 'findings');
  assert.ok(resumed.findings.some((f) => /exited 2/.test(f) && /failed verify check/.test(f)));
  assert.equal(resumed.results.filter((r) => r.seat === 'producer').length, 1);
  assert.equal(resumed.results.filter((r) => r.seat === 'verify' && r.outcome === 'findings').length, 1);
  assert.equal(fixture.readRecord().execution?.status, 'settled');
  assert.equal(fixture.readRecord().settlement?.outcome, 'findings');
  assert.equal(fixture.readSummary().outcome, 'findings');
});

test('a solo verify that is killed settles as an infrastructure failure with no second producer launch, and resume runs the verify again', { skip: process.platform === 'win32' && 'exec replaces the shell on POSIX only' }, async (t) => {
  const fixture = recordedUnitFixture(t);
  fixture.record.unit.verify = `exec "${process.execPath}" -e "process.kill(process.pid, 'SIGKILL')"`;
  fs.writeFileSync(path.join(fixture.unitDir, 'unit.json'), JSON.stringify(fixture.record));
  const runDir = path.join(fixture.unitDir, 'producer', '1', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({
    runId: 'settled-producer', settledAt: '2026-10-05T01:01:00Z', classification: { outcome: { category: 'ok' } },
  }));

  const first = await runUnit({ repoRoot: fixture.repoRoot, cwd: fixture.worktreeDir, resumeUnitRunId: fixture.unitRunId });
  assert.equal(first.outcome, 'execution-failure');
  const killed = first.results.find((r) => r.seat === 'verify');
  assert.equal(killed.infrastructure, 'not-run');
  assert.match(killed.error, /could not run/);
  assert.equal(first.results.filter((r) => r.seat === 'producer').length, 1);

  fixture.record.unit.verify = 'node -e "process.exit(0)"';
  fs.writeFileSync(path.join(fixture.unitDir, 'unit.json'), JSON.stringify(fixture.record));
  const resumed = await runUnit({ repoRoot: fixture.repoRoot, cwd: fixture.worktreeDir, resumeUnitRunId: fixture.unitRunId });
  assert.equal(resumed.outcome, 'pass');
  assert.equal(resumed.results.filter((r) => r.seat === 'verify' && r.outcome === 'pass').length, 1);
});

test('capability-level verify on panel is neither run nor refused', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta', 'gamma', 'delta']);
  const cfg = readProjectConfig(repoRoot);
  cfg.runner.capabilities['docs:write'].verify = 'node -e "process.exit(0)"';
  writeProjectConfig(repoRoot, cfg);

  const res = await runUnit({
    unitData: { id: 'u-panel-cap-verify', objective: 'Review the design', capability: 'docs:write', writes: [], pattern: 'panel', seats: panelSeats(3) },
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    pattern: 'panel',
  });
  assert.equal(res.outcome, 'pass');
  assert.equal(res.verify?.ran, false);
  assert.equal(res.results.some((r) => r.seat === 'verify'), false);
});

test('a signal that lands while the unit is set up stops it before any seat starts and leaves the run resumable', async (t) => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  t.after(() => fs.rmSync(worktreeDir, { recursive: true, force: true }));
  const unitData = { id: 'cancelled-midway', capability: 'unserved:answer', objective: 'Answer question', writes: [] };
  await withCancelHandlers(async () => {
    await assert.rejects(
      runUnit({ unitData, repoRoot, cwd: worktreeDir, onUnitRunCreated: () => { process.emit('SIGINT'); } }),
      { name: 'RunCancelledError', code: 'run-cancelled' },
    );
    const assignments = path.join(repoRoot, '.fgos', 'assignments');
    const [unitRunId] = fs.readdirSync(assignments);
    const record = JSON.parse(fs.readFileSync(path.join(assignments, unitRunId, 'unit.json'), 'utf8'));
    assert.equal(record.settlement, undefined, 'a cancel is not a failed settlement');
    assert.deepEqual(record.execution, { status: 'running' });
    assert.equal(fs.existsSync(path.join(assignments, unitRunId, 'unit-summary.json')), false);
    assert.deepEqual(record.bindings ?? {}, {}, 'no seat was bound');
  });
});

test('an in-process caller keeps its own signal handling: runUnit installs no SIGINT or SIGTERM handler unless the process asked', async (t) => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  t.after(() => fs.rmSync(worktreeDir, { recursive: true, force: true }));
  const counts = () => [process.listenerCount('SIGINT'), process.listenerCount('SIGTERM')];
  const before = counts();
  let during = null;
  const res = await runUnit({
    unitData: { id: 'own-handlers', capability: 'unserved:answer', objective: 'x', writes: [] },
    repoRoot, cwd: worktreeDir, onUnitRunCreated: () => { during = counts(); },
  });
  assert.equal(res.outcome, 'policy-refusal');
  assert.deepEqual(during, before);
  assert.deepEqual(counts(), before);
});

test('resume settles a pending runner record after the native commit completed', { skip: process.platform === 'win32', timeout: 90000 }, async () => {
  const { repoRoot: main, worktreeDir: tree } = setupGitRepo();
  writeScopedWorker(main, { files: { 'docs/new': 'new' } });
  const marker = path.join(main, 'commit-returned.json');
  const idFile = path.join(main, 'unit-id');
  try {
    // Observe the existing adapter seam, call the real native commit, and kill the
    // controller before runUnit can settle its pending record. No unit state is seeded.
    assert.throws(() => execFileSync(process.execPath, ['--experimental-test-module-mocks', '--input-type=module', '-'], {
      cwd: new URL('../../../', import.meta.url), encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 60000,
      input: `
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import * as commits from './src/runner/execution/commit-unit-work.mjs';
mock.module('./src/runner/execution/commit-unit-work.mjs', { namedExports: {
  ...commits,
  commitUnitWork(...args) {
    const committed = commits.commitUnitWork(...args);
    assert.equal(committed.status, 'committed', JSON.stringify(committed));
    fs.writeFileSync(${JSON.stringify(marker)}, JSON.stringify(committed));
    process.kill(process.pid, 'SIGKILL');
  },
}});
const { runUnitWithPort: runUnit } = await import('./test/helpers/run-unit-with-port.mjs');
await runUnit({repoRoot:${JSON.stringify(main)},cwd:${JSON.stringify(tree)},worktree:${JSON.stringify(tree)},pattern:'solo',
  unitData:{id:'crash',objective:'Write docs',capability:'docs:write',writes:['docs']},
  onUnitRunCreated:id => fs.writeFileSync(${JSON.stringify(idFile)},id)});
throw new Error('controller never reached the native commit');
`,
    }), error => error.signal === 'SIGKILL');
    const id = fs.readFileSync(idFile, 'utf8');
    const landed = JSON.parse(fs.readFileSync(marker, 'utf8')).sha;
    const file = path.join(main, '.fgos/assignments', id, 'unit.json');
    const pending = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.equal(pending.bindings['producer/1'][0].commitOperation.state, 'pending');
    assert.equal(pending.bindings['producer/1'][0].commit, undefined);
    assert.equal(producerSpawns(main, id), 1);
    assert.equal(headOf(tree), landed);
    const resumed = await runUnit({ repoRoot: main, cwd: tree, resumeUnitRunId: id });
    assert.equal(resumed.outcome, 'pass', JSON.stringify(resumed));
    assert.equal(resumed.results[0].commit.status, 'committed');
    assert.equal(resumed.results[0].commit.sha, landed);
    assert.deepEqual(resumed.results[0].commit.files, ['docs/new']);
    assert.equal(headOf(tree), landed);
    assert.equal(producerSpawns(main, id), 1, 'resume never launches the producer again');
    const settled = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.equal(settled.bindings['producer/1'][0].commitOperation.state, 'settled');
    assert.equal(settled.bindings['producer/1'][0].commit.status, 'committed');
    assert.equal(settled.settlement.outcome, 'pass');
  } finally {
    fs.rmSync(tree, { recursive: true, force: true });
    fs.rmSync(main, { recursive: true, force: true });
  }
});
function settleSeat(repoRoot, unitDir, role, round = '1', run = '01') {
  const runDir = path.join(unitDir, role, round, 'runs', run);
  fs.mkdirSync(runDir, { recursive: true });
  const reportPath = path.join(runDir, 'report.md');
  const reportContent = '# Report\nDone\n';
  fs.writeFileSync(reportPath, reportContent);
  const sha = crypto.createHash('sha256').update(reportContent).digest('hex');
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({
    runId: `${role}-${round}-${run}`,
    outcome: 'pass',
    settledAt: '2026-10-05T01:01:00Z',
    classification: { outcome: { category: 'ok' } },
    agentClaim: { summary: 'Done', assessment: { verdict: 'pass' } },
    settleReports: [{ path: path.relative(repoRoot, reportPath), sha256: sha }],
  }));
}

test('a pinned unit keeps its effective meaning after a catalog and a config edit', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta']);
  const unitDir = path.join(repoRoot, '.fgos', 'assignments', 'unit-run-pinned-edit');
  fs.mkdirSync(unitDir, { recursive: true });
  const record = {
    unit: { id: 'u-pinned', capability: 'code:implement', writes: [], pattern: 'reviewed', objective: 'Do review' },
    pattern: 'reviewed',
    seatSchema: 2,
    collaboration: {
      baseline: { source: 'unit', selector: 'reviewed' },
      pattern: { name: 'reviewed', layer: 'shipped', digest: 'abc123' },
      effective: {
        loop: 'reviewed',
        params: { maxRounds: 1 },
        seats: [
          { seat: 'producer', role: 'producer', posture: { writer: true } },
          { seat: 'reviewer', role: 'reviewer', posture: { readOnly: true, verdict: true } },
          { seat: 'red-team', role: 'red-team', posture: { readOnly: true, verdict: true } },
        ],
      },
      provenance: { params: {}, checkers: {} },
    },
    seats: [
      { seat: 'producer', role: 'producer', posture: { writer: true } },
      { seat: 'reviewer', role: 'reviewer', posture: { readOnly: true, verdict: true } },
      { seat: 'red-team', role: 'red-team', posture: { readOnly: true, verdict: true } },
    ],
    resolvedInputs: [],
    configSnapshot: snapshotRunnerConfig(repoRoot),
    worktree: fs.realpathSync(worktreeDir),
    createdAt: '2026-10-05T01:00:00Z',
    settlement: { outcome: 'pass', settledAt: '2026-10-05T01:01:00Z' },
  };
  fs.writeFileSync(path.join(unitDir, 'unit.json'), JSON.stringify(record));
  settleSeat(repoRoot, unitDir, 'producer');
  settleSeat(repoRoot, unitDir, 'reviewer');
  settleSeat(repoRoot, unitDir, 'red-team');

  // Edit project config
  const cfg = readProjectConfig(repoRoot);
  cfg.runner.loops = { reviewed: { maxRounds: 5 } };
  cfg.runner.patterns = { reviewed: { loop: 'reviewed', defaults: { maxRounds: 5 } } };
  writeProjectConfig(repoRoot, cfg);

  // Resume the pinned unit
  const res = await coreRunUnit({
    resumeUnitRunId: 'unit-run-pinned-edit',
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
  });
  assert.equal(res.outcome, 'pass');
  assert.equal(res.rounds, 1, 'loop received pin maxRounds 1, not edited config maxRounds 5');
  const stored = JSON.parse(fs.readFileSync(path.join(unitDir, 'unit.json'), 'utf8'));
  assert.equal(stored.collaboration.effective.params.maxRounds, 1);
  assert.equal(stored.collaboration.effective.loop, 'reviewed');
});
test('a pinned unit keeps its effective seats on resume after a snapshot refresh changes live checker config', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta']);
  const unitDir = path.join(repoRoot, '.fgos', 'assignments', 'unit-run-pinned-roster');
  fs.mkdirSync(unitDir, { recursive: true });
  const record = {
    unit: { id: 'u-pinned-roster', capability: 'docs:write', writes: [], pattern: 'reviewed', objective: 'Do review' },
    pattern: 'reviewed',
    seatSchema: 2,
    collaboration: {
      baseline: { source: 'unit', selector: 'reviewed' },
      pattern: { name: 'reviewed', layer: 'shipped', digest: 'abc123' },
      effective: {
        loop: 'reviewed',
        params: { maxRounds: 1 },
        seats: [
          { seat: 'producer', role: 'producer', posture: { writer: true } },
          { seat: 'reviewer', role: 'reviewer', posture: { readOnly: true, verdict: true } },
          { seat: 'red-team', role: 'red-team', posture: { readOnly: true, verdict: true } },
        ],
      },
      provenance: { params: {}, checkers: {} },
    },
    seats: [
      { seat: 'producer', role: 'producer', posture: { writer: true } },
      { seat: 'reviewer', role: 'reviewer', posture: { readOnly: true, verdict: true } },
      { seat: 'red-team', role: 'red-team', posture: { readOnly: true, verdict: true } },
    ],
    resolvedInputs: [],
    configSnapshot: snapshotRunnerConfig(repoRoot),
    worktree: fs.realpathSync(worktreeDir),
    createdAt: '2026-10-05T01:00:00Z',
    settlement: { outcome: 'pass', settledAt: '2026-10-05T01:01:00Z' },
  };
  fs.writeFileSync(path.join(unitDir, 'unit.json'), JSON.stringify(record));
  settleSeat(repoRoot, unitDir, 'producer');
  settleSeat(repoRoot, unitDir, 'reviewer');
  settleSeat(repoRoot, unitDir, 'red-team');

  // Change live capability config: docs:write has no default minCheckers, and live config restricts to reviewer only
  const cfg = readProjectConfig(repoRoot);
  cfg.runner.capabilities = { 'docs:write': { minCheckers: ['reviewer'] } };
  cfg.runner.loops = { reviewed: { checkersByRigor: { standard: ['reviewer'] } } };
  writeProjectConfig(repoRoot, cfg);

  const firstRes = await coreRunUnit({
    resumeUnitRunId: 'unit-run-pinned-roster',
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
  });
  assert.equal(firstRes.outcome, 'pass');
  assert.deepEqual(
    firstRes.results.map((r) => r.seat),
    ['producer', 'reviewer', 'red-team'],
    'resumed loop must execute all pinned seats from effective.seats rather than recomputed live config',
  );
  const firstStored = JSON.parse(fs.readFileSync(path.join(unitDir, 'unit.json'), 'utf8'));
  assert.deepEqual(firstStored.collaboration.effective.seats.map((s) => s.seat), ['producer', 'reviewer', 'red-team']);

});


test('resume ignores a caller --pattern', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha']);
  const unitDir = path.join(repoRoot, '.fgos', 'assignments', 'unit-run-caller-pattern');
  fs.mkdirSync(unitDir, { recursive: true });
  settleSeat(repoRoot, unitDir, 'producer');
  const record = {
    unit: { id: 'u-ignore-caller-pattern', capability: 'docs:write', writes: [], objective: 'Do solo' },
    pattern: 'solo',
    seatSchema: 2,
    collaboration: {
      pattern: { name: 'solo' },
      effective: { loop: 'solo', params: {} },
    },
    seats: [{ seat: 'producer', role: 'producer', posture: { writer: true } }],
    resolvedInputs: [],
    configSnapshot: snapshotRunnerConfig(repoRoot),
    worktree: fs.realpathSync(worktreeDir),
    createdAt: '2026-10-05T01:00:00Z',
    settlement: { outcome: 'pass', settledAt: '2026-10-05T01:01:00Z' },
  };
  fs.writeFileSync(path.join(unitDir, 'unit.json'), JSON.stringify(record));

  const res = await coreRunUnit({
    resumeUnitRunId: 'unit-run-caller-pattern',
    pattern: 'panel', // caller pattern ignored
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
  });
  assert.equal(res.outcome, 'pass');
  assert.equal(res.unitRunId, 'unit-run-caller-pattern');
  const stored = JSON.parse(fs.readFileSync(path.join(unitDir, 'unit.json'), 'utf8'));
  assert.equal(stored.collaboration.effective.loop, 'solo');
  assert.equal(stored.pattern, 'solo');
});

test('an unpinned schema-1 record resumes through the decoder', async () => {
  const { repoRoot, worktreeDir } = setupGitRepo();
  reviewedConfig(repoRoot, ['alpha', 'beta', 'gamma', 'delta']);
  const unitDir = path.join(repoRoot, '.fgos', 'assignments', 'unit-run-unpinned-schema1');
  fs.mkdirSync(unitDir, { recursive: true });
  settleSeat(repoRoot, unitDir, 'researcher-1');
  settleSeat(repoRoot, unitDir, 'researcher-2');
  settleSeat(repoRoot, unitDir, 'researcher-3');
  settleSeat(repoRoot, unitDir, 'synthesizer');
  const record = {
    unit: { id: 'u-unpinned', capability: 'code:implement', writes: [], pattern: 'research-fan-out-gated', objective: 'Do research' },
    pattern: 'research-fan-out-gated',
    seatSchema: 1,
    // No collaboration field
    seats: [
      { seat: 'researcher-1', role: 'producer', posture: { readOnly: true } },
      { seat: 'researcher-2', role: 'producer', posture: { readOnly: true } },
      { seat: 'researcher-3', role: 'producer', posture: { readOnly: true } },
      { seat: 'synthesizer', role: 'synthesizer', posture: {} },
    ],
    resolvedInputs: [],
    configSnapshot: {
      runner: {
        patterns: {
          reviewed: { maxRounds: 3 },
        },
      },
    },
    worktree: fs.realpathSync(worktreeDir),
    createdAt: '2026-10-05T01:00:00Z',
    settlement: { outcome: 'pass', settledAt: '2026-10-05T01:01:00Z' },
  };
  fs.writeFileSync(path.join(unitDir, 'unit.json'), JSON.stringify(record));

  const res = await coreRunUnit({
    resumeUnitRunId: 'unit-run-unpinned-schema1',
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
  });
  assert.equal(res.outcome, 'pass');
  // Stored research-fan-out-gated was decoded to research-fan-out (loop panel)
  const stored = JSON.parse(fs.readFileSync(path.join(unitDir, 'unit.json'), 'utf8'));
  assert.equal(stored.collaboration.pattern.name, 'research-fan-out');
  assert.equal(stored.collaboration.effective.loop, 'panel');

  // Critical rigor record with snapshot listing tester resumes with tester seat
  const critDir = path.join(repoRoot, '.fgos', 'assignments', 'unit-run-unpinned-crit');
  fs.mkdirSync(critDir, { recursive: true });
  const critRecord = {
    unit: { id: 'u-crit', capability: 'code:implement', writes: [], pattern: 'reviewed', rigor: 'critical', objective: 'Critical fix' },
    pattern: 'reviewed',
    seatSchema: 1,
    seats: [
      { seat: 'producer', role: 'producer', posture: { writer: true } },
      { seat: 'reviewer', role: 'reviewer', posture: { readOnly: true, verdict: true } },
      { seat: 'red-team', role: 'red-team', posture: { readOnly: true, verdict: true } },
      { seat: 'tester', role: 'reviewer', posture: { readOnly: true } },
    ],
    resolvedInputs: [],
    configSnapshot: {
      runner: {
        patterns: {
          reviewed: {
            checkersByRigor: {
              critical: ['reviewer', 'red-team', 'tester'],
            },
          },
        },
      },
    },
    worktree: fs.realpathSync(worktreeDir),
    createdAt: '2026-10-05T01:00:00Z',
    settlement: { outcome: 'pass', settledAt: '2026-10-05T01:01:00Z' },
  };
  fs.writeFileSync(path.join(critDir, 'unit.json'), JSON.stringify(critRecord));
  settleSeat(repoRoot, critDir, 'producer');
  settleSeat(repoRoot, critDir, 'reviewer');
  settleSeat(repoRoot, critDir, 'red-team');
  settleSeat(repoRoot, critDir, 'tester');

  const critRes = await coreRunUnit({
    resumeUnitRunId: 'unit-run-unpinned-crit',
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
  });
  assert.equal(critRes.outcome, 'pass');
  const critStored = JSON.parse(fs.readFileSync(path.join(critDir, 'unit.json'), 'utf8'));
  assert.ok(critStored.collaboration.effective.seats.some((s) => s.seat === 'tester'));

  // Second resume across a live config checker-policy change preserves the decoded pin and passes
  const critCfg = readProjectConfig(repoRoot);
  critCfg.runner.loops = { reviewed: { checkersByRigor: { critical: ['reviewer', 'red-team'] } } };
  writeProjectConfig(repoRoot, critCfg);
  const secondResume = await coreRunUnit({
    resumeUnitRunId: 'unit-run-unpinned-crit',
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
  });
  assert.equal(secondResume.outcome, 'pass');
  const secondStored = JSON.parse(fs.readFileSync(path.join(critDir, 'unit.json'), 'utf8'));
  assert.ok(secondStored.collaboration.effective.seats.some((s) => s.seat === 'tester'), 'tester seat preserved across second resume');
});

test('the account inventory is read from the config on every call, so an account added while a unit runs is seen by the next bind', () => {
  const root = makeFixtureDir('fgos-run-inventory-root-');
  const home = makeFixtureDir('fgos-run-inventory-home-');
  writeProjectConfig(root, { runner: { executor: { command: 'claude', args: ['{prompt}'] }, modelPolicies: { openai: {} } } });
  const accountsOf = (inventory) => Object.keys(inventory.llmAccounts?.openai ?? {});
  withHome(home, () => {
    writeAccountsFile(path.join(home, '.fgos'), { llmAccounts: { openai: { first: { credentialStore: { codex: '/srv/codex-first' } } } } });
    assert.deepEqual(accountsOf(readAccountInventory(root)), ['first']);
    writeAccountsFile(path.join(home, '.fgos'), { llmAccounts: { openai: { first: { credentialStore: { codex: '/srv/codex-first' } }, second: { credentialStore: { codex: '/srv/codex-second' } } } } });
    assert.deepEqual(accountsOf(readAccountInventory(root)), ['first', 'second']);
    const supplied = { llmAccounts: { openai: { only: {} } } };
    assert.deepEqual(accountsOf(readAccountInventory(root, supplied)), ['only'], 'a config the caller supplied is its own inventory');
  });
});
