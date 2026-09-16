import { test } from 'node:test';
import assert from 'node:assert/strict';

import { collectExecutorProfileWarnings, checkExecutorProfileWarnings } from '../../src/setup/executor-profile-warnings.mjs';

test('Phase 06: collectExecutorProfileWarnings names a policy-shaped flag with its ProviderAdapter migration target, without breaking config loading', () => {
  const cfg = {
    executors: {
      'claude-reviewer': {
        invocations: [{ via: 'cli', command: 'claude', args: ['-p', '{prompt}', '--effort', 'high', '--permission-mode', 'acceptEdits'] }],
      },
    },
  };
  const warnings = collectExecutorProfileWarnings(cfg);
  const flagWarning = warnings.find((w) => w.id === 'executor.claude-reviewer.policy-shaped-flags');
  assert.ok(flagWarning, 'a policy-shaped flag in args must be named');
  assert.match(flagWarning.migrateTo, /ProviderAdapter/);
  assert.match(flagWarning.detail, /--effort/);
  assert.match(flagWarning.detail, /--permission-mode/);
});

test('Phase 06: collectExecutorProfileWarnings names executor-level rigorOverrides as a PlacementPolicy migration target, not executor identity', () => {
  const cfg = {
    executors: {
      'agy-cli': {
        invocations: [{ via: 'cli', command: 'agy', args: [] }],
        providerModel: 'gemini',
        rigorOverrides: { heavy: 'creative' },
      },
    },
  };
  const warnings = collectExecutorProfileWarnings(cfg);
  const rigorWarning = warnings.find((w) => w.id === 'executor.agy-cli.rigor-overrides');
  assert.ok(rigorWarning);
  assert.match(rigorWarning.migrateTo, /PlacementPolicy/);
});

test('Phase 06: collectExecutorProfileWarnings names capability-level rigorOverrides too (fgos-coding-implement shape)', () => {
  const cfg = {
    executors: { 'agy-herdr': { invocations: [{ via: 'cli', command: 'agy', args: [] }], providerModel: 'gemini' } },
    capabilities: {
      'fgos-coding-implement': {
        prefer: 'agy-herdr',
        overrides: { providerModel: 'gemini', rigorOverrides: { heavy: 'standard' } },
      },
    },
  };
  const warnings = collectExecutorProfileWarnings(cfg);
  assert.ok(warnings.some((w) => w.id === 'capability.fgos-coding-implement.rigor-overrides'));
});

test('Phase 06: collectExecutorProfileWarnings names an account-pool-shaped env var, pointing at Provider Capacity Rotator, without reintroducing account pools itself', () => {
  const cfg = {
    executors: {
      'codex-bwrap': {
        invocations: [{ via: 'cli', command: 'codex', args: [], env: { FGOS_CODEX_CREDENTIAL_HOMES: '/tmp/a:/tmp/b' } }],
        providerModel: 'openai-codex',
      },
    },
  };
  const warnings = collectExecutorProfileWarnings(cfg);
  const envWarning = warnings.find((w) => w.id.startsWith('executor.codex-bwrap.account-pool-env.'));
  assert.ok(envWarning, 'a credential-homes-shaped env var must be named');
  assert.match(envWarning.migrateTo, /Provider Capacity Rotator/);
  // The warning only NAMES the pattern -- it does not itself carry, parse,
  // or expose the env value anywhere.
  assert.ok(!JSON.stringify(warnings).includes('/tmp/a:/tmp/b'));
});

test('Phase 06: an ordinary env var (no account-pool-shaped name) is never flagged -- no false positives', () => {
  const cfg = {
    executors: {
      claude: { invocations: [{ via: 'cli', command: 'claude', args: [], env: { HOME: '/home/x', NODE_ENV: 'production' } }] },
    },
  };
  const warnings = collectExecutorProfileWarnings(cfg);
  assert.ok(!warnings.some((w) => w.id.includes('account-pool-env')));
});

test('Phase 06: a clean executor/capability config with no legacy policy-shaped entries produces zero warnings', () => {
  const cfg = {
    executors: {
      claude: { invocations: [{ via: 'cli', command: 'claude', args: ['-p', '{prompt}'] }] },
    },
    capabilities: {
      'code-review': { prefer: 'claude' },
    },
  };
  assert.deepEqual(collectExecutorProfileWarnings(cfg), []);
});

test('Phase 06: legacy executor ids remain fully accepted -- collectExecutorProfileWarnings never throws for any of them, only reports', () => {
  const cfg = {
    executors: {
      'claude-reviewer': { invocations: [{ via: 'cli', command: 'claude', args: ['--effort', 'high'] }], rigorOverrides: { heavy: 'critical' } },
    },
  };
  assert.doesNotThrow(() => collectExecutorProfileWarnings(cfg));
});

test('Phase 06: checkExecutorProfileWarnings reports passed:false as an informational doctor row (never throws, never a hard failure) when warnings are present', () => {
  const cfg = {
    executors: {
      'claude-reviewer': { invocations: [{ via: 'cli', command: 'claude', args: ['--effort', 'high'] }] },
    },
  };
  const result = checkExecutorProfileWarnings('/irrelevant-cwd', cfg);
  assert.equal(result.passed, false, 'doctor surfaces it as a row to look at');
  assert.match(result.message, /informational, not blocking/);
  assert.match(result.message, /executor\.claude-reviewer\.policy-shaped-flags/);
});

test('Phase 06: checkExecutorProfileWarnings reports passed:true with a clean summary when nothing is found', () => {
  const result = checkExecutorProfileWarnings('/irrelevant-cwd', { executors: {}, capabilities: {} });
  assert.equal(result.passed, true);
  assert.match(result.message, /no legacy policy-shaped/);
});

test('Phase 06: collectExecutorProfileWarnings handles a missing/empty cfg gracefully, never throws', () => {
  assert.deepEqual(collectExecutorProfileWarnings(undefined), []);
  assert.deepEqual(collectExecutorProfileWarnings({}), []);
  assert.deepEqual(collectExecutorProfileWarnings({ executors: null, capabilities: null }), []);
});
