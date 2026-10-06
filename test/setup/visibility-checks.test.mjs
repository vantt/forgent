import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  checkHerdrAvailable,
  checkTrustStoreWritable,
  checkExecutorConfinement,
  checkInvocationGitWriteGrants,
  checkConfinedPaneAccounts,
  checkHerdrExecutorKinds,
  readHerdrAgentKinds,
  readHerdrIntegrationStatus,
} from '../../src/setup/registrations.mjs';

// Phase 01 group D. These are the checks that turn "the machine is not set up for
// interactive dispatch" from a runtime surprise into a doctor line.
//
// Each one exists because its absence was measured, not imagined: without herdr
// there is no transport at all; without a readable trust store every dispatch into
// a fresh worktree stops at a folder dialog; and a bypass executor missing its
// confinement is the one configuration this phase refuses outright, so doctor
// should say so on a machine where it slipped in some other way.

test('checkHerdrAvailable reports a structured pass or fail, never throws', () => {
  const r = checkHerdrAvailable();
  assert.equal(typeof r.passed, 'boolean');
  assert.ok(typeof r.message === 'string' && r.message.length > 0);
});

test('checkTrustStoreWritable passes for a readable store and fails by name for a broken one', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-doctor-trust-'));
  try {
    const good = path.join(dir, 'good.json');
    fs.writeFileSync(good, JSON.stringify({ projects: {} }));
    assert.equal(checkTrustStoreWritable(good).passed, true);

    const bad = path.join(dir, 'bad.json');
    fs.writeFileSync(bad, 'not json at all');
    const badResult = checkTrustStoreWritable(bad);
    assert.equal(badResult.passed, false);
    assert.match(badResult.message, /not valid JSON|unreadable/i);

    const missing = path.join(dir, 'nope.json');
    assert.equal(checkTrustStoreWritable(missing).passed, false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('checkExecutorConfinement passes when no executor declares bypass', () => {
  const r = checkExecutorConfinement({ executors: { a: { kind: 'agent' }, b: { kind: 'agent', permissionMode: 'ask' } } });
  assert.equal(r.passed, true);
});

test('checkExecutorConfinement passes for a fully confined bypass executor', () => {
  const r = checkExecutorConfinement({
    executors: { a: { kind: 'agent', permissionMode: 'bypass', confinement: { privateHome: true, isolatedSession: true, ownWorktree: true } } },
  });
  assert.equal(r.passed, true);
});

test('checkExecutorConfinement passes for a bypass executor with normalized controls', () => {
  const r = checkExecutorConfinement({
    executors: {
      a: {
        kind: 'agent',
        permissionMode: 'bypass',
        confinement: {
          contract: 'confinement-policy.v1',
          controls: { home: 'private', session: 'isolated', workspace: 'own' },
        },
      },
    },
  });
  assert.equal(r.passed, true);
});

test('checkExecutorConfinement fails and names the executor and the missing flags', () => {
  const r = checkExecutorConfinement({
    executors: {
      safe: { kind: 'agent', permissionMode: 'ask' },
      risky: { kind: 'agent', permissionMode: 'bypass', confinement: { privateHome: true } },
    },
  });
  assert.equal(r.passed, false);
  assert.match(r.message, /risky/, 'the offending executor is named');
  assert.match(r.message, /isolatedSession/, 'the missing flags are named');
  assert.doesNotMatch(r.message, /safe/, 'a compliant executor is not dragged into the message');
});

test('checkExecutorConfinement tolerates a config with no executors at all', () => {
  assert.equal(checkExecutorConfinement({}).passed, true);
  assert.equal(checkExecutorConfinement({ executors: {} }).passed, true);
});

// Phase 05 group R3. herdr owns the list of agent kinds it can start and the
// version of each integration hook; both are read from herdr's own commands
// rather than copied into this repo, where a copy would go stale in silence.

const HERDR_HELP = 'Options:\n      --kind <KIND>\n          [possible values: pi, claude, codex, agy, gemini]\n';
const HERDR_STATUS = [
  'claude: current (v8) (/home/u/.claude/hooks/herdr-agent-state.sh)',
  'codex: outdated (v6 < v8) (/home/u/.codex/herdr-agent-state.sh)',
  'antigravity-cli: not installed (/home/u/.gemini/config/hooks/herdr-agent-state.sh)',
].join('\n');

const herdrExecutor = (id, { kind, command = 'claude' } = {}) => ({
  [id]: {
    kind: 'agent',
    invocations: [{
      via: 'cli',
      adapter: 'herdr-spawn',
      command,
      args: [],
      interactiveMode: { exitCommand: '/exit', ...(kind ? { kind } : {}) },
    }],
  },
});

const parsed = { kinds: ['pi', 'claude', 'codex', 'agy', 'gemini'], integrations: { claude: 'current', codex: 'outdated', 'antigravity-cli': 'not installed' } };

test('readHerdrAgentKinds parses the list out of the command that enforces it', () => {
  assert.deepEqual(readHerdrAgentKinds(() => HERDR_HELP), ['pi', 'claude', 'codex', 'agy', 'gemini']);
  assert.equal(readHerdrAgentKinds(() => null), null, 'herdr absent is not this check\'s problem to report');
  assert.equal(readHerdrAgentKinds(() => 'no possible values here'), null);
});

test('readHerdrIntegrationStatus reads each hook state, ignoring the paths after it', () => {
  assert.deepEqual(readHerdrIntegrationStatus(() => HERDR_STATUS), {
    claude: 'current', codex: 'outdated', 'antigravity-cli': 'not installed',
  });
  assert.equal(readHerdrIntegrationStatus(() => null), null);
});

test('a config with no herdr executor has nothing to check', () => {
  assert.equal(checkHerdrExecutorKinds({ executors: { a: { kind: 'agent' } } }, parsed).passed, true);
  assert.equal(checkHerdrExecutorKinds({}, parsed).passed, true);
});

test('an agent kind herdr cannot start fails and names both the executor and the real list', () => {
  const r = checkHerdrExecutorKinds({ executors: herdrExecutor('weird', { kind: 'notreal' }) }, parsed);
  assert.equal(r.passed, false);
  assert.match(r.message, /weird/);
  assert.match(r.message, /notreal/);
  assert.match(r.message, /claude/, 'and says what herdr does support');
});

test('an undeclared kind falls back to the command basename, and passes when that is a real kind', () => {
  const r = checkHerdrExecutorKinds({ executors: herdrExecutor('claude-herdr', { command: '/usr/bin/claude' }) }, parsed);
  assert.equal(r.passed, true);
});

test('an outdated integration hook fails -- it is installed, so herdr believes it, and it is wrong', () => {
  const r = checkHerdrExecutorKinds({ executors: herdrExecutor('codex-herdr', { kind: 'codex' }) }, parsed);
  assert.equal(r.passed, false);
  assert.match(r.message, /outdated/);
  assert.match(r.message, /codex-herdr/);
  assert.match(r.message, /herdr integration install/, 'and says how to fix it');
});

test('a missing hook only notes itself -- nothing in this dispatch path concludes from agent state any more', () => {
  // herdr spells the Antigravity CLI `agy` when starting an agent and
  // `antigravity-cli` when installing its hook; the check bridges the two.
  const r = checkHerdrExecutorKinds({ executors: herdrExecutor('agy-herdr', { kind: 'agy', command: 'agy' }) }, parsed);
  assert.equal(r.passed, true);
  assert.match(r.message, /antigravity-cli/);
  assert.match(r.message, /no .* integration hook installed/);
});

test('when herdr cannot be asked, kinds are not evaluated rather than guessed', () => {
  const r = checkHerdrExecutorKinds({ executors: herdrExecutor('claude-herdr', { kind: 'claude' }) }, { kinds: null });
  assert.equal(r.passed, true);
  assert.match(r.message, /not evaluated/);
});

test('checkHerdrAvailable respects FGOS_HERDR_BIN override (R6)', () => {
  const oldBin = process.env.FGOS_HERDR_BIN;
  try {
    process.env.FGOS_HERDR_BIN = '/no/such/custom-herdr-bin';
    const r = checkHerdrAvailable();
    assert.equal(r.passed, false);
    assert.match(r.message, /\/no\/such\/custom-herdr-bin/);
  } finally {
    if (oldBin === undefined) delete process.env.FGOS_HERDR_BIN;
    else process.env.FGOS_HERDR_BIN = oldBin;
  }
});

test('checkHerdrAvailable diagnoses empty FGOS_HERDR_ANCHOR_PANE (R6)', { skip: process.platform === 'win32' && 'mockHerdr is a POSIX script -- production spawns a real herdr.exe on Windows with shell:false, which this test-only wrapper cannot emulate without weakening that deliberate no-shell contract' }, () => {
  // A bare 'herdr' is never guaranteed to be on PATH (it isn't in CI, which
  // never installs the compiled binary there) -- mock FGOS_HERDR_BIN the
  // same way the neighboring F5 test does, so this test exercises the
  // empty-anchor-pane diagnostic itself rather than the host's PATH.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-mock-'));
  const mockScript = path.join(tmp, 'mock-herdr.mjs');
  fs.writeFileSync(mockScript, `#!/usr/bin/env node
if (process.argv[2] === '--version') {
  process.stdout.write('herdr 0.8.0\\n');
  process.exit(0);
}
process.exit(0);
`, { mode: 0o755 });

  const oldBin = process.env.FGOS_HERDR_BIN;
  const oldPane = process.env.FGOS_HERDR_ANCHOR_PANE;
  try {
    process.env.FGOS_HERDR_BIN = mockScript;
    process.env.FGOS_HERDR_ANCHOR_PANE = '   ';
    const r = checkHerdrAvailable();
    assert.equal(r.passed, false);
    assert.match(r.message, /FGOS_HERDR_ANCHOR_PANE is empty/);
  } finally {
    if (oldBin === undefined) delete process.env.FGOS_HERDR_BIN;
    else process.env.FGOS_HERDR_BIN = oldBin;
    if (oldPane === undefined) delete process.env.FGOS_HERDR_ANCHOR_PANE;
    else process.env.FGOS_HERDR_ANCHOR_PANE = oldPane;
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('checkHerdrAvailable fails closed when FGOS_HERDR_ANCHOR_PANE cannot be resolved (F5)', { skip: process.platform === 'win32' && 'mockHerdr is a POSIX script -- production spawns a real herdr.exe on Windows with shell:false, which this test-only wrapper cannot emulate without weakening that deliberate no-shell contract' }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'herdr-mock-'));
  const mockScript = path.join(tmp, 'mock-herdr.mjs');
  fs.writeFileSync(mockScript, `#!/usr/bin/env node
if (process.argv[2] === '--version') {
  process.stdout.write('herdr 0.8.0\\n');
  process.exit(0);
}
if (process.argv[2] === 'pane' && process.argv[3] === 'get') {
  process.stderr.write('error: pane not found\\n');
  process.exit(1);
}
process.exit(0);
`, { mode: 0o755 });

  const oldBin = process.env.FGOS_HERDR_BIN;
  const oldPane = process.env.FGOS_HERDR_ANCHOR_PANE;
  try {
    process.env.FGOS_HERDR_BIN = mockScript;
    process.env.FGOS_HERDR_ANCHOR_PANE = 'non-existent-pane-12345';
    const r = checkHerdrAvailable();
    assert.equal(r.passed, false);
    assert.match(r.message, /cannot be resolved/);
  } finally {
    if (oldBin === undefined) delete process.env.FGOS_HERDR_BIN;
    else process.env.FGOS_HERDR_BIN = oldBin;
    if (oldPane === undefined) delete process.env.FGOS_HERDR_ANCHOR_PANE;
    else process.env.FGOS_HERDR_ANCHOR_PANE = oldPane;
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// A confined pane that binds a private home gets its login only from the global provider account
// inventory. Doctor says so per invocation instead of letting a run sit at a sign-in screen.
function paneExecutors(providerModel = 'openai') {
  return {
    executors: {
      openai: {
        providerModel,
        invocations: [
          { id: 'codex-herdr', adapter: 'herdr-spawn', resourceBindings: [{ resource: 'private-home', target: { kind: 'env', name: 'CODEX_HOME' } }] },
          { id: 'codex-cli', adapter: 'cli-spawn' },
        ],
      },
    },
  };
}

test('checkConfinedPaneAccounts fails by name when a private-home pane has no account inventory', () => {
  const r = checkConfinedPaneAccounts(paneExecutors());
  assert.equal(r.passed, false);
  assert.match(r.message, /executor "openai" invocation "codex-herdr": no runner\.providers\.openai-codex\.accounts/);
  assert.doesNotMatch(r.message, /codex-cli/, 'only invocations that bind a private home are checked');
});

test('checkConfinedPaneAccounts passes when every listed credential file exists, and names a missing one', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-pane-accounts-'));
  try {
    fs.writeFileSync(path.join(home, 'auth.json'), '{}');
    const withInventory = (source) => ({ ...paneExecutors(), providers: { openai: { accounts: { acct: { credentialSource: source } } } } });
    assert.equal(checkConfinedPaneAccounts(withInventory({ kind: 'codex-home', home })).passed, true);
    assert.equal(checkConfinedPaneAccounts(withInventory({ kind: 'home-files', home, files: ['auth.json'] })).passed, true);
    const missing = checkConfinedPaneAccounts(withInventory({ kind: 'home-files', home, files: ['auth.json', 'models.json'] }));
    assert.equal(missing.passed, false);
    assert.match(missing.message, /account "acct" is missing models\.json/);
    const invalid = checkConfinedPaneAccounts(withInventory({ kind: 'home-files', home }));
    assert.equal(invalid.passed, false);
    assert.match(invalid.message, /provider account inventory is invalid/);
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test('checkConfinedPaneAccounts has nothing to say when no herdr invocation binds a private home', () => {
  const r = checkConfinedPaneAccounts({ executors: { a: { invocations: [{ id: 'x', adapter: 'herdr-spawn' }] } } });
  assert.equal(r.passed, true);
  assert.match(r.message, /no confined herdr invocation binds a private home/);
});

test('checkInvocationGitWriteGrants passes when no executor or invocation grants git add/commit', () => {
  const r = checkInvocationGitWriteGrants({
    executor: { command: 'claude', args: ['-p', '{prompt}', '--permission-mode', 'acceptEdits'] },
    executors: { a: { invocations: [{ id: 'x', args: ['--allowedTools', 'Bash(rg:*)'] }] } },
  });
  assert.equal(r.passed, true);
  assert.doesNotMatch(r.message, /warning/);
});

test('checkInvocationGitWriteGrants warns, naming each executor and invocation that still grants git add/commit (bare or rtk-wrapped)', () => {
  const r = checkInvocationGitWriteGrants({
    executor: { command: 'claude', args: ['--allowedTools', 'Bash(git add:*),Bash(git commit:*)'] },
    executors: {
      claude: { invocations: [{ id: 'claude-cli', args: ['--allowedTools', 'Bash(rtk git commit:*)'] }, { id: 'clean', args: ['--allowedTools', 'Bash(rg:*)'] }] },
    },
  });
  assert.equal(r.passed, true, 'a warning never fails doctor');
  assert.match(r.message, /^warning: /);
  assert.match(r.message, /executor,/);
  assert.match(r.message, /executors\.claude\.invocations\.claude-cli/);
  assert.doesNotMatch(r.message, /clean/);
});
