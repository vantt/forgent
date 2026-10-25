// The two config layers after rigorToTier is retired. The global file still carries the bare-verb
// capabilities, and every release on the machine reads them: it must keep loading, untouched.
// These tests run with a real global file on disk (a temp HOME), not with the layer mocked.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { globalConfigPath, projectConfigPath, writeGlobalConfig, writeProjectConfig } from '../helpers/config-fixture.mjs';

import { DEFAULT_RUNNER_CONFIG, loadRunnerConfigForDir } from '../../src/runner/dispatch/config.mjs';

const GLOBAL_RUNNER = () => ({
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
  const globalFile = globalConfigPath(home);
  if (globalRunner) writeGlobalConfig(home, { runner: globalRunner });
  const projectFile = projectConfigPath(repo);
  if (project) {
    fs.mkdirSync(path.dirname(projectFile), { recursive: true });
    writeProjectConfig(repo, project);
  }
  const saved = { HOME: process.env.HOME, USERPROFILE: process.env.USERPROFILE };
  process.env.HOME = home;
  process.env.USERPROFILE = home;
  try {
    return fn({ repo, home, globalFile, projectFile });
  } finally {
    process.env.HOME = saved.HOME;
    if (saved.USERPROFILE !== undefined) process.env.USERPROFILE = saved.USERPROFILE;
    else delete process.env.USERPROFILE;
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(repo, { recursive: true, force: true });
  }
}
const bytes = (file) => fs.readFileSync(file, 'utf8');

test('a global file that carries the bare verbs loads under a project, untouched', () => {
  withMachine({ project: { runner: CONVERTED_PROJECT() } }, ({ repo, globalFile }) => {
    const before = bytes(globalFile);
    const merged = loadRunnerConfigForDir(repo);
    assert.deepEqual(Object.keys(merged.capabilities).filter((name) => ['advise', 'execute', 'review'].includes(name)).sort(), ['advise', 'execute', 'review'], 'the global bare-verb entries stay, as exact keys');
    assert.equal(merged.defaults.tier, 'standard');
    assert.equal(bytes(globalFile), before, 'setup is the only writer of the global file');
  });
});

test('a project with no runner section reads the standard with the schema marker, never rigorToTier, and is not written', () => {
  const machineExecutor = { executor: { command: 'claude', args: ['-p', '{prompt}'] } };
  withMachine({ project: {}, globalRunner: machineExecutor }, ({ repo, projectFile }) => {
    const before = bytes(projectFile);
    const loaded = loadRunnerConfigForDir(repo);
    assert.equal(loaded.patterns.seatBinding.schema, 1);
    assert.equal('rigorToTier' in loaded, false);
    assert.equal(bytes(projectFile), before, 'a read never writes');
  });
  withMachine({ project: undefined, globalRunner: machineExecutor }, ({ repo, projectFile }) => {
    const loaded = loadRunnerConfigForDir(repo);
    assert.equal(loaded.patterns.seatBinding.schema, 1);
    assert.equal(fs.existsSync(projectFile), false, 'a read creates no project file');
  });
});

test('the defaults setup writes into the global file carry neither rigorToTier nor the project file\'s schema marker', () => {
  assert.equal('rigorToTier' in DEFAULT_RUNNER_CONFIG, false);
  assert.equal(DEFAULT_RUNNER_CONFIG.patterns.seatBinding, undefined, 'the marker is the project file\'s own: setup writes DEFAULT_RUNNER_CONFIG into the global file too');
});
