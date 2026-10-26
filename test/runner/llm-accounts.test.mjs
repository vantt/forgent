// runner.llmAccounts.<pool>.<account>.credentialStore.<cli> is the machine's account inventory.
// The reader reports what is wrong instead of throwing, and can be set against the old
// runner.providers.<provider>.accounts inventory the lease still reads.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { readLlmAccounts, compareWithLegacyInventory, legacyStateKey } from '../../src/runner/dispatch/llm-accounts.mjs';

const home = os.homedir();
const families = {
  modelPolicies: { claude: {}, openai: {}, gemini: {}, 'z-ai': {} },
  executors: { glm: { providerModel: 'z-ai' } },
};
const codes = (result) => result.problems.map((p) => p.code);

test('a valid inventory reads every account with its stores expanded', () => {
  const result = readLlmAccounts({
    ...families,
    llmAccounts: {
      openai: {
        tetnu: { credentialStore: { codex: '${HOME}/.codex-tetnu', pi: '~/.pi/accounts/openai-tetnu' }, label: 'openai/tetnu' },
        spare: { credentialStore: { codex: '/srv/codex-spare' }, disabled: true },
      },
      openrouter: { shared: { credentialStore: { pi: '$HOME/.pi/accounts/openrouter' } } },
    },
  });
  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.pools.openai.accounts.tetnu, {
    label: 'openai/tetnu',
    disabled: false,
    stores: { codex: path.join(home, '.codex-tetnu'), pi: path.join(home, '.pi/accounts/openai-tetnu') },
  });
  assert.equal(result.pools.openai.accounts.spare.disabled, true);
  assert.equal(result.pools.openai.accounts.spare.label, 'spare');
  assert.deepEqual(result.pools.openrouter.accounts.shared.stores, { pi: path.join(home, '.pi/accounts/openrouter') });
});

test('no inventory reads as no pools and no problems', () => {
  assert.deepEqual(readLlmAccounts(families), { pools: {}, problems: [] });
});

test('a pool name with "@" is refused, since "@" separates model and pool in a tier cell', () => {
  const result = readLlmAccounts({ ...families, llmAccounts: { 'open@router': { a: { credentialStore: { pi: '/x' } } } } });
  assert.deepEqual(codes(result), ['pool-name-at']);
  assert.deepEqual(result.pools, {});
});

test('another spelling of a family is refused and names the family to use', () => {
  const result = readLlmAccounts({
    ...families,
    llmAccounts: {
      codex: { a: { credentialStore: { codex: '/x' } } },
      'openai-codex': { a: { credentialStore: { codex: '/x' } } },
      glm: { a: { credentialStore: { pi: '/x' } } },
      agy: { a: { credentialStore: { omp: '/x' } } },
    },
  });
  assert.deepEqual(codes(result), ['pool-name-alias', 'pool-name-alias', 'pool-name-alias', 'pool-name-alias']);
  assert.match(result.problems[0].detail, /family "openai"/);
  assert.match(result.problems[2].detail, /family "z-ai"/);
  assert.match(result.problems[3].detail, /family "gemini"/);
});

test('an account with no store, a store that is not a path, and unknown keys are reported', () => {
  const result = readLlmAccounts({
    ...families,
    llmAccounts: {
      openai: {
        empty: { credentialStore: {} },
        bare: { label: 'no store' },
        number: { credentialStore: { codex: 42 } },
        relative: { credentialStore: { codex: 'codex-home' } },
        extra: { credentialStore: { codex: '/x' }, model: 'gpt' },
      },
    },
  });
  assert.deepEqual(codes(result), ['account-no-store', 'account-no-store', 'store-path', 'account-no-store', 'store-path', 'account-no-store', 'account-unknown-key']);
  assert.deepEqual(Object.keys(result.pools.openai.accounts), ['extra']);
});

test('the old state key of a pool is its normalized family', () => {
  assert.equal(legacyStateKey('openai'), 'openai-codex');
  assert.equal(legacyStateKey('gemini'), 'gemini');
  assert.equal(legacyStateKey('openrouter'), 'openrouter');
});

test('comparing with the old inventory lists accounts missing on either side and stores that differ', () => {
  const result = compareWithLegacyInventory({
    ...families,
    providers: {
      openai: {
        accounts: {
          tetnu: { credentialSources: { codex: { kind: 'codex-home', home: '${HOME}/.codex-tetnu' } } },
          tetcu72: { credentialSources: { codex: { kind: 'codex-home', home: '${HOME}/.codex-tetcu72' } } },
        },
      },
      'z-ai': { accounts: { openrouter: { credentialSource: { kind: 'home-files', home: '${HOME}/.pi/accounts/openrouter', files: ['auth.json'] } } } },
    },
    llmAccounts: {
      openai: {
        tetnu: { credentialStore: { codex: '${HOME}/.codex-tetnu' } },
        tetcu72: { credentialStore: { codex: '${HOME}/.codex-other' } },
        fresh: { credentialStore: { codex: '${HOME}/.codex-fresh' } },
      },
      'z-ai': { openrouter: { credentialStore: { pi: '${HOME}/.pi/accounts/openrouter', omp: '${HOME}/.pi/accounts/openrouter' } } },
    },
  });
  assert.deepEqual(result.problems, []);
  assert.deepEqual(result.onlyLegacy, []);
  assert.deepEqual(result.onlyNew, [{ pool: 'openai', account: 'fresh' }]);
  assert.deepEqual(result.storeMismatch.map((m) => `${m.pool}/${m.account}`), ['openai/tetcu72']);
});

test('an old account the new inventory does not carry is listed under its old provider key', () => {
  const result = compareWithLegacyInventory({
    ...families,
    providers: { gemini: { accounts: { tetcu72: { credentialSources: { omp: { kind: 'home-files', home: '/x', files: ['a'] } } } } } },
  });
  assert.deepEqual(result.onlyLegacy, [{ pool: 'gemini', account: 'tetcu72' }]);
  assert.deepEqual(result.onlyNew, []);
});
