import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ensureGitAddon, root } from '../helpers/git-addon.mjs';
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
