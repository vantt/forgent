// test/cli/run-verb.test.mjs — Integration tests for fgos run CLI verb

import '../helpers/process-tmp-root.mjs';
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
import { activateGitFixture } from '../helpers/git-fixture.mjs';
import { writeGlobalConfig, writeProjectConfig } from '../helpers/config-fixture.mjs';

const BIN_FGOS = path.resolve('bin/fgos.mjs');

function setupTestRepo() {
  const tmp = makeFixtureDir('fgos-cli-run-test-');
  execFileSync('git', ['init', '-b', 'main'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', 'CLI Test'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'cli@test.local'], { cwd: tmp, stdio: 'ignore' });
  activateGitFixture(tmp);

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
      defaults: { tier: 'standard' },
      modelPolicies: { node: { nano: 'node-nano', standard: 'node-std', advanced: 'node-adv', flagship: 'node-flagship', frontier: 'node-frontier' } },
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
      patterns: { seatBinding: { schema: 1 },
        defaultRule: { mutatingMinRigor: 'standard' },
        reviewed: { maxRounds: 2, checkersByRigor: { standard: ['reviewer'] } },
      },
    },
  };
  writeProjectConfig(tmp, cfg);

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
    seat: 'producer',
    role: 'producer',
    posture: { inlineAllowed: true },
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
  assert.deepEqual(record.overrides, [{ reasoningEffort: 'high' }], 'the door names no origin that claims a person typed it');
  assert.equal(record.unit.objective, 'Check it');
});

test('fgos run "<prompt>" --timeout gives the run its own time, kept in unit.json and handed to the dispatch', () => {
  const tmp = setupTestRepo();
  const stdout = runCli(['Port the parser', '--capability', 'docs:write', '--timeout', '90m', '--dir', tmp], tmp);
  assert.ok(stdout.includes('"outcome": "pass"'), stdout);
  const unitRunId = /"unitRunId": "([^"]+)"/.exec(stdout)[1];
  const record = unitRecordOf(tmp, stdout);
  assert.deepEqual(record.overrides, [{ timeoutMs: 5400000 }]);
  const binding = record.bindings['producer/1'][0].binding;
  assert.equal(binding.timeoutMs, 5400000);
  assert.deepEqual(binding.provenance.timeoutMs, { value: 5400000, source: 'override' });
  const runJsons = [];
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name === 'run.json') runJsons.push(p); } };
  walk(path.join(tmp, '.fgos', 'assignments', unitRunId));
  assert.ok(runJsons.length > 0);
  for (const p of runJsons) assert.equal(JSON.parse(fs.readFileSync(p, 'utf8')).timeoutMs, 5400000, p);
});

test('fgos run --timeout is refused when malformed, out of range, or on a resume, before any unit run exists', () => {
  const tmp = setupTestRepo();
  assert.match(failCli(['Check it', '--capability', 'docs:write', '--timeout', '90', '--dir', tmp], tmp), /--timeout/);
  assert.match(failCli(['Check it', '--capability', 'docs:write', '--timeout', '9h', '--dir', tmp], tmp), /at most 4h/);
  assert.match(failCli(['Check it', '--capability', 'docs:write', '--override', '{"timeoutMs":5}', '--dir', tmp], tmp), /timeout/);
  assert.match(failCli(['--resume', 'unit-run-1-x', '--timeout', '90m', '--dir', tmp], tmp), /--timeout cannot change a resumed unit run/);
  assert.deepEqual(unitRunsOf(tmp), []);
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

test('fgos run "<prompt>" --writes with a --worktree that is the main checkout is refused before any unit run exists', () => {
  const tmp = setupTestRepo();
  const out = failCli(['Write notes', '--capability', 'docs:write', '--writes', 'notes.md', '--worktree', tmp, '--dir', tmp], tmp);
  assert.match(out, /--writes needs a linked worktree/);
  assert.deepEqual(unitRunsOf(tmp), []);
});

test('fgos run refuses one-liner flags without a prompt, an unquoted multi-word prompt, and an empty --writes', () => {
  const tmp = setupTestRepo();
  assert.match(failCli(['--unit', 'x.yaml', '--provider', 'test-node', '--dir', tmp], tmp), /--provider only applies to fgos run "<prompt>"/);
  assert.match(failCli(['fix', 'the', 'typo', '--capability', 'docs:write', '--dir', tmp], tmp), /quote the prompt/);
  assert.match(failCli(['Write notes', '--capability', 'docs:write', '--writes', '--dir', tmp], tmp), /--writes needs at least one path/);
  assert.deepEqual(unitRunsOf(tmp), []);
});

// `--account <pool/account>` pins the account through the same override field `--override` carries.
// The fixture's executor has no account list, so a pin on it is refused before any unit run exists.
const accountHome = () => {
  const home = makeFixtureDir('fgos-cli-run-home-');
  fs.mkdirSync(path.join(home, '.fgos'), { recursive: true });
  writeGlobalConfig(home, { runner: {} });
  return home;
};
const failCliHome = (args, cwd, home) => {
  try {
    execFileSync(process.execPath, [BIN_FGOS, 'run', ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, HOME: home } });
  } catch (err) {
    return err.stderr + err.stdout;
  }
  assert.fail(`fgos run ${args.join(' ')} should have failed`);
};

test('fgos run "<prompt>" --account on an executor without an account list is refused before any unit run exists', () => {
  const tmp = setupTestRepo();
  const out = failCliHome(['Check it', '--capability', 'docs:write', '--account', 'node/acct1', '--dir', tmp], tmp, accountHome());
  assert.match(out, /account "node\/acct1" cannot be pinned: pool "node" has no account list/);
  assert.deepEqual(unitRunsOf(tmp), []);
});

test('fgos run --override with an "account" key is checked the same way', () => {
  const tmp = setupTestRepo();
  const out = failCliHome(['Check it', '--capability', 'docs:write', '--override', '{"account":"node/acct1"}', '--dir', tmp], tmp, accountHome());
  assert.match(out, /has no account list/);
  assert.deepEqual(unitRunsOf(tmp), []);
});

test('fgos run --resume refuses --account: a resumed run keeps the account it started with', () => {
  const tmp = setupTestRepo();
  const out = failCliHome(['--resume', 'unit-run-1-abc', '--account', 'acct1', '--dir', tmp], tmp, accountHome());
  assert.match(out, /--account cannot change a resumed unit run/);
});

test('fgos run --account needs an account id', () => {
  const tmp = setupTestRepo();
  const out = failCliHome(['Check it', '--capability', 'docs:write', '--account', '--dir', tmp], tmp, accountHome());
  assert.match(out, /--account requires pool\/account/);
});

test('fgos run --sync <ref> without a prompt makes a sync-only unit; with --unit, --resume or no --writes it is refused', () => {
  const tmp = setupTestRepo();
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: tmp, stdio: 'ignore' });
  const wt = makeFixtureDir('fgos-cli-run-sync-wt-');
  fs.rmSync(wt, { recursive: true, force: true });
  execFileSync('git', ['worktree', 'add', '-q', '-b', 'wt', wt], { cwd: tmp, stdio: 'ignore' });
  assert.match(failCli(['--unit', 'x.yaml', '--sync', 'main', '--dir', tmp], tmp), /--sync only applies to fgos run "<prompt>" or a bare --sync/);
  assert.match(failCli(['--sync', 'main', '--capability', 'docs:write', '--dir', tmp], wt), /--sync needs --writes/);
  assert.match(failCli(['--sync', '--writes', 'docs', '--dir', tmp], wt), /--sync requires a ref/);
  assert.deepEqual(unitRunsOf(tmp), []);
  // main is already in the branch: a sync-only unit is up to date and passes without a worker.
  const stdout = runCli(['--sync', 'main', '--capability', 'docs:write', '--writes', 'docs', '--dir', tmp], wt);
  const record = unitRecordOf(tmp, stdout);
  assert.equal(record.unit.syncBase, 'main');
  assert.equal(record.unit.syncOnly, true);
  assert.equal(record.sync.status, 'up-to-date');
  assert.equal(record.settlement.outcome, 'pass');
});

test('fgos run "<prompt>" turns --input and --verify into the unit\'s inputs and verify', () => {
  const tmp = setupTestRepo();
  const stdout = runCli(['Check the readme', '--capability', 'docs:write', '--input', 'README.md', '--verify', 'node -e "process.exit(0)"', '--dir', tmp], tmp);
  assert.ok(stdout.includes('"outcome": "pass"'), stdout);
  const { unit } = unitRecordOf(tmp, stdout);
  assert.deepEqual(unit.inputs, ['README.md']);
  assert.equal(unit.verify, 'node -e "process.exit(0)"');
});

test('fgos run "<prompt>" without --input or --verify leaves both off the unit', () => {
  const tmp = setupTestRepo();
  const { unit } = unitRecordOf(tmp, runCli(['Check the readme', '--capability', 'docs:write', '--dir', tmp], tmp));
  assert.deepEqual(unit.inputs, []);
  assert.equal(unit.verify, undefined);
});

test('fgos run refuses an empty --input or --verify, and either one beside --unit, before any unit run exists', () => {
  const tmp = setupTestRepo();
  assert.match(failCli(['Check it', '--capability', 'docs:write', '--input', '--dir', tmp], tmp), /--input needs at least one repo-relative path/);
  assert.match(failCli(['Check it', '--capability', 'docs:write', '--verify', '--dir', tmp], tmp), /--verify requires a command/);
  const unitFile = path.join(tmp, 'my-unit.yaml');
  fs.writeFileSync(unitFile, 'id: u-flags\nobjective: Test\ncapability: docs:write\nwrites: []\n');
  assert.match(failCli(['--unit', unitFile, '--verify', 'npm test', '--dir', tmp], tmp), /--verify only applies to fgos run "<prompt>"/);
  assert.match(failCli(['--unit', unitFile, '--input', 'README.md', '--dir', tmp], tmp), /--input only applies to fgos run "<prompt>"/);
  assert.deepEqual(unitRunsOf(tmp), []);
});

test('fgos run help names --input and --verify', () => {
  const out = execFileSync(process.execPath, [BIN_FGOS, 'run', '--help'], { encoding: 'utf8' });
  assert.ok(out.includes('--input'), out);
  assert.ok(out.includes('--verify'), out);
});

// The raise doors: no door of this release can attest a person, so `fgos run` raises nothing. A tier above the
// one a seat resolves to, a persona or capability the person typed that resolves above it, and an accepted
// dependence are refused by name before any unit run exists; at or below the resolved tier everything works.
const setRunnerConfig = (tmp, patch) => {
  const file = path.join(tmp, '.fgos', 'config.json');
  const cfg = JSON.parse(fs.readFileSync(file, 'utf8'));
  writeProjectConfig(tmp, { ...cfg, runner: patch(cfg.runner) });
};

test('fgos run --override with a tier above the resolved tier is refused by name, and no unit run is left behind', () => {
  const tmp = setupTestRepo();
  const out = failCli(['Check it', '--capability', 'docs:write', '--override', '{"tier":"frontier"}', '--dir', tmp], tmp);
  assert.match(out, /tier-escalation-unauthorized/);
  assert.match(out, /frontier/);
  assert.deepEqual(unitRunsOf(tmp), []);
});

test('fgos run --override with a tier at or below the resolved tier still runs, at that tier', () => {
  const tmp = setupTestRepo();
  const stdout = runCli(['Check it', '--capability', 'docs:write', '--override', '{"tier":"nano"}', '--dir', tmp], tmp);
  assert.ok(stdout.includes('"outcome": "pass"'), stdout);
  const record = unitRecordOf(tmp, stdout);
  assert.equal(record.bindings['producer/1'][0].binding.tier, 'nano');
  assert.equal(record.bindings['producer/1'][0].binding.provenance.tier.source, 'override');
});

test('fgos run --persona whose seat tier is above what the seat resolves to without it is refused by name', () => {
  const tmp = setupTestRepo();
  fs.mkdirSync(path.join(tmp, 'fgos', 'agents'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'fgos', 'agents', 'test-voice.yaml'), 'name: test-voice\ndescription: A test voice\n');
  setRunnerConfig(tmp, (runner) => ({
    ...runner,
    capabilities: { ...runner.capabilities, 'docs:write': { ...runner.capabilities['docs:write'], personas: { 'test-voice': { tier: 'flagship' } } } },
  }));
  const refused = failCli(['Check it', '--capability', 'docs:write', '--persona', 'test-voice', '--dir', tmp], tmp);
  assert.match(refused, /tier-escalation-unauthorized/);
  assert.match(refused, /persona/);
  assert.deepEqual(unitRunsOf(tmp), []);
  // The same persona the person did not choose at the door (a unit file) is the project's own taste.
  const unitFile = path.join(tmp, 'persona-unit.yaml');
  fs.writeFileSync(unitFile, 'id: u-persona\nobjective: Test\ncapability: docs:write\npersona: test-voice\nwrites: []\n');
  const own = execFileSync(process.execPath, [BIN_FGOS, 'run', '--unit', unitFile, '--dir', tmp], { cwd: tmp, encoding: 'utf8' });
  assert.equal(unitRecordOf(tmp, own).bindings['producer/1'][0].binding.tier, 'flagship');
});

test('fgos run --capability whose tier is above the one the door would have run is refused by name', () => {
  const tmp = setupTestRepo();
  setRunnerConfig(tmp, (runner) => ({
    ...runner,
    capabilities: { ...runner.capabilities, 'docs:write': { ...runner.capabilities['docs:write'], tier: 'flagship' } },
  }));
  const refused = failCli(['Check it', '--capability', 'docs:write', '--dir', tmp], tmp);
  assert.match(refused, /tier-escalation-unauthorized/);
  assert.match(refused, /capability/);
  assert.deepEqual(unitRunsOf(tmp), []);
});

test('fgos run --override that accepts a dependence is refused at the door, whatever origin it names', () => {
  const tmp = setupTestRepo();
  for (const origin of ['human-cli', 'agent']) {
    const out = failCli(['Check it', '--capability', 'docs:write', '--override', JSON.stringify({ origin, acceptDependence: true }), '--dir', tmp], tmp);
    assert.match(out, /dependence-acceptance-unauthorized/, origin);
  }
  assert.deepEqual(unitRunsOf(tmp), []);
});

test('fgos run keeps --timeout: it raises no tier', () => {
  const tmp = setupTestRepo();
  const stdout = runCli(['Check it', '--capability', 'docs:write', '--timeout', '5m', '--dir', tmp], tmp);
  assert.ok(stdout.includes('"outcome": "pass"'), stdout);
  const binding = unitRecordOf(tmp, stdout).bindings['producer/1'][0].binding;
  assert.equal(binding.timeoutMs, 300000);
  assert.equal(binding.tier, 'standard');
});
