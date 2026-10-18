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
export async function benchmark({ root, out, samples = 40, sessions = [1, 10, 20], hostBin, entry = 'host' } = {}) {
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
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2); const options = {};
  for(let i=0;i<args.length;i+=2) {
    const key = {'--root':'root','--out':'out','--samples':'samples','--sessions':'sessions','--host-bin':'hostBin','--entry':'entry'}[args[i]];
    if (!key || args[i+1] === undefined) throw new Error(`unknown/missing argument ${args[i]}`);
    options[key] = key==='samples' ? Number(args[i+1]) : key==='sessions' ? args[i+1].split(',').map(Number) : args[i+1];
  }
  await benchmark(options);
}
