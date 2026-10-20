import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createGitScopedCommit, createGitRepositoryConfig } from '../../src/git/index.mjs';
import { checkpointLegacyEventFiles, commitLegacyEventFiles } from '../../src/state/legacy-event-git-adapter.mjs';

test('E6 retargeted: temporary Work declaration admits exact legacy events on main only',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'legacy-git-adapter-'));try {
  const git=(...args)=>execFileSync('git',['-C',temp,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  git('init','-qb','main');git('config','user.name','Fixture');git('config','user.email','fixture@test');
  const files=['.fgos/events.jsonl','.fgos/events/writer.jsonl','.fgos/events/archive/old.jsonl','.fgos/porting/events.jsonl'];
  for(const p of files){fs.mkdirSync(path.dirname(path.join(temp,p)),{recursive:true});fs.writeFileSync(path.join(temp,p),'base\n');}
  fs.writeFileSync(path.join(temp,'.fgos/config.json'),'config');git('add','.');git('commit','-qm','base');
  const fence=path.join(temp,'.fgos/locks/activation.lock');fs.mkdirSync(fence,{recursive:true});fs.writeFileSync(path.join(fence,'TOMBSTONE'),JSON.stringify({lock:'activation',by:'fgos git',at:'fixture'}));
  const options={stateRoot:process.env.FGOS_STATE_ROOT,repoPath:temp,trustedMain:temp,writer:'fixture'};
  for(const p of files)fs.appendFileSync(path.join(temp,p),'event\n');
  fs.appendFileSync(path.join(temp,'.fgos/config.json'),'keep');
  const result=checkpointLegacyEventFiles(options,{files,message:'chore(work): checkpoint',operationId:'checkpoint'});
  assert.equal(result.status,'committed');assert.deepEqual(result.files,[...files].sort());
  assert.equal(git('show','HEAD:.fgos/config.json'),'config');
  assert.throws(()=>checkpointLegacyEventFiles(options,{files:['.fgos/config.json'],message:'refuse',operationId:'bad'}),/invalid-legacy-event-path/);
  const baseline=createGitScopedCommit(options).preflight();
  const fresh='.fgos/events/new.jsonl';fs.writeFileSync(path.join(temp,fresh),'new\n');
  assert.deepEqual(commitLegacyEventFiles(options,{files:[fresh],baseline,message:'chore(work): new shard',operationId:'new-shard'}).files,[fresh]);
  // The real owned hook accepts only the durable declaration under main 50.
  createGitRepositoryConfig(options).ensureHooks({ownedPath:path.resolve('.githooks'),operationId:'event-hook'});
  const moveBaseline=createGitScopedCommit(options).preflight();
  const old='.fgos/events/writer.jsonl', archived='.fgos/events/archive/moved.jsonl';
  fs.renameSync(path.join(temp,old),path.join(temp,archived));
  const moved=commitLegacyEventFiles(options,{files:[old,archived],baseline:moveBaseline,message:'chore(work): archive',operationId:'archive'});
  assert.equal(moved.status,'committed');assert.deepEqual(moved.files,[archived,old]);
  assert.equal(git('show',`HEAD:${archived}`),'base\nevent');
  const linked=path.join(temp,'linked');git('worktree','add','-qb','worker',linked);
  assert.throws(()=>checkpointLegacyEventFiles({...options,repoPath:linked},{files,message:'refuse',operationId:'linked'}),/main-required/);
  assert.throws(()=>commitLegacyEventFiles(options,{files:['.fgos/events/../config.json'],baseline:createGitScopedCommit(options).preflight(),message:'refuse',operationId:'traversal'}),/invalid-legacy-event-path/);
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
