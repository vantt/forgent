// test/runner/dispatch-governance-operability.test.mjs
// Verification test suite for dispatch governance, public CLI, observation truth, and doctor coherence.

import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { RunnerConfigError } from '../../src/runner/dispatch/runner-config-error.mjs';
import { executeAssignment as executeAssignmentRaw } from '../../src/runner/dispatch/assignment-runner.mjs';
import { bindableExecute } from '../helpers/work-seat-config.mjs';
const executeAssignment = bindableExecute(executeAssignmentRaw);
import { buildAssignment } from '../helpers/declared-assignment.mjs';
import {
} from '../../src/setup/registrations.mjs';


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
        invocations: [{ id: 'claude-cli', via: 'cli', command: process.execPath, args: [workerScript] }],
        providerModel: 'claude',
        allowCrossProvider: true,
      },
      'codex-bwrap': {
        invocations: [{ id: 'codex-bwrap-cli', via: 'cli', command: process.execPath, args: [workerScript] }],
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
        invocations: [{ id: 'claude-cli', via: 'cli', command: process.execPath, args: [workerScript, '{prompt}', '--model', '{model}'] }],
        providerModel: 'claude',
        allowCrossProvider: true,
      },
      'codex-bwrap': {
        invocations: [{ id: 'codex-bwrap-cli', via: 'cli', command: process.execPath, args: [workerScript, '{prompt}', '--model', '{model}'] }],
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

// ─── 5. Workspace and Ownership Closed Vocabulary ──────────────────────────────

