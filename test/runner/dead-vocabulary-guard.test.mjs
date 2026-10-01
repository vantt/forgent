import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');

function collectFiles(dir, extensions = ['.js', '.mjs', '.cjs', '.json', '.yaml', '.yml', '.md']) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      results.push(...collectFiles(fullPath, extensions));
    } else if (entry.isFile()) {
      if (extensions.some((ext) => entry.name.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

test('dead vocabulary guard: Phase 1 retired symbols do not appear in src, bin, core, domains, scripts', () => {
  const deadSymbols = [
    'modelForTier',
    'resolvePolicyTierModel',
    'policyTierForDispatchTier',
    'policyTierForWorkTier',
    'resolveVerifiedPlacementModel',
    'buildPlacementPolicyCandidate',
    'evaluatePlacementPolicyShadow',
    'PLACEMENT_POLICY_SHADOW',
    'rigorOverrides',
  ];

  const searchDirs = ['src', 'bin', 'core', 'domains', 'scripts'].map((d) => path.join(REPO_ROOT, d));
  const files = searchDirs.flatMap((d) => collectFiles(d));

  const violations = [];
  const symbolRegexes = deadSymbols.map((sym) => ({ symbol: sym, regex: new RegExp(`\\b${sym}\\b`) }));

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    for (const { symbol, regex } of symbolRegexes) {
      if (regex.test(content)) {
        const rel = path.relative(REPO_ROOT, file);
        violations.push(`${rel}: found dead symbol "${symbol}"`);
      }
    }
  }

  assert.deepEqual(violations, [], `Dead vocabulary detected:\n${violations.join('\n')}`);
});

test('dead vocabulary guard: cfg.models and .models are removed from src/runner/dispatch', () => {
  const dispatchDir = path.join(REPO_ROOT, 'src', 'runner', 'dispatch');
  const files = collectFiles(dispatchDir, ['.js', '.mjs']);

  const violations = [];
  // Match active code property access like `cfg.models` or `runner.models` or `.models`
  const codeRegex = /\b(?:cfg|runner|runnerConfig|config|existingRunner)\.models\b/;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      // Ignore comment lines and error messages explaining the removal
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
      if (codeRegex.test(line)) {
        const rel = path.relative(REPO_ROOT, file);
        violations.push(`${rel}:${idx + 1}: ${line.trim()}`);
      }
    });
  }

  assert.deepEqual(violations, [], `Legacy models access detected:\n${violations.join('\n')}`);
});

test('dead vocabulary guard: .fgos/config.json does not contain runner.models or rigorOverrides', () => {
  const configPath = path.join(REPO_ROOT, '.fgos', 'config.json');
  if (!fs.existsSync(configPath)) return;
  const content = fs.readFileSync(configPath, 'utf8');
  assert.ok(!content.includes('rigorOverrides'), '.fgos/config.json must not mention rigorOverrides');

  const parsed = JSON.parse(content);
  assert.equal(parsed.runner?.models, undefined, '.fgos/config.json must not declare runner.models');
});

import os from 'node:os';
import { loadRunnerConfig, RunnerConfigError } from '../../src/runner/dispatch/config.mjs';
import { resolveTierModel } from '../../src/runner/dispatch/resolve.mjs';

function mkTempConfig(runnerObj) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dead-vocab-test-'));
  const file = path.join(dir, 'config.json');
  fs.writeFileSync(file, JSON.stringify(runnerObj));
  return file;
}

test('dead vocabulary guard: loadRunnerConfig rejects dead keys with actionable instructions', () => {
  const base = {
    executor: { command: 'claude', args: ['{prompt}'] },
    modelPolicies: { claude: { nano: 'haiku', standard: 'sonnet', advanced: 'sonnet', flagship: 'sonnet', frontier: 'opus' } },
    timeoutMs: 1000,
  };

  // 1. runner.models
  const fModels = mkTempConfig({ ...base, models: { standard: 'sonnet' } });
  assert.throws(
    () => loadRunnerConfig(fModels),
    (err) => err instanceof RunnerConfigError && /declares retired "models" map/.test(err.message),
  );

  // 2. executors.*.rigorOverrides
  const fRigor = mkTempConfig({
    ...base,
    executors: { gemini: { kind: 'agent', command: 'gemini', args: [], providerModel: 'gemini', rigorOverrides: { heavy: 'advanced' } } },
  });
  assert.throws(
    () => loadRunnerConfig(fRigor),
    (err) => err instanceof RunnerConfigError && /rigorOverrides was removed; express per-tier models in runner\.modelPolicies\.gemini/.test(err.message),
  );

  // 3. capabilities.*.overrides.rigorOverrides
  const fCapRigor = mkTempConfig({
    ...base,
    capabilities: {
      'fgos-coding-implement': {
        prefer: 'gemini',
        overrides: { rigorOverrides: { heavy: 'standard' } },
      },
    },
    executors: { gemini: { kind: 'agent', command: 'gemini', args: [] } },
  });
  assert.throws(
    () => loadRunnerConfig(fCapRigor),
    (err) => err instanceof RunnerConfigError && /overrides\.rigorOverrides was removed/.test(err.message),
  );

  // 4. capabilities.*.overrides.providerModel
  const fCapProvider = mkTempConfig({
    ...base,
    capabilities: {
      'fgos-coding-implement': {
        prefer: 'gemini',
        overrides: { providerModel: 'gemini' },
      },
    },
    executors: { gemini: { kind: 'agent', command: 'gemini', args: [] } },
  });
  assert.throws(
    () => loadRunnerConfig(fCapProvider),
    (err) => err instanceof RunnerConfigError && /overrides\.providerModel was removed; provider belongs on executors\.<id>\.providerModel/.test(err.message),
  );
});

test('resolveTierModel: resolves tier to model via modelPolicies[provider][tier]', () => {
  const cfg = {
    modelPolicies: {
      claude: {
        nano: 'haiku',
        standard: 'sonnet',
        advanced: 'sonnet-advanced',
        flagship: 'opus',
        frontier: 'fable',
      },
      gemini: {
        nano: 'flash-low',
        standard: 'flash-medium',
        advanced: 'flash-high',
        flagship: 'pro-low',
        frontier: 'pro-high',
      },
    },
  };

  // Valid policy tiers
  assert.equal(resolveTierModel(cfg, 'nano', 'claude'), 'haiku');
  assert.equal(resolveTierModel(cfg, 'standard', 'claude'), 'sonnet');
  assert.equal(resolveTierModel(cfg, 'advanced', 'claude'), 'sonnet-advanced');
  assert.equal(resolveTierModel(cfg, 'flagship', 'claude'), 'opus');
  assert.equal(resolveTierModel(cfg, 'frontier', 'claude'), 'fable');

  // Temporary bridge for light|standard|heavy
  assert.equal(resolveTierModel(cfg, 'light', 'gemini'), 'flash-low');
  assert.equal(resolveTierModel(cfg, 'standard', 'gemini'), 'flash-medium');
  assert.equal(resolveTierModel(cfg, 'heavy', 'gemini'), 'pro-high');

  // Invalid tier throws
  assert.throws(
    () => resolveTierModel(cfg, 'non-existent-tier', 'claude'),
    (err) => err instanceof RunnerConfigError && /unrecognized tier/.test(err.message),
  );

  // Missing provider throws
  assert.throws(
    () => resolveTierModel(cfg, 'standard', 'unknown-provider'),
    (err) => err instanceof RunnerConfigError && /no modelPolicies configured for provider/.test(err.message),
  );

  // Missing tier in provider table throws
  const incompleteCfg = { modelPolicies: { custom: { nano: 'only-nano' } } };
  assert.throws(
    () => resolveTierModel(incompleteCfg, 'standard', 'custom'),
    (err) => err instanceof RunnerConfigError && /no model configured for tier "standard" under provider "custom"/.test(err.message),
  );
});
