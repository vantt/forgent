import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Wiring only: the `fgos hook main-checkout-delete-guard` door reads each CLI's payload and answers
// in its protocol. Which commands are refused is owned by test/git/main-checkout-delete-guard.test.mjs.

const bin = fileURLToPath(new URL('../../bin/fgos.mjs', import.meta.url));
const INCIDENT = "cd /nonexistent/forgent-worktrees/x && npm ci; git status --porcelain --ignored | grep '^!!' | xargs rm -rf";

function mainCheckout() {
  const main = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'delete-guard-hook-')));
  fs.mkdirSync(path.join(main, '.git'));
  fs.mkdirSync(path.join(main, '.fgos'));
  return main;
}

const runHook = (payload, flags = []) => spawnSync(process.execPath, [bin, 'hook', 'main-checkout-delete-guard', ...flags], { encoding: 'utf8', input: JSON.stringify(payload) });

test('the hook door refuses a shell call with exit 2 and names the safe doors, and lets others through', () => {
  const main = mainCheckout();
  const refused = runHook({ tool_name: 'Bash', tool_input: { command: INCIDENT }, cwd: main });
  assert.equal(refused.status, 2, refused.stderr);
  assert.match(refused.stderr, /fgos worktree remove <path> --delivered-to <ref> --discard-ignored/);
  assert.match(refused.stderr, /git -C <linked-worktree>/);
  const codexArgv = runHook({ tool_name: 'Bash', tool_input: { command: ['bash', '-lc', 'git clean -fdx'] }, cwd: main });
  assert.equal(codexArgv.status, 2, 'an argv command is unwrapped');
  for (const payload of [{ tool_name: 'Bash', tool_input: { command: 'rm sc.log' }, cwd: main }, { tool_name: 'Read', tool_input: { file_path: 'x' }, cwd: main }, {}]) {
    const allowed = runHook(payload);
    assert.equal(allowed.status, 0, allowed.stderr);
  }
});

test('the agy form answers a JSON decision on stdout', () => {
  const main = mainCheckout();
  const call = (CommandLine) => runHook({ toolCall: { name: 'run_command', args: { CommandLine } }, workspacePaths: [main] }, ['--format=agy']);
  const denied = call(INCIDENT);
  assert.equal(denied.status, 0);
  assert.equal(JSON.parse(denied.stdout).decision, 'deny');
  assert.equal(JSON.parse(call('ls').stdout).decision, 'allow');
});
