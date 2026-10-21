import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { acquireSync, createLockScope, resolveStateRoot } from '../../../src/holder-lock/index.mjs';
import { createGitRepositoryConfig } from '../../../src/git/index.mjs';
import { preflightUnitWorktree, commitUnitWork } from '../../../src/runner/execution/commit-unit-work.mjs';
import { runPendingSync, commitRoundWithSync, assertSyncResumable } from '../../../src/runner/execution/unit-sync.mjs';

function fixture(conflict = false) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'git-unit-adapter-'));
  const main = path.join(temp, 'main'), tree = path.join(temp, 'tree'); fs.mkdirSync(main);
  const git = (cwd, ...args) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore','pipe','pipe'] }).trim();
  git(main,'init','-qb','main');git(main,'config','user.name','Fixture');git(main,'config','user.email','fixture@test');
  fs.writeFileSync(path.join(main,'a'),'base\n');git(main,'add','a');git(main,'commit','-qm','base');
  git(main,'worktree','add','-qb','producer',tree);
  if (conflict) {fs.writeFileSync(path.join(tree,'a'),'producer\n');git(tree,'commit','-qam','producer');}
  fs.writeFileSync(path.join(main,'a'),'target\n');git(main,'commit','-qam','target');
  const fence = path.join(main,'.fgos/locks/activation.lock');fs.mkdirSync(fence,{recursive:true});
  fs.writeFileSync(path.join(fence,'TOMBSTONE'),JSON.stringify({lock:'activation',by:'fgos git',at:'fixture'}));
  fs.appendFileSync(path.join(main,'.git/info/exclude'),'\n.fgos/\n');
  const lease = acquireSync(createLockScope(),'dispatch-cwd',{fgosDir:path.join(main,'.fgos'),cwd:tree});assert.equal(lease.result,'acquired');
  const record = {worktree:tree,unit:{id:'adapter',writes:['docs'],syncOnly:false},writeScope:['docs'],sync:{ref:'main',sha:git(main,'rev-parse','HEAD'),status:'pending'}};
  const saved=[];const persist=()=>saved.push(JSON.parse(JSON.stringify(record)));
  return {temp,main,tree,git,record,saved,persist,custody:lease.handle,
    close(){lease.handle.release();fs.rmSync(temp,{recursive:true,force:true});}};
}
function hook(f, owned) {
  const hooks=path.join(f.main,'hooks'), count=path.join(f.temp,'count');fs.mkdirSync(hooks);
  fs.writeFileSync(path.join(hooks,'pre-commit'),`#!/bin/sh\necho call >> '${count}'\nprintf '  original refusal\\nsecond line\\n' >&2\nexit 1\n`,{mode:0o755});
  if(owned) createGitRepositoryConfig({stateRoot:resolveStateRoot({fgosDir:path.join(f.main,'.fgos')}).stateRoot,repoPath:f.main,trustedMain:f.main}).ensureHooks({ownedPath:hooks,operationId:'owned-hook'});
  else f.git(f.main,'config','core.hooksPath',hooks);
  return {count,file:path.join(hooks,'pre-commit')};
}
for(const owned of [false,true]) test(`clean Sync ${owned?'owned':'foreign'} hook evidence, abort timing and persisted operation id`,()=>{
 const f=fixture();try {
  const h=hook(f,owned);const before=f.git(f.tree,'rev-parse','HEAD');
  const result=runPendingSync(f.record,f.main,f.persist,f.custody);
  assert.equal(result.outcome,owned?'policy-refusal':'execution-failure');
  assert.equal(result.results[0].refused.reason,owned?'hook-refused':'git-error');
  assert.equal(f.record.sync.stderr,'  original refusal\nsecond line\n');
  assert.equal(f.git(f.tree,'rev-parse','HEAD'),before);
  assert.throws(()=>f.git(f.tree,'rev-parse','--verify','MERGE_HEAD'));
  assert.ok(f.saved[0].sync.operationId);assert.equal(f.saved[0].sync.operationId,f.record.sync.operationId);
  assert.equal(fs.readFileSync(h.count,'utf8'),'call\n'.repeat(owned?2:1));
  const old=f.record.sync.operationId;
  const again=runPendingSync(f.record,f.main,f.persist,f.custody);
  assert.equal(again.outcome,result.outcome,JSON.stringify({again,sync:f.record.sync}));assert.notEqual(f.record.sync.operationId,old);
  assert.equal(fs.readFileSync(h.count,'utf8'),'call\n'.repeat(owned?4:2));
 }finally{f.close();}
});

test('captured baseline, custody-backed resume and commit-only retry retain resolver and producer writes',()=>{
 const f=fixture(true);try {
  const h=hook(f,true);
  assert.equal(runPendingSync(f.record,f.main,f.persist,f.custody),null);
  assert.equal(f.record.sync.status,'conflicted');assert.deepEqual(f.record.sync.conflicts,['a']);
  const baseline=preflightUnitWorktree({worktree:f.tree,repoRoot:f.main,custody:f.custody,scope:['docs','a'],sync:f.record.sync}).baseline;
  fs.writeFileSync(path.join(f.tree,'a'),'resolved\n');fs.mkdirSync(path.join(f.tree,'docs'));fs.writeFileSync(path.join(f.tree,'docs/new'),'fresh\n');
  const commitWork=merge=>commitUnitWork({worktree:f.tree,repoRoot:f.main,custody:f.custody,scope:['docs'],unitId:'adapter',summary:'fix(unit): fresh',baseline:{...baseline,head:merge?.sha ?? f.record.sync.commit?.sha ?? baseline.head}});
  const first=commitRoundWithSync(f.record,f.main,commitWork,[],f.custody);
  assert.equal(first.reason,'hook-refused');assert.equal(first.stderr,'  original refusal\nsecond line\n');
  assert.equal(fs.readFileSync(path.join(f.tree,'a'),'utf8'),'resolved\n');
  assertSyncResumable('test',f.record,f.main,f.custody);assert.ok(f.record.sync.nextOperationId);
  const retry=f.record.sync.nextOperationId;f.persist();fs.writeFileSync(h.file,'#!/bin/sh\nexit 0\n',{mode:0o755});
  const result=commitRoundWithSync(f.record,f.main,commitWork,[],f.custody);
  assert.equal(result.status,'committed',JSON.stringify(result));assert.deepEqual(result.files,['docs/new']);
  assert.equal(f.record.sync.operationId,retry);assert.equal(result.sync.status,'committed');
  assert.equal(f.git(f.tree,'show','HEAD:a'),'resolved');assert.equal(f.git(f.tree,'show','HEAD:docs/new'),'fresh');
  assert.equal(f.git(f.tree,'rev-list','--parents','-n','1','HEAD~1').split(' ').length,3);
 }finally{f.close();}
});

test('a pending ScopedCommit recovers its durable native receipt without another commit or hook',()=>{
 const f=fixture();try {
  const hooks=path.join(f.main,'count-hooks'),count=path.join(f.temp,'commit-count');fs.mkdirSync(hooks);
  fs.writeFileSync(path.join(hooks,'pre-commit'),`#!/bin/sh\necho called >> '${count}'\n`,{mode:0o755});f.git(f.main,'config','core.hooksPath',hooks);
  const baseline=preflightUnitWorktree({worktree:f.tree,repoRoot:f.main,custody:f.custody,scope:['docs']}).baseline;
  fs.mkdirSync(path.join(f.tree,'docs'));fs.writeFileSync(path.join(f.tree,'docs/new'),'new');
  let pending;
  const args={worktree:f.tree,repoRoot:f.main,custody:f.custody,scope:['docs'],unitId:'recover',summary:'fix(unit): recover',baseline};
  const first=commitUnitWork({...args,onPrepared:prepared=>{pending=JSON.parse(JSON.stringify(prepared));}});
  assert.equal(first.status,'committed',JSON.stringify(first));assert.deepEqual(pending.expectedPaths,['docs/new']);
  const resumed=commitUnitWork({...args,resumeOperation:pending});
  assert.equal(resumed.status,'committed',JSON.stringify(resumed));assert.equal(resumed.sha,first.sha);assert.deepEqual(resumed.files,first.files);
  assert.equal(fs.readFileSync(count,'utf8'),'called\n');
 }finally{f.close();}
});

test('native marker details and unexpected resolver children survive adapter translation',()=>{
 const f=fixture(true);try {
  runPendingSync(f.record,f.main,f.persist,f.custody);
  const marked=commitRoundWithSync(f.record,f.main,()=>assert.fail('must not commit producer before resolving'),[],f.custody);
  assert.equal(marked.reason,'conflict-markers');assert.deepEqual(marked.paths,['a']);
  fs.rmSync(path.join(f.tree,'a'));fs.mkdirSync(path.join(f.tree,'a'));fs.writeFileSync(path.join(f.tree,'a/child'),'child');
  const directory=commitRoundWithSync(f.record,f.main,()=>assert.fail('must not commit unexpected children'),[],f.custody);
  assert.equal(directory.reason,'staged-set-mismatch');assert.deepEqual(directory.unexpected,['a/child']);
  assert.doesNotMatch(f.git(f.tree,'diff','--cached','--name-only'),/child/);
 }finally{f.close();}
});

test('manual merge completion settles native custody before the remaining Unit commit',()=>{
 const f=fixture(true);try {
  runPendingSync(f.record,f.main,f.persist,f.custody);
  const baseline=preflightUnitWorktree({worktree:f.tree,repoRoot:f.main,custody:f.custody,scope:['docs','a'],sync:f.record.sync}).baseline;
  fs.writeFileSync(path.join(f.tree,'a'),'manual resolution\n');f.git(f.tree,'add','a');f.git(f.tree,'commit','-qm','manual merge');
  fs.mkdirSync(path.join(f.tree,'docs'));fs.writeFileSync(path.join(f.tree,'docs/new'),'new');
  assertSyncResumable('test',f.record,f.main,f.custody);
  assert.equal(f.record.sync.status,'merged');assert.deepEqual(f.record.sync.commit,{by:'outside'});
  const result=commitRoundWithSync(f.record,f.main,()=>commitUnitWork({worktree:f.tree,repoRoot:f.main,custody:f.custody,scope:['docs'],unitId:'outside',baseline:{...baseline,head:f.record.sync.nativeHead}}),[],f.custody);
  assert.equal(result.status,'committed',JSON.stringify(result));assert.deepEqual(result.files,['docs/new']);
 }finally{f.close();}
});

test('manual merge abort refuses resume and releases the old native operation for a new run',()=>{
 const f=fixture(true);try {
  runPendingSync(f.record,f.main,f.persist,f.custody);
  f.git(f.tree,'merge','--abort');
  assert.throws(()=>assertSyncResumable('test',f.record,f.main,f.custody),/was aborted/);
  const old=f.record.sync.operationId;
  f.record.sync={ref:'main',sha:f.record.sync.sha,status:'pending'};
  assert.equal(runPendingSync(f.record,f.main,f.persist,f.custody),null);
  assert.equal(f.record.sync.status,'conflicted');assert.notEqual(f.record.sync.operationId,old);
 }finally{f.close();}
});

test('diagnostic provenance failure retains the original commit stderr without replay',()=>{
 const f=fixture();try {
  const h=hook(f,true);
  fs.writeFileSync(h.file,`#!/bin/sh\necho call >> '${h.count}'\nprintf 'original before diagnostic\\n' >&2\nmkdir -p '${f.main}/.git/fgos/git/operations/broken'\nprintf invalid > '${f.main}/.git/fgos/git/operations/broken/000000.json'\nexit 1\n`,{mode:0o755});
  const result=runPendingSync(f.record,f.main,f.persist,f.custody);
  assert.equal(result.outcome,'execution-failure');
  assert.equal(f.record.sync.stderr,'original before diagnostic\n');
  assert.equal(fs.readFileSync(h.count,'utf8'),'call\n');
 }finally{f.close();}
});

for (const owned of [false, true]) test(`ScopedCommit ${owned ? 'owned' : 'foreign'} hook refusal preserves original evidence`, () => {
 const f = fixture(); try {
  const h = hook(f, owned);
  const baseline = preflightUnitWorktree({worktree:f.tree,repoRoot:f.main,custody:f.custody,scope:['docs']}).baseline;
  fs.mkdirSync(path.join(f.tree,'docs')); fs.writeFileSync(path.join(f.tree,'docs/new'),'new');
  const result = commitUnitWork({worktree:f.tree,repoRoot:f.main,custody:f.custody,scope:['docs'],unitId:'hook',baseline});
  assert.equal(result.status,'failed');
  assert.equal(result.reason,owned ? 'hook-refused' : 'git-error');
  assert.equal(result.stderr,'  original refusal\nsecond line\n');
  assert.deepEqual(result.stderrBytes,[...Buffer.from(result.stderr)]);
  assert.equal(fs.readFileSync(h.count,'utf8'),'call\n'.repeat(owned ? 2 : 1));
  assert.equal(f.git(f.tree,'diff','--cached','--name-only'),'');
  assert.equal(fs.readFileSync(path.join(f.tree,'docs/new'),'utf8'),'new');
 } finally { f.close(); }
});
