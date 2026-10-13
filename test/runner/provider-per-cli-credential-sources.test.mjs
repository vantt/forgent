import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  acquireProviderAccountLease,
  credentialSourceForCli,
  credentialStoreDir,
  providerAccountDir,
  providerAccountInventory,
  providerCapacityForCommand,
  tryAcquireAccountLock,
  ProviderCapacityConfigError,
} from '../../src/runner/dispatch/provider-capacity.mjs';
import { createCredentialProbe } from '../../src/runner/dispatch/provider-credential-probe.mjs';
import {
  credentialWriteBackMarker,
  refreshAhead,
  writeBackRenewedCredential,
} from '../../src/runner/dispatch/provider-credential-renewal.mjs';
import { prepareBwrap } from '../../src/runner/dispatch/confinement/drivers/bwrap.mjs';
import { buildConfinementRequest } from '../../src/runner/dispatch/confinement/request.mjs';
import { resolveConfinementResources } from '../../src/runner/dispatch/confinement/resources.mjs';
import { accountInvocations } from '../../src/runner/dispatch/provider-account-probe.mjs';

// One provider account used through several CLIs: each CLI keeps its own login store, and a launch
// gets the store of the CLI it runs. Every token below is an obviously fake string.

const HOUR = 60 * 60 * 1000;

function workspace() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-per-cli-'));
  const codexHome = path.join(tmp, 'codex-acct');
  const piHome = path.join(tmp, 'pi-acct');
  fs.mkdirSync(codexHome, { recursive: true });
  fs.mkdirSync(path.join(piHome, 'bin'), { recursive: true });
  fs.writeFileSync(path.join(codexHome, 'auth.json'), '{"tokens":{"refresh_token":"FAKE-CODEX-STORE"}}');
  fs.writeFileSync(path.join(piHome, 'auth.json'), '{"openai":{"refresh":"FAKE-PI-STORE"}}');
  fs.writeFileSync(path.join(piHome, 'settings.json'), '{}');
  fs.writeFileSync(path.join(piHome, 'bin', 'fd'), '');
  return {
    tmp,
    codexHome,
    piHome,
    runtimeDir: path.join(tmp, 'runtime'),
    tempRoot: path.join(tmp, 'confinement'),
    cleanup: () => fs.rmSync(tmp, { recursive: true, force: true }),
  };
}

const perCliAccount = (w) => ({
  label: 'acct',
  credentialSources: {
    codex: { kind: 'codex-home', home: w.codexHome },
    pi: { kind: 'home-files', home: w.piHome, files: ['auth.json', 'settings.json', 'bin/fd'] },
  },
});

const runnerConfig = (accounts) => ({ providers: { openai: { accounts } } });

test('an account may declare one credential source per CLI; the single-source form stays as it was', () => {
  const w = workspace();
  try {
    const inv = providerAccountInventory(runnerConfig({
      multi: perCliAccount(w),
      single: { credentialSource: { kind: 'codex-home', home: w.codexHome } },
    }));
    assert.deepEqual(inv['openai-codex'].accounts.single, { id: 'single', label: 'single', credentialSource: { kind: 'codex-home', home: w.codexHome } });
    const multi = inv['openai-codex'].accounts.multi;
    assert.equal(multi.credentialSource, undefined);
    assert.deepEqual(multi.credentialSources.codex, { kind: 'codex-home', home: w.codexHome, cli: 'codex' });
    assert.deepEqual(multi.credentialSources.pi, { kind: 'home-files', home: w.piHome, files: ['auth.json', 'settings.json', 'bin/fd'], cli: 'pi' });
    assert.equal(credentialSourceForCli(multi, 'pi').home, w.piHome);
    assert.equal(credentialSourceForCli(multi, 'omp'), null);
    assert.equal(credentialSourceForCli(inv['openai-codex'].accounts.single, 'pi').home, w.codexHome, 'one store serves every CLI');
  } finally { w.cleanup(); }
});

test('an account must declare exactly one of credentialSource or credentialSources, keyed by CLI name', () => {
  const w = workspace();
  try {
    const source = { kind: 'codex-home', home: w.codexHome };
    assert.throws(() => providerAccountInventory(runnerConfig({ a: { credentialSource: source, credentialSources: { codex: source } } })), ProviderCapacityConfigError);
    assert.throws(() => providerAccountInventory(runnerConfig({ a: { label: 'x' } })), /exactly one of/);
    assert.throws(() => providerAccountInventory(runnerConfig({ a: { credentialSources: {} } })), /non-empty object/);
    assert.throws(() => providerAccountInventory(runnerConfig({ a: { credentialSources: { 'Pi Cli': source } } })), /CLI command name/);
    assert.throws(() => providerAccountInventory(runnerConfig({ a: { credentialSources: { pi: { kind: 'home-files', home: w.piHome } } } })), /credentialSources\.pi\.files/);
  } finally { w.cleanup(); }
});

test('the lease of a pinned CLI hands over that CLI store, and skips an account with no store for it', () => {
  const w = workspace();
  try {
    const cfg = runnerConfig({
      multi: perCliAccount(w),
      codexOnly: { credentialSources: { codex: { kind: 'codex-home', home: w.codexHome } } },
    });
    const pi = acquireProviderAccountLease({ runnerConfig: cfg, provider: 'openai-codex', runId: 'run-pi', assignmentId: 'as-pi', runtimeDir: w.runtimeDir, cli: 'pi' });
    assert.equal(pi.status, 'selected');
    assert.equal(pi.accountId, 'multi', 'the codex-only account cannot serve pi');
    assert.equal(pi.credentialSource.home, w.piHome);
    assert.equal(pi.credentialSource.cli, 'pi');

    const none = acquireProviderAccountLease({ runnerConfig: cfg, provider: 'openai-codex', runId: 'run-omp', runtimeDir: w.runtimeDir, cli: 'omp' });
    assert.equal(none.status, 'refused');
    assert.equal(none.reason, 'provider-capacity.no-account-for-cli');

    const single = acquireProviderAccountLease({
      runnerConfig: runnerConfig({ s: { credentialSource: { kind: 'codex-home', home: w.codexHome } } }),
      provider: 'openai-codex', runId: 'run-single', runtimeDir: w.runtimeDir, cli: 'pi',
    });
    assert.equal(single.status, 'selected');
    assert.deepEqual(single.credentialSource, { kind: 'codex-home', home: w.codexHome });
    assert.equal(single.credentialSources, undefined);
  } finally { w.cleanup(); }
});

function planFor(tempRoot, dispatchId) {
  const resources = resolveConfinementResources({
    dispatchId,
    context: {},
    grants: [{ resource: 'private-home', access: 'read-write', scope: 'dispatch' }],
    backendConfig: { tempRoot },
  });
  return { contract: 'confinement-plan.v1', dispatchId, decision: 'execute', coverage: {}, resources };
}

async function provisionFor(w, command, selection, dispatchId) {
  const plan = planFor(w.tempRoot, dispatchId);
  const request = buildConfinementRequest({
    capability: 'code:review',
    executorId: 'openai',
    invocation: { command, args: [], env: {}, resourceBindings: [] },
    context: { cwd: w.tmp, runDir: path.join(w.tmp, 'run') },
    providerCapacity: selection,
  });
  const prepared = await prepareBwrap(plan, { ...request, dispatchId }, { id: 'bwrap', type: 'bwrap', config: {} });
  return { home: plan.resources[0].hostTarget, prepared };
}

test('provisioning copies the pi store for a pi launch and the codex store for a codex launch of the same account', async () => {
  const w = workspace();
  try {
    const cfg = runnerConfig({ acct: perCliAccount(w) });
    // Unpinned: the lease does not know the CLI yet; the launch resolves it from the command.
    const selection = acquireProviderAccountLease({ runnerConfig: cfg, provider: 'openai-codex', runId: 'run-1', runtimeDir: w.runtimeDir });
    assert.equal(selection.credentialSource, null);

    const pi = await provisionFor(w, '/usr/local/bin/pi', selection, 'disp_pi');
    assert.equal(fs.readFileSync(path.join(pi.home, 'auth.json'), 'utf8'), '{"openai":{"refresh":"FAKE-PI-STORE"}}');
    assert.ok(fs.existsSync(path.join(pi.home, 'settings.json')));
    assert.ok(fs.existsSync(path.join(pi.home, 'bin', 'fd')));
    await pi.prepared.cleanup();

    const codex = await provisionFor(w, 'codex', selection, 'disp_codex');
    assert.equal(fs.readFileSync(path.join(codex.home, 'auth.json'), 'utf8'), '{"tokens":{"refresh_token":"FAKE-CODEX-STORE"}}');
    assert.equal(fs.existsSync(path.join(codex.home, 'settings.json')), false);
    await codex.prepared.cleanup();
  } finally { w.cleanup(); }
});

test('a launch whose CLI the account declares no store for is refused before the worker starts', async () => {
  const w = workspace();
  try {
    const selection = acquireProviderAccountLease({ runnerConfig: runnerConfig({ acct: perCliAccount(w) }), provider: 'openai-codex', runId: 'run-2', runtimeDir: w.runtimeDir });
    await assert.rejects(provisionFor(w, 'omp', selection, 'disp_omp'), (err) => err.code === 'credential-provisioning' && /no credential source for CLI "omp"/.test(err.message));
  } finally { w.cleanup(); }
});

test('a single-source selection reaches every command unchanged', () => {
  const selection = { status: 'selected', accountId: 'a', credentialSource: { kind: 'codex-home', home: '/x' } };
  assert.equal(providerCapacityForCommand(selection, 'pi'), selection);
});

test('renewal of a per-CLI store keeps its copies in that store directory; the write-back marker names it', async () => {
  const w = workspace();
  try {
    const piSource = { kind: 'home-files', home: w.piHome, files: ['auth.json'], cli: 'pi' };
    const marker = credentialWriteBackMarker({ provider: 'openai-codex', accountId: 'acct', credentialSource: piSource, runtimeDir: w.runtimeDir });
    assert.equal(marker.store, 'pi');
    assert.equal(marker.layout, 'pi-auth-json');
    assert.equal(credentialWriteBackMarker({ provider: 'openai-codex', accountId: 'acct', credentialSource: { kind: 'codex-home', home: w.codexHome }, runtimeDir: w.runtimeDir }).store, undefined);

    const accountDir = providerAccountDir(w.runtimeDir, 'openai-codex', 'acct');
    const piStoreDir = credentialStoreDir(w.runtimeDir, 'openai-codex', 'acct', 'pi');
    assert.equal(piStoreDir, path.join(accountDir, 'stores', 'pi'));

    // A pi login near expiry: the scratch copy for its renewal lives in the pi store directory.
    fs.writeFileSync(path.join(w.piHome, 'auth.json'), JSON.stringify({ 'openai-codex': { type: 'oauth', access: 'FAKE-OLD-A', refresh: 'FAKE-OLD-R', expires: Date.now() + 60_000 } }));
    const scratchParents = [];
    const spawnFn = (command, args, options) => {
      const homeDir = options.env.PI_CODING_AGENT_DIR;
      scratchParents.push(path.dirname(homeDir));
      const child = new EventEmitter();
      child.pid = 434343;
      child.stdout = new EventEmitter();
      child.stderr = new EventEmitter();
      setTimeout(() => {
        fs.writeFileSync(path.join(homeDir, 'auth.json'), JSON.stringify({ 'openai-codex': { type: 'oauth', access: 'FAKE-NEW-A', refresh: 'FAKE-NEW-R', expires: Date.now() + 6 * HOUR } }));
        child.stdout.emit('data', 'OK');
        child.emit('close', 0);
      }, 0);
      return child;
    };
    const result = await refreshAhead({ provider: 'openai-codex', accountId: 'acct', credentialSource: piSource, runtimeDir: w.runtimeDir, spawnFn });
    assert.deepEqual(result, { status: 'renewed', reason: 'applied' });
    assert.deepEqual(scratchParents, [piStoreDir]);
    assert.equal(JSON.parse(fs.readFileSync(path.join(w.piHome, 'auth.json'), 'utf8'))['openai-codex'].refresh, 'FAKE-NEW-R');

    // A pane renewed the pi login while the account lock is held: the copy waits in the pi store's pending/.
    const home = path.join(w.tmp, 'private-home');
    fs.mkdirSync(home);
    fs.writeFileSync(path.join(home, 'auth.json'), JSON.stringify({ 'openai-codex': { type: 'oauth', access: 'FAKE-PANE-A', refresh: 'FAKE-PANE-R', expires: Date.now() + 9 * HOUR } }));
    const held = tryAcquireAccountLock({ runtimeDir: w.runtimeDir, provider: 'openai-codex', accountId: 'acct' });
    try {
      assert.equal(writeBackRenewedCredential(home, { credentialWriteBack: marker }).status, 'staged');
    } finally { held.release(); }
    assert.equal(fs.readdirSync(path.join(piStoreDir, 'pending')).length, 1);
    assert.equal(fs.existsSync(path.join(accountDir, 'pending')), false, 'nothing lands where the account-wide store keeps its copies');
  } finally { w.cleanup(); }
});

test('the unlock probe calls through the store of the CLI the dispatch runs', async () => {
  const w = workspace();
  try {
    const account = providerAccountInventory(runnerConfig({ acct: perCliAccount(w) }))['openai-codex'].accounts.acct;
    const calls = [];
    const spawnFn = (command, args, options) => {
      calls.push({ args, codex: options.env.CODEX_HOME, pi: options.env.PI_CODING_AGENT_DIR });
      const child = new EventEmitter();
      child.pid = 454545;
      child.stdout = new EventEmitter();
      child.stderr = new EventEmitter();
      setTimeout(() => { child.stdout.emit('data', 'OK'); child.emit('close', 0); }, 0);
      return child;
    };
    const probe = createCredentialProbe({ spawnFn, env: { PATH: '' } });
    assert.equal((await probe({ account, cli: 'pi' })).ok, true);
    assert.equal((await probe({ account, cli: 'codex' })).ok, true);
    assert.equal(calls[0].pi, w.piHome);
    assert.equal(calls[1].codex, w.codexHome);
  } finally { w.cleanup(); }
});

test('the account probe leases the account into each confined CLI it has a store for', () => {
  const w = workspace();
  try {
    const binding = (name) => [{ resource: 'private-home', target: { kind: 'env', name } }];
    const cfg = {
      providers: { openai: { accounts: { acct: perCliAccount(w) } } },
      executors: {
        openai: {
          providerModel: 'openai',
          invocations: [
            { id: 'codex-cli-bwrap', via: 'cli', command: 'codex', confinement: { backend: 'bwrap' }, resourceBindings: binding('CODEX_HOME') },
            { id: 'pi-cli-bwrap-other', via: 'cli', command: 'pi', confinement: { backend: 'bwrap' }, resourceBindings: binding('PI_CODING_AGENT_DIR') },
            { id: 'omp-cli-bwrap', via: 'cli', command: 'omp', confinement: { backend: 'bwrap' }, resourceBindings: binding('PI_CODING_AGENT_DIR') },
            { id: 'pi-cli-plain', via: 'cli', command: 'pi', env: { PI_CODING_AGENT_DIR: w.piHome } },
          ],
        },
      },
    };
    const found = accountInvocations(cfg, { provider: 'openai', accountId: 'acct' }).invocations.map((i) => [i.invocationId, i.via]);
    assert.deepEqual(found, [['codex-cli-bwrap', 'lease'], ['pi-cli-bwrap-other', 'lease'], ['pi-cli-plain', 'env']]);
  } finally { w.cleanup(); }
});
