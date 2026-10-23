// A tier cell of runner.modelPolicies.<family>.<tier> is a model, a model served by a named pool
// (model@pool), or an ordered list of those. Every entry is a candidate of the seat's walk; the model
// a family runs first is the first entry's.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseTierCell, isExtendedTierCell } from '../../src/runner/dispatch/tier-cell.mjs';
import { loadRunnerConfigFromDir, supportsPolicyTier, RunnerConfigError } from '../../src/runner/dispatch/config.mjs';
import { bind } from '../../src/runner/execution/bind.mjs';
import { seedFileLocalBwrapRegistry } from './confinement-registry-fixture.helper.mjs';
import { writeGlobalConfig, writeProjectConfig } from '../helpers/config-fixture.mjs';

seedFileLocalBwrapRegistry();

test('a plain model is served by the pool named after its family', () => {
  assert.deepEqual(parseTierCell('sonnet', 'claude'), [{ model: 'sonnet', pool: 'claude', explicitPool: false }]);
});

test('model@pool names the pool, split at the last "@" so a model id may itself contain "@"', () => {
  assert.deepEqual(parseTierCell('deepseek-v4@openrouter', 'deepseek'), [{ model: 'deepseek-v4', pool: 'openrouter', explicitPool: true }]);
  assert.deepEqual(parseTierCell('claude-opus-4@20250514@vertex', 'claude'), [{ model: 'claude-opus-4@20250514', pool: 'vertex', explicitPool: true }]);
});

test('a model id containing "@" with no pool after it reads its last segment as the pool', () => {
  // Such an id has to name its pool, as above; written bare it is not served by the family pool.
  assert.deepEqual(parseTierCell('claude-opus-4@20250514', 'claude'), [{ model: 'claude-opus-4', pool: '20250514', explicitPool: true }]);
});

test('a list keeps its order', () => {
  assert.deepEqual(parseTierCell(['deepseek-v4@openrouter', 'deepseek-v4'], 'deepseek'), [
    { model: 'deepseek-v4', pool: 'openrouter', explicitPool: true },
    { model: 'deepseek-v4', pool: 'deepseek', explicitPool: false },
  ]);
});

test('an empty list, a non-string entry, an empty model and an empty pool are refused', () => {
  assert.throws(() => parseTierCell([], 'claude'), /at least one model/);
  assert.throws(() => parseTierCell([42], 'claude'), /non-empty string/);
  assert.throws(() => parseTierCell('', 'claude'), /non-empty string/);
  assert.throws(() => parseTierCell('@openrouter', 'claude'), /no model/);
  assert.throws(() => parseTierCell('sonnet@', 'claude'), /no pool/);
});

test('only the list and model@pool forms count as extended', () => {
  assert.equal(isExtendedTierCell('sonnet'), false);
  assert.equal(isExtendedTierCell('sonnet@claude'), true);
  assert.equal(isExtendedTierCell(['sonnet']), true);
});

const policies = {
  modelPolicies: {
    claude: { standard: 'sonnet' },
    deepseek: { standard: ['deepseek-v4@openrouter', 'deepseek-v4-std'], advanced: 'deepseek-v4-pro@openrouter' },
  },
};

test('supportsPolicyTier answers whether a family has a cell at a tier, without throwing', () => {
  assert.equal(supportsPolicyTier(policies, 'deepseek', 'standard'), true);
  assert.equal(supportsPolicyTier(policies, 'deepseek', 'advanced'), true);
  assert.equal(supportsPolicyTier(policies, 'deepseek', 'nano'), false);
  assert.equal(supportsPolicyTier({ modelPolicies: { claude: { standard: [] } } }, 'claude', 'standard'), false);
});

function loadWith(projectPolicies, globalPolicies) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-tier-cell-'));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-tier-cell-home-'));
  fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
  fs.mkdirSync(path.join(home, '.fgos'), { recursive: true });
  writeProjectConfig(dir, { runner: { executor: { command: 'claude', args: ['{prompt}'] }, timeoutMs: 5000, modelPolicies: projectPolicies, defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } } } });
  if (globalPolicies) writeGlobalConfig(home, { runner: { modelPolicies: globalPolicies } });
  const prevHome = process.env.HOME;
  const prevUserProfile = process.env.USERPROFILE;
  const prevWrite = process.stderr.write;
  const stderr = [];
  process.env.HOME = home;
  process.env.USERPROFILE = home;
  process.stderr.write = (chunk) => { stderr.push(String(chunk)); return true; };
  try {
    return { cfg: loadRunnerConfigFromDir(dir), stderr: stderr.join('') };
  } finally {
    process.stderr.write = prevWrite;
    process.env.HOME = prevHome;
    if (prevUserProfile !== undefined) process.env.USERPROFILE = prevUserProfile;
    else delete process.env.USERPROFILE;
  }
}

test('a project config may write a list and model@pool cells', () => {
  const { cfg } = loadWith({ claude: { standard: 'sonnet' }, deepseek: { standard: ['deepseek-v4@openrouter', 'deepseek-v4'] } });
  assert.deepEqual(cfg.modelPolicies.deepseek.standard, ['deepseek-v4@openrouter', 'deepseek-v4']);
});

test('a project config with a malformed cell fails to load and names the cell', () => {
  assert.throws(() => loadWith({ claude: { standard: [] } }), /modelPolicies\.claude\.standard/);
  assert.throws(() => loadWith({ claude: { standard: 'sonnet@' } }), /no pool/);
});

test('the global config keeps plain strings but drops list and model@pool cells, naming each once', () => {
  // Every fgOS release on the machine reads the global config; an older one fails on a list.
  const { cfg, stderr } = loadWith(
    { claude: { standard: 'sonnet' } },
    { claude: { advanced: 'opus', flagship: ['opus@vertex', 'opus'] }, deepseek: { standard: 'deepseek-v4@openrouter' } },
  );
  assert.equal(cfg.modelPolicies.claude.standard, 'sonnet');
  assert.equal(cfg.modelPolicies.claude.advanced, 'opus');
  assert.equal(cfg.modelPolicies.claude.flagship, undefined);
  assert.equal(cfg.modelPolicies.deepseek?.standard, undefined);
  assert.match(stderr, /runner\.modelPolicies\.claude\.flagship/);
  assert.match(stderr, /runner\.modelPolicies\.deepseek\.standard/);
});

function bindConfig(cell) {
  return {
    modelPolicies: { f: { standard: cell } },
    defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } },
    capabilities: { work: { prefer: [{ executor: 'fam' }] } },
    executors: {
      fam: { kind: 'agent', providerModel: 'f', command: 'fam', invocations: [{ id: 'fam-cli', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' } }] },
    },
  };
}

const ask = { unit: { id: 'u', capability: 'work', writes: [], rigor: 'standard' }, role: 'reviewer' };
const headless = { session: { herdrPresent: false, hasNativeAgent: false } };

test('bind skips an entry whose pool has no account and runs the next entry served by the family pool', () => {
  const result = bind(ask, { runnerConfig: bindConfig(['x@other', 'y']), ...headless });
  assert.ok(!result.refused, JSON.stringify(result.refused));
  assert.equal(result.model, 'y');
});

test('bind never runs an entry whose pool nothing can pay for, even when it is the only one', () => {
  // The pool declares no account in either inventory and is not the family-named pool.
  const result = bind(ask, { runnerConfig: bindConfig('x@other'), ...headless });
  assert.notEqual(result.model, 'x');
  assert.notEqual(result.model, 'x@other');
});

// ---- the {model, pool?, effort?} object form ----------------------------------------------------

test('an object cell names a model, and optionally a pool and a reasoning effort', () => {
  assert.deepEqual(parseTierCell({ model: 'sonnet' }, 'claude'), [{ model: 'sonnet', pool: 'claude', explicitPool: false }]);
  assert.deepEqual(parseTierCell({ model: 'sonnet', effort: 'high' }, 'claude'), [{ model: 'sonnet', pool: 'claude', explicitPool: false, effort: 'high' }]);
  assert.deepEqual(
    parseTierCell({ model: 'deepseek-v4', pool: 'openrouter', effort: 'max' }, 'deepseek'),
    [{ model: 'deepseek-v4', pool: 'openrouter', explicitPool: true, effort: 'max' }],
  );
});

test('an object cell takes its model literally, so a model id with "@" is not split', () => {
  assert.deepEqual(parseTierCell({ model: 'claude-opus-4@20250514', pool: 'vertex' }, 'claude'), [
    { model: 'claude-opus-4@20250514', pool: 'vertex', explicitPool: true },
  ]);
});

test('a list may mix strings and objects and keeps its order', () => {
  assert.deepEqual(parseTierCell([{ model: 'm1', effort: 'low' }, 'm2@pool', 'm3'], 'fam'), [
    { model: 'm1', pool: 'fam', explicitPool: false, effort: 'low' },
    { model: 'm2', pool: 'pool', explicitPool: true },
    { model: 'm3', pool: 'fam', explicitPool: false },
  ]);
});

test('an object cell with no model, an unknown key, an empty pool or an effort outside the vocabulary is refused', () => {
  assert.throws(() => parseTierCell({ effort: 'high' }, 'claude'), /"model"/);
  assert.throws(() => parseTierCell({ model: '' }, 'claude'), /"model"/);
  assert.throws(() => parseTierCell({ model: 'sonnet', thinking: 'high' }, 'claude'), /unknown key "thinking"/);
  assert.throws(() => parseTierCell({ model: 'sonnet', pool: ' ' }, 'claude'), /"pool"/);
  for (const effort of ['xhigh', 'minimal', 'off', 7, '']) {
    assert.throws(() => parseTierCell({ model: 'sonnet', effort }, 'claude'), /"effort" must be one of low\/medium\/high\/max/);
  }
});

test('an object cell counts as extended, so a release that reads one model string cannot take it', () => {
  assert.equal(isExtendedTierCell({ model: 'sonnet' }), true);
  assert.equal(isExtendedTierCell(null), false);
});

test('an object cell\'s effort reaches the binding as the cell\'s promise, and supportsPolicyTier sees the cell', () => {
  const cfg = { modelPolicies: { claude: { advanced: [{ model: 'opus', effort: 'high' }, 'sonnet'] } } };
  assert.equal(supportsPolicyTier(cfg, 'claude', 'advanced'), true);
  const runnerConfig = bindConfig([{ model: 'opus', effort: 'high' }, 'sonnet']);
  runnerConfig.executors.fam.command = 'claude';
  const result = bind(ask, { runnerConfig, ...headless });
  assert.ok(!result.refused, JSON.stringify(result.refused));
  assert.equal(result.model, 'opus');
  assert.equal(result.reasoningEffort, 'high');
  assert.deepEqual(result.provenance.reasoningEffort, { value: 'high', source: 'cell' });
});

test('a project config may write object cells; a bad one fails to load and names the cell', () => {
  const { cfg } = loadWith({ claude: { standard: 'sonnet', advanced: { model: 'opus', effort: 'high' } } });
  assert.deepEqual(cfg.modelPolicies.claude.advanced, { model: 'opus', effort: 'high' });
  assert.throws(() => loadWith({ claude: { advanced: { model: 'opus', effort: 'xhigh' } } }), /modelPolicies\.claude\.advanced.*effort/);
  assert.throws(() => loadWith({ claude: { advanced: { effort: 'high' } } }), /modelPolicies\.claude\.advanced.*model/);
});

test('the global config drops an object cell like a list cell, naming it once', () => {
  const { cfg, stderr } = loadWith(
    { claude: { standard: 'sonnet' } },
    { claude: { advanced: 'opus', frontier: { model: 'opus', effort: 'high' } } },
  );
  assert.equal(cfg.modelPolicies.claude.advanced, 'opus');
  assert.equal(cfg.modelPolicies.claude.frontier, undefined);
  assert.match(stderr, /runner\.modelPolicies\.claude\.frontier/);
});

test('bind runs the model of an object cell like the model of a string cell', () => {
  const result = bind(ask, { runnerConfig: bindConfig({ model: 'm-obj' }), ...headless });
  assert.ok(!result.refused, JSON.stringify(result.refused));
  assert.equal(result.model, 'm-obj');
});
