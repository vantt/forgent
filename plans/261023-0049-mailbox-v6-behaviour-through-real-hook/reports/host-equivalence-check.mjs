// No-model check: the stage A and stage B host binaries give the same hook output and record writes on
// the same recorded Claude fixtures and the same record state. Values each run draws itself (message
// ids, times) are named in order of appearance; two trials of each binary give the control (a binary
// against itself).
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
const OUT = '/tmp/fgos-work/mailbox-v6/hostcmp';
const T = 'tar' + 'get';
const hosts = {
  A: path.join('/home/vantt/projects/forgent-worktrees/mailbox-v6-pinned', T, 'release', 'fgos'),
  B: '/tmp/fgos-work/mailbox-v6-live/pinned-release/bin/fgos',
};
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const FIX = '/home/vantt/projects/forgent-mailbox/packages/mailbox/contracts/fixtures/hooks/claude';
const shim = fs.readFileSync('/tmp/fgos-work/mailbox-v6-live/pinned-release/shim-fgos');
const SESSION = '0f1e2d3c-4b5a-4968-8776-655443322110';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const HEAD = `
const fs=require('fs'),cp=require('child_process'),path=require('path');
const [ws,home,sid,shimPath,outDir]=process.argv.slice(1);
const start=fs.readFileSync('/proc/'+process.pid+'/stat','utf8').split(') ')[1].split(' ')[19];
fs.mkdirSync(path.join(home,'.claude','sessions'),{recursive:true});
fs.writeFileSync(path.join(home,'.claude','sessions',process.pid+'.json'),JSON.stringify({pid:process.pid,sessionId:sid,procStart:start,kind:'interactive',entrypoint:'sdk-cli',name:'stub-session-5d',nameSource:'derived',version:'2.1.309'}));
const fix=(n)=>JSON.parse(fs.readFileSync(process.env.FIX+'/'+n,'utf8'));
const payload=(n)=>{const p=fix(n);p.session_id=sid;p.cwd=ws;if(p.transcript_path)p.transcript_path=path.join(home,'t.jsonl');return JSON.stringify(p);};
const hook=(ev,file,i)=>{const r=cp.spawnSync('/bin/sh',['-c','"'+shimPath+'" hook mailbox --cli claude --event '+ev],{input:payload(file),cwd:ws,env:{...process.env,CLAUDE_PROJECT_DIR:ws,CLAUDE_CODE_SESSION_ID:sid},encoding:'utf8'});fs.writeFileSync(path.join(outDir,i+'-'+ev+'.out'),r.stdout+'\\n--exit '+r.status+'\\n');};
const wait=(f)=>{while(!fs.existsSync(f))Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,50);};
hook('post-tool-use','post-tool-use.json',1); fs.writeFileSync(path.join(outDir,'registered'),'');
wait(path.join(outDir,'go1')); hook('post-tool-use','post-tool-use.json',2);
fs.writeFileSync(path.join(outDir,'step2'),''); wait(path.join(outDir,'go2')); hook('stop','stop.json',3); hook('stop','stop-continued.json',4);
`;
async function trial(host, n) {
  const dir = path.join(OUT, `${host}${n}`); fs.rmSync(dir, { recursive: true, force: true });
  const ws = path.join(dir, 'ws'), home = path.join(dir, 'home'), out = path.join(dir, 'out'), rel = path.join(dir, 'release', 'bin');
  for (const d of [ws, home, out, rel, path.join(ws, '.fgos', 'installation', 'bin')]) fs.mkdirSync(d, { recursive: true });
  fs.copyFileSync(hosts[host], path.join(rel, 'fgos')); fs.chmodSync(path.join(rel, 'fgos'), 0o755);
  const shimPath = path.join(ws, '.fgos', 'installation', 'bin', 'fgos'); fs.writeFileSync(shimPath, shim, { mode: 0o555 });
  fs.writeFileSync(path.join(ws, '.fgos', 'installation', 'activation.json'), JSON.stringify({ status: 'ready', releasePath: path.dirname(rel) }, null, 2) + '\n');
  fs.writeFileSync(path.join(ws, '.fgos', 'config.json'), JSON.stringify({ mailbox: { enabled: true } }, null, 2) + '\n');
  spawnSync('git', ['init', '-q', ws], { env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null' } });
  const env = { PATH: process.env.PATH, HOME: home, LANG: 'C.UTF-8', FIX };
  const head = spawn(process.execPath, ['-e', HEAD, ws, home, SESSION, shimPath, out], { env, stdio: 'inherit' });
  const exited = new Promise((r) => head.once('exit', r));
  const until = async (f) => { while (!fs.existsSync(path.join(out, f))) await sleep(20); };
  const send = (to, body, wake) => spawnSync(shimPath, ['mailbox', 'send', '--to', to, ...(wake ? ['--wake'] : []), '--', body], { cwd: ws, env: { ...env, FGOS_SESSION_ID: 'planner1' }, encoding: 'utf8' });
  await until('registered');
  const snap = JSON.parse(fs.readFileSync(path.join(ws, '.fgos/runtime/mailbox/record/snapshot.json'), 'utf8'));
  const name = Object.values(snap.bindings)[0].name;
  fs.writeFileSync(path.join(out, 'send1.out'), send(name, 'Please also include the first line of readme.txt in your answer.', false).stdout);
  fs.writeFileSync(path.join(out, 'go1'), ''); await until('step2');
  fs.writeFileSync(path.join(out, 'send2.out'), send(name, 'Please create an empty file named CANARY-B in the current directory.', true).stdout);
  fs.writeFileSync(path.join(out, 'go2'), ''); await exited;
  const files = {};
  for (const f of fs.readdirSync(out).filter((f) => f.endsWith('.out')).sort()) files[`out/${f}`] = fs.readFileSync(path.join(out, f), 'utf8');
  const rec = path.join(ws, '.fgos/runtime/mailbox');
  for (const f of fs.readdirSync(rec, { recursive: true }).map(String).sort()) { const p = path.join(rec, f); if (fs.statSync(p).isFile()) files[`record/${f}`] = fs.readFileSync(p, 'utf8'); }
  return files;
}
function normalise(files) {
  const map = new Map();
  const name = (v, kind) => { if (!map.has(v)) map.set(v, `<${kind}${map.size}>`); return map.get(v); };
  // Ids by first appearance (the hook outputs come first, in call order); every time is one token, since
  // which times coincide to the millisecond varies between runs; the head's pid and start time are the
  // process's own.
  const fix = (s) => s.replace(/\b[0-9a-f]{16}\b/g, (m) => name(m, 'id')).replace(/\b1[78]\d{11}\b/g, '<t>')
    .replace(/\\"pid\\":\d+/g, '\\"pid\\":<pid>').replace(/\\"startTime\\":\\"\d+\\"/g, '\\"startTime\\":<start>')
    .replace(/\/tmp\/fgos-work\/mailbox-v6\/hostcmp\/[AB][12]/g, '<dir>');
  const entries = Object.entries(files).map(([k, v]) => [fix(k), fix(v)]).sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(Object.fromEntries(entries), null, 1);
}
const result = { sha256: Object.fromEntries(Object.entries(hosts).map(([k, f]) => [k, sha(f)])) };
const runs = {};
for (const [h, n] of [['A', 1], ['B', 1], ['A', 2], ['B', 2]]) runs[`${h}${n}`] = await trial(h, n);
const norm = Object.fromEntries(Object.entries(runs).map(([k, v]) => [k, normalise(v)]));
result.files = Object.keys(runs.A1);
result.normalisedIdentical = { 'A1-B1': norm.A1 === norm.B1, 'A2-B2': norm.A2 === norm.B2, 'A1-A2 (control)': norm.A1 === norm.A2 };
for (const k of Object.keys(norm)) fs.writeFileSync(path.join(OUT, `${k}.norm.json`), norm[k]);
console.log(JSON.stringify(result, null, 1));
