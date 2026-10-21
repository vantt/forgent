"""Keep canonical review obligations, batch deltas and original queue conservation distinct."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,hashlib,copy
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def read(f):return json.loads((P/f).read_text())
def rows(f):return [json.loads(l) for l in (P/f).read_text().splitlines()]
def save(f,o):(P/f).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def sha(o):return hashlib.sha256(json.dumps(o,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
rs=rows('step-05-records/tests-judgment-batch7.jsonl');c=read('step-05-seam5-batch7-input.json');assert [r['file'] for r in rs]==[e['file'] for e in c['remainingFilesInOrder']]
c['closedBatches'].append({'batch':7,'kind':'264 judgment files; author closure, independent R24 review pending','files':[r['file'] for r in rs],'recordFile':'step-05-records/tests-judgment-batch7.jsonl'})
c.update(remainingFilesInOrder=[],remainingFileCount=0,remainingReferences=0,remainingDynamicTuples=0,nextRealDocumentConsumers=[],pendingReplayFiles=[],deferredReplayFiles=[{'file':d['file'],'status':d['status'],'obligationFile':str((P/'step-05-seam5-batch7-deferred-replays.json').relative_to(ROOT))} for d in read('step-05-seam5-batch7-deferred-replays.json')['deferredReplays']],batch6Closure='R25 supersedes the four blocked R22 replays with exact replay-deferred-phase9 obligations; original blocked evidence remains preserved.',batch7Closure='Authoring queue empty; independent review, parks, Step 7 composition and Phase 9 proofs remain owed.')
save('step-05-seam5-continuation.json',c)
ix=read('step-05-seam5-review-list.json')
if ix['closedBatch']==6:ix.setdefault('previousReviewDeltas',{})['6']={k:copy.deepcopy(ix[k]) for k in ['reviewThisTurn','changedThisTurn','addedThisTurn']}
ix['closedBatch']=7
for r in rs:
 f=r['file'];its=r['references']+r['dynamicTraces']+r['authorAddedReferences']
 if f not in ix['sourceRecords']:ix['sourceRecords'].append(f)
 ix['canonicalRecords']=[e for e in ix['canonicalRecords'] if e['file']!=f]
 ix['canonicalRecords'].append({'file':f,'recordFile':str((P/'step-05-records/tests-judgment-batch7.jsonl').relative_to(ROOT)),'recordSha256':sha(r),'sourceSha256':r['sourceSha256'],'admittedIds':[e.get('referenceId',e.get('id')) for e in its if e['admission']=='ADMIT'],'judgmentCallIds':[e.get('referenceId',e.get('id')) for e in its if e['admission']=='REJECT'],'windowJudgmentCallIds':[e.get('referenceId',e.get('id')) for e in its if e['admission']=='REJECT' and 'docs' in (str(e.get('passage',e.get('currentPassage',{}).get('text','')))+' '+str(e.get('pathOperand') or e.get('matchedExpression',e.get('originalTuple',[None]*5)[4])))]})
ix['packingInstructions']['recordGlobs']=list(dict.fromkeys(ix['packingInstructions']['recordGlobs']+['step-05-records/tests-judgment-batch7.jsonl']));ix['judgmentFileCount']=len(ix['sourceRecords']);ix['changedThisTurn']={'dispositionChanged':[],'labelOnly':[]};ix['addedThisTurn']=[e for e in ix['canonicalRecords'] if e['file'] in {r['file'] for r in rs}];ix['reviewThisTurn']=[r['file'] for r in rs];ix['deferredReplayChangedThisTurn']=c['deferredReplayFiles'];ix['reviewStatus']='pending Lead independent R24 windows; all authoring closed, parks/cutover proofs unresolved';save('step-05-seam5-review-list.json',ix)
print('remaining',c['remainingFileCount'],'judgment',ix['judgmentFileCount'])
