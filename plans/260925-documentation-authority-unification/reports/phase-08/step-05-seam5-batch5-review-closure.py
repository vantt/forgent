"""Apply Lead L12-80 only after checking each record against immutable source.
No product file is written. Journal before/after semantic changes for Lead review.
"""
import sys
sys.dont_write_bytecode=True
import pathlib,json,subprocess,hashlib,copy,re,difflib
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def read(f):return json.loads((P/f).read_text())
def save(f,o):(P/f).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def sha(x):return hashlib.sha256(x.encode() if isinstance(x,str) else x).hexdigest()
def blob(pin,f):return subprocess.check_output(['git','show',pin+':'+f],cwd=ROOT).decode()
def items(r):return r['references']+r['dynamicTraces']+r.get('authorAddedReferences',[])
def expr(e):return e.get('matchedExpression',e.get('originalTuple',[None]*5)[4])
def identity(e):return e.get('referenceId',e.get('id'))
def line(e):return e.get('sourceSpans',[{}])[0].get('line',e.get('currentLine'))
def admit(r,e,why,role='comment-provenance',operand=None):
 e.update(admission='ADMIT',nonDocumentUse=None,role=role,reason=why)
 e['resolverWitness']={'inputCommit':r['authorInputCommit'],'readOnly':True,'expression':operand or expr(e),'treeRetires':bool(re.search(r'docs/specs|docs/architect',expr(e))),'evidence':why}
 if 'originalTuple' in e:
  op=operand or expr(e);ls=blob(r['authorInputCommit'],r['file']).splitlines();n=next(n for n in range(e['currentPassage']['startLine'],e['currentPassage']['endLine']+1) if op in ls[n-1]);k=ls[n-1].index(op)+1;e['pathOperand']=op;e['pathOperandWitness']={'line':n,'columnStart':k,'columnEndExclusive':k+len(op),'text':op}
def reject(e,why):
 e.update(admission='REJECT',disposition='preserve',role='non-document-operation',nonDocumentUse='config-or-metadata',reason=why)
 for k in ['resolverWitness','pathOperandWitness','fixtureProvenance']:e.pop(k,None)
 if 'originalTuple' in e:e['pathOperand']=None

journal=[];changed=[];records={};before={};sources=[]
for fn in ['tests-real-file.jsonl','tests-real-file-batch3.jsonl','tests-judgment-batch4.jsonl']:
 rs=[json.loads(l) for l in (P/'step-05-records'/fn).read_text().splitlines()];records[fn]=rs
 for r in rs:
  before[r['file']]=copy.deepcopy(r);body=blob(r['authorInputCommit'],r['file']);ls=body.splitlines();assert sha(body)==r['sourceSha256'];sources.append({'file':r['file'],'pin':r['authorInputCommit'],'sha256':sha(body),'bytes':len(body.encode())})
  for e in items(r):
   if 'originalTuple' in e:
    if e.get('historicalOnly'):continue
    w=e['operationWitness'];assert ls[w['line']-1][w['columnStart']-1:w['columnEndExclusive']-1]==w['text']
   else:
    for w in e['sourceSpans']:assert ls[w['line']-1][w['columnStart']-1:w['columnEndExclusive']-1]==w['text']
  key=pathlib.Path(r['file']).name
  for e in items(r):
   x=expr(e);n=line(e);src=ls[n-1];iscomment=src.lstrip().startswith(('//','/*','*'))
   if iscomment and 'docs/history' in x:
    admit(r,e,'R16/L12-80: preserve this dated docs/history comment pointer; history is provenance, not an instruction to move authority.')
   elif iscomment and 'docs/architect/doing-' in x:
    admit(r,e,'L12-80/R16: dated tsk-40m provenance; docs/architect tree retires. Carrier docs/platform/proposals/doing-coordination-redesign.md explicitly declares non-canonical status, so it is not a navigation patch target.')
   if key in ['doc-decision-conservation.test.mjs','doc-link-pass.test.mjs','doc-decision-exact.test.mjs','doc-decision-mirrors.test.mjs','doc-restoration-proofs.test.mjs','knowledge-classifier.test.mjs'] and e['admission']=='ADMIT':
    reject(e,'L12-80/R5/R21: '+('test-owned mkdtemp filesystem descendant; it never addresses the repository document tree: ' if 'originalTuple' in e and ('join(' in x or 'Dir =' in x) else 'pure in-memory fixture path/string; no repository document operation: ')+repr(x))
   if key=='App.test.tsx':
    if identity(e)=='reference-000201':admit(r,e,'docs/ui-spec retained (seam 6 rule); Phase 6 move-set entries are conservative proposals. L12-80 preserves S01 authoring pointer.')
    else:e['nonDocumentUse']='scalar-pass-through';e['reason']='Fetch mock Promise.resolve/jsonResponse fixture; no document path is constructed: '+repr(x)
   if key=='architecture.test.mjs' and identity(e)=='reference-003949':admit(r,e,'R16/L12-80: comment points to the retained docs/architecture-manifest.json real reader at line 24; retention follows L12-60(6)/L12-71.')
   if key=='dead-vocabulary-guard.test.mjs':
    byid={identity(z):z for z in items(r)}
    if identity(e)=='dynamic-023891':
     donor=byid['dynamic-023892'];admit(r,e,donor['reason'],'real-document-reader',"path.join('docs', 'specs')")
     for k in ['disposition','timing','blockedCategory','blockedReason','dependency','dependencyCategory','searchWitness','parityObligation']:e[k]=copy.deepcopy(donor[k])
    if identity(e)=='reference-004372':admit(r,e,'L12-80/R16: runtime-emitted test title is a baseline key; preserve title bytes until the parked P5 scan patch (reference-004373 / dynamic-023873/023874) is composed, then co-cut title and scan together.','test-title')
    if identity(e) in ['dynamic-023831','dynamic-023880','dynamic-023897','dynamic-023899','dynamic-023869']:admit(r,e,'L12-80/R16: failing-test diagnostic emits rel from fixed document-root file lists; preserve diagnostic and assertion.','document-path-diagnostic')
    if identity(e)=='reference-004371':e['resolverWitness']['treeRetires']=True
    if identity(e)=='reference-004375':e['nonDocumentUse']='text-label-join';e['reason']='Regex strips docs/history slug text from lines already loaded; line-text filtering, not an additional filesystem read.'
   if key=='decisions-corpus-retired.test.mjs':
    if identity(e)=='reference-004035':
     why=r['file']+': root docs/architecture-map.md supplies ### 0010/0015/0017 to the 34-ID scan. Phase 6 proposes docs/platform/architecture-map.md, which lacks all three headings. Step 7 must settle root retention plus exact heading carriage before composing this reader; do not substitute a summary or relax heading assertions.'
     donor=next(z for z in items(r) if identity(z)=='reference-004034');e.update(disposition='parked',timing='phase9',blockedCategory='claim-correspondence',dependency='architecture-map-retention-heading-carriage',dependencyCategory='claim-correspondence',blockedReason=why,reason=why);e['searchWitness']=copy.deepcopy(donor['searchWitness']);e['searchWitness']['assessment']=why
     old=blob(r['authorInputCommit'],'docs/architecture-map.md');new=blob(r['authorInputCommit'],'docs/platform/architecture-map.md');assert all(re.search('^### '+code+r'\b',old,re.M) and not re.search('^### '+code+r'\b',new,re.M) for code in ['0010','0015','0017']);e['retentionHeadingEvidence']={'inputCommit':r['authorInputCommit'],'oldSha256':sha(old),'proposedSha256':sha(new),'requiredHeadings':['0010','0015','0017'],'oldPresent':True,'proposedPresent':False,'moveSetEvidence':'step-05-cutover-move-set.json'}
    if identity(e)=='dynamic-018736':e['successorNote']='docs/decisions/index.md'
    if identity(e) in ['reference-004030','reference-004039','reference-004041']:e['reason']='L12-80: docs/decisions is retained with generated index.md; this comment records the retired numbered corpus, not a docs/specs retirement claim.'
    if identity(e)=='reference-004036':e['reason']='L12-80: root docs/architecture-map.md comment is provenance; its actual array-member read is separately parked at reference-004035 for root retention and heading carriage.'
    if e['disposition']=='patch':e['reason']+=' L12-80: assertion diagnostics at lines 74/88 may print the rebound target on failure; only reader path and resulting diagnostic path text intentionally differ.'
   if key=='fgos-read-5.test.mjs' and identity(e)=='dynamic-017664':e['reason']='Temporary state-store/path plumbing, not the docs/history citation: '+repr(x)
   if key=='working-tree-clean-unified.test.mjs' and identity(e)=='dynamic-038834':e['reason']='Historical census title spelling differs from current title present at line 50; this tuple is historical metadata only. The whole-repo cleanliness behavior/test still exists at the author pin.';e['historicalOnly']['reason']=e['reason']
   if key=='codex-cli-glm-cli-live-executors.test.mjs':
    if identity(e)=='dynamic-023712':e['nonDocumentUse']='config-or-metadata';e['reason']='Source locator of local secrets configuration, not an event store or document. Source inspected only; secrets file is never opened and this test module is never imported or executed.'
    if identity(e)=='dynamic-023714':e['nonDocumentUse']='scalar-pass-through';e['reason']='Environment scalar interpolation into a mock/provider argument; not a document path. Value is never read or printed by this records turn.'
  r['parked']=[{'id':identity(e),'blockedReason':e['blockedReason'],'dependency':e['dependency']} for e in items(r) if e['disposition']=='parked']

# Full forward/inverse comment-only patch mandated by p04 D1.
r=next(r for r in records['tests-judgment-batch4.jsonl'] if r['file']=='test/runner/dispatch-worker-session.test.mjs');e=next(z for z in items(r) if identity(z)=='reference-004380');pin=r['authorInputCommit'];old=expr(e);new=old.replace('docs/architect/','docs/platform/');members=subprocess.check_output(['git','ls-tree','-r','--name-only',pin,'--',old],cwd=ROOT,text=True).splitlines();assert members
holder=[]
for f in members:
 target=f.replace('docs/architect/','docs/platform/',1);a=blob(pin,f);b=blob(pin,target);assert a==b;holder.append({'source':f,'target':target,'sha256':sha(a),'byteIdentical':True})
admit(r,e,'L12-80/R8: module-header live-probe navigation pointer; complete proof directory has an identical docs/platform holder. Source-only comment patch, no assertion or test-title delta.','comment-navigation')
body=blob(pin,r['file']);candidate=body.replace(old,new);assert candidate!=body and body.count(old)==1
make=lambda a,b:''.join(difflib.unified_diff(a.splitlines(True),b.splitlines(True),fromfile='a/'+r['file'],tofile='b/'+r['file']))
r.update(diff=make(body,candidate),rollbackDiff=make(candidate,body),expectedAfterSha256=sha(candidate),coCutPaths=[r['file'],'CHANGELOG.md']);e.update(disposition='patch',timing='phase9',target=new,proposedReplacement=new,anchor=None,diffHunk=r['diff']);e['resolverWitness']['holderDirectory']=holder;e['parityObligation']='R22: replay complete owning test on immutable current and candidate sources; Phase 9 full suite still owed.'
spec={'inputCommit':pin,'file':r['file'],'sourceSha256':r['sourceSha256'],'mode':r['sourceMode'],'symbolOrPassage':'module-header live-probe pointer L15','oldText':body,'newText':candidate,'sourceSpans':e['sourceSpans'],'diff':r['diff'],'expectedAfterSha256':r['expectedAfterSha256'],'targetOwner':new,'claimAnchorProof':{'directoryMembers':holder,'anchor':None},'receiptId':r['receiptIds'][0],'coCutPaths':r['coCutPaths'],'expectedOutputSets':[],'testTargets':[r['file']],'intentionalBehaviorDeltas':['Comment navigation pointer only; all test names and assertions unchanged.'],'prerequisites':['Phase 9 holder promotion and Step 7 final-pin composition'],'order':'atomic source-only comment change, with release changelog','rollbackDiff':r['rollbackDiff'],'timing':'phase9','readiness':'pending independent review and Phase 9 full suite'}
# Reuse the exact shared co-cut grep door.
import importlib.util
s=importlib.util.spec_from_file_location('checks',P/'step-05-check.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m);spec['coCutTestGreps']=[m.test_grep(pin,old)]
assert all(hit['file'] in r['coCutPaths'] for g in spec['coCutTestGreps'] for hit in g['matches'])
save('step-05-seam5-batch5-review-cutover-specs.json',{'patches':[spec]})
for fn,rs in records.items():
 for r in rs:
  prev=before[r['file']]
  for a,z in zip(items(prev),items(r)):
   if a!=z:journal.append({'file':r['file'],'id':identity(z),'sourcePin':r['authorInputCommit'],'sourceLine':line(z),'before':a,'after':z})
  if r!=prev:changed.append({'file':r['file'],'recordFile':'step-05-records/'+fn,'beforeSha256':sha(json.dumps(prev,ensure_ascii=False,separators=(',',':'))),'afterSha256':sha(json.dumps(r,ensure_ascii=False,separators=(',',':')))})
 (P/'step-05-records'/fn).write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs))
rc=read('step-05-seam5-batch4-parity-receipts.json')
for r in records['tests-judgment-batch4.jsonl']:
 receipt=next(z for z in rc['receipts'] if z['id']==r['receiptIds'][0]);receipt['blockedBy']=list(dict.fromkeys(e['blockedReason'] for e in items(r) if e['disposition']=='parked'))
 if r['diff']:
  receipt['candidateInputs']=copy.deepcopy(receipt['currentInputs']);receipt['candidateInputs'][0].update(sha256=r['expectedAfterSha256'],bytes=len(candidate.encode()));receipt['cutoverSpecifications']=[spec];receipt['coCutPaths']=r['coCutPaths'];receipt['coCutTestGreps']=spec['coCutTestGreps'];receipt['comparison']['intentionalDeltas']=spec['intentionalBehaviorDeltas'];receipt['comparison']['candidateScope']='Complete pinned current/candidate replay of comment-only navigation change; no post-retirement claim.'
save('step-05-seam5-batch4-parity-receipts.json',rc)
save('step-05-seam5-batch4-cutover-specs.json',{'patches':[spec],'reason':'L12-80 p04 D1 source-only navigation patch; other files preserve or park.'})
rc=read('step-05-seam5-batch2-judgment-receipts.json');rc['receipts'][0]['blockedBy']=list(dict.fromkeys(e['blockedReason'] for r in records['tests-real-file.jsonl'] for e in items(r) if e['disposition']=='parked'));save('step-05-seam5-batch2-judgment-receipts.json',rc)
save('step-05-seam5-batch5-review-closure.json',{'ruling':'L12-80','sourceChecks':sources,'changes':journal,'changedRecords':changed,'reviewReports':[f'review-a38-step-05-s5-j-p0{i}.md' for i in range(1,6)],'policy':'p05 preserved; all named rulings applied; no independent acceptance claimed'})
print('changed records',len(changed),'changed items',len(journal))
