"""L12-74 final record accounting; R10 limits the second re-review scope."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,copy,importlib.util,collections,subprocess
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def mod(n):
 sp=importlib.util.spec_from_file_location(n,P/(n+'.py'));m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);return m
m=mod('step-05-check');a=m.admission;sha=m.sha
BASE='2b04bfe7c1f748c2f17beca4a6695c968ada2bd5'
paths=sorted((P/'step-05-records').glob('*.jsonl'));rs=[json.loads(l) for p in paths for l in p.read_text().splitlines()];by={r['file']:r for r in rs};before=[json.loads(l) for p in paths for l in subprocess.check_output(['git','show',BASE+':'+str(p.relative_to(ROOT))],cwd=ROOT,text=True).splitlines()];oldby={r['file']:r for r in before}
def save(n,x):(P/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
initial=a.check(before);final=a.check(rs);hits=collections.Counter(x['rule'] for x in initial['failures']);changes=[];labelonly=[];admissiononly=[]
for r in rs:
 old=oldby[r['file']];olditems={a.idof(e):e for e in a.allitems(old)};delta=[]
 for e in a.allitems(r):
  id=a.idof(e);o=olditems.get(id);fields=sorted(k for k in set(o or {})|set(e) if (o or {}).get(k)!=e.get(k))
  if not fields:continue
  actionfields={'disposition','target','anchor','proposedReplacement','diffHunk','sourceSpanReplacements','sourceSpans'}
  item={'id':id,'from':None if o is None else {'admission':o['admission'],'disposition':o['disposition']},'to':{'admission':e['admission'],'disposition':e['disposition']},'changedFields':fields}
  if o is None or actionfields.intersection(fields):delta.append(item)
  elif o['admission']!=e['admission']:admissiononly.append({'file':r['file'],**item})
  else:labelonly.append({'file':r['file'],**item})
 diffchanged=any(r.get(k)!=old.get(k) for k in ['diff','rollbackDiff','expectedAfterSha256'])
 if delta or diffchanged:changes.append({'file':r['file'],'generated':bool(r.get('generated')),'diffChanged':diffchanged,'fromRecordSha256':sha(json.dumps(old,ensure_ascii=False,separators=(',',':'))),'recordSha256':sha(json.dumps(r,ensure_ascii=False,separators=(',',':'))),'changes':delta})
listing={'inputCommit':BASE,'ruling':'L12-74 R10','selection':'Only disposition changes, proposed source diffs and new source slots; admission-only preserve flips and owner/label corrections excluded.','reviewStatus':'pending Lead repack and independent semantic review','fileCount':len(changes),'sourceFileCount':sum(not r['generated'] for r in changes),'generatedFileCount':sum(r['generated'] for r in changes),'files':[r['file'] for r in changes],'sourceFiles':[r['file'] for r in changes if not r['generated']],'generatedFiles':[r['file'] for r in changes if r['generated']],'changes':changes}
save('step-05-seam4-rereview2-list.json',listing)
save('step-05-seam4-fix2-admission-only.json',{'ruling':'R10 no further re-review; disposition stays preserve and no Phase 9 action changes','count':len(admissiononly),'changes':admissiononly})
save('step-05-seam4-fix2-label-only.json',{'ruling':'R10 no disposition, proposed diff or slot change','count':len(labelonly),'changes':labelonly})
# Current record hashes are carried in the old list only for the existing
# checker binding door. Its first-review scope/history is never recounted.
first=m.read('step-05-seam4-rereview-list.json');canon={r['file']:r for r in first['canonicalRecords']}
for r in rs:canon[r['file']]['recordSha256']=sha(json.dumps(r,ensure_ascii=False,separators=(',',':')))
first['currentBindingRuling']='L12-74; current second-review scope is step-05-seam4-rereview2-list.json. First-review file counts remain historical.';save('step-05-seam4-rereview-list.json',first)
# Every record's original identities and pinned source bytes are conserved.
physical=[]
for r in rs:
 old=oldby[r['file']]
 assert [e['referenceId'] for e in r['references']]==[e['referenceId'] for e in old['references']]
 assert [e['id'] for e in r['dynamicTraces']]==[e['id'] for e in old['dynamicTraces']]
 assert all(e['originalTuple']==o['originalTuple'] for e,o in zip(r['dynamicTraces'],old['dynamicTraces']))
 if r.get('wholeFileRead'):
  source=m.pinned(r['authorInputCommit'],r['file']);assert sha(source)==r['sourceSha256']==sha((ROOT/r['file']).read_bytes());physical.append({'file':r['file'],'inputCommit':r['authorInputCommit'],'sha256':r['sourceSha256']})
source_slots=[]
for r in rs:
 if r.get('generated'):continue
 if r['file'].startswith('core/skills/distill/') or any(s in r['file'] for s in ['fgos-cli-fallback','catchup-self-recovery','executor-dispatch-fallback']):
  source_slots.append({'file':r['file'],'authorAddedIds':[e['id'] for e in r.get('authorAddedReferences',[])],'inheritedSourceSlotCount':len(r.get('inheritedSourceSlots',[])),'retiredSuccessors':[{'id':a.idof(e),'successorNote':e.get('successorNote')} for e in a.allitems(r) if a.retired(e)]+[{'slotKey':x['edge'].get('slotKey'),'successorNote':x['edge'].get('successorNote')} for x in r.get('inheritedSourceSlots',[]) if a.retired(x['edge'])]})
metrics={'inputCommit':BASE,'initialHitCounts':{k:hits[k] for k in a.RULES},'initialCountMethod':'Run the final shared a–e/R11/R12 checker on the untouched committed records at inputCommit; counts are rule failures, not additive unique defects. Serialized state rows and source-copy parks join the accepted per-file/source dependency identity.','finalFailureCount':final['failureCount'],'finalChecks':final['checks'],'files':len(rs),'physicalPinnedFiles':len(physical),'originalReferences':sum(len(r['references']) for r in rs),'originalDynamicTuples':sum(len(r['dynamicTraces']) for r in rs),'authorAddedReferences':sum(len(r.get('authorAddedReferences',[])) for r in rs),'newSlots':sum(a.idof(e) not in {a.idof(x) for x in a.allitems(oldby[r['file']])} for r in rs for e in a.allitems(r)),'rereviewFileCount':len(changes),'rereviewSourceFileCount':listing['sourceFileCount'],'rereviewGeneratedFileCount':listing['generatedFileCount'],'rereviewItemCount':sum(len(r['changes']) for r in changes),'admissionOnlyChanges':len(admissiononly),'labelOnlyChanges':len(labelonly),'ownerRepoints':len(m.read('step-05-seam4-fix2-owner-joins.json')['changes']),'generatedAdmittedRenderJoins':sum(e['admission']=='ADMIT' and e['disposition']=='render-join' for r in rs if r.get('generated') for e in r['dynamicTraces']),'frozenGateWitnesses':sum(bool(r.get('frozenGateIdentityWitness')) for r in rs),'sourceSlotAudit':source_slots,'sourcePins':physical,'reviewStatus':'pending Lead repack and independent semantic review; no cutover acceptance'}
save('step-05-seam4-fix2-sweep.json',metrics);save('step-05-seam4-admission-check-result.json',final)
print(json.dumps({k:v for k,v in metrics.items() if k not in ['sourcePins','sourceSlotAudit']},ensure_ascii=False))
