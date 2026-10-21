"""L12-81 shared checks: exact patches, source-grounded sweep and R22 replay gate.
No pending replay can be interpreted as a successful batch closure.
"""
import sys
sys.dont_write_bytecode=True
import pathlib,json,hashlib,subprocess,re,importlib.util,collections
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def module(n,f):
 s=importlib.util.spec_from_file_location(n,P/f);o=importlib.util.module_from_spec(s);s.loader.exec_module(o);return o
def read(f):return json.loads((P/f).read_text())
def sha(x):return hashlib.sha256(x.encode() if isinstance(x,str) else x).hexdigest()
def blob(pin,f):return subprocess.check_output(['git','show',pin+':'+f],cwd=ROOT,text=True)
def allitems(r):return r['references']+r['dynamicTraces']+r.get('authorAddedReferences',[])
def idof(e):return e.get('referenceId',e.get('id'))
def expr(e):return e.get('matchedExpression',e.get('originalTuple',[None]*5)[4])
def patch_spec(f):return next((s for s in read('step-05-seam5-batch6-cutover-specs.json')['patches'] if s['file']==f),None)
def assert_patch(r,receipt,body):
 m=module('pilot6','step-05-check.py');s4=module('s46','step-05-seam4-check.py');spec=patch_spec(r['file']);assert spec
 assert all(k in spec for k in read('step-05-parity-receipt-template.json')['cutoverPatch'])
 assert spec['inputCommit']==r['authorInputCommit'] and spec['sourceSha256']==r['sourceSha256']==sha(body) and spec['oldText']==body and spec['mode']==r['sourceMode']
 after=s4.apply(r['file'],body.encode(),r['diff']).decode();assert after==spec['newText'] and sha(after)==r['expectedAfterSha256']==spec['expectedAfterSha256']
 assert spec['diff']==r['diff']==m.m.make_diff(r['file'],body,after)
 assert spec['rollbackDiff']==r['rollbackDiff']==m.m.make_diff(r['file'],after,body) and s4.apply(r['file'],after.encode(),r['rollbackDiff'])==body.encode()
 assert spec['coCutPaths']==r['coCutPaths']==receipt['coCutPaths'] and spec['file'] in r['coCutPaths'] and 'CHANGELOG.md' in r['coCutPaths']
 candidate=body
 for a,z in spec['substitutions']:
  if a in candidate:candidate=candidate.replace(a,z)
 assert candidate==after,'candidate includes an unapproved substitution'
 assert receipt['cutoverSpecifications']==[spec] and receipt['comparison']['intentionalDeltas']==spec['intentionalBehaviorDeltas']
 for g in spec['coCutTestGreps']:
  assert g==m.test_grep(r['authorInputCommit'],g['oldPointer']) and g in receipt['coCutTestGreps']
  assert all(h['file'] in r['coCutPaths'] for h in g['matches'])
 for i in receipt['candidateInputs']:
  raw=after if i['path']==r['file'] else blob(r['authorInputCommit'],i['path']);assert sha(raw)==i['sha256'] and len(raw.encode())==i['bytes']
 return True

def check():
 j=module('j46','step-05-seam5-batch4-judgment-check.py');out=j.check(batch=6);errors=out['failures'];counts=collections.Counter(out['checks']);rs=j.m.rows('step-05-records/tests-judgment-batch6.jsonl');closure=read('step-05-seam5-batch6-review-closure.json');ix=read('step-05-seam5-review-list.json')
 def test(rule,where,fn):
  counts[rule]+=1
  try:assert fn()
  except Exception as e:errors.append({'rule':rule,'where':where,'error':str(e) or 'condition false'})
 allrs=[r for fn in ['tests-real-file.jsonl','tests-real-file-batch3.jsonl','tests-judgment-batch4.jsonl','tests-judgment-batch5.jsonl','tests-judgment-batch6.jsonl'] for r in j.m.rows('step-05-records/'+fn)];by={r['file']:r for r in allrs};ids={idof(e):(r,e) for r in allrs for e in allitems(r)}
 def review_delta():
  nonlocal ix
  if ix['closedBatch']!=6:ix=ix['previousReviewDeltas']['6']
  changed=closure['changedRecords'];disp={e['file'] for e in changed if e['dispositionChanged']};label={e['file'] for e in changed if not e['dispositionChanged']};added={r['file'] for r in rs};assert set(ix['reviewThisTurn'])==disp|added and {e['file'] for e in ix['changedThisTurn']['dispositionChanged']}==disp and {e['file'] for e in ix['changedThisTurn']['labelOnly']}==label
  for e in changed:assert e['afterSha256']==sha(json.dumps(by[e['file']],ensure_ascii=False,separators=(',',':')))
  return True
 test('j6-review-delta','R24 changed/add split',review_delta)
 def explicit():
  for id in ['reference-004363','reference-004391','reference-004382','reference-004392','reference-004362','reference-004364']:assert ids[id][1]['admission']=='ADMIT' and ids[id][1]['disposition']=='preserve'
  for id in ['dynamic-021547','dynamic-021548','dynamic-021549','reference-004308','reference-004343','dynamic-021550','dynamic-021551','reference-004332']:assert ids[id][1]['disposition']=='parked'
  for id in ['reference-004421','reference-004460','reference-004241','reference-003965','dynamic-018740','dynamic-018744']:assert ids[id][1]['admission']=='ADMIT' and ids[id][1]['disposition']=='patch'
  assert ids['author-s5-b6-loop-split-786'][1]['resolverWitness']['treeRetires']
  for id in ['reference-004312','reference-004321','reference-004346','reference-004372']:assert ids[id][1]['disposition']=='preserve' and ids[id][1]['coCutDependency']['itemIds']
  assert '0026--native-first' in ids['reference-004381'][1]['successorNote']
  return True
 test('j6-review-closure','all explicit Lead outcomes',explicit)
 for hit in closure['S2']:
  r,e=ids[hit['id']];test('j6-live-holder',r['file']+':'+hit['id'],lambda r=r,e=e,hit=hit:e['disposition']=='patch' and e['target']==hit['target'] and sha(blob(r['authorInputCommit'],hit['target']))==hit['targetSha256'])
 for spec in read('step-05-seam5-batch6-cutover-specs.json')['patches']:
  r=by[spec['file']];rcfile=next(fn for fn in ['step-05-seam5-batch4-parity-receipts.json','step-05-seam5-batch5-parity-receipts.json','step-05-seam5-batch6-parity-receipts.json'] if any(x['id']==spec['receiptId'] for x in read(fn)['receipts']));receipt=next(x for x in read(rcfile)['receipts'] if x['id']==spec['receiptId']);test('j6-exact-patch',spec['file'],lambda r=r,receipt=receipt:assert_patch(r,receipt,blob(r['authorInputCommit'],r['file'])))
  def replay(receipt=receipt,spec=spec):
   if 'deferredReplay' in receipt:
    return module('r25','step-05-seam5-batch7-deferred.py').validate(spec,by[spec['file']],receipt,blob(spec['inputCommit'],spec['file']))
   proofs=receipt['proofs'];assert len(proofs)>=2 and {p.get('side') for p in proofs}=={'current','candidate'} and all(p['status']=='pass' and p['exit']==0 for p in proofs),'R22 requires actual current/candidate owning test replay; no pending/blocked proof counts as pass'
   for p in proofs:assert sha((ROOT/p['logPath']).read_bytes())==p['logSha256']
   assert receipt['comparison']['currentOutputSet']==receipt['comparison']['candidateOutputSet'] and receipt['comparison']['currentOutputSet']
   return True
  test('j6-r22-replay',spec['file'],replay)
 out.update(files=len(rs),checks=dict(counts),failureCount=len(errors),failures=errors);return out
if __name__=='__main__':
 out=check();(P/'step-05-seam5-batch6-check-result.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps(out,ensure_ascii=False));sys.exit(bool(out['failures']))
