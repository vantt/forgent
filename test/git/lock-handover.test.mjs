import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ensureGitAddon, root } from '../../scripts/git-addon.mjs';
import { loadNativeAddon, withNativeLocks } from '../../src/git/native.mjs';
import { acquireSync, createLockScope, LockHandle } from '../../src/holder-lock/index.mjs';
const built=ensureGitAddon();const loader={descriptor:{manifest:JSON.parse(fs.readFileSync(built.manifest)),releaseRoot:root}};
const native=loadNativeAddon(loader);
test('one-shot capability refuses raw, foreign, forged and released handles; pins borrows through the call', {skip:process.platform==='win32'},()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'fgos-handover-')); const fgosDir=path.join(temp,'.fgos');
 const h=acquireSync(createLockScope(),'worktree-admin',{fgosDir}).handle;
 try {
  assert.throws(()=>native.takeGitHandover(),/already-registered/);
  assert.throws(()=>native.mintGitLoan({},3,'worktree-admin',h.path,5000));
  assert.throws(()=>new LockHandle({claim:{fd:3}}),/lock-handle-invalid/);
  assert.throws(()=>withNativeLocks(native,[Object.create(LockHandle.prototype)],()=>{}),/lock-handle-invalid/);
  let saved;
  withNativeLocks(native,[h],loans=>{
   saved=loans[0];assert.throws(()=>h.release(),/lock-release-while-borrowed/);
   assert.throws(()=>{throw Error('native call failed');},/native call failed/);
  });
  // Scope disposal is immediate, independent of External garbage collection.
  assert.doesNotThrow(()=>native.closeGitLoan(saved));
  const repoPath=path.join(temp,'repo');fs.mkdirSync(repoPath);execFileSync('git',['init','-q',repoPath]);
  const port=new native.GitRefs(temp,repoPath,repoPath,'fixture');
  const args={name:'refs/heads/topic',expected:'1'.repeat(40),operationId:'invalid-loan'};
  assert.throws(()=>port.call('deleteRef',args,[3]));
  assert.throws(()=>port.call('deleteRef',args,[saved]),/already-consumed/);
  assert.throws(()=>withNativeLocks(native,[h],()=>{throw Error('call failure');}),/call failure/);
  h.release();assert.throws(()=>withNativeLocks(native,[h],()=>{}),/lock-handle-released/);
 } finally {if(!h.released)h.release();fs.rmSync(temp,{recursive:true,force:true});}
});
test('native description copy does not leak into ordinary child processes', {skip:process.platform!=='linux'},()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'fgos-handover-cloexec-'));const h=acquireSync(createLockScope(),'worktree-admin',{fgosDir:path.join(temp,'.fgos')}).handle;
 try {withNativeLocks(native,[h],()=>{
  const inode=fs.statSync(h.path).ino;
  const output=execFileSync(process.execPath,['-e',`const fs=require('fs'); console.log(JSON.stringify(fs.readdirSync('/proc/self/fd').flatMap(fd=>{try{return [fs.statSync('/proc/self/fd/'+fd).ino]}catch{return []}})))`],{encoding:'utf8'});
  assert.ok(!JSON.parse(output).includes(inode));
 });} finally{h.release();fs.rmSync(temp,{recursive:true,force:true});}
});

test('native ScopedCommit protects a live async sibling and native mint refuses an active drain', {skip:process.platform!=='linux',timeout:20000}, async()=>{
 const {runBorrowed}=await import('../../src/holder-lock/index.mjs');
 const {createGitScopedCommit}=await import('../../src/git/index.mjs');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'fgos-native-sibling-'));const repo=path.join(temp,'repo');fs.mkdirSync(repo);
 const git=(...args)=>execFileSync('git',['-C',repo,...args],{encoding:'utf8'}).trim();
 git('init','-q','--initial-branch=trunk');git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid');fs.writeFileSync(path.join(repo,'a'),'base');git('add','.');git('commit','-qm','base');
 const linked=path.join(temp,'linked');git('worktree','add','-qb','producer',linked);
 const fence=path.join(repo,'.fgos/locks/activation.lock');fs.mkdirSync(fence,{recursive:true});fs.writeFileSync(path.join(fence,'TOMBSTONE'),JSON.stringify({lock:'activation',by:'fgos git',at:'fixture'}));
 const h=acquireSync(createLockScope(),'dispatch-cwd',{fgosDir:path.join(repo,'.fgos'),cwd:linked}).handle;
 const children=[];const ready=child=>new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);});
 try {
  const port=createGitScopedCommit({stateRoot:temp,repoPath:linked,trustedMain:repo,writer:'fixture'},loader);
  const baseline=port.preflight({},[h]);fs.writeFileSync(path.join(linked,'a'),'producer');
  const spec={command:process.execPath,args:['-e',"process.stdout.write('ready');process.stdin.once('data',()=>process.exit(0));"],stdin:'pipe'};
  const b=runBorrowed(h,spec,{sync:false});children.push(b);await ready(b);
  // Native Git may fail closed while the sibling stays live, but must never
  // classify that sibling as an escapee and signal it.
  assert.throws(()=>port.commit({operationId:'native-overlap',baseline,request:{writes:['a'],message:'native',cutoverGrant:null}},[h]),/borrow|holder/i);
  process.kill(b.pid,0);assert.equal(b.signalCode,null);
  const a=runBorrowed(h,spec,{sync:false});children.push(a);await ready(a);
  const rejected=assert.rejects(a.borrowed,err=>err.code==='borrow-leftover-not-killed');
  a.stdin.end('go');await new Promise(resolve=>a.once('exit',resolve));
  assert.throws(()=>withNativeLocks(native,[h],()=>{}),err=>err.code==='borrow-drain-in-progress'&&err.retryable===true);
  assert.throws(()=>runBorrowed(h,{command:'git',args:['--version']}),err=>err.code==='borrow-drain-in-progress'&&err.retryable===true);
  await rejected;process.kill(b.pid,0);assert.equal(b.signalCode,null);
  b.stdin.end('go');assert.equal((await b.borrowed).exit,0);
  const fresh=port.preflight({},[h]);fs.writeFileSync(path.join(linked,'fresh'),'fresh producer');
  assert.equal(port.commit({operationId:'native-after-overlap',baseline:fresh,request:{writes:['fresh'],message:'native after',cutoverGrant:null}},[h]).status,'committed');
 }finally{
  for(const child of children)if(child.exitCode===null&&child.signalCode===null)child.kill('SIGKILL');
  await Promise.allSettled(children.map(child=>child.borrowed));h.release();fs.rmSync(temp,{recursive:true,force:true});
 }
});
