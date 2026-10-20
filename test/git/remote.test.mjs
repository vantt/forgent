import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ensureGitAddon, root } from '../../scripts/git-addon.mjs';
import { createGitRemote } from '../../src/git/index.mjs';
const built=ensureGitAddon();
const loader={descriptor:{manifest:JSON.parse(fs.readFileSync(built.manifest)),releaseRoot:root}};
test('Remote explicit transfers use a real bare remote and preserve push configuration', {skip:process.platform==='win32'},()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'fgos-remote-')); const repoPath=path.join(temp,'repo');fs.mkdirSync(repoPath);
 const git=(...args)=>execFileSync('git',['-C',repoPath,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 try {
  git('init','-q','--initial-branch=trunk');git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid');fs.writeFileSync(path.join(repoPath,'file'),'one');git('add','.');git('commit','-qm','one');const first=git('rev-parse','HEAD');
  const bare=path.join(temp,'bare');git('init','-q','--bare',bare);git('remote','add','origin',bare);
  const fence=path.join(repoPath,'.fgos/locks/activation.lock');fs.mkdirSync(fence,{recursive:true});fs.writeFileSync(path.join(fence,'TOMBSTONE'),JSON.stringify({lock:'activation',by:'fgos git',at:'fixture'}));
  const port=createGitRemote({stateRoot:temp,repoPath,trustedMain:repoPath,writer:'fixture'},loader); const remoteGrant={name:'origin',pinnedUrl:bare};
  const config=fs.readFileSync(path.join(repoPath,'.git/config'));
  const push={remoteGrant,mappings:[['refs/heads/trunk','refs/heads/shared']],operationId:'push'};
  assert.equal(port.pushRefs(push).remote,'acknowledged'); assert.equal(port.pushRefs(push).remote,'acknowledged');
  assert.deepEqual(port.inspectRemote({remoteGrant,refs:['refs/heads/shared']}),[{name:'refs/heads/shared',oid:first}]);
  assert.equal(port.fetchRefs({remoteGrant,mappings:[['refs/heads/shared','refs/remotes/origin/shared']],operationId:'fetch'}).remote,'acknowledged');assert.equal(git('rev-parse','refs/remotes/origin/shared'),first);
  assert.throws(()=>port.fetchRefs({remoteGrant,mappings:[['refs/heads/shared','refs/heads/trunk']],operationId:'bad-fetch'}),/invalid-remote-mappings/);
  assert.throws(()=>port.pushRefs({...push,remoteGrant:{name:'origin',pinnedUrl:bare+'wrong'},operationId:'bad-url'}),/pinned/);
  fs.writeFileSync(path.join(repoPath,'file'),'two');git('commit','-qam','two');const second=git('rev-parse','HEAD');
  assert.equal(port.pushRefs({...push,operationId:'push-next'}).remote,'acknowledged');
  git('branch','old',first);
  assert.equal(port.pushRefs({...push,mappings:[['refs/heads/old','refs/heads/shared']],operationId:'push-rewind'}).remote,'rejected');
  assert.equal(port.inspectRemote({remoteGrant,refs:['refs/heads/shared']})[0].oid,second);
  git('symbolic-ref','refs/remotes/origin/redirect','refs/heads/trunk');
  assert.throws(()=>port.fetchRefs({remoteGrant,mappings:[['refs/heads/shared','refs/remotes/origin/redirect']],operationId:'symbolic'}),/symbolic-ref-refused/);
  assert.equal(git('rev-parse','refs/heads/trunk'),second);
  assert.deepEqual(fs.readFileSync(path.join(repoPath,'.git/config')),config);
 } finally {fs.rmSync(temp,{recursive:true,force:true});}
});
