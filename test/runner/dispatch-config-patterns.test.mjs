import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { globalConfigPath, projectConfigPath, writeGlobalConfig, writeProjectConfig } from '../helpers/config-fixture.mjs';
import {
  loadRunnerConfig,
  loadRunnerConfigForDir,
  checkDoorRefusalsForRetiredKeys,
  RunnerConfigError,
  validateRunnerPatternsShape,
  validateRunnerLoopsShape,
  runnerOriginsOf,
  resolveOriginLocations,
  withDefaultExecutor,
} from '../../src/runner/dispatch/config.mjs';
import { DOCTOR_CHECKS } from '../../src/setup/checks.mjs';
import { readStandardValue, ConfigDoorError } from '../../src/config/facade.mjs';
import { catalogLayersOf, shippedCatalog } from '../../src/runner/dispatch/shipped-catalog.mjs';
import { checkCatalog, resolveCollaboration } from '../../src/runner/execution/patterns/catalog.mjs';
import { resolveLayer } from '../../src/runner/execution/patterns/catalog-entries.mjs';

const standardRunner = (key) => JSON.parse(JSON.stringify(readStandardValue(key ? `runner.${key}` : 'runner').value));
const BASE = { ...standardRunner(), executor: { command: 'claude', args: ['-p', '{prompt}'] } };

function mkTempConfig(runnerObj) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-dispatch-config-test-'));
  const configPath = projectConfigPath(tmpDir);
  writeProjectConfig(tmpDir, runnerObj);
  return { tmpDir, configPath };
}

test('the standard\'s default patterns and loops pass the runner\'s own checks', () => {
  const patterns = standardRunner('patterns');
  const loops = standardRunner('loops');

  assert.ok(patterns);
  assert.equal(patterns.seatBinding.schema, 2);

  // 8 shipped catalog patterns
  const expectedPatterns = ['solo', 'reviewed', 'panel', 'debate', 'code-change', 'consult', 'rfc', 'research-fan-out'];
  for (const name of expectedPatterns) {
    assert.ok(patterns[name], `standard must declare pattern "${name}"`);
    assert.ok(typeof patterns[name].promise === 'string' && patterns[name].promise.length > 0);
    assert.ok(['solo', 'reviewed', 'panel', 'debate'].includes(patterns[name].loop));
  }

  // Invariants on code-change, consult, rfc
  assert.deepEqual(patterns['code-change'].invariants.minCheckers, { atLeast: ['reviewer', 'red-team'] });
  assert.deepEqual(patterns.consult.invariants.seats, { fixed: [{ seat: 'advisor', role: 'producer' }] });
  assert.equal(patterns.consult.loop, 'solo');
  assert.deepEqual(patterns.rfc.invariants.minCheckers, { atLeast: ['reviewer', 'red-team'] });
  assert.equal(patterns.rfc.defaults.maxRounds, 1);

  // research-fan-out seats (3 researchers + synthesizer, no members)
  assert.deepEqual(patterns['research-fan-out'].defaults.seats, [
    { seat: 'researcher-1', role: 'producer' },
    { seat: 'researcher-2', role: 'producer' },
    { seat: 'researcher-3', role: 'producer' },
    { seat: 'synthesizer', role: 'synthesizer' },
  ]);
  assert.equal(patterns['research-fan-out'].defaults.seats.some((s) => s.seat.includes('member') || s.role === 'member'), false);
  // loops.reviewed tuning
  assert.ok(loops);
  assert.equal(loops.reviewed.maxRounds, 2);
  assert.deepEqual(loops.reviewed.checkersByRigor, {
    standard: ['reviewer'],
    high: ['reviewer', 'red-team'],
    critical: ['reviewer', 'red-team', 'tester'],
  });

  assert.doesNotThrow(() => validateRunnerPatternsShape(patterns, 'test.patterns'));
  assert.doesNotThrow(() => validateRunnerLoopsShape(loops, 'test.loops'));
});

test('validateCapabilitiesShape: allows taste fields persona, minCheckers, verify', () => {
  const validConfig = {
    ...BASE,
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
  assert.throws(() => {
    const { configPath } = mkTempConfig({
      ...BASE,
      capabilities: { 'code:implement': { persona: '   ' } },
    });
    loadRunnerConfig(configPath);
  }, /"persona" must be a non-empty string/);

  assert.throws(() => {
    const { configPath } = mkTempConfig({
      ...BASE,
      capabilities: { 'code:implement': { minCheckers: 'reviewer' } },
    });
    loadRunnerConfig(configPath);
  }, /"minCheckers" must be an array of strings/);

  assert.throws(() => {
    const { configPath } = mkTempConfig({
      ...BASE,
      capabilities: { 'code:implement': { minCheckers: ['invalid-checker'] } },
    });
    loadRunnerConfig(configPath);
  }, /"minCheckers" must be an array of strings in \[reviewer, red-team, tester\]/);

  assert.throws(() => {
    const { configPath } = mkTempConfig({
      ...BASE,
      capabilities: { 'code:implement': { verify: '  ' } },
    });
    loadRunnerConfig(configPath);
  }, /"verify" must be a non-empty string command/);
});

test('validateRunnerPatternsShape: validates catalog entry structure and invariants', () => {
  assert.throws(() => validateRunnerPatternsShape('invalid', 'patterns'), /must be an object/);

  // Unknown entry key
  assert.throws(
    () => validateRunnerPatternsShape({ 'custom-pat': { loop: 'solo', extraKey: true } }, 'patterns'),
    /contains unknown key "extraKey"/,
  );

  // Invalid loop
  assert.throws(
    () => validateRunnerPatternsShape({ 'custom-pat': { loop: 'unknown-loop' } }, 'patterns'),
    /must be one of solo\/reviewed\/panel\/debate/,
  );

  // Invariants: must declare exactly one of atLeast or fixed
  assert.throws(
    () => validateRunnerPatternsShape({
      'custom-pat': {
        loop: 'reviewed',
        invariants: { minCheckers: { atLeast: ['reviewer'], fixed: ['reviewer'] } },
      },
    }, 'patterns'),
    /must declare exactly one of "atLeast" or "fixed"/,
  );
  assert.throws(
    () => validateRunnerPatternsShape({
      'custom-pat': {
        loop: 'reviewed',
        invariants: { minCheckers: {} },
      },
    }, 'patterns'),
    /must declare exactly one of "atLeast" or "fixed"/,
  );

  // Invariants: unknown key inside invariant definition
  assert.throws(
    () => validateRunnerPatternsShape({
      'custom-pat': {
        loop: 'reviewed',
        invariants: { minCheckers: { atLeast: ['reviewer'], other: 1 } },
      },
    }, 'patterns'),
    /contains unknown key "other"/,
  );

  // Defaults: maxRounds must be positive integer
  assert.throws(
    () => validateRunnerPatternsShape({
      'custom-pat': {
        loop: 'reviewed',
        defaults: { maxRounds: 0 },
      },
    }, 'patterns'),
    /must be a positive integer/,
  );
  assert.throws(
    () => validateRunnerPatternsShape({
      'custom-pat': {
        loop: 'reviewed',
        defaults: { maxRounds: 1.5 },
      },
    }, 'patterns'),
    /must be a positive integer/,
  );

  // Defaults: minCheckers invalid seat
  assert.throws(
    () => validateRunnerPatternsShape({
      'custom-pat': {
        loop: 'reviewed',
        defaults: { minCheckers: ['invalid-checker'] },
      },
    }, 'patterns'),
    /must be an array of strings in \[reviewer, red-team, tester\]/,
  );
});

test('validateRunnerLoopsShape: validates loop tuning and cumulative checkers across rigors', () => {
  assert.throws(() => validateRunnerLoopsShape('invalid', 'loops'), /must be an object/);
  assert.throws(() => validateRunnerLoopsShape({ unknownLoop: {} }, 'loops'), /contains unknown loop "unknownLoop"/);

  // Invalid maxRounds in reviewed loop
  assert.throws(
    () => validateRunnerLoopsShape({ reviewed: { maxRounds: 0 } }, 'loops'),
    /must be a positive integer/,
  );
  assert.throws(
    () => validateRunnerLoopsShape({ reviewed: { maxRounds: -1 } }, 'loops'),
    /must be a positive integer/,
  );
  assert.throws(
    () => validateRunnerLoopsShape({ reviewed: { maxRounds: 1.5 } }, 'loops'),
    /must be a positive integer/,
  );

  // Invalid checker seat
  assert.throws(
    () => validateRunnerLoopsShape({
      reviewed: {
        checkersByRigor: { standard: ['reviewer', 'unknown'] },
      },
    }, 'loops'),
    /must be an array of strings in \[reviewer, red-team, tester\]/,
  );

  // Non-cumulative checkers
  assert.throws(
    () => validateRunnerLoopsShape({
      reviewed: {
        checkersByRigor: {
          standard: ['reviewer'],
          high: ['red-team'],
        },
      },
    }, 'loops'),
    /not cumulative: "high" does not include checker "reviewer" from weaker rigor "standard"/,
  );

  // Valid cumulative passes
  assert.doesNotThrow(() => validateRunnerLoopsShape({
    reviewed: {
      checkersByRigor: {
        standard: ['reviewer'],
        high: ['reviewer', 'red-team'],
        critical: ['reviewer', 'red-team', 'tester'],
      },
    },
  }, 'loops'));
});

test('bounds validity at load: min > max, non-integer, bound on an unread param', () => {
  // Bound on unread param for reviewed loop
  assert.throws(
    () => validateRunnerLoopsShape({
      reviewed: { bounds: { unreadParam: { min: 1, max: 3 } } },
    }, 'loops'),
    /is not a parameter read by the "reviewed" loop/,
  );

  // Bound on unread param for solo loop
  assert.throws(
    () => validateRunnerLoopsShape({
      solo: { bounds: { maxRounds: { min: 1, max: 3 } } },
    }, 'loops'),
    /is not a parameter read by the "solo" loop/,
  );

  // min > max
  assert.throws(
    () => validateRunnerLoopsShape({
      reviewed: { bounds: { maxRounds: { min: 5, max: 2 } } },
    }, 'loops'),
    /min \(5\) must be <= max \(2\)/,
  );

  // Non-integer min/max
  assert.throws(
    () => validateRunnerLoopsShape({
      reviewed: { bounds: { maxRounds: { min: 1.5, max: 3 } } },
    }, 'loops'),
    /must be an integer/,
  );
  assert.throws(
    () => validateRunnerLoopsShape({
      reviewed: { bounds: { maxRounds: { min: 1, max: 'many' } } },
    }, 'loops'),
    /must be an integer/,
  );

  // Valid bounds pass
  assert.doesNotThrow(() => validateRunnerLoopsShape({
    reviewed: { bounds: { maxRounds: { min: 1, max: 4 } } },
  }, 'loops'));
});

test('retired keys refusal: refuses with config-key-retired naming file and replacement', () => {
  // 1. Direct validation: defaultRule
  assert.throws(
    () => validateRunnerPatternsShape({ defaultRule: { mutatingMinRigor: 'standard' } }, 'patterns'),
    (err) => err instanceof RunnerConfigError && err.code === 'config-key-retired' && /defaultRule.*retired/.test(err.message),
  );

  // 2. Direct validation: research-fan-out-gated
  assert.throws(
    () => validateRunnerPatternsShape({ 'research-fan-out-gated': { loop: 'panel' } }, 'patterns'),
    (err) => err instanceof RunnerConfigError && err.code === 'config-key-retired' && /research-fan-out-gated.*retired/.test(err.message),
  );

  // 3. Direct validation: retired reviewed tuning shape
  assert.throws(
    () => validateRunnerPatternsShape({ reviewed: { maxRounds: 3 } }, 'patterns'),
    (err) => err instanceof RunnerConfigError && err.code === 'config-key-retired' && /reviewed.*retired/.test(err.message),
  );
  // 4. Direct validation: mixed shape on reviewed reports per-key retirement finding
  assert.throws(
    () => validateRunnerPatternsShape({ reviewed: { loop: 'reviewed', maxRounds: 3 } }, 'patterns'),
    (err) => err instanceof RunnerConfigError && err.code === 'config-key-retired' && /reviewed.*retired/.test(err.message),
  );

  // 5. Named file door: loadRunnerConfig with defaultRule
  const { configPath: defaultRuleCfg } = mkTempConfig({
    ...BASE,
    patterns: { defaultRule: { mutatingMinRigor: 'standard' } },
  });
  assert.throws(
    () => loadRunnerConfig(defaultRuleCfg),
    (err) => err instanceof RunnerConfigError && err.code === 'config-key-retired' && /defaultRule was retired/.test(err.message),
  );

  // 6. Named file door: loadRunnerConfig with patterns.reviewed tuning
  const { configPath: reviewedCfg } = mkTempConfig({
    ...BASE,
    patterns: { reviewed: { maxRounds: 3 } },
  });
  assert.throws(
    () => loadRunnerConfig(reviewedCfg),
    (err) => err instanceof RunnerConfigError && err.code === 'config-key-retired' && /runner\.loops\.reviewed/.test(err.message),
  );

  // 7. Named file door: loadRunnerConfig with mixed reviewed reports config-key-retired
  const { configPath: mixedCfg } = mkTempConfig({
    ...BASE,
    patterns: { reviewed: { loop: 'reviewed', maxRounds: 3 } },
  });
  assert.throws(
    () => loadRunnerConfig(mixedCfg),
    (err) => err instanceof RunnerConfigError && err.code === 'config-key-retired' && /runner\.loops\.reviewed/.test(err.message),
  );

  // 8. Direct validation: both tuning findings reported in one error
  assert.throws(
    () => validateRunnerPatternsShape({
      reviewed: {
        maxRounds: 3,
        checkersByRigor: { standard: ['reviewer'] },
      },
    }, 'patterns'),
    (err) => err instanceof RunnerConfigError
      && err.code === 'config-key-retired'
      && /runner\.patterns\.reviewed\.maxRounds/.test(err.message)
      && /runner\.patterns\.reviewed\.checkersByRigor/.test(err.message),
  );

  // 9. Patterns named loop and loops behave like any other pattern name
  assert.doesNotThrow(() => validateRunnerPatternsShape({
    loop: { loop: 'solo', promise: 'promise for loop' },
    loops: { loop: 'solo', promise: 'promise for loops' },
  }, 'patterns'));

  // 10. Descendant dotted path in door refusal is detected and mapped to parent retired key
  const err = new ConfigDoorError({
    id: 'config-schema',
    file: 'project:config.yaml',
    path: 'runner.patterns.research-fan-out-gated.loop',
    line: 10,
    column: 5,
  });
  assert.throws(
    () => checkDoorRefusalsForRetiredKeys(err, { projectRoot: '/fake/dir' }),
    (thrown) => thrown instanceof RunnerConfigError
      && thrown.code === 'config-key-retired'
      && /runner\.patterns\.research-fan-out-gated was retired/.test(thrown.message)
      && /use runner\.patterns\.research-fan-out instead/.test(thrown.message),
  );
});
test('named config with panel holding maxRounds is refused as an unknown key without retired advice', () => {
  const { configPath } = mkTempConfig({
    ...BASE,
    patterns: { panel: { maxRounds: 3 } },
  });
  assert.throws(
    () => loadRunnerConfig(configPath),
    (err) => {
      assert.ok(err instanceof RunnerConfigError);
      assert.notEqual(err.code, 'config-key-retired');
      assert.match(err.message, /unknown key "maxRounds"/);
      assert.doesNotMatch(err.message, /retired/i);
      assert.doesNotMatch(err.message, /runner\.loops\.panel/);
      return true;
    },
  );
});


test('a file holding patterns.reviewed is byte-identical after a refused load', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-byte-identical-test-'));
  const configPath = projectConfigPath(tmpDir);
  writeProjectConfig(tmpDir, {
    runner: {
      ...BASE,
      patterns: { reviewed: { maxRounds: 3 } },
    },
  });

  const before = fs.readFileSync(configPath, 'utf8');

  // Attempt to load through loadRunnerConfigForDir
  assert.throws(
    () => loadRunnerConfigForDir(tmpDir),
    (err) => err instanceof RunnerConfigError && err.code === 'config-key-retired',
  );

  const after = fs.readFileSync(configPath, 'utf8');
  assert.equal(after, before, 'refused load must never rewrite or modify the file on disk');
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('loadRunnerConfigForDir: refuses global file holding retired keys with config-key-retired', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-global-retired-home-'));
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-global-retired-repo-'));
  writeGlobalConfig(home, {
    runner: {
      patterns: { reviewed: { maxRounds: 3 } },
    },
  });
  writeProjectConfig(repo, {
    runner: {
      executor: { command: 'claude', args: ['-p', '{prompt}'] },
    },
  });

  const saved = { HOME: process.env.HOME, USERPROFILE: process.env.USERPROFILE };
  process.env.HOME = home;
  process.env.USERPROFILE = home;
  try {
    assert.throws(
      () => loadRunnerConfigForDir(repo),
      (err) => err instanceof RunnerConfigError
        && err.code === 'config-key-retired'
        && /~\/\.fgos\/config\.yaml:\d+:\d+/.test(err.message)
        && /runner\.loops\.reviewed\.maxRounds/.test(err.message),
    );
  } finally {
    process.env.HOME = saved.HOME;
    if (saved.USERPROFILE !== undefined) process.env.USERPROFILE = saved.USERPROFILE;
    else delete process.env.USERPROFILE;
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test('loadRunnerConfigForDir: other ConfigDoorError codes pass through unchanged', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-passthrough-repo-'));
  writeProjectConfig(repo, {
    runner: {
      timeoutMs: 'not-a-number',
    },
  });
  assert.throws(
    () => loadRunnerConfigForDir(repo),
    (err) => err instanceof RunnerConfigError && err.code !== 'config-key-retired',
  );

  // Catalog error under runner.patterns.reviewed.* passes through with original code
  writeProjectConfig(repo, {
    runner: {
      patterns: {
        reviewed: {
          loop: 'not-a-loop',
        },
      },
    },
  });
  assert.throws(
    () => loadRunnerConfigForDir(repo),
    (err) => err instanceof RunnerConfigError && err.code === 'config-schema',
  );

  // Project mixed shape at the door
  writeProjectConfig(repo, {
    runner: {
      patterns: {
        reviewed: {
          loop: 'reviewed',
          maxRounds: 3,
        },
      },
    },
  });
  // Project mixed shape at the door is reported with config-key-retired and advice to move tuning
  assert.throws(
    () => loadRunnerConfigForDir(repo),
    (err) => err instanceof RunnerConfigError
      && err.code === 'config-key-retired'
      && /runner\.loops\.reviewed/.test(err.message)
      && /config\.yaml/.test(err.message),
  );

  // Project pure retired key throws config-key-retired
  writeProjectConfig(repo, {
    runner: {
      patterns: {
        reviewed: {
          maxRounds: 3,
        },
      },
    },
  });
  assert.throws(
    () => loadRunnerConfigForDir(repo),
    (err) => err instanceof RunnerConfigError && err.code === 'config-key-retired' && /runner\.patterns\.reviewed\.maxRounds was retired/.test(err.message),
  );

  fs.rmSync(repo, { recursive: true, force: true });
});

test('shippedCatalog: returns frozen { patterns, loops } and is cached per process', () => {
  const catalog1 = shippedCatalog();
  const catalog2 = shippedCatalog();
  assert.equal(catalog1, catalog2, 'must be cached per process');
  assert.ok(Object.isFrozen(catalog1));
  assert.ok(Object.isFrozen(catalog1.patterns));
  assert.ok(Object.isFrozen(catalog1.loops));
  assert.ok(catalog1.patterns.solo);
  assert.ok(catalog1.patterns.reviewed);
  assert.ok(catalog1.loops.reviewed);
});

test('catalogLayersOf: answers per-pattern layer (project only, global only, both with project winning, neither = shipped)', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-catalog-layers-home-'));
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-catalog-layers-repo-'));

  writeGlobalConfig(home, {
    runner: {
      patterns: {
        'global-only-pat': { promise: 'global only', loop: 'solo' },
        'shared-pat': { promise: 'shared from global', loop: 'solo' },
      },
    },
  });

  writeProjectConfig(repo, {
    runner: {
      patterns: {
        'project-only-pat': { promise: 'project only', loop: 'solo' },
        'shared-pat': { promise: 'shared from project', loop: 'solo' },
      },
    },
  });

  const saved = { HOME: process.env.HOME, USERPROFILE: process.env.USERPROFILE };
  process.env.HOME = home;
  process.env.USERPROFILE = home;
  try {
    const loaded = loadRunnerConfigForDir(repo);
    const origins = runnerOriginsOf(loaded);
    const layers = catalogLayersOf(origins, loaded.patterns);
    assert.equal(layers['project-only-pat'], 'project');
    assert.equal(layers['global-only-pat'], 'global');
    assert.equal(layers['shared-pat'], 'project', 'project layer must beat global layer');
    assert.equal(layers.solo, 'shipped', 'unmodified shipped pattern must be shipped');
    assert.equal(layers.reviewed, 'shipped');
  } finally {
    process.env.HOME = saved.HOME;
    if (saved.USERPROFILE !== undefined) process.env.USERPROFILE = saved.USERPROFILE;
    else delete process.env.USERPROFILE;
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test('catalogLayersOf: field-path origin reports global when an offending field is global while another field is in project, and the pin layer stays project', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-split-origin-home-'));
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-split-origin-repo-'));

  writeGlobalConfig(home, {
    runner: {
      patterns: {
        reviewed: { loop: 'solo' },
        'valid-split': { loop: 'solo' },
      },
    },
  });

  writeProjectConfig(repo, {
    runner: {
      patterns: {
        reviewed: { promise: 'custom project promise' },
        'valid-split': { promise: 'project promise' },
      },
    },
  });

  const saved = { HOME: process.env.HOME, USERPROFILE: process.env.USERPROFILE };
  process.env.HOME = home;
  process.env.USERPROFILE = home;
  try {
    const loaded = loadRunnerConfigForDir(repo);
    const origins = runnerOriginsOf(loaded);
    const layers = catalogLayersOf(origins, loaded.patterns);
    assert.equal(layers.reviewed, 'project', 'pattern pin layer must be highest contributing layer');
    assert.equal(resolveLayer(layers, 'reviewed'), 'project');
    assert.equal(resolveLayer(origins, 'reviewed', 'loop'), 'global');
    assert.equal(resolveLayer(origins, 'reviewed', 'promise'), 'project');

    const shipped = shippedCatalog();
    const effective = {
      reviewed: {
        loop: 'solo',
        promise: 'custom project promise',
      },
    };

    const { problems } = checkCatalog({ shipped: shipped.patterns, effective, origins });
    const loopProblem = problems.find((p) => p.message.includes('loop'));
    assert.ok(loopProblem, 'weakened loop must produce a problem');
    assert.match(loopProblem.message, /source layer: global/, 'offending global field must report source layer global');
    const collab = resolveCollaboration({
      unit: { pattern: 'valid-split' },
      runnerConfig: { runner: { patterns: { 'valid-split': { loop: 'solo', promise: 'project promise' } } } },
      shipped,
      layers,
      origins,
    });
    assert.equal(collab.pin.pattern.layer, 'project', 'pin layer must remain project');
  } finally {
    process.env.HOME = saved.HOME;
    if (saved.USERPROFILE !== undefined) process.env.USERPROFILE = saved.USERPROFILE;
    else delete process.env.USERPROFILE;
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test('the standard declares an empty generatedPaths list', () => {
  assert.deepEqual(standardRunner('generatedPaths'), []);
});

test('runner.generatedPaths: well-formed {from, also} entries load', () => {
  const { configPath } = mkTempConfig({
    ...BASE,
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
    const { configPath } = mkTempConfig({ ...BASE, generatedPaths });
    assert.throws(() => loadRunnerConfig(configPath), (err) => err instanceof RunnerConfigError && pattern.test(err.message), JSON.stringify(generatedPaths));
  }
});

test('loader internal metadata carries origins, is omitted from serialization, and survives shallow copy', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-loader-meta-test-'));
  try {
    writeProjectConfig(tmpDir, {
      runner: {
        patterns: { 'meta-test': { loop: 'solo' } },
      },
    });
    const loaded = loadRunnerConfigForDir(tmpDir);
    const origins = runnerOriginsOf(loaded);
    assert.ok(Array.isArray(origins), 'origins must be an array');
    assert.ok(origins.some((o) => o.path.startsWith('runner.patterns')), 'origins must contain runner.patterns');

    const json = JSON.stringify(loaded);
    assert.equal(JSON.parse(json).origins, undefined, 'origins symbol must not appear in JSON serialization');
    assert.equal(Object.keys(loaded).includes('origins'), false);

    const withDefault = withDefaultExecutor(loaded);
    assert.equal(runnerOriginsOf(withDefault), origins, 'origins metadata must survive withDefaultExecutor shallow copy');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('JS-only validation error in global file names the global file and line', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-global-err-home-'));
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-global-err-repo-'));
  const saved = { HOME: process.env.HOME, USERPROFILE: process.env.USERPROFILE };
  process.env.HOME = home;
  process.env.USERPROFILE = home;

  writeGlobalConfig(home, {
    runner: {
      loops: {
        reviewed: {
          bounds: {
            maxRounds: { min: 5, max: 2 },
          },
        },
      },
    },
  });
  writeProjectConfig(repo, {
    runner: {},
  });

  try {
    assert.throws(
      () => loadRunnerConfigForDir(repo),
      (err) => {
        assert.ok(err instanceof RunnerConfigError);
        assert.match(err.message, /~[/\\]\.fgos[/\\]config\.yaml:\d+/);
        assert.match(err.message, /min \(5\) must be <= max \(2\)/);
        return true;
      },
    );
  } finally {
    process.env.HOME = saved.HOME;
    if (saved.USERPROFILE !== undefined) process.env.USERPROFILE = saved.USERPROFILE;
    else delete process.env.USERPROFILE;
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test('JS-only validation error in project file names the project file with line', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-proj-err-repo-'));
  writeProjectConfig(repo, {
    runner: {
      loops: {
        reviewed: {
          bounds: {
            maxRounds: { min: 5, max: 2 },
          },
        },
      },
    },
  });

  try {
    assert.throws(
      () => loadRunnerConfigForDir(repo),
      (err) => {
        assert.ok(err instanceof RunnerConfigError);
        const expectedPath = path.join(repo, '.fgos', 'config.yaml');
        assert.ok(err.message.includes(expectedPath));
        assert.match(err.message, /:\d+/);
        assert.match(err.message, /min \(5\) must be <= max \(2\)/);
        return true;
      },
    );
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test('relational validation error participating across files reports each source', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-rel-home-'));
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-rel-repo-'));
  const saved = { HOME: process.env.HOME, USERPROFILE: process.env.USERPROFILE };
  process.env.HOME = home;
  process.env.USERPROFILE = home;

  writeGlobalConfig(home, {
    runner: {
      loops: {
        reviewed: {
          bounds: {
            maxRounds: { max: 2 },
          },
        },
      },
    },
  });
  writeProjectConfig(repo, {
    runner: {
      loops: {
        reviewed: {
          bounds: {
            maxRounds: { min: 5 },
          },
        },
      },
    },
  });

  try {
    assert.throws(
      () => loadRunnerConfigForDir(repo),
      (err) => {
        assert.ok(err instanceof RunnerConfigError);
        assert.match(err.message, /~[/\\]\.fgos[/\\]config\.yaml:\d+/);
        assert.ok(err.message.includes(path.join(repo, '.fgos', 'config.yaml')));
        assert.match(err.message, /min \(5\) must be <= max \(2\)/);
        return true;
      },
    );
  } finally {
    process.env.HOME = saved.HOME;
    if (saved.USERPROFILE !== undefined) process.env.USERPROFILE = saved.USERPROFILE;
    else delete process.env.USERPROFILE;
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test('doctor runner-patterns-config attributes loop shape validation error to file and line from its read', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-doc-err-home-'));
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-doc-err-repo-'));
  const saved = { HOME: process.env.HOME, USERPROFILE: process.env.USERPROFILE };
  process.env.HOME = home;
  process.env.USERPROFILE = home;

  writeGlobalConfig(home, {
    runner: {
      loops: {
        reviewed: {
          bounds: {
            maxRounds: { min: 5, max: 2 },
          },
        },
      },
    },
  });
  writeProjectConfig(repo, {
    runner: {},
  });

  try {
    const check = DOCTOR_CHECKS.find((c) => c.id === 'runner-patterns-config');
    assert.ok(check, 'runner-patterns-config check must exist');
    const res = check.check(repo);
    assert.equal(res.passed, false);
    assert.match(res.message, /~[/\\]\.fgos[/\\]config\.yaml:\d+/);
    assert.match(res.message, /min \(5\) must be <= max \(2\)/);
  } finally {
    process.env.HOME = saved.HOME;
    if (saved.USERPROFILE !== undefined) process.env.USERPROFILE = saved.USERPROFILE;
    else delete process.env.USERPROFILE;
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(repo, { recursive: true, force: true });
  }
});

test('resolveLayer resolves with deterministic priority project > global > shipped, never array order, and emits shipped', () => {
  // Multiple descendant layers under a container in random array order
  const originsGlobalFirst = [
    { path: 'runner.patterns.reviewed.defaults.maxRounds', layer: 'global' },
    { path: 'runner.patterns.reviewed.defaults.seats', layer: 'project' },
  ];
  const originsProjectFirst = [
    { path: 'runner.patterns.reviewed.defaults.seats', layer: 'project' },
    { path: 'runner.patterns.reviewed.defaults.maxRounds', layer: 'global' },
  ];
  assert.equal(resolveLayer(originsGlobalFirst, 'reviewed', 'defaults'), 'project');
  assert.equal(resolveLayer(originsProjectFirst, 'reviewed', 'defaults'), 'project');

  // Global beats standard/shipped
  const originsStandardAndGlobal = [
    { path: 'runner.patterns.reviewed.defaults.seats', layer: 'standard' },
    { path: 'runner.patterns.reviewed.defaults.maxRounds', layer: 'global' },
  ];
  assert.equal(resolveLayer(originsStandardAndGlobal, 'reviewed', 'defaults'), 'global');

  // Emits 'shipped' where input was 'standard'
  const standardOrigin = [{ path: 'runner.patterns.reviewed.defaults.seats', layer: 'standard' }];
  assert.equal(resolveLayer(standardOrigin, 'reviewed', 'defaults'), 'shipped');
  assert.equal(resolveLayer({ reviewed: 'standard' }, 'reviewed'), 'shipped');
  assert.equal(resolveLayer('standard', 'reviewed'), 'shipped');
});

test('validateRunnerPatternsShape retains indexed seat paths and resolves exact offending origin line', () => {
  let thrown = null;
  try {
    validateRunnerPatternsShape({
      custom: {
        loop: 'panel',
        promise: 'x',
        defaults: {
          seats: [
            { seat: 'first', role: 'producer' },
            { seat: 'second', role: 'bogus' },
          ],
        },
      },
    });
  } catch (err) {
    thrown = err;
  }
  assert.ok(thrown, 'must throw RunnerConfigError');
  assert.equal(thrown.path, 'runner.patterns.custom.defaults.seats[1].role');
  assert.deepEqual(thrown.paths, ['runner.patterns.custom.defaults.seats[1].role']);
  assert.equal(thrown.subpath, 'patterns.custom.defaults.seats[1].role');

  const origins = [
    { path: 'runner.patterns.custom.defaults.seats[0].seat', layer: 'global', line: 9 },
    { path: 'runner.patterns.custom.defaults.seats[1].role', layer: 'project', line: 17 },
  ];
  const locs = resolveOriginLocations(origins, thrown.paths, '/project');
  assert.deepEqual(locs, ['/project/.fgos/config.yaml:17']);
});

test('resolveLayer matches bracket-indexed descendants under container before falling back to pattern', () => {
  const origins = [
    { path: 'runner.patterns.custom.defaults.seats[0].seat', layer: 'global', line: 10 },
    { path: 'runner.patterns.custom.defaults.seats[0].role', layer: 'global', line: 11 },
    { path: 'runner.patterns.custom.promise', layer: 'project', line: 4 },
  ];
  assert.equal(resolveLayer(origins, 'custom', 'defaults.seats'), 'global');
});
