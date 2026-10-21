"""Complete the p05 named scalar-object note without changing any outcome."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,hashlib,subprocess,copy
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def read(f):return json.loads((P/f).read_text())
def save(f,x):(P/f).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def digest(x):return hashlib.sha256(json.dumps(x,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
f=P/'step-05-records/tests-judgment-batch7.jsonl';rs=[json.loads(l) for l in f.open()];r=next(r for r in rs if r['file']=='test/runner/dispatch-execute-effort.test.mjs');old=next(json.loads(l) for l in subprocess.check_output(['git','show','HEAD:'+str(f.relative_to(ROOT))],cwd=ROOT,text=True).splitlines() if json.loads(l)['file']==r['file']);e=next(e for e in r['dynamicTraces'] if e['id']=='dynamic-024636');assert e['currentLine']==355 and e['originalTuple'][4]=="scope: { role: 'reviewer' }" and e['admission']=='REJECT' and e['disposition']=='preserve'
e['reason']="L12-85/p05: this object literal supplies scope.role = 'reviewer' to the synthetic dispatch options. It neither constructs a path nor performs filesystem I/O. Own operand: "+repr(e['originalTuple'][4]);e['rejectedAsUnrelatedReason']=e['reason'];f.write_text(''.join(json.dumps(x,ensure_ascii=False,separators=(',',':'))+'\n' for x in rs))
j=read('step-05-seam67-task0-closure.json');entry={'file':r['file'],'recordFile':'step-05-records/tests-judgment-batch7.jsonl','beforeSha256':digest(old),'afterSha256':digest(r),'dispositionChanged':False,'changes':[{'id':e['id'],'beforeDisposition':'preserve','afterDisposition':'preserve','admissionChanged':False}]};j['changedRecords']=[x for x in j['changedRecords'] if x['file']!=r['file']]+[entry];j['counts']={'files':len(j['changedRecords']),'items':sum(len(x['changes']) for x in j['changedRecords']),'dispositionChangedFiles':sum(x['dispositionChanged'] for x in j['changedRecords']),'labelOnlyFiles':sum(not x['dispositionChanged'] for x in j['changedRecords'])};save('step-05-seam67-task0-closure.json',j)
ix=read('step-05-seam5-review-list.json')
for x in ix['canonicalRecords']:
 if x['file']==r['file']:x['recordSha256']=digest(r)
ix['changedThisTurn']['labelOnly']=[x for x in ix['changedThisTurn']['labelOnly'] if x['file']!=r['file']]+[entry];save('step-05-seam5-review-list.json',ix)
ix=read('step-05-seam67-review-list.json');ix['task0Changes']=j['changedRecords'];ix['crossSeamChangedThisTurn']=j['changedRecords'];save('step-05-seam67-review-list.json',ix)
c=read('step-05-seam67-closure.json');c['task0']=j['counts'];save('step-05-seam67-closure.json',c)
f=P/'owner-answers.md';text=f.read_text().replace('**31 old files / 167 changed items**, split **8 disposition-changed / 23 label-only files**','**32 old files / 168 changed items**, split **8 disposition-changed / 24 label-only files**');f.write_text(text)
f=P/'step-05-seam67-seal.py';text=f.read_text().replace('31 old files / 167 changed items, split into 8 disposition-changing and 23 label-only files.','32 old files / 168 changed items, split into 8 disposition-changing and 24 label-only files.');f.write_text(text)
print('p05 scalar-object note corrected at actual pinned L355; all outcomes unchanged',j['counts'])
