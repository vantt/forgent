import sys
sys.dont_write_bytecode=True
import pathlib,json,re,hashlib,subprocess,importlib.util
P=pathlib.Path(__file__).resolve().parent
def read(f):return json.loads((P/f).read_text())
def save(f,o):(P/f).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def rows(f):return [json.loads(l) for l in (P/f).read_text().splitlines()]
def write(f,rs):(P/f).write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs))
rs=rows('step-05-records/tests-real-file.jsonl')
for r in rs:
 if r['file']!='test/docs/decisions-corpus-retired.test.mjs':continue
 ls=subprocess.check_output(['git','show',r['authorInputCommit']+':'+r['file']],text=True).splitlines()
 for e in r['dynamicTraces']:
  if e['id'] in ['dynamic-018740','dynamic-018744']:
   n=68 if e['id']=='dynamic-018740' else 86;e['consumingOperations']=[{'line':n,'text':ls[n-1]}]
write('step-05-records/tests-real-file.jsonl',rs)
# Receipt belongs to both real-file records, so blockedBy is their union.
rc=read('step-05-seam5-batch2-judgment-receipts.json');rc['receipts'][0]['blockedBy']=list(dict.fromkeys(e['blockedReason'] for r in rs for e in r['references']+r['dynamicTraces']+r['authorAddedReferences'] if e['disposition']=='parked'));save('step-05-seam5-batch2-judgment-receipts.json',rc)
rs=rows('step-05-records/tests-judgment-batch5.jsonl')
reasons={
 'reference-004308':'The emitted test title promises non-empty explanatory frontmatter for the decisions directory. Resolve the decisions-index holder/alias population with generator dynamic-009788/dynamic-009791 before relocating this titled test; its name remains part of the same parked test.',
 'reference-004343':'This assertion message enforces that the enumerated decisions directory has at least one Markdown member. Since index.md is its only pinned member and is proposed to move, bind the non-empty population to the promoted decisions-index holder without weakening files.length > 0.',
 'dynamic-021547':'The decisionsDir path constructor chooses the real frontmatter scan root. index.md alone occupies that directory and its move to docs/knowledge/decisions-index/decision-record.md can empty it; resolve the alias membership of generator dynamic-009788/dynamic-009791 before rebinding this root.',
 'dynamic-021548':'The decisionsDir path constructor chooses the real frontmatter scan root. index.md alone occupies that directory and its move to docs/knowledge/decisions-index/decision-record.md can empty it; resolve the alias membership of generator dynamic-009788/dynamic-009791 before rebinding this root.',
 'dynamic-021549':'The per-member content read requires every Markdown member in the real decisionsDir enumeration. Bind each promoted decisions-index member to that enumeration after alias membership is settled; keep frontmatter parsing and exact explanation type checks on the same real bytes.',
 'dynamic-021550':'The non-empty frontmatter assertion emits a file-specific diagnostic. Its named file must come from the final promoted decisions-index population; keep the parser result assertion and diagnostic coupled to the parked per-member reader rather than substituting an unrelated retained file.',
 'dynamic-021551':'The frontmatter type equality reports the iterated decisions file. Its explanation value must remain checked for every real promoted member; resolve the decisions-index population before changing the diagnostic or reader.',
 'reference-004332':'The primaryDoc existence assertion names the first backfilled explanation document in the generated manifest. Resolve the primary explanation membership with generator dynamic-009788/dynamic-009791 and preserve the assertion that a primary-directory entry actually appears, jointly with reference-004345.'}
for r in rs:
 for e in r['references']+r['dynamicTraces']+r['authorAddedReferences']:
  id=e.get('referenceId',e.get('id'))
  if id in reasons:e['reason']=e['blockedReason']=r['file']+': L12-81: '+reasons[id];e['searchWitness']['assessment']=e['blockedReason']
  if id=='reference-004381':
   path=e['successorNote'].split('#')[0];text=subprocess.check_output(['git','show',r['authorInputCommit']+':'+path],text=True);heading=next(t for t in text.splitlines() if t.startswith('### 0026 '));slug=re.sub(r'\s','-',re.sub(r'[^\w\s-]','',heading.lstrip('# ').lower()));e['successorNote']=path+'#'+slug
 r['parked']=[{'id':e.get('referenceId',e.get('id')),'blockedReason':e['blockedReason'],'dependency':e['dependency']} for e in r['references']+r['dynamicTraces']+r['authorAddedReferences'] if e['disposition']=='parked']
write('step-05-records/tests-judgment-batch5.jsonl',rs)
rc=read('step-05-seam5-batch5-parity-receipts.json')
for r,receipt in zip(rs,rc['receipts']):receipt['blockedBy']=list(dict.fromkeys(e['blockedReason'] for e in r['references']+r['dynamicTraces']+r['authorAddedReferences'] if e['disposition']=='parked'))
save('step-05-seam5-batch5-parity-receipts.json',rc)
s=importlib.util.spec_from_file_location('bulk',P/'step-05-seam5-bulk-rules.py');b=importlib.util.module_from_spec(s);s.loader.exec_module(b)
rs=rows('step-05-seam5-bulk-triage.jsonl');changed=[]
for r in rs:
 if r['file']=='test/fixtures/usage/pi-multiturn-normal.jsonl':
  old=r['context'];r['context']=b.context(r['inputCommit'],r['file']);assert not r['wholeFileMechanicalClosure'];changed.append({'file':r['file'],'before':old,'after':r['context'],'reason':'Unresolved import now conservatively marks a document root instead of raising; fixture remains judgment-required.'})
write('step-05-seam5-bulk-triage.jsonl',rs);save('step-05-seam5-batch6-context-refresh.json',changed)
# Final source-grounded journal hashes and item snapshots after refinements.
j=read('step-05-seam5-batch6-review-closure.json')
for fn in ['tests-real-file.jsonl','tests-real-file-batch3.jsonl','tests-judgment-batch4.jsonl','tests-judgment-batch5.jsonl']:
 for r in rows('step-05-records/'+fn):
  its={e.get('referenceId',e.get('id')):e for e in r['references']+r['dynamicTraces']+r['authorAddedReferences']}
  for e in j['changedRecords']:
   if e['file']==r['file']:
    e['afterSha256']=hashlib.sha256(json.dumps(r,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
    for d in e['changes']:d['after']=its[d['id']]
save('step-05-seam5-batch6-review-closure.json',j)
