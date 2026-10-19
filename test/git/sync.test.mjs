import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ensureGitAddon, root } from '../helpers/git-addon.mjs';
import { createGitSync, createGitScopedCommit } from '../../src/git/index.mjs';
import { acquireSync, createLockScope } from '../../src/holder-lock/index.mjs';
const built=ensureGitAddon();const loader={descriptor:{manifest:JSON.parse(fs.readFileSync(built.manifest)),releaseRoot:root}};
function fixture(conflict=false) {
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'fgos-sync-'));const repo=path.join(temp,'repo');fs.mkdirSync(repo);
 const git=(...args)=>execFileSync('git',['-C',repo,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 git('init','-q','--initial-branch=trunk');git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid');fs.writeFileSync(path.join(repo,'a'),'base\n');git('add','.');git('commit','-qm','base');
 const linked=path.join(temp,'linked');git('worktree','add','-qb','producer',linked);
 fs.writeFileSync(path.join(repo,conflict?'a':'incoming'),'target\n');if(conflict)fs.writeFileSync(path.join(repo,'incoming'),'clean merged target\n');git('add','.');git('commit','-qm','target');const target=git('rev-parse','HEAD');
 if(conflict){fs.writeFileSync(path.join(linked,'a'),'producer\n');execFileSync('git',['-C',linked,'commit','-qam','producer']);}
 const fence=path.join(repo,'.fgos/locks/activation.lock');fs.mkdirSync(fence,{recursive:true});fs.writeFileSync(path.join(fence,'TOMBSTONE'),JSON.stringify({lock:'activation',by:'fgos git',at:'fixture'}));
 const h=acquireSync(createLockScope(),'dispatch-cwd',{fgosDir:path.join(repo,'.fgos'),cwd:linked});assert.equal(h.result,'acquired');
 const port=createGitSync({stateRoot:temp,repoPath:linked,trustedMain:repo,writer:'fixture'},loader);
 return {temp,repo,linked,git,target,port,held:[h.handle],close(){h.handle.release();fs.rmSync(temp,{recursive:true,force:true});}};
}
test('Sync creates a clean exact two-parent merge and no resolver grant',()=>{
 const f=fixture();try {const head=execFileSync('git',['-C',f.linked,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const result=f.port.start({operationId:'clean',target:f.target,message:'consumer sync message'},f.held);assert.equal(result.state,'done');assert.deepEqual(result.resolverGrant,[]);
 assert.deepEqual(execFileSync('git',['-C',f.linked,'show','-s','--format=%P'],{encoding:'utf8'}).trim().split(' '),[head,f.target]);
 const replay=f.port.inspect({operationId:'clean'},f.held);assert.equal(replay.state,'done');assert.deepEqual(replay.commit,result.commit);
 assert.deepEqual(fs.readdirSync(path.join(f.repo,'.git/fgos/git/operations')),[]);
 assert.equal(f.git('for-each-ref','--format=%(refname)','refs/fgos/git-operations'),'');
 assert.deepEqual(f.port.start({operationId:'clean',target:f.target,message:'consumer sync message'},f.held).commit,result.commit);
 }finally{f.close();}
});
test('Sync leaves only temporary conflict grants and refuses markers before staging',()=>{
 const f=fixture(true);try {
 assert.throws(()=>f.port.start({operationId:'missing',target:f.target,message:'sync'}),/custody/);
 const result=f.port.start({operationId:'conflict',target:f.target,message:'sync'},f.held);assert.equal(result.state,'conflicted-open');assert.deepEqual(result.resolverGrant,['a']);
 for(const marker of ['<<<<<<<\tleft','||||||||\tbase','>>>>>>>']) {fs.writeFileSync(path.join(f.linked,'a'),marker+'\n');assert.throws(()=>f.port.continue({operationId:'conflict'},f.held),/conflict-markers/);}
 fs.writeFileSync(path.join(f.linked,'a'),'resolved\n');const finished=f.port.continue({operationId:'conflict'},f.held);assert.equal(finished.state,'done');assert.equal(finished.commit.status,'committed');
 }finally{f.close();}
});
test('Sync abort preserves resolver bytes and only closes its own merge',()=>{
 const f=fixture(true);try {f.port.start({operationId:'abort',target:f.target,message:'sync'},f.held);fs.writeFileSync(path.join(f.linked,'a'),'keep resolver edits\n');
 assert.equal(f.port.abort({operationId:'abort'},f.held).state,'conflict-aborted');assert.equal(fs.readFileSync(path.join(f.linked,'a'),'utf8'),'keep resolver edits\n');assert.equal(fs.existsSync(path.join(f.linked,'incoming')),false);
 assert.equal(execFileSync('git',['-C',f.linked,'diff','--cached','--name-only'],{encoding:'utf8'}),'');
 const commit=createGitScopedCommit({stateRoot:f.temp,repoPath:f.linked,trustedMain:f.repo,writer:'fixture'},loader);
 const baseline=commit.preflight({},f.held);fs.writeFileSync(path.join(f.linked,'fresh'),'fresh');
 assert.equal(commit.commit({operationId:'after-abort',baseline,request:{writes:['fresh'],message:'fresh after abort',cutoverGrant:null}},f.held).status,'committed');
 }finally{f.close();}
});

test('Sync refuses foreign staged resolver paths and retains their bytes',()=>{
 const f=fixture(true);try {
 f.port.start({operationId:'foreign',target:f.target,message:'sync'},f.held);
 fs.writeFileSync(path.join(f.linked,'foreign'),'keep');execFileSync('git',['-C',f.linked,'add','foreign']);
 assert.throws(()=>f.port.continue({operationId:'foreign'},f.held),/sync-index-changed|foreign-staged/);
 assert.throws(()=>f.port.abort({operationId:'foreign'},f.held),/foreign-staged/);
 assert.equal(fs.readFileSync(path.join(f.linked,'foreign'),'utf8'),'keep');
 }finally{f.close();}
});

test('Sync preserves a rejecting hook cause and never reports its open merge as not started',()=>{
 const f=fixture();try {
 const hooks=path.join(f.repo,'hooks');fs.mkdirSync(hooks);fs.writeFileSync(path.join(hooks,'pre-commit'),'#!/bin/sh\necho original-sync-rejection >&2\nexit 1\n',{mode:0o755});f.git('config','core.hooksPath','hooks');
 assert.throws(()=>f.port.start({operationId:'rejected',target:f.target,message:'sync'},f.held),/hook-rejected/);
 assert.equal(execFileSync('git',['-C',f.linked,'rev-parse','MERGE_HEAD'],{encoding:'utf8'}).trim(),f.target);
 assert.equal(f.port.inspect({operationId:'rejected'},f.held).state,'rejected-open');
 assert.equal(fs.readFileSync(path.join(f.linked,'incoming'),'utf8'),'target\n');
 assert.equal(f.port.abort({operationId:'rejected'},f.held).state,'conflict-aborted');
 assert.equal(fs.existsSync(path.join(f.linked,'incoming')),false);
 f.git('config','core.hooksPath','/dev/null');
 const commit=createGitScopedCommit({stateRoot:f.temp,repoPath:f.linked,trustedMain:f.repo,writer:'fixture'},loader);
 const baseline=commit.preflight({},f.held);fs.writeFileSync(path.join(f.linked,'a'),'fresh');
 assert.equal(commit.commit({operationId:'after-rejection',baseline,request:{writes:['a'],message:'fresh',cutoverGrant:null}},f.held).status,'committed');
 }finally{f.close();}
});
