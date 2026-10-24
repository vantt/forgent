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
  // The standard alone has one executor per family.
  const one = runCheck('executor-family-unique', {});
  assert.equal(one.passed, true, one.message);

  // A project executor of the family the standard's `claude` already serves is named beside it.
  const two = runCheck('executor-family-unique', { executors: { 'claude-herdr': agent('claude') } });
  assert.equal(two.passed, false, two.message);
  assert.match(two.message, /claude \(claude-herdr, claude\)/);
});

test('executor-skills-installed passes when the declared skill is installed and fails naming the missing path', () => {
  // The standard's executors declare the skill, one skill directory per CLI they run through.
  const install = (...dirs) => (dir) => { for (const d of dirs) { fs.mkdirSync(path.join(dir, d, 'ak-cook'), { recursive: true }); fs.writeFileSync(path.join(dir, d, 'ak-cook', 'SKILL.md'), '# ak:cook\n'); } };
  const standardDirs = ['.claude/skills', '.agents/skills', '.pi/skills'];
  const missing = runCheck('executor-skills-installed', {});
  assert.equal(missing.passed, false);
  assert.match(missing.message, /claude declares ak:cook but \.claude\/skills\/ak-cook\/SKILL\.md is missing/);

  // The directory follows each invocation's CLI: every invocation of the executor must have the skill.
  const twoClis = { multi: { ...agent('openai', 'codex'), supports: { skills: ['ak:cook'] }, invocations: [
    { id: 'codex-cli', via: 'cli', adapter: 'cli-spawn', command: 'codex', args: ['{prompt}'] },
    { id: 'omp-cli', via: 'cli', adapter: 'cli-spawn', command: 'omp', args: ['{prompt}'] },
    { id: 'odd-cli', via: 'cli', adapter: 'cli-spawn', command: 'odd', args: ['{prompt}'] },
  ] } };
  const partial = runCheck('executor-skills-installed', { executors: twoClis }, undefined, install(...standardDirs));
  assert.equal(partial.passed, false);
  assert.match(partial.message, /\.omp\/skills\/ak-cook\/SKILL\.md is missing/);
  assert.doesNotMatch(partial.message, /\.agents\/skills/);
  const both = runCheck('executor-skills-installed', { executors: twoClis }, undefined, install(...standardDirs, '.omp/skills'));
  assert.equal(both.passed, true, both.message);
  assert.match(both.message, /not checked, no known skill directory: multi \(cli odd\)/);
});

test('model-policy-pools is quiet without a named pool and warns about a pool runner.llmAccounts lacks', () => {
  // The standard's cells name the thehive and openrouter pools: with both declared nothing is left to warn about.
  const pools = { thehive: { shared: { credentialStore: { pi: '/srv/pi-thehive' } } }, openrouter: { shared: { credentialStore: { pi: '/srv/pi-openrouter' } } } };
  const plain = runCheck('model-policy-pools', {}, { llmAccounts: pools });
  assert.equal(plain.passed, true);
  assert.doesNotMatch(plain.message, /warning/);

  const policies = { claude: { standard: 'sonnet' }, deepseek: { standard: ['deepseek-v4@openrouter', 'deepseek-v4'] } };
  const missing = runCheck('model-policy-pools', { modelPolicies: policies });
  assert.equal(missing.passed, true);
  assert.match(missing.message, /^warning: .*deepseek\.standard@openrouter/);

  const declared = runCheck('model-policy-pools', { modelPolicies: policies }, { llmAccounts: pools });
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

  const alias = runCheck('llm-accounts-shape', { executors: { 'fx-openai': agent('openai', 'codex') } }, { llmAccounts: { codex: { a: { credentialStore: { codex: '/x' } } } } });
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

test('tier-fallback passes the list of the standard, passes a served list of all six tiers, and warns about a family the walk would skip', () => {
  // The standard declares the walk order of every tier.
  const none = runCheck('tier-fallback', {});
  assert.equal(none.passed, true);
  assert.match(none.message, /declares the walk order of 6 tier\(s\)/);

  const executors = { 'fx-claude': agent('claude'), 'fx-gemini': agent('gemini', 'agy') };
  const tiers = ['nano', 'mini', 'standard', 'advanced', 'flagship', 'frontier'];
  const cells = Object.fromEntries(tiers.map((tier) => [tier, 'm']));
  const modelPolicies = { claude: cells, gemini: cells };
  const served = runCheck('tier-fallback', { executors, modelPolicies, tierFallback: Object.fromEntries(tiers.map((tier) => [tier, ['gemini', 'claude']])) });
  assert.equal(served.passed, true);
  assert.match(served.message, /declares the walk order of 6 tier\(s\): nano, mini, standard, advanced, flagship, frontier/);

  const skipped = runCheck('tier-fallback', { executors, modelPolicies: { claude: { advanced: 'sonnet' }, gemini: { advanced: 'gemini-flash' } }, tierFallback: { advanced: ['gemini', 'nofamily', 'claude'], flagship: ['nofamily'] } });
  assert.equal(skipped.passed, true);
  assert.match(skipped.message, /advanced: nofamily has no modelPolicies cell at advanced/);
  assert.match(skipped.message, /flagship: nofamily has no modelPolicies cell at flagship/);

  const unserved = runCheck('tier-fallback', { modelPolicies: { orphan: { advanced: 'orphan-model' } }, tierFallback: { advanced: ['orphan'] } });
  assert.match(unserved.message, /advanced: no agent executor serves orphan/);
});
