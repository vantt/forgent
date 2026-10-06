// test/cli/run-verb.test.mjs — Integration tests for fgos run CLI verb

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';

seedFileLocalBwrapRegistry();
// bwrap mounts a tmpfs over /tmp, so confined workers can only see fixtures elsewhere.
const FIXTURE_ROOT = fs.existsSync('/var/tmp') ? '/var/tmp' : os.tmpdir();

const BIN_FGOS = path.resolve('bin/fgos.mjs');

function setupTestRepo() {
  const tmp = fs.mkdtempSync(path.join(FIXTURE_ROOT, 'fgos-cli-run-test-'));
  execFileSync('git', ['init', '-b', 'main'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', 'CLI Test'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'cli@test.local'], { cwd: tmp, stdio: 'ignore' });

  fs.writeFileSync(path.join(tmp, 'README.md'), '# CLI Test\n');
  execFileSync('git', ['add', 'README.md'], { cwd: tmp, stdio: 'ignore' });
  const echoScript = path.join(tmp, 'echo-worker.mjs');
  fs.writeFileSync(
    echoScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const prompt = process.argv.slice(2).join(' ');
    const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
    let runDir;
    if (match) {
      runDir = (() => { const d = path.dirname(match[1]); const o = path.join(d, 'worker-output', 'outbox'); return fs.existsSync(o) ? o : d; })();
    } else {
      const asgnDir = path.join(process.cwd(), '.fgos', 'assignments');
      if (fs.existsSync(asgnDir)) {
        for (const top of fs.readdirSync(asgnDir)) {
          const p1 = path.join(asgnDir, top, 'runs', '01');
          if (fs.existsSync(p1)) { runDir = p1; break; }
        }
      }
    }
    if (runDir) {
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nAssignment execution completed successfully.\\n');
      fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done' }));
    }
    `,
  );
  const fgosDir = path.join(tmp, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });
  const cfg = {
    runner: {
      defaultExecutor: 'test-node',
      rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
      modelPolicies: { node: { standard: 'node-std' } },
      executors: {
        'test-node': {
          kind: 'agent',
          description: 'Test agent',
          allowCrossProvider: true,
          command: process.execPath,
          args: [echoScript, '{prompt}'],
          providerModel: 'node',
          invocations: [{ id: 'cli-default', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command: process.execPath, args: [echoScript, '{prompt}'] }],
        },
      },
      capabilities: {
        'docs:write': { prefer: [{ executor: 'test-node' }], rigor: 'standard' },
      },
      patterns: {
        defaultRule: { mutatingMinRigor: 'standard' },
        reviewed: { maxRounds: 2, checkersByRigor: { standard: ['reviewer'] } },
      },
    },
  };
  fs.writeFileSync(path.join(fgosDir, 'config.json'), JSON.stringify(cfg, null, 2));

  return tmp;
}

test('fgos run --help describes the command', () => {
  const out = execFileSync(process.execPath, [BIN_FGOS, 'run', '--help'], { encoding: 'utf8' });
  assert.ok(out.includes('fgos run'));
  assert.ok(out.includes('--unit'));
});

test('fgos run requires --unit or --resume', () => {
  const tmp = setupTestRepo();
  assert.throws(
    () => execFileSync(process.execPath, [BIN_FGOS, 'run'], { cwd: tmp, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }),
    (err) => err.status !== 0 && err.stderr.includes('fgos run requires --unit <file|-> or --resume <unitRunId>'),
  );
});

test('fgos run executes read-only unit from file', () => {
  const tmp = setupTestRepo();
  const unitFile = path.join(tmp, 'my-unit.yaml');
  fs.writeFileSync(unitFile, 'id: u-cli-1\nobjective: Test objective\ncapability: docs:write\nwrites: []\n');

  const stdout = execFileSync(
    process.execPath,
    [BIN_FGOS, 'run', '--unit', unitFile, '--pattern', 'solo', '--dir', tmp],
    { cwd: tmp, encoding: 'utf8' },
  );

  assert.ok(stdout.includes('unit-run-'));
  assert.ok(stdout.includes('"outcome": "pass"'));
});

test('fgos run record completes pending inline turn with verified evidence', () => {
  const tmp = setupTestRepo();
  const unitRunId = 'unit-run-cli-record-1';
  const unitDir = path.join(tmp, '.fgos', 'assignments', unitRunId);
  fs.mkdirSync(unitDir, { recursive: true });

  const unitRecord = {
    unit: { id: 'u-inline-cli', objective: 'Test inline CLI', capability: 'docs:write', writes: ['evidence.md'] },
    overrides: [],
    worktree: fs.realpathSync(tmp),
  };
  fs.writeFileSync(path.join(unitDir, 'unit.json'), JSON.stringify(unitRecord, null, 2));

  const pending = {
    unitRunId,
    role: 'producer',
    round: 1,
    nonce: 'cli-nonce-abc',
  };
  fs.writeFileSync(path.join(unitDir, 'pending-inline.json'), JSON.stringify(pending, null, 2));

  fs.writeFileSync(path.join(tmp, 'evidence.md'), '# Evidence\n');

  const stdout = execFileSync(
    process.execPath,
    [
      BIN_FGOS,
      'run',
      'record',
      '--unit-run',
      unitRunId,
      '--role',
      'producer',
      '--round',
      '1',
      '--nonce',
      'cli-nonce-abc',
      '--evidence',
      'evidence.md',
      '--dir',
      tmp,
    ],
    { cwd: tmp, encoding: 'utf8' },
  );

  assert.ok(stdout.includes('"ok": true'));
  assert.ok(stdout.includes(unitRunId));
});
