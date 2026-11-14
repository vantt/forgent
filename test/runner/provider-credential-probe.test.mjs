import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  createCredentialProbe,
  credentialProbeCommand,
  judgeProbeOutput,
  withKillTimeout,
} from '../../src/runner/dispatch/provider-credential-probe.mjs';
import { expandCredentialHome } from '../../src/runner/dispatch/provider-capacity.mjs';

const codexSource = { kind: 'codex-home', home: '${HOME}/.codex-test' };
const piSource = { kind: 'home-files', home: '/home/someone/.pi/accounts/x', files: ['auth.json', 'settings.json'] };
const ompSource = { kind: 'home-files', home: '/home/someone/.omp/profiles/x/agent', files: ['agent.db', 'config.yml'] };
const agySource = { kind: 'home-files', home: '/home/someone/.agy-homes/x', files: ['.gemini/antigravity-cli/antigravity-oauth-token'] };

test('the call is built per credential layout, pointing the CLI at the account home and asking for the named model', () => {
  const codex = credentialProbeCommand(codexSource);
  assert.equal(codex.command, 'codex');
  assert.equal(codex.env.CODEX_HOME, path.join(os.homedir(), '.codex-test'));
  assert.ok(codex.args.includes('exec'));

  const pi = credentialProbeCommand(piSource);
  assert.equal(pi.command, 'pi');
  assert.equal(pi.env.PI_CODING_AGENT_DIR, '/home/someone/.pi/accounts/x');

  // Claude Code reads its login from its config directory, which the call is pointed at.
  const claude = credentialProbeCommand({ kind: 'home-files', home: '/home/someone/.claude-homes/x', files: ['.credentials.json'] }, { noTools: true });
  assert.equal(claude.command, 'claude');
  assert.equal(claude.home, '/home/someone/.claude-homes/x');
  assert.deepEqual(claude.env, { CLAUDE_CONFIG_DIR: '/home/someone/.claude-homes/x' });
  assert.deepEqual(claude.args, ['-p', 'Reply with the single word OK.', '--no-session-persistence', '--tools', ''], 'a renewal call gets no tools');

  // A login kept under HOME is read through HOME, which the call is given as the account home.
  const underHome = credentialProbeCommand({ kind: 'home-files', home: '/home/someone/.claude-homes/x', files: ['.claude/.credentials.json'] }, { noTools: true });
  assert.equal(underHome.command, 'claude');
  assert.deepEqual(underHome.env, {});

  // A named model is asked for in each CLI's own spelling; none leaves the call as it was.
  const withModel = (source, options) => credentialProbeCommand(source, { model: 'm-1', ...options }).args;
  assert.deepEqual(withModel(codexSource).slice(0, 6), ['exec', '--skip-git-repo-check', '-s', 'read-only', '-m', 'm-1']);
  assert.deepEqual(withModel(piSource).slice(2, 5), ['--mode', 'json', '--model']);
  assert.ok(withModel(piSource).includes('m-1'));
  assert.deepEqual(withModel(ompSource).slice(4, 6), ['--model', 'm-1']);
  const claudeSource = { kind: 'home-files', home: '/home/someone/.claude-homes/x', files: ['.credentials.json'] };
  assert.deepEqual(withModel(claudeSource, { noTools: true }), ['-p', 'Reply with the single word OK.', '--no-session-persistence', '--model', 'm-1', '--tools', '']);
  assert.ok(!credentialProbeCommand(codexSource).args.includes('-m'));
  assert.ok(!credentialProbeCommand(piSource).args.includes('--model'));
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

test('a call is judged by exit code and by the CLI\'s last words through the agent protocol, not by the exit code alone', () => {
  const judge = (args) => judgeProbeOutput({ timedOut: false, cli: 'pi', ...args });
  assert.deepEqual(judge({ exitCode: 0, output: 'OK' }), { ok: true, reason: null, providerSignal: null });
  assert.equal(judge({ exitCode: 0, output: 'Error: OAuth refresh failed for xai' }).reason, 'login');
  const limited = judge({ cli: 'codex', exitCode: 1, output: "You've hit your usage limit" });
  assert.equal(limited.reason, 'usage-limit');
  assert.ok('providerSignal' in limited);
  assert.equal(judge({ exitCode: 1, output: '' }).reason, null, 'a plain exit code names no reason');
  assert.equal(judge({ exitCode: null, timedOut: true, output: '' }).reason, null);
  assert.equal(judge({ exitCode: 0, output: 'Error: OAuth refresh failed for xai' }).ok, false);
  assert.match(judge({ exitCode: 0, output: 'Error: OAuth refresh failed for xai' }).detail, /still rejected/);
  assert.match(judge({ cli: 'codex', exitCode: 1, output: "You've hit your usage limit" }).detail, /usage limit/);
  assert.match(judge({ exitCode: 1, output: 'Error: 402: {"message":"This request requires more credits"}' }).detail, /usage limit/, 'every wording the protocol reads as a used-up quota is one here too');
  assert.deepEqual(judge({ cli: 'codex', exitCode: 0, output: "You've hit your usage limit" }), { ok: true, reason: null, providerSignal: null }, 'a quota wording with a zero exit is not a failed call');
  assert.match(judge({ exitCode: 1, output: '' }).detail, /code 1/);
  assert.match(judge({ exitCode: null, timedOut: true, output: '' }).detail, /in time/);
});

test('the last JSON event of stdout names a refusal, and the provider\'s own status shows in the detail', () => {
  const event = (errorStatus, errorMessage) => JSON.stringify({ type: 'message_end', message: { stopReason: 'error', errorStatus, errorMessage } });
  const quota = judgeProbeOutput({ exitCode: 1, timedOut: false, cli: 'gemini', output: event(429, 'quota exhausted'), stdout: event(429, 'quota exhausted') });
  assert.match(quota.detail, /usage limit \(HTTP 429\)/);
  assert.equal(quota.reason, 'usage-limit');
  assert.equal(quota.providerSignal?.status, 429);
  const refused = judgeProbeOutput({ exitCode: 1, timedOut: false, cli: 'pi', output: event(404, 'no such model'), stdout: event(404, 'no such model') });
  assert.match(refused.detail, /provider refused the call \(HTTP 404\)/);
  assert.match(judgeProbeOutput({ exitCode: 1, timedOut: false, cli: 'pi', output: event(401, 'bad key'), stdout: event(401, 'bad key') }).detail, /code 1/, 'a 401 is not read as a quota or a provider fault');
});

test('only the final lines of the output count: a login wording far up a long output is not a dead login', () => {
  const longLog = ['Error: OAuth refresh failed for xai', ...Array.from({ length: 8 }, (_, i) => `working ${i}`)].join('\n');
  assert.deepEqual(judgeProbeOutput({ exitCode: 0, timedOut: false, cli: 'pi', output: longLog }), { ok: true, reason: null, providerSignal: null });
  assert.equal(judgeProbeOutput({ exitCode: 0, timedOut: false, cli: 'pi', output: `${longLog}\nNo API key found for openrouter.` }).ok, false);
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

  assert.deepEqual({ ...result, elapsedMs: undefined }, { ok: true, reason: null, providerSignal: null, exitCode: 0, timedOut: false, elapsedMs: undefined });
  assert.ok(Number.isInteger(result.elapsedMs) && result.elapsedMs >= 0, 'the call is timed');
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
  assert.equal(result.ok, true);
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

test('without its own spawn the probe starts the call through the lock spawn it is handed, and answers only after that call let go of the lock', async () => {
  const { spawnFn, seen } = fakeSpawn({ output: 'OK' });
  let letGo;
  const borrowed = new Promise((resolve) => { letGo = resolve; });
  const spawnHolding = (...args) => { const child = spawnFn(...args); child.borrowed = borrowed; return child; };
  let answered = false;
  const pending = createCredentialProbe({ env: {} })({ account: { credentialSource: piSource }, spawnHolding }).then((result) => { answered = true; return result; });
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(seen.length, 1, 'the call ran through the handed spawn');
  assert.equal(answered, false, 'no answer while the call still holds the lock');
  letGo({ exit: 0, signal: null, leftoversKilled: 0 });
  assert.equal((await pending).ok, true);
});

test('the unlock probe call is wrapped so it ends on its own, and runs unwrapped when timeout is not on PATH', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-probe-path-'));
  try {
    const bin = path.join(dir, 'timeout');
    fs.writeFileSync(bin, '#!/bin/sh\n', { mode: 0o755 });

    const wrapped = fakeSpawn({ output: 'OK' });
    const result = await createCredentialProbe({ spawnFn: wrapped.spawnFn, timeoutMs: 90_500, env: { PATH: dir } })({ account: { credentialSource: piSource } });
    assert.equal(result.ok, true);
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
