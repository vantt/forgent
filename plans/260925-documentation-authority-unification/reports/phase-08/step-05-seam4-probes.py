"""One rejecting mutation per seam4 rule; no fixture or consumer writes."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,copy
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('s4',P/'step-05-seam4-check.py');m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
BASE=m.load();RECEIPTS=m.read('step-05-seam4-parity-receipts.json')['receipts'];SPECS=m.read('step-05-seam4-cutover-specs.json')['patches'];INDEX=m.read('step-05-seam4-review-index.json')
baseline=m.check();assert baseline['failureCount']==0,baseline['failures'][:5]
# R17 positive mutation: only git HEAD is different; immutable pinned evidence stays valid.
real_pinned=m.m.pinned
def changed_head(pin,file):
 text=real_pinned(pin,file)
 return '// HEAD-only drift\n'+text if pin=='HEAD' else text
m.m.pinned=changed_head
try:
 head_only=m.check()
 assert head_only['failureCount']==0,head_only['failures']
 assert head_only['headDrift'], 'HEAD-only drift must be reported, not suppressed'
finally:m.m.pinned=real_pinned
probes=[]
def run(name,rule,mutate=None,override=None,packets=False):
 rs=copy.deepcopy(BASE);rc=copy.deepcopy(RECEIPTS);ss=copy.deepcopy(SPECS);ix=copy.deepcopy(INDEX)
 if mutate:mutate(rs,rc,ss,ix)
 reader=m.read
 if override:
  file,fn=override;obj=copy.deepcopy(reader(file));fn(obj);m.read=lambda name:obj if name==file else reader(name)
 try:out=m.check(rs,rc,ss,ix,check_packets=packets)
 finally:m.read=reader
 caught=[f for f in out['failures'] if f['rule']==rule];probes.append({'name':name,'owningRule':rule,'pass':bool(caught),'caught':caught[:2]})
 print('probe '+str(len(probes))+': '+name+(' — rejected' if caught else ' — NOT REJECTED'),flush=True)
def ref(rs):return next(e for r in rs for e in r['references'])
def dyn(rs):return next(d for r in rs for d in r['dynamicTraces'])
run('Dropping a promoted generated-output reference cannot shrink coverage','s4-coverage',lambda rs,rc,ss,ix:next(r for r in rs if r['file']=='docs/doc-registry.json')['references'].pop())
run('False whole-file digest is rejected','s4-pins',lambda rs,rc,ss,ix:rs[0].__setitem__('sourceSha256','0'*64))
run('Forged current physical token is rejected','s4-spans',lambda rs,rc,ss,ix:ref(rs)['sourceSpans'][0].__setitem__('text','invented'))
def inherited(rs,rc,ss,ix):next(e for r in rs for e in r['references'] if e['resolverWitness'].get('prior'))['resolverWitness']['prior']['recordLine']=99999
run('Inherited source-slot identity is not a copied approval','s4-inheritance',inherited)
def scalar(rs,rc,ss,ix):next(d for r in rs for d in r['dynamicTraces'] if 'hasGlobA' in d['originalTuple'][4]).update(admission='ADMIT',disposition='preserve')
run('Scalar glob guard cannot become an admitted path operation','s4-operand',scalar)
def lookup(rs,rc,ss,ix):next(r for r in rs if r['file']=='src/report/knowledge-resolver.mjs')['dynamicTraces'][0].update(admission='REJECT',disposition='preserve')
run('Document currentPath comparison cannot be discarded as unrelated scalar','s4-operand',lookup)
run('A park must keep its own dependency','s4-parks',lambda rs,rc,ss,ix:next(e for r in rs for e in r['references'] if e['disposition']=='parked').__setitem__('dependency',None))
def retained(rs,rc,ss,ix):next(e for r in rs for e in r['references'] if e['disposition']=='preserve' and e['matchedExpression']=='docs/specs/')['resolverWitness']={'rule':'retained tree'}
run('Retiring-root target cannot use a retained witness','s4-retiring-retained',retained)
run('Full-file after hash cannot be invented','s4-patches',lambda rs,rc,ss,ix:ss[0].__setitem__('expectedAfterSha256','0'*64))
run('Inverse rollback must restore pinned bytes','s4-patches',lambda rs,rc,ss,ix:ss[0].__setitem__('rollbackDiff','not a patch'))
run('Test grep proof cannot disappear','s4-greps',lambda rs,rc,ss,ix:ss[0].__setitem__('coCutTestGreps',[]))
run('Generated output cannot receive a manual diff','s4-outputs',lambda rs,rc,ss,ix:next(r for r in rs if r['generated']).__setitem__('diff','authored output'))
run('Sorted output set cannot claim an invented digest','s4-outputs',override=('step-05-seam4-output-provenance.json',lambda d:d['currentTrackedOutputSet'][0].__setitem__('sha256','0'*64)))
run('Unrun generator parity cannot become a pass','s4-receipts',lambda rs,rc,ss,ix:rc[0]['proofs'][0].update(status='pass',exit=0))
run('One of 165 inherited pilot ids cannot disappear','s4-carries',override=('step-05-seam4-inherited-carries.json',lambda d:d['pilotOriginal165'].pop()))
run('One original unresolved carry cannot disappear','s4-carries',override=('step-05-seam4-inherited-carries.json',lambda d:d['dynamicCarries'].pop()))
run('Whole-file lexical occurrence cannot disappear','s4-lexical',override=('step-05-seam4-own-operand-sweep.json',lambda d:d['wholeFileLexicalCoverage'].pop()))
run('Oversized review part metadata is rejected','s4-review',lambda rs,rc,ss,ix:ix['parts'][0].__setitem__('bytes',400001),packets=True)
run('Missing source caller declaration is rejected','s4-spans',lambda rs,rc,ss,ix:next(d for r in rs for d in r['dynamicTraces'] if d.get('enclosingFunctionEvidence') and d['enclosingFunctionEvidence']['symbol']).__setitem__('caller',{'line':1,'declaration':'invented'}))
run('An invented owning test cannot count as proof','s4-receipts',lambda rs,rc,ss,ix:rc[0]['proofs'][0].__setitem__('command','node --test test/invented-missing-proof.test.mjs'))
def fake_intermediate(rs,rc,ss,ix):
 generated={r['file'] for r in rs if r['generated']}
 next(i for x in rc for i in x['candidateInputs'] if i['path'] in generated).__setitem__('sha256','0'*64)
run('An uncomputed generated intermediate cannot claim a candidate hash','s4-receipts',fake_intermediate)
def wrong_field_role(rs,rc,ss,ix):
 next(e for r in rs for e in r['references'] if e.get('projectionFieldAtSpan')=='aliases').__setitem__('role','capture/provenance-key')
run('Equal alias and capture strings cannot borrow each others field role','s4-spans',wrong_field_role)
def item(rs,id):return next(e for r in rs for e in r['references']+r['dynamicTraces']+r.get('authorAddedReferences',[]) if e.get('id',e.get('referenceId'))==id)
run('Literal-literal same passage admission is all-pairs','a-passage-agreement',lambda rs,rc,ss,ix:item(rs,'reference-000002').__setitem__('admission','REJECT'))
run('Dynamic-dynamic nested path operation must agree','a-passage-agreement',lambda rs,rc,ss,ix:item(rs,'dynamic-009775').__setitem__('admission','REJECT'))
run('Literal-dynamic shared retained root must agree','a-passage-agreement',lambda rs,rc,ss,ix:item(rs,'dynamic-001704').__setitem__('disposition','parked'))
def shared_block(rs,rc,ss,ix):
 pairs=[(r,e) for r in rs for e in r['references'] if e['disposition']=='parked'];r,e=pairs[0];q,t=next((q,t) for q,t in pairs if q['file']!=r['file']);t['blockedReason']=e['blockedReason']
run('A verbatim blocker reused in different files is rejected','b-real-blocker',shared_block)
run('A generated preserve owner cannot acquire an own park','c-render-owner',lambda rs,rc,ss,ix:item(rs,'reference-000002').__setitem__('disposition','parked'))
run('Every admitted tuple needs exact own pathOperand','d-own-operand',lambda rs,rc,ss,ix:item(rs,'dynamic-001704').pop('pathOperand'))
run('Unknown nonDocumentUse category is rejected','d-own-operand',lambda rs,rc,ss,ix:next(d for r in rs for d in r['dynamicTraces'] if d['admission']=='REJECT').__setitem__('nonDocumentUse','anything-goes'))
run('Borrowed neighbouring path cannot replace own operand','d-own-operand',lambda rs,rc,ss,ix:item(rs,'dynamic-001704').__setitem__('pathOperand','function requireRoot(args)'))
run('Wrapped retired citation requires its live narrative successor','e-retired-successor',lambda rs,rc,ss,ix:item(rs,'reference-002431').__setitem__('successorNote',None))
run('An existing unrelated heading cannot impersonate the decision successor','e-retired-successor',lambda rs,rc,ss,ix:item(rs,'reference-002431').__setitem__('successorNote','docs/platform/component-boundary.md#18-implementation-reality-additional-boundaries-found-in-code'))
def templated_block(rs,rc,ss,ix):
 r=next(r for r in rs if r['file']=='scripts/knowledge-migration.mjs')
 es=[e for e in r['dynamicTraces'] if e['id'] in ['dynamic-008173','dynamic-008186']]
 for i,e in enumerate(es):e['blockedReason']=r['file']+": operation '"+str(e['originalTuple'][4])+"' at line "+str(10+i)+" requires an authorized inventory export."
run('R12 rejects operand-swapped blockers in separate passages of one file','b-real-blocker',templated_block)
run('R11 rejects admission of a plan-only report constant','r11-plans-boundary',lambda rs,rc,ss,ix:item(rs,'dynamic-006605').update(admission='ADMIT',nonDocumentUse=None))
assert {p['owningRule'] for p in probes}==set(m.RULES)
out={'kind':'Seam4 rejecting mutation probes','baselineFailures':baseline['failureCount'],'headOnlyDrift':{'pass':head_only['failureCount']==0,'reportedFiles':len(head_only['headDrift'])},'rulesCovered':sorted(m.RULES),'passed':sum(p['pass'] for p in probes),'total':len(probes),'probes':probes,'failures':[p for p in probes if not p['pass']]}
(P/'step-05-seam4-probes-result.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in out.items() if k!='probes'}));sys.exit(bool(out['failures']))
