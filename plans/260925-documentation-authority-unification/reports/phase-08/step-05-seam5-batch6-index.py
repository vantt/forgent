import sys
sys.dont_write_bytecode=True
import pathlib,json,hashlib,re
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def read(f):return json.loads((P/f).read_text())
def rows(f):return [json.loads(l) for l in (P/f).read_text().splitlines()]
def save(f,o):(P/f).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def sha(o):return hashlib.sha256(json.dumps(o,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
c=read('step-05-seam5-batch6-input.json');new=rows('step-05-records/tests-judgment-batch6.jsonl');closed={r['file'] for r in new};c['closedBatches'].append({'batch':6,'kind':'100 judgment files; independent review pending','files':[r['file'] for r in new],'recordFile':'step-05-records/tests-judgment-batch6.jsonl'});c['remainingFilesInOrder']=[e for e in c['remainingFilesInOrder'] if e['file'] not in closed];c['remainingFileCount']=len(c['remainingFilesInOrder']);c['remainingReferences']=sum(len(e['referenceIds']) for e in c['remainingFilesInOrder']);c['remainingDynamicTuples']=sum(e['dynamicCount'] for e in c['remainingFilesInOrder']);c['nextRealDocumentConsumers']=[e for e in c['nextRealDocumentConsumers'] if e['file'] not in closed];save('step-05-seam5-continuation.json',c)
ix=read('step-05-seam5-review-list.json');ix['closedBatch']=6
closure=read('step-05-seam5-batch6-review-closure.json');changed={e['file']:e for e in closure['changedRecords']}
for fn in ['tests-real-file.jsonl','tests-real-file-batch3.jsonl','tests-judgment-batch4.jsonl','tests-judgment-batch5.jsonl','tests-judgment-batch6.jsonl']:
 for r in rows('step-05-records/'+fn):
  f=r['file'];its=r['references']+r['dynamicTraces']+r['authorAddedReferences']
  if f not in ix['sourceRecords']:ix['sourceRecords'].append(f)
  ix['canonicalRecords']=[e for e in ix['canonicalRecords'] if e['file']!=f]
  ix['canonicalRecords'].append({'file':f,'recordFile':str((P/'step-05-records'/fn).relative_to(ROOT)),'recordSha256':sha(r),'sourceSha256':r['sourceSha256'],'admittedIds':[e.get('referenceId',e.get('id')) for e in its if e['admission']=='ADMIT'],'judgmentCallIds':[e.get('referenceId',e.get('id')) for e in its if e['admission']=='REJECT'],'windowJudgmentCallIds':[e.get('referenceId',e.get('id')) for e in its if e['admission']=='REJECT' and 'docs' in (str(e.get('passage',e.get('currentPassage',{}).get('text','')))+' '+str(e.get('pathOperand') or e.get('matchedExpression',e.get('originalTuple',[None]*5)[4])))]})
ix['packingInstructions']['recordGlobs']=list(dict.fromkeys(ix['packingInstructions']['recordGlobs']+['step-05-records/tests-judgment-batch6.jsonl']));ix['packingInstructions']['R24']='Review admitted items and judgment rejects whose passage/operand mentions docs; mechanical/neutral/docs-free rejects are checker verified.';ix['judgmentFileCount']=len(ix['sourceRecords']);ix['changedThisTurn']={'dispositionChanged':[e for e in ix['canonicalRecords'] if e['file'] in changed and changed[e['file']]['dispositionChanged']],'labelOnly':[e for e in ix['canonicalRecords'] if e['file'] in changed and not changed[e['file']]['dispositionChanged']]};ix['addedThisTurn']=[e for e in ix['canonicalRecords'] if e['file'] in closed];ix['reviewThisTurn']=[e['file'] for e in ix['changedThisTurn']['dispositionChanged']+ix['addedThisTurn']];ix['reviewStatus']='pending Lead independent R24 windows; changedThisTurn splits dispositionChanged vs labelOnly';save('step-05-seam5-review-list.json',ix)
print('remaining',c['remainingFileCount'],'refs',c['remainingReferences'],'tuples',c['remainingDynamicTuples'],'changed',len(changed),'added',len(new))
