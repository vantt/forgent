"""Finalize current record joins, review obligations and census totals."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,hashlib,copy,subprocess,collections
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def read(f):return json.loads((P/f).read_text())
def save(f,x):(P/f).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def sha(x):return hashlib.sha256(x.encode() if isinstance(x,str) else x).hexdigest()
def items(r):return r['references']+r['dynamicTraces']+r.get('authorAddedReferences',[])
def ident(e):return e.get('referenceId',e.get('id'))
records={f.name:[json.loads(l) for l in f.open()] for f in sorted((P/'step-05-records').glob('*.jsonl'))};by={r['file']:r for rs in records.values() for r in rs}
# Preserve historical reason evidence while appending new co-change custody.
for fn,rs0 in records.items():
 if fn in ['ui-spec-compiler.jsonl','citation-ratchet-roots.jsonl']:continue
 old0=[json.loads(l) for l in subprocess.check_output(['git','show','HEAD:'+str((P/'step-05-records'/fn).relative_to(ROOT))],cwd=ROOT,text=True).splitlines()]
 for old,r in zip(old0,rs0):
  oldby={ident(e):e for e in items(old)}
  for e in items(r):
   if e.get('reason','').startswith('L12-85/R28: comment pointer co-changes') and ident(e) in oldby:
    e['reason']=oldby[ident(e)]['reason']+' '+e['reason']
   if e.get('admission')=='ADMIT':
    e['proofCommand']=e.get('proofCommand') or 'missing'
    e['parityObligation']=e.get('parityObligation') or 'Exact path/claim parity is an unexecuted Phase9 obligation; preserve full owning assertions.'
   if e['disposition']=='parked' and r['file'].startswith('test/'):
    w=e.get('searchWitness') or copy.deepcopy(next((z.get('searchWitness') for z in items(r) if z.get('searchWitness')),None))
    if w:w['assessment']=e['blockedReason'];e['searchWitness']=w
  if items(old)==items(r) and old.get('parked')!=r.get('parked'):r['parked']=old['parked']
# Exact late record-text corrections from p01/p04 (no disposition changes).
for r in by.values():
 for e in items(r):
  id=ident(e)
  if id in ['dynamic-017146','dynamic-017147']:
   e['nonDocumentUse']='config-or-metadata';e['reason']='L12-85: temporary docs/history/<id>/plan.md fixture consumed by src/state/store.mjs checkPlanEvidence. docs/history is absent from the move set; preserve with the production reader and coupled state-cutover fixture.'
  if id=='dynamic-016721':e['nonDocumentUse']='config-or-metadata';e['reason']='L12-85: string inside lexer fixture array, not an actual fs probe.'
  if id in ['dynamic-016775','dynamic-016776']:e['nonDocumentUse']='root-only';e['reason']='L12-85: repository-root derivation via module directory; no document path constructed by this expression.'
  if id=='reference-003949':e['reason']='L12-85/R28: comment co-change with the parked architecture-manifest reader dynamic-016778; no retained-path assertion. Patch together if the proposed move is confirmed.'
  if id in ['dynamic-014334','dynamic-014335','dynamic-014336','dynamic-014337']:e['role']='emitted-document-message'
 # Recompute exactly; no canonical r26 park may be absent from the manifest.
 r['parked']=[{'id':ident(e),'blockedReason':e['blockedReason'],'dependency':e.get('dependency')} for e in items(r) if e['disposition']=='parked']
for fn,rs in records.items():
 path=P/'step-05-records'/fn;new=''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs)
 # Do not alter unrelated runtime author records, or unmodified old shards.
 if new!=path.read_text():
  assert not fn.startswith('runtime-');path.write_text(new)
# R26 regenerate from canonical markers; preserves original explicit zero-reader units.
man=read('step-05-proposed-move-read-units.json');loc={r['file']:'step-05-records/'+fn for fn,rs in records.items() for r in rs}
for u in man['units']:u['readers']=[];u['coChanges']=[]
units={u['path']:u for u in man['units']}
for r in by.values():
 for e in items(r):
  for path in set(([e['r26Unit']] if e.get('r26Unit') else [])+e.get('r26CoCutUnits',[])):
   n=e.get('currentLine') or (e.get('sourceSpans') or [{}])[0].get('line',0);src=subprocess.check_output(['git','show',r['authorInputCommit']+':'+r['file']],cwd=ROOT,text=True).splitlines()[n-1] if n else ''
   z={'file':r['file'],'id':ident(e),'recordFile':loc[r['file']],'line':n,'role':e.get('role'),'admission':e.get('admission'),'disposition':e['disposition'],'inputCommit':r['authorInputCommit'],'sourceSha256':r['sourceSha256'],'operation':e.get('matchedExpression') or e.get('pathOperand') or e.get('originalTuple',[None]*5)[4],'sourceLine':src};units[path]['readers' if e.get('r26Unit')==path else 'coChanges'].append(z)
for u in units.values():
 u['readerCount']=len(u['readers']);u['readerRecordIds']=[e['id'] for e in u['readers']];u['coCutPaths']=sorted({e['file'] for e in u['readers']+u['coChanges']});u['status']='decision-open' if u['readers'] else 'no actual reader; co-changes only' if u['coChanges'] else 'no authored occurrence'
man.update(units=list(units.values()),unitsWithReaders=sum(bool(u['readers']) for u in units.values()),readerCount=sum(u['readerCount'] for u in units.values()),readerFiles=len({e['file'] for u in units.values() for e in u['readers']}),scope='All canonical authored Step5 shards, including seams6/7; every declared reader/output and comment/fixture co-change is individually pin-bound. No runtime-* shard edited.');save('step-05-proposed-move-read-units.json',man)
# Current Task0 delta compared with immutable turn-start HEAD, not re-run intermediates.
journal=read('step-05-seam67-task0-closure.json');changes=[]
for fn,rs in records.items():
 if fn in ['ui-spec-compiler.jsonl','citation-ratchet-roots.jsonl']:continue
 old=[json.loads(l) for l in subprocess.check_output(['git','show','HEAD:'+str((P/'step-05-records'/fn).relative_to(ROOT))],cwd=ROOT,text=True).splitlines()]
 for a,z in zip(old,rs):
  if a==z:continue
  prior={ident(e):e for e in items(a)};delta=[{'id':ident(e),'beforeDisposition':prior.get(ident(e),{}).get('disposition'),'afterDisposition':e['disposition'],'admissionChanged':prior.get(ident(e),{}).get('admission')!=e.get('admission')} for e in items(z) if prior.get(ident(e))!=e]
  changes.append({'file':z['file'],'recordFile':'step-05-records/'+fn,'beforeSha256':sha(json.dumps(a,ensure_ascii=False,separators=(',',':'))),'afterSha256':sha(json.dumps(z,ensure_ascii=False,separators=(',',':'))),'dispositionChanged':any(e['beforeDisposition']!=e['afterDisposition'] for e in delta),'changes':delta})
journal.update(changedRecords=changes,counts={'files':len(changes),'items':sum(len(e['changes']) for e in changes),'dispositionChangedFiles':sum(e['dispositionChanged'] for e in changes),'labelOnlyFiles':sum(not e['dispositionChanged'] for e in changes)});save('step-05-seam67-task0-closure.json',journal)
# Required review list: complete source/generated inventory, separate current deltas.
rs=[r for r in by.values() if r.get('seamIds')==['ui-spec-compiler'] or r.get('seamIds')==['citation-ratchet-roots']]
canonical=[]
for r in rs:
 its=items(r);canonical.append({'file':r['file'],'recordFile':str((P/loc[r['file']]).relative_to(ROOT)),'recordSha256':sha(json.dumps(r,ensure_ascii=False,separators=(',',':'))),'sourceSha256':r['sourceSha256'],'admittedIds':[ident(e) for e in its if e['admission']=='ADMIT'],'judgmentCallIds':[ident(e) for e in its if e['admission']=='REJECT'],'windowJudgmentCallIds':[ident(e) for e in its if e['admission']=='REJECT' and 'docs' in str(e.get('matchedExpression',e.get('currentPassage',{})))]})
save('step-05-seam67-review-list.json',{'closedSeams':['ui-spec-compiler','citation-ratchet-roots'],'reviewClosureRuling':'L12-85','reviewStatus':'pending Lead repack and independent semantic window review','sourceRecords':[r['file'] for r in rs if not r['generated']],'generatedRecords':[r['file'] for r in rs if r['generated']],'canonicalRecords':canonical,'addedThisTurn':canonical,'changedThisTurn':{'dispositionChanged':[],'labelOnly':[]},'task0Changes':changes,'reviewThisTurn':[r['file'] for r in rs],'packingInstructions':{'recordGlobs':['step-05-records/ui-spec-compiler.jsonl','step-05-records/citation-ratchet-roots.jsonl'],'method':'Source 100% admitted and docs-bearing judgment rejects, merged +/-40 physical lines; generated per-file exact source/ancestry joins. Include complete diff and source context as needed.','authorAddedReferences':'Include every authorAddedReferences source slot and inheritedSourceSlots owner proof; core citation-format L96 is mandatory. Never omit supplemental slots.'},'mechanicalClosures':[],'neutralClosures':[],'mechanicalRejects':[],'notes':'No unproved label-based neutrality is claimed. All 35 selected file memberships are authored judgment records; generated owner joins remain source-owned.'})
# Refresh inherited source record review hash custody.
s4=read('step-05-seam4-rereview-list.json')
for e in s4['canonicalRecords']:
 if e['file'] in by:e['recordSha256']=sha(json.dumps(by[e['file']],ensure_ascii=False,separators=(',',':')))
save('step-05-seam4-rereview-list.json',s4)
# Receipt park inventories are current derived data; keep their actual proof logs untouched.
for f in P.glob('step-05*receipts.json'):
 obj=read(f.name)
 if not isinstance(obj,dict):continue
 altered=False
 for rc in obj.get('receipts',[]):
  subset=[r for r in by.values() if rc.get('id') in r.get('receiptIds',[])];blocks=list(dict.fromkeys(e['blockedReason'] for r in subset for e in items(r) if e['disposition']=='parked'))
  if subset and rc.get('blockedBy')!=blocks:rc['blockedBy']=blocks;altered=True
 if altered:save(f.name,obj)
# Seam67 totals and dependency/patch units, with record hashes.
parks=collections.defaultdict(list);disp=collections.Counter();adm=collections.Counter()
for r in rs:
 for e in items(r):
  adm[e['admission']]+=1;disp[e['disposition']]+=1
  if e['disposition']=='parked':parks[e['dependency']].append({'file':r['file'],'id':ident(e),'blockedReason':e['blockedReason'],'recordSha256':sha(json.dumps(r,ensure_ascii=False,separators=(',',':')))})
totals={'files':len(rs),'references':sum(len(r['references']) for r in rs),'tuples':sum(len(r['dynamicTraces']) for r in rs),'supplementalSlots':sum(len(r['authorAddedReferences']) for r in rs),'mechanicalFiles':0,'neutralFiles':0,'judgmentFiles':len(rs),'admitted':adm['ADMIT'],'rejected':adm['REJECT'],'parks':disp['parked'],'patches':disp['patch'],'preserves':disp['preserve'],'renderJoins':disp['render-join'],'patchFiles':sum(bool(r['diff']) for r in rs)}
save('step-05-seam67-closure.json',{'status':'authoring complete; independent review and Phase9 parity pending','totals':totals,'countSemantics':'35 original file memberships, 1313 references, 849 tuples. Admission/disposition totals include supplemental slots; render-join is separate from preserve. No mechanical/neutral admission is invented without proof.','seams':{seam:{'files':sum(seam in r['seamIds'] for r in rs),'references':sum(len(r['references']) for r in rs if seam in r['seamIds']),'tuples':sum(len(r['dynamicTraces']) for r in rs if seam in r['seamIds'])} for seam in ['ui-spec-compiler','citation-ratchet-roots']},'parkDependencies':[{'dependency':k,'items':v,'count':len(v)} for k,v in parks.items()],'patchCoCutUnits':read('step-05-seam67-cutover-specs.json')['patches'],'task0':journal['counts'],'r26':{'units':len(man['units']),'readers':man['readerCount']},'reviewList':'step-05-seam67-review-list.json','missingProofs':['Dedicated compiler explicit/cwd-root discovery, errors, output path/mode/hash parity','Runtime verifier ignores --root and targets frontend/docs/ui-spec: no parity inferred','Candidate citation scan coverage/finding multiplicity after old-root deletion','DecisionF Phase9 ratchet retirement, no patch/rebaseline authorized'],'needsWrites':[]})
print(json.dumps(totals))
