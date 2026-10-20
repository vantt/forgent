"""Closed seam5 batches only. Reuses pinned source, spans, diff and admission doors.
Unfinished files are conserved by the continuation queue; no completion inferred.
"""
import sys
sys.dont_write_bytecode=True
import pathlib,json,hashlib,importlib.util,collections,re,copy
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
sp=importlib.util.spec_from_file_location('pilot',P/'step-05-check.py');m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
sp=importlib.util.spec_from_file_location('s4',P/'step-05-seam4-check.py');s4=importlib.util.module_from_spec(sp);sp.loader.exec_module(s4)
sha=m.sha;read=m.read
sp=importlib.util.spec_from_file_location('bulk',P/'step-05-seam5-bulk-rules.py');bulk=importlib.util.module_from_spec(sp);sp.loader.exec_module(bulk)
sp=importlib.util.spec_from_file_location('neutral',P/'step-05-seam5-neutral-rules.py');neutral=importlib.util.module_from_spec(sp);sp.loader.exec_module(neutral)
sp=importlib.util.spec_from_file_location('j3',P/'step-05-seam5-batch3-judgment-check.py');j3=importlib.util.module_from_spec(sp);sp.loader.exec_module(j3)
sp=importlib.util.spec_from_file_location('rootneutral',P/'step-05-seam5-root-rules.py');rootneutral=importlib.util.module_from_spec(sp);sp.loader.exec_module(rootneutral)
sp=importlib.util.spec_from_file_location('j4',P/'step-05-seam5-batch4-judgment-check.py');j4=importlib.util.module_from_spec(sp);sp.loader.exec_module(j4)
def extra_records():
 return bulk.rows('step-05-records/tests-mechanical.jsonl') + (bulk.rows('step-05-records/tests-real-file.jsonl') if (P/'step-05-records/tests-real-file.jsonl').exists() else []) + (bulk.rows('step-05-records/tests-cutover-neutral.jsonl') if (P/'step-05-records/tests-cutover-neutral.jsonl').exists() else []) + (bulk.rows('step-05-records/tests-real-file-batch3.jsonl') if (P/'step-05-records/tests-real-file-batch3.jsonl').exists() else []) + bulk.rows('step-05-records/tests-root-neutral.jsonl') + bulk.rows('step-05-records/tests-judgment-batch4.jsonl')
RULES={'s5-coverage':'Closed batch retains all original identities and remaining queue/carries exactly once.','s5-lexical':'Every pinned whole-file docs-root token has its own physical reference span.','s5-pins':'Every input digest/mode/byte count matches its own immutable git pin.','s5-spans':'Every literal, passage, operation and full enclosing test callback matches pinned bytes.','s5-inheritance':'Step4 source slots retain exact identity/disposition and complete prior record hash.','s5-patches':'Complete source and golden diffs apply and reverse exactly, without additional substitutions.','s5-atomic':'Source 31/48 and full expected golden 198/215 co-cut; complete rendered bytes equal at both sides.','s5-receipts':'Source/candidate hashes, full specs and required comparison fields join one honest pending receipt.','s5-review':'Only admitted/judgment items are window obligations; mechanical rejects remain separately enumerated.','r19-label-diagnostic':'Only an assert.ok diagnostic label, in a complete census-root-free callback with no traced census constant, can be rejected mechanically.'}
def load():return m.rows('step-05-records/tests-prompt-goldens.jsonl')
def enclosing_test(body,line):
 ls=body.splitlines();a=max(n for n in range(1,line+1) if ls[n-1].startswith("test('"));b=next(n for n in range(line,len(ls)+1) if ls[n-1]=='});')
 return {'startLine':a,'endLine':b,'text':'\n'.join(ls[a-1:b])}
def rendered(source,fixture):
 for k,v in fixture.items():source=source.replace('{'+k+'}',v)
 return source
def golden(body):
 text=body[body.index("test('renderTemplate(worker-prompt-skill-pointer.txt"):]
 raw=re.search(r'const golden = `([\s\S]*?)`;\n',text)[1]
 return re.sub(r'\\([`\\])',r'\1',raw)
def mechanical(r,d):
 ev=d['mechanicalRejection'];pin=r['authorInputCommit'];body=m.pinned(pin,r['file']);enc=enclosing_test(body,d['currentLine'])
 assert ev['enclosingFunction']==dict(enc,sha256=sha(enc['text'])),'full enclosing callback evidence must be exact'
 # Any literal census root anywhere in the enclosing callback disqualifies a mechanical reject.
 assert not re.search(r'docs/|[\x22\x27`]docs[\x22\x27`]|(?:README|CHANGELOG|AGENTS|CLAUDE|LICENSE)(?:\.md)?\b',enc['text']), 'enclosing callback contains census-root literal'
 assert not m.admission.literal_roots(d['currentPassage']['text']), 'passage contains census-root literal'
 constants=m.admission.binding_roots(pin,r['file']);traced=sorted(k for k in m.admission.identifiers(enc['text']) if 'documents' in constants.get(k,set()))
 assert not traced,'identifier/import traces to census-root constant: '+str(traced)
 assert ev['rootLiteralHits']==[] and ev['tracedCensusConstants']==traced
 assert ev['ruleId']=='r19-label-diagnostic' and ev['category']=='string/label joins'
 line=body.splitlines()[d['currentLine']-1]
 assert re.fullmatch(r'\s*assert\.ok\(raw\.includes\(placeholder\), `expected template to include \$\{placeholder\}`\);',line), 'operand is outside the closed diagnostic-label syntax'
 assert d['originalTuple'][4]=='`expected template to include ${placeholder}`'
 assert d['admission']=='REJECT' and d['disposition']=='preserve' and d['nonDocumentUse']=='text-label-join'
 assert ev['inputCommit']==pin and ev['sourceSha256']==r['sourceSha256'] and ev['sourceFile']==r['file']
 return True

def check(rs=None,receipts=None,specs=None,listing=None,continuation=None):
 rs=load() if rs is None else rs;receipts=read('step-05-seam5-parity-receipts.json')['receipts'] if receipts is None else receipts;specs=read('step-05-seam5-cutover-specs.json')['patches'] if specs is None else specs;listing=read('step-05-seam5-review-list.json') if listing is None else listing;continuation=read('step-05-seam5-continuation.json') if continuation is None else continuation
 errors=[];counts=collections.Counter()
 def test(rule,loc,fn):
  counts[rule]+=1
  try:
   result=fn();assert result is None or bool(result)
  except Exception as exc:errors.append({'rule':rule,'where':loc,'error':str(exc) or 'condition false'})
 selection=read('step-05-seam5-batch-selection.json');by={r['file']:r for r in rs};receiptby={r['id']:r for r in receipts};specby={s['file']:s for s in specs}
 poprefs={e['id']:e for e in m.rows('step-05-population-references.jsonl') if e['file'] in selection['files']};popdyn={e['id']:e for e in m.rows('step-05-population-dynamic.jsonl') if e['file'] in selection['files']}
 refs=[e['referenceId'] for r in rs for e in r['references']];dyn=[e['id'] for r in rs for e in r['dynamicTraces']]
 test('s5-coverage','closed file and item sets',lambda:len(rs)==len(by) and set(by)==set(selection['files']) and len(refs)==len(set(refs)) and set(refs)==set(poprefs)==set(selection['referenceIds']) and len(dyn)==len(set(dyn)) and set(dyn)==set(popdyn)==set(selection['dynamicIds']))
 def remaining():
  pop={e['file']:e for e in m.rows('step-05-population-files.jsonl') if e['seam']=='real-file-tests-goldens'};q=continuation['remainingFilesInOrder'];assert len(q)==len({e['file'] for e in q})==continuation['remainingFileCount'];assert {e['file'] for e in q}==set(pop)-set(by)-{e['file'] for e in extra_records()}
  for e in q:assert e==pop[e['file']]
  assert continuation['remainingReferences']==sum(len(e['referenceIds']) for e in q) and continuation['remainingDynamicTuples']==sum(e['dynamicCount'] for e in q)
  assert continuation['dynamicCarries']==[e for e in m.rows('step-05-dynamic-carries.jsonl') if e['seam']=='real-file-tests-goldens']
 test('s5-coverage','remaining queue and original carries',remaining)
 for r in rs:
  f=r['file'];body=m.pinned(r['authorInputCommit'],f);ls=body.splitlines()
  def pins(r=r,body=body,f=f):
   assert sha(body)==r['sourceSha256'];assert r['wholeFileRead'] is True and r['wholeFileReadEvidence']['bytes']==len(body.encode()) and r['wholeFileReadEvidence']['lines']==len(body.splitlines())
   assert r['sourceMode']==m.m.git('ls-tree',r['authorInputCommit'],'--',f).decode().split()[0]
   for path,digest in r['protectedPins'].items():assert sha(m.m.blob(r['authorInputCommit'],path))==digest
   assert r['review']['status']=='pending' and not r['generated']
  test('s5-pins',f,pins)
  def lexical(r=r,body=body):
   for n,line in enumerate(body.splitlines(),1):
    for hit in re.finditer(r'docs/[^\s`\x22\x27,;]*',line):
     assert any(sp['line']==n and (sp['text'] in hit[0] or hit[0] in sp['text']) and sp['columnStart']<=hit.start()+1<sp['columnEndExclusive'] for e in r['references']+r.get('authorAddedReferences',[]) for sp in e['sourceSpans']), 'unaccounted docs-root token at '+str(n)
  test('s5-lexical',f,lexical)
  for e in r['references']:
   orig=poprefs[e['referenceId']];loc=f+':'+e['referenceId']
   test('s5-coverage',loc,lambda e=e,orig=orig:e['inventoryOrigins']==orig['origins'] and e['originalSourceSpans']==orig['sourceSpans'] and e['matchedExpression']==orig['expression'])
   def span(e=e):
    m.m.spans_text(body,e['sourceSpans']);c=e['passageSpan'];assert e['passage']=='\n'.join(ls[c['startLine']-1:c['endLine']])
    assert e['admission']=='ADMIT' and e['receiptId'] in receiptby and e['parityObligation'] and e['proofCommand']
    if e['role']=='synthetic-fixture':
     w=e['fixtureProvenance'];assert w['sourceSha256']==r['sourceSha256'] and w['fullConstructionPassage'] in body and w['owningTest']['declaration'] in w['fullConstructionPassage'];assert w['readSet']==[] and not e['aliasWriteCheck']['destinationIsAlias']
   test('s5-spans',loc,span)
   if e.get('inheritedSourceSlot'):
    def inherited(e=e):
     j=e['inheritedSourceSlot'];raw=(ROOT/j['recordFile']).read_bytes();assert sha(raw)==j['recordSha256'];old=json.loads(raw.decode().splitlines()[j['recordLine']-1]);slot=next(x for x in old['edges'] if x['edgeId']==j['edgeId'] and x['slotKey']==j['slotKey']);assert e['disposition']==slot['disposition']==j['disposition']
    test('s5-inheritance',loc,inherited)
  for d in r['dynamicTraces']:
   loc=f+':'+d['id'];orig=popdyn[d['id']]
   test('s5-coverage',loc,lambda d=d,orig=orig:d['originalTuple']==orig['callSite'] and d['inventoryOrigins']==orig['inventories'])
   def passage(d=d):
    c=d['currentPassage'];assert c==enclosing_test(body,d['currentLine']);assert d['caller']=={'line':c['startLine'],'declaration':ls[c['startLine']-1]}
    w=d['operationWitness'];assert ls[w['line']-1][w['columnStart']-1:w['columnEndExclusive']-1]==w['text'];assert d['receiptId'] in receiptby
   test('s5-spans',loc,passage)
   if d.get('mechanicalRejection'):test('r19-label-diagnostic',loc,lambda r=r,d=d:mechanical(r,d))
  def patches(r=r,f=f,body=body):
   s=specby[f];assert all(k in s for k in read('step-05-parity-receipt-template.json')['cutoverPatch']);assert s['inputCommit']==r['authorInputCommit'] and s['sourceSha256']==r['sourceSha256'] and s['mode']==r['sourceMode']
   before,after=m.candidate(r);assert before==body and s['oldText']==body and s['newText']==after
   assert s['diff']==r['diff']==m.m.make_diff(f,before,after);assert s4.apply(f,body.encode(),s['diff'])==after.encode();assert s['rollbackDiff']==r['rollbackDiff']==m.m.make_diff(f,after,before);assert s4.apply(f,after.encode(),s['rollbackDiff'])==body.encode();assert sha(after)==r['expectedAfterSha256']==s['expectedAfterSha256']
   assert s['timing']=='phase9' and 'pending' in s['readiness'];assert 'CHANGELOG.md' in r['coCutPaths']
   for e in r['references']:
    if e['disposition']=='patch':assert e['diffHunk']==r['diff'] and e['target']==s['targetOwner'] and e['timing']=='phase9'
   g=m.test_grep(s['inputCommit'],s['atomicUnit']['substitutions'][0][0]);assert s['coCutTestGreps']==[g]
   assert all(h['file'] in r['coCutPaths'] for h in g['matches'])
  test('s5-patches',f,patches)
 for rc in receipts:
  def receipt(rc=rc):
   assert all(k in rc for k in read('step-05-parity-receipt-template.json')['receipt']);assert rc['comparison']['comparedFields']==read('step-05-parity-receipt-template.json')['seamTemplates'][rc['seam']]['requiredComparisons'];assert rc['review']['status']=='pending' and 'pending' in rc['readiness'];assert rc['comparison']['unexpectedDeltas']==[]
   for i in rc['currentInputs']:
    b=m.m.blob(m.input_pin(i,rc['inputCommit']),i['path']);assert sha(b)==i['sha256'] and len(b)==i['bytes'];assert i['mode']==m.m.git('ls-tree',m.input_pin(i,rc['inputCommit']),'--',i['path']).decode().split()[0]
   for i in rc['candidateInputs']:
    if i['path'] in by:b=specby[i['path']]['newText'].encode()
    else:b=m.m.blob(rc['inputCommit'],i['path'])
    assert sha(b)==i['sha256'] and len(b)==i['bytes']
   assert rc['cutoverSpecifications']==specs
   for proof in rc['proofs']:
    assert proof['status'] in ['pass','not-run','missing']
    if proof['status']=='pass':assert proof['exit']==0 and sha((ROOT/proof['logPath']).read_bytes())==proof['logSha256']
    else:assert proof['exit'] is None and proof['logPath'] is None
   assert any(e['status']=='missing' for e in rc['proofs'])
  test('s5-receipts',rc['id'],receipt)
  def atomic(rc=rc):
   u=rc['atomicUnit'];source,testfile=u['files'];assert set(u['files'])==set(by) and u['sourcePointerLines']==[31,48] and u['goldenPointerLines']==[198,215]
   assert all(s['atomicUnit']==u and set(u['files'])<=set(s['coCutPaths']) for s in specs)
   cur=rendered(specby[source]['oldText'],u['fixture']);cand=rendered(specby[source]['newText'],u['fixture']);assert cur==golden(specby[testfile]['oldText'])==u['currentPrompt'];assert cand==golden(specby[testfile]['newText'])==u['candidatePrompt']
   old,new=u['substitutions'][0];assert cur.count(old)==2 and cand==cur.replace(old,new)
   for prefix,text in [('current',cur),('candidate',cand)]:assert sha(text)==u[prefix+'PromptSha256'] and len(text.encode())==u[prefix+'PromptBytes']
   w=u['claimHolder'];holder=m.pinned(rc['inputCommit'],w['target']);hist=m.pinned(w['historicalCommit'],w['historicalSource']);assert sha(holder)==w['targetSha256'] and sha(hist)==w['historicalSha256'];strip=lambda t:re.sub(r'^---\n.*?\n---\n','',t,flags=re.S);assert strip(holder)==strip(hist)
   assert rc['comparison']['currentOutputSet'][0]['sha256']==sha(cur) and rc['comparison']['candidateOutputSet'][0]['sha256']==sha(cand)
  test('s5-atomic',rc['id'],atomic)
 def review():
  assert set(listing['sourceRecords'])==set(by)|{e['file'] for e in extra_records() if not e.get('mechanicalClosure')} and listing['generatedRecords']==[] and 'pending' in listing['reviewStatus']
  listed={e['file']:e for e in listing['canonicalRecords']};mechanical=[]
  for r in rs:
   e=listed[r['file']];assert sha(json.dumps(r,ensure_ascii=False,separators=(',',':')))==e['recordSha256'] and r['sourceSha256']==e['sourceSha256']
   assert e['admittedIds']==[m.admission.idof(x) for x in m.admission.allitems(r) if x['admission']=='ADMIT'];assert e['judgmentCallIds']==[m.admission.idof(x) for x in m.admission.allitems(r) if x['admission']=='REJECT' and not x.get('mechanicalRejection')]
   mechanical.extend({'file':r['file'],'id':d['id'],'ruleId':d['mechanicalRejection']['ruleId']} for d in r['dynamicTraces'] if d.get('mechanicalRejection'))
  assert listing['mechanicalRejects']==mechanical
 test('s5-review','closed batch review obligations',review)
 shared=m.admission.check(rs);errors.extend(shared['failures']);counts.update(shared['checks'])
 bulkout=bulk.check();errors.extend(bulkout['failures']);counts.update(bulkout['checks'])
 sp=importlib.util.spec_from_file_location('judgment',P/'step-05-seam5-judgment-check.py');judgment=importlib.util.module_from_spec(sp);sp.loader.exec_module(judgment)
 jout=judgment.check();errors.extend(jout['failures']);counts.update(jout['checks'])
 closed=bulk.rows('step-05-records/tests-mechanical.jsonl')
 def bulk_listing():
  expected=[{'file':r['file'],'recordFile':str((P/'step-05-records/tests-mechanical.jsonl').relative_to(ROOT)),'recordSha256':sha(json.dumps(r,ensure_ascii=False,separators=(',',':'))),'sourceSha256':r['sourceSha256'],'ruleId':bulk.RULE,'tupleCount':len(r['dynamicTraces'])} for r in closed]
  return listing['mechanicalClosures']==expected and listing['mechanicalClosureCounts']=={'files':len(closed),'tuples':sum(len(r['dynamicTraces']) for r in closed)}
 test('s5-review','mechanical whole-file closures excluded from window review',bulk_listing)
 nout=neutral.check();errors.extend(nout['failures']);counts.update(nout['checks'])
 j3out=j3.check();errors.extend(j3out['failures']);counts.update(j3out['checks'])
 rootout=rootneutral.check();errors.extend(rootout['failures']);counts.update(rootout['checks'])
 j4out=j4.check();errors.extend(j4out['failures']);counts.update(j4out['checks'])
 def root_listing():
  closed=bulk.rows('step-05-records/tests-root-neutral.jsonl');expected=[{'file':r['file'],'recordFile':str((P/'step-05-records/tests-root-neutral.jsonl').relative_to(ROOT)),'recordSha256':sha(json.dumps(r,ensure_ascii=False,separators=(',',':'))),'sourceSha256':r['sourceSha256'],'ruleId':rootneutral.RULE,'referenceCount':len(r['references']),'tupleCount':len(r['dynamicTraces'])} for r in closed]
  assert listing['rootNeutralClosures']==expected and listing['rootNeutralClosureCounts']=={'files':len(closed),'references':sum(len(r['references']) for r in closed),'tuples':sum(len(r['dynamicTraces']) for r in closed)}
 test('s5-review','R21 closures stay outside window review',root_listing)
 def neutral_listing():
  closed=bulk.rows('step-05-records/tests-cutover-neutral.jsonl')
  expected=[{'file':r['file'],'recordFile':str((P/'step-05-records/tests-cutover-neutral.jsonl').relative_to(ROOT)),'recordSha256':sha(json.dumps(r,ensure_ascii=False,separators=(',',':'))),'sourceSha256':r['sourceSha256'],'ruleId':neutral.RULE,'referenceCount':len(r['references']),'tupleCount':len(r['dynamicTraces'])} for r in closed]
  assert listing['neutralClosures']==expected and listing['neutralClosureCounts']=={'files':len(closed),'references':sum(len(r['references']) for r in closed),'tuples':sum(len(r['dynamicTraces']) for r in closed)}
 test('s5-review','R20 closures stay outside window review',neutral_listing)
 return {'kind':'Step5 seam5 closed batches; remaining queue and independent semantic review pending','files':len(rs)+bulkout['files']+jout['files']+nout['files']+j3out['files']+rootout['files']+j4out['files'],'literalReferences':len(refs)+jout['literalReferences']+nout['literalReferences']+j3out['literalReferences']+rootout['literalReferences']+j4out['literalReferences'],'dynamicTuples':len(dyn)+bulkout['dynamicTuples']+jout['dynamicTuples']+nout['dynamicTuples']+j3out['dynamicTuples']+rootout['dynamicTuples']+j4out['dynamicTuples'],'mechanicalRejects':bulkout['dynamicTuples']+sum(bool(d.get('mechanicalRejection')) for r in rs for d in r['dynamicTraces']),'rules':{**RULES,**shared['rules'],**bulkout['rules'],**jout['rules'],**nout['rules'],**j3out['rules'],**rootout['rules'],**j4out['rules']},'checks':dict(counts),'failureCount':len(errors),'failures':errors,'bulkTriage':bulkout,'judgmentBatch':jout,'neutralBatch':nout,'judgmentBatch3':j3out,'rootNeutralBatch':rootout,'judgmentBatch4':j4out,'headDrift':m.head_drift(rs)+m.head_drift(closed)+jout['headDrift']+j3out['headDrift']+j4out['headDrift']+m.head_drift(bulk.rows('step-05-records/tests-root-neutral.jsonl'))+m.head_drift(bulk.rows('step-05-records/tests-cutover-neutral.jsonl'))}
if __name__=='__main__':
 out=check();(P/'step-05-seam5-check-result.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps(out,ensure_ascii=False));sys.exit(bool(out['failures']))
