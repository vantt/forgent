import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { DOCTOR_CHECKS } from '../../src/setup/checks.mjs';
import { checkWorkflowPoolsSatisfyIndependence } from '../../src/setup/workflow-pool-independence.mjs';
import { simulateUnitBindings } from '../../src/runner/execution/dry-bind.mjs';

// Native-agent executors carry no spawned process, so bind() accepts them for any posture without
// consulting the machine's confinement backend registry: the run depends only on the fixture.
const FAMILIES = { alpha: 'claude', beta: 'xai', gamma: 'z-ai', delta: 'deepseek' };

function runnerConfig(capabilities) {
  return {
    executors: Object.fromEntries(Object.entries(FAMILIES).map(([id, family]) => [id, { agentType: id, providerModel: family }])),
    capabilities,
  };
}

const prefer = (...ids) => ({ prefer: ids.map((executor) => ({ executor })) });

function mkPackageRoot(workflowYaml) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-pool-independence-'));
  fs.mkdirSync(path.join(root, 'core', 'workflows'), { recursive: true });
  fs.writeFileSync(path.join(root, 'core', 'workflows', 'fixture.yaml'), workflowYaml);
  return root;
}

const PANEL_WORKFLOW = `
id: panel-fixture
title: Panel fixture
steps:
  - id: ideas
    title: Ideas
    units:
      - id: generate
        template:
          capability: fixture:generate
          pattern: panel
          objective: Generate ideas
  - id: tally
    title: Tally
    dependsOn: [ideas]
    units:
      - id: rank
        template:
          capability: fixture:rank
          pattern: solo
          objective: Rank the ideas
`;

const REVIEWED_WORKFLOW = `
id: reviewed-fixture
title: Reviewed fixture
steps:
  - id: build
    title: Build
    units:
      - id: draft
        template:
          capability: fixture:draft
          pattern: reviewed
          objective: Draft the thing
`;

async function run(workflowYaml, capabilities) {
  const packageRoot = mkPackageRoot(workflowYaml);
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-pool-independence-project-'));
  try {
    return await checkWorkflowPoolsSatisfyIndependence(cwd, { packageRoot, loadRunnerConfig: () => runnerConfig(capabilities) });
  } finally {
    fs.rmSync(packageRoot, { recursive: true, force: true });
    fs.rmSync(cwd, { recursive: true, force: true });
  }
}

test('both checks are registered in the doctor registry', () => {
  const ids = DOCTOR_CHECKS.map((c) => c.id);
  assert.ok(ids.includes('workflow-pools-satisfy-independence'));
  assert.ok(ids.includes('agent-cli-project-trusted'));
});

test('a panel whose pool has only as many families as panelists passes and reports the synthesizer sharing a family', async () => {
  const result = await run(PANEL_WORKFLOW, {
    'fixture:generate': prefer('alpha', 'beta', 'gamma'),
    'fixture:rank': prefer('alpha'),
  });
  assert.equal(result.passed, true, result.message);
  assert.match(result.message, /panel-fixture\/ideas\/generate \(panel, capability "fixture:generate"\)/);
  assert.match(result.message, /synthesizer=alpha shares a family with panelist-1/);
  assert.match(result.message, /a preference, not a failure/);
  assert.doesNotMatch(result.message, /fixture\/tally/);
});

test('a panel with a fourth family for the synthesizer passes', async () => {
  const result = await run(PANEL_WORKFLOW, { 'fixture:generate': prefer('alpha', 'beta', 'gamma', 'delta') });
  assert.equal(result.passed, true, result.message);
  assert.match(result.message, /\(1\)/);
  assert.doesNotMatch(result.message, /shares a family/);
});

test('a panel pool with two executors of one family spreads panelists over distinct families and the synthesizer shares one', async () => {
  const config = runnerConfig({ 'fixture:generate': prefer('alpha', 'beta', 'alpha-twin', 'gamma') });
  config.executors['alpha-twin'] = { agentType: 'alpha-twin', providerModel: 'claude' };
  const unit = { id: 'u', capability: 'fixture:generate', pattern: 'panel', writes: [] };
  const { roles } = await simulateUnitBindings(unit, config);
  const bound = Object.fromEntries(roles.map((r) => [r.role, r.executor]));
  assert.deepEqual(bound, { 'panelist-1': 'alpha', 'panelist-2': 'beta', 'panelist-3': 'gamma', synthesizer: 'alpha' });
  assert.equal(roles.every((r) => !r.refused), true);
  assert.deepEqual(roles.find((r) => r.role === 'synthesizer').sharesFamilyWith, ['panelist-1']);
});

test('six panel seats over three families all bind with no waiver and share families in pool order', async () => {
  const config = runnerConfig({ 'fixture:generate': prefer('alpha', 'beta', 'gamma') });
  const unit = { id: 'u', capability: 'fixture:generate', pattern: { pattern: 'panel', params: { members: 6 } }, writes: [] };
  const { outcome, roles } = await simulateUnitBindings(unit, config);
  assert.equal(outcome, 'pass');
  assert.deepEqual(roles.map((r) => r.executor), ['alpha', 'beta', 'gamma', 'alpha', 'beta', 'gamma', 'alpha']);
  assert.equal(roles.length, 7);
  assert.deepEqual(roles[0].sharesFamilyWith, undefined, 'the first seat is bound before anyone shares with it');
  assert.deepEqual(roles[3].sharesFamilyWith, ['panelist-1']);
});

test('with enough families every panel seat and the synthesizer land on distinct families in pool order', async () => {
  const config = runnerConfig({ 'fixture:generate': prefer('alpha', 'beta', 'gamma', 'delta') });
  const unit = { id: 'u', capability: 'fixture:generate', pattern: 'panel', writes: [] };
  const { roles } = await simulateUnitBindings(unit, config);
  assert.deepEqual(roles.map((r) => r.executor), ['alpha', 'beta', 'gamma', 'delta']);
  assert.equal(roles.some((r) => r.sharesFamilyWith), false);
});

test('a reviewed unit whose pool is a single family fails on the checker', async () => {
  const result = await run(REVIEWED_WORKFLOW, { 'fixture:draft': prefer('alpha') });
  assert.equal(result.passed, false);
  assert.match(result.message, /reviewed-fixture\/build\/draft \(reviewed/);
  assert.match(result.message, /reviewer refused for independence/);
  assert.match(result.message, /producer=alpha/);
});

test('a reviewed unit with a second family passes', async () => {
  const result = await run(REVIEWED_WORKFLOW, { 'fixture:draft': prefer('alpha', 'beta') });
  assert.equal(result.passed, true, result.message);
});

test('a capability with no prefer pool is left to the capability check, not reported as an independence gap', async () => {
  const result = await run(PANEL_WORKFLOW, {});
  assert.equal(result.passed, true, result.message);
});

test('a runner config that cannot be loaded passes with a note instead of throwing', async () => {
  const packageRoot = mkPackageRoot(PANEL_WORKFLOW);
  try {
    const result = await checkWorkflowPoolsSatisfyIndependence(os.tmpdir(), {
      packageRoot,
      loadRunnerConfig: () => { throw new Error('no such file'); },
    });
    assert.equal(result.passed, true);
    assert.match(result.message, /not evaluated: no such file/);
  } finally {
    fs.rmSync(packageRoot, { recursive: true, force: true });
  }
});

test('a malformed workflow definition is skipped and named, never thrown', async () => {
  const result = await run('id: [unterminated', { 'fixture:generate': prefer('alpha') });
  assert.equal(result.passed, true);
  assert.match(result.message, /unreadable definitions skipped: fixture\.yaml/);
});

test('the registered check runs against the shipped Workflows without throwing', async () => {
  const entry = DOCTOR_CHECKS.find((c) => c.id === 'workflow-pools-satisfy-independence');
  const result = await entry.check(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-pool-independence-registered-')));
  assert.equal(typeof result.passed, 'boolean');
  assert.equal(typeof result.message, 'string');
});
