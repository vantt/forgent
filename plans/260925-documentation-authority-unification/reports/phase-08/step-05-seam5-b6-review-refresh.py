"""Refresh closure/review hash chains from the immutable pre-turn base."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,subprocess,copy,hashlib,importlib.util
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def read(f):return json.loads((P/f).read_text())
def save(f,x):(P/f).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def sha(x):return hashlib.sha256(x.encode() if isinstance(x,str) else x).hexdigest()
def items(r):return r['references']+r['dynamicTraces']+r.get('authorAddedReferences',[])
def ident(e):return e.get('referenceId',e.get('id'))
journal=read('step-05-seam5-b6-review-closure.json');base=journal.get('inputCommit') or subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip();journal['inputCommit']=base
records={f.name:[json.loads(l) for l in f.open()] for f in sorted((P/'step-05-records').glob('*.jsonl'))};by={r['file']:r for rs in records.values() for r in rs};loc={r['file']:str((P/'step-05-records'/fn).relative_to(ROOT)) for fn,rs in records.items() for r in rs};changes=[]
for fn,rs in records.items():
 old=[json.loads(l) for l in subprocess.check_output(['git','show',base+':'+str((P/'step-05-records'/fn).relative_to(ROOT))],cwd=ROOT,text=True).splitlines()]
 for a,z in zip(old,rs):
  if a==z:continue
  prior={ident(e):e for e in items(a)};delta=[{'id':ident(e),'beforeDisposition':prior.get(ident(e),{}).get('disposition'),'afterDisposition':e['disposition'],'admissionChanged':prior.get(ident(e),{}).get('admission')!=e.get('admission')} for e in items(z) if prior.get(ident(e))!=e]
  changes.append({'file':z['file'],'recordFile':'step-05-records/'+fn,'beforeSha256':sha(json.dumps(a,ensure_ascii=False,separators=(',',':'))),'afterSha256':sha(json.dumps(z,ensure_ascii=False,separators=(',',':'))),'dispositionChanged':any(e['beforeDisposition']!=e['afterDisposition'] for e in delta) or a.get('diff')!=z.get('diff'),'changes':delta})
journal['changedRecords']=changes;journal['counts'].update(changedRecords=len(changes),dispositionChanged=sum(x['dispositionChanged'] for x in changes),labelOnly=sum(not x['dispositionChanged'] for x in changes));save('step-05-seam5-b6-review-closure.json',journal)
ix=read('step-05-seam5-review-list.json');ix.setdefault('previousReviewDeltas',{}).setdefault('7-authoring',{k:copy.deepcopy(ix[k]) for k in ['reviewThisTurn','changedThisTurn','addedThisTurn']});ix['reviewClosureRuling']='L12-83';disp=[];labels=[]
for e in ix['canonicalRecords']:
 r=by[e['file']];e.update(recordSha256=sha(json.dumps(r,ensure_ascii=False,separators=(',',':'))),admittedIds=[ident(x) for x in items(r) if x['admission']=='ADMIT'],judgmentCallIds=[ident(x) for x in items(r) if x['admission']=='REJECT' and not x.get('mechanicalRejection')],windowJudgmentCallIds=[ident(x) for x in items(r) if x['admission']=='REJECT' and 'docs' in (str(x.get('passage',x.get('currentPassage',{}).get('text','')))+' '+str(x.get('pathOperand') or x.get('matchedExpression',x.get('originalTuple',[None]*5)[4])))])
for e in changes:
 if not e['recordFile'].split('/')[-1].startswith('tests-'):continue
 (disp if e['dispositionChanged'] else labels).append(e)
ix['changedThisTurn']={'dispositionChanged':disp,'labelOnly':labels};added=read('step-05-seam5-batch7-selection.json')['files'];index={e['file']:e for e in ix['canonicalRecords']};ix['addedThisTurn']=[index[f] for f in added];ix['reviewThisTurn']=list(dict.fromkeys(added+[e['file'] for e in disp]));ix['packingInstructions']['authorAddedReferences']='Include all authorAddedReferences in admitted and docs-bearing judgment windows, with exact source spans; do not omit supplemental slots.';ix['crossSeamChangedThisTurn']=[e for e in changes if not e['recordFile'].split('/')[-1].startswith('tests-')];save('step-05-seam5-review-list.json',ix)
s4=read('step-05-seam4-rereview-list.json')
for e in s4['canonicalRecords']:
 if e['file'] in by:
  r=by[e['file']];e['recordSha256']=sha(json.dumps(r,ensure_ascii=False,separators=(',',':')))
s4['l12-83-reviewObligations']=[e for e in changes if not e['recordFile'].split('/')[-1].startswith('tests-')];save('step-05-seam4-rereview-list.json',s4)
# Source 003854 patch reuses all old pilot specs/receipt decisions. Keep the
# new spec pointer bound to the actual composed source diff.
specs=read('step-05-seam5-b6-review-cutover-specs.json');blocks=read('step-05-seam5-batch6-replay-blockers.json')
f='test/runner/dispatch-executor-profile.test.mjs';r=by[f]
if not any(b['file']==f for b in blocks['blockers']):
 raw=subprocess.check_output(['git','show',r['authorInputCommit']+':'+f],cwd=ROOT,text=True)
 blocks['blockers'].append({'file':f,'inputCommit':r['authorInputCommit'],'sourceSha256':r['sourceSha256'],'requiredProof':'R22 current/candidate full owning replay','status':'blocked','reason':'Full owning cases call loadRunnerConfigFromDir on the repo root, which reads .fgos/config.json. That input is forbidden by this records-only contract; no state/config fixture is fabricated.','sourceEvidence':[{'line':i,'text':t} for i,t in enumerate(raw.splitlines(),1) if 'loadRunnerConfigFromDir' in t or 'REPO' in t or 'fileURLToPath' in t],'resolution':'R25 exact deferred replay in Phase 9 with authorized config input; initial scratch failure log remains visible.'})
save('step-05-seam5-batch6-replay-blockers.json',blocks)
s=importlib.util.spec_from_file_location('defrefresh',P/'step-05-seam5-batch7-deferred.py');d=importlib.util.module_from_spec(s);s.loader.exec_module(d)
rcfiles=['step-05-seam5-batch5-parity-receipts.json','step-05-seam5-batch6-parity-receipts.json'];deferred=[]
for fn in rcfiles:
 o=read(fn)
 for rc in o['receipts']:
  spec=next((z for z in specs['patches']+read('step-05-seam5-batch6-cutover-specs.json')['patches'] if z['receiptId']==rc['id']),None)
  if spec and any(b['file']==spec['file'] for b in blocks['blockers']):
   r=by[spec['file']];ob=d.obligation(spec,r,next(b for b in blocks['blockers'] if b['file']==r['file']));rc['deferredReplay']=ob;rc['proofs']=[{'command':ob['owningTestCommand'],'owningBehavior':ob['assertionEffect'],'status':ob['status'],'exit':None,'logPath':None,'logSha256':None,'reason':'Lead R25; exact deferredReplay obligation binds pinned bytes and full co-cut unit.'}];rc['comparison']['currentOutputSet']=rc['comparison']['candidateOutputSet']=[]
  if rc.get('deferredReplay'):deferred.append(rc['deferredReplay'])
 save(fn,o)
save('step-05-seam5-batch7-deferred-replays.json',{'rule':'R25 / L12-82 and L12-83','count':len(deferred),'deferredReplays':deferred,'actualTestsInvoked':True,'fullReplayCompleted':False,'initialScratchAttempt':{'file':f,'outcome':'failed without .fgos/config.json; no candidate replay claimed','logPath':'step-05-seam5-b6-review-dispatch-executor-profile.test-current.log'}})
# Continuation remains authoring-empty; deferred executions are a separate queue.
q=read('step-05-seam5-continuation.json');q['deferredReplayFiles']=[{'file':x['file'],'status':x['status'],'obligationFile':str((P/'step-05-seam5-batch7-deferred-replays.json').relative_to(ROOT))} for x in deferred];save('step-05-seam5-continuation.json',q)
print('journal',journal['counts'],'deferred',len(deferred),flush=True)
