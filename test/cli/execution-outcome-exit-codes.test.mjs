// test/cli/execution-outcome-exit-codes.test.mjs — exit codes for execution outcomes (RUL99)

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { EXIT_CODES, exitCodeForOutcome } from '../../src/state/store.mjs';

const BIN_FGOS = path.resolve('bin/fgos.mjs');

function setupTestRepo() {
  const tmp = fs.mkdtempSync('/tmp/fgos-exit-test-');
  execFileSync('git', ['init', '-b', 'main'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', 'Exit Test'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'exit@test.local'], { cwd: tmp, stdio: 'ignore' });

  fs.writeFileSync(path.join(tmp, 'README.md'), '# Exit Test\n');
  execFileSync('git', ['add', 'README.md'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['commit', '-m', 'init'], { cwd: tmp, stdio: 'ignore' });

  fs.mkdirSync(path.join(tmp, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(tmp, '.fgos', 'config.json'), JSON.stringify({
    runner: {
      defaultExecutor: 'native-claude',
      rigorToTier: { standard: 'standard' },
      executors: {
        'native-claude': {
          kind: 'agent',
          agentType: 'claude',
          providerModel: 'claude',
        },
      },
      capabilities: {
        'docs:write': { prefer: ['native-claude'] },
      },
    },
  }, null, 2));

  return tmp;
}

test('EXIT_CODES defines execution outcome codes 10-14 and policy-refusal', () => {
  assert.equal(EXIT_CODES['policy-refusal'], 4);
  assert.equal(EXIT_CODES['provider-limit'], 10);
  assert.equal(EXIT_CODES['execution-failure'], 11);
  assert.equal(EXIT_CODES['partial-writes'], 12);
  assert.equal(EXIT_CODES['blocked'], 13);
  assert.equal(EXIT_CODES['findings'], 14);
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
  const tmp = setupTestRepo();
  try {
    const unitFile = path.join(tmp, 'unit.json');
    fs.writeFileSync(unitFile, JSON.stringify({
      id: 'u-pass',
      objective: 'Run pass test',
      capability: 'docs:write',
      writes: [],
    }));

    const res = spawnSync(process.execPath, [BIN_FGOS, 'run', '--unit', unitFile, '--dir', tmp], {
      cwd: tmp,
      encoding: 'utf8',
      env: { ...process.env, XDG_STATE_HOME: '/tmp/fgos-state' },
    });

    assert.equal(res.status, 0, `Expected exit 0, got ${res.status}: ${res.stderr}`);
    const envelope = JSON.parse(res.stdout);
    assert.equal(envelope.contract, 'fgos.v1');
    assert.equal(envelope.data.outcome, 'pass');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('fgos run exits with code 4 on policy-refusal while emitting valid json envelope', () => {
  const tmp = setupTestRepo();
  try {
    const unitFile = path.join(tmp, 'unit.json');
    fs.writeFileSync(unitFile, JSON.stringify({
      id: 'u-refused',
      objective: 'Run refusal test',
      capability: 'missing-capability-pool',
      writes: [],
    }));

    const res = spawnSync(process.execPath, [BIN_FGOS, 'run', '--unit', unitFile, '--dir', tmp], {
      cwd: tmp,
      encoding: 'utf8',
      env: { ...process.env, XDG_STATE_HOME: '/tmp/fgos-state' },
    });

    assert.equal(res.status, 4, `Expected exit 4 (policy-refusal), got ${res.status}`);
    const envelope = JSON.parse(res.stdout);
    assert.equal(envelope.contract, 'fgos.v1');
    assert.equal(envelope.data.outcome, 'policy-refusal');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('fgos workflow start detached exits 0 on successful process spawn', () => {
  const tmp = setupTestRepo();
  try {
    const res = spawnSync(process.execPath, [BIN_FGOS, 'workflow', 'start', 'delphi', '--request', 'Test request', '--dir', tmp], {
      cwd: tmp,
      encoding: 'utf8',
      env: { ...process.env, XDG_STATE_HOME: '/tmp/fgos-state' },
    });

    assert.equal(res.status, 0, `Expected exit 0 for detached spawn, got ${res.status}`);
    const envelope = JSON.parse(res.stdout);
    assert.equal(envelope.contract, 'fgos.v1');
    assert.equal(envelope.data.status, 'running');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('fgos workflow start --foreground exits with non-zero matching the workflow failure outcome', () => {
  const tmp = setupTestRepo();
  try {
    const unitsFile = path.join(tmp, 'units.json');
    fs.writeFileSync(unitsFile, JSON.stringify([
      { id: 'u-fail', objective: 'Test fail', capability: 'missing-capability' },
    ]));

    const res = spawnSync(process.execPath, [BIN_FGOS, 'workflow', 'start', '--units', unitsFile, '--foreground', '--dir', tmp], {
      cwd: tmp,
      encoding: 'utf8',
      env: { ...process.env, XDG_STATE_HOME: '/tmp/fgos-state' },
    });

    assert.equal(res.status, 4, `Expected exit 4 for failed unit outcome, got ${res.status}`);
    const envelope = JSON.parse(res.stdout);
    assert.equal(envelope.contract, 'fgos.v1');
    assert.equal(envelope.data.status, 'failed');
    assert.equal(envelope.data.outcome, 'policy-refusal');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
