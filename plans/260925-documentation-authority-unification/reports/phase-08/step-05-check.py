"""Step 5 full pilot checker: schema/coverage, pins, exact patches, receipts, review sizing.
R17 validates consumer/source/target bytes at their own git input pins; current
report/log integrity remains checked on disk because those are newly authored evidence.
Reuses Step 3's span, bounds, full-file diff and hunk primitives. No consumers
are mutated. Semantic judgments remain subject to mandatory independent review.
"""
import sys
from functools import lru_cache
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,hashlib,collections,copy,argparse,re
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
sp=importlib.util.spec_from_file_location('step03',P/'step-03-check.py');m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
sha=m.sha
SEAMS=['gateway-contract','cli-help-messages','setup-doctor-roots']
PROMOTED={'reference-000228','reference-000277','reference-003682','reference-003687','reference-003708','reference-003749','reference-003771','reference-003784','reference-003868'}
asp=importlib.util.spec_from_file_location('admission',P/'step-05-admission-rules.py');admission=importlib.util.module_from_spec(asp);asp.loader.exec_module(admission)
def read(n):return json.loads((P/n).read_text())
def rows(n):return [json.loads(l) for l in (P/n).read_text().splitlines()]
def load():return [r for s in SEAMS for r in rows('step-05-records/'+s+'.jsonl')]
def candidate(r):
 before=pinned(r['authorInputCommit'],r['file']);edits={}
 for e in r['references']+[d for d in r['dynamicTraces'] if d.get('sourceSpanReplacements')]:
  if e['disposition']!='patch':continue
  bounds=m.bounds(before,e['sourceSpans'])
  replacements=e.get('sourceSpanReplacements',[e['proposedReplacement']])
  assert len(bounds)==len(replacements),'each physical source span has one explicit replacement'
  for (a,b),replacement in zip(bounds,replacements):
   if (a,b) in edits:assert edits[a,b]==replacement,'duplicate qualified refs disagree'
   edits[a,b]=replacement
 ranges=sorted(edits)
 assert all(a>=ranges[i-1][1] for i,(a,b) in enumerate(ranges) if i),'overlapping distinct patch ranges'
 after=before
 for (a,b),v in sorted(edits.items(),reverse=True):after=after[:a]+v+after[b:]
 return before,after
@lru_cache(None)
def pinned(pin,file):
 return m.blob(pin,file).decode()

def input_pin(entry,default):
 provenance=entry.get('provenance','')
 match=re.match(r'^([0-9a-f]{40}):',provenance)
 return entry.get('inputCommit') or (match[1] if match else default)

@lru_cache(maxsize=32768)
def _head_matching_lines(body,text):
 # Pure lookup over immutable strings: repeat probes reuse the exact same
 # diagnostic result, while a changed HEAD body or span has a distinct key.
 lines=body.splitlines();width=len(text.splitlines())
 return tuple(n for n in range(1,len(lines)+1) if '\n'.join(lines[n-1:n-1+width]).find(text)>=0)

def head_drift(rs):
 """Non-failing Step 7 queue, comparing immutable pin to git HEAD (never disk)."""
 drift=[];locators={}
 for recordfile in sorted((P/'step-05-records').glob('*.jsonl')):
  for n,line in enumerate(recordfile.read_text().splitlines(),1):
   locators[json.loads(line)['file']]={'recordFile':str(recordfile.relative_to(ROOT)),'recordLine':n}
 for r in rs:
  if not r.get('wholeFileRead'):continue
  f=r['file'];before=pinned(r['authorInputCommit'],f)
  try:after=pinned('HEAD',f)
  except Exception:after=''
  if sha(before)==sha(after):continue
  moved=[]
  for e in r['references']+r['dynamicTraces']+r.get('authorAddedReferences',[]):
   spans=e.get('sourceSpans',[])
   if e.get('currentPassage'):
    c=e['currentPassage'];spans=spans+[{'line':c['startLine'],'text':c['text']}]
   for span in spans:
    line=span['line'];text=span['text'];lines=after.splitlines();col=span.get('columnStart',1)-1
    same=(lines[line-1][col:col+len(text)]==text) if 0<line<=len(lines) and '\n' not in text else '\n'.join(lines[line-1:line-1+len(text.splitlines())])==text
    if not same:moved.append({'id':e.get('referenceId',e.get('id')),'pinnedSpan':span,'headMatchingLines':list(_head_matching_lines(after,text))})
  drift.append({'file':f,'record':locators.get(f,{'file':f}),'inputCommit':r['authorInputCommit'],'pinnedHash':sha(before),'headHash':sha(after),'movedSpans':moved,'dependency':'Step 7 final-pin assembly; L12-58(1), L12-76 R17','failing':False})
 return drift

def dynamic_operand(d):
 """Syntax gate over the own operation, never over neighbouring doc words.
 Path inputs/normalizers, coupled state paths and generated-surface paths are
 operands; metadata labels, comments, types, guards and formatting are not.
 This is a necessary admission check, not a substitute for semantic review.
 """
 if d.get('pathOperand'):
  return d['pathOperand'] in d['currentPassage']['text'] and d.get('nonDocumentUse') is None
 x=d['originalTuple'][4];c=d['currentPassage'];lines=c['text'].splitlines()
 i=(d['currentLine'] or c['startLine'])-c['startLine'];line=lines[i] if 0<=i<len(lines) else ''
 if line.lstrip().startswith(('//','/*','*')):return False
 if re.search(r'^(?:rootType|rootOwner|fgosDir)\s*:',x):return False
 if 'new Map(' in x or 'scope ===' in x or 'new URL(' in x:return False
 if re.search(r'^(?:root|path|dir):\s*(?:&|path::|std::)',x):return False
 if x=='path::Path' or 'JSON.stringify(root)' in x:return False
 if d['originalTuple'][5]=='template-string':
  return bool(re.search(r'docs/|HOW_TO_DOC|\$\{(?:manifestPath|indexPath|docPath|targetPath)\}',x))
 if re.search(r'(?:path\.(?:join|resolve|relative|isAbsolute|win32\.normalize)|\w+\.join\(|PathBuf::from|temp_dir\(|realpathSync\()',x):
  if re.match(r"join\(",x) or re.match(r"(?:parts|lines|message|stdout_thread|stderr_thread)\.join",x):pass
  else:return True
 if re.search(r'join\(format!|^join\("(?:docs|history)"|^docs_history_root = state',x):return True
 if 'std::fs::write(' in c['text'] and 'docs/contracts/' in c['text'] and 'openapi:' in line:return True
 if re.search(r'^(?:manifestPath|path)\s*:',x):return True
 if 'geminiCommandPathForIntent(' in x or ('${targetPath}' in x and 'tmp' in x) or 'packagedRelPath = ' in x:return True
 if x=="join('/')" and re.search(r'windowsPathCollisionKey|fragmentPathForCanonicalReference',d['caller']['declaration']):return True
 if d['originalTuple'][5]=='template-string':
  return bool(re.search(r'docs/|HOW_TO_DOC|\$\{(?:manifestPath|indexPath|docPath|targetPath)\}',x))
 if re.search(r'^(?:root|\w*(?:Root|Dir|Path)|roots|sharedRoots)\s*=\s*(?:mainCheckout|resolveMainCheckout|resolveProjectRoot|canonicalSharedRoots|fragmentPathForCanonicalReference|\[)',x):return True
 if re.search(r'^(?:root|relPath|sourcePath|canonicalDir|targetRelDir|relativeFragmentPath|filePath|destinationRelativePath|effectiveSetRelativePath|ledgerRelativePath)\s*:',x):return True
 if 'currentPath' in x and ('captureId' in x or 'aliases' in x):return True
 if x.startswith('coreRoot :') or x.startswith('componentsRoot :') or x.startswith('domainsRoot :'):return True
 if x.startswith('containmentRoot ='):return True
 if "join('/')" in x:
  return bool(re.search(r'(?:[Pp]ath|\.split\(path\.sep\))',line)) and 's.name' not in line
 if re.search(r'^(?:relPath|sourceRelativePath|matchedPath|fragmentPath|absoluteProjectPathPattern)\s*=',x):return True
 if x.startswith('matchedRoot') and ('root.real' in x):return True
 return False

def passage_joins(r):
 """Only overlapping literal operands or actual dynamic path/message operands.
 Pure schema properties are not operations merely because their help has a path.
 """
 refs=r['references'];pairs=[]
 for i,e in enumerate(refs):
  for f in refs[i+1:]:
   if any(a['line']==b['line'] and a['columnStart']<b['columnEndExclusive'] and b['columnStart']<a['columnEndExclusive'] for a in e['sourceSpans'] for b in f['sourceSpans']):pairs.append((e,f))
 for d in r['dynamicTraces']:
  if not dynamic_operand(d):continue
  for e in refs:
   if e['admission']=='ADMIT' and e['matchedExpression'] in d['originalTuple'][4] and any(s['line']==d['currentLine'] for s in e['sourceSpans']):pairs.append((e,d))
 return pairs

@lru_cache(None)
def test_grep(pin,old):
 # Literal and JS-regexp spellings both carry old pointers in owning proofs.
 needles=sorted({old,old.replace('/','\\/'),old.replace('/','\\/').replace('.','\\.')})
 found={}
 import subprocess
 for needle in needles:
  cmd=['git','grep','-n','-F',needle,pin,'--','test/']
  proc=subprocess.run(cmd,cwd=ROOT,capture_output=True,text=True)
  assert proc.returncode in [0,1],proc.stderr
  for hit in proc.stdout.splitlines():
   path,number,text=hit[len(pin)+1:].split(':',2)
   found[path,int(number)]={'file':path,'line':int(number),'text':text,'sourceSha256':sha(pinned(pin,path))}
 return {'inputCommit':pin,'oldPointer':old,'method':'git grep -n -F at input pin under test/; literal and escaped slash/dot spellings','needles':needles,'matches':[found[k] for k in sorted(found)]}

@lru_cache(None)
def prior_edges(path,file):
 records=rows(str(pathlib.Path(path).relative_to(P.relative_to(ROOT))))
 return [e for r in records if r.get('file')==file for e in r.get('edges',r.get('slots',[]))]

RULES={
 'passage-outcome':'Overlapping literal operands and their dynamic path/message operation share admission and disposition.',
 'inherited-outcome':'Joined Step 3/4 slots keep their disposition unless an explicit pinned evidence-backed override exists.',
 'pinned-passage':'Every currentPassage exists at its exact line range in the pinned file, including relocation parks.',
 'dynamic-operand':'Every admitted dynamic operation constructs/carries an actual path or document operand, not neighbouring metadata or formatting.',
 'co-cut-grep':'Every emitted patch pins complete literal/escaped test grep results and joins every match to record, cutover spec and receipt.',
 'retiring-retained':'A preserve may not use a retained witness for a target under retiring docs/specs or docs/architect; provenance must be explicit.',
 'coverage':'Every selected file, literal, original origin and dynamic tuple is admitted or rejected exactly once.',
 'source-pins':'Whole-file bytes/mode/current pin are real; prior record hashes and protected pins stay equal.',
 'source-spans':'Current reference spans/passage and dynamic context match full source; unresolved relocation parks.',
 'rejections':'Rejection names its exact own passage/non-document operation and cannot carry an active patch.',
 'parks':'Every parked reference/tuple has its own blocker and dependency; no execution-ready park.',
 'patches':'One complete deterministic applicable diff per current file; exact after hash and inverse rollback.',
 'targets':'Pointer targets are current exact claim holders, not aliases or frozen generated-index rename copies.',
 'fixture-provenance':'Every admitted synthetic fixture pins its constructor/owning test and proves its temporary target is not an alias.',
 'generated':'Generated output bytes cannot receive authored diffs; owning source/generator must be joined.',
 'receipts':'All required comparison fields/current/candidate/proofs/deltas/readiness and per-file joins exist.',
 'missing-proof':'Missing/not-run proof cannot claim passing parity; passed proof has real log/hash and exit 0.',
 'gateway':'Reuse pinned complete file equality; HTTP missing/error/content-type/fresh read is never inferred.',
 'setup':'Parsed owner/path sets, scan-root deltas, sourceCaptureIds and inventory/export gaps explicit.',
 'message-deltas':'Every admitted patch has exact current/candidate emitted expression and changelog prerequisite.',
 'review':'Every file/reference/tuple/source byte appears in hash-bound parts <=60 records / 400000 bytes; no sample.',
}

RULES.update(admission.RULES)

def check(rs,receipts=None,index=None,check_packets=True):
 receipts=receipts if receipts is not None else read('step-05-pilot-parity-receipts.json')['receipts'];index=index if index is not None else read('step-05-pilot-review-index.json')
 errors=[];checks=collections.Counter();sourcegrep=[]
 def test(rule,where,fn):
  checks[rule]+=1
  try:
   verdict=fn();assert bool(verdict) or (verdict is None and fn.__name__!='<lambda>')
  except Exception as exc:errors.append({'rule':rule,'where':where,'error':str(exc) or 'condition false'})
 pop=rows('step-05-population-references.jsonl');expected={r['id']:r for r in pop if r['seam'] in SEAMS or r['id'] in PROMOTED}
 expected_files={r['file'] for r in expected.values()}|{r['file'] for r in rows('step-05-population-files.jsonl') if r['seam'] in SEAMS}|{'bin/fgos.mjs'}
 test('coverage','file population',lambda:len(rs)==len(expected_files) and {r['file'] for r in rs}==expected_files)
 allrefs=[e['referenceId'] for r in rs for e in r['references']]
 test('coverage','literal population',lambda:len(allrefs)==len(set(allrefs)) and set(allrefs)==set(expected))
 dynamic=rows('step-05-population-dynamic.jsonl')
 expected_dyn={d['id']:d for d in dynamic if d['seam'] in SEAMS}
 alldyn=[d['id'] for r in rs for d in r['dynamicTraces']]
 test('coverage','dynamic population',lambda:len(alldyn)==len(set(alldyn)) and set(alldyn)==set(expected_dyn))
 rec={x['id']:x for x in receipts};template=read('step-05-parity-receipt-template.json')
 for r in rs:
  f=r['file'];before=pinned(r['authorInputCommit'],f)
  def pins():
   assert r['sourceSha256']==sha(before) and r['wholeFileRead'] is True
   assert r['wholeFileReadEvidence']['bytes']==len(before.encode()) and r['wholeFileReadEvidence']['lines']==len(before.splitlines())
   assert r['sourceMode']==m.git('ls-tree',r['authorInputCommit'],'--',f).decode().split()[0]
   assert m.blob(r['authorInputCommit'],f).decode()==before
   for p in r['priorRecordRefs']:assert sha((ROOT/p['recordFile']).read_bytes())==p['recordSha256']
   for path,digest in r['protectedPins'].items():assert sha(m.blob(r['authorInputCommit'],path))==digest
   assert r['review']['status']=='pending'
  test('source-pins',f,pins)

  def census_grep():
   # Full pinned-file lexical sweep of legacy census roots; generated/current
   # docs/platform and plans/reports comments are deliberately outside that scope.
   # Constructed operands retain separate exact dynamic population/passage checks.
   pattern=r'docs/(?:history|specs|architect|contracts|how-to|explanation|reference|tutorials|decisions)(?![\w-])(?:/[^\s\x22\x27`<>),;]*)?'
   source=pinned(r['authorInputCommit'],f)
   for n,line in enumerate(source.splitlines(),1):
    for hit in re.finditer(pattern,line):
     token=hit[0]
     selected=[e['referenceId'] for e in r['references'] if any(span['line']==n and (token in span['text'] or span['text'] in token) for span in e['sourceSpans'])]
     population=[e['id'] for e in pop if e['file']==f and token in e['expression']]
     prior=[slot['edgeId'] for pr in r['priorRecordRefs'] for slot in pr['slots'] if any(token in span['text'] or span['text'] in token for span in slot['sourceSpans'])]
     supplemental=[e for e in rec[r['receiptIds'][0]].get('postCensusCode',[]) if e.get('file')==f and e.get('line')==n and e.get('text')==line and e.get('pin')==r['authorInputCommit']]
     if supplemental:
      assert line.lstrip().startswith('//') and token not in pinned('42edba2b08d26ab8dcabe4859a301e1589fa8e6b',f)
     sourcegrep.append({'file':f,'line':n,'token':token,'pilotIds':selected,'populationIds':population,'priorSlotIds':prior,'postCensusComment':bool(supplemental)})
     assert selected or population or prior or supplemental,'unaccounted pinned legacy-root grep hit at '+str(n)+': '+token
  test('coverage','whole-file census versus grep '+f,census_grep)


  for a,b in passage_joins(r):
   aid=a.get('referenceId',a.get('id'));bid=b.get('referenceId',b.get('id'))
   test('passage-outcome',f+':'+aid+' / '+bid,lambda a=a,b=b:(a['admission'],a['disposition'])==(b['admission'],b['disposition']))
  for e in r['references']:
   for pr in r['priorRecordRefs']:
    ids={o['id'] for o in e['inventoryOrigins']}
    for old in prior_edges(pr['recordFile'],f):
     if not old.get('edgeId') or old['edgeId'] not in ids:continue
     def inherited(e=e,old=old,pr=pr):
      if e['disposition']==old['disposition'] or admission.r26_joined(r,e):return True
      if e.get('rulingOverride')=='L12-83 R8' and admission.r26_module().live_holder_joined(r,e):return True
      o=e.get('inheritedOverride',{})
      assert o['priorSlotKey']==old['slotKey'] and o['recordFile']==pr['recordFile'] and o['recordSha256']==pr['recordSha256']
      assert o['from']==old['disposition'] and o['to']==e['disposition'] and o['ruling']=='L12-69'
      assert o['reason'] and o['evidence']['inputCommit']==r['authorInputCommit'] and o['evidence']['text'] in pinned(r['authorInputCommit'],f)
     test('inherited-outcome',f+':'+e['referenceId']+':'+old['edgeId'],inherited)
  specs=read('step-05-pilot-cutover-specs.json')['patches']
  for e in r['references']:
   if e['disposition']!='patch':continue
   def grep_proof(e=e):
    expected_grep=test_grep(r['authorInputCommit'],e['matchedExpression'])
    assert e.get('coCutTestGrep')==expected_grep
    spec=next(s for s in specs if s['file']==f)
    receipt=rec[e['receiptId']]
    assert expected_grep in spec['coCutTestGreps'] and expected_grep in receipt['coCutTestGreps']
    for hit in expected_grep['matches']:
     assert all(hit['file'] in x['coCutPaths'] for x in [r,spec,receipt])
     edit=next(t for t in spec['coCutTestEdits'] if t['file']==hit['file'] and t['referenceId']==e['referenceId'])
     assert hit in edit['grepMatches'] and edit in receipt['coCutTestEdits']
     assert edit['sourceSha256']==hit['sourceSha256'] and edit['newPointer']==e['proposedReplacement']
     source=pinned(r['authorInputCommit'],hit['file']);updated=source
     for old,new in edit['substitutions']:updated=updated.replace(old,new)
     assert sha(updated)==edit['expectedAfterSha256']
     decisions=edit['grepDecisions'];assert [d['match'] for d in decisions]==edit['grepMatches']
     for d in decisions:
      assert d['reason'].startswith('L12-69:') and d['oldLine']==d['match']['text']
      assert source.splitlines()[d['match']['line']-1]==d['oldLine']
      assert d['disposition'] in ['patch','preserve']
      if d['disposition']=='preserve':assert d['newLine']==d['oldLine'] and d['oldLine'] in updated
      else:assert d['oldLine']!=d['newLine'] and [d['oldLine'],d['newLine']] in edit['substitutions'] and d['newLine'] in updated
     assert len(edit['substitutions'])==sum(d['disposition']=='patch' for d in decisions)
     assert edit['disposition']==('patch' if source!=updated else 'preserve')
     assert edit['diff']==(m.make_diff(hit['file'],source,updated) or None) and edit['rollbackDiff']==(m.make_diff(hit['file'],updated,source) or None)
   test('co-cut-grep',f+':'+e['referenceId'],grep_proof)

  test('receipts',f,lambda:len(r['receiptIds'])==1 and all(x in rec for x in r['receiptIds']))
  for e in r['references']:
   def retiring(e=e):
    if e['disposition']=='preserve' and re.search(r'docs/(?:specs|architect)/',str(e.get('target') or e.get('matchedExpression'))):
     assert not re.search(r'retained',str(e.get('resolverWitness',{})),re.I),'retiring tree cannot be a retained witness'
   test('retiring-retained',f+':'+e['referenceId'],retiring)
   loc=f+':'+e['referenceId'];orig=expected.get(e['referenceId'],{})
   test('coverage',loc,lambda e=e,orig=orig:e['inventoryOrigins']==orig.get('origins') and e['originalSourceSpans']==orig.get('sourceSpans') and e['matchedExpression']==orig.get('expression') and e['admission'] in ['ADMIT','REJECT'])
   def spans(e=e):
    if not e['sourceSpans']:
     assert e['disposition']=='parked' and e['blockedReason'];return
    m.spans_text(before,e['sourceSpans']);a=e['passageSpan']['startLine'];b=e['passageSpan']['endLine']
    assert e['passage']=='\n'.join(before.splitlines()[a-1:b])
   test('source-spans',loc,spans)
   if e['admission']=='ADMIT':test('receipts',loc,lambda e=e:e.get('proofCommand') and e.get('parityObligation') and e['receiptId'] in rec)
   if e['admission']=='REJECT':test('rejections',loc,lambda e=e:e['disposition']=='preserve' and (e['role']=='comment' or e['role']=='usage-placeholder' and e.get('nonDocumentUse')=='usage-placeholder' and e['matchedExpression']=='docs/quadrant-dir>' and '<docs/quadrant-dir>' in e['passage']) and e['passage'] and repr(e['passage']) in e['reason'] and 'L12-' in e['reason'])
   if e['disposition']=='parked':test('parks',loc,lambda e=e:e['admission']=='ADMIT' and e['blockedReason'] and e['dependency'] and e['blockedCategory'] and e['dependencyCategory'] and e['timing']=='phase9' and not e['diffHunk'])
   if e['role']=='synthetic-fixture':
    def fixture(e=e):
     w=e['fixtureProvenance'];assert w and w['sourceFile']==f and w['sourceSha256']==sha(before)
     assert w['fullConstructionPassage'] in before and w['owningTest']['declaration'] in w['fullConstructionPassage'] and w['provenance']
     assert e['aliasWriteCheck']['destinationIsAlias'] is False
    test('fixture-provenance',loc,fixture)
   if e['disposition']=='patch':
    def target(e=e):
     w=e['resolverWitness'];assert e['admission']=='ADMIT' and e['timing']=='phase9'
     assert e['target'] and sha(m.blob(r['authorInputCommit'],e['target']))==w['targetSha256']
     assert e['target']!='docs/knowledge/decisions-index/decision-record.md'
     assert not e['aliasWriteCheck']['isWriter'] and e['aliasWriteCheck']['destinationIsAlias'] is False
     if w.get('registryPath'):
      assert sha(m.blob(r['authorInputCommit'],w['registryPath']))==w['registrySha256']
      docs=json.loads(pinned(r['authorInputCommit'],w['registryPath']))['docs'];hits=[d for d in docs if w['alias'] in d.get('aliases',[]) and d.get('docLifecycle')!='retired'];assert len(hits)==1 and hits[0]['currentPath']==e['target']
     if e['anchor']:
      assert any(e['anchor'] in (a['anchor'],a.get('githubSlug')) for a in m.anchors(r['authorInputCommit'],e['target']))
    test('targets',loc,target)
  for d in r['dynamicTraces']:
   loc=f+':'+d['id'];original=expected_dyn.get(d['id'],{})
   test('coverage',loc,lambda d=d,original=original:d['originalTuple']==original.get('callSite') and d['inventoryOrigins']==original.get('inventories') and d['admission'] in ['ADMIT','REJECT'])
   def dc(d=d):
    c=d['currentPassage']
    if d['currentLine'] is None:assert d['disposition']=='parked' and 'relocation' in d['blockedReason'] or d['disposition']=='parked' and 'relocate' in d['blockedReason'] or d['disposition']=='parked' and 'rebind' in d['blockedReason'];return
    assert c['text']=='\n'.join(before.splitlines()[c['startLine']-1:c['endLine']])
    assert d['caller']['declaration'] and d['inputs']
   test('source-spans',loc,dc)
   c=d['currentPassage'];pinbody=pinned(r['authorInputCommit'],f)
   test('pinned-passage',loc,lambda c=c:1<=c['startLine']<=c['endLine']<=len(pinbody.splitlines()) and c['text']=='\n'.join(pinbody.splitlines()[c['startLine']-1:c['endLine']]))
   if d['admission']=='ADMIT':test('dynamic-operand',loc,lambda d=d:dynamic_operand(d))

   if d['admission']=='ADMIT':test('receipts',loc,lambda d=d:d.get('proofCommand') and d.get('parityObligation') and d['receiptId'] in rec)
   if d['admission']=='REJECT':test('rejections',loc,lambda d=d:d['disposition']=='preserve' and d['rejectedAsUnrelatedReason'] and (repr(d['originalTuple'][4]) in d['reason'] or 'Concrete gateway function' in d['reason'] or 'type/import' in d['reason']))
   if d['disposition']=='parked':test('parks',loc,lambda d=d:d['admission']=='ADMIT' and d['blockedReason'] and d['stateExportDependency'] and d['blockedSeams'])
  def patch():
   a,b=candidate(r);diff=m.make_diff(f,a,b) or None
   assert diff==r['diff'] and sha(b)==r['expectedAfterSha256']
   assert (m.make_diff(f,b,a) or None)==r['rollbackDiff']
   for e in r['references']:
    if e['disposition']=='patch':assert e['diffHunk']==r['diff']
   if diff:
    assert 'CHANGELOG.md' in r['coCutPaths']
    changed=[(a,b) for e in r['references'] if e['disposition']=='patch' for a,b in m.bounds(before,e['sourceSpans'])]
    for e in r['references']:
     if e['disposition']!='patch':assert all(not(a<y and x<b) for a,b in m.bounds(before,e['sourceSpans']) for x,y in changed),'unpatched/parked reference changed through overlapping qualifier'
  test('patches',f,patch)
  test('generated',f,lambda:not r['diff'] or not f.startswith(('docs/','.agents/','plugins/','.claude/')))
 for x in receipts:
  seam=x['seam'];loc=x['id']
  def receipt(x=x,seam=seam):
   for field in template['receipt']:assert field in x,'missing '+field
   assert x['currentInputs'] and x['candidateInputs']
   assert x['comparison']['comparedFields']==template['seamTemplates'][seam]['requiredComparisons']
   assert x['comparison']['normalization'] and 'pending' in x['readiness'] and x['review']['status']=='pending'
   for f in x['currentInputs']:assert sha(m.blob(input_pin(f,x['inputCommit']),f['path']))==f['sha256']
   for fld in ['currentOutputSet','candidateOutputSet','intentionalDeltas','unexpectedDeltas']:assert fld in x['comparison']
  test('receipts',loc,receipt)
  for p in x['proofs']:
   def pf(p=p):
    assert all(k in p for k in ['command','owningBehavior','exit','logPath','logSha256','status'])
    if p['status']=='pass':assert p['exit']==0 and p['logPath'] and sha((ROOT/p['logPath']).read_bytes())==p['logSha256']
    if p['command']=='missing':assert p['status']=='missing' and p['exit'] is None
    if p['status'] in ['missing','not-run']:assert p['exit'] is None and p['logPath'] is None
   test('missing-proof',loc+':'+p['owningBehavior'],pf)
  if seam=='gateway-contract':
   def gateway(x=x):
    c=x['comparison'];assert c['fileParityReceipt']['recheck']['completeParsedEqual'] and c['fileParityReceipt']['recheck']['rawBytesEqual']
    assert sha((ROOT/c['fileParityReceipt']['path']).read_bytes())==c['fileParityReceipt']['sha256']
    assert c['currentOutputSet']==c['candidateOutputSet'] and (c['pathDecision'].startswith('preserve both') if not x.get('proposedMoveUnits') else c['pathDecision'].startswith('pending retention-or-move'))
    assert c['currentOutputSet'][0]['failure']=={'status':500,'contentType':'application/json','category':'unexpected','exitCode':None,'messageTemplate':'could not read the OpenAPI contract at {root}/docs/contracts/fgos-gateway-api-v1.yaml: {err}'}
    assert any(p['status']=='missing' and 'HTTP body' in p['owningBehavior'] for p in x['proofs'])
    assert c['conditionalMovedReadDelta']['httpMissingReadErrorOld']!=c['conditionalMovedReadDelta']['httpMissingReadErrorNew']
   test('gateway',loc,gateway)
  if seam=='setup-doctor-roots':test('setup',loc,lambda x=x:x['comparison']['manifestParsedSets']['current']['files'] and x['comparison']['scanRootDeltas']['instructionRootsCurrent']==x['comparison']['scanRootDeltas']['instructionRootsCandidate'] and x['comparison']['scanRootDeltas']['retirementSensitivity']['candidateFinalScannedFiles'] is None and any('sourceCaptureIds' in c for c in x['comparison']['stateComparisons']) and any('export' in b for b in x['blockedBy']))
  deltas={(d['file'],d['referenceId']):d for d in x['comparison']['intentionalDeltas']}
  for r in rs:
   if seam not in r['seamIds']:continue
   for e in r['references']:
    if e['disposition']=='patch':test('message-deltas',r['file']+':'+e['referenceId'],lambda r=r,e=e:(r['file'],e['referenceId']) in deltas and deltas[r['file'],e['referenceId']]['oldPointer']==e['matchedExpression'] and deltas[r['file'],e['referenceId']]['newPointer']==e['proposedReplacement'])
 if check_packets:
  admission.review_obligations(rs,index,test,'review',sha,read)
 shared=admission.check(rs)
 errors.extend(shared['failures']);checks.update(shared['checks'])
 return {'kind':'Step 5 pilot full mechanical checker; semantic independent review pending','rules':RULES,'checks':dict(checks),'files':len(rs),'literalReferences':len(allrefs),'dynamicTuples':len(alldyn),'failures':errors,'failureCount':len(errors),'sourceCensusGrep':sourcegrep,'headDrift':head_drift(rs),'reviewStatus':'pending; checker success is not semantic acceptance or cutover readiness'}

if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--output',default='step-05-full-check-result.json' if (P/'step-05-seam4-review-index.json').exists() else 'step-05-pilot-check-result.json');args=ap.parse_args()
 out=check(load())
 if (P/'step-05-seam4-review-index.json').exists():
  (P/'step-05-pilot-check-result.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
  extsp=importlib.util.spec_from_file_location('seam4check',P/'step-05-seam4-check.py');ext=importlib.util.module_from_spec(extsp);extsp.loader.exec_module(ext)
  s4=ext.check();(P/'step-05-seam4-check-result.json').write_text(json.dumps(s4,ensure_ascii=False,indent=2)+'\n');out['extensions']={'generators-projections':s4};out['kind']='Step 5 full authored-seam checker; semantic review and cutover proof pending';out['files']+=s4['files'];out['literalReferences']+=s4['literalReferences'];out['dynamicTuples']+=s4['dynamicTuples'];out['failures']+=s4['failures'];out['failureCount']=len(out['failures']);out['checks'].update(s4['checks']);out['rules'].update(s4['rules']);out['headDrift']+=s4['headDrift']
 if (P/'step-05-seam5-batch-selection.json').exists():
  extsp=importlib.util.spec_from_file_location('seam5check',P/'step-05-seam5-check.py');ext=importlib.util.module_from_spec(extsp);extsp.loader.exec_module(ext)
  s5=ext.check();out.setdefault('extensions',{})['real-file-tests-goldens']=s5
  for key in ['files','literalReferences','dynamicTuples']:out[key]+=s5[key]
  out['failures']+=s5['failures'];out['failureCount']=len(out['failures']);out['checks'].update(s5['checks']);out['rules'].update(s5['rules']);out['headDrift']+=s5['headDrift']
 if (P/'step-05-records/ui-spec-compiler.jsonl').exists() and (P/'step-05-records/citation-ratchet-roots.jsonl').exists():
  extsp=importlib.util.spec_from_file_location('seam67check',P/'step-05-seam67-check.py');ext=importlib.util.module_from_spec(extsp);extsp.loader.exec_module(ext)
  s67=ext.check();out.setdefault('extensions',{})['compiler-and-citation-roots']=s67
  for key in ['files','literalReferences','dynamicTuples']:out[key]+=s67[key]
  out['failures']+=s67['failures'];out['failureCount']=len(out['failures']);out['checks'].update(s67['checks']);out['rules'].update(s67['rules']);out['headDrift']+=s67['headDrift']
 r26=admission.r26_module().check();out['extensions']['proposed-move-read-units']=r26;out['failures']+=r26['failures'];out['failureCount']=len(out['failures']);out['checks'].update(r26['checks']);out['rules'].update(r26['rules'])
 (P/'step-05-head-drift.json').write_text(json.dumps({'kind':'Non-failing HEAD drift for Step 7 assembly; records remain at their own pins','headCommit':m.git('rev-parse','HEAD').decode().strip(),'entries':out['headDrift']},ensure_ascii=False,indent=2)+'\n')
 (P/args.output).write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps(out,ensure_ascii=False));sys.exit(bool(out['failures']))
