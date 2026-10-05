// test/runner/execution/run-herdr.test.mjs -- the transport bind() chooses is the transport
// runUnit uses, the posture reaches the agent inside a herdr pane, and a provider limit moves
// the role to the next candidate. Everything goes through runUnit (the door `fgos run` uses);
// herdr is a fake binary that gives each pane a real process (test/helpers/fake-herdr-pane.mjs).

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { runUnit } from '../../../src/runner/execution/run.mjs';
import { withRunDirReadAccess } from '../../../src/runner/dispatch/cli.mjs';
import { acquireMainCheckoutLock, dispatchLockFile, ACQUIRED } from '../../../src/runner/main-checkout-lock.mjs';
import { seedFileLocalBwrapRegistry } from '../confinement-registry-fixture.helper.mjs';
import { createFakeHerdr, SANDBOXED_AGENT_SOURCE } from '../../helpers/fake-herdr-pane.mjs';

seedFileLocalBwrapRegistry();

// Confined runs mount a private tmpfs over /tmp, so fixtures live outside it.
const FIXTURE_ROOT = fs.existsSync('/var/tmp') ? '/var/tmp' : os.tmpdir();
const fixtureDirs = [];
const fakes = [];
const fixtureDir = (prefix) => {
  const dir = fs.mkdtempSync(path.join(FIXTURE_ROOT, prefix));
  fixtureDirs.push(dir);
  return dir;
};
after(() => {
  for (const fake of fakes) fake.cleanup();
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
const BLOCKED = /^(EROFS|EACCES|EPERM)$/;

// What a cli-spawn worker writes: a claim that the work is done.
const CLI_WORKER = `
import fs from 'node:fs';
import path from 'node:path';
const prompt = process.argv.slice(2).join(' ');
const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
if (match) {
  const claimDir = path.dirname(match[1]);
  const outbox = path.join(claimDir, 'worker-output', 'outbox');
  const dir = fs.existsSync(outbox) ? outbox : claimDir;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'agent-report.md'), '# Report\\nThe assigned work was inspected and completed with a full explanation of what was checked.\\n');
  fs.writeFileSync(path.join(dir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done', assessment: { verdict: 'pass' } }));
}
`;

/**
 * A repo plus a linked worktree, and one executor per name. Each executor has a confined
 * cli-spawn invocation and a confined herdr-spawn invocation; prefer lists them in order.
 */
function setup(executorNames, { idleTimeoutMs = 1500, agentKind = 'fakeagent', herdrExtra = {} } = {}) {
  const repoRoot = fixtureDir('fgos-herdr-run-');
  const git = (args, cwd = repoRoot) => execFileSync('git', args, { cwd, stdio: 'ignore' });
  git(['init', '-b', 'main']);
  git(['config', 'user.name', 'Test Runner']);
  git(['config', 'user.email', 'test@runner.local']);
  fs.writeFileSync(path.join(repoRoot, 'README.md'), '# Test\n');
  git(['add', 'README.md']);
  git(['commit', '-m', 'initial']);
  const worktreeDir = fixtureDir('fgos-herdr-wt-');
  git(['worktree', 'add', '-b', 'wt-branch', worktreeDir]);

  // Where the fake herdr tells the in-sandbox agent a brief arrived; outside the repo so it is no stray write.
  const signalDir = fixtureDir('fgos-herdr-signal-');
  const cliScript = path.join(repoRoot, 'cli-worker.mjs');
  const agentScript = path.join(repoRoot, 'sandboxed-agent.mjs');
  fs.writeFileSync(cliScript, CLI_WORKER);
  fs.writeFileSync(agentScript, SANDBOXED_AGENT_SOURCE);
  const targets = path.join(repoRoot, 'probe-targets.json');
  fs.writeFileSync(targets, JSON.stringify({ worktree: fs.realpathSync(worktreeDir), main: fs.realpathSync(repoRoot) }));

  const executors = {};
  executorNames.forEach((name, index) => {
    const command = path.join(repoRoot, `${name}-bin`);
    fs.symlinkSync(process.execPath, command);
    executors[name] = {
      kind: 'agent',
      allowCrossProvider: true,
      providerModel: name,
      command,
      args: [cliScript, '{prompt}'],
      invocations: [
        { id: `${name}-cli`, via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command, args: [cliScript, '{prompt}'] },
        {
          id: `${name}-herdr`,
          via: 'cli',
          adapter: 'herdr-spawn',
          confinement: { backend: 'bwrap' },
          command,
          args: [agentScript],
          interactiveMode: { exitCommand: '/exit', kind: agentKind, ...(herdrExtra.interactiveMode ?? {}) },
          env: {
            FAKE_AGENT_SIGNAL: path.join(signalDir, `signal-mock-pane-${index + 1}.json`),
            FAKE_AGENT_TARGETS: targets,
            ...(herdrExtra.env ?? {}),
          },
          ...(herdrExtra.resourceBindings ? { resourceBindings: herdrExtra.resourceBindings } : {}),
        },
      ],
    };
  });
  const prefer = executorNames.map((name) => ({ executor: name, invocation: `${name}-cli` }));
  const cfg = {
    runner: {
      defaultExecutor: executorNames[0],
      timeoutMs: 40000,
      idleTimeoutMs,
      rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
      modelPolicies: Object.fromEntries(executorNames.map((name) => [name, { nano: 'fake', mini: 'fake', standard: 'fake', advanced: 'fake', flagship: 'fake', frontier: 'fake' }])),
      executors,
      capabilities: {
        'docs:write': { prefer, rigor: 'standard' },
        'docs:review': { prefer, persona: 'code-reviewer', rigor: 'standard' },
      },
      patterns: {
        defaultRule: { mutatingMinRigor: 'standard' },
        reviewed: { maxRounds: 1, checkersByRigor: { standard: ['reviewer'], high: ['reviewer'], critical: ['reviewer'] } },
      },
    },
  };
  fs.mkdirSync(path.join(repoRoot, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, '.fgos', 'config.json'), JSON.stringify(cfg, null, 2));
  return { repoRoot, worktreeDir, signalDir };
}

function useFakeHerdr(scenario) {
  const fake = createFakeHerdr(fixtureDir('fgos-fake-herdr-'), scenario);
  fakes.push(fake);
  return fake;
}

async function withHerdrBin(bin, fn) {
  const previous = process.env.FGOS_HERDR_BIN;
  process.env.FGOS_HERDR_BIN = bin;
  try {
    return await fn();
  } finally {
    if (previous === undefined) delete process.env.FGOS_HERDR_BIN;
    else process.env.FGOS_HERDR_BIN = previous;
  }
}

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const assignmentDir = (repoRoot, unitRunId, role, round) => path.join(repoRoot, '.fgos', 'assignments', unitRunId, role, String(round));
const runDirOf = (repoRoot, unitRunId, role, round, attempt = '01') => path.join(assignmentDir(repoRoot, unitRunId, role, round), 'runs', attempt);

const readOnlyUnit = (id) => ({ id, objective: 'Inspect the docs', capability: 'docs:write', writes: [], pattern: 'solo' });

test('with herdr present the run goes through a pane and the record says so', { skip: SKIP }, async () => {
  const { repoRoot, worktreeDir, signalDir } = setup(['alpha']);
  const fake = useFakeHerdr({ signalDir, panes: [{ awaitProbe: true }] });
  const res = await withHerdrBin(fake.herdrBin, () => runUnit({
    unitData: readOnlyUnit('u-herdr'),
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    session: { herdrPresent: true, headless: true },
  }));
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));

  // The transport and invocation are read from the files the run left, not from the return value.
  const assignment = readJson(path.join(assignmentDir(repoRoot, res.unitRunId, 'producer', 1), 'assignment.json'));
  assert.equal(assignment.binding.transport, 'herdr');
  assert.equal(assignment.binding.invocation, 'alpha-herdr');
  assert.equal(assignment.binding.provenance.transport.source, 'herdr-invocation-present');
  const runDir = runDirOf(repoRoot, res.unitRunId, 'producer', 1);
  assert.equal(readJson(path.join(runDir, 'dispatch-plan.json')).invocation.adapter, 'herdr-spawn');
  assert.equal(readJson(path.join(runDir, 'result.json')).adapter, 'herdr-spawn');
  const unitRecord = readJson(path.join(repoRoot, '.fgos', 'assignments', res.unitRunId, 'unit.json'));
  assert.equal(unitRecord.bindings['producer/1'][0].transport, 'herdr');
  assert.equal(unitRecord.bindings['producer/1'][0].invocation, 'alpha-herdr');

  const calls = fake.calls();
  assert.ok(calls.some((c) => c[0] === 'pane' && c[1] === 'split'), 'a pane must have been opened');
  assert.ok(calls.some((c) => c[0] === 'pane' && c[1] === 'run'), 'the agent must have been launched in the pane');
});

test('the agent in the pane runs inside the posture wrapper: repo read-only, run outbox writable', { skip: SKIP }, async () => {
  const { repoRoot, worktreeDir, signalDir } = setup(['alpha']);
  const fake = useFakeHerdr({ signalDir, panes: [{ awaitProbe: true }] });
  const res = await withHerdrBin(fake.herdrBin, () => runUnit({
    unitData: readOnlyUnit('u-herdr-ro'),
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    session: { herdrPresent: true, headless: true },
  }));
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));

  // argv of the process that really ran in the pane: bwrap with a read-only root, and the agent after it.
  const [pane] = Object.values(fake.panes());
  const argv = pane.lastArgv;
  assert.ok(Array.isArray(argv) && argv.length > 0, 'the pane process argv must have been observed');
  const roBind = argv.findIndex((a, i) => a === '--ro-bind' && argv[i + 1] === '/' && argv[i + 2] === '/');
  assert.ok(roBind >= 0, `argv must start the agent under a read-only root: ${argv.join(' ')}`);
  assert.ok(argv.includes('--tmpfs'), 'the sandbox keeps its own /tmp');
  const runDir = runDirOf(repoRoot, res.unitRunId, 'producer', 1);
  const outboxBind = argv.findIndex((a, i) => a === '--bind' && argv[i + 1] === path.join(runDir, 'outbox'));
  assert.ok(outboxBind >= 0, 'only the run outbox is bound writable');
  assert.ok(!argv.some((a, i) => a === '--bind' && (argv[i + 1] === fs.realpathSync(worktreeDir) || argv[i + 1] === fs.realpathSync(repoRoot))), 'a read-only posture binds no repo path writable');
  assert.ok(argv.includes('--') && argv.includes(path.join(repoRoot, 'sandboxed-agent.mjs')), 'the agent command follows the wrapper');

  // What the sandboxed agent itself saw when it tried to write.
  const probe = readJson(path.join(runDir, 'outbox', 'probe-results.json'));
  assert.match(probe.worktree, BLOCKED);
  assert.match(probe.main, BLOCKED);
  assert.equal(probe.outbox, 'ok');
  assert.equal(fs.existsSync(path.join(worktreeDir, 'probe-worktree.txt')), false);
});

test('a producer with declared writes writes in its worktree only, in a pane; its reviewer is read-only', { skip: SKIP }, async () => {
  const { repoRoot, worktreeDir, signalDir } = setup(['alpha', 'beta']);
  const fake = useFakeHerdr({ signalDir, panes: [{ awaitProbe: true }, { awaitProbe: true }] });
  const res = await withHerdrBin(fake.herdrBin, () => runUnit({
    unitData: { id: 'u-herdr-rw', objective: 'Write docs', capability: 'docs:write', writes: ['probe-worktree.txt'], pattern: 'reviewed' },
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    pattern: 'reviewed',
    session: { herdrPresent: true, headless: true },
  }));
  const producer = readJson(path.join(runDirOf(repoRoot, res.unitRunId, 'producer', 1), 'outbox', 'probe-results.json'));
  assert.equal(producer.worktree, 'ok');
  assert.match(producer.main, BLOCKED);
  assert.equal(producer.outbox, 'ok');
  assert.equal(fs.existsSync(path.join(worktreeDir, 'probe-worktree.txt')), true);
  assert.equal(fs.existsSync(path.join(repoRoot, 'probe-main.txt')), false);

  const reviewer = readJson(path.join(runDirOf(repoRoot, res.unitRunId, 'reviewer', 1), 'outbox', 'probe-results.json'));
  assert.match(reviewer.worktree, BLOCKED);
  assert.match(reviewer.main, BLOCKED);
  assert.equal(reviewer.outbox, 'ok');
});

/** Runs fn with HOME pointing at a scratch home whose global config carries the given runner section. */
async function withGlobalRunnerConfig(runner, fn) {
  const home = fixtureDir('fgos-global-home-');
  fs.mkdirSync(path.join(home, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(home, '.fgos', 'config.json'), JSON.stringify({ runner }, null, 2));
  const previous = process.env.HOME;
  process.env.HOME = home;
  try {
    return await fn(home);
  } finally {
    if (previous === undefined) delete process.env.HOME;
    else process.env.HOME = previous;
  }
}

const accountBinding = { resource: 'private-home', target: { kind: 'env', name: 'ACCOUNT_HOME' } };

test('a confined pane gets a private account home seeded from the leased account, and the real account stays untouched', { skip: SKIP }, async () => {
  const accountDir = fixtureDir('fgos-account-');
  fs.mkdirSync(path.join(accountDir, 'nested'), { recursive: true });
  fs.writeFileSync(path.join(accountDir, 'auth.json'), '{"token":"account-secret"}');
  fs.writeFileSync(path.join(accountDir, 'nested', 'settings.json'), '{"theme":"dark"}');
  fs.writeFileSync(path.join(accountDir, 'history.jsonl'), 'must not be copied');
  const realFiles = fs.readdirSync(accountDir).sort();
  const { repoRoot, worktreeDir, signalDir } = setup(['alpha'], {
    herdrExtra: {
      env: { ACCOUNT_HOME: accountDir, FAKE_ACCOUNT_HOME_VAR: 'ACCOUNT_HOME' },
      resourceBindings: [accountBinding],
    },
  });
  const fake = useFakeHerdr({ signalDir, panes: [{ awaitProbe: true }] });
  const res = await withGlobalRunnerConfig(
    { providers: { alpha: { accounts: { acct: { credentialSource: { kind: 'home-files', home: accountDir, files: ['auth.json', 'nested/settings.json'] } } } } } },
    () => withHerdrBin(fake.herdrBin, () => runUnit({
      unitData: readOnlyUnit('u-account-home'),
      repoRoot,
      cwd: worktreeDir,
      worktree: worktreeDir,
      session: { herdrPresent: true, headless: true },
    })),
  );
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));

  const runDir = runDirOf(repoRoot, res.unitRunId, 'producer', 1);
  const probe = readJson(path.join(runDir, 'outbox', 'probe-results.json'));
  assert.notEqual(probe.account.dir, accountDir, 'the agent runs with a private home, not the real account directory');
  assert.deepEqual(probe.account.files, ['auth.json', 'nested/settings.json'], 'exactly the listed files are provisioned');
  assert.equal(probe.account.contents['auth.json'], '{"token":"account-secret"}');
  assert.equal(probe.account.modes['auth.json'], '600', 'a credential is owner-only');
  assert.equal(probe.account.writable, 'ok', "the private home takes the agent's own state");
  // The posture is unchanged: the repository is still read-only.
  assert.match(probe.worktree, BLOCKED);
  assert.deepEqual(fs.readdirSync(accountDir).sort(), realFiles, 'the real account directory is not written to');
  assert.equal(fs.existsSync(probe.account.dir), false, 'the private home, which holds a copy of the credential, is removed when the run ends');

  // The run records which account served it, without the credential.
  const selection = readJson(path.join(runDir, 'provider-capacity-selection.json'));
  assert.equal(selection.accountId, 'acct');
  assert.equal(selection.credentialProvisioned, true, 'the evidence says the account login was provisioned');
  assert.equal(JSON.stringify(selection).includes('account-secret'), false);
});

test('a leased account whose credential file is missing refuses the pane before anything is launched', { skip: SKIP }, async () => {
  const accountDir = fixtureDir('fgos-account-empty-');
  const { repoRoot, worktreeDir, signalDir } = setup(['alpha'], {
    herdrExtra: {
      env: { ACCOUNT_HOME: accountDir, FAKE_ACCOUNT_HOME_VAR: 'ACCOUNT_HOME' },
      resourceBindings: [accountBinding],
    },
  });
  const fake = useFakeHerdr({ signalDir, panes: [{ awaitProbe: true }] });
  const res = await withGlobalRunnerConfig(
    { providers: { alpha: { accounts: { acct: { credentialSource: { kind: 'home-files', home: accountDir, files: ['auth.json'] } } } } } },
    () => withHerdrBin(fake.herdrBin, () => runUnit({
      unitData: readOnlyUnit('u-account-missing'),
      repoRoot,
      cwd: worktreeDir,
      worktree: worktreeDir,
      session: { herdrPresent: true, headless: true },
    })),
  );
  assert.notEqual(res.outcome, 'pass');
  assert.equal(fake.calls().filter((c) => c[0] === 'pane' && c[1] === 'run').length, 0, 'no agent may be launched without its credential');
});

test('a codex-style pane trusts its workspace in the private home and leaves the real account config alone', { skip: SKIP }, async () => {
  const accountDir = fixtureDir('fgos-account-trust-');
  fs.writeFileSync(path.join(accountDir, 'auth.json'), '{"token":"t"}');
  const { repoRoot, worktreeDir, signalDir } = setup(['alpha'], {
    herdrExtra: {
      env: { CODEX_HOME: accountDir, FAKE_ACCOUNT_HOME_VAR: 'CODEX_HOME' },
      resourceBindings: [{ resource: 'private-home', target: { kind: 'env', name: 'CODEX_HOME' } }],
      interactiveMode: { trustStore: { kind: 'codex-toml' } },
    },
  });
  // The person already trusted the repository root in the real account config.
  const realConfig = `[projects."${repoRoot}"]\ntrust_level = "trusted"\n`;
  fs.writeFileSync(path.join(accountDir, 'config.toml'), realConfig);
  const fake = useFakeHerdr({ signalDir, panes: [{ awaitProbe: true }] });
  const res = await withGlobalRunnerConfig(
    { providers: { alpha: { accounts: { acct: { credentialSource: { kind: 'home-files', home: accountDir, files: ['auth.json'] } } } } } },
    () => withHerdrBin(fake.herdrBin, () => runUnit({
      unitData: readOnlyUnit('u-account-trust'),
      repoRoot,
      cwd: worktreeDir,
      worktree: worktreeDir,
      session: { herdrPresent: true, headless: true },
    })),
  );
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));
  const probe = readJson(path.join(runDirOf(repoRoot, res.unitRunId, 'producer', 1), 'outbox', 'probe-results.json'));
  assert.match(probe.account.contents['config.toml'], new RegExp(`\\[projects\\."${worktreeDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\]`), 'the private config trusts the workspace the agent starts in');
  assert.equal(fs.readFileSync(path.join(accountDir, 'config.toml'), 'utf8'), realConfig, 'the real account config is not edited');
});

test('a read-only pane shares its checkout with another dispatch in flight; a writing one is still refused', { skip: SKIP }, async () => {
  const { repoRoot, worktreeDir, signalDir } = setup(['alpha']);
  // Another dispatch (a sibling panelist, say) holds this checkout right now.
  const held = acquireMainCheckoutLock(path.join(repoRoot, '.fgos'), {
    identity: `${process.pid}:test-holder`,
    ttlMs: 600000,
    lockFile: dispatchLockFile(path.resolve(worktreeDir)),
  });
  assert.equal(held.status, ACQUIRED);
  try {
    const fake = useFakeHerdr({ signalDir, panes: [{ awaitProbe: true }, { awaitProbe: true }] });
    const readOnly = await withHerdrBin(fake.herdrBin, () => runUnit({
      unitData: readOnlyUnit('u-shared-ro'),
      repoRoot,
      cwd: worktreeDir,
      worktree: worktreeDir,
      session: { herdrPresent: true, headless: true },
    }));
    assert.equal(readOnly.outcome, 'pass', JSON.stringify(readOnly.results[0]).slice(0, 1500));

    const writing = await withHerdrBin(fake.herdrBin, () => runUnit({
      unitData: { id: 'u-shared-rw', objective: 'Write docs', capability: 'docs:write', writes: ['probe-worktree.txt'], pattern: 'solo' },
      repoRoot,
      cwd: worktreeDir,
      worktree: worktreeDir,
      session: { herdrPresent: true, headless: true },
    }));
    assert.notEqual(writing.outcome, 'pass', 'a writer must not share the checkout with a dispatch in flight');
    assert.match(JSON.stringify(writing.results[0]), /already in flight/);
  } finally {
    held.release();
  }
});

test('headless (no herdr) runs cli-spawn with the same posture and never touches herdr', { skip: SKIP }, async () => {
  const { repoRoot, worktreeDir } = setup(['alpha']);
  const fake = useFakeHerdr({});
  const res = await withHerdrBin(fake.herdrBin, () => runUnit({
    unitData: readOnlyUnit('u-headless'),
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    session: { herdrPresent: false, headless: true },
  }));
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));
  const assignment = readJson(path.join(assignmentDir(repoRoot, res.unitRunId, 'producer', 1), 'assignment.json'));
  assert.equal(assignment.binding.transport, 'cli');
  assert.equal(assignment.binding.invocation, 'alpha-cli');
  assert.equal(assignment.binding.posture, 'read-only');
  const runDir = runDirOf(repoRoot, res.unitRunId, 'producer', 1);
  assert.equal(readJson(path.join(runDir, 'dispatch-plan.json')).invocation.adapter, 'cli-spawn');
  assert.equal(readJson(path.join(runDir, 'result.json')).adapter, 'cli-spawn');
  // The posture was applied: the confinement authority prepared a bwrap invocation for the run.
  const prepared = fs.readdirSync(path.join(runDir, 'protected', 'prepared-invocation')).map((f) => readJson(path.join(runDir, 'protected', 'prepared-invocation', f)));
  assert.equal(prepared[0].requirement.policyId, 'host-write-denied');
  assert.equal(prepared[0].backend.type, 'bwrap');
  assert.deepEqual(fake.calls(), [], 'no herdr call may be made without herdr');
});

test('a provider-limit screen moves the role to the next candidate in a new pane and keeps the old pane open', { skip: SKIP }, async () => {
  const { repoRoot, worktreeDir } = setup(['alpha', 'beta']);
  const fake = useFakeHerdr({
    panes: [{ limit: true }, {}],
    limitScreen: "You've hit your usage limit. Try again in 3h.",
  });
  const res = await withHerdrBin(fake.herdrBin, () => runUnit({
    unitData: readOnlyUnit('u-limit'),
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    session: { herdrPresent: true, headless: true },
  }));
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 2000));

  // Two panes: the limited one stayed open (never closed), the next candidate got its own.
  const splits = fake.calls().filter((c) => c[0] === 'pane' && c[1] === 'split');
  assert.equal(splits.length, 2);
  assert.ok(!fake.closedPaneIds().includes('mock-pane-1'), 'the limited pane must stay open');
  assert.ok(fake.closedPaneIds().includes('mock-pane-2'), 'the pane of the finished run closes normally');

  // The first attempt is on disk as a provider-limit failure; the second records where it came from.
  const first = readJson(path.join(runDirOf(repoRoot, res.unitRunId, 'producer', 1), 'result.json'));
  assert.equal(first.classification.outcome.category, 'infra');
  assert.equal(first.classification.failure.code, 'provider-limit');
  const secondAssignment = readJson(path.join(repoRoot, '.fgos', 'assignments', res.unitRunId, 'producer', '1-fb1', 'assignment.json'));
  assert.equal(secondAssignment.binding.executor, 'beta');
  assert.equal(secondAssignment.binding.transport, 'herdr');
  assert.equal(secondAssignment.binding.provenance.fallbackFrom.executor, 'alpha');
  assert.equal(secondAssignment.binding.provenance.fallbackFrom.reason, 'provider-limit');
  const unitRecord = readJson(path.join(repoRoot, '.fgos', 'assignments', res.unitRunId, 'unit.json'));
  const attempts = unitRecord.bindings['producer/1'];
  assert.deepEqual(attempts.map((a) => [a.binding.executor, a.outcome]), [['alpha', 'provider-limit'], ['beta', 'pass']]);
  assert.equal(attempts[1].fallbackFrom.executor, 'alpha');
});

const writerUnit = (id) => ({ id, objective: 'Write docs', capability: 'docs:write', writes: ['probe-worktree.txt'], pattern: 'solo' });
const LIMIT_SCREEN = "You've hit your usage limit. Try again in 3h.";

test('a writing producer that hits a provider limit falls back to the next candidate through the mutating gate', { skip: SKIP }, async () => {
  const { repoRoot, worktreeDir, signalDir } = setup(['alpha', 'beta']);
  const fake = useFakeHerdr({ signalDir, panes: [{ limit: true }, { awaitProbe: true }], limitScreen: LIMIT_SCREEN });
  const res = await withHerdrBin(fake.herdrBin, () => runUnit({
    unitData: writerUnit('u-limit-writer'),
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    session: { herdrPresent: true, headless: true },
  }));
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 2000));

  const unitRecord = readJson(path.join(repoRoot, '.fgos', 'assignments', res.unitRunId, 'unit.json'));
  const attempts = unitRecord.bindings['producer/1'];
  assert.deepEqual(attempts.map((a) => [a.binding.executor, a.outcome]), [['alpha', 'provider-limit'], ['beta', 'pass']]);
  assert.deepEqual(attempts.map((a) => [a.skipCandidateIndex, a.candidateIndex]), [[-1, 0], [0, 1]]);
  // The fallback attempt wrote in the worktree and the runner committed it.
  assert.equal(fs.existsSync(path.join(worktreeDir, 'probe-worktree.txt')), true);
  assert.equal(attempts[1].commit.status, 'committed');
});

test('a writing producer falls back along a chain of three candidates', { skip: SKIP }, async () => {
  const { repoRoot, worktreeDir, signalDir } = setup(['alpha', 'beta', 'gamma']);
  const fake = useFakeHerdr({ signalDir, panes: [{ limit: true }, { limit: true }, { awaitProbe: true }], limitScreen: LIMIT_SCREEN });
  const res = await withHerdrBin(fake.herdrBin, () => runUnit({
    unitData: writerUnit('u-limit-writer-chain'),
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    session: { herdrPresent: true, headless: true },
  }));
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 2000));
  const attempts = readJson(path.join(repoRoot, '.fgos', 'assignments', res.unitRunId, 'unit.json')).bindings['producer/1'];
  assert.deepEqual(attempts.map((a) => [a.binding.executor, a.outcome]), [['alpha', 'provider-limit'], ['beta', 'provider-limit'], ['gamma', 'pass']]);
  assert.deepEqual(attempts.map((a) => [a.skipCandidateIndex, a.candidateIndex]), [[-1, 0], [0, 1], [1, 2]]);
});

test('with no candidate left a provider limit stays a structured provider-limit outcome', { skip: SKIP }, async () => {
  const { repoRoot, worktreeDir } = setup(['alpha']);
  const fake = useFakeHerdr({ panes: [{ limit: true }], limitScreen: 'Rate limit reached, try again later.' });
  const res = await withHerdrBin(fake.herdrBin, () => runUnit({
    unitData: readOnlyUnit('u-nolimit-left'),
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    session: { herdrPresent: true, headless: true },
  }));
  assert.equal(res.outcome, 'provider-limit');
  assert.equal(res.results[0].fallbackExhausted.from.executor, 'alpha');
  assert.ok(res.results[0].fallbackExhausted.reason);
  assert.equal(fake.calls().filter((c) => c[0] === 'pane' && c[1] === 'split').length, 1, 'no second pane is opened');
  assert.ok(!fake.closedPaneIds().includes('mock-pane-1'));
});

test('a resumed run reuses the binding recorded in unit.json instead of binding again', { skip: SKIP }, async () => {
  const { repoRoot, worktreeDir } = setup(['alpha', 'beta']);
  const limited = useFakeHerdr({ panes: [{ limit: true }, { limit: true }], limitScreen: 'Usage limit reached.' });
  const first = await withHerdrBin(limited.herdrBin, () => runUnit({
    unitData: readOnlyUnit('u-resume'),
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    session: { herdrPresent: true, headless: true },
  }));
  assert.equal(first.outcome, 'provider-limit');
  const unitPath = path.join(repoRoot, '.fgos', 'assignments', first.unitRunId, 'unit.json');
  const before = readJson(unitPath).bindings['producer/1'];
  assert.deepEqual(before.map((a) => a.binding.executor), ['alpha', 'beta']);

  // The provider answers again; the resume continues with the last recorded binding (beta).
  const healthy = useFakeHerdr({});
  const resumed = await withHerdrBin(healthy.herdrBin, () => runUnit({
    resumeUnitRunId: first.unitRunId,
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    session: { herdrPresent: true, headless: true },
  }));
  assert.equal(resumed.outcome, 'pass', JSON.stringify(resumed.results[0]).slice(0, 1500));
  const after = readJson(unitPath).bindings['producer/1'];
  assert.equal(after.length, before.length, 'resume must not bind again');
  assert.equal(after[1].binding.executor, 'beta');
  assert.equal(resumed.results[0].binding.executor, 'beta');
});

test('guards: the run path reads bound.transport and calls nextCandidate', () => {
  const runSource = fs.readFileSync(new URL('../../../src/runner/execution/run.mjs', import.meta.url), 'utf8');
  assert.match(runSource, /bound\.transport/);
  assert.match(runSource, /nextCandidate\(/);
});

// ---------------------------------------------------------------------------------------------
// Delivering the brief to an interactive agent in a pane.
// ---------------------------------------------------------------------------------------------

const promptCalls = (fake) => fake.calls().filter((c) => c[0] === 'agent' && c[1] === 'prompt' && !String(c[3] ?? '').startsWith('/'));
const enterCalls = (fake) => fake.calls().filter((c) => c[0] === 'agent' && c[1] === 'send-keys' && c.slice(3).includes('Enter'));

test('a brief whose submit key was lost stays an unsent draft and is submitted with Enter, not by hand', { skip: SKIP }, async () => {
  const { repoRoot, worktreeDir, signalDir } = setup(['alpha']);
  const fake = useFakeHerdr({ signalDir, panes: [{ awaitProbe: true, swallowEnter: 2 }] });
  const res = await withHerdrBin(fake.herdrBin, () => runUnit({
    unitData: readOnlyUnit('u-submit-lost'),
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    session: { herdrPresent: true, headless: true },
  }));
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));

  assert.equal(promptCalls(fake).length, 1, 'the brief is typed once, never typed again on top of its own draft');
  assert.equal(enterCalls(fake).length, 2, 'Enter is pressed until the draft is taken: first press lost, second accepted');
  const [pane] = Object.values(fake.panes());
  assert.equal(pane.draft, null, 'no unsent draft is left in the prompt box');
  const visibility = readJson(path.join(runDirOf(repoRoot, res.unitRunId, 'producer', 1), 'visibility.json'));
  assert.equal(visibility.briefSubmitKeyResent, 2);
});

test('the brief is typed only after the agent UI is up, so the submit key is not lost to a UI still starting', { skip: SKIP }, async () => {
  const { repoRoot, worktreeDir, signalDir } = setup(['alpha']);
  const fake = useFakeHerdr({ signalDir, panes: [{ awaitProbe: true, startupPolls: 3 }] });
  const res = await withHerdrBin(fake.herdrBin, () => runUnit({
    unitData: readOnlyUnit('u-submit-ready'),
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    session: { herdrPresent: true, headless: true },
  }));
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));

  const [pane] = Object.values(fake.panes());
  assert.equal(pane.prompts.length, 1);
  assert.ok(pane.prompts[0].explainCallsBefore >= 3, `typed after the detector stopped saying "unknown" (explain calls before typing: ${pane.prompts[0].explainCallsBefore})`);
  assert.equal(enterCalls(fake).length, 0, 'nothing needed re-submitting');
  const visibility = readJson(path.join(runDirOf(repoRoot, res.unitRunId, 'producer', 1), 'visibility.json'));
  assert.equal(visibility.promptReadiness, 'ready');
});

test('a claude REPL in a pane is given the run directory as a working directory; no other agent kind is', { skip: SKIP }, async () => {
  for (const [agentKind, expectAddDir] of [['claude', true], ['fakeagent', false]]) {
    const { repoRoot, worktreeDir, signalDir } = setup(['alpha'], { agentKind });
    const fake = useFakeHerdr({ signalDir, panes: [{ awaitProbe: true }] });
    const res = await withHerdrBin(fake.herdrBin, () => runUnit({
      unitData: readOnlyUnit(`u-add-dir-${agentKind}`),
      repoRoot,
      cwd: worktreeDir,
      worktree: worktreeDir,
      session: { herdrPresent: true, headless: true },
    }));
    assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));
    const [pane] = Object.values(fake.panes());
    const runDir = runDirOf(repoRoot, res.unitRunId, 'producer', 1);
    const i = pane.lastArgv.indexOf('--add-dir');
    if (expectAddDir) {
      assert.ok(i > pane.lastArgv.indexOf('--'), 'the flag goes to the agent, after the sandbox wrapper');
      assert.equal(pane.lastArgv[i + 1], runDir);
      assert.equal(pane.lastArgv.filter((a) => a === '--add-dir').length, 1, 'only the run directory is added');
    } else {
      assert.equal(i, -1);
    }
    // The posture is untouched: the run outbox is still the only writable bind.
    assert.ok(!pane.lastArgv.some((a, k) => a === '--bind' && pane.lastArgv[k + 1] === fs.realpathSync(worktreeDir)));
  }
});

test('withRunDirReadAccess adds the run directory for a herdr claude invocation only, once', () => {
  const base = ['--model', 'sonnet'];
  const claude = { adapter: 'herdr-spawn', interactiveMode: { kind: 'claude' }, args: base, runDir: '/store/run/01' };
  assert.deepEqual(withRunDirReadAccess(claude), ['--model', 'sonnet', '--add-dir', '/store/run/01']);
  assert.deepEqual(withRunDirReadAccess({ ...claude, args: [...base, '--add-dir', '/elsewhere'] }), [...base, '--add-dir', '/elsewhere']);
  assert.equal(withRunDirReadAccess({ ...claude, interactiveMode: { kind: 'codex' } }), base);
  assert.equal(withRunDirReadAccess({ ...claude, adapter: 'cli-spawn' }), base);
  assert.equal(withRunDirReadAccess({ ...claude, runDir: undefined }), base);
  assert.deepEqual(base, ['--model', 'sonnet'], 'the configured args are not mutated');
});

test('the brief a reviewer reads in a pane says its claim needs assessment.verdict; the producer\'s does not', { skip: SKIP }, async () => {
  const { repoRoot, worktreeDir, signalDir } = setup(['alpha', 'beta']);
  const fake = useFakeHerdr({ signalDir, panes: [{ awaitProbe: true }, { awaitProbe: true }] });
  const res = await withHerdrBin(fake.herdrBin, () => runUnit({
    unitData: { id: 'u-brief-verdict', objective: 'Write docs', capability: 'docs:write', writes: ['probe-worktree.txt'], pattern: 'reviewed' },
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    pattern: 'reviewed',
    session: { herdrPresent: true, headless: true },
  }));
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));
  const producerBrief = fs.readFileSync(path.join(runDirOf(repoRoot, res.unitRunId, 'producer', 1), 'brief-1.md'), 'utf8');
  const reviewerBrief = fs.readFileSync(path.join(runDirOf(repoRoot, res.unitRunId, 'reviewer', 1), 'brief-1.md'), 'utf8');
  assert.match(reviewerBrief, /"assessment\.verdict" is required for this assessment role/);
  assert.doesNotMatch(producerBrief, /assessment\.verdict/);
});

test('a confined launch reports no state of its own: herdr detects the agent, so its status stays true', { skip: SKIP }, async () => {
  const { repoRoot, worktreeDir, signalDir } = setup(['alpha', 'beta']);
  const fake = useFakeHerdr({ signalDir, panes: [{ awaitProbe: true }, { awaitProbe: true }] });
  const res = await withHerdrBin(fake.herdrBin, () => runUnit({
    unitData: readOnlyUnit('u-no-reported-state'),
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    session: { herdrPresent: true, headless: true },
  }));
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 1500));
  const reported = fake.calls().filter((c) => c[0] === 'pane' && String(c[1]).startsWith('report-agent'));
  assert.deepEqual(reported, [], 'a state fgos reported would freeze `agent get` and hide what the agent is really doing');
});

test('a confined pane stopped on a limit screen is seen as stopped and the next executor takes over', { skip: SKIP }, async () => {
  const { repoRoot, worktreeDir } = setup(['alpha', 'beta']);
  const fake = useFakeHerdr({
    panes: [{ limit: true, detector: true }, {}],
    limitScreen: "You've hit your usage limit. Try again in 3h.",
  });
  const res = await withHerdrBin(fake.herdrBin, () => runUnit({
    unitData: readOnlyUnit('u-limit-native-status'),
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    session: { herdrPresent: true, headless: true },
  }));
  assert.equal(res.outcome, 'pass', JSON.stringify(res.results[0]).slice(0, 2000));
  const first = readJson(path.join(runDirOf(repoRoot, res.unitRunId, 'producer', 1), 'result.json'));
  assert.equal(first.classification.failure.code, 'provider-limit');
  const unitRecord = readJson(path.join(repoRoot, '.fgos', 'assignments', res.unitRunId, 'unit.json'));
  assert.deepEqual(unitRecord.bindings['producer/1'].map((a) => [a.binding.executor, a.outcome]), [['alpha', 'provider-limit'], ['beta', 'pass']]);
  assert.ok(!fake.closedPaneIds().includes('mock-pane-1'), 'the limited pane stays open');
});
