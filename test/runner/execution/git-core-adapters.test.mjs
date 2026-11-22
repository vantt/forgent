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

function fixture() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'git-unit-adapter-'));
  const main = path.join(temp, 'main'), tree = path.join(temp, 'tree'); fs.mkdirSync(main);
  const git = (cwd, ...args) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore','pipe','pipe'] }).trim();
  git(main,'init','-qb','main');git(main,'config','user.name','Fixture');git(main,'config','user.email','fixture@test');
  fs.writeFileSync(path.join(main,'a'),'base\n');git(main,'add','a');git(main,'commit','-qm','base');
  git(main,'worktree','add','-qb','producer',tree);
  fs.writeFileSync(path.join(main,'a'),'target\n');git(main,'commit','-qam','target');
  const fence = path.join(main,'.fgos/locks/activation.lock');fs.mkdirSync(fence,{recursive:true});
  fs.writeFileSync(path.join(fence,'TOMBSTONE'),JSON.stringify({lock:'activation',by:'fgos git',at:'fixture'}));
  fs.appendFileSync(path.join(main,'.git/info/exclude'),'\n.fgos/\n');
  const lease = acquireSync(createLockScope(),'dispatch-cwd',{fgosDir:path.join(main,'.fgos'),cwd:tree});assert.equal(lease.result,'acquired');
  return {temp,main,tree,git,custody:lease.handle,
    close(){lease.handle.release();fs.rmSync(temp,{recursive:true,force:true});}};
}
function hook(f, owned) {
  const hooks=path.join(f.main,'hooks'), count=path.join(f.temp,'count');fs.mkdirSync(hooks);
  fs.writeFileSync(path.join(hooks,'pre-commit'),`#!/bin/sh\necho call >> '${count}'\nprintf '  original refusal\\nsecond line\\n' >&2\nexit 1\n`,{mode:0o755});
  if(owned) createGitRepositoryConfig({stateRoot:resolveStateRoot().stateRoot,repoPath:f.main,trustedMain:f.main}).ensureHooks({ownedPath:hooks,operationId:'owned-hook'});
  else f.git(f.main,'config','core.hooksPath',hooks);
  return {count,file:path.join(hooks,'pre-commit')};
}
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
