import '../helpers/process-tmp-root.mjs';
import { initializeWorkRepository } from '../helpers/work-store-release.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { initStore, addWork, listWork, settleClaim, readRawEvents } from '../../src/state/store.mjs';

import { acquireClaim } from '../../src/state/runtime-coordination.mjs';

const storeUrl = new URL('../../src/state/store.mjs', import.meta.url).href;
const claimUrl = new URL('../../src/runner/claim-port.mjs', import.meta.url).href;
const runtimeUrl = new URL('../../src/state/runtime-coordination.mjs', import.meta.url).href;
const source = `
import fs from 'node:fs';
import path from 'node:path';
import {moveWork,settleClaim} from ${JSON.stringify(storeUrl)};
import {claimWork} from ${JSON.stringify(claimUrl)};
import {readClaim} from ${JSON.stringify(runtimeUrl)};
const [repo, barrier, name, mode, id] = process.argv.slice(1);
const dir=path.join(repo,'.fgos');
fs.writeFileSync(path.join(barrier,name),'ready');
const deadline=Date.now()+15000;
while(!fs.existsSync(path.join(barrier,'go'))) {
 if(Date.now()>deadline) throw Error('barrier timeout');
 Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,5);
}
try {
 const result= mode==='move' ? moveWork(dir,{id,to:'blocked',expectedStatus:'todo',reason:'race'})
 : await claimWork(dir,{id,actor:'session',isolate:false,repoRoot:repo});
 console.log(JSON.stringify({ok:true,result}));
 // Stay alive until both claims have been checked: no stale-claim reclaim can
 // turn the slot race into two sequential acquisitions.
 if(mode==='slot') {
  while(!fs.existsSync(path.join(barrier,'settle'))) {
   if(Date.now()>deadline) throw Error('settle barrier timeout');
   Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,5);
  }
  const claim=readClaim(dir,id);
  settleClaim(dir,{id,claimId:claim.claimId,finalStatus:'blocked',reason:'race complete'});
 }
} catch(e) { console.log(JSON.stringify({ok:false,code:e.code??e.category,message:e.message})); }
`;
async function waitFor(predicate, children) {
  const deadline = Date.now() + 20000;
  while (!predicate()) {
    for (const child of children) if (child.exitCode !== null || child.signalCode !== null) throw Error(`child exited early: ${child.output} ${child.errors}`);
    if (Date.now() > deadline) throw Error('race barrier timeout');
    await new Promise(resolve => setTimeout(resolve, 5));
  }
}
for (const mode of ['move', 'slot']) test(`two processes in distinct linked worktrees race ${mode === 'move' ? 'the same expectedStatus' : 'the last worker slot'}`, async t => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'v-auth-'));
  const repo=path.join(temp,'main'); const dir=initializeWorkRepository(repo);
  const git=(...args)=>execFileSync('git',['-C',repo,...args],{stdio:'pipe'});
  git('commit','--allow-empty','-qm','race fixture');
  initStore(dir);
  for(const id of ['one','two']) addWork(dir,{id,title:id,kind:'task',status:'todo',deps:[],refs:[],risk:'light',verify:'true'});
  fs.writeFileSync(path.join(dir,'config.json'),JSON.stringify({workerSlots:{ceiling:1}}));
  const barrier=path.join(temp,'barrier'); fs.mkdirSync(barrier);
  const children=[];
  t.after(async()=>{
    for(const child of children) if(child.exitCode===null) child.kill('SIGKILL');
    await Promise.allSettled(children.map(c=>c.done));
    fs.rmSync(temp,{recursive:true,force:true});
  });
  for (const name of ['a','b']) {
    const worktree=path.join(temp,name); git('worktree','add','--detach',worktree,'HEAD');
    // Linked checkouts share precisely the same runtime claim/cache authority.
    fs.symlinkSync(dir,path.join(worktree,'.fgos'),'dir');
    const child=spawn(process.execPath,['--input-type=module','-e',source,worktree,barrier,name,mode,mode==='move'?'one':name==='a'?'one':'two'],{cwd:worktree,env:{...process.env,FGOS_SESSION_ID:`race-${name}`}});
    child.output='';child.errors='';
    child.stdout.on('data',b=>child.output+=b);child.stderr.on('data',b=>child.errors+=b);
    child.done=new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',(code,signal)=>code===0?resolve():reject(Error(`${code}/${signal}: ${child.errors}`)));});
    child.done.catch(()=>{});
    children.push(child);
  }
  await waitFor(()=>['a','b'].every(n=>fs.existsSync(path.join(barrier,n))),children);
  fs.writeFileSync(path.join(barrier,'go'),'go');
  await waitFor(()=>children.every(c=>c.output.includes('\n')),[]);
  const results=children.map(c=>JSON.parse(c.output.trim().split('\n')[0]));
  assert.equal(results.filter(r=>r.ok).length,1,JSON.stringify(results));
  assert.equal(results.find(r=>!r.ok).code,mode==='move'?'conflict':'worker-slot-ceiling');
  if(mode==='slot') {
    assert.equal(Object.values(listWork(dir).work).filter(w=>w.status==='doing').length,1);
    fs.writeFileSync(path.join(barrier,'settle'),'settle');
  }
  await Promise.all(children.map(c=>c.done));
  assert.ok(children.every(c=>c.output.trim().split('\n').length===1),children.map(c=>c.output).join('\n'));
  assert.equal(Object.values(listWork(dir).work).filter(w=>w.status==='blocked').length,1);
  if(mode==='slot') assert.equal(fs.readdirSync(path.join(dir,'runtime/claims')).filter(n=>n.endsWith('.json')).length,0);
});

test('a real sequence-recovery refusal on settle retains the claim and cache', t => {
  const repo=fs.mkdtempSync(path.join(os.tmpdir(),'settle-refused-'));
  t.after(()=>fs.rmSync(repo,{recursive:true,force:true}));
  const dir=initializeWorkRepository(repo);initStore(dir);
  addWork(dir,{id:'one',title:'one',kind:'task',status:'todo',deps:[],refs:[],risk:'light',verify:'true'});
  const claim=acquireClaim(dir,{id:'one',actor:'session',preClaimStatus:'todo',claimRole:'session'});
  const claimPath=path.join(dir,'runtime/claims/one.json');
  const cachePath=path.join(dir,'cache/state.json');
  const beforeClaim=fs.readFileSync(claimPath),beforeCache=fs.readFileSync(cachePath);
  const hwm=path.join(repo,'.git/fgos/events/project/hwm.json');
  const validHwm=fs.readFileSync(hwm);fs.writeFileSync(hwm,'{"lastSeq":100000}');
  assert.throws(()=>settleClaim(dir,{id:'one',claimId:claim.claimId,finalStatus:'blocked',reason:'refusal'}),{code:'event-store-seq-recovery-conflict'});
  assert.deepEqual(fs.readFileSync(claimPath),beforeClaim);
  assert.deepEqual(fs.readFileSync(cachePath),beforeCache);
  // Corrupt sequence metadata requires repair, never silent loss. Once restored,
  // the same real settle succeeds and emits precisely one attempt.
  fs.writeFileSync(hwm,validHwm);
  settleClaim(dir,{id:'one',claimId:claim.claimId,finalStatus:'blocked',reason:'recovered'});
  assert.equal(fs.existsSync(claimPath),false);
  assert.equal(readRawEvents(dir).filter(e=>e.type==='work.attempt').length,1);
});
