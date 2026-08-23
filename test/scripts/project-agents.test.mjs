// project-agents.test.mjs -- proof points for tsk-slq's agent-definition
// projection pipeline (docs/history/agent-executor-agent-definitions/plan.md
// Risk map): the tool-scope -> tools: mapping (D1), idempotency, and
// platform-agnostic content enforcement.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { projectAgentMarkdown, AgentDefinitionError, DEFAULT_MODELS, readRunnerModels, findAgentYamlFiles, resolveAgentFiles } from '../../scripts/project-agents.mjs';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'project-agents-test-'));
}

function writeSharedConfig(dir, runner) {
  fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.fgos', 'config.json'), JSON.stringify({ runner }));
}

const VALID_YAML = `
name: test-agent
version: 0.1.0
description: A test agent.
role: Test Role
persona:
  voice: Direct
  style: Terse
  archetype: Tester
decision_boundary:
  can_decide:
    - Pick test fixtures
  must_escalate:
    - Real work
model_tier: light
tool-scope:
  - Read
  - Grep
  - Bash
`;

test('tool-scope maps exactly into the generated tools: frontmatter -- no silent add, no silent drop (D1)', () => {
  const markdown = projectAgentMarkdown('test-agent', VALID_YAML, DEFAULT_MODELS);
  const toolsLine = markdown.split('\n').find((line) => line.startsWith('tools:'));
  assert.equal(toolsLine, 'tools: Read, Grep, Bash');
});

test('model_tier resolves through the same tier->model map the shared config file/dispatch.mjs already use', () => {
  const markdown = projectAgentMarkdown('test-agent', VALID_YAML, DEFAULT_MODELS);
  const modelLine = markdown.split('\n').find((line) => line.startsWith('model:'));
  assert.equal(modelLine, 'model: haiku');
});

// skills (tsk-397 D20): optional eligibility field --
// projects through unfiltered when present, is entirely absent from the
// frontmatter when the source yaml never declares it.
test('skills, when declared, projects into the frontmatter as a bracketed list', () => {
  const withSkills = VALID_YAML + '\nskills:\n  - fgos-coding-implement\n  - fgos-coding-validating\n';
  const markdown = projectAgentMarkdown('test-agent', withSkills, DEFAULT_MODELS);
  const skillsLine = markdown.split('\n').find((line) => line.startsWith('skills:'));
  assert.equal(skillsLine, 'skills: [fgos-coding-implement, fgos-coding-validating]');
});

test('skills is absent from the frontmatter when the source yaml never declares it (backward compatible)', () => {
  const markdown = projectAgentMarkdown('test-agent', VALID_YAML, DEFAULT_MODELS);
  assert.equal(markdown.includes('skills:'), false);
});

test('a skills list containing a non-string entry is refused, not silently coerced', () => {
  const badSkills = VALID_YAML + '\nskills:\n  - fgos-coding-implement\n  - 42\n';
  assert.throws(() => projectAgentMarkdown('test-agent', badSkills, DEFAULT_MODELS), AgentDefinitionError);
});

test('projection is idempotent -- identical source produces byte-identical output across two runs', () => {
  const first = projectAgentMarkdown('test-agent', VALID_YAML, DEFAULT_MODELS);
  const second = projectAgentMarkdown('test-agent', VALID_YAML, DEFAULT_MODELS);
  assert.equal(first, second);
});

test('a platform name in the source yaml is refused, not silently projected', () => {
  const withPlatformName = VALID_YAML.replace('A test agent.', 'A Claude-specific test agent.');
  assert.throws(() => projectAgentMarkdown('test-agent', withPlatformName, DEFAULT_MODELS), AgentDefinitionError);
});

test('each forbidden platform name (claude/codex/anthropic) is refused, case-insensitively', () => {
  for (const name of ['Claude', 'CODEX', 'anthropic']) {
    const withPlatformName = VALID_YAML.replace('Tester', `${name}-flavored tester`);
    assert.throws(() => projectAgentMarkdown('test-agent', withPlatformName, DEFAULT_MODELS), AgentDefinitionError);
  }
});

test('a missing required field is refused, not silently defaulted', () => {
  const missingRole = VALID_YAML.replace('role: Test Role\n', '');
  assert.throws(() => projectAgentMarkdown('test-agent', missingRole, DEFAULT_MODELS), AgentDefinitionError);
});

test('an empty tool-scope is refused -- an agent-type with no declared tools is a config error, not an implicit deny-all', () => {
  const emptyToolScope = VALID_YAML.replace('tool-scope:\n  - Read\n  - Grep\n  - Bash\n', 'tool-scope: []\n');
  assert.throws(() => projectAgentMarkdown('test-agent', emptyToolScope, DEFAULT_MODELS), AgentDefinitionError);
});

test('an unrecognized model_tier is refused rather than silently falling through to undefined', () => {
  const badTier = VALID_YAML.replace('model_tier: light', 'model_tier: extreme');
  assert.throws(() => projectAgentMarkdown('test-agent', badTier, DEFAULT_MODELS), AgentDefinitionError);
});

// --- readRunnerModels: real integration coverage (tsk-5tm, D9) -- this
// function was previously untested and read the legacy `runner.models`
// shape directly, silently ignoring `modelPolicies` (the shape this repo's
// own committed .fgos/config.json now uses) with no error. -------------

test('readRunnerModels resolves via modelPolicies when present, not the legacy models map', () => {
  const dir = mkTempDir();
  writeSharedConfig(dir, {
    modelPolicies: {
      claude: { lightweight: 'haiku-custom', standard: 'sonnet-custom', creative: 'sonnet-custom', analytical: 'sonnet-custom', critical: 'opus-custom' },
    },
  });
  assert.deepEqual(readRunnerModels(dir), { light: 'haiku-custom', standard: 'sonnet-custom', heavy: 'opus-custom' });
});

test('readRunnerModels still resolves via the legacy flat models map when modelPolicies is absent (pre-D9 config, backward compatible)', () => {
  const dir = mkTempDir();
  writeSharedConfig(dir, { models: { light: 'haiku-legacy', standard: 'sonnet-legacy', heavy: 'opus-legacy' } });
  assert.deepEqual(readRunnerModels(dir), { light: 'haiku-legacy', standard: 'sonnet-legacy', heavy: 'opus-legacy' });
});

test('readRunnerModels falls back to DEFAULT_MODELS per-tier when neither modelPolicies nor models configures that tier', () => {
  const dir = mkTempDir();
  writeSharedConfig(dir, {});
  assert.deepEqual(readRunnerModels(dir), DEFAULT_MODELS);
});

test('findAgentYamlFiles scans core/agents/ and domains/*/agents/ (D24)', () => {
  const dir = mkTempDir();
  try {
    const coreDir = path.join(dir, 'core', 'agents');
    const codingDir = path.join(dir, 'domains', 'coding', 'agents');
    fs.mkdirSync(coreDir, { recursive: true });
    fs.mkdirSync(codingDir, { recursive: true });

    fs.writeFileSync(path.join(coreDir, 'fgos-placeholder.yaml'), VALID_YAML);
    fs.writeFileSync(path.join(codingDir, 'coder.yaml'), VALID_YAML);

    const files = findAgentYamlFiles(dir);
    assert.equal(files.length, 2);
    assert.ok(files.some((f) => f.name === 'fgos-placeholder' && f.source === 'core/agents'));
    assert.ok(files.some((f) => f.name === 'coder' && f.source === 'domains/coding/agents'));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('resolveAgentFiles deprioritizes legacy agents/ on name collision with core/agents/ (D33 graceful loss)', () => {
  const dir = mkTempDir();
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => warnings.push(args.join(' '));
  try {
    const coreDir = path.join(dir, 'core', 'agents');
    const legacyDir = path.join(dir, 'agents');
    fs.mkdirSync(coreDir, { recursive: true });
    fs.mkdirSync(legacyDir, { recursive: true });

    const coreYaml = VALID_YAML.replace('name: test-agent', 'name: colliding-agent');
    const legacyYaml = VALID_YAML.replace('name: test-agent', 'name: colliding-agent');

    fs.writeFileSync(path.join(coreDir, 'colliding-agent.yaml'), coreYaml);
    fs.writeFileSync(path.join(legacyDir, 'colliding-agent.yaml'), legacyYaml);

    const files = findAgentYamlFiles(dir);
    assert.equal(files.length, 2);

    const resolved = resolveAgentFiles(files, dir);
    assert.equal(resolved.length, 1);
    assert.equal(resolved[0].source, 'core/agents');
    assert.equal(resolved[0].relPath, path.join('core', 'agents', 'colliding-agent.yaml'));
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /legacy agents\/ entry/);
    assert.match(warnings[0], /skipped due to duplicate agent-type name "colliding-agent"/);
  } finally {
    console.warn = originalWarn;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('resolveAgentFiles still throws AgentDefinitionError when two non-legacy sources collide (D33)', () => {
  const dir = mkTempDir();
  try {
    const coreDir = path.join(dir, 'core', 'agents');
    const domainDir = path.join(dir, 'domains', 'coding', 'agents');
    fs.mkdirSync(coreDir, { recursive: true });
    fs.mkdirSync(domainDir, { recursive: true });

    const yaml = VALID_YAML.replace('name: test-agent', 'name: dup-agent');
    fs.writeFileSync(path.join(coreDir, 'dup.yaml'), yaml);
    fs.writeFileSync(path.join(domainDir, 'dup.yaml'), yaml);

    const files = findAgentYamlFiles(dir);
    assert.throws(
      () => resolveAgentFiles(files, dir),
      AgentDefinitionError,
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});


