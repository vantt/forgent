"""L12-72 semantic-record invariants shared by all four authored seams.
Source intervals describe operations, not the ±3/40 context windows. Adjacent
independent expressions (e.g. a role label and currentPath) are not one operand.
"""
import re,collections,json,pathlib,importlib.util,itertools,functools,subprocess
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
CATEGORIES={'non-census-document-read','root-only','scalar-pass-through','state-event-store','non-document-fs-probe','clone-directory','cargo-output-directory','accumulator','guard','text-label-join','table-row-serialization','finding-path-field','caller-data-formatting','comment-or-type','config-or-metadata','generated-data-text','plans-report-artifact'}
RULES={'a-passage-agreement':'All pairs of overlapping operation intervals on the same line/passage agree in admission and effective disposition; independent adjacent expressions have distinct source intervals.','b-real-blocker':'No listed boilerplate or verbatim blocker shared by parks in different files; every park names the missing input/obligation for its own file.','c-render-owner':'Every generated source-copy reference/tuple derives its disposition from the exact source owner; a park cites an actually parked source owner.','d-own-operand':'Each admitted dynamic tuple has its exact document-yielding sub-expression pathOperand in its pinned passage; every rejection names a closed R5 nonDocumentUse category.','e-retired-successor':'Preserved retired decision citations carry a live successorNote with a real heading anchor.'}
def idof(e):return e.get('referenceId',e.get('id'))
def allitems(r):return r['references']+r['dynamicTraces']+r.get('authorAddedReferences',[])
def intervals(e):
 if 'originalTuple' in e:
  w=e.get('operationWitness');return [w] if w else []
 return [{'line':s['line'],'columnStart':s['columnStart'],'columnEndExclusive':s['columnEndExclusive']} for s in e.get('sourceSpans',[])]
def pairs(r):
 # ALL pair combinations, including dynamic–dynamic, never first-match joins.
 for a,b in itertools.combinations(allitems(r),2):
  if any(x['line']==y['line'] and x['columnStart']<y['columnEndExclusive'] and y['columnStart']<x['columnEndExclusive'] for x in intervals(a) for y in intervals(b)):
   yield a,b

def effective(e):return e.get('sourceOwnerDisposition',e['disposition']) if e['disposition']=='render-join' else e['disposition']
@functools.lru_cache(None)
def prior_record(path,line):return json.loads((ROOT/path).read_text().splitlines()[line-1])
def owner(locator,by):
 r=by[locator['file']]
 if locator['kind']=='step5':return next(e for e in allitems(r) if idof(e)==locator['id'])
 if locator['kind']=='inheritedSourceSlots':return r['inheritedSourceSlots'][locator['index']]['edge']
 record=prior_record(locator['recordFile'],locator['recordLine']);return next(e for e in record['edges'] if e.get('slotKey')==locator['slotKey'])
def retired(e):
 text=e.get('matchedExpression') or (e.get('originalTuple') or [None]*5)[4] or ''
 return bool(re.search(r'docs/decisions/\d{4}-|\b0000-index\.md',text))
def normalise_blocker(text):
 """R12 compare dependencies after removing operand, id and line disguises."""
 text=re.sub(r"`[^`]*`|\"[^\"]*\"|'[^']*'", '<operand>', text or '')
 text=re.sub(r'\b(?:reference|dynamic|author-s4)[-\w]*|\b(?:D-ADR|tsk-)[\w-]+', '<id>', text)
 text=re.sub(r'(?<!\w)\d+(?:[–:-]\d+)*', '<number>', text)
 # Unquoted path prefixes and location carriers are operands too.
 text=re.sub(r'(?:[\w.-]+/)+[\w.*<>/-]+(?::[^\s]+)?', '<path>', text)
 return re.sub(r'\s+', ' ', text).strip().lower()

def passage_key(r,e):
 # Copies are one source passage, not new blockers; serialized state rows have
 # no hand-written passage (Lead gen Q1 explicitly accepts file-specific input).
 if r.get('generated'):
  if e.get('sourceOwner'):return json.dumps(e['sourceOwner'],sort_keys=True)
  return ('state-output',r['file'])
 spans=intervals(e)
 return (r['file'],tuple(sorted({x['line'] for x in spans})))

@functools.lru_cache(None)
def source_at(pin,file):
 return subprocess.check_output(['git','show',pin+':'+file],cwd=ROOT,text=True)
@functools.lru_cache(None)
def path_bindings(pin,file):
 text=source_at(pin,file);bindings=collections.defaultdict(list)
 # Declarations only: no caller/path metadata from neighbouring messages.
 for match in re.finditer(r'\b(?:const|let|var)\s+(\w+)\s*=\s*',text):
  rest=text[match.end():];end=rest.find(';');rhs=rest[:end] if 0<=end<1200 else rest.split('\n')[0]
  if re.match(r'(?:async\s*)?(?:function|\([^)]*\)\s*=>|\w+\s*=>)',rhs):continue
  bindings[match[1]].append(rhs)
 for match in re.finditer(r"import\s*\{([^}]+)\}\s*from\s*['\"](\.[^'\"]+)['\"]",text,re.S):
  imported=str((pathlib.PurePosixPath(file).parent/match[2]))
  import posixpath
  imported=posixpath.normpath(imported)
  for token in match[1].split(','):
   names=token.strip().split(' as ')
   if names[0]:bindings[names[-1]].append(('import',imported,names[0]))
 for match in re.finditer(r'for\s*\(const\s+\[([^]]+)\]\s+of\s+(\w+)',text):
  for name in re.findall(r'\b\w+\b',match[1]):bindings[name].append(match[2])
 return dict(bindings)
def identifiers(expr):
 templates=' '.join(re.findall(r'\$\{([^}]+)\}',expr))
 code=re.sub(r"\"(?:\\.|[^\"\\])*\"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`",' ',expr)
 return set(re.findall(r'\b[A-Za-z_$][\w$]*\b',code+' '+templates))
def literal_roots(expr):
 roots=set()
 if re.search(r"(?:^|[\s'\"`/])(?:\.\./)*plans(?:/|['\"])",expr):roots.add('plans')
 if re.search(r"(?:^|['\"`/])docs(?:/|['\"])",expr) or re.search(r"['\"](?:README|CHANGELOG|AGENTS|CLAUDE)\.md['\"]",expr):roots.add('documents')
 return roots
@functools.lru_cache(None)
def binding_roots(pin,file):
 bindings=path_bindings(pin,file);values={name:set() for name in bindings};deps={name:set() for name in bindings}
 for name,rhss in bindings.items():
  for rhs in rhss:
   if isinstance(rhs,tuple):
    _,f,n=rhs
    if n.isupper() and f!=file:
     if subprocess.run(['git','cat-file','-e',pin+':'+f],cwd=ROOT,stderr=subprocess.DEVNULL).returncode:
      values[name].add('documents') # unresolved import cannot prove plans-only neutrality
      continue
     values[name].update(literal_roots(' '.join(x for x in path_bindings(pin,f).get(n,[]) if isinstance(x,str))))
     # Imported public constants may themselves depend on local plan roots.
     todo=[n];seen=set()
     while todo:
      key=todo.pop()
      if key in seen:continue
      seen.add(key)
      for x in path_bindings(pin,f).get(key,[]):
       if isinstance(x,str):values[name].update(literal_roots(x));todo.extend(z for z in re.findall(r'\b[A-Z][A-Z_0-9]+\b',x) if z not in seen)
   else:
    values[name].update(literal_roots(rhs));deps[name].update(identifiers(rhs))
 for _ in range(len(values)+1):
  changed=False
  for name in values:
   new=set().union(*(values.get(dep,set()) for dep in deps[name])) if deps[name] else set()
   if not new<=values[name]:values[name].update(new);changed=True
  if not changed:break
 return values
@functools.lru_cache(None)
def expression_roots(pin,file,expr):
 roots=literal_roots(expr);values=binding_roots(pin,file)
 for name in identifiers(expr):roots.update(values.get(name,set()))
 return roots

def plans_only(r,e):
 if not r.get('wholeFileRead',True):return False
 pin=r['authorInputCommit'];file=r['file']
 expr=e.get('pathOperand') or (e.get('operationWitness') or {}).get('text') or (e.get('originalTuple') or [None]*5)[4] or e.get('matchedExpression','')
 roots=expression_roots(pin,file,expr)
 return roots=={'plans'}

RULES['b-real-blocker']='R12: no boilerplate dependency shared after quoted operands, paths, IDs and line numbers are normalized; copies join their source passage; serialized state rows use their accepted per-file input dependency.'
RULES['r11-plans-boundary']='R11: an operation rooted only in plans/** is rejected as plans-report-artifact; trace pinned declarations and imported constants, not adjacent context.'

def check(rs,context=None):
 by={r['file']:r for r in (context or rs)};errors=[];counts=collections.Counter();blocks=collections.defaultdict(set)
 for r in (context or rs):
  for e in allitems(r):
   if e.get('disposition')=='parked':blocks[normalise_blocker(e.get('blockedReason'))].add(str(passage_key(r,e)))
 def test(rule,loc,fn):
  counts[rule]+=1
  try:assert fn()
  except Exception as exc:errors.append({'rule':rule,'where':loc,'error':str(exc) or 'condition false'})
 for r in rs:
  f=r['file']
  for a,b in pairs(r):test('a-passage-agreement',f+':'+str(idof(a))+'/'+str(idof(b)),lambda a=a,b=b:(a['admission'],effective(a))==(b['admission'],effective(b)))
  for e in allitems(r):
   loc=f+':'+str(idof(e))
   if e.get('disposition')=='parked':
    def blocker(e=e):
     b=e.get('blockedReason') or ''
     return bool(b and f in b and (len(blocks[normalise_blocker(b)])==1 or r26_joined(r,e)) and not re.search(r'depends on supplied roots|no bounded artifact/export supplied|preserve gate bytes|exact source slot / source-data parity must own',b,re.I))
    test('b-real-blocker',loc,blocker)
   if r.get('generated') and r.get('sourceRenderProvenance',{}).get('sourceFile'):
    def render(e=e):
     o=owner(e['sourceOwner'],by);disp=o['disposition']
     if 'originalTuple' not in e:
      assert e['disposition']==('parked' if disp=='parked' else 'render-join')
      assert e['sourceOwnerDisposition']==disp
     else:
      assert e['admission']==o['admission']
      assert e['disposition']==('parked' if disp=='parked' else 'render-join' if e['admission']=='ADMIT' else 'preserve')
      assert e['sourceOwnerDisposition']==disp
     if e['disposition']=='parked':assert e['sourceOwner']['file'] in e['blockedReason'] and disp=='parked'
     return True
    test('c-render-owner',loc,render)
   if plans_only(r,e):test('r11-plans-boundary',loc,lambda e=e:e['admission']=='REJECT' and e.get('nonDocumentUse')=='plans-report-artifact')
   if e.get('nonDocumentUse')=='non-census-document-read':
    def noncensus(e=e):
     if e.get('nonCensusReadProof'):
      w=e['nonCensusReadProof'];assert w['root'] in ['.','core/','domains/','.claude/'] and w['sourceSha256']==r['sourceSha256']
      assert not re.search(r"docs/|['\"]docs['\"]",w['operand'])
      op=e['operationWitness'];assert w['operand']==op['text'] and source_at(r['authorInputCommit'],f).splitlines()[op['line']-1][op['columnStart']-1:op['columnEndExclusive']-1]==w['operand']
      assert e['admission']=='REJECT' and e['disposition']=='preserve'
      assert not literal_roots(w['operand'])-({'documents'} if w['root']=='.' and re.search(r'(?:AGENTS|README)\.md',w['operand']) else set())
      move=json.loads((P/'step-05-cutover-move-set.json').read_text());assert all(x['oldPath'].startswith('docs/') for x in move['paths'])
      return True
     path=e['realReadPath'];assert not path.startswith('docs/') and path in source_at(r['authorInputCommit'],f)
     move=json.loads((P/'step-05-cutover-move-set.json').read_text());assert all(x['oldPath'].startswith('docs/') for x in move['paths'])
     assert source_at(r['authorInputCommit'],path) and e['disposition']=='preserve' and e['admission']=='REJECT'
     w=e['owningAssertion'];assert source_at(r['authorInputCommit'],f).splitlines()[w['line']-1]==w['text']
     return True
    test('r27-noncensus-document-read',loc,noncensus)
   if 'originalTuple' in e:
    def operand(e=e):
     if e['admission']=='REJECT':return e.get('nonDocumentUse') in CATEGORIES and not e.get('pathOperand')
     p=e.get('pathOperand');c=e.get('currentPassage',{}).get('text','');w=e.get('pathOperandWitness',{})
     
     if not(p and p.strip() and p in c and w.get('text')==p and w.get('line') is not None and e.get('nonDocumentUse') is None):return False
     lines=c.splitlines();n=w['line']-e['currentPassage']['startLine'];assert 0<=n<len(lines)
     assert lines[n][w['columnStart']-1:w['columnEndExclusive']-1]==p.split('\n')[0]
     return True
    test('d-own-operand',loc,operand)
   if e.get('disposition') in ['preserve','render-join'] and retired(e):
    def successor(e=e):
     note=e.get('successorNote');assert isinstance(note,str) and note
     path,sep,anchor=note.partition('#');file=ROOT/path;assert source_at(r['authorInputCommit'],path) is not None
     if sep:
      def slug(s):return re.sub(r'\s','-',re.sub(r'[^\w\s-]','',s.lstrip('# ').lower()))
      headings=[h for h in source_at(r['authorInputCommit'],path).splitlines() if h.startswith('#') and slug(h)==anchor];assert headings
      text=e.get('matchedExpression') or (e.get('originalTuple') or [None]*5)[4] or ''
      code=re.search(r'docs/decisions/(\d{4})-',text)
      if code and code[1]!='0000':assert any(re.search(r'\b'+code[1]+r'\b',h) for h in headings),'successor heading must own the cited decision id'
     return True
    test('e-retired-successor',loc,successor)
 return {'rules':RULES,'checks':dict(counts),'failures':errors,'failureCount':len(errors)}

def review_obligations(rs,index,test,rule,sha,read):
 """R1 replaces full-evidence current projections with Lead window re-review.
 Historical packets remain hash-bound historical evidence. Current canonical
 changes are bound to the complete re-review list; no acceptance is inferred.
 """
 for part in index['parts']:
  def integrity(part=part):
   raw=(P/part['payload']).read_bytes()
   expected=part.get('sha256',part.get('payloadSha256'))
   assert sha(raw)==expected and len(raw)==part['bytes']<=400000
   d=json.loads(raw);items=d.get('records',d.get('items',[]))
   if 'records' in d:assert len(items)==part['records']<=60
  test(rule,'historical packet '+part['payload'],integrity)
 listing=read('step-05-seam4-rereview-list.json');listed={x['file']:x for x in listing['canonicalRecords']}
 for r in rs:
  def bind(r=r):
   assert sha(json.dumps(r,ensure_ascii=False,separators=(',',':')))==listed[r['file']]['recordSha256']
   if listed[r['file']]['itemsChanged'] and not r.get('generated'):assert r['file'] in listing['sourceRecords']
   assert listing['reviewStatus']=='pending Lead repack and independent semantic review'
  test(rule,'current re-review obligation '+r['file'],bind)

@functools.lru_cache(None)
def r26_module():
 s=importlib.util.spec_from_file_location('r26shared',P/'step-05-proposed-move-rules.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def r26_joined(r,e):return r26_module().joined(r,e)
