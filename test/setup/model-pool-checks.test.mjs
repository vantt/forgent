// Doctor checks for the model / pool / account config, each driven through the doctor registry
// against a real project directory and a fake home holding the global config.

import '../helpers/process-tmp-root.mjs';
import { assert, checkById, fs, mkTemp, path, withHome } from './helpers/setup-checks-harness.mjs';
import { test } from 'node:test';

const RIGOR_TO_TIER = { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' };

function agent(providerModel, command = providerModel) {
  return { kind: 'agent', providerModel, command, args: ['{prompt}'], invocations: [{ id: `${command}-cli`, via: 'cli', adapter: 'cli-spawn', command, args: ['{prompt}'] }] };
}

/** Run one check with `runner` as the project runner section and `globalRunner` as the global one. */
function runCheck(id, runner, globalRunner) {
  const dir = mkTemp('model-pool-check-');
  const home = mkTemp('model-pool-check-home-');
  try {
    fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.fgos', 'config.json'), JSON.stringify({
      runner: {
        executor: { command: 'claude', args: ['{prompt}'] },
        timeoutMs: 5000,
        rigorToTier: RIGOR_TO_TIER,
        modelPolicies: { claude: { standard: 'sonnet' } },
        ...runner,
      },
    }));
    if (globalRunner) {
      fs.mkdirSync(path.join(home, '.fgos'), { recursive: true });
      fs.writeFileSync(path.join(home, '.fgos', 'config.json'), JSON.stringify({ runner: globalRunner }));
    }
    return withHome(home, () => checkById(id).check(dir));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
  }
}

test('executor-family-unique passes with one executor per family and names both executors of a shared family', () => {
  const one = runCheck('executor-family-unique', { executors: { claude: agent('claude'), openai: agent('openai', 'codex') } });
  assert.equal(one.passed, true, one.message);

  const two = runCheck('executor-family-unique', { executors: { claude: agent('claude'), 'claude-herdr': agent('claude') } });
  assert.equal(two.passed, false);
  assert.match(two.message, /claude \(claude, claude-herdr\)/);
});

test('model-policy-pools is quiet without a named pool and warns about a pool runner.llmAccounts lacks', () => {
  const plain = runCheck('model-policy-pools', {});
  assert.equal(plain.passed, true);
  assert.match(plain.message, /no tier cell names a pool/);

  const policies = { claude: { standard: 'sonnet' }, deepseek: { standard: ['deepseek-v4@openrouter', 'deepseek-v4'] } };
  const missing = runCheck('model-policy-pools', { modelPolicies: policies });
  assert.equal(missing.passed, true);
  assert.match(missing.message, /^warning: .*deepseek\.standard@openrouter/);

  const declared = runCheck('model-policy-pools', { modelPolicies: policies }, { llmAccounts: { openrouter: { shared: { credentialStore: { pi: '/srv/pi-openrouter' } } } } });
  assert.equal(declared.passed, true);
  assert.doesNotMatch(declared.message, /warning/);
});

test('llm-accounts-shape passes on a valid global inventory and fails on one in the project config', () => {
  const inventory = { openai: { tetnu: { credentialStore: { codex: '/srv/codex-tetnu' } } } };
  const ok = runCheck('llm-accounts-shape', {}, { llmAccounts: inventory });
  assert.equal(ok.passed, true, ok.message);
  assert.match(ok.message, /1 accounts in 1 pools/);

  const inProject = runCheck('llm-accounts-shape', { llmAccounts: inventory });
  assert.equal(inProject.passed, false);
  assert.match(inProject.message, /machine-wide/);

  const alias = runCheck('llm-accounts-shape', { executors: { openai: agent('openai', 'codex') } }, { llmAccounts: { codex: { a: { credentialStore: { codex: '/x' } } } } });
  assert.equal(alias.passed, false);
  assert.match(alias.message, /family "openai"/);
});

test('llm-accounts-vs-legacy compares only once runner.llmAccounts exists, and warns on what differs', () => {
  const legacy = { providers: { gemini: { accounts: { tetcu72: { credentialSources: { omp: { kind: 'home-files', home: '/srv/omp-tetcu72', files: ['auth.json'] } } } } } } };
  const notDeclared = runCheck('llm-accounts-vs-legacy', {}, legacy);
  assert.equal(notDeclared.passed, true);
  assert.match(notDeclared.message, /nothing to compare/);

  const same = runCheck('llm-accounts-vs-legacy', {}, { ...legacy, llmAccounts: { gemini: { tetcu72: { credentialStore: { omp: '/srv/omp-tetcu72' } } } } });
  assert.equal(same.passed, true);
  assert.match(same.message, /matches/);

  const differ = runCheck('llm-accounts-vs-legacy', {}, { ...legacy, llmAccounts: { gemini: { other: { credentialStore: { omp: '/srv/omp-other' } } } } });
  assert.equal(differ.passed, true);
  assert.match(differ.message, /^warning: .*only in runner\.providers: gemini\/tetcu72.*only in runner\.llmAccounts: gemini\/other/);
});

test('global-model-policies-portable fails on a list or model@pool cell in the global config', () => {
  const plain = runCheck('global-model-policies-portable', {}, { modelPolicies: { claude: { advanced: 'opus' } } });
  assert.equal(plain.passed, true);

  const extended = runCheck('global-model-policies-portable', {}, { modelPolicies: { claude: { advanced: ['opus@vertex', 'opus'] }, deepseek: { standard: 'deepseek-v4@openrouter' } } });
  assert.equal(extended.passed, false);
  assert.match(extended.message, /claude\.advanced, deepseek\.standard/);
});

test('capability-rigor-ceiling names a capability whose rigor lifts it above runner.maxTier, with its model', () => {
  const runner = {
    maxTier: 'advanced',
    executors: { claude: agent('claude') },
    modelPolicies: { claude: { standard: 'sonnet', advanced: 'sonnet', flagship: 'opus', frontier: 'fable' } },
    capabilities: {
      synthesize: { prefer: ['claude'], rigor: 'critical' },
      implement: { prefer: ['claude'], rigor: 'standard' },
    },
  };
  const lifted = runCheck('capability-rigor-ceiling', runner);
  assert.equal(lifted.passed, true);
  assert.match(lifted.message, /synthesize \(rigor critical\) runs at frontier: claude fable/);
  assert.doesNotMatch(lifted.message, /implement/);

  const none = runCheck('capability-rigor-ceiling', { ...runner, maxTier: 'frontier' });
  assert.match(none.message, /no capability rigor lifts a seat above runner\.maxTier frontier/);

  const unset = runCheck('capability-rigor-ceiling', { ...runner, maxTier: undefined });
  assert.match(unset.message, /runner\.maxTier not set/);
});
