#!/usr/bin/env python3
"""Step 4 multi-census adapter. No consumer writes; Step 3 remains immutable.
Reuse Step 3 span/diff/form/anchor/record-text/witness primitives. Physical slot
identity is the batch join, never an invented census id or an evidence file id.
"""
import sys
sys.dont_write_bytecode=True
import importlib.util,json,pathlib,collections,re,copy,argparse,subprocess,tempfile,math,functools
P=pathlib.Path(__file__).resolve().parent
s=importlib.util.spec_from_file_location('step03',P/'step-03-check.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
PIN='dc24ce64527fbffd23e1643f35a7ddf808fd7b45'
zs=importlib.util.spec_from_file_location('sweep_lib',P/'step-04-l12-60-lib.py');z=importlib.util.module_from_spec(zs);zs.loader.exec_module(z)
_original_carriage=m.resolver.carriage
@functools.lru_cache(None)
def step4_carriage(body,line,path=''):
 # L12-54(2): the complete candidate law body is live, although metadata
 # elsewhere in this file talks about carriage. Other source detail stays so.
 if path=='docs/platform/platform-foundations.md':
  lines=body.splitlines();start=next((i for i,l in enumerate(lines,1) if l.startswith('## Luật nền platform forgent')),None)
  end=next((i for i,l in enumerate(lines,1) if start and i>start and l.startswith('## ')),len(lines)+1)
  if start and start<=line<end:return False
 return _original_carriage(body,line,path)
m.resolver.carriage=step4_carriage
ROOT=m.ROOT

@functools.lru_cache(None)
def read(n):return json.loads((P/n).read_text())
def save(n,d):(P/n).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def canon(x):return json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(',',':'))
def owner(x):return x.removeprefix('UNRESOLVED-RENDER-SOURCE:')
def slotkey(x):
 key={'file':x['file'],'edgeId':x['edgeId'],'inventoryRefs':x['inventoryRefs']}
 if x.get('supplementalOccurrenceKey'):key['supplementalOccurrenceKey']=x['supplementalOccurrenceKey']
 return canon(key)
POP=read('step-04-population.json');BATCHES=copy.deepcopy(read('step-04-batches.json')['batches']);PROV=read('step-04-source-render-provenance.json')
ROWS={slotkey(r):r for r in POP['rows'] if r['bucket']=='step4'}
# Supplemental occurrences are NOT accepted census ids. Keep the exact frozen
# tuple and an explicit pending admission blocker, never mint an edge identity.
for gap in read('step-04-batches.json')['mainMergeSupplement']['groups']:
 rows=[r for r in POP['rows'] if r['bucket']=='step4' and r['file'] in gap['files']]
 BATCHES.append({**gap,'consumerFiles':gap['files'],'edgeRefs':[{k:r[k] for k in ('file','edgeId','inventoryRefs','supplementalOccurrenceKey') if k in r} for r in rows],'mandatoryFiles':gap['files'],'pendingCensusAdmission':False})

def inventory_occurrences(edge):
 result=[]
 for ref in edge['inventoryRefs']:
  entry=next(x for x in read(ref['inventory'])['entries'] if x.get('edgeId',x.get('id'))==ref['edgeId'] and x.get('consumerPath',x.get('path'))==edge['consumerFile'])
  expression=entry.get('matchedExpression')
  if expression is None:
   occurrence=next(x for x in entry['occurrences'] if x['line']==ref['originalLine'])
   expression=occurrence['matchedExpressions']
  result.append({**ref,'matchedExpression':expression,'originalLineText':m.blob(ref['inputCommit'],edge['consumerFile']).decode().splitlines()[ref['originalLine']-1]})
 return result

def record_owner(row):
 if row['file']=='AGENTS.md' and row['edgeId'] in ['instructions-'+str(i).zfill(3) for i in range(25,37)]:return 'core/instructions/platform-laws.md'
 if row['file']=='AGENTS.md' and row['edgeId']=='instructions-037':return 'core/instructions/design-principles.md'
 return owner(row['sourceOwner'])
def isrender(row):return row['file']!=record_owner(row)
def spans(row):
 if row.get('currentSpans'):return row['currentSpans']
 b=row['binding'];txt=m.blob(PIN,row['file']).decode();ls=txt.splitlines()
 if 'line' in b:
  return [{k:b[k] for k in ('line','columnStart','columnEndExclusive','text')}]
 # Evidence preparation bound a file-row/line but not repeated columns. Keep
 # every occurrence on that original line, with the original refs unchanged.
 n=b['oldLine'];return [{'line':n,'columnStart':x.start()+1,'columnEndExclusive':x.end()+1,'text':x[0]} for x in re.finditer(re.escape(b['text']),ls[n-1])]
def references(e):return e['inventoryRefs']
def manifest_rows(batch):return [ROWS[slotkey(x)] for x in batch['edgeRefs']]
def load():return [json.loads(l) for p in sorted((P/'step-04-records').glob('step04-*.jsonl')) for l in p.read_text().splitlines()]
def provenance(file):
 out=[]
 for j in PROV['joins']:
  if j['sourcePath']!=file:continue
  k=copy.deepcopy(j);k['sourceDigest']=m.sha(m.blob(PIN,file))
  for r in k['renderFiles']:
   r['digest']=m.sha(m.blob(PIN,r['path']));r['sourceDigest']=k['sourceDigest']
   # main inserted two lines before root projections; refresh actual witnesses
   ls=m.blob(PIN,r['path']).decode().splitlines()
   for field in ('sourceHeaderWitnesses','headerWitnesses'):
    for w in r.get(field,[]):
     hits=[i for i,l in enumerate(ls,1) if l==w['text']];assert len(hits)==1
     w['line']=hits[0]
   if 'generatedBlockRange' in r:
    start=next(i for i,l in enumerate(ls,1) if '<!-- fgos:instruction-projection:start -->' in l)
    end=next(i for i,l in enumerate(ls,1) if '<!-- fgos:instruction-projection:end -->' in l)
    r['generatedBlockRange']={'startLine':start,'endLine':end}
   for e in r.get('existingEdgeJoins',[]):
    hits=[x for x in POP['rows'] if x['file']==r['path'] and x['edgeId']==e['edgeId']]
    if len(hits)==1:e['sourceSpan']=hits[0]['binding']
   if r['path'].startswith('.claude/skills/') and 'generated thin wrapper' in m.blob(PIN,r['path']).decode():
    r['generatorDoor']='npm run build:skills';r['wrapperProvenance']='L12-60(6): thin wrappers are build:skills outputs.'
  out.append(k)
 if file=='core/skills/_shared/ak-cook-worker-contract.md':
  source=m.blob(PIN,file);renders=[]
  for path in ['.agents/skills/_shared/ak-cook-worker-contract.md','plugins/fgOS/skills/_shared/ak-cook-worker-contract.md']:
   data=m.blob(PIN,path);header,body=data.split(b'\n',1)
   assert body==source and b'core/skills/_shared/ak-cook-worker-contract.md' in header
   renders.append({'path':path,'digest':m.sha(data),'sourceDigest':m.sha(source),'renderOnly':True,'headerWitness':{'line':1,'text':header.decode()},'spanCorrespondence':{'sourceLine':6,'renderLine':7,'text':'docs/specs/runner.md'},'bodyEqualsSource':True})
  out.append({'sourcePath':file,'sourceDigest':m.sha(source),'renderFiles':renders,'generatorDoor':'npm run build:skills','determinismReceipt':None,'installedPackageLimit':'Repo bytes only; no build, determinism or installed-link proof claimed','censusAdmission':'L12-60(7): first-class supplemental tuples; no Step 2 id minted'})
 return out

def selection(rs,batch):
 group=[r for r in rs if r['reviewSet']==batch['batch']];seed='A51-step04-file-v1\0'+PIN+'\0'+batch['batch']
 pop=sorted(r['file'] for r in group if r['diff']);ranks=sorted([{'file':f,'rankHash':m.sha(seed+'\0'+f)} for f in pop],key=lambda x:(x['rankHash'],x['file']))
 sample=[x['file'] for x in ranks[:math.ceil(.15*len(pop))]]
 mandatory=[]
 for r in group:
  n=len(m.blob(PIN,r['file']));why=[]
  if n>=65536:why.append('source >=65536 bytes')
  if len(r['edges'])>=40:why.append('>=40 joined slots')
  if r['file'] in [owner(f if isinstance(f,str) else f['file']) for f in batch.get('mandatoryFiles',[])]:why.append('prepared mandatory file')
  if r['file'] in ['AGENTS.md','CLAUDE.md'] or r['file'].startswith('core/instructions/'):why.append('root instruction source/projection boundary')
  if r['file'].startswith('plugins/'):why.append('L12-58(3) headerless source witness')
  if any(x['path']==r['file'] or x.get('sourcePath')==r['file'] for x in POP['historyFiles']):why.append('L12-10 source/render/companion join')
  if any('mainMergeSourceBinding' in ROWS[e['slotKey']] for e in r['edges']):why.append('L12-57 changed binding')
  if why:mandatory.append({'file':r['file'],'bytes':n,'slots':len(r['edges']),'reasons':why})
 # L12-34 unpatched stratum remains inherited, with Step 4 namespace.
 useed='A51-step04-file-v1-unpatched\0'+PIN+'\0'+batch['batch']
 empty=sorted([{'file':r['file'],'rankHash':m.sha(useed+'\0'+r['file'])} for r in group if not r['diff'] and r['edges'] and r['file'] not in {x['file'] for x in mandatory}],key=lambda x:(x['rankHash'],x['file']))
 usample=[x['file'] for x in empty[:math.ceil(.15*len(empty))]]
 selected=sorted(set(sample+usample+[x['file'] for x in mandatory]))
 return {'set':batch['batch'],'seed':seed,'population':pop,'ranks':ranks,'sample':sample,'unpatchedSeed':useed,'unpatchedRanks':empty,'unpatchedSample':usample,'mandatoryWitnesses':mandatory,'selected':selected,'reviewedFiles':[],'reworkNumerator':None,'reworkDenominator':None,'reviewStatus':'pending Lead-started independent review; >3% expands to every file in this set'}

def park_own_quote(e,before):
 passage=m.resolver.passage(before,e['sourceSpans']);context=m.adjacent_passage(before,e['sourceSpans'])
 quote=e.get('parkSourceQuote');assert quote and quote==passage and quote in context,'quoted passage absent from own source context'
 # Every human-facing blocker/dependency/witness assessment carries THIS source quote.
 marker='Own source passage: '+repr(quote)
 for text in [e['reason'],e['blockedReason'],e['dependency'],e['searchWitness']['assessment']]:assert marker in text,'own passage missing or copied'
 return True

def census_coverage(r):
 files={r['file']}|{e['consumerFile'] for e in r['edges']}|{x['path'] for j in r['sourceRenderProvenance'] for x in j['renderFiles']}
 assert isinstance(r.get('stepFiveExcluded'),list),'missing explicit Step 5 exclusion list'
 excluded={(v['inventory'],v['consumerFile'],v['edgeId']):v for v in r['stepFiveExcluded'] if v.get('inventory')}
 joined={(v['inventory'],e['consumerFile'],v['edgeId']) for e in r['edges'] for v in e['inventoryRefs']}
 for x in z.inventories():
  if x['file'] not in files:continue
  key=(x['inventory'],x['file'],x['edgeId'])
  if key in joined:continue
  assert key in excluded,'unslotted census edge: '+str(key)
  v=excluded[key]
  if x['inventory'].startswith('step-02l') and z.prose_file(x['file']):assert z.fence_at(m.blob(PIN,x['file']).decode(),v['sourceSpans'][0]['line']) or 'managed instruction projection' in v['reason'],'prose census edge may not be hidden in Step 5: '+str(key)
  assert v['reason'] and v['inputCommit']==x['inputCommit'] and v['sourceSpans']==z.relocate(x['inputCommit'],PIN,x['file'],x['spans']),'invalid exclusion witness: '+str(key)
 return True

class Checker:
 def __init__(self):
  self.tree=set(m.git('ls-tree','-r','--name-only',PIN).decode().splitlines());self.failures=[]
 def check(self,name,fn,file=None):
  try:assert fn() is not False
  except (AssertionError,KeyError,ValueError,IndexError,TypeError,StopIteration,subprocess.CalledProcessError) as e:self.failures.append({'file':file,'check':name,'detail':str(e)[:600]})
 def record(self,r):
  f=r['file'];body=m.blob(PIN,f).decode();ls=body.splitlines();changes=[];used=set()
  def ck(n,fn):self.check(n,fn,f)
  ck('schema',lambda:m.FIELDS<=r.keys() and all(m.EDGE_FIELDS<=e.keys() for e in r['edges']) and all(isinstance(r['checks'][k],dict) for k in ['coverage','anchors','relativeResolution','labelForm']))
  ck('author-pin-digest',lambda:r['authorInputCommit']==PIN and r['digest']==m.sha(body) and r['wholeFileRead']['digest']==m.sha(body) and r['wholeFileRead']['bytes']==len(body.encode()) and r['wholeFileRead']['lines']==len(ls))
  ck('inventory-edge-multiplicity',lambda:collections.Counter(r['inventoryEdgeIds'])==collections.Counter(e['edgeId'] for e in r['edges']))
  ck('render-path-diff-rejected',lambda:not r['diff'] or r['diff'].startswith('--- a/'+f+'\n+++ b/'+f+'\n'))
  ck('source-render-provenance',lambda:r['sourceRenderProvenance']==provenance(f))
  ck('no-render-file-record',lambda: not any(isrender(ROWS[e['slotKey']]) for e in r['edges'] if e['consumerFile']==f) and not body.startswith('<!-- Generated by fgOS'))
  ck('inventory-inputs',lambda:r['inventoryInputs']==[{'path':k,**POP['inputPins'][k]} for k in sorted({ref['inventory'] for e in r['edges'] for ref in e['inventoryRefs']})])
  if r['inventoryInputs']:
   ck('primary-inventory-pin',lambda:r['inventoryInputCommit']==r['inventoryInputs'][0]['commit'] and r['inventoryFileDigest']==m.sha(m.blob(r['inventoryInputCommit'],f)))
  else:
   ck('supplemental-not-census',lambda:r['inventoryInputCommit'] is None and r['inventoryFileDigest'] is None and (bool(r.get('zeroEdgeCoverage')) or (r.get('censusAdmission','').startswith('L12-60') and all(ROWS[e['slotKey']].get('populationGap') for e in r['edges']))))
  for inp in r['inventoryInputs']:
   ck('census-artifact-pin',lambda inp=inp:m.sha((P/inp['path']).read_bytes())==inp['sha256'] and (P/inp['path']).read_bytes()==m.blob(PIN,str(m.REL/inp['path'])))
  ck('census-edge-slot-or-step5',lambda: census_coverage(r))
  for e in r['edges']:
   key=e['slotKey'];row=ROWS.get(key);file=e['consumerFile'];before=m.blob(PIN,file).decode();bsp=e['sourceSpans']
   ck('slot-join',lambda e=e,row=row:row is not None and row['file']==e['consumerFile'] and slotkey({**e,'file':e['consumerFile']})==key and record_owner(row)==f and row['edgeId']==e['edgeId'] and row['inventoryRefs']==e['inventoryRefs'] and (bool(e['inventoryRefs']) or (row.get('populationGap') and e.get('supplementalOccurrenceKey')==row['supplementalOccurrenceKey'] and e['edgeId'] is None and e.get('censusAdmission','').startswith('L12-60') and row.get('censusAdmission','').startswith('L12-60'))) and e['renderOnly']==isrender(row))
   for ref in e['inventoryRefs']:
    def census_id(ref=ref,e=e):
     data=read(ref['inventory']);entries=data['entries']
     hits=[x for x in entries if x.get('edgeId',x.get('id'))==ref['edgeId'] and x.get('consumerPath',x.get('path'))==e['consumerFile']]
     assert len(hits)==1,'missing/ambiguous census id'
     x=hits[0];lines=[v['line'] for v in x.get('occurrences',x.get('physicalSpans',[]))]
     if x.get('line'):lines.append(x['line'])
     assert ref['originalLine'] in lines,'original occurrence line missing from census'
     assert x['fileDigest']==m.sha(m.blob(ref['inputCommit'],e['consumerFile'])),'original source digest mismatch'
    ck('multi-census-id',census_id)
   ck('qualified-original-occurrences',lambda e=e:e['inventoryOccurrences']==inventory_occurrences(e))
   if row and row.get('populationGap'):
    def supplemental_binding(e=e,row=row):
     tup=row['supplementalOccurrenceKey'];old=m.blob(tup['inputCommit'],tup['file']).decode().splitlines()[tup['line']-1]
     assert old[tup['columnStart']-1:tup['columnEndExclusive']-1]==tup['text']
     assert e['supplementalOccurrenceKey']==tup
    ck('supplemental-occurrence-binding',supplemental_binding)
   ck('slot-original-spans',lambda e=e,row=row:e['slotSourceSpans']==spans(row))
   ck('source-spans',lambda e=e,before=before:m.spans_text(before,e['sourceSpans'])==e['matchedExpression'] and all(s in e['sourceSpans'] for s in e['slotSourceSpans']))
   ck('disposition',lambda e=e:e['disposition'] in ['patch','preserve','parked','phase9-row-flip','render-join'] and e['reason'] and 'L12-' in e['reason'])
   ck('zero-apply-now',lambda e=e:e['timing']==('Phase 9' if (e.get('sourceDisposition') if e['renderOnly'] else e['disposition']) in ('patch','phase9-row-flip') else 'none'))
   ck('record-text-history',lambda e=e:m.factual_reason(PIN,e,re.sub(r':\d+(?:-\d+)?$','',e.get('legacyPath',''))))
   ck('dependency-categories',lambda e=e:e['blockedCategory']==e['dependencyCategory'] and (e['blockedCategory'] in m.CATEGORIES if e['disposition']=='parked' else e['blockedCategory'] is None))
   if e['renderOnly']:
    ck('render-join-not-patch',lambda e=e:e['disposition']=='render-join' and e.get('sourceDisposition') in ['patch','preserve','parked','phase9-row-flip'])
    ck('render-path-diff-rejected',lambda e=e:e['diffHunk'] is None and e.get('replacement') is None and e['target'] is None and e['anchor'] is None)
    ck('render-canonical-slot-present',lambda e=e:bool(e.get('sourceSlotKey')))
    if e.get('sourceSlotKey'):
     ck('render-disposition-join',lambda e=e:any(x['slotKey']==e['sourceSlotKey'] and not x['renderOnly'] and x['logicalReference']==e['logicalReference'] and x['disposition']==e['sourceDisposition'] for x in r['edges']))
    ck('render-source-correspondence',lambda e=e:any(e['consumerFile']==x['path'] for j in r['sourceRenderProvenance'] for x in j['renderFiles']))
    continue
   if e['disposition']=='preserve':ck('preserve-no-patch',lambda e=e:e['diffHunk'] is None and e['target'] is None)
   if e['disposition']=='phase9-row-flip':ck('whole-row',lambda e=e:e.get('rowReplacement') and e['dependency'] and e['target'] is None and e['diffHunk'] is None)
   if e['disposition']=='parked':
    ck('park-own-source-quote',lambda e=e,before=before:park_own_quote(e,before))
    ck('park-search-witness',lambda e=e,before=before:m.verify_witness(e['searchWitness'],PIN,e['legacyPath'],m.resolver.passage(before,e['sourceSpans'])))
    ck('park-no-diff',lambda e=e:e['target'] is None and e['diffHunk'] is None and e['blockedReason'] and e['dependency'])
   if e['disposition']!='patch':continue
   target=e['target'];proof=r['checks']['anchors'][key];rr=r['checks']['relativeResolution'][key];replacement=rr['replacement']
   ck('target-tree',lambda target=target:target in self.tree and not target.startswith(('docs/specs/','docs/architect/','alias:','lookup:')) and target!=f)
   ck('target-anchor',lambda e=e,proof=proof:proof['targetCommit']==PIN and proof['targetDigest']==m.sha(m.blob(PIN,e['target'])) and proof['passage'] in m.blob(PIN,e['target']).decode() and (not e['anchor'] or any(e['anchor'] in (a['anchor'],a['githubSlug']) for a in m.anchors(PIN,e['target']))))
   ck('anchor-from-evidence',lambda e=e,proof=proof:m.evidence_anchor(PIN,e,proof))
   ck('reason-anchor',lambda e=e:all(a==e['anchor'] for a in re.findall(r'#([^\s`;,).]+)',e['reason'])))
   ck('label-relative-form',lambda e=e,rr=rr,replacement=replacement:replacement==m.form(e['logicalReference'],f,e['target'],e['anchor']) and m.normalize(f,re.sub(r':\d+(?:-\d+)?$','',replacement))==e['target'] and rr['authorityStatus']=='cutover-patch-only')
   ck('description-truth',lambda e=e,key=key: set(r['checks']['coverage']['descriptionTruth'][key]['comparisons'])=={'counts','ports','defaults','verbFileLists','versions','shippedStatus'} and r['checks']['coverage']['descriptionTruth'][key]['assessment'])
   ck('hunk-binding',lambda e=e:e['diffHunk'] in [h.splitlines()[0] for h in m.hunks(r['diff'])])
   # A root file can own only unmanaged prose. Managed spans join core owners.
   if f=='AGENTS.md':ck('root-unmanaged-range',lambda e=e:all(s['line']<next(i for i,l in enumerate(ls,1) if '<!-- fgos:instruction-projection:start -->' in l) for s in e['sourceSpans']))
   changes.extend(m.replacement_changes(body,e['sourceSpans'],replacement));used.add(e['diffHunk'])
  unique=sorted(set(changes));ck('overlap',lambda:all(unique[i][1]<=unique[i+1][0] for i in range(len(unique)-1)))
  after=body
  for a,b,value in reversed(unique):after=after[:a]+value+after[b:]
  ck('exact-whole-file-diff',lambda:m.make_diff(f,body,after)==r['diff'])
  ck('orphan-hunk',lambda:used=={h.splitlines()[0] for h in m.hunks(r['diff'])})
  if r['diff']:
   with tempfile.TemporaryDirectory(prefix='step04-',dir='/tmp/fgos-work') as td:
    q=pathlib.Path(td)/f;q.parent.mkdir(parents=True,exist_ok=True);q.write_bytes(body.encode())
    run=subprocess.run(['git','-C',td,'apply','--check','-'],input=r['diff'].encode(),capture_output=True,env={**m.ENV,'GIT_CEILING_DIRECTORIES':td})
    ck('git-apply-check',lambda:run.returncode==0)
 def inherited(self,rs):
  """Adapt already-proved multi-census slots into the unchanged Step 3 core.
  Current spans are the adapter inventory, not a replacement claim about Step 2.
  Original census identities/digests are independently checked above.
  """
  old_inventory=m.INVENTORY;old_population=m.population
  m.INVENTORY=PIN;m.population=lambda:{}
  try:
   core=m.Checker(PIN)
   for r in rs:
    source=[e for e in r['edges'] if not e['renderOnly']]
    v={k:copy.deepcopy(r[k]) for k in m.FIELDS}
    v['inventoryInputCommit']=PIN;v['inventoryFileDigest']=r['digest'];v['inventoryEdgeIds']=[e['slotKey'] for e in source]
    v['edges']=[{k:copy.deepcopy(e[k]) for k in m.EDGE_FIELDS|{'searchWitness','targetFacts','unitId','unitDispositionReason','historyRegion'} if k in e} for e in source]
    for x,e in zip(v['edges'],source):x['edgeId']=e['slotKey']
    core.entries={e['slotKey']:{'edgeId':e['slotKey'],'consumerPath':r['file'],'physicalSpans':e['sourceSpans'],'matchedExpression':e['matchedExpression'],'normalizedReference':e['legacyPath'],'locatorTokens':[]} for e in source}
    core.files={r['file']:{'sha256':r['digest'],'edgeIds':v['inventoryEdgeIds']}}
    failures=core.check_record(v,apply=False)
    for failure in failures:
     if failure['check']=='projection-source' and r['file']=='AGENTS.md':
      # Step 3 forbids all root-file diffs. Step 4 explicitly owns unmanaged
      # root prose; the stricter line-boundary predicate above replaces that
      # class-3-only file gate. Managed root spans still cannot get a diff.
      continue
     self.failures.append({**failure,'check':'inherited-step3/'+failure['check']})
  finally:m.INVENTORY=old_inventory;m.population=old_population
 def all(self,rs):
  ids=sorted(set(r['reviewSet'] for r in rs));expected=[x for b in BATCHES if b['batch'] in ids for x in b['edgeRefs']]
  self.check('one-to-one-batch-slot-coverage',lambda:collections.Counter(slotkey(x) for x in expected)==collections.Counter(e['slotKey'] for r in rs for e in r['edges']))
  self.check('one-owner-record-per-batch',lambda:collections.Counter((b['batch'],f) for b in BATCHES if b['batch'] in ids for f in set(record_owner(row) for row in manifest_rows(b))|set(b.get('zeroEdgeOwners',[])))==collections.Counter((r['reviewSet'],r['file']) for r in rs))
  self.check('all-33-batches-present',lambda: ids==sorted(b['batch'] for b in BATCHES))
  global PIN
  original_pin=PIN
  try:
   groups=collections.defaultdict(list)
   for r in rs:groups[r['authorInputCommit']].append(r)
   for pin,group in groups.items():
    assert re.fullmatch(r'[0-9a-f]{40}',pin)
    PIN=pin;self.tree=set(m.git('ls-tree','-r','--name-only',PIN).decode().splitlines())
    for r in group:self.record(r)
    self.inherited(group)
  finally:PIN=original_pin
  return {'authorInputCommit':PIN,'recordAuthorPins':dict(collections.Counter(r['authorInputCommit'] for r in rs)),'checkedBatches':ids,'files':len(rs),'consumerFiles':len({e['consumerFile'] for r in rs for e in r['edges']}),'edges':sum(len(r['edges']) for r in rs),'dispositions':dict(collections.Counter(e['disposition'] for r in rs for e in r['edges'])),'failureCount':len(self.failures),'failures':self.failures,'openLeadRulingEdges':[{'set':r['reviewSet'],'file':r['file'],'edgeId':e['edgeId'],'slotKey':e['slotKey']} for r in rs for e in r['edges'] if e['blockedCategory']=='lead-ruling'],'checkerSha256':m.sha(pathlib.Path(__file__).read_bytes()),'reusedStep3Sha256':m.sha((P/'step-03-check.py').read_bytes())}
if __name__=='__main__':
 out=Checker().all(load());out['recordFileHashes']={f.name:m.sha(f.read_bytes()) for f in sorted((P/'step-04-records').glob('*.jsonl'))};out['dependencyHashes']={n:m.sha((P/n).read_bytes()) for n in ['step-03-check.py','step-03-resolve.py','step-04-l12-60-lib.py','step-04-population.json','step-04-batches.json','step-04-source-render-provenance.json']};save('step-04-wave2-check-result.json',out);save('step-04-l12-60-check-result.json',out);print(json.dumps(out,ensure_ascii=False));raise SystemExit(bool(out['failureCount']))
