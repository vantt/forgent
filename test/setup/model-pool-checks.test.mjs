// Doctor checks for the model / pool / account config, each driven through the doctor registry
// against a real project directory and a fake home holding the global config.

import '../helpers/process-tmp-root.mjs';
import { assert, checkById, fs, mkTemp, path, withHome } from './helpers/setup-checks-harness.mjs';
import { test } from 'node:test';
import { writeAccountsFile, writeGlobalConfig, writeProjectConfig } from '../helpers/config-fixture.mjs';

function agent(providerModel, command = providerModel) {
  return { kind: 'agent', providerModel, command, args: ['{prompt}'], invocations: [{ id: `${command}-cli`, via: 'cli', adapter: 'cli-spawn', command, args: ['{prompt}'] }] };
}

/** Run one check with `runner` as the project runner section and `globalRunner` as the machine's: its account pools go to the accounts file, the rest to the global config. */
function runCheck(id, runner, globalRunner, setup) {
  const dir = mkTemp('model-pool-check-');
  const home = mkTemp('model-pool-check-home-');
  try {
    fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
    writeProjectConfig(dir, {
      runner: {
        executor: { command: 'claude', args: ['{prompt}'] },
        timeoutMs: 5000,
        defaults: { tier: 'standard' },
        patterns: { seatBinding: { schema: 1 } },
        modelPolicies: { claude: { standard: 'sonnet' } },
        ...runner,
      },
    });
    setup?.(dir);
    if (globalRunner) {
      fs.mkdirSync(path.join(home, '.fgos'), { recursive: true });
      const { llmAccounts, providers, ...rest } = globalRunner;
      const accounts = { ...(llmAccounts ? { llmAccounts } : {}), ...(providers ? { providers } : {}) };
      if (Object.keys(accounts).length > 0) writeAccountsFile(path.join(home, '.fgos'), accounts);
      if (Object.keys(rest).length > 0) writeGlobalConfig(home, { runner: rest });
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
  assert.equal(two.passed, false, two.message);
  assert.match(two.message, /claude \(claude, claude-herdr\)/);
});

test('executor-skills-installed passes when the declared skill is installed and fails naming the missing path', () => {
  const executors = { claude: { ...agent('claude'), supports: { skills: ['ak:cook'] } }, openai: agent('openai', 'codex') };
  const missing = runCheck('executor-skills-installed', { executors });
  assert.equal(missing.passed, false);
  assert.match(missing.message, /claude declares ak:cook but \.claude\/skills\/ak-cook\/SKILL\.md is missing/);

  const installed = runCheck('executor-skills-installed', { executors }, undefined, (dir) => {
    fs.mkdirSync(path.join(dir, '.claude', 'skills', 'ak-cook'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.claude', 'skills', 'ak-cook', 'SKILL.md'), '# ak:cook\n');
  });
  assert.equal(installed.passed, true, installed.message);
  assert.match(installed.message, /1 declared executor skill/);

  const none = runCheck('executor-skills-installed', { executors: { claude: agent('claude') } });
  assert.equal(none.passed, true);

  // The directory follows each invocation's CLI: every invocation of the executor must have the skill.
  const twoClis = { multi: { ...agent('openai', 'codex'), supports: { skills: ['ak:cook'] }, invocations: [
    { id: 'codex-cli', via: 'cli', adapter: 'cli-spawn', command: 'codex', args: ['{prompt}'] },
    { id: 'omp-cli', via: 'cli', adapter: 'cli-spawn', command: 'omp', args: ['{prompt}'] },
    { id: 'odd-cli', via: 'cli', adapter: 'cli-spawn', command: 'odd', args: ['{prompt}'] },
  ] } };
  const install = (...dirs) => (dir) => { for (const d of dirs) { fs.mkdirSync(path.join(dir, d, 'ak-cook'), { recursive: true }); fs.writeFileSync(path.join(dir, d, 'ak-cook', 'SKILL.md'), '# ak:cook\n'); } };
  const partial = runCheck('executor-skills-installed', { executors: twoClis }, undefined, install('.agents/skills'));
  assert.equal(partial.passed, false);
  assert.match(partial.message, /\.omp\/skills\/ak-cook\/SKILL\.md is missing/);
  assert.doesNotMatch(partial.message, /\.agents\/skills/);
  const both = runCheck('executor-skills-installed', { executors: twoClis }, undefined, install('.agents/skills', '.omp/skills'));
  assert.equal(both.passed, true, both.message);
  assert.match(both.message, /not checked, no known skill directory: multi \(cli odd\)/);
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
  // The config door refuses the inventory in a project file by name before this row reads it; the row reports no refusal of its own.
  assert.match(inProject.message, /config-key-in-wrong-file .*runner\.llmAccounts/);

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

test('global-model-policies-portable fails on a list, model@pool or object cell in the global config', () => {
  const plain = runCheck('global-model-policies-portable', {}, { modelPolicies: { claude: { advanced: 'opus' } } });
  assert.equal(plain.passed, true);

  const extended = runCheck('global-model-policies-portable', {}, { modelPolicies: { claude: { advanced: ['opus@vertex', 'opus'] }, deepseek: { standard: 'deepseek-v4@openrouter' }, gemini: { flagship: { model: 'gemini-pro', effort: 'high' } } } });
  assert.equal(extended.passed, false);
  assert.match(extended.message, /claude\.advanced, deepseek\.standard, gemini\.flagship/);
});

test('tier-fallback is quiet without a list, passes a served list of all six tiers, and warns about a missing tier or a family the walk would skip', () => {
  const none = runCheck('tier-fallback', {});
  assert.equal(none.passed, true);
  assert.match(none.message, /not declared/);

  const executors = { claude: agent('claude'), gemini: agent('gemini', 'agy') };
  const tiers = ['nano', 'mini', 'standard', 'advanced', 'flagship', 'frontier'];
  const cells = Object.fromEntries(tiers.map((tier) => [tier, 'm']));
  const modelPolicies = { claude: cells, gemini: cells };
  const served = runCheck('tier-fallback', { executors, modelPolicies, tierFallback: Object.fromEntries(tiers.map((tier) => [tier, ['gemini', 'claude']])) });
  assert.equal(served.passed, true);
  assert.match(served.message, /declares the walk order of 6 tier\(s\): nano, mini, standard, advanced, flagship, frontier/);

  const partial = runCheck('tier-fallback', { executors, modelPolicies, tierFallback: { advanced: ['gemini', 'claude'] } });
  assert.equal(partial.passed, true);
  assert.match(partial.message, /^warning: .*mini: no list, so a seat at mini has no walk after a failure/);
  assert.doesNotMatch(partial.message, /advanced: no list/);

  const skipped = runCheck('tier-fallback', { executors, modelPolicies: { claude: { advanced: 'sonnet' }, gemini: { advanced: 'gemini-flash' } }, tierFallback: { advanced: ['gemini', 'z-ai', 'claude'], flagship: ['claude'] } });
  assert.equal(skipped.passed, true);
  assert.match(skipped.message, /advanced: z-ai has no modelPolicies cell at advanced/);
  assert.match(skipped.message, /flagship: claude has no modelPolicies cell at flagship/);

  const unserved = runCheck('tier-fallback', { executors: { claude: agent('claude') }, modelPolicies: { claude: { advanced: 'sonnet' }, gemini: { advanced: 'gemini-flash' } }, tierFallback: { advanced: ['gemini'] } });
  assert.match(unserved.message, /advanced: no agent executor serves gemini/);
});
