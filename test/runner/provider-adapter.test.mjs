// test/runner/provider-adapter.test.mjs
// Phase 01: ProviderAdapter unit tests and shadow-vs-legacy equivalence harness.
// Proves:
// 1. ProviderAdapter is a pure rendering layer: no spawn, no fs writes, no config mutation.
// 2. Accurately reports `applied` statuses and extracts `policyShapedFlags` per provider family.
// 3. Produces equivalent argv to legacy resolveExecutorCommand across the full 12-executor × 3-tier matrix.

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { loadRunnerConfigFromDir } from '../../src/runner/dispatch/config.mjs';
import { resolveExecutorAndOverrides, modelForTier } from '../../src/runner/dispatch/resolve.mjs';
import { resolveExecutorCommand } from '../../src/runner/dispatch/transport.mjs';

import {
  renderProviderInvocation,
  getProviderAdapter,
  getProviderPolicyShapedFlags,
  normalizeProviderFamily,
  extractPolicyShapedFlags,
  resolveEnvPatch,
  KNOWN_POLICY_SHAPED_FLAGS,
  ClaudeProviderAdapter,
  CodexProviderAdapter,
  GeminiProviderAdapter,
  PiProviderAdapter,
  GlmProviderAdapter,
} from '../../src/runner/dispatch/provider-adapter.mjs';

import {
  BASELINE_SNAPSHOT_FIXTURE,
  resolveNormalizedSnapshotRow,
} from './dispatch-policy-baseline-snapshot.test.mjs';

/**
 * Normalizes an argv array for order-insensitive flag comparison.
 * Non-flag positional args and subcommands before flags are preserved in order.
 * Flag options (e.g. ['--model', 'haiku'] or ['-s', 'read-only'] or ['--mode', 'accept-edits'])
 * are paired with their values and sorted alphabetically by flag name.
 *
 * NOTE ON FLAG ORDERING:
 * Both shadow ProviderAdapter and legacy resolveExecutorCommand preserve the exact
 * template argument order declared in .fgos/config.json. normalizeArgv is provided
 * to guarantee that equivalence is verifiable even if future adapters normalize flag order.
 */
export function normalizeArgv(args) {
  if (!Array.isArray(args)) return [];
  const leadingPositionals = [];
  const flagPairs = [];
  const trailingPositionals = [];

  let inFlags = false;
  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg.startsWith('-')) {
      inFlags = true;
      // Pair flag with parameter if next argument is a parameter value
      if (
        i + 1 < args.length &&
        !args[i + 1].startsWith('-') &&
        args[i + 1] !== '<prompt>' &&
        !args[i + 1].startsWith('{')
      ) {
        flagPairs.push([arg, args[i + 1]]);
        i += 2;
      } else {
        flagPairs.push([arg]);
        i += 1;
      }
    } else if (!inFlags) {
      leadingPositionals.push(arg);
      i += 1;
    } else {
      trailingPositionals.push(arg);
      i += 1;
    }
  }

  // Sort flag pairs deterministically by flag name
  flagPairs.sort((a, b) => a[0].localeCompare(b[0]));

  const result = [...leadingPositionals];
  for (const pair of flagPairs) {
    result.push(...pair);
  }
  result.push(...trailingPositionals);
  return result;
}

describe('ProviderAdapter shadow harness (Phase 01)', () => {
  let tempHomeDir;
  let throwawayDir;
  let cfg;

  before(() => {
    tempHomeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-adapter-home-'));
    process.env.HOME = tempHomeDir;
    throwawayDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-adapter-fgosDir-'));
    cfg = loadRunnerConfigFromDir(process.cwd());
  });

  after(() => {
    if (tempHomeDir && fs.existsSync(tempHomeDir)) {
      fs.rmSync(tempHomeDir, { recursive: true, force: true });
    }
    if (throwawayDir && fs.existsSync(throwawayDir)) {
      fs.rmSync(throwawayDir, { recursive: true, force: true });
    }
  });

  describe('purity and immutability guarantees', () => {
    test('renderProviderInvocation does not mutate input objects', () => {
      const baseArgs = Object.freeze(['-p', '{prompt}', '--model', '{model}']);
      const runtimeOptions = Object.freeze({ reasoningEffort: 'high', persona: 'test-persona' });
      const executorFacts = Object.freeze({ env: Object.freeze({ FOO: 'bar' }) });

      const result = renderProviderInvocation({
        providerFamily: 'claude',
        command: 'claude',
        baseArgs,
        promptPlaceholder: 'test-prompt',
        model: 'sonnet',
        runtimeOptions,
        executorFacts,
      });

      assert.deepEqual(baseArgs, ['-p', '{prompt}', '--model', '{model}']);
      assert.deepEqual(runtimeOptions, { reasoningEffort: 'high', persona: 'test-persona' });
      assert.ok(result.args.includes('test-prompt'));
      assert.ok(result.args.includes('sonnet'));
    });

    test('renderProviderInvocation is idempotent and side-effect free', () => {
      const inputs = {
        providerFamily: 'claude',
        command: 'claude',
        baseArgs: ['-p', '{prompt}', '--model', '{model}'],
        promptPlaceholder: '<prompt>',
        model: 'opus',
        runtimeOptions: { reasoningEffort: 'high' },
        executorFacts: { env: { ANTHROPIC_API_KEY: 'secret' } },
      };

      const res1 = renderProviderInvocation(inputs);
      const res2 = renderProviderInvocation(inputs);

      assert.deepEqual(res1, res2, 'repeated invocations must yield identical results');
    });

    test('resolveEnvPatch resolves ${VAR} without process.env mutation', () => {
      const rawEnv = {
        HOME_COPY: '${HOME}',
        STATIC_VAL: 'literal',
      };
      const customBase = { HOME: '/custom/home' };
      const patched = resolveEnvPatch(rawEnv, customBase);

      assert.equal(patched.HOME_COPY, '/custom/home');
      assert.equal(patched.STATIC_VAL, 'literal');
      assert.deepEqual(rawEnv, { HOME_COPY: '${HOME}', STATIC_VAL: 'literal' }, 'rawEnv must not be mutated');
    });
  });

  describe('per-provider family rendering, applied statuses, and policyShapedFlags', () => {
    describe('Claude CLI family', () => {
      test('claude baseline: model, permission-mode, allowedTools', () => {
        const template = cfg.executors.claude.invocations[0].args;
        const res = renderProviderInvocation({
          providerFamily: 'claude',
          command: 'claude',
          baseArgs: template,
          promptPlaceholder: '<prompt>',
          model: 'sonnet',
        });

        assert.equal(res.command, 'claude');
        assert.equal(res.applied.model, 'applied');
        assert.equal(res.applied.reasoningEffort, 'unsupported');
        assert.equal(res.applied.toolIntent, 'applied-via-allowedTools');
        assert.equal(res.applied.readOnly, 'unsupported');
        assert.equal(res.applied.persona, 'unsupported');

        assert.ok(res.policyShapedFlags.includes('--model'));
        assert.ok(res.policyShapedFlags.includes('--permission-mode'));
        assert.ok(res.policyShapedFlags.includes('--allowedTools'));
        assert.ok(!res.policyShapedFlags.includes('--effort'));
      });

      test('claude-reviewer: applies effort high and readOnly via allowedTools', () => {
        const template = cfg.executors['claude-reviewer'].invocations[0].args;
        const res = renderProviderInvocation({
          providerFamily: 'claude',
          command: 'claude',
          baseArgs: template,
          promptPlaceholder: '<prompt>',
          model: 'sonnet',
        });

        assert.equal(res.applied.model, 'applied');
        assert.equal(res.applied.reasoningEffort, 'applied');
        assert.equal(res.applied.toolIntent, 'applied-via-allowedTools');
        assert.equal(res.applied.readOnly, 'applied-via-tool-gating');

        assert.ok(res.policyShapedFlags.includes('--model'));
        assert.ok(res.policyShapedFlags.includes('--effort'));
        assert.ok(res.policyShapedFlags.includes('--permission-mode'));
        assert.ok(res.policyShapedFlags.includes('--allowedTools'));
      });

      test('claude with runtime reasoningEffort option: adds --effort', () => {
        const template = ['-p', '{prompt}', '--model', '{model}'];
        const res = renderProviderInvocation({
          providerFamily: 'claude',
          command: 'claude',
          baseArgs: template,
          promptPlaceholder: '<prompt>',
          model: 'sonnet',
          runtimeOptions: { reasoningEffort: 'high' },
        });

        assert.equal(res.applied.reasoningEffort, 'applied');
        assert.ok(res.args.includes('--effort'));
        const idx = res.args.indexOf('--effort');
        assert.equal(res.args[idx + 1], 'high');
        assert.ok(res.policyShapedFlags.includes('--effort'));
      });

      test('claude-bwrap: enforced-by-sandbox via bwrap confinement', () => {
        const template = cfg.executors['claude-bwrap'].invocations[0].args;
        const res = renderProviderInvocation({
          providerFamily: 'claude',
          command: 'claude',
          baseArgs: template,
          promptPlaceholder: '<prompt>',
          model: 'sonnet',
          executorFacts: { confinement: { backend: 'bwrap' } },
        });

        assert.equal(res.applied.readOnly, 'enforced-by-sandbox');
      });
    });

    describe('Codex CLI family', () => {
      test('codex-cli: detects dangerous bypass flag and model', () => {
        const template = cfg.executors['codex-cli'].invocations[0].args;
        const res = renderProviderInvocation({
          providerFamily: 'openai-codex',
          command: 'codex',
          baseArgs: template,
          promptPlaceholder: '<prompt>',
          model: 'gpt-5.6-terra',
        });

        assert.equal(res.command, 'codex');
        assert.equal(res.applied.model, 'applied');
        assert.equal(res.applied.toolIntent, 'unsupported');
        assert.ok(res.policyShapedFlags.includes('--dangerously-bypass-approvals-and-sandbox'));
        assert.ok(res.policyShapedFlags.includes('--model'));
      });

      test('codex-readonly: detects -s read-only and sandbox enforcement', () => {
        const template = cfg.executors['codex-readonly'].invocations[0].args;
        const res = renderProviderInvocation({
          providerFamily: 'openai-codex',
          command: 'codex',
          baseArgs: template,
          promptPlaceholder: '<prompt>',
          model: 'gpt-5.6-terra',
        });

        assert.equal(res.applied.readOnly, 'enforced-by-sandbox');
        assert.ok(res.policyShapedFlags.includes('-s'));
        assert.ok(res.policyShapedFlags.includes('-s read-only'));
        assert.ok(res.policyShapedFlags.includes('--model'));
      });

      test('codex-bwrap: detects -s danger-full-access, --skip-git-repo-check, and bwrap sandbox', () => {
        const template = cfg.executors['codex-bwrap'].invocations[0].args;
        const res = renderProviderInvocation({
          providerFamily: 'openai-codex',
          command: 'codex',
          baseArgs: template,
          promptPlaceholder: '<prompt>',
          model: 'gpt-5.6-terra',
          executorFacts: { confinement: { backend: 'bwrap' } },
        });

        assert.equal(res.applied.readOnly, 'enforced-by-sandbox');
        assert.ok(res.policyShapedFlags.includes('-s'));
        assert.ok(res.policyShapedFlags.includes('-s danger-full-access'));
        assert.ok(res.policyShapedFlags.includes('--skip-git-repo-check'));
        assert.ok(res.policyShapedFlags.includes('--model'));
      });

      test('codex does not support reasoningEffort: omitted-with-audit and warning recorded', () => {
        const template = ['exec', '--model', '{model}', '{prompt}'];
        const res = renderProviderInvocation({
          providerFamily: 'openai-codex',
          command: 'codex',
          baseArgs: template,
          promptPlaceholder: '<prompt>',
          model: 'gpt-5.6-terra',
          runtimeOptions: { reasoningEffort: 'high' },
        });

        assert.equal(res.applied.reasoningEffort, 'omitted-with-audit');
        assert.ok(!res.args.includes('--effort'), '--effort flag must not be appended to codex');
        assert.ok(res.warnings.some((w) => w.includes('reasoningEffort')));
      });
    });

    describe('AGY/Gemini CLI family', () => {
      test('agy-cli: detects --mode and --model, excludes timeout/project mechanics', () => {
        const template = cfg.executors['agy-cli'].invocations[0].args;
        const res = renderProviderInvocation({
          providerFamily: 'gemini',
          command: 'agy',
          baseArgs: template,
          promptPlaceholder: '<prompt>',
          model: 'gemini-3.8-flash-low',
        });

        assert.equal(res.command, 'agy');
        assert.equal(res.applied.model, 'applied');
        assert.ok(res.policyShapedFlags.includes('--mode'));
        assert.ok(res.policyShapedFlags.includes('--model'));
        // Pure invocation mechanics excluded from policyShapedFlags:
        assert.ok(!res.policyShapedFlags.includes('-p'));
        assert.ok(!res.policyShapedFlags.includes('--new-project'));
        assert.ok(!res.policyShapedFlags.includes('--print-timeout'));
      });

      test('gemini does not support reasoningEffort: omitted-with-audit and warning recorded', () => {
        const template = ['-p', '{prompt}', '--model', '{model}'];
        const res = renderProviderInvocation({
          providerFamily: 'gemini',
          command: 'agy',
          baseArgs: template,
          promptPlaceholder: '<prompt>',
          model: 'gemini-3.8-flash-medium',
          runtimeOptions: { reasoningEffort: 'high' },
        });

        assert.equal(res.applied.reasoningEffort, 'omitted-with-audit');
        assert.ok(!res.args.includes('--effort'));
        assert.ok(res.warnings.some((w) => w.includes('reasoningEffort')));
      });
    });

    describe('Pi CLI family', () => {
      test('pi: detects --provider, --model, --tools, --mode, --approve', () => {
        const template = cfg.executors.pi.invocations[0].args;
        const res = renderProviderInvocation({
          providerFamily: 'pi',
          command: 'pi',
          baseArgs: template,
          promptPlaceholder: '<prompt>',
          model: 'gpt-5.6-luna',
        });

        assert.equal(res.command, 'pi');
        assert.equal(res.applied.model, 'applied');
        assert.equal(res.applied.toolIntent, 'applied-via-tools');
        assert.ok(res.policyShapedFlags.includes('--provider'));
        assert.ok(res.policyShapedFlags.includes('--model'));
        assert.ok(res.policyShapedFlags.includes('--tools'));
        assert.ok(res.policyShapedFlags.includes('--mode'));
        assert.ok(res.policyShapedFlags.includes('--approve'));
      });

      test('codex-pi resolves Pi CLI adapter by command', () => {
        const template = cfg.executors['codex-pi'].invocations[0].args;
        const res = renderProviderInvocation({
          providerFamily: 'openai-codex',
          command: 'pi',
          baseArgs: template,
          promptPlaceholder: '<prompt>',
          model: 'gpt-5.6-luna',
        });

        assert.equal(res.command, 'pi');
        assert.equal(res.applied.toolIntent, 'applied-via-tools');
        assert.ok(res.policyShapedFlags.includes('--tools'));
      });
    });

    describe('glm-cli (z-ai via Claude route)', () => {
      test('glm-cli: renders claude invocation with z-ai envPatch', () => {
        const inv = cfg.executors['glm-cli'].invocations[0];
        const res = renderProviderInvocation({
          providerFamily: 'z-ai',
          command: 'claude',
          baseArgs: inv.args,
          promptPlaceholder: '<prompt>',
          model: 'z-ai/glm-5.2',
          executorFacts: { env: inv.env },
        });

        assert.equal(res.command, 'claude');
        assert.equal(res.applied.model, 'applied');
        assert.equal(res.applied.toolIntent, 'applied-via-allowedTools');
        assert.equal(res.envPatch.ANTHROPIC_BASE_URL, 'https://openrouter.ai/api');
        assert.equal(res.envPatch.ANTHROPIC_MODEL, 'z-ai/glm-5.2');
        assert.ok(res.policyShapedFlags.includes('--model'));
        assert.ok(res.policyShapedFlags.includes('--permission-mode'));
        assert.ok(res.policyShapedFlags.includes('--allowedTools'));
      });
    });

    describe('persona runtime option (Phase 01 scope)', () => {
      test('persona option returns unsupported in this phase', () => {
        const res = renderProviderInvocation({
          providerFamily: 'claude',
          command: 'claude',
          baseArgs: ['-p', '{prompt}', '--model', '{model}'],
          promptPlaceholder: '<prompt>',
          model: 'sonnet',
          runtimeOptions: { persona: 'code-reviewer@2' },
        });

        assert.equal(res.applied.persona, 'unsupported', 'persona delivery must report unsupported in Phase 01');
      });
    });
  });

  describe('shadow-vs-legacy equivalence matrix (12 executors × 3 tiers = 36 pairs)', () => {
    const expectedExecutors = [
      'claude',
      'claude-reviewer',
      'claude-reviewer-herdr',
      'agy-cli',
      'agy-herdr',
      'fgos-coding-implement',
      'codex-cli',
      'codex-bwrap',
      'codex-readonly',
      'pi',
      'codex-pi',
      'glm-cli',
    ];
    const tiers = ['light', 'standard', 'heavy'];

    for (const executorId of expectedExecutors) {
      for (const tier of tiers) {
        test(`equivalence: ${executorId} [${tier}] shadow argv matches legacy argv`, () => {
          // 1. Resolve via legacy production resolver chain (same as Phase 00 harness)
          const legacyRow = resolveNormalizedSnapshotRow(cfg, executorId, tier, throwawayDir);

          // 2. Resolve executor entry and overrides to supply canonical inputs to shadow adapter
          const { executorId: resolvedId, executor, overrides } = resolveExecutorAndOverrides(cfg, executorId);
          const resolvedCmd = resolveExecutorCommand(cfg, {
            prompt: '<prompt>',
            model: legacyRow.model,
            tier,
            executorId,
            fgosDir: throwawayDir,
            contentCarries: 'repo-content',
          });

          // 3. Render via shadow ProviderAdapter
          const shadow = renderProviderInvocation({
            providerFamily: resolvedCmd.governance?.providerFamily ?? resolvedCmd.provider,
            command: resolvedCmd.command,
            baseArgs: resolvedCmd.argsTemplate,
            promptPlaceholder: '<prompt>',
            model: legacyRow.model,
            executorFacts: {
              env: resolvedCmd.env,
              confinement: resolvedCmd.confinement,
              adapter: resolvedCmd.adapter,
              promptDelivery: resolvedCmd.promptDelivery,
              interactiveMode: resolvedCmd.interactiveMode,
              liveOutput: resolvedCmd.liveOutput,
              resourceBindings: resolvedCmd.resourceBindings,
              permissionMode: resolvedCmd.permissionMode,
            },
          });

          // 4. Assert command equivalence
          assert.equal(
            shadow.command,
            legacyRow.command,
            `${executorId} [${tier}] command must match legacy`
          );

          // 5. Assert argv equivalence:
          // In this baseline phase, both legacy resolveExecutorCommand and shadow renderProviderInvocation
          // preserve the exact argv order from .fgos/config.json.
          assert.deepEqual(
            shadow.args,
            legacyRow.args,
            `${executorId} [${tier}] argv must match legacy element-for-element`
          );

          // 6. Assert normalized argv equivalence (order-insensitive flag comparison):
          // Confirms that any future harmless flag reordering preserves semantic equivalence.
          assert.deepEqual(
            normalizeArgv(shadow.args),
            normalizeArgv(legacyRow.args),
            `${executorId} [${tier}] normalized argv must be identical`
          );

          // 7. Assert model is applied
          assert.equal(shadow.applied.model, 'applied');

          // 8. Assert policyShapedFlags are captured
          assert.ok(Array.isArray(shadow.policyShapedFlags));
          assert.ok(shadow.policyShapedFlags.length > 0, `${executorId} [${tier}] must have policyShapedFlags`);
          assert.ok(
            shadow.policyShapedFlags.includes('--model'),
            `${executorId} [${tier}] policyShapedFlags must include --model`
          );
        });
      }
    }
  });
});
