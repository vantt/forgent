"""Mutation probes for the newly closed R19 files and real-reader judgments."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,importlib.util,copy
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('bulk',P/'step-05-seam5-bulk-rules.py');b=importlib.util.module_from_spec(sp);sp.loader.exec_module(b)
sp=importlib.util.spec_from_file_location('judge',P/'step-05-seam5-judgment-check.py');j=importlib.util.module_from_spec(sp);sp.loader.exec_module(j)
BR=b.rows('step-05-records/tests-mechanical.jsonl');TR=b.rows('step-05-seam5-bulk-triage.jsonl');JR=j.load();RC=j.m.read('step-05-seam5-batch2-judgment-receipts.json')['receipts'][0];SS=j.m.read('step-05-seam5-batch2-cutover-specs.json')['patches'];IX=j.m.read('step-05-seam5-review-list.json')
base=b.check();assert base['failureCount']==0,base['failures'];basej=j.check();assert basej['failureCount']==0,basej['failures'];probes=[]
def bulk(name,rule,change):
 rs,ts=copy.deepcopy([BR,TR]);change(rs,ts);out=b.check(rs,ts);caught=[x for x in out['failures'] if x['rule']==rule];probes.append({'name':name,'owningRule':rule,'pass':bool(caught),'caught':caught[:1]})
bulk('No initial triage file can vanish','r19-triage-coverage',lambda rs,ts:ts.pop())
bulk('A mechanical closure cannot omit an original tuple','r19-tuples',lambda rs,ts:rs[0]['dynamicTraces'].pop())
bulk('A closed file cannot claim a different immutable source hash','r19-pins',lambda rs,ts:rs[0].__setitem__('sourceSha256','0'*64))
bulk('An unrecognized operand cannot borrow a category label','r19-tuples',lambda rs,ts:next(e for t in ts for e in t['tuples'] if e['status']=='mechanical-reject').__setitem__('category','invented broad category'))
bulk('A file with unresolved operands cannot be closed by a flag','r19-closure',lambda rs,ts:next(t for t in ts if not t['wholeFileMechanicalClosure']).__setitem__('wholeFileMechanicalClosure',True))
# Inject a census-root literal into the same physical operation line/context.
t=next(t for t in TR if t['file']=='test/distribution/source-payload.test.mjs' and t['wholeFileMechanicalClosure']);f=t['file'];pin=t['inputCommit'];origbody=b.body;olddoc=b.a.binding_roots;index=next(n for n,t in enumerate(TR) if t['file']==f);actual=origbody(pin,f);ls=actual.splitlines();w=t['tuples'][0]['operationWitness'];ls[w['line']-1]+=" const forbidden = 'docs/specs/widget.md';";injected='\n'.join(ls)+'\n'
real_decide=b.decide
b.decide=lambda p,file,d:b._decide.__wrapped__(p,file,tuple(d['callSite']),d['id']) if (p,file)==(pin,f) else real_decide(p,file,d)
b.body=lambda p,file:injected if (p,file)==(pin,f) else origbody(p,file);b.context.cache_clear()
try:bulk('A mechanically rejected tuple whose enclosing operation carries a census-root literal is refused','r19-tuples',lambda rs,ts:None)
finally:b.body=origbody;b.context.cache_clear();b.decide=real_decide
# Constant-trace probe: syntax remains non-document, but a referenced name is traced to a document constant.
name='root';assert name in b.a.identifiers(actual)
b.a.binding_roots=lambda p,file:dict(olddoc(p,file),**{name:{'documents'}}) if (p,file)==(pin,f) else olddoc(p,file);b.context.cache_clear()
b.decide=lambda p,file,d:b._decide.__wrapped__(p,file,tuple(d['callSite']),d['id']) if (p,file)==(pin,f) else real_decide(p,file,d)
try:bulk('A traced census-root identifier refuses mechanical rejection','r19-tuples',lambda rs,ts:None)
finally:b.a.binding_roots=olddoc;b.context.cache_clear();b.decide=real_decide
def judge(name,rule,change):
 rs,rc,ss,ix=copy.deepcopy([JR,RC,SS,IX]);change(rs,rc,ss,ix);out=j.check(rs,rc,ss,ix);caught=[x for x in out['failures'] if x['rule']==rule];probes.append({'name':name,'owningRule':rule,'pass':bool(caught),'caught':caught[:1]})
judge('A real read reference cannot disappear','j-coverage',lambda rs,rc,ss,ix:rs[0]['references'].pop())
judge('A pinned input cannot borrow another digest','j-pins',lambda rs,rc,ss,ix:rs[0]['protectedPins'].__setitem__('AGENTS.md','0'*64))
judge('A real read operation must have exact pinned passage text','j-spans',lambda rs,rc,ss,ix:rs[0]['dynamicTraces'][0]['currentPassage'].__setitem__('text','invented'))
judge('Document constructions must trace exact real consuming operations','j-spans',lambda rs,rc,ss,ix:next(e for e in rs[0]['dynamicTraces'] if e['admission']=='ADMIT')['consumingOperations'][0].__setitem__('text','unrelated fixture label'))
judge('A summary cannot claim the missing locked heading as a conserved target','j-claims',lambda rs,rc,ss,ix:rc['comparison']['claimCorrespondence'][0]['assertionWitnesses'][0].__setitem__('targetMatches',['invented']))
judge('Whole-file inverse must restore the original reader','j-patches',lambda rs,rc,ss,ix:ss[0].__setitem__('rollbackDiff','invalid'))
judge('Exact holder heading cannot lose its live-region witness','j-claims',lambda rs,rc,ss,ix:rc['comparison']['claimCorrespondence'][0]['liveRegionWitness'][0].__setitem__('resolverCarriage',True))
judge('Candidate outcome cannot claim an extra passing assertion','j-receipts',lambda rs,rc,ss,ix:rc['comparison'].__setitem__('candidateOutputSet',[{'outcomes':['extra']}]))
judge('Missing post-retirement proof cannot claim passing without a log','j-receipts',lambda rs,rc,ss,ix:rc['proofs'][-1].update(status='pass',exit=0))
judge('A missing-claim park cannot omit its source search witness','j-search',lambda rs,rc,ss,ix:next(e for e in rs[0]['references'] if e['disposition']=='parked').pop('searchWitness'))
judge('Judgment rejects remain independent review obligations','j-review',lambda rs,rc,ss,ix:next(e for e in ix['canonicalRecords'] if e['file']==JR[0]['file'])['judgmentCallIds'].pop())
out={'kind':'R19 and real-reader mutation probes; no consumer writes','baselineFailures':0,'passed':sum(p['pass'] for p in probes),'total':len(probes),'probes':probes,'failures':[p for p in probes if not p['pass']]};(P/'step-05-seam5-batch2-probes-result.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps(out,ensure_ascii=False));sys.exit(bool(out['failures']))
