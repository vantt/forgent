// The hash a unit run records for the runner config it ran under. It now covers what seat choice reads (the tier
// default, the ceiling, the fallback order, the cells, the capability taste and the schema marker) and no longer the
// retired rigorToTier. Every record's hash changes at the cutover, which is intended, not a regression: the tests
// assert the new hash by what it covers, never the old value.

import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { snapshotRunnerConfig } from '../../../src/runner/execution/run.mjs';

const runner = () => ({
  defaults: { tier: 'standard' },
  maxTier: 'flagship',
  tierFallback: { standard: ['claude'] },
  modelPolicies: { claude: { standard: 'sonnet', flagship: 'opus' } },
  capabilities: { 'code:*': { tier: 'standard', roles: { 'red-team': { prefer: ['xai'] } } } },
  patterns: { seatBinding: { schema: 1 } },
  executors: { claude: { command: 'claude' } },
  governance: null,
  timeoutMs: 5000,
});
const hashOf = (cfg) => snapshotRunnerConfig('/unused', cfg).hash;

test('the hash changes when any part of seat choice changes: the default tier, the ceiling, the fallback order, a cell, a taste line, the marker', () => {
  const base = hashOf(runner());
  const variants = {
    'defaults.tier': (cfg) => { cfg.defaults.tier = 'advanced'; },
    maxTier: (cfg) => { cfg.maxTier = 'frontier'; },
    'tierFallback.standard': (cfg) => { cfg.tierFallback.standard = ['claude', 'openai']; },
    'modelPolicies cell': (cfg) => { cfg.modelPolicies.claude.flagship = 'opus-2'; },
    'capability roles': (cfg) => { cfg.capabilities['code:*'].roles['red-team'].prefer = ['claude']; },
    'patterns.seatBinding': (cfg) => { cfg.patterns.seatBinding.schema = 2; },
  };
  for (const [name, change] of Object.entries(variants)) {
    const cfg = runner();
    change(cfg);
    assert.notEqual(hashOf(cfg), base, name);
  }
});

test('a comment, anywhere, never changes the hash, and neither does a key the hash does not cover', () => {
  const base = hashOf(runner());
  const noted = runner();
  noted.$comment = ['nano: mechanical'];
  noted.modelPolicies.$comment = 'cells';
  noted.capabilities['code:*'].$comment = 'taste';
  noted.timeoutMs = 1;
  assert.equal(hashOf(noted), base);
});

test('the retired rigorToTier is not part of the hash', () => {
  const base = hashOf(runner());
  const withRetired = { ...runner(), rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' } };
  assert.equal(hashOf(withRetired), base);
});

test('the snapshot hands back the config it was given, and the hash is a sha-256 hex digest', () => {
  const cfg = runner();
  const snap = snapshotRunnerConfig('/unused', cfg);
  assert.equal(snap.runner, cfg);
  assert.match(snap.hash, /^[0-9a-f]{64}$/);
});
