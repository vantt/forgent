import sys
sys.dont_write_bytecode=True
import pathlib,json,copy,hashlib,subprocess,re
P=pathlib.Path(__file__).resolve().parent
def read(f):return json.loads((P/f).read_text())
def save(f,o):(P/f).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
rs=[json.loads(l) for l in (P/'step-05-records/tests-judgment-batch6.jsonl').read_text().splitlines()];rc=read('step-05-seam5-batch6-parity-receipts.json')
for r,receipt in zip(rs,rc['receipts']):
 # basename is not unique for Rust support modules. File identity owns receipt.
 newId='real-file-tests-goldens-batch6-'+r['file'].replace('/','-');r['receiptIds']=[newId];receipt['id']=newId
 for e in r['references']+r['dynamicTraces']+r['authorAddedReferences']:e['receiptId']=newId
 for e in r['references']:
  if e['sourceSpans']==e['originalSourceSpans']:continue
  n=e['sourceSpans'][0]['line'];donors=[z for z in r['authorAddedReferences'] if z['sourceSpans'][0]['line']==n and (z['sourceSpans'][0]['text'] in e['matchedExpression'] or e['matchedExpression'] in z['sourceSpans'][0]['text'])]
  if donors:
   donor=donors[0]
   keep={'referenceId','inventoryOrigins','originalSourceSpans','sourceSpans','matchedExpression','passage','passageSpan'}
   for k,v in donor.items():
    if k not in keep:e[k]=copy.deepcopy(v)
  else:
   # Rebase legacy scan metadata to actual source context before admission.
   body=subprocess.check_output(['git','show',r['authorInputCommit']+':'+r['file']],text=True);src=body.splitlines()[n-1]
   if src.lstrip().startswith(('//','/*','*')) and 'docs/history' in e['matchedExpression']:
    e.update(admission='ADMIT',nonDocumentUse=None,role='comment-provenance',reason='R16: dated docs/history comment pointer at rebased current line; preserve provenance.',resolverWitness={'inputCommit':r['authorInputCommit'],'readOnly':True,'expression':e['matchedExpression'],'treeRetires':False})
 r['authorAddedReferences']=[z for z in r['authorAddedReferences'] if not any(any(a['line']==s['line'] and a['columnStart']<=s['columnStart']<a['columnEndExclusive'] for a in e['sourceSpans']) for s in z['sourceSpans'] for e in r['references'])]
 receipt['comparison']['assertionOwnership']=r['owningProofs']
 if r.get('proofOwnerKind')=='Rust owning declarations/assertions':
  r['importingProofWitness']={'command':['git','grep','-n','support module name',r['authorInputCommit']],'assessment':'Rust test helper; crate owning proofs, no independent test execution claimed'}
 for spec in receipt['cutoverSpecifications']:spec['receiptId']=newId
 receipt['blockedBy']=list(dict.fromkeys(e['blockedReason'] for e in r['references']+r['dynamicTraces']+r['authorAddedReferences'] if e['disposition']=='parked'))
(P/'step-05-records/tests-judgment-batch6.jsonl').write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in rs));save('step-05-seam5-batch6-parity-receipts.json',rc)
specs=read('step-05-seam5-batch6-cutover-specs.json');by={r['file']:r for r in rs}
for s in specs['patches']:
 if s['file'] in by:s['receiptId']=by[s['file']]['receiptIds'][0]
save('step-05-seam5-batch6-cutover-specs.json',specs)
