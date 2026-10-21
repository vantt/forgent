"""Seam authoring closure, with original identities distinct from supplemental slots."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,collections,hashlib
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def read(f):return json.loads((P/f).read_text())
def rows(f):return [json.loads(l) for l in (P/f).read_text().splitlines()]
def sha(x):return hashlib.sha256(x).hexdigest()
def items(r):return r['references']+r['dynamicTraces']+r.get('authorAddedReferences',[])
def ident(e):return e.get('referenceId',e.get('id'))
files=['tests-prompt-goldens.jsonl','tests-mechanical.jsonl','tests-real-file.jsonl','tests-cutover-neutral.jsonl','tests-real-file-batch3.jsonl','tests-root-neutral.jsonl','tests-judgment-batch4.jsonl','tests-judgment-batch5.jsonl','tests-judgment-batch6.jsonl','tests-judgment-batch7.jsonl'];rs=[];locators={}
for f in files:
 for n,r in enumerate(rows('step-05-records/'+f),1):
  assert r['file'] not in locators
  locators[r['file']]={'recordFile':str((P/'step-05-records'/f).relative_to(ROOT)),'recordLine':n,'recordSha256':sha(json.dumps(r,ensure_ascii=False,separators=(',',':')).encode())};rs.append(r)
pop=[e for e in rows('step-05-population-files.jsonl') if e['seam']=='real-file-tests-goldens'];assert {r['file'] for r in rs}=={e['file'] for e in pop} and len(rs)==704
refs=[ident(e) for r in rs for e in r['references']];dyn=[e['id'] for r in rs for e in r['dynamicTraces']];assert len(refs)==len(set(refs))==1203 and len(dyn)==len(set(dyn))==25007
assert set(refs)=={e['id'] for e in rows('step-05-population-references.jsonl') if e['file'] in locators};assert set(dyn)=={e['id'] for e in rows('step-05-population-dynamic.jsonl') if e['file'] in locators}
classes=collections.defaultdict(list);admissions=collections.Counter();dispositions=collections.Counter();parkGroups=collections.defaultdict(list);patches=[]
for r in rs:
 rule=r.get('mechanicalClosure',{}).get('ruleId','');kind='mechanical' if rule.startswith('r19') else 'neutral' if rule.startswith(('r20','r21')) else 'judgment';classes[kind].append(r)
 for e in items(r):
  admissions[e.get('admission','neutral-unlabelled')]+=1;dispositions[e['disposition']]+=1
  if e['disposition']=='parked':
   parkGroups[str(e['dependency'])].append({'file':r['file'],'id':ident(e),'blockedReason':e['blockedReason'],'dependencyCategory':e.get('dependencyCategory'),'searchWitness':e.get('searchWitness'),'record':locators[r['file']]})
 if r.get('diff'):
  patches.append({'file':r['file'],'inputCommit':r['authorInputCommit'],'sourceSha256':r['sourceSha256'],'sourceMode':r['sourceMode'],'expectedAfterSha256':r['expectedAfterSha256'],'diff':r['diff'],'rollbackDiff':r['rollbackDiff'],'coCutPaths':r['coCutPaths'],'receiptIds':r['receiptIds'],'patchItemIds':[ident(e) for e in items(r) if e['disposition']=='patch'],'record':locators[r['file']],'status':'unapplied; Step 7 composes source/test co-cuts and resolves parks; Phase 9 executes and proves'})
new=rows('step-05-records/tests-judgment-batch7.jsonl');out={'status':'authoring-complete; independent review and cutover readiness pending','totals':{'files':len(rs),'references':len(refs),'tuples':len(dyn),'supplementalSlots':sum(len(r.get('authorAddedReferences',[])) for r in rs),'classes':{k:{'files':len(v),'references':sum(len(r['references']) for r in v),'tuples':sum(len(r['dynamicTraces']) for r in v)} for k,v in classes.items()},'admitted':admissions['ADMIT'],'rejected':admissions['REJECT'],'neutralUnlabelled':admissions['neutral-unlabelled'],'parks':dispositions['parked'],'patches':dispositions['patch'],'preserves':dispositions['preserve'],'patchFiles':len(patches),'deferredReplays':read('step-05-seam5-batch7-deferred-replays.json')['count']},'countSemantics':'File/reference/tuple totals are original census sets. Admission and disposition totals include supplemental slots. Neutral closures have no invented admission; priorR19Rejection remains separately nested on neutral records. Patches counts items; patchFiles counts physical files. This closes authoring only.','addedThisTurn':{'neutralFiles':0,'judgmentFiles':len(new),'references':sum(len(r['references']) for r in new),'tuples':sum(len(r['dynamicTraces']) for r in new),'supplementalSlots':sum(len(r['authorAddedReferences']) for r in new),'admissions':dict(collections.Counter(e['admission'] for r in new for e in items(r))),'dispositions':dict(collections.Counter(e['disposition'] for r in new for e in items(r))),'pinnedBytes':sum(r['wholeFileReadEvidence']['bytes'] for r in new)},'parkDependencies':[{'dependency':k,'itemCount':len(v),'items':v} for k,v in sorted(parkGroups.items())],'patchCoCutUnits':patches,'deferredReplayObligations':read('step-05-seam5-batch7-deferred-replays.json')['deferredReplays'],'originalCarries':read('step-05-seam5-continuation.json')['dynamicCarries'],'remainingFiles':[],'reviewList':str((P/'step-05-seam5-review-list.json').relative_to(ROOT)),'closureProofs':{'fullChecker':'step-05-seam5-batch7-full-check.json','rejectingProbes':'step-05-seam5-batch7-final-proof.json'},'needsWrites':[]}
assert sum(admissions.values())==sum(dispositions.values())==len(refs)+len(dyn)+out['totals']['supplementalSlots']
(P/'step-05-seam5-closure.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'totals':out['totals'],'addedThisTurn':out['addedThisTurn'],'parkDependencyGroups':len(parkGroups)}))
