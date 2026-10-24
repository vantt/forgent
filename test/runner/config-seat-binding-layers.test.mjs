// The two config layers after rigorToTier is retired. The global file still carries the bare-verb
// capabilities, and every release on the machine reads them: it must keep loading, untouched.
// These tests run with a real global file on disk (a temp HOME), not with the layer mocked.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { writeGlobalConfig, writeProjectConfig } from '../helpers/config-fixture.mjs';

import {
  DEFAULT_RUNNER_CONFIG,
  FRESH_PROJECT_RUNNER_CONFIG,
  ensureRunnerConfigForDir,
  loadRunnerConfigFromDir,
} from '../../src/runner/dispatch/config.mjs';

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
  const globalFile = path.join(home, '.fgos', 'config.json');
  if (globalRunner) writeGlobalConfig(home, { runner: globalRunner });
  const projectFile = path.join(repo, '.fgos', 'config.json');
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
    for (const load of [loadRunnerConfigFromDir, ensureRunnerConfigForDir]) {
      const merged = load(repo);
      assert.deepEqual(Object.keys(merged.capabilities).sort(), ['advise', 'execute', 'review'], 'the global bare-verb entries stay, as exact keys');
      assert.equal(merged.defaults.tier, 'standard');
    }
    assert.equal(bytes(globalFile), before, 'setup is the only writer of the global file');
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
