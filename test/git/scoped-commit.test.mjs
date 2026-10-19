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

test('ScopedCommit receipt replay retains the actual hook-expanded file set',()=>{
  const f=fixture();try {
    const hooks=path.join(f.repo,'hooks');fs.mkdirSync(hooks);
    fs.writeFileSync(path.join(hooks,'pre-commit'),'#!/bin/sh\nprintf added > hook-added\ngit add hook-added\n',{mode:0o755});f.git('config','core.hooksPath','hooks');
    const baseline=f.port.preflight({},f.held);fs.writeFileSync(path.join(f.linked,'a'),'producer');
    const request={operationId:'hook-expanded',baseline,request:{writes:['a'],message:'hook test',cutoverGrant:null}};
    const first=f.port.commit(request,f.held);assert.equal(first.status,'committed-but-contract-violation');assert.deepEqual(first.files,['a','hook-added']);
    assert.deepEqual(f.port.commit(request,f.held),first);
  } finally {f.close();}
});
test('ScopedCommit refuses a changed baseline and a foreign merge without staging',()=>{
  const f=fixture();try {
    const baseline=f.port.preflight({},f.held);fs.writeFileSync(path.join(f.linked,'a'),'producer');
    const request={operationId:'stale',baseline,request:{writes:['a'],message:'stale',cutoverGrant:null}};
    execFileSync('git',['-C',f.linked,'commit','--allow-empty','-qm','advanced']);
    assert.throws(()=>f.port.commit(request,f.held),/baseline-stale/);
    const gitdir=execFileSync('git',['-C',f.linked,'rev-parse','--absolute-git-dir'],{encoding:'utf8'}).trim();
    fs.writeFileSync(path.join(gitdir,'MERGE_HEAD'),f.git('rev-parse','HEAD')+'\n');
    assert.throws(()=>f.port.preflight({},f.held),/foreign-merge-head/);
    assert.equal(execFileSync('git',['-C',f.linked,'diff','--cached','--name-only'],{encoding:'utf8'}),'');
  } finally {f.close();}
});
for (const main of [false,true]) test(`ScopedCommit ${main?'main 50':'custody 30'} refuses executable filter config and drains hook background children with gc enabled`,{skip:process.platform!=='linux'},()=>{
  const f=fixture();const pids=[];
  try {
    const repoPath=main?f.repo:f.linked;
    const hooks=path.join(f.repo,'hooks');fs.mkdirSync(hooks);
    const hookPid=path.join(f.temp,'hook.pid'),filterPid=path.join(f.temp,'filter.pid');
    const hookEvidence=path.join(f.temp,'hook-context');
    const escape=file=>`sleep 30 </dev/null >/dev/null 2>&1 &\necho $! >> '${file}'\n`;
    fs.writeFileSync(path.join(hooks,'pre-commit'),`#!/bin/sh\n${escape(hookPid)}printf '%s\\n' "$FGOS_LOCK_FD" > '${hookEvidence}'\ngit config --get gc.auto >> '${hookEvidence}'\ngit rev-parse --absolute-git-dir >> '${hookEvidence}'\n`,{mode:0o755});
    f.git('config','core.hooksPath','hooks');f.git('config','gc.auto','1');
    const filter=path.join(f.temp,'clean');fs.writeFileSync(filter,`#!/bin/sh\n${escape(filterPid)}cat\n`,{mode:0o755});
    fs.writeFileSync(path.join(repoPath,'.gitattributes'),'a filter=borrow\n');
    execFileSync('git',['-C',repoPath,'-c','core.hooksPath=/dev/null','add','.gitattributes']);
    execFileSync('git',['-C',repoPath,'-c','core.hooksPath=/dev/null','commit','-qm','attributes']);
    f.git('config','filter.borrow.clean',filter);
    const config={stateRoot:f.temp,repoPath:f.repo,trustedMain:f.repo,writer:'fixture'};
    assert.throws(()=>main?createGitScopedCommit(config,loader):f.port.preflight({},f.held),/repository-config-untrusted/);
    assert.equal(fs.existsSync(filterPid),false);
    f.git('config','--unset','filter.borrow.clean');
    const port=main?createGitScopedCommit(config,loader):f.port;
    const held=main?[]:f.held;
    const baseline=port.preflight({},held);fs.writeFileSync(path.join(repoPath,'a'),'filtered producer');
    const result=port.commit({operationId:'borrow-vectors',baseline,request:{writes:['a'],message:'borrow vectors',cutoverGrant:null}},held);
    assert.equal(result.status,'committed');
    const evidence=fs.readFileSync(hookEvidence,'utf8').trim().split('\n');
    assert.equal(evidence[0],`${main?'main-checkout':'dispatch-cwd'}:3`);assert.equal(evidence[1],'0');
    assert.equal(evidence[2],execFileSync('git',['-C',repoPath,'rev-parse','--absolute-git-dir'],{encoding:'utf8'}).trim());
    for(const file of [hookPid]) {
      const values=fs.readFileSync(file,'utf8').trim().split('\n').map(Number);assert.ok(values.length);
      for(const pid of values){pids.push(pid);let state;try{state=fs.readFileSync(`/proc/${pid}/stat`,'utf8').split(') ').at(-1)[0];}catch{state='absent';}assert.ok(['Z','X','absent'].includes(state),`escapee ${pid} remains ${state}`);}
    }
  } finally {
    for(const file of ['hook.pid','filter.pid'])try{for(const pid of fs.readFileSync(path.join(f.temp,file),'utf8').trim().split('\n').map(Number))try{process.kill(pid,'SIGKILL');}catch{}}catch{}
    f.close();
  }
});
