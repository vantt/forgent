import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The sandbox door's command-line entry (scripts/lib/sandbox-git.mjs) is how a shell script such as
// scripts/ci-external-consumer.sh reaches the door; no other test runs it as a process.
const door = fileURLToPath(new URL('../../scripts/lib/sandbox-git.mjs', import.meta.url));
const cli = (args) => spawnSync(process.execPath, [door, ...args], { encoding: 'utf8' });

test('the sandbox-git command line runs git inside its root and refuses a repository outside it, as sandboxGit does', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sandbox-git-cli-'));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'sandbox-git-cli-outside-'));
  const project = path.join(root, 'project');
  try {
    assert.equal(cli(['--root', root, '--', 'init', '-q', project]).status, 0);
    assert.equal(cli(['--root', root, '--', '-C', project, 'config', 'user.name', 'CI Consumer']).status, 0);
    const read = cli(['--root', root, '--', '-C', project, 'config', 'user.name']);
    assert.deepEqual([read.status, read.stdout], [0, 'CI Consumer\n']);

    const refused = cli(['--root', root, '--', '-C', outside, 'init', '-q']);
    assert.notEqual(refused.status, 0);
    assert.match(refused.stderr, /is outside the sandbox root/);
    assert.equal(fs.existsSync(path.join(outside, '.git')), false);

    const failed = cli(['--root', root, '--', '-C', project, 'config', 'no.such']);
    assert.equal(failed.status, 1, 'a failing git call passes its exit status through');

    const usage = cli(['--root', root, 'init']);
    assert.equal(usage.status, 2);
    assert.match(usage.stderr, /^usage: /);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  }
});
