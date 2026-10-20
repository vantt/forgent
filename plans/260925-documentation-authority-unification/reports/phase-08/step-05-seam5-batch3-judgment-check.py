"""RUL104 real-reader record check. No source/candidate patch is authorized."""
import sys
sys.dont_write_bytecode=True
import pathlib,importlib.util,json,re,subprocess,collections
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
s=importlib.util.spec_from_file_location('j',P/'step-05-seam5-judgment-check.py');j=importlib.util.module_from_spec(s);s.loader.exec_module(j)
m=j.m;sha=j.sha
RULES={'j3-coverage':'Original identities, complete whole-file lexical coverage and exact consuming reads.','j3-pins':'Immutable mode/hash/bytes and exact passage/operation spans.','j3-search':'Pinned four-root exact-law searches and alias/registry lineage; unrelated runner RUL104 cannot replace foundations law.','j3-receipt':'Pinned current proof and unchanged partial candidate; exact-law/post-retirement parity is still missing.','j3-review':'Both reader admissions and every judgment reject need independent windows.'}
def load():return m.rows('step-05-records/tests-real-file-batch3.jsonl')
def check(rs=None,receipt=None,listing=None,search=None):
 rs=load() if rs is None else rs;receipt=m.read('step-05-seam5-batch3-judgment-receipt.json') if receipt is None else receipt;listing=m.read('step-05-seam5-review-list.json') if listing is None else listing;search=m.read('step-05-seam5-batch3-search-evidence.json') if search is None else search;errors=[];counts=collections.Counter()
 def test(rule,f,fn):
  counts[rule]+=1
  try:ret=fn();assert ret is None or bool(ret)
  except Exception as ex:errors.append({'rule':rule,'where':f,'error':str(ex) or 'condition false'})
 test('j3-coverage','one closed reader',lambda:len(rs)==1 and rs[0]['file']=='test/docs/rul104-anchor-phrase.test.mjs')
 for r in rs:
  f=r['file'];pin=r['authorInputCommit'];body=m.pinned(pin,f);ls=body.splitlines();orig=[x for x in m.rows('step-05-population-dynamic.jsonl') if x['file']==f]
  def pins():
   assert sha(body)==r['sourceSha256']==r['expectedAfterSha256'] and r['sourceMode']==m.m.git('ls-tree',pin,'--',f).decode().split()[0]
   assert r['wholeFileRead'] and r['wholeFileReadEvidence']['bytes']==len(body.encode()) and r['wholeFileReadEvidence']['lines']==len(ls) and r['wholeFileReadEvidence']['sha256']==sha(body)
   assert r['diff'] is None and r['rollbackDiff'] is None and not r['generated'] and r['review']['status']=='pending'
   for path,digest in r['protectedPins'].items():assert sha(m.m.blob(pin,path))==digest
  test('j3-pins',f,pins)
  def coverage():
   assert r['references']==[] and len(r['dynamicTraces'])==len(orig)==6
   for e,o in zip(r['dynamicTraces'],orig):
    assert e['id']==o['id'] and e['originalTuple']==o['callSite'] and e['inventoryOrigins']==o['inventories']
   for n,line in enumerate(ls,1):
    for hit in re.finditer(r'docs/[^\s`"\',;]*',line):assert any(w['line']==n and w['columnStart']==hit.start()+1 and w['text']==hit[0] for e in r['authorAddedReferences'] for w in e['sourceSpans'])
   for e in r['dynamicTraces']:
    p=e['currentPassage'];assert p['text']=='\n'.join(ls[p['startLine']-1:p['endLine']]);assert e['caller']=={'line':p['startLine'],'declaration':ls[p['startLine']-1]}
    w=e['operationWitness'];assert ls[w['line']-1][w['columnStart']-1:w['columnEndExclusive']-1]==w['text']==e['originalTuple'][4]
    if e['admission']=='ADMIT':
     assert e['consumingOperations'] and e['resolverWitness']['readOnly'] and not e['aliasWriteCheck']['destinationIsAlias']
     for use in e['consumingOperations']:assert ls[use['line']-1]==use['text'] and 'fs.readFileSync(' in use['text']
   assert [(e['admission'],e['disposition']) for e in r['dynamicTraces']]==[('REJECT','preserve'),('REJECT','preserve'),('ADMIT','preserve'),('ADMIT','parked'),('REJECT','preserve'),('REJECT','preserve')]
   assert r['dynamicTraces'][2]['consumingOperations'][0]['line']==21 and r['dynamicTraces'][3]['consumingOperations'][0]['line']==26
   assert [e['id'] for e in r['parked']]==['dynamic-018749'] and r['parked'][0]['blockedReason']==r['dynamicTraces'][3]['blockedReason']
  test('j3-coverage',f,coverage)
  def searches():
   assert search['inputCommit']==pin and search['roots']==['docs/platform','docs/knowledge','docs/reference','docs/tutorials']
   for q in search['queries']:
    assert q['command']==['git','grep','-n','-F',q['query'],pin,'--',*search['roots']]
    pr=subprocess.run(q['command'],cwd=ROOT,text=True,capture_output=True);assert pr.returncode==q['exit'] and pr.stdout.splitlines()==q['matches'] and sha(pr.stdout)==q['stdoutSha256']
   claim=search['oldClaim'];assert sha(m.m.blob(pin,claim['path']))==claim['sha256'];law=m.pinned(pin,claim['fixturePath']).strip();assert re.findall(claim['pattern'],m.pinned(pin,claim['path']),re.M)==claim['matches']==[law] and sha(m.m.blob(pin,claim['fixturePath']))==claim['fixtureSha256']
   assert not search['queries'][1]['matches'] and not search['queries'][2]['matches']
   for q in search['aliasLookups']:
    raw=m.pinned(pin,q['path']);assert sha(raw)==q['sha256'];a=json.loads(raw)
    expected=[e for e in a['entries'] if e['fromPath'].split('#')[0]==claim['path']] if 'entries' in a else [e for e in a['docs'] if claim['path'] in e.get('aliases',[]) or e.get('currentPath')==claim['path']]
    assert expected==q['matches']
   e=r['dynamicTraces'][3];w=e['searchWitness'];assert w['assessment']==e['blockedReason'] and w['evidenceSha256']==sha((ROOT/w['evidenceFile']).read_bytes()) and w['pin']==pin and w['roots']==search['roots']
  test('j3-search',f,searches)
  def receipts():
   assert receipt['id']==r['receiptIds'][0] and all(e['receiptId']==receipt['id'] for e in m.admission.allitems(r)) and receipt['cutoverSpecifications']==[] and 'pending' in receipt['readiness']
   assert all(k in receipt for k in m.read('step-05-parity-receipt-template.json')['receipt'])
   assert receipt['comparison']['comparedFields']==m.read('step-05-parity-receipt-template.json')['seamTemplates']['real-file-tests-goldens']['requiredComparisons']
   assert receipt['currentInputs']==receipt['candidateInputs'] and receipt['candidateManifest']['files']==receipt['currentInputs']
   for i in receipt['currentInputs']:
    raw=m.m.blob(pin,i['path']);assert sha(raw)==i['sha256'] and len(raw)==i['bytes'] and m.m.git('ls-tree',pin,'--',i['path']).decode().split()[0]==i['mode']
   assert receipt['comparison']['candidateOutputSet']==[] and receipt['comparison']['unexpectedDeltas']==[] and receipt['blockedBy']==[r['dynamicTraces'][3]['blockedReason']]
   for proof in receipt['proofs']:
    if proof['status']=='pass':assert proof['exit']==0 and sha((ROOT/proof['logPath']).read_bytes())==proof['logSha256']
    else:assert proof['status']=='missing' and proof['exit'] is None
   assert receipt['candidateManifest']['exit']==0 and any(p['status']=='missing' for p in receipt['proofs'])
  test('j3-receipt',f,receipts)
  def review():
   ix=next(e for e in listing['canonicalRecords'] if e['file']==f);assert f in listing['sourceRecords'] and ix['recordSha256']==sha(json.dumps(r,ensure_ascii=False,separators=(',',':'))) and ix['sourceSha256']==r['sourceSha256']
   assert ix['admittedIds']==[m.admission.idof(e) for e in m.admission.allitems(r) if e['admission']=='ADMIT'] and ix['judgmentCallIds']==[m.admission.idof(e) for e in m.admission.allitems(r) if e['admission']=='REJECT']
  test('j3-review',f,review)
 shared=m.admission.check(rs);errors.extend(shared['failures']);counts.update(shared['checks'])
 return {'kind':'RUL104 real-file reader judgments; independent review and law promotion pending','files':len(rs),'literalReferences':0,'dynamicTuples':sum(len(r['dynamicTraces']) for r in rs),'rules':dict(RULES,**shared['rules']),'checks':dict(counts),'failureCount':len(errors),'failures':errors,'headDrift':m.head_drift(rs)}
if __name__=='__main__':
 out=check();(P/'step-05-seam5-batch3-judgment-check.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps(out));sys.exit(bool(out['failures']))
