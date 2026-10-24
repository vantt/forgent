import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fixture, append, loaderOptions, addon } from './phase07-fixture.mjs';
import { branchKey } from '../../src/event-store/index.mjs';
import { benchmarkStore, seedStore } from '../../scripts/event-store/store-increment-worker.mjs';

test('maintenance reads local age and push receipts without ref or legacy verification',t=>{
  const f=fixture(t);
  assert.deepEqual(f.store.maintenance([]),{streams:[],lastPush:null,lastAttempt:null});
  append(f.store,[{ts:'2020-01-01T00:00:00.000Z'}]);
  // A malformed event ref would make a full store read fail.
  const ref=path.join(f.repo,'.git/refs/fgos/events/invalid');
  fs.mkdirSync(path.dirname(ref),{recursive:true});fs.writeFileSync(ref,'f'.repeat(40)+'\n');
  const facts=f.store.maintenance([]);
  assert.equal(facts.streams.length,1);
  assert.equal(facts.streams[0].stream,'project');
  assert.ok(facts.streams[0].oldestUnsealedAgeSec>86400);
  assert.equal(facts.lastPush,null);
  assert.throws(()=>f.store.read({streams:['project']},[]));
  assert.throws(()=>f.store.maintenance([60]),{code:'event-store-seal-under-state'});
});

test('maintenance returns the actual last push receipt',t=>{
  const f=fixture(t,{remote:true});
  append(f.store,[{payload:{id:'pushed'}}]);
  addon.ensureGitFetchMapping(f.stateRoot,f.repo,f.repo,'origin',addon.gitFetchMappings('origin'),'maintenance-mapping');
  f.store.sync({remote:'origin'},[]);
  const last=f.store.maintenance([]).lastPush;
  assert.equal(last.remote,'origin');assert.equal(last.error,null);
  assert.ok(last.time>0);
});

test('facade branch keys use the crate normalization and validation',()=>{
  assert.equal(branchKey('Feature/Hello World',loaderOptions),'feature-hello-world');
  assert.throws(()=>branchKey('',loaderOptions));
});

test('read passes retained coverage and history through sealing and new appends',t=>{
  const {store}=fixture(t);
  append(store,[{payload:{id:'first'}}]);
  const first=store.read({streams:['project']},[]);
  store.seal('project',[]);
  const sealed=store.read({streams:['project'],cursor:first.cursor,folded:first.sequence},[]);
  assert.deepEqual(sealed.events,[]);
  for(const key of ['cover','streams','deferred'])assert.deepEqual(sealed.cursor[key],first.cursor[key]);
  assert.notDeepEqual(sealed.cursor.certified,first.cursor.certified);
  append(store,[{payload:{id:'second'}}]);
  const next=store.read({streams:['project'],cursor:sealed.cursor,folded:sealed.sequence},[]);
  assert.deepEqual(next.events.map(e=>e.payload.id),['second']);
  assert.deepEqual(next.sequence.map(e=>e.payload.id),['first','second']);
  assert.deepEqual(next.sequence,store.read({streams:['project']},[]).sequence);
});

test('store-only benchmark seed retains realistic payloads and explicit history',t=>{
  const f=fixture(t);
  // The fixture contract accepts work.add; seed against the same facade with
  // a registered benchmark contract, never through the Work consumer.
  const contract=path.join(f.temp,'benchmark.json');
  fs.writeFileSync(contract,JSON.stringify({v:1,types:[{type:'benchmark.created',domain:'benchmark',schemaVersion:1,scope:'project',sealOnWrite:false}]}));
  return import('../../src/event-store/index.mjs').then(async({openStore})=>{
    const {addon}=await import('./phase07-fixture.mjs');
    const store=openStore(addon.resolveEventStore(f.repo,f.stateRoot,f.repo),'phase-seven',[contract],loaderOptions);
    const seed=seedStore(store,{items:1000});
    assert.equal(seed.items,1000);assert.ok(seed.payloadBytes>8_000_000);
    assert.equal(store.read({streams:['project']},[]).sequence.length,1000);
    const history=path.join(f.temp,'history.jsonl');
    fs.writeFileSync(history,JSON.stringify({id:'original',description:'real history payload'})+'\n');
    assert.equal(seedStore(store,{history}).items,1);
    assert.equal(store.read({streams:['project']},[]).sequence.at(-1).payload.description,'real history payload');
  });
});

test('store-only worker measures append and cache without a Work consumer',t=>{
  const f=fixture(t);f.git('config','fgos.machineId','spawn-benchmark');
  const manifest=path.join(f.temp,'native-addon.json');
  fs.writeFileSync(manifest,JSON.stringify(loaderOptions.descriptor.manifest));
  const root=loaderOptions.descriptor.releaseRoot;
  const store=benchmarkStore(f.repo,f.stateRoot,manifest,root);
  seedStore(store,{items:5});
  const barrier=path.join(f.temp,'barrier');fs.mkdirSync(barrier);fs.writeFileSync(path.join(barrier,'go'),'go');
  const trace=path.join(f.temp,'worker.trace');
  const worker=spawnSync('strace',['-f','-e','trace=process,write,fsync,fdatasync','-s','256','-o',trace,process.execPath,path.join(root,'scripts/event-store/store-increment-worker.mjs'),f.repo,f.stateRoot,manifest,root,'0','3',barrier,'yes'],{encoding:'utf8',timeout:30000});
  assert.equal(worker.status,0,worker.stderr);
  const measured=JSON.parse(worker.stdout);
  assert.equal(measured.observations.length,3);
  assert.ok(measured.observations.every(o=>Number.isFinite(o.storeIncrementMs)&&o.storeIncrementMs>0));
  assert.equal(Object.keys(JSON.parse(fs.readFileSync(path.join(f.repo,'.fgos/benchmark-view.json')))).length,8);
  assert.equal((worker.stderr.match(/ES_GATE_BEGIN:/g)??[]).length,3);
  let inside=false,appending=false,count=0,spawns=0;const syncs=[];
  for(const line of fs.readFileSync(trace,'utf8').split('\n')){
    if(line.includes('ES_APPEND_BEGIN:')){appending=true;count=0;continue;}
    if(line.includes('ES_APPEND_END:')){syncs.push(count);appending=false;continue;}
    if(appending&&/\b(?:fsync|fdatasync)\(/.test(line))count++;
    if(line.includes('ES_GATE_BEGIN:')){inside=true;continue;}
    if(line.includes('ES_GATE_END:')){inside=false;continue;}
    if(inside&&/\b(?:clone|clone3|fork|vfork|execve|execveat)\(/.test(line))spawns++;
  }
  assert.equal(spawns,0);assert.equal(syncs.length,3);
  // The first append after a seal may durably remove old segment files.
  assert.ok(syncs[0]>=3);assert.deepEqual(syncs.slice(1),[3,3]);
});

test('facade promotion publishes registered branch events through the crate',t=>{
  const {store}=fixture(t);
  append(store,[{payload:{id:'project-event'}}]);
  store.seal('project',[]);
  store.append('branch:item',[{eventType:'private.branch',schemaVersion:1,payload:{id:'branch-event'},ts:new Date().toISOString()}],{},'fixture',[]);
  store.promote({branch:'branch:item',throughSeq:1,cursor:{},writer:'fixture'},[]);
  const read=store.read({streams:['project']},[]);
  assert.ok(read.sequence.some(e=>e.type==='store.promote'));
  assert.ok(read.sequence.some(e=>e.payload.id==='branch-event'));
});

test('Inspect config reuse rejects changed stamps and recovers after repair',t=>{
  const f=fixture(t);
  f.store.read({streams:['project']},[]);
  const included=path.join(f.temp,'included.config');fs.writeFileSync(included,'');
  f.git('config','include.path',included);
  assert.throws(()=>f.store.read({streams:['project']},[]));
  f.git('config','--unset','include.path');
  assert.deepEqual(f.store.read({streams:['project']},[]).sequence,[]);
});


test('retained native view rejects edited envelopes and an ordinary copied view still verifies',t=>{
  const {store}=fixture(t);
  append(store,[{payload:{id:'retained',title:'original'}}]);
  store.seal('project',[]);
  const first=store.read({streams:['project']},[]);
  const next=store.read({streams:['project'],cursor:first.cursor,folded:first.sequence},[]);
  assert.deepEqual(next.sequence,first.sequence);
  assert.notEqual(next.sequence[0],first.sequence[0]);
  assert.equal('sequencePrefix' in next,false);
  const copied=structuredClone(next.sequence);
  assert.deepEqual(store.read({streams:['project'],cursor:next.cursor,folded:copied},[]).sequence,copied);
  next.sequence[0].payload.title='tampered';
  assert.throws(()=>store.read({streams:['project'],cursor:next.cursor,folded:next.sequence},[]),/event hash mismatch/);
});

test('concurrent benchmark sessions advance the own cursor with the in-gate tail',async t=>{
  const f=fixture(t);f.git('config','fgos.machineId','spawn-benchmark');
  const manifest=path.join(f.temp,'native-addon.json');
  fs.writeFileSync(manifest,JSON.stringify(loaderOptions.descriptor.manifest));
  const root=loaderOptions.descriptor.releaseRoot;
  const store=benchmarkStore(f.repo,f.stateRoot,manifest,root);
  seedStore(store,{items:5});
  const barrier=path.join(f.temp,'concurrent-barrier');fs.mkdirSync(barrier);
  const pending=[];const children=[];
  for(let i=0;i<4;i++){
    const child=spawn(process.execPath,[path.join(root,'scripts/event-store/store-increment-worker.mjs'),f.repo,f.stateRoot,manifest,root,String(i),'4',barrier,'no']);
    children.push(child);let stdout='',stderr='';
    child.stdout.on('data',b=>stdout+=b);child.stderr.on('data',b=>stderr+=b);
    pending.push(new Promise((resolve,reject)=>{
      child.on('error',reject);child.on('close',code=>code===0?resolve(JSON.parse(stdout)):reject(Error(stderr)));
    }));
  }
  t.after(()=>children.forEach(c=>{if(c.exitCode===null)c.kill('SIGKILL');}));
  const completed=Promise.all(pending);
  const deadline=Date.now()+20000;
  while(!children.every((_,i)=>fs.existsSync(path.join(barrier,`${i}.ready`)))){
    assert.ok(Date.now()<deadline,'workers reach the barrier');
    await Promise.race([completed.then(()=>{throw Error('workers exited before barrier');}),new Promise(r=>setTimeout(r,10))]);
  }
  fs.writeFileSync(path.join(barrier,'go'),'go');
  const results=await completed;
  assert.equal(results.flatMap(r=>r.observations).length,16);
  assert.ok(results.every(r=>r.observations.every(o=>o.outsideReadMs>0)));
  assert.equal(store.read({streams:['project']},[]).sequence.length,21);
});
