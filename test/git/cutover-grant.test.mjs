import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { ensureGitAddon, root } from '../helpers/git-addon.mjs';
import { createGitScopedCommit } from '../../src/git/index.mjs';
const built=ensureGitAddon();const loader={descriptor:{manifest:JSON.parse(fs.readFileSync(built.manifest)),releaseRoot:root}};
test('cutover grants require exact WAL deletion paths, current legacy seal, main borrower, and one unspent attempt',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'fgos-cutover-'));const repo=path.join(temp,'repo');fs.mkdirSync(repo);
 const git=(...args)=>execFileSync('git',['-C',repo,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 const oldState=process.env.FGOS_STATE_ROOT;process.env.FGOS_STATE_ROOT=temp;
 try {
  git('init','-q','--initial-branch=trunk');git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid');
  const deleted=['.fgos/events.jsonl','.fgos/events/old.json','.fgos/state.json','.fgos/state.json.bak','.fgos/state.json.backup'];
  fs.mkdirSync(path.join(repo,'.fgos/events'),{recursive:true});for(const p of deleted)fs.writeFileSync(path.join(repo,p),'legacy\n');fs.writeFileSync(path.join(repo,'.fgos/unrelated'),'keep');
  fs.mkdirSync(path.join(repo,'logs'));fs.writeFileSync(path.join(repo,'logs/porting.jsonl'),'old');fs.writeFileSync(path.join(repo,'seal.json'),'sealed\n');
  git('add','.');git('commit','-qm','legacy');const legacy=git('rev-parse','HEAD');git('update-ref','refs/fgos/legacy',legacy);
  const fence=path.join(repo,'.fgos/locks/activation.lock');fs.mkdirSync(fence,{recursive:true});fs.writeFileSync(path.join(fence,'TOMBSTONE'),JSON.stringify({lock:'activation',by:'fgos git',at:'fixture'}));
  git('config','core.hooksPath',path.join(root,'.githooks'));
  const port=createGitScopedCommit({stateRoot:temp,repoPath:repo,trustedMain:repo,writer:'fixture'},loader);
  const baseline=port.preflight();
  for(const p of deleted)fs.unlinkSync(path.join(repo,p));fs.rmdirSync(path.join(repo,'.fgos/events'));fs.writeFileSync(path.join(repo,'.fgos/events'),'legacy fence\n');fs.unlinkSync(path.join(repo,'logs/porting.jsonl'));
  const grant={exactPaths:deleted,legacyRefOid:legacy,sealDigest:createHash('sha256').update('sealed\n').digest('hex')};
  // A text operation selector and fd annotation are not a borrowed description.
  git('add','-A','--','.fgos/events.jsonl');
  assert.throws(()=>execFileSync('git',['-C',repo,'-c','fgos.operationId=forged','commit','-qm','forged'],{stdio:'pipe',env:{...process.env,FGOS_LOCK_FD:'main-checkout:3'}}));
  git('reset','-q','--','.fgos/events.jsonl');
  assert.throws(()=>port.commit({operationId:'wrong-ref',baseline,request:{writes:['logs'],message:'cutover',cutoverGrant:{...grant,legacyRefOid:'0'.repeat(40)}}}),/legacy-ref-mismatch/);
  assert.throws(()=>port.commit({operationId:'wrong-seal',baseline,request:{writes:['logs'],message:'cutover',cutoverGrant:{...grant,sealDigest:'0'.repeat(64)}}}),/seal-digest-mismatch/);
  // The added fence is an explicit cutover payload, not a producer store grant.
  const result=port.commit({operationId:'cutover',baseline,request:{writes:['logs'],message:'cutover',cutoverGrant:grant}});
  assert.equal(result.status,'committed');assert.ok(result.oid);assert.equal(git('show','HEAD:.fgos/events'),'legacy fence');assert.equal(git('show','HEAD:.fgos/unrelated'),'keep');
  const host=process.env.FGOS_HOST_BIN;assert.ok(host);
  assert.throws(()=>execFileSync(host,['internal','git-grant-check','--protocol','1','--operation','cutover'],{cwd:repo,stdio:'pipe',env:{...process.env,FGOS_LOCK_FD:'3'}}));
  assert.throws(()=>execFileSync(host,['internal','git-grant-check','--protocol','99','--operation','cutover'],{cwd:repo,stdio:'pipe'}));
 } finally {if(oldState===undefined)delete process.env.FGOS_STATE_ROOT;else process.env.FGOS_STATE_ROOT=oldState;fs.rmSync(temp,{recursive:true,force:true});}
});
