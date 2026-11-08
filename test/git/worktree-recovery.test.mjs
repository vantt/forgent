import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { readGitStatus } from '../../src/git/status.mjs';
import { fixture } from './worktree-fixture.mjs';

// The worktree findings `fgos git status` reports, as reason codes.
const reasons=(f)=>readGitStatus(f.repoPath,{loaderOptions:f.loader}).worktrees.issues.map(i=>i.reason);

test('read-only worktree diagnostics preserve foreign missing and partial registrations', {skip:process.platform==='win32'},()=>{
  const f=fixture();
  try {
    const worker=path.join(f.temp,'worker');
    f.port.createDetached({path:worker,operationId:'create'});
    assert.deepEqual(reasons(f),[]);
    fs.writeFileSync(path.join(worker,'valuable'),Buffer.from([0,255,10]));
    assert.match(reasons(f).join(),/dirty/);
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
test('git status reports foreign admin files and preserves ignored provisioned directories as advisory', {skip:process.platform==='win32'},()=>{
  const f=fixture();
  try {
    const worker=path.join(f.temp,'worker'); f.port.createDetached({path:worker,operationId:'create'});
    fs.appendFileSync(path.join(f.repoPath,'.git/info/exclude'),'\nnode_modules/\n');
    fs.mkdirSync(path.join(worker,'node_modules')); fs.writeFileSync(path.join(worker,'node_modules','valuable'),'keep');
    assert.match(reasons(f).join(),/preserved/);
    const foreign=path.join(f.repoPath,'.git/worktrees/foreign'); fs.writeFileSync(foreign,'keep');
    assert.ok(reasons(f).includes('partial-admin-entry'));
    assert.equal(fs.readFileSync(foreign,'utf8'),'keep');
  } finally {f.cleanup();}
});
test('git status names a worktree locked by a live process and a dead owner differently', {skip:process.platform!=='linux'},async()=>{
  const { spawn } = await import('node:child_process');
  const f=fixture(); const holder=spawn('sleep',['60']);
  try {
    const worker=path.join(f.temp,'worker'); f.git('worktree','add','--detach',worker);
    f.git('worktree','lock','--reason',`locked agent run (pid ${holder.pid})`,worker);
    assert.ok(reasons(f).includes('locked-by-live-process'));
    holder.kill('SIGKILL'); await new Promise(r=>holder.once('exit',r));
    assert.ok(reasons(f).includes('locked-registration'));
  } finally { holder.kill('SIGKILL'); f.cleanup(); }
});
