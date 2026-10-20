import sys
sys.dont_write_bytecode=True
import pathlib,json,hashlib
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def read(f):return json.loads((P/f).read_text())
def rows(f):return [json.loads(l) for l in (P/f).read_text().splitlines() if l]
def save(f,o):(P/f).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def sha(o):return hashlib.sha256(json.dumps(o,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
rn=rows('step-05-records/tests-root-neutral.jsonl');jj=rows('step-05-records/tests-judgment-batch4.jsonl');closed={r['file'] for r in rn+jj};assert len(closed)==len(rn)+len(jj)
c=read('step-05-seam5-batch4-input.json');c['closedBatches'] += [{'batch':4,'kind':'R21 root-anchored neutral closures','files':[r['file'] for r in rn],'recordFile':'step-05-records/tests-root-neutral.jsonl'},{'batch':4,'kind':'30 judgment files; window review pending','files':[r['file'] for r in jj],'recordFile':'step-05-records/tests-judgment-batch4.jsonl'}];c['remainingFilesInOrder']=[e for e in c['remainingFilesInOrder'] if e['file'] not in closed];c['remainingFileCount']=len(c['remainingFilesInOrder']);c['remainingReferences']=sum(len(e['referenceIds']) for e in c['remainingFilesInOrder']);c['remainingDynamicTuples']=sum(e['dynamicCount'] for e in c['remainingFilesInOrder']);c['nextRealDocumentConsumers']=[e for e in c['nextRealDocumentConsumers'] if e['file'] not in closed];c['order']='R18/R23: real-file readers/writers, emitted-string comparisons, fixtures and remaining context. Priority dead-vocabulary/architecture closed for authoring in batch 4; parks and independent review remain open.';save('step-05-seam5-continuation.json',c)
ix=read('step-05-seam5-review-list.json');ix['closedBatch']=4
for r in jj:
 if r['file'] not in ix['sourceRecords']:ix['sourceRecords'].append(r['file'])
 ix['canonicalRecords']=[e for e in ix['canonicalRecords'] if e['file']!=r['file']];items=r['references']+r['dynamicTraces']+r['authorAddedReferences']
 ix['canonicalRecords'].append({'file':r['file'],'recordFile':str((P/'step-05-records/tests-judgment-batch4.jsonl').relative_to(ROOT)),'recordSha256':sha(r),'sourceSha256':r['sourceSha256'],'admittedIds':[e.get('referenceId',e.get('id')) for e in items if e['admission']=='ADMIT'],'judgmentCallIds':[e.get('referenceId',e.get('id')) for e in items if e['admission']=='REJECT']})
ix['rootNeutralClosures']=[{'file':r['file'],'recordFile':str((P/'step-05-records/tests-root-neutral.jsonl').relative_to(ROOT)),'recordSha256':sha(r),'sourceSha256':r['sourceSha256'],'ruleId':r['mechanicalClosure']['ruleId'],'referenceCount':len(r['references']),'tupleCount':len(r['dynamicTraces'])} for r in rn];ix['rootNeutralClosureCounts']={'files':len(rn),'references':sum(len(r['references']) for r in rn),'tuples':sum(len(r['dynamicTraces']) for r in rn)}
globs=ix['packingInstructions']['recordGlobs'];fn='step-05-records/tests-judgment-batch4.jsonl'
if fn not in globs:globs.append(fn)
ix['packingInstructions']['mechanicalExclusions']='Exclude tests-mechanical.jsonl, tests-cutover-neutral.jsonl and tests-root-neutral.jsonl from window review. R19/R20/R21 checker proofs own them.';ix['judgmentFileCount']=len(ix['sourceRecords']);ix['combinedMechanicalFileCount']=len(ix['mechanicalClosures'])+len(ix['neutralClosures'])+len(rn);save('step-05-seam5-review-list.json',ix)
print('neutral',len(rn),'judgments',len(jj),'remaining',c['remainingFileCount'])
