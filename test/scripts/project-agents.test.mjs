// project-agents.test.mjs -- proof points for tsk-slq's agent-definition
// projection pipeline (docs/history/agent-executor-agent-definitions/plan.md
// Risk map): the tool-scope -> tools: mapping (D1), idempotency, and
// platform-agnostic content enforcement.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { checkAgentDefinition, AgentDefinitionError, findAgentYamlFiles, resolveAgentFiles, projectAll } from '../../scripts/project-agents.mjs';
import { readFrontmatter } from '../../src/util/yaml.mjs';
import { writeProjectConfig } from '../helpers/config-fixture.mjs';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'project-agents-test-'));
}

function writeSharedConfig(dir, runner) {
  fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
  writeProjectConfig(dir, { runner });
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
rigor: low
tool-scope:
  - Read
  - Grep
  - Bash
`;

// What an agent file says (tools, quoted descriptions, skills, no model line) is owned by the composer's goldens
// (packages/agent-start-context/rust/tests/goldens.rs); these cases own the checks a definition passes first.

test('a skills list containing a non-string entry is refused, not silently coerced', () => {
  const badSkills = VALID_YAML + '\nskills:\n  - fgos-coding-implement\n  - 42\n';
  assert.throws(() => checkAgentDefinition('test-agent', badSkills), AgentDefinitionError);
});

test('a platform name in the source yaml is refused, not silently projected', () => {
  const withPlatformName = VALID_YAML.replace('A test agent.', 'A Claude-specific test agent.');
  assert.throws(() => checkAgentDefinition('test-agent', withPlatformName), AgentDefinitionError);
});

test('each forbidden platform name (claude/codex/anthropic) is refused, case-insensitively', () => {
  for (const name of ['Claude', 'CODEX', 'anthropic']) {
    const withPlatformName = VALID_YAML.replace('Tester', `${name}-flavored tester`);
    assert.throws(() => checkAgentDefinition('test-agent', withPlatformName), AgentDefinitionError);
  }
});

test('a missing required field is refused, not silently defaulted', () => {
  const missingRole = VALID_YAML.replace('role: Test Role\n', '');
  assert.throws(() => checkAgentDefinition('test-agent', missingRole), AgentDefinitionError);
});

test('an empty tool-scope is refused -- an agent-type with no declared tools is a config error, not an implicit deny-all', () => {
  const emptyToolScope = VALID_YAML.replace('tool-scope:\n  - Read\n  - Grep\n  - Bash\n', 'tool-scope: []\n');
  assert.throws(() => checkAgentDefinition('test-agent', emptyToolScope), AgentDefinitionError);
});

test('an unrecognized rigor is refused rather than silently falling through to undefined', () => {
  const badRigor = VALID_YAML.replace('rigor: low', 'rigor: extreme');
  assert.throws(() => checkAgentDefinition('test-agent', badRigor), AgentDefinitionError);
});

// --- readRunnerModels: real integration coverage (tsk-5tm, D9) -- this
// function was previously untested and read the legacy `runner.models`
// shape directly, silently ignoring `modelPolicies` (the shape this repo's
// own committed .fgos/config.json now uses) with no error. -------------

test('findAgentYamlFiles lists the workspace, domain and core tiers the agent-definitions door reads (D24)', () => {
  const dir = mkTempDir();
  try {
    const coreDir = path.join(dir, 'core', 'agents');
    const codingDir = path.join(dir, 'domains', 'coding', 'agents');
    fs.mkdirSync(coreDir, { recursive: true });
    fs.mkdirSync(codingDir, { recursive: true });

    fs.writeFileSync(path.join(coreDir, 'fgos-placeholder.yaml'), VALID_YAML);
    fs.writeFileSync(path.join(codingDir, 'coder.yaml'), VALID_YAML);
    fs.mkdirSync(path.join(dir, 'fgos', 'agents'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'fgos', 'agents', 'mine.yaml'), VALID_YAML);
    fs.mkdirSync(path.join(dir, 'agents'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'agents', 'legacy.yaml'), VALID_YAML);

    const files = findAgentYamlFiles(dir);
    assert.equal(files.length, 3);
    assert.ok(files.some((f) => f.name === 'mine' && f.source === 'fgos/agents'));
    assert.ok(files.some((f) => f.name === 'fgos-placeholder' && f.source === 'core/agents'));
    assert.ok(files.some((f) => f.name === 'coder' && f.source === 'domains/coding/agents'));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('resolveAgentFiles still throws AgentDefinitionError when two sources collide (D33)', () => {
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



function scratchRepo(yamlByStem) {
  const dir = mkTempDir();
  const coreDir = path.join(dir, 'core', 'agents');
  fs.mkdirSync(coreDir, { recursive: true });
  for (const [stem, yaml] of Object.entries(yamlByStem)) fs.writeFileSync(path.join(coreDir, `${stem}.yaml`), yaml);
  const targetDir = path.join(dir, 'out');
  return { dir, targetDir, run: () => projectAll(resolveAgentFiles(findAgentYamlFiles(dir), dir), { repoRoot: dir, targetDir }) };
}

test('a persona declaring a name other than its file stem is refused and cannot reach another agent file', () => {
  const repo = scratchRepo({ persona: VALID_YAML.replace('name: test-agent', 'name: code-reviewer') });
  try {
    fs.mkdirSync(repo.targetDir);
    const foreign = path.join(repo.targetDir, 'code-reviewer.md');
    fs.writeFileSync(foreign, 'foreign agent\n');
    assert.throws(() => repo.run(), /declares name "code-reviewer" but its file stem is "persona"/);
    assert.equal(fs.readFileSync(foreign, 'utf8'), 'foreign agent\n');
    assert.equal(fs.existsSync(path.join(repo.targetDir, 'persona.md')), false);
  } finally {
    fs.rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('a frontmatter scalar holding a newline is refused with the field and file named, before any write', () => {
  const evil = VALID_YAML.replace('description: A test agent.', 'description: "x\\n---\\nmodel: opus"');
  const repo = scratchRepo({ 'test-agent': evil });
  try {
    assert.throws(() => repo.run(), /core\/agents\/test-agent\.yaml: field "description" holds a newline/);
    assert.equal(fs.existsSync(repo.targetDir), false);
  } finally {
    fs.rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('an existing target without the generated stamp is refused by name and the run writes nothing', () => {
  const repo = scratchRepo({ 'test-agent': VALID_YAML, 'other-agent': VALID_YAML.replace('name: test-agent', 'name: other-agent') });
  try {
    fs.mkdirSync(repo.targetDir);
    const foreign = path.join(repo.targetDir, 'test-agent.md');
    fs.writeFileSync(foreign, 'hand written\n');
    assert.throws(() => repo.run(), /core\/agents\/test-agent\.yaml: refusing to overwrite .*test-agent\.md/);
    assert.equal(fs.readFileSync(foreign, 'utf8'), 'hand written\n');
    assert.equal(fs.existsSync(path.join(repo.targetDir, 'other-agent.md')), false);
  } finally {
    fs.rmSync(repo.dir, { recursive: true, force: true });
  }
});

test('the real personas project through the start-context door as their golden agent files, and a second run over its own output is accepted', () => {
  const root = path.resolve(import.meta.dirname, '..', '..');
  const targetDir = path.join(mkTempDir(), 'out');
  try {
    const files = resolveAgentFiles(findAgentYamlFiles(root), root);
    projectAll(files, { repoRoot: root, targetDir });
    const goldens = path.join(root, 'packages', 'agent-start-context', 'goldens', 'agent-file');
    for (const name of fs.readdirSync(goldens)) {
      assert.equal(fs.readFileSync(path.join(targetDir, name), 'utf8'), fs.readFileSync(path.join(goldens, name), 'utf8'), name);
    }
    assert.doesNotThrow(() => projectAll(files, { repoRoot: root, targetDir }));
  } finally {
    fs.rmSync(path.dirname(targetDir), { recursive: true, force: true });
  }
});
