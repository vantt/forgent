// runner.tierFallback maps a tier to the ordered families a seat walks after a failure. The shape is
// checked at load; a project without the key keeps the walk over the capability's prefer order.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadRunnerConfigForDir } from '../../src/runner/dispatch/config.mjs';
import { RunnerConfigError } from '../../src/runner/dispatch/runner-config-error.mjs';
import { writeGlobalConfig, writeProjectConfig } from '../helpers/config-fixture.mjs';

function load(tierFallback, globalRunner) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-tier-fallback-'));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-tier-fallback-home-'));
  fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
  fs.mkdirSync(path.join(home, '.fgos'), { recursive: true });
  const runner = {
    executor: { command: 'claude', args: ['{prompt}'] },
    timeoutMs: 5000,
    modelPolicies: { claude: { advanced: 'sonnet' }, gemini: { advanced: 'gemini-flash' } },
    defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } },
  };
  if (tierFallback !== undefined) runner.tierFallback = tierFallback;
  writeProjectConfig(dir, { runner });
  if (globalRunner) writeGlobalConfig(home, { runner: globalRunner });
  const prevHome = process.env.HOME;
  const prevUserProfile = process.env.USERPROFILE;
  process.env.HOME = home;
  process.env.USERPROFILE = home;
  try {
    return loadRunnerConfigForDir(dir);
  } finally {
    process.env.HOME = prevHome;
    if (prevUserProfile !== undefined) process.env.USERPROFILE = prevUserProfile;
    else delete process.env.USERPROFILE;
  }
}

test('a tier fallback list loads in order', () => {
  const cfg = load({ advanced: ['gemini', 'claude'], flagship: ['claude'] });
  assert.deepEqual(cfg.tierFallback.advanced, ['gemini', 'claude']);
  assert.deepEqual(cfg.tierFallback.flagship, ['claude']);
});

test('a config without the key reads the standard order, and a project list replaces only the tiers it names', () => {
  const standard = load(undefined).tierFallback;
  assert.ok(Array.isArray(standard.advanced) && standard.advanced.length > 0, 'the standard declares an order per tier');
  const own = load({ advanced: ['claude'] }).tierFallback;
  assert.deepEqual(own.advanced, ['claude']);
  assert.deepEqual(own.flagship, standard.flagship);
});

test('each shape error fails the load and names the key', () => {
  const refused = (value, pattern) => assert.throws(() => load(value), (err) => {
    assert.ok(err instanceof RunnerConfigError);
    assert.match(err.message, pattern);
    return true;
  });
  refused([], /runner\.tierFallback \(type\)/);
  refused({ medium: ['claude'] }, /runner\.tierFallback \(additionalProperties\)/);
  refused({ advanced: [] }, /runner\.tierFallback\.advanced \((minItems|type)\)/);
  refused({ advanced: 'claude' }, /runner\.tierFallback\.advanced \((minItems|type)\)/);
  refused({ advanced: ['claude', 7] }, /runner\.tierFallback\.advanced\[1\] \(type\)/);
  refused({ advanced: ['claude', ' '] }, /runner\.tierFallback\.advanced\[1\] \(pattern\)/);
  refused({ advanced: ['claude', 'gemini', 'claude'] }, /runner\.tierFallback\.advanced \(uniqueItems\)/);
});

test('a project list replaces the global list of that tier and keeps the tiers it does not name', () => {
  const cfg = load({ advanced: ['claude'] }, { tierFallback: { advanced: ['gemini', 'claude'], flagship: ['gemini'] } });
  assert.deepEqual(cfg.tierFallback.advanced, ['claude']);
  assert.deepEqual(cfg.tierFallback.flagship, ['gemini']);
});

// ---- tier declarations: defaults, capability tier, role / persona / seat taste, schema marker, $comment ----

function runnerWith(patch = {}) {
  return {
    executor: { command: 'claude', args: ['{prompt}'] },
    timeoutMs: 5000,
    modelPolicies: { claude: { advanced: 'sonnet', flagship: 'opus' } },
    defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } },
    ...patch,
  };
}

/** Loads `runner` as the project layer with `globalRunner` as the global layer, in a temp project and HOME. */
function loadRunner(runner, globalRunner) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-tier-decl-'));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-tier-decl-home-'));
  fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
  fs.mkdirSync(path.join(home, '.fgos'), { recursive: true });
  writeProjectConfig(dir, { runner });
  if (globalRunner) writeGlobalConfig(home, { runner: globalRunner });
  const prevHome = process.env.HOME;
  const prevUserProfile = process.env.USERPROFILE;
  process.env.HOME = home;
  process.env.USERPROFILE = home;
  try {
    return { cfg: loadRunnerConfigForDir(dir), dir };
  } finally {
    process.env.HOME = prevHome;
    if (prevUserProfile !== undefined) process.env.USERPROFILE = prevUserProfile;
    else delete process.env.USERPROFILE;
  }
}

const refusedLoad = (runner, pattern, globalRunner) => assert.throws(() => loadRunner(runner, globalRunner), (err) => {
  assert.ok(err instanceof RunnerConfigError, String(err));
  assert.match(err.message, pattern);
  return true;
});

test('a project config may declare the default tier, a capability tier and ceiling, and role and persona taste', () => {
  const { cfg } = loadRunner(runnerWith({
    defaults: { tier: 'standard' },
    maxTier: 'flagship',
    capabilities: {
      'code:*': { tier: 'advanced', prefer: ['claude'] },
      'architecture:shape': {
        tier: 'frontier',
        maxTier: 'frontier',
        rigor: 'critical',
      },
    },
    roles: { reviewer: { tier: 'flagship', prefer: ['claude'] }, 'red-team': { prefer: [{ executor: 'openai' }] } },
    personas: { 'code-reviewer': { tier: 'flagship' } },
  }));
  assert.equal(cfg.defaults.tier, 'standard');
  assert.equal(cfg.roles['red-team'].prefer[0].executor, 'openai');
  assert.equal(cfg.personas['code-reviewer'].tier, 'flagship');
});

test('a tier name outside the vocabulary fails the load and names the key path', () => {
  refusedLoad(runnerWith({ defaults: { tier: 'medium' } }), /runner\.defaults\.tier \(enum\)/);
  refusedLoad(runnerWith({ maxTier: 'huge' }), /runner\.maxTier \(enum\)/);
  refusedLoad(runnerWith({ capabilities: { 'code:*': { tier: 'big' } } }), /runner\.capabilities\.code:\*\.tier \(enum\)/);
  refusedLoad(runnerWith({ capabilities: { 'code:*': { maxTier: 'big' } } }), /runner\.capabilities\.code:\*\.maxTier \(enum\)/);
  refusedLoad(runnerWith({ roles: { reviewer: { tier: 'big' } } }), /runner\.roles\.reviewer\.tier \(enum\)/);
  refusedLoad(runnerWith({ personas: { 'code-reviewer': { tier: 'big' } } }), /runner\.personas\.code-reviewer\.tier \(enum\)/);
});

test('roles are the five roles only, a persona is a persona name', () => {
  refusedLoad(runnerWith({ roles: { checker: { tier: 'standard' } } }), /runner\.roles \(additionalProperties\)/);
  refusedLoad(runnerWith({ personas: { 'Code Reviewer': { tier: 'standard' } } }), /personas.*"Code Reviewer".*persona name/);
});

test('a role or persona entry holds tier and prefer only; there is no families key', () => {
  refusedLoad(runnerWith({ roles: { reviewer: { families: ['claude'] } } }), /runner\.roles\.reviewer \(additionalProperties\)/);
  refusedLoad(runnerWith({ capabilities: { 'code:*': { families: ['claude'] } } }), /runner\.capabilities\.code:\* \(additionalProperties\)/);
  refusedLoad(runnerWith({ personas: { judge: 'standard' } }), /runner\.personas\.judge \(type\)/);
  refusedLoad(runnerWith({ defaults: { tier: 'standard', prefer: ['claude'] } }), /runner\.defaults \(additionalProperties\)/);
});

test('an empty prefer list is a load error wherever prefer sits, and every prefer names a registered executor', () => {
  refusedLoad(runnerWith({ capabilities: { 'code:*': { prefer: [] } } }), /code:\*\.prefer \(minItems\)/);
  refusedLoad(runnerWith({ roles: { reviewer: { prefer: [] } } }), /roles\.reviewer\.prefer \(minItems\)/);
  refusedLoad(runnerWith({ personas: { 'code-reviewer': { prefer: [] } } }), /personas\.code-reviewer\.prefer \(minItems\)/);
  refusedLoad(runnerWith({ personas: { judge: { prefer: ['nobody'] } } }), /personas\.judge.*"prefer" names "nobody" but no such executor/);
  refusedLoad(runnerWith({ roles: { reviewer: { prefer: [{ executor: 'claude', invocation: 'missing' }] } } }), /roles\.reviewer.*invocation "missing"/);
});

test('the schema marker is {schema: 1|2} inside patterns and nothing else', () => {
  assert.equal(loadRunner(runnerWith({ patterns: { seatBinding: { schema: 1 } } })).cfg.patterns.seatBinding.schema, 1);
  assert.equal(loadRunner(runnerWith({ patterns: { seatBinding: { schema: 2 } } })).cfg.patterns.seatBinding.schema, 2);
  refusedLoad(runnerWith({ patterns: { seatBinding: { schema: 3 } } }), /runner\.patterns\.seatBinding\.schema/);
  assert.equal(loadRunner(runnerWith({ patterns: { seatBinding: {} } })).cfg.patterns.seatBinding.schema, 2, 'a marker with no schema is filled by the standard');
  refusedLoad(runnerWith({ patterns: { seatBinding: { schema: 1, extra: true } } }), /runner\.patterns\.seatBinding \(additionalProperties\)/);
  refusedLoad(runnerWith({ patterns: { seatBinding: 1 } }), /runner\.patterns\.seatBinding/);
  refusedLoad(runnerWith({ patterns: { seatBinding: { schema: 1 }, somethingElse: { extra: true } } }), /runner\.patterns\.somethingElse \(additionalProperties\)/);
});

test('the global layer keeps the keys it has always carried: maxTier, tierFallback, capability rigor and prefer; a rigorToTier there is refused by name', () => {
  const globalRunner = {
    maxTier: 'flagship',
    tierFallback: { advanced: ['claude'] },
    capabilities: { review: { rigor: 'high', confinement: { mode: 'required', policy: 'host-write-denied' } } },
  };
  const { cfg } = loadRunner(runnerWith(), globalRunner);
  assert.equal(cfg.maxTier, 'flagship');
  assert.equal(cfg.capabilities.review.rigor, 'high');
  refusedLoad(runnerWith(), /runner\.rigorToTier no longer exists/, {
    ...globalRunner,
    rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
  });
});
