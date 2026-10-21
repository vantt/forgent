"""Refresh current review/park hash chains while preserving previous review deltas."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,hashlib,copy
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def read(f):return json.loads((P/f).read_text())
def save(f,x):(P/f).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def sha(o):return hashlib.sha256(json.dumps(o,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
def items(r):return r['references']+r['dynamicTraces']+r.get('authorAddedReferences',[])
def ident(e):return e.get('referenceId',e.get('id'))
by={r['file']:r for f in (P/'step-05-records').glob('*.jsonl') for r in map(json.loads,f.open())}
changes=read('step-05-seam67-task0-closure.json')['changedRecords']
for e in changes:e['afterSha256']=sha(by[e['file']])
save('step-05-seam67-task0-closure.json',dict(read('step-05-seam67-task0-closure.json'),changedRecords=changes))
ix=read('step-05-seam5-review-list.json');ix.setdefault('previousReviewDeltas',{}).setdefault('L12-83',copy.deepcopy({k:ix[k] for k in ['reviewClosureRuling','reviewThisTurn','changedThisTurn','addedThisTurn']}));ix['reviewClosureRuling']='L12-85'
for e in ix['canonicalRecords']:
 r=by[e['file']];e.update(recordSha256=sha(r),admittedIds=[ident(x) for x in items(r) if x['admission']=='ADMIT'],judgmentCallIds=[ident(x) for x in items(r) if x['admission']=='REJECT' and not x.get('mechanicalRejection')],windowJudgmentCallIds=[ident(x) for x in items(r) if x['admission']=='REJECT' and 'docs' in str(x.get('passage',x.get('currentPassage',{})))])
ix['changedThisTurn']={k:[e for e in changes if e['recordFile'].split('/')[-1].startswith('tests-') and e['dispositionChanged']==v] for k,v in [('dispositionChanged',True),('labelOnly',False)]};ix['addedThisTurn']=[];ix['reviewThisTurn']=[e['file'] for e in ix['changedThisTurn']['dispositionChanged']];ix['crossSeamChangedThisTurn']=[e for e in changes if not e['recordFile'].split('/')[-1].startswith('tests-')];save('step-05-seam5-review-list.json',ix)
s4=read('step-05-seam4-rereview-list.json')
for e in s4['canonicalRecords']:
 if e['file'] in by:e['recordSha256']=sha(by[e['file']])
s4['L12-85-reviewObligations']=ix['crossSeamChangedThisTurn'];save('step-05-seam4-rereview-list.json',s4)
# Rebuild seam5 closure from the current canonical records through existing door.
