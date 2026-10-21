"""Pin/coverage/assertion/receipt checks for R22/R23 judgment batch.
Semantic actions require independent source-window review.
"""
import sys
sys.dont_write_bytecode=True
import pathlib,json,re,collections,importlib.util,subprocess
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
s=importlib.util.spec_from_file_location('j',P/'step-05-seam5-judgment-check.py');j=importlib.util.module_from_spec(s);s.loader.exec_module(j)
m=j.m;sha=j.sha
RULES={'j4-coverage':'All 30 selected files, all original census ids, exact current/historical witnesses and whole-file lexical closure.','j4-pins':'Immutable complete source mode/hash/bytes; no patch claimed for preserve/park.','j4-ownership':'Every declaration and assertion stays pinned; R22 full-suite parity remains pending.','j4-receipts':'One receipt per complete file, exact input metadata and explicit pending full-suite obligation.','j4-search':'Park dependencies retain exact pinned searches, proposed aliases, and P7-DOC-GAP-05.','j4-review':'Every admitted and judgment reject is independently reviewable.'}
def assert_patch(r,receipt,body):
 spec=next(s for s in m.read('step-05-seam5-batch5-review-cutover-specs.json')['patches'] if s['file']==r['file'])
 assert all(k in spec for k in m.read('step-05-parity-receipt-template.json')['cutoverPatch'])
 assert spec['inputCommit']==r['authorInputCommit'] and spec['oldText']==body and spec['sourceSha256']==r['sourceSha256'] and spec['mode']==r['sourceMode']
 before,after=m.candidate(r);assert before==body and after==spec['newText'] and sha(after)==spec['expectedAfterSha256']==r['expectedAfterSha256']
 assert spec['diff']==r['diff']==m.m.make_diff(r['file'],body,after) and j.s4.apply(r['file'],body.encode(),r['diff'])==after.encode()
 assert spec['rollbackDiff']==r['rollbackDiff']==m.m.make_diff(r['file'],after,body) and j.s4.apply(r['file'],after.encode(),r['rollbackDiff'])==body.encode()
 assert spec['timing']=='phase9' and spec['readiness'].startswith('pending') and spec['coCutPaths']==r['coCutPaths']==receipt['coCutPaths'] and 'CHANGELOG.md' in r['coCutPaths']
 changed=[(a,b) for a,b in zip(body.splitlines(),after.splitlines()) if a!=b];assert len(body.splitlines())==len(after.splitlines()) and len(changed)==1 and all(a.startswith('// docs/architect/') and b==a.replace('docs/architect/','docs/platform/',1) for a,b in changed)
 for entry in spec['claimAnchorProof']['directoryMembers']:assert entry['byteIdentical'] and sha(m.pinned(r['authorInputCommit'],entry['source']))==sha(m.pinned(r['authorInputCommit'],entry['target']))==entry['sha256']
 assert receipt['cutoverSpecifications']==[spec] and receipt['comparison']['intentionalDeltas']==spec['intentionalBehaviorDeltas']
 old=next(e['matchedExpression'] for e in r['references'] if e['disposition']=='patch');assert [m.test_grep(r['authorInputCommit'],old)]==spec['coCutTestGreps']==receipt['coCutTestGreps'] and all(h['file'] in r['coCutPaths'] for g in spec['coCutTestGreps'] for h in g['matches'])
 for i in receipt['candidateInputs']:
  raw=after.encode() if i['path']==r['file'] else m.m.blob(r['authorInputCommit'],i['path']);assert sha(raw)==i['sha256'] and len(raw)==i['bytes']
 assert receipt['comparison']['currentOutputSet']==receipt['comparison']['candidateOutputSet']==spec['expectedOutputSets'] and receipt['comparison']['currentOutputSet']
 assert sha((ROOT/receipt['replayManifest']).read_bytes())==receipt['replayManifestSha256']
 manifest=json.loads((ROOT/receipt['replayManifest']).read_text());assert manifest['equalOutcomes'] and len(manifest['manifests'])==2 and manifest['proofs']==receipt['proofs']
 for side in manifest['manifests']:
  assert side['inputCommit']==r['authorInputCommit'] and side['exit']==0
  for entry in side['files']:
   raw=after.encode() if side['side']=='candidate' and entry['path']==r['file'] else m.m.blob(r['authorInputCommit'],entry['path']);assert sha(raw)==entry['sha256'] and len(raw)==entry['bytes'] and entry['mode']==m.m.git('ls-tree',r['authorInputCommit'],'--',entry['path']).decode().split()[0]
 assert len(receipt['proofs'])==2
 for proof in receipt['proofs']:assert proof['status']=='pass' and proof['exit']==0 and sha((ROOT/proof['logPath']).read_bytes())==proof['logSha256'] and proof['side'] in ['current','candidate']

def load():return m.rows('step-05-records/tests-judgment-batch4.jsonl')
def check(rs=None,receipts=None,listing=None,selection=None,batch=4):
 rs=(load() if batch==4 else m.rows('step-05-records/tests-judgment-batch5.jsonl')) if rs is None else rs;receipts=m.read(f'step-05-seam5-batch{batch}-parity-receipts.json')['receipts'] if receipts is None else receipts;listing=m.read('step-05-seam5-review-list.json') if listing is None else listing;selection=m.read(f'step-05-seam5-batch{batch}-selection.json') if selection is None else selection;by={r['file']:r for r in rs};receiptby={r['id']:r for r in receipts};errors=[];counts=collections.Counter()
 def test(rule,where,fn):
  counts[rule]+=1
  try:ret=fn();assert ret is None or bool(ret)
  except Exception as ex:errors.append({'rule':rule,'where':where,'error':str(ex) or 'condition false'})
 test('j4-coverage',f'batch {batch} unique judgment files',lambda:len(rs)==len(by)==(30 if batch==4 else 40) and set(by)==set(selection['files']) and len(receipts)==len(rs) and (batch!=4 or rs[0]['file']=='test/runner/dead-vocabulary-guard.test.mjs' and rs[1]['file']=='test/architecture.test.mjs'))
 refs=collections.defaultdict(list);dyn=collections.defaultdict(list)
 for e in m.rows('step-05-population-references.jsonl'):refs[e['file']].append(e)
 for e in m.rows('step-05-population-dynamic.jsonl'):dyn[e['file']].append(e)
 for r in rs:
  f=r['file'];pin=r['authorInputCommit'];body=m.pinned(pin,f);ls=body.splitlines();receipt=receiptby[r['receiptIds'][0]]
  def pins():
   assert sha(body)==r['sourceSha256']
   assert (m.candidate(r)[1] if r['diff'] else body) is not None
   assert sha(m.candidate(r)[1] if r['diff'] else body)==r['expectedAfterSha256'] and m.m.git('ls-tree',pin,'--',f).decode().split()[0]==r['sourceMode']
   assert r['wholeFileRead'] and r['wholeFileReadEvidence']['bytes']==len(body.encode()) and r['wholeFileReadEvidence']['lines']==len(ls) and r['wholeFileReadEvidence']['sha256']==sha(body)
   assert not r['generated'] and r['review']['status']=='pending'
   if r['diff'] is None:assert r['rollbackDiff'] is None and r['coCutPaths']==[]
   else:assert_patch(r,receipt,body)
   for path,digest in r['protectedPins'].items():assert sha(m.m.blob(pin,path))==digest
  test('j4-pins',f,pins)
  def coverage():
   assert len(r['references'])==len(refs[f]) and len(r['dynamicTraces'])==len(dyn[f])
   for e,o in zip(r['references'],refs[f]):
    assert e['referenceId']==o['id'] and e['inventoryOrigins']==o['origins'] and e['originalSourceSpans']==o['sourceSpans'] and e['matchedExpression']==o['expression'];m.m.spans_text(body,e['sourceSpans']);p=e['passageSpan'];assert e['passage']=='\n'.join(ls[p['startLine']-1:p['endLine']])
   for e,o in zip(r['dynamicTraces'],dyn[f]):
    assert e['id']==o['id'] and e['originalTuple']==o['callSite'] and e['inventoryOrigins']==o['inventories'];opbody=body
    if e.get('historicalOnly'):
     h=e['historicalOnly'];assert h['inputCommit']==m.read(e['inventoryOrigins'][0])['inputCommit'];opbody=m.pinned(h['inputCommit'],f);assert sha(opbody)==h['sourceSha256'] and o['callSite'][4] not in body and e['admission']=='REJECT' and e['disposition']=='preserve'
     assert h['diffCommand']==['git','diff',h['inputCommit'],pin,'--',f] and h['diff']==m.m.git('diff',h['inputCommit'],pin,'--',f).decode()
    ols=opbody.splitlines();w=e['operationWitness'];assert ols[w['line']-1][w['columnStart']-1:w['columnEndExclusive']-1]==w['text']==o['callSite'][4].split('\n')[0];p=e['currentPassage'];assert p['text']=='\n'.join(ols[p['startLine']-1:p['endLine']]) and e['caller']=={'line':p['startLine'],'declaration':ols[p['startLine']-1]}
   for line,text in enumerate(ls,1):
    for mt in re.finditer(r'docs/[^\s`"\',;]*',text):assert any(s['line']==line and s['columnStart']<=mt.start()+1<s['columnEndExclusive'] for e in r['references']+r['authorAddedReferences'] for s in e['sourceSpans']),str(line)
   for e in r['authorAddedReferences']:m.m.spans_text(body,e['sourceSpans']);p=e['passageSpan'];assert e['passage']=='\n'.join(ls[p['startLine']-1:p['endLine']])
   assert len({m.admission.idof(e) for e in m.admission.allitems(r)})==len(m.admission.allitems(r))
  test('j4-coverage',f,coverage)
  def ownership():
   starts=[i for i,t in enumerate(ls,1) if re.match(r'\s*(?:test|it)\s*(?:\.\w+)?\(',t)];own=r['owningProofs'];assert own and [t['declarationLine'] for t in own]==starts
   for k,t in enumerate(own):
    a=t['declarationLine'];z=starts[k+1]-1 if k+1<len(starts) else len(ls);assert t['declaration']==ls[a-1]
    assert t['assertions']==[{'line':i,'text':ls[i-1]} for i in range(a,z+1) if re.search(r'\bassert\.\w+\(|\bexpect\(',ls[i-1])]
   assert any(t['assertions'] for t in own)
   assert receipt['comparison']['assertionOwnership']==own
   for e in m.admission.allitems(r):assert e['disposition'] in ['preserve','parked','patch'] and e['parityObligation'] and e['proofCommand'] and e['receiptId']==receipt['id'] and (e['diffHunk']==r['diff'] if e['disposition']=='patch' else e['diffHunk'] is None)
  test('j4-ownership',f,ownership)
  def receiptcheck():
   assert all(k in receipt for k in m.read('step-05-parity-receipt-template.json')['receipt']);assert receipt['inputCommit']==pin and receipt['comparison']['unexpectedDeltas']==[]
   if r['diff'] is None:assert receipt['currentInputs']==receipt['candidateInputs'] and receipt['cutoverSpecifications']==[] and receipt['comparison']['currentOutputSet']==receipt['comparison']['candidateOutputSet']==[] and receipt['comparison']['intentionalDeltas']==[]
   else:assert_patch(r,receipt,body)
   assert receipt['comparison']['comparedFields']==m.read('step-05-parity-receipt-template.json')['seamTemplates'][receipt['seam']]['requiredComparisons'] and receipt['review']['status']=='pending' and 'pending' in receipt['readiness']
   assert {i['path'] for i in receipt['currentInputs']}=={f}|set(r['protectedPins'])
   for i in receipt['currentInputs']:
    raw=m.m.blob(pin,i['path']);assert sha(raw)==i['sha256'] and len(raw)==i['bytes'] and m.m.git('ls-tree',pin,'--',i['path']).decode().split()[0]==i['mode']
   assert receipt['blockedBy']==list(dict.fromkeys(e['blockedReason'] for e in m.admission.allitems(r) if e['disposition']=='parked'))
   if r['diff'] is None:assert all(p['status']=='not-run' and p['exit'] is None and p['logPath'] is None and p['logSha256'] is None and 'R22' in p['reason'] for p in receipt['proofs'])
   assert r['parked']==[{'id':m.admission.idof(e),'blockedReason':e['blockedReason'],'dependency':e['dependency']} for e in m.admission.allitems(r) if e['disposition']=='parked']
  test('j4-receipts',f,receiptcheck)
  def review():
   ix=next(e for e in listing['canonicalRecords'] if e['file']==f);assert f in listing['sourceRecords'] and ix['recordSha256']==sha(json.dumps(r,ensure_ascii=False,separators=(',',':'))) and ix['sourceSha256']==r['sourceSha256']
   assert ix['admittedIds']==[m.admission.idof(e) for e in m.admission.allitems(r) if e['admission']=='ADMIT'] and ix['judgmentCallIds']==[m.admission.idof(e) for e in m.admission.allitems(r) if e['admission']=='REJECT']
  test('j4-review',f,review)
 def searchcheck():
  search=m.read('step-05-seam5-batch4-search-evidence.json');assert search['roots']==['docs/platform','docs/knowledge','docs/reference','docs/tutorials'] and search['inputCommit']==selection['inputCommit']
  for q in search['queries']:
   assert q['command']==['git','grep','-n','-F',q['query'],search['inputCommit'],'--',*search['roots']];pr=subprocess.run(q['command'],cwd=ROOT,text=True,capture_output=True);assert pr.returncode==q['exit'] and sha(pr.stdout)==q['stdoutSha256'] and pr.stdout.splitlines()==q['matches']
  for q in search['aliasLookups']:
   raw=m.pinned(search['inputCommit'],q['path']);assert sha(raw)==q['sha256'];a=json.loads(raw);expected=[e for e in a.get('entries',a.get('docs',[])) if any(x in json.dumps(e) for x in ['docs/specs/','docs/architect/agent-coordination/','docs/platform/component-boundary.md'])];assert q['matches']==expected
  g=search['carriedGap'];assert sha(m.pinned(search['inputCommit'],g['path']))==g['sha256'] and 'P7-DOC-GAP-05' in '\n'.join(m.pinned(search['inputCommit'],g['path']).splitlines()[g['lines'][0]-1:g['lines'][1]])
  for r in rs:
   for e in m.admission.allitems(r):
    if e['disposition']=='parked':
     w=e['searchWitness'];assert w['assessment']==e['blockedReason'] and w['pin']==r['authorInputCommit'] and w['roots']==search['roots'] and w['evidenceSha256']==sha((ROOT/w['evidenceFile']).read_bytes())
  dead=by['test/runner/dead-vocabulary-guard.test.mjs'];assert dead['carryJoins']==[e for e in m.rows('step-05-dynamic-carries.jsonl') if e['file']==dead['file']]
  byid={e['id']:e for e in dead['dynamicTraces']};assert byid['dynamic-023895']['disposition']=='parked' and 'P7-DOC-GAP-05' in byid['dynamic-023895']['blockedReason']
  arch=by['test/architecture.test.mjs'];assert next(e for e in arch['dynamicTraces'] if e['id']=='dynamic-016778')['disposition']=='preserve' and arch['protectedPins']['docs/architecture-manifest.json']==sha(m.pinned(arch['authorInputCommit'],'docs/architecture-manifest.json'))
 if batch==4:test('j4-search','exact park evidence and priority-reader custody',searchcheck)
 else:
  def batch5search():
   search=m.read('step-05-seam5-batch5-search-evidence.json');assert search['inputCommit']==selection['inputCommit'] and search['roots']==['docs/platform','docs/knowledge','docs/reference','docs/tutorials']
   for q in search['queries']:
    assert q['command']==['git','grep','-n','-F',q['query'],search['inputCommit'],'--',*search['roots']];proc=subprocess.run(q['command'],cwd=ROOT,text=True,capture_output=True);assert proc.returncode==q['exit'] and proc.stdout.splitlines()==q['matches'] and sha(proc.stdout)==q['stdoutSha256']
   for q in search['aliasLookups']:
    raw=m.pinned(search['inputCommit'],q['path']);assert sha(raw)==q['sha256'];a=json.loads(raw);assert q['matches']==[e for e in a.get('entries',a.get('docs',[])) if any(t in json.dumps(e) for t in ['check-rollup-progress','enduser-docs-index','docs/decisions'])]
   for r in rs:
    for e in m.admission.allitems(r):
     if e['disposition']=='parked':
      w=e['searchWitness'];assert w['pin']==r['authorInputCommit'] and w['roots']==search['roots'] and w['assessment']==e['blockedReason'] and w['evidenceSha256']==sha((ROOT/w['evidenceFile']).read_bytes())
  test('j5-search','exact all-root searches and alias lookups',batch5search)
 shared=m.admission.check(rs);errors.extend(shared['failures']);counts.update(shared['checks'])
 return {'files':len(rs),'literalReferences':sum(len(r['references']) for r in rs),'dynamicTuples':sum(len(r['dynamicTraces']) for r in rs),'rules':dict(RULES,**shared['rules']),'checks':dict(counts),'failureCount':len(errors),'failures':errors,'headDrift':m.head_drift(rs)}
if __name__=='__main__':
 out=check();(P/'step-05-seam5-batch4-judgment-check.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps(out));sys.exit(bool(out['failures']))
