// test/runner/provider-auth-failure.test.mjs -- the dead-credential wordings shared by the pane
// liveness ladder, the provider capacity classifier and the run settlement.

import test from 'node:test';
import assert from 'node:assert/strict';

import { AUTH_FAILURE_TAIL_LINES, matchAuthFailureLine, matchQuotaLimitLine } from '../../src/runner/dispatch/provider-auth-failure.mjs';
import { classifyProviderCapacityFault } from '../../src/runner/dispatch/provider-capacity.mjs';

const PI_STDERR = 'No API key found for openrouter.\n\nUse /login to log into a provider via OAuth or API key.\n';

test('a missing key as pi prints it is a dead credential, whatever the provider is called', () => {
  assert.equal(matchAuthFailureLine(PI_STDERR), 'No API key found for openrouter.');
  assert.equal(matchAuthFailureLine('Error: No API key found for xai'), 'Error: No API key found for xai');
});

test('ordinary output that merely mentions keys or logins is not a dead credential', () => {
  for (const text of [
    'The test checks that "No API key found for x" is reported',
    'I set the API key and it works',
    'No API key found',
    'key rotation finished; logged in as the service account',
    '',
  ]) {
    assert.equal(matchAuthFailureLine(text), null, text);
  }
  assert.equal(matchAuthFailureLine(undefined), null);
});

test('with a tail window only the last lines of a process count, so an old log line does not', () => {
  const longLog = ['No API key found for openrouter.', ...Array.from({ length: 20 }, (_, i) => `step ${i} done`)].join('\n');
  assert.notEqual(matchAuthFailureLine(longLog), null, 'without a window the whole text is read');
  assert.equal(matchAuthFailureLine(longLog, { tailLines: AUTH_FAILURE_TAIL_LINES }), null);
  assert.equal(matchAuthFailureLine(`${longLog}\n${PI_STDERR}`, { tailLines: AUTH_FAILURE_TAIL_LINES }), 'No API key found for openrouter.');
});

test('a round that stopped on a missing key quarantines the account as an auth fault for any provider', () => {
  const fault = classifyProviderCapacityFault({ provider: 'openrouter', stderr: PI_STDERR, adapterOutcome: 'provider-limit' });
  assert.equal(fault.action, 'quarantine');
  assert.equal(fault.reasonCode, 'auth-token');
  assert.equal(fault.quarantineKind, 'manual-clear');
});

test('a stop on a quota keeps its quota classification when the text has no dead credential', () => {
  const fault = classifyProviderCapacityFault({ provider: 'openrouter', stderr: 'rate limit reached, try again later', adapterOutcome: 'provider-limit' });
  assert.equal(fault.reasonCode, 'quota-limit');
});

// Measured 2026-10-13: the end of a codex round cut off by the account's usage limit.
const CODEX_QUOTA_LINE = 'ERROR: You’ve hit your usage limit. Upgrade to Pro (https://chatgpt.com/explore/pro), visit https://chatgpt.com/codex/settings/usage to purchase more credits or try again at 11:39 PM.';
const CODEX_QUOTA_STDERR = `exec\nsucceeded in 480ms:\n${CODEX_QUOTA_LINE}\n${CODEX_QUOTA_LINE}\ntokens used\n379,854\n`;

test('the usage-limit line codex prints as its last words is a quota stop', () => {
  assert.equal(matchQuotaLimitLine(CODEX_QUOTA_STDERR, { tailLines: AUTH_FAILURE_TAIL_LINES }), CODEX_QUOTA_LINE);
  assert.equal(matchAuthFailureLine(CODEX_QUOTA_STDERR, { tailLines: AUTH_FAILURE_TAIL_LINES }), null);
});

test('a usage-limit wording quoted inside other text, or far up a long log, is not a quota stop', () => {
  assert.equal(matchQuotaLimitLine('grep: docs say "You’ve hit your usage limit"\n'), null);
  assert.equal(matchQuotaLimitLine('the usage limit has been reached in the fixture\n'), null);
  const old = [CODEX_QUOTA_LINE, ...Array.from({ length: 20 }, (_, i) => `line ${i}`)].join('\n');
  assert.equal(matchQuotaLimitLine(old, { tailLines: AUTH_FAILURE_TAIL_LINES }), null);
});

// Codex streams the agent's whole transcript to stderr, so a login wording far
// up the log may be the agent quoting it; the provider's own last words decide.
const CODEX_QUOTA = 'ERROR: You’ve hit your usage limit. Upgrade to Pro (https://chatgpt.com/explore/pro), visit https://chatgpt.com/codex/settings/usage to purchase more credits or try again at 11:39 PM.';
const TRANSCRIPT_WITH_OLD_LOGIN_LINE = [
  'exec', 'Error: authentication failed for registry fixture', 'a', 'b', 'c', 'd', 'e', 'f',
  CODEX_QUOTA, CODEX_QUOTA, 'tokens used', '379,854', '',
].join('\n');

test('a quota stop whose transcript mentions a failed login earlier stays a quota stop with a reset time', () => {
  const fault = classifyProviderCapacityFault({
    provider: 'openai-codex',
    stderr: TRANSCRIPT_WITH_OLD_LOGIN_LINE,
    adapterOutcome: 'provider-limit',
  });
  assert.equal(fault.reasonCode, 'quota-limit');
  assert.equal(fault.quarantineKind, 'temporary');
  assert.ok(fault.until, 'a quota quarantine always ends');
});

test('a settled quota stop whose transcript mentions a failed login earlier names quota as its cause', async () => {
  const fs = await import('node:fs');
  const os = await import('node:os');
  const path = await import('node:path');
  const { execFileSync } = await import('node:child_process');
  const { settleRunOutcome } = await import('../../src/runner/dispatch/assignment-runner.mjs');
  const { acquireRunControl } = await import('../../src/runner/dispatch/run-lock.mjs');
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-quota-transcript-'));
  try {
    const cwd = path.join(base, 'repo');
    fs.mkdirSync(cwd);
    const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
    git('init', '-q'); git('config', 'user.email', 't@example.com'); git('config', 'user.name', 'T');
    fs.writeFileSync(path.join(cwd, 'plan.md'), 'x\n');
    git('add', '.'); git('commit', '-qm', 'init');
    const runDir = path.join(base, 'run');
    fs.mkdirSync(runDir, { recursive: true });
    const { controlToken } = acquireRunControl(runDir, { controllerId: 'quota-test' });
    const { runResult } = await settleRunOutcome({
      runDir,
      runMeta: { runId: 'run_quota_01', assignmentId: 'asgn_quota' },
      assignment: { assignmentId: 'asgn_quota', role: 'reviewer', operation: 'validate-plan', mutation: 'read-only' },
      controlEpoch: 1,
      controlToken,
      exitCode: 1,
      stderrText: TRANSCRIPT_WITH_OLD_LOGIN_LINE,
      settledAt: new Date().toISOString(),
      effectiveCwd: cwd,
      gitBefore: git('rev-parse', 'HEAD'),
      dirtyBefore: [],
      opts: { cwd, repoRoot: base },
    });
    assert.equal(runResult.classification.failure.code, 'provider-limit');
    assert.equal(runResult.classification.failure.cause, 'quota');
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});
