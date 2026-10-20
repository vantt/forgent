// Measured half of V-SPAWN-01. Real consumer, reducer, cache and kernel locks;
// timing adapters delegate to the native store and never replace its behavior.
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { loadNativeAddon } from '../../src/git/native.mjs';
import { openStore, eventStoreConfig } from '../../src/event-store/index.mjs';
import { withWorkState } from '../../src/state/work-event-store.mjs';
const [repo,stateRoot,manifestPath,releaseRoot,index,count,barrier,trace] = process.argv.slice(2);
const loader={descriptor:{manifest:JSON.parse(fs.readFileSync(manifestPath)),releaseRoot}};
const native=loadNativeAddon(loader);
const real=openStore(native.resolveEventStore(repo,stateRoot,repo),'spawn-benchmark',[path.join(releaseRoot,'packages/work-state/contracts/event-streams.v1.json')],loader);
const hot=path.join(repo,'.fgos');
let gateStart,gateEnd,requested,wait,stages;
const observations=[];
const measured=new Proxy({}, {get(_target,key){
 const target=real;
 if(key==='append') return (...args)=>{
  if(trace==='yes')fs.writeSync(2,`ES_APPEND_BEGIN:${index}\n`);
  try{return target.append(...args);}finally{if(trace==='yes')fs.writeSync(2,`ES_APPEND_END:${index}\n`);}
 };
 if(key==='sealIfDue') return (...args)=>{
  gateEnd=performance.now();
  if(trace==='yes')fs.writeSync(2,`ES_GATE_END:${index}\n`);
  return target.sealIfDue(...args);
 };
 if(key==='readInGate') return (...args)=>{
  gateStart=performance.now();wait=gateStart-requested;
  if(trace==='yes') fs.writeSync(2,`ES_GATE_BEGIN:${index}\n`);
  return target.readInGate(...args);
 };
 return typeof target[key]==='function'?target[key].bind(target):target[key];
}});
const config=eventStoreConfig({eventStore:{seal:{intervalSec:86400}}});
fs.writeFileSync(path.join(barrier,`${index}.ready`),'ready');
const deadline=Date.now()+65000;
while(!fs.existsSync(path.join(barrier,'go'))){
 if(Date.now()>deadline)throw Error('start barrier timed out');
 Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,2);
}
for(let i=0;i<Number(count);i++){
 stages={};
 const start=performance.now();
 withWorkState(hot,hot,`session-${index}`,tx=>tx.append({type:'work.add',payload:{id:`s${index}-${i}`,title:'latency'}}),{
  store:measured,config,onTiming(stage,ms){stages[stage]=(stages[stage]??0)+ms;},beforeGate(){requested=performance.now();}
 });
 // This upper bound includes cache persistence and unlock, in addition to
 // read + append/fsync + fold. Passing it proves the narrower store budget.
 const end=performance.now();
 observations.push({incrementUpperBoundMs:gateEnd-gateStart,waitMs:wait,totalMs:end-start,stages,storeIncrementMs:stages.readInGate+stages.append+stages.fold+stages.prepareEvents});
}
console.log(JSON.stringify({index:Number(index),observations}));
