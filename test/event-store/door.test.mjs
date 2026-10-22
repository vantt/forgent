import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import { scan } from '../../scripts/git-one-door-scan.mjs';
import { lexSource } from '../../scripts/lib/js-source-lexer.mjs';

const retiredReader = /['"](?:\.fgos\/)?events\.jsonl['"]|['"]\.fgos\/events(?:\/[^'"]*)?['"]|\bjoin\([^\n]*['"]events['"]|\b(?:readAllEventsFromDir|readEventsFromByte)\b/;
function closing(shape, start) {
  const ends={'(':')','[':']','{':'}'}; const stack=[ends[shape[start]]];
  for(let i=start+1;i<shape.length;i++) {
    if(ends[shape[i]])stack.push(ends[shape[i]]);
    else if(shape[i]===stack.at(-1))stack.pop();
    if(!stack.length)return i;
  }
  return shape.length;
}
function calls(code) {
  const shape=lexSource(code).shape;const result=[];
  for(const m of shape.matchAll(/\b([\w$]+)(?:\s*::\s*(new))?\s*\(/g)) {
    if(/\b(?:function|fn)\s*$/.test(shape.slice(Math.max(0,m.index-30),m.index)))continue;
    const start=m.index+m[0].lastIndexOf('('),end=closing(shape,start);
    result.push({name:m[2]?`${m[1]}::new`:m[1],args:code.slice(start+1,end),start:m.index,end,receiver:/(\w+)\.\s*$/.exec(shape.slice(Math.max(0,m.index-80),m.index))?.[1],member:/\.\s*$/.test(shape.slice(Math.max(0,m.index-8),m.index))});
  }
  return result;
}
// A bounded source data-flow walk: assignments, argument forwarding and
// wrappers (including imports across modules), rather than a same-line grep.
function model(file,source) {
  if(file.endsWith('.rs')) {
    // Remove test-only items, preserving offsets and production after them.
    const original=source;const shape=lexSource(source).shape;const pieces=source.split('');
    for(const match of original.matchAll(/#\[cfg\(([^\]]*)\)\]/g)){
      if(!/^(?:test$|all\(\s*test\b)/.test(match[1]))continue;
      const start=match.index+match[0].length,brace=shape.indexOf('{',start),semicolon=shape.indexOf(';',start);
      const stop=semicolon>=0&&(brace<0||semicolon<brace)?semicolon:brace>=0?closing(shape,brace):start;
      for(let i=match.index;i<=stop;i++)if(pieces[i]!=='\n')pieces[i]=' ';
    }
    source=pieces.join('');
  }
  let code=lexSource(source).code;
  const shape=lexSource(code).shape;
  const assignments=new Map();const declarations=[];
  for(const m of shape.matchAll(/\b(?:const|let|var)\s+(?:mut\s+)?([\w$]+)\s*(?::[^=;]+)?=/g)) {
    const start=m.index+m[0].length;
    let end=start;
    while(end<shape.length&&shape[end]!==';'&&shape[end]!=='\n'){
      if('([{'.includes(shape[end]))end=closing(shape,end);
      end++;
    }
    declarations.push({name:m[1],value:code.slice(start,end),start:m.index,end});
  }
  const functions=[];
  for(const m of shape.matchAll(/\b(?:function\s+|fn\s+)([\w$]+)\s*\(/g)) {
    const start=m.index+m[0].lastIndexOf('('),end=closing(shape,start),body=shape.indexOf('{',end);
    if(body<0)continue;
    const stop=closing(shape,body);
    const params=code.slice(start+1,end).split(',').map(p=>p.trim().split(/\s*[:=]\s*/)[0].replace(/^&(?:mut\s+)?/,'').replace(/^\.\.\./,''));
    functions.push({name:m[1],params,rest:code.slice(start+1,end).split(',').findIndex(p=>p.trim().startsWith('...')),body:code.slice(body+1,stop),start:body+1,stop,assignments:new Map()});
  }
  for(const m of shape.matchAll(/\b(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(/g)){
    const start=m.index+m[0].lastIndexOf('('),end=closing(shape,start);
    const tail=shape.slice(end+1);const arrow=/^\s*=>\s*/.exec(tail);if(!arrow)continue;
    const begin=end+1+arrow[0].length;
    const stop=shape[begin]==='{'?closing(shape,begin):shape.indexOf(';',begin);
    if(stop<0)continue;
    functions.push({name:m[1],params:code.slice(start+1,end).split(',').map(p=>p.trim().replace(/^\.\.\./,'')),rest:code.slice(start+1,end).split(',').findIndex(p=>p.trim().startsWith('...')),body:code.slice(begin,stop),start:begin,stop,assignments:new Map()});
  }
  const scopeAt=position=>functions.filter(f=>f.start<=position&&f.stop>position).sort((a,b)=>(a.stop-a.start)-(b.stop-b.start))[0];
  for(const d of declarations)(scopeAt(d.start)?.assignments??assignments).set(d.name,d.value);
  const imports=new Map();
  for(const match of code.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g)){
    if(!match[2].startsWith('.'))continue;
    const target=path.posix.normalize(path.posix.join(path.posix.dirname(file),match[2]));
    for(const name of match[1].split(',')){const [original,local]=name.trim().split(/\s+as\s+/);imports.set(local??original,{file:target,name:original});}
  }
  // Block ranges keep repeated fixture-local names from leaking between rows.
  const stack=[], blocks=[];
  for(let i=0;i<shape.length;i++){
    if(shape[i]==='{')stack.push(i);
    else if(shape[i]==='}'&&stack.length)blocks.push({start:stack.pop(),stop:i});
  }
  for(const d of declarations)d.block=blocks.filter(b=>b.start<d.start&&b.stop>d.start).sort((a,b)=>(a.stop-a.start)-(b.stop-b.start))[0];
  return {file,code,shape,assignments,declarations,functions,imports,scopeAt};
}
function argumentsOf(value) {
  const shape=lexSource(value).shape;const args=[];let start=0;
  for(let i=0;i<shape.length;i++) {
    if('([{'.includes(shape[i]))i=closing(shape,i);
    else if(shape[i]===','){args.push(value.slice(start,i));start=i+1;}
  }
  args.push(value.slice(start));return args;
}
// Retired event-log readers only. Git spawns are owned by scripts/git-one-door-scan.mjs.
export function readerViolations(sources) {
  const risk=retiredReader;
  const sink=/^(?:read|read_to_string|readFile|readFileSync|open|openSync|readEvents|readAllEventsFromDir|readEventsFromByte)$/;
  const models=Object.entries(sources).map(([file,source])=>model(file,source));
  const byFile=new Map(models.map(m=>[m.file,m]));
  for(const m of models)for(const f of m.functions){f.model=m;f.calls=calls(f.body).map(c=>({...c,start:c.start+f.start,end:c.end+f.start}));}
  function resolve(m,name){
    const imported=m.imports.get(name);
    const owner=imported?byFile.get(imported.file):m;
    return owner?.functions.filter(f=>f.name===(imported?.name??name))??[];
  }
  const sinkFunctions=new Set();
  const key=f=>`${f.model.file}:${f.name}`;
  const isPrimitive=c=>sink.test(c.name);
  let changed=true;
  while(changed){
    changed=false;
    for(const m of models)for(const f of m.functions)if(!sinkFunctions.has(key(f))&&f.calls.some(c=>isPrimitive(c)||(c.member?[]:resolve(m,c.name)).some(target=>sinkFunctions.has(key(target))))){sinkFunctions.add(key(f));changed=true;}
  }
  const violations=[];
  const identifiers=new Map();
  function tainted(value,m,bindings,seen=new Set(),scope=null) {
    if(risk.test(value))return true;
    if(!identifiers.has(value))identifiers.set(value,[...new Set(lexSource(value).shape.match(/\b[\w$]+\b/g)??[])]);
    for(const id of identifiers.get(value)) {
      if(seen.has(id))continue;
      if(bindings.has(id)){if(bindings.get(id))return true;continue;}
      if(scope?.params.includes(id))continue;
      const replacement=scope?.assignments.get(id)??m.assignments.get(id);
      if(replacement!==undefined&&tainted(replacement,m,bindings,seen.add(id),scope))return true;
    }
    return false;
  }
  function inspect(call,m,bindings,trail) {
    if(!isPrimitive(call)&&!(call.member?[]:resolve(m,call.name)).some(f=>sinkFunctions.has(key(f))))return false;
    const scope=m.scopeAt(call.start);
    const argsTainted=tainted(call.args,m,bindings,new Set(),scope);
    if(isPrimitive(call)&&argsTainted)return true;
    if(!argsTainted)return false;
    for(const f of (call.member?[]:resolve(m,call.name))) {
      if(trail.has(key(f)))continue;
      const actual=argumentsOf(call.args);const next=new Map(bindings);
      f.params.forEach((p,i)=>next.set(p,tainted(actual[i]??'',m,bindings,new Set(),scope)));
      if(f.calls.some(c=>inspect(c,f.model,next,new Set([...trail,key(f)]))))return true;
    }
    return false;
  }
  for(const m of models) {
    for(const c of calls(m.code))if(inspect(c,m,new Map(),new Set())) {
      violations.push(`${m.file}:${m.code.slice(0,c.start).split('\n').length}: ${c.name}`);
    }
  }
  return [...new Set(violations)];
}



test('the reader scan follows a retired event path through a helper to a file read',()=>{
  const readers=readerViolations({'src/read.mjs':"function load(file){return fs.readFileSync(file);}const old=path.join(root,'events.jsonl');load(old);"});
  assert.ok(readers.some(v=>v.includes('load')));
});

// Git spawns, launcher shapes and the zero-site census belong to scripts/git-one-door-scan.mjs, owned
// by test/git/one-door.test.mjs. These two tests only pin what is event-specific: the scan's verdict on
// event-publication argv and on the event-store-owned code.
const EVENT_OWNED = ['src/event-store/', 'packages/event-store/'];

// Each tree is one event-publication argv hidden behind a launcher or computed value.
const PUBLICATION_SHAPES = {
  'src/shell-option.mjs': "import {spawnSync} from 'node:child_process';\nspawnSync('git push origin refs/fgos/events/x',{shell:true});",
  'src/sh-c.mjs': "import {execFileSync} from 'node:child_process';\nexecFileSync('sh',['-c','git push origin refs/fgos/events/x']);",
  'src/absolute-git.mjs': "import {execFileSync} from 'node:child_process';\nexecFileSync('/usr/bin/git',['push','origin','refs/fgos/events/x']);",
  'src/env-launcher.mjs': "import {execFileSync} from 'node:child_process';\nexecFileSync('/usr/bin/env',['git','push','origin','refs/fgos/events/x']);",
  'src/xargs-launcher.mjs': "import {spawnSync} from 'node:child_process';\nspawnSync('xargs',['git','fetch','origin','refs/fgos/events/x']);",
  'src/rest-args.mjs': "import {execFileSync} from 'node:child_process';\nfunction rest(...args){execFileSync('git',args);}\nrest('push','origin','refs/fgos/events/x');",
  'src/computed-argv.mjs': "import {execFileSync} from 'node:child_process';\nfunction forward(args){return execFileSync('git',args);}\nforward(computed());",
  'src/concatenated-ref.mjs': "import {execFileSync} from 'node:child_process';\nconst ref='refs/'+'fgos/events/x';execFileSync('git',['update-ref',ref,'new','old']);",
  'src/event-file-commit.mjs': "import {execFileSync} from 'node:child_process';\nexecFileSync('git',['commit','--','.fgos/events.jsonl']);",
  'src/shell-alias.mjs': "import {execSync as shell} from 'node:child_process';\nshell('git fetch origin refs/fgos/events/x');",
  'src/borrowed-commit.mjs': "import {runBorrowed} from './holder-lock/index.mjs';\nrunBorrowed(handle,{command:'git',args:['commit','--','.fgos/events.jsonl']});",
  'src/deep-chain.mjs': "import {execFileSync} from 'node:child_process';\n"+Array.from({length:40},(_,i)=>`function f${i}(args){return ${i===39?"execFileSync('git',args)":`f${i+1}(args)`};}`).join('')+"f0(computed());",
  'packages/absolute/rust/src/lib.rs': 'use std::process::Command;\nfn publish() { Command::new("/usr/bin/git").args(["push","origin","refs/fgos/events/x"]).status(); }\n',
  'packages/env/rust/src/lib.rs': 'use std::process::Command;\nfn publish() { Command::new("env").args(["git","fetch","origin","refs/fgos/events/x"]).status(); }\n',
  'packages/after-test/rust/src/lib.rs': 'use std::process::Command;\n#[cfg(test)] mod tests { fn sample() {} }\nfn live() { Command::new("git").args(["push"]).status(); }\n',
};

test('the shared scan reports event-publication argv behind launchers, computed values and cfg(test) neighbours',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'fgos-event-door-'));
  try {
    for(const [file,source] of Object.entries(PUBLICATION_SHAPES)){
      fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});
      fs.writeFileSync(path.join(root,file),source);
    }
    const {sites}=scan({root});
    for(const file of Object.keys(PUBLICATION_SHAPES))assert.ok(sites.some(s=>s.path===file),`${file} not reported (got ${JSON.stringify(sites.map(s=>s.path))})`);
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
});

test('event-store product code has no Git spawn site and no classified spawn: its Git work goes through the typed ports',()=>{
  const {sites,classes}=scan({root:process.cwd()});
  const owned=entry=>EVENT_OWNED.some(prefix=>entry.path.startsWith(prefix));
  assert.deepEqual(sites.filter(owned),[],'event-store code spawns git');
  // Rust integration tests build fixture repositories with git; only product code is judged. A wrapper
  // no product code calls (`decodeLegacyFiles`, `branchKey`: only tests pass them loader options) is
  // reported by the scan so a later caller is noticed, but no spawn reaches it: that caller would
  // turn it into a site or a configured binary, which the two assertions here do judge.
  assert.deepEqual(classes.filter(c=>owned(c)&&!['rust-test','uncalled-wrapper'].includes(c.class)),[],'event-store code carries a classified git spawn');
});

// Shrink-only dormant debt: identities are file + call kind + target family,
// with a count for distinct sites. No source hashes or source coordinates.
export function stableFindings(sites, family) {
  const counts = {};
  for (const site of sites) {
    const key = `${site.replace(/:\d+: /, ': ')}: ${family}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}
export function readerFindings(sources) {
  const owned = file => file.startsWith('src/event-store/') || file.startsWith('packages/event-store/') || file.startsWith('packages/git/node-addon/');
  const sites = readerViolations(sources).filter(site => !owned(site.split(':')[0]));
  for (const [file, source] of Object.entries(sources)) {
    if (owned(file)) continue;
    const code = model(file, source).code;
    for (const match of code.matchAll(/import\s*\{([^}]*)\}\s*from/g)) {
      for (const name of ['readEvents', 'readEventsFromByte', 'readAllEventsFromDir']) {
        if (new RegExp(`\\b${name}\\b`).test(match[1])) sites.push(`${file}:0: import ${name}`);
      }
    }
  }
  return stableFindings(sites, 'retired-event');
}
const dormantReaderFindings = {
  "bin/fgos.mjs: repairTruncatedLastLine: retired-event": 1,
  "scripts/backfill-unit-summaries.mjs: readFileSync: retired-event": 1,
  "scripts/measure-verify-cost.mjs: import readEvents: retired-event": 1,
  "scripts/measure-verify-cost.mjs: readEvents: retired-event": 1,
  "scripts/measure-verify-cost.mjs: readFileSync: retired-event": 1,
  "scripts/migration-proof-2a.mjs: readFileSync: retired-event": 1,
  "scripts/probe-storytelling-material.mjs: import readEvents: retired-event": 1,
  "scripts/probe-storytelling-material.mjs: readEvents: retired-event": 1,
  "src/runner/attestation-guard.mjs: import readEvents: retired-event": 1,
  "src/runner/attestation-guard.mjs: readEvents: retired-event": 1,
  "src/setup/registrations.mjs: readEventsJsonLines: retired-event": 2,
  "src/setup/registrations.mjs: readFileSync: retired-event": 1,
  "src/state/events-compaction.mjs: import readEvents: retired-event": 1,
  "src/state/events-compaction.mjs: readEvents: retired-event": 1,
  "src/state/events-jsonl-truncation-guard.mjs: advanceEventsJsonlTruncationGuard: retired-event": 1,
  "src/state/events.mjs: import readEvents: retired-event": 1,
  "src/state/events.mjs: import readEventsFromByte: retired-event": 1,
  "src/state/porting-store.mjs: import readEvents: retired-event": 1,
  "src/state/replay.mjs: import readEvents: retired-event": 1,
  "src/state/replay.mjs: import readEventsFromByte: retired-event": 1,
  "src/verbs/events/migrate.mjs: import readAllEventsFromDir: retired-event": 1
};

test('dormant reader census retains declared sites and rejects additions or stale debt',()=>{
  const files=execFileSync('rg',['--files','src','bin','scripts','packages','apps'],{encoding:'utf8'}).trim().split('\n')
    .filter(f=>/\.(?:mjs|js|rs)$/.test(f)&&!/(?:^|\/)(?:test|tests|examples)\//.test(f));
  const sources=Object.fromEntries(files.map(f=>[f,fs.readFileSync(f,'utf8')]));
  assert.deepEqual(readerFindings(sources),dormantReaderFindings,
    'reader debt is site-specific, including legacy owner files');
});

test('dormant identity ignores unrelated edits but detects a new reader inside a legacy owner',()=>{
  const file='src/state/event-log.mjs';
  const source="fs.readFileSync('.fgos/events.jsonl');";
  assert.deepEqual(readerFindings({[file]:source}),readerFindings({[file]:`// unrelated edit\nconst other = 1;\n${source}`}));
  assert.notDeepEqual(readerFindings({[file]:source}),readerFindings({[file]:`${source}\nfs.readFileSync('.fgos/events.jsonl');`}));
});
