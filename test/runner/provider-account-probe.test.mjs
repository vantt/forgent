// The account probe calls each login of an account directly, then starts every CLI of the account at once
// through the dispatch door, and tells an account fault from a harness fault. Everything here runs against
// fixtures: the direct call, the account lock, the Assignment door, the id claim, the pane close and the
// capacity record are injected.

import '../helpers/process-tmp-root.mjs';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  accountInvocations, classifyAccountProbe, accountProbeVerdict, configPinnedToAccount, runAccountProbe, runAccountSweep,
} from '../../src/runner/dispatch/provider-account-probe.mjs';
import { runDispatchCli } from '../../src/runner/dispatch/cli.mjs';

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

  const stop = (cause, providerSignal = null) => classifyAccountProbe({ failureCode: 'provider-limit', cause, providerSignal, text: 'ended as provider-limit' });
  assert.equal(stop('credential').outcome, 'auth');
  assert.equal(stop('quota', { status: 429, requestedWaitMs: 30000 }).outcome, 'quota');
  assert.match(stop('quota', { status: 429, requestedWaitMs: 30000 }).evidence, /HTTP 429, wait 30s/);
  const refused = stop('provider', { status: 404 });
  assert.equal(refused.outcome, 'other', 'a provider fault is neither the login nor the quota');
  assert.match(refused.evidence, /HTTP 404/);
  assert.equal(classifyAccountProbe({ failureCode: 'provider-limit', text: 'You\'ve hit your usage limit' }).outcome, 'other', 'wording the run did not settle with is not judged here');
  assert.equal(classifyAccountProbe({ ok: true, text: 'Please run /login' }).outcome, 'ok', 'a settled run with a claim is ok whatever it printed');

  assert.equal(classifyAccountProbe({ text: "EROFS: read-only file system, mkdir '/home/x/.pi/accounts/a/settings.json.lock'" }).outcome, 'sandbox');
  assert.equal(classifyAccountProbe({ text: 'herdr could not bring a "codex" agent to ready', failureCode: 'execution-timeout' }).outcome, 'timeout');
  assert.equal(classifyAccountProbe({ text: 'panic: unexpected' }).outcome, 'other');
});

test('the verdict names who failed from both legs: healthy, account-fault, harness-fault or mixed', () => {
  const direct = (outcome) => ({ leg: 'direct', outcome });
  const harness = (outcome, extra = {}) => ({ leg: 'harness', outcome, inVerdict: true, ...extra });
  assert.equal(accountProbeVerdict([direct('ok'), harness('ok'), harness('ok')]), 'healthy');
  assert.equal(accountProbeVerdict([direct('auth'), direct('quota'), harness('auth')]), 'account-fault');
  assert.equal(accountProbeVerdict([direct('ok'), harness('ok'), harness('blocked-trust-prompt')]), 'harness-fault');
  assert.equal(accountProbeVerdict([direct('ok'), harness('sandbox')]), 'harness-fault');
  assert.equal(accountProbeVerdict([direct('ok'), direct('auth'), harness('ok')]), 'mixed');
  assert.equal(accountProbeVerdict([direct('other'), harness('ok')]), 'mixed');
  assert.equal(accountProbeVerdict([direct('auth'), harness('ok')]), 'account-fault', 'every direct row is an account stop, whatever the harness leg says');
  assert.equal(accountProbeVerdict([direct('ok')]), 'healthy', 'with no counted harness row the direct leg alone decides');
  assert.equal(accountProbeVerdict([direct('quota')]), 'account-fault');
  assert.equal(accountProbeVerdict([harness('auth'), harness('quota')]), 'account-fault', 'with no direct row the harness leg alone decides');
  assert.equal(accountProbeVerdict([harness('ok'), harness('sandbox')]), 'mixed');
  assert.equal(accountProbeVerdict([]), 'nothing-to-probe');
});

test('the verdict reads only counted rows: confined harness invocations and direct rows a call exists for', () => {
  // The read-only door confines every probe round. An invocation that declares no sandbox has no private
  // home either, so its CLI meets its own login directory mounted read-only and stops on EROFS before it
  // answers: the shape of a real openai/tetcu72 probe, where every sandboxed invocation answered. A round the
  // account's quarantine refused, and a store layout no call exists for, say nothing about either leg.
  const rows = [
    { leg: 'direct', outcome: 'ok' },
    { leg: 'direct', outcome: 'no-probe' },
    { leg: 'harness', outcome: 'ok', inVerdict: true },
    { leg: 'harness', outcome: 'sandbox', inVerdict: false },
    { leg: 'harness', outcome: 'quarantined', inVerdict: false },
  ];
  assert.equal(accountProbeVerdict(rows), 'healthy');
  assert.equal(accountProbeVerdict([{ leg: 'direct', outcome: 'no-probe' }, { leg: 'harness', outcome: 'sandbox', inVerdict: false }]), 'nothing-to-probe');
});

test('the door gets a config pinned to the one account, and other providers and accounts are left alone', () => {
  const wide = { ...cfg, providers: { ...cfg.providers, openai: { accounts: { ...cfg.providers.openai.accounts, spare: { label: 'spare', credentialSource: { kind: 'codex-home', home: '/homes/spare' } } } }, xai: { accounts: { v: {} } } } };
  const pinned = configPinnedToAccount(wide, { provider: 'openai-codex', accountId: 'acct' });
  assert.deepEqual(Object.keys(pinned.providers.openai.accounts), ['acct']);
  assert.deepEqual(pinned.providers.xai, wide.providers.xai);
  assert.equal(pinned.executors, wide.executors);
});

test('a declared store key, not the command, decides which confined invocations lease the account', () => {
  const wrapped = (id, credentialStore) => ({
    id, via: 'cli', adapter: 'cli-spawn', command: '/opt/bin/agent-wrapper', args: [], confinement: { backend: 'bwrap' }, ...(credentialStore ? { credentialStore } : {}),
  });
  const wrappedCfg = {
    providers: cfg.providers,
    executors: {
      openai: {
        kind: 'agent',
        providerModel: 'openai',
        invocations: [
          wrapped('wrapper-codex', { use: 'codex', homeEnv: 'CODEX_HOME' }),
          wrapped('wrapper-pi', { use: 'pi', homeEnv: 'PI_CODING_AGENT_DIR' }),
          wrapped('wrapper-no-store'),
        ],
      },
    },
  };
  const found = accountInvocations(wrappedCfg, { provider: 'openai', accountId: 'acct' }).invocations.map((i) => [i.invocationId, i.via]);
  assert.deepEqual(found, [['wrapper-codex', 'lease']]);
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
  // A RunResult as the door stores it: what is read is its classification, through runOutcome.
  const record = (runId, runtime, classification, legacy, extra = {}) => ({
    contract: { id: 'assignment-run-result', version: 2 },
    runId,
    // The stored legacy fields must match what the classification projects to, or the record is corrupt.
    status: legacy,
    confidence: legacy === 'done' ? 'reported' : legacy,
    runtime,
    classification: { policy: { disposition: 'allow' }, delivery: { mode: 'fresh' }, provenance: 'native-v2', ...classification },
    ...extra,
  });
  const dispatch = async (assignment, { runnerConfig, cliOverride }) => {
    calls.push({ assignment, runnerConfig, cliOverride });
    if (calls.length === 4) release();
    await gate;
    const dir = runDirOf(assignment.assignmentId);
    const runtime = { stdoutLog: path.relative(repoRoot, path.join(dir, 'stdout.log')) };
    if (assignment.binding.invocation === 'codex-herdr-static') {
      fs.writeFileSync(path.join(dir, 'visibility.json'), JSON.stringify({ paneId: 'p-1', terminalKey: 'k-1', herdrSession: 'fgos-workers' }));
      fs.writeFileSync(path.join(dir, 'herdr-diagnosis.json'), JSON.stringify({ explain: { matchedRule: 'trust_directory', promptText: 'Trust this folder?' } }));
      return record(`run_${assignment.assignmentId}`, runtime, {
        execution: { status: 'failed', exitCode: null },
        assessment: { verdict: 'not-applicable' },
        confidence: { level: 'failed', basis: ['captured-stdout'] },
        failure: { family: 'provider', code: 'blocked' },
        policy: { disposition: 'needs-input', code: 'blocked' },
      }, 'failed', { runnerNote: { summary: 'ended as blocked' } });
    }
    fs.writeFileSync(path.join(dir, 'stdout.log'), 'OK\n');
    // pi replied but wrote no result claim: the verdict is inconclusive, the CLI still answered.
    const verdict = assignment.binding.invocation === 'pi-cli-acct' ? 'inconclusive' : 'pass';
    return record(`run_${assignment.assignmentId}`, runtime, {
      execution: { status: 'completed', exitCode: 0 },
      assessment: { verdict },
      confidence: { level: verdict === 'pass' ? 'reported' : 'no-evidence', basis: ['captured-stdout'] },
    }, verdict === 'pass' ? 'done' : 'no-evidence');
  };
  const events = [];
  const report = await runAccountProbe({
    cfg, provider: 'openai', accountId: 'acct', repoRoot, timeoutMs: 1000,
    createAssignment: (contract) => Object.freeze({ assignmentId: `asgn_probe_${++n}`, provenance: { kind: 'inline', contract } }),
    dispatch: async (...args) => { if (calls.length === 0) events.push('first-dispatch'); return dispatch(...args); },
    closePane: (ref) => { closed.push(ref); return true; },
    acquireLock: async (ref) => { events.push(`lock ${ref.provider}/${ref.accountId}`); return { spawnHolding: 'held', release: () => events.push('release') }; },
    probe: async (request) => { events.push(`probe ${request.cli} ${request.spawnHolding}`); return { ok: true, reason: null, providerSignal: null, exitCode: 0, elapsedMs: 7 }; },
  });

  assert.deepEqual(events.slice(0, 4), ['lock openai-codex/acct', 'probe codex held', 'release', 'first-dispatch'], 'the direct call runs under the account lock and finishes before the harness leg starts');
  assert.deepEqual(report.results.filter((r) => r.leg === 'direct').map((r) => [r.cli, r.outcome, r.store, r.elapsedMs]), [['codex', 'ok', '/homes/codex-acct', 7]]);
  assert.equal(calls.length, 4);
  for (const { assignment, runnerConfig, cliOverride } of calls) {
    assert.equal(assignment.binding.posture, 'read-only');
    assert.deepEqual(cliOverride, { preferExecutor: 'openai', preferInvocation: assignment.binding.invocation, leaseAccount: 'acct' }, 'the door launches the pinned invocation and leases the account it probes, not its own pick');
    assert.equal(assignment.policy.preferInvocation, assignment.binding.invocation);
    assert.equal(assignment.provenance.contract.mutation, 'read-only');
    assert.deepEqual(Object.keys(runnerConfig.providers.openai.accounts), ['acct']);
  }
  assert.deepEqual(closed, [{ paneId: 'p-1', herdrSession: 'fgos-workers', terminalKey: 'k-1' }]);
  const row = report.results.find((r) => r.invocationId === 'codex-herdr-static');
  assert.equal(row.leg, 'harness');
  assert.equal(row.outcome, 'blocked-trust-prompt');
  assert.equal(row.pane, 'closed-by-probe');
  const harness = report.results.filter((r) => r.leg === 'harness');
  assert.equal(harness.filter((r) => r.outcome === 'ok').length, 3);
  assert.deepEqual(harness.filter((r) => r.inVerdict).map((r) => r.invocationId).sort(), ['codex-herdr-static', 'pi-cli-bwrap-acct']);
  assert.equal(report.verdict, 'harness-fault', 'the login answers directly, a confined CLI stops at a trust prompt');
});

test('each CLI is probed on the strongest model a tier cell names for the account\'s pool, and the row says which', async () => {
  const omp = (id) => ({ id, via: 'cli', adapter: 'cli-spawn', command: 'omp', args: ['--model', '{model}'], confinement: { backend: 'bwrap' }, credentialStore: { use: 'omp', homeEnv: 'PI_CODING_AGENT_DIR' } });
  const geminiCfg = {
    providers: {
      gemini: { accounts: { acct: { label: 'acct', credentialSource: { kind: 'home-files', home: '/homes/omp-acct', files: ['agent.db'] } } } },
    },
    modelPolicies: {
      gemini: { standard: 'gemini-flash', flagship: ['gemini-pro@vertex', { model: 'gemini-argon-high' }] },
    },
    executors: { gemini: { kind: 'agent', providerModel: 'gemini', invocations: [omp('omp-cli-bwrap')] } },
  };
  const repoRoot = tmp('fgos-account-probe-model-');
  const overrides = [];
  const probe = (provider, accountId) => runAccountProbe({
    cfg: geminiCfg, provider, accountId, repoRoot, leg: 'harness',
    createAssignment: (contract) => Object.freeze({ assignmentId: `asgn_model_${overrides.length}`, provenance: { kind: 'inline', contract } }),
    dispatch: async (_assignment, { cliOverride }) => { overrides.push(cliOverride); return null; },
    closePane: () => false,
  });

  const flagship = await probe('gemini', 'acct');
  assert.equal(overrides.at(-1).model, 'gemini-argon-high', 'the flagship entry the account\'s own pool serves, not the default nor another pool\'s');
  assert.deepEqual([flagship.results[0].model, flagship.results[0].modelSource], ['gemini-argon-high', 'gemini.flagship']);

  const plain = await runAccountProbe({
    cfg: { ...geminiCfg, modelPolicies: {} }, provider: 'gemini', accountId: 'acct', repoRoot, leg: 'harness',
    createAssignment: (contract) => Object.freeze({ assignmentId: 'asgn_model_default', provenance: { kind: 'inline', contract } }),
    dispatch: async (_assignment, { cliOverride }) => { overrides.push(cliOverride); return null; },
    closePane: () => false,
  });
  assert.equal('model' in overrides.at(-1), false, 'with no cell naming the pool the invocation default is probed');
  assert.deepEqual([plain.results[0].model, plain.results[0].modelSource], [null, 'invocation-default']);
});

test('a run settled as a provider limit is the account\'s login or quota by the cause the settlement recorded, with the provider\'s own signal as evidence', async () => {
  const repoRoot = tmp('fgos-account-probe-cause-');
  const settledWith = (failure) => async (assignment) => {
    const dir = path.join(repoRoot, '.fgos', 'assignments', assignment.assignmentId, 'runs', '01');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'stdout.log'), 'nothing a wording list could read\n');
    return {
      contract: { id: 'assignment-run-result', version: 2 },
      runId: `run_${assignment.assignmentId}`,
      status: 'failed',
      confidence: 'failed',
      runtime: { stdoutLog: path.relative(repoRoot, path.join(dir, 'stdout.log')) },
      classification: {
        policy: { disposition: 'allow' }, delivery: { mode: 'fresh' }, provenance: 'native-v2',
        execution: { status: 'failed', exitCode: 1 },
        assessment: { verdict: 'not-applicable' },
        confidence: { level: 'failed', basis: ['captured-stdout'] },
        failure: { family: 'provider', code: 'provider-limit', ...failure },
      },
    };
  };
  const probe = (failure) => runAccountProbe({
    cfg, provider: 'openai', accountId: 'acct', invocationIds: ['pi-cli-bwrap-acct'], repoRoot, leg: 'harness',
    createAssignment: (contract) => Object.freeze({ assignmentId: `asgn_cause_${failure.cause}`, provenance: { kind: 'inline', contract } }),
    dispatch: settledWith(failure),
    closePane: () => false,
  });

  const login = (await probe({ cause: 'credential' })).results[0];
  assert.equal(login.outcome, 'auth');
  const quota = (await probe({ cause: 'quota', providerSignal: { status: 429, requestedWaitMs: 60000 } })).results[0];
  assert.equal(quota.outcome, 'quota');
  assert.match(quota.evidence, /HTTP 429, wait 60s/);
  const refused = (await probe({ cause: 'provider', providerSignal: { status: 404 } })).results[0];
  assert.equal(refused.outcome, 'other');
  assert.match(refused.evidence, /HTTP 404/);
});

test('a store with a login is called on the harness model of its CLI; a layout with no call is no-probe and takes no lock', async () => {
  const omp = { id: 'omp-cli-bwrap', via: 'cli', adapter: 'cli-spawn', command: 'omp', args: [], confinement: { backend: 'bwrap' }, credentialStore: { use: 'omp', homeEnv: 'PI_CODING_AGENT_DIR' } };
  const perCli = {
    providers: {
      gemini: {
        accounts: {
          acct: {
            label: 'acct',
            credentialSources: {
              omp: { kind: 'home-files', home: '/homes/omp-acct', files: ['agent.db'] },
              odd: { kind: 'home-files', home: '/homes/odd-acct', files: ['mystery.bin'] },
            },
          },
        },
      },
    },
    modelPolicies: { gemini: { flagship: 'gemini-argon-high' } },
    executors: { gemini: { kind: 'agent', providerModel: 'gemini', invocations: [omp] } },
  };
  const locks = [];
  const asked = [];
  const report = await runAccountProbe({
    cfg: perCli, provider: 'gemini', accountId: 'acct', repoRoot: tmp('fgos-account-probe-direct-'), leg: 'direct',
    acquireLock: async () => { locks.push('lock'); return { spawnHolding: null, release() {} }; },
    probe: async ({ cli, model, account }) => {
      asked.push([cli, model, Object.keys(account.credentialSources)]);
      return { ok: false, detail: 'the login is still rejected', reason: 'login', providerSignal: { status: 401 }, exitCode: 1, elapsedMs: 3 };
    },
  });
  assert.deepEqual(asked, [['omp', 'gemini-argon-high', ['omp', 'odd']]]);
  assert.equal(locks.length, 1);
  assert.deepEqual(report.results.map((r) => [r.cli, r.outcome, r.reason, r.model, r.modelSource]), [
    ['omp', 'auth', 'login', 'gemini-argon-high', 'gemini.flagship'],
    ['odd', 'no-probe', null, null, 'invocation-default'],
  ]);
  assert.equal(report.verdict, 'account-fault');
});

test('a harness round the account\'s quarantine refused is quarantined and stays out of the verdict', async () => {
  const repoRoot = tmp('fgos-account-probe-quarantined-');
  const refused = async (assignment) => {
    const dir = path.join(repoRoot, '.fgos', 'assignments', assignment.assignmentId, 'runs', '01');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'stdout.log'), '');
    return {
      contract: { id: 'assignment-run-result', version: 2 },
      runId: `run_${assignment.assignmentId}`,
      status: 'failed',
      confidence: 'failed',
      runtime: { stdoutLog: path.relative(repoRoot, path.join(dir, 'stdout.log')) },
      classification: {
        policy: { disposition: 'allow' }, delivery: { mode: 'fresh' }, provenance: 'native-v2',
        execution: { status: 'failed', exitCode: null },
        assessment: { verdict: 'not-applicable' },
        confidence: { level: 'failed', basis: ['captured-stdout'] },
        failure: { family: 'provider', code: 'provider-capacity-lease-conflict' },
      },
    };
  };
  const report = await runAccountProbe({
    cfg, provider: 'openai', accountId: 'acct', invocationIds: ['pi-cli-bwrap-acct'], repoRoot,
    createAssignment: (contract) => Object.freeze({ assignmentId: 'asgn_quarantined', provenance: { kind: 'inline', contract } }),
    dispatch: refused,
    closePane: () => false,
    acquireLock: async () => ({ spawnHolding: null, release() {} }),
    probe: async () => ({ ok: true }),
  });
  const row = report.results.find((r) => r.leg === 'harness');
  assert.deepEqual([row.outcome, row.inVerdict], ['quarantined', false]);
  assert.equal(report.verdict, 'healthy');
});

test('probe-account --all sweeps enabled accounts in declared order, --record writes the direct rows once per account, --leg picks the leg', async () => {
  const root = tmp('fgos-account-probe-all-');
  const sweepCfg = {
    llmAccounts: {
      openai: {
        first: { credentialStore: { codex: '/homes/first' } },
        idle: { credentialStore: { codex: '/homes/idle' }, disabled: true },
        second: { credentialStore: { codex: '/homes/second' } },
      },
    },
    executors: { openai: { kind: 'agent', providerModel: 'openai', invocations: [{ id: 'unrelated', via: 'cli', adapter: 'cli-spawn', command: process.execPath, args: ['{prompt}'] }] } },
  };
  const probed = [];
  const recorded = [];
  const doors = {
    cfg: sweepCfg,
    acquireLock: async () => ({ spawnHolding: null, release() {} }),
    probe: async ({ accountId }) => { probed.push(accountId); return accountId === 'second' ? { ok: false, detail: 'the login is still rejected', reason: 'login', providerSignal: null, exitCode: 1, elapsedMs: 2 } : { ok: true, elapsedMs: 1 }; },
    recordProbe: (entry) => { recorded.push(entry); },
  };
  const run = (...flags) => runDispatchCli(['probe-account', ...flags, '--cwd', root, '--repo-root', root], { returnResult: true, accountProbeDoors: doors });

  const swept = await run('--all', '--leg', 'direct');
  assert.deepEqual(probed, ['first', 'second']);
  assert.deepEqual(swept.accounts.map((a) => [a.accountId, a.skipped ?? a.verdict]), [['first', 'healthy'], ['idle', 'disabled'], ['second', 'account-fault']]);
  assert.deepEqual(recorded, [], 'without --record nothing is written');

  await run('--all', '--leg', 'direct', '--record');
  assert.deepEqual(recorded.map((r) => [r.accountId, r.provider, r.verdict, r.source, r.direct.map((d) => [d.cli, d.ok, d.reason])]), [
    ['first', 'openai-codex', 'healthy', 'probe-account', [['codex', true, null]]],
    ['second', 'openai-codex', 'account-fault', 'probe-account', [['codex', false, 'login']]],
  ]);

  probed.length = 0;
  const harnessOnly = await run('--provider', 'openai', '--account', 'first', '--leg', 'harness');
  assert.deepEqual(probed, [], '--leg harness makes no direct call');
  assert.equal(harnessOnly.verdict, 'nothing-to-probe');

  for (const narrowing of [['--provider', 'openai'], ['--account', 'first'], ['--executor', 'openai'], ['--invocation', 'x']]) {
    await assert.rejects(run('--all', ...narrowing), new RegExp(`cannot be narrowed by ${narrowing[0]}`));
  }
  await assert.rejects(run('--provider', 'openai', '--account', 'first', '--leg', 'sideways'), /--leg must be one of direct, harness, both/);
  await assert.rejects(run(), /requires --provider <provider> --account <accountId>, or --all/);
});

test('a sweep goes on past an account whose probe throws and reports it', async () => {
  const accountCfg = { providers: { openai: { accounts: { a: { credentialSource: { kind: 'codex-home', home: '/homes/a' } }, b: { credentialSource: { kind: 'codex-home', home: '/homes/b' } } } } }, executors: {} };
  const swept = await runAccountSweep({
    cfg: accountCfg, repoRoot: tmp('fgos-account-probe-sweep-'), leg: 'direct', record: true,
    acquireLock: async () => ({ spawnHolding: null, release() {} }),
    probe: async () => ({ ok: true }),
    recordProbe: ({ accountId }) => { if (accountId === 'a') throw new Error('state is locked'); },
  });
  assert.deepEqual(swept.accounts.map((a) => [a.accountId, a.verdict, a.recorded, a.recordError ?? null]), [['a', 'healthy', false, 'state is locked'], ['b', 'healthy', true, null]]);
});
