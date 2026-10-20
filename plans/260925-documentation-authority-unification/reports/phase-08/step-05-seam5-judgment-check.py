"""Structural/pin/claim/patch checks for authored real-reader judgments.
Semantic dispositions remain pending independent Option B source-window review.
"""
import sys
sys.dont_write_bytecode=True
import pathlib,json,importlib.util,collections,re,subprocess
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
sp=importlib.util.spec_from_file_location('pilot',P/'step-05-check.py');m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m)
sp=importlib.util.spec_from_file_location('s4',P/'step-05-seam4-check.py');s4=importlib.util.module_from_spec(sp);sp.loader.exec_module(s4)
sha=m.sha
RULES={k:v for k,v in [('j-coverage','Every closed real-reader file retains all its census references and original tuples once.'),('j-pins','Full source files, real read inputs and target claims are bound to immutable pin/mode/hash.'),('j-spans','All original spans, passages and actual operation operands are exact pinned text.'),('j-claims','Patches conserve exact headings in live claim regions; no missing claim is supplied by a summary.'),('j-search','Every park carries complete pinned alias and four-root target-search evidence.'),('j-patches','Whole-file forward/inverse diffs and complete co-cut greps match only declared pointer deltas.'),('j-receipts','No candidate output or proof is claimed; receipt current/candidate input metadata and pending obligations match.'),('j-review','Every admitted or judgment-rejected item is included in the independent review list.') ]}
def load():return m.rows('step-05-records/tests-real-file.jsonl')
def check(rs=None,receipt=None,specs=None,listing=None):
 rs=load() if rs is None else rs;receipt=m.read('step-05-seam5-batch2-judgment-receipts.json')['receipts'][0] if receipt is None else receipt;specs=m.read('step-05-seam5-batch2-cutover-specs.json')['patches'] if specs is None else specs;listing=m.read('step-05-seam5-review-list.json') if listing is None else listing
 errors=[];counts=collections.Counter()
 def test(rule,where,fn):
  counts[rule]+=1
  try:ret=fn();assert ret is None or bool(ret)
  except Exception as ex:errors.append({'rule':rule,'where':where,'error':str(ex) or 'condition false'})
 by={r['file']:r for r in rs};refpop={e['id']:e for e in m.rows('step-05-population-references.jsonl') if e['file'] in by};dynpop={e['id']:e for e in m.rows('step-05-population-dynamic.jsonl') if e['file'] in by}
 test('j-coverage','unique closed file set',lambda:len(rs)==len(by)==2 and set(by)=={'test/docs/decisions-corpus-retired.test.mjs','test/docs/rul11-anchor-phrase.test.mjs'})
 refs=[e['referenceId'] for r in rs for e in r['references']];dyn=[e['id'] for r in rs for e in r['dynamicTraces']]
 test('j-coverage','reference and tuple identity conservation',lambda:len(refs)==len(set(refs)) and set(refs)==set(refpop) and len(dyn)==len(set(dyn)) and set(dyn)==set(dynpop))
 for r in rs:
  f=r['file'];pin=r['authorInputCommit'];body=m.pinned(pin,f);ls=body.splitlines()
  def pins(r=r,pin=pin,f=f,body=body):
   assert sha(body)==r['sourceSha256'] and r['sourceMode']==m.m.git('ls-tree',pin,'--',f).decode().split()[0]
   ev=r['wholeFileReadEvidence'];assert r['wholeFileRead'] and ev['bytes']==len(body.encode()) and ev['lines']==len(body.splitlines()) and ev['sha256']==sha(body)
   assert not r['generated'] and r['review']['status']=='pending'
   for path,digest in r['protectedPins'].items():assert sha(m.m.blob(pin,path))==digest
  test('j-pins',f,pins)
  for e in r['references']:
   def ref(e=e,body=body,ls=ls):
    orig=refpop[e['referenceId']];assert e['inventoryOrigins']==orig['origins'] and e['originalSourceSpans']==orig['sourceSpans'] and e['sourceSpans']==orig['sourceSpans'] and e['matchedExpression']==orig['expression'];m.m.spans_text(body,e['sourceSpans']);p=e['passageSpan'];assert e['passage']=='\n'.join(ls[p['startLine']-1:p['endLine']]);assert e['receiptId']==receipt['id']
   test('j-spans',f+':'+e['referenceId'],ref)
  for e in r['dynamicTraces']:
   def dynamic(e=e,body=body,ls=ls):
    orig=dynpop[e['id']];assert e['originalTuple']==orig['callSite'] and e['inventoryOrigins']==orig['inventories'];p=e['currentPassage'];assert p['text']=='\n'.join(ls[p['startLine']-1:p['endLine']]);assert e['caller']=={'line':p['startLine'],'declaration':ls[p['startLine']-1]};w=e['operationWitness'];assert ls[w['line']-1][w['columnStart']-1:w['columnEndExclusive']-1]==w['text']==e['originalTuple'][4].split('\n')[0];assert e['receiptId']==receipt['id'];assert e['parityObligation'] and e['proofCommand']
    if e['admission']=='ADMIT':
     assert e['resolverWitness']['readOnly'] and e['aliasWriteCheck']['destinationIsAlias'] is False and e['consumingOperations']
     for use in e['consumingOperations']:assert ls[use['line']-1]==use['text'] and re.search(r'fs\.(?:readFileSync|readdirSync|existsSync|statSync)\(',use['text'])
    else:assert not e.get('mechanicalRejection') and e['nonDocumentUse'] in m.admission.CATEGORIES
   test('j-spans',f+':'+e['id'],dynamic)
  def lexical(r=r,body=body):
   for n,line in enumerate(body.splitlines(),1):
    for hit in re.finditer(r'docs/[^\s`\x22\x27,;]*',line):assert any(s['line']==n and s['columnStart']<=hit.start()+1<s['columnEndExclusive'] and (s['text'] in hit[0] or hit[0] in s['text']) for e in r['references']+r['authorAddedReferences'] for s in e['sourceSpans']), 'unaccounted docs token at '+str(n)
  test('j-coverage',f+' lexical closure',lexical)
  def patches(r=r,f=f,body=body,pin=pin):
   before,after=m.candidate(r);assert before==body and sha(after)==r['expectedAfterSha256']
   spec=next((s for s in specs if s['file']==f),None)
   if before==after:assert spec is None and r['diff'] is None and r['rollbackDiff'] is None;return
   assert spec and spec['oldText']==before and spec['newText']==after and spec['sourceSha256']==sha(before) and spec['inputCommit']==pin and spec['mode']==r['sourceMode']
   assert spec['diff']==r['diff']==m.m.make_diff(f,before,after);assert s4.apply(f,before.encode(),spec['diff'])==after.encode()
   assert spec['rollbackDiff']==r['rollbackDiff']==m.m.make_diff(f,after,before);assert s4.apply(f,after.encode(),spec['rollbackDiff'])==before.encode()
   assert spec['timing']=='phase9' and 'pending' in spec['readiness'] and spec['receiptId']==receipt['id'] and r['coCutPaths']==spec['coCutPaths']==receipt['coCutPaths']
   greps=[m.test_grep(pin,c['oldPath']) for c in receipt['comparison']['claimCorrespondence']];assert greps==spec['coCutTestGreps']==receipt['coCutTestGreps'];assert all(h['file'] in spec['coCutPaths'] for g in greps for h in g['matches']);assert 'CHANGELOG.md' in spec['coCutPaths']
   for e in r['references']+r['dynamicTraces']:
    if e['disposition']=='patch':assert e['diffHunk']==spec['diff'] and e['target'] in [c['target'] for c in receipt['comparison']['claimCorrespondence']]
   assert all(k in spec for k in m.read('step-05-parity-receipt-template.json')['cutoverPatch'])
  test('j-patches',f,patches)
 def claims():
  pin=receipt['inputCommit']
  for c in receipt['comparison']['claimCorrespondence']:
   old=m.pinned(pin,c['oldPath']);new=m.pinned(pin,c['target']);assert sha(old)==c['oldSha256'] and sha(new)==c['targetSha256'];assert c['targetStatus']=='live claim region eligible for Phase 9 patch-only; current source authority unchanged'
   for w in c['liveRegionWitness']:
    assert new.splitlines()[w['line']-1]==w['text'] and w['resolverCarriage'] is False and w['explicitCarriageDeclaration'] is None
    assert m.m.resolver.carriage(new,w['line'],c['target']) is False and m.m.carriage_declaration(new,w['line']) is None
   for w in c['assertionWitnesses']:assert re.findall(w['regex'],old,re.M)==w['oldMatches']==w['targetMatches']==re.findall(w['regex'],new,re.M) and w['oldMatches']
  for q in receipt['comparison']['negativeSearches']:
   assert q['command']==['git','grep','-n','-F',q['term'],pin,'--','docs/platform','docs/knowledge'];proc=subprocess.run(q['command'],cwd=ROOT,text=True,capture_output=True);assert proc.returncode==q['exit'] and proc.stdout.splitlines()==q['matches'] and sha(proc.stdout)==q['stdoutSha256']
  assert receipt['comparison']['noAssertionWeakening'] is True
  # Exact candidate preserves all test declarations and assertions; only reader tokens change.
  for s in specs:
   strip=lambda b:[line for line in b.splitlines() if line.lstrip().startswith(('test(','assert.'))]
   assert strip(s['oldText'])==strip(s['newText'])
 test('j-claims','same owning assertions and real missing claim searches',claims)
 def receipts():
  assert all(k in receipt for k in m.read('step-05-parity-receipt-template.json')['receipt']);assert receipt['comparison']['comparedFields']==m.read('step-05-parity-receipt-template.json')['seamTemplates'][receipt['seam']]['requiredComparisons'];assert receipt['cutoverSpecifications']==specs and receipt['comparison']['unexpectedDeltas']==[] and receipt['comparison']['candidateOutputSet']==receipt['comparison']['currentOutputSet'] and 'legacy parked readers remain' in receipt['comparison']['candidateScope'] and receipt['review']['status']=='pending' and 'pending' in receipt['readiness']
  for i in receipt['currentInputs']:
   b=m.m.blob(m.input_pin(i,receipt['inputCommit']),i['path']);assert sha(b)==i['sha256'] and len(b)==i['bytes'] and i['mode']==m.m.git('ls-tree',receipt['inputCommit'],'--',i['path']).decode().split()[0]
  for i in receipt['candidateInputs']:
   b=m.candidate(by[i['path']])[1].encode() if i['path'] in by else m.m.blob(receipt['inputCommit'],i['path']);assert sha(b)==i['sha256'] and len(b)==i['bytes']
  for p in receipt['proofs']:
   if p['status']=='pass':assert p['exit']==0 and sha((ROOT/p['logPath']).read_bytes())==p['logSha256']
   else:assert p['status'] in ['not-run','missing'] and p['exit'] is None and p['logPath'] is None
  assert any(p['status']=='missing' for p in receipt['proofs']) and receipt['blockedBy']
  manifest=json.loads((ROOT/receipt['candidateManifest']).read_text());assert manifest['exit']==0 and manifest['inputCommit']==receipt['inputCommit']
  imap={i['path']:i for i in receipt['candidateInputs']}
  for i in manifest['files']:
   if i['path'] in imap:assert all(i[k]==imap[i['path']][k] for k in ['sha256','bytes','mode'])
   else:assert i['path']=='test/helpers/process-tmp-root.mjs' and sha(m.m.blob(receipt['inputCommit'],i['path']))==i['sha256']
  assert set(imap)<={i['path'] for i in manifest['files']}
  assert {x['blockedReason'] for r in rs for x in m.admission.allitems(r) if x['disposition']=='parked'}<=set(receipt['blockedBy'])
 test('j-receipts','same input and honest missing proof',receipts)
 def searches():
  report=json.loads((ROOT/receipt['searchEvidence']).read_text());assert report['inputCommit']==receipt['inputCommit'] and report['roots']==['docs/platform','docs/knowledge','docs/reference','docs/tutorials']
  for q in report['queries']:
   proc=subprocess.run(q['command'],cwd=ROOT,text=True,capture_output=True);assert proc.returncode==q['exit'] and sha(proc.stdout)==q['stdoutSha256'] and len(proc.stdout.splitlines())==q['hitCount']
   expected=[]
   for line in proc.stdout.splitlines():
    f,n,t=line[len(receipt['inputCommit'])+1:].split(':',2);text=m.pinned(receipt['inputCommit'],f);decl=m.m.carriage_declaration(text,int(n));expected.append({'file':f,'line':int(n),'text':t,'sourceSha256':sha(text),'carriage':m.m.resolver.carriage(text,int(n),f),'explicitCarriageDeclaration':list(decl) if decl else None})
   assert expected==q['hits'] and sum(not h['carriage'] for h in expected)==q['liveHitCount']
  for lookup in report['aliasLookups']:
   for source in lookup['sources']:assert sha(m.m.blob(receipt['inputCommit'],source['path']))==source['sha256']
  for r in rs:
   for e in m.admission.allitems(r):
    if e['disposition']=='parked':
     w=e['searchWitness'];assert w['pin']==r['authorInputCommit'] and w['roots']==report['roots'] and w['evidenceFile']==receipt['searchEvidence'] and w['evidenceSha256']==sha((ROOT/w['evidenceFile']).read_bytes()) and w['assessment']==e['blockedReason'] and w['aliasLookups']==report['aliasLookups'];assert {q['id'] for q in w['queries']}=={q['id'] for q in report['queries']}
 test('j-search','pinned alias and all-root target search before every park',searches)

 def review():
  ix={e['file']:e for e in listing['canonicalRecords']};assert set(by)<=set(listing['sourceRecords'])
  for r in rs:
   e=ix[r['file']];assert e['recordSha256']==sha(json.dumps(r,ensure_ascii=False,separators=(',',':'))) and e['sourceSha256']==r['sourceSha256'];assert e['admittedIds']==[m.admission.idof(x) for x in m.admission.allitems(r) if x['admission']=='ADMIT'];assert e['judgmentCallIds']==[m.admission.idof(x) for x in m.admission.allitems(r) if x['admission']=='REJECT']
 test('j-review','all independent semantic obligations',review)
 shared=m.admission.check(rs);errors.extend(shared['failures']);counts.update(shared['checks'])
 return {'kind':'Real-document reader judgments; independent semantic review pending','files':len(rs),'literalReferences':len(refs),'dynamicTuples':len(dyn),'rules':dict(RULES,**shared['rules']),'checks':dict(counts),'failures':errors,'failureCount':len(errors),'headDrift':m.head_drift(rs)}
if __name__=='__main__':
 out=check();(P/'step-05-seam5-batch2-judgment-check.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps(out,ensure_ascii=False));sys.exit(bool(out['failures']))
