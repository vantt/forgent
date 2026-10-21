"""Full seam4 record proof. Uses existing span/anchor/diff doors; writes only report result."""
import sys
sys.dont_write_bytecode=True
import pathlib,json,hashlib,importlib.util,collections,re,copy,subprocess,tempfile,functools
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
sp=importlib.util.spec_from_file_location('pilot',P/'step-05-check.py');m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
admission=m.admission
sha=m.sha
read=m.read
rows=m.rows
RULES={'s4-coverage':'Every original reference/tuple, promoted output and supplemental source has exactly one canonical record.','s4-pins':'Complete source bytes/mode/pin, prior records and protected inputs match.','s4-spans':'Each physical reference and dynamic passage matches current pinned source.','s4-inheritance':'Existing source/render slot identity and disposition retained, no duplicate rendered diff.','s4-operand':'Scalar guard/metadata cannot be admitted by borrowing path context; document identity comparisons stay admitted.','s4-parks':'Each parked operation keeps its own blocker and dependency; no ready patch.','s4-retiring-retained':'A retiring target cannot preserve on a retained witness.','s4-patches':'Whole source-only diff applies at exact pin and rolls back byte-for-byte; packet-only header custody explicit.','s4-greps':'Each source patch retains complete literal/escaped test grep evidence and every match decision.','s4-outputs':'Sorted unique pinned output metadata; generated candidates/second run remain missing.','s4-receipts':'Complete per-family comparisons and honest missing/not-run proof.','s4-carries':'All 137 original carries and 165 original pilot ids retained without losing tuples.','s4-lexical':'Every whole-file legacy-root occurrence accounted by original ref, prior slot or author-added edge.','s4-review':'All admitted occurrences and every rejection/changed source slot in bounded hash-bound exact-window parts.'}
RULES.update(admission.RULES)
def load():return [r for f in sorted((P/'step-05-records').glob('generators-*.jsonl')) for r in map(json.loads,f.read_text().splitlines())]
@functools.lru_cache(None)
def prior(path,line):return rows(str(pathlib.Path(path).relative_to(P.relative_to(ROOT))))[line-1]
@functools.lru_cache(None)
def apply(f,b,diff):
 pathlib.Path('/tmp/fgos-work').mkdir(exist_ok=True)
 with tempfile.TemporaryDirectory(prefix='s4-check-',dir='/tmp/fgos-work') as td:
  fpath=pathlib.Path(td)/f;fpath.parent.mkdir(parents=True);fpath.write_bytes(b)
  p=subprocess.run(['patch','--batch','--fuzz=0','-p1','-d',td],input=diff.encode(),capture_output=True)
  assert p.returncode==0,p.stdout.decode()+p.stderr.decode()
  return fpath.read_bytes()
def retiring_retained(e):
 if e.get('disposition')=='preserve' and re.search(r'docs/(?:specs|architect)(?:/|$)',str(e.get('target') or e.get('matchedExpression',''))):
  assert 'retained' not in str(e.get('resolverWitness',{})).lower(),'retiring tree is not retained'
 return True
@functools.lru_cache(None)
def projection_fields(pin,f):
 fields={};active=None
 for n,line in enumerate(m.pinned(pin,f).splitlines(),1):
  if f.endswith('.json'):
   arr=re.match(r'\s*"(aliases|sourceCaptureIds)"\s*:\s*\[',line)
   if arr:active=arr[1]
   direct=re.match(r'\s*"(purposeTitle|currentPath|docPath|sourceCaptureId)"\s*:',line)
   fields[n]=direct[1] if direct else active
   if re.match(r'\s*\]',line):active=None
  else:fields[n]='purposeTitle' if line.startswith('### ') else 'aliases' if '- Aliases:' in line else 'currentPath'
 return fields

def check(rs=None,receipts=None,specs=None,index=None,check_packets=True):
 rs=load() if rs is None else rs;receipts=read('step-05-seam4-parity-receipts.json')['receipts'] if receipts is None else receipts;specs=read('step-05-seam4-cutover-specs.json')['patches'] if specs is None else specs
 errors=[];checks=collections.Counter()
 def test(rule,where,fn):
  checks[rule]+=1
  try:
   v=fn();assert bool(v) or (v is None and fn.__name__!='<lambda>')
  except Exception as exc:errors.append({'rule':rule,'where':where,'error':str(exc) or 'condition false'})
 sel=read('step-05-seam4-selection.json');byfile={r['file']:r for r in rs};receiptby={r['id']:r for r in receipts}
 poprefs={e['id']:e for e in rows('step-05-population-references.jsonl') if e['id'] in sel['referenceIds']};popdyn={e['id']:e for e in rows('step-05-population-dynamic.jsonl') if e['id'] in sel['dynamicIds']}
 allrefs=[e['referenceId'] for r in rs for e in r['references']];alldyn=[d['id'] for r in rs for d in r['dynamicTraces']]
 test('s4-coverage','file set',lambda:len(rs)==len(byfile) and set(byfile)==set(sel['baseFiles'])|set(sel['supplementalSources']))
 test('s4-coverage','reference set',lambda:len(allrefs)==len(set(allrefs)) and set(allrefs)==set(poprefs))
 test('s4-coverage','dynamic set',lambda:len(alldyn)==len(set(alldyn)) and set(alldyn)==set(popdyn))
 for r in rs:
  f=r['file'];physical=r['wholeFileRead'];source=m.pinned(r['authorInputCommit'],f) if physical else None
  def pins(r=r,source=source):
   if not physical:
    assert ';' in f and r['sourceSha256'] is None
    for c in r['wholeFileReadEvidence']['constituents']:assert sha(m.m.blob(r['authorInputCommit'],c['path']))==c['sha256']
   else:
    assert sha(source)==r['sourceSha256']
    assert r['sourceMode']==m.m.git('ls-tree',r['authorInputCommit'],'--',f).decode().split()[0]
    assert r['wholeFileReadEvidence']['bytes']==len(source.encode()) and r['wholeFileReadEvidence']['lines']==len(source.splitlines())
   for pr in r['priorRecordRefs']:assert sha((ROOT/pr['recordFile']).read_bytes())==pr['recordSha256']
   for path,digest in r['protectedPins'].items():assert sha(m.m.blob(r['authorInputCommit'],path))==digest
   assert r['review']['status']=='pending'
  test('s4-pins',f,pins)
  for e in r['references']:
   loc=f+':'+e['referenceId'];orig=poprefs[e['referenceId']]
   test('s4-coverage',loc,lambda e=e,orig=orig:e['inventoryOrigins']==orig['origins'] and e['originalSourceSpans']==orig['sourceSpans'] and e['matchedExpression']==orig['expression'] and e['admission'] in ['ADMIT','REJECT'])
   def spans(e=e):
    if not e['sourceSpans']:assert e['disposition']=='parked';return
    m.m.spans_text(source,e['sourceSpans'])
    if e.get('projectionFieldAtSpan'):
     field=projection_fields(r['authorInputCommit'],f)[e['sourceSpans'][0]['line']];assert field==e['projectionFieldAtSpan'];roles={'sourceCaptureIds':'capture/provenance-key','sourceCaptureId':'capture/provenance-key','aliases':'generated-alias-lookup-key','purposeTitle':'generated-purposeTitle','currentPath':'generated-currentPath/docPath','docPath':'generated-currentPath/docPath'};assert e['role']==roles[field];assert all(k['field']==field for k in e['projectionSourceKeys'])
    a=e['passageSpan']['startLine'];b=e['passageSpan']['endLine'];assert e['passage']=='\n'.join(source.splitlines()[a-1:b])
   test('s4-spans',loc,spans);test('s4-retiring-retained',loc,lambda e=e:retiring_retained(e))
   w=e['resolverWitness']
   if w.get('prior'):
    def inherited(e=e,w=w):
     pr=w['prior'];old=prior(pr['recordFile'],pr['recordLine']);slot=next(x for x in old['edges'] if x.get('slotKey')==w.get('slotKey') and x['edgeId']==w['edgeId'])
     assert admission.r26_joined(r,e) or e['disposition']==slot['disposition'] or e['disposition']=='parked' and not e['sourceSpans'] or (e.get('sourceOwner') and e.get('rulingOverride')=='L12-72 R2' and admission.owner(e['sourceOwner'],{r['file']:r for r in rs})['disposition']=='parked')
     if e['disposition']=='render-join':
      sr=w['sourceRecord'];ss=next(x for x in prior(sr['recordFile'],sr['recordLine'])['edges'] if x.get('slotKey')==w['sourceSlotKey']);assert ss['matchedExpression']==w['sourceExpression'] and ss['disposition']==w['sourceDisposition']
    test('s4-inheritance',loc,inherited)
   for join in e.get('physicalPriorJoins',[]):
    def physical_join(join=join,e=e):
     old=prior(join['recordFile'],join['recordLine']);slot=next(x for x in old['edges'] if x['edgeId']==join['edgeId'] and x.get('slotKey')==join['slotKey'] and x['sourceSpans']==join['sourceSpans'] and x.get('consumerFile',old['file'])==f);assert slot['sourceSpans']==join['sourceSpans'] and slot['disposition']==join['disposition'];assert sha((ROOT/join['recordFile']).read_bytes())==join['recordSha256'];m.m.spans_text(m.pinned(join['inputCommit'],f),join['sourceSpans']);assert any(a['text'] in b['text'] or b['text'] in a['text'] for a in join['sourceSpans'] for b in e['sourceSpans'])
    test('s4-inheritance',loc+':physical-original-id',physical_join)
   if e['disposition']=='parked':test('s4-parks',loc,lambda e=e:e['blockedReason'] and e['dependency'] and (e['blockedCategory']==e['dependencyCategory'] or admission.r26_joined(r,e)) and e['timing']=='phase9' and e['diffHunk'] is None and e['target'] is None)
   if e['disposition']=='patch':test('s4-patches',loc,lambda e=e:e['diffHunk']==r['diff'] and e['target'] and not r['generated'])
  for d in r['dynamicTraces']:
   loc=f+':'+d['id'];orig=popdyn[d['id']]
   test('s4-coverage',loc,lambda d=d,orig=orig:d['originalTuple']==orig['callSite'] and d['inventoryOrigins']==orig['inventories'])
   def ds(d=d):
    if not physical:
     assert d['disposition']=='parked' or d['admission']=='REJECT' and d.get('nonDocumentUse')=='generated-data-text';return
    c=d['currentPassage'];assert c['text']=='\n'.join(source.splitlines()[c['startLine']-1:c['endLine']]);assert d['caller']['declaration'] and d['inputs']
    if d.get('enclosingFunctionEvidence') and d['currentLine'] is not None:
     ev=d['enclosingFunctionEvidence'];assert ev['startLine']<=d['currentLine']<=ev['endLine'];assert d['caller']['line']==ev['startLine'];assert d['caller']['declaration']==source.splitlines()[d['caller']['line']-1].strip() or ev['symbol'] is None
    if d['currentLine'] is None:
     assert d['disposition']=='parked' and ('relocation' in d['blockedReason'] or 'rebind' in d['blockedReason']) or d['admission']=='REJECT' and d.get('relocationEvidence',{}).get('originalTupleAbsent') and d['originalTuple'][4] not in source
   test('s4-spans',loc,ds)
   def operand(d=d):
    x=d['originalTuple'][4]
    if d['admission']=='ADMIT' and d['currentLine'] is not None:
     assert not (re.match(r'^(?:scope|scoped)\s*=',x) or re.match(r'^(?:contractScope|scopedRoutes)\s*[:|]',x) or 'hasGlobA' in x or 'hasGlobB' in x or x.startswith('DOMAIN_SCOPED_SHAPE =') or x.startswith('PATH_LINE ='))
    if f=='src/report/knowledge-resolver.mjs':assert d['admission']=='ADMIT' and d['role']=='document-identity-lookup'
    if d['admission']=='REJECT':assert d['disposition']=='preserve' and d['rejectedAsUnrelatedReason'] and repr(x) in d['reason']
   test('s4-operand',loc,operand)
   if d['disposition']=='parked':test('s4-parks',loc,lambda d=d:d['blockedReason'] and d['stateExportDependency'] and (d['blockedSeams']==['generators'] or admission.r26_joined(r,d)))
  for e in r['authorAddedReferences']:test('s4-retiring-retained',f+':'+e['id'],lambda e=e:retiring_retained(e))
  test('s4-outputs',f,lambda:r['diff'] is None if r['generated'] else True)
  test('s4-receipts',f,lambda:len(r['receiptIds'])==1 and r['receiptIds'][0] in receiptby)
 for s in specs:
  f=s['file']
  def patch(s=s,f=f):
   assert all(k in s for k in ['symbolOrPassage','oldText','newText','sourceSpans','diff','expectedAfterSha256','targetOwner','claimAnchorProof','receiptId','coCutPaths','expectedOutputSets','testTargets','intentionalBehaviorDeltas','prerequisites','order','rollbackDiff','timing'])
   before=m.pinned(s['inputCommit'],f).encode();assert sha(before)==s['sourceSha256'];after=apply(f,before,s['diff']);assert sha(after)==s['expectedAfterSha256'];assert apply(f,after,s['rollbackDiff'])==before
   assert s['timing']=='phase9' and 'pending' in s['readiness'] and not byfile[f]['generated']
   if f.startswith('docs/'):assert s.get('packetOnly') and f in ['docs/backlog.md','docs/transitional-switchboard.md'] and 'Step 3' in s['prerequisites'][0]
   else:assert byfile[f]['diff']==s['diff'] and byfile[f]['expectedAfterSha256']==s['expectedAfterSha256']
  test('s4-patches',f,patch)
  def greps(s=s):
   assert s['coCutTestGreps']
   for g in s['coCutTestGreps']:
    assert g==m.test_grep(s['inputCommit'],g['oldPointer'])
    for hit in g['matches']:assert hit['file'] in s['coCutPaths'] and any(d['match']==hit and d['disposition'] in ['patch','preserve','parked'] and d['reason'] for d in s['coCutTestDecisions'])
  test('s4-greps',f,greps)
 out=read('step-05-seam4-output-provenance.json')
 def outputs():
  a=out['currentTrackedOutputSet'];assert [x['path'] for x in a]==sorted({x['path'] for x in a});assert out['candidateOutputSet'] is None and out['secondRunOutputSet'] is None
  for e in a:
   assert sha(m.m.blob(m.input_pin(e,out['inputCommit']),e['path']))==e['sha256'] and len(m.m.blob(m.input_pin(e,out['inputCommit']),e['path']))==e['bytes']
   if e.get('sourceSha256'):assert sha(m.m.blob(m.input_pin(e,out['inputCommit']),e['source']))==e['sourceSha256']
 test('s4-outputs','static output set',outputs)
 for x in receipts:
  def receipt(x=x):
   assert all(k in x for k in read('step-05-parity-receipt-template.json')['receipt']);assert x['comparison']['comparedFields']==read('step-05-parity-receipt-template.json')['seamTemplates']['generators-projections']['requiredComparisons']
   assert x['comparison']['candidateOutputSet'] is None and 'pending' in x['readiness'] and x['review']['status']=='pending'
   for i in x['currentInputs']:assert sha(m.m.blob(m.input_pin(i,x['inputCommit']),i['path']))==i['sha256']
   for i in x['candidateInputs']:
    if byfile.get(i['path'],{}).get('generated'):assert i['sha256'] is None,'uncomputed generated intermediate cannot use current hash as candidate proof'
   assert any(p['status']=='missing' for p in x['proofs'])
   for p in x['proofs']:
    assert p['status'] in ['not-run','missing'] and p['exit'] is None and p['logPath'] is None
    for target in re.findall(r'test/[\w/.-]+\.mjs',p['command']):assert m.m.blob(x['inputCommit'],target) is not None,'Owning test does not exist at input pin: '+target
  test('s4-receipts',x['id'],receipt)
 carry=read('step-05-seam4-inherited-carries.json')
 def carries():
  expected=[r for r in rows('step-05-dynamic-carries.jsonl') if r['seam']=='generators-projections'];assert [r['original'] for r in carry['dynamicCarries']]==expected and len(expected)==137
  assert len(carry['pilotOriginal165'])==165 and len({x['id'] for x in carry['pilotOriginal165']})==165
  pilot=m.load();ds={d['id']:d for r in pilot for d in r['dynamicTraces']};assert sum(x['disposition']=='parked' for x in carry['pilotOriginal165'])==153
  for d in carry['pilotOriginal165']:assert d['originalTuple']==ds[d['id']]['originalTuple'] and (d['id'] in ds)
  changes=read('step-05-seam4-carry-corrections.json')['changes'];expected={x['id'] for x in carry['pilotOriginal165'] if (x['admission'],x['disposition'])!=(ds[x['id']]['admission'],ds[x['id']]['disposition'])}
  assert set(x['id'] for x in changes)==expected
  for x in changes:assert x['to']==[ds[x['id']]['admission'],ds[x['id']]['disposition']] and x['ruling']=='L12-72'
 test('s4-carries','original identities',carries)
 lexical=read('step-05-seam4-own-operand-sweep.json')['wholeFileLexicalCoverage']
 pattern=r'docs/(?:history|specs|architect|contracts|how-to|explanation|reference|tutorials|decisions)(?![\w-])(?:/[^\s\x22\x27`<>),;]*)?'
 computed={(r['file'],n,h.start()+1,h[0]) for r in rs if r['wholeFileRead'] for n,line in enumerate(m.pinned(r['authorInputCommit'],r['file']).splitlines(),1) for h in re.finditer(pattern,line)}
 test('s4-lexical','complete whole-file census versus grep',lambda:computed=={(e['file'],e['line'],e['columnStart'],e['token']) for e in lexical})
 for entry in lexical:
  def lex(entry=entry):
   r=byfile[entry['file']];line=m.pinned(r['authorInputCommit'],r['file']).splitlines()[entry['line']-1];assert line[entry['columnStart']-1:].startswith(entry['token'])
   if entry['authorAddedId']:assert any(e['id']==entry['authorAddedId'] for e in r['authorAddedReferences'])
   else:assert entry['referenceIds'] or entry['priorSlotKeys']
  test('s4-lexical',entry['file']+':'+str(entry['line']),lex)
 if check_packets:
  admission.review_obligations(rs,read('step-05-seam4-review-index.json') if index is None else index,test,'s4-review',sha,read)
 shared=admission.check(rs,context=rs+m.load())
 errors.extend(shared['failures']);checks.update(shared['checks'])
 return {'kind':'Step5 seam4 complete record checker; semantic review and cutover proof pending','files':len(rs),'literalReferences':len(allrefs),'dynamicTuples':len(alldyn),'rules':RULES,'checks':dict(checks),'failureCount':len(errors),'failures':errors,'headDrift':m.head_drift(rs)}
if __name__=='__main__':
 out=check();(P/'step-05-seam4-check-result.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps(out,ensure_ascii=False));sys.exit(bool(out['failures']))
