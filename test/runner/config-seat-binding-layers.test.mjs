// The two config layers after rigorToTier is retired. The global file of a machine that has not re-run setup
// still carries `rigorToTier` and the bare-verb capabilities, and every older release on it still requires
// them: it must keep loading, untouched. A project file in the old shape is refused by name and never rewritten.
// These tests run with a real global file on disk (a temp HOME), not with the layer mocked.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  DEFAULT_RUNNER_CONFIG,
  FRESH_PROJECT_RUNNER_CONFIG,
  ensureRunnerConfigForDir,
  loadRunnerConfig,
  loadRunnerConfigFromDir,
} from '../../src/runner/dispatch/config.mjs';

const GLOBAL_RUNNER = () => ({
  rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
  capabilities: {
    advise: { description: 'bare verb', serves: { outputKind: 'advice' } },
    execute: { description: 'bare verb', serves: { outputKind: 'execution' } },
    review: { description: 'bare verb', serves: { outputKind: 'review' } },
  },
});

const CONVERTED_PROJECT = () => ({
  executor: { command: 'claude', args: ['-p', '{prompt}'] },
  timeoutMs: 5000,
  modelPolicies: { claude: { standard: 'sonnet' } },
  patterns: { seatBinding: { schema: 1 } },
  defaults: { tier: 'standard' },
});

function withMachine({ globalRunner = GLOBAL_RUNNER(), project }, fn) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-layers-home-'));
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-layers-repo-'));
  fs.mkdirSync(path.join(home, '.fgos'), { recursive: true });
  const globalFile = path.join(home, '.fgos', 'config.json');
  if (globalRunner) fs.writeFileSync(globalFile, `${JSON.stringify({ runner: globalRunner }, null, 2)}\n`);
  const projectFile = path.join(repo, '.fgos', 'config.json');
  if (project) {
    fs.mkdirSync(path.dirname(projectFile), { recursive: true });
    fs.writeFileSync(projectFile, `${JSON.stringify(project, null, 2)}\n`);
  }
  const saved = { HOME: process.env.HOME, USERPROFILE: process.env.USERPROFILE, write: process.stderr.write };
  const stderr = [];
  process.env.HOME = home;
  process.env.USERPROFILE = home;
  process.stderr.write = (chunk) => { stderr.push(String(chunk)); return true; };
  try {
    return fn({ repo, home, globalFile, projectFile, stderr });
  } finally {
    process.stderr.write = saved.write;
    process.env.HOME = saved.HOME;
    if (saved.USERPROFILE !== undefined) process.env.USERPROFILE = saved.USERPROFILE;
    else delete process.env.USERPROFILE;
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(repo, { recursive: true, force: true });
  }
}
const bytes = (file) => fs.readFileSync(file, 'utf8');

test('a global file that still carries rigorToTier and the bare verbs loads under a converted project, untouched', () => {
  withMachine({ project: { runner: CONVERTED_PROJECT() } }, ({ repo, globalFile, stderr }) => {
    const before = bytes(globalFile);
    for (const load of [loadRunnerConfigFromDir, ensureRunnerConfigForDir]) {
      const merged = load(repo);
      assert.equal('rigorToTier' in merged, false, 'the retired key is dropped from the global layer before the merge');
      assert.deepEqual(Object.keys(merged.capabilities).sort(), ['advise', 'execute', 'review'], 'the global bare-verb entries stay, as exact keys');
      assert.equal(merged.defaults.tier, 'standard');
    }
    assert.equal(bytes(globalFile), before, 'setup is the only writer of the global file');
    assert.ok(stderr.join('').includes('runner.rigorToTier'), 'the drop is said once on stderr');
  });
});

test('a project file that still carries rigorToTier is refused by name, and nothing is written', () => {
  const project = { runner: { ...CONVERTED_PROJECT(), rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' } } };
  withMachine({ project }, ({ repo, projectFile, globalFile }) => {
    const [projectBefore, globalBefore] = [bytes(projectFile), bytes(globalFile)];
    for (const load of [loadRunnerConfigFromDir, ensureRunnerConfigForDir]) {
      assert.throws(() => load(repo), (error) => {
        assert.equal(error.code, 'config-not-converted');
        assert.match(error.message, /run `fgos setup`/);
        assert.match(error.message, /rigorToTier/);
        return true;
      });
    }
    assert.equal(bytes(projectFile), projectBefore);
    assert.equal(bytes(globalFile), globalBefore);
  });
});

test('a project runner without the schema marker is refused by name, and the fill-missing writer leaves the file alone', () => {
  const { patterns: _marker, ...unmarked } = CONVERTED_PROJECT();
  withMachine({ project: { runner: unmarked } }, ({ repo, projectFile }) => {
    const before = bytes(projectFile);
    for (const load of [loadRunnerConfigFromDir, ensureRunnerConfigForDir]) {
      assert.throws(() => load(repo), (error) => error.code === 'config-not-converted' && /patterns\.seatBinding\.schema/.test(error.message) && /fgos setup/.test(error.message));
    }
    assert.equal(bytes(projectFile), before, 'nothing was added before the refusal');
  });
});

test('a project with no runner section is bootstrapped with the defaults and the schema marker, never with rigorToTier', () => {
  withMachine({ project: {}, globalRunner: null }, ({ repo, projectFile }) => {
    const loaded = ensureRunnerConfigForDir(repo);
    const written = JSON.parse(bytes(projectFile)).runner;
    assert.equal(written.patterns.seatBinding.schema, 1);
    assert.equal('rigorToTier' in written, false);
    assert.equal('rigorToTier' in loaded, false);
  });
  withMachine({ project: undefined, globalRunner: null }, ({ repo, projectFile }) => {
    ensureRunnerConfigForDir(repo);
    const written = JSON.parse(bytes(projectFile)).runner;
    assert.equal(written.patterns.seatBinding.schema, 1);
    assert.equal('rigorToTier' in written, false);
  });
});

test('the fill-missing writer never puts rigorToTier or the schema marker into the defaults it writes elsewhere', () => {
  assert.equal('rigorToTier' in DEFAULT_RUNNER_CONFIG, false);
  assert.equal(DEFAULT_RUNNER_CONFIG.patterns.seatBinding, undefined, 'the marker is the project file\'s own: setup writes DEFAULT_RUNNER_CONFIG into the global file too');
  assert.equal(FRESH_PROJECT_RUNNER_CONFIG.patterns.seatBinding.schema, 1);
  // A converted project missing an ordinary default gets that default and nothing retired.
  const { timeoutMs: _timeout, ...withoutTimeout } = CONVERTED_PROJECT();
  withMachine({ project: { runner: withoutTimeout }, globalRunner: null }, ({ repo, projectFile }) => {
    ensureRunnerConfigForDir(repo);
    const written = JSON.parse(bytes(projectFile)).runner;
    assert.equal(written.timeoutMs, DEFAULT_RUNNER_CONFIG.timeoutMs);
    assert.equal('rigorToTier' in written, false);
  });
});

test('a runner config file handed to the loader directly with rigorToTier is refused as retired', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-layers-file-'));
  const file = path.join(dir, 'runner.json');
  try {
    fs.writeFileSync(file, JSON.stringify({ ...CONVERTED_PROJECT(), rigorToTier: { standard: 'standard' } }));
    assert.throws(() => loadRunnerConfig(file), /retired "rigorToTier".*fgos setup/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
