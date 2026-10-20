import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ensureGitAddon, root } from '../../scripts/git-addon.mjs';
import { createGitRefs, createGitInspect } from '../../src/git/index.mjs';
import { acquireSync, createLockScope } from '../../src/holder-lock/index.mjs';
const built = ensureGitAddon();
const loader = { descriptor: { manifest: JSON.parse(fs.readFileSync(built.manifest)), releaseRoot: root } };
for (const backend of ['files', 'reftable']) test(`Refs exact-old CAS and registered checkout exclusion (${backend})`, { skip: process.platform === 'win32' }, () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-refs-'));
  const repoPath = path.join(temp, 'repo'); fs.mkdirSync(repoPath);
  const git = (...args) => execFileSync('git', ['-C', repoPath, ...args], { encoding: 'utf8', stdio: ['ignore','pipe','pipe'] }).trim();
  const fgosDir = path.join(repoPath, '.fgos');
  try {
    git('init','-q',`--ref-format=${backend}`,'--initial-branch=trunk');
    git('config','user.name','Fixture'); git('config','user.email','fixture@example.invalid');
    fs.writeFileSync(path.join(repoPath,'file'),'one'); git('add','.'); git('commit','-qm','one'); const first=git('rev-parse','HEAD');
    fs.writeFileSync(path.join(repoPath,'file'),'two'); git('commit','-qam','two'); const second=git('rev-parse','HEAD');
    fs.mkdirSync(path.join(fgosDir,'locks/activation.lock'),{recursive:true});
    fs.writeFileSync(path.join(fgosDir,'locks/activation.lock/TOMBSTONE'),JSON.stringify({lock:'activation',by:'fgos git',at:'fixture'}));
    const port=createGitRefs({stateRoot:temp,repoPath,trustedMain:repoPath,writer:'fixture'},loader);
    const name='refs/heads/topic';
    const created=port.ensureBranch({name,next:first,operationId:'create'}); assert.equal(created.attribution,'thisInvocationWonCas');
    assert.deepEqual(port.ensureBranch({name,next:first,operationId:'create'}),created);
    assert.throws(()=>port.advanceRef({name,expected:second,next:first,operationId:'stale'}),/stale/);
    port.advanceRef({name,expected:first,next:second,operationId:'advance'});
    const earlier=createGitInspect({stateRoot:temp,repoPath,trustedMain:repoPath},loader).listWorktrees(); assert.equal(earlier.entries.length,1);
    const linked=path.join(temp,'linked'); git('worktree','add','-q',linked,'topic');
    assert.throws(()=>port.deleteRef({name,expected:second,operationId:'used'}),/branch-in-use/);
    const inspect=createGitInspect({stateRoot:temp,repoPath:linked,trustedMain:linked},loader);
    assert.equal(inspect.resolveRepo().trustedMainRoot,repoPath);
    fs.mkdirSync(path.join(linked,'subdir'));
    assert.equal(createGitInspect({stateRoot:temp,repoPath:path.join(linked,'subdir'),trustedMain:path.join(linked,'subdir')},loader).resolveRepo().gitDir, inspect.resolveRepo().gitDir);
    fs.rmdirSync(path.join(linked,'subdir'));
    git('worktree','remove',linked);
    for (const lockName of ['worktree-admin','main-checkout','event-append']) {
      const acquired=acquireSync(createLockScope(),lockName,{fgosDir,eventOpenRoot:temp}); assert.equal(acquired.result,'acquired');
      try {assert.throws(()=>port.deleteRef({name,expected:second,operationId:`order-${lockName}`},[acquired.handle]),/lock-order-violation/);} finally {acquired.handle.release();}
    }
    port.deleteRef({name,expected:second,operationId:'delete'});
    assert.throws(()=>git('show-ref','--verify',name));
  } finally {fs.rmSync(temp,{recursive:true,force:true});}
});
