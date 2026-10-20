import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { lexSource } from '../helpers/js-source-lexer.mjs';

const dangerous = /(['"`])(?:update-ref|push|fetch)\1|refs\/fgos/;
const retiredReader = /['"](?:\.fgos\/)?events\.jsonl['"]|['"]\.fgos\/events(?:\/[^'"]*)?['"]|\bjoin\([^\n]*['"]events['"]|\b(?:readAllEventsFromDir|readEventsFromByte)\b/;
const primitive = /^(?:exec|execSync|execFile|execFileSync|spawn|spawnSync|fork|runBorrowed)$/;
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
    const start=m.index+m[0].lastIndexOf('('),end=closing(shape,start);
    result.push({name:m[2]?`${m[1]}::new`:m[1],args:code.slice(start+1,end),start:m.index,end,member:/\.\s*$/.test(shape.slice(Math.max(0,m.index-8),m.index))});
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
    declarations.push({name:m[1],value:code.slice(start,end),start:m.index});
  }
  const functions=[];
  for(const m of shape.matchAll(/\b(?:function\s+|fn\s+)([\w$]+)\s*\(/g)) {
    const start=m.index+m[0].lastIndexOf('('),end=closing(shape,start),body=shape.indexOf('{',end);
    if(body<0)continue;
    const stop=closing(shape,body);
    const params=code.slice(start+1,end).split(',').map(p=>p.trim().split(/\s*[:=]\s*/)[0].replace(/^&(?:mut\s+)?/,''));
    functions.push({name:m[1],params,body:code.slice(body+1,stop),start:body+1,stop,assignments:new Map()});
  }
  for(const m of shape.matchAll(/\b(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(/g)){
    const start=m.index+m[0].lastIndexOf('('),end=closing(shape,start);
    const tail=shape.slice(end+1);const arrow=/^\s*=>\s*/.exec(tail);if(!arrow)continue;
    const begin=end+1+arrow[0].length;
    const stop=shape[begin]==='{'?closing(shape,begin):shape.indexOf(';',begin);
    if(stop<0)continue;
    functions.push({name:m[1],params:code.slice(start+1,end).split(',').map(p=>p.trim()),body:code.slice(begin,stop),start:begin,stop,assignments:new Map()});
  }
  const scopeAt=position=>functions.filter(f=>f.start<=position&&f.stop>position).sort((a,b)=>(a.stop-a.start)-(b.stop-b.start))[0];
  for(const d of declarations)(scopeAt(d.start)?.assignments??assignments).set(d.name,d.value);
  const aliases=new Set();
  for(const m of code.matchAll(/\b(exec\w*|spawn\w*|fork|runBorrowed)\s+as\s+(\w+)/g))aliases.add(m[2]);
  for(const m of code.matchAll(/\b(exec\w*|spawn\w*|fork|runBorrowed)\s*:\s*(\w+)/g))aliases.add(m[2]);
  for(const [name,value]of assignments)if(/(?:\b(?:exec\w*|spawn\w*|fork|runBorrowed)\b)/.test(value))aliases.add(name);
  for(const f of functions)for(const [name,value]of f.assignments)if(/^(?:\s*\w+\.)?\s*(?:exec\w*|spawn\w*|fork|runBorrowed)\s*$/.test(value))aliases.add(name);
  for(const m of code.matchAll(/\bCommand\s+as\s+(\w+)/g))aliases.add(`${m[1]}::new`);
  const imports=new Map();
  for(const match of code.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g)){
    if(!match[2].startsWith('.'))continue;
    const target=path.posix.normalize(path.posix.join(path.posix.dirname(file),match[2]));
    for(const name of match[1].split(',')){const [original,local]=name.trim().split(/\s+as\s+/);imports.set(local??original,{file:target,name:original});}
  }
  return {file,code,assignments,functions,aliases,imports,scopeAt};
}
function argumentsOf(value) {
  const shape=lexSource(value).shape;const args=[];let start=0;
  for(let i=0;i<shape.length;i++) {
    if('([{'.includes(shape[i]))i=closing(shape,i);
    else if(shape[i]===','){args.push(value.slice(start,i));start=i+1;}
  }
  args.push(value.slice(start));return args;
}
export function invocationViolations(sources, {reader=false}={}) {
  const risk=reader?retiredReader:dangerous;
  const sink=reader?/^(?:read|read_to_string|readFile|readFileSync|open|openSync|readEvents|readAllEventsFromDir|readEventsFromByte)$/:primitive;
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
  const isPrimitive=(c,m)=>sink.test(c.name)||(!reader&&(m.aliases.has(c.name)||c.name==='Command::new'));
  let changed=true;
  while(changed){
    changed=false;
    for(const m of models)for(const f of m.functions)if(!sinkFunctions.has(key(f))&&f.calls.some(c=>isPrimitive(c,m)||(c.member?[]:resolve(m,c.name)).some(target=>sinkFunctions.has(key(target))))){sinkFunctions.add(key(f));changed=true;}
  }
  const violations=[];
  function tainted(value,m,bindings,seen=new Set(),scope=null) {
    if(risk.test(value))return true;
    for(const id of new Set(lexSource(value).shape.match(/\b[\w$]+\b/g)??[])) {
      if(seen.has(id))continue;
      if(bindings.has(id)){if(bindings.get(id))return true;continue;}
      if(scope?.params.includes(id))continue;
      const replacement=scope?.assignments.get(id)??m.assignments.get(id);
      if(replacement!==undefined&&tainted(replacement,m,bindings,seen.add(id),scope))return true;
    }
    return false;
  }
  function inspect(call,m,bindings,trail) {
    if(!isPrimitive(call,m)&&!(call.member?[]:resolve(m,call.name)).some(f=>sinkFunctions.has(key(f))))return false;
    const scope=m.scopeAt(call.start);
    const argsTainted=tainted(call.args,m,bindings,new Set(),scope);
    if(isPrimitive(call,m)&&argsTainted)return true;
    // Rust builders add argv after construction, sometimes in later statements.
    if(!reader&&(call.name==='Command::new'||m.aliases.has(call.name)&&call.name.endsWith('::new'))) {
      const end=m.code.indexOf('\n}',call.end);
      if(tainted(m.code.slice(call.end,end<0?undefined:end),m,bindings,new Set(),scope))return true;
    }
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
    if(m.file==='packages/git/rust/src/driver.rs')continue;
    for(const c of calls(m.code))if(inspect(c,m,new Map(),new Set())) {
      violations.push(`${m.file}:${m.code.slice(0,c.start).split('\n').length}: ${c.name}`);
    }
  }
  return [...new Set(violations)];
}

test('door scanner follows literal argv, local assignments, aliases and cross-file forwarding',()=>{
  const sources={
    'src/wrapper.mjs':"import {execFileSync as launch} from 'node:child_process'; export function run(args) { return launch('git', args); }",
    'src/caller.mjs':"import {run} from './wrapper.mjs'; const verb='update-ref'; const args=[verb,'refs/fgos/x']; run(args);",
    'packages/example.rs':'fn publish(args: &[&str]) { let mut cmd = Command::new("git"); cmd.args(args).status(); }\nfn caller() { publish(&["push", "origin"]); }',
    'src/alias.mjs':"const launch = cp.spawn; launch('git',['fetch']);",
    'src/arrow.mjs':"const wrap=(argv)=>cp.execFile('git',argv);wrap(['push']);",
    'src/borrowed.mjs':"const argv=['update-ref']; handle.runBorrowed('git',argv);",
    'packages/alias.rs':'use std::process::Command as Proc; fn caller() { Proc::new("git").args(["fetch"]); }',
    'src/safe.mjs':"import {execFileSync} from 'node:child_process'; execFileSync('git',['status']); // push refs/fgos",
  };
  const found=invocationViolations(sources);
  assert.ok(found.some(v=>v.startsWith('src/caller.mjs')));
  assert.ok(found.some(v=>v.startsWith('packages/example.rs')));
  for(const file of ['src/alias.mjs','src/arrow.mjs','src/borrowed.mjs','packages/alias.rs'])assert.ok(found.some(v=>v.startsWith(file)),file);
  assert.ok(!found.some(v=>v.startsWith('src/safe.mjs')));
  const readers=invocationViolations({'src/read.mjs':"function load(file){return fs.readFileSync(file);}const old=path.join(root,'events.jsonl');load(old);"},{reader:true});
  assert.ok(readers.some(v=>v.includes('load')));
  assert.ok(invocationViolations({'packages/after-test.rs':'#[cfg(test)] mod tests { fn sample() {} } fn live() { Command::new("git").args(["push"]); }'}).length>0);
  assert.deepEqual(invocationViolations({'packages/git/rust/src/driver.rs':'Command::new("git").args(["push"]);'}),[]);
});

test('only Git driver invokes publication commands and only owning stores read their event files',()=>{
  const files=execFileSync('rg',['--files','src','bin','scripts','packages','apps'],{encoding:'utf8'}).trim().split('\n')
    .filter(f=>/\.(?:mjs|js|rs)$/.test(f)&&!/(?:^|\/)(?:test|tests|examples)\//.test(f));
  const sources=Object.fromEntries(files.map(f=>[f,fs.readFileSync(f,'utf8')]));
  const violations=invocationViolations(sources);
  const readerSites=invocationViolations(sources,{reader:true});
  // Named ownership classes only: owning facade/crate, immutable migration
  // inventory, pure parsers and independent journals. No arbitrary bypasses.
  for(const [file,source] of Object.entries(sources)) {
    const code=model(file,source).code;
    const retired=readerSites.some(site=>site.startsWith(`${file}:`))||/import\s*\{[^}]*\b(?:readEvents|readEventsFromByte|readAllEventsFromDir)\b[^}]*\}\s*from/.test(code);
    if(!retired)continue;
    if(file.startsWith('src/event-store/')||file.startsWith('packages/event-store/')||file.startsWith('packages/git/node-addon/'))continue;
    if(/^(?:src\/state\/(?:events|event-log|main-checkout-guard-warnings)|src\/verbs\/events\/(?:migrate|export)|src\/workflow\/(?:store|case-admission-port)|scripts\/(?:backfill-unit-summaries|migration-proof-2a|regenerate-observe-fixtures))\.mjs$/.test(file))continue;
    if(file==='packages/observe/rust/src/friction.rs')continue;
    violations.push(`${file}: retired event reader`);
  }
  assert.deepEqual(violations,[]);
});
