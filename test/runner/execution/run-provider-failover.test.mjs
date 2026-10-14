// test/runner/execution/run-provider-failover.test.mjs -- a seat whose provider fails first rotates
// to another account of the same provider, then walks to the next candidate, and is a failure only
// when both are used up. Everything goes through runUnit; the workers are real confined processes
// whose behaviour depends on the account login they were given (a marker file in the account home).

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { runUnit } from '../../../src/runner/execution/run.mjs';
import { inspectProviderCapacity } from '../../../src/runner/dispatch/provider-capacity.mjs';
import { seedFileLocalBwrapRegistry } from '../confinement-registry-fixture.helper.mjs';
import { makeFixtureDir } from '../../helpers/fixture-dir.mjs';

seedFileLocalBwrapRegistry();

const fixtureDirs = [];
const fixtureDir = (prefix) => {
  const dir = makeFixtureDir(prefix);
  fixtureDirs.push(dir);
  return dir;
};
const previousHome = process.env.HOME;
after(() => {
  if (previousHome === undefined) delete process.env.HOME;
  else process.env.HOME = previousHome;
  for (const dir of fixtureDirs) fs.rmSync(dir, { recursive: true, force: true });
});

function bwrapUsable() {
  try {
    execFileSync('/usr/bin/bwrap', ['--ro-bind', '/', '/', '--', 'true'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
const SKIP = bwrapUsable() ? false : 'bwrap is not usable in this environment (user namespaces unavailable)';

// The login the account provisioned into the worker's home is a marker file: "dead" logins make the
// worker die the way pi does without a key; any other login (or none, for an unmanaged provider) works.
const WORKER = `
import fs from 'node:fs';
import path from 'node:path';
let login = '';
try { login = fs.readFileSync(path.join(process.env.ACCOUNT_HOME ?? '', 'login'), 'utf8').trim(); } catch { /* unmanaged provider */ }
if (login.startsWith('dead')) {
  process.stderr.write('No API key found for ' + process.argv[2] + '.\\n\\nUse /login to log into a provider via OAuth or API key.\\n');
  process.exit(1);
}
if (login.startsWith('partial')) {
  // Work cut off half way: the worker already wrote, renamed or appended before the limit hit. A
  // read-only posture refuses each change, which is what a read-only seat must leave behind.
  const changes = login.startsWith('partialtouch')
    ? [() => fs.appendFileSync('notes.txt', ' and more')]
    : [() => fs.writeFileSync('notes.txt', 'half'), () => fs.renameSync('README.md', 'README.old')];
  for (const change of changes) { try { change(); } catch { /* read-only */ } }
}
if (login.startsWith('quota') || login.startsWith('partial') || process.argv[2].startsWith('spentquota')) {
  // The real codex ending of a round cut off by the account's usage limit (2026-10-13): the error
  // twice, then the token tally codex always prints last.
  const line = 'ERROR: You\u2019ve hit your usage limit. Upgrade to Pro (https://chatgpt.com/explore/pro), visit https://chatgpt.com/codex/settings/usage to purchase more credits or try again at 11:39 PM.';
  process.stderr.write(line + '\\n' + line + '\\ntokens used\\n379,854\\n');
  process.exit(1);
}
try { fs.writeFileSync(path.join(process.cwd(), 'notes.txt'), 'notes'); } catch { /* a read-only posture keeps the repo untouched */ }
const prompt = process.argv.slice(3).join(' ');
const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
if (match) {
  const claimDir = path.dirname(match[1]);
  const outbox = path.join(claimDir, 'worker-output', 'outbox');
  const dir = fs.existsSync(outbox) ? outbox : claimDir;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'agent-report.md'), '# Report\\nThe assigned work was inspected and completed with a full explanation of what was checked.\\n');
  fs.writeFileSync(path.join(dir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done', assessment: { verdict: 'pass' }, stance: { choice: 'a' } }));
}
`;

/**
 * A repo with a linked worktree and one executor per entry of `providers`
 * ({ executor: { family, logins: { accountId: marker } } }); `prefer` lists the executors in pool
 * order. Account inventory is global-only config, so it goes into a private HOME, and the
 * provider-capacity state lives in a runtime directory of its own.
 */
function setup(providers, { prefer = Object.keys(providers), recentlyUsed = {} } = {}) {
  const repoRoot = fixtureDir('fgos-failover-');
  const git = (args, cwd = repoRoot) => execFileSync('git', args, { cwd, stdio: 'ignore' });
  git(['init', '-b', 'main']);
  git(['config', 'user.name', 'Test Runner']);
  git(['config', 'user.email', 'test@runner.local']);
  fs.writeFileSync(path.join(repoRoot, 'README.md'), '# Test\n');
  git(['add', 'README.md']);
  git(['commit', '-m', 'initial']);
  const worktreeDir = fixtureDir('fgos-failover-wt-');
  git(['worktree', 'add', '-b', 'wt-branch', worktreeDir]);

  const script = path.join(repoRoot, 'worker.mjs');
  fs.writeFileSync(script, WORKER);
  const executors = {};
  const globalProviders = {};
  for (const [name, { family, logins = {} }] of Object.entries(providers)) {
    const command = path.join(repoRoot, `${name}-bin`);
    fs.symlinkSync(process.execPath, command);
    const args = [script, family, '{prompt}'];
    executors[name] = {
      kind: 'agent',
      allowCrossProvider: true,
      providerModel: family,
      command,
      args,
      invocations: [{ id: `${name}-cli`, via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command, args, resourceBindings: [{ resource: 'private-home', target: { kind: 'env', name: 'ACCOUNT_HOME' } }] }],
    };
    if (Object.keys(logins).length > 0) {
      globalProviders[family] = {
        accounts: Object.fromEntries(Object.entries(logins).map(([accountId, marker]) => {
          const home = fixtureDir(`fgos-failover-acct-${accountId}-`);
          fs.writeFileSync(path.join(home, 'login'), marker);
          return [accountId, { label: accountId, credentialSource: { kind: 'home-files', home, files: ['login'] } }];
        })),
      };
    }
  }
  const poolEntries = prefer.map((name) => ({ executor: name, invocation: `${name}-cli` }));
  const cfg = {
    runner: {
      defaultExecutor: prefer[0],
      timeoutMs: 40000,
      rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
      modelPolicies: Object.fromEntries(Object.values(providers).map(({ family }) => [family, { nano: 'fake', mini: 'fake', standard: 'fake', advanced: 'fake', flagship: 'fake', frontier: 'fake' }])),
      executors,
      capabilities: { 'docs:write': { prefer: poolEntries, rigor: 'standard' } },
      patterns: { defaultRule: { mutatingMinRigor: 'standard' } },
    },
  };
  fs.mkdirSync(path.join(repoRoot, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, '.fgos', 'config.json'), JSON.stringify(cfg, null, 2));

  const home = fixtureDir('fgos-failover-home-');
  fs.mkdirSync(path.join(home, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(home, '.fgos', 'config.json'), JSON.stringify({ runner: { providers: globalProviders } }, null, 2));
  process.env.HOME = home;

  // Accounts that ran recently rank last, so the account a test leaves out is tried first.
  const runtimeDir = fixtureDir('fgos-failover-capacity-');
  const state = { contract: 'provider-capacity-state.v1', providers: {}, assignments: {}, audit: [] };
  for (const [family, accounts] of Object.entries(recentlyUsed)) {
    state.providers[family] = { accounts: Object.fromEntries(accounts.map((accountId) => [accountId, { leases: {}, lastSelectedAt: '2026-01-01T00:00:00.000Z' }])) };
  }
  fs.writeFileSync(path.join(runtimeDir, 'state.json'), JSON.stringify(state));
  return { repoRoot, worktreeDir, runtimeDir, runnerConfig: { ...cfg.runner, providers: globalProviders } };
}

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const unitDirOf = (repoRoot, res) => path.join(repoRoot, '.fgos', 'assignments', res.unitRunId);
const attemptsOf = (repoRoot, res, key = 'producer/1') => readJson(path.join(unitDirOf(repoRoot, res), 'unit.json')).bindings[key];
const summaryOf = (repoRoot, res) => readJson(path.join(unitDirOf(repoRoot, res), 'unit-summary.json'));
const runFile = (repoRoot, res, subdir, file, role = 'producer') => readJson(path.join(unitDirOf(repoRoot, res), role, subdir, 'runs', '01', file));
const selectedAccount = (repoRoot, res, subdir) => runFile(repoRoot, res, subdir, 'provider-capacity-selection.json').accountId;

const solo = (id) => ({ id, objective: 'Inspect the docs', capability: 'docs:write', writes: [], pattern: 'solo' });
const panel = (id) => ({ id, objective: 'Review the design', capability: 'docs:write', writes: [], pattern: 'panel', stanceOptions: ['a', 'b'] });
const run = (fx, unitData, extra = {}) => runUnit({
  unitData,
  repoRoot: fx.repoRoot,
  cwd: fx.worktreeDir,
  worktree: fx.worktreeDir,
  session: { herdrPresent: false, headless: true },
  providerCapacityRuntimeDir: fx.runtimeDir,
  ...extra,
});

test('a dead login moves the seat to another account of the same provider, not to another provider', { skip: SKIP }, async () => {
  const fx = setup(
    { alpha: { family: 'alpha', logins: { dead1: 'dead', live1: 'live' } }, beta: { family: 'beta' } },
    { recentlyUsed: { alpha: ['live1'] } },
  );
  const res = await run(fx, solo('u-rotate'));
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));

  const attempts = attemptsOf(fx.repoRoot, res);
  assert.deepEqual(attempts.map((a) => [a.binding.executor, a.outcome]), [['alpha', 'provider-limit'], ['alpha', 'pass']], 'the same executor runs again');
  assert.equal(attempts[1].assignmentId, `${res.unitRunId}/producer/1-fb1`);
  assert.deepEqual([attempts[0].candidateIndex, attempts[1].candidateIndex], [0, 0]);
  assert.equal(attempts[1].binding.invocation, attempts[0].binding.invocation);
  assert.equal(attempts[0].fallbackFrom, null);
  assert.equal(attempts[1].fallbackFrom.kind, 'account-rotation');
  assert.equal(attempts[1].fallbackFrom.provider, 'alpha');
  assert.equal(attempts[1].fallbackFrom.reason, 'provider-limit');

  // The first attempt ran on the dead login and ended as a credential fault; the retry got the other account.
  assert.equal(selectedAccount(fx.repoRoot, res, '1'), 'dead1');
  assert.equal(selectedAccount(fx.repoRoot, res, '1-fb1'), 'live1');
  const first = runFile(fx.repoRoot, res, '1', 'result.json');
  assert.equal(first.classification.failure.code, 'provider-limit');
  assert.equal(first.classification.failure.cause, 'credential');
  const capacity = inspectProviderCapacity({ runnerConfig: fx.runnerConfig, provider: 'alpha', runtimeDir: fx.runtimeDir });
  assert.equal(capacity.providers.alpha.accounts.dead1.quarantine.reasonCode, 'auth-token');
  assert.equal(capacity.providers.alpha.accounts.live1.healthy, true);

  // The other provider never ran, and the summary shows the seat's attempts in order.
  assert.equal(fs.existsSync(path.join(unitDirOf(fx.repoRoot, res), 'producer', '1-fb2')), false);
  const seat = summaryOf(fx.repoRoot, res).seats[0];
  assert.deepEqual(seat.attempts.map((a) => [a.executor, a.outcome]), [['alpha', 'provider-limit'], ['alpha', 'pass']]);
  assert.equal(seat.final.fallbackFrom.kind, 'account-rotation');
});

test('a usage limit on a headless round moves the seat to another account of the same provider', { skip: SKIP }, async () => {
  const fx = setup(
    { alpha: { family: 'alpha', logins: { spent1: 'quota', live1: 'live' } }, beta: { family: 'beta' } },
    { recentlyUsed: { alpha: ['live1'] } },
  );
  const before = Date.now();
  const res = await run(fx, solo('u-quota'));
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));

  const attempts = attemptsOf(fx.repoRoot, res);
  assert.deepEqual(attempts.map((a) => [a.binding.executor, a.outcome]), [['alpha', 'provider-limit'], ['alpha', 'pass']]);
  assert.equal(attempts[1].fallbackFrom.kind, 'account-rotation');
  assert.equal(attempts[0].failureCause, undefined, 'a quota stop does not mark the provider family as a dead login');
  assert.equal(selectedAccount(fx.repoRoot, res, '1'), 'spent1');
  assert.equal(selectedAccount(fx.repoRoot, res, '1-fb1'), 'live1');

  // The round is a quota stop, not a dead login and not a generic non-zero exit.
  const first = runFile(fx.repoRoot, res, '1', 'result.json');
  assert.equal(first.classification.failure.code, 'provider-limit');
  assert.equal(first.classification.failure.cause, 'quota');

  // The account waits out the reset time the provider printed (11:39 PM local, the next one), held
  // by the existing quarantine record rather than a second field on the result.
  const capacity = inspectProviderCapacity({ runnerConfig: fx.runnerConfig, provider: 'alpha', runtimeDir: fx.runtimeDir });
  const quarantine = capacity.providers.alpha.accounts.spent1.quarantine;
  assert.equal(quarantine.reasonCode, 'quota-limit');
  const until = Date.parse(quarantine.until);
  assert.ok(until > before && until <= before + 24 * 3600 * 1000, quarantine.until);
  assert.deepEqual([new Date(until).getHours(), new Date(until).getMinutes()], [23, 39]);
  assert.equal(capacity.providers.alpha.accounts.live1.healthy, true);
});

test('a usage limit is recognised without an account lease and walks to the next provider', { skip: SKIP }, async () => {
  // No inventory for the spent provider: nothing is leased or quarantined, yet the stop is still a
  // provider limit, so the seat moves on instead of failing.
  const fx = setup({ spent: { family: 'spentquota' }, beta: { family: 'beta' } });
  const res = await run(fx, solo('u-quota-nolease'));
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));
  const attempts = attemptsOf(fx.repoRoot, res);
  assert.deepEqual(attempts.map((a) => [a.binding.executor, a.outcome]), [['spent', 'provider-limit'], ['beta', 'pass']]);
  assert.equal(attempts[1].fallbackFrom.kind, 'next-candidate');
  const first = runFile(fx.repoRoot, res, '1', 'result.json');
  assert.equal(first.classification.failure.cause, 'quota');
  assert.equal(fs.existsSync(path.join(unitDirOf(fx.repoRoot, res), 'producer', '1', 'runs', '01', 'provider-capacity-selection.json')), false);
});

test('a provider with one account goes straight to the next provider', { skip: SKIP }, async () => {
  const fx = setup({ alpha: { family: 'alpha', logins: { dead1: 'dead' } }, beta: { family: 'beta' } });
  const res = await run(fx, solo('u-one-account'));
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));
  const attempts = attemptsOf(fx.repoRoot, res);
  assert.deepEqual(attempts.map((a) => [a.binding.executor, a.outcome]), [['alpha', 'provider-limit'], ['beta', 'pass']]);
  assert.equal(attempts[1].fallbackFrom.kind, 'next-candidate');
  assert.equal(attempts[1].fallbackFrom.executor, 'alpha');
  assert.deepEqual(attempts.map((a) => a.skipCandidateIndex), [-1, 0]);
});

test('rotation stops after the accounts the provider has, then the walk leaves the provider', { skip: SKIP }, async () => {
  const fx = setup({ alpha: { family: 'alpha', logins: { dead1: 'dead', dead2: 'dead' } }, beta: { family: 'beta' } });
  const res = await run(fx, solo('u-rotation-spent'));
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));
  const attempts = attemptsOf(fx.repoRoot, res);
  assert.deepEqual(attempts.map((a) => [a.binding.executor, a.outcome]), [['alpha', 'provider-limit'], ['alpha', 'provider-limit'], ['beta', 'pass']]);
  assert.deepEqual(attempts.map((a) => a.fallbackFrom?.kind ?? null), [null, 'account-rotation', 'next-candidate']);
  assert.deepEqual([selectedAccount(fx.repoRoot, res, '1'), selectedAccount(fx.repoRoot, res, '1-fb1')].sort(), ['dead1', 'dead2']);
});

test('a provider whose login just failed is not picked again by the walk, even through another executor of it', { skip: SKIP }, async () => {
  const fx = setup({
    alpha: { family: 'alpha', logins: { dead1: 'dead' } },
    'alpha-lite': { family: 'alpha' },
    beta: { family: 'beta' },
  });
  const res = await run(fx, solo('u-credential-family'));
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));
  const attempts = attemptsOf(fx.repoRoot, res);
  assert.deepEqual(attempts.map((a) => [a.binding.executor, a.outcome]), [['alpha', 'provider-limit'], ['beta', 'pass']], 'alpha-lite shares the failed provider and is skipped');
  assert.deepEqual(attempts.map((a) => a.candidateIndex), [0, 2]);
});

test('when every account and every candidate is used up the seat and the unit fail', { skip: SKIP }, async () => {
  const fx = setup({
    alpha: { family: 'alpha', logins: { dead1: 'dead', dead2: 'dead' } },
    beta: { family: 'beta', logins: { dead3: 'dead' } },
  });
  const res = await run(fx, solo('u-exhausted'));
  assert.equal(res.outcome, 'provider-limit');
  const exhausted = res.results[0].fallbackExhausted;
  assert.equal(exhausted.from.executor, 'beta');
  assert.ok(exhausted.reason);
  const attempts = attemptsOf(fx.repoRoot, res);
  assert.deepEqual(attempts.map((a) => [a.binding.executor, a.outcome]), [['alpha', 'provider-limit'], ['alpha', 'provider-limit'], ['beta', 'provider-limit']]);
  assert.notEqual(summaryOf(fx.repoRoot, res).outcome, 'pass');
});

const writer = (id) => ({ id, objective: 'Write docs', capability: 'docs:write', writes: ['notes.txt'], pattern: 'solo' });

test('a writing seat passes the mutating gate on its account-rotation retry', { skip: SKIP }, async () => {
  const fx = setup(
    { alpha: { family: 'alpha', logins: { dead1: 'dead', live1: 'live' } }, beta: { family: 'beta' } },
    { recentlyUsed: { alpha: ['live1'] } },
  );
  const res = await run(fx, writer('u-writer-rotate'));
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));
  assert.deepEqual(attemptsOf(fx.repoRoot, res).map((a) => [a.binding.executor, a.outcome]), [['alpha', 'provider-limit'], ['alpha', 'pass']]);
});

test('a writing seat passes the mutating gate on a walk that skipped a provider with a dead login', { skip: SKIP }, async () => {
  const fx = setup({
    alpha: { family: 'alpha', logins: { dead1: 'dead' } },
    'alpha-lite': { family: 'alpha' },
    beta: { family: 'beta' },
  });
  const res = await run(fx, writer('u-writer-walk'));
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));
  assert.deepEqual(attemptsOf(fx.repoRoot, res).map((a) => [a.binding.executor, a.outcome]), [['alpha', 'provider-limit'], ['beta', 'pass']]);
});

test('a panel seat that rotated keeps its role and the unit passes', { skip: SKIP }, async () => {
  const fx = setup(
    {
      alpha: { family: 'alpha', logins: { dead1: 'dead', live1: 'live' } },
      beta: { family: 'beta' },
      gamma: { family: 'gamma' },
      delta: { family: 'delta' },
    },
    { recentlyUsed: { alpha: ['live1'] } },
  );
  const res = await run(fx, panel('u-panel-rotate'), { pattern: 'panel' });
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results.map((r) => [r.role, r.outcome])));

  const panelist1 = attemptsOf(fx.repoRoot, res, 'panelist-1/1');
  assert.deepEqual(panelist1.map((a) => [a.role, a.binding.executor, a.outcome]), [['panelist-1', 'alpha', 'provider-limit'], ['panelist-1', 'alpha', 'pass']]);
  const summary = summaryOf(fx.repoRoot, res);
  const seat = summary.seats.find((s) => s.role === 'panelist-1');
  assert.equal(seat.kind, 'panelist');
  assert.equal(seat.final.executor, 'alpha');
  assert.equal(seat.final.outcome, 'pass');
  assert.equal(seat.attempts.length, 2);
  assert.equal(summary.seats.filter((s) => s.kind === 'panelist').length, 3);
  assert.equal(summary.outcome, 'pass');
  assert.equal(summary.sharedFamilies, undefined, 'every seat still has a family of its own');
});

test('a panel seat that walked to another provider lands on a family its siblings did not use', { skip: SKIP }, async () => {
  const fx = setup({
    alpha: { family: 'alpha', logins: { dead1: 'dead' } },
    beta: { family: 'beta' },
    gamma: { family: 'gamma' },
    delta: { family: 'delta' },
    epsilon: { family: 'epsilon' },
  });
  const res = await run(fx, panel('u-panel-walk'), { pattern: 'panel' });
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results.map((r) => [r.role, r.outcome])));
  const panelist1 = attemptsOf(fx.repoRoot, res, 'panelist-1/1');
  assert.deepEqual(panelist1.map((a) => a.outcome), ['provider-limit', 'pass']);
  assert.equal(panelist1[1].fallbackFrom.kind, 'next-candidate');
  const finalExecutors = res.results.filter((r) => r.role.startsWith('panelist-')).map((r) => r.runResult.executorId);
  assert.equal(new Set(finalExecutors).size, 3, `final panelist executors are pairwise distinct families, got ${finalExecutors.join(',')}`);
  assert.ok(!finalExecutors.includes('alpha'));
  assert.equal(summaryOf(fx.repoRoot, res).sharedFamilies, undefined);
});

test('a unit-preferred executor that hits its usage limit walks on to the capability pool', { skip: SKIP }, async () => {
  const fx = setup({ spent: { family: 'spentquota' }, beta: { family: 'beta' } }, { prefer: ['beta'] });
  const res = await run(fx, { ...solo('u-prefer-limit'), prefer: ['spent'] });
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));
  const attempts = attemptsOf(fx.repoRoot, res);
  assert.deepEqual(attempts.map((a) => [a.binding.executor, a.binding.provenance.executor.source, a.outcome]), [
    ['spent', 'unit-prefer', 'provider-limit'],
    ['beta', 'capability:docs:write', 'pass'],
  ]);
  assert.equal(attempts[1].fallbackFrom.kind, 'next-candidate');
});

test('a writing unit with its own prefer passes the mutating gate, also on a walk out of it', { skip: SKIP }, async () => {
  const providers = () => ({ spent: { family: 'spentquota' }, alpha: { family: 'alpha' }, beta: { family: 'beta' } });
  const fx = setup(providers(), { prefer: ['beta'] });
  const direct = await run(fx, { ...writer('u-prefer-writer'), prefer: ['alpha'] });
  assert.equal(direct.outcome, 'pass', JSON.stringify(direct.results[0]).slice(0, 1500));
  assert.deepEqual(attemptsOf(fx.repoRoot, direct).map((a) => [a.binding.executor, a.outcome]), [['alpha', 'pass']]);

  // A fresh repo: the same file written twice in one worktree is no change, so no evidence.
  const fy = setup(providers(), { prefer: ['beta'] });
  const walked = await run(fy, { ...writer('u-prefer-writer-walk'), prefer: ['spent'] });
  assert.equal(walked.outcome, 'pass', JSON.stringify(walked.results[0]).slice(0, 1500));
  assert.deepEqual(attemptsOf(fy.repoRoot, walked).map((a) => [a.binding.executor, a.outcome]), [['spent', 'provider-limit'], ['beta', 'pass']]);
});

// An account pinned by an override is hard: the seat runs that account, and a provider limit on it
// ends the seat instead of rotating to another account or walking to another executor.
const pin = (accountId) => ({ overrides: [{ origin: 'human-cli', account: accountId }] });
const unitRuns = (fx) => {
  const dir = path.join(fx.repoRoot, '.fgos', 'assignments');
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((name) => name.startsWith('unit-run-')) : [];
};

test('a pinned account runs, even when the lease would rank another account first', { skip: SKIP }, async () => {
  const fx = setup({ alpha: { family: 'alpha', logins: { a1: 'live', a2: 'live' } } }, { recentlyUsed: { alpha: ['a2'] } });
  const res = await run(fx, solo('u-pin'), pin('a2'));
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));
  assert.equal(selectedAccount(fx.repoRoot, res, '1'), 'a2');
  const [attempt] = attemptsOf(fx.repoRoot, res);
  assert.deepEqual(attempt.binding.account, { provider: 'alpha', id: 'a2' });
  assert.deepEqual(attempt.binding.provenance.account, { value: 'a2', source: 'override:human-cli' });
});

test('a provider limit on a pinned account ends the seat: no rotation, no other executor', { skip: SKIP }, async () => {
  const fx = setup(
    { alpha: { family: 'alpha', logins: { dead1: 'dead', live1: 'live' } }, beta: { family: 'beta' } },
    { recentlyUsed: { alpha: ['live1'] } },
  );
  const res = await run(fx, solo('u-pin-limit'), pin('dead1'));
  assert.equal(res.outcome, 'provider-limit');
  assert.deepEqual(attemptsOf(fx.repoRoot, res).map((a) => [a.binding.executor, a.outcome]), [['alpha', 'provider-limit']]);
  const exhausted = res.results[0].fallbackExhausted;
  assert.equal(exhausted.reason, 'account-pinned');
  assert.match(exhausted.detail, /dead1/);
  assert.equal(fs.existsSync(path.join(unitDirOf(fx.repoRoot, res), 'producer', '1-fb1')), false);
});

test('a quarantined pinned account is refused before any unit run exists, and a resume of a run pinned to it too', { skip: SKIP }, async () => {
  const fx = setup(
    { alpha: { family: 'alpha', logins: { spent1: 'quota', live1: 'live' } }, beta: { family: 'beta' } },
    { recentlyUsed: { alpha: ['live1'] } },
  );
  const first = await run(fx, solo('u-pin-quota'), pin('spent1'));
  assert.equal(first.outcome, 'provider-limit');
  const until = inspectProviderCapacity({ runnerConfig: fx.runnerConfig, provider: 'alpha', runtimeDir: fx.runtimeDir }).providers.alpha.accounts.spent1.quarantine.until;
  assert.ok(until);

  const before = unitRuns(fx);
  await assert.rejects(run(fx, solo('u-pin-quota-again'), pin('spent1')), (err) => {
    assert.match(err.message, /account "spent1" of provider "alpha" is quarantined/);
    assert.ok(err.message.includes(until), err.message);
    return true;
  });
  assert.deepEqual(unitRuns(fx), before, 'no unit run was created');

  await assert.rejects(runUnit({
    resumeUnitRunId: first.unitRunId,
    repoRoot: fx.repoRoot,
    cwd: fx.worktreeDir,
    worktree: fx.worktreeDir,
    session: { herdrPresent: false, headless: true },
    providerCapacityRuntimeDir: fx.runtimeDir,
  }), (err) => err.message.includes('"spent1"') && err.message.includes(until));
  assert.equal(attemptsOf(fx.repoRoot, first).length, 1, 'the resume dispatched nothing');
});

test('an account of another provider is refused before any unit run exists', { skip: SKIP }, async () => {
  const fx = setup({ alpha: { family: 'alpha', logins: { a1: 'live' } }, beta: { family: 'beta', logins: { b1: 'live' } } });
  await assert.rejects(run(fx, solo('u-pin-other'), pin('b1')), /applies to no seat.*"b1".*providers\.alpha\.accounts/s);
  assert.deepEqual(unitRuns(fx), []);
});

test('a pinned account on a reviewed unit pins the seat of its provider; the checker of another provider binds freely', { skip: SKIP }, async () => {
  const fx = setup({ alpha: { family: 'alpha', logins: { a1: 'live', a2: 'live' } }, beta: { family: 'beta' } }, { recentlyUsed: { alpha: ['a2'] } });
  const res = await run(fx, { ...writer('u-pin-reviewed'), pattern: 'reviewed' }, { pattern: 'reviewed', ...pin('a2') });
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results.map((r) => [r.role, r.outcome, r.refused])));
  assert.deepEqual(attemptsOf(fx.repoRoot, res)[0].binding.account, { provider: 'alpha', id: 'a2' });
  assert.equal(selectedAccount(fx.repoRoot, res, '1'), 'a2');
  const reviewer = attemptsOf(fx.repoRoot, res, 'reviewer/1')[0].binding;
  assert.equal(reviewer.executor, 'beta');
  assert.equal(reviewer.account, undefined);
  assert.equal(reviewer.provenance.account.skipped.reason, 'account-pin-no-inventory');
});

// A writing seat that already changed the worktree before its provider limit is not run again on
// top of its own half-done work: the seat stops, and the attempt lists what changed.
test('a writing seat that changed the worktree before a provider limit stops instead of running again', { skip: SKIP }, async () => {
  const fx = setup(
    { alpha: { family: 'alpha', logins: { partial1: 'partial', live1: 'live' } }, beta: { family: 'beta' } },
    { recentlyUsed: { alpha: ['live1'] } },
  );
  const res = await run(fx, writer('u-partial'));
  assert.equal(res.outcome, 'provider-limit', JSON.stringify(res.results[0]).slice(0, 1500));
  const attempts = attemptsOf(fx.repoRoot, res);
  assert.deepEqual(attempts.map((a) => [a.binding.executor, a.outcome]), [['alpha', 'provider-limit']]);
  const exhausted = res.results[0].fallbackExhausted;
  assert.equal(exhausted.reason, 'partial-writes');
  assert.deepEqual(exhausted.paths, ['README.md', 'README.old', 'notes.txt']);
  assert.deepEqual(attempts[0].retryStopped.paths, exhausted.paths, 'the stop is recorded on the attempt');
  assert.equal(fs.readFileSync(path.join(fx.worktreeDir, 'notes.txt'), 'utf8'), 'half', 'the half-done work is left as it is');
});

test('a file already dirty before the launch that the seat changed again also stops the retry', { skip: SKIP }, async () => {
  const fx = setup(
    { alpha: { family: 'alpha', logins: { partialtouch1: 'partialtouch', live1: 'live' } }, beta: { family: 'beta' } },
    { recentlyUsed: { alpha: ['live1'] } },
  );
  fs.writeFileSync(path.join(fx.worktreeDir, 'notes.txt'), 'mine');
  const res = await run(fx, writer('u-partial-touch'));
  assert.equal(res.outcome, 'provider-limit', JSON.stringify(res.results[0]).slice(0, 1500));
  assert.equal(res.results[0].fallbackExhausted.reason, 'partial-writes');
  assert.deepEqual(res.results[0].fallbackExhausted.paths, ['notes.txt']);
});

test('a read-only seat of a writing unit still rotates: its sandbox kept the worktree as it was', { skip: SKIP }, async () => {
  const fx = setup(
    { alpha: { family: 'alpha' }, beta: { family: 'beta', logins: { partial2: 'partial', live2: 'live' } } },
    { recentlyUsed: { beta: ['live2'] } },
  );
  const res = await run(fx, { ...writer('u-reviewer-rotate'), pattern: 'reviewed' }, { pattern: 'reviewed' });
  const reviewer = attemptsOf(fx.repoRoot, res, 'reviewer/1');
  assert.deepEqual(reviewer.map((a) => [a.binding.executor, a.outcome]), [['beta', 'provider-limit'], ['beta', 'pass']], JSON.stringify(res.results.map((r) => [r.role, r.outcome, r.fallbackExhausted])));
  assert.equal(reviewer[1].fallbackFrom.kind, 'account-rotation');
  assert.ok(reviewer.every((a) => a.writeBaseline === undefined), 'a read-only seat records no write baseline, so nothing it did not write can stop it');
  assert.equal(res.outcome, 'pass');
});

test('a pinned writing seat that changed the worktree before its limit reports the changed paths, not only the pin', { skip: SKIP }, async () => {
  const fx = setup({ alpha: { family: 'alpha', logins: { partial1: 'partial', live1: 'live' } } });
  const res = await run(fx, writer('u-pin-partial'), pin('partial1'));
  assert.equal(res.outcome, 'provider-limit');
  const exhausted = res.results[0].fallbackExhausted;
  assert.equal(exhausted.reason, 'partial-writes');
  assert.deepEqual(exhausted.paths, ['README.md', 'README.old', 'notes.txt']);
  assert.equal(exhausted.accountPinned, 'partial1');
});

test('a resume takes a new baseline: work a person kept after a partial-writes stop does not stop the next rotation', { skip: SKIP }, async () => {
  const fx = setup(
    { alpha: { family: 'alpha', logins: { partial1: 'partial', spent2: 'quota', live3: 'live' } } },
    { recentlyUsed: { alpha: ['spent2', 'live3'] } },
  );
  const first = await run(fx, writer('u-partial-resume'));
  assert.equal(first.results[0].fallbackExhausted?.reason, 'partial-writes');
  // The person keeps the half-done work (the files stay as they are) and resumes. partial1 is now
  // quarantined, so the lease takes spent2, whose quota stop writes nothing: that seat rotates.
  fs.writeFileSync(path.join(fx.worktreeDir, 'notes.txt'), 'kept');
  const resumed = await runUnit({
    resumeUnitRunId: first.unitRunId,
    repoRoot: fx.repoRoot,
    cwd: fx.worktreeDir,
    worktree: fx.worktreeDir,
    session: { herdrPresent: false, headless: true },
    providerCapacityRuntimeDir: fx.runtimeDir,
  });
  const attempts = attemptsOf(fx.repoRoot, resumed);
  assert.deepEqual(attempts.slice(1).map((a) => a.fallbackFrom?.kind), ['account-rotation'], JSON.stringify(resumed.results[0].fallbackExhausted));
  assert.equal(selectedAccount(fx.repoRoot, resumed, '1-fb1'), 'live3');
});
