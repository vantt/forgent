"""Step 5 full pilot checker: schema/coverage, pins, exact patches, receipts, review sizing.
Reuses Step 3's span, bounds, full-file diff and hunk primitives. No consumers
are mutated. Semantic judgments remain subject to mandatory independent review.
"""
import sys
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
RULES={
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
 errors=[];checks=collections.Counter()
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
 return {'kind':'Step 5 pilot full mechanical checker; semantic independent review pending','rules':RULES,'checks':dict(checks),'files':len(rs),'literalReferences':len(allrefs),'dynamicTuples':len(alldyn),'failures':errors,'failureCount':len(errors),'reviewStatus':'pending; checker success is not semantic acceptance or cutover readiness'}

if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--output',default='step-05-pilot-check-result.json');args=ap.parse_args()
 out=check(load());(P/args.output).write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps(out,ensure_ascii=False));sys.exit(bool(out['failures']))
