import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveExecutorConfig } from '../../src/runner/dispatch/resolve.mjs';
import { resolveExecutorCommand } from '../../src/runner/dispatch/transport.mjs';
import { RunnerConfigError } from '../../src/runner/dispatch/config.mjs';

test('declared egress: glm executor keeping command "claude" but setting ANTHROPIC_BASE_URL to OpenRouter fails when allowCrossProvider is missing', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: {
      glm: {
        kind: 'agent',
        command: 'claude',
        args: ['-p', '{prompt}'],
        env: {
          ANTHROPIC_BASE_URL: 'https://openrouter.ai/api',
        },
      },
    },
    models: { standard: 'sonnet' },
  };

  assert.throws(
    () => resolveExecutorConfig(cfg, 'standard', 'glm'),
    (err) => {
      assert.ok(err instanceof RunnerConfigError);
      assert.ok(err.message.includes('cross-provider egress target "https://openrouter.ai/api"'));
      return true;
    },
  );
});

test('declared egress: glm executor with ANTHROPIC_BASE_URL and allowCrossProvider: true passes gate and carries governance descriptor', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: {
      glm: {
        kind: 'agent',
        command: 'claude',
        args: ['-p', '{prompt}'],
        allowCrossProvider: true,
        env: {
          ANTHROPIC_BASE_URL: 'https://openrouter.ai/api',
        },
      },
    },
    models: { standard: 'sonnet' },
  };

  const res = resolveExecutorConfig(cfg, 'standard', 'glm');
  assert.equal(res.command, 'claude');
  assert.deepEqual(res.governance, {
    providerFamily: 'claude',
    egress: {
      kind: 'cross-provider',
      target: 'https://openrouter.ai/api',
      content: 'repo-content',
    },
  });
});

test('declared egress: native claude executor resolves same-provider governance descriptor', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: {
      claude: {
        kind: 'agent',
        command: 'claude',
        args: ['{prompt}'],
      },
    },
    models: { standard: 'sonnet' },
  };

  const res = resolveExecutorConfig(cfg, 'standard', 'claude');
  assert.equal(res.command, 'claude');
  assert.deepEqual(res.governance, {
    providerFamily: 'claude',
    egress: {
      kind: 'same-provider',
      target: 'claude',
      content: 'repo-content',
    },
  });
});

test('declared egress: non-Claude command (agy) with allowCrossProvider: true resolves cross-provider governance descriptor', () => {
  const cfg = {
    executor: { command: 'claude', args: ['{prompt}'] },
    executors: {
      agy: {
        kind: 'agent',
        command: 'agy',
        args: ['{prompt}'],
        allowCrossProvider: true,
        providerModel: 'gemini',
        carries: 'user-text',
      },
    },
    models: { standard: 'sonnet' },
  };

  const res = resolveExecutorConfig(cfg, 'standard', 'agy', undefined, 'user-text');
  assert.equal(res.command, 'agy');
  assert.deepEqual(res.governance, {
    providerFamily: 'gemini',
    egress: {
      kind: 'cross-provider',
      target: 'agy',
      content: 'user-text',
    },
  });
});
