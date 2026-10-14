import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  loadRunnerConfig,
  RunnerConfigError,
  DEFAULT_RUNNER_CONFIG,
  validateRunnerPatternsShape,
} from '../../src/runner/dispatch/config.mjs';

function mkTempConfig(runnerObj) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-dispatch-config-test-'));
  const configPath = path.join(tmpDir, 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(runnerObj, null, 2), 'utf8');
  return { tmpDir, configPath };
}

test('DEFAULT_RUNNER_CONFIG contains valid default patterns', () => {
  assert.ok(DEFAULT_RUNNER_CONFIG.patterns);
  assert.deepEqual(DEFAULT_RUNNER_CONFIG.patterns.defaultRule, { mutatingMinRigor: 'standard' });
  assert.equal(DEFAULT_RUNNER_CONFIG.patterns.reviewed.maxRounds, 2);
  assert.deepEqual(DEFAULT_RUNNER_CONFIG.patterns.reviewed.checkersByRigor, {
    standard: ['reviewer'],
    high: ['reviewer', 'red-team'],
    critical: ['reviewer', 'red-team', 'tester'],
  });
  assert.doesNotThrow(() => validateRunnerPatternsShape(DEFAULT_RUNNER_CONFIG.patterns, 'test'));
});

test('validateCapabilitiesShape: allows taste fields persona, minCheckers, verify', () => {
  const validConfig = {
    ...DEFAULT_RUNNER_CONFIG,
    capabilities: {
      'code:implement': {
        persona: 'systems-architect',
        minCheckers: ['reviewer', 'red-team'],
        verify: 'npm test',
        prefer: [{ executor: 'claude' }],
        rigor: 'high',
      },
    },
    executors: {
      claude: {
        kind: 'agent',
        carries: 'repo-content',
        for: ['code:implement'],
        invocations: [{ via: 'cli', command: 'claude', args: ['-p', '{prompt}'] }],
      },
    },
  };

  const { configPath } = mkTempConfig(validConfig);
  const loaded = loadRunnerConfig(configPath);
  assert.equal(loaded.capabilities['code:implement'].persona, 'systems-architect');
  assert.deepEqual(loaded.capabilities['code:implement'].minCheckers, ['reviewer', 'red-team']);
  assert.equal(loaded.capabilities['code:implement'].verify, 'npm test');
});

test('validateCapabilitiesShape: rejects invalid persona, minCheckers, verify', () => {
  // Empty persona
  assert.throws(() => {
    const { configPath } = mkTempConfig({
      ...DEFAULT_RUNNER_CONFIG,
      capabilities: { 'code:implement': { persona: '   ' } },
    });
    loadRunnerConfig(configPath);
  }, /"persona" must be a non-empty string/);

  // Invalid minCheckers (not array)
  assert.throws(() => {
    const { configPath } = mkTempConfig({
      ...DEFAULT_RUNNER_CONFIG,
      capabilities: { 'code:implement': { minCheckers: 'reviewer' } },
    });
    loadRunnerConfig(configPath);
  }, /"minCheckers" must be an array of strings/);

  // Invalid minCheckers entry
  assert.throws(() => {
    const { configPath } = mkTempConfig({
      ...DEFAULT_RUNNER_CONFIG,
      capabilities: { 'code:implement': { minCheckers: ['invalid-checker'] } },
    });
    loadRunnerConfig(configPath);
  }, /"minCheckers" must be an array of strings in \[reviewer, red-team, tester\]/);

  // Invalid verify (empty)
  assert.throws(() => {
    const { configPath } = mkTempConfig({
      ...DEFAULT_RUNNER_CONFIG,
      capabilities: { 'code:implement': { verify: '  ' } },
    });
    loadRunnerConfig(configPath);
  }, /"verify" must be a non-empty string command/);
});

test('validateRunnerPatternsShape: validates defaultRule and reviewed shapes', () => {
  // Non-object patterns
  assert.throws(
    () => validateRunnerPatternsShape('invalid', 'patterns'),
    /must be an object/,
  );

  // Unknown key
  assert.throws(
    () => validateRunnerPatternsShape({ unknownKey: 123 }, 'patterns'),
    /contains unknown key "unknownKey"/,
  );

  // Invalid mutatingMinRigor
  assert.throws(
    () => validateRunnerPatternsShape({ defaultRule: { mutatingMinRigor: 'ultra' } }, 'patterns'),
    /must be one of low\/standard\/high\/critical/,
  );

  // Invalid maxRounds
  assert.throws(
    () => validateRunnerPatternsShape({ reviewed: { maxRounds: 0 } }, 'patterns'),
    /must be a positive integer/,
  );
  assert.throws(
    () => validateRunnerPatternsShape({ reviewed: { maxRounds: -1 } }, 'patterns'),
    /must be a positive integer/,
  );
  assert.throws(
    () => validateRunnerPatternsShape({ reviewed: { maxRounds: 1.5 } }, 'patterns'),
    /must be a positive integer/,
  );

  // Invalid checker
  assert.throws(
    () => validateRunnerPatternsShape({
      reviewed: {
        checkersByRigor: {
          standard: ['reviewer', 'unknown'],
        },
      },
    }, 'patterns'),
    /must be an array of strings in \[reviewer, red-team, tester\]/,
  );
});

test('validateRunnerPatternsShape: enforces cumulative checkers across rigors', () => {
  // Non-cumulative: high is missing 'reviewer' from standard
  assert.throws(
    () => validateRunnerPatternsShape({
      reviewed: {
        checkersByRigor: {
          standard: ['reviewer'],
          high: ['red-team'],
        },
      },
    }, 'patterns'),
    (err) => {
      assert.ok(err instanceof RunnerConfigError);
      assert.match(err.message, /not cumulative/);
      assert.match(err.message, /does not include checker "reviewer" from weaker rigor "standard"/);
      return true;
    },
  );

  // Non-cumulative: critical is missing 'red-team' from high
  assert.throws(
    () => validateRunnerPatternsShape({
      reviewed: {
        checkersByRigor: {
          standard: ['reviewer'],
          high: ['reviewer', 'red-team'],
          critical: ['reviewer', 'tester'],
        },
      },
    }, 'patterns'),
    /not cumulative: "critical" does not include checker "red-team" from weaker rigor "high"/,
  );

  // Cumulative: standard <= high <= critical passes
  assert.doesNotThrow(() => validateRunnerPatternsShape({
    reviewed: {
      checkersByRigor: {
        standard: ['reviewer'],
        high: ['reviewer', 'red-team'],
        critical: ['reviewer', 'red-team', 'tester'],
      },
    },
  }, 'patterns'));
});

test('DEFAULT_RUNNER_CONFIG declares an empty generatedPaths list', () => {
  assert.deepEqual(DEFAULT_RUNNER_CONFIG.generatedPaths, []);
});

test('runner.generatedPaths: well-formed {from, also} entries load', () => {
  const { configPath } = mkTempConfig({
    ...DEFAULT_RUNNER_CONFIG,
    generatedPaths: [{ from: 'core/skills/**', also: ['.agents/skills/**', 'plugins/fgOS/skills/**'] }],
  });
  assert.deepEqual(loadRunnerConfig(configPath).generatedPaths[0].also, ['.agents/skills/**', 'plugins/fgOS/skills/**']);
});

test('runner.generatedPaths: malformed entries are refused at load', () => {
  const cases = [
    ['not-an-array', /generatedPaths must be an array/],
    [[{ from: '**', also: ['x'] }], /generatedPaths\[0\]\.from/],
    [[{ from: '*/x', also: ['y'] }], /generatedPaths\[0\]\.from/],
    [[{ from: 'core', also: ['x'], extra: 1 }], /unknown key "extra"/],
    [[{ from: 'core' }], /generatedPaths\[0\]\.also/],
    [[{ from: 'core', also: [] }], /generatedPaths\[0\]\.also/],
    [[{ from: 'core', also: ['../out'] }], /generatedPaths\[0\]\.also\[0\]/],
    [[{ from: ':!core', also: ['x'] }], /generatedPaths\[0\]\.from/],
    [['core'], /generatedPaths\[0\] must be an object/],
  ];
  for (const [generatedPaths, pattern] of cases) {
    const { configPath } = mkTempConfig({ ...DEFAULT_RUNNER_CONFIG, generatedPaths });
    assert.throws(() => loadRunnerConfig(configPath), (err) => err instanceof RunnerConfigError && pattern.test(err.message), JSON.stringify(generatedPaths));
  }
});
