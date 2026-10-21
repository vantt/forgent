"""Mutation probes for new judgment records and L12-80 consistency.
All mutations stay in memory; no source, history, state or test bypass is written.
"""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,copy
P=pathlib.Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('j5',P/'step-05-seam5-batch5-judgment-check.py');j=importlib.util.module_from_spec(s);s.loader.exec_module(j)
base=j.check();assert base['failureCount']==0,base['failures'];rs=j.m.rows('step-05-records/tests-judgment-batch5.jsonl');rc=j.m.read('step-05-seam5-batch5-parity-receipts.json')['receipts'];allrs=j.load();results=[]
EXPECTED={
'drop an original dynamic tuple':'j4-coverage','forge complete pinned source digest':'j4-pins','weaken owning assertions':'j4-ownership','forge fixture source mode':'j4-receipts','claim passing replay for preserve without executing':'j4-receipts','erase a passage-specific generator park':'j4-receipts','forge pinned search evidence':'j5-search','invent candidate patch without a co-cut/replay':'j4-pins','reject a docs/history comment inconsistently':'j5-uniform-history','admit a pure in-memory fixture string':'j5-fixtures','admit a temporary-root constructor':'j5-fixtures','drop a retired basename successor':'j5-successors','unpark the document-bearing gateway roots array':'j5-review-closure','lose test-title P5 dependency':'j5-review-closure','call ui-spec moved without seam6 retention':'j5-review-closure','preserve architecture-map reader despite missing headings':'j5-review-closure','discard source-only proof-navigation patch':'j5-review-closure','omit a changed/added file from this-turn review':'j5-review-delta','forge inverse comment patch':'j4-pins'}
def probe(name,fn):
 try:out=fn();caught=[e for e in out['failures'] if e['rule']==EXPECTED[name]];ok=bool(caught);detail=caught[:2]
 except Exception as ex:ok=False;detail=str(ex)
 results.append({'name':name,'passed':ok,'caught':detail})
def mutate(name,edit):
 rr=copy.deepcopy(rs);receipts=copy.deepcopy(rc);edit(rr,receipts);probe(name,lambda:j.check(rr,receipts,run_sweep=False))
mutate('drop an original dynamic tuple',lambda rr,rc:rr[0]['dynamicTraces'].pop())
mutate('forge complete pinned source digest',lambda rr,rc:rr[1].update(sourceSha256='0'*64))
mutate('weaken owning assertions',lambda rr,rc:next(t for t in rr[1]['owningProofs'] if t['assertions'])['assertions'].pop())
mutate('forge fixture source mode',lambda rr,rc:rc[2]['currentInputs'][0].update(mode='100755'))
mutate('claim passing replay for preserve without executing',lambda rr,rc:rc[1]['proofs'][0].update(status='pass',exit=0))
mutate('erase a passage-specific generator park',lambda rr,rc:next(e for r in rr for e in r['dynamicTraces'] if e['disposition']=='parked').update(disposition='preserve',blockedReason=None))
mutate('forge pinned search evidence',lambda rr,rc:next(e for r in rr for e in r['dynamicTraces'] if e['disposition']=='parked')['searchWitness'].update(evidenceSha256='0'*64))
mutate('invent candidate patch without a co-cut/replay',lambda rr,rc:rr[1].update(diff='invented'))

def slot(rr,file,id):return next(e for r in rr if r['file']==file for e in j.m.admission.allitems(r) if j.m.admission.idof(e)==id)
def sweepmut(name,edit):
 rr=copy.deepcopy(allrs);edit(rr);probe(name,lambda:j.sweep(rr))
sweepmut('reject a docs/history comment inconsistently',lambda rr:slot(rr,'test/cli/fgos-edit-2.test.mjs','reference-003953').update(admission='REJECT',nonDocumentUse='comment-or-type'))
sweepmut('admit a pure in-memory fixture string',lambda rr:slot(rr,'test/scripts/doc-decision-conservation.test.mjs','reference-004935').update(admission='ADMIT',nonDocumentUse=None))
sweepmut('admit a temporary-root constructor',lambda rr:slot(rr,'test/scripts/knowledge-classifier.test.mjs','dynamic-033478').update(admission='ADMIT',nonDocumentUse=None,pathOperand="path.join(tmpDir, 'docs')"))
sweepmut('drop a retired basename successor',lambda rr:slot(rr,'test/docs/decisions-corpus-retired.test.mjs','dynamic-018736').update(successorNote=None))
sweepmut('unpark the document-bearing gateway roots array',lambda rr:slot(rr,'test/runner/dead-vocabulary-guard.test.mjs','dynamic-023891').update(disposition='preserve'))
sweepmut('lose test-title P5 dependency',lambda rr:slot(rr,'test/runner/dead-vocabulary-guard.test.mjs','reference-004372').update(reason='independent preserve'))
sweepmut('call ui-spec moved without seam6 retention',lambda rr:slot(rr,'apps/fgos-gateway/web/src/App.test.tsx','reference-000201').update(reason='move-set says moved'))
sweepmut('preserve architecture-map reader despite missing headings',lambda rr:slot(rr,'test/docs/decisions-corpus-retired.test.mjs','reference-004035').update(disposition='preserve'))
sweepmut('discard source-only proof-navigation patch',lambda rr:slot(rr,'test/runner/dispatch-worker-session.test.mjs','reference-004380').update(disposition='preserve'))
ix=copy.deepcopy(j.m.read('step-05-seam5-review-list.json'));ix['reviewThisTurn'].pop();probe('omit a changed/added file from this-turn review',lambda:j.sweep(listing=ix))
# Own the patch behavior in the extended verifier; mutate its source record
# without writing an actual test file or changing a passing proof log.
old=j.j.m.rows('step-05-records/tests-judgment-batch4.jsonl');receipts=j.j.m.read('step-05-seam5-batch4-parity-receipts.json')['receipts'];bad=copy.deepcopy(old);next(r for r in bad if r['file']=='test/runner/dispatch-worker-session.test.mjs')['rollbackDiff']='invented';probe('forge inverse comment patch',lambda:j.j.check(bad,receipts))
assert j.check()['failureCount']==0,'baseline must also be clean after all mutations'
out={'baselineFailures':base['failureCount'],'passed':sum(p['passed'] for p in results),'total':len(results),'negativeProbes':results,'failures':[p for p in results if not p['passed']]};(P/'step-05-seam5-batch5-probes-result.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps(out));sys.exit(bool(out['failures']))
