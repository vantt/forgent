// test/runner/driver-rununit.test.mjs — A Work driver step runs as a Unit through runUnit, and the
// next driver pass finds its verdict on disk by itself (no lastRunResult handed over).

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

import { chooseStageOperation, executeDriverOperationChoice } from '../../src/runner/operation-choice.mjs';
import { runUnit } from '../../src/runner/execution/run.mjs';
import { digestPinnedInputs } from '../../src/runner/dispatch/assignment-runner.mjs';
import { operationsForStep, getDomain } from '../../src/state/domain-registry.mjs';
import { RunnerConfigError } from '../../src/runner/dispatch/config.mjs';
import { seedFileLocalBwrapRegistry } from './confinement-registry-fixture.helper.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';

seedFileLocalBwrapRegistry();

const DOCS_REF = 'docs/history/driver-rununit-fixture';
const PLAN = '# Plan\n\nMode: small\n\n## Approach\nChange src/main.mjs.\n';

// A worker that answers validate-plan READY with a full reality gate, or (WORKER_MODE=write)
// writes one file in its worktree and reports done.
const WORKER = `
import fs from 'node:fs';
import path from 'node:path';
const prompt = process.argv.slice(2).join(' ');
const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
if (!match) process.exit(0);
const claimDir = path.dirname(match[1]);
const outbox = path.join(claimDir, 'worker-output', 'outbox');
const dir = fs.existsSync(outbox) ? outbox : claimDir;
fs.mkdirSync(dir, { recursive: true });
if (process.env.FGOS_FIXTURE_WORKER_MODE === 'write' || prompt.includes('scoped-subtask')) {
  fs.writeFileSync('feature.txt', 'feature\\n');
  fs.writeFileSync(path.join(dir, 'agent-report.md'), '# Report\\nWrote feature.txt (citation: src/main.mjs:L1)\\n');
  fs.writeFileSync(path.join(dir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Wrote feature.txt', evidenceRefs: ['feature.txt'] }));
  process.exit(0);
}
const cite = 'PASS (citation: src/main.mjs:L1)';
fs.writeFileSync(path.join(dir, 'agent-report.md'), '# Reality Gate Validation & Feasibility Matrix Report\\n## Reality Gate Score\\n- Mode fit: ' + cite + '\\n- Repo fit: ' + cite + '\\n- Assumptions: ' + cite + '\\n- Smaller path: ' + cite + '\\n- Proof surface: ' + cite + '\\n- Impact-analysis posture: ' + cite + '\\n## Feasibility Matrix\\n- Feasibility matrix: verified (citation: src/main.mjs:L1).\\nPlan holds up under reality check.\\n');
fs.writeFileSync(path.join(dir, 'agent-result.json'), JSON.stringify({
  status: 'done', summary: 'Plan is feasible', verdict: 'READY',
  realityGate: { 'mode-fit': cite, 'repo-fit': cite, 'assumptions-fit': cite, 'smaller-path-fit': cite, 'proof-surface-fit': cite, 'impact-analysis-posture': cite },
  feasibilityMatrix: [{ risk: 'Risk 1', rating: 'Low', citation: 'src/main.mjs:L1' }],
}));
`;

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function setupRepo({ capabilities } = {}) {
  const repo = makeFixtureDir('fgos-driver-rununit-');
  git(repo, ['init', '-b', 'main']);
  git(repo, ['config', 'user.name', 'Test']);
  git(repo, ['config', 'user.email', 'test@test.local']);
  fs.mkdirSync(path.join(repo, 'src'), { recursive: true });
  fs.writeFileSync(path.join(repo, 'src', 'main.mjs'), '// main\n');
  fs.writeFileSync(path.join(repo, 'README.md'), '# t\n');
  const specs = path.join(repo, 'domains', 'coding', 'task-specs');
  fs.mkdirSync(specs, { recursive: true });
  for (const spec of ['validate-plan', 'scout-blast-radius', 'scoped-subtask']) fs.writeFileSync(path.join(specs, `${spec}.md`), `# ${spec}\n`);
  fs.writeFileSync(path.join(repo, '.gitignore'), '.fgos/\n');
  git(repo, ['add', '.']);
  git(repo, ['commit', '-m', 'initial']);

  const scriptDir = makeFixtureDir('fgos-driver-rununit-bin-');
  const script = path.join(scriptDir, 'worker.mjs');
  fs.writeFileSync(script, WORKER);
  const executor = {
    kind: 'agent',
    allowCrossProvider: true,
    command: process.execPath,
    args: [script, '{prompt}'],
    providerModel: 'node',
    invocations: [{ id: 'cli-default', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command: process.execPath, args: [script, '{prompt}'] }],
  };
  const pool = { prefer: [{ executor: 'fake' }], rigor: 'standard' };
  const runner = {
    defaultExecutor: 'fake',
    rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
    modelPolicies: { node: { nano: 'node-nano', standard: 'node-std', flagship: 'node-flagship', frontier: 'node-frontier' } },
    executors: { fake: executor },
    capabilities: capabilities ?? { review: pool, 'coding:review': pool, implement: pool, 'code:implement': pool },
    timeoutMs: 60000,
  };
  fs.mkdirSync(path.join(repo, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(repo, '.fgos', 'config.json'), JSON.stringify({ runner }, null, 2));
  return { repo, runner };
}

function writePlan(root, content = PLAN) {
  const dir = path.join(root, DOCS_REF);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'plan.md'), content);
  return path.join(dir, 'plan.md');
}

function workItem(id, extra = {}) {
  return { id, status: 'doing', workflowStep: 'planning', domain: 'coding', workflow: 'feature', docsRef: DOCS_REF, ...extra };
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function unitJson(repo, unitRunId) {
  return JSON.parse(fs.readFileSync(path.join(repo, '.fgos', 'assignments', unitRunId, 'unit.json'), 'utf8'));
}

test('full cycle: the driver runs validate-plan through runUnit and the next pass finds the verdict itself; an edited plan is not consumed', async () => {
  const { repo, runner } = setupRepo();
  const planPath = writePlan(repo);
  const work = workItem('tsk-drv-cycle');

  const first = chooseStageOperation({ work, stage: 'planning', repoRoot: repo });
  assert.equal(first.operation, 'validate-plan');
  assert.equal(first.reason, 'plan-written-needs-reality-check');

  const outcome = await executeDriverOperationChoice(work, first, { repoRoot: repo, cwd: repo, runnerConfig: runner });
  assert.equal(outcome.executed, true);
  assert.match(outcome.unitRunId, /^unit-run-/);
  assert.equal(outcome.runResult.assignmentId, `${outcome.unitRunId}/producer/1`);
  assert.equal(outcome.canAdvanceEdge, true, outcome.reason);

  // The seat's assignment carries the operation's stamp; the digest of plan.md was taken at launch.
  const asgn = JSON.parse(fs.readFileSync(path.join(repo, '.fgos', 'assignments', outcome.unitRunId, 'producer', '1', 'assignment.json'), 'utf8'));
  assert.equal(asgn.workId, 'tsk-drv-cycle');
  assert.equal(asgn.stage, 'planning');
  assert.equal(asgn.operation, 'validate-plan');
  assert.equal(asgn.role, 'reviewer');
  assert.equal(asgn.resultKind, 'gate-verdict');
  assert.equal(asgn.provenance.kind, 'unit-run');
  assert.equal(asgn.provenance.role, 'producer');
  const digest = outcome.runResult.inputDigests.find((d) => d.rel === `${DOCS_REF}/plan.md`);
  assert.equal(digest.sha256, sha256(planPath));

  // A separate pass, given nothing: it finds the verdict on disk and may take the edge.
  const second = chooseStageOperation({ work, stage: 'planning', repoRoot: repo });
  assert.equal(second.reason, 'validation-passed-ready-for-planning-edge');
  assert.equal(second.canAdvanceEdge, true);

  // The plan changes after validation: the verdict is stale and not consumed.
  fs.appendFileSync(planPath, '\nOne more step.\n');
  const third = chooseStageOperation({ work, stage: 'planning', repoRoot: repo });
  assert.equal(third.reason, 'plan-written-needs-reality-check');
  assert.equal(third.canAdvanceEdge, false);
});

test('plan.md only in the item worktree, validate-plan read from the state root: the digest matches by rel and the verdict is consumed', async () => {
  const { repo, runner } = setupRepo();
  const id = 'tsk-drv-wt';
  const wt = makeFixtureDir('fgos-driver-rununit-wt-');
  fs.rmSync(wt, { recursive: true, force: true });
  git(repo, ['worktree', 'add', '-b', `fgw/${id}`, wt]);
  writePlan(wt);
  const work = workItem(id);

  const choice = chooseStageOperation({ work, stage: 'planning', repoRoot: repo });
  assert.equal(choice.operation, 'validate-plan');
  const outcome = await executeDriverOperationChoice(work, choice, { repoRoot: repo, runnerConfig: runner });
  assert.equal(outcome.canAdvanceEdge, true, outcome.reason);
  // The read-only unit ran where the plan lives.
  assert.equal(unitJson(repo, outcome.unitRunId).worktree, fs.realpathSync(wt));
  const digest = outcome.runResult.inputDigests[0];
  assert.equal(digest.root, fs.realpathSync(wt));
  assert.equal(digest.rel, `${DOCS_REF}/plan.md`);

  const next = chooseStageOperation({ work, stage: 'planning', repoRoot: repo });
  assert.equal(next.reason, 'validation-passed-ready-for-planning-edge');

  // The same bytes merged into the main checkout still match: the comparison is by rel + digest.
  writePlan(repo);
  fs.rmSync(path.join(wt, DOCS_REF), { recursive: true, force: true });
  const merged = chooseStageOperation({ work, stage: 'planning', repoRoot: repo });
  assert.equal(merged.reason, 'validation-passed-ready-for-planning-edge');
});

test('a stored result with only the legacy planContentHash, in the flat layout, is still found and checked', async () => {
  const { repo, runner } = setupRepo();
  const planPath = writePlan(repo);
  const work = workItem('tsk-drv-legacy');
  const outcome = await executeDriverOperationChoice(work, chooseStageOperation({ work, stage: 'planning', repoRoot: repo }), { repoRoot: repo, cwd: repo, runnerConfig: runner });
  assert.equal(outcome.canAdvanceEdge, true, outcome.reason);

  // Rewrite the nested run as an old flat assignment that recorded planContentHash only.
  const nestedDir = path.join(repo, '.fgos', 'assignments', outcome.unitRunId, 'producer', '1');
  const flatId = 'tsk-drv-legacy--planning--validate-plan--1';
  const flatDir = path.join(repo, '.fgos', 'assignments', flatId);
  fs.cpSync(nestedDir, flatDir, { recursive: true });
  fs.rmSync(path.join(repo, '.fgos', 'assignments', outcome.unitRunId), { recursive: true, force: true });
  const resultFile = path.join(flatDir, 'runs', '01', 'result.json');
  // Every recorded path names the run dir it was read from; move them all to the flat id.
  const result = JSON.parse(fs.readFileSync(resultFile, 'utf8').split(`${outcome.unitRunId}/producer/1`).join(flatId));
  const oldRunId = `run_${outcome.unitRunId}/producer/1_01`;
  const newRunId = `run_${flatId}_01`;
  delete result.inputDigests;
  result.planContentHash = sha256(planPath);
  fs.writeFileSync(resultFile, JSON.stringify(result, null, 2));
  const runJson = path.join(flatDir, 'runs', '01', 'run.json');
  const meta = JSON.parse(fs.readFileSync(runJson, 'utf8'));
  fs.writeFileSync(runJson, JSON.stringify({ ...meta, runId: newRunId }, null, 2));
  assert.notEqual(oldRunId, newRunId);

  assert.equal(chooseStageOperation({ work, stage: 'planning', repoRoot: repo }).reason, 'validation-passed-ready-for-planning-edge');
  fs.appendFileSync(planPath, 'edit\n');
  assert.equal(chooseStageOperation({ work, stage: 'planning', repoRoot: repo }).reason, 'plan-written-needs-reality-check');
});

test('the walker never takes another operation of the same item for the validate-plan verdict', async () => {
  const { repo, runner } = setupRepo();
  writePlan(repo);
  const work = workItem('tsk-drv-two-ops');
  const ops = operationsForStep(getDomain('coding'), 'planning');
  const scout = ops.find((o) => o.id === 'scout-blast-radius');
  const outcome = await executeDriverOperationChoice(work, { operation: 'validate-plan', dispatch: 'assignment', stage: 'planning' }, { repoRoot: repo, cwd: repo, runnerConfig: runner });
  assert.equal(outcome.canAdvanceEdge, true, outcome.reason);
  // A read-only scout of the same item, run later, whose assignment says resultKind gate-verdict
  // would only reach the walker if the operation filter were missing.
  const scoutRun = await runUnit({
    unitData: { id: 'scout', objective: 'scout', capability: 'review', writes: [], pattern: 'solo' },
    declared: { workId: work.id, domain: 'coding', workflow: 'feature', stage: 'planning', operation: scout.id, operations: ops },
    repoRoot: repo, cwd: repo, worktree: repo,
    session: { headless: true, herdrPresent: false },
  });
  const scoutAsgnFile = path.join(repo, '.fgos', 'assignments', scoutRun.unitRunId, 'producer', '1', 'assignment.json');
  const scoutAsgn = JSON.parse(fs.readFileSync(scoutAsgnFile, 'utf8'));
  assert.equal(scoutAsgn.operation, 'scout-blast-radius');
  assert.equal(scoutAsgn.resultKind, 'advisory');
  fs.writeFileSync(scoutAsgnFile, JSON.stringify({ ...scoutAsgn, resultKind: 'gate-verdict' }, null, 2));
  const next = chooseStageOperation({ work, stage: 'planning', repoRoot: repo });
  assert.equal(next.reason, 'validation-passed-ready-for-planning-edge');
});

test('an operation the step does not declare, or a human-only one, is refused before anything is spawned', async () => {
  const { repo } = setupRepo();
  const ops = operationsForStep(getDomain('coding'), 'planning');
  const before = fs.existsSync(path.join(repo, '.fgos', 'assignments')) ? fs.readdirSync(path.join(repo, '.fgos', 'assignments')) : [];
  const unitData = { id: 'u', objective: 'x', capability: 'review', writes: [], pattern: 'solo' };
  const base = { workId: 'w', domain: 'coding', workflow: 'feature', stage: 'planning' };
  await assert.rejects(
    runUnit({ unitData, declared: { ...base, operation: 'implement-item', operations: ops }, repoRoot: repo, cwd: repo, worktree: repo, session: { headless: true, herdrPresent: false } }),
    (err) => err instanceof RunnerConfigError && /unknown operation "implement-item"/.test(err.message),
  );
  const humanOps = ops.map((o) => (o.id === 'validate-plan' ? { ...o, dispatch: 'human-only' } : o));
  await assert.rejects(
    runUnit({ unitData, declared: { ...base, operation: 'validate-plan', operations: humanOps }, repoRoot: repo, cwd: repo, worktree: repo, session: { headless: true, herdrPresent: false } }),
    (err) => err instanceof RunnerConfigError && /human-only/.test(err.message),
  );
  // A read-only operation on a unit that writes, and a non-solo pattern, are refused the same way.
  await assert.rejects(
    runUnit({ unitData: { ...unitData, writes: ['src/**'] }, declared: { ...base, operation: 'validate-plan', operations: ops }, repoRoot: repo, cwd: repo, worktree: repo, session: { headless: true, herdrPresent: false } }),
    (err) => err instanceof RunnerConfigError && /read-only but the unit declares writes/.test(err.message),
  );
  await assert.rejects(
    runUnit({ unitData: { ...unitData, pattern: 'reviewed' }, declared: { ...base, operation: 'validate-plan', operations: ops }, repoRoot: repo, cwd: repo, worktree: repo, session: { headless: true, herdrPresent: false } }),
    (err) => err instanceof RunnerConfigError && /runs solo/.test(err.message),
  );
  const after = fs.existsSync(path.join(repo, '.fgos', 'assignments')) ? fs.readdirSync(path.join(repo, '.fgos', 'assignments')) : [];
  assert.deepEqual(after, before);
});

test('stopped, human-only and direct-stage-skill choices never spawn a unit', async () => {
  const { repo, runner } = setupRepo();
  const work = workItem('tsk-drv-nospawn');
  for (const choice of [
    { operation: 'validate-plan', dispatch: 'assignment', stop: true, reason: 'stopped' },
    { operation: 'validate-plan', dispatch: 'human-only' },
    { operation: 'shape-plan', dispatch: 'direct-stage-skill' },
  ]) {
    const outcome = await executeDriverOperationChoice(work, choice, { repoRoot: repo, cwd: repo, runnerConfig: runner });
    assert.equal(outcome.unitRunId, undefined);
  }
  assert.equal(fs.existsSync(path.join(repo, '.fgos', 'assignments')), false);
});

test('rigor: each Work source reaches the assignment policy and is never lowered', async () => {
  const cases = [
    { name: 'work.rigor high', extra: { rigor: 'high' }, expect: 'high' },
    { name: 'risk heavy without rigor', extra: { risk: 'heavy' }, expect: 'high' },
    { name: 'operation policy rigor (validate-plan: standard)', extra: {}, expect: 'standard' },
  ];
  for (const c of cases) {
    const { repo, runner } = setupRepo();
    writePlan(repo);
    const work = workItem(`tsk-drv-rigor-${c.expect}-${Object.keys(c.extra)[0] ?? 'op'}`, c.extra);
    const outcome = await executeDriverOperationChoice(work, { operation: 'validate-plan', dispatch: 'assignment', stage: 'planning' }, { repoRoot: repo, cwd: repo, runnerConfig: runner });
    assert.equal(unitJson(repo, outcome.unitRunId).unit.rigor, c.expect, c.name);
    const asgn = JSON.parse(fs.readFileSync(path.join(repo, '.fgos', 'assignments', outcome.unitRunId, 'producer', '1', 'assignment.json'), 'utf8'));
    assert.equal(asgn.policy.rigor, c.expect, c.name);
    const tier = runner.rigorToTier[c.expect];
    assert.equal(asgn.policy.tier, tier, c.name);
  }
});

test('a mutating operation runs in the item worktree and only the runner commits', async () => {
  const { repo, runner } = setupRepo();
  const id = 'tsk-drv-mut';
  const wt = makeFixtureDir('fgos-driver-rununit-mut-');
  fs.rmSync(wt, { recursive: true, force: true });
  git(repo, ['worktree', 'add', '-b', `fgw/${id}`, wt]);
  const work = workItem(id, { workflowStep: 'executing', docsRef: undefined });
  const before = git(wt, ['rev-parse', 'HEAD']).trim();
  const outcome = await executeDriverOperationChoice(work, { operation: 'scoped-subtask', dispatch: 'assignment', stage: 'executing', expectedFiles: ['feature.txt'] }, { repoRoot: repo, cwd: wt, runnerConfig: runner });
  assert.equal(unitJson(repo, outcome.unitRunId).worktree, fs.realpathSync(wt));
  assert.equal(outcome.commit?.status, 'committed', JSON.stringify(outcome.commit ?? outcome.reason));
  const after = git(wt, ['rev-parse', 'HEAD']).trim();
  assert.notEqual(after, before);
  assert.deepEqual(git(wt, ['show', '--name-only', '--format=', 'HEAD']).trim().split('\n'), ['feature.txt']);
  assert.equal(git(repo, ['rev-parse', 'main']).trim(), before, 'the main branch is untouched');
});

test('a read-only validate-plan result that shows a correlated change in its checkout does not advance Work', async () => {
  const { repo, runner } = setupRepo();
  writePlan(repo);
  const work = workItem('tsk-drv-correlated');
  const outcome = await executeDriverOperationChoice(work, { operation: 'validate-plan', dispatch: 'assignment', stage: 'planning' }, { repoRoot: repo, cwd: repo, runnerConfig: runner });
  assert.equal(outcome.canAdvanceEdge, true, outcome.reason);
  // The stored (nested) result now records a file the read-only round changed.
  const resultFile = path.join(repo, '.fgos', 'assignments', outcome.unitRunId, 'producer', '1', 'runs', '01', 'result.json');
  const result = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
  result.evidence = { ...(result.evidence ?? {}), changedFiles: ['src/main.mjs'] };
  fs.writeFileSync(resultFile, JSON.stringify(result, null, 2));
  const next = chooseStageOperation({ work, stage: 'planning', repoRoot: repo });
  assert.equal(next.canAdvanceEdge, false);
  assert.equal(next.reason, 'validation-correlated-mutation-do-not-advance-work');
});

test('pinned inputs: outside the allowed roots, or a symlink pointing out, are recorded with a null digest and never read', () => {
  const { repo } = setupRepo();
  const outside = makeFixtureDir('fgos-driver-rununit-outside-');
  const secret = path.join(outside, 'secret.md');
  fs.writeFileSync(secret, 'secret\n');
  const link = path.join(repo, 'link.md');
  fs.symlinkSync(secret, link);
  const inside = writePlan(repo);
  const digests = digestPinnedInputs([secret, link, inside, path.join(repo, 'missing.md')], repo);
  assert.deepEqual(digests.map((d) => d.sha256 === null), [true, true, false, true]);
  assert.equal(digests[0].warning, 'pin-outside-allowed-roots');
  assert.equal(digests[1].warning, 'pin-outside-allowed-roots');
  assert.equal(digests[2].rel, `${DOCS_REF}/plan.md`);
  assert.equal(digests[0].rel, undefined);
});

test('declared and pinInputs come back from unit.json on resume, never from the caller', async () => {
  const { repo, runner } = setupRepo();
  const planPath = writePlan(repo);
  const work = workItem('tsk-drv-resume');
  const outcome = await executeDriverOperationChoice(work, { operation: 'validate-plan', dispatch: 'assignment', stage: 'planning' }, { repoRoot: repo, cwd: repo, runnerConfig: runner });
  const record = unitJson(repo, outcome.unitRunId);
  assert.equal(record.declared.operation, 'validate-plan');
  assert.deepEqual(record.pinInputs, [planPath]);
  // A resume that names another operation and another file is not believed.
  const resumed = await runUnit({
    resumeUnitRunId: outcome.unitRunId,
    declared: { workId: 'other', domain: 'coding', stage: 'executing', operation: 'implement-item', operations: [] },
    pinInputs: ['/etc/hostname'],
    repoRoot: repo, cwd: repo, worktree: repo,
    session: { headless: true, herdrPresent: false },
  });
  const again = unitJson(repo, resumed.unitRunId);
  assert.equal(again.declared.operation, 'validate-plan');
  assert.deepEqual(again.pinInputs, [planPath]);
  void runner;
});

test('a mutating operation whose runner commit fails never lets the driver proceed', async () => {
  const { repo, runner } = setupRepo();
  const id = 'tsk-drv-commit-fail';
  const wt = makeFixtureDir('fgos-driver-rununit-hook-');
  fs.rmSync(wt, { recursive: true, force: true });
  git(repo, ['worktree', 'add', '-b', `fgw/${id}`, wt]);
  // The runner takes hooks from the main checkout's gitdir: a pre-commit that refuses fails the commit.
  const hook = path.join(repo, '.git', 'hooks', 'pre-commit');
  fs.writeFileSync(hook, '#!/bin/sh\nexit 1\n');
  fs.chmodSync(hook, 0o755);
  const work = workItem(id, { workflowStep: 'executing', docsRef: undefined });
  const outcome = await executeDriverOperationChoice(work, { operation: 'scoped-subtask', dispatch: 'assignment', stage: 'executing', expectedFiles: ['feature.txt'] }, { repoRoot: repo, cwd: wt, runnerConfig: runner });
  assert.equal(outcome.commit?.status, 'failed');
  assert.equal(outcome.canProceed, false);
  assert.equal(outcome.stop, true);
  assert.equal(outcome.reason, 'unit-commit-failed');
});

test('a pinned input in a worktree nested inside the main checkout is recorded against that worktree', () => {
  const { repo } = setupRepo();
  const wt = path.join(repo, '.claude', 'worktrees', 'w1');
  git(repo, ['worktree', 'add', '-b', 'nested-wt', wt]);
  const plan = writePlan(wt);
  const [digest] = digestPinnedInputs([plan], repo);
  assert.equal(digest.root, fs.realpathSync(wt));
  assert.equal(digest.rel, `${DOCS_REF}/plan.md`);
});
