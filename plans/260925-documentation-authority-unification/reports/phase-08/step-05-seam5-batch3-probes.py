"""In-memory negative probes for R20 and the RUL104 reader; no source writes."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,copy
P=pathlib.Path(__file__).resolve().parent
def module(name,file):
 s=importlib.util.spec_from_file_location(name,P/file);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
n=module('neutral','step-05-seam5-neutral-rules.py');j=module('j3','step-05-seam5-batch3-judgment-check.py')
base=n.check();basej=j.check();assert base['failureCount']==basej['failureCount']==0,(base['failures'],basej['failures'])
RS=n.b.rows('step-05-records/tests-cutover-neutral.jsonl');TS=n.b.rows('step-05-seam5-neutral-triage.jsonl');MS=n.model();probes=[]
def probe(name,rule,change):
 rs,ts,ms=copy.deepcopy([RS,TS,MS]);change(rs,ts,ms);out=n.check(rs,ts,ms);caught=[e for e in out['failures'] if e['rule']==rule];probes.append({'name':name,'rule':rule,'pass':bool(caught),'caught':caught[:1]})
probe('Move-set source hashes cannot be invented','r20-move-set',lambda rs,ts,ms:ms['sources'][0].__setitem__('sha256','0'*64))
probe('A remaining file cannot disappear from triage','r20-coverage',lambda rs,ts,ms:ts.pop())
probe('A neutral closure cannot omit an original tuple','r20-record',lambda rs,ts,ms:next(r for r in rs if r['dynamicTraces'])['dynamicTraces'].pop())
probe('Previously proved R19 rejects stay byte-for-byte','r20-record',lambda rs,ts,ms:next(e for r in rs for e in r['dynamicTraces'] if e.get('priorR19Rejection'))['priorR19Rejection'].__setitem__('admission','ADMIT'))
probe('An unresolved file cannot close merely by a flag','r20-context',lambda rs,ts,ms:next(t for t in ts if not t['wholeFileNeutralClosure']).__setitem__('wholeFileNeutralClosure',True))
f=RS[0]['file'];actual=n.b.body(n.PIN,f);original_body=n.b.body;original_bindings=n.b.a.path_bindings;fake=str(pathlib.PurePosixPath(f).parent/'r20-move-probe.mjs')
def injected(name,append,source=None):
 def body(pin,file):
  if (pin,file)==(n.PIN,f):return actual+'\n'+append+'\n'
  if file==fake and source is not None:return source
  return original_body(pin,file)
 def bindings(pin,file):
  if file==fake and source is not None:return {'MOVED_PATH':["'docs/specs/widget.md'"]}
  return original_bindings(pin,file)
 old_context=n.context
 n.b.body=body;n.b.a.path_bindings=bindings
 n.context=lambda pin,file:old_context.__wrapped__(pin,file) if file==f else old_context(pin,file)
 def force_neutral_with_exact_changed_context(rs,ts,ms):
  # Rebind the complete context/hash to injected bytes. Only the unsafe
  # neutrality flag remains wrong; a hash mismatch cannot satisfy this probe.
  row=next(t for t in ts if t['file']==f)
  row['context']=n.context(n.PIN,f)
  row['wholeFileNeutralClosure']=True
 try:probe(name,'r20-context',force_neutral_with_exact_changed_context)
 finally:n.b.body=original_body;n.b.a.path_bindings=original_bindings;n.context=old_context
injected('A move-set literal anywhere in the full-file context refuses neutrality',"const h = 'docs/specs/widget.md';")
injected('A template below retained docs root can reach moved files',"const h = `docs/${area}/${name}.md`;")
injected('A referenced imported move-set constant refuses neutrality',"import { MOVED_PATH } from './r20-move-probe.mjs';\nfs.readFileSync(MOVED_PATH);", "export const MOVED_PATH='docs/specs/widget.md';")
injected('An unresolved path-constant import refuses neutrality',"import { docPath } from './r20-unresolved-probe.mjs';\nfs.readFileSync(docPath);")
injected('Static literal concatenation cannot conceal a retiring root',"const h = 'do' + 'cs/specs/widget.md';")
injected('An open root and suffix cannot borrow a later fixed filename',"path.join(repoRoot, unknownSuffix); assert.equal(value, 'unmoved.json');")
injected('An unresolved Rust path constant refuses neutrality',"use crate::DOC_PATH;\nstd::fs::read_to_string(DOC_PATH);")
injected('A namespace path constant cannot bypass import tracing',"import * as refs from './r20-unresolved-probe.mjs';\nfs.readFileSync(refs.DOC_PATH);")
injected('A CommonJS path constant cannot bypass import tracing',"const { DOC_PATH } = require('./r20-unresolved-probe.cjs');\nfs.readFileSync(DOC_PATH);")
JR=j.load();RC=j.m.read('step-05-seam5-batch3-judgment-receipt.json');IX=j.m.read('step-05-seam5-review-list.json');SE=j.m.read('step-05-seam5-batch3-search-evidence.json')
def judge(name,rule,change):
 rs,rc,ix,se=copy.deepcopy([JR,RC,IX,SE]);change(rs,rc,ix,se);out=j.check(rs,rc,ix,se);caught=[e for e in out['failures'] if e['rule']==rule];probes.append({'name':name,'rule':rule,'pass':bool(caught),'caught':caught[:1]})
judge('The law reader cannot be preserved without claim correspondence','j3-coverage',lambda rs,rc,ix,se:rs[0]['dynamicTraces'][3].__setitem__('disposition','preserve'))
judge('The actual foundations read cannot be replaced by an adjacent assertion','j3-coverage',lambda rs,rc,ix,se:rs[0]['dynamicTraces'][3]['consumingOperations'][0].__setitem__('line',27))
judge('Exact-law search cannot claim a missing candidate match','j3-search',lambda rs,rc,ix,se:se['queries'][1].__setitem__('matches',['fabricated holder']))
judge('Current legacy proof cannot become a post-retirement candidate output','j3-receipt',lambda rs,rc,ix,se:rc['comparison'].__setitem__('candidateOutputSet',[{'tests':2,'pass':2}]))
judge('All RUL104 judgment rejects remain window obligations','j3-review',lambda rs,rc,ix,se:next(e for e in ix['canonicalRecords'] if e['file']==JR[0]['file'])['judgmentCallIds'].pop())
positive={'retainedFixedDocumentLiteralIsNeutral':not n.literal_hazards("readFileSync('docs/non-moved-test-guide.md')"),'baselineRestored':n.check()['failureCount']==0}
old_pinned=j.m.pinned
j.m.pinned=lambda pin,file:old_pinned(pin,file)+'\n// HEAD-only drift\n' if pin=='HEAD' and file==f else old_pinned(pin,file)
try:
 drift=j.m.head_drift([RS[0]])
 positive['headOnlyDriftIsReportedWithoutFailingPinProof']=len(drift)==1 and drift[0]['failing'] is False and n.check()['failureCount']==0
finally:j.m.pinned=old_pinned
out={'kind':'R20 plus RUL104 probes','baselineFailures':0,'passed':sum(p['pass'] for p in probes),'total':len(probes),'probes':probes,'positiveProbes':positive,'failures':[p for p in probes if not p['pass']]};out['failures'] += [{'positiveProbe':k} for k,v in positive.items() if not v];(P/'step-05-seam5-batch3-probes-result.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps(out));sys.exit(bool(out['failures']))
