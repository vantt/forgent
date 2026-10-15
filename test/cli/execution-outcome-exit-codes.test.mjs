// test/cli/execution-outcome-exit-codes.test.mjs — exit codes for execution outcomes (RUL99)

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { EXIT_CODES, OUTCOME_EXIT_CODES, exitCodeForOutcome } from '../../src/state/store.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';

seedFileLocalBwrapRegistry();

const BIN_FGOS = path.resolve('bin/fgos.mjs');

function setupTestRepo() {
  const repoDir = makeFixtureDir('fgos-exit-repo-');
  const stateDir = makeFixtureDir('fgos-exit-state-');
  execFileSync('git', ['init', '-b', 'main'], { cwd: repoDir, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', 'Exit Test'], { cwd: repoDir, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'exit@test.local'], { cwd: repoDir, stdio: 'ignore' });

  fs.writeFileSync(path.join(repoDir, 'README.md'), '# Exit Test\n');
  execFileSync('git', ['add', 'README.md'], { cwd: repoDir, stdio: 'ignore' });
  execFileSync('git', ['commit', '-m', 'init'], { cwd: repoDir, stdio: 'ignore' });
  const workerScript = path.join(repoDir, 'pass-worker.mjs');
  fs.writeFileSync(workerScript, `
import fs from 'node:fs';
import path from 'node:path';
const prompt = process.argv.slice(2).join(' ');
const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
if (match) {
  const claimDir = path.dirname(match[1]);
  const outbox = path.join(claimDir, 'worker-output', 'outbox');
  const runDir = fs.existsSync(outbox) ? outbox : claimDir;
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nThe assigned work was carried out and verified in full.\\n');
  fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'The assigned work was carried out and verified in full.', assessment: { verdict: 'pass' } }));
}
`);

  fs.mkdirSync(path.join(repoDir, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(repoDir, '.fgos', 'config.json'), JSON.stringify({
    runner: {
      defaultExecutor: 'mock-pass',
      rigorToTier: { standard: 'standard' },
      executors: {
        'mock-pass': {
          kind: 'agent',
          allowCrossProvider: true,
          providerModel: 'mock',
          invocations: [{
            id: 'mock-cli',
            via: 'cli',
            adapter: 'cli-spawn',
            confinement: { backend: 'bwrap' },
            command: process.execPath,
            args: [workerScript, '{prompt}'],
          }],
        },
      },
      capabilities: {
        'docs:write': { prefer: ['mock-pass'] },
      },
    },
  }, null, 2));

  return { repoDir, stateDir };
}

test('OUTCOME_EXIT_CODES defines execution outcome codes 10-14 and policy-refusal', () => {
  assert.equal(OUTCOME_EXIT_CODES['policy-refusal'], 4);
  assert.equal(OUTCOME_EXIT_CODES['provider-limit'], 10);
  assert.equal(OUTCOME_EXIT_CODES['execution-failure'], 11);
  assert.equal(OUTCOME_EXIT_CODES['partial-writes'], 12);
  assert.equal(OUTCOME_EXIT_CODES['blocked'], 13);
  assert.equal(OUTCOME_EXIT_CODES['findings'], 14);

  // Error categories are distinct from outcome codes
  assert.equal(EXIT_CODES['execution-failure'], undefined);
  assert.equal(EXIT_CODES['partial-writes'], undefined);
});

test('exitCodeForOutcome maps outcomes onto canonical exit codes', () => {
  assert.equal(exitCodeForOutcome('pass'), 0);
  assert.equal(exitCodeForOutcome('policy-refusal'), 4);
  assert.equal(exitCodeForOutcome('provider-limit'), 10);
  assert.equal(exitCodeForOutcome('execution-failure'), 11);
  assert.equal(exitCodeForOutcome('partial-writes'), 12);
  assert.equal(exitCodeForOutcome('blocked'), 13);
  assert.equal(exitCodeForOutcome('findings'), 14);
  assert.equal(exitCodeForOutcome('unknown-outcome'), 1);
  assert.equal(exitCodeForOutcome(null), 1);
  assert.equal(exitCodeForOutcome(undefined), 1);
  assert.equal(exitCodeForOutcome(123), 1);
});

test('each run outcome maps to its documented exit code', () => {
  const table = [
    ['pass', 0],
    ['policy-refusal', 4],
    ['provider-limit', 10],
    ['execution-failure', 11],
    ['partial-writes', 12],
    ['blocked', 13],
    ['findings', 14],
  ];
  for (const [outcome, code] of table) {
    assert.equal(exitCodeForOutcome(outcome), code, `Outcome ${outcome} must map to ${code}`);
  }
});

test('fgos run exits with code 0 on pass while emitting valid json envelope', () => {
  const { repoDir, stateDir } = setupTestRepo();
  try {
    const unitFile = path.join(repoDir, 'unit.json');
    fs.writeFileSync(unitFile, JSON.stringify({
      id: 'u-pass',
      objective: 'Run pass test',
      capability: 'docs:write',
      writes: [],
    }));

    const res = spawnSync(process.execPath, [BIN_FGOS, 'run', '--unit', unitFile, '--dir', repoDir], {
      cwd: repoDir,
      encoding: 'utf8',
      env: { ...process.env, XDG_STATE_HOME: stateDir, HOME: repoDir },
    });

    assert.equal(res.status, 0, `Expected exit 0, got ${res.status}: ${res.stderr}`);
    const envelope = JSON.parse(res.stdout);
    assert.equal(envelope.contract, 'fgos.v1');
    assert.equal(envelope.data.outcome, 'pass');
  } finally {
    fs.rmSync(repoDir, { recursive: true, force: true });
    fs.rmSync(stateDir, { recursive: true, force: true });
  }
});

test('fgos run exits with code 4 on policy-refusal while emitting valid json envelope', () => {
  const { repoDir, stateDir } = setupTestRepo();
  try {
    const unitFile = path.join(repoDir, 'unit.json');
    fs.writeFileSync(unitFile, JSON.stringify({
      id: 'u-refused',
      objective: 'Run refusal test',
      capability: 'missing-capability-pool',
      writes: [],
    }));

    const res = spawnSync(process.execPath, [BIN_FGOS, 'run', '--unit', unitFile, '--dir', repoDir], {
      cwd: repoDir,
      encoding: 'utf8',
      env: { ...process.env, XDG_STATE_HOME: stateDir, HOME: repoDir },
    });

    assert.equal(res.status, 4, `Expected exit 4 (policy-refusal), got ${res.status}`);
    const envelope = JSON.parse(res.stdout);
    assert.equal(envelope.contract, 'fgos.v1');
    assert.equal(envelope.data.outcome, 'policy-refusal');
  } finally {
    fs.rmSync(repoDir, { recursive: true, force: true });
    fs.rmSync(stateDir, { recursive: true, force: true });
  }
});

test('fgos run exits with code 11 on execution-failure via real CLI', () => {
  const { repoDir, stateDir } = setupTestRepo();
  try {
    const workerScript = path.join(repoDir, 'fail-worker.mjs');
    fs.writeFileSync(workerScript, 'process.exit(1);\n');
    const runner = {
      defaultExecutor: 'fail-exec',
      rigorToTier: { standard: 'standard' },
      executors: {
        'fail-exec': {
          kind: 'agent',
          allowCrossProvider: true,
          providerModel: 'fail',
          invocations: [{
            id: 'fail-cli',
            via: 'cli',
            adapter: 'cli-spawn',
            confinement: { backend: 'bwrap' },
            command: process.execPath,
            args: [workerScript, '{prompt}'],
          }],
        },
      },
      capabilities: {
        'docs:write': { prefer: ['fail-exec'] },
      },
    };
    fs.writeFileSync(path.join(repoDir, '.fgos', 'config.json'), JSON.stringify({ runner }, null, 2));

    const unitFile = path.join(repoDir, 'unit.json');
    fs.writeFileSync(unitFile, JSON.stringify({
      id: 'u-exec-fail',
      objective: 'Run failure test',
      capability: 'docs:write',
      writes: [],
    }));

    const res = spawnSync(process.execPath, [BIN_FGOS, 'run', '--unit', unitFile, '--dir', repoDir], {
      cwd: repoDir,
      encoding: 'utf8',
      env: { ...process.env, XDG_STATE_HOME: stateDir, HOME: repoDir },
    });

    assert.equal(res.status, 11, `Expected exit 11 (execution-failure), got ${res.status}: ${res.stderr}`);
    const envelope = JSON.parse(res.stdout);
    assert.equal(envelope.contract, 'fgos.v1');
    assert.equal(envelope.data.outcome, 'execution-failure');
  } finally {
    fs.rmSync(repoDir, { recursive: true, force: true });
    fs.rmSync(stateDir, { recursive: true, force: true });
  }
});

test('fgos workflow start detached exits 0 on successful process spawn', () => {
  const { repoDir, stateDir } = setupTestRepo();
  try {
    const unitsFile = path.join(repoDir, 'units.json');
    fs.writeFileSync(unitsFile, JSON.stringify([
      { id: 'u-detach', objective: 'Detached unit', capability: 'missing-cap' },
    ]));

    const res = spawnSync(process.execPath, [BIN_FGOS, 'workflow', 'start', '--units', unitsFile, '--dir', repoDir], {
      cwd: repoDir,
      encoding: 'utf8',
      env: { ...process.env, XDG_STATE_HOME: stateDir, HOME: repoDir },
    });

    assert.equal(res.status, 0, `Expected exit 0 for detached spawn, got ${res.status}: ${res.stderr}`);
    const envelope = JSON.parse(res.stdout);
    assert.equal(envelope.contract, 'fgos.v1');
    assert.equal(envelope.data.status, 'running');

    // Wait until the detached child finishes advancing before cleanup
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      const statusRes = spawnSync(process.execPath, [BIN_FGOS, 'workflow', 'status', envelope.data.workflowRunId, '--dir', repoDir], {
        cwd: repoDir,
        encoding: 'utf8',
        env: { ...process.env, XDG_STATE_HOME: stateDir, HOME: repoDir },
      });
      if (statusRes.status === 0) {
        const s = JSON.parse(statusRes.stdout).data?.status;
        if (s !== 'running') break;
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    }
  } finally {
    fs.rmSync(repoDir, { recursive: true, force: true });
    fs.rmSync(stateDir, { recursive: true, force: true });
  }
});

test('fgos workflow start --foreground exits with non-zero matching the workflow failure outcome', () => {
  const { repoDir, stateDir } = setupTestRepo();
  try {
    const unitsFile = path.join(repoDir, 'units.json');
    fs.writeFileSync(unitsFile, JSON.stringify([
      { id: 'u-fail', objective: 'Test fail', capability: 'missing-capability' },
    ]));

    const res = spawnSync(process.execPath, [BIN_FGOS, 'workflow', 'start', '--units', unitsFile, '--foreground', '--dir', repoDir], {
      cwd: repoDir,
      encoding: 'utf8',
      env: { ...process.env, XDG_STATE_HOME: stateDir, HOME: repoDir },
    });

    assert.equal(res.status, 4, `Expected exit 4 for failed unit outcome, got ${res.status}`);
    const envelope = JSON.parse(res.stdout);
    assert.equal(envelope.contract, 'fgos.v1');
    assert.equal(envelope.data.status, 'failed');
    assert.equal(envelope.data.outcome, 'policy-refusal');
  } finally {
    fs.rmSync(repoDir, { recursive: true, force: true });
    fs.rmSync(stateDir, { recursive: true, force: true });
  }
});

test('fgos workflow status on a failed run always exits 0', () => {
  const { repoDir, stateDir } = setupTestRepo();
  try {
    const unitsFile = path.join(repoDir, 'units.json');
    fs.writeFileSync(unitsFile, JSON.stringify([
      { id: 'u-fail-read', objective: 'Test fail read', capability: 'missing-capability' },
    ]));

    const resRun = spawnSync(process.execPath, [BIN_FGOS, 'workflow', 'start', '--units', unitsFile, '--foreground', '--dir', repoDir], {
      cwd: repoDir,
      encoding: 'utf8',
      env: { ...process.env, XDG_STATE_HOME: stateDir, HOME: repoDir },
    });
    assert.equal(resRun.status, 4);
    const runData = JSON.parse(resRun.stdout).data;
    assert.equal(runData.status, 'failed');

    const resStatus = spawnSync(process.execPath, [BIN_FGOS, 'workflow', 'status', runData.workflowRunId, '--dir', repoDir], {
      cwd: repoDir,
      encoding: 'utf8',
      env: { ...process.env, XDG_STATE_HOME: stateDir, HOME: repoDir },
    });
    assert.equal(resStatus.status, 0, `workflow status must exit 0, got ${resStatus.status}: ${resStatus.stderr}`);
    const statusData = JSON.parse(resStatus.stdout).data;
    assert.equal(statusData.status, 'failed');
    assert.equal(statusData.outcome, 'policy-refusal');
  } finally {
    fs.rmSync(repoDir, { recursive: true, force: true });
    fs.rmSync(stateDir, { recursive: true, force: true });
  }
});
