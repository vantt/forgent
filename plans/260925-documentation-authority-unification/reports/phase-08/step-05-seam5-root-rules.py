"""R21: extend R20 through base-root provenance, keeping its prior proof frozen.
Conservative syntax subset. Unknowns remain queued; no admission inferred.
"""
import sys
sys.dont_write_bytecode=True
import pathlib,re,json,collections,functools,importlib.util,posixpath,subprocess
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
s=importlib.util.spec_from_file_location('neutral',P/'step-05-seam5-neutral-rules.py');n=importlib.util.module_from_spec(s);s.loader.exec_module(n)
b=n.b
RULE='r21-root-anchored-cutover-neutral-v1'
PIN=n.PIN
QUEUE_PIN='35057308b'
QUEUE='plans/260925-documentation-authority-unification/reports/phase-08/step-05-seam5-continuation.json'
def splitargs(text):
 out=[];start=0;depth=0;quote=None;escape=False
 for i,c in enumerate(text):
  if quote:
   if escape:escape=False
   elif c=='\\':escape=True
   elif c==quote:quote=None
  elif c in "\"'`":quote=c
  elif c in '([{':depth+=1
  elif c in ')]}':depth-=1
  elif c==',' and depth==0:out.append(text[start:i].strip());start=i+1
 out.append(text[start:].strip());return out

def literal(expr):
 m=re.fullmatch(r'''(["'])([^"'\\]*)\1''',expr.strip())
 return m[2] if m else None

@functools.lru_cache(None)
def localbindings(text):
 out=collections.defaultdict(list)
 # Extract the RHS to its real statement boundary, retaining multiline calls.
 for m in re.finditer(r'\b(?:const|static|let|var)\s+(?:mut\s+)?(\w+)(?:\s*:\s*[^=;\n]+)?\s*=\s*',text):
  rest=text[m.end():m.end()+8001];depth=0;quote=None;escape=False;end=len(rest)
  for i,c in enumerate(rest):
   if quote:
    if escape:escape=False
    elif c=='\\':escape=True
    elif c==quote:quote=None
   elif c in "\"'`":quote=c
   elif c in '([{':depth+=1
   elif c in ')]}':
    if depth==0:end=i;break
    depth-=1
   elif c==';' and depth==0:end=i;break
  rhs=rest[:end].strip()
  if len(rhs)<8000:out[m[1]].append(rhs)
 # A subsequent write disqualifies a one-binding proof (including cross-scope reuse).
 for m in re.finditer(r'(?<![\w.])(\w+)\s*(\+=|=(?!=|>))\s*([^;\n]+)',text):
  if re.search(r'(?:const|let|var)\s+$',text[max(0,m.start()-12):m.start()]):continue
  out[m[1]].append(m[3] if m[2]=='=' else '__unproved_augmented_assignment__')
 return dict(out)

def imported(text):
 out={};namespaces={}
 for m in re.finditer(r'''import\s*\{([^}]+)\}\s*from\s*["']([^"']+)["']''',text,re.S):
  for t in m[1].split(','):
   parts=t.strip().split(' as ')
   if parts[0]:out[parts[-1]]=(m[2],parts[0])
 for m in re.finditer(r'''import\s*\*\s*as\s*(\w+)\s*from\s*["']([^"']+)["']''',text):namespaces[m[1]]=m[2]
 for m in re.finditer(r'''(?:const|let|var)\s*\{([^}]+)\}\s*=\s*require\s*\(\s*["']([^"']+)["']\s*\)''',text):
  for t in m[1].split(','):
   parts=t.strip().split(':');out[parts[-1].strip()]=(m[2],parts[0].strip())
 for m in re.finditer(r'''(?:const|let|var)\s*(\w+)\s*=\s*require\s*\(\s*["']([^"']+)["']\s*\)''',text):namespaces[m[1]]=m[2]
 return out,namespaces

class Roots:
 def __init__(self,pin,file,text=None,seen=()):
  self.pin=pin;self.file=file;self.text=b.body(pin,file) if text is None else text;self.bindings=localbindings(self.text);self.imports,self.namespaces=imported(self.text);self.seen=seen
 def external(self,source,name,seen):
  if not source.startswith('.'):return None
  f=posixpath.normpath(str(pathlib.PurePosixPath(self.file).parent/source))
  if f in self.seen or (f,name) in seen:return None
  try:r=Roots(self.pin,f,seen=self.seen+(self.file,));v=r.name(name,seen);return {'kind':'repo import root','file':f,'inputCommit':self.pin,'sha256':b.sha(r.text),'export':name,'root':v} if v else None
  except (subprocess.CalledProcessError,UnicodeDecodeError):return None
 def caller(self,key,seen):
  """Only direct same-file, non-exported function calls can bind a parameter.
  All invocations must be visible and rooted; callback/escaping uses refuse.
  """
  matches=[]
  for fn in re.finditer(r'(?m)^(?!export)(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)',self.text):
   params=[p.strip().split('=')[0].strip() for p in fn[2].split(',')]
   if key not in params:continue
   index=params.index(key);calls=[]
   for use in re.finditer(r'\b'+re.escape(fn[1])+r'\b',self.text):
    if fn.start()<=use.start()<fn.end():continue
    tail=self.text[use.end():];call=re.match(r'\s*\(',tail)
    if not call:return None
    args=n.call_arguments(self.text,use.end()+call.end())
    if args is None:return None
    aa=splitargs(args)
    if len(aa)<=index:return None
    proof=self.expr(aa[index],seen)
    if not proof:return None
    calls.append({'argument':aa[index],'root':proof})
   if not calls:return None
   matches.append({'kind':'same-file closed caller parameter','function':fn[1],'parameter':key,'calls':calls})
  return matches or None
 def name(self,key,seen=()):
  if (self.file,key) in seen:return None
  nxt=seen+((self.file,key),)
  if key in self.imports:return self.external(*self.imports[key],nxt)
  if '.' in key:
   a,z=key.split('.',1)
   if a in self.namespaces:return self.external(self.namespaces[a],z,nxt)
  parameter=any(key in [v.strip().split('=')[0].strip() for v in fn[1].split(',')] for fn in re.finditer(r'function\s+\w+\s*\(([^)]*)\)',self.text))
  caller=self.caller(key,nxt) if parameter else None
  if parameter and not caller:return None
  if key in self.bindings:
   vals=[self.expr(v,nxt) for v in self.bindings[key]]
   if vals and all(v for v in vals):return {'kind':'all local bindings outside document root','name':key,'bindings':self.bindings[key],'roots':vals,'callerRoots':caller}
  if caller:return {'kind':'closed caller roots','roots':caller}
  # Rust crate constants: scan only this crate's source, resolve unique declaration.
  if re.fullmatch(r'[A-Z][A-Z_0-9]+',key) and self.file.endswith('.rs') and any(re.search(r'\b'+re.escape(key)+r'\b',u[0]) for u in re.finditer(r'\buse\s+(?:crate|self|super)::[^;]+;',self.text)):
   parts=pathlib.PurePosixPath(self.file).parts
   marker='src' if 'src' in parts else 'tests' if 'tests' in parts else None
   if marker:
    crate='/'.join(parts[:parts.index(marker)]);paths=subprocess.check_output(['git','ls-tree','-r','--name-only',self.pin,'--',crate+'/src'],cwd=ROOT,text=True).splitlines();found=[]
    for f in paths:
     if f.endswith('.rs') and f!=self.file:
      raw=b.body(self.pin,f)
      if key in localbindings(raw):found.append((f,raw))
    if len(found)==1:
     f,raw=found[0];v=Roots(self.pin,f,raw,self.seen+(self.file,)).name(key,nxt)
     if v:return {'kind':'same-crate const/static','file':f,'sha256':b.sha(raw),'root':v}
  return None
 def expr(self,expr,seen=()):
  expr=expr.strip()
  system=False
  if expr=='std::env::temp_dir()':system=True
  if expr=='temp_dir()' and re.search(r'use\s+std::env::(?:temp_dir|\{[^}]*\btemp_dir\b[^}]*\})',self.text):system=True
  fn=re.fullmatch(r'(\w+)\(\)',expr)
  if fn and self.imports.get(fn[1]) in [('node:os','tmpdir'),('os','tmpdir'),('node:os','homedir'),('os','homedir')]:system=True
  ns=re.fullmatch(r'(\w+)\.(tmpdir|homedir)\(\)',expr)
  if ns:
   name=ns[1]
   if self.namespaces.get(name) in ['os','node:os'] or re.search(r"import\s+"+re.escape(name)+r"\s+from\s*['\"](?:node:)?os['\"]",self.text):system=True
  if system:return {'kind':'OS temporary/home root','expression':expr}

  if re.match(r'(?:\w+\.)?(?:mkdtempSync|mkdtemp|tempdir)\(',expr):
   # Creation is accepted only under a proven temporary base.
   args=n.call_arguments(expr,expr.index('(')+1)
   if args and self.expr(splitargs(args)[0],seen):return {'kind':'created temporary directory','expression':expr}
  # Rust receiver chains keep their actual base; they are not free join calls.
  rm=re.match(r'([\s\S]+?)\.join\(',expr)
  if rm:
   tail=n.call_arguments(expr,rm.end())
   if tail is not None and expr[rm.end()+len(tail)+1:].strip() in ['', '.unwrap()', '?']:
    base=self.expr(rm[1],seen)
    if base and not re.search(r'''["']\.\.(?:/|["'])''',tail):return {'kind':'Rust chained descendant','base':base,'expression':expr}
  # Simple repo helper factories return a proved temporary base. Parameters
  # are never assumed safe solely from their names.
  fm=re.fullmatch(r'(\w+)\([^;]*\)',expr)
  if fm and fm[1] not in ['join','resolve','require']:
   fun=re.search(r'function\s+'+re.escape(fm[1])+r'\s*\([^)]*\)\s*\{([^{}]*)\}',self.text,re.S)
   if fun:
    ret=re.findall(r'\breturn\s+([^;]+);',fun[1])
    if len(ret)==1 and ret[0]!=expr:
     base=self.expr(ret[0],seen)
     if base:return {'kind':'repo-local temporary factory','declaration':fun[0],'root':base}
  v=literal(expr)
  if v is not None:
   if re.match(r'(?:/tmp/|/var/tmp/|(?:\.?\.?/)*(?:test|tests|fixtures|node_modules|target|\.fgos)(?:/|$))',v) and '..' not in pathlib.PurePosixPath(v).parts:return {'kind':'fixed non-document root','value':v}
   return None
  # Only base is allowed to confer neutrality. A temporary suffix cannot sanitize a repository base.
  m=re.match(r'(?:(?:path\.)?(?:join|resolve)|PathBuf::from|Path::new)\(',expr)
  if m:
   args=n.call_arguments(expr,m.end())
   if args is None:return None
   aa=splitargs(args);base=self.expr(aa[0],seen)
   # Reject parent escapes and absolute suffixes; dynamic suffix is allowed only
   # for join under a created temporary root, never path.resolve's reset behavior.
   if base and not any(re.search(r'''["'`]\.\.(?:/|["'`])|["'`]/''',a) for a in aa[1:]) and (not expr.startswith(('resolve(','path.resolve(')) or all(literal(a) is not None for a in aa[1:])):
    return {'kind':'descendant of proved non-document base','base':base,'expression':expr}
  m=re.fullmatch(r'(\w+(?:\.\w+)?)\.join\(([\s\S]*)\)',expr)
  if m:
   base=self.name(m[1],seen)
   if base and not re.search(r'''["']\.\.(?:/|["'])''',m[2]):return {'kind':'Rust/path descendant','base':base,'expression':expr}
  if re.fullmatch(r'\w+(?:\.\w+)?',expr):return self.name(expr,seen)
  if expr.startswith('`'):
   m=re.match(r'`\$\{(\w+)\}/',expr)
   if m and '..' not in expr:
    base=self.name(m[1],seen)
    if base:return {'kind':'template descendant','base':base,'expression':expr}
  return None

@functools.lru_cache(None)
def context(pin,file,text=None):
 text=b.body(pin,file) if text is None else text;r=Roots(pin,file,text);old=n.context(pin,file) if text==b.body(pin,file) else {'literalHazards':n.literal_hazards(text),'constantHazards':n.constant_hazards(pin,file,text),'constructedHazards':n.constructed_hazards(text)};resolved=[];remaining=[]
 for h in old['constructedHazards']:
  proof=r.expr(h['text'])
  if proof is None and file.endswith('.rs') and h['text'].startswith('join('):
   prefix=text[:h['offset']]
   mt=re.search(r'(std::env::temp_dir\(\)|temp_dir\(\))\s*\.\s*$',prefix)
   if mt:proof={'kind':'Rust join receiver is OS temporary root','receiver':mt[1],'expression':h['text']}
  if proof:resolved.append({'hazard':h,'rootProof':proof})
  else:remaining.append(h)
 constants=[]
 for h in old['constantHazards']:
  names=h.get('names',[h.get('name')]);proofs=[r.name(x) for x in names if x]
  if proofs and all(proofs):resolved.append({'hazard':h,'rootProof':proofs})
  else:constants.append(h)
 return {'kind':'complete pinned file and base-root provenance','sha256':b.sha(text),'bytes':len(text.encode()),'lines':len(text.splitlines()),'literalHazards':old['literalHazards'],'constantHazards':constants,'constructedHazards':remaining,'rootResolutions':resolved}
def safe(ctx):return not any(ctx[k] for k in ['literalHazards','constantHazards','constructedHazards'])
def record(file,ctx,refs,dyn,mode):
 r=n.record(file,ctx,refs,dyn,mode);r['mechanicalClosure']['ruleId']=RULE;r['mechanicalClosure']['reason']='R20 context plus R21 proved non-document base roots; no moved literal, unresolved import or open external base remains.';r['mechanicalClosure']['proof']=ctx;r['mechanicalClosure']['moveSetSha256']=b.sha((P/'step-05-cutover-move-set.json').read_bytes());r['review']['status']='checker-only root neutrality; R21 exempts window review'
 for e in r['references']+r['dynamicTraces']:e['ruleId']=RULE
 return r

def check(records=None,triage=None):
 records=b.rows('step-05-records/tests-root-neutral.jsonl') if records is None else records;triage=b.rows('step-05-seam5-root-triage.jsonl') if triage is None else triage;queue=json.loads((P/'step-05-seam5-batch4-input.json').read_text());errors=[];counts=collections.Counter()
 def test(rule,loc,ok):
  counts[rule]+=1
  if not ok:errors.append({'rule':rule,'where':loc})
 test('r21-queue','immutable initial 476 queue',queue==json.loads(b.body(QUEUE_PIN,QUEUE)))
 test('r21-coverage','triage all remaining files',len(triage)==476 and {x['file'] for x in triage}=={x['file'] for x in queue['remainingFilesInOrder']})
 refs=collections.defaultdict(list);dyn=collections.defaultdict(list)
 for x in b.rows('step-05-population-references.jsonl'):refs[x['file']].append(x)
 for x in b.rows('step-05-population-dynamic.jsonl'):dyn[x['file']].append(x)
 expected={}
 for t in triage:
  f=t['file'];ctx=context(PIN,f);old=n.literal_hazards('\n'.join(x['expression'] for x in refs[f])+'\n'+'\n'.join(x['callSite'][4] for x in dyn[f]));ok=safe(ctx) and not old
  test('r21-context',f,t=={'file':f,'inputCommit':PIN,'context':ctx,'originalOperandHazards':old,'wholeFileNeutralClosure':ok})
  if ok:
   mode=subprocess.check_output(['git','ls-tree',PIN,'--',f],cwd=ROOT,text=True).split()[0];expected[f]=record(f,ctx,refs[f],dyn[f],mode)
 test('r21-coverage','all and only proven new neutral files',len(records)==len(expected) and {r['file'] for r in records}==set(expected))
 for r in records:test('r21-record',r['file'],r==expected.get(r['file']))
 return {'files':len(records),'literalReferences':sum(len(r['references']) for r in records),'dynamicTuples':sum(len(r['dynamicTraces']) for r in records),'rules':{k:k for k in counts},'checks':dict(counts),'failureCount':len(errors),'failures':errors,'headDrift':[]}
if __name__=='__main__':
 out=check();n.dump(P/'step-05-seam5-root-check.json',out);print(json.dumps(out));sys.exit(bool(out['failures']))
