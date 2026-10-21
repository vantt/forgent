"""R26 exact shared-decision joins and L12-83 review/patch evidence.
A shared decision is valid only for an enumerated, pin-bound operation.
"""
import sys
sys.dont_write_bytecode=True
import pathlib,json,functools,importlib.util,hashlib,subprocess,collections,re,copy
P=pathlib.Path(__file__).resolve().parent;ROOT=P.parents[3]
def read(f):return json.loads((P/f).read_text())
def sha(x):return hashlib.sha256(x.encode() if isinstance(x,str) else x).hexdigest()
def items(r):return r['references']+r['dynamicTraces']+r.get('authorAddedReferences',[])
def ident(e):return e.get('referenceId',e.get('id'))
@functools.lru_cache(None)
def units():return {u['path']:u for u in read('step-05-proposed-move-read-units.json')['units']}
def joined(r,e,unit_map=None):
 path=e.get('r26Unit');u=(units() if unit_map is None else unit_map).get(path,{})
 return bool(path and e.get('disposition')=='parked' and e.get('dependency')==u.get('decisionDependency') and any(x['file']==r['file'] and x['id']==ident(e) and x['inputCommit']==r['authorInputCommit'] and x['sourceSha256']==r['sourceSha256'] for x in u.get('readers',[])))
@functools.lru_cache(None)
def pinned(pin,file):return subprocess.check_output(['git','show',pin+':'+file],cwd=ROOT,text=True)
def live_holder_joined(r,e):
 try:
  w=e['holderPassageProof'];old=pinned(r['authorInputCommit'],e['matchedExpression']);new=pinned(r['authorInputCommit'],e['target'])
  assert w['sourceSha256']==sha(old) and w['targetSha256']==sha(new) and 'Canonical: No' not in new
  return e['disposition']=='patch' and ((w['byteIdentical'] and old==new) or len(w['sharedSubstantiveLines'])>=3 and all(t in old and t in new for t in w['sharedSubstantiveLines']))
 except (KeyError,AssertionError):return False
def current_hash(r):return sha(json.dumps(r,ensure_ascii=False,separators=(',',':')))
def before_current(file,current):
 rows=read('step-05-seam5-b6-review-closure.json')['changedRecords'];hit=next((e for e in rows if e['file']==file),None)
 return hit['beforeSha256'] if hit else current
@functools.lru_cache(None)
def patch_spec(file):return next((s for s in read('step-05-seam5-b6-review-cutover-specs.json')['patches'] if s['file']==file),None)
def module(n,f):
 s=importlib.util.spec_from_file_location(n,P/f);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m

def assert_patch(r,receipt,body):
 spec=patch_spec(r['file']);assert spec
 m=module('r26pilot','step-05-check.py');s4=module('r26apply','step-05-seam4-check.py')
 assert spec['inputCommit']==r['authorInputCommit'] and spec['oldText']==body and spec['sourceSha256']==r['sourceSha256']==sha(body) and spec['mode']==r['sourceMode']
 assert spec['diff']==r['diff']==m.m.make_diff(r['file'],body,spec['newText'])
 after=s4.apply(r['file'],body.encode(),r['diff']).decode();assert after==spec['newText'] and sha(after)==r['expectedAfterSha256']==spec['expectedAfterSha256']
 assert spec['rollbackDiff']==r['rollbackDiff']==m.m.make_diff(r['file'],after,body) and s4.apply(r['file'],after.encode(),r['rollbackDiff'])==body.encode()
 candidate=body
 for old,new in spec['substitutions']:
  assert old in candidate;candidate=candidate.replace(old,new)
 assert candidate==after
 assert spec['file'] in spec['coCutPaths'] and spec['coCutPaths']==r['coCutPaths']
 assert ('CHANGELOG.md' not in spec['coCutPaths']) if spec['commentOnly'] else ('CHANGELOG.md' in spec['coCutPaths'])
 if spec['commentOnly']:
  substantive=lambda x:[l for l in x.splitlines() if l.strip() and not l.lstrip().startswith(('//','/*','*'))]
  assert substantive(body)==substantive(after),'Comment-only patch changes executable source'
 for g in spec['coCutTestGreps']:
  assert g==m.test_grep(r['authorInputCommit'],g['oldPointer']) and g in receipt['coCutTestGreps'];assert all(h['file'] in r['coCutPaths'] for h in g['matches'])
 assert spec in receipt['cutoverSpecifications']
 if r['file'].startswith('test/'):assert receipt['comparison']['intentionalDeltas']==spec['intentionalBehaviorDeltas']
 for i in receipt['candidateInputs']:
  raw=after if i['path']==r['file'] else m.pinned(r['authorInputCommit'],i['path']);assert sha(raw)==i['sha256'] and len(raw.encode())==i['bytes']
 if receipt.get('deferredReplay'):
  assert module('r26deferred','step-05-seam5-batch7-deferred.py').validate(spec,r,receipt,body)
 else:
  assert len(receipt['proofs'])==2 and {p.get('side') for p in receipt['proofs']}=={'current','candidate'}
  for p in receipt['proofs']:assert p['status']=='pass' and p['exit']==0 and sha((ROOT/p['logPath']).read_bytes())==p['logSha256']
  assert receipt['comparison']['currentOutputSet']==receipt['comparison']['candidateOutputSet'] and receipt['comparison']['currentOutputSet']
 return True

def review_delta(ix):
 closure=read('step-05-seam5-b6-review-closure.json');changed=closure['changedRecords'];disp={e['file'] for e in changed if e['dispositionChanged'] and e['recordFile'].split('/')[-1].startswith('tests-')};labels={e['file'] for e in changed if not e['dispositionChanged'] and e['recordFile'].split('/')[-1].startswith('tests-')}
 added=read('step-05-seam5-batch7-selection.json')['files']
 assert ix['reviewClosureRuling']=='L12-83' and [e['file'] for e in ix['addedThisTurn']]==added
 assert {e['file'] for e in ix['changedThisTurn']['dispositionChanged']}==disp and {e['file'] for e in ix['changedThisTurn']['labelOnly']}==labels
 assert set(ix['reviewThisTurn'])==set(added)|disp
 return True

def check(rs=None,manifest=None):
 if rs is None:rs=[json.loads(l) for f in sorted((P/'step-05-records').glob('*.jsonl')) for l in f.open()]
 manifest=read('step-05-proposed-move-read-units.json') if manifest is None else manifest;by={r['file']:r for r in rs};ids={(r['file'],ident(e)):(r,e) for r in rs for e in items(r)};fail=[];counts=collections.Counter()
 def test(rule,where,fn):
  counts[rule]+=1
  try:assert fn()
  except Exception as ex:fail.append({'rule':rule,'where':where,'error':str(ex) or 'condition false'})
 for u in manifest['units']:
  def members(u=u):
   assert u['decisionDependency']=='Phase 9 retention-or-move decision for '+u['path'];assert u['readerCount']==len(u['readers']) and u['readerRecordIds']==[e['id'] for e in u['readers']]
   assert len({(e['file'],e['id']) for e in u['readers']})==len(u['readers'])
   for loc in u['readers']:
    r,e=ids[loc['file'],loc['id']];assert joined(r,e,{x['path']:x for x in manifest['units']}) and e['dependency']==u['decisionDependency'] and e['r26Unit']==u['path']
    assert loc['inputCommit']==r['authorInputCommit'] and loc['sourceSha256']==r['sourceSha256']
    text=pinned(r['authorInputCommit'],r['file']);assert sha(text)==r['sourceSha256'] and text.splitlines()[loc['line']-1]==loc['sourceLine']
    assert e['blockedReason'] and r['file'] in e['blockedReason'] and 'retained' not in str(e.get('resolverWitness',{})).lower()
   assert u['coCutPaths']==sorted({loc['file'] for loc in u['readers']+u['coChanges']})
   for loc in u['coChanges']:assert (loc['file'],loc['id']) in ids and loc['file'] in u['coCutPaths']
   return True
  test('r26-unit',u['path'],members)
 # Independently discover direct real path operations so clearing the R26
 # marker plus its manifest member cannot silently turn a reader into preserve.
 unitmap={u['path']:u for u in manifest['units']}
 for r in rs:
  if r.get('generated') or '; ' in r['file']:continue
  for e in items(r):
   if e.get('admission')!='ADMIT':continue
   x=e.get('pathOperand') or e.get('matchedExpression') or e.get('originalTuple',[None]*5)[4] or ''
   x=re.sub(r"['\"]\s*,\s*['\"]",'/',x)
   hits=[path for path in unitmap if path in x]
   if not hits:continue
   n=e.get('currentLine') or (e.get('sourceSpans') or [{}])[0].get('line',0)
   if not n:continue
   src=pinned(r['authorInputCommit'],r['file']).splitlines()[n-1]
   if src.lstrip().startswith(('//','/*','*','#')) or re.match(r'\s*(?:test|it)\(',src) or 'fixture' in e.get('role','') or 'synthetic' in e.get('role',''):continue
   if re.search(r'path\.(?:join|resolve)\(|\.root\.join\(|root\.join\(',src) and e['disposition']!='patch':
    test('r26-real-read',r['file']+':'+str(ident(e)),lambda r=r,e=e:joined(r,e,unitmap))
 # The sweep must never omit a declared joined park from its unit.
 for r in rs:
  for e in items(r):
   if e.get('r26Unit'):test('r26-membership',r['file']+':'+str(ident(e)),lambda r=r,e=e:joined(r,e,{x['path']:x for x in manifest['units']}))
 def population():
  move=read('step-05-cutover-move-set.json');expected={x['oldPath'] for x in move['paths'] if not x['oldPath'].startswith(('docs/specs/','docs/architect/','docs/decisions/00')) and (any('phase-06/' in z['source'] for z in x['moves']) or x['oldPath']=='docs/decisions/index.md')}|{'docs/enduser-docs-index.json'}
  assert {u['path'] for u in manifest['units']}==expected and manifest['unitCount']==len(expected)
  assert manifest['readerCount']==sum(u['readerCount'] for u in manifest['units']) and manifest['unitsWithReaders']==sum(bool(u['readers']) for u in manifest['units'])
  return True
 test('r26-coverage','all proposed-move paths plus coupled enduser manifest',population)
 return {'rules':{'r26-unit':'Proposed move readers form one pin-bound unit and park on the exact retention-or-move decision.','r26-membership':'Every R26 park is explicitly listed once.','r26-coverage':'Every nondeleted Phase 6 proposed path stays visible, including zero-reader paths.'},'checks':dict(counts),'failureCount':len(fail),'failures':fail}
