import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  createCredentialProbe,
  credentialProbeCommand,
  expandCredentialHome,
  judgeProbeOutput,
  withKillTimeout,
} from '../../src/runner/dispatch/provider-credential-probe.mjs';

const codexSource = { kind: 'codex-home', home: '${HOME}/.codex-test' };
const piSource = { kind: 'home-files', home: '/home/someone/.pi/accounts/x', files: ['auth.json', 'settings.json'] };
const ompSource = { kind: 'home-files', home: '/home/someone/.omp/profiles/x/agent', files: ['agent.db', 'config.yml'] };
const agySource = { kind: 'home-files', home: '/home/someone/.agy-homes/x', files: ['.gemini/antigravity-cli/antigravity-oauth-token'] };

test('the call is built per credential layout, pointing the CLI at the account home', () => {
  const codex = credentialProbeCommand(codexSource);
  assert.equal(codex.command, 'codex');
  assert.equal(codex.env.CODEX_HOME, path.join(os.homedir(), '.codex-test'));
  assert.ok(codex.args.includes('exec'));

  const pi = credentialProbeCommand(piSource);
  assert.equal(pi.command, 'pi');
  assert.equal(pi.env.PI_CODING_AGENT_DIR, '/home/someone/.pi/accounts/x');
});

test('an omp profile (a store that carries agent.db) is probed with omp, and that wins over pi when both are listed', () => {
  const omp = credentialProbeCommand(ompSource);
  assert.equal(omp.command, 'omp');
  assert.equal(omp.env.PI_CODING_AGENT_DIR, '/home/someone/.omp/profiles/x/agent');
  assert.deepEqual(omp.args.slice(0, 2), ['-p', 'Reply with the single word OK.']);
  assert.equal(credentialProbeCommand({ ...ompSource, files: ['auth.json', 'agent.db'] }).command, 'omp');
});

test('a layout fgOS cannot name, or a home that is not absolute, has no call', () => {
  assert.equal(credentialProbeCommand(agySource), null);
  assert.equal(credentialProbeCommand({ kind: 'codex-home', home: 'relative/dir' }), null);
  assert.equal(credentialProbeCommand({ kind: 'home-files', home: '/h', files: ['settings.json'] }), null);
  assert.equal(credentialProbeCommand(undefined), null);
});

test('a call is judged by exit code and by what it printed, not by the exit code alone', () => {
  assert.deepEqual(judgeProbeOutput({ exitCode: 0, timedOut: false, output: 'OK' }), { ok: true });
  assert.equal(judgeProbeOutput({ exitCode: 0, timedOut: false, output: 'Error: OAuth refresh failed for xai' }).ok, false);
  assert.equal(judgeProbeOutput({ exitCode: 1, timedOut: false, output: "You've hit your usage limit" }).ok, false);
  assert.match(judgeProbeOutput({ exitCode: 1, timedOut: false, output: '' }).detail, /code 1/);
  assert.match(judgeProbeOutput({ exitCode: null, timedOut: true, output: '' }).detail, /in time/);
});

function fakeSpawn({ output = '', exitCode = 0, never = false } = {}) {
  const seen = [];
  const spawnFn = (command, args, options) => {
    seen.push({ command, args, env: options.env });
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.kill = () => child.emit('close', null);
    // A real child delivers its output in many pieces, not one.
    if (!never) setImmediate(() => { for (let i = 0; i < output.length; i += 4096) child.stdout.emit('data', output.slice(i, i + 4096)); child.emit('close', exitCode); });
    return child;
  };
  return { spawnFn, seen };
}

test('the probe runs the planned command with the account home in its environment and answers ok', async () => {
  const { spawnFn, seen } = fakeSpawn({ output: 'OK' });
  const probe = createCredentialProbe({ spawnFn, env: { PATH: '/nonexistent-dir' } });

  const result = await probe({ account: { credentialSource: piSource } });

  assert.deepEqual(result, { ok: true });
  assert.equal(seen[0].command, 'pi');
  assert.equal(seen[0].env.PI_CODING_AGENT_DIR, '/home/someone/.pi/accounts/x');
  assert.equal(seen[0].env.PATH, '/nonexistent-dir');
});

test('the omp call is started with no stdin, because omp waits for end of input on a pipe', async () => {
  const seen = [];
  const spawnFn = (command, args, options) => {
    seen.push(options.stdio);
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    setImmediate(() => { child.stdout.emit('data', 'OK'); child.emit('close', 0); });
    return child;
  };
  const result = await createCredentialProbe({ spawnFn, env: {} })({ account: { credentialSource: ompSource } });
  assert.deepEqual(result, { ok: true });
  assert.equal(seen[0][0], 'ignore');
});

test('the probe says so, without running anything, when the layout has no call', async () => {
  const { spawnFn, seen } = fakeSpawn();
  const result = await createCredentialProbe({ spawnFn })({ account: { credentialSource: agySource } });
  assert.equal(result.ok, false);
  assert.match(result.detail, /no probe/);
  assert.deepEqual(seen, []);
});

test('a call that never finishes is stopped at the time limit and fails', async () => {
  const { spawnFn } = fakeSpawn({ never: true });
  const result = await createCredentialProbe({ spawnFn, timeoutMs: 20 })({ account: { credentialSource: codexSource } });
  assert.equal(result.ok, false);
  assert.match(result.detail, /in time/);
});

test('a command that cannot even start is a failed call, not an exception', async () => {
  const spawnFn = () => { throw new Error('spawn codex ENOENT'); };
  const result = await createCredentialProbe({ spawnFn })({ account: { credentialSource: codexSource } });
  assert.equal(result.ok, false);
  assert.match(result.detail, /ENOENT/);
});

test('a dead login named at the end of a long output is still seen, so the account stays locked', async () => {
  const noise = 'loaded skill description '.repeat(1500); // well over the retained size
  const { spawnFn } = fakeSpawn({ output: `${noise}\n{"errorMessage":"OAuth refresh failed for xai: xAI OAuth token refresh failed (HTTP 400): invalid_grant"}` });

  const result = await createCredentialProbe({ spawnFn })({ account: { credentialSource: piSource } });

  assert.equal(result.ok, false);
  assert.match(result.detail, /still rejected/);
});

test('the probe tells its caller about the child it started', async () => {
  const { spawnFn } = fakeSpawn({ output: 'OK' });
  const pids = [];
  const wrapped = (...args) => { const child = spawnFn(...args); child.pid = 777; return child; };
  const result = await createCredentialProbe({ spawnFn: wrapped, env: {} })({ account: { credentialSource: piSource }, onSpawn: (child) => pids.push(child.pid) });
  assert.equal(result.ok, true);
  assert.deepEqual(pids, [777]);
});

test('the unlock probe call is wrapped so it ends on its own, and runs unwrapped when timeout is not on PATH', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-probe-path-'));
  try {
    const bin = path.join(dir, 'timeout');
    fs.writeFileSync(bin, '#!/bin/sh\n', { mode: 0o755 });

    const wrapped = fakeSpawn({ output: 'OK' });
    const result = await createCredentialProbe({ spawnFn: wrapped.spawnFn, timeoutMs: 90_500, env: { PATH: dir } })({ account: { credentialSource: piSource } });
    assert.deepEqual(result, { ok: true });
    assert.equal(wrapped.seen[0].command, bin);
    assert.deepEqual(wrapped.seen[0].args.slice(0, 3), ['--kill-after=5', '91', 'pi']);
    assert.equal(wrapped.seen[0].env.PI_CODING_AGENT_DIR, '/home/someone/.pi/accounts/x');

    const bare = fakeSpawn({ output: 'OK' });
    await createCredentialProbe({ spawnFn: bare.spawnFn, env: { PATH: path.join(dir, 'nowhere') } })({ account: { credentialSource: piSource } });
    assert.equal(bare.seen[0].command, 'pi');
    assert.equal(withKillTimeout(null, 1000), null);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('the credential home expands ~, ${HOME} and $HOME, and is null unless absolute', () => {
  const home = os.homedir();
  assert.equal(expandCredentialHome('~/.pi/x'), path.join(home, '.pi/x'));
  assert.equal(expandCredentialHome('${HOME}/.pi/x'), path.join(home, '.pi/x'));
  assert.equal(expandCredentialHome('$HOME/.pi/x'), path.join(home, '.pi/x'));
  assert.equal(expandCredentialHome('~'), home);
  assert.equal(expandCredentialHome('/abs/dir'), '/abs/dir');
  assert.equal(expandCredentialHome('relative/dir'), null);
  assert.equal(expandCredentialHome('~other/dir'), null);
  assert.equal(expandCredentialHome(''), null);
  assert.equal(expandCredentialHome(undefined), null);
});
