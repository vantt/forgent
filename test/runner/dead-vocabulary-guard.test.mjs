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

test('dead vocabulary guard: Phase 1-3 retired symbols do not appear in src, bin, core, domains, scripts, config, or non-history docs', () => {
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
    'minTier',
    'minRigor',
    'QUALITY_TIER_BRIDGE',
    'QUALITY_MODE_VALUES',
    'MIN_RIGOR_VALUES',
    'MIN_TIER_VALUES',
    'DEFAULT_TIER_TO_POLICY',
  ];

  const searchDirs = ['src', 'bin', 'core', 'domains', 'scripts'].map((d) => path.join(REPO_ROOT, d));
  const codeFiles = searchDirs.flatMap((d) => collectFiles(d));
  const configJson = path.join(REPO_ROOT, '.fgos', 'config.json');
  if (fs.existsSync(configJson)) {
    codeFiles.push(configJson);
  }

  const docDirs = [
    path.join(REPO_ROOT, 'docs', 'specs'),
    path.join(REPO_ROOT, 'docs', 'platform', 'agent-coordination', 'contracts'),
    path.join(REPO_ROOT, 'docs', 'architect', 'agent-coordination', 'contracts'),
  ];
  const docFiles = docDirs.flatMap((d) => collectFiles(d, ['.md']));

  const violations = [];
  const symbolRegexes = deadSymbols.map((sym) => ({ symbol: sym, regex: new RegExp(`\\b${sym}\\b`) }));

  for (const file of codeFiles) {
    let content = fs.readFileSync(file, 'utf8');
    const rel = path.relative(REPO_ROOT, file);
    if (rel === 'src/setup/registrations.mjs') {
      // Exclude doctor check functions and registrations that detect dead keys
      content = content
        .replace(/export function checkTierVocabularyDeadKeys[\s\S]*?\n\}/, '')
        .replace(/export function checkCoordinationProtocolDeadVocabulary[\s\S]*?\n\}/, '')
        .replace(/registerCheck\(\{\s*id:\s*['"]tier-vocabulary-dead-keys['"][\s\S]*?\n\}\);/, '')
        .replace(/registerCheck\(\{\s*id:\s*['"]coordination-protocol-dead-vocabulary['"][\s\S]*?\n\}\);/, '');
    }
    for (const { symbol, regex } of symbolRegexes) {
      if (regex.test(content)) {
        violations.push(`${rel}: found dead symbol "${symbol}"`);
      }
    }
  }

  for (const file of docFiles) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    let inHistory = false;
    let historyLevel = 0;
    let inRuleBullet = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        inRuleBullet = false;
        const lvl = h[1].length;
        const title = h[2].toLowerCase();
        if (inHistory && lvl <= historyLevel) {
          inHistory = false;
        }
        if (!inHistory && (title.includes('lịch sử') || title.includes('decision history') || title.includes('quyết định'))) {
          inHistory = true;
          historyLevel = lvl;
        }
      }
      if (line.match(/^\s*-\s*\*\*RUL(69|70|72)\b/)) {
        inRuleBullet = true;
      } else if (line.match(/^\s*-\s*\*\*RUL\d+\b/) || line.match(/^#{1,6}\s/)) {
        inRuleBullet = false;
      }
      if (inHistory || inRuleBullet) continue;

      for (const { symbol, regex } of symbolRegexes) {
        if (regex.test(line)) {
          const rel = path.relative(REPO_ROOT, file);
          violations.push(`${rel}:${i + 1}: found dead symbol "${symbol}" outside decision history`);
        }
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
    rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
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
    (err) => err instanceof RunnerConfigError && /capabilities\.fgos-coding-implement\.overrides was removed; use "capabilities\.fgos-coding-implement\.rigor"/.test(err.message),
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
    (err) => err instanceof RunnerConfigError && /capabilities\.fgos-coding-implement\.overrides was removed; use "capabilities\.fgos-coding-implement\.rigor"/.test(err.message),
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

  // Phase 3: light/heavy are retired from resolveTierModel
  assert.throws(
    () => resolveTierModel(cfg, 'light', 'gemini'),
    (err) => err instanceof RunnerConfigError && /unrecognized tier "light"/.test(err.message),
  );
  assert.throws(
    () => resolveTierModel(cfg, 'heavy', 'gemini'),
    (err) => err instanceof RunnerConfigError && /unrecognized tier "heavy"/.test(err.message),
  );
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

import { mergePolicyStack, FlowDefinitionError } from '../../src/runner/definitions/schema.mjs';
import { resolveAssignmentDispatchPolicy } from '../../src/runner/dispatch/assignment-policy.mjs';
import { buildAssignment } from '../../src/runner/dispatch/assignment.mjs';

test('dead vocabulary guard: schema rejects minTier with guidance and enforces rigor monotonicity', () => {
  // Reject minTier with guidance
  assert.throws(
    () => mergePolicyStack([{ scope: 'operation', id: 'op1', policy: { minTier: 'standard' } }]),
    (err) => err instanceof FlowDefinitionError && /minTier was removed; use "rigor"/.test(err.message),
  );

  // Rigor monotonic raise is allowed
  const raised = mergePolicyStack([
    { scope: 'definition', id: 'def1', policy: { rigor: 'low' } },
    { scope: 'operation', id: 'op1', policy: { rigor: 'standard' } },
    { scope: 'actor', id: 'act1', policy: { rigor: 'high' } },
  ]);
  assert.equal(raised.rigor, 'high');

  // Rigor lowering is rejected
  assert.throws(
    () => mergePolicyStack([
      { scope: 'definition', id: 'def1', policy: { rigor: 'high' } },
      { scope: 'operation', id: 'op1', policy: { rigor: 'low' } },
    ]),
    (err) => err instanceof FlowDefinitionError && /lower than the floor/.test(err.message),
  );

  // tier field in PolicyPatch is rejected at operation scope
  assert.throws(
    () => mergePolicyStack([{ scope: 'operation', id: 'op1', policy: { tier: 'advanced' } }]),
    (err) => err instanceof FlowDefinitionError && /tier is only valid at actor\/assignment\/cli scope/.test(err.message),
  );

  // tier field in PolicyPatch is accepted at actor scope
  const actorTier = mergePolicyStack([{ scope: 'actor', id: 'act1', policy: { tier: 'advanced' } }]);
  assert.equal(actorTier.tier, 'advanced');
});

test('dead vocabulary guard: capabilities.<cap>.rigor floor elevates tier and capabilities.*.overrides is rejected (D19)', () => {
  const baseConfig = {
    executor: { command: 'claude', args: ['{prompt}'] },
    modelPolicies: {
      claude: { nano: 'haiku', standard: 'sonnet', advanced: 'sonnet-adv', flagship: 'opus', frontier: 'fable' },
    },
    rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
    timeoutMs: 1000,
  };

  // 1. capabilities.*.overrides is rejected
  const fOverrides = mkTempConfig({
    ...baseConfig,
    capabilities: {
      'code:review': { overrides: { tier: 'flagship' } },
    },
  });
  assert.throws(
    () => loadRunnerConfig(fOverrides),
    (err) => err instanceof RunnerConfigError && /capabilities\.code:review\.overrides was removed; use "capabilities\.code:review\.rigor"/.test(err.message),
  );

  // 2. capabilities.<cap>.rigor floor elevates tier
  const runnerConfig = {
    ...baseConfig,
    capabilities: {
      'code:review': { rigor: 'high' },
    },
  };
  const assignment = buildAssignment({
    stage: 'planning',
    operation: 'validate-plan',
    policy: { capability: 'code:review', rigor: 'standard' },
  });

  const effective = resolveAssignmentDispatchPolicy({ assignment, runnerConfig });
  assert.equal(effective.rigor, 'high', 'capability floor high should win over step standard');
  assert.equal(effective.tier, 'flagship', 'high rigor maps to flagship tier');
  assert.equal(effective.model, 'opus');
  assert.equal(effective.provenance.rigor.source.scope, 'capability');
  assert.equal(effective.provenance.rigor.source.id, 'code:review');
});

import * as workModule from '../../src/state/work.mjs';
import { COMMAND_REGISTRY } from '../../src/cli/command-registry.mjs';

test('dead vocabulary guard: Phase 3 Work tier retired, size and rigor enforced', () => {
  // 1. workModule exports SIZES, not TIERS
  assert.equal(workModule.TIERS, undefined, 'TIERS must not be exported from work.mjs');
  assert.ok(Array.isArray(workModule.SIZES), 'SIZES must be exported from work.mjs');
  assert.deepEqual(workModule.SIZES, ['light', 'standard', 'heavy']);

  // 2. Pattern \b(item|work|workItem)\??\.tier\b does not appear in src, bin, packages, herdr-plugin/src
  // Exception: src/state/work.mjs where work.tier is checked and rejected
  const pattern = /\b(item|work|workItem)\??\.tier\b/;
  const checkDirs = ['src', 'bin', 'packages', path.join('herdr-plugin', 'src')].map((d) => path.join(REPO_ROOT, d));
  const allFiles = checkDirs.flatMap((d) => collectFiles(d, ['.js', '.mjs', '.cjs', '.rs']));
  const violations = [];
  for (const file of allFiles) {
    const rel = path.relative(REPO_ROOT, file);
    if (rel === 'src/state/work.mjs') continue; // allowed: error rejection of work.tier
    const content = fs.readFileSync(file, 'utf8');
    if (pattern.test(content)) {
      violations.push(`${rel}: found deprecated work tier read`);
    }
  }
  assert.deepEqual(violations, [], `Work tier reads detected:\n${violations.join('\n')}`);

  // 3. Work verbs in command registry do not declare tier flag, and declare size + rigor
  for (const verb of ['add', 'submit', 'discover', 'edit']) {
    const entry = COMMAND_REGISTRY.find((e) => e.invoke === `fgos ${verb}`);
    assert.ok(entry, `command-registry must have entry for fgos ${verb}`);
    assert.equal(entry.parameters?.properties?.tier, undefined, `fgos ${verb} must not declare tier flag`);
    assert.ok(entry.parameters?.properties?.size, `fgos ${verb} must declare size flag`);
    assert.ok(entry.parameters?.properties?.rigor, `fgos ${verb} must declare rigor flag`);
  }

  // 4. \b(work|item|workItem)\.size\b does not appear in src/runner/dispatch/**
  const dispatchFiles = collectFiles(path.join(REPO_ROOT, 'src', 'runner', 'dispatch'), ['.js', '.mjs']);
  const workSizePattern = /\b(work|item|workItem)\.size\b/;
  const dispatchViolations = [];
  for (const file of dispatchFiles) {
    const rel = path.relative(REPO_ROOT, file);
    const content = fs.readFileSync(file, 'utf8');
    if (workSizePattern.test(content)) {
      dispatchViolations.push(`${rel}: work.size leaked into dispatch`);
    }
  }
  assert.deepEqual(dispatchViolations, [], `Dispatch size leaks detected:\n${dispatchViolations.join('\n')}`);
});

test('dead vocabulary guard: Request-to-Run P1 retired symbols do not appear in src or config', () => {
  const p1DeadSymbols = [
    'selectReadOnlyRedirectExecutor',
    'claude-cli-readonly',
    'claude-herdr-readonly',
    'codex-cli-readonly-fgovn',
  ];

  const searchDirs = ['src', 'bin', 'core', 'domains'].map((d) => path.join(REPO_ROOT, d));
  const codeFiles = searchDirs.flatMap((d) => collectFiles(d, ['.js', '.mjs', '.cjs', '.json', '.yaml', '.yml']));
  const configJson = path.join(REPO_ROOT, '.fgos', 'config.json');
  if (fs.existsSync(configJson)) {
    codeFiles.push(configJson);
  }

  const violations = [];
  const symbolRegexes = p1DeadSymbols.map((sym) => ({ symbol: sym, regex: new RegExp(`\\b${sym}\\b`) }));

  for (const file of codeFiles) {
    const rel = path.relative(REPO_ROOT, file);
    const content = fs.readFileSync(file, 'utf8');
    for (const { symbol, regex } of symbolRegexes) {
      if (regex.test(content)) {
        violations.push(`${rel}: contains retired P1 symbol "${symbol}"`);
      }
    }
  }

  // Ensure placement-policy.mjs is deleted
  const placementPolicyPath = path.join(REPO_ROOT, 'src', 'runner', 'dispatch', 'placement-policy.mjs');
  assert.equal(fs.existsSync(placementPolicyPath), false, 'src/runner/dispatch/placement-policy.mjs must be deleted');

  assert.deepEqual(violations, [], `P1 dead symbols detected:\n${violations.join('\n')}`);
});
