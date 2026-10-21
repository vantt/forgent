"""Complete exact operation joins and refresh only canonical record evidence."""
import sys
sys.dont_write_bytecode=True
import importlib.util,json,copy,pathlib,re,subprocess,collections
P=pathlib.Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('closure',P/'step-05-seam5-b6-review-closure.py');c=importlib.util.module_from_spec(s);s.loader.exec_module(c)
read=c.read;save=c.save;sha=c.sha;items=c.items;ident=c.ident
records={f.name:[json.loads(l) for l in f.open()] for f in sorted((P/'step-05-records').glob('*.jsonl'))};by={r['file']:r for rs in records.values() for r in rs};ids={ident(e):(r,e) for r in by.values() for e in items(r)};origin={}
for fn in records:
 origin[fn]=[json.loads(l) for l in c.blob('HEAD',str((P/'step-05-records'/fn).relative_to(c.ROOT))).splitlines()]
origids={ident(e):e for rs in origin.values() for r in rs for e in items(r)};units=read('step-05-proposed-move-read-units.json');ub={u['path']:u for u in units['units']}
def locate(r,e):return {'file':r['file'],'id':ident(e),'recordFile':next('step-05-records/'+fn for fn,rs in records.items() if any(z is r for z in rs)),'line':c.line(e),'role':e.get('role'),'admission':e.get('admission'),'disposition':e['disposition'],'inputCommit':r['authorInputCommit'],'sourceSha256':r['sourceSha256'],'operation':c.expr(e),'sourceLine':c.blob(r['authorInputCommit'],r['file']).splitlines()[c.line(e)-1]}
def park(id,path,why):
 r,e=ids[id];body=c.blob(r['authorInputCommit'],r['file']);assert sha(body)==r['sourceSha256'];u=ub[path];old=e.get('blockedReason');reason=r['file']+': '+why
 if old:reason+=' Existing obligation: '+old
 e.update(admission='ADMIT',nonDocumentUse=None,disposition='parked',timing='phase9',target=None,anchor=None,diffHunk=None,blockedReason=reason,blockedCategory='proposed-move-decision',dependency=u['decisionDependency'],dependencyCategory='phase9-retention-or-move',reason='L12-83/R26: '+reason,r26Unit=path)
 e['resolverWitness']={'inputCommit':r['authorInputCommit'],'readOnly':True,'path':path,'treeRetires':False,'scope':'Exact current operation; retention or move undecided'}
 if 'originalTuple' in e:
  e['stateExportDependency']=u['decisionDependency'];e['blockedSeams']=['step7-final-assembly','phase9']
  if not e.get('pathOperand'):e['pathOperand']=e['operationWitness']['text'];e['pathOperandWitness']=copy.deepcopy(e['operationWitness'])
 e['parityObligation']='Resolve '+u['decisionDependency']+' with this complete co-cut; retain every original assertion.'
 if e.get('searchWitness'):e['searchWitness']['assessment']=reason
 elif r['file'].startswith('test/'):
  n=5 if 'batch5' in locate(r,e)['recordFile'] else 6;sf=f'step-05-seam5-batch{n}-search-evidence.json';z=read(sf);e['searchWitness']={'pin':r['authorInputCommit'],'roots':z['roots'],'evidenceFile':str((P/sf).relative_to(c.ROOT)),'evidenceSha256':sha((P/sf).read_bytes()),'assessment':reason}
 u['readers']=[x for x in u['readers'] if x['id']!=id]+[locate(r,e)];u['coChanges']=[x for x in u['coChanges'] if x['id']!=id]
# Markdown navigation, shell comment and classifier vocabulary are co-change
# records only; none executes a read of that path.
for id in ['reference-002424','reference-003605','reference-002489']:
 r,e=ids[id];path=e['r26Unit'];e.clear();e.update(copy.deepcopy(origids[id]));e['r26CoCutUnits']=[path];u=ub[path];u['readers']=[x for x in u['readers'] if x['id']!=id];u['coChanges'].append(locate(r,e))
# Explicit enduser-index directory reads, diagnostics and alias branch all join
# the one decision-index unit; explanation-only passages keep their own park.
for id in ['reference-004305','reference-004307','dynamic-021542','dynamic-021547','dynamic-021548','dynamic-021549','dynamic-021550','dynamic-021551','reference-004308','reference-004343','dynamic-009788','dynamic-009791']:
 park(id,'docs/decisions/index.md','The decisions alias enumeration/comment/frontmatter contract depends on index.md remaining in the scanned directory or moving with the alias scan-set. Reconcile dynamic-009788/dynamic-009791 and the index generator as one unit; no retained-directory witness authorizes the move.')
# Directory walk follows DECISIONS_DIR and must remain empty of numbered files;
# the existing negative 0000-index probe remains a negative probe with successor.
for id in ['reference-004039','reference-004041']:
 park(id,'docs/decisions/index.md','The DECISIONS_DIR real enumeration/probe follows the index directory after the retention-or-move decision; preserve the numbered-corpus absence assertions and their exact negative-probe meaning.')
# Source/default copy destinations must name their own physical operand.
for id in ['dynamic-031771','dynamic-032030']:
 r,e=ids[id];e['pathOperand']=e['operationWitness']['text'];e['pathOperandWitness']=copy.deepcopy(e['operationWitness'])
# Consistent source-grounded label repairs requested by reviewed notes.
for id in ['author-s5-b5-loop-786-67']:
 if id in ids:
  r,e=ids[id];e['resolverWitness'].update(treeRetires=True,scope='Split dated docs/architect pointer; tree retires; proposals/doing-coordination-redesign.md is non-canonical.');e['reason']='L12-83/R8: partial docs/ span belongs to author-s5-b6-loop-split-786; same dated proposal citation and tree-retires witness.'
for id in ['reference-005196']:
 r,e=ids[id];e['reason']='L12-83: fixture comment names docs/architecture-manifest.json; root retention-or-move is open under R26. This is not docs/architect tree provenance.';e['resolverWitness']['treeRetires']=False;e['resolverWitness']['scope']=e['reason']
for id in ['dynamic-036304','dynamic-036305']:
 r,e=ids[id];e['reason']='L12-83/R11 census boundary: real docs/platform packaging-distribution contract read, outside legacy census roots; this is not an in-memory fixture.';e['nonDocumentUse']='config-or-metadata'
# Keep runtime history comment provenance accurate without rewriting fixtures.
for f in ['test/runner/loop.test.mjs','test/runner/merge.test.mjs']:
 for e in items(by[f]):
  if e.get('admission')=='ADMIT' and e.get('disposition')=='preserve' and c.clean(c.expr(e)).startswith('docs/history/'):
   e.setdefault('resolverWitness',{})['scope']='actual pinned dated docs/history comment pointer; retained history provenance'
# Compose the extra source comment hunk with every existing source patch. The
# prior candidate is never replaced by a fresh one-hunk candidate.
m=c.module('pinfix','step-05-check.py');specs=read('step-05-seam5-b6-review-cutover-specs.json')
for spec in specs['patches']:
 r=by[spec['file']]
 if r['file']=='src/setup/registrations.mjs':
  oldspec=next(z for z in read('step-05-cutover-specs.json')['patches'] if z['file']==r['file']) if (P/'step-05-cutover-specs.json').exists() else None
  # Source references carry every existing exact replacement and the new one.
  before,after=m.candidate(r);r['diff']=c.diff(r['file'],before,after);r['rollbackDiff']=c.diff(r['file'],after,before);r['expectedAfterSha256']=sha(after)
  spec.update(newText=after,diff=r['diff'],rollbackDiff=r['rollbackDiff'],expectedAfterSha256=sha(after),substitutions=[(before,after)],commentOnly=False,intentionalBehaviorDeltas=['Existing approved emitted navigation deltas plus the verified flow-definition comment holder; no runtime semantics change.'])
  # Existing source spec already lists source owner/test co-cuts.
  old=next((z for sf in P.glob('step-05*cutover-specs.json') if 'b6-review' not in sf.name for z in read(sf.name).get('patches',[]) if z['file']==r['file']),None)
  if old:r['coCutPaths']=sorted(set(r['coCutPaths'])|set(old['coCutPaths']))
  spec['coCutPaths']=r['coCutPaths']
 for e in items(r):
  if e['disposition']=='patch':e['diffHunk']=r['diff']
# Existing four deferred obligations now bind cleaned reflow diffs. Enduser
# owning tests need forbidden state fixtures; defer exactly, without executing.
blocks=read('step-05-seam5-batch6-replay-blockers.json');r=by['test/report/enduser-index.test.mjs'];body=c.blob(r['authorInputCommit'],r['file']);proof=[]
for n,t in enumerate(body.splitlines(),1):
 if '.fgos' in t or 'createDocsIndex' in t or 'makeDocsIndex' in t:proof.append({'line':n,'text':t})
if not any(b['file']==r['file'] for b in blocks['blockers']):
 blocks['blockers'].append({'file':r['file'],'inputCommit':r['authorInputCommit'],'sourceSha256':r['sourceSha256'],'requiredProof':'R22 current/candidate full owning test replay','status':'blocked','reason':'Records-only contract forbids .fgos access and state fixture creation. The full owning enduser-index tests import withDocsIndexStateFixture which seeds a real store writer under .fgos in scratch; no exemption is inferred.','sourceEvidence':proof,'resolution':'Phase 9 owns full current/candidate replay with the state fixture and complete index alias co-cut.'})
save('step-05-seam5-batch6-replay-blockers.json',blocks)
# Update receipts only where record actions changed; preserve all other schemas.
receiptfiles=['step-05-pilot-parity-receipts.json','step-05-seam4-parity-receipts.json','step-05-seam5-parity-receipts.json','step-05-seam5-batch2-judgment-receipts.json','step-05-seam5-batch3-judgment-receipt.json']+[f'step-05-seam5-batch{b}-parity-receipts.json' for b in range(4,8)]
rcs={f:read(f) for f in receiptfiles};rcby={x['id']:x for o in rcs.values() for x in o.get('receipts',[o])};deferred=c.module('defclosure','step-05-seam5-batch7-deferred.py')
for r in by.values():
 old=next(z for rs in origin.values() for z in rs if z['file']==r['file'])
 if old==r:continue
 if 'parked' in old or any(e['disposition']=='parked' for e in items(r)):r['parked']=[{'id':ident(e),'blockedReason':e['blockedReason'],'dependency':e.get('dependency')} for e in items(r) if e['disposition']=='parked']
 for rid in r.get('receiptIds',[]):
  if rid not in rcby:continue
  rc=rcby[rid];rc['blockedBy']=list(dict.fromkeys(e['blockedReason'] for rr in by.values() if rid in rr.get('receiptIds',[]) for e in items(rr) if e['disposition']=='parked'))
  # R26 is a readiness dependency, not a changed current-output claim.
  rc.setdefault('proposedMoveUnits',[]);rc['proposedMoveUnits']=sorted(set(rc['proposedMoveUnits'])|{e['r26Unit'] for e in items(r) if e.get('r26Unit')})
for spec in specs['patches']:
 r=by[spec['file']];rc=rcby[spec['receiptId']];rc['cutoverSpecifications']=[spec];rc['coCutPaths']=r['coCutPaths'];rc['comparison']['intentionalDeltas']=spec['intentionalBehaviorDeltas'];rc['candidateInputs']=copy.deepcopy(rc['currentInputs'])
 for i in rc['candidateInputs']:
  if i['path']==r['file']:i.update(sha256=r['expectedAfterSha256'],bytes=len(spec['newText'].encode()))
 block=next((b for b in blocks['blockers'] if b['file']==r['file']),None)
 if block:
  d=deferred.obligation(spec,r,block);rc['deferredReplay']=d;rc['proofs']=[{'command':d['owningTestCommand'],'owningBehavior':d['assertionEffect'],'status':d['status'],'exit':None,'logPath':None,'logSha256':None,'reason':'Lead R25; exact deferredReplay obligation binds pinned bytes and full co-cut unit.'}];rc['comparison']['currentOutputSet']=rc['comparison']['candidateOutputSet']=[]
# Old batch6 copies are current canonical specs too, not contradictory alternatives.
oldspecfile=read('step-05-seam5-batch6-cutover-specs.json')
for i,spec in enumerate(oldspecfile['patches']):
 new=next((s for s in specs['patches'] if s['file']==spec['file']),None)
 if new:oldspecfile['patches'][i]=new
save('step-05-seam5-batch6-cutover-specs.json',oldspecfile)
# Shared receipts source specs must retain other files in the same receipt.
# Pilot/global generator source specification owners consume the composed bytes.
for fn,o in rcs.items():save(fn,o)
save('step-05-seam5-b6-review-cutover-specs.json',specs)
# Update per-unit exact membership after label/outcome joins.
for path,u in ub.items():
 for k in ['readers','coChanges']:
  u[k]=[locate(*ids[x['id']]) for x in u[k]]
 u['readerRecordIds']=[x['id'] for x in u['readers']];u['readerCount']=len(u['readers']);u['coCutPaths']=sorted({x['file'] for x in u['readers']+u['coChanges']});u['status']='decision-open' if u['readers'] else 'no actual reader in authored Step 5; co-changes only' if u['coChanges'] else 'no authored Step 5 occurrence'
units.update(readerCount=sum(u['readerCount'] for u in ub.values()),unitsWithReaders=sum(bool(u['readers']) for u in ub.values()),readerFiles=len({x['file'] for u in ub.values() for x in u['readers']}));save('step-05-proposed-move-read-units.json',units)
changes=[]
for fn,rs in records.items():
 for a,z in zip(origin[fn],rs):
  if a==z:continue
  old={ident(e):e for e in items(a)};delta=[{'id':ident(e),'beforeDisposition':old.get(ident(e),{}).get('disposition'),'afterDisposition':e['disposition'],'admissionChanged':old.get(ident(e),{}).get('admission')!=e.get('admission')} for e in items(z) if old.get(ident(e))!=e]
  changes.append({'file':z['file'],'recordFile':'step-05-records/'+fn,'beforeSha256':sha(json.dumps(a,ensure_ascii=False,separators=(',',':'))),'afterSha256':sha(json.dumps(z,ensure_ascii=False,separators=(',',':'))),'dispositionChanged':any(x['beforeDisposition']!=x['afterDisposition'] for x in delta) or a.get('diff')!=z.get('diff'),'changes':delta})
 if rs!=origin[fn]:(P/'step-05-records'/fn).write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs))
journal=read('step-05-seam5-b6-review-closure.json');journal['changedRecords']=changes;journal['counts'].update(changedRecords=len(changes),dispositionChanged=sum(x['dispositionChanged'] for x in changes),labelOnly=sum(not x['dispositionChanged'] for x in changes));save('step-05-seam5-b6-review-closure.json',journal)
print('refined',journal['counts'],'units',units['unitCount'],'readers',units['readerCount'],flush=True)
