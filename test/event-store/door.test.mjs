import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lexSource } from '../helpers/js-source-lexer.mjs';

const dangerous = /(['"`])(?:update-ref|push|fetch|commit)\1|refs\/fgos/;
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
  const aliases=new Set();
  for(const m of code.matchAll(/\b(exec\w*|spawn\w*|fork|runBorrowed)\s+as\s+(\w+)/g))aliases.add(m[2]);
  for(const m of code.matchAll(/\b(exec\w*|spawn\w*|fork|runBorrowed)\s*:\s*(\w+)/g))aliases.add(m[2]);
  for(const [name,value]of assignments)if(/^(?:\s*\w+\.)?\s*(?:exec\w*|spawn\w*|fork|runBorrowed)\s*$/.test(value))aliases.add(name);
  for(const f of functions)for(const [name,value]of f.assignments)if(/^(?:\s*\w+\.)?\s*(?:exec\w*|spawn\w*|fork|runBorrowed)\s*$/.test(value))aliases.add(name);
  for(const m of code.matchAll(/\bCommand\s+as\s+(\w+)/g))aliases.add(`${m[1]}::new`);
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
  return {file,code,shape,assignments,declarations,functions,aliases,imports,scopeAt};
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
  if(!reader)return publicationCensus(sources).violations;
  const risk=retiredReader;
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


// Abstract argv values retain literal prefixes/suffixes and mark unresolved
// pieces with UNKNOWN. Resolution is memoised per scope/binding context; cycles
// and a finite node budget become unknown (and fail closed), never sliced text.
const UNKNOWN='\u0000';
export function publicationCensus(sources) {
  const models=Object.entries(sources).map(([file,source])=>model(file,source));
  const byFile=new Map(models.map(m=>[m.file,m]));
  const allCalls=new Map(models.map(m=>[m,calls(m.code)]));
  const targets=(m,name)=>{
    const imported=m.imports.get(name),owner=imported?byFile.get(imported.file):m;
    return (owner?.functions.filter(f=>f.name===(imported?.name??name))??[]).map(f=>({m:owner,f}));
  };
  const functionCalls=new Map(models.flatMap(m=>m.functions.map(f=>[f,calls(f.body).filter(c=>m.scopeAt(f.start+c.start)===f)])));
  const sinks=new Set();
  const primitiveCall=(m,c)=>m.aliases.has(c.name)||c.name==='Command::new'||(primitive.test(c.name)&&!m.functions.some(f=>f.name===c.name)&&(!c.member||c.name==='runBorrowed'||/^(?:cp|childProcess|child_process)$/.test(c.receiver??'')));
  const forwards=(f,c)=>f.params.filter(Boolean).some(p=>new RegExp(`\\b${p.replace(/[^\w$]/g,'')}\\b`).test(c.args));
  let changed=true;
  while(changed){changed=false;for(const m of models)for(const f of m.functions){
    if(sinks.has(f))continue;
    if(functionCalls.get(f).some(c=>forwards(f,c)&&(primitiveCall(m,c)||(!c.member&&targets(m,c.name).some(t=>sinks.has(t.f)))))){sinks.add(f);changed=true;}
  }}
  const incomingCalls=new Map();
  for(const m of models)for(const c of allCalls.get(m))if(!c.member)for(const {f}of targets(m,c.name)){if(!incomingCalls.has(f))incomingCalls.set(f,[]);incomingCalls.get(f).push({m,c});}
  const resolving=new Set();
  function context(m,position,bindings=new Map(),budget={remaining:10000,depth:0}) {return {m,position,bindings,budget,memo:new Map(),active:new Set()};}
  function value(expression,ctx) {
    const e=expression.trim();
    if(ctx.memo.has(e))return ctx.memo.get(e);
    if(ctx.active.has(e)||ctx.budget.depth>=128||--ctx.budget.remaining<0)return UNKNOWN;
    ctx.active.add(e);ctx.budget.depth++;
    try {
      const out=evaluate(e,ctx);ctx.memo.set(e,out);return out;
    } finally {ctx.active.delete(e);ctx.budget.depth--;}
  }
  function evaluate(e,ctx) {
    const {m,position,bindings}=ctx;
    if(!e)return UNKNOWN;
    if(e.startsWith('&'))return value(e.slice(1),ctx);
    if(e.startsWith('vec!'))return value(e.slice(4),ctx);
    if(e[0]==='['&&closing(lexSource(e).shape,0)===e.length-1)return argumentsOf(e.slice(1,-1)).flatMap(a=>{const spread=a.trim().startsWith('...');const v=value(spread?a.trim().slice(3):a,ctx);return spread&&Array.isArray(v)?v:[scalar(v)];});
    if((e[0]==="'"||e[0]==='"')&&e.at(-1)===e[0]&&!lexSource(e).shape.slice(1,-1).trim())return e.slice(1,-1);
    if(e[0]==='`'&&e.at(-1)==='`')return e.slice(1,-1).replace(/\$\{([^{}]*)\}/g,(_,part)=>scalar(value(part,ctx)));
    if(/^\w+$/.test(e)){
      if(bindings.has(e))return bindings.get(e);
      const d=m.declarations.filter(d=>d.name===e&&d.start<position&&(!d.block||(d.block.start<position&&d.block.stop>position))).at(-1);
      if(d){
        let result=value(d.value,ctx);
        const after=m.shape.slice(d.end,position);
        // A changed argv/ref invalidates an earlier namespace proof. Inspect
        // all mutation arguments rather than trusting the initial literal.
        for(const change of after.matchAll(new RegExp(`\\b${e}\\s*(?:=(?!=|>)|\\.\\s*(push|unshift|splice)\\s*\\()`, 'g'))){
          const begin=d.end+change.index+change[0].length;
          let end=begin;
          if(change[1])end=closing(m.shape,begin-1);
          else while(end<position&&!';\n'.includes(m.shape[end])){if('([{'.includes(m.shape[end]))end=closing(m.shape,end);end++;}
          const changed=m.code.slice(begin,end);
          const values=argumentsOf(changed).map(a=>value(a,ctx));
          if(change[1]&&Array.isArray(result))result=[...result,...values.map(scalar)];
          else result=values.some(v=>scalar(v).includes('refs/fgos/'))?'refs/fgos/'+UNKNOWN:UNKNOWN;
        }
        return result;
      }
      const scope=m.scopeAt(position),index=scope?.params.indexOf(e)??-1;
      if(index>=0){
        const key=`${m.file}:${scope.start}:${e}`;
        if(resolving.has(key))return UNKNOWN;
        resolving.add(key);
        const values=(incomingCalls.get(scope)??[]).map(({m:caller,c})=>(scope.rest===index?argumentsOf(c.args).slice(index).map(a=>value(a,context(caller,c.start,new Map(),ctx.budget))):value(argumentsOf(c.args)[index]??'',context(caller,c.start,new Map(),ctx.budget))));
        resolving.delete(key);
        if(values.length===1)return values[0];
        if(values.length&&values.every(v=>JSON.stringify(v)===JSON.stringify(values[0])))return values[0];
      }
      return UNKNOWN;
    }
    const shape=lexSource(e).shape;
    // Concatenation preserves the namespace proof, unlike arbitrary calls.
    const parts=[];let start=0;
    for(let i=0;i<shape.length;i++)if('([{'.includes(shape[i]))i=closing(shape,i);else if(shape[i]==='+'){parts.push(e.slice(start,i));start=i+1;}
    if(parts.length){parts.push(e.slice(start));return parts.map(p=>scalar(value(p,ctx))).join('');}
    if(/\.writeCommit\s*\(/.test(shape))return 'OID';
    const invocation=/^(\w+)\s*\(/.exec(shape);
    if(invocation){
      const call=targets(m,invocation[1]);
      if(call.length===1){
        const {m:owner,f}=call[0];const ret=/\breturn\s+([^;]+);/.exec(f.body);
        if(ret){const actual=argumentsOf(e.slice(e.indexOf('(')+1,closing(shape,e.indexOf('('))));const next=new Map();f.params.forEach((p,i)=>next.set(p,f.rest===i?actual.slice(i).map(a=>value(a,ctx)):value(actual[i]??'',ctx)));const key=`${owner.file}:${f.start}:return`;
          if(resolving.has(key))return UNKNOWN;
          resolving.add(key);
          const result=value(ret[1],context(owner,f.start+ret.index,next,ctx.budget));
          resolving.delete(key);return result;}
      }
    }
    // Unknown expressions still expose literal event paths/refs to the gate.
    if(/refs\/fgos\//.test(e))return 'refs/fgos/'+UNKNOWN;
    if(/events(?:\.jsonl|\/)/.test(e))return '.fgos/events/'+UNKNOWN;
    return UNKNOWN;
  }
  const scalar=v=>Array.isArray(v)?UNKNOWN:v;
  const violations=[],exemptions=[],bounded=[];
  const sensitive=new Set(['update-ref','push','fetch','commit']);
  const gitSink=binary=>/(?:^|[\\/])git(?:\.exe)?$/.test(binary);
  const shellSink=binary=>/(?:^|[\\/])(?:sh|bash|dash|zsh|ksh|env|xargs|sudo|nice|timeout|nohup|cmd(?:\.exe)?|powershell(?:\.exe)?)$/.test(binary);
  function check(argv,site,m,raw,ctx) {
    if(!Array.isArray(argv)){
      if(!scalar(argv).includes(UNKNOWN)&&!dangerous.test(raw)&&!scalar(argv).includes('refs/fgos/'))return;
      argv=scalar(argv).split(/\s+/);
    }
    const verbIndex=argv.findIndex(a=>sensitive.has(a));
    let command;
    for(let i=0;i<argv.length;i++){
      if(gitSink(argv[i]))continue;
      if(['-C','-c','--git-dir','--work-tree','--namespace'].includes(argv[i])){i++;continue;}
      if(argv[i].startsWith('-'))continue;
      command=argv[i];break;
    }

    const eventRef=argv.some(a=>a.includes('refs/fgos/'));
    if(verbIndex>=0&&argv[verbIndex]!=='commit'&&e3Fixture(m,raw,ctx)){
      exemptions.push({site,class:'E3 legacy baseline on fixture repos'});return;
    }
    if(m.file==='packages/git/rust/src/driver.rs'&&(verbIndex<0||argv[verbIndex]!=='commit'))return;
    if(verbIndex<0){if(eventRef||command?.includes(UNKNOWN))violations.push(site);return;}
    const verb=argv[verbIndex],tail=argv.slice(verbIndex+1);
    if(verb==='commit'){
      if(argv.some(a=>/(?:\.fgos\/)?events(?:\.jsonl|\/|$)/.test(a)))violations.push(site);
      return;
    }
    const operands=tail.filter(a=>!a.startsWith('-'));
    const refs=verb==='update-ref'?operands.slice(0,1):operands.slice(1);
    const safe=refs.length>0&&refs.every(ref=>{
      if(ref.includes('refs/fgos/'))return false;
      // Literal short refs and fixed non-event namespaces. An unbounded
      // parameter or a command relying on configured refspecs is not proof.
      return (!ref.includes(UNKNOWN)&&!/[*?\[]/.test(ref))||/^(?:\+?(?:refs\/(?:heads|tags|seed)\/|fgw\/)|OID:refs\/(?:heads|tags|seed)\/)/.test(ref);
    });
    if(safe&&!eventRef){bounded.push(site);return;}
    violations.push(site);
  }
  function e3Fixture(m,raw,ctx){
    if(m.file!=='scripts/git/e3-bench.mjs')return false;
    const args=argumentsOf(raw);
    // The only exempt baseline targets must be newly initialised bareRepo
    // children of the run's fresh root; no cwd/ambient repository fallback.
    const expression=args.find(a=>a.includes('--git-dir'))??raw;
    const repo=/['"]--git-dir['"]\s*,\s*(\w+)/.exec(expression)?.[1];
    if(!repo)return false;
    const d=m.declarations.filter(d=>d.name===repo&&d.start<ctx.position&&(!d.block||(d.block.start<ctx.position&&d.block.stop>ctx.position))).at(-1);
    if(!d||!/^\s*bareRepo\(path\.join\(root,\s*['"][\w-]+\.git['"]\)\)/.test(d.value))return false;
    const run=m.functions.find(f=>['run','census'].includes(f.name)&&f.start<ctx.position&&f.stop>ctx.position);
    const bare=m.functions.find(f=>f.name==='bareRepo');
    if(new RegExp(`\\b${repo}\\s*=(?!=|>)`).test(m.shape.slice(d.end,ctx.position)))return false;
    const preparesSamePath=/return\s+prepareRepo\(fs\.realpathSync\(dir\),\s*fs\.realpathSync\(dir\)\)/.test(bare?.body??'')
      &&/return\s+trustedMain\s*;/.test(m.functions.find(f=>f.name==='prepareRepo')?.body??'');
    if(!/return\s+dir\s*;/.test(bare?.body??'')&&!preparesSamePath)return false;
    return !!run&&run.start<ctx.position&&run.stop>ctx.position
      &&(/if\s*\(fs\.existsSync\(root\)\)\s*throw/.test(m.code.slice(run.start,d.start))||/const root = fs\.mkdtempSync\(path\.join\(args\.state, 'e3-census-'\)\)/.test(run.body))
      &&/git\(\['init',\s*'-q',\s*'--bare',\s*dir\]\)/.test(bare?.body??'');
  }
  function inspect(m,c,bindings,trail,origin=null){
    if(trail.size>32){violations.push(origin??`${m.file}:${m.code.slice(0,c.start).split('\n').length}: ${c.name}`);return;}
    const physical=`${m.file}:${m.code.slice(0,c.start).split('\n').length}: ${c.name}`;
    const site=origin??physical;
    const ctx=context(m,c.start,bindings);
    if(primitiveCall(m,c)){
      const args=argumentsOf(c.args);
      if(c.name==='runBorrowed'&&args[1]?.trim().startsWith('{')){
        const object=args[1],shape=lexSource(object).shape;
        const property=name=>{
          const match=new RegExp(`\\b${name}\\s*:`).exec(shape);if(!match)return '';
          const begin=match.index+match[0].length;let end=begin;
          while(end<shape.length&&shape[end]!==','&&shape[end]!=='}'){if('([{'.includes(shape[end]))end=closing(shape,end);end++;}
          return object.slice(begin,end);
        };
        if(gitSink(scalar(value(property('command'),ctx))))check(value(property('args'),ctx),site,m,property('args'),ctx);
        return;
      }
      const binary=scalar(value(args[0]??'',ctx));
      if(c.name.endsWith('::new')){
        if(!gitSink(binary)&&!shellSink(binary)&&!(binary===UNKNOWN&&dangerous.test(c.args)))return;
        const scope=m.scopeAt(c.start);const stop=scope?.stop??m.code.length;
        const builder=m.code.slice(c.end+1,stop);
        const argv=[];
        for(const b of calls(builder))if(['arg','args'].includes(b.name))for(const a of argumentsOf(b.args)){const v=value(a,ctx);argv.push(...(Array.isArray(v)?v:[v]));}
        check(shellSink(binary)?argv.join(' '):argv,site,m,c.args+builder,ctx);return;
      }
      // Shell strings and borrowed argv use the same abstract ref proof.
      if((['exec','execSync'].includes(c.name)||new RegExp(`\\b(?:exec|execSync)\\s+(?:as|:)\\s+${c.name}\\b`).test(m.code))&&/(?:^|[\s/])git(?:\s|$)|refs\/fgos\//.test(binary))check(binary,site,m,c.args,ctx);
      else if(gitSink(binary)||(binary===UNKNOWN&&dangerous.test(c.args)))check(value(args[1]??'',ctx),e3Fixture(m,c.args,ctx)?physical:site,m,c.args,ctx);
      else if(shellSink(binary)||/\bshell\s*:\s*true/.test(c.args)) {
        const argv=value(args[1]??'',ctx);
        if(!/(?:^|[\s/])git(?:\s|$)|refs\/fgos\//.test([binary,...(Array.isArray(argv)?argv:[argv])].join(' ')))return;
        check([binary,...(Array.isArray(argv)?argv:[argv])].join(' '),site,m,c.args,ctx);
      }
      return;
    }
    if(c.member)return;
    if(targets(m,c.name).some(({f})=>functionCalls.get(f).some(inner=>primitive.test(inner.name)))&&e3Fixture(m,c.args,ctx)&&dangerous.test(JSON.stringify(value(argumentsOf(c.args)[0]??'',ctx)))){
      exemptions.push({site:physical,class:'E3 legacy baseline on fixture repos'});return;
    }
    for(const {m:owner,f}of targets(m,c.name)){
      if(!sinks.has(f)||trail.has(f))continue;
      const actual=argumentsOf(c.args),next=new Map();
      f.params.forEach((p,i)=>next.set(p,f.rest===i?actual.slice(i).map(a=>value(a,ctx)):value(actual[i]??'',ctx)));
      for(const inner of functionCalls.get(f))inspect(owner,{...inner,start:inner.start+f.start,end:inner.end+f.start},next,new Set([...trail,f]),site);
    }
  }
  for(const m of models){
    // This exception applies to publication only; event-file commits never
    // inherit the driver's ownership exemption.
    for(const c of allCalls.get(m)){
      if(!primitiveCall(m,c)&&!targets(m,c.name).some(t=>sinks.has(t.f)))continue;
      const owner=m.scopeAt(c.start);
      // Parameters are checked at every call site with that call's bindings,
      // rather than collapsing different safe invocations into UNKNOWN.
      if(owner&&sinks.has(owner)&&(incomingCalls.get(owner)?.length??0)>0)continue;
      inspect(m,c,new Map(),new Set());
    }
  }
  return {violations:[...new Set(violations)],exemptions:[...new Map(exemptions.map(e=>[e.site,e])).values()],bounded:[...new Set(bounded)]};
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


test('event ref scope is fail closed while proven branch/tag refs remain Git phase 07 work',()=>{
  for(const verb of ['push','fetch','update-ref']){
    const argv=verb==='update-ref'?`['${verb}',ref,'new','old']`:`['${verb}','origin',ref]`;
    assert.ok(invocationViolations({'src/unknown.mjs':`execFileSync('git',${argv});`}).length,verb);
    for(const prefix of ['refs/heads/','refs/tags/']){
      assert.deepEqual(invocationViolations({'src/branch.mjs':`const ref=\`${prefix}\${name}\`;execFileSync('git',${argv});`}),[],`${verb} ${prefix}`);
    }
    assert.ok(invocationViolations({'src/event.mjs':`const ref='refs/'+'fgos/events/x';execFileSync('git',${argv});`}).length,verb);
  }
  const sources={
    'src/names.mjs':'export function branch(id){return `fgw/${id}`;}',
    'src/push.mjs':"import {branch} from './names.mjs'; function push(ref){execFileSync('git',['push','origin',ref]);}push(branch(id));",
  };
  assert.deepEqual(invocationViolations(sources),[]);
  for(const source of [
    "execFileSync('git',['commit','--','.fgos/events.jsonl']);",
    "runBorrowed(handle,{command:'git',args:['commit','--','.fgos/events.jsonl']});",
    "const files=['.fgos/events/a'];const args=['commit','--',...files];handle.runBorrowed('git',args);",
    "Command::new(\"git\").args([\"commit\",\"--\",\".fgos/events/x\"]);",
  ])for(const file of ['src/commit.mjs','packages/git/rust/src/driver.rs'])assert.ok(invocationViolations({[file]:source}).length,source);
  for(const source of [
    "let ref='refs/heads/main';ref=input;execFileSync('git',['push','origin',ref]);",
    "const argv=['push','origin','refs/heads/main'];argv.push('refs/fgos/events/x');execFileSync('git',argv);",
    'Command::new("git").args(vec!["push","origin",ref]);',
    "import {execSync as shell} from 'node:child_process';shell('git fetch origin refs/fgos/events/x');",
  ])assert.ok(invocationViolations({'src/mutated.mjs':source}).length,source);
  assert.ok(invocationViolations({'src/shell.mjs':"execSync('git push origin refs/fgos/events/x');"}).length);
  assert.deepEqual(invocationViolations({'src/safe.mjs':"execFileSync('git',['commit','--','payload']);"}),[]);
});

test('review counterexamples cannot hide event publication behind launchers or computed argv',()=>{
  const probes=[
    "spawnSync('git push origin refs/fgos/events/x',{shell:true});",
    "execFileSync('sh',['-c','git push origin refs/fgos/events/x']);",
    "execFileSync('/usr/bin/git',['push','origin','refs/fgos/events/x']);",
    'Command::new("/usr/bin/git").args(["push","origin","refs/fgos/events/x"]);',
    'Command::new("sh").args(["-c","git push origin refs/fgos/events/x"]);',
    'Command::new("env").args(["git","fetch","origin","refs/fgos/events/x"]);',
    "function git(args){return execFileSync('git',args);}git(['push','origin'].concat(refs));",
    "execFileSync('git',['push','origin','refs/*:refs/*']);",
    "execFileSync('/usr/bin/env',['git','push','origin','refs/fgos/events/x']);",
    "spawnSync('xargs',['git','fetch','origin','refs/fgos/events/x']);",
    "execFileSync('git',argv);",
    "execFileSync('git',['push','origin','refs/?']);",
    "execFileSync('git',['push','origin','refs/[ab]*']);",
    "function rest(...args){execFileSync('git',args);}rest('push','origin','refs/fgos/events/x');",
    "function forward(args){return execFileSync('git',args);}forward(computed());",
  ];
  for(const source of probes)assert.ok(invocationViolations({'src/probe.mjs':source}).length,source);
  const chain=Array.from({length:40},(_,i)=>`function f${i}(args){return ${i===39?"execFileSync('git',args)":`f${i+1}(args)`};}`).join('');
  assert.ok(invocationViolations({'src/deep.mjs':chain+"f0(computed());"}).length);
  assert.deepEqual(invocationViolations({'src/safe.mjs':"execFileSync('/usr/bin/git',['push','origin','refs/heads/*:refs/heads/*']);"}),[]);
});

test('E3 exemption requires fixture provenance, not the filename or a baseline label',()=>{
  const fixture=`function bareRepo(dir){git(['init','-q','--bare',dir]);return dir;}
    function run(args){const root=args.root;if(fs.existsSync(root))throw Error('fresh');
    const repo=bareRepo(path.join(root,'spawn.git'));
    execFileSync('git',['--git-dir',repo,'update-ref','refs/fgos/events/raw','new']);}`;
  const census=publicationCensus({'scripts/git/e3-bench.mjs':fixture});
  assert.deepEqual(census.violations,[]);
  assert.equal(census.exemptions.length,1);
  assert.equal(census.exemptions[0].class,'E3 legacy baseline on fixture repos');
  for(const changed of [fixture.replace("bareRepo(path.join(root,'spawn.git'))",'args.repo'),fixture.replace("if(fs.existsSync(root))throw Error('fresh');",''),fixture.replace("git(['init','-q','--bare',dir]);",''),fixture.replace('return dir;','return foreign;'),fixture.replace("execFileSync('git'","repo=foreign;execFileSync('git'")]){
    assert.ok(invocationViolations({'scripts/git/e3-bench.mjs':changed}).length);
  }
  assert.ok(invocationViolations({'scripts/other.mjs':fixture}).length);
});

test('large literals and shared assignment graphs are fully inspected in bounded time', {timeout:10000},()=>{
  const padding='x'.repeat(1024*1024);
  const declarations=Array.from({length:24},(_,i)=>`const v${i+1}=[v${i},v${i}];`).join('');
  const sources={'src/large.mjs':`const message='large'; const ref='${padding}refs/fgos/events/x';execFileSync('git',['push','origin',ref,message]);`,
    'src/cycle.mjs':"function ref(){return ref();}execFileSync('git',['push','origin',ref()]);",
    'src/graph.mjs':`const v0='safe';${declarations}execFileSync('git',['update-ref',v24,'new']);`};
  const found=invocationViolations(sources);
  for(const file of ['src/large.mjs','src/cycle.mjs','src/graph.mjs'])assert.ok(found.some(v=>v.startsWith(file)),file);
});

// Main still owns the legacy Work consumer. These exact pre-cutover bytes
// remain visible debt; changing them requires the WORK lane to remove/update
// the proof. This is not an invocationViolations/publicationCensus exemption.
const dormantWorkOwners = {
  "src/runner/main-fgos-checkpoint.mjs": "616e675cf4835eb19773494a9e514ada3ca50eefedadf5d03eef24eae971537f",
  "src/runner/execution/commit-unit-work.mjs": "99d209fc52268484064bf9c4654e71044a1ae3898c855edbf5f54a5780b3e9af",
  "src/runner/execution/partial-writes.mjs": "0051dc354c166ef7d6e90c49ed0ff7dea63a50ba38b5d9f6eb50b57b60330bca",
  "bin/fgos.mjs": "64ace4da89dbc1222c6d3c0d634272c9b043d1c268a257ed2e2e09385a5eb198",
  "scripts/measure-verify-cost.mjs": "314c461c359f54f978a64494ea87884db14e563be96920387601e47c74bc37c4",
  "scripts/probe-storytelling-material.mjs": "360c13abeff9239f891f38cb829d901f0e331f98c42ee9cd2e81d3e49437d39a",
  "src/runner/attestation-guard.mjs": "0c065ea506e4768fc295d47160d94003711cf896106ed519506d3a14b965123d",
  "src/setup/registrations.mjs": "41568dad5cf20aa73fcbb09e08fab084bb77faea5638fa43e3e7bbe5806b3ce6",
  "src/state/replay.mjs": "6fbdd0bd9867118cf3ce086ed45a6e3e9a6c61bcc5f99a086d86440be4f0d673",
  "src/state/events-compaction.mjs": "c2ac54d19f7eeffd0dffc7e7ceda1389c3c36c0d550aef5f434ae585259c0e69",
  "src/state/store.mjs": "b8eacaa22d2f17b04f494f9671b3bec2b883306aadb9ae0909298b94b20e11c4",
  "src/state/porting-store.mjs": "ee409980f27d11a0b67c55ae18b2510fa98183103035a4c9202737e0dc90d519",
  "src/state/events-jsonl-truncation-guard.mjs": "b4dd68558622a872395138a790bc63926ebdf60323b880c6f69b23ca3d7ee0ab"
};

// This is a dormant-foundation regression census, not a passing cutover gate.
// Assert every existing finding exactly; no reader or invocation check is skipped.
const dormantInvocationFindings = [
  "bin/fgos-runner.mjs:120: runWatch",
  "bin/fgos-runner.mjs:150: runOnce",
  "bin/fgos.mjs:5177: runVerb",
  "src/runner/execution/commit-unit-work.mjs:279: withPaths",
  "src/runner/execution/run.mjs:1026: preflightUnitWorktree",
  "src/runner/execution/run.mjs:1079: worktreeSnapshot",
  "src/runner/execution/run.mjs:1108: commitWork",
  "src/runner/execution/run.mjs:1153: writesSince",
  "src/runner/execution/run.mjs:972: commitPending",
  "src/runner/execution/run.mjs:973: preflightUnitWorktree",
  "src/runner/execution/run.mjs:980: commitWork",
  "src/runner/fanout-batch.mjs:217: fanoutBatchExecutorCli",
  "src/runner/main-fgos-checkpoint.mjs:17: runBorrowed",
  "src/workflow/case-verbs.mjs:133: advanceWorkflowRun",
  "src/workflow/case-verbs.mjs:230: advanceWorkflowRun",
  "src/workflow/case-verbs.mjs:303: advanceWorkflowRun"
];
const dormantReaderFindings = [
  "bin/fgos.mjs: retired event reader",
  "scripts/measure-verify-cost.mjs: retired event reader",
  "scripts/probe-storytelling-material.mjs: retired event reader",
  "src/runner/attestation-guard.mjs: retired event reader",
  "src/setup/registrations.mjs: retired event reader",
  "src/state/events-compaction.mjs: retired event reader",
  "src/state/events-jsonl-truncation-guard.mjs: retired event reader",
  "src/state/porting-store.mjs: retired event reader",
  "src/state/replay.mjs: retired event reader",
  "src/state/store.mjs: retired event reader"
];

test('dormant repository census retains the exact pre-cutover Work findings and no new bypass',t=>{
  const files=execFileSync('rg',['--files','src','bin','scripts','packages','apps'],{encoding:'utf8'}).trim().split('\n')
    .filter(f=>/\.(?:mjs|js|rs)$/.test(f)&&!/(?:^|\/)(?:test|tests|examples)\//.test(f));
  const sources=Object.fromEntries(files.map(f=>[f,fs.readFileSync(f,'utf8')]));
  const census=publicationCensus(sources);
  for(const [file,digest] of Object.entries(dormantWorkOwners))assert.equal(createHash('sha256').update(sources[file]).digest('hex'),digest,`WORK owner changed: ${file}`);
  for(const site of census.violations)t.diagnostic(`pending cutover invocation proof: ${site}`);
  assert.deepEqual([...census.violations].sort(),dormantInvocationFindings);
  const violations=[];
  assert.equal(census.exemptions.length,4,'each E3 legacy fixture site is enumerated');
  for(const entry of census.exemptions)t.diagnostic(`${entry.class}: ${entry.site}`);
  for(const site of census.bounded.filter(s=>/src\/runner\/(?:worktree|merge)/.test(s)))t.diagnostic(`bounded non-event refs (Git 07 V-GATE): ${site}`);
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
  for(const site of violations)t.diagnostic(`pending Work reader cutover: ${site}`);
  assert.deepEqual(violations.sort(),dormantReaderFindings);
});
