import sys
sys.dont_write_bytecode=True
import pathlib,json,re,copy
P=pathlib.Path(__file__).resolve().parent
def read(f):return json.loads((P/f).read_text())
def save(f,o):(P/f).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
specs=read('step-05-seam5-batch6-cutover-specs.json');by={s['file']:s for s in specs['patches']}
for fn in ['tests-judgment-batch5.jsonl','tests-judgment-batch6.jsonl']:
 rs=[json.loads(l) for l in (P/'step-05-records'/fn).read_text().splitlines()]
 for r in rs:
  if r['file'] not in by:continue
  spec=by[r['file']]
  for e in r['references']+r['authorAddedReferences']:
   if e['disposition']!='patch':continue
   if len(e['sourceSpans'])>1:
    e['sourceSpanReplacements']=[e['target']]+[re.match(r'\s*(?://|\*)?\s*',s['text'])[0] for s in e['sourceSpans'][1:]]
   else:
    x=e['sourceSpans'][0]['text']
    for a,z in spec['substitutions']:
     if x not in a:continue
     k=a.index(x);tail=len(a)-k-len(x);replacement=z[k:len(z)-tail if tail else None];e['proposedReplacement']=replacement
     target=re.search(r'docs(?:/|\\/)[^\s\x22\x27]*?\.?(?:\\\.)?md',replacement)
     if target:e['target']=target[0].replace('\\/','/').replace('\\.','.')
     break
  spec['targetOwner']=next(e['target'] for e in r['references']+r['authorAddedReferences'] if e['disposition']=='patch')
 (P/'step-05-records'/fn).write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs))
for fn in ['step-05-seam5-batch5-parity-receipts.json','step-05-seam5-batch6-parity-receipts.json']:
 rc=read(fn)
 for receipt in rc['receipts']:
  if receipt.get('cutoverSpecifications') and receipt['cutoverSpecifications'][0]['file'] in by:receipt['cutoverSpecifications']=[by[receipt['cutoverSpecifications'][0]['file']]]
 save(fn,rc)
save('step-05-seam5-batch6-cutover-specs.json',specs)
# Refresh final journal link after mechanical span/receipt normalization.
import hashlib
j=read('step-05-seam5-batch6-review-closure.json')
for fn in ['tests-judgment-batch4.jsonl','tests-judgment-batch5.jsonl','tests-real-file.jsonl']:
 for l in (P/'step-05-records'/fn).read_text().splitlines():
  r=json.loads(l)
  for e in j['changedRecords']:
   if e['file']==r['file']:e['afterSha256']=hashlib.sha256(json.dumps(r,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
save('step-05-seam5-batch6-review-closure.json',j)
