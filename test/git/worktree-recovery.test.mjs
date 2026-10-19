import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { checkGit } from '../../src/setup/git-checks.mjs';
import { fixture } from './worktree-fixture.mjs';

test('read-only worktree diagnostics preserve foreign missing and partial registrations', {skip:process.platform==='win32'},()=>{
  const f=fixture();
  try {
    const worker=path.join(f.temp,'worker');
    f.port.createDetached({path:worker,operationId:'create'});
    const healthy=checkGit(f.repoPath,'git-worktree-recovery',f.loader); assert.equal(healthy.passed,true,healthy.message);
    fs.writeFileSync(path.join(worker,'valuable'),Buffer.from([0,255,10]));
    const dirty=checkGit(f.repoPath,'git-worktree-recovery',f.loader); assert.equal(dirty.passed,true); assert.match(dirty.message,/dirty/);
    assert.deepEqual(fs.readFileSync(path.join(worker,'valuable')),Buffer.from([0,255,10]));
    const admin=path.join(f.repoPath,'.git','worktrees','worker');
    fs.renameSync(worker,path.join(f.temp,'preserved'));
    assert.match(JSON.stringify(f.port.inspectOrphans()),/missing-worktree-preserved/);
    assert.throws(()=>f.port.prune({operationId:'unknown'})); assert.equal(fs.existsSync(admin),true);
    fs.unlinkSync(path.join(admin,'gitdir'));
    assert.match(JSON.stringify(f.port.inspectOrphans()),/partial-admin-entry/);
    assert.equal(fs.existsSync(path.join(admin,'HEAD')),true);
  } finally { f.cleanup(); }
});
test('doctor reports foreign admin files and preserves ignored provisioned directories as advisory', {skip:process.platform==='win32'},()=>{
  const f=fixture();
  try {
    const worker=path.join(f.temp,'worker'); f.port.createDetached({path:worker,operationId:'create'});
    fs.appendFileSync(path.join(f.repoPath,'.git/info/exclude'),'\nnode_modules/\n');
    fs.mkdirSync(path.join(worker,'node_modules')); fs.writeFileSync(path.join(worker,'node_modules','valuable'),'keep');
    const advisory=checkGit(f.repoPath,'git-worktree-recovery',f.loader);
    assert.equal(advisory.passed,true,advisory.message); assert.match(advisory.message,/preserved/);
    const foreign=path.join(f.repoPath,'.git/worktrees/foreign'); fs.writeFileSync(foreign,'keep');
    const damaged=checkGit(f.repoPath,'git-worktree-recovery',f.loader);
    assert.equal(damaged.passed,false); assert.match(damaged.message,/partial-admin-entry/);
    assert.equal(fs.readFileSync(foreign,'utf8'),'keep');
  } finally {f.cleanup();}
});
