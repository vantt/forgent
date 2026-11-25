import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';

import { credentialStoreOf, credentialStoreProblem } from '../../src/runner/dispatch/provider-capacity.mjs';
import { readMachineConfig } from '../../src/config/facade.mjs';
import { DEFAULT_SEAT_TIMEOUT_MS } from '../../src/runner/dispatch/confinement/resources.mjs';
import { credentialLayout } from '../../src/runner/dispatch/provider-credential-renewal.mjs';

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

test('the standard gives each confined claude invocation its own login store in the config directory, and keeps the unconfined one on the real home', () => {
  const claude = readMachineConfig({ globalDir: path.join(os.tmpdir(), 'fgos-no-machine-config') }).value.runner.executors.claude;
  const byId = Object.fromEntries(claude.invocations.map((inv) => [inv.id, inv]));
  for (const id of ['claude-cli-bwrap', 'claude-herdr-bwrap']) {
    const store = credentialStoreOf({ ...byId[id], command: 'claude' });
    assert.deepEqual(JSON.parse(JSON.stringify(store)), { use: 'claude', homeEnv: 'CLAUDE_CONFIG_DIR', sessionDir: 'projects', files: ['.credentials.json'] }, id);
    assert.equal(credentialStoreProblem(store), null, id);
    assert.equal(credentialLayout({ kind: 'home-files', home: '/h', files: store.files }), 'claude-config-credentials-json', `${id}: its login file is one a renewal can read`);
    assert.equal(byId[id].env?.CLAUDE_CODE_FORCE_SESSION_PERSISTENCE, '1', `${id}: a seat started from a claude session still saves its transcript`);
  }
  assert.equal(credentialStoreOf({ ...byId['claude-cli'], command: 'claude' }), null);
});

test('the seat timeout a launch falls back to is the standard runner timeout, named once', () => {
  assert.equal(readMachineConfig({ globalDir: path.join(os.tmpdir(), 'fgos-no-machine-config') }).value.runner.timeoutMs, DEFAULT_SEAT_TIMEOUT_MS);
});
