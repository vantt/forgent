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
import { resolveTierModel, resolveTierCandidates } from '../../src/runner/dispatch/resolve.mjs';
import { loadRunnerConfigFromDir, supportsPolicyTier, RunnerConfigError } from '../../src/runner/dispatch/config.mjs';
import { bind } from '../../src/runner/execution/bind.mjs';
import { seedFileLocalBwrapRegistry } from './confinement-registry-fixture.helper.mjs';

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

test('resolveTierModel returns the first entry, unchanged for a plain string, whichever pool serves it', () => {
  assert.equal(resolveTierModel(policies, 'standard', 'claude'), 'sonnet');
  assert.equal(resolveTierModel(policies, 'standard', 'deepseek'), 'deepseek-v4');
  assert.equal(resolveTierModel(policies, 'advanced', 'deepseek'), 'deepseek-v4-pro');
});

test('resolveTierModel refuses a tier the family has no cell for', () => {
  assert.throws(() => resolveTierModel(policies, 'nano', 'deepseek'), (err) => {
    assert.ok(err instanceof RunnerConfigError);
    assert.match(err.message, /no model configured for tier "nano"/);
    return true;
  });
});

test('resolveTierCandidates lists every entry, other pools included', () => {
  assert.deepEqual(resolveTierCandidates(policies, 'standard', 'deepseek').map((e) => `${e.model}@${e.pool}`), [
    'deepseek-v4@openrouter',
    'deepseek-v4-std@deepseek',
  ]);
});

test('supportsPolicyTier answers what resolveTierModel would do, without throwing', () => {
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
  fs.writeFileSync(
    path.join(dir, '.fgos', 'config.json'),
    JSON.stringify({ runner: { executor: { command: 'claude', args: ['{prompt}'] }, timeoutMs: 5000, modelPolicies: projectPolicies, rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' } } }),
  );
  if (globalPolicies) fs.writeFileSync(path.join(home, '.fgos', 'config.json'), JSON.stringify({ runner: { modelPolicies: globalPolicies } }));
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
    rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
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
  assert.doesNotMatch(result.provenance?.model?.source ?? '', /resolveTierModel/);
});
