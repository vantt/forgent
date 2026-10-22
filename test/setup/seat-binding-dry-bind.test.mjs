import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { DOCTOR_CHECKS } from '../../src/setup/checks.mjs';
import { checkSeatBindingDryBind } from '../../src/setup/seat-binding-checks.mjs';
import { loadRunnerConfigFromDir } from '../../src/runner/dispatch/config.mjs';
import { simulateUnitBindings } from '../../src/runner/execution/dry-bind.mjs';

// Native-agent executors carry no spawned process, so bind() accepts them for any posture without
// consulting the machine's confinement backend registry: the run depends only on the fixture.
const FAMILIES = { alpha: 'claude', beta: 'xai', gamma: 'z-ai', delta: 'deepseek' };

function runnerConfig(capabilities) {
  return {
    executors: Object.fromEntries(Object.entries(FAMILIES).map(([id, family]) => [id, { agentType: id, providerModel: family }])),
    modelPolicies: Object.fromEntries(Object.values(FAMILIES).map((family) => [family, { nano: 'm', standard: 'm', advanced: 'm', flagship: 'm', frontier: 'm' }])),
    capabilities,
  };
}

const panelSeats = (n) => [...Array.from({ length: n }, (_, i) => ({ seat: `member-${i + 1}`, role: 'producer' })), { seat: 'synthesizer', role: 'synthesizer' }];
const debateSeats = [{ seat: 'thesis', role: 'producer' }, { seat: 'antithesis', role: 'producer' }, { seat: 'judge', role: 'judge' }];

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
          seats:
            - { seat: member-1, role: producer }
            - { seat: member-2, role: producer }
            - { seat: member-3, role: producer }
            - { seat: synthesizer, role: synthesizer }
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

const SOLO_WORKFLOW = `
id: solo-fixture
title: Solo fixture
steps:
  - id: draft
    title: Draft
    units:
      - id: write
        template:
          capability: fixture:draft
          pattern: solo
          objective: Draft the thing
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
    return await checkSeatBindingDryBind(cwd, { packageRoot, loadRunnerConfig: () => runnerConfig(capabilities) });
  } finally {
    fs.rmSync(packageRoot, { recursive: true, force: true });
    fs.rmSync(cwd, { recursive: true, force: true });
  }
}

test('the dry-bind row replaces the two rows it covers in the doctor registry', () => {
  const ids = DOCTOR_CHECKS.map((c) => c.id);
  assert.ok(ids.includes('seat-binding-dry-bind'));
  assert.ok(!ids.includes('workflow-pools-satisfy-independence'));
  assert.ok(!ids.includes('model-policy-tier-coverage'));
  assert.ok(ids.includes('agent-cli-project-trusted'));
});

test('a panel whose pool has only as many families as panelists passes and reports the synthesizer sharing a family', async () => {
  const result = await run(PANEL_WORKFLOW, {
    'fixture:generate': prefer('alpha', 'beta', 'gamma'),
    'fixture:rank': prefer('alpha'),
  });
  assert.equal(result.passed, true, result.message);
  assert.match(result.message, /panel-fixture\/ideas\/generate \(capability "fixture:generate"\)/);
  assert.match(result.message, /seat synthesizer=alpha shares a provider family with member-1/);
  assert.match(result.message, /a preference, not a failure/);
  assert.doesNotMatch(result.message, /fixture\/tally/);
});

test('a panel with a fourth family for the synthesizer passes', async () => {
  const result = await run(PANEL_WORKFLOW, { 'fixture:generate': prefer('alpha', 'beta', 'gamma', 'delta') });
  assert.equal(result.passed, true, result.message);
  assert.match(result.message, /4 seat\(s\) of 2 Workflow unit\(s\) bind/);
  assert.doesNotMatch(result.message, /shares a provider family/);
});

test('six panel seats over three families all bind with no waiver and share families in pool order', async () => {
  const config = runnerConfig({ 'fixture:generate': prefer('alpha', 'beta', 'gamma') });
  const unit = { id: 'u', capability: 'fixture:generate', pattern: 'panel', writes: [], seats: panelSeats(6) };
  const { outcome, seats: roles } = await simulateUnitBindings(unit, config);
  assert.equal(outcome, 'pass');
  assert.deepEqual(roles.map((r) => r.executor), ['alpha', 'beta', 'gamma', 'alpha', 'beta', 'gamma', 'alpha']);
  assert.equal(roles.length, 7);
  assert.deepEqual(roles[0].sharesFamilyWith, undefined, 'the first seat is bound before anyone shares with it');
  assert.deepEqual(roles[3].sharesFamilyWith, ['member-1']);
});

test('a reviewed unit whose pool is a single family fails on the checker', async () => {
  const result = await run(REVIEWED_WORKFLOW, { 'fixture:draft': prefer('alpha') });
  assert.equal(result.passed, false);
  assert.match(result.message, /reviewed-fixture\/[a-z]+\/draft \(capability "fixture:draft"\): seat reviewer refused for independence-unsatisfiable/);
});

test('a capability with no prefer pool anywhere is information, not a failure', async () => {
  const result = await run(PANEL_WORKFLOW, {});
  assert.equal(result.passed, true, result.message);
  assert.match(result.message, /seat member-1 not bound, no pool configured \(headless-no-executor\)/);
});

test('a runner config that cannot be loaded passes with a note instead of throwing', async () => {
  const packageRoot = mkPackageRoot(PANEL_WORKFLOW);
  try {
    const result = await checkSeatBindingDryBind(os.tmpdir(), {
      packageRoot,
      loadRunnerConfig: () => { throw new Error('no such file'); },
    });
    assert.equal(result.passed, true);
    assert.match(result.message, /seats not bound: no such file/);
  } finally {
    fs.rmSync(packageRoot, { recursive: true, force: true });
  }
});

test('a malformed workflow definition fails the check and is named with its position, never thrown', async () => {
  const result = await run('id: [unterminated', { 'fixture:generate': prefer('alpha') });
  assert.equal(result.passed, false);
  assert.match(result.message, /fixture\.yaml: cannot be parsed: .* \(line \d+, column \d+\)/);
});

test('the registered check runs against the shipped Workflows without throwing', async () => {
  const entry = DOCTOR_CHECKS.find((c) => c.id === 'seat-binding-dry-bind');
  const result = await entry.check(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-pool-independence-registered-')));
  assert.equal(typeof result.passed, 'boolean');
  assert.equal(typeof result.message, 'string');
});

const DEBATE_WORKFLOW = `
id: debate-fixture
title: Debate fixture
steps:
  - id: argue
    title: Argue
    units:
      - id: dispute
        template:
          capability: fixture:dispute
          pattern: debate
          seats:
            - { seat: thesis, role: producer }
            - { seat: antithesis, role: producer }
            - { seat: judge, role: judge }
          objective: Decide the question
`;

test('a debate whose pool has only two families cannot seat an independent judge and fails on the judge', async () => {
  const result = await run(DEBATE_WORKFLOW, { 'fixture:dispute': prefer('alpha', 'beta') });
  assert.equal(result.passed, false);
  assert.match(result.message, /debate-fixture\/argue\/dispute \(capability "fixture:dispute"\): seat judge refused for independence-unsatisfiable/);
});

test('a seat with no allowed cell fails naming the config line to change, and one family with a cell is enough to pass', async () => {
  const config = runnerConfig({ 'fixture:draft': { ...prefer('alpha'), tier: 'frontier' } });
  config.modelPolicies.claude = { standard: 'm' };
  const packageRoot = mkPackageRoot(SOLO_WORKFLOW);
  try {
    const result = await checkSeatBindingDryBind(os.tmpdir(), { packageRoot, loadRunnerConfig: () => config });
    assert.equal(result.passed, false);
    assert.match(result.message, /seat producer refused for tier-cell-missing: .*frontier.*capabilities\."fixture:draft"\.prefer/);
    config.modelPolicies.claude.frontier = 'm';
    assert.equal((await checkSeatBindingDryBind(os.tmpdir(), { packageRoot, loadRunnerConfig: () => config })).passed, true);
  } finally {
    fs.rmSync(packageRoot, { recursive: true, force: true });
  }
});

test('a tier lowered by maxTier is listed as information with the line that lowered it', async () => {
  const config = runnerConfig({ 'fixture:draft': { ...prefer('alpha'), tier: 'frontier' } });
  config.maxTier = 'advanced';
  const packageRoot = mkPackageRoot(SOLO_WORKFLOW);
  try {
    const result = await checkSeatBindingDryBind(os.tmpdir(), { packageRoot, loadRunnerConfig: () => config });
    assert.equal(result.passed, true, result.message);
    assert.match(result.message, /seat producer runs at advanced, lowered from frontier by max-tier-cap/);
  } finally {
    fs.rmSync(packageRoot, { recursive: true, force: true });
  }
});

test('a packaged workflow directory is read like a flat file', async () => {
  const packageRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-dry-bind-packaged-'));
  try {
    fs.mkdirSync(path.join(packageRoot, 'core', 'workflows', 'solo-fixture'), { recursive: true });
    fs.writeFileSync(path.join(packageRoot, 'core', 'workflows', 'solo-fixture', 'wf.solo-fixture.yaml'), SOLO_WORKFLOW);
    const result = await checkSeatBindingDryBind(os.tmpdir(), { packageRoot, loadRunnerConfig: () => runnerConfig({ 'fixture:draft': prefer('alpha') }) });
    assert.equal(result.passed, true, result.message);
    assert.match(result.message, /1 seat\(s\) of 1 Workflow unit\(s\) bind/);
  } finally {
    fs.rmSync(packageRoot, { recursive: true, force: true });
  }
});

test('the committed forgentX config binds every seat of every shipped workflow', async () => {
  const root = path.resolve(import.meta.dirname, '../..');
  const result = await checkSeatBindingDryBind(root, { packageRoot: root, loadRunnerConfig: loadRunnerConfigFromDir });
  assert.equal(result.passed, true, result.message);
});

const PERSONA_WORKFLOW = `
id: persona-fixture
title: Persona fixture
steps:
  - id: blind-proposals
    title: Blind proposals
    units:
      - id: propose
        template:
          capability: fixture:draft
          pattern: solo
          persona: panelist
          blind: true
          objective: Propose without seeing the others
`;

test('a unit with a persona and blind is bound as the run starts it: the persona taste of the seat decides its tier', async () => {
  const config = runnerConfig({ 'fixture:draft': { ...prefer('alpha'), personas: { panelist: { tier: 'frontier' } } } });
  config.modelPolicies.claude = { standard: 'm' };
  const packageRoot = mkPackageRoot(PERSONA_WORKFLOW);
  try {
    const result = await checkSeatBindingDryBind(os.tmpdir(), { packageRoot, loadRunnerConfig: () => config });
    assert.equal(result.passed, false, 'the persona raises the seat to a tier the family has no cell for');
    assert.match(result.message, /seat producer refused for tier-cell-missing: .*frontier/);
  } finally {
    fs.rmSync(packageRoot, { recursive: true, force: true });
  }
});

test('the doctor, --seats and the runner start the same unit from a template', async () => {
  const { workflowUnitContract } = await import('../../src/setup/workflow-definition-files.mjs');
  const { unitFieldsOfTemplate } = await import('../../src/workflow/steps.mjs');
  const template = { capability: 'fixture:draft', pattern: 'panel', persona: 'panelist', blind: true, prefer: ['alpha'], seats: [], objective: 'o' };
  const unit = workflowUnitContract({ id: 'u', template });
  assert.deepEqual(unit, { id: 'u', objective: 'o', ...unitFieldsOfTemplate(template) });
  assert.equal(unit.persona, 'panelist');
  assert.equal(unit.blind, true);
  assert.deepEqual(unit.prefer, ['alpha']);
});
