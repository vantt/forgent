import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { ensureGitAddon, root as checkout } from '../helpers/git-addon.mjs';
import { fixture } from './phase07-fixture.mjs';
import { benchmark, percentile } from '../../scripts/event-store/v-spawn-bench.mjs';

test('benchmark refuses an existing root without changing its contents', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'event-store-bench-existing-'));
  try {
    fs.writeFileSync(path.join(root, 'sentinel'), 'untouched');
    await assert.rejects(benchmark({root, out:path.join(root,'result.json')}), /fresh/);
    assert.deepEqual(fs.readdirSync(root), ['sentinel']);
    assert.equal(fs.readFileSync(path.join(root,'sentinel'),'utf8'), 'untouched');
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
});
test('benchmark refuses tmpfs before creating the fixture', {skip: process.platform !== 'linux' || !fs.existsSync('/dev/shm')}, async () => {
  const root = `/dev/shm/event-store-bench-${process.pid}`;
  assert.equal(fs.existsSync(root),false);
  await assert.rejects(benchmark({root, out:path.join(root,'result.json')}), /ext4 required/);
  assert.equal(fs.existsSync(root),false);
});

test('benchmark refuses source-tree fixture and result paths before mutation', async () => {
  const root = path.resolve('scripts/event-store/forbidden-fixture');
  await assert.rejects(benchmark({root,out:'/tmp/unused-bench.json'}), /checkout writes/);
  assert.equal(fs.existsSync(root),false);
  await assert.rejects(benchmark({root:'/tmp/unused-fresh-bench',out:path.resolve('scripts/event-store/forbidden.json')}), /checkout writes/);
});
test('nearest-rank percentile handles unsorted observations and tails', () => {
  assert.equal(percentile([4,1,3,2],.5),2);
  assert.equal(percentile(Array.from({length:40},(_,i)=>40-i),.95),38);
  assert.equal(percentile([4,1,3,2],.99),4);
});

test('store-increment workers exercise the real concurrent consumer and delimit every measured gate', async t => {
  const f=fixture(t,{machine:false});f.git('config','fgos.machineId','spawn-benchmark');
  const built=ensureGitAddon();const barrier=path.join(f.temp,'barrier');fs.mkdirSync(barrier);
  const children=[];
  t.after(async()=>{for(const c of children)if(c.exitCode===null)c.kill('SIGKILL');await Promise.allSettled(children.map(c=>c.done));});
  for(let i=0;i<2;i++){
    const child=spawn(process.execPath,[path.join(checkout,'scripts/event-store/store-increment-worker.mjs'),f.repo,f.stateRoot,built.manifest,checkout,String(i),'2',barrier,'yes']);
    child.output='';child.errors='';child.stdout.on('data',b=>child.output+=b);child.stderr.on('data',b=>child.errors+=b);
    child.done=new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',code=>code===0?resolve():reject(Error(child.errors)));});
    child.done.catch(()=>{});children.push(child);
  }
  const deadline=Date.now()+15000;
  while(!children.every((_,i)=>fs.existsSync(path.join(barrier,`${i}.ready`)))){
    for(const child of children)assert.equal(child.exitCode,null,child.errors);
    assert.ok(Date.now()<deadline,'workers must reach the barrier');await new Promise(r=>setTimeout(r,5));
  }
  fs.writeFileSync(path.join(barrier,'go'),'go');await Promise.all(children.map(c=>c.done));
  for(const child of children){
    const result=JSON.parse(child.output);assert.equal(result.observations.length,2);
    assert.ok(result.observations.every(o=>Number.isFinite(o.incrementUpperBoundMs)&&o.incrementUpperBoundMs>=0&&o.waitMs>=0));
    assert.equal(child.errors.match(/ES_GATE_BEGIN:/g)?.length,2);assert.equal(child.errors.match(/ES_GATE_END:/g)?.length,2);
  }
  // This is correctness smoke only; host latency acceptance remains explicit.
  const stream=path.join(f.repo,'.git/fgos/events/project');
  assert.ok(fs.existsSync(stream));
});

test('explicit host benchmark reports a machine-readable failure when ext4 is absent', {skip:process.platform!=='linux'||!fs.existsSync('/dev/shm')},()=>{
  const root=`/dev/shm/event-store-host-verdict-${process.pid}`;
  let output;
  try{execFileSync(process.execPath,[path.join(checkout,'scripts/event-store/v-spawn-bench.mjs'),'--root',root,'--out',path.join(root,'result.json'),'--sessions','1,10,15,20','--store-increment','--strace'],{encoding:'utf8'});assert.fail('tmpfs cannot pass host acceptance');}
  catch(error){assert.equal(error.status,1);output=error.stdout;}
  const verdict=JSON.parse(output.trim());assert.equal(verdict.verdict,'FAIL');assert.match(verdict.error,/ext4 required/);
  assert.equal(fs.existsSync(root),false);
});
