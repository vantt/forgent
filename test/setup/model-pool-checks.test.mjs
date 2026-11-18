// Doctor checks for the model / pool / account config, each driven through the doctor registry
// against a real project directory and a fake home holding the global config.

import '../helpers/process-tmp-root.mjs';
import { assert, checkById, fs, mkTemp, path, withHome } from './helpers/setup-checks-harness.mjs';
import { test } from 'node:test';
import os from 'node:os';
import { moveMachineKeysTo, writeAccountsFile, writeGlobalConfig, writeProjectConfig } from '../helpers/config-fixture.mjs';
import { seedStubAgentClis } from '../helpers/agent-clis.mjs';
import { credentialSourceForCli, providerAccountInventory } from '../../src/runner/dispatch/provider-capacity.mjs';

// The executors these checks judge name these CLIs; a CLI the machine lacks is skipped, so each is stated installed.
seedStubAgentClis('claude', 'codex', 'omp', 'pi', 'agy', 'odd');

function agent(providerModel, command = providerModel) {
  return { kind: 'agent', providerModel,   invocations: [{ id: `${command}-cli`, via: 'cli', adapter: 'cli-spawn', command, args: ['{prompt}'] }] };
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
    setup?.(dir, home);
    if (globalRunner) {
      fs.mkdirSync(path.join(home, '.fgos'), { recursive: true });
      const { llmAccounts, providers, ...rest } = globalRunner;
      const accounts = { ...(llmAccounts ? { llmAccounts } : {}), ...(providers ? { providers } : {}) };
      if (Object.keys(accounts).length > 0) writeAccountsFile(path.join(home, '.fgos'), accounts);
      if (Object.keys(rest).length > 0) writeGlobalConfig(home, { runner: rest });
    }
    moveMachineKeysTo(dir, home);
    return withHome(home, () => checkById(id).check(dir));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
  }
}

/** The shipped standard names no kit skill; a machine declares the cook skill for the executors that load it. */
const declared = { executors: Object.fromEntries(['claude', 'glm', 'openai', 'gemini', 'xai', 'deepseek'].map((id) => [id, { supports: { skills: ['ak:cook'] } }])) };

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
  // The machine's executors declare the skill, one skill directory per CLI they run through.
  const install = (...dirs) => (dir) => { for (const d of dirs) { fs.mkdirSync(path.join(dir, d, 'ak-cook'), { recursive: true }); fs.writeFileSync(path.join(dir, d, 'ak-cook', 'SKILL.md'), '# ak:cook\n'); } };
  const standardDirs = ['.claude/skills', '.agents/skills', '.pi/skills'];
  const missing = runCheck('executor-skills-installed', declared);
  assert.equal(missing.passed, false);
  assert.match(missing.message, /claude declares ak:cook but \.claude\/skills\/ak-cook\/SKILL\.md is missing/);

  // The directory follows each invocation's CLI: every invocation of the executor must have the skill.
  const twoClis = { multi: { ...agent('openai', 'codex'), supports: { skills: ['ak:cook'] }, invocations: [
    { id: 'codex-cli', via: 'cli', adapter: 'cli-spawn', command: 'codex', args: ['{prompt}'] },
    { id: 'omp-cli', via: 'cli', adapter: 'cli-spawn', command: 'omp', args: ['{prompt}'] },
    { id: 'odd-cli', via: 'cli', adapter: 'cli-spawn', command: 'odd', args: ['{prompt}'] },
  ] } };
  const partial = runCheck('executor-skills-installed', { executors: { ...declared.executors, ...twoClis } }, undefined, install(...standardDirs));
  assert.equal(partial.passed, false);
  assert.match(partial.message, /\.omp\/skills\/ak-cook\/SKILL\.md is missing/);
  assert.doesNotMatch(partial.message, /\.agents\/skills/);
  const both = runCheck('executor-skills-installed', { executors: { ...declared.executors, ...twoClis } }, undefined, install(...standardDirs, '.omp/skills'));
  assert.equal(both.passed, true, both.message);
  assert.match(both.message, /not checked, no known skill directory: gemini \(cli agy\), multi \(cli odd\)/);
});

test('executor-skills-installed skips an executor whose CLI is not installed instead of failing it', () => {
  const emptyPath = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-skills-no-cli-'));
  const savedPath = process.env.PATH;
  try {
    process.env.PATH = emptyPath;
    const result = runCheck('executor-skills-installed', declared);
    assert.equal(result.passed, true, result.message);
    assert.match(result.message, /skipped, CLI not installed: .*claude \(cli claude\)/);
  } finally {
    process.env.PATH = savedPath;
    fs.rmSync(emptyPath, { recursive: true, force: true });
  }
});

test('executor-skills-installed accepts a user-level skill, refuses an empty skill file, and says a worktree is provisioned separately', () => {
  const standardDirs = ['.claude/skills', '.agents/skills', '.pi/skills', '.omp/skills'];
  const put = (base, d, text) => { fs.mkdirSync(path.join(base, d, 'ak-cook'), { recursive: true }); fs.writeFileSync(path.join(base, d, 'ak-cook', 'SKILL.md'), text); };
  const projectOnly = (text) => (dir) => { for (const d of standardDirs) put(dir, d, text); };

  const userLevel = runCheck('executor-skills-installed', declared, undefined, (dir, home) => {
    projectOnly('# skill\n')(dir);
    fs.rmSync(path.join(dir, '.claude/skills'), { recursive: true });
    put(home, '.claude/skills', '# skill\n');
  });
  assert.equal(userLevel.passed, true, userLevel.message);

  const empty = runCheck('executor-skills-installed', declared, undefined, projectOnly(''));
  assert.equal(empty.passed, false);
  assert.match(empty.message, /\.claude\/skills\/ak-cook\/SKILL\.md is empty/);

  const missing = runCheck('executor-skills-installed', declared);
  assert.match(missing.message, /worktreeSetup provisioning/);
  assert.match(missing.message, /not a pass in a worktree/);
});

test('model-policy-pools is quiet without a named pool and warns about a pool runner.llmAccounts lacks', () => {
  // The standard's cells name only the openrouter pool: with it declared nothing is left to warn about.
  const pools = { openrouter: { shared: { credentialStore: { pi: '/srv/pi-openrouter' } } } };
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

test('llm-accounts-default-login-home warns for a store on a default login home of any CLI, never a private one, and never stops the account resolving', () => {
  // The row reads the user's home, which `withHome` points at the fake home, so the stores are built under it.
  const inFakeHome = (build) => {
    const dir = mkTemp('model-pool-check-');
    const fake = mkTemp('model-pool-check-home-');
    try {
      fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
      fs.mkdirSync(path.join(fake, '.fgos'), { recursive: true });
      for (const d of ['private-login', '.claude', '.codex']) fs.mkdirSync(path.join(fake, d), { recursive: true });
      fs.symlinkSync(path.join(fake, '.claude'), path.join(fake, 'linked-login'));
      const runner = { executor: { command: 'claude', args: ['{prompt}'] }, timeoutMs: 5000, defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } }, modelPolicies: { claude: { standard: 'sonnet' } } };
      const llmAccounts = build(fake);
      writeProjectConfig(dir, { runner });
      writeAccountsFile(path.join(fake, '.fgos'), { llmAccounts });
      moveMachineKeysTo(dir, fake);
      // The inventory every lease and bind reads, over the same pools: read-only, no state or login file is touched.
      const executors = { 'fx-claude': { kind: 'agent', providerModel: 'claude', invocations: [{ id: 'claude-cli', via: 'cli', adapter: 'cli-spawn', command: 'claude', args: ['{prompt}'], credentialStore: { use: 'claude', files: ['.credentials.json'] } }] } };
      const inventory = providerAccountInventory({ ...runner, executors, llmAccounts });
      return withHome(fake, () => ({ row: checkById('llm-accounts-default-login-home').check(dir), shape: checkById('llm-accounts-shape').check(dir), inventory, home: fake }));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
      fs.rmSync(fake, { recursive: true, force: true });
    }
  };
  const warned = inFakeHome((h) => ({
    claude: {
      onDefault: { credentialStore: { claude: path.join(h, '.claude') } },
      onPrivate: { credentialStore: { claude: path.join(h, 'private-login') } },
    },
    openai: { onCodex: { credentialStore: { codex: path.join(h, '.codex') } } },
  }));
  assert.equal(warned.row.passed, true, 'a warn row never fails');
  assert.match(warned.row.message, /^warning: /);
  assert.match(warned.row.message, /runner\.llmAccounts\.claude\.onDefault\.credentialStore\.claude/);
  assert.match(warned.row.message, /runner\.llmAccounts\.openai\.onCodex\.credentialStore\.codex/);
  assert.doesNotMatch(warned.row.message, /onPrivate/);
  assert.equal(warned.shape.passed, true);
  const onDefault = warned.inventory.claude.accounts.onDefault;
  assert.equal(onDefault.disabled, false, 'the account on the default login home is offered, not disabled');
  assert.equal(onDefault.unusableFor, undefined, 'the account on the default login home is not skipped for its CLI');
  assert.equal(credentialSourceForCli(onDefault, 'claude')?.home, path.join(warned.home, '.claude'), 'the pool still resolves its account to the default-home store');

  const linked = inFakeHome((h) => ({ claude: { viaLink: { credentialStore: { claude: path.join(h, 'linked-login') } } } }));
  assert.match(linked.row.message, /^warning: .*viaLink/);

  const clean = inFakeHome((h) => ({ claude: { onPrivate: { credentialStore: { claude: path.join(h, 'private-login') } } } }));
  assert.equal(clean.row.passed, true);
  assert.doesNotMatch(clean.row.message, /warning/);
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
