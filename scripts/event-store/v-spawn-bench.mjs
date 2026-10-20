#!/usr/bin/env node
// Wall-clock CLI benchmark. Source checkout is read-only; only --root/--out are written.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync, spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { resolveActiveHostBin } from '../../src/util/host-bin-path.mjs';

export function percentile(values, fraction) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)];
}
export async function benchmark({ root, out, samples = 40, sessions = [1, 10, 15, 20], hostBin, entry = 'host', storeIncrement = false, strace = false } = {}) {
  if (!['host', 'node-payload'].includes(entry)) throw new Error('entry must be host or node-payload');
  if (!root || !out) throw new Error('--root and --out required');
  if (!Number.isInteger(samples) || samples < 1 || sessions.some(n => !Number.isInteger(n) || n < 1)) throw new Error('invalid samples/sessions');
  root = path.resolve(root); out = path.resolve(out);
  if (fs.existsSync(root)) throw new Error('root must be fresh (will not reuse or delete an existing project)');
  const checkout = fs.realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'));
  // Resolve existing ancestors so a symlink cannot disguise a source-tree fixture.
  const realDestination = value => {
    let ancestor = value; const tail = [];
    while (!fs.existsSync(ancestor)) { tail.unshift(path.basename(ancestor)); ancestor = path.dirname(ancestor); }
    return path.join(fs.realpathSync(ancestor), ...tail);
  };
  for (const destination of [root, out]) {
    const relative = path.relative(checkout, realDestination(destination));
    if (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative)
        && !relative.startsWith(`.fgos${path.sep}runtime${path.sep}`)) throw new Error('checkout writes must be under .fgos/runtime/');
  }
  const parent = path.dirname(root);
  const filesystem = execFileSync('findmnt', ['-T', parent, '-n', '-o', 'FSTYPE'], { encoding: 'utf8' }).trim();
  if (filesystem !== 'ext4') throw new Error(`ext4 required; got ${filesystem}`);
  if (storeIncrement) return storeIncrementBenchmark({root,out,sessions,filesystem,checkout,strace});
  hostBin ??= resolveActiveHostBin({ cwd: checkout }).bin;
  if (!hostBin) throw new Error('pass --host-bin (real activated Rust host required)');
  hostBin = fs.realpathSync(hostBin);
  const env = { ...process.env, FGOS_HOST_BIN: hostBin };
  for (const key of Object.keys(env)) if (key.startsWith('GIT_') || ['CLAUDE_CODE_SESSION_ID', 'CODEX_THREAD_ID', 'FGOS_SESSION_ID', 'INIT_CWD'].includes(key)) delete env[key];
  // A private native state root prevents fixture locks/config from sharing the checkout's state.
  env.FGOS_STATE_ROOT = path.join(root, '.machine-state');
  fs.mkdirSync(root);
  const git = (...args) => execFileSync('git', args, { cwd: root, env, encoding: 'utf8' }).trim();
  git('init', '-q'); git('-c', 'user.name=Benchmark', '-c', 'user.email=benchmark@fgos.invalid', 'commit', '--allow-empty', '-qm', 'benchmark fixture');
  let active = 0; let peak = 0;
  const call = (args, writer) => new Promise(resolve => {
    const start = performance.now();
    const child = spawn(entry === 'host' ? 'fgos' : process.execPath, entry === 'host' ? args : [path.join(checkout, 'bin/fgos.mjs'), ...args], { cwd: root, env: { ...env, FGOS_SESSION_ID: writer }, stdio: ['ignore', 'pipe', 'pipe'] });
    active++; peak = Math.max(peak, active);
    let stdout = ''; let stderr = '';
    child.stdout.on('data', d => stdout += d); child.stderr.on('data', d => stderr += d);
    child.on('error', error => { stderr += String(error); });
    child.on('close', code => { active--; resolve({ ms: performance.now() - start, code, ...(code !== 0 ? { stdout, stderr } : {}) }); });
  });
  // Seed through the actual consumer API in a separate process with the same host/identity context.
  const seed = `import {initStore,addWork} from ${JSON.stringify(pathToFileURL(path.join(checkout, 'src/state/store.mjs')).href)};
const dir=process.argv[1]; initStore(dir); for(const id of JSON.parse(process.argv[2])) addWork(dir,{id,title:id,kind:'task',status:'todo',workflowStep:'executing',deps:[],risk:'light',refs:[],verify:'true'});`;
  const rows = [];
  const result = { contract: 'v-spawn-benchmark.v1', entry, command: entry === 'host' ? 'fgos (PATH shim, activated release)' : 'node bin/fgos.mjs (working-tree payload)', generatedAt: new Date().toISOString(), checkout, commit: execFileSync('git', ['rev-parse', 'HEAD'], {cwd: checkout, encoding: 'utf8'}).trim(), containsReadClaimsFix: (() => { try {execFileSync('git', ['merge-base', '--is-ancestor', 'a4b1278ae', 'HEAD'], {cwd: checkout}); return true;} catch {return false;} })(), filesystem, mount: execFileSync('findmnt', ['-T', parent, '-n', '-o', 'SOURCE,FSTYPE'], {encoding:'utf8'}).trim(), root, hostBin, node: process.version, cpu: os.cpus()[0].model, logicalCpus: os.cpus().length, samples, sessions, rows };
  for (const mutation of ['claim', 'move', 'settle']) for (const concurrency of sessions) {
    const ids = Array.from({length: samples}, (_, i) => `bench-${mutation}-${concurrency}-${i}`);
    execFileSync(process.execPath, ['--input-type=module', '-e', seed, path.join(root, '.fgos'), JSON.stringify(ids)], {cwd: root, env: {...env, FGOS_SESSION_ID:'bench-seed'}, stdio:'pipe'});
    const observations = []; peak = 0;
    for (let offset = 0; offset < samples; offset += concurrency) {
      const batch = ids.slice(offset, offset + concurrency).map((id, i) => ({id, writer:`bench-${mutation}-${concurrency}-session-${i}`}));
      if (mutation === 'settle') {
        const prep = await Promise.all(batch.map(({id,writer}) => call(['take','--id',id],writer)));
        if (prep.some(r => r.code !== 0)) throw new Error(`settle preparation failed: ${JSON.stringify(prep.filter(r=>r.code!==0))}`);
      }
      observations.push(...await Promise.all(batch.map(({id,writer}) => call(mutation === 'claim' ? ['take','--id',id] : mutation === 'move' ? ['move',id,'--to','blocked','--expect','todo'] : ['return',id,'--to','blocked','--reason','benchmark'],writer))));
    }
    const successful = observations.filter(r => r.code === 0).map(r => r.ms);
    const row = { mutation, sessions: concurrency, n: observations.length, errors: observations.filter(r=>r.code!==0), p50: percentile(successful,.5), p95: percentile(successful,.95), p99: percentile(successful,.99), max: Math.max(...successful), peakDirectChildren:peak, observations };
    rows.push(row);
    fs.mkdirSync(path.dirname(out), {recursive:true}); fs.writeFileSync(out, JSON.stringify(result,null,2)+'\n');
    console.log(JSON.stringify({...row, observations:undefined}));
  }
  if (rows.some(r=>r.errors.length)) throw new Error('benchmark has failed mutations; inspect output');
  return result;
}
async function storeIncrementBenchmark({root,out,sessions,filesystem,checkout,strace}) {
  if (!strace) throw Error('--store-increment requires --strace for the zero-spawn verdict');
  if (JSON.stringify(sessions)!==JSON.stringify([1,10,15,20])) throw Error('store acceptance requires --sessions 1,10,15,20');
  execFileSync('strace',['-V'],{stdio:'pipe'}); // Missing tool is a hard failure.
  // Build/load the working-tree combined addon, never the activated payload.
  const {ensureGitAddon}=await import('../../test/helpers/git-addon.mjs');
  const built=ensureGitAddon();
  fs.mkdirSync(root);
  const stateRoot=path.join(root,'state');fs.mkdirSync(stateRoot,{mode:0o700});
  const result={contract:'v-spawn-store-increment.v1',filesystem,checkout,
    commit:execFileSync('git',['rev-parse','HEAD'],{cwd:checkout,encoding:'utf8'}).trim(),
    node:process.version,cpu:os.cpus()[0].model,rows:[],verdict:'FAIL'};
  const env={...process.env};for(const k of Object.keys(env))if(k.startsWith('GIT_'))delete env[k];
  for(const concurrency of sessions){
    const repo=path.join(root,`sessions-${concurrency}`);fs.mkdirSync(repo);
    const git=(...args)=>execFileSync('git',['-C',repo,...args],{env,stdio:'pipe'});
    git('init','-q');git('config','fgos.machineId','spawn-benchmark');
    fs.mkdirSync(path.join(repo,'.git/fgos/events/locks'),{recursive:true,mode:0o700});
    const hot=path.join(repo,'.fgos');fs.mkdirSync(hot);
    const fence=path.join(hot,'locks/activation.lock');fs.mkdirSync(fence,{recursive:true});
    fs.writeFileSync(path.join(fence,'TOMBSTONE'),JSON.stringify({lock:'activation',by:'fgos git',at:'benchmark'}));
    const barrier=path.join(repo,'barrier');fs.mkdirSync(barrier);
    const children=[];const pending=[];
    let failure;
    try {
      for(let i=0;i<concurrency;i++){
        const log=path.join(repo,`trace-${i}`);
        const count=Math.floor(200/concurrency)+(i<200%concurrency?1:0);
        const child=spawn('strace',['-f','-e','trace=process,write','-s','256','-o',log,
          process.execPath,path.join(checkout,'scripts/event-store/store-increment-worker.mjs'),
          repo,stateRoot,built.manifest,checkout,String(i),String(count),barrier,'yes'],{env});
        children.push(child);
        let stdout='',stderr='';child.stdout.on('data',b=>stdout+=b);child.stderr.on('data',b=>stderr+=b);
        const done=new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',code=>{
          if(code!==0)return reject(Error(`worker ${i}: ${code}: ${stderr}`));
          try{resolve({measurements:JSON.parse(stdout),log});}catch(e){reject(e);}
        });});
        done.catch(e=>{failure=e;});pending.push(done);
      }
      const readyDeadline=Date.now()+60000;
      while(!children.every((_,i)=>fs.existsSync(path.join(barrier,`${i}.ready`)))){
        if(failure)throw failure;
        if(Date.now()>readyDeadline)throw Error('workers did not reach ready barrier');
        await new Promise(r=>setTimeout(r,10));
      }
      const start=performance.now();fs.writeFileSync(path.join(barrier,'go'),'go');
      const timer=setTimeout(()=>{failure=Error('200 mutations exceeded 60 s');for(const c of children)c.kill('SIGKILL');},60000);
      let completed;try{completed=await Promise.all(pending);}finally{clearTimeout(timer);}
      const elapsedMs=performance.now()-start;
      const observations=completed.flatMap(c=>c.measurements.observations);
      let spawns=0,windows=0;
      for(const c of completed){
        const lines=fs.readFileSync(c.log,'utf8').split('\n');let inside=false;
        for(const line of lines){
          if(line.includes('ES_GATE_BEGIN:')){if(inside)throw Error('nested trace marker');inside=true;windows++;continue;}
          if(line.includes('ES_GATE_END:')){if(!inside)throw Error('unmatched trace end');inside=false;continue;}
          if(inside && /\b(?:clone|clone3|fork|vfork|execve|execveat)\(/.test(line))spawns++;
        }
        if(inside)throw Error('incomplete gate trace');
      }
      const increments=observations.map(o=>o.incrementUpperBoundMs), waits=observations.map(o=>o.waitMs);
      const row={sessions:concurrency,mutations:observations.length,elapsedMs,windows,spawns,
        incrementUpperBoundP95Ms:percentile(increments,.95),
        convoy:{waitP50Ms:percentile(waits,.5),waitP95Ms:percentile(waits,.95),waitMaxMs:Math.max(...waits),observations},
        verdict:observations.length===200&&windows===200&&spawns===0&&elapsedMs<=60000&&(concurrency!==20||percentile(increments,.95)<=50)?'PASS':'FAIL'};
      result.rows.push(row);console.log(JSON.stringify({...row,convoy:{...row.convoy,observations:undefined}}));
    } finally {for(const c of children)if(c.exitCode===null)c.kill('SIGKILL');}
  }
  result.verdict=result.rows.every(r=>r.verdict==='PASS')?'PASS':'FAIL';
  fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({contract:result.contract,verdict:result.verdict,out}));
  if(result.verdict!=='PASS')throw Error('store increment acceptance failed');
  return result;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2); const options = {};
  for(let i=0;i<args.length;i+=2) {
    if(args[i]==='--store-increment'||args[i]==='--strace'){options[args[i]==='--strace'?'strace':'storeIncrement']=true;i--;continue;}
    const key = {'--root':'root','--out':'out','--samples':'samples','--sessions':'sessions','--host-bin':'hostBin','--entry':'entry'}[args[i]];
    if (!key || args[i+1] === undefined) throw new Error(`unknown/missing argument ${args[i]}`);
    options[key] = key==='samples' ? Number(args[i+1]) : key==='sessions' ? args[i+1].split(',').map(Number) : args[i+1];
  }
  try { await benchmark(options); }
  catch(error) {
    console.log(JSON.stringify({contract:options.storeIncrement?'v-spawn-store-increment.v1':'v-spawn-benchmark.v1',verdict:'FAIL',error:error.message}));
    process.exitCode=1;
  }
}
