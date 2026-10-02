// The launcher script runs in a pane's shell, which rewrites SHLVL and `_` for every program
// it starts. Those variables describe the shell, so they are neither exported by the launcher
// nor held against the running process as an environment tamper.

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

import { buildLauncherScriptContent, verifyProcessEnvironment } from '../../src/runner/dispatch/herdr-round.mjs';

test('the launcher script does not export shell-managed variables', () => {
  const script = buildLauncherScriptContent({
    argv0: 'agent',
    command: '/bin/true',
    args: [],
    env: { SHLVL: '3', _: '/usr/bin/env', PWD: '/x', OLDPWD: '/y', KEEP_ME: 'yes' },
    workerCommandDigest: 'sha256:x',
  });
  assert.match(script, /export KEEP_ME=yes/);
  assert.doesNotMatch(script, /export (SHLVL|_|PWD|OLDPWD)=/);
});

test('verifyProcessEnvironment ignores shell-managed variables but still catches a real override', async () => {
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
    env: { PATH: process.env.PATH, KEEP_ME: 'yes', SHLVL: '1' },
    stdio: 'ignore',
  });
  try {
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.equal(verifyProcessEnvironment(child.pid, { KEEP_ME: 'yes', SHLVL: '9', _: '/usr/bin/env' }), true);
    assert.equal(verifyProcessEnvironment(child.pid, { KEEP_ME: 'no' }), false);
  } finally {
    child.kill('SIGKILL');
  }
});
