// test/runner/dispatch-governance-operability.test.mjs
// Verification test suite for dispatch governance, public CLI, observation truth, and doctor coherence.

import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { RunnerConfigError } from '../../src/runner/dispatch/config.mjs';
import { executeAssignment as executeAssignmentRaw } from '../../src/runner/dispatch/assignment-runner.mjs';
import { bindableExecute } from '../helpers/work-seat-config.mjs';
import { writeProjectConfig } from '../helpers/config-fixture.mjs';
const executeAssignment = bindableExecute(executeAssignmentRaw);
import { buildAssignment } from '../helpers/declared-assignment.mjs';
import { showRunUseCase, readRunSnapshot } from '../../src/verbs/dispatch/show-run.mjs';
import { watchRunUseCase } from '../../src/verbs/dispatch/watch.mjs';
import {
  inspectDispatchRuntime,
  VALID_PHASES,
  VALID_RESOURCE_STATES,
  VALID_DELIVERIES,
  VALID_COMPLETENESS,
  INSPECTION_STATUSES,
} from '../../src/runner/dispatch/runtime-inspection.mjs';
import {
} from '../../src/setup/registrations.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..');

function runFgos(args, options = {}) {
  return spawnSync(process.execPath, ['bin/fgos.mjs', ...args], {
    cwd: REPO,
    encoding: 'utf8',
    ...options,
  });
}

function runDispatchDirect(args, options = {}) {
  return spawnSync(process.execPath, ['src/runner/dispatch.mjs', ...args], {
    cwd: REPO,
    encoding: 'utf8',
    ...options,
  });
}

// ─── 1. Governance-blocked vs Unregistered Result Shape ────────────────────────

test('governance-blocked versus unregistered result shape across public CLI and compat doors', () => {
  // 1a. Unregistered executor via CLI door: wrapped in fgos.v1 envelope, mechanism: unavailable, reasonCodes: ['selector.unregistered'], configured: false
  const unregCli = runFgos(['dispatch', 'decide', 'unregistered-test-executor-id']);
  assert.equal(unregCli.status, 0, unregCli.stderr);
  const unregCliParsed = JSON.parse(unregCli.stdout);
  assert.equal(unregCliParsed.contract, 'fgos.v1');
  assert.equal(unregCliParsed.data.mechanism, 'unavailable');
  assert.equal(unregCliParsed.data.configured, false);
  assert.ok(Array.isArray(unregCliParsed.data.reasonCodes));
  assert.ok(unregCliParsed.data.reasonCodes.includes('selector.unregistered'));
  assert.equal(unregCliParsed.data.blockedReason, undefined);

  // 1b. Unregistered executor via compat door: raw JSON without envelope
  const unregCompat = runDispatchDirect(['decide', 'unregistered-test-executor-id']);
  assert.equal(unregCompat.status, 0, unregCompat.stderr);
  const unregCompatParsed = JSON.parse(unregCompat.stdout);
  assert.equal(unregCompatParsed.contract, undefined);
  assert.equal(unregCompatParsed.mechanism, 'unavailable');
  assert.equal(unregCompatParsed.configured, false);
  assert.ok(Array.isArray(unregCompatParsed.reasonCodes));
  assert.ok(unregCompatParsed.reasonCodes.includes('selector.unregistered'));

  // 1c. Governance-blocked executor via config: mechanism: unavailable, reasonCodes: ['governance.blocked'], blockedReason defined
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-gov-shape-test-'));
  spawnSync('git', ['init'], { cwd: tmp, stdio: 'ignore' });
  const fgosDir = path.join(tmp, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });
  writeProjectConfig(tmp, {
      runner: {
        patterns: { seatBinding: { schema: 1 } },
        governance: {
          disallowedExecutors: ['blocked-worker'],
        },
        executors: {
          'blocked-worker': {
            kind: 'agent',
            command: 'echo',
            args: ['blocked'],
            providerModel: 'openai-codex',
            allowCrossProvider: false,
          },
        },
      },
    });

  const govCli = runFgos(['dispatch', 'decide', 'blocked-worker', '--dir', tmp]);
  assert.equal(govCli.status, 0, govCli.stderr);
  const govCliParsed = JSON.parse(govCli.stdout);
  assert.equal(govCliParsed.contract, 'fgos.v1');
  assert.equal(govCliParsed.data.mechanism, 'unavailable');
  assert.ok(Array.isArray(govCliParsed.data.reasonCodes));
  assert.ok(govCliParsed.data.reasonCodes.includes('governance.blocked'));
  assert.ok(typeof govCliParsed.data.blockedReason === 'string' && govCliParsed.data.blockedReason.length > 0);

  fs.rmSync(tmp, { recursive: true, force: true });
});

// ─── 2. Cross-Provider Refusal Before Spawn ───────────────────────────────────

test('cross-provider executor without explicit opt-in fails closed BEFORE worker spawn', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-probe-xprovider-'));
  const workerScript = path.join(tmp, 'worker.mjs');
  const capturePath = path.join(tmp, 'spawn-marker.txt');

  fs.writeFileSync(
    workerScript,
    `import fs from 'node:fs'; fs.writeFileSync(${JSON.stringify(capturePath)}, 'SPAWNED'); process.exit(0);`,
  );

  const runnerConfig = {
    executors: {
      claude: {
        command: process.execPath,
        args: [workerScript],
        providerModel: 'claude',
        allowCrossProvider: true,
      },
      'codex-bwrap': {
        command: process.execPath,
        args: [workerScript],
        providerModel: 'openai-codex',
        // No allowCrossProvider: prompt content would leave the Claude ecosystem.
      },
    },
    modelPolicies: { claude: { standard: 'test-model' }, 'openai-codex': { standard: 'test-model' } },
    defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } },
  };

  const work = { id: 'tsk-xprovider-probe', status: 'todo', stage: 'planning', domain: 'coding' };
  const assignment = buildAssignment({
    work,
    stage: 'planning',
    operation: 'shape-plan',
    policy: { preferExecutor: 'codex-bwrap' },
  });

  await assert.rejects(
    executeAssignment(assignment, { cwd: tmp, repoRoot: tmp, runnerConfig }),
    (err) => {
      assert.ok(err instanceof RunnerConfigError);
      assert.match(err.message, /cross-provider egress target/);
      assert.match(err.message, /allowCrossProvider/);
      return true;
    },
  );

  assert.equal(fs.existsSync(capturePath), false, 'worker process must NEVER be spawned when the executor is refused');
  fs.rmSync(tmp, { recursive: true, force: true });
});

// ─── 3. Approved cross-provider executor records its provenance ────────────────

test('an opted-in cross-provider executor runs and records executor + provider in dispatch-plan.json', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-probe-provenance-'));
  const workerScript = path.join(tmp, 'worker.mjs');

  fs.writeFileSync(
    workerScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const cwd = process.cwd();
    const runsDir = path.join(cwd, '.fgos', 'assignments');
    if (fs.existsSync(runsDir)) {
      for (const asgn of fs.readdirSync(runsDir)) {
        const rDir = path.join(runsDir, asgn, 'runs', '01');
        if (fs.existsSync(rDir)) {
          fs.writeFileSync(path.join(rDir, 'worker-output', 'outbox', 'report-1.md'), '# Planning Report\\nArchitecture validation and design specifications completed successfully.\\n');
          fs.writeFileSync(path.join(rDir, 'worker-output', 'outbox', 'result-1.json'), JSON.stringify({ status: 'done', summary: 'Planning completed successfully' }));
        }
      }
    }
    process.exit(0);
    `,
  );

  const runnerConfig = {
    executors: {
      claude: {
        command: process.execPath,
        args: [workerScript, '{prompt}', '--model', '{model}'],
        providerModel: 'claude',
        allowCrossProvider: true,
      },
      'codex-bwrap': {
        command: process.execPath,
        args: [workerScript, '{prompt}', '--model', '{model}'],
        providerModel: 'openai-codex',
        allowCrossProvider: true,
      },
    },
    modelPolicies: {
      claude: { standard: 'claude-3-5-sonnet' },
      'openai-codex': { standard: 'gpt-4o' },
    },
    defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } },
  };

  const work = { id: 'tsk-provenance-probe', status: 'todo', stage: 'planning', domain: 'coding' };
  const assignment = buildAssignment({
    work,
    stage: 'planning',
    operation: 'shape-plan',
    policy: { preferExecutor: 'codex-bwrap' },
  });

  const result = await executeAssignment(assignment, { cwd: tmp, repoRoot: tmp, runnerConfig });
  assert.equal(result.status, 'done');

  const runDir = path.join(tmp, '.fgos', 'assignments', assignment.assignmentId, 'runs', '01');
  const planPath = path.join(runDir, 'dispatch-plan.json');
  assert.ok(fs.existsSync(planPath), 'dispatch-plan.json must be persisted');

  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  assert.equal(plan.executorId, 'codex-bwrap');
  assert.equal(plan.redirectDecision, undefined, 'the read-only redirect mechanism is retired');

  fs.rmSync(tmp, { recursive: true, force: true });
});

// ─── 4. Watch with Valid/Corrupt/Empty/Directory Result Evidence ───────────────

test('watch terminates on valid result.json and stops on corrupt/empty/directory evidence', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-probe-watch-'));
  const runDir = path.join(tmp, '.fgos', 'assignments', 'asgn_probe', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify({ runId: 'run_p4', assignmentId: 'asgn_probe', status: 'running' }));

  const resultPath = path.join(runDir, 'result.json');

  // Case A: Absent -> settled false
  const snapA = showRunUseCase({ repoRoot: tmp }, { runId: 'run_p4' });
  assert.equal(snapA.settled, false);
  assert.equal(snapA.resultCorrupt, undefined);

  // Case B: Valid result -> terminates terminal, settled: true
  fs.writeFileSync(resultPath, JSON.stringify({ runId: 'run_p4', status: 'done' }));
  const watchB = await watchRunUseCase({ repoRoot: tmp }, { runId: 'run_p4' });
  assert.equal(watchB.settled, true);
  assert.equal(watchB.stoppedBecause, 'terminal');

  // Case C: Empty result (0 bytes) -> terminates corrupt-evidence, settled: false
  fs.writeFileSync(resultPath, '');
  const watchC = await watchRunUseCase({ repoRoot: tmp }, { runId: 'run_p4' });
  assert.equal(watchC.settled, false);
  assert.equal(watchC.resultCorrupt, true);
  assert.equal(watchC.stoppedBecause, 'corrupt-evidence');

  // Case D: Invalid JSON -> terminates corrupt-evidence, settled: false
  fs.writeFileSync(resultPath, '{ not json');
  const watchD = await watchRunUseCase({ repoRoot: tmp }, { runId: 'run_p4' });
  assert.equal(watchD.settled, false);
  assert.equal(watchD.resultCorrupt, true);
  assert.equal(watchD.stoppedBecause, 'corrupt-evidence');

  // Case E: Vacuous {} -> terminates corrupt-evidence, settled: false
  fs.writeFileSync(resultPath, '{}');
  const watchE = await watchRunUseCase({ repoRoot: tmp }, { runId: 'run_p4' });
  assert.equal(watchE.settled, false);
  assert.equal(watchE.resultCorrupt, true);
  assert.equal(watchE.stoppedBecause, 'corrupt-evidence');

  // Case F: Directory result.json -> terminates corrupt-evidence, settled: false
  fs.rmSync(resultPath);
  fs.mkdirSync(resultPath);
  const watchF = await watchRunUseCase({ repoRoot: tmp }, { runId: 'run_p4' });
  assert.equal(watchF.settled, false);
  assert.equal(watchF.resultCorrupt, true);
  assert.equal(watchF.stoppedBecause, 'corrupt-evidence');

  // Case G: Terminal run status with corrupt result -> never reports settled success
  fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify({ runId: 'run_p4', assignmentId: 'asgn_probe', status: 'settled' }));
  const watchG = await watchRunUseCase({ repoRoot: tmp }, { runId: 'run_p4' });
  assert.equal(watchG.settled, false);
  assert.equal(watchG.resultCorrupt, true);
  assert.equal(watchG.stoppedBecause, 'corrupt-evidence');

  fs.rmSync(tmp, { recursive: true, force: true });
});

// ─── 5. Workspace and Ownership Closed Vocabulary ──────────────────────────────

test('RunObservation fields strictly adhere to closed vocabularies', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-probe-vocab-'));
  const asgnDir = path.join(tmp, '.fgos', 'assignments', 'asgn_vocab');
  const runDir = path.join(asgnDir, 'runs', '01');
  const genDir = path.join(asgnDir, 'admission', 'generations');
  fs.mkdirSync(runDir, { recursive: true });
  fs.mkdirSync(genDir, { recursive: true });

  fs.writeFileSync(path.join(asgnDir, 'assignment.json'), JSON.stringify({ assignmentId: 'asgn_vocab' }));
  fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify({
    runId: 'run_v1',
    assignmentId: 'asgn_vocab',
    status: 'running',
    launchedAt: new Date().toISOString(),
  }));
  fs.writeFileSync(path.join(genDir, '0000000001.json'), JSON.stringify({ runId: 'run_v1', attempt: 1 }));

  const res = inspectDispatchRuntime(tmp, { run: 'run_v1' });
  const obs = res.runObservation;

  assert.ok(obs, 'runObservation must exist');
  assert.ok(VALID_PHASES.has(obs.phase), `phase ${obs.phase} must be valid`);
  assert.ok(VALID_RESOURCE_STATES.has(obs.resourceState), `resourceState ${obs.resourceState} must be valid`);
  assert.ok(VALID_DELIVERIES.has(obs.delivery), `delivery ${obs.delivery} must be valid`);
  assert.ok(INSPECTION_STATUSES.has(obs.inspectionStatus), `inspectionStatus ${obs.inspectionStatus} must be valid`);

  // Closed completeness assertions
  assert.equal(obs.evidenceCompleteness.workspace, 'unsupported', 'workspace completeness must be unsupported without writer');
  assert.equal(obs.evidenceCompleteness.ownership, 'complete', 'admitted run ownership must be complete');

  for (const [dim, val] of Object.entries(obs.evidenceCompleteness)) {
    assert.ok(VALID_COMPLETENESS.has(val), `completeness for ${dim}: ${val} must be in VALID_COMPLETENESS`);
    assert.notEqual(val, 'partial', `completeness field ${dim} must never leak partial`);
    assert.notEqual(val, 'incomplete', `completeness field ${dim} must never leak incomplete`);
  }

  fs.rmSync(tmp, { recursive: true, force: true });
});
