// runner.tierFallback maps a tier to the ordered families a seat walks after a failure. The shape is
// checked at load; a project without the key keeps the walk over the capability's prefer order.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadRunnerConfigFromDir, RunnerConfigError } from '../../src/runner/dispatch/config.mjs';
import { tierFallbackOf } from '../../src/runner/dispatch/resolve.mjs';

function load(tierFallback, globalRunner) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-tier-fallback-'));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-tier-fallback-home-'));
  fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
  fs.mkdirSync(path.join(home, '.fgos'), { recursive: true });
  const runner = {
    executor: { command: 'claude', args: ['{prompt}'] },
    timeoutMs: 5000,
    modelPolicies: { claude: { advanced: 'sonnet' }, gemini: { advanced: 'gemini-flash' } },
    rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
  };
  if (tierFallback !== undefined) runner.tierFallback = tierFallback;
  fs.writeFileSync(path.join(dir, '.fgos', 'config.json'), JSON.stringify({ runner }));
  if (globalRunner) fs.writeFileSync(path.join(home, '.fgos', 'config.json'), JSON.stringify({ runner: globalRunner }));
  const prevHome = process.env.HOME;
  const prevUserProfile = process.env.USERPROFILE;
  process.env.HOME = home;
  process.env.USERPROFILE = home;
  try {
    return loadRunnerConfigFromDir(dir);
  } finally {
    process.env.HOME = prevHome;
    if (prevUserProfile !== undefined) process.env.USERPROFILE = prevUserProfile;
    else delete process.env.USERPROFILE;
  }
}

test('a tier fallback list loads and tierFallbackOf returns it in order', () => {
  const cfg = load({ advanced: ['gemini', 'claude'], flagship: ['claude'] });
  assert.deepEqual(tierFallbackOf(cfg, 'advanced'), ['gemini', 'claude']);
  assert.deepEqual(tierFallbackOf(cfg, 'flagship'), ['claude']);
});

test('a config without the key loads, and every tier reads as having no declared order', () => {
  const cfg = load(undefined);
  assert.equal(cfg.tierFallback, undefined);
  assert.equal(tierFallbackOf(cfg, 'advanced'), null);
  assert.equal(tierFallbackOf(load({ advanced: ['claude'] }), 'nano'), null);
});

test('tierFallbackOf hands out a copy, so a caller cannot reorder the config', () => {
  const cfg = load({ advanced: ['gemini', 'claude'] });
  tierFallbackOf(cfg, 'advanced').reverse();
  assert.deepEqual(cfg.tierFallback.advanced, ['gemini', 'claude']);
});

test('each shape error fails the load and names the key', () => {
  const refused = (value, pattern) => assert.throws(() => load(value), (err) => {
    assert.ok(err instanceof RunnerConfigError);
    assert.match(err.message, pattern);
    return true;
  });
  refused([], /tierFallback.*object mapping tier/);
  refused({ medium: ['claude'] }, /tierFallback.*tier key must be one of.*"medium"/);
  refused({ advanced: [] }, /tierFallback\.advanced.*non-empty list/);
  refused({ advanced: 'claude' }, /tierFallback\.advanced.*non-empty list/);
  refused({ advanced: ['claude', 7] }, /tierFallback\.advanced.*7/);
  refused({ advanced: ['claude', ' '] }, /tierFallback\.advanced.*non-empty family name/);
  refused({ advanced: ['claude', 'gemini', 'claude'] }, /tierFallback\.advanced.*"claude" more than once/);
});

test('a project list replaces the global list of that tier and keeps the tiers it does not name', () => {
  const cfg = load({ advanced: ['claude'] }, { tierFallback: { advanced: ['gemini', 'claude'], flagship: ['gemini'] } });
  assert.deepEqual(cfg.tierFallback.advanced, ['claude']);
  assert.deepEqual(cfg.tierFallback.flagship, ['gemini']);
});
