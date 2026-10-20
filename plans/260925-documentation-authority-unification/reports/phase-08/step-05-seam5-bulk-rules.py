"""R19 report-only proof rules. Full-file context is a conservative superset
of every enclosing function: absence here proves absence in the function.
Unrecognized syntax stays in the judgment queue; no verdict by role hint.
"""
import sys
sys.dont_write_bytecode=True
import pathlib,re,json,hashlib,collections,subprocess,importlib.util,functools
P=pathlib.Path(__file__).resolve().parent; ROOT=P.parents[3]
spec=importlib.util.spec_from_file_location('admission',P/'step-05-admission-rules.py');a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
RULE='r19-closed-nondocument-operand-v1'
def sha(s):return hashlib.sha256(s.encode() if isinstance(s,str) else s).hexdigest()
def rows(n):return [json.loads(s) for s in (P/n).read_text().splitlines() if s]
@functools.lru_cache(None)
def body(pin,f):return subprocess.check_output(['git','show',pin+':'+f],cwd=ROOT).decode()
def roots(text):
 # Include split constructors, escaped regex forms and root-document names.
 return [dict(offset=m.start(),text=m[0]) for m in re.finditer(r'docs(?:/|\\/|[\x22\x27`])|\b(?:README|CHANGELOG|AGENTS|CLAUDE|LICENSE|CONTRIBUTING)(?:\.md)?\b',text)]
@functools.lru_cache(None)
def context(pin,f):
 text=body(pin,f)
 try:bindings=a.binding_roots(pin,f)
 except (subprocess.CalledProcessError,UnicodeDecodeError):
  return {'kind':'whole-file superset of enclosing functions','startLine':1,'endLine':len(text.splitlines()),'sha256':sha(text),'rootLiteralHits':roots(text),'tracedCensusConstants':['UNRESOLVED_IMPORT: mechanical proof refused']}
 traced=sorted(k for k in a.identifiers(text) if 'documents' in bindings.get(k,set()))
 return {'kind':'whole-file superset of enclosing functions','startLine':1,'endLine':len(text.splitlines()),'sha256':sha(text),'rootLiteralHits':roots(text),'tracedCensusConstants':traced}
def witness(text,t):
 expr=t[4];lines=text.splitlines();line,col=t[0],t[1]
 if line<=len(lines) and '\n'.join(lines[line-1:]).startswith(expr,col-1):return {'line':line,'columnStart':col,'columnEndExclusive':col+len(expr.split('\n')[0]),'text':expr.split('\n')[0],'expression':expr}
 hits=[m.start() for m in re.finditer(re.escape(expr),text)]
 if len(hits)!=1:return None
 off=hits[0];line=text[:off].count('\n')+1;col=off-text.rfind('\n',0,off)
 return {'line':line,'columnStart':col,'columnEndExclusive':col+len(expr.split('\n')[0]),'text':expr.split('\n')[0],'expression':expr}
@functools.lru_cache(None)
def temporary_roots(text):
 tmp=set()
 for _ in range(12):
  old=set(tmp)
  for mt in re.finditer(r'\b(?:const|let|var)\s+(?:mut\s+)?(\w+)(?:\s*:\s*\w+)?\s*=\s*([^;\n]+)',text):
   rhs=mt[2]
   if re.search(r'\b(?:mkdtempSync|mkdtemp|tempdir|temp_dir)\s*\(',rhs) or (re.match(r'(?:path\.)?(?:join|resolve)\(',rhs) and a.identifiers(rhs)&tmp):tmp.add(mt[1])
  if old==tmp:break
 return frozenset(tmp)
def category(expr,line,kind,text):
 # Every branch is a closed syntax family with a named concrete non-doc use.
 if re.search(r'(?:[\x22\x27`/])\.fgos(?:/|[\x22\x27`])',expr):return ('state-event-store','.fgos state','literal .fgos state component')
 if re.search(r'(?:[\x22\x27`/])(?:target|cargo-target)(?:/|[\x22\x27`])|CARGO_(?:BIN_EXE|TARGET|MANIFEST)',expr):return ('cargo-output-directory','cargo/target','Cargo artifact or manifest-root plumbing')
 if re.search(r'\b(?:process\.(?:env|argv|execPath|cwd)|std::env::(?:var|current_dir)|env!\()',expr):return ('scalar-pass-through','argv/env plumbing','process/argv/env scalar or cwd')
 if re.search(r'import\.meta\.url|__dirname|__filename',expr):return ('root-only','test root','module location / test repository root')
 if re.search(r'(?:[\x22\x27`/])\.git(?:/|[\x22\x27`])',expr):return ('non-document-fs-probe','test root','.git metadata / fixture repository')
 if re.fullmatch(r'(?:\w+\.)?join\([\x22\x27](?:\\n|, ?| |\|)[\x22\x27]\)',expr):return ('text-label-join','string/label joins','closed text separator join')
 if re.match(r'(?:\w+\.)?(?:resolve|join)\(',expr) and re.search(r'[\x22\x27](?:\.\./)*(?:src|test|tests|bin|scripts|packages|apps|fixtures|node_modules|libexec)(?:/|[\x22\x27])',expr):return ('non-document-fs-probe','test root','source/test/tool fixture component')
 if re.match(r'new URL\(',expr) and re.search(r'[\x22\x27](?:\.\./)*(?:src|test|packages)/',expr):return ('non-document-fs-probe','test root','source module URL')
 if re.search(r'\b(?:tmpdir|temp_dir|mkdtempSync|mkdtemp|tempdir)\s*\(',expr):return ('non-document-fs-probe','tmp/fixture dirs','explicit temporary-directory constructor')
 # Resolve local temporary roots transitively, only through declarations.
 tmp=temporary_roots(text)
 if re.match(r'(?:path\.)?(?:join|resolve)\(|\w+\.join\(',expr) and a.identifiers(expr)&tmp:return ('non-document-fs-probe','tmp/fixture dirs','path construction rooted in declared temporary directory: '+','.join(sorted(a.identifiers(expr)&tmp)))
 if kind=='config/default-root' and re.fullmatch(r'(?:\w+\s*:\s*)?(?:&?Path(?:Buf)?|path::(?:Path|\{Path)|root\s*:\s*|(?:repoRoot|root|cwd|worktree|workdir)\s*(?::[^=,]+)?(?:=\s*(?:null|undefined|None))?)[,\s]*',expr):return ('root-only','test root','root parameter/type without a document operand')
 if kind=='template-string' and re.search(r'assert\.(?:ok|equal|deepEqual|match|throws|doesNotThrow)',line) and '/' not in expr and not re.search(r'\.(?:md|ya?ml|json)\b',expr):return ('text-label-join','string/label joins','assertion diagnostic interpolation without a path literal')
 return None

def decide(pin,f,d):return _decide(pin,f,tuple(d['callSite']),d['id'])
@functools.lru_cache(None)
def _decide(pin,f,site,identity):
 d={'callSite':site,'id':identity}
 text=body(pin,f);ctx=context(pin,f);w=witness(text,d['callSite'])
 if not w:return {'id':d['id'],'status':'judgment-required','reason':'original expression is absent or ambiguous at input pin'}
 if ctx['rootLiteralHits'] or ctx['tracedCensusConstants']:return {'id':d['id'],'status':'judgment-required','reason':'census-root context/constant or operand outside closed syntax','operationWitness':w}
 c=category(d['callSite'][4],text.splitlines()[w['line']-1],d['callSite'][5],text)
 if not c:return {'id':d['id'],'status':'judgment-required','reason':'census-root context/constant or operand outside closed syntax','operationWitness':w}
 return {'id':d['id'],'status':'mechanical-reject','admission':'REJECT','disposition':'preserve','nonDocumentUse':c[0],'ruleId':RULE,'category':c[1],'reason':c[2],'operationWitness':w,'contextSha256':ctx['sha256'],'rootLiteralHits':[],'tracedCensusConstants':[]}

def check(records=None,triage=None):
 records=rows('step-05-records/tests-mechanical.jsonl') if records is None else records
 triage=rows('step-05-seam5-bulk-triage.jsonl') if triage is None else triage
 pop={r['file']:r for r in rows('step-05-population-files.jsonl') if r['seam']=='real-file-tests-goldens'}
 ds=collections.defaultdict(list)
 for d in rows('step-05-population-dynamic.jsonl'):ds[d['file']].append(d)
 errors=[];checks=collections.Counter()
 def test(rule,where,fn):
  checks[rule]+=1
  try:assert fn()
  except Exception as ex:errors.append({'rule':rule,'where':where,'error':str(ex) or 'condition false'})
 test('r19-triage-coverage','all 702 initial files',lambda:len(triage)==702 and len({r['file'] for r in triage})==702 and {r['file'] for r in triage}==set(pop)-{'src/runner/prompt-templates/worker-prompt-skill-pointer.txt','test/runner/prompt-templates.test.mjs'})
 expected=[]
 for r in triage:
  f=r['file'];pin=r['inputCommit'];text=body(pin,f)
  test('r19-context',f,lambda r=r,text=text:r['sourceSha256']==sha(text) and r['context']==context(r['inputCommit'],r['file']))
  verdicts=[decide(pin,f,d) for d in ds[f]]
  test('r19-tuples',f,lambda r=r,verdicts=verdicts:r['tuples']==verdicts)
  closed=not pop[f]['referenceIds'] and bool(verdicts) and all(d['status']=='mechanical-reject' for d in verdicts)
  test('r19-closure',f,lambda r=r,closed=closed:r['wholeFileMechanicalClosure']==closed)
  if closed:expected.append(f)
 by={r['file']:r for r in records}
 test('r19-closure','all and only fully proved files',lambda:len(by)==len(records) and set(by)==set(expected))
 for r in records:
  f=r['file'];t=next(x for x in triage if x['file']==f);pin=t['inputCommit'];text=body(pin,f)
  test('r19-pins',f,lambda r=r,t=t,text=text:r['authorInputCommit']==t['inputCommit'] and r['sourceSha256']==sha(text) and r['wholeFileReadEvidence']=={'bytes':len(text.encode()),'lines':len(text.splitlines()),'sha256':sha(text),'method':'complete pinned file; full-file context conservatively encloses every function'} and r['sourceMode']==subprocess.check_output(['git','ls-tree',r['authorInputCommit'],'--',r['file']],cwd=ROOT,text=True).split()[0])
  def items(r=r,t=t):
   assert not r['references'] and not r['diff'] and not r['rollbackDiff'] and not r['parked'] and r['wholeFileRead'] and r['mechanicalClosure']['ruleId']==RULE
   assert len(r['dynamicTraces'])==len(t['tuples'])
   for d,orig,ev in zip(r['dynamicTraces'],ds[r['file']],t['tuples']):
    assert d['id']==orig['id'] and d['originalTuple']==orig['callSite'] and d['inventoryOrigins']==orig['inventories']
    assert d['admission']=='REJECT' and d['disposition']=='preserve' and d['nonDocumentUse']==ev['nonDocumentUse'] and d['mechanicalRejection']==ev
   return True
  test('r19-tuples',f,items)
 return {'kind':'R19 conservative whole-file mechanical closures and complete initial 702-file triage','files':len(records),'literalReferences':0,'dynamicTuples':sum(len(r['dynamicTraces']) for r in records),'triagedFiles':len(triage),'triagedTuples':sum(len(r['tuples']) for r in triage),'mechanicallyRejectedTuples':sum(d['status']=='mechanical-reject' for r in triage for d in r['tuples']),'rules':{k:k for k in checks},'checks':dict(checks),'failures':errors,'failureCount':len(errors),'headDrift':[]}
