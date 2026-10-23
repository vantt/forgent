// test/helpers/failover-fixture.mjs -- a repo, a linked worktree and one confined fake executor per provider
// family, whose behaviour depends on the account login the worker was given (a marker file in the account
// home): `dead` fails the way a worker with no key does, `quota` hits a usage limit, `partial` writes and then
// hits one, anything else works. Shared by the failover and the exec-budget proofs; everything goes through runUnit.

import { after } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { runUnitWithPort as runUnit } from './run-unit-with-port.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { makeFixtureDir } from './fixture-dir.mjs';
import { writeGlobalConfig, writeProjectConfig } from './config-fixture.mjs';

seedFileLocalBwrapRegistry();

const fixtureDirs = [];
export const fixtureDir = (prefix) => {
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
export const SKIP = bwrapUsable() ? false : 'bwrap is not usable in this environment (user namespaces unavailable)';

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
export function setup(providers, { prefer = Object.keys(providers), recentlyUsed = {}, declaredStore = false, cells = {}, tierFallback = null, llmAccounts = null } = {}) {
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
      invocations: [{
        id: `${name}-cli`,
        via: 'cli',
        adapter: 'cli-spawn',
        confinement: { backend: 'bwrap' },
        command,
        args,
        // A pool declared in llmAccounts needs the store (and its login files) declared by the invocation.
        ...(declaredStore
          ? { credentialStore: { use: family, homeEnv: 'ACCOUNT_HOME', files: ['login'] } }
          : { resourceBindings: [{ resource: 'private-home', target: { kind: 'env', name: 'ACCOUNT_HOME' } }] }),
      }],
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
      defaults: { tier: 'standard' },
      modelPolicies: Object.fromEntries(Object.values(providers).map(({ family }) => {
        const cell = cells[family] ?? 'fake';
        return [family, { nano: cell, mini: cell, standard: cell, advanced: cell, flagship: cell, frontier: cell }];
      })),
      ...(tierFallback ? { tierFallback } : {}),
      executors,
      capabilities: { 'docs:write': { prefer: poolEntries, rigor: 'standard' } },
      patterns: { seatBinding: { schema: 1 }, defaultRule: { mutatingMinRigor: 'standard' } },
    },
  };
  fs.mkdirSync(path.join(repoRoot, '.fgos'), { recursive: true });
  writeProjectConfig(repoRoot, cfg);

  const home = fixtureDir('fgos-failover-home-');
  fs.mkdirSync(path.join(home, '.fgos'), { recursive: true });
  // llmAccounts: { pool: { accountId: { family, login } } }, each account holding the family's store.
  const globalPools = llmAccounts && Object.fromEntries(Object.entries(llmAccounts).map(([pool, accounts]) => [pool, Object.fromEntries(Object.entries(accounts).map(([accountId, { family, login }]) => {
    const accountHome = fixtureDir(`fgos-failover-pool-${pool}-${accountId}-`);
    fs.writeFileSync(path.join(accountHome, 'login'), login);
    return [accountId, { credentialStore: { [family]: accountHome } }];
  }))]));
  writeGlobalConfig(home, { runner: { providers: globalProviders, ...(globalPools ? { llmAccounts: globalPools } : {}) } });
  process.env.HOME = home;

  // Accounts that ran recently rank last, so the account a test leaves out is tried first.
  const runtimeDir = fixtureDir('fgos-failover-capacity-');
  const state = { contract: 'provider-capacity-state.v1', providers: {}, assignments: {}, audit: [] };
  // Listed order is the order the lease reaches them: each account was last selected one second
  // after the one before it, so a tie never falls to the run-id-seeded hash.
  for (const [family, accounts] of Object.entries(recentlyUsed)) {
    state.providers[family] = {
      accounts: Object.fromEntries(accounts.map((accountId, i) => [accountId, { leases: {}, lastSelectedAt: new Date(Date.UTC(2026, 0, 1, 0, 0, i)).toISOString() }])),
    };
  }
  fs.writeFileSync(path.join(runtimeDir, 'state.json'), JSON.stringify(state));
  return { repoRoot, worktreeDir, runtimeDir, runnerConfig: { ...cfg.runner, providers: globalProviders, ...(globalPools ? { llmAccounts: globalPools } : {}) } };
}

export const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
export const unitDirOf = (repoRoot, res) => path.join(repoRoot, '.fgos', 'assignments', res.unitRunId);
export const attemptsOf = (repoRoot, res, key = 'producer/1') => readJson(path.join(unitDirOf(repoRoot, res), 'unit.json')).bindings[key];
export const summaryOf = (repoRoot, res) => readJson(path.join(unitDirOf(repoRoot, res), 'unit-summary.json'));
export const runFile = (repoRoot, res, subdir, file, role = 'producer') => readJson(path.join(unitDirOf(repoRoot, res), role, subdir, 'runs', '01', file));
export const selectedAccount = (repoRoot, res, subdir) => runFile(repoRoot, res, subdir, 'provider-capacity-selection.json').accountId;

export const solo = (id) => ({ id, objective: 'Inspect the docs', capability: 'docs:write', writes: [], pattern: 'solo' });
export const panel = (id) => ({ id, objective: 'Review the design', capability: 'docs:write', writes: [], pattern: 'panel', stanceOptions: ['a', 'b'],
  seats: [1, 2, 3].map((n) => ({ seat: `member-${n}`, role: 'producer' })).concat([{ seat: 'synthesizer', role: 'synthesizer' }]) });
export const run = (fx, unitData, extra = {}) => runUnit({
  unitData,
  repoRoot: fx.repoRoot,
  cwd: fx.worktreeDir,
  worktree: fx.worktreeDir,
  session: { herdrPresent: false, headless: true },
  providerCapacityRuntimeDir: fx.runtimeDir,
  ...extra,
});

export const writer = (id) => ({ id, objective: 'Write docs', capability: 'docs:write', writes: ['notes.txt'], pattern: 'solo' });
export const pin = (accountId) => ({ overrides: [{ origin: 'human-cli', account: accountId }] });
export const unitRuns = (fx) => {
  const dir = path.join(fx.repoRoot, '.fgos', 'assignments');
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((name) => name.startsWith('unit-run-')) : [];
};
