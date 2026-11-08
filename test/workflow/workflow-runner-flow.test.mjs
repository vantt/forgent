// test/workflow/workflow-runner-flow.test.mjs — a Playbook run from start to its end: parallel steps and a human gate,
// what each unit is handed, consent and input gates, the expertise a gate quotes, accepted findings, and context across repositories.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { validateWorkflow } from '../../src/workflow/definition.mjs';
import { startWorkflow, answerWorkflow, resumeWorkflow, statusWorkflow } from '../../src/workflow/index.mjs';
import { prepareWorkflowRun, assertUnitAcceptOutcomes } from '../../src/workflow/case-start.mjs';
import { RunnerConfigError } from '../../src/runner/dispatch/config.mjs';
import { nativeDoor } from '../../src/native/door.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { withProviderFamilies } from '../helpers/provider-families.mjs';
import { writeProjectConfig, readProjectConfig } from '../helpers/config-fixture.mjs';
import { setupTestRepo } from '../helpers/workflow-runner-fixture.mjs';

seedFileLocalBwrapRegistry();

test('runner: executes workflow with parallel steps and parks at human gate', async () => {
  const tmp = setupTestRepo();

  const workflow = {
    id: 'test/dag-runner',
    steps: [
      {
        id: 'step-a',
        dependsOn: [],
        units: [{ id: 'u-a', template: { capability: 'docs:write' } }],
      },
      {
        id: 'step-b',
        dependsOn: [],
        units: [{ id: 'u-b', template: { capability: 'docs:write' } }],
      },
      {
        id: 'step-gate',
        dependsOn: ['step-a', 'step-b'],
        gate: { kind: 'human', question: 'Ready to proceed?' },
      },
      {
        id: 'step-c',
        dependsOn: ['step-gate'],
        units: [{ id: 'u-c', template: { capability: 'docs:write' } }],
      },
    ],
  };

  // Start workflow
  let state = await startWorkflow({
    workflow,
    repoRoot: tmp,
    cwd: tmp,
  });

  // Step A and B should complete, and runner should park at step-gate!
  assert.equal(state.status, 'parked');
  assert.equal(state.questions.length, 1);
  assert.equal(state.questions[0].stepId, 'step-gate');
  assert.equal(state.steps['step-a'].status, 'completed');
  assert.equal(state.steps['step-b'].status, 'completed');

  // Answer human gate with approval
  state = await answerWorkflow(state.workflowRunId, {
    stepId: 'step-gate',
    answer: 'approved',
    approved: true,
    repoRoot: tmp,
    cwd: tmp,
  });

  // Now step-gate was answered and step-c should execute to complete the workflow!
  assert.equal(state.status, 'completed');
  assert.equal(state.outcome, 'pass');
  assert.equal(state.steps['step-c'].status, 'completed');
});

test('a gate answer that cannot be written is refused before the answer is recorded', async () => {
  const tmp = setupTestRepo();
  const workflow = validateWorkflow({
    id: 'gate-answer-unsafe-step',
    steps: [{ id: 'vote', gate: { kind: 'human', question: 'Pick?' }, units: [{ id: 'u', template: { capability: 'docs:write', pattern: 'solo', objective: 'x', writes: [] } }] }],
  });
  const state = await startWorkflow({ workflow, repoRoot: tmp, cwd: tmp, worktree: tmp });
  assert.equal(state.status, 'parked');
  await assert.rejects(
    () => answerWorkflow(state.workflowRunId, { stepId: '../vote', answer: 'yes', repoRoot: tmp, cwd: tmp, worktree: tmp }),
    /gate answer/i,
  );
  assert.equal(statusWorkflow(state.workflowRunId, { repoRoot: tmp, cwd: tmp }).status, 'parked');
});

test('the owner request and earlier step output reach each unit objective', async () => {
  const tmp = setupTestRepo();
  // Worker that records the prompt it was given into its outbox, the one place a confined
  // worker may write; the test reads those files back from the run store.
  const spy = path.join(tmp, 'spy-worker.mjs');
  fs.writeFileSync(
    spy,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const prompt = process.argv.slice(2).join(' ');
    const match = /Write structured JSON to (\\S+result-1\\.json)/.exec(prompt);
    if (match) {
      const runDir = (() => { const d = path.dirname(match[1]); const o = path.join(d, 'worker-output', 'outbox'); return fs.existsSync(o) ? o : d; })();
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'prompt.txt'), prompt);
      fs.writeFileSync(path.join(runDir, 'report-1.md'), '# Report\\nFINDING-FROM-FIRST-STEP is the finding the second step must see in full detail.\\n');
      fs.writeFileSync(path.join(runDir, 'result-1.json'), JSON.stringify({ status: 'done', summary: 'first step summary' }));
    }
    `,
  );
  const cfg = readProjectConfig(tmp);
  cfg.runner.executors['test-node'].args = [spy, '{prompt}'];
  cfg.runner.executors['test-node'].invocations[0].args = [spy, '{prompt}'];
  writeProjectConfig(tmp, cfg);

  const workflow = validateWorkflow({
    id: 'request-flows-through',
    steps: [
      { id: 'one', units: [{ id: 'u1', template: { capability: 'docs:write', pattern: 'solo', objective: 'Do the first thing', writes: [] } }] },
      { id: 'two', dependsOn: ['one'], units: [{ id: 'u2', template: { capability: 'docs:write', pattern: 'solo', objective: 'Do the second thing', writes: [] } }] },
    ],
  });
  const state = await startWorkflow({ workflow, repoRoot: tmp, cwd: tmp, worktree: tmp, request: 'Ship the pricing page by Friday' });
  assert.equal(state.request, 'Ship the pricing page by Friday');
  assert.equal(state.status, 'completed', JSON.stringify(state.steps));

  const assignmentsDir = path.join(tmp, '.fgos', 'assignments');
  const promptFiles = [];
  const collect = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) collect(full);
      else if (entry.name === 'prompt.txt') promptFiles.push(full);
    }
  };
  collect(assignmentsDir);
  const prompts = promptFiles
    .sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs)
    .map((f) => fs.readFileSync(f, 'utf8'));
  assert.equal(prompts.length, 2);
  assert.match(prompts[0], /Do the first thing/);
  assert.match(prompts[0], /Ship the pricing page by Friday/);
  assert.doesNotMatch(prompts[0], /FINDING-FROM-FIRST-STEP/);
  assert.match(prompts[1], /Ship the pricing page by Friday/);
  // The earlier report travels as a context ref, not as pasted text.
  assert.match(prompts[1], /first step summary/);
  assert.match(prompts[1], /unit run unit-run-/);
  assert.doesNotMatch(prompts[1], /FINDING-FROM-FIRST-STEP/);
  const firstRunId = state.steps.one.units.u1.unitRunId;
  const refPaths = prompts[1].match(new RegExp(`/\\S+/assignments/${firstRunId}/producer/\\S+report\\S*\\.md`, 'g')) ?? [];
  assert.equal(refPaths.length, 1, `one report path of the first unit run in the second prompt, got ${refPaths}`);
  assert.match(fs.readFileSync(refPaths[0], 'utf8'), /FINDING-FROM-FIRST-STEP/);
});

test('human consent gate: answering without --approve leaves gate parked with clarification note, and answering with --approve releases it', async () => {
  const tmp = setupTestRepo();
  const unit = (id, objective) => ({ id, template: { capability: 'docs:write', pattern: 'solo', objective, writes: [] } });
  const workflow = validateWorkflow({
    id: 'consent-gate-roundtrip',
    steps: [
      { id: 'prep', units: [unit('u-prep', 'Prepare proposal')] },
      { id: 'gate-step', dependsOn: ['prep'], gate: { kind: 'human', question: 'Authorize scope change?' } },
      { id: 'exec', dependsOn: ['gate-step'], units: [unit('u-exec', 'Execute approved scope')] },
    ],
  });

  let state = await startWorkflow({ workflow, repoRoot: tmp, cwd: tmp });
  const runId = state.workflowRunId;
  const runDir = path.join(tmp, '.fgos', 'workflow-runs', runId);

  // Runner parks at gate-step
  assert.equal(state.status, 'parked');
  assert.equal(state.questions.length, 1);
  assert.equal(state.questions[0].stepId, 'gate-step');
  assert.equal(state.steps['gate-step'].status, 'parked');

  // Round 1: Clarification only (no --approve)
  state = await answerWorkflow(runId, {
    stepId: 'gate-step',
    answer: 'chưa rõ, giải thích thêm ngân sách',
    approved: false,
    repoRoot: tmp,
    cwd: tmp,
  });

  // Step and run MUST stay parked!
  assert.equal(state.status, 'parked');
  assert.equal(state.questions.length, 1);
  assert.equal(state.questions[0].stepId, 'gate-step');
  assert.equal(state.steps['gate-step'].status, 'parked');
  assert.equal(state.steps['gate-step'].lastClarification, 'chưa rõ, giải thích thêm ngân sách');

  // Verify answer file has recorded clarification round
  const answerFile = path.join(runDir, 'gate-answers', 'gate-step.md');
  assert.ok(fs.existsSync(answerFile));
  let answerContent = fs.readFileSync(answerFile, 'utf8');
  assert.ok(answerContent.includes('Clarification'));
  assert.ok(answerContent.includes('chưa rõ, giải thích thêm ngân sách'));

  // Round 2: Explicit approval
  state = await answerWorkflow(runId, {
    stepId: 'gate-step',
    answer: 'đồng ý triển khai',
    approved: true,
    repoRoot: tmp,
    cwd: tmp,
  });

  // Now gate is released and workflow completes!
  assert.equal(state.status, 'completed');
  assert.equal(state.outcome, 'pass');
  assert.equal(state.steps['gate-step'].status, 'completed');
  assert.equal(state.steps['gate-step'].approved, true);

  // Answer file contains both clarification and approval rounds!
  answerContent = fs.readFileSync(answerFile, 'utf8');
  assert.ok(answerContent.includes('Clarification'));
  assert.ok(answerContent.includes('Approved'));
  assert.ok(answerContent.includes('đồng ý triển khai'));
});

test('human input gate (mode: input): answering without --approve releases the gate directly', async () => {
  const tmp = setupTestRepo();
  const unit = (id, objective) => ({ id, template: { capability: 'docs:write', pattern: 'solo', objective, writes: [] } });
  const workflow = validateWorkflow({
    id: 'input-gate-roundtrip',
    steps: [
      { id: 'prep', units: [unit('u-prep', 'Collect ideas')] },
      { id: 'vote-step', dependsOn: ['prep'], gate: { kind: 'human', mode: 'input', question: 'Submit vote ranking' } },
      { id: 'tally', dependsOn: ['vote-step'], units: [unit('u-tally', 'Tally votes')] },
    ],
  });

  let state = await startWorkflow({ workflow, repoRoot: tmp, cwd: tmp });
  const runId = state.workflowRunId;

  assert.equal(state.status, 'parked');
  assert.equal(state.questions.length, 1);
  assert.equal(state.questions[0].stepId, 'vote-step');

  // Answer input gate without approved flag
  state = await answerWorkflow(runId, {
    stepId: 'vote-step',
    answer: 'Option A (1), Option B (2)',
    repoRoot: tmp,
    cwd: tmp,
  });

  // Released directly, workflow completes!
  assert.equal(state.status, 'completed');
  assert.equal(state.outcome, 'pass');
  assert.equal(state.steps['vote-step'].status, 'completed');
});

test('workflow start enforces acceptOutcomes requires reviewed loop at execution boundary without seats or account', async (t) => {
  const tmp = setupTestRepo();
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const cfg = readProjectConfig(tmp);
  cfg.runner.patterns = {
    ...(cfg.runner.patterns ?? {}),
    'custom-reviewed': { loop: 'reviewed' },
    'custom-solo': { loop: 'solo' },
  };
  writeProjectConfig(tmp, cfg);

  const makeWf = (pattern, acceptOutcomes) => ({
    id: `wf-${pattern}`,
    steps: [{
      id: 'root',
      gate: { kind: 'human', mode: 'input', question: 'Start?' },
      units: [{
        id: 'u1',
        template: {
          capability: 'docs:write',
          pattern,
          ...(acceptOutcomes !== undefined ? { acceptOutcomes } : {}),
        },
      }],
    }],
  });

  // Non-reviewed (shipped solo) with acceptOutcomes is refused at start
  await assert.rejects(
    () => startWorkflow({ workflow: makeWf('solo', ['pass']), repoRoot: tmp, cwd: tmp }),
    /acceptOutcomes requires a reviewed template/,
  );

  // Custom non-reviewed with acceptOutcomes is refused at start
  await assert.rejects(
    () => startWorkflow({ workflow: makeWf('custom-solo', ['pass']), repoRoot: tmp, cwd: tmp }),
    /acceptOutcomes requires a reviewed template/,
  );

  // Unknown pattern typo with acceptOutcomes is refused as unknown-pattern
  await assert.rejects(
    () => startWorkflow({ workflow: makeWf('reviwed', ['pass']), repoRoot: tmp, cwd: tmp }),
    (err) => err instanceof RunnerConfigError && err.code === 'unknown-pattern',
  );

  // Shared guard assertUnitAcceptOutcomes directly refuses unknown pattern with unknown-pattern
  assert.throws(
    () => assertUnitAcceptOutcomes({ id: 'wf' }, { id: 's' }, { id: 'u', template: { pattern: 'reviwed', acceptOutcomes: ['pass'] } }, {}),
    (err) => err instanceof RunnerConfigError && err.code === 'unknown-pattern',
  );

  // Custom reviewed with acceptOutcomes is accepted at start
  const started = await startWorkflow({ workflow: makeWf('custom-reviewed', ['pass', 'findings']), repoRoot: tmp, cwd: tmp });
  assert.equal(started.workflowId, 'wf-custom-reviewed');
});

test('prepareWorkflowRun loads runner config from disk exactly once', (t) => {
  const tmp = setupTestRepo();
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));

  let snapshotCalls = 0;
  const originalSnapshot = nativeDoor().config.snapshot;
  t.mock.method(nativeDoor().config, 'snapshot', (req) => {
    snapshotCalls++;
    return originalSnapshot(req);
  });

  const workflow = {
    id: 'wf-config-reuse',
    steps: [{
      id: 'step-1',
      units: [{ id: 'u1', template: { capability: 'docs:write' } }],
    }],
  };

  const preparedFresh = prepareWorkflowRun({ workflow, repoRoot: tmp, cwd: tmp });
  assert.ok(preparedFresh.workflowRunId);
  assert.equal(snapshotCalls, 1, 'prepareWorkflowRun loaded config exactly once');
});

test('producer expertise gate parks clearly on malformed packets and remains answerable across resume', async (t) => {
  // Each packet shape is owned by test/workflow/unit-handoff.test.mjs; here one readable packet and
  // one of each refusal the runner turns into a manual gate: a wrong shape and a report that is not JSON.
  const validPackets = [{ 'missing expertise': ['database sizing', 'security review'] }];
  const invalidPackets = [{ 'missing expertise': 'security' }];
  for (const packet of [...validPackets, ...invalidPackets, '```json\n{"missing expertise":[]}\n```']) {
    const tmp = setupTestRepo();
    t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
    fs.writeFileSync(path.join(tmp, 'echo-worker.mjs'), `
      import fs from 'node:fs'; import path from 'node:path';
      const target = /Write structured JSON to (\\S+result-1\\.json)/.exec(process.argv.slice(2).join(' '))?.[1];
      if (!target) process.exit(1);
      const base = path.dirname(target), outbox = path.join(base, 'worker-output', 'outbox');
      const dir = fs.existsSync(outbox) ? outbox : base;
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'report-1.md'), ${JSON.stringify(typeof packet === 'string' ? packet : JSON.stringify({ recommendation: 'Bound the design to its approved scope', ...packet }))});
      fs.writeFileSync(path.join(dir, 'result-1.json'), JSON.stringify({ status: 'done', summary: 'Recommendation packet settled' }));
    `);
    const workflow = { id: 'gate-report', steps: [
      { id: 'synthesis', units: [{ id: 'synthesize-recommendation', template: { capability: 'docs:write' } }] },
      { id: 'close', dependsOn: ['synthesis'], gate: { kind: 'human', mode: 'input', question: 'Bring in {{report:synthesis/synthesize-recommendation:missing expertise}} or not?' } },
      { id: 'check-sha', dependsOn: ['close'], gate: { kind: 'human', mode: 'input', question: '{{report:synthesis/synthesize-recommendation:missing expertise}}' } },
    ] };
    const state = await startWorkflow({ workflow, repoRoot: tmp, cwd: tmp });
    assert.equal(state.status, 'parked');
    assert.equal(state.steps.close.status, 'parked');
    const resumed = await resumeWorkflow(state.workflowRunId, { repoRoot: tmp, cwd: tmp });
    assert.equal(resumed.status, 'parked');
    assert.deepEqual(resumed.questions, state.questions);
    if (validPackets.includes(packet)) {
      assert.equal(state.questions[0].question, `Bring in ${JSON.stringify(packet['missing expertise'])} or not?`);
      const settled = state.steps.synthesis.units['synthesize-recommendation'].results.find((record) => record.role === 'producer').runResult.settleReports[0];
      fs.appendFileSync(path.resolve(tmp, settled.path), 'tampered');
      const unreadable = await answerWorkflow(state.workflowRunId, { repoRoot: tmp, cwd: tmp, stepId: 'close', answer: 'yes' });
      assert.equal(unreadable.status, 'parked');
      assert.equal(unreadable.questions[0].stepId, 'check-sha');
      assert.match(unreadable.questions[0].question, /report-changed-after-settle/);
      assert.equal((await resumeWorkflow(state.workflowRunId, { repoRoot: tmp, cwd: tmp })).status, 'parked');
      assert.equal((await answerWorkflow(state.workflowRunId, { repoRoot: tmp, cwd: tmp, stepId: 'check-sha', answer: 'Acknowledge the changed packet; no expertise decision inferred.' })).status, 'completed');
    } else {
      assert.match(state.questions[0].question, /Cannot read settled producer "missing expertise"/);
      const next = await answerWorkflow(state.workflowRunId, { repoRoot: tmp, cwd: tmp, stepId: 'close', answer: 'No expertise decision can be inferred; retain this limitation.' });
      assert.equal(next.status, 'parked');
      assert.equal((await answerWorkflow(state.workflowRunId, { repoRoot: tmp, cwd: tmp, stepId: 'check-sha', answer: 'Retain the unreadable-report limitation and close.' })).status, 'completed');
    }
  }
});

test('an expertise gate reads the packet file a producer wrote beside its prose report, judged against the settlement time the run recorded', async (t) => {
  // Every report and packet-file case is owned by test/workflow/unit-handoff.test.mjs; this one
  // proves a real settled run hands the gate its settlement time, so the packet file counts.
  const cases = [
    { name: 'prose report with a packet file using the underscore key', report: '# Advice in prose', packet: JSON.stringify({ missing_expertise: ['security review'] }), expect: '["security review"]' },
  ];
  for (const scenario of cases) {
    const tmp = setupTestRepo();
    t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
    fs.writeFileSync(path.join(tmp, 'echo-worker.mjs'), `
      import fs from 'node:fs'; import path from 'node:path';
      const target = /Write structured JSON to (\\S+result-1\\.json)/.exec(process.argv.slice(2).join(' '))?.[1];
      if (!target) process.exit(1);
      const base = path.dirname(target), outbox = path.join(base, 'worker-output', 'outbox');
      const dir = fs.existsSync(outbox) ? outbox : base;
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'report-1.md'), ${JSON.stringify(scenario.report)});
      if (${JSON.stringify(scenario.packet ?? null)} !== null) {
        const packet = path.join(dir, 'packet-1.json');
        fs.writeFileSync(packet, ${JSON.stringify(scenario.packet ?? '')});
        if (${JSON.stringify(Boolean(scenario.future))}) { const later = new Date(Date.now() + 86400000); fs.utimesSync(packet, later, later); }
      }
      fs.writeFileSync(path.join(dir, 'result-1.json'), JSON.stringify({ status: 'done', summary: 'Recommendation packet settled' }));
    `);
    const workflow = { id: 'gate-packet-file', steps: [
      { id: 'synthesis', units: [{ id: 'synthesize-recommendation', template: { capability: 'docs:write' } }] },
      { id: 'close', dependsOn: ['synthesis'], gate: { kind: 'human', mode: 'input', question: 'Bring in {{report:synthesis/synthesize-recommendation:missing expertise}} or not?' } },
    ] };
    const state = await startWorkflow({ workflow, repoRoot: tmp, cwd: tmp });
    assert.equal(state.status, 'parked', scenario.name);
    if (scenario.parks) assert.match(state.questions[0].question, /Cannot read settled producer "missing expertise"/, scenario.name);
    else assert.equal(state.questions[0].question, `Bring in ${scenario.expect} or not?`, scenario.name);
  }
});

test('reviewed findings acceptance proceeds while default and execution failure stop', async (t) => {
  for (const [accepted, failed] of [[true, false], [false, false], [true, true]]) {
    const tmp = setupTestRepo();
    t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
    writeProjectConfig(tmp, withProviderFamilies(readProjectConfig(tmp)));
    fs.writeFileSync(path.join(tmp, 'echo-worker.mjs'), `
      import fs from 'node:fs'; import path from 'node:path';
      const target = /Write structured JSON to (\\S+result-1\\.json)/.exec(process.argv.slice(2).join(' '))?.[1];
      if (!target || ${failed}) process.exit(1);
      const base = path.dirname(target), outbox = path.join(base, 'worker-output', 'outbox');
      const dir = fs.existsSync(outbox) ? outbox : base;
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'report-1.md'), '# Review\\nThe recommendation has a substantive correctness issue requiring owner consideration.\\n');
      fs.writeFileSync(path.join(dir, 'result-1.json'), JSON.stringify(target.includes('/reviewer/') ?
        { status: 'done', summary: 'Review found a correctness issue', assessment: { verdict: 'findings' }, findings: ['Correctness issue'] } :
        { status: 'done', summary: 'Producer completed' }));
    `);
    const state = await startWorkflow({ repoRoot: tmp, cwd: tmp, workflow: { id: 'accept-findings', steps: [
      { id: 'review', units: [{ id: 'advice', template: { capability: 'docs:write', pattern: 'reviewed', ...(accepted ? { acceptOutcomes: ['pass', 'findings'] } : {}) } }] },
      { id: 'close', dependsOn: ['review'], gate: { kind: 'human', mode: 'input', question: 'Continue?' } },
    ] } });
    assert.equal(state.status, accepted && !failed ? 'parked' : 'failed', state.steps.review.reason);
    if (!failed) assert.equal(state.steps.review.units.advice.outcome, 'findings');
    if (failed) assert.notEqual(state.steps.review.units.advice.outcome, 'pass');
  }
});

test('an absent producer parks a recoverable expertise gate rather than wedging the run', async (t) => {
  const tmp = setupTestRepo();
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const state = await startWorkflow({ repoRoot: tmp, cwd: tmp, workflow: {
    id: 'absent-producer', steps: [{ id: 'close', gate: { kind: 'human', mode: 'input', question: '{{report:synthesis/synthesize-recommendation:missing expertise}}' } }],
  } });
  assert.equal(state.status, 'parked');
  assert.match(state.questions[0].question, /producer is not settled/);
  assert.equal((await resumeWorkflow(state.workflowRunId, { repoRoot: tmp, cwd: tmp })).status, 'parked');
  assert.equal((await answerWorkflow(state.workflowRunId, { repoRoot: tmp, cwd: tmp, stepId: 'close', answer: 'Acknowledge absent producer evidence; close without inferred expertise.' })).status, 'completed');
});

test('cross-repo workflows reject plain context paths before recording a run, but consume state-root unit reports', async (t) => {
  const stateRoot = setupTestRepo();
  const workerRoot = setupTestRepo();
  t.after(() => {
    fs.rmSync(stateRoot, { recursive: true, force: true });
    fs.rmSync(workerRoot, { recursive: true, force: true });
  });
  const template = { capability: 'docs:write' };
  const workflow = { id: 'cross-context', steps: [{ id: 'read', units: [{ id: 'reader', template }] }] };
  for (const params of [
    { workflow, contextRefs: ['README.md'] },
    { workflow: { ...workflow, steps: [{ id: 'read', units: [{ id: 'reader', template: { ...template, contextRefs: ['README.md'] } }] }] } },
  ]) {
    await assert.rejects(startWorkflow({ ...params, repoRoot: stateRoot, cwd: workerRoot }), /plain paths across repositories; use unit-run:<id>\/<role>/);
    assert.ok(!fs.existsSync(path.join(stateRoot, '.fgos', 'workflow-runs')), 'ambiguous context must fail before durable run creation');
  }
  await assert.rejects(startWorkflow({ workflow, contextRefs: ['README.md'], repoRoot: stateRoot, cwd: stateRoot, worktree: workerRoot }), /plain paths across repositories/);
  const parent = await startWorkflow({ workflow, repoRoot: stateRoot, cwd: stateRoot });
  const parentRef = `unit-run:${parent.steps.read.units.reader.unitRunId}/producer`;
  const child = await startWorkflow({ workflow, contextRefs: [parentRef], repoRoot: stateRoot, cwd: workerRoot, worktree: workerRoot });
  assert.equal(child.status, 'completed', 'settled state-root reports remain usable outside their repository');
  assert.equal(child.steps.read.units.reader.results[0].runResult.classification.execution.status, 'completed');
  const linked = path.join(path.dirname(stateRoot), `${path.basename(stateRoot)}-context-linked`);
  execFileSync('git', ['worktree', 'add', '-b', 'context-linked', linked], { cwd: stateRoot, stdio: 'ignore' });
  t.after(() => fs.rmSync(linked, { recursive: true, force: true }));
  const sameRepo = await startWorkflow({
    workflow: { id: 'linked-context', steps: [{ id: 'owner', gate: { kind: 'human', question: 'Start?' } }] },
    contextRefs: ['README.md'], repoRoot: stateRoot, cwd: linked,
  });
  assert.equal(sameRepo.status, 'parked', 'linked worktrees are not different repositories');
});
