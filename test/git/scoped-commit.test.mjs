import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ensureGitAddon, root } from '../helpers/git-addon.mjs';
import { createGitScopedCommit } from '../../src/git/index.mjs';
import { acquireSync, createLockScope } from '../../src/holder-lock/index.mjs';
const built=ensureGitAddon();
const loader={descriptor:{manifest:JSON.parse(fs.readFileSync(built.manifest)),releaseRoot:root}};
function fixture() {
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'fgos-scoped-'));
  const repo=path.join(temp,'repo');fs.mkdirSync(repo);
  const git=(...args)=>execFileSync('git',['-C',repo,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  git('init','-q','--initial-branch=trunk');git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid');
  fs.writeFileSync(path.join(repo,'a'),'base');git('add','.');git('commit','-qm','base');
  const linked=path.join(temp,'linked');git('worktree','add','-qb','producer',linked);
  const fence=path.join(repo,'.fgos/locks/activation.lock');fs.mkdirSync(fence,{recursive:true});fs.writeFileSync(path.join(fence,'TOMBSTONE'),JSON.stringify({lock:'activation',by:'fgos git',at:'fixture'}));
  const lease=acquireSync(createLockScope(),'dispatch-cwd',{fgosDir:path.join(repo,'.fgos'),cwd:linked});assert.equal(lease.result,'acquired');
  const port=createGitScopedCommit({stateRoot:temp,repoPath:linked,trustedMain:repo,writer:'fixture'},loader);
  return {temp,repo,linked,git,port,held:[lease.handle],close(){lease.handle.release();fs.rmSync(temp,{recursive:true,force:true});}};
}
test('ScopedCommit requires exact custody, preserves pre-existing dirt and literal path names',()=>{
  const f=fixture();try {
    assert.throws(()=>f.port.preflight(),/custody/);
    fs.writeFileSync(path.join(f.linked,'old-dirt'),'keep');
    const baseline=f.port.preflight({},f.held);
    fs.writeFileSync(path.join(f.linked,'a'),'changed');fs.writeFileSync(path.join(f.linked,'[literal]'),'literal');fs.writeFileSync(path.join(f.linked,'outside'),'outside');
    const args={operationId:'exact',baseline,request:{writes:['a','[literal]','old-dirt'],message:'custom subject\n\nbody\n',cutoverGrant:null}};
    const result=f.port.commit(args,f.held);assert.equal(result.status,'committed');assert.deepEqual(result.files,['[literal]','a']);
    assert.equal(execFileSync('git',['-C',f.linked,'show','-s','--format=%B'],{encoding:'utf8'}),'custom subject\n\nbody\n\n');
    assert.equal(f.port.commit(args,f.held).oid,result.oid);
    assert.equal(fs.readFileSync(path.join(f.linked,'old-dirt'),'utf8'),'keep');
  } finally {f.close();}
});
test('ScopedCommit refuses foreign staged entries even within the write scope',()=>{
  const f=fixture();try {fs.writeFileSync(path.join(f.linked,'a'),'dirty');execFileSync('git',['-C',f.linked,'add','a']);assert.throws(()=>f.port.preflight({},f.held),/foreign-staged/);} finally {f.close();}
});
test('ScopedCommit records actual effect when a real hook changes the selected tree',()=>{
  const f=fixture();try {
    const hooks=path.join(f.repo,'hooks');fs.mkdirSync(hooks);fs.writeFileSync(path.join(hooks,'pre-commit'),'#!/bin/sh\nprintf hook > a\ngit add a\n',{mode:0o755});f.git('config','core.hooksPath','hooks');
    const baseline=f.port.preflight({},f.held);fs.writeFileSync(path.join(f.linked,'a'),'producer');
    const result=f.port.commit({operationId:'hook-tree',baseline,request:{writes:['a'],message:'hook test',cutoverGrant:null}},f.held);
    assert.equal(result.status,'committed-but-contract-violation');assert.equal(execFileSync('git',['-C',f.linked,'show','HEAD:a'],{encoding:'utf8'}),'hook');assert.ok(result.oid);
  } finally {f.close();}
});
test('ScopedCommit preserves rejection evidence and unstages only its own paths',()=>{
  const f=fixture();try {
    const hooks=path.join(f.repo,'hooks');fs.mkdirSync(hooks);fs.writeFileSync(path.join(hooks,'pre-commit'),'#!/bin/sh\necho original-hook-rejection >&2\nexit 1\n',{mode:0o755});f.git('config','core.hooksPath','hooks');
    const baseline=f.port.preflight({},f.held);fs.writeFileSync(path.join(f.linked,'a'),'producer');
    assert.throws(()=>f.port.commit({operationId:'hook-refusal',baseline,request:{writes:['a'],message:'refuse',cutoverGrant:null}},f.held),/commit-rejected/);
    assert.equal(execFileSync('git',['-C',f.linked,'diff','--cached','--name-only'],{encoding:'utf8'}),'');assert.equal(fs.readFileSync(path.join(f.linked,'a'),'utf8'),'producer');
  } finally {f.close();}
});
