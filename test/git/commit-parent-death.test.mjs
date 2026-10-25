import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { ensureGitAddon, root } from '../../scripts/git-addon.mjs';
import { acquireSync, createLockScope } from '../../src/holder-lock/index.mjs';
import { createGitScopedCommit, createGitSync } from '../../src/git/index.mjs';
import { fixLandRecovery } from '../../src/setup/git-checks.mjs';
const built = ensureGitAddon();
const loader = { descriptor: { manifest: JSON.parse(fs.readFileSync(built.manifest)), releaseRoot: root } };
const pause = () => new Promise(resolve => setTimeout(resolve, 10));
async function until(check, label) {
  const deadline = Date.now() + 15000;
  while (!check()) { assert.ok(Date.now() < deadline, label); await pause(); }
}
for (const mode of ['commit', 'sync']) for (const rejected of [false,true]) {
  test(`${mode}: controller death retains custody and recovers ${rejected ? 'unknown rejection' : 'immutable commit'} without replay`, { skip: process.platform !== 'linux', timeout: 30000 }, async () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), `fgos-${mode}-death-`));
    const repo = path.join(temp, 'repo'), linked = path.join(temp, 'linked');
    const git = (cwd, ...args) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' }).trim();
    fs.mkdirSync(repo);git(repo, 'init', '-q', '--initial-branch=trunk');git(repo, 'config', 'user.name', 'Fixture');git(repo, 'config', 'user.email', 'fixture@example.invalid');
    fs.writeFileSync(path.join(repo, 'a'), 'base');git(repo, 'add', 'a');git(repo, 'commit', '-qm', 'base');git(repo, 'worktree', 'add', '-qb', 'producer', linked);
    fs.writeFileSync(path.join(repo, 'incoming'), 'target');git(repo, 'add', 'incoming');git(repo, 'commit', '-qm', 'target');
    const target = git(repo, 'rev-parse', 'HEAD'), head = git(linked, 'rev-parse', 'HEAD');
    const fence = path.join(repo, '.fgos/locks/activation.lock');fs.mkdirSync(fence, { recursive: true });fs.writeFileSync(path.join(fence, 'TOMBSTONE'), JSON.stringify({ lock: 'activation', by: 'fgos git', at: 'fixture' }));
    const hooks = path.join(repo, 'hooks');fs.mkdirSync(hooks);git(repo, 'config', 'core.hooksPath', 'hooks');
    const ready = path.join(temp, 'ready'), go = path.join(temp, 'go');
    fs.writeFileSync(path.join(hooks, 'pre-commit'), `#!/bin/sh\necho $$ > '${ready}'\nwhile test ! -f '${go}'; do sleep 0.01; done\nexit ${rejected?1:0}\n`, { mode: 0o755 });
    const params = { fgosDir: path.join(repo, '.fgos'), cwd: linked };
    const config = { stateRoot: temp, repoPath: linked, trustedMain: repo, writer: 'fixture' };
    const request = { writes: ['a'], message: 'crash commit', cutoverGrant: null };
    const worker = spawn(process.execPath, ['--input-type=module', '-e', `
      import fs from 'node:fs';
      import {acquireSync,createLockScope} from ${JSON.stringify(pathToFileURL(path.join(root, 'src/holder-lock/index.mjs')).href)};
      import {createGitScopedCommit,createGitSync} from ${JSON.stringify(pathToFileURL(path.join(root, 'src/git/index.mjs')).href)};
      const h=acquireSync(createLockScope(),'dispatch-cwd',${JSON.stringify(params)}).handle;
      const config=${JSON.stringify(config)}, loader=${JSON.stringify(loader)};
      if (${JSON.stringify(mode)}==='commit') {
        const port=createGitScopedCommit(config,loader),baseline=port.preflight({},[h]);
        fs.writeFileSync(${JSON.stringify(path.join(temp, 'baseline.json'))},JSON.stringify(baseline));
        fs.writeFileSync(${JSON.stringify(path.join(linked, 'a'))},'producer');
        port.commit({operationId:'death',baseline,request:${JSON.stringify(request)}},[h]);
      } else createGitSync(config,loader).start({operationId:'death',target:${JSON.stringify(target)},message:'crash sync'},[h]);
      h.release();
    `], { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';worker.stderr.on('data', bytes => { stderr += bytes; });
    const exited = once(worker, 'exit');
    let holder;
    try {
      await until(() => fs.existsSync(ready), `hook barrier was not reached: ${stderr}`);
      assert.equal(acquireSync(createLockScope(), 'dispatch-cwd', params).result, 'held');
      worker.kill('SIGKILL');await exited;
      assert.equal(acquireSync(createLockScope(), 'dispatch-cwd', params).result, 'held', 'Git/hook must retain custody after controller death');
      fs.writeFileSync(go, 'continue');
      await until(() => {
        const answer = acquireSync(createLockScope(), 'dispatch-cwd', params);
        if (answer.result !== 'acquired') return false;
        holder = answer.handle;return true;
      }, 'Git did not release custody');
      const observed = git(linked, 'rev-parse', 'HEAD');if(rejected)assert.equal(observed,head);else assert.notEqual(observed, head);
      if (mode === 'commit') {
        const baseline = JSON.parse(fs.readFileSync(path.join(temp, 'baseline.json')));
        const port = createGitScopedCommit(config, loader);
        assert.throws(() => port.commit({ operationId: 'death', baseline, request }, [holder]), /commit-attempt-recovery-required/);
        // doctor --fix takes the checkout's custody per pending ScopedCommit: busy while a holder has it, kept for a
        // writer that is not the operation's, and closed (custody free afterwards) for the writer that started it
        assert.match(fixLandRecovery(linked, loader, { ...config, writer: 'doctor' }).message, /death \(checkout busy: /);
        holder.release();
        const kept = fixLandRecovery(linked, loader, { ...config, writer: 'doctor' });
        assert.equal(kept.changed, false);
        assert.match(kept.message, /death \(commit-authority-mismatch; only its writer .* can recover it\)/);
        const closed = fixLandRecovery(linked, loader, config);
        assert.equal(closed.changed, true, closed.message);
        assert.match(closed.message, /recovered interrupted Git operations: death/);
        const free = acquireSync(createLockScope(), 'dispatch-cwd', params);
        assert.equal(free.result, 'acquired');
        holder = free.handle;
        const outcome=port.recover({operationId:'death'},[holder]);
        if(rejected)assert.equal(outcome.cause,'commit-effect-unknown');
        else {assert.equal(outcome.observed, observed);assert.equal(port.commit({operationId:'death',baseline,request},[holder]).oid,observed);}
      } else {
        const port = createGitSync(config, loader);
        const result=port.continue({operationId:'death'},[holder]);
        if(rejected){assert.equal(result.state,'rejected-open');port.abort({operationId:'death'},[holder]);}
        else assert.equal(result.commit.oid, observed);
      }
      assert.equal(git(linked, 'rev-parse', 'HEAD'), observed);
      git(repo,'config','core.hooksPath','/dev/null');
      const fresh=createGitScopedCommit(config,loader);
      const baseline=fresh.preflight({},[holder]);fs.writeFileSync(path.join(linked,'fresh'),'fresh after crash');
      assert.equal(fresh.commit({operationId:'fresh',baseline,request:{...request,writes:['fresh']}},[holder]).status,'committed');
    } finally {
      fs.writeFileSync(go, 'continue');
      if (worker.exitCode === null && worker.signalCode === null) worker.kill('SIGKILL');
      await exited;
      if (holder) holder.release();
      // The hook polls for `go`; removing the fixture before it has seen the file would leave it, and the git
      // commit above it, looping forever after the run.
      const hookPid = fs.existsSync(ready) ? Number(fs.readFileSync(ready, 'utf8')) : 0;
      // Still this fixture's hook, never a process that reused the pid.
      const alive = () => { try { return fs.readFileSync(`/proc/${hookPid}/cmdline`, 'utf8').includes(hooks); } catch { return false; } };
      for (const deadline = Date.now() + 5000; hookPid > 0 && alive() && Date.now() < deadline;) await pause();
      if (hookPid > 0 && alive()) process.kill(hookPid, 'SIGKILL');
      fs.rmSync(temp, { recursive: true, force: true });
    }
  });
}
