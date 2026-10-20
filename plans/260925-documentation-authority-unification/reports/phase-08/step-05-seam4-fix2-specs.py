"""Compose source-only proposed patches and retain all owning proof obligations."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,copy,importlib.util
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def mod(n):
 sp=importlib.util.spec_from_file_location(n,P/(n+'.py'));m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);return m
m=mod('step-05-check');s4=mod('step-05-seam4-check');sha=m.sha
def save(n,x):(P/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
sets={p:[json.loads(l) for l in p.read_text().splitlines()] for p in sorted((P/'step-05-records').glob('*.jsonl'))};rs=[r for v in sets.values() for r in v];by={r['file']:r for r in rs}
specdata=m.read('step-05-pilot-cutover-specs.json');specs=specdata['patches'];receiptdata=m.read('step-05-pilot-parity-receipts.json');receipts={r['id']:r for r in receiptdata['receipts']};logs=[]
for f in ['src/setup/registrations.mjs','src/setup/git-hooks.mjs']:
 r=by[f];refs=[e for e in r['references'] if e['disposition']=='patch'];before,after=m.candidate(r);diff=m.m.make_diff(f,before,after);rollback=m.m.make_diff(f,after,before)
 assert s4.apply(f,before.encode(),diff)==after.encode();assert s4.apply(f,after.encode(),rollback)==before.encode()
 r.update(diff=diff,rollbackDiff=rollback,expectedAfterSha256=sha(after),coCutPaths=sorted(set(r['coCutPaths'])|{'CHANGELOG.md'}))
 spec=next((s for s in specs if s['file']==f),None)
 if spec is None:
  spec={'inputCommit':r['authorInputCommit'],'file':f,'sourceSha256':r['sourceSha256'],'mode':r['sourceMode'],'receiptId':r['receiptIds'][0],'coCutPaths':r['coCutPaths'],'coCutTestGreps':[],'coCutTestEdits':[],'expectedOutputSets':[],'intentionalBehaviorDeltas':[],'testTargets':['env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/install-git-hooks.test.mjs'],'prerequisites':['Step 7 composes source comment pointer with all shared proposed source hunks; Phase 9 runs owning proof.'],'order':'Source before cutover','timing':'phase9','readiness':'pending independent review and Phase 9 proof'};specs.append(spec)
 spec.update(symbolOrPassage=[e['passage'] for e in refs],oldText=[e['matchedExpression'] for e in refs],newText=[e['proposedReplacement'] for e in refs],sourceSpans=[s for e in refs for s in e['sourceSpans']],diff=diff,rollbackDiff=rollback,expectedAfterSha256=sha(after),targetOwner=[e['target'] for e in refs],claimAnchorProof=[e['resolverWitness'] for e in refs])
 if f=='src/setup/git-hooks.mjs':spec['testTargets']=['env -u CLAUDE_CODE_SESSION_ID node --test test/scripts/install-git-hooks.test.mjs']
 receipt=receipts[r['receiptIds'][0]]
 for e in refs:
  e['diffHunk']=diff;grep=m.test_grep(r['authorInputCommit'],e['matchedExpression']);e['coCutTestGrep']=grep
  if grep not in spec['coCutTestGreps']:spec['coCutTestGreps'].append(grep)
  if grep not in receipt['coCutTestGreps']:receipt['coCutTestGreps'].append(grep)
  for hit in grep['matches']:
   if not any(x['file']==hit['file'] and x['referenceId']==e['referenceId'] for x in spec['coCutTestEdits']):
    text=m.pinned(r['authorInputCommit'],hit['file']);decision={'match':hit,'reason':'L12-69: existing historical test-title/comment provenance; the comment-pointer repair changes no fixture or assertion.','oldLine':hit['text'],'newLine':hit['text'],'disposition':'preserve'}
    edit={'file':hit['file'],'referenceId':e['referenceId'],'sourceSha256':sha(text),'grepMatches':[hit],'newPointer':e['proposedReplacement'],'substitutions':[],'expectedAfterSha256':sha(text),'grepDecisions':[decision],'disposition':'preserve','diff':None,'rollbackDiff':None}
    spec['coCutTestEdits'].append(edit);receipt['coCutTestEdits'].append(copy.deepcopy(edit))
   for obj in [r,spec,receipt]:obj['coCutPaths']=sorted(set(obj['coCutPaths'])|{hit['file']})
  delta={'file':f,'referenceId':e['referenceId'],'edgeId':e['edgeId'],'line':e['sourceSpans'][0]['line'],'currentExpression':e['passage'],'candidateExpression':e['proposedReplacement'],'oldPointer':e['matchedExpression'],'newPointer':e['proposedReplacement'],'intent':'Exact source pointer correction; comment-only repairs change no runtime output.','evidence':e['resolverWitness']}
  for obj,key in [(spec,'expectedOutputSets'),(spec,'intentionalBehaviorDeltas'),(receipt['comparison'],'intentionalDeltas')]:
   obj[key]=[x for x in obj[key] if not(isinstance(x,dict) and x.get('file')==f and x.get('referenceId')==e['referenceId'])]+[delta]
 for obj in [receipt]:
  for i in obj['candidateInputs']:
   if i['path']==f:i['sha256']=sha(after)
 if f=='src/setup/registrations.mjs':
  semantic=m.test_grep(r['authorInputCommit'],'docs/explanation/gate-bypass-design.md');spec['additionalSemanticTestGreps']=[semantic]
  for hit in semantic['matches']:
   for obj in [r,spec,receipt]:obj['coCutPaths']=sorted(set(obj['coCutPaths'])|{hit['file']})
  spec['semanticGrepNote']='The pinned citation wraps across two comment lines. The mandatory raw-token grep splits its patterns at newline and therefore also returns a generic // design.md comment; that hit is preserved as dated test provenance. This additional unwrapped-path grep covers the semantic citation separately.'
 logs.append({'file':f,'beforeSha256':sha(before),'afterSha256':sha(after),'restoredSha256':sha(before),'forwardExit':0,'rollbackExit':0,'scratchOnly':True})
# Record final hash bindings while retaining the first review list as historical scope.
listing=m.read('step-05-seam4-rereview-list.json');canon={r['file']:r for r in listing['canonicalRecords']}
for r in rs:canon[r['file']]['recordSha256']=sha(json.dumps(r,ensure_ascii=False,separators=(',',':')))
listing['currentBindingRuling']='L12-74; changes since this first scope are separately listed in step-05-seam4-rereview2-list.json.'
save('step-05-seam4-rereview-list.json',listing)
# Original carry snapshots remain untouched, final correction rows may change.
carry=m.read('step-05-seam4-inherited-carries.json');ds={d['id']:d for r in rs for d in r['dynamicTraces']}
changes=[{'id':x['id'],'from':[x['admission'],x['disposition']],'to':[ds[x['id']]['admission'],ds[x['id']]['disposition']],'ruling':'L12-72','subsequentRuling':'L12-74','reason':ds[x['id']]['reason']} for x in carry['pilotOriginal165'] if (x['admission'],x['disposition'])!=(ds[x['id']]['admission'],ds[x['id']]['disposition'])]
save('step-05-seam4-carry-corrections.json',{'changes':changes})
for p,records in sets.items():p.write_text(''.join(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n' for r in records))
save('step-05-pilot-cutover-specs.json',specdata);save('step-05-pilot-parity-receipts.json',receiptdata);save('step-05-seam4-fix2-apply-rollback.json',{'proof':'Source-only proposed diffs applied and reversed in scratch, never applied to consumers','files':logs})
print(json.dumps({'sourceSpecsUpdated':len(logs),'carryCorrections':len(changes)}))
