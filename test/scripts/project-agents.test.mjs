// project-agents.test.mjs -- proof points for tsk-slq's agent-definition
// projection pipeline (docs/history/agent-executor-agent-definitions/plan.md
// Risk map): the tool-scope -> tools: mapping (D1), idempotency, and
// platform-agnostic content enforcement.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { projectAgentMarkdown, AgentDefinitionError, DEFAULT_MODELS } from '../../scripts/project-agents.mjs';

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
