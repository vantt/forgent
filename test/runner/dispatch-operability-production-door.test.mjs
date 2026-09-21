import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { buildAssignment } from '../../src/runner/dispatch/assignment.mjs';
import { executeAssignment } from '../../src/runner/dispatch/assignment-runner.mjs';
import { COMMAND_REGISTRY } from '../../src/cli/command-registry.mjs';
import { invokeDispatchReconcileOperation } from '../../src/verbs/dispatch/reconcile.mjs';

const repo = path.resolve(new URL('../..', import.meta.url).pathname);

function tempRoot(label = 'dispatch-operability-door-') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), label));
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  return root;
}

function cli(args, { cwd = repo } = {}) {
  return spawnSync(process.execPath, ['bin/fgos.mjs', ...args], {
    cwd,
    encoding: 'utf8',
  });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeExecutor(root, name, body) {
  const file = path.join(root, `${name}.mjs`);
  fs.writeFileSync(file, `${body}\n`);
  return file;
}

function runnerConfig(executorScript, extra = {}) {
  return {
    executor: {
      allowCrossProvider: true,
      command: process.execPath,
      args: [executorScript, '--sentinel-config-field', 'forwarded-through-adapter', '{prompt}'],
      ...(extra.executor ?? {}),
    },
    models: { standard: 'test-model', analytical: 'test-analytical-model' },
    timeoutMs: extra.timeoutMs ?? 5000,
    ...(extra.config ?? {}),
  };
}

function runDirFor(root, assignmentId, attempt = '01') {
  return path.join(root, '.fgos', 'assignments', assignmentId, 'runs', attempt);
}

function writeAssignmentMaterialization(root, assignmentId, runId, resultBytes) {
  const assignmentDir = path.join(root, '.fgos', 'assignments', assignmentId);
  const runDir = path.join(assignmentDir, 'runs', '01');
  fs.mkdirSync(path.join(assignmentDir, 'admission', 'generations'), { recursive: true });
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(assignmentDir, 'assignment.json'), `${JSON.stringify({ assignmentId })}\n`);
  fs.writeFileSync(path.join(assignmentDir, 'admission', 'generations', '0000000001.json'), `${JSON.stringify({ runId, attempt: 1 })}\n`);
  fs.writeFileSync(path.join(runDir, 'run.json'), `${JSON.stringify({ assignmentId, runId, status: 'settled' })}\n`);
  fs.writeFileSync(path.join(runDir, 'result.json'), resultBytes);
}

test('production assignment door writes RunResult v2, effective contract, adapter argv, and inspect reads the same terminal result', async () => {
  const root = tempRoot();
  const argvPath = path.join(root, 'argv.json');
  const executor = writeExecutor(root, 'reporting-executor', `
    import fs from 'node:fs';
    import path from 'node:path';
    fs.writeFileSync(${JSON.stringify(argvPath)}, JSON.stringify(process.argv.slice(2)));
    const prompt = process.argv.slice(2).join(' ');
    const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
    if (!match) process.exit(9);
    const runDir = path.dirname(match[1]);
    const contract = JSON.parse(fs.readFileSync(path.join(runDir, 'effective-execution-contract.json'), 'utf8'));
    fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Dispatch Proof\\nThe production assignment door delivered the effective contract and result path.\\n');
    fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({
      status: 'done',
      summary: 'effective contract observed',
      evidence: [{ kind: 'file', path: 'agent-report.md' }],
      observedContract: {
        mutation: contract.mutation,
        resultClaimPath: contract.resultClaim.path,
        timeoutMs: contract.limits.executorTimeoutMs
      }
    }));
  `);

  const assignment = buildAssignment({
    workId: 'tsk-production-door',
    stage: 'planning',
    operation: 'validate-plan',
    role: 'implementer',
  });
  const result = await executeAssignment(assignment, {
    cwd: root,
    repoRoot: root,
    runnerConfig: runnerConfig(executor, { timeoutMs: 4321 }),
    timeoutMs: 4321,
  });

  assert.equal(result.status, 'done');
  assert.equal(result.classification.provenance, 'native-v2');
  assert.equal(result.classification.execution.status, 'completed');
  assert.equal(result.classification.delivery.mode, 'fresh');

  const runDir = runDirFor(root, assignment.assignmentId);
  const stored = readJson(path.join(runDir, 'result.json'));
  const effective = readJson(path.join(runDir, 'effective-execution-contract.json'));
  const argv = readJson(argvPath);
  assert.deepEqual(stored.contract, { id: 'assignment-run-result', version: 2 });
  assert.equal(stored.runId, result.runId);
  assert.equal(effective.resultClaim.path, path.join(runDir, 'agent-result.json'));
  assert.equal(effective.limits.executorTimeoutMs, 4321);
  assert.deepEqual(argv.slice(0, 2), ['--sentinel-config-field', 'forwarded-through-adapter']);

  const inspected = cli(['dispatch', 'inspect', '--dir', root, '--run', result.runId]);
  assert.equal(inspected.status, 0, inspected.stderr);
  const data = JSON.parse(inspected.stdout).data;
  assert.equal(data.inspectionStatus, 'resolved');
  assert.equal(data.runResult.runId, result.runId);
  assert.equal(data.runResult.classification.provenance, 'native-v2');
  assert.equal(data.runObservation.subject.runId, result.runId);
});

test('production assignment door distinguishes reviewer findings, invalid claim, provider crash, and resource timeout families', async () => {
  const root = tempRoot();
  const findingsExecutor = writeExecutor(root, 'findings-executor', `
    import fs from 'node:fs';
    import path from 'node:path';
    const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(process.argv.join(' '));
    const runDir = path.dirname(match[1]);
    fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Review\\nHIGH: production proof caught a real issue.\\n');
    fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({
      contract: { id: 'agent-result-claim', version: 2 },
      status: 'failed',
      summary: 'HIGH finding',
      error: { code: 'review-finding', severity: 'HIGH' },
      assessment: { verdict: 'findings', severityFloor: 'HIGH' }
    }));
  `);
  const invalidExecutor = writeExecutor(root, 'invalid-claim-executor', `
    import fs from 'node:fs';
    import path from 'node:path';
    const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(process.argv.join(' '));
    const runDir = path.dirname(match[1]);
    fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Invalid\\nA malformed claim should be a contract failure.\\n');
    fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'blocked', summary: '' }));
  `);
  const crashExecutor = writeExecutor(root, 'crash-executor', `
    process.stderr.write('provider crashed before writing artifacts\\n');
    process.exit(7);
  `);
  const hangingExecutor = writeExecutor(root, 'hanging-executor', `
    process.stdout.write('started but will exceed timeout\\n');
    setTimeout(() => process.exit(0), 10000);
  `);

  const reviewerAssignment = buildAssignment({
    workId: 'tsk-reviewer-findings',
    stage: 'executing',
    operation: 'review-item',
    role: 'reviewer',
  });
  const findings = await executeAssignment(reviewerAssignment, {
    cwd: root,
    repoRoot: root,
    runnerConfig: runnerConfig(findingsExecutor),
    isReadOnlyMode: true,
  });
  assert.equal(findings.classification.execution.status, 'completed');
  assert.equal(findings.classification.assessment.verdict, 'findings');
  assert.equal(findings.agentClaim.summary, 'HIGH finding');
  assert.equal(findings.classification.failure, null);

  const invalidAssignment = buildAssignment({
    workId: 'tsk-invalid-claim',
    stage: 'planning',
    operation: 'validate-plan',
  });
  const invalid = await executeAssignment(invalidAssignment, {
    cwd: root,
    repoRoot: root,
    runnerConfig: runnerConfig(invalidExecutor),
  });
  assert.equal(invalid.status, 'failed');
  assert.equal(invalid.confidence, 'failed');
  // M4 (dispatch-execution-engine architecture review 260920): invalid
  // schema means there is no real worker claim -- agentClaim must be
  // absent, never a runner-fabricated stand-in; the explanation moves to
  // runnerNote.
  assert.equal(invalid.agentClaim, undefined);
  assert.equal(invalid.runnerNote.summary, 'agent-result.json was present but failed schema validation');
  const invalidEvidence = readJson(path.join(runDirFor(root, invalidAssignment.assignmentId), 'evidence.json'));
  assert.equal(invalidEvidence.artifacts.find((artifact) => artifact.kind === 'agent-result')?.valid, false);

  const crashed = await executeAssignment(buildAssignment({
    workId: 'tsk-provider-crash',
    stage: 'planning',
    operation: 'validate-plan',
  }), {
    cwd: root,
    repoRoot: root,
    runnerConfig: runnerConfig(crashExecutor),
  });
  assert.equal(crashed.classification.failure.family, 'provider');
  assert.equal(crashed.classification.failure.code, 'nonzero-process-exit');

  const timedOut = await executeAssignment(buildAssignment({
    workId: 'tsk-resource-timeout',
    stage: 'planning',
    operation: 'validate-plan',
  }), {
    cwd: root,
    repoRoot: root,
    runnerConfig: runnerConfig(hangingExecutor, { timeoutMs: 100 }),
    timeoutMs: 100,
  });
  assert.equal(timedOut.classification.failure.family, 'resource');
  assert.equal(timedOut.classification.failure.code, 'execution-timeout');
});

test('inspect production door interprets historical and replayed RunResults without rewriting terminal bytes', () => {
  const root = tempRoot();
  const legacyBytes = `${JSON.stringify({ assignmentId: 'a', runId: 'run-legacy', status: 'done', confidence: 'reported' }, null, 2)}\n`;
  writeAssignmentMaterialization(root, 'a', 'run-legacy', legacyBytes);

  const legacy = cli(['dispatch', 'inspect', '--dir', root, '--run', 'run-legacy']);
  assert.equal(legacy.status, 0, legacy.stderr);
  const legacyData = JSON.parse(legacy.stdout).data;
  assert.equal(legacyData.runResult.classification.provenance, 'legacy-derived');
  assert.equal(fs.readFileSync(path.join(root, '.fgos', 'assignments', 'a', 'runs', '01', 'result.json'), 'utf8'), legacyBytes);

  const replayedBytes = `${JSON.stringify({
    contract: { id: 'assignment-run-result', version: 2 },
    assignmentId: 'b',
    runId: 'run-replayed',
    status: 'done',
    confidence: 'reported',
    classification: {
      execution: { status: 'completed', exitCode: 0 },
      assessment: { verdict: 'pass' },
      confidence: { level: 'reported', basis: ['replay-cache'] },
      failure: null,
      policy: { disposition: 'allow', code: null },
      delivery: { mode: 'replayed', sourceRunId: 'run-original' },
      provenance: 'native-v2',
    },
  }, null, 2)}\n`;
  writeAssignmentMaterialization(root, 'b', 'run-replayed', replayedBytes);
  const replayed = cli(['dispatch', 'inspect', '--dir', root, '--run', 'run-replayed']);
  assert.equal(replayed.status, 0, replayed.stderr);
  const replayedData = JSON.parse(replayed.stdout).data;
  assert.equal(replayedData.runResult.classification.delivery.mode, 'replayed');
  assert.equal(replayedData.runResult.classification.delivery.sourceRunId, 'run-original');
});

test('reconcile production routes refuse recovery semantics through CLI, operation catalog, dynamic import, and subprocess plan tampering', async () => {
  const root = tempRoot();
  const forbidden = [
    'kill-process',
    'signal-worker',
    'retry-run',
    'relaunch-run',
    'resume-driver',
    'reattach-execution',
    'reassign-work',
    'takeover-work',
    'admit-run',
    'cancel-execution',
    'recover',
  ];

  for (const action of forbidden) {
    const answer = cli(['dispatch', 'reconcile', 'plan', '--dir', root, '--action', action]);
    assert.equal(answer.status, 0, answer.stderr);
    assert.equal(JSON.parse(answer.stdout).data.outcome, 'refused', `CLI must refuse ${action}`);
  }

  const dispatchEntry = COMMAND_REGISTRY.find((entry) => entry.name === 'dispatch');
  assert.ok(dispatchEntry, 'dispatch command registry entry exists');
  assert.deepEqual(dispatchEntry.parameters.properties.action.description.match(/clear-cwd-lock|collect-result|clear-assignment-claim|repair-projection/g), [
    'clear-cwd-lock',
    'collect-result',
    'clear-assignment-claim',
    'repair-projection',
  ]);

  assert.throws(
    () => invokeDispatchReconcileOperation({
      operationId: 'dispatch.runtime.recover',
      effect: 'write',
      ctx: { repoRoot: root },
      payload: { action: 'resume-driver' },
    }),
    /unsupported Dispatch reconciliation operation/,
  );
  const hostRefusal = invokeDispatchReconcileOperation({
    operationId: 'dispatch.runtime.reconcile',
    effect: 'write',
    ctx: { repoRoot: root },
    payload: { action: 'resume-driver' },
  });
  assert.equal(hostRefusal.outcome, 'refused');

  const module = await import('../../src/verbs/dispatch/reconcile.mjs');
  assert.equal(module.reconcilePlanUseCase({ repoRoot: root }, { action: 'retry-run' }).outcome, 'refused');

  const tampered = {
    actionKey: 'reconcile_tampered_recovery',
    snapshot: { expiresAt: '2099-01-01T00:00:00.000Z' },
    proposedAction: { kind: 'resume-driver', runId: 'run-any' },
  };
  const applied = cli(['dispatch', 'reconcile', 'apply', '--dir', root, '--plan', JSON.stringify(tampered)]);
  assert.equal(applied.status, 0, applied.stderr);
  assert.equal(JSON.parse(applied.stdout).data.outcome, 'refused');

  const subprocess = spawnSync(process.execPath, ['-e', `
    import { invokeDispatchReconcileOperation } from ${JSON.stringify(pathToFileUrl(path.join(repo, 'src/verbs/dispatch/reconcile.mjs')))};
    const answer = invokeDispatchReconcileOperation({
      operationId: 'dispatch.runtime.reconcile',
      effect: 'write',
      ctx: { repoRoot: ${JSON.stringify(root)} },
      payload: { action: 'admit-run' }
    });
    process.stdout.write(JSON.stringify(answer));
  `], { encoding: 'utf8' });
  assert.equal(subprocess.status, 0, subprocess.stderr);
  assert.equal(JSON.parse(subprocess.stdout).outcome, 'refused');
});

function pathToFileUrl(file) {
  return new URL(`file://${file}`).href;
}
