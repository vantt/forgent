import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { probe, resolveLock } from '../../src/holder-lock/index.mjs';
import { activateGitFixture } from '../helpers/git-fixture.mjs';

const skip = process.platform !== 'linux' ? 'Linux inherited flock and FIFO vectors' : false;
const admission = new URL('../../src/runner/dispatch/cwd-lock.mjs', import.meta.url).href;
const facade = new URL('../../src/holder-lock/index.mjs', import.meta.url).href;
const commit = new URL('../../src/runner/execution/commit-unit-work.mjs', import.meta.url).href;

async function waitFor(predicate) {
  const until = Date.now() + 15000;
  while (!predicate()) {
    assert.ok(Date.now() < until, 'barrier was not reached');
    await new Promise((r) => setTimeout(r, 10));
  }
}

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-custody-commit-'));
  const git = (...args) => execFileSync('git', args, { cwd: root, stdio: 'pipe' });
  git('init', '-q', '-b', 'main');
  git('config', 'user.name', 'Custody Test');
  git('config', 'user.email', 'custody@example.invalid');
  git('config', 'commit.gpgsign', 'false');
  fs.writeFileSync(path.join(root, 'seed'), 'seed');
  git('add', 'seed'); git('commit', '-qm', 'initial');
  const worktree = path.join(root, 'worktree');
  git('worktree', 'add', '-qb', 'unit', worktree);
  activateGitFixture(root);
  const fifo = path.join(root, 'go');
  const ready = path.join(root, 'ready');
  execFileSync('mkfifo', [fifo]);
  const hook = path.join(root, '.git', 'hooks', 'pre-commit');
  fs.writeFileSync(hook, `#!/bin/sh\n${JSON.stringify(process.execPath)} --input-type=module -e '
    import { checkBorrowedDescription } from ${JSON.stringify(facade)};
    import fs from "node:fs";
    const answer = checkBorrowedDescription(process.env.LEASE_PATH);
    if (answer.result !== "borrower") process.exit(90);
    fs.writeFileSync(process.env.READY_PATH, JSON.stringify(answer));
  '\nread proceed < ${JSON.stringify(fifo)}\n`);
  fs.chmodSync(hook, 0o755);
  const fgosDir = path.join(root, '.fgos');
  const params = { fgosDir, cwd: worktree };
  const lockPath = resolveLock('dispatch-cwd', params).v3Path;
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return { root, worktree, fgosDir, params, lockPath, fifo, ready };
}

for (const killController of [false, true]) {
  test(`runner commit borrows custody through a blocking real hook${killController ? ' after controller SIGKILL' : ' and recorded handoff'}`, { skip }, async (t) => {
    const f = fixture(t);
    const actor = spawn(process.execPath, ['--input-type=module', '-e', `
      import { admitSuccessor } from ${JSON.stringify(admission)};
      import { createLockScope } from ${JSON.stringify(facade)};
      import { commitUnitWork, preflightUnitWorktree } from ${JSON.stringify(commit)};
      import fs from 'node:fs';
      const custody = admitSuccessor(createLockScope('unit'), ${JSON.stringify(f.fgosDir)}, ${JSON.stringify(f.worktree)});
      try {
        const git = { worktree: ${JSON.stringify(f.worktree)}, repoRoot: ${JSON.stringify(f.root)}, custody };
        const { baseline } = preflightUnitWorktree({ ...git, scope: ['result.txt'] });
        fs.writeFileSync(${JSON.stringify(path.join(f.worktree, 'result.txt'))}, 'completed work');
        const result = commitUnitWork({ ...git, baseline, unitId: 'custody', summary: 'fix(test): custody commit', scope: ['result.txt'] });
        if (result.status !== 'committed') throw new Error(JSON.stringify(result));
        custody.clearDomain();
        process.stdout.write(JSON.stringify(result));
      } finally { custody.release(); }
    `], { env: { ...process.env, LEASE_PATH: f.lockPath, READY_PATH: f.ready }, stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = ''; actor.stderr.on('data', (d) => { stderr += d; });
    const ended = once(actor, 'exit');
    t.after(() => actor.kill('SIGKILL'));
    await waitFor(() => fs.existsSync(f.ready) || actor.exitCode !== null);
    assert.ok(fs.existsSync(f.ready), stderr);
    assert.equal(JSON.parse(fs.readFileSync(f.ready)).name, 'dispatch-cwd');
    assert.equal(probe('dispatch-cwd', f.params).result, 'held');
    if (killController) {
      actor.kill('SIGKILL'); await ended;
      assert.equal(probe('dispatch-cwd', f.params).result, 'held', 'the git child retains the description after controller death');
    }
    // A FIFO writer releases the hook's real blocking read, no timing-based
    // assumption about the duration of git commit or the controller's exit.
    const writer = spawn('/bin/sh', ['-c', 'printf "go\\n" > "$1"', 'barrier', f.fifo]);
    assert.deepEqual(await once(writer, 'exit'), [0, null]);
    if (!killController) assert.deepEqual(await ended, [0, null], stderr);
    await waitFor(() => probe('dispatch-cwd', f.params).result === 'free');
    const subject = execFileSync('git', ['log', '-1', '--format=%s'], { cwd: f.worktree, encoding: 'utf8' }).trim();
    assert.equal(subject, 'fix(test): custody commit');
    assert.equal(fs.existsSync(`${f.lockPath}.predecessor.json`), false);
  });
}

test('custody-backed runner commit accepts hook output above 16 MiB within its 64 MiB limit', { skip }, async (t) => {
  const { admitSuccessor } = await import('../../src/runner/dispatch/cwd-lock.mjs');
  const { createLockScope } = await import('../../src/holder-lock/index.mjs');
  const { commitUnitWork, preflightUnitWorktree } = await import('../../src/runner/execution/commit-unit-work.mjs');
  const f = fixture(t);
  const hook = path.join(f.root, '.git', 'hooks', 'pre-commit');
  fs.writeFileSync(hook, `#!/bin/sh\n${JSON.stringify(process.execPath)} -e "process.stdout.write('x'.repeat(17 * 1024 * 1024))"\n`);
  const custody = admitSuccessor(createLockScope('large-commit-output'), f.fgosDir, f.worktree);
  try {
    const git = { worktree: f.worktree, repoRoot: f.root, custody };
    const { baseline } = preflightUnitWorktree({ ...git, scope: ['result.txt'] });
    fs.writeFileSync(path.join(f.worktree, 'result.txt'), 'completed work');
    const result = commitUnitWork({ ...git, baseline, unitId: 'capture', summary: 'fix(test): large hook output', scope: ['result.txt'] });
    assert.equal(result.status, 'committed', JSON.stringify(result).slice(0, 2000));
    assert.deepEqual(result.files, ['result.txt']);
    custody.clearDomain();
  } finally { custody.release(); }
});
