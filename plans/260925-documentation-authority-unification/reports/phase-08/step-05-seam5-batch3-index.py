"""Project exact closed record sets into continuation/review accounting."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,hashlib
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def read(f):return json.loads((P/f).read_text())
def rows(f):return [json.loads(l) for l in (P/f).read_text().splitlines() if l]
def sha(x):return hashlib.sha256(x).hexdigest()
def save(f,o):(P/f).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
neutral=rows('step-05-records/tests-cutover-neutral.jsonl');judgment=rows('step-05-records/tests-real-file-batch3.jsonl');closed={r['file'] for r in neutral+judgment}
c=read('step-05-seam5-batch3-input.json');c['closedBatches'] += [{'batch':3,'kind':'R20 invariant-preserve cutover-neutral mechanical closures','files':[r['file'] for r in neutral],'recordFile':'step-05-records/tests-cutover-neutral.jsonl'},{'batch':3,'kind':'real-document reader judgments; review pending','files':[r['file'] for r in judgment],'recordFile':'step-05-records/tests-real-file-batch3.jsonl'}];c['remainingFilesInOrder']=[e for e in c['remainingFilesInOrder'] if e['file'] not in closed];c['remainingFileCount']=len(c['remainingFilesInOrder']);c['remainingReferences']=sum(len(e['referenceIds']) for e in c['remainingFilesInOrder']);c['remainingDynamicTuples']=sum(e['dynamicCount'] for e in c['remainingFilesInOrder']);c['nextRealDocumentConsumers']=[{'file': 'test/runner/dead-vocabulary-guard.test.mjs', 'evidence': ['Pinned source docDirs constructs docs/specs and docs/architect/agent-coordination/contracts, recursively reads Markdown; original survey-dead-vocabulary carry and P7-DOC-GAP-05 remain.'], 'reviewedForSchedulingOnly': True}, {'file': 'test/architecture.test.mjs', 'evidence': ['Module initializer line 24 parses the real docs/architecture-manifest.json; its old path is in the Phase 6 root-authorities move map.'], 'reviewedForSchedulingOnly': True}];rank={e['file']:i for i,e in enumerate(c['nextRealDocumentConsumers'])};c['remainingFilesInOrder']=sorted(c['remainingFilesInOrder'],key=lambda e:rank.get(e['file'],len(rank)));c['order']='R18 priority remains: real-file readers/writers, emitted-string assertions, fixtures. R20 conservatively retains all files with moved literals, ancestor/templates, open path constructors or traced/unresolved path imports. No admission verdict is inferred from this queue.';save('step-05-seam5-continuation.json',c)
ix=read('step-05-seam5-review-list.json');ix['closedBatch']=3
for r in judgment:
 if r['file'] not in ix['sourceRecords']:ix['sourceRecords'].append(r['file'])
 ix['canonicalRecords']=[e for e in ix['canonicalRecords'] if e['file']!=r['file']]
 items=r['references']+r['dynamicTraces']+r.get('authorAddedReferences',[])
 ix['canonicalRecords'].append({'file':r['file'],'recordFile':str((P/'step-05-records/tests-real-file-batch3.jsonl').relative_to(ROOT)),'recordSha256':sha(json.dumps(r,ensure_ascii=False,separators=(',',':')).encode()),'sourceSha256':r['sourceSha256'],'admittedIds':[e.get('referenceId',e.get('id')) for e in items if e['admission']=='ADMIT'],'judgmentCallIds':[e.get('referenceId',e.get('id')) for e in items if e['admission']=='REJECT']})
ix['neutralClosures']=[{'file':r['file'],'recordFile':str((P/'step-05-records/tests-cutover-neutral.jsonl').relative_to(ROOT)),'recordSha256':sha(json.dumps(r,ensure_ascii=False,separators=(',',':')).encode()),'sourceSha256':r['sourceSha256'],'ruleId':r['mechanicalClosure']['ruleId'],'referenceCount':len(r['references']),'tupleCount':len(r['dynamicTraces'])} for r in neutral];ix['neutralClosureCounts']={'files':len(neutral),'references':sum(len(r['references']) for r in neutral),'tuples':sum(len(r['dynamicTraces']) for r in neutral)}
globs=ix['packingInstructions']['recordGlobs'];fn='step-05-records/tests-real-file-batch3.jsonl'
if fn not in globs:globs.append(fn)
ix['packingInstructions']['mechanicalExclusions']='Exclude tests-mechanical.jsonl and tests-cutover-neutral.jsonl entirely from window review; their complete R19/R20 proofs are checker obligations.'
ix['judgmentFileCount']=len(ix['sourceRecords']);ix['combinedMechanicalFileCount']=len(ix['mechanicalClosures'])+len(neutral);save('step-05-seam5-review-list.json',ix)
print('neutral',ix['neutralClosureCounts'],'judgment closed',len(judgment),'remaining',c['remainingFileCount'])
