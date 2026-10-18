import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { credentialStoreOf, credentialStoreProblem } from '../../src/runner/dispatch/provider-capacity.mjs';
import { loadRunnerConfig, RunnerConfigError } from '../../src/runner/dispatch/config.mjs';
import { resolveExecutorCommand } from '../../src/runner/dispatch/transport.mjs';
import { buildConfinementRequest, validateConfinementRequest } from '../../src/runner/dispatch/confinement/request.mjs';

const binding = (name) => [{ resource: 'private-home', target: { kind: 'env', name } }];

test('credentialStoreOf: a declared store wins, an older private-home env binding implies one, anything else reads none', () => {
  const declared = { use: 'pi', homeEnv: 'PI_CODING_AGENT_DIR', files: ['auth.json'] };
  assert.equal(credentialStoreOf({ command: 'codex', credentialStore: declared, resourceBindings: binding('CODEX_HOME') }), declared);
  assert.deepEqual(credentialStoreOf({ command: '/usr/local/bin/Codex', resourceBindings: binding('CODEX_HOME') }), { use: 'codex', homeEnv: 'CODEX_HOME' });
  assert.equal(credentialStoreOf({ command: 'claude' }), null);
  assert.equal(credentialStoreOf({ command: 'claude', resourceBindings: [{ resource: 'run-output', target: { kind: 'env', name: 'X' } }] }), null);
  assert.equal(credentialStoreOf({ command: 'claude', resourceBindings: [{ resource: 'private-home', target: { kind: 'argument', token: '{H}' } }] }), null);
  assert.equal(credentialStoreOf(null), null);
});

test('credentialStoreProblem names what is wrong with a declaration', () => {
  assert.equal(credentialStoreProblem({ use: 'codex', homeEnv: 'CODEX_HOME' }), null);
  assert.equal(credentialStoreProblem({ use: 'omp', homeEnv: 'PI_CODING_AGENT_DIR', files: ['agent.db', 'bin/fd'] }), null);
  const bad = [
    [null, /must be an object/],
    [[], /must be an object/],
    [{ use: 'codex', homeEnv: 'CODEX_HOME', extra: 1 }, /unknown key "extra"/],
    [{ homeEnv: 'CODEX_HOME' }, /"use"/],
    [{ use: 'Codex', homeEnv: 'CODEX_HOME' }, /"use"/],
    [{ use: 'codex' }, /"homeEnv"/],
    [{ use: 'codex', homeEnv: '1BAD' }, /"homeEnv"/],
    [{ use: 'codex', homeEnv: 'A-B' }, /"homeEnv"/],
    [{ use: 'codex', homeEnv: 'X', files: [] }, /"files"/],
    [{ use: 'codex', homeEnv: 'X', files: 'auth.json' }, /"files"/],
    [{ use: 'codex', homeEnv: 'X', files: ['../auth.json'] }, /"files"/],
    [{ use: 'codex', homeEnv: 'X', files: ['/etc/passwd'] }, /"files"/],
    [{ use: 'codex', homeEnv: 'X', files: ['a', 'a'] }, /must not repeat/],
  ];
  for (const [store, pattern] of bad) assert.match(credentialStoreProblem(store) ?? '', pattern, JSON.stringify(store));
});

function writeConfig(executor) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-credential-store-'));
  const file = path.join(dir, 'config.json');
  fs.writeFileSync(file, JSON.stringify({
    executor: { command: 'claude', args: ['{prompt}'] },
    modelPolicies: { claude: { nano: 'haiku', standard: 'sonnet', advanced: 'sonnet', flagship: 'sonnet', frontier: 'opus' } },
    rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
    timeoutMs: 1000,
    executors: { agent: { kind: 'agent', providerModel: 'claude', allowCrossProvider: true, ...executor } },
  }));
  return { file, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

const cliInvocation = (extra = {}) => ({ id: 'a-cli', via: 'cli', adapter: 'cli-spawn', command: 'codex', args: ['{prompt}'], ...extra });
const store = { use: 'codex', homeEnv: 'CODEX_HOME' };

test('the config door accepts a store on a confined cli invocation, whichever level names the backend', () => {
  for (const executor of [
    { invocations: [cliInvocation({ confinement: { backend: 'bwrap' }, credentialStore: store })] },
    { confinement: { backend: 'bwrap' }, invocations: [cliInvocation({ credentialStore: store })] },
  ]) {
    const w = writeConfig(executor);
    try { assert.equal(loadRunnerConfig(w.file).executors.agent.invocations[0].credentialStore.use, 'codex'); } finally { w.cleanup(); }
  }
});

test('the config door refuses a malformed store and a store on an invocation with no confinement backend', () => {
  const refuse = (invocation, pattern) => {
    const w = writeConfig({ invocations: [invocation] });
    try { assert.throws(() => loadRunnerConfig(w.file), (err) => err instanceof RunnerConfigError && pattern.test(err.message)); } finally { w.cleanup(); }
  };
  refuse(cliInvocation({ credentialStore: store }), /"credentialStore" without a confinement backend/);
  refuse(cliInvocation({ confinement: { backend: 'bwrap' }, credentialStore: { use: 'codex' } }), /"credentialStore" "homeEnv"/);
  refuse(cliInvocation({ confinement: { backend: 'bwrap' }, credentialStore: { use: 'codex', homeEnv: 'CODEX_HOME', files: ['../x'] } }), /"files"/);
  refuse(cliInvocation({ confinement: { backend: 'bwrap' }, credentialStore: 'codex' }), /must be an object/);
});

test('the resolved command carries the declared store, or the one an older binding implies, or none', () => {
  const resolve = (invocations) => {
    const w = writeConfig({ invocations });
    try {
      const cfg = loadRunnerConfig(w.file);
      return resolveExecutorCommand(cfg, { prompt: 'p', model: 'm', tier: 'standard', executorId: 'agent', fgosDir: os.tmpdir(), contentCarries: 'repo-content', invocationId: invocations[0].id });
    } finally { w.cleanup(); }
  };
  const confinement = { backend: 'bwrap' };
  assert.deepEqual(resolve([cliInvocation({ confinement, credentialStore: { use: 'pi', homeEnv: 'PI_CODING_AGENT_DIR' } })]).credentialStore, { use: 'pi', homeEnv: 'PI_CODING_AGENT_DIR' });
  assert.deepEqual(resolve([cliInvocation({ confinement, resourceBindings: binding('CODEX_HOME') })]).credentialStore, store);
  assert.equal(resolve([cliInvocation({ confinement })]).credentialStore, null);
});

function requestFor(invocation) {
  return buildConfinementRequest({
    capability: 'code:review',
    executorId: 'agent',
    invocation,
    requirement: { mode: 'unconfined' },
    context: { cwd: os.tmpdir(), runDir: path.join(os.tmpdir(), 'run') },
  });
}

test('the confinement request carries the store the invocation reads, declared or inferred, and rejects a malformed one', () => {
  assert.deepEqual(requestFor({ command: 'codex', args: [], credentialStore: store }).invocation.credentialStore, store);
  assert.deepEqual(requestFor({ command: 'codex', args: [], resourceBindings: binding('CODEX_HOME') }).invocation.credentialStore, store);
  assert.equal('credentialStore' in requestFor({ command: 'claude', args: [] }).invocation, false);
  assert.equal('resourceBindings' in requestFor({ command: 'codex', args: [], resourceBindings: binding('CODEX_HOME') }).invocation, false);
  const request = requestFor({ command: 'codex', args: [], credentialStore: store });
  assert.throws(() => validateConfinementRequest({ ...request, invocation: { ...request.invocation, credentialStore: { use: 'codex' } } }), /invocation\.credentialStore .*"homeEnv"/);
});
