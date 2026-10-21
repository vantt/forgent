import sys
sys.dont_write_bytecode=True
import pathlib,json,hashlib
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def read(f):return json.loads((P/f).read_text())
def rows(f):return [json.loads(l) for l in (P/f).read_text().splitlines() if l]
def save(f,o):(P/f).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def sha(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
rs=rows('step-05-records/tests-judgment-batch5.jsonl');closed={r['file'] for r in rs};c=read('step-05-seam5-batch5-input.json');c['closedBatches'].append({'batch':5,'kind':'40 judgment files; independent review pending','files':[r['file'] for r in rs],'recordFile':'step-05-records/tests-judgment-batch5.jsonl'});c['remainingFilesInOrder']=[e for e in c['remainingFilesInOrder'] if e['file'] not in closed];c['remainingFileCount']=len(c['remainingFilesInOrder']);c['remainingReferences']=sum(len(e['referenceIds']) for e in c['remainingFilesInOrder']);c['remainingDynamicTuples']=sum(e['dynamicCount'] for e in c['remainingFilesInOrder']);c['nextRealDocumentConsumers']=[e for e in c['nextRealDocumentConsumers'] if e['file'] not in closed];save('step-05-seam5-continuation.json',c)
ix=read('step-05-seam5-review-list.json');ix['closedBatch']=5
changed=read('step-05-seam5-batch5-review-closure.json')['changedRecords'];changedfiles={e['file'] for e in changed}
for fn in ['tests-real-file.jsonl','tests-real-file-batch3.jsonl','tests-judgment-batch4.jsonl','tests-judgment-batch5.jsonl']:
 for r in rows('step-05-records/'+fn):
  if r['file'] not in ix['sourceRecords']:ix['sourceRecords'].append(r['file'])
  ix['canonicalRecords']=[e for e in ix['canonicalRecords'] if e['file']!=r['file']];items=r['references']+r['dynamicTraces']+r.get('authorAddedReferences',[]);ix['canonicalRecords'].append({'file':r['file'],'recordFile':str((P/'step-05-records'/fn).relative_to(ROOT)),'recordSha256':sha(r),'sourceSha256':r['sourceSha256'],'admittedIds':[e.get('referenceId',e.get('id')) for e in items if e['admission']=='ADMIT'],'judgmentCallIds':[e.get('referenceId',e.get('id')) for e in items if e['admission']=='REJECT']})
ix['packingInstructions']['recordGlobs']=list(dict.fromkeys(ix['packingInstructions']['recordGlobs']+['step-05-records/tests-judgment-batch5.jsonl']));ix['judgmentFileCount']=len(ix['sourceRecords']);ix['changedThisTurn']=[e for e in ix['canonicalRecords'] if e['file'] in changedfiles];ix['addedThisTurn']=[e for e in ix['canonicalRecords'] if e['file'] in closed];ix['reviewThisTurn']=[e['file'] for e in ix['changedThisTurn']+ix['addedThisTurn']];ix['reviewStatus']='pending Lead repack and independent semantic review; reviewThisTurn names only changed or added judgment files';save('step-05-seam5-review-list.json',ix)
print('remaining',c['remainingFileCount'],'changed',len(changedfiles),'added',len(closed),'judgment total',ix['judgmentFileCount'])
