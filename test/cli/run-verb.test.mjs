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
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';

const BIN_FGOS = path.resolve('bin/fgos.mjs');

function setupTestRepo() {
  const tmp = makeFixtureDir('fgos-cli-run-test-');
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

// `fgos run "<prompt>"`: the CLI builds the unit itself and runs it through the same door.
const runCli = (args, cwd) => execFileSync(process.execPath, [BIN_FGOS, 'run', ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const failCli = (args, cwd) => {
  try {
    runCli(args, cwd);
  } catch (err) {
    return err.stderr + err.stdout;
  }
  assert.fail(`fgos run ${args.join(' ')} should have failed`);
};
const unitRunsOf = (tmp) => {
  const dir = path.join(tmp, '.fgos', 'assignments');
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((name) => name.startsWith('unit-run-')) : [];
};
const unitRecordOf = (tmp, stdout) => {
  const unitRunId = /"unitRunId": "([^"]+)"/.exec(stdout)[1];
  return JSON.parse(fs.readFileSync(path.join(tmp, '.fgos', 'assignments', unitRunId, 'unit.json'), 'utf8'));
};

test('fgos run "<prompt>" builds a read-only unit from the prompt and runs it', () => {
  const tmp = setupTestRepo();
  const stdout = runCli(['Write the release notes', '--capability', 'docs:write', '--dir', tmp], tmp);
  assert.ok(stdout.includes('"outcome": "pass"'), stdout);
  const { unit } = unitRecordOf(tmp, stdout);
  assert.match(unit.id, /^adhoc-write-the-release-notes-[0-9a-f]{4}$/);
  assert.equal(unit.objective, 'Write the release notes');
  assert.equal(unit.capability, 'docs:write');
  assert.deepEqual(unit.writes, []);
  assert.equal(unit.prefer, undefined);
});

test('fgos run "<prompt>" turns --provider, --persona and --rigor into the unit', () => {
  const tmp = setupTestRepo();
  fs.mkdirSync(path.join(tmp, 'fgos', 'agents'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'fgos', 'agents', 'test-voice.yaml'), 'name: test-voice\ndescription: A test voice\n');
  const stdout = runCli(['Check it', '--capability', 'docs:write', '--provider', 'test-node', '--persona', 'test-voice', '--rigor', 'high', '--dir', tmp], tmp);
  const record = unitRecordOf(tmp, stdout);
  assert.deepEqual(record.unit.prefer, ['test-node']);
  assert.equal(record.unit.persona, 'test-voice');
  assert.equal(record.unit.rigor, 'high');
  const binding = record.bindings['producer/1'][0].binding;
  assert.equal(binding.provenance.executor.source, 'unit-prefer');
  assert.deepEqual(binding.provenance.persona, { value: 'test-voice', source: 'unit' });
});

test('fgos run "<prompt>" refuses an unknown --provider and names the valid ones, before any unit run exists', () => {
  const tmp = setupTestRepo();
  const out = failCli(['Check it', '--capability', 'docs:write', '--provider', 'test-node,nope', '--dir', tmp], tmp);
  assert.match(out, /unknown --provider "nope"/);
  assert.match(out, /test-node/);
  assert.deepEqual(unitRunsOf(tmp), []);
});

test('fgos run "<prompt>" refuses an unknown --persona before any unit run exists', () => {
  const tmp = setupTestRepo();
  const out = failCli(['Check it', '--capability', 'docs:write', '--persona', 'no-such-voice', '--dir', tmp], tmp);
  assert.match(out, /persona "no-such-voice" not found/);
  assert.deepEqual(unitRunsOf(tmp), []);
});

test('fgos run "<prompt>" --writes from the main checkout without --worktree asks for a worktree', () => {
  const tmp = setupTestRepo();
  const out = failCli(['Write notes', '--capability', 'docs:write', '--writes', 'notes.md', '--dir', tmp], tmp);
  assert.match(out, /--writes needs a linked worktree: create one with `git worktree add <path>` and pass --worktree <path>/);
  assert.deepEqual(unitRunsOf(tmp), []);
});

test('fgos run "<prompt>" --writes from a linked worktree records the write scope', () => {
  const tmp = setupTestRepo();
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: tmp, stdio: 'ignore' });
  const wt = makeFixtureDir('fgos-cli-run-wt-');
  fs.rmSync(wt, { recursive: true, force: true });
  execFileSync('git', ['worktree', 'add', '-q', '-b', 'wt', wt], { cwd: tmp, stdio: 'ignore' });
  let stdout;
  try {
    stdout = runCli(['Write notes', '--capability', 'docs:write', '--writes', 'notes.md,docs/a.md', '--dir', tmp], wt);
  } catch (err) {
    stdout = err.stdout;
  }
  const record = unitRecordOf(tmp, stdout);
  assert.deepEqual(record.unit.writes, ['notes.md', 'docs/a.md']);
  assert.equal(record.worktree, fs.realpathSync(wt));
});

test('fgos run "<prompt>" --effort reaches the override bind() reads', () => {
  const tmp = setupTestRepo();
  // The fixture's executor has no reasoning-effort flag, so the launch refuses the level; the
  // override the unit run recorded is what this checks.
  failCli(['Check it', '--capability', 'docs:write', '--effort', 'high', '--dir', tmp], tmp);
  const [unitRunId] = unitRunsOf(tmp);
  const record = JSON.parse(fs.readFileSync(path.join(tmp, '.fgos', 'assignments', unitRunId, 'unit.json'), 'utf8'));
  assert.deepEqual(record.overrides, [{ origin: 'human-cli', reasoningEffort: 'high' }]);
  assert.equal(record.unit.objective, 'Check it');
});

test('fgos run "<prompt>" with both --provider and an --override executor: the override pins', () => {
  const tmp = setupTestRepo();
  const stdout = runCli(['Check it', '--capability', 'docs:write', '--provider', 'test-node', '--override', '{"executor":"test-node"}', '--dir', tmp], tmp);
  const record = unitRecordOf(tmp, stdout);
  assert.deepEqual(record.unit.prefer, ['test-node']);
  assert.equal(record.bindings['producer/1'][0].binding.provenance.executor.source, 'override');
});

test('fgos run "<prompt>" makes an ascii id of bounded length from any prompt', () => {
  const tmp = setupTestRepo();
  const prompt = `Sửa lỗi đăng nhập: "quote" & <tag> ${'x'.repeat(200)}`;
  const first = unitRecordOf(tmp, runCli([prompt, '--capability', 'docs:write', '--dir', tmp], tmp)).unit;
  const second = unitRecordOf(tmp, runCli([prompt, '--capability', 'docs:write', '--dir', tmp], tmp)).unit;
  assert.match(first.id, /^adhoc-[a-z0-9-]{1,40}-[0-9a-f]{4}$/);
  assert.ok(first.id.startsWith('adhoc-sua-loi-dang-nhap-quote-tag-xxxxxxx'), first.id);
  assert.equal(first.id.slice(0, -5), second.id.slice(0, -5), 'the same prompt gives the same slug');
  assert.equal(first.objective, prompt);
  const symbols = unitRecordOf(tmp, runCli(['!!! ???', '--capability', 'docs:write', '--dir', tmp], tmp)).unit;
  assert.match(symbols.id, /^adhoc-task-[0-9a-f]{4}$/);
});

test('fgos run refuses a prompt together with --unit or --resume', () => {
  const tmp = setupTestRepo();
  assert.match(failCli(['Check it', '--unit', 'x.yaml', '--dir', tmp], tmp), /either a "<prompt>", --unit or --resume/);
});
