// The account probe starts every CLI of one provider account at once through the dispatch door and
// tells an account fault from a CLI fault. Everything here runs against fixtures: the Assignment
// door, the id claim and the pane close are injected.

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  accountInvocations, classifyAccountProbe, accountProbeVerdict, configPinnedToAccount, runAccountProbe,
} from '../../src/runner/dispatch/provider-account-probe.mjs';

const dirs = [];
const tmp = (prefix) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  dirs.push(dir);
  return dir;
};
after(() => { for (const d of dirs) fs.rmSync(d, { recursive: true, force: true }); });

const pi = (id, extra = {}) => ({ id, via: 'cli', adapter: 'cli-spawn', command: 'pi', args: ['-p', '{prompt}'], ...extra });
const cfg = {
  providers: {
    openai: { accounts: { acct: { label: 'acct', credentialSource: { kind: 'codex-home', home: '/homes/codex-acct' } } } },
  },
  executors: {
    openai: {
      kind: 'agent',
      providerModel: 'openai',
      invocations: [
        { id: 'codex-cli-plain-other', via: 'cli', adapter: 'cli-spawn', command: 'codex', args: [], env: { CODEX_HOME: '/homes/codex-other' } },
        { id: 'codex-cli-own-home', via: 'cli', adapter: 'cli-spawn', command: 'codex', args: [], env: { CODEX_HOME: '/homes/codex-acct' } },
        {
          id: 'codex-herdr-static', via: 'cli', adapter: 'herdr-spawn', command: 'codex', args: [],
          confinement: { backend: 'bwrap' }, env: { CODEX_HOME: '/homes/codex-other' },
          resourceBindings: [{ resource: 'private-home', target: { kind: 'env', name: 'CODEX_HOME' } }],
        },
        pi('pi-cli-acct', { env: { PI_CODING_AGENT_DIR: '/homes/pi-acct' } }),
        pi('pi-cli-other', { env: { PI_CODING_AGENT_DIR: '/homes/pi-other' } }),
        pi('pi-cli-bwrap-acct', { confinement: { backend: 'bwrap' } }),
      ],
    },
    gemini: { kind: 'agent', providerModel: 'gemini', invocations: [pi('agy-cli-acct')] },
  },
};

test('the invocations of an account are the leased confined ones, the ones whose env names its home, and the ones named for it', () => {
  const plan = accountInvocations(cfg, { provider: 'openai', accountId: 'acct' });
  assert.equal(plan.provider, 'openai-codex');
  assert.deepEqual(plan.invocations.map((i) => [i.invocationId, i.via]), [
    ['codex-cli-own-home', 'env'],
    ['codex-herdr-static', 'lease'],
    ['pi-cli-acct', 'name'],
    ['pi-cli-bwrap-acct', 'name'],
  ]);
  assert.equal(accountInvocations(cfg, { provider: 'openai', accountId: 'nobody' }).account, null);
});

function runDirWith(files) {
  const dir = tmp('fgos-account-probe-run-');
  for (const [name, body] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), JSON.stringify(body));
  return dir;
}

test('outcome classes come from what the run settled with, what it printed and the herdr diagnosis it wrote', () => {
  assert.deepEqual(classifyAccountProbe({ ok: true, text: 'session started\nOK\n' }), { outcome: 'ok', evidence: 'OK' });

  const blocked = runDirWith({
    'herdr-diagnosis.json': {
      explain: { matchedRule: 'trust_directory', promptText: '\n  Folder access\n  /repo\n\n  Trust this folder? Codex can read ...' },
      detectionScreen: '  Trust this folder? Codex can read, edit, and run files here\n',
    },
  });
  const trust = classifyAccountProbe({ ok: false, text: 'ended as blocked', runDir: blocked });
  assert.equal(trust.outcome, 'blocked-trust-prompt');
  assert.match(trust.evidence, /Trust this folder/);
  assert.equal(trust.matchedRule, 'trust_directory');

  const auth = classifyAccountProbe({ text: 'Error: OAuth refresh failed for openai: invalid_grant' });
  assert.equal(auth.outcome, 'auth');
  assert.match(auth.evidence, /invalid_grant/);
  assert.equal(classifyAccountProbe({ ok: true, text: 'Please run /login' }).outcome, 'auth', 'a settled run that printed a dead login is not ok');

  assert.equal(classifyAccountProbe({ text: "You've hit your usage limit. Try again at 5pm." }).outcome, 'quota');
  assert.equal(classifyAccountProbe({ text: "EROFS: read-only file system, mkdir '/home/x/.pi/accounts/a/settings.json.lock'" }).outcome, 'sandbox');
  assert.equal(classifyAccountProbe({ text: 'herdr could not bring a "codex" agent to ready', failureCode: 'execution-timeout' }).outcome, 'timeout');
  assert.equal(classifyAccountProbe({ text: 'panic: unexpected' }).outcome, 'other');
});

test('the verdict says account fault only when every CLI failed the same account-level way', () => {
  assert.equal(accountProbeVerdict([{ outcome: 'ok' }, { outcome: 'ok' }]), 'healthy');
  assert.equal(accountProbeVerdict([{ outcome: 'auth' }, { outcome: 'quota' }]), 'account-fault');
  assert.equal(accountProbeVerdict([{ outcome: 'ok' }, { outcome: 'blocked-trust-prompt' }]), 'cli-fault');
  assert.equal(accountProbeVerdict([{ outcome: 'sandbox' }, { outcome: 'auth' }]), 'mixed');
  assert.equal(accountProbeVerdict([]), 'nothing-to-probe');
});

test('the door gets a config pinned to the one account, and other providers and accounts are left alone', () => {
  const wide = { ...cfg, providers: { ...cfg.providers, openai: { accounts: { ...cfg.providers.openai.accounts, spare: { label: 'spare', credentialSource: { kind: 'codex-home', home: '/homes/spare' } } } }, xai: { accounts: { v: {} } } } };
  const pinned = configPinnedToAccount(wide, { provider: 'openai-codex', accountId: 'acct' });
  assert.deepEqual(Object.keys(pinned.providers.openai.accounts), ['acct']);
  assert.deepEqual(pinned.providers.xai, wide.providers.xai);
  assert.equal(pinned.executors, wide.executors);
});

test('every CLI starts before any finishes, each under a read-only posture binding, and left-open panes are closed', async () => {
  const repoRoot = tmp('fgos-account-probe-repo-');
  const runDirOf = (id) => {
    const dir = path.join(repoRoot, '.fgos', 'assignments', id, 'runs', '01');
    fs.mkdirSync(path.join(dir, 'outbox'), { recursive: true });
    return dir;
  };
  const calls = [];
  const closed = [];
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  let n = 0;
  const dispatch = async (assignment, { runnerConfig, cliOverride }) => {
    calls.push({ assignment, runnerConfig, cliOverride });
    if (calls.length === 4) release();
    await gate;
    const dir = runDirOf(assignment.assignmentId);
    const runtime = { stdoutLog: path.relative(repoRoot, path.join(dir, 'stdout.log')) };
    if (assignment.binding.invocation === 'codex-herdr-static') {
      fs.writeFileSync(path.join(dir, 'visibility.json'), JSON.stringify({ paneId: 'p-1', herdrSession: 'fgos-workers' }));
      fs.writeFileSync(path.join(dir, 'herdr-diagnosis.json'), JSON.stringify({ explain: { matchedRule: 'trust_directory', promptText: 'Trust this folder?' } }));
      return { status: 'failed', runtime, runnerNote: { summary: 'ended as blocked' } };
    }
    fs.writeFileSync(path.join(dir, 'stdout.log'), 'OK\n');
    return assignment.binding.invocation === 'pi-cli-acct'
      ? { runtime, classification: { execution: { status: 'completed', exitCode: 0 } } }
      : { status: 'done', runtime };
  };
  const report = await runAccountProbe({
    cfg, provider: 'openai', accountId: 'acct', repoRoot, timeoutMs: 1000,
    createAssignment: (contract) => Object.freeze({ assignmentId: `asgn_probe_${++n}`, provenance: { kind: 'inline', contract } }),
    dispatch,
    closePane: (ref) => { closed.push(ref); return true; },
  });

  assert.equal(calls.length, 4);
  for (const { assignment, runnerConfig, cliOverride } of calls) {
    assert.equal(assignment.binding.posture, 'read-only');
    assert.deepEqual(cliOverride, { preferExecutor: 'openai', preferInvocation: assignment.binding.invocation }, 'the door launches the pinned invocation, not its own pick');
    assert.equal(assignment.policy.preferInvocation, assignment.binding.invocation);
    assert.equal(assignment.provenance.contract.mutation, 'read-only');
    assert.deepEqual(Object.keys(runnerConfig.providers.openai.accounts), ['acct']);
  }
  assert.deepEqual(closed, [{ paneId: 'p-1', herdrSession: 'fgos-workers' }]);
  const row = report.results.find((r) => r.invocationId === 'codex-herdr-static');
  assert.equal(row.outcome, 'blocked-trust-prompt');
  assert.equal(row.pane, 'closed-by-probe');
  assert.equal(report.results.filter((r) => r.outcome === 'ok').length, 3);
  assert.equal(report.verdict, 'cli-fault');
});
