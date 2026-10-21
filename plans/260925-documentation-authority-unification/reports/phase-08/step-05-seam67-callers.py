"""Reuse the existing balanced JS scope reader; retain complete multiline tests."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,subprocess,ast,re,functools,hashlib,copy
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
# Reuse definitions only: the historical helper's top-level rewrite is not run.
source=P/'step-05-seam4-callers.py'
for node in ast.parse(source.read_text()).body:
 if isinstance(node,ast.FunctionDef) and node.name in ['mask','functions']:exec(compile(ast.Module(body=[node],type_ignores=[]),str(source),'exec'))
@functools.lru_cache(None)
def body(pin,file):return subprocess.check_output(['git','show',pin+':'+file],cwd=ROOT,text=True)
@functools.lru_cache(None)
def tests(text):
 masked=mask(text);ls=text.splitlines();out=[]
 for mt in re.finditer(r'^\s*test(?:\.\w+)?\s*\(',masked,re.M):
  start=masked.index('test',mt.start(),mt.end())
  opening=masked.index('(',start);j=opening+1;depth=1
  while j<len(masked) and depth:
   if masked[j]=='(':depth+=1
   elif masked[j]==')':depth-=1
   j+=1
  assert depth==0,'unclosed test call'
  arrow=masked.find('=>',opening,j);brace=masked.find('{',arrow+2,j) if arrow>=0 else -1;headerEnd=brace+1 if brace>=0 else j
  a=text.count('\n',0,start)+1;b=text.count('\n',0,j)+1
  out.append({'line':a,'endLine':b,'declaration':text[start:headerEnd],'function':'test callback','kind':'test-callback','assertions':[{'line':n,'text':ls[n-1]} for n in range(a,min(b,len(ls))+1) if re.search(r'\bassert\.\w+\(',ls[n-1])]})
 return out
@functools.lru_cache(None)
def scopes(pin,file):
 text=body(pin,file);ls=text.splitlines();kind='module' if file.endswith(('.js','.mjs')) else 'generated-output' if file.endswith('.html') else 'data'
 found=[dict(f,kind='function') for f in functions(text)] if kind=='module' else []
 if file.startswith('test/'):found+=tests(text)
 return text,ls,kind,found

def owning(pin,file,n):
 text,ls,kind,found=scopes(pin,file);candidates=[f for f in found if f['line']<=n<=f['endLine']]
 own=min(candidates,key=lambda f:f['endLine']-f['line']) if candidates else {'line':1,'endLine':len(ls),'declaration':ls[0],'function':None,'kind':kind}
 return {'line':own['line'],'declaration':own['declaration'],'kind':own['kind']},{'startLine':own['line'],'endLine':own['endLine'],'symbol':own['function'],'kind':own['kind'],'method':'Existing balanced named-function scanner with string/comment/regex masking; complete balanced test-call range for multiline callbacks; module/data scope when no real function encloses the operation.'}
def proofs(pin,file):
 return [{'declarationLine':t['line'],'endLine':t['endLine'],'declaration':t['declaration'],'assertions':t['assertions']} for t in tests(body(pin,file))]

def apply():
 changes=[];rs=[]
 for s in ['ui-spec-compiler','citation-ratchet-roots']:
  f=P/'step-05-records'/(s+'.jsonl');rows=[json.loads(l) for l in f.open()]
  for r in rows:
   for d in r['dynamicTraces']:
    new,ev=owning(r['authorInputCommit'],r['file'],d['currentLine'])
    if d['caller']!=new:changes.append({'file':r['file'],'id':d['id'],'before':d['caller'],'after':new})
    d['caller']=new;d['enclosingFunctionEvidence']=ev;d['operationChain']['caller']=new
   if r['file'].startswith('test/'):r['owningProofs']=proofs(r['authorInputCommit'],r['file'])
  f.write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rows));rs+=rows
 by={r['file']:r for r in rs}
 def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
 listing=json.loads((P/'step-05-seam67-review-list.json').read_text())
 for e in listing['canonicalRecords']:e['recordSha256']=digest(by[e['file']])
 canonical={e['file']:e for e in listing['canonicalRecords']};listing['addedThisTurn']=[canonical[e['file']] for e in listing['addedThisTurn']]
 (P/'step-05-seam67-review-list.json').write_text(json.dumps(listing,ensure_ascii=False,indent=2)+'\n')
 closure=json.loads((P/'step-05-seam67-closure.json').read_text())
 for group in closure['parkDependencies']:
  for e in group['items']:e['recordSha256']=digest(by[e['file']])
 closure['callerEvidence']='step-05-seam67-caller-corrections.json';(P/'step-05-seam67-closure.json').write_text(json.dumps(closure,ensure_ascii=False,indent=2)+'\n')
 out={'rule':'L12-72 precise operation ownership; no nearest-ended-function attribution','existingParser':'step-05-seam4-callers.py::mask/functions','changedCallers':len(changes),'changes':changes,'testProofFiles':[r['file'] for r in rs if r['file'].startswith('test/')],'dispositionChanges':0};(P/'step-05-seam67-caller-corrections.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print('precise caller corrections',len(changes))
if __name__=='__main__':apply()
