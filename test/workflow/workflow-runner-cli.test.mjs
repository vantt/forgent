// test/workflow/workflow-runner-cli.test.mjs — the `fgos workflow` verbs through the real CLI: start, status and answer in the
// foreground, start/answer/resume returning at once while a detached process advances, and the stance options reaching the briefs.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { validateWorkflow } from '../../src/workflow/definition.mjs';
import { createWorkflowRun, readWorkflowEvents } from '../../src/workflow/store.mjs';
import { startWorkflow, statusWorkflow } from '../../src/workflow/index.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { writeTrivialWorkflow } from '../helpers/trivial-workflow.mjs';
import {
  setupTestRepo, BIN_FGOS, GATE_WORKFLOW, STANCE_CLI_CALL_TIMEOUT_MS, memberSeats, parseCliData, useDistinctFamilies, waitForLedgerEvent,
} from '../helpers/workflow-runner-fixture.mjs';

seedFileLocalBwrapRegistry();

const isCompletion = (event) => event.type === 'workflow.complete';

test('CLI: fgos workflow start, status, answer, and legacy operations', () => {
  const tmp = setupTestRepo();
  const workflowId = writeTrivialWorkflow(tmp);

  // 1. fgos workflow start <id>
  const startOut = execFileSync(
    process.execPath,
    [BIN_FGOS, 'workflow', 'start', workflowId, '--dir', tmp, '--foreground'],
    { cwd: tmp, encoding: 'utf8' },
  );
  assert.ok(startOut.includes('wf-run-'));

  const match = /"workflowRunId":\s*"([^"]+)"/.exec(startOut);
  assert.ok(match, 'must print workflowRunId');
  const wfRunId = match[1];

  // 2. fgos workflow status
  const statusOut = execFileSync(
    process.execPath,
    [BIN_FGOS, 'workflow', 'status', wfRunId, '--dir', tmp],
    { cwd: tmp, encoding: 'utf8' },
  );
  assert.ok(statusOut.includes(wfRunId));

  // 3. Legacy operations inspection remains working
  const opsOut = execFileSync(
    process.execPath,
    [BIN_FGOS, 'workflow', 'operations', '--step', 'planning', '--dir', tmp],
    { cwd: tmp, encoding: 'utf8' },
  );
  assert.ok(opsOut.includes('validate-plan') || opsOut.includes('operations'));

  // A workflow that parks at a gate: status says parked, and `answer --foreground` completes it in the same call.
  fs.writeFileSync(
    path.join(tmp, 'core', 'workflows', 'gate-cli.yaml'),
    'id: gate-cli\nsteps:\n  - id: step-gate\n    gate: { kind: human, mode: input, question: Ready to proceed? }\n  - id: step-after\n    dependsOn: [step-gate]\n',
  );
  const parkedOut = execFileSync(process.execPath, [BIN_FGOS, 'workflow', 'start', 'gate-cli', '--dir', tmp, '--foreground'], { cwd: tmp, encoding: 'utf8' });
  const parkedId = /"workflowRunId":\s*"([^"]+)"/.exec(parkedOut)?.[1];
  assert.ok(parkedId, 'must print the workflowRunId of the parked run');
  const parkedStatus = execFileSync(process.execPath, [BIN_FGOS, 'workflow', 'status', parkedId, '--dir', tmp], { cwd: tmp, encoding: 'utf8' });
  assert.ok(parkedStatus.includes('parked'), 'a run at its gate reads as parked');
  const answerOut = execFileSync(
    process.execPath,
    [BIN_FGOS, 'workflow', 'answer', parkedId, '--step', 'step-gate', '--answer', 'Priority 1,2,3', '--dir', tmp, '--foreground'],
    { cwd: tmp, encoding: 'utf8' },
  );
  assert.ok(answerOut.includes('completed'), 'workflow answer --foreground resumes the run and completes it');
});

test('CLI: fgos workflow start returns the run id at once and a detached process finishes the run', async () => {
  const tmp = setupTestRepo();
  const workflowId = writeTrivialWorkflow(tmp);

  const startOut = execFileSync(
    process.execPath,
    [BIN_FGOS, 'workflow', 'start', workflowId, '--dir', tmp],
    { cwd: tmp, encoding: 'utf8' },
  );
  const wfRunId = /"workflowRunId":\s*"([^"]+)"/.exec(startOut)?.[1];
  assert.ok(wfRunId, 'start must print the workflowRunId');
  assert.ok(startOut.includes(`fgos workflow status ${wfRunId}`), 'start must say where to read progress');
  const logPath = path.join(tmp, '.fgos', 'workflow-runs', wfRunId, 'advance.log');
  assert.ok(fs.existsSync(logPath), 'the detached process log must exist from the start');

  // The detached process advances the run; the ledger says when it is done, and the status verb agrees.
  await waitForLedgerEvent(tmp, wfRunId, isCompletion, { label: 'the detached process finishing the run' });
  assert.equal(statusWorkflow(wfRunId, { repoRoot: tmp, cwd: tmp }).status, 'completed');
});

test('CLI: fgos workflow answer records the answer, returns at once and a detached process finishes the run', async () => {
  const tmp = setupTestRepo();
  const parked = await startWorkflow({ workflow: validateWorkflow(GATE_WORKFLOW), repoRoot: tmp, cwd: tmp });
  assert.equal(parked.status, 'parked');

  const out = parseCliData(
    execFileSync(
      process.execPath,
      [BIN_FGOS, 'workflow', 'answer', parked.workflowRunId, '--step', 'step-gate', '--answer', 'yes', '--approve', '--dir', tmp],
      { cwd: tmp, encoding: 'utf8' },
    ),
  );
  assert.equal(out.workflowRunId, parked.workflowRunId);
  assert.equal(out.detached.statusCommand, `fgos workflow status ${parked.workflowRunId}`);
  const types = readWorkflowEvents({ repoRoot: tmp, workflowRunId: parked.workflowRunId }).map((e) => e.type);
  assert.ok(types.includes('gate.answer'), 'the answer is recorded before the command returns');
  await waitForLedgerEvent(tmp, parked.workflowRunId, isCompletion, { label: 'the detached process finishing the run' });
  assert.equal(statusWorkflow(parked.workflowRunId, { repoRoot: tmp, cwd: tmp }).status, 'completed');
});

test('CLI: fgos workflow resume returns at once and a detached process advances the run once', async () => {
  const tmp = setupTestRepo();
  const workflow = validateWorkflow({ id: 'test/no-gate', steps: [{ id: 'only', dependsOn: [] }] });
  const { workflowRunId } = createWorkflowRun({ repoRoot: tmp, workflowId: workflow.id, workflow });

  const out = parseCliData(
    execFileSync(process.execPath, [BIN_FGOS, 'workflow', 'resume', workflowRunId, '--dir', tmp], {
      cwd: tmp,
      encoding: 'utf8',
    }),
  );
  assert.equal(out.detached.statusCommand, `fgos workflow status ${workflowRunId}`);
  assert.ok(out.detached.pid > 0);
  await waitForLedgerEvent(tmp, workflowRunId, isCompletion, { label: 'the detached process finishing the run' });
  assert.equal(statusWorkflow(workflowRunId, { repoRoot: tmp, cwd: tmp }).status, 'completed');
  const completions = readWorkflowEvents({ repoRoot: tmp, workflowRunId }).filter((e) => e.type === 'workflow.complete');
  assert.equal(completions.length, 1, 'the detached child advances in the foreground and does not spawn another advance');
});

test('workflow and unit CLI options reach the actually dispatched prompts and drive settled stance behavior', { timeout: 3 * STANCE_CLI_CALL_TIMEOUT_MS }, (t) => {
  const tmp = setupTestRepo();
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  useDistinctFamilies(tmp, ['alpha', 'beta', 'gamma', 'delta']);
  const runFgos = (label, args) => {
    try {
      return parseCliData(execFileSync(process.execPath, [BIN_FGOS, ...args], { cwd: tmp, encoding: 'utf8', timeout: STANCE_CLI_CALL_TIMEOUT_MS }));
    } catch (error) {
      const how = error.signal ? `was killed by ${error.signal} (still running after ${STANCE_CLI_CALL_TIMEOUT_MS} ms)` : `exited ${error.status}`;
      throw new Error(`waiting for ${label}: the CLI ${how}; seat directories under ${path.join(tmp, '.fgos', 'assignments')}\nstderr:\n${error.stderr ?? ''}`, { cause: error });
    }
  };
  // cli-spawn delivers the brief in argv, not herdr's brief-N.md file. The worker answers only from
  // what it was actually told: it votes for the second declared choice, and only when asked.
  fs.writeFileSync(path.join(tmp, 'echo-worker.mjs'), String.raw`
    import fs from 'node:fs';
    import path from 'node:path';
    const prompt = process.argv.slice(2).join(' ');
    const target = /Write structured JSON to (\S+result-1\.json)/.exec(prompt)?.[1];
    if (!target) throw new Error('worker received no claim destination');
    const choices = /Declared choices: (\[[^\n]+?\]);/.exec(prompt);
    const claim = { status: 'done', summary: 'Completed the assigned question analysis.' };
    if (choices) {
      const options = JSON.parse(choices[1]);
      if (options.length < 2) throw new Error('worker received fewer than two options');
      claim.stance = { choice: options[1], confidence: target.includes('/member-2/') ? 'malformed' : 0.9 };
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(path.join(path.dirname(target), 'report-1.md'), '# Report\nThe second strategy favors a simpler implementation and bounded rebuild cost. Review correctness against the stated workload.\n');
    fs.writeFileSync(target, JSON.stringify(claim));
  `);
  const dispatchedPrompt = (dir, role) => {
    const envelope = JSON.parse(fs.readFileSync(path.join(dir, role, '1', 'runs', '01', 'envelope.json'), 'utf8'));
    const prompt = envelope.launch.args.find((arg) => arg.includes('Write structured JSON to'));
    assert.equal(typeof prompt, 'string', 'the real CLI launch envelope contains the delivered brief');
    return prompt;
  };
  const workflow = {
    id: 'stance-cli',
    steps: [{ id: 'opinions', units: [{ id: 'question', template: {
      capability: 'docs:write', pattern: 'panel', seats: memberSeats(2),
      objective: 'Choose incremental or full rebuilding', writes: [],
    } }] }],
  };
  fs.mkdirSync(path.join(tmp, 'core', 'workflows'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'core', 'workflows', 'stance.json'), JSON.stringify(workflow));
  const state = runFgos('`fgos workflow start stance-cli --foreground`', [
    'workflow', 'start', 'stance-cli', '--request', 'Assess correctness', '--stance-options', 'incremental|full',
    '--dir', tmp, '--foreground',
  ]);
  assert.equal(state.status, 'completed', `the workflow did not complete; its steps: ${JSON.stringify(state.steps)}`);
  assert.deepEqual(state.stanceOptions, ['incremental', 'full']);
  const unitRunId = state.steps.opinions.units.question.unitRunId;
  const unitDir = path.join(tmp, '.fgos', 'assignments', unitRunId);
  const unitRecord = JSON.parse(fs.readFileSync(path.join(unitDir, 'unit.json'), 'utf8'));
  const summary = JSON.parse(fs.readFileSync(path.join(unitDir, 'unit-summary.json'), 'utf8'));
  const expectedLink = { caseId: state.workflowRunId, activity: 'opinions', reservationId: unitRecord.workflow.reservationId };
  assert.match(expectedLink.reservationId, /^rsv-/, 'the Unit run names the reservation that admitted it');
  assert.deepEqual(unitRecord.workflow, expectedLink);
  assert.deepEqual(summary.workflow, expectedLink);
  assert.deepEqual(summary.stanceOptions, ['incremental', 'full']);
  assert.equal(summary.outcome, 'pass', 'malformed optional stance never fails a seat');
  for (const role of ['member-1', 'member-2']) {
    const brief = dispatchedPrompt(unitDir, role);
    assert.match(brief, /Assess correctness/);
    assert.match(brief, /Declared choices: \["incremental","full"\]/);
    assert.match(brief, /"stance": \{"choice"/);
    const seat = summary.seats.find((entry) => entry.seat === role);
    assert.equal(seat.kind, 'panelist');
    assert.deepEqual(seat.final.stance, role === 'member-1'
      ? { status: 'valid', choice: 'full', confidence: 0.9 }
      : { status: 'invalid', reason: 'confidence-out-of-range' });
  }
  assert.doesNotMatch(dispatchedPrompt(unitDir, 'synthesizer'), /Declared choices|Passive stance measurement/);
  assert.deepEqual(summary.seats.find((seat) => seat.role === 'synthesizer').final.stance, { status: 'missing' },
    'the synthesizer was never asked, so it never voted');
  // The same labels have a direct-unit CLI door and do not acquire a workflow link.
  const unitFile = path.join(tmp, 'unit.json');
  fs.writeFileSync(unitFile, JSON.stringify({ id: 'direct-question', capability: 'docs:write', pattern: 'panel', seats: memberSeats(), objective: 'Choose rebuilding strategy', writes: [] }));
  const direct = runFgos('`fgos run --unit`', [
    'run', '--unit', unitFile, '--stance-options', 'incremental|full', '--dir', tmp,
  ]);
  const directDir = path.join(tmp, '.fgos', 'assignments', direct.unitRunId);
  const directRecord = JSON.parse(fs.readFileSync(path.join(directDir, 'unit.json'), 'utf8'));
  const directSummary = JSON.parse(fs.readFileSync(path.join(directDir, 'unit-summary.json'), 'utf8'));
  assert.equal(directRecord.workflow, null);
  assert.equal(directSummary.workflow, null);
  assert.deepEqual(directSummary.stanceOptions, ['incremental', 'full']);
  assert.match(dispatchedPrompt(directDir, 'member-1'), /Declared choices: \["incremental","full"\]/);
  assert.equal(directSummary.outcome, 'pass');
  assert.deepEqual(directSummary.seats.find((seat) => seat.seat === 'member-1').final.stance, { status: 'valid', choice: 'full', confidence: 0.9 });
});
