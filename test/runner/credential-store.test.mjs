import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';

import { credentialStoreOf, credentialStoreProblem } from '../../src/runner/dispatch/provider-capacity.mjs';
import { readMachineConfig } from '../../src/config/facade.mjs';
import { credentialLayout } from '../../src/runner/dispatch/provider-credential-renewal.mjs';
import { validateRunnerConfigShape } from '../../src/runner/dispatch/config.mjs';
import { RunnerConfigError } from '../../src/runner/dispatch/runner-config-error.mjs';
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

const runnerWith = (executor) => ({
  executor: { command: 'claude', args: ['{prompt}'] },
  modelPolicies: { claude: { nano: 'haiku', standard: 'sonnet', advanced: 'sonnet', flagship: 'sonnet', frontier: 'opus' } },
  timeoutMs: 1000,
  executors: { agent: { kind: 'agent', providerModel: 'claude', allowCrossProvider: true, ...executor } },
});

const cliInvocation = (extra = {}) => ({ id: 'a-cli', via: 'cli', adapter: 'cli-spawn', command: 'codex', args: ['{prompt}'], ...extra });
const store = { use: 'codex', homeEnv: 'CODEX_HOME' };

test('the runner config check accepts a store on a confined cli invocation, whichever level names the backend', () => {
  for (const executor of [
    { invocations: [cliInvocation({ confinement: { backend: 'bwrap' }, credentialStore: store })] },
    { confinement: { backend: 'bwrap' }, invocations: [cliInvocation({ credentialStore: store })] },
  ]) {
    assert.doesNotThrow(() => validateRunnerConfigShape(runnerWith(executor), 'test'));
  }
});

test('the runner config check refuses a malformed store and a store on an invocation with no confinement backend', () => {
  const refuse = (invocation, pattern) => {
    assert.throws(() => validateRunnerConfigShape(runnerWith({ invocations: [invocation] }), 'test'), (err) => err instanceof RunnerConfigError && pattern.test(err.message));
  };
  refuse(cliInvocation({ credentialStore: store }), /"credentialStore" without a confinement backend/);
  refuse(cliInvocation({ confinement: { backend: 'bwrap' }, credentialStore: { use: 'codex' } }), /"credentialStore" "homeEnv"/);
  refuse(cliInvocation({ confinement: { backend: 'bwrap' }, credentialStore: { use: 'codex', homeEnv: 'CODEX_HOME', files: ['../x'] } }), /"files"/);
  refuse(cliInvocation({ confinement: { backend: 'bwrap' }, credentialStore: 'codex' }), /must be an object/);
});

test('the resolved command carries the declared store, or the one an older binding implies, or none', () => {
  const resolve = (invocations) => resolveExecutorCommand(runnerWith({ invocations }), { prompt: 'p', model: 'm', tier: 'standard', executorId: 'agent', fgosDir: os.tmpdir(), contentCarries: 'repo-content', invocationId: invocations[0].id });
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

test('the standard gives each confined claude invocation its own login store in the config directory, and keeps the unconfined one on the real home', () => {
  const claude = readMachineConfig({ globalDir: path.join(os.tmpdir(), 'fgos-no-machine-config') }).value.runner.executors.claude;
  const byId = Object.fromEntries(claude.invocations.map((inv) => [inv.id, inv]));
  for (const id of ['claude-cli-bwrap', 'claude-herdr-bwrap']) {
    const store = credentialStoreOf({ ...byId[id], command: 'claude' });
    assert.deepEqual(JSON.parse(JSON.stringify(store)), { use: 'claude', homeEnv: 'CLAUDE_CONFIG_DIR', sessionDir: 'projects', files: ['.credentials.json'] }, id);
    assert.equal(credentialStoreProblem(store), null, id);
    assert.equal(credentialLayout({ kind: 'home-files', home: '/h', files: store.files }), 'claude-config-credentials-json', `${id}: its login file is one a renewal can read`);
  }
  assert.equal(credentialStoreOf({ ...byId['claude-cli'], command: 'claude' }), null);
});
