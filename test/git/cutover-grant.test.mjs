import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { ensureGitAddon, root } from '../../scripts/git-addon.mjs';
import { createGitScopedCommit } from '../../src/git/index.mjs';
const built=ensureGitAddon();const loader={descriptor:{manifest:JSON.parse(fs.readFileSync(built.manifest)),releaseRoot:root}};
// A baseline-only repository has legacy files under .fgos/ but no event directory.
const cases=[...['ordinary','temporary','external','symlink'].map(indexMode=>[indexMode,'event-directory']),['ordinary','baseline-only']];
for(const [indexMode,layout] of cases) test(`cutover grant validates exact authority and ${indexMode} hook index (${layout})`,()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'fgos-cutover-'));const repo=path.join(temp,'repo');fs.mkdirSync(repo);
 const git=(...args)=>execFileSync('git',['-C',repo,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 const oldState=process.env.FGOS_STATE_ROOT;process.env.FGOS_STATE_ROOT=temp;
 try {
  git('init','-q','--initial-branch=trunk');git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid');
  const directory=layout==='event-directory';
  const deleted=['.fgos/events.jsonl',...(directory?['.fgos/events/old.json']:[]),'.fgos/state.json','.fgos/state.json.bak','.fgos/state.json.backup'];
  fs.mkdirSync(path.join(repo,directory?'.fgos/events':'.fgos'),{recursive:true});for(const p of deleted)fs.writeFileSync(path.join(repo,p),'legacy\n');fs.writeFileSync(path.join(repo,'.fgos/unrelated'),'keep');
  fs.mkdirSync(path.join(repo,'logs'));fs.writeFileSync(path.join(repo,'logs/porting.jsonl'),'old');fs.writeFileSync(path.join(repo,'seal.json'),'sealed\n');
  git('add','.');git('commit','-qm','legacy');const legacy=git('rev-parse','HEAD');git('update-ref','refs/fgos/legacy',legacy);
  const fence=path.join(repo,'.fgos/locks/activation.lock');fs.mkdirSync(fence,{recursive:true});fs.writeFileSync(path.join(fence,'TOMBSTONE'),JSON.stringify({lock:'activation',by:'fgos git',at:'fixture'}));
  git('config','core.hooksPath',path.join(root,'.githooks'));
  if(indexMode!=='ordinary') {
    const hooks=path.join(repo,'hooks');fs.mkdirSync(hooks);
    const gitdir=git('rev-parse','--absolute-git-dir');
    const index=path.join(indexMode==='external'?temp:gitdir,'hook-temporary-index');
    const backing=path.join(gitdir,'hook-index-backing');
    const prepare=indexMode==='symlink'?`cp "$source" '${backing}'\nln -sf '${backing}' '${index}'`:`cp "$source" '${index}'`;
    fs.writeFileSync(path.join(hooks,'pre-commit'),`#!/bin/sh\nsource=$(git rev-parse --git-path index)\n${prepare}\nGIT_INDEX_FILE='${index}' '${path.join(root,'.githooks/pre-commit')}'\n`,{mode:0o755});
    git('config','core.hooksPath',hooks);
  }
  const port=createGitScopedCommit({stateRoot:temp,repoPath:repo,trustedMain:repo,writer:'fixture'},loader);
  const baseline=port.preflight();
  for(const p of deleted)fs.unlinkSync(path.join(repo,p));if(directory)fs.rmdirSync(path.join(repo,'.fgos/events'));fs.writeFileSync(path.join(repo,'.fgos/events'),'legacy fence\n');fs.unlinkSync(path.join(repo,'logs/porting.jsonl'));
  const grant={exactPaths:deleted,legacyRefOid:legacy,sealDigest:createHash('sha256').update('sealed\n').digest('hex')};
  // A text operation selector and fd annotation are not a borrowed description.
  git('add','-A','--','.fgos/events.jsonl');
  assert.throws(()=>execFileSync('git',['-C',repo,'-c','fgos.operationId=forged','commit','-qm','forged'],{stdio:'pipe',env:{...process.env,FGOS_LOCK_FD:'main-checkout:3'}}));
  git('reset','-q','--','.fgos/events.jsonl');
  assert.throws(()=>port.commit({operationId:'wrong-ref',baseline,request:{writes:['logs'],message:'cutover',cutoverGrant:{...grant,legacyRefOid:'0'.repeat(40)}}}),/legacy-ref-mismatch/);
  assert.throws(()=>port.commit({operationId:'wrong-seal',baseline,request:{writes:['logs'],message:'cutover',cutoverGrant:{...grant,sealDigest:'0'.repeat(64)}}}),/seal-digest-mismatch/);
  // The added fence is an explicit cutover payload, not a producer store grant.
  const request={operationId:'cutover',baseline,request:{writes:['logs'],message:'cutover',cutoverGrant:grant}};
  if(['external','symlink'].includes(indexMode)) {
    assert.throws(()=>port.commit(request),/commit-rejected/);
    assert.equal(git('rev-parse','HEAD'),legacy);
    assert.equal(git('diff','--cached','--name-only'),'');
    return;
  }
  const result=port.commit(request);
  assert.equal(result.status,'committed');assert.ok(result.oid);assert.equal(git('show','HEAD:.fgos/events'),'legacy fence');assert.equal(git('show','HEAD:.fgos/unrelated'),'keep');
  const host=process.env.FGOS_HOST_BIN;assert.ok(host);
  assert.throws(()=>execFileSync(host,['internal','git-grant-check','--protocol','1','--operation','cutover'],{cwd:repo,stdio:'pipe',env:{...process.env,FGOS_LOCK_FD:'3'}}));
  assert.throws(()=>execFileSync(host,['internal','git-grant-check','--protocol','99','--operation','cutover'],{cwd:repo,stdio:'pipe'}));
 } finally {if(oldState===undefined)delete process.env.FGOS_STATE_ROOT;else process.env.FGOS_STATE_ROOT=oldState;fs.rmSync(temp,{recursive:true,force:true});}
});
