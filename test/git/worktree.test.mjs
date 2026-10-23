import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import { acquireSync, createLockScope } from '../../src/holder-lock/index.mjs';
import { fixture } from './worktree-fixture.mjs';
for (const backend of ['files','reftable']) test(`Worktree create, move, guarded remove (${backend})`, { skip: process.platform === 'win32' }, () => {
  const f = fixture(backend); const worker = path.join(f.temp,'worker'); const moved = path.join(f.temp,'moved');
  try {
    const created = f.port.create({path:worker,branch:'topic',base:f.tip,operationId:'create'});
    assert.equal(created.path,worker); assert.equal(created.branch,'refs/heads/topic');
    assert.equal(created.tip,f.tip); assert.equal(fs.existsSync(path.join(worker,'.fgos')),false);
    assert.throws(()=>f.port.create({path:path.join(worker,'nested'),operationId:'nested'}),/nested/);
    fs.symlinkSync(worker,path.join(f.temp,'alias'),'dir');
    assert.throws(()=>f.port.createDetached({path:path.join(f.temp,'alias','nested'),operationId:'symlink-nested'}),/nested/);
    assert.throws(()=>f.port.create({path:path.join(f.temp,'other'),branch:'topic',operationId:'used'}),/branch-in-use/);
    for (const lockName of ['main-checkout','event-append']) {
      const acquired=acquireSync(createLockScope(),lockName,{fgosDir:f.fgosDir,eventOpenRoot:f.temp});
      assert.equal(acquired.result,'acquired');
      try { assert.throws(()=>f.port.createDetached({path:path.join(f.temp,lockName),operationId:lockName},[acquired.handle]),/lock-order-violation/); } finally { acquired.handle.release(); }
    }
    fs.writeFileSync(path.join(worker,'valuable'), Buffer.from([0,255,12,1]));
    const proof = {path:worker,expectedTip:f.tip,deliveredTo:f.tip,evidenceDigest:'a'.repeat(64),operationId:'remove-dirty'};
    assert.throws(()=>f.port.remove(proof),/dirty/); assert.deepEqual(fs.readFileSync(path.join(worker,'valuable')),Buffer.from([0,255,12,1]));
    fs.unlinkSync(path.join(worker,'valuable'));
    const relocated=f.port.relocate({source:worker,destination:moved,expectedTip:f.tip,operationId:'move'});
    assert.equal(relocated.path,moved); assert.equal(fs.existsSync(worker),false);
    assert.throws(()=>f.port.remove({...proof,path:moved,expectedTip:'0'.repeat(40),operationId:'wrong-tip'}),/delivery-unproven/);
    f.port.remove({...proof,path:moved,operationId:'remove'});
    assert.equal(fs.existsSync(moved),false);
    assert.deepEqual(f.port.inspectOrphans(),[]);
    assert.equal(f.git('show-ref','--verify','refs/heads/topic').split(' ')[0],f.tip);
    assert.equal(f.git('for-each-ref','--format=%(refname)','refs/fgos/git-operations'), '');
  } finally { f.cleanup(); }
});
test('Worktree create strips tracked worker state without touching main state', {skip:process.platform==='win32'},()=>{
  const f=fixture('files',true); const worker=path.join(f.temp,'worker');
  try { f.port.createDetached({path:worker,operationId:'strip'}); assert.equal(fs.existsSync(path.join(worker,'.fgos')),false); assert.equal(fs.readFileSync(path.join(f.repoPath,'.fgos','fixture'),'utf8'),'tracked state'); } finally { f.cleanup(); }
});
test('Worktree remove preserves a live cwd', {skip:process.platform==='win32'},async()=>{
  const f=fixture(); const worker=path.join(f.temp,'worker');
  let child;
  try { f.port.createDetached({path:worker,operationId:'create'}); child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{cwd:worker}); await new Promise(r=>child.once('spawn',r)); assert.throws(()=>f.port.remove({path:worker,expectedTip:f.tip,deliveredTo:f.tip,evidenceDigest:'a'.repeat(64),operationId:'live'}),/live-cwd/); assert.equal(fs.existsSync(worker),true); } finally { if(child) { const done=new Promise(r=>child.once('exit',r)); child.kill(); await done; } f.cleanup(); }
});
test('detached sessions allocate unique mkdtemp paths and validate the session id', {skip:process.platform==='win32'},()=>{
  const f=fixture();
  try {
    const created=f.port.createDetached({parent:f.temp,sessionId:'session-1',operationId:'temp'});
    assert.match(path.basename(created.path),/^session-1-[A-Za-z0-9]{6}$/); assert.equal(created.branch,null);
    assert.throws(()=>f.port.createDetached({parent:f.temp,sessionId:'../escape',operationId:'escape'}),/invalid-session-id/);
    assert.throws(()=>f.port.createDetached({parent:f.temp,sessionId:'failed',base:'0'.repeat(40),operationId:'failed'}));
    assert.deepEqual(fs.readdirSync(f.temp).filter(name=>name.startsWith('failed-')),[]);
  } finally {f.cleanup();}
});
test('established worktree operation ids return without repeating effects and bind all inputs', {skip:process.platform==='win32'},()=>{
  const f=fixture(); const worker=path.join(f.temp,'worker'); const moved=path.join(f.temp,'moved');
  try {
    const request={path:worker,operationId:'create'};
    const first=f.port.createDetached(request); assert.deepEqual(f.port.createDetached(request),first);
    assert.throws(()=>f.port.createDetached({...request,path:path.join(f.temp,'other')}),/operation-id-conflict/);
    const move={source:worker,destination:moved,expectedTip:f.tip,operationId:'move'};
    const next=f.port.relocate(move); assert.deepEqual(f.port.relocate(move),next);
    const remove={path:moved,expectedTip:f.tip,deliveredTo:f.tip,evidenceDigest:'a'.repeat(64),operationId:'remove'};
    f.port.remove(remove); f.port.remove(remove);
    assert.throws(()=>f.port.remove({...remove,evidenceDigest:'b'.repeat(64)}),/operation-id-conflict/);
  } finally {f.cleanup();}
});
test('Worktree custody requires the actual holder', {skip:process.platform==='win32'},()=>{
  const f=fixture(); const worker=path.join(f.temp,'worker');
  let handle;
  try {
    f.port.createDetached({path:worker,operationId:'create'});
    const acquired=acquireSync(createLockScope(),'dispatch-cwd',{fgosDir:f.fgosDir,cwd:worker});
    assert.equal(acquired.result,'acquired'); handle=acquired.handle;
    const remove={path:worker,expectedTip:f.tip,deliveredTo:f.tip,evidenceDigest:'a'.repeat(64),operationId:'custody-remove'};
    assert.throws(()=>f.port.remove(remove),/custody/);
    assert.equal(fs.existsSync(worker),true);
    f.port.remove(remove,[handle]); handle.release(); handle=null;
  } finally {handle?.release();f.cleanup();}
});
test('stripped tracked state is clean for removal and reappearing worker state is preserved', {skip:process.platform==='win32'},()=>{
  const f=fixture('files',true); const worker=path.join(f.temp,'worker');
  try {
    f.port.createDetached({path:worker,operationId:'create'});
    const proof={path:worker,expectedTip:f.tip,deliveredTo:f.tip,evidenceDigest:'a'.repeat(64),operationId:'remove'};
    fs.mkdirSync(path.join(worker,'.fgos'));fs.writeFileSync(path.join(worker,'.fgos','foreign'),'keep');
    assert.throws(()=>f.port.remove(proof),/dirty-preserved/);
    fs.unlinkSync(path.join(worker,'.fgos','foreign'));fs.rmdirSync(path.join(worker,'.fgos'));
    fs.appendFileSync(path.join(f.repoPath,'.git','info','exclude'),'\nignored\n');
    fs.writeFileSync(path.join(worker,'ignored'),Buffer.from([0,255]));
    assert.throws(()=>f.port.remove(proof),/ignored-bytes-preserved/);
    assert.deepEqual(fs.readFileSync(path.join(worker,'ignored')),Buffer.from([0,255]));
    fs.unlinkSync(path.join(worker,'ignored'));
    f.port.remove(proof); assert.equal(fs.existsSync(worker),false);
  } finally {f.cleanup();}
});
test('main checkout allocation supports .claude/worktrees and rejects admin or linked nesting', {skip:process.platform==='win32'},()=>{
  const f=fixture();
  try {
    fs.appendFileSync(path.join(f.repoPath,'.git/info/exclude'),'\n.claude/\n');
    const parent=path.join(f.repoPath,'.claude/worktrees'); fs.mkdirSync(parent,{recursive:true});
    const worker=path.join(parent,'worker');
    f.port.createDetached({path:worker,operationId:'nested-main'});
    assert.equal(fs.existsSync(path.join(worker,'.git')),true);
    assert.throws(()=>f.port.createDetached({path:path.join(worker,'unsafe'),operationId:'unsafe'}),/nested/);
    assert.throws(()=>f.port.createDetached({path:path.join(f.repoPath,'.git','unsafe'),operationId:'admin'}),/nested/);
  } finally { f.cleanup(); }
});
test('locked worktrees and submodules refuse before attempting removal or relocation', {skip:process.platform==='win32'},()=>{
  const f=fixture(); const worker=path.join(f.temp,'worker');
  try {
    f.port.createDetached({path:worker,operationId:'create'});
    const remove={path:worker,expectedTip:f.tip,deliveredTo:f.tip,evidenceDigest:'a'.repeat(64),operationId:'remove'};
    const move={source:worker,destination:path.join(f.temp,'moved'),expectedTip:f.tip,operationId:'move'};
    f.git('worktree','lock',worker);
    assert.throws(()=>f.port.remove(remove),/user-locked/);
    assert.throws(()=>f.port.relocate(move),/user-locked/);
    f.git('worktree','unlock',worker);
    execFileSync('git',['-C',worker,'update-index','--add','--cacheinfo',`160000,${f.tip},submodule`]);
    execFileSync('git',['-C',worker,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','submodule']);
    fs.mkdirSync(path.join(worker,'submodule'));
    assert.throws(()=>f.port.remove(remove),/submodules/);
    assert.throws(()=>f.port.relocate(move),/submodules/);
  } finally {f.cleanup();}
});
test('detached undelivered tip requires a surviving non-fgos ref', {skip:process.platform==='win32'},()=>{
  const f=fixture(); const worker=path.join(f.temp,'worker');
  try {
    f.port.createDetached({path:worker,operationId:'create'});
    const tree=f.git('rev-parse','HEAD^{tree}');
    const tip=f.git('commit-tree',tree,'-p',f.tip,'-m','undelivered');
    // This commit is deliberately reachable only through the detached HEAD.
    execFileSync('git',['-C',worker,'update-ref','--no-deref','HEAD',tip]);
    const proof={path:worker,expectedTip:tip,deliveredTo:tip,evidenceDigest:'a'.repeat(64),operationId:'remove'};
    assert.throws(()=>f.port.remove(proof),/delivery-unreachable/);
    f.git('update-ref','refs/heads/delivered',tip);
    f.port.remove(proof);
  } finally {f.cleanup();}
});

for (const action of ['remove','relocate']) {
test(`Worktree ${action} warns once and proceeds with a non-dumpable same-user process`, {skip:process.platform!=='linux'},()=>{
  // A real PR_SET_DUMPABLE=0 process reproduces ssh-agent/systemd cwd permissions.
  const script = `
    import fs from 'node:fs';
    import path from 'node:path';
    import assert from 'node:assert/strict';
    import {spawn} from 'node:child_process';
    import {fixture} from ${JSON.stringify(new URL('./worktree-fixture.mjs',import.meta.url).href)};
    const f=fixture(); const worker=path.join(f.temp,'worker'); let child;
    try {
      f.port.createDetached({path:worker,operationId:'create'});
      child=spawn('python3',['-c',
        'import ctypes,os,time; assert ctypes.CDLL(None).prctl(4,0,0,0,0)==0; print(os.getpid(),flush=True); time.sleep(60)'],
        {cwd:f.repoPath,stdio:['ignore','pipe','inherit']});
      await new Promise((resolve,reject)=>{child.once('error',reject);child.stdout.once('data',resolve);});
      assert.throws(()=>fs.readlinkSync('/proc/'+child.pid+'/cwd'), /EACCES|EPERM/);
      console.log('protected-pid='+child.pid);
      const moved=path.join(f.temp,'moved');
      if (${JSON.stringify(action)} === 'relocate') {
        f.port.relocate({source:worker,destination:moved,expectedTip:f.tip,operationId:'move'});
        assert.equal(fs.existsSync(moved),true);
      } else {
        f.port.remove({path:worker,expectedTip:f.tip,deliveredTo:f.tip,evidenceDigest:'a'.repeat(64),operationId:'remove'});
      }
      assert.equal(fs.existsSync(worker),false);
    } finally {
      if(child){const done=new Promise(r=>child.once('exit',r));child.kill();await done;}
      f.cleanup();
    }
  `;
  const result=spawnSync(process.execPath,['--input-type=module','-e',script],{encoding:'utf8',timeout:120000});
  assert.equal(result.status,0,result.stderr);
  const pid=/protected-pid=(\d+)/.exec(result.stdout)?.[1]; assert.ok(pid,result.stdout);
  assert.equal(result.stderr.split('warning: worktree-cwd-unreadable pid='+pid+' ').length-1,1,result.stderr);
});

}

for (const changed of [false, true]) {
  test(`plain worktree with tracked .fgos ${changed ? 'preserves modifications' : 'removes cleanly'}`, {skip:process.platform==='win32'},()=>{
    const f=fixture('files',true); const worker=path.join(f.temp,'worker');
    try {
      f.git('worktree','add','--detach',worker,f.tip);
      const proof={path:worker,expectedTip:f.tip,deliveredTo:f.tip,evidenceDigest:'a'.repeat(64),operationId:'plain-remove'};
      if(changed) {
        fs.writeFileSync(path.join(worker,'.fgos','fixture'),'modified state');
        assert.throws(()=>f.port.remove(proof),/dirty-preserved/);
        assert.equal(fs.readFileSync(path.join(worker,'.fgos','fixture'),'utf8'),'modified state');
      } else {
        f.port.remove(proof); assert.equal(fs.existsSync(worker),false);
      }
    } finally {f.cleanup();}
  });
}
test('recreated skip-worktree tracked state is preserved even with identical bytes', {skip:process.platform==='win32'},()=>{
  const f=fixture('files',true); const worker=path.join(f.temp,'worker');
  try {
    f.port.createDetached({path:worker,operationId:'create'});
    fs.mkdirSync(path.join(worker,'.fgos'));
    fs.writeFileSync(path.join(worker,'.fgos','fixture'),'tracked state');
    assert.throws(()=>f.port.remove({path:worker,expectedTip:f.tip,deliveredTo:f.tip,evidenceDigest:'a'.repeat(64),operationId:'remove'}),/worker-state-preserved/);
    assert.equal(fs.readFileSync(path.join(worker,'.fgos','fixture'),'utf8'),'tracked state');
  } finally {f.cleanup();}
});
