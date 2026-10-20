"""R20 report-only, conservative whole-file cutover-relevance proof.
No admission verdict is inferred: preserve is invariant under the label.
Unknown path constructors/imports remain judgment work. Git objects only.
"""
import sys
sys.dont_write_bytecode=True
import pathlib,json,re,posixpath,collections,functools,subprocess,importlib.util
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
s=importlib.util.spec_from_file_location('bulk',P/'step-05-seam5-bulk-rules.py');b=importlib.util.module_from_spec(s);s.loader.exec_module(b)
RULE='r20-cutover-neutral-whole-file-v1'
PIN='5eb9dc609f303fc9d54377f866b5e8caf9a5d129'
INPUT_QUEUE_PIN='9ceec7bdc8bd7243220b99e016bd880a00fa176f'
BASE='plans/260925-documentation-authority-unification/'
SOURCES=[BASE+'alias-table.json',BASE+'reports/phase-06/draft-alias-merged-step10.json','docs/doc-registry.json']
def dump(path,obj):path.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
def move_set():
 sources=[];moves=collections.defaultdict(list)
 for f in SOURCES:
  raw=b.body(PIN,f);a=json.loads(raw);sources.append({'path':f,'inputCommit':PIN,'sha256':b.sha(raw),'bytes':len(raw.encode())})
  if f.endswith('doc-registry.json'):
   for d in a['docs']:
    for old in d.get('aliases',[]):
     if old!=d['currentPath']:moves[old.split('#')[0]].append({'source':f,'to':d['currentPath'],'id':d['docId']})
  else:
   for e in a['entries']:
    moves[e['fromPath'].split('#')[0]].append({'source':f,'to':e['toOwner'],'id':e['aliasId']})
 tree=subprocess.check_output(['git','ls-tree','-r','--name-only',PIN,'--','docs/specs','docs/architect','docs/decisions'],cwd=ROOT,text=True)
 retired=[]
 for f in tree.splitlines():
  if f.startswith(('docs/specs/','docs/architect/')) or re.match(r'docs/decisions/00\d\d-.*\.md$',f):
   retired.append(f);moves[f].append({'source':'git tree','to':None,'id':'retiring-root-or-retired-decision'})
 # Retired ADR files are absent already; references to any member still matter.
 return {'ruleId':RULE,'inputCommit':PIN,'sources':sources,'sourceNotes':'Adopted alias table is empty; committed Phase 6 merged draft is the Phase 9 move proposal, not an activated alias table. Registry aliases are included conservatively, even already-moved ones. Anchors collapse to their old physical path.','prefixes':['docs/specs/','docs/architect/'],'retiredDecisionPattern':r'docs/decisions/00\d\d-[^/]*\.md','retiredIndex':'docs/decisions/0000-index.md','treeInventorySha256':b.sha(tree),'treeRetiringFileCount':len(retired),'pathCount':len(moves),'paths':[{'oldPath':k,'moves':v} for k,v in sorted(moves.items())]}
@functools.lru_cache(None)
def model():return move_set()
def normalized(text):
 text=text.replace('\\/','/').replace('\\.','.')
 # Literal concatenation cannot conceal a fixed move-set prefix.
 for _ in range(8):
  new=re.sub(r'''(["'])([^"'\\]*)\1\s*\+\s*(["'])([^"'\\]*)\3''',lambda m:m[1]+m[2]+m[4]+m[1],text)
  if new==text:break
  text=new
 return text
def literal_hazards(text):
 text=normalized(text);paths={e['oldPath'] for e in model()['paths']};hits=[]
 for match in re.finditer(r'docs/[\w./<>*${}\\-]*',text):
  token=match[0].rstrip('.');path=token.split('#')[0]
  if path in paths or path.startswith(('docs/specs/','docs/architect/')) or re.match(r'docs/decisions/00\d\d-',path):
   hits.append({'kind':'move-set-literal','text':match[0],'offset':match.start()})
  elif path=='docs' or any(p.startswith(path.rstrip('/')+'/') for p in paths):
   hits.append({'kind':'move-set-ancestor-prefix','text':match[0],'offset':match.start()})
 # Split constructors/regexes are not missed by literal docs/ matching.
 for match in re.finditer(r'''["'`]docs["'`]|docs\\?\[|docs\$\{|docs<''',text):
  hits.append({'kind':'split-or-template-docs-root','text':match[0],'offset':match.start()})
 return hits

def imports(text):
 out=[]
 for mt in re.finditer(r'''import\s+([\s\S]*?)\s+from\s*["']([^"']+)["']''',text):
  clause=mt[1].strip()
  # Restrict across statements; side-effect imports are not bindings.
  clause=clause.split(';')[-1].strip()
  for token in clause.replace('{','').replace('}','').split(','):
   parts=token.strip().split(' as ');name=parts[-1].strip()
   if re.fullmatch(r'\w+',name) and (parts[0].isupper() or re.search(r'(?:PATH|ROOT|DIR|FILE|DOC|SPEC)',parts[0]) or re.search(r'(?:Path|Root|Dir|File|Doc|Spec)$',parts[0]) and not re.search(r'\b'+re.escape(name)+r'\s*\(',text)):out.append((name,mt[2],parts[0]))
 return out

def constant_hazards(pin,file,text,seen=None):
 seen=set() if seen is None else seen
 if file in seen:return [{'kind':'unresolved-path-constant-cycle','file':file}]
 seen=seen|{file};out=[]
 # Fail closed for path constants on the other import syntaxes in this
 # population. Unsupported resolution stays judgment work, never neutral.
 marker=re.compile(r'(?:PATH|ROOT|DIR|FILE|DOC|SPEC)')
 for use in re.finditer(r'\buse\s+[^;]+;',text,re.S):
  names=[name for name in re.findall(r'\b[A-Z][A-Z_0-9]+\b',use[0]) if marker.search(name)]
  if names:out.append({'kind':'unresolved-rust-path-constant-import','names':names,'text':use[0]})
 for ns in re.finditer(r'''import\s*\*\s+as\s+(\w+)\s+from\s*["']([^"']+)["']''',text):
  names=[name for name in re.findall(r'\b'+re.escape(ns[1])+r'\.([A-Z][A-Z_0-9]+)',text) if marker.search(name)]
  if names:out.append({'kind':'unresolved-namespace-path-constant-import','names':names,'source':ns[2]})
 for req in re.finditer(r'''(?:const|let|var)\s*\{([^}]+)\}\s*=\s*require\s*\(''',text):
  names=[name for name in re.findall(r'\b[A-Z][A-Z_0-9]+\b',req[1]) if marker.search(name)]
  if names:out.append({'kind':'unresolved-require-path-constant-import','names':names})
 for name,source,export in imports(text):
  if not source.startswith('.'):out.append({'kind':'unresolved-path-constant-import','name':name,'source':source});continue
  f=posixpath.normpath(str(pathlib.PurePosixPath(file).parent/source))
  try:
   imported=b.body(pin,f);bindings=b.a.path_bindings(pin,f)
  except (subprocess.CalledProcessError,UnicodeDecodeError):out.append({'kind':'unresolved-path-constant-import','name':name,'source':f});continue
  if export not in bindings:out.append({'kind':'unresolved-path-constant-import','name':name,'source':f});continue
  todo=[export];visited=set();fragments=[]
  while todo:
   n=todo.pop()
   if n in visited:continue
   visited.add(n)
   for rhs in bindings.get(n,[]):
    if not isinstance(rhs,str):out.append({'kind':'unresolved-path-constant-import','name':name,'source':f});continue
    fragments.append(rhs);todo.extend(b.a.identifiers(rhs)&set(bindings))
  hs=literal_hazards('\n'.join(fragments))
  # Conservatively inspect nested path-constant imports at module scope too.
  hs+=constant_hazards(pin,f,imported,seen)
  if hs:out.append({'kind':'traced-move-set-or-unresolved-constant','name':name,'source':f,'sourceSha256':b.sha(imported),'hazards':hs})
 return out

def call_arguments(text,start):
 depth=1;quote=None;escaped=False
 for i in range(start,len(text)):
  c=text[i]
  if quote:
   if escaped:escaped=False
   elif c=='\\':escaped=True
   elif c==quote:quote=None
  elif c in "\"'`":quote=c
  elif c=='(':depth+=1
  elif c==')':
   depth-=1
   if depth==0:return text[start:i]
 return None

def constructed_hazards(text):
 """Open suffixes below retained roots cannot prove neutrality.
 A constructor with no docs text is accepted only with a fixed nonmoved leaf,
 an explicit temporary root, a non-document root, or a scalar join separator.
 """
 out=[];temp=b.temporary_roots(text);basenames={pathlib.PurePosixPath(e['oldPath']).name for e in model()['paths']}
 for mt in re.finditer(r'(?:(?:[A-Za-z_]\w*\.)?(?:join|resolve)|new URL)\(',text):
  args=call_arguments(text,mt.end())
  if args is None:
   out.append({'kind':'unparsed-path-constructor','text':mt[0],'offset':mt.start()});continue
  expr=mt[0]+args+')'
  if not args.strip():continue
  if expr.startswith('Promise.resolve(') or re.match(r'(?:resolve|\w+\.resolve)\((?:true|false|null|undefined|\d|\{|\[|\))',expr):continue
  if b.a.identifiers(expr)&temp or re.search(r'\b(?:tmpdir|temp_dir|tempdir|mkdtempSync|mkdtemp)\(',expr):continue
  strings=re.findall(r'''["']([^"']*)["']''',args)
  if any(re.match(r'(?:\.\./)*(?:src|test|tests|bin|scripts|packages|apps|fixtures|node_modules|\.fgos|\.git|target)(?:/|$)',v) for v in strings):continue
  if strings and all(v in ['','\n','\\n',',',', ',' ','|',':','/'] for v in strings) and re.fullmatch(r'''[\s\"'\\n, |:/]*''',args) and not re.search(r'path\.(?:join|resolve)',expr):continue
  # A fixed file leaf cannot name any member, and cannot enumerate a subtree.
  leaf=re.search(r'''["']([^"']+\.[A-Za-z0-9]+)["']\s*$''',args)
  if leaf and pathlib.PurePosixPath(leaf[1]).name not in basenames:continue
  if re.search(r'import\.meta\.(?:url|dirname)|__dirname|__filename',args) and not re.search(r'\$\{',args):continue
  # Plain array joins and Promise wrappers have no path role.
  if re.match(r'(?:results|lines|parts|errors|messages|args|chunks|rows|hits|items|commands|warnings|findings|ids|names)\.join',expr):continue
  out.append({'kind':'open-path-constructor','text':expr,'offset':mt.start()})
 for mt in re.finditer(r'`([^`]*\$\{[^`]+)`',text):
  expr=mt[0]
  if '/' in expr and not re.search(r'https?://',expr) and not (b.a.identifiers(expr)&temp):
   out.append({'kind':'open-path-template','text':expr,'offset':mt.start()})
 return out

@functools.lru_cache(None)
def context(pin,file):
 text=b.body(pin,file)
 return {'kind':'complete pinned file; superset of every passage/function','sha256':b.sha(text),'bytes':len(text.encode()),'lines':len(text.splitlines()),'literalHazards':literal_hazards(text),'constantHazards':constant_hazards(pin,file,text),'constructedHazards':constructed_hazards(text)}
def check(records=None,triage=None,moves=None):
 triage=b.rows('step-05-seam5-neutral-triage.jsonl') if triage is None else triage;records=b.rows('step-05-records/tests-cutover-neutral.jsonl') if records is None else records;baseline=json.loads((P/'step-05-seam5-batch3-input.json').read_text());pop={x['file']:x for x in baseline['remainingFilesInOrder']};refs=collections.defaultdict(list);dyn=collections.defaultdict(list)
 for x in b.rows('step-05-population-references.jsonl'):refs[x['file']].append(x)
 for x in b.rows('step-05-population-dynamic.jsonl'):dyn[x['file']].append(x)
 errors=[];counts=collections.Counter()
 def test(rule,f,ok):
  counts[rule]+=1
  if not ok:errors.append({'rule':rule,'where':f})
 test('r20-move-set','committed sources and complete derivation',(json.loads((P/'step-05-cutover-move-set.json').read_text()) if moves is None else moves)==model())
 test('r20-coverage','exact committed initial queue',baseline==json.loads(b.body(INPUT_QUEUE_PIN,BASE+'reports/phase-08/step-05-seam5-continuation.json')))
 test('r20-coverage','all initial 671 files',len(triage)==len(pop)==671 and {x['file'] for x in triage}==set(pop))
 expected=[]
 for t in triage:
  f=t['file'];ctx=context(PIN,f);safe=not any(ctx[k] for k in ['literalHazards','constantHazards','constructedHazards'])
  # Original census expressions must be safe too, including source drift.
  old=literal_hazards('\n'.join(x['expression'] for x in refs[f])+'\n'+'\n'.join(x['callSite'][4] for x in dyn[f]))
  test('r20-context',f,t=={'file':f,'inputCommit':PIN,'context':ctx,'originalOperandHazards':old,'wholeFileNeutralClosure':safe and not old})
  if safe and not old:expected.append(f)
 by={r['file']:r for r in records}
 test('r20-coverage','all and only proven neutral files',len(by)==len(records) and set(by)==set(expected))
 for f,r in by.items():
  text=b.body(PIN,f);ctx=context(PIN,f);mode=subprocess.check_output(['git','ls-tree',PIN,'--',f],cwd=ROOT,text=True).split()[0]
  test('r20-record',f,r==record(f,ctx,refs[f],dyn[f],mode))
 return {'kind':'R20 cutover-neutral invariant-preserve closures; no semantic admission or window review','files':len(records),'literalReferences':sum(len(r['references']) for r in records),'dynamicTuples':sum(len(r['dynamicTraces']) for r in records),'triagedFiles':len(triage),'moveSetSize':model()['pathCount'],'checks':dict(counts),'rules':{'r20-move-set':'Exact pinned Phase 6 alias plus registry move-set derivation','r20-context':'No moved literal, ancestor/template, traced constant or unresolved path-constant import in passage or whole-file context','r20-coverage':'Conserved initial queue and all-only proved closures','r20-record':'Pinned whole-file and original item identities; prior R19 rejects retained; invariant preserve only'},'failureCount':len(errors),'failures':errors,'headDrift':[]}

@functools.lru_cache(None)
def prior_triage():return {t['file']:t for t in b.rows('step-05-seam5-bulk-triage.jsonl')}
def record(file,ctx,refs,dyn,mode):
 prior=prior_triage()[file]
 priorby={d['id']:d for d in prior['tuples']}
 return {'file':file,'authorInputCommit':PIN,'sourceSha256':ctx['sha256'],'sourceMode':mode,'wholeFileRead':True,'wholeFileReadEvidence':{'bytes':ctx['bytes'],'lines':ctx['lines'],'sha256':ctx['sha256'],'method':ctx['kind']},'mechanicalClosure':{'ruleId':RULE,'disposition':'preserve','proof':ctx,'moveSetFile':str((P/'step-05-cutover-move-set.json').relative_to(ROOT)),'moveSetSha256':b.sha((P/'step-05-cutover-move-set.json').read_bytes()),'reason':'Every operand and complete file context is outside the cutover move set and has no open constructor or unresolved/traced path constant; Phase 9 action is preserve independently of admission.','phase9Proof':'Full npm test and cargo test --workspace after atomic cutover; pending, not claimed here.'},'references':[dict(x,disposition='preserve',ruleId=RULE) for x in refs],'dynamicTraces':[dict(x,disposition='preserve',ruleId=RULE,**({'priorR19Rejection':priorby[x['id']]} if priorby[x['id']]['status']=='mechanical-reject' else {})) for x in dyn],'diff':None,'rollbackDiff':None,'parked':[],'review':{'status':'checker-only mechanical closure; R20 exempts window review'}}
if __name__=='__main__':
 out=check();dump(P/'step-05-seam5-neutral-check.json',out);print(json.dumps(out));sys.exit(bool(out['failures']))
