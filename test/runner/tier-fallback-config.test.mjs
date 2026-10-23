// runner.tierFallback maps a tier to the ordered families a seat walks after a failure. The shape is
// checked at load; a project without the key keeps the walk over the capability's prefer order.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadRunnerConfigFromDir, ensureRunnerConfigForDir, RunnerConfigError } from '../../src/runner/dispatch/config.mjs';
import { snapshotRunnerConfig } from '../../src/runner/execution/run.mjs';
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
    return loadRunnerConfigFromDir(dir);
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

test('a config without the key loads, and a tier the list does not name has no declared order', () => {
  const cfg = load(undefined);
  assert.equal(cfg.tierFallback, undefined);
  assert.equal(load({ advanced: ['claude'] }).tierFallback.nano, undefined);
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

// ---- tier declarations: defaults, capability tier, role / persona / seat taste, schema marker, $comment ----

function runnerWith(patch = {}) {
  return {
    executor: { command: 'claude', args: ['{prompt}'] },
    timeoutMs: 5000,
    modelPolicies: { claude: { advanced: 'sonnet', flagship: 'opus' } },
    defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } },
    executors: Object.fromEntries(['claude', 'other'].map((id) => [id, { kind: 'agent', providerModel: id, command: id, args: ['{prompt}'], invocations: [{ id: `${id}-cli`, via: 'cli', adapter: 'cli-spawn', command: id, args: ['{prompt}'], confinement: { backend: 'bwrap' } }] }])),
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
    return { cfg: loadRunnerConfigFromDir(dir), dir };
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

test('a project config may declare the default tier, a capability tier and ceiling, and role, persona and seat taste', () => {
  const { cfg } = loadRunner(runnerWith({
    defaults: { tier: 'standard' },
    maxTier: 'flagship',
    capabilities: {
      'code:*': { tier: 'advanced', prefer: ['claude'] },
      'architecture:shape': {
        tier: 'frontier',
        maxTier: 'frontier',
        rigor: 'critical',
        roles: { reviewer: { tier: 'flagship', prefer: ['claude'] }, 'red-team': { prefer: [{ executor: 'other' }] } },
        personas: { 'code-reviewer': { tier: 'flagship' } },
        seats: { 'system-owner': { tier: 'frontier', prefer: ['other'] } },
      },
    },
  }));
  assert.equal(cfg.defaults.tier, 'standard');
  assert.equal(cfg.capabilities['architecture:shape'].roles['red-team'].prefer[0].executor, 'other');
  assert.equal(cfg.capabilities['architecture:shape'].seats['system-owner'].tier, 'frontier');
});

test('a tier name outside the vocabulary fails the load and names the key path', () => {
  refusedLoad(runnerWith({ defaults: { tier: 'medium' } }), /defaults\.tier.*one of nano\/mini\/standard\/advanced\/flagship\/frontier.*"medium"/);
  refusedLoad(runnerWith({ maxTier: 'huge' }), /maxTier.*"huge"/);
  refusedLoad(runnerWith({ capabilities: { 'code:*': { tier: 'big' } } }), /capabilities\.code:\*.*"tier".*"big"/);
  refusedLoad(runnerWith({ capabilities: { 'code:*': { maxTier: 'big' } } }), /capabilities\.code:\*.*"maxTier".*"big"/);
  refusedLoad(runnerWith({ capabilities: { 'code:*': { roles: { reviewer: { tier: 'big' } } } } }), /capabilities\.code:\*\.roles\.reviewer.*"tier".*"big"/);
  refusedLoad(runnerWith({ capabilities: { 'code:*': { personas: { 'code-reviewer': { tier: 'big' } } } } }), /personas\.code-reviewer.*"tier"/);
  refusedLoad(runnerWith({ capabilities: { 'code:*': { seats: { judge: { tier: 'big' } } } } }), /seats\.judge.*"tier"/);
});

test('roles are the five roles only, a seat is a seat id, a persona is a persona name', () => {
  refusedLoad(runnerWith({ capabilities: { 'code:*': { roles: { checker: { tier: 'standard' } } } } }), /roles.*"checker".*one of producer\/synthesizer\/reviewer\/red-team\/judge/);
  refusedLoad(runnerWith({ capabilities: { 'code:*': { seats: { 'Member One': { tier: 'standard' } } } } }), /seats.*"Member One".*seat id/);
  refusedLoad(runnerWith({ capabilities: { 'code:*': { seats: { verify: { tier: 'standard' } } } } }), /seats.*"verify".*seat id/);
  refusedLoad(runnerWith({ capabilities: { 'code:*': { personas: { 'Code Reviewer': { tier: 'standard' } } } } }), /personas.*"Code Reviewer".*persona name/);
});

test('a role, persona or seat entry holds tier and prefer only; there is no families key', () => {
  refusedLoad(runnerWith({ capabilities: { 'code:*': { roles: { reviewer: { families: ['claude'] } } } } }), /roles\.reviewer.*unknown key "families".*tier, prefer/);
  refusedLoad(runnerWith({ capabilities: { 'code:*': { families: ['claude'] } } }), /capabilities\.code:\*.*unknown key "families"/);
  refusedLoad(runnerWith({ capabilities: { 'code:*': { seats: { judge: 'standard' } } } }), /seats\.judge.*must be an object/);
  refusedLoad(runnerWith({ defaults: { tier: 'standard', prefer: ['claude'] } }), /defaults.*unknown key "prefer"/);
});

test('an empty prefer list is a load error wherever prefer sits, and every prefer names a registered executor', () => {
  refusedLoad(runnerWith({ capabilities: { 'code:*': { prefer: [] } } }), /code:\*.*"prefer".*must not be empty/);
  refusedLoad(runnerWith({ capabilities: { 'code:*': { roles: { reviewer: { prefer: [] } } } } }), /roles\.reviewer.*"prefer".*must not be empty/);
  refusedLoad(runnerWith({ capabilities: { 'code:*': { personas: { 'code-reviewer': { prefer: [] } } } } }), /personas\.code-reviewer.*"prefer".*must not be empty/);
  refusedLoad(runnerWith({ capabilities: { 'code:*': { seats: { judge: { prefer: [] } } } } }), /seats\.judge.*"prefer".*must not be empty/);
  refusedLoad(runnerWith({ capabilities: { 'code:*': { seats: { judge: { prefer: ['nobody'] } } } } }), /seats\.judge.*"prefer" names "nobody" but no such executor/);
  refusedLoad(runnerWith({ capabilities: { 'code:*': { roles: { reviewer: { prefer: [{ executor: 'claude', invocation: 'missing' }] } } } } }), /roles\.reviewer.*invocation "missing"/);
});

test('the schema marker is {schema: 1} inside patterns and nothing else', () => {
  assert.equal(loadRunner(runnerWith({ patterns: { seatBinding: { schema: 1 } } })).cfg.patterns.seatBinding.schema, 1);
  refusedLoad(runnerWith({ patterns: { seatBinding: { schema: 2 } } }), /seatBinding\.schema.*must be 1.*2/);
  refusedLoad(runnerWith({ patterns: { seatBinding: {} } }), /seatBinding\.schema.*must be 1/);
  refusedLoad(runnerWith({ patterns: { seatBinding: { schema: 1, extra: true } } }), /seatBinding.*unknown key "extra"/);
  refusedLoad(runnerWith({ patterns: { seatBinding: 1 } }), /seatBinding.*must be an object/);
  refusedLoad(runnerWith({ patterns: { seatBinding: { schema: 1 }, somethingElse: {} } }), /patterns.*unknown key "somethingElse"/);
});

test('a key of the new schema in the global layer is refused and the message names the project config', () => {
  for (const [globalRunner, where] of [
    [{ defaults: { tier: 'standard' } }, 'defaults'],
    [{ patterns: { seatBinding: { schema: 1 } } }, 'patterns.seatBinding'],
    [{ capabilities: { 'code:*': { tier: 'advanced' } } }, 'capabilities.code:*.tier'],
    [{ capabilities: { 'code:*': { maxTier: 'advanced' } } }, 'capabilities.code:*.maxTier'],
    [{ capabilities: { 'code:*': { roles: { reviewer: { tier: 'advanced' } } } } }, 'capabilities.code:*.roles'],
    [{ capabilities: { 'code:*': { personas: {} } } }, 'capabilities.code:*.personas'],
    [{ capabilities: { 'code:*': { seats: {} } } }, 'capabilities.code:*.seats'],
  ]) {
    refusedLoad(runnerWith(), new RegExp(`~/\\.fgos/config\\.json runner\\.${where.replace(/[.*]/g, '\\$&')}.*project's \\.fgos/config\\.json`), globalRunner);
  }
});

test('the global layer keeps the keys it has always carried: maxTier, tierFallback, capability rigor and prefer; rigorToTier is dropped', () => {
  const { cfg } = loadRunner(runnerWith(), {
    maxTier: 'flagship',
    tierFallback: { advanced: ['claude'] },
    // A machine that has not re-run setup still carries it; the loader drops it from the global layer.
    rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
    capabilities: { review: { rigor: 'high', confinement: { mode: 'required', policy: 'host-write-denied' } } },
  });
  assert.equal('rigorToTier' in cfg, false);
  assert.equal(cfg.maxTier, 'flagship');
  assert.equal(cfg.capabilities.review.rigor, 'high');
});

test('a $comment key is ignored at every level and never reaches the loaded config', () => {
  const { cfg } = loadRunner(runnerWith({
    $comment: ['nano: mechanical', 'frontier: costly'],
    modelPolicies: { $comment: 'tiers', claude: { $comment: 'cells', advanced: 'sonnet' } },
    tierFallback: { $comment: 'order', advanced: ['claude'] },
    capabilities: { 'code:*': { $comment: 'per capability', tier: 'advanced', roles: { $comment: 'x', reviewer: { $comment: 'y', tier: 'flagship' } } } },
    patterns: { $comment: 'patterns', seatBinding: { $comment: 'marker', schema: 1 } },
  }), { $comment: 'global note', modelPolicies: { $comment: 'global tiers' } });
  assert.equal(JSON.stringify(cfg).includes('$comment'), false);
  assert.deepEqual(Object.keys(cfg.modelPolicies), ['claude']);
  assert.deepEqual(Object.keys(cfg.tierFallback), ['advanced']);
});

test('$comment does not change the semantic config hash', () => {
  const plain = runnerWith({ capabilities: { 'code:*': { tier: 'advanced' } }, patterns: { seatBinding: { schema: 1 } } });
  const noted = runnerWith({
    $comment: 'ladder',
    modelPolicies: { $comment: 'tiers', claude: { advanced: 'sonnet', flagship: 'opus' } },
    capabilities: { 'code:*': { $comment: 'note', tier: 'advanced' } },
    patterns: { seatBinding: { schema: 1 } },
  });
  const hashOf = (runner) => snapshotRunnerConfig('/unused', loadRunner(runner).cfg).hash;
  assert.equal(hashOf(noted), hashOf(plain));
});

test('ensureRunnerConfigForDir keeps a $comment and the marker in the project file and loads the config without the $comment', () => {
  const { dir } = loadRunner(runnerWith({ $comment: 'ladder', patterns: { seatBinding: { schema: 1 } } }));
  const file = path.join(dir, '.fgos', 'config.json');
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-tier-decl-home-'));
  const prevHome = process.env.HOME;
  const prevWrite = process.stderr.write;
  process.env.HOME = home;
  process.stderr.write = () => true;
  try {
    const loaded = ensureRunnerConfigForDir(dir);
    assert.equal(JSON.stringify(loaded).includes('$comment'), false);
    assert.equal(loaded.patterns.seatBinding.schema, 1);
    const written = JSON.parse(fs.readFileSync(file, 'utf8')).runner;
    assert.equal(written.$comment, 'ladder');
    assert.equal(written.patterns.seatBinding.schema, 1);
  } finally {
    process.stderr.write = prevWrite;
    process.env.HOME = prevHome;
  }
});
