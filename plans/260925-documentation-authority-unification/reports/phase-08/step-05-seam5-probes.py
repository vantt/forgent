"""Reject mutations against closed prompt batch; no consumer/baseline writes."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,copy
P=pathlib.Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('s5',P/'step-05-seam5-check.py');m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
BASE=m.load();RC=m.read('step-05-seam5-parity-receipts.json')['receipts'];SS=m.read('step-05-seam5-cutover-specs.json')['patches'];IX=m.read('step-05-seam5-review-list.json');Q=m.read('step-05-seam5-continuation.json')
baseline=m.check();assert baseline['failureCount']==0,baseline['failures'];probes=[]
def run(name,rule,fn):
 rs,rc,ss,ix,q=copy.deepcopy([BASE,RC,SS,IX,Q]);fn(rs,rc,ss,ix,q);out=m.check(rs,rc,ss,ix,q);caught=[f for f in out['failures'] if f['rule']==rule];probes.append({'name':name,'owningRule':rule,'pass':bool(caught),'caught':caught[:2]})
run('A closed reference cannot disappear','s5-coverage',lambda rs,rc,ss,ix,q:rs[0]['references'].pop())
run('Remaining queue must equal original population minus all closed files','s5-coverage',lambda rs,rc,ss,ix,q:q['remainingFilesInOrder'].pop() if q['remainingFilesInOrder'] else q['remainingFilesInOrder'].append(next(e for e in m.m.rows('step-05-population-files.jsonl') if e['seam']=='real-file-tests-goldens')))
run('Whole-file docs-root coverage cannot lose a physical span','s5-lexical',lambda rs,rc,ss,ix,q:rs[0]['references'][0].__setitem__('sourceSpans',[]))
run('Pinned bytes cannot borrow HEAD digest','s5-pins',lambda rs,rc,ss,ix,q:rs[0].__setitem__('sourceSha256','0'*64))
run('Passage text must match its pin','s5-spans',lambda rs,rc,ss,ix,q:rs[0]['references'][0].__setitem__('passage','invented'))
run('Inherited Step4 source slot disposition is checked','s5-inheritance',lambda rs,rc,ss,ix,q:rs[0]['references'][0]['inheritedSourceSlot'].__setitem__('disposition','parked'))
run('Rollback must restore whole pinned source','s5-patches',lambda rs,rc,ss,ix,q:ss[0].__setitem__('rollbackDiff','invalid patch'))
run('Golden cannot be updated outside atomic source unit','s5-atomic',lambda rs,rc,ss,ix,q:rc[0]['atomicUnit'].__setitem__('files',[BASE[1]['file']]))
run('Expected complete prompt cannot lose a byte','s5-atomic',lambda rs,rc,ss,ix,q:rc[0]['atomicUnit'].__setitem__('candidatePrompt',rc[0]['atomicUnit']['candidatePrompt'].rstrip()))
run('Unrun candidate proof cannot claim passing without a log','s5-receipts',lambda rs,rc,ss,ix,q:rc[0]['proofs'][1].update(status='pass',exit=0))
run('Admitted item cannot be omitted from window review','s5-review',lambda rs,rc,ss,ix,q:ix['canonicalRecords'][0]['admittedIds'].pop())
def root_reject(rs,rc,ss,ix,q):
 r=rs[1];d=r['dynamicTraces'][0];sample=next(d for d in r['dynamicTraces'] if d.get('mechanicalRejection'));ev=copy.deepcopy(sample['mechanicalRejection']);enc=m.enclosing_test(m.m.pinned(r['authorInputCommit'],r['file']),d['currentLine']);ev['enclosingFunction']=dict(enc,sha256=m.sha(enc['text']));d.update(admission='REJECT',disposition='preserve',nonDocumentUse='text-label-join',mechanicalRejection=ev)
run('Mechanical reject fails when its full callback contains docs/specs/widget.md','r19-label-diagnostic',root_reject)
real_bindings=m.m.admission.binding_roots
m.m.admission.binding_roots=lambda pin,file:dict(real_bindings(pin,file),placeholder={'documents'})
try:run('A diagnostic identifier traced to a census-root constant cannot reject mechanically','r19-label-diagnostic',lambda rs,rc,ss,ix,q:None)
finally:m.m.admission.binding_roots=real_bindings
assert {p['owningRule'] for p in probes}==set(m.RULES)
out={'kind':'Closed seam5 batch rejecting probes','baselineFailures':0,'passed':sum(p['pass'] for p in probes),'total':len(probes),'probes':probes,'failures':[p for p in probes if not p['pass']]}
(P/'step-05-seam5-probes-result.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps(out,ensure_ascii=False));sys.exit(bool(out['failures']))
