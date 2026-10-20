// Store-only V-SPAWN worker: real facade, kernel gate and durable cache.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { loadNativeAddon } from '../../src/git/native.mjs';
import { openStore } from '../../src/event-store/index.mjs';
import { withStateTx } from '../../src/state/hot-lock.mjs';

export function benchmarkStore(repo, stateRoot, manifestPath, releaseRoot) {
  const loader={descriptor:{manifest:JSON.parse(fs.readFileSync(manifestPath)),releaseRoot}};
  const native=loadNativeAddon(loader);
  const contract=path.join(repo,'benchmark-contract.json');
  if(!fs.existsSync(contract)) fs.writeFileSync(contract,JSON.stringify({v:1,types:[{type:'benchmark.created',domain:'benchmark',schemaVersion:1,scope:'project',sealOnWrite:false}]}));
  return openStore(native.resolveEventStore(repo,stateRoot,repo),'spawn-benchmark',[contract],loader);
}
export function seedStore(store, { items=1000, history } = {}) {
  if(!Number.isInteger(items)||items<0)throw Error('seed-items must be a nonnegative integer');
  const payloads=history ? fs.readFileSync(history,'utf8').split('\n').filter(line=>line.trim()).map(line=>JSON.parse(line))
    : Array.from({length:items},(_,i)=>({id:`seed-${i}`,title:`Realistic foundation work ${i}`,status:'todo',kind:'task',deps:[],refs:['docs/platform/event-store/spec.md'],description:'Acceptance evidence, implementation context and reproducible verification. '.repeat(110),verify:'node --test test/event-store/*.test.mjs'}));
  for(let i=0;i<payloads.length;i+=50)store.append('project',payloads.slice(i,i+50).map((payload,j)=>({eventType:'benchmark.created',schemaVersion:1,payload:{...payload,id:`seed-${i+j}`},ts:new Date().toISOString()})),{},'benchmark-seed',[]);
  if(payloads.length)store.seal('project',[]);
  return {items:payloads.length,payloadBytes:Buffer.byteLength(JSON.stringify(payloads)),source:history?path.resolve(history):'generated realistic payloads'};
}
export function runWorker([repo,stateRoot,manifestPath,releaseRoot,index,count,barrier,trace]) {
  const store=benchmarkStore(repo,stateRoot,manifestPath,releaseRoot);
  const hot=path.join(repo,'.fgos'), cache=path.join(hot,'benchmark-view.json');
  const observations=[];
  fs.writeFileSync(path.join(barrier,`${index}.ready`),'ready');
  const deadline=Date.now()+65000;
  while(!fs.existsSync(path.join(barrier,'go'))){
    if(Date.now()>deadline)throw Error('start barrier timed out');
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,2);
  }
  let snapshot;
  for(let i=0;i<Number(count);i++){
    const start=performance.now();
    const read=store.read({streams:['project'],cursor:snapshot?.cursor,folded:snapshot?.sequence??[]},[]);
    snapshot=read;
    const view=Object.fromEntries(read.sequence.map(e=>[e.payload.id,e.payload]));
    const requested=performance.now();let gateStart,gateEnd;const stages={prepareEvents:0};
    withStateTx(hot,()=>{
      gateStart=performance.now();
      if(trace==='yes')fs.writeSync(2,`ES_GATE_BEGIN:${index}\n`);
      const timed=(stage,fn)=>{const t=performance.now();try{return fn();}finally{stages[stage]=performance.now()-t;}};
      const tail=timed('readInGate',()=>store.readInGate(store.ownOrigin,'project',read.cursor.cover[`${store.ownOrigin}:project`]??0));
      const input={eventType:'benchmark.created',schemaVersion:1,payload:{id:`s${index}-${i}`,title:'latency'},ts:new Date().toISOString()};
      if(trace==='yes')fs.writeSync(2,`ES_APPEND_BEGIN:${index}\n`);
      const ack=timed('append',()=>store.append('project',[input],read.cursor.cover,`session-${index}`,[60]));
      if(trace==='yes')fs.writeSync(2,`ES_APPEND_END:${index}\n`);
      timed('fold',()=>{for(const e of [...tail.events,...ack.events])view[e.payload.id]=e.payload;});
      timed('cacheWrite',()=>{const tmp=cache+`.${index}.tmp`;fs.writeFileSync(tmp,JSON.stringify(view));fs.renameSync(tmp,cache);});
      if(trace==='yes')fs.writeSync(2,`ES_GATE_END:${index}\n`);
      gateEnd=performance.now();
    },{prefetched:{writer:`session-${index}`,eventStore:store}});
    observations.push({incrementUpperBoundMs:gateEnd-gateStart,waitMs:gateStart-requested,totalMs:performance.now()-start,stages,storeIncrementMs:stages.readInGate+stages.append+stages.fold});
  }
  console.log(JSON.stringify({index:Number(index),observations}));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))runWorker(process.argv.slice(2));
