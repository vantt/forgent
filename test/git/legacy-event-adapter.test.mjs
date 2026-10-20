import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createGitScopedCommit, createGitRepositoryConfig } from '../../src/git/index.mjs';
import { checkpointLegacyEventFiles, commitLegacyEventFiles } from '../../src/state/legacy-event-git-adapter.mjs';

test('temporary Work declaration admits exact legacy events on main only',()=>{
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

test('every legacy event change borrows main-checkout authority through native validation', () => {
 const temp = fs.mkdtempSync(path.join(os.tmpdir(),'legacy-main-borrow-'));
 try {
  const repo = path.join(temp,'repo'); fs.mkdirSync(repo);
  const git = (...args) => execFileSync('git',['-C',repo,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  git('init','-qb','main'); git('config','user.name','Fixture'); git('config','user.email','fixture@test');
  fs.mkdirSync(path.join(repo,'.fgos'),{recursive:true}); fs.writeFileSync(path.join(repo,'a'),'base');
  git('add','a'); git('commit','-qm','base');
  const fence = path.join(repo,'.fgos/locks/activation.lock'); fs.mkdirSync(fence,{recursive:true});
  fs.writeFileSync(path.join(fence,'TOMBSTONE'),JSON.stringify({lock:'activation',by:'fgos git',at:'fixture'}));
  const hooks = path.join(temp,'hooks'), evidence = path.join(temp,'borrowers'); fs.mkdirSync(hooks);
  // The real holder-lock borrower probe, inside each actual Git commit hook.
  fs.writeFileSync(path.join(hooks,'pre-commit'),`#!${process.execPath}
const fs = require('node:fs');
(async () => {
 const {checkBorrowedDescription} = await import(${JSON.stringify(new URL('../../src/holder-lock/index.mjs',import.meta.url).href)});
 const verdict = checkBorrowedDescription(${JSON.stringify(path.join(repo,'.fgos/locks/main-checkout.lock'))},{fgosDir:${JSON.stringify(path.join(repo,'.fgos'))}});
 fs.appendFileSync(${JSON.stringify(evidence)},JSON.stringify(verdict)+'\\n');
 if (verdict.result !== 'borrower' || verdict.name !== 'main-checkout') process.exitCode = 1;
})();
`,{mode:0o755});
  git('config','core.hooksPath',hooks);
  const options = {stateRoot:process.env.FGOS_STATE_ROOT,repoPath:repo,trustedMain:repo,writer:'fixture'};
  const port = createGitScopedCommit(options);
  const event = '.fgos/events.jsonl';
  for (const change of ['add','modify','delete']) {
   const baseline = port.preflight();
   if (change === 'delete') fs.rmSync(path.join(repo,event));
   else fs.writeFileSync(path.join(repo,event),change+'\n');
   const committed = port.commit({operationId:change,baseline,request:{writes:['**'],message:change,cutoverGrant:null,legacyEvents:{exactPaths:[event]}}});
   assert.equal(committed.status,'committed'); assert.deepEqual(committed.files,[event]);
  }
  // Checkpoint reaches the same validation, with an already tracked event.
  const baseline = port.preflight(); fs.writeFileSync(path.join(repo,event),'again\n');
  port.commit({operationId:'again',baseline,request:{writes:[],message:'again',cutoverGrant:null,legacyEvents:{exactPaths:[event]}}});
  fs.appendFileSync(path.join(repo,event),'checkpoint\n');
  const checkpoint = checkpointLegacyEventFiles(options,{files:[event],message:'checkpoint',operationId:'checkpoint'});
  assert.equal(checkpoint.status,'committed'); assert.deepEqual(checkpoint.files,[event]);
  const borrowers = fs.readFileSync(evidence,'utf8').trim().split('\n').map(line=>JSON.parse(line));
  assert.equal(borrowers.length,5);
  for (const verdict of borrowers) { assert.equal(verdict.result,'borrower'); assert.equal(verdict.name,'main-checkout'); }
 } finally { fs.rmSync(temp,{recursive:true,force:true}); }
});
