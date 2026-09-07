import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  checkHerdrAvailable,
  checkTrustStoreWritable,
  checkExecutorConfinement,
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
