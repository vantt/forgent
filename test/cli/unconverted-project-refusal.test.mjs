// Every production door that reads or fills the project's runner config surfaces the same refusal for a project that
// is not in the seat-binding schema: it still carries `rigorToTier`, or has no `runner.patterns.seatBinding` marker.
// The refusal names `fgos setup`, comes before any default is written, and leaves the file as it was. The doors are
// the fourteen call sites of the one function that loads and fills the config (`ensureRunnerConfigForDir`).

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

import { fanoutBatchExecutorCli } from '../../src/runner/fanout-batch.mjs';
import { snapshotRunnerConfig } from '../../src/runner/execution/run.mjs';
import { executeAssignment } from '../../src/runner/dispatch/assignment-runner.mjs';
import { executeExecutorCli, decideExecutorCli } from '../../src/runner/dispatch/cli.mjs';
import { ensureRunnerConfigForDir } from '../../src/runner/dispatch/config.mjs';

const FGOS = path.resolve('bin/fgos.mjs');
const RUNNER = path.resolve('bin/fgos-runner.mjs');

const base = () => ({
  executor: { command: 'claude', args: ['-p', '{prompt}'] },
  timeoutMs: 1000,
  modelPolicies: { claude: { standard: 'sonnet' } },
});
const SHAPES = {
  'rigorToTier still present': () => ({ ...base(), patterns: { seatBinding: { schema: 1 } }, rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' } }),
  'no seatBinding marker': () => base(),
};

function project(runner) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-refusal-home-'));
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-refusal-repo-')));
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: root });
  execFileSync('git', ['-c', 'user.email=t@example.com', '-c', 'user.name=T', 'commit', '-q', '--allow-empty', '-m', 'init'], { cwd: root });
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  const file = path.join(root, '.fgos', 'config.json');
  fs.writeFileSync(file, `${JSON.stringify({ runner }, null, 2)}\n`);
  return { home, root, file, before: fs.readFileSync(file, 'utf8') };
}

const REFUSAL = /fgos setup/;

for (const [shape, runnerOf] of Object.entries(SHAPES)) {
  const cli = (args, { cwd, home, entry = FGOS }) => spawnSync(process.execPath, [entry, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, HOME: home, USERPROFILE: home },
  });

  test(`CLI doors refuse a project with ${shape}, name fgos setup, and leave the file as it was`, () => {
    const doors = [
      ['run --timeout', ['run', 'Check it', '--capability', 'execute', '--timeout', '5m']],
      ['run --provider', ['run', 'Check it', '--capability', 'execute', '--provider', 'claude']],
      ['discover', ['discover', 'tsk-none']],
      ['plan', ['plan', 'tsk-none']],
      ['tool check', ['tool', 'check']],
      ['dispatch decide', ['dispatch', 'decide', 'claude']],
      ['dispatch probe-account', ['dispatch', 'probe-account', '--provider', 'claude', '--account', 'nobody']],
    ];
    for (const [door, args] of doors) {
      const { home, root, file, before } = project(runnerOf());
      const result = cli([...args, '--dir', root], { cwd: root, home });
      const text = `${result.stderr}${result.stdout}`;
      assert.notEqual(result.status, 0, `${door}: ${text}`);
      assert.match(text, REFUSAL, `${door}: ${text}`);
      assert.equal(fs.readFileSync(file, 'utf8'), before, `${door}: the project file is untouched`);
    }
  });

  test(`the runner entry refuses a project with ${shape} the same way`, () => {
    const { home, root, file, before } = project(runnerOf());
    const result = cli(['--dry-run'], { cwd: root, home, entry: RUNNER });
    assert.notEqual(result.status, 0, `${result.stderr}${result.stdout}`);
    assert.match(`${result.stderr}${result.stdout}`, REFUSAL);
    assert.equal(fs.readFileSync(file, 'utf8'), before);
  });

  test(`library doors refuse a project with ${shape}: the fan-out batch, the config snapshot, the assignment runner and the executor doors`, async () => {
    const { home, root, file, before } = project(runnerOf());
    const savedHome = process.env.HOME;
    const savedProfile = process.env.USERPROFILE;
    process.env.HOME = home;
    process.env.USERPROFILE = home;
    const quiet = process.stderr.write;
    process.stderr.write = () => true;
    try {
      const refused = (error) => error?.code === 'config-not-converted' && REFUSAL.test(error.message);
      assert.throws(() => ensureRunnerConfigForDir(root), refused);
      assert.throws(() => snapshotRunnerConfig(root), refused);
      await assert.rejects(() => fanoutBatchExecutorCli(['cand1'], { repoRoot: root, hasLiveTaskAccess: false }), refused);
      await assert.rejects(() => executeAssignment({ assignmentId: 'asgn-x', role: 'producer', operation: 'op', policy: {} }, { cwd: root, repoRoot: root }), refused);
      await assert.rejects(() => executeExecutorCli('claude', { sharedCwd: true, prompt: 'hi', cwd: root, repoRoot: root }), refused);
      await assert.rejects(() => decideExecutorCli('claude', { repoRoot: root, cwd: root }), refused);
    } finally {
      process.stderr.write = quiet;
      process.env.HOME = savedHome;
      if (savedProfile !== undefined) process.env.USERPROFILE = savedProfile;
      else delete process.env.USERPROFILE;
    }
    assert.equal(fs.readFileSync(file, 'utf8'), before);
  });
}
