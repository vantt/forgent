"""Extend existing judgment verifier with L12-80 source-grounded class sweep.
This proves record consistency, not independent semantic acceptance.
"""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,re,copy,hashlib,subprocess,traceback
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def module(name,file):
 s=importlib.util.spec_from_file_location(name,P/file);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
j=module('j4','step-05-seam5-batch4-judgment-check.py');root=module('roots','step-05-seam5-root-rules.py');m=j.m
RULES={'j5-uniform-history':'Every docs/history comment pointer in all judgment records is admitted/preserved uniformly.','j5-fixtures':'In-memory fixtures and proven temporary-root joins reject uniformly.','j5-successors':'Every preserved retired decision basename has a verified successor note.','j5-review-closure':'L12-80 disposition changes and the retained ui-spec witness are exact.','j5-review-delta':'Only changed/added judgment files are listed as this-turn review obligations.'}
FILES=['tests-prompt-goldens.jsonl','tests-real-file.jsonl','tests-real-file-batch3.jsonl','tests-judgment-batch4.jsonl','tests-judgment-batch5.jsonl']
def load():return [r for f in FILES for r in m.rows('step-05-records/'+f)]
def sweep(rs=None,listing=None):
 rs=load() if rs is None else rs;listing=m.read('step-05-seam5-review-list.json') if listing is None else listing;errors=[];counts={};evidence=[]
 def test(rule,where,fn):
  counts[rule]=counts.get(rule,0)+1
  try:
   result=fn();assert result is None or bool(result)
  except Exception as ex:errors.append({'rule':rule,'where':where,'error':str(ex) or traceback.format_exc()})
 fixturekeys={'doc-decision-conservation.test.mjs','doc-link-pass.test.mjs','doc-decision-exact.test.mjs','doc-decision-mirrors.test.mjs','doc-restoration-proofs.test.mjs','knowledge-classifier.test.mjs'}
 for r in rs:
  source=m.pinned(r['authorInputCommit'],r['file']);ls=source.splitlines();roots=root.Roots(r['authorInputCommit'],r['file'],source)
  for e in m.admission.allitems(r):
   x=e.get('matchedExpression',e.get('originalTuple',[None]*5)[4]);n=e.get('sourceSpans',[{}])[0].get('line',e.get('currentLine'));clean=re.sub(r'\n\s*(?://|\*)?\s*','',x);comment=ls[n-1].lstrip().startswith(('//','/*','*'));where=r['file']+':'+str(m.admission.idof(e))
   if comment and 'docs/history' in clean:
    test('j5-uniform-history',where,lambda e=e:e['admission']=='ADMIT' and e['disposition']=='preserve' and bool(e.get('resolverWitness')));evidence.append({'file':r['file'],'id':m.admission.idof(e),'class':'history-comment','line':n})
   if pathlib.PurePosixPath(r['file']).name in fixturekeys and not comment:
    test('j5-fixtures',where,lambda e=e:e['admission']=='REJECT' and e['disposition']=='preserve' and not e.get('pathOperand'))
   if 'originalTuple' in e and not e.get('historicalOnly') and re.match(r'(?:path\.(?:join|resolve)\(|\w+\.join\()',x):
    proof=roots.expr(x)
    if proof:
     test('j5-fixtures',where,lambda e=e:e['admission']=='REJECT' and not e.get('pathOperand'));evidence.append({'file':r['file'],'id':m.admission.idof(e),'class':'proven-non-document-root','line':n,'proof':proof})
   if m.admission.retired(e):test('j5-successors',where,lambda e=e:bool(e.get('successorNote')))
 by={r['file']:r for r in rs}
 def slot(f,id):return next(e for e in m.admission.allitems(by[f]) if m.admission.idof(e)==id)
 def closures():
  dead='test/runner/dead-vocabulary-guard.test.mjs';a=slot(dead,'dynamic-023891');b=slot(dead,'dynamic-023892');c=slot(dead,'reference-004371');assert a['admission']=='ADMIT' and a['disposition']=='parked' and a['blockedReason']==b['blockedReason'] and a['dependency']==b['dependency'] and a['pathOperand']=="path.join('docs', 'specs')" and c['resolverWitness']['treeRetires'] is True
  title=slot(dead,'reference-004372');assert title['admission']=='ADMIT' and title['disposition']=='preserve' and 'P5' in title['reason'] and 'baseline key' in title['reason']
  for id in ['dynamic-023831','dynamic-023880','dynamic-023897','dynamic-023899','dynamic-023869']:assert slot(dead,id)['admission']=='ADMIT' and slot(dead,id)['disposition']=='preserve'
  a=slot('apps/fgos-gateway/web/src/App.test.tsx','reference-000201');assert a['admission']=='ADMIT' and a['disposition']=='preserve' and 'docs/ui-spec retained (seam 6 rule)' in a['reason']
  a=slot('test/architecture.test.mjs','reference-003949');assert a['admission']=='ADMIT' and a['disposition']=='preserve'
  a=slot('test/docs/decisions-corpus-retired.test.mjs','reference-004035');assert a['disposition']=='parked' and '0010/0015/0017' in a['blockedReason'] and 'Step 7' in a['blockedReason'] and a['retentionHeadingEvidence']['proposedPresent'] is False
  a=slot('test/docs/decisions-corpus-retired.test.mjs','dynamic-018736');assert a['successorNote']=='docs/decisions/index.md'
  a=slot('test/state/domain-fields.test.mjs','author-s5-b4-domain-fields-1-66');assert a['successorNote'] and '0027' in a['matchedExpression'] and len(a['sourceSpans'])==3
  a=slot('test/runner/dispatch-worker-session.test.mjs','reference-004380');assert a['admission']=='ADMIT' and a['disposition']=='patch';j.assert_patch(by['test/runner/dispatch-worker-session.test.mjs'],next(x for x in m.read('step-05-seam5-batch4-parity-receipts.json')['receipts'] if x['id']==a['receiptId']),m.pinned(by['test/runner/dispatch-worker-session.test.mjs']['authorInputCommit'],'test/runner/dispatch-worker-session.test.mjs'))
  e=by['test/report/enduser-index.test.mjs'];assert e['realReadSetContract']['symlinkFixture']=='test/report/helpers/docs-index-state-fixture.mjs' and e['protectedPins']['test/report/helpers/docs-index-state-fixture.mjs'] and any(x['disposition']=='parked' and x.get('owningGeneratorParks') for x in m.admission.allitems(e))
 test('j5-review-closure','all explicit Lead rulings',closures)
 def delta():
  closure=m.read('step-05-seam5-batch5-review-closure.json');latest=m.read('step-05-seam5-batch6-review-closure.json');changed={e['file']:e for e in latest['changedRecords']}
  for e in closure['changedRecords']:
   r=by[e['file']];expected=changed[e['file']]['beforeSha256'] if e['file'] in changed else m.admission.r26_module().before_current(r['file'],m.sha(json.dumps(r,ensure_ascii=False,separators=(',',':'))));assert e['afterSha256']==expected
  prior=listing if listing['closedBatch']==6 else listing['previousReviewDeltas']['6']
  assert len(prior['addedThisTurn'])==100
  expected={e['file'] for e in latest['changedRecords'] if e['dispositionChanged']}|{e['file'] for e in prior['addedThisTurn']};assert set(prior['reviewThisTurn'])==expected
  if listing['closedBatch']!=6:
   assert listing['closedBatch']==7
   selection=m.read('step-05-seam5-batch7-selection.json');authoring=listing['previousReviewDeltas']['L12-83'] if listing.get('reviewClosureRuling')=='L12-85' else listing;assert [e['file'] for e in authoring['addedThisTurn']]==selection['files'] and len(authoring['addedThisTurn'])==selection['fileCount']
   assert m.admission.r26_module().review_delta(listing)
 test('j5-review-delta','review changed or added sources only',delta)
 return {'files':len(rs),'rules':RULES,'checks':counts,'failureCount':len(errors),'failures':errors,'sourceSweepEvidence':evidence}
def check(rs=None,receipts=None,listing=None,run_sweep=True):
 out=j.check(rs=rs,receipts=receipts,listing=listing,batch=5)
 if run_sweep:
  sw=sweep(listing=listing);out['rules'].update(sw['rules']);out['checks'].update(sw['checks']);out['failures']+=sw['failures'];out['failureCount']=len(out['failures']);out['sweep']=sw
 return out
if __name__=='__main__':
 out=check();(P/'step-05-seam5-batch5-judgment-check.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps(out,ensure_ascii=False));sys.exit(bool(out['failures']))
