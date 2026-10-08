import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { loadWorkflow, startWorkflow, answerWorkflow } from '../../src/workflow/index.mjs';
import { withProviderFamilies } from '../helpers/provider-families.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';

seedFileLocalBwrapRegistry();

// Mock only the external worker, leaving settlement, bounded review, report handoff,
// and the registered Workflow's real advance/projector in the execution path.
function fixture(t, mode) {
  const root = makeFixtureDir('fgos-advisory-m-');
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const args of [
    ['init', '-b', 'main'], ['config', 'user.name', 'Workflow Contract'],
    ['config', 'user.email', 'workflow@test.local'],
  ]) execFileSync('git', args, { cwd: root, stdio: 'ignore' });
  fs.writeFileSync(path.join(root, 'README.md'), '# Throwaway workflow fixture\n');
  execFileSync('git', ['add', 'README.md'], { cwd: root, stdio: 'ignore' });
  execFileSync('git', ['commit', '-m', 'fixture'], { cwd: root, stdio: 'ignore' });
  const worker = path.join(root, 'worker.mjs');
  fs.writeFileSync(worker, `
    import fs from 'node:fs';
    import path from 'node:path';
    const prompt = process.argv[2];
    const target = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt)?.[1];
    if (!target) throw new Error('missing output contract');
    const reviewer = target.split(path.sep).includes('reviewer');
    if (reviewer && ${JSON.stringify(mode)} === 'transport-failure') process.exit(19);
    const base = path.dirname(target);
    const outbox = path.join(base, 'worker-output', 'outbox');
    const output = fs.existsSync(outbox) ? outbox : base;
    fs.mkdirSync(output, { recursive: true });
    const packet = {
      verdict: 'Prefer the reversible boundary',
      'missing expertise': ['security architecture', 'operations'],
      dissent: ['M-CONTRACT-DISSENT: residual isolation risk remains unresolved'],
      lens: ['SYSTEM', 'ALTERNATIVE', 'CONSTRAINT'].find((name) => prompt.includes(name + ' LENS:')) ?? null,
    };
    // Different explanation content proves that the gate reads synthesis, not
    // a last-step report or reviewer's competing packet.
    if (prompt.includes('Explain the settled final packet')) packet['missing expertise'] = [];
    if (reviewer) packet['missing expertise'] = ['not the producer packet'];
    fs.writeFileSync(path.join(output, 'agent-report.md'), JSON.stringify(packet));
    fs.writeFileSync(path.join(output, 'agent-result.json'), JSON.stringify(reviewer ? {
      contract: { id: 'agent-result-claim', version: 2 },
      status: 'done', summary: 'M-CONTRACT-DISSENT survives review',
      assessment: { verdict: 'findings', severityFloor: 'high' },
      evidenceRefs: ['review:M-CONTRACT-DISSENT'],
    } : { status: 'done', summary: 'Settled packet with explicit dissent' }));
  `);
  const capabilities = {};
  for (const name of [
    'architecture:frame', 'architecture:shape', 'architecture:critique',
    'architecture:synthesize', 'architecture:explain', 'business:frame',
    'business:perspectives', 'business:critique', 'business:synthesize', 'business:plan',
    'group-cognition:explore', 'group-cognition:critique', 'group-cognition:synthesize',
    'coding:validate', 'coding:implement', 'marketing:research', 'marketing:write',
    'marketing:publish',
  ]) capabilities[name] = { prefer: [{ executor: 'test-node' }], rigor: 'standard' };
  const cfg = withProviderFamilies({ runner: {
    defaultExecutor: 'test-node',
    rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
    modelPolicies: { node: { standard: 'node-std', flagship: 'node-high' } },
    executors: { 'test-node': {
      kind: 'agent', allowCrossProvider: true, command: process.execPath,
      args: [worker, '{prompt}'], providerModel: 'node',
      invocations: [{ id: 'cli-default', via: 'cli', adapter: 'cli-spawn',
        confinement: { backend: 'bwrap' }, command: process.execPath, args: [worker, '{prompt}'] }],
    } },
    capabilities,
    patterns: {
      defaultRule: { mutatingMinRigor: 'standard' },
      reviewed: { maxRounds: 2, checkersByRigor: {
        standard: ['reviewer'], high: ['reviewer'],
      } },
    },
  } });
  fs.mkdirSync(path.join(root, '.fgos'));
  fs.writeFileSync(path.join(root, '.fgos', 'config.json'), JSON.stringify(cfg));
  return root;
}

function assignment(root, unit, role = 'producer', round = 1) {
  return JSON.parse(fs.readFileSync(path.join(root, '.fgos', 'assignments',
    unit.unitRunId, role, String(round), 'assignment.json'), 'utf8'));
}

for (const flow of [
  { id: 'business-discussion', review: 'critique', unit: 'challenge-assumptions',
    downstream: 'synthesis', synthesis: 'synthesize-strategy', gate: 'approval' },
  { id: 'group-cognition', review: 'dialectical-inquiry', unit: 'dialectical-critique',
    downstream: 'action-synthesis', synthesis: 'synthesize-action' },
  { id: 'architecture-advisory', review: 'critique', unit: 'critique-proposals',
    downstream: 'synthesis', synthesis: 'synthesize-recommendation', gate: 'close' },
  { id: 'marketing/content-publish', review: 'draft', unit: 'draft-copy',
    downstream: 'approval', gate: 'approval' },
]) {
  test(`${flow.id}: bounded findings reach synthesis/gate; transport failure blocks`, async (t) => {
    const workflow = loadWorkflow(flow.id);
    const root = fixture(t, 'findings');
    const state = await startWorkflow({ workflow, repoRoot: root, cwd: root, worktree: root,
      request: 'Consider a reversible design while preserving dissent' });
    const reviewed = state.steps[flow.review].units[flow.unit];
    assert.equal(state.steps[flow.review].status, 'completed');
    assert.equal(reviewed.outcome, 'findings', 'accepted is not converted into pass');
    assert.equal(reviewed.results.filter((r) => r.role === 'reviewer').length, 2,
      'findings survive both rounds of the real bounded reviewed pattern');
    for (const record of reviewed.results.filter((r) => r.role === 'reviewer')) {
      assert.equal(record.runResult.classification.execution.status, 'completed');
      assert.equal(record.runResult.classification.assessment.verdict, 'findings');
      assert.equal(record.runResult.classification.failure, null);
      assert.equal(record.runResult.agentClaim.status, 'done');
    }
    assert.equal(state.steps[flow.downstream].status, flow.synthesis ? 'completed' : 'parked');
    const synthesis = flow.synthesis ? state.steps[flow.downstream].units[flow.synthesis] : null;
    if (synthesis) {
      const refs = assignment(root, synthesis).contextRefs;
      const reviewerRefs = refs.filter((ref) => ref.includes(`/${reviewed.unitRunId}/reviewer/`));
      assert.ok(reviewerRefs.length > 0, 'downstream receives the actual settled reviewer report');
      for (const ref of reviewerRefs) assert.match(fs.readFileSync(ref, 'utf8'), /M-CONTRACT-DISSENT/);
    }
    if (flow.gate) {
      assert.equal(state.status, 'parked');
      assert.equal(state.steps[flow.gate].status, 'parked');
      assert.equal(state.questions[0].stepId, flow.gate);
    } else assert.equal(state.status, 'completed');
    if (flow.id === 'architecture-advisory') {
      const shaping = state.steps.shaping.units['shape-proposals'];
      const lenses = [];
      for (const role of ['panelist-1', 'panelist-2', 'panelist-3']) {
        const seat = shaping.results.find((result) => result.role === role);
        const report = seat.runResult.settleReports[0];
        const packet = JSON.parse(fs.readFileSync(path.resolve(root, report.path), 'utf8'));
        lenses.push(packet.lens);
      }
      assert.deepEqual(lenses, ['SYSTEM', 'ALTERNATIVE', 'CONSTRAINT'],
        'real panel dispatch gives each settled seat a distinct fixed lens');
      assert.equal(synthesis.outcome, 'findings');
      assert.equal(state.steps.explanation.status, 'completed');
      assert.match(state.questions[0].question, /\["security architecture","operations"\]/);
      assert.doesNotMatch(state.questions[0].question, /not the producer packet|\{\{report:/);
      for (const role of ['reviewer', 'red-team']) {
        const checker = assignment(root, synthesis, role, 2);
        const producerRefs = checker.contextRefs.filter((ref) =>
          ref.includes(`/${synthesis.unitRunId}/producer/2/`));
        assert.ok(producerRefs.length > 0, `${role} sees the final producer packet`);
        for (const ref of producerRefs) {
          const packet = JSON.parse(fs.readFileSync(ref, 'utf8'));
          assert.deepEqual(packet['missing expertise'], ['security architecture', 'operations']);
        }
      }
    }

    const failedRoot = fixture(t, 'transport-failure');
    const failed = await startWorkflow({ workflow, repoRoot: failedRoot, cwd: failedRoot, worktree: failedRoot });
    assert.equal(failed.status, 'failed');
    assert.equal(failed.steps[flow.review].status, 'failed');
    assert.notEqual(failed.steps[flow.review].units[flow.unit].outcome, 'findings');
    assert.equal(failed.steps[flow.downstream].status, 'pending');
    if (flow.synthesis) assert.equal(failed.steps[flow.downstream].units[flow.synthesis], undefined);
    assert.equal(failed.questions.length, 0, 'transport failure never reaches the human gate');
  });
}

for (const [stepId, unitId] of [['planning', 'validate-plan'], ['executing', 'implement-item']]) {
  test(`coding/feature ${unitId}: done reviewer findings cause one revision then fail the step`, async (t) => {
    const root = fixture(t, 'findings');
    const definition = loadWorkflow('coding/feature');
    const registeredUnit = definition.steps.find((step) => step.id === stepId).units.find((unit) => unit.id === unitId);
    const state = await startWorkflow({ repoRoot: root, cwd: root, workflow: {
      id: definition.id, steps: [
        { id: stepId, units: [registeredUnit] },
        { id: 'after-review', dependsOn: [stepId], gate: { kind: 'human', question: 'Approve delivery?' } },
      ],
    } });
    const reviewed = state.steps[stepId].units[unitId];
    assert.equal(state.status, 'failed');
    assert.equal(reviewed.outcome, 'findings');
    assert.equal(state.steps['after-review'].status, 'pending');
    assert.deepEqual(reviewed.results.filter((r) => r.role === 'producer').map((r) => r.round), [1, 2]);
    for (const record of reviewed.results.filter((r) => r.role === 'reviewer')) {
      assert.equal(record.runResult.agentClaim.status, 'done');
      assert.equal(record.runResult.classification.execution.status, 'completed');
      assert.equal(record.runResult.classification.assessment.verdict, 'findings');
      assert.equal(record.runResult.classification.failure, null);
    }
  });
}

test('registered advisory reopen preserves done reviewer findings through explanation and owner close', async (t) => {
  const root = fixture(t, 'findings');
  const parent = await startWorkflow({ repoRoot: root, cwd: root, workflow: loadWorkflow('architecture-advisory') });
  assert.equal((await answerWorkflow(parent.workflowRunId, { repoRoot: root, cwd: root, stepId: 'close', answer: 'Keep the expertise limitation explicit.' })).status, 'completed');
  const parentUnit = parent.steps.synthesis.units['synthesize-recommendation'].unitRunId;
  const reopened = await startWorkflow({ repoRoot: root, cwd: root, workflow: loadWorkflow('architecture-advisory-reopen'),
    contextRefs: [`unit-run:${parentUnit}/producer`] });
  const synthesis = reopened.steps.synthesis.units['synthesize-recommendation'];
  assert.equal(synthesis.outcome, 'findings');
  assert.equal(reopened.steps.explanation.status, 'completed');
  assert.equal(reopened.status, 'parked');
  for (const record of synthesis.results.filter((r) => r.role === 'reviewer')) {
    assert.equal(record.runResult.agentClaim.status, 'done');
    assert.equal(record.runResult.classification.assessment.verdict, 'findings');
    assert.equal(record.runResult.classification.failure, null);
  }
  assert.equal((await answerWorkflow(reopened.workflowRunId, { repoRoot: root, cwd: root, stepId: 'close', answer: 'Retain dissent and close the bounded revisit.' })).status, 'completed');
});
