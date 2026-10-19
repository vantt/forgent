import '../helpers/process-tmp-root.mjs';
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
for (const escaped of [false,true]) for (const main of [false,true]) test(`ScopedCommit ${escaped?'setsid ':''}${main?'main 50':'custody 30'} refuses executable filter config and drains hook background children with gc enabled`,{skip:process.platform!=='linux'},()=>{
  const f=fixture();const pids=[];
  try {
    const repoPath=main?f.repo:f.linked;
    const hooks=path.join(f.repo,'hooks');fs.mkdirSync(hooks);
    const hookPid=path.join(f.temp,'hook.pid'),filterPid=path.join(f.temp,'filter.pid');
    const hookEvidence=path.join(f.temp,'hook-context');
    const escape=file=>`${escaped?'setsid ':''}sleep 30 </dev/null >/dev/null 2>&1 &\necho $! >> '${file}'\n`;
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

test('rejecting hook restores a producer move, binary bytes, modes, symlinks and the index',()=>{
  const f=fixture();try {
    const hooks=path.join(f.repo,'hooks');fs.mkdirSync(hooks);
    fs.writeFileSync(path.join(hooks,'pre-commit'),`#!/bin/sh
printf resurrected > a
printf overwritten > moved
chmod 600 moved
rm -f link
printf replaced > link
printf damaged > clean
printf hook > extra
printf damaged > old-dirt
printf damaged > ignored/base
printf created > ignored/new
mkdir -p scope
printf created > scope/new
git add a moved link clean extra old-dirt scope
exit 1
`,{mode:0o755});f.git('config','core.hooksPath','hooks');
    fs.writeFileSync(path.join(f.linked,'clean'),'clean');execFileSync('git',['-C',f.linked,'-c','core.hooksPath=/dev/null','add','clean']);execFileSync('git',['-C',f.linked,'-c','core.hooksPath=/dev/null','commit','-qm','clean']);
    fs.writeFileSync(path.join(f.linked,'old-dirt'),'keep baseline dirt');
    fs.appendFileSync(path.join(f.repo,'.git/info/exclude'),'\nignored/\n');fs.mkdirSync(path.join(f.linked,'ignored'));fs.writeFileSync(path.join(f.linked,'ignored/base'),'keep ignored bytes');
    const baseline=f.port.preflight({},f.held),head=execFileSync('git',['-C',f.linked,'rev-parse','HEAD'],{encoding:'utf8'});
    fs.renameSync(path.join(f.linked,'a'),path.join(f.linked,'moved'));
    const bytes=Buffer.from([0,255,1,10]);fs.writeFileSync(path.join(f.linked,'moved'),bytes);fs.chmodSync(path.join(f.linked,'moved'),0o751);
    fs.symlinkSync('moved',path.join(f.linked,'link'));
    assert.throws(()=>f.port.commit({operationId:'move-reject',baseline,request:{writes:['a','moved','link','clean','extra','old-dirt','scope','ignored'],message:'move',cutoverGrant:null}},f.held),/commit-rejected/);
    assert.equal(fs.existsSync(path.join(f.linked,'a')),false);
    assert.deepEqual(fs.readFileSync(path.join(f.linked,'moved')),bytes);assert.equal(fs.statSync(path.join(f.linked,'moved')).mode&0o777,0o751);
    assert.equal(fs.readlinkSync(path.join(f.linked,'link')),'moved');assert.equal(fs.readFileSync(path.join(f.linked,'clean'),'utf8'),'clean');assert.equal(fs.existsSync(path.join(f.linked,'extra')),false);assert.equal(fs.readFileSync(path.join(f.linked,'old-dirt'),'utf8'),'keep baseline dirt');assert.equal(fs.existsSync(path.join(f.linked,'scope')),false);assert.equal(fs.readFileSync(path.join(f.linked,'ignored/base'),'utf8'),'keep ignored bytes');assert.equal(fs.existsSync(path.join(f.linked,'ignored/new')),false);
    assert.equal(execFileSync('git',['-C',f.linked,'rev-parse','HEAD'],{encoding:'utf8'}),head);assert.equal(execFileSync('git',['-C',f.linked,'diff','--cached','--name-only'],{encoding:'utf8'}),'');
  } finally {f.close();}
});

test('ScopedCommit refuses invalid requests, post-preflight staging and replay of a rejected attempt',()=>{
  const f=fixture();try {
    const baseline=f.port.preflight({},f.held);fs.writeFileSync(path.join(f.linked,'a'),'producer');
    const request={operationId:'refusal-cases',baseline,request:{writes:['a'],message:'valid',cutoverGrant:null}};
    assert.throws(()=>f.port.commit({...request,request:{...request.request,message:''}},f.held),/invalid-commit-message/);
    execFileSync('git',['-C',f.linked,'add','a']);
    assert.throws(()=>f.port.commit(request,f.held),/foreign-staged-index/);
    assert.equal(execFileSync('git',['-C',f.linked,'show',':a'],{encoding:'utf8'}),'producer');
    execFileSync('git',['-C',f.linked,'reset','-q','HEAD']);
    const hooks=path.join(f.repo,'hooks');fs.mkdirSync(hooks);
    const count=path.join(f.temp,'calls');fs.writeFileSync(path.join(hooks,'pre-commit'),`#!/bin/sh
echo called >> '${count}'
exit 1
`,{mode:0o755});f.git('config','core.hooksPath','hooks');
    assert.throws(()=>f.port.commit(request,f.held),/commit-rejected/);
    assert.throws(()=>f.port.commit(request,f.held),/commit-rejected|commit-attempt-recovery-required/);
    assert.equal(fs.readFileSync(count,'utf8'),'called\n');assert.equal(fs.readFileSync(path.join(f.linked,'a'),'utf8'),'producer');
    assert.equal(execFileSync('git',['-C',f.linked,'diff','--cached','--name-only'],{encoding:'utf8'}),'');
  } finally {f.close();}
});

test('baseline-dirty paths changed by the producer are excluded with an explicit receipt report',()=>{
 const f=fixture();try {
  fs.writeFileSync(path.join(f.linked,'a'),'before producer');const baseline=f.port.preflight({},f.held);
  fs.writeFileSync(path.join(f.linked,'a'),'after producer');fs.writeFileSync(path.join(f.linked,'fresh'),'fresh');
  const result=f.port.commit({operationId:'baseline-dirty',baseline,request:{writes:['**'],message:'report exclusions',cutoverGrant:null}},f.held);
  assert.deepEqual(result.preExistingInScope,['a']);assert.deepEqual(result.files,['fresh']);
  assert.equal(fs.readFileSync(path.join(f.linked,'a'),'utf8'),'after producer');
 }finally{f.close();}
});
for(const name of ['literal*star','control\tname','control\nname']) test(`unsupported literal path ${JSON.stringify(name)} refuses before staging or WAL intent`,()=>{
 const f=fixture();try {
  const baseline=f.port.preflight({},f.held);fs.writeFileSync(path.join(f.linked,name),'producer');
  assert.throws(()=>f.port.commit({operationId:'invalid-path',baseline,request:{writes:['**'],message:'refuse literal',cutoverGrant:null}},f.held),/unscopable-commit-path/);
  assert.equal(execFileSync('git',['-C',f.linked,'diff','--cached','--name-only'],{encoding:'utf8'}),'');
  assert.equal(fs.existsSync(path.join(f.repo,'.git/fgos/git/operations/invalid-path')),false);
  assert.equal(fs.readFileSync(path.join(f.linked,name),'utf8'),'producer');
 }finally{f.close();}
});

test('post-commit compaction failure returns the landed receipt with a warning',()=>{
 const f=fixture();try {
  const hooks=path.join(f.repo,'hooks');fs.mkdirSync(hooks);
  fs.writeFileSync(path.join(hooks,'post-commit'),'#!/bin/sh\nprintf evidence > "$(git rev-parse --git-common-dir)/fgos/git/operations/compaction-warning/.durable-file-orphan.tmp"\n',{mode:0o755});f.git('config','core.hooksPath','hooks');
  const baseline=f.port.preflight({},f.held);fs.writeFileSync(path.join(f.linked,'a'),'landed');
  const args={operationId:'compaction-warning',baseline,request:{writes:['a'],message:'landed',cutoverGrant:null}};
  const receipt=f.port.commit(args,f.held);
  assert.equal(receipt.status,'committed');assert.equal(receipt.oid,execFileSync('git',['-C',f.linked,'rev-parse','HEAD'],{encoding:'utf8'}).trim());
  assert.match(receipt.warnings[0],/compaction-deferred/);
  assert.equal(f.port.commit(args,f.held).oid,receipt.oid);
  fs.unlinkSync(path.join(f.repo,'.git/fgos/git/operations/compaction-warning/.durable-file-orphan.tmp'));
  f.git('config','core.hooksPath','/dev/null');
  const next=f.port.preflight({},f.held);fs.writeFileSync(path.join(f.linked,'a'),'next');
  assert.equal(f.port.commit({operationId:'after-warning',baseline:next,request:args.request},f.held).status,'committed');
  assert.deepEqual(fs.readdirSync(path.join(f.repo,'.git/fgos/git/operations')),[]);
 }finally{f.close();}
});

test('rejected hooks restore clean permission bits and leave skip-worktree paths alone',()=>{
 const f=fixture();try {
  for(const name of ['clean','skipped'])fs.writeFileSync(path.join(f.linked,name),name);
  execFileSync('git',['-C',f.linked,'add','clean','skipped']);execFileSync('git',['-C',f.linked,'commit','-qm','snapshot fixture']);
  execFileSync('git',['-C',f.linked,'update-index','--skip-worktree','skipped']);fs.unlinkSync(path.join(f.linked,'skipped'));
  fs.chmodSync(path.join(f.linked,'clean'),0o600);
  const hooks=path.join(f.repo,'hooks');fs.mkdirSync(hooks);fs.writeFileSync(path.join(hooks,'pre-commit'),'#!/bin/sh\nprintf changed > clean\nchmod 644 clean\nprintf hook > a\nexit 1\n',{mode:0o755});f.git('config','core.hooksPath','hooks');
  const baseline=f.port.preflight({},f.held);fs.writeFileSync(path.join(f.linked,'a'),'producer');
  assert.throws(()=>f.port.commit({operationId:'clean-modes',baseline,request:{writes:['*'],message:'reject',cutoverGrant:null}},f.held),/commit-rejected/);
  assert.equal(fs.readFileSync(path.join(f.linked,'a'),'utf8'),'producer');assert.equal(fs.readFileSync(path.join(f.linked,'clean'),'utf8'),'clean');
  assert.equal(fs.statSync(path.join(f.linked,'clean')).mode&0o777,0o600);assert.equal(fs.existsSync(path.join(f.linked,'skipped')),false);
 }finally{f.close();}
});

test('a clean-path restore failure still restores producer bytes on independent paths',()=>{
 const f=fixture();const dir=path.join(f.linked,'blocked');try {
  fs.mkdirSync(dir);fs.writeFileSync(path.join(dir,'clean'),'base');
  execFileSync('git',['-C',f.linked,'add','blocked/clean']);execFileSync('git',['-C',f.linked,'commit','-qm','restore fixture']);
  const hooks=path.join(f.repo,'hooks');fs.mkdirSync(hooks);fs.writeFileSync(path.join(hooks,'pre-commit'),'#!/bin/sh\nprintf hook > a\nchmod 000 blocked\nexit 1\n',{mode:0o755});f.git('config','core.hooksPath','hooks');
  const baseline=f.port.preflight({},f.held);fs.writeFileSync(path.join(f.linked,'a'),'producer bytes');
  assert.throws(()=>f.port.commit({operationId:'restore-failure',baseline,request:{writes:['a','blocked/clean'],message:'reject',cutoverGrant:null}},f.held),/commit-worktree-restore-required/);
  assert.equal(fs.readFileSync(path.join(f.linked,'a'),'utf8'),'producer bytes');
  assert.deepEqual(fs.readdirSync(path.join(f.repo,'.git/fgos/git/operations')),[]);
 }finally{if(fs.existsSync(dir))fs.chmodSync(dir,0o700);f.close();}
});

test('ScopedCommit probes config and formats once per loan and once after hooks', {skip:process.platform!=='linux'}, () => {
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'fgos-scoped-census-'));
  try {
    const descriptor=path.join(temp,'descriptor.json');
    fs.writeFileSync(descriptor,JSON.stringify(loader.descriptor));
    const census=JSON.parse(execFileSync(process.execPath,[path.join(root,'scripts/git/e3-bench.mjs'),'scoped-census',
      '--root',temp,'--descriptor',descriptor],{encoding:'utf8'}));
    const probes=(calls,probe)=>calls.filter(call=>call.includes(probe)).length;
    for(const probe of ['config --null --show-origin --list','rev-parse --show-object-format','rev-parse --show-ref-format']) {
      assert.equal(probes(census.preflight,probe),1,`preflight ${probe}`);
      assert.equal(probes(census.commit,probe),2,`commit entry + post-hook ${probe}`);
    }
    assert.equal(census.total,37,`unexpected Git exec growth: ${census.total}`);
    console.log(`ScopedCommit Git exec census: preflight=${census.preflight.length}, commit=${census.commit.length}, total=${census.total}`);
  } finally {fs.rmSync(temp,{recursive:true,force:true});}
});

test('ScopedCommit refreshes config between calls on the same port',()=>{
  const f=fixture();try {
    const baseline=f.port.preflight({},f.held);
    f.git('config','filter.evil.clean','touch /unreachable');
    fs.writeFileSync(path.join(f.linked,'a'),'producer');
    assert.throws(()=>f.port.commit({operationId:'config-changed',baseline,request:{writes:['a'],message:'config',cutoverGrant:null}},f.held),/repository-config-untrusted/);
    f.git('config','--unset','filter.evil.clean');
    assert.equal(f.port.commit({operationId:'config-repaired',baseline,request:{writes:['a'],message:'config',cutoverGrant:null}},f.held).status,'committed');
  } finally {f.close();}
});

for(const rejected of [false,true]) test(`ScopedCommit fences post-hook config changes on ${rejected?'rejection':'success'}`,()=>{
  const f=fixture();try {
    const hooks=path.join(f.repo,'hooks');fs.mkdirSync(hooks);
    fs.writeFileSync(path.join(hooks,'pre-commit'),`#!/bin/sh\ngit config filter.evil.clean 'touch /unreachable'\nexit ${rejected?1:0}\n`,{mode:0o755});
    f.git('config','core.hooksPath','hooks');
    const baseline=f.port.preflight({},f.held);fs.writeFileSync(path.join(f.linked,'a'),'producer');
    assert.throws(()=>f.port.commit({operationId:'hook-config',baseline,request:{writes:['a'],message:'config',cutoverGrant:null}},f.held),/repository-config-untrusted/);
    assert.throws(()=>f.port.preflight({},f.held),/repository-config-untrusted/);
    f.git('config','--unset','filter.evil.clean');
    assert.equal(execFileSync('git',['-C',f.linked,'show','HEAD:a'],{encoding:'utf8'}),rejected?'base':'producer');
  } finally {f.close();}
});

test('ScopedCommit checks object format again on an existing port',()=>{
  const f=fixture();const config=path.join(f.repo,'.git/config');const original=fs.readFileSync(config);
  try {
    fs.appendFileSync(config,'\n[core]\nrepositoryFormatVersion = 1\n[extensions]\nobjectFormat = sha256\n');
    assert.throws(()=>f.port.preflight({},f.held),/repository-format-changed/);
    fs.writeFileSync(config,original);
    assert.ok(f.port.preflight({},f.held).head);
  } finally {fs.writeFileSync(config,original);f.close();}
});

for(const rejected of [false,true]) test(`ScopedCommit refuses post-hook promisor changes on ${rejected?'rejection':'success'}`,()=>{
  const f=fixture();try {
    const hooks=path.join(f.repo,'hooks');fs.mkdirSync(hooks);
    fs.writeFileSync(path.join(hooks,'pre-commit'),`#!/bin/sh\ngit config remote.origin.promisor true\nexit ${rejected?1:0}\n`,{mode:0o755});
    f.git('config','core.hooksPath','hooks');
    const baseline=f.port.preflight({},f.held);fs.writeFileSync(path.join(f.linked,'a'),'producer');
    assert.throws(()=>f.port.commit({operationId:'hook-promisor',baseline,request:{writes:['a'],message:'promisor',cutoverGrant:null}},f.held),/repository-promisor-changed/);
    f.git('config','--unset','remote.origin.promisor');
    assert.equal(execFileSync('git',['-C',f.linked,'show','HEAD:a'],{encoding:'utf8'}),rejected?'base':'producer');
  } finally {f.close();}
});
