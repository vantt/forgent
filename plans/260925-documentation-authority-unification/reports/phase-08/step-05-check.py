"""Step 5 full pilot checker: schema/coverage, pins, exact patches, receipts, review sizing.
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
def read(n):return json.loads((P/n).read_text())
def rows(n):return [json.loads(l) for l in (P/n).read_text().splitlines()]
def load():return [r for s in SEAMS for r in rows('step-05-records/'+s+'.jsonl')]
def candidate(r):
 before=(ROOT/r['file']).read_text();edits={}
 for e in r['references']:
  if e['disposition']!='patch':continue
  assert len(e['sourceSpans'])==1,'patch must bind complete physical token'
  a,b=m.bounds(before,e['sourceSpans'])[0];replacement=e['proposedReplacement']
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

def dynamic_operand(d):
 """Syntax gate over the own operation, never over neighbouring doc words.
 Path inputs/normalizers, coupled state paths and generated-surface paths are
 operands; metadata labels, comments, types, guards and formatting are not.
 This is a necessary admission check, not a substitute for semantic review.
 """
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
  f=r['file'];before=(ROOT/f).read_text()
  def pins():
   assert r['sourceSha256']==sha(before) and r['wholeFileRead'] is True
   assert r['wholeFileReadEvidence']['bytes']==len(before.encode()) and r['wholeFileReadEvidence']['lines']==len(before.splitlines())
   assert r['sourceMode']==m.git('ls-files','-s','--',f).decode().split()[0]
   assert m.blob(r['authorInputCommit'],f).decode()==before
   for p in r['priorRecordRefs']:assert sha((ROOT/p['recordFile']).read_bytes())==p['recordSha256']
   for path,digest in r['protectedPins'].items():assert sha((ROOT/path).read_bytes())==digest
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
      if e['disposition']==old['disposition']:return True
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
   loc=f+':'+e['referenceId'];orig=expected.get(e['referenceId'],{})
   test('coverage',loc,lambda e=e,orig=orig:e['inventoryOrigins']==orig.get('origins') and e['originalSourceSpans']==orig.get('sourceSpans') and e['matchedExpression']==orig.get('expression') and e['admission'] in ['ADMIT','REJECT'])
   def spans(e=e):
    if not e['sourceSpans']:
     assert e['disposition']=='parked' and e['blockedReason'];return
    m.spans_text(before,e['sourceSpans']);a=e['passageSpan']['startLine'];b=e['passageSpan']['endLine']
    assert e['passage']=='\n'.join(before.splitlines()[a-1:b])
   test('source-spans',loc,spans)
   if e['admission']=='ADMIT':test('receipts',loc,lambda e=e:e.get('proofCommand') and e.get('parityObligation') and e['receiptId'] in rec)
   if e['admission']=='REJECT':test('rejections',loc,lambda e=e:e['disposition']=='preserve' and e['role']=='comment' and e['passage'] and repr(e['passage']) in e['reason'] and 'L12-' in e['reason'])
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
     assert e['target'] and (ROOT/e['target']).is_file() and sha((ROOT/e['target']).read_bytes())==w['targetSha256']
     assert e['target']!='docs/knowledge/decisions-index/decision-record.md'
     assert not e['aliasWriteCheck']['isWriter'] and e['aliasWriteCheck']['destinationIsAlias'] is False
     if w.get('registryPath'):
      assert sha((ROOT/w['registryPath']).read_bytes())==w['registrySha256']
      docs=json.loads((ROOT/w['registryPath']).read_text())['docs'];hits=[d for d in docs if w['alias'] in d.get('aliases',[]) and d.get('docLifecycle')!='retired'];assert len(hits)==1 and hits[0]['currentPath']==e['target']
     if e['anchor']:
      assert e['anchor'] in (ROOT/e['target']).read_text() or '## 0020' in (ROOT/e['target']).read_text()
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
   for f in x['currentInputs']:assert sha((ROOT/f['path']).read_bytes())==f['sha256']
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
    assert c['currentOutputSet']==c['candidateOutputSet'] and c['pathDecision'].startswith('preserve both')
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
  refseen=[];dynseen=[];metaseen=[];source={};priorseen=[];receiptseen=[]
  fragments={}
  packet_items=[]
  for part in index['parts']:
   def packet(part=part):
    b=(P/part['payload']).read_bytes();assert sha(b)==part['payloadSha256'] and len(b)==part['bytes'] and len(b)<=400000
    data=json.loads(b);fs={x['file'] for x in data['items'] if x.get('file')};assert len(fs)<=60 and sorted(fs)==part['files'] and len(fs)==part['fileRecords']
    assert part['report']==f"review-a38-step-05-pilot-p{part['part']:02}.md"
    for it in data['items']:
     if it['kind']=='item-fragment':fragments.setdefault(it['fragmentOf'],[]).append(it)
     else:packet_items.append(it)
   test('review',part['payload'],packet)
  for key,frag in fragments.items():
   def restore(frag=frag):
    ordered=sorted(frag,key=lambda x:x['fragment']);assert [x['fragment'] for x in ordered]==list(range(ordered[0]['fragments']))
    raw=''.join(x['text'] for x in ordered);assert all(sha(raw)==x['completeItemSha256'] for x in ordered)
    packet_items.append(json.loads(raw))
   test('review','streamed item '+str(key),restore)
  byfile={r['file']:r for r in rs}
  for it in packet_items:
   def item_equal(it=it):
    kind=it['kind']
    if kind in ['references','dynamicTraces','priorRecordRefs']:assert it['value']==byfile[it['file']][kind][it['index']]
    if kind=='record-metadata':assert it['value']=={k:v for k,v in byfile[it['file']].items() if k not in ['references','dynamicTraces','priorRecordRefs']}
    if kind=='receipt':assert it['value']==rec[it['value']['id']]
   test('review','canonical item '+str(it.get('file',it.get('seam'))),item_equal)
   if it['kind']=='references':refseen.append(it['value']['referenceId'])
   if it['kind']=='dynamicTraces':dynseen.append(it['value']['id'])
   if it['kind']=='record-metadata':metaseen.append(it['file'])
   if it['kind']=='receipt':receiptseen.append(it['value']['id'])
   if it['kind']=='priorRecordRefs':priorseen.append((it['file'],it['index']))
   if it['kind']=='source-context':source.setdefault(it['file'],[]).append(it)
  test('review','all refs/dynamic/meta/receipts',lambda:sorted(refseen)==sorted(allrefs) and sorted(dynseen)==sorted(alldyn) and sorted(metaseen)==sorted(r['file'] for r in rs) and sorted(receiptseen)==sorted(rec))
  for r in rs:
   def fullcontext(r=r):
    chunks=sorted(source.get(r['file'],[]),key=lambda x:x['startLine']);assert ''.join(c['text'] for c in chunks)==(ROOT/r['file']).read_text()
    assert sorted(i for f,i in priorseen if f==r['file'])==list(range(len(r['priorRecordRefs'])))
   test('review','full-file '+r['file'],fullcontext)

  rr=read('step-05-pilot-rereview-index.json');outcomes=read('step-05-pilot-rework-outcomes.json')
  changed={x['file']:x for x in outcomes['files']};changedids={e['id'] for x in changed.values() for e in x['changes']}
  expected_rr=changedids|{e['referenceId'] for r in rs if r['file'] in changed for e in r['references'] if e['admission']=='ADMIT'}
  rrseen=[]
  for part in rr['parts']:
   def rr_packet(part=part):
    raw=(P/part['payload']).read_bytes();data=json.loads(raw)
    assert sha(raw)==part['sha256'] and len(raw)==part['bytes'] and len(raw)<=400000
    assert len(data['records'])==part['records']<=60 and part['report']==f"review-a38-step-05-pilot-rr-p{part['part']:02}.md"
    assert sorted({it['file'] for it in data['records']})==part['files'] and set(part['files'])<=set(changed)
    for it in data['records']:
     record=byfile[it['file']];key='referenceId' if it['kind']=='references' else 'id'
     assert it['record']==next(e for e in record[it['kind']] if e[key]==it['id'])

     if it['record']['disposition']=='patch':assert 'cutoverSpecification' in it
     if 'cutoverSpecification' in it:
      current_spec=next(s for s in read('step-05-pilot-cutover-specs.json')['patches'] if s['file']==it['file'])
      assert it['cutoverSpecification']=={k:v for k,v in current_spec.items() if k not in ['symbolOrPassage','oldText','newText','expectedOutputSets','intentionalBehaviorDeltas']}

     assert it['inputCommit']==record['authorInputCommit'] and it['sourceSha256']==record['sourceSha256']
     w=it['window'];lines=pinned(record['authorInputCommit'],record['file']).splitlines();e=it['record']
     a=min(span['line'] for span in e['sourceSpans']) if it['kind']=='references' and e['sourceSpans'] else e['currentLine']
     b=max(span['line'] for span in e['sourceSpans']) if it['kind']=='references' and e['sourceSpans'] else a
     assert (w['startLine'],w['endLine'])==(max(1,a-40),min(len(lines),b+40))
     assert w['text']=='\n'.join(lines[w['startLine']-1:w['endLine']])
     if it['id'] in changedids:assert it['change']==next(x for x in changed[it['file']]['changes'] if x['id']==it['id'])
     rrseen.append(it['id'])
   test('review','bounded re-review '+part['payload'],rr_packet)
  test('review','only changed files and complete final-state windows',lambda:len(rrseen)==len(set(rrseen)) and set(rrseen)==expected_rr and rr['changedFileCount']==len(changed) and rr['changedIdCount']==len(changedids))
 return {'kind':'Step 5 pilot full mechanical checker; semantic independent review pending','rules':RULES,'checks':dict(checks),'files':len(rs),'literalReferences':len(allrefs),'dynamicTuples':len(alldyn),'failures':errors,'failureCount':len(errors),'sourceCensusGrep':sourcegrep,'reviewStatus':'pending; checker success is not semantic acceptance or cutover readiness'}

if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--output',default='step-05-pilot-check-result.json');args=ap.parse_args()
 out=check(load());(P/args.output).write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps(out,ensure_ascii=False));sys.exit(bool(out['failures']))
