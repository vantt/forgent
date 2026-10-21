"""Seams 6/7 exact conservation, source/owner, parity and frozen-gate checks.
Author evidence only; semantic review and post-deletion coverage remain open.
"""
import sys
sys.dont_write_bytecode=True
import pathlib,json,hashlib,collections,importlib.util,copy,re,subprocess,functools
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3];SEAMS=['ui-spec-compiler','citation-ratchet-roots']
def read(f):return json.loads((P/f).read_text())
def rows(f):return [json.loads(l) for l in (P/f).open()]
def sha(x):return hashlib.sha256(x.encode() if isinstance(x,str) else x).hexdigest()
def module(n,f):
 s=importlib.util.spec_from_file_location(n,P/f);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
@functools.lru_cache(None)
def pinned(pin,f):return subprocess.check_output(['git','show',pin+':'+f],cwd=ROOT)
def items(r):return r['references']+r['dynamicTraces']+r.get('authorAddedReferences',[])
def ident(e):return e.get('referenceId',e.get('id'))
def load():return [r for s in SEAMS for r in rows('step-05-records/'+s+'.jsonl')]
RULES={'s67-coverage':'Every 35 census file memberships / 1313 references / 849 tuples and all origins are conserved once.','s67-pins':'Each full source/read passage, physical span, original occurrence and protected mode/hash is pinned at its own commit.','s67-operations':'Operation intervals share admission/effective outcome; rejects name concrete non-document use.','s67-render':'Generated references join actual canonical source slots or pinned source-data ancestry; no hand diff or independent park.','s67-parity':'Actual outputs/tests are not inferred from source snapshots; missing root discovery/post-deletion coverage remains explicit.','s67-frozen':'R13 checker/baseline/exception bytes remain pinned and ratchet retirement is an explicit unpatched Phase9 obligation.','s67-patches':'Only exact comment citation hunks; full inverse applies and YAML behavior/root is unchanged.','s67-review':'Review list binds every canonical record and includes author-added slots.'}
RULES['r27-noncensus-document-read']='Shared R27 guard applies to the Task0 non-census read, whose rejecting mutation is owned by seam67 probes; pilot/seam4 have no such category.'
RULES['s67-callers']='Exact balanced source scope owns every operation; module/data entries never borrow an ended function, and full multiline test declarations/assertions remain pinned.'
def check(rs=None,receipts=None,listing=None):
 rs=load() if rs is None else rs;receipts=read('step-05-seam67-parity-receipts.json')['receipts'] if receipts is None else receipts;listing=read('step-05-seam67-review-list.json') if listing is None else listing
 errors=[];counts=collections.Counter()
 def test(rule,loc,fn):
  counts[rule]+=1
  try:assert fn()
  except Exception as ex:errors.append({'rule':rule,'where':loc,'error':str(ex) or 'condition false'})
 pop=[r for r in rows('step-05-population-files.jsonl') if r['seam'] in SEAMS];pref={e['id']:e for e in rows('step-05-population-references.jsonl') if e['seam'] in SEAMS};pdyn={e['id']:e for e in rows('step-05-population-dynamic.jsonl') if e['seam'] in SEAMS};by={r['file']:r for r in rs};allrefs=[e['referenceId'] for r in rs for e in r['references']];alldyn=[e['id'] for r in rs for e in r['dynamicTraces']]
 test('s67-coverage','complete selected files',lambda:len(rs)==35 and set(by)=={e['file'] for e in pop})
 test('s67-coverage','all original references',lambda:len(allrefs)==len(set(allrefs))==1313 and set(allrefs)==set(pref))
 test('s67-coverage','all original tuples',lambda:len(alldyn)==len(set(alldyn))==849 and set(alldyn)==set(pdyn))
 callerReader=module('s67callerReader','step-05-seam67-callers.py')
 specs=read('step-05-seam67-cutover-specs.json');specby={s['file']:s for s in specs['patches']};s4=module('s67apply','step-05-seam4-check.py');a=module('s67admission','step-05-admission-rules.py')
 for r in rs:
  f=r['file'];pin=r['authorInputCommit'];raw=pinned(pin,f);body=raw.decode();ls=body.splitlines()
  def pins():
   assert sha(raw)==r['sourceSha256']==r['wholeFileReadEvidence']['sha256'] and r['wholeFileRead'] is True
   assert len(raw)==r['wholeFileReadEvidence']['bytes'] and len(ls)==r['wholeFileReadEvidence']['lines']
   assert subprocess.check_output(['git','ls-tree',pin,'--',f],cwd=ROOT).decode().split()[0]==r['sourceMode']
   for x,h in r['protectedPins'].items():assert sha(pinned(pin,x))==h
   for j in r['priorRecordRefs']:assert sha((ROOT/j['recordFile']).read_bytes())==j['recordSha256']
   assert r['review']=={'status':'pending','reviewer':None,'report':None}
   return True
  test('s67-pins',f,pins)
  for e in items(r):
   id=ident(e)
   def passage(e=e):
    if 'originalTuple' in e:
     x=pdyn[e['id']];assert x['callSite']==e['originalTuple'] and x['inventories']==e['inventoryOrigins'];c=e['currentPassage'];w=e['operationWitness'];assert c['text']=='\n'.join(ls[c['startLine']-1:c['endLine']]);assert ls[w['line']-1][w['columnStart']-1:w['columnEndExclusive']-1]==w['text'];assert e['caller']['declaration'] in body
    else:
     if e['referenceId'] in pref:
      x=pref[e['referenceId']];assert x['origins']==e['inventoryOrigins'] and x['sourceSpans']==e['originalSourceSpans'] and x['expression']==e['matchedExpression']
     for s in e['sourceSpans']:assert ls[s['line']-1][s['columnStart']-1:s['columnEndExclusive']-1]==s['text']
     c=e['passageSpan'];assert e['passage']=='\n'.join(ls[c['startLine']-1:c['endLine']])
    assert e['receiptId'] in r['receiptIds'] and e['proofCommand'] and e['parityObligation'] and e['admission'] in ['ADMIT','REJECT']
    if e['admission']=='REJECT':assert e['disposition']=='preserve' and e.get('nonDocumentUse') in a.CATEGORIES and not e.get('pathOperand')
    if e['disposition']=='parked':assert e['blockedReason'] and f in e['blockedReason'] and e['dependency'] and not e['diffHunk'] and e['timing']=='phase9'
    return True
   test('s67-pins',f+':'+id,passage)
   if 'originalTuple' in e:
    def caller_scope(e=e):
     c,w=callerReader.owning(pin,f,e['currentLine']);assert e['caller']==c and e['enclosingFunctionEvidence']==w and e['operationChain']['caller']==c
     return True
    test('s67-callers',f+':'+id,caller_scope)
   if e.get('sourceOwner'):
    def owner(e=e):
     loc=e['sourceOwner'];o=a.owner(loc,by);assert e['sourceOwnerDisposition']==o['disposition']
     assert e['disposition']==('parked' if o['disposition']=='parked' else 'render-join')
     if loc['kind']=='step5':
      if f.endswith('citation-format.md'):
       assert e['matchedExpression']==o['matchedExpression']
       assert pinned(pin,f).decode().endswith(pinned(pin,loc['file']).decode())
      else:
       w=e['sourcePassageProof'];old=pinned(w['historicalInputCommit'],w['file']).decode();current=pinned(w['currentInputCommit'],w['file']).decode();assert sha(old)==w['historicalSourceSha256'] and sha(current)==w['currentSourceSha256'];assert w['historicalText'] in old and e['matchedExpression'] not in current;assert w['renderText']==ls[w['renderLine']-1]
     else:
      j=r['inheritedSourceSlots'][loc['index']];rec=json.loads((ROOT/j['recordFile']).read_text().splitlines()[j['recordLine']-1]);assert any(z==j['edge'] for z in rec['edges']);assert sha((ROOT/j['recordFile']).read_bytes())==j['recordSha256'];w=e['sourcePassageProof'];assert w['sourceText']==pinned(pin,w['file']).decode().splitlines()[w['sourceLine']-1] and w['renderText']==ls[w['renderLine']-1];assert e['matchedExpression'] in w['sourceText'] and e['matchedExpression'] in w['renderText']
     return True
    test('s67-render',f+':'+id,owner)
  if f.startswith('test/'):test('s67-callers',f+':complete owning tests',lambda r=r: r['owningProofs']==callerReader.proofs(r['authorInputCommit'],r['file']))
  def diff():
   if r.get('generated'):assert r['diff'] is None and r['rollbackDiff'] is None
   if r['diff']:
    s=specby[f];assert all(k in s for k in read('step-05-parity-receipt-template.json')['cutoverPatch'])
    assert s['oldText']==body and s['sourceSha256']==r['sourceSha256'] and s['mode']==r['sourceMode'];after=s4.apply(f,raw,r['diff']);assert after.decode()==s['newText'] and sha(after)==r['expectedAfterSha256']==s['expectedAfterSha256'];assert s4.apply(f,after,r['rollbackDiff'])==raw
    assert s['diff']==r['diff'] and s['rollbackDiff']==r['rollbackDiff'] and s['timing']=='phase9' and s['commentOnly']
    beforeLines=[t for t in body.splitlines() if t.strip() and not t.lstrip().startswith('#')];afterLines=[t for t in after.decode().splitlines() if t.strip() and not t.lstrip().startswith('#')];assert beforeLines==afterLines
   else:assert r['expectedAfterSha256']==r['sourceSha256']
   return True
  test('s67-patches',f,diff)
 shared=a.check(rs);errors+=shared['failures'];counts.update(shared['checks'])
 task0=module('s67task0','step-05-seam67-task0-rules.py')
 test('s67-task0-transitive','direct and transitive governance reads',task0.governance)
 test('s67-task0-r22','patch specification owns current/candidate replay',task0.replay)
 def frozen():
  for f,h in specs['ratchetRetirement']['frozenGateWitness'].items():assert sha(pinned(specs['inputCommit'],f))==h
  assert specs['ratchetRetirement']['status']=='parked' and specs['ratchetRetirement']['patch'] is None and specs['compilerRootChange'] is False
  assert not any(s['file'].startswith(('scripts/','test/')) for s in specs['patches'])
  return True
 test('s67-frozen','unmodified gates/baselines and explicit retirement',frozen)
 for rc in receipts:
  def receipt(rc=rc):
   t=read('step-05-parity-receipt-template.json');assert all(k in rc for k in t['receipt']) and rc['comparison']['comparedFields']==t['seamTemplates'][rc['seam']]['requiredComparisons']
   assert rc['comparison']['currentOutputSet']==rc['comparison']['candidateOutputSet']==[] and rc['comparison']['normalization'] and 'pending' in rc['readiness'] and rc['review']['status']=='pending'
   for i in rc['currentInputs']:
    raw=pinned(i['inputCommit'],i['path']);assert sha(raw)==i['sha256'] and len(raw)==i['bytes']
   for i in rc['candidateInputs']:
    raw=specby[i['path']]['newText'].encode() if i['path'] in specby else pinned(i['inputCommit'],i['path']);assert sha(raw)==i['sha256'] and len(raw)==i['bytes']
   assert any(p['status']=='missing' for p in rc['proofs'])
   for p in rc['proofs']:
    if p['status']=='pass':assert p['exit']==0 and sha((ROOT/p['logPath']).read_bytes())==p['logSha256']
    else:assert p['exit'] is None and p['logPath'] is None
   return True
  test('s67-parity',rc['id'],receipt)
 def review():
  assert listing['reviewStatus'].startswith('pending') and len(listing['canonicalRecords'])==35
  listed={x['file']:x for x in listing['canonicalRecords']};assert set(listed)==set(by) and {x['file'] for x in listing['addedThisTurn']}==set(by)
  for f,r in by.items():
   x=listed[f];assert sha(json.dumps(r,ensure_ascii=False,separators=(',',':')))==x['recordSha256'];assert x['admittedIds']==[ident(e) for e in items(r) if e.get('admission')=='ADMIT'];assert x['judgmentCallIds']==[ident(e) for e in items(r) if e.get('admission')=='REJECT']
  assert set(listing['packingInstructions']['recordGlobs'])=={'step-05-records/'+s+'.jsonl' for s in SEAMS}
  return True
 test('s67-review','all records and supplemental source slots',review)
 drift=[]
 for r in rs:
  try:head=pinned('HEAD',r['file'])
  except subprocess.CalledProcessError:head=b''
  if sha(head)!=r['sourceSha256']:
   drift.append({'file':r['file'],'inputCommit':r['authorInputCommit'],'pinnedHash':r['sourceSha256'],'headHash':sha(head),'dependency':'Step7 final-pin assembly; historical original occurrence identities remain at their own pin','failing':False,'originalReferences':[{'id':ident(e),'sourceSpans':e.get('sourceSpans',[])} for e in r['references']]})
 return {'files':len(rs),'literalReferences':len(allrefs),'dynamicTuples':len(alldyn),'rules':RULES,'checks':dict(counts),'failureCount':len(errors),'failures':errors,'headDrift':drift,'reviewStatus':'pending independent semantic review and composed Phase9 proof'}
if __name__=='__main__':
 out=check();(P/'step-05-seam67-check-result.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps(out));sys.exit(bool(out['failureCount']))
