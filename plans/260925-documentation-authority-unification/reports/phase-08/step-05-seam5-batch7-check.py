"""Batch 7 complete-queue, R25 and same-pin neutrality-first evidence checks."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,collections,importlib.util,functools
P=pathlib.Path(__file__).resolve().parent
@functools.lru_cache(None)
def mod(n,f):
 s=importlib.util.spec_from_file_location(n,P/f);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def read(f):return json.loads((P/f).read_text())
def check():
 j=mod('j47','step-05-seam5-batch4-judgment-check.py');out=j.check(batch=7);rs=j.m.rows('step-05-records/tests-judgment-batch7.jsonl');counts=collections.Counter(out['checks']);errors=out['failures']
 def test(rule,where,fn):
  counts[rule]+=1
  try:assert fn()
  except Exception as ex:errors.append({'rule':rule,'where':where,'error':str(ex) or 'condition false'})
 def population():
  q=read('step-05-seam5-batch7-input.json');s=read('step-05-seam5-batch7-selection.json');assert q==json.loads(j.m.pinned(s['queueSnapshotCommit'],s['queueSnapshotSource']));assert q['remainingFileCount']==264 and q['remainingReferences']==0 and q['remainingDynamicTuples']==10529
  assert s['files']==[x['file'] for x in q['remainingFilesInOrder']]==[r['file'] for r in rs] and s['fileCount']==264
  assert sum(len(r['dynamicTraces']) for r in rs)==10529
  c=read('step-05-seam5-continuation.json');assert c['remainingFilesInOrder']==[] and c['remainingFileCount']==c['remainingReferences']==c['remainingDynamicTuples']==0 and c['dynamicCarries']==q['dynamicCarries']
  assert c['pendingReplayFiles']==[] and {e['file'] for e in c['deferredReplayFiles']}=={e['file'] for e in read('step-05-seam5-batch7-deferred-replays.json')['deferredReplays']} and len(c['deferredReplayFiles'])>=4
  return True
 test('j7-complete-queue','264 source files / 10529 tuples',population)
 def neutrality():
  r=mod('root7','step-05-seam5-root-rules.py');tri=read('step-05-seam5-batch7-neutrality-first.json');assert tri['files']==264 and tri['neutralFiles']==[] and [t['file'] for t in tri['triage']]==[x['file'] for x in rs]
  dyn=collections.defaultdict(list)
  for x in r.b.rows('step-05-population-dynamic.jsonl'):dyn[x['file']].append(x)
  for t in tri['triage']:
   ctx=r.context(r.PIN,t['file']);old=r.n.literal_hazards('\n'+'\n'.join(x['callSite'][4] for x in dyn[t['file']]))
   assert t=={'file':t['file'],'inputCommit':r.PIN,'context':ctx,'originalOperandHazards':old,'wholeFileNeutralClosure':r.safe(ctx) and not old} and not t['wholeFileNeutralClosure']
  return True
 test('j7-occurrence-ancestry','every original tuple binds its original occurrence',lambda:mod('ancestry7','step-05-seam5-batch7-relocation-audit.py').check()['differenceCount']==0)
 test('j7-neutrality-first','R21/R20 same-pin whole-file proof',neutrality)
 def review():
  ix=read('step-05-seam5-review-list.json');assert ix['closedBatch']==7 and j.m.admission.r26_module().review_delta(ix)
  assert [x['file'] for x in ix['addedThisTurn']]==[r['file'] for r in rs]
  assert len(ix['deferredReplayChangedThisTurn'])==4
  return True
 test('j7-review-delta','new records separate from replay-only receipt changes',review)
 out.update(checks=dict(counts),failureCount=len(errors),failures=errors);return out
if __name__=='__main__':
 out=check();(P/'step-05-seam5-batch7-check-result.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps(out));sys.exit(bool(out['failures']))
